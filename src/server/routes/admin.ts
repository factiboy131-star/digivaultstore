import express, { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import {
  db,
  Product,
  Category,
  Order,
  ProductAccess,
  SiteSettings,
  PUBLIC_UPLOADS_DIR,
  PRIVATE_FILES_DIR,
  PRIVATE_SCREENSHOTS_DIR,
} from '../db.js';
import { requireAdmin, signAdminToken, AuthenticatedRequest } from '../auth.js';

export const adminRouter = express.Router();

// Multer storage for public product images
const imageStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, PUBLIC_UPLOADS_DIR);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `prod-img-${uniqueSuffix}${ext}`);
  },
});

const uploadImage = multer({
  storage: imageStorage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (_req, file, cb) => {
    const allowed = ['.jpg', '.jpeg', '.png', '.webp'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Only JPG, JPEG, PNG, and WEBP image files are allowed'));
    }
  },
});

// Multer storage for private digital product files
const productFileStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, PRIVATE_FILES_DIR);
  },
  filename: (_req, file, cb) => {
    const safeName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
    const uniquePrefix = Date.now() + '-';
    cb(null, `${uniquePrefix}${safeName}`);
  },
});

const uploadProductFile = multer({
  storage: productFileStorage,
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB
});

// -------------------------------------------------------------
// 1. ADMIN AUTHENTICATION
// -------------------------------------------------------------
adminRouter.post('/login', (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  const admins = db.get('admin_users');
  const normalizedEmail = email.trim().toLowerCase();
  const admin = admins.find((a) => a.email.toLowerCase() === normalizedEmail);

  if (!admin) {
    return res.status(401).json({ error: 'Invalid admin credentials' });
  }

  const isMatch = bcrypt.compareSync(password, admin.password_hash);
  if (!isMatch) {
    return res.status(401).json({ error: 'Invalid admin credentials' });
  }

  const token = signAdminToken({
    id: admin.id,
    email: admin.email,
    role: admin.role,
  });

  return res.json({
    token,
    admin: {
      id: admin.id,
      email: admin.email,
      name: admin.name,
      role: admin.role,
    },
  });
});

adminRouter.get('/me', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const admins = db.get('admin_users');
  const admin = admins.find((a) => a.id === req.admin?.adminId);
  if (!admin) {
    return res.status(404).json({ error: 'Admin not found' });
  }

  return res.json({
    admin: {
      id: admin.id,
      email: admin.email,
      name: admin.name,
      role: admin.role,
    },
  });
});

// -------------------------------------------------------------
// 2. DASHBOARD STATS
// -------------------------------------------------------------
adminRouter.get('/stats', requireAdmin, (_req: Request, res: Response) => {
  const products = db.get('products');
  const orders = db.get('orders');

  const pendingPayments = orders.filter((o) => o.payment_status === 'PENDING').length;
  const verifiedPayments = orders.filter((o) => o.payment_status === 'VERIFIED').length;
  const rejectedPayments = orders.filter((o) => o.payment_status === 'REJECTED').length;

  const totalRevenue = orders
    .filter((o) => o.payment_status === 'VERIFIED')
    .reduce((sum, o) => sum + (o.amount_paid || 0), 0);

  const uniqueCustomers = new Set(orders.map((o) => o.customer_email.toLowerCase())).size;

  // Recent 10 orders
  const recentOrders = [...orders]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 10);

  // Recent pending submissions
  const recentPending = orders
    .filter((o) => o.payment_status === 'PENDING')
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 8);

  // Top selling products calculation
  const productSalesMap = new Map<string, { product: Product; count: number; revenue: number }>();
  orders
    .filter((o) => o.payment_status === 'VERIFIED')
    .forEach((order) => {
      const prod = products.find((p) => p.id === order.product_id);
      if (prod) {
        const cur = productSalesMap.get(prod.id) || { product: prod, count: 0, revenue: 0 };
        cur.count += 1;
        cur.revenue += order.amount_paid || 0;
        productSalesMap.set(prod.id, cur);
      }
    });

  const topSelling = Array.from(productSalesMap.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  return res.json({
    totalProducts: products.length,
    totalOrders: orders.length,
    pendingPayments,
    verifiedPayments,
    rejectedPayments,
    totalRevenue,
    totalCustomers: uniqueCustomers,
    recentOrders,
    recentPending,
    topSelling,
  });
});

