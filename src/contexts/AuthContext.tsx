import { createContext, useContext, useEffect, ReactNode } from "react";
import { useAuthController } from "@/controllers/superAdmin/useAuthController";
import { User, LoginCredentials } from "@/models/User";

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (credentials: LoginCredentials) => Promise<User | null>;
  logout: () => void;
  clearError: () => void;
  updateProfilePhoto: (base64: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const auth = useAuthController();

  useEffect(() => {
    auth.checkAuth();

    const handleSessionExpired = () => {
      auth.logout();
    };

    window.addEventListener("session-expired", handleSessionExpired);

    return () => {
      window.removeEventListener("session-expired", handleSessionExpired);
    };
  }, []);

  return <AuthContext.Provider value={auth}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
