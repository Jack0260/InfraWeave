import { pgTable, text, serial, timestamp, boolean, jsonb } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Users table authenticated via Firebase Auth
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(), // Firebase Auth UID
  email: text('email').notNull(),
  displayName: text('display_name'),
  photoUrl: text('photo_url'),
  createdAt: timestamp('created_at').defaultNow(),
});

// Saved infrastructure architectures
export const architectures = pgTable('architectures', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.uid, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  description: text('description'),
  isPreset: boolean('is_preset').default(false),
  data: jsonb('data').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Simulation benchmarks / saved runs
export const simulationRuns = pgTable('simulation_runs', {
  id: text('id').primaryKey(),
  architectureId: text('architecture_id').references(() => architectures.id, { onDelete: 'cascade' }),
  userId: text('user_id').notNull().references(() => users.uid, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  monthlyCost: text('monthly_cost'),
  p95Latency: text('p95_latency'),
  availability: text('availability'),
  headroom: text('headroom'),
  metricsSnapshot: jsonb('metrics_snapshot').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

// Architecture Decision Records (ADRs)
export const decisionRecords = pgTable('decision_records', {
  id: text('id').primaryKey(),
  architectureId: text('architecture_id').references(() => architectures.id, { onDelete: 'cascade' }),
  userId: text('user_id').notNull().references(() => users.uid, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  status: text('status').notNull(),
  context: text('context').notNull(),
  decision: text('decision').notNull(),
  consequences: jsonb('consequences').notNull(),
  metricsEvidence: jsonb('metrics_evidence').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

// Audit trail for change logs
export const auditLogs = pgTable('audit_logs', {
  id: text('id').primaryKey(),
  architectureId: text('architecture_id').references(() => architectures.id, { onDelete: 'cascade' }),
  userId: text('user_id').notNull().references(() => users.uid, { onDelete: 'cascade' }),
  action: text('action').notNull(),
  summary: text('summary').notNull(),
  deltaCost: text('delta_cost'),
  deltaLatency: text('delta_latency'),
  deltaAvailability: text('delta_availability'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const usersRelations = relations(users, ({ many }) => ({
  architectures: many(architectures),
  simulationRuns: many(simulationRuns),
  decisionRecords: many(decisionRecords),
  auditLogs: many(auditLogs),
}));

export const architecturesRelations = relations(architectures, ({ one, many }) => ({
  author: one(users, {
    fields: [architectures.userId],
    references: [users.uid],
  }),
  runs: many(simulationRuns),
  decisions: many(decisionRecords),
  audits: many(auditLogs),
}));
