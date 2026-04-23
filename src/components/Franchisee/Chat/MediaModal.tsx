import { useEffect, useCallback } from "react";
import { X } from "lucide-react";
import { Dialog, DialogContent, DialogOverlay } from "@/components/ui/dialog";

interface MediaModalProps {
  isOpen: boolean;
  onClose: () => void;
  mediaType: "image" | "video" | "sticker" | null;
  mediaSrc: string | null;
}

const MediaModal = ({ isOpen, onClose, mediaType, mediaSrc }: MediaModalProps) => {
  // Fechar com ESC
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === "Escape") {
      onClose();
    }
  }, [onClose]);

  useEffect(() => {
    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
      return () => document.removeEventListener("keydown", handleKeyDown);
    }
  }, [isOpen, handleKeyDown]);

  if (!mediaSrc || !mediaType) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogOverlay className="bg-black/90" />
      <DialogContent 
        className="max-w-[95vw] max-h-[95vh] p-0 border-none bg-transparent shadow-none flex items-center justify-center"
        onPointerDownOutside={onClose}
      >
        {/* Botão de fechar */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-50 w-10 h-10 rounded-full bg-black/50 hover:bg-black/70 flex items-center justify-center transition-colors"
        >
          <X className="w-6 h-6 text-white" />
        </button>

        {/* Conteúdo da mídia */}
        <div className="flex items-center justify-center w-full h-full">
          {(mediaType === "image" || mediaType === "sticker") && (
            <img
              src={mediaSrc}
              alt="Mídia"
              className="max-w-full max-h-[90vh] object-contain rounded-lg"
            />
          )}
          
          {mediaType === "video" && (
            <video
              src={mediaSrc}
              controls
              autoPlay
              className="max-w-full max-h-[90vh] object-contain rounded-lg"
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MediaModal;
