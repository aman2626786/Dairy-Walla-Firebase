import type { User, DistributorProfile, ShopkeeperProfile, Connection, Product, Order, DeliveryGroup, Notification } from '../types';

// ─── Users ───────────────────────────────────────────────────────────────────
export const MOCK_USERS: User[] = [
  { id: 'u1', phone: '9876543210', name: 'Ramesh Sharma', role: 'distributor' },
  { id: 'u2', phone: '9876543211', name: 'Suresh Patel', role: 'shopkeeper' },
  { id: 'u3', phone: '9876543212', name: 'Mahesh Gupta', role: 'shopkeeper' },
  { id: 'u4', phone: '9876543213', name: 'Dinesh Kumar', role: 'shopkeeper' },
  { id: 'u5', phone: '9876543214', name: 'Priya Dairy', role: 'distributor' },
];

// ─── Distributor Profiles ─────────────────────────────────────────────────────
export const MOCK_DISTRIBUTOR_PROFILES: DistributorProfile[] = [
  {
    id: 'dp1',
    userId: 'u1',
    businessName: 'Sharma Dairy Distributors',
    connectionCode: 'SHARMA-7X3',
    orderWindowStart: '18:00',
    orderWindowCutoff: '20:00',
  },
  {
    id: 'dp2',
    userId: 'u5',
    businessName: 'Priya Fresh Dairy',
    connectionCode: 'PRIYA-4K9',
    orderWindowStart: '17:00',
    orderWindowCutoff: '19:30',
  },
];

// ─── Shopkeeper Profiles ──────────────────────────────────────────────────────
export const MOCK_SHOPKEEPER_PROFILES: ShopkeeperProfile[] = [
  { id: 'sp1', userId: 'u2', shopName: 'Patel General Store' },
  { id: 'sp2', userId: 'u3', shopName: 'Gupta Kirana' },
  { id: 'sp3', userId: 'u4', shopName: 'Kumar Provisions' },
];

// ─── Delivery Groups ──────────────────────────────────────────────────────────
export const MOCK_DELIVERY_GROUPS: DeliveryGroup[] = [
  { id: 'dg1', distributorId: 'dp1', name: 'Sector 12 - North' },
  { id: 'dg2', distributorId: 'dp1', name: 'Sector 15 - South' },
  { id: 'dg3', distributorId: 'dp1', name: 'Main Market' },
];

// ─── Connections ──────────────────────────────────────────────────────────────
export const MOCK_CONNECTIONS: Connection[] = [
  {
    id: 'c1',
    shopkeeperId: 'sp1',
    shopkeeperName: 'Suresh Patel',
    shopName: 'Patel General Store',
    distributorId: 'dp1',
    distributorName: 'Ramesh Sharma',
    businessName: 'Sharma Dairy Distributors',
    status: 'active',
    deliveryGroupId: 'dg1',
    deliveryGroupName: 'Sector 12 - North',
    createdAt: '2024-01-10T10:00:00Z',
  },
  {
    id: 'c2',
    shopkeeperId: 'sp2',
    shopkeeperName: 'Mahesh Gupta',
    shopName: 'Gupta Kirana',
    distributorId: 'dp1',
    distributorName: 'Ramesh Sharma',
    businessName: 'Sharma Dairy Distributors',
    status: 'active',
    deliveryGroupId: 'dg2',
    deliveryGroupName: 'Sector 15 - South',
    createdAt: '2024-01-11T10:00:00Z',
  },
  {
    id: 'c3',
    shopkeeperId: 'sp3',
    shopkeeperName: 'Dinesh Kumar',
    shopName: 'Kumar Provisions',
    distributorId: 'dp1',
    distributorName: 'Ramesh Sharma',
    businessName: 'Sharma Dairy Distributors',
    status: 'pending',
    createdAt: '2024-01-15T10:00:00Z',
  },
];

