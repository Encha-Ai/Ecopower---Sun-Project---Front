import { apiClient } from "@/lib/apiClient";

const url = apiClient.getBaseUrl();

export const getGlobalPrompt = async () => {
  const response = await apiClient.get(url + "/admin/ai-prompts/global");

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message);
  }

  return data;
};

export const updateGlobalPrompt = async ({ prompt }) => {
  const response = await apiClient.put(url + "/admin/ai-prompts/global", {
    prompt,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message);
  }

  return data;
};

//FRANCHISEE PROMPT CONTROLLER
export const getFranchiseePrompt = async (id: string) => {
  const response = await apiClient.get(
    url + "/admin/ai-prompts/franchisee/" + id,
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message);
  }

  return data;
};

export const createPromptFranchisee = async ({ franchiseeId, prompt }) => {
  const response = await apiClient.post(url + "/admin/ai-prompts/franchisee", {
    prompt,
    franchisee_id: franchiseeId,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message);
  }

  return data;
};

export const updatePromptFranchisee = async ({ promptId, prompt }) => {
  const response = await apiClient.put(
    url + "/admin/ai-prompts/franchisee/" + promptId,
    {
      prompt,
    },
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message);
  }

  return data;
};

export const deletePromptFranchisee = async ({ promptId }) => {
  const response = await apiClient.delete(
    url + "/admin/ai-prompts/franchisee/" + promptId,
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message);
  }

  return data;
};

//MESSAGES - GLOBAL
export const getMessagesGlobal = async () => {
  const response = await apiClient.get(
    url + "/admin/ai-prompts/message-global",
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message);
  }

  return data;
};

export const sendMessageGlobal = async ({ message }) => {
  const response = await apiClient.post(
    url + "/admin/ai-prompts/message-global",
    {
      message: message,
      sender_type: "User",
    },
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message);
  }

  return data;
};

export const deleteMessageGlobal = async () => {
  const response = await apiClient.delete(
    url + "/admin/ai-prompts/message-global",
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message);
  }

  return data;
};

//MESSAGES - Franchisee
export const getMessagesFranchisee = async ({ id }) => {
  const response = await apiClient.get(
    url + "/admin/ai-prompts/message-franchisee/" + id,
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message);
  }

  return data;
};

export const sendMessageFranchisee = async ({ message, id }) => {
  const response = await apiClient.post(
    url + "/admin/ai-prompts/message-franchisee",
    {
      message: message,
      sender_type: "User",
      franchisee_id: id,
    },
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message);
  }

  return data;
};

export const deleteMessageFranchisee = async ({ id }) => {
  const response = await apiClient.delete(
    url + "/admin/ai-prompts/message-franchisee/" + id,
  );

  const data = await response.json();
  console.log(data);

  if (!response.ok) {
    throw new Error(data.message);
  }

  return data;
};
