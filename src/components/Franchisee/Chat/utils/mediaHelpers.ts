import { Image, Video, Mic, FileText, Smile } from "lucide-react";
import { AttachmentType } from "../types";

// Configuração por tipo de mídia
export const MEDIA_CONFIG: Record<
  string,
  { icon: typeof Image; label: string; prefix: string }
> = {
  imageMessage: { icon: Image, label: "Foto", prefix: "📷" },
  videoMessage: { icon: Video, label: "Vídeo", prefix: "🎥" },
  audioMessage: { icon: Mic, label: "Áudio", prefix: "🎧" },
  documentMessage: { icon: FileText, label: "Documento", prefix: "📄" },
  stickerMessage: { icon: Smile, label: "Figurinha", prefix: "🎭" },
};

// Formatar última mensagem para lista de conversas
export const formatLastMessage = (
  lastMessageType: AttachmentType,
  lastMessage: string | null,
  senderType: "Lead" | "User" | "IA",
): string => {
  const prefix =
    senderType === "User" ? "Você: " : senderType === "IA" ? "IA: " : "";

  if (!lastMessageType) {
    return `${prefix}${lastMessage || ""}`;
  }

  const config = MEDIA_CONFIG[lastMessageType];
  if (!config) {
    return `${prefix}${lastMessage || ""}`;
  }

  return `${prefix}${config.prefix} ${config.label}`;
};

// Converter base64 para URL de imagem/vídeo
export const base64ToMediaSrc = (
  base64: string | null,
  type: "image" | "video" | "audio" = "image",
): string => {
  if (!base64) return "";
  if (base64.startsWith("data:")) return base64;

  const mimeTypes: Record<string, string> = {
    image: "image/jpeg",
    video: "video/mp4",
    audio: "audio/mpeg",
  };

  return `data:${mimeTypes[type]};base64,${base64}`;
};

// Verificar se o tipo de anexo é clicável (abre modal)
export const isClickableMedia = (attachmentType: AttachmentType): boolean => {
  return (
    attachmentType === "imageMessage" ||
    attachmentType === "videoMessage" ||
    attachmentType === "stickerMessage"
  );
};
