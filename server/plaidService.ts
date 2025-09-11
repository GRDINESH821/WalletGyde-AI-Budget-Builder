import { Configuration, PlaidApi, PlaidEnvironments, Products, CountryCode } from 'plaid';
import { storage } from './storage.js';
import { categorizeTransactions } from './openai.js';

// Initialize Plaid client
const configuration = new Configuration({
  basePath: process.env.PLAID_ENV === 'production' ? PlaidEnvironments.production : PlaidEnvironments.sandbox,
  baseOptions: {
    headers: {
      'PLAID-CLIENT-ID': process.env.PLAID_CLIENT_ID,
      'PLAID-SECRET': process.env.PLAID_SECRET,
    },
  },
});

const plaidClient = new PlaidApi(configuration);

export interface LinkTokenConfig {
  userId: string;
  userEmail: string;
}

export interface ExchangeTokenResult {
  accessToken: string;
  itemId: string;
  accounts: any[];
}

export class PlaidService {
  
  /**
   * Create a link token for Plaid Link frontend component
   */
  async createLinkToken(config: LinkTokenConfig): Promise<string> {
    try {
      // Validate environment variables first
      if (!process.env.PLAID_CLIENT_ID || !process.env.PLAID_SECRET) {
        throw new Error('Missing Plaid credentials - PLAID_CLIENT_ID or PLAID_SECRET not found');
      }

      console.log('Creating link token with config:', {
        userId: config.userId,
        userEmail: config.userEmail,
        hasClientId: !!process.env.PLAID_CLIENT_ID,
        hasSecret: !!process.env.PLAID_SECRET,
        environment: process.env.PLAID_ENV
      });

      const request = {
        user: {
          client_user_id: config.userId,
          email_address: config.userEmail,
        },
        client_name: 'Walletgyde AI',
        products: [Products.Transactions],
        country_codes: [CountryCode.Us],
        language: 'en',
        webhook: process.env.PLAID_WEBHOOK_URL,
      };

      const response = await plaidClient.linkTokenCreate(request);
      return response.data.link_token;
    } catch (error: any) {
      console.error('Error creating link token:', error);
      console.error('PLAID_CLIENT_ID exists:', !!process.env.PLAID_CLIENT_ID);
      console.error('PLAID_SECRET exists:', !!process.env.PLAID_SECRET);
      console.error('PLAID_ENV value:', process.env.PLAID_ENV);
      
      // Log the actual error details
      if (error.response?.data) {
        console.error('Plaid API error details:', error.response.data);
      }
      
      throw new Error(`Failed to create link token: ${error.message || 'Unknown error'}`);
    }
  }

  /**
   * Exchange public token for access token and save account info
   */
  async exchangePublicToken(publicToken: string, userId: string): Promise<ExchangeTokenResult> {
    try {
      // Exchange public token for access token
      const exchangeResponse = await plaidClient.itemPublicTokenExchange({
        public_token: publicToken,
      });

      const accessToken = exchangeResponse.data.access_token;
      const itemId = exchangeResponse.data.item_id;

      // Get account information
      const accountsResponse = await plaidClient.accountsGet({
        access_token: accessToken,
      });

      const accounts = accountsResponse.data.accounts;
      
      // Get institution information
      const itemResponse = await plaidClient.itemGet({
        access_token: accessToken,
      });
      
      const institutionResponse = await plaidClient.institutionsGetById({
        institution_id: itemResponse.data.item.institution_id!,
        country_codes: [CountryCode.Us],
      });

      const institution = institutionResponse.data.institution;

      // Save accounts to database
      for (const account of accounts) {
        await storage.saveLinkedAccount({
          userId,
          accessToken,
          itemId,
          institutionId: institution.institution_id,
          institutionName: institution.name,
          accountId: account.account_id,
          accountName: account.name,
          accountType: account.type,
          accountSubtype: account.subtype || null,
          mask: account.mask || null,
        });
      }

      return {
        accessToken,
        itemId,
        accounts,
      };
    } catch (error) {
      console.error('Error exchanging public token:', error);
      throw new Error('Failed to exchange public token');
    }
  }

  /**
   * Exchange public token for demo users (doesn't save to database)
   */
  async exchangePublicTokenDemo(publicToken: string): Promise<ExchangeTokenResult> {
    try {
      // Exchange public token for access token
      const exchangeResponse = await plaidClient.itemPublicTokenExchange({
        public_token: publicToken,
      });

      const accessToken = exchangeResponse.data.access_token;
      const itemId = exchangeResponse.data.item_id;

      // Get account information
      const accountsResponse = await plaidClient.accountsGet({
        access_token: accessToken,
      });

      const accounts = accountsResponse.data.accounts;
      
      // Get institution information
      const itemResponse = await plaidClient.itemGet({
        access_token: accessToken,
      });
      
      const institutionResponse = await plaidClient.institutionsGetById({
        institution_id: itemResponse.data.item.institution_id!,
        country_codes: [CountryCode.Us],
      });

      const institution = institutionResponse.data.institution;

      // Return data without saving to database (demo mode)
      return {
        accessToken,
        itemId,
        accounts: accounts.map(account => ({
          ...account,
          institutionId: institution.institution_id,
          institutionName: institution.name,
        })),
      };
    } catch (error) {
      console.error('Error exchanging demo public token:', error);
      throw new Error('Failed to exchange public token');
    }
  }

