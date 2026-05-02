"use client";

import {
  addBlogApi,
  deleteBlogApi,
  getAllBlogsApi,
  updateBlogApi,
  type BlogItem,
} from "@/apiCalls/blog";
import { getAllServicesApi } from "@/apiCalls/services";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { BASE_URL } from "@/apis/endpoint";

import { DataTable, type Column } from "@/components/admin/DataTable";
import { PageHeader } from "@/components/admin/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";

import { toast } from "sonner";
import { Eye, Plus, Pencil, Trash2, Upload } from "lucide-react";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";

const BLOG_QUERY_KEY = ["blogs"];
const SERVICES_QUERY_KEY = ["services"];

export default function BlogsPage() {
  const queryClient = useQueryClient();

  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"add" | "edit">("add");
  const [selected, setSelected] = useState<BlogItem | null>(null);
  const [previewTarget, setPreviewTarget] = useState<BlogItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<BlogItem | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const [form, setForm] = useState({
    title: "",
    shortDescription: "",
    content: "",
    metaTitle: "",
    metaDescription: "",
    keywords: "",
    status: "published",
    serviceId: "",
    image: null as File | null,
  });

  const { data: blogs = [], isLoading } = useQuery({
    queryKey: BLOG_QUERY_KEY,
    queryFn: getAllBlogsApi,
  });

  const { data: services = [] } = useQuery({
    queryKey: SERVICES_QUERY_KEY,
    queryFn: getAllServicesApi,
  });

  const serviceById = useMemo(
    () => new Map(services.map((s) => [s._id, s.title])),
    [services],
  );

  const API_ASSET_ORIGIN = BASE_URL.replace(/\/admin\/?$/, "");

  const addMutation = useMutation({ mutationFn: addBlogApi });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: any) => updateBlogApi(id, payload),
  });

  const deleteMutation = useMutation({ mutationFn: deleteBlogApi });

  function resolveAssetUrl(path?: string) {
    if (!path) return "";
    if (/^https?:\/\//.test(path)) return path;
    return `${API_ASSET_ORIGIN}${path.startsWith("/") ? path : `/${path}`}`;
  }

  const openAdd = () => {
    setMode("add");
    setSelected(null);
    setImagePreview(null);
    setForm({
      title: "",
      shortDescription: "",
      content: "",
      metaTitle: "",
      metaDescription: "",
      keywords: "",
      status: "published",
      serviceId: "",
      image: null,
    });
    setOpen(true);
  };

  const openEdit = (blog: BlogItem) => {
    setMode("edit");
    setSelected(blog);

    setImagePreview(blog.image ? resolveAssetUrl(blog.image) : null);

    setForm({
      title: blog.title || "",
      shortDescription: blog.shortDescription || "",
      content: blog.content || "",
      metaTitle: blog.seo?.metaTitle || "",
      metaDescription: blog.seo?.metaDescription || "",
      keywords: blog.seo?.keywords?.join(", ") || "",
      status: blog.status || "published",
      serviceId: blog.serviceId || "",
      image: null,
    });

    setOpen(true);
  };

  const handleImage = (file: File | null) => {
    if (!file) return;
    setForm({ ...form, image: file });
    setImagePreview(URL.createObjectURL(file));
  };

  const handleSave = async () => {
    if (
      !form.title.trim() ||
      !form.shortDescription.trim() ||
      !form.content.trim()
    ) {
      toast.error("Title, description and content are required.");
      return;
    }

    if (!form.serviceId) {
      toast.error("Please select a service.");
      return;
    }

    if (mode === "add" && !form.image) {
      toast.error("Please upload image.");
      return;
    }

    const seo = {
      metaTitle: form.metaTitle,
      metaDescription: form.metaDescription,
      keywords: form.keywords
        .split(",")
        .map((k) => k.trim())
        .filter(Boolean),
    };

    const payload = {
      title: form.title,
      serviceId: form.serviceId,
      shortDescription: form.shortDescription,
      content: form.content,
      seo,
      status: form.status as "draft" | "published",
      image: form.image || undefined,
    };

    try {
      if (mode === "edit" && selected) {
        await updateMutation.mutateAsync({
          id: selected._id,
          payload,
        });
        toast.success("Blog updated");
      } else {
        await addMutation.mutateAsync(payload);
        toast.success("Blog created");
      }

      queryClient.invalidateQueries({ queryKey: BLOG_QUERY_KEY });
      setOpen(false);
    } catch {
      toast.error("Something went wrong");
    }
  };

  const handleDelete = async (id: string) => {
    await deleteMutation.mutateAsync(id);
    queryClient.invalidateQueries({ queryKey: BLOG_QUERY_KEY });
    toast.success("Deleted");
  };

  const columns: Column<BlogItem>[] = [
    {
      key: "title",
      header: "Blog",
      render: (blog) => (
        <div className="flex items-center gap-3 min-w-0">
          <div className="h-10 w-12 overflow-hidden rounded-lg border border-slate-100 bg-slate-50 shrink-0">
            {blog.image ? (
              <img
                src={resolveAssetUrl(blog.image)}
                alt={blog.title || "Blog"}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="h-full w-full bg-slate-100" />
            )}
          </div>
          <div className="min-w-0">
            <p className="font-medium text-[#1E293B] truncate">
              {blog.title || "Untitled"}
            </p>
            <p className="text-xs text-slate-500 truncate">
              {(() => {
                const desc = blog.shortDescription ?? "";
                return desc.length > 80
                  ? desc.slice(0, 80) + "..."
                  : desc || "No description";
              })()}
            </p>
          </div>
        </div>
      ),
    },
    {
      key: "serviceId",
      header: "Service",
      render: (blog) => (
        <span className="text-slate-600">
          {serviceById.get(blog.serviceId || "") || "—"}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (blog) => (
        <span
          className={
            blog.status === "draft"
              ? "inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700"
              : "inline-flex rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700"
          }
        >
          {blog.status || "published"}
        </span>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      className: "text-right",
      render: (blog) => (
        <div className="flex items-center justify-end gap-2">
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="rounded-lg border-slate-200"
            onClick={() => setPreviewTarget(blog)}
          >
            <Eye size={14} />
            Preview
          </Button>
          <Button
            size="icon"
            variant="outline"
            className="rounded-lg"
            onClick={() => openEdit(blog)}
          >
            <Pencil size={16} />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            onClick={() => setDeleteTarget(blog)}
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
        title="Blog Management"
        description="Manage blog content, SEO, and preview posts."
        action={
          <Button onClick={openAdd} className="rounded-xl gap-2 bg-[#D89F00]">
            <Plus className="h-4 w-4" />
            Add Blog
          </Button>
        }
      />

      <DataTable<BlogItem>
        columns={columns}
        data={blogs}
        isLoading={isLoading}
        searchable
        searchKeys={
          ["title", "shortDescription", "status"] as (keyof BlogItem)[]
        }
        emptyText="No blogs found."
        rowKey={(row) => row._id}
        data-ocid="blogs.table"
      />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-3xl overflow-y-auto !max-w-[50vw] max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>
              {mode === "edit" ? "Edit Blog" : "Create Blog"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-8">
            <Card>
              <CardContent className="p-6 space-y-4">
                <h3 className="font-semibold">Basic Info</h3>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Title</Label>
                    <Input
                      value={form.title}
                      onChange={(e) =>
                        setForm({ ...form, title: e.target.value })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Service</Label>
                    <Select
                      value={form.serviceId}
                      onValueChange={(v) => setForm({ ...form, serviceId: v })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select Service" />
                      </SelectTrigger>
                      <SelectContent>
                        {services.map((s) => (
                          <SelectItem key={s._id} value={s._id}>
                            {s.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Status</Label>
                    <Select
                      value={form.status}
                      onValueChange={(v) =>
                        setForm({
                          ...form,
                          status: v as "draft" | "published",
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="published">Published</SelectItem>
                        <SelectItem value="draft">Draft</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6 space-y-4">
                <h3 className="font-semibold">Content</h3>

                <Textarea
                  placeholder="Short Description"
                  value={form.shortDescription}
                  onChange={(e) =>
                    setForm({ ...form, shortDescription: e.target.value })
                  }
                />

                <Textarea
                  placeholder="Blog Content"
                  rows={8}
                  value={form.content}
                  onChange={(e) =>
                    setForm({ ...form, content: e.target.value })
                  }
                />
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6 space-y-4">
                <h3 className="font-semibold">SEO</h3>

                <Input
                  placeholder="Meta Title"
                  value={form.metaTitle}
                  onChange={(e) =>
                    setForm({ ...form, metaTitle: e.target.value })
                  }
                />

                <Textarea
                  placeholder="Meta Description"
                  value={form.metaDescription}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      metaDescription: e.target.value,
                    })
                  }
                />

                <Input
                  placeholder="Keywords (comma separated)"
                  value={form.keywords}
                  onChange={(e) =>
                    setForm({ ...form, keywords: e.target.value })
                  }
                />
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6 space-y-4">
                <h3 className="font-semibold">Featured Image</h3>

                {imagePreview && (
                  <img
                    src={imagePreview}
                    className="w-full h-48 object-cover rounded-lg"
                  />
                )}

                <label className="flex items-center gap-2 border rounded-md px-4 py-3 cursor-pointer hover:bg-muted">
                  <Upload size={16} />
                  <span className="text-sm">Upload Image</span>
                  <input
                    type="file"
                    accept="image/*"
                    hidden
                    onChange={(e) => handleImage(e.target.files?.[0] || null)}
                  />
                </label>
              </CardContent>
            </Card>

            <Button onClick={handleSave} className="w-full bg-[#D89F00]">
              {mode === "edit" ? "Update Blog" : "Create Blog"}
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
            <DialogTitle>Blog Preview</DialogTitle>
          </DialogHeader>

          {previewTarget && (
            <div className="space-y-5">
              {previewTarget.image ? (
                <div className="overflow-hidden rounded-2xl border bg-slate-50">
                  <img
                    src={resolveAssetUrl(previewTarget.image)}
                    alt={previewTarget.title || "Blog"}
                    className="h-56 w-full object-cover"
                  />
                </div>
              ) : null}

              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  {serviceById.get(previewTarget.serviceId || "") ||
                    "No service"}{" "}
                  · {previewTarget.status || "published"}
                </p>
                <h2 className="text-xl font-semibold text-slate-900">
                  {previewTarget.title || "Untitled"}
                </h2>
                <p className="text-sm text-slate-600 whitespace-pre-wrap">
                  {previewTarget.shortDescription || ""}
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <p className="text-sm font-semibold text-slate-900">Content</p>
                <p className="mt-2 text-sm leading-7 text-slate-700 whitespace-pre-wrap">
                  {previewTarget.content || "—"}
                </p>
              </div>
            </div>
          )}
        </DialogContent>
        <ConfirmDialog
          open={!!deleteTarget}
          title="Delete this blog?"
          message="This blog will be permanently removed."
          confirmLabel="Delete Blog"
          onConfirm={() => {
            if (deleteTarget) {
              handleDelete(deleteTarget._id);
              setDeleteTarget(null);
            }
          }}
          onCancel={() => setDeleteTarget(null)}
        />
      </Dialog>
    </div>
  );
}
