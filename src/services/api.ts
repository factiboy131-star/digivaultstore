import {
  Product,
  Category,
  Order,
  SiteSettings,
  AdminUser,
  DashboardStats,
  CustomerSummary,
} from '../types';

const ADMIN_TOKEN_KEY = 'digivault_admin_token';

export const authStorage = {
  getToken: () => localStorage.getItem(ADMIN_TOKEN_KEY),
  setToken: (token: string) => localStorage.setItem(ADMIN_TOKEN_KEY, token),
  clearToken: () => localStorage.removeItem(ADMIN_TOKEN_KEY),
};

function getAuthHeaders(): HeadersInit {
  const token = authStorage.getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// -------------------------------------------------------------
// PUBLIC STORE API
// -------------------------------------------------------------
export const storeApi = {
  async getStoreInfo(): Promise<SiteSettings> {
    const res = await fetch('/api/store-info');
    if (!res.ok) throw new Error('Failed to fetch store settings');
    return res.json();
  },

  async getCategories(): Promise<Category[]> {
    const res = await fetch('/api/categories');
    if (!res.ok) throw new Error('Failed to fetch categories');
    const data = await res.json();
    return data.categories || [];
  },

  async getProducts(params?: {
    category?: string;
    search?: string;
    featured?: boolean;
    bestseller?: boolean;
  }): Promise<Product[]> {
    const query = new URLSearchParams();
    if (params?.category) query.append('category', params.category);
    if (params?.search) query.append('search', params.search);
    if (params?.featured) query.append('featured', 'true');
    if (params?.bestseller) query.append('bestseller', 'true');

    const res = await fetch(`/api/products?${query.toString()}`);
    if (!res.ok) throw new Error('Failed to fetch products');
    const data = await res.json();
    return data.products || [];
  },

  async getProduct(slugOrId: string): Promise<Product> {
    const res = await fetch(`/api/products/${slugOrId}`);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Product not found');
    }
    const data = await res.json();
    return data.product;
  },

  async submitCheckout(formData: FormData): Promise<{
    orderId: string;
    message: string;
    order: Order;
  }> {
    const res = await fetch('/api/orders/checkout', {
      method: 'POST',
      body: formData,
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Payment submission failed');
    }
    return data;
  },

  async trackOrder(orderId: string, email: string): Promise<{
    order: Order;
    access_granted: boolean;
    access_revoked?: boolean;
    access_expired?: boolean;
    message?: string;
    product?: {
      id: string;
      name: string;
      product_type: string;
      whats_included?: string;
      has_downloadable_file: boolean;
      product_file_name?: string;
      product_file_size?: number;
      digital_content?: string | null;
    };
    download_token?: string;
    download_count?: number;
    max_downloads?: number;
    expires_at?: string;
  }> {
    const query = new URLSearchParams({ orderId, email });
    const res = await fetch(`/api/orders/track?${query.toString()}`);
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Order lookup failed');
    }
    return data;
  },

  async getCustomerOrders(email: string): Promise<any[]> {
    const res = await fetch('/api/customer/my-orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to retrieve orders');
    return data.orders || [];
  },

  getDownloadUrl(token: string): string {
    return `/api/customer/download-file?token=${encodeURIComponent(token)}`;
  },
};

