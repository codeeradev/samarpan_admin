import { get, post } from "@/apis/apiClient";
import { ENDPOINT } from "@/apis/endpoint";
import { createApiRequestError } from "@/lib/api-errors";

export interface ServiceFeatureItem {
  _id: string;
  title: string;
  slug: string;
  content: string;
  serviceId: {
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
  serviceId: string;
  seo?: {
    metaTitle?: string;
    metaDescription?: string;
    keywords?: string[];
  };
}

export const getServiceFeaturesApi = async () => {
  try {
    const res = await get(
      ENDPOINT.GET_SERVICE_FEATURES,
      { needAuth: true },
    );

    return res?.data || [];
  } catch (error) {
    throw createApiRequestError(
      error,
      "Failed to fetch service features",
    );
  }
};

export const addServiceFeatureApi = async (
  payload: ServiceFeaturePayload,
) => {
  try {
    const res = await post(
      ENDPOINT.ADD_SERVICE_FEATURE,
      payload,
      { needAuth: true },
    );

    return res?.data?.feature;
  } catch (error) {
    throw createApiRequestError(
      error,
      "Failed to add service feature",
    );
  }
};

export const updateServiceFeatureApi = async (
  id: string,
  payload: ServiceFeaturePayload,
) => {
  try {
    const res = await post(
      `${ENDPOINT.UPDATE_SERVICE_FEATURE}/${id}`,
      payload,
      { needAuth: true },
    );

    return res?.data?.feature;
  } catch (error) {
    throw createApiRequestError(
      error,
      "Failed to update service feature",
    );
  }
};

export const deleteServiceFeatureApi = async (
  id: string,
) => {
  try {
    await post(
      `${ENDPOINT.DELETE_SERVICE_FEATURE}/${id}`,
      {},
      { needAuth: true },
    );
  } catch (error) {
    throw createApiRequestError(
      error,
      "Failed to delete service feature",
    );
  }
};