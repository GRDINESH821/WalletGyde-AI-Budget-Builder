import { storage } from './storage';
import { eq, and, between, sql, desc, asc, gte, lte, inArray } from "drizzle-orm";
import { db } from './db';
import { plaidTransactions, plaidAccounts, demoTransactions, demoPlaidAccounts } from '@shared/schema';

export interface DateRange {
  start: string; // YYYY-MM-DD format
  end: string;   // YYYY-MM-DD format
}

export interface IncomeResult {
  totalIncome: number;
  transactions: Array<{
    date: string;
    amount: number;
    description: string;
    accountName: string;
    category: string;
  }>;
}

export interface ExpenseResult {
  totalExpenses: number;
  categorizedExpenses: Record<string, {
    total: number;
    transactions: Array<{
      date: string;
      amount: number;
      description: string;
      accountName: string;
      type: 'Mandatory' | 'Discretionary';
    }>;
  }>;
}

export interface CashflowResult {
  netCashflow: number;
  totalIncome: number;
  totalExpenses: number;
  monthlyCashflow: Array<{
    month: string;
    income: number;
    expenses: number;
    netCashflow: number;
  }>;
}

export class RagQueryFunctions {

  /**
   * Get income transactions within date range for specific accounts
   * @param userId - User ID or demo user email:uid combination
   * @param dateRange - Start and end date range
   * @param accountIds - Optional array of specific account IDs to filter by
   * @param isDemo - Whether this is a demo user query
   */
  async getIncome(
    userId: string, 
    dateRange: DateRange, 
    accountIds?: string[],
    isDemo: boolean = false
  ): Promise<IncomeResult> {
    try {
      let transactions;
      
      if (isDemo) {
        // Query demo transactions
        let query = db
          .select({
            date: demoTransactions.date,
            amount: demoTransactions.amount,
            description: demoTransactions.description,
            accountName: demoTransactions.accountName,
            category: demoTransactions.aiCategory,
          })
          .from(demoTransactions)
          .where(
            and(
              eq(demoTransactions.userEmail, userId),
              eq(demoTransactions.aiType, 'Income'),
              gte(demoTransactions.date, dateRange.start),
              lte(demoTransactions.date, dateRange.end)
            )
          );

        if (accountIds && accountIds.length > 0) {
          query = db
            .select({
              date: demoTransactions.date,
              amount: demoTransactions.amount,
              description: demoTransactions.description,
              accountName: demoTransactions.accountName,
              category: demoTransactions.aiCategory,
            })
            .from(demoTransactions)
            .where(
              and(
                eq(demoTransactions.userEmail, userId),
                eq(demoTransactions.aiType, 'Income'),
                gte(demoTransactions.date, dateRange.start),
                lte(demoTransactions.date, dateRange.end),
                inArray(demoTransactions.accountId, accountIds)
              )
            );
        }

        transactions = await query.orderBy(desc(demoTransactions.date));
      } else {
        // Query regular user transactions
        let query = db
          .select({
            date: plaidTransactions.date,
            amount: plaidTransactions.amount,
            description: plaidTransactions.description,
            accountName: plaidTransactions.accountName,
            category: plaidTransactions.aiCategory,
          })
          .from(plaidTransactions)
          .where(
            and(
              eq(plaidTransactions.userId, userId),
              eq(plaidTransactions.aiType, 'Income'),
              gte(plaidTransactions.date, dateRange.start),
              lte(plaidTransactions.date, dateRange.end)
            )
          );

        if (accountIds && accountIds.length > 0) {
          query = db
            .select({
              date: plaidTransactions.date,
              amount: plaidTransactions.amount,
              description: plaidTransactions.description,
              accountName: plaidTransactions.accountName,
              category: plaidTransactions.aiCategory,
            })
            .from(plaidTransactions)
            .where(
              and(
                eq(plaidTransactions.userId, userId),
                eq(plaidTransactions.aiType, 'Income'),
                gte(plaidTransactions.date, dateRange.start),
                lte(plaidTransactions.date, dateRange.end),
                inArray(plaidTransactions.accountId, accountIds)
              )
            );
        }

        transactions = await query.orderBy(desc(plaidTransactions.date));
      }

      const totalIncome = transactions.reduce((sum, tx) => sum + parseFloat(tx.amount), 0);

      return {
        totalIncome,
        transactions: transactions.map(tx => ({
          date: tx.date,
          amount: parseFloat(tx.amount),
          description: tx.description,
          accountName: tx.accountName || 'Unknown Account',
          category: tx.category || 'Income'
        }))
      };
    } catch (error) {
      console.error('Error getting income:', error);
      throw new Error('Failed to retrieve income data');
    }
  }

