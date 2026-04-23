import { Mic } from "lucide-react";
import { Message } from "../types";
import { base64ToMediaSrc } from "../utils/mediaHelpers";

interface AudioBubbleProps {
  message: Message;
}

const AudioBubble = ({ message }: AudioBubbleProps) => {
  const { sent, time, attachmentData } = message;
  
  const audioSrc = base64ToMediaSrc(attachmentData, "audio");

  return (
    <div className={`flex ${sent ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-xs lg:max-w-md rounded-2xl shadow-sm p-3 ${
          sent
            ? "bg-primary text-primary-foreground rounded-br-md"
            : "bg-card text-foreground border border-border rounded-bl-md"
        }`}
      >
        <div className="flex items-center gap-3">
          <div
            className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
              sent ? "bg-primary-foreground/20" : "bg-primary/10"
            }`}
          >
            <Mic className={`w-5 h-5 ${sent ? "text-primary-foreground" : "text-primary"}`} />
          </div>
          <audio
            controls
            src={audioSrc}
            className="max-w-[180px] h-10"
            style={{
              filter: sent ? "invert(1)" : "none",
            }}
          />
        </div>
        <div
          className={`text-right mt-2 text-xs ${
            sent ? "text-primary-foreground/70" : "text-muted-foreground"
          }`}
        >
          {time}
        </div>
      </div>
    </div>
  );
};

export default AudioBubble;
