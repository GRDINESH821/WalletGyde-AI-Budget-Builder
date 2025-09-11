import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_API_KEY || "" });

function getSystemInstruction(hasConnectedAccounts: boolean, accountData?: any): string {
  const baseInstruction = `
You are WalletGyde, an expert financial coach AI. Your primary mission is to proactively guide the user through creating a comprehensive and personalized budget.

IMPORTANT FORMATTING RULES:
- Do NOT use asterisks (*) or any markdown formatting
- Use numbered lists for recommendations (1. 2. 3.)
- Use simple bullet points with hyphens (-) for lists
- Write in clear, clean sentences without emphasis formatting
- Keep paragraphs concise and readable

Your Guiding Principles:
1. Be Smart: Use connected banking data when available to provide personalized insights
2. Be Proactive: Lead the budgeting process with intelligent recommendations
3. One Question at a Time: Ask clear, simple questions one by one to avoid overwhelming the user
4. Maintain Context: Remember previous answers to build a complete financial picture
5. Be Encouraging: Use a supportive and non-judgmental tone
6. The Goal: Present a comprehensive budget analysis and actionable financial advice

Be conversational and helpful. Remember: NO asterisks or markdown formatting in your responses.
`;

  if (hasConnectedAccounts) {
    return baseInstruction + `
IMPORTANT: The user has connected their bank accounts to Walletgyde. You have access to their real financial data including:
- Account balances and types
- Recent transaction history 
- Spending patterns and categories

Your Enhanced Approach:
1. Smart Welcome: When starting a conversation, acknowledge their connected accounts and offer to analyze their current financial situation based on real data
2. Data-Driven Insights: Use their actual spending patterns, account balances, and transaction history to provide personalized advice
3. Proactive Analysis: Identify spending trends, unusual transactions, and optimization opportunities from their real data
4. Goal-Oriented: Help them set realistic financial goals based on their actual income and spending patterns

Example Opening: "Hi! I can see you have your bank accounts connected. I've analyzed your recent transactions and account balances. Would you like me to provide insights on your current spending patterns, or would you prefer to discuss specific financial goals?"

DO NOT ask for manual income input when you have access to their real banking data. Instead, use the connected account information to provide immediate, personalized financial insights.
`;
  }

  return baseInstruction + `
Your Conversation Flow (when no bank accounts connected):
1. Initiation: When the user starts, encourage them to connect their bank accounts for automatic analysis, or offer manual budget creation
2. Income: If manual mode, ask for their total monthly income after taxes
3. Expenses: Guide through fixed and variable expenses systematically
4. Analysis: Provide budget breakdown and actionable advice

Example Opening: "Hi! I'm here to help with your finances. For the best experience, I recommend connecting your bank accounts in Settings for automatic analysis. Alternatively, I can help you create a budget manually. Which would you prefer?"
`;
}

export async function generateFinancialResponse(
  message: string,
  conversationHistory: Array<{ role: string; content: string }> = [],
  hasConnectedAccounts: boolean = false,
  accountBalances?: any[],
  recentTransactions?: any[],
  csvUploads?: any[]
): Promise<string> {
  try {
    // Build conversation context for step-by-step financial coaching
    const conversationContext =
      conversationHistory.length > 0
        ? `Previous conversation:\n${conversationHistory.map((h) => `${h.role}: ${h.content}`).join("\n")}\n\nUser's current message: ${message}`
        : `User's message: ${message}`;

    // Include account data and CSV context if available
    let accountContext = "";
    if (hasConnectedAccounts && (accountBalances || recentTransactions)) {
      accountContext = "\n\nConnected Account Data:\n";
      
      if (accountBalances && accountBalances.length > 0) {
        accountContext += "Account Balances:\n";
        accountBalances.forEach(account => {
          accountContext += `- ${account.institutionName} ${account.type}: $${account.balance?.current || 'N/A'}\n`;
        });
      }
      
      if (recentTransactions && recentTransactions.length > 0) {
        accountContext += "\nRecent Transactions (last 10):\n";
        recentTransactions.slice(0, 10).forEach(tx => {
          accountContext += `- ${tx.date}: ${tx.description} - $${Math.abs(tx.amount)} (${tx.aiCategory || 'Uncategorized'})\n`;
        });
      }
    }
    
    // Include CSV upload context if available
    if (csvUploads && csvUploads.length > 0) {
      accountContext += "\n\nUploaded CSV Files:\n";
      csvUploads.forEach(upload => {
        accountContext += `- ${upload.fileName} (uploaded ${new Date(upload.createdAt).toLocaleDateString()})\n`;
        if (upload.analyzedData && upload.analyzedData.length > 0) {
          const totalAmount = upload.analyzedData.reduce((sum: number, tx: any) => sum + Math.abs(tx.amount || 0), 0);
          accountContext += `  Total transactions: ${upload.analyzedData.length}, Total amount: $${totalAmount.toFixed(2)}\n`;
        }
      });
    }

    const systemInstruction = getSystemInstruction(hasConnectedAccounts);

    const response = await ai.models.generateContent({
      model: "gemini-1.5-flash",
      contents: [
        {
          role: "user",
          parts: [
            {
              text: `${systemInstruction}\n\n${conversationContext}${accountContext}`,
            },
          ],
        },
      ],
    });

    const responseText = response.candidates?.[0]?.content?.parts?.[0]?.text || response.text || null;
    return (
      responseText ||
      "I apologize, but I'm having trouble processing your request right now. Please try again or rephrase your question."
    );
  } catch (error) {
    console.error("Error generating Gemini response:", error);
    return "I'm experiencing technical difficulties. Please try again in a moment.";
  }
}

