import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import {
  Search,
  MessageCircle,
  Plus,
  Send,
  X,
  ChevronLeft,
  ChevronRight,
  Loader2,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import ConversationItem from "./ConversationItem";
import { Conversation } from "./types";
import { sendMessageToLeadWithoutConversation } from "@/controllers/franchisee/Message";
import { toast } from "sonner";

interface ConversationListProps {
  conversations: Conversation[];
  leads: any[];
  selectedId: string | null;
  onSelect: (conversation: Conversation) => void;
  isLoading: boolean;
  aiTypingConversations?: Set<string>;
  onToggleAi?: (conversationId: string) => Promise<void>; // ← adicionado
}

interface Lead {
  id: string;
  name: string;
  phone: string;
  email?: string;
  profile_picture?: string | null;
}

interface ModalState {
  isOpen: boolean;
  selectedLead: Lead | null;
  message: string;
  leadSearchTerm: string;
  isSending: boolean;
}

const ConversationList = ({
  conversations,
  leads,
  selectedId,
  onSelect,
  isLoading,
  aiTypingConversations = new Set(),
  onToggleAi, // ← adicionado
}: ConversationListProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [animatingIds, setAnimatingIds] = useState<Set<string>>(new Set());
  const previousOrderRef = useRef<string[]>([]);

  const [modal, setModal] = useState<ModalState>({
    isOpen: false,
    selectedLead: null,
    message: "",
    leadSearchTerm: "",
    isSending: false,
  });

  const filteredConversations = useMemo(() => {
    if (!Array.isArray(conversations)) return [];

    return conversations.filter((conv) =>
      (conv?.name ?? "")
        .toLowerCase()
        .includes((searchTerm ?? "").toLowerCase()),
    );
  }, [conversations, searchTerm]);

  const filteredLeads = useMemo(() => {
    if (!Array.isArray(leads)) return [];

    const search = (modal.leadSearchTerm ?? "").toLowerCase();

    return leads.filter(
      (lead) =>
        (lead?.name ?? "").toLowerCase().includes(search) ||
        (lead?.phone ?? "").includes(search) ||
        (lead?.email ?? "").toLowerCase().includes(search),
    );
  }, [leads, modal.leadSearchTerm]);

  useEffect(() => {
    const currentOrder = filteredConversations.map((c) => c.id);
    const previousOrder = previousOrderRef.current;

    if (previousOrder.length > 0 && currentOrder.length > 0) {
      if (
        currentOrder[0] !== previousOrder[0] &&
        previousOrder.includes(currentOrder[0])
      ) {
        setAnimatingIds(new Set([currentOrder[0]]));
        const timer = setTimeout(() => {
          setAnimatingIds(new Set());
        }, 600);
        return () => clearTimeout(timer);
      }
    }

    previousOrderRef.current = currentOrder;
  }, [filteredConversations]);

  const handleOpenModal = useCallback(() => {
    setModal({
      isOpen: true,
      selectedLead: null,
      message: "",
      leadSearchTerm: "",
      isSending: false,
    });
  }, []);

  const handleCloseModal = useCallback(() => {
    setModal({
      isOpen: false,
      selectedLead: null,
      message: "",
      leadSearchTerm: "",
      isSending: false,
    });
  }, []);

  const handleSelectLead = useCallback((lead: Lead) => {
    setModal((prev) => ({
      ...prev,
      selectedLead: lead,
      message: "",
    }));
  }, []);

  const handleBackToLeads = useCallback(() => {
    setModal((prev) => ({
      ...prev,
      selectedLead: null,
      message: "",
    }));
  }, []);

  const handleSendMessage = useCallback(async () => {
    if (!modal.selectedLead || !modal.message.trim() || modal.isSending) return;

    setModal((prev) => ({ ...prev, isSending: true }));

    try {
      const data = {
        lead_id: modal.selectedLead.id,
        message: modal.message.trim(),
      };

      await sendMessageToLeadWithoutConversation({ data });

      toast.success("Mensagem enviada com sucesso!");
      handleCloseModal();
    } catch (err: any) {
      toast.error(err?.message || "Erro ao enviar mensagem");
      console.error("Erro ao enviar mensagem:", err);
      setModal((prev) => ({ ...prev, isSending: false }));
    }
  }, [modal.selectedLead, modal.message, modal.isSending, handleCloseModal]);

  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setSearchTerm(e.target.value);
    },
    [],
  );

  const handleLeadSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setModal((prev) => ({
        ...prev,
        leadSearchTerm: e.target.value,
      }));
    },
    [],
  );

  const handleMessageChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setModal((prev) => ({
        ...prev,
        message: e.target.value,
      }));
    },
    [],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        handleSendMessage();
      }
    },
    [handleSendMessage],
  );

  return (
    <div className="flex flex-col h-full bg-card dark:bg-slate-900 border-r border-border dark:border-slate-800">
      <SearchBar
        searchTerm={searchTerm}
        onSearchChange={handleSearchChange}
        onNewConversation={handleOpenModal}
      />

      <ConversationListContent
        isLoading={isLoading}
        conversations={filteredConversations}
        selectedId={selectedId}
        animatingIds={animatingIds}
        onSelect={onSelect}
        searchTerm={searchTerm}
        aiTypingConversations={aiTypingConversations}
        onToggleAi={onToggleAi} // ← adicionado
      />

      {modal.isOpen && (
        <NewConversationModal
          modal={modal}
          filteredLeads={filteredLeads}
          onClose={handleCloseModal}
          onSelectLead={handleSelectLead}
          onBackToLeads={handleBackToLeads}
          onLeadSearchChange={handleLeadSearchChange}
          onMessageChange={handleMessageChange}
          onSendMessage={handleSendMessage}
          onKeyDown={handleKeyDown}
        />
      )}
    </div>
  );
};

