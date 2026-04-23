import { apiClient } from "@/lib/apiClient";

const url = apiClient.getBaseUrl();

export const listAllDocuments = async ({ doc_id }: { doc_id: string }) => {
  const [ragMainRes, ragDealershipRes] = await Promise.all([
    apiClient.get(url + "/rag/main/list"),
    apiClient.get(`${url}/rag/dealership/list/${doc_id}`),
  ]);

  if (!ragMainRes.ok) throw new Error("Failed to list main documents");
  if (!ragDealershipRes.ok)
    throw new Error("Failed to list dealership documents");

  const [dataMainRag, dataRagDealership] = await Promise.all([
    ragMainRes.json(),
    ragDealershipRes.json(),
  ]);

  return {
    main: Array.isArray(dataMainRag) ? dataMainRag : Object.values(dataMainRag),

    dealership: dataRagDealership ?? [],
  };
};

export const getMessageByAid = async ({
  id,
  franchiseeId,
}: {
  id: string;
  franchiseeId: string;
}) => {
  const response = await apiClient.get(
    `${url}/rag/dealership/messages/${id}/${franchiseeId}`,
  );
  if (!response.ok) {
    throw new Error("Failed to fetch messages");
  }
  const data = await response.json();
  console.log("Fetched Messages:", data);

  return data;
};

export const sendMessage = async ({ data }) => {
  const response = await apiClient.post(url + "/rag/dealership/send-message", {
    message: data.message,
    session_id: data.session_id,
    dealerships: data.dealerships,
  });

  if (!response.ok) {
    throw new Error("Failed to send message");
  }

  const Responsedata = await response.json();

  console.log("Response Data:", Responsedata);

  return Responsedata.message;
};

export const deleteMessages = async ({
  session_id,
  id,
}: {
  session_id: string;
  id: string;
}) => {
  const response = await apiClient.delete(
    `${url}/rag/dealership/delete-messages/${id}/${session_id}`,
  );
  if (!response.ok) {
    throw new Error("Failed to delete messages");
  }
};
