import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingCart, Clock, AlertTriangle, Plus, Minus, Search } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useAppStore } from '../../store/appStore';
import { EmptyState } from '../../components/ui/EmptyState';
import { MobileHeader } from '../../components/layout/MobileHeader';
import type { Product, ProductCategory } from '../../types';

const categoryEmoji: Record<ProductCategory, string> = {
  milk: '🥛', paneer: '🧀', curd: '🍶', butter: '🧈', ghee: '🫙', other: '📦'
};

function ProductCard({ product, quantity, onQtyChange }: {
  product: Product;
  quantity: number;
  onQtyChange: (qty: number) => void;
}) {
  return (
    <div className={`card p-4 transition-all relative ${quantity > 0 ? 'ring-2 ring-brand-500 ring-offset-1 z-10' : 'z-0'}`}>
      {/* Product Image */}
      {product.imageUrl ? (
        <img src={product.imageUrl} alt={product.name} className="w-full h-32 object-cover rounded-xl mb-3" />
      ) : (
        <div className="w-full h-32 bg-gray-100 rounded-xl flex items-center justify-center mb-3">
          <span className="text-4xl">{categoryEmoji[product.category]}</span>
        </div>
      )}

      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-gray-900 text-sm truncate mb-0.5">{product.name}</div>
          <div className="text-xs text-gray-500">{product.brand} · {product.unit}</div>
        </div>
        <div className="text-right flex-shrink-0">
          <div className="font-bold text-gray-900">₹{product.price}</div>
        </div>
      </div>

      {/* Qty control */}
      <div className="flex items-center gap-2 relative z-20">
        {quantity === 0 ? (
          <button
            onClick={() => onQtyChange(1)}
            className="w-full btn-primary py-2 text-xs"
          >
            <Plus className="w-3.5 h-3.5" /> Add
          </button>
        ) : (
          <div className="flex items-center gap-2 w-full">
            <button
              onClick={() => onQtyChange(Math.max(0, quantity - 1))}
              className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors flex-shrink-0"
            >
              <Minus className="w-3.5 h-3.5 text-gray-700" />
            </button>
            <input
              type="number"
              className="flex-1 text-center font-bold text-gray-900 bg-brand-50 border border-brand-200 rounded-lg py-1.5 text-sm min-w-0"
              value={quantity}
              min={0}
              onChange={e => onQtyChange(Math.max(0, parseInt(e.target.value) || 0))}
            />
            <button
              onClick={() => onQtyChange(quantity + 1)}
              className="w-8 h-8 rounded-lg bg-brand-600 hover:bg-brand-700 flex items-center justify-center transition-colors flex-shrink-0"
            >
              <Plus className="w-3.5 h-3.5 text-white" />
            </button>
          </div>
        )}
      </div>
      {quantity > 0 && (
        <div className="mt-2 text-xs text-brand-600 font-medium text-center">
          Subtotal: ₹{(product.price * quantity).toLocaleString()}
        </div>
      )}
    </div>
  );
}

