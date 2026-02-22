import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { LanguageProvider } from "@/lib/i18n";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import ReviewPage from "./pages/ReviewPage";
import AddBusiness from "./pages/AddBusiness";
import WaitlistSignup from "./pages/WaitlistSignup";
import AdminWaitlist from "./pages/AdminWaitlist";
import AdminBusinesses from "./pages/AdminBusinesses";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <LanguageProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/add-business" element={<AddBusiness />} />
                <Route path="/review/:businessSlug" element={<ReviewPage />} />
                <Route path="/signup" element={<WaitlistSignup />} />
                <Route
                  path="/admin/waitlist"
                  element={
                    <ProtectedRoute requireAdmin>
                      <AdminWaitlist />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/businesses"
                  element={
                    <ProtectedRoute requireAdmin>
                      <AdminBusinesses />
                    </ProtectedRoute>
                  }
                />
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </TooltipProvider>
        </LanguageProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;
