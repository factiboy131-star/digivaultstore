import { Hono } from 'hono';
import crypto from 'crypto';
import { repo, readFile, saveFile, Order } from '../db.js';
import { signDownloadToken, verifyDownloadToken } from '../auth.js';

export const publicRouter = new Hono();

const ALLOWED_PROOF_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp'];
// Function request bodies are capped at 6MB, so keep uploads comfortably below that
const MAX_PROOF_SIZE = 5 * 1024 * 1024;

function extname(fileName: string): string {
  const dot = fileName.lastIndexOf('.');
  return dot >= 0 ? fileName.slice(dot).toLowerCase() : '';
}

// Helper to generate formatted order ID like DP-20261006-8F32
function generateOrderId(): string {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const randomHex = crypto.randomBytes(2).toString('hex').toUpperCase();
  return `DP-${dateStr}-${randomHex}`;
}

// -------------------------------------------------------------
// 0. PUBLIC PRODUCT IMAGES
// -------------------------------------------------------------
publicRouter.get('/uploads/images/:name', async (c) => {
  const file = await readFile('images', c.req.param('name'));
  if (!file) {
    return c.json({ error: 'Image not found' }, 404);
  }
  return new Response(file.data, {
    headers: {
      'Content-Type': String(file.metadata.contentType || 'application/octet-stream'),
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  });
});

// -------------------------------------------------------------
// 1. PUBLIC STORE CONFIG & CATALOG
// -------------------------------------------------------------
publicRouter.get('/store-info', async (c) => {
  const settings = await repo.getSettings();
  // Strip any internal sensitive configs if any, return public view
  return c.json({
    general: settings.general,
    payments: {
      easypaisa: {
        enabled: settings.payments.easypaisa.enabled,
        account_name: settings.payments.easypaisa.account_name,
        account_number: settings.payments.easypaisa.account_number,
        instructions: settings.payments.easypaisa.instructions,
      },
      jazzcash: {
        enabled: settings.payments.jazzcash.enabled,
        account_name: settings.payments.jazzcash.account_name,
        account_number: settings.payments.jazzcash.account_number,
        instructions: settings.payments.jazzcash.instructions,
      },
    },
    homepage: settings.homepage,
  });
});

publicRouter.get('/categories', async (c) => {
  const categories = (await repo.categories.all()).filter((cat) => cat.status === 'Active');
  return c.json({ categories });
});

publicRouter.get('/products', async (c) => {
  const { category, search, featured, bestseller } = c.req.query();
  let products = (await repo.products.all()).filter((p) => p.status === 'Published');

  if (category) {
    products = products.filter(
      (p) => p.category.toLowerCase() === String(category).toLowerCase()
    );
  }

  if (search) {
    const q = String(search).toLowerCase();
    products = products.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.short_description.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        p.features.some((f) => f.toLowerCase().includes(q))
    );
  }

  if (featured === 'true') {
    products = products.filter((p) => p.featured);
  }

  if (bestseller === 'true') {
    products = products.filter((p) => p.bestseller);
  }

  // Sanitize products: do NOT expose private product_file_path or internal digital content
  const safeProducts = products.map((p) => {
    const { product_file_path, digital_content, ...rest } = p;
    return {
      ...rest,
      has_digital_file: Boolean(product_file_path),
      has_online_content: Boolean(digital_content),
    };
  });

  return c.json({ products: safeProducts });
});

publicRouter.get('/products/:slugOrId', async (c) => {
  const slugOrId = c.req.param('slugOrId');
  const products = await repo.products.all();
  const product = products.find(
    (p) =>
      p.status === 'Published' &&
      (p.slug === slugOrId || p.id === slugOrId)
  );

  if (!product) {
    return c.json({ error: 'Product not found or unavailable' }, 404);
  }

  // Never expose raw private file paths
  const { product_file_path, digital_content, ...safeProduct } = product;

  return c.json({
    product: {
      ...safeProduct,
      has_digital_file: Boolean(product_file_path),
      has_online_content: Boolean(digital_content),
    },
  });
});