  /**
   * Get expense transactions within date range, optionally filtered by categories
   * @param userId - User ID or demo user email:uid combination
   * @param dateRange - Start and end date range
   * @param categories - Optional array of categories to filter by
   * @param isDemo - Whether this is a demo user query
   */
  async getExpenses(
    userId: string,
    dateRange: DateRange,
    categories?: string[],
    isDemo: boolean = false
  ): Promise<ExpenseResult> {
    try {
      let transactions;

      if (isDemo) {
        // Query demo transactions
        let query = db
          .select({
            date: demoTransactions.date,
            amount: demoTransactions.amount,
            description: demoTransactions.description,
            accountName: demoTransactions.accountName,
            category: demoTransactions.aiCategory,
            type: demoTransactions.aiType,
          })
          .from(demoTransactions)
          .where(
            and(
              eq(demoTransactions.userEmail, userId),
              inArray(demoTransactions.aiType, ['Mandatory', 'Discretionary']),
              gte(demoTransactions.date, dateRange.start),
              lte(demoTransactions.date, dateRange.end)
            )
          );

        if (categories && categories.length > 0) {
          query = db
            .select({
              date: demoTransactions.date,
              amount: demoTransactions.amount,
              description: demoTransactions.description,
              accountName: demoTransactions.accountName,
              category: demoTransactions.aiCategory,
              type: demoTransactions.aiType,
            })
            .from(demoTransactions)
            .where(
              and(
                eq(demoTransactions.userEmail, userId),
                inArray(demoTransactions.aiType, ['Mandatory', 'Discretionary']),
                gte(demoTransactions.date, dateRange.start),
                lte(demoTransactions.date, dateRange.end),
                inArray(demoTransactions.aiCategory, categories)
              )
            );
        }

        transactions = await query.orderBy(desc(demoTransactions.date));
      } else {
        // Query regular user transactions
        let query = db
          .select({
            date: plaidTransactions.date,
            amount: plaidTransactions.amount,
            description: plaidTransactions.description,
            accountName: plaidTransactions.accountName,
            category: plaidTransactions.aiCategory,
            type: plaidTransactions.aiType,
          })
          .from(plaidTransactions)
          .where(
            and(
              eq(plaidTransactions.userId, userId),
              inArray(plaidTransactions.aiType, ['Mandatory', 'Discretionary']),
              gte(plaidTransactions.date, dateRange.start),
              lte(plaidTransactions.date, dateRange.end)
            )
          );

        if (categories && categories.length > 0) {
          query = db
            .select({
              date: plaidTransactions.date,
              amount: plaidTransactions.amount,
              description: plaidTransactions.description,
              accountName: plaidTransactions.accountName,
              category: plaidTransactions.aiCategory,
              type: plaidTransactions.aiType,
            })
            .from(plaidTransactions)
            .where(
              and(
                eq(plaidTransactions.userId, userId),
                inArray(plaidTransactions.aiType, ['Mandatory', 'Discretionary']),
                gte(plaidTransactions.date, dateRange.start),
                lte(plaidTransactions.date, dateRange.end),
                inArray(plaidTransactions.aiCategory, categories)
              )
            );
        }

        transactions = await query.orderBy(desc(plaidTransactions.date));
      }

      // Group expenses by category
      const categorizedExpenses: Record<string, any> = {};
      let totalExpenses = 0;

      for (const tx of transactions) {
        const amount = Math.abs(parseFloat(tx.amount)); // Ensure positive for expenses
        const category = tx.category || 'Uncategorized';
        
        totalExpenses += amount;

        if (!categorizedExpenses[category]) {
          categorizedExpenses[category] = {
            total: 0,
            transactions: []
          };
        }

        categorizedExpenses[category].total += amount;
        categorizedExpenses[category].transactions.push({
          date: tx.date,
          amount: amount,
          description: tx.description,
          accountName: tx.accountName || 'Unknown Account',
          type: tx.type as 'Mandatory' | 'Discretionary'
        });
      }

      return {
        totalExpenses,
        categorizedExpenses
      };
    } catch (error) {
      console.error('Error getting expenses:', error);
      throw new Error('Failed to retrieve expense data');
    }
  }

