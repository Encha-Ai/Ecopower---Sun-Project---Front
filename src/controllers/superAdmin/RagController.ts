import { apiClient } from "@/lib/apiClient";

const url = apiClient.getBaseUrl();

// ========== RAG MAIN ENDPOINTS ==========

export const uploadRagMain = async ({ data }: { data: any }) => {
  const formData = new FormData();

  formData.append("file", data.file);
  formData.append("description", data.description.trim());
  formData.append("user_id", "0");

  const response = await apiClient.post(url + "/rag/main/create", formData);

  if (!response.ok) {
    throw new Error("Failed to upload RAG main data");
  }
  const responseData = await response.json();
};

export const listRagMain = async () => {
  const response = await apiClient.get(url + "/rag/main/list");

  const dataResponse = await response.json();

  return dataResponse;
};

export const deleteRagMain = async ({ id }: { id: string }) => {
  const data = await apiClient.delete(`${url}/rag/main/delete/${id}`);

  const responseData = await data.json();

  if (!data.ok) {
    throw new Error("Failed to delete RAG main data");
  }
};

export const sendMessage = async ({ message }: { message: string }) => {
  const response = await apiClient.post(url + "/rag/main/send-message", {
    message,
    session_id: "default-session",
  });

  if (!response.ok) {
    throw new Error("Failed to send message");
  }

  const data = await response.json();

  return data.message;
};

// ========== RAG dealership ENDPOINTS ==========

export const uploadRagDealership = async ({
  data,
  dealership,
}: {
  data: any;
  dealership: string;
}) => {
  const formData = new FormData();

  dealership = dealership.toUpperCase();
  formData.append("file", data.file);
  formData.append("description", data.description.trim());
  formData.append("dealerships", dealership);
  formData.append("user_id", "0");

  const response = await apiClient.post(
    `${url}/rag/dealership/create`,
    formData,
  );

  if (!response.ok) {
    throw new Error("Failed to upload RAG UF data");
  }

  return response.json();
};

export const listRagDealership = async (uf: string) => {
  const response = await apiClient.get(`${url}/rag/dealership/list/${uf}`);

  if (!response.ok) {
    throw new Error("Failed to list RAG UF data");
  }

  return response.json();
};

export const deleteRagDealership = async ({ id }: { id: string }) => {
  const response = await apiClient.delete(`${url}/rag/dealership/delete/${id}`);

  if (!response.ok) {
    throw new Error("Failed to delete RAG dealership data");
  }

  return response.json();
};

//GENERAL INFORMATION
export const uploadRagGeneralInformation = async ({ data }) => {
  const formData = new FormData();

  formData.append("file", data.file);
  formData.append("description", data.description.trim());

  const response = await apiClient.post(url + "/rag/general", formData);

  if (!response.ok) {
    throw new Error("Failed to upload RAG main data");
  }
  const responseData = await response.json();

  console.log(responseData);
};

export const listRagGeneralInformation = async () => {
  const response = await apiClient.get(url + "/rag/general");

  const data = await response.json();

  return data;
};

export const deleteRagGeneralInformationById = async ({
  id,
}: {
  id: string;
}) => {
  const data = await apiClient.delete(`${url}/rag/general/${id}`);

  const responseData = await data.json();

  if (!data.ok) {
    throw new Error("Failed to delete RAG main data");
  }
};
