import { useState, useEffect, useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  CartesianGrid,
} from "recharts";
import {
  Calendar,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Search,
  LayoutGrid,
  CheckSquare,
  XSquare,
  ArrowUpRight,
  Filter,
  ArrowUpDown,
  MapPin,
  Crown,
  ArrowLeft,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { apiClient } from "@/lib/apiClient";

const url = apiClient.getBaseUrl();

// --- INTERFACES ---
interface RankingData {
  franchiseeId: string;
  franchiseeName: string;
  state: string;
  uf: string;
  plan: string;
  totalSales: number;
  totalLost: number;
  totalPipeline: number;
}

interface TrendData {
  month: string;
  sales: number;
  lost: number;
}

interface DealItem {
  leadName: string;
  franchiseeName: string;
  value: number;
  // Correção: Permitir null ou undefined para evitar quebra se o banco trouxer nulo
  status: string | null;
  date: string;
}

const formatMoney = (val: number) =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  }).format(val || 0);

const formatDate = (date: string) => new Date(date).toLocaleDateString("pt-BR");

export default function GeneralAnalytics() {
  const navigate = useNavigate();

  // --- ESTADOS DE DADOS ---
  const [rankingData, setRankingData] = useState<RankingData[]>([]);
  const [trendData, setTrendData] = useState<TrendData[]>([]);
  const [funnelData, setFunnelData] = useState<any[]>([]);
  const [dealsList, setDealsList] = useState<DealItem[]>([]);

  // --- ESTADOS DE FILTRO GLOBAIS ---
  const [startDate, setStartDate] = useState(
    new Date().toISOString().slice(0, 7) + "-01",
  );
  const [endDate, setEndDate] = useState(new Date().toISOString().slice(0, 10));

  // --- ESTADOS DE FILTRO LOCAL ---
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFranchisees, setSelectedFranchisees] = useState<string[]>([]);
  const [filterUf, setFilterUf] = useState("ALL");
  const [filterPlan, setFilterPlan] = useState("ALL");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // --- CARREGAMENTO DE DADOS ---
  useEffect(() => {
    fetchRanking();
    fetchFunnel();
    fetchDeals();
  }, [startDate, endDate, selectedFranchisees]);

  useEffect(() => {
    fetchTrend();
  }, [selectedFranchisees]);

  // --- FUNÇÕES DE FETCH (API) ---
  const getQueryParams = () => {
    let params = `?startDate=${startDate}&endDate=${endDate}`;
    if (selectedFranchisees.length > 0) {
      params +=
        "&" + selectedFranchisees.map((id) => `franchiseeIds=${id}`).join("&");
    }
    return params;
  };

  const fetchRanking = async () => {
    try {
      const res = await apiClient.get(
        `${url}/analytics/ranking?startDate=${startDate}&endDate=${endDate}`,
      );
      const json = await res.json();
      setRankingData(json);
    } catch (error) {
      console.error("Erro ranking:", error);
    }
  };

  const fetchTrend = async () => {
    try {
      let queryParams = "";
      if (selectedFranchisees.length > 0) {
        queryParams =
          "?" +
          selectedFranchisees.map((id) => `franchiseeIds=${id}`).join("&");
      }
      const res = await apiClient.get(`${url}/analytics/trend${queryParams}`);
      const json = await res.json();
      setTrendData(json);
    } catch (error) {
      console.error("Erro trend:", error);
    }
  };

  const fetchFunnel = async () => {
    try {
      const res = await apiClient.get(
        `${url}/analytics/funnel${getQueryParams()}`,
      );
      const json = await res.json();
      const formatted = Object.entries(json).map(([stage, count]) => ({
        stage,
        count: Number(count),
        fill: stage === "Fechados" ? "#16a34a" : "#cbd5e1",
      }));
      setFunnelData(formatted);
    } catch (error) {
      console.error("Erro funnel:", error);
    }
  };

  const fetchDeals = async () => {
    try {
      const res = await apiClient.get(
        `${url}/analytics/deals${getQueryParams()}`,
      );
      const json = await res.json();
      setDealsList(json);
    } catch (error) {
      console.error("Erro deals:", error);
    }
  };

  // --- PROCESSAMENTO E CÁLCULOS ---
  const processedData = useMemo(() => {
    let data = rankingData;

    if (searchTerm)
      data = data.filter((f) =>
        f.franchiseeName.toLowerCase().includes(searchTerm.toLowerCase()),
      );
    if (filterUf !== "ALL") data = data.filter((f) => f.uf === filterUf);
    if (filterPlan !== "ALL") data = data.filter((f) => f.plan === filterPlan);

    if (selectedFranchisees.length > 0) {
      data = data.filter((f) => selectedFranchisees.includes(f.franchiseeId));
    }

    return data.sort((a, b) => {
      const valA = a.totalSales || 0;
      const valB = b.totalSales || 0;
      return sortOrder === "desc" ? valB - valA : valA - valB;
    });
  }, [
    rankingData,
    searchTerm,
    filterUf,
    filterPlan,
    selectedFranchisees,
    sortOrder,
  ]);

  const uniqueUfs = Array.from(new Set(rankingData.map((d) => d.uf))).sort();

  // Totais Gerais
  const totalSales = processedData.reduce(
    (acc, curr) => acc + curr.totalSales,
    0,
  );
  const totalLost = processedData.reduce(
    (acc, curr) => acc + curr.totalLost,
    0,
  );
  const totalPipeline = processedData.reduce(
    (acc, curr) => acc + curr.totalPipeline,
    0,
  );

  // Eficiência
  const totalDealsVolume = funnelData.reduce(
    (acc, curr) => acc + curr.count,
    0,
  );
  const closedCount =
    funnelData.find((f) => f.stage === "Fechados")?.count || 0;
  const conversionRate =
    totalDealsVolume > 0
      ? ((closedCount / totalDealsVolume) * 100).toFixed(1)
      : "0.0";
  const avgTicket = closedCount > 0 ? totalSales / closedCount : 0;

  // Dados Pizza
  const pieData = [
    { name: "Vendas", value: totalSales, color: "#16a34a" },
    { name: "Perdas", value: totalLost, color: "#ef4444" },
    { name: "Pipeline", value: totalPipeline, color: "#3b82f6" },
  ].filter((d) => d.value > 0);

  // Listas Detalhadas (Top 10 Recentes)
  const wonDeals = dealsList
    .filter((d) => d.status === "CLOSED_WON")
    .slice(0, 10);
  const lostDeals = dealsList
    .filter((d) => d.status === "CLOSED_LOST")
    .slice(0, 10);
  const openDeals = dealsList
    .filter((d) => d.status !== "CLOSED_WON" && d.status !== "CLOSED_LOST")
    .slice(0, 10);

  const toggleComparison = (id: string) => {
    if (selectedFranchisees.includes(id)) {
      setSelectedFranchisees((prev) => prev.filter((x) => x !== id));
    } else {
      setSelectedFranchisees((prev) => [...prev, id]);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950 p-4 md:p-6 space-y-6">
      {/* --- HEADER --- */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate("/superadmin")}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors border border-transparent hover:border-slate-200 dark:hover:border-slate-700 group"
            title="Voltar ao Painel Principal"
          >
            <ArrowLeft className="w-6 h-6 text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-200" />
          </button>

          <div>
            <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <LayoutGrid className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              Analytics Global
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
              {selectedFranchisees.length === 0
                ? `Visualizando ${processedData.length} franqueados`
                : `Comparando ${selectedFranchisees.length} selecionados`}
            </p>
          </div>
        </div>

        {/* Seletores de Data */}
        <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 p-1.5 rounded-xl border border-slate-200 dark:border-slate-700">
          <Calendar className="w-4 h-4 text-slate-500 ml-2" />
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="bg-transparent text-sm outline-none text-slate-600 dark:text-slate-300 w-28 md:w-auto"
          />
          <span className="text-slate-300">|</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="bg-transparent text-sm outline-none text-slate-600 dark:text-slate-300 w-28 md:w-auto"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        {/* --- COLUNA ESQUERDA: SIDEBAR (FILTROS) --- */}
        <div className="xl:col-span-1 space-y-4">
          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 flex flex-col h-[calc(100vh-200px)] sticky top-6">
            <div className="space-y-3 mb-4 border-b border-slate-100 pb-4">
              <h3 className="font-bold text-slate-700 dark:text-slate-200 text-sm flex items-center gap-2">
                <Filter className="w-4 h-4 text-slate-500" /> Filtros &
                Ordenação
              </h3>

              <div className="relative">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Buscar nome..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-slate-100"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="relative">
                  <select
                    value={filterUf}
                    onChange={(e) => setFilterUf(e.target.value)}
                    className="w-full pl-2 pr-6 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs outline-none appearance-none cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300"
                  >
                    <option value="ALL">Todos Estados</option>
                    {uniqueUfs.map((uf) => (
                      <option key={uf} value={uf}>
                        {uf}
                      </option>
                    ))}
                  </select>
                  <MapPin className="absolute right-2 top-2.5 w-3 h-3 text-slate-400 pointer-events-none" />
                </div>

                <div className="relative">
                  <select
                    value={filterPlan}
                    onChange={(e) => setFilterPlan(e.target.value)}
                    className="w-full pl-2 pr-6 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs outline-none appearance-none cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300"
                  >
                    <option value="ALL">Todos Planos</option>
                    <option value="PREMIUM">Premium</option>
                    <option value="BASIC">Basic</option>
                  </select>
                  <Crown className="absolute right-2 top-2.5 w-3 h-3 text-slate-400 pointer-events-none" />
                </div>
              </div>

              <button
                onClick={() =>
                  setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"))
                }
                className="w-full flex items-center justify-between px-3 py-2 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-300 transition-colors"
              >
                <span className="flex items-center gap-2">
                  <ArrowUpDown className="w-3 h-3" /> Ordenar por Vendas
                </span>
                <span>
                  {sortOrder === "desc"
                    ? "Maior Primeiro ⬇"
                    : "Menor Primeiro ⬆"}
                </span>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
              <p className="text-[10px] text-slate-400 uppercase font-bold mb-2 px-1">
                Selecione para comparar ({selectedFranchisees.length})
              </p>

              {rankingData
                .filter(
                  (f) =>
                    (filterUf === "ALL" || f.uf === filterUf) &&
                    (filterPlan === "ALL" || f.plan === filterPlan) &&
                    f.franchiseeName
                      .toLowerCase()
                      .includes(searchTerm.toLowerCase()),
                )
                .sort((a, b) =>
                  sortOrder === "desc"
                    ? b.totalSales - a.totalSales
                    : a.totalSales - b.totalSales,
                )
                .map((item) => (
                  <div
                    key={item.franchiseeId}
                    onClick={() => toggleComparison(item.franchiseeId)}
                    className={`p-2.5 rounded-lg border cursor-pointer transition-all flex justify-between items-center group relative ${
                      selectedFranchisees.includes(item.franchiseeId)
                        ? "bg-blue-50 dark:bg-blue-900/20 border-blue-400 dark:border-blue-600 ring-1 ring-blue-400 dark:ring-blue-600 z-10"
                        : "bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 hover:border-slate-300"
                    }`}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p
                          className={`font-semibold text-xs truncate ${
                            selectedFranchisees.includes(item.franchiseeId)
                              ? "text-blue-700 dark:text-blue-400"
                              : "text-slate-700 dark:text-slate-200"
                          }`}
                        >
                          {item.franchiseeName}
                        </p>
                      </div>
                      <p className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-1">
                        <span className="bg-slate-100 px-1 rounded">
                          {item.uf}
                        </span>
                        <span>{formatMoney(item.totalSales)}</span>
                      </p>
                    </div>
                    {selectedFranchisees.includes(item.franchiseeId) && (
                      <CheckSquare className="w-4 h-4 text-blue-600 ml-2 flex-shrink-0" />
                    )}
                  </div>
                ))}

              {rankingData.length === 0 && (
                <p className="text-center text-slate-400 text-xs py-4">
                  Nenhum dado encontrado.
                </p>
              )}
            </div>

            {selectedFranchisees.length > 0 && (
              <button
                onClick={() => setSelectedFranchisees([])}
                className="mt-4 w-full py-2.5 text-xs font-bold text-red-500 hover:bg-red-50 border border-transparent hover:border-red-100 rounded-lg flex items-center justify-center gap-2 transition-all"
              >
                <XSquare className="w-3 h-3" /> Limpar Comparação
              </button>
            )}
          </div>
        </div>

        {/* --- COLUNA DIREITA: DASHBOARD --- */}
        <div className="xl:col-span-3 space-y-6">
          {/* 1. KPIs GERAIS */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <KPICard
              title="Total Vendas"
              value={totalSales}
              color="green"
              icon={TrendingUp}
            />
            <KPICard
              title="Total Pipeline"
              value={totalPipeline}
              color="blue"
              icon={DollarSign}
            />
            <KPICard
              title="Total Perdido"
              value={totalLost}
              color="red"
              icon={TrendingDown}
            />
          </div>

          {/* 2. EFICIÊNCIA DO NEGÓCIO */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 flex flex-col justify-center items-center text-center relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-400 to-purple-500"></div>
              <p className="text-sm font-bold text-slate-500 uppercase tracking-wide mb-2">
                Taxa de Conversão Global
              </p>
              <h3 className="text-4xl font-extrabold text-slate-800 dark:text-slate-100">
                {conversionRate}%
              </h3>
              <p className="text-xs text-slate-400 mt-2">
                De todos os leads iniciados, quantos fecharam.
              </p>
              <div className="w-full bg-slate-100 rounded-full h-2 mt-4 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-blue-400 to-purple-500 h-full rounded-full"
                  style={{
                    width: `${
                      Number(conversionRate) > 100 ? 100 : conversionRate
                    }%`,
                  }}
                ></div>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 flex flex-col justify-center items-center text-center relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-green-600 to-teal-500"></div>
              <p className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2">
                Ticket Médio por Venda
              </p>
              <h3 className="text-3xl font-extrabold text-slate-800 dark:text-slate-100">
                {formatMoney(avgTicket)}
              </h3>
              <p className="text-xs text-slate-400 mt-2">
                Valor médio de cada contrato fechado.
              </p>
              <div className="mt-4 flex gap-2 text-xs">
                <span className="bg-green-50 text-green-700 px-2 py-1 rounded-md font-bold">
                  Métrica de Qualidade
                </span>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800">
              <h3 className="font-bold text-slate-700 dark:text-slate-200 mb-4 text-sm">
                Gargalos do Funil
              </h3>
              <div className="h-[140px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={funnelData}
                    layout="vertical"
                    margin={{ left: 20, right: 20 }}
                  >
                    <XAxis type="number" hide />
                    <YAxis
                      dataKey="stage"
                      type="category"
                      width={80}
                      tick={{ fontSize: 10 }}
                      interval={0}
                    />
                    <RechartsTooltip cursor={{ fill: "transparent" }} />
                    <Bar dataKey="count" radius={[0, 4, 4, 0]} barSize={20}>
                      {funnelData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* 3. GRÁFICO DE TENDÊNCIA */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-2">
              <div>
                <h3 className="font-bold text-slate-700 dark:text-slate-200 flex items-center gap-2">
                  <ArrowUpRight className="w-5 h-5 text-purple-500 dark:text-purple-400" />
                  Tendência{" "}
                  {selectedFranchisees.length > 0 ? "Comparativa" : "da Rede"}
                </h3>
                <p className="text-xs text-slate-400">
                  Evolução de ganhos e perdas nos últimos 6 meses
                </p>
              </div>
            </div>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={trendData}
                  margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#16a34a" stopOpacity={0.1} />
                      <stop offset="95%" stopColor="#16a34a" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorLost" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.1} />
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis
                    dataKey="month"
                    tick={{ fontSize: 12 }}
                    stroke="#94a3b8"
                  />
                  <YAxis
                    tickFormatter={(val) => `${(val / 1000).toFixed(0)}k`}
                    stroke="#94a3b8"
                    fontSize={12}
                  />
                  <RechartsTooltip
                    formatter={(val: number) => formatMoney(val)}
                    contentStyle={{
                      borderRadius: "8px",
                      border: "none",
                      boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                    }}
                  />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="sales"
                    name="Vendas"
                    stroke="#16a34a"
                    fillOpacity={1}
                    fill="url(#colorSales)"
                    strokeWidth={2}
                  />
                  <Area
                    type="monotone"
                    dataKey="lost"
                    name="Perdas"
                    stroke="#ef4444"
                    fillOpacity={1}
                    fill="url(#colorLost)"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* 4. RANKING E DISTRIBUIÇÃO */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* RANKING */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 flex flex-col">
              <h3 className="font-bold text-slate-700 dark:text-slate-200 mb-2">
                Ranking de Vendas
              </h3>
              <p className="text-xs text-slate-400 mb-6">
                Top performances do período selecionado
              </p>
              <div className="flex-1 min-h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={processedData.slice(0, 8)}
                    layout="vertical"
                    margin={{ left: 20 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      horizontal={true}
                      vertical={false}
                      stroke="#f1f5f9"
                    />
                    <XAxis type="number" hide />
                    <YAxis
                      dataKey="franchiseeName"
                      type="category"
                      width={100}
                      tick={{ fontSize: 10, fill: "#64748b" }}
                      interval={0}
                    />
                    <RechartsTooltip
                      cursor={{ fill: "#f8fafc" }}
                      formatter={(val: number) => formatMoney(val)}
                      contentStyle={{ borderRadius: "8px" }}
                    />
                    <Bar
                      dataKey="totalSales"
                      fill="#16a34a"
                      radius={[0, 4, 4, 0]}
                      barSize={20}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* DISTRIBUIÇÃO */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 flex flex-col">
              <h3 className="font-bold text-slate-700 dark:text-slate-200 mb-2">
                Distribuição Financeira
              </h3>
              <p className="text-xs text-slate-400 mb-6">
                Proporção de Ganhos vs Perdas vs Pipeline
              </p>
              <div className="flex-1 min-h-[300px] flex items-center justify-center">
                {pieData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <RechartsTooltip
                        formatter={(val: number) => formatMoney(val)}
                      />
                      <Legend verticalAlign="bottom" iconType="circle" />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="text-center">
                    <div className="bg-slate-50 p-4 rounded-full inline-block mb-2">
                      <DollarSign className="w-6 h-6 text-slate-300" />
                    </div>
                    <p className="text-slate-400 text-sm">
                      Sem dados financeiros
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 5. LISTAS DE TRANSAÇÕES RECENTES */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* VENDAS */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-green-100 dark:border-green-900/30 overflow-hidden flex flex-col">
              <div className="p-4 border-b border-green-100  flex items-center justify-between">
                <h3 className="font-bold text-green-800 text-sm flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-600"></div>{" "}
                  Últimas Vendas
                </h3>
              </div>
              <div className="divide-y divide-slate-100 overflow-y-auto max-h-[400px]">
                {wonDeals.length === 0 ? (
                  <p className="p-4 text-xs text-slate-400 text-center">
                    Nenhuma venda no período.
                  </p>
                ) : (
                  wonDeals.map((deal, i) => (
                    <div
                      key={i}
                      className="p-3 hover:bg-green-50/30 transition-colors"
                    >
                      <div className="flex justify-between items-start">
                        <p
                          className="font-bold text-slate-700 text-xs truncate w-32"
                          title={deal.leadName}
                        >
                          {deal.leadName}
                        </p>
                        <p className="font-bold text-green-600 text-xs">
                          {formatMoney(deal.value)}
                        </p>
                      </div>
                      <div className="flex justify-between items-end mt-1">
                        <p className="text-[10px] text-slate-400 truncate w-32">
                          {deal.franchiseeName}
                        </p>
                        <p className="text-[10px] text-slate-400">
                          {formatDate(deal.date)}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* EM NEGOCIAÇÃO */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-blue-100 dark:border-blue-900/30 overflow-hidden flex flex-col">
              <div className="p-4 border-b border-blue-100  flex items-center justify-between">
                <h3 className="font-bold text-blue-800 text-sm flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-blue-500"></div> Em
                  Andamento
                </h3>
              </div>
              <div className="divide-y divide-slate-100 overflow-y-auto max-h-[400px]">
                {openDeals.length === 0 ? (
                  <p className="p-4 text-xs text-slate-400 text-center">
                    Nenhuma negociação ativa.
                  </p>
                ) : (
                  openDeals.map((deal, i) => (
                    <div
                      key={i}
                      className="p-3 hover:bg-blue-50/30 transition-colors"
                    >
                      <div className="flex justify-between items-start">
                        <p
                          className="font-bold text-slate-700 text-xs truncate w-32"
                          title={deal.leadName}
                        >
                          {deal.leadName}
                        </p>
                        <p className="font-bold text-blue-600 text-xs">
                          {formatMoney(deal.value)}
                        </p>
                      </div>
                      <div className="flex justify-between items-center mt-1">
                        <p className="text-[10px] text-slate-400 truncate w-32">
                          {deal.franchiseeName}
                        </p>
                        <span className="text-[9px] uppercase font-bold bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">
                          {deal.status
                            ? deal.status.replace("_", " ")
                            : "INDEFINIDO"}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* PERDAS */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-red-100 dark:border-red-900/30 overflow-hidden flex flex-col">
              <div className="p-4 border-b border-red-100  flex items-center justify-between">
                <h3 className="font-bold text-red-800 text-sm flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-red-500"></div> Perdas
                  Recentes
                </h3>
              </div>
              <div className="divide-y divide-slate-100 overflow-y-auto max-h-[400px]">
                {lostDeals.length === 0 ? (
                  <p className="p-4 text-xs text-slate-400 text-center">
                    Nenhuma perda registrada.
                  </p>
                ) : (
                  lostDeals.map((deal, i) => (
                    <div
                      key={i}
                      className="p-3 hover:bg-red-50/30 transition-colors"
                    >
                      <div className="flex justify-between items-start">
                        <p
                          className="font-bold text-slate-700 text-xs truncate w-32"
                          title={deal.leadName}
                        >
                          {deal.leadName}
                        </p>
                        <p className="font-bold text-red-500 text-xs line-through opacity-70">
                          {formatMoney(deal.value)}
                        </p>
                      </div>
                      <div className="flex justify-between items-end mt-1">
                        <p className="text-[10px] text-slate-400 truncate w-32">
                          {deal.franchiseeName}
                        </p>
                        <p className="text-[10px] text-slate-400">
                          {formatDate(deal.date)}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Componente Card Simples
function KPICard({ title, value, color, icon: Icon }: any) {
  const colors: any = {
    green: "text-green-600 bg-green-50 border-green-100",
    blue: "text-blue-600 bg-blue-50 border-blue-100",
    red: "text-red-600 bg-red-50 border-red-100",
  };
  // @ts-ignore
  const theme = colors[color] || colors.blue;

  return (
    <div
      className={`p-5 rounded-2xl border shadow-sm flex items-center justify-between bg-white dark:bg-slate-900 ${
        theme.split(" ")[2]
      } dark:border-slate-800`}
    >
      <div>
        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
          {title}
        </p>
        <p className={`text-xl font-bold mt-1 ${theme.split(" ")[0]}`}>
          {formatMoney(value)}
        </p>
      </div>
      <div className={`p-3 rounded-xl ${theme.split(" ")[1]}`}>
        <Icon className={`w-5 h-5 ${theme.split(" ")[0]}`} />
      </div>
    </div>
  );
}
