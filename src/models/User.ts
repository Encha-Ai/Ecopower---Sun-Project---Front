// Model - Define os tipos de dados e estruturas

export type UserRole = "SUPERADMIN" | "FRANCHISEE";

export interface User {
  franchisee: any;
  id: string;
  email: string;
  name: string;
  type: UserRole;
  avatar?: string;
  logo?: string;
  state?: string;
  municipality?: string;
  uf?: string;
  cnpj?: string;
  token?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}
