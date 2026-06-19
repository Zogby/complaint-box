import { int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Complaints table - stores all submitted complaints
 */
export const complaints = mysqlTable('complaints', {
  id: int('id').autoincrement().primaryKey(),
  complaintNumber: varchar('complaintNumber', { length: 64 }).notNull().unique(),
  fullName: varchar('fullName', { length: 255 }).notNull(),
  phoneNumber: varchar('phoneNumber', { length: 20 }).notNull(),
  complaintSubject: text('complaintSubject').notNull(),
  createdAt: timestamp('createdAt').defaultNow().notNull(),
});

export type Complaint = typeof complaints.$inferSelect;
export type InsertComplaint = typeof complaints.$inferInsert;

/**
 * Settings table - stores Telegram configuration
 */
export const settings = mysqlTable('settings', {
  id: int('id').autoincrement().primaryKey(),
  key: varchar('key', { length: 255 }).notNull().unique(),
  value: text('value').notNull(),
  updatedAt: timestamp('updatedAt').defaultNow().onUpdateNow().notNull(),
});

export type Setting = typeof settings.$inferSelect;
export type InsertSetting = typeof settings.$inferInsert;

/**
 * Statistics table - tracks complaint statistics
 */
export const statistics = mysqlTable('statistics', {
  id: int('id').autoincrement().primaryKey(),
  totalComplaints: int('totalComplaints').default(0).notNull(),
  lastComplaintAt: timestamp('lastComplaintAt'),
  updatedAt: timestamp('updatedAt').defaultNow().onUpdateNow().notNull(),
});

/**
 * Likes table - tracks likes/approvals from citizens and employees
 */
export const likes = mysqlTable('likes', {
  id: int('id').autoincrement().primaryKey(),
  userType: mysqlEnum('userType', ['citizen', 'employee']).notNull(),
  ipAddress: varchar('ipAddress', { length: 45 }).notNull(),
  createdAt: timestamp('createdAt').defaultNow().notNull(),
});

export type Like = typeof likes.$inferSelect;
export type InsertLike = typeof likes.$inferInsert;