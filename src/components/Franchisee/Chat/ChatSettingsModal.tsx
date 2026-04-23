import { useEffect, useState } from "react";
import {
  X,
  Bot,
  Bell,
  Clock,
  Zap,
  MessageSquare,
  Save,
  Settings,
} from "lucide-react";

interface ChatSettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentProvider?: "evolution" | "official";
  onSave?: (settings: ChatSettings) => void;
  chatSettings?: ChatSettings;
}

export interface ChatSettings {
  id: string;
  aiEnabled: boolean;
  responseDelay: number;
  welcomeMessage: string;
}

const ChatSettingsModal = ({
  open,
  onOpenChange,
  currentProvider,
  onSave,
  chatSettings,
}: ChatSettingsModalProps) => {
  const [settings, setSettings] = useState<ChatSettings>({
    id: chatSettings?.id || "",
    aiEnabled: chatSettings?.aiEnabled ?? false,
    responseDelay: chatSettings?.responseDelay ?? 0,
    welcomeMessage: chatSettings?.welcomeMessage ?? "",
  });

  useEffect(() => {
    if (chatSettings) {
      setSettings({
        id: chatSettings.id,
        aiEnabled: chatSettings.aiEnabled ?? false,
        responseDelay: chatSettings.responseDelay ?? 0,
        welcomeMessage: chatSettings.welcomeMessage ?? "",
      });
    }
  }, [chatSettings]);

  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Simula uma chamada de API
      await new Promise((resolve) => setTimeout(resolve, 1000));
      onSave?.(settings);
      onOpenChange(false);
    } finally {
      setIsSaving(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={() => onOpenChange(false)}
      />

      {/* Modal */}
      <div className="relative bg-white dark:bg-gray-900 rounded-lg shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto m-4 animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-6 py-4 z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <Settings className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  Configurações do Chat
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Personalize o comportamento do WhatsApp
                </p>
              </div>
            </div>
            <button
              onClick={() => onOpenChange(false)}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-6 space-y-6">
          {/* Provedor Atual */}
          <div className="bg-gradient-to-r from-green-50 to-teal-50 dark:from-green-950 dark:to-teal-950 p-4 rounded-lg border border-green-200 dark:border-green-800">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 rounded-full text-sm font-medium">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                Conectado
              </div>
            </div>
          </div>

          <div className="border-t border-gray-200 dark:border-gray-800" />

          {/* IA e Automação */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Bot className="w-5 h-5 text-green-600 dark:text-green-400" />
              <h3 className="font-semibold text-gray-900 dark:text-white">
                Inteligência Artificial
              </h3>
            </div>

            <div className="space-y-4 pl-7">
              {/* AI Enabled */}
              <div className="flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors">
                <div>
                  <label className="font-medium text-gray-900 dark:text-white cursor-pointer">
                    Habilitar IA
                  </label>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    A conversa começa com a IA ativada para novas conversas.
                  </p>
                </div>
                <button
                  onClick={() =>
                    setSettings({ ...settings, aiEnabled: !settings.aiEnabled })
                  }
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    settings.aiEnabled
                      ? "bg-green-600"
                      : "bg-gray-300 dark:bg-gray-600"
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      settings.aiEnabled ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-200 dark:border-gray-800" />

          {/* Outras seções comentadas permanecem iguais */}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-end gap-3">
          <button
            onClick={() => onOpenChange(false)}
            disabled={isSaving}
            className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <X className="w-4 h-4" />
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isSaving ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Salvar Configurações
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatSettingsModal;
