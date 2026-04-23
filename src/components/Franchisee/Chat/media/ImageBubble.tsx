import { useState } from "react";
import { ImageOff } from "lucide-react";
import { Message } from "../types";
import { base64ToMediaSrc } from "../utils/mediaHelpers";

interface ImageBubbleProps {
  message: Message;
  onClick: () => void;
}

const ImageBubble = ({ message, onClick }: ImageBubbleProps) => {
  const { sent, time, attachmentData } = message;
  const [hasError, setHasError] = useState(false);
  
  const imageSrc = base64ToMediaSrc(attachmentData, "image");

  return (
    <div className={`flex ${sent ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-xs lg:max-w-sm rounded-2xl overflow-hidden shadow-sm cursor-pointer transition-transform hover:scale-[1.02] ${
          sent
            ? "bg-primary rounded-br-md"
            : "bg-card border border-border rounded-bl-md"
        }`}
        onClick={onClick}
      >
        {hasError ? (
          <div className="w-48 h-48 flex items-center justify-center bg-muted">
            <ImageOff className="w-12 h-12 text-muted-foreground" />
          </div>
        ) : (
          <img
            src={imageSrc}
            alt="Imagem"
            className="w-full max-w-[240px] max-h-[320px] object-cover"
            onError={() => setHasError(true)}
          />
        )}
        <div
          className={`px-3 py-1.5 text-xs ${
            sent ? "text-primary-foreground/70" : "text-muted-foreground"
          }`}
        >
          {time}
        </div>
      </div>
    </div>
  );
};

export default ImageBubble;
