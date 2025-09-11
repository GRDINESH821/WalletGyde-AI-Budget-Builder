import OpenAI from 'openai';
import { ragQueryFunctions, DateRange } from './ragQueryFunctions';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export interface IntentAnalysis {
  intent: 'get_income' | 'get_expenses' | 'get_cashflow' | 'get_account_summary' | 'get_spending_trends' | 'general_chat';
  parameters: {
    dateRange?: DateRange;
    accountIds?: string[];
    categories?: string[];
    periodType?: 'monthly' | 'weekly';
  };
  confidence: number;
  reasoning: string;
}

export interface RAGResponse {
  answer: string;
  data?: any;
  functionsUsed: string[];
  confidence: number;
}

export class RAGOrchestrator {

  /**
   * Parse user intent from natural language query
   */
  async parseIntent(userQuery: string): Promise<IntentAnalysis> {
    try {
      const systemPrompt = `You are an intent parser for a financial RAG system. Analyze user queries and determine:
1. The primary intent (function to call)
2. Extract parameters like date ranges, account IDs, categories
3. Provide confidence score (0-1)

Available functions:
- get_income: Get income transactions (keywords: income, salary, earnings, made money, received)
- get_expenses: Get expense transactions (keywords: spent, expenses, costs, bills, purchases)
- get_cashflow: Get net cashflow analysis (keywords: cashflow, cash flow, net income, balance, profit/loss)
- get_account_summary: Get account information (keywords: accounts, balances, banks, linked accounts)
- get_spending_trends: Get spending analysis by category (keywords: spending trends, top categories, where money goes)
- general_chat: General conversation not requiring data analysis

For date ranges, extract from phrases like:
- "last month", "this month", "past 30 days", "last 3 months", "this year", "last year"
- Specific dates like "January 2025", "since July", "between March and May"
- If no date mentioned, default to last 30 days

Respond in JSON format:
{
  "intent": "function_name",
  "parameters": {
    "dateRange": {"start": "YYYY-MM-DD", "end": "YYYY-MM-DD"},
    "categories": ["category1", "category2"],
    "accountIds": ["account1", "account2"],
    "periodType": "monthly"
  },
  "confidence": 0.85,
  "reasoning": "Brief explanation"
}`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userQuery }
        ],
        response_format: { type: "json_object" },
        temperature: 0.3
      });

      const intentData = JSON.parse(response.choices[0].message.content || '{}');
      
      // Validate and set defaults
      if (!intentData.parameters) {
        intentData.parameters = {};
      }

      // Set default date range if not specified and intent requires it
      if (!intentData.parameters.dateRange && 
          ['get_income', 'get_expenses', 'get_cashflow', 'get_spending_trends'].includes(intentData.intent)) {
        const end = new Date();
        const start = new Date();
        start.setDate(start.getDate() - 30); // Default to last 30 days
        
        intentData.parameters.dateRange = {
          start: start.toISOString().split('T')[0],
          end: end.toISOString().split('T')[0]
        };
      }

      return intentData as IntentAnalysis;
    } catch (error) {
      console.error('Error parsing intent:', error);
      return {
        intent: 'general_chat',
        parameters: {},
        confidence: 0,
        reasoning: 'Failed to parse intent, defaulting to general chat'
      };
    }
  }

  /**
   * Route to appropriate function based on intent
   */
  async routeFunction(
    intent: IntentAnalysis,
    userId: string,
    isDemo: boolean = false
  ): Promise<any> {
    try {
      const { intent: functionName, parameters } = intent;

      switch (functionName) {
        case 'get_income':
          return await ragQueryFunctions.getIncome(
            userId,
            parameters.dateRange!,
            parameters.accountIds,
            isDemo
          );

        case 'get_expenses':
          return await ragQueryFunctions.getExpenses(
            userId,
            parameters.dateRange!,
            parameters.categories,
            isDemo
          );

        case 'get_cashflow':
          return await ragQueryFunctions.getCashflow(
            userId,
            parameters.dateRange!,
            parameters.periodType || 'monthly',
            isDemo
          );

        case 'get_account_summary':
          return await ragQueryFunctions.getAccountSummary(userId, isDemo);

        case 'get_spending_trends':
          return await ragQueryFunctions.getSpendingTrends(
            userId,
            parameters.dateRange!,
            isDemo
          );

        case 'general_chat':
        default:
          return null; // No function call needed
      }
    } catch (error: any) {
      console.error('Error routing function:', error);
      throw new Error(`Failed to execute ${intent.intent}: ${error?.message || 'Unknown error'}`);
    }
  }

  /**
   * Generate grounded response based on function results
   */
  async generateGroundedResponse(
    userQuery: string,
    intent: IntentAnalysis,
    functionResult: any,
    userContext?: string
  ): Promise<string> {
    try {
      let systemPrompt = `You are a financial advisor AI providing insights based on actual user financial data.
      
User asked: "${userQuery}"
Intent: ${intent.intent}
Confidence: ${intent.confidence}

Guidelines:
1. Answer based ONLY on the provided data
2. Provide specific numbers and insights
3. Be conversational and helpful
4. Highlight important patterns or concerns
5. Suggest actionable next steps
6. Keep responses concise but informative
7. Format numbers with $ and commas (e.g., $1,234.56)

${userContext ? `User context: ${userContext}` : ''}`;

      if (functionResult) {
        systemPrompt += `\n\nData retrieved from user's financial accounts:\n${JSON.stringify(functionResult, null, 2)}`;
      } else {
        systemPrompt += '\n\nNo specific financial data was retrieved. Provide general financial advice or ask for clarification.';
      }

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userQuery }
        ],
        temperature: 0.7,
        max_tokens: 500
      });

      return response.choices[0].message.content || 'I apologize, but I couldn\'t generate a response based on your financial data.';
    } catch (error) {
      console.error('Error generating grounded response:', error);
      return 'I encountered an error while analyzing your financial data. Please try asking your question again.';
    }
  }

  /**
   * Main orchestration method - handles the complete RAG pipeline
   */
  async processQuery(
    userQuery: string,
    userId: string,
    isDemo: boolean = false,
    userContext?: string
  ): Promise<RAGResponse> {
    try {
      console.log(`RAG processing query for user (first 8 chars): ${userId.substring(0, 8)}...`);

      // Step 1: Parse intent
      const intent = await this.parseIntent(userQuery);
      console.log('Parsed intent:', intent.intent, 'confidence:', intent.confidence);

      // Step 2: Route to appropriate function
      let functionResult = null;
      let functionsUsed: string[] = [];

      if (intent.intent !== 'general_chat' && intent.confidence > 0.5) {
        try {
          functionResult = await this.routeFunction(intent, userId, isDemo);
          functionsUsed.push(intent.intent);
          console.log('Function executed:', intent.intent, 'data points returned:', 
            functionResult ? (functionResult.transactions?.length || functionResult.length || 'N/A') : 0);
        } catch (error) {
          console.error('Function execution failed:', error);
          // Continue with general response even if function fails
        }
      }

      // Step 3: Generate grounded response
      const answer = await this.generateGroundedResponse(
        userQuery,
        intent,
        functionResult,
        userContext
      );

      return {
        answer,
        data: functionResult,
        functionsUsed,
        confidence: intent.confidence
      };

    } catch (error) {
      console.error('RAG orchestration error:', error);
      return {
        answer: 'I encountered an error while processing your request. Please try again.',
        data: null,
        functionsUsed: [],
        confidence: 0
      };
    }
  }

  /**
   * Check if user has sufficient data for analysis
   */
  async validateUserData(userId: string, isDemo: boolean = false): Promise<{
    hasAccounts: boolean;
    hasTransactions: boolean;
    accountCount: number;
    transactionCount: number;
  }> {
    try {
      const accounts = await ragQueryFunctions.getAccountSummary(userId, isDemo);
      
      // Get recent transactions to check if user has data
      const end = new Date();
      const start = new Date();
      start.setDate(start.getDate() - 90); // Check last 90 days
      
      const expenses = await ragQueryFunctions.getExpenses(
        userId,
        {
          start: start.toISOString().split('T')[0],
          end: end.toISOString().split('T')[0]
        },
        undefined,
        isDemo
      );

      const income = await ragQueryFunctions.getIncome(
        userId,
        {
          start: start.toISOString().split('T')[0],
          end: end.toISOString().split('T')[0]
        },
        undefined,
        isDemo
      );

      const expenseTransactions = Object.values(expenses.categorizedExpenses)
        .reduce((total, category) => total + category.transactions.length, 0);
      const totalTransactions = expenseTransactions + income.transactions.length;

      return {
        hasAccounts: accounts.length > 0,
        hasTransactions: totalTransactions > 0,
        accountCount: accounts.length,
        transactionCount: totalTransactions
      };
    } catch (error) {
      console.error('Error validating user data:', error);
      return {
        hasAccounts: false,
        hasTransactions: false,
        accountCount: 0,
        transactionCount: 0
      };
    }
  }
}

export const ragOrchestrator = new RAGOrchestrator();