import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Package, Users, FileText,
  Settings, LogOut, Bell, BarChart3, Store, ClipboardList, Search
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useAppStore } from '../../store/appStore';
import { hasUnreadForPage } from '../../utils/notificationRouting';

export function Sidebar() {
  const { user, signOut } = useAuthStore();
  const { notifications } = useAppStore();
  const navigate = useNavigate();

  const unread = notifications.filter(n => n.userId === user?.id && !n.read).length;

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  const distributorLinks = [
    { to: '/distributor', icon: <LayoutDashboard className="w-4 h-4" />, label: 'Dashboard', badge: undefined, showDot: false },
    { to: '/distributor/orders', icon: <ClipboardList className="w-4 h-4" />, label: 'Orders', badge: undefined, showDot: hasUnreadForPage(notifications, user?.id, user?.role, 'orders') },
    { to: '/distributor/summary', icon: <BarChart3 className="w-4 h-4" />, label: 'Order Summary', badge: undefined, showDot: false },
    { to: '/distributor/catalog', icon: <Package className="w-4 h-4" />, label: 'Catalog', badge: undefined, showDot: false },
    { to: '/distributor/connections', icon: <Users className="w-4 h-4" />, label: 'Shopkeepers', badge: undefined, showDot: hasUnreadForPage(notifications, user?.id, user?.role, 'connections') },
    { to: '/distributor/invoices', icon: <FileText className="w-4 h-4" />, label: 'Invoices', badge: undefined, showDot: false },
    { to: '/distributor/settings', icon: <Settings className="w-4 h-4" />, label: 'Settings', badge: undefined, showDot: false },
  ];

  const shopkeeperLinks = [
    { to: '/shop', icon: <Store className="w-4 h-4" />, label: 'Order Now', badge: undefined, showDot: false },
    { to: '/shop/discover', icon: <Search className="w-4 h-4" />, label: 'Discover', badge: 'New', showDot: false },
    { to: '/shop/history', icon: <ClipboardList className="w-4 h-4" />, label: 'My Orders', badge: undefined, showDot: hasUnreadForPage(notifications, user?.id, user?.role, 'history') },
    { to: '/shop/connection', icon: <Users className="w-4 h-4" />, label: 'My Distributor', badge: undefined, showDot: hasUnreadForPage(notifications, user?.id, user?.role, 'myDistributor') },
  ];

  const links = user?.role === 'distributor' ? distributorLinks : shopkeeperLinks;

  return (
    <aside className="w-60 bg-white border-r border-gray-100 flex flex-col h-screen sticky top-0">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-gray-100">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-brand-600 flex items-center justify-center">
            <span className="text-white font-bold text-sm">DW</span>
          </div>
          <div>
            <div className="font-bold text-gray-900 text-sm leading-tight">DairyWalla</div>
            <div className="text-xs text-gray-400 capitalize">{user?.role}</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {links.map(link => (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.to === '/distributor' || link.to === '/shop'}
            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
          >
            {link.icon}
            <span className="flex items-center gap-1.5">
              {link.label}
              {link.showDot && <span className="w-2 h-2 rounded-full bg-red-500" />}
            </span>
            {link.badge && (
              <span className="ml-auto bg-gradient-to-r from-brand-500 to-brand-600 text-white text-xs rounded-full px-2 py-0.5 font-medium">
                {link.badge}
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Bottom */}
      <div className="px-3 py-4 border-t border-gray-100 space-y-0.5">
        <NavLink
          to={user?.role === 'distributor' ? '/distributor/notifications' : '/shop/notifications'}
          className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
        >
          <Bell className="w-4 h-4" />
          Notifications
          {unread > 0 && (
            <span className="ml-auto bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-medium">
              {unread > 9 ? '9+' : unread}
            </span>
          )}
        </NavLink>

        <div
          className="px-3 py-2.5 flex items-center gap-3 rounded-xl cursor-pointer hover:bg-gray-50 transition-colors"
          onClick={() => navigate(user?.role === 'distributor' ? '/distributor/profile' : '/shop/profile')}
        >
          <div className="w-7 h-7 rounded-full bg-brand-100 flex items-center justify-center flex-shrink-0">
            <span className="text-brand-700 font-semibold text-xs">{user?.name?.[0]}</span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-medium text-gray-900 truncate">{user?.name}</div>
            <div className="text-xs text-gray-400 truncate">{user?.email}</div>
          </div>
          <button
            onClick={e => { e.stopPropagation(); handleLogout(); }}
            className="text-gray-400 hover:text-red-500 transition-colors flex-shrink-0"
            title="Logout"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </aside>
  );
}
