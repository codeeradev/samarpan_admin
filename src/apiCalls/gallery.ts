import { get, post } from "@/apis/apiClient";
import { ENDPOINT } from "@/apis/endpoint";

export interface GalleryItem {
  _id: string;
  caption?: string;
  image: string;
  createdAt?: string;
  updatedAt?: string;
}

export const getAllGalleryApi = async (): Promise<GalleryItem[]> => {
  try {
    const res = await get(ENDPOINT.GET_ALL_GALLERY, { needAuth: true });
    return res?.data?.gallery ?? [];
  } catch (error: any) {
    throw new Error(
      error.response?.data?.message ?? "Failed to fetch gallery items",
    );
  }
};

export const addGalleryApi = async (image: File, caption: string): Promise<GalleryItem> => {
  try {
    const formData = new FormData();
    formData.append("caption", caption);
    formData.append("image", image);

    const res = await post(ENDPOINT.ADD_GALLERY, formData, {
      needAuth: true,
    });

    return res?.data?.gallery;
  } catch (error: any) {
    throw new Error(
      error.response?.data?.message ?? "Failed to add gallery image",
    );
  }
};

export const updateGalleryApi = async (
  id: string,
  caption: string
): Promise<GalleryItem> => {
  try {
    const res = await post(
      `${ENDPOINT.UPDATE_GALLERY}/${id}`,
      { caption },
      { needAuth: true }
    );

    return res?.data?.gallery;
  } catch (error: any) {
    throw new Error(
      error.response?.data?.message ?? "Failed to update gallery image"
    );
  }
};

export const deleteGalleryApi = async (id: string): Promise<void> => {
  try {
    await post(`${ENDPOINT.DELETE_GALLERY}/${id}`, undefined, {
      needAuth: true,
    });
  } catch (error: any) {
    throw new Error(
      error.response?.data?.message ?? "Failed to delete gallery image",
    );
  }
};
