import type {
  ConnectionState,
  ConnectionProvider,
} from "@/components/Franchisee/Chat/types";
import { apiClient } from "@/lib/apiClient";

const url = apiClient.getBaseUrl();

export const getAllConversations = async ({ id }: { id: string }) => {
  const response = await apiClient.get(`${url}/conversation/franchisee/${id}`);
  if (!response.ok) {
    throw new Error("Failed get conversations");
  }

  const data = await response.json();
  return data;
};

export const getLeadByConversationId = async ({ id }) => {
  const response = await apiClient.get(`${url}/conversation/${id}/lead`);

  if (!response.ok) {
    throw new Error(await response.json());
  }

  const data = await response.json();

  return data;
};

export const updateStatusIaConversation = async ({ id }: { id: string }) => {
  const response = await apiClient.put(
    `${url}/conversation/${id}/ai-status`,
    {},
  );

  if (!response.ok) {
    throw new Error("Failed update ai status of conversations");
  }
};

export const verifyInstanceEvo = async ({
  franchisee_id,
}: {
  franchisee_id: string;
}): Promise<ConnectionState | null> => {
  try {
    const response = await apiClient.get(
      `${url}/evo/connections/${franchisee_id}/status`,
    );

    if (!response.ok) {
      return null;
    }

    const data: ConnectionState = await response.json();
    return data;
  } catch (error) {
    console.error("Erro ao verificar instância Evolution:", error);
    return null;
  }
};

export const disconnectInstance = async ({ id }: { id: string }) => {
  const response = await apiClient.delete(
    `${url}/evo/connections/${id}/session`,
    {},
  );

  if (!response.ok) {
    throw new Error("Failed update ai status of conversations");
  }
};

export const verifyInstanceOfficial = async ({
  franchisee_id,
}: {
  franchisee_id: string;
}): Promise<ConnectionState | null> => {
  console.log("verificando conexão api oficial");
  return;

  try {
    const response = await fetch(
      `http://localhost:8081/official/verify-connection/${franchisee_id}`,
      {
        method: "GET",
      },
    );

    if (!response.ok) {
      return null;
    }

    const data: ConnectionState = await response.json();
    return data;
  } catch (error) {
    console.error("Erro ao verificar instância Oficial:", error);
    return null;
  }
};

export const createInstance = async ({
  franchisee_id,
  provider,
}: {
  franchisee_id: string;
  provider: ConnectionProvider;
}): Promise<ConnectionState | null> => {
  console.log("criando instâncias evolution e oficial");
  return;

  try {
    const endpoint =
      provider === "evolution"
        ? `http://localhost:8081/evolution/create-instance/${franchisee_id}`
        : `http://localhost:8081/official/create-instance/${franchisee_id}`;

    const response = await fetch(endpoint, {
      method: "POST",
    });

    if (!response.ok) {
      return null;
    }

    const data: ConnectionState = await response.json();
    return data;
  } catch (error) {
    console.error("Erro ao criar instância:", error);
    return null;
  }
};

export const getConnectionStatus = async ({
  franchisee_id,
  provider,
}: {
  franchisee_id: string;
  provider: ConnectionProvider;
}): Promise<ConnectionState | null> => {
  if (provider === "evolution") {
    return verifyInstanceEvo({ franchisee_id });
  }
  return verifyInstanceOfficial({ franchisee_id });
};

export const getConfigurationIaGeneral = async ({
  franchisee_id,
}: {
  franchisee_id: string;
}) => {
  const response = await apiClient.get(
    `${url}/chat-ia-configuration/list/${franchisee_id}`,
  );

  if (!response.ok) {
    throw new Error("Failed to get IA general configuration");
  }

  const data = response.json();

  return data;
};

export const updateConfigurationIaGeneral = async ({ id, configuration }) => {
  const formatBody = {
    ia_init_active: configuration.aiEnabled,
    delay_response: configuration.responseDelay,
    welcome_message: configuration.welcomeMessage,
  };

  const response = await apiClient.put(
    `${url}/chat-ia-configuration/update/${id}`,
    formatBody,
  );

  if (!response.ok) {
    throw new Error("Failed to update IA general configuration");
  }
};

export const deleteConversationById = async ({ id }) => {
  const response = await apiClient.delete(`${url}/conversation/${id}`);

  if (!response.ok) {
    throw new Error(await response.json());
  }
};
