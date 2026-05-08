export type Role = 'distributor' | 'shopkeeper';

export type ConnectionStatus = 'pending' | 'active' | 'rejected';

export type OrderType = 'normal' | 'late';

export type OrderStatus = 'pending' | 'accepted' | 'rejected' | 'fulfilled';

export type KnownProductCategory = 'milk' | 'paneer' | 'curd' | 'butter' | 'ghee' | 'other';
export type ProductCategory = KnownProductCategory | (string & {});

export interface User {
  id: string;
  email: string;
  name: string;
  phone?: string;
  role: Role;
}

export interface DistributorProfile {
  id: string;
  userId: string;
  businessName: string;
  phone?: string;
  email?: string;
  connectionCode: string;
  orderWindowStart: string; // "HH:MM"
  orderWindowCutoff: string; // "HH:MM"
  // Extended fields
  ownerName?: string;
  company?: string;       // e.g. Amul, Saras, Local
  address?: string;
  city?: string;
  deliveryAreas?: string; // comma separated
  gst?: string;
  profileComplete?: boolean;
  // Location fields
  latitude?: number;
  longitude?: number;
  locationName?: string; // e.g. "Vaishali Nagar, Ajmer"
}

export interface ShopkeeperProfile {
  id: string;
  userId: string;
  shopName: string;
  phone?: string;
  email?: string;
  // Extended fields
  ownerName?: string;
  address?: string;
  city?: string;
  deliveryTiming?: string; // e.g. "Morning", "Evening"
  profileComplete?: boolean;
  // Location fields
  latitude?: number;
  longitude?: number;
  locationName?: string;
}

export interface Connection {
  id: string;
  shopkeeperId: string;
  shopkeeperName: string;
  shopName: string;
  shopkeeperPhone?: string;
  distributorId: string;
  distributorName: string;
  businessName: string;
  status: ConnectionStatus;
  autoOrderEnabled?: boolean;
  deliveryGroupId?: string;
  deliveryGroupName?: string;
  createdAt: string;
}

export interface DeliveryGroup {
  id: string;
  distributorId: string;
  name: string;
}

export interface Product {
  id: string;
  distributorId: string;
  name: string;
  brand: string;
  category: ProductCategory;
  unit: string;
  price: number;
  available: boolean;
  imageUrl?: string; // Product image URL
}

export interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  productName: string;
  brand: string;
  unit: string;
  unitPrice: number;
  quantity: number;
}

export interface Order {
  id: string;
  shopkeeperId: string;
  shopkeeperName: string;
  shopName: string;
  distributorId: string;
  type: OrderType;
  status: OrderStatus;
  source: 'web' | 'whatsapp';
  placedAt: string;
  deliveryDate: string;
  items: OrderItem[];
  total: number;
  deliveryGroupName?: string;
}

export interface Invoice {
  id: string;
  orderId: string;
  shopkeeperName: string;
  shopName: string;
  orderDate: string;
  items: OrderItem[];
  totalAmount: number;
  outdated: boolean;
  generatedAt: string;
}

export interface Notification {
  id: string;
  userId: string;
  type: string;
  message: string;
  read: boolean;
  createdAt: string;
}

export interface OrderSummaryItem {
  productId: string;
  productName: string;
  brand: string;
  category: ProductCategory;
  unit: string;
  totalQuantity: number;
}

export interface DeliveryGroupSummary {
  groupId: string;
  groupName: string;
  items: OrderSummaryItem[];
}

export interface CartItem {
  product: Product;
  quantity: number;
}
