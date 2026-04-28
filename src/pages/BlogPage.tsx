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
import { Plus, Pencil, Trash2, Search, Upload } from "lucide-react";

const BLOG_QUERY_KEY = ["blogs"];
const SERVICES_QUERY_KEY = ["services"];

export default function BlogsPage() {
  const queryClient = useQueryClient();

  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"add" | "edit">("add");
  const [selected, setSelected] = useState<BlogItem | null>(null);
  const [search, setSearch] = useState("");

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

  const filteredBlogs = useMemo(() => {
    if (!search.trim()) return blogs;
    const q = search.toLowerCase();
    return blogs.filter((b) =>
      [b.title, b.shortDescription]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q)),
    );
  }, [search, blogs]);

  const addMutation = useMutation({ mutationFn: addBlogApi });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: any) => updateBlogApi(id, payload),
  });

  const deleteMutation = useMutation({ mutationFn: deleteBlogApi });

  const API_ASSET_ORIGIN = BASE_URL.replace(/\/admin\/?$/, "");

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

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold">Blog Management</h1>
          <p className="text-sm text-muted-foreground">
            Manage blog content and SEO
          </p>
        </div>

        <Button onClick={openAdd}>
          <Plus className="mr-2 h-4 w-4" />
          Add Blog
        </Button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search blogs..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
        {isLoading ? (
          <p>Loading...</p>
        ) : (
          filteredBlogs.map((blog) => (
            <Card
              key={blog._id}
              className="overflow-hidden hover:shadow-md transition"
            >
              {blog.image ? (
                <img
                  src={resolveAssetUrl(blog.image)}
                  className="h-40 w-full object-cover"
                />
              ) : (
                <div className="h-40 bg-muted flex items-center justify-center text-sm text-muted-foreground">
                  No Image
                </div>
              )}

              <CardContent className="space-y-3 p-4">
                <div className="text-xs text-muted-foreground uppercase flex gap-2">
                  <span>{blog.status}</span>
                  {serviceById.get(blog.serviceId || "") && (
                    <span>{serviceById.get(blog.serviceId || "")}</span>
                  )}
                </div>

                <h3 className="font-semibold line-clamp-2">{blog.title}</h3>

                <p className="text-sm text-muted-foreground line-clamp-2">
                  {blog.shortDescription}
                </p>

                <div className="flex gap-2 pt-2">
                  <Button
                    size="icon"
                    variant="outline"
                    onClick={() => openEdit(blog)}
                  >
                    <Pencil size={16} />
                  </Button>

                  <Button
                    size="icon"
                    variant="destructive"
                    onClick={() => handleDelete(blog._id)}
                  >
                    <Trash2 size={16} />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-3xl overflow-y-auto max-h-[90vh]">
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
                      onValueChange={(v) =>
                        setForm({ ...form, serviceId: v })
                      }
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
                    onChange={(e) =>
                      handleImage(e.target.files?.[0] || null)
                    }
                  />
                </label>
              </CardContent>
            </Card>

            <Button onClick={handleSave} className="w-full">
              {mode === "edit" ? "Update Blog" : "Create Blog"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}