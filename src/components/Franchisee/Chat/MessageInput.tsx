import { useState, useRef, useEffect } from "react";
import { Smile, Paperclip, Send, X, Mic, Square } from "lucide-react";
import { toast } from "sonner";

interface MessageInputProps {
  onSend: (message: string, files?: File[]) => void;
  disabled?: boolean;
}

const MAX_FILE_SIZE = 3 * 1024 * 1024; // 3MB

const ALLOWED_TYPES: Record<string, boolean> = {
  // Imagens
  "image/jpeg": true,
  "image/png": true,
  "image/gif": true,
  "image/webp": true,
  // Vídeos
  "video/mp4": true,
  "video/webm": true,
  "video/quicktime": true,
  // PDFs
  "application/pdf": true,
};

const emojiCategories = {
  Frequentes: [
    "😀",
    "😂",
    "😍",
    "😎",
    "😭",
    "👍",
    "🔥",
    "❤️",
    "🎉",
    "✨",
    "💯",
    "🙌",
  ],
  Rostos: [
    "😊",
    "😁",
    "😅",
    "🤣",
    "😇",
    "🥰",
    "😘",
    "😋",
    "😜",
    "🤔",
    "😴",
    "🤤",
    "😱",
    "🤯",
    "😡",
    "🤬",
    "😈",
    "👿",
  ],
  Gestos: [
    "👋",
    "🤚",
    "✋",
    "👌",
    "✌️",
    "🤞",
    "🤟",
    "🤘",
    "👈",
    "👉",
    "👆",
    "👇",
    "👍",
    "👎",
    "✊",
    "👊",
    "🤛",
    "🤜",
    "👏",
    "🙌",
    "🤝",
    "🙏",
    "💪",
  ],
  Corações: [
    "❤️",
    "🧡",
    "💛",
    "💚",
    "💙",
    "💜",
    "🖤",
    "🤍",
    "🤎",
    "💔",
    "❣️",
    "💕",
    "💞",
    "💓",
    "💗",
    "💖",
    "💘",
    "💝",
  ],
  Animais: [
    "🐶",
    "🐱",
    "🐭",
    "🐹",
    "🐰",
    "🦊",
    "🐻",
    "🐼",
    "🐨",
    "🐯",
    "🦁",
    "🐮",
    "🐷",
    "🐸",
    "🐵",
    "🐔",
    "🐧",
    "🐦",
    "🦆",
    "🦉",
  ],
  Comida: [
    "🍕",
    "🍔",
    "🍟",
    "🌭",
    "🍿",
    "🧂",
    "🥓",
    "🥚",
    "🍞",
    "🧀",
    "🥗",
    "🍝",
    "🍜",
    "🍲",
    "🍛",
    "🍣",
    "🍱",
    "🍙",
    "🍚",
    "🍘",
  ],
  Objetos: [
    "⚽",
    "🏀",
    "🎮",
    "🎯",
    "🎲",
    "🎨",
    "🎬",
    "🎵",
    "🎸",
    "🎹",
    "🎺",
    "🎻",
    "🥁",
    "📱",
    "💻",
    "⌨️",
    "🖱️",
    "🖨️",
    "📷",
    "📹",
  ],
};

const validateFile = (file: File): { valid: boolean; error?: string } => {
  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `"${file.name}" excede o limite de 3MB`,
    };
  }

  if (!ALLOWED_TYPES[file.type]) {
    return {
      valid: false,
      error: `"${file.name}" não é permitido. Use PDF, imagem ou vídeo.`,
    };
  }

  return { valid: true };
};

