import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { supabase } from './lib/supabase';
import { AppLayout } from './components/layout/AppLayout';
import { LoginPage } from './pages/auth/LoginPage';
import { SignupPage } from './pages/auth/SignupPage';
import { ConfirmProfilePage } from './pages/auth/ConfirmProfilePage';
import { DashboardPage } from './pages/distributor/DashboardPage';
import { OrdersPage } from './pages/distributor/OrdersPage';
import { SummaryPage } from './pages/distributor/SummaryPage';
import { CatalogPage } from './pages/distributor/CatalogPage';
import { ConnectionsPage } from './pages/distributor/ConnectionsPage';
import { InvoicesPage } from './pages/distributor/InvoicesPage';
import { SettingsPage } from './pages/distributor/SettingsPage';
import { ShopkeeperProfilePage } from './pages/distributor/ShopkeeperProfilePage';
import { ShopCatalogPage } from './pages/shopkeeper/CatalogPage';
import { OrderReviewPage } from './pages/shopkeeper/OrderReviewPage';
import { OrderHistoryPage } from './pages/shopkeeper/OrderHistoryPage';
import { ConnectionPage } from './pages/shopkeeper/ConnectionPage';
import { DiscoverPage } from './pages/shopkeeper/DiscoverPage';
import { DistributorProfilePage } from './pages/shopkeeper/DistributorProfilePage';
import { NotificationsPage } from './pages/NotificationsPage';
import { ProfilePage } from './pages/ProfilePage';
import { AdminLoginPage } from './pages/admin/AdminLoginPage';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { ToastContainer } from './components/ui/Toast';
import { useAuthStore } from './store/authStore';
import { useAppStore } from './store/appStore';
import type { Notification as AppNotification } from './types';

const queryClient = new QueryClient();

function mapNotificationRow(row: Record<string, unknown>): AppNotification {
  return {
    id: row.id as string,
    userId: row.user_id as string,
    type: row.type as string,
    message: row.message as string,
    read: row.read as boolean,
    createdAt: row.created_at as string,
  };
}

function playNotificationTune() {
  if (typeof window === 'undefined' || !window.AudioContext) return;
  const audioContext = new window.AudioContext();
  const oscillator = audioContext.createOscillator();
  const gain = audioContext.createGain();
  oscillator.type = 'sine';
  oscillator.frequency.setValueAtTime(880, audioContext.currentTime);
  gain.gain.setValueAtTime(0.0001, audioContext.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.1, audioContext.currentTime + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, audioContext.currentTime + 0.35);
  oscillator.connect(gain);
  gain.connect(audioContext.destination);
  oscillator.start();
  oscillator.stop(audioContext.currentTime + 0.35);
  oscillator.onended = () => void audioContext.close();
}

