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
  ADD_REVIEW: "/add-review",
  GET_ALL_REVIEWS: "/get-all-reviews",
  UPDATE_REVIEW: "/update-review",
  DELETE_REVIEW: "/delete-review",
  ADD_SHORT: "/add-short",
  GET_ALL_SHORTS: "/get-all-shorts",
  UPDATE_SHORT: "/update-short",
  DELETE_SHORT: "/delete-short",
};
