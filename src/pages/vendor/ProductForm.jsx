import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useAlert } from '../../contexts/AlertContext';
import { supabase } from '../../config/supabase';
import VendorNavigation from '../../components/VendorNavigation';

const API_URL = import.meta.env.VITE_API_URL;
const MAX_IMAGES = 5;
const VALID_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

const initialFormState = {
  name: '',
  description: '',
  price: '',
  compare_at_price: '',
  stock_quantity: '',
  sku: '',
  category_id: '',
  is_featured: false,
};

const ProductForm = () => {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const alert = useAlert();
  const { user, session, loading: authLoading } = useAuth();

  const [formData, setFormData] = useState(initialFormState);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [checkingVendor, setCheckingVendor] = useState(true);
  const [vendorId, setVendorId] = useState(null);
  const [images, setImages] = useState([]);
  const [existingImages, setExistingImages] = useState([]);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [imagesToDelete, setImagesToDelete] = useState([]);

  const fetchCategories = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}/products/categories`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch categories');
      }

      setCategories(data.categories || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
      alert.error(error.message || 'Failed to load categories');
    }
  }, [alert]);

  const fetchVendorProfile = useCallback(async () => {
    if (!user?.id) {
      setCheckingVendor(false);
      return;
    }

    setCheckingVendor(true);

    try {
      const { data, error } = await supabase
        .from('vendors')
        .select('id, is_verified')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        throw error;
      }

      if (!data) {
        alert.error('Vendor profile not found');
        setVendorId(null);
        return;
      }

      if (!data.is_verified) {
        alert.error('Your vendor account must be verified before adding products');
        setVendorId(null);
        return;
      }

      setVendorId(data.id);
    } catch (error) {
      console.error('Error fetching vendor profile:', error);
      alert.error('Failed to load vendor profile');
      setVendorId(null);
    } finally {
      setCheckingVendor(false);
    }
  }, [alert, user?.id]);

  const fetchProduct = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*, images:product_images(*)')
        .eq('id', id)
        .eq('vendor_id', vendorId)
        .single();

      if (error) {
        throw error;
      }

      setFormData({
        name: data.name || '',
        description: data.description || '',
        price: data.price?.toString() || '',
        compare_at_price: data.compare_at_price?.toString() || '',
        stock_quantity: data.stock_quantity?.toString() || '',
        sku: data.sku || '',
        category_id: data.category_id || '',
        is_featured: Boolean(data.is_featured),
      });
      setExistingImages(data.images || []);
      setImagesToDelete([]);
    } catch (error) {
      console.error('Error fetching product:', error);
      alert.error('Failed to load product');
    }
  }, [alert, id, vendorId]);

  useEffect(() => {
    if (authLoading || !user?.id || !session?.access_token) {
      return;
    }

    fetchCategories();
    fetchVendorProfile();
  }, [authLoading, fetchCategories, fetchVendorProfile, session?.access_token, user?.id]);

  useEffect(() => {
    if (!isEdit || !vendorId) {
      return;
    }

    fetchProduct();
  }, [fetchProduct, isEdit, vendorId]);

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleImageSelect = (event) => {
    const files = Array.from(event.target.files || []);
    const currentTotal = images.length + existingImages.length - imagesToDelete.length;

    if (currentTotal + files.length > MAX_IMAGES) {
      alert.error(`You can only upload up to ${MAX_IMAGES} images per product`);
      event.target.value = '';
      return;
    }

    const validFiles = [];

    files.forEach((file) => {
      if (!VALID_IMAGE_TYPES.includes(file.type)) {
        alert.error('Only JPEG, PNG, GIF, and WebP images are allowed');
        return;
      }

      if (file.size > MAX_IMAGE_SIZE) {
        alert.error('Each image must be less than 5MB');
        return;
      }

      validFiles.push({
        file,
        preview: URL.createObjectURL(file),
      });
    });

    if (validFiles.length > 0) {
      setImages((prev) => [...prev, ...validFiles]);
    }

    event.target.value = '';
  };

  const removeNewImage = (index) => {
    setImages((prev) => {
      const next = [...prev];
      URL.revokeObjectURL(next[index].preview);
      next.splice(index, 1);
      return next;
    });
  };

  const markImageForDeletion = (imageId) => {
    setImagesToDelete((prev) => [...prev, imageId]);
  };

  const restoreImage = (imageId) => {
    setImagesToDelete((prev) => prev.filter((idToKeep) => idToKeep !== imageId));
  };

  const parseStoragePath = (imageUrl) => {
    try {
      const url = new URL(imageUrl);
      const marker = '/storage/v1/object/public/product-images/';
      const markerIndex = url.pathname.indexOf(marker);

      if (markerIndex === -1) {
        return null;
      }

      return decodeURIComponent(url.pathname.slice(markerIndex + marker.length));
    } catch {
      return null;
    }
  };

  const uploadImages = async (productId) => {
    const uploadedImages = [];

    for (const image of images) {
      const fileExt = image.file.name.split('.').pop();
      const fileName = `${productId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(fileName, image.file, { upsert: false });

      if (uploadError) {
        throw uploadError;
      }

      const { data } = supabase.storage
        .from('product-images')
        .getPublicUrl(fileName);

      uploadedImages.push({
        product_id: productId,
        image_url: data.publicUrl,
        is_primary: existingImages.length === imagesToDelete.length && uploadedImages.length === 0,
      });
    }

    return uploadedImages;
  };

  const deleteMarkedImages = async () => {
    for (const imageId of imagesToDelete) {
      const image = existingImages.find((item) => item.id === imageId);

      if (!image) {
        continue;
      }

      const storagePath = parseStoragePath(image.image_url);
      if (storagePath) {
        await supabase.storage.from('product-images').remove([storagePath]);
      }

      const { error } = await supabase
        .from('product_images')
        .delete()
        .eq('id', imageId);

      if (error) {
        throw error;
      }
    }
  };

  const upsertImageRecords = async (productId) => {
    if (images.length === 0) {
      return;
    }

    setUploadingImages(true);
    const uploadedImages = await uploadImages(productId);

    if (uploadedImages.length === 0) {
      return;
    }

    const { error } = await supabase
      .from('product_images')
      .insert(uploadedImages);

    if (error) {
      throw error;
    }
  };

  const saveProduct = async () => {
    const payload = {
      name: formData.name.trim(),
      description: formData.description?.trim() || '',
      price: Number(formData.price),
      compare_at_price: formData.compare_at_price ? Number(formData.compare_at_price) : null,
      stock_quantity: formData.stock_quantity ? Number(formData.stock_quantity) : 0,
      sku: formData.sku?.trim() || null,
      category_id: formData.category_id || null,
      is_featured: Boolean(formData.is_featured),
    };

    const requestOptions = {
      method: isEdit ? 'PUT' : 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify(payload),
    };

    const endpoint = isEdit ? `${API_URL}/products/${id}` : `${API_URL}/products`;
    const response = await fetch(endpoint, requestOptions);
    const result = await response.json();

    if (!response.ok) {
      const details = result.details?.[0]?.message;
      throw new Error(details || result.error || 'Failed to save product');
    }

    return result.product;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!session?.access_token) {
      alert.error('Your session has expired. Please sign in again.');
      return;
    }

    if (!formData.name.trim() || !formData.price) {
      alert.error('Name and price are required');
      return;
    }

    setLoading(true);

    try {
      const product = await saveProduct();
      const productId = product.id;

      if (imagesToDelete.length > 0) {
        await deleteMarkedImages();
      }

      await upsertImageRecords(productId);

      images.forEach((image) => URL.revokeObjectURL(image.preview));

      alert.success(isEdit ? 'Product updated successfully!' : 'Product created successfully!');
      navigate('/vendor/products');
    } catch (error) {
      console.error('Error saving product:', error);
      alert.error(error.message || 'Failed to save product');
    } finally {
      setLoading(false);
      setUploadingImages(false);
    }
  };

  if (authLoading || checkingVendor) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto" />
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

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

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Product Images (max 5)
              </label>

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
                            x
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

              {images.length > 0 && (
                <div className="mb-4">
                  <p className="text-sm text-gray-500 mb-2">New Images to Upload:</p>
                  <div className="flex flex-wrap gap-4">
                    {images.map((image, index) => (
                      <div key={`${image.file.name}-${index}`} className="relative">
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
                          x
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="price" className="block text-sm font-medium text-gray-700">
                  Price (GHs) *
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
                  Compare at Price (GHs)
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
                <p className="mt-1 text-xs text-gray-500">Original price for discount display</p>
              </div>
            </div>

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
