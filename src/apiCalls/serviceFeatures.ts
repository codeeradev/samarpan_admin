import { get, post } from "@/apis/apiClient";
import { ENDPOINT } from "@/apis/endpoint";
import { createApiRequestError } from "@/lib/api-errors";

export const SERVICE_FEATURE_TYPE = {
  SUB_CATEGORY: "sub_cat",
} as const;

export type ServiceFeatureType =
  (typeof SERVICE_FEATURE_TYPE)[keyof typeof SERVICE_FEATURE_TYPE];

export interface ServiceFeatureRelation {
  _id: string;
  title: string;
  slug?: string;
}

export type ServiceFeatureRelationValue =
  | string
  | ServiceFeatureRelation
  | null
  | undefined;

export interface ServiceFeatureSeo {
  metaTitle?: string;
  metaDescription?: string;
  keywords?: string[];
}

export interface ServiceFeatureItem {
  _id: string;

  title: string;

  slug: string;

  content: string;

  image?: string;

  serviceId: ServiceFeatureRelationValue;

  serviceSubCategoryId?: ServiceFeatureRelationValue;

  featureServiceId?: ServiceFeatureRelationValue;

  seo?: ServiceFeatureSeo;

  createdAt?: string;

  updatedAt?: string;
}

export interface ServiceSubCategoryItem extends ServiceFeatureItem {
  serviceSubCategoryId: ServiceFeatureRelationValue;
}

export interface ServiceFeaturePayload {
  title: string;

  slug?: string;

  content?: string;

  image?: File | string;

  serviceId: string;

  serviceSubCategoryId?: string;

  seo?: ServiceFeatureSeo;
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
    formData.append("featureServiceId", payload.serviceSubCategoryId);
  }

  // image
  if (payload.image instanceof File) {
    formData.append("image", payload.image);
  }

  // seo
  formData.append("seo", JSON.stringify(payload.seo || {}));

  return formData;
}

function buildFeatureUrl(endpoint: string, type?: ServiceFeatureType, id?: string) {
  const baseUrl = id ? `${endpoint}/${id}` : endpoint;

  return type ? `${baseUrl}?type=${type}` : baseUrl;
}

export function getServiceFeatureRelationId(
  relation: ServiceFeatureRelationValue,
) {
  if (!relation) {
    return "";
  }

  return typeof relation === "string" ? relation : relation._id;
}

function normalizeServiceFeatureItem<T extends ServiceFeatureItem>(item: T): T {
  if (!item.serviceSubCategoryId && item.featureServiceId) {
    return {
      ...item,
      serviceSubCategoryId: item.featureServiceId,
    };
  }

  return item;
}

export const getServiceFeaturesApi = async <
  T extends ServiceFeatureItem = ServiceFeatureItem,
>(
  query?: string | unknown,
): Promise<T[]> => {
  try {
    const queryString = typeof query === "string" ? query : "";

    const res = await get(`${ENDPOINT.GET_SERVICE_FEATURES}${queryString}`, {
      needAuth: true,
    });

    return ((res?.data || []) as T[]).map((item) =>
      normalizeServiceFeatureItem(item),
    );
  } catch (error) {
    throw createApiRequestError(error, "Failed to fetch service features");
  }
};

export const getServiceSubCategoriesApi = async () =>
  getServiceFeaturesApi<ServiceSubCategoryItem>(
    `?type=${SERVICE_FEATURE_TYPE.SUB_CATEGORY}`,
  );

export const addServiceFeatureApi = async (
  payload: ServiceFeaturePayload,
  type?: ServiceFeatureType,
): Promise<ServiceFeatureItem> => {
  try {
    const formData = buildFormData(payload);

    const url = buildFeatureUrl(ENDPOINT.ADD_SERVICE_FEATURE, type);

    const res = await post(url, formData, {
      needAuth: true,
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    return (res?.data?.feature || res?.data?.serviceSubCategory) as ServiceFeatureItem;
  } catch (error) {
    throw createApiRequestError(error, "Failed to add service feature");
  }
};

export const updateServiceFeatureApi = async (
  id: string,
  payload: ServiceFeaturePayload,
  type?: ServiceFeatureType,
): Promise<ServiceFeatureItem> => {
  try {
    const formData = buildFormData(payload);

    const url = buildFeatureUrl(ENDPOINT.UPDATE_SERVICE_FEATURE, type, id);

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

export const deleteServiceFeatureApi = async (
  id: string,
  type?: ServiceFeatureType,
): Promise<void> => {
  try {
    const url = buildFeatureUrl(ENDPOINT.DELETE_SERVICE_FEATURE, type, id);

    await post(url, {}, { needAuth: true });
  } catch (error) {
    throw createApiRequestError(error, "Failed to delete service feature");
  }
};