interface SearchBarProps {
  searchTerm: string;
  onSearchChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onNewConversation: () => void;
}

const SearchBar = ({
  searchTerm,
  onSearchChange,
  onNewConversation,
}: SearchBarProps) => (
  <div className="p-4 border-b border-border animate-in fade-in slide-in-from-top-2 duration-500">
    <div className="flex gap-2">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4 pointer-events-none" />
        <input
          type="text"
          placeholder="Buscar conversas..."
          value={searchTerm}
          onChange={onSearchChange}
          aria-label="Buscar conversas"
          className="w-full pl-10 pr-4 py-2.5 bg-muted/50 border border-border rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm placeholder:text-muted-foreground hover:bg-muted/70"
        />
      </div>
      <button
        onClick={onNewConversation}
        aria-label="Iniciar nova conversa"
        title="Nova conversa"
        className="
          flex items-center justify-center
          w-10 h-10
          bg-gradient-to-br
          from-green-500 to-green-600
          dark:from-green-600 dark:to-green-700
          text-white
          rounded-xl
          shadow-md
          transition-all duration-200
          hover:scale-105 hover:shadow-lg
          active:scale-95
          focus:ring-2 focus:ring-green-400 focus:outline-none
        "
      >
        <Plus className="w-5 h-5" />
      </button>
    </div>
  </div>
);

interface ConversationListContentProps {
  isLoading: boolean;
  conversations: Conversation[];
  selectedId: string | null;
  animatingIds: Set<string>;
  onSelect: (conversation: Conversation) => void;
  searchTerm: string;
  aiTypingConversations: Set<string>;
  onToggleAi?: (conversationId: string) => Promise<void>; // ← adicionado
}

const ConversationListContent = ({
  isLoading,
  conversations,
  selectedId,
  animatingIds,
  onSelect,
  searchTerm,
  aiTypingConversations,
  onToggleAi, // ← adicionado
}: ConversationListContentProps) => (
  <div className="flex-1 overflow-y-auto">
    {isLoading ? (
      <LoadingSkeletons />
    ) : conversations.length === 0 ? (
      <EmptyConversationsState searchTerm={searchTerm} />
    ) : (
      <div className="space-y-1 p-2">
        {conversations.map((conv, index) => (
          <div
            key={conv.id}
            className="animate-in fade-in slide-in-from-left-2 duration-500"
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <ConversationItem
              conversation={conv}
              isSelected={selectedId === conv.id}
              onClick={() => onSelect(conv)}
              isAnimating={animatingIds.has(conv.id)}
              isAiTyping={aiTypingConversations.has(conv.id)}
              onToggleAi={onToggleAi} // ← adicionado
            />
          </div>
        ))}
      </div>
    )}
  </div>
);

const LoadingSkeletons = () => (
  <div className="space-y-1 p-2">
    {[...Array(5)].map((_, i) => (
      <div
        key={i}
        className="flex items-center gap-3 p-4 animate-in fade-in slide-in-from-left-3 duration-500 rounded-lg"
        style={{ animationDelay: `${i * 100}ms` }}
      >
        <Skeleton className="w-12 h-12 rounded-full flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      </div>
    ))}
  </div>
);

interface EmptyConversationsStateProps {
  searchTerm: string;
}

