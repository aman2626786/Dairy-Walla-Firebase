import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import type {
  Connection, Product, Order, DeliveryGroup, Notification, CartItem,
  ConnectionStatus, OrderStatus, DistributorProfile, ShopkeeperProfile
} from '../types';

interface AppState {
  connections: Connection[];
  products: Product[];
  orders: Order[];
  deliveryGroups: DeliveryGroup[];
  notifications: Notification[];
  distributorProfiles: DistributorProfile[];
  shopkeeperProfiles: ShopkeeperProfile[];
  cart: CartItem[];
  loading: boolean;

  // Fetch actions
  fetchDistributorProfile: (userId: string) => Promise<DistributorProfile | null>;
  fetchShopkeeperProfile: (userId: string) => Promise<ShopkeeperProfile | null>;
  fetchShopkeeperProfileById: (shopkeeperId: string) => Promise<ShopkeeperProfile | null>;
  ensureShopkeeperProfile: (userId: string) => ShopkeeperProfile | null;
  fetchAllDistributors: () => Promise<void>;
  fetchConnections: (userId: string, role: 'distributor' | 'shopkeeper') => Promise<void>;
  fetchProducts: (distributorId: string) => Promise<void>;
  fetchOrders: (userId: string, role: 'distributor' | 'shopkeeper') => Promise<void>;
  fetchNotifications: (userId: string) => Promise<void>;
  fetchDeliveryGroups: (distributorId: string) => Promise<void>;

  // Profile actions
  createDistributorProfile: (userId: string, data: Partial<DistributorProfile>) => Promise<DistributorProfile | null>;
  createShopkeeperProfile: (userId: string, data: Partial<ShopkeeperProfile>) => Promise<ShopkeeperProfile | null>;
  updateDistributorSettings: (distributorId: string, updates: Partial<DistributorProfile>) => Promise<void>;
  updateShopkeeperProfile: (shopkeeperId: string, updates: Partial<ShopkeeperProfile>) => Promise<void>;

  // Connection actions
  requestConnection: (shopkeeperId: string, shopkeeperName: string, shopName: string, distributorCode: string, shopkeeperPhone?: string) => Promise<boolean>;
  updateConnectionStatus: (connectionId: string, status: ConnectionStatus, deliveryGroupId?: string) => Promise<void>;
  assignDeliveryGroup: (connectionId: string, groupId: string, groupName: string) => Promise<void>;

  // Product actions
  addProduct: (product: Omit<Product, 'id'>) => Promise<boolean>;
  updateProduct: (id: string, updates: Partial<Product>) => Promise<boolean>;
  deleteProduct: (id: string) => Promise<boolean>;

  // Order actions
  placeOrder: (shopkeeperId: string, shopkeeperName: string, shopName: string, distributorId: string, items: CartItem[], isLate: boolean) => Promise<Order>;
  updateOrderStatus: (orderId: string, status: OrderStatus) => Promise<void>;

  // Delivery group actions
  addDeliveryGroup: (distributorId: string, name: string) => Promise<void>;
  deleteDeliveryGroup: (id: string) => Promise<void>;

  // Notification actions
  markNotificationRead: (id: string) => Promise<void>;
  markAllRead: (userId: string) => Promise<void>;
  addNotification: (notification: Omit<Notification, 'id'>) => Promise<void>;

  // Cart actions (local only)
  setCartQuantity: (product: Product, quantity: number) => void;
  clearCart: () => void;
}

// Helper: map DB row to DistributorProfile
function mapDistributor(row: Record<string, unknown>): DistributorProfile {
  return {
    id: row.id as string,
    userId: row.user_id as string,
    businessName: row.business_name as string,
    phone: row.phone as string | undefined,
    email: row.email as string | undefined,
    connectionCode: row.connection_code as string,
    orderWindowStart: (row.order_window_start as string) || '18:00',
    orderWindowCutoff: (row.order_window_cutoff as string) || '20:00',
    ownerName: row.owner_name as string | undefined,
    company: row.company as string | undefined,
    address: row.address as string | undefined,
    city: row.city as string | undefined,
    deliveryAreas: row.delivery_areas as string | undefined,
    gst: row.gst as string | undefined,
    locationName: row.location_name as string | undefined,
    latitude: row.latitude as number | undefined,
    longitude: row.longitude as number | undefined,
    profileComplete: row.profile_complete as boolean | undefined,
  };
}

