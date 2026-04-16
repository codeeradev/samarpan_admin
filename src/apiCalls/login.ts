import { post } from "@/apis/apiClient";
import { ENDPOINT } from "@/apis/endpoint";

export const loginApi = async (email: string, password: string) => {
  try {
    const res = await post(ENDPOINT.LOGIN, { email, password });

    if (!res?.data) {
      throw new Error("Empty server response");
    }

    return res.data;

  } catch (error: any) {

    if (error.code === "ECONNABORTED") {
      throw new Error("Server timeout");
    }

    if (error.response) {
      throw new Error(error.response.data?.message || "Login failed");
    }

    if (error.request) {
      throw new Error("Server not responding");
    }

    throw new Error(error.message || "Unknown error");
  }
};