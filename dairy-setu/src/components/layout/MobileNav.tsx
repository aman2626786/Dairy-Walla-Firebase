import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, ClipboardList, Package, Users, BarChart3,
  FileText, Settings, Bell, Store, LogOut, X, MoreHorizontal,
  ChevronRight
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useAppStore } from '../../store/appStore';

export function MobileNav() {
  const { user, logout } = useAuthStore();
  const { notifications } = useAppStore();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const unread = notifications.filter(n => n.userId === user?.id && !n.read).length;

  const isDistributor = user?.role === 'distributor';

  // Primary tabs shown in bottom bar (max 4)
  const primaryTabs = isDistributor
    ? [
        { to: '/distributor', icon: <LayoutDashboard className="w-5 h-5" />, label: 'Dashboard' },
        { to: '/distributor/orders', icon: <ClipboardList className="w-5 h-5" />, label: 'Orders' },
        { to: '/distributor/summary', icon: <BarChart3 className="w-5 h-5" />, label: 'Summary' },
        { to: '/distributor/catalog', icon: <Package className="w-5 h-5" />, label: 'Catalog' },
      ]
    : [
        { to: '/shop', icon: <Store className="w-5 h-5" />, label: 'Order' },
        { to: '/shop/history', icon: <ClipboardList className="w-5 h-5" />, label: 'My Orders' },
        { to: '/shop/connection', icon: <Users className="w-5 h-5" />, label: 'Distributor' },
      ];

  // Extra items shown in the "more" drawer
  const moreItems = isDistributor
    ? [
        { to: '/distributor/connections', icon: <Users className="w-5 h-5" />, label: 'Shopkeepers' },
        { to: '/distributor/invoices', icon: <FileText className="w-5 h-5" />, label: 'Invoices' },
        { to: '/distributor/notifications', icon: <Bell className="w-5 h-5" />, label: 'Notifications', badge: unread },
        { to: '/distributor/settings', icon: <Settings className="w-5 h-5" />, label: 'Settings' },
      ]
    : [
        { to: '/shop/notifications', icon: <Bell className="w-5 h-5" />, label: 'Notifications', badge: unread },
      ];

  const handleLogout = () => {
    setMenuOpen(false);
    logout();
    navigate('/login');
  };

  return (
    <>
      {/* Bottom Navigation Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200 safe-area-pb">
        <div className="flex items-stretch">
          {primaryTabs.map(tab => (
            <NavLink
              key={tab.to}
              to={tab.to}
              end={tab.to === '/distributor' || tab.to === '/shop'}
              className={({ isActive }) =>
                `flex-1 flex flex-col items-center justify-center py-2.5 gap-0.5 text-xs font-medium transition-colors ${
                  isActive ? 'text-brand-600' : 'text-gray-400'
                }`
              }
            >
              {tab.icon}
              <span className="text-[10px]">{tab.label}</span>
            </NavLink>
          ))}

          {/* More button */}
          <button
            onClick={() => setMenuOpen(true)}
            className="flex-1 flex flex-col items-center justify-center py-2.5 gap-0.5 text-xs font-medium text-gray-400 relative"
          >
            <div className="relative">
              <MoreHorizontal className="w-5 h-5" />
              {unread > 0 && (
                <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-red-500 text-white text-[8px] rounded-full flex items-center justify-center font-bold">
                  {unread > 9 ? '9+' : unread}
                </span>
              )}
            </div>
            <span className="text-[10px]">More</span>
          </button>
        </div>
      </div>

      {/* Slide-up Drawer */}
      {menuOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
            onClick={() => setMenuOpen(false)}
          />

          {/* Drawer */}
          <div className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-2xl shadow-modal animate-slide-up">
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full bg-gray-300" />
            </div>

            {/* User info */}
            <div className="flex items-center gap-3 px-5 py-3 border-b border-gray-100">
              <div className="w-10 h-10 rounded-full bg-brand-100 flex items-center justify-center">
                <span className="text-brand-700 font-bold">{user?.name?.[0]}</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-gray-900 text-sm truncate">{user?.name}</div>
                <div className="text-xs text-gray-400">{user?.phone} · <span className="capitalize">{user?.role}</span></div>
              </div>
              <button onClick={() => setMenuOpen(false)} className="p-1.5 rounded-lg hover:bg-gray-100">
                <X className="w-4 h-4 text-gray-400" />
              </button>
            </div>

            {/* Menu items */}
            <div className="px-3 py-2">
              {moreItems.map(item => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={() => setMenuOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-3 rounded-xl transition-colors ${
                      isActive ? 'bg-brand-50 text-brand-700' : 'text-gray-700 hover:bg-gray-50'
                    }`
                  }
                >
                  <span className="text-gray-500">{item.icon}</span>
                  <span className="flex-1 text-sm font-medium">{item.label}</span>
                  {item.badge && item.badge > 0 && (
                    <span className="bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                      {item.badge > 9 ? '9+' : item.badge}
                    </span>
                  )}
                  <ChevronRight className="w-4 h-4 text-gray-300" />
                </NavLink>
              ))}
            </div>

            {/* Logout */}
            <div className="px-3 pb-6 pt-1 border-t border-gray-100 mt-1">
              <button
                onClick={handleLogout}
                className="flex items-center gap-3 px-3 py-3 rounded-xl text-red-600 hover:bg-red-50 w-full transition-colors"
              >
                <LogOut className="w-5 h-5" />
                <span className="text-sm font-medium">Logout</span>
              </button>
            </div>
          </div>
        </>
      )}
    </>
  );
}
