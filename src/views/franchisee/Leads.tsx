import React, {
  useEffect,
  useState,
  useRef,
  useMemo,
  useCallback,
} from "react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import * as leadsController from "@/controllers/franchisee/LeadController";
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  X,
  Phone,
  Mail,
  User,
  Calendar,
  Loader2,
  AlertCircle,
  RefreshCcw,
  FileUp,
  Download,
  FileSpreadsheet,
  CheckCircle,
  Info,
  Filter,
  ArrowUpDown,
  ExternalLink,
  UserPlus,
  MessageCircle,
} from "lucide-react";
import FranchiseeLayout from "@/components/Franchisee/FranchiseeLayout";
import { createPortal } from "react-dom";
import LeadModal from "@/components/Franchisee/LeadModal";
import MessageModal from "@/components/Franchisee/MessageModal";
import * as XLSX from "xlsx";

//teste
const WAIT_TIMER = 800;

// Sub-componente para avatar do lead com suporte a profile_picture
const LeadAvatar = ({ lead }: { lead: any }) => {
  const [imgError, setImgError] = useState(false);

  if (lead.profile_picture && !imgError) {
    return (
      <img
        src={lead.profile_picture}
        alt={lead.name}
        onError={() => setImgError(true)}
        className="w-12 h-12 rounded-2xl object-cover shadow-sm shrink-0 group-hover:ring-2 group-hover:ring-green-500 transition-all duration-300"
      />
    );
  }

  return (
    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700 flex items-center justify-center text-slate-500 dark:text-slate-400 font-bold text-lg group-hover:from-green-500 group-hover:to-green-600 group-hover:text-white transition-all duration-300 shadow-sm shrink-0">
      {lead.name.charAt(0).toUpperCase()}
    </div>
  );
};

