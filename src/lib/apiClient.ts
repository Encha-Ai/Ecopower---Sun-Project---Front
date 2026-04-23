export class SessionExpiredError extends Error {
  constructor() {
    super("Sessão expirada");
    this.name = "SessionExpiredError";
  }
}

// Obtém a URL do backend
const getBackendUrl = () => {
  const url =
    (window as any).RUNTIME_CONFIG?.BACKEND_URL ??
    import.meta.env.VITE_BACKEND_URL_DEV ??
    import.meta.env.VITE_BACKEND_URL_PROD;

  if (!url) {
    throw new Error("Backend URL não definida");
  }

  return url;
};

// Função para obter token atualizado
const getStoredUser = () => {
  const stored = localStorage.getItem("currentUser");
  return stored ? JSON.parse(stored) : null;
};

const getToken = (): string | null => {
  const user = getStoredUser();
  return user?.token ? `Bearer ${user.token}` : null;
};

// Função para fazer logout e redirecionar
const handleSessionExpired = () => {
  localStorage.removeItem("currentUser");

  window.dispatchEvent(new CustomEvent("session-expired"));

  window.location.href = "/";
};

// 🔐 Controle para evitar múltiplos refresh simultâneos
let isRefreshing = false;
let refreshPromise: Promise<string | null> | null = null;

// Função que chama o refresh-token
const refreshAccessToken = async (): Promise<string | null> => {
  const user = getStoredUser();

  if (!user?.refresh_token) {
    return null;
  }

  const response = await fetch(`${getBackendUrl()}/user/refresh-token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      refresh_token: user.refresh_token,
    }),
  });

  if (!response.ok) {
    return null;
  }

  const data = await response.json();

  // Atualiza access token mantendo refresh_token
  const updatedUser = {
    ...user,
    token: data.token,
  };

  localStorage.setItem("currentUser", JSON.stringify(updatedUser));

  return data.token;
};

// Cliente HTTP wrapper
export const apiClient = {
  getBaseUrl: getBackendUrl,

  async fetch(url: string, options: RequestInit = {}): Promise<Response> {
    let token = getToken();

    const headers = new Headers(options.headers);
    if (token && !headers.has("Authorization")) {
      headers.set("Authorization", token);
    }

    let response = await fetch(url, {
      ...options,
      headers,
    });

    // Se token expirou
    if (response.status === 401 || response.status === 403) {
      if (!isRefreshing) {
        isRefreshing = true;
        refreshPromise = refreshAccessToken();
      }

      const newToken = await refreshPromise;

      isRefreshing = false;
      refreshPromise = null;

      if (!newToken) {
        handleSessionExpired();
        throw new SessionExpiredError();
      }

      // Refaz requisição original com novo token
      headers.set("Authorization", `Bearer ${newToken}`);

      response = await fetch(url, {
        ...options,
        headers,
      });
    }

    return response;
  },

  async get(url: string, options?: RequestInit): Promise<Response> {
    return this.fetch(url, { ...options, method: "GET" });
  },

  async post(
    url: string,
    body?: any,
    options?: RequestInit,
  ): Promise<Response> {
    const isFormData = body instanceof FormData;

    const headers: Record<string, string> = {};
    if (!isFormData) {
      headers["Content-Type"] = "application/json";
    }

    return this.fetch(url, {
      ...options,
      method: "POST",
      headers: {
        ...headers,
        ...(options?.headers as Record<string, string>),
      },
      body: isFormData ? body : body ? JSON.stringify(body) : undefined,
    });
  },

  async put(url: string, body?: any, options?: RequestInit): Promise<Response> {
    return this.fetch(url, {
      ...options,
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        ...(options?.headers as Record<string, string>),
      },
      body: body ? JSON.stringify(body) : undefined,
    });
  },

  async delete(url: string, options?: RequestInit): Promise<Response> {
    return this.fetch(url, { ...options, method: "DELETE" });
  },

  async patch(
    url: string,
    body?: any,
    options?: RequestInit,
  ): Promise<Response> {
    const isFormData = body instanceof FormData;

    const headers: Record<string, string> = {};
    if (!isFormData) {
      headers["Content-Type"] = "application/json";
    }

    return this.fetch(url, {
      ...options,
      method: "PATCH",
      headers: {
        ...headers,
        ...(options?.headers as Record<string, string>),
      },
      body: isFormData ? body : body ? JSON.stringify(body) : undefined,
    });
  },
};
