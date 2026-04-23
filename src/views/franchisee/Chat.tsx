import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import SockJS from "sockjs-client";
import FranchiseeLayout from "@/components/Franchisee/FranchiseeLayout";
import { useAuth } from "@/contexts/AuthContext";
import { listLeadsByFranchiseeId } from "@/controllers/franchisee/LeadController";
import * as chatController from "@/controllers/franchisee/Chat";
import * as messageController from "@/controllers/franchisee/Message";
import ChatSettingsModal, {
  ChatSettings,
} from "@/components/Franchisee/Chat/ChatSettingsModal";
import { apiClient } from "@/lib/apiClient";

import DisconnectModal from "@/components/Franchisee/Chat/DisconnectModal";
import { formatLastMessage } from "@/components/Franchisee/Chat/utils/mediaHelpers";

import {
  ConversationList,
  ChatHeader,
  MessageBubble,
  MessageInput,
  EmptyState,
  ConnectionProviderSelect,
  QRCodeConnection,
  ConnectionStatusBadge,
  MediaModal,
  Conversation,
  Message,
  ConnectionProvider,
  ConnectionStatus,
  ConnectionState,
  WebSocketMessagePayload,
  AttachmentType,
} from "@/components/Franchisee/Chat";
import { toast } from "sonner";

import { useNavigate } from "react-router-dom";

interface ExtendedMessage extends Message {
  fileName?: string | null;
  fileMime?: string | null;
}