  /**
   * Get cashflow analysis over time periods
   * @param userId - User ID or demo user email:uid combination
   * @param dateRange - Start and end date range
   * @param periodType - 'monthly' or 'weekly' aggregation (default: monthly)
   * @param isDemo - Whether this is a demo user query
   */
  async getCashflow(
    userId: string,
    dateRange: DateRange,
    periodType: 'monthly' | 'weekly' = 'monthly',
    isDemo: boolean = false
  ): Promise<CashflowResult> {
    try {
      // Get all transactions in date range
      let transactions;

      if (isDemo) {
        transactions = await db
          .select({
            date: demoTransactions.date,
            amount: demoTransactions.amount,
            type: demoTransactions.aiType,
          })
          .from(demoTransactions)
          .where(
            and(
              eq(demoTransactions.userEmail, userId),
              gte(demoTransactions.date, dateRange.start),
              lte(demoTransactions.date, dateRange.end)
            )
          )
          .orderBy(asc(demoTransactions.date));
      } else {
        transactions = await db
          .select({
            date: plaidTransactions.date,
            amount: plaidTransactions.amount,
            type: plaidTransactions.aiType,
          })
          .from(plaidTransactions)
          .where(
            and(
              eq(plaidTransactions.userId, userId),
              gte(plaidTransactions.date, dateRange.start),
              lte(plaidTransactions.date, dateRange.end)
            )
          )
          .orderBy(asc(plaidTransactions.date));
      }

      // Calculate totals
      let totalIncome = 0;
      let totalExpenses = 0;

      for (const tx of transactions) {
        const amount = parseFloat(tx.amount);
        if (tx.type === 'Income') {
          totalIncome += amount;
        } else if (tx.type === 'Mandatory' || tx.type === 'Discretionary') {
          totalExpenses += Math.abs(amount);
        }
      }

      const netCashflow = totalIncome - totalExpenses;

      // Group by time period
      const periodMap: Record<string, { income: number; expenses: number }> = {};

      for (const tx of transactions) {
        const date = new Date(tx.date);
        const periodKey = periodType === 'monthly' 
          ? `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
          : `${date.getFullYear()}-W${getWeekNumber(date)}`;

        if (!periodMap[periodKey]) {
          periodMap[periodKey] = { income: 0, expenses: 0 };
        }

        const amount = parseFloat(tx.amount);
        if (tx.type === 'Income') {
          periodMap[periodKey].income += amount;
        } else if (tx.type === 'Mandatory' || tx.type === 'Discretionary') {
          periodMap[periodKey].expenses += Math.abs(amount);
        }
      }

      // Convert to array format
      const monthlyCashflow = Object.entries(periodMap)
        .map(([period, data]) => ({
          month: period,
          income: data.income,
          expenses: data.expenses,
          netCashflow: data.income - data.expenses
        }))
        .sort((a, b) => a.month.localeCompare(b.month));

      return {
        netCashflow,
        totalIncome,
        totalExpenses,
        monthlyCashflow
      };
    } catch (error) {
      console.error('Error getting cashflow:', error);
      throw new Error('Failed to retrieve cashflow data');
    }
  }

  /**
   * Get account summary for user
   * @param userId - User ID or demo user email:uid combination
   * @param isDemo - Whether this is a demo user query
   */
  async getAccountSummary(userId: string, isDemo: boolean = false) {
    try {
      if (isDemo) {
        return await storage.getDemoPlaidAccounts(userId);
      } else {
        return await storage.getUserLinkedAccounts(userId);
      }
    } catch (error) {
      console.error('Error getting account summary:', error);
      throw new Error('Failed to retrieve account summary');
    }
  }

  /**
   * Get spending trends by category over time
   * @param userId - User ID or demo user email:uid combination
   * @param dateRange - Start and end date range
   * @param isDemo - Whether this is a demo user query
   */
  async getSpendingTrends(
    userId: string,
    dateRange: DateRange,
    isDemo: boolean = false
  ) {
    try {
      const expenses = await this.getExpenses(userId, dateRange, undefined, isDemo);
      
      // Sort categories by total spending
      const trendData = Object.entries(expenses.categorizedExpenses)
        .map(([category, data]) => ({
          category,
          total: data.total,
          transactionCount: data.transactions.length,
          avgPerTransaction: data.total / data.transactions.length
        }))
        .sort((a, b) => b.total - a.total);

      return {
        topSpendingCategories: trendData,
        totalExpenses: expenses.totalExpenses,
        categoryCount: trendData.length
      };
    } catch (error) {
      console.error('Error getting spending trends:', error);
      throw new Error('Failed to retrieve spending trends');
    }
  }
}

// Helper function to get week number
function getWeekNumber(date: Date): number {
  const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
  const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
  return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
}

export const ragQueryFunctions = new RagQueryFunctions();