import { Hono } from 'hono';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { repo, readFile, saveFile, Product, Category, ProductAccess } from '../db.js';
import { requireAdmin, signAdminToken, AdminEnv } from '../auth.js';

export const adminRouter = new Hono<AdminEnv>();

const ALLOWED_IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp'];
// Function request bodies are capped at 6MB, so keep uploads comfortably below that
const MAX_UPLOAD_SIZE = 5 * 1024 * 1024;

function extname(fileName: string): string {
  const dot = fileName.lastIndexOf('.');
  return dot >= 0 ? fileName.slice(dot).toLowerCase() : '';
}

async function readJson(c: { req: { json: () => Promise<any> } }): Promise<any> {
  return c.req.json().catch(() => ({}));
}

// -------------------------------------------------------------
// 1. ADMIN AUTHENTICATION
// -------------------------------------------------------------
adminRouter.post('/login', async (c) => {
  const { email, password } = await readJson(c);

  if (!email || !password) {
    return c.json({ error: 'Email and password are required' }, 400);
  }

  const admins = await repo.adminUsers.all();
  const normalizedEmail = email.trim().toLowerCase();
  const admin = admins.find((a) => a.email.toLowerCase() === normalizedEmail);

  if (!admin) {
    return c.json({ error: 'Invalid admin credentials' }, 401);
  }

  const isMatch = bcrypt.compareSync(password, admin.password_hash);
  if (!isMatch) {
    return c.json({ error: 'Invalid admin credentials' }, 401);
  }

  const token = signAdminToken({
    id: admin.id,
    email: admin.email,
    role: admin.role,
  });

  return c.json({
    token,
    admin: {
      id: admin.id,
      email: admin.email,
      name: admin.name,
      role: admin.role,
    },
  });
});

