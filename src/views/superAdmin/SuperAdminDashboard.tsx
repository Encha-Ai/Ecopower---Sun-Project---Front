import { useState, useEffect, useMemo, useCallback, memo } from "react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Users,
  Store,
  LogOut,
  Building2,
  Crown,
  Search,
  Plus,
  Mail,
  Phone,
  MapPin,
  FileText,
  TrendingUp,
  Calendar,
  RefreshCw,
  BarChart3,
  Database,
  Menu,
  ChevronLeft,
  ChevronRight,
  UserCog,
  ShieldOff,
  Sun,
  Moon,
  Bot,
  Activity,
  ClipboardSignature,
  Kanban,
  Pencil,
  Trash2,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import * as franchiseeController from "@/controllers/superAdmin/FranchiseeController";
import * as userController from "@/controllers/superAdmin/useAuthController";
import { Franchisee } from "@/models/Franchiesee";
import CreateFranchisee from "@/components/SuperAdmin/CreateFranchisee";
import EditFranchisee from "@/components/SuperAdmin/EditFranchisee";
import FranchiseeStats from "@/components/Dashboard/FranchiseeStats";

// ─── Utilitários puros (fora do componente) ──────────────────────────────────

const formatCPF = (cpf: string) => {
  if (!cpf) return "";
  return cpf
    .replace(/\D/g, "")
    .replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
};

const formatPhone = (phone: string) => {
  if (!phone) return "";
  const c = phone.replace(/\D/g, "");
  if (c.length === 11) return c.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3");
  if (c.length === 10) return c.replace(/(\d{2})(\d{4})(\d{4})/, "($1) $2-$3");
  return phone;
};

