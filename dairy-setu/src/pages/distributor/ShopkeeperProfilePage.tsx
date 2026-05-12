import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, CalendarDays, Clock, MapPin, Phone, User2 } from 'lucide-react';
import { format } from 'date-fns';
import { MobileHeader } from '../../components/layout/MobileHeader';
import { useAppStore } from '../../store/appStore';
import { useAuthStore } from '../../store/authStore';
import { Modal } from '../../components/ui/Modal';
import { useToast } from '../../components/ui/Toast';
import type { Order, PaymentStatus } from '../../types';
import { downloadInvoicePdf } from '../../utils/invoicePdf';
import { getInvoiceLanguage, setInvoiceLanguage, type InvoiceLanguage } from '../../utils/invoiceLanguage';

export function ShopkeeperProfilePage() {
  const { shopkeeperId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { connections, orders, shopkeeperProfiles, distributorProfiles, fetchShopkeeperProfileById, updateOrderPaymentStatus } = useAppStore();
  const { show } = useToast();
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [fromTime, setFromTime] = useState('');
  const [toTime, setToTime] = useState('');
  const [selectedInvoiceOrder, setSelectedInvoiceOrder] = useState<Order | null>(null);
  const [invoiceLanguage, setInvoiceLanguageState] = useState<InvoiceLanguage>(
    () => getInvoiceLanguage()
  );

  useEffect(() => {
    if (!shopkeeperId) return;
    const existing = shopkeeperProfiles.find(sp => sp.id === shopkeeperId);
    if (!existing) {
      fetchShopkeeperProfileById(shopkeeperId).catch(() => undefined);
    }
  }, [fetchShopkeeperProfileById, shopkeeperId, shopkeeperProfiles]);

  const shopkeeper = shopkeeperProfiles.find(sp => sp.id === shopkeeperId);
  const connection = connections.find(c => c.shopkeeperId === shopkeeperId);
  const shopkeeperPhone = (shopkeeper?.phone || connection?.shopkeeperPhone || '').trim();
  const shopkeeperTel = shopkeeperPhone.replace(/[^\d+]/g, '');

  const myOrdersForShopkeeper = useMemo(() => {
    const base = orders
      .filter(o => o.shopkeeperId === shopkeeperId)
      .sort((a, b) => new Date(b.placedAt).getTime() - new Date(a.placedAt).getTime());

    return base.filter(order => {
      const orderDate = new Date(order.placedAt);
      if (fromDate) {
        const from = new Date(`${fromDate}T00:00:00`);
        if (orderDate < from) return false;
      }
      if (toDate) {
        const to = new Date(`${toDate}T23:59:59`);
        if (orderDate > to) return false;
      }
      if (fromTime) {
        const hhmm = format(orderDate, 'HH:mm');
        if (hhmm < fromTime) return false;
      }
      if (toTime) {
        const hhmm = format(orderDate, 'HH:mm');
        if (hhmm > toTime) return false;
      }
      return true;
    });
  }, [orders, shopkeeperId, fromDate, toDate, fromTime, toTime]);

  const canAccess = user?.role === 'distributor' && connection;
  const billableOrders = myOrdersForShopkeeper.filter(o => o.status === 'accepted' || o.status === 'fulfilled');
  const paymentStyles: Record<PaymentStatus, string> = {
    paid: 'badge-green',
    unpaid: 'badge-red',
  };

  const handlePaymentStatus = async (orderId: string, paymentStatus: PaymentStatus) => {
    try {
      await updateOrderPaymentStatus(orderId, paymentStatus);
      show(`Payment marked as ${paymentStatus === 'paid' ? 'paid' : 'unpaid'}`);
    } catch {
      show('Payment status save nahi hua. DB migration check karein.', 'error');
    }
  };

  const handleDownload = (order: Order) => {
    const distributor = distributorProfiles.find(dp => dp.userId === user?.id);
    if (!distributor) {
      show('Distributor profile missing. Please complete profile first.', 'error');
      return;
    }
    const shopkeeperPhone = (shopkeeper as unknown as { phone?: string } | undefined)?.phone;
    const shopkeeperEmail = (shopkeeper as unknown as { email?: string } | undefined)?.email;
    downloadInvoicePdf({
      order,
      distributor,
      shopkeeper,
      distributorPhone: user?.phone,
      distributorEmail: user?.email,
      shopkeeperPhone,
      shopkeeperEmail,
      language: invoiceLanguage,
    });
    show('Invoice PDF downloaded');
  };

  const handleShare = (order: Order) => {
    const text = `Invoice\n\nShop: ${order.shopName}\nDate: ${format(new Date(order.placedAt), 'dd MMM yyyy')}\n\nItems:\n${order.items.map(i => `${i.productName} x${i.quantity} = Rs ${i.quantity * i.unitPrice}`).join('\n')}\n\nTotal: Rs ${order.total.toLocaleString()}`;
    if (navigator.share) {
      navigator.share({ title: 'Invoice', text });
    } else {
      navigator.clipboard.writeText(text);
      show('Invoice copied to clipboard');
    }
  };

  if (!canAccess) {
    return (
      <div className="p-4 md:p-6 max-w-5xl mx-auto">
        <button onClick={() => navigate('/distributor/connections')} className="text-sm text-brand-600 hover:underline">
          <ArrowLeft className="w-4 h-4 inline mr-1" /> Back to Shopkeepers
        </button>
        <div className="card p-6 mt-4">
          <h1 className="font-semibold text-gray-900 mb-1">Shopkeeper not found</h1>
          <p className="text-sm text-gray-500">Aapko is shopkeeper ki profile access nahi hai.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto">
      <MobileHeader title={connection.shopName} subtitle={`Orders: ${myOrdersForShopkeeper.length}`} />
      <button onClick={() => navigate('/distributor/connections')} className="text-sm text-brand-600 hover:underline mb-3 md:hidden">
        <ArrowLeft className="w-4 h-4 inline mr-1" /> Back to Shopkeepers
      </button>

      <div className="hidden md:block mb-5">
        <button onClick={() => navigate('/distributor/connections')} className="text-sm text-brand-600 hover:underline mb-3">
          <ArrowLeft className="w-4 h-4 inline mr-1" /> Back to Shopkeepers
        </button>
        <h1 className="text-xl font-bold text-gray-900">{connection.shopName}</h1>
        <p className="text-sm text-gray-500 mt-0.5">Shopkeeper profile and complete order history</p>
      </div>

      <div className="card p-4 mb-5">
        <h2 className="font-semibold text-gray-900 text-sm mb-3">Basic Details</h2>
        <div className="grid md:grid-cols-2 gap-3 text-sm">
          <div className="flex items-center gap-2 text-gray-700"><User2 className="w-4 h-4 text-gray-400" /> {connection.shopkeeperName}</div>
          <div className="flex items-center gap-2 text-gray-700"><MapPin className="w-4 h-4 text-gray-400" /> {shopkeeper?.address || shopkeeper?.city || 'Address not added'}</div>
          <div className="flex items-center gap-2 text-gray-700"><Clock className="w-4 h-4 text-gray-400" /> {shopkeeper?.deliveryTiming || 'Delivery timing not added'}</div>
          <div className="flex items-center gap-2 text-gray-700"><MapPin className="w-4 h-4 text-gray-400" /> {shopkeeper?.locationName || 'Location not added'}</div>
          {shopkeeperPhone && (
            <div className="md:col-span-2 flex items-center justify-between gap-3 text-gray-700">
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-gray-400" />
                <span>{shopkeeperPhone}</span>
              </div>
              <a href={`tel:${shopkeeperTel}`} className="btn-secondary py-1 px-2 text-xs inline-flex items-center gap-1">
                <Phone className="w-3.5 h-3.5" /> Call
              </a>
            </div>
          )}
        </div>
      </div>

      <div className="card p-4 mb-4">
        <h2 className="font-semibold text-gray-900 text-sm mb-3">Filter Orders</h2>
        <div className="grid md:grid-cols-4 gap-3">
          <label className="text-xs text-gray-600">
            From Date
            <input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} className="mt-1 w-full border border-gray-300 rounded-lg px-2.5 py-2 text-sm" />
          </label>
          <label className="text-xs text-gray-600">
            To Date
            <input type="date" value={toDate} onChange={e => setToDate(e.target.value)} className="mt-1 w-full border border-gray-300 rounded-lg px-2.5 py-2 text-sm" />
          </label>
          <label className="text-xs text-gray-600">
            From Time
            <input type="time" value={fromTime} onChange={e => setFromTime(e.target.value)} className="mt-1 w-full border border-gray-300 rounded-lg px-2.5 py-2 text-sm" />
          </label>
          <label className="text-xs text-gray-600">
            To Time
            <input type="time" value={toTime} onChange={e => setToTime(e.target.value)} className="mt-1 w-full border border-gray-300 rounded-lg px-2.5 py-2 text-sm" />
          </label>
        </div>
      </div>

      <div className="card p-4 mb-5">
        <h2 className="font-semibold text-gray-900 text-sm mb-3">Generate Bill (Separate)</h2>
        <div className="flex items-center justify-between gap-3 mb-3">
          <p className="text-xs text-gray-600">Bill language</p>
          <select
            value={invoiceLanguage}
            onChange={e => {
              const next = e.target.value as InvoiceLanguage;
              setInvoiceLanguageState(next);
              setInvoiceLanguage(next);
            }}
            className="border border-gray-300 rounded-lg px-2.5 py-1.5 text-sm bg-white"
          >
            <option value="hinglish">Hinglish (Default)</option>
            <option value="english">English</option>
            <option value="hindi">Hindi</option>
          </select>
        </div>
        {billableOrders.length === 0 ? (
          <p className="text-sm text-gray-500">Accepted/Fulfilled orders aane par yahan se bill generate hoga.</p>
        ) : (
          <div className="space-y-2">
            {billableOrders.map(order => (
              <div key={order.id} className="flex items-center justify-between gap-3 p-3 rounded-xl bg-gray-50 border border-gray-100">
                <div>
                  <div className="text-sm font-medium text-gray-900">Order #{order.id.slice(0, 8)}</div>
                  <div className="text-xs text-gray-500">{format(new Date(order.placedAt), 'dd MMM yyyy, hh:mm a')} · Rs {order.total.toLocaleString()}</div>
                </div>
                <button
                  onClick={() => setSelectedInvoiceOrder(order)}
                  className="btn-primary py-1.5 px-3 text-xs"
                >
                  Generate Bill
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div>
        <h2 className="font-semibold text-gray-900 text-sm mb-3 flex items-center gap-2">
          <CalendarDays className="w-4 h-4 text-brand-600" />
          All Orders (Date-wise sequence)
        </h2>
        {myOrdersForShopkeeper.length === 0 ? (
          <div className="card p-5 text-sm text-gray-500">Is filter ke liye koi order nahi mila.</div>
        ) : (
          <div className="space-y-3">
            {myOrdersForShopkeeper.map(order => (
              <div key={order.id} className="card p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold text-gray-900">Order #{order.id.slice(0, 8)}</div>
                    <div className="text-xs text-gray-500 mt-1">{format(new Date(order.placedAt), 'dd MMM yyyy, hh:mm a')}</div>
                    <div className="text-xs text-gray-500 mt-0.5">
                      Status: {order.status} - Type: {order.type}
                      <span className={`ml-2 ${paymentStyles[order.paymentStatus]}`}>
                        {order.paymentStatus === 'paid' ? 'Paid' : 'Unpaid'}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold text-gray-900">Rs {order.total.toLocaleString()}</div>
                    <div className="text-xs text-gray-500">{order.items.length} items</div>
                    {order.status !== 'rejected' && (
                      <div className="flex justify-end gap-2 mt-2">
                        <button
                          onClick={() => handlePaymentStatus(order.id, 'paid')}
                          disabled={order.paymentStatus === 'paid'}
                          className={`py-1 px-2.5 text-xs rounded-lg border ${
                            order.paymentStatus === 'paid'
                              ? 'bg-green-100 border-green-300 text-green-700 cursor-not-allowed'
                              : 'bg-white border-green-200 text-green-700 hover:bg-green-50'
                          }`}
                        >
                          Paid
                        </button>
                        <button
                          onClick={() => handlePaymentStatus(order.id, 'unpaid')}
                          disabled={order.paymentStatus === 'unpaid'}
                          className={`py-1 px-2.5 text-xs rounded-lg border ${
                            order.paymentStatus === 'unpaid'
                              ? 'bg-red-100 border-red-300 text-red-700 cursor-not-allowed'
                              : 'bg-white border-red-200 text-red-700 hover:bg-red-50'
                          }`}
                        >
                          Unpaid
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Modal open={!!selectedInvoiceOrder} onClose={() => setSelectedInvoiceOrder(null)} title="Invoice Preview" size="lg">
        {selectedInvoiceOrder && (
          <div className="space-y-4">
            <div className="flex justify-between items-start pb-4 border-b border-gray-100">
              <div>
                <div className="font-bold text-lg text-gray-900">{connection.businessName}</div>
                <div className="text-sm text-gray-500">Invoice</div>
              </div>
              <div className="text-right">
                <div className="text-sm font-medium text-gray-900">#{selectedInvoiceOrder.id.slice(-6).toUpperCase()}</div>
                <div className="text-xs text-gray-500">{format(new Date(selectedInvoiceOrder.placedAt), 'dd MMM yyyy')}</div>
              </div>
            </div>

            <div className="bg-gray-50 rounded-xl p-3">
              <div className="text-xs text-gray-500 mb-1">Bill To</div>
              <div className="font-semibold text-gray-900 text-sm">{selectedInvoiceOrder.shopName}</div>
              <div className="text-xs text-gray-500">{selectedInvoiceOrder.shopkeeperName}</div>
            </div>

            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2 text-xs font-semibold text-gray-500">Product</th>
                  <th className="text-right py-2 text-xs font-semibold text-gray-500">Qty</th>
                  <th className="text-right py-2 text-xs font-semibold text-gray-500">Rate</th>
                  <th className="text-right py-2 text-xs font-semibold text-gray-500">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {selectedInvoiceOrder.items.map(item => (
                  <tr key={item.id}>
                    <td className="py-2">
                      <div className="font-medium text-gray-900">{item.productName}</div>
                      <div className="text-xs text-gray-400">{item.brand} · {item.unit}</div>
                    </td>
                    <td className="py-2 text-right text-gray-700">{item.quantity}</td>
                    <td className="py-2 text-right text-gray-700">Rs {item.unitPrice}</td>
                    <td className="py-2 text-right font-semibold text-gray-900">Rs {(item.quantity * item.unitPrice).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-gray-200">
                  <td colSpan={3} className="pt-3 text-right font-bold text-gray-900">Total Amount</td>
                  <td className="pt-3 text-right font-bold text-xl text-brand-600">Rs {selectedInvoiceOrder.total.toLocaleString()}</td>
                </tr>
              </tfoot>
            </table>

            <div className="flex gap-3 pt-2">
              <button onClick={() => handleDownload(selectedInvoiceOrder)} className="btn-secondary flex-1">Download PDF</button>
              <button onClick={() => handleShare(selectedInvoiceOrder)} className="btn-primary flex-1">Share Invoice</button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
