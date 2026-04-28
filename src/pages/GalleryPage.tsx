"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState, type ChangeEvent } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { BASE_URL } from "@/apis/endpoint";

import { Plus, Trash2, ImageIcon } from "lucide-react";
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold">Gallery</h1>
          <p className="text-sm text-slate-500">
            Manage website gallery images.
          </p>
        </div>

        <Button onClick={() => setOpen(true)}>
          <Plus size={14} /> Add Image
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="rounded-xl border bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Total Images</p>
          <p className="mt-2 text-3xl font-semibold">{totalImages}</p>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {isLoading ? (
          <div className="rounded-xl border bg-white p-6 text-center text-slate-500">
            Loading gallery...
          </div>
        ) : galleryRows.length === 0 ? (
          <div className="rounded-xl border bg-white p-6 text-center text-slate-500">
            No images uploaded yet.
          </div>
        ) : (
          galleryRows.map((item) => (
            <div key={item._id} className="group overflow-hidden rounded-3xl border bg-white shadow-sm transition hover:shadow-md">
              <div className="relative aspect-[4/3] overflow-hidden bg-slate-100">
                <img src={resolveAssetUrl(item.image)} alt="Gallery item" className="h-full w-full object-cover transition duration-200 group-hover:scale-105" />
              </div>
              <div className="flex items-center justify-between gap-4 p-4">
                <div>
                  <p className="text-sm font-medium text-slate-900">Image</p>
                  <p className="text-xs text-slate-500">{new Date(item.createdAt ?? "").toLocaleDateString()}</p>
                </div>
                <Button
                  size="icon"
                  variant="destructive"
                  onClick={() => handleDelete(item._id)}
                >
                  <Trash2 size={16} />
                </Button>
              </div>
            </div>
          ))
        )}
      </div>

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
    </div>
  );
}
