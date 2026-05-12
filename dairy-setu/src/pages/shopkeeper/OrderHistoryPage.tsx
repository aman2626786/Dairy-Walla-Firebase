import { useNavigate } from 'react-router-dom';
import { ShoppingCart, Clock, CheckCircle, XCircle, Package, RefreshCw } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useAppStore } from '../../store/appStore';
import { EmptyState } from '../../components/ui/EmptyState';
import { MobileHeader } from '../../components/layout/MobileHeader';
import { useToast } from '../../components/ui/Toast';
import { format, subDays } from 'date-fns';
import type { OrderStatus, PaymentStatus } from '../../types';
import type { ReactElement } from 'react';

const statusConfig: Record<OrderStatus, { label: string; className: string; icon: ReactElement }> = {
  pending: { label: 'Pending Approval', className: 'badge-yellow', icon: <Clock className="w-3 h-3" /> },
  accepted: { label: 'Accepted', className: 'badge-green', icon: <CheckCircle className="w-3 h-3" /> },
  rejected: { label: 'Rejected', className: 'badge-red', icon: <XCircle className="w-3 h-3" /> },
  fulfilled: { label: 'Delivered', className: 'badge-blue', icon: <CheckCircle className="w-3 h-3" /> },
};

const paymentConfig: Record<PaymentStatus, { label: string; className: string }> = {
  paid: { label: 'Payment Paid', className: 'badge-green' },
  unpaid: { label: 'Payment Unpaid', className: 'badge-red' },
};

export function OrderHistoryPage() {
  const { user } = useAuthStore();
  const { orders, setCartQuantity, clearCart, products } = useAppStore();
  const navigate = useNavigate();
  const { show } = useToast();

  const myOrders = orders.filter(o => o.shopkeeperName === user?.name);

  const yesterday = subDays(new Date(), 1).toISOString().split('T')[0];
  const yesterdayOrder = myOrders.find(o => o.deliveryDate === yesterday && o.status !== 'rejected');

  const handleRepeatOrder = () => {
    if (!yesterdayOrder) {
      show('Kal ka koi order nahi mila', 'error');
      return;
    }
    clearCart();
    yesterdayOrder.items.forEach(item => {
      const product = products.find(p => p.id === item.productId);
      if (product && product.available) {
        setCartQuantity(product, item.quantity);
      }
    });
    show(`${yesterdayOrder.items.length} items cart mein add ho gaye!`);
    navigate('/shop/review');
  };

  return (
    <div className="p-4 max-w-3xl mx-auto">
      <MobileHeader title="My Orders" subtitle={`${myOrders.length} orders`} />
      <div className="hidden md:block mb-6">
        <h1 className="text-xl font-bold text-gray-900">My Orders</h1>
        <p className="text-sm text-gray-500 mt-0.5">{myOrders.length} orders</p>
      </div>

      {yesterdayOrder && (
        <button
          onClick={handleRepeatOrder}
          className="w-full mb-4 p-4 bg-brand-50 border-2 border-brand-200 rounded-2xl flex items-center gap-3 hover:bg-brand-100 transition-colors text-left"
        >
          <div className="w-10 h-10 rounded-xl bg-brand-600 flex items-center justify-center flex-shrink-0">
            <RefreshCw className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1">
            <div className="font-semibold text-brand-800 text-sm">Kal ka Order Repeat Karo</div>
            <div className="text-xs text-brand-600 mt-0.5">
              {yesterdayOrder.items.length} items - Rs {yesterdayOrder.total.toLocaleString()}
            </div>
          </div>
          <ShoppingCart className="w-4 h-4 text-brand-600" />
        </button>
      )}

      {myOrders.length === 0 ? (
        <EmptyState
          icon={<Package className="w-8 h-8" />}
          title="No orders yet"
          description="Place your first order to get started"
          action={<button className="btn-primary" onClick={() => navigate('/shop')}><ShoppingCart className="w-4 h-4" /> Order Now</button>}
        />
      ) : (
        <div className="space-y-3">
          {myOrders.map(order => {
            const config = statusConfig[order.status];
            const payment = paymentConfig[order.paymentStatus];

            return (
              <div key={order.id} className="card p-4">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className={`${config.className} flex items-center gap-1`}>
                        {config.icon} {config.label}
                      </span>
                      <span className={payment.className}>{payment.label}</span>
                      {order.type === 'late' && <span className="badge-yellow text-xs">Late</span>}
                      {order.source === 'whatsapp' && <span className="badge bg-green-100 text-green-700 text-xs">WhatsApp</span>}
                    </div>
                    <div className="text-xs text-gray-500">
                      {format(new Date(order.placedAt), 'dd MMM yyyy, h:mm a')}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-gray-900">Rs {order.total.toLocaleString()}</div>
                    <div className="text-xs text-gray-500">{order.items.length} items</div>
                  </div>
                </div>
                <div className="space-y-1">
                  {order.items.map(item => (
                    <div key={item.id} className="flex justify-between text-xs text-gray-600">
                      <span>{item.productName} <span className="text-gray-400">({item.brand})</span></span>
                      <span>{item.quantity} x Rs {item.unitPrice}</span>
                    </div>
                  ))}
                </div>
                {order.status === 'rejected' && (
                  <div className="mt-3 p-2 bg-red-50 rounded-lg text-xs text-red-600">
                    This late order was not accepted by the distributor.
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
