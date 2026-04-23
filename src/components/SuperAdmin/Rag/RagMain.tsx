import { useState, useRef, useEffect, useMemo } from "react";
import * as ragMainController from "@/controllers/superAdmin/RagController";
import {
  Upload,
  FileText,
  Trash2,
  Search,
  Loader2,
  Calendar,
  ArrowUpDown,
  Filter,
  X,
  Globe,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface RagFile {
  id: string;
  name: string;
  description: string;
  uploadDate: string;
  size: string;
  status: "INDEXED" | "PROCESSING" | "ERROR";
}

const parseSize = (sizeStr: string) => {
  return parseFloat(sizeStr.replace(" MB", "").replace(",", "."));
};

const formatFileSize = (bytes: number) => {
  if (!bytes || bytes === 0) return "0 KB";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
};

export const RagMain = () => {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [files, setFiles] = useState<RagFile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterDate, setFilterDate] = useState("");
  const [sortBy, setSortBy] = useState<
    "DATE_DESC" | "DATE_ASC" | "SIZE_DESC" | "SIZE_ASC" | "NAME"
  >("DATE_DESC");
  const [isUploading, setIsUploading] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileDescription, setFileDescription] = useState("");

  useEffect(() => {
    const fetchRagMain = async () => {
      try {
        setIsLoading(true);
        const data = await ragMainController.listRagMain();
        if (Array.isArray(data) && data.length > 0) {
          const formattedFiles: RagFile[] = data.map((item: any) => ({
            id: item.id,
            name: item.file_name,
            description: item.description,
            uploadDate: item.create_at,
            size: formatFileSize(item.file_size),
            status: "INDEXED",
          }));
          setFiles(formattedFiles);
        } else {
          setFiles([]);
        }
      } catch (error) {
        console.error("Erro ao buscar arquivos RAG:", error);
        toast({
          title: "Erro ao carregar arquivos",
          description:
            "Não foi possível carregar os arquivos da base de conhecimento.",
          variant: "destructive",
        });
        setFiles([]);
      } finally {
        setIsLoading(false);
      }
    };
    fetchRagMain();
  }, []);

  const processedFiles = useMemo(() => {
    return files
      .filter((file) => {
        const matchesName = file.name
          .toLowerCase()
          .includes(searchTerm.toLowerCase());
        const matchesDate = filterDate
          ? file.uploadDate.startsWith(filterDate)
          : true;
        return matchesName && matchesDate;
      })
      .sort((a, b) => {
        switch (sortBy) {
          case "DATE_DESC":
            return (
              new Date(b.uploadDate).getTime() -
              new Date(a.uploadDate).getTime()
            );
          case "DATE_ASC":
            return (
              new Date(a.uploadDate).getTime() -
              new Date(b.uploadDate).getTime()
            );
          case "SIZE_DESC":
            return parseSize(b.size) - parseSize(a.size);
          case "SIZE_ASC":
            return parseSize(a.size) - parseSize(b.size);
          case "NAME":
            return a.name.localeCompare(b.name);
          default:
            return 0;
        }
      });
  }, [files, searchTerm, filterDate, sortBy]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type !== "application/pdf") {
      toast({
        title: "Formato Inválido",
        description: "Apenas arquivos PDF são permitidos.",
        variant: "destructive",
      });
      return;
    }
    setSelectedFile(file);
    setIsUploadModalOpen(true);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleConfirmUpload = async () => {
    try {
      if (!selectedFile) return;
      if (!fileDescription.trim()) {
        toast({
          title: "Descrição obrigatória",
          description: "Por favor, adicione uma descrição para o arquivo.",
          variant: "destructive",
        });
        return;
      }
      setIsUploading(true);
      setIsUploadModalOpen(false);

      const tempId = Math.random().toString();
      const newFile: RagFile = {
        id: tempId,
        name: selectedFile.name,
        description: fileDescription.trim() || "Sem descrição",
        uploadDate: new Date().toISOString(),
        size: formatFileSize(selectedFile.size),
        status: "PROCESSING",
      };

      setFiles((prev) => [newFile, ...prev]);

      const data = {
        file: selectedFile,
        description: fileDescription,
      };

      await ragMainController.uploadRagMain({ data });

      toast({
        title: "Upload Concluído",
        description: "O arquivo foi enviado e está sendo processado.",
        variant: "sucess",
      });

      const updatedData = await ragMainController.listRagMain();
      if (Array.isArray(updatedData)) {
        const formattedFiles: RagFile[] = updatedData.map((item: any) => ({
          id: item.id,
          name: item.file_name,
          description: item.description,
          uploadDate: item.create_at,
          size: formatFileSize(item.file_size),
          status: "INDEXED",
        }));
        setFiles(formattedFiles);
      }
    } catch (error) {
      console.error("Erro ao fazer upload do arquivo:", error);
      toast({
        title: "Erro no Upload",
        description: "O arquivo não pôde ser processado.",
        variant: "destructive",
      });
      setFiles((prev) => prev.filter((f) => f.status !== "PROCESSING"));
    } finally {
      setIsUploading(false);
      setSelectedFile(null);
      setFileDescription("");
    }
  };

  const handleCancelUpload = () => {
    setIsUploadModalOpen(false);
    setSelectedFile(null);
    setFileDescription("");
  };

  const handleDelete = async (id: string) => {
    try {
      await ragMainController.deleteRagMain({ id });
      setFiles((prev) => prev.filter((f) => f.id !== id));
      toast({
        title: "Arquivo Removido",
        description: "O arquivo foi deletado com sucesso.",
        variant: "sucess",
      });
    } catch (error) {
      toast({
        title: "Erro ao deletar",
        description: "Não foi possível remover o arquivo.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-4">
      {/* CABEÇALHO */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-green-600 rounded-xl shadow-lg shadow-green-100 dark:shadow-none">
            <Globe className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-800 dark:text-white">
              Base de Conhecimento Geral
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Gestão de documentos globais para todas as concessionárias
            </p>
          </div>
        </div>

        <div className="px-4 py-2 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 rounded-xl border border-green-100 dark:border-green-800 text-xs font-bold uppercase tracking-wider">
          Acesso Global
        </div>
      </div>

      {/* ÁREA DE UPLOAD */}
      <div
        className="group relative border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl bg-white dark:bg-slate-900 p-10 text-center hover:border-green-400 dark:hover:border-green-600 hover:bg-green-50/30 dark:hover:bg-green-900/10 transition-all cursor-pointer overflow-hidden"
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          accept="application/pdf"
          onChange={handleFileSelect}
        />
        <div className="relative z-10">
          <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
            {isUploading ? (
              <Loader2 className="w-10 h-10 text-green-600 dark:text-green-400 animate-spin" />
            ) : (
              <Upload className="w-10 h-10 text-green-600 dark:text-green-400" />
            )}
          </div>
          <h3 className="text-xl font-bold text-slate-700 dark:text-white mb-2">
            {isUploading
              ? "Enviando arquivo..."
              : "Upload de PDF para Base Geral"}
          </h3>
          <p className="text-slate-500 dark:text-slate-400 text-sm max-w-md mx-auto">
            {isUploading
              ? "Aguarde enquanto processamos e indexamos seu documento na base global."
              : "Arraste ou clique para selecionar. Estes documentos estarão disponíveis para todas as consultas do RAG."}
          </p>
          <div className="mt-4 flex items-center justify-center gap-4 text-xs font-medium text-slate-400 dark:text-slate-500">
            <span className="flex items-center gap-1">
              <FileText className="w-3 h-3" /> Apenas PDF
            </span>
            <span className="flex items-center gap-1">
              <Filter className="w-3 h-3" /> Máx. 100MB
            </span>
          </div>
        </div>
      </div>

      {/* LISTA DE ARQUIVOS */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
        {/* Filtros e Busca */}
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex flex-col lg:flex-row gap-4 items-center justify-between bg-slate-50/50 dark:bg-slate-800/30">
          <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar na base global..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500 text-slate-700 dark:text-slate-200 transition-all placeholder:text-slate-400"
              />
            </div>
            <div className="relative w-full sm:w-auto">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              <input
                type="date"
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
                className="w-full pl-10 pr-10 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500 text-slate-700 dark:text-slate-200 transition-all"
              />
              {filterDate && (
                <button
                  onClick={() => setFilterDate("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-red-500 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          <div className="flex items-center gap-4 w-full lg:w-auto justify-between lg:justify-end">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-500 hidden sm:inline uppercase tracking-wider">
                Ordenar:
              </span>
              <div className="relative">
                <select
                  value={sortBy}
                  onChange={(e: any) => setSortBy(e.target.value)}
                  className="pl-10 pr-8 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold text-slate-700 dark:text-slate-200 outline-none focus:ring-2 focus:ring-green-500 appearance-none cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700 transition-all"
                >
                  <option value="DATE_DESC">Mais Recentes</option>
                  <option value="DATE_ASC">Mais Antigos</option>
                  <option value="SIZE_DESC">Maior Tamanho</option>
                  <option value="SIZE_ASC">Menor Tamanho</option>
                  <option value="NAME">Nome (A-Z)</option>
                </select>
                <ArrowUpDown className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              </div>
            </div>
            <div className="px-4 py-2 bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-xl border border-green-100 dark:border-green-800 text-xs font-bold">
              {processedFiles.length}{" "}
              {processedFiles.length === 1 ? "Arquivo" : "Arquivos"}
            </div>
          </div>
        </div>

        {/* Tabela */}
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center p-20 space-y-4">
              <Loader2 className="w-10 h-10 text-green-600 dark:text-green-400 animate-spin" />
              <p className="text-slate-500 dark:text-slate-400 font-medium">
                Sincronizando base global...
              </p>
            </div>
          ) : (
            <table className="w-full text-sm text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 font-bold border-b border-slate-200 dark:border-slate-800">
                  <th className="p-5">Documento</th>
                  <th className="p-5">Descrição</th>
                  <th className="p-5">Data de Upload</th>
                  <th className="p-5">Tamanho</th>
                  <th className="p-5">Status</th>
                  <th className="p-5 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {processedFiles.map((file) => (
                  <tr
                    key={file.id}
                    className="group hover:bg-green-50/20 dark:hover:bg-green-900/10 transition-colors"
                  >
                    <td className="p-5">
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-red-50 dark:bg-red-900/20 rounded-xl text-red-600 dark:text-red-400 group-hover:scale-110 transition-transform">
                          <FileText className="w-5 h-5" />
                        </div>
                        <span className="font-semibold text-slate-700 dark:text-slate-200">
                          {file.name}
                        </span>
                      </div>
                    </td>
                    <td className="p-5 text-slate-500 dark:text-slate-400 max-w-xs truncate">
                      {file.description}
                    </td>
                    <td className="p-5 text-slate-500 dark:text-slate-400 font-medium">
                      {new Date(file.uploadDate).toLocaleDateString("pt-BR", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                    <td className="p-5 text-slate-500 dark:text-slate-400 font-medium">
                      {file.size}
                    </td>
                    <td className="p-5">
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ring-1 ring-inset ${
                          file.status === "INDEXED"
                            ? "bg-green-50 text-green-700 ring-green-600/20 dark:bg-green-900/30 dark:text-green-400 dark:ring-green-500/30"
                            : file.status === "PROCESSING"
                              ? "bg-amber-50 text-amber-700 ring-amber-600/20 dark:bg-amber-900/30 dark:text-amber-400"
                              : "bg-red-50 text-red-700 ring-red-600/20 dark:bg-red-900/30 dark:text-red-400"
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full mr-2 ${
                            file.status === "INDEXED"
                              ? "bg-green-600 dark:bg-green-400"
                              : file.status === "PROCESSING"
                                ? "bg-amber-600 dark:bg-amber-400"
                                : "bg-red-600 dark:bg-red-400"
                          }`}
                        />
                        {file.status === "INDEXED"
                          ? "Indexado"
                          : file.status === "PROCESSING"
                            ? "Processando"
                            : "Erro"}
                      </span>
                    </td>
                    <td className="p-5 text-right">
                      <button
                        onClick={() => handleDelete(file.id)}
                        className="p-2.5 text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all"
                        title="Deletar arquivo"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
                {processedFiles.length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-20 text-center">
                      <div className="flex flex-col items-center space-y-3">
                        <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-full">
                          <Search className="w-8 h-8 text-slate-300 dark:text-slate-500" />
                        </div>
                        <p className="text-slate-400 dark:text-slate-500 font-medium">
                          Nenhum documento global encontrado.
                        </p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Modal de Upload com Descrição */}
      {isUploadModalOpen && selectedFile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 dark:bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 border border-slate-200 dark:border-slate-800">
            <div className="bg-slate-900 dark:bg-slate-800 p-6 flex items-center justify-between text-white">
              <div className="flex items-center gap-4">
                <div className="p-2.5 bg-white/10 rounded-xl">
                  <Upload className="w-6 h-6 text-green-400" />
                </div>
                <div>
                  <h3 className="font-bold text-lg">Confirmar Upload Global</h3>
                  <p className="text-xs text-slate-400">
                    Base principal de conhecimento
                  </p>
                </div>
              </div>
              <button
                onClick={handleCancelUpload}
                className="p-2 hover:bg-white/10 rounded-xl transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              <div className="space-y-3">
                <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-700">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                    Arquivo Selecionado
                  </p>
                  <div className="flex items-center gap-3">
                    <FileText className="w-4 h-4 text-red-500" />
                    <p className="text-sm font-bold text-slate-700 dark:text-slate-200 truncate">
                      {selectedFile.name}
                    </p>
                  </div>
                </div>

                <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-2xl border border-green-100 dark:border-green-800">
                  <p className="text-[10px] font-bold text-green-400 uppercase tracking-widest mb-1">
                    Tipo de Base
                  </p>
                  <div className="flex items-center gap-3">
                    <Globe className="w-4 h-4 text-green-600 dark:text-green-400" />
                    <p className="text-sm font-bold text-green-700 dark:text-green-300">
                      Base de Conhecimento Global
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 ml-1">
                  Descrição do Conteúdo <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={fileDescription}
                  onChange={(e) => setFileDescription(e.target.value)}
                  placeholder="Descreva o conteúdo para facilitar a busca da IA..."
                  className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500 resize-none bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 transition-all placeholder:text-slate-400"
                  rows={4}
                  maxLength={200}
                />
              </div>
            </div>

            <div className="p-6 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 flex gap-3">
              <button
                onClick={handleCancelUpload}
                className="flex-1 px-4 py-3 text-sm font-bold text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-2xl transition-all"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmUpload}
                className="flex-[2] px-4 py-3 text-sm font-bold bg-green-600 text-white rounded-2xl hover:bg-green-700 shadow-lg shadow-green-200 dark:shadow-green-900/20 transition-all active:scale-95"
              >
                Iniciar Upload Global
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