async function enrichDistributorContacts(profiles: DistributorProfile[]): Promise<DistributorProfile[]> {
  const userIds = [...new Set(profiles.map(p => p.userId).filter(Boolean))];
  if (userIds.length === 0) return profiles;

  const { data } = await supabase
    .from('profiles')
    .select('id, phone, email')
    .in('id', userIds);

  const contactByUserId = new Map<string, { phone?: string; email?: string }>();
  (data as Record<string, unknown>[] | null)?.forEach(row => {
    contactByUserId.set(row.id as string, {
      phone: row.phone as string | undefined,
      email: row.email as string | undefined,
    });
  });

  return profiles.map(p => {
    const contact = contactByUserId.get(p.userId);
    if (!contact) return p;
    return { ...p, phone: contact.phone, email: contact.email };
  });
}

async function enrichShopkeeperContacts(profiles: ShopkeeperProfile[]): Promise<ShopkeeperProfile[]> {
  const userIds = [...new Set(profiles.map(p => p.userId).filter(Boolean))];
  if (userIds.length === 0) return profiles;

  const { data } = await supabase
    .from('profiles')
    .select('id, phone, email')
    .in('id', userIds);

  const contactByUserId = new Map<string, { phone?: string; email?: string }>();
  (data as Record<string, unknown>[] | null)?.forEach(row => {
    contactByUserId.set(row.id as string, {
      phone: row.phone as string | undefined,
      email: row.email as string | undefined,
    });
  });

  return profiles.map(p => {
    const contact = contactByUserId.get(p.userId);
    if (!contact) return p;
    return { ...p, phone: contact.phone, email: contact.email };
  });
}

function mapShopkeeper(row: Record<string, unknown>): ShopkeeperProfile {
  return {
    id: row.id as string,
    userId: row.user_id as string,
    shopName: row.shop_name as string,
    phone: row.phone as string | undefined,
    email: row.email as string | undefined,
    ownerName: row.owner_name as string | undefined,
    address: row.address as string | undefined,
    city: row.city as string | undefined,
    deliveryTiming: row.delivery_timing as string | undefined,
    locationName: row.location_name as string | undefined,
    latitude: row.latitude as number | undefined,
    longitude: row.longitude as number | undefined,
    profileComplete: row.profile_complete as boolean | undefined,
  };
}

function mapConnection(row: Record<string, unknown>): Connection {
  return {
    id: row.id as string,
    shopkeeperId: row.shopkeeper_id as string,
    shopkeeperName: row.shopkeeper_name as string,
    shopName: row.shop_name as string,
    shopkeeperPhone: row.shopkeeper_phone as string | undefined,
    distributorId: row.distributor_id as string,
    distributorName: row.distributor_name as string,
    businessName: row.business_name as string,
    status: row.status as ConnectionStatus,
    deliveryGroupId: row.delivery_group_id as string | undefined,
    deliveryGroupName: row.delivery_group_name as string | undefined,
    createdAt: row.created_at as string,
  };
}

function mapProduct(row: Record<string, unknown>): Product {
  return {
    id: row.id as string,
    distributorId: row.distributor_id as string,
    name: row.name as string,
    brand: row.brand as string,
    category: row.category as Product['category'],
    unit: row.unit as string,
    price: row.price as number,
    available: row.available as boolean,
    imageUrl: row.image_url as string | undefined,
  };
}

function mapOrder(row: Record<string, unknown>, items: Order['items'] = []): Order {
  return {
    id: row.id as string,
    shopkeeperId: row.shopkeeper_id as string,
    shopkeeperName: row.shopkeeper_name as string,
    shopName: row.shop_name as string,
    distributorId: row.distributor_id as string,
    type: row.type as Order['type'],
    status: row.status as OrderStatus,
    source: (row.source as Order['source']) || 'web',
    placedAt: row.placed_at as string,
    deliveryDate: row.delivery_date as string,
    deliveryGroupName: row.delivery_group_name as string | undefined,
    total: row.total as number,
    items,
  };
}

