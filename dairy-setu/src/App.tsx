import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AppLayout } from './components/layout/AppLayout';
import { LoginPage } from './pages/auth/LoginPage';
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
import { NotificationsPage } from './pages/NotificationsPage';
import { ToastContainer } from './components/ui/Toast';
import { useAuthStore } from './store/authStore';

const queryClient = new QueryClient();

function RootRedirect() {
  const { isAuthenticated, user } = useAuthStore();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <Navigate to={user?.role === 'distributor' ? '/distributor' : '/shop'} replace />;
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<RootRedirect />} />
          <Route path="/login" element={<LoginPage />} />

          {/* Distributor routes */}
          <Route path="/distributor" element={<AppLayout />}>
            <Route index element={<DashboardPage />} />
            <Route path="orders" element={<OrdersPage />} />
            <Route path="summary" element={<SummaryPage />} />
            <Route path="catalog" element={<CatalogPage />} />
            <Route path="connections" element={<ConnectionsPage />} />
            <Route path="invoices" element={<InvoicesPage />} />
            <Route path="settings" element={<SettingsPage />} />
            <Route path="notifications" element={<NotificationsPage />} />
          </Route>

          {/* Shopkeeper routes */}
          <Route path="/shop" element={<AppLayout />}>
            <Route index element={<ShopCatalogPage />} />
            <Route path="review" element={<OrderReviewPage />} />
            <Route path="history" element={<OrderHistoryPage />} />
            <Route path="connection" element={<ConnectionPage />} />
            <Route path="notifications" element={<NotificationsPage />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <ToastContainer />
      </BrowserRouter>
    </QueryClientProvider>
  );
}
