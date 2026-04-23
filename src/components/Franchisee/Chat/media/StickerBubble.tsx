import { useState } from "react";
import { Smile } from "lucide-react";
import { Message } from "../types";
import { base64ToMediaSrc } from "../utils/mediaHelpers";

interface StickerBubbleProps {
  message: Message;
  onClick: () => void;
}

const StickerBubble = ({ message, onClick }: StickerBubbleProps) => {
  const { sent, time, attachmentData } = message;
  const [hasError, setHasError] = useState(false);
  
  const stickerSrc = base64ToMediaSrc(attachmentData, "image");

  return (
    <div className={`flex ${sent ? "justify-end" : "justify-start"}`}>
      <div className="cursor-pointer transition-transform hover:scale-105" onClick={onClick}>
        {hasError ? (
          <div className="w-32 h-32 flex items-center justify-center bg-muted rounded-lg">
            <Smile className="w-12 h-12 text-muted-foreground" />
          </div>
        ) : (
          <img
            src={stickerSrc}
            alt="Figurinha"
            className="w-32 h-32 object-contain"
            onError={() => setHasError(true)}
          />
        )}
        <div className={`text-xs mt-1 ${sent ? "text-right" : "text-left"} text-muted-foreground`}>
          {time}
        </div>
      </div>
    </div>
  );
};

export default StickerBubble;
