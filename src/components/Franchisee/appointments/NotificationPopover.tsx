import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, CalendarDays, CheckCircle2, Clock, Trash2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

import { apiClient } from "@/lib/apiClient";

const url = apiClient.getBaseUrl();

type Appointment = {
  id: string;
  title: string;
  dateObj: Date;
  timeStr: string;
  contact: string;
  type: string;
  location?: string;
  isUrgent: boolean; 
  isOngoing: boolean; 
};

export function NotificationPopover() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [isOpen, setIsOpen] = useState(false);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [hasImminent, setHasImminent] = useState(false);
  const [loading, setLoading] = useState(false);

  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchAppointments = useCallback(
    async (isAutoRefresh = false) => {
      if (!user?.franchisee?.id) return;

      if (!isAutoRefresh && appointments.length === 0) setLoading(true);

      try {
        const res = await apiClient.get(
          `${url}/appointments?franchiseeId=${user.franchisee.id}`,
        );

        if (res.ok) {
          const data = await res.json();
          const now = new Date();

          const processed = data.map((evt: any) => {
            let dateObj = new Date();
            const raw = evt.startTime || evt.start || evt.startDate || evt.date;

            if (raw) {
              if (Array.isArray(raw)) {
                const [year, month, day, hour, minute] = raw;
                dateObj = new Date(
                  year,
                  month - 1,
                  day,
                  hour || 0,
                  minute || 0,
                );
              } else {
                dateObj = new Date(raw);
              }
            }
            return { ...evt, dateObj };
          });

          const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
          const twentyFourHoursFromNow = new Date(
            now.getTime() + 24 * 60 * 60 * 1000,
          );

          const activeList = processed
            .filter((evt: any) => {
              const d = evt.dateObj;
              return d >= oneHourAgo && d <= twentyFourHoursFromNow;
            })
            .map((evt: any) => {
              const diff = evt.dateObj.getTime() - now.getTime();
              const isUrgent = diff > 0 && diff <= 15 * 60 * 1000;
              const isOngoing = diff <= 0 && Math.abs(diff) < 60 * 60 * 1000;

              return {
                id: evt.id,
                title: evt.title,
                dateObj: evt.dateObj,
                timeStr: evt.dateObj.toLocaleTimeString("pt-BR", {
                  hour: "2-digit",
                  minute: "2-digit",
                }),
                contact: evt.contactName || evt.contact,
                type: evt.type || "MEETING",
                location: evt.location,
                isUrgent,
                isOngoing,
              } as Appointment;
            })
            .sort(
              (a: Appointment, b: Appointment) =>
                a.dateObj.getTime() - b.dateObj.getTime(),
            );

          setAppointments(activeList);
          setHasImminent(
            activeList.some((a: Appointment) => a.isUrgent || a.isOngoing),
          );
        }
      } catch (error) {
        console.error("Erro ao buscar notificações", error);
      } finally {
        if (!isAutoRefresh) setLoading(false);
      }
    },
    [user?.franchisee?.id],
  );

  useEffect(() => {
    fetchAppointments(true);
    const interval = setInterval(() => {
      fetchAppointments(true);
    }, 60000);
    return () => clearInterval(interval);
  }, [fetchAppointments]);

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!confirm("Tem certeza que deseja remover este agendamento?")) return;

    try {
      const res = await apiClient.delete(`${url}/appointments/${id}`);

      if (res.ok) {
        setAppointments((prev) => {
          const newList = prev.filter((app) => app.id !== id);
          setHasImminent(newList.some((a) => a.isUrgent || a.isOngoing));
          return newList;
        });
        toast({ title: "Removido", description: "Agendamento excluído." });
      }
    } catch (error) {
      console.error("Erro ao deletar", error);
    }
  };

  const getDisplayDate = (date: Date) => {
    const today = new Date();
    const isToday =
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth();
    return isToday ? "Hoje" : "Amanhã";
  };

  return (
    <div className="relative" ref={popoverRef}>
      <button
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen) fetchAppointments(false);
        }}
        className="relative p-2 rounded-xl transition-all group"
      >
        <Bell
          className={`h-5 w-5 transition-colors ${isOpen || hasImminent ? "text-green-600" : "text-slate-500 group-hover:text-green-600"}`}
        />

        {hasImminent && (
          <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-transparent animate-pulse shadow-sm" />
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-4 w-80 sm:w-96 bg-white dark:bg-slate-900 backdrop-blur-xl rounded-2xl shadow-2xl shadow-green-900/10 border border-slate-200/60 dark:border-slate-700/60 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200 origin-top-right">
          <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center">
            <h3 className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2 text-sm">
              <CalendarDays className="w-4 h-4 text-green-600" />
              Próximas 24 horas
            </h3>
            {appointments.length > 0 && (
              <span className="text-[10px] font-bold bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400 px-2 py-1 rounded-full">
                {appointments.length}
              </span>
            )}
          </div>

          <div className="max-h-[320px] overflow-y-auto p-2 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-700">
            {loading ? (
              <div className="p-8 text-center text-slate-400 text-xs">
                <span className="animate-pulse">Atualizando agenda...</span>
              </div>
            ) : appointments.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-sm">
                <CheckCircle2 className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>Agenda livre por enquanto.</p>
                <p className="text-xs opacity-70 mt-1">
                  Nenhum compromisso nas próximas 24h.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {appointments.map((app) => (
                  <div
                    key={app.id}
                    className={`group p-3 rounded-xl border transition-all cursor-pointer flex gap-3 items-start relative pr-8 ${
                      app.isUrgent || app.isOngoing
                        ? "bg-red-50/40 border-red-100 hover:border-red-200 dark:bg-red-900/10 dark:border-red-900/30"
                        : "bg-slate-50/50 hover:bg-green-50/30 border-slate-100 hover:border-green-200 dark:bg-slate-800/30 dark:border-slate-700 dark:hover:border-green-700"
                    }`}
                    onClick={() => {
                      setIsOpen(false);
                      navigate("/franchisee/calendar");
                    }}
                  >
                    <div
                      className={`shrink-0 w-10 h-10 rounded-lg flex flex-col items-center justify-center shadow-sm border ${
                        app.isUrgent || app.isOngoing
                          ? "text-red-500 border-red-200 dark:border-red-800"
                          : "border-slate-200 text-slate-600 dark:border-slate-600 dark:text-slate-400"
                      }`}
                    >
                      <span className="text-[10px] font-bold leading-none">
                        {app.dateObj.getDate()}
                      </span>
                      <span className="text-[8px] uppercase">
                        {app.dateObj
                          .toLocaleString("pt-BR", { month: "short" })
                          .replace(".", "")}
                      </span>
                    </div>

                    <div className="flex-1 min-w-0">
                      <p
                        className={`text-sm font-bold truncate ${app.isUrgent || app.isOngoing ? "text-red-700 dark:text-red-400" : "text-slate-800 dark:text-slate-200 group-hover:text-green-700 dark:group-hover:text-green-400"}`}
                      >
                        {app.title}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 truncate mb-1">
                        {app.contact}
                      </p>
                      <div className="flex items-center gap-2">
                        <span
                          className={`flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full border ${
                            app.isOngoing
                              ? "text-emerald-600 bg-emerald-50 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800"
                              : app.isUrgent
                                ? "text-red-600 bg-red-100 border-red-200 animate-pulse dark:bg-red-900/20 dark:text-red-400 dark:border-red-800"
                                : "text-amber-600 bg-amber-50 border-amber-100 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800"
                          }`}
                        >
                          <Clock className="w-3 h-3" />
                          {app.isOngoing
                            ? "Em andamento"
                            : `${app.timeStr} - ${getDisplayDate(app.dateObj)}`}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={(e) => handleDelete(e, app.id)}
                      className="absolute right-2 top-2 p-1.5 rounded-full text-slate-300 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-500 transition-all opacity-0 group-hover:opacity-100"
                      title="Remover"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="p-3 border-t border-slate-100 dark:border-slate-700 text-center">
            <button
              onClick={() => {
                setIsOpen(false);
                navigate("/franchisee/calendar");
              }}
              className="text-xs font-semibold text-green-600 hover:text-green-700 hover:underline transition-colors"
            >
              Ver calendário completo
            </button>
          </div>
        </div>
      )}
    </div>
  );
}