adminRouter.get('/me', requireAdmin, async (c) => {
  const admin = await repo.adminUsers.get(c.get('admin').adminId);
  if (!admin) {
    return c.json({ error: 'Admin not found' }, 404);
  }

  return c.json({
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
adminRouter.get('/stats', requireAdmin, async (c) => {
  const [products, orders] = await Promise.all([repo.products.all(), repo.orders.all()]);

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

  return c.json({
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
adminRouter.post('/upload-image', requireAdmin, async (c) => {
  const body = await c.req.parseBody();
  const file = body.image instanceof File ? body.image : null;
  if (!file) {
    return c.json({ error: 'No image file uploaded' }, 400);
  }

  const ext = extname(file.name);
  if (!ALLOWED_IMAGE_EXTENSIONS.includes(ext)) {
    return c.json({ error: 'Only JPG, JPEG, PNG, and WEBP image files are allowed' }, 400);
  }
  if (file.size > MAX_UPLOAD_SIZE) {
    return c.json({ error: 'Image must be smaller than 5MB' }, 400);
  }

  const filename = `prod-img-${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
  await saveFile('images', filename, await file.arrayBuffer(), file.type);

  return c.json({
    url: `/api/uploads/images/${filename}`,
    filename,
    size: file.size,
  });
});

adminRouter.post('/upload-product-file', requireAdmin, async (c) => {
  const body = await c.req.parseBody();
  const file = body.file instanceof File ? body.file : null;
  if (!file) {
    return c.json({ error: 'No product file uploaded' }, 400);
  }
  if (file.size > MAX_UPLOAD_SIZE) {
    return c.json({ error: 'Product file must be smaller than 5MB' }, 400);
  }

  const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
  const filePath = `${Date.now()}-${safeName}`;
  await saveFile('products', filePath, await file.arrayBuffer(), file.type || 'application/octet-stream');

  return c.json({
    fileName: file.name,
    filePath, // Private storage filename
    fileSize: file.size,
  });
});

// -------------------------------------------------------------
// 4. PRODUCT MANAGEMENT (CRUD)
// -------------------------------------------------------------
adminRouter.get('/products', requireAdmin, async (c) => {
  const products = await repo.products.all();
  return c.json({ products });
});

adminRouter.post('/products', requireAdmin, async (c) => {
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
  } = await readJson(c);

  if (!name || price === undefined) {
    return c.json({ error: 'Product name and price are required' }, 400);
  }

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

  await repo.products.put(newProduct);

  return c.json({ product: newProduct }, 201);
});

adminRouter.put('/products/:id', requireAdmin, async (c) => {
  const id = c.req.param('id');
  const existing = await repo.products.get(id);

  if (!existing) {
    return c.json({ error: 'Product not found' }, 404);
  }

  const body = await readJson(c);
  const now = new Date().toISOString();

  const updated: Product = {
    ...existing,
    ...body,
    id: existing.id,
    created_at: existing.created_at,
    price: body.price !== undefined ? Number(body.price) : existing.price,
    discount_price:
      body.discount_price !== undefined
        ? body.discount_price
          ? Number(body.discount_price)
          : null
        : existing.discount_price,
    updated_at: now,
  };

  await repo.products.put(updated);

  return c.json({ product: updated });
});

adminRouter.delete('/products/:id', requireAdmin, async (c) => {
  const removed = await repo.products.remove(c.req.param('id'));

  if (!removed) {
    return c.json({ error: 'Product not found' }, 404);
  }

  return c.json({ success: true, message: 'Product deleted successfully' });
});

// -------------------------------------------------------------
// 5. CATEGORY MANAGEMENT
// -------------------------------------------------------------
adminRouter.get('/categories', requireAdmin, async (c) => {
  const categories = await repo.categories.all();
  return c.json({ categories });
});

adminRouter.post('/categories', requireAdmin, async (c) => {
  const { name, slug, description, image_url, status } = await readJson(c);
  if (!name) {
    return c.json({ error: 'Category name is required' }, 400);
  }

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

  await repo.categories.put(newCategory);

  return c.json({ category: newCategory }, 201);
});

adminRouter.put('/categories/:id', requireAdmin, async (c) => {
  const id = c.req.param('id');
  const existing = await repo.categories.get(id);

  if (!existing) {
    return c.json({ error: 'Category not found' }, 404);
  }

  const updated: Category = { ...existing, ...(await readJson(c)), id, created_at: existing.created_at };
  await repo.categories.put(updated);

  return c.json({ category: updated });
});

adminRouter.delete('/categories/:id', requireAdmin, async (c) => {
  const removed = await repo.categories.remove(c.req.param('id'));

  if (!removed) {
    return c.json({ error: 'Category not found' }, 404);
  }

  return c.json({ success: true, message: 'Category deleted' });
});

// -------------------------------------------------------------
// 6. ORDER & PAYMENT VERIFICATION
// -------------------------------------------------------------
adminRouter.get('/orders', requireAdmin, async (c) => {
  const { status, search } = c.req.query();
  let orders = await repo.orders.all();

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
  const accessRecords = await repo.productAccess.all();
  const ordersWithAccess = orders.map((order) => {
    const access = accessRecords.find((a) => a.order_id === order.id);
    return {
      ...order,
      access_record: access || null,
    };
  });

  return c.json({ orders: ordersWithAccess });
});

adminRouter.get('/orders/:id', requireAdmin, async (c) => {
  const order = await repo.orders.get(c.req.param('id'));

  if (!order) {
    return c.json({ error: 'Order not found' }, 404);
  }

  const [access, product] = await Promise.all([
    repo.getAccessForOrder(order.id),
    repo.products.get(order.product_id),
  ]);

  return c.json({ order, access, product });
});

// Securely view payment screenshot proof (Only authorized admin can access)
adminRouter.get('/orders/:id/screenshot', requireAdmin, async (c) => {
  const order = await repo.orders.get(c.req.param('id'));

  if (!order || !order.payment_screenshot_path) {
    return c.json({ error: 'Payment screenshot not found for this order' }, 404);
  }

  const file = await readFile('screenshots', order.payment_screenshot_path);
  if (!file) {
    return c.json({ error: 'Screenshot file not found in storage' }, 404);
  }

  return new Response(file.data, {
    headers: {
      'Content-Type': String(file.metadata.contentType || 'application/octet-stream'),
      'Cache-Control': 'private, no-store',
    },
  });
});

// VERIFY PAYMENT
adminRouter.post('/orders/:id/verify', requireAdmin, async (c) => {
  const order = await repo.orders.get(c.req.param('id'));

  if (!order) {
    return c.json({ error: 'Order not found' }, 404);
  }

  const now = new Date().toISOString();
  const settings = await repo.getSettings();

  // 1. Update order status
  order.payment_status = 'VERIFIED';
  order.verified_at = now;
  order.verified_by = c.get('admin')?.email || 'admin';
  order.rejected_at = undefined;
  order.rejected_by = undefined;
  order.rejection_reason = undefined;
  order.updated_at = now;

  await repo.orders.put(order);

  // 2. Create or update product access record
  const existingAccess = await repo.getAccessForOrder(order.id);

  const accessToken = crypto.randomBytes(32).toString('hex');
  const expirationDays = settings.delivery.access_expiration_days || 365;
  const expiresAt = new Date(Date.now() + expirationDays * 24 * 60 * 60 * 1000).toISOString();

  if (existingAccess) {
    existingAccess.access_token = accessToken;
    existingAccess.revoked_at = undefined;
    existingAccess.expires_at = expiresAt;
    await repo.productAccess.put(existingAccess);
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
    await repo.productAccess.put(newAccess);
  }

  // Simulated Email Notification
  console.log(`[EMAIL NOTIFICATION DISPATCHED]
To: ${order.customer_email}
Subject: Your Digital Product Is Ready - Order #${order.id}
Body: Hello ${order.customer_name}, Your payment has been successfully verified! Order: ${order.id}, Product: ${order.product_name}.`);

  return c.json({
    success: true,
    message: 'Payment verified and secure product access granted',
    order,
  });
});

// REJECT PAYMENT
adminRouter.post('/orders/:id/reject', requireAdmin, async (c) => {
  const { reason } = await readJson(c);
  const order = await repo.orders.get(c.req.param('id'));

  if (!order) {
    return c.json({ error: 'Order not found' }, 404);
  }

  const now = new Date().toISOString();

  order.payment_status = 'REJECTED';
  order.rejected_at = now;
  order.rejected_by = c.get('admin')?.email || 'admin';
  order.rejection_reason = reason || 'Payment proof could not be verified against bank statements.';
  order.updated_at = now;

  await repo.orders.put(order);

  // Revoke any existing access record if any
  const access = await repo.getAccessForOrder(order.id);
  if (access) {
    access.revoked_at = now;
    await repo.productAccess.put(access);
  }

  return c.json({
    success: true,
    message: 'Payment rejected',
    order,
  });
});

// REVOKE ACCESS
adminRouter.post('/orders/:id/revoke-access', requireAdmin, async (c) => {
  const access = await repo.getAccessForOrder(c.req.param('id'));

  if (!access) {
    return c.json({ error: 'No active access record found for this order' }, 404);
  }

  access.revoked_at = new Date().toISOString();
  await repo.productAccess.put(access);

  return c.json({ success: true, message: 'Product access revoked successfully' });
});

// RESTORE ACCESS
adminRouter.post('/orders/:id/restore-access', requireAdmin, async (c) => {
  const access = await repo.getAccessForOrder(c.req.param('id'));

  if (!access) {
    return c.json({ error: 'No access record found for this order' }, 404);
  }

  access.revoked_at = undefined;
  await repo.productAccess.put(access);

  return c.json({ success: true, message: 'Product access restored successfully' });
});

// UPDATE INTERNAL ORDER NOTES
adminRouter.patch('/orders/:id/notes', requireAdmin, async (c) => {
  const { notes } = await readJson(c);
  const order = await repo.orders.get(c.req.param('id'));

  if (!order) {
    return c.json({ error: 'Order not found' }, 404);
  }

  order.internal_notes = notes || '';
  order.updated_at = new Date().toISOString();
  await repo.orders.put(order);

  return c.json({ success: true, notes: order.internal_notes });
});

// -------------------------------------------------------------
// 7. CUSTOMER MANAGEMENT
// -------------------------------------------------------------
adminRouter.get('/customers', requireAdmin, async (c) => {
  const orders = await repo.orders.all();

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

  return c.json({ customers });
});

// -------------------------------------------------------------
// 8. STORE SETTINGS (GENERAL, PAYMENTS, HOMEPAGE, DELIVERY)
// -------------------------------------------------------------
adminRouter.get('/settings', requireAdmin, async (c) => {
  const settings = await repo.getSettings();
  return c.json({ settings });
});

adminRouter.put('/settings', requireAdmin, async (c) => {
  const body = await readJson(c);
  const current = await repo.getSettings();
  const updated = {
    ...current,
    ...body,
    general: { ...current.general, ...(body.general || {}) },
    payments: {
      ...current.payments,
      easypaisa: { ...current.payments.easypaisa, ...(body.payments?.easypaisa || {}) },
      jazzcash: { ...current.payments.jazzcash, ...(body.payments?.jazzcash || {}) },
    },
    delivery: { ...current.delivery, ...(body.delivery || {}) },
    email: { ...current.email, ...(body.email || {}) },
    homepage: { ...current.homepage, ...(body.homepage || {}) },
  };

  await repo.saveSettings(updated);
  return c.json({ settings: updated, message: 'Settings saved successfully' });
});
