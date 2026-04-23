import React, { useState, useEffect, useMemo, useRef } from "react";
import { createPortal } from "react-dom";
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
  DragOverEvent,
  defaultDropAnimationSideEffects,
  defaultDropAnimation,
  DropAnimation,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  horizontalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  Plus,
  Trash2,
  KanbanSquare,
  X,
  GripHorizontal,
  Check,
  Loader2,
  AlertCircle,
  Settings,
  Search,
  UserPlus,
  AlertTriangle,
  FileText,
  Sparkles,
  ListPlus,
  Star,
  CheckCircle2,
  MessageCircle,
  DollarSign,
} from "lucide-react";

import { Button } from "@/components/ui/button";

import FranchiseeLayout from "@/components/Franchisee/FranchiseeLayout";
import LeadModal from "@/components/Franchisee/LeadModal";
import AddLeadsModal from "@/components/Franchisee/AddLeadsModal";
import OrganizeAiModal from "@/components/Franchisee/pipeline/OrganizeAiModal";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

import { apiClient } from "@/lib/apiClient";
import * as leadController from "@/controllers/franchisee/LeadController";
import MessageModal from "@/components/Franchisee/MessageModal";
import CreateDealModal from "@/components/kanban/CreateDealModal";

const url = apiClient.getBaseUrl();

// --- TIPAGENS ---
type Lead = {
  id: string;
  leadId?: string;
  name: string;
  email: string;
  phone: string;
  leadType: string;
  value?: string;
  content?: string;
  columnId: string;
  pipelineId: string;
};

type Column = {
  id: string;
  title: string;
  description?: string;
  pipelineId: string;
  isSystem?: boolean;
  color?: string;
};

type Pipeline = {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  favorite?: boolean;
};

// --- CONSTANTES ---
const COLUMN_COLORS = [
  "bg-slate-400",
  "bg-red-500",
  "bg-orange-500",
  "bg-amber-500",
  "bg-yellow-500",
  "bg-lime-500",
  "bg-green-500",
  "bg-emerald-500",
  "bg-teal-500",
  "bg-cyan-500",
  "bg-sky-500",
  "bg-blue-500",
  "bg-indigo-500",
  "bg-violet-500",
  "bg-purple-500",
  "bg-fuchsia-500",
  "bg-pink-500",
  "bg-rose-500",
];

const EMOJI_OPTIONS = [
  "☀️",
  "🤝",
  "🔧",
  "💰",
  "🚀",
  "📢",
  "🏠",
  "📅",
  "✅",
  "🔥",
];

// --- COMPONENTS AUXILIARES ---

