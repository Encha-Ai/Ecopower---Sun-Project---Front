import { useState } from "react";
import { Bot, BotOff, Image, Video, Mic, FileText, Smile } from "lucide-react";
import { Conversation, AttachmentType } from "./types";

interface ConversationItemProps {
  conversation: Conversation;
  isSelected: boolean;
  onClick: () => void;
  isAnimating?: boolean;
  isAiTyping?: boolean;
  onToggleAi?: (conversationId: string) => Promise<void>;
}

const MEDIA_ICONS: Record<string, { icon: typeof Image; label: string }> = {
  imageMessage: { icon: Image, label: "Foto" },
  videoMessage: { icon: Video, label: "Vídeo" },
  audioMessage: { icon: Mic, label: "Áudio" },
  documentMessage: { icon: FileText, label: "Documento" },
  stickerMessage: { icon: Smile, label: "Figurinha" },
};

const formatLastMessageTime = (dateString: string): string => {
  const messageDate = new Date(dateString);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (messageDate.toDateString() === today.toDateString()) {
    return messageDate.toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  if (messageDate.toDateString() === yesterday.toDateString()) {
    return "Ontem";
  }

  const daysDiff = Math.floor(
    (today.getTime() - messageDate.getTime()) / (1000 * 60 * 60 * 24),
  );

  if (daysDiff < 7) {
    const days = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
    return days[messageDate.getDay()];
  }

  return messageDate.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
  });
};

const getInitials = (name: string): string =>
  name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

const ConversationAvatar = ({
  name,
  profilePicture,
  isSelected,
}: {
  name: string;
  profilePicture?: string | null;
  isSelected: boolean;
}) => {
  const [imgError, setImgError] = useState(false);

  if (profilePicture && !imgError) {
    return (
      <img
        src={profilePicture}
        alt={name}
        onError={() => setImgError(true)}
        className={`
          w-12 h-12 rounded-full object-cover flex-shrink-0
          transition-all duration-300
          ${
            isSelected
              ? "shadow-lg shadow-green-500/20 scale-105 ring-2 ring-green-500"
              : "ring-1 ring-green-500/20 group-hover:ring-2 group-hover:ring-green-500/40"
          }
        `}
      />
    );
  }

  return (
    <div
      className={`
        w-12 h-12 rounded-full flex-shrink-0
        flex items-center justify-center
        transition-all duration-300
        ${
          isSelected
            ? "bg-gradient-to-br from-green-500 to-green-600 text-white shadow-lg shadow-green-500/20 scale-105"
            : "bg-green-500/10 dark:bg-green-900/20 ring-1 ring-green-500/20 group-hover:ring-2 group-hover:ring-green-500/40"
        }
      `}
    >
      <span
        className={`font-bold text-sm ${
          isSelected ? "text-white" : "text-green-600 dark:text-green-400"
        }`}
      >
        {getInitials(name)}
      </span>
    </div>
  );
};

const LastMessageDisplay = ({
  lastMessage,
  lastMessageType,
  senderType,
  isSelected,
}: {
  lastMessage: string | null;
  lastMessageType: AttachmentType;
  senderType: "Lead" | "User" | "IA";
  isSelected: boolean;
}) => {
  const isOwnMessage = senderType === "User" || senderType === "IA";
  const senderLabel =
    senderType === "IA" ? "IA: " : senderType === "User" ? "Você: " : "";

  const textClass = isSelected
    ? "text-green-700/80 dark:text-green-300/80"
    : "text-muted-foreground/80";

  if (lastMessageType && MEDIA_ICONS[lastMessageType]) {
    const { icon: Icon, label } = MEDIA_ICONS[lastMessageType];

    return (
      <div
        className={`text-sm truncate leading-snug flex items-center gap-1.5 ${textClass}`}
      >
        {isOwnMessage && (
          <span
            className={`font-medium flex-shrink-0 ${
              isSelected ? "text-green-600 dark:text-green-400" : "text-primary"
            }`}
          >
            {senderLabel}
          </span>
        )}
        <Icon className="w-3.5 h-3.5 flex-shrink-0 opacity-70" />
        <span className="truncate">{lastMessage || label}</span>
      </div>
    );
  }

  return (
    <p className={`text-sm truncate leading-snug ${textClass}`}>
      {isOwnMessage && (
        <span
          className={`font-medium ${
            isSelected ? "text-green-600 dark:text-green-400" : "text-primary"
          }`}
        >
          {senderLabel}
        </span>
      )}
      {lastMessage || ""}
    </p>
  );
};

