import React, { useEffect, useRef, useState, useMemo } from "react";
import { createPortal } from "react-dom";
import { useAuth } from "@/contexts/AuthContext";
import FranchiseeLayout from "@/components/Franchisee/FranchiseeLayout";
import * as leadsController from "@/controllers/franchisee/LeadController";
import * as shootingMessageController from "@/controllers/franchisee/ShootingMessageController";
import { verifyInstanceEvo } from "@/controllers/franchisee/Chat";
import { Link } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Send,
  Loader2,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  Users,
  MessageSquare,
  Zap,
  AlertCircle,
  History,
  Mail,
  Phone,
  Trash,
  WifiOff,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Timer,
  X,
  Plus,
  Shuffle,
  StopCircle,
} from "lucide-react";

// ── Interfaces ────────────────────────────────────────────────────────────────
interface Lead {
  id: string;
  name: string;
  phone: string;
  email: string;
  type: string;
  createdAt: string;
}

interface ShootingMessage {
  id: string;
  message: string;
  statusShootingMessage: "SEND" | "ERROR";
  error_message: string | null;
  lead: Lead;
  create_at: string;
}

interface BatchProgress {
  processed: number;
  total: number;
}

// ── Utilitários ───────────────────────────────────────────────────────────────
const formatSeconds = (s: number): string => {
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  const remaining = s % 60;
  if (remaining === 0) return `${m} min`;
  return `${m} min ${remaining}s`;
};

const estimateTime = (count: number) => ({
  min: formatSeconds(count * 40),
  max: formatSeconds(count * 60),
});

// ── MessagesComposer — FORA do componente pai para evitar remount a cada render ──
interface MessagesComposerProps {
  messages: string[];
  disabled: boolean;
  onAdd: () => void;
  onRemove: (index: number) => void;
  onUpdate: (index: number, value: string) => void;
}