const LeadSearchBar = ({
  onSelectLead,
  franchiseeId,
  existingLeadIds,
}: {
  onSelectLead: (leadId: string) => void;
  franchiseeId: string;
  existingLeadIds: string[];
}) => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(event.target as Node)
      )
        setIsOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (query.length < 3) {
      setResults([]);
      setIsOpen(false);
      return;
    }
    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await apiClient.get(
          `${url}/api/pipelines/leads/search?franchiseeId=${franchiseeId}&query=${query}`
        );
        if (res.ok) {
          const data = await res.json();
          setResults(Array.isArray(data) ? data : []);
          setIsOpen(true);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setIsSearching(false);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [query, franchiseeId]);

  const handleSelect = (leadId: string) => {
    onSelectLead(leadId);
    setQuery("");
    setIsOpen(false);
  };

  return (
    <div ref={wrapperRef} className="relative w-64 max-w-sm hidden md:block">
      <div className="relative">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400 dark:text-slate-500" />
        <input
          type="text"
          placeholder="Buscar lead..."
          className="w-full pl-9 pr-4 py-2 bg-slate-100 dark:bg-slate-800 dark:text-slate-200 border-none rounded-lg text-sm focus:ring-2 focus:ring-green-500 outline-none transition-all placeholder:text-slate-400"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => {
            if (query.length >= 3 && results.length > 0) setIsOpen(true);
          }}
        />
        {isSearching && (
          <Loader2 className="absolute right-3 top-2.5 h-4 w-4 text-green-500 animate-spin" />
        )}
      </div>
      {isOpen && (
        <div className="absolute top-full mt-2 left-0 w-full bg-white dark:bg-slate-900 rounded-lg shadow-xl border border-slate-100 dark:border-slate-800 overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-100">
          <div className="max-h-60 overflow-y-auto">
            {results.length > 0 ? (
              results.map((lead) => {
                const isImported = existingLeadIds.includes(lead.id);
                return (
                  <button
                    key={lead.id}
                    onClick={() => !isImported && handleSelect(lead.id)}
                    disabled={isImported}
                    className={`w-full text-left px-4 py-3 border-b border-slate-50 dark:border-slate-800 last:border-0 flex items-center justify-between group transition-colors ${
                      isImported
                        ? "bg-slate-50 dark:bg-slate-800/50 cursor-not-allowed opacity-60"
                        : "hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
                    }`}
                  >
                    <div className="flex-1 min-w-0 mr-2">
                      <p className="text-sm font-bold text-slate-800 dark:text-slate-200 truncate">
                        {lead.name}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                        {lead.email || lead.phone}
                      </p>
                    </div>
                    {isImported ? (
                      <span className="flex items-center gap-1 text-[10px] font-bold bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 px-2 py-1 rounded-full whitespace-nowrap">
                        <CheckCircle2 className="w-3 h-3" /> Já Importado
                      </span>
                    ) : (
                      <UserPlus className="w-4 h-4 text-slate-300 group-hover:text-green-600 dark:group-hover:text-green-400" />
                    )}
                  </button>
                );
              })
            ) : (
              <div className="p-4 text-center text-xs text-slate-400 dark:text-slate-500">
                {query.length >= 3
                  ? "Nenhum lead novo encontrado."
                  : "Digite para buscar..."}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const SortableLeadCard = ({
  lead,
  onClick,
  onDelete,
  onContextMenu,
  onMessage,
  onDeal,
}: {
  lead: Lead;
  onClick: (l: Lead) => void;
  onDelete: (id: string) => void;
  onContextMenu?: (e: React.MouseEvent, lead: Lead) => void;
  onMessage: (lead: Lead) => void;
  onDeal: (lead: Lead) => void;
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: lead.id, data: { type: "Leaf", lead } });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.3 : 1,
    touchAction: "none",
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={() => onClick(lead)}
      onContextMenu={(e) => onContextMenu && onContextMenu(e, lead)}
      className="bg-white dark:bg-slate-800 p-3 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-all cursor-grab active:cursor-grabbing group relative mb-2 flex flex-col gap-2 select-none"
    >
      <div className="flex justify-between items-start">
        <span className="font-semibold text-slate-800 dark:text-slate-200 text-sm truncate max-w-[180px]">
          {lead.name}
        </span>
        <button
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => {
            e.stopPropagation();
            onDelete(lead.id);
          }}
          className="text-slate-300 dark:text-slate-500 hover:text-red-500 dark:hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all p-1 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
          title="Excluir Oportunidade"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      <div className="text-xs text-slate-500 dark:text-slate-400 truncate">
        {lead.phone}
      </div>

      {lead.content && (
        <div className="flex items-center gap-1 text-[10px] text-slate-400 dark:text-slate-500">
          <FileText className="w-3 h-3" />
          <span className="truncate max-w-[200px]">{lead.content}</span>
        </div>
      )}

      <div className="flex justify-between items-center mt-2 pt-2 border-t border-slate-100 dark:border-slate-700">
        <div className="flex gap-2">
          <button
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation();
              onMessage(lead);
            }}
            className="p-1.5 text-slate-400 hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-md transition-colors"
            title="Enviar WhatsApp"
          >
            <MessageCircle className="w-3.5 h-3.5" />
          </button>
          <button
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation();
              onDeal(lead);
            }}
            className="p-1.5 text-slate-400 hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded-md transition-colors"
            title="Criar Novo Negócio"
          >
            <FileText className="w-3.5 h-3.5" />
          </button>
        </div>
        <div className="flex items-center gap-1">
          <span
            className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
              lead.leadType === "CLIENT"
                ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                : "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
            }`}
          >
            {lead.leadType}
          </span>
          {lead.value && parseFloat(lead.value) > 0 && (
            <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300 ml-1">
              R$ {lead.value}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

// ── Filtro local por coluna ──────────────────────────────────────────────────
const ColumnSearchFilter = ({
  value,
  onChange,
  totalCount,
  filteredCount,
}: {
  value: string;
  onChange: (v: string) => void;
  totalCount: number;
  filteredCount: number;
}) => {
  const isFiltering = value.length > 0;

  return (
    <div className="px-2 pb-2">
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400 pointer-events-none" />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          // ⚠️ Impede que o clique/pointer no input inicie o drag da coluna
          onPointerDown={(e) => e.stopPropagation()}
          placeholder="Filtrar nesta etapa..."
          className="w-full pl-7 pr-6 py-1.5 text-xs rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-green-500 outline-none transition-all"
        />
        {isFiltering && (
          <button
            onPointerDown={(e) => e.stopPropagation()}
            onClick={() => onChange("")}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X className="w-3 h-3" />
          </button>
        )}
      </div>
      {isFiltering && (
        <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 pl-1">
          {filteredCount} de {totalCount} lead{totalCount !== 1 ? "s" : ""}
        </p>
      )}
    </div>
  );
};

const SortableColumn = ({
  column,
  leads,
  onCardClick,
  onDeleteColumn,
  onDeleteDeal,
  onCardContextMenu,
  onCardMessage,
  onCardDeal,
}: any) => {
  const {
    setNodeRef,
    attributes,
    listeners,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: column.id, data: { type: "Column", column } });

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const [filterQuery, setFilterQuery] = useState("");

  const filteredLeads = useMemo(() => {
    if (!filterQuery.trim()) return leads;
    const q = filterQuery.toLowerCase();
    return leads.filter(
      (l: Lead) =>
        l.name.toLowerCase().includes(q) ||
        l.phone.toLowerCase().includes(q) ||
        (l.email && l.email.toLowerCase().includes(q)) ||
        (l.content && l.content.toLowerCase().includes(q))
    );
  }, [leads, filterQuery]);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex flex-col min-w-[280px] w-[280px] h-full max-h-full rounded-xl bg-slate-100/80 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800"
    >
      {/* Cabeçalho */}
      <div className="pt-3 px-3 border-b border-slate-200/50 dark:border-slate-800 bg-white/50 dark:bg-slate-800/50 rounded-t-xl backdrop-blur-sm flex flex-col gap-1">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2 flex-1 overflow-hidden">
            <div
              {...attributes}
              {...listeners}
              className="cursor-grab active:cursor-grabbing p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 shrink-0"
            >
              <GripHorizontal className="w-4 h-4" />
            </div>
            <div
              className={`w-3 h-3 rounded-full shrink-0 ${
                column.color || "bg-slate-400"
              }`}
            />
            <h3 className="font-bold text-sm text-slate-700 dark:text-slate-200 truncate">
              {column.title}
            </h3>
            {/* Contagem: mostra "filtrado/total" quando há filtro ativo */}
            <span className="bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-[10px] px-1.5 py-0.5 rounded-full font-bold ml-auto shrink-0">
              {filterQuery
                ? `${filteredLeads.length}/${leads.length}`
                : leads.length}
            </span>
          </div>
          {!column.isSystem && (
            <button
              onClick={() => onDeleteColumn(column.id)}
              className="text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 p-1 rounded transition-colors ml-2 shrink-0"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>

        {column.description && (
          <p
            className="text-[10px] text-slate-500 dark:text-slate-400 px-1 truncate leading-tight opacity-80 mb-1"
            title={column.description}
          >
            {column.description}
          </p>
        )}

        {/* ── Input de filtro local ── */}
        <ColumnSearchFilter
          value={filterQuery}
          onChange={setFilterQuery}
          totalCount={leads.length}
          filteredCount={filteredLeads.length}
        />
      </div>

      {/* Lista de cards */}
      <div className="flex-1 p-2 overflow-y-auto space-y-2 min-h-[100px] scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-700">
        {/*
          Importante: SortableContext sempre recebe os IDs reais (não filtrados)
          para que o DnD continue funcionando corretamente ao arrastar cards
          que estão ocultos pelo filtro.
        */}
        <SortableContext
          items={leads.map((l: any) => l.id)}
          strategy={verticalListSortingStrategy}
        >
          {filteredLeads.map((lead: any) => (
            <SortableLeadCard
              key={lead.id}
              lead={lead}
              onClick={onCardClick}
              onDelete={onDeleteDeal}
              onContextMenu={onCardContextMenu}
              onMessage={onCardMessage}
              onDeal={onCardDeal}
            />
          ))}
        </SortableContext>

        {filteredLeads.length === 0 && (
          <div className="h-20 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-lg flex flex-col items-center justify-center text-slate-400 text-xs gap-1">
            {filterQuery ? (
              <>
                <Search className="w-4 h-4 opacity-40" />
                <span>Nenhum resultado</span>
              </>
            ) : (
              <span>Arraste aqui</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// --- MODAIS INTERNOS DE CONFIGURAÇÃO ---

const DeleteColumnModal = ({ isOpen, onClose, onConfirm, isDeleting }: any) => {
  if (!isOpen) return null;
  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-xl w-full max-w-sm shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-6 text-center">
          <div className="w-12 h-12 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
          </div>
          <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-2">
            Excluir Etapa?
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
            Todos os leads desta etapa serão movidos para{" "}
            <span className="font-bold">"Novos Leads"</span>.
          </p>
          <div className="flex justify-center gap-3">
            <button
              onClick={onClose}
              disabled={isDeleting}
              className="px-4 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
            >
              Cancelar
            </button>
            <button
              onClick={onConfirm}
              disabled={isDeleting}
              className="px-6 py-2.5 text-sm font-bold text-white bg-red-600 hover:bg-red-700 rounded-lg shadow-md flex items-center gap-2"
            >
              {isDeleting && <Loader2 className="w-4 h-4 animate-spin" />} Sim,
              excluir
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

const DeleteDealModal = ({ isOpen, onClose, onConfirm, isDeleting }: any) => {
  if (!isOpen) return null;
  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-xl w-full max-w-sm shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-6 text-center">
          <div className="w-12 h-12 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Trash2 className="w-6 h-6 text-red-600 dark:text-red-400" />
          </div>
          <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-2">
            Excluir Oportunidade?
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
            Esta ação removerá este card do seu funil. O histórico será perdido.
          </p>
          <div className="flex justify-center gap-3">
            <button
              onClick={onClose}
              disabled={isDeleting}
              className="px-4 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
            >
              Cancelar
            </button>
            <button
              onClick={onConfirm}
              disabled={isDeleting}
              className="px-6 py-2.5 text-sm font-bold text-white bg-red-600 hover:bg-red-700 rounded-lg shadow-md flex items-center gap-2"
            >
              {isDeleting && <Loader2 className="w-4 h-4 animate-spin" />} Sim,
              excluir
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

const EditPipelineModal = ({
  isOpen,
  onClose,
  pipeline,
  onUpdate,
  onDelete,
}: any) => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [selectedIcon, setSelectedIcon] = useState("☀️");
  const [isFavorite, setIsFavorite] = useState(false);

  useEffect(() => {
    if (pipeline) {
      setName(pipeline.name);
      setDescription(pipeline.description || "");
      setSelectedIcon(pipeline.icon || "☀️");
      setIsFavorite(pipeline.favorite || false);
    }
  }, [pipeline, isOpen]);

  if (!isOpen || !pipeline) return null;
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onUpdate(pipeline.id, {
        name,
        description,
        icon: selectedIcon,
        favorite: isFavorite,
      });
      onClose();
    }
  };
  const handleDelete = () => {
    onDelete(pipeline.id);
    onClose();
  };
  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/30">
          <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <Settings className="w-5 h-5 text-green-600" /> Editar Funil
          </h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-red-500 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Nome
            </label>
            <input
              required
              className="w-full border border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-green-500 outline-none"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Descrição (Opcional)
            </label>
            <textarea
              rows={3}
              className="w-full border border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-green-500 outline-none resize-none"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="edit-fav"
              checked={isFavorite}
              onChange={(e) => setIsFavorite(e.target.checked)}
              className="w-4 h-4 text-green-600 rounded focus:ring-green-500 cursor-pointer"
            />
            <label
              htmlFor="edit-fav"
              className="text-sm font-medium text-slate-700 dark:text-slate-300 cursor-pointer flex items-center gap-1"
            >
              Marcar como Favorito{" "}
              <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
            </label>
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
              Ícone
            </label>
            <div className="flex flex-wrap gap-2">
              {EMOJI_OPTIONS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => setSelectedIcon(emoji)}
                  className={`w-10 h-10 flex items-center justify-center text-xl rounded-lg border transition-all ${
                    selectedIcon === emoji
                      ? "bg-green-100 border-green-500 scale-110 dark:bg-green-900/30 dark:border-green-600"
                      : "bg-slate-50 border-slate-200 dark:bg-slate-800 dark:border-slate-700 hover:bg-slate-100"
                  }`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center">
            <button
              type="button"
              onClick={handleDelete}
              className="text-red-500 text-sm font-medium hover:text-red-700 flex items-center gap-1 hover:bg-red-50 dark:hover:bg-red-900/20 px-3 py-2 rounded-lg transition-colors"
            >
              <Trash2 className="w-4 h-4" /> Excluir Funil
            </button>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-6 py-2 text-sm font-bold text-white bg-green-600 hover:bg-green-700 rounded-lg shadow-md"
              >
                Salvar
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};

const CreateColumnModal = ({ isOpen, onClose, onSave }: any) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [selectedColor, setSelectedColor] = useState("bg-slate-400");
  if (!isOpen) return null;
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (title.trim() && description.trim()) {
      onSave(title, description, selectedColor);
      setTitle("");
      setDescription("");
      setSelectedColor("bg-slate-400");
      onClose();
    }
  };
  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-xl w-full max-w-sm shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/30">
          <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <Plus className="w-5 h-5 text-green-600" /> Nova Etapa
          </h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-red-500 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Nome da Etapa
            </label>
            <input
              autoFocus
              required
              placeholder="Ex: Qualificação"
              className="w-full border border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-green-500 outline-none"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Descrição (Obrigatório)
            </label>
            <textarea
              required
              rows={2}
              placeholder="Ex: Nesta etapa confirmamos o interesse do lead..."
              className="w-full border border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-green-500 outline-none resize-none"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
              Cor
            </label>
            <div className="grid grid-cols-6 gap-2">
              {COLUMN_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setSelectedColor(color)}
                  className={`w-8 h-8 rounded-full ${color} flex items-center justify-center transition-all hover:scale-110 ${
                    selectedColor === color
                      ? "ring-2 ring-offset-2 ring-slate-400 dark:ring-slate-600 scale-110"
                      : ""
                  }`}
                >
                  {selectedColor === color && (
                    <Check className="w-4 h-4 text-white" />
                  )}
                </button>
              ))}
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 text-sm font-bold text-white bg-green-600 hover:bg-green-700 rounded-lg shadow-md"
            >
              Adicionar
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};

const CreatePipelineModal = ({ isOpen, onClose, onSave }: any) => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [selectedIcon, setSelectedIcon] = useState("☀️");
  const [isFavorite, setIsFavorite] = useState(false);
  if (!isOpen) return null;
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onSave({ name, description, icon: selectedIcon, favorite: isFavorite });
      setName("");
      setDescription("");
      setSelectedIcon("☀️");
      setIsFavorite(false);
      onClose();
    }
  };
  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/30">
          <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <KanbanSquare className="w-5 h-5 text-green-600" /> Novo Funil
          </h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-red-500 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Nome
            </label>
            <input
              autoFocus
              required
              className="w-full border border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-green-500 outline-none"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Descrição (Opcional)
            </label>
            <textarea
              rows={3}
              className="w-full border border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-green-500 outline-none resize-none"
              placeholder="Ex: Funil para vendas de Energia Solar..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="create-fav"
              checked={isFavorite}
              onChange={(e) => setIsFavorite(e.target.checked)}
              className="w-4 h-4 text-green-600 rounded focus:ring-green-500 cursor-pointer"
            />
            <label
              htmlFor="create-fav"
              className="text-sm font-medium text-slate-700 dark:text-slate-300 cursor-pointer flex items-center gap-1"
            >
              Marcar como Favorito{" "}
              <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
            </label>
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
              Ícone
            </label>
            <div className="flex flex-wrap gap-2">
              {EMOJI_OPTIONS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => setSelectedIcon(emoji)}
                  className={`w-10 h-10 flex items-center justify-center text-xl rounded-lg border transition-all ${
                    selectedIcon === emoji
                      ? "bg-green-100 border-green-500 scale-110 dark:bg-green-900/30 dark:border-green-600"
                      : "bg-slate-50 border-slate-200 dark:bg-slate-800 dark:border-slate-700 hover:bg-slate-100"
                  }`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 text-sm font-bold text-white bg-green-600 hover:bg-green-700 rounded-lg shadow-md"
            >
              Criar
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};

export default function PipelineCRM() {
  const { user } = useAuth();
  const { toast } = useToast();

  const [pipelines, setPipelines] = useState<Pipeline[]>([]);
  const [columns, setColumns] = useState<Column[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [activePipelineId, setActivePipelineId] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [activeColumn, setActiveColumn] = useState<Column | null>(null);
  const [activeLead, setActiveLead] = useState<Lead | null>(null);

  const [isLeadModalOpen, setIsLeadModalOpen] = useState(false);
  const [isPipelineModalOpen, setIsPipelineModalOpen] = useState(false);
  const [isEditPipelineModalOpen, setIsEditPipelineModalOpen] = useState(false);
  const [isColumnModalOpen, setIsColumnModalOpen] = useState(false);
  const [isAddLeadsModalOpen, setIsAddLeadsModalOpen] = useState(false);
  const [isOrganizeAiModalOpen, setIsOrganizeAiModalOpen] = useState(false);
  const [isMessageModalOpen, setIsMessageModalOpen] = useState(false);
  const [selectedLeadForMessage, setSelectedLeadForMessage] =
    useState<Lead | null>(null);
  const [isCreateDealModalOpen, setIsCreateDealModalOpen] = useState(false);
  const [selectedLeadForDeal, setSelectedLeadForDeal] = useState<Lead | null>(
    null
  );
  const [isDeleteColumnModalOpen, setIsDeleteColumnModalOpen] = useState(false);
  const [columnToDeleteId, setColumnToDeleteId] = useState<string | null>(null);
  const [isDeletingColumn, setIsDeletingColumn] = useState(false);
  const [isDeleteDealModalOpen, setIsDeleteDealModalOpen] = useState(false);
  const [dealToDeleteId, setDealToDeleteId] = useState<string | null>(null);
  const [isDeletingDeal, setIsDeletingDeal] = useState(false);
  const [leadModalMode, setLeadModalMode] = useState<"create" | "edit">(
    "create"
  );
  const [currentLeadId, setCurrentLeadId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    id: "",
    name: "",
    email: "",
    phone: "",
    leadType: "LEAD",
    value: "",
    content: "",
  });
  const [isSaving, setIsSaving] = useState(false);
  const [contextMenu, setContextMenu] = useState<{
    visible: boolean;
    x: number;
    y: number;
    leadId: string | null;
  }>({ visible: false, x: 0, y: 0, leadId: null });

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  useEffect(() => {
    if (user?.franchisee?.id) fetchPipelines();
  }, [user]);

  useEffect(() => {
    const handleClick = () =>
      setContextMenu({ ...contextMenu, visible: false });
    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, [contextMenu]);

  const fetchPipelines = async () => {
    if (!user?.franchisee?.id) return;
    setIsLoading(true);
    try {
      const response = await apiClient.fetch(
        `${url}/api/pipelines?franchiseeId=${user.franchisee.id}`
      );
      if (response.ok) {
        const data = await response.json();
        let dataList: any[] = [];
        if (Array.isArray(data)) {
          dataList = data;
        } else if (data && typeof data === "object") {
          if ("content" in data && Array.isArray((data as any).content)) {
            dataList = (data as any).content;
          } else {
            dataList = [data];
          }
        }

        const pipelinesMap = new Map<string, Pipeline>();
        const columnsMap = new Map<string, Column>();
        const leadsMap = new Map<string, Lead>();

        dataList.forEach((pipe: any) => {
          if (!pipe || !pipe.id) return;
          if (!pipelinesMap.has(pipe.id)) {
            pipelinesMap.set(pipe.id, {
              id: pipe.id,
              name: pipe.name,
              icon: pipe.icon,
              description: pipe.description,
              favorite: pipe.favorite || false,
            });
          }
          if (Array.isArray(pipe.stages)) {
            pipe.stages.forEach((stage: any) => {
              if (!columnsMap.has(stage.id)) {
                columnsMap.set(stage.id, {
                  id: stage.id,
                  title: stage.name,
                  description: stage.description,
                  pipelineId: pipe.id,
                  isSystem: stage.system,
                  color: stage.color,
                });
              }
              if (Array.isArray(stage.deals)) {
                stage.deals.forEach((deal: any) => {
                  if (!leadsMap.has(deal.id)) {
                    leadsMap.set(deal.id, {
                      id: deal.id,
                      leadId: deal.lead?.id,
                      name: deal.title || deal.lead?.name || "Sem nome",
                      email: deal.lead?.email || "",
                      phone: deal.lead?.phone || "",
                      leadType: "LEAD",
                      columnId: stage.id,
                      pipelineId: pipe.id,
                      value: deal.value?.toString() || "0,00",
                      content: deal.content || "",
                    });
                  }
                });
              }
            });
          }
        });

        const loadedPipelines = Array.from(pipelinesMap.values()).sort(
          (a, b) => Number(b.favorite) - Number(a.favorite)
        );
        setPipelines(loadedPipelines);
        setColumns(Array.from(columnsMap.values()));
        setLeads(Array.from(leadsMap.values()));

        if (loadedPipelines.length > 0) {
          if (
            !activePipelineId ||
            !loadedPipelines.find((p) => p.id === activePipelineId)
          ) {
            const fav = loadedPipelines.find((p) => p.favorite);
            setActivePipelineId(fav ? fav.id : loadedPipelines[0].id);
          }
        } else {
          setActivePipelineId("");
        }
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const activePipelineColumns = useMemo(
    () => columns.filter((col) => col.pipelineId === activePipelineId),
    [columns, activePipelineId]
  );
  const activePipelineLeads = useMemo(
    () => leads.filter((lead) => lead.pipelineId === activePipelineId),
    [leads, activePipelineId]
  );
  const activePipelineData = pipelines.find((p) => p.id === activePipelineId);
  const existingLeadIds = useMemo(
    () =>
      activePipelineLeads
        .map((lead) => lead.leadId)
        .filter((id): id is string => !!id && id !== ""),
    [activePipelineLeads]
  );

  const handleToggleFavorite = async () => {
    if (!activePipelineId) return;
    try {
      const res = await apiClient.put(
        `${url}/api/pipelines/${activePipelineId}/favorite`
      );
      if (res.ok) {
        const updated = await res.json();
        setPipelines((prev) =>
          prev
            .map((p) =>
              p.id === updated.id ? { ...p, favorite: updated.favorite } : p
            )
            .sort((a, b) => Number(b.favorite) - Number(a.favorite))
        );
        fetchPipelines();
        toast({
          title: updated.favorite ? "Favoritado! ⭐" : "Removido dos favoritos",
        });
      } else {
        throw new Error();
      }
    } catch (e) {
      toast({
        title: "Erro",
        description: "Falha ao favoritar",
        variant: "destructive",
      });
    }
  };

  const handleContextMenu = (e: React.MouseEvent, lead: Lead) => {
    e.preventDefault();
    setContextMenu({ visible: true, x: e.pageX, y: e.pageY, leadId: lead.id });
  };

  const handleMoveToPipeline = async (targetPipelineId: string) => {
    if (!contextMenu.leadId) return;
    const leadId = contextMenu.leadId;
    setLeads((prev) => prev.filter((l) => l.id !== leadId));
    setContextMenu({ ...contextMenu, visible: false });
    try {
      const res = await apiClient.put(`${url}/api/move-deal-pipeline`, {
        dealId: leadId,
        targetPipelineId,
      });
      if (res.ok) {
        toast({
          title: "Movido!",
          description: "Lead transferido para outro funil.",
        });
        fetchPipelines();
      } else {
        throw new Error();
      }
    } catch (e) {
      toast({
        title: "Erro",
        description: "Falha ao mover lead.",
        variant: "destructive",
      });
      fetchPipelines();
    }
  };

  const handleOpenMessage = (lead: Lead) => {
    setSelectedLeadForMessage({ ...lead, id: lead.leadId ?? lead.id });
    setIsMessageModalOpen(true);
  };
  const handleOpenDeal = (lead: Lead) => {
    setSelectedLeadForDeal(lead);
    setIsCreateDealModalOpen(true);
  };
  const handleSendMessage = async (_msg: string) => {};

  const onDragStart = (event: DragStartEvent) => {
    if (event.active.data.current?.type === "Column")
      setActiveColumn(event.active.data.current.column);
    if (event.active.data.current?.type === "Leaf")
      setActiveLead(event.active.data.current.lead);
  };
  const onDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;
    if (active.data.current?.type === "Column") return;
    const isActiveLead = active.data.current?.type === "Leaf";
    const isOverLead = over.data.current?.type === "Leaf";
    const isOverColumn = over.data.current?.type === "Column";
    if (!isActiveLead) return;
    if (isActiveLead && isOverLead) {
      setLeads((leads) => {
        const ai = leads.findIndex((l) => l.id === active.id);
        const oi = leads.findIndex((l) => l.id === over.id);
        if (leads[ai].columnId !== leads[oi].columnId)
          leads[ai].columnId = leads[oi].columnId;
        return arrayMove(leads, ai, oi);
      });
    }
    if (isActiveLead && isOverColumn) {
      setLeads((leads) => {
        const ai = leads.findIndex((l) => l.id === active.id);
        if (leads[ai].columnId !== over.id)
          leads[ai].columnId = String(over.id);
        return arrayMove(leads, ai, ai);
      });
    }
  };
  const onDragEnd = async (event: DragEndEvent) => {
    setActiveColumn(null);
    setActiveLead(null);
    const { active, over } = event;
    if (!over) return;
    if (active.data.current?.type === "Column") {
      setColumns((cols) => {
        const ai = cols.findIndex((c) => c.id === active.id);
        const oi = cols.findIndex((c) => c.id === over.id);
        return arrayMove(cols, ai, oi);
      });
      return;
    }
    if (active.data.current?.type === "Leaf") {
      const leadId = active.id as string;
      const newStageId =
        over.data.current?.type === "Column"
          ? over.id
          : over.data.current?.lead?.columnId;
      if (newStageId) {
        try {
          await apiClient.put(`${url}/api/move-deal`, {
            dealId: leadId,
            newStageId,
          });
        } catch (error) {
          toast({
            title: "Erro",
            description: "Falha ao salvar movimento.",
            variant: "destructive",
          });
          fetchPipelines();
        }
      }
    }
  };

  const handleAddLeadToPipeline = async (leadId: string) => {
    try {
      const res = await apiClient.post(
        `${url}/api/pipelines/${activePipelineId}/add-lead/${leadId}`
      );
      if (res.ok) {
        toast({ title: "Sucesso", description: "Lead adicionado ao funil!" });
        fetchPipelines();
      } else {
        throw new Error();
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Falha ao adicionar lead.",
        variant: "destructive",
      });
    }
  };

  const handleLeadsAddedSuccess = () => fetchPipelines();

  const handleCreatePipeline = async (data: any) => {
    if (!user?.franchisee?.id) {
      toast({
        title: "Erro",
        description: "ID do franqueado não encontrado.",
        variant: "destructive",
      });
      return;
    }
    try {
      const res = await apiClient.post(`${url}/api/pipelines`, {
        ...data,
        franchiseeId: user?.franchisee?.id,
      });
      if (res.ok) {
        const newPipe = await res.json();
        await fetchPipelines();
        setActivePipelineId(newPipe.id);
        toast({ title: "Sucesso", description: "Funil criado!" });
      } else {
        const errorData = await res.json().catch(() => null);
        const message = errorData?.message || "Erro ao criar funil";
        if (res.status === 403 || message.toLowerCase().includes("limite")) {
          toast({
            title: "Limite atingido 🚫",
            description: "Você atingiu o limite de funis do seu plano.",
            variant: "destructive",
          });
        } else {
          throw new Error(message);
        }
      }
    } catch (e: any) {
      toast({ title: "Erro", description: e.message, variant: "destructive" });
    }
  };

  const handleUpdatePipeline = async (id: string, data: any) => {
    try {
      const res = await apiClient.put(`${url}/api/pipelines/${id}`, {
        ...data,
      });
      if (res.ok) {
        await fetchPipelines();
        toast({ title: "Atualizado", description: "Funil editado." });
      }
    } catch (e) {
      toast({ title: "Erro", variant: "destructive" });
    }
  };

  const handleDeletePipeline = async (id: string) => {
    try {
      const res = await apiClient.delete(`${url}/api/pipelines/${id}`);
      if (res.ok) {
        await fetchPipelines();
        toast({ title: "Deletado", description: "Funil removido." });
      }
    } catch (e) {
      toast({ title: "Erro", variant: "destructive" });
    }
  };

  const handleGenerateAiStages = () => {
    if (!activePipelineId) return;
    setIsOrganizeAiModalOpen(true);
  };

  const handleCreateColumn = async (
    title: string,
    description: string,
    color: string
  ) => {
    try {
      const res = await apiClient.post(
        `${url}/api/pipelines/${activePipelineId}/stages`,
        { title, description, color }
      );
      if (res.ok) {
        await fetchPipelines();
        toast({ title: "Sucesso", description: "Etapa adicionada!" });
      }
    } catch (e) {
      toast({ title: "Erro", variant: "destructive" });
    }
  };

  const openDeleteColumnModal = (colId: string) => {
    setColumnToDeleteId(colId);
    setIsDeleteColumnModalOpen(true);
  };
  const confirmDeleteColumn = async () => {
    if (!columnToDeleteId) return;
    setIsDeletingColumn(true);
    try {
      const res = await apiClient.delete(
        `${url}/api/stages/${columnToDeleteId}`
      );
      if (res.ok) {
        const defaultCol = activePipelineColumns.find((c) => c.isSystem);
        if (defaultCol) {
          setLeads((prev) =>
            prev.map((l) =>
              l.columnId === columnToDeleteId
                ? { ...l, columnId: defaultCol.id }
                : l
            )
          );
        }
        setColumns((prev) => prev.filter((c) => c.id !== columnToDeleteId));
        toast({ title: "Excluído", description: "Etapa removida." });
      } else {
        toast({
          title: "Erro",
          description: "Não foi possível excluir.",
          variant: "destructive",
        });
      }
    } catch (e) {
      toast({ title: "Erro", variant: "destructive" });
    } finally {
      setIsDeletingColumn(false);
      setIsDeleteColumnModalOpen(false);
      setColumnToDeleteId(null);
    }
  };

  const openDeleteDealModal = (dealId: string) => {
    setDealToDeleteId(dealId);
    setIsDeleteDealModalOpen(true);
  };
  const confirmDeleteDeal = async () => {
    if (!dealToDeleteId) return;
    setIsDeletingDeal(true);
    try {
      const res = await apiClient.delete(`${url}/api/deals/${dealToDeleteId}`);
      if (res.ok) {
        setLeads((prev) => prev.filter((l) => l.id !== dealToDeleteId));
        toast({ title: "Excluído", description: "Oportunidade removida." });
      } else {
        throw new Error();
      }
    } catch (error) {
      toast({ title: "Erro", variant: "destructive" });
    } finally {
      setIsDeletingDeal(false);
      setIsDeleteDealModalOpen(false);
      setDealToDeleteId(null);
    }
  };

  const handleSaveLead = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      if (leadModalMode === "edit" && currentLeadId) {
        const data = {
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          leadType: formData.leadType,
          value: formData.value,
          content: formData.content,
        };
        await leadController.updateLeadByDealID({ id: currentLeadId, data });
        setLeads((prev) =>
          prev.map((lead) =>
            lead.id === currentLeadId ? { ...lead, ...data } : lead
          )
        );
        toast({
          title: "Salvo",
          description: "Alterações salvas com sucesso.",
          className:
            "bg-green-50 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800",
        });
      } else {
        const res = await apiClient.post(
          `${url}/leads?franchiseeId=${user?.franchisee?.id}`,
          {
            name: formData.name,
            email: formData.email,
            phone: formData.phone,
            type: formData.leadType || "LEAD",
            franchiseeId: user?.franchisee?.id,
            pipelineId: activePipelineId,
          }
        );
        if (res.ok) {
          await fetchPipelines();
          toast({
            title: "Criado",
            description: "Lead adicionado ao funil com sucesso.",
            className:
              "bg-green-50 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800",
          });
        } else {
          throw new Error("Falha ao criar lead");
        }
      }
    } catch (error) {
      console.error(error);
      toast({
        title: "Erro",
        description: "Não foi possível salvar as informações.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
      setIsLeadModalOpen(false);
    }
  };

  const openNewLead = () => {
    setLeadModalMode("create");
    setFormData({
      id: "",
      name: "",
      email: "",
      phone: "",
      leadType: "LEAD",
      value: "",
      content: "",
    });
    setIsLeadModalOpen(true);
  };
  const openEditLead = (lead: Lead) => {
    setLeadModalMode("edit");
    setFormData({
      id: lead.id,
      name: lead.name,
      email: lead.email,
      phone: lead.phone,
      leadType: lead.leadType,
      value: lead.value || "",
      content: lead.content || "",
    });
    setCurrentLeadId(lead.id);
    setIsLeadModalOpen(true);
  };

  const dropAnimation: DropAnimation = {
    ...defaultDropAnimation,
    sideEffects: defaultDropAnimationSideEffects({
      styles: { active: { opacity: "0.5" } },
    }),
  };

  return (
    <FranchiseeLayout
      isModalOpen={
        isLeadModalOpen ||
        isPipelineModalOpen ||
        isColumnModalOpen ||
        isEditPipelineModalOpen ||
        isDeleteColumnModalOpen ||
        isDeleteDealModalOpen ||
        isAddLeadsModalOpen ||
        isMessageModalOpen ||
        isCreateDealModalOpen
      }
      scrollable={false}
    >
      <div className="h-full flex flex-col bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
        <header className="px-6 py-4 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between sticky top-0 z-20">
          <div className="flex items-center gap-4">
            <div>
              <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                {activePipelineData?.name || "Pipeline CRM"}
                {activePipelineData?.icon && (
                  <span className="text-2xl">{activePipelineData.icon}</span>
                )}
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {activePipelineData?.description || "Gerencie seus funis"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
            ) : (
              <>
                {activePipelineId && (
                  <LeadSearchBar
                    onSelectLead={handleAddLeadToPipeline}
                    franchiseeId={user?.franchisee?.id || ""}
                    existingLeadIds={existingLeadIds}
                  />
                )}
                {activePipelineId && (
                  <button
                    onClick={handleToggleFavorite}
                    className="mr-1 p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-transform hover:scale-110"
                    title="Favoritar este funil"
                  >
                    <Star
                      className={`w-5 h-5 ${
                        activePipelineData?.favorite
                          ? "fill-amber-400 text-amber-400"
                          : "text-slate-300 dark:text-slate-500 hover:text-amber-400"
                      }`}
                    />
                  </button>
                )}
                <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-lg p-1 border border-slate-200 dark:border-slate-700">
                  <select
                    value={activePipelineId}
                    onChange={(e) => setActivePipelineId(e.target.value)}
                    className="bg-transparent text-sm font-medium text-slate-700 dark:text-slate-300 outline-none px-2 py-1 cursor-pointer max-w-[200px] truncate"
                  >
                    {pipelines.length === 0 && (
                      <option key="empty">Nenhum funil</option>
                    )}
                    {pipelines.map((pipe) => (
                      <option
                        key={pipe.id}
                        value={pipe.id}
                        className="dark:bg-slate-800"
                      >
                        {pipe.icon} {pipe.name}
                      </option>
                    ))}
                  </select>
                  {activePipelineId && (
                    <>
                      <button
                        onClick={handleGenerateAiStages}
                        className="p-1.5 hover:bg-white dark:hover:bg-slate-700 rounded-md text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300 transition-colors ml-1"
                        title="Organizar com IA"
                      >
                        <Sparkles className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setIsEditPipelineModalOpen(true)}
                        className="p-1.5 hover:bg-white dark:hover:bg-slate-700 rounded-md text-slate-500 dark:text-slate-400 hover:text-green-600 dark:hover:text-green-400 transition-colors"
                        title="Configurar"
                      >
                        <Settings className="w-4 h-4" />
                      </button>
                    </>
                  )}
                  <div className="w-px h-4 bg-slate-300 dark:bg-slate-600 mx-2" />
                  <button
                    onClick={() => setIsPipelineModalOpen(true)}
                    className="p-1.5 hover:bg-white dark:hover:bg-slate-700 rounded-md text-slate-500 dark:text-slate-400 hover:text-green-600 dark:hover:text-green-400 transition-colors"
                    title="Criar novo funil"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </>
            )}
            <div className="w-px h-8 bg-slate-200 dark:bg-slate-700 mx-2 hidden sm:block" />
            {activePipelineId && (
              <Button
                onClick={() => setIsAddLeadsModalOpen(true)}
                variant="outline"
                className="flex items-center gap-2 bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 px-3 py-2 h-auto text-sm font-medium"
              >
                <ListPlus className="w-4 h-4" />{" "}
                <span className="hidden xl:inline">Importar</span>
              </Button>
            )}
            {pipelines.length > 0 && (
              <Button
                onClick={openNewLead}
                className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white border-0 shadow-lg shadow-green-500/20 dark:shadow-green-900/30 transition-all active:scale-95 h-auto py-2"
              >
                <Plus className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">Novo Lead</span>
              </Button>
            )}
          </div>
        </header>

        <main className="flex-1 overflow-x-auto overflow-y-hidden p-6 relative bg-slate-50 dark:bg-slate-950">
          {pipelines.length === 0 && !isLoading ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-400 dark:text-slate-500">
              <AlertCircle className="w-12 h-12 mb-4 opacity-20" />
              <p>Você ainda não tem funis.</p>
              <button
                onClick={() => setIsPipelineModalOpen(true)}
                className="mt-4 text-green-600 dark:text-green-400 font-bold hover:underline"
              >
                Criar Primeiro Funil
              </button>
            </div>
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCorners}
              onDragStart={onDragStart}
              onDragOver={onDragOver}
              onDragEnd={onDragEnd}
            >
              <div className="flex h-full min-w-max pb-4">
                <SortableContext
                  items={activePipelineColumns.map((c) => c.id)}
                  strategy={horizontalListSortingStrategy}
                >
                  {activePipelineColumns.map((col) => (
                    <div key={col.id} className="mr-4">
                      <SortableColumn
                        column={col}
                        leads={activePipelineLeads.filter(
                          (l) => l.columnId === col.id
                        )}
                        onCardClick={openEditLead}
                        onDeleteColumn={openDeleteColumnModal}
                        onDeleteDeal={openDeleteDealModal}
                        onCardContextMenu={handleContextMenu}
                        onCardMessage={handleOpenMessage}
                        onCardDeal={handleOpenDeal}
                      />
                    </div>
                  ))}
                </SortableContext>
                {activePipelineId && (
                  <div className="min-w-[280px] w-[280px] h-full">
                    <button
                      onClick={() => setIsColumnModalOpen(true)}
                      className="w-full h-12 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-green-600 dark:hover:text-green-400 hover:border-green-400 dark:hover:border-green-600 hover:bg-green-50 dark:hover:bg-green-900/10 transition-all font-medium gap-2"
                    >
                      <Plus className="w-5 h-5" /> Adicionar Etapa
                    </button>
                  </div>
                )}
              </div>
              <DragOverlay dropAnimation={dropAnimation}>
                {activeColumn && (
                  <SortableColumn
                    column={activeColumn}
                    leads={activePipelineLeads.filter(
                      (l) => l.columnId === activeColumn.id
                    )}
                    onCardClick={() => {}}
                    onDeleteColumn={() => {}}
                    onDeleteDeal={() => {}}
                    onCardContextMenu={() => {}}
                    onCardMessage={() => {}}
                    onCardDeal={() => {}}
                  />
                )}
                {activeLead && (
                  <SortableLeadCard
                    lead={activeLead}
                    onClick={() => {}}
                    onDelete={() => {}}
                    onMessage={() => {}}
                    onDeal={() => {}}
                  />
                )}
              </DragOverlay>
            </DndContext>
          )}

          {contextMenu.visible && (
            <div
              className="fixed z-[9999] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg shadow-xl py-1 min-w-[200px] animate-in fade-in zoom-in-95 duration-75"
              style={{ top: contextMenu.y, left: contextMenu.x }}
            >
              <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                Mover para outro funil
              </div>
              <div className="max-h-[200px] overflow-y-auto">
                {pipelines
                  .filter((p) => p.id !== activePipelineId)
                  .map((pipe) => (
                    <button
                      key={pipe.id}
                      onClick={() => handleMoveToPipeline(pipe.id)}
                      className="w-full text-left px-4 py-2.5 text-sm text-slate-700 dark:text-slate-300 hover:bg-green-50 dark:hover:bg-slate-800 hover:text-green-600 dark:hover:text-green-400 flex items-center gap-2 transition-colors"
                    >
                      <span className="text-lg leading-none">
                        {pipe.icon || "☀️"}
                      </span>
                      <span className="truncate flex-1">{pipe.name}</span>
                      {pipe.favorite && (
                        <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                      )}
                    </button>
                  ))}
                {pipelines.length <= 1 && (
                  <div className="px-4 py-3 text-xs text-slate-400 text-center italic">
                    Sem outros funis disponíveis.
                  </div>
                )}
              </div>
            </div>
          )}
        </main>

        <CreatePipelineModal
          isOpen={isPipelineModalOpen}
          onClose={() => setIsPipelineModalOpen(false)}
          onSave={handleCreatePipeline}
        />
        <CreateColumnModal
          isOpen={isColumnModalOpen}
          onClose={() => setIsColumnModalOpen(false)}
          onSave={handleCreateColumn}
        />
        <LeadModal
          isOpen={isLeadModalOpen}
          onClose={() => setIsLeadModalOpen(false)}
          onSave={handleSaveLead}
          mode={leadModalMode}
          formData={formData}
          setFormData={setFormData}
          isSaving={isSaving}
          onRefresh={fetchPipelines}
        />
        <AddLeadsModal
          isOpen={isAddLeadsModalOpen}
          onClose={() => setIsAddLeadsModalOpen(false)}
          pipelineId={activePipelineId}
          franchiseeId={user?.franchisee?.id || ""}
          onSuccess={handleLeadsAddedSuccess}
          existingLeadIds={existingLeadIds}
        />
        <EditPipelineModal
          isOpen={isEditPipelineModalOpen}
          onClose={() => setIsEditPipelineModalOpen(false)}
          pipeline={activePipelineData}
          onUpdate={handleUpdatePipeline}
          onDelete={handleDeletePipeline}
        />
        <DeleteColumnModal
          isOpen={isDeleteColumnModalOpen}
          onClose={() => setIsDeleteColumnModalOpen(false)}
          onConfirm={confirmDeleteColumn}
          isDeleting={isDeletingColumn}
        />
        <DeleteDealModal
          isOpen={isDeleteDealModalOpen}
          onClose={() => setIsDeleteDealModalOpen(false)}
          onConfirm={confirmDeleteDeal}
          isDeleting={isDeletingDeal}
        />
        <OrganizeAiModal
          isOpen={isOrganizeAiModalOpen}
          onClose={() => setIsOrganizeAiModalOpen(false)}
          leads={activePipelineLeads}
          pipelineId={activePipelineId}
          onSuccess={() => {
            fetchPipelines();
            toast({
              title: "Sucesso! ✨",
              description: "O funil foi reorganizado pela IA.",
            });
          }}
        />
        <MessageModal
          isOpen={isMessageModalOpen}
          onClose={() => setIsMessageModalOpen(false)}
          lead={selectedLeadForMessage}
          FranchiseeId={user?.franchisee?.id || ""}
          onSendMessage={handleSendMessage}
        />
        {isCreateDealModalOpen && (
          <CreateDealModal
            open={isCreateDealModalOpen}
            onClose={() => setIsCreateDealModalOpen(false)}
            onSuccess={() => {
              fetchPipelines();
              setIsCreateDealModalOpen(false);
            }}
            franchiseeId={user?.franchisee?.id || ""}
            initialLeadId={selectedLeadForDeal?.leadId ?? ""}
          />
        )}
      </div>
    </FranchiseeLayout>
  );
}
