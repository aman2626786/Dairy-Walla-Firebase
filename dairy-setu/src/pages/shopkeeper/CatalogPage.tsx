import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingCart, Clock, AlertTriangle, Plus, Minus, Search } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useAppStore } from '../../store/appStore';
import { EmptyState } from '../../components/ui/EmptyState';
import { MobileHeader } from '../../components/layout/MobileHeader';
import type { KnownProductCategory, Product, ProductCategory } from '../../types';

const knownCategoryEmoji: Record<KnownProductCategory, string> = {
  milk: 'M',
  paneer: 'P',
  curd: 'C',
  butter: 'B',
  ghee: 'G',
  other: 'O',
};

const normalizeCategory = (value: string): ProductCategory =>
  (value.trim().toLowerCase().replace(/\s+/g, ' ') || 'other') as ProductCategory;

const getCategoryEmoji = (category: string): string =>
  knownCategoryEmoji[normalizeCategory(category) as KnownProductCategory] || 'O';

function ProductCard({ product, quantity, onQtyChange, canAdd }: {
  product: Product;
  quantity: number;
  onQtyChange: (qty: number) => void;
  canAdd: boolean;
}) {
  return (
    <div className={`card p-4 transition-all relative ${quantity > 0 ? 'ring-2 ring-brand-500 ring-offset-1 z-10' : 'z-0'}`}>
      {product.imageUrl ? (
        <img src={product.imageUrl} alt={product.name} className="w-full h-32 object-cover rounded-xl mb-3" />
      ) : (
        <div className="w-full h-32 bg-gray-100 rounded-xl flex items-center justify-center mb-3">
          <span className="text-2xl font-semibold text-gray-500">{getCategoryEmoji(String(product.category))}</span>
        </div>
      )}

      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-gray-900 text-sm truncate mb-0.5">{product.name}</div>
          <div className="text-xs text-gray-500">{product.brand} - {product.unit}</div>
        </div>
        <div className="text-right flex-shrink-0">
          <div className="font-bold text-gray-900">Rs {product.price}</div>
        </div>
      </div>

      <div className="flex items-center gap-2 relative z-20">
        {quantity === 0 ? (
          canAdd ? (
          <button onClick={() => onQtyChange(1)} className="w-full btn-primary py-2 text-xs">
            <Plus className="w-3.5 h-3.5" /> Add
          </button>
          ) : (
            <div className="w-full py-2 text-xs text-center text-gray-400 border border-gray-200 rounded-xl bg-gray-50">
              Locked for this order
            </div>
          )
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
          Subtotal: Rs {(product.price * quantity).toLocaleString()}
        </div>
      )}
    </div>
  );
}

