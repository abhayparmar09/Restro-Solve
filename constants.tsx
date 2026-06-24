import { Category, Coupon } from './types';

export const CATEGORIES: Category[] = [
  'Combos',
  'Meals',
  'Salad',
  'Soups',
  'Starters',
  'Main Course',
  'Jain Main Course',
  'Breads',
  'Rice',
  'Biryani',
  'Noodles',
  'Fried Rice',
  'Snacks',
  'Accompaniments',
  'Drinks'
];

export const AVAILABLE_COUPONS: Coupon[] = [
  { code: 'WELCOME20', discountPercentage: 20, description: '20% Off on your first order' },
  { code: 'SUNDAYFEAST', discountPercentage: 15, description: 'Flat 15% Off on Sundays' },
  { code: 'GOURMET10', discountPercentage: 10, description: '10% Off on orders above ₹500' }
];
