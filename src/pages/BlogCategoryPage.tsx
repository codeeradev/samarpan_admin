"use client";

import {
  type BlogCategoryItem,
  type BlogCategoryPayload,
  addBlogCategoryApi,
  deleteBlogCategoryApi,
  getAllBlogCategoriesApi,
  updateBlogCategoryApi,
} from "@/apiCalls/blog";
import { BASE_URL } from "@/apis/endpoint";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { type Column, DataTable } from "@/components/admin/DataTable";
import { PageHeader } from "@/components/admin/PageHeader";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getApiErrorMessage, mapApiErrorsToFields } from "@/lib/api-errors";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Pencil, Plus, Trash2, Upload } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

const BLOG_CATEGORIES_QUERY_KEY = ["blog-categories"];

type CategoryFormState = {
  title: string;
  sortOrder: string;
  isActive: boolean;
  image: File | null;
};

type CategoryFormErrors = Partial<Record<"title" | "sortOrder", string>>;

const EMPTY_CATEGORY_FORM: CategoryFormState = {
  title: "",
  sortOrder: "0",
  isActive: true,
  image: null,
};

export default function BlogCategoryPage() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"add" | "edit">("add");
  const [selected, setSelected] = useState<BlogCategoryItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<BlogCategoryItem | null>(
    null,
  );
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [form, setForm] = useState<CategoryFormState>(EMPTY_CATEGORY_FORM);
  const [formErrors, setFormErrors] = useState<CategoryFormErrors>({});

  const { data: categories = [], isLoading } = useQuery({
    queryKey: BLOG_CATEGORIES_QUERY_KEY,
    queryFn: getAllBlogCategoriesApi,
  });

  const addMutation = useMutation({ mutationFn: addBlogCategoryApi });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: any) => updateBlogCategoryApi(id, payload),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteBlogCategoryApi,
  });

  const API_ASSET_ORIGIN = BASE_URL.replace(/\/admin\/?$/, "");

  function resolveAssetUrl(path?: string) {
    if (!path) return "";
    if (/^https?:\/\//.test(path)) return path;
    return `${API_ASSET_ORIGIN}${path.startsWith("/") ? path : `/${path}`}`;
  }

  function setField<K extends keyof CategoryFormState>(
    key: K,
    value: CategoryFormState[K],
  ) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setFormErrors((prev) => ({
      ...prev,
      [key as keyof CategoryFormErrors]: undefined,
    }));
  }

  const openAdd = () => {
    setMode("add");
    setSelected(null);
    setForm(EMPTY_CATEGORY_FORM);
    setFormErrors({});
    setImagePreview(null);
    setOpen(true);
  };

  const openEdit = (category: BlogCategoryItem) => {
    setMode("edit");
    setSelected(category);
    setForm({
      title: category.title || "",
      sortOrder: String(category.sortOrder ?? 0),
      isActive: category.isActive ?? true,
      image: null,
    });
    setFormErrors({});
    setImagePreview(category.image ? resolveAssetUrl(category.image) : null);
    setOpen(true);
  };

  const handleImage = (file: File | null) => {
    if (!file) return;
    setField("image", file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleSave = async () => {
    const errors: CategoryFormErrors = {};
    const sortOrder = Number(form.sortOrder || 0);

    if (!form.title.trim()) {
      errors.title = "Title is required.";
    }

    if (Number.isNaN(sortOrder)) {
      errors.sortOrder = "Sort order must be a number.";
    }

    if (mode === "add" && !form.image) {
      toast.error("Image is required.");
      return;
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      toast.error(
        Object.values(errors)[0] ?? "Please correct the highlighted fields.",
      );
      return;
    }

    const payload: BlogCategoryPayload = {
      title: form.title,
      sortOrder,
      isActive: form.isActive,
      image: form.image || undefined,
    };

    try {
      if (mode === "edit" && selected) {
        await updateMutation.mutateAsync({
          id: selected._id,
          payload,
        });
        toast.success("Blog category updated");
      } else {
        await addMutation.mutateAsync(payload);
        toast.success("Blog category created");
      }

      queryClient.invalidateQueries({ queryKey: BLOG_CATEGORIES_QUERY_KEY });
      setOpen(false);
    } catch (error: any) {
      const backendErrors = mapApiErrorsToFields<keyof CategoryFormErrors>(
        error,
        {
          title: /title/i,
          sortOrder: /sort/i,
        },
      );

      if (Object.keys(backendErrors).length > 0) {
        setFormErrors((prev) => ({ ...prev, ...backendErrors }));
      }

      toast.error(getApiErrorMessage(error, "Failed to save blog category."));
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteMutation.mutateAsync(id);
      queryClient.invalidateQueries({ queryKey: BLOG_CATEGORIES_QUERY_KEY });
      toast.success("Blog category deleted");
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Failed to delete blog category."));
    }
  };

  const columns: Column<BlogCategoryItem>[] = [
    {
      key: "title",
      header: "Category",
      render: (category) => (
        <div className="flex items-center gap-3 min-w-0">
          <div className="h-10 w-12 overflow-hidden rounded-lg border border-border bg-muted/60 shrink-0">
            {category.image ? (
              <img
                src={resolveAssetUrl(category.image)}
                alt={category.title || "Blog category"}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="h-full w-full bg-muted" />
            )}
          </div>
          <p className="font-medium text-foreground truncate">
            {category.title || "Untitled"}
          </p>
        </div>
      ),
    },
    {
      key: "sortOrder",
      header: "Sort",
      render: (category) => (
        <span className="text-muted-foreground">{category.sortOrder ?? 0}</span>
      ),
    },
    {
      key: "isActive",
      header: "Status",
      render: (category) => (
        <span
          className={
            category.isActive === false
              ? "inline-flex rounded-full bg-muted px-2.5 py-1 text-xs font-semibold text-foreground"
              : "inline-flex rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary"
          }
        >
          {category.isActive === false ? "Inactive" : "Active"}
        </span>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      className: "text-right",
      render: (category) => (
        <div className="flex items-center justify-end gap-2">
          <Button
            size="icon"
            variant="outline"
            className="rounded-lg"
            onClick={() => openEdit(category)}
          >
            <Pencil size={16} />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            onClick={() => setDeleteTarget(category)}
          >
            <Trash2 size={16} />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-8">
      <PageHeader
        title="Blog Category"
        description="Manage blog categories and display order."
        action={
          <Button onClick={openAdd} className="rounded-xl gap-2 bg-primary">
            <Plus className="h-4 w-4" />
            Add Category
          </Button>
        }
      />

      <DataTable<BlogCategoryItem>
        columns={columns}
        data={categories}
        isLoading={isLoading}
        searchable
        searchKeys={["title"] as (keyof BlogCategoryItem)[]}
        emptyText="No blog categories found."
        rowKey={(row) => row._id}
        data-ocid="blog_categories.table"
      />

      <Dialog
        open={open}
        onOpenChange={(nextOpen) => {
          setOpen(nextOpen);
          if (!nextOpen) {
            setFormErrors({});
          }
        }}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto rounded-3xl sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>
              {mode === "edit" ? "Edit Blog Category" : "Create Blog Category"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <Label>
                  Title <span className="text-destructive">*</span>
                </Label>
                <Input
                  value={form.title}
                  onChange={(e) => setField("title", e.target.value)}
                  className={
                    formErrors.title
                      ? "border-destructive focus-visible:ring-destructive"
                      : undefined
                  }
                />
                {formErrors.title ? (
                  <p className="text-xs text-destructive">{formErrors.title}</p>
                ) : null}
              </div>

              <div className="space-y-2">
                <Label>Sort Order</Label>
                <Input
                  type="number"
                  value={form.sortOrder}
                  onChange={(e) => setField("sortOrder", e.target.value)}
                  className={
                    formErrors.sortOrder
                      ? "border-destructive focus-visible:ring-destructive"
                      : undefined
                  }
                />
                {formErrors.sortOrder ? (
                  <p className="text-xs text-destructive">
                    {formErrors.sortOrder}
                  </p>
                ) : null}
              </div>

              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={form.isActive ? "active" : "inactive"}
                  onValueChange={(value) =>
                    setField("isActive", value === "active")
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-3">
              <Label>Category Image</Label>
              {imagePreview ? (
                <img
                  src={imagePreview}
                  alt="Blog category preview"
                  className="h-36 w-full rounded-lg object-cover"
                />
              ) : null}

              <label className="flex cursor-pointer items-center gap-2 rounded-md border px-4 py-3 hover:bg-muted">
                <Upload size={16} />
                <span className="text-sm">Upload Image</span>
                <input
                  type="file"
                  accept="image/*"
                  hidden
                  onChange={(e) => handleImage(e.target.files?.[0] || null)}
                />
              </label>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              className="bg-primary"
              disabled={addMutation.isPending || updateMutation.isPending}
            >
              {mode === "edit" ? "Update Category" : "Create Category"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete this blog category?"
        message="This category will be permanently removed."
        confirmLabel="Delete Category"
        onConfirm={() => {
          if (deleteTarget) {
            handleDelete(deleteTarget._id);
            setDeleteTarget(null);
          }
        }}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
