import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import {
  X,
  Send,
  Loader2,
  AlertCircle,
  Wifi,
  WifiOff,
  User,
} from "lucide-react";
import {
  sendMessageToLeadWithoutConversation,
  sendMessageForNumberLead,
} from "@/controllers/franchisee/Message";
import { verifyInstanceEvo } from "@/controllers/franchisee/Chat";
import { toast } from "sonner";
import { content } from "html2canvas/dist/types/css/property-descriptors/content";

interface MessageModalProps {
  isOpen: boolean;
  onClose: () => void;
  lead: {
    id: string;
    name: string;
    email?: string;
    phone: string;
  } | null;
  onSendMessage: (message: string) => Promise<void>;
  FranchiseeId: string;
}

const QUICK_REPLIES = [
  "Olá! Conseguiu ver a proposta?",
  "Bom dia! Vamos agendar uma conversa?",
  "Boa noite, tudo bem?",
  "O que achou do projeto?",
];

const MessageModal: React.FC<MessageModalProps> = ({
  isOpen,
  onClose,
  lead,
  onSendMessage,
  FranchiseeId,
}) => {
  if (!isOpen || !lead) return null;

  const [message, setMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isConnected, setIsConnected] = useState<boolean | null>(null);
  const [isCheckingConnection, setIsCheckingConnection] = useState(true);

  useEffect(() => {
    const fetchInstanceStatus = async () => {
      setIsCheckingConnection(true);
      try {
        const response = await verifyInstanceEvo({
          franchisee_id: FranchiseeId,
        });

        const isInstanceConnected =
          response?.state?.instance?.state === "open" &&
          response?.state?.open === true &&
          response?.state?.closed === false;

        setIsConnected(isInstanceConnected);

        if (!isInstanceConnected) {
          toast.error(
            "WhatsApp não está conectado. Conecte sua instância antes de enviar mensagens.",
          );
        }
      } catch (error) {
        console.error("Erro ao verificar instância:", error);
        setIsConnected(false);
        toast.error("Erro ao verificar conexão do WhatsApp");
      } finally {
        setIsCheckingConnection(false);
      }
    };

    fetchInstanceStatus();
  }, [FranchiseeId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    if (!isConnected) {
      toast.error("WhatsApp não está conectado. Verifique sua conexão.");
      return;
    }
    console.log(lead);

    setIsSending(true);
    try {
      if (lead.id) {
        await sendMessageToLeadWithoutConversation({
          data: { lead_id: lead.id, message },
        });
      } else {
        await sendMessageForNumberLead({
          data: {
            number: lead.phone,
            franchisee_id: FranchiseeId,
            content: message,
          },
        });
      }

      toast.success("Mensagem enviada com sucesso!");
      setMessage("");
      onClose();
    } catch (error) {
      toast.error(error?.message || "Erro ao enviar mensagem");
    } finally {
      setIsSending(false);
    }
  };

  const handleClose = () => {
    if (!isSending) {
      setMessage("");
      onClose();
    }
  };

  const initials = lead.name
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0])
    .join("")
    .toUpperCase();

  const connectionStatus = isCheckingConnection
    ? {
        label: "Verificando conexão...",
        color: "text-slate-400",
        dot: "bg-slate-300 animate-pulse",
      }
    : isConnected
      ? {
          label: "WhatsApp conectado",
          color: "text-emerald-600 dark:text-emerald-400",
          dot: "bg-emerald-500",
        }
      : {
          label: "WhatsApp desconectado",
          color: "text-red-500 dark:text-red-400",
          dot: "bg-red-500",
        };

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{
        background: "rgba(2, 6, 23, 0.55)",
        backdropFilter: "blur(6px)",
      }}
    >
      {/* Card */}
      <div
        className="relative w-full max-w-lg bg-white dark:bg-[#0f1117] rounded-3xl shadow-2xl overflow-hidden border border-slate-100 dark:border-slate-800"
        style={{
          animation: "modalIn 0.22s cubic-bezier(0.34,1.56,0.64,1) both",
        }}
      >
        <style>{`
          @keyframes modalIn {
            from { opacity: 0; transform: translateY(18px) scale(0.97); }
            to   { opacity: 1; transform: translateY(0)   scale(1);    }
          }
        `}</style>

        {/* Top accent bar */}
        <div className="h-1 w-full bg-gradient-to-r from-emerald-400 via-green-500 to-teal-400" />

        {/* Header */}
        <div className="px-7 pt-6 pb-5 flex items-start justify-between border-b border-slate-100 dark:border-slate-800/70">
          <div className="flex items-center gap-4">
            {/* Avatar */}
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-emerald-400 to-green-600 flex items-center justify-center text-white font-bold text-sm tracking-wide shadow-lg shadow-green-200 dark:shadow-green-900/30 select-none">
              {initials}
            </div>

            <div>
              <p className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-0.5">
                Mensagem rápida
              </p>
              <h2 className="text-base font-bold text-slate-900 dark:text-white leading-tight">
                {lead.name}
              </h2>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5 font-medium">
                {lead.phone}
                {lead.email && (
                  <span className="ml-2 text-slate-300 dark:text-slate-600">
                    ·
                  </span>
                )}
                {lead.email && (
                  <span className="ml-2 truncate max-w-[160px] inline-block align-bottom">
                    {lead.email}
                  </span>
                )}
              </p>
            </div>
          </div>

          <button
            onClick={handleClose}
            disabled={isSending}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all disabled:opacity-40"
          >
            <X className="w-4.5 h-4.5 w-[18px] h-[18px]" />
          </button>
        </div>

        {/* Connection status pill */}
        <div className="px-7 py-3 flex items-center gap-2 border-b border-slate-100 dark:border-slate-800/70 bg-slate-50/60 dark:bg-slate-900/40">
          <span
            className={`w-2 h-2 rounded-full flex-shrink-0 ${connectionStatus.dot}`}
          />
          <span
            className={`text-[11px] font-semibold ${connectionStatus.color}`}
          >
            {connectionStatus.label}
          </span>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="px-7 pt-5 pb-6 space-y-4">
          {/* Textarea */}
          <div className="relative">
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Escreva sua mensagem..."
              rows={5}
              maxLength={500}
              disabled={isSending || !isConnected || isCheckingConnection}
              className="w-full px-4 py-3.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 rounded-2xl text-sm text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-400 dark:focus:border-emerald-500 transition-all resize-none disabled:opacity-50 leading-relaxed"
              required
            />
            <span className="absolute bottom-3 right-4 text-[10px] text-slate-400 dark:text-slate-500 font-medium pointer-events-none select-none">
              {message.length}/500
            </span>
          </div>

          {/* Quick replies */}
          <div>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest mb-2">
              Sugestões
            </p>
            <div className="flex flex-wrap gap-2">
              {QUICK_REPLIES.map((s, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setMessage(s)}
                  disabled={isSending || !isConnected || isCheckingConnection}
                  className="px-3 py-1.5 text-[11px] font-medium rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:border-emerald-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={handleClose}
              disabled={isSending}
              className="flex-1 py-3 text-sm font-semibold text-slate-500 dark:text-slate-400 rounded-2xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={
                isSending ||
                !message.trim() ||
                !isConnected ||
                isCheckingConnection
              }
              className="flex-[2] py-3 text-sm font-bold rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-200/60 dark:shadow-emerald-900/30 disabled:opacity-40 disabled:grayscale disabled:cursor-not-allowed"
            >
              {isSending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Enviar mensagem
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body,
  );
};

export default MessageModal;
