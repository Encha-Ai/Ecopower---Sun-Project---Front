import { createPortal } from "react-dom";
import { AlertTriangle, Loader2, X } from "lucide-react";

interface DisconnectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isDisconnecting: boolean;
}

const DisconnectModal = ({
  isOpen,
  onClose,
  onConfirm,
  isDisconnecting,
}: DisconnectModalProps) => {
  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl w-full max-w-sm shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-6 text-center">
          <div className="w-12 h-12 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
          </div>
          <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-2">
            Desconectar WhatsApp?
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
            Ao desconectar, você precisará escanear o QR Code novamente para
            reconectar sua conta do WhatsApp. Todas as conversas serão
            preservadas.
          </p>
          <div className="flex justify-center gap-3">
            <button
              onClick={onClose}
              disabled={isDisconnecting}
              className="px-4 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancelar
            </button>
            <button
              onClick={onConfirm}
              disabled={isDisconnecting}
              className="px-6 py-2.5 text-sm font-bold text-white bg-red-600 hover:bg-red-700 rounded-lg shadow-md flex items-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isDisconnecting && <Loader2 className="w-4 h-4 animate-spin" />}
              Sim, desconectar
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
};

export default DisconnectModal;
