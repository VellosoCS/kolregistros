import { lazy, Suspense } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import Index from "./pages/Index.tsx";
import Login from "./pages/Login.tsx";
const Reports = lazy(() => import("./pages/Reports.tsx"));
const IncidentDetail = lazy(() => import("./pages/IncidentDetail.tsx"));
const MesAnalise = lazy(() => import("./pages/MesAnalise.tsx"));

import NotFound from "./pages/NotFound.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            
            <Route path="/" element={<ProtectedRoute><Index /></ProtectedRoute>} />
            <Route path="/relatorios" element={<ProtectedRoute><Suspense fallback={<div className="flex items-center justify-center min-h-screen">Carregando...</div>}><Reports /></Suspense></ProtectedRoute>} />
            <Route path="/incidente/:id" element={<ProtectedRoute><Suspense fallback={<div className="flex items-center justify-center min-h-screen">Carregando...</div>}><IncidentDetail /></Suspense></ProtectedRoute>} />
            <Route path="/mes-analise" element={<ProtectedRoute><Suspense fallback={<div className="flex items-center justify-center min-h-screen">Carregando...</div>}><MesAnalise /></Suspense></ProtectedRoute>} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