// ─── Products ─────────────────────────────────────────────────────────────────
export const MOCK_PRODUCTS: Product[] = [
  { id: 'p1', distributorId: 'dp1', name: 'Full Cream Milk', brand: 'Amul', category: 'milk', unit: '500ml pouch', price: 28, available: true },
  { id: 'p2', distributorId: 'dp1', name: 'Toned Milk', brand: 'Amul', category: 'milk', unit: '500ml pouch', price: 24, available: true },
  { id: 'p3', distributorId: 'dp1', name: 'Double Toned Milk', brand: 'Saras', category: 'milk', unit: '500ml pouch', price: 22, available: true },
  { id: 'p4', distributorId: 'dp1', name: 'Paneer', brand: 'Amul', category: 'paneer', unit: '200g block', price: 85, available: true },
  { id: 'p5', distributorId: 'dp1', name: 'Fresh Paneer', brand: 'Local', category: 'paneer', unit: '500g block', price: 160, available: true },
  { id: 'p6', distributorId: 'dp1', name: 'Dahi (Curd)', brand: 'Amul', category: 'curd', unit: '400g cup', price: 45, available: true },
  { id: 'p7', distributorId: 'dp1', name: 'Mishti Doi', brand: 'Saras', category: 'curd', unit: '200g cup', price: 35, available: true },
  { id: 'p8', distributorId: 'dp1', name: 'Butter', brand: 'Amul', category: 'butter', unit: '100g pack', price: 55, available: true },
  { id: 'p9', distributorId: 'dp1', name: 'Salted Butter', brand: 'Amul', category: 'butter', unit: '500g pack', price: 260, available: true },
  { id: 'p10', distributorId: 'dp1', name: 'Pure Ghee', brand: 'Amul', category: 'ghee', unit: '500ml jar', price: 320, available: true },
  { id: 'p11', distributorId: 'dp1', name: 'Cow Ghee', brand: 'Local', category: 'ghee', unit: '1L tin', price: 580, available: true },
  { id: 'p12', distributorId: 'dp1', name: 'Lassi', brand: 'Saras', category: 'other', unit: '200ml bottle', price: 20, available: false },
];

// ─── Orders ───────────────────────────────────────────────────────────────────
const today = new Date().toISOString().split('T')[0];
const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

