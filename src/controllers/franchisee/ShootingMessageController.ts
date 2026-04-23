import { apiClient } from "@/lib/apiClient";

const url = apiClient.getBaseUrl();

export const getShootingMessagesHistoryByFranchiseeId = async (
  franchiseeId: string,
) => {
  const response = await apiClient.get(
    `${url}/message/shooting-message/${franchiseeId}`,
  );

  if (!response.ok) {
    throw new Error("Failed to fetch shooting messages history");
  }

  const data = await response.json();

  return data;
};

export const sendShootingMessage = async ({ data }) => {
  const response = await apiClient.post(
    `${url}/message/shooting-message`,
    data,
  );

  if (!response.ok) {
    throw new Error("Failed to send shooting message");
  }

  const dataResponse = await response.json();

  console.log("batch id: ", dataResponse);

  return dataResponse;
};

export const getStatusShooting = async ({ batchId }) => {
  const response = await apiClient.get(
    `${url}/message/shooting-message/${batchId}/status`,
  );

  if (!response.ok) {
    throw new Error("Failed to send shooting message");
  }

  const data = await response.json();

  return data;
};

export const cancelledShooting = async ({ batchId }) => {
  const response = await apiClient.patch(
    `${url}/message/shooting-message/${batchId}/cancel`,
  );

  if (!response.ok) {
    throw new Error("Failed to cancel shooting");
  }

  const responseStatus = await apiClient.get(
    `${url}/message/shooting-message/${batchId}/status`,
  );

  if (!responseStatus.ok) {
    throw new Error("Failed to show batch status");
  }

  const status = await responseStatus.json();

  return status;
};

export const deleteShootingMessageHistoric = async ({ id }) => {
  console.log(id);

  const response = await apiClient.delete(
    `${url}/message/shooting-message/${id}`,
  );

  if (!response.ok) {
    throw new Error("Failed to delete shooting message historic");
  }
};
