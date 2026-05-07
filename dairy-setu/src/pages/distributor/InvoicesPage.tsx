import { useState } from 'react';
import { FileText, Download, Share2 } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useAppStore } from '../../store/appStore';
import { useToast } from '../../components/ui/Toast';
import { Modal } from '../../components/ui/Modal';
import { EmptyState } from '../../components/ui/EmptyState';
import { MobileHeader } from '../../components/layout/MobileHeader';
import { format } from 'date-fns';
import type { Order } from '../../types';
import { downloadInvoicePdf } from '../../utils/invoicePdf';
import { getInvoiceLanguage, setInvoiceLanguage, type InvoiceLanguage } from '../../utils/invoiceLanguage';

export function InvoicesPage() {
  const { user } = useAuthStore();
  const { orders, distributorProfiles, shopkeeperProfiles } = useAppStore();
  const { show } = useToast();
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [invoiceLanguage, setInvoiceLanguageState] = useState<InvoiceLanguage>(
    () => getInvoiceLanguage()
  );

  const profile = distributorProfiles.find(dp => dp.userId === user?.id);
  const billableOrders = orders.filter(
    o => o.distributorId === profile?.id && (o.status === 'accepted' || o.status === 'fulfilled')
  );

  const handleDownload = (order: Order) => {
    if (!profile) {
      show('Distributor profile missing. Please complete profile first.', 'error');
      return;
    }
    const shopkeeper = shopkeeperProfiles.find(sp => sp.id === order.shopkeeperId);
    const shopkeeperPhone = (shopkeeper as unknown as { phone?: string } | undefined)?.phone;
    const shopkeeperEmail = (shopkeeper as unknown as { email?: string } | undefined)?.email;
    downloadInvoicePdf({
      order,
      distributor: profile,
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
    const text = `Invoice from ${profile?.businessName}\n\nShop: ${order.shopName}\nDate: ${format(new Date(order.placedAt), 'dd MMM yyyy')}\n\nItems:\n${order.items.map(i => `${i.productName} x${i.quantity} = Rs. ${i.quantity * i.unitPrice}`).join('\n')}\n\nTotal: Rs. ${order.total.toLocaleString()}`;
    if (navigator.share) {
      navigator.share({ title: 'Invoice', text });
    } else {
      navigator.clipboard.writeText(text);
      show('Invoice copied to clipboard');
    }
  };

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto">
      <MobileHeader title="Invoices" subtitle={`${billableOrders.length} invoices`} />
      <div className="hidden md:block mb-6">
        <h1 className="text-xl font-bold text-gray-900">Invoices</h1>
        <p className="text-sm text-gray-500 mt-0.5">{billableOrders.length} invoices</p>
      </div>
      <div className="card p-3 mb-4 flex items-center justify-between gap-3">
        <p className="text-sm text-gray-700">Bill language</p>
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
        <EmptyState
          icon={<FileText className="w-8 h-8" />}
          title="No invoices yet"
          description="Accepted orders will appear here"
        />
      ) : (
        <div className="space-y-3">
          {billableOrders.map(order => (
            <div key={order.id} className="card p-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center flex-shrink-0">
                  <FileText className="w-5 h-5 text-purple-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-gray-900 text-base leading-tight break-words">{order.shopName}</div>
                  <div className="text-xs text-gray-500 mt-1 leading-5">
                    {format(new Date(order.placedAt), 'dd MMM yyyy, h:mm a')} - {order.items.length} items
                  </div>
                  <div className="text-lg font-bold text-gray-900 mt-1">Rs. {order.total.toLocaleString()}</div>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 mt-3 sm:mt-4">
                <button onClick={() => setSelectedOrder(order)} className="btn-secondary py-1.5 px-3 text-xs whitespace-nowrap">
                  <FileText className="w-3.5 h-3.5" /> View
                </button>
                <button onClick={() => handleDownload(order)} className="btn-secondary py-1.5 px-3 text-xs whitespace-nowrap">
                  <Download className="w-3.5 h-3.5" /> PDF
                </button>
                <button onClick={() => handleShare(order)} className="btn-primary py-1.5 px-3 text-xs whitespace-nowrap">
                  <Share2 className="w-3.5 h-3.5" /> Share
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={!!selectedOrder} onClose={() => setSelectedOrder(null)} title="Invoice Preview" size="lg">
        {selectedOrder && (
          <div className="space-y-4">
            <div className="flex justify-between items-start pb-4 border-b border-gray-100">
              <div>
                <div className="font-bold text-lg text-gray-900">{profile?.businessName}</div>
                <div className="text-sm text-gray-500">Invoice</div>
              </div>
              <div className="text-right">
                <div className="text-sm font-medium text-gray-900">#{selectedOrder.id.slice(-6).toUpperCase()}</div>
                <div className="text-xs text-gray-500">{format(new Date(selectedOrder.placedAt), 'dd MMM yyyy')}</div>
              </div>
            </div>

            <div className="bg-gray-50 rounded-xl p-3">
              <div className="text-xs text-gray-500 mb-1">Bill To</div>
              <div className="font-semibold text-gray-900 text-sm">{selectedOrder.shopName}</div>
              <div className="text-xs text-gray-500">{selectedOrder.shopkeeperName}</div>
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
                {selectedOrder.items.map(item => (
                  <tr key={item.id}>
                    <td className="py-2">
                      <div className="font-medium text-gray-900">{item.productName}</div>
                      <div className="text-xs text-gray-400">{item.brand} - {item.unit}</div>
                    </td>
                    <td className="py-2 text-right text-gray-700">{item.quantity}</td>
                    <td className="py-2 text-right text-gray-700">Rs. {item.unitPrice}</td>
                    <td className="py-2 text-right font-semibold text-gray-900">Rs. {(item.quantity * item.unitPrice).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-gray-200">
                  <td colSpan={3} className="pt-3 text-right font-bold text-gray-900">Total Amount</td>
                  <td className="pt-3 text-right font-bold text-xl text-brand-600">Rs. {selectedOrder.total.toLocaleString()}</td>
                </tr>
              </tfoot>
            </table>

            <div className="flex gap-3 pt-2">
              <button onClick={() => handleDownload(selectedOrder)} className="btn-secondary flex-1">
                <Download className="w-4 h-4" /> Download PDF
              </button>
              <button onClick={() => handleShare(selectedOrder)} className="btn-primary flex-1">
                <Share2 className="w-4 h-4" /> Share via WhatsApp
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
