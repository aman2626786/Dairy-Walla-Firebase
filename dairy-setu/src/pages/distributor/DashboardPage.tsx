import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, BarChartHorizontal, CheckCircle, ChevronRight, Clock, MessageSquare, MessageSquareWarning, Package, Phone, TrendingUp, Users, XCircle } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useAppStore } from '../../store/appStore';
import { useToast } from '../../components/ui/Toast';
import { MobileHeader } from '../../components/layout/MobileHeader';
import { format } from 'date-fns';
import type { Order } from '../../types';

function OrderCard({ order, onAccept, onReject, showActions }: {
  order: Order;
  onAccept?: () => void;
  onReject?: () => void;
  showActions?: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className="card p-4 hover:shadow-card-hover transition-shadow">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-semibold text-gray-900 text-sm">{order.shopName}</span>
            {order.source === 'whatsapp' && (
              <span className="badge bg-green-100 text-green-700 text-xs">WhatsApp</span>
            )}
          </div>
          <div className="text-xs text-gray-500 mb-2">
            {order.shopkeeperName} · {format(new Date(order.placedAt), 'h:mm a')}
            {order.deliveryGroupName && ` · ${order.deliveryGroupName}`}
          </div>
          <div className="text-sm font-semibold text-gray-900">₹{order.total.toLocaleString()}</div>
          <div className="text-xs text-gray-500">{order.items.length} items</div>
        </div>
        <div className="flex flex-col items-end gap-2">
          {showActions && (
            <div className="flex gap-2">
              <button onClick={onAccept} className="btn-primary py-1.5 px-3 text-xs">
                <CheckCircle className="w-3.5 h-3.5" /> Accept
              </button>
              <button onClick={onReject} className="btn-danger py-1.5 px-3 text-xs">
                <XCircle className="w-3.5 h-3.5" /> Reject
              </button>
            </div>
          )}
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-xs text-brand-600 hover:underline flex items-center gap-1"
          >
            {expanded ? 'Hide' : 'View'} items
            <ChevronRight className={`w-3 h-3 transition-transform ${expanded ? 'rotate-90' : ''}`} />
          </button>
        </div>
      </div>
      {expanded && (
        <div className="mt-3 pt-3 border-t border-gray-100 space-y-1.5 animate-fade-in">
          {order.items.map(item => (
            <div key={item.id} className="flex justify-between text-xs text-gray-600">
              <span>{item.productName} <span className="text-gray-400">({item.brand})</span></span>
              <span className="font-medium">{item.quantity} × ₹{item.unitPrice} = ₹{(item.quantity * item.unitPrice).toLocaleString()}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function DashboardPage() {
  const { user } = useAuthStore();
  const { orders, connections, distributorProfiles, shopkeeperProfiles, updateOrderStatus, addNotification, fetchShopkeeperProfileById } = useAppStore();
  const { show } = useToast();
  const navigate = useNavigate();
  const [remindAllLoading, setRemindAllLoading] = useState(false);
  // const [remindWhatsappLoading, setRemindWhatsappLoading] = useState(false);

  const profile = distributorProfiles.find(dp => dp.userId === user?.id);
  const today = new Date().toISOString().split('T')[0];

  const todayOrders = orders.filter(o => o.distributorId === profile?.id && o.deliveryDate?.startsWith(today));
  const normalOrders = todayOrders.filter(o => o.type === 'normal');
  const lateOrders = todayOrders.filter(o => o.type === 'late' && o.status === 'pending');
  const activeConnections = connections.filter(c => c.distributorId === profile?.id && c.status === 'active');
  const pendingConnections = connections.filter(c => c.distributorId === profile?.id && c.status === 'pending');

  const totalRevenue = todayOrders
    .filter(o => o.status === 'accepted' || o.status === 'fulfilled')
    .reduce((sum, o) => sum + o.total, 0);

  const shopkeepersWhoOrderedToday = useMemo(() => {
    const orderedShopkeeperIds = new Set<string>();
    todayOrders.forEach(order => orderedShopkeeperIds.add(order.shopkeeperId));
    return orderedShopkeeperIds;
  }, [todayOrders]);

  const shopkeepersNotOrdered = useMemo(() => {
    return activeConnections.filter(conn => !shopkeepersWhoOrderedToday.has(conn.shopkeeperId)).sort((a, b) => a.shopName.localeCompare(b.shopName));
  }, [activeConnections, shopkeepersWhoOrderedToday]);


  const topSellingProducts = useMemo(() => {
    const productSales = new Map<string, { id: string; name: string; brand: string; unit: string; quantity: number }>();

    todayOrders
      .filter(o => o.status === 'accepted' || o.status === 'fulfilled')
      .forEach(order => {
        order.items.forEach(item => {
          const existing = productSales.get(item.productId);
          if (existing) {
            existing.quantity += item.quantity;
          } else {
            productSales.set(item.productId, {
              id: item.productId,
              name: item.productName,
              brand: item.brand,
              unit: item.unit,
              quantity: item.quantity,
            });
          }
        });
      });

    return Array.from(productSales.values())
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5);
  }, [todayOrders]);

  const handleAcceptLate = (order: Order) => {
    updateOrderStatus(order.id, 'accepted');
    const shopProfile = shopkeeperProfiles.find(sp => sp.id === order.shopkeeperId);
    if (shopProfile?.userId) {
      addNotification({
        userId: shopProfile.userId,
        type: 'order_accepted',
        message: `Your late order has been accepted by ${profile?.businessName}`,
        read: false,
        createdAt: new Date().toISOString(),
      });
    }
    show(`Late order from ${order.shopName} accepted`);
  };

  const handleRejectLate = (order: Order) => {
    updateOrderStatus(order.id, 'rejected');
    const shopProfile = shopkeeperProfiles.find(sp => sp.id === order.shopkeeperId);
    if (shopProfile?.userId) {
      addNotification({
        userId: shopProfile.userId,
        type: 'order_rejected',
        message: `Your late order was not accepted by ${profile?.businessName}`,
        read: false,
        createdAt: new Date().toISOString(),
      });
    }
    show(`Late order from ${order.shopName} rejected`, 'error');
  };

  const handleRemindAll = async () => {
    if (!profile || shopkeepersNotOrdered.length === 0) return;

    setRemindAllLoading(true);

    const getProfiles = () => useAppStore.getState().shopkeeperProfiles;

    const missingProfileIds = shopkeepersNotOrdered
      .map(conn => conn.shopkeeperId)
      .filter(id => !getProfiles().some(p => p.id === id));

    if (missingProfileIds.length > 0) {
      try {
        await Promise.all(missingProfileIds.map(id => fetchShopkeeperProfileById(id)));
      } catch (_error) {
        show('Failed to fetch shopkeeper details. Please try again.', 'error');
        setRemindAllLoading(false);
        return;
      }
    }

    const latestShopkeeperProfiles = getProfiles();
    let remindedCount = 0;
    const failedNames: string[] = [];

    shopkeepersNotOrdered.forEach(conn => {
      const shopProfile = latestShopkeeperProfiles.find(sp => sp.id === conn.shopkeeperId);
      if (shopProfile?.userId) {
        addNotification({
          userId: shopProfile.userId,
          type: 'order_reminder',
          message: `Reminder from ${profile.businessName}: You have not placed your order for today.`,
          read: false,
          createdAt: new Date().toISOString(),
        });
        remindedCount++;
      } else {
        failedNames.push(conn.shopName);
      }
    });

    setRemindAllLoading(false);

    if (remindedCount > 0) {
      show(`Sent reminders to ${remindedCount} shopkeeper${remindedCount > 1 ? 's' : ''}.`);
    }
    if (failedNames.length > 0) {
      show(`Could not remind: ${failedNames.join(', ')}. Their profile is incomplete.`, 'error');
    } else if (remindedCount === 0 && shopkeepersNotOrdered.length > 0) {
      show('Could not send reminders. No users to remind or data is incomplete.', 'error');
    }
  };

  // const handleRemindAllViaWhatsapp = async () => {
  //   const remindShopkeepersViaWhatsapp = (useAppStore.getState() as any).remindShopkeepersViaWhatsapp;
  //   if (!profile || shopkeepersNotOrdered.length === 0) return;
  //   if (!remindShopkeepersViaWhatsapp) {
  //     show('WhatsApp reminder feature is not available yet.', 'error');
  //     return;
  //   }

  //   setRemindWhatsappLoading(true);
  //   const shopkeeperIds = shopkeepersNotOrdered.map(conn => conn.shopkeeperId);

  //   try {
  //     const { remindedCount, failedNames } = await remindShopkeepersViaWhatsapp(shopkeeperIds, `Reminder from ${profile.businessName}: You have not placed your order for today.`);
  //     if (remindedCount > 0) {
  //       show(`Sent WhatsApp reminders to ${remindedCount} shopkeeper${remindedCount > 1 ? 's' : ''}.`);
  //     }
  //     if (failedNames.length > 0) {
  //       show(`Could not send WhatsApp to: ${failedNames.join(', ')}. Check their phone numbers.`, 'error');
  //     }
  //   } finally {
  //     setRemindWhatsappLoading(false);
  //   }
  // };

  const stats = [
    { label: 'Normal Orders', value: normalOrders.length, icon: <CheckCircle className="w-5 h-5" />, color: 'text-green-600 bg-green-50', sub: 'Today' },
    { label: 'Late Orders', value: lateOrders.length, icon: <Clock className="w-5 h-5" />, color: 'text-yellow-600 bg-yellow-50', sub: 'Pending approval' },
    { label: 'Active Shops', value: activeConnections.length, icon: <Users className="w-5 h-5" />, color: 'text-blue-600 bg-blue-50', sub: `${pendingConnections.length} pending` },
    { label: "Today's Revenue", value: `₹${totalRevenue.toLocaleString()}`, icon: <TrendingUp className="w-5 h-5" />, color: 'text-purple-600 bg-purple-50', sub: 'Confirmed orders' },
  ];

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto">
      <MobileHeader
        title={`Good ${new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'}, ${user?.name?.split(' ')[0]}!`}
        subtitle={`${profile?.businessName} · Cutoff: ${profile?.orderWindowCutoff}`}
      />
      {/* Header — desktop only */}
      <div className="hidden md:block mb-6">
        <h1 className="text-xl font-bold text-gray-900">Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'}, {user?.name?.split(' ')[0]} 👋</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          {profile?.businessName} · Order window: {profile?.orderWindowStart} – {profile?.orderWindowCutoff}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {stats.map(stat => (
          <div key={stat.label} className="card p-4">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 ${stat.color}`}>
              {stat.icon}
            </div>
            <div className="text-xl font-bold text-gray-900">{stat.value}</div>
            <div className="text-xs font-medium text-gray-700 mt-0.5">{stat.label}</div>
            <div className="text-xs text-gray-400">{stat.sub}</div>
          </div>
        ))}
      </div>

      {/* Shopkeepers Not Ordered Today */}
      <div className="card p-4 mb-6">
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-red-600" />
            <h2 className="font-semibold text-gray-900 text-sm">Shopkeepers Not Ordered (Today)</h2>
            {shopkeepersNotOrdered.length > 0 && <span className="badge-red">{shopkeepersNotOrdered.length}</span>}
          </div>
          {shopkeepersNotOrdered.length > 0 && (
            <div className="flex items-center gap-2">
              <button onClick={handleRemindAll} disabled={remindAllLoading} className="btn-secondary py-1 px-2.5 text-xs disabled:opacity-70">
                {remindAllLoading ? (
                  'Sending...'
                ) : (
                  <><MessageSquareWarning className="w-3.5 h-3.5" /> Remind (App)</>
                )}
              </button>
              {/* <button onClick={handleRemindAllViaWhatsapp} disabled={remindWhatsappLoading} className="btn-secondary py-1 px-2.5 text-xs disabled:opacity-70">
                {remindWhatsappLoading ? (
                  'Sending...'
                ) : (
                  <><MessageSquare className="w-3.5 h-3.5 text-green-600" /> Remind (WA)</>
                )}
              </button> */}
            </div>
          )}
        </div>
        {shopkeepersNotOrdered.length > 0 ? (
          <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
            {shopkeepersNotOrdered.map(conn => {
              const shopkeeperPhone = conn.shopkeeperPhone?.trim();
              const shopkeeperTel = shopkeeperPhone?.replace(/[^\d]/g, '').slice(-10);
              return (
                <div key={conn.id} className="flex items-center justify-between gap-3 p-2 rounded-lg bg-gray-50">
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-gray-800 truncate">{conn.shopName}</div>
                    <div className="text-xs text-gray-500 truncate">{conn.shopkeeperName}</div>
                  </div>
                  {shopkeeperTel && shopkeeperTel.length === 10 && (
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <a href={`https://wa.me/91${shopkeeperTel}`} target="_blank" rel="noopener noreferrer" className="btn-secondary p-2">
                        <MessageSquare className="w-4 h-4 text-green-600" />
                      </a>
                      <a href={`tel:${shopkeeperTel}`} className="btn-secondary p-2">
                        <Phone className="w-4 h-4" />
                      </a>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-4 text-sm text-gray-500">All active shopkeepers have placed an order today!</div>
        )}
      </div>

      {/* Pending connections alert */}
      {pendingConnections.length > 0 && (
        <div
          className="mb-5 p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-3 cursor-pointer hover:bg-amber-100 transition-colors"
          onClick={() => navigate('/distributor/connections')}
        >
          <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0" />
          <div className="flex-1">
            <div className="text-sm font-semibold text-amber-800">
              {pendingConnections.length} new connection request{pendingConnections.length > 1 ? 's' : ''}
            </div>
            <div className="text-xs text-amber-600">Tap to review and approve</div>
          </div>
          <ChevronRight className="w-4 h-4 text-amber-600" />
        </div>
      )}

      {/* Top Selling Products */}
      <div className="card p-4 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <BarChartHorizontal className="w-5 h-5 text-purple-600" />
          <h2 className="font-semibold text-gray-900 text-sm">Top 5 Selling Products (Today)</h2>
        </div>
        {topSellingProducts.length > 0 ? (
          <div className="space-y-3">
            {topSellingProducts.map((product, index) => (
              <div key={product.id} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="font-mono text-xs text-gray-400 w-4 text-center">{index + 1}.</span>
                  <div className="min-w-0">
                    <div className="font-medium text-gray-800 truncate">{product.name}</div>
                    <div className="text-xs text-gray-500">{product.brand}</div>
                  </div>
                </div>
                <div className="font-bold text-gray-900 flex-shrink-0 ml-2">
                  {product.quantity} <span className="text-xs font-normal text-gray-400">{product.unit}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-4 text-sm text-gray-500">
            <p>No sales data for today yet.</p>
            <p className="text-xs text-gray-400 mt-1">Accept orders to see top selling products here.</p>
          </div>
        )}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Normal Orders */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500" />
              <h2 className="font-semibold text-gray-900 text-sm">Normal Orders</h2>
              <span className="badge-green">{normalOrders.length}</span>
            </div>
            <button onClick={() => navigate('/distributor/orders')} className="text-xs text-brand-600 hover:underline">
              View all
            </button>
          </div>
          {normalOrders.length === 0 ? (
            <div className="card p-6 text-center">
              <Package className="w-8 h-8 text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-gray-500">No orders yet today</p>
            </div>
          ) : (
            <div className="space-y-3">
              {normalOrders.slice(0, 3).map(order => (
                <OrderCard key={order.id} order={order} />
              ))}
              {normalOrders.length > 3 && (
                <button onClick={() => navigate('/distributor/orders')} className="w-full text-xs text-brand-600 hover:underline py-2">
                  +{normalOrders.length - 3} more orders
                </button>
              )}
            </div>
          )}
        </div>

        {/* Late Orders */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-yellow-500" />
              <h2 className="font-semibold text-gray-900 text-sm">Late Orders</h2>
              <span className="badge-yellow">{lateOrders.length}</span>
            </div>
            <span className="text-xs text-gray-400">Needs approval</span>
          </div>
          {lateOrders.length === 0 ? (
            <div className="card p-6 text-center">
              <Clock className="w-8 h-8 text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-gray-500">No late orders</p>
            </div>
          ) : (
            <div className="space-y-3">
              {lateOrders.map(order => (
                <OrderCard
                  key={order.id}
                  order={order}
                  showActions
                  onAccept={() => handleAcceptLate(order)}
                  onReject={() => handleRejectLate(order)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
