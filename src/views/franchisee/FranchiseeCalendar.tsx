import { useState, useEffect } from "react";
import FranchiseeLayout from "@/components/Franchisee/FranchiseeLayout";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  Plus,
  MapPin,
  Mail,
  Video,
  CheckCircle2,
  CalendarDays,
  Trash2,
  Pencil,
  Search,
  Users,
  Check,
  MessageCircle,
  Phone,
  X,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiClient } from "@/lib/apiClient";
import MessageModal from "@/components/Franchisee/MessageModal";

interface Lead {
  id: string;
  name: string;
  email: string;
  phone?: string;
}

interface MessageLead {
  id: string;
  name: string;
  email?: string;
  phone: string;
}

const DAYS_OF_WEEK = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const MONTHS = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
];

const url = apiClient.getBaseUrl();

// ---------------------------------------------------------------------------
// Utilitários
// ---------------------------------------------------------------------------

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

function storedToDisplay(stored: string): string {
  if (!stored) return "";
  return formatPhoneDisplay(onlyDigits(stored).slice(2));
}

const formatLocalYYYYMMDD = (d: Date) => {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(
    2,
    "0"
  )}-${String(d.getDate()).padStart(2, "0")}`;
};

export default function FranchiseeCalendar() {
  const { user } = useAuth();
  const { toast } = useToast();

  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<any[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);

  const [messageLead, setMessageLead] = useState<MessageLead | null>(null);

  const [newEvent, setNewEvent] = useState({
    title: "",
    date: "",
    time: "",
    type: "MEETING",
    leadId: "" as string,
    legacyContact: "",
    legacyEmail: "",
    legacyPhone: "",
  });

  useEffect(() => {
    if (user?.franchisee?.id) {
      fetchAppointments();
      fetchLeads();
    }
  }, [user?.franchisee?.id]);

  const fetchLeads = async () => {
    try {
      const res = await apiClient.get(
        `${url}/leads?franchiseeId=${user?.franchisee?.id}`
      );
      if (res.ok) {
        const data = await res.json();
        setLeads(data);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const fetchAppointments = async () => {
    try {
      const res = await apiClient.get(
        `${url}/appointments?franchiseeId=${user?.franchisee?.id}`
      );

      if (res.ok) {
        const data = await res.json();

        const formattedEvents = data.map((evt: any) => {
          let extractedLeadId = "";

          if (
            evt.leadIds &&
            Array.isArray(evt.leadIds) &&
            evt.leadIds.length > 0
          ) {
            extractedLeadId = evt.leadIds[0];
          } else if (
            evt.leads &&
            Array.isArray(evt.leads) &&
            evt.leads.length > 0
          ) {
            extractedLeadId = evt.leads[0].id;
          }

          const d = new Date(evt.startTime);

          return {
            ...evt,
            date: d,
            time: d.toLocaleTimeString("pt-BR", {
              hour: "2-digit",
              minute: "2-digit",
            }),
            leadId: extractedLeadId,
            legacyContact: evt.contactName,
            legacyEmail: evt.contactEmail,
            legacyPhone: evt.contactNumber || evt.whatsappNumbers || "",
          };
        });

        setEvents(formattedEvents);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const getDaysInMonth = (year: number, month: number) =>
    new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year: number, month: number) =>
    new Date(year, month, 1).getDay();
  const daysInMonth = getDaysInMonth(
    currentDate.getFullYear(),
    currentDate.getMonth()
  );
  const firstDay = getFirstDayOfMonth(
    currentDate.getFullYear(),
    currentDate.getMonth()
  );

  const handleMonthChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), parseInt(e.target.value), 1)
    );
  };
  const handleYearChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setCurrentDate(
      new Date(parseInt(e.target.value), currentDate.getMonth(), 1)
    );
  };
  const handlePrevMonth = () =>
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1)
    );
  const handleNextMonth = () =>
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1)
    );

  const toggleLeadSelection = (leadId: string) => {
    setNewEvent((prev) => {
      const isSelected = prev.leadId === leadId;
      if (isSelected) {
        return {
          ...prev,
          leadId: "",
          legacyContact: "",
          legacyEmail: "",
          legacyPhone: "",
        };
      } else {
        const selectedLead = leads.find((l) => l.id === leadId);
        return {
          ...prev,
          leadId: leadId,
          legacyContact: selectedLead?.name || "",
          legacyEmail: selectedLead?.email || "",
          legacyPhone: selectedLead?.phone || "",
        };
      }
    });
  };

  const filteredLeads = leads.filter(
    (lead) =>
      (lead.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (lead.email || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digits = onlyDigits(e.target.value).slice(0, 11);
    const stored = digits ? `+55${digits}` : "";
    setNewEvent((prev) => ({ ...prev, legacyPhone: stored }));
  };

  const handleDayClick = (day: number) => {
    const selectedDate = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth(),
      day
    );
    const dateString = formatLocalYYYYMMDD(selectedDate);

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (selectedDate < today) {
      toast({
        title: "Data inválida",
        description: "Não é possível agendar compromissos no passado.",
        variant: "destructive",
      });
      return;
    }

    setSelectedEventId(null);
    setSearchTerm("");
    setNewEvent({
      title: "",
      date: dateString,
      time: "",
      type: "MEETING",
      leadId: "",
      legacyContact: "",
      legacyEmail: "",
      legacyPhone: "",
    });
    setIsModalOpen(true);
  };

  const handleEditClick = (e: React.MouseEvent, event: any) => {
    e.stopPropagation();
    setSelectedEventId(event.id);

    const d =
      event.date instanceof Date ? event.date : new Date(event.startTime);
    const dateString = formatLocalYYYYMMDD(d);

    setSearchTerm("");

    setNewEvent({
      title: event.title,
      date: dateString,
      time: event.time,
      type: event.type,
      leadId: event.leadId || "",
      legacyContact: event.legacyContact || "",
      legacyEmail: event.legacyEmail || "",
      legacyPhone: event.legacyPhone || "",
    });

    setIsModalOpen(true);
  };

  const handleSaveEvent = async () => {
    if (!newEvent.title || !newEvent.date || !user?.franchisee?.id) return;

    const [year, month, day] = newEvent.date.split("-").map(Number);
    const [hours, minutes] = (newEvent.time || "09:00").split(":").map(Number);
    const localDateObj = new Date(year, month - 1, day, hours, minutes);

    const today = new Date();
    const todayMidnight = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate()
    );
    const selectedMidnight = new Date(year, month - 1, day);

    if (selectedMidnight < todayMidnight) {
      toast({
        title: "Erro",
        description: "Você não pode agendar para uma data passada.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    // Ajuste de fuso horário para enviar ao servidor
    const tzOffset = localDateObj.getTimezoneOffset();
    const offsetSign = tzOffset > 0 ? "-" : "+";
    const offsetHours = String(Math.floor(Math.abs(tzOffset) / 60)).padStart(
      2,
      "0"
    );
    const offsetMins = String(Math.abs(tzOffset) % 60).padStart(2, "0");

    const timeStr = `${String(hours).padStart(2, "0")}:${String(
      minutes
    ).padStart(2, "0")}`;
    const startDateTime = `${newEvent.date}T${timeStr}:00${offsetSign}${offsetHours}:${offsetMins}`;

    const payload = {
      title: newEvent.title,
      startTime: startDateTime,
      endTime: null,
      type: newEvent.type,
      leadIds: newEvent.leadId ? [newEvent.leadId] : [],
      contactName: newEvent.legacyContact || "Sem contato",
      contactEmail: newEvent.legacyEmail,
      contactNumber: newEvent.legacyPhone,
      description: `Agendado via Portal.`,
    };

    try {
      let response;
      const endpoint = selectedEventId
        ? `${url}/appointments/${selectedEventId}`
        : `${url}/appointments?franchiseeId=${user.franchisee.id}`;

      if (selectedEventId) {
        response = await apiClient.put(endpoint, payload);
      } else {
        response = await apiClient.post(endpoint, payload);
      }

      if (response.ok) {
        toast({
          title: selectedEventId ? "Atualizado! ✏️" : "Agendado! 📅",
          description: selectedEventId
            ? "Alterado com sucesso."
            : "Criado com sucesso.",
          className:
            "bg-green-50 border-green-200 text-green-800 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800",
        });

        setIsModalOpen(false);
        fetchAppointments();
      } else {
        toast({
          title: "Erro",
          description: "Falha ao salvar",
          variant: "destructive",
        });
      }
    } catch (e) {
      toast({
        title: "Erro",
        description: "Erro de conexão",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteEvent = async (idToDelete?: string) => {
    const id = idToDelete || selectedEventId;
    if (!id) return;

    setIsLoading(true);
    try {
      const response = await apiClient.delete(`${url}/appointments/${id}`);

      if (response.ok) {
        toast({ title: "Excluído", description: "Removido da agenda." });
        setIsModalOpen(false);
        fetchAppointments();
      } else {
        toast({ title: "Erro", variant: "destructive" });
      }
    } catch (e) {
      toast({ title: "Erro", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenMessageModal = (event: any) => {
    if (!event.legacyPhone) {
      toast({
        title: "Erro",
        description: "Telefone não disponível",
        variant: "destructive",
      });
      return;
    }

    setMessageLead({
      id: "",
      name: event.legacyContact || "Contato",
      email: event.legacyEmail || undefined,
      phone: event.legacyPhone,
    });
  };

  // --- NOVA FUNÇÃO DE ENVIO DE E-MAIL (Backend) ---
  const handleSendReminder = async (event: any) => {
    if (!event.legacyEmail) {
      toast({
        title: "Erro",
        description: "E-mail não disponível para este contato.",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Enviando...",
      description: "Solicitando o envio do e-mail...",
    });

    try {
      // Faz o POST para o endpoint responsável por disparar o e-mail daquele agendamento
      const response = await apiClient.post(
        `${url}/appointments/${event.id}/send-email`,
        {}
      );

      if (response.ok) {
        toast({
          title: "Enviado! ✉️",
          description: `Lembrete enviado para ${event.legacyEmail}`,
          className:
            "bg-green-50 border-green-200 text-green-800 dark:bg-green-900/30 dark:text-green-400",
        });
      } else {
        toast({
          title: "Erro",
          description: "O backend não conseguiu enviar o e-mail.",
          variant: "destructive",
        });
      }
    } catch (e) {
      toast({
        title: "Erro",
        description: "Erro de conexão ao tentar enviar o e-mail.",
        variant: "destructive",
      });
    }
  };

  const years = Array.from(
    { length: 10 },
    (_, i) => new Date().getFullYear() - 2 + i
  );

  return (
    <FranchiseeLayout>
      <div className="p-4 sm:p-8 max-w-7xl mx-auto space-y-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              Minha Agenda
            </h1>
            <p className="text-slate-500 dark:text-slate-400 font-medium">
              Gerencie seus compromissos e visitas
            </p>
          </div>

          <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
            <DialogTrigger asChild>
              <Button
                onClick={() => {
                  setSelectedEventId(null);
                  setNewEvent({
                    title: "",
                    date: formatLocalYYYYMMDD(new Date()),
                    time: "",
                    type: "MEETING",
                    leadId: "",
                    legacyContact: "",
                    legacyEmail: "",
                    legacyPhone: "",
                  });
                }}
                className="bg-green-600 hover:bg-green-700 text-white px-6 h-12 rounded-2xl font-bold shadow-lg shadow-green-200 dark:shadow-none transition-all hover:scale-105 active:scale-95 flex gap-2"
              >
                <Plus className="w-5 h-5" /> Novo Agendamento
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[450px] rounded-3xl border-0 shadow-2xl p-0 overflow-hidden bg-white dark:bg-slate-900">
              <DialogHeader className="p-6 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                <DialogTitle className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                  {selectedEventId ? (
                    <>
                      <Pencil className="w-5 h-5 text-green-600" /> Editar
                      Compromisso
                    </>
                  ) : (
                    <>
                      <CalendarIcon className="w-5 h-5 text-green-600" /> Novo
                      Agendamento
                    </>
                  )}
                </DialogTitle>
              </DialogHeader>

              <div className="p-6 space-y-4 max-h-[80vh] overflow-y-auto scrollbar-thin">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase ml-1">
                    Título do Evento
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Reunião de Apresentação"
                    className="w-full bg-slate-50 dark:bg-slate-800 border-0 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-green-500 outline-none transition-all dark:text-white"
                    value={newEvent.title}
                    onChange={(e) =>
                      setNewEvent({ ...newEvent, title: e.target.value })
                    }
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase ml-1">
                      Data
                    </label>
                    <input
                      type="date"
                      className="w-full bg-slate-50 dark:bg-slate-800 border-0 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-green-500 outline-none transition-all dark:text-white"
                      value={newEvent.date}
                      onChange={(e) =>
                        setNewEvent({ ...newEvent, date: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase ml-1">
                      Horário
                    </label>
                    <input
                      type="time"
                      className="w-full bg-slate-50 dark:bg-slate-800 border-0 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-green-500 outline-none transition-all dark:text-white"
                      value={newEvent.time}
                      onChange={(e) =>
                        setNewEvent({ ...newEvent, time: e.target.value })
                      }
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase ml-1">
                    Tipo
                  </label>
                  <div className="flex gap-2">
                    <button
                      onClick={() =>
                        setNewEvent({ ...newEvent, type: "MEETING" })
                      }
                      className={`flex-1 p-2 rounded-lg text-sm font-bold border transition-all ${
                        newEvent.type === "MEETING"
                          ? "bg-blue-100 border-blue-200 text-blue-700 dark:bg-blue-900/30 dark:border-blue-800 dark:text-blue-400"
                          : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400"
                      }`}
                    >
                      Reunião
                    </button>
                    <button
                      onClick={() =>
                        setNewEvent({ ...newEvent, type: "VISIT" })
                      }
                      className={`flex-1 p-2 rounded-lg text-sm font-bold border transition-all ${
                        newEvent.type === "VISIT"
                          ? "bg-purple-100 border-purple-200 text-purple-700 dark:bg-purple-900/30 dark:border-purple-800 dark:text-purple-400"
                          : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400"
                      }`}
                    >
                      Visita
                    </button>
                  </div>
                </div>

                <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase ml-1 flex items-center gap-2">
                    <Users className="w-3 h-3" /> Informações de Contato
                  </label>

                  <div className="space-y-1.5">
                    <div className="relative">
                      <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Nome do Contato"
                        className="w-full bg-slate-50 dark:bg-slate-800 border-0 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:ring-2 focus:ring-green-500 outline-none transition-all dark:text-white"
                        value={newEvent.legacyContact}
                        onChange={(e) =>
                          setNewEvent({
                            ...newEvent,
                            legacyContact: e.target.value,
                          })
                        }
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        type="email"
                        placeholder="E-mail"
                        className="w-full bg-slate-50 dark:bg-slate-800 border-0 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:ring-2 focus:ring-green-500 outline-none transition-all dark:text-white"
                        value={newEvent.legacyEmail}
                        onChange={(e) =>
                          setNewEvent({
                            ...newEvent,
                            legacyEmail: e.target.value,
                          })
                        }
                      />
                    </div>

                    <div className="flex rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-green-500 bg-slate-50 dark:bg-slate-800">
                      <span className="flex items-center px-3 text-slate-500 dark:text-slate-400 text-sm font-semibold border-r border-slate-200 dark:border-slate-700 select-none whitespace-nowrap">
                        +55
                      </span>
                      <input
                        type="tel"
                        placeholder="(00) 00000-0000"
                        className="flex-1 px-3 py-2.5 bg-transparent text-sm outline-none dark:text-white placeholder:text-slate-400"
                        value={storedToDisplay(newEvent.legacyPhone)}
                        onChange={handlePhoneChange}
                      />
                    </div>
                  </div>
                </div>

                {!selectedEventId && (
                  <div className="pt-2">
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase flex items-center gap-2">
                        <Search className="w-3 h-3" />
                        Vincular Lead
                      </label>
                      {newEvent.leadId && (
                        <button
                          onClick={() =>
                            setNewEvent({
                              ...newEvent,
                              leadId: "",
                              legacyContact: "",
                              legacyEmail: "",
                              legacyPhone: "",
                            })
                          }
                          className="text-[10px] text-red-500 hover:text-red-600 font-bold flex items-center gap-1"
                        >
                          <X className="w-3 h-3" /> Remover Vínculo
                        </button>
                      )}
                    </div>

                    <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden bg-slate-50 dark:bg-slate-800/50">
                      <div className="flex items-center px-3 py-2 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
                        <Search className="w-4 h-4 text-slate-400 mr-2 flex-shrink-0" />
                        <input
                          type="text"
                          placeholder="Buscar lead para vincular..."
                          className="flex-1 bg-transparent text-sm focus:outline-none text-slate-700 dark:text-slate-200 w-full placeholder:text-slate-400"
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                        />
                      </div>

                      <div className="max-h-[140px] overflow-y-auto p-1 space-y-1 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-700">
                        {filteredLeads.length > 0 ? (
                          filteredLeads.map((lead) => {
                            const isSelected = newEvent.leadId === lead.id;
                            return (
                              <div
                                key={lead.id}
                                onClick={() => toggleLeadSelection(lead.id)}
                                className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition-colors text-sm ${
                                  isSelected
                                    ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
                                    : "hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300"
                                }`}
                              >
                                <div className="flex flex-col overflow-hidden w-full pr-2">
                                  <span
                                    className="font-bold truncate"
                                    title={lead.name}
                                  >
                                    {lead.name}
                                  </span>
                                  <span
                                    className="text-xs opacity-70 truncate"
                                    title={lead.email}
                                  >
                                    {lead.email}
                                  </span>
                                </div>
                                {isSelected && (
                                  <Check className="w-4 h-4 text-green-600 dark:text-green-400 flex-shrink-0" />
                                )}
                              </div>
                            );
                          })
                        ) : (
                          <div className="text-center py-4 text-xs text-slate-400">
                            {leads.length === 0
                              ? "Nenhum lead cadastrado."
                              : "Não encontrado."}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex gap-2 mt-4 pt-2 border-t border-slate-100 dark:border-slate-800">
                  {selectedEventId && (
                    <Button
                      onClick={() => handleDeleteEvent()}
                      disabled={isLoading}
                      className="bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/40 h-12 rounded-xl px-3"
                    >
                      <Trash2 className="w-5 h-5" />
                    </Button>
                  )}
                  <Button
                    onClick={handleSaveEvent}
                    disabled={isLoading}
                    className="flex-1 bg-green-600 hover:bg-green-700 h-12 rounded-xl font-bold text-white"
                  >
                    {isLoading ? "Salvando..." : "Confirmar"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <Card className="lg:col-span-2 border-0 shadow-xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl dark:shadow-black/20">
            <CardHeader className="border-b border-slate-100 dark:border-slate-800 p-6">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <select
                    value={currentDate.getMonth()}
                    onChange={handleMonthChange}
                    className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-lg font-bold rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-500 cursor-pointer"
                  >
                    {MONTHS.map((month, index) => (
                      <option key={month} value={index}>
                        {month}
                      </option>
                    ))}
                  </select>
                  <select
                    value={currentDate.getFullYear()}
                    onChange={handleYearChange}
                    className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-lg font-bold rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-500 cursor-pointer"
                  >
                    {years.map((year) => (
                      <option key={year} value={year}>
                        {year}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handlePrevMonth}
                    className="rounded-xl border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 dark:text-slate-400"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handleNextMonth}
                    className="rounded-xl border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 dark:text-slate-400"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-7 mb-4">
                {DAYS_OF_WEEK.map((day) => (
                  <div
                    key={day}
                    className="text-center text-sm font-bold text-slate-400 dark:text-slate-500 uppercase"
                  >
                    {day}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-2 sm:gap-3">
                {Array.from({ length: firstDay }).map((_, i) => (
                  <div key={`empty-${i}`} className="min-h-[100px]" />
                ))}
                {Array.from({ length: daysInMonth }).map((_, i) => {
                  const day = i + 1;
                  const dayEvents = events.filter(
                    (e) =>
                      e.date.getDate() === day &&
                      e.date.getMonth() === currentDate.getMonth() &&
                      e.date.getFullYear() === currentDate.getFullYear()
                  );

                  const today = new Date();
                  const isToday =
                    day === today.getDate() &&
                    currentDate.getMonth() === today.getMonth() &&
                    currentDate.getFullYear() === today.getFullYear();

                  return (
                    <div
                      key={day}
                      onClick={() => handleDayClick(day)}
                      className={`min-h-[100px] border rounded-2xl p-2 cursor-pointer flex flex-col justify-between group relative overflow-hidden transition-all 
                        ${
                          isToday
                            ? "bg-green-50/40 border-green-500 ring-2 ring-green-100 dark:ring-green-900/50 z-10"
                            : "bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 hover:border-green-300 dark:hover:border-green-700 hover:bg-slate-50 dark:hover:bg-slate-800 hover:shadow-lg"
                        }`}
                    >
                      <div className="flex justify-between items-start">
                        <span
                          className={`text-sm font-bold w-7 h-7 flex items-center justify-center rounded-full transition-colors 
                            ${
                              isToday
                                ? "bg-green-600 text-white shadow-md scale-110"
                                : "bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 group-hover:text-green-600 dark:group-hover:text-green-400 group-hover:bg-green-100 dark:group-hover:bg-green-900/30"
                            }`}
                        >
                          {day}
                        </span>
                        <Plus className="w-4 h-4 text-green-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                      <div className="flex flex-col gap-1 mt-2">
                        {dayEvents.slice(0, 3).map((ev) => (
                          <div
                            key={ev.id}
                            onClick={(e) => handleEditClick(e, ev)}
                            className={`text-[9px] truncate px-1.5 py-1 rounded-md font-bold shadow-sm hover:opacity-80 transition-opacity 
                              ${
                                ev.type === "VISIT"
                                  ? "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300"
                                  : "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
                              }`}
                          >
                            {ev.time}{" "}
                            {ev.type === "VISIT" ? "Visita" : "Reunião"}
                          </div>
                        ))}
                        {dayEvents.length > 3 && (
                          <span className="text-[10px] text-slate-400 font-medium pl-1">
                            +{dayEvents.length - 3} mais
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card className="border-0 shadow-xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl h-full flex flex-col dark:shadow-black/20">
              <CardHeader className="border-b border-slate-100 dark:border-slate-800 p-6">
                <CardTitle className="text-lg font-bold flex gap-2 text-slate-900 dark:text-white">
                  <CalendarDays className="w-5 h-5 text-green-600 dark:text-green-400" />{" "}
                  Próximos
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-4 flex-1 overflow-y-auto max-h-[600px] scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-700">
                {events.length === 0 && (
                  <p className="text-center text-slate-400 py-10">
                    Agenda livre! Nenhum compromisso.
                  </p>
                )}

                {events
                  .sort((a, b) => a.date.getTime() - b.date.getTime())
                  .filter(
                    (e) => e.date >= new Date(new Date().setHours(0, 0, 0, 0))
                  )
                  .map((event) => (
                    <div
                      key={event.id}
                      className="group p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm relative hover:border-green-200 dark:hover:border-green-800 transition-all"
                    >
                      <div
                        className={`absolute left-0 top-4 bottom-4 w-1 rounded-r-full ${
                          event.type === "VISIT"
                            ? "bg-purple-500"
                            : "bg-blue-500"
                        }`}
                      ></div>
                      <div className="pl-3">
                        <div className="flex justify-between items-start mb-1">
                          <div
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase ${
                              event.type === "VISIT"
                                ? "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400"
                                : "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                            }`}
                          >
                            {event.type === "VISIT" ? "Visita" : "Reunião"}
                          </div>
                        </div>

                        <h4 className="font-bold text-sm text-slate-800 dark:text-white">
                          {event.title}
                        </h4>
                        <div className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5 mb-2 flex items-center gap-2">
                          <span>{event.date.toLocaleDateString()}</span>
                          <span className="w-1 h-1 bg-slate-300 dark:bg-slate-600 rounded-full"></span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" /> {event.time}
                          </span>
                        </div>

                        <div className="space-y-1 mt-2 mb-3">
                          <div className="text-xs text-slate-700 dark:text-slate-300 font-bold flex items-center gap-1.5">
                            <Users className="w-3 h-3 text-slate-400" />
                            {event.legacyContact || "Sem contato"}
                          </div>
                          {event.legacyEmail && (
                            <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                              <Mail className="w-3 h-3 text-slate-400" />
                              {event.legacyEmail}
                            </div>
                          )}
                          {event.legacyPhone && (
                            <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                              <Phone className="w-3 h-3 text-slate-400" />
                              +55 {storedToDisplay(event.legacyPhone)}
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-1.5 pt-2 border-t border-slate-50 dark:border-slate-800">
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8 rounded-lg border-slate-200 dark:border-slate-700 hover:bg-green-50 dark:hover:bg-green-900/30 hover:text-green-600 dark:hover:text-green-400 hover:border-green-200 dark:hover:border-green-800"
                            onClick={() => handleOpenMessageModal(event)}
                            title="Enviar WhatsApp"
                          >
                            <MessageCircle className="w-4 h-4" />
                          </Button>

                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8 rounded-lg border-slate-200 dark:border-slate-700 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 hover:text-emerald-600 dark:hover:text-emerald-400 hover:border-emerald-200 dark:hover:border-emerald-800"
                            onClick={() => handleSendReminder(event)}
                            title="Enviar E-mail"
                          >
                            <Mail className="w-4 h-4" />
                          </Button>

                          <div className="flex-1"></div>

                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-lg hover:bg-green-50 dark:hover:bg-slate-800 text-slate-400 hover:text-green-600 dark:hover:text-green-400"
                            onClick={(e) => handleEditClick(e, event)}
                            title="Editar"
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>

                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-slate-400 hover:text-red-600 dark:hover:text-red-400"
                            onClick={() => handleDeleteEvent(event.id)}
                            title="Remover"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {user?.franchisee?.id && (
        <MessageModal
          isOpen={!!messageLead}
          onClose={() => setMessageLead(null)}
          lead={messageLead}
          onSendMessage={async () => {}}
          FranchiseeId={user.franchisee.id}
        />
      )}
    </FranchiseeLayout>
  );
}
