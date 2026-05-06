import { useState } from 'react';
import { Link2, CheckCircle, Clock, XCircle, Building2 } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useAppStore } from '../../store/appStore';
import { useToast } from '../../components/ui/Toast';
import { MobileHeader } from '../../components/layout/MobileHeader';

export function ConnectionPage() {
  const { user } = useAuthStore();
  const { connections, distributorProfiles, requestConnection } = useAppStore();
  const { show } = useToast();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);

  const myConnection = connections.find(c => c.shopkeeperName === user?.name && c.status !== 'rejected');
  const distributorProfile = myConnection
    ? distributorProfiles.find(dp => dp.id === myConnection.distributorId)
    : null;

  const handleConnect = async () => {
    if (!code.trim()) { show('Enter a connection code or phone number', 'error'); return; }
    if (!user) return;

    setLoading(true);
    await new Promise(r => setTimeout(r, 600));
    setLoading(false);

    const success = requestConnection(
      user.id,
      user.name,
      `${user.name}'s Shop`,
      code.trim()
    );

    if (success) {
      show('Connection request sent!');
      setCode('');
    } else {
      show('Invalid code or already connected', 'error');
    }
  };

  const statusConfig = {
    active: { icon: <CheckCircle className="w-5 h-5 text-green-500" />, label: 'Connected', className: 'bg-green-50 border-green-200' },
    pending: { icon: <Clock className="w-5 h-5 text-yellow-500" />, label: 'Pending Approval', className: 'bg-yellow-50 border-yellow-200' },
    rejected: { icon: <XCircle className="w-5 h-5 text-red-500" />, label: 'Rejected', className: 'bg-red-50 border-red-200' },
  };

  return (
    <div className="p-4 max-w-2xl mx-auto">
      <MobileHeader title="My Distributor" subtitle="Connect with your distributor" />
      <div className="hidden md:block mb-6">
        <h1 className="text-xl font-bold text-gray-900">My Distributor</h1>
        <p className="text-sm text-gray-500 mt-0.5">Connect with your dairy distributor</p>
      </div>

      {/* Current connection */}
      {myConnection && (
        <div className={`card p-5 mb-6 border ${statusConfig[myConnection.status].className}`}>
          <div className="flex items-center gap-3 mb-3">
            {statusConfig[myConnection.status].icon}
            <div>
              <div className="font-semibold text-gray-900">{myConnection.businessName}</div>
              <div className="text-xs text-gray-500">{statusConfig[myConnection.status].label}</div>
            </div>
          </div>

          {myConnection.status === 'active' && distributorProfile && (
            <div className="space-y-2 pt-3 border-t border-gray-100">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Order Window</span>
                <span className="font-medium text-gray-900">{distributorProfile.orderWindowStart} – {distributorProfile.orderWindowCutoff}</span>
              </div>
              {myConnection.deliveryGroupName && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Delivery Area</span>
                  <span className="font-medium text-gray-900">{myConnection.deliveryGroupName}</span>
                </div>
              )}
            </div>
          )}

          {myConnection.status === 'pending' && (
            <p className="text-xs text-yellow-700 mt-2">
              Your request is waiting for the distributor to approve. You'll be notified once approved.
            </p>
          )}
        </div>
      )}

      {/* Connect form */}
      {!myConnection || myConnection.status === 'rejected' ? (
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-4">
            <Link2 className="w-4 h-4 text-brand-600" />
            <h2 className="font-semibold text-gray-900 text-sm">Connect with Distributor</h2>
          </div>
          <div className="mb-4">
            <label className="label">Connection Code or Phone Number</label>
            <input
              className="input"
              placeholder="e.g. SHARMA-7X3 or 9876543210"
              value={code}
              onChange={e => setCode(e.target.value.toUpperCase())}
              onKeyDown={e => e.key === 'Enter' && handleConnect()}
            />
            <p className="text-xs text-gray-400 mt-1.5">Ask your distributor for their connection code</p>
          </div>
          <button className="btn-primary w-full" onClick={handleConnect} disabled={loading}>
            {loading ? 'Sending request...' : 'Send Connection Request'}
          </button>

          {/* Demo hint */}
          <div className="mt-4 p-3 bg-blue-50 rounded-xl border border-blue-100">
            <p className="text-xs text-blue-700 font-medium mb-1">Demo: Try these codes</p>
            <p className="text-xs text-blue-600 font-mono">SHARMA-7X3</p>
            <p className="text-xs text-blue-600 font-mono">PRIYA-4K9</p>
          </div>
        </div>
      ) : (
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-3">
            <Building2 className="w-4 h-4 text-gray-400" />
            <h2 className="font-semibold text-gray-900 text-sm">Distributor Details</h2>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Business</span>
              <span className="font-medium text-gray-900">{myConnection.businessName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Contact</span>
              <span className="font-medium text-gray-900">{myConnection.distributorName}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
