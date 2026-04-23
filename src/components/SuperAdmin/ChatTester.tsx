import React, { useState, useRef, useEffect } from "react";
import {
  Send,
  Bot,
  User,
  Loader2,
  Trash2,
  MessageSquare,
  Zap,
  Globe,
  Copy,
  Check,
  Clock,
  Sparkles,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import * as promptAiController from "@/controllers/superAdmin/PromptAiController";

interface ChatMessage {
  id: string;
  type: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface ChatTesterProps {
  mode: "global" | "franchisee";
  globalPrompt: string;
  franchiseePrompt?: string;
  franchiseeName?: string;
  franchiseeId?: string;
  isLoading?: boolean;
}

const ChatTester: React.FC<ChatTesterProps> = ({
  mode,
  globalPrompt,
  franchiseePrompt,
  franchiseeName,
  franchiseeId,
  isLoading = false,
}) => {
  const { toast } = useToast();
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Scroll automático
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [chatMessages, isSendingMessage]);

  // Carregar mensagens ao montar o componente
  useEffect(() => {
    const loadMessages = async () => {
      try {
        let messages;
        if (mode === "global") {
          messages = await promptAiController.getMessagesGlobal();
        } else if (franchiseeId) {
          messages = await promptAiController.getMessagesFranchisee({
            id: franchiseeId,
          });
        }

        if (messages && Array.isArray(messages)) {
          const formattedMessages: ChatMessage[] = messages.map((msg: any) => ({
            id: msg.id || Date.now().toString(),
            type: msg.senderType === "User" ? "user" : "assistant",
            content: msg.message,
            timestamp: new Date(msg.create_at || Date.now()),
          }));
          setChatMessages(formattedMessages);
        }
      } catch (error) {
        console.error("Erro ao carregar mensagens:", error);
      }
    };

    loadMessages();
  }, [mode, franchiseeId]);

  // Função unificada de envio de mensagem
  const handleSendMessage = async () => {
    if (!chatInput.trim() || isSendingMessage) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: "user",
      content: chatInput,
      timestamp: new Date(),
    };

    setChatMessages((prev) => [...prev, userMessage]);
    const currentInput = chatInput;
    setChatInput("");
    setIsSendingMessage(true);

    try {
      let response;

      if (mode === "global") {
        response = await promptAiController.sendMessageGlobal({
          message: currentInput,
        });
      } else if (franchiseeId) {
        response = await promptAiController.sendMessageFranchisee({
          message: currentInput,
          id: franchiseeId,
        });
      }

      if (response && response.message) {
        const assistantMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          type: "assistant",
          content: response.message,
          timestamp: new Date(),
        };
        setChatMessages((prev) => [...prev, assistantMessage]);
      }
    } catch (error: any) {
      toast({
        title: "Erro ao enviar mensagem",
        description: error.message || "Não foi possível processar a mensagem.",
        variant: "destructive",
      });

      setChatMessages((prev) =>
        prev.filter((msg) => msg.id !== userMessage.id),
      );
      setChatInput(currentInput);
    } finally {
      setIsSendingMessage(false);
    }
  };

  // Limpar conversa
  const handleClearChat = async () => {
    try {
      if (mode === "global") {
        await promptAiController.deleteMessageGlobal();
      } else if (franchiseeId) {
        await promptAiController.deleteMessageFranchisee({ id: franchiseeId });
      }
      setChatMessages([]);
      toast({
        description: "✨ Conversa limpa com sucesso",
      });
    } catch (error: any) {
      toast({
        title: "Erro ao limpar conversa",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
    toast({
      description: "📋 Copiado para a área de transferência",
    });
  };

  return (
    <div className="flex flex-col h-[600px] bg-white/80 dark:bg-slate-900/50 backdrop-blur-xl rounded-[2rem] border border-slate-200/50 dark:border-slate-800/50 shadow-xl overflow-hidden transition-all duration-300">
      {/* Header Melhorado */}
      <div className="px-8 py-5 border-b border-slate-100 dark:border-slate-800 bg-gradient-to-r from-green-50/50 to-transparent dark:from-green-950/20 dark:to-transparent backdrop-blur-md flex items-center justify-between z-10">
        <div className="flex items-center gap-4">
          <div
            className={cn(
              "w-12 h-12 rounded-2xl flex items-center justify-center transition-all shadow-lg",
              mode === "global"
                ? "bg-gradient-to-br from-green-500 to-green-600 shadow-green-500/25"
                : "bg-gradient-to-br from-green-500 to-green-600 shadow-green-500/25",
            )}
          >
            {mode === "global" ? (
              <Globe className="w-6 h-6 text-white" />
            ) : (
              <Zap className="w-6 h-6 text-white" />
            )}
          </div>
          <div>
            <h3 className="text-base font-black text-slate-900 dark:text-white leading-none flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-green-500" />
              Anna
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 font-bold">
              {" "}
              <span className="text-green-600 dark:text-green-400">
                {mode === "global" ? "Global" : franchiseeName || "Franqueado"}
              </span>
            </p>
          </div>
        </div>
        <button
          onClick={handleClearChat}
          className="group p-2.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-all border border-transparent hover:border-red-200 dark:hover:border-red-500/20"
          title="Limpar conversa"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {/* Área de Mensagens Melhorada */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-8 space-y-6 scrollbar-thin scrollbar-thumb-green-200 dark:scrollbar-thumb-green-800 scrollbar-track-transparent"
      >
        {chatMessages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center animate-in fade-in duration-700">
            <div className="relative mb-6">
              <div className="absolute inset-0 bg-green-500 blur-3xl opacity-20 animate-pulse" />
              <div className="relative w-24 h-24 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/30 dark:to-green-800/20 rounded-3xl flex items-center justify-center shadow-xl shadow-green-500/10">
                <Bot className="w-12 h-12 text-green-600 dark:text-green-400" />
              </div>
            </div>
            <h4 className="text-xl font-black text-slate-900 dark:text-white mb-2">
              Pronto para testar?
            </h4>
            <p className="text-sm text-slate-500 dark:text-slate-400 max-w-[280px] font-medium leading-relaxed">
              Envie uma mensagem para ver como a IA se comporta com as novas
              configurações de prompt.
            </p>
          </div>
        ) : (
          chatMessages.map((msg) => (
            <div
              key={msg.id}
              className={cn(
                "flex flex-col animate-in slide-in-from-bottom-2 duration-300",
                msg.type === "user" ? "items-end" : "items-start",
              )}
            >
              <div className="flex items-center gap-2 mb-2 px-1">
                <span className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-tight">
                  {msg.type === "user" ? "Você" : "IA Assistant"}
                </span>
                <span className="text-xs text-slate-300 dark:text-slate-600 font-medium">
                  {msg.timestamp.toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
              <div
                className={cn(
                  "group relative max-w-[85%] p-5 rounded-3xl text-sm leading-relaxed shadow-lg transition-all",
                  msg.type === "user"
                    ? "bg-gradient-to-br from-green-500 to-green-600 text-white rounded-tr-md shadow-green-500/25"
                    : "bg-white dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-tl-md shadow-slate-900/5",
                )}
              >
                {msg.content}

                <button
                  onClick={() => copyToClipboard(msg.content, msg.id)}
                  className={cn(
                    "absolute top-2 opacity-0 group-hover:opacity-100 transition-all p-2 rounded-lg",
                    msg.type === "user"
                      ? "right-full mr-2 bg-white/20 hover:bg-white/30 text-white backdrop-blur-sm"
                      : "left-full ml-2 text-slate-400 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600",
                  )}
                >
                  {copiedId === msg.id ? (
                    <Check className="w-3.5 h-3.5" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            </div>
          ))
        )}

        {isSendingMessage && (
          <div className="flex flex-col items-start animate-in fade-in duration-300">
            <div className="flex items-center gap-2 mb-2 px-1">
              <span className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-tight">
                IA Assistant
              </span>
              <Loader2 className="w-3.5 h-3.5 animate-spin text-green-500" />
            </div>
            <div className="bg-white dark:bg-slate-800 p-5 rounded-3xl rounded-tl-md border-2 border-slate-100 dark:border-slate-700 flex gap-2 shadow-lg shadow-slate-900/5">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-bounce [animation-duration:0.8s]"></span>
              <span className="w-2 h-2 bg-green-500 rounded-full animate-bounce [animation-duration:0.8s] [animation-delay:0.2s]"></span>
              <span className="w-2 h-2 bg-green-500 rounded-full animate-bounce [animation-duration:0.8s] [animation-delay:0.4s]"></span>
            </div>
          </div>
        )}
      </div>

      {/* Input Melhorado */}
      <div className="p-6 bg-gradient-to-t from-white/80 to-transparent dark:from-slate-900/80 dark:to-transparent backdrop-blur-md border-t border-slate-100 dark:border-slate-800">
        <div className="relative flex items-end gap-3 bg-white dark:bg-slate-950 border-2 border-slate-200 dark:border-slate-800 rounded-[1.5rem] p-2 focus-within:ring-4 focus-within:ring-green-500/20 focus-within:border-green-500 transition-all duration-200 shadow-lg shadow-slate-900/5">
          <textarea
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            placeholder="Digite sua mensagem para testar a IA..."
            className="flex-1 bg-transparent border-none focus:ring-0 text-sm py-3 px-4 resize-none max-h-32 min-h-[48px] text-slate-700 dark:text-slate-200 placeholder:text-slate-400 font-medium"
            rows={1}
            disabled={isLoading || isSendingMessage}
          />
          <button
            onClick={handleSendMessage}
            disabled={!chatInput.trim() || isSendingMessage || isLoading}
            className={cn(
              "p-3.5 rounded-xl transition-all duration-200 flex items-center justify-center shadow-lg",
              chatInput.trim() && !isSendingMessage
                ? "bg-gradient-to-r from-green-500 to-green-600 text-white shadow-green-500/25 hover:shadow-xl hover:shadow-green-500/40 scale-100 hover:scale-105"
                : "bg-slate-200 dark:bg-slate-800 text-slate-400 scale-95 opacity-50 shadow-none",
            )}
          >
            {isSendingMessage ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>
        </div>
        <p className="text-xs text-center text-slate-400 dark:text-slate-500 mt-4 font-bold">
          Pressione{" "}
          <kbd className="px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 font-mono text-green-600 dark:text-green-400">
            Enter
          </kbd>{" "}
          para enviar ou{" "}
          <kbd className="px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 font-mono text-green-600 dark:text-green-400">
            Shift + Enter
          </kbd>{" "}
          para quebrar linha
        </p>
      </div>
    </div>
  );
};

export default ChatTester;
