import { apiClient } from "@/lib/apiClient";

const url = apiClient.getBaseUrl();

export const createFranchisee = async ({ franchiseeData }) => {
  const response = await apiClient.post(url + "/franchisee", franchiseeData);

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to create franchisee");
  }

  return data;
};

export const getAllFranchisee = async () => {
  const response = await apiClient.get(url + "/franchisee");

  const data = await response.json();

  return data;
};

export const updateFranchisee = async ({ data }) => {
  const response = await apiClient.put(`${url}/franchisee/${data.id}`, {
    cnpj: data.cnpj,
    cpf: data.cpf,
    limitScrapGo: data.limit_scrap_go,
    limitPipelineCreation: data.limitPipelineCreation,
    municipality: data.municipality,
    name: data.name,
    phone: data.phone,
    plan_type: data.plan_type,
    cep: data.cep,
    uf: data.uf,
    active: data.active,
  });

  const responseData = await response.json();
  if (!response.ok) {
    throw new Error(responseData.message || "Failed to update franchisee");
  }
  return responseData;
};

export const updateActiveStatus = async ({ id, isActive }) => {
  const response = await apiClient.put(`${url}/franchisee/${id}/status`, {
    active: isActive,
  });
  const responseData = await response.json();
  if (!response.ok) {
    throw new Error(responseData.message || "Failed to update active status");
  }
  return responseData;
};

export const killerSessionToDoFranchisee = async (id: string) => {
  const response = await apiClient.post(`${url}/user/kill-session`, {
    franchisee_id: id,
  });
  const responseData = await response.json();

  if (!response.ok) {
    throw new Error(responseData.message || "Failed to update active status");
  }
};

export const deleteFranchiseeById = async ({ id }: { id: string }) => {
  const response = await apiClient.delete(`${url}/franchisee/${id}`);

  if (!response.ok) {
    throw new Error(await response.json());
  }
};
