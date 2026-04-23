import { useState, useCallback } from "react";
import { User, LoginCredentials } from "@/models/User";
import { apiClient } from "@/lib/apiClient";

const url = apiClient.getBaseUrl();

if (!url) {
  throw new Error("Backend URL não definida");
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

export function useAuthController() {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
    error: null,
  });

  const login = useCallback(
    async (credentials: LoginCredentials): Promise<User | null> => {
      setAuthState((prev) => ({ ...prev, isLoading: true, error: null }));

      try {
        const response = await fetch(url + "/user/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(credentials),
        });

        if (!response.ok) {
          const errData = await response.json();

          if (
            response.status === 500 &&
            errData.message?.includes("Usuário já logado")
          ) {
            throw new Error(
              "SESSION_ACTIVE:Já existe uma sessão ativa para este usuário. " +
                "Por favor, encerre a sessão anterior ou entre em contato com o suporte.",
            );
          }

          throw new Error(errData.message || "Falha no login");
        }

        const user: User = await response.json();

        localStorage.setItem("currentUser", JSON.stringify(user));

        setAuthState({
          user,
          isAuthenticated: true,
          isLoading: false,
          error: null,
        });

        return user;
      } catch (err: any) {
        setAuthState((prev) => ({
          ...prev,
          isLoading: false,
          error: err.message || "Erro inesperado",
        }));
        return null;
      }
    },
    [],
  );

  const logout = useCallback(async () => {
    try {
      const stored = localStorage.getItem("currentUser");

      if (stored) {
        const { token } = JSON.parse(stored);

        await fetch(url + "/user/logout", {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        });
      }
    } catch (error) {
      console.error("Erro ao realizar logout no backend:", error);
    } finally {
      localStorage.removeItem("currentUser");

      setAuthState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      });
    }
  }, []);

  const checkAuth = useCallback(() => {
    const stored = localStorage.getItem("currentUser");

    if (stored) {
      const user = JSON.parse(stored) as User;
      setAuthState({
        user,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });
      return user;
    }

    setAuthState((prev) => ({ ...prev, isLoading: false }));
    return null;
  }, []);

  const clearError = useCallback(() => {
    setAuthState((prev) => ({ ...prev, error: null }));
  }, []);

  // ✅ Atualiza logo (SuperAdmin) e profilePhoto (Franchisee) no contexto e localStorage
  const updateProfilePhoto = useCallback((base64: string) => {
    setAuthState((prev) => {
      if (!prev.user) return prev;

      const updatedUser: User = {
        ...prev.user,
        // ✅ Campo usado pelo SuperAdmin
        logo: base64,
        // ✅ Campo usado pelo Franchisee (mantém compatibilidade)
        franchisee: prev.user.franchisee
          ? { ...prev.user.franchisee, profilePhoto: base64 }
          : prev.user.franchisee,
      };

      // Persiste para que checkAuth recarregue corretamente em F5
      localStorage.setItem("currentUser", JSON.stringify(updatedUser));

      return { ...prev, user: updatedUser };
    });
  }, []);

  return {
    ...authState,
    login,
    logout,
    checkAuth,
    clearError,
    updateProfilePhoto,
  };
}

// ==========================
// UPDATE USER
// ==========================
export const updateUser = async ({ data }: { data: any }) => {
  const stored = localStorage.getItem("currentUser");
  const token = stored ? `Bearer ${JSON.parse(stored).token}` : null;

  const response = await fetch(url + "/user/" + data.userId, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: token ?? "",
    },
    body: JSON.stringify({
      email: data.email ?? "",
      password: data.password ?? "",
    }),
  });

  const dataResponse = await response.json();

  if (!response.ok) {
    throw new Error(dataResponse.message || "Failed to update user");
  }

  return dataResponse;
};

// ==========================
// UPDATE PROFILE PHOTO - FRANCHISEE
// ==========================
export const updateProfilePhotoRequestFranchisee = async ({
  userId,
  file,
}: {
  userId: string;
  file: File;
}) => {
  const stored = localStorage.getItem("currentUser");
  const token = stored ? `Bearer ${JSON.parse(stored).token}` : null;

  const formData = new FormData();
  formData.append("photo", file);

  const response = await fetch(`${url}/franchisee/${userId}/profile-photo`, {
    method: "PUT",
    headers: {
      Authorization: token ?? "",
    },
    body: formData,
  });

  const dataResponse = await response.json();

  if (!response.ok) {
    throw new Error(dataResponse.message || "Failed to update profile photo");
  }

  return dataResponse;
};

// ==========================
// UPDATE PROFILE PHOTO - SUPERADMIN
// ==========================
export const updateProfilePhotoSuperAdmin = async ({
  file,
  id,
}: {
  file: File;
  id: string;
}) => {
  const stored = localStorage.getItem("currentUser");
  const token = stored ? `Bearer ${JSON.parse(stored).token}` : null;

  const formData = new FormData();
  formData.append("photo", file);

  const response = await fetch(url + "/superadmin/logo/" + id, {
    method: "PUT",
    headers: {
      Authorization: token ?? "",
    },
    body: formData,
  });

  const dataResponse = await response.json();

  if (!response.ok) {
    throw new Error(dataResponse.message || "Failed to update profile photo");
  }

  return dataResponse;
};
