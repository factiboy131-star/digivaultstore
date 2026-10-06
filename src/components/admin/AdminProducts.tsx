import React, { useState } from 'react';
import {
  Package,
  Plus,
  Search,
  Edit2,
  Trash2,
  Upload,
  X,
  Check,
  Image as ImageIcon,
  FileText,
  AlertCircle,
  Eye,
  Star,
  Flame,
  Loader2,
  ChevronUp,
  ChevronDown,
} from 'lucide-react';
import { Product, ProductType, ProductStatus, Category, FAQItem } from '../../types';
import { adminApi } from '../../services/api';

interface AdminProductsProps {
  products: Product[];
  categories: Category[];
  currency: string;
  onRefresh: () => void;
  openNewModalDirectly?: boolean;
}

export const AdminProducts: React.FC<AdminProductsProps> = ({
  products,
  categories,
  currency,
  onRefresh,
  openNewModalDirectly = false,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [isModalOpen, setIsModalOpen] = useState(openNewModalDirectly);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Form Fields
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [shortDescription, setShortDescription] = useState('');
  const [fullDescription, setFullDescription] = useState('');
  const [category, setCategory] = useState(categories[0]?.name || 'AI Prompts');
  const [price, setPrice] = useState<number>(499);
  const [discountPrice, setDiscountPrice] = useState<string>('299');
  const [productType, setProductType] = useState<ProductType>('PDF');
  const [status, setStatus] = useState<ProductStatus>('Published');
  const [featured, setFeatured] = useState(false);
  const [bestseller, setBestseller] = useState(false);
  const [whatsIncluded, setWhatsIncluded] = useState('');
  const [requirements, setRequirements] = useState('');
  const [digitalContent, setDigitalContent] = useState('');

  // Features list
  const [features, setFeatures] = useState<string[]>(['']);

  // FAQ items
  const [faq, setFaq] = useState<FAQItem[]>([{ question: '', answer: '' }]);

  // Images state
  const [mainImageUrl, setMainImageUrl] = useState('');
  const [galleryImages, setGalleryImages] = useState<string[]>([]);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  // Product Private File State
  const [productFileName, setProductFileName] = useState<string | undefined>();
  const [productFilePath, setProductFilePath] = useState<string | undefined>();
  const [productFileSize, setProductFileSize] = useState<number | undefined>();
  const [isUploadingFile, setIsUploadingFile] = useState(false);

  // UI state
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const resetForm = () => {
    setEditingProduct(null);
    setName('');
    setSlug('');
    setShortDescription('');
    setFullDescription('');
    setCategory(categories[0]?.name || 'AI Prompts');
    setPrice(499);
    setDiscountPrice('299');
    setProductType('Prompt Pack');
    setStatus('Published');
    setFeatured(false);
    setBestseller(false);
    setWhatsIncluded('');
    setRequirements('');
    setDigitalContent('');
    setFeatures(['']);
    setFaq([{ question: '', answer: '' }]);
    setMainImageUrl('https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80');
    setGalleryImages([]);
    setProductFileName(undefined);
    setProductFilePath(undefined);
    setProductFileSize(undefined);
    setErrorMessage(null);
  };

  const handleOpenAdd = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const handleOpenEdit = (prod: Product) => {
    setEditingProduct(prod);
    setName(prod.name);
    setSlug(prod.slug);
    setShortDescription(prod.short_description);
    setFullDescription(prod.full_description);
    setCategory(prod.category);
    setPrice(prod.price);
    setDiscountPrice(prod.discount_price !== null ? String(prod.discount_price) : '');
    setProductType(prod.product_type);
    setStatus(prod.status);
    setFeatured(prod.featured);
    setBestseller(prod.bestseller);
    setWhatsIncluded(prod.whats_included || '');
    setRequirements(prod.requirements || '');
    setDigitalContent(prod.digital_content || '');
    setFeatures(prod.features && prod.features.length > 0 ? [...prod.features] : ['']);
    setFaq(prod.faq && prod.faq.length > 0 ? [...prod.faq] : [{ question: '', answer: '' }]);
    setMainImageUrl(prod.main_image_url || '');
    setGalleryImages(prod.gallery_images || []);
    setProductFileName(prod.product_file_name);
    setProductFilePath((prod as any).product_file_path);
    setProductFileSize(prod.product_file_size);
    setErrorMessage(null);
    setIsModalOpen(true);
  };

  // Image upload handler
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, isGallery = false) => {
    if (!e.target.files || !e.target.files[0]) return;
    const file = e.target.files[0];

    try {
      setIsUploadingImage(true);
      const res = await adminApi.uploadProductImage(file);
      if (isGallery) {
        setGalleryImages([...galleryImages, res.url]);
      } else {
        setMainImageUrl(res.url);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Image upload failed');
    } finally {
      setIsUploadingImage(false);
    }
  };

  // Digital asset private file upload handler
  const handleProductFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0]) return;
    const file = e.target.files[0];

    try {
      setIsUploadingFile(true);
      const res = await adminApi.uploadProductFile(file);
      setProductFileName(res.fileName);
      setProductFilePath(res.filePath);
      setProductFileSize(res.fileSize);
    } catch (err: any) {
      setErrorMessage(err.message || 'File upload failed');
    } finally {
      setIsUploadingFile(false);
    }
  };

  const handleDeleteProduct = async (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to permanently delete "${name}"?`)) {
      try {
        await adminApi.deleteProduct(id);
        onRefresh();
      } catch (err: any) {
        alert(err.message || 'Failed to delete product');
      }
    }
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMessage('Product name is required');
      return;
    }

    try {
      setIsSaving(true);
      setErrorMessage(null);

      const productPayload: any = {
        name: name.trim(),
        slug: slug.trim(),
        short_description: shortDescription.trim(),
        full_description: fullDescription.trim(),
        category,
        price: Number(price),
        discount_price: discountPrice.trim() !== '' ? Number(discountPrice) : null,
        product_type: productType,
        status,
        featured,
        bestseller,
        whats_included: whatsIncluded.trim(),
        requirements: requirements.trim(),
        features: features.map((f) => f.trim()).filter(Boolean),
        faq: faq.filter((item) => item.question.trim() && item.answer.trim()),
        main_image_url: mainImageUrl.trim(),
        gallery_images: galleryImages,
        product_file_name: productFileName,
        product_file_size: productFileSize,
        product_file_path: productFilePath,
        digital_content: digitalContent.trim(),
      };

      if (editingProduct) {
        await adminApi.updateProduct(editingProduct.id, productPayload);
      } else {
        await adminApi.createProduct(productPayload);
      }

      setIsModalOpen(false);
      onRefresh();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to save product');
    } finally {
      setIsSaving(false);
    }
  };

  // Filter products
  const filteredProducts = products.filter((prod) => {
    const matchesCategory =
      selectedCategory === 'All' || prod.category.toLowerCase() === selectedCategory.toLowerCase();
    const matchesSearch =
      searchQuery === '' ||
      prod.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      prod.category.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header with Search and Add Product Button */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-zinc-900 border border-zinc-800 p-4 rounded-2xl">
        <div className="flex flex-1 items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-zinc-950 border border-zinc-700/80 rounded-xl text-xs sm:text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 bg-zinc-950 border border-zinc-700/80 rounded-xl text-xs font-medium text-zinc-200 focus:outline-none focus:border-emerald-500"
          >
            <option value="All">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.name}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={handleOpenAdd}
          className="py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-black font-extrabold text-xs transition-all shadow-md shadow-emerald-500/20 flex items-center justify-center gap-2 cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>+ ADD PRODUCT</span>
        </button>
      </div>

      {/* Products Table */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-zinc-950/80 text-zinc-400 border-b border-zinc-800">
                <th className="py-3.5 px-4 font-semibold">Image & Product</th>
                <th className="py-3.5 px-4 font-semibold">Category</th>
                <th className="py-3.5 px-4 font-semibold">Type</th>
                <th className="py-3.5 px-4 font-semibold">Price</th>
                <th className="py-3.5 px-4 font-semibold">Digital Asset</th>
                <th className="py-3.5 px-4 font-semibold">Status</th>
                <th className="py-3.5 px-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-zinc-500">
                    No products found. Click "+ ADD PRODUCT" to create your first digital listing.
                  </td>
                </tr>
              ) : (
                filteredProducts.map((prod) => (
                  <tr key={prod.id} className="hover:bg-zinc-800/40 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={prod.main_image_url}
                          alt={prod.name}
                          className="w-12 h-12 rounded-lg object-cover bg-zinc-950 border border-zinc-800 shrink-0"
                        />
                        <div>
                          <div className="font-bold text-white text-sm line-clamp-1 max-w-[240px]">
                            {prod.name}
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            {prod.featured && (
                              <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-1.5 py-0.2 rounded border border-emerald-500/20">
                                Featured
                              </span>
                            )}
                            {prod.bestseller && (
                              <span className="text-[10px] text-amber-400 bg-amber-500/10 px-1.5 py-0.2 rounded border border-amber-500/20">
                                Bestseller
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-zinc-300 font-medium">{prod.category}</td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded-md bg-zinc-800 border border-zinc-700 text-zinc-300 text-[11px] font-semibold">
                        {prod.product_type}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-white">
                        {currency} {(prod.discount_price ?? prod.price).toLocaleString()}
                      </div>
                      {prod.discount_price && (
                        <div className="text-[10px] text-zinc-500 line-through">
                          {currency} {prod.price.toLocaleString()}
                        </div>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      {prod.product_file_name ? (
                        <span className="text-emerald-400 text-[11px] flex items-center gap-1">
                          <Check className="w-3.5 h-3.5" />
                          <span className="truncate max-w-[120px]">{prod.product_file_name}</span>
                        </span>
                      ) : prod.has_online_content ? (
                        <span className="text-teal-400 text-[11px]">Online Vault</span>
                      ) : (
                        <span className="text-zinc-500 text-[11px]">No file attached</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          prod.status === 'Published'
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : prod.status === 'Draft'
                            ? 'bg-zinc-800 text-zinc-400'
                            : 'bg-red-500/20 text-red-400'
                        }`}
                      >
                        {prod.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleOpenEdit(prod)}
                          className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white transition-colors cursor-pointer"
                          title="Edit Product"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteProduct(prod.id, prod.name)}
                          className="p-1.5 rounded-lg bg-zinc-800 hover:bg-red-950 text-zinc-400 hover:text-red-400 transition-colors cursor-pointer"
                          title="Delete Product"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ADD / EDIT PRODUCT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 animate-fadeIn">
          <div className="relative bg-zinc-900 border border-zinc-800 rounded-2xl max-w-4xl w-full max-h-[94vh] overflow-y-auto shadow-2xl text-zinc-100 flex flex-col">
            {/* Header */}
            <div className="sticky top-0 z-20 bg-zinc-950/95 backdrop-blur border-b border-zinc-800 px-6 py-4 flex items-center justify-between">
              <div>
                <h3 className="font-extrabold text-base sm:text-lg text-white">
                  {editingProduct ? 'Edit Digital Product' : 'Add New Digital Product'}
                </h3>
                <p className="text-xs text-zinc-400">
                  Full control over images, private storage files, pricing, and features.
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg bg-zinc-800 text-zinc-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="p-6 space-y-6 flex-1 overflow-y-auto">
              {/* Basic Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">
                    Product Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 50 Google Pro Prompts"
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      if (!editingProduct && !slug) {
                        setSlug(
                          e.target.value
                            .toLowerCase()
                            .replace(/[^a-z0-9]+/g, '-')
                            .replace(/(^-|-$)+/g, '')
                        );
                      }
                    }}
                    className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-700 rounded-xl text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">
                    Product Slug (URL friendly)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 50-google-pro-prompts"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-700 rounded-xl text-xs sm:text-sm font-mono text-zinc-300 placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">
                    Category *
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-700 rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:border-emerald-500"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">
                    Price ({currency}) *
                  </label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={price}
                    onChange={(e) => setPrice(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-700 rounded-xl text-sm font-bold text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">
                    Discount Price ({currency}) (Optional)
                  </label>
                  <input
                    type="number"
                    min={0}
                    placeholder="e.g. 299"
                    value={discountPrice}
                    onChange={(e) => setDiscountPrice(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-700 rounded-xl text-sm font-bold text-emerald-400 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">
                    Product Type
                  </label>
                  <select
                    value={productType}
                    onChange={(e) => setProductType(e.target.value as ProductType)}
                    className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-700 rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="Prompt Pack">Prompt Pack</option>
                    <option value="PDF">PDF</option>
                    <option value="DOCX">DOCX</option>
                    <option value="ZIP">ZIP</option>
                    <option value="E-book">E-book</option>
                    <option value="Template">Template</option>
                    <option value="Online Document">Online Document</option>
                    <option value="Digital Bundle">Digital Bundle</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">
                    Status
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as ProductStatus)}
                    className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-700 rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="Published">Published (Live on store)</option>
                    <option value="Draft">Draft (Hidden)</option>
                    <option value="Unpublished">Unpublished</option>
                  </select>
                </div>
              </div>

              {/* Badges: Featured & Bestseller */}
              <div className="flex gap-6 p-3 bg-zinc-950 rounded-xl border border-zinc-800 text-xs">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={featured}
                    onChange={(e) => setFeatured(e.target.checked)}
                    className="w-4 h-4 rounded text-emerald-500 focus:ring-0"
                  />
                  <span className="font-semibold text-zinc-200">Featured on Homepage</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={bestseller}
                    onChange={(e) => setBestseller(e.target.checked)}
                    className="w-4 h-4 rounded text-amber-500 focus:ring-0"
                  />
                  <span className="font-semibold text-zinc-200">Mark as Bestseller</span>
                </label>
              </div>

              {/* CUSTOM PRODUCT IMAGE UPLOADS */}
              <div className="space-y-4 p-4 bg-zinc-950 rounded-xl border border-zinc-800">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-2">
                    <ImageIcon className="w-4 h-4 text-emerald-400" />
                    <span>Custom Product Images (Upload JPG, PNG, WEBP)</span>
                  </h4>
                  <span className="text-[11px] text-zinc-500">Preserves original quality</span>
                </div>

                {/* Main Product Image */}
                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-2">
                    Main Product Image *
                  </label>
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                    {mainImageUrl ? (
                      <div className="relative w-28 h-20 rounded-xl overflow-hidden border border-zinc-700 bg-black shrink-0">
                        <img src={mainImageUrl} alt="Main" className="w-full h-full object-cover" />
                      </div>
                    ) : (
                      <div className="w-28 h-20 rounded-xl border border-dashed border-zinc-700 bg-zinc-900 flex items-center justify-center text-zinc-600 shrink-0">
                        No image
                      </div>
                    )}

                    <div className="flex-1 w-full space-y-2">
                      <div className="flex items-center gap-2">
                        <label className="px-3.5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold text-zinc-200 cursor-pointer flex items-center gap-1.5 transition-colors">
                          <Upload className="w-3.5 h-3.5" />
                          <span>{isUploadingImage ? 'Uploading...' : 'Upload Custom Image'}</span>
                          <input
                            type="file"
                            accept="image/jpeg,image/png,image/webp,image/jpg"
                            onChange={(e) => handleImageUpload(e, false)}
                            className="hidden"
                          />
                        </label>
                      </div>
                      <input
                        type="text"
                        placeholder="Or enter direct image URL"
                        value={mainImageUrl}
                        onChange={(e) => setMainImageUrl(e.target.value)}
                        className="w-full px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded-lg text-xs text-zinc-300 placeholder-zinc-600 focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Additional Gallery Images */}
                <div className="pt-3 border-t border-zinc-800/80">
                  <label className="block text-xs font-medium text-zinc-300 mb-2">
                    Additional Gallery Images
                  </label>
                  <div className="flex flex-wrap gap-3 items-center mb-3">
                    {galleryImages.map((img, idx) => (
                      <div
                        key={idx}
                        className="relative w-20 h-16 rounded-lg overflow-hidden border border-zinc-700 group bg-black"
                      >
                        <img src={img} alt={`Gallery ${idx}`} className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => setGalleryImages(galleryImages.filter((_, i) => i !== idx))}
                          className="absolute top-1 right-1 p-1 rounded bg-red-600/90 text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}

                    <label className="w-20 h-16 rounded-lg border-2 border-dashed border-zinc-700 hover:border-emerald-500/80 bg-zinc-900/60 flex flex-col items-center justify-center cursor-pointer text-zinc-500 hover:text-white transition-colors">
                      <Plus className="w-4 h-4 mb-0.5" />
                      <span className="text-[10px] font-semibold">+ Add</span>
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp,image/jpg"
                        onChange={(e) => handleImageUpload(e, true)}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>
              </div>

              {/* PRODUCT PRIVATE FILE UPLOAD (PDF, ZIP, DOCX, ETC.) */}
              <div className="space-y-3 p-4 bg-zinc-950 rounded-xl border border-zinc-800">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-2">
                    <FileText className="w-4 h-4 text-emerald-400" />
                    <span>Protected Digital Product Asset (Private Storage)</span>
                  </h4>
                  <span className="text-[11px] text-emerald-400">Never exposed to public URLs</span>
                </div>

                <div className="bg-zinc-900/80 p-4 rounded-xl border border-zinc-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    {productFileName ? (
                      <div>
                        <div className="text-xs font-bold text-white flex items-center gap-2">
                          <Check className="w-4 h-4 text-emerald-400" />
                          <span>{productFileName}</span>
                        </div>
                        <p className="text-[11px] text-zinc-500">
                          {productFileSize
                            ? `${(productFileSize / 1024).toFixed(1)} KB`
                            : 'Asset uploaded'}{' '}
                          • Securely stored in backend private directory
                        </p>
                      </div>
                    ) : (
                      <p className="text-xs text-zinc-400">
                        No private file uploaded yet (e.g. 50-Google-Pro-Prompts.pdf, Bundle.zip).
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <label className="px-3.5 py-2 rounded-xl bg-emerald-600/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-600/30 text-xs font-semibold cursor-pointer flex items-center gap-1.5 transition-colors">
                      <Upload className="w-3.5 h-3.5" />
                      <span>{isUploadingFile ? 'Uploading Asset...' : 'Upload Product File'}</span>
                      <input
                        type="file"
                        onChange={handleProductFileUpload}
                        className="hidden"
                      />
                    </label>

                    {productFileName && (
                      <button
                        type="button"
                        onClick={() => {
                          setProductFileName(undefined);
                          setProductFilePath(undefined);
                          setProductFileSize(undefined);
                        }}
                        className="p-2 rounded-xl bg-zinc-800 text-zinc-400 hover:text-red-400"
                        title="Remove file"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Descriptions */}
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">
                    Short Description (Shown on Card) *
                  </label>
                  <textarea
                    rows={2}
                    required
                    placeholder="Crisp 1-2 sentence overview..."
                    value={shortDescription}
                    onChange={(e) => setShortDescription(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-700 rounded-xl text-xs sm:text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">
                    Full Description (Product Page Details)
                  </label>
                  <textarea
                    rows={4}
                    placeholder="Comprehensive breakdown of the product value..."
                    value={fullDescription}
                    onChange={(e) => setFullDescription(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-700 rounded-xl text-xs sm:text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Features List (Bullet points builder) */}
              <div className="space-y-2 p-4 bg-zinc-950 rounded-xl border border-zinc-800">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-zinc-300">
                    Key Features / Bullets
                  </label>
                  <button
                    type="button"
                    onClick={() => setFeatures([...features, ''])}
                    className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold cursor-pointer"
                  >
                    + Add Bullet
                  </button>
                </div>
                {features.map((feat, idx) => (
                  <div key={idx} className="flex gap-2">
                    <input
                      type="text"
                      placeholder={`Feature #${idx + 1}`}
                      value={feat}
                      onChange={(e) => {
                        const copy = [...features];
                        copy[idx] = e.target.value;
                        setFeatures(copy);
                      }}
                      className="flex-1 px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-emerald-500"
                    />
                    {features.length > 1 && (
                      <button
                        type="button"
                        onClick={() => setFeatures(features.filter((_, i) => i !== idx))}
                        className="p-2 text-zinc-500 hover:text-red-400"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {/* What's Included & Requirements */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">
                    What's Included
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 1x PDF Guide, 1x Prompt Bank"
                    value={whatsIncluded}
                    onChange={(e) => setWhatsIncluded(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-700 rounded-xl text-xs sm:text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">
                    Requirements
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. PDF reader or Google AI Studio"
                    value={requirements}
                    onChange={(e) => setRequirements(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-700 rounded-xl text-xs sm:text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Digital Content / Online Prompt Library Editor */}
              <div className="space-y-2 p-4 bg-zinc-950 rounded-xl border border-zinc-800">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                    Interactive Online Content / Prompt Library (Optional)
                  </label>
                  <span className="text-[11px] text-zinc-500">
                    Enables 1-click copy online vault for purchasers
                  </span>
                </div>
                <textarea
                  rows={5}
                  placeholder="Paste system prompts, guide chapters, or text assets here. Separate sections with ## Heading..."
                  value={digitalContent}
                  onChange={(e) => setDigitalContent(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-xs font-mono text-zinc-300 placeholder-zinc-600 focus:outline-none focus:border-emerald-500 leading-relaxed"
                />
              </div>

              {/* FAQs Builder */}
              <div className="space-y-3 p-4 bg-zinc-950 rounded-xl border border-zinc-800">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold uppercase tracking-wider text-zinc-300">
                    Product FAQs
                  </label>
                  <button
                    type="button"
                    onClick={() => setFaq([...faq, { question: '', answer: '' }])}
                    className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold cursor-pointer"
                  >
                    + Add FAQ
                  </button>
                </div>
                {faq.map((item, idx) => (
                  <div key={idx} className="p-3 bg-zinc-900/80 rounded-lg border border-zinc-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-semibold text-zinc-400">FAQ #{idx + 1}</span>
                      {faq.length > 1 && (
                        <button
                          type="button"
                          onClick={() => setFaq(faq.filter((_, i) => i !== idx))}
                          className="text-zinc-500 hover:text-red-400 text-xs"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                    <input
                      type="text"
                      placeholder="Question..."
                      value={item.question}
                      onChange={(e) => {
                        const copy = [...faq];
                        copy[idx].question = e.target.value;
                        setFaq(copy);
                      }}
                      className="w-full px-3 py-1.5 bg-zinc-950 border border-zinc-800 rounded-lg text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-emerald-500"
                    />
                    <textarea
                      rows={2}
                      placeholder="Answer..."
                      value={item.answer}
                      onChange={(e) => {
                        const copy = [...faq];
                        copy[idx].answer = e.target.value;
                        setFaq(copy);
                      }}
                      className="w-full px-3 py-1.5 bg-zinc-950 border border-zinc-800 rounded-lg text-xs text-zinc-300 placeholder-zinc-600 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                ))}
              </div>

              {errorMessage && (
                <div className="p-3.5 rounded-xl bg-red-950/60 border border-red-800 text-red-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Submit / Cancel Buttons */}
              <div className="sticky bottom-0 bg-zinc-950 p-4 border-t border-zinc-800 flex justify-end gap-3 -mx-6 -mb-6 mt-6">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 disabled:opacity-50 text-black font-extrabold text-xs transition-all shadow-md shadow-emerald-500/20 flex items-center gap-2 cursor-pointer"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Saving Product...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>SAVE PRODUCT</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
