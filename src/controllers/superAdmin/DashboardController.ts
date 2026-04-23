import { DashboardStats } from "@/models/DashboardStats";
import { apiClient } from "@/lib/apiClient";

const url = apiClient.getBaseUrl();

export const getStats = async (
  franchiseeId: string,
  period: string,
): Promise<DashboardStats> => {
  try {
    const response = await apiClient.get(
      `${url}/dashboard/stats?franchiseeId=${franchiseeId}&period=${period}`,
    );

    if (!response.ok) {
      throw new Error("Erro ao buscar estatísticas do dashboard");
    }

    return await response.json();
  } catch (error) {
    console.error("Erro na requisição do dashboard:", error);
    throw error;
  }
};
