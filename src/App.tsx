import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";

// Views - Super Admin
import Login from "@/views/Login";
import SuperAdminDashboard from "@/views/superAdmin/SuperAdminDashboard";
import KanbanPage from "@/views/superAdmin/KanbanBoard";
import LeadsView from "@/views/superAdmin/LeadsView";
import EditProfileSuperAdmin from "@/views/superAdmin/EditProfile";
import GeneralAnalytics from "@/views/superAdmin/GeneralAnalytics";
import SuperAdminLeads from "@/views/superAdmin/SuperAdminLeads";
import RagControl from "@/views/superAdmin/RagControl";
import PromptAi from "@/views/superAdmin/PromptAi";
import RequestSuperAdmin from "@/views/superAdmin/Requests";

// Views - Franchisee
import FranchiseeDashboard from "@/views/franchisee/FranchiseeDashboard";
import EditProfileFranchisee from "@/views/franchisee/EditProfile";
import Leads from "@/views/franchisee/Leads";
import FranchiseeCalendar from "@/views/franchisee/FranchiseeCalendar"; // <--- NOVO IMPORT
import IAEngineer from "@/views/franchisee/IAEngineer";
import Chat from "@/views/franchisee/Chat";
import ShootingMessage from "@/views/franchisee/ShootingMessage";
import RequestsFranchisee from "@/views/franchisee/Requests";

import NotFound from "./pages/NotFound";
import KanbanBoard from "./views/franchisee/KanbanBoard";
import ScrapingPage from "./views/franchisee/ScrapingPage";
import PipelineCRM from "./views/franchisee/PipelineCRM";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <Sonner duration={1000} />
        <BrowserRouter>
          <Routes>
            {/* Rota Pública */}
            <Route path="/" element={<Login />} />
            {/* --- SUPER ADMIN --- */}
            <Route
              path="/superadmin"
              element={
                <ProtectedRoute allowedRoles={["SUPERADMIN"]}>
                  <SuperAdminDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/superadmin/edit-profile"
              element={
                <ProtectedRoute allowedRoles={["SUPERADMIN"]}>
                  <EditProfileSuperAdmin />
                </ProtectedRoute>
              }
            />
            <Route
              path="/superadmin/requests"
              element={
                <ProtectedRoute allowedRoles={["SUPERADMIN"]}>
                  <RequestSuperAdmin />
                </ProtectedRoute>
              }
            />

            <Route
              path="/superadmin/analytics"
              element={<GeneralAnalytics />}
            />
            <Route path="/superadmin/leads" element={<SuperAdminLeads />} />
            <Route path="/superadmin/rag" element={<RagControl />} />
            <Route path="/superadmin/prompt" element={<PromptAi />} />

            {/* Rotas de Gestão do Admin sobre o Franqueado */}
            <Route
              path="/dashboard/kanban/:franchiseeId"
              element={<KanbanPage />}
            />
            <Route
              path="/dashboard/leads/:franchiseeId"
              element={<LeadsView />}
            />
            {/* --- FRANCHISEE (FRANQUEADO) --- */}
            <Route
              path="/franchisee"
              element={
                <ProtectedRoute allowedRoles={["FRANCHISEE"]}>
                  <FranchiseeDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/franchisee/edit-profile"
              element={
                <ProtectedRoute allowedRoles={["FRANCHISEE"]}>
                  <EditProfileFranchisee />
                </ProtectedRoute>
              }
            />
            <Route
              path="/franchisee/leads"
              element={
                <ProtectedRoute allowedRoles={["FRANCHISEE"]}>
                  <Leads />
                </ProtectedRoute>
              }
            />
            {/* Pipeline CRM */}
            <Route
              path="/franchisee/pipeline"
              element={
                <ProtectedRoute allowedRoles={["FRANCHISEE"]}>
                  <PipelineCRM />
                </ProtectedRoute>
              }
            />
            {/* AGENDA/CALENDÁRIO */}
            <Route
              path="/franchisee/calendar"
              element={
                <ProtectedRoute allowedRoles={["FRANCHISEE"]}>
                  <FranchiseeCalendar />
                </ProtectedRoute>
              }
            />
            {/* Relatório Kanban */}
            <Route
              path="/franchisee/reports"
              element={
                <ProtectedRoute allowedRoles={["FRANCHISEE"]}>
                  <KanbanBoard />
                </ProtectedRoute>
              }
            />
            {/* IA Engenheira */}
            <Route
              path="/franchisee/ia-engineer"
              element={
                <ProtectedRoute allowedRoles={["FRANCHISEE"]}>
                  <IAEngineer />
                </ProtectedRoute>
              }
            />
            {/* Página de webscraping do franqueado */}
            <Route
              path="/franchisee/webscraping"
              element={
                <ProtectedRoute allowedRoles={["FRANCHISEE"]}>
                  <ScrapingPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/franchisee/requests"
              element={
                <ProtectedRoute allowedRoles={["FRANCHISEE"]}>
                  <RequestsFranchisee />
                </ProtectedRoute>
              }
            />
            {/* Página para Chat/WhatsApp */}
            <Route path="/franchisee/chat" element={<Chat />} />
            {/* Página para ShootingMessage */}
            <Route
              path="/franchisee/shooting-message"
              element={
                <ProtectedRoute allowedRoles={["FRANCHISEE"]}>
                  <ShootingMessage />
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
