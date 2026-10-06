import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';

const DATA_DIR = path.resolve(process.cwd(), 'data');
const PRIVATE_FILES_DIR = path.resolve(DATA_DIR, 'private_files');
const PRIVATE_SCREENSHOTS_DIR = path.resolve(DATA_DIR, 'private_screenshots');
const PUBLIC_UPLOADS_DIR = path.resolve(DATA_DIR, 'uploads', 'images');
const DB_FILE = path.resolve(DATA_DIR, 'db.json');

// Ensure directories exist
[DATA_DIR, PRIVATE_FILES_DIR, PRIVATE_SCREENSHOTS_DIR, PUBLIC_UPLOADS_DIR].forEach((dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

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
  product_file_path?: string; // Private filename relative to PRIVATE_FILES_DIR
  digital_content?: string; // Text content, prompt bank, or interactive online guide
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
  id: string; // e.g. DP-20261006-8F32
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  product_id: string;
  product_name: string;
  product_price: number;
  amount_paid: number;
  payment_method: PaymentMethod;
  transaction_id: string;
  payment_screenshot_path: string; // Private filename in PRIVATE_SCREENSHOTS_DIR
  payment_status: PaymentStatus;
  verified_at?: string;
  verified_by?: string;
  rejected_at?: string;
  rejected_by?: string;
  rejection_reason?: string;
  internal_notes?: string;
  created_at: string;
  updated_at: string;
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
  password_hash: string;
  name: string;
  role: 'admin' | 'superadmin';
  created_at: string;
}

export interface DatabaseSchema {
  products: Product[];
  categories: Category[];
  orders: Order[];
  product_access: ProductAccess[];
  admin_users: AdminUser[];
  settings: SiteSettings;
}

// Default initial data
function getDefaultData(): DatabaseSchema {
  const adminEmail = process.env.ADMIN_EMAIL || 'factiboy131@gmail.com';
  // Password Mahar131 hashed using bcrypt
  const salt = bcrypt.genSaltSync(10);
  const passwordHash = bcrypt.hashSync('Mahar131', salt);

  const now = new Date().toISOString();

  // Create sample dummy PDF files in private directory so downloads work out of the box
  createDefaultPrivateFiles();

  return {
    admin_users: [
      {
        id: 'admin_1',
        email: adminEmail,
        password_hash: passwordHash,
        name: 'Store Administrator',
        role: 'superadmin',
        created_at: now,
      },
    ],
    categories: [
      {
        id: 'cat_1',
        name: 'AI Prompts',
        slug: 'ai-prompts',
        description: 'Elite prompt systems for Google Gemini, Claude, and ChatGPT.',
        status: 'Active',
        created_at: now,
      },
      {
        id: 'cat_2',
        name: 'Business',
        slug: 'business',
        description: 'Contracts, operating agreements, financial models, and proposals.',
        status: 'Active',
        created_at: now,
      },
      {
        id: 'cat_3',
        name: 'Marketing',
        slug: 'marketing',
        description: 'Direct response copy formulas, ad templates, and email sequences.',
        status: 'Active',
        created_at: now,
      },
      {
        id: 'cat_4',
        name: 'Templates',
        slug: 'templates',
        description: 'Ready-to-use documents, spreadsheets, Notion systems, and frameworks.',
        status: 'Active',
        created_at: now,
      },
      {
        id: 'cat_5',
        name: 'E-books & Guides',
        slug: 'ebooks-guides',
        description: 'Comprehensive guides and actionable industry blueprints.',
        status: 'Active',
        created_at: now,
      },
    ],
    products: [],
    orders: [],
    product_access: [],
    settings: {
      general: {
        store_name: 'DigiVault',
        store_tagline: 'Premium Digital Assets, Prompt Vaults & Executive Resources',
        store_email: 'husnaincreator6@gmail.com',
        whatsapp: '+92 371 7028832',
        currency: 'PKR',
        support_hours: '24/7 Priority Digital Support',
      },
      payments: {
        easypaisa: {
          enabled: true,
          account_name: 'Ghulam Murtaza',
          account_number: '03446730755',
          instructions:
            '1. Open EasyPaisa app or dial *786#\n2. Send the exact product amount to EasyPaisa Account: 03446730755 (Account Name: Ghulam Murtaza)\n3. Take a screenshot of the completed payment receipt\n4. Note down your Transaction ID (TID) from the SMS or app\n5. Enter your TID and upload the screenshot below to verify your order.',
        },
        jazzcash: {
          enabled: true,
          account_name: 'Fozia Bibi',
          account_number: '03247755484',
          instructions:
            '1. Open JazzCash App or dial *786#\n2. Transfer exact product amount to JazzCash Account: 03247755484 (Account Name: Fozia Bibi)\n3. Save the payment receipt screenshot\n4. Copy the 12-digit Transaction ID (TID)\n5. Submit your details below for instant verification.',
        },
      },
      delivery: {
        download_link_expiration_minutes: 15,
        max_download_attempts: 10,
        access_expiration_days: 365,
      },
      email: {
        enabled: true,
        provider: 'System Notification Service',
        sender_name: 'DigiVault Delivery Team',
        sender_email: 'delivery@digivault.store',
      },
      homepage: {
        hero_badge: '⚡ Verified Instant Digital Delivery',
        hero_heading: 'Elite Digital Assets Built for High-Impact Execution',
        hero_description: 'Instant access to rigorously tested Google AI prompt packs, business agreements, marketing blueprints, and digital tools. Paid easily via EasyPaisa and JazzCash.',
        hero_cta: 'Explore All Digital Vaults',
        announcement: '🎉 Special Launch: Save up to 50% on all Prompt Packs this week!',
        why_choose_us: [
          {
            title: '100% Verified Manual Payments',
            description: 'Simple and familiar payment via EasyPaisa or JazzCash with verified order receipts.',
            icon: 'ShieldCheck',
          },
          {
            title: 'Tamper-Proof Secure Delivery',
            description: 'Direct server-side cryptographic token downloads and private interactive asset portals.',
            icon: 'Lock',
          },
          {
            title: 'Immediate Access & Updates',
            description: 'Online prompt viewer with 1-click copy functionality and downloadable formats.',
            icon: 'Zap',
          },
        ],
      },
    },
  };
}

function createDefaultPrivateFiles() {
  const samplePdfPath = path.join(PRIVATE_FILES_DIR, '50-Google-Pro-Prompts.pdf');
  if (!fs.existsSync(samplePdfPath)) {
    const pdfContent = `%PDF-1.4
%âãÏÓ
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>
endobj
4 0 obj
<< /Length 210 >>
stream
BT
/F1 20 Tf
50 720 Td
(DIGIVAULT: 50 GOOGLE PRO PROMPTS) Tj
/F1 12 Tf
0 -30 Td
(Official Customer Copy - Licensed to Purchaser) Tj
0 -25 Td
(Prompt 01: Multi-Perspective Strategic Architecture System) Tj
0 -20 Td
(Prompt 02: High-Leverage Code Refactoring Loop) Tj
0 -20 Td
(Prompt 03: Precision Market Opportunity Synthesizer) Tj
ET
endstream
endobj
5 0 obj
<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>
endobj
xref
0 6
0000000000 65535 f 
0000000015 00000 n 
0000000068 00000 n 
0000000125 00000 n 
0000000242 00000 n 
0000000504 00000 n 
trailer
<< /Size 6 /Root 1 0 R >>
startxref
577
%%EOF`;
    fs.writeFileSync(samplePdfPath, pdfContent);
  }

  const sampleZip1 = path.join(PRIVATE_FILES_DIR, 'Copywriting-Email-Vault.zip');
  if (!fs.existsSync(sampleZip1)) {
    fs.writeFileSync(sampleZip1, 'PK\x03\x04DigiVault Copywriting Email Templates Vault Archive');
  }

  const sampleZip2 = path.join(PRIVATE_FILES_DIR, 'Startup-Legal-Pack.zip');
  if (!fs.existsSync(sampleZip2)) {
    fs.writeFileSync(sampleZip2, 'PK\x03\x04DigiVault Startup Legal Templates & Agreements Archive');
  }

  // Sample private screenshot
  const sampleScr = path.join(PRIVATE_SCREENSHOTS_DIR, 'sample_screenshot_1.png');
  if (!fs.existsSync(sampleScr)) {
    // 1x1 transparent PNG fallback bytes
    const pngBytes = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
      'base64'
    );
    fs.writeFileSync(sampleScr, pngBytes);
  }
}

