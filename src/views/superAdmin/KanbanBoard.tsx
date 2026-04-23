import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  MoreHorizontal,
  Calendar,
  Users,
  TrendingUp,
  Loader2,
  Filter,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import LeadModal from "@/components/Franchisee/LeadModal";
import { apiClient } from "@/lib/apiClient";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const url = apiClient.getBaseUrl();

// Configuração de cores e títulos das colunas
const COLUMNS: Record<string, { title: string; color: string }> = {
  NEW_LEAD: {
    title: "Novos Leads",
    color: "border-blue-500 bg-blue-50 dark:bg-blue-900/10",
  },
  QUALIFIED: {
    title: "Qualificado",
    color: "border-indigo-500 bg-indigo-50 dark:bg-indigo-900/10",
  },
  VISIT_SCHEDULED: {
    title: "Visita Agendada",
    color: "border-purple-500 bg-purple-50 dark:bg-purple-900/10",
  },
  PROPOSAL_SENT: {
    title: "Proposta Enviada",
    color: "border-orange-500 bg-orange-50 dark:bg-orange-900/10",
  },
  NEGOTIATION: {
    title: "Negociação",
    color: "border-amber-500 bg-amber-50 dark:bg-amber-900/10",
  },
  CLOSED_WON: {
    title: "Venda Fechada",
    color: "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/10",
  },
  CLOSED_LOST: {
    title: "Perdido",
    color: "border-red-500 bg-red-50 dark:bg-red-900/10",
  },
};

const formatMoney = (value: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
    value,
  );

