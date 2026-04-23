import { apiClient } from "@/lib/apiClient";

const url = apiClient.getBaseUrl();

export const listMessagesByConversationId = async (id) => {
  const response = await apiClient.get(`${url}/message/conversation/${id}`);

  if (!response.ok) {
    throw new Error("Failed fetch list all messages by conversation id");
  }

  const data = await response.json();

  console.log(data);

  return data;
};

export const sendMessageCreatedByFranchisee = async ({
  data,
  files,
}: {
  data: {
    conversation_id: string;
    franchisee_id: string;
    message: string;
  };
  files?: File[];
}) => {
  // 📎 Com arquivo
  if (files && files.length > 0) {
    const formData = new FormData();
    formData.append("conversation_id", data.conversation_id);
    formData.append("franchisee_id", data.franchisee_id);

    files.forEach((file) => {
      formData.append("file", file);
    });

    const response = await apiClient.post(url + "/message/send/file", formData);

    const result = await response.json(); // ✅ LÊ UMA VEZ

    if (!response.ok) {
      throw new Error(result?.message || "Erro ao enviar mensagem com arquivo");
    }

    return result;
  }

  // 💬 Sem arquivo
  const response = await apiClient.post(url + "/message/send/conversation", {
    conversation_id: data.conversation_id,
    franchisee_id: data.franchisee_id,
    message: data.message,
  });

  const result = await response.json(); // ✅ LÊ UMA VEZ

  if (!response.ok) {
    throw new Error(
      "Verifique o número do contato, ou tente novamente mais tarde.",
    );
  }

  return result;
};

export const sendMessageToLeadWithoutConversation = async ({ data }) => {
  const response = await apiClient.post(`${url}/message/send/lead`, {
    lead_id: data.lead_id,
    message: data.message,
  });

  if (!response.ok) {
    throw new Error(
      "Não foi possível enviar mensagem. Por favor, verifique o número do lead.",
    );
  }
};

export const sendMessageForNumberLead = async ({ data }) => {
  const response = await apiClient.post(`${url}/message/send/number`, {
    number: data.number,
    franchisee_id: data.franchisee_id,
    content: data.content,
  });

  if (!response.ok) {
    console.log(await response.json());
    throw new Error(
      "Não foi possível enviar mensagem. Por favor, verifique o número do lead.",
    );
  }
};
