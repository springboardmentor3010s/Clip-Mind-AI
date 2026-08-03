export interface SignupData {
  username: string;
  email: string;
  password: string;
  role: string;
}

export interface LoginData {
  login: string;
  password: string;
}

export interface User {
  id: number;
  username: string;
  email: string;
  role: string;
}

export interface CurrentUser {
  id: number;
  username: string;
  email: string;
 role: string;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
}