// -------------------------------------------------------------
// 3. FILE UPLOADS (IMAGES & PRIVATE PRODUCT ASSETS)
// -------------------------------------------------------------
adminRouter.post('/upload-image', requireAdmin, uploadImage.single('image'), (req: Request, res: Response) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No image file uploaded' });
  }

  const imageUrl = `/api/uploads/images/${req.file.filename}`;
  return res.json({
    url: imageUrl,
    filename: req.file.filename,
    size: req.file.size,
  });
});

adminRouter.post(
  '/upload-product-file',
  requireAdmin,
  uploadProductFile.single('file'),
  (req: Request, res: Response) => {
    if (!req.file) {
      return res.status(400).json({ error: 'No product file uploaded' });
    }

    return res.json({
      fileName: req.file.originalname,
      filePath: req.file.filename, // Private storage filename
      fileSize: req.file.size,
    });
  }
);

// -------------------------------------------------------------
// 4. PRODUCT MANAGEMENT (CRUD)
// -------------------------------------------------------------
adminRouter.get('/products', requireAdmin, (_req: Request, res: Response) => {
  const products = db.get('products');
  return res.json({ products });
});

adminRouter.post('/products', requireAdmin, (req: Request, res: Response) => {
  const {
    name,
    slug,
    short_description,
    full_description,
    category,
    price,
    discount_price,
    product_type,
    features,
    whats_included,
    requirements,
    faq,
    status,
    featured,
    bestseller,
    main_image_url,
    gallery_images,
    product_file_name,
    product_file_size,
    product_file_path,
    digital_content,
  } = req.body;

  if (!name || price === undefined) {
    return res.status(400).json({ error: 'Product name and price are required' });
  }

  const products = db.get('products');
  const now = new Date().toISOString();

  // Create clean slug
  const finalSlug =
    slug?.trim() ||
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');

  const newProduct: Product = {
    id: `prod_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    name: name.trim(),
    slug: finalSlug,
    short_description: short_description || '',
    full_description: full_description || '',
    category: category || 'General',
    price: Number(price),
    discount_price: discount_price ? Number(discount_price) : null,
    product_type: product_type || 'PDF',
    features: Array.isArray(features) ? features : [],
    whats_included: whats_included || '',
    requirements: requirements || '',
    faq: Array.isArray(faq) ? faq : [],
    status: status || 'Draft',
    featured: Boolean(featured),
    bestseller: Boolean(bestseller),
    main_image_url:
      main_image_url ||
      'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80',
    gallery_images: Array.isArray(gallery_images) ? gallery_images : [],
    product_file_name,
    product_file_size,
    product_file_path,
    digital_content,
    created_at: now,
    updated_at: now,
  };

  products.unshift(newProduct);
  db.set('products', products);

  return res.status(201).json({ product: newProduct });
});

adminRouter.put('/products/:id', requireAdmin, (req: Request, res: Response) => {
  const { id } = req.params;
  const products = db.get('products');
  const index = products.findIndex((p) => p.id === id);

  if (index === -1) {
    return res.status(404).json({ error: 'Product not found' });
  }

  const existing = products[index];
  const now = new Date().toISOString();

  const updated: Product = {
    ...existing,
    ...req.body,
    id: existing.id,
    price: req.body.price !== undefined ? Number(req.body.price) : existing.price,
    discount_price:
      req.body.discount_price !== undefined
        ? req.body.discount_price
          ? Number(req.body.discount_price)
          : null
        : existing.discount_price,
    updated_at: now,
  };

  products[index] = updated;
  db.set('products', products);

  return res.json({ product: updated });
});

adminRouter.delete('/products/:id', requireAdmin, (req: Request, res: Response) => {
  const { id } = req.params;
  const products = db.get('products');
  const filtered = products.filter((p) => p.id !== id);

  if (filtered.length === products.length) {
    return res.status(404).json({ error: 'Product not found' });
  }

  db.set('products', filtered);
  return res.json({ success: true, message: 'Product deleted successfully' });
});

// -------------------------------------------------------------
// 5. CATEGORY MANAGEMENT
// -------------------------------------------------------------
adminRouter.get('/categories', requireAdmin, (_req: Request, res: Response) => {
  const categories = db.get('categories');
  return res.json({ categories });
});

adminRouter.post('/categories', requireAdmin, (req: Request, res: Response) => {
  const { name, slug, description, image_url, status } = req.body;
  if (!name) {
    return res.status(400).json({ error: 'Category name is required' });
  }

  const categories = db.get('categories');
  const now = new Date().toISOString();

  const newCategory: Category = {
    id: `cat_${Date.now()}`,
    name: name.trim(),
    slug: slug?.trim() || name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
    description: description || '',
    image_url,
    status: status || 'Active',
    created_at: now,
  };

  categories.push(newCategory);
  db.set('categories', categories);

  return res.status(201).json({ category: newCategory });
});

adminRouter.put('/categories/:id', requireAdmin, (req: Request, res: Response) => {
  const { id } = req.params;
  const categories = db.get('categories');
  const index = categories.findIndex((c) => c.id === id);

  if (index === -1) {
    return res.status(404).json({ error: 'Category not found' });
  }

  categories[index] = { ...categories[index], ...req.body, id };
  db.set('categories', categories);

  return res.json({ category: categories[index] });
});

adminRouter.delete('/categories/:id', requireAdmin, (req: Request, res: Response) => {
  const { id } = req.params;
  const categories = db.get('categories');
  const filtered = categories.filter((c) => c.id !== id);

  if (filtered.length === categories.length) {
    return res.status(404).json({ error: 'Category not found' });
  }

  db.set('categories', filtered);
  return res.json({ success: true, message: 'Category deleted' });
});

// -------------------------------------------------------------
// 6. ORDER & PAYMENT VERIFICATION
// -------------------------------------------------------------
adminRouter.get('/orders', requireAdmin, (req: Request, res: Response) => {
  const { status, search } = req.query;
  let orders = db.get('orders');

  if (status && status !== 'All') {
    orders = orders.filter((o) => o.payment_status === status);
  }

  if (search) {
    const q = String(search).toLowerCase();
    orders = orders.filter(
      (o) =>
        o.id.toLowerCase().includes(q) ||
        o.customer_name.toLowerCase().includes(q) ||
        o.customer_email.toLowerCase().includes(q) ||
        o.customer_phone.toLowerCase().includes(q) ||
        o.transaction_id.toLowerCase().includes(q) ||
        o.product_name.toLowerCase().includes(q)
    );
  }

  orders.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  // Attach access status info for each order
  const accessRecords = db.get('product_access');
  const ordersWithAccess = orders.map((order) => {
    const access = accessRecords.find((a) => a.order_id === order.id);
    return {
      ...order,
      access_record: access || null,
    };
  });

  return res.json({ orders: ordersWithAccess });
});

adminRouter.get('/orders/:id', requireAdmin, (req: Request, res: Response) => {
  const { id } = req.params;
  const orders = db.get('orders');
  const order = orders.find((o) => o.id === id);

  if (!order) {
    return res.status(404).json({ error: 'Order not found' });
  }

  const access = db.get('product_access').find((a) => a.order_id === order.id);
  const product = db.get('products').find((p) => p.id === order.product_id);

  return res.json({ order, access, product });
});

// Securely view payment screenshot proof (Only authorized admin can access)
adminRouter.get('/orders/:id/screenshot', requireAdmin, (req: Request, res: Response) => {
  const { id } = req.params;
  const orders = db.get('orders');
  const order = orders.find((o) => o.id === id);

  if (!order || !order.payment_screenshot_path) {
    return res.status(404).json({ error: 'Payment screenshot not found for this order' });
  }

  const filePath = path.join(PRIVATE_SCREENSHOTS_DIR, order.payment_screenshot_path);
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'Screenshot file not found on disk' });
  }

  return res.sendFile(filePath);
});

// VERIFY PAYMENT
adminRouter.post('/orders/:id/verify', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const orders = db.get('orders');
  const index = orders.findIndex((o) => o.id === id);

  if (index === -1) {
    return res.status(404).json({ error: 'Order not found' });
  }

  const order = orders[index];
  const now = new Date().toISOString();
  const settings = db.get('settings');

  // 1. Update order status
  order.payment_status = 'VERIFIED';
  order.verified_at = now;
  order.verified_by = req.admin?.email || 'admin';
  order.rejected_at = undefined;
  order.rejected_by = undefined;
  order.rejection_reason = undefined;
  order.updated_at = now;

  orders[index] = order;
  db.set('orders', orders);

  // 2. Create or update product access record
  const accessRecords = db.get('product_access');
  const existingAccessIndex = accessRecords.findIndex((a) => a.order_id === order.id);

  const accessToken = crypto.randomBytes(32).toString('hex');
  const expirationDays = settings.delivery.access_expiration_days || 365;
  const expiresAt = new Date(Date.now() + expirationDays * 24 * 60 * 60 * 1000).toISOString();

  if (existingAccessIndex >= 0) {
    accessRecords[existingAccessIndex].access_token = accessToken;
    accessRecords[existingAccessIndex].revoked_at = undefined;
    accessRecords[existingAccessIndex].expires_at = expiresAt;
  } else {
    const newAccess: ProductAccess = {
      id: `acc_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      order_id: order.id,
      customer_email: order.customer_email,
      product_id: order.product_id,
      access_token: accessToken,
      download_count: 0,
      max_downloads: settings.delivery.max_download_attempts || 10,
      expires_at: expiresAt,
      created_at: now,
    };
    accessRecords.push(newAccess);
  }
  db.set('product_access', accessRecords);

  // Simulated Email Notification
  console.log(`[EMAIL NOTIFICATION DISPATCHED]
To: ${order.customer_email}
Subject: Your Digital Product Is Ready - Order #${order.id}
Body: Hello ${order.customer_name}, Your payment has been successfully verified! Order: ${order.id}, Product: ${order.product_name}.`);

  return res.json({
    success: true,
    message: 'Payment verified and secure product access granted',
    order,
  });
});

