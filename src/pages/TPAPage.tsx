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

const TPA_CATEGORIES = [
  { value: "government", label: "Government Department" },
  { value: "tpa", label: "TPA" },
  { value: "insurance", label: "Insurance Company" },
  { value: "corporate", label: "Corporate Partner" },
];

function getCategoryLabel(value?: string) {
  return (
    TPA_CATEGORIES.find((category) => category.value === (value || "tpa"))
      ?.label || "TPA"
  );
}

export default function TPAPage() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("tpa");
  const [image, setImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewTarget, setPreviewTarget] = useState<TpaItem | null>(null);
  const [editTarget, setEditTarget] = useState<TpaItem | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editCategory, setEditCategory] = useState("tpa");
  const [editImage, setEditImage] = useState<File | null>(null);
  const [editPreviewUrl, setEditPreviewUrl] = useState<string | null>(null);

  const { data: tpaItems = [], isLoading } = useQuery({
    queryKey: TPA_QUERY_KEY,
    queryFn: getAllTpaApi,
  });

  const addMutation = useMutation({
    mutationFn: ({
      image,
      title,
      category,
    }: { image: File; title: string; category: string }) =>
      addTpaApi(image, title, category),
  });

  const deleteMutation = useMutation({ mutationFn: deleteTpaApi });

  const updateMutation = useMutation({
    mutationFn: ({
      id,
      title,
      category,
      image,
    }: { id: string; title: string; category: string; image?: File }) =>
      updateTpaApi(id, title, category, image),
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

  const API_ASSET_ORIGIN = BASE_URL.replace(/\/admin\/?$/, "");

  function resolveAssetUrl(path?: string) {
    if (!path) return "";
    if (/^https?:\/\//.test(path)) return path;
    return `${API_ASSET_ORIGIN}${path.startsWith("/") ? path : `/${path}`}`;
  }

  const resetForm = () => {
    setOpen(false);
    setTitle("");
    setCategory("tpa");
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
      await addMutation.mutateAsync({ image, title: title.trim(), category });
      toast.success("Empanelled corporate item added");
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
      key: "category",
      header: "Category",
      render: (item) => (
        <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-primary/10 text-primary">
          {getCategoryLabel(item.category)}
        </span>
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
              setEditCategory(item.category || "tpa");
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
        title="Empanelled Corporate"
        description="Manage government departments, TPA, insurance and corporate partner logos."
        action={
          <Button
            onClick={() => setOpen(true)}
            className="rounded-xl gap-2 bg-primary"
          >
            <Plus size={14} /> Add Partner
          </Button>
        }
      />

      <DataTable<TpaItem>
        columns={columns}
        data={tpaRows}
        isLoading={isLoading}
        searchable
        searchKeys={["title", "image", "category"] as (keyof TpaItem)[]}
        emptyText="No empanelled corporate items uploaded yet."
        rowKey={(row) => row._id}
      />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Empanelled Corporate Item</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label
                htmlFor="tpa-title"
                className="text-sm font-medium mb-1.5 block"
              >
                Title
              </label>
              <Input
                id="tpa-title"
                type="text"
                placeholder="Title (optional)"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            <div>
              <label
                htmlFor="tpa-category"
                className="text-sm font-medium mb-1.5 block"
              >
                Category
              </label>
              <select
                id="tpa-category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                {TPA_CATEGORIES.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="tpa-image"
                className="text-sm font-medium mb-1.5 block"
              >
                Logo
              </label>
              <Input
                id="tpa-image"
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
                  className="h-56 w-full object-contain bg-white"
                />
              </div>
            )}
            <Button onClick={handleSave} className="w-full">
              Save Partner
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
            <DialogTitle>Empanelled Corporate Preview</DialogTitle>
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

      <Dialog
        open={!!editTarget}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) {
            setEditTarget(null);
            setEditImage(null);
            setEditPreviewUrl(null);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Empanelled Corporate Item</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label
                htmlFor="edit-tpa-title"
                className="text-sm font-medium mb-1.5 block"
              >
                Title
              </label>
              <Input
                id="edit-tpa-title"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                placeholder="Title (optional)"
              />
            </div>

            <div>
              <label
                htmlFor="edit-tpa-category"
                className="text-sm font-medium mb-1.5 block"
              >
                Category
              </label>
              <select
                id="edit-tpa-category"
                value={editCategory}
                onChange={(e) => setEditCategory(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                {TPA_CATEGORIES.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="edit-tpa-image"
                className="text-sm font-medium mb-1.5 block"
              >
                Update Logo (Optional)
              </label>
              <Input
                id="edit-tpa-image"
                type="file"
                accept="image/*"
                onChange={handleEditImageChange}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Leave empty to keep the current logo
              </p>
            </div>

            {/* Current logo preview */}
            {editTarget && !editPreviewUrl && (
              <div>
                <p className="text-sm font-medium mb-1.5">Current Logo</p>
                <div className="overflow-hidden rounded-2xl border bg-muted p-4">
                  <img
                    src={resolveAssetUrl(editTarget.image)}
                    alt="Current"
                    className="h-40 w-full object-contain"
                  />
                </div>
              </div>
            )}

            {/* New logo preview */}
            {editPreviewUrl && (
              <div>
                <p className="text-sm font-medium mb-1.5">New Logo Preview</p>
                <div className="overflow-hidden rounded-2xl border bg-muted p-4">
                  <img
                    src={editPreviewUrl}
                    alt="Preview"
                    className="h-40 w-full object-contain"
                  />
                </div>
              </div>
            )}

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
                  category: editCategory,
                  image: editImage || undefined,
                });

                queryClient.invalidateQueries({ queryKey: TPA_QUERY_KEY });
                toast.success("Empanelled corporate item updated");
                setEditTarget(null);
                setEditImage(null);
                setEditPreviewUrl(null);
              }}
              className="w-full"
            >
              Save Changes
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