const categorizationSystemInstruction = `
You are an expert financial analyst AI. Your task is to categorize financial transactions based on their descriptions.
You must categorize each transaction into one of the following categories:
"Housing", "Transportation", "Groceries", "Utilities", "Dining Out", "Shopping", "Health & Wellness", "Entertainment", "Travel", "Education", "Personal Care", "Subscriptions", "Gifts & Donations", "Income", "Investments", "Business Expense", "Miscellaneous".

After assigning a category, you must classify its type as "Mandatory", "Discretionary", or "Income".
- "Mandatory" expenses are essential needs like rent, mortgage, utilities, groceries, and insurance.
- "Discretionary" expenses are non-essential wants like dining out, shopping for clothes, entertainment, and hobbies.
- "Income" is any money coming in.

You will be given a JSON array of transactions. You MUST respond with ONLY a valid JSON array of the same transactions, each with two new keys: "category" and "type".
The 'amount' field in the input indicates the transaction value. Positive amounts are income, negative amounts are expenses.
Assign the type "Income" for any transaction with a positive amount.

Do not include any other text, explanations, or markdown fences in your response.
`;

export async function categorizeTransactions(
  transactions: any[],
): Promise<any[]> {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-1.5-flash",
      contents: [
        {
          role: "user",
          parts: [
            {
              text: `${categorizationSystemInstruction}\n\nTransactions to categorize:\n${JSON.stringify(transactions)}`,
            },
          ],
        },
      ],
      config: {
        responseMimeType: "application/json",
      },
    });

    const responseText = response.candidates?.[0]?.content?.parts?.[0]?.text || response.text;
    if (!responseText) {
      throw new Error("No response text from AI");
    }
    let jsonStr = responseText.trim();
    
    // Remove markdown code fences if present
    const fenceRegex = /^```(\w*)?\s*\n?([\s\S]*?)\n?\s*```$/;
    const match = jsonStr.match(fenceRegex);
    if (match && match[2]) {
      jsonStr = match[2].trim();
    }
    
    // Clean up any trailing commas or malformed JSON
    jsonStr = jsonStr.replace(/,\s*]/g, ']').replace(/,\s*}/g, '}');
    
    // Additional JSON cleanup for unterminated strings
    if (!jsonStr.startsWith('[') || !jsonStr.endsWith(']')) {
      console.log("Malformed JSON structure detected, using fallback categorization");
      throw new Error("Invalid JSON response from AI");
    }
    
    console.log("Attempting to parse JSON with length:", jsonStr.length);

    const categorizedTransactions = JSON.parse(jsonStr);
    return categorizedTransactions.map((tx: any, index: number) => ({
      ...tx,
      id: `${tx.date}-${tx.description}-${index}`,
    }));
  } catch (error) {
    console.error("Error categorizing transactions:", error);
    return transactions.map((t, index) => ({
      ...t,
      id: `${t.date}-${t.description}-${index}`,
      category: "Miscellaneous",
      type: t.amount > 0 ? "Income" : "Discretionary",
    }));
  }
}

export async function generateFinancialAnalysis(data: any): Promise<string> {
  try {
    const systemPrompt = `You are a professional financial analyst. Based on the provided financial data, generate a comprehensive analysis with:

1. Summary of financial health
2. Spending patterns and insights
3. Areas for improvement
4. Specific actionable recommendations
5. Long-term financial planning suggestions

IMPORTANT FORMATTING RULES:
- Do NOT use asterisks (*) or any markdown formatting
- Use numbered lists for recommendations (1. 2. 3.)
- Use simple bullet points with hyphens (-) for lists
- Write in clear, clean sentences without emphasis formatting
- Keep paragraphs concise and readable

Keep the analysis:
- Professional but accessible
- Focused on actionable insights
- Encouraging and supportive
- Data-driven with specific numbers when relevant

Financial data:
${JSON.stringify(data, null, 2)}

Provide a clear, structured analysis that helps the user understand their financial situation and next steps. Remember: NO asterisks or markdown formatting in your response.`;

    const response = await ai.models.generateContent({
      model: "gemini-1.5-flash",
      contents: [
        {
          role: "user",
          parts: [{ text: systemPrompt }],
        },
      ],
    });

    const responseText = response.candidates?.[0]?.content?.parts?.[0]?.text || response.text;
    return (
      responseText ||
      "I'm unable to analyze your financial data at the moment. Please try again."
    );
  } catch (error) {
    console.error("Error generating financial analysis:", error);
    return "I'm experiencing technical difficulties analyzing your financial data. Please try again in a moment.";
  }
}

