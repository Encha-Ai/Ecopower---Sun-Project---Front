import { useState, useRef, useEffect } from "react";
import { X, Bot, Send, Loader2, Trash2, Sparkles, User } from "lucide-react";
// Ajuste o import conforme seu projeto real
import { sendMessage } from "@/controllers/superAdmin/RagController";

interface ChatMessage {
  id: string;
  sender: "USER" | "BOT";
  text: string;
  timestamp: Date;
}

interface RagChatModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function RagChatModal({ isOpen, onClose }: RagChatModalProps) {
  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [chatInput, setChatInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "1",
      sender: "BOT",
      text: "👋 Olá! Sou seu assistente inteligente RAG. Posso responder perguntas sobre os documentos que você enviou. Como posso ajudar?",
      timestamp: new Date(),
    },
  ]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const handleSendMessage = async () => {
    if (!chatInput.trim() || isTyping) return;

    const userMsg: ChatMessage = {
      id: `user_${Date.now()}`,
      sender: "USER",
      text: chatInput,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setChatInput("");
    setIsTyping(true);

    try {
      const messageResponse = await sendMessage({ message: chatInput });

      const botMsg: ChatMessage = {
        id: `bot_${Date.now()}`,
        sender: "BOT",
        text: messageResponse,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, botMsg]);
    } catch (error) {
      console.error("Erro ao enviar mensagem:", error);
      const errorMsg: ChatMessage = {
        id: `error_${Date.now()}`,
        sender: "BOT",
        text: "❌ Desculpe, ocorreu um erro ao processar sua mensagem. Por favor, tente novamente.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleClearChat = () => {
    setMessages([
      {
        id: "welcome",
        sender: "BOT",
        text: "👋 Conversa reiniciada! Como posso ajudar com seus documentos?",
        timestamp: new Date(),
      },
    ]);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 w-full max-w-2xl h-[700px] rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-300 border border-slate-200 dark:border-slate-800">
        {/* Chat Header com gradiente Verde */}
        <div className="bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 dark:from-green-800 dark:via-emerald-800 dark:to-teal-800 p-5 flex items-center justify-between text-white relative overflow-hidden">
          {/* Efeito de brilho */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer"></div>

          <div className="flex items-center gap-4 relative z-10">
            <div className="relative">
              <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center ring-2 ring-white/30 shadow-lg">
                <Bot className="w-7 h-7 text-white drop-shadow-lg" />
              </div>
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-green-600 animate-pulse"></div>
            </div>
            <div>
              <h3 className="font-bold text-lg flex items-center gap-2">
                Assistente RAG
                <Sparkles className="w-4 h-4 text-yellow-300 animate-pulse" />
              </h3>
              <p className="text-sm text-green-100 flex items-center gap-2">
                <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse shadow-lg shadow-green-400/50"></span>
                Online e pronto para ajudar
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 relative z-10">
            <button
              onClick={handleClearChat}
              className="p-2.5 hover:bg-white/20 rounded-xl text-white transition-all duration-200 hover:scale-110 active:scale-95"
              title="Limpar conversa"
            >
              <Trash2 className="w-5 h-5" />
            </button>
            <button
              onClick={onClose}
              className="p-2.5 hover:bg-white/20 rounded-xl text-white transition-all duration-200 hover:scale-110 active:scale-95"
              title="Fechar chat"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Chat Body */}
        <div className="flex-1 bg-gradient-to-br from-slate-50 via-green-50/10 to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 p-6 overflow-y-auto space-y-4 relative">
          {/* Pattern de fundo */}
          <div
            className="absolute inset-0 opacity-30 dark:opacity-10"
            style={{
              backgroundImage:
                "radial-gradient(circle at 1px 1px, rgb(148 163 184 / 0.1) 1px, transparent 0)",
              backgroundSize: "24px 24px",
            }}
          ></div>

          <div className="relative z-10 space-y-4">
            {messages.map((msg, index) => (
              <div
                key={msg.id}
                className={`flex gap-3 ${
                  msg.sender === "USER" ? "justify-end" : "justify-start"
                } animate-in slide-in-from-bottom-3 duration-300`}
                style={{ animationDelay: `${index * 50}ms` }}
              >
                {msg.sender === "BOT" && (
                  <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg ring-2 ring-green-100 dark:ring-green-900">
                    <Bot className="w-5 h-5 text-white" />
                  </div>
                )}

                <div
                  className={`group relative max-w-[85%] rounded-2xl p-4 shadow-md transition-all duration-200 hover:shadow-lg ${
                    msg.sender === "USER"
                      ? "bg-gradient-to-br from-green-600 to-emerald-700 text-white rounded-br-md"
                      : "bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-bl-md"
                  }`}
                >
                  <p className="text-sm leading-relaxed whitespace-pre-wrap break-words font-medium">
                    {msg.text}
                  </p>
                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-white/10 dark:border-slate-700/50">
                    <p
                      className={`text-[10px] font-bold ${
                        msg.sender === "USER"
                          ? "text-green-100"
                          : "text-slate-400"
                      }`}
                    >
                      {msg.timestamp.toLocaleTimeString("pt-BR", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>

                  {/* Efeito de seta */}
                  <div
                    className={`absolute -bottom-1 w-3 h-3 rotate-45 ${
                      msg.sender === "USER"
                        ? "right-4 bg-gradient-to-br from-green-600 to-emerald-700"
                        : "left-4 bg-white dark:bg-slate-800 border-l border-b border-slate-200 dark:border-slate-700"
                    }`}
                  ></div>
                </div>

                {msg.sender === "USER" && (
                  <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-slate-600 to-slate-700 rounded-xl flex items-center justify-center shadow-lg ring-2 ring-slate-200 dark:ring-slate-700">
                    <User className="w-5 h-5 text-white" />
                  </div>
                )}
              </div>
            ))}

            {isTyping && (
              <div className="flex gap-3 animate-in slide-in-from-bottom-3 duration-300">
                <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg ring-2 ring-green-100 dark:ring-green-900">
                  <Bot className="w-5 h-5 text-white" />
                </div>
                <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl rounded-bl-md p-4 shadow-md">
                  <div className="flex gap-2 items-center">
                    <div className="flex gap-1">
                      <span className="w-2 h-2 bg-green-500 rounded-full animate-bounce"></span>
                      <span
                        className="w-2 h-2 bg-green-500 rounded-full animate-bounce"
                        style={{ animationDelay: "0.1s" }}
                      ></span>
                      <span
                        className="w-2 h-2 bg-green-500 rounded-full animate-bounce"
                        style={{ animationDelay: "0.2s" }}
                      ></span>
                    </div>
                    <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                      Digitando...
                    </span>
                  </div>
                </div>
              </div>
            )}

            <div ref={chatEndRef} />
          </div>
        </div>

        {/* Chat Input */}
        <div className="p-4 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 shadow-lg">
          <div className="flex gap-3 items-end">
            <div className="flex-1 relative">
              <input
                ref={inputRef}
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder="Digite sua pergunta sobre os documentos..."
                disabled={isTyping}
                className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-2xl px-5 py-3.5 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:border-slate-300 dark:hover:border-slate-600 pr-12 placeholder:text-slate-400"
              />
              {chatInput && (
                <button
                  onClick={() => setChatInput("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-colors"
                  title="Limpar"
                >
                  <X className="w-4 h-4 text-slate-400 dark:text-slate-500" />
                </button>
              )}
            </div>
            <button
              onClick={handleSendMessage}
              disabled={!chatInput.trim() || isTyping}
              className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white p-3.5 rounded-2xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 group"
              title="Enviar mensagem"
            >
              {isTyping ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              )}
            </button>
          </div>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-2 text-center">
            Pressione{" "}
            <kbd className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded text-[10px] font-mono font-bold">
              Enter
            </kbd>{" "}
            para enviar
          </p>
        </div>
      </div>
    </div>
  );
}