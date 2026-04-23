import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  Bot,
  Building2,
  Edit,
  Save,
  X,
  Plus,
  Trash2,
  Loader2,
  Sparkles,
  Globe,
  RefreshCw,
  Info,
  CheckCircle2,
  ArrowRight,
  LayoutGrid,
  Settings2,
  History,
  ChevronLeft,
  Search,
  ArrowLeft,
  Zap,
  MessageSquare,
  Upload,
  FileText,
  Calendar,
  ArrowUpDown,
  Filter,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import * as promptAiController from "@/controllers/superAdmin/PromptAiController";
import * as ragController from "@/controllers/superAdmin/RagController";
import { getAllFranchisee } from "@/controllers/superAdmin/FranchiseeController";
import ChatTester from "@/components/SuperAdmin/ChatTester";
import { cn } from "@/lib/utils";

// --- Interfaces ---
interface GlobalPrompt {
  id: string;
  prompt: string;
  update_at: string;
}

interface Franchisee {
  id: string;
  active: boolean;
  name: string;
  municipality: string;
  uf: string;
}

interface FranchiseePrompt {
  id: string;
  prompt: string;
  update_at: string;
}

interface RagFile {
  id: string;
  name: string;
  description: string;
  uploadDate: string;
  size: string;
  status: "INDEXED" | "PROCESSING" | "ERROR";
}

