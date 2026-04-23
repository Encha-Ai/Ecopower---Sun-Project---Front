import { apiClient } from "@/lib/apiClient";

const url = apiClient.getBaseUrl();

export const updateLogoSystem = async ({
  file,
  id,
}: {
  file: File;
  id: string;
}) => {
  const formData = new FormData();

  formData.append("photo", file);

  const response = await fetch(`${url}/superadmin/logo/${id}`, {
    method: "PUT",
    body: formData,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Erro ao atualizar logo");
  }

  return data;
};
