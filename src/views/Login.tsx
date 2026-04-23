import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Loader2,
  Lock,
  Mail,
  AlertCircle,
  Sparkles,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
  Users,
  Zap,
  CheckCircle2,
} from "lucide-react";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const { login, isLoading, error, clearError } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();

    const user = await login({ email, password });

    if (user) {
      if (user.type.toLowerCase() === "superadmin") {
        navigate("/superadmin");
      } else {
        navigate("/franchisee");
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-green-50/50 to-emerald-50/40 dark:from-slate-900 dark:via-slate-900 dark:to-slate-950 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Animado Aprimorado */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        {/* Orbes de gradiente animados - mais sutis */}
        <div className="absolute top-[-15%] left-[-10%] w-[45%] h-[45%] bg-gradient-to-br from-green-500/10 to-emerald-500/10 dark:from-green-500/20 dark:to-emerald-500/20 rounded-full blur-[120px] animate-orb-float" />
        <div className="absolute bottom-[-15%] right-[-10%] w-[45%] h-[45%] bg-gradient-to-tl from-emerald-500/8 to-teal-500/8 dark:from-emerald-500/15 dark:to-teal-500/15 rounded-full blur-[120px] animate-orb-float-delayed" />
        <div className="absolute top-1/3 left-1/4 w-[35%] h-[35%] bg-gradient-to-r from-green-400/8 to-emerald-400/8 dark:from-green-400/12 dark:to-emerald-400/12 rounded-full blur-[100px] animate-orb-float-slow" />

        {/* Malha de grid animada - mais sutil */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#10b98108_1px,transparent_1px),linear-gradient(to_bottom,#10b98108_1px,transparent_1px)] bg-[size:32px_32px]" />

        {/* Partículas flutuantes melhoradas */}
        <div className="absolute top-[15%] left-[12%] w-3 h-3 bg-green-400/30 dark:bg-green-400/40 rounded-full animate-particle-float shadow-lg shadow-green-500/30" />
        <div className="absolute top-[45%] right-[18%] w-4 h-4 bg-emerald-400/30 dark:bg-emerald-400/40 rounded-full animate-particle-float-delayed shadow-lg shadow-emerald-500/30" />
        <div className="absolute bottom-[25%] left-[20%] w-2 h-2 bg-teal-400/30 dark:bg-teal-400/40 rounded-full animate-particle-float-slow shadow-lg shadow-teal-500/30" />
        <div className="absolute top-[70%] right-[30%] w-3 h-3 bg-green-300/30 dark:bg-green-300/40 rounded-full animate-particle-float shadow-lg shadow-green-400/30" />

        {/* Estrelas piscando */}
        <div className="absolute top-[20%] right-[15%] w-1.5 h-1.5 bg-green-500/40 dark:bg-white/60 rounded-full animate-twinkle" />
        <div className="absolute bottom-[40%] left-[30%] w-1 h-1 bg-emerald-500/40 dark:bg-white/50 rounded-full animate-twinkle-delayed" />
        <div className="absolute top-[60%] left-[15%] w-1.5 h-1.5 bg-green-500/40 dark:bg-white/60 rounded-full animate-twinkle-slow" />
      </div>

      {/* Card Principal com efeito de vidro */}
      <Card className="w-full max-w-[480px] relative z-10 backdrop-blur-2xl bg-white/95 dark:bg-slate-900/95 shadow-[0_8px_32px_0_rgba(16,185,129,0.15)] dark:shadow-[0_8px_32px_0_rgba(0,0,0,0.5)] border border-slate-200/50 dark:border-slate-700/50 overflow-hidden transition-all duration-700 hover:shadow-[0_8px_40px_0_rgba(16,185,129,0.25)] hover:scale-[1.02] animate-card-entrance">
        {/* Barra de progresso com gradiente */}
        {isLoading && (
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-green-500/20 to-transparent overflow-hidden">
            <div className="h-full w-1/3 bg-gradient-to-r from-green-400 via-emerald-500 to-green-400 animate-loading-bar shadow-lg shadow-green-500/50" />
          </div>
        )}

        {/* Linha decorativa superior com gradiente animado */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-green-400 via-emerald-500 to-teal-500 animate-gradient-flow" />

        {/* Efeito de brilho superior */}
        <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-green-500/10 to-transparent pointer-events-none" />

        <CardHeader className="space-y-4 text-center pb-8 pt-14 px-8">
          {/* Logo/Ícone com animação melhorada */}
          <div className="mx-auto relative animate-logo-entrance">
            <div className="w-28 h-28 bg-gradient-to-br from-green-500 via-emerald-500 to-green-600 dark:from-green-600 dark:to-emerald-700 rounded-[2rem] flex items-center justify-center shadow-[0_20px_60px_-15px_rgba(16,185,129,0.5)] dark:shadow-[0_20px_60px_-15px_rgba(16,185,129,0.3)] transform transition-all duration-500 hover:scale-110 hover:rotate-6 group relative overflow-hidden">
              {/* Reflexo animado */}
              <div className="absolute inset-0 bg-gradient-to-tr from-white/30 via-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

              {/* Brilho rotativo */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />

              <ShieldCheck className="w-14 h-14 text-white drop-shadow-2xl group-hover:scale-110 transition-transform duration-300 relative z-10" />

              {/* Badge de energia animado */}
              <div className="absolute -top-3 -right-3 bg-gradient-to-br from-yellow-400 via-orange-500 to-yellow-500 p-2.5 rounded-full shadow-xl shadow-orange-500/50 animate-badge-bounce">
                <Zap className="w-5 h-5 text-white fill-white drop-shadow-lg" />
              </div>
            </div>

            {/* Anéis decorativos animados */}
            <div className="absolute -inset-4 border-2 border-green-400/30 rounded-[2.5rem] animate-ping-slow" />
            <div className="absolute -inset-6 border border-emerald-400/20 rounded-[3rem] animate-ping-slower" />

            {/* Partículas ao redor do logo */}
            <Sparkles className="absolute -top-2 -left-2 w-6 h-6 text-green-400 animate-sparkle" />
            <Sparkles className="absolute -bottom-2 -right-2 w-5 h-5 text-emerald-400 animate-sparkle-delayed" />
          </div>

          <div className="space-y-3 animate-fade-in-up">
            <CardTitle className="text-4xl font-black tracking-tight bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 dark:from-white dark:via-slate-100 dark:to-white bg-clip-text text-transparent drop-shadow-sm">
              Bem-vindo de Volta!
            </CardTitle>
            <CardDescription className="text-slate-600 dark:text-slate-300 text-lg font-medium">
              Acesse sua conta para continuar
            </CardDescription>
          </div>

          {/* Indicador de status melhorado */}
          <div className="flex items-center justify-center gap-2 pt-3 animate-fade-in-up-delayed">
            <div className="flex items-center gap-2 px-4 py-2 bg-green-50 dark:bg-green-500/20 backdrop-blur-sm rounded-full border border-green-200 dark:border-green-400/30 shadow-lg shadow-green-500/10">
              <div className="relative">
                <div className="w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse-strong" />
                <div className="absolute inset-0 w-2.5 h-2.5 bg-green-500 rounded-full animate-ping" />
              </div>
              <span className="text-xs font-bold text-green-700 dark:text-green-300 uppercase tracking-widest">
                Sistema Online
              </span>
              <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </CardHeader>

        <CardContent className="pb-12 px-8">
          <form onSubmit={handleSubmit} className="space-y-7">
            {/* Alert de Erro aprimorado */}
            {error &&
              (() => {
                const isSessionActiveError =
                  error.startsWith("SESSION_ACTIVE:");
                const displayError = isSessionActiveError
                  ? error.replace("SESSION_ACTIVE:", "")
                  : error;

                return (
                  <Alert
                    variant={isSessionActiveError ? "default" : "destructive"}
                    className={
                      isSessionActiveError
                        ? "border-amber-300 bg-amber-50 dark:bg-amber-900/30 dark:border-amber-700 animate-alert-entrance shadow-lg"
                        : "border-red-300 bg-red-50 dark:bg-red-900/30 dark:border-red-700 animate-alert-entrance shadow-lg"
                    }
                  >
                    {isSessionActiveError ? (
                      <Users className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                    ) : (
                      <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                    )}
                    <AlertDescription className="font-medium text-sm text-slate-900 dark:text-slate-100">
                      {displayError}
                      {isSessionActiveError && (
                        <div className="mt-2 text-sm">
                          <a
                            href="mailto:suporte@empresa.com"
                            className="text-amber-700 dark:text-amber-300 underline hover:text-amber-800 dark:hover:text-amber-200 font-semibold transition-colors"
                          >
                            Contatar Suporte
                          </a>
                        </div>
                      )}
                    </AlertDescription>
                  </Alert>
                );
              })()}

            {/* Campo de E-mail aprimorado */}
            <div className="space-y-3">
              <Label
                htmlFor="email"
                className="text-sm font-bold text-slate-700 dark:text-slate-200 ml-1 flex items-center gap-2"
              >
                E-mail
                <span className="text-green-600 dark:text-green-400">*</span>
              </Label>
              <div className="relative group">
                {/* Glow effect no foco */}
                <div
                  className={`absolute -inset-1 bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl opacity-0 blur-xl transition-all duration-500 ${
                    emailFocused ? "opacity-70" : ""
                  }`}
                />

                <div className="relative">
                  <div
                    className={`absolute left-4 top-1/2 -translate-y-1/2 transition-all duration-300 ${
                      emailFocused ? "scale-110" : ""
                    }`}
                  >
                    <Mail
                      className={`h-5 w-5 transition-colors duration-300 ${
                        emailFocused
                          ? "text-green-400 drop-shadow-[0_0_8px_rgba(16,185,129,0.8)]"
                          : "text-slate-400"
                      }`}
                    />
                  </div>

                  <Input
                    id="email"
                    type="email"
                    placeholder="seu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onFocus={() => setEmailFocused(true)}
                    onBlur={() => setEmailFocused(false)}
                    className="relative pl-12 h-14 bg-white dark:bg-slate-800 border-2 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-green-500 dark:focus:border-green-400 focus:ring-4 focus:ring-green-500/20 transition-all duration-300 rounded-2xl text-base font-medium shadow-lg hover:shadow-xl hover:bg-slate-50 dark:hover:bg-slate-750"
                    required
                  />

                  {/* Linha decorativa inferior */}
                  <div
                    className={`absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-green-400 to-emerald-400 transition-all duration-500 ${
                      emailFocused ? "w-full" : "w-0"
                    }`}
                  />
                </div>
              </div>
            </div>

            {/* Campo de Senha aprimorado */}
            <div className="space-y-3">
              <Label
                htmlFor="password"
                className="text-sm font-bold text-slate-700 dark:text-slate-200 ml-1 flex items-center gap-2"
              >
                Senha
                <span className="text-green-600 dark:text-green-400">*</span>
              </Label>
              <div className="relative group">
                {/* Glow effect no foco */}
                <div
                  className={`absolute -inset-1 bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl opacity-0 blur-xl transition-all duration-500 ${
                    passwordFocused ? "opacity-70" : ""
                  }`}
                />

                <div className="relative">
                  <div
                    className={`absolute left-4 top-1/2 -translate-y-1/2 transition-all duration-300 ${
                      passwordFocused ? "scale-110" : ""
                    }`}
                  >
                    <Lock
                      className={`h-5 w-5 transition-colors duration-300 ${
                        passwordFocused
                          ? "text-green-600 dark:text-green-400 drop-shadow-[0_0_8px_rgba(16,185,129,0.8)]"
                          : "text-slate-400"
                      }`}
                    />
                  </div>

                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onFocus={() => setPasswordFocused(true)}
                    onBlur={() => setPasswordFocused(false)}
                    className="relative pl-12 pr-12 h-14 bg-white dark:bg-slate-800 border-2 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-green-500 dark:focus:border-green-400 focus:ring-4 focus:ring-green-500/20 transition-all duration-300 rounded-2xl text-base font-medium shadow-lg hover:shadow-xl hover:bg-slate-50 dark:hover:bg-slate-750"
                    required
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-green-600 dark:hover:text-green-400 transition-all duration-300 z-10 p-2 rounded-lg hover:bg-green-50 dark:hover:bg-green-500/20 backdrop-blur-sm hover:scale-110"
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>

                  {/* Linha decorativa inferior */}
                  <div
                    className={`absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-green-400 to-emerald-400 transition-all duration-500 ${
                      passwordFocused ? "w-full" : "w-0"
                    }`}
                  />
                </div>
              </div>
            </div>

            {/* Botão de Login aprimorado */}
            <Button
              type="submit"
              className="w-full h-14 bg-gradient-to-r from-green-500 via-emerald-500 to-green-500 hover:from-green-600 hover:via-emerald-600 hover:to-green-600 text-white font-bold rounded-2xl shadow-[0_10px_40px_-10px_rgba(16,185,129,0.6)] hover:shadow-[0_15px_50px_-10px_rgba(16,185,129,0.8)] transition-all duration-500 active:scale-95 group relative overflow-hidden text-base mt-8 border border-green-400/50"
              disabled={isLoading}
            >
              {/* Efeito shimmer aprimorado */}
              <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/30 to-transparent skew-x-12" />

              {/* Partículas no hover */}
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                <div className="absolute top-1/4 left-1/4 w-1 h-1 bg-white rounded-full animate-particle-float" />
                <div className="absolute top-3/4 right-1/4 w-1 h-1 bg-white rounded-full animate-particle-float-delayed" />
              </div>

              {isLoading ? (
                <div className="flex items-center justify-center relative z-10">
                  <Loader2 className="mr-3 h-5 w-5 animate-spin" />
                  <span>Autenticando...</span>
                </div>
              ) : (
                <div className="flex items-center justify-center relative z-10">
                  <span>Entrar</span>
                  <ArrowRight className="ml-3 h-5 w-5 group-hover:translate-x-2 transition-transform duration-300" />
                </div>
              )}
            </Button>
          </form>
        </CardContent>

        {/* Footer aprimorado */}
        <div className="px-8 pb-8 text-center">
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Ao entrar, você concorda com nossos{" "}
            <a
              href="#"
              className="text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 hover:underline font-semibold transition-colors"
            >
              Termos de Uso
            </a>
          </p>
        </div>

        {/* Brilho inferior */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-green-500/10 to-transparent pointer-events-none" />
      </Card>

      {/* Estilos Customizados Aprimorados */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
        @keyframes orb-float {
          0%, 100% { 
            transform: translate(0, 0) scale(1);
            opacity: 0.3;
          }
          25% { 
            transform: translate(30px, -30px) scale(1.1);
            opacity: 0.4;
          }
          50% { 
            transform: translate(-20px, 20px) scale(0.9);
            opacity: 0.25;
          }
          75% { 
            transform: translate(20px, 30px) scale(1.05);
            opacity: 0.35;
          }
        }

        @keyframes orb-float-delayed {
          0%, 100% { 
            transform: translate(0, 0) scale(1) rotate(0deg);
            opacity: 0.25;
          }
          33% { 
            transform: translate(-40px, 30px) scale(1.15) rotate(120deg);
            opacity: 0.35;
          }
          66% { 
            transform: translate(30px, -20px) scale(0.85) rotate(240deg);
            opacity: 0.2;
          }
        }

        @keyframes orb-float-slow {
          0%, 100% { 
            transform: translate(0, 0) scale(1);
            opacity: 0.2;
          }
          50% { 
            transform: translate(-50px, -40px) scale(1.2);
            opacity: 0.3;
          }
        }

        @keyframes particle-float {
          0%, 100% { 
            transform: translate(0, 0) scale(1);
            opacity: 0.4;
          }
          50% { 
            transform: translate(-20px, -30px) scale(1.5);
            opacity: 0.8;
          }
        }

        @keyframes particle-float-delayed {
          0%, 100% { 
            transform: translate(0, 0) scale(1);
            opacity: 0.3;
          }
          50% { 
            transform: translate(25px, -35px) scale(1.3);
            opacity: 0.7;
          }
        }

        @keyframes particle-float-slow {
          0%, 100% { 
            transform: translate(0, 0) scale(1) rotate(0deg);
            opacity: 0.5;
          }
          50% { 
            transform: translate(-15px, -40px) scale(1.8) rotate(180deg);
            opacity: 0.9;
          }
        }

        @keyframes twinkle {
          0%, 100% { opacity: 0.3; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.5); }
        }

        @keyframes twinkle-delayed {
          0%, 100% { opacity: 0.2; transform: scale(1); }
          50% { opacity: 0.9; transform: scale(1.8); }
        }

        @keyframes twinkle-slow {
          0%, 100% { opacity: 0.4; transform: scale(1); }
          50% { opacity: 1; transform: scale(2); }
        }

        @keyframes loading-bar {
          0% { transform: translateX(-200%); }
          100% { transform: translateX(400%); }
        }

        @keyframes gradient-flow {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }

        @keyframes card-entrance {
          0% { 
            opacity: 0; 
            transform: translateY(30px) scale(0.95);
          }
          100% { 
            opacity: 1; 
            transform: translateY(0) scale(1);
          }
        }

        @keyframes logo-entrance {
          0% { 
            opacity: 0; 
            transform: scale(0) rotate(-180deg);
          }
          50% {
            transform: scale(1.1) rotate(10deg);
          }
          100% { 
            opacity: 1; 
            transform: scale(1) rotate(0deg);
          }
        }

        @keyframes badge-bounce {
          0%, 100% { 
            transform: translateY(0) scale(1);
          }
          50% { 
            transform: translateY(-8px) scale(1.1);
          }
        }

        @keyframes ping-slow {
          0% { 
            transform: scale(1);
            opacity: 0.5;
          }
          50% {
            opacity: 0.2;
          }
          100% { 
            transform: scale(1.3);
            opacity: 0;
          }
        }

        @keyframes ping-slower {
          0% { 
            transform: scale(1);
            opacity: 0.3;
          }
          50% {
            opacity: 0.1;
          }
          100% { 
            transform: scale(1.5);
            opacity: 0;
          }
        }

        @keyframes sparkle {
          0%, 100% { 
            opacity: 0;
            transform: scale(0) rotate(0deg);
          }
          50% { 
            opacity: 1;
            transform: scale(1) rotate(180deg);
          }
        }

        @keyframes sparkle-delayed {
          0%, 100% { 
            opacity: 0;
            transform: scale(0) rotate(0deg);
          }
          50% { 
            opacity: 0.8;
            transform: scale(1.2) rotate(-180deg);
          }
        }

        @keyframes fade-in-up {
          0% { 
            opacity: 0; 
            transform: translateY(20px);
          }
          100% { 
            opacity: 1; 
            transform: translateY(0);
          }
        }

        @keyframes fade-in-up-delayed {
          0% { 
            opacity: 0; 
            transform: translateY(20px);
          }
          100% { 
            opacity: 1; 
            transform: translateY(0);
          }
        }

        @keyframes pulse-strong {
          0%, 100% { 
            opacity: 1;
            transform: scale(1);
          }
          50% { 
            opacity: 0.5;
            transform: scale(1.2);
          }
        }

        @keyframes alert-entrance {
          0% { 
            opacity: 0; 
            transform: translateY(-10px) scale(0.95);
          }
          100% { 
            opacity: 1; 
            transform: translateY(0) scale(1);
          }
        }

        @keyframes grid-flow {
          0% { 
            transform: translate(0, 0);
          }
          100% { 
            transform: translate(32px, 32px);
          }
        }

        .animate-orb-float {
          animation: orb-float 20s ease-in-out infinite;
        }

        .animate-orb-float-delayed {
          animation: orb-float-delayed 25s ease-in-out infinite;
        }

        .animate-orb-float-slow {
          animation: orb-float-slow 30s ease-in-out infinite;
        }

        .animate-particle-float {
          animation: particle-float 4s ease-in-out infinite;
        }

        .animate-particle-float-delayed {
          animation: particle-float-delayed 5s ease-in-out infinite;
        }

        .animate-particle-float-slow {
          animation: particle-float-slow 6s ease-in-out infinite;
        }

        .animate-twinkle {
          animation: twinkle 2s ease-in-out infinite;
        }

        .animate-twinkle-delayed {
          animation: twinkle-delayed 3s ease-in-out infinite;
        }

        .animate-twinkle-slow {
          animation: twinkle-slow 4s ease-in-out infinite;
        }

        .animate-loading-bar {
          animation: loading-bar 1.5s ease-in-out infinite;
        }

        .animate-gradient-flow {
          background-size: 200% 200%;
          animation: gradient-flow 3s ease infinite;
        }

        .animate-card-entrance {
          animation: card-entrance 0.8s ease-out;
        }

        .animate-logo-entrance {
          animation: logo-entrance 1s ease-out;
        }

        .animate-badge-bounce {
          animation: badge-bounce 2s ease-in-out infinite;
        }

        .animate-ping-slow {
          animation: ping-slow 3s cubic-bezier(0, 0, 0.2, 1) infinite;
        }

        .animate-ping-slower {
          animation: ping-slower 4s cubic-bezier(0, 0, 0.2, 1) infinite;
        }

        .animate-sparkle {
          animation: sparkle 3s ease-in-out infinite;
        }

        .animate-sparkle-delayed {
          animation: sparkle-delayed 3s ease-in-out infinite 1.5s;
        }

        .animate-fade-in-up {
          animation: fade-in-up 0.8s ease-out 0.3s both;
        }

        .animate-fade-in-up-delayed {
          animation: fade-in-up-delayed 0.8s ease-out 0.6s both;
        }

        .animate-pulse-strong {
          animation: pulse-strong 2s ease-in-out infinite;
        }

        .animate-alert-entrance {
          animation: alert-entrance 0.4s ease-out;
        }

        .animate-grid-flow {
          animation: grid-flow 20s linear infinite;
        }

        /* Altura personalizada */
        .h-14 { 
          height: 3.5rem; 
        }

        /* Melhorias no autofill com tema escuro */
        input:-webkit-autofill,
        input:-webkit-autofill:hover,
        input:-webkit-autofill:focus {
          -webkit-box-shadow: 0 0 0px 1000px #ffffff inset !important;
          -webkit-text-fill-color: #0f172a !important;
          transition: background-color 5000s ease-in-out 0s;
        }

        .dark input:-webkit-autofill,
        .dark input:-webkit-autofill:hover,
        .dark input:-webkit-autofill:focus {
          -webkit-box-shadow: 0 0 0px 1000px #1e293b inset !important;
          -webkit-text-fill-color: #f1f5f9 !important;
        }

        /* Scroll suave */
        * {
          scroll-behavior: smooth;
        }
      `,
        }}
      />
    </div>
  );
}
