import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { LanguageProvider } from "@/lib/i18n";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { useEffect } from "react";
import { shouldRunMigration, migrateDataToSupabase } from "@/lib/migration";
import { toast } from "sonner";
import Index from "./pages/Index";
import ReviewPage from "./pages/ReviewPage";
import AddBusiness from "./pages/AddBusiness";
import WaitlistSignup from "./pages/WaitlistSignup";
import AdminWaitlist from "./pages/AdminWaitlist";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => {
  // Run migration from IndexedDB to Supabase on first load
  useEffect(() => {
    const runMigration = async () => {
      const shouldMigrate = await shouldRunMigration();
      if (shouldMigrate) {
        console.log('Starting data migration...');
        const result = await migrateDataToSupabase();

        if (result.success) {
          toast.success(`Migration complete! ${result.migratedCount} businesses migrated.`);
        } else if (result.errors.length > 0) {
          console.error('Migration errors:', result.errors);
          toast.warning(`Migration completed with ${result.errors.length} errors. Check console.`);
        }
      }
    };

    runMigration();
  }, []);

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
