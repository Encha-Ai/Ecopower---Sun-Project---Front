import { useState } from "react";
import { Play, VideoOff } from "lucide-react";
import { Message } from "../types";
import { base64ToMediaSrc } from "../utils/mediaHelpers";

interface VideoBubbleProps {
  message: Message;
  onClick: () => void;
}

const VideoBubble = ({ message, onClick }: VideoBubbleProps) => {
  const { sent, time, attachmentData } = message;
  const [hasError, setHasError] = useState(false);
  
  const videoSrc = base64ToMediaSrc(attachmentData, "video");

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
        <div className="relative">
          {hasError ? (
            <div className="w-48 h-48 flex items-center justify-center bg-muted">
              <VideoOff className="w-12 h-12 text-muted-foreground" />
            </div>
          ) : (
            <>
              <video
                src={videoSrc}
                className="w-full max-w-[240px] max-h-[320px] object-cover"
                onError={() => setHasError(true)}
              />
              {/* Play overlay */}
              <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                <div className="w-14 h-14 rounded-full bg-white/90 flex items-center justify-center shadow-lg">
                  <Play className="w-7 h-7 text-primary fill-primary ml-1" />
                </div>
              </div>
            </>
          )}
        </div>
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

export default VideoBubble;
