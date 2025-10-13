import { pgTable, text, serial, timestamp, varchar, jsonb, index, decimal, date, boolean, unique, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table for Replit Auth
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table for Replit Auth
export const users = pgTable("users", {
  id: varchar("id").primaryKey().notNull(),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  avatarUrl: varchar("avatar_url"),
  hasCompletedOnboarding: varchar("has_completed_onboarding").default("false"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Chat conversations
export const chatConversations = pgTable("chat_conversations", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  title: varchar("title").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Chat messages
export const chatMessages = pgTable("chat_messages", {
  id: serial("id").primaryKey(),
  conversationId: serial("conversation_id").notNull().references(() => chatConversations.id),
  role: varchar("role").notNull(), // 'user' or 'assistant'
  content: text("content").notNull(),
  csvData: jsonb("csv_data"), // Store analyzed CSV data
  chartConfig: jsonb("chart_config"), // Store chart configuration
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// CSV uploads table
export const csvUploads = pgTable("csv_uploads", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  fileName: varchar("file_name").notNull(),
  filePath: varchar("file_path").notNull(),
  analyzedData: jsonb("analyzed_data"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Plaid accounts table
export const plaidAccounts = pgTable("plaid_accounts", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  accessToken: varchar("access_token").notNull(),
  itemId: varchar("item_id").notNull(),
  institutionId: varchar("institution_id").notNull(),
  institutionName: varchar("institution_name").notNull(),
  accountId: varchar("account_id").notNull(),
  accountName: varchar("account_name").notNull(),
  accountType: varchar("account_type").notNull(),
  accountSubtype: varchar("account_subtype"),
  mask: varchar("mask"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  // Unique constraint for user-account combination
  userAccountUnique: unique().on(table.userId, table.accountId),
}));

// Plaid transactions table
export const plaidTransactions = pgTable("plaid_transactions", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  plaidAccountId: serial("plaid_account_id").notNull().references(() => plaidAccounts.id),
  accountId: varchar("account_id").notNull(), // Plaid's account ID (not a FK)
  transactionId: varchar("transaction_id").unique().notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  description: varchar("description").notNull(),
  merchantName: varchar("merchant_name"),
  category: varchar("category"),
  subcategory: varchar("subcategory"),
  aiCategory: varchar("ai_category"), // Our AI-generated category
  aiType: varchar("ai_type"), // Mandatory/Discretionary/Income
  date: date("date").notNull(),
  accountName: varchar("account_name"),
  pending: boolean("pending").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const betaSignups = pgTable("beta_signups", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Demo emails table for marketing purposes
export const demoEmails = pgTable("demo_emails", {
  id: serial("id").primaryKey(),
  email: varchar("email").notNull().unique(),
  role: varchar("role").default("USER"), // USER, EMP (Employee), ADMIN
  firstUsed: timestamp("first_used").defaultNow().notNull(),
  lastUsed: timestamp("last_used").defaultNow().notNull(),
  totalSessions: integer("total_sessions").notNull().default(1),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Simple demo chat messages table (email-based, no conversations)
export const demoChatMessages = pgTable("demo_chat_messages", {
  id: serial("id").primaryKey(),
  userEmail: varchar("user_email").notNull(),
  role: varchar("role").notNull(), // 'user' or 'assistant'
  content: text("content").notNull(),
  csvData: jsonb("csv_data"), // Store analyzed CSV data
  chartConfig: jsonb("chart_config"), // Store chart configuration
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Demo transactions table (email-based users)
export const demoTransactions = pgTable("demo_transactions", {
  id: serial("id").primaryKey(),
  userEmail: varchar("user_email").notNull(),
  accountId: varchar("account_id").notNull(),
  transactionId: varchar("transaction_id").notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  description: varchar("description").notNull(),
  merchantName: varchar("merchant_name"),
  category: varchar("category"),
  subcategory: varchar("subcategory"),
  aiCategory: varchar("ai_category"), // Our AI-generated category
  aiType: varchar("ai_type"), // Mandatory/Discretionary/Income
  date: date("date").notNull(),
  accountName: varchar("account_name"),
  institutionName: varchar("institution_name"),
  pending: boolean("pending").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Demo Plaid accounts table (email-based users)
export const demoPlaidAccounts = pgTable("demo_plaid_accounts", {
  id: serial("id").primaryKey(),
  userEmail: varchar("user_email").notNull(),
  accessToken: varchar("access_token").notNull(),
  itemId: varchar("item_id").notNull(),
  institutionId: varchar("institution_id").notNull(),
  institutionName: varchar("institution_name").notNull(),
  accountId: varchar("account_id").notNull(),
  accountName: varchar("account_name").notNull(),
  accountType: varchar("account_type").notNull(),
  accountSubtype: varchar("account_subtype"),
  mask: varchar("mask"),
  currentBalance: decimal("current_balance", { precision: 10, scale: 2 }),
  availableBalance: decimal("available_balance", { precision: 10, scale: 2 }),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertBetaSignupSchema = createInsertSchema(betaSignups).pick({
  email: true,
});
export const insertDemoChatMessageSchema = createInsertSchema(demoChatMessages).omit({
  id: true,
  createdAt: true,
});
export const insertDemoTransactionSchema = createInsertSchema(demoTransactions).omit({
  id: true,
  createdAt: true,
});
export const insertDemoPlaidAccountSchema = createInsertSchema(demoPlaidAccounts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export const insertDemoEmailSchema = createInsertSchema(demoEmails).omit({
  id: true,
  createdAt: true,
  firstUsed: true,
});
export const insertPlaidAccountSchema = createInsertSchema(plaidAccounts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export const insertPlaidTransactionSchema = createInsertSchema(plaidTransactions).omit({
  id: true,
  createdAt: true,
});

export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
export type InsertBetaSignup = z.infer<typeof insertBetaSignupSchema>;
export type BetaSignup = typeof betaSignups.$inferSelect;
export type ChatConversation = typeof chatConversations.$inferSelect;
export type InsertChatConversation = typeof chatConversations.$inferInsert;
export type ChatMessage = typeof chatMessages.$inferSelect;
export type InsertChatMessage = typeof chatMessages.$inferInsert;
export type CsvUpload = typeof csvUploads.$inferSelect;
export type InsertCsvUpload = typeof csvUploads.$inferInsert;
export type PlaidAccount = typeof plaidAccounts.$inferSelect;
export type InsertPlaidAccount = z.infer<typeof insertPlaidAccountSchema>;
export type PlaidTransaction = typeof plaidTransactions.$inferSelect;
export type InsertPlaidTransaction = z.infer<typeof insertPlaidTransactionSchema>;
export type DemoChatMessage = typeof demoChatMessages.$inferSelect;
export type InsertDemoChatMessage = z.infer<typeof insertDemoChatMessageSchema>;
export type DemoTransaction = typeof demoTransactions.$inferSelect;
export type InsertDemoTransaction = z.infer<typeof insertDemoTransactionSchema>;
export type DemoPlaidAccount = typeof demoPlaidAccounts.$inferSelect;
export type InsertDemoPlaidAccount = z.infer<typeof insertDemoPlaidAccountSchema>;
export type DemoEmail = typeof demoEmails.$inferSelect;
export type InsertDemoEmail = z.infer<typeof insertDemoEmailSchema>;
