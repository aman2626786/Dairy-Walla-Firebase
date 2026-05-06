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

const queryClient = new QueryClient();

function AppWithAuth() {
  const { isAuthenticated, user, loadUser } = useAuthStore();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        const current = useAuthStore.getState().user;
        if (!current || current.id !== session.user.id) {
          const fallbackRole = (localStorage.getItem('dairy-walla-active-role') as 'distributor' | 'shopkeeper' | null) || 'shopkeeper';
          useAuthStore.setState({
            user: {
              id: session.user.id,
              email: session.user.email || '',
              name: current?.name || '',
              phone: current?.phone || '',
              role: current?.role || fallbackRole,
            },
            isAuthenticated: true,
          });
        } else {
          useAuthStore.setState({ isAuthenticated: true });
        }
        loadUser().finally(() => setReady(true));
      } else {
        useAuthStore.setState({ user: null, isAuthenticated: false });
        setReady(true);
      }
    }).catch(() => {
      useAuthStore.setState({ user: null, isAuthenticated: false });
      setReady(true);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_OUT') {
        useAuthStore.setState({ user: null, isAuthenticated: false });
      } else if (event === 'SIGNED_IN' && session?.user) {
        await loadUser();
      }
    });

    return () => subscription.unsubscribe();
  }, []);

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
