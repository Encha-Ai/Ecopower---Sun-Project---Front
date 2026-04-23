import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import FranchiseeLayout from "@/components/Franchisee/FranchiseeLayout";
import {
  SolarPanel,
  ShoppingCart,
  KanbanSquare,
  TrendingUp,
  DollarSign,
  Users,
  Calendar,
  Bot,
  MessageCircle,
  BarChart3,
  Clock,
  Sparkles,
  Activity,
  ChevronRight,
  Info,
  Target,
  UserPlus,
  Briefcase,
  TrendingDown,
  AlertCircle,
  Moon,
  Sun,
} from "lucide-react";
import { useEffect, useState, useMemo, useCallback } from "react";
import { listLeadsByFranchiseeId } from "@/controllers/franchisee/LeadController";
import { listDealsByFranchiseeId } from "@/controllers/franchisee/DealsController";
import { cn } from "@/lib/utils";

// --- COMPONENTE AUXILIAR STAT CARD ---
const StatCard = ({
  stat,
  isLoading,
  formatCurrency,
}: {
  stat: any;
  isLoading: boolean;
  formatCurrency: (v: number) => string;
}) => {
  const isPositive = stat.trend.startsWith("+");

  return (
    <Card
      className="group relative overflow-hidden border-none bg-white shadow-sm transition-all duration-300 hover:shadow-md hover:-translate-y-1 dark:bg-slate-900 dark:shadow-slate-900/50"
      role="region"
      aria-label={`Estatística de ${stat.label}`}
    >
      <CardContent className="p-6">
        <div className="mb-4 flex items-start justify-between">
          <div
            className={cn(
              "rounded-2xl border p-3 transition-transform duration-300 group-hover:scale-110 dark:border-slate-800",
              stat.colorClasses
            )}
          >
            <stat.icon className="h-6 w-6" aria-hidden="true" />
          </div>
        </div>

        <div className="space-y-1">
          <div className="flex items-center gap-1.5">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              {stat.label}
            </p>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button className="inline-flex focus:outline-none focus:ring-2 focus:ring-green-500 rounded-full">
                    <span className="sr-only">
                      Mais informações sobre {stat.label}
                    </span>
                  </button>
                </TooltipTrigger>
              </Tooltip>
            </TooltipProvider>
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white">
            {isLoading ? (
              <Skeleton className="h-8 w-28 bg-slate-200 dark:bg-slate-800" />
            ) : (typeof stat.value === "number" &&
                stat.label.includes("Valor")) ||
              stat.label.includes("Ticket") ? (
              formatCurrency(stat.value)
            ) : (
              stat.value
            )}
          </div>
        </div>
      </CardContent>
      {/* Indicador visual sutil na base */}
      <div
        className={cn(
          "absolute bottom-0 left-0 h-1.5 w-full opacity-20",
          stat.barColor
        )}
      />
    </Card>
  );
};

