import { useState, useCallback } from "react";
import { usePlaidLink } from "react-plaid-link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Loader2, CreditCard, Building, Trash2, RefreshCw, Plus } from "lucide-react";

interface PlaidAccount {
  id: number;
  accountId: string;
  accountName: string;
  institutionName: string;
  accountType: string;
  accountSubtype?: string;
  mask?: string;
  isActive: boolean;
}

interface AccountBalance {
  accountId: string;
  accountName: string;
  institutionName: string;
  type: string;
  subtype?: string;
  mask?: string;
  balance: {
    available?: number;
    current?: number;
    iso_currency_code?: string;
  };
}

interface PlaidLinkProps {
  onSuccess?: () => void;
}

export default function PlaidLink({ onSuccess: onSuccessCallback }: PlaidLinkProps = {}) {
  const [linkToken, setLinkToken] = useState<string | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get linked accounts
  const { data: accounts = [], isLoading: accountsLoading } = useQuery({
    queryKey: ["/api/plaid/accounts"],
    refetchOnWindowFocus: false,
  });

  // Get account balances
  const { data: balances = [], isLoading: balancesLoading } = useQuery({
    queryKey: ["/api/plaid/balances"],
    refetchOnWindowFocus: false,
    enabled: accounts.length > 0,
  });

  // Create link token mutation
  const createLinkTokenMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/plaid/create-link-token", {});
      return response.json();
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
      queryClient.invalidateQueries({ queryKey: ["/api/plaid/balances"] });
      setLinkToken(null);
      // Call the callback if provided
      if (onSuccessCallback) {
        onSuccessCallback();
      }
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to link bank account. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Sync transactions mutation
  const syncTransactionsMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/plaid/sync-transactions", {});
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Success",
        description: `Synced ${data.newTransactions} new transactions.`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/plaid/transactions"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to sync transactions. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Remove account mutation
  const removeAccountMutation = useMutation({
    mutationFn: async (accountId: string) => {
      const response = await apiRequest("DELETE", `/api/plaid/accounts/${accountId}`, {});
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Bank account disconnected successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/plaid/accounts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/plaid/balances"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to disconnect account. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSuccess = useCallback(
    (public_token: string) => {
      exchangeTokenMutation.mutate(public_token);
    },
    [exchangeTokenMutation]
  );

  const onExit = useCallback(() => {
    setLinkToken(null);
  }, []);

  const { open, ready } = usePlaidLink({
    token: linkToken,
    onSuccess,
    onExit,
  });

  const handleConnectBank = () => {
    if (linkToken && ready) {
      open();
    } else {
      createLinkTokenMutation.mutate();
    }
  };

  const formatCurrency = (amount?: number, currency?: string) => {
    if (amount === undefined || amount === null) return "N/A";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency || "USD",
    }).format(amount);
  };

  const getAccountTypeColor = (type: string) => {
    switch (type.toLowerCase()) {
      case "checking":
        return "bg-blue-100 text-blue-800";
      case "savings":
        return "bg-green-100 text-green-800";
      case "credit":
        return "bg-purple-100 text-purple-800";
      case "investment":
        return "bg-orange-100 text-orange-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (accountsLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-6 h-6 animate-spin" />
        <span className="ml-2">Loading bank accounts...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Building className="w-5 h-5" />
            <span>Connected Bank Accounts</span>
          </CardTitle>
          <CardDescription>
            Connect your bank accounts to automatically track your spending and get personalized financial insights.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {accounts.length === 0 ? (
            <Alert>
              <AlertDescription>
                No bank accounts connected yet. Connect your first account to start tracking your finances automatically.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-3">
              {accounts.map((account: PlaidAccount) => {
                const balance = balances.find((b: AccountBalance) => b.accountId === account.accountId);
                
                return (
                  <div
                    key={account.accountId}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                  >
                    <div className="flex items-center space-x-3">
                      <CreditCard className="w-5 h-5 text-gray-500" />
                      <div>
                        <h4 className="font-medium">{account.accountName}</h4>
                        <p className="text-sm text-gray-500">
                          {account.institutionName}
                          {account.mask && ` ••••${account.mask}`}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Badge className={getAccountTypeColor(account.accountType)}>
                        {account.accountType}
                      </Badge>
                      {balance && (
                        <div className="text-right">
                          <p className="font-medium">
                            {formatCurrency(balance.balance.current, balance.balance.iso_currency_code)}
                          </p>
                          {balance.balance.available !== undefined && balance.balance.available !== balance.balance.current && (
                            <p className="text-sm text-gray-500">
                              Available: {formatCurrency(balance.balance.available, balance.balance.iso_currency_code)}
                            </p>
                          )}
                        </div>
                      )}
                      {balancesLoading && (
                        <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeAccountMutation.mutate(account.accountId)}
                        disabled={removeAccountMutation.isPending}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div className="flex space-x-3 pt-4 border-t">
            <Button
              onClick={handleConnectBank}
              disabled={createLinkTokenMutation.isPending || exchangeTokenMutation.isPending}
              className="flex items-center space-x-2"
            >
              {createLinkTokenMutation.isPending || exchangeTokenMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Plus className="w-4 h-4" />
              )}
              <span>Connect Bank Account</span>
            </Button>

            {accounts.length > 0 && (
              <Button
                variant="outline"
                onClick={() => syncTransactionsMutation.mutate()}
                disabled={syncTransactionsMutation.isPending}
                className="flex items-center space-x-2"
              >
                {syncTransactionsMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <RefreshCw className="w-4 h-4" />
                )}
                <span>Sync Transactions</span>
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}