import { useAuth } from "@/contexts/AuthContext";
import { useNavigate, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { NotificationPopover } from "./appointments/NotificationPopover";
import {
  LogOut,
  UserCog,
  Sparkles,
  LayoutDashboard,
  Users,
  Menu,
  Calendar,
  BotMessageSquare,
  Send,
  FileText,
  ChevronLeft,
  ChevronRight,
  Database,
  Lock,
  Filter,
  MessageCircle,
  Sun,
  Moon,
  ClipboardSignature,
} from "lucide-react";

// Converte qualquer string de imagem (base64 puro ou data URL) para src válido
const toImgSrc = (
  value: string | null | undefined,
  fallback: string
): string => {
  if (!value) return fallback;
  if (value.startsWith("data:")) return value;
  return `data:image/png;base64,${value}`;
};

export default function FranchiseeLayout({
  children,
  isModalOpen = false,
  scrollable = true,
}: {
  children: React.ReactNode;
  isModalOpen?: boolean;
  scrollable?: boolean;
}) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(true);

  // --- LÓGICA DO TEMA (DARK MODE) — padrão: dark ---
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("theme");
      if (!saved) return true;
      return saved === "dark";
    }
    return true;
  });

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [isDarkMode]);

  const toggleTheme = () => setIsDarkMode((prev) => !prev);
  // ----------------------------------

  // Foto de perfil do franqueado (JPEG base64) tem prioridade;
  // se não existir, usa a logo da conta (PNG base64), com fallback para placeholder.
  const profilePhotoSrc = user?.franchisee?.profilePhoto
    ? `data:image/jpeg;base64,${user.franchisee.profilePhoto}`
    : toImgSrc(user?.logo, "/placeholder-logo.png");

  useEffect(() => {
    if (!profilePhotoSrc || profilePhotoSrc === "/placeholder-logo.png") return;
    let link = document.querySelector("link[rel='icon']") as HTMLLinkElement;
    if (!link) {
      link = document.createElement("link");
      link.rel = "icon";
      document.head.appendChild(link);
    }
    link.type = "image/png";
    link.href = profilePhotoSrc;
  }, [profilePhotoSrc]);

  const isPremium = user?.franchisee?.plan_type === "PREMIUM";

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  useEffect(() => {
    document.body.style.overflow = isModalOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isModalOpen]);

  // MENU LATERAL — agrupado por afinidade
  const menuItems = [
    // ── Visão geral
    { path: "/franchisee", label: "Dashboard", icon: LayoutDashboard },
    // ── Vendas & Leads
    { path: "/franchisee/pipeline", label: "Pipeline CRM", icon: Filter },
    { path: "/franchisee/leads", label: "Leads", icon: Users },
    { path: "/franchisee/calendar", label: "Agenda", icon: Calendar },
    // ── Comunicação
    { path: "/franchisee/chat", label: "Chat", icon: MessageCircle },
    {
      path: "/franchisee/shooting-message",
      label: "Disparo de mensagens",
      icon: Send,
    },
    // ── Inteligência
    {
      path: "/franchisee/webscraping",
      label: "Mineração (IA)",
      icon: Database,
      locked: !isPremium,
    },
    {
      path: "/franchisee/ia-engineer",
      label: "IA Consultora",
      icon: BotMessageSquare,
    },
    // ── Gestão
    { path: "/franchisee/reports", label: "Relatórios", icon: FileText },
    {
      path: "/franchisee/requests",
      label: "Solicitações",
      icon: ClipboardSignature,
    },
  ];

  const isActive = (path: string) => location.pathname === path;

  const SidebarContent = ({
    collapsed = false,
    isMobile = false,
  }: {
    collapsed?: boolean;
    isMobile?: boolean;
  }) => (
    <div className="flex flex-col h-full bg-white/90 backdrop-blur-xl border-r border-slate-200/50 dark:bg-slate-900/95 dark:border-slate-800 transition-all duration-300">
      {/* HEADER DA SIDEBAR */}
      <div
        className={`h-20 flex items-center border-b border-slate-100/50 dark:border-slate-800 ${
          collapsed ? "justify-center px-0" : "px-6"
        }`}
      >
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="relative shrink-0">
            <div className="absolute inset-0 bg-gradient-to-br from-green-400 to-emerald-500 rounded-xl blur-md opacity-40 dark:opacity-30" />
            <img
              src={profilePhotoSrc}
              className="relative h-10 w-10 rounded-xl object-cover shadow-lg ring-2 ring-white dark:ring-slate-700"
              alt="Logo"
            />
          </div>
          <div
            className={`min-w-0 transition-all duration-300 ${
              collapsed ? "w-0 opacity-0 hidden" : "w-auto opacity-100"
            }`}
          >
            <h1 className="font-bold text-sm text-slate-900 dark:text-slate-100 truncate flex items-center gap-1">
              Franqueado <Sparkles className="w-3 h-3 text-amber-500" />
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
              {user?.franchisee?.name || "EcoPower"}
            </p>
          </div>
        </div>
      </div>

      {/* NAVEGAÇÃO */}
      <nav className="flex-1 overflow-y-auto p-3 space-y-1 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-700">
        {menuItems.map((item, index) => {
          const Icon = item.icon;
          const active = isActive(item.path);

          const groupBreaks = [2, 4, 6, 8];
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
                className={`relative flex items-center transition-all duration-200 group rounded-xl font-medium text-sm ${
                  collapsed
                    ? "justify-center w-10 h-10 mx-auto mb-1"
                    : "w-full px-4 py-2.5 gap-3"
                } ${
                  active
                    ? "bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-lg shadow-green-500/20 dark:shadow-green-900/30"
                    : "text-slate-600 hover:bg-slate-50 hover:text-green-700 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-green-400"
                }`}
                title={collapsed ? item.label : ""}
              >
                {Icon && (
                  <Icon
                    className={`w-[18px] h-[18px] shrink-0 ${
                      active
                        ? "text-white"
                        : "text-slate-400 group-hover:text-green-600 dark:text-slate-500 dark:group-hover:text-green-400"
                    }`}
                  />
                )}
                {!collapsed && (
                  <div className="flex-1 flex justify-between items-center min-w-0">
                    <span className="whitespace-nowrap truncate text-[13px]">
                      {item.label}
                    </span>
                    {item.locked && (
                      <Lock className="w-3 h-3 text-slate-400 ml-2 shrink-0" />
                    )}
                  </div>
                )}
              </button>
            </div>
          );
        })}
      </nav>

      {/* FOOTER DA SIDEBAR */}
      <div className="p-4 border-t border-slate-100/50 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 backdrop-blur-sm">
        {!collapsed && user?.franchisee?.plan_type && (
          <div className="mb-4 px-4 py-3 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl border border-green-100/50 dark:border-green-800/30 animate-in fade-in zoom-in duration-300">
            <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-0.5">
              Plano Atual
            </p>
            <p className="text-sm font-bold bg-clip-text text-transparent bg-gradient-to-r from-green-600 to-emerald-600 dark:from-green-400 dark:to-emerald-400">
              {user.franchisee.plan_type}
            </p>
          </div>
        )}
        <div
          className={`flex items-center gap-2 ${collapsed ? "flex-col" : ""}`}
        >
          <Button
            variant="ghost"
            size={collapsed ? "icon" : "sm"}
            onClick={() => navigate("/franchisee/edit-profile")}
            className={`text-slate-600 hover:text-slate-900 hover:bg-white hover:shadow-sm dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-700 ${
              collapsed ? "w-10 h-10" : "flex-1 justify-start gap-2"
            }`}
            title="Perfil"
          >
            <UserCog className="h-4 w-4" />
            {!collapsed && <span className="text-xs font-medium">Perfil</span>}
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            className="rounded-full text-slate-500 hover:text-green-600 hover:bg-green-50 dark:text-slate-400 dark:hover:text-green-400 dark:hover:bg-slate-800 transition-colors"
            title="Alternar Tema"
          >
            {isDarkMode ? (
              <Sun className="w-5 h-5" />
            ) : (
              <Moon className="w-5 h-5" />
            )}
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={handleLogout}
            className="text-slate-400 hover:text-red-600 hover:bg-red-50 hover:shadow-sm dark:text-slate-500 dark:hover:bg-red-900/20 dark:hover:text-red-400 shrink-0 w-10 h-10"
            title="Sair"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex relative overflow-hidden transition-colors duration-300">
      {/* Background Decorativo */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-gradient-to-br from-green-400/10 to-emerald-400/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 dark:opacity-20" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-gradient-to-tr from-teal-400/10 to-green-400/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2 dark:opacity-20" />
      </div>

      {/* SIDEBAR DESKTOP */}
      <aside
        className={`hidden lg:block h-screen sticky top-0 z-30 shadow-xl shadow-slate-200/50 dark:shadow-black/40 transition-all duration-300 ease-in-out relative ${
          isCollapsed ? "w-20" : "w-72"
        }`}
      >
        <SidebarContent collapsed={isCollapsed} />

        {/* Botão Collapse */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="absolute -right-3 top-9 z-50 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full p-1 shadow-md text-slate-500 dark:text-slate-400 hover:text-green-600 dark:hover:text-green-400 hover:border-green-300 dark:hover:border-green-700 transition-all transform hover:scale-110"
        >
          {isCollapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <ChevronLeft className="w-4 h-4" />
          )}
        </button>
      </aside>

      {/* CONTEÚDO PRINCIPAL */}
      <div className="flex-1 flex flex-col min-w-0 relative z-10 h-screen overflow-hidden">
        {/* HEADER MOBILE */}
        <header className="lg:hidden sticky top-0 z-40 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200/50 dark:border-slate-800 px-4 py-3 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3">
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="-ml-2 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <Menu className="h-6 w-6 text-slate-700 dark:text-slate-300" />
                </Button>
              </SheetTrigger>
              <SheetContent
                side="left"
                className="p-0 w-72 border-r-0 bg-transparent"
              >
                <SidebarContent collapsed={false} isMobile={true} />
              </SheetContent>
            </Sheet>
            <span className="font-bold text-slate-800 dark:text-white text-sm flex items-center gap-2">
              EcoPower <Sparkles className="w-3 h-3 text-amber-500" />
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              className="rounded-full text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              {isDarkMode ? (
                <Sun className="w-5 h-5" />
              ) : (
                <Moon className="w-5 h-5" />
              )}
            </Button>
            <div className="h-8 w-8 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden ring-2 ring-white dark:ring-slate-800 shadow-sm">
              <img
                src={profilePhotoSrc}
                className="h-full w-full object-cover"
                alt="Avatar"
              />
            </div>
          </div>
        </header>

        {/* HEADER DESKTOP */}
        <header className="hidden lg:flex sticky top-0 z-20 px-8 py-4 items-center justify-end gap-4 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm border-b border-white/20 dark:border-slate-800">
          <div className="flex items-center gap-4">
            <NotificationPopover />
            <div className="h-6 w-px bg-slate-200 dark:bg-slate-700" />
            <div className="flex items-center gap-3 pl-2">
              <div className="text-right">
                <p className="text-sm font-bold text-slate-800 dark:text-slate-200 leading-none">
                  {user?.franchisee?.name || "Usuário"}
                </p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                  Franqueado
                </p>
              </div>
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 p-0.5 shadow-lg shadow-green-500/20 dark:shadow-none">
                <div className="h-full w-full rounded-[10px] bg-white dark:bg-slate-800 overflow-hidden">
                  <img
                    src={profilePhotoSrc}
                    className="h-full w-full object-cover"
                    alt="Profile"
                  />
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* ÁREA DE CONTEÚDO */}
        <main
          className={`flex-1 min-h-0 transition-all duration-200 ${
            scrollable
              ? "overflow-y-auto scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-800"
              : "overflow-hidden"
          } ${isModalOpen ? "pointer-events-none select-none blur-[2px]" : ""}`}
        >
          {children}
        </main>
      </div>
    </div>
  );
}