class Database {
  private data: DatabaseSchema;

  constructor() {
    this.data = this.load();
  }

  private load(): DatabaseSchema {
    try {
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        // Ensure defaults if missing properties
        const defaultData = getDefaultData();
        return {
          products: parsed.products || defaultData.products,
          categories: parsed.categories || defaultData.categories,
          orders: parsed.orders || defaultData.orders,
          product_access: parsed.product_access || defaultData.product_access,
          admin_users: parsed.admin_users || defaultData.admin_users,
          settings: parsed.settings ? { ...defaultData.settings, ...parsed.settings } : defaultData.settings,
        };
      }
    } catch (err) {
      console.error('Error loading database file, initializing defaults:', err);
    }

    const initial = getDefaultData();
    this.saveData(initial);
    return initial;
  }

  private saveData(data: DatabaseSchema) {
    try {
      const tempPath = `${DB_FILE}.tmp`;
      fs.writeFileSync(tempPath, JSON.stringify(data, null, 2), 'utf-8');
      fs.renameSync(tempPath, DB_FILE);
    } catch (err) {
      console.error('Failed to write database file:', err);
    }
  }

  public get<K extends keyof DatabaseSchema>(key: K): DatabaseSchema[K] {
    return this.data[key];
  }

  public set<K extends keyof DatabaseSchema>(key: K, value: DatabaseSchema[K]) {
    this.data[key] = value;
    this.saveData(this.data);
  }

  public save() {
    this.saveData(this.data);
  }
}

export const db = new Database();
export { DATA_DIR, PRIVATE_FILES_DIR, PRIVATE_SCREENSHOTS_DIR, PUBLIC_UPLOADS_DIR };
