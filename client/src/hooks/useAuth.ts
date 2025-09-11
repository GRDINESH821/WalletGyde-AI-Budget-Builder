import { useQuery } from "@tanstack/react-query";

export function useAuth() {
  // COMMENTED OUT FOR DEMO (can be restored later)
  // const { data: user, isLoading } = useQuery({
  //   queryKey: ["/api/auth/user"],
  //   retry: false,
  // });

  // Demo mode: Always return no user and not authenticated
  return {
    user: null,
    isLoading: false,
    isAuthenticated: false,
  };
}