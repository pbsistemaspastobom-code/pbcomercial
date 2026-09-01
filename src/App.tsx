import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import Dashboard from "@/pages/Dashboard";
import { AuthProvider, useAuth, Login } from "@/auth";

const queryClient = new QueryClient({
  defaultOptions: { queries: { refetchOnWindowFocus: false, retry: 1, staleTime: 60_000, gcTime: 5 * 60_000 } },
});

function Root() {
  const { user, carregando } = useAuth();
  if (carregando) return null;
  if (!user) return <Login />;
  return <Dashboard />;
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Toaster position="top-right" richColors />
      <AuthProvider>
        <Root />
      </AuthProvider>
    </QueryClientProvider>
  );
}
