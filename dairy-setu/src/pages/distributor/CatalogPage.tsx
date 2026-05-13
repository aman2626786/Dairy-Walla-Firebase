﻿import { useMemo, useState } from 'react';
import { Plus, Edit2, Trash2, Package, Eye, EyeOff, Search, SlidersHorizontal, Trophy } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useAppStore } from '../../store/appStore';
import { useToast } from '../../components/ui/Toast';
import { Modal } from '../../components/ui/Modal';
import { EmptyState } from '../../components/ui/EmptyState';
import { MobileHeader } from '../../components/layout/MobileHeader';
import {
  dairyCategoryOptions,
  getAllowedBusinessLines,
  getCategoryEmoji,
  getProductQuantityText,
  iceCreamCategoryOptions,
  inferBusinessLineFromCategory,
  toDistributorType,
} from '../../utils/businessLine';
import type { BusinessLine, KnownProductCategory, Product, ProductCategory } from '../../types';

const categoryOrder: KnownProductCategory[] = ['milk', 'paneer', 'curd', 'butter', 'ghee', 'other'];

const popularBrands = ['Amul', 'Mother Dairy', 'Saras', 'Parag', 'Ananda', 'Sudha', 'Nandini', 'Nestle'];
const manualCategoryValue = '__manual_category__';
const manualBrandValue = '__manual_brand__';

interface ProductFormData {
  name: string;
  brand: string;
  category: ProductCategory;
  businessLine: BusinessLine;
  quantity: string;
  price: string;
  available: boolean;
}

const defaultForm: ProductFormData = {
  name: '',
  brand: popularBrands[0],
  category: 'milk',
  businessLine: 'dairy',
  quantity: '',
  price: '',
  available: true,
};

const normalizeCategory = (value: string): ProductCategory =>
  (value.trim().toLowerCase().replace(/\s+/g, ' ') || 'other') as ProductCategory;
