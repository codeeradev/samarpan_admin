import { get, post } from "@/apis/apiClient";
import { ENDPOINT } from "@/apis/endpoint";

export interface GalleryItem {
  _id: string;
  caption?: string;
  image?: string;
  video?: string;
  mediaType?: "image" | "video";
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
  media: File | string,
  caption: string,
  category = "other",
  mediaType: "image" | "video" = "image",
): Promise<GalleryItem> => {
  try {
    if (mediaType === "video" && typeof media === "string") {
      // For video, send URL as JSON
      const res = await post(ENDPOINT.ADD_GALLERY, {
        caption,
        category,
        mediaType,
        video: media,
      }, {
        needAuth: true,
      });
      return res?.data?.gallery;
    } else {
      // For image, send as FormData
      const formData = new FormData();
      formData.append("caption", caption);
      formData.append("category", category);
      formData.append("mediaType", mediaType);
      formData.append(mediaType, media as File);

      const res = await post(ENDPOINT.ADD_GALLERY, formData, {
        needAuth: true,
      });
      return res?.data?.gallery;
    }
  } catch (error: any) {
    throw new Error(
      error.response?.data?.message ?? "Failed to add gallery item",
    );
  }
};

export const updateGalleryApi = async (
  id: string,
  caption: string,
  category = "other",
  media?: File | string,
  mediaType?: "image" | "video",
): Promise<GalleryItem> => {
  try {
    if (mediaType === "video" && typeof media === "string") {
      // For video URL update
      const res = await post(
        `${ENDPOINT.UPDATE_GALLERY}/${id}`,
        {
          caption,
          category,
          mediaType: "video",
          video: media,
        },
        { needAuth: true },
      );
      return res?.data?.gallery;
    } else if (media instanceof File && mediaType === "image") {
      // For image file update
      const formData = new FormData();
      formData.append("caption", caption);
      formData.append("category", category);
      formData.append("mediaType", "image");
      formData.append("image", media);
      
      const res = await post(
        `${ENDPOINT.UPDATE_GALLERY}/${id}`,
        formData,
        { needAuth: true },
      );
      return res?.data?.gallery;
    } else {
      // Just update caption/category
      const res = await post(
        `${ENDPOINT.UPDATE_GALLERY}/${id}`,
        { caption, category },
        { needAuth: true },
      );
      return res?.data?.gallery;
    }
  } catch (error: any) {
    throw new Error(
      error.response?.data?.message ?? "Failed to update gallery item",
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
      error.response?.data?.message ?? "Failed to delete gallery item",
    );
  }
};
