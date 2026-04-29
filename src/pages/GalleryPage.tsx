"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState, type ChangeEvent } from "react";
import { DataTable, type Column } from "@/components/admin/DataTable";
import { PageHeader } from "@/components/admin/PageHeader";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { BASE_URL } from "@/apis/endpoint";

import { Eye, Plus, Trash2 } from "lucide-react";
import {
  addGalleryApi,
  deleteGalleryApi,
  getAllGalleryApi,
  type GalleryItem,
} from "@/apiCalls/gallery";

const GALLERY_QUERY_KEY = ["gallery"];

export default function GalleryPage() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [image, setImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewTarget, setPreviewTarget] = useState<GalleryItem | null>(null);

  const { data: gallery = [], isLoading } = useQuery({
    queryKey: GALLERY_QUERY_KEY,
    queryFn: getAllGalleryApi,
  });

  const addMutation = useMutation({ mutationFn: addGalleryApi });
  const deleteMutation = useMutation({ mutationFn: deleteGalleryApi });

  const handleImageChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    setImage(file);
    setPreviewUrl(file ? URL.createObjectURL(file) : null);
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
      await addMutation.mutateAsync(image);
      toast.success("Gallery image added");
      queryClient.invalidateQueries({ queryKey: GALLERY_QUERY_KEY });
      setOpen(false);
      setImage(null);
      setPreviewUrl(null);
    } catch (error) {
      toast.error("Unable to upload image.");
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Delete this image?")) return;
    await deleteMutation.mutateAsync(id);
    queryClient.invalidateQueries({ queryKey: GALLERY_QUERY_KEY });
    toast.success("Gallery image deleted");
  };

  const totalImages = gallery.length;
  const galleryRows = useMemo(() => gallery, [gallery]);

  const columns: Column<GalleryItem>[] = [
    {
      key: "image",
      header: "Image",
      render: (item) => (
        <div className="flex items-center gap-3">
          <div className="h-10 w-14 overflow-hidden rounded-lg border border-slate-100 bg-slate-50 shrink-0">
            <img
              src={resolveAssetUrl(item.image)}
              alt="Gallery"
              className="h-full w-full object-cover"
            />
          </div>
          <span className="text-sm text-slate-700 truncate max-w-[420px]">
            {item.image}
          </span>
        </div>
      ),
    },
    {
      key: "createdAt",
      header: "Uploaded",
      render: (item) => (
        <span className="text-sm text-slate-600">
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
            className="rounded-lg border-slate-200"
            onClick={() => setPreviewTarget(item)}
          >
            <Eye size={14} />
            Preview
          </Button>
          <Button
            size="icon"
            variant="destructive"
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
          <Button onClick={() => setOpen(true)} className="rounded-xl gap-2">
            <Plus size={14} /> Add Image
          </Button>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="rounded-xl border bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Total Images</p>
          <p className="mt-2 text-3xl font-semibold">{totalImages}</p>
        </div>
      </div>

      <DataTable<GalleryItem>
        columns={columns}
        data={galleryRows}
        isLoading={isLoading}
        searchable
        searchKeys={["image"] as (keyof GalleryItem)[]}
        emptyText="No images uploaded yet."
        rowKey={(row) => row._id}
        data-ocid="gallery.table"
      />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Gallery Image</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
            />
            {previewUrl && (
              <div className="overflow-hidden rounded-2xl border bg-slate-100">
                <img src={previewUrl} alt="Preview" className="h-56 w-full object-cover" />
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
        <DialogContent className="max-h-[92vh] overflow-y-auto rounded-3xl border-slate-200 sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>Gallery Preview</DialogTitle>
          </DialogHeader>
          {previewTarget && (
            <div className="overflow-hidden rounded-2xl border bg-slate-50">
              <img
                src={resolveAssetUrl(previewTarget.image)}
                alt="Gallery preview"
                className="w-full max-h-[70vh] object-contain bg-white"
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
