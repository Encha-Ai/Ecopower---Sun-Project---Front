import { useState, useEffect, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Loader2,
  User,
  DollarSign,
  FileText,
  Search,
  Check,
  X,
  Filter,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

import { apiClient } from "@/lib/apiClient";

const url = apiClient.getBaseUrl();

interface CreateDealModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  franchiseeId: string;
  initialLeadId?: string; // <--- NOVA PROPRIEDADE
}

type Lead = {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  leadType: "LEAD" | "CLIENT" | "CONTACT";
};

export default function CreateDealModal({
  open,
  onClose,
  onSuccess,
  franchiseeId,
  initialLeadId = "", // <--- VALOR PADRÃO
}: CreateDealModalProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [leads, setLeads] = useState<Lead[]>([]);

  const [title, setTitle] = useState("");
  const [value, setValue] = useState("");
  const [selectedLeadId, setSelectedLeadId] = useState("");

  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<"ALL" | "LEAD" | "CLIENT" | "CONTACT">("ALL");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  useEffect(() => {
    if (open && franchiseeId) {
      fetchLeads();
      setSearchTerm("");
      setFilterType("ALL");
      // SE TIVER ID INICIAL, JÁ SELECIONA ELE
      setSelectedLeadId(initialLeadId); 
      setIsDropdownOpen(false);
    }
  }, [open, franchiseeId, initialLeadId]);

  const fetchLeads = async () => {
    try {
      const response = await apiClient.get(
        `${url}/leads?franchiseeId=${franchiseeId}`
      );

      if (response.ok) {
        const data = await response.json();
        const normalizedLeads = data.map((item: any) => ({
          id: item.id,
          name: item.name || "Sem Nome",
          email: item.email || "",
          phone: item.phone || "",
          leadType: (item.leadType || item.type || "LEAD")
            .toString()
            .trim()
            .toUpperCase() as "LEAD" | "CLIENT" | "CONTACT",
        }));
        setLeads(normalizedLeads);
      }
    } catch (error) {
      console.error("Erro ao buscar leads", error);
    }
  };

  const filteredLeads = useMemo(() => {
    return leads.filter((lead) => {
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch =
        (lead.name?.toLowerCase() || "").includes(searchLower) ||
        (lead.email?.toLowerCase() || "").includes(searchLower) ||
        (lead.phone || "").includes(searchLower);
      const matchesType = filterType === "ALL" || lead.leadType === filterType;
      return matchesSearch && matchesType;
    });
  }, [leads, searchTerm, filterType]);

  const selectedLeadObj = leads.find((l) => l.id === selectedLeadId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedLeadId || !title || !value) {
      toast({ title: "Preencha todos os campos", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const payload = {
        leadId: selectedLeadId,
        title: title,
        value: parseFloat(value),
        content: "Criado via Kanban",
        status: "NEW_LEAD",
        contactInfo: "WHATSAPP",
      };
      const response = await apiClient.post(
        `${url}/deals?franchiseeId=${franchiseeId}`,
        payload,
      );

      if (!response.ok) throw new Error("Erro ao criar");

      toast({
        title: "Negócio criado com sucesso! 🚀",
        className: "bg-green-600 text-white border-none",
      });
      onSuccess();
      onClose();

      setTitle("");
      setValue("");
      setSelectedLeadId("");
    } catch (error) {
      toast({ title: "Erro ao criar negócio", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[550px] bg-white dark:bg-slate-900 dark:border-slate-800 flex flex-col max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-slate-800 dark:text-white">
            Novo Negócio
          </DialogTitle>
          <DialogDescription className="text-slate-500 dark:text-slate-400">
            Selecione um lead e preencha os dados da oportunidade.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 mt-2 flex-1 overflow-y-auto pr-2 scrollbar-thin">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-600 dark:text-slate-300 flex items-center gap-2">
              <User className="w-4 h-4" /> Cliente / Lead
            </label>

            {!isDropdownOpen ? (
              <div
                onClick={() => setIsDropdownOpen(true)}
                className={`w-full p-3 border rounded-xl bg-slate-50 dark:bg-slate-950 cursor-pointer flex items-center justify-between transition-all hover:border-green-400 ${
                  selectedLeadId
                    ? "border-green-500 ring-1 ring-green-500/20"
                    : "border-slate-200 dark:border-slate-700"
                }`}
              >
                <span className={selectedLeadId ? "text-slate-900 dark:text-white font-medium" : "text-slate-400"}>
                  {selectedLeadObj ? selectedLeadObj.name : "Clique para selecionar um cliente..."}
                </span>
                <Search className="w-4 h-4 text-slate-400" />
              </div>
            ) : (
              <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden bg-white dark:bg-slate-950 shadow-lg animate-in fade-in zoom-in-95 duration-200">
                <div className="p-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900">
                  <div className="flex items-center gap-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2">
                    <Search className="w-4 h-4 text-slate-400" />
                    <input
                      autoFocus
                      type="text"
                      placeholder="Buscar..."
                      className="flex-1 bg-transparent outline-none text-sm text-slate-700 dark:text-slate-200 placeholder:text-slate-400"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <button type="button" onClick={() => setIsDropdownOpen(false)} className="text-slate-400 hover:text-red-500">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="flex gap-2 mt-2 overflow-x-auto pb-1 no-scrollbar items-center">
                    <Filter className="w-3 h-3 text-slate-400 shrink-0" />
                    {["ALL", "CONTACT", "LEAD", "CLIENT"].map((t) => (
                         <button key={t} type="button" onClick={() => setFilterType(t as any)} className={`px-3 py-1.5 rounded-lg text-xs font-bold border ${filterType === t ? "bg-slate-800 text-white" : "bg-white dark:bg-slate-800 text-slate-500"}`}>{t}</button>
                    ))}
                  </div>
                </div>
                <div className="max-h-[220px] overflow-y-auto scrollbar-thin p-1">
                  {filteredLeads.length === 0 ? (
                    <div className="p-6 text-center text-sm text-slate-500">Nenhum lead encontrado.</div>
                  ) : (
                    filteredLeads.map((lead) => (
                      <div
                        key={lead.id}
                        onClick={() => { setSelectedLeadId(lead.id); setIsDropdownOpen(false); }}
                        className={`p-3 rounded-lg cursor-pointer flex justify-between ${selectedLeadId === lead.id ? "bg-green-50 border-green-200" : "hover:bg-slate-50"}`}
                      >
                        <div>
                            <p className="text-sm font-bold text-slate-800 dark:text-white">{lead.name}</p>
                            <p className="text-xs text-slate-500">{lead.email || lead.phone}</p>
                        </div>
                        {selectedLeadId === lead.id && <Check className="w-4 h-4 text-green-600" />}
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-600 dark:text-slate-300 flex items-center gap-2">
              <FileText className="w-4 h-4" /> Título
            </label>
            <input type="text" placeholder="Ex: Instalação Solar" value={title} onChange={(e) => setTitle(e.target.value)} className="w-full p-3 border rounded-xl bg-slate-50 dark:bg-slate-950 dark:text-white" required />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-600 dark:text-slate-300 flex items-center gap-2">
              <DollarSign className="w-4 h-4" /> Valor (R$)
            </label>
            <input type="number" placeholder="0.00" value={value} onChange={(e) => setValue(e.target.value)} className="w-full p-3 border rounded-xl bg-slate-50 dark:bg-slate-950 dark:text-white" required />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <button type="button" onClick={onClose} className="px-4 py-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 rounded-lg font-medium">Cancelar</button>
            <button type="submit" disabled={loading || !selectedLeadId} className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium flex items-center gap-2">
              {loading && <Loader2 className="w-4 h-4 animate-spin" />} Criar Negócio
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}