const Leads = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const franchiseeId = user?.franchisee?.id;

  // Estados
  const [leads, setLeads] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isImporting, setIsImporting] = useState(false);
  const [importSuccess, setImportSuccess] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("ALL");
  const [sortBy, setSortBy] = useState("newest");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [currentLead, setCurrentLead] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Estados para modal de mensagem
  const [isMessageModalOpen, setIsMessageModalOpen] = useState(false);
  const [selectedLeadForMessage, setSelectedLeadForMessage] = useState(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    leadType: "LEAD",
  });

  // Busca inicial de dados
  const fetchLeads = useCallback(async (id: string) => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await leadsController.listLeadsByFranchiseeId(id);
      console.log("leads: ", data);
      setLeads(data || []);
    } catch (err) {
      setError("Não foi possível carregar seus leads. Verifique sua conexão.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (franchiseeId) {
      fetchLeads(franchiseeId);
    }
  }, [franchiseeId, fetchLeads]);

  // Lógica de Filtragem e Ordenação
  const filteredLeads = useMemo(() => {
    let result = [...leads];

    // Busca textual
    if (searchTerm) {
      const lowerSearch = searchTerm.toLowerCase();
      result = result.filter(
        (lead) =>
          lead?.name?.toLowerCase().includes(lowerSearch) ||
          lead?.email?.toLowerCase().includes(lowerSearch) ||
          lead?.phone?.toLowerCase().includes(lowerSearch),
      );
    }

    // Filtro por tipo
    if (filterType !== "ALL") {
      result = result.filter((lead) => lead.leadType === filterType);
    }

    // Ordenação
    result.sort((a, b) => {
      switch (sortBy) {
        case "newest":
          return (
            new Date(b.create_at).getTime() - new Date(a.create_at).getTime()
          );
        case "oldest":
          return (
            new Date(a.create_at).getTime() - new Date(b.create_at).getTime()
          );
        case "name":
          return a.name.localeCompare(b.name);
        default:
          return 0;
      }
    });

    return result;
  }, [leads, searchTerm, filterType, sortBy]);

  // Handlers
  const handleCreate = () => {
    setModalMode("create");
    setFormData({ name: "", email: "", phone: "", leadType: "LEAD" });
    setCurrentLead(null);
    setIsModalOpen(true);
  };

  const handleEdit = (lead) => {
    setModalMode("edit");
    setFormData({
      name: lead.name,
      email: lead.email,
      phone: lead.phone,
      leadType: lead.leadType,
    });
    setCurrentLead(lead);
    setIsModalOpen(true);
  };

  const handleDelete = async (leadId) => {
    try {
      await leadsController.deleteLead(leadId);
      setLeads((prev) => prev.filter((lead) => lead.id !== leadId));
      toast({
        title: "Lead removido",
        description: "Excluído com sucesso.",
        variant: "default",
      });
    } catch (err) {
      toast({
        title: "Erro ao excluir",
        description: "Ocorreu um problema ao tentar remover o lead.",
        variant: "destructive",
      });
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      if (modalMode === "create") {
        await leadsController.createLead({
          id: franchiseeId,
          data: formData,
        });
        toast({
          title: "Sucesso!",
          description: "Novo lead cadastrado com sucesso.",
        });
      } else {
        await leadsController.updateLead({
          id: currentLead.id,
          data: formData,
        });
        toast({
          title: "Atualizado!",
          description: "Os dados do lead foram salvos.",
        });
      }

      const updatedLeads =
        await leadsController.listLeadsByFranchiseeId(franchiseeId);
      setLeads(updatedLeads);
    } catch (err) {
      toast({
        title: "Erro ao salvar",
        description:
          "Verifique os dados. Leads não podem ter números de telefone repetidos.",
        variant: "destructive",
      });
      setIsSaving(false);
    } finally {
      setTimeout(() => {
        setIsModalOpen(false);
        setIsSaving(false);
      }, 300);
    }
  };

  const handleRefresh = async () => {
    if (!franchiseeId || isRefreshing) return;
    setIsRefreshing(true);
    await fetchLeads(franchiseeId);
    setTimeout(() => setIsRefreshing(false), WAIT_TIMER);
  };

  const handleOpenImportModal = () => {
    setIsImportModalOpen(true);
    setSelectedFile(null);
  };

  // --- CORREÇÃO AQUI: CABEÇALHOS EM INGLÊS ---
  const handleDownloadTemplate = () => {
    const data = [
      ["name", "email", "phone", "type"], // Cabeçalhos compatíveis com o Java
      ["Exemplo Nome", "exemplo@email.com", "5511999999999", "LEAD"],
    ];
    const worksheet = XLSX.utils.aoa_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Template");
    XLSX.writeFile(workbook, "modelo_importacao_leads.xlsx");
  };

  const handleImportSubmit = async () => {
    if (!selectedFile) return;
    setIsImporting(true);
    try {
      await leadsController.importLeads({
        data: { id: franchiseeId, file: selectedFile },
      });
      const updated =
        await leadsController.listLeadsByFranchiseeId(franchiseeId);
      setLeads(updated);
      setImportSuccess(true);
    } catch (error) {
      toast({ title: "Erro na importação", variant: "destructive" });
    } finally {
      setIsImporting(false);
    }
  };

  // Handler para abrir modal de mensagem
  const handleOpenMessageModal = (lead) => {
    setSelectedLeadForMessage(lead);
    setIsMessageModalOpen(true);
  };

  // Handler para enviar mensagem
  const handleSendMessage = async (message: string) => {
    console.log("Enviando mensagem:", message, "para:", selectedLeadForMessage);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    toast({
      title: "Mensagem enviada!",
      description: `Mensagem enviada para ${selectedLeadForMessage?.name}`,
      variant: "default",
    });
  };

  // Helpers Visuais
  const getLeadTypeStyles = (type) => {
    const styles = {
      LEAD: "bg-blue-50 text-blue-700 border-blue-100 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800",
      CONTACT:
        "bg-purple-50 text-purple-700 border-purple-100 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-800",
      CLIENT:
        "bg-green-50 text-green-700 border-green-100 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800",
    };
    return (
      styles[type] ||
      "bg-gray-50 text-gray-700 border-gray-100 dark:bg-slate-800 dark:text-slate-400"
    );
  };

  const formatDate = (dateString) => {
    if (!dateString) return "---";
    return new Date(dateString).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  // Sub-componentes
  const LoadingState = () => (
    <div className="flex flex-col items-center justify-center py-24 animate-in fade-in duration-500">
      <div className="relative">
        <div className="w-16 h-16 border-4 border-green-100 dark:border-green-900/30 border-t-green-600 rounded-full animate-spin"></div>
        <Loader2 className="w-6 h-6 text-green-600 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
      </div>
      <p className="mt-4 text-gray-500 dark:text-gray-400 font-medium">
        Sincronizando dados...
      </p>
    </div>
  );

  const EmptyState = () => (
    <div className="text-center py-20 px-4 animate-in zoom-in-95 duration-300">
      <div className="bg-slate-50 dark:bg-slate-800 w-24 h-24 rounded-3xl flex items-center justify-center mx-auto mb-6 rotate-3">
        <UserPlus className="w-12 h-12 text-slate-300 dark:text-slate-600" />
      </div>
      <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
        {searchTerm || filterType !== "ALL"
          ? "Nenhum resultado encontrado"
          : "Sua lista está vazia"}
      </h3>
      <p className="text-slate-500 dark:text-slate-400 mb-8 max-w-sm mx-auto">
        {searchTerm || filterType !== "ALL"
          ? "Tente ajustar os filtros ou limpar a busca para encontrar o que deseja."
          : "Comece a construir sua base de contatos adicionando seu primeiro lead agora mesmo."}
      </p>
      <button
        onClick={
          searchTerm || filterType !== "ALL"
            ? () => {
                setSearchTerm("");
                setFilterType("ALL");
              }
            : handleCreate
        }
        className="inline-flex items-center gap-2 bg-slate-900 dark:bg-green-600 hover:bg-slate-800 dark:hover:bg-green-700 text-white px-6 py-3 rounded-xl font-semibold transition-all shadow-lg shadow-slate-200 dark:shadow-green-900/20 active:scale-95"
      >
        {searchTerm || filterType !== "ALL" ? (
          "Limpar Filtros"
        ) : (
          <>
            <Plus className="w-5 h-5" /> Adicionar Lead
          </>
        )}
      </button>
    </div>
  );

  const ImportModal = () => {
    if (!isImportModalOpen) return null;

    return createPortal(
      <div className="fixed inset-0 bg-slate-900/40 dark:bg-black/60 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
        <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full overflow-hidden shadow-2xl animate-in slide-in-from-bottom-4 duration-300 border border-slate-100 dark:border-slate-800">
          <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              Importar Leads
            </h2>
            <button
              onClick={() => !isImporting && setIsImportModalOpen(false)}
              className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
            >
              <X className="w-5 h-5 text-slate-400 dark:text-slate-500" />
            </button>
          </div>

          <div className="p-6">
            {isImporting ? (
              <div className="py-10 text-center">
                <Loader2 className="w-12 h-12 text-green-600 animate-spin mx-auto mb-4" />
                <p className="font-medium text-slate-700 dark:text-slate-300">
                  Processando sua planilha...
                </p>
              </div>
            ) : importSuccess ? (
              <div className="py-6 text-center">
                <div className="w-20 h-20 bg-green-50 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-10 h-10 text-green-500" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
                  Importação Concluída!
                </h3>
                <p className="text-slate-500 dark:text-slate-400 mb-6">
                  Seus novos leads já estão disponíveis na lista.
                </p>
                <button
                  onClick={() => {
                    setIsImportModalOpen(false);
                    setImportSuccess(false);
                  }}
                  className="w-full bg-slate-900 dark:bg-green-600 text-white py-3 rounded-xl font-bold hover:bg-slate-800 dark:hover:bg-green-700 transition-all"
                >
                  Entendido
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/30 p-4 rounded-xl flex gap-3">
                  <Info className="w-5 h-5 text-amber-600 dark:text-amber-500 shrink-0" />

                  <div className="text-sm text-amber-800 dark:text-amber-400 space-y-3">
                    <div>
                      <p className="font-bold mb-1">Dica de Formatação:</p>
                      <p>
                        Certifique-se de que as colunas <strong>name</strong>,{" "}
                        <strong>phone</strong>, <strong>email</strong> e{" "}
                        <strong>type</strong> estejam preenchidas corretamente.
                      </p>
                    </div>

                    <div>
                      <p className="font-bold mb-1">
                        Valores Permitidos no Campo "type":
                      </p>
                      <p>
                        O campo <strong>type</strong> aceita somente:{" "}
                        <strong>LEAD</strong>, <strong>CONTACT</strong> ou{" "}
                        <strong>CLIENT</strong>.
                      </p>
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleDownloadTemplate}
                  className="w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl text-slate-600 dark:text-slate-400 hover:border-green-400 dark:hover:border-green-600 hover:text-green-600 hover:bg-green-50/50 dark:hover:bg-green-900/20 transition-all group"
                >
                  <Download className="w-4 h-4 group-hover:translate-y-0.5 transition-transform" />
                  <span className="font-medium">Baixar modelo .xlsx</span>
                </button>

                <div className="relative">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={(e) =>
                      setSelectedFile(e.target.files?.[0] || null)
                    }
                    accept=".xlsx, .xls, .csv"
                    className="hidden"
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className={`w-full p-8 rounded-2xl border-2 border-dashed transition-all flex flex-col items-center gap-3 ${
                      selectedFile
                        ? "border-green-200 bg-green-50/50 text-green-700 dark:border-green-800 dark:bg-green-900/20 dark:text-green-400"
                        : "border-slate-200 bg-slate-50 text-slate-500 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700"
                    }`}
                  >
                    {selectedFile ? (
                      <>
                        <FileSpreadsheet className="w-10 h-10 text-green-500" />
                        <div className="text-center">
                          <p className="font-bold text-sm truncate max-w-[250px]">
                            {selectedFile.name}
                          </p>
                          <p className="text-xs opacity-60">
                            Clique para alterar o arquivo
                          </p>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="w-12 h-12 bg-white dark:bg-slate-700 rounded-full shadow-sm flex items-center justify-center">
                          <FileUp className="w-6 h-6 text-green-500 dark:text-green-400" />
                        </div>
                        <span className="font-semibold">
                          Clique para selecionar arquivo
                        </span>
                      </>
                    )}
                  </button>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => setIsImportModalOpen(false)}
                    className="flex-1 py-3 text-slate-600 dark:text-slate-400 font-bold hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleImportSubmit}
                    disabled={!selectedFile}
                    className="flex-[2] bg-green-600 text-white py-3 rounded-xl font-bold hover:bg-green-700 disabled:opacity-40 disabled:grayscale transition-all shadow-lg shadow-green-100 dark:shadow-green-900/20"
                  >
                    Iniciar Importação
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>,
      document.body,
    );
  };

  return (
    <FranchiseeLayout>
      <div className="min-h-screen bg-[#F8FAFC] dark:bg-slate-950 p-4 md:p-8 transition-colors duration-300">
        <div className="max-w-7xl mx-auto">
          {/* Header Section */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
            <div>
              <div className="flex items-center gap-2 text-green-600 dark:text-green-400 font-bold text-sm uppercase tracking-wider mb-2"></div>
              <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">
                Gestão de Leads
              </h1>
              <p className="text-slate-500 dark:text-slate-400 mt-2 text-lg">
                Acompanhe e converta seus contatos em clientes reais.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={handleOpenImportModal}
                className="flex items-center gap-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 px-5 py-3 rounded-2xl font-bold hover:bg-slate-50 dark:hover:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition-all shadow-sm active:scale-95"
              >
                <FileUp className="w-5 h-5 text-slate-400 dark:text-slate-500" />
                Importar
              </button>
              <button
                onClick={handleCreate}
                className="flex items-center gap-2 bg-green-600 text-white px-6 py-3 rounded-2xl font-bold hover:bg-green-700 transition-all shadow-lg shadow-green-200 dark:shadow-green-900/20 active:scale-95"
              >
                <Plus className="w-5 h-5" />
                Novo Lead
              </button>
            </div>
          </div>

          {/* Filters & Search Card */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 p-2 mb-8">
            <div className="flex flex-col lg:flex-row gap-2">
              {/* Search Input */}
              <div className="relative flex-1 group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 w-5 h-5 group-focus-within:text-green-500 transition-colors" />
                <input
                  type="text"
                  placeholder="Buscar por nome, email ou telefone..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 bg-transparent border-none focus:ring-0 text-slate-700 dark:text-slate-200 placeholder:text-slate-400 font-medium"
                />
              </div>

              <div className="h-px lg:h-10 w-full lg:w-px bg-slate-100 dark:bg-slate-800 self-center"></div>

              {/* Type Filters */}
              <div className="flex items-center gap-1 p-2 overflow-x-auto no-scrollbar">
                {[
                  { label: "Contatos", value: "CONTACT" },
                  { label: "Leads", value: "LEAD" },
                  { label: "Clientes", value: "CLIENT" },
                  { label: "Todos", value: "ALL" },
                ].map((type) => (
                  <button
                    key={type.value}
                    onClick={() => setFilterType(type.value)}
                    className={`px-5 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition-all ${
                      filterType === type.value
                        ? "bg-slate-900 dark:bg-green-600 text-white shadow-md"
                        : "text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-200"
                    }`}
                  >
                    {type.label}
                  </button>
                ))}
              </div>

              <div className="h-px lg:h-10 w-full lg:w-px bg-slate-100 dark:bg-slate-800 self-center"></div>

              {/* Sort & Refresh */}
              <div className="flex items-center gap-2 p-2">
                <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 px-4 py-2 rounded-xl border border-slate-100 dark:border-slate-700">
                  <ArrowUpDown className="w-4 h-4 text-slate-400 dark:text-slate-500" />
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="bg-transparent text-sm font-bold text-slate-700 dark:text-slate-300 focus:outline-none cursor-pointer dark:bg-slate-800"
                  >
                    <option value="newest">Recentes</option>
                    <option value="oldest">Antigos</option>
                    <option value="name">Nome A-Z</option>
                  </select>
                </div>
                <button
                  onClick={handleRefresh}
                  disabled={isRefreshing}
                  className="p-3 bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-green-600 dark:hover:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-xl transition-all border border-slate-100 dark:border-slate-700 disabled:opacity-50"
                >
                  <RefreshCcw
                    className={`w-5 h-5 ${isRefreshing ? "animate-spin" : ""}`}
                  />
                </button>
              </div>
            </div>
          </div>

          {/* Stats Summary */}
          {!isLoading && leads.length > 0 && (
            <div className="flex items-center justify-between mb-6 px-2">
              <div className="flex items-center gap-4">
                <span className="text-sm font-medium text-slate-500 dark:text-slate-400">
                  Mostrando{" "}
                  <strong className="text-slate-900 dark:text-white">
                    {filteredLeads.length}
                  </strong>{" "}
                  de {leads.length} registros
                </span>
                {searchTerm && (
                  <span className="bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400 text-xs font-bold px-3 py-1 rounded-full border border-green-100 dark:border-green-800">
                    Busca ativa
                  </span>
                )}
              </div>
              {(searchTerm || filterType !== "ALL") && (
                <button
                  onClick={() => {
                    setSearchTerm("");
                    setFilterType("ALL");
                  }}
                  className="text-sm font-bold text-green-600 dark:text-green-400 hover:text-green-700 flex items-center gap-1"
                >
                  <X className="w-4 h-4" /> Limpar filtros
                </button>
              )}
            </div>
          )}

          {/* Main Content Area */}
          <div className="bg-white dark:bg-slate-900 rounded-[2rem] shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden">
            {isLoading ? (
              <LoadingState />
            ) : error ? (
              <div className="py-20 text-center">
                <div className="bg-red-50 dark:bg-red-900/20 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <AlertCircle className="w-8 h-8 text-red-500 dark:text-red-400" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  {error}
                </h3>
                <button
                  onClick={handleRefresh}
                  className="mt-4 text-green-600 font-bold hover:underline"
                >
                  Tentar novamente
                </button>
              </div>
            ) : filteredLeads.length === 0 ? (
              <EmptyState />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse min-w-[900px]">
                  <thead>
                    <tr className="bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                      <th className="px-8 py-5 text-left text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest w-[250px]">
                        Lead / Nome
                      </th>
                      <th className="px-8 py-5 text-left text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest w-[280px]">
                        Informações de Contato
                      </th>
                      <th className="px-8 py-5 text-left text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest w-[150px]">
                        Status / Tipo
                      </th>
                      <th className="px-8 py-5 text-left text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest w-[150px]">
                        Data de Cadastro
                      </th>
                      <th className="px-8 py-5 text-right text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest w-[200px]">
                        Ações
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                    {filteredLeads.map((lead) => (
                      <tr
                        key={lead.id}
                        className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-all group"
                      >
                        <td className="px-8 py-5">
                          <div className="flex items-center gap-4 max-w-[230px]">
                            {/* Avatar com suporte a profile_picture */}
                            <LeadAvatar lead={lead} />
                            <div className="min-w-0">
                              <div
                                className="text-base font-bold text-slate-900 dark:text-slate-200 group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors truncate"
                                title={lead.name}
                              >
                                {lead.name}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-8 py-5">
                          <div className="flex flex-col gap-1.5 max-w-[260px]">
                            <div className="flex items-center text-sm text-slate-600 dark:text-slate-400 font-medium group/item cursor-pointer min-w-0">
                              <Mail className="w-4 h-4 mr-2 text-slate-300 dark:text-slate-600 group-hover/item:text-green-500 transition-colors shrink-0" />
                              <span
                                className="truncate"
                                title={lead.email || "Não informado"}
                              >
                                {lead.email || (
                                  <span className="text-slate-300 dark:text-slate-600 italic">
                                    Não informado
                                  </span>
                                )}
                              </span>
                            </div>
                            <div className="flex items-center text-sm text-slate-600 dark:text-slate-400 font-medium group/item cursor-pointer">
                              <Phone className="w-4 h-4 mr-2 text-slate-300 dark:text-slate-600 group-hover/item:text-emerald-500 transition-colors shrink-0" />
                              <span className="truncate" title={lead.phone}>
                                {lead.phone}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="px-8 py-5">
                          <span
                            className={`inline-flex items-center px-4 py-1.5 rounded-full text-xs font-black border ${getLeadTypeStyles(lead.leadType)}`}
                          >
                            <div
                              className={`w-1.5 h-1.5 rounded-full mr-2 shrink-0 ${
                                lead.leadType === "LEAD"
                                  ? "bg-blue-500"
                                  : lead.leadType === "CONTACT"
                                    ? "bg-purple-500"
                                    : "bg-green-500"
                              }`}
                            ></div>
                            {lead.leadType}
                          </span>
                        </td>
                        <td className="px-8 py-5 whitespace-nowrap">
                          <div className="flex items-center text-sm text-slate-500 dark:text-slate-400 font-medium">
                            <Calendar className="w-4 h-4 mr-2 text-slate-300 dark:text-slate-600 shrink-0" />
                            {formatDate(lead.create_at)}
                          </div>
                        </td>
                        <td className="px-8 py-5 whitespace-nowrap text-right">
                          <div className="flex justify-end items-center gap-1">
                            {/* Botão de mensagem apenas para CONTACT */}
                            {lead.leadType === "CONTACT" && (
                              <>
                                <button
                                  onClick={() => handleOpenMessageModal(lead)}
                                  className="p-2.5 text-slate-400 dark:text-slate-500 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-xl transition-all"
                                  title="Enviar Mensagem"
                                >
                                  <MessageCircle className="w-4 h-4" />
                                </button>
                                <div className="w-px h-4 bg-slate-100 dark:bg-slate-800 mx-1"></div>
                              </>
                            )}
                            <button
                              onClick={() => handleEdit(lead)}
                              className="p-2.5 text-slate-400 dark:text-slate-500 hover:text-green-600 dark:hover:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-xl transition-all"
                              title="Editar Lead"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <div className="w-px h-4 bg-slate-100 dark:bg-slate-800 mx-1"></div>
                            <button
                              onClick={() => handleDelete(lead.id)}
                              className="p-2.5 text-slate-400 dark:text-slate-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all"
                              title="Excluir Lead"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modais */}
      {isModalOpen && (
        <LeadModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSave={handleSave}
          formData={formData}
          setFormData={setFormData}
          mode={modalMode}
          isSaving={isSaving}
        />
      )}

      <ImportModal />

      {/* Modal de Mensagem */}
      <MessageModal
        FranchiseeId={franchiseeId}
        isOpen={isMessageModalOpen}
        onClose={() => setIsMessageModalOpen(false)}
        lead={selectedLeadForMessage}
        onSendMessage={handleSendMessage}
      />
    </FranchiseeLayout>
  );
};

export default Leads;
