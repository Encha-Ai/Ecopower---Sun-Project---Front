import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { createPortal } from "react-dom";
import * as XLSX from "xlsx";
import {
  Download,
  Upload,
  Loader2,
  ArrowLeft,
  KanbanSquare,
  Search,
  X,
  CheckCircle,
  Info,
  FileSpreadsheet,
  FileUp,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

import { apiClient } from "@/lib/apiClient";

const url = apiClient.getBaseUrl();

const token = (() => {
  const user = localStorage.getItem("currentUser");
  return user ? `Bearer ${JSON.parse(user).token}` : null;
})();

export default function LeadsView() {
  const { franchiseeId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Ref para o input DE DENTRO do modal
  const modalFileInputRef = useRef<HTMLInputElement>(null);

  const [leads, setLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  // Estados do Modal
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importSuccess, setImportSuccess] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  useEffect(() => {
    if (franchiseeId) fetchLeads();
  }, [franchiseeId]);

  const fetchLeads = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get(
        `${url}/leads?franchiseeId=${franchiseeId}`
      );
      const data = await res.json();
      setLeads(data);
    } catch (error) {
      console.error(error);
      toast({
        title: "Erro",
        description: "Falha ao carregar leads",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // --- EXPORTAR ---
  const handleExport = async () => {
    try {
      const response = await apiClient.get(
        `${url}/leads/export?franchiseeId=${franchiseeId}`
      );
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = downloadUrl;
      a.download = `leads_${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(downloadUrl);
      toast({ title: "Sucesso", description: "Download iniciado." });
    } catch (error) {
      console.error(error);
      toast({
        title: "Erro",
        description: "Falha ao exportar.",
        variant: "destructive",
      });
    }
  };

  // --- LÓGICA DO MODAL DE IMPORTAÇÃO ---

  const handleOpenImportModal = () => {
    setIsImportModalOpen(true);
    setSelectedFile(null);
    setImportSuccess(false);
  };

  const handleDownloadTemplate = () => {
    const data = [
      ["name", "email", "phone", "type"],
      ["João Silva", "joao@email.com", "5511999999999", "LEAD"],
    ];
    const worksheet = XLSX.utils.aoa_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Template");
    XLSX.writeFile(workbook, "modelo_importacao_leads.xlsx");
  };

  const handleImportSubmit = async () => {
    if (!selectedFile || !franchiseeId) return;

    setIsImporting(true);
    const formData = new FormData();
    formData.append("file", selectedFile);
    formData.append("franchiseeId", franchiseeId);

    try {
      const response = await apiClient.post(`${url}/leads/import`, formData);

      if (response.ok) {
        setImportSuccess(true);
        fetchLeads();
        toast({
          title: "Sucesso!",
          description: "Leads importados.",
          className: "bg-green-600 text-white border-none",
        });
      } else {
        const text = await response.text();
        toast({
          title: "Erro na importação",
          description: text,
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro de conexão.",
        variant: "destructive",
      });
    } finally {
      setIsImporting(false);
    }
  };

  // Filtrar leads
  const filteredLeads = leads.filter(
    (lead) =>
      (lead.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (lead.email || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (lead.phone || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col">
      {/* MODAL DE IMPORTAÇÃO (PORTAL) */}
      {isImportModalOpen &&
        createPortal(
          <div className="fixed inset-0 z-[99999] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full overflow-hidden shadow-2xl animate-in slide-in-from-bottom-4 duration-300 border border-slate-100 dark:border-slate-800">
              {/* Header Modal */}
              <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                    Importar Leads
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">
                    Arquivo .xlsx, .xls ou .csv
                  </p>
                </div>
                <button
                  onClick={() => !isImporting && setIsImportModalOpen(false)}
                  className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5 text-slate-400 dark:text-slate-500" />
                </button>
              </div>

              {/* Conteúdo Modal */}
              <div className="p-6">
                {isImporting ? (
                  <div className="py-10 text-center">
                    <Loader2 className="w-12 h-12 text-green-600 animate-spin mx-auto mb-4" />
                    <p className="font-medium text-slate-700 dark:text-slate-300">
                      Processando sua planilha...
                    </p>
                  </div>
                ) : importSuccess ? (
                  <div className="py-6 text-center">
                    <div className="w-20 h-20 bg-green-50 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                      <CheckCircle className="w-10 h-10 text-green-500" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
                      Importação Concluída!
                    </h3>
                    <p className="text-slate-500 dark:text-slate-400 mb-6">
                      Seus novos leads já estão disponíveis na lista.
                    </p>
                    <button
                      onClick={() => {
                        setIsImportModalOpen(false);
                        setImportSuccess(false);
                        setSelectedFile(null);
                      }}
                      className="w-full bg-slate-900 dark:bg-green-600 text-white py-3 rounded-xl font-bold hover:bg-slate-800 dark:hover:bg-green-700 transition-all cursor-pointer"
                    >
                      Entendido
                    </button>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Info Box */}
                    <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/30 p-4 rounded-xl flex gap-3">
                      <Info className="w-5 h-5 text-amber-600 dark:text-amber-500 shrink-0" />
                      <div className="text-sm text-amber-800 dark:text-amber-400 space-y-3">
                        <div>
                          <p className="font-bold mb-1">
                            Colunas Obrigatórias:
                          </p>
                          <p>name, phone, email, type</p>
                        </div>
                        <div>
                          <p className="font-bold mb-1">Tipos Aceitos:</p>
                          <p>LEAD, CONTACT, CLIENT</p>
                        </div>
                      </div>
                    </div>

                    {/* Baixar Modelo */}
                    <button
                      onClick={handleDownloadTemplate}
                      className="w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl text-slate-600 dark:text-slate-400 hover:border-green-400 dark:hover:border-green-600 hover:text-green-600 hover:bg-green-50/50 dark:hover:bg-green-900/20 transition-all group cursor-pointer"
                    >
                      <Download className="w-4 h-4 group-hover:translate-y-0.5 transition-transform" />
                      <span className="font-medium">Baixar modelo .xlsx</span>
                    </button>

                    {/* Upload Area */}
                    <div className="relative">
                      <input
                        type="file"
                        ref={modalFileInputRef}
                        onChange={(e) =>
                          setSelectedFile(e.target.files?.[0] || null)
                        }
                        accept=".xlsx, .xls, .csv"
                        className="hidden"
                      />
                      <button
                        onClick={() => modalFileInputRef.current?.click()}
                        className={`w-full p-8 rounded-2xl border-2 border-dashed transition-all flex flex-col items-center gap-3 cursor-pointer ${
                          selectedFile
                            ? "border-green-200 bg-green-50/50 text-green-700 dark:border-green-800 dark:bg-green-900/20 dark:text-green-400"
                            : "border-slate-200 bg-slate-50 text-slate-500 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700"
                        }`}
                      >
                        {selectedFile ? (
                          <>
                            <FileSpreadsheet className="w-10 h-10 text-green-500" />
                            <div className="text-center">
                              <p className="font-bold text-sm truncate max-w-[250px]">
                                {selectedFile.name}
                              </p>
                              <p className="text-xs opacity-60">
                                Clique para alterar o arquivo
                              </p>
                            </div>
                          </>
                        ) : (
                          <>
                            <div className="w-12 h-12 bg-white dark:bg-slate-700 rounded-full shadow-sm flex items-center justify-center">
                              <FileUp className="w-6 h-6 text-green-500 dark:text-green-400" />
                            </div>
                            <span className="font-semibold">
                              Clique para selecionar arquivo
                            </span>
                          </>
                        )}
                      </button>
                    </div>

                    {/* Footer Actions */}
                    <div className="flex gap-3 pt-2">
                      <button
                        onClick={() => setIsImportModalOpen(false)}
                        className="flex-1 py-3 text-slate-600 dark:text-slate-400 font-bold hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
                      >
                        Cancelar
                      </button>
                      <button
                        onClick={handleImportSubmit}
                        disabled={!selectedFile}
                        className="flex-[2] bg-green-600 text-white py-3 rounded-xl font-bold hover:bg-green-700 disabled:opacity-40 disabled:grayscale transition-all shadow-lg shadow-green-100 dark:shadow-green-900/20 cursor-pointer"
                      >
                        Iniciar Importação
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* HEADER */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 py-4 flex flex-col md:flex-row items-start md:items-center justify-between sticky top-0 z-10 gap-4 shadow-sm">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-slate-600 dark:text-slate-400" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100">
              Gestão de Leads
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Base de contatos e clientes
            </p>
          </div>
        </div>

        <div className="flex gap-3 flex-wrap">
          <button
            onClick={() => navigate(`/dashboard/kanban/${franchiseeId}`)}
            className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium transition-all"
          >
            <KanbanSquare className="w-4 h-4" />
            Voltar para Kanban
          </button>

          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/50 rounded-lg hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-colors text-sm font-semibold"
          >
            <Download className="w-4 h-4" /> Exportar CSV
          </button>

          <button
            onClick={handleOpenImportModal}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:from-green-600 hover:to-green-700 transition-colors text-sm font-semibold shadow-sm cursor-pointer"
          >
            <Upload className="w-4 h-4" />
            Importar CSV
          </button>
        </div>
      </div>

      {/* CONTENT */}
      <div className="p-6 max-w-6xl mx-auto w-full">
        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar na lista..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200"
              />
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              {filteredLeads.length} de {leads.length} registros
            </p>
          </div>

          {loading ? (
            <div className="p-12 text-center">
              <Loader2 className="w-8 h-8 text-green-500 animate-spin mx-auto mb-2" />
              <p className="text-slate-500 dark:text-slate-400 text-sm">
                Carregando leads...
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-gradient-to-r from-slate-50 to-white dark:from-slate-800 dark:to-slate-800/50 text-slate-700 dark:text-slate-300 font-bold border-b-2 border-green-500 dark:border-green-600">
                  <tr>
                    <th className="p-4 w-1/4 uppercase tracking-wide text-xs">
                      Nome
                    </th>
                    <th className="p-4 w-1/4 uppercase tracking-wide text-xs">
                      Email
                    </th>
                    <th className="p-4 w-1/4 uppercase tracking-wide text-xs">
                      Telefone
                    </th>
                    <th className="p-4 w-1/4 uppercase tracking-wide text-xs">
                      Tipo
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {filteredLeads.map((lead) => (
                    <tr
                      key={lead.id}
                      className="hover:bg-green-50 dark:hover:bg-green-900/10 transition-colors border-l-4 border-transparent hover:border-green-500"
                    >
                      <td className="p-4 font-semibold text-slate-800 dark:text-slate-200">
                        {lead.name || "Sem nome"}
                      </td>
                      <td className="p-4 text-slate-600 dark:text-slate-400">
                        {lead.email || "Sem email"}
                      </td>
                      <td className="p-4 text-slate-600 dark:text-slate-400">
                        {lead.phone || "Sem telefone"}
                      </td>
                      <td className="p-4">
                        <span
                          className={`px-3 py-1.5 rounded-full text-xs font-bold shadow-sm border ${
                            lead.type === "CLIENT"
                              ? "bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800"
                              : "bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800"
                          }`}
                        >
                          {lead.type || "LEAD"}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {filteredLeads.length === 0 && (
                    <tr>
                      <td
                        colSpan={4}
                        className="p-12 text-center text-slate-500 dark:text-slate-400"
                      >
                        {searchTerm
                          ? "Nenhum lead encontrado com os termos de busca."
                          : "Nenhum lead encontrado. Use o botão Importar para começar."}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
