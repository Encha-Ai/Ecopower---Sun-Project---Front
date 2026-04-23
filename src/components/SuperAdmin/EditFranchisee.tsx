import { useState, useEffect } from "react";
import {
  X,
  User,
  Mail,
  Lock,
  Building2,
  Crown,
  ChevronRight,
  Eye,
  EyeOff,
  KeyRound,
} from "lucide-react";

// ─── Formatters ───────────────────────────────────────────────────────────────

const formatCPF = (v: string) =>
  v
    .replace(/\D/g, "")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})$/, "$1-$2")
    .slice(0, 14);

const formatCNPJ = (v: string) =>
  v
    .replace(/\D/g, "")
    .replace(/(\d{2})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1/$2")
    .replace(/(\d{4})(\d{1,2})$/, "$1-$2")
    .slice(0, 18);

const formatPhone = (v: string) => {
  const c = v.replace(/\D/g, "");
  if (c.length <= 10)
    return c
      .replace(/(\d{2})(\d)/, "($1) $2")
      .replace(/(\d{4})(\d{1,4})$/, "$1-$2")
      .slice(0, 14);
  return c
    .replace(/(\d{2})(\d)/, "($1) $2")
    .replace(/(\d{5})(\d{1,4})$/, "$1-$2")
    .slice(0, 15);
};

const formatCEP = (v: string) =>
  v
    .replace(/\D/g, "")
    .replace(/(\d{5})(\d{1,3})$/, "$1-$2")
    .slice(0, 9);

const cleanNumber = (v: string) => v.replace(/\D/g, "");

const UF_LIST = [
  "AC",
  "AL",
  "AP",
  "AM",
  "BA",
  "CE",
  "DF",
  "ES",
  "GO",
  "MA",
  "MT",
  "MS",
  "MG",
  "PA",
  "PB",
  "PR",
  "PE",
  "PI",
  "RJ",
  "RN",
  "RS",
  "RO",
  "RR",
  "SC",
  "SP",
  "SE",
  "TO",
];

// ─── Types ────────────────────────────────────────────────────────────────────

interface EditFranchiseeProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: any) => void;
  franchiseeData?: {
    user: { email: string };
    franchisee: {
      id: string;
      user_id: string;
      name: string;
      phone: string;
      cpf: string;
      cnpj?: string;
      cep: string;
      municipality: string;
      uf: string;
      plan_type: string;
      limit_scrap_go: number;
      limitPipelineCreation: number;
    };
  };
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function EditFranchisee({
  open,
  onClose,
  onSave,
  franchiseeData,
}: EditFranchiseeProps) {
  const [step, setStep] = useState(1);

  // Step 1 — Acesso
  const [userId, setUserID] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [changePassword, setChangePassword] = useState(false);

  // Step 2 — Dados
  const [id, setId] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [cpf, setCpf] = useState("");
  const [cnpj, setCnpj] = useState("");
  const [cep, setCep] = useState("");
  const [municipality, setMunicipality] = useState("");
  const [uf, setUf] = useState("");

  // Step 3 — Plano
  const [planType, setPlanType] = useState("BASIC");
  const [limitScrapGo, setLimitScrapGo] = useState(0);
  const [limitPipelineCreation, setLimitPipelineCreation] = useState(0);

  useEffect(() => {
    if (open && franchiseeData) {
      const fd = franchiseeData.franchisee;
      setEmail(franchiseeData.user.email || "");
      setUserID(fd.user_id || "");
      setPassword("");
      setChangePassword(false);
      setShowPassword(false);
      setId(fd.id || "");
      setName(fd.name || "");
      setPhone(formatPhone(fd.phone || ""));
      setCpf(formatCPF(fd.cpf || ""));
      setCnpj(formatCNPJ(fd.cnpj || ""));
      setCep(formatCEP(fd.cep || ""));
      setMunicipality(fd.municipality || "");
      setUf(fd.uf || "");
      setPlanType(fd.plan_type || "BASIC");
      setLimitScrapGo(fd.limit_scrap_go ?? 0);
      setLimitPipelineCreation(fd.limitPipelineCreation ?? 0);
      setStep(1);
    }
  }, [open, franchiseeData]);

  const handleSave = () => {
    const data: any = {
      activeTab: step === 1 ? "access" : "personal",
      user: { email, userId },
      franchisee: {
        id,
        name,
        phone: cleanNumber(phone),
        cpf: cleanNumber(cpf),
        cnpj: cnpj ? cleanNumber(cnpj) : undefined,
        cep: cleanNumber(cep),
        municipality,
        uf,
        plan_type: planType,
        limit_scrap_go: limitScrapGo,
        limitPipelineCreation,
      },
    };
    if (changePassword && password) data.user.password = password;
    onSave(data);
  };

  if (!open) return null;

  const steps = [
    { n: 1, label: "Acesso" },
    { n: 2, label: "Dados" },
    { n: 3, label: "Plano" },
  ];

  const inputCls =
    "w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500/50 transition-all";
  const labelCls =
    "block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5";

  return (
    <div className="fixed inset-0 bg-black/50 dark:bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-lg border border-slate-100 dark:border-slate-800 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
              <User className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <h2 className="font-bold text-slate-900 dark:text-slate-100 text-lg leading-none">
                Editar Franqueado
              </h2>
              {franchiseeData && (
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                  {franchiseeData.franchisee.name}
                </p>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="h-8 w-8 flex items-center justify-center rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* ── Stepper clicável ── */}
        <div className="px-6 py-4 flex items-center gap-2 border-b border-slate-100 dark:border-slate-800">
          {steps.map((s, i) => (
            <div key={s.n} className="flex items-center gap-2 flex-1">
              <button
                type="button"
                onClick={() => setStep(s.n)}
                className={`h-7 w-7 rounded-lg flex items-center justify-center text-xs font-bold transition-all shrink-0 ${
                  step === s.n
                    ? "bg-emerald-600 text-white"
                    : step > s.n
                      ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-200 dark:hover:bg-emerald-900/50"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
                }`}
              >
                {step > s.n ? "✓" : s.n}
              </button>
              <button
                type="button"
                onClick={() => setStep(s.n)}
                className={`text-xs font-medium transition-colors hover:text-emerald-600 dark:hover:text-emerald-400 ${
                  step === s.n
                    ? "text-slate-900 dark:text-slate-100"
                    : "text-slate-400"
                }`}
              >
                {s.label}
              </button>
              {i < steps.length - 1 && (
                <div
                  className={`flex-1 h-px ml-1 ${
                    step > s.n
                      ? "bg-emerald-200 dark:bg-emerald-800"
                      : "bg-slate-200 dark:bg-slate-700"
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4 max-h-[55vh] overflow-y-auto">
          {/* ── Step 1: Acesso ── */}
          {step === 1 && (
            <>
              <div>
                <label className={labelCls}>Email</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="email"
                    placeholder="email@exemplo.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={inputCls + " pl-10"}
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className={labelCls + " mb-0"}>Senha</label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <div
                      onClick={() => setChangePassword(!changePassword)}
                      className={`w-9 h-5 rounded-full transition-colors relative ${
                        changePassword
                          ? "bg-emerald-500"
                          : "bg-slate-200 dark:bg-slate-700"
                      }`}
                    >
                      <div
                        className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                          changePassword ? "translate-x-4" : "translate-x-0"
                        }`}
                      />
                    </div>
                    <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                      Alterar senha
                    </span>
                  </label>
                </div>
                <div className="relative">
                  <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder={changePassword ? "Nova senha" : "••••••••"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={!changePassword}
                    className={
                      inputCls +
                      " pl-10 pr-10 disabled:opacity-40 disabled:cursor-not-allowed"
                    }
                  />
                  {changePassword && (
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                    >
                      {showPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  )}
                </div>
                {changePassword && (
                  <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1.5">
                    Deixe em branco para manter a senha atual.
                  </p>
                )}
              </div>
            </>
          )}

          {/* ── Step 2: Dados ── */}
          {step === 2 && (
            <>
              <div>
                <label className={labelCls}>Nome Completo</label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Nome do franqueado"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className={inputCls + " pl-10"}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Telefone</label>
                  <input
                    type="text"
                    placeholder="(00) 00000-0000"
                    value={phone}
                    onChange={(e) => setPhone(formatPhone(e.target.value))}
                    maxLength={15}
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className={labelCls}>CPF</label>
                  <input
                    type="text"
                    placeholder="000.000.000-00"
                    value={cpf}
                    onChange={(e) => setCpf(formatCPF(e.target.value))}
                    maxLength={14}
                    className={inputCls}
                  />
                </div>
              </div>

              <div>
                <label className={labelCls}>
                  CNPJ{" "}
                  <span className="normal-case text-slate-400">(opcional)</span>
                </label>
                <input
                  type="text"
                  placeholder="00.000.000/0000-00"
                  value={cnpj}
                  onChange={(e) => setCnpj(formatCNPJ(e.target.value))}
                  maxLength={18}
                  className={inputCls}
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className={labelCls}>UF</label>
                  <select
                    value={uf}
                    onChange={(e) => setUf(e.target.value)}
                    className={inputCls}
                  >
                    <option value="">UF</option>
                    {UF_LIST.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>CEP</label>
                  <input
                    type="text"
                    placeholder="00000-000"
                    value={cep}
                    onChange={(e) => setCep(formatCEP(e.target.value))}
                    maxLength={9}
                    disabled={!uf}
                    className={inputCls + " disabled:opacity-50"}
                  />
                </div>
                <div>
                  <label className={labelCls}>Município</label>
                  <input
                    type="text"
                    placeholder="Cidade"
                    value={municipality}
                    onChange={(e) => setMunicipality(e.target.value)}
                    disabled={!uf}
                    className={inputCls + " disabled:opacity-50"}
                  />
                </div>
              </div>
            </>
          )}

          {/* ── Step 3: Plano ── */}
          {step === 3 && (
            <>
              <div>
                <label className={labelCls}>Plano</label>
                <div className="grid grid-cols-2 gap-3 mt-1">
                  <button
                    type="button"
                    onClick={() => setPlanType("BASIC")}
                    className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                      planType === "BASIC"
                        ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20"
                        : "border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600"
                    }`}
                  >
                    <Building2
                      className={`w-5 h-5 ${planType === "BASIC" ? "text-emerald-600 dark:text-emerald-400" : "text-slate-400"}`}
                    />
                    <span
                      className={`text-sm font-bold ${planType === "BASIC" ? "text-emerald-700 dark:text-emerald-400" : "text-slate-500"}`}
                    >
                      Basic
                    </span>
                    <span className="text-[10px] text-slate-400">
                      Recursos essenciais
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPlanType("PREMIUM")}
                    className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                      planType === "PREMIUM"
                        ? "border-purple-500 bg-purple-50 dark:bg-purple-900/20"
                        : "border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600"
                    }`}
                  >
                    <Crown
                      className={`w-5 h-5 ${planType === "PREMIUM" ? "text-purple-600 dark:text-purple-400" : "text-slate-400"}`}
                    />
                    <span
                      className={`text-sm font-bold ${planType === "PREMIUM" ? "text-purple-700 dark:text-purple-400" : "text-slate-500"}`}
                    >
                      Premium
                    </span>
                    <span className="text-[10px] text-slate-400">
                      Todos os recursos
                    </span>
                  </button>
                </div>
              </div>

              <div>
                <label className={labelCls}>Créditos Google / mês</label>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    value={limitScrapGo}
                    onChange={(e) =>
                      setLimitScrapGo(parseInt(e.target.value) || 0)
                    }
                    className={inputCls + " flex-1"}
                    min={0}
                  />
                  <div className="px-3 py-2.5 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl text-sm font-bold text-emerald-700 dark:text-emerald-400 shrink-0">
                    {limitScrapGo} buscas
                  </div>
                </div>
              </div>

              <div>
                <label className={labelCls}>Limite de Pipelines</label>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    value={limitPipelineCreation}
                    onChange={(e) =>
                      setLimitPipelineCreation(parseInt(e.target.value) || 0)
                    }
                    className={inputCls + " flex-1"}
                    min={0}
                  />
                  <div className="px-3 py-2.5 bg-violet-50 dark:bg-violet-900/20 rounded-xl text-sm font-bold text-violet-700 dark:text-violet-400 shrink-0">
                    {limitPipelineCreation} pipelines
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <button
            onClick={step === 1 ? onClose : () => setStep(step - 1)}
            className="px-4 py-2 text-sm font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
          >
            {step === 1 ? "Cancelar" : "← Voltar"}
          </button>
          {step < 3 ? (
            <button
              onClick={() => setStep(step + 1)}
              className="flex items-center gap-2 px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl transition-colors"
            >
              Próximo <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={handleSave}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl transition-colors shadow-sm"
            >
              Salvar Alterações
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