// REJECT PAYMENT
adminRouter.post('/orders/:id/reject', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { reason } = req.body;
  const orders = db.get('orders');
  const index = orders.findIndex((o) => o.id === id);

  if (index === -1) {
    return res.status(404).json({ error: 'Order not found' });
  }

  const order = orders[index];
  const now = new Date().toISOString();

  order.payment_status = 'REJECTED';
  order.rejected_at = now;
  order.rejected_by = req.admin?.email || 'admin';
  order.rejection_reason = reason || 'Payment proof could not be verified against bank statements.';
  order.updated_at = now;

  orders[index] = order;
  db.set('orders', orders);

  // Revoke any existing access record if any
  const accessRecords = db.get('product_access');
  const accessIndex = accessRecords.findIndex((a) => a.order_id === order.id);
  if (accessIndex >= 0) {
    accessRecords[accessIndex].revoked_at = now;
    db.set('product_access', accessRecords);
  }

  return res.json({
    success: true,
    message: 'Payment rejected',
    order,
  });
});

// REVOKE ACCESS
adminRouter.post('/orders/:id/revoke-access', requireAdmin, (req: Request, res: Response) => {
  const { id } = req.params;
  const accessRecords = db.get('product_access');
  const access = accessRecords.find((a) => a.order_id === id);

  if (!access) {
    return res.status(404).json({ error: 'No active access record found for this order' });
  }

  access.revoked_at = new Date().toISOString();
  db.set('product_access', accessRecords);

  return res.json({ success: true, message: 'Product access revoked successfully' });
});

