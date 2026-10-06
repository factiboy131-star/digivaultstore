import express, { Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import {
  db,
  Product,
  Order,
  ProductAccess,
  PRIVATE_SCREENSHOTS_DIR,
  PRIVATE_FILES_DIR,
} from '../db.js';
import { signDownloadToken, verifyDownloadToken } from '../auth.js';

export const publicRouter = express.Router();

// Multer storage for customer payment screenshots (Stored in PRIVATE directory!)
const screenshotStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, PRIVATE_SCREENSHOTS_DIR);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `proof-${unique}${ext}`);
  },
});

const uploadScreenshot = multer({
  storage: screenshotStorage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (_req, file, cb) => {
    const allowed = ['.jpg', '.jpeg', '.png', '.webp'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Only JPG, JPEG, PNG, or WEBP image proofs are accepted'));
    }
  },
});

// Helper to generate formatted order ID like DP-20261006-8F32
function generateOrderId(): string {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const randomHex = crypto.randomBytes(2).toString('hex').toUpperCase();
  return `DP-${dateStr}-${randomHex}`;
}

// -------------------------------------------------------------
// 1. PUBLIC STORE CONFIG & CATALOG
// -------------------------------------------------------------
publicRouter.get('/store-info', (_req: Request, res: Response) => {
  const settings = db.get('settings');
  // Strip any internal sensitive configs if any, return public view
  return res.json({
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

publicRouter.get('/categories', (_req: Request, res: Response) => {
  const categories = db.get('categories').filter((c) => c.status === 'Active');
  return res.json({ categories });
});

publicRouter.get('/products', (req: Request, res: Response) => {
  const { category, search, featured, bestseller } = req.query;
  let products = db.get('products').filter((p) => p.status === 'Published');

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

  return res.json({ products: safeProducts });
});

publicRouter.get('/products/:slugOrId', (req: Request, res: Response) => {
  const { slugOrId } = req.params;
  const products = db.get('products');
  const product = products.find(
    (p) =>
      p.status === 'Published' &&
      (p.slug === slugOrId || p.id === slugOrId)
  );

  if (!product) {
    return res.status(404).json({ error: 'Product not found or unavailable' });
  }

  // Never expose raw private file paths
  const { product_file_path, digital_content, ...safeProduct } = product;

  return res.json({
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
publicRouter.post(
  '/orders/checkout',
  uploadScreenshot.single('payment_screenshot'),
  (req: Request, res: Response) => {
    try {
      const {
        customer_name,
        customer_email,
        customer_phone,
        product_id,
        payment_method,
        transaction_id,
      } = req.body;

      if (!customer_name || !customer_email || !customer_phone) {
        return res.status(400).json({ error: 'Customer contact details are required' });
      }

      if (!product_id) {
        return res.status(400).json({ error: 'Product is required' });
      }

      if (!payment_method || !['EasyPaisa', 'JazzCash'].includes(payment_method)) {
        return res.status(400).json({ error: 'Please select a valid payment method (EasyPaisa or JazzCash)' });
      }

      if (!transaction_id || transaction_id.trim().length < 4) {
        return res.status(400).json({ error: 'Please enter a valid Transaction ID (TID)' });
      }

      if (!req.file) {
        return res.status(400).json({ error: 'Payment screenshot proof is required' });
      }

      const products = db.get('products');
      const product = products.find((p) => p.id === product_id && p.status === 'Published');
      if (!product) {
        return res.status(404).json({ error: 'Selected product is no longer available' });
      }

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
        payment_screenshot_path: req.file.filename,
        payment_status: 'PENDING',
        created_at: now,
        updated_at: now,
      };

      const orders = db.get('orders');
      orders.unshift(newOrder);
      db.set('orders', orders);

      return res.status(201).json({
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
      });
    } catch (err: any) {
      console.error('Checkout error:', err);
      return res.status(500).json({ error: err.message || 'Failed to submit order' });
    }
  }
);

// -------------------------------------------------------------
// 3. SECURE ORDER TRACKING & DIGITAL ACCESS
// -------------------------------------------------------------
publicRouter.get('/orders/track', (req: Request, res: Response) => {
  const { orderId, email } = req.query;

  if (!orderId || !email) {
    return res.status(400).json({ error: 'Order ID and email are required to check status' });
  }

  const orders = db.get('orders');
  const cleanOrderId = String(orderId).trim().toUpperCase();
  const cleanEmail = String(email).trim().toLowerCase();

  const order = orders.find(
    (o) => o.id.toUpperCase() === cleanOrderId && o.customer_email.toLowerCase() === cleanEmail
  );

  if (!order) {
    return res.status(404).json({ error: 'No matching order found for this Order ID and Email.' });
  }

  const product = db.get('products').find((p) => p.id === order.product_id);
  const accessRecords = db.get('product_access');
  const access = accessRecords.find((a) => a.order_id === order.id);

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
      return res.json(responseData);
    }

    // Check expiration
    if (new Date(access.expires_at).getTime() < Date.now()) {
      responseData.access_granted = false;
      responseData.access_expired = true;
      responseData.message = 'Product access has expired.';
      return res.json(responseData);
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

  return res.json(responseData);
});

// Customer portal: list all orders by verified email lookup
publicRouter.post('/customer/my-orders', (req: Request, res: Response) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ error: 'Email address is required' });
  }

  const cleanEmail = String(email).trim().toLowerCase();
  const orders = db.get('orders').filter((o) => o.customer_email.toLowerCase() === cleanEmail);
  const accessRecords = db.get('product_access');

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

  return res.json({ orders: formatted });
});

// -------------------------------------------------------------
// 4. SECURE SERVER-SIDE PRODUCT FILE DELIVERY
// -------------------------------------------------------------
publicRouter.get('/customer/download-file', (req: Request, res: Response) => {
  const { token } = req.query;

  if (!token) {
    return res.status(403).json({ error: 'Access Denied: Missing cryptographic download token.' });
  }

  const payload = verifyDownloadToken(String(token));
  if (!payload) {
    return res.status(403).json({
      error: 'Access Denied: Download link has expired or is invalid. Please request a fresh link from your order page.',
    });
  }

  const { orderId, productId, email } = payload;

  // 1. Verify order
  const orders = db.get('orders');
  const order = orders.find(
    (o) => o.id === orderId && o.customer_email.toLowerCase() === email.toLowerCase()
  );

  if (!order || order.payment_status !== 'VERIFIED') {
    return res.status(403).json({ error: 'Access Denied: Payment is unverified or invalid.' });
  }

  // 2. Verify product access record
  const accessRecords = db.get('product_access');
  const access = accessRecords.find((a) => a.order_id === order.id);

  if (!access) {
    return res.status(403).json({ error: 'Access Denied: No access record exists for this purchase.' });
  }

  if (access.revoked_at) {
    return res.status(403).json({ error: 'Access Denied: Access has been revoked.' });
  }

  if (new Date(access.expires_at).getTime() < Date.now()) {
    return res.status(403).json({ error: 'Access Denied: Access period has expired.' });
  }

  if (access.download_count >= access.max_downloads) {
    return res.status(403).json({
      error: `Access Denied: Maximum download limit (${access.max_downloads} downloads) reached. Contact support for reset.`,
    });
  }

  // 3. Locate private file
  const products = db.get('products');
  const product = products.find((p) => p.id === productId);

  if (!product || !product.product_file_path) {
    return res.status(404).json({ error: 'No downloadable asset attached to this product.' });
  }

  const filePath = path.join(PRIVATE_FILES_DIR, product.product_file_path);
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'Product asset file could not be found on server.' });
  }

  // 4. Increment download count
  access.download_count += 1;
  db.set('product_access', accessRecords);

  // 5. Stream file with attachment disposition
  const downloadFileName = product.product_file_name || path.basename(filePath);
  res.setHeader('Content-Disposition', `attachment; filename="${downloadFileName}"`);
  res.setHeader('Content-Type', 'application/octet-stream');

  const fileStream = fs.createReadStream(filePath);
  fileStream.pipe(res);
});