// Exibe KB para arquivos menores que 1MB, MB para os demais
const formatFileSize = (bytes: number): string => {
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(0)}KB`;
  }
  return `${(bytes / 1024 / 1024).toFixed(1)}MB`;
};

const MessageInput = ({ onSend, disabled }: MessageInputProps) => {
  const [message, setMessage] = useState("");
  const [showEmojis, setShowEmojis] = useState(false);
  const [activeCategory, setActiveCategory] = useState("Frequentes");
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  // Audio recording states
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [recordingTime, setRecordingTime] = useState(0);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }
    };
  }, []);

  const hasFileOrAudio = selectedFiles.length > 0 || audioBlob !== null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const hasContent = message.trim() || selectedFiles.length > 0 || audioBlob;
    if (!hasContent || disabled) return;

    if (audioBlob) {
      const audioFile = new File([audioBlob], "audio.webm", {
        type: "audio/webm",
      });
      onSend("", [audioFile]);
      setAudioBlob(null);
    } else {
      onSend(message, selectedFiles.length > 0 ? selectedFiles : undefined);
    }

    setMessage("");
    setSelectedFiles([]);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const validFiles: File[] = [];
    const errors: string[] = [];

    files.forEach((file) => {
      const validation = validateFile(file);
      if (validation.valid) {
        validFiles.push(file);
      } else {
        errors.push(validation.error!);
      }
    });

    if (errors.length > 0) {
      errors.forEach((error) => toast.error(error));
    }

    if (validFiles.length > 0) {
      setSelectedFiles((prev) => [...prev, ...validFiles]);
      setMessage("");
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const addEmoji = (emoji: string) => {
    if (!hasFileOrAudio) {
      setMessage((prev) => prev + emoji);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        audioChunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        setAudioBlob(blob);
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);

      recordingTimerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } catch (error) {
      toast.error("Não foi possível acessar o microfone");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }
      setRecordingTime(0);
    }
  };

  const cancelRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stream
        .getTracks()
        .forEach((track) => track.stop());
      setIsRecording(false);
      setAudioBlob(null);
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }
      setRecordingTime(0);
    }
  };

  const removeAudio = () => {
    setAudioBlob(null);
  };

  const formatRecordingTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="bg-card dark:bg-slate-900 border-t border-border dark:border-slate-800 p-4 relative">
      {/* Arquivos selecionados */}
      {selectedFiles.length > 0 && (
        <div className="mb-3 flex flex-wrap gap-2">
          {selectedFiles.map((file, index) => (
            <div
              key={index}
              className="flex items-center gap-2 bg-muted px-3 py-2 rounded-lg text-sm"
            >
              <Paperclip className="w-4 h-4 text-muted-foreground" />
              <span className="text-foreground max-w-[150px] truncate">
                {file.name}
              </span>
              <span className="text-muted-foreground text-xs">
                ({formatFileSize(file.size)})
              </span>
              <button
                type="button"
                onClick={() => removeFile(index)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Audio gravado preview */}
      {audioBlob && !isRecording && (
        <div className="mb-3 flex items-center gap-2 bg-muted px-3 py-2 rounded-lg w-fit">
          <Mic className="w-4 h-4 text-primary" />
          <span className="text-sm text-foreground">Áudio gravado</span>
          <button
            type="button"
            onClick={removeAudio}
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Indicador de gravação */}
      {isRecording && (
        <div className="mb-3 flex items-center gap-3 bg-red-100 dark:bg-red-900/30 px-4 py-2 rounded-lg w-fit">
          <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
          <span className="text-sm text-red-600 dark:text-red-400 font-medium">
            Gravando {formatRecordingTime(recordingTime)}
          </span>
          <button
            type="button"
            onClick={cancelRecording}
            className="text-red-600 hover:text-red-700 dark:text-red-400"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Input de mensagem */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          className="p-2 text-muted-foreground hover:text-foreground hover:bg-accent rounded-full transition-colors"
          onClick={() => setShowEmojis((prev) => !prev)}
          disabled={hasFileOrAudio}
        >
          <Smile className="w-5 h-5" />
        </button>

        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*,video/*,application/pdf"
          onChange={handleFileSelect}
          className="hidden"
          id="file-upload"
        />
        <label htmlFor="file-upload">
          <div
            className={`p-2 rounded-full transition-colors cursor-pointer ${
              isRecording || audioBlob
                ? "opacity-50 cursor-not-allowed text-muted-foreground"
                : "text-muted-foreground hover:text-foreground hover:bg-accent"
            }`}
          >
            <Paperclip className="w-5 h-5" />
          </div>
        </label>

        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          disabled={hasFileOrAudio || isRecording}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSubmit(e);
            }
          }}
          placeholder={
            hasFileOrAudio
              ? "Remova o arquivo para digitar..."
              : isRecording
                ? "Gravando áudio..."
                : "Digite uma mensagem..."
          }
          className={`flex-1 px-4 py-2.5 bg-muted/50 border border-border rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm placeholder:text-muted-foreground outline-none ${
            hasFileOrAudio || isRecording ? "opacity-50 cursor-not-allowed" : ""
          }`}
        />

        {/* Botão de áudio */}
        {!hasFileOrAudio && (
          <button
            type="button"
            onClick={isRecording ? stopRecording : startRecording}
            className={`p-2 rounded-full transition-colors ${
              isRecording
                ? "bg-red-500 text-white hover:bg-red-600"
                : "text-muted-foreground hover:text-foreground hover:bg-accent"
            }`}
          >
            {isRecording ? (
              <Square className="w-5 h-5" />
            ) : (
              <Mic className="w-5 h-5" />
            )}
          </button>
        )}

        <button
          type="button"
          onClick={handleSubmit}
          disabled={
            (!message.trim() && selectedFiles.length === 0 && !audioBlob) ||
            disabled ||
            isRecording
          }
          className="p-2.5 bg-green-600 hover:bg-green-700 dark:bg-green-600 dark:hover:bg-green-500 disabled:bg-muted disabled:text-muted-foreground text-white rounded-full transition-all shadow-sm hover:shadow disabled:cursor-not-allowed"
        >
          <Send className="w-5 h-5" />
        </button>
      </div>

      {/* Menu de emojis */}
      {showEmojis && !hasFileOrAudio && (
        <div className="absolute bottom-20 left-4 right-4 md:left-4 md:right-auto md:w-80 bg-card border border-border rounded-xl shadow-xl z-50 overflow-hidden">
          <div className="flex gap-1 p-2 border-b border-border overflow-x-auto bg-muted/20">
            {Object.keys(emojiCategories).map((category) => (
              <button
                key={category}
                onClick={() => setActiveCategory(category)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                  activeCategory === category
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-accent text-muted-foreground"
                }`}
              >
                {category}
              </button>
            ))}
          </div>

          <div className="p-3 h-56 overflow-y-auto">
            <div className="grid grid-cols-6 gap-1">
              {emojiCategories[
                activeCategory as keyof typeof emojiCategories
              ].map((emoji, index) => (
                <button
                  key={`${emoji}-${index}`}
                  type="button"
                  onClick={() => addEmoji(emoji)}
                  className="text-2xl hover:bg-accent rounded-lg p-2 transition-all hover:scale-110 active:scale-95"
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MessageInput;
