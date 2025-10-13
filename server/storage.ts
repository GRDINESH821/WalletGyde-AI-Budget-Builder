import {
  users,
  betaSignups,
  demoEmails,
  chatConversations,
  chatMessages,
  demoChatMessages,
  demoTransactions,
  demoPlaidAccounts,
  csvUploads,
  plaidAccounts,
  plaidTransactions,
  type User,
  type UpsertUser,
  type BetaSignup,
  type InsertBetaSignup,
  type DemoEmail,
  type InsertDemoEmail,
  type ChatConversation,
  type InsertChatConversation,
  type ChatMessage,
  type InsertChatMessage,
  type DemoChatMessage,
  type InsertDemoChatMessage,
  type DemoTransaction,
  type InsertDemoTransaction,
  type DemoPlaidAccount,
  type InsertDemoPlaidAccount,
  type CsvUpload,
  type InsertCsvUpload,
  type PlaidAccount,
  type InsertPlaidAccount,
  type PlaidTransaction,
  type InsertPlaidTransaction,
} from "@shared/schema";
import { db } from "./db";
import { eq, count, desc, and, sql } from "drizzle-orm";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  updateUserAvatar(userId: string, avatarUrl: string): Promise<User>;
  completeUserOnboarding(userId: string, avatarUrl: string): Promise<User>;
  getBetaSignup(email: string): Promise<BetaSignup | undefined>;
  createBetaSignup(signup: InsertBetaSignup): Promise<BetaSignup>;
  getBetaSignupCount(): Promise<number>;
  // Chat methods
  getUserConversations(userId: string): Promise<ChatConversation[]>;
  createConversation(conversation: InsertChatConversation): Promise<ChatConversation>;
  deleteConversation(conversationId: number, userId: string): Promise<void>;
  getConversationMessages(conversationId: number): Promise<ChatMessage[]>;
  addMessage(message: InsertChatMessage): Promise<ChatMessage>;
  // CSV methods
  saveCsvUpload(upload: InsertCsvUpload): Promise<CsvUpload>;
  getUserCsvUploads(userId: string): Promise<CsvUpload[]>;
  // Plaid methods
  saveLinkedAccount(account: InsertPlaidAccount): Promise<PlaidAccount>;
  getUserLinkedAccounts(userId: string): Promise<PlaidAccount[]>;
  getLinkedAccount(userId: string, accountId: string): Promise<PlaidAccount | undefined>;
  deactivateLinkedAccount(userId: string, accountId: string): Promise<void>;
  saveTransactions(transactions: InsertPlaidTransaction[]): Promise<PlaidTransaction[]>;
  getUserTransactions(userId: string, limit?: number): Promise<PlaidTransaction[]>;
  getAccountTransactions(userId: string, accountId: string, limit?: number): Promise<PlaidTransaction[]>;
  // Demo chat methods
  clearDemoUserData(userEmail: string): Promise<void>;
  getDemoMessages(userEmail: string): Promise<DemoChatMessage[]>;
  addDemoMessage(message: InsertDemoChatMessage): Promise<DemoChatMessage>;
  getDemoUserQuestionCount(userEmail: string): Promise<number>;
  incrementDemoUserQuestionCount(userEmail: string): Promise<void>;
  // Role management methods
  getUserRole(userEmail: string): Promise<string>;
  setUserRole(userEmail: string, role: string): Promise<void>;
  // Demo CSV methods
  saveDemoCsvUpload(userEmail: string, fileName: string, filePath: string, analyzedData: any): Promise<CsvUpload>;
  getDemoUserCsvUploads(userEmail: string): Promise<CsvUpload[]>;
  // Demo Plaid methods
  saveDemoLinkedAccount(userEmail: string, account: Omit<InsertPlaidAccount, 'userId'>): Promise<PlaidAccount>;
  getDemoUserLinkedAccounts(userEmail: string): Promise<PlaidAccount[]>;
  saveDemoTransactions(userEmail: string, transactions: Omit<InsertPlaidTransaction, 'userId'>[]): Promise<PlaidTransaction[]>;
  getDemoUserTransactions(userEmail: string, limit?: number): Promise<PlaidTransaction[]>;
  // Enhanced demo methods with proper demo tables
  saveDemoPlaidAccount(userEmail: string, account: Omit<InsertDemoPlaidAccount, 'userEmail'>): Promise<DemoPlaidAccount>;
  getDemoPlaidAccounts(userEmail: string): Promise<DemoPlaidAccount[]>;
  saveDemoTransactionsEnhanced(userEmail: string, transactions: Omit<InsertDemoTransaction, 'userEmail'>[]): Promise<DemoTransaction[]>;
  getDemoTransactions(userEmail: string, limit?: number): Promise<DemoTransaction[]>;
  clearDemoData(userEmail: string): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async updateUserAvatar(userId: string, avatarUrl: string): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ avatarUrl, updatedAt: new Date() })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  async completeUserOnboarding(userId: string, avatarUrl: string): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ 
        avatarUrl, 
        hasCompletedOnboarding: "true", 
        updatedAt: new Date() 
      })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  async getBetaSignup(email: string): Promise<BetaSignup | undefined> {
    const [signup] = await db.select().from(betaSignups).where(eq(betaSignups.email, email));
    return signup;
  }

  async createBetaSignup(insertBetaSignup: InsertBetaSignup): Promise<BetaSignup> {
    const [betaSignup] = await db
      .insert(betaSignups)
      .values(insertBetaSignup)
      .returning();
    return betaSignup;
  }

  async getBetaSignupCount(): Promise<number> {
    const [result] = await db.select({ count: count() }).from(betaSignups);
    return result.count;
  }

  // Chat methods
  async getUserConversations(userId: string): Promise<ChatConversation[]> {
    return await db
      .select()
      .from(chatConversations)
      .where(eq(chatConversations.userId, userId))
      .orderBy(desc(chatConversations.updatedAt));
  }

  async createConversation(conversation: InsertChatConversation): Promise<ChatConversation> {
    const [conv] = await db
      .insert(chatConversations)
      .values(conversation)
      .returning();
    return conv;
  }

  async deleteConversation(conversationId: number, userId: string): Promise<void> {
    // Delete messages first
    await db.delete(chatMessages).where(eq(chatMessages.conversationId, conversationId));
    // Delete conversation
    await db
      .delete(chatConversations)
      .where(and(eq(chatConversations.id, conversationId), eq(chatConversations.userId, userId)));
  }

  async getConversationMessages(conversationId: number): Promise<ChatMessage[]> {
    return await db
      .select()
      .from(chatMessages)
      .where(eq(chatMessages.conversationId, conversationId))
      .orderBy(chatMessages.createdAt);
  }

  async addMessage(message: InsertChatMessage): Promise<ChatMessage> {
    const [msg] = await db
      .insert(chatMessages)
      .values(message)
      .returning();
    return msg;
  }

  async saveCsvUpload(upload: InsertCsvUpload): Promise<CsvUpload> {
    const [csvUpload] = await db
      .insert(csvUploads)
      .values(upload)
      .returning();
    return csvUpload;
  }

  async getUserCsvUploads(userId: string): Promise<CsvUpload[]> {
    return await db
      .select()
      .from(csvUploads)
      .where(eq(csvUploads.userId, userId))
      .orderBy(desc(csvUploads.createdAt));
  }

  // Plaid methods implementation
  async saveLinkedAccount(account: InsertPlaidAccount): Promise<PlaidAccount> {
    try {
      // Try to insert first
      const [plaidAccount] = await db
        .insert(plaidAccounts)
        .values(account)
        .returning();
      return plaidAccount;
    } catch (error: any) {
      // If constraint violation (duplicate), update existing record
      if (error.code === '23505') { // Unique constraint violation
        const [updatedAccount] = await db
          .update(plaidAccounts)
          .set({
            ...account,
            updatedAt: new Date(),
          })
          .where(and(
            eq(plaidAccounts.userId, account.userId),
            eq(plaidAccounts.accountId, account.accountId)
          ))
          .returning();
        return updatedAccount;
      }
      throw error;
    }
  }

  async getUserLinkedAccounts(userId: string): Promise<PlaidAccount[]> {
    return await db
      .select()
      .from(plaidAccounts)
      .where(and(eq(plaidAccounts.userId, userId), eq(plaidAccounts.isActive, true)))
      .orderBy(desc(plaidAccounts.createdAt));
  }

  async getLinkedAccount(userId: string, accountId: string): Promise<PlaidAccount | undefined> {
    const [account] = await db
      .select()
      .from(plaidAccounts)
      .where(and(
        eq(plaidAccounts.userId, userId),
        eq(plaidAccounts.accountId, accountId),
        eq(plaidAccounts.isActive, true)
      ));
    return account;
  }

  async deactivateLinkedAccount(userId: string, accountId: string): Promise<void> {
    await db
      .update(plaidAccounts)
      .set({ isActive: false, updatedAt: new Date() })
      .where(and(
        eq(plaidAccounts.userId, userId),
        eq(plaidAccounts.accountId, accountId)
      ));
  }

  async saveTransactions(transactions: InsertPlaidTransaction[]): Promise<PlaidTransaction[]> {
    if (transactions.length === 0) return [];
    
    const savedTransactions = await db
      .insert(plaidTransactions)
      .values(transactions)
      .onConflictDoNothing()
      .returning();
    return savedTransactions;
  }

  async getUserTransactions(userId: string, limit: number = 100): Promise<PlaidTransaction[]> {
    return await db
      .select()
      .from(plaidTransactions)
      .where(eq(plaidTransactions.userId, userId))
      .orderBy(desc(plaidTransactions.date))
      .limit(limit);
  }

  async getAccountTransactions(userId: string, accountId: string, limit: number = 100): Promise<PlaidTransaction[]> {
    return await db
      .select()
      .from(plaidTransactions)
      .where(and(
        eq(plaidTransactions.userId, userId),
        eq(plaidTransactions.accountId, accountId)
      ))
      .orderBy(desc(plaidTransactions.date))
      .limit(limit);
  }

  // Demo chat methods implementation
  async clearDemoUserData(userEmail: string): Promise<void> {
    // Clear chat messages
    await db.delete(demoChatMessages).where(eq(demoChatMessages.userEmail, userEmail));
    // Clear CSV uploads (using email as userId for demo)
    await db.delete(csvUploads).where(eq(csvUploads.userId, userEmail));
    // Clear Plaid accounts and transactions (using email as userId for demo)
    await db.delete(plaidTransactions).where(eq(plaidTransactions.userId, userEmail));
    await db.delete(plaidAccounts).where(eq(plaidAccounts.userId, userEmail));
  }

  async getDemoMessages(userEmail: string): Promise<DemoChatMessage[]> {
    return await db
      .select()
      .from(demoChatMessages)
      .where(eq(demoChatMessages.userEmail, userEmail))
      .orderBy(demoChatMessages.createdAt);
  }

  async addDemoMessage(message: InsertDemoChatMessage): Promise<DemoChatMessage> {
    const [msg] = await db
      .insert(demoChatMessages)
      .values(message)
      .returning();
    return msg;
  }

  async getDemoUserQuestionCount(userEmail: string): Promise<number> {
    // Check if user has EMP role - if so, return unlimited (0 means no limit)
    const userRole = await this.getUserRole(userEmail);
    if (userRole === 'EMP') {
      return 0; // 0 means unlimited messages
    }
    
    const result = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(demoChatMessages)
      .where(and(
        eq(demoChatMessages.userEmail, userEmail),
        eq(demoChatMessages.role, 'user')
      ));
    return result[0]?.count || 0;
  }

  async incrementDemoUserQuestionCount(userEmail: string): Promise<void> {
    // This method is not needed since we count actual user messages from demoChatMessages
    // But keeping interface consistent
    return;
  }

  // Demo Plaid account methods
  async saveDemoPlaidAccount(userEmail: string, account: Omit<InsertDemoPlaidAccount, 'userEmail'>): Promise<DemoPlaidAccount> {
    try {
      const [plaidAccount] = await db
        .insert(demoPlaidAccounts)
        .values({
          ...account,
          userEmail,
        })
        .returning();
      return plaidAccount;
    } catch (error: any) {
      if (error.code === '23505') { // Unique constraint violation
        const [updatedAccount] = await db
          .update(demoPlaidAccounts)
          .set({
            ...account,
            userEmail,
            updatedAt: new Date(),
          })
          .where(and(
            eq(demoPlaidAccounts.userEmail, userEmail),
            eq(demoPlaidAccounts.accountId, account.accountId)
          ))
          .returning();
        return updatedAccount;
      }
      throw error;
    }
  }

  async getDemoPlaidAccounts(userEmail: string): Promise<DemoPlaidAccount[]> {
    return await db
      .select()
      .from(demoPlaidAccounts)
      .where(and(eq(demoPlaidAccounts.userEmail, userEmail), eq(demoPlaidAccounts.isActive, true)))
      .orderBy(desc(demoPlaidAccounts.createdAt));
  }

  // Demo transaction methods
  async saveDemoTransactions(userEmail: string, transactions: Omit<InsertDemoTransaction, 'userEmail'>[]): Promise<DemoTransaction[]> {
    if (transactions.length === 0) return [];
    
    const transactionsWithEmail = transactions.map(tx => ({
      ...tx,
      userEmail,
    }));
    
    try {
      return await db
        .insert(demoTransactions)
        .values(transactionsWithEmail)
        .returning();
    } catch (error: any) {
      console.log('Some transactions may already exist, continuing...');
      // Return empty array if there are duplicate transactions
      return [];
    }
  }

  async getDemoTransactions(userEmail: string, limit: number = 100): Promise<DemoTransaction[]> {
    return await db
      .select()
      .from(demoTransactions)
      .where(eq(demoTransactions.userEmail, userEmail))
      .orderBy(desc(demoTransactions.date))
      .limit(limit);
  }

  async saveDemoTransactionsEnhanced(userEmail: string, transactions: Omit<InsertDemoTransaction, 'userEmail'>[]): Promise<DemoTransaction[]> {
    return this.saveDemoTransactions(userEmail, transactions);
  }

  async clearDemoData(userEmail: string): Promise<void> {
    // Clear all demo data for a user when they start a new session
    await Promise.all([
      db.delete(demoChatMessages).where(eq(demoChatMessages.userEmail, userEmail)),
      db.delete(demoTransactions).where(eq(demoTransactions.userEmail, userEmail)),
      db.update(demoPlaidAccounts)
        .set({ isActive: false })
        .where(eq(demoPlaidAccounts.userEmail, userEmail))
    ]);
  }

  // Clear demo Plaid accounts specifically (for when user returns to demo)
  async clearDemoPlaidAccounts(userEmail: string): Promise<void> {
    await Promise.all([
      // Deactivate demo Plaid accounts
      db.update(demoPlaidAccounts)
        .set({ isActive: false })
        .where(eq(demoPlaidAccounts.userEmail, userEmail)),
      // Clear demo transactions
      db.delete(demoTransactions).where(eq(demoTransactions.userEmail, userEmail))
    ]);
  }

  // Clear demo Plaid accounts by email only (when same email returns)
  async clearDemoPlaidAccountsByEmail(email: string): Promise<void> {
    await Promise.all([
      // Deactivate demo Plaid accounts for all sessions with this email
      db.update(demoPlaidAccounts)
        .set({ isActive: false })
        .where(sql`${demoPlaidAccounts.userEmail} LIKE ${email + '%'}`),
      // Clear demo transactions for all sessions with this email
      db.delete(demoTransactions).where(sql`${demoTransactions.userEmail} LIKE ${email + '%'}`)
    ]);
  }

  // Demo email tracking methods
  async upsertDemoEmail(email: string): Promise<DemoEmail> {
    try {
      // Try to insert new demo email
      const [demoEmail] = await db
        .insert(demoEmails)
        .values({ email })
        .returning();
      return demoEmail;
    } catch (error: any) {
      if (error.code === '23505') { // Unique constraint violation
        // Update existing demo email with new session
        const [updatedEmail] = await db
          .update(demoEmails)
          .set({ 
            lastUsed: new Date(),
            totalSessions: sql`${demoEmails.totalSessions} + 1`
          })
          .where(eq(demoEmails.email, email))
          .returning();
        return updatedEmail;
      }
      throw error;
    }
  }

  async getDemoEmails(): Promise<DemoEmail[]> {
    return await db
      .select()
      .from(demoEmails)
      .orderBy(desc(demoEmails.lastUsed));
  }

  // Demo CSV methods implementation
  async saveDemoCsvUpload(userEmail: string, fileName: string, filePath: string, analyzedData: any): Promise<CsvUpload> {
    const [csvUpload] = await db
      .insert(csvUploads)
      .values({
        userId: userEmail, // Use email as userId for demo
        fileName,
        filePath,
        analyzedData,
      })
      .returning();
    return csvUpload;
  }

  async getDemoUserCsvUploads(userEmail: string): Promise<CsvUpload[]> {
    return await db
      .select()
      .from(csvUploads)
      .where(eq(csvUploads.userId, userEmail))
      .orderBy(desc(csvUploads.createdAt));
  }

  // Demo Plaid methods implementation
  async saveDemoLinkedAccount(userEmail: string, account: Omit<InsertPlaidAccount, 'userId'>): Promise<PlaidAccount> {
    try {
      const [plaidAccount] = await db
        .insert(plaidAccounts)
        .values({
          ...account,
          userId: userEmail, // Use email as userId for demo
        })
        .returning();
      return plaidAccount;
    } catch (error: any) {
      if (error.code === '23505') { // Unique constraint violation
        const [updatedAccount] = await db
          .update(plaidAccounts)
          .set({
            ...account,
            userId: userEmail,
            updatedAt: new Date(),
          })
          .where(and(
            eq(plaidAccounts.userId, userEmail),
            eq(plaidAccounts.accountId, account.accountId)
          ))
          .returning();
        return updatedAccount;
      }
      throw error;
    }
  }

  async getDemoUserLinkedAccounts(userEmail: string): Promise<PlaidAccount[]> {
    return await db
      .select()
      .from(plaidAccounts)
      .where(and(eq(plaidAccounts.userId, userEmail), eq(plaidAccounts.isActive, true)))
      .orderBy(desc(plaidAccounts.createdAt));
  }

  // This method is deprecated - use saveDemoTransactionsEnhanced instead

  async getDemoUserTransactions(userEmail: string, limit: number = 100): Promise<PlaidTransaction[]> {
    return await db
      .select()
      .from(plaidTransactions)
      .where(eq(plaidTransactions.userId, userEmail))
      .orderBy(desc(plaidTransactions.date))
      .limit(limit);
  }

  // Role management methods
  async getUserRole(userEmail: string): Promise<string> {
    const [demoEmail] = await db
      .select({ role: demoEmails.role })
      .from(demoEmails)
      .where(eq(demoEmails.email, userEmail));
    return demoEmail?.role || 'USER';
  }

  async setUserRole(userEmail: string, role: string): Promise<void> {
    try {
      // Try to update existing demo email
      await db
        .update(demoEmails)
        .set({ role })
        .where(eq(demoEmails.email, userEmail));
    } catch (error) {
      // If demo email doesn't exist, create it with the role
      await db
        .insert(demoEmails)
        .values({ email: userEmail, role });
    }
  }
}

export const storage = new DatabaseStorage();
