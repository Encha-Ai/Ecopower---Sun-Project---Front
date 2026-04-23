import { ArrowLeft, Pencil, Search, X, Trash2 } from "lucide-react";
import { Conversation } from "./types";
import { useEffect, useState, useRef } from "react";
import { getLeadByConversationId } from "@/controllers/franchisee/Chat";
import { updateLead } from "@/controllers/franchisee/LeadController";
import LeadModal from "@/components/Franchisee/LeadModal";

interface ChatHeaderProps {
  conversation: Conversation;
  onBack: () => void;
  isAiTyping?: boolean;
  onLeadUpdate?: (
    conversationId: string,
    data: { name: string; phone: string }
  ) => void;
  onSearchChange?: (query: string) => void;
  onDeleteConversation?: (conversationId: string) => Promise<void>;
}

interface FormData {
  name: string;
  email: string;
  phone: string;
  leadType: string;
}

type LeadType = "CONTACT" | "LEAD" | "CLIENT";

const LEAD_TYPE_CONFIG: Record<LeadType, { label: string; className: string }> =
  {
    LEAD: {
      label: "Lead",
      className:
        "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    },
    CONTACT: {
      label: "Contato",
      className:
        "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
    },
    CLIENT: {
      label: "Cliente",
      className:
        "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
    },
  };

const LeadTypeBadge = ({ type }: { type: string }) => {
  const config = LEAD_TYPE_CONFIG[type as LeadType];
  if (!config) return null;

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${config.className}`}
    >
      {config.label}
    </span>
  );
};

const getInitials = (name: string): string => {
  return name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
};

const HeaderAvatar = ({
  name,
  profilePicture,
}: {
  name: string;
  profilePicture?: string | null;
}) => {
  const [imgError, setImgError] = useState(false);

  if (profilePicture && !imgError) {
    return (
      <img
        src={profilePicture}
        alt={name}
        onError={() => setImgError(true)}
        className="w-10 h-10 rounded-full object-cover shadow-md shrink-0 ring-2 ring-green-500/30"
      />
    );
  }

  return (
    <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 dark:from-green-600 dark:to-green-700 rounded-full flex items-center justify-center shadow-md shrink-0">
      <span className="text-white font-semibold text-xs">
        {getInitials(name)}
      </span>
    </div>
  );
};

const ChatHeader = ({
  conversation,
  onBack,
  isAiTyping = false,
  onLeadUpdate,
  onSearchChange,
  onDeleteConversation,
}: ChatHeaderProps) => {
  const [leadId, setLeadId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const [displayName, setDisplayName] = useState(conversation.name);
  const [displayPhone, setDisplayPhone] = useState(conversation.phone);
  const [displayLeadType, setDisplayLeadType] = useState<string>("");
  const [displayProfilePicture, setDisplayProfilePicture] = useState<
    string | null | undefined
  >(conversation.profile_picture);

  const [formData, setFormData] = useState<FormData>({
    name: "",
    email: "",
    phone: "",
    leadType: "",
  });

  // ── Busca ──
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);

  const handleToggleSearch = () => {
    if (isSearchOpen) {
      setIsSearchOpen(false);
      setSearchQuery("");
      onSearchChange?.("");
    } else {
      setIsSearchOpen(true);
      setTimeout(() => searchInputRef.current?.focus(), 50);
    }
  };

  const handleSearchInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    onSearchChange?.(e.target.value);
  };

  // Resetar busca ao trocar de conversa
  useEffect(() => {
    setIsSearchOpen(false);
    setSearchQuery("");
    onSearchChange?.("");
  }, [conversation.id]);

  useEffect(() => {
    const fetchLeadByConversationId = async () => {
      const lead = await getLeadByConversationId({ id: conversation.id });

      if (lead) {
        setLeadId(lead.id);
        setFormData({
          name: lead.name ?? "",
          email: lead.email ?? "",
          phone: lead.phone ?? "",
          leadType: lead.leadType ?? "LEAD",
        });
        setDisplayName(lead.name ?? conversation.name);
        setDisplayPhone(lead.phone ?? conversation.phone);
        setDisplayLeadType(lead.leadType ?? "");
        setDisplayProfilePicture(
          lead.profile_picture ?? conversation.profile_picture
        );
      }
    };

    fetchLeadByConversationId();
  }, [conversation]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!leadId) return;

    setIsSaving(true);
    try {
      await updateLead({ id: leadId, data: formData });

      setDisplayName(formData.name);
      setDisplayPhone(formData.phone);
      setDisplayLeadType(formData.leadType);

      onLeadUpdate?.(conversation.id, {
        name: formData.name,
        phone: formData.phone,
      });

      setIsModalOpen(false);
    } catch (error) {
      console.error("Erro ao salvar lead:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!onDeleteConversation) return;
    setIsDeleting(true);
    try {
      await onDeleteConversation(conversation.id);
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  return (
    <>
      <div className="bg-card dark:bg-slate-900 border-b border-border dark:border-slate-800 px-4 py-3 flex items-center justify-between gap-2">
        {/* Lado esquerdo */}
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <button
            onClick={onBack}
            className="md:hidden p-2 text-muted-foreground hover:text-foreground hover:bg-accent dark:hover:bg-slate-800 rounded-full transition-colors flex-shrink-0"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <HeaderAvatar
            name={displayName}
            profilePicture={displayProfilePicture}
          />

          {/* Info — esconde quando a busca está aberta em telas pequenas */}
          <div
            className={`flex flex-col gap-0.5 min-w-0 transition-all duration-300 ${
              isSearchOpen ? "hidden sm:flex" : "flex"
            }`}
          >
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-foreground dark:text-slate-100 leading-tight truncate">
                {displayName}
              </h3>
              <LeadTypeBadge type={displayLeadType} />
            </div>

            <div className="h-4 flex items-center">
              {isAiTyping ? (
                <div className="flex items-center gap-1.5 animate-in fade-in duration-300">
                  <span className="text-xs text-purple-500 dark:text-purple-400 font-medium">
                    IA digitando
                  </span>
                  <div className="flex gap-0.5 items-center">
                    <span className="w-1 h-1 bg-purple-500 dark:bg-purple-400 rounded-full animate-bounce [animation-delay:0ms]" />
                    <span className="w-1 h-1 bg-purple-500 dark:bg-purple-400 rounded-full animate-bounce [animation-delay:150ms]" />
                    <span className="w-1 h-1 bg-purple-500 dark:bg-purple-400 rounded-full animate-bounce [animation-delay:300ms]" />
                  </div>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground dark:text-slate-400">
                  {displayPhone}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Lado direito */}
        <div className="flex items-center gap-1 flex-shrink-0">
          {/* Barra de busca expansível */}
          <div
            className={`flex items-center overflow-hidden transition-all duration-300 ease-in-out ${
              isSearchOpen
                ? "w-40 sm:w-56 md:w-72 opacity-100"
                : "w-0 opacity-0"
            }`}
          >
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={handleSearchInput}
              placeholder="Buscar mensagens..."
              className="w-full px-3 py-1.5 text-sm bg-muted/60 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all placeholder:text-muted-foreground"
              onKeyDown={(e) => e.key === "Escape" && handleToggleSearch()}
            />
          </div>

          {/* Botão lupa / fechar busca */}
          <button
            onClick={handleToggleSearch}
            className={`p-2 rounded-full transition-all duration-200 ${
              isSearchOpen
                ? "text-primary bg-primary/10 hover:bg-primary/20"
                : "text-muted-foreground hover:text-foreground hover:bg-accent dark:hover:bg-slate-800"
            }`}
            title={isSearchOpen ? "Fechar busca" : "Buscar mensagens"}
          >
            {isSearchOpen ? (
              <X className="w-4 h-4" />
            ) : (
              <Search className="w-4 h-4" />
            )}
          </button>

          {/* Botão editar lead */}
          <button
            onClick={() => setIsModalOpen(true)}
            className="p-2 rounded-full text-muted-foreground hover:text-foreground hover:bg-accent dark:hover:bg-slate-800 transition-colors"
            title="Editar lead"
          >
            <Pencil className="w-4 h-4" />
          </button>

          {/* Botão deletar conversa */}
          {!showDeleteConfirm ? (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="p-2 rounded-full text-muted-foreground hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
              title="Apagar conversa"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          ) : (
            <div className="flex items-center gap-1 animate-in fade-in duration-200">
              <span className="text-xs text-muted-foreground whitespace-nowrap">
                Apagar?
              </span>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="px-2 py-1 text-xs font-medium bg-red-500 hover:bg-red-600 text-white rounded-md transition-colors disabled:opacity-50"
              >
                {isDeleting ? "..." : "Sim"}
              </button>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-2 py-1 text-xs font-medium bg-muted hover:bg-accent text-foreground rounded-md transition-colors"
              >
                Não
              </button>
            </div>
          )}
        </div>
      </div>

      <LeadModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSave}
        formData={formData}
        setFormData={setFormData}
        mode="edit"
        isSaving={isSaving}
      />
    </>
  );
};

export default ChatHeader;
