
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider, RequireAuth } from "./contexts/AuthContext";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import TransactionsPage from "./pages/TransactionsPage";
import CommitmentsPage from "./pages/CommitmentsPage";
import ReferralsPage from "./pages/ReferralsPage";
import SettingsPage from "./pages/SettingsPage";
import AuthPage from "./pages/AuthPage";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/auth" element={<AuthPage />} />
            <Route 
              path="/" 
              element={
                <RequireAuth>
                  <Index />
                </RequireAuth>
              } 
            />
            <Route 
              path="/transactions" 
              element={
                <RequireAuth>
                  <TransactionsPage />
                </RequireAuth>
              } 
            />
            <Route 
              path="/commitments" 
              element={
                <RequireAuth>
                  <CommitmentsPage />
                </RequireAuth>
              } 
            />
            <Route 
              path="/referrals" 
              element={
                <RequireAuth>
                  <ReferralsPage />
                </RequireAuth>
              } 
            />
            <Route 
              path="/settings" 
              element={
                <RequireAuth>
                  <SettingsPage />
                </RequireAuth>
              } 
            />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
