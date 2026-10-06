import { pgTable, text, jsonb, timestamp, integer } from 'drizzle-orm/pg-core';

// Each store record is kept as a JSON document keyed by its application id,
// with a few frequently-filtered fields promoted to real columns.

export const products = pgTable('products', {
  id: text().primaryKey(),
  data: jsonb().notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const categories = pgTable('categories', {
  id: text().primaryKey(),
  data: jsonb().notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const orders = pgTable('orders', {
  id: text().primaryKey(),
  customerEmail: text('customer_email').notNull(),
  data: jsonb().notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const productAccess = pgTable('product_access', {
  id: text().primaryKey(),
  orderId: text('order_id').notNull().unique(),
  data: jsonb().notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const adminUsers = pgTable('admin_users', {
  id: text().primaryKey(),
  email: text().notNull().unique(),
  data: jsonb().notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const settings = pgTable('settings', {
  id: integer().primaryKey(),
  data: jsonb().notNull(),
});