const EmptyConversationsState = ({
  searchTerm,
}: EmptyConversationsStateProps) => (
  <div className="flex flex-col items-center justify-center h-full p-8 text-center animate-in fade-in zoom-in-95 duration-700">
    <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4 animate-in spin-in-180 duration-1000">
      <MessageCircle className="w-8 h-8 text-muted-foreground" />
    </div>
    <p className="text-muted-foreground text-sm font-medium">
      {searchTerm ? "Nenhuma conversa encontrada" : "Nenhuma conversa ainda"}
    </p>
    <p className="text-muted-foreground text-xs mt-1">
      {searchTerm
        ? "Tente ajustar sua busca para encontrar o que procura"
        : "Inicie uma nova conversa clicando no botão acima"}
    </p>
  </div>
);

interface NewConversationModalProps {
  modal: ModalState;
  filteredLeads: Lead[];
  onClose: () => void;
  onSelectLead: (lead: Lead) => void;
  onBackToLeads: () => void;
  onLeadSearchChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onMessageChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onSendMessage: () => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
}

const NewConversationModal = ({
  modal,
  filteredLeads,
  onClose,
  onSelectLead,
  onBackToLeads,
  onLeadSearchChange,
  onMessageChange,
  onSendMessage,
  onKeyDown,
}: NewConversationModalProps) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-300">
    <div className="bg-card w-full max-w-md border border-border rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 slide-in-from-bottom-4 duration-500">
      <div className="p-4 border-b border-border flex items-center justify-between bg-muted/30">
        <h2 className="font-semibold text-lg">Nova Conversa</h2>
        <button
          onClick={onClose}
          className="p-2 hover:bg-muted rounded-full transition-colors focus:ring-2 focus:ring-primary/50 focus:outline-none"
          aria-label="Fechar modal"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {!modal.selectedLead ? (
        <LeadSelectionPanel
          searchTerm={modal.leadSearchTerm}
          leads={filteredLeads}
          onSearchChange={onLeadSearchChange}
          onSelectLead={onSelectLead}
        />
      ) : (
        <MessageCompositionPanel
          selectedLead={modal.selectedLead}
          message={modal.message}
          isSending={modal.isSending}
          onBackToLeads={onBackToLeads}
          onMessageChange={onMessageChange}
          onSendMessage={onSendMessage}
          onKeyDown={onKeyDown}
        />
      )}
    </div>
  </div>
);

interface LeadSelectionPanelProps {
  searchTerm: string;
  leads: Lead[];
  onSearchChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSelectLead: (lead: Lead) => void;
}

const LeadSelectionPanel = ({
  searchTerm,
  leads,
  onSearchChange,
  onSelectLead,
}: LeadSelectionPanelProps) => (
  <>
    <div className="p-4 border-b border-border">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4 pointer-events-none" />
        <input
          type="text"
          placeholder="Buscar por nome, telefone ou email..."
          value={searchTerm}
          onChange={onSearchChange}
          className="w-full pl-10 pr-4 py-2.5 bg-muted/50 border border-border rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm placeholder:text-muted-foreground hover:bg-muted/70"
          autoFocus
        />
      </div>
    </div>

    <div className="flex-1 overflow-y-auto p-2 min-h-[300px]">
      {leads.length === 0 ? (
        <EmptyLeadsState searchTerm={searchTerm} />
      ) : (
        <div className="space-y-1">
          {leads.map((lead) => (
            <LeadItem key={lead.id} lead={lead} onSelect={onSelectLead} />
          ))}
        </div>
      )}
    </div>
  </>
);

interface LeadItemProps {
  lead: Lead;
  onSelect: (lead: Lead) => void;
}

const LeadAvatar = ({
  name,
  profilePicture,
}: {
  name: string;
  profilePicture?: string | null;
}) => {
  const [imgError, setImgError] = useState(false);

  const initials = name
    .split(" ")
    .map((n) => n.charAt(0).toUpperCase())
    .join("")
    .slice(0, 2);

  if (profilePicture && !imgError) {
    return (
      <img
        src={profilePicture}
        alt={name}
        onError={() => setImgError(true)}
        className="w-10 h-10 rounded-full object-cover flex-shrink-0"
      />
    );
  }

  return (
    <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center flex-shrink-0 font-semibold text-sm text-green-600 dark:text-green-400">
      {initials}
    </div>
  );
};

