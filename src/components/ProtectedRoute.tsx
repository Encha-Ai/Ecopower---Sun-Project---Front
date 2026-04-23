import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { UserRole } from "@/models/User";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
}

// Normaliza roles vindas do backend e do frontend
function normalizeRole(role?: string): string {
  if (!role) return "";

  const map: Record<string, string> = {
    FRANQUEADO: "FRANCHISEE",
    SUPERADMIN: "SUPERADMIN",
  };

  return map[role.toUpperCase()] ?? role.toUpperCase();
}

export function ProtectedRoute({
  children,
  allowedRoles,
}: ProtectedRouteProps) {
  const { isAuthenticated, user, isLoading } = useAuth();

  // ⏳ Aguarda reidratação
  if (isLoading) {
    return null; // ou um spinner
  }

  // 🔒 Não autenticado
  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  const userRole = normalizeRole(user?.type);

  // 🚫 Autenticado, mas sem permissão
  if (
    allowedRoles &&
    !allowedRoles.some((role) => normalizeRole(role) === userRole)
  ) {
    return (
      <Navigate
        to={userRole === "SUPERADMIN" ? "/superadmin" : "/franchisee"}
        replace
      />
    );
  }

  // ✅ Autorizado
  return <>{children}</>;
}