export function ShopCatalogPage() {
  const { user } = useAuthStore();
  const { products, connections, distributorProfiles, shopkeeperProfiles, cart, setCartQuantity, fetchProducts } = useAppStore();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState<ProductCategory | 'all'>('all');

  const shopProfile = shopkeeperProfiles.find(sp => sp.userId === user?.id);

  const activeConnections = useMemo(
    () => connections.filter(c => c.shopkeeperId === shopProfile?.id && c.status === 'active'),
    [connections, shopProfile?.id]
  );

  useEffect(() => {
    if (activeConnections.length === 0) return;
    const distributorIds = [...new Set(activeConnections.map(c => c.distributorId))];
    distributorIds.forEach(id => {
      void fetchProducts(id);
    });
  }, [activeConnections, fetchProducts]);

  const now = new Date();
  const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

  const availableProducts = products.filter(
    p => activeConnections.some(c => c.distributorId === p.distributorId) && p.available
  );

  const categories = [...new Set(availableProducts.map(p => normalizeCategory(String(p.category))))] as ProductCategory[];

  const uniqueConnections = useMemo(() => {
    const byDistributor = new Map<string, typeof activeConnections[number]>();
    activeConnections.forEach(conn => {
      if (!byDistributor.has(conn.distributorId)) {
        byDistributor.set(conn.distributorId, conn);
      }
    });
    return Array.from(byDistributor.values());
  }, [activeConnections]);

  const groupedByDistributor = uniqueConnections.map(conn => {
    const distributorProfile = distributorProfiles.find(dp => dp.id === conn.distributorId);
    const isLate = distributorProfile ? currentTime > distributorProfile.orderWindowCutoff : false;
    const isBeforeWindow = distributorProfile ? currentTime < distributorProfile.orderWindowStart : false;

    const items = products.filter(p => {
      if (p.distributorId !== conn.distributorId || !p.available) return false;
      const matchSearch =
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.brand.toLowerCase().includes(search.toLowerCase());
      const matchCat = filterCat === 'all' || normalizeCategory(String(p.category)) === filterCat;
      return matchSearch && matchCat;
    });

    return { conn, distributorProfile, isLate, isBeforeWindow, items };
  });

  const filteredCount = groupedByDistributor.reduce((sum, group) => sum + group.items.length, 0);
  const hasAnyProducts = groupedByDistributor.some(group => group.items.length > 0);
  const visibleGroups = hasAnyProducts
    ? groupedByDistributor.filter(group => group.items.length > 0)
    : groupedByDistributor;
  const lockedDistributorId = cart[0]?.product.distributorId || null;
  const cartTotal = cart.reduce((sum, c) => sum + c.product.price * c.quantity, 0);
  const cartCount = cart.reduce((sum, c) => sum + c.quantity, 0);

  if (activeConnections.length === 0) {
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
      <MobileHeader title="Order Now" subtitle={shopProfile?.shopName || 'Connected distributors'} />
      <div className="hidden md:block mb-4">
        <h1 className="text-xl font-bold text-gray-900">Order Now</h1>
        <p className="text-sm text-gray-500">{shopProfile?.shopName || 'Connected distributors'}</p>
      </div>

      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          className="input pl-9"
          placeholder="Search products..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

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
            {getCategoryEmoji(String(cat))} {String(cat)}
          </button>
        ))}
      </div>

      {filteredCount === 0 ? (
        <EmptyState icon={<Search className="w-8 h-8" />} title="No products found" />
      ) : (
        <div className="space-y-6 mb-24">
          {visibleGroups.map(group => (
            <section key={group.conn.id} className="card p-4">
              <div className="mb-3">
                <h2 className="text-base font-bold text-gray-900">{group.conn.businessName}</h2>
                <p className="text-xs text-gray-500">{group.conn.shopName}</p>
              </div>
              {lockedDistributorId && lockedDistributorId !== group.conn.distributorId && (
                <div className="mb-3 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                  First distributor already selected in cart. Place this order first to add from another distributor.
                </div>
              )}

              {group.distributorProfile && (
                <div className={`mb-4 p-3 rounded-xl flex items-center gap-3 ${
                  group.isLate
                    ? 'bg-yellow-50 border border-yellow-200'
                    : group.isBeforeWindow
                      ? 'bg-blue-50 border border-blue-200'
                      : 'bg-green-50 border border-green-200'
                }`}>
                  <Clock
                    className={`w-4 h-4 flex-shrink-0 ${
                      group.isLate ? 'text-yellow-600' : group.isBeforeWindow ? 'text-blue-600' : 'text-green-600'
                    }`}
                  />
                  <div className="flex-1">
                    {group.isLate ? (
                      <span className="text-sm text-yellow-800 font-medium">
                        Order window closed at {group.distributorProfile.orderWindowCutoff} - late order
                      </span>
                    ) : group.isBeforeWindow ? (
                      <span className="text-sm text-blue-800">
                        Order window opens at {group.distributorProfile.orderWindowStart}
                      </span>
                    ) : (
                      <span className="text-sm text-green-800 font-medium">
                        Order window open until <strong>{group.distributorProfile.orderWindowCutoff}</strong>
                      </span>
                    )}
                  </div>
                </div>
              )}

              {group.items.length === 0 ? (
                <div className="text-sm text-gray-500 py-3">No products for this distributor.</div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {group.items.map(product => {
                    const cartItem = cart.find(c => c.product.id === product.id);
                    const canAdd =
                      !!cartItem || !lockedDistributorId || lockedDistributorId === group.conn.distributorId;
                    return (
                      <ProductCard
                        key={product.id}
                        product={product}
                        quantity={cartItem?.quantity || 0}
                        canAdd={canAdd}
                        onQtyChange={qty => setCartQuantity(product, qty)}
                      />
                    );
                  })}
                </div>
              )}
            </section>
          ))}
        </div>
      )}

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
            <span>Review Order {'->'}</span>
            <span className="font-bold">Rs {cartTotal.toLocaleString()}</span>
          </button>
        </div>
      )}
    </div>
  );
}
