export const BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:9010/admin";

export const ENDPOINT = {
  LOGIN: "/admin-login",
  ADD_SERVICE: "/add-service",
  GET_ALL_SERVICES: "/get-all-services",
  UPDATE_SERVICE: "/update-services",
  ADD_DOCTOR: "/add-doctor",
  GET_ALL_DOCTORS: "/get-all-doctors",
  UPDATE_DOCTOR: "/update-doctor",
  DELETE_DOCTOR: "/delete-doctor",
};
