import { pgTable, serial, varchar, text, timestamp, integer, jsonb } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id : serial('id').primaryKey(),
  uid : varchar('uid', {length : 255}).notNull().unique(),
  email: varchar('email', { length: 255 }).notNull(),
  name: varchar('name', { length: 255 }),
  photoURL: text('photo_url'),
  provider: varchar('provider', { length: 50 }).notNull(), // 'google' or 'password'
  createdAt: timestamp('created_at').defaultNow().notNull(),
  lastLoginAt: timestamp('last_login_at').defaultNow().notNull(),
});

export const mentees = pgTable('mentees', {
  id: serial('id').primaryKey(),
  email: varchar('email', { length: 255 }).notNull(),
  name: varchar('name', { length: 255 }),
  targetRole: varchar('target_role', { length: 120 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const resumes = pgTable('resumes', {
  id: serial('id').primaryKey(),
  menteeId: integer('mentee_id').notNull(),
  fileUrl: text('file_url').notNull(),
  fileType: varchar('file_type', { length: 255 }).notNull(),
  textContent: text('text_content'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const analyses = pgTable('analyses', {
  id: serial('id').primaryKey(),
  resumeId: integer('resume_id').notNull(),
  result: jsonb('result'), // {skills, gaps, suggestions, fit, tracks}
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const subscriptions = pgTable('subscriptions', {
  id: serial('id').primaryKey(),
  userId: varchar('user_id', { length: 255 }).notNull(),
  stripeCustomerId: varchar('stripe_customer_id', { length: 255 }),
  stripeSubscriptionId: varchar('stripe_subscription_id', { length: 255 }),
  status: varchar('status', { length: 50 }).notNull(), // 'free', 'premium', 'cancelled'
  currentPeriodEnd: timestamp('current_period_end'),
  cancelAtPeriodEnd: varchar('cancel_at_period_end', { length: 10 }).default('false'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const usage = pgTable('usage', {
  id: serial('id').primaryKey(),
  userId: varchar('user_id', { length: 255 }).notNull(),
  month: varchar('month', { length: 7 }).notNull(), // YYYY-MM format
  analysesCount: integer('analyses_count').default(0).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

