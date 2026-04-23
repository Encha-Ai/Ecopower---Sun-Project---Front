import { apiClient } from "@/lib/apiClient";

const url = apiClient.getBaseUrl();

export const createLead = async ({ id, data }: { id: string; data: any }) => {
  const response = await apiClient.post(`${url}/leads`, {
    franchisee_id: id,
    name: data.name,
    email: data.email,
    phone: data.phone,
    type: data.leadType,
  });
  if (!response.ok) {
    throw new Error("Failed to create lead");
  }
};

export const listLeadsByFranchiseeId = async (id: string) => {
  const response = await apiClient.get(`${url}/leads/franchisee/${id}`);
  if (!response.ok) {
    throw new Error("Failed to fetch leads");
  }
  const data = await response.json();
  return data;
};

export const updateLead = async ({ id, data }: { id: string; data: any }) => {
  const response = await apiClient.put(`${url}/leads/${id}`, {
    name: data.name,
    email: data.email,
    phone: data.phone,
    leadType: data.leadType,
  });

  const dataResponse = await response.json();

  if (!response.ok) {
    console.log(dataResponse);
    throw new Error(`Failed to update lead by id:${id}`);
  }

  return true;
};

export const updateLeadByDealID = async ({
  id,
  data,
}: {
  id: string;
  data: any;
}) => {
  const response = await apiClient.put(`${url}/api/deals/${id}/full-update`, {
    name: data.name,
    email: data.email,
    phone: data.phone,
    leadType: data.leadType,
    // Adicione estes campos que faltavam:
    value: data.value,
    content: data.content,
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Erro backend:", errorText);
    throw new Error(`Failed to update deal and lead by id:${id}`);
  }

  return true;
};

export const deleteLead = async (id: string) => {
  const response = await apiClient.delete(`${url}/leads/${id}`);

  if (!response.ok) {
    throw new Error(`Failed to delete lead by id:${id}`);
  }
};

export const importLeads = async ({ data }: { data: any }) => {
  const formData = new FormData();

  formData.append("file", data.file);
  formData.append("franchiseeId", data.id);

  const response = await apiClient.post(url + "/leads/import", formData);

  if (!response.ok) {
    throw new Error("Erro ao importar leads");
  }

  const responseText = await response.text();
  return responseText;
};
