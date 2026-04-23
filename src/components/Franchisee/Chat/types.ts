// Tipos de anexo suportados
export type AttachmentType =
  | "imageMessage"
  | "videoMessage"
  | "audioMessage"
  | "documentMessage"
  | "stickerMessage"
  | null;

export interface Conversation {
  id: string;
  name: string;
  phone: string;
  profile_picture?: string | null;
  ai_enabled: boolean;
  ai_typing: boolean;
  lastMessage: string | null;
  senderType: "Lead" | "User" | "IA";
  lastMessageAt: string;
  lastMessageType: AttachmentType;
  formattedLastMessage: string | null;
}

export interface Message {
  id: number | string;
  content: string | null;
  text?: string; // backwards compatibility
  senderType: "Lead" | "User" | "IA";
  sent: boolean;
  time: string;
  read: boolean;
  hasAttachment: boolean;
  attachmentType: AttachmentType;
  attachmentData: string | null;
}

export interface WebSocketMessagePayload {
  messageId: string;
  conversationId: string;
  ai_enabled: boolean;
  content: string | null;
  hasAttachment: boolean;
  attachmentType: AttachmentType;
  attachmentData: string | null;
  senderType: "Lead" | "User" | "IA";
  updatedAt: string;
  leadDTO?: { name: string; phone: string; profile_picture?: string | null };
}

export type ConnectionProvider = "official" | "evolution";

export type ConnectionStatus =
  | "loading"
  | "selecting"
  | "connecting"
  | "connected";

export interface ConnectionState {
  state: {
    status: string | null;
    error: string | null;
    response: string | null;
    instance: {
      instanceName: string;
      state: "open" | "connecting" | "close";
    };
    closed: boolean;
    connecting: boolean;
    notFound: boolean;
    open: boolean;
  };
  qrCode: {
    base64: string;
    pairingCode: string | null;
  } | null;
}
