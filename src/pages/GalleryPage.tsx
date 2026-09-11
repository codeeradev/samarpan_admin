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

export default function GalleryPage() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [caption, setCaption] = useState("");
  const [category, setCategory] = useState("other");
  const [image, setImage] = useState<File | null>(null);
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
  const [editImage, setEditImage] = useState<File | null>(null);
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
      image,
      caption,
      category,
    }: { image: File; caption: string; category: string }) =>
      addGalleryApi(image, caption, category),
  });
  const deleteMutation = useMutation({ mutationFn: deleteGalleryApi });

  const updateMutation = useMutation({
    mutationFn: ({
      id,
      caption,
      category,
      image,
    }: { id: string; caption: string; category: string; image?: File }) =>
      updateGalleryApi(id, caption, category, image),
  });

  const handleImageChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    setImage(file);
    setPreviewUrl(file ? URL.createObjectURL(file) : null);
  };

  const handleEditImageChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    setEditImage(file);
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
    if (!image) {
      toast.error("Please select an image to upload.");
      return;
    }

    try {
      await addMutation.mutateAsync({ image, caption, category });
      toast.success("Gallery image added");
      queryClient.invalidateQueries({ queryKey: GALLERY_QUERY_KEY });
      setOpen(false);
      setImage(null);
      setPreviewUrl(null);
      setCaption("");
      setCategory("other");
      setAddingCategoryFor(null);
      setNewCategoryTitle("");
    } catch (_error) {
      toast.error("Unable to upload image.");
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
      key: "image",
      header: "Image",
      render: (item) => (
        <div className="h-14 w-20 overflow-hidden rounded-lg border border-border bg-muted/60">
          <img
            src={resolveAssetUrl(item.image)}
            alt="Gallery"
            className="h-full w-full object-cover"
          />
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
              setEditImage(null);
              setEditPreviewUrl(null);
            }}
          >
            <Pencil size={14} />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            onClick={() => handleDelete(item._id)}
            aria-label="Delete image"
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
        description="Manage website gallery images."
        action={
          <Button
            onClick={() => setOpen(true)}
            className="rounded-xl gap-2 bg-primary"
          >
            <Plus size={14} /> Add Image
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
            <DialogTitle>Add Gallery Image (1170 × 1560)</DialogTitle>
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
                htmlFor="gallery-image"
                className="text-sm font-medium mb-1.5 block"
              >
                Image
              </label>
              <Input
                id="gallery-image"
                type="file"
                accept="image/*"
                onChange={handleImageChange}
              />
            </div>

            {previewUrl && (
              <div className="overflow-hidden rounded-2xl border bg-muted">
                <img
                  src={previewUrl}
                  alt="Preview"
                  className="h-56 w-full object-cover"
                />
              </div>
            )}
            <Button onClick={handleSave} className="w-full">
              Save Image
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
              <img
                src={resolveAssetUrl(previewTarget.image)}
                alt="Gallery preview"
                className="w-full max-h-[70vh] object-contain bg-card"
              />
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
            setEditImage(null);
            setEditPreviewUrl(null);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Gallery Image</DialogTitle>
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
                htmlFor="edit-gallery-image"
                className="text-sm font-medium mb-1.5 block"
              >
                Update Image (Optional)
              </label>
              <Input
                id="edit-gallery-image"
                type="file"
                accept="image/*"
                onChange={handleEditImageChange}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Leave empty to keep the current image
              </p>
            </div>

            {/* Current image preview */}
            {editTarget && !editPreviewUrl && (
              <div>
                <p className="text-sm font-medium mb-1.5">Current Image</p>
                <div className="overflow-hidden rounded-2xl border bg-muted">
                  <img
                    src={resolveAssetUrl(editTarget.image)}
                    alt="Current"
                    className="h-56 w-full object-cover"
                  />
                </div>
              </div>
            )}

            {/* New image preview */}
            {editPreviewUrl && (
              <div>
                <p className="text-sm font-medium mb-1.5">New Image Preview</p>
                <div className="overflow-hidden rounded-2xl border bg-muted">
                  <img
                    src={editPreviewUrl}
                    alt="Preview"
                    className="h-56 w-full object-cover"
                  />
                </div>
              </div>
            )}

            <Button
              onClick={async () => {
                if (!editTarget) return;

                await updateMutation.mutateAsync({
                  id: editTarget._id,
                  caption: editCaption,
                  category: editCategory,
                  image: editImage || undefined,
                });

                toast.success("Gallery image updated");
                queryClient.invalidateQueries({ queryKey: GALLERY_QUERY_KEY });
                setEditTarget(null);
                setEditImage(null);
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
