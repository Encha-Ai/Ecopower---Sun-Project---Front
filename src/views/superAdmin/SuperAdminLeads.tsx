import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { createPortal } from "react-dom";
import * as XLSX from "xlsx"; // Certifique-se de ter instalado: npm install xlsx
import {
  ArrowLeft,
  Search,
  Filter,
  Download,
  Upload,
  Loader2,
  X,
  CheckCircle,
  Info,
  FileSpreadsheet,
  FileUp,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiClient } from "@/lib/apiClient";

const url = apiClient.getBaseUrl();

export default function SuperAdminLeads() {
  const navigate = useNavigate();
  const { toast } = useToast();

  // Ref para o input DE DENTRO do modal
  const modalFileInputRef = useRef<HTMLInputElement>(null);

  // Estados de Dados
  const [leads, setLeads] = useState<any[]>([]);
  const [franchisees, setFranchisees] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedFranchisee, setSelectedFranchisee] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState("");

  // Estados do Modal
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importSuccess, setImportSuccess] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // --- EFEITOS ---
  useEffect(() => {
    fetchFranchisees();
    fetchLeads();
  }, []);

  useEffect(() => {
    // Recarrega leads quando muda a franquia (ou limpa filtro)
    fetchLeads();
  }, [selectedFranchisee]);

  // --- FETCH DATA ---
  const fetchFranchisees = async () => {
    try {
      const res = await apiClient.get(`${url}/franchisee`);
      const data = await res.json();
      setFranchisees(data);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchLeads = async () => {
    setLoading(true);
    try {
      const query = selectedFranchisee
        ? `?franchiseeId=${selectedFranchisee}`
        : "";
      const res = await apiClient.get(`${url}/leads${query}`);
      const data = await res.json();
      setLeads(data);
    } catch (error) {
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
      const query = selectedFranchisee
        ? `?franchiseeId=${selectedFranchisee}`
        : "";
      const response = await apiClient.get(`${url}/leads/export${query}`);
      if (!response.ok) throw new Error("Erro");
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = downloadUrl;
      const filename = selectedFranchisee
        ? `leads_franquia_${selectedFranchisee.slice(0, 5)}.csv`
        : `leads_GLOBAL_completo.csv`;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      toast({ title: "Sucesso", description: "Exportação iniciada." });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Falha na exportação.",
        variant: "destructive",
      });
    }
  };

  // --- LÓGICA DO MODAL DE IMPORTAÇÃO ---

  const handleOpenImportModal = () => {
    if (!selectedFranchisee) {
      toast({
        title: "Atenção",
        description: "Selecione uma franquia antes de importar.",
        variant: "destructive",
      });
      return;
    }
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
    if (!selectedFile || !selectedFranchisee) return;

    setIsImporting(true);
    const formData = new FormData();
    formData.append("file", selectedFile);
    formData.append("franchiseeId", selectedFranchisee);

    try {
      const response = await apiClient.post(`${url}/leads/import`, formData);

      if (response.ok) {
        setImportSuccess(true);
        fetchLeads(); // Atualiza a lista
        toast({
          title: "Sucesso!",
          description: "Leads importados para a franquia selecionada.",
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

  // --- FILTROS VISUAIS ---
  const filteredLeads = leads.filter(
    (l) =>
      (l.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (l.email || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (l.franchisee?.name || "")
        .toLowerCase()
        .includes(searchTerm.toLowerCase()),
  );

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-6">
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
                  {/* Mostra em qual franquia está importando */}
                  <p className="text-xs text-slate-500 mt-1">
                    Destino:{" "}
                    <span className="font-bold text-green-600">
                      {franchisees.find((f) => f.id === selectedFranchisee)
                        ?.name || "Franquia Selecionada"}
                    </span>
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
          document.body,
        )}

      {/* HEADER DA PÁGINA */}
      <div className="flex flex-col gap-6 mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate("/superadmin")}
              className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full transition-colors"
            >
              <ArrowLeft className="w-6 h-6 text-slate-600 dark:text-slate-400" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
                Gestão Global de Leads
              </h1>
              <p className="text-slate-500 dark:text-slate-400">
                Visualize e gerencie leads de toda a rede
              </p>
            </div>
          </div>
          <div className="text-right hidden md:block">
            <p className="text-xs text-slate-400 uppercase font-bold">
              Total na Base
            </p>
            <p className="text-2xl font-bold text-slate-800 dark:text-slate-100">
              {filteredLeads.length}
            </p>
          </div>
        </div>

        {/* Barra de Ferramentas */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto">
            {/* Seletor de Franquia */}
            <div className="relative">
              <select
                value={selectedFranchisee}
                onChange={(e) => setSelectedFranchisee(e.target.value)}
                className="pl-9 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-300 outline-none focus:ring-2 focus:ring-green-500 dark:focus:ring-green-400 appearance-none min-w-[240px] cursor-pointer"
              >
                <option value="">Todas as Franquias</option>
                {franchisees.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name} ({f.municipality}-{f.uf})
                  </option>
                ))}
              </select>
              <Filter className="absolute left-3 top-2.5 w-4 h-4 text-slate-400 pointer-events-none" />
            </div>

            {/* Busca */}
            <div className="relative w-full md:w-64">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar nome, email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none focus:ring-2 focus:ring-green-500 dark:focus:ring-green-400 text-slate-900 dark:text-slate-100"
              />
            </div>
          </div>

          <div className="flex gap-3 w-full md:w-auto justify-end">
            <button
              onClick={handleExport}
              className="flex items-center gap-2 px-4 py-2.5 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/50 rounded-lg hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-colors text-sm font-bold"
            >
              <Download className="w-4 h-4" />
              {selectedFranchisee ? "Exportar Franquia" : "Exportar Tudo"}
            </button>

            {/* BOTÃO IMPORTAR ATUALIZADO */}
            {selectedFranchisee ? (
              <button
                onClick={handleOpenImportModal} // Agora abre o modal!
                className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:from-green-600 hover:to-green-700 transition-colors text-sm font-bold shadow-sm cursor-pointer"
              >
                <Upload className="w-4 h-4" />
                Importar Leads
              </button>
            ) : (
              // Estado Desabilitado (Mantive igual para segurança)
              <div className="relative group">
                <button
                  disabled
                  className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-400 rounded-lg cursor-not-allowed text-sm font-bold border border-slate-200 dark:border-slate-700"
                >
                  <Upload className="w-4 h-4" /> Importar
                </button>
                <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                  Selecione uma franquia para importar
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* TABELA DE LEADS */}
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center flex flex-col items-center justify-center">
            <Loader2 className="w-8 h-8 text-green-500 animate-spin mb-2" />
            <p className="text-slate-400 text-sm">
              Carregando base de dados...
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-gradient-to-r from-slate-100 to-slate-50 dark:from-slate-800 dark:to-slate-800/50 text-slate-700 dark:text-slate-300 font-bold border-b-2 border-green-500 dark:border-green-600">
                <tr>
                  <th className="p-4 w-[25%] text-sm uppercase tracking-wide">
                    Lead / Cliente
                  </th>
                  <th className="p-4 w-[20%] text-sm uppercase tracking-wide">
                    Contato
                  </th>
                  <th className="p-4 w-[15%] text-sm uppercase tracking-wide">
                    Tipo
                  </th>
                  <th className="p-4 w-[15%] text-sm uppercase tracking-wide">
                    Data
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                {filteredLeads.map((lead) => (
                  <tr
                    key={lead.id}
                    className="hover:bg-green-50 dark:hover:bg-green-900/10 transition-colors group border-l-4 border-transparent hover:border-green-500"
                  >
                    <td className="p-4">
                      <p className="font-bold text-slate-800 dark:text-slate-100 text-base">
                        {lead.name || "Sem nome"}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                        ID: {lead.id?.split("-")[0] || "N/A"}
                      </p>
                    </td>
                    <td className="p-4">
                      <div className="flex flex-col gap-1">
                        <span className="text-slate-700 dark:text-slate-200 font-medium">
                          {lead.email || "Sem email"}
                        </span>
                        <span className="text-slate-500 dark:text-slate-400 text-xs font-medium">
                          {lead.phone || "Sem telefone"}
                        </span>
                      </div>
                    </td>
                    <td className="p-4">
                      <span
                        className={`px-3 py-1.5 rounded-full text-xs font-bold shadow-sm ${
                          lead.type === "CLIENT"
                            ? "bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800"
                            : "bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-800"
                        }`}
                      >
                        {lead.type || "LEAD"}
                      </span>
                    </td>
                    <td className="p-4 text-slate-600 dark:text-slate-300 text-sm font-medium">
                      {lead.createdAt
                        ? new Date(lead.createdAt).toLocaleDateString("pt-BR")
                        : "-"}
                    </td>
                  </tr>
                ))}
                {filteredLeads.length === 0 && (
                  <tr>
                    <td colSpan={5} className="p-12 text-center text-slate-400">
                      Nenhum lead encontrado com os filtros atuais.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