// -------------------------------------------------------------
// ADMIN API
// -------------------------------------------------------------
export const adminApi = {
  async login(email: string, password: string): Promise<{ token: string; admin: AdminUser }> {
    const res = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Login failed');
    }
    authStorage.setToken(data.token);
    return data;
  },

  async getMe(): Promise<AdminUser> {
    const res = await fetch('/api/admin/me', {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Unauthorized');
    const data = await res.json();
    return data.admin;
  },

  async getStats(): Promise<DashboardStats> {
    const res = await fetch('/api/admin/stats', {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to load stats');
    return res.json();
  },

  async getProducts(): Promise<Product[]> {
    const res = await fetch('/api/admin/products', {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to load products');
    const data = await res.json();
    return data.products || [];
  },

  async createProduct(productData: Partial<Product>): Promise<Product> {
    const res = await fetch('/api/admin/products', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify(productData),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to create product');
    return data.product;
  },

  async updateProduct(id: string, productData: Partial<Product>): Promise<Product> {
    const res = await fetch(`/api/admin/products/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify(productData),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to update product');
    return data.product;
  },

  async deleteProduct(id: string): Promise<void> {
    const res = await fetch(`/api/admin/products/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || 'Failed to delete product');
    }
  },

  async uploadProductImage(file: File): Promise<{ url: string; filename: string }> {
    const formData = new FormData();
    formData.append('image', file);

    const res = await fetch('/api/admin/upload-image', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: formData,
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Image upload failed');
    return data;
  },

  async uploadProductFile(file: File): Promise<{ fileName: string; filePath: string; fileSize: number }> {
    const formData = new FormData();
    formData.append('file', file);

    const res = await fetch('/api/admin/upload-product-file', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: formData,
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Product file upload failed');
    return data;
  },

  async getOrders(params?: { status?: string; search?: string }): Promise<Order[]> {
    const query = new URLSearchParams();
    if (params?.status) query.append('status', params.status);
    if (params?.search) query.append('search', params.search);

    const res = await fetch(`/api/admin/orders?${query.toString()}`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to load orders');
    const data = await res.json();
    return data.orders || [];
  },

  async getOrder(id: string): Promise<{ order: Order; access: any; product: Product }> {
    const res = await fetch(`/api/admin/orders/${id}`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Order not found');
    return res.json();
  },

  getScreenshotUrl(orderId: string): string {
    return `/api/admin/orders/${orderId}/screenshot`;
  },

  async verifyPayment(orderId: string): Promise<{ order: Order; message: string }> {
    const res = await fetch(`/api/admin/orders/${orderId}/verify`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Verification failed');
    return data;
  },

  async rejectPayment(orderId: string, reason?: string): Promise<{ order: Order; message: string }> {
    const res = await fetch(`/api/admin/orders/${orderId}/reject`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify({ reason }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Rejection failed');
    return data;
  },

  async revokeAccess(orderId: string): Promise<void> {
    const res = await fetch(`/api/admin/orders/${orderId}/revoke-access`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || 'Revoke access failed');
    }
  },

  async restoreAccess(orderId: string): Promise<void> {
    const res = await fetch(`/api/admin/orders/${orderId}/restore-access`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || 'Restore access failed');
    }
  },

  async updateOrderNotes(orderId: string, notes: string): Promise<void> {
    const res = await fetch(`/api/admin/orders/${orderId}/notes`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify({ notes }),
    });
    if (!res.ok) throw new Error('Failed to update notes');
  },

  async getCustomers(): Promise<CustomerSummary[]> {
    const res = await fetch('/api/admin/customers', {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to load customers');
    const data = await res.json();
    return data.customers || [];
  },

  async getCategories(): Promise<Category[]> {
    const res = await fetch('/api/admin/categories', {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to load categories');
    const data = await res.json();
    return data.categories || [];
  },

  async createCategory(cat: Partial<Category>): Promise<Category> {
    const res = await fetch('/api/admin/categories', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify(cat),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to create category');
    return data.category;
  },

  async updateCategory(id: string, cat: Partial<Category>): Promise<Category> {
    const res = await fetch(`/api/admin/categories/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify(cat),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to update category');
    return data.category;
  },

  async deleteCategory(id: string): Promise<void> {
    const res = await fetch(`/api/admin/categories/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to delete category');
  },

  async getSettings(): Promise<SiteSettings> {
    const res = await fetch('/api/admin/settings', {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to load settings');
    const data = await res.json();
    return data.settings;
  },

  async updateSettings(settings: Partial<SiteSettings>): Promise<SiteSettings> {
    const res = await fetch('/api/admin/settings', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify(settings),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to save settings');
    return data.settings;
  },
};
