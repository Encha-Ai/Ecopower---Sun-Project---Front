import React, {
  useState,
  useRef,
  useEffect,
  useCallback,
  useMemo,
} from "react";
import { useAuth } from "@/contexts/AuthContext";
import FranchiseeLayout from "@/components/Franchisee/FranchiseeLayout";
import * as RagController from "@/controllers/franchisee/RagController";
import { AI_ASSISTANTS } from "@/components/Franchisee/IAEngineer/Inboxes";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Send,
  Sparkles,
  Trash2,
  FileText,
  Search,
  X,
  MessageSquare,
  Clock,
  User,
  Building2,
  AlertCircle,
  Calendar,
  HardDrive,
  ChevronLeft,
  ChevronRight,
  Zap,
  TrendingUp,
  Menu,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function IAEngineerChat() {
  const { user } = useAuth();
  const { toast } = useToast();

  const [selectedAI, setSelectedAI] = useState(AI_ASSISTANTS[0]);
  const [conversations, setConversations] = useState<any>({});
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const [generalDocuments, setGeneralDocuments] = useState<any[]>([]);
  const [dealershipDocuments, setDealershipDocuments] = useState<any[]>([]);

  const [searchFilter, setSearchFilter] = useState("");
  const [messageSearchFilter, setMessageSearchFilter] = useState("");
  const [showMessageSearch, setShowMessageSearch] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isLoading) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isLoading]);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      if (mobile) setSidebarCollapsed(true);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "48px";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 150)}px`;
    }
  }, [inputValue]);

  const formatFileSize = useCallback((bytes: number) => {
    if (!bytes) return "-";
    const kb = bytes / 1024;
    const mb = kb / 1024;
    return mb >= 1 ? `${mb.toFixed(2)} MB` : `${kb.toFixed(2)} KB`;
  }, []);

  const formatDate = useCallback((dateString: string) => {
    if (!dateString) return "---";
    return new Date(dateString).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      timeZone: "America/Sao_Paulo",
    });
  }, []);

  const formatTime = useCallback((date: Date | string | number) => {
    return new Date(date).toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "America/Sao_Paulo",
    });
  }, []);

  const fetchData = useCallback(async () => {
    if (!selectedAI || !user?.franchisee?.id) return;
    try {
      const [docsResponse, messagesResponse] = await Promise.all([
        RagController.listAllDocuments({ doc_id: selectedAI.id }),
        RagController.getMessageByAid({
          id: selectedAI.id,
          franchiseeId: user.franchisee.id,
        }),
      ]);

      const mainDocs = Array.isArray(docsResponse?.main)
        ? docsResponse.main
        : Object.values(docsResponse).filter(
            (item: any) =>
              item &&
              typeof item === "object" &&
              !Array.isArray(item) &&
              !("dealerships" in item),
          );
      const dealerDocs = Array.isArray(docsResponse?.dealership)
        ? docsResponse.dealership
        : [];

      const formatDoc = (doc: any) => ({
        id: doc.id,
        name: doc.file_name,
        type: doc.file_type,
        size: formatFileSize(doc.file_size),
        description: doc.description,
        uploadDate: doc.create_at,
        assistantId: selectedAI.id,
      });

      setGeneralDocuments(mainDocs.map(formatDoc));
      setDealershipDocuments(dealerDocs.map(formatDoc));

      const mappedMessages = Array.isArray(messagesResponse)
        ? messagesResponse.map((msg: any) => ({
            id: msg.id,
            role: msg.senderType,
            content: msg.message,
            timestamp: msg.createdAt,
          }))
        : [];

      const welcomeMessage = {
        id: `welcome-${selectedAI.id}`,
        role: "IA",
        content: `Olá! Sou Anna, sua especialista na concessionária ${selectedAI.name}. Como posso ajudar você hoje?`,
        timestamp: new Date().toISOString(),
      };

      setConversations((prev: any) => ({
        ...prev,
        [selectedAI.id]: [welcomeMessage, ...mappedMessages],
      }));
    } catch (error) {
      console.error("Erro ao sincronizar assistente:", error);
      toast({
        title: "Erro de sincronização",
        description: "Não conseguimos carregar o histórico completo.",
        variant: "destructive",
      });
    }
  }, [selectedAI, user, formatFileSize, toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [conversations, selectedAI, scrollToBottom]);

  const handleSendMessage = async () => {
    const messageText = inputValue.trim();
    if (!messageText || isLoading) return;

    const userMessage = {
      id: Date.now().toString(),
      role: "User",
      content: messageText,
      timestamp: new Date().toISOString(),
    };

    setConversations((prev: any) => ({
      ...prev,
      [selectedAI.id]: [...(prev[selectedAI.id] || []), userMessage],
    }));
    setInputValue("");
    setIsLoading(true);

    try {
      const response = await RagController.sendMessage({
        data: {
          message: messageText,
          session_id: user?.franchisee.id,
          dealerships: selectedAI.id.toUpperCase(),
        },
      });

      const aiResponse = {
        id: (Date.now() + 1).toString(),
        role: "IA",
        content: response,
        timestamp: new Date().toISOString(),
      };

      setConversations((prev: any) => ({
        ...prev,
        [selectedAI.id]: [...(prev[selectedAI.id] || []), aiResponse],
      }));
    } catch (error) {
      toast({
        title: "Erro no envio",
        description: "A Anna não conseguiu responder no momento.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearChat = async () => {
    try {
      await RagController.deleteMessages({
        session_id: user?.franchisee?.id,
        id: selectedAI.id,
      });
      setConversations((prev: any) => ({
        ...prev,
        [selectedAI.id]: [
          {
            id: "welcome-reset",
            role: "IA",
            content: `Histórico limpo. Como posso ajudar você agora?`,
            timestamp: new Date().toISOString(),
          },
        ],
      }));
      toast({
        title: "Memória limpa",
        description: "O histórico foi removido com sucesso.",
      });
    } catch (error) {
      toast({ title: "Erro ao limpar", variant: "destructive" });
    }
  };

  const filteredAssistants = useMemo(() => {
    return AI_ASSISTANTS.filter(
      (ai) =>
        ai.name.toLowerCase().includes(searchFilter.toLowerCase()) ||
        ai.description.toLowerCase().includes(searchFilter.toLowerCase()),
    );
  }, [searchFilter]);

  const currentMessages = conversations[selectedAI.id] || [];

  const filteredMessages = useMemo(() => {
    if (!messageSearchFilter.trim()) return currentMessages;
    return currentMessages.filter((msg: any) =>
      msg.content.toLowerCase().includes(messageSearchFilter.toLowerCase()),
    );
  }, [currentMessages, messageSearchFilter]);

  const handleClearMessageSearch = () => {
    setMessageSearchFilter("");
    setShowMessageSearch(false);
  };

  const DocumentCard = ({ doc }: { doc: any }) => (
    <div className="group relative flex flex-col p-4 rounded-2xl border-2 border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-green-400 dark:hover:border-green-600 hover:shadow-xl hover:shadow-green-500/10 hover:-translate-y-0.5 transition-all duration-300">
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-green-400/0 to-emerald-400/0 group-hover:from-green-400/5 group-hover:to-emerald-400/5 transition-all duration-300 pointer-events-none" />
      <div className="flex items-start gap-3 relative z-10">
        <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 flex items-center justify-center shrink-0 group-hover:from-green-600 group-hover:to-emerald-600 group-hover:scale-105 transition-all duration-300 shadow-sm">
          <FileText className="w-5 h-5 text-green-600 dark:text-green-400 group-hover:text-white transition-colors duration-300" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1.5">
            <h4 className="font-black text-slate-900 dark:text-slate-100 text-xs leading-tight group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors line-clamp-2">
              {doc.name}
            </h4>
            <Badge
              variant="secondary"
              className="text-[8px] font-black uppercase bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-1.5 py-0.5 shrink-0"
            >
              {doc.type?.split("/")[1] || doc.type || "DOC"}
            </Badge>
          </div>
          {doc.description && (
            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed line-clamp-2 mb-3">
              {doc.description}
            </p>
          )}
          <div className="flex items-center gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-1.5">
              <Calendar className="w-3 h-3 text-slate-400 dark:text-slate-500" />
              <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">
                {formatDate(doc.uploadDate)}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <HardDrive className="w-3 h-3 text-slate-400 dark:text-slate-500" />
              <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">
                {doc.size}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <FranchiseeLayout>
      {/* Container principal: ocupa toda a viewport disponível sem overflow externo */}
      <div className="flex h-full overflow-hidden bg-gradient-to-br from-slate-50 via-green-50/30 to-emerald-50/20 dark:from-slate-950 dark:via-slate-950 dark:to-slate-900 transition-colors duration-300 relative">
        {/* Grid de fundo sutil */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#10b98108_1px,transparent_1px),linear-gradient(to_bottom,#10b98108_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />

        {/* Overlay escuro no mobile quando sidebar aberta */}
        {!sidebarCollapsed && isMobile && (
          <div
            className="fixed inset-0 bg-black/50 z-30 lg:hidden"
            onClick={() => setSidebarCollapsed(true)}
          />
        )}

        {/* ── SIDEBAR ── */}
        <aside
          className={`
            ${sidebarCollapsed ? "w-0 lg:w-[72px]" : "w-72 sm:w-80"}
            ${isMobile && !sidebarCollapsed ? "fixed inset-y-0 left-0 z-40" : "relative"}
            flex flex-col shrink-0 bg-white dark:bg-slate-900
            border-r border-slate-200/60 dark:border-slate-800/60
            transition-all duration-300 overflow-hidden shadow-xl z-10
          `}
        >
          {/* Header da Sidebar */}
          <div className="p-4 border-b border-slate-100 dark:border-slate-800 shrink-0">
            <div className="flex items-center justify-between">
              {!sidebarCollapsed && (
                <h2 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <div className="p-1.5 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 shadow-md">
                    <Sparkles className="w-4 h-4 text-white" />
                  </div>
                  Assistentes
                </h2>
              )}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                className={`rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 h-9 w-9 shrink-0 ${sidebarCollapsed ? "mx-auto" : ""}`}
              >
                {sidebarCollapsed ? (
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                ) : (
                  <ChevronLeft className="w-4 h-4 text-slate-400" />
                )}
              </Button>
            </div>

            {!sidebarCollapsed && (
              <div className="relative mt-3">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Buscar..."
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all placeholder:text-slate-400"
                />
              </div>
            )}
          </div>

          {/* Lista de Assistentes */}
          <ScrollArea className="flex-1">
            <div className="p-2 space-y-1.5">
              {filteredAssistants.map((ai) => (
                <button
                  key={ai.id}
                  onClick={() => {
                    setSelectedAI(ai);
                    if (isMobile) setSidebarCollapsed(true);
                  }}
                  title={sidebarCollapsed ? ai.name : undefined}
                  className={`
                    w-full flex items-center gap-3 transition-all duration-200 group relative overflow-hidden
                    ${sidebarCollapsed ? "p-2 justify-center rounded-xl" : "p-3 rounded-2xl"}
                    ${
                      selectedAI.id === ai.id
                        ? "bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-lg shadow-green-500/25 scale-[1.02]"
                        : "hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400"
                    }
                  `}
                >
                  <div
                    className={`
                    w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-all duration-200
                    ${
                      selectedAI.id === ai.id
                        ? "bg-white/20 shadow-md"
                        : `bg-gradient-to-br ${ai.color} shadow-sm group-hover:scale-105`
                    }
                  `}
                  >
                    <ai.icon className="w-4 h-4 text-white" />
                  </div>

                  {!sidebarCollapsed && (
                    <div className="flex-1 text-left min-w-0">
                      <p
                        className={`font-black text-xs truncate ${selectedAI.id === ai.id ? "text-white" : "text-slate-900 dark:text-slate-200"}`}
                      >
                        {ai.name}
                      </p>
                      <p
                        className={`text-[10px] font-semibold truncate mt-0.5 uppercase tracking-wider ${selectedAI.id === ai.id ? "text-green-100" : "text-slate-400"}`}
                      >
                        {ai.description}
                      </p>
                    </div>
                  )}

                  {selectedAI.id === ai.id && !sidebarCollapsed && (
                    <Zap className="w-3.5 h-3.5 text-white animate-pulse shrink-0" />
                  )}
                </button>
              ))}
            </div>
          </ScrollArea>
        </aside>

        {/* ── ÁREA PRINCIPAL DO CHAT ── */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative z-10 p-2 sm:p-3 lg:p-4">
          <Card className="flex-1 flex flex-col border-none shadow-2xl rounded-2xl sm:rounded-3xl overflow-hidden bg-white dark:bg-slate-900 min-h-0">
            {/* Chat Header */}
            <div className="px-3 sm:px-5 lg:px-6 py-3 sm:py-4 border-b border-slate-100 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md shrink-0">
              <div className="flex items-center justify-between gap-2">
                {/* Lado esquerdo: menu + avatar + info */}
                <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                  {/* Botão menu mobile */}
                  {sidebarCollapsed && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setSidebarCollapsed(false)}
                      className="rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 h-9 w-9 shrink-0"
                    >
                      <Menu className="w-4 h-4 text-slate-400" />
                    </Button>
                  )}

                  <div className="relative shrink-0">
                    <div
                      className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-gradient-to-br ${selectedAI.color} flex items-center justify-center shadow-lg`}
                    >
                      <selectedAI.icon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                      <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-white dark:border-slate-900 flex items-center justify-center">
                        <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                      </div>
                    </div>
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm sm:text-base lg:text-lg font-black text-slate-900 dark:text-white truncate">
                        {selectedAI.name}
                      </h3>
                      <Badge className="hidden sm:flex bg-gradient-to-r from-green-500 to-emerald-600 text-white border-none text-[9px] font-black uppercase tracking-widest px-2 py-0.5 shadow-md shrink-0">
                        <TrendingUp className="w-2.5 h-2.5 mr-1" /> Online
                      </Badge>
                    </div>
                    <p className="hidden sm:block text-[10px] font-semibold text-slate-400 dark:text-slate-500 mt-0.5 uppercase tracking-wider truncate">
                      Especialista na {selectedAI.name}
                    </p>
                  </div>
                </div>

                {/* Ações */}
                <div className="flex items-center gap-1 shrink-0">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setShowMessageSearch(!showMessageSearch)}
                    className={`rounded-xl h-9 w-9 transition-all ${showMessageSearch ? "bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400" : "text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"}`}
                  >
                    <Search className="w-4 h-4" />
                  </Button>

                  {/* Modal de Documentos */}
                  <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                    <DialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-400 h-9 w-9"
                      >
                        <FileText className="w-4 h-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="w-[95vw] max-w-4xl rounded-2xl sm:rounded-3xl border-none shadow-2xl overflow-hidden flex flex-col p-0 bg-white dark:bg-slate-900 max-h-[90dvh]">
                      <div className="flex flex-col h-full overflow-hidden">
                        {/* Modal Header */}
                        <div className="p-4 sm:p-6 bg-gradient-to-br from-slate-50 to-white dark:from-slate-800 dark:to-slate-900 border-b border-slate-100 dark:border-slate-800 shrink-0">
                          <div className="flex items-start gap-3">
                            <div className="p-2 sm:p-2.5 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 shadow-lg shrink-0">
                              <FileText className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                            </div>
                            <div>
                              <DialogTitle className="text-lg sm:text-2xl font-black text-slate-900 dark:text-white">
                                Base de Conhecimento
                              </DialogTitle>
                              <DialogDescription className="text-slate-500 dark:text-slate-400 font-medium text-xs sm:text-sm mt-1">
                                Documentos que alimentam a Anna para{" "}
                                <span className="text-green-600 dark:text-green-400 font-black">
                                  {selectedAI.name}
                                </span>
                              </DialogDescription>
                            </div>
                          </div>
                        </div>

                        {/* Tabs */}
                        <Tabs
                          defaultValue="general"
                          className="flex-1 flex flex-col overflow-hidden"
                        >
                          <div className="px-4 sm:px-6 py-3 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 shrink-0">
                            <TabsList className="bg-slate-100/80 dark:bg-slate-800 p-1 rounded-xl w-full grid grid-cols-2 gap-1">
                              <TabsTrigger
                                value="general"
                                className="rounded-lg py-2 text-xs font-bold data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700 data-[state=active]:text-green-600 dark:data-[state=active]:text-green-400 data-[state=active]:shadow-md transition-all"
                              >
                                <Sparkles className="w-3 h-3 mr-1.5" />
                                Gerais
                                <Badge className="ml-1.5 bg-green-500 text-white border-none font-black text-[9px]">
                                  {generalDocuments.length}
                                </Badge>
                              </TabsTrigger>
                              <TabsTrigger
                                value="dealership"
                                className="rounded-lg py-2 text-xs font-bold data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700 data-[state=active]:text-emerald-600 dark:data-[state=active]:text-emerald-400 data-[state=active]:shadow-md transition-all"
                              >
                                <Building2 className="w-3 h-3 mr-1.5" />
                                Concessionária
                                <Badge className="ml-1.5 bg-emerald-500 text-white border-none font-black text-[9px]">
                                  {dealershipDocuments.length}
                                </Badge>
                              </TabsTrigger>
                            </TabsList>
                          </div>

                          <div className="flex-1 overflow-hidden">
                            <ScrollArea className="h-full">
                              <div className="p-4 sm:p-6">
                                <TabsContent
                                  value="general"
                                  className="mt-0 outline-none"
                                >
                                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                    {generalDocuments.length > 0 ? (
                                      generalDocuments.map((doc) => (
                                        <DocumentCard key={doc.id} doc={doc} />
                                      ))
                                    ) : (
                                      <div className="col-span-full flex flex-col items-center justify-center py-16 bg-slate-50/50 dark:bg-slate-800/30 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700">
                                        <Search className="w-10 h-10 text-slate-300 dark:text-slate-500 mb-3" />
                                        <p className="text-slate-500 dark:text-slate-400 font-bold text-sm">
                                          Nenhum documento geral
                                        </p>
                                      </div>
                                    )}
                                  </div>
                                </TabsContent>
                                <TabsContent
                                  value="dealership"
                                  className="mt-0 outline-none"
                                >
                                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                    {dealershipDocuments.length > 0 ? (
                                      dealershipDocuments.map((doc) => (
                                        <DocumentCard key={doc.id} doc={doc} />
                                      ))
                                    ) : (
                                      <div className="col-span-full flex flex-col items-center justify-center py-16 bg-slate-50/50 dark:bg-slate-800/30 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700">
                                        <Building2 className="w-10 h-10 text-slate-300 dark:text-slate-500 mb-3" />
                                        <p className="text-slate-500 dark:text-slate-400 font-bold text-sm">
                                          Nenhum documento específico
                                        </p>
                                      </div>
                                    )}
                                  </div>
                                </TabsContent>
                              </div>
                            </ScrollArea>
                          </div>
                        </Tabs>

                        {/* Modal Footer */}
                        <div className="p-4 sm:p-5 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
                          <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500 dark:text-slate-400">
                            <AlertCircle className="w-3.5 h-3.5" />
                            Todos os documentos alimentam o sistema RAG
                          </div>
                          <Button
                            onClick={() => setIsModalOpen(false)}
                            className="w-full sm:w-auto bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-xl px-6 font-bold shadow-md shadow-green-500/20"
                          >
                            Fechar
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>

                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleClearChat}
                    disabled={isLoading}
                    className="rounded-xl h-9 w-9 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Barra de busca de mensagens */}
              {showMessageSearch && (
                <div className="mt-3">
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={messageSearchFilter}
                      onChange={(e) => setMessageSearchFilter(e.target.value)}
                      placeholder="Buscar mensagens..."
                      className="w-full pl-9 pr-9 py-2.5 bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all placeholder:text-slate-400"
                      autoFocus
                    />
                    {messageSearchFilter && (
                      <button
                        onClick={handleClearMessageSearch}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                  {messageSearchFilter && (
                    <div className="mt-2 px-1">
                      <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 font-bold text-[10px]">
                        {filteredMessages.length} resultado(s)
                      </Badge>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* ── MENSAGENS ── */}
            <CardContent className="flex-1 overflow-y-auto p-3 sm:p-5 lg:p-6 space-y-3 sm:space-y-4 bg-gradient-to-b from-slate-50/30 to-white dark:from-slate-950/30 dark:to-slate-900 min-h-0">
              {filteredMessages.map((message: any, index: number) => (
                <div
                  key={message.id}
                  className={`flex ${message.role === "User" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`flex gap-2 sm:gap-3 max-w-[88%] sm:max-w-[80%] lg:max-w-[75%] ${message.role === "User" ? "flex-row-reverse" : ""}`}
                  >
                    <div
                      className={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl shrink-0 flex items-center justify-center shadow-md relative ${message.role === "User" ? "bg-gradient-to-br from-green-500 to-emerald-600" : `bg-gradient-to-br ${selectedAI.color}`}`}
                    >
                      {message.role === "User" ? (
                        <User className="w-4 h-4 text-white" />
                      ) : (
                        <>
                          <selectedAI.icon className="w-4 h-4 text-white" />
                          <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-white dark:border-slate-900" />
                        </>
                      )}
                    </div>
                    <div
                      className={`relative ${
                        message.role === "User"
                          ? "bg-gradient-to-br from-green-500 to-emerald-600 text-white rounded-[1.25rem] rounded-tr-md shadow-lg shadow-green-500/15"
                          : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-2 border-slate-100 dark:border-slate-700 rounded-[1.25rem] rounded-tl-md shadow-md"
                      } px-3 py-2.5 sm:px-4 sm:py-3`}
                    >
                      <p className="text-xs sm:text-sm leading-relaxed font-medium whitespace-pre-wrap break-words">
                        {message.content}
                      </p>
                      <div
                        className={`text-[9px] sm:text-[10px] mt-2 font-bold flex items-center gap-1 ${message.role === "User" ? "justify-end text-green-100" : "text-slate-400"}`}
                      >
                        <Clock className="w-2.5 h-2.5" />
                        {formatTime(message.timestamp)}
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {isLoading && (
                <div className="flex justify-start">
                  <div className="flex gap-2 sm:gap-3">
                    <div
                      className={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-br ${selectedAI.color} flex items-center justify-center shadow-md relative`}
                    >
                      <selectedAI.icon className="w-4 h-4 text-white" />
                      <div className="absolute inset-0 rounded-xl bg-white/20 animate-ping" />
                    </div>
                    <div className="bg-white dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 px-4 py-3 rounded-[1.25rem] rounded-tl-md shadow-md flex items-center gap-2">
                      <div className="flex gap-1">
                        <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-bounce [animation-delay:-0.3s]" />
                        <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce [animation-delay:-0.15s]" />
                        <span className="w-1.5 h-1.5 bg-green-600 rounded-full animate-bounce" />
                      </div>
                      <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        Anna está digitando
                      </span>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </CardContent>

            {/* ── INPUT ── */}
            <div className="p-2 sm:p-3 lg:p-4 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 shrink-0">
              <div className="flex items-end gap-2 bg-slate-50 dark:bg-slate-800 p-1.5 rounded-2xl border-2 border-slate-200 dark:border-slate-700 focus-within:bg-white dark:focus-within:bg-slate-900 focus-within:ring-4 focus-within:ring-green-500/10 focus-within:border-green-500 transition-all shadow-sm">
                <textarea
                  ref={textareaRef}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  placeholder={`Pergunte sobre ${selectedAI.name}...`}
                  className="flex-1 px-3 py-2.5 bg-transparent border-none focus:ring-0 font-medium text-xs sm:text-sm text-slate-700 dark:text-slate-200 placeholder:text-slate-400 resize-none max-h-[120px] min-h-[40px] scroll-smooth"
                  rows={1}
                  disabled={isLoading}
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={!inputValue.trim() || isLoading}
                  className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-xl h-10 w-10 sm:h-11 sm:w-11 shrink-0 shadow-lg shadow-green-500/30 transition-all active:scale-90 disabled:opacity-40 disabled:grayscale disabled:cursor-not-allowed"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
              <p className="text-[9px] text-center font-semibold text-slate-400 dark:text-slate-600 mt-2 uppercase tracking-wider">
                <MessageSquare className="w-2.5 h-2.5 inline mr-1" />
                Shift + Enter para quebrar linha
              </p>
            </div>
          </Card>
        </div>
      </div>
    </FranchiseeLayout>
  );
}