// -------------------------------------------------------------
// 2. CHECKOUT & ORDER CREATION
// -------------------------------------------------------------
publicRouter.post('/orders/checkout', async (c) => {
  try {
    const body = await c.req.parseBody();
    const customer_name = typeof body.customer_name === 'string' ? body.customer_name : '';
    const customer_email = typeof body.customer_email === 'string' ? body.customer_email : '';
    const customer_phone = typeof body.customer_phone === 'string' ? body.customer_phone : '';
    const product_id = typeof body.product_id === 'string' ? body.product_id : '';
    const payment_method = typeof body.payment_method === 'string' ? body.payment_method : '';
    const transaction_id = typeof body.transaction_id === 'string' ? body.transaction_id : '';
    const screenshot = body.payment_screenshot instanceof File ? body.payment_screenshot : null;

    if (!customer_name || !customer_email || !customer_phone) {
      return c.json({ error: 'Customer contact details are required' }, 400);
    }

    if (!product_id) {
      return c.json({ error: 'Product is required' }, 400);
    }

    if (!payment_method || !['EasyPaisa', 'JazzCash'].includes(payment_method)) {
      return c.json({ error: 'Please select a valid payment method (EasyPaisa or JazzCash)' }, 400);
    }

    if (!transaction_id || transaction_id.trim().length < 4) {
      return c.json({ error: 'Please enter a valid Transaction ID (TID)' }, 400);
    }

    if (!screenshot) {
      return c.json({ error: 'Payment screenshot proof is required' }, 400);
    }

    const ext = extname(screenshot.name);
    if (!ALLOWED_PROOF_EXTENSIONS.includes(ext)) {
      return c.json({ error: 'Only JPG, JPEG, PNG, or WEBP image proofs are accepted' }, 400);
    }

    if (screenshot.size > MAX_PROOF_SIZE) {
      return c.json({ error: 'Payment screenshot must be smaller than 5MB' }, 400);
    }

    const product = await repo.products.get(product_id);
    if (!product || product.status !== 'Published') {
      return c.json({ error: 'Selected product is no longer available' }, 404);
    }

    const screenshotName = `proof-${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
    await saveFile('screenshots', screenshotName, await screenshot.arrayBuffer(), screenshot.type);

    const finalPrice = product.discount_price !== null ? product.discount_price : product.price;
    const orderId = generateOrderId();
    const now = new Date().toISOString();

    const newOrder: Order = {
      id: orderId,
      customer_name: customer_name.trim(),
      customer_email: customer_email.trim().toLowerCase(),
      customer_phone: customer_phone.trim(),
      product_id: product.id,
      product_name: product.name,
      product_price: product.price,
      amount_paid: finalPrice,
      payment_method: payment_method as any,
      transaction_id: transaction_id.trim(),
      payment_screenshot_path: screenshotName,
      payment_status: 'PENDING',
      created_at: now,
      updated_at: now,
    };

    await repo.orders.put(newOrder);

    return c.json(
      {
        success: true,
        orderId: newOrder.id,
        message: 'Payment proof submitted successfully! Your order is pending verification.',
        order: {
          id: newOrder.id,
          customer_name: newOrder.customer_name,
          customer_email: newOrder.customer_email,
          product_name: newOrder.product_name,
          amount_paid: newOrder.amount_paid,
          payment_method: newOrder.payment_method,
          transaction_id: newOrder.transaction_id,
          payment_status: newOrder.payment_status,
          created_at: newOrder.created_at,
        },
      },
      201
    );
  } catch (err: any) {
    console.error('Checkout error:', err);
    return c.json({ error: err.message || 'Failed to submit order' }, 500);
  }
});

// -------------------------------------------------------------
// 3. SECURE ORDER TRACKING & DIGITAL ACCESS
// -------------------------------------------------------------
publicRouter.get('/orders/track', async (c) => {
  const { orderId, email } = c.req.query();

  if (!orderId || !email) {
    return c.json({ error: 'Order ID and email are required to check status' }, 400);
  }

  const cleanOrderId = String(orderId).trim().toUpperCase();
  const cleanEmail = String(email).trim().toLowerCase();

  const order = await repo.orders.get(cleanOrderId);

  if (!order || order.customer_email.toLowerCase() !== cleanEmail) {
    return c.json({ error: 'No matching order found for this Order ID and Email.' }, 404);
  }

  const product = await repo.products.get(order.product_id);
  const access = await repo.getAccessForOrder(order.id);

  // Default response without protected assets
  const responseData: any = {
    order: {
      id: order.id,
      customer_name: order.customer_name,
      customer_email: order.customer_email,
      product_name: order.product_name,
      amount_paid: order.amount_paid,
      payment_method: order.payment_method,
      transaction_id: order.transaction_id,
      payment_status: order.payment_status,
      created_at: order.created_at,
      verified_at: order.verified_at,
      rejected_at: order.rejected_at,
      rejection_reason: order.rejection_reason,
    },
    access_granted: false,
  };

  // Strict backend verification of ownership and status
  if (order.payment_status === 'VERIFIED' && access) {
    // Check if access was revoked
    if (access.revoked_at) {
      responseData.access_granted = false;
      responseData.access_revoked = true;
      responseData.message = 'Access to this product has been revoked by administration.';
      return c.json(responseData);
    }

    // Check expiration
    if (new Date(access.expires_at).getTime() < Date.now()) {
      responseData.access_granted = false;
      responseData.access_expired = true;
      responseData.message = 'Product access has expired.';
      return c.json(responseData);
    }

    // Authorization verified! Provide temporary signed download token and digital content
    const downloadToken = signDownloadToken(order.id, order.product_id, order.customer_email);

    responseData.access_granted = true;
    responseData.product = {
      id: product?.id,
      name: product?.name,
      product_type: product?.product_type,
      whats_included: product?.whats_included,
      has_downloadable_file: Boolean(product?.product_file_path),
      product_file_name: product?.product_file_name,
      product_file_size: product?.product_file_size,
      // For online documents / prompt pack viewer:
      digital_content: product?.digital_content || null,
    };
    responseData.download_token = downloadToken;
    responseData.download_count = access.download_count;
    responseData.max_downloads = access.max_downloads;
    responseData.expires_at = access.expires_at;
  }

  return c.json(responseData);
});

// Customer portal: list all orders by verified email lookup
publicRouter.post('/customer/my-orders', async (c) => {
  const { email } = await c.req.json().catch(() => ({} as any));
  if (!email) {
    return c.json({ error: 'Email address is required' }, 400);
  }

  const cleanEmail = String(email).trim().toLowerCase();
  const orders = (await repo.orders.all()).filter((o) => o.customer_email.toLowerCase() === cleanEmail);
  const accessRecords = await repo.productAccess.all();

  const formatted = orders.map((order) => {
    const access = accessRecords.find((a) => a.order_id === order.id);
    const hasActiveAccess =
      order.payment_status === 'VERIFIED' && access && !access.revoked_at;

    return {
      id: order.id,
      product_name: order.product_name,
      product_id: order.product_id,
      amount_paid: order.amount_paid,
      payment_method: order.payment_method,
      payment_status: order.payment_status,
      created_at: order.created_at,
      has_access: hasActiveAccess,
    };
  });

  return c.json({ orders: formatted });
});

// -------------------------------------------------------------
// 4. SECURE SERVER-SIDE PRODUCT FILE DELIVERY
// -------------------------------------------------------------
publicRouter.get('/customer/download-file', async (c) => {
  const token = c.req.query('token');

  if (!token) {
    return c.json({ error: 'Access Denied: Missing cryptographic download token.' }, 403);
  }

  const payload = verifyDownloadToken(String(token));
  if (!payload) {
    return c.json(
      {
        error: 'Access Denied: Download link has expired or is invalid. Please request a fresh link from your order page.',
      },
      403
    );
  }

  const { orderId, productId, email } = payload;

  // 1. Verify order
  const order = await repo.orders.get(orderId);

  if (!order || order.customer_email.toLowerCase() !== email.toLowerCase() || order.payment_status !== 'VERIFIED') {
    return c.json({ error: 'Access Denied: Payment is unverified or invalid.' }, 403);
  }

  // 2. Verify product access record
  const access = await repo.getAccessForOrder(order.id);

  if (!access) {
    return c.json({ error: 'Access Denied: No access record exists for this purchase.' }, 403);
  }

  if (access.revoked_at) {
    return c.json({ error: 'Access Denied: Access has been revoked.' }, 403);
  }

  if (new Date(access.expires_at).getTime() < Date.now()) {
    return c.json({ error: 'Access Denied: Access period has expired.' }, 403);
  }

  if (access.download_count >= access.max_downloads) {
    return c.json(
      {
        error: `Access Denied: Maximum download limit (${access.max_downloads} downloads) reached. Contact support for reset.`,
      },
      403
    );
  }

  // 3. Locate private file
  const product = await repo.products.get(productId);

  if (!product || !product.product_file_path) {
    return c.json({ error: 'No downloadable asset attached to this product.' }, 404);
  }

  const file = await readFile('products', product.product_file_path);
  if (!file) {
    return c.json({ error: 'Product asset file could not be found on server.' }, 404);
  }

  // 4. Increment download count
  access.download_count += 1;
  await repo.productAccess.put(access);

  // 5. Send file with attachment disposition
  const downloadFileName = (product.product_file_name || product.product_file_path).replace(/"/g, '');
  return new Response(file.data, {
    headers: {
      'Content-Disposition': `attachment; filename="${downloadFileName}"`,
      'Content-Type': 'application/octet-stream',
    },
  });
});
