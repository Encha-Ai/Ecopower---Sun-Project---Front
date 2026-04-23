import { useState, useRef } from "react";
import { X, Image, AlertCircle, Upload, Trash2 } from "lucide-react";

interface LogoEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentLogo: string;
  onSave: (file: File) => Promise<void>;
}

export default function LogoEditModal({
  isOpen,
  onClose,
  currentLogo,
  onSave,
}: LogoEditModalProps) {
  const [preview, setPreview] = useState<string>("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // Normaliza a logo atual para exibição
  const currentLogoSrc = currentLogo
    ? currentLogo.startsWith("data:")
      ? currentLogo
      : `data:image/png;base64,${currentLogo}`
    : "";

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError("");

    // Valida tipo
    if (!file.type.startsWith("image/")) {
      setError("Apenas imagens são permitidas (jpg, png, svg, webp).");
      return;
    }

    // Valida tamanho (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      setError("A imagem deve ter no máximo 2MB.");
      return;
    }

    setSelectedFile(file);

    // Gera preview base64
    const reader = new FileReader();
    reader.onload = () => setPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      // Reutiliza a lógica simulando o change event
      const dt = new DataTransfer();
      dt.items.add(file);
      if (inputRef.current) {
        inputRef.current.files = dt.files;
        inputRef.current.dispatchEvent(new Event("change", { bubbles: true }));
      }
    }
  };

  const handleSave = async () => {
    if (!selectedFile) {
      setError("Selecione uma imagem antes de salvar.");
      return;
    }
    setIsSaving(true);
    try {
      await onSave(selectedFile);
      handleClose();
    } catch {
      setError("Erro ao salvar a logo. Tente novamente.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleClose = () => {
    setPreview("");
    setSelectedFile(null);
    setError("");
    if (inputRef.current) inputRef.current.value = "";
    onClose();
  };

  const displaySrc = preview || currentLogoSrc;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="relative bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200 dark:border-slate-800">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-slate-100 dark:bg-slate-800 rounded-xl flex items-center justify-center">
                <Image className="w-5 h-5 text-slate-600 dark:text-slate-400" />
              </div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                Editar Logo
              </h2>
            </div>
            <button
              onClick={handleClose}
              className="w-8 h-8 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center transition-colors"
            >
              <X className="w-5 h-5 text-slate-500 dark:text-slate-400" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {/* Preview */}
          <div className="flex flex-col items-center gap-2">
            <div className="w-24 h-24 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center border-2 border-slate-200 dark:border-slate-700 overflow-hidden">
              {displaySrc ? (
                <img
                  src={displaySrc}
                  alt="Preview"
                  className="w-full h-full object-cover"
                />
              ) : (
                <Image className="w-10 h-10 text-slate-400 dark:text-slate-600" />
              )}
            </div>
            <p className="text-xs text-slate-400 dark:text-slate-500">
              {preview ? "Nova logo selecionada" : "Logo atual"}
            </p>
          </div>

          {/* Drop Zone */}
          <div
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
            onClick={() => inputRef.current?.click()}
            className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl p-6 flex flex-col items-center gap-3 cursor-pointer hover:border-emerald-400 dark:hover:border-emerald-600 hover:bg-emerald-50/40 dark:hover:bg-emerald-950/20 transition-all"
          >
            <div className="w-10 h-10 bg-slate-100 dark:bg-slate-800 rounded-xl flex items-center justify-center">
              <Upload className="w-5 h-5 text-slate-500 dark:text-slate-400" />
            </div>
            <div className="text-center">
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                Clique para selecionar ou arraste aqui
              </p>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                JPG, PNG, SVG, WEBP — máx. 2MB
              </p>
            </div>
            {selectedFile && (
              <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium truncate max-w-full px-2">
                ✓ {selectedFile.name}
              </p>
            )}
          </div>

          {/* Input oculto */}
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
          />

          {/* Limpar seleção */}
          {selectedFile && (
            <button
              onClick={() => {
                setSelectedFile(null);
                setPreview("");
                if (inputRef.current) inputRef.current.value = "";
              }}
              className="w-full flex items-center justify-center gap-2 text-sm text-red-500 dark:text-red-400 hover:text-red-600 dark:hover:text-red-300 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              Remover seleção
            </button>
          )}

          {/* Erro */}
          {error && (
            <p className="text-sm text-red-600 dark:text-red-400 flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {error}
            </p>
          )}

          {/* Buttons */}
          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={handleClose}
              disabled={isSaving}
              className="flex-1 px-6 py-3 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 bg-transparent hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl font-semibold transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving || !selectedFile}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-emerald-500/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isSaving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  Salvar Logo
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
