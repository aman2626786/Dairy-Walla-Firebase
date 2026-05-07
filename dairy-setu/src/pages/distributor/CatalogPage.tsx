import { type ChangeEvent, useMemo, useState } from 'react';
import { Plus, Edit2, Trash2, Package, Eye, EyeOff, Image as ImageIcon, X } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useAppStore } from '../../store/appStore';
import { useToast } from '../../components/ui/Toast';
import { Modal } from '../../components/ui/Modal';
import { EmptyState } from '../../components/ui/EmptyState';
import { MobileHeader } from '../../components/layout/MobileHeader';
import type { KnownProductCategory, Product, ProductCategory } from '../../types';

const categoryOrder: KnownProductCategory[] = ['milk', 'paneer', 'curd', 'butter', 'ghee', 'other'];
const knownCategoryEmoji: Record<KnownProductCategory, string> = {
  milk: '🥛',
  paneer: '🧀',
  curd: '🍶',
  butter: '🧈',
  ghee: '🫙',
  other: '📦',
};

const popularBrands = ['Amul', 'Mother Dairy', 'Saras', 'Parag', 'Ananda', 'Sudha', 'Nandini', 'Nestle'];
const manualCategoryValue = '__manual_category__';
const manualBrandValue = '__manual_brand__';

interface ProductFormData {
  name: string;
  brand: string;
  category: ProductCategory;
  unit: string;
  price: string;
  available: boolean;
  imageUrl?: string;
}

const defaultForm: ProductFormData = {
  name: '',
  brand: popularBrands[0],
  category: 'milk',
  unit: '',
  price: '',
  available: true,
  imageUrl: '',
};

const normalizeCategory = (value: string): ProductCategory =>
  (value.trim().toLowerCase().replace(/\s+/g, ' ') || 'other') as ProductCategory;

const getCategoryEmoji = (category: string): string =>
  knownCategoryEmoji[normalizeCategory(category) as KnownProductCategory] || '📦';

const formatCategoryLabel = (category: string): string =>
  category.replace(/\b\w/g, char => char.toUpperCase());

const compareCategories = (a: string, b: string): number => {
  const indexA = categoryOrder.indexOf(a as KnownProductCategory);
  const indexB = categoryOrder.indexOf(b as KnownProductCategory);
  const isKnownA = indexA >= 0;
  const isKnownB = indexB >= 0;
  if (isKnownA && isKnownB) return indexA - indexB;
  if (isKnownA) return -1;
  if (isKnownB) return 1;
  return a.localeCompare(b);
};

