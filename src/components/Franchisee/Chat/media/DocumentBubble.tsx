import { FileText, Download } from "lucide-react";
import { Message } from "../types";

interface DocumentBubbleProps {
  message: Message;
}

const DocumentBubble = ({ message }: DocumentBubbleProps) => {
  const { sent, time, attachmentData, fileName, fileMime } = message as any;

  const handleDownload = () => {
    if (!attachmentData) return;

    // Garante que temos um data URL válido
    const dataUrl = attachmentData.startsWith("data:")
      ? attachmentData
      : `data:${fileMime || "application/pdf"};base64,${attachmentData}`;

    const link = document.createElement("a");
    link.href = dataUrl;
    link.download = message.content || fileName || "documento.pdf";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const displayName = message.content || fileName || "Documento";

  return (
    <div className={`flex ${sent ? "justify-end" : "justify-start"}`}>
      <div
        onClick={handleDownload}
        className={`max-w-xs lg:max-w-md rounded-2xl shadow-sm p-4 cursor-pointer hover:opacity-90 active:scale-95 transition-all ${
          sent
            ? "bg-primary text-primary-foreground rounded-br-md"
            : "bg-card text-foreground border border-border rounded-bl-md"
        }`}
      >
        <div className="flex items-center gap-3">
          <div
            className={`w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 ${
              sent ? "bg-primary-foreground/20" : "bg-primary/10"
            }`}
          >
            <FileText
              className={`w-6 h-6 ${sent ? "text-primary-foreground" : "text-primary"}`}
            />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm truncate" title={displayName}>
              {displayName}
            </p>
            <p
              className={`text-xs ${sent ? "text-primary-foreground/70" : "text-muted-foreground"}`}
            >
              {attachmentData ? "Toque para baixar" : "Arquivo indisponível"}
            </p>
          </div>
          <Download
            className={`w-5 h-5 flex-shrink-0 ${
              attachmentData
                ? sent
                  ? "text-primary-foreground/70"
                  : "text-muted-foreground"
                : "opacity-30"
            }`}
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

export default DocumentBubble;
