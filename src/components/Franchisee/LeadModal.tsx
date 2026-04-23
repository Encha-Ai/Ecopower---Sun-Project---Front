import React, { Fragment, useEffect, useState } from "react";
import { Dialog, Transition } from "@headlessui/react";
import {
  X,
  Loader2,
  Save,
  User,
  Mail,
  Phone,
  Tag,
  Eye,
  KanbanSquare,
  ArrowRightLeft,
  CheckCircle2,
  ChevronRight,
  ChevronDown,
  Check,
  PlusCircle,
} from "lucide-react";
import { apiClient } from "@/lib/apiClient";
import { useAuth } from "@/contexts/AuthContext";

interface FormData {
  name: string;
  email: string;
  phone: string;
  leadType: string;
}

interface LeadLocation {
  leadId: string;
  dealId: string;
  pipelineId: string;
  pipelineName: string;
  stageId: string;
  stageName: string;
}

interface PipelineOption {
  id: string;
  name: string;
  icon?: string;
  stages: { id: string; name: string }[];
}

interface LeadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (e: React.FormEvent) => Promise<void>;
  formData: FormData;
  setFormData: React.Dispatch<React.SetStateAction<FormData>>;
  mode: "create" | "edit" | "view";
  isSaving: boolean;
  onRefresh?: () => void;
}

function onlyDigits(value: string): string {
  return value.replace(/\D/g, "");
}

function formatPhoneDisplay(digits: string): string {
  const d = digits.slice(0, 11);
  if (d.length === 0) return "";
  if (d.length <= 2) return `(${d}`;
  if (d.length <= 7) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10)
    return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

