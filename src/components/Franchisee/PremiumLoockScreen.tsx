import React, { useEffect, useState } from "react";
import {
  Lock,
  Zap,
  Send,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  LucideIcon,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PremiumLockScreenFeature {
  text: string;
  icon?: LucideIcon;
}

export interface PremiumLockScreenProps {
  badge?: string;
  badgeIcon?: LucideIcon;
  heroIcon?: LucideIcon;
  title?: string;
  description?: string;
  planName?: string;
  features?: PremiumLockScreenFeature[];
  ctaLabel?: string;
  ctaIcon?: LucideIcon;
  /** If provided, takes precedence over the default navigation behaviour */
  onCtaClick?: () => void;
  footerNote?: string | null;
  gradientColors?: [string, string, string];
  className?: string;
}

// ─── Defaults ─────────────────────────────────────────────────────────────────

const DEFAULT_FEATURES: PremiumLockScreenFeature[] = [
  { text: "Busca ilimitada no Google Maps" },
  { text: "Enriquecimento automático de leads" },
  { text: "Exportação direta para o CRM" },
];

const DEFAULT_GRADIENT: [string, string, string] = [
  "#22c55e",
  "#16a34a",
  "#15803d",
];

const STAGGER_DELAYS = ["300ms", "400ms", "500ms", "600ms", "700ms"];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

function linearGradient(colors: [string, string, string], deg = 135): string {
  return `linear-gradient(${deg}deg, ${colors[0]}, ${colors[1]}, ${colors[2]})`;
}

// ─── Component ────────────────────────────────────────────────────────────────

export const PremiumLockScreen: React.FC<PremiumLockScreenProps> = ({
  badge = "Plano Premium",
  badgeIcon: BadgeIcon = Sparkles,
  heroIcon: HeroIcon = Lock,
  title = "Acesso Exclusivo",
  description = "Esta funcionalidade está disponível apenas para franqueados do plano {plan}. Clique no botão abaixo para enviar uma solicitação de upgrade e nossa equipe entrará em contato.",
  planName = "PREMIUM",
  features = DEFAULT_FEATURES,
  ctaLabel = "Solicitar Upgrade de Plano",
  ctaIcon: CtaIcon = Send,
  onCtaClick,
  footerNote = "Sua solicitação será analisada em até 1 dia útil · Sem compromisso",
  gradientColors = DEFAULT_GRADIENT,
  className = "",
}) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 50);
    return () => clearTimeout(t);
  }, []);

  const gradient = linearGradient(gradientColors);
  const glow = hexToRgba(gradientColors[0], 0.4);
  const glowStrong = hexToRgba(gradientColors[0], 0.55);
  const accentBg = `linear-gradient(135deg, ${hexToRgba(gradientColors[0], 0.14)}, ${hexToRgba(gradientColors[2], 0.14)})`;
  const accentBorder = hexToRgba(gradientColors[0], 0.3);
  const accentIconBorder = hexToRgba(gradientColors[0], 0.1);

  const descParts = description.split("{plan}");
  const descNode =
    descParts.length > 1 ? (
      <>
        {descParts[0]}
        <span
          className="font-bold"
          style={{
            background: linearGradient(gradientColors, 90),
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          {planName}
        </span>
        {descParts[1]}
      </>
    ) : (
      description
    );

  // Default CTA: navigate to /franchisee/requests on the same domain
  const handleCtaClick = () => {
    if (onCtaClick) {
      onCtaClick();
    } else {
      window.location.href = "/franchisee/requests";
    }
  };

  return (
    <div
      style={{ fontFamily: "'DM Sans', 'Sora', sans-serif" }}
      className={`relative flex flex-col items-center justify-center min-h-[70vh] p-8 overflow-hidden ${className}`}
    >
      {/* Background atmosphere */}
      <div className="absolute inset-0 -z-10 pointer-events-none">
        <div
          className="absolute inset-0"
          style={{
            background: `
              radial-gradient(ellipse 80% 60% at 50% 0%, ${hexToRgba(gradientColors[0], 0.12)} 0%, transparent 70%),
              radial-gradient(ellipse 60% 50% at 80% 100%, ${hexToRgba(gradientColors[2], 0.1)} 0%, transparent 70%)
            `,
          }}
        />
        <div
          className="absolute inset-0 opacity-[0.025]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Ccircle cx='1' cy='1' r='1' fill='%239C92AC'/%3E%3C/svg%3E")`,
          }}
        />
      </div>

      <div
        className="absolute top-16 left-1/4 w-48 h-48 rounded-full blur-3xl opacity-20 pointer-events-none"
        style={{
          background: linearGradient([
            gradientColors[0],
            gradientColors[0],
            gradientColors[2],
          ]),
        }}
      />
      <div
        className="absolute bottom-20 right-1/4 w-64 h-64 rounded-full blur-3xl opacity-15 pointer-events-none"
        style={{
          background: linearGradient([
            gradientColors[1],
            gradientColors[1],
            gradientColors[0],
          ]),
        }}
      />

      {/* Main card */}
      <div
        className="relative w-full max-w-md"
        style={{
          transform: visible ? "translateY(0)" : "translateY(24px)",
          opacity: visible ? 1 : 0,
          transition: "all 0.6s cubic-bezier(0.22, 1, 0.36, 1)",
        }}
      >
        {/* Badge */}
        <div className="flex justify-center mb-6">
          <div
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold uppercase"
            style={{
              background: accentBg,
              border: `1px solid ${accentBorder}`,
              color: gradientColors[0],
              letterSpacing: "0.1em",
            }}
          >
            <BadgeIcon className="w-3 h-3" />
            {badge}
          </div>
        </div>

        {/* Hero icon */}
        <div className="flex justify-center mb-7">
          <div className="relative">
            <div
              className="absolute inset-0 rounded-2xl blur-xl opacity-50"
              style={{ background: gradient }}
            />
            <div
              className="relative w-20 h-20 rounded-2xl flex items-center justify-center"
              style={{
                background: linearGradient([
                  gradientColors[0],
                  gradientColors[1],
                  gradientColors[1],
                ]),
                boxShadow: `0 8px 32px ${glow}`,
              }}
            >
              <HeroIcon className="w-9 h-9 text-white" strokeWidth={2} />
            </div>
          </div>
        </div>

        {/* Title */}
        <div className="text-center mb-3">
          <h2
            className="text-3xl font-black text-slate-900 dark:text-white mb-2"
            style={{ letterSpacing: "-0.03em", lineHeight: 1.1 }}
          >
            {title}
          </h2>
          <p
            className="text-sm font-medium"
            style={{ color: "#94a3b8", lineHeight: 1.6 }}
          >
            {descNode}
          </p>
        </div>

        {/* Divider */}
        <div
          className="my-6 h-px w-full"
          style={{
            background: `linear-gradient(90deg, transparent, ${hexToRgba(gradientColors[0], 0.2)}, transparent)`,
          }}
        />

        {/* Features */}
        {features.length > 0 && (
          <div className="space-y-3 mb-7">
            {features.map(({ text, icon: FeatureIcon }, i) => (
              <div
                key={i}
                className="flex items-center gap-3 px-4 py-3 rounded-xl"
                style={{
                  background: "rgba(255,255,255,0.5)",
                  border: `1px solid ${accentIconBorder}`,
                  backdropFilter: "blur(8px)",
                  transform: visible ? "translateX(0)" : "translateX(-16px)",
                  opacity: visible ? 1 : 0,
                  transition: `all 0.5s cubic-bezier(0.22, 1, 0.36, 1) ${STAGGER_DELAYS[i] ?? "600ms"}`,
                }}
              >
                <div
                  className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: accentBg }}
                >
                  {FeatureIcon ? (
                    <FeatureIcon
                      className="w-4 h-4"
                      style={{ color: gradientColors[0] }}
                    />
                  ) : (
                    <CheckCircle2
                      className="w-4 h-4"
                      style={{ color: gradientColors[0] }}
                    />
                  )}
                </div>
                <span
                  className="text-sm font-medium"
                  style={{ color: "#334155" }}
                >
                  {text}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* CTA button */}
        <button
          className="w-full group relative flex items-center justify-center gap-2 py-4 rounded-2xl font-bold text-white text-sm"
          style={{
            background: gradient,
            boxShadow: `0 4px 24px ${glow}, 0 1px 0 rgba(255,255,255,0.1) inset`,
            transition: "all 0.25s ease",
            border: "none",
            cursor: "pointer",
            letterSpacing: "0.01em",
          }}
          onMouseEnter={(e) => {
            const el = e.currentTarget as HTMLButtonElement;
            el.style.transform = "translateY(-2px)";
            el.style.boxShadow = `0 8px 32px ${glowStrong}, 0 1px 0 rgba(255,255,255,0.1) inset`;
          }}
          onMouseLeave={(e) => {
            const el = e.currentTarget as HTMLButtonElement;
            el.style.transform = "translateY(0)";
            el.style.boxShadow = `0 4px 24px ${glow}, 0 1px 0 rgba(255,255,255,0.1) inset`;
          }}
          onMouseDown={(e) => {
            (e.currentTarget as HTMLButtonElement).style.transform =
              "translateY(1px) scale(0.98)";
          }}
          onMouseUp={(e) => {
            (e.currentTarget as HTMLButtonElement).style.transform =
              "translateY(-2px)";
          }}
          onClick={handleCtaClick}
        >
          <CtaIcon className="w-4 h-4 fill-yellow-300 text-yellow-200" />
          {ctaLabel}
          <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" />
        </button>

        {/* Footer note */}
        {footerNote && (
          <p className="text-center text-xs mt-4" style={{ color: "#94a3b8" }}>
            {footerNote}
          </p>
        )}
      </div>
    </div>
  );
};

export default PremiumLockScreen;
