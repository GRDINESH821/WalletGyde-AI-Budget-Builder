import { useState, useEffect, useRef, useCallback } from "react";
import { Send, Plus, MessageCircle, Trash2, Menu, X, LogOut, Settings, Upload, FileSpreadsheet, CreditCard, Building, RefreshCw, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import RobotIcon from "@/components/RobotIcon";
import { Separator } from "@/components/ui/separator";
import { Link } from "wouter";
import CsvUpload from "@/components/csv-upload";
import FinancialCharts from "@/components/financial-charts";
import PlaidLink from "@/components/PlaidLink";
import { usePlaidLink } from "react-plaid-link";

interface Message {
  id: string;
  content: string;
  role: "user" | "assistant";
  timestamp: Date;
  csvData?: any;
  chartConfig?: any;
}

interface Conversation {
  id: number;
  title: string;
  createdAt: string;
  updatedAt: string;
}

export default function ChatbotPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [message, setMessage] = useState("");
  const [currentConversationId, setCurrentConversationId] = useState<number | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showCsvUpload, setShowCsvUpload] = useState(false);
  const [showDataSourceSelection, setShowDataSourceSelection] = useState(false);
  const [showPlaidLink, setShowPlaidLink] = useState(false);
  const [linkToken, setLinkToken] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch user's linked accounts
  const { data: linkedAccounts = [] } = useQuery<any[]>({
    queryKey: ["/api/plaid/accounts"],
    refetchOnWindowFocus: false,
  });

  // Fetch transactions
  const { data: plaidTransactions = [] } = useQuery<any[]>({
    queryKey: ["/api/plaid/transactions"],
    enabled: linkedAccounts.length > 0,
    refetchOnWindowFocus: false,
  });

  // Fetch conversations
  const { data: conversations = [] } = useQuery<Conversation[]>({
    queryKey: ["/api/conversations"],
  });

  // Fetch messages for current conversation only when a specific conversation is selected
  const { data: messages = [], refetch: refetchMessages, isLoading: messagesLoading } = useQuery({
    queryKey: [`/api/conversations/${currentConversationId}/messages`],
    enabled: !!currentConversationId,
    staleTime: 0, // Always fetch fresh data to ensure proper isolation
    refetchOnWindowFocus: false,
  });

  // Create new conversation
  const createConversationMutation = useMutation({
    mutationFn: async (title: string) => {
      const response = await apiRequest("POST", "/api/conversations", { title });
      return response.json();
    },
    onSuccess: async (newConversation) => {
      queryClient.invalidateQueries({ queryKey: ["/api/conversations"] });
      setCurrentConversationId(newConversation.id);
      setSidebarOpen(false);
      
      // If this is the welcome conversation, add a welcome message with data source options
      if (newConversation.title === "Welcome to Walletgyde AI") {
        try {
          await apiRequest("POST", `/api/conversations/${newConversation.id}/messages`, {
            content: "Hi!\nI'm here to help with your finances. For the best experience, I recommend connecting your bank accounts for automatic analysis. This way, we can provide insights tailored to your transactions and spending habits.\n🚀 To connect Bank Account and see Budget Builder in action, click the Plaid button to connect demo data:\nHit the \"Connect\" button below.\nSelect Continue as Guest.\nChoose any bank.\nContinue to Login.\nEnter username as custom_[one to twenty] (example: custom_six) and password can be anything.\nSelect the associated accounts and then finish without saving.\nNote: You are using the beta version of the app. This means the app will simulate your regular workflow using dummy data.\nAlternatively, I can help you create a budget manually. Which would you prefer?",
            role: "assistant"
          });
          // Invalidate messages query to show the welcome message
          queryClient.invalidateQueries({ queryKey: [`/api/conversations/${newConversation.id}/messages`] });
          // Show data source buttons for the welcome message
          setShowDataSourceSelection(true);
        } catch (error) {
          console.error("Failed to add welcome message:", error);
        }
      }
    },
  });

  // Delete conversation
  const deleteConversationMutation = useMutation({
    mutationFn: async (conversationId: number) => {
      await apiRequest("DELETE", `/api/conversations/${conversationId}`);
    },
    onSuccess: (_, deletedConversationId) => {
      queryClient.invalidateQueries({ queryKey: ["/api/conversations"] });
      // If we deleted the currently active conversation, clear it
      if (currentConversationId === deletedConversationId) {
        setCurrentConversationId(null);
      }
    },
  });

  // Send message
  const sendMessageMutation = useMutation({
    mutationFn: async (messageData: { content: string; conversationId: number }) => {
      const response = await apiRequest("POST", `/api/conversations/${messageData.conversationId}/messages`, {
        content: messageData.content,
        role: "user",
      });
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ 
        queryKey: [`/api/conversations/${currentConversationId}/messages`] 
      });
      queryClient.invalidateQueries({ 
        queryKey: ["/api/conversations"] 
      });
      setMessage("");
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSendMessage = async () => {
    if (!message.trim()) return;

    let conversationId = currentConversationId;

    // Create new conversation if none exists or if current one doesn't exist in our list
    if (!conversationId || !conversations.find(c => c.id === conversationId)) {
      const newConversation = await createConversationMutation.mutateAsync(
        message.slice(0, 50) + (message.length > 50 ? "..." : "")
      );
      conversationId = newConversation.id;
    }

    if (conversationId) {
      sendMessageMutation.mutate({
        content: message,
        conversationId,
      });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Create default welcome conversation on first visit
  useEffect(() => {
    if (conversations.length === 0 && user) {
      // Create a default welcome conversation
      createConversationMutation.mutate("Welcome to Walletgyde AI");
    }
  }, [conversations.length, user]);

  // Auto-select conversation only when explicitly created, not automatically
  useEffect(() => {
    // Only auto-select if we just created a conversation or if there's no current conversation but conversations exist
    if (conversations.length > 0 && currentConversationId === null) {
      // Don't auto-select, let user choose manually
    }
  }, [conversations, currentConversationId]);

  // Add message to conversation
  const addMessageMutation = useMutation({
    mutationFn: async (messageData: { content: string; role: "user" | "assistant"; csvData?: any; chartConfig?: any; showDataSourceButtons?: boolean }) => {
      const response = await apiRequest("POST", `/api/conversations/${currentConversationId}/messages`, {
        content: messageData.content,
        role: messageData.role,
        csvData: messageData.csvData,
        chartConfig: messageData.chartConfig,
      });
      return response.json();
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: [`/api/conversations/${currentConversationId}/messages`] 
      });
      // If this message should show data source buttons, store that info temporarily
      if (variables.showDataSourceButtons) {
        setShowDataSourceSelection(true);
      }
    },
  });

  // Show data source selection when user wants financial analysis
  const triggerFinancialAnalysisMutation = useMutation({
    mutationFn: async () => {
      // Just show the data source buttons under the existing welcome message
      setShowDataSourceSelection(true);
    },
  });

  // Analyze Plaid transactions after connecting account
  const analyzePlaidTransactionsMutation = useMutation({
    mutationFn: async () => {
      // If no transactions, try to sync them first
      if (plaidTransactions.length === 0) {
        const syncResponse = await apiRequest("POST", "/api/plaid/sync-transactions", {});
        const syncResult = await syncResponse.json();
        
        // Refresh transactions after sync
        await queryClient.invalidateQueries({ queryKey: ["/api/plaid/transactions"] });
        
        // Wait a moment for the query to refresh
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Get fresh transaction data
        const freshTransactionsResponse = await apiRequest("GET", "/api/plaid/transactions", {});
        const freshTransactions = await freshTransactionsResponse.json();
        
        if (freshTransactions.length === 0) {
          throw new Error("No transactions found after sync. This might be a new account or no recent transactions are available. Try connecting an account with recent activity.");
        }
        
        // Use fresh transactions for analysis
        const response = await apiRequest("POST", "/api/analyze-finances", {
          financialData: freshTransactions,
        });
        return { ...await response.json(), transactions: freshTransactions };
      }

      const response = await apiRequest("POST", "/api/analyze-finances", {
        financialData: plaidTransactions,
      });
      return { ...await response.json(), transactions: plaidTransactions };
    },
    onSuccess: (data) => {
      // Create a new conversation message with the analysis
      if (currentConversationId) {
        addMessageMutation.mutate({
          content: `Here's your financial analysis based on your connected bank accounts:\n\n${data.analysis}`,
          role: "assistant",
          csvData: data.transactions,
          chartConfig: data.chartConfig,
        });
        setShowDataSourceSelection(false);
      }
    },
    onError: (error: any) => {
      toast({
        title: "Analysis Failed", 
        description: error.message || "Failed to analyze transactions",
        variant: "destructive",
      });
    },
  });

  // Create Plaid link token mutation
  const createPlaidLinkTokenMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/plaid/create-link-token", {});
      const data = await response.json();
      return data;
    },
    onSuccess: (data) => {
      setLinkToken(data.linkToken);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to initialize bank connection. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Exchange token mutation
  const exchangeTokenMutation = useMutation({
    mutationFn: async (publicToken: string) => {
      const response = await apiRequest("POST", "/api/plaid/exchange-token", {
        publicToken,
      });
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Success",
        description: `Bank account linked successfully! ${data.accounts} account(s) connected.`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/plaid/accounts"] });
      setLinkToken(null);
      // Automatically start analysis after connection
      setTimeout(() => {
        analyzePlaidTransactionsMutation.mutate();
      }, 1000);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to link bank account. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Plaid link callbacks
  const onPlaidSuccess = useCallback(
    (public_token: string) => {
      exchangeTokenMutation.mutate(public_token);
    },
    [exchangeTokenMutation]
  );

  const onPlaidExit = useCallback(() => {
    setLinkToken(null);
  }, []);

  const { open, ready } = usePlaidLink({
    token: linkToken,
    onSuccess: onPlaidSuccess,
    onExit: onPlaidExit,
  });

  // Effect to automatically open Plaid link when token is ready
  useEffect(() => {
    if (linkToken && ready) {
      open();
    }
  }, [linkToken, ready, open]);

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-20 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      
      {/* Sidebar */}
      <AnimatePresence>
        {(sidebarOpen || window.innerWidth >= 768) && (
          <motion.div
            initial={{ x: -300 }}
            animate={{ x: 0 }}
            exit={{ x: -300 }}
            transition={{ duration: 0.3 }}
            className="fixed md:relative z-30 w-80 bg-white border-r shadow-lg md:shadow-none h-full flex flex-col"
          >
            {/* Sidebar Header */}
            <div className="p-4 border-b">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center">
                    <RobotIcon className="w-8 h-8" useCustomIcon={true} customIconPath="/logos/BudgetBuilder_square.png" />
                  </div>
                  <h2 className="text-lg font-semibold text-gray-900">Walletgyde AI</h2>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="md:hidden"
                  onClick={() => setSidebarOpen(false)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* New Chat Button */}
            <div className="p-4">
              <Button
                onClick={() => createConversationMutation.mutate("New conversation")}
                className="w-full bg-[hsl(221,83%,53%)] hover:bg-[hsl(221,83%,45%)]"
                disabled={createConversationMutation.isPending}
              >
                <Plus className="w-4 h-4 mr-2" />
                New Chat
              </Button>
            </div>

            {/* Conversations List */}
            <div className="flex-1 overflow-y-auto px-4 pb-4">
              <div className="space-y-2">
                {conversations.map((conversation: Conversation) => (
                  <div
                    key={conversation.id}
                    className={`group flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors ${
                      currentConversationId === conversation.id
                        ? "bg-[hsl(221,83%,53%)]/10 border border-[hsl(221,83%,53%)]/20"
                        : "hover:bg-gray-100"
                    }`}
                    onClick={() => {
                      // Clear current conversation to ensure proper isolation between chats
                      if (currentConversationId !== conversation.id) {
                        setCurrentConversationId(conversation.id);
                        // Force refetch of messages for the new conversation
                        queryClient.invalidateQueries({ 
                          queryKey: [`/api/conversations/${conversation.id}/messages`] 
                        });
                      }
                      setSidebarOpen(false);
                    }}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {conversation.title}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(conversation.updatedAt).toLocaleDateString()}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="opacity-0 group-hover:opacity-100 h-8 w-8 p-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteConversationMutation.mutate(conversation.id);
                      }}
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            {/* User Info */}
            <div className="p-4 border-t bg-gray-50">
              <Link href="/settings">
                <div className="flex items-center space-x-3 mb-3 p-2 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors">
                  <Avatar className="w-8 h-8">
                    <AvatarImage 
                      src={(user as any)?.avatarUrl || (user as any)?.profileImageUrl} 
                      alt="User avatar"
                    />
                    <AvatarFallback className="bg-[hsl(221,83%,53%)] text-white">
                      {(user as any)?.firstName?.[0]?.toUpperCase() || (user as any)?.email?.[0]?.toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {(user as any)?.firstName && (user as any)?.lastName 
                        ? `${(user as any).firstName} ${(user as any).lastName}`
                        : (user as any)?.firstName || (user as any)?.email?.split('@')[0] || 'User'}
                    </p>
                    <p className="text-xs text-gray-500">Click to view settings</p>
                  </div>
                  <Settings className="w-4 h-4 text-gray-400" />
                </div>
              </Link>
              <Button
                variant="outline"
                size="sm"
                className="w-full text-gray-600 hover:text-red-600 hover:border-red-300"
                onClick={() => window.location.href = "/api/logout"}
              >
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <div className="bg-white border-b px-4 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-3 min-w-0">
            <Button
              variant="ghost"
              size="sm"
              className="md:hidden flex-shrink-0"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="w-5 h-5" />
            </Button>
            <Link href="/landing" className="flex items-center space-x-3 cursor-pointer min-w-0">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0">
                <RobotIcon className="w-8 h-8" useCustomIcon={true} customIconPath="/logos/BudgetBuilder_square.png" />
              </div>
              <div className="min-w-0">
                <h1 className="text-lg font-semibold text-gray-900 hover:text-[hsl(221,83%,53%)] transition-colors truncate">Walletgyde AI</h1>
                <p className="text-sm text-gray-500 hidden sm:block">Your personal financial advisor</p>
              </div>
            </Link>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {!currentConversationId && (
            <div className="text-center py-12">
              <div className="w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <RobotIcon className="w-16 h-16" useCustomIcon={true} customIconPath="/logos/BudgetBuilder_square.png" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Welcome to Walletgyde AI!
              </h3>
              <p className="text-gray-600 mb-4">
                Start a conversation to get personalized financial coaching.
              </p>
              <Button
                onClick={() => createConversationMutation.mutate("New conversation")}
                className="bg-[hsl(221,83%,53%)] hover:bg-[hsl(221,83%,45%)]"
              >
                Start New Chat
              </Button>
            </div>
          )}

          {messagesLoading && currentConversationId && (
            <div className="text-center py-8">
              <div className="w-6 h-6 border-2 border-[hsl(221,83%,53%)] border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-gray-500 mt-2">Loading messages...</p>
            </div>
          )}

          {Array.isArray(messages) && messages.length > 0 ? (
            messages.map((msg: any, index: number) => {
              const isFirstMessage = index === 0;
              const shouldShowDataSourceButtons = showDataSourceSelection && msg.role === "assistant" && isFirstMessage;
              
              return (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${
                    msg.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-[85vw] sm:max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                      msg.role === "user"
                        ? "bg-[hsl(221,83%,53%)] text-white"
                        : "bg-white border shadow-sm"
                    }`}
                  >
                    {msg.role === "assistant" && (
                      <div className="flex items-center space-x-2 mb-2">
                        <div className="w-6 h-6 rounded flex items-center justify-center">
                          <RobotIcon className="w-6 h-6" useCustomIcon={true} customIconPath="/logos/BudgetBuilder_square.png" />
                        </div>
                        <span className="text-xs font-medium text-gray-500">
                          Walletgyde AI
                        </span>
                      </div>
                    )}
                    <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                    
                    {/* Display financial charts if available */}
                    {msg.chartConfig && (
                      <div className="mt-3">
                        <FinancialCharts chartConfig={msg.chartConfig} />
                      </div>
                    )}
                    
                    {/* Show data source buttons inline with the last assistant message */}
                    {shouldShowDataSourceButtons && (
                      <div className="mt-3 space-y-2">
                        <Button
                          onClick={() => {
                            if (linkedAccounts.length > 0) {
                              // If accounts are already connected, sync and analyze
                              setShowDataSourceSelection(false);
                              analyzePlaidTransactionsMutation.mutate();
                            } else {
                              // If no accounts, directly trigger Plaid connection
                              setShowDataSourceSelection(false);
                              // Trigger the Plaid link creation and open the popup directly
                              createPlaidLinkTokenMutation.mutate();
                            }
                          }}
                          className="w-full bg-green-600 hover:bg-green-700 text-white py-2 text-sm font-medium"
                          disabled={analyzePlaidTransactionsMutation.isPending || createPlaidLinkTokenMutation.isPending}
                          size="sm"
                        >
                          {analyzePlaidTransactionsMutation.isPending ? (
                            <div className="flex items-center justify-center">
                              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                              Syncing...
                            </div>
                          ) : (
                            <div className="flex items-center justify-center">
                              <RefreshCw className="w-4 h-4 mr-2" />
                              Sync now
                            </div>
                          )}
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => {
                            setShowCsvUpload(true);
                            setShowDataSourceSelection(false);
                          }}
                          className="w-full border-red-400 text-red-600 hover:bg-red-50 py-2 text-sm font-medium"
                          size="sm"
                        >
                          <div className="flex items-center justify-center">
                            <AlertCircle className="w-4 h-4 mr-2" />
                            I'll enter details manually
                          </div>
                        </Button>
                      </div>
                    )}
                    
                    <p className={`text-xs mt-1 ${
                      msg.role === "user" ? "text-blue-100" : "text-gray-400"
                    }`}>
                      {new Date(msg.createdAt).toLocaleTimeString()}
                    </p>
                  </div>
                </motion.div>
              );
            })
          ) : (
            currentConversationId && (
              <div className="text-center py-8">
                <div className="text-gray-500">No messages yet. Start the conversation!</div>
              </div>
            )
          )}
          <div ref={messagesEndRef} />
        </div>



        {/* Plaid Connection Section */}
        {showPlaidLink && currentConversationId && (
          <div className="bg-gray-50 border-t p-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-medium text-gray-700">Connect Your Bank Account</h4>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowPlaidLink(false)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            <div className="max-h-96 overflow-y-auto">
              <PlaidLink onSuccess={() => {}} />
            </div>
          </div>
        )}

        {/* CSV Upload Section */}
        {showCsvUpload && currentConversationId && (
          <div className="bg-gray-50 border-t p-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-medium text-gray-700">Upload Financial Data</h4>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowCsvUpload(false)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            <CsvUpload
              conversationId={currentConversationId}
              onUploadSuccess={() => {
                refetchMessages();
                setShowCsvUpload(false);
              }}
            />
          </div>
        )}

        {/* Message Input */}
        <div className="bg-white border-t p-3 sm:p-4 safe-area-inset-bottom">
          <form onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }} className="flex space-x-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowCsvUpload(!showCsvUpload)}
              disabled={!currentConversationId}
              className="border-[hsl(221,83%,53%)] text-[hsl(221,83%,53%)] hover:bg-[hsl(221,83%,53%)] hover:text-white flex-shrink-0"
              title="Upload CSV data"
            >
              <FileSpreadsheet className="w-4 h-4" />
            </Button>
            <Button
              type="button"
              variant="outline" 
              size="sm"
              onClick={() => {
                // Always start Plaid Link flow, same as settings page
                createPlaidLinkTokenMutation.mutate();
              }}
              disabled={!currentConversationId || createPlaidLinkTokenMutation.isPending}
              className="border-blue-500 text-blue-600 hover:bg-blue-500 hover:text-white flex-shrink-0"
              title="Connect bank account"
            >
              {createPlaidLinkTokenMutation.isPending ? (
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
              ) : (
                <Building className="w-4 h-4 mr-2" />
              )}
              <span className="hidden sm:inline">Connect Account</span>
            </Button>
            <Button
              type="button"
              variant="outline" 
              size="sm"
              onClick={() => {
                // Always show data source selection for user choice
                triggerFinancialAnalysisMutation.mutate();
              }}
              disabled={!currentConversationId || analyzePlaidTransactionsMutation.isPending || triggerFinancialAnalysisMutation.isPending}
              className="border-green-500 text-green-600 hover:bg-green-500 hover:text-white flex-shrink-0"
              title="Get financial analysis"
            >
              {(analyzePlaidTransactionsMutation.isPending || triggerFinancialAnalysisMutation.isPending) ? (
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
              ) : (
                <CreditCard className="w-4 h-4" />
              )}
            </Button>
            <Input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask me anything about your finances..."
              className="flex-1 min-w-0"
              disabled={sendMessageMutation.isPending}
              autoComplete="off"
            />
            <Button
              type="submit"
              disabled={!message.trim() || sendMessageMutation.isPending}
              className="bg-[hsl(221,83%,53%)] hover:bg-[hsl(221,83%,45%)] flex-shrink-0"
            >
              {sendMessageMutation.isPending ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}