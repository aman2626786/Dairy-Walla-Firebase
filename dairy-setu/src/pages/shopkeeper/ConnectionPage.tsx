import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Link2, CheckCircle, Clock, XCircle, Building2, Search, MapPin, Tag } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useAppStore } from '../../store/appStore';
import { useToast } from '../../components/ui/Toast';
import { MobileHeader } from '../../components/layout/MobileHeader';

export function ConnectionPage() {
  const { user } = useAuthStore();
  const { connections, distributorProfiles, shopkeeperProfiles, requestConnection } = useAppStore();
  const { show } = useToast();
  const navigate = useNavigate();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [searchCity, setSearchCity] = useState('');
  const [searchCompany, setSearchCompany] = useState('');

  const shopProfile = shopkeeperProfiles.find(sp => sp.userId === user?.id);
  const myConnection = connections.find(c => c.shopkeeperId === shopProfile?.id && c.status !== 'rejected');
  const distributorProfile = myConnection
    ? distributorProfiles.find(dp => dp.id === myConnection.distributorId)
    : null;

  // Search distributors
  const searchResults = showSearch
    ? distributorProfiles.filter(dp => {
        const cityMatch = !searchCity || dp.city?.toLowerCase().includes(searchCity.toLowerCase());
        const companyMatch = !searchCompany || dp.company?.toLowerCase().includes(searchCompany.toLowerCase());
        return cityMatch && companyMatch;
      })
    : [];

  const handleConnect = async () => {
    if (!code.trim()) { show('Enter a connection code or phone number', 'error'); return; }
    if (!user || !shopProfile) { show('Shopkeeper profile missing. Profile setup complete karo.', 'error'); return; }

    setLoading(true);
    await new Promise(r => setTimeout(r, 600));
    setLoading(false);

    const success = await requestConnection(
      shopProfile.id,
      user.name,
      shopProfile.shopName || `${user.name}'s Shop`,
      code.trim()
    );

    if (success) {
      show('Connection request sent!');
      setCode('');
    } else {
      show('Invalid code or already connected', 'error');
    }
  };

  const handleConnectFromSearch = (connectionCode: string) => {
    setCode(connectionCode);
    setShowSearch(false);
    show('Code filled! Ab send karo', 'info');
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
        <div className="space-y-4">
          {/* Discover button */}
          <button
            onClick={() => navigate('/shop/discover')}
            className="w-full p-4 bg-gradient-to-r from-brand-500 to-brand-600 text-white rounded-2xl flex items-center justify-between hover:from-brand-600 hover:to-brand-700 transition-all shadow-lg"
          >
            <div className="flex items-center gap-3">
              <Search className="w-5 h-5" />
              <div className="text-left">
                <div className="font-semibold text-sm">Discover Distributors</div>
                <div className="text-xs opacity-90">Find nearby distributors</div>
              </div>
            </div>
            <span className="text-xl">→</span>
          </button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200"></div>
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="px-2 bg-white text-gray-400">OR</span>
            </div>
          </div>

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

          {/* Search distributors */}
          <div className="card p-5">
            <button
              onClick={() => setShowSearch(!showSearch)}
              className="w-full flex items-center justify-between mb-4"
            >
              <div className="flex items-center gap-2">
                <Search className="w-4 h-4 text-brand-600" />
                <h2 className="font-semibold text-gray-900 text-sm">Search Distributors</h2>
              </div>
              <span className="text-xs text-brand-600">{showSearch ? 'Hide' : 'Show'}</span>
            </button>

            {showSearch && (
              <div className="space-y-3">
                <div>
                  <label className="label flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5" />
                    Search by City
                  </label>
                  <input
                    className="input"
                    placeholder="e.g. Ajmer"
                    value={searchCity}
                    onChange={e => setSearchCity(e.target.value)}
                  />
                </div>
                <div>
                  <label className="label flex items-center gap-1.5">
                    <Tag className="w-3.5 h-3.5" />
                    Search by Company
                  </label>
                  <input
                    className="input"
                    placeholder="e.g. Amul"
                    value={searchCompany}
                    onChange={e => setSearchCompany(e.target.value)}
                  />
                </div>

                {/* Search results */}
                {(searchCity || searchCompany) && (
                  <div className="mt-4 space-y-2">
                    <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      Results ({searchResults.length})
                    </div>
                    {searchResults.length === 0 ? (
                      <div className="text-sm text-gray-400 text-center py-4">
                        Koi distributor nahi mila
                      </div>
                    ) : (
                      searchResults.map(dp => (
                        <div key={dp.id} className="p-3 bg-gray-50 rounded-xl border border-gray-200">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1">
                              <div className="font-semibold text-gray-900 text-sm">{dp.businessName}</div>
                              <div className="text-xs text-gray-500 mt-0.5">
                                {dp.company && <span className="badge-blue mr-1">{dp.company}</span>}
                                {dp.city && <span>{dp.city}</span>}
                              </div>
                              {dp.deliveryAreas && (
                                <div className="text-xs text-gray-400 mt-1">
                                  Areas: {dp.deliveryAreas}
                                </div>
                              )}
                            </div>
                            <button
                              onClick={() => handleConnectFromSearch(dp.connectionCode)}
                              className="btn-secondary text-xs py-1.5 px-3"
                            >
                              Connect
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            )}
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