const normalizeBrand = (value: string) => value.trim().toLowerCase();

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
  const [searchQuery, setSearchQuery] = useState('');
  const [filterBrand, setFilterBrand] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'available' | 'hidden'>('all');
  const [filterLine, setFilterLine] = useState<'all' | BusinessLine>('all');

  const profile = distributorProfiles.find(dp => dp.userId === user?.id);
  const distributorType = toDistributorType(profile?.distributorType);
  const allowedBusinessLines = getAllowedBusinessLines(distributorType);
  const defaultBusinessLine: BusinessLine = allowedBusinessLines[0] || 'dairy';
  const myProducts = useMemo(
    () =>
      products
        .filter(product => product.distributorId === profile?.id)
        .map(product => ({
          ...product,
          businessLine: inferBusinessLineFromCategory(String(product.category || 'other'), product.businessLine),
        }))
        .filter(product => allowedBusinessLines.includes(product.businessLine as BusinessLine)),
    [products, profile?.id, allowedBusinessLines]
  );

  const filterCategories = useMemo(
    () =>
      Array.from(new Set(myProducts.map(product => normalizeCategory(String(product.category)))))
        .sort(compareCategories),
    [myProducts]
  );

  const filterBrands = useMemo(
    () =>
      Array.from(
        new Set(
          myProducts
            .map(product => product.brand?.trim())
            .filter((brand): brand is string => Boolean(brand))
        )
      ).sort((a, b) => a.localeCompare(b)),
    [myProducts]
  );

  const filteredProducts = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();
    return myProducts.filter(product => {
      const category = normalizeCategory(String(product.category));
      const productLine = inferBusinessLineFromCategory(String(product.category || 'other'), product.businessLine);
      const matchCategory = filterCat === 'all' || category === filterCat;
      const matchLine = filterLine === 'all' || filterLine === productLine;
      const matchBrand = filterBrand === 'all' || product.brand.trim().toLowerCase() === filterBrand.toLowerCase();
      const matchStatus =
        filterStatus === 'all' ||
        (filterStatus === 'available' && product.available) ||
        (filterStatus === 'hidden' && !product.available);
      const matchSearch =
        normalizedQuery.length === 0 ||
        product.name.toLowerCase().includes(normalizedQuery) ||
        product.brand.toLowerCase().includes(normalizedQuery) ||
        category.toLowerCase().includes(normalizedQuery) ||
        getProductQuantityText(product.quantity, product.unit).toLowerCase().includes(normalizedQuery);
      return matchCategory && matchLine && matchBrand && matchStatus && matchSearch;
    });
  }, [myProducts, searchQuery, filterCat, filterLine, filterBrand, filterStatus]);

  const preferredBrand = useMemo(() => {
    const companyBrand = String(profile?.company ?? '').trim();
    if (companyBrand) return companyBrand;
    const firstBrand = myProducts.find(product => product.brand?.trim())?.brand?.trim();
    return firstBrand || '';
  }, [profile?.company, myProducts]);

  const groupedProducts = useMemo(() => {
    if (!preferredBrand) {
      return { main: filteredProducts, more: [] as Product[] };
    }
    const normalizedPreferred = normalizeBrand(preferredBrand);
    const main = filteredProducts.filter(product => normalizeBrand(product.brand || '') === normalizedPreferred);
    const more = filteredProducts.filter(product => normalizeBrand(product.brand || '') !== normalizedPreferred);
    if (main.length === 0) {
      return { main: filteredProducts, more: [] as Product[] };
    }
    return { main, more };
  }, [filteredProducts, preferredBrand]);

  const hasBrandSplit = groupedProducts.more.length > 0;

  const hasActiveFilters =
    searchQuery.trim().length > 0 ||
    filterCat !== 'all' ||
    filterBrand !== 'all' ||
    filterStatus !== 'all' ||
    filterLine !== 'all';

  const mainSectionTitle = preferredBrand
    ? `${preferredBrand} Main Products`
    : 'Main Products';

  const resetFilters = () => {
    setSearchQuery('');
    setFilterCat('all');
    setFilterBrand('all');
    setFilterStatus('all');
    setFilterLine('all');
  };

  const categoryOptionsForForm =
    form.businessLine === 'icecream' ? iceCreamCategoryOptions : dairyCategoryOptions;
  const selectedCategoryForPreview = normalizeCategory(
    selectedCategoryOption === manualCategoryValue ? manualCategory : String(form.category || 'other')
  );

  const resetFormForAdd = () => {
    const normalizedPreferredBrand = normalizeBrand(preferredBrand);
    const matchedDefaultBrand =
      popularBrands.find(brand => normalizeBrand(brand) === normalizedPreferredBrand) ||
      popularBrands[0];
    const useManualBrand = Boolean(preferredBrand) && normalizeBrand(matchedDefaultBrand) !== normalizedPreferredBrand;
    const defaultBrandValue = useManualBrand ? preferredBrand : matchedDefaultBrand;

    setEditingProduct(null);
    setForm({
      ...defaultForm,
      businessLine: defaultBusinessLine,
      category: defaultBusinessLine === 'icecream' ? 'ice cream' : 'milk',
      brand: defaultBrandValue,
    });
    setSelectedCategoryOption(defaultBusinessLine === 'icecream' ? 'ice cream' : 'milk');
    setManualCategory('');
    setSelectedBrandOption(useManualBrand ? manualBrandValue : matchedDefaultBrand);
    setManualBrand(useManualBrand ? preferredBrand : '');
    setModalOpen(true);
  };

  const openEdit = (product: Product) => {
    const normalizedCategory = normalizeCategory(String(product.category));
    const productLine = inferBusinessLineFromCategory(normalizedCategory, product.businessLine);
    const categoryOptions = productLine === 'icecream' ? iceCreamCategoryOptions : dairyCategoryOptions;
    const matchedBrand =
      popularBrands.find(brand => brand.toLowerCase() === product.brand.trim().toLowerCase()) || null;
    const categoryIsKnown = (categoryOptions as readonly string[]).includes(normalizedCategory);
    const quantityText = getProductQuantityText(product.quantity, product.unit);

    setEditingProduct(product);
    setForm({
      name: product.name,
      brand: product.brand,
      category: normalizedCategory,
      businessLine: productLine,
      quantity: quantityText === '-' ? '' : quantityText,
      price: String(product.price),
      available: product.available,
    });

    setSelectedCategoryOption(categoryIsKnown ? normalizedCategory : manualCategoryValue);
    setManualCategory(categoryIsKnown ? '' : String(product.category).trim());
    setSelectedBrandOption(matchedBrand || manualBrandValue);
    setManualBrand(matchedBrand ? '' : product.brand.trim());
    setModalOpen(true);
  };

  const handleCategoryOptionChange = (value: string) => {
    setSelectedCategoryOption(value);
    if (value === manualCategoryValue) {
      setForm(current => ({ ...current, category: normalizeCategory(manualCategory) }));
      return;
    }
    setForm(current => ({ ...current, category: normalizeCategory(value) }));
  };

  const handleBusinessLineChange = (line: BusinessLine) => {
    const safeLine = allowedBusinessLines.includes(line) ? line : defaultBusinessLine;
    const firstCategory = safeLine === 'icecream' ? 'ice cream' : 'milk';
    setForm(current => ({ ...current, businessLine: safeLine, category: firstCategory }));
    setSelectedCategoryOption(firstCategory);
    setManualCategory('');
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
    const resolvedBusinessLine = inferBusinessLineFromCategory(resolvedCategory, form.businessLine);
    const resolvedBrand =
      selectedBrandOption === manualBrandValue ? manualBrand.trim() : selectedBrandOption.trim();
    const name = form.name.trim();
    const quantity = form.quantity.trim();
    const price = Number(form.price);

    if (!name || !resolvedBrand || !quantity || !form.price.trim()) {
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
    if (!allowedBusinessLines.includes(resolvedBusinessLine)) {
      show('Selected product line is not allowed for your distributor type.', 'error');
      return;
    }

    const payload: Omit<Product, 'id'> = {
      distributorId: profile.id,
      name,
      brand: resolvedBrand,
      category: resolvedCategory,
      businessLine: resolvedBusinessLine,
      unit: quantity,
      quantity,
      price,
      available: form.available,
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

  const renderMobileCards = (items: Product[]) => (
    <div className="space-y-3">
      {items.map(product => (
        <div key={product.id} className={`card p-4 ${!product.available ? 'opacity-60' : ''}`}>
          <div className="flex items-start gap-3">
            <div className="w-16 h-16 rounded-xl bg-gray-100 flex items-center justify-center flex-shrink-0">
              <span className="text-2xl">{getCategoryEmoji(String(product.category))}</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <div className="font-semibold text-gray-900 text-sm truncate">{product.name}</div>
                  <div className="text-xs text-gray-500">
                    {product.brand} · {getProductQuantityText(product.quantity, product.unit)}
                  </div>
                  <div className="font-bold text-gray-900 mt-1">Rs {product.price}</div>
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
                <span className="badge bg-blue-50 text-blue-700 text-xs">
                  {inferBusinessLineFromCategory(String(product.category || 'other'), product.businessLine) === 'icecream'
                    ? 'Ice Cream'
                    : 'Dairy'}
                </span>
                <button
                  onClick={() => void toggleAvailability(product)}
                  className={`badge cursor-pointer text-xs ${product.available ? 'badge-green' : 'badge-gray'}`}
                >
                  {product.available ? '● Available' : '○ Hidden'}
                </button>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  const renderDesktopTable = (items: Product[]) => (
    <div className="card overflow-hidden">
      <table className="w-full">
        <thead>
          <tr className="bg-gray-50 border-b border-gray-100">
            <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Product</th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Brand</th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Category</th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Quantity</th>
            <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Price</th>
            <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
            <th className="px-4 py-3" />
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {items.map(product => (
            <tr
              key={product.id}
              className={`hover:bg-gray-50 transition-colors ${!product.available ? 'opacity-50' : ''}`}
            >
              <td className="px-5 py-3">
                <div className="flex items-center gap-3">
                  <span className="text-lg">{getCategoryEmoji(String(product.category))}</span>
                  <span className="text-sm font-medium text-gray-900">{product.name}</span>
                </div>
              </td>
              <td className="px-4 py-3 text-sm text-gray-600">{product.brand}</td>
              <td className="px-4 py-3">
                <div className="flex items-center gap-2">
                  <span className="badge bg-gray-100 text-gray-600">
                    {formatCategoryLabel(String(product.category))}
                  </span>
                  <span className="badge bg-blue-50 text-blue-700">
                    {inferBusinessLineFromCategory(String(product.category || 'other'), product.businessLine) === 'icecream'
                      ? 'Ice Cream'
                      : 'Dairy'}
                  </span>
                </div>
              </td>
              <td className="px-4 py-3 text-sm text-gray-600">{getProductQuantityText(product.quantity, product.unit)}</td>
              <td className="px-4 py-3 text-right text-sm font-semibold text-gray-900">Rs {product.price}</td>
              <td className="px-4 py-3 text-center">
                <button
                  onClick={() => void toggleAvailability(product)}
                  className={`badge ${product.available ? 'badge-green' : 'badge-gray'} cursor-pointer hover:opacity-80`}
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
  );

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

      {/* Rank Widget */}
      <div className="bg-gradient-to-r from-amber-100 to-orange-50 border border-amber-200 rounded-xl p-4 flex items-center justify-between mb-5 shadow-sm animate-fade-in">
        <div className="flex items-center gap-4">
          <div className="bg-amber-200 p-2.5 rounded-full text-amber-700 shadow-inner">
            <Trophy size={24} />
          </div>
          <div>
            <h3 className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Global Rank</h3>
            <p className="text-2xl font-extrabold text-gray-900">#4</p>
          </div>
        </div>
        <div className="text-right">
          <button className="text-xs font-semibold bg-white/50 border border-amber-200 text-amber-700/70 px-3 py-1.5 rounded-md cursor-not-allowed" disabled>
            Leaderboard coming soon 🚀
          </button>
        </div>
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

      <div className="card p-3 md:p-4 mb-5">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            className="input pl-9"
            placeholder="Search by product, brand, quantity, category..."
            value={searchQuery}
            onChange={event => setSearchQuery(event.target.value)}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-2 mt-3">
          {distributorType === 'dual' ? (
            <select
              className="input"
              value={filterLine}
              onChange={event => setFilterLine(event.target.value as 'all' | BusinessLine)}
            >
              <option value="all">All Sections</option>
              <option value="dairy">Dairy Products</option>
              <option value="icecream">Ice Cream</option>
            </select>
          ) : (
            <div className="input bg-gray-50 text-gray-500 flex items-center">
              Section: {defaultBusinessLine === 'icecream' ? 'Ice Cream' : 'Dairy Products'}
            </div>
          )}

          <select className="input" value={filterBrand} onChange={event => setFilterBrand(event.target.value)}>
            <option value="all">All Brands</option>
            {filterBrands.map(brand => (
              <option key={brand} value={brand}>
                {brand}
              </option>
            ))}
          </select>

          <select
            className="input"
            value={filterStatus}
            onChange={event => setFilterStatus(event.target.value as 'all' | 'available' | 'hidden')}
          >
            <option value="all">All Status</option>
            <option value="available">Available Only</option>
            <option value="hidden">Hidden Only</option>
          </select>

          <button
            type="button"
            onClick={resetFilters}
            disabled={!hasActiveFilters}
            className={`inline-flex items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-sm font-medium transition-colors ${
              hasActiveFilters
                ? 'border-gray-300 text-gray-700 hover:bg-gray-50'
                : 'border-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            <SlidersHorizontal className="w-4 h-4" /> Reset Filters
          </button>
        </div>
        {preferredBrand && (
          <div className="mt-2 text-xs text-gray-500">
            Main Products are based on your primary brand: <span className="font-semibold text-gray-700">{preferredBrand}</span>.
            Other brands appear in <span className="font-semibold text-gray-700">More Products</span>.
          </div>
        )}
      </div>

      {filteredProducts.length === 0 ? (
        <EmptyState
          icon={<Package className="w-8 h-8" />}
          title={hasActiveFilters ? 'No products match your filters' : 'No products yet'}
          description={hasActiveFilters ? 'Try changing filters or search query.' : 'Add your first product to get started'}
          action={
            <button className="btn-primary" onClick={resetFormForAdd}>
              <Plus className="w-4 h-4" /> Add Product
            </button>
          }
        />
      ) : (
        <>
          <div className="md:hidden space-y-4">
            <section>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold text-gray-800">{mainSectionTitle}</h3>
                <span className="text-xs text-gray-500">{groupedProducts.main.length} items</span>
              </div>
              {renderMobileCards(groupedProducts.main)}
            </section>

            {hasBrandSplit && (
              <section>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-semibold text-gray-800">More Products</h3>
                  <span className="text-xs text-gray-500">{groupedProducts.more.length} items</span>
                </div>
                {renderMobileCards(groupedProducts.more)}
              </section>
            )}
          </div>

          <div className="hidden md:block space-y-5">
            <section>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold text-gray-800">{mainSectionTitle}</h3>
                <span className="text-xs text-gray-500">{groupedProducts.main.length} items</span>
              </div>
              {renderDesktopTable(groupedProducts.main)}
            </section>

            {hasBrandSplit && (
              <section>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-semibold text-gray-800">More Products</h3>
                  <span className="text-xs text-gray-500">{groupedProducts.more.length} items</span>
                </div>
                {renderDesktopTable(groupedProducts.more)}
              </section>
            )}
          </div>
        </>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editingProduct ? 'Edit Product' : 'Add Product'}>
        <div className="space-y-4">
          <div className="rounded-xl border border-blue-100 bg-blue-50 px-3 py-2 text-xs text-blue-700">
            Product image upload is disabled. Catalog icon will be auto-shown from product category.
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
            {distributorType === 'dual' && (
              <div className="col-span-2">
                <label className="label">Section</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => handleBusinessLineChange('dairy')}
                    className={`py-2 rounded-xl border text-sm font-medium ${
                      form.businessLine === 'dairy'
                        ? 'border-brand-500 bg-brand-50 text-brand-700'
                        : 'border-gray-300 text-gray-600'
                    }`}
                  >
                    Dairy Products
                  </button>
                  <button
                    type="button"
                    onClick={() => handleBusinessLineChange('icecream')}
                    className={`py-2 rounded-xl border text-sm font-medium ${
                      form.businessLine === 'icecream'
                        ? 'border-brand-500 bg-brand-50 text-brand-700'
                        : 'border-gray-300 text-gray-600'
                    }`}
                  >
                    Ice Cream
                  </button>
                </div>
              </div>
            )}

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
                {categoryOptionsForForm.map(category => (
                  <option key={category} value={category}>
                    {getCategoryEmoji(category)} {formatCategoryLabel(category)}
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

            <div className="col-span-2 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5">
              <div className="text-xs text-gray-500 mb-1">Auto Category Visual (Generic, no brand logo)</div>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-white border border-gray-200 text-xl">
                  {getCategoryEmoji(String(selectedCategoryForPreview))}
                </span>
                <span className="text-sm font-medium text-gray-700">
                  {formatCategoryLabel(String(selectedCategoryForPreview))}
                </span>
              </div>
            </div>

            <div>
              <label className="label">Quantity / Pack Size</label>
              <input
                className="input"
                type="text"
                placeholder="e.g. 500ml, 1, 1.5, half crate"
                value={form.quantity}
                onChange={event => setForm(current => ({ ...current, quantity: event.target.value }))}
              />
              <p className="text-xs text-gray-500 mt-1">You can enter text, integer, or float values.</p>
            </div>
            <div>
              <label className="label">Price (Rs)</label>
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
