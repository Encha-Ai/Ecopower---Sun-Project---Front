import { apiClient } from "@/lib/apiClient";

const url = apiClient.getBaseUrl();

export const listDealsByFranchiseeId = async (id: string) => {
  const response = await apiClient.get(`${url}/deals?franchiseeId=${id}`);

  if (!response.ok) {
    throw new Error("Failed to fetch deals");
  }

  const data = await response.json();

  return data;
};