export function ShopCatalogPage() {
  const { user } = useAuthStore();
  const { products, connections, distributorProfiles, cart, setCartQuantity } = useAppStore();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState<ProductCategory | 'all'>('all');

  // Find active connection
  const activeConn = connections.find(c => c.shopkeeperId === user?.id?.replace('u', 'sp') && c.status === 'active')
    || connections.find(c => c.status === 'active' && c.shopkeeperName === user?.name);

  const distributorProfile = activeConn
    ? distributorProfiles.find(dp => dp.id === activeConn.distributorId)
    : null;

  // Check order window
  const now = new Date();
  const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  const isLate = distributorProfile
    ? currentTime > distributorProfile.orderWindowCutoff
    : false;
  const isBeforeWindow = distributorProfile
    ? currentTime < distributorProfile.orderWindowStart
    : false;

  const availableProducts = products.filter(p =>
    activeConn ? p.distributorId === activeConn.distributorId && p.available : false
  );

  const filtered = availableProducts.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.brand.toLowerCase().includes(search.toLowerCase());
    const matchCat = filterCat === 'all' || p.category === filterCat;
    return matchSearch && matchCat;
  });

  const categories = [...new Set(availableProducts.map(p => p.category))] as ProductCategory[];
  const cartTotal = cart.reduce((sum, c) => sum + c.product.price * c.quantity, 0);
  const cartCount = cart.reduce((sum, c) => sum + c.quantity, 0);

  if (!activeConn) {
    return (
      <div className="p-6 max-w-2xl mx-auto">
        <EmptyState
          icon={<AlertTriangle className="w-8 h-8" />}
          title="Not connected to a distributor"
          description="Connect with your distributor first to start ordering"
          action={
            <button className="btn-primary" onClick={() => navigate('/shop/connection')}>
              Connect Now
            </button>
          }
        />
      </div>
    );
  }

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <MobileHeader
        title="Order Now"
        subtitle={activeConn?.businessName}
      />
      {/* Desktop header */}
      <div className="hidden md:block mb-4">
        <h1 className="text-xl font-bold text-gray-900">Order Now</h1>
        <p className="text-sm text-gray-500">{activeConn.businessName}</p>
      </div>

      {/* Order window banner */}
      {distributorProfile && (
        <div className={`mb-4 p-3 rounded-xl flex items-center gap-3 ${
          isLate ? 'bg-yellow-50 border border-yellow-200' :
          isBeforeWindow ? 'bg-blue-50 border border-blue-200' :
          'bg-green-50 border border-green-200'
        }`}>
          <Clock className={`w-4 h-4 flex-shrink-0 ${isLate ? 'text-yellow-600' : isBeforeWindow ? 'text-blue-600' : 'text-green-600'}`} />
          <div className="flex-1">
            {isLate ? (
              <span className="text-sm text-yellow-800 font-medium">
                Order window closed at {distributorProfile.orderWindowCutoff} — this will be a <strong>late order</strong> (needs approval)
              </span>
            ) : isBeforeWindow ? (
              <span className="text-sm text-blue-800">
                Order window opens at {distributorProfile.orderWindowStart}
              </span>
            ) : (
              <span className="text-sm text-green-800 font-medium">
                Order window open until <strong>{distributorProfile.orderWindowCutoff}</strong> — orders are guaranteed
              </span>
            )}
          </div>
        </div>
      )}

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          className="input pl-9"
          placeholder="Search products..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {/* Category filter */}
      <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
        <button
          onClick={() => setFilterCat('all')}
          className={`px-3 py-1.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${filterCat === 'all' ? 'bg-brand-600 text-white' : 'bg-white border border-gray-200 text-gray-600'}`}
        >
          All
        </button>
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setFilterCat(cat)}
            className={`px-3 py-1.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all capitalize ${filterCat === cat ? 'bg-brand-600 text-white' : 'bg-white border border-gray-200 text-gray-600'}`}
          >
            {categoryEmoji[cat]} {cat}
          </button>
        ))}
      </div>

      {/* Products grid */}
      {filtered.length === 0 ? (
        <EmptyState icon={<Search className="w-8 h-8" />} title="No products found" />
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 mb-24">
          {filtered.map(product => {
            const cartItem = cart.find(c => c.product.id === product.id);
            return (
              <ProductCard
                key={product.id}
                product={product}
                quantity={cartItem?.quantity || 0}
                onQtyChange={qty => setCartQuantity(product, qty)}
              />
            );
          })}
        </div>
      )}

      {/* Cart bar */}
      {cart.length > 0 && (
        <div className="fixed bottom-16 md:bottom-0 left-0 md:left-60 right-0 p-4 bg-white border-t border-gray-200 shadow-lg z-30">
          <button
            className="btn-primary w-full max-w-lg mx-auto flex justify-between items-center py-3 px-5"
            onClick={() => navigate('/shop/review')}
          >
            <div className="flex items-center gap-2">
              <ShoppingCart className="w-4 h-4" />
              <span>{cartCount} items</span>
            </div>
            <span>Review Order →</span>
            <span className="font-bold">₹{cartTotal.toLocaleString()}</span>
          </button>
        </div>
      )}
    </div>
  );
}