// RESTORE ACCESS
adminRouter.post('/orders/:id/restore-access', requireAdmin, (req: Request, res: Response) => {
  const { id } = req.params;
  const accessRecords = db.get('product_access');
  const access = accessRecords.find((a) => a.order_id === id);

  if (!access) {
    return res.status(404).json({ error: 'No access record found for this order' });
  }

  access.revoked_at = undefined;
  db.set('product_access', accessRecords);

  return res.json({ success: true, message: 'Product access restored successfully' });
});

// UPDATE INTERNAL ORDER NOTES
adminRouter.patch('/orders/:id/notes', requireAdmin, (req: Request, res: Response) => {
  const { id } = req.params;
  const { notes } = req.body;
  const orders = db.get('orders');
  const order = orders.find((o) => o.id === id);

  if (!order) {
    return res.status(404).json({ error: 'Order not found' });
  }

  order.internal_notes = notes || '';
  order.updated_at = new Date().toISOString();
  db.set('orders', orders);

  return res.json({ success: true, notes: order.internal_notes });
});

// -------------------------------------------------------------
// 7. CUSTOMER MANAGEMENT
// -------------------------------------------------------------
adminRouter.get('/customers', requireAdmin, (_req: Request, res: Response) => {
  const orders = db.get('orders');
  const accessRecords = db.get('product_access');

  const customerMap = new Map<string, any>();

  orders.forEach((order) => {
    const key = order.customer_email.toLowerCase();
    const existing = customerMap.get(key) || {
      email: order.customer_email,
      name: order.customer_name,
      phone: order.customer_phone,
      total_orders: 0,
      verified_orders: 0,
      total_spent: 0,
      purchased_products: [],
      latest_order: order.created_at,
    };

    existing.total_orders += 1;
    if (order.payment_status === 'VERIFIED') {
      existing.verified_orders += 1;
      existing.total_spent += order.amount_paid || 0;
      if (!existing.purchased_products.includes(order.product_name)) {
        existing.purchased_products.push(order.product_name);
      }
    }

    if (new Date(order.created_at) > new Date(existing.latest_order)) {
      existing.latest_order = order.created_at;
      existing.name = order.customer_name;
      existing.phone = order.customer_phone;
    }

    customerMap.set(key, existing);
  });

  const customers = Array.from(customerMap.values()).sort(
    (a, b) => new Date(b.latest_order).getTime() - new Date(a.latest_order).getTime()
  );

  return res.json({ customers });
});

// -------------------------------------------------------------
// 8. STORE SETTINGS (GENERAL, PAYMENTS, HOMEPAGE, DELIVERY)
// -------------------------------------------------------------
adminRouter.get('/settings', requireAdmin, (_req: Request, res: Response) => {
  const settings = db.get('settings');
  return res.json({ settings });
});

adminRouter.put('/settings', requireAdmin, (req: Request, res: Response) => {
  const current = db.get('settings');
  const updated = {
    ...current,
    ...req.body,
    general: { ...current.general, ...(req.body.general || {}) },
    payments: {
      ...current.payments,
      easypaisa: { ...current.payments.easypaisa, ...(req.body.payments?.easypaisa || {}) },
      jazzcash: { ...current.payments.jazzcash, ...(req.body.payments?.jazzcash || {}) },
    },
    delivery: { ...current.delivery, ...(req.body.delivery || {}) },
    email: { ...current.email, ...(req.body.email || {}) },
    homepage: { ...current.homepage, ...(req.body.homepage || {}) },
  };

  db.set('settings', updated);
  return res.json({ settings: updated, message: 'Settings saved successfully' });
});
