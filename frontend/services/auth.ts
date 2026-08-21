import api from "@/lib/api";
import {
  SignupData,
  LoginData,
  User,
  LoginResponse,
} from "@/types/auth";

export const signup = async (
  data: SignupData
): Promise<User> => {
  console.log("Signup function called");
  console.log("Sending data:", data);

  const response = await api.post("/auth/signup", data);

  console.log("Response:", response);

  return response.data;
};

export const login = async (
  data: LoginData
): Promise<LoginResponse> => {
  const response = await api.post("/auth/login", data);
  return response.data;
};