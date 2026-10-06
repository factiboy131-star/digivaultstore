import { asc, desc, eq } from 'drizzle-orm';
import type { PgColumn, PgTable } from 'drizzle-orm/pg-core';
import { getStore } from '@netlify/blobs';
import bcrypt from 'bcryptjs';
import { db as sqlDb } from '../../db/index.js';
import * as schema from '../../db/schema.js';

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
function getDefaultAdmin(): AdminUser {
  const adminEmail = Netlify.env.get('ADMIN_EMAIL') || 'factiboy131@gmail.com';
  // Password Mahar131 hashed using bcrypt
  const salt = bcrypt.genSaltSync(10);
  const passwordHash = bcrypt.hashSync('Mahar131', salt);

  return {
    id: 'admin_1',
    email: adminEmail,
    password_hash: passwordHash,
    name: 'Store Administrator',
    role: 'superadmin',
    created_at: new Date().toISOString(),
  };
}

function getDefaultData(): Omit<DatabaseSchema, 'admin_users'> {
  const now = new Date().toISOString();

  return {
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


// -------------------------------------------------------------
// Persistence (Netlify Database for records, Netlify Blobs for files)
// -------------------------------------------------------------
type CollectionTable = PgTable & { id: PgColumn; data: PgColumn; createdAt: PgColumn };

function collection<T extends { id: string; created_at?: string }>(
  table: CollectionTable,
  order: 'asc' | 'desc',
  extraColumns: (record: T) => Record<string, unknown> = () => ({})
) {
  const t = table as any;
  return {
    async all(): Promise<T[]> {
      const rows = await sqlDb
        .select({ data: t.data })
        .from(t)
        .orderBy(order === 'asc' ? asc(t.createdAt) : desc(t.createdAt));
      return rows.map((r: any) => r.data as T);
    },
    async get(id: string): Promise<T | undefined> {
      const [row] = await sqlDb.select({ data: t.data }).from(t).where(eq(t.id, id)).limit(1);
      return row ? ((row as any).data as T) : undefined;
    },
    async put(record: T): Promise<T> {
      const values = {
        id: record.id,
        data: record,
        ...extraColumns(record),
        ...(record.created_at ? { createdAt: new Date(record.created_at) } : {}),
      };
      const { id: _id, createdAt: _createdAt, ...updatable } = values as any;
      await sqlDb.insert(t).values(values).onConflictDoUpdate({ target: t.id, set: updatable });
      return record;
    },
    async remove(id: string): Promise<boolean> {
      const deleted = await sqlDb.delete(t).where(eq(t.id, id)).returning({ id: t.id });
      return deleted.length > 0;
    },
  };
}

export const repo = {
  products: collection<Product>(schema.products as any, 'desc'),
  categories: collection<Category>(schema.categories as any, 'asc'),
  orders: collection<Order>(schema.orders as any, 'desc', (o) => ({ customerEmail: o.customer_email })),
  productAccess: collection<ProductAccess>(schema.productAccess as any, 'asc', (a) => ({ orderId: a.order_id })),
  adminUsers: collection<AdminUser>(schema.adminUsers as any, 'asc', (a) => ({ email: a.email.toLowerCase() })),

  async getAccessForOrder(orderId: string): Promise<ProductAccess | undefined> {
    const [row] = await sqlDb
      .select({ data: schema.productAccess.data })
      .from(schema.productAccess)
      .where(eq(schema.productAccess.orderId, orderId))
      .limit(1);
    return row ? (row.data as ProductAccess) : undefined;
  },

  async getSettings(): Promise<SiteSettings> {
    const defaults = getDefaultData().settings;
    const [row] = await sqlDb.select().from(schema.settings).where(eq(schema.settings.id, 1)).limit(1);
    return row ? { ...defaults, ...(row.data as SiteSettings) } : defaults;
  },

  async saveSettings(data: SiteSettings): Promise<void> {
    await sqlDb
      .insert(schema.settings)
      .values({ id: 1, data })
      .onConflictDoUpdate({ target: schema.settings.id, set: { data } });
  },
};

let seeded: Promise<void> | null = null;

// Seeds the default settings, categories and administrator the first time the store runs.
export function ensureSeeded(): Promise<void> {
  if (!seeded) {
    seeded = (async () => {
      const defaults = getDefaultData();
      const inserted = await sqlDb
        .insert(schema.settings)
        .values({ id: 1, data: defaults.settings })
        .onConflictDoNothing()
        .returning({ id: schema.settings.id });

      if (inserted.length > 0) {
        for (const category of defaults.categories) {
          await repo.categories.put(category);
        }
      }

      const [anyAdmin] = await sqlDb.select({ id: schema.adminUsers.id }).from(schema.adminUsers).limit(1);
      if (!anyAdmin) {
        await repo.adminUsers.put(getDefaultAdmin());
      }
    })().catch((err) => {
      seeded = null;
      throw err;
    });
  }
  return seeded;
}

// Private and public uploads live in a single blob store, separated by key prefix.
export type FileArea = 'images' | 'products' | 'screenshots';

function filesStore() {
  return getStore({ name: 'digivault-files', consistency: 'strong' });
}

export async function saveFile(area: FileArea, name: string, data: ArrayBuffer, contentType: string) {
  await filesStore().set(`${area}/${name}`, data, { metadata: { contentType } });
}

export async function readFile(area: FileArea, name: string) {
  return filesStore().getWithMetadata(`${area}/${name}`, { type: 'arrayBuffer' });
}
