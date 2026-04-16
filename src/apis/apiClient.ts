import axios, { InternalAxiosRequestConfig, AxiosRequestConfig } from "axios";
import { BASE_URL } from "@/apis/endpoint";

declare module "axios" {
  export interface AxiosRequestConfig {
    needAuth?: boolean;
  }
}

const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  // Do not force Content-Type globally; axios will set correct headers for JSON and FormData.
  headers: {},
});

apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  if (config.needAuth) {
    const token = localStorage.getItem("token");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    delete config.needAuth;
  }

  // If we're sending FormData, do not keep `Content-Type: application/json`,
  // otherwise multipart boundary will be wrong and multer won't parse `req.files`.
  if (typeof FormData !== "undefined" && config.data instanceof FormData) {
    if (config.headers) {
      delete (config.headers as Record<string, any>)["Content-Type"];
      delete (config.headers as Record<string, any>)["content-type"];
    }
  }

  return config;
});

/* helpers */

export const get = (url: string, config?: AxiosRequestConfig) => {
  return apiClient.get(url, config);
};

export const post = (url: string, data?: any, config?: AxiosRequestConfig) => {
  return apiClient.post(url, data, config);
};

export const put = (url: string, data?: any, config?: AxiosRequestConfig) => {
  return apiClient.put(url, data, config);
};

export default apiClient;