const MessagesComposer = ({
  messages,
  disabled,
  onAdd,
  onRemove,
  onUpdate,
}: MessagesComposerProps) => (
  <div className="space-y-3">
    <div className="flex items-center justify-between">
      <label className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
        <Shuffle className="w-4 h-4 text-green-500" />
        Mensagens Aleatórias
      </label>
      <span className="text-xs font-bold text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">
        {messages.length}/5
      </span>
    </div>

    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium -mt-1">
      Uma mensagem aleatória será enviada para cada lead.
    </p>

    <div className="space-y-2.5">
      {messages.map((msg, index) => (
        <div key={index} className="relative group">
          <div className="flex items-start gap-2">
            <span className="mt-3 flex-shrink-0 w-6 h-6 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs font-black flex items-center justify-center">
              {index + 1}
            </span>
            <div className="flex-1 relative">
              <textarea
                value={msg}
                onChange={(e) => onUpdate(index, e.target.value)}
                placeholder={`Mensagem ${index + 1}...`}
                rows={2}
                disabled={disabled}
                className="w-full p-3 pr-8 bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-2xl focus:ring-4 focus:ring-green-500/10 focus:border-green-500 transition-all resize-none font-medium text-slate-700 dark:text-slate-200 disabled:opacity-50 placeholder:text-slate-400 text-sm"
              />
              {messages.length > 1 && (
                <button
                  type="button"
                  onClick={() => onRemove(index)}
                  disabled={disabled}
                  className="absolute top-2 right-2 p-1 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-slate-300 dark:text-slate-600 hover:text-red-500 transition-colors disabled:opacity-50"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>

    {messages.length < 5 && (
      <button
        type="button"
        onClick={onAdd}
        disabled={disabled}
        className="w-full py-2.5 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700 text-slate-400 dark:text-slate-500 hover:border-green-400 dark:hover:border-green-600 hover:text-green-600 dark:hover:text-green-400 transition-all text-xs font-bold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <Plus className="w-3.5 h-3.5" /> Adicionar variação ({messages.length}
        /5)
      </button>
    )}
  </div>
);

// ── Componente principal ──────────────────────────────────────────────────────
export default function ShootingMessage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const franchiseeId = user?.franchisee?.id;

  const [leads, setLeads] = useState<Lead[]>([]);
  const [shootingMessagesHistoric, setShootingMessagesHistoric] = useState<
    ShootingMessage[]
  >([]);
  const [selectedLeads, setSelectedLeads] = useState<Set<string>>(new Set());
  const [messages, setMessages] = useState<string[]>([""]);

  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingConnection, setIsCheckingConnection] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [searchFilter, setSearchFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "SEND" | "ERROR">(
    "ALL",
  );
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  const [currentBatchId, setCurrentBatchId] = useState<string | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);
  const [batchProgress, setBatchProgress] = useState<BatchProgress | null>(
    null,
  );

  const [mobilePanel, setMobilePanel] = useState<"leads" | "message">("leads");

  // ── Ref do polling ─────────────────────────────────────────────────────────
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopPolling = () => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
  };

  const finishBatch = async () => {
    stopPolling();
    setIsLoading(false);
    setCurrentBatchId(null);
    setBatchProgress(null);
    try {
      const historyData =
        await shootingMessageController.getShootingMessagesHistoryByFranchiseeId(
          franchiseeId,
        );
      setShootingMessagesHistoric(historyData);
    } catch {
      // silencioso
    }
  };

  const startPolling = (batchId: string) => {
    stopPolling(); // garante que não há polling duplicado

    pollingRef.current = setInterval(async () => {
      try {
        const status = await shootingMessageController.getStatusShooting({
          batchId,
        });

        setBatchProgress({
          processed: status.processedLeads,
          total: status.totalLeads,
        });

        if (status.status === "FINISHED") {
          await finishBatch();
          toast({
            title: "✅ Disparo concluído!",
            description: `${status.processedLeads} de ${status.totalLeads} mensagens enviadas.`,
          });
        }

        if (status.status === "CANCELLED") {
          await finishBatch();
        }
      } catch (error) {
        console.error("Erro no polling:", error);
        await finishBatch();
      }
    }, 40000); // 40 segundos
  };

  // ── Efeitos ────────────────────────────────────────────────────────────────

  // Limpa o polling ao desmontar o componente
  useEffect(() => {
    return () => stopPolling();
  }, []);

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isLoading) {
        e.preventDefault();
        e.returnValue =
          "O disparo está em andamento. Se você sair agora, o processo pode ser interrompido.";
        return e.returnValue;
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isLoading]);

  useEffect(() => {
    const checkConnection = async () => {
      if (!franchiseeId) return;
      setIsCheckingConnection(true);
      try {
        const connectionState = await verifyInstanceEvo({
          franchisee_id: franchiseeId,
        });
        const isInstanceOpen = connectionState?.state?.open === true;
        setIsConnected(isInstanceOpen);
        if (!isInstanceOpen) {
          toast({
            title: "WhatsApp Desconectado",
            description: "Conecte sua instância no Chat.",
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error("Erro ao verificar conexão:", error);
        setIsConnected(false);
      } finally {
        setIsCheckingConnection(false);
      }
    };

    const fetchData = async () => {
      if (!franchiseeId) return;
      try {
        const [leadsData, historyData] = await Promise.all([
          leadsController.listLeadsByFranchiseeId(franchiseeId),
          shootingMessageController.getShootingMessagesHistoryByFranchiseeId(
            franchiseeId,
          ),
        ]);
        setLeads(leadsData);
        setShootingMessagesHistoric(historyData);
      } catch (error) {
        console.error("Erro ao carregar dados:", error);
        toast({
          title: "Erro ao carregar",
          description: "Não foi possível carregar os dados.",
          variant: "destructive",
        });
      }
    };

    checkConnection();
    fetchData();
  }, [franchiseeId, toast]);

  // ── Memos ──────────────────────────────────────────────────────────────────
  const filteredLeads = useMemo(() => {
    const search = searchFilter?.toLowerCase?.() ?? "";
    return leads.filter((lead) => {
      const name = lead?.name?.toLowerCase?.() ?? "";
      const email = lead?.email?.toLowerCase?.() ?? "";
      const phone = lead?.phone ?? "";
      return (
        name.includes(search) ||
        email.includes(search) ||
        phone.includes(searchFilter)
      );
    });
  }, [leads, searchFilter]);

  const filteredHistory = useMemo(() => {
    if (statusFilter === "ALL") return shootingMessagesHistoric;
    return shootingMessagesHistoric.filter(
      (item) => item.statusShootingMessage === statusFilter,
    );
  }, [shootingMessagesHistoric, statusFilter]);

  const validMessages = useMemo(
    () => messages.filter((m) => m.trim() !== ""),
    [messages],
  );

  const statsData = useMemo(() => {
    const sent = shootingMessagesHistoric.filter(
      (item) => item.statusShootingMessage === "SEND",
    ).length;
    const errors = shootingMessagesHistoric.filter(
      (item) => item.statusShootingMessage === "ERROR",
    ).length;
    return { sent, errors };
  }, [shootingMessagesHistoric]);

  const estimate = estimateTime(selectedLeads.size);

  // ── Handlers de leads ──────────────────────────────────────────────────────
  const toggleLeadSelection = (leadId: string) => {
    if (isLoading || !isConnected) return;
    setSelectedLeads((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(leadId)) newSet.delete(leadId);
      else newSet.add(leadId);
      return newSet;
    });
  };

  const selectAllLeads = () => {
    if (isLoading || !isConnected) return;
    if (selectedLeads.size === filteredLeads.length)
      setSelectedLeads(new Set());
    else setSelectedLeads(new Set(filteredLeads.map((lead) => lead.id)));
  };

  // ── Handlers de mensagens ──────────────────────────────────────────────────
  const addMessage = () => {
    if (messages.length >= 5) return;
    setMessages((prev) => [...prev, ""]);
  };

  const removeMessage = (index: number) => {
    if (messages.length <= 1) return;
    setMessages((prev) => prev.filter((_, i) => i !== index));
  };

  const updateMessage = (index: number, value: string) => {
    setMessages((prev) => prev.map((msg, i) => (i === index ? value : msg)));
  };

  // ── Validação e disparo ────────────────────────────────────────────────────
  const handleSendMessage = () => {
    if (!isConnected) {
      toast({
        title: "Ação bloqueada",
        description: "Você precisa estar conectado para enviar mensagens.",
        variant: "destructive",
      });
      return;
    }
    if (selectedLeads.size === 0) {
      toast({
        title: "Nenhum lead selecionado",
        description: "Selecione pelo menos um lead para enviar a mensagem.",
        variant: "destructive",
      });
      return;
    }
    if (validMessages.length === 0) {
      toast({
        title: "Mensagem vazia",
        description: "Digite pelo menos uma mensagem para enviar.",
        variant: "destructive",
      });
      return;
    }
    setIsConfirmOpen(true);
  };

  const executeSend = async () => {
    setIsConfirmOpen(false);
    setIsLoading(true);

    const data = {
      franchisee_id: franchiseeId,
      leads_ids: Array.from(selectedLeads),
      messages: validMessages,
    };

    try {
      const response = await shootingMessageController.sendShootingMessage({
        data,
      });
      const batchId = response?.batch_id;

      if (batchId) {
        setCurrentBatchId(batchId);
        startPolling(batchId); // 👈 inicia o polling
      }

      toast({
        title: "Disparo iniciado!",
        description: `Batch criado para ${selectedLeads.size} lead(s). Acompanhe o progresso.`,
      });

      setSelectedLeads(new Set());
      setMessages([""]);

      const historyData =
        await shootingMessageController.getShootingMessagesHistoryByFranchiseeId(
          franchiseeId,
        );
      setShootingMessagesHistoric(historyData);
    } catch (error) {
      console.error("Erro ao enviar mensagens:", error);
      toast({
        title: "Erro no envio",
        description: "Ocorreu um erro ao enviar as mensagens.",
        variant: "destructive",
      });
      setIsLoading(false); // só encerra em caso de erro no início
    }
    // ❌ sem finally — quem encerra o loading é o polling
  };

  const handleCancelBatch = async () => {
    if (!currentBatchId || isCancelling) return;
    setIsCancelling(true);
    try {
      await shootingMessageController.cancelledShooting({
        batchId: currentBatchId,
      });
      stopPolling(); // 👈 para o polling
      toast({
        title: "Disparo cancelado",
        description: "O batch foi cancelado com sucesso.",
      });
      setIsLoading(false);
      setCurrentBatchId(null);
      setBatchProgress(null);
      const historyData =
        await shootingMessageController.getShootingMessagesHistoryByFranchiseeId(
          franchiseeId,
        );
      setShootingMessagesHistoric(historyData);
    } catch (error) {
      toast({
        title: "Erro ao cancelar",
        description: "Não foi possível cancelar o disparo.",
        variant: "destructive",
      });
    } finally {
      setIsCancelling(false);
    }
  };

  const handleDeleteShootingMessageHistoric = async (id: string) => {
    try {
      await shootingMessageController.deleteShootingMessageHistoric({ id });
      setShootingMessagesHistoric((prev) =>
        prev.filter((item) => item.id !== id),
      );
      toast({
        title: "Registro removido",
        description: "O histórico foi atualizado com sucesso.",
      });
    } catch (error: any) {
      toast({
        title: "Erro ao deletar",
        description: error.message || "Não foi possível remover o registro.",
        variant: "destructive",
      });
    }
  };

  // ── Helpers de UI ──────────────────────────────────────────────────────────
  const formatDate = (dateString: string) => {
    if (!dateString) return "---";
    return new Date(dateString).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusBadge = (status: "SEND" | "ERROR") => {
    if (status === "SEND") {
      return (
        <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 px-3 py-1 rounded-full">
          <CheckCircle2 className="w-3 h-3" /> Enviado
        </div>
      );
    }
    return (
      <div className="flex items-center gap-1.5 text-xs font-bold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 px-3 py-1 rounded-full">
        <XCircle className="w-3 h-3" /> Erro
      </div>
    );
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <FranchiseeLayout scrollable={false}>
      <div className="flex flex-col h-full bg-[#F8FAFC] dark:bg-slate-950 relative transition-colors duration-300">
        {/* ── MODAL DE CONFIRMAÇÃO ─────────────────────────────────────────── */}
        {isConfirmOpen && (
          <div className="absolute inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 rounded-[2rem] shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-300">
              <div className="px-6 pt-6 pb-4 flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center">
                    <Timer className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div>
                    <h2 className="text-lg font-black text-slate-900 dark:text-white leading-tight">
                      Confirmar Disparo
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                      Leia com atenção antes de continuar
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsConfirmOpen(false)}
                  className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-slate-400"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="mx-6 mb-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                    Leads
                  </span>
                  <span className="text-sm font-black text-slate-900 dark:text-white">
                    {selectedLeads.size}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                    Variações de mensagem
                  </span>
                  <span className="text-sm font-black text-slate-900 dark:text-white">
                    {validMessages.length}
                  </span>
                </div>
                <div className="border-t border-slate-100 dark:border-slate-700 pt-3">
                  <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                    Estimativa de tempo
                  </p>
                  <div className="flex items-center justify-between">
                    <div className="text-center">
                      <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">
                        Mínimo
                      </p>
                      <span className="text-xl font-black text-slate-900 dark:text-white">
                        {estimate.min}
                      </span>
                    </div>
                    <div className="flex flex-col items-center gap-1">
                      <div className="w-16 h-0.5 bg-gradient-to-r from-green-400 to-amber-400 rounded-full" />
                      <span className="text-[10px] font-bold text-slate-400">
                        40–60s / lead
                      </span>
                    </div>
                    <div className="text-center">
                      <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">
                        Máximo
                      </p>
                      <span className="text-xl font-black text-slate-900 dark:text-white">
                        {estimate.max}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mx-6 mb-5 space-y-2.5">
                <div className="flex items-start gap-2.5 p-3 rounded-xl bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30">
                  <AlertCircle className="w-4 h-4 text-blue-500 dark:text-blue-400 shrink-0 mt-0.5" />
                  <p className="text-xs font-bold text-blue-700 dark:text-blue-400 leading-snug">
                    O disparo continuará no servidor mesmo se você sair da tela.
                    Você poderá cancelar enquanto estiver em andamento.
                  </p>
                </div>
                <div className="flex items-start gap-2.5 p-3 rounded-xl bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/30">
                  <Shuffle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                  <p className="text-xs font-bold text-amber-700 dark:text-amber-400 leading-snug">
                    Uma mensagem aleatória entre as {validMessages.length}{" "}
                    variações será enviada para cada lead.
                  </p>
                </div>
              </div>

              <div className="px-6 pb-6 flex gap-3">
                <button
                  onClick={() => setIsConfirmOpen(false)}
                  className="flex-1 py-3 rounded-2xl text-sm font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
                >
                  Cancelar
                </button>
                <button
                  onClick={executeSend}
                  className="flex-[2] py-3 rounded-2xl text-sm font-bold text-white bg-green-600 hover:bg-green-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-green-200 dark:shadow-green-900/20 active:scale-95"
                >
                  <Send className="w-4 h-4" /> Confirmar e Disparar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── OVERLAY DE DISPARO EM ANDAMENTO ─────────────────────────────── */}
        {isLoading &&
          createPortal(
            <div
              className="fixed inset-0 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4"
              style={{ zIndex: 99999 }}
              onMouseDown={(e) => e.stopPropagation()}
              onClick={(e) => e.stopPropagation()}
              onPointerDown={(e) => e.stopPropagation()}
            >
              <Card className="max-w-md w-full border-none shadow-2xl bg-white dark:bg-slate-900 rounded-[2.5rem] overflow-hidden animate-in fade-in zoom-in duration-300">
                <CardContent className="p-8 sm:p-10 text-center">
                  <div className="relative mb-6 inline-block">
                    <div className="absolute inset-0 animate-ping rounded-full bg-green-100 dark:bg-green-900/30 opacity-75"></div>
                    <div className="relative bg-green-600 p-5 rounded-full shadow-xl shadow-green-200 dark:shadow-none">
                      <Loader2 className="w-10 h-10 text-white animate-spin" />
                    </div>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mb-3">
                    Disparo em Andamento
                  </h2>
                  <p className="text-slate-600 dark:text-slate-300 font-medium mb-2 leading-relaxed text-sm sm:text-base">
                    Estamos processando seus envios.
                  </p>
                  {currentBatchId && (
                    <p className="text-xs text-slate-400 dark:text-slate-500 font-mono mb-6 bg-slate-50 dark:bg-slate-800 px-3 py-1.5 rounded-lg">
                      Batch: {currentBatchId.slice(0, 8)}...
                    </p>
                  )}

                  {/* ── BARRA DE PROGRESSO REAL ── */}
                  <div className="bg-slate-50 dark:bg-slate-800 rounded-2xl p-4 border border-slate-100 dark:border-slate-700 mb-6">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase">
                        Progresso
                      </span>
                      <span className="text-xs font-black text-green-600 dark:text-green-400">
                        {batchProgress
                          ? `${batchProgress.processed} / ${batchProgress.total}`
                          : "Aguardando..."}
                      </span>
                    </div>
                    <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-green-600 h-full rounded-full transition-all duration-700"
                        style={{
                          width:
                            batchProgress && batchProgress.total > 0
                              ? `${(batchProgress.processed / batchProgress.total) * 100}%`
                              : "5%",
                        }}
                      />
                    </div>
                    {batchProgress && (
                      <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 mt-2 text-right">
                        Próxima verificação em ~40s
                      </p>
                    )}
                  </div>

                  {currentBatchId && (
                    <button
                      onClick={handleCancelBatch}
                      disabled={isCancelling}
                      className="w-full py-3 rounded-2xl text-sm font-bold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30 hover:bg-red-100 dark:hover:bg-red-900/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isCancelling ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />{" "}
                          Cancelando...
                        </>
                      ) : (
                        <>
                          <StopCircle className="w-4 h-4" /> Cancelar Disparo
                        </>
                      )}
                    </button>
                  )}
                </CardContent>
              </Card>
            </div>,
            document.body,
          )}

        {/* ── OVERLAY DESCONECTADO ─────────────────────────────────────────── */}
        {!isCheckingConnection && !isConnected && (
          <div className="absolute inset-0 z-40 bg-white/80 dark:bg-slate-950/80 backdrop-blur-[2px] flex items-center justify-center p-4">
            <Card className="max-w-lg w-full border-2 border-dashed border-slate-200 dark:border-slate-800 shadow-none bg-white/90 dark:bg-slate-900/90 rounded-[2rem] sm:rounded-[3rem] overflow-hidden">
              <CardContent className="p-8 sm:p-12 text-center">
                <div className="w-16 h-16 sm:w-20 sm:h-20 bg-red-50 dark:bg-red-900/20 rounded-2xl sm:rounded-3xl flex items-center justify-center mx-auto mb-6">
                  <WifiOff className="w-8 h-8 sm:w-10 sm:h-10 text-red-500 dark:text-red-400" />
                </div>
                <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mb-4">
                  WhatsApp Desconectado
                </h2>
                <p className="text-slate-500 dark:text-slate-400 font-medium mb-8 leading-relaxed text-sm sm:text-base">
                  Para utilizar a Central de Mensagens e realizar disparos em
                  massa, sua instância do WhatsApp precisa estar ativa.
                </p>
                <Link to="/franchisee/chat">
                  <Button className="bg-green-600 hover:bg-green-700 text-white rounded-2xl h-12 sm:h-14 px-6 sm:px-8 text-sm sm:text-base font-bold shadow-xl shadow-green-100 dark:shadow-none transition-all active:scale-95 flex items-center gap-2 mx-auto">
                    Acessar Chat para Conectar{" "}
                    <ExternalLink className="w-4 h-4 sm:w-5 sm:h-5" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        )}

        {/* ── CONTEÚDO PRINCIPAL ───────────────────────────────────────────── */}
        <div className="flex flex-col px-4 sm:px-6 md:px-8 py-4 sm:py-6 max-w-[1600px] mx-auto w-full flex-1 min-h-0 overflow-y-auto lg:overflow-hidden">
          {/* Header */}
          <div className="mb-4 sm:mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
            <div>
              <div className="flex items-center gap-2 text-green-600 dark:text-green-400 font-bold text-xs uppercase tracking-[0.2em] mb-1">
                <Zap className="w-3 h-3 fill-current" /> Disparo em Massa
              </div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">
                Central de Disparo
              </h1>
            </div>

            <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
              <div className="flex items-center gap-0 bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden">
                <div className="px-3 sm:px-4 py-2.5">
                  <p className="text-[9px] sm:text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">
                    Enviado
                  </p>
                  <span className="text-sm font-black text-emerald-600 dark:text-emerald-400">
                    {statsData.sent}
                  </span>
                </div>
                <div className="px-3 sm:px-4 py-2.5 border-l border-slate-100 dark:border-slate-800">
                  <p className="text-[9px] sm:text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">
                    Erros
                  </p>
                  <span className="text-sm font-black text-red-600 dark:text-red-400">
                    {statsData.errors}
                  </span>
                </div>
              </div>

              <Dialog open={isHistoryOpen} onOpenChange={setIsHistoryOpen}>
                <DialogTrigger asChild>
                  <Button
                    disabled={isLoading || !isConnected}
                    className="bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white rounded-2xl font-bold shadow-lg shadow-slate-200 dark:shadow-none text-xs sm:text-sm h-9 sm:h-10 px-3 sm:px-4"
                  >
                    <History className="w-4 h-4 mr-1.5" /> Histórico
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-3xl rounded-[2rem] border-none shadow-2xl max-h-[85vh] overflow-hidden flex flex-col bg-white dark:bg-slate-900 mx-4">
                  <DialogHeader>
                    <DialogTitle className="text-xl sm:text-2xl font-black flex items-center gap-3 text-slate-900 dark:text-white">
                      <div className="p-2 rounded-xl bg-gradient-to-br from-green-500 to-green-600">
                        <History className="w-5 h-5 text-white" />
                      </div>
                      Histórico de Disparos
                    </DialogTitle>
                    <DialogDescription className="font-medium text-slate-500 dark:text-slate-400 text-sm">
                      Acompanhe todas as mensagens enviadas e seus status.
                    </DialogDescription>
                  </DialogHeader>

                  <div className="flex items-center gap-2 pt-4 flex-wrap">
                    {["ALL", "SEND", "ERROR"].map((status) => (
                      <button
                        key={status}
                        onClick={() =>
                          setStatusFilter(status as "ALL" | "SEND" | "ERROR")
                        }
                        className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl text-xs font-bold transition-all ${statusFilter === status ? "bg-slate-900 dark:bg-green-600 text-white shadow-md" : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"}`}
                      >
                        {status === "ALL"
                          ? "Todos"
                          : status === "SEND"
                            ? "Enviados"
                            : "Erros"}
                      </button>
                    ))}
                  </div>

                  <div className="mt-4 space-y-3 overflow-y-auto flex-1 pr-1 no-scrollbar scroll-smooth">
                    {filteredHistory.length > 0 ? (
                      filteredHistory.map((item) => (
                        <div
                          key={item.id}
                          className="p-4 sm:p-5 rounded-[1.5rem] border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 hover:bg-white dark:hover:bg-slate-800 hover:shadow-md transition-all"
                        >
                          <div className="flex items-start justify-between mb-3 gap-2">
                            <div className="flex-1 min-w-0">
                              <h4 className="font-bold text-slate-900 dark:text-white mb-1 truncate">
                                {item.lead.name}
                              </h4>
                              <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 text-xs text-slate-500 dark:text-slate-400">
                                <span className="flex items-center gap-1">
                                  <Phone className="w-3 h-3 flex-shrink-0" />
                                  {item.lead.phone}
                                </span>
                                <span className="flex items-center gap-1 truncate">
                                  <Mail className="w-3 h-3 flex-shrink-0" />
                                  {item.lead.email}
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
                              {getStatusBadge(item.statusShootingMessage)}
                              <button
                                onClick={() =>
                                  handleDeleteShootingMessageHistoric(item.id)
                                }
                                className="p-1.5 sm:p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors group"
                                title="Excluir do histórico"
                              >
                                <Trash className="w-4 h-4 text-slate-300 dark:text-slate-500 group-hover:text-red-500" />
                              </button>
                            </div>
                          </div>
                          <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 mb-3">
                            <p className="text-sm text-slate-600 dark:text-slate-300 font-medium">
                              {item.message}
                            </p>
                          </div>
                          {item.error_message && (
                            <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-100 dark:border-red-800 mb-3">
                              <div className="flex items-center gap-2 mb-1">
                                <AlertCircle className="w-4 h-4 text-red-500 dark:text-red-400" />
                                <span className="text-xs font-bold text-red-600 dark:text-red-400 uppercase">
                                  Erro
                                </span>
                              </div>
                              <p className="text-xs text-red-600 dark:text-red-300 font-medium">
                                {item.error_message}
                              </p>
                            </div>
                          )}
                          <div className="flex items-center gap-1 text-[10px] font-bold text-slate-400 dark:text-slate-500">
                            <Clock className="w-3 h-3" />{" "}
                            {formatDate(item.create_at)}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-12 bg-slate-50 dark:bg-slate-800/50 rounded-[2rem] border-2 border-dashed border-slate-200 dark:border-slate-700">
                        <History className="w-12 h-12 text-slate-300 dark:text-slate-500 mx-auto mb-4" />
                        <p className="text-slate-500 dark:text-slate-400 font-bold">
                          Nenhum histórico encontrado
                        </p>
                      </div>
                    )}
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {/* ── MOBILE: abas accordion ── */}
          <div className="flex flex-col gap-3 lg:hidden flex-1">
            {/* Painel LEADS */}
            <div className="bg-white dark:bg-slate-900 rounded-[1.5rem] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
              <button
                className="w-full flex items-center justify-between px-5 py-4"
                onClick={() =>
                  setMobilePanel(mobilePanel === "leads" ? "message" : "leads")
                }
              >
                <span className="flex items-center gap-2 font-black text-slate-900 dark:text-white text-sm">
                  <Users className="w-4 h-4" />
                  Leads Disponíveis
                  <span className="text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 px-2 py-0.5 rounded-full ml-1">
                    {filteredLeads.length}
                  </span>
                  {selectedLeads.size > 0 && (
                    <span className="text-xs font-bold bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-2 py-0.5 rounded-full">
                      {selectedLeads.size} sel.
                    </span>
                  )}
                </span>
                {mobilePanel === "leads" ? (
                  <ChevronUp className="w-4 h-4 text-slate-400" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-slate-400" />
                )}
              </button>
              {mobilePanel === "leads" && (
                <div className="px-4 pb-4 space-y-3 border-t border-slate-50 dark:border-slate-800 pt-3">
                  <div className="relative">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={searchFilter}
                      onChange={(e) => setSearchFilter(e.target.value)}
                      disabled={isLoading || !isConnected}
                      placeholder="Buscar lead..."
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl text-sm font-medium text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-green-500/10 transition-all disabled:opacity-50 placeholder:text-slate-400"
                    />
                  </div>
                  {filteredLeads.length > 0 && (
                    <Button
                      variant="outline"
                      onClick={selectAllLeads}
                      disabled={isLoading || !isConnected}
                      className="w-full rounded-xl font-bold text-xs h-9 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300"
                    >
                      {selectedLeads.size === filteredLeads.length
                        ? "Desselecionar Todos"
                        : "Selecionar Todos"}
                    </Button>
                  )}
                  <div className="space-y-2 max-h-[40vh] overflow-y-auto no-scrollbar">
                    {filteredLeads.length > 0 ? (
                      filteredLeads.map((lead) => {
                        const isSelected = selectedLeads.has(lead.id);
                        return (
                          <button
                            key={lead.id}
                            onClick={() => toggleLeadSelection(lead.id)}
                            disabled={isLoading || !isConnected}
                            className={`w-full text-left p-3.5 rounded-2xl transition-all border-2 ${isSelected ? "bg-green-50 dark:bg-green-900/10 border-green-500 dark:border-green-600" : "border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 bg-white dark:bg-slate-900"} disabled:opacity-50 disabled:cursor-not-allowed`}
                          >
                            <div className="flex items-center justify-between mb-1">
                              <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                                {lead.name}
                              </h3>
                              {isSelected && (
                                <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400 flex-shrink-0" />
                              )}
                            </div>
                            <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                              <Phone className="w-3 h-3" /> {lead.phone}
                            </p>
                          </button>
                        );
                      })
                    ) : (
                      <div className="text-center py-8 text-slate-400 text-sm">
                        Nenhum lead encontrado
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Painel MENSAGEM */}
            <div className="bg-white dark:bg-slate-900 rounded-[1.5rem] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
              <button
                className="w-full flex items-center justify-between px-5 py-4"
                onClick={() =>
                  setMobilePanel(
                    mobilePanel === "message" ? "leads" : "message",
                  )
                }
              >
                <span className="flex items-center gap-2 font-black text-slate-900 dark:text-white text-sm">
                  <MessageSquare className="w-4 h-4" /> Compor Mensagens
                </span>
                {mobilePanel === "message" ? (
                  <ChevronUp className="w-4 h-4 text-slate-400" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-slate-400" />
                )}
              </button>
              {mobilePanel === "message" && (
                <div className="px-4 pb-4 space-y-4 border-t border-slate-50 dark:border-slate-800 pt-3">
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                    {selectedLeads.size > 0
                      ? `${selectedLeads.size} lead(s) selecionado(s)`
                      : "Selecione leads na aba acima"}
                  </p>
                  <MessagesComposer
                    messages={messages}
                    disabled={isLoading || !isConnected}
                    onAdd={addMessage}
                    onRemove={removeMessage}
                    onUpdate={updateMessage}
                  />
                  <div className="flex items-center justify-between text-xs font-bold text-slate-400 dark:text-slate-500">
                    <span>{validMessages.length} variação(ões) válida(s)</span>
                    <span>{selectedLeads.size} destinatário(s)</span>
                  </div>
                  <Button
                    onClick={handleSendMessage}
                    disabled={
                      selectedLeads.size === 0 ||
                      validMessages.length === 0 ||
                      isLoading ||
                      !isConnected
                    }
                    className="w-full bg-slate-900 hover:bg-slate-800 dark:bg-green-600 dark:hover:bg-green-700 text-white rounded-2xl h-12 text-sm font-bold shadow-lg shadow-slate-200 dark:shadow-green-900/20 transition-all active:scale-95 disabled:opacity-40"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Enviando...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4 mr-2" />
                        Disparar para {selectedLeads.size} lead(s)
                      </>
                    )}
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* ── DESKTOP: grid lado a lado ── */}
          <div className="hidden lg:grid lg:grid-cols-12 gap-6 flex-1 min-h-0 overflow-hidden">
            {/* Sidebar Leads */}
            <div className="lg:col-span-5 xl:col-span-4 flex flex-col min-h-0">
              <Card className="border-0 shadow-xl shadow-slate-200/50 dark:shadow-black/20 bg-white dark:bg-slate-900 rounded-[2rem] overflow-hidden flex flex-col h-full">
                <CardHeader className="p-6 pb-4 space-y-4">
                  <CardTitle className="text-lg font-black text-slate-900 dark:text-white flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <Users className="w-5 h-5" /> Leads Disponíveis
                    </span>
                    <span className="text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 px-2.5 py-1 rounded-full">
                      {filteredLeads.length}
                    </span>
                  </CardTitle>
                  <div className="relative group">
                    <Search className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-4 top-1/2 -translate-y-1/2 group-focus-within:text-green-500 transition-colors" />
                    <input
                      type="text"
                      value={searchFilter}
                      onChange={(e) => setSearchFilter(e.target.value)}
                      disabled={isLoading || !isConnected}
                      placeholder="Buscar por nome, telefone ou email..."
                      className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl text-sm font-medium text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-green-500/10 transition-all disabled:opacity-50 placeholder:text-slate-400"
                    />
                  </div>
                  {filteredLeads.length > 0 && (
                    <Button
                      variant="outline"
                      onClick={selectAllLeads}
                      disabled={isLoading || !isConnected}
                      className="w-full rounded-xl font-bold dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-700"
                    >
                      {selectedLeads.size === filteredLeads.length
                        ? "Desselecionar Todos"
                        : "Selecionar Todos"}
                    </Button>
                  )}
                </CardHeader>
                <CardContent className="p-4 pt-0 space-y-2 overflow-y-auto flex-1 no-scrollbar">
                  {filteredLeads.length > 0 ? (
                    filteredLeads.map((lead) => {
                      const isSelected = selectedLeads.has(lead.id);
                      return (
                        <button
                          key={lead.id}
                          onClick={() => toggleLeadSelection(lead.id)}
                          disabled={isLoading || !isConnected}
                          className={`w-full text-left p-4 rounded-[1.5rem] transition-all border-2 ${isSelected ? "bg-green-50 dark:bg-green-900/10 border-green-500 dark:border-green-600 shadow-md shadow-green-100 dark:shadow-none" : "border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 bg-white dark:bg-slate-900"} disabled:opacity-50 disabled:cursor-not-allowed`}
                        >
                          <div className="flex items-start justify-between mb-2">
                            <h3 className="font-bold text-slate-900 dark:text-white">
                              {lead.name}
                            </h3>
                            {isSelected && (
                              <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />
                            )}
                          </div>
                          <div className="space-y-1">
                            <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                              <Phone className="w-3 h-3" /> {lead.phone}
                            </p>
                            <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                              <Mail className="w-3 h-3" /> {lead.email}
                            </p>
                          </div>
                        </button>
                      );
                    })
                  ) : (
                    <div className="text-center py-16 bg-slate-50 dark:bg-slate-800/50 rounded-[2rem] border-2 border-dashed border-slate-200 dark:border-slate-700">
                      <Users className="w-12 h-12 text-slate-300 dark:text-slate-500 mx-auto mb-4" />
                      <p className="text-slate-500 dark:text-slate-400 font-bold">
                        Nenhum lead encontrado
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Área de Composição */}
            <div className="lg:col-span-7 xl:col-span-8 flex flex-col min-h-0">
              <Card className="border-0 shadow-xl shadow-slate-200/50 dark:shadow-black/20 bg-white dark:bg-slate-900 rounded-[2.5rem] flex flex-col h-full overflow-hidden">
                <CardHeader className="px-8 py-6 border-b border-slate-50 dark:border-slate-800 flex-shrink-0">
                  <CardTitle className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-3">
                    <div className="w-12 h-12 rounded-[1.25rem] flex items-center justify-center bg-gradient-to-br from-green-500 to-green-600 shadow-lg shadow-green-100 dark:shadow-none">
                      <MessageSquare className="w-6 h-6 text-white" />
                    </div>
                    Compor Mensagens
                  </CardTitle>
                  <p className="text-sm text-slate-500 dark:text-slate-400 font-medium mt-1">
                    {selectedLeads.size > 0
                      ? `${selectedLeads.size} lead(s) selecionado(s)`
                      : "Selecione os leads para enviar a mensagem"}
                  </p>
                </CardHeader>

                <CardContent className="flex-1 flex flex-col p-8 min-h-0 overflow-y-auto">
                  <MessagesComposer
                    messages={messages}
                    disabled={isLoading || !isConnected}
                    onAdd={addMessage}
                    onRemove={removeMessage}
                    onUpdate={updateMessage}
                  />

                  <div className="flex items-center justify-between mt-4 text-xs font-bold text-slate-400 dark:text-slate-500">
                    <span>{validMessages.length} variação(ões) válida(s)</span>
                    <span>{selectedLeads.size} destinatário(s)</span>
                  </div>

                  <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 flex-shrink-0">
                    <div className="mb-4 flex items-center gap-3 p-4 bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30 rounded-2xl">
                      <Shuffle className="w-5 h-5 text-blue-500 dark:text-blue-400 shrink-0" />
                      <p className="text-xs text-blue-700 dark:text-blue-400 font-bold leading-tight">
                        Uma mensagem aleatória será selecionada por lead. O
                        disparo poderá ser cancelado enquanto estiver em
                        andamento.
                      </p>
                    </div>
                    <Button
                      onClick={handleSendMessage}
                      disabled={
                        selectedLeads.size === 0 ||
                        validMessages.length === 0 ||
                        isLoading ||
                        !isConnected
                      }
                      className="w-full bg-slate-900 hover:bg-slate-800 dark:bg-green-600 dark:hover:bg-green-700 text-white rounded-[2rem] h-14 text-base font-bold shadow-lg shadow-slate-200 dark:shadow-green-900/20 transition-all active:scale-95 disabled:opacity-40"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                          Enviando mensagens...
                        </>
                      ) : (
                        <>
                          <Send className="w-5 h-5 mr-2" />
                          Iniciar Disparo para {selectedLeads.size} lead(s)
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </FranchiseeLayout>
  );
}
