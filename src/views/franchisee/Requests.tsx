import React, {
  useEffect,
  useState,
  useRef,
  useMemo,
  useCallback,
} from "react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import * as requestController from "@/controllers/franchisee/RequestController";
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  X,
  Calendar,
  Loader2,
  AlertCircle,
  RefreshCcw,
  ArrowUpDown,
  ClipboardList,
  Zap,
  Wrench,
  MoreHorizontal,
  Clock,
  CheckCircle2,
  XCircle,
  ChevronRight,
  MessageSquare,
  Filter,
  Lock,
} from "lucide-react";
import FranchiseeLayout from "@/components/Franchisee/FranchiseeLayout";
import { createPortal } from "react-dom";

const WAIT_TIMER = 800;

// ─── Types ───────────────────────────────────────────────────────────────────

type RequestType = "UPGRADE" | "CORRECTION" | "OTHER";
type RequestStatus = "PENDING" | "APPROVED" | "REJECTED" | "IN_PROGRESS";

interface Request {
  id: string;
  requestType: RequestType;
  requestStatus: RequestStatus;
  description: string;
  responseSuperAdmin: string;
  updatedAt: string;
  createdAt: string;
}

interface FormData {
  request_type: RequestType;
  description: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const REQUEST_TYPE_CONFIG: Record<
  RequestType,
  { label: string; icon: React.FC<any>; styles: string; dot: string }
> = {
  UPGRADE: {
    label: "Upgrade",
    icon: Zap,
    styles:
      "bg-amber-50 text-amber-700 border-amber-100 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800",
    dot: "bg-amber-500",
  },
  CORRECTION: {
    label: "Correção",
    icon: Wrench,
    styles:
      "bg-blue-50 text-blue-700 border-blue-100 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800",
    dot: "bg-blue-500",
  },
  OTHER: {
    label: "Outro",
    icon: MoreHorizontal,
    styles:
      "bg-slate-50 text-slate-700 border-slate-100 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700",
    dot: "bg-slate-400",
  },
};

const STATUS_CONFIG: Record<
  RequestStatus,
  { label: string; icon: React.FC<any>; styles: string; dot: string }
> = {
  PENDING: {
    label: "Pendente",
    icon: Clock,
    styles:
      "bg-yellow-50 text-yellow-700 border-yellow-100 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-800",
    dot: "bg-yellow-500",
  },
  APPROVED: {
    label: "Aprovado",
    icon: CheckCircle2,
    styles:
      "bg-green-50 text-green-700 border-green-100 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800",
    dot: "bg-green-500",
  },
  REJECTED: {
    label: "Rejeitado",
    icon: XCircle,
    styles:
      "bg-red-50 text-red-700 border-red-100 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800",
    dot: "bg-red-500",
  },
  IN_PROGRESS: {
    label: "Em Andamento",
    icon: Loader2,
    styles:
      "bg-purple-50 text-purple-700 border-purple-100 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-800",
    dot: "bg-purple-500",
  },
};

// Statuses que bloqueiam edição
const LOCKED_STATUSES: RequestStatus[] = ["APPROVED", "REJECTED"];

/** Bloqueia edição se status for APPROVED ou REJECTED */
const isLocked = (status: RequestStatus) => LOCKED_STATUSES.includes(status);

/**
 * Permite exclusão apenas se:
 * - Não há resposta do admin (responseSuperAdmin vazio)
 * - E status não está bloqueado (APPROVED/REJECTED)
 */
const canDelete = (req: Request) =>
  !req.responseSuperAdmin && !isLocked(req.requestStatus);

const formatDate = (dateString: string) => {
  if (!dateString) return "---";
  return new Date(dateString).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

// ─── Request Modal ────────────────────────────────────────────────────────────

interface RequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (e: React.FormEvent) => void;
  formData: FormData;
  setFormData: (data: FormData) => void;
  mode: "create" | "edit";
  isSaving: boolean;
}

const RequestModal = ({
  isOpen,
  onClose,
  onSave,
  formData,
  setFormData,
  mode,
  isSaving,
}: RequestModalProps) => {
  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 bg-slate-900/40 dark:bg-black/60 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl animate-in slide-in-from-bottom-4 duration-300 border border-slate-100 dark:border-slate-800">
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              {mode === "create" ? "Nova Solicitação" : "Editar Solicitação"}
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              {mode === "create"
                ? "Preencha os dados da sua solicitação"
                : "Atualize os dados da solicitação"}
            </p>
          </div>
          <button
            onClick={onClose}
            disabled={isSaving}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5 text-slate-400 dark:text-slate-500" />
          </button>
        </div>

        <form onSubmit={onSave} className="p-6 space-y-5">
          <div>
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-3">
              Tipo de Solicitação
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(Object.keys(REQUEST_TYPE_CONFIG) as RequestType[]).map(
                (type) => {
                  const config = REQUEST_TYPE_CONFIG[type];
                  const Icon = config.icon;
                  const isSelected = formData.request_type === type;
                  return (
                    <button
                      key={type}
                      type="button"
                      onClick={() =>
                        setFormData({ ...formData, request_type: type })
                      }
                      className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all font-semibold text-sm ${
                        isSelected
                          ? "border-green-500 bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400 dark:border-green-600"
                          : "border-slate-100 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:border-slate-200 dark:hover:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800"
                      }`}
                    >
                      <Icon
                        className={`w-5 h-5 ${
                          isSelected ? "text-green-500" : ""
                        }`}
                      />
                      {config.label}
                    </button>
                  );
                }
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
              Descrição{" "}
              <span className="text-red-500 dark:text-red-400">*</span>
            </label>
            <textarea
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              required
              rows={5}
              placeholder="Descreva sua solicitação com o máximo de detalhes possível..."
              className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-slate-700 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500 resize-none font-medium text-sm transition-all"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="flex-1 py-3 text-slate-600 dark:text-slate-400 font-bold hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSaving || !formData.description.trim()}
              className="flex-[2] bg-green-600 text-white py-3 rounded-xl font-bold hover:bg-green-700 disabled:opacity-40 transition-all shadow-lg shadow-green-100 dark:shadow-green-900/20 flex items-center justify-center gap-2"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Salvando...
                </>
              ) : mode === "create" ? (
                "Criar Solicitação"
              ) : (
                "Salvar Alterações"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};

// ─── Detail Modal ─────────────────────────────────────────────────────────────

interface DetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  request: Request | null;
}

const DetailModal = ({ isOpen, onClose, request }: DetailModalProps) => {
  if (!isOpen || !request) return null;

  const typeConfig =
    REQUEST_TYPE_CONFIG[request.requestType] || REQUEST_TYPE_CONFIG.OTHER;
  const statusConfig =
    STATUS_CONFIG[request.requestStatus] || STATUS_CONFIG.PENDING;
  const TypeIcon = typeConfig.icon;
  const fullyLocked = !canDelete(request);

  return createPortal(
    <div className="fixed inset-0 bg-slate-900/40 dark:bg-black/60 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl animate-in slide-in-from-bottom-4 duration-300 border border-slate-100 dark:border-slate-800">
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            Detalhes da Solicitação
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-slate-400 dark:text-slate-500" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          <div className="flex flex-wrap gap-2">
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-black border ${typeConfig.styles}`}
            >
              <TypeIcon className="w-3.5 h-3.5" />
              {typeConfig.label}
            </span>
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-black border ${statusConfig.styles}`}
            >
              <div className={`w-1.5 h-1.5 rounded-full ${statusConfig.dot}`} />
              {statusConfig.label}
            </span>
            {fullyLocked && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-black border bg-slate-50 text-slate-500 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700">
                <Lock className="w-3 h-3" />
                Somente leitura
              </span>
            )}
          </div>

          <div>
            <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">
              Descrição
            </p>
            <p className="text-slate-700 dark:text-slate-300 text-sm leading-relaxed bg-slate-50 dark:bg-slate-800 rounded-xl p-4">
              {request.description}
            </p>
          </div>

          {request.responseSuperAdmin && (
            <div>
              <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">
                Resposta do Administrador
              </p>
              <div
                className={`border rounded-xl p-4 ${
                  request.requestStatus === "APPROVED"
                    ? "bg-green-50 dark:bg-green-900/20 border-green-100 dark:border-green-800"
                    : request.requestStatus === "REJECTED"
                    ? "bg-red-50 dark:bg-red-900/20 border-red-100 dark:border-red-800"
                    : "bg-blue-50 dark:bg-blue-900/20 border-blue-100 dark:border-blue-800"
                }`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <MessageSquare
                    className={`w-4 h-4 ${
                      request.requestStatus === "APPROVED"
                        ? "text-green-600 dark:text-green-400"
                        : request.requestStatus === "REJECTED"
                        ? "text-red-600 dark:text-red-400"
                        : "text-blue-600 dark:text-blue-400"
                    }`}
                  />
                  <span
                    className={`text-xs font-bold ${
                      request.requestStatus === "APPROVED"
                        ? "text-green-700 dark:text-green-400"
                        : request.requestStatus === "REJECTED"
                        ? "text-red-700 dark:text-red-400"
                        : "text-blue-700 dark:text-blue-400"
                    }`}
                  >
                    Admin
                  </span>
                </div>
                <p
                  className={`text-sm leading-relaxed ${
                    request.requestStatus === "APPROVED"
                      ? "text-green-800 dark:text-green-300"
                      : request.requestStatus === "REJECTED"
                      ? "text-red-800 dark:text-red-300"
                      : "text-blue-800 dark:text-blue-300"
                  }`}
                >
                  {request.responseSuperAdmin}
                </p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4 pt-2">
            <div>
              <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">
                Criado em
              </p>
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                {formatDate(request.createdAt)}
              </p>
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">
                Atualizado em
              </p>
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                {formatDate(request.updatedAt)}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-full py-3 bg-slate-900 dark:bg-slate-800 text-white font-bold rounded-xl hover:bg-slate-800 dark:hover:bg-slate-700 transition-all"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────

const Requests = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const franchiseeId = user?.franchisee?.id;

  const [requests, setRequests] = useState<Request[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<RequestType | "ALL">("ALL");
  const [filterStatus, setFilterStatus] = useState<RequestStatus | "ALL">(
    "ALL"
  );
  const [sortBy, setSortBy] = useState("newest");
  const [isRefreshing, setIsRefreshing] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [currentRequest, setCurrentRequest] = useState<Request | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<Request | null>(null);

  const [formData, setFormData] = useState<FormData>({
    request_type: "OTHER",
    description: "",
  });

  const normalizeRequest = (r: any): Request => ({
    ...r,
    requestType: r.requestType ?? r.request_type,
    requestStatus: r.requestStatus ?? r.request_status,
    responseSuperAdmin: r.responseSuperAdmin ?? r.response_super_admin ?? "",
  });

  const fetchRequests = useCallback(async (id: string) => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await requestController.getAllByFranchiseeId({ id });
      setRequests((data || []).map(normalizeRequest));
    } catch (err) {
      setError(
        "Não foi possível carregar suas solicitações. Verifique sua conexão."
      );
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (franchiseeId) fetchRequests(franchiseeId);
  }, [franchiseeId, fetchRequests]);

  const filteredRequests = useMemo(() => {
    let result = [...requests];
    if (searchTerm) {
      const lower = searchTerm.toLowerCase();
      result = result.filter(
        (r) =>
          r.description?.toLowerCase().includes(lower) ||
          r.requestType?.toLowerCase().includes(lower)
      );
    }
    if (filterType !== "ALL")
      result = result.filter((r) => r.requestType === filterType);
    if (filterStatus !== "ALL")
      result = result.filter((r) => r.requestStatus === filterStatus);
    result.sort((a, b) =>
      sortBy === "newest"
        ? new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        : new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
    return result;
  }, [requests, searchTerm, filterType, filterStatus, sortBy]);

  const stats = useMemo(
    () => ({
      total: requests.length,
      pending: requests.filter((r) => r.requestStatus === "PENDING").length,
      approved: requests.filter((r) => r.requestStatus === "APPROVED").length,
      rejected: requests.filter((r) => r.requestStatus === "REJECTED").length,
    }),
    [requests]
  );

  const handleCreate = () => {
    setModalMode("create");
    setFormData({ request_type: "OTHER", description: "" });
    setCurrentRequest(null);
    setIsModalOpen(true);
  };

  const handleEdit = (req: Request) => {
    if (isLocked(req.requestStatus)) return;
    setModalMode("edit");
    setFormData({
      request_type: req.requestType,
      description: req.description,
    });
    setCurrentRequest(req);
    setIsModalOpen(true);
  };

  const handleViewDetail = (req: Request) => {
    setSelectedRequest(req);
    setIsDetailModalOpen(true);
  };

  const handleDelete = async (req: Request) => {
    if (!canDelete(req)) return;
    try {
      await requestController.deleteRequestById({ id: req.id });
      setRequests((prev) => prev.filter((r) => r.id !== req.id));
      toast({
        title: "Solicitação removida",
        description: "Excluída com sucesso.",
      });
    } catch {
      toast({
        title: "Erro ao excluir",
        description: "Ocorreu um problema ao tentar remover a solicitação.",
        variant: "destructive",
      });
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      if (modalMode === "create") {
        await requestController.createRequest({
          data: {
            franchisee_id: franchiseeId,
            request_type: formData.request_type,
            description: formData.description,
          },
        });
        toast({
          title: "Solicitação criada!",
          description: "Enviada com sucesso.",
        });
      } else if (currentRequest) {
        await requestController.updateRequestById({
          data: {
            id: currentRequest.id,
            franchiseeId: franchiseeId,
            request_type: formData.request_type,
            description: formData.description,
          },
        });
        toast({ title: "Atualizado!", description: "Os dados foram salvos." });
      }
      const updated = await requestController.getAllByFranchiseeId({
        id: franchiseeId,
      });
      setRequests((updated || []).map(normalizeRequest));
      setTimeout(() => {
        setIsModalOpen(false);
        setIsSaving(false);
      }, 300);
    } catch {
      toast({
        title: "Erro ao salvar",
        description: "Verifique os dados e tente novamente.",
        variant: "destructive",
      });
      setIsSaving(false);
    }
  };

  const handleRefresh = async () => {
    if (!franchiseeId || isRefreshing) return;
    setIsRefreshing(true);
    await fetchRequests(franchiseeId);
    setTimeout(() => setIsRefreshing(false), WAIT_TIMER);
  };

  const LoadingState = () => (
    <div className="flex flex-col items-center justify-center py-24 animate-in fade-in duration-500">
      <div className="relative">
        <div className="w-16 h-16 border-4 border-green-100 dark:border-green-900/30 border-t-green-600 rounded-full animate-spin"></div>
        <Loader2 className="w-6 h-6 text-green-600 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
      </div>
      <p className="mt-4 text-gray-500 dark:text-gray-400 font-medium">
        Carregando solicitações...
      </p>
    </div>
  );

  const EmptyState = () => (
    <div className="text-center py-20 px-4 animate-in zoom-in-95 duration-300">
      <div className="bg-slate-50 dark:bg-slate-800 w-24 h-24 rounded-3xl flex items-center justify-center mx-auto mb-6 rotate-3">
        <ClipboardList className="w-12 h-12 text-slate-300 dark:text-slate-600" />
      </div>
      <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
        {searchTerm || filterType !== "ALL" || filterStatus !== "ALL"
          ? "Nenhum resultado encontrado"
          : "Nenhuma solicitação ainda"}
      </h3>
      <p className="text-slate-500 dark:text-slate-400 mb-8 max-w-sm mx-auto">
        {searchTerm || filterType !== "ALL" || filterStatus !== "ALL"
          ? "Tente ajustar os filtros ou limpar a busca."
          : "Crie sua primeira solicitação para começar."}
      </p>
      <button
        onClick={
          searchTerm || filterType !== "ALL" || filterStatus !== "ALL"
            ? () => {
                setSearchTerm("");
                setFilterType("ALL");
                setFilterStatus("ALL");
              }
            : handleCreate
        }
        className="inline-flex items-center gap-2 bg-slate-900 dark:bg-green-600 hover:bg-slate-800 dark:hover:bg-green-700 text-white px-6 py-3 rounded-xl font-semibold transition-all shadow-lg active:scale-95"
      >
        {searchTerm || filterType !== "ALL" || filterStatus !== "ALL" ? (
          "Limpar Filtros"
        ) : (
          <>
            <Plus className="w-5 h-5" /> Nova Solicitação
          </>
        )}
      </button>
    </div>
  );

  return (
    <FranchiseeLayout>
      <div className="min-h-screen bg-[#F8FAFC] dark:bg-slate-950 p-4 md:p-8 transition-colors duration-300">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
            <div>
              <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">
                Solicitações
              </h1>
              <p className="text-slate-500 dark:text-slate-400 mt-2 text-lg">
                Gerencie suas solicitações e acompanhe o status de cada uma.
              </p>
            </div>
            <button
              onClick={handleCreate}
              className="flex items-center gap-2 bg-green-600 text-white px-6 py-3 rounded-2xl font-bold hover:bg-green-700 transition-all shadow-lg shadow-green-200 dark:shadow-green-900/20 active:scale-95"
            >
              <Plus className="w-5 h-5" />
              Nova Solicitação
            </button>
          </div>

          {/* Stats Cards */}
          {!isLoading && requests.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              {[
                { label: "Total", value: stats.total, dot: "bg-slate-400" },
                {
                  label: "Pendentes",
                  value: stats.pending,
                  dot: "bg-yellow-500",
                },
                {
                  label: "Aprovadas",
                  value: stats.approved,
                  dot: "bg-green-500",
                },
                {
                  label: "Rejeitadas",
                  value: stats.rejected,
                  dot: "bg-red-500",
                },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-5 shadow-sm"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <div className={`w-2 h-2 rounded-full ${stat.dot}`} />
                    <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                      {stat.label}
                    </span>
                  </div>
                  <span className="text-3xl font-black text-slate-900 dark:text-white">
                    {stat.value}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Filters & Search */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 p-2 mb-8">
            <div className="flex flex-col lg:flex-row gap-2">
              <div className="relative flex-1 group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 w-5 h-5 group-focus-within:text-green-500 transition-colors" />
                <input
                  type="text"
                  placeholder="Buscar por descrição ou tipo..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 bg-transparent border-none focus:ring-0 text-slate-700 dark:text-slate-200 placeholder:text-slate-400 font-medium"
                />
              </div>

              <div className="h-px lg:h-10 w-full lg:w-px bg-slate-100 dark:bg-slate-800 self-center" />

              <div className="flex items-center gap-1 p-2 overflow-x-auto no-scrollbar">
                {[
                  { label: "Todos", value: "ALL" },
                  { label: "Upgrade", value: "UPGRADE" },
                  { label: "Correção", value: "CORRECTION" },
                  { label: "Outro", value: "OTHER" },
                ].map((t) => (
                  <button
                    key={t.value}
                    onClick={() => setFilterType(t.value as any)}
                    className={`px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition-all ${
                      filterType === t.value
                        ? "bg-slate-900 dark:bg-green-600 text-white shadow-md"
                        : "text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              <div className="h-px lg:h-10 w-full lg:w-px bg-slate-100 dark:bg-slate-800 self-center" />

              <div className="flex items-center gap-2 p-2">
                <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 px-4 py-2 rounded-xl border border-slate-100 dark:border-slate-700">
                  <Filter className="w-4 h-4 text-slate-400" />
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value as any)}
                    className="bg-transparent text-sm font-bold text-slate-700 dark:text-slate-300 focus:outline-none cursor-pointer dark:bg-slate-800"
                  >
                    <option value="ALL">Todos Status</option>
                    <option value="PENDING">Pendente</option>
                    <option value="APPROVED">Aprovado</option>
                    <option value="REJECTED">Rejeitado</option>
                    <option value="IN_PROGRESS">Em Andamento</option>
                  </select>
                </div>
                <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 px-4 py-2 rounded-xl border border-slate-100 dark:border-slate-700">
                  <ArrowUpDown className="w-4 h-4 text-slate-400" />
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="bg-transparent text-sm font-bold text-slate-700 dark:text-slate-300 focus:outline-none cursor-pointer dark:bg-slate-800"
                  >
                    <option value="newest">Recentes</option>
                    <option value="oldest">Antigos</option>
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

          {/* Count bar */}
          {!isLoading && requests.length > 0 && (
            <div className="flex items-center justify-between mb-6 px-2">
              <span className="text-sm font-medium text-slate-500 dark:text-slate-400">
                Mostrando{" "}
                <strong className="text-slate-900 dark:text-white">
                  {filteredRequests.length}
                </strong>{" "}
                de {requests.length} solicitações
              </span>
              {(searchTerm ||
                filterType !== "ALL" ||
                filterStatus !== "ALL") && (
                <button
                  onClick={() => {
                    setSearchTerm("");
                    setFilterType("ALL");
                    setFilterStatus("ALL");
                  }}
                  className="text-sm font-bold text-green-600 dark:text-green-400 hover:text-green-700 flex items-center gap-1"
                >
                  <X className="w-4 h-4" /> Limpar filtros
                </button>
              )}
            </div>
          )}

          {/* Table */}
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
            ) : filteredRequests.length === 0 ? (
              <EmptyState />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse min-w-[800px]">
                  <thead>
                    <tr className="bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                      <th className="px-8 py-5 text-left text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest w-[160px]">
                        Tipo
                      </th>
                      <th className="px-8 py-5 text-left text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                        Descrição
                      </th>
                      <th className="px-8 py-5 text-left text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest w-[160px]">
                        Status
                      </th>
                      <th className="px-8 py-5 text-left text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest w-[160px]">
                        Data
                      </th>
                      <th className="px-8 py-5 text-right text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest w-[160px]">
                        Ações
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                    {filteredRequests.map((req) => {
                      const typeConfig =
                        REQUEST_TYPE_CONFIG[req.requestType] ||
                        REQUEST_TYPE_CONFIG.OTHER;
                      const statusConfig =
                        STATUS_CONFIG[req.requestStatus] ||
                        STATUS_CONFIG.PENDING;
                      const TypeIcon = typeConfig.icon;
                      const locked = isLocked(req.requestStatus);
                      const deletable = canDelete(req);

                      return (
                        <tr
                          key={req.id}
                          className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-all group"
                        >
                          {/* Type */}
                          <td className="px-8 py-5">
                            <span
                              className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-black border ${typeConfig.styles}`}
                            >
                              <TypeIcon className="w-3.5 h-3.5" />
                              {typeConfig.label}
                            </span>
                          </td>

                          {/* Description */}
                          <td className="px-8 py-5">
                            <p className="text-sm text-slate-700 dark:text-slate-300 line-clamp-2 max-w-[400px] font-medium">
                              {req.description}
                            </p>
                            {req.responseSuperAdmin && (
                              <div
                                className={`mt-2 flex items-start gap-2 px-3 py-2 rounded-lg border text-xs font-medium max-w-[400px] ${
                                  req.requestStatus === "APPROVED"
                                    ? "bg-green-50 border-green-100 text-green-700 dark:bg-green-900/20 dark:border-green-800 dark:text-green-400"
                                    : req.requestStatus === "REJECTED"
                                    ? "bg-red-50 border-red-100 text-red-700 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400"
                                    : "bg-blue-50 border-blue-100 text-blue-700 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-400"
                                }`}
                              >
                                <MessageSquare className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                                <span className="line-clamp-2">
                                  <span className="font-bold mr-1">Admin:</span>
                                  {req.responseSuperAdmin}
                                </span>
                              </div>
                            )}
                          </td>

                          {/* Status */}
                          <td className="px-8 py-5">
                            <div className="flex flex-col gap-1.5">
                              <span
                                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-black border w-fit ${statusConfig.styles}`}
                              >
                                <div
                                  className={`w-1.5 h-1.5 rounded-full ${statusConfig.dot}`}
                                />
                                {statusConfig.label}
                              </span>
                              {!deletable && (
                                <span className="inline-flex items-center gap-1 text-xs text-slate-400 dark:text-slate-500 font-medium">
                                  <Lock className="w-3 h-3" />
                                  Somente leitura
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Date */}
                          <td className="px-8 py-5 whitespace-nowrap">
                            <div className="flex items-center text-sm text-slate-500 dark:text-slate-400 font-medium">
                              <Calendar className="w-4 h-4 mr-2 text-slate-300 dark:text-slate-600 shrink-0" />
                              {formatDate(req.createdAt)}
                            </div>
                          </td>

                          {/* Actions */}
                          <td className="px-8 py-5 whitespace-nowrap text-right">
                            <div className="flex justify-end items-center gap-1">
                              {/* Ver detalhes — sempre visível */}
                              <button
                                onClick={() => handleViewDetail(req)}
                                className="p-2.5 text-slate-400 dark:text-slate-500 hover:text-green-600 dark:hover:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-xl transition-all"
                                title="Ver detalhes"
                              >
                                <ChevronRight className="w-4 h-4" />
                              </button>

                              <div className="w-px h-4 bg-slate-100 dark:bg-slate-800 mx-1" />

                              {/* Editar — bloqueado se APPROVED ou REJECTED */}
                              {!locked ? (
                                <button
                                  onClick={() => handleEdit(req)}
                                  className="p-2.5 text-slate-400 dark:text-slate-500 hover:text-green-600 dark:hover:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-xl transition-all"
                                  title="Editar"
                                >
                                  <Edit2 className="w-4 h-4" />
                                </button>
                              ) : (
                                <button
                                  disabled
                                  title="Edição bloqueada"
                                  className="p-2.5 text-slate-200 dark:text-slate-700 rounded-xl cursor-not-allowed"
                                >
                                  <Lock className="w-4 h-4" />
                                </button>
                              )}

                              <div className="w-px h-4 bg-slate-100 dark:bg-slate-800 mx-1" />

                              {/* Excluir — bloqueado se tiver resposta do admin OU status bloqueado */}
                              {deletable ? (
                                <button
                                  onClick={() => handleDelete(req)}
                                  className="p-2.5 text-slate-400 dark:text-slate-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all"
                                  title="Excluir"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              ) : (
                                <button
                                  disabled
                                  title="Exclusão bloqueada"
                                  className="p-2.5 text-slate-200 dark:text-slate-700 rounded-xl cursor-not-allowed"
                                >
                                  <Lock className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      <RequestModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSave}
        formData={formData}
        setFormData={setFormData}
        mode={modalMode}
        isSaving={isSaving}
      />

      <DetailModal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        request={selectedRequest}
      />
    </FranchiseeLayout>
  );
};

export default Requests;
