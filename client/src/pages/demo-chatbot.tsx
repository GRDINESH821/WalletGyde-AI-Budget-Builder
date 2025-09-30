import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Bot, User, ArrowLeft, Upload, CreditCard, FileSpreadsheet } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import { usePlaidLink } from "react-plaid-link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import EmailPopup from "@/components/EmailPopup";

interface DemoMessage {
  id: number;
  userEmail: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
}

export default function DemoChatbotPage() {
  const [messages, setMessages] = useState<DemoMessage[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  const [showEmailPopup, setShowEmailPopup] = useState(false);
  const [showUploadOptions, setShowUploadOptions] = useState(false);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [isUploadingCsv, setIsUploadingCsv] = useState(false);
  const [linkToken, setLinkToken] = useState<string | null>(null);
  const [remainingQuestions, setRemainingQuestions] = useState<number>(20);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const csvInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get user email from sessionStorage and initialize
  useEffect(() => {
    const email = sessionStorage.getItem('demoUserEmail');
    if (!email) {
      // Prompt for email if missing
      setShowEmailPopup(true);
      return;
    }
    
    setUserEmail(email);
    
    // Load existing messages without clearing (persistent demo sessions)
    loadMessages(email);
    
    // Check if this is a first-time user (no messages) and add welcome message
    fetch(`/api/demo-chat/${encodeURIComponent(email)}`)
      .then(res => res.json())
      .then(data => {
        if (data.messages.length === 0) {
          // Add welcome message for new demo users only
          return fetch('/api/demo-messages', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              userEmail: email,
              role: 'assistant',
              content: 'Hi!\nI\'m here to help with your finances. For the best experience, I recommend connecting your bank accounts for automatic analysis. This way, we can provide insights tailored to your transactions and spending habits.\n🚀 To connect Bank Account and see Budget Builder in action, click the Plaid button to connect demo data:\nHit the "Connect" button below.\nSelect Continue as Guest.\nChoose any bank.\nContinue to Login.\nEnter username as custom_[one to twenty] (example: custom_six) and password can be anything.\nSelect the associated accounts and then finish without saving.\nNote: You are using the beta version of the app. This means the app will simulate your regular workflow using dummy data.\nAlternatively, I can help you create a budget manually. Which would you prefer?'
            }),
          }).then(() => loadMessages(email));
        }
      })
      .catch(error => {
        console.error('Error checking demo chat history:', error);
        toast({
          title: "Error",
          description: "Failed to load demo chat",
          variant: "destructive",
        });
      });
  }, []);

  const handleEmailSubmit = (email: string) => {
    sessionStorage.setItem('demoUserEmail', email);
    setUserEmail(email);
    setShowEmailPopup(false);
    // Initialize conversation state for new user
    loadMessages(email);
  };

  const handleCloseEmailPopup = () => {
    setShowEmailPopup(false);
    // If user cancels without providing email, navigate back to landing
    if (!userEmail) {
      window.location.href = "/";
    }
  };

  // Get linked accounts for this demo user
  const { data: linkedAccounts = [] } = useQuery<any[]>({
    queryKey: ["/api/demo-plaid/accounts", userEmail],
    queryFn: async () => {
      if (!userEmail) return [];
      const response = await fetch(`/api/demo-plaid/accounts/${encodeURIComponent(userEmail)}`);
      if (!response.ok) throw new Error('Failed to fetch accounts');
      return response.json();
    },
    enabled: !!userEmail,
    refetchOnWindowFocus: false,
  });

  // Plaid Link setup
  const createLinkTokenMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/demo-plaid/create-link-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userEmail }),
      });
      if (!response.ok) throw new Error('Failed to create link token');
      return response.json();
    },
    onSuccess: (data) => {
      setLinkToken(data.linkToken);
    },
  });

  const exchangeTokenMutation = useMutation({
    mutationFn: async (publicToken: string) => {
      const response = await fetch('/api/demo-plaid/exchange-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userEmail, publicToken }),
      });
      if (!response.ok) throw new Error('Failed to exchange token');
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Success",
        description: `Bank account connected! ${data.accounts} account(s) linked.`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/demo-plaid/accounts", userEmail] });
      setLinkToken(null);
    },
  });

  const { open, ready } = usePlaidLink({
    token: linkToken,
    onSuccess: (publicToken) => {
      exchangeTokenMutation.mutate(publicToken);
    },
    onExit: () => setLinkToken(null),
  });

  // Load messages from API
  const loadMessages = async (email: string) => {
    try {
      const response = await fetch(`/api/demo-chat/${encodeURIComponent(email)}`);
      if (!response.ok) throw new Error('Failed to fetch messages');
      
      const data = await response.json();
      setMessages(data.messages);
      setRemainingQuestions(data.remainingQuestions ?? 20);
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!inputMessage.trim() || isLoading) return;
    
    setIsLoading(true);
    const message = inputMessage.trim();
    setInputMessage("");
    
    try {
      const response = await fetch('/api/demo-chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userEmail,
          message,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        if (errorData.isRateLimited) {
          toast({
            title: "Demo Limit Reached",
            description: errorData.message,
            variant: "destructive",
          });
          return;
        }
        throw new Error('Failed to send message');
      }
      
      // Reload messages to get the latest conversation
      await loadMessages(userEmail);
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCsvFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.name.toLowerCase().endsWith('.csv')) {
        toast({
          title: "Invalid file type",
          description: "Please upload a CSV file.",
          variant: "destructive",
        });
        return;
      }
      setCsvFile(file);
      handleCsvUpload(file);
    }
  };

  const handleCsvUpload = async (file: File) => {
    setIsUploadingCsv(true);
    
    try {
      const formData = new FormData();
      formData.append('csv', file);
      formData.append('userEmail', userEmail);

      const response = await fetch('/api/demo-upload-csv', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error('Failed to upload CSV');

      const result = await response.json();
      
      toast({
        title: "CSV uploaded successfully",
        description: `Analyzed ${file.name} and generated insights.`,
      });

      // Reload messages to show the analysis
      await loadMessages(userEmail);
      setShowUploadOptions(false);
    } catch (error) {
      console.error('CSV upload error:', error);
      toast({
        title: "Upload failed",
        description: "Failed to upload CSV file. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploadingCsv(false);
      setCsvFile(null);
    }
  };

  const handleConnectBank = () => {
    if (linkToken && ready) {
      open();
    } else {
      createLinkTokenMutation.mutate();
    }
  };

  const handleAnalyzeTransactions = async () => {
    if (linkedAccounts.length === 0) {
      toast({
        title: "No bank accounts connected",
        description: "Please connect a bank account first.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      // Send a message asking for transaction analysis
      const response = await fetch('/api/demo-chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userEmail,
          message: 'Please analyze my recent bank transactions and provide financial insights.',
        }),
      });
      
      if (!response.ok) throw new Error('Failed to analyze transactions');
      
      // Reload messages to show the analysis
      await loadMessages(userEmail);
      
      toast({
        title: "Analysis complete",
        description: "Your transaction analysis is ready!",
      });
    } catch (error) {
      console.error('Error analyzing transactions:', error);
      toast({
        title: "Analysis failed",
        description: "Failed to analyze transactions. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <EmailPopup 
        isOpen={showEmailPopup}
        onClose={handleCloseEmailPopup}
        onEmailSubmit={handleEmailSubmit}
      />
      {/* Header */}
      <div className="bg-white border-b px-4 py-3 flex items-center gap-3">
        <Link href="/">
          <Button
            variant="ghost"
            size="sm"
            className="text-gray-600 hover:text-gray-800"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Button>
        </Link>
        <div className="flex items-center gap-2 flex-1">
          <div className="w-8 h-8 bg-[hsl(221,83%,53%)] rounded-full flex items-center justify-center">
            <Bot className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-semibold text-gray-900">Budget Builder Agent</h1>
            <p className="text-xs text-gray-500">Demo Mode • {userEmail}</p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 mt-8">
            <Bot className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <p>Welcome to Budget Builder Agent!</p>
            <p className="text-sm mt-2">Ask me anything about budgeting, saving, or financial planning.</p>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`flex gap-3 ${
                message.role === "user" ? "flex-row-reverse" : "flex-row"
              }`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                  message.role === "user"
                    ? "bg-blue-500"
                    : "bg-[hsl(221,83%,53%)]"
                }`}
              >
                {message.role === "user" ? (
                  <User className="w-4 h-4 text-white" />
                ) : (
                  <Bot className="w-4 h-4 text-white" />
                )}
              </div>
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                  message.role === "user"
                    ? "bg-blue-500 text-white"
                    : "bg-white border text-gray-900"
                }`}
              >
                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
              </div>
            </div>
          ))
        )}
        
        {isLoading && (
          <div className="flex gap-3">
            <div className="w-8 h-8 bg-[hsl(221,83%,53%)] rounded-full flex items-center justify-center">
              <Bot className="w-4 h-4 text-white" />
            </div>
            <div className="bg-white border rounded-2xl px-4 py-2">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Action Buttons */}
      <div className="border-t bg-gray-50 p-3">
        <div className="flex gap-2 flex-wrap mb-3">
          <Button
            onClick={() => setShowUploadOptions(!showUploadOptions)}
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
          >
            <Upload className="w-4 h-4" />
            Upload Data
          </Button>
          
          <Button
            onClick={handleConnectBank}
            variant="outline"
            size="sm"
            disabled={createLinkTokenMutation.isPending || exchangeTokenMutation.isPending}
            className="flex items-center gap-2"
          >
            <CreditCard className="w-4 h-4" />
            {linkedAccounts.length > 0 ? 'Connect Another Bank' : 'Connect Bank Account'}
          </Button>
          
          {linkedAccounts.length > 0 && (
            <Button
              onClick={handleAnalyzeTransactions}
              variant="outline"
              size="sm"
              disabled={isLoading}
              className="flex items-center gap-2"
            >
              <Bot className="w-4 h-4" />
              Analyze Transactions
            </Button>
          )}
        </div>

        {/* Upload Options */}
        {showUploadOptions && (
          <div className="mb-3 p-3 bg-white rounded-lg border">
            <div className="text-sm font-medium mb-2">Upload Financial Data</div>
            <div className="flex gap-2">
              <Button
                onClick={() => csvInputRef.current?.click()}
                variant="ghost"
                size="sm"
                disabled={isUploadingCsv}
                className="flex items-center gap-2"
              >
                <FileSpreadsheet className="w-4 h-4" />
                {isUploadingCsv ? 'Uploading...' : 'Upload CSV'}
              </Button>
              <input
                ref={csvInputRef}
                type="file"
                accept=".csv"
                onChange={handleCsvFileSelect}
                className="hidden"
              />
            </div>
            <div className="text-xs text-gray-500 mt-1">
              Upload bank statements, credit card statements, or transaction exports
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="border-t bg-white p-4">
        <form onSubmit={handleSendMessage} className="flex gap-2">
          <Input
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder="Ask me about budgeting, saving, or financial planning..."
            className="flex-1"
            disabled={isLoading}
          />
          <Button 
            type="submit" 
            disabled={!inputMessage.trim() || isLoading}
            className="bg-[hsl(221,83%,53%)] hover:bg-[hsl(221,83%,45%)]"
          >
            <Send className="w-4 h-4" />
          </Button>
        </form>
        <div className="text-xs text-center text-gray-500 mt-2">
          For educational use only. Not financial advice.
        </div>
        <div className="text-xs text-center text-blue-600 mt-1 font-medium">
          Demo: {remainingQuestions} questions remaining
        </div>
      </div>
    </div>
  );
}