export function CatalogPage() {
  const { user } = useAuthStore();
  const { products, distributorProfiles, addProduct, updateProduct, deleteProduct } = useAppStore();
  const { show } = useToast();

  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [form, setForm] = useState<ProductFormData>(defaultForm);
  const [filterCat, setFilterCat] = useState<ProductCategory | 'all'>('all');
  const [selectedCategoryOption, setSelectedCategoryOption] = useState<string>('milk');
  const [manualCategory, setManualCategory] = useState('');
  const [selectedBrandOption, setSelectedBrandOption] = useState<string>(popularBrands[0]);
  const [manualBrand, setManualBrand] = useState('');

  const profile = distributorProfiles.find(dp => dp.userId === user?.id);
  const myProducts = useMemo(
    () => products.filter(product => product.distributorId === profile?.id),
    [products, profile?.id]
  );

  const filterCategories = useMemo(
    () =>
      Array.from(new Set(myProducts.map(product => normalizeCategory(String(product.category)))))
        .sort(compareCategories),
    [myProducts]
  );

  const filteredProducts =
    filterCat === 'all'
      ? myProducts
      : myProducts.filter(product => normalizeCategory(String(product.category)) === filterCat);

  const resetFormForAdd = () => {
    setEditingProduct(null);
    setForm(defaultForm);
    setSelectedCategoryOption('milk');
    setManualCategory('');
    setSelectedBrandOption(popularBrands[0]);
    setManualBrand('');
    setModalOpen(true);
  };

  const openEdit = (product: Product) => {
    const normalizedCategory = normalizeCategory(String(product.category));
    const matchedBrand =
      popularBrands.find(brand => brand.toLowerCase() === product.brand.trim().toLowerCase()) || null;
    const categoryIsKnown = categoryOrder.includes(normalizedCategory as KnownProductCategory);

    setEditingProduct(product);
    setForm({
      name: product.name,
      brand: product.brand,
      category: normalizedCategory,
      unit: product.unit,
      price: String(product.price),
      available: product.available,
      imageUrl: product.imageUrl || '',
    });

    setSelectedCategoryOption(categoryIsKnown ? normalizedCategory : manualCategoryValue);
    setManualCategory(categoryIsKnown ? '' : String(product.category).trim());
    setSelectedBrandOption(matchedBrand || manualBrandValue);
    setManualBrand(matchedBrand ? '' : product.brand.trim());
    setModalOpen(true);
  };

  const handleImageUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      show('Image size should be less than 2MB', 'error');
      return;
    }

    if (!file.type.startsWith('image/')) {
      show('Please upload an image file', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setForm(current => ({ ...current, imageUrl: reader.result as string }));
      show('Image uploaded!');
    };
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    setForm(current => ({ ...current, imageUrl: '' }));
    show('Image removed');
  };

  const handleCategoryOptionChange = (value: string) => {
    setSelectedCategoryOption(value);
    if (value === manualCategoryValue) {
      setForm(current => ({ ...current, category: normalizeCategory(manualCategory) }));
      return;
    }
    setForm(current => ({ ...current, category: normalizeCategory(value) }));
  };

  const handleBrandOptionChange = (value: string) => {
    setSelectedBrandOption(value);
    if (value === manualBrandValue) {
      setForm(current => ({ ...current, brand: manualBrand.trim() }));
      return;
    }
    setForm(current => ({ ...current, brand: value }));
  };

  const handleSave = async () => {
    if (!profile) {
      show('Distributor profile not found', 'error');
      return;
    }

    const resolvedCategorySource =
      selectedCategoryOption === manualCategoryValue ? manualCategory : selectedCategoryOption;
    const resolvedCategory = normalizeCategory(resolvedCategorySource);
    const resolvedBrand =
      selectedBrandOption === manualBrandValue ? manualBrand.trim() : selectedBrandOption.trim();
    const name = form.name.trim();
    const unit = form.unit.trim();
    const price = Number(form.price);

    if (!name || !resolvedBrand || !unit || !form.price.trim()) {
      show('Please fill all required fields', 'error');
      return;
    }
    if (selectedCategoryOption === manualCategoryValue && !manualCategory.trim()) {
      show('Please enter custom category name', 'error');
      return;
    }
    if (selectedBrandOption === manualBrandValue && !manualBrand.trim()) {
      show('Please enter custom brand name', 'error');
      return;
    }
    if (!Number.isFinite(price) || price < 0) {
      show('Please enter a valid price', 'error');
      return;
    }

    const payload: Omit<Product, 'id'> = {
      distributorId: profile.id,
      name,
      brand: resolvedBrand,
      category: resolvedCategory,
      unit,
      price,
      available: form.available,
      imageUrl: form.imageUrl?.trim() || undefined,
    };

    const success = editingProduct
      ? await updateProduct(editingProduct.id, payload)
      : await addProduct(payload);

    if (!success) {
      show('Product save failed. Please try again.', 'error');
      return;
    }

    show(editingProduct ? 'Product updated' : 'Product added');
    setModalOpen(false);
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete "${name}"?`)) return;
    const success = await deleteProduct(id);
    if (!success) {
      show('Delete failed. Please try again.', 'error');
      return;
    }
    show('Product deleted', 'error');
  };

  const toggleAvailability = async (product: Product) => {
    const success = await updateProduct(product.id, { available: !product.available });
    if (!success) {
      show('Availability update failed', 'error');
      return;
    }
    show(product.available ? `${product.name} marked unavailable` : `${product.name} is now available`);
  };

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto">
      <MobileHeader title="Product Catalog" subtitle={`${myProducts.length} products`} />

      <div className="hidden md:flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Product Catalog</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {myProducts.length} products · {myProducts.filter(product => product.available).length} available
          </p>
        </div>
        <button className="btn-primary" onClick={resetFormForAdd}>
          <Plus className="w-4 h-4" /> Add Product
        </button>
      </div>

      <div className="md:hidden flex justify-end mb-4">
        <button className="btn-primary" onClick={resetFormForAdd}>
          <Plus className="w-4 h-4" /> Add Product
        </button>
      </div>

      <div className="flex gap-2 mb-5 overflow-x-auto pb-1">
        <button
          onClick={() => setFilterCat('all')}
          className={`px-3 py-1.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
            filterCat === 'all'
              ? 'bg-brand-600 text-white'
              : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
          }`}
        >
          All
        </button>
        {filterCategories.map(category => (
          <button
            key={category}
            onClick={() => setFilterCat(category)}
            className={`px-3 py-1.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
              filterCat === category
                ? 'bg-brand-600 text-white'
                : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            {getCategoryEmoji(category)} {formatCategoryLabel(category)}
          </button>
        ))}
      </div>

      {filteredProducts.length === 0 ? (
        <EmptyState
          icon={<Package className="w-8 h-8" />}
          title="No products yet"
          description="Add your first product to get started"
          action={
            <button className="btn-primary" onClick={resetFormForAdd}>
              <Plus className="w-4 h-4" /> Add Product
            </button>
          }
        />
      ) : (
        <>
          <div className="md:hidden space-y-3">
            {filteredProducts.map(product => (
              <div key={product.id} className={`card p-4 ${!product.available ? 'opacity-60' : ''}`}>
                <div className="flex items-start gap-3">
                  {product.imageUrl ? (
                    <img
                      src={product.imageUrl}
                      alt={product.name}
                      className="w-16 h-16 rounded-xl object-cover flex-shrink-0"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-xl bg-gray-100 flex items-center justify-center flex-shrink-0">
                      <span className="text-2xl">{getCategoryEmoji(String(product.category))}</span>
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="font-semibold text-gray-900 text-sm truncate">{product.name}</div>
                        <div className="text-xs text-gray-500">
                          {product.brand} · {product.unit}
                        </div>
                        <div className="font-bold text-gray-900 mt-1">₹{product.price}</div>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <button onClick={() => openEdit(product)} className="p-1.5 rounded-lg hover:bg-gray-100">
                          <Edit2 className="w-3.5 h-3.5 text-gray-500" />
                        </button>
                        <button
                          onClick={() => void handleDelete(product.id, product.name)}
                          className="p-1.5 rounded-lg hover:bg-red-50"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-red-400" />
                        </button>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="badge bg-gray-100 text-gray-600 text-xs">
                        {formatCategoryLabel(String(product.category))}
                      </span>
                      <button
                        onClick={() => void toggleAvailability(product)}
                        className={`badge cursor-pointer text-xs ${
                          product.available ? 'badge-green' : 'badge-gray'
                        }`}
                      >
                        {product.available ? '● Available' : '○ Hidden'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="hidden md:block card overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Product
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Brand
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Category
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Unit
                  </th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Price
                  </th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Status
                  </th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredProducts.map(product => (
                  <tr
                    key={product.id}
                    className={`hover:bg-gray-50 transition-colors ${!product.available ? 'opacity-50' : ''}`}
                  >
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        {product.imageUrl ? (
                          <img src={product.imageUrl} alt={product.name} className="w-10 h-10 rounded-lg object-cover" />
                        ) : (
                          <span className="text-lg">{getCategoryEmoji(String(product.category))}</span>
                        )}
                        <span className="text-sm font-medium text-gray-900">{product.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{product.brand}</td>
                    <td className="px-4 py-3">
                      <span className="badge bg-gray-100 text-gray-600">
                        {formatCategoryLabel(String(product.category))}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{product.unit}</td>
                    <td className="px-4 py-3 text-right text-sm font-semibold text-gray-900">₹{product.price}</td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => void toggleAvailability(product)}
                        className={`badge ${
                          product.available ? 'badge-green' : 'badge-gray'
                        } cursor-pointer hover:opacity-80`}
                      >
                        {product.available ? <Eye className="w-3 h-3 mr-1" /> : <EyeOff className="w-3 h-3 mr-1" />}
                        {product.available ? 'Available' : 'Hidden'}
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 justify-end">
                        <button onClick={() => openEdit(product)} className="btn-ghost p-1.5">
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => void handleDelete(product.id, product.name)}
                          className="btn-ghost p-1.5 hover:text-red-500"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editingProduct ? 'Edit Product' : 'Add Product'}>
        <div className="space-y-4">
          <div>
            <label className="label flex items-center gap-1.5">
              <ImageIcon className="w-3.5 h-3.5" />
              Product Image (Optional)
            </label>
            {form.imageUrl ? (
              <div className="relative inline-block">
                <img
                  src={form.imageUrl}
                  alt="Product"
                  className="w-32 h-32 rounded-xl object-cover border-2 border-gray-200"
                />
                <button
                  onClick={removeImage}
                  className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 shadow-lg"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:bg-gray-50 transition-colors">
                <ImageIcon className="w-8 h-8 text-gray-400 mb-2" />
                <span className="text-sm text-gray-500">Click to upload image</span>
                <span className="text-xs text-gray-400 mt-1">Max 2MB</span>
                <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
              </label>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="label">Product Name</label>
              <input
                className="input"
                placeholder="e.g. Full Cream Milk"
                value={form.name}
                onChange={event => setForm(current => ({ ...current, name: event.target.value }))}
              />
            </div>

            <div>
              <label className="label">Brand</label>
              <select
                className="input"
                value={selectedBrandOption}
                onChange={event => handleBrandOptionChange(event.target.value)}
              >
                {popularBrands.map(brand => (
                  <option key={brand} value={brand}>
                    {brand}
                  </option>
                ))}
                <option value={manualBrandValue}>Manual (type your own)</option>
              </select>
              {selectedBrandOption === manualBrandValue && (
                <input
                  className="input mt-2"
                  placeholder="Enter brand name"
                  value={manualBrand}
                  onChange={event => {
                    const value = event.target.value;
                    setManualBrand(value);
                    setForm(current => ({ ...current, brand: value.trim() }));
                  }}
                />
              )}
            </div>

            <div>
              <label className="label">Category</label>
              <select
                className="input"
                value={selectedCategoryOption}
                onChange={event => handleCategoryOptionChange(event.target.value)}
              >
                {categoryOrder.map(category => (
                  <option key={category} value={category}>
                    {knownCategoryEmoji[category]} {formatCategoryLabel(category)}
                  </option>
                ))}
                <option value={manualCategoryValue}>Manual (type your own)</option>
              </select>
              {selectedCategoryOption === manualCategoryValue && (
                <input
                  className="input mt-2"
                  placeholder="Enter category name"
                  value={manualCategory}
                  onChange={event => {
                    const value = event.target.value;
                    setManualCategory(value);
                    setForm(current => ({ ...current, category: normalizeCategory(value) }));
                  }}
                />
              )}
            </div>

            <div>
              <label className="label">Unit</label>
              <input
                className="input"
                placeholder="e.g. 500ml pouch"
                value={form.unit}
                onChange={event => setForm(current => ({ ...current, unit: event.target.value }))}
              />
            </div>
            <div>
              <label className="label">Price (₹)</label>
              <input
                className="input"
                type="number"
                placeholder="0"
                value={form.price}
                onChange={event => setForm(current => ({ ...current, price: event.target.value }))}
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setForm(current => ({ ...current, available: !current.available }))}
              className={`relative w-10 h-5 rounded-full transition-colors ${
                form.available ? 'bg-brand-600' : 'bg-gray-300'
              }`}
            >
              <div
                className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                  form.available ? 'translate-x-5' : 'translate-x-0.5'
                }`}
              />
            </button>
            <span className="text-sm text-gray-700">Available for ordering</span>
          </div>

          <div className="flex gap-3 pt-2">
            <button className="btn-secondary flex-1" onClick={() => setModalOpen(false)}>
              Cancel
            </button>
            <button className="btn-primary flex-1" onClick={() => void handleSave()}>
              {editingProduct ? 'Save Changes' : 'Add Product'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
