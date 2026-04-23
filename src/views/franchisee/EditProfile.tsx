import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import {
  updateUser,
  updateProfilePhotoRequestFranchisee,
} from "@/controllers/superAdmin/useAuthController";
import {
  ArrowLeft,
  User,
  Mail,
  Save,
  Shield,
  CheckCircle,
  AlertCircle,
  MapPin,
  Building2,
  FileText,
  Phone,
  Info,
  Camera,
  Lock,
  Sparkles,
} from "lucide-react";

interface UserData {
  id: string;
  email: string;
  franchisee?: {
    municipality?: string;
    cep?: string;
    uf?: string;
    cnpj?: string;
    phone?: string;
    address?: string;
    profilePhoto?: string;
    createdAt?: string;
  };
  logo?: string;
  createdAt?: string;
  lastLogin?: string;
}

interface FormData {
  email: string;
}

interface FormErrors {
  email?: string;
  submit?: string;
  photo?: string;
}

// Converte qualquer string de imagem (base64 puro ou data URL) para src válido
const toImgSrc = (
  value: string | null | undefined,
  fallback: string
): string => {
  if (!value) return fallback;
  if (value.startsWith("data:")) return value;
  return `data:image/png;base64,${value}`;
};

export default function EditProfile() {
  const { user, updateProfilePhoto } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isPhotoLoading, setIsPhotoLoading] = useState(false);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [errors, setErrors] = useState<FormErrors>({});
  const [successMessage, setSuccessMessage] = useState("");
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isPremium = user?.franchisee?.plan_type === "PREMIUM";

  // previewPhoto armazena o data URI completo para exibição local imediata
  const [previewPhoto, setPreviewPhoto] = useState<string | null>(null);

  // Foto de perfil do franqueado (JPEG base64) tem prioridade;
  // se não existir, usa a logo da conta (PNG base64), com fallback para placeholder.
  const profilePhotoSrc =
    previewPhoto ??
    (user?.franchisee?.profilePhoto
      ? `data:image/jpeg;base64,${user.franchisee.profilePhoto}`
      : toImgSrc(user?.logo, "/placeholder-logo.png"));

  const hasPhoto = !!(
    previewPhoto ||
    user?.franchisee?.profilePhoto ||
    user?.logo
  );

  const [formData, setFormData] = useState<FormData>({ email: "" });

  useEffect(() => {
    const stored = localStorage.getItem("currentUser");
    if (stored) {
      const parsedUser = JSON.parse(stored);
      setUserData(parsedUser);
      setFormData({ email: parsedUser.email });
    }
  }, []);

  const validateForm = () => {
    const newErrors: FormErrors = {};
    if (!formData.email) {
      newErrors.email = "Email é obrigatório";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Email inválido";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handlePhotoClick = () => {
    if (!isPremium) return;
    fileInputRef.current?.click();
  };

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!validTypes.includes(file.type)) {
      setErrors((prev) => ({ ...prev, photo: "Use JPG, PNG ou WebP." }));
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setErrors((prev) => ({
        ...prev,
        photo: "A imagem deve ter no máximo 5MB.",
      }));
      return;
    }

    setErrors((prev) => ({ ...prev, photo: "" }));
    setIsPhotoLoading(true);

    try {
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (ev) => {
          const result = (ev.target?.result as string).split(",")[1];
          resolve(result);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      setPreviewPhoto(`data:image/jpeg;base64,${base64}`);

      await updateProfilePhotoRequestFranchisee({
        userId: user!.franchisee!.id,
        file,
      });

      updateProfilePhoto(base64);
      setPreviewPhoto(null);

      setSuccessMessage("Foto atualizada com sucesso!");
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (error: any) {
      setPreviewPhoto(null);
      setErrors((prev) => ({
        ...prev,
        photo: error.message || "Erro ao atualizar a foto.",
      }));
    } finally {
      setIsPhotoLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async () => {
    setSuccessMessage("");
    if (!validateForm()) return;
    setIsLoading(true);

    try {
      await updateUser({
        data: { email: formData.email, userId: userData?.id },
      });

      setSuccessMessage("Email atualizado com sucesso!");

      const updatedUser = { ...userData, email: formData.email };
      localStorage.setItem("currentUser", JSON.stringify(updatedUser));
      setUserData(updatedUser as UserData);

      setTimeout(() => navigate("/superadmin"), 2000);
    } catch (error: any) {
      setErrors({ submit: error.message || "Erro ao atualizar email" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => navigate("/superadmin");

  const formatCNPJ = (cnpj?: string) => {
    if (!cnpj) return "N/A";
    const cleaned = cnpj.replace(/\D/g, "");
    if (cleaned.length !== 14) return cnpj;
    return cleaned.replace(
      /^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/,
      "$1.$2.$3/$4-$5"
    );
  };

  if (!userData) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-green-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-600 dark:text-slate-400">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-green-50/30 to-emerald-50/30 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 transition-colors duration-300">
      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-white/80 dark:bg-slate-900/80 border-b border-slate-200/50 dark:border-slate-800 shadow-sm">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={handleBack}
              className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors group"
            >
              <ArrowLeft className="w-6 h-6 text-slate-600 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white" />
            </button>
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-green-600 to-emerald-600 rounded-2xl blur opacity-50 dark:opacity-40" />
                <div className="relative w-14 h-14 bg-gradient-to-br from-green-600 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <User className="w-7 h-7 text-white" />
                </div>
              </div>
              <div>
                <h1 className="font-bold text-2xl text-slate-800 dark:text-white tracking-tight">
                  Editar Perfil
                </h1>
                <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
                  Gerencie suas informações pessoais
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8 max-w-5xl">
        {successMessage && (
          <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
            <p className="text-green-700 dark:text-green-300 font-medium">
              {successMessage}
            </p>
          </div>
        )}

        {errors.submit && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
            <p className="text-red-700 dark:text-red-300 font-medium">
              {errors.submit}
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/60 dark:border-slate-800 shadow-sm overflow-hidden sticky top-24">
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 p-6 border-b border-slate-200 dark:border-slate-800">
                <div className="flex flex-col items-center text-center">
                  {/* Foto com upload */}
                  <div className="relative group mb-2">
                    <div
                      onClick={handlePhotoClick}
                      className={`relative w-24 h-24 rounded-2xl overflow-hidden bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700 border-2 transition-all duration-200 ${
                        isPremium
                          ? "border-green-300 dark:border-green-700 cursor-pointer hover:border-green-500"
                          : "border-slate-200 dark:border-slate-700 cursor-not-allowed"
                      }`}
                    >
                      {hasPhoto ? (
                        <img
                          src={profilePhotoSrc}
                          alt="Foto de perfil"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <User className="w-12 h-12 text-slate-400 dark:text-slate-500" />
                        </div>
                      )}

                      <div
                        className={`absolute inset-0 flex items-center justify-center transition-opacity duration-200 ${
                          isPhotoLoading
                            ? "opacity-100 bg-black/60"
                            : isPremium
                            ? "opacity-0 group-hover:opacity-100 bg-black/50"
                            : "opacity-100 bg-black/40"
                        }`}
                      >
                        {isPhotoLoading ? (
                          <div className="w-7 h-7 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : isPremium ? (
                          <Camera className="w-7 h-7 text-white" />
                        ) : (
                          <Lock className="w-6 h-6 text-white/90" />
                        )}
                      </div>
                    </div>

                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      className="hidden"
                      onChange={handlePhotoChange}
                      disabled={!isPremium || isPhotoLoading}
                    />

                    {isPremium ? (
                      <div className="absolute -bottom-2 -right-2 w-7 h-7 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center shadow-md border-2 border-white dark:border-slate-900">
                        <Camera className="w-3.5 h-3.5 text-white" />
                      </div>
                    ) : (
                      <div className="absolute -bottom-2 -right-2 w-7 h-7 bg-slate-400 dark:bg-slate-600 rounded-full flex items-center justify-center shadow-md border-2 border-white dark:border-slate-900">
                        <Lock className="w-3.5 h-3.5 text-white" />
                      </div>
                    )}
                  </div>

                  {errors.photo && (
                    <p className="text-xs text-red-500 dark:text-red-400 mb-2 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {errors.photo}
                    </p>
                  )}

                  {isPremium ? (
                    <p className="text-xs text-green-600 dark:text-green-400 font-medium mb-4">
                      {isPhotoLoading
                        ? "Salvando foto..."
                        : "Clique na foto para alterar"}
                    </p>
                  ) : (
                    <div className="flex items-center gap-1.5 mb-4 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 rounded-full">
                      <Lock className="w-3 h-3 text-slate-400" />
                      <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                        Exclusivo para{" "}
                        <span className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-emerald-600 dark:from-green-400 dark:to-emerald-400">
                          PREMIUM
                        </span>
                      </p>
                    </div>
                  )}

                  <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-1">
                    Franqueado
                  </h2>
                  <p className="text-sm text-slate-600 dark:text-slate-400 font-medium">
                    ID: {userData.id}
                  </p>
                </div>
              </div>

              <div className="p-6 space-y-3">
                <div
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl border ${
                    isPremium
                      ? "bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-green-200 dark:border-green-900/30"
                      : "bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700"
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      isPremium
                        ? "bg-green-100 dark:bg-green-900/30"
                        : "bg-slate-200 dark:bg-slate-700"
                    }`}
                  >
                    <Sparkles
                      className={`w-4 h-4 ${
                        isPremium
                          ? "text-green-600 dark:text-green-400"
                          : "text-slate-400 dark:text-slate-500"
                      }`}
                    />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                      Plano Atual
                    </p>
                    <p
                      className={`text-sm font-bold ${
                        isPremium
                          ? "text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-emerald-600 dark:from-green-400 dark:to-emerald-400"
                          : "text-slate-600 dark:text-slate-300"
                      }`}
                    >
                      {user?.franchisee?.plan_type ?? "BASIC"}
                    </p>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/10 dark:to-emerald-900/10 border border-green-200 dark:border-green-900/30 rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Shield className="w-5 h-5 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-800 dark:text-slate-200 text-sm mb-1">
                        Segurança
                      </h4>
                      <p className="text-xs text-slate-600 dark:text-slate-400">
                        Para alterar sua senha, contate o administrador.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/60 dark:border-slate-800 shadow-sm overflow-hidden">
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 p-4 border-b border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center">
                    <Mail className="w-5 h-5 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-800 dark:text-white">
                      Informações de Acesso
                    </h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      Você pode editar seu email
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-6">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                    Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 dark:text-slate-500" />
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className={`w-full pl-12 pr-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 bg-slate-50 dark:bg-slate-800 dark:text-white dark:focus:bg-slate-900 focus:bg-white transition-colors ${
                        errors.email
                          ? "border-red-300 dark:border-red-800"
                          : "border-slate-200 dark:border-slate-700"
                      }`}
                      placeholder="seu@email.com"
                    />
                  </div>
                  {errors.email && (
                    <p className="mt-2 text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" />
                      {errors.email}
                    </p>
                  )}
                </div>

                <div className="flex gap-3 mt-6 pt-6 border-t border-slate-200 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={handleBack}
                    disabled={isLoading}
                    className="flex-1 px-6 py-3 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 font-semibold transition-colors disabled:opacity-50"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={isLoading}
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-xl font-semibold flex items-center justify-center gap-2 shadow-lg shadow-green-900/20 hover:shadow-xl hover:scale-105 transition-all disabled:opacity-50 disabled:hover:scale-100"
                  >
                    {isLoading ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Salvando...
                      </>
                    ) : (
                      <>
                        <Save className="w-5 h-5" />
                        Salvar Alterações
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/60 dark:border-slate-800 shadow-sm overflow-hidden">
              <div className="bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-800 p-4 border-b border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-slate-200 dark:bg-slate-700 rounded-xl flex items-center justify-center">
                    <Building2 className="w-5 h-5 text-slate-600 dark:text-slate-300" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-800 dark:text-white">
                      Dados do Franqueado
                    </h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      Informações somente leitura
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                {[
                  {
                    label: "Município",
                    value: userData.franchisee?.municipality,
                    icon: MapPin,
                  },
                  {
                    label: "Cep",
                    value: userData.franchisee?.cep,
                    icon: MapPin,
                  },
                  { label: "UF", value: userData.franchisee?.uf, icon: MapPin },
                  {
                    label: "CNPJ",
                    value: formatCNPJ(userData.franchisee?.cnpj),
                    icon: FileText,
                  },
                ].map(({ label, value, icon: Icon }) => (
                  <div key={label} className="space-y-2">
                    <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                      {label}
                    </label>
                    <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                      <Icon className="w-5 h-5 text-slate-400 dark:text-slate-500 flex-shrink-0" />
                      <span className="text-slate-700 dark:text-slate-200 font-medium">
                        {value || "N/A"}
                      </span>
                    </div>
                  </div>
                ))}

                {userData.franchisee?.phone && (
                  <div className="space-y-2">
                    <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                      Telefone
                    </label>
                    <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                      <Phone className="w-5 h-5 text-slate-400 dark:text-slate-500 flex-shrink-0" />
                      <span className="text-slate-700 dark:text-slate-200 font-medium">
                        {userData.franchisee.phone}
                      </span>
                    </div>
                  </div>
                )}

                {userData.franchisee?.address && (
                  <div className="space-y-2 md:col-span-2">
                    <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                      Endereço
                    </label>
                    <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                      <MapPin className="w-5 h-5 text-slate-400 dark:text-slate-500 flex-shrink-0" />
                      <span className="text-slate-700 dark:text-slate-200 font-medium">
                        {userData.franchisee.address}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/10 dark:to-orange-900/10 border border-amber-200 dark:border-amber-900/30 rounded-xl p-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-amber-100 dark:bg-amber-900/30 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Info className="w-6 h-6 text-amber-600 dark:text-amber-500" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-800 dark:text-white mb-2">
                    Informações Importantes
                  </h4>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Os dados do franqueado não podem ser alterados por aqui.
                    Para modificar informações como município, estado, CNPJ ou
                    outros dados cadastrais, entre em contato com o suporte
                    técnico.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
