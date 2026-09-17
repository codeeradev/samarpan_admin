"use client";

import { BASE_URL } from "@/apis/endpoint";
import { type Column, DataTable } from "@/components/admin/DataTable";
import { PageHeader } from "@/components/admin/PageHeader";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Eye, Pencil, Plus, Trash2 } from "lucide-react";
import { type ChangeEvent, useMemo, useState } from "react";
import { toast } from "sonner";

import {
  type GalleryItem,
  addGalleryApi,
  deleteGalleryApi,
  getAllGalleryApi,
  updateGalleryApi,
} from "@/apiCalls/gallery";

const GALLERY_QUERY_KEY = ["gallery"];

const CATEGORIES = [
  { value: "festival", label: "Festival" },
  { value: "patients", label: "Patients" },
  { value: "events", label: "Events" },
  { value: "facilities", label: "Facilities" },
  { value: "team", label: "Team" },
  { value: "awards", label: "Awards" },
  { value: "hospital", label: "Hospital" },
  { value: "other", label: "Other" },
];

function normalizeCategory(value: string) {
  return value.trim().toLowerCase();
}

function formatCategoryLabel(value: string) {
  return value
    .split(/[\s_-]+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function convertToEmbedUrl(url: string): string {
  if (!url) return url;
  
  try {
    const cleanUrl = url.trim();
    
    // YouTube watch URL (https://www.youtube.com/watch?v=VIDEO_ID)
    if (cleanUrl.includes('youtube.com/watch')) {
      const urlObj = new URL(cleanUrl);
      const videoId = urlObj.searchParams.get('v');
      if (videoId) return `https://www.youtube.com/embed/${videoId}`;
    }
    
    // YouTube short URL (https://youtu.be/VIDEO_ID)
    if (cleanUrl.includes('youtu.be/')) {
      const videoId = cleanUrl.split('youtu.be/')[1]?.split('?')[0]?.split('/')[0];
      if (videoId) return `https://www.youtube.com/embed/${videoId}`;
    }
    
    // YouTube Shorts (https://www.youtube.com/shorts/VIDEO_ID)
    if (cleanUrl.includes('youtube.com/shorts/')) {
      const videoId = cleanUrl.split('shorts/')[1]?.split('?')[0]?.split('/')[0];
      if (videoId) return `https://www.youtube.com/embed/${videoId}`;
    }
    
    // Vimeo (https://vimeo.com/VIDEO_ID)
    if (cleanUrl.includes('vimeo.com/') && !cleanUrl.includes('player.vimeo.com')) {
      const videoId = cleanUrl.split('vimeo.com/')[1]?.split('?')[0]?.split('/')[0];
      if (videoId && /^\d+$/.test(videoId)) {
        return `https://player.vimeo.com/video/${videoId}`;
      }
    }
    
    // Dailymotion (https://dailymotion.com/video/VIDEO_ID)
    if (cleanUrl.includes('dailymotion.com/video/')) {
      const videoId = cleanUrl.split('video/')[1]?.split('?')[0];
      if (videoId) return `https://www.dailymotion.com/embed/video/${videoId}`;
    }
    
    return cleanUrl;
  } catch {
    return url;
  }
}

export default function GalleryPage() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [caption, setCaption] = useState("");
  const [category, setCategory] = useState("other");
  const [mediaType, setMediaType] = useState<"image" | "video">("image");
  const [media, setMedia] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewTarget, setPreviewTarget] = useState<GalleryItem | null>(null);
  const [customCategories, setCustomCategories] = useState<string[]>([]);
  const [addingCategoryFor, setAddingCategoryFor] = useState<
    "create" | "edit" | null
  >(null);
  const [newCategoryTitle, setNewCategoryTitle] = useState("");

  const [editTarget, setEditTarget] = useState<GalleryItem | null>(null);
  const [editCaption, setEditCaption] = useState("");
  const [editCategory, setEditCategory] = useState("other");
  const [editMediaType, setEditMediaType] = useState<"image" | "video">("image");
  const [editMedia, setEditMedia] = useState<File | null>(null);
  const [editPreviewUrl, setEditPreviewUrl] = useState<string | null>(null);

  const { data: gallery = [], isLoading } = useQuery({
    queryKey: GALLERY_QUERY_KEY,
    queryFn: getAllGalleryApi,
  });

  const categoryOptions = useMemo(() => {
    const optionMap = new Map(CATEGORIES.map((cat) => [cat.value, cat.label]));

    [...gallery.map((item) => item.category), ...customCategories]
      .filter((value): value is string => Boolean(value))
      .forEach((value) => {
        const normalized = normalizeCategory(value);
        if (normalized && !optionMap.has(normalized)) {
          optionMap.set(normalized, formatCategoryLabel(normalized));
        }
      });

    return Array.from(optionMap, ([value, label]) => ({ value, label }));
  }, [gallery, customCategories]);

  const addMutation = useMutation({
    mutationFn: ({
      media,
      caption,
      category,
      mediaType,
    }: { media: File | string; caption: string; category: string; mediaType: "image" | "video" }) =>
      addGalleryApi(media, caption, category, mediaType),
  });
  const deleteMutation = useMutation({ mutationFn: deleteGalleryApi });

  const updateMutation = useMutation({
    mutationFn: ({
      id,
      caption,
      category,
      media,
      mediaType,
    }: { id: string; caption: string; category: string; media?: File | string; mediaType?: "image" | "video" }) =>
      updateGalleryApi(id, caption, category, media, mediaType),
  });

  const handleMediaChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    setMedia(file);
    setPreviewUrl(file ? URL.createObjectURL(file) : null);
  };

  const handleEditMediaChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    setEditMedia(file);
    setEditPreviewUrl(file ? URL.createObjectURL(file) : null);
  };

  const startAddCategory = (target: "create" | "edit") => {
    setAddingCategoryFor(target);
    setNewCategoryTitle("");
  };

  const applyNewCategory = () => {
    const normalized = normalizeCategory(newCategoryTitle);

    if (!normalized) {
      toast.error("Please enter a category title.");
      return;
    }

    setCustomCategories((previous) =>
      previous.includes(normalized) ? previous : [...previous, normalized],
    );

    if (addingCategoryFor === "edit") {
      setEditCategory(normalized);
    } else {
      setCategory(normalized);
    }

    setAddingCategoryFor(null);
    setNewCategoryTitle("");
  };

  const API_ASSET_ORIGIN = BASE_URL.replace(/\/admin\/?$/, "");

  function resolveAssetUrl(path?: string) {
    if (!path) return "";
    if (/^https?:\/\//.test(path)) return path;
    return `${API_ASSET_ORIGIN}${path.startsWith("/") ? path : `/${path}`}`;
  }

  const handleSave = async () => {
    if (mediaType === "image" && !media) {
      toast.error("Please select an image to upload.");
      return;
    }
    
    if (mediaType === "video" && !previewUrl) {
      toast.error("Please enter a video URL.");
      return;
    }

    try {
      if (mediaType === "image" && media) {
        await addMutation.mutateAsync({ media, caption, category, mediaType });
      } else if (mediaType === "video" && previewUrl) {
        // Convert to embed URL before saving
        const embedUrl = convertToEmbedUrl(previewUrl);
        await addMutation.mutateAsync({ 
          media: embedUrl as any, 
          caption, 
          category, 
          mediaType 
        });
      }
      
      toast.success("Gallery item added");
      queryClient.invalidateQueries({ queryKey: GALLERY_QUERY_KEY });
      setOpen(false);
      setMedia(null);
      setPreviewUrl(null);
      setCaption("");
      setCategory("other");
      setMediaType("image");
      setAddingCategoryFor(null);
      setNewCategoryTitle("");
    } catch (_error) {
      toast.error("Unable to add gallery item.");
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Delete this image?")) return;
    await deleteMutation.mutateAsync(id);
    queryClient.invalidateQueries({ queryKey: GALLERY_QUERY_KEY });
    toast.success("Gallery image deleted");
  };

  const galleryRows = useMemo(() => gallery, [gallery]);

  const columns: Column<GalleryItem>[] = [
    {
      key: "caption",
      header: "Caption",
      render: (item) => (
        <span className="text-sm truncate block max-w-[220px]">
          {item.caption || "—"}
        </span>
      ),
    },
    {
      key: "category",
      header: "Category",
      render: (item) => (
        <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-primary/10 text-primary capitalize">
          {item.category || "other"}
        </span>
      ),
    },
    {
      key: "mediaType",
      header: "Type",
      render: (item) => (
        <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-secondary/10 text-secondary capitalize">
          {item.mediaType || "image"}
        </span>
      ),
    },
    {
      key: "media",
      header: "Preview",
      render: (item) => (
        <div className="h-14 w-20 overflow-hidden rounded-lg border border-border bg-muted/60">
          {item.mediaType === "video" && item.video ? (
            <video
              src={resolveAssetUrl(item.video)}
              className="h-full w-full object-cover"
              muted
            />
          ) : (
            <img
              src={resolveAssetUrl(item.image)}
              alt="Gallery"
              className="h-full w-full object-cover"
            />
          )}
        </div>
      ),
    },
    {
      key: "createdAt",
      header: "Uploaded",
      render: (item) => (
        <span className="text-sm text-muted-foreground">
          {item.createdAt ? new Date(item.createdAt).toLocaleString() : "—"}
        </span>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      className: "text-right",
      render: (item) => (
        <div className="flex items-center justify-end gap-2">
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="rounded-lg border-border"
            onClick={() => setPreviewTarget(item)}
          >
            <Eye size={14} />
            Preview
          </Button>
          <Button
            size="icon"
            variant="ghost"
            onClick={() => {
              setEditTarget(item);
              setEditCaption(item.caption || "");
              setEditCategory(item.category || "other");
              setEditMediaType(item.mediaType || "image");
              setEditMedia(null);
              setEditPreviewUrl(null);
            }}
          >
            <Pencil size={14} />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            onClick={() => handleDelete(item._id)}
            aria-label="Delete media"
          >
            <Trash2 size={16} />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Gallery"
        description="Manage website gallery images and videos."
        action={
          <Button
            onClick={() => setOpen(true)}
            className="rounded-xl gap-2 bg-primary"
          >
            <Plus size={14} /> Add Media
          </Button>
        }
      />

      <DataTable<GalleryItem>
        columns={columns}
        data={galleryRows}
        isLoading={isLoading}
        searchable
        searchKeys={["image", "caption"] as (keyof GalleryItem)[]}
        emptyText="No images uploaded yet."
        rowKey={(row) => row._id}
        data-ocid="gallery.table"
      />

      <Dialog
        open={open}
        onOpenChange={(nextOpen) => {
          setOpen(nextOpen);
          if (!nextOpen) {
            setAddingCategoryFor(null);
            setNewCategoryTitle("");
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Gallery Item</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label
                htmlFor="gallery-caption"
                className="text-sm font-medium mb-1.5 block"
              >
                Caption
              </label>
              <Input
                id="gallery-caption"
                type="text"
                placeholder="Enter caption"
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
              />
            </div>

            <div>
              <label
                htmlFor="gallery-media-type"
                className="text-sm font-medium mb-1.5 block"
              >
                Media Type
              </label>
              <select
                id="gallery-media-type"
                value={mediaType}
                onChange={(e) => setMediaType(e.target.value as "image" | "video")}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <option value="image">Image</option>
                <option value="video">Video</option>
              </select>
            </div>

            <div>
              <div className="mb-1.5 flex items-center justify-between gap-3">
                <label
                  htmlFor="gallery-category"
                  className="text-sm font-medium"
                >
                  Category
                </label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-7 gap-1 px-2 text-xs"
                  onClick={() => startAddCategory("create")}
                >
                  <Plus size={13} /> Add
                </Button>
              </div>
              {addingCategoryFor === "create" ? (
                <div className="flex gap-2">
                  <Input
                    value={newCategoryTitle}
                    onChange={(e) => setNewCategoryTitle(e.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        event.preventDefault();
                        applyNewCategory();
                      }
                    }}
                    placeholder="Category title"
                  />
                  <Button type="button" onClick={applyNewCategory}>
                    Use
                  </Button>
                </div>
              ) : (
                <select
                  id="gallery-category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  {categoryOptions.map((cat) => (
                    <option key={cat.value} value={cat.value}>
                      {cat.label}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div>
              <label
                htmlFor="gallery-media"
                className="text-sm font-medium mb-1.5 block"
              >
                {mediaType === "image" ? "Image" : "Video URL"}
              </label>
              {mediaType === "image" ? (
                <>
                  <Input
                    id="gallery-media"
                    type="file"
                    accept="image/*"
                    onChange={handleMediaChange}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Recommended: 1170 × 1560
                  </p>
                </>
              ) : (
                <>
                  <Input
                    id="gallery-media"
                    type="url"
                    placeholder="https://www.youtube.com/watch?v=... or https://youtu.be/..."
                    value={previewUrl || ""}
                    onChange={(e) => {
                      setPreviewUrl(e.target.value);
                      setMedia(null);
                    }}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Paste any YouTube, Vimeo, or Dailymotion link (auto-converted)
                  </p>
                </>
              )}
            </div>

            {previewUrl && (
              <div className="overflow-hidden rounded-2xl border bg-muted">
                {mediaType === "video" ? (
                  <div className="aspect-video w-full">
                    <iframe
                      src={convertToEmbedUrl(previewUrl)}
                      className="w-full h-full"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      title="Video preview"
                    />
                  </div>
                ) : (
                  <img
                    src={previewUrl}
                    alt="Preview"
                    className="h-56 w-full object-cover"
                  />
                )}
              </div>
            )}
            <Button onClick={handleSave} className="w-full">
              Save {mediaType === "image" ? "Image" : "Video"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!previewTarget}
        onOpenChange={(nextOpen) => !nextOpen && setPreviewTarget(null)}
      >
        <DialogContent className="max-h-[92vh] overflow-y-auto rounded-3xl border-border sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>Gallery Preview</DialogTitle>
          </DialogHeader>
          {previewTarget && (
            <div className="overflow-hidden rounded-2xl border bg-muted/60">
              {previewTarget.mediaType === "video" && previewTarget.video ? (
                <div className="aspect-video w-full bg-black">
                  <iframe
                    src={previewTarget.video}
                    className="w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    title="Video preview"
                  />
                </div>
              ) : (
                <img
                  src={resolveAssetUrl(previewTarget.image)}
                  alt="Gallery preview"
                  className="w-full max-h-[70vh] object-contain bg-card"
                />
              )}
            </div>
          )}

          {previewTarget?.caption && (
            <p className="mt-3 text-sm text-muted-foreground text-center">
              {previewTarget.caption}
            </p>
          )}
        </DialogContent>
      </Dialog>
      <Dialog
        open={!!editTarget}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) {
            setEditTarget(null);
            setAddingCategoryFor(null);
            setNewCategoryTitle("");
            setEditMedia(null);
            setEditPreviewUrl(null);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Gallery Item</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label
                htmlFor="edit-gallery-caption"
                className="text-sm font-medium mb-1.5 block"
              >
                Caption
              </label>
              <Input
                id="edit-gallery-caption"
                value={editCaption}
                onChange={(e) => setEditCaption(e.target.value)}
                placeholder="Enter caption"
              />
            </div>

            <div>
              <label
                htmlFor="edit-gallery-media-type"
                className="text-sm font-medium mb-1.5 block"
              >
                Media Type
              </label>
              <select
                id="edit-gallery-media-type"
                value={editMediaType}
                onChange={(e) => setEditMediaType(e.target.value as "image" | "video")}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <option value="image">Image</option>
                <option value="video">Video</option>
              </select>
            </div>

            <div>
              <div className="mb-1.5 flex items-center justify-between gap-3">
                <label
                  htmlFor="edit-gallery-category"
                  className="text-sm font-medium"
                >
                  Category
                </label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-7 gap-1 px-2 text-xs"
                  onClick={() => startAddCategory("edit")}
                >
                  <Plus size={13} /> Add
                </Button>
              </div>
              {addingCategoryFor === "edit" ? (
                <div className="flex gap-2">
                  <Input
                    value={newCategoryTitle}
                    onChange={(e) => setNewCategoryTitle(e.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        event.preventDefault();
                        applyNewCategory();
                      }
                    }}
                    placeholder="Category title"
                  />
                  <Button type="button" onClick={applyNewCategory}>
                    Use
                  </Button>
                </div>
              ) : (
                <select
                  id="edit-gallery-category"
                  value={editCategory}
                  onChange={(e) => setEditCategory(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  {categoryOptions.map((cat) => (
                    <option key={cat.value} value={cat.value}>
                      {cat.label}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div>
              <label
                htmlFor="edit-gallery-media"
                className="text-sm font-medium mb-1.5 block"
              >
                Update {editMediaType === "image" ? "Image" : "Video URL"} (Optional)
              </label>
              {editMediaType === "image" ? (
                <>
                  <Input
                    id="edit-gallery-media"
                    type="file"
                    accept="image/*"
                    onChange={handleEditMediaChange}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Leave empty to keep the current image
                  </p>
                </>
              ) : (
                <>
                  <Input
                    id="edit-gallery-media"
                    type="url"
                    placeholder="https://www.youtube.com/watch?v=... or https://youtu.be/..."
                    value={editPreviewUrl || ""}
                    onChange={(e) => {
                      setEditPreviewUrl(e.target.value);
                      setEditMedia(null);
                    }}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Leave empty to keep current video, or paste new link
                  </p>
                </>
              )}
            </div>

            {/* Current media preview */}
            {editTarget && !editPreviewUrl && (
              <div>
                <p className="text-sm font-medium mb-1.5">Current Media</p>
                <div className="overflow-hidden rounded-2xl border bg-muted">
                  {editTarget.mediaType === "video" && editTarget.video ? (
                    <div className="aspect-video w-full">
                      <iframe
                        src={convertToEmbedUrl(editTarget.video)}
                        className="w-full h-full"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        title="Current video"
                      />
                    </div>
                  ) : (
                    <img
                      src={resolveAssetUrl(editTarget.image)}
                      alt="Current"
                      className="h-56 w-full object-cover"
                    />
                  )}
                </div>
              </div>
            )}

            {/* New media preview */}
            {editPreviewUrl && (
              <div>
                <p className="text-sm font-medium mb-1.5">New Media Preview</p>
                <div className="overflow-hidden rounded-2xl border bg-muted">
                  {editMediaType === "video" ? (
                    <div className="aspect-video w-full">
                      <iframe
                        src={convertToEmbedUrl(editPreviewUrl)}
                        className="w-full h-full"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        title="Video preview"
                      />
                    </div>
                  ) : (
                    <img
                      src={editPreviewUrl}
                      alt="Preview"
                      className="h-56 w-full object-cover"
                    />
                  )}
                </div>
              </div>
            )}

            <Button
              onClick={async () => {
                if (!editTarget) return;

                let mediaToSend: File | string | undefined;
                
                if (editMediaType === "video" && editPreviewUrl) {
                  // Convert video URL to embed format
                  mediaToSend = convertToEmbedUrl(editPreviewUrl);
                } else if (editMediaType === "image" && editMedia) {
                  // Image file
                  mediaToSend = editMedia;
                }

                await updateMutation.mutateAsync({
                  id: editTarget._id,
                  caption: editCaption,
                  category: editCategory,
                  media: mediaToSend,
                  mediaType: editMediaType,
                });

                toast.success("Gallery item updated");
                queryClient.invalidateQueries({ queryKey: GALLERY_QUERY_KEY });
                setEditTarget(null);
                setEditMedia(null);
                setEditPreviewUrl(null);
              }}
              className="w-full"
            >
              Update
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
