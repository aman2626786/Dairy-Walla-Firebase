import { create } from 'zustand';
import type {
  Connection, Product, Order, DeliveryGroup, Notification, CartItem,
  ConnectionStatus, OrderStatus, DistributorProfile
} from '../types';
import {
  MOCK_CONNECTIONS, MOCK_PRODUCTS, MOCK_ORDERS,
  MOCK_DELIVERY_GROUPS, MOCK_NOTIFICATIONS, MOCK_DISTRIBUTOR_PROFILES
} from './mockData';

interface AppState {
  // Data
  connections: Connection[];
  products: Product[];
  orders: Order[];
  deliveryGroups: DeliveryGroup[];
  notifications: Notification[];
  distributorProfiles: DistributorProfile[];
  cart: CartItem[];

  // Connection actions
  requestConnection: (shopkeeperId: string, shopkeeperName: string, shopName: string, distributorCode: string) => boolean;
  updateConnectionStatus: (connectionId: string, status: ConnectionStatus, deliveryGroupId?: string) => void;
  assignDeliveryGroup: (connectionId: string, groupId: string, groupName: string) => void;

  // Product actions
  addProduct: (product: Omit<Product, 'id'>) => void;
  updateProduct: (id: string, updates: Partial<Product>) => void;
  deleteProduct: (id: string) => void;

  // Order actions
  placeOrder: (shopkeeperId: string, shopkeeperName: string, shopName: string, distributorId: string, items: CartItem[], isLate: boolean) => Order;
  updateOrderStatus: (orderId: string, status: OrderStatus) => void;

  // Delivery group actions
  addDeliveryGroup: (distributorId: string, name: string) => void;
  deleteDeliveryGroup: (id: string) => void;

  // Notification actions
  markNotificationRead: (id: string) => void;
  markAllRead: (userId: string) => void;
  addNotification: (notification: Omit<Notification, 'id'>) => void;

  // Cart actions
  setCartQuantity: (product: Product, quantity: number) => void;
  clearCart: () => void;

  // Settings
  updateDistributorSettings: (distributorId: string, updates: Partial<DistributorProfile>) => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  connections: MOCK_CONNECTIONS,
  products: MOCK_PRODUCTS,
  orders: MOCK_ORDERS,
  deliveryGroups: MOCK_DELIVERY_GROUPS,
  notifications: MOCK_NOTIFICATIONS,
  distributorProfiles: MOCK_DISTRIBUTOR_PROFILES,
  cart: [],

  requestConnection: (shopkeeperId, shopkeeperName, shopName, distributorCode) => {
    const { distributorProfiles, connections } = get();
    const profile = distributorProfiles.find(
      dp => dp.connectionCode === distributorCode || dp.id === distributorCode
    );
    if (!profile) return false;

    // Check if already connected
    const existing = connections.find(
      c => c.shopkeeperId === shopkeeperId && c.distributorId === profile.id && c.status !== 'rejected'
    );
    if (existing) return false;

    const newConn: Connection = {
      id: `c_${Date.now()}`,
      shopkeeperId,
      shopkeeperName,
      shopName,
      distributorId: profile.id,
      distributorName: '',
      businessName: profile.businessName,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };

    set(state => ({
      connections: [...state.connections, newConn],
    }));

    // Add notification for distributor
    get().addNotification({
      userId: profile.userId,
      type: 'new_connection',
      message: `${shopName} wants to connect with you`,
      read: false,
      createdAt: new Date().toISOString(),
    });

    return true;
  },

  updateConnectionStatus: (connectionId, status) => {
    set(state => ({
      connections: state.connections.map(c =>
        c.id === connectionId ? { ...c, status } : c
      ),
    }));
  },

  assignDeliveryGroup: (connectionId, groupId, groupName) => {
    set(state => ({
      connections: state.connections.map(c =>
        c.id === connectionId ? { ...c, deliveryGroupId: groupId, deliveryGroupName: groupName } : c
      ),
    }));
  },

  addProduct: (product) => {
    const newProduct: Product = { ...product, id: `p_${Date.now()}` };
    set(state => ({ products: [...state.products, newProduct] }));
  },

  updateProduct: (id, updates) => {
    set(state => ({
      products: state.products.map(p => p.id === id ? { ...p, ...updates } : p),
    }));
  },

  deleteProduct: (id) => {
    set(state => ({ products: state.products.filter(p => p.id !== id) }));
  },

  placeOrder: (shopkeeperId, shopkeeperName, shopName, distributorId, items, isLate) => {
    const today = new Date().toISOString().split('T')[0];
    const orderItems = items.map((ci, i) => ({
      id: `oi_${Date.now()}_${i}`,
      orderId: '',
      productId: ci.product.id,
      productName: ci.product.name,
      brand: ci.product.brand,
      unit: ci.product.unit,
      unitPrice: ci.product.price,
      quantity: ci.quantity,
    }));
    const total = orderItems.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0);

    const order: Order = {
      id: `o_${Date.now()}`,
      shopkeeperId,
      shopkeeperName,
      shopName,
      distributorId,
      type: isLate ? 'late' : 'normal',
      status: isLate ? 'pending' : 'accepted',
      source: 'web',
      placedAt: new Date().toISOString(),
      deliveryDate: today,
      items: orderItems.map(i => ({ ...i, orderId: `o_${Date.now()}` })),
      total,
    };

    set(state => ({ orders: [order, ...state.orders] }));

    // Notify distributor
    const profile = get().distributorProfiles.find(dp => dp.id === distributorId);
    if (profile) {
      get().addNotification({
        userId: profile.userId,
        type: isLate ? 'late_order' : 'order_placed',
        message: isLate
          ? `Late order from ${shopName} — needs your approval`
          : `New order from ${shopName}`,
        read: false,
        createdAt: new Date().toISOString(),
      });
    }

    return order;
  },

  updateOrderStatus: (orderId, status) => {
    set(state => ({
      orders: state.orders.map(o => o.id === orderId ? { ...o, status } : o),
    }));
  },

  addDeliveryGroup: (distributorId, name) => {
    const group: DeliveryGroup = { id: `dg_${Date.now()}`, distributorId, name };
    set(state => ({ deliveryGroups: [...state.deliveryGroups, group] }));
  },

  deleteDeliveryGroup: (id) => {
    set(state => ({ deliveryGroups: state.deliveryGroups.filter(g => g.id !== id) }));
  },

  markNotificationRead: (id) => {
    set(state => ({
      notifications: state.notifications.map(n => n.id === id ? { ...n, read: true } : n),
    }));
  },

  markAllRead: (userId) => {
    set(state => ({
      notifications: state.notifications.map(n =>
        n.userId === userId ? { ...n, read: true } : n
      ),
    }));
  },

  addNotification: (notification) => {
    const n: Notification = { ...notification, id: `n_${Date.now()}` };
    set(state => ({ notifications: [n, ...state.notifications] }));
  },

  setCartQuantity: (product, quantity) => {
    set(state => {
      const existing = state.cart.find(c => c.product.id === product.id);
      if (quantity === 0) {
        return { cart: state.cart.filter(c => c.product.id !== product.id) };
      }
      if (existing) {
        return { cart: state.cart.map(c => c.product.id === product.id ? { ...c, quantity } : c) };
      }
      return { cart: [...state.cart, { product, quantity }] };
    });
  },

  clearCart: () => set({ cart: [] }),

  updateDistributorSettings: (distributorId, updates) => {
    set(state => ({
      distributorProfiles: state.distributorProfiles.map(dp =>
        dp.id === distributorId ? { ...dp, ...updates } : dp
      ),
    }));
  },
}));