const LeadItem = ({ lead, onSelect }: LeadItemProps) => {
  return (
    <button
      onClick={() => onSelect(lead)}
      className="w-full p-3 flex items-center justify-between hover:bg-muted/50 rounded-xl transition-all group active:scale-[0.98] focus:ring-2 focus:ring-primary/20 focus:outline-none"
      aria-label={`Selecionar ${lead.name}`}
    >
      <div className="flex items-center gap-3">
        <LeadAvatar name={lead.name} profilePicture={lead.profile_picture} />
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm truncate text-left">{lead.name}</p>
          <p className="text-xs text-muted-foreground truncate text-left">
            {lead.phone}
            {lead.email && ` • ${lead.email}`}
          </p>
        </div>
        <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
      </div>
    </button>
  );
};

interface EmptyLeadsStateProps {
  searchTerm: string;
}

const EmptyLeadsState = ({ searchTerm }: EmptyLeadsStateProps) => (
  <div className="flex flex-col items-center justify-center p-8 text-center">
    <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mb-3">
      <MessageCircle className="w-6 h-6 text-muted-foreground" />
    </div>
    <p className="text-muted-foreground text-sm font-medium">
      {searchTerm ? "Nenhum lead encontrado" : "Nenhum lead disponível"}
    </p>
    <p className="text-muted-foreground text-xs mt-1">
      {searchTerm
        ? "Tente ajustar sua busca"
        : "Nenhum lead foi adicionado ainda"}
    </p>
  </div>
);

interface MessageCompositionPanelProps {
  selectedLead: Lead;
  message: string;
  isSending: boolean;
  onBackToLeads: () => void;
  onMessageChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onSendMessage: () => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
}

const MessageCompositionPanel = ({
  selectedLead,
  message,
  isSending,
  onBackToLeads,
  onMessageChange,
  onSendMessage,
  onKeyDown,
}: MessageCompositionPanelProps) => {
  const characterCount = message.length;
  const maxCharacters = 1000;
  const isNearLimit = characterCount > maxCharacters * 0.8;

  return (
    <>
      <div className="p-4 border-b border-border">
        <button
          onClick={onBackToLeads}
          disabled={isSending}
          className="text-sm text-green-600 hover:text-green-700 disabled:text-muted-foreground transition-colors mb-3 flex items-center gap-1 focus:ring-2 focus:ring-green-500/50 focus:outline-none rounded px-1"
          aria-label="Voltar para seleção de leads"
        >
          <ChevronLeft className="w-4 h-4" />
          Voltar
        </button>
        <div className="flex items-center gap-3">
          <LeadAvatar
            name={selectedLead.name}
            profilePicture={selectedLead.profile_picture}
          />
          <div className="flex-1 min-w-0">
            <p className="font-medium truncate">{selectedLead.name}</p>
            <p className="text-sm text-muted-foreground truncate">
              {selectedLead.phone}
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1 p-4 flex flex-col">
        <div className="flex items-center justify-between mb-2">
          <label htmlFor="message-input" className="text-sm font-medium">
            Mensagem inicial
          </label>
          <span
            className={`text-xs transition-colors ${
              isNearLimit
                ? "text-amber-500 font-medium"
                : "text-muted-foreground"
            }`}
            aria-live="polite"
          >
            {characterCount}/{maxCharacters}
          </span>
        </div>
        <textarea
          id="message-input"
          value={message}
          onChange={onMessageChange}
          onKeyDown={onKeyDown}
          disabled={isSending}
          placeholder="Digite sua mensagem... (Ctrl/Cmd + Enter para enviar)"
          aria-label="Conteúdo da mensagem"
          className="flex-1 p-3 bg-muted/50 border border-border rounded-xl focus:ring-2 focus:ring-green-500/20 focus:border-green-600 transition-all text-sm placeholder:text-muted-foreground resize-none min-h-[120px] hover:bg-muted/70 disabled:opacity-50"
          autoFocus
          maxLength={maxCharacters}
        />
      </div>

      <div className="p-4 border-t border-border">
        <button
          onClick={onSendMessage}
          disabled={!message.trim() || isSending}
          className="w-full py-3 bg-green-600 hover:bg-green-700 disabled:bg-muted disabled:text-muted-foreground text-white rounded-xl transition-all flex items-center justify-center gap-2 font-medium disabled:cursor-not-allowed focus:ring-2 focus:ring-green-500/50 focus:outline-none"
          aria-label={isSending ? "Enviando mensagem..." : "Enviar mensagem"}
        >
          {isSending ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Enviando...
            </>
          ) : (
            <>
              <Send className="w-4 h-4" />
              Enviar Mensagem
            </>
          )}
        </button>
      </div>
    </>
  );
};

export default ConversationList;
