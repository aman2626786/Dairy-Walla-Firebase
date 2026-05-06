import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, CheckCircle, XCircle, Package, Users, TrendingUp, AlertTriangle, ChevronRight } from 'lucide-react';
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
  const { orders, connections, distributorProfiles, updateOrderStatus, addNotification } = useAppStore();
  const { show } = useToast();
  const navigate = useNavigate();

  const profile = distributorProfiles.find(dp => dp.userId === user?.id);
  const today = new Date().toISOString().split('T')[0];

  const todayOrders = orders.filter(o => o.distributorId === profile?.id && o.deliveryDate === today);
  const normalOrders = todayOrders.filter(o => o.type === 'normal');
  const lateOrders = todayOrders.filter(o => o.type === 'late' && o.status === 'pending');
  const activeConnections = connections.filter(c => c.distributorId === profile?.id && c.status === 'active');
  const pendingConnections = connections.filter(c => c.distributorId === profile?.id && c.status === 'pending');

  const totalRevenue = todayOrders
    .filter(o => o.status === 'accepted' || o.status === 'fulfilled')
    .reduce((sum, o) => sum + o.total, 0);

  const handleAcceptLate = (order: Order) => {
    updateOrderStatus(order.id, 'accepted');
    addNotification({
      userId: order.shopkeeperId,
      type: 'order_accepted',
      message: `Your late order has been accepted by ${profile?.businessName}`,
      read: false,
      createdAt: new Date().toISOString(),
    });
    show(`Late order from ${order.shopName} accepted`);
  };

  const handleRejectLate = (order: Order) => {
    updateOrderStatus(order.id, 'rejected');
    addNotification({
      userId: order.shopkeeperId,
      type: 'order_rejected',
      message: `Your late order was not accepted by ${profile?.businessName}`,
      read: false,
      createdAt: new Date().toISOString(),
    });
    show(`Late order from ${order.shopName} rejected`, 'error');
  };

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
