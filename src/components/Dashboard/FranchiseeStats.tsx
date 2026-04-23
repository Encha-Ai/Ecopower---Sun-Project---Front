import { useState, useEffect } from "react";
import {
  TrendingUp,
  DollarSign,
  CheckCircle,
  Filter,
  Loader2,
  Calendar,
} from "lucide-react";
import * as dashboardController from "@/controllers/superAdmin/DashboardController";
import { DashboardStats } from "@/models/DashboardStats";

interface FranchiseeStatsProps {
  franchiseeId: string;
}

export default function FranchiseeStats({
  franchiseeId,
}: FranchiseeStatsProps) {
  // Estado inicial zerado
  const [stats, setStats] = useState<DashboardStats>({
    moneyOnTable: 0,
    activeDealsCount: 0,
    closedSales: 0,
    closedDealsCount: 0,
  });

  const [filter, setFilter] = useState("month"); // Padrão: Mês (diagrama)
  const [loading, setLoading] = useState(false);

  // Formata moeda (R$)
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  // Busca dados na API sempre que o filtro ou ID mudar
  useEffect(() => {
    const loadStats = async () => {
      if (!franchiseeId) return;

      setLoading(true);
      try {
        const data = await dashboardController.getStats(franchiseeId, filter);
        setStats(data);
      } catch (error) {
        // Silencioso ou use toast aqui se preferir
      } finally {
        setLoading(false);
      }
    };

    loadStats();
  }, [franchiseeId, filter]);

  return (
    <div className="space-y-6 mb-8">
      {/* Cabeçalho do Bloco de Estatísticas */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-green-600 dark:text-green-400" />
            Performance Financeira
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Acompanhe o funil de vendas em tempo real
          </p>
        </div>

        {/* Dropdown de Filtro (Requisito do Diagrama) */}
        <div className="flex items-center gap-2 bg-white dark:bg-slate-800 p-1.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <Calendar className="w-4 h-4 text-slate-400 ml-2" />
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="bg-transparent border-none text-sm font-semibold text-slate-800 dark:text-slate-300 focus:ring-0 cursor-pointer py-1 pr-8 outline-none"
            disabled={loading}
          >
            <option value="today">Hoje</option>
            <option value="7days">Últimos 7 dias</option>
            <option value="month">Mês Atual</option>
          </select>
        </div>
      </div>

      {/* Grid de Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Card 1: Dinheiro na Mesa (FUP) */}
        <div className="relative bg-white dark:bg-slate-800 rounded-2xl p-6 border border-orange-100 dark:border-orange-900/30 shadow-sm hover:shadow-lg transition-all duration-300 group overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <DollarSign className="w-24 h-24 text-orange-500 transform rotate-12" />
          </div>

          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-orange-50 dark:bg-orange-900/20 rounded-lg text-orange-600 dark:text-orange-400">
                <DollarSign className="w-6 h-6" />
              </div>
              <span className="text-sm font-bold text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/20 px-2 py-1 rounded-full uppercase tracking-wide">
                Em Negociação
              </span>
            </div>

            <p className="text-slate-500 dark:text-slate-400 text-sm font-medium mb-1">
              Dinheiro na Mesa (Pipeline)
            </p>
            <h3 className="text-3xl font-bold text-slate-800 dark:text-slate-100 tracking-tight">
              {loading ? (
                <Loader2 className="animate-spin text-orange-500" />
              ) : (
                formatCurrency(stats.moneyOnTable)
              )}
            </h3>

            <div className="mt-4 flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
              <span className="font-bold text-slate-800 dark:text-slate-100">
                {stats.activeDealsCount}
              </span>
              oportunidades ativas
            </div>
          </div>
          {/* Barra de progresso decorativa */}
          <div className="absolute bottom-0 left-0 w-full h-1 bg-orange-100 dark:bg-orange-900/30">
            <div className="h-full bg-orange-500 w-2/3 rounded-r-full"></div>
          </div>
        </div>

        {/* Card 2: Negócios Fechados */}
        <div className="relative bg-white dark:bg-slate-800 rounded-2xl p-6 border border-emerald-100 dark:border-emerald-900/30 shadow-sm hover:shadow-lg transition-all duration-300 group overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <CheckCircle className="w-24 h-24 text-emerald-500 transform -rotate-12" />
          </div>

          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg text-emerald-600 dark:text-emerald-400">
                <TrendingUp className="w-6 h-6" />
              </div>
              <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 px-2 py-1 rounded-full uppercase tracking-wide">
                Convertido
              </span>
            </div>

            <p className="text-slate-500 dark:text-slate-400 text-sm font-medium mb-1">
              Total Vendido
            </p>
            <h3 className="text-3xl font-bold text-slate-800 dark:text-slate-100 tracking-tight">
              {loading ? (
                <Loader2 className="animate-spin text-emerald-500" />
              ) : (
                formatCurrency(stats.closedSales)
              )}
            </h3>

            <div className="mt-4 flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
              <span className="font-bold text-slate-800 dark:text-slate-100">
                {stats.closedDealsCount}
              </span>
              contratos fechados
            </div>
          </div>
          <div className="absolute bottom-0 left-0 w-full h-1 bg-emerald-100 dark:bg-emerald-900/30">
            <div className="h-full bg-emerald-500 w-full rounded-r-full"></div>
          </div>
        </div>

        {/* Card 3: Taxa de Conversão (Cálculo no Front) */}
        <div className="relative bg-gradient-to-br from-green-500 to-green-600 rounded-2xl p-6 text-white shadow-lg shadow-green-500/20 hover:shadow-xl transition-all duration-300">
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                <Filter className="w-6 h-6 text-white" />
              </div>
              <span className="text-xs font-bold bg-white/20 px-2 py-1 rounded-lg backdrop-blur-sm">
                EFICIÊNCIA
              </span>
            </div>

            <p className="text-green-100 text-sm font-medium mb-1">
              Taxa de Conversão
            </p>
            <h3 className="text-3xl font-bold tracking-tight">
              {loading
                ? "..."
                : stats.activeDealsCount + stats.closedDealsCount > 0
                  ? (
                      (stats.closedDealsCount /
                        (stats.activeDealsCount + stats.closedDealsCount)) *
                      100
                    ).toFixed(1) + "%"
                  : "0%"}
            </h3>

            <p className="mt-4 text-sm text-green-100 opacity-90">
              Baseado nas oportunidades criadas no período selecionado.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