function AppWithAuth() {
  const { isAuthenticated, user, loadUser } = useAuthStore();
  const {
    fetchDistributorProfile,
    fetchShopkeeperProfile,
    fetchAllDistributors,
    fetchConnections,
    fetchProducts,
    fetchOrders,
    fetchNotifications,
    fetchDeliveryGroups,
  } = useAppStore();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let alive = true;
    let loadUserQueued = false;

    const applySessionUser = (sessionUser: { id: string; email?: string | null }) => {
      const current = useAuthStore.getState().user;
      const fallbackRole = (localStorage.getItem('dairy-walla-active-role') as 'distributor' | 'shopkeeper' | null) || 'shopkeeper';
      useAuthStore.setState({
        user: {
          id: sessionUser.id,
          email: sessionUser.email || current?.email || '',
          name: current?.id === sessionUser.id ? current.name : '',
          phone: current?.id === sessionUser.id ? current.phone : '',
          role: current?.id === sessionUser.id ? current.role : fallbackRole,
        },
        isAuthenticated: true,
      });
    };

    const queueLoadUser = () => {
      if (loadUserQueued) return;
      loadUserQueued = true;
      setTimeout(() => {
        void loadUser()
          .catch(() => undefined)
          .finally(() => {
            loadUserQueued = false;
            if (alive) setReady(true);
          });
      }, 0);
    };

    supabase.auth.getSession()
      .then(({ data: { session } }) => {
        if (!alive) return;
        if (session?.user) {
          applySessionUser(session.user);
          queueLoadUser();
        } else {
          useAuthStore.setState({ user: null, isAuthenticated: false });
          setReady(true);
        }
      })
      .catch(() => {
        if (!alive) return;
        const current = useAuthStore.getState().user;
        if (current) {
          useAuthStore.setState({ isAuthenticated: true });
        } else {
          useAuthStore.setState({ user: null, isAuthenticated: false });
        }
        setReady(true);
      });

    // Keep callback fast and non-async. Supabase recommends deferring extra auth queries.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!alive) return;

      if (event === 'SIGNED_OUT' || !session?.user) {
        useAuthStore.setState({ user: null, isAuthenticated: false });
        localStorage.removeItem('dairy-walla-active-role');
        return;
      }

      const previousUserId = useAuthStore.getState().user?.id;
      applySessionUser(session.user);

      if (event === 'SIGNED_IN' && previousUserId !== session.user.id) {
        queueLoadUser();
        return;
      }
      if (event === 'INITIAL_SESSION' || event === 'USER_UPDATED') {
        queueLoadUser();
      }
    });

    return () => {
      alive = false;
      subscription.unsubscribe();
    };
  }, [loadUser]);

  useEffect(() => {
    if (!isAuthenticated || !user?.id) return;

    let cancelled = false;

    const hydrateAppData = async () => {
      try {
        if (user.role === 'distributor') {
          const dp = await fetchDistributorProfile(user.id);
          if (cancelled) return;
          if (dp) {
            await Promise.all([
              fetchProducts(dp.id),
              fetchConnections(user.id, 'distributor'),
              fetchOrders(user.id, 'distributor'),
              fetchDeliveryGroups(dp.id),
            ]);
          }
        } else {
          await fetchShopkeeperProfile(user.id);
          if (cancelled) return;
          await fetchAllDistributors();
          if (cancelled) return;
          await Promise.all([
            fetchConnections(user.id, 'shopkeeper'),
            fetchOrders(user.id, 'shopkeeper'),
          ]);
        }
        if (!cancelled) {
          await fetchNotifications(user.id);
        }
      } catch {
        // Non-blocking hydration: auth state ko stable rakho.
      }
    };

    void hydrateAppData();

    return () => {
      cancelled = true;
    };
  }, [
    isAuthenticated,
    user?.id,
    user?.role,
    fetchDistributorProfile,
    fetchShopkeeperProfile,
    fetchAllDistributors,
    fetchConnections,
    fetchProducts,
    fetchOrders,
    fetchNotifications,
    fetchDeliveryGroups,
  ]);

  useEffect(() => {
    if (!isAuthenticated || !user?.id) return;

    if ('Notification' in window && Notification.permission === 'default') {
      void Notification.requestPermission();
    }

    const knownIds = new Set(useAppStore.getState().notifications.map(n => n.id));

    const channel = supabase
      .channel(`notifications:${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        payload => {
          if (payload.eventType === 'INSERT') {
            const row = payload.new as Record<string, unknown>;
            const incoming = mapNotificationRow(row);
            const isNew = !knownIds.has(incoming.id);
            knownIds.add(incoming.id);

            useAppStore.setState(state => ({
              notifications: state.notifications.some(n => n.id === incoming.id)
                ? state.notifications
                : [incoming, ...state.notifications],
            }));

            if (isNew) {
              playNotificationTune();
              if ('Notification' in window && Notification.permission === 'granted') {
                const notification = new Notification('Dairy Walla Alert', {
                  body: incoming.message,
                  tag: incoming.id,
                });
                notification.onclick = () => {
                  window.focus();
                  notification.close();
                };
              }
            }
            return;
          }

          if (payload.eventType === 'UPDATE') {
            const row = payload.new as Record<string, unknown>;
            const updated = mapNotificationRow(row);
            useAppStore.setState(state => ({
              notifications: state.notifications.map(n => n.id === updated.id ? updated : n),
            }));
            return;
          }

          if (payload.eventType === 'DELETE') {
            const oldRow = payload.old as Record<string, unknown>;
            const deletedId = oldRow.id as string;
            knownIds.delete(deletedId);
            useAppStore.setState(state => ({
              notifications: state.notifications.filter(n => n.id !== deletedId),
            }));
          }
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [isAuthenticated, user?.id]);

  if (!ready) {
    return (
      <Routes>
        <Route path="/confirm" element={<ConfirmProfilePage />} />
        <Route path="*" element={<LoginPage />} />
      </Routes>
    );
  }

  return (
    <Routes>
      <Route path="/" element={
        isAuthenticated
          ? <Navigate to={user?.role === 'distributor' ? '/distributor' : '/shop'} replace />
          : <Navigate to="/login" replace />
      } />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />
      <Route path="/confirm" element={<ConfirmProfilePage />} />

      <Route path="/distributor" element={
        !isAuthenticated
          ? <Navigate to="/login" replace />
          : user?.role !== 'distributor'
            ? <Navigate to="/shop" replace />
            : <AppLayout />
      }>
        <Route index element={<DashboardPage />} />
        <Route path="orders" element={<OrdersPage />} />
        <Route path="summary" element={<SummaryPage />} />
        <Route path="catalog" element={<CatalogPage />} />
        <Route path="connections" element={<ConnectionsPage />} />
        <Route path="invoices" element={<InvoicesPage />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="shopkeeper/:shopkeeperId" element={<ShopkeeperProfilePage />} />
        <Route path="notifications" element={<NotificationsPage />} />
        <Route path="profile" element={<ProfilePage />} />
      </Route>

      <Route path="/shop" element={
        !isAuthenticated
          ? <Navigate to="/login" replace />
          : user?.role !== 'shopkeeper'
            ? <Navigate to="/distributor" replace />
            : <AppLayout />
      }>
        <Route index element={<ShopCatalogPage />} />
        <Route path="review" element={<OrderReviewPage />} />
        <Route path="history" element={<OrderHistoryPage />} />
        <Route path="connection" element={<ConnectionPage />} />
        <Route path="discover" element={<DiscoverPage />} />
        <Route path="distributor/:distributorId" element={<DistributorProfilePage />} />
        <Route path="notifications" element={<NotificationsPage />} />
        <Route path="profile" element={<ProfilePage />} />
      </Route>

      <Route path="/admin" element={<AdminLoginPage />} />
      <Route path="/admin/dashboard" element={<AdminDashboard />} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AppWithAuth />
        <ToastContainer />
      </BrowserRouter>
    </QueryClientProvider>
  );
}
