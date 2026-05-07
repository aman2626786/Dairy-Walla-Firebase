import { useEffect } from 'react';
import { CheckCircle, XCircle, Clock, Users, Phone } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { useAppStore } from '../../store/appStore';
import { useToast } from '../../components/ui/Toast';
import { EmptyState } from '../../components/ui/EmptyState';
import { MobileHeader } from '../../components/layout/MobileHeader';
import { format } from 'date-fns';

export function ConnectionsPage() {
  const { user } = useAuthStore();
  const {
    connections,
    distributorProfiles,
    shopkeeperProfiles,
    fetchShopkeeperProfileById,
    updateConnectionStatus,
    addNotification,
  } = useAppStore();
  const { show } = useToast();
  const navigate = useNavigate();

  const profile = distributorProfiles.find(dp => dp.userId === user?.id);
  const myConnections = connections.filter(c => c.distributorId === profile?.id);
  const pending = myConnections.filter(c => c.status === 'pending');
  const active = myConnections.filter(c => c.status === 'active');

  useEffect(() => {
    const ids = [...new Set(myConnections.map(c => c.shopkeeperId))];
    ids.forEach(id => {
      if (!shopkeeperProfiles.some(sp => sp.id === id)) {
        void fetchShopkeeperProfileById(id);
      }
    });
  }, [myConnections, shopkeeperProfiles, fetchShopkeeperProfileById]);

  const getPhoneMeta = (shopkeeperId: string) => {
    const sp = shopkeeperProfiles.find(s => s.id === shopkeeperId);
    const conn = myConnections.find(c => c.shopkeeperId === shopkeeperId);
    const phone = (sp?.phone || conn?.shopkeeperPhone || '').trim();
    const tel = phone.replace(/[^\d+]/g, '');
    return { phone, tel };
  };

  const handleApprove = (connId: string, shopName: string, shopkeeperId: string) => {
    updateConnectionStatus(connId, 'active');
    addNotification({
      userId: shopkeeperId,
      type: 'connection_approved',
      message: `${profile?.businessName} approved your connection request`,
      read: false,
      createdAt: new Date().toISOString(),
    });
    show(`${shopName} approved`);
  };

  const handleReject = (connId: string, shopName: string, shopkeeperId: string) => {
    updateConnectionStatus(connId, 'rejected');
    addNotification({
      userId: shopkeeperId,
      type: 'connection_rejected',
      message: `${profile?.businessName} rejected your connection request`,
      read: false,
      createdAt: new Date().toISOString(),
    });
    show(`${shopName} rejected`, 'error');
  };

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto">
      <MobileHeader title="Shopkeepers" subtitle={`${active.length} active · ${pending.length} pending`} />

      <div className="hidden md:block mb-6">
        <h1 className="text-xl font-bold text-gray-900">Shopkeepers</h1>
        <p className="text-sm text-gray-500 mt-0.5">{active.length} active · {pending.length} pending</p>
      </div>

      <div className="card p-4 mb-6 flex items-center gap-4">
        <div className="flex-1">
          <div className="text-xs text-gray-500 mb-1">Your connection code</div>
          <div className="font-mono font-bold text-xl text-brand-600 tracking-wider">{profile?.connectionCode}</div>
          <div className="text-xs text-gray-400 mt-0.5">Share this with shopkeepers to connect</div>
        </div>
        <button
          className="btn-secondary text-xs"
          onClick={() => {
            navigator.clipboard.writeText(profile?.connectionCode || '');
            show('Code copied!');
          }}
        >
          Copy Code
        </button>
      </div>

      {pending.length > 0 && (
        <div className="mb-6">
          <h2 className="font-semibold text-gray-900 text-sm mb-3 flex items-center gap-2">
            <Clock className="w-4 h-4 text-yellow-500" />
            Pending Requests
            <span className="badge-yellow">{pending.length}</span>
          </h2>
          <div className="space-y-3">
            {pending.map(conn => {
              const { phone, tel } = getPhoneMeta(conn.shopkeeperId);
              return (
                <div key={conn.id} className="card p-4 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-yellow-100 flex items-center justify-center">
                    <span className="text-yellow-700 font-bold text-sm">{conn.shopName[0]}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-gray-900 text-sm">{conn.shopName}</div>
                    <div className="text-xs text-gray-500">{conn.shopkeeperName} · Requested {format(new Date(conn.createdAt), 'dd MMM')}</div>
                    {phone && (
                      <a href={`tel:${tel}`} className="mt-1 inline-flex items-center gap-1 text-xs text-brand-700 hover:text-brand-800">
                        <Phone className="w-3.5 h-3.5" /> {phone}
                      </a>
                    )}
                  </div>
                  <div className="flex gap-2">
                    {phone && (
                      <a href={`tel:${tel}`} className="btn-secondary py-1.5 px-3 text-xs inline-flex items-center gap-1">
                        <Phone className="w-3.5 h-3.5" /> Call
                      </a>
                    )}
                    <button onClick={() => handleApprove(conn.id, conn.shopName, conn.shopkeeperId)} className="btn-primary py-1.5 px-3 text-xs">
                      <CheckCircle className="w-3.5 h-3.5" /> Approve
                    </button>
                    <button onClick={() => handleReject(conn.id, conn.shopName, conn.shopkeeperId)} className="btn-danger py-1.5 px-3 text-xs">
                      <XCircle className="w-3.5 h-3.5" /> Reject
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div>
        <h2 className="font-semibold text-gray-900 text-sm mb-3 flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-green-500" />
          Active Shopkeepers
          <span className="badge-green">{active.length}</span>
        </h2>
        {active.length === 0 ? (
          <EmptyState
            icon={<Users className="w-8 h-8" />}
            title="No active shopkeepers"
            description="Share your connection code to get started"
          />
        ) : (
          <div className="space-y-3">
            {active.map(conn => {
              const { phone, tel } = getPhoneMeta(conn.shopkeeperId);
              return (
                <div key={conn.id} className="card p-4 flex items-center gap-4 w-full hover:shadow-card-hover transition-shadow">
                  <div className="w-10 h-10 rounded-xl bg-brand-100 flex items-center justify-center">
                    <span className="text-brand-700 font-bold text-sm">{conn.shopName[0]}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-gray-900 text-sm">{conn.shopName}</div>
                    <div className="text-xs text-gray-500">{conn.shopkeeperName}</div>
                    {phone && (
                      <a href={`tel:${tel}`} className="mt-1 inline-flex items-center gap-1 text-xs text-brand-700 hover:text-brand-800">
                        <Phone className="w-3.5 h-3.5" /> {phone}
                      </a>
                    )}
                  </div>
                  <button
                    className="btn-secondary py-1.5 px-3 text-xs"
                    onClick={() => navigate(`/distributor/shopkeeper/${conn.shopkeeperId}`)}
                  >
                    View
                  </button>
                  {phone && (
                    <a href={`tel:${tel}`} className="btn-secondary py-1.5 px-3 text-xs inline-flex items-center gap-1">
                      <Phone className="w-3.5 h-3.5" /> Call
                    </a>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
