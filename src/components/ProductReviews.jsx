import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useAlert } from '../contexts/AlertContext';
import { supabase } from '../config/supabase';

const ProductReviews = ({ productId }) => {
  const { user, profile } = useAuth();
  const alert = useAlert();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [userReview, setUserReview] = useState(null);
  const [canReview, setCanReview] = useState(false);
  const [formData, setFormData] = useState({
    rating: 5,
    title: '',
    comment: ''
  });

  useEffect(() => {
    fetchReviews();
    if (user) {
      checkCanReview();
    }
  }, [productId, user]);

  const fetchReviews = async () => {
    try {
      const { data, error } = await supabase
        .from('reviews')
        .select(`
          *,
          users (
            full_name
          )
        `)
        .eq('product_id', productId)
        .eq('is_approved', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setReviews(data || []);

      // Check if user already reviewed
      if (user) {
        const existing = data?.find(r => r.user_id === user.id);
        setUserReview(existing || null);
      }
    } catch (err) {
      console.error('Error fetching reviews:', err);
    } finally {
      setLoading(false);
    }
  };

  const checkCanReview = async () => {
    try {
      // Check if user has purchased this product
      const { data: orders, error } = await supabase
        .from('orders')
        .select(`
          id,
          payment_status,
          order_items!inner (
            product_id
          )
        `)
        .eq('user_id', user.id)
        .eq('payment_status', 'paid')
        .eq('order_items.product_id', productId);

      if (error) throw error;
      setCanReview(orders && orders.length > 0);
    } catch (err) {
      console.error('Error checking purchase:', err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) return;

    setSubmitting(true);
    try {
      const reviewData = {
        product_id: productId,
        user_id: user.id,
        rating: formData.rating,
        title: formData.title,
        comment: formData.comment,
        is_verified_purchase: canReview
      };

      if (userReview) {
        // Update existing review
        const { error } = await supabase
          .from('reviews')
          .update(reviewData)
          .eq('id', userReview.id);

        if (error) throw error;
      } else {
        // Create new review
        const { error } = await supabase
          .from('reviews')
          .insert(reviewData);

        if (error) throw error;
      }

      setShowForm(false);
      setFormData({ rating: 5, title: '', comment: '' });
      fetchReviews();
    } catch (err) {
      console.error('Error submitting review:', err);
      alert.error('Failed to submit review. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!userReview) return;

    const confirmed = await alert.confirm(
      'This action cannot be undone.',
      {
        title: 'Delete Review',
        confirmText: 'Yes, Delete',
        cancelText: 'Cancel',
        type: 'error'
      }
    );

    if (!confirmed) return;

    try {
      const { error } = await supabase
        .from('reviews')
        .delete()
        .eq('id', userReview.id);

      if (error) throw error;
      setUserReview(null);
      fetchReviews();
    } catch (err) {
      console.error('Error deleting review:', err);
    }
  };

  const StarRating = ({ rating, interactive = false, onChange }) => {
    const [hover, setHover] = useState(0);

    return (
      <div className="flex">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type={interactive ? 'button' : undefined}
            onClick={() => interactive && onChange && onChange(star)}
            onMouseEnter={() => interactive && setHover(star)}
            onMouseLeave={() => interactive && setHover(0)}
            className={`${interactive ? 'cursor-pointer' : 'cursor-default'} text-2xl`}
            disabled={!interactive}
          >
            <span className={`${
              star <= (hover || rating) ? 'text-yellow-400' : 'text-gray-300'
            }`}>
              ★
            </span>
          </button>
        ))}
      </div>
    );
  };

  const averageRating = reviews.length > 0
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : 0;

  const ratingCounts = [5, 4, 3, 2, 1].map(rating => ({
    rating,
    count: reviews.filter(r => r.rating === rating).length
  }));

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-48 mb-4"></div>
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-24 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="mt-12">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Customer Reviews</h2>

      {/* Rating Summary */}
      <div className="bg-gray-50 rounded-lg p-6 mb-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div className="flex items-center mb-4 md:mb-0">
            <div className="text-5xl font-bold text-gray-900 mr-4">{averageRating}</div>
            <div>
              <StarRating rating={Math.round(averageRating)} />
              <p className="text-gray-600 mt-1">{reviews.length} review{reviews.length !== 1 ? 's' : ''}</p>
            </div>
          </div>

          {/* Rating Distribution */}
          <div className="flex-1 max-w-md ml-0 md:ml-8">
            {ratingCounts.map(({ rating, count }) => (
              <div key={rating} className="flex items-center text-sm mb-1">
                <span className="w-8">{rating}★</span>
                <div className="flex-1 h-2 bg-gray-200 rounded-full mx-2">
                  <div
                    className="h-2 bg-yellow-400 rounded-full"
                    style={{ width: `${reviews.length > 0 ? (count / reviews.length) * 100 : 0}%` }}
                  ></div>
                </div>
                <span className="w-8 text-gray-600">{count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Write Review Button */}
        {user && !showForm && (
          <div className="mt-6 pt-6 border-t border-gray-200">
            {userReview ? (
              <div className="flex items-center justify-between">
                <span className="text-gray-600">You have already reviewed this product</span>
                <div className="flex space-x-3">
                  <button
                    onClick={() => {
                      setFormData({
                        rating: userReview.rating,
                        title: userReview.title || '',
                        comment: userReview.comment || ''
                      });
                      setShowForm(true);
                    }}
                    className="text-indigo-600 hover:text-indigo-800"
                  >
                    Edit Review
                  </button>
                  <button
                    onClick={handleDelete}
                    className="text-red-600 hover:text-red-800"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setShowForm(true)}
                className="bg-indigo-600 text-white px-6 py-2 rounded-md hover:bg-indigo-700"
              >
                Write a Review
              </button>
            )}
          </div>
        )}

        {!user && (
          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-gray-600">
              <a href="/login" className="text-indigo-600 hover:underline">Sign in</a> to write a review
            </p>
          </div>
        )}
      </div>

      {/* Review Form */}
      {showForm && (
        <div className="bg-white border border-gray-200 rounded-lg p-6 mb-8">
          <h3 className="text-lg font-semibold mb-4">
            {userReview ? 'Edit Your Review' : 'Write a Review'}
          </h3>
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Rating</label>
              <StarRating
                rating={formData.rating}
                interactive={true}
                onChange={(rating) => setFormData(prev => ({ ...prev, rating }))}
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Title (optional)</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Summarize your experience"
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Review</label>
              <textarea
                value={formData.comment}
                onChange={(e) => setFormData(prev => ({ ...prev, comment: e.target.value }))}
                placeholder="Share your experience with this product..."
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                required
              ></textarea>
            </div>

            {canReview && (
              <p className="text-sm text-green-600 mb-4">
                ✓ Verified Purchase - Your review will be marked as verified
              </p>
            )}

            <div className="flex space-x-4">
              <button
                type="submit"
                disabled={submitting}
                className="bg-indigo-600 text-white px-6 py-2 rounded-md hover:bg-indigo-700 disabled:opacity-50"
              >
                {submitting ? 'Submitting...' : userReview ? 'Update Review' : 'Submit Review'}
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-6 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Reviews List */}
      <div className="space-y-6">
        {reviews.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No reviews yet. Be the first to review this product!</p>
        ) : (
          reviews.map((review) => (
            <div key={review.id} className="border-b border-gray-200 pb-6">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center">
                    <StarRating rating={review.rating} />
                    {review.is_verified_purchase && (
                      <span className="ml-3 text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                        Verified Purchase
                      </span>
                    )}
                  </div>
                  {review.title && (
                    <h4 className="font-semibold text-gray-900 mt-2">{review.title}</h4>
                  )}
                </div>
                <span className="text-sm text-gray-500">
                  {new Date(review.created_at).toLocaleDateString()}
                </span>
              </div>

              <p className="text-gray-600 mt-2">{review.comment}</p>

              <div className="mt-3 text-sm text-gray-500">
                By {review.users?.full_name || 'Anonymous'}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ProductReviews;