  /**
   * Sync transactions for demo users
   */
  async syncDemoTransactions(userEmail: string, accessToken: string): Promise<{ newTransactions: number }> {
    try {
      // Get demo accounts for this user
      const demoAccounts = await storage.getDemoPlaidAccounts(userEmail);
      let totalNewTransactions = 0;

      for (const account of demoAccounts) {
        try {
          // Get transactions from last 90 days
          const startDate = new Date();
          startDate.setDate(startDate.getDate() - 90);
          const endDate = new Date();
          
          console.log(`Fetching demo transactions for account ${account.accountId}`);

          const transactionsResponse = await plaidClient.transactionsGet({
            access_token: accessToken,
            start_date: startDate.toISOString().split('T')[0],
            end_date: endDate.toISOString().split('T')[0],
          });

          const transactions = transactionsResponse.data.transactions;
          console.log(`Retrieved ${transactions.length} demo transactions`);

          if (transactions.length > 0) {
            // Convert Plaid transactions to our demo format
            const transactionData = transactions.map(tx => ({
              date: tx.date,
              description: tx.name,
              amount: -tx.amount, // Plaid uses negative for expenses, we use positive
            }));

            // Use AI to categorize transactions
            const categorizedTransactions = await categorizeTransactions(transactionData);

            // Save to demo tables
            const demoTransactions = categorizedTransactions.map(tx => ({
              accountId: account.accountId,
              transactionId: `demo-${userEmail}-${Math.random().toString(36).substr(2, 9)}`,
              amount: tx.amount.toString(),
              description: tx.description,
              merchantName: null,
              category: null,
              subcategory: null,
              aiCategory: tx.category,
              aiType: tx.type,
              date: tx.date,
              accountName: account.accountName,
              institutionName: account.institutionName,
              pending: false,
            }));

            const savedTransactions = await storage.saveDemoTransactions(userEmail, demoTransactions);
            totalNewTransactions += savedTransactions.length;
          }
        } catch (error) {
          console.error(`Error syncing transactions for demo account ${account.accountId}:`, error);
        }
      }

      return { newTransactions: totalNewTransactions };
    } catch (error) {
      console.error('Error syncing demo transactions:', error);
      throw new Error('Failed to sync demo transactions');
    }
  }

  /**
   * Sync transactions for a user's accounts
   */
  async syncTransactions(userId: string): Promise<{ newTransactions: number; updatedTransactions: number }> {
    try {
      const linkedAccounts = await storage.getUserLinkedAccounts(userId);
      let totalNewTransactions = 0;
      let totalUpdatedTransactions = 0;

      for (const account of linkedAccounts) {
        try {
          // Get transactions from last 90 days for better coverage, especially for sandbox accounts
          const startDate = new Date();
          startDate.setDate(startDate.getDate() - 90);
          
          const endDate = new Date();
          
          console.log(`Fetching transactions for account ${account.accountId} from ${startDate.toISOString().split('T')[0]} to ${endDate.toISOString().split('T')[0]}`);

          const transactionsResponse = await plaidClient.transactionsGet({
            access_token: account.accessToken,
            start_date: startDate.toISOString().split('T')[0],
            end_date: endDate.toISOString().split('T')[0],
          });

          const transactions = transactionsResponse.data.transactions;
          
          console.log(`Retrieved ${transactions.length} transactions for account ${account.accountId}`);

          if (transactions.length > 0) {
            // Convert Plaid transactions to our format
            const transactionData = transactions.map(tx => ({
              date: tx.date,
              description: tx.name,
              amount: -tx.amount, // Plaid uses negative for expenses, we use positive
            }));

            // Use AI to categorize transactions
            const categorizedTransactions = await categorizeTransactions(transactionData);

            // Save to database
            const plaidTransactions = categorizedTransactions.map((tx, index) => ({
              userId,
              plaidAccountId: account.id,
              accountId: account.accountId,
              transactionId: transactions[index].transaction_id,
              amount: tx.amount.toString(),
              description: tx.description,
              merchantName: transactions[index].merchant_name || null,
              category: transactions[index].category?.[0] || null,
              subcategory: transactions[index].category?.[1] || null,
              aiCategory: tx.category,
              aiType: tx.type,
              date: tx.date,
              accountName: account.accountName,
              pending: transactions[index].pending,
            }));

            const savedTransactions = await storage.saveTransactions(plaidTransactions);
            totalNewTransactions += savedTransactions.length;
          }
        } catch (accountError) {
          console.error(`Error syncing transactions for account ${account.accountId}:`, accountError);
          // Continue with other accounts even if one fails
        }
      }

      return {
        newTransactions: totalNewTransactions,
        updatedTransactions: totalUpdatedTransactions,
      };
    } catch (error) {
      console.error('Error syncing transactions:', error);
      throw new Error('Failed to sync transactions');
    }
  }

  /**
   * Remove a linked account
   */
  async removeLinkedAccount(userId: string, accountId: string): Promise<void> {
    try {
      await storage.deactivateLinkedAccount(userId, accountId);
    } catch (error) {
      console.error('Error removing linked account:', error);
      throw new Error('Failed to remove linked account');
    }
  }

  /**
   * Get account balances
   */
  async getAccountBalances(userId: string): Promise<any[]> {
    try {
      const linkedAccounts = await storage.getUserLinkedAccounts(userId);
      const balances = [];

      for (const account of linkedAccounts) {
        try {
          const balanceResponse = await plaidClient.accountsBalanceGet({
            access_token: account.accessToken,
            options: {
              account_ids: [account.accountId],
            },
          });

          const accountBalance = balanceResponse.data.accounts[0];
          balances.push({
            accountId: account.accountId,
            accountName: account.accountName,
            institutionName: account.institutionName,
            type: account.accountType,
            subtype: account.accountSubtype,
            mask: account.mask,
            balance: accountBalance.balances,
          });
        } catch (accountError) {
          console.error(`Error getting balance for account ${account.accountId}:`, accountError);
        }
      }

      return balances;
    } catch (error) {
      console.error('Error getting account balances:', error);
      throw new Error('Failed to get account balances');
    }
  }
}

export const plaidService = new PlaidService();