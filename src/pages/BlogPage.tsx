"use client";

import {
  type BlogCategoryItem,
  type BlogItem,
  addBlogApi,
  deleteBlogApi,
  getAllBlogCategoriesApi,
  getAllBlogsApi,
  updateBlogApi,
} from "@/apiCalls/blog";
import { getAllServicesApi } from "@/apiCalls/services";

import { BASE_URL } from "@/apis/endpoint";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";

import { type Column, DataTable } from "@/components/admin/DataTable";
import { PageHeader } from "@/components/admin/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { getApiErrorMessage, mapApiErrorsToFields } from "@/lib/api-errors";
import DOMPurify from "dompurify";

import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import PageEditor from "@/components/editor/pageEditor";
import { Eye, Pencil, Plus, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";

const BLOG_QUERY_KEY = ["blogs"];
const BLOG_CATEGORIES_QUERY_KEY = ["blog-categories"];
const SERVICES_QUERY_KEY = ["services"];

type BlogFormState = {
  title: string;
  shortDescription: string;
  content: string;
  metaTitle: string;
  metaDescription: string;
  keywords: string;
  status: "draft" | "published";
  serviceId: string;
  blogCategoryId: string;
  image: File | null;
};

type BlogFormErrors = Partial<
  Record<
    | "title"
    | "serviceId"
    | "blogCategoryId"
    | "shortDescription"
    | "content"
    | "metaTitle"
    | "metaDescription"
    | "image",
    string
  >
>;

const EMPTY_FORM: BlogFormState = {
  title: "",
  shortDescription: "",
  content: "",
  metaTitle: "",
  metaDescription: "",
  keywords: "",
  status: "published",
  serviceId: "",
  blogCategoryId: "",
  image: null,
};

function validateBlogForm(
  form: BlogFormState,
  mode: "add" | "edit",
): BlogFormErrors {
  const errors: BlogFormErrors = {};

  if (!form.title.trim()) {
    errors.title = "Title is required.";
  }

  if (!form.serviceId) {
    errors.serviceId = "Please select a service.";
  }

  if (!form.blogCategoryId) {
    errors.blogCategoryId = "Please select a blog category.";
  }

  if (!form.shortDescription.trim()) {
    errors.shortDescription = "Short description is required.";
  } else if (form.shortDescription.trim().length > 300) {
    errors.shortDescription = "Short description cannot exceed 300 characters.";
  }

  if (!form.content) {
    errors.content = "Content is required.";
  }

  if (form.metaTitle.trim().length > 60) {
    errors.metaTitle = "Meta title should stay within 60 characters.";
  }

  if (form.metaDescription.trim().length > 160) {
    errors.metaDescription =
      "Meta description should stay within 160 characters.";
  }

  if (mode === "add" && !form.image) {
    errors.image = "Featured image is required.";
  }

  return errors;
}

export default function BlogsPage() {
  const queryClient = useQueryClient();

  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"add" | "edit">("add");
  const [selected, setSelected] = useState<BlogItem | null>(null);
  const [previewTarget, setPreviewTarget] = useState<BlogItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<BlogItem | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [form, setForm] = useState<BlogFormState>(EMPTY_FORM);
  const [formErrors, setFormErrors] = useState<BlogFormErrors>({});

  const { data: blogs = [], isLoading } = useQuery({
    queryKey: BLOG_QUERY_KEY,
    queryFn: getAllBlogsApi,
  });

  const { data: categories = [] } = useQuery({
    queryKey: BLOG_CATEGORIES_QUERY_KEY,
    queryFn: getAllBlogCategoriesApi,
  });

  const { data: services = [] } = useQuery({
    queryKey: SERVICES_QUERY_KEY,
    queryFn: getAllServicesApi,
  });

  const serviceById = useMemo(
    () => new Map(services.map((s) => [s._id, s.title])),
    [services],
  );

  const categoryById = useMemo(
    () => new Map(categories.map((category) => [category._id, category.title])),
    [categories],
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

  function getBlogCategoryId(blog: BlogItem) {
    const category = blog.blogCategoryId;
    return typeof category === "string" ? category : category?._id || "";
  }

  function getBlogCategoryTitle(blog: BlogItem) {
    const category = blog.blogCategoryId;
    if (typeof category === "object" && category?.title) return category.title;
    return categoryById.get(getBlogCategoryId(blog)) || "—";
  }

  const openAdd = () => {
    setMode("add");
    setSelected(null);
    setImagePreview(null);
    setForm(EMPTY_FORM);
    setFormErrors({});
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
      blogCategoryId: getBlogCategoryId(blog),
      image: null,
    });
    setFormErrors({});

    setOpen(true);
  };

  const handleImage = (file: File | null) => {
    if (!file) return;
    setField("image", file);
    setImagePreview(URL.createObjectURL(file));
  };

  function setField<K extends keyof BlogFormState>(
    key: K,
    value: BlogFormState[K],
  ) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setFormErrors((prev) => ({
      ...prev,
      [key as keyof BlogFormErrors]: undefined,
    }));
  }

  const handleSave = async () => {
    const errors = validateBlogForm(form, mode);

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      toast.error(
        Object.values(errors)[0] ?? "Please correct the highlighted fields.",
      );
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
      blogCategoryId: form.blogCategoryId,
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
    } catch (error: any) {
      const backendErrors = mapApiErrorsToFields<keyof BlogFormErrors>(error, {
        title: /title/i,
        serviceId: /service/i,
        blogCategoryId: /category/i,
        shortDescription: /short description/i,
        content: /content/i,
        metaTitle: /meta title/i,
        metaDescription: /meta description/i,
        image: /\bimage\b/i,
      });

      if (Object.keys(backendErrors).length > 0) {
        setFormErrors((prev) => ({ ...prev, ...backendErrors }));
      }

      toast.error(getApiErrorMessage(error, "Failed to save blog."));
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteMutation.mutateAsync(id);
      queryClient.invalidateQueries({ queryKey: BLOG_QUERY_KEY });
      toast.success("Deleted");
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Failed to delete blog."));
    }
  };

  const columns: Column<BlogItem>[] = [
    {
      key: "title",
      header: "Blog",
      render: (blog) => (
        <div className="flex items-center gap-3 min-w-0">
          <div className="h-10 w-12 overflow-hidden rounded-lg border border-border bg-muted/60 shrink-0">
            {blog.image ? (
              <img
                src={resolveAssetUrl(blog.image)}
                alt={blog.title || "Blog"}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="h-full w-full bg-muted" />
            )}
          </div>
          <div className="min-w-0">
            <p className="font-medium text-foreground truncate">
              {blog.title || "Untitled"}
            </p>
            <p className="text-xs text-muted-foreground truncate">
              {(() => {
                const desc = blog.shortDescription ?? "";
                return desc.length > 80
                  ? `${desc.slice(0, 80)}...`
                  : desc || "No description";
              })()}
            </p>
          </div>
        </div>
      ),
    },
    {
      key: "blogCategoryId",
      header: "Category",
      render: (blog) => (
        <span className="text-muted-foreground">
          {getBlogCategoryTitle(blog)}
        </span>
      ),
    },
    {
      key: "serviceId",
      header: "Service",
      render: (blog) => (
        <span className="text-muted-foreground">
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
              ? "inline-flex rounded-full bg-muted px-2.5 py-1 text-xs font-semibold text-foreground"
              : "inline-flex rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary"
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
            className="rounded-lg border-border"
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
        title="Blog List"
        description="Manage blog content, SEO, and preview posts."
        action={
          <Button onClick={openAdd} className="rounded-xl gap-2 bg-primary">
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

      <Dialog
        open={open}
        onOpenChange={(nextOpen) => {
          setOpen(nextOpen);
          if (!nextOpen) {
            setFormErrors({});
          }
        }}
      >
        <DialogContent className="max-w-3xl rounded-3xl overflow-y-auto !max-w-[50vw] max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>
              {mode === "edit" ? "Edit Blog" : "Create Blog"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-8">
            <Tabs defaultValue="basic" className="w-full">
              <TabsList className="w-full mb-2">
                <TabsTrigger value="basic" className="flex-1">
                  Basic Info
                </TabsTrigger>
                <TabsTrigger value="content" className="flex-1">
                  Content
                </TabsTrigger>
                <TabsTrigger value="seo" className="flex-1">
                  SEO
                </TabsTrigger>
                <TabsTrigger value="image" className="flex-1">
                  Image
                </TabsTrigger>
              </TabsList>

              <TabsContent value="basic" className="mt-0">
            <Card>
              <CardContent className="p-6 space-y-4">
                <h3 className="font-semibold">Basic Info</h3>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
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
                      <p className="text-xs text-destructive">
                        {formErrors.title}
                      </p>
                    ) : null}
                  </div>

                  <div className="space-y-2">
                    <Label>
                      Service <span className="text-destructive">*</span>
                    </Label>
                    <Select
                      value={form.serviceId}
                      onValueChange={(v) => setField("serviceId", v)}
                    >
                      <SelectTrigger
                        className={
                          formErrors.serviceId
                            ? "border-destructive focus-visible:ring-destructive"
                            : undefined
                        }
                      >
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
                    {formErrors.serviceId ? (
                      <p className="text-xs text-destructive">
                        {formErrors.serviceId}
                      </p>
                    ) : null}
                  </div>

                  <div className="space-y-2">
                    <Label>
                      Blog Category <span className="text-destructive">*</span>
                    </Label>
                    <Select
                      value={form.blogCategoryId}
                      onValueChange={(v) => setField("blogCategoryId", v)}
                    >
                      <SelectTrigger
                        className={
                          formErrors.blogCategoryId
                            ? "border-destructive focus-visible:ring-destructive"
                            : undefined
                        }
                      >
                        <SelectValue placeholder="Select Blog Category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories
                          .filter((category) => category.isActive !== false)
                          .map((category) => (
                            <SelectItem key={category._id} value={category._id}>
                              {category.title}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                    {formErrors.blogCategoryId ? (
                      <p className="text-xs text-destructive">
                        {formErrors.blogCategoryId}
                      </p>
                    ) : null}
                  </div>

                  <div className="space-y-2">
                    <Label>Status</Label>
                    <Select
                      value={form.status}
                      onValueChange={(v) =>
                        setField("status", v as "draft" | "published")
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
              </TabsContent>

              <TabsContent value="content" className="mt-0">
            <Card>
              <CardContent className="p-6 space-y-4">
                <h3 className="font-semibold">Content</h3>

                <div className="space-y-2">
                  <Textarea
                    placeholder="Short Description"
                    value={form.shortDescription}
                    onChange={(e) =>
                      setField("shortDescription", e.target.value)
                    }
                    maxLength={300}
                    className={
                      formErrors.shortDescription
                        ? "border-destructive focus-visible:ring-destructive"
                        : undefined
                    }
                  />
                  <div className="flex items-center justify-between gap-3 text-xs">
                    {formErrors.shortDescription ? (
                      <p className="text-destructive">
                        {formErrors.shortDescription}
                      </p>
                    ) : (
                      <p className="text-muted-foreground">
                        Keep this concise for blog cards and listings.
                      </p>
                    )}
                    <span className="text-muted-foreground">
                      {form.shortDescription.length}/300
                    </span>
                  </div>
                </div>

                <PageEditor
                  value={form.content}
                  onChange={(val) => setField("content", val)}
                  // className={formErrors.content ? "border-destructive focus-visible:ring-destructive" : undefined}
                />
                {formErrors.content ? (
                  <p className="text-xs text-destructive">
                    {formErrors.content}
                  </p>
                ) : null}
              </CardContent>
            </Card>
              </TabsContent>

              <TabsContent value="seo" className="mt-0">
            <Card>
              <CardContent className="p-6 space-y-4">
                <h3 className="font-semibold">SEO</h3>

                <Input
                  placeholder="Meta Title"
                  value={form.metaTitle}
                  onChange={(e) => setField("metaTitle", e.target.value)}
                  maxLength={60}
                  className={
                    formErrors.metaTitle
                      ? "border-destructive focus-visible:ring-destructive"
                      : undefined
                  }
                />
                <div className="flex items-center justify-between gap-3 text-xs">
                  {formErrors.metaTitle ? (
                    <p className="text-destructive">{formErrors.metaTitle}</p>
                  ) : (
                    <p className="text-muted-foreground">
                      Search engines usually show about 60 characters.
                    </p>
                  )}
                  <span className="text-muted-foreground">
                    {form.metaTitle.length}/60
                  </span>
                </div>

                <Textarea
                  placeholder="Meta Description"
                  value={form.metaDescription}
                  onChange={(e) => setField("metaDescription", e.target.value)}
                  maxLength={160}
                  className={
                    formErrors.metaDescription
                      ? "border-destructive focus-visible:ring-destructive"
                      : undefined
                  }
                />
                <div className="flex items-center justify-between gap-3 text-xs">
                  {formErrors.metaDescription ? (
                    <p className="text-destructive">
                      {formErrors.metaDescription}
                    </p>
                  ) : (
                    <p className="text-muted-foreground">
                      Search snippets usually fit within 160 characters.
                    </p>
                  )}
                  <span className="text-muted-foreground">
                    {form.metaDescription.length}/160
                  </span>
                </div>

                <Input
                  placeholder="Keywords (comma separated)"
                  value={form.keywords}
                  onChange={(e) => setField("keywords", e.target.value)}
                />
              </CardContent>
            </Card>
              </TabsContent>

              <TabsContent value="image" className="mt-0">
            <Card>
              <CardContent className="p-6 space-y-4">
                <h3 className="font-semibold">Featured Image</h3>

                {imagePreview && (
                  <img
                    src={imagePreview}
                    alt="Blog preview"
                    className="w-full h-48 object-cover rounded-lg"
                  />
                )}

                <label className="flex items-center gap-2 border rounded-md px-4 py-3 cursor-pointer hover:bg-muted">
                  <Upload size={16} />
                  <span className="text-sm">Upload Image (1215 × 576)</span>
                  <input
                    type="file"
                    accept="image/*"
                    hidden
                    onChange={(e) => handleImage(e.target.files?.[0] || null)}
                  />
                </label>
                {formErrors.image ? (
                  <p className="text-xs text-destructive">{formErrors.image}</p>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    Upload a featured image for new blog posts.
                  </p>
                )}
              </CardContent>
            </Card>
              </TabsContent>
            </Tabs>

            <Button onClick={handleSave} className="w-full bg-primary">
              {mode === "edit" ? "Update Blog" : "Create Blog"}
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
            <DialogTitle>Blog Preview</DialogTitle>
          </DialogHeader>

          {previewTarget && (
            <div className="space-y-5">
              {previewTarget.image ? (
                <div className="overflow-hidden rounded-2xl border bg-muted/60">
                  <img
                    src={resolveAssetUrl(previewTarget.image)}
                    alt={previewTarget.title || "Blog"}
                    className="h-56 w-full object-cover"
                  />
                </div>
              ) : null}

              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {getBlogCategoryTitle(previewTarget)} ·{" "}
                  {serviceById.get(previewTarget.serviceId || "") ||
                    "No service"}{" "}
                  · {previewTarget.status || "published"}
                </p>
                <h2 className="text-xl font-semibold text-foreground">
                  {previewTarget.title || "Untitled"}
                </h2>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {previewTarget.shortDescription || ""}
                </p>
              </div>

              <div className="rounded-2xl border border-border bg-card p-4">
                <p className="text-sm font-semibold text-foreground">Content</p>
                <div
                  // biome-ignore lint/security/noDangerouslySetInnerHtml: Blog preview renders sanitized CMS HTML.
                  dangerouslySetInnerHTML={{
                    __html: DOMPurify.sanitize(previewTarget.content || ""),
                  }}
                />
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

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

    </div>
  );
}
