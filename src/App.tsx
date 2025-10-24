import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar, MobileBottomNav } from "@/components/AppSidebar";
import { AnalyticsProvider } from "@/contexts/AnalyticsContext";
import Overview from "./pages/Overview";
import Demographics from "./pages/Demographics";
import Behavior from "./pages/Behavior";
import Customers from "./pages/Customers";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AnalyticsProvider>
          <SidebarProvider>
            <div className="flex min-h-screen w-full">
              <AppSidebar />
              <div className="flex-1 flex flex-col">
                <header className="sticky top-0 z-10 flex h-16 items-center gap-2 sm:gap-4 border-b bg-background px-4 sm:px-6">
                  <SidebarTrigger className="hidden md:flex" />
                  <div className="flex-1 min-w-0">
                    <h1 className="text-base sm:text-lg font-semibold truncate">AgriNova</h1>
                  </div>
                </header>
                <main className="flex-1 p-4 sm:p-6 pb-20 md:pb-6">
                  <Routes>
                    <Route path="/" element={<Overview />} />
                    <Route path="/demographics" element={<Demographics />} />
                    <Route path="/behavior" element={<Behavior />} />
                    <Route path="/customers" element={<Customers />} />
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </main>
              </div>
            </div>
            <MobileBottomNav />
          </SidebarProvider>
        </AnalyticsProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
