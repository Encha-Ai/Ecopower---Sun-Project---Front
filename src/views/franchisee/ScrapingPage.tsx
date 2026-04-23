import { useState, useEffect, useMemo, useCallback } from "react";
import {
  Search,
  MapPin,
  Database,
  Lock,
  Zap,
  History,
  Play,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Coins,
  RefreshCw,
  Eye,
  Download,
  X,
  ArrowUpDown,
  Filter,
  Trash2,
  Save,
  CheckSquare,
  Square,
  User,
  UserCheck,
  Briefcase,
  Globe,
  Brain,
  KanbanSquare, // Icone para o funil
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import FranchiseeLayout from "@/components/Franchisee/FranchiseeLayout";
import { apiClient } from "@/lib/apiClient";
import PremiumLockScreen from "@/components/Franchisee/PremiumLoockScreen";

const url = apiClient.getBaseUrl();

// --- FUNÇÃO AUXILIAR PARA ADICIONAR 55 ---
const normalizePhoneWithCountryCode = (phone: string | null | undefined) => {
  if (!phone) return "";

  // Remove tudo que não é número
  const digits = phone.replace(/\D/g, "");

  if (!digits) return "";

  // Se já começar com 55 e tiver tamanho suficiente, mantemos.
  // Se não, adicionamos o 55.
  if (digits.startsWith("55") && digits.length > 11) {
    return digits;
  }

  return `55${digits}`;
};

// --- MODAL DE RESULTADOS ---
const ResultsModal = ({
  isOpen,
  onClose,
  request,
  leads,
  isLoading,
  onImportSuccess,
  franchiseeId,
  pipelines = [], // Recebe a lista de funis
}: any) => {
  const { toast } = useToast();

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [rowTypes, setRowTypes] = useState<Record<string, string>>({});

  // Estado para o funil selecionado
  const [selectedPipelineId, setSelectedPipelineId] = useState("");
  const [isImporting, setIsImporting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setSelectedIds(new Set());
      setRowTypes({});
      // Seleciona o primeiro funil automaticamente se houver
      if (pipelines.length > 0) {
        setSelectedPipelineId(pipelines[0].id);
      }
    }
  }, [isOpen, pipelines]);

  if (!isOpen) return null;

  const toggleSelectAll = () => {
    if (selectedIds.size === leads.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(leads.map((l: any) => l.id)));
    }
  };

  const toggleSelectOne = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedIds(newSet);
  };

  const handleTypeChange = (id: string, newType: string) => {
    setRowTypes((prev) => ({ ...prev, [id]: newType }));

    if (!selectedIds.has(id)) {
      const newSet = new Set(selectedIds);
      newSet.add(id);
      setSelectedIds(newSet);
    }
  };

  const handleImportLeads = async () => {
    if (selectedIds.size === 0) return;
    if (!selectedPipelineId) {
      toast({
        title: "Selecione um Funil",
        description: "Você precisa escolher para qual funil enviar os leads.",
        variant: "destructive",
      });
      return;
    }

    setIsImporting(true);

    let successCount = 0;
    let errorCount = 0;

    try {
      const promises = Array.from(selectedIds).map(async (id) => {
        const typeToSend = rowTypes[id] || "LEAD";

        // Pega o lead atual para garantir o telefone formatado
        const currentLead = leads.find((l: any) => l.id === id);
        const phoneToSend = currentLead ? currentLead.phone : "";

        try {
          // 1. Atualiza dados básicos do Lead (Tipo e Telefone)
          await apiClient.put(`${url}/leads/${id}`, {
            leadType: typeToSend,
            phone: phoneToSend,
          });

          // 2. Adiciona o Lead ao Funil Selecionado (Cria o Deal)
          const res = await apiClient.post(
            `${url}/api/pipelines/${selectedPipelineId}/add-lead/${id}`,
          );

          if (res.ok) successCount++;
          else errorCount++;
        } catch (e) {
          errorCount++;
        }
      });

      await Promise.all(promises);

      toast({
        title: "Importação Concluída",
        description: `${successCount} registros enviados para o funil. ${
          errorCount > 0 ? `${errorCount} falhas.` : ""
        }`,
        variant: successCount > 0 ? "default" : "destructive",
      });

      if (successCount > 0) {
        onImportSuccess?.();
        onClose();
      }
    } catch (error) {
      console.error(error);
      toast({
        title: "Erro crítico",
        description: "Falha na conexão.",
        variant: "destructive",
      });
    } finally {
      setIsImporting(false);
    }
  };

  const downloadCSV = () => {
    if (!leads || leads.length === 0) return;

    const leadsToExport =
      selectedIds.size > 0
        ? leads.filter((l: any) => selectedIds.has(l.id))
        : leads;

    const headers = ["Nome", "Telefone", "Email", "Tipo Escolhido", "Data"];
    const csvContent = [
      headers.join(","),
      ...leadsToExport.map((lead: any) => {
        const type = rowTypes[lead.id] || "LEAD";
        return [
          `"${lead.name || ""}"`,
          `"${lead.phone || ""}"`,
          `"${lead.email || ""}"`,
          `"${type}"`,
          `"${new Date(lead.createdAt).toLocaleDateString()}"`,
        ].join(",");
      }),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const fileUrl = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", fileUrl);
    link.setAttribute(
      "download",
      `leads_google_${request?.keywords}_${new Date().getTime()}.csv`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-xl shadow-2xl w-full max-w-6xl max-h-[85vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        {/* HEADER */}
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-900">
          <div>
            <h3 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
              <Database className="w-5 h-5 text-green-600 dark:text-green-400" />{" "}
              Resultados da Extração
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Classifique os contatos e selecione o funil de destino.
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="dark:text-slate-400 dark:hover:text-red-400 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* TABELA DE LEADS */}
        <div className="flex-1 overflow-auto p-0 dark:bg-slate-900">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-60 gap-3">
              <Loader2 className="w-10 h-10 text-green-600 animate-spin" />
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Carregando dados extraídos...
              </p>
            </div>
          ) : leads.length === 0 ? (
            <div className="text-center py-20 text-slate-400 dark:text-slate-600">
              <Database className="w-12 h-12 mx-auto mb-4 opacity-20" />
              <p>Nenhum dado encontrado para esta busca.</p>
            </div>
          ) : (
            <table className="w-full text-sm text-left border-collapse">
              <thead className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold sticky top-0 z-10 shadow-sm">
                <tr>
                  <th className="p-4 w-12 text-center">
                    <button
                      onClick={toggleSelectAll}
                      className="flex items-center justify-center"
                      title="Selecionar Todos"
                    >
                      {selectedIds.size === leads.length && leads.length > 0 ? (
                        <CheckSquare className="w-5 h-5 text-green-600 dark:text-green-400" />
                      ) : (
                        <Square className="w-5 h-5 text-slate-400 dark:text-slate-500" />
                      )}
                    </button>
                  </th>
                  <th className="p-4 w-1/4">Nome</th>
                  <th className="p-4">Contato</th>
                  <th className="p-4 w-48">Classificação (Tipo)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {leads.map((lead: any, idx: number) => {
                  const isSelected = selectedIds.has(lead.id);
                  const currentType = rowTypes[lead.id] || "LEAD";

                  const getBorderColor = (t: string) => {
                    if (t === "CLIENT")
                      return "border-green-300 bg-green-50 text-green-700 dark:bg-green-900/30 dark:border-green-800 dark:text-green-400";
                    if (t === "CONTACT")
                      return "border-slate-300 bg-slate-50 text-slate-600 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300";
                    return "border-blue-300 bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:border-blue-800 dark:text-blue-400";
                  };

                  return (
                    <tr
                      key={lead.id || idx}
                      onClick={() => toggleSelectOne(lead.id)}
                      className={`transition-colors cursor-pointer group ${
                        isSelected
                          ? "bg-green-50/50 hover:bg-green-50 dark:bg-green-900/10 dark:hover:bg-green-900/20"
                          : "hover:bg-slate-50 dark:hover:bg-slate-800/50"
                      }`}
                    >
                      <td className="p-4 text-center">
                        <div className="flex items-center justify-center pointer-events-none">
                          {isSelected ? (
                            <CheckSquare className="w-5 h-5 text-green-600 fill-green-50 dark:text-green-400 dark:fill-green-900" />
                          ) : (
                            <Square className="w-5 h-5 text-slate-300 dark:text-slate-600 group-hover:text-slate-400 dark:group-hover:text-slate-500" />
                          )}
                        </div>
                      </td>
                      <td className="p-4">
                        <p className="font-bold text-slate-800 dark:text-slate-200">
                          {lead.name}
                        </p>
                        {lead.address && (
                          <p className="text-[10px] text-slate-400 dark:text-slate-500 truncate max-w-[250px]">
                            {lead.address}
                          </p>
                        )}
                      </td>
                      <td className="p-4">
                        <div className="flex flex-col gap-1">
                          <span className="text-slate-600 dark:text-slate-400 font-mono text-xs bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded w-fit">
                            {lead.phone || "Sem telefone"}
                          </span>
                          {lead.email && (
                            <span className="text-green-600 dark:text-green-400 text-xs truncate max-w-[180px] hover:underline">
                              {lead.email}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="p-4" onClick={(e) => e.stopPropagation()}>
                        <div className="relative">
                          <select
                            value={currentType}
                            onChange={(e) =>
                              handleTypeChange(lead.id, e.target.value)
                            }
                            className={`w-full appearance-none pl-9 pr-8 py-2 rounded-lg text-xs font-bold border outline-none focus:ring-2 focus:ring-offset-1 transition-all cursor-pointer ${getBorderColor(
                              currentType,
                            )} focus:ring-green-200 dark:focus:ring-green-800`}
                          >
                            <option value="CONTACT">CONTATO (Frio)</option>
                            <option value="LEAD">LEAD (Potencial)</option>
                            <option value="CLIENT">CLIENTE (Fechado)</option>
                          </select>
                          <div className="absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none">
                            {currentType === "CONTACT" && (
                              <User className="w-3.5 h-3.5 opacity-70" />
                            )}
                            {currentType === "LEAD" && (
                              <UserCheck className="w-3.5 h-3.5 opacity-70" />
                            )}
                            {currentType === "CLIENT" && (
                              <Briefcase className="w-3.5 h-3.5 opacity-70" />
                            )}
                          </div>
                          <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-current opacity-50">
                            <ArrowUpDown className="w-3 h-3" />
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* FOOTER - SELETOR DE PIPELINE E AÇÕES */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-4 w-full sm:w-auto">
            {/* SELETOR DE FUNIL */}
            <div className="relative w-full sm:w-64">
              <KanbanSquare className="absolute left-3 top-2.5 w-4 h-4 text-slate-400 pointer-events-none" />
              <select
                className="w-full pl-9 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-200 outline-none focus:ring-2 focus:ring-green-500 appearance-none cursor-pointer"
                value={selectedPipelineId}
                onChange={(e) => setSelectedPipelineId(e.target.value)}
              >
                {pipelines.length === 0 && (
                  <option value="">Nenhum funil encontrado</option>
                )}
                {pipelines.map((p: any) => (
                  <option key={p.id} value={p.id}>
                    {p.icon || "☀️"} {p.name}
                  </option>
                ))}
              </select>
              <ArrowUpDown className="absolute right-3 top-3 w-3 h-3 text-slate-400 pointer-events-none opacity-50" />
            </div>

            <div className="text-sm text-slate-500 dark:text-slate-400 font-medium whitespace-nowrap">
              {selectedIds.size} selecionados
            </div>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <Button
              variant="outline"
              onClick={downloadCSV}
              className="gap-2 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 flex-1 sm:flex-none"
              disabled={leads.length === 0}
            >
              <Download className="w-4 h-4" />{" "}
              <span className="hidden sm:inline">CSV</span>
            </Button>

            <Button
              onClick={handleImportLeads}
              disabled={
                selectedIds.size === 0 || isImporting || !selectedPipelineId
              }
              className="bg-green-600 hover:bg-green-700 text-white font-bold gap-2 shadow-sm min-w-[180px] flex-1 sm:flex-none"
            >
              {isImporting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              Importar para Funil
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function ScrapingPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const isPremium = user?.franchisee?.plan_type === "PREMIUM";

  const [keywords, setKeywords] = useState("");
  const [location, setLocation] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [limitCredits, setLimitCredits] = useState(0);
  const [history, setHistory] = useState<any[]>([]);
  const [pipelines, setPipelines] = useState<any[]>([]); // Estado para os Funis

  const [isHistoryLoading, setIsHistoryLoading] = useState(false);

  const [searchTerm, setSearchTerm] = useState("");
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest");

  const [modalOpen, setModalOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [modalLeads, setModalLeads] = useState<any[]>([]);
  const [isModalLoading, setIsModalLoading] = useState(false);

  const fetchCredits = useCallback(async () => {
    if (!user?.id) return;
    try {
      const res = await apiClient.get(
        `${url}/api/scraping/credits?userId=${user.id}`,
      );

      if (res.ok) setLimitCredits(await res.json());
    } catch (e) {
      console.error(e);
    }
  }, [user?.id]);

  const fetchHistory = useCallback(async () => {
    if (!user?.id) return;
    try {
      const res = await apiClient.get(
        `${url}/api/scraping/history?userId=${user.id}`,
      );

      if (res.ok) setHistory(await res.json());
    } catch (e) {
      console.error(e);
    }
  }, [user?.id]);

  // BUSCAR FUNIS DO FRANQUEADO
  const fetchPipelines = useCallback(async () => {
    if (!user?.franchisee?.id) return;
    try {
      const res = await apiClient.fetch(
        `${url}/api/pipelines?franchiseeId=${user.franchisee.id}`,
      );
      if (res.ok) {
        const data = await res.json();
        // Normaliza a resposta (array ou objeto content)
        const pipes = Array.isArray(data) ? data : data.content || [];
        setPipelines(pipes);
      }
    } catch (e) {
      console.error("Erro ao buscar funis", e);
    }
  }, [user?.franchisee?.id]);

  const handleManualRefresh = async () => {
    setIsHistoryLoading(true);
    await fetchHistory();
    setIsHistoryLoading(false);
  };

  useEffect(() => {
    if (isPremium && user?.id) {
      fetchHistory();
      fetchCredits();
      fetchPipelines(); // Carrega os funis ao iniciar
    }
  }, [isPremium, user?.id, fetchHistory, fetchCredits, fetchPipelines]);

  useEffect(() => {
    const hasActiveScraping = history.some(
      (item) => !["COMPLETED", "FAILED"].includes(item.status),
    );

    if (hasActiveScraping) {
      const interval = setInterval(() => fetchHistory(), 5000);
      return () => clearInterval(interval);
    }
  }, [history, fetchHistory]);

  const handleStartScraping = async () => {
    if (!keywords || !location) {
      toast({ title: "Preencha os campos", variant: "destructive" });
      return;
    }
    if (limitCredits <= 0) {
      toast({
        title: "Sem créditos",
        description: "Faça um upgrade.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const res = await apiClient.post(`${url}/api/scraping/start`, {
        userId: user.id,
        keywords,
        location,
        platform: "GOOGLE",
      });

      if (!res.ok) throw new Error(await res.text());

      const responseData = await res.json();

      if (
        responseData.success === false ||
        responseData.success === "false" ||
        responseData.error
      ) {
        toast({
          title: "Busca Falhou",
          description:
            responseData.message || "O robô não conseguiu iniciar a extração.",
          variant: "destructive",
        });

        fetchCredits();
        return;
      }

      // Se passou da validação, o objeto retornado é a Request real.
      const newRequest = responseData;
      setLimitCredits((prev) => prev - 1);
      setHistory((prev) => [newRequest, ...prev]);

      toast({
        title: "Busca Iniciada! 🤖",
        description: "Aguarde a conclusão.",
        className:
          "bg-green-50 text-green-800 dark:bg-green-900/30 dark:text-green-400",
      });
      setKeywords("");
      setLocation("");
      setSortOrder("newest");
      setSearchTerm("");
      fetchHistory();
    } catch (error: any) {
      toast({
        title: "Erro de Conexão",
        description: error.message || "Falha ao se comunicar com o servidor.",
        variant: "destructive",
      });
      fetchCredits(); // Recarrega créditos se der erro HTTP (ex: 500)
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenResults = async (request: any) => {
    setSelectedRequest(request);
    setModalOpen(true);
    setIsModalLoading(true);
    setModalLeads([]);

    try {
      const res = await apiClient.get(
        `${url}/api/scraping/leads?requestId=${request.id}`,
      );

      if (res.ok) {
        const rawData = await res.json();

        // CORREÇÃO: Aplicar a normalização do telefone aqui
        const processedData = rawData.map((lead: any) => ({
          ...lead,
          phone: normalizePhoneWithCountryCode(lead.phone),
        }));

        setModalLeads(processedData);
      } else {
        toast({
          title: "Erro",
          description: "Falha ao carregar leads.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsModalLoading(false);
    }
  };

  const handleDeleteHistory = async (id: string) => {
    try {
      const res = await apiClient.delete(`${url}/api/scraping/${id}`);

      if (res.ok) {
        setHistory((prev) => prev.filter((item) => item.id !== id));
        toast({ title: "Excluído", description: "Histórico removido." });
      }
    } catch (error) {
      console.error(error);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const filteredHistory = history
    .filter((item) => {
      const term = searchTerm.toLowerCase();
      return (
        (item.keywords || "").toLowerCase().includes(term) ||
        (item.location || "").toLowerCase().includes(term) ||
        (item.status || "").toLowerCase().includes(term)
      );
    })
    .sort((a, b) => {
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      return sortOrder === "newest" ? dateB - dateA : dateA - dateB;
    });

  return (
    <FranchiseeLayout scrollable={false}>
      <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-950 relative transition-colors duration-300 overflow-y-auto">
        <ResultsModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          request={selectedRequest}
          leads={modalLeads}
          isLoading={isModalLoading}
          onImportSuccess={fetchHistory}
          franchiseeId={user?.franchisee?.id}
          pipelines={pipelines} // Passa os funis para o modal
        />

        <div className="p-8 pb-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black text-slate-900 dark:text-white flex items-center gap-3">
              <Database className="w-8 h-8 text-green-600 dark:text-green-400" />
              Mineração de Leads
              {isPremium && (
                <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0">
                  PREMIUM
                </Badge>
              )}
            </h1>
            <p className="text-slate-500 dark:text-slate-400 mt-2">
              Busque clientes automaticamente no Google Maps usando IA.
            </p>
          </div>
          {isPremium && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-xl shadow-sm flex items-center gap-4 min-w-[200px]">
              <div
                className={`w-12 h-12 rounded-full flex items-center justify-center ${
                  limitCredits > 0
                    ? "bg-amber-100 text-amber-600 dark:bg-amber-900/20 dark:text-amber-500"
                    : "bg-red-100 text-red-600 dark:bg-red-900/20"
                }`}
              >
                <Coins className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">
                  Créditos Disponíveis
                </p>
                <p
                  className={`text-2xl font-black ${
                    limitCredits > 0
                      ? "text-slate-800 dark:text-white"
                      : "text-red-500"
                  }`}
                >
                  {limitCredits}{" "}
                  <span className="text-sm font-medium text-slate-400">
                    / mês
                  </span>
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="flex-1 p-8 pt-0">
          {!isPremium ? (
            <PremiumLockScreen
              features={[
                { text: "Busca no Google Maps", icon: MapPin },
                { text: "Análise com IA", icon: Brain },
                { text: "Exportar para CRM", icon: Database },
              ]}
            />
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-6">
                <Card className="border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden bg-white dark:bg-slate-900">
                  <CardHeader className="bg-slate-100 dark:bg-slate-900 text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-700">
                    <CardTitle className="flex items-center gap-2">
                      <Search className="w-5 h-5 text-green-400" /> Nova Busca
                    </CardTitle>
                    <CardDescription className="text-slate-500 dark:text-slate-400">
                      O robô irá extrair nomes, telefones e e-mails públicos.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-6 space-y-6">
                    <div className="bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-800 p-4 rounded-lg flex items-center gap-3">
                      <div className="bg-white dark:bg-slate-800 p-2 rounded-full shadow-sm text-green-600 dark:text-green-400">
                        <Globe className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-green-900 dark:text-green-100">
                          Fonte: Google Maps
                        </p>
                        <p className="text-xs text-green-700 dark:text-green-300">
                          Buscando empresas locais e prestadores.
                        </p>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 gap-4">
                        <div className="space-y-2">
                          <label className="text-sm font-bold text-slate-700 dark:text-slate-300">
                            1. O que você procura? (Nicho)
                          </label>
                          <div className="relative">
                            <Search className="absolute left-3 top-3 h-5 w-5 text-slate-400 dark:text-slate-500" />
                            <Input
                              placeholder="Ex: Padarias, Clínicas..."
                              className="pl-10 py-6 text-lg bg-white dark:bg-slate-950 dark:border-slate-700 dark:text-white"
                              value={keywords}
                              onChange={(e) => setKeywords(e.target.value)}
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-bold text-slate-700 dark:text-slate-300">
                            2. Onde? (Cidade e Estado)
                          </label>
                          <div className="relative">
                            <MapPin className="absolute left-3 top-3 h-5 w-5 text-slate-400 dark:text-slate-500" />
                            <Input
                              placeholder="Ex: Centro, São Paulo - SP"
                              className="pl-10 py-6 text-lg bg-white dark:bg-slate-950 dark:border-slate-700 dark:text-white"
                              value={location}
                              onChange={(e) => setLocation(e.target.value)}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="pt-2">
                      <Button
                        onClick={handleStartScraping}
                        disabled={isLoading || limitCredits <= 0}
                        className={`w-full py-8 text-xl font-black shadow-xl transition-all rounded-xl ${
                          limitCredits > 0
                            ? "bg-green-600 hover:bg-green-700 shadow-green-900/20 text-white"
                            : "bg-slate-300 dark:bg-slate-700 cursor-not-allowed text-slate-500 dark:text-slate-400"
                        }`}
                      >
                        {isLoading ? (
                          <>
                            <Loader2 className="w-6 h-6 mr-2 animate-spin" />{" "}
                            Processando...
                          </>
                        ) : limitCredits > 0 ? (
                          <>
                            <Play className="w-6 h-6 mr-2 fill-current" />{" "}
                            Iniciar Mineração (-1 Crédito)
                          </>
                        ) : (
                          <>
                            <AlertCircle className="w-6 h-6 mr-2" /> Sem
                            Créditos
                          </>
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="lg:col-span-1">
                <Card className="border-slate-200 dark:border-slate-800 shadow-sm h-full flex flex-col bg-white dark:bg-slate-900">
                  <CardHeader className="border-b border-slate-100 dark:border-slate-800 pb-4 shrink-0 space-y-4">
                    <div className="flex flex-row items-center justify-between">
                      <CardTitle className="text-lg flex items-center gap-2 text-slate-800 dark:text-white">
                        <History className="w-5 h-5 text-slate-500 dark:text-slate-400" />{" "}
                        Histórico
                      </CardTitle>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={handleManualRefresh}
                        title="Atualizar lista"
                        className="dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800"
                      >
                        <RefreshCw
                          className={`w-4 h-4 text-slate-400 dark:text-slate-400 ${
                            isHistoryLoading ? "animate-spin" : ""
                          }`}
                        />
                      </Button>
                    </div>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-slate-400 dark:text-slate-500" />
                        <Input
                          placeholder="Filtrar..."
                          className="pl-8 h-9 text-sm bg-slate-50 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300"
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                        />
                      </div>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-9 w-9 shrink-0 bg-slate-50 dark:bg-slate-800 dark:border-slate-700"
                        onClick={() =>
                          setSortOrder((prev) =>
                            prev === "newest" ? "oldest" : "newest",
                          )
                        }
                        title="Ordenar"
                      >
                        <ArrowUpDown
                          className={`h-4 w-4 text-slate-500 dark:text-slate-400 transition-transform ${
                            sortOrder === "oldest" ? "rotate-180" : ""
                          }`}
                        />
                      </Button>
                    </div>
                  </CardHeader>

                  <CardContent className="p-0 flex-1 overflow-y-auto max-h-[600px] scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-700">
                    <div className="divide-y divide-slate-100 dark:divide-slate-800">
                      {filteredHistory.map((item) => (
                        <div
                          key={item.id}
                          className="p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors flex items-start gap-3 group"
                        >
                          <div className="mt-1 w-8 h-8 rounded-lg flex items-center justify-center shrink-0 bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400">
                            <MapPin className="w-4 h-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-start">
                              <p className="font-bold text-slate-800 dark:text-slate-200 text-sm truncate pr-2">
                                {item.keywords}
                              </p>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-5 w-5 -mt-1 text-slate-300 dark:text-slate-500 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteHistory(item.id);
                                }}
                                title="Excluir histórico"
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </div>
                            <div className="flex items-center gap-2 mt-0.5">
                              {!["COMPLETED", "FAILED"].includes(
                                item.status,
                              ) && (
                                <Badge
                                  variant="outline"
                                  className="text-[9px] px-1.5 py-0 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800 animate-pulse"
                                >
                                  Rodando
                                </Badge>
                              )}
                              {item.status === "COMPLETED" && (
                                <Badge
                                  variant="secondary"
                                  className="text-[9px] px-1.5 py-0 bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400"
                                >
                                  Pronto
                                </Badge>
                              )}
                              {item.status === "FAILED" && (
                                <Badge
                                  variant="destructive"
                                  className="text-[9px] px-1.5 py-0 dark:bg-red-900/30"
                                >
                                  Erro
                                </Badge>
                              )}
                            </div>
                            <p className="text-xs text-slate-500 dark:text-slate-400 truncate mb-1 mt-1">
                              {item.location}
                            </p>
                            <div className="flex justify-between items-end">
                              <span className="text-[10px] text-slate-400 dark:text-slate-500">
                                {formatDate(item.createdAt)}
                              </span>
                              <div className="flex items-center gap-2">
                                {item.status === "COMPLETED" ? (
                                  <>
                                    <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 bg-emerald-50 dark:bg-emerald-900/20 px-2 py-0.5 rounded-full">
                                      +{item.leadsFound} Leads
                                    </span>
                                    <Button
                                      size="icon"
                                      variant="ghost"
                                      className="h-6 w-6 rounded-full hover:bg-green-100 dark:hover:bg-green-900/30 text-green-600 dark:text-green-400"
                                      onClick={() => handleOpenResults(item)}
                                      title="Ver e Baixar"
                                    >
                                      <Eye className="w-3 h-3" />
                                    </Button>
                                  </>
                                ) : (
                                  <span className="text-[10px] text-slate-400 dark:text-slate-500">
                                    ...
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                      {filteredHistory.length === 0 && (
                        <div className="p-8 text-center text-slate-400 dark:text-slate-600">
                          {searchTerm ? (
                            <>
                              <Filter className="w-10 h-10 mx-auto mb-3 opacity-20" />
                              <p className="text-sm">
                                Nenhum resultado para "{searchTerm}".
                              </p>
                            </>
                          ) : (
                            <>
                              <History className="w-10 h-10 mx-auto mb-3 opacity-20" />
                              <p className="text-sm">Nenhuma busca recente.</p>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </div>
      </div>
    </FranchiseeLayout>
  );
}
