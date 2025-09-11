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
  fileType: varchar('file_type', { length: 40 }).notNull(),
  textContent: text('text_content'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const analyses = pgTable('analyses', {
  id: serial('id').primaryKey(),
  resumeId: integer('resume_id').notNull(),
  result: jsonb('result'), // {skills, gaps, suggestions, fit, tracks}
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

