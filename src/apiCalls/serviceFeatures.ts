import { get, post } from "@/apis/apiClient";
import { ENDPOINT } from "@/apis/endpoint";
import { createApiRequestError } from "@/lib/api-errors";

export interface ServiceFeatureItem {
  _id: string;

  title: string;

  slug: string;

  content: string;

  image?: string;

  serviceId: {
    _id: string;
    title: string;
  };

  serviceSubCategoryId?: {
    _id: string;
    title: string;
  };

  seo?: {
    metaTitle?: string;
    metaDescription?: string;
    keywords?: string[];
  };

  createdAt?: string;

  updatedAt?: string;
}

export interface ServiceFeaturePayload {
  title: string;

  slug?: string;

  content?: string;

  image?: File | string;

  serviceId: string;

  serviceSubCategoryId?: string;

  seo?: {
    metaTitle?: string;
    metaDescription?: string;
    keywords?: string[];
  };
}

function buildFormData(payload: ServiceFeaturePayload) {
  const formData = new FormData();

  formData.append("title", payload.title);

  formData.append("slug", payload.slug || "");

  formData.append("content", payload.content || "");

  formData.append("serviceId", payload.serviceId);

  // sub category id
  if (payload.serviceSubCategoryId) {
    formData.append("serviceSubCategoryId", payload.serviceSubCategoryId);
  }

  // image
  if (payload.image instanceof File) {
    formData.append("image", payload.image);
  }

  // seo
  formData.append("seo", JSON.stringify(payload.seo || {}));

  return formData;
}

export const getServiceFeaturesApi = async (query?: string | unknown) => {
  try {
    const queryString = typeof query === "string" ? query : "";

    const res = await get(`${ENDPOINT.GET_SERVICE_FEATURES}${queryString}`, {
      needAuth: true,
    });

    return res?.data || [];
  } catch (error) {
    throw createApiRequestError(error, "Failed to fetch service features");
  }
};

export const addServiceFeatureApi = async (
  payload: ServiceFeaturePayload,
  type?: string,
) => {
  try {
    const formData = buildFormData(payload);

    const url = type
      ? `${ENDPOINT.ADD_SERVICE_FEATURE}?type=${type}`
      : ENDPOINT.ADD_SERVICE_FEATURE;

    const res = await post(url, formData, {
      needAuth: true,
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    return res?.data?.feature || res?.data?.serviceSubCategory;
  } catch (error) {
    throw createApiRequestError(error, "Failed to add service feature");
  }
};

export const updateServiceFeatureApi = async (
  id: string,
  payload: ServiceFeaturePayload,
  type?: string,
) => {
  try {
    const formData = buildFormData(payload);

    const url = type
      ? `${ENDPOINT.UPDATE_SERVICE_FEATURE}/${id}?type=${type}`
      : `${ENDPOINT.UPDATE_SERVICE_FEATURE}/${id}`;

    const res = await post(url, formData, {
      needAuth: true,
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    return res?.data?.feature;
  } catch (error) {
    throw createApiRequestError(error, "Failed to update service feature");
  }
};

export const deleteServiceFeatureApi = async (id: string, type?: string) => {
  try {
    const url = type
      ? `${ENDPOINT.DELETE_SERVICE_FEATURE}/${id}?type=${type}`
      : `${ENDPOINT.DELETE_SERVICE_FEATURE}/${id}`;

    await post(url, {}, { needAuth: true });
  } catch (error) {
    throw createApiRequestError(error, "Failed to delete service feature");
  }
};
