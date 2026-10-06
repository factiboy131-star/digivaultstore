export interface FAQItem {
  question: string;
  answer: string;
}

export type ProductType =
  | 'PDF'
  | 'DOCX'
  | 'ZIP'
  | 'E-book'
  | 'Prompt Pack'
  | 'Template'
  | 'Online Document'
  | 'Documents'
  | 'Digital Bundle'
  | 'Other';

export type ProductStatus = 'Draft' | 'Published' | 'Unpublished';

export interface Product {
  id: string;
  name: string;
  slug: string;
  short_description: string;
  full_description: string;
  category: string;
  price: number;
  discount_price: number | null;
  product_type: ProductType;
  features: string[];
  whats_included: string;
  requirements: string;
  faq: FAQItem[];
  status: ProductStatus;
  featured: boolean;
  bestseller: boolean;
  main_image_url: string;
  gallery_images: string[];
  product_file_name?: string;
  product_file_size?: number;
  has_digital_file?: boolean;
  has_online_content?: boolean;
  digital_content?: string;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  image_url?: string;
  status: 'Active' | 'Inactive';
  created_at: string;
}

export type PaymentMethod = 'EasyPaisa' | 'JazzCash';
export type PaymentStatus = 'PENDING' | 'VERIFIED' | 'REJECTED' | 'EXPIRED';

export interface Order {
  id: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  product_id: string;
  product_name: string;
  product_price: number;
  amount_paid: number;
  payment_method: PaymentMethod;
  transaction_id: string;
  payment_screenshot_path?: string;
  payment_status: PaymentStatus;
  verified_at?: string;
  verified_by?: string;
  rejected_at?: string;
  rejected_by?: string;
  rejection_reason?: string;
  internal_notes?: string;
  created_at: string;
  updated_at: string;
  access_record?: ProductAccess | null;
}

export interface ProductAccess {
  id: string;
  order_id: string;
  customer_email: string;
  product_id: string;
  access_token: string;
  download_count: number;
  max_downloads: number;
  expires_at: string;
  revoked_at?: string;
  created_at: string;
}

export interface SiteSettings {
  general: {
    store_name: string;
    store_tagline: string;
    store_email: string;
    whatsapp: string;
    currency: string;
    support_hours: string;
  };
  payments: {
    easypaisa: {
      enabled: boolean;
      account_name: string;
      account_number: string;
      instructions: string;
    };
    jazzcash: {
      enabled: boolean;
      account_name: string;
      account_number: string;
      instructions: string;
    };
  };
  delivery: {
    download_link_expiration_minutes: number;
    max_download_attempts: number;
    access_expiration_days: number;
  };
  email: {
    enabled: boolean;
    provider: string;
    sender_name: string;
    sender_email: string;
  };
  homepage: {
    hero_badge: string;
    hero_heading: string;
    hero_description: string;
    hero_cta: string;
    announcement: string;
    why_choose_us: Array<{
      title: string;
      description: string;
      icon: string;
    }>;
  };
}

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: string;
}

export interface DashboardStats {
  totalProducts: number;
  totalOrders: number;
  pendingPayments: number;
  verifiedPayments: number;
  rejectedPayments: number;
  totalRevenue: number;
  totalCustomers: number;
  recentOrders: Order[];
  recentPending: Order[];
  topSelling: Array<{
    product: Product;
    count: number;
    revenue: number;
  }>;
}

export interface CustomerSummary {
  email: string;
  name: string;
  phone: string;
  total_orders: number;
  verified_orders: number;
  total_spent: number;
  purchased_products: string[];
  latest_order: string;
}
