import { Wifi, WifiOff, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface ConnectionStatusBadgeProps {
  status: "connected" | "disconnected" | "connecting";
  showLabel?: boolean;
}

const ConnectionStatusBadge = ({ status, showLabel = true }: ConnectionStatusBadgeProps) => {
  const config = {
    connected: {
      icon: Wifi,
      label: "Conectado",
      className: "bg-green-500/10 text-green-500 border-green-500/20",
      iconClass: "",
    },
    disconnected: {
      icon: WifiOff,
      label: "Desconectado",
      className: "bg-destructive/10 text-destructive border-destructive/20",
      iconClass: "",
    },
    connecting: {
      icon: Loader2,
      label: "Conectando",
      className: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20",
      iconClass: "animate-spin",
    },
  };

  const { icon: Icon, label, className, iconClass } = config[status];

  return (
    <Badge variant="outline" className={`gap-1.5 ${className}`}>
      <Icon className={`w-3 h-3 ${iconClass}`} />
      {showLabel && <span>{label}</span>}
    </Badge>
  );
};

export default ConnectionStatusBadge;