import { Client } from "@stomp/stompjs";
import {
  Loader2,
  Settings,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";

const waitSetterConversations = 800;
const url = apiClient.getBaseUrl();

let stompClient: Client | null = null;
const AI_TYPING_PREFIX = "__AI_TYPING_MSG__";

const Chat = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [connectionStatus, setConnectionStatus] =
    useState<ConnectionStatus>("loading");
  const [provider, setProvider] = useState<ConnectionProvider>("evolution");
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [isProviderLoading, setIsProviderLoading] = useState(false);

  const [selectedChat, setSelectedChat] = useState<Conversation | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [leadsFiltered, setLeadsFiltered] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [messages, setMessages] = useState<Record<string, Message[]>>({});

  // ── Busca de mensagens ──
  const [messageSearchQuery, setMessageSearchQuery] = useState("");

  // ── Painel lateral colapsável ──
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [chatSettings, setChatSettings] = useState<ChatSettings>();

  const [isDisconnectOpen, setIsDisconnectOpen] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);

  const [mediaModal, setMediaModal] = useState<{
    isOpen: boolean;
    type: "image" | "video" | "sticker" | null;
    src: string | null;
  }>({ isOpen: false, type: null, src: null });

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const prevMessageCountRef = useRef<Record<string, number>>({});
  const franchiseeId = user?.franchisee?.id;

  /* ── isAiTyping — derivado do selectedChat via conversations ── */
  const isAiTyping = useMemo(() => {
    if (!selectedChat) return false;
    return (
      conversations.find((c) => c.id === selectedChat.id)?.ai_typing ?? false
    );
  }, [conversations, selectedChat]);

  /* ── aiTypingConversations — derivado direto de conversations ── */
  const aiTypingConversations = useMemo(
    () => new Set(conversations.filter((c) => c.ai_typing).map((c) => c.id)),
    [conversations],
  );

  /* ── Mensagens filtradas pela busca ── */
  const filteredMessages = useMemo(() => {
    if (!selectedChat) return [];
    const msgs = messages[selectedChat.id] || [];
    if (!messageSearchQuery.trim()) return msgs;
    const q = messageSearchQuery.toLowerCase();
    return msgs.filter((m) => {
      if (String(m.id).startsWith(AI_TYPING_PREFIX)) return true;
      return (m.content || m.text || "").toLowerCase().includes(q);
    });
  }, [messages, selectedChat, messageSearchQuery]);

  /* ── Resetar busca ao trocar de conversa ── */
  useEffect(() => {
    setMessageSearchQuery("");
  }, [selectedChat?.id]);

  /* ── Sincronizar selectedChat ── */
  useEffect(() => {
    if (selectedChat) {
      const updated = conversations.find((c) => c.id === selectedChat.id);
      if (updated) setSelectedChat(updated);
    }
  }, [conversations]);

  /* ── Fechar chat com ESC ── */
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && selectedChat) {
        setSelectedChat(null);
        setIsSidebarCollapsed(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedChat]);

  /* ── Media modal ── */
  const handleMediaClick = (type: "image" | "video" | "sticker", src: string) =>
    setMediaModal({ isOpen: true, type, src });
  const handleCloseMediaModal = () =>
    setMediaModal({ isOpen: false, type: null, src: null });

  const handleLeadUpdate = useCallback(
    (conversationId: string, updatedData: { name: string; phone: string }) => {
      setConversations((prev) =>
        prev.map((c) =>
          c.id === conversationId
            ? { ...c, name: updatedData.name, phone: updatedData.phone }
            : c,
        ),
      );

      setSelectedChat((prev) =>
        prev?.id === conversationId
          ? { ...prev, name: updatedData.name, phone: updatedData.phone }
          : prev,
      );
    },
    [],
  );

  /* ── Conexão inicial ── */
  useEffect(() => {
    const checkInitialConnection = async () => {
      setConnectionStatus("loading");
      if (!franchiseeId) return;

      const evoResult = await chatController.verifyInstanceEvo({
        franchisee_id: franchiseeId,
      });
      if (evoResult?.state?.open) {
        setProvider("evolution");
        setConnectionStatus("connected");
        return;
      }
      if (evoResult?.state?.connecting || evoResult?.qrCode) {
        setProvider("evolution");
        setQrCode(evoResult.qrCode?.base64 || null);
        setConnectionStatus("connecting");
        return;
      }

      const officialResult = await chatController.verifyInstanceOfficial({
        franchisee_id: franchiseeId,
      });
      if (officialResult?.state?.open) {
        setProvider("official");
        setConnectionStatus("connected");
        return;
      }
      if (officialResult?.state?.connecting || officialResult?.qrCode) {
        setProvider("official");
        setQrCode(officialResult.qrCode?.base64 || null);
        setConnectionStatus("connecting");
        return;
      }

      setConnectionStatus("selecting");
    };

    const fetchConfigurationIAGeneral = async () => {
      const config = await chatController.getConfigurationIaGeneral({
        franchisee_id: franchiseeId,
      });
      setChatSettings({
        id: config.id,
        aiEnabled: config.iaInitActive,
        responseDelay: config.delayResponse,
        welcomeMessage: config.welcomeMessage,
      });
    };

    checkInitialConnection();
    fetchConfigurationIAGeneral();
  }, [franchiseeId]);

  /* ── Selecionar provedor ── */
  const handleProviderSelect = async (selectedProvider: ConnectionProvider) => {
    setIsProviderLoading(true);
    setProvider(selectedProvider);
    try {
      const result = await chatController.createInstance({
        franchisee_id: franchiseeId,
        provider: selectedProvider,
      });
      if (result?.state?.open) {
        setConnectionStatus("connected");
      } else if (result?.qrCode?.base64) {
        setQrCode(result.qrCode.base64);
        setConnectionStatus("connecting");
      } else {
        const v = await chatController.getConnectionStatus({
          franchisee_id: franchiseeId,
          provider: selectedProvider,
        });
        if (v?.state?.open) setConnectionStatus("connected");
        else if (v?.qrCode?.base64) {
          setQrCode(v.qrCode.base64);
          setConnectionStatus("connecting");
        } else setConnectionStatus("selecting");
      }
    } catch {
      setConnectionStatus("selecting");
    } finally {
      setIsProviderLoading(false);
    }
  };

  const checkConnection =
    useCallback(async (): Promise<ConnectionState | null> => {
      if (!provider) return null;
      return chatController.getConnectionStatus({
        franchisee_id: franchiseeId,
        provider,
      });
    }, [franchiseeId, provider]);

  const handleRetryConnection = async () => {
    if (!provider) return;
    const result = await chatController.createInstance({
      franchisee_id: franchiseeId,
      provider,
    });
    if (result?.qrCode?.base64) setQrCode(result.qrCode.base64);
  };

  const handleConnected = () => setConnectionStatus("connected");

  const handleDeleteConversation = async (conversationId: string) => {
    await chatController.deleteConversationById({ id: conversationId });
    setConversations((prev) => prev.filter((c) => c.id !== conversationId));
    setMessages((prev) => {
      const updated = { ...prev };
      delete updated[conversationId];
      return updated;
    });
    setSelectedChat(null);
  };

  /* ── Configurações ── */
  const handleSaveSettings = async (settings: ChatSettings) => {
    try {
      console.log("ID: ", chatSettings?.id);

      await chatController.updateConfigurationIaGeneral({
        id: chatSettings?.id || "",
        configuration: settings,
      });
      setChatSettings(settings);
      toast.success("Configurações salvas com sucesso");
    } catch {
      toast.error("Erro ao salvar configurações");
    }
  };

  /* ── Desconexão ── */
  const handleDisconnect = async () => {
    if (!provider || !franchiseeId) return;
    setIsDisconnecting(true);
    try {
      await chatController.disconnectInstance({ id: franchiseeId });
      stompClient?.deactivate();
      stompClient = null;
      toast.success("WhatsApp desconectado com sucesso!");
      setTimeout(() => navigate(0), 1000);
    } catch {
      toast.error("Erro ao desconectar. Tente novamente.");
      setIsDisconnecting(false);
      setIsDisconnectOpen(false);
    }
  };

  /* ── Buscar conversas ── */
  useEffect(() => {
    if (connectionStatus !== "connected" || !user?.franchisee) return;
    const loadData = async () => {
      try {
        setIsLoading(true);
        const data = await chatController.getAllConversations(user.franchisee);
        const mapped: Conversation[] = data.map((conv: any) => ({
          id: conv.id,
          name: conv.name,
          phone: conv.phone,
          profile_picture: conv.profile_picture ?? null,
          ai_enabled: conv.ai_enabled,
          ai_typing: conv.ai_typing ?? false,
          lastMessage: conv.lastMessage,
          senderType: conv.senderType,
          lastMessageAt: conv.lastMessageAt,
          lastMessageType: conv.lastMessageType || null,
          formattedLastMessage: conv.formattedLastMessage || conv.lastMessage,
        }));
        const sorted = mapped.sort(
          (a, b) =>
            new Date(b.lastMessageAt).getTime() -
            new Date(a.lastMessageAt).getTime(),
        );
        setConversations(sorted);
        const phones = new Set(sorted.map((c) => c.phone));
        const leads = await listLeadsByFranchiseeId(user.franchisee.id);
        setLeadsFiltered(leads.filter((l: any) => !phones.has(l.phone)));
      } catch (err) {
        console.error(err);
      } finally {
        setTimeout(() => setIsLoading(false), waitSetterConversations);
      }
    };
    loadData();
  }, [user, connectionStatus]);

  /* ── Buscar mensagens ── */
  useEffect(() => {
    if (!selectedChat) return;
    const fetchMessages = async () => {
      setIsLoadingMessages(true);
      // Reseta o contador da conversa para garantir que o scroll
      // funcione corretamente após carregar as mensagens
      prevMessageCountRef.current[selectedChat.id] = 0;
      try {
        const data = await messageController.listMessagesByConversationId(
          selectedChat.id,
        );

        setMessages((prev) => ({
          ...prev,
          [selectedChat.id]: data.map((msg: any) => ({
            id: msg.id,
            content: msg.content,
            text: msg.content,
            senderType: msg.senderType,
            sent: msg.senderType === "User",
            time: new Date(msg.createdAt || Date.now()).toLocaleTimeString(
              "pt-BR",
              { hour: "2-digit", minute: "2-digit" },
            ),
            read: true,
            hasAttachment: msg.hasAttachment || false,
            attachmentType: msg.attachmentType || null,
            attachmentData: msg.attachmentData || null,
          })),
        }));
      } finally {
        setIsLoadingMessages(false);
      }
    };
    fetchMessages();
  }, [selectedChat?.id]);

  /* ── WebSocket ── */
  useEffect(() => {
    if (connectionStatus !== "connected") return;

    stompClient = new Client({
      webSocketFactory: () => new SockJS(url + "/ws"),
      reconnectDelay: 5000,
      debug: (str) => console.log(str),
      connectHeaders: { franchisee: franchiseeId },
      onConnect: () => {
        console.log("🟢 WebSocket conectado");
        stompClient?.subscribe(`/queue/whatsapp.${franchiseeId}`, (frame) => {
          const payload: WebSocketMessagePayload = JSON.parse(frame.body);
          const {
            messageId,
            conversationId,
            ai_enabled,
            content,
            hasAttachment,
            attachmentType,
            attachmentData,
            senderType,
            leadDTO,
            updatedAt,
          } = payload;
          const typingId = `${AI_TYPING_PREFIX}${conversationId}`;
          const isTyping = content === "__AI_TYPING__";

          if (isTyping) {
            setConversations((prev) =>
              prev.map((c) =>
                c.id === conversationId ? { ...c, ai_typing: true } : c,
              ),
            );
            return;
          }

          // Mensagem real recebida — remove bolha de digitação e limpa ai_typing
          const newMessage: Message = {
            id: messageId,
            content,
            text: content,
            senderType,
            sent: senderType === "User",
            time: new Date(updatedAt).toLocaleTimeString("pt-BR", {
              hour: "2-digit",
              minute: "2-digit",
            }),
            read: true,
            hasAttachment: hasAttachment || false,
            attachmentType: attachmentType || null,
            attachmentData: attachmentData || null,
          };

          setMessages((prev) => {
            const current = (prev[conversationId] || []).filter(
              (m) => m.id !== typingId,
            );
            return { ...prev, [conversationId]: [...current, newMessage] };
          });

          setConversations((prev) => {
            const exists = prev.find((c) => c.id === conversationId);

            const updatedConv = exists
              ? {
                  ...exists,
                  ai_enabled,
                  ai_typing: false,
                  lastMessage: content,
                  senderType,
                  lastMessageAt: updatedAt,
                  lastMessageType: attachmentType || null,
                  formattedLastMessage: formatLastMessage(
                    attachmentType || null,
                    content,
                    senderType,
                  ),
                }
              : {
                  id: conversationId,
                  name: leadDTO?.name || "Novo contato",
                  phone: leadDTO?.phone || "",
                  profile_picture: leadDTO?.profile_picture ?? null,
                  ai_enabled,
                  ai_typing: false,
                  lastMessage: content,
                  senderType,
                  lastMessageAt: updatedAt,
                  lastMessageType: attachmentType || null,
                  formattedLastMessage: formatLastMessage(
                    attachmentType || null,
                    content,
                    senderType,
                  ),
                };

            const others = prev.filter((c) => c.id !== conversationId);
            return [updatedConv, ...others];
          });
        });
      },
      onStompError: (frame) => console.error("❌ STOMP error", frame),
    });

    stompClient.activate();
    return () => {
      stompClient?.deactivate();
    };
  }, [connectionStatus, franchiseeId]);

  /* ── Auto scroll ao trocar de conversa ── */
  useEffect(() => {
    if (!selectedChat) return;
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "instant" });
    }, 50);
  }, [selectedChat?.id]);

  /* ── Auto scroll ao receber/enviar novas mensagens ── */
  useEffect(() => {
    if (!selectedChat || messageSearchQuery) return;

    const currentCount = messages[selectedChat.id]?.length ?? 0;
    const prevCount = prevMessageCountRef.current[selectedChat.id] ?? 0;

    if (currentCount > prevCount) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }

    prevMessageCountRef.current[selectedChat.id] = currentCount;
  }, [messages, selectedChat, messageSearchQuery]);

  const handleToggleAi = useCallback(async (conversationId: string) => {
    // Lê o estado atual dentro do setter para evitar stale closure
    let isTyping = false;
    setConversations((prev) => {
      const conv = prev.find((c) => c.id === conversationId);
      isTyping = conv?.ai_typing ?? false;
      return prev; // não altera nada ainda
    });

    if (isTyping) return;

    await chatController.updateStatusIaConversation({ id: conversationId });

    setConversations((prev) =>
      prev.map((c) =>
        c.id === conversationId ? { ...c, ai_enabled: !c.ai_enabled } : c,
      ),
    );
  }, []);

  /* ── Enviar mensagem ── */
  const handleSendMessage = async (text: string, files?: File[]) => {
    if (!selectedChat) return;
    const now = new Date();
    const nowISO = now.toISOString();
    const tempId = `temp-${Date.now()}`;
    const hasFiles = files && files.length > 0;
    let attachmentType: AttachmentType = null;
    let displayText = text;
    let base64File: string | null = null;
    let fileName: string | null = null;
    let fileMime: string | null = null;

    try {
      if (hasFiles) {
        const file = files[0];
        fileName = file.name;
        fileMime = file.type;
        base64File = await new Promise<string>((res, rej) => {
          const r = new FileReader();
          r.readAsDataURL(file);
          r.onload = () => res(r.result as string);
          r.onerror = rej;
        });
        if (file.type.startsWith("image/")) {
          attachmentType = "imageMessage";
          displayText = "📷 Foto";
        } else if (file.type.startsWith("video/")) {
          attachmentType = "videoMessage";
          displayText = "🎥 Vídeo";
        } else if (file.type === "application/pdf") {
          attachmentType = "documentMessage";
          displayText = `📄 ${file.name}`;
        } else if (file.type.startsWith("audio/")) {
          attachmentType = "audioMessage";
          displayText = "🎤 Áudio";
        }
      }

      const optimistic: ExtendedMessage = {
        id: tempId,
        content: displayText,
        text: displayText,
        senderType: "User",
        sent: true,
        time: now.toLocaleTimeString("pt-BR", {
          hour: "2-digit",
          minute: "2-digit",
        }),
        read: false,
        hasAttachment: hasFiles || false,
        attachmentType,
        attachmentData: base64File,
        fileName,
        fileMime,
      };

      setMessages((prev) => ({
        ...prev,
        [selectedChat.id]: [...(prev[selectedChat.id] || []), optimistic],
      }));

      // ── Atualiza última mensagem E já garante ai_enabled: false na UI ──
      setConversations((prev) => {
        const existing = prev.find((c) => c.id === selectedChat.id);
        const updated = {
          ...(existing ?? selectedChat),
          ai_enabled: false,
          lastMessage: displayText,
          senderType: "User" as const,
          lastMessageAt: nowISO,
          lastMessageType: attachmentType,
          formattedLastMessage: `Você: ${displayText}`,
        };
        const others = prev.filter((c) => c.id !== selectedChat.id);
        return [updated, ...others];
      });

      await messageController.sendMessageCreatedByFranchisee({
        data: {
          conversation_id: selectedChat.id,
          franchisee_id: user?.franchisee?.id,
          message: text,
        },
        files,
      });
    } catch (error: any) {
      setMessages((prev) => ({
        ...prev,
        [selectedChat.id]: prev[selectedChat.id].filter((m) => m.id !== tempId),
      }));
      toast.error(error?.message || "Erro ao enviar mensagem");
    }
  };

  /* ── Renders condicionais ── */
  if (connectionStatus === "loading")
    return (
      <FranchiseeLayout>
        <div className="h-full flex items-center justify-center bg-gradient-to-br from-background to-muted/30">
          <div className="text-center animate-fade-in">
            <Loader2 className="w-12 h-12 text-primary mx-auto mb-4 animate-spin" />
            <h2 className="text-lg font-medium text-foreground mb-1">
              Verificando conexão
            </h2>
            <p className="text-sm text-muted-foreground">
              Aguarde enquanto verificamos seu WhatsApp...
            </p>
          </div>
        </div>
      </FranchiseeLayout>
    );

  {
    /*}
  if (connectionStatus === "selecting")
    return (
      <FranchiseeLayout>
        <ConnectionProviderSelect
          onSelect={handleProviderSelect}
          isLoading={isProviderLoading}
        />
      </FranchiseeLayout>
    );
    {*/
  }
  if (connectionStatus === "connecting" && provider)
    return (
      <FranchiseeLayout>
        <QRCodeConnection
          qrCode={qrCode}
          provider={provider}
          onRetry={handleRetryConnection}
          onConnected={handleConnected}
          checkConnection={checkConnection}
        />
      </FranchiseeLayout>
    );

  /* ── RENDER PRINCIPAL ── */
  return (
    <FranchiseeLayout>
      <div className="h-full flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-card dark:bg-slate-900 border-b dark:border-slate-800 px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {selectedChat && (
                <button
                  onClick={() => setIsSidebarCollapsed((v) => !v)}
                  className="hidden md:flex items-center justify-center p-2 rounded-lg hover:bg-accent dark:hover:bg-slate-800 transition-all duration-200 group"
                  title={
                    isSidebarCollapsed
                      ? "Expandir lista de conversas"
                      : "Minimizar lista de conversas"
                  }
                >
                  {isSidebarCollapsed ? (
                    <PanelLeftOpen className="w-5 h-5 text-muted-foreground group-hover:text-foreground transition-colors" />
                  ) : (
                    <PanelLeftClose className="w-5 h-5 text-muted-foreground group-hover:text-foreground transition-colors" />
                  )}
                </button>
              )}
              <div>
                <h1 className="text-2xl font-bold">Conversas</h1>
                <p className="text-sm text-muted-foreground">
                  Gerencie suas conversas em tempo real
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <ConnectionStatusBadge status="connected" />
              <button
                onClick={() => setIsSettingsOpen(true)}
                className="p-2 hover:bg-accent rounded-lg transition-colors group"
                title="Configurações"
              >
                <Settings className="w-5 h-5 text-muted-foreground group-hover:text-foreground group-hover:rotate-90 transition-all duration-300" />
              </button>
              <button
                onClick={() => setIsDisconnectOpen(true)}
                className="p-2 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-all duration-300 group"
                title="Desconectar"
              >
                <LogOut className="w-5 h-5 text-red-500 dark:text-red-400 group-hover:text-red-600 group-hover:translate-x-1 group-hover:scale-110 transition-all duration-300" />
              </button>
            </div>
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex overflow-hidden">
          <div
            className={`
              flex-shrink-0 overflow-hidden
              transition-all duration-300 ease-in-out
              ${selectedChat ? "hidden md:block" : "w-full md:block"}
              ${isSidebarCollapsed ? "md:w-0" : "md:w-96"}
            `}
          >
            <div className="w-96 h-full border-r border-border dark:border-slate-800">
              <ConversationList
                conversations={conversations}
                leads={leadsFiltered}
                selectedId={selectedChat?.id || null}
                onSelect={isLoadingMessages ? () => {} : setSelectedChat}
                isLoading={isLoading}
                aiTypingConversations={aiTypingConversations}
                onToggleAi={handleToggleAi}
              />
            </div>
          </div>

          {!selectedChat ? (
            <div className="hidden md:flex flex-1">
              <EmptyState />
            </div>
          ) : (
            <div className="flex-1 flex flex-col bg-muted/20 dark:bg-slate-950/50 min-w-0">
              <ChatHeader
                conversation={selectedChat}
                onBack={() => setSelectedChat(null)}
                isAiTyping={isAiTyping}
                onLeadUpdate={handleLeadUpdate}
                onSearchChange={setMessageSearchQuery}
                onDeleteConversation={handleDeleteConversation}
              />

              {/* Banner de resultados da busca */}
              {messageSearchQuery && (
                <div className="px-4 py-2 bg-yellow-50 dark:bg-yellow-950/20 border-b border-yellow-200/60 dark:border-yellow-800/30 flex items-center justify-between animate-in fade-in slide-in-from-top-1 duration-200">
                  <span className="text-xs text-yellow-700 dark:text-yellow-400 font-medium">
                    {filteredMessages.filter(
                      (m) => !String(m.id).startsWith(AI_TYPING_PREFIX),
                    ).length === 0
                      ? "Nenhuma mensagem encontrada"
                      : `${
                          filteredMessages.filter(
                            (m) => !String(m.id).startsWith(AI_TYPING_PREFIX),
                          ).length
                        } mensagem(ns) encontrada(s) para "${messageSearchQuery}"`}
                  </span>
                </div>
              )}

              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {isLoadingMessages ? (
                  <div className="flex items-center justify-center h-full">
                    <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <>
                    {filteredMessages
                      .filter(
                        (msg) => !String(msg.id).startsWith(AI_TYPING_PREFIX),
                      )
                      .map((msg) => (
                        <MessageBubble
                          key={msg.id}
                          message={msg}
                          onMediaClick={handleMediaClick}
                          highlightQuery={messageSearchQuery}
                        />
                      ))}

                    {isAiTyping && (
                      <div className="flex justify-end animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <div className="flex flex-col items-end gap-1">
                          <div className="flex items-center gap-1.5 bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-950/30 dark:to-indigo-950/30 border border-purple-200/50 dark:border-purple-700/30 rounded-2xl rounded-br-md px-4 py-3 shadow-sm">
                            <span className="w-2 h-2 bg-purple-400 dark:bg-purple-500 rounded-full animate-bounce [animation-delay:0ms]" />
                            <span className="w-2 h-2 bg-purple-400 dark:bg-purple-500 rounded-full animate-bounce [animation-delay:150ms]" />
                            <span className="w-2 h-2 bg-purple-400 dark:bg-purple-500 rounded-full animate-bounce [animation-delay:300ms]" />
                          </div>
                          <span className="text-[10px] text-purple-500 dark:text-purple-400 font-medium flex items-center gap-1 mr-1">
                            <svg
                              className="w-3 h-3"
                              viewBox="0 0 24 24"
                              fill="currentColor"
                            >
                              <path d="M12 2a2 2 0 0 1 2 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 0 1 7 7h1a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1h-1v1a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-1H2a1 1 0 0 1-1-1v-3a1 1 0 0 1 1-1h1a7 7 0 0 1 7-7h1V5.73c-.6-.34-1-.99-1-1.73a2 2 0 0 1 2-2M7.5 13A2.5 2.5 0 0 0 5 15.5 2.5 2.5 0 0 0 7.5 18 2.5 2.5 0 0 0 10 15.5 2.5 2.5 0 0 0 7.5 13m9 0A2.5 2.5 0 0 0 14 15.5a2.5 2.5 0 0 0 2.5 2.5 2.5 2.5 0 0 0 2.5-2.5A2.5 2.5 0 0 0 16.5 13z" />
                            </svg>
                            IA digitando...
                          </span>
                        </div>
                      </div>
                    )}
                  </>
                )}

                <div ref={messagesEndRef} />
              </div>

              <MessageInput onSend={handleSendMessage} disabled={isAiTyping} />
            </div>
          )}
        </div>
      </div>

      <ChatSettingsModal
        chatSettings={chatSettings}
        open={isSettingsOpen}
        onOpenChange={setIsSettingsOpen}
        currentProvider={provider || undefined}
        onSave={handleSaveSettings}
      />
      <DisconnectModal
        isOpen={isDisconnectOpen}
        onClose={() => setIsDisconnectOpen(false)}
        onConfirm={handleDisconnect}
        isDisconnecting={isDisconnecting}
      />
      <MediaModal
        isOpen={mediaModal.isOpen}
        onClose={handleCloseMediaModal}
        mediaType={mediaModal.type}
        mediaSrc={mediaModal.src}
      />
    </FranchiseeLayout>
  );
};

export default Chat;