const formatDate = (dateStr: string) => {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const getInitials = (name: string) => {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
};

// Atualiza o favicon sem depender de estado React
const updateFavicon = (logo: string) => {
  if (!logo) return;
  let link = document.querySelector("link[rel='icon']") as HTMLLinkElement;
  if (!link) {
    link = document.createElement("link");
    link.rel = "icon";
    document.head.appendChild(link);
  }
  link.type = "image/png";
  link.href = logo.startsWith("data:") ? logo : `data:image/png;base64,${logo}`;
};

// ─── Avatar memoizado para evitar re-renders desnecessários ──────────────────

const FranchiseeAvatar = memo(
  ({
    profilePhoto,
    name,
    active,
    size = "md",
  }: {
    profilePhoto?: string | null;
    name: string;
    active: boolean;
    size?: "sm" | "md" | "lg";
  }) => {
    const sizeMap = {
      sm: "w-8 h-8 text-xs",
      md: "w-11 h-11 text-sm",
      lg: "w-14 h-14 text-base",
    };
    const ring = active
      ? "ring-2 ring-emerald-400/60 ring-offset-2 ring-offset-white dark:ring-offset-slate-900"
      : "ring-2 ring-red-300/60 ring-offset-2 ring-offset-white dark:ring-offset-slate-900";

    if (profilePhoto) {
      const src = profilePhoto.startsWith("data:")
        ? profilePhoto
        : `data:image/jpeg;base64,${profilePhoto}`;
      return (
        <img
          src={src}
          alt={name}
          className={`${sizeMap[size]} rounded-xl object-cover shrink-0 ${ring}`}
        />
      );
    }

    const colors = [
      "from-violet-500 to-purple-600",
      "from-emerald-500 to-teal-600",
      "from-blue-500 to-sky-600",
      "from-rose-500 to-pink-600",
      "from-amber-500 to-orange-600",
      "from-cyan-500 to-sky-600",
    ];
    const colorIndex = name.charCodeAt(0) % colors.length;

    return (
      <div
        className={`${sizeMap[size]} rounded-xl bg-gradient-to-br ${colors[colorIndex]} flex items-center justify-center text-white font-black shrink-0 ${ring} shadow-sm`}
      >
        {getInitials(name)}
      </div>
    );
  }
);

// ─── Componente principal ─────────────────────────────────────────────────────

export default function SuperAdminDashboard() {
  const [franchisees, setFranchisees] = useState<Franchisee[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(true);

  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("theme");
      if (!saved) return true;
      return saved === "dark";
    }
    return true;
  });

  const [searchTerm, setSearchTerm] = useState("");
  const [filterPlan, setFilterPlan] = useState("ALL");
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [openCreateFranchisee, setOpenCreateFranchisee] = useState(false);
  const [openEditFranchisee, setOpenEditFranchisee] = useState(false);
  const [selectedFranchisee, setSelectedFranchisee] = useState<any>(null);
  const [openDashboardModal, setOpenDashboardModal] = useState(false);
  const [selectedDashboardId, setSelectedDashboardId] = useState<string | null>(
    null
  );
  const [openDeleteConfirm, setOpenDeleteConfirm] = useState(false);
  const [franchiseeToDelete, setFranchiseeToDelete] =
    useState<Franchisee | null>(null);

  const { toast } = useToast();
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // ─── Logo: estado inicial a partir do contexto ou localStorage ───────────
  const [logo, setLogo] = useState<string>(() => {
    const fromContext = (user as any)?.logo;
    if (fromContext) return fromContext;
    const stored = localStorage.getItem("currentUser");
    return stored ? JSON.parse(stored)?.logo || "" : "";
  });

  // ─── useEffect unificado para sincronização de logo + favicon ────────────
  useEffect(() => {
    // Prioriza logo do AuthContext
    const contextLogo = (user as any)?.logo;
    if (contextLogo) {
      setLogo(contextLogo);
      updateFavicon(contextLogo);
    }

    // Sincroniza a partir do localStorage (outras abas)
    const syncFromStorage = () => {
      const userData = JSON.parse(localStorage.getItem("currentUser") || "{}");
      const newLogo = userData?.logo || "";
      setLogo(newLogo);
      updateFavicon(newLogo);
    };

    // Sincroniza a partir do evento customizado (mesma aba)
    const handleLogoUpdated = (e: CustomEvent) => {
      setLogo(e.detail.logo);
      updateFavicon(e.detail.logo);
    };

    window.addEventListener("logoUpdated", handleLogoUpdated as EventListener);
    window.addEventListener("storage", syncFromStorage);

    return () => {
      window.removeEventListener(
        "logoUpdated",
        handleLogoUpdated as EventListener
      );
      window.removeEventListener("storage", syncFromStorage);
    };
  }, [(user as any)?.logo]);

  // ─── Dark mode ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [isDarkMode]);

  // ─── Carga inicial ───────────────────────────────────────────────────────
  useEffect(() => {
    loadAllFranchisee();
  }, []);

  // ─── Filtragem via useMemo (sem useEffect + setState extra) ──────────────
  const filteredFranchisees = useMemo(() => {
    let filtered = franchisees;
    if (filterStatus === "ACTIVE")
      filtered = filtered.filter((f) => f.active === true);
    else if (filterStatus === "INACTIVE")
      filtered = filtered.filter((f) => f.active === false);
    if (searchTerm)
      filtered = filtered.filter(
        (f) =>
          f.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          f.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
          f.municipality.toLowerCase().includes(searchTerm.toLowerCase())
      );
    if (filterPlan !== "ALL")
      filtered = filtered.filter((f) => f.plan_type === filterPlan);
    return filtered;
  }, [searchTerm, filterPlan, filterStatus, franchisees]);

  // ─── Estatísticas derivadas via useMemo ──────────────────────────────────
  const activeFranchisees = useMemo(
    () => franchisees.filter((f) => f.active === true),
    [franchisees]
  );

  // ─── Handlers memoizados ─────────────────────────────────────────────────
  const loadAllFranchisee = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await franchiseeController.getAllFranchisee();
      setFranchisees(data);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleLogout = useCallback(() => {
    logout();
    navigate("/");
  }, [logout, navigate]);

  const handleSave = useCallback(
    async (data: any) => {
      try {
        setIsLoading(true);
        await franchiseeController.createFranchisee({ franchiseeData: data });
        setOpenCreateFranchisee(false);
        toast({
          title: "Sucesso 🎉",
          description: "Dados salvos com sucesso.",
        });
        loadAllFranchisee();
      } catch (error: any) {
        toast({ title: "Error", description: error.message });
      } finally {
        setIsLoading(false);
      }
    },
    [loadAllFranchisee, toast]
  );

  const handleKillSessionToDoFranchisee = useCallback(
    async (id: string) => {
      try {
        await franchiseeController.killerSessionToDoFranchisee(id);
        toast({
          title: "Sucesso",
          description: "Sessão encerrada com sucesso!",
        });
      } catch (error: any) {
        toast({
          title: "Erro",
          description: "Falha ao encerrar sessão. " + error.message,
          variant: "destructive",
        });
      }
    },
    [toast]
  );

  const handleDeleteClick = useCallback((franchisee: Franchisee) => {
    setFranchiseeToDelete(franchisee);
    setOpenDeleteConfirm(true);
  }, []);

  const handleDeleteConfirm = useCallback(async () => {
    if (!franchiseeToDelete) return;
    try {
      setIsLoading(true);
      await franchiseeController.deleteFranchiseeById({
        id: franchiseeToDelete.id,
      });
      setFranchisees((prev) =>
        prev.filter((f) => f.id !== franchiseeToDelete.id)
      );
      toast({
        title: "Sucesso 🎉",
        description: "Franqueado excluído com sucesso.",
      });
    } catch (error: any) {
      toast({
        title: "Erro",
        description: "Falha ao excluir franqueado. " + error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      setOpenDeleteConfirm(false);
      setFranchiseeToDelete(null);
    }
  }, [franchiseeToDelete, toast]);

  const handleViewDashboard = useCallback((franchiseeId: string) => {
    setSelectedDashboardId(franchiseeId);
    setOpenDashboardModal(true);
  }, []);

  const handleEditClick = useCallback((franchisee: Franchisee) => {
    setSelectedFranchisee({
      user: { email: franchisee.email },
      franchisee: { ...franchisee },
    });
    setOpenEditFranchisee(true);
  }, []);

  const handleEditSave = useCallback(
    async (data: any) => {
      try {
        setIsLoading(true);
        await userController.updateUser({ data: data.user });
        await franchiseeController.updateFranchisee({ data: data.franchisee });
        setFranchisees((prev) =>
          prev.map((f) => {
            if (f.user_id !== selectedFranchisee.franchisee.user_id) return f;
            return {
              ...f,
              ...data.franchisee,
              email: data.user?.email ?? f.email,
            };
          })
        );
        setOpenEditFranchisee(false);
        setSelectedFranchisee(null);
        toast({ title: "Sucesso 🎉", description: "Franqueado atualizado." });
      } catch (error: any) {
        toast({
          title: "Erro",
          description: error?.message,
          variant: "destructive",
        });
        await loadAllFranchisee();
      } finally {
        setIsLoading(false);
      }
    },
    [selectedFranchisee, loadAllFranchisee, toast]
  );

  const handleToggleActive = useCallback(
    async (id: string, currentStatus: boolean) => {
      try {
        await franchiseeController.updateActiveStatus({
          id,
          isActive: !currentStatus,
        });
        setFranchisees((prev) =>
          prev.map((f) => (f.id === id ? { ...f, active: !f.active } : f))
        );
        toast({ title: "Sucesso 🎉", description: "Status atualizado." });
      } catch (error: any) {
        toast({
          title: "Erro",
          description: error?.message,
          variant: "destructive",
        });
      }
    },
    [toast]
  );

  // ─── Dados derivados ─────────────────────────────────────────────────────
  const stats = useMemo(
    () => [
      {
        label: "Franqueados Ativos",
        value: activeFranchisees.length,
        icon: Users,
        gradient: "from-emerald-500 to-teal-500",
        lightBg: "bg-emerald-50 dark:bg-emerald-950/30",
        iconColor: "text-emerald-600 dark:text-emerald-400",
        valueColor: "text-emerald-700 dark:text-emerald-300",
      },
      {
        label: "Planos Premium",
        value: activeFranchisees.filter((f) => f.plan_type === "PREMIUM")
          .length,
        icon: Crown,
        gradient: "from-violet-500 to-purple-500",
        lightBg: "bg-violet-50 dark:bg-violet-950/30",
        iconColor: "text-violet-600 dark:text-violet-400",
        valueColor: "text-violet-700 dark:text-violet-300",
      },
      {
        label: "Planos Basic",
        value: activeFranchisees.filter((f) => f.plan_type === "BASIC").length,
        icon: Building2,
        gradient: "from-blue-500 to-sky-500",
        lightBg: "bg-blue-50 dark:bg-blue-950/30",
        iconColor: "text-blue-600 dark:text-blue-400",
        valueColor: "text-blue-700 dark:text-blue-300",
      },
      {
        label: "Estados Atendidos",
        value: new Set(activeFranchisees.map((f) => f.uf)).size,
        icon: MapPin,
        gradient: "from-amber-500 to-orange-500",
        lightBg: "bg-amber-50 dark:bg-amber-950/30",
        iconColor: "text-amber-600 dark:text-amber-400",
        valueColor: "text-amber-700 dark:text-amber-300",
      },
    ],
    [activeFranchisees]
  );

  const menuItems = useMemo(
    () => [
      { path: "/superadmin", label: "Franqueados", icon: Store },
      { path: "/superadmin/leads", label: "Leads Global", icon: Users },
      { path: "/superadmin/analytics", label: "Analytics", icon: BarChart3 },
      {
        path: "/superadmin/requests",
        label: "Solicitações",
        icon: ClipboardSignature,
      },
      { path: "/superadmin/rag", label: "Base IA", icon: Database },
      { path: "/superadmin/prompt", label: "Prompt IA", icon: Bot },
      { path: "/superadmin/edit-profile", label: "Meu Perfil", icon: UserCog },
    ],
    []
  );

  const groupBreaks = [2, 4, 6];
  const isActive = (path: string) => location.pathname === path;

  const SidebarContent = ({
    collapsed = false,
    isMobile = false,
  }: {
    collapsed?: boolean;
    isMobile?: boolean;
  }) => (
    <div className="flex flex-col h-full bg-white dark:bg-slate-950 border-r border-slate-100 dark:border-slate-800/50">
      {/* Logo */}
      <div
        className={`flex items-center border-b border-slate-100 dark:border-slate-800/50 ${
          collapsed ? "h-20 justify-center" : "h-20 px-5"
        }`}
      >
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="relative shrink-0">
            {logo ? (
              <img
                src={
                  logo.startsWith("data:")
                    ? logo
                    : `data:image/png;base64,${logo}`
                }
                className="h-10 w-10 rounded-xl object-cover ring-2 ring-emerald-400/30 shadow-lg"
                alt="Logo"
              />
            ) : (
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white text-xs font-black shadow-lg">
                SA
              </div>
            )}
            <span className="absolute -bottom-1 -right-1 w-3 h-3 bg-emerald-400 rounded-full border-2 border-white dark:border-slate-950" />
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <p className="font-bold text-sm text-slate-900 dark:text-slate-100 leading-none">
                SuperAdmin
              </p>
              <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
                Painel de Controle
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
        {!collapsed && (
          <p className="text-[10px] font-bold text-slate-400 dark:text-slate-600 uppercase tracking-widest px-3 mb-3 mt-1">
            Menu
          </p>
        )}
        {menuItems.map((item, index) => {
          const Icon = item.icon;
          const active = isActive(item.path);
          const showDivider = !collapsed && groupBreaks.includes(index);

          return (
            <div key={item.path}>
              {showDivider && (
                <div className="my-2 mx-1 border-t border-slate-100 dark:border-slate-800" />
              )}
              <button
                onClick={() => {
                  navigate(item.path);
                  if (isMobile) setMobileMenuOpen(false);
                }}
                title={collapsed ? item.label : ""}
                className={`relative flex items-center transition-all duration-200 rounded-xl font-medium text-sm group ${
                  collapsed
                    ? "justify-center w-10 h-10 mx-auto"
                    : "w-full px-3 py-2.5 gap-3"
                } ${
                  active
                    ? "bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/25"
                    : "text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-200"
                }`}
              >
                {active && !collapsed && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-white/40 rounded-r-full" />
                )}
                <Icon
                  className={`w-4 h-4 shrink-0 ${
                    active
                      ? "text-white"
                      : "text-slate-400 dark:text-slate-500 group-hover:text-slate-700 dark:group-hover:text-slate-300"
                  }`}
                />
                {!collapsed && <span className="truncate">{item.label}</span>}
                {active && !collapsed && (
                  <span className="ml-auto w-1.5 h-1.5 rounded-full bg-white/60" />
                )}
              </button>
            </div>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-slate-100 dark:border-slate-800/50">
        <div
          className={`flex items-center gap-2 ${collapsed ? "flex-col" : ""}`}
        >
          <button
            onClick={() => setIsDarkMode((prev) => !prev)}
            title={isDarkMode ? "Modo Claro" : "Modo Escuro"}
            className={`flex items-center gap-2.5 rounded-xl text-sm font-medium text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-800 dark:hover:text-slate-200 transition-all ${
              collapsed ? "w-10 h-10 justify-center" : "flex-1 px-3 py-2.5"
            }`}
          >
            {isDarkMode ? (
              <Sun className="w-4 h-4 shrink-0" />
            ) : (
              <Moon className="w-4 h-4 shrink-0" />
            )}
            {!collapsed && (
              <span className="text-xs">
                {isDarkMode ? "Modo Claro" : "Modo Escuro"}
              </span>
            )}
          </button>
          <button
            onClick={handleLogout}
            title="Sair"
            className="flex items-center justify-center w-10 h-10 rounded-xl text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 dark:hover:text-red-400 transition-all shrink-0"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="h-screen bg-slate-50 dark:bg-slate-950 flex overflow-hidden">
      {/* Sidebar Desktop */}
      <aside
        className={`hidden lg:block shrink-0 h-screen sticky top-0 z-30 shadow-xl shadow-slate-200/50 dark:shadow-black/40 transition-all duration-300 ease-in-out ${
          isCollapsed ? "w-[72px]" : "w-64"
        }`}
      >
        <div className="relative h-full">
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="absolute -right-3 top-9 z-50 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full p-1 shadow-md text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:border-emerald-300 dark:hover:border-emerald-700 transition-all hover:scale-110"
          >
            {isCollapsed ? (
              <ChevronRight className="w-3.5 h-3.5" />
            ) : (
              <ChevronLeft className="w-3.5 h-3.5" />
            )}
          </button>
          <SidebarContent collapsed={isCollapsed} />
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto">
        {/* Mobile Header */}
        <header className="lg:hidden sticky top-0 z-40 bg-white/80 dark:bg-slate-950/80 backdrop-blur border-b border-slate-100 dark:border-slate-800/60 px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="h-9 w-9">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="p-0 w-64 border-r-0">
                <SidebarContent isMobile />
              </SheetContent>
            </Sheet>
            <span className="font-bold text-slate-800 dark:text-slate-100 text-sm">
              SuperAdmin
            </span>
          </div>
          <button
            onClick={() => setIsDarkMode((prev) => !prev)}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
          >
            {isDarkMode ? (
              <Sun className="w-4 h-4 text-slate-400" />
            ) : (
              <Moon className="w-4 h-4 text-slate-600" />
            )}
          </button>
        </header>

        <main className="flex-1 p-5 lg:p-8 space-y-7">
          {/* Page Header */}
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">
                  <Activity className="w-3 h-3" /> Painel Principal
                </span>
              </div>
              <h1 className="text-3xl font-black text-slate-900 dark:text-slate-50 tracking-tight">
                Gestão de Franqueados
              </h1>
              <p className="text-sm text-slate-400 dark:text-slate-500 mt-1 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" />
                {new Date().toLocaleDateString("pt-BR", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                })}
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={loadAllFranchisee}
                disabled={isLoading}
                className="h-10 w-10 flex items-center justify-center rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-sm"
              >
                <RefreshCw
                  className={`h-4 w-4 text-slate-400 ${
                    isLoading ? "animate-spin" : ""
                  }`}
                />
              </button>
              <button
                onClick={() => setOpenCreateFranchisee(true)}
                className="h-10 flex items-center gap-2 px-5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white rounded-xl text-sm font-semibold transition-all shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40"
              >
                <Plus className="w-4 h-4" /> Novo Franqueado
              </button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {stats.map((stat, i) => {
              const Icon = stat.icon;
              return (
                <div
                  key={i}
                  className="relative overflow-hidden bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/60 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div
                    className={`absolute -top-4 -right-4 w-20 h-20 rounded-full bg-gradient-to-br ${stat.gradient} opacity-10 blur-xl`}
                  />
                  <div className="relative">
                    <div
                      className={`inline-flex items-center justify-center w-10 h-10 rounded-xl ${stat.lightBg} mb-4`}
                    >
                      <Icon className={`w-5 h-5 ${stat.iconColor}`} />
                    </div>
                    <p
                      className={`text-4xl font-black ${stat.valueColor} leading-none`}
                    >
                      {stat.value}
                    </p>
                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-1.5 font-medium">
                      {stat.label}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Filters + Table */}
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/60 rounded-2xl overflow-hidden shadow-sm">
            {/* Filter bar */}
            <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800/60 flex flex-col md:flex-row gap-3 items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Buscar por nome, email ou cidade..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 rounded-xl text-sm text-slate-800 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400/60 transition-all"
                />
              </div>
              <div className="flex gap-1 p-1 bg-slate-100 dark:bg-slate-800/60 rounded-xl">
                {[
                  { v: "ALL", l: "Todos" },
                  { v: "ACTIVE", l: "Ativos" },
                  { v: "INACTIVE", l: "Inativos" },
                ].map(({ v, l }) => (
                  <button
                    key={v}
                    onClick={() => setFilterStatus(v)}
                    className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      filterStatus === v
                        ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-sm"
                        : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
                    }`}
                  >
                    {l}
                  </button>
                ))}
              </div>
            </div>

            {/* Table header */}
            <div className="hidden md:grid grid-cols-12 px-6 py-3 text-[10px] font-bold text-slate-400 dark:text-slate-600 uppercase tracking-widest bg-slate-50/60 dark:bg-slate-800/20 border-b border-slate-100 dark:border-slate-800/40">
              <div className="col-span-3">Franqueado</div>
              <div className="col-span-3">Contato</div>
              <div className="col-span-2">Localização</div>
              <div className="col-span-2">Datas</div>
              <div className="col-span-1 text-center">Créditos</div>
              <div className="col-span-1 text-right">Ações</div>
            </div>

            {/* Rows */}
            <div className="divide-y divide-slate-50 dark:divide-slate-800/30">
              {isLoading ? (
                <div className="flex flex-col items-center justify-center py-20 gap-3">
                  <div className="w-12 h-12 rounded-full border-4 border-emerald-100 dark:border-emerald-900/30 border-t-emerald-500 animate-spin" />
                  <p className="text-sm text-slate-400 animate-pulse">
                    Carregando franqueados...
                  </p>
                </div>
              ) : filteredFranchisees.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-slate-400 dark:text-slate-600">
                  <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4">
                    <Users className="w-7 h-7 opacity-40" />
                  </div>
                  <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">
                    Nenhum franqueado encontrado
                  </p>
                  <p className="text-xs text-slate-400 dark:text-slate-600 mt-1">
                    Tente ajustar os filtros de busca
                  </p>
                </div>
              ) : (
                filteredFranchisees.map((franchisee) => (
                  <div
                    key={franchisee.user_id}
                    className="grid md:grid-cols-12 gap-4 px-6 py-4 hover:bg-slate-50/80 dark:hover:bg-slate-800/20 transition-colors items-center group"
                  >
                    {/* Name + Avatar + Status */}
                    <div className="md:col-span-3 flex items-center gap-3">
                      <FranchiseeAvatar
                        profilePhoto={franchisee.profilePhoto}
                        name={franchisee.name}
                        active={franchisee.active}
                      />
                      <div className="min-w-0">
                        <p className="font-semibold text-slate-900 dark:text-slate-100 text-sm truncate">
                          {franchisee.name}
                        </p>
                        <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                          <button
                            onClick={() =>
                              handleToggleActive(
                                franchisee.id,
                                franchisee.active
                              )
                            }
                            className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full transition-colors cursor-pointer ${
                              franchisee.active
                                ? "bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-200"
                                : "bg-red-100 dark:bg-red-950/50 text-red-600 dark:text-red-400 hover:bg-red-200"
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                franchisee.active
                                  ? "bg-emerald-500"
                                  : "bg-red-500"
                              }`}
                            />
                            {franchisee.active ? "Ativo" : "Inativo"}
                          </button>
                          <span
                            className={`inline-flex items-center gap-0.5 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              franchisee.plan_type === "PREMIUM"
                                ? "bg-violet-100 dark:bg-violet-950/50 text-violet-700 dark:text-violet-400"
                                : "bg-blue-100 dark:bg-blue-950/50 text-blue-700 dark:text-blue-400"
                            }`}
                          >
                            {franchisee.plan_type === "PREMIUM" ? (
                              <>
                                <Crown className="w-2.5 h-2.5" /> Premium
                              </>
                            ) : (
                              "Basic"
                            )}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Contact */}
                    <div className="md:col-span-3 space-y-1.5">
                      <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5 truncate">
                        <Mail className="w-3 h-3 shrink-0 text-slate-400" />
                        {franchisee.email}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                        <Phone className="w-3 h-3 shrink-0 text-slate-400" />
                        {formatPhone(franchisee.phone)}
                      </p>
                    </div>

                    {/* Location */}
                    <div className="md:col-span-2 space-y-1.5">
                      <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                        <MapPin className="w-3 h-3 shrink-0 text-slate-400" />
                        {franchisee.municipality} – {franchisee.uf}
                      </p>
                      {franchisee.cpf && (
                        <p className="text-xs text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
                          <FileText className="w-3 h-3 shrink-0" />
                          {formatCPF(franchisee.cpf)}
                        </p>
                      )}
                    </div>

                    {/* Datas */}
                    <div className="md:col-span-2 space-y-1.5">
                      <div className="flex flex-col gap-1">
                        <p className="text-[10px] font-semibold text-slate-400 dark:text-slate-600 uppercase tracking-wide">
                          Criado
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                          <Calendar className="w-3 h-3 shrink-0 text-emerald-400" />
                          {formatDate(franchisee.create_at)}
                        </p>
                      </div>
                      <div className="flex flex-col gap-1">
                        <p className="text-[10px] font-semibold text-slate-400 dark:text-slate-600 uppercase tracking-wide">
                          Atualizado
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                          <RefreshCw className="w-3 h-3 shrink-0 text-blue-400" />
                          {formatDate(franchisee.update_at)}
                        </p>
                      </div>
                    </div>

                    {/* Credits */}
                    <div className="md:col-span-1 flex flex-col items-center gap-2">
                      <div className="flex flex-col items-center">
                        <span className="text-xl font-black text-emerald-600 dark:text-emerald-400 leading-none">
                          {franchisee.limit_scrap_go ?? "—"}
                        </span>
                        <span className="text-[10px] text-slate-400 dark:text-slate-600 mt-0.5">
                          Google
                        </span>
                      </div>
                      <div className="w-full h-px bg-slate-100 dark:bg-slate-800" />
                      <div className="flex flex-col items-center">
                        <span className="text-xl font-black text-violet-600 dark:text-violet-400 leading-none">
                          {franchisee.limitPipelineCreation ?? "—"}
                        </span>
                        <span className="text-[10px] text-slate-400 dark:text-slate-600 mt-0.5">
                          Pipelines
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="md:col-span-1 flex items-center justify-end gap-1.5 flex-wrap">
                      <button
                        onClick={() => handleViewDashboard(franchisee.id)}
                        title="Ver Dashboard"
                        className="h-8 w-8 flex items-center justify-center rounded-lg bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-950/60 transition-colors"
                      >
                        <BarChart3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() =>
                          navigate(`/dashboard/kanban/${franchisee.id}`)
                        }
                        title="Abrir CRM"
                        className="h-8 w-8 flex items-center justify-center rounded-lg bg-violet-50 dark:bg-violet-950/30 text-violet-600 dark:text-violet-400 hover:bg-violet-100 dark:hover:bg-violet-950/60 transition-colors"
                      >
                        <Kanban className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleEditClick(franchisee)}
                        title="Editar franqueado"
                        className="h-8 w-8 flex items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() =>
                          handleKillSessionToDoFranchisee(franchisee.user_id)
                        }
                        title="Encerrar sessão"
                        className="h-8 w-8 flex items-center justify-center rounded-lg bg-amber-50 dark:bg-amber-950/30 text-amber-500 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-950/60 transition-colors"
                      >
                        <ShieldOff className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteClick(franchisee)}
                        title="Excluir franqueado"
                        className="h-8 w-8 flex items-center justify-center rounded-lg bg-red-50 dark:bg-red-950/30 text-red-500 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-950/60 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer count */}
            {!isLoading && filteredFranchisees.length > 0 && (
              <div className="px-6 py-3 border-t border-slate-100 dark:border-slate-800/40 bg-slate-50/50 dark:bg-slate-800/10 flex items-center justify-between">
                <p className="text-xs text-slate-400 dark:text-slate-600">
                  <span className="font-semibold text-slate-600 dark:text-slate-400">
                    {filteredFranchisees.length}
                  </span>{" "}
                  franqueado(s) encontrado(s)
                </p>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  <span className="text-xs text-slate-400">
                    {activeFranchisees.length} ativos
                  </span>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Modals */}
      <CreateFranchisee
        open={openCreateFranchisee}
        onClose={() => setOpenCreateFranchisee(false)}
        onSave={handleSave}
      />
      <EditFranchisee
        open={openEditFranchisee}
        onClose={() => {
          setOpenEditFranchisee(false);
          setSelectedFranchisee(null);
        }}
        onSave={handleEditSave}
        franchiseeData={selectedFranchisee}
      />

      {/* Dashboard Modal */}
      <Dialog open={openDashboardModal} onOpenChange={setOpenDashboardModal}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-950/50 flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              </div>
              Dashboard Financeiro
            </DialogTitle>
          </DialogHeader>
          {selectedDashboardId && (
            <FranchiseeStats franchiseeId={selectedDashboardId} />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog open={openDeleteConfirm} onOpenChange={setOpenDeleteConfirm}>
        <DialogContent className="max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-red-100 dark:bg-red-950/50 flex items-center justify-center shrink-0">
                <Trash2 className="w-4 h-4 text-red-600 dark:text-red-400" />
              </div>
              Excluir Franqueado
            </DialogTitle>
          </DialogHeader>
          <div className="mt-2 space-y-4">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Tem certeza que deseja excluir permanentemente o franqueado{" "}
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                {franchiseeToDelete?.name}
              </span>
              ? Esta ação não pode ser desfeita.
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => {
                  setOpenDeleteConfirm(false);
                  setFranchiseeToDelete(null);
                }}
                className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleDeleteConfirm}
                disabled={isLoading}
                className="px-4 py-2 rounded-xl text-sm font-semibold text-white bg-red-500 hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-700 transition-colors shadow-lg shadow-red-500/25 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isLoading ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Trash2 className="w-3.5 h-3.5" />
                )}
                Excluir
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
