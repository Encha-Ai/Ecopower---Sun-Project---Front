import React, { Fragment, useState, useEffect } from "react";
import { Dialog, Transition } from "@headlessui/react";
import {
  X,
  UserPlus,
  Search,
  CheckSquare,
  Square,
  Loader2,
  CheckCircle2,
  Filter, // Ícone do filtro
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type Lead = {
  id: string;
  name: string;
  email: string;
  phone: string;
};

type AddLeadsModalProps = {
  isOpen: boolean;
  onClose: () => void;
  pipelineId: string;
  franchiseeId: string;
  onSuccess: () => void;
  existingLeadIds?: string[];
};

export default function AddLeadsModal({
  isOpen,
  onClose,
  pipelineId,
  franchiseeId,
  onSuccess,
  existingLeadIds = [],
}: AddLeadsModalProps) {
  const token = (() => {
    const user = localStorage.getItem("currentUser");
    return user ? `Bearer ${JSON.parse(user).token}` : null;
  })();

  const url =
    (window as any).RUNTIME_CONFIG?.BACKEND_URL ??
    import.meta.env.VITE_BACKEND_URL_DEV ??
    import.meta.env.VITE_BACKEND_URL_PROD;

  if (!url) {
    throw new Error("Backend URL não definida");
  }

  const { toast } = useToast();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // States de Filtro
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<"ALL" | "AVAILABLE" | "IMPORTED">("ALL");

  useEffect(() => {
    if (isOpen && franchiseeId) {
      fetchLeads();
      setSelectedIds([]);
      setSearchTerm("");
      setFilterStatus("ALL"); // Reseta o filtro ao abrir
    }
  }, [isOpen, franchiseeId]);

  const fetchLeads = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(
        `${url}/api/pipelines/leads/available?franchiseeId=${franchiseeId}`,
        {
          headers: {
            Authorization: token || "",
          },
        },
      );
      if (res.ok) {
        setLeads(await res.json());
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  // --- LÓGICA DE FILTRAGEM ATUALIZADA ---
  const filteredLeads = leads.filter((lead) => {
    // 1. Filtro de Texto
    const matchesSearch =
      lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (lead.email && lead.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (lead.phone && lead.phone.includes(searchTerm));

    // 2. Filtro de Status (Importado/Disponível)
    const isImported = existingLeadIds.includes(lead.id);
    let matchesStatus = true;

    if (filterStatus === "AVAILABLE") {
      matchesStatus = !isImported; // Mostra apenas se NÃO estiver importado
    } else if (filterStatus === "IMPORTED") {
      matchesStatus = isImported;  // Mostra apenas se JÁ estiver importado
    }

    return matchesSearch && matchesStatus;
  });

  const toggleSelect = (id: string) => {
    if (existingLeadIds.includes(id)) return; // Bloqueia seleção de importados

    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

  const toggleSelectAll = () => {
    // Seleciona apenas os visíveis que NÃO são importados
    const selectableLeads = filteredLeads.filter(l => !existingLeadIds.includes(l.id));
    
    // Verifica se todos os selecionáveis já estão marcados
    const allSelected = selectableLeads.length > 0 && selectableLeads.every(l => selectedIds.includes(l.id));

    if (allSelected) {
      // Remove apenas os IDs visíveis da seleção (mantém outros que possam estar selecionados mas ocultos pelo filtro)
      const visibleIds = selectableLeads.map(l => l.id);
      setSelectedIds(prev => prev.filter(id => !visibleIds.includes(id)));
    } else {
      // Adiciona os IDs visíveis à seleção existente (sem duplicar)
      const newIds = selectableLeads.map(l => l.id);
      setSelectedIds(prev => [...new Set([...prev, ...newIds])]);
    }
  };

  const handleSave = async () => {
    if (selectedIds.length === 0) return;
    setIsSaving(true);
    try {
      const res = await fetch(
        `${url}/api/pipelines/${pipelineId}/add-leads-batch`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: token || "" },
          body: JSON.stringify(selectedIds),
        },
      );

      if (res.ok) {
        toast({
          title: "Sucesso",
          description: `${selectedIds.length} leads importados para o funil.`,
          className: "bg-green-50 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800",
        });
        onSuccess();
        onClose();
      } else {
        throw new Error();
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Falha ao importar leads.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-[9999]" onClose={onClose}>
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" />
        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Dialog.Panel className="w-full max-w-3xl transform overflow-hidden rounded-2xl bg-white dark:bg-slate-900 shadow-xl transition-all flex flex-col max-h-[85vh] border border-slate-200 dark:border-slate-800">
              {/* Header */}
              <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <UserPlus className="w-5 h-5 text-green-600 dark:text-green-400" />
                  Importar Leads em Massa
                </h3>
                <button onClick={onClose}>
                  <X className="w-5 h-5 text-slate-400 hover:text-red-500 transition-colors" />
                </button>
              </div>

              {/* Barra de Ferramentas (Busca + Filtro + Selecionar Todos) */}
              <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row gap-3 bg-white dark:bg-slate-900">
                
                {/* Input de Busca */}
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400 dark:text-slate-500" />
                  <input
                    type="text"
                    placeholder="Buscar nome, email..."
                    className="w-full pl-9 pr-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none focus:ring-2 focus:ring-green-500 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-200 placeholder:text-slate-400"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>

                {/* Filtro de Status */}
                <div className="relative min-w-[160px]">
                  <Filter className="absolute left-3 top-2.5 h-4 w-4 text-slate-400 dark:text-slate-500 pointer-events-none" />
                  <select 
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value as any)}
                    className="w-full pl-9 pr-8 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none focus:ring-2 focus:ring-green-500 bg-white dark:bg-slate-950 text-slate-700 dark:text-slate-200 appearance-none cursor-pointer"
                  >
                    <option value="ALL">Todos</option>
                    <option value="AVAILABLE">Apenas Disponíveis</option>
                    <option value="IMPORTED">Já Importados</option>
                  </select>
                </div>

                {/* Botão Selecionar Todos */}
                <button
                  onClick={toggleSelectAll}
                  disabled={filterStatus === "IMPORTED"} // Desabilita se estiver vendo apenas importados
                  className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg whitespace-nowrap transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {/* Lógica do texto do botão */}
                  {selectedIds.length > 0 && 
                   filteredLeads.filter(l => !existingLeadIds.includes(l.id)).every(l => selectedIds.includes(l.id))
                    ? "Desmarcar Visíveis" 
                    : "Marcar Visíveis"}
                </button>
              </div>

              {/* Lista */}
              <div className="flex-1 overflow-y-auto p-2 dark:bg-slate-900 min-h-[300px]">
                {isLoading ? (
                  <div className="flex flex-col items-center justify-center h-full gap-2">
                    <Loader2 className="w-8 h-8 animate-spin text-green-500" />
                    <span className="text-sm text-slate-500">Carregando leads...</span>
                  </div>
                ) : filteredLeads.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full gap-2 text-slate-400 dark:text-slate-500">
                    <Search className="w-10 h-10 opacity-20" />
                    <p>Nenhum lead encontrado com esses filtros.</p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    {filteredLeads.map((lead) => {
                      const isImported = existingLeadIds.includes(lead.id);
                      const isSelected = selectedIds.includes(lead.id);

                      return (
                        <div
                          key={lead.id}
                          onClick={() => toggleSelect(lead.id)}
                          className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${
                            isImported 
                              ? "bg-slate-50 dark:bg-slate-800/40 border-transparent opacity-60 cursor-not-allowed" // Estilo Importado
                              : isSelected
                                ? "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 cursor-pointer" // Estilo Selecionado
                                : "bg-white dark:bg-slate-900 border-transparent hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer" // Estilo Normal
                          }`}
                        >
                          {/* Ícone de Estado */}
                          <div className="shrink-0">
                             {isImported ? (
                                <CheckCircle2 className="w-5 h-5 text-slate-400 dark:text-slate-500" />
                             ) : isSelected ? (
                                <CheckSquare className="w-5 h-5 text-green-600 dark:text-green-400" />
                             ) : (
                                <Square className="w-5 h-5 text-slate-300 dark:text-slate-600" />
                             )}
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                                <p className={`text-sm font-medium truncate ${
                                    isSelected ? "text-green-900 dark:text-green-100" : "text-slate-700 dark:text-slate-200"
                                }`}>
                                {lead.name}
                                </p>
                                {isImported && (
                                    <span className="text-[10px] bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400 px-2 py-0.5 rounded-full font-bold uppercase tracking-wide">
                                        No Pipeline
                                    </span>
                                )}
                            </div>
                            <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
                              {lead.email} {lead.email && lead.phone && "•"} {lead.phone}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex justify-between items-center">
                <span className="text-sm text-slate-500 dark:text-slate-400 font-medium">
                  {selectedIds.length} leads selecionados
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={onClose}
                    className="px-4 py-2 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={selectedIds.length === 0 || isSaving}
                    className="px-6 py-2 text-sm font-bold text-white bg-green-600 hover:bg-green-700 rounded-lg disabled:opacity-50 disabled:grayscale flex items-center gap-2 transition-all shadow-md dark:shadow-none"
                  >
                    {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
                    Importar Selecionados
                  </button>
                </div>
              </div>
            </Dialog.Panel>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}