const AITypingIndicator = () => (
  <div className="flex items-center gap-1.5 animate-in fade-in duration-300">
    <span className="text-xs text-purple-500 dark:text-purple-400 font-medium">
      IA digitando
    </span>
    <span className="w-1.5 h-1.5 bg-purple-400 dark:bg-purple-500 rounded-full animate-bounce [animation-delay:0ms]" />
    <span className="w-1.5 h-1.5 bg-purple-400 dark:bg-purple-500 rounded-full animate-bounce [animation-delay:150ms]" />
    <span className="w-1.5 h-1.5 bg-purple-400 dark:bg-purple-500 rounded-full animate-bounce [animation-delay:300ms]" />
  </div>
);

const AIToggle = ({
  aiEnabled,
  isUpdating,
  isAiTyping,
  onToggle,
}: {
  aiEnabled: boolean;
  isUpdating: boolean;
  isAiTyping: boolean;
  onToggle: (e: React.MouseEvent) => void;
}) => {
  const disabled = isUpdating || isAiTyping;

  return (
    <button
      onClick={onToggle}
      disabled={disabled}
      title={
        isAiTyping
          ? "IA digitando..."
          : aiEnabled
            ? "IA Ativa - Clique para desativar"
            : "IA Inativa - Clique para ativar"
      }
      className={`
        flex-shrink-0 p-1.5 rounded-md
        transition-all duration-200
        ${
          aiEnabled
            ? "bg-green-500/15 text-green-600 hover:bg-green-500/25 dark:bg-green-900/30 dark:text-green-400 dark:hover:bg-green-900/50"
            : "bg-muted text-muted-foreground hover:bg-muted/80 dark:bg-slate-800 dark:text-slate-400"
        }
        ${
          disabled
            ? "opacity-50 cursor-not-allowed"
            : "cursor-pointer hover:scale-105 active:scale-95"
        }
      `}
      aria-label={aiEnabled ? "Desativar IA" : "Ativar IA"}
    >
      {aiEnabled ? <Bot className="w-4 h-4" /> : <BotOff className="w-4 h-4" />}
    </button>
  );
};

const ConversationItem = ({
  conversation,
  isSelected,
  onClick,
  isAnimating = false,
  isAiTyping = false,
  onToggleAi,
}: ConversationItemProps) => {
  const {
    name,
    profile_picture,
    lastMessage,
    lastMessageAt,
    ai_enabled,
    senderType,
    lastMessageType,
  } = conversation;

  const aiTyping = isAiTyping || conversation.ai_typing;

  const [isUpdating, setIsUpdating] = useState(false);

  const handleToggleAI = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!onToggleAi) return;
    setIsUpdating(true);
    try {
      await onToggleAi(conversation.id);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div
      onClick={onClick}
      className={`
        group relative flex items-center gap-3 px-4 py-3.5 cursor-pointer
        border-b border-border/40 dark:border-slate-800/60
        transition-all duration-300 ease-in-out
        ${
          isSelected
            ? "bg-gradient-to-r from-green-500/10 via-green-500/5 to-transparent dark:from-green-500/20 dark:via-green-500/10 shadow-[inset_4px_0_0_0_#22c55e] dark:shadow-[inset_4px_0_0_0_#22c55e]"
            : "hover:bg-green-500/[0.03] dark:hover:bg-green-500/[0.05] border-l-4 border-l-transparent hover:border-l-green-500/30"
        }
        ${
          isAnimating
            ? "animate-in fade-in slide-in-from-top-2 duration-300"
            : ""
        }
      `}
    >
      <ConversationAvatar
        name={name}
        profilePicture={profile_picture}
        isSelected={isSelected}
      />

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2 mb-1">
          <h3
            className={`font-semibold text-sm truncate transition-colors duration-300 ${
              isSelected
                ? "text-green-700 dark:text-green-400"
                : "text-foreground"
            }`}
          >
            {name}
          </h3>
          <span
            className={`text-xs flex-shrink-0 tabular-nums transition-colors duration-300 ${
              isSelected
                ? "text-green-600/70 dark:text-green-400/70"
                : "text-muted-foreground/70"
            }`}
          >
            {formatLastMessageTime(lastMessageAt)}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex-1 min-w-0">
            {aiTyping ? (
              <AITypingIndicator />
            ) : (
              <LastMessageDisplay
                lastMessage={lastMessage}
                lastMessageType={lastMessageType}
                senderType={senderType}
                isSelected={isSelected}
              />
            )}
          </div>

          <AIToggle
            aiEnabled={ai_enabled}
            isUpdating={isUpdating}
            isAiTyping={aiTyping}
            onToggle={handleToggleAI}
          />
        </div>
      </div>
    </div>
  );
};

export default ConversationItem;
