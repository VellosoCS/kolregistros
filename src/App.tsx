import { lazy, Suspense } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Index from "./pages/Index.tsx";
const Reports = lazy(() => import("./pages/Reports.tsx"));
const IncidentDetail = lazy(() => import("./pages/IncidentDetail.tsx"));
import NotFound from "./pages/NotFound.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/relatorios" element={<Suspense fallback={<div className="flex items-center justify-center min-h-screen">Carregando...</div>}><Reports /></Suspense>} />
          <Route path="/incidente/:id" element={<Suspense fallback={<div className="flex items-center justify-center min-h-screen">Carregando...</div>}><IncidentDetail /></Suspense>} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
