import { memo, useMemo, useCallback } from "react";
import { Check, CheckCheck, Bot, Sparkles } from "lucide-react";
import { Message } from "./types";
import {
  ImageBubble,
  VideoBubble,
  AudioBubble,
  DocumentBubble,
  StickerBubble,
} from "./media";

interface MessageBubbleProps {
  message: Message;
  onMediaClick?: (type: "image" | "video" | "sticker", src: string) => void;
  highlightQuery?: string;
}

// Função utilitária para processar base64
const getMediaSrc = (data: string, mimeType: string): string => {
  return data.startsWith("data:") ? data : `data:${mimeType};base64,${data}`;
};

// Mapeamento de tipos MIME
const MIME_TYPES = {
  image: "image/jpeg",
  video: "video/mp4",
  sticker: "image/webp",
} as const;

// Highlight de texto
const highlightText = (text: string, query: string): React.ReactNode => {
  if (!query.trim()) return text;
  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const parts = text.split(new RegExp(`(${escaped})`, "gi"));
  return parts.map((part, i) =>
    part.toLowerCase() === query.toLowerCase() ? (
      <mark
        key={i}
        className="bg-yellow-300 dark:bg-yellow-500/40 text-foreground rounded-sm px-0.5 not-italic"
      >
        {part}
      </mark>
    ) : (
      part
    )
  );
};

const MessageBubble = memo(
  ({ message, onMediaClick, highlightQuery = "" }: MessageBubbleProps) => {
    const {
      content,
      text,
      sent,
      time,
      read,
      hasAttachment,
      attachmentType,
      attachmentData,
      senderType,
    } = message;

    const isIA = useMemo(() => senderType === "IA", [senderType]);
    const isSentByMeOrIA = useMemo(() => sent || isIA, [sent, isIA]);
    const messageText = useMemo(() => content || text, [content, text]);

    const createMediaHandler = useCallback(
      (type: "image" | "video" | "sticker") => () => {
        if (attachmentData && onMediaClick) {
          const src = getMediaSrc(attachmentData, MIME_TYPES[type]);
          onMediaClick(type, src);
        }
      },
      [attachmentData, onMediaClick]
    );

    const handleImageClick = useMemo(
      () => createMediaHandler("image"),
      [createMediaHandler]
    );
    const handleVideoClick = useMemo(
      () => createMediaHandler("video"),
      [createMediaHandler]
    );
    const handleStickerClick = useMemo(
      () => createMediaHandler("sticker"),
      [createMediaHandler]
    );

    if (hasAttachment && attachmentType) {
      const mediaComponents = {
        imageMessage: (
          <ImageBubble message={message} onClick={handleImageClick} />
        ),
        videoMessage: (
          <VideoBubble message={message} onClick={handleVideoClick} />
        ),
        audioMessage: <AudioBubble message={message} />,
        documentMessage: <DocumentBubble message={message} />,
        stickerMessage: (
          <StickerBubble message={message} onClick={handleStickerClick} />
        ),
      };

      return mediaComponents[attachmentType] || null;
    }

    const bubbleBaseClasses =
      "relative group max-w-xs lg:max-w-md xl:max-w-lg px-4 py-2.5 rounded-2xl shadow-sm transition-all duration-300 ease-out";

    const bubbleVariantClasses = isSentByMeOrIA
      ? isIA
        ? "bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-950/30 dark:to-indigo-950/30 text-foreground border border-purple-200/50 dark:border-purple-700/30 rounded-br-md hover:shadow-md hover:scale-[1.02]"
        : "bg-gradient-to-br from-green-600 to-green-700 dark:from-green-600 dark:to-green-700 text-white rounded-br-md hover:shadow-lg hover:shadow-green-500/25 hover:scale-[1.02]"
      : "bg-white dark:bg-slate-800 text-foreground border border-zinc-200 dark:border-slate-700 rounded-bl-md hover:shadow-md hover:border-zinc-300 dark:hover:border-slate-600";

    const timeClasses = isSentByMeOrIA
      ? isIA
        ? "text-purple-600/70 dark:text-purple-400/70"
        : "text-white/70"
      : "text-zinc-500 dark:text-slate-400";

    // Se há busca ativa, destacar a bolha visualmente
    const isHighlighted =
      highlightQuery.trim() &&
      (messageText || "").toLowerCase().includes(highlightQuery.toLowerCase());

    return (
      <div
        className={`flex mb-1 animate-in slide-in-from-bottom-2 fade-in duration-300 ${
          isSentByMeOrIA ? "justify-end" : "justify-start"
        }`}
      >
        <div
          className={`
            ${bubbleBaseClasses} ${bubbleVariantClasses}
            ${
              isHighlighted
                ? "ring-2 ring-yellow-400/70 dark:ring-yellow-500/50"
                : ""
            }
          `}
        >
          {/* Badge IA */}
          {isIA && (
            <div className="absolute -top-2 -right-2 bg-gradient-to-br from-purple-500 to-indigo-600 border-2 border-white dark:border-zinc-900 rounded-full p-1.5 shadow-lg animate-in zoom-in duration-500">
              <Bot className="w-3.5 h-3.5 text-white" />
              <div className="absolute inset-0 rounded-full bg-purple-400/30" />
            </div>
          )}

          {/* Conteúdo com highlight */}
          <p className="text-[15px] leading-relaxed break-words whitespace-pre-wrap">
            {highlightQuery
              ? highlightText(messageText || "", highlightQuery)
              : messageText}
          </p>

          {/* Footer */}
          <div
            className={`flex items-center justify-end gap-1.5 mt-1.5 text-xs font-medium ${timeClasses}`}
          >
            <time className="tabular-nums">{time}</time>

            {sent && !isIA && (
              <span className="transition-all duration-200">
                {read ? (
                  <CheckCheck className="w-4 h-4 opacity-60" />
                ) : (
                  <CheckCheck className="w-4 h-4 opacity-60" />
                )}
              </span>
            )}

            {isIA && (
              <Sparkles className="w-3 h-3 text-purple-500 dark:text-purple-400 opacity-40" />
            )}
          </div>

          {/* Efeito brilho hover IA */}
          {isIA && (
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-purple-500/0 via-purple-500/5 to-purple-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
          )}
        </div>
      </div>
    );
  }
);

MessageBubble.displayName = "MessageBubble";

export default MessageBubble;
