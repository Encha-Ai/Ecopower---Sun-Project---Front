import { apiClient } from "@/lib/apiClient";

const url = apiClient.getBaseUrl();

export const createRequest = async ({ data }) => {
  const response = await apiClient.post(`${url}/franchisee-requests`, {
    franchisee_id: data.franchisee_id,
    request_type: data.request_type,
    description: data.description,
  });

  if (!response.ok) {
    throw new Error(await response.json());
  }
};

export const getAllByFranchiseeId = async ({ id }) => {
  const response = await apiClient.get(`${url}/franchisee-requests/${id}`);

  if (!response.ok) {
    throw new Error(await response.json());
  }

  const dataResponse = await response.json();

  return dataResponse;
};

export const updateRequestById = async ({ data }) => {
  const response = await apiClient.put(
    `${url}/franchisee-requests/${data.id}/franchisee`,
    {
      request_type: data.request_type,
      description: data.description,
    },
  );

  if (!response.ok) {
    throw new Error(await response.json());
  }
};

export const deleteRequestById = async ({ id }) => {
  const response = await apiClient.delete(`${url}/franchisee-requests/${id}`);

  if (!response.ok) {
    throw new Error(await response.json());
  }
};
