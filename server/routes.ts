import type { Express } from "express";
import { createServer, type Server } from "http";
import express from "express";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { generateFinancialResponse, categorizeTransactions, generateFinancialAnalysis, analyzeCsvAndGenerateInsights } from "./openai";
import { processCsvFile } from "./csvProcessor";
import { generateAvatar, AVATAR_PROMPTS } from "./openai-avatars";
import { plaidService } from "./plaidService";
import { ragOrchestrator } from "./ragOrchestrator";
import { insertBetaSignupSchema } from "@shared/schema";
import { z } from "zod";
import multer from "multer";
import path from "path";
import fs from "fs";

// Configure multer for avatar uploads
const upload = multer({
  dest: path.join(process.cwd(), "uploads"),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed"));
    }
  },
});

// Configure multer for CSV uploads
const csvUpload = multer({
  dest: path.join(process.cwd(), "uploads", "csv"),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
      cb(null, true);
    } else {
      cb(new Error('Only CSV files are allowed'));
    }
  },
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware - COMMENTED OUT FOR DEMO (can be restored later)
  // await setupAuth(app);

  // Serve static files from public directory
  app.use("/public", express.static(path.join(process.cwd(), "public")));
  
  // Serve avatars directory
  app.use("/avatars", express.static(path.join(process.cwd(), "public", "avatars")));

  // Health check endpoint - no auth required
  app.get("/api/health", async (req, res) => {
    res.json({
      status: "ok",
      timestamp: new Date().toISOString(),
      environment: {
        hasPlaidClientId: !!process.env.PLAID_CLIENT_ID,
        hasPlaidSecret: !!process.env.PLAID_SECRET,
        hasGoogleAiKey: !!process.env.GOOGLE_AI_API_KEY,
        hasSessionSecret: !!process.env.SESSION_SECRET,
        hasReplId: !!process.env.REPL_ID,
        hasReplitDomains: !!process.env.REPLIT_DOMAINS,
        hasDatabaseUrl: !!process.env.DATABASE_URL,
        plaidEnv: process.env.PLAID_ENV
      }
    });
  });



  // Get available avatar prompts
  app.get("/api/avatar-prompts", async (req, res) => {
    res.json(AVATAR_PROMPTS);
  });

  // Auth routes
  app.get('/api/auth/user', /* isAuthenticated, */ async (req: any, res) => {
    try {
      // For demo mode, return null user since no authentication
      if (!req.user) {
        res.json(null);
        return;
      }
      
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Avatar generation route
  app.post("/api/generate-avatar", /* isAuthenticated, */ async (req: any, res) => {
    try {
      const { prompt, avatarId } = req.body;
      const userId = req.user.claims.sub;

      // Get current user to check for existing avatar
      const currentUser = await storage.getUser(userId);
      
      let finalPrompt = prompt;
      
      // If avatarId is provided, find the corresponding prompt
      if (avatarId && !prompt) {
        const avatarOption = AVATAR_PROMPTS.find(a => a.id === avatarId);
        if (!avatarOption) {
          return res.status(400).json({ message: "Invalid avatar ID" });
        }
        finalPrompt = avatarOption.prompt;
      }

      if (!finalPrompt) {
        return res.status(400).json({ message: "Prompt or avatarId is required" });
      }

      // Delete old avatar if it exists
      if (currentUser?.avatarUrl) {
        const oldAvatarPath = path.join(process.cwd(), "public", currentUser.avatarUrl);
        try {
          if (fs.existsSync(oldAvatarPath)) {
            fs.unlinkSync(oldAvatarPath);
          }
        } catch (error) {
          console.warn("Failed to delete old avatar:", error);
        }
      }

      const fileName = `${userId}-generated-${Date.now()}.png`;
      const avatarUrl = await generateAvatar(finalPrompt, fileName);
      
      await storage.updateUserAvatar(userId, avatarUrl);
      
      res.json({ avatarUrl });
    } catch (error) {
      console.error("Error generating avatar:", error);
      res.status(500).json({ message: "Failed to generate avatar" });
    }
  });

  // Avatar upload route
  app.post("/api/upload-avatar", /* isAuthenticated, */ upload.single("avatar"), async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      // Get current user to check for existing avatar
      const currentUser = await storage.getUser(userId);

      // Delete old avatar if it exists
      if (currentUser?.avatarUrl) {
        const oldAvatarPath = path.join(process.cwd(), "public", currentUser.avatarUrl);
        try {
          if (fs.existsSync(oldAvatarPath)) {
            fs.unlinkSync(oldAvatarPath);
          }
        } catch (error) {
          console.warn("Failed to delete old avatar:", error);
        }
      }

      // Move file to permanent location
      const fileName = `${userId}-uploaded-${Date.now()}.${req.file.originalname.split('.').pop()}`;
      const permanentPath = path.join(process.cwd(), "public", "avatars", fileName);
      
      // Ensure avatars directory exists
      const avatarsDir = path.dirname(permanentPath);
      if (!fs.existsSync(avatarsDir)) {
        fs.mkdirSync(avatarsDir, { recursive: true });
      }

      // Move file and handle any errors
      try {
        fs.renameSync(req.file.path, permanentPath);
      } catch (error) {
        console.error("Error moving file:", error);
        // Fallback: copy file if rename fails
        fs.copyFileSync(req.file.path, permanentPath);
        fs.unlinkSync(req.file.path);
      }
      
      const avatarUrl = `/avatars/${fileName}`;
      await storage.updateUserAvatar(userId, avatarUrl);
      
      res.json({ avatarUrl });
    } catch (error) {
      console.error("Error uploading avatar:", error);
      res.status(500).json({ message: "Failed to upload avatar" });
    }
  });

  // Complete onboarding route
  app.post("/api/complete-onboarding", /* isAuthenticated, */ async (req: any, res) => {
    try {
      const { avatarUrl } = req.body;
      const userId = req.user.claims.sub;

      if (!avatarUrl) {
        return res.status(400).json({ message: "Avatar URL is required" });
      }

      const user = await storage.completeUserOnboarding(userId, avatarUrl);
      res.json(user);
    } catch (error) {
      console.error("Error completing onboarding:", error);
      res.status(500).json({ message: "Failed to complete onboarding" });
    }
  });

  // Chat conversation management
  app.get("/api/conversations", /* isAuthenticated, */ async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const conversations = await storage.getUserConversations(userId);
      res.json(conversations);
    } catch (error) {
      console.error("Error fetching conversations:", error);
      res.status(500).json({ message: "Failed to fetch conversations" });
    }
  });

  app.post("/api/conversations", /* isAuthenticated, */ async (req: any, res) => {
    try {
      const { title } = req.body;
      const userId = req.user.claims.sub;

      if (!title) {
        return res.status(400).json({ message: "Title is required" });
      }

      const conversation = await storage.createConversation({
        userId,
        title,
      });
      res.json(conversation);
    } catch (error) {
      console.error("Error creating conversation:", error);
      res.status(500).json({ message: "Failed to create conversation" });
    }
  });

  app.delete("/api/conversations/:id", /* isAuthenticated, */ async (req: any, res) => {
    try {
      const conversationId = parseInt(req.params.id);
      const userId = req.user.claims.sub;

      await storage.deleteConversation(conversationId, userId);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting conversation:", error);
      res.status(500).json({ message: "Failed to delete conversation" });
    }
  });

  // Upload and analyze CSV file
  app.post("/api/conversations/:id/upload-csv", /* isAuthenticated, */ csvUpload.single('csv'), async (req: any, res) => {
    try {
      const conversationId = parseInt(req.params.id);
      const userId = req.user.claims.sub;
      
      console.log("CSV upload request:", { conversationId, userId, file: req.file ? req.file.originalname : 'No file' });
      
      if (!req.file) {
        console.log("No file in request:", Object.keys(req.body));
        return res.status(400).json({ message: "No CSV file uploaded" });
      }

      // Ensure CSV uploads directory exists
      const csvDir = path.join(process.cwd(), "uploads", "csv");
      if (!fs.existsSync(csvDir)) {
        fs.mkdirSync(csvDir, { recursive: true });
      }

      // Process the CSV file
      const result = await processCsvFile(req.file.path);
      
      // Save CSV upload record
      await storage.saveCsvUpload({
        userId,
        fileName: req.file.originalname,
        filePath: req.file.path,
        analyzedData: result.data,
      });

      // Add user message about CSV upload
      const userMessage = await storage.addMessage({
        conversationId,
        role: "user",
        content: `I uploaded a CSV file: ${req.file.originalname}`,
      });

      // Add AI response with analysis and chart
      const aiMessage = await storage.addMessage({
        conversationId,
        role: "assistant",
        content: result.analysis,
        csvData: result.data,
        chartConfig: result.chartConfig,
      });

      // Clean up uploaded file
      fs.unlinkSync(req.file.path);

      res.json({
        userMessage,
        aiMessage,
        chartData: result.chartConfig
      });
    } catch (error) {
      console.error("Error processing CSV upload:", error);
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Failed to process CSV file" 
      });
    }
  });

  // Chat messages
  app.get("/api/conversations/:id/messages", /* isAuthenticated, */ async (req: any, res) => {
    try {
      const conversationId = parseInt(req.params.id);
      const messages = await storage.getConversationMessages(conversationId);
      res.json(messages);
    } catch (error) {
      console.error("Error fetching messages:", error);
      res.status(500).json({ message: "Failed to fetch messages" });
    }
  });

  app.post("/api/conversations/:id/messages", /* isAuthenticated, */ async (req: any, res) => {
    try {
      const conversationId = parseInt(req.params.id);
      const { content, role } = req.body;
      const userId = req.user.claims.sub;

      if (!content || !role) {
        return res.status(400).json({ message: "Content and role are required" });
      }

      // Verify the conversation exists and belongs to the user
      const conversations = await storage.getUserConversations(userId);
      const conversationExists = conversations.find(c => c.id === conversationId);
      
      if (!conversationExists) {
        return res.status(404).json({ message: "Conversation not found or access denied" });
      }

      const message = await storage.addMessage({
        conversationId,
        content,
        role,
      });

      // If this is a user message, generate AI response
      if (role === "user") {
        // Get conversation history for context
        const messages = await storage.getConversationMessages(conversationId);
        const conversationHistory = messages.map(m => ({
          role: m.role,
          content: m.content,
        }));

        // Check if user has connected bank accounts
        const linkedAccounts = await storage.getUserLinkedAccounts(userId);
        const hasConnectedAccounts = linkedAccounts.length > 0;
        
        let accountBalances = null;
        let recentTransactions = null;
        
        if (hasConnectedAccounts) {
          try {
            // Get account balances
            accountBalances = await plaidService.getAccountBalances(userId);
            
            // Get recent transactions
            recentTransactions = await storage.getUserTransactions(userId, 20);
          } catch (error) {
            console.error("Error fetching account data for message:", error);
            // Continue without account data if there's an error
          }
        }

        // Get uploaded CSV data for context
        let csvUploads: any[] = [];
        try {
          csvUploads = await storage.getUserCsvUploads(userId);
        } catch (error) {
          console.error("Error fetching CSV uploads:", error);
        }

        // Use RAG system for intelligent financial analysis  
        console.log('Using RAG system for authenticated user financial analysis...');
        const ragResponse = await ragOrchestrator.processQuery(
          content,
          userId, // Regular user ID
          false, // isDemo = false for authenticated users
          `User has ${hasConnectedAccounts ? linkedAccounts.length : 0} connected accounts and ${recentTransactions?.length || 0} recent transactions. ${csvUploads.length > 0 ? `Also has ${csvUploads.length} CSV uploads.` : ''}`
        );

        console.log('RAG analysis complete for authenticated user:', ragResponse.functionsUsed);
        const aiResponse = ragResponse.answer;
        
        const aiMessage = await storage.addMessage({
          conversationId,
          content: aiResponse,
          role: "assistant",
        });

        res.json({ userMessage: message, aiMessage });
      } else {
        res.json({ message });
      }
    } catch (error) {
      console.error("Error adding message:", error);
      res.status(500).json({ message: "Failed to add message" });
    }
  });

  // Transaction analysis route
  app.post("/api/analyze-transactions", /* isAuthenticated, */ async (req: any, res) => {
    try {
      const { transactions } = req.body;

      if (!transactions || !Array.isArray(transactions)) {
        return res.status(400).json({ message: "Transactions array is required" });
      }

      const categorizedTransactions = await categorizeTransactions(transactions);
      res.json({ transactions: categorizedTransactions });
    } catch (error) {
      console.error("Error analyzing transactions:", error);
      res.status(500).json({ message: "Failed to analyze transactions" });
    }
  });

  // Financial analysis route
  app.post("/api/analyze-finances", /* isAuthenticated, */ async (req: any, res) => {
    try {
      const { financialData } = req.body;
      const userId = req.user.claims.sub;

      console.log("Analyze finances request:", { userId, hasFinancialData: !!financialData, dataLength: financialData?.length || 0 });

      if (!financialData) {
        return res.status(400).json({ message: "Financial data is required" });
      }

      if (!Array.isArray(financialData) || financialData.length === 0) {
        return res.status(400).json({ message: "Financial data must be a non-empty array" });
      }

      console.log("Processing financial analysis for", financialData.length, "transactions");
      
      // Use the existing CSV analysis function which includes chart generation
      const result = await analyzeCsvAndGenerateInsights(financialData);
      
      res.json({ 
        analysis: result.analysis, 
        chartConfig: result.chartConfig 
      });
    } catch (error) {
      console.error("Error analyzing finances:", error);
      res.status(500).json({ message: "Failed to analyze financial data" });
    }
  });

  // Plaid integration routes
  
  // Create link token for Plaid Link - REAL PLAID ONLY  
  app.post("/api/plaid/create-link-token", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const userEmail = req.user.claims.email;

      const linkToken = await plaidService.createLinkToken({
        userId,
        userEmail,
      });

      res.json({ linkToken });
    } catch (error) {
      console.error("Error creating link token:", error);
      res.status(500).json({ message: "Failed to create link token" });
    }
  });

  // Exchange public token for access token - REAL PLAID ONLY
  app.post("/api/plaid/exchange-token", isAuthenticated, async (req: any, res) => {
    try {
      const { publicToken } = req.body;
      const userId = req.user.claims.sub;

      if (!publicToken) {
        return res.status(400).json({ message: "Public token is required" });
      }

      const result = await plaidService.exchangePublicToken(publicToken, userId);
      
      // Generate automatic financial analysis after connecting accounts
      try {
        // Get the user's conversations to add analysis to the most recent one
        const conversations = await storage.getUserConversations(userId);
        if (conversations.length > 0) {
          const mostRecentConversation = conversations[0];
          
          // Add user message about account connection
          await storage.addMessage({
            conversationId: mostRecentConversation.id,
            role: "user",
            content: `I connected my ${result.accounts.length} bank account(s) successfully`,
          });
          
          // Get account balances and recent transactions for analysis
          const accountBalances = await plaidService.getAccountBalances(userId);
          const recentTransactions = await storage.getUserTransactions(userId, 30);
          
          // Get conversation history for context
          const messages = await storage.getConversationMessages(mostRecentConversation.id);
          const conversationHistory = messages.map(m => ({
            role: m.role,
            content: m.content,
          }));
          
          // Generate comprehensive financial analysis
          const analysisMessage = "Now that your accounts are connected, let me analyze your financial situation and provide insights based on your real banking data.";
          
          const aiResponse = await generateFinancialResponse(
            analysisMessage,
            conversationHistory,
            true,
            accountBalances || [],
            recentTransactions || [],
            []
          );
          
          // Add AI analysis to conversation
          await storage.addMessage({
            conversationId: mostRecentConversation.id,
            role: "assistant",
            content: aiResponse,
          });
        }
      } catch (analysisError) {
        console.error("Error generating automatic financial analysis:", analysisError);
        // Don't fail the entire request if analysis fails
      }
      
      res.json({
        message: "Account linked successfully",
        accounts: result.accounts.length,
      });
    } catch (error) {
      console.error("Error exchanging public token:", error);
      res.status(500).json({ message: "Failed to link account" });
    }
  });

  // Get user's linked accounts - modified for demo mode
  app.get("/api/plaid/accounts", /* isAuthenticated, */ async (req: any, res) => {
    try {
      // For demo mode, return empty array since no authentication
      // In production, uncomment isAuthenticated middleware and use: req.user.claims.sub
      if (!req.user) {
        res.json([]);
        return;
      }
      
      const userId = req.user.claims.sub;
      const accounts = await storage.getUserLinkedAccounts(userId);
      res.json(accounts);
    } catch (error) {
      console.error("Error fetching linked accounts:", error);
      res.status(500).json({ message: "Failed to fetch linked accounts" });
    }
  });

  // Get account balances - modified for demo mode
  app.get("/api/plaid/balances", /* isAuthenticated, */ async (req: any, res) => {
    try {
      // For demo mode, return empty array since no authentication
      if (!req.user) {
        res.json([]);
        return;
      }
      
      const userId = req.user.claims.sub;
      const balances = await plaidService.getAccountBalances(userId);
      res.json(balances);
    } catch (error) {
      console.error("Error fetching account balances:", error);
      res.status(500).json({ message: "Failed to fetch account balances" });
    }
  });

  // Sync transactions - modified for demo mode
  app.post("/api/plaid/sync-transactions", /* isAuthenticated, */ async (req: any, res) => {
    try {
      // For demo mode, return empty result since no authentication
      if (!req.user) {
        res.json({ message: "No accounts to sync", newTransactions: 0, updatedTransactions: 0 });
        return;
      }
      
      const userId = req.user.claims.sub;
      const result = await plaidService.syncTransactions(userId);
      res.json({
        message: "Transactions synced successfully",
        newTransactions: result.newTransactions,
        updatedTransactions: result.updatedTransactions,
      });
    } catch (error) {
      console.error("Error syncing transactions:", error);
      res.status(500).json({ message: "Failed to sync transactions" });
    }
  });

  // Get user transactions
  app.get("/api/plaid/transactions", /* isAuthenticated, */ async (req: any, res) => {
    try {
      // For demo mode, return empty array since no authentication
      if (!req.user) {
        res.json([]);
        return;
      }
      
      const userId = req.user.claims.sub;
      const limit = parseInt(req.query.limit as string) || 100;
      const transactions = await storage.getUserTransactions(userId, limit);
      res.json(transactions);
    } catch (error) {
      console.error("Error fetching transactions:", error);
      res.status(500).json({ message: "Failed to fetch transactions" });
    }
  });

  // Remove linked account - modified for demo mode
  app.delete("/api/plaid/accounts/:accountId", /* isAuthenticated, */ async (req: any, res) => {
    try {
      // For demo mode, return success since no authentication
      if (!req.user) {
        res.json({ message: "No accounts to disconnect" });
        return;
      }
      
      const userId = req.user.claims.sub;
      const { accountId } = req.params;

      await plaidService.removeLinkedAccount(userId, accountId);
      res.json({ message: "Account disconnected successfully" });
    } catch (error) {
      console.error("Error removing linked account:", error);
      res.status(500).json({ message: "Failed to disconnect account" });
    }
  });
  
  // Beta signup endpoint
  app.post("/api/beta-signup", async (req, res) => {
    try {
      const validatedData = insertBetaSignupSchema.parse(req.body);
      
      // Check if email already exists
      const existingSignup = await storage.getBetaSignup(validatedData.email);
      if (existingSignup) {
        return res.status(409).json({ 
          message: "Email already registered for beta access",
          success: false 
        });
      }

      const betaSignup = await storage.createBetaSignup(validatedData);
      res.status(201).json({ 
        message: "Successfully joined the beta waitlist!",
        success: true,
        data: { id: betaSignup.id, email: betaSignup.email }
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Invalid email format",
          success: false,
          errors: error.errors 
        });
      }
      res.status(500).json({ 
        message: "Failed to join beta waitlist",
        success: false 
      });
    }
  });

  // Get beta signup count
  app.get("/api/beta-signup-count", async (req, res) => {
    try {
      const count = await storage.getBetaSignupCount();
      res.json({ count });
    } catch (error) {
      res.status(500).json({ message: "Failed to get signup count" });
    }
  });

  // Simplified demo chat endpoints
  app.post("/api/demo-chat", async (req, res) => {
    try {
      console.log('Simplified demo chat endpoint hit with:', req.body);
      const { message, userEmail, demoUserId, clearPreviousData } = req.body;
      
      if (!message || typeof message !== 'string') {
        return res.status(400).json({ message: "Message is required" });
      }
      
      if (!userEmail || typeof userEmail !== 'string') {
        return res.status(400).json({ message: "User email is required" });
      }
      
      // Create a unique demo user identifier combining email and UID for complete isolation
      const uniqueDemoId = demoUserId ? `${userEmail}:${demoUserId}` : userEmail;
      
      // Check rate limit: 20 questions per demo user
      const questionCount = await storage.getDemoUserQuestionCount(uniqueDemoId);
      if (questionCount >= 10) {
        return res.status(429).json({ 
          message: "Demo limit reached. You've used all 20 questions. Please sign up for full access.",
          isRateLimited: true 
        });
      }
      
      console.log('Processing message for demo user:', uniqueDemoId, 'message:', message, 'question count:', questionCount + 1);

      // NOTE: No longer clearing demo accounts - they persist across chat sessions
      // This allows users to connect accounts once and continue chatting about their data

      // Track demo email for marketing purposes
      try {
        await storage.upsertDemoEmail(userEmail);
        console.log('Demo email tracked for marketing:', userEmail);
      } catch (error) {
        console.error('Error tracking demo email:', error);
        // Don't fail the request if email tracking fails
      }

      // Get previous messages for context - ENSURE COMPLETE USER ISOLATION
      const previousMessages = await storage.getDemoMessages(uniqueDemoId);
      const conversationHistory = previousMessages.map(m => ({
        role: m.role,
        content: m.content,
      }));

      // Add user message - using unique demo ID for complete isolation
      await storage.addDemoMessage({
        userEmail: uniqueDemoId,
        role: "user",
        content: message,
      });

      // Check for connected accounts and recent transactions - ONLY FOR THIS SPECIFIC USER
      console.log('Checking demo accounts for unique user:', uniqueDemoId);
      const linkedAccounts = await storage.getDemoPlaidAccounts(uniqueDemoId);
      console.log('Found', linkedAccounts.length, 'demo plaid accounts for user:', uniqueDemoId);
      const hasConnectedAccounts = linkedAccounts.length > 0;
      
      let accountBalances = null;
      let recentTransactions = null;
      
      if (hasConnectedAccounts) {
        try {
          console.log('Demo user has', linkedAccounts.length, 'connected accounts');
          
          // Get account balances from demo accounts
          accountBalances = linkedAccounts.map(account => ({
            institutionName: account.institutionName,
            type: account.accountType,
            balance: {
              current: account.currentBalance ? parseFloat(account.currentBalance.toString()) : 0,
              available: account.availableBalance ? parseFloat(account.availableBalance.toString()) : null,
            },
            accountName: account.accountName,
            mask: account.mask,
          }));
          
          // Get recent transactions
          recentTransactions = await storage.getDemoTransactions(uniqueDemoId, 20);
          console.log('Found', recentTransactions.length, 'demo transactions for user:', uniqueDemoId);
        } catch (error) {
          console.error("Error fetching demo account data:", error);
        }
      } else {
        console.log('Demo user has no connected accounts');
      }

      // Get uploaded CSV data for context - ONLY FOR THIS SPECIFIC USER
      let csvUploads = [];
      try {
        csvUploads = await storage.getDemoUserCsvUploads(uniqueDemoId);
        console.log('Found', csvUploads.length, 'CSV uploads for user:', uniqueDemoId);
      } catch (error) {
        console.error("Error fetching demo CSV uploads:", error);
      }

      // Prepare comprehensive context for LLM including account details
      let accountContext = '';
      if (hasConnectedAccounts && accountBalances) {
        accountContext = `\n\nConnected Accounts:\n${accountBalances.map(acc => 
          `- ${acc.accountName} (${acc.type}): $${acc.balance.current.toFixed(2)}`
        ).join('\n')}`;
      }
      
      const userContext = `User has ${hasConnectedAccounts ? linkedAccounts.length : 0} connected accounts and ${recentTransactions?.length || 0} recent transactions. ${csvUploads.length > 0 ? `Also has ${csvUploads.length} CSV uploads.` : ''}${accountContext}`;

      // Use RAG system for intelligent financial analysis
      console.log('Using RAG system for financial analysis...');
      const ragResponse = await ragOrchestrator.processQuery(
        message,
        uniqueDemoId, // Use the unique demo ID for user identification
        true, // isDemo = true
        userContext
      );

      console.log('RAG analysis complete:', ragResponse.functionsUsed);
      const response = ragResponse.answer;
      
      // Add AI response - using unique demo ID for complete isolation
      await storage.addDemoMessage({
        userEmail: uniqueDemoId,
        role: "assistant",
        content: response,
      });
      
      res.json({ response });
    } catch (error) {
      console.error("Demo chat error:", error);
      res.status(500).json({ message: "Failed to generate response" });
    }
  });

  // Get demo chat messages with question count
  app.get("/api/demo-chat/:userEmail", async (req, res) => {
    try {
      const { userEmail } = req.params;
      const messages = await storage.getDemoMessages(userEmail);
      const questionCount = await storage.getDemoUserQuestionCount(userEmail);
      const remainingQuestions = Math.max(0, 10 - questionCount);
      res.json({ messages, remainingQuestions });
    } catch (error) {
      console.error("Error fetching demo messages:", error);
      res.status(500).json({ message: "Failed to fetch messages" });
    }
  });

  // Clear demo user data
  app.delete("/api/demo-chat/:userEmail", async (req, res) => {
    try {
      const { userEmail } = req.params;
      await storage.clearDemoUserData(userEmail);
      res.json({ message: "Demo data cleared successfully" });
    } catch (error) {
      console.error("Error clearing demo data:", error);
      res.status(500).json({ message: "Failed to clear demo data" });
    }
  });

  // Demo CSV upload endpoint
  app.post("/api/demo-upload-csv", csvUpload.single('csv'), async (req, res) => {
    try {
      const { userEmail } = req.body;
      
      if (!userEmail) {
        return res.status(400).json({ message: "User email is required" });
      }
      
      if (!req.file) {
        return res.status(400).json({ message: "No CSV file uploaded" });
      }

      // Process the CSV file
      const result = await processCsvFile(req.file.path);
      
      // Save CSV upload record
      await storage.saveDemoCsvUpload(
        userEmail,
        req.file.originalname,
        req.file.path,
        result.data
      );

      // Add user message about CSV upload
      await storage.addDemoMessage({
        userEmail,
        role: "user",
        content: `I uploaded a CSV file: ${req.file.originalname}`,
      });

      // Add AI response with analysis
      await storage.addDemoMessage({
        userEmail,
        role: "assistant",
        content: result.analysis,
      });

      // Clean up uploaded file
      fs.unlinkSync(req.file.path);

      res.json({
        message: "CSV uploaded and analyzed successfully",
        analysis: result.analysis
      });
    } catch (error) {
      console.error("Error processing demo CSV upload:", error);
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Failed to process CSV file" 
      });
    }
  });

  // Demo Plaid endpoints
  app.post("/api/demo-plaid/create-link-token", async (req, res) => {
    try {
      const { userEmail } = req.body;
      
      if (!userEmail) {
        return res.status(400).json({ message: "User email is required" });
      }

      console.log('Demo link token request for:', userEmail);
      
      // Create a non-sensitive user ID by hashing the email
      const crypto = await import('crypto');
      const demoUserId = crypto.createHash('sha256').update(userEmail).digest('hex').substring(0, 16);
      
      const linkToken = await plaidService.createLinkToken({
        userId: demoUserId, // Use hashed ID instead of email
        userEmail: userEmail
      });
      
      console.log('Demo link token created successfully');
      res.json({ linkToken });
    } catch (error) {
      console.error("Error creating demo link token:", error);
      // Log the full error details
      if (error instanceof Error) {
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
      }
      res.status(500).json({ message: "Failed to create link token" });
    }
  });

  app.post("/api/demo-plaid/exchange-token", async (req, res) => {
    try {
      const { userEmail, publicToken } = req.body;
      
      if (!userEmail || !publicToken) {
        return res.status(400).json({ message: "User email and public token are required" });
      }

      console.log('Demo exchange token request for:', userEmail);
      console.log('Public token:', publicToken);

      // Create the same hashed user ID for consistency
      const crypto = await import('crypto');
      const demoUserId = crypto.createHash('sha256').update(userEmail).digest('hex').substring(0, 16);
      
      console.log('Using demo user ID:', demoUserId);
      
      // Use demo-specific Plaid method (calls real API but doesn't save to auth tables)
      console.log('Calling demo Plaid API with token:', publicToken);
      let result;
      try {
        result = await plaidService.exchangePublicTokenDemo(publicToken);
        console.log('Demo Plaid API returned:', result.accounts.length, 'accounts');
        console.log('Real account details:', result.accounts.map(acc => ({ name: acc.name, type: acc.type, balance: acc.balances?.current })));
      } catch (plaidError) {
        console.error('Demo Plaid API failed:', plaidError);
        // Add more detailed error information for debugging
        if (plaidError instanceof Error && plaidError.message.includes('Failed to exchange public token')) {
          console.error('This is expected with test tokens. Real tokens from Plaid Link frontend will work.');
        }
        throw plaidError;
      }
      console.log('Demo exchange result:', { accountCount: result.accounts.length });
      
      const accounts = result.accounts;
      console.log('Accounts from result:', accounts);

      // Save REAL account info to demo tables for later use in chat
      let savedCount = 0;
      for (const account of accounts) {
        await storage.saveDemoPlaidAccount(userEmail, {
          accessToken: result.accessToken,
          itemId: result.itemId,
          institutionId: account.institutionId || 'unknown_institution',
          institutionName: account.institutionName || 'Unknown Bank',
          accountId: account.account_id,
          accountName: account.name,
          accountType: account.type,
          accountSubtype: account.subtype || '',
          mask: account.mask || '0000',
          currentBalance: account.balances?.current || 0,
          availableBalance: account.balances?.available || account.balances?.current || 0,
        });
        savedCount++;
      }
      
      console.log('Real Plaid accounts saved successfully for demo user:', {
        userEmail,
        accountCount: savedCount,
        institution: accounts[0]?.institutionName || 'Unknown Bank',
        accountTypes: accounts.map(acc => acc.type),
        accountNames: accounts.map(acc => acc.name)
      });
      
      // Add immediate notification about successful account linking
      const accountText = savedCount === 1 ? 'account' : 'accounts';
      await storage.addDemoMessage({
        userEmail,
        role: "assistant",
        content: `✅ ${savedCount} ${accountText} linked successfully! I can now analyze your real banking data for better insights.`,
      });

      // Process transactions and analysis in background to prevent timeout
      setImmediate(async () => {
        try {
          console.log('Background: Fetching real transactions from Plaid for demo user');
          const syncResult = await plaidService.syncDemoTransactions(userEmail, result.accessToken);
          console.log('Background: Synced real transactions for demo user:', syncResult.newTransactions, 'transactions');
          
          // Generate automatic financial analysis after transactions are loaded
          try {
            const messages = await storage.getDemoMessages(userEmail);
            const conversationHistory = messages.map(m => ({
              role: m.role,
              content: m.content,
            }));
            
            const linkedAccounts = await storage.getDemoPlaidAccounts(userEmail);
            const accountBalances = linkedAccounts.map(account => ({
              institutionName: account.institutionName,
              type: account.accountType,
              balance: {
                current: account.currentBalance ? parseFloat(account.currentBalance.toString()) : 0,
                available: account.availableBalance ? parseFloat(account.availableBalance.toString()) : null,
              },
              accountName: account.accountName,
              mask: account.mask,
            }));
            
            const recentTransactions = await storage.getDemoTransactions(userEmail, 30);
            
            const analysisMessage = "Now that your accounts are connected, let me analyze your financial situation and provide insights based on your real banking data.";
            
            const aiResponse = await generateFinancialResponse(
              analysisMessage,
              conversationHistory,
              true,
              accountBalances || [],
              recentTransactions || [],
              []
            );
            
            await storage.addDemoMessage({
              userEmail,
              role: "assistant",
              content: aiResponse,
            });
            
            console.log('Background: Demo financial analysis generated successfully');
          } catch (analysisError) {
            console.error('Background: Error generating demo financial analysis:', analysisError);
          }
        } catch (txnError) {
          console.error('Background: Error syncing real transactions for demo user:', txnError);
        }
      });
      
      console.log('Successfully saved', savedCount, 'accounts');
      res.json({ accounts: savedCount });
    } catch (error) {
      console.error("Error exchanging demo token:", error);
      if (error instanceof Error) {
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
        
        // Check if this is a Plaid API validation error
        if (error.message.includes('INVALID_PUBLIC_TOKEN') || error.message.includes('could not find matching public token')) {
          console.error('❌ This error indicates the public token format or validation failed');
          console.error('💡 Make sure you are using a real public token from Plaid Link frontend, not a test token');
        }
      }
      res.status(500).json({ message: "Failed to exchange token" });
    }
  });

  app.get("/api/demo-plaid/accounts/:userEmail", async (req, res) => {
    try {
      const { userEmail } = req.params;
      // Only return accounts that were connected via Plaid
      const accounts = await storage.getDemoPlaidAccounts(userEmail);
      res.json(accounts);
    } catch (error) {
      console.error("Error fetching demo Plaid accounts:", error);
      res.status(500).json({ message: "Failed to fetch accounts" });
    }
  });

  // Legacy chat endpoint (kept for compatibility)
  app.post("/api/chat", /* isAuthenticated, */ async (req: any, res) => {
    try {
      const { message, conversationHistory } = req.body;
      const userId = req.user.claims.sub;
      
      if (!message || typeof message !== 'string') {
        return res.status(400).json({ message: "Message is required" });
      }

      // Check if user has connected bank accounts
      const linkedAccounts = await storage.getUserLinkedAccounts(userId);
      const hasConnectedAccounts = linkedAccounts.length > 0;
      
      let accountBalances = null;
      let recentTransactions = null;
      
      if (hasConnectedAccounts) {
        try {
          // Get account balances
          accountBalances = await plaidService.getAccountBalances(userId);
          
          // Get recent transactions
          recentTransactions = await storage.getUserTransactions(userId, 20);
        } catch (error) {
          console.error("Error fetching account data for chat:", error);
          // Continue without account data if there's an error
        }
      }

      // Get uploaded CSV data for context
      let csvUploads = [];
      try {
        csvUploads = await storage.getUserCsvUploads(userId);
      } catch (error) {
        console.error("Error fetching CSV uploads:", error);
      }

      const response = await generateFinancialResponse(
        message, 
        conversationHistory || [], 
        hasConnectedAccounts,
        accountBalances || [],
        recentTransactions || [],
        csvUploads
      );
      
      res.json({ response });
    } catch (error) {
      console.error("Chat error:", error);
      res.status(500).json({ message: "Failed to generate response" });
    }
  });

  // Enhanced demo chat endpoints with bank integration
  app.get("/api/demo-chat/:userEmail/messages", async (req, res) => {
    try {
      const { userEmail } = req.params;
      const { demoUserId } = req.query;
      
      // Create a unique demo user identifier for complete isolation
      const uniqueDemoId = demoUserId ? `${userEmail}:${demoUserId}` : userEmail;
      
      const messages = await storage.getDemoMessages(uniqueDemoId);
      res.json(messages);
    } catch (error) {
      console.error("Error fetching demo messages:", error);
      res.status(500).json({ message: "Failed to fetch messages" });
    }
  });

  app.post("/api/demo-chat/:userEmail/messages", async (req, res) => {
    try {
      const { userEmail } = req.params;
      const { message, demoUserId } = req.body;
      
      if (!message) {
        return res.status(400).json({ message: "Message is required" });
      }

      // Create a unique demo user identifier combining email and UID for complete isolation
      const uniqueDemoId = demoUserId ? `${userEmail}:${demoUserId}` : userEmail;

      // Check rate limit: 10 questions per demo user
      const questionCount = await storage.getDemoUserQuestionCount(uniqueDemoId);
      if (questionCount >= 10) {
        return res.status(429).json({ 
          message: "Demo limit reached. You've used all 10 questions. Please sign up for full access.",
          isRateLimited: true 
        });
      }

      console.log('Enhanced demo chat message from unique user:', uniqueDemoId, '- Message:', message, '- Question count:', questionCount + 1);

      // Add user message - using unique demo ID for complete isolation
      const userMessage = await storage.addDemoMessage({
        userEmail: uniqueDemoId,
        role: "user",
        content: message,
      });

      // Get conversation history for context - ENSURE COMPLETE USER ISOLATION
      const messages = await storage.getDemoMessages(uniqueDemoId);
      const conversationHistory = messages.map(m => ({
        role: m.role,
        content: m.content,
      }));

      // Check if user has connected bank accounts (demo version) - ONLY FOR THIS SPECIFIC USER
      const linkedAccounts = await storage.getDemoPlaidAccounts(uniqueDemoId);
      const hasConnectedAccounts = linkedAccounts.length > 0;
      
      let accountBalances = null;
      let recentTransactions = null;
      
      if (hasConnectedAccounts) {
        try {
          console.log('Demo user has', linkedAccounts.length, 'connected accounts');
          
          // Get account balances from demo accounts
          accountBalances = linkedAccounts.map(account => ({
            institutionName: account.institutionName,
            type: account.accountType,
            balance: {
              current: account.currentBalance ? parseFloat(account.currentBalance.toString()) : 0,
              available: account.availableBalance ? parseFloat(account.availableBalance.toString()) : null,
            },
            accountName: account.accountName,
            mask: account.mask,
          }));
          
          // Get recent transactions
          recentTransactions = await storage.getDemoTransactions(uniqueDemoId, 20);
          console.log('Found', recentTransactions.length, 'demo transactions for user:', uniqueDemoId);
        } catch (error) {
          console.error("Error fetching demo account data:", error);
        }
      } else {
        console.log('Demo user has no connected accounts');
      }

      // Get uploaded CSV data for context - ONLY FOR THIS SPECIFIC USER
      let csvUploads = [];
      try {
        csvUploads = await storage.getDemoUserCsvUploads(uniqueDemoId);
        console.log('Found', csvUploads.length, 'CSV uploads for unique demo user:', uniqueDemoId);
      } catch (error) {
        console.error("Error fetching demo CSV uploads:", error);
      }

      // Prepare comprehensive context for LLM including account details
      let accountContext = '';
      if (hasConnectedAccounts && accountBalances) {
        accountContext = `\n\nConnected Accounts:\n${accountBalances.map(acc => 
          `- ${acc.accountName} (${acc.type}): $${acc.balance.current.toFixed(2)}`
        ).join('\n')}`;
      }

      // Generate AI response with enhanced bank data and CSV context
      const aiResponse = await generateFinancialResponse(
        message, 
        conversationHistory,
        hasConnectedAccounts,
        accountBalances || [],
        recentTransactions || [],
        csvUploads,
        accountContext // Pass detailed account context to LLM
      );
      
      const aiMessage = await storage.addDemoMessage({
        userEmail: uniqueDemoId,
        role: "assistant",
        content: aiResponse,
      });

      res.json({ userMessage, aiMessage });
    } catch (error) {
      console.error("Error adding demo message:", error);
      res.status(500).json({ message: "Failed to add message" });
    }
  });

  // Add demo message directly without AI processing (for intro messages)
  app.post("/api/demo-messages", async (req, res) => {
    try {
      const { userEmail, role, content } = req.body;
      
      if (!userEmail || !role || !content) {
        return res.status(400).json({ message: "User email, role, and content are required" });
      }

      // Use the same ID format as existing demo chat endpoints
      const message = await storage.addDemoMessage({
        userEmail: userEmail, // Use raw email to match existing demo chat format
        role: role as "user" | "assistant",
        content: content,
      });

      res.json({ message });
    } catch (error) {
      console.error("Error adding direct demo message:", error);
      res.status(500).json({ message: "Failed to add message" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