const PromptAi = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // App State
  const [viewMode, setViewMode] = useState<
    "selection" | "global" | "franchisee"
  >("selection");

  // Data States
  const [globalPrompt, setGlobalPrompt] = useState<GlobalPrompt | null>(null);
  const [franchisees, setFranchisees] = useState<Franchisee[]>([]);
  const [selectedFranchisee, setSelectedFranchisee] =
    useState<Franchisee | null>(null);
  const [franchiseePrompts, setFranchiseePrompts] = useState<
    FranchiseePrompt[]
  >([]);
  const [searchTerm, setSearchTerm] = useState("");

  // RAG States
  const [ragFiles, setRagFiles] = useState<RagFile[]>([]);
  const [isLoadingRag, setIsLoadingRag] = useState(false);
  const [ragSearchTerm, setRagSearchTerm] = useState("");
  const [ragFilterDate, setRagFilterDate] = useState("");
  const [ragSortBy, setRagSortBy] = useState<
    "DATE_DESC" | "DATE_ASC" | "SIZE_DESC" | "SIZE_ASC" | "NAME"
  >("DATE_DESC");
  const [isUploadingRag, setIsUploadingRag] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileDescription, setFileDescription] = useState("");

  // UI States
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isEditingPrompt, setIsEditingPrompt] = useState(false);
  const [promptDraft, setPromptDraft] = useState("");

  const formatFileSize = (bytes: number) => {
    if (!bytes || bytes === 0) return "0 KB";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
  };

  const parseSize = (sizeStr: string) => {
    return parseFloat(sizeStr.replace(" MB", "").replace(",", "."));
  };

  const fetchAllRags = async () => {
    setIsLoadingRag(true);
    try {
      const data = await ragController.listRagGeneralInformation();
      if (Array.isArray(data) && data.length > 0) {
        const formattedFiles: RagFile[] = data.map((item: any) => ({
          id: item.id,
          name: item.file_name,
          description: item.description,
          uploadDate: item.create_at,
          size: formatFileSize(item.file_size),
          status: "INDEXED",
        }));
        setRagFiles(formattedFiles);
      } else {
        setRagFiles([]);
      }
    } catch (error) {
      console.error("Erro ao buscar arquivos RAG:", error);
      toast({
        title: "Erro ao carregar arquivos",
        description:
          "Não foi possível carregar os arquivos da base de conhecimento.",
        variant: "destructive",
      });
      setRagFiles([]);
    } finally {
      setIsLoadingRag(false);
    }
  };

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
      setIsUploadingRag(true);
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

      setRagFiles((prev) => [newFile, ...prev]);

      const data = {
        file: selectedFile,
        description: fileDescription,
      };

      await ragController.uploadRagGeneralInformation({ data });

      toast({
        title: "✨ Upload Concluído",
        description: "O arquivo foi enviado e está sendo processado.",
        variant: "default",
      });

      await fetchAllRags();
    } catch (error) {
      console.error("Erro ao fazer upload do arquivo:", error);
      toast({
        title: "Erro no Upload",
        description: "O arquivo não pôde ser processado.",
        variant: "destructive",
      });
      setRagFiles((prev) => prev.filter((f) => f.status !== "PROCESSING"));
    } finally {
      setIsUploadingRag(false);
      setSelectedFile(null);
      setFileDescription("");
    }
  };

  const handleCancelUpload = () => {
    setIsUploadModalOpen(false);
    setSelectedFile(null);
    setFileDescription("");
  };

  const handleDeleteRagById = async (id: string) => {
    try {
      await ragController.deleteRagGeneralInformationById({ id });
      setRagFiles((prev) => prev.filter((f) => f.id !== id));
      toast({
        title: "✨ Arquivo Removido",
        description: "O arquivo foi deletado com sucesso.",
        variant: "default",
      });
    } catch (error) {
      toast({
        title: "Erro ao deletar",
        description: "Não foi possível remover o arquivo.",
        variant: "destructive",
      });
    }
  };

  // Initial Load
  useEffect(() => {
    const init = async () => {
      setIsLoading(true);
      try {
        const [gPrompt, fList] = await Promise.all([
          promptAiController.getGlobalPrompt(),
          getAllFranchisee(),
        ]);
        setGlobalPrompt(gPrompt);
        setFranchisees(fList.filter((f: Franchisee) => f.active));
      } catch (error) {
        toast({
          title: "Erro de carregamento",
          description: "Não foi possível carregar os dados iniciais.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };
    init();
  }, []);

  // Load RAG files when entering global mode
  useEffect(() => {
    if (viewMode === "global") {
      fetchAllRags();
    }
  }, [viewMode]);

  // Load Franchisee Prompts
  useEffect(() => {
    if (selectedFranchisee) {
      const fetchFPrompts = async () => {
        setIsLoading(true);
        try {
          const prompts = await promptAiController.getFranchiseePrompt(
            selectedFranchisee.id,
          );
          setFranchiseePrompts(prompts);
        } catch (error) {
          toast({
            title: "Erro ao carregar prompt do franqueado",
            variant: "destructive",
          });
        } finally {
          setIsLoading(false);
        }
      };
      fetchFPrompts();
    }
  }, [selectedFranchisee]);

  // Filtered Franchisees for better UX
  const filteredFranchisees = useMemo(() => {
    return franchisees.filter(
      (f) =>
        f.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        f.municipality.toLowerCase().includes(searchTerm.toLowerCase()),
    );
  }, [franchisees, searchTerm]);

  // Filtered RAG Files
  const processedRagFiles = useMemo(() => {
    return ragFiles
      .filter((file) => {
        const matchesName = file.name
          .toLowerCase()
          .includes(ragSearchTerm.toLowerCase());
        const matchesDate = ragFilterDate
          ? file.uploadDate.startsWith(ragFilterDate)
          : true;
        return matchesName && matchesDate;
      })
      .sort((a, b) => {
        switch (ragSortBy) {
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
  }, [ragFiles, ragSearchTerm, ragFilterDate, ragSortBy]);

  // --- Handlers ---
  const handleSaveGlobal = async () => {
    if (!promptDraft.trim()) return;
    setIsSaving(true);
    try {
      await promptAiController.updateGlobalPrompt({ prompt: promptDraft });
      const updated = await promptAiController.getGlobalPrompt();
      setGlobalPrompt(updated);
      setIsEditingPrompt(false);
      toast({
        title: "✨ Sucesso!",
        description: "Prompt Global atualizado com sucesso.",
        variant: "default",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveFranchisee = async () => {
    if (!selectedFranchisee || !promptDraft.trim()) return;
    setIsSaving(true);
    try {
      if (franchiseePrompts.length > 0) {
        await promptAiController.updatePromptFranchisee({
          promptId: franchiseePrompts[0].id,
          prompt: promptDraft,
        });
      } else {
        await promptAiController.createPromptFranchisee({
          franchiseeId: selectedFranchisee.id,
          prompt: promptDraft,
        });
      }
      const updated = await promptAiController.getFranchiseePrompt(
        selectedFranchisee.id,
      );
      setFranchiseePrompts(updated);
      setIsEditingPrompt(false);
      toast({
        title: "✨ Sucesso!",
        description: `Prompt de ${selectedFranchisee.name} atualizado.`,
      });
    } finally {
      setIsSaving(false);
    }
  };

  // --- Components ---
  const SkeletonCard = () => (
    <div className="bg-white dark:bg-slate-900/50 backdrop-blur-xl p-10 rounded-[2rem] border border-slate-200/50 dark:border-slate-800/50 animate-pulse">
      <div className="w-16 h-16 bg-gradient-to-br from-green-100 to-green-50 dark:from-green-900/20 dark:to-green-800/20 rounded-2xl mb-6" />
      <div className="h-7 bg-slate-100 dark:bg-slate-800 rounded-xl w-2/3 mb-4" />
      <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded-lg w-full mb-3" />
      <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded-lg w-5/6" />
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-green-50/20 to-slate-50 dark:from-slate-950 dark:via-green-950/10 dark:to-slate-950 p-4 md:p-10 transition-all duration-500">
      <div className="max-w-7xl mx-auto">
        {/* Header Melhorado */}
        <header className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-6">
          <div className="flex items-center gap-4">
            {/* Botão de retorno para /superadmin */}
            {viewMode === "selection" && (
              <button
                onClick={() => navigate("/superadmin")}
                className="group relative p-3 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl hover:bg-white dark:hover:bg-slate-900 rounded-2xl transition-all border border-slate-200/50 dark:border-slate-800/50 shadow-lg shadow-slate-900/5 hover:shadow-xl hover:shadow-green-500/10 hover:-translate-y-0.5"
              >
                <ArrowLeft className="w-5 h-5 text-slate-600 dark:text-slate-400 group-hover:text-green-600 dark:group-hover:text-green-400 group-hover:-translate-x-0.5 transition-all" />
              </button>
            )}
            {/* Botão de voltar para seleção */}
            {viewMode !== "selection" && (
              <button
                onClick={() => {
                  setViewMode("selection");
                  setSelectedFranchisee(null);
                  setIsEditingPrompt(false);
                }}
                className="group relative p-3 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl hover:bg-white dark:hover:bg-slate-900 rounded-2xl transition-all border border-slate-200/50 dark:border-slate-800/50 shadow-lg shadow-slate-900/5 hover:shadow-xl hover:shadow-green-500/10 hover:-translate-y-0.5"
              >
                <ChevronLeft className="w-5 h-5 text-slate-600 dark:text-slate-400 group-hover:text-green-600 dark:group-hover:text-green-400 group-hover:-translate-x-0.5 transition-all" />
              </button>
            )}
            <div>
              <div className="flex items-center gap-3 mb-1.5">
                <div className="relative">
                  <div className="absolute inset-0 bg-green-500 blur-xl opacity-20 animate-pulse" />
                  <Sparkles className="relative w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
                <h1 className="text-3xl md:text-4xl font-black bg-gradient-to-r from-slate-900 via-green-900 to-slate-900 dark:from-white dark:via-green-400 dark:to-white bg-clip-text text-transparent tracking-tight">
                  IA Prompt's
                </h1>
              </div>
              <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-2 ml-0.5">
                {viewMode === "selection" ? (
                  <span className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                    Gerencie a inteligência artificial do sistema
                  </span>
                ) : (
                  <>
                    <span className="opacity-60">Configuração</span>
                    <ArrowRight className="w-3.5 h-3.5 opacity-40" />
                    <span className="text-green-600 dark:text-green-400 font-bold">
                      {viewMode === "global"
                        ? "Prompt Global"
                        : selectedFranchisee?.name}
                    </span>
                  </>
                )}
              </p>
            </div>
          </div>
        </header>

        {/* --- MODO SELEÇÃO --- */}
        {viewMode === "selection" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {isLoading ? (
              <>
                <SkeletonCard />
                <SkeletonCard />
              </>
            ) : (
              <>
                {/* Card Global Melhorado */}
                <button
                  onClick={() => {
                    setViewMode("global");
                    setPromptDraft(globalPrompt?.prompt || "");
                  }}
                  className="group relative bg-white/80 dark:bg-slate-900/50 backdrop-blur-xl p-12 rounded-[2.5rem] border border-slate-200/50 dark:border-slate-800/50 shadow-xl shadow-slate-900/5 hover:shadow-2xl hover:shadow-green-500/20 hover:-translate-y-2 hover:border-green-200 dark:hover:border-green-800/50 transition-all duration-500 text-left overflow-hidden"
                >
                  {/* Background Pattern */}
                  <div className="absolute inset-0 bg-gradient-to-br from-green-50/50 via-transparent to-transparent dark:from-green-950/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <div className="absolute -top-12 -right-12 w-48 h-48 bg-green-500/5 rounded-full blur-3xl group-hover:bg-green-500/10 transition-all duration-700" />

                  {/* Icon */}
                  <div className="relative w-20 h-20 bg-gradient-to-br from-green-100 to-green-50 dark:from-green-900/30 dark:to-green-800/20 rounded-3xl flex items-center justify-center mb-8 group-hover:scale-110 group-hover:rotate-3 transition-all duration-500 shadow-lg shadow-green-500/10">
                    <Globe className="w-10 h-10 text-green-600 dark:text-green-400" />
                  </div>

                  {/* Content */}
                  <div className="relative">
                    <h3 className="text-3xl font-black text-slate-900 dark:text-white mb-4 group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors">
                      Prompt Global
                    </h3>
                    <p className="text-slate-600 dark:text-slate-400 leading-relaxed mb-8 text-base font-medium">
                      A "alma" da sua IA. Defina o tom de voz, restrições e
                      conhecimentos base que todas as unidades herdarão.
                    </p>
                    <div className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-2xl font-bold text-sm shadow-lg shadow-green-500/25 group-hover:shadow-xl group-hover:shadow-green-500/40 group-hover:gap-4 transition-all">
                      Configurar Diretrizes
                      <ArrowRight className="w-5 h-5" />
                    </div>
                  </div>
                </button>

                {/* Card Franqueado Melhorado */}
                <div className="group relative bg-white/80 dark:bg-slate-900/50 backdrop-blur-xl p-12 rounded-[2.5rem] border border-slate-200/50 dark:border-slate-800/50 shadow-xl shadow-slate-900/5 hover:shadow-2xl hover:shadow-green-500/20 transition-all duration-500 text-left overflow-hidden">
                  {/* Background Pattern */}
                  <div className="absolute inset-0 bg-gradient-to-br from-green-50/30 via-transparent to-transparent dark:from-green-950/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <div className="absolute -top-12 -left-12 w-48 h-48 bg-green-500/5 rounded-full blur-3xl group-hover:bg-green-500/10 transition-all duration-700" />

                  {/* Icon */}
                  <div className="relative w-20 h-20 bg-gradient-to-br from-green-100 to-green-50 dark:from-green-900/30 dark:to-green-800/20 rounded-3xl flex items-center justify-center mb-8 group-hover:scale-110 group-hover:-rotate-3 transition-all duration-500 shadow-lg shadow-green-500/10">
                    <Building2 className="w-10 h-10 text-green-600 dark:text-green-400" />
                  </div>

                  {/* Content */}
                  <div className="relative">
                    <h3 className="text-3xl font-black text-slate-900 dark:text-white mb-4">
                      Personalização Local
                    </h3>
                    <p className="text-slate-600 dark:text-slate-400 leading-relaxed mb-8 text-base font-medium">
                      Ajuste o comportamento para franqueados específicos,
                      adicionando contextos regionais ou regras de negócio
                      locais.
                    </p>

                    <div className="relative">
                      <div className="absolute left-5 top-1/2 -translate-y-1/2 text-green-600 dark:text-green-400 z-10">
                        <Search className="w-5 h-5" />
                      </div>
                      <select
                        onChange={(e) => {
                          const f = franchisees.find(
                            (f) => f.id === e.target.value,
                          );
                          if (f) {
                            setSelectedFranchisee(f);
                            setViewMode("franchisee");
                            setPromptDraft("");
                          }
                        }}
                        className="w-full pl-14 pr-5 py-4 bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 hover:border-green-500 dark:hover:border-green-500 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-green-500/20 focus:border-green-500 outline-none transition-all appearance-none cursor-pointer shadow-sm"
                      >
                        <option value="">
                          Buscar unidade para configurar...
                        </option>
                        {franchisees.map((f) => (
                          <option key={f.id} value={f.id}>
                            {f.name} ({f.municipality} - {f.uf})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* --- MODO CONFIGURAÇÃO --- */}
        {viewMode !== "selection" && (
          <div className="space-y-8 animate-in fade-in zoom-in-95 duration-500">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* Coluna Editor */}
              <div className="lg:col-span-5 space-y-6">
                <div className="bg-white/80 dark:bg-slate-900/50 backdrop-blur-xl rounded-[2rem] border border-slate-200/50 dark:border-slate-800/50 shadow-xl overflow-hidden flex flex-col min-h-[600px]">
                  {/* Header do Editor */}
                  <div className="px-8 py-5 border-b border-slate-100 dark:border-slate-800 bg-gradient-to-r from-green-50/50 to-transparent dark:from-green-950/20 dark:to-transparent flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg shadow-green-500/25">
                        <Settings2 className="w-5 h-5 text-white" />
                      </div>
                      <span className="font-black text-slate-900 dark:text-white text-lg">
                        Editor de Inteligência
                      </span>
                    </div>
                    {!isEditingPrompt && (
                      <button
                        onClick={() => {
                          setIsEditingPrompt(true);
                          setPromptDraft(
                            viewMode === "global"
                              ? globalPrompt?.prompt || ""
                              : franchiseePrompts[0]?.prompt || "",
                          );
                        }}
                        className="flex items-center gap-2 px-5 py-2.5 hover:bg-green-50 dark:hover:bg-green-500/10 text-green-600 dark:text-green-400 rounded-xl transition-all font-bold text-sm border border-transparent hover:border-green-200 dark:hover:border-green-800/50"
                      >
                        <Edit className="w-4 h-4" />
                        Editar Prompt
                      </button>
                    )}
                  </div>

                  <div className="p-8 flex-1 flex flex-col">
                    {isEditingPrompt ? (
                      <div className="flex-1 flex flex-col">
                        <div className="mb-4 flex items-center justify-between">
                          <label className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest flex items-center gap-2">
                            <MessageSquare className="w-3.5 h-3.5" />
                            Conteúdo do Prompt
                          </label>
                          <span
                            className={cn(
                              "text-xs font-bold px-3 py-1.5 rounded-full",
                              promptDraft.length > 1000
                                ? "bg-orange-100 text-orange-600 dark:bg-orange-500/10 dark:text-orange-400"
                                : "bg-green-100 text-green-600 dark:bg-green-500/10 dark:text-green-400",
                            )}
                          >
                            {promptDraft.length} caracteres
                          </span>
                        </div>
                        <textarea
                          value={promptDraft}
                          onChange={(e) => setPromptDraft(e.target.value)}
                          className="flex-1 w-full p-6 bg-slate-50 dark:bg-slate-950/50 border-2 border-green-200/50 dark:border-green-800/50 focus:border-green-500 rounded-3xl outline-none text-sm leading-relaxed resize-none transition-all font-medium text-slate-700 dark:text-slate-300 shadow-inner placeholder:text-slate-400"
                          placeholder="Ex: Você é um assistente especializado em atendimento ao cliente. Use um tom amigável e profissional..."
                        />
                        <div className="mt-6 grid grid-cols-2 gap-4">
                          <button
                            onClick={() => setIsEditingPrompt(false)}
                            className="py-4 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-2xl font-bold text-sm text-slate-600 dark:text-slate-300 transition-all border-2 border-transparent hover:border-slate-300 dark:hover:border-slate-600"
                          >
                            Descartar
                          </button>
                          <button
                            onClick={
                              viewMode === "global"
                                ? handleSaveGlobal
                                : handleSaveFranchisee
                            }
                            disabled={isSaving || !promptDraft.trim()}
                            className="py-4 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 disabled:from-slate-300 disabled:to-slate-300 text-white rounded-2xl font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-green-500/25 hover:shadow-xl hover:shadow-green-500/40 disabled:shadow-none transition-all disabled:cursor-not-allowed"
                          >
                            {isSaving ? (
                              <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                              <Save className="w-5 h-5" />
                            )}
                            {isSaving ? "Salvando..." : "Salvar Prompt"}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex-1 flex flex-col">
                        <div className="flex-1 relative group">
                          <div className="absolute -inset-1 bg-gradient-to-b from-green-500/5 to-transparent rounded-[2rem] opacity-0 group-hover:opacity-100 transition-opacity" />
                          <div className="relative h-full p-8 bg-gradient-to-br from-slate-50/50 to-white/50 dark:from-slate-950/50 dark:to-slate-900/50 rounded-[2rem] border-2 border-slate-100 dark:border-slate-800/50 text-sm text-slate-600 dark:text-slate-400 leading-relaxed whitespace-pre-wrap overflow-y-auto max-h-[400px] scrollbar-thin scrollbar-thumb-green-200 dark:scrollbar-thumb-green-800 scrollbar-track-transparent">
                            {viewMode === "global"
                              ? globalPrompt?.prompt ||
                                "Nenhum prompt definido."
                              : franchiseePrompts[0]?.prompt ||
                                "Este franqueado está utilizando as diretrizes globais padrão."}
                          </div>
                        </div>

                        <div className="mt-8 p-5 bg-gradient-to-r from-green-50 to-green-50/50 dark:from-green-500/10 dark:to-green-500/5 rounded-2xl border-2 border-green-100 dark:border-green-500/20 flex items-start gap-3">
                          <div className="p-2 bg-green-500/10 rounded-lg">
                            <Info className="w-4 h-4 text-green-600 dark:text-green-400" />
                          </div>
                          <p className="text-xs text-green-700 dark:text-green-300 leading-relaxed font-medium">
                            {viewMode === "global"
                              ? "Este prompt serve como base para todo o sistema. Alterações aqui afetam todos os franqueados instantaneamente."
                              : "Prompts de franqueados complementam o prompt global, permitindo ajustes específicos para esta unidade."}
                          </p>
                        </div>

                        <div className="mt-6 flex items-center justify-between px-2">
                          <div className="flex items-center gap-2 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                            <History className="w-4 h-4" />
                            Atualizado em
                          </div>
                          <span className="text-xs font-bold text-green-600 dark:text-green-400">
                            {viewMode === "global"
                              ? globalPrompt?.update_at
                                ? new Date(
                                    globalPrompt.update_at,
                                  ).toLocaleDateString("pt-BR")
                                : "---"
                              : franchiseePrompts[0]?.update_at
                                ? new Date(
                                    franchiseePrompts[0].update_at,
                                  ).toLocaleDateString("pt-BR")
                                : "---"}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Coluna Chat */}
              <div className="lg:col-span-7">
                <ChatTester
                  mode={viewMode === "global" ? "global" : "franchisee"}
                  globalPrompt={globalPrompt?.prompt || ""}
                  franchiseePrompt={franchiseePrompts[0]?.prompt}
                  franchiseeName={selectedFranchisee?.name}
                  franchiseeId={selectedFranchisee?.id}
                  isLoading={isLoading}
                />
              </div>
            </div>

            {/* --- SEÇÃO RAG (apenas para modo global) --- */}
            {viewMode === "global" && (
              <div className="space-y-6">
                {/* ÁREA DE UPLOAD */}
                <div
                  className="group relative border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl bg-white/80 dark:bg-slate-900/50 backdrop-blur-xl p-10 text-center hover:border-green-400 dark:hover:border-green-600 hover:bg-green-50/30 dark:hover:bg-green-900/10 transition-all cursor-pointer overflow-hidden"
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
                      {isUploadingRag ? (
                        <Loader2 className="w-10 h-10 text-green-600 dark:text-green-400 animate-spin" />
                      ) : (
                        <Upload className="w-10 h-10 text-green-600 dark:text-green-400" />
                      )}
                    </div>
                    <h3 className="text-xl font-bold text-slate-700 dark:text-white mb-2">
                      {isUploadingRag
                        ? "Enviando arquivo..."
                        : "Upload de PDF para Base de Conhecimento"}
                    </h3>
                    <p className="text-slate-500 dark:text-slate-400 text-sm max-w-md mx-auto">
                      {isUploadingRag
                        ? "Aguarde enquanto processamos e indexamos seu documento na base global."
                        : "Arraste ou clique para selecionar. Estes documentos estarão disponíveis para todas as consultas da IA."}
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

                {/* LISTA DE ARQUIVOS RAG */}
                <div className="bg-white/80 dark:bg-slate-900/50 backdrop-blur-xl rounded-2xl shadow-xl border border-slate-200/50 dark:border-slate-800/50 overflow-hidden">
                  {/* Filtros e Busca */}
                  <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex flex-col lg:flex-row gap-4 items-center justify-between bg-gradient-to-r from-green-50/50 to-transparent dark:from-green-950/20 dark:to-transparent">
                    <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
                      <div className="relative w-full sm:w-72">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                          type="text"
                          placeholder="Buscar documentos..."
                          value={ragSearchTerm}
                          onChange={(e) => setRagSearchTerm(e.target.value)}
                          className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500 text-slate-700 dark:text-slate-200 transition-all placeholder:text-slate-400"
                        />
                      </div>
                      <div className="relative w-full sm:w-auto">
                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                        <input
                          type="date"
                          value={ragFilterDate}
                          onChange={(e) => setRagFilterDate(e.target.value)}
                          className="w-full pl-10 pr-10 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500 text-slate-700 dark:text-slate-200 transition-all"
                        />
                        {ragFilterDate && (
                          <button
                            onClick={() => setRagFilterDate("")}
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
                            value={ragSortBy}
                            onChange={(e: any) => setRagSortBy(e.target.value)}
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
                        {processedRagFiles.length}{" "}
                        {processedRagFiles.length === 1
                          ? "Arquivo"
                          : "Arquivos"}
                      </div>
                    </div>
                  </div>

                  {/* Tabela */}
                  <div className="overflow-x-auto">
                    {isLoadingRag ? (
                      <div className="flex flex-col items-center justify-center p-20 space-y-4">
                        <Loader2 className="w-10 h-10 text-green-600 dark:text-green-400 animate-spin" />
                        <p className="text-slate-500 dark:text-slate-400 font-medium">
                          Carregando base de conhecimento...
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
                          {processedRagFiles.map((file) => (
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
                                {new Date(file.uploadDate).toLocaleDateString(
                                  "pt-BR",
                                  {
                                    day: "2-digit",
                                    month: "2-digit",
                                    year: "numeric",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  },
                                )}
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
                                  onClick={() => handleDeleteRagById(file.id)}
                                  className="p-2.5 text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all"
                                  title="Deletar arquivo"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </td>
                            </tr>
                          ))}
                          {processedRagFiles.length === 0 && (
                            <tr>
                              <td colSpan={6} className="p-20 text-center">
                                <div className="flex flex-col items-center space-y-3">
                                  <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-full">
                                    <Search className="w-8 h-8 text-slate-300 dark:text-slate-500" />
                                  </div>
                                  <p className="text-slate-400 dark:text-slate-500 font-medium">
                                    Nenhum documento encontrado.
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
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal de Upload com Descrição */}
      {isUploadModalOpen && selectedFile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 dark:bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 border border-slate-200 dark:border-slate-800">
            <div className="bg-gradient-to-r from-green-600 to-green-700 dark:from-green-700 dark:to-green-800 p-6 flex items-center justify-between text-white">
              <div className="flex items-center gap-4">
                <div className="p-2.5 bg-white/10 rounded-xl">
                  <Upload className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-lg">Confirmar Upload Global</h3>
                  <p className="text-xs text-green-100">
                    Base de conhecimento da IA
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
                  <p className="text-[10px] font-bold text-green-600 dark:text-green-400 uppercase tracking-widest mb-1">
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
                <p className="text-xs text-slate-400 dark:text-slate-500 ml-1">
                  {fileDescription.length}/180 caracteres
                </p>
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
                disabled={!fileDescription.trim()}
                className="flex-[2] px-4 py-3 text-sm font-bold bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 disabled:from-slate-300 disabled:to-slate-400 text-white rounded-2xl shadow-lg shadow-green-500/25 hover:shadow-xl hover:shadow-green-500/40 disabled:shadow-none transition-all active:scale-95 disabled:cursor-not-allowed"
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

export default PromptAi;
