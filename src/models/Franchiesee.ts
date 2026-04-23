export type Plan = "BASIC" | "PREMIUM";

// União de literais para representar UFs
export type Ufs =
  | "AC"
  | "AL"
  | "AP"
  | "AM"
  | "BA"
  | "CE"
  | "DF"
  | "ES"
  | "GO"
  | "MA"
  | "MT"
  | "MS"
  | "MG"
  | "PA"
  | "PB"
  | "PR"
  | "PE"
  | "PI"
  | "RJ"
  | "RN"
  | "RS"
  | "RO"
  | "RR"
  | "SC"
  | "SP"
  | "SE"
  | "TO";

export interface Franchisee {
  user_id: string;
  id: string;
  active: boolean;
  email: string;
  phone: string;
  plan_type: Plan; // PlanType (enum) → string no JSON
  name: string;
  cpf: string;
  cep: string;
  municipality: string;
  profilePhoto: string;
  uf: Ufs; // usa o tipo correto
  limit_scrap_go: number | null;
  limitPipelineCreation: number | null;
  cnpj: string | null;
  create_at: string | null;
  update_at: string | null;
}
