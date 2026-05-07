import { useState } from 'react';
import { Clock, Copy, Check } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useAppStore } from '../../store/appStore';
import { useToast } from '../../components/ui/Toast';
import { MobileHeader } from '../../components/layout/MobileHeader';
import { getInvoiceLanguage, setInvoiceLanguage, type InvoiceLanguage } from '../../utils/invoiceLanguage';

export function SettingsPage() {
  const { user } = useAuthStore();
  const { distributorProfiles, updateDistributorSettings } = useAppStore();
  const { show } = useToast();

  const profile = distributorProfiles.find(dp => dp.userId === user?.id);
  const [start, setStart] = useState(profile?.orderWindowStart || '18:00');
  const [cutoff, setCutoff] = useState(profile?.orderWindowCutoff || '20:00');
  const [copied, setCopied] = useState(false);
  const [invoiceLanguage, setInvoiceLanguageState] = useState<InvoiceLanguage>(() => getInvoiceLanguage());

  const handleSave = () => {
    if (!profile) return;
    updateDistributorSettings(profile.id, { orderWindowStart: start, orderWindowCutoff: cutoff });
    show('Settings saved');
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(profile?.connectionCode || '');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    show('Connection code copied');
  };

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto">
      <MobileHeader title="Settings" subtitle="Business preferences" />
      <div className="hidden md:block mb-6">
        <h1 className="text-xl font-bold text-gray-900">Settings</h1>
        <p className="text-sm text-gray-500 mt-0.5">Manage your business preferences</p>
      </div>

      {/* Business Info */}
      <div className="card p-5 mb-4">
        <h2 className="font-semibold text-gray-900 text-sm mb-4">Business Information</h2>
        <div className="space-y-3">
          <div>
            <label className="label">Business Name</label>
            <input className="input" value={profile?.businessName || ''} readOnly />
          </div>
          <div>
            <label className="label">Connection Code</label>
            <div className="flex gap-2">
              <input className="input flex-1 font-mono font-bold text-brand-600 tracking-wider" value={profile?.connectionCode || ''} readOnly />
              <button className="btn-secondary" onClick={handleCopy}>
                {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-xs text-gray-400 mt-1">Share this code with shopkeepers to connect</p>
          </div>
        </div>
      </div>

      {/* Order Window */}
      <div className="card p-5 mb-4">
        <div className="flex items-center gap-2 mb-4">
          <Clock className="w-4 h-4 text-brand-600" />
          <h2 className="font-semibold text-gray-900 text-sm">Order Window</h2>
        </div>
        <p className="text-xs text-gray-500 mb-4">
          Orders placed within this window are guaranteed (Normal Orders). Orders after the cutoff are Late Orders and need your approval.
        </p>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="label">Window Opens</label>
            <input type="time" className="input" value={start} onChange={e => setStart(e.target.value)} />
          </div>
          <div>
            <label className="label">Cutoff Time</label>
            <input type="time" className="input" value={cutoff} onChange={e => setCutoff(e.target.value)} />
          </div>
        </div>

        {/* Visual preview */}
        <div className="bg-gray-50 rounded-xl p-3 mb-4">
          <div className="text-xs text-gray-500 mb-2">Preview</div>
          <div className="flex items-center gap-2 text-sm">
            <span className="badge-green">Normal orders</span>
            <span className="text-gray-400 text-xs">{start} – {cutoff}</span>
            <span className="badge-yellow">Late orders</span>
            <span className="text-gray-400 text-xs">after {cutoff}</span>
          </div>
        </div>

        <button className="btn-primary" onClick={handleSave}>Save Settings</button>
      </div>

      <div className="card p-5 mb-4">
        <h2 className="font-semibold text-gray-900 text-sm mb-3">Invoice Language</h2>
        <p className="text-xs text-gray-500 mb-3">Default bill language yahin se set karo.</p>
        <select
          value={invoiceLanguage}
          onChange={e => {
            const next = e.target.value as InvoiceLanguage;
            setInvoiceLanguageState(next);
            setInvoiceLanguage(next);
            show('Invoice language updated');
          }}
          className="input"
        >
          <option value="hinglish">Hinglish (Default)</option>
          <option value="english">English</option>
          <option value="hindi">Hindi</option>
        </select>
      </div>

      {/* WhatsApp Bridge info */}
      <div className="card p-5 bg-green-50 border-green-200">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-lg">📲</span>
          <h2 className="font-semibold text-gray-900 text-sm">WhatsApp Bridge</h2>
          <span className="badge-green text-xs">Active</span>
        </div>
        <p className="text-xs text-gray-600">
          Shopkeepers can send orders via WhatsApp to your registered number. The system automatically converts messages into structured orders.
        </p>
        <div className="mt-3 p-2 bg-white rounded-lg border border-green-200">
          <p className="text-xs text-gray-500 font-medium mb-1">Example message format:</p>
          <p className="text-xs font-mono text-gray-700">"Amul milk 20, paneer 5, butter 10"</p>
        </div>
      </div>
    </div>
  );
}
