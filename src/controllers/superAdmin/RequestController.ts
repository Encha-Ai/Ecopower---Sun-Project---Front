import { apiClient } from "@/lib/apiClient";

const url = apiClient.getBaseUrl();

export const updateRequestById = async ({ data }) => {
  const response = await apiClient.put(
    `${url}/franchisee-requests/${data.id}/super-admin`,
    {
      request_status: data.request_status,
      response_super_admin: data.response_super_admin,
    },
  );

  if (!response.ok) {
    throw new Error(await response.json());
  }
};

export const getAll = async () => {
  const response = await apiClient.get(`${url}/franchisee-requests`);

  if (!response.ok) {
    throw new Error(await response.json());
  }

  const dataResponse = await response.json();

  return dataResponse;
};

export const deleteRequestById = async ({ id }) => {
  const response = await apiClient.delete(`${url}/franchisee-requests/${id}`);

  if (!response.ok) {
    throw new Error(await response.json());
  }
};
