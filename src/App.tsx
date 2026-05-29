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
import SignUp from "./pages/SignUp.tsx";
const Reports = lazy(() => import("./pages/Reports.tsx"));
const IncidentDetail = lazy(() => import("./pages/IncidentDetail.tsx"));
const MesAnalise = lazy(() => import("./pages/MesAnalise.tsx"));
const Aprovacoes = lazy(() => import("./pages/Aprovacoes.tsx"));
const Caixa = lazy(() => import("./pages/Caixa.tsx"));
const Usuarios = lazy(() => import("./pages/Usuarios.tsx"));
const AcompanhamentoSuporte = lazy(() => import("./pages/AcompanhamentoSuporte.tsx"));


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
            <Route path="/cadastro" element={<SignUp />} />
            
            <Route path="/" element={<ProtectedRoute><Index /></ProtectedRoute>} />
            <Route path="/relatorios" element={<ProtectedRoute allowedRoles={["coordenacao","suporte","suporte_aluno"]}><Suspense fallback={<div className="flex items-center justify-center min-h-screen">Carregando...</div>}><Reports /></Suspense></ProtectedRoute>} />
            <Route path="/incidente/:id" element={<ProtectedRoute><Suspense fallback={<div className="flex items-center justify-center min-h-screen">Carregando...</div>}><IncidentDetail /></Suspense></ProtectedRoute>} />
            <Route path="/mes-analise" element={<ProtectedRoute allowedRoles={["coordenacao"]}><Suspense fallback={<div className="flex items-center justify-center min-h-screen">Carregando...</div>}><MesAnalise /></Suspense></ProtectedRoute>} />
            <Route path="/aprovacoes" element={<ProtectedRoute allowedRoles={["coordenacao"]}><Suspense fallback={<div className="flex items-center justify-center min-h-screen">Carregando...</div>}><Aprovacoes /></Suspense></ProtectedRoute>} />
            <Route path="/caixa-de-entrada" element={<ProtectedRoute allowedRoles={["coordenacao","suporte","suporte_aluno"]}><Suspense fallback={<div className="flex items-center justify-center min-h-screen">Carregando...</div>}><Caixa /></Suspense></ProtectedRoute>} />

            <Route path="/usuarios" element={<ProtectedRoute allowedRoles={["coordenacao"]}><Suspense fallback={<div className="flex items-center justify-center min-h-screen">Carregando...</div>}><Usuarios /></Suspense></ProtectedRoute>} />
            <Route path="/acompanhamento-suporte" element={<ProtectedRoute allowedRoles={["coordenacao","suporte","suporte_aluno"]}><Suspense fallback={<div className="flex items-center justify-center min-h-screen">Carregando...</div>}><AcompanhamentoSuporte /></Suspense></ProtectedRoute>} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
