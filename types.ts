
export type Language = 'en' | 'hi';

export type Category =
  | 'Combos'
  | 'Meals'
  | 'Salad'
  | 'Soups'
  | 'Starters'
  | 'Main Course'
  | 'Jain Main Course'
  | 'Breads'
  | 'Rice'
  | 'Biryani'
  | 'Noodles'
  | 'Fried Rice'
  | 'Snacks'
  | 'Accompaniments'
  | 'Drinks';

export interface MenuItem {
  id: string;
  name: {
    en: string;
    hi: string;
  };
  description: {
    en: string;
    hi: string;
  };
  price: number;
  category: Category;
  image?: string; // [DEPRECATED] Keep for backward compatibility if needed
  imageUrl?: string; // [NEW] Primary image field
  isVeg: boolean;
  dietType?: 'veg' | 'non-veg' | 'vegan' | 'egg'; // [NEW] Extended Diet Type
  isAvailable: boolean;
  spiceLevel?: 'Mild' | 'Medium' | 'Hot';
  createdAt?: any; // [NEW] For ordering
}

export interface Coupon {
  code: string;
  discountPercentage: number;
  description: string;
}

export interface CartItem extends MenuItem {
  quantity: number;
}

export enum OrderStatus {
  PENDING = 'Pending',
  CONFIRMED = 'Confirmed', // [NEW] Confirmed/Paid
  PREPARING = 'Preparing',
  READY = 'Ready', // [NEW] Ready to Serve
  SERVED = 'Served', // Served to table
  COMPLETED = 'Completed', // Paid/Done
  CANCELLED = 'Cancelled',
  AWAITING_PAYMENT = 'Awaiting Payment',
  CANCELLED_PAYMENT = 'Cancelled Payment'
}

export type PaymentMethod = 'PhonePe' | 'GPay' | 'Paytm' | 'Cash' | 'Card' | 'QR' | 'UPI';

export type CheckoutStep = 'NONE' | 'PHONE' | 'OTP' | 'PAYMENT' | 'UPI_WAIT' | 'PROCESSING' | 'SUCCESS';

export interface Order {
  id: string;
  tableNumber: string;
  customerName: string;
  customerPhone: string;
  items: CartItem[];
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  status: OrderStatus;
  timestamp: number | any; // Allow Firestore FieldValue
  paymentMethod: PaymentMethod;
  paymentType?: 'CASH' | 'ONLINE'; // [NEW] Derived field for accounting

  paymentStatus: 'Paid' | 'Unpaid' | 'Failed';
  userId?: string;
  firebaseDocId?: string; // [NEW] For tracking Firestore ID
  isPaid?: boolean;
  completedAt?: any;
}

export type ViewType = 'CUSTOMER' | 'ADMIN' | 'KITCHEN';
export type StaffRole = 'STAFF' | 'MANAGER' | 'NONE';
