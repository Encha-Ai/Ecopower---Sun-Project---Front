import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import {
  updateUser,
  updateProfilePhotoSuperAdmin,
} from "@/controllers/superAdmin/useAuthController";
import {
  ArrowLeft,
  User,
  Mail,
  Lock,
  Save,
  Eye,
  EyeOff,
  Shield,
  CheckCircle,
  AlertCircle,
  Pencil,
} from "lucide-react";
import LogoEditModal from "@/components/SuperAdmin/EditLogo";

// Interfaces
interface UserData {
  id: string;
  email: string;
  type: string;
  logo?: string;
  token?: string;
}

interface FormData {
  email: string;
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

interface FormErrors {
  email?: string;
  currentPassword?: string;
  newPassword?: string;
  confirmPassword?: string;
  submit?: string;
}

export default function EditProfile() {
  const { updateProfilePhoto } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [errors, setErrors] = useState<FormErrors>({});
  const [successMessage, setSuccessMessage] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const navigate = useNavigate();
  const [logo, setLogo] = useState<string>("");

  const [formData, setFormData] = useState<FormData>({
    email: "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  // ✅ CORREÇÃO: popula userData + formData + logo a partir do localStorage no mount
  useEffect(() => {
    const stored = localStorage.getItem("currentUser");
    if (!stored) return;

    const parsed: UserData = JSON.parse(stored);
    setUserData(parsed);
    setLogo(parsed?.logo || "");
    setFormData((prev) => ({
      ...prev,
      email: parsed?.email || "",
    }));
  }, []);

  // Escuta mudanças de outras abas
  useEffect(() => {
    const handleStorageChange = () => {
      const stored = JSON.parse(localStorage.getItem("currentUser") || "{}");
      setLogo(stored?.logo || "");
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  const validateForm = () => {
    const newErrors: FormErrors = {};
    if (!formData.email) {
      newErrors.email = "Email é obrigatório";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Email inválido";
    }
    if (formData.newPassword || formData.confirmPassword) {
      if (!formData.newPassword) {
        newErrors.newPassword = "Nova senha é obrigatória";
      } else if (formData.newPassword.length < 6) {
        newErrors.newPassword = "Senha deve ter no mínimo 6 caracteres";
      }
      if (formData.newPassword !== formData.confirmPassword) {
        newErrors.confirmPassword = "As senhas não coincidem";
      }
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

  const handleLogoSave = async (file: File) => {
    try {
      // ✅ Envia pro backend
      await updateProfilePhotoSuperAdmin({
        file,
        id: userData!.id,
      });

      // ✅ Como o backend não retorna o base64, gera localmente a partir do file
      const pureLogo = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result as string;
          // Remove o prefixo "data:image/...;base64," e fica só o base64 puro
          const base64 = result.split(",")[1];
          resolve(base64);
        };
        reader.onerror = () => reject(new Error("Falha ao ler o arquivo"));
        reader.readAsDataURL(file);
      });

      // ✅ Atualiza estado local
      setLogo(pureLogo);

      // ✅ Atualiza localStorage
      const updatedUser = { ...userData, logo: pureLogo };
      localStorage.setItem("currentUser", JSON.stringify(updatedUser));
      setUserData(updatedUser as UserData);

      // ✅ Atualiza o AuthContext — dispara o useEffect no Dashboard
      updateProfilePhoto(pureLogo);

      // ✅ Notifica outros componentes montados na mesma aba
      window.dispatchEvent(
        new CustomEvent("logoUpdated", { detail: { logo: pureLogo } })
      );

      setSuccessMessage("Logo atualizada com sucesso!");
    } catch (error) {
      console.error("Erro ao salvar a logo:", error);
      setSuccessMessage("");
    }
    setTimeout(() => setSuccessMessage(""), 3000);
  };

  const handleSubmit = async () => {
    setSuccessMessage("");
    if (!validateForm()) return;
    setIsLoading(true);
    try {
      const data = {
        email: formData.email,
        password: formData.newPassword,
        userId: userData?.id,
      };
      await updateUser({ data });
      setFormData((prev) => ({
        ...prev,
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      }));
      setSuccessMessage("Perfil atualizado com sucesso!");
      const updatedUser = { ...userData, email: formData.email };
      localStorage.setItem("currentUser", JSON.stringify(updatedUser));
      setUserData(updatedUser as UserData);
      setTimeout(() => {
        navigate("/superadmin");
      }, 2000);
    } catch (error: any) {
      setErrors({ submit: error.message || "Erro ao atualizar perfil" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    navigate("/superadmin");
  };

  if (!userData) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-green-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600 dark:text-slate-400">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-green-50/30 to-emerald-50/30 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 transition-colors duration-300">
      {/* Modal de Edição de Logo */}
      <LogoEditModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        currentLogo={logo}
        onSave={handleLogoSave}
      />

      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-white/80 dark:bg-slate-900/80 border-b border-slate-200/50 dark:border-slate-800 shadow-sm">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={handleBack}
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors group"
              >
                <ArrowLeft className="w-6 h-6 text-slate-600 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white" />
              </button>
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-green-600 to-emerald-600 rounded-2xl blur opacity-50 dark:opacity-40"></div>
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
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8 max-w-4xl">
        {successMessage && (
          <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800/50 rounded-xl flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
            <p className="text-green-700 dark:text-green-300 font-medium">
              {successMessage}
            </p>
          </div>
        )}

        {errors.submit && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 rounded-xl flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
            <p className="text-red-700 dark:text-red-400 font-medium">
              {errors.submit}
            </p>
          </div>
        )}

        {/* Profile Card */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/60 dark:border-slate-800 shadow-sm overflow-hidden">
          {/* Header do Card */}
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 p-6 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-4">
              <div className="relative group">
                <div className="relative w-16 h-16 rounded-2xl overflow-hidden bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700 border-2 border-slate-200 dark:border-slate-700">
                  {logo ? (
                    <img
                      src={
                        logo.startsWith("data:")
                          ? logo
                          : `data:image/png;base64,${logo}`
                      }
                      alt="Logo"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <User className="w-8 h-8 text-slate-400 dark:text-slate-500" />
                    </div>
                  )}
                </div>
                <button
                  onClick={() => setIsModalOpen(true)}
                  className="absolute -bottom-1 -right-1 w-6 h-6 bg-gradient-to-r from-green-600 to-emerald-600 rounded-lg flex items-center justify-center shadow-lg hover:shadow-xl hover:scale-110 transition-all"
                >
                  <Pencil className="w-3 h-3 text-white" />
                </button>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-1">
                  Super Admin
                </h2>
                <p className="text-sm text-slate-600 dark:text-slate-400 font-medium">
                  ID: {userData.id}
                </p>
              </div>
            </div>
          </div>

          {/* Form Content */}
          <div className="p-6 space-y-6">
            {/* Email Section */}
            <div>
              <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2">
                <Mail className="w-5 h-5 text-green-600 dark:text-green-400" />
                Informações de Acesso
              </h3>
              <div className="space-y-4">
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
                      className={`w-full pl-12 pr-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 bg-slate-50 dark:bg-slate-800 focus:bg-white dark:focus:bg-slate-900 transition-colors text-slate-900 dark:text-slate-100 ${
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
              </div>
            </div>

            {/* Password Section */}
            <div className="pt-6 border-t border-slate-200 dark:border-slate-800">
              <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2">
                <Lock className="w-5 h-5 text-green-600 dark:text-green-400" />
                Alterar Senha
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                    Nova Senha
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 dark:text-slate-500" />
                    <input
                      type={showPassword ? "text" : "password"}
                      name="newPassword"
                      value={formData.newPassword}
                      onChange={handleInputChange}
                      className={`w-full pl-12 pr-12 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 bg-slate-50 dark:bg-slate-800 focus:bg-white dark:focus:bg-slate-900 transition-colors text-slate-900 dark:text-slate-100 ${
                        errors.newPassword
                          ? "border-red-300 dark:border-red-800"
                          : "border-slate-200 dark:border-slate-700"
                      }`}
                      placeholder="Digite sua nova senha"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                    >
                      {showPassword ? (
                        <EyeOff className="w-5 h-5" />
                      ) : (
                        <Eye className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                  {errors.newPassword && (
                    <p className="mt-2 text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" />
                      {errors.newPassword}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                    Confirmar Nova Senha
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 dark:text-slate-500" />
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      className={`w-full pl-12 pr-12 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 bg-slate-50 dark:bg-slate-800 focus:bg-white dark:focus:bg-slate-900 transition-colors text-slate-900 dark:text-slate-100 ${
                        errors.confirmPassword
                          ? "border-red-300 dark:border-red-800"
                          : "border-slate-200 dark:border-slate-700"
                      }`}
                      placeholder="Confirme sua nova senha"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="w-5 h-5" />
                      ) : (
                        <Eye className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                  {errors.confirmPassword && (
                    <p className="mt-2 text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" />
                      {errors.confirmPassword}
                    </p>
                  )}
                </div>

                <div className="bg-green-50 dark:bg-green-900/10 border border-green-100 dark:border-green-800/30 rounded-xl p-4">
                  <p className="text-sm text-green-700 dark:text-green-300">
                    <strong>Dica:</strong> Use uma senha forte com pelo menos 6
                    caracteres. Deixe os campos em branco se não desejar alterar
                    a senha.
                  </p>
                </div>
              </div>
            </div>

            {/* Buttons */}
            <div className="flex gap-3 pt-6 border-t border-slate-200 dark:border-slate-800">
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
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
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

        {/* Info Card */}
        <div className="mt-6 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/10 dark:to-emerald-900/10 border border-green-200 dark:border-green-900/30 rounded-xl p-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center flex-shrink-0">
              <Shield className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <h4 className="font-bold text-slate-800 dark:text-slate-100 mb-2">
                Segurança da Conta
              </h4>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Suas informações estão protegidas. Sempre use senhas fortes e
                únicas. Nunca compartilhe suas credenciais de acesso com outras
                pessoas.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