export const useAppStore = create<AppState>((set, get) => ({
  connections: [],
  products: [],
  orders: [],
  deliveryGroups: [],
  notifications: [],
  distributorProfiles: [],
  shopkeeperProfiles: [],
  cart: [],
  loading: false,

  fetchDistributorProfile: async (userId) => {
    const { data } = await supabase.from('distributor_profiles').select('*').eq('user_id', userId).single();
    if (data) {
      const [profile] = await enrichDistributorContacts([mapDistributor(data as Record<string, unknown>)]);
      set(state => ({
        distributorProfiles: state.distributorProfiles.some(d => d.userId === userId)
          ? state.distributorProfiles.map(d => d.userId === userId ? profile : d)
          : [...state.distributorProfiles, profile]
      }));
      return profile;
    }
    return null;
  },

  fetchShopkeeperProfile: async (userId) => {
    const { data } = await supabase.from('shopkeeper_profiles').select('*').eq('user_id', userId).single();
    if (data) {
      const [profile] = await enrichShopkeeperContacts([mapShopkeeper(data as Record<string, unknown>)]);
      set(state => ({
        shopkeeperProfiles: state.shopkeeperProfiles.some(s => s.userId === userId)
          ? state.shopkeeperProfiles.map(s => s.userId === userId ? profile : s)
          : [...state.shopkeeperProfiles, profile]
      }));
      return profile;
    }
    return null;
  },

  ensureShopkeeperProfile: (userId) => {
    const existing = get().shopkeeperProfiles.find(s => s.userId === userId);
    if (existing) return existing;
    return null;
  },

  fetchShopkeeperProfileById: async (shopkeeperId) => {
    const { data } = await supabase.from('shopkeeper_profiles').select('*').eq('id', shopkeeperId).single();
    if (data) {
      const [profile] = await enrichShopkeeperContacts([mapShopkeeper(data as Record<string, unknown>)]);
      set(state => ({
        shopkeeperProfiles: state.shopkeeperProfiles.some(s => s.id === shopkeeperId)
          ? state.shopkeeperProfiles.map(s => s.id === shopkeeperId ? profile : s)
          : [...state.shopkeeperProfiles, profile]
      }));
      return profile;
    }
    return null;
  },

  fetchAllDistributors: async () => {
    const { data } = await supabase.from('distributor_profiles').select('*');
    if (data) {
      const mapped = (data as Record<string, unknown>[]).map(mapDistributor);
      const enriched = await enrichDistributorContacts(mapped);
      set({ distributorProfiles: enriched });
    }
  },

  fetchConnections: async (userId, role) => {
    let query = supabase.from('connections').select('*');
    if (role === 'distributor') {
      const dp = get().distributorProfiles.find(d => d.userId === userId);
      if (dp) query = query.eq('distributor_id', dp.id);
    } else {
      const sp = get().shopkeeperProfiles.find(s => s.userId === userId);
      if (sp) query = query.eq('shopkeeper_id', sp.id);
    }
    const { data } = await query;
    if (data) set({ connections: (data as Record<string, unknown>[]).map(mapConnection) });
  },

  fetchProducts: async (distributorId) => {
    const { data } = await supabase.from('products').select('*').eq('distributor_id', distributorId);
    if (data) {
      const incoming = (data as Record<string, unknown>[]).map(mapProduct);
      set(state => ({
        // Keep other distributors' products intact; refresh only this distributor slice.
        products: [...state.products.filter(p => p.distributorId !== distributorId), ...incoming],
      }));
    }
  },

  fetchOrders: async (userId, role) => {
    let profileId = '';
    if (role === 'distributor') {
      const dp = get().distributorProfiles.find(d => d.userId === userId);
      profileId = dp?.id || '';
    } else {
      const sp = get().shopkeeperProfiles.find(s => s.userId === userId);
      profileId = sp?.id || '';
    }
    if (!profileId) return;

    const field = role === 'distributor' ? 'distributor_id' : 'shopkeeper_id';
    const { data: ordersData } = await supabase.from('orders').select('*, order_items(*)').eq(field, profileId).order('placed_at', { ascending: false });
    if (ordersData) {
      const orders = (ordersData as Record<string, unknown>[]).map(row => {
        const items = ((row.order_items as Record<string, unknown>[]) || []).map(item => ({
          id: item.id as string,
          orderId: item.order_id as string,
          productId: item.product_id as string,
          productName: item.product_name as string,
          brand: item.brand as string,
          unit: item.unit as string,
          unitPrice: item.unit_price as number,
          quantity: item.quantity as number,
        }));
        return mapOrder(row, items);
      });
      set({ orders });
    }
  },

  fetchNotifications: async (userId) => {
    const { data } = await supabase.from('notifications').select('*').eq('user_id', userId).order('created_at', { ascending: false });
    if (data) {
      set({
        notifications: (data as Record<string, unknown>[]).map(row => ({
          id: row.id as string,
          userId: row.user_id as string,
          type: row.type as string,
          message: row.message as string,
          read: row.read as boolean,
          createdAt: row.created_at as string,
        }))
      });
    }
  },

  fetchDeliveryGroups: async (distributorId) => {
    const { data } = await supabase.from('delivery_groups').select('*').eq('distributor_id', distributorId);
    if (data) {
      set({
        deliveryGroups: (data as Record<string, unknown>[]).map(row => ({
          id: row.id as string,
          distributorId: row.distributor_id as string,
          name: row.name as string,
        }))
      });
    }
  },

  createDistributorProfile: async (userId, data) => {
    const code = `${Math.random().toString(36).slice(2, 6).toUpperCase()}-${Math.random().toString(36).slice(2, 5).toUpperCase()}`;
    const { data: row, error } = await supabase.from('distributor_profiles').insert({
      user_id: userId,
      business_name: data.businessName || 'My Dairy',
      connection_code: code,
      order_window_start: data.orderWindowStart || '18:00',
      order_window_cutoff: data.orderWindowCutoff || '20:00',
      owner_name: data.ownerName,
      company: data.company,
      city: data.city,
      delivery_areas: data.deliveryAreas,
      location_name: data.locationName,
      latitude: data.latitude,
      longitude: data.longitude,
      profile_complete: true,
    }).select().single();
    if (error || !row) return null;
    const profile = mapDistributor(row as Record<string, unknown>);
    set(state => ({ distributorProfiles: [...state.distributorProfiles, profile] }));
    return profile;
  },

  createShopkeeperProfile: async (userId, data) => {
    const { data: row, error } = await supabase.from('shopkeeper_profiles').insert({
      user_id: userId,
      shop_name: data.shopName || 'My Shop',
      owner_name: data.ownerName,
      city: data.city,
      delivery_timing: data.deliveryTiming,
      location_name: data.locationName,
      latitude: data.latitude,
      longitude: data.longitude,
      profile_complete: true,
    }).select().single();
    if (error || !row) return null;
    const profile = mapShopkeeper(row as Record<string, unknown>);
    set(state => ({ shopkeeperProfiles: [...state.shopkeeperProfiles, profile] }));
    return profile;
  },

  updateDistributorSettings: async (distributorId, updates) => {
    await supabase.from('distributor_profiles').update({
      business_name: updates.businessName,
      owner_name: updates.ownerName,
      company: updates.company,
      city: updates.city,
      delivery_areas: updates.deliveryAreas,
      order_window_start: updates.orderWindowStart,
      order_window_cutoff: updates.orderWindowCutoff,
      location_name: updates.locationName,
      latitude: updates.latitude,
      longitude: updates.longitude,
      gst: updates.gst,
      profile_complete: updates.profileComplete,
    }).eq('id', distributorId);
    set(state => ({
      distributorProfiles: state.distributorProfiles.map(dp =>
        dp.id === distributorId ? { ...dp, ...updates } : dp
      )
    }));
  },

  updateShopkeeperProfile: async (shopkeeperId, updates) => {
    await supabase.from('shopkeeper_profiles').update({
      shop_name: updates.shopName,
      owner_name: updates.ownerName,
      city: updates.city,
      address: updates.address,
      delivery_timing: updates.deliveryTiming,
      location_name: updates.locationName,
      latitude: updates.latitude,
      longitude: updates.longitude,
      profile_complete: updates.profileComplete,
    }).eq('id', shopkeeperId);
    set(state => ({
      shopkeeperProfiles: state.shopkeeperProfiles.map(sp =>
        sp.id === shopkeeperId ? { ...sp, ...updates } : sp
      )
    }));
  },

  requestConnection: async (shopkeeperId, shopkeeperName, shopName, distributorCode, shopkeeperPhone) => {
    const { distributorProfiles } = get();
    const dp = distributorProfiles.find(d => d.connectionCode === distributorCode);
    if (!dp) return false;
    const basePayload = {
      shopkeeper_id: shopkeeperId,
      shopkeeper_name: shopkeeperName,
      shop_name: shopName,
      distributor_id: dp.id,
      distributor_name: dp.ownerName || '',
      business_name: dp.businessName,
      status: 'pending',
    };

    const insertWithPhonePayload = {
      ...basePayload,
      shopkeeper_phone: shopkeeperPhone || null,
    };

    let { data, error } = await supabase
      .from('connections')
      .insert(insertWithPhonePayload)
      .select()
      .single();

    // Backward compatibility: older DBs may not yet have `shopkeeper_phone`.
    if (error && `${error.message}`.toLowerCase().includes('shopkeeper_phone')) {
      const retry = await supabase
        .from('connections')
        .insert(basePayload)
        .select()
        .single();
      data = retry.data;
      error = retry.error;
    }

    if (error || !data) {
      console.error('requestConnection failed', error);
      return false;
    }
    set(state => ({ connections: [...state.connections, mapConnection(data as Record<string, unknown>)] }));
    await get().addNotification({ userId: dp.userId, type: 'new_connection', message: `${shopName} wants to connect with you`, read: false, createdAt: new Date().toISOString() });
    return true;
  },

  updateConnectionStatus: async (connectionId, status) => {
    await supabase.from('connections').update({ status }).eq('id', connectionId);
    set(state => ({ connections: state.connections.map(c => c.id === connectionId ? { ...c, status } : c) }));
  },

  assignDeliveryGroup: async (connectionId, groupId, groupName) => {
    await supabase.from('connections').update({ delivery_group_id: groupId, delivery_group_name: groupName }).eq('id', connectionId);
    set(state => ({ connections: state.connections.map(c => c.id === connectionId ? { ...c, deliveryGroupId: groupId, deliveryGroupName: groupName } : c) }));
  },

  addProduct: async (product) => {
    const { data, error } = await supabase.from('products').insert({
      distributor_id: product.distributorId,
      name: product.name,
      brand: product.brand,
      category: product.category,
      unit: product.unit,
      price: product.price,
      available: product.available,
      image_url: product.imageUrl,
    }).select().single();
    if (error || !data) return false;
    set(state => ({ products: [...state.products, mapProduct(data as Record<string, unknown>)] }));
    return true;
  },

  updateProduct: async (id, updates) => {
    const { error } = await supabase.from('products').update({
      name: updates.name, brand: updates.brand, category: updates.category,
      unit: updates.unit, price: updates.price, available: updates.available,
    }).eq('id', id);
    if (error) return false;
    set(state => ({ products: state.products.map(p => p.id === id ? { ...p, ...updates } : p) }));
    return true;
  },

  deleteProduct: async (id) => {
    const { error } = await supabase.from('products').delete().eq('id', id);
    if (error) return false;
    set(state => ({ products: state.products.filter(p => p.id !== id) }));
    return true;
  },

  placeOrder: async (shopkeeperId, shopkeeperName, shopName, distributorId, items, isLate) => {
    const total = items.reduce((s, i) => s + i.product.price * i.quantity, 0);
    const today = new Date().toISOString().split('T')[0];
    const { data: orderRow, error } = await supabase.from('orders').insert({
      shopkeeper_id: shopkeeperId,
      shopkeeper_name: shopkeeperName,
      shop_name: shopName,
      distributor_id: distributorId,
      type: isLate ? 'late' : 'normal',
      status: isLate ? 'pending' : 'accepted',
      source: 'web',
      delivery_date: today,
      total,
    }).select().single();
    if (error || !orderRow) throw new Error('Order place karne mein error');

    const orderItems = items.map(ci => ({
      order_id: (orderRow as Record<string, unknown>).id,
      product_id: ci.product.id,
      product_name: ci.product.name,
      brand: ci.product.brand,
      unit: ci.product.unit,
      unit_price: ci.product.price,
      quantity: ci.quantity,
    }));
    const { data: itemRows } = await supabase.from('order_items').insert(orderItems).select();

    const mappedItems = (itemRows as Record<string, unknown>[] || []).map(row => ({
      id: row.id as string, orderId: row.order_id as string, productId: row.product_id as string,
      productName: row.product_name as string, brand: row.brand as string, unit: row.unit as string,
      unitPrice: row.unit_price as number, quantity: row.quantity as number,
    }));

    const order = mapOrder(orderRow as Record<string, unknown>, mappedItems);
    set(state => ({ orders: [order, ...state.orders] }));

    const dp = get().distributorProfiles.find(d => d.id === distributorId);
    if (dp) await get().addNotification({ userId: dp.userId, type: isLate ? 'late_order' : 'order_placed', message: isLate ? `Late order from ${shopName}` : `New order from ${shopName}`, read: false, createdAt: new Date().toISOString() });

    return order;
  },

  updateOrderStatus: async (orderId, status) => {
    await supabase.from('orders').update({ status }).eq('id', orderId);
    set(state => ({ orders: state.orders.map(o => o.id === orderId ? { ...o, status } : o) }));
  },

  addDeliveryGroup: async (distributorId, name) => {
    const { data } = await supabase.from('delivery_groups').insert({ distributor_id: distributorId, name }).select().single();
    if (data) set(state => ({ deliveryGroups: [...state.deliveryGroups, { id: (data as Record<string, unknown>).id as string, distributorId, name }] }));
  },

  deleteDeliveryGroup: async (id) => {
    await supabase.from('delivery_groups').delete().eq('id', id);
    set(state => ({ deliveryGroups: state.deliveryGroups.filter(g => g.id !== id) }));
  },

  markNotificationRead: async (id) => {
    await supabase.from('notifications').update({ read: true }).eq('id', id);
    set(state => ({ notifications: state.notifications.map(n => n.id === id ? { ...n, read: true } : n) }));
  },

  markAllRead: async (userId) => {
    await supabase.from('notifications').update({ read: true }).eq('user_id', userId);
    set(state => ({ notifications: state.notifications.map(n => n.userId === userId ? { ...n, read: true } : n) }));
  },

  addNotification: async (notification) => {
    const { data } = await supabase.from('notifications').insert({
      user_id: notification.userId, type: notification.type,
      message: notification.message, read: notification.read,
    }).select().single();
    if (data) {
      const row = data as Record<string, unknown>;
      set(state => ({ notifications: [{ id: row.id as string, userId: row.user_id as string, type: row.type as string, message: row.message as string, read: row.read as boolean, createdAt: row.created_at as string }, ...state.notifications] }));
    }
  },

  setCartQuantity: (product, quantity) => {
    set(state => {
      if (quantity === 0) return { cart: state.cart.filter(c => c.product.id !== product.id) };
      const existing = state.cart.find(c => c.product.id === product.id);
      if (existing) return { cart: state.cart.map(c => c.product.id === product.id ? { ...c, quantity } : c) };
      const hasOtherDistributorItem = state.cart.some(
        c => c.product.distributorId !== product.distributorId
      );
      if (hasOtherDistributorItem) return { cart: state.cart };
      return { cart: [...state.cart, { product, quantity }] };
    });
  },

  clearCart: () => set({ cart: [] }),
}));
