"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState, type ChangeEvent } from "react";
import { Eye, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { BASE_URL } from "@/apis/endpoint";
import {
  addTpaApi,
  deleteTpaApi,
  getAllTpaApi,
  type TpaItem,
  updateTpaApi,
} from "@/apiCalls/tpa";
import { DataTable, type Column } from "@/components/admin/DataTable";
import { PageHeader } from "@/components/admin/PageHeader";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

const TPA_QUERY_KEY = ["tpa"];

export default function TPAPage() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewTarget, setPreviewTarget] = useState<TpaItem | null>(null);
  const [editTarget, setEditTarget] = useState<TpaItem | null>(null);
  const [editTitle, setEditTitle] = useState("");

  const { data: tpaItems = [], isLoading } = useQuery({
    queryKey: TPA_QUERY_KEY,
    queryFn: getAllTpaApi,
  });

  const addMutation = useMutation({
    mutationFn: ({ image, title }: { image: File; title: string }) =>
      addTpaApi(image, title),
  });

  const deleteMutation = useMutation({ mutationFn: deleteTpaApi });

  const updateMutation = useMutation({
    mutationFn: ({ id, title }: { id: string; title: string }) =>
      updateTpaApi(id, title),
  });

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

  const resetForm = () => {
    setOpen(false);
    setTitle("");
    setImage(null);
    setPreviewUrl(null);
  };

  const handleSave = async () => {
    // if (!title.trim()) {
    //   toast.error("Please enter a title.");
    //   return;
    // }

    if (!image) {
      toast.error("Please select an image to upload.");
      return;
    }

    try {
      await addMutation.mutateAsync({ image, title: title.trim() });
      toast.success("TPA item added");
      queryClient.invalidateQueries({ queryKey: TPA_QUERY_KEY });
      resetForm();
    } catch {
      toast.error("Unable to upload TPA image.");
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Delete this TPA item?")) return;
    await deleteMutation.mutateAsync(id);
    queryClient.invalidateQueries({ queryKey: TPA_QUERY_KEY });
    toast.success("TPA item deleted");
  };

  const tpaRows = useMemo(() => tpaItems, [tpaItems]);

  const columns: Column<TpaItem>[] = [
    {
      key: "title",
      header: "Title",
      render: (item) => (
        <span className="text-sm truncate block max-w-[220px]">
          {item.title || "—"}
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
            alt={item.title || "TPA"}
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
              setEditTitle(item.title || "");
            }}
          >
            <Pencil size={14} />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            onClick={() => handleDelete(item._id)}
            aria-label="Delete TPA item"
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
        title="TPA"
        description="Manage website TPA partner logos. Title is optional and stays internal."
        action={
          <Button
            onClick={() => setOpen(true)}
            className="rounded-xl gap-2 bg-primary"
          >
            <Plus size={14} /> Add TPA
          </Button>
        }
      />

      <DataTable<TpaItem>
        columns={columns}
        data={tpaRows}
        isLoading={isLoading}
        searchable
        searchKeys={["title", "image"] as (keyof TpaItem)[]}
        emptyText="No TPA items uploaded yet."
        rowKey={(row) => row._id}
      />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add TPA Item</DialogTitle>
          </DialogHeader>

          <Input
            type="text"
            placeholder="Title (optional, not shown on website)"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <div className="space-y-4">
            <Input type="file" accept="image/*" onChange={handleImageChange} />
            {previewUrl && (
              <div className="overflow-hidden rounded-2xl border bg-muted">
                <img
                  src={previewUrl}
                  alt="Preview"
                  className="h-56 w-full object-contain bg-white"
                />
              </div>
            )}
            <Button onClick={handleSave} className="w-full">
              Save TPA
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
            <DialogTitle>TPA Preview</DialogTitle>
          </DialogHeader>
          {previewTarget && (
            <div className="overflow-hidden rounded-2xl border bg-muted/60 p-4">
              <img
                src={resolveAssetUrl(previewTarget.image)}
                alt={previewTarget.title || "TPA preview"}
                className="w-full max-h-[60vh] object-contain bg-card"
              />
            </div>
          )}

          {previewTarget?.title && (
            <p className="mt-3 text-sm text-muted-foreground text-center">
              {previewTarget.title}
            </p>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!editTarget} onOpenChange={() => setEditTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit TPA Title (Optional)</DialogTitle>
          </DialogHeader>

          <Input
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
          />

          <Button
            onClick={async () => {
              if (!editTarget) return;
              // if (!editTitle.trim()) {
              //   toast.error("Please enter a title.");
              //   return;
              // }

              await updateMutation.mutateAsync({
                id: editTarget._id,
                title: editTitle.trim(),
              });

              queryClient.invalidateQueries({ queryKey: TPA_QUERY_KEY });
              toast.success("TPA title updated");
              setEditTarget(null);
            }}
          >
            Save Changes
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
