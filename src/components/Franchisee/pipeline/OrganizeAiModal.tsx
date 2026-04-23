import { useState, useEffect, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Loader2,
  Sparkles,
  CheckSquare,
  Square,
  Search,
  X,
  Phone,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { apiClient } from "@/lib/apiClient";

interface OrganizeAiModalProps {
  isOpen: boolean;
  onClose: () => void;
  leads: any[];
  pipelineId: string;
  onSuccess: () => void;
}

const url = apiClient.getBaseUrl();

/** Formata número bruto (ex: 5561992861746) para exibição legível */
function formatPhone(phone: string): string {
  if (!phone) return "Sem telefone";
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 13) {
    return `+${digits.slice(0, 2)} (${digits.slice(2, 4)}) ${digits.slice(4, 9)}-${digits.slice(9)}`;
  }
  if (digits.length === 12) {
    return `+${digits.slice(0, 2)} (${digits.slice(2, 4)}) ${digits.slice(4, 8)}-${digits.slice(8)}`;
  }
  return phone;
}

export default function OrganizeAiModal({
  isOpen,
  onClose,
  leads,
  pipelineId,
  onSuccess,
}: OrganizeAiModalProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (isOpen) {
      setSelectedIds(new Set());
      setSearch("");
    }
  }, [isOpen]);

  const filteredLeads = useMemo(() => {
    const term = search.toLowerCase().trim();
    if (!term) return leads;
    return leads.filter(
      (l) =>
        l.name?.toLowerCase().includes(term) ||
        l.leadType?.toLowerCase().includes(term) ||
        l.phone?.toLowerCase().includes(term),
    );
  }, [leads, search]);

  const toggleSelect = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedIds(newSet);
  };

  const allFilteredSelected =
    filteredLeads.length > 0 &&
    filteredLeads.every((l) => selectedIds.has(l.id));

  const toggleAll = () => {
    const newSet = new Set(selectedIds);
    if (allFilteredSelected) {
      filteredLeads.forEach((l) => newSet.delete(l.id));
    } else {
      filteredLeads.forEach((l) => newSet.add(l.id));
    }
    setSelectedIds(newSet);
  };

  const handleConfirm = async () => {
    if (selectedIds.size === 0) return;
    setIsLoading(true);

    try {
      const res = await apiClient.post(
        `${url}/api/pipelines/${pipelineId}/organize-ai`,
        Array.from(selectedIds),
      );

      if (res.ok) {
        onSuccess();
        onClose();
      } else {
        alert("Erro ao organizar com IA.");
      }
    } catch (error) {
      console.error("Erro:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col p-0 overflow-hidden bg-background">
        {/* HEADER VERDE */}
        <div className="bg-gradient-to-r from-green-500 to-green-600 dark:from-green-600 dark:to-green-700 p-6 text-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <Sparkles className="w-6 h-6 text-green-100" />
              Organizar Funil com IA
            </DialogTitle>
            <DialogDescription className="text-green-100 mt-1">
              Selecione os leads. A IA lerá as mensagens e organizará os cards
              automaticamente.
            </DialogDescription>
          </DialogHeader>
        </div>

        {/* BUSCA */}
        <div className="px-4 pt-4 pb-2 bg-background border-b border-border">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            <Input
              placeholder="Buscar por nome, tipo ou telefone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-9"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* SELECT ALL */}
        <div className="px-4 py-2 border-b border-border bg-muted flex justify-between items-center">
          <button
            onClick={toggleAll}
            className="flex items-center gap-2 text-sm font-bold text-foreground hover:text-green-600 transition-colors"
            disabled={filteredLeads.length === 0}
          >
            {allFilteredSelected ? (
              <CheckSquare className="w-5 h-5 text-green-600" />
            ) : (
              <Square className="w-5 h-5 text-muted-foreground" />
            )}
            {search
              ? `Selecionar visíveis (${filteredLeads.length})`
              : `Selecionar Todos (${leads.length})`}
          </button>

          <span className="text-xs text-muted-foreground">
            {selectedIds.size} selecionados
            {search && filteredLeads.length !== leads.length && (
              <span className="ml-1 text-muted-foreground/60">
                · {filteredLeads.length} de {leads.length} exibidos
              </span>
            )}
          </span>
        </div>

        {/* LISTA */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2 bg-muted/40">
          {filteredLeads.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              {search
                ? `Nenhum lead encontrado para "${search}".`
                : "Nenhum lead neste funil."}
            </div>
          ) : (
            filteredLeads.map((lead) => (
              <div
                key={lead.id}
                className={`flex items-start gap-3 p-3 bg-card border rounded-lg transition-all cursor-pointer hover:shadow-sm ${
                  selectedIds.has(lead.id)
                    ? "border-green-400 ring-1 ring-green-200 dark:ring-green-900/40"
                    : "border-border"
                }`}
                onClick={() => toggleSelect(lead.id)}
              >
                <Checkbox
                  checked={selectedIds.has(lead.id)}
                  onCheckedChange={() => toggleSelect(lead.id)}
                  className="mt-1"
                />

                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center gap-2">
                    <p className="font-bold text-sm text-foreground truncate">
                      {lead.name}
                    </p>
                    <Badge
                      variant="outline"
                      className="shrink-0 text-[10px] h-5 border-green-300 text-green-700 dark:text-green-400"
                    >
                      {lead.leadType}
                    </Badge>
                  </div>

                  <div className="flex items-center gap-1 mt-1">
                    <Phone className="w-3 h-3 text-muted-foreground shrink-0" />
                    <span className="text-xs text-muted-foreground">
                      {formatPhone(lead.phone)}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* FOOTER */}
        <DialogFooter className="p-4 bg-background border-t border-border">
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancelar
          </Button>

          <Button
            onClick={handleConfirm}
            disabled={isLoading || selectedIds.size === 0}
            className="
              bg-gradient-to-r 
              from-green-500 to-green-600 
              hover:from-green-600 hover:to-green-700
              text-white 
              font-bold 
              gap-2 
              min-w-[140px]
              shadow-md hover:shadow-lg
              transition-all duration-200
            "
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4" />
            )}
            {isLoading ? "Organizando..." : "Iniciar IA"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