export default function KanbanView() {
  const { franchiseeId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [deals, setDeals] = useState<any[]>([]);
  const [franchiseeName, setFranchiseeName] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);

  // Filtro de Tempo (Padrão: 30 dias)
  const [timeFilter, setTimeFilter] = useState("ALL");

  // Estados para Visualizar Lead (Modal)
  const [isLeadModalOpen, setIsLeadModalOpen] = useState(false);
  const [leadFormData, setLeadFormData] = useState({
    name: "",
    email: "",
    phone: "",
    leadType: "LEAD",
  });

  useEffect(() => {
    if (franchiseeId) {
      fetchDeals();
      fetchFranchiseeDetails();
    }
  }, [franchiseeId]);

  const fetchDeals = async () => {
    try {
      const response = await apiClient.get(
        `${url}/deals?franchiseeId=${franchiseeId}`,
      );
      if (!response.ok) throw new Error("Falha ao buscar dados");
      const data = await response.json();
      const validStatuses = Object.keys(COLUMNS);
      setDeals(data.filter((d: any) => validStatuses.includes(d.status)));
    } catch (error) {
      console.error(error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os negócios.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchFranchiseeDetails = async () => {
    try {
      const response = await apiClient.get(`${url}/franchisee/${franchiseeId}`);

      if (response.ok) {
        const data = await response.json();
        setFranchiseeName(data.name || data.franchisee?.name || "Franqueado");
      }
    } catch (error) {
      console.error("Erro ao buscar nome do franqueado", error);
      setFranchiseeName("Franqueado");
    }
  };

  // --- LÓGICA DE FILTRAGEM DE TEMPO ---
  const filteredDeals = useMemo(() => {
    if (timeFilter === "ALL") return deals;

    const daysAgo = parseInt(timeFilter);
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysAgo);

    return deals.filter((deal) => {
      const dateString = deal.createdAt || deal.created_at;
      if (!dateString) return false;

      const dealDate = new Date(dateString);
      return dealDate >= cutoffDate;
    });
  }, [deals, timeFilter]);

  const getDealsByStatus = (status: string) =>
    filteredDeals.filter((deal) => deal.status === status);

  const totalPipeline = filteredDeals.reduce((acc, d) => {
    if (d.status !== "CLOSED_LOST" && d.status !== "CLOSED_WON")
      return acc + (d.value || 0);
    return acc;
  }, 0);

  // --- FUNÇÕES PARA O LEAD MODAL ---
  const handleOpenLead = (deal: any) => {
    if (!deal.lead) {
      toast({
        title: "Erro",
        description: "Este card não tem um lead vinculado.",
        variant: "destructive",
      });
      return;
    }
    setLeadFormData({
      name: deal.lead.name || "",
      email: deal.lead.email || "",
      phone: deal.lead.phone || "",
      leadType: deal.lead.type || "LEAD",
    });
    setIsLeadModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col transition-colors duration-300">
      {/* HEADER */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 py-4 flex flex-col md:flex-row items-center justify-between sticky top-0 z-10 gap-4 shadow-sm">
        <div className="flex items-center gap-4 w-full md:w-auto">
          <button
            onClick={() => navigate("/superadmin")}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors group"
          >
            <ArrowLeft className="w-5 h-5 text-slate-600 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              Pipeline:{" "}
              <span className="text-emerald-600 dark:text-emerald-400">
                {franchiseeName || "Carregando..."}
              </span>
            </h1>
            <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="w-3 h-3 animate-spin" /> Carregando
                  dados...
                </div>
              ) : (
                <>
                  <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                  {filteredDeals.length} oportunidades filtradas
                </>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-end">
          {/* FILTRO DE TEMPO */}
          <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2 h-10 shadow-sm">
            <Filter className="w-4 h-4 text-slate-500" />
            <Select value={timeFilter} onValueChange={setTimeFilter}>
              <SelectTrigger className="border-none shadow-none focus:ring-0 w-[130px] h-8 bg-transparent text-xs font-bold text-slate-700 dark:text-slate-300 p-0">
                <SelectValue placeholder="Período" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">Últimos 7 dias</SelectItem>
                <SelectItem value="30">Últimos 30 dias</SelectItem>
                <SelectItem value="90">Últimos 90 dias</SelectItem>
                <SelectItem value="ALL">Todo o período</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="hidden md:flex flex-col items-end mr-2 ml-2 border-r pr-4 border-slate-200 dark:border-slate-700 h-8 justify-center">
            <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider leading-none mb-1">
              Pipeline Ativo
            </p>
            <p className="font-black text-green-600 dark:text-green-400 text-sm flex items-center gap-1 leading-none">
              <TrendingUp className="w-3 h-3" />
              {formatMoney(totalPipeline)}
            </p>
          </div>

          <button
            onClick={() => navigate(`/dashboard/leads/${franchiseeId}`)}
            className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 px-4 py-2.5 rounded-xl flex items-center gap-2 text-sm font-bold transition-all shadow-sm"
          >
            <Users className="w-4 h-4" />
            <span className="hidden sm:inline">Gerenciar Leads</span>
          </button>
        </div>
      </div>

      {/* BOARD ESTÁTICO */}
      <div className="flex-1 overflow-x-auto overflow-y-hidden bg-slate-50 dark:bg-slate-950">
        <div className="h-full p-6 inline-flex items-start gap-4">
          {Object.entries(COLUMNS).map(([columnId, column]) => {
            const columnDeals = getDealsByStatus(columnId);
            const borderColorClass = column.color.split(" ")[0];

            return (
              <div
                key={columnId}
                className="w-80 flex flex-col h-full max-h-[calc(100vh-140px)]"
              >
                {/* HEADER DA COLUNA */}
                <div
                  className={`flex items-center justify-between p-3 rounded-t-xl border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm border-t-4 ${borderColorClass}`}
                >
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-700 dark:text-slate-200 text-sm uppercase tracking-wide">
                      {column.title}
                    </span>
                    <span className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-xs px-2 py-0.5 rounded-full font-bold">
                      {columnDeals.length}
                    </span>
                  </div>
                </div>

                {/* CORPO DA COLUNA */}
                <div className="flex-1 p-2 rounded-b-xl transition-colors overflow-y-auto scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-700 bg-slate-100/50 dark:bg-slate-900/50 border-x border-b border-slate-200 dark:border-slate-800">
                  {columnDeals.length === 0 ? (
                    <div className="h-24 flex items-center justify-center text-xs text-slate-400 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-lg m-2">
                      Vazio
                    </div>
                  ) : (
                    columnDeals.map((deal) => (
                      <div
                        key={deal.id}
                        className="bg-white dark:bg-slate-800 p-4 mb-3 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 group hover:shadow-md transition-all hover:border-slate-300 dark:hover:border-slate-600 cursor-default"
                      >
                        <div className="flex justify-between items-start mb-3">
                          <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-700/50 px-2 py-1 rounded-md uppercase truncate max-w-[180px]">
                            {deal.title}
                          </span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenLead(deal);
                            }}
                            className="text-slate-300 dark:text-slate-600 hover:text-slate-900 dark:hover:text-white p-1 transition-colors rounded hover:bg-slate-100 dark:hover:bg-slate-700"
                            title="Ver detalhes"
                          >
                            <MoreHorizontal className="w-4 h-4" />
                          </button>
                        </div>
                        <h4 className="font-bold text-slate-800 dark:text-slate-100 text-sm mb-1 line-clamp-2 leading-tight">
                          {deal.lead?.name || "Cliente sem nome"}
                        </h4>
                        <div className="flex items-center gap-1 text-green-700 dark:text-green-400 font-extrabold text-lg mb-4">
                          {formatMoney(deal.value)}
                        </div>

                        {/* FOOTER DO CARD (Sem ícones de contato) */}
                        <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 pt-3 border-t border-slate-50 dark:border-slate-700/50">
                          <div
                            className="flex items-center gap-1 font-medium"
                            title={`Criado em: ${new Date(deal.createdAt).toLocaleString()}`}
                          >
                            <Calendar className="w-3 h-3 text-slate-400" />{" "}
                            {deal.createdAt
                              ? new Date(deal.createdAt).toLocaleDateString(
                                  "pt-BR",
                                )
                              : "--/--"}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* MODAL DE VISUALIZAÇÃO APENAS (LeadModal em mode="view") */}
      <LeadModal
        isOpen={isLeadModalOpen}
        onClose={() => setIsLeadModalOpen(false)}
        onSave={async () => {}} // Função vazia pois é apenas visualização
        formData={leadFormData}
        setFormData={setLeadFormData}
        mode="view"
        isSaving={false}
      />
    </div>
  );
}
