import { useState } from 'react';
import { Plus, Edit2, Trash2, Package, Eye, EyeOff, Image as ImageIcon, X } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useAppStore } from '../../store/appStore';
import { useToast } from '../../components/ui/Toast';
import { Modal } from '../../components/ui/Modal';
import { EmptyState } from '../../components/ui/EmptyState';
import { MobileHeader } from '../../components/layout/MobileHeader';
import type { Product, ProductCategory } from '../../types';

const categories: ProductCategory[] = ['milk', 'paneer', 'curd', 'butter', 'ghee', 'other'];
const categoryEmoji: Record<ProductCategory, string> = {
  milk: '🥛', paneer: '🧀', curd: '🍶', butter: '🧈', ghee: '🫙', other: '📦'
};

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
  name: '', brand: '', category: 'milk', unit: '', price: '', available: true, imageUrl: ''
};

export function CatalogPage() {
  const { user } = useAuthStore();
  const { products, distributorProfiles, addProduct, updateProduct, deleteProduct } = useAppStore();
  const { show } = useToast();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [form, setForm] = useState<ProductFormData>(defaultForm);
  const [filterCat, setFilterCat] = useState<ProductCategory | 'all'>('all');

  const profile = distributorProfiles.find(dp => dp.userId === user?.id);
  const myProducts = products.filter(p => p.distributorId === profile?.id);
  const filtered = filterCat === 'all' ? myProducts : myProducts.filter(p => p.category === filterCat);

  const openAdd = () => {
    setEditingProduct(null);
    setForm(defaultForm);
    setModalOpen(true);
  };

  const openEdit = (product: Product) => {
    setEditingProduct(product);
    setForm({ name: product.name, brand: product.brand, category: product.category, unit: product.unit, price: String(product.price), available: product.available, imageUrl: product.imageUrl || '' });
    setModalOpen(true);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      show('Image size should be less than 2MB', 'error');
      return;
    }

    // Check file type
    if (!file.type.startsWith('image/')) {
      show('Please upload an image file', 'error');
      return;
    }

    // Convert to base64
    const reader = new FileReader();
    reader.onloadend = () => {
      setForm(f => ({ ...f, imageUrl: reader.result as string }));
      show('Image uploaded!');
    };
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    setForm(f => ({ ...f, imageUrl: '' }));
    show('Image removed');
  };

  const handleSave = () => {
    if (!form.name || !form.brand || !form.unit || !form.price) {
      show('Please fill all fields', 'error');
      return;
    }
    if (editingProduct) {
      updateProduct(editingProduct.id, { ...form, price: parseFloat(form.price) });
      show('Product updated');
    } else {
      addProduct({ ...form, price: parseFloat(form.price), distributorId: profile!.id });
      show('Product added');
    }
    setModalOpen(false);
  };

  const handleDelete = (id: string, name: string) => {
    if (confirm(`Delete "${name}"?`)) {
      deleteProduct(id);
      show('Product deleted', 'error');
    }
  };

  const toggleAvailability = (product: Product) => {
    updateProduct(product.id, { available: !product.available });
    show(product.available ? `${product.name} marked unavailable` : `${product.name} is now available`);
  };

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto">
      <MobileHeader title="Product Catalog" subtitle={`${myProducts.length} products`} />
      <div className="hidden md:flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Product Catalog</h1>
          <p className="text-sm text-gray-500 mt-0.5">{myProducts.length} products · {myProducts.filter(p => p.available).length} available</p>
        </div>
        <button className="btn-primary" onClick={openAdd}>
          <Plus className="w-4 h-4" /> Add Product
        </button>
      </div>
      {/* Mobile add button */}
      <div className="md:hidden flex justify-end mb-4">
        <button className="btn-primary" onClick={openAdd}>
          <Plus className="w-4 h-4" /> Add Product
        </button>
      </div>

      {/* Category filter */}
      <div className="flex gap-2 mb-5 overflow-x-auto pb-1">
        <button
          onClick={() => setFilterCat('all')}
          className={`px-3 py-1.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${filterCat === 'all' ? 'bg-brand-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}
        >
          All
        </button>
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setFilterCat(cat)}
            className={`px-3 py-1.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all capitalize ${filterCat === cat ? 'bg-brand-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}
          >
            {categoryEmoji[cat]} {cat}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={<Package className="w-8 h-8" />}
          title="No products yet"
          description="Add your first product to get started"
          action={<button className="btn-primary" onClick={openAdd}><Plus className="w-4 h-4" /> Add Product</button>}
        />
      ) : (
        <>
          {/* Mobile card list */}
          <div className="md:hidden space-y-3">
            {filtered.map(product => (
              <div key={product.id} className={`card p-4 ${!product.available ? 'opacity-60' : ''}`}>
                <div className="flex items-start gap-3">
                  {/* Product Image */}
                  {product.imageUrl ? (
                    <img src={product.imageUrl} alt={product.name} className="w-16 h-16 rounded-xl object-cover flex-shrink-0" />
                  ) : (
                    <div className="w-16 h-16 rounded-xl bg-gray-100 flex items-center justify-center flex-shrink-0">
                      <span className="text-2xl">{categoryEmoji[product.category]}</span>
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="font-semibold text-gray-900 text-sm truncate">{product.name}</div>
                        <div className="text-xs text-gray-500">{product.brand} · {product.unit}</div>
                        <div className="font-bold text-gray-900 mt-1">₹{product.price}</div>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <button onClick={() => openEdit(product)} className="p-1.5 rounded-lg hover:bg-gray-100">
                          <Edit2 className="w-3.5 h-3.5 text-gray-500" />
                        </button>
                        <button onClick={() => handleDelete(product.id, product.name)} className="p-1.5 rounded-lg hover:bg-red-50">
                          <Trash2 className="w-3.5 h-3.5 text-red-400" />
                        </button>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="badge bg-gray-100 text-gray-600 capitalize text-xs">{product.category}</span>
                      <button onClick={() => toggleAvailability(product)} className={`badge cursor-pointer text-xs ${product.available ? 'badge-green' : 'badge-gray'}`}>
                        {product.available ? '● Available' : '○ Hidden'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop table */}
          <div className="hidden md:block card overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Product</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Brand</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Category</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Unit</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Price</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map(product => (
                  <tr key={product.id} className={`hover:bg-gray-50 transition-colors ${!product.available ? 'opacity-50' : ''}`}>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        {product.imageUrl ? (
                          <img src={product.imageUrl} alt={product.name} className="w-10 h-10 rounded-lg object-cover" />
                        ) : (
                          <span className="text-lg">{categoryEmoji[product.category]}</span>
                        )}
                        <span className="text-sm font-medium text-gray-900">{product.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{product.brand}</td>
                    <td className="px-4 py-3">
                      <span className="badge bg-gray-100 text-gray-600 capitalize">{product.category}</span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{product.unit}</td>
                    <td className="px-4 py-3 text-right text-sm font-semibold text-gray-900">₹{product.price}</td>
                    <td className="px-4 py-3 text-center">
                      <button onClick={() => toggleAvailability(product)} className={`badge ${product.available ? 'badge-green' : 'badge-gray'} cursor-pointer hover:opacity-80`}>
                        {product.available ? <Eye className="w-3 h-3 mr-1" /> : <EyeOff className="w-3 h-3 mr-1" />}
                        {product.available ? 'Available' : 'Hidden'}
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 justify-end">
                        <button onClick={() => openEdit(product)} className="btn-ghost p-1.5">
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => handleDelete(product.id, product.name)} className="btn-ghost p-1.5 hover:text-red-500">
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

      {/* Product Form Modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editingProduct ? 'Edit Product' : 'Add Product'}>
        <div className="space-y-4">
          {/* Image Upload */}
          <div>
            <label className="label flex items-center gap-1.5">
              <ImageIcon className="w-3.5 h-3.5" />
              Product Image (Optional)
            </label>
            {form.imageUrl ? (
              <div className="relative inline-block">
                <img src={form.imageUrl} alt="Product" className="w-32 h-32 rounded-xl object-cover border-2 border-gray-200" />
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
              <input className="input" placeholder="e.g. Full Cream Milk" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
            </div>
            <div>
              <label className="label">Brand</label>
              <input className="input" placeholder="e.g. Amul" value={form.brand} onChange={e => setForm(f => ({ ...f, brand: e.target.value }))} />
            </div>
            <div>
              <label className="label">Category</label>
              <select className="input" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value as ProductCategory }))}>
                {categories.map(c => <option key={c} value={c} className="capitalize">{categoryEmoji[c]} {c}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Unit</label>
              <input className="input" placeholder="e.g. 500ml pouch" value={form.unit} onChange={e => setForm(f => ({ ...f, unit: e.target.value }))} />
            </div>
            <div>
              <label className="label">Price (₹)</label>
              <input className="input" type="number" placeholder="0" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setForm(f => ({ ...f, available: !f.available }))}
              className={`relative w-10 h-5 rounded-full transition-colors ${form.available ? 'bg-brand-600' : 'bg-gray-300'}`}
            >
              <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${form.available ? 'translate-x-5' : 'translate-x-0.5'}`} />
            </button>
            <span className="text-sm text-gray-700">Available for ordering</span>
          </div>
          <div className="flex gap-3 pt-2">
            <button className="btn-secondary flex-1" onClick={() => setModalOpen(false)}>Cancel</button>
            <button className="btn-primary flex-1" onClick={handleSave}>
              {editingProduct ? 'Save Changes' : 'Add Product'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