export default function LeadModal({
  isOpen,
  onClose,
  onSave,
  formData,
  setFormData,
  mode,
  isSaving,
  onRefresh,
}: LeadModalProps) {
  const { user } = useAuth();
  const franchiseeId = user?.franchisee?.id;
  const isReadOnly = mode === "view";

  const [location, setLocation] = useState<LeadLocation | null>(null);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [pipelines, setPipelines] = useState<PipelineOption[]>([]);
  const [isLoadingPipelines, setIsLoadingPipelines] = useState(false);

  // Panel mode: "move" = mover entre etapas, "add" = adicionar ao funil (sem funil atual)
  const [panelMode, setPanelMode] = useState<"move" | "add" | null>(null);

  const [selectedPipelineId, setSelectedPipelineId] = useState("");
  const [selectedStageId, setSelectedStageId] = useState("");
  const [isMoving, setIsMoving] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [actionDone, setActionDone] = useState(false);

  const selectedPipeline = pipelines.find((p) => p.id === selectedPipelineId);
  const selectedPipelineStages = selectedPipeline?.stages ?? [];

  // Indica se o painel de ação está aberto (move ou add)
  const isPanelOpen = panelMode !== null;
  const isPipelineAvailable = formData.leadType === "LEAD";

  useEffect(() => {
    if (!isOpen || mode !== "edit" || !formData.phone || !franchiseeId) return;
    const fetchLocation = async () => {
      setIsLoadingLocation(true);
      setLocation(null);
      setPanelMode(null);
      setActionDone(false);
      setPipelines([]);
      try {
        const baseUrl = apiClient.getBaseUrl();
        const res = await apiClient.get(
          `${baseUrl}/api/pipelines/leads/location?phone=${encodeURIComponent(
            formData.phone
          )}&franchiseeId=${franchiseeId}`
        );
        if (res.ok) {
          const data = await res.json();
          const loc = Array.isArray(data) ? data[0] : data;
          if (loc?.dealId) setLocation(loc);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setIsLoadingLocation(false);
      }
    };
    fetchLocation();
  }, [isOpen, formData.phone, franchiseeId, mode]);

  const loadPipelines = async () => {
    if (pipelines.length > 0) return pipelines;
    setIsLoadingPipelines(true);
    try {
      const baseUrl = apiClient.getBaseUrl();
      const res = await apiClient.fetch(
        `${baseUrl}/api/pipelines?franchiseeId=${franchiseeId}`
      );
      if (res.ok) {
        const data = await res.json();
        const list: any[] = Array.isArray(data)
          ? data
          : data?.content ?? [data];
        const mapped: PipelineOption[] = list.map((pipe: any) => ({
          id: pipe.id,
          name: pipe.name,
          icon: pipe.icon,
          stages: (pipe.stages ?? []).map((s: any) => ({
            id: s.id,
            name: s.name,
          })),
        }));
        setPipelines(mapped);
        return mapped;
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoadingPipelines(false);
    }
    return [];
  };

  // Abre painel de MOVER (lead já em um funil)
  const handleOpenMove = async () => {
    if (isPanelOpen && panelMode === "move") {
      setPanelMode(null);
      return;
    }
    setPanelMode("move");
    const loaded = await loadPipelines();
    if (location) {
      setSelectedPipelineId(location.pipelineId);
      setSelectedStageId(location.stageId);
    } else if (loaded.length > 0) {
      setSelectedPipelineId(loaded[0].id);
      setSelectedStageId(loaded[0].stages[0]?.id ?? "");
    }
  };

  // Abre painel de ADICIONAR (lead sem funil)
  const handleOpenAdd = async () => {
    if (isPanelOpen && panelMode === "add") {
      setPanelMode(null);
      return;
    }
    setPanelMode("add");
    const loaded = await loadPipelines();
    if (loaded.length > 0) {
      setSelectedPipelineId(loaded[0].id);
      setSelectedStageId(loaded[0].stages[0]?.id ?? "");
    }
  };

  const handlePipelineChange = (pipelineId: string) => {
    setSelectedPipelineId(pipelineId);
    const stages = pipelines.find((p) => p.id === pipelineId)?.stages ?? [];
    setSelectedStageId(stages[0]?.id ?? "");
  };

  // Confirma MOVER etapa/funil
  const handleMove = async () => {
    if (!location || !selectedStageId || !selectedPipelineId) return;
    setIsMoving(true);
    try {
      const baseUrl = apiClient.getBaseUrl();

      // 1. Se mudou de pipeline, move o deal para o novo funil primeiro
      if (selectedPipelineId !== location.pipelineId) {
        const pipeRes = await apiClient.put(
          `${baseUrl}/api/move-deal-pipeline`,
          {
            dealId: location.dealId,
            targetPipelineId: selectedPipelineId,
          }
        );
        if (!pipeRes.ok) {
          console.error("Falha ao mover deal para outro funil.");
          return;
        }
      }

      // 2. Move para a etapa selecionada
      const stageRes = await apiClient.put(`${baseUrl}/api/move-deal`, {
        dealId: location.dealId,
        newStageId: selectedStageId,
      });
      if (!stageRes.ok) {
        console.error("Falha ao mover deal para a etapa.");
        return;
      }

      // 3. Atualiza estado local
      const newPipeline = pipelines.find((p) => p.id === selectedPipelineId);
      const newStage = newPipeline?.stages.find(
        (s) => s.id === selectedStageId
      );
      setLocation((prev) =>
        prev
          ? {
              ...prev,
              pipelineId: selectedPipelineId,
              pipelineName: newPipeline?.name ?? prev.pipelineName,
              stageId: selectedStageId,
              stageName: newStage?.name ?? prev.stageName,
            }
          : prev
      );
      setActionDone(true);
      setPanelMode(null);
      onRefresh?.();
    } catch (e) {
      console.error("Erro ao mover lead:", e);
    } finally {
      setIsMoving(false);
    }
  };

  // Confirma ADICIONAR ao funil (lead sem funil)
  const handleAdd = async () => {
    if (!selectedPipelineId || !selectedStageId) return;
    setIsAdding(true);
    try {
      const baseUrl = apiClient.getBaseUrl();

      // Busca o leadId pelo telefone para usar no endpoint de adicionar
      const phone = formData.phone;
      const res = await apiClient.get(
        `${baseUrl}/api/pipelines/leads/location?phone=${encodeURIComponent(
          phone
        )}&franchiseeId=${franchiseeId}`
      );

      let leadId: string | null = null;
      if (res.ok) {
        const data = await res.json();
        const loc = Array.isArray(data) ? data[0] : data;
        leadId = loc?.leadId ?? null;
      }

      if (!leadId) {
        // Tenta buscar pelo search como fallback
        const searchRes = await apiClient.get(
          `${baseUrl}/api/pipelines/leads/search?franchiseeId=${franchiseeId}&query=${encodeURIComponent(
            formData.phone
          )}`
        );
        if (searchRes.ok) {
          const searchData = await searchRes.json();
          const found = Array.isArray(searchData) ? searchData[0] : null;
          leadId = found?.id ?? null;
        }
      }

      if (leadId) {
        const addRes = await apiClient.post(
          `${baseUrl}/api/pipelines/${selectedPipelineId}/add-lead/${leadId}`
        );

        if (addRes.ok) {
          const newPipeline = pipelines.find(
            (p) => p.id === selectedPipelineId
          );
          const newStage = newPipeline?.stages.find(
            (s) => s.id === selectedStageId
          );
          // Atualiza o estado de localização com os dados recém-adicionados
          setLocation({
            leadId,
            dealId: "", // será preenchido no próximo fetch
            pipelineId: selectedPipelineId,
            pipelineName: newPipeline?.name ?? "",
            stageId: selectedStageId,
            stageName: newStage?.name ?? "",
          });
          setActionDone(true);
          setPanelMode(null);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsAdding(false);
    }
  };

  const hasMoveChanged =
    selectedPipelineId !== location?.pipelineId ||
    selectedStageId !== location?.stageId;

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    if (isReadOnly) return;
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isReadOnly) return;
    const digits = onlyDigits(e.target.value).slice(0, 11);
    setFormData((prev) => ({ ...prev, phone: digits ? `+55${digits}` : "" }));
  };

  const phoneDisplayValue = formData.phone
    ? formatPhoneDisplay(onlyDigits(formData.phone).slice(2))
    : "";

  // ── Renderiza o painel de seleção de pipeline/etapa (compartilhado entre move e add)
  const renderSelectionPanel = () => (
    <div className="border-t border-slate-100 dark:border-slate-800 px-3 py-3 space-y-3 bg-slate-50/50 dark:bg-slate-800/20 animate-in fade-in slide-in-from-top-1 duration-150">
      {isLoadingPipelines ? (
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <Loader2 className="w-3 h-3 animate-spin" />
          Carregando...
        </div>
      ) : (
        <>
          {/* Pipeline selector */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Funil
            </label>
            <div className="relative">
              <select
                value={selectedPipelineId}
                onChange={(e) => handlePipelineChange(e.target.value)}
                className="w-full appearance-none px-2.5 py-1.5 pr-7 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs font-medium text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none cursor-pointer"
              >
                {pipelines.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.icon ? `${p.icon} ` : ""}
                    {p.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400 pointer-events-none" />
            </div>
          </div>

          {/* Stages grid */}
          {selectedPipelineStages.length > 0 && (
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                Etapa
              </label>
              <div className="grid grid-cols-2 gap-1.5 max-h-32 overflow-y-auto">
                {selectedPipelineStages.map((s) => {
                  const isSelected = selectedStageId === s.id;
                  const isCurrent =
                    panelMode === "move" &&
                    s.id === location?.stageId &&
                    selectedPipelineId === location?.pipelineId;

                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setSelectedStageId(s.id)}
                      className={`flex items-center justify-between px-2 py-1.5 rounded-lg border text-xs font-medium transition-all text-left ${
                        isSelected
                          ? "bg-green-50 dark:bg-green-900/20 border-green-300 dark:border-green-700 text-green-700 dark:text-green-300"
                          : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800"
                      }`}
                    >
                      <span className="flex items-center gap-1 truncate">
                        <span className="truncate">{s.name}</span>
                        {isCurrent && !isSelected && (
                          <span className="text-[9px] font-bold text-blue-500 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-1 py-0.5 rounded whitespace-nowrap">
                            atual
                          </span>
                        )}
                      </span>
                      {isSelected && (
                        <Check className="w-3 h-3 text-green-600 dark:text-green-400 shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Confirm button */}
          {panelMode === "move" ? (
            <button
              type="button"
              onClick={handleMove}
              disabled={isMoving || !hasMoveChanged}
              className="w-full py-2 text-xs font-bold text-white bg-green-600 hover:bg-green-700 disabled:bg-slate-100 disabled:text-slate-400 dark:disabled:bg-slate-800 dark:disabled:text-slate-500 rounded-lg transition-all flex items-center justify-center gap-1.5 disabled:cursor-not-allowed"
            >
              {isMoving ? (
                <>
                  <Loader2 className="w-3 h-3 animate-spin" />
                  <span className="hidden sm:inline">Movendo...</span>
                </>
              ) : hasMoveChanged ? (
                <>
                  <ArrowRightLeft className="w-3 h-3" />
                  <span className="hidden sm:inline">Confirmar</span>
                </>
              ) : (
                "Sem alterações"
              )}
            </button>
          ) : (
            <button
              type="button"
              onClick={handleAdd}
              disabled={isAdding || !selectedPipelineId || !selectedStageId}
              className="w-full py-2 text-xs font-bold text-white bg-green-600 hover:bg-green-700 disabled:bg-slate-100 disabled:text-slate-400 dark:disabled:bg-slate-800 dark:disabled:text-slate-500 rounded-lg transition-all flex items-center justify-center gap-1.5 disabled:cursor-not-allowed"
            >
              {isAdding ? (
                <>
                  <Loader2 className="w-3 h-3 animate-spin" />
                  <span>Adicionando...</span>
                </>
              ) : (
                <>
                  <PlusCircle className="w-3 h-3" />
                  <span>Adicionar ao Funil</span>
                </>
              )}
            </button>
          )}
        </>
      )}
    </div>
  );

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-[9999]" onClose={onClose}>
        {/* Backdrop */}
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-lg rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden">
                {/* Header */}
                <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
                  <Dialog.Title
                    as="h3"
                    className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2"
                  >
                    {mode === "create" && (
                      <>
                        <User className="w-4 h-4 text-green-600" /> Novo Lead
                      </>
                    )}
                    {mode === "edit" && (
                      <>
                        <User className="w-4 h-4 text-blue-600" /> Editar Lead
                      </>
                    )}
                    {mode === "view" && (
                      <>
                        <Eye className="w-4 h-4 text-slate-500" /> Detalhes do
                        Lead
                      </>
                    )}
                  </Dialog.Title>
                  <button
                    onClick={onClose}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Form */}
                <form onSubmit={onSave} className="p-5 space-y-4">
                  {/* ── PIPELINE (edit only) ── */}
                  {mode === "edit" && (
                    <div className="rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                      {!isPipelineAvailable ? (
                        // ── Tipo não é LEAD: exibe aviso de indisponível ──
                        <div className="px-4 py-3 flex items-center gap-2 bg-slate-50 dark:bg-slate-800/30">
                          <KanbanSquare className="w-3.5 h-3.5 text-slate-300 dark:text-slate-600 shrink-0" />
                          <span className="text-xs text-slate-400 dark:text-slate-500 italic">
                            Funil disponível apenas para leads
                          </span>
                          <span className="ml-auto text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 border border-slate-200 dark:border-slate-700">
                            Indisponível
                          </span>
                        </div>
                      ) : (
                        <>
                          {/* Current location display */}
                          <div className="px-4 py-3 flex items-center justify-between gap-2 bg-slate-50 dark:bg-slate-800/30">
                            <div className="flex items-center gap-2 min-w-0">
                              <KanbanSquare className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              {isLoadingLocation ? (
                                <span className="flex items-center gap-1.5 text-xs text-slate-400">
                                  <Loader2 className="w-3 h-3 animate-spin" />
                                  Carregando...
                                </span>
                              ) : !location ? (
                                <span className="text-xs text-slate-400 italic">
                                  Sem funil
                                </span>
                              ) : (
                                <div className="flex items-center gap-1 min-w-0 text-xs font-medium text-slate-700 dark:text-slate-200">
                                  <span className="truncate">
                                    {location.pipelineName}
                                  </span>
                                  <ChevronRight className="w-3 h-3 text-slate-300 dark:text-slate-600 shrink-0" />
                                  <span className="truncate">
                                    {location.stageName}
                                  </span>
                                  {actionDone && !isPanelOpen && (
                                    <span className="inline-flex items-center gap-0.5 text-green-600 dark:text-green-400 shrink-0 ml-1">
                                      <CheckCircle2 className="w-3 h-3" />
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>

                            {!isLoadingLocation && (
                              <>
                                {location ? (
                                  <button
                                    type="button"
                                    onClick={handleOpenMove}
                                    className={`shrink-0 flex items-center gap-1 text-xs font-semibold px-2 py-1.5 rounded-lg border transition-all ${
                                      isPanelOpen && panelMode === "move"
                                        ? "text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700"
                                        : "text-green-700 dark:text-green-400 border-green-200 dark:border-green-800/60 bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/30"
                                    }`}
                                  >
                                    <ArrowRightLeft className="w-3 h-3" />
                                    <span className="hidden sm:inline">
                                      {isPanelOpen && panelMode === "move"
                                        ? "Cancelar"
                                        : "Mover"}
                                    </span>
                                  </button>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={handleOpenAdd}
                                    className={`shrink-0 flex items-center gap-1 text-xs font-semibold px-2 py-1.5 rounded-lg border transition-all ${
                                      isPanelOpen && panelMode === "add"
                                        ? "text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700"
                                        : "text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800/60 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30"
                                    }`}
                                  >
                                    <PlusCircle className="w-3 h-3" />
                                    <span className="hidden sm:inline">
                                      {isPanelOpen && panelMode === "add"
                                        ? "Cancelar"
                                        : "Adicionar ao Funil"}
                                    </span>
                                  </button>
                                )}
                              </>
                            )}
                          </div>

                          {isPanelOpen && renderSelectionPanel()}
                        </>
                      )}
                    </div>
                  )}

                  {/* Nome */}
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                      <User className="w-4 h-4 text-slate-400" /> Nome Completo
                    </label>
                    <input
                      type="text"
                      name="name"
                      required
                      readOnly={isReadOnly}
                      placeholder="Ex: João da Silva"
                      value={formData.name}
                      onChange={handleChange}
                      className={`w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:ring-2 focus:ring-green-500 outline-none transition-all placeholder:text-slate-400 text-sm ${
                        isReadOnly ? "opacity-60 cursor-default" : ""
                      }`}
                    />
                  </div>

                  {/* Email + Telefone */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                        <Mail className="w-4 h-4 text-slate-400" /> Email
                      </label>
                      <input
                        type="email"
                        name="email"
                        readOnly={isReadOnly}
                        placeholder="email@exemplo.com"
                        value={formData.email}
                        onChange={handleChange}
                        className={`w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:ring-2 focus:ring-green-500 outline-none transition-all placeholder:text-slate-400 text-sm ${
                          isReadOnly ? "opacity-60 cursor-default" : ""
                        }`}
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                        <Phone className="w-4 h-4 text-slate-400" /> Telefone
                      </label>
                      <div className="flex rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden focus-within:ring-2 focus-within:ring-green-500">
                        <span className="flex items-center px-3 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-sm font-semibold border-r border-slate-200 dark:border-slate-700 select-none">
                          +55
                        </span>
                        <input
                          type="tel"
                          name="phone"
                          required
                          readOnly={isReadOnly}
                          placeholder="(00) 00000-0000"
                          value={phoneDisplayValue}
                          onChange={handlePhoneChange}
                          className={`flex-1 px-3.5 py-2.5 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none placeholder:text-slate-400 text-sm ${
                            isReadOnly ? "opacity-60 cursor-default" : ""
                          }`}
                        />
                      </div>
                      {!isReadOnly && formData.phone && (
                        <p className="text-xs text-slate-400 pl-1">
                          Salvo como:{" "}
                          <span className="font-mono">{formData.phone}</span>
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Tipo de Lead */}
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                      <Tag className="w-4 h-4 text-slate-400" /> Tipo de
                      Cadastro
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        {
                          label: "Lead",
                          value: "LEAD",
                          active:
                            "bg-blue-50 border-blue-400 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
                        },
                        {
                          label: "Contato",
                          value: "CONTACT",
                          active:
                            "bg-purple-50 border-purple-400 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
                        },
                        {
                          label: "Cliente",
                          value: "CLIENT",
                          active:
                            "bg-green-50 border-green-400 text-green-700 dark:bg-green-900/30 dark:text-green-400",
                        },
                      ].map((type) => (
                        <button
                          key={type.value}
                          type="button"
                          disabled={isReadOnly}
                          onClick={() =>
                            setFormData((prev) => ({
                              ...prev,
                              leadType: type.value,
                            }))
                          }
                          className={`py-2 rounded-lg text-sm font-semibold border transition-all ${
                            formData.leadType === type.value
                              ? type.active
                              : `bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-700 text-slate-500 ${
                                  !isReadOnly
                                    ? "hover:bg-slate-50 dark:hover:bg-slate-800"
                                    : "opacity-50"
                                }`
                          }`}
                        >
                          {type.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="pt-3 flex gap-3">
                    <button
                      type="button"
                      onClick={onClose}
                      className="flex-1 py-2.5 text-sm font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-all"
                    >
                      Fechar
                    </button>
                    {!isReadOnly && (
                      <button
                        type="submit"
                        disabled={isSaving}
                        className="flex-[2] flex items-center justify-center gap-2 py-2.5 text-sm font-bold text-white bg-green-600 hover:bg-green-700 rounded-xl transition-all shadow-md shadow-green-200 dark:shadow-green-900/20 disabled:opacity-70 disabled:cursor-not-allowed"
                      >
                        {isSaving ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Salvando...
                          </>
                        ) : (
                          <>
                            <Save className="w-4 h-4" />
                            {mode === "create"
                              ? "Cadastrar Lead"
                              : "Salvar Alterações"}
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </form>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