export const MOCK_ORDERS: Order[] = [
  {
    id: 'o1',
    shopkeeperId: 'sp1',
    shopkeeperName: 'Suresh Patel',
    shopName: 'Patel General Store',
    distributorId: 'dp1',
    type: 'normal',
    status: 'accepted',
    source: 'web',
    placedAt: `${today}T18:30:00Z`,
    deliveryDate: today,
    deliveryGroupName: 'Sector 12 - North',
    items: [
      { id: 'oi1', orderId: 'o1', productId: 'p1', productName: 'Full Cream Milk', brand: 'Amul', unit: '500ml pouch', unitPrice: 28, quantity: 20 },
      { id: 'oi2', orderId: 'o1', productId: 'p4', productName: 'Paneer', brand: 'Amul', unit: '200g block', unitPrice: 85, quantity: 5 },
      { id: 'oi3', orderId: 'o1', productId: 'p8', productName: 'Butter', brand: 'Amul', unit: '100g pack', unitPrice: 55, quantity: 10 },
    ],
    total: 20 * 28 + 5 * 85 + 10 * 55,
  },
  {
    id: 'o2',
    shopkeeperId: 'sp2',
    shopkeeperName: 'Mahesh Gupta',
    shopName: 'Gupta Kirana',
    distributorId: 'dp1',
    type: 'normal',
    status: 'accepted',
    source: 'web',
    placedAt: `${today}T19:00:00Z`,
    deliveryDate: today,
    deliveryGroupName: 'Sector 15 - South',
    items: [
      { id: 'oi4', orderId: 'o2', productId: 'p2', productName: 'Toned Milk', brand: 'Amul', unit: '500ml pouch', unitPrice: 24, quantity: 30 },
      { id: 'oi5', orderId: 'o2', productId: 'p6', productName: 'Dahi (Curd)', brand: 'Amul', unit: '400g cup', unitPrice: 45, quantity: 8 },
      { id: 'oi6', orderId: 'o2', productId: 'p10', productName: 'Pure Ghee', brand: 'Amul', unit: '500ml jar', unitPrice: 320, quantity: 2 },
    ],
    total: 30 * 24 + 8 * 45 + 2 * 320,
  },
  {
    id: 'o3',
    shopkeeperId: 'sp1',
    shopkeeperName: 'Suresh Patel',
    shopName: 'Patel General Store',
    distributorId: 'dp1',
    type: 'late',
    status: 'pending',
    source: 'whatsapp',
    placedAt: `${today}T21:15:00Z`,
    deliveryDate: today,
    deliveryGroupName: 'Sector 12 - North',
    items: [
      { id: 'oi7', orderId: 'o3', productId: 'p3', productName: 'Double Toned Milk', brand: 'Saras', unit: '500ml pouch', unitPrice: 22, quantity: 15 },
      { id: 'oi8', orderId: 'o3', productId: 'p5', productName: 'Fresh Paneer', brand: 'Local', unit: '500g block', unitPrice: 160, quantity: 3 },
    ],
    total: 15 * 22 + 3 * 160,
  },
  {
    id: 'o4',
    shopkeeperId: 'sp2',
    shopkeeperName: 'Mahesh Gupta',
    shopName: 'Gupta Kirana',
    distributorId: 'dp1',
    type: 'late',
    status: 'pending',
    source: 'web',
    placedAt: `${today}T20:45:00Z`,
    deliveryDate: today,
    deliveryGroupName: 'Sector 15 - South',
    items: [
      { id: 'oi9', orderId: 'o4', productId: 'p9', productName: 'Salted Butter', brand: 'Amul', unit: '500g pack', unitPrice: 260, quantity: 4 },
      { id: 'oi10', orderId: 'o4', productId: 'p11', productName: 'Cow Ghee', brand: 'Local', unit: '1L tin', unitPrice: 580, quantity: 1 },
    ],
    total: 4 * 260 + 1 * 580,
  },
  {
    id: 'o5',
    shopkeeperId: 'sp1',
    shopkeeperName: 'Suresh Patel',
    shopName: 'Patel General Store',
    distributorId: 'dp1',
    type: 'normal',
    status: 'fulfilled',
    source: 'web',
    placedAt: `${yesterday}T18:45:00Z`,
    deliveryDate: yesterday,
    deliveryGroupName: 'Sector 12 - North',
    items: [
      { id: 'oi11', orderId: 'o5', productId: 'p1', productName: 'Full Cream Milk', brand: 'Amul', unit: '500ml pouch', unitPrice: 28, quantity: 25 },
      { id: 'oi12', orderId: 'o5', productId: 'p7', productName: 'Mishti Doi', brand: 'Saras', unit: '200g cup', unitPrice: 35, quantity: 6 },
    ],
    total: 25 * 28 + 6 * 35,
  },
];

// ─── Notifications ────────────────────────────────────────────────────────────
export const MOCK_NOTIFICATIONS: Notification[] = [
  { id: 'n1', userId: 'u1', type: 'late_order', message: '2 late orders received from Patel General Store & Gupta Kirana', read: false, createdAt: `${today}T21:15:00Z` },
  { id: 'n2', userId: 'u1', type: 'new_connection', message: 'Kumar Provisions wants to connect with you', read: false, createdAt: `${today}T10:00:00Z` },
  { id: 'n3', userId: 'u1', type: 'order_placed', message: '2 new orders received during order window', read: true, createdAt: `${today}T19:05:00Z` },
  { id: 'n4', userId: 'u2', type: 'order_confirmed', message: 'Your order has been confirmed for today', read: true, createdAt: `${today}T18:31:00Z` },
  { id: 'n5', userId: 'u2', type: 'connection_approved', message: 'Sharma Dairy Distributors approved your connection', read: true, createdAt: '2024-01-10T10:05:00Z' },
];
