import { get, post } from "@/apis/apiClient";
import { ENDPOINT } from "@/apis/endpoint";

export interface GalleryItem {
  _id: string;
  caption?: string;
  image: string;
  category?: string;
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

export const addGalleryApi = async (
  image: File,
  caption: string,
  category = "other",
): Promise<GalleryItem> => {
  try {
    const formData = new FormData();
    formData.append("caption", caption);
    formData.append("category", category);
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
  caption: string,
  category = "other",
  image?: File,
): Promise<GalleryItem> => {
  try {
    let payload: FormData | { caption: string; category: string };
    
    if (image) {
      const formData = new FormData();
      formData.append("caption", caption);
      formData.append("category", category);
      formData.append("image", image);
      payload = formData;
    } else {
      payload = { caption, category };
    }

    const res = await post(
      `${ENDPOINT.UPDATE_GALLERY}/${id}`,
      payload,
      { needAuth: true },
    );

    return res?.data?.gallery;
  } catch (error: any) {
    throw new Error(
      error.response?.data?.message ?? "Failed to update gallery image",
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