export async function analyzeCsvAndGenerateInsights(
  csvData: any[],
): Promise<{ analysis: string; chartConfig: any }> {
  try {
    const categorizedData = await categorizeTransactions(csvData);

    // Calculate spending summary
    const summary = categorizedData.reduce(
      (acc, transaction) => {
        const amount = Math.abs(transaction.amount);
        if (transaction.type === "Income") {
          acc.totalIncome += amount;
        } else {
          acc.totalSpending += amount;
          if (transaction.type === "Mandatory") {
            acc.mandatorySpending += amount;
          } else {
            acc.discretionarySpending += amount;
          }

          if (!acc.categorySpending[transaction.category]) {
            acc.categorySpending[transaction.category] = 0;
          }
          acc.categorySpending[transaction.category] += amount;
        }
        return acc;
      },
      {
        totalIncome: 0,
        totalSpending: 0,
        mandatorySpending: 0,
        discretionarySpending: 0,
        categorySpending: {} as Record<string, number>,
      },
    );

    summary.netSavings = summary.totalIncome - summary.totalSpending;

    // Generate analysis using data-aware prompt
    const dataAwareSystemInstruction = `
You are WalletGyde, an expert financial coach AI. You are talking to a user about their recent spending, which you have already analyzed.
You are encouraging, knowledgeable, and focus on providing actionable advice without being judgmental.

IMPORTANT FORMATTING RULES:
- Do NOT use asterisks (*) or any markdown formatting
- Use numbered lists for recommendations (1. 2. 3.)
- Use simple bullet points with hyphens (-) for lists
- Write in clear, clean sentences without emphasis formatting
- Keep paragraphs concise and readable

Here is the summary of the user's recent financial activity:
- Total Income: $${summary.totalIncome.toFixed(2)}
- Total Spending: $${summary.totalSpending.toFixed(2)}
- Net Savings/Deficit: $${summary.netSavings.toFixed(2)}
- Mandatory Spending (Needs): $${summary.mandatorySpending.toFixed(2)}
- Discretionary Spending (Wants): $${summary.discretionarySpending.toFixed(2)}
- Top 3 Spending Categories: ${Object.entries(summary.categorySpending)
      .sort(([, a], [, b]) => (b as number) - (a as number))
      .slice(0, 3)
      .map(([cat, val]) => `${cat} ($${(val as number).toFixed(2)})`)
      .join(", ")}

Your Primary Goal: Empower the user with a plan.
1. Reference Budgeting Rules: Proactively introduce concepts like the 50/30/20 rule (50% on needs, 30% on wants, 20% on savings). Compare their current spending against this framework.
2. Collaborate on Goals: When the user asks for help or you are starting the conversation, proactively ask them if they would like to set a savings goal or create a budget for the next month.
3. Create Actionable Plans: If they provide a goal (e.g., "I want to save $500"), analyze their spending, particularly the 'Discretionary' part.
4. Suggest Specific Reductions: Create a simple plan. Suggest reducing spending in 1-2 specific categories.
5. Be Encouraging: Always maintain a supportive tone.

Analyze their CSV data and provide a comprehensive financial analysis with specific insights and actionable recommendations. Remember: NO asterisks or markdown formatting in your response.
`;

    const analysisResponse = await ai.models.generateContent({
      model: "gemini-1.5-flash",
      contents: [
        {
          role: "user",
          parts: [{ text: dataAwareSystemInstruction }],
        },
      ],
    });

    // Create chart configuration for visualization
    const chartConfig = {
      type: "multiChart",
      data: {
        categorySpending: summary.categorySpending,
        summary: {
          income: summary.totalIncome,
          mandatory: summary.mandatorySpending,
          discretionary: summary.discretionarySpending,
          savings: summary.netSavings,
        },
        transactions: categorizedData,
      },
    };

    return {
      analysis:
        (analysisResponse.candidates?.[0]?.content?.parts?.[0]?.text || analysisResponse.text) ||
        "I've analyzed your financial data and can help you create a better budget.",
      chartConfig,
    };
  } catch (error) {
    console.error("Error analyzing CSV data:", error);
    return {
      analysis:
        "I encountered an issue analyzing your CSV data. Please ensure it contains columns for date, description, and amount.",
      chartConfig: null,
    };
  }
}
