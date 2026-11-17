/**
 * Marlo ERP & SaaS - Drizzle ORM Schema (PostgreSQL & SQLite Compatible)
 * Standardisé sur le modèle relationnel unifié Multi-Tenant d'Odoo
 */

import { pgTable, uuid, varchar, text, boolean, timestamp, jsonb, integer, numeric } from 'drizzle-orm/pg-core';

// 1. Table des Entreprises / Organisations (Tenants)
export const tenants = pgTable('tenants', {
  id: varchar('id', { length: 64 }).primaryKey(), // slug ou UUID
  name: varchar('name', { length: 255 }).notNull(),
  slug: varchar('slug', { length: 128 }).notNull().unique(),
  industry: varchar('industry', { length: 100 }).default('design_agency'),
  currency: varchar('currency', { length: 10 }).default('EUR'),
  locale: varchar('locale', { length: 10 }).default('fr-FR'),
  plan: varchar('plan', { length: 50 }).default('pro'), // free | starter | pro | enterprise
  settings: jsonb('settings').default({}),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
});

// 2. Catalogue Global des Modules / Plugins ERP (Odoo Apps)
export const modules = pgTable('modules', {
  id: varchar('id', { length: 64 }).primaryKey(), // ex: 'overview', 'tasks', 'projects', 'calendar', 'team', 'budget', 'crm', 'accounting'
  name: varchar('name', { length: 128 }).notNull(),
  category: varchar('category', { length: 64 }).notNull(), // 'sales' | 'operations' | 'finance' | 'hr' | 'communication'
  description: text('description').notNull(),
  icon: varchar('icon', { length: 64 }).notNull(),
  isCore: boolean('is_core').default(false).notNull(), // Si obligatoire (ex: overview)
  dependencies: jsonb('dependencies').default([]), // Modules pré-requis
  defaultEnabled: boolean('default_enabled').default(true).notNull()
});

// 3. Modules Activés par Entreprise (Multi-Tenant App Store)
export const tenantModules = pgTable('tenant_modules', {
  id: varchar('id', { length: 128 }).primaryKey(),
  tenantId: varchar('tenant_id', { length: 64 }).notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  moduleId: varchar('module_id', { length: 64 }).notNull().references(() => modules.id),
  isActive: boolean('is_active').default(true).notNull(),
  config: jsonb('config').default({}),
  activatedAt: timestamp('activated_at').defaultNow().notNull()
});

// 4. Utilisateurs et Collaborateurs
export const users = pgTable('users', {
  id: varchar('id', { length: 64 }).primaryKey(),
  tenantId: varchar('tenant_id', { length: 64 }).notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }).notNull(),
  role: varchar('role', { length: 50 }).default('admin'), // 'owner' | 'admin' | 'manager' | 'member' | 'client'
  avatarUrl: text('avatar_url'),
  createdAt: timestamp('created_at').defaultNow().notNull()
});

// 5. Tiers / Contacts Unifiés (Modèle res.partner d'Odoo)
export const partners = pgTable('partners', {
  id: varchar('id', { length: 64 }).primaryKey(),
  tenantId: varchar('tenant_id', { length: 64 }).notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 255 }).notNull(),
  type: varchar('type', { length: 50 }).default('client'), // 'client' | 'supplier' | 'lead' | 'contact'
  email: varchar('email', { length: 255 }),
  phone: varchar('phone', { length: 50 }),
  company: varchar('company', { length: 255 }),
  vatNumber: varchar('vat_number', { length: 50 }),
  createdAt: timestamp('created_at').defaultNow().notNull()
});