export default function FranchiseeDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Estado para Dark Mode (Idealmente ficaria num Contexto Global)
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Toggle Dark Mode
  const toggleTheme = () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    if (newMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  };

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState({
    leads: [] as any[],
    contacts: [] as any[],
    clients: [] as any[],
    deals: [] as any[],
    salesCompleted: [] as any[],
  });

  // --- BUSCA DE DADOS ---
  const fetchInsightsDashBoard = useCallback(async () => {
    const franchiseeId = user?.franchisee?.id;
    if (!franchiseeId) return;

    try {
      setIsLoading(true);
      setError(null);

      const [leadsResponse, dealsResponse] = await Promise.all([
        listLeadsByFranchiseeId(franchiseeId),
        listDealsByFranchiseeId(franchiseeId),
      ]);

      const leads = leadsResponse.filter((l: any) => l.leadType === "LEAD");
      const contacts = leadsResponse.filter(
        (l: any) => l.leadType === "CONTACT"
      );
      const clients = leadsResponse.filter((l: any) => l.leadType === "CLIENT");

      const salesCompleted = (dealsResponse || [])
        .filter((item: any) => item.status === "CLOSED_WON")
        .sort((a: any, b: any) => {
          const dateA = new Date(a.updatedAt || a.createdAt).getTime();
          const dateB = new Date(b.updatedAt || b.createdAt).getTime();
          return dateB - dateA;
        })
        .slice(0, 5);

      setData({
        leads,
        contacts,
        clients,
        deals: dealsResponse || [],
        salesCompleted,
      });
    } catch (err) {
      console.error("Erro ao buscar dados do dashboard:", err);
      setError(
        "Não foi possível carregar os dados. Tente novamente mais tarde."
      );
    } finally {
      setIsLoading(false);
    }
  }, [user?.franchisee?.id]);

  useEffect(() => {
    fetchInsightsDashBoard();
  }, [fetchInsightsDashBoard]);

  // --- CÁLCULOS ---
  const statsCalculated = useMemo(() => {
    // 1. Valor em mesa (Pipeline Ativo): Ignora CLOSED_WON e CLOSED_LOST
    const totalValueActive = data.deals
      .filter((d) => d.status !== "CLOSED_LOST" && d.status !== "CLOSED_WON")
      .reduce((acc, item) => acc + (item.value || 0), 0);

    // 2. Faturamento das Vendas Fechadas
    const totalRevenueWon = data.deals
      .filter((d) => d.status === "CLOSED_WON")
      .reduce((acc, item) => acc + (item.value || 0), 0);

    // 3. Volume total da base (Leads + Contatos + Clientes)
    const totalLeadsCount =
      data.leads.length + data.contacts.length + data.clients.length;

    // 4. Ticket Médio: Faturamento Ganho / Total de Leads no sistema
    const ticketMedium =
      totalLeadsCount > 0 ? totalRevenueWon / totalLeadsCount : 0;

    return { totalValueActive, ticketMedium, totalLeadsCount };
  }, [data]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  // --- CONFIGURAÇÕES DE UI ---
  const stats = [
    {
      label: "Valor em mesa",
      value: statsCalculated.totalValueActive,
      icon: DollarSign,
      trend: "+15%",
      colorClasses:
        "bg-green-50 text-green-600 border-green-100 dark:bg-green-500/10 dark:text-green-400 dark:border-green-500/20",
      barColor: "bg-green-500",
      description: "Soma total de negociações em andamento.",
    },
    {
      label: "Vendas realizadas",
      value: data.salesCompleted.length,
      icon: ShoppingCart,
      trend: "+22%",
      colorClasses:
        "bg-blue-50 text-blue-600 border-blue-100 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20",
      barColor: "bg-blue-500",
      description: "Quantidade de contratos fechados com sucesso.",
    },
    {
      label: "Ticket Médio",
      value: statsCalculated.ticketMedium,
      icon: Target,
      trend: "+5%",
      colorClasses:
        "bg-amber-50 text-amber-600 border-amber-100 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20",
      barColor: "bg-amber-500",
      description: "Faturamento ganho dividido pelo total de leads no sistema.",
    },
    {
      label: "Total de Leads",
      value: statsCalculated.totalLeadsCount,
      icon: Users,
      trend: "+8%",
      colorClasses:
        "bg-teal-50 text-teal-600 border-teal-100 dark:bg-teal-500/10 dark:text-teal-400 dark:border-teal-500/20",
      barColor: "bg-teal-500",
      description: "Volume total de contatos, clientes e leads.",
    },
  ];

  const quickActions = [
    {
      label: "CRM",
      icon: KanbanSquare,
      color: "text-green-600 dark:text-green-400",
      bgColor: "bg-green-50 dark:bg-green-500/10",
      hoverBorder: "hover:border-green-200 dark:hover:border-green-800",
      onClick: () => navigate("/franchisee/pipeline"),
    },
    {
      label: "Leads",
      icon: UserPlus,
      color: "text-blue-600 dark:text-blue-400",
      bgColor: "bg-blue-50 dark:bg-blue-500/10",
      hoverBorder: "hover:border-blue-200 dark:hover:border-blue-800",
      onClick: () => navigate("/franchisee/leads"),
    },
    {
      label: "IA Consultora",
      icon: Bot,
      color: "text-purple-600 dark:text-purple-400",
      bgColor: "bg-purple-50 dark:bg-purple-500/10",
      hoverBorder: "hover:border-purple-200 dark:hover:border-purple-800",
      onClick: () => navigate("/franchisee/ia-engineer"),
    },
    {
      label: "Chat",
      icon: MessageCircle,
      color: "text-teal-600 dark:text-teal-400",
      bgColor: "bg-teal-50 dark:bg-teal-500/10",
      hoverBorder: "hover:border-teal-200 dark:hover:border-teal-800",
      onClick: () => navigate("/franchisee/chat"),
    },
  ];

  return (
    <FranchiseeLayout>
      <div className="min-h-screen bg-[#F8FAFC] dark:bg-slate-950 selection:bg-green-100 selection:text-green-900 transition-colors duration-300">
        <div className="container mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:py-12">
          {/* Header Section */}
          <header className="mb-10 flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-green-600 dark:text-green-400">
                <Sparkles className="h-4 w-4" />
                <span>Visão Geral da Franquia</span>
              </div>
              <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white md:text-4xl">
                Olá, {user?.franchisee?.name?.split(" ")[0] || "Parceiro"}! 👋
              </h1>
              <p className="flex items-center gap-2 font-medium text-slate-500 dark:text-slate-400">
                <Activity className="h-4 w-4 text-emerald-500" />
                Acompanhe o desempenho da sua unidade EcoPower.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Button
                variant="outline"
                className="hidden h-11 items-center gap-2 rounded-xl border-slate-200 bg-white px-5 font-semibold text-slate-700 transition-all hover:border-green-300 hover:bg-green-50/50 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-800 sm:flex"
                onClick={() => navigate("/franchisee/calendar")}
              >
                <Calendar className="h-4 w-4 text-slate-500 dark:text-slate-400" />
                Ver Agenda
              </Button>
              {/* Botão Principal Verde */}
              <Button
                className="h-11 flex-1 items-center gap-2 rounded-xl bg-green-600 px-6 font-bold text-white shadow-lg shadow-green-200 dark:shadow-green-900/20 transition-all hover:bg-green-700 hover:shadow-green-300 sm:flex-none"
                onClick={() => navigate("/franchisee/reports")}
              >
                <BarChart3 className="h-4 w-4" />
                Visualizar Relatórios
              </Button>
            </div>
          </header>

          {/* Error State */}
          {error && (
            <div className="mb-8 flex items-center gap-3 rounded-2xl border border-rose-100 bg-rose-50 p-4 text-rose-800 dark:bg-rose-900/20 dark:border-rose-800 dark:text-rose-300">
              <AlertCircle className="h-5 w-5 shrink-0" />
              <p className="text-sm font-medium">{error}</p>
              <Button
                variant="ghost"
                size="sm"
                onClick={fetchInsightsDashBoard}
                className="ml-auto text-rose-800 hover:bg-rose-100 dark:text-rose-300 dark:hover:bg-rose-900/40"
              >
                Tentar novamente
              </Button>
            </div>
          )}

          {/* Stats Grid */}
          <div className="mb-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {stats.map((stat) => (
              <StatCard
                key={stat.label}
                stat={stat}
                isLoading={isLoading}
                formatCurrency={formatCurrency}
              />
            ))}
          </div>

          <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
            {/* Recent Sales Section */}
            <section className="lg:col-span-1 space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="flex items-center gap-3 text-xl font-bold text-slate-900 dark:text-white">
                  <div className="rounded-lg bg-green-600 p-2 text-white">
                    <Briefcase className="h-5 w-5" />
                  </div>
                  Vendas Recentes
                </h2>
                <Button
                  variant="ghost"
                  size="sm"
                  className="font-bold text-green-600 hover:bg-green-50 hover:text-green-700 dark:text-green-400 dark:hover:bg-green-900/20"
                  onClick={() => navigate("/franchisee/reports")}
                >
                  Ver todas <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              </div>

              <div className="space-y-4">
                {isLoading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <Skeleton
                      key={i}
                      className="h-[88px] w-full rounded-2xl bg-slate-200 dark:bg-slate-800"
                    />
                  ))
                ) : data.salesCompleted.length > 0 ? (
                  data.salesCompleted.map((deal) => (
                    <div
                      key={deal.id}
                      className="group flex items-center justify-between rounded-2xl border border-slate-100 bg-white p-4 transition-all duration-300 hover:border-green-200 hover:shadow-lg hover:shadow-green-500/5 cursor-pointer dark:bg-slate-900 dark:border-slate-800 dark:hover:border-green-800"
                    >
                      <div className="flex items-center gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-50 transition-colors group-hover:bg-green-50 dark:bg-slate-800 dark:group-hover:bg-green-900/20">
                          <SolarPanel className="h-6 w-6 text-slate-400 group-hover:text-green-600 dark:text-slate-500 dark:group-hover:text-green-400" />
                        </div>
                        <div>
                          <h4 className="font-bold text-slate-900 transition-colors group-hover:text-green-600 dark:text-slate-100 dark:group-hover:text-green-400">
                            {deal?.lead?.name || "Cliente sem nome"}
                          </h4>
                          <div className="mt-1 flex items-center gap-3">
                            <span className="rounded bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                              #{deal?.id.toString().slice(-6).toUpperCase()}
                            </span>
                            <span className="flex items-center gap-1 text-xs font-medium text-slate-400 dark:text-slate-500">
                              <Clock className="h-3 w-3" />
                              {new Date(deal?.createdAt).toLocaleDateString(
                                "pt-BR"
                              )}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-slate-900 dark:text-white">
                          {formatCurrency(deal.value)}
                        </p>
                        <Badge className="border-none bg-emerald-50 text-emerald-600 hover:bg-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400">
                          Concluído
                        </Badge>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-slate-200 bg-white py-12 dark:bg-slate-900 dark:border-slate-800">
                    <div className="mb-4 rounded-full bg-slate-50 p-4 dark:bg-slate-800">
                      <ShoppingCart className="h-8 w-8 text-slate-300 dark:text-slate-600" />
                    </div>
                    <p className="font-medium text-slate-500 dark:text-slate-400">
                      Nenhuma venda concluída recentemente.
                    </p>
                  </div>
                )}
              </div>
            </section>

            {/* Quick Actions Section */}
            <section className="lg:col-span-1 space-y-6">
              <h2 className="flex items-center gap-2 text-xl font-bold text-slate-900 dark:text-white">
                <Sparkles className="h-5 w-5 text-amber-500" />
                Ações Rápidas
              </h2>
              <div className="grid grid-cols-2 gap-4">
                {quickActions.map((action) => (
                  <button
                    key={action.label}
                    onClick={action.onClick}
                    className={cn(
                      "group flex flex-col items-center justify-center rounded-2xl border border-slate-100 bg-white p-5 transition-all hover:shadow-xl hover:shadow-green-500/5 dark:bg-slate-900 dark:border-slate-800 dark:hover:shadow-green-900/10",
                      action.hoverBorder
                    )}
                  >
                    <div
                      className={cn(
                        "mb-3 flex h-12 w-12 items-center justify-center rounded-xl transition-transform group-hover:scale-110",
                        action.bgColor,
                        action.color
                      )}
                    >
                      <action.icon className="h-6 w-6" />
                    </div>
                    <span className="text-sm font-bold text-slate-700 dark:text-slate-300">
                      {action.label}
                    </span>
                  </button>
                ))}
              </div>
            </section>

            {/* Leads Breakdown Section */}
            <section className="lg:col-span-1">
              <Card className="h-full border-none bg-white shadow-sm dark:bg-slate-900">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg font-bold text-slate-900 dark:text-white">
                    Distribuição de Base
                  </CardTitle>
                  <CardDescription className="dark:text-slate-400">
                    Status atual dos seus contatos no funil
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {[
                    {
                      label: "Leads Ativos",
                      count: data.leads.length,
                      color: "bg-green-500",
                      bgColor: "bg-green-50 dark:bg-green-900/20",
                    },
                    {
                      label: "Contatos",
                      count: data.contacts.length,
                      color: "bg-blue-500",
                      bgColor: "bg-blue-50 dark:bg-blue-900/20",
                    },
                    {
                      label: "Clientes",
                      count: data.clients.length,
                      color: "bg-teal-500",
                      bgColor: "bg-teal-50 dark:bg-teal-900/20",
                    },
                  ].map((item) => {
                    const percentage =
                      statsCalculated.totalLeadsCount > 0
                        ? (item.count / statsCalculated.totalLeadsCount) * 100
                        : 0;

                    return (
                      <div key={item.label} className="space-y-3">
                        <div className="flex justify-between text-sm font-bold">
                          <span className="text-slate-600 dark:text-slate-300">
                            {item.label}
                          </span>
                          <span className="text-slate-900 dark:text-white">
                            {item.count}
                          </span>
                        </div>
                        <div
                          className={cn(
                            "h-2.5 w-full rounded-full overflow-hidden",
                            item.bgColor
                          )}
                        >
                          <div
                            className={cn(
                              "h-full transition-all duration-1000 ease-out",
                              item.color
                            )}
                            style={{ width: `${percentage}%` }}
                            role="progressbar"
                            aria-valuenow={percentage}
                            aria-valuemin={0}
                            aria-valuemax={100}
                          />
                        </div>
                      </div>
                    );
                  })}

                  <div className="mt-6 rounded-xl bg-slate-50 p-4 dark:bg-slate-800">
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase dark:text-slate-400">
                      <Activity className="h-3 w-3" />
                      Insight Rápido
                    </div>
                    <p className="mt-2 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                      Sua base é composta majoritariamente por
                      <span className="font-bold text-slate-900 dark:text-white">
                        {" "}
                        {data.leads.length >= data.contacts.length &&
                        data.leads.length >= data.clients.length
                          ? "Leads Ativos"
                          : data.contacts.length >= data.clients.length
                          ? "Contatos"
                          : "Clientes"}
                      </span>
                      . Foque em converter contatos em clientes para aumentar
                      seu ticket médio.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </section>
          </div>
        </div>
      </div>
    </FranchiseeLayout>
  );
}
