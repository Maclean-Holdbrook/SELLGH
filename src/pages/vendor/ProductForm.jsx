import { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useAlert } from '../../contexts/AlertContext';
import { supabase } from '../../config/supabase';
import VendorNavigation from '../../components/VendorNavigation';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const ProductForm = () => {
  const { id } = useParams();
  const isEdit = !!id;
  const navigate = useNavigate();
  const { user, session } = useAuth();

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    compare_at_price: '',
    stock_quantity: '',
    sku: '',
    category_id: '',
    is_featured: false,
  });
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [checkingVendor, setCheckingVendor] = useState(true);
  const [vendorId, setVendorId] = useState(null);
  const alert = useAlert();

  // Image upload state
  const [images, setImages] = useState([]);
  const [existingImages, setExistingImages] = useState([]);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [imagesToDelete, setImagesToDelete] = useState([]);

  useEffect(() => {
    fetchCategories();
    fetchVendorId();
    if (isEdit) {
      fetchProduct();
    }
  }, [id]);

  const fetchVendorId = async () => {
    setCheckingVendor(true);
    try {
      const { data: vendor } = await supabase
        .from('vendors')
        .select('id, is_verified')
        .eq('user_id', user.id)
        .single();

      if (!vendor) {
        alert.error('Vendor profile not found');
        setCheckingVendor(false);
        return;
      }

      if (!vendor.is_verified) {
        alert.error('Your vendor account must be verified before adding products');
        setCheckingVendor(false);
        return;
      }

      setVendorId(vendor.id);
    } catch (err) {
      console.error('Error fetching vendor:', err);
      alert.error('Failed to load vendor profile');
    } finally {
      setCheckingVendor(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await fetch(`${API_URL}/products/categories`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        }
      });
      if (!response.ok) throw new Error('Failed to fetch categories');
      const data = await response.json();
      setCategories(data.categories || []);
    } catch (err) {
      console.error('Error fetching categories:', err);
    }
  };

  const fetchProduct = async () => {
    try {
      const { data, error: productError } = await supabase
        .from('products')
        .select(`
          *,
          images:product_images(*)
        `)
        .eq('id', id)
        .single();

      if (productError) throw productError;

      setFormData({
        name: data.name || '',
        description: data.description || '',
        price: data.price || '',
        compare_at_price: data.compare_at_price || '',
        stock_quantity: data.stock_quantity || '',
        sku: data.sku || '',
        category_id: data.category_id || '',
        is_featured: data.is_featured || false,
      });

      // Set existing images
      if (data.images && data.images.length > 0) {
        setExistingImages(data.images);
      }
    } catch (err) {
      console.error('Error fetching product:', err);
      alert.error('Failed to load product');
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value,
    });
  };

  // Handle image file selection
  const handleImageSelect = (e) => {
    const files = Array.from(e.target.files);
    const maxImages = 5;
    const currentTotal = images.length + existingImages.length - imagesToDelete.length;

    if (currentTotal + files.length > maxImages) {
      alert.error(`You can only upload up to ${maxImages} images per product`);
      return;
    }

    // Validate file types and sizes
    const validFiles = files.filter(file => {
      const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
      const maxSize = 5 * 1024 * 1024; // 5MB

      if (!validTypes.includes(file.type)) {
        alert.error('Only JPEG, PNG, GIF, and WebP images are allowed');
        return false;
      }

      if (file.size > maxSize) {
        alert.error('Each image must be less than 5MB');
        return false;
      }

      return true;
    });

    // Create preview URLs
    const newImages = validFiles.map(file => ({
      file,
      preview: URL.createObjectURL(file),
    }));

    setImages([...images, ...newImages]);
    alert.error('');
  };

  // Remove a new image (not yet uploaded)
  const removeNewImage = (index) => {
    const newImages = [...images];
    URL.revokeObjectURL(newImages[index].preview);
    newImages.splice(index, 1);
    setImages(newImages);
  };

  // Mark an existing image for deletion
  const markImageForDeletion = (imageId) => {
    setImagesToDelete([...imagesToDelete, imageId]);
  };

  // Restore an image marked for deletion
  const restoreImage = (imageId) => {
    setImagesToDelete(imagesToDelete.filter(id => id !== imageId));
  };

  // Upload images to Supabase Storage
  const uploadImages = async (productId) => {
    const uploadedUrls = [];

    for (const image of images) {
      const fileExt = image.file.name.split('.').pop();
      const fileName = `${productId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(fileName, image.file);

      if (uploadError) {
        console.error('Error uploading image:', uploadError);
        continue;
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('product-images')
        .getPublicUrl(fileName);

      uploadedUrls.push({
        product_id: productId,
        image_url: publicUrl,
        is_primary: uploadedUrls.length === 0 && existingImages.length === 0,
      });
    }

    return uploadedUrls;
  };

  // Delete images from storage and database
  const deleteImages = async () => {
    for (const imageId of imagesToDelete) {
      const imageToDelete = existingImages.find(img => img.id === imageId);
      if (imageToDelete) {
        // Extract file path from URL
        const url = new URL(imageToDelete.image_url);
        const pathParts = url.pathname.split('/');
        const bucketIndex = pathParts.findIndex(p => p === 'product-images');
        if (bucketIndex !== -1) {
          const filePath = pathParts.slice(bucketIndex + 1).join('/');

          // Delete from storage
          await supabase.storage
            .from('product-images')
            .remove([filePath]);
        }

        // Delete from database
        await supabase
          .from('product_images')
          .delete()
          .eq('id', imageId);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    alert.error('');
    setLoading(true);

    try {
      // Validate required fields
      if (!formData.name || !formData.price) {
        alert.error('Name and price are required');
        setLoading(false);
        return;
      }

      // Prepare product data
      const productData = {
        ...formData,
        price: parseFloat(formData.price),
        compare_at_price: formData.compare_at_price ? parseFloat(formData.compare_at_price) : null,
        stock_quantity: parseInt(formData.stock_quantity) || 0,
        category_id: formData.category_id || null,
      };

      let productId = id;

      if (isEdit) {
        // Update existing product
        const { error: updateError } = await supabase
          .from('products')
          .update(productData)
          .eq('id', id)
          .eq('vendor_id', vendorId);

        if (updateError) throw updateError;
      } else {
        // Create new product
        const slug = formData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');

        const { data: newProduct, error: insertError } = await supabase
          .from('products')
          .insert([
            {
              ...productData,
              vendor_id: vendorId,
              slug: `${slug}-${Date.now()}`,
              is_active: true,
            },
          ])
          .select()
          .single();

        if (insertError) throw insertError;
        productId = newProduct.id;
      }

      // Handle image uploads
      if (images.length > 0) {
        setUploadingImages(true);
        const uploadedImages = await uploadImages(productId);

        if (uploadedImages.length > 0) {
          const { error: imagesError } = await supabase
            .from('product_images')
            .insert(uploadedImages);

          if (imagesError) {
            console.error('Error saving image records:', imagesError);
          }
        }
        setUploadingImages(false);
      }

      // Handle image deletions
      if (imagesToDelete.length > 0) {
        await deleteImages();
      }

      // Success - redirect to products list
      alert.success(isEdit ? 'Product updated successfully!' : 'Product created successfully!');
      navigate('/vendor/products');
    } catch (err) {
      console.error('Error saving product:', err);
      alert.error(err.message || 'Failed to save product');
    } finally {
      setLoading(false);
      setUploadingImages(false);
    }
  };

  // Show loading while checking vendor
  if (checkingVendor) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Show error if vendor check failed
  if (!vendorId) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4">
        <div className="max-w-3xl mx-auto bg-white shadow rounded-lg p-8">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Cannot Add Products</h2>
            <Link
              to="/vendor/dashboard"
              className="inline-block px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
            >
              Back to Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <VendorNavigation />
      <div className="max-w-3xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow rounded-lg p-8">
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-gray-900">
              {isEdit ? 'Edit Product' : 'Add New Product'}
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              {isEdit ? 'Update your product details' : 'Fill in the details for your new product'}
            </p>
          </div>


          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Product Name */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                Product Name *
              </label>
              <input
                id="name"
                name="name"
                type="text"
                required
                value={formData.name}
                onChange={handleChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="e.g., Samsung Galaxy A54"
              />
            </div>

            {/* Description */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                Description
              </label>
              <textarea
                id="description"
                name="description"
                rows="4"
                value={formData.description}
                onChange={handleChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Describe your product..."
              />
            </div>

            {/* Product Images */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Product Images (max 5)
              </label>

              {/* Existing Images */}
              {existingImages.length > 0 && (
                <div className="mb-4">
                  <p className="text-sm text-gray-500 mb-2">Current Images:</p>
                  <div className="flex flex-wrap gap-4">
                    {existingImages.map((image) => (
                      <div
                        key={image.id}
                        className={`relative ${imagesToDelete.includes(image.id) ? 'opacity-50' : ''}`}
                      >
                        <img
                          src={image.image_url}
                          alt="Product"
                          className="w-24 h-24 object-cover rounded-lg border border-gray-200"
                        />
                        {imagesToDelete.includes(image.id) ? (
                          <button
                            type="button"
                            onClick={() => restoreImage(image.id)}
                            className="absolute -top-2 -right-2 bg-green-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm hover:bg-green-600"
                          >
                            +
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => markImageForDeletion(image.id)}
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm hover:bg-red-600"
                          >
                            ×
                          </button>
                        )}
                        {image.is_primary && (
                          <span className="absolute bottom-0 left-0 right-0 bg-indigo-600 text-white text-xs text-center py-0.5 rounded-b-lg">
                            Primary
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* New Images Preview */}
              {images.length > 0 && (
                <div className="mb-4">
                  <p className="text-sm text-gray-500 mb-2">New Images to Upload:</p>
                  <div className="flex flex-wrap gap-4">
                    {images.map((image, index) => (
                      <div key={index} className="relative">
                        <img
                          src={image.preview}
                          alt={`New ${index + 1}`}
                          className="w-24 h-24 object-cover rounded-lg border border-gray-200"
                        />
                        <button
                          type="button"
                          onClick={() => removeNewImage(index)}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm hover:bg-red-600"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Upload Button */}
              <div className="mt-2">
                <label className="cursor-pointer inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
                  <svg className="w-5 h-5 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  Add Images
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/gif,image/webp"
                    multiple
                    onChange={handleImageSelect}
                    className="hidden"
                  />
                </label>
                <p className="mt-1 text-xs text-gray-500">
                  JPEG, PNG, GIF, or WebP. Max 5MB per image.
                </p>
              </div>
            </div>

            {/* Price Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="price" className="block text-sm font-medium text-gray-700">
                  Price (GH₵) *
                </label>
                <input
                  id="price"
                  name="price"
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  value={formData.price}
                  onChange={handleChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="0.00"
                />
              </div>

              <div>
                <label htmlFor="compare_at_price" className="block text-sm font-medium text-gray-700">
                  Compare at Price (GH₵)
                </label>
                <input
                  id="compare_at_price"
                  name="compare_at_price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.compare_at_price}
                  onChange={handleChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="0.00"
                />
                <p className="mt-1 text-xs text-gray-500">Original price (for discounts)</p>
              </div>
            </div>

            {/* Stock and SKU */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="stock_quantity" className="block text-sm font-medium text-gray-700">
                  Stock Quantity
                </label>
                <input
                  id="stock_quantity"
                  name="stock_quantity"
                  type="number"
                  min="0"
                  value={formData.stock_quantity}
                  onChange={handleChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="0"
                />
              </div>

              <div>
                <label htmlFor="sku" className="block text-sm font-medium text-gray-700">
                  SKU
                </label>
                <input
                  id="sku"
                  name="sku"
                  type="text"
                  value={formData.sku}
                  onChange={handleChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Product SKU"
                />
              </div>
            </div>

            {/* Category */}
            <div>
              <label htmlFor="category_id" className="block text-sm font-medium text-gray-700">
                Category
              </label>
              <select
                id="category_id"
                name="category_id"
                value={formData.category_id}
                onChange={handleChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="">Select a category</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Featured */}
            <div className="flex items-center">
              <input
                id="is_featured"
                name="is_featured"
                type="checkbox"
                checked={formData.is_featured}
                onChange={handleChange}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
              <label htmlFor="is_featured" className="ml-2 block text-sm text-gray-900">
                Featured Product
              </label>
            </div>

            {/* Submit Buttons */}
            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => navigate('/vendor/products')}
                className="flex-1 py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || uploadingImages}
                className="flex-1 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading || uploadingImages
                  ? uploadingImages
                    ? 'Uploading Images...'
                    : 'Saving...'
                  : isEdit
                  ? 'Update Product'
                  : 'Create Product'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ProductForm;
