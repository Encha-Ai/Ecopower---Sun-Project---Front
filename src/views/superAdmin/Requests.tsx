import React, { useEffect, useState, useMemo, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import * as requestController from "@/controllers/superAdmin/RequestController";
import {
  Search,
  Trash2,
  X,
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
  Send,
  ShieldCheck,
  ArrowLeft,
} from "lucide-react";
import { createPortal } from "react-dom";

const WAIT_TIMER = 800;

// ─── Types ────────────────────────────────────────────────────────────────────

type RequestType = "UPGRADE" | "CORRECTION" | "OTHER";
type RequestStatus = "PENDING" | "APPROVED" | "REJECTED";

interface FranchiseeInfo {
  id: string;
  name: string;
  plan: string;
  email: string;
  phone: string;
}

interface Request {
  id: string;
  franchisee: FranchiseeInfo;
  request_type: RequestType;
  request_status: RequestStatus;
  description: string;
  response_super_admin: string;
  updatedAt: string;
  createdAt: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const REQUEST_TYPE_CONFIG: Record<
  RequestType,
  { label: string; icon: React.FC<any>; styles: string }
> = {
  UPGRADE: {
    label: "Upgrade",
    icon: Zap,
    styles:
      "bg-amber-50 text-amber-700 border-amber-100 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800",
  },
  CORRECTION: {
    label: "Correção",
    icon: Wrench,
    styles:
      "bg-blue-50 text-blue-700 border-blue-100 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800",
  },
  OTHER: {
    label: "Outro",
    icon: MoreHorizontal,
    styles:
      "bg-slate-50 text-slate-700 border-slate-100 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700",
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
      "bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800",
    dot: "bg-emerald-500",
  },
  REJECTED: {
    label: "Rejeitado",
    icon: XCircle,
    styles:
      "bg-red-50 text-red-700 border-red-100 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800",
    dot: "bg-red-500",
  },
};

const formatDate = (d: string) => {
  if (!d) return "---";
  return new Date(d).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const getDaysOld = (d: string) =>
  Math.floor((Date.now() - new Date(d).getTime()) / (1000 * 60 * 60 * 24));

const canDelete = (req: Request) => {
  const days = getDaysOld(req.createdAt);
  return (
    days >= 15 &&
    (req.request_status === "APPROVED" || req.request_status === "REJECTED")
  );
};

const getDeleteBlockReason = (req: Request): string | null => {
  const days = getDaysOld(req.createdAt);
  if (req.request_status === "PENDING")
    return "Não é possível excluir solicitações Pendentes.";
  if (days < 15)
    return `Só é possível excluir após 15 dias. Faltam ${15 - days} dia(s).`;
  return null;
};

// ─── Review Modal ─────────────────────────────────────────────────────────────

const ReviewModal = ({
  isOpen,
  onClose,
  request,
  onSave,
  isSaving,
}: {
  isOpen: boolean;
  onClose: () => void;
  request: Request | null;
  onSave: (status: RequestStatus, response: string) => Promise<void>;
  isSaving: boolean;
}) => {
  // Inicia sempre como APPROVED (nunca PENDING)
  const [status, setStatus] = useState<"APPROVED" | "REJECTED">("APPROVED");
  const [response, setResponse] = useState("");

  useEffect(() => {
    if (request) {
      // Se já foi respondida, manter o status atual; se ainda está pendente, default para APPROVED
      setStatus(
        request.request_status === "REJECTED" ? "REJECTED" : "APPROVED"
      );
      setResponse(request.response_super_admin || "");
    }
  }, [request]);

  if (!isOpen || !request) return null;

  const typeConfig =
    REQUEST_TYPE_CONFIG[request.request_type] || REQUEST_TYPE_CONFIG.OTHER;
  const TypeIcon = typeConfig.icon;

  // Apenas APPROVED e REJECTED — sem PENDING
  const statusOptions: {
    value: "APPROVED" | "REJECTED";
    label: string;
    icon: React.FC<any>;
    active: string;
  }[] = [
    {
      value: "APPROVED",
      label: "Aprovado",
      icon: CheckCircle2,
      active:
        "border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-600",
    },
    {
      value: "REJECTED",
      label: "Rejeitado",
      icon: XCircle,
      active:
        "border-red-500 bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300 dark:border-red-600",
    },
  ];

  return createPortal(
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 z-50 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 w-full sm:max-w-md sm:rounded-2xl rounded-t-2xl shadow-2xl border border-slate-100 dark:border-slate-800 animate-in slide-in-from-bottom-4 duration-300 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-bold text-xs shrink-0">
              {request.franchisee.name.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="font-bold text-slate-900 dark:text-white text-sm truncate leading-none">
                {request.franchisee.name}
              </p>
              <div className="flex items-center gap-2 mt-0.5">
                <span
                  className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-black border ${typeConfig.styles}`}
                >
                  <TypeIcon className="w-2.5 h-2.5" />
                  {typeConfig.label}
                </span>
                <span className="text-[10px] text-slate-400">
                  {getDaysOld(request.createdAt)}d atrás
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isSaving}
            className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors disabled:opacity-50 shrink-0 ml-2"
          >
            <X className="w-4 h-4 text-slate-400" />
          </button>
        </div>

        {/* Body */}
        <div className="px-5 py-4 space-y-4 overflow-y-auto flex-1">
          {/* Descrição resumida */}
          <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl px-4 py-3">
            <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">
              Solicitação
            </p>
            <p className="text-sm text-slate-700 dark:text-slate-300 line-clamp-3 leading-relaxed">
              {request.description}
            </p>
          </div>

          {/* Status — apenas APROVADO e REJEITADO */}
          <div>
            <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">
              Decisão
            </p>
            <div className="grid grid-cols-2 gap-2">
              {statusOptions.map((opt) => {
                const Icon = opt.icon;
                const isSelected = status === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setStatus(opt.value)}
                    className={`flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl border-2 text-xs font-bold transition-all ${
                      isSelected
                        ? opt.active
                        : "border-slate-100 dark:border-slate-800 text-slate-400 dark:text-slate-500 hover:border-slate-200 dark:hover:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800"
                    }`}
                  >
                    <Icon
                      className={`w-4 h-4 ${!isSelected ? "opacity-40" : ""}`}
                    />
                    <span>{opt.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Resposta — sempre obrigatória */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">
              Resposta ao Franqueado{" "}
              <span className="text-red-400 normal-case font-normal">
                (obrigatório)
              </span>
            </label>
            <textarea
              value={response}
              onChange={(e) => setResponse(e.target.value)}
              required
              rows={3}
              placeholder={
                status === "APPROVED"
                  ? "Sua solicitação foi aprovada..."
                  : "Infelizmente não foi possível atender pois..."
              }
              className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-slate-700 dark:text-slate-200 placeholder:text-slate-400 resize-none text-sm transition-all"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-slate-100 dark:border-slate-800 flex gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="flex-1 py-2.5 text-slate-600 dark:text-slate-400 font-bold text-sm hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={() => onSave(status, response)}
            disabled={isSaving || !response.trim()}
            className="flex-[2] bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white py-2.5 rounded-xl font-bold text-sm disabled:opacity-40 transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Salvando...
              </>
            ) : (
              <>
                <Send className="w-4 h-4" /> Salvar Resposta
              </>
            )}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

// ─── Detail Modal ─────────────────────────────────────────────────────────────

const DetailModal = ({
  isOpen,
  onClose,
  request,
  onReview,
}: {
  isOpen: boolean;
  onClose: () => void;
  request: Request | null;
  onReview: (req: Request) => void;
}) => {
  if (!isOpen || !request) return null;

  const typeConfig =
    REQUEST_TYPE_CONFIG[request.request_type] || REQUEST_TYPE_CONFIG.OTHER;
  const statusConfig =
    STATUS_CONFIG[request.request_status] || STATUS_CONFIG.PENDING;
  const TypeIcon = typeConfig.icon;

  return createPortal(
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 z-50 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 w-full sm:max-w-md sm:rounded-2xl rounded-t-2xl shadow-2xl border border-slate-100 dark:border-slate-800 animate-in slide-in-from-bottom-4 duration-300 flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800 shrink-0">
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            Detalhes da Solicitação
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-4 h-4 text-slate-400" />
          </button>
        </div>

        <div className="px-5 py-4 space-y-4 overflow-y-auto flex-1">
          {/* Franchisee */}
          <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-3 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-bold text-sm shrink-0">
              {request.franchisee.name.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="font-bold text-sm text-slate-900 dark:text-white truncate">
                {request.franchisee.name}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                {request.franchisee.email}
              </p>
            </div>
          </div>

          {/* Badges */}
          <div className="flex flex-wrap gap-2">
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-black border ${typeConfig.styles}`}
            >
              <TypeIcon className="w-3 h-3" />
              {typeConfig.label}
            </span>
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-black border ${statusConfig.styles}`}
            >
              <div className={`w-1.5 h-1.5 rounded-full ${statusConfig.dot}`} />
              {statusConfig.label}
            </span>
          </div>

          {/* Description */}
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
              Descrição
            </p>
            <p className="text-slate-700 dark:text-slate-300 text-sm leading-relaxed bg-slate-50 dark:bg-slate-800 rounded-xl p-3 whitespace-pre-wrap">
              {request.description}
            </p>
          </div>

          {/* Admin Response */}
          {request.response_super_admin && (
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                Sua Resposta
              </p>
              <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800 rounded-xl p-3">
                <div className="flex items-center gap-1.5 mb-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400">
                    SuperAdmin
                  </span>
                </div>
                <p className="text-emerald-800 dark:text-emerald-300 text-sm leading-relaxed">
                  {request.response_super_admin}
                </p>
              </div>
            </div>
          )}

          {/* Dates */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                Criado
              </p>
              <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                {formatDate(request.createdAt)}
              </p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                Atualizado
              </p>
              <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                {formatDate(request.updatedAt)}
              </p>
            </div>
          </div>
        </div>

        <div className="px-5 py-4 border-t border-slate-100 dark:border-slate-800 flex gap-3 shrink-0">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-sm rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
          >
            Fechar
          </button>
          <button
            onClick={() => {
              onClose();
              onReview(request);
            }}
            className="flex-[2] flex items-center justify-center gap-2 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-bold text-sm rounded-xl transition-all shadow-lg shadow-emerald-500/20"
          >
            <Send className="w-3.5 h-3.5" /> Revisar
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────

const SuperAdminRequests = () => {
  const { toast } = useToast();
  const navigate = useNavigate();

  const [requests, setRequests] = useState<Request[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<RequestType | "ALL">("ALL");
  const [filterStatus, setFilterStatus] = useState<RequestStatus | "ALL">(
    "ALL"
  );
  const [sortBy, setSortBy] = useState("newest");

  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<Request | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const fetchRequests = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await requestController.getAll();
      setRequests(data || []);
    } catch (err) {
      setError("Não foi possível carregar as solicitações.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const filteredRequests = useMemo(() => {
    let result = [...requests];
    if (searchTerm) {
      const lower = searchTerm.toLowerCase();
      result = result.filter(
        (r) =>
          r.description?.toLowerCase().includes(lower) ||
          r.franchisee?.name?.toLowerCase().includes(lower) ||
          r.franchisee?.email?.toLowerCase().includes(lower)
      );
    }
    if (filterType !== "ALL")
      result = result.filter((r) => r.request_type === filterType);
    if (filterStatus !== "ALL")
      result = result.filter((r) => r.request_status === filterStatus);
    result.sort((a, b) => {
      if (sortBy === "oldest")
        return (
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );
      if (sortBy === "franchisee")
        return a.franchisee.name.localeCompare(b.franchisee.name);
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
    return result;
  }, [requests, searchTerm, filterType, filterStatus, sortBy]);

  const stats = useMemo(
    () => ({
      total: requests.length,
      pending: requests.filter((r) => r.request_status === "PENDING").length,
      approved: requests.filter((r) => r.request_status === "APPROVED").length,
      rejected: requests.filter((r) => r.request_status === "REJECTED").length,
    }),
    [requests]
  );

  const handleSaveReview = async (status: RequestStatus, response: string) => {
    if (!selectedRequest) return;
    setIsSaving(true);
    try {
      await requestController.updateRequestById({
        data: {
          id: selectedRequest.id,
          request_status: status,
          response_super_admin: response,
        },
      });
      toast({
        title: "Solicitação atualizada!",
        description: "O franqueado será notificado.",
      });
      setRequests((prev) =>
        prev.map((r) =>
          r.id === selectedRequest.id
            ? { ...r, request_status: status, response_super_admin: response }
            : r
        )
      );
      setIsReviewModalOpen(false);
      setSelectedRequest(null);
    } catch {
      toast({ title: "Erro ao salvar", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (req: Request) => {
    const blockReason = getDeleteBlockReason(req);
    if (blockReason) {
      toast({
        title: "Exclusão bloqueada",
        description: blockReason,
        variant: "destructive",
      });
      return;
    }
    try {
      await requestController.deleteRequestById({ id: req.id });
      setRequests((prev) => prev.filter((r) => r.id !== req.id));
      toast({ title: "Solicitação excluída." });
    } catch {
      toast({ title: "Erro ao excluir", variant: "destructive" });
    }
  };

  const handleRefresh = async () => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    await fetchRequests();
    setTimeout(() => setIsRefreshing(false), WAIT_TIMER);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-6">
      {/* HEADER */}
      <div className="flex flex-col gap-6 mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate("/superadmin")}
              className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full transition-colors"
            >
              <ArrowLeft className="w-6 h-6 text-slate-600 dark:text-slate-400" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
                Solicitações
              </h1>
              <p className="text-slate-500 dark:text-slate-400 text-sm">
                Monitore, aprove ou rejeite as solicitações dos franqueados
              </p>
            </div>
          </div>
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full transition-colors"
          >
            <RefreshCcw
              className={`w-5 h-5 text-slate-600 dark:text-slate-400 ${
                isRefreshing ? "animate-spin" : ""
              }`}
            />
          </button>
        </div>

        {/* Stats */}
        {!isLoading && requests.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              {
                label: "Total",
                value: stats.total,
                icon: ClipboardList,
                color: "text-slate-600 dark:text-slate-300",
                bg: "bg-slate-100 dark:bg-slate-800",
              },
              {
                label: "Pendentes",
                value: stats.pending,
                icon: Clock,
                color: "text-yellow-600 dark:text-yellow-400",
                bg: "bg-yellow-50 dark:bg-yellow-900/20",
              },
              {
                label: "Aprovadas",
                value: stats.approved,
                icon: CheckCircle2,
                color: "text-emerald-600 dark:text-emerald-400",
                bg: "bg-emerald-50 dark:bg-emerald-900/20",
              },
              {
                label: "Rejeitadas",
                value: stats.rejected,
                icon: XCircle,
                color: "text-red-600 dark:text-red-400",
                bg: "bg-red-50 dark:bg-red-900/20",
              },
            ].map((s) => {
              const Icon = s.icon;
              return (
                <div
                  key={s.label}
                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex items-center gap-3 shadow-sm"
                >
                  <div
                    className={`w-9 h-9 rounded-lg ${s.bg} flex items-center justify-center shrink-0`}
                  >
                    <Icon className={`w-4 h-4 ${s.color}`} />
                  </div>
                  <div>
                    <p className={`text-xl font-black ${s.color} leading-none`}>
                      {s.value}
                    </p>
                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                      {s.label}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Filter bar */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row gap-3 items-center">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar franqueado, descrição..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-slate-100 placeholder:text-slate-400"
            />
          </div>

          <div className="flex flex-wrap gap-2 w-full md:w-auto">
            <div className="flex gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
              {[
                { l: "Todos", v: "ALL" },
                { l: "Upgrade", v: "UPGRADE" },
                { l: "Correção", v: "CORRECTION" },
                { l: "Outro", v: "OTHER" },
              ].map((t) => (
                <button
                  key={t.v}
                  onClick={() => setFilterType(t.v as any)}
                  className={`px-3 py-1.5 rounded-md text-xs font-bold whitespace-nowrap transition-all ${
                    filterType === t.v
                      ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-sm"
                      : "text-slate-500 dark:text-slate-400 hover:text-slate-700"
                  }`}
                >
                  {t.l}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as any)}
                className="bg-transparent text-xs font-bold text-slate-700 dark:text-slate-300 focus:outline-none cursor-pointer"
              >
                <option value="ALL">Todos Status</option>
                <option value="PENDING">Pendente</option>
                <option value="APPROVED">Aprovado</option>
                <option value="REJECTED">Rejeitado</option>
              </select>
            </div>

            <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700">
              <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-transparent text-xs font-bold text-slate-700 dark:text-slate-300 focus:outline-none cursor-pointer"
              >
                <option value="newest">Recentes</option>
                <option value="oldest">Antigos</option>
                <option value="franchisee">Franqueado</option>
              </select>
            </div>

            {(searchTerm || filterType !== "ALL" || filterStatus !== "ALL") && (
              <button
                onClick={() => {
                  setSearchTerm("");
                  setFilterType("ALL");
                  setFilterStatus("ALL");
                }}
                className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg transition-colors"
              >
                <X className="w-3.5 h-3.5" /> Limpar
              </button>
            )}
          </div>
        </div>
      </div>

      {/* TABELA */}
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
        {!isLoading && filteredRequests.length > 0 && (
          <div className="hidden md:grid grid-cols-12 px-6 py-3 text-[10px] font-bold text-slate-400 dark:text-slate-600 uppercase tracking-widest bg-slate-50 dark:bg-slate-800/30 border-b border-slate-100 dark:border-slate-800">
            <div className="col-span-3">Franqueado</div>
            <div className="col-span-2">Tipo</div>
            <div className="col-span-3">Descrição</div>
            <div className="col-span-1">Status</div>
            <div className="col-span-1">Data</div>
            <div className="col-span-2 text-right">Ações</div>
          </div>
        )}

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <div className="w-10 h-10 border-4 border-emerald-100 dark:border-emerald-900/30 border-t-emerald-500 rounded-full animate-spin" />
            <p className="text-sm text-slate-400 animate-pulse">
              Carregando solicitações...
            </p>
          </div>
        ) : error ? (
          <div className="py-16 text-center">
            <div className="bg-red-50 dark:bg-red-900/20 w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-7 h-7 text-red-500" />
            </div>
            <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
              {error}
            </p>
            <button
              onClick={handleRefresh}
              className="mt-3 text-emerald-600 font-bold text-sm hover:underline"
            >
              Tentar novamente
            </button>
          </div>
        ) : filteredRequests.length === 0 ? (
          <div className="text-center py-20 px-4">
            <div className="bg-slate-50 dark:bg-slate-800 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <ClipboardList className="w-8 h-8 text-slate-300 dark:text-slate-600" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">
              {searchTerm || filterType !== "ALL" || filterStatus !== "ALL"
                ? "Nenhum resultado"
                : "Nenhuma solicitação ainda"}
            </h3>
            <p className="text-slate-400 text-sm">
              {searchTerm || filterType !== "ALL" || filterStatus !== "ALL"
                ? "Tente ajustar os filtros."
                : "As solicitações aparecerão aqui."}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-50 dark:divide-slate-800/30">
            {filteredRequests.map((req) => {
              const typeConfig =
                REQUEST_TYPE_CONFIG[req.request_type] ||
                REQUEST_TYPE_CONFIG.OTHER;
              const statusConfig =
                STATUS_CONFIG[req.request_status] || STATUS_CONFIG.PENDING;
              const TypeIcon = typeConfig.icon;
              const deletable = canDelete(req);
              const deleteReason = getDeleteBlockReason(req);

              return (
                <div
                  key={req.id}
                  className="grid md:grid-cols-12 gap-3 px-6 py-4 hover:bg-slate-50 dark:hover:bg-slate-800/20 transition-colors items-center border-l-4 border-transparent hover:border-emerald-500"
                >
                  {/* Franchisee */}
                  <div className="md:col-span-3 flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-bold text-xs shrink-0 shadow-sm">
                      {req.franchisee.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-slate-900 dark:text-slate-100 text-sm truncate">
                        {req.franchisee.name}
                      </p>
                      <span
                        className={`text-[10px] font-black px-1.5 py-0.5 rounded-full ${
                          req.franchisee.plan === "PREMIUM"
                            ? "bg-violet-100 dark:bg-violet-950/50 text-violet-700 dark:text-violet-400"
                            : "bg-blue-100 dark:bg-blue-950/50 text-blue-700 dark:text-blue-400"
                        }`}
                      >
                        {req.franchisee.plan}
                      </span>
                    </div>
                  </div>

                  {/* Type */}
                  <div className="md:col-span-2">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-black border ${typeConfig.styles}`}
                    >
                      <TypeIcon className="w-3 h-3" />
                      {typeConfig.label}
                    </span>
                  </div>

                  {/* Description */}
                  <div className="md:col-span-3">
                    <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 font-medium">
                      {req.description}
                    </p>
                    {req.response_super_admin && (
                      <div className="flex items-center gap-1 mt-1">
                        <MessageSquare className="w-3 h-3 text-emerald-500" />
                        <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">
                          Respondido
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Status */}
                  <div className="md:col-span-1">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black border ${statusConfig.styles}`}
                    >
                      <div
                        className={`w-1.5 h-1.5 rounded-full ${statusConfig.dot}`}
                      />
                      {statusConfig.label}
                    </span>
                  </div>

                  {/* Date */}
                  <div className="md:col-span-1">
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                      {formatDate(req.createdAt)}
                    </p>
                    <p className="text-[10px] text-slate-400 dark:text-slate-600 mt-0.5">
                      {getDaysOld(req.createdAt)}d atrás
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="md:col-span-2 flex items-center justify-end gap-1.5">
                    <button
                      onClick={() => {
                        setSelectedRequest(req);
                        setIsDetailModalOpen(true);
                      }}
                      title="Ver detalhes"
                      className="h-8 w-8 flex items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                    >
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => {
                        setSelectedRequest(req);
                        setIsReviewModalOpen(true);
                      }}
                      title="Revisar"
                      className="h-8 w-8 flex items-center justify-center rounded-lg bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 transition-colors"
                    >
                      <Send className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(req)}
                      title={deleteReason ?? "Excluir"}
                      disabled={!deletable}
                      className={`h-8 w-8 flex items-center justify-center rounded-lg transition-colors ${
                        deletable
                          ? "bg-red-50 dark:bg-red-950/30 text-red-500 hover:bg-red-100"
                          : "bg-slate-50 dark:bg-slate-800/50 text-slate-300 dark:text-slate-700 cursor-not-allowed"
                      }`}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Footer */}
        {!isLoading && filteredRequests.length > 0 && (
          <div className="px-6 py-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/10 flex items-center justify-between">
            <p className="text-xs text-slate-400">
              <span className="font-semibold text-slate-600 dark:text-slate-400">
                {filteredRequests.length}
              </span>{" "}
              solicitação(ões)
            </p>
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1 text-xs text-slate-400">
                <span className="w-2 h-2 rounded-full bg-yellow-400" />{" "}
                {stats.pending} pendentes
              </span>
              <span className="flex items-center gap-1 text-xs text-slate-400">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />{" "}
                {stats.approved} aprovadas
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      <ReviewModal
        isOpen={isReviewModalOpen}
        onClose={() => {
          setIsReviewModalOpen(false);
          setSelectedRequest(null);
        }}
        request={selectedRequest}
        onSave={handleSaveReview}
        isSaving={isSaving}
      />
      <DetailModal
        isOpen={isDetailModalOpen}
        onClose={() => {
          setIsDetailModalOpen(false);
          setSelectedRequest(null);
        }}
        request={selectedRequest}
        onReview={(req) => {
          setSelectedRequest(req);
          setIsReviewModalOpen(true);
        }}
      />
    </div>
  );
};

export default SuperAdminRequests;
