import { useState, useEffect, useMemo } from "react";
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
} from "@hello-pangea/dnd";
import {
  Plus,
  MoreHorizontal,
  Users,
  MessageCircle,
  FileText,
  Download,
  TrendingUp,
  DollarSign,
  Calculator,
  Trash2,
  AlertTriangle,
  Calendar,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import FranchiseeLayout from "@/components/Franchisee/FranchiseeLayout";
import CreateDealModal from "@/components/kanban/CreateDealModal";
import MessageModal from "@/components/Franchisee/MessageModal";

import jsPDF from "jspdf";
import html2canvas from "html2canvas";

import { apiClient } from "@/lib/apiClient";

// --- CONFIGURAÇÃO DAS COLUNAS ---
const COLUMNS: Record<string, { title: string; colorBg: string; hex: string }> =
  {
    NEW_LEAD: { title: "Novos Leads", colorBg: "bg-blue-500", hex: "#3b82f6" },
    QUALIFIED: {
      title: "Qualificado",
      colorBg: "bg-indigo-500",
      hex: "#6366f1",
    },
    VISIT_SCHEDULED: {
      title: "Visita Agendada",
      colorBg: "bg-purple-500",
      hex: "#a855f7",
    },
    PROPOSAL_SENT: {
      title: "Proposta Enviada",
      colorBg: "bg-orange-500",
      hex: "#f97316",
    },
    NEGOTIATION: {
      title: "Negociação",
      colorBg: "bg-amber-500",
      hex: "#f59e0b",
    },
    CLOSED_WON: {
      title: "Venda Fechada",
      colorBg: "bg-emerald-500",
      hex: "#10b981",
    },
    CLOSED_LOST: { title: "Perdido", colorBg: "bg-red-500", hex: "#ef4444" },
  };

const formatMoney = (value: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
    value,
  );

const formatPhone = (phone: string) => {
  if (!phone) return "---";
  return phone
    .replace(/\D/g, "")
    .replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3");
};

const formatDoc = (doc: string) => {
  if (!doc) return "---";
  const clean = doc.replace(/\D/g, "");
  return clean.length > 11
    ? clean.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5")
    : clean.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
};

const url = apiClient.getBaseUrl();

interface MessageLead {
  id: string;
  name: string;
  email?: string;
  phone: string;
}

export default function KanbanPage() {
  const { user } = useAuth();
  const { toast } = useToast();

  const [deals, setDeals] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [openNewDeal, setOpenNewDeal] = useState(false);

  const [timeFilter, setTimeFilter] = useState("ALL");

  const [reportData, setReportData] = useState<any | null>(null);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [reportType, setReportType] = useState<"SINGLE" | "FULL">("SINGLE");
  const [isDownloading, setIsDownloading] = useState(false);

  const [dealToDelete, setDealToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [messageLead, setMessageLead] = useState<MessageLead | null>(null);

  const franchiseeId = user?.franchisee?.id;

  useEffect(() => {
    if (franchiseeId) fetchDeals();
  }, [franchiseeId]);

  const fetchDeals = async () => {
    try {
      const response = await apiClient.get(
        `${url}/deals?franchiseeId=${franchiseeId}`,
      );
      if (!response.ok) throw new Error("Falha ao buscar dados");
      const data = await response.json();
      const validStatuses = Object.keys(COLUMNS);
      setDeals(data.filter((d: any) => validStatuses.includes(d.status)));
    } catch (error) {
      console.error(error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar o pipeline.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const filteredDeals = useMemo(() => {
    if (timeFilter === "ALL") return deals;
    const daysAgo = parseInt(timeFilter);
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysAgo);
    return deals.filter((deal) => {
      if (!deal.createdAt) return false;
      const dealDate = new Date(deal.createdAt);
      return dealDate >= cutoffDate;
    });
  }, [deals, timeFilter]);

  const pipelineValue = useMemo(() => {
    return filteredDeals
      .filter((d) => d.status !== "CLOSED_LOST" && d.status !== "CLOSED_WON")
      .reduce((acc, d) => acc + (d.value || 0), 0);
  }, [filteredDeals]);

  const wonValue = useMemo(() => {
    return filteredDeals
      .filter((d) => d.status === "CLOSED_WON")
      .reduce((acc, d) => acc + (d.value || 0), 0);
  }, [filteredDeals]);

  const lostValue = useMemo(() => {
    return filteredDeals
      .filter((d) => d.status === "CLOSED_LOST")
      .reduce((acc, d) => acc + (d.value || 0), 0);
  }, [filteredDeals]);

  const avgTicket = useMemo(() => {
    const wonCount = filteredDeals.filter(
      (d) => d.status === "CLOSED_WON",
    ).length;
    if (wonCount === 0) return 0;
    return wonValue / wonCount;
  }, [filteredDeals, wonValue]);

  const confirmDelete = async () => {
    if (!dealToDelete) return;
    setIsDeleting(true);
    try {
      const response = await apiClient.delete(`${url}/deals/${dealToDelete}`);
      if (!response.ok) throw new Error("Erro ao deletar");
      setDeals((prev) => prev.filter((d) => d.id !== dealToDelete));
      toast({
        title: "Negócio excluído",
        description: "O card foi removido do funil.",
      });
    } catch (error) {
      toast({ title: "Erro ao excluir", variant: "destructive" });
    } finally {
      setIsDeleting(false);
      setDealToDelete(null);
    }
  };

  const onDragEnd = async (result: DropResult) => {
    if (!result.destination) return;
    const { source, destination, draggableId } = result;
    if (
      source.droppableId === destination.droppableId &&
      source.index === destination.index
    )
      return;

    const originalDeals = [...deals];
    const updatedDeals = deals.map((d) => {
      if (d.id === draggableId)
        return { ...d, status: destination.droppableId };
      return d;
    });
    setDeals(updatedDeals);

    try {
      const response = await apiClient.patch(
        `${url}/deals/${draggableId}/status`,
        { status: destination.droppableId },
      );
      if (!response.ok) throw new Error("Erro");
      toast({
        title: "Status atualizado!",
        className: "text-green-800 border-green-200",
      });
    } catch (error) {
      toast({ title: "Erro ao mover card", variant: "destructive" });
      setDeals(originalDeals);
    }
  };

  const generateSingleReport = (deal: any) => {
    const summary = {
      type: "SINGLE",
      title: "Dossiê Completo do Negócio",
      generatedAt: new Date().toLocaleString("pt-BR"),
      deal: {
        id: deal.id.slice(0, 8).toUpperCase(),
        title: deal.title,
        value: formatMoney(deal.value),
        status: COLUMNS[deal.status]?.title || deal.status,
        color: COLUMNS[deal.status]?.hex || "#000",
        createdAt: new Date(deal.createdAt).toLocaleDateString("pt-BR"),
        description: deal.content || "Nenhuma observação registrada.",
      },
      client: {
        name: deal.lead?.name || "Cliente Não Identificado",
        email: deal.lead?.email || "---",
        phone: deal.lead?.phone ? formatPhone(deal.lead.phone) : "---",
        doc:
          deal.lead?.cpf || deal.lead?.cnpj
            ? formatDoc(deal.lead?.cpf || deal.lead?.cnpj)
            : "---",
        location: deal.lead?.municipality
          ? `${deal.lead.municipality} - ${deal.lead.uf}`
          : "Localização não informada",
        origin: deal.lead?.origin || "Desconhecido",
        type: deal.lead?.type || "Lead",
      },
      timeline: [
        { event: "Cadastro do Lead", date: deal.lead?.createdAt },
        { event: "Abertura do Negócio", date: deal.createdAt },
        { event: "Última Interação", date: deal.updatedAt },
      ],
    };
    setReportData(summary);
    setReportType("SINGLE");
    setIsReportOpen(true);
  };

  const generateFullReport = () => {
    const sourceDeals = filteredDeals;
    const wonCount = sourceDeals.filter(
      (d) => d.status === "CLOSED_WON",
    ).length;
    const totalValue = sourceDeals.reduce((acc, d) => acc + (d.value || 0), 0);

    const breakdown = Object.keys(COLUMNS)
      .map((key) => {
        const stageDeals = sourceDeals.filter((d) => d.status === key);
        const stageValue = stageDeals.reduce(
          (acc, d) => acc + (d.value || 0),
          0,
        );
        const count = stageDeals.length;
        return {
          stage: COLUMNS[key].title,
          count,
          countShare:
            sourceDeals.length > 0 ? (count / sourceDeals.length) * 100 : 0,
          valueShare: totalValue > 0 ? (stageValue / totalValue) * 100 : 0,
          value: formatMoney(stageValue),
          color: COLUMNS[key].hex,
          avgTicket: count > 0 ? formatMoney(stageValue / count) : "R$ 0,00",
        };
      })
      .filter((d) => d.count > 0);

    const summary = {
      type: "FULL",
      title: "Extrato Financeiro de Vendas",
      generatedAt: new Date().toLocaleString("pt-BR"),
      period:
        timeFilter === "ALL" ? "Todo o período" : `Últimos ${timeFilter} dias`,
      kpis: {
        totalDeals: sourceDeals.length,
        activeValue: formatMoney(pipelineValue),
        wonValue: formatMoney(wonValue),
        lostValue: formatMoney(lostValue),
        avgTicket: wonCount > 0 ? formatMoney(wonValue / wonCount) : "R$ 0,00",
      },
      breakdown,
      rows: sourceDeals.map((d) => ({
        dealName: d.title,
        clientName: d.lead?.name,
        contact: d.lead?.phone
          ? formatPhone(d.lead.phone)
          : d.lead?.email || "-",
        stage: COLUMNS[d.status]?.title,
        value: formatMoney(d.value),
        entryDate: new Date(d.createdAt).toLocaleDateString("pt-BR"),
      })),
    };
    setReportData(summary);
    setReportType("FULL");
    setIsReportOpen(true);
  };

  const handleDownloadPDF = async () => {
    const input = document.getElementById("report-content");
    if (!input) return;
    setIsDownloading(true);
    try {
      const canvas = await html2canvas(input, {
        scale: 2,
        backgroundColor: "#ffffff",
        useCORS: true,
      });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });
      const imgWidth = 210;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      pdf.addImage(imgData, "PNG", 0, 0, imgWidth, imgHeight);
      pdf.save(`relatorio_vendas_${new Date().getTime()}.pdf`);
      toast({ title: "PDF Gerado!", className: "bg-green-50 text-green-700" });
    } catch (error) {
      toast({ title: "Erro ao gerar PDF", variant: "destructive" });
    } finally {
      setIsDownloading(false);
    }
  };

  const getDealsByStatus = (status: string) =>
    filteredDeals.filter((deal) => deal.status === status);

  return (
    <FranchiseeLayout scrollable={false}>
      <div className="flex flex-col h-full bg-slate-50/50 dark:bg-slate-950 transition-colors duration-300">
        {/* HEADER */}
        <div className="p-6 pb-2 shrink-0">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div>
              <h1 className="text-2xl font-black text-slate-900 dark:text-white">
                Relatório de Vendas
              </h1>
              <p className="text-slate-500 dark:text-slate-400 font-medium text-sm">
                Gerencie suas oportunidades
              </p>
            </div>
            <div className="flex gap-2 items-center">
              <div className="flex items-center gap-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2 h-10 shadow-sm">
                <Calendar className="w-4 h-4 text-slate-500" />
                <Select value={timeFilter} onValueChange={setTimeFilter}>
                  <SelectTrigger className="border-none shadow-none focus:ring-0 w-[110px] h-8 bg-transparent text-xs font-bold text-slate-700 dark:text-slate-300 p-0">
                    <SelectValue placeholder="Período" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7">Últimos 7 dias</SelectItem>
                    <SelectItem value="30">Últimos 30 dias</SelectItem>
                    <SelectItem value="90">Últimos 90 dias</SelectItem>
                    <SelectItem value="ALL">Todo o período</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="h-6 w-px bg-slate-300 dark:bg-slate-700 hidden md:block mx-1" />

              <Button
                variant="outline"
                className="gap-2 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
                onClick={generateFullReport}
              >
                <FileText className="w-4 h-4" /> Relatório
              </Button>
              <Button
                onClick={() => setOpenNewDeal(true)}
                className="bg-green-600 hover:bg-green-700 text-white gap-2 shadow-lg shadow-green-200 dark:shadow-none"
              >
                <Plus className="w-5 h-5" /> Novo Negócio
              </Button>
            </div>
          </div>

          {/* Metrics Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-2">
            <Card className="text-slate-900 dark:text-white border-0 shadow-lg relative overflow-hidden">
              <div className="absolute top-0 right-0 w-20 h-20 bg-white/5 rounded-full -mr-10 -mt-10 blur-2xl" />
              <CardHeader className="pb-2 relative z-10 p-4">
                <CardTitle className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Total ({timeFilter === "ALL" ? "Geral" : `${timeFilter}d`})
                </CardTitle>
              </CardHeader>
              <CardContent className="relative z-10 p-4 pt-0">
                <div className="text-2xl font-bold">{filteredDeals.length}</div>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
                  Negócios registrados
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm">
              <CardHeader className="pb-2 p-4">
                <CardTitle className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Em Pauta (Ativos)
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <div
                  className="text-xl font-bold text-blue-600 dark:text-blue-400 truncate"
                  title={formatMoney(pipelineValue)}
                >
                  {formatMoney(pipelineValue)}
                </div>
                <p className="text-[10px] text-slate-400 mt-1">
                  Exclui ganhos/perdidos
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm">
              <CardHeader className="pb-2 p-4">
                <CardTitle className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Vendas Fechadas
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <div
                  className="text-xl font-bold text-emerald-600 dark:text-emerald-400 truncate"
                  title={formatMoney(wonValue)}
                >
                  {formatMoney(wonValue)}
                </div>
                <p className="text-[10px] text-slate-400 mt-1">
                  Receita garantida
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm">
              <CardHeader className="pb-2 p-4">
                <CardTitle className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Ticket Médio
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <div
                  className="text-xl font-bold text-purple-600 dark:text-purple-400 truncate"
                  title={formatMoney(avgTicket)}
                >
                  {formatMoney(avgTicket)}
                </div>
                <p className="text-[10px] text-slate-400 mt-1">
                  Média por venda fechada
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm border-l-4 border-l-red-500">
              <CardHeader className="pb-2 p-4">
                <CardTitle className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Valor Perdido
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <div
                  className="text-xl font-bold text-red-500 dark:text-red-400 truncate"
                  title={formatMoney(lostValue)}
                >
                  {formatMoney(lostValue)}
                </div>
                <p className="text-[10px] text-slate-400 mt-1">
                  Encerrados sem sucesso
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* KANBAN BOARD */}
        <div className="flex-1 overflow-x-auto overflow-y-hidden px-6 pb-6">
          <DragDropContext onDragEnd={onDragEnd}>
            <div className="flex h-full gap-5 min-w-max pb-2">
              {Object.entries(COLUMNS).map(([columnId, column]) => {
                const columnDeals = getDealsByStatus(columnId);
                return (
                  <div
                    key={columnId}
                    className="flex flex-col w-[300px] shrink-0 h-full"
                  >
                    <div className="flex items-center justify-between mb-3 px-1 shrink-0">
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-2.5 h-2.5 rounded-full shadow-sm ${column.colorBg}`}
                        />
                        <h3 className="font-bold text-slate-700 dark:text-slate-300 uppercase text-xs tracking-wider">
                          {column.title}
                        </h3>
                        <span className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm">
                          {columnDeals.length}
                        </span>
                      </div>
                    </div>
                    <Droppable droppableId={columnId}>
                      {(provided, snapshot) => (
                        <div
                          {...provided.droppableProps}
                          ref={provided.innerRef}
                          className={`flex-1 rounded-2xl transition-all p-2 overflow-y-auto custom-scrollbar ${
                            snapshot.isDraggingOver
                              ? "bg-green-50 dark:bg-green-900/20"
                              : "bg-slate-100/50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800"
                          }`}
                        >
                          {columnDeals.map((deal, index) => (
                            <Draggable
                              key={deal.id}
                              draggableId={deal.id}
                              index={index}
                            >
                              {(provided, snapshot) => (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  {...provided.dragHandleProps}
                                  className={`mb-3 group ${
                                    snapshot.isDragging
                                      ? "rotate-2 scale-105 z-50"
                                      : ""
                                  }`}
                                  style={{ ...provided.draggableProps.style }}
                                >
                                  <Card className="border-0 shadow-sm hover:shadow-md transition-all bg-white dark:bg-slate-800 relative">
                                    <CardContent className="p-4">
                                      <div className="flex justify-between items-start mb-2">
                                        <Badge
                                          variant="secondary"
                                          className="text-[9px] font-bold px-2 py-0.5 bg-slate-50 dark:bg-slate-700 text-slate-500 dark:text-slate-300 border border-slate-100 dark:border-slate-600"
                                        >
                                          {deal.lead?.origin || "Lead"}
                                        </Badge>
                                        <DropdownMenu>
                                          <DropdownMenuTrigger asChild>
                                            <Button
                                              variant="ghost"
                                              className="h-6 w-6 p-0 -mr-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                                            >
                                              <MoreHorizontal className="w-4 h-4" />
                                            </Button>
                                          </DropdownMenuTrigger>
                                          <DropdownMenuContent
                                            align="end"
                                            className="dark:bg-slate-900 dark:border-slate-800"
                                          >
                                            <DropdownMenuLabel className="dark:text-slate-300">
                                              Ações
                                            </DropdownMenuLabel>
                                            <DropdownMenuSeparator className="dark:bg-slate-800" />
                                            <DropdownMenuItem
                                              onClick={() =>
                                                generateSingleReport(deal)
                                              }
                                              className="dark:text-slate-300 dark:focus:bg-slate-800 cursor-pointer"
                                            >
                                              <FileText className="mr-2 h-4 w-4" />{" "}
                                              Gerar Dossiê PDF
                                            </DropdownMenuItem>
                                            <DropdownMenuItem
                                              onClick={() =>
                                                setDealToDelete(deal.id)
                                              }
                                              className="text-red-600 dark:text-red-400 dark:focus:bg-red-900/20 cursor-pointer"
                                            >
                                              <Trash2 className="mr-2 h-4 w-4" />{" "}
                                              Excluir
                                            </DropdownMenuItem>
                                          </DropdownMenuContent>
                                        </DropdownMenu>
                                      </div>
                                      <h4 className="font-bold text-slate-800 dark:text-slate-200 mb-0.5 line-clamp-1 text-sm">
                                        {deal.lead?.name || "Cliente"}
                                      </h4>
                                      <p className="text-xs text-slate-400 mb-2 truncate max-w-full">
                                        {deal.title}
                                      </p>
                                      <p className="text-emerald-600 dark:text-emerald-400 font-black text-base mb-3 truncate">
                                        {formatMoney(deal.value || 0)}
                                      </p>
                                      <div className="flex items-center justify-between pt-3 border-t border-slate-50 dark:border-slate-700">
                                        <div className="flex items-center gap-1.5 text-xs text-slate-400">
                                          <Users className="w-3 h-3" />
                                          <span>Resp.</span>
                                        </div>
                                        {deal.lead?.phone ? (
                                          <button
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              setMessageLead({
                                                id: deal.lead.id,
                                                name: deal.lead.name,
                                                email: deal.lead.email,
                                                phone: deal.lead.phone,
                                              });
                                            }}
                                            className="w-7 h-7 flex items-center justify-center rounded-full bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400 hover:scale-110 hover:bg-green-100 dark:hover:bg-green-900/50 transition-all"
                                            title="Enviar mensagem via WhatsApp"
                                          >
                                            <MessageCircle className="w-3.5 h-3.5" />
                                          </button>
                                        ) : (
                                          <div className="h-7 w-7" />
                                        )}
                                      </div>
                                    </CardContent>
                                  </Card>
                                </div>
                              )}
                            </Draggable>
                          ))}
                          {provided.placeholder}
                        </div>
                      )}
                    </Droppable>
                  </div>
                );
              })}
            </div>
          </DragDropContext>
        </div>
      </div>

      {/* --- MODAL DE CONFIRMAÇÃO DE EXCLUSÃO --- */}
      <Dialog open={!!dealToDelete} onOpenChange={() => setDealToDelete(null)}>
        <DialogContent className="sm:max-w-[400px] bg-white dark:bg-slate-900 dark:border-slate-800">
          <DialogHeader>
            <div className="mx-auto w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-3">
              <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
            </div>
            <DialogTitle className="text-center text-slate-900 dark:text-white">
              Excluir Negócio?
            </DialogTitle>
            <DialogDescription className="text-center text-slate-500 dark:text-slate-400">
              Esta ação é irreversível. O negócio será removido permanentemente
              do seu funil.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex justify-center gap-2 sm:justify-center mt-2">
            <Button
              variant="outline"
              onClick={() => setDealToDelete(null)}
              disabled={isDeleting}
              className="dark:bg-slate-800 dark:border-slate-700 dark:text-white dark:hover:bg-slate-700"
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDelete}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {isDeleting ? "Excluindo..." : "Sim, excluir"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* --- MODAL DE RELATÓRIO OFICIAL --- */}
      <Dialog open={isReportOpen} onOpenChange={setIsReportOpen}>
        <DialogContent className="max-w-5xl max-h-[92vh] overflow-y-auto bg-slate-100 dark:bg-slate-950 dark:border-slate-800 p-4">
          {/* Área imprimível */}
          <div
            id="report-content"
            className="bg-white text-slate-800 rounded-xl shadow-sm"
            style={{ padding: "48px 56px", minWidth: "860px" }}
          >
            {/* ── CABEÇALHO ── */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                borderBottom: "3px solid #0f172a",
                paddingBottom: "24px",
                marginBottom: "36px",
              }}
            >
              <div
                style={{ display: "flex", alignItems: "center", gap: "16px" }}
              >
                <div
                  style={{
                    width: "56px",
                    height: "56px",
                    background: "#0f172a",
                    borderRadius: "14px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Calculator
                    style={{ width: "30px", height: "30px", color: "#fff" }}
                  />
                </div>
                <div>
                  <h2
                    style={{
                      fontSize: "26px",
                      fontWeight: 900,
                      color: "#0f172a",
                      textTransform: "uppercase",
                      letterSpacing: "-0.5px",
                      lineHeight: 1,
                      marginBottom: "4px",
                    }}
                  >
                    {reportData?.title}
                  </h2>
                  <p
                    style={{
                      fontSize: "12px",
                      color: "#64748b",
                      fontWeight: 600,
                    }}
                  >
                    Relatório Oficial • EnergySolar CRM
                  </p>
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <p
                  style={{
                    fontSize: "10px",
                    color: "#94a3b8",
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                  }}
                >
                  Emitido em
                </p>
                <p
                  style={{
                    fontSize: "15px",
                    fontWeight: 800,
                    color: "#0f172a",
                    marginTop: "2px",
                  }}
                >
                  {reportData?.generatedAt}
                </p>
                <p
                  style={{
                    fontSize: "10px",
                    fontWeight: 700,
                    color: "#94a3b8",
                    marginTop: "4px",
                    textTransform: "uppercase",
                  }}
                >
                  Período:{" "}
                  {timeFilter === "ALL"
                    ? "Completo"
                    : `Últimos ${timeFilter} dias`}
                </p>
              </div>
            </div>

            {/* ── RELATÓRIO INDIVIDUAL (SINGLE) ── */}
            {reportType === "SINGLE" && reportData?.deal && (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "32px",
                }}
              >
                {/* Valor + Status */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "16px",
                  }}
                >
                  <div
                    style={{
                      background: "#f8fafc",
                      border: "1px solid #e2e8f0",
                      borderRadius: "16px",
                      padding: "24px",
                    }}
                  >
                    <p
                      style={{
                        fontSize: "10px",
                        fontWeight: 700,
                        color: "#64748b",
                        textTransform: "uppercase",
                        marginBottom: "6px",
                      }}
                    >
                      Valor da Oportunidade
                    </p>
                    <p
                      style={{
                        fontSize: "38px",
                        fontWeight: 900,
                        color: "#059669",
                        letterSpacing: "-1px",
                        wordBreak: "break-all",
                      }}
                    >
                      {reportData.deal.value}
                    </p>
                  </div>
                  <div
                    style={{
                      background: "#0f172a",
                      borderRadius: "16px",
                      padding: "24px",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "center",
                      alignItems: "flex-end",
                    }}
                  >
                    <p
                      style={{
                        fontSize: "10px",
                        fontWeight: 700,
                        color: "#94a3b8",
                        textTransform: "uppercase",
                        marginBottom: "6px",
                      }}
                    >
                      Status Atual
                    </p>
                    <p
                      style={{
                        fontSize: "22px",
                        fontWeight: 800,
                        color: "#fff",
                      }}
                    >
                      {reportData.deal.status}
                    </p>
                    <p
                      style={{
                        fontSize: "10px",
                        color: "#475569",
                        fontFamily: "monospace",
                        marginTop: "6px",
                      }}
                    >
                      REF: {reportData.deal.id}
                    </p>
                  </div>
                </div>

                {/* Dados do Cliente + Detalhes */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "32px",
                  }}
                >
                  <div>
                    <h3
                      style={{
                        fontSize: "11px",
                        fontWeight: 900,
                        color: "#0f172a",
                        textTransform: "uppercase",
                        borderBottom: "1px solid #e2e8f0",
                        paddingBottom: "8px",
                        marginBottom: "16px",
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                      }}
                    >
                      <Users
                        style={{
                          width: "14px",
                          height: "14px",
                          color: "#16a34a",
                          flexShrink: 0,
                        }}
                      />
                      Dados do Cliente
                    </h3>
                    {[
                      ["Nome", reportData.client.name],
                      ["Documento", reportData.client.doc],
                      ["Email", reportData.client.email],
                      ["Telefone", reportData.client.phone],
                      ["Localização", reportData.client.location],
                      ["Origem", reportData.client.origin],
                    ].map(([label, value]) => (
                      <div
                        key={label}
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "flex-start",
                          borderBottom: "1px solid #f1f5f9",
                          paddingBottom: "8px",
                          marginBottom: "8px",
                          gap: "12px",
                        }}
                      >
                        <span
                          style={{
                            fontSize: "12px",
                            color: "#64748b",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {label}
                        </span>
                        <span
                          style={{
                            fontSize: "12px",
                            fontWeight: 600,
                            color: "#0f172a",
                            textAlign: "right",
                            wordBreak: "break-word",
                          }}
                        >
                          {value}
                        </span>
                      </div>
                    ))}
                  </div>
                  <div>
                    <h3
                      style={{
                        fontSize: "11px",
                        fontWeight: 900,
                        color: "#0f172a",
                        textTransform: "uppercase",
                        borderBottom: "1px solid #e2e8f0",
                        paddingBottom: "8px",
                        marginBottom: "16px",
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                      }}
                    >
                      <FileText
                        style={{
                          width: "14px",
                          height: "14px",
                          color: "#7c3aed",
                          flexShrink: 0,
                        }}
                      />
                      Detalhes do Projeto
                    </h3>
                    <div
                      style={{
                        background: "#f8fafc",
                        border: "1px solid #e2e8f0",
                        borderRadius: "12px",
                        padding: "20px",
                        minHeight: "200px",
                      }}
                    >
                      <p
                        style={{
                          fontSize: "10px",
                          color: "#94a3b8",
                          fontWeight: 700,
                          textTransform: "uppercase",
                          marginBottom: "8px",
                        }}
                      >
                        Descrição / Escopo
                      </p>
                      <p
                        style={{
                          fontSize: "13px",
                          color: "#334155",
                          lineHeight: 1.6,
                          whiteSpace: "pre-wrap",
                          wordBreak: "break-word",
                        }}
                      >
                        {reportData.deal.description}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ── RELATÓRIO GERAL (FULL) ── */}
            {reportType === "FULL" && reportData?.breakdown && (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "36px",
                }}
              >
                {/* KPIs */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(4, 1fr)",
                    gap: "12px",
                  }}
                >
                  {[
                    {
                      label: "Em Pauta (Ativos)",
                      value: reportData.kpis.activeValue,
                      bg: "#0f172a",
                      color: "#fff",
                      sub: "#94a3b8",
                    },
                    {
                      label: "Fechado (Ganho)",
                      value: reportData.kpis.wonValue,
                      bg: "#f0fdf4",
                      color: "#15803d",
                      sub: "#16a34a",
                      border: "#bbf7d0",
                    },
                    {
                      label: "Perdido",
                      value: reportData.kpis.lostValue,
                      bg: "#fff1f2",
                      color: "#be123c",
                      sub: "#e11d48",
                      border: "#fecdd3",
                    },
                    {
                      label: "Total de Negócios",
                      value: String(reportData.kpis.totalDeals),
                      bg: "#f8fafc",
                      color: "#0f172a",
                      sub: "#64748b",
                      border: "#e2e8f0",
                    },
                  ].map(({ label, value, bg, color, sub, border }) => (
                    <div
                      key={label}
                      style={{
                        background: bg,
                        border: border ? `1px solid ${border}` : "none",
                        borderRadius: "14px",
                        padding: "18px 16px",
                        textAlign: "center",
                      }}
                    >
                      <p
                        style={{
                          fontSize: "9px",
                          fontWeight: 700,
                          color: sub,
                          textTransform: "uppercase",
                          letterSpacing: "0.08em",
                          marginBottom: "6px",
                        }}
                      >
                        {label}
                      </p>
                      <p
                        style={{
                          fontSize: "20px",
                          fontWeight: 900,
                          color,
                          lineHeight: 1,
                          wordBreak: "break-word",
                        }}
                      >
                        {value}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Tabela de Estágios + Funil */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "32px",
                  }}
                >
                  {/* Tabela Performance */}
                  <div>
                    <h3
                      style={{
                        fontSize: "11px",
                        fontWeight: 900,
                        color: "#0f172a",
                        textTransform: "uppercase",
                        marginBottom: "12px",
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                      }}
                    >
                      <TrendingUp
                        style={{
                          width: "14px",
                          height: "14px",
                          color: "#16a34a",
                          flexShrink: 0,
                        }}
                      />
                      Performance por Estágio
                    </h3>
                    <table
                      style={{
                        width: "100%",
                        borderCollapse: "collapse",
                        fontSize: "11px",
                        border: "1px solid #e2e8f0",
                        borderRadius: "10px",
                        overflow: "hidden",
                      }}
                    >
                      <thead>
                        <tr style={{ background: "#f1f5f9" }}>
                          {["Fase", "Qtd.", "Valor", "%"].map((h, i) => (
                            <th
                              key={h}
                              style={{
                                padding: "10px 12px",
                                fontWeight: 700,
                                color: "#475569",
                                textAlign: i === 0 ? "left" : "right",
                                whiteSpace: "nowrap",
                              }}
                            >
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {reportData.breakdown.map((row: any, i: number) => (
                          <tr
                            key={i}
                            style={{
                              borderTop: "1px solid #f1f5f9",
                              background: i % 2 === 0 ? "#fff" : "#fafafa",
                            }}
                          >
                            <td
                              style={{
                                padding: "10px 12px",
                                fontWeight: 700,
                                color: "#1e293b",
                                borderLeft: `4px solid ${row.color}`,
                                whiteSpace: "nowrap",
                              }}
                            >
                              {row.stage}
                            </td>
                            <td
                              style={{
                                padding: "10px 12px",
                                textAlign: "right",
                                color: "#475569",
                              }}
                            >
                              {row.count}
                            </td>
                            <td
                              style={{
                                padding: "10px 12px",
                                textAlign: "right",
                                fontWeight: 700,
                                color: "#059669",
                                whiteSpace: "nowrap",
                              }}
                            >
                              {row.value}
                            </td>
                            <td
                              style={{
                                padding: "10px 12px",
                                textAlign: "right",
                                color: "#64748b",
                              }}
                            >
                              {row.valueShare.toFixed(1)}%
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Funil de Conversão */}
                  <div>
                    <h3
                      style={{
                        fontSize: "11px",
                        fontWeight: 900,
                        color: "#0f172a",
                        textTransform: "uppercase",
                        marginBottom: "12px",
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                      }}
                    >
                      <DollarSign
                        style={{
                          width: "14px",
                          height: "14px",
                          color: "#7c3aed",
                          flexShrink: 0,
                        }}
                      />
                      Funil de Conversão
                    </h3>
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "14px",
                      }}
                    >
                      {reportData.breakdown.map((row: any, i: number) => (
                        <div key={i}>
                          <div
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              marginBottom: "4px",
                            }}
                          >
                            <span
                              style={{
                                fontSize: "11px",
                                fontWeight: 700,
                                color: "#334155",
                              }}
                            >
                              {row.stage}
                            </span>
                            <span
                              style={{ fontSize: "11px", color: "#64748b" }}
                            >
                              {row.count} ({row.countShare.toFixed(0)}%)
                            </span>
                          </div>
                          <div
                            style={{
                              height: "10px",
                              background: "#f1f5f9",
                              borderRadius: "99px",
                              overflow: "hidden",
                            }}
                          >
                            <div
                              style={{
                                height: "100%",
                                borderRadius: "99px",
                                width: `${row.countShare}%`,
                                background: row.color,
                                minWidth: row.count > 0 ? "6px" : "0",
                              }}
                            />
                          </div>
                          <div
                            style={{
                              fontSize: "9px",
                              textAlign: "right",
                              color: "#94a3b8",
                              marginTop: "2px",
                            }}
                          >
                            Ticket médio: {row.avgTicket}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Tabela Detalhamento */}
                <div>
                  <h3
                    style={{
                      fontSize: "11px",
                      fontWeight: 900,
                      color: "#0f172a",
                      textTransform: "uppercase",
                      marginBottom: "12px",
                    }}
                  >
                    Detalhamento dos Negócios
                  </h3>
                  <table
                    style={{
                      width: "100%",
                      borderCollapse: "collapse",
                      fontSize: "11px",
                      border: "1px solid #e2e8f0",
                      borderRadius: "10px",
                      overflow: "hidden",
                    }}
                  >
                    <thead>
                      <tr style={{ background: "#0f172a" }}>
                        {[
                          "Negócio",
                          "Cliente",
                          "Contato",
                          "Fase",
                          "Valor",
                          "Entrada",
                        ].map((h, i) => (
                          <th
                            key={h}
                            style={{
                              padding: "10px 14px",
                              color: "#fff",
                              fontWeight: 700,
                              textAlign: i >= 4 ? "right" : "left",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {reportData.rows.map((row: any, idx: number) => (
                        <tr
                          key={idx}
                          style={{
                            borderTop: "1px solid #f1f5f9",
                            background: idx % 2 === 0 ? "#fff" : "#fafafa",
                          }}
                        >
                          <td
                            style={{
                              padding: "9px 14px",
                              fontWeight: 700,
                              color: "#1e293b",
                              maxWidth: "180px",
                              wordBreak: "break-word",
                            }}
                          >
                            {row.dealName}
                          </td>
                          <td
                            style={{
                              padding: "9px 14px",
                              color: "#475569",
                              maxWidth: "140px",
                              wordBreak: "break-word",
                            }}
                          >
                            {row.clientName}
                          </td>
                          <td
                            style={{
                              padding: "9px 14px",
                              color: "#475569",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {row.contact}
                          </td>
                          <td style={{ padding: "9px 14px" }}>
                            <span
                              style={{
                                display: "inline-block",
                                background: "#f1f5f9",
                                color: "#475569",
                                borderRadius: "6px",
                                padding: "2px 8px",
                                fontSize: "10px",
                                fontWeight: 700,
                                whiteSpace: "nowrap",
                              }}
                            >
                              {row.stage}
                            </span>
                          </td>
                          <td
                            style={{
                              padding: "9px 14px",
                              textAlign: "right",
                              fontWeight: 800,
                              color: "#059669",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {row.value}
                          </td>
                          <td
                            style={{
                              padding: "9px 14px",
                              textAlign: "right",
                              color: "#64748b",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {row.entryDate}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ── RODAPÉ ── */}
            <div
              style={{
                marginTop: "48px",
                paddingTop: "20px",
                borderTop: "2px solid #f1f5f9",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                fontSize: "9px",
                color: "#94a3b8",
              }}
            >
              <span>
                © 2025 EcoPower Sistemas. Todos os direitos reservados.
              </span>
              <span>
                Documento confidencial para uso exclusivo da franquia.
              </span>
            </div>
          </div>

          {/* Botões */}
          <DialogFooter className="mt-4 gap-2">
            <Button
              variant="outline"
              onClick={() => setIsReportOpen(false)}
              className="dark:text-white dark:border-slate-700 dark:hover:bg-slate-800"
            >
              Fechar Visualização
            </Button>
            <Button
              onClick={handleDownloadPDF}
              disabled={isDownloading}
              className="gap-2 bg-green-600 hover:bg-green-700 text-white shadow-md dark:shadow-green-900/20"
            >
              {isDownloading ? (
                "Gerando PDF..."
              ) : (
                <>
                  <Download className="w-4 h-4" /> Baixar PDF Financeiro
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* --- MODAL DE MENSAGEM WHATSAPP --- */}
      {franchiseeId && (
        <MessageModal
          isOpen={!!messageLead}
          onClose={() => setMessageLead(null)}
          lead={messageLead}
          onSendMessage={async () => {}}
          FranchiseeId={franchiseeId}
        />
      )}

      {franchiseeId && (
        <CreateDealModal
          open={openNewDeal}
          onClose={() => setOpenNewDeal(false)}
          onSuccess={() => {
            setOpenNewDeal(false);
            fetchDeals();
          }}
          franchiseeId={franchiseeId}
        />
      )}
    </FranchiseeLayout>
  );
}
