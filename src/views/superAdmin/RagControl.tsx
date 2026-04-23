import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { RagMain } from "@/components/SuperAdmin/Rag/RagMain";
import { RagConcessionarias } from "@/components/SuperAdmin/Rag/RagConcessionarias";

import { ArrowLeft, MessageSquare, Database, MapPin } from "lucide-react";
import RagChatModal from "@/components/SuperAdmin/Rag/RagChatModal";

export default function RagControl() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"main" | "uf">("main");
  const [isChatOpen, setIsChatOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col transition-colors duration-300">
      {/* HEADER */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 py-4 flex items-center justify-between sticky top-0 z-10 shadow-sm">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate("/superadmin")}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-slate-600 dark:text-slate-400" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <Database className="w-5 h-5 text-green-600 dark:text-green-400" />
              Controle RAG (Base de Conhecimento)
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Gerencie os PDFs e teste a inteligência da IA
            </p>
          </div>
        </div>

        {/*}
        <button
          onClick={() => setIsChatOpen(true)}
          className="bg-slate-900 dark:bg-green-600 hover:bg-slate-800 dark:hover:bg-green-700 text-white px-4 py-2.5 rounded-lg flex items-center gap-2 text-sm font-medium transition-all shadow-md hover:shadow-lg dark:shadow-green-900/20"
          disabled
        >
          <MessageSquare className="w-4 h-4" />
          Testar Chat
        </button>
         {*/}
      </div>

      {/* CONTEÚDO */}
      <main className="flex-1 p-6 max-w-6xl mx-auto w-full space-y-6">
        {/* TABS */}
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab("main")}
            className={`px-4 py-2.5 rounded-lg font-medium transition-all flex items-center gap-2 ${
              activeTab === "main"
                ? "bg-green-600 text-white shadow-md shadow-green-200 dark:shadow-none"
                : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800"
            }`}
          >
            <Database className="w-4 h-4" />
            Base Principal
          </button>
          <button
            onClick={() => setActiveTab("uf")}
            className={`px-4 py-2.5 rounded-lg font-medium transition-all flex items-center gap-2 ${
              activeTab === "uf"
                ? "bg-green-600 text-white shadow-md shadow-green-200 dark:shadow-none"
                : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800"
            }`}
          >
            <MapPin className="w-4 h-4" />
            Base por Concessionárias
          </button>
        </div>

        {/* CONTEÚDO DA TAB */}
        {activeTab === "main" ? <RagMain /> : <RagConcessionarias />}
      </main>

      {/* Modal de Chat */}
      <RagChatModal isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />
    </div>
  );
}
