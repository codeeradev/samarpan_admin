import {
  type PageItem,
  type PagePayload,
  type PageStatus,
  addPageApi,
  deletePageApi,
  getAllPagesApi,
  updatePageApi,
} from "@/apiCalls/pages";
import { PageHeader } from "@/components/admin/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { Textarea } from "@/components/ui/textarea";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Eye, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import DataTable, { type TableColumn } from "react-data-table-component";
import { toast } from "sonner";

import PageEditor from "@/components/editor/pageEditor";

import "./pages-editor.css";

const emptyPageForm: PagePayload = {
  title: "",
  slug: "",
  content: "",
  status: "published",
  metaTitle: "",
  metaDescription: "",
};

const pageTableStyles = {
  table: {
    style: {
      backgroundColor: "transparent",
    },
  },
  headRow: {
    style: {
      minHeight: "54px",
      backgroundColor: "#F8FAFC",
      borderBottomWidth: "1px",
      borderBottomColor: "#E2E8F0",
    },
  },
  headCells: {
    style: {
      color: "#64748B",
      fontSize: "12px",
      fontWeight: 700,
      textTransform: "uppercase" as const,
      letterSpacing: "0.04em",
      paddingLeft: "16px",
      paddingRight: "16px",
    },
  },
  rows: {
    style: {
      minHeight: "72px",
      borderBottomWidth: "1px",
      borderBottomColor: "#F1F5F9",
      backgroundColor: "#FFFFFF",
    },
  },
  cells: {
    style: {
      paddingLeft: "16px",
      paddingRight: "16px",
      color: "#1E293B",
      fontSize: "14px",
    },
  },
  pagination: {
    style: {
      borderTopWidth: "1px",
      borderTopColor: "#E2E8F0",
      minHeight: "60px",
      color: "#475569",
      backgroundColor: "#FFFFFF",
    },
  },
};

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

function formatPageDate(value?: string) {
  if (!value) {
    return "—";
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return "—";
  }

  return parsed.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function StatusBadge({ status }: { status: PageStatus }) {
  const isPublished = status === "published";

  return (
    <Badge
      className={
        isPublished
          ? "bg-emerald-50 text-emerald-700"
          : "bg-amber-50 text-amber-700"
      }
    >
      {isPublished ? "Published" : "Draft"}
    </Badge>
  );
}

export default function PagesPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [formData, setFormData] = useState<PagePayload>(emptyPageForm);
  const [modalOpen, setModalOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewPage, setPreviewPage] = useState<PageItem | null>(null);
  const [editTarget, setEditTarget] = useState<PageItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<PageItem | null>(null);

  const { data = [], isLoading } = useQuery({
    queryKey: ["pages"],
    queryFn: getAllPagesApi,
  });

  const addMutation = useMutation({
    mutationFn: addPageApi,
    onSuccess: () => {
      toast.success("Page added successfully.");
      queryClient.invalidateQueries({ queryKey: ["pages"] });
      setModalOpen(false);
      setFormData(emptyPageForm);
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: PagePayload }) =>
      updatePageApi(id, payload),
    onSuccess: () => {
      toast.success("Page updated successfully.");
      queryClient.invalidateQueries({ queryKey: ["pages"] });
      setModalOpen(false);
      setFormData(emptyPageForm);
      setEditTarget(null);
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const deleteMutation = useMutation({
    mutationFn: deletePageApi,
    onSuccess: () => {
      toast.success("Page deleted successfully.");
      queryClient.invalidateQueries({ queryKey: ["pages"] });
      setDeleteTarget(null);
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const filteredPages = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) {
      return data;
    }

    return data.filter((page) =>
      [
        page.title,
        page.slug,
        page.content,
        page.seo.metaTitle,
        page.seo.metaDescription,
        page.status,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query)),
    );
  }, [data, search]);

  function openAdd() {
    setEditTarget(null);
    setFormData(emptyPageForm);
    setModalOpen(true);
  }

  function openEdit(page: PageItem) {
    setEditTarget(page);
    setFormData({
      title: page.title,
      slug: page.slug,
      content: page.content,
      status: page.status,
      metaTitle: page.seo.metaTitle,
      metaDescription: page.seo.metaDescription,
    });
    setModalOpen(true);
  }

  function openPreview(page: PageItem) {
    setPreviewPage(page);
    setPreviewOpen(true);
  }

  function handleDelete() {
    if (!deleteTarget?._id) {
      return;
    }

    deleteMutation.mutate(deleteTarget._id);
  }

  function handleSave() {
    if (!formData.title.trim()) {
      toast.error("Title is required.");
      return;
    }

    const payload: PagePayload = {
      title: formData.title.trim(),
      slug: formData.slug.trim()
        ? slugify(formData.slug)
        : slugify(formData.title),
      content: formData.content,
      status: formData.status,
      metaTitle: formData.metaTitle.trim(),
      metaDescription: formData.metaDescription.trim(),
    };

    if (!payload.slug) {
      toast.error("Slug is required.");
      return;
    }

    if (editTarget) {
      updateMutation.mutate({ id: editTarget._id, payload });
      return;
    }

    addMutation.mutate(payload);
  }

  const columns: TableColumn<PageItem>[] = [
    {
      name: "Page",
      grow: 1.4,
      cell: (page) => (
        <div className="min-w-0 py-3">
          <p className="truncate text-sm font-semibold text-slate-900">
            {page.title}
          </p>
          <p className="truncate text-xs text-slate-500">/{page.slug}</p>
        </div>
      ),
    },
    {
      name: "Status",
      width: "150px",
      cell: (page) => <StatusBadge status={page.status} />,
    },
    {
      name: "SEO",
      grow: 1.4,
      cell: (page) => (
        <div className="min-w-0 py-3">
          <p className="truncate text-sm text-slate-800">
            {page.seo.metaTitle || "No meta title"}
          </p>
          <p className="line-clamp-2 text-xs text-slate-500">
            {page.seo.metaDescription || "No meta description"}
          </p>
        </div>
      ),
    },
    {
      name: "Updated",
      width: "150px",
      cell: (page) => (
        <span className="text-sm text-slate-600">
          {formatPageDate(page.updatedAt ?? page.createdAt)}
        </span>
      ),
    },
    {
      name: "Actions",
      right: true,
      width: "200px",
      cell: (page) => (
        <div className="flex items-center justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="rounded-xl border-slate-200"
            onClick={() => openPreview(page)}
          >
            <Eye size={14} />
            Preview
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="rounded-xl text-slate-500 hover:bg-amber-50 hover:text-amber-700"
            onClick={() => openEdit(page)}
          >
            <Pencil size={15} />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="rounded-xl text-slate-500 hover:bg-red-50 hover:text-red-600"
            onClick={() => setDeleteTarget(page)}
          >
            <Trash2 size={15} />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6" data-ocid="website_pages.page">
      <PageHeader
        title="Website Pages"
        description="Create SEO-ready website pages with title, content, publish status, and meta details."
        action={
          <Button
            type="button"
            onClick={openAdd}
            className="w-full gap-2 rounded-xl shadow-sm sm:w-auto bg-[#D89F00]"
          >
            <Plus size={16} />
            Add page
          </Button>
        }
      />

      <Card className="rounded-3xl border-slate-100 shadow-sm">
        <CardHeader className="gap-4 border-b border-slate-100 pb-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <CardTitle className="text-lg text-slate-900">
                Page Library
              </CardTitle>
              <p className="mt-1 text-sm text-slate-500">
                Preview and manage custom website pages from one place.
              </p>
            </div>
            <div className="flex w-full flex-col gap-3 sm:flex-row lg:w-auto">
              <div className="relative w-full lg:w-80">
                <Search
                  size={15}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <Input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search title, slug, content, SEO..."
                  className="rounded-xl border-slate-200 !pl-9"
                />
              </div>
              <div className="flex items-center rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm font-medium text-slate-600">
                {filteredPages.length} page
                {filteredPages.length === 1 ? "" : "s"}
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-5">
          <div className="overflow-hidden rounded-2xl border border-slate-100">
            <DataTable
              columns={columns}
              data={filteredPages}
              customStyles={pageTableStyles}
              progressPending={isLoading}
              pagination
              responsive
              highlightOnHover
              persistTableHead
              noDataComponent={
                <div className="py-16 text-center">
                  <p className="text-base font-semibold text-slate-900">
                    No pages found
                  </p>
                  <p className="mt-2 text-sm text-slate-500">
                    Add your first website page to see it here.
                  </p>
                </div>
              }
            />
          </div>
        </CardContent>
      </Card>

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-h-[92vh] overflow-y-auto rounded-3xl border-slate-200 sm:max-w-5xl">
          <DialogHeader>
            <DialogTitle className="text-xl text-slate-900">
              {editTarget ? "Edit Website Page" : "Add Website Page"}
            </DialogTitle>
            <DialogDescription>
              Manage the page title, SEO metadata, publish status, and
              content.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            <div className="grid gap-4 lg:grid-cols-3">
              <div className="space-y-2 lg:col-span-2">
                <Label htmlFor="page-title">Page Title</Label>
                <Input
                  id="page-title"
                  value={formData.title}
                  onChange={(event) =>
                    setFormData((prev) => ({
                      ...prev,
                      title: event.target.value,
                    }))
                  }
                  placeholder="About Samarpan Hospital"
                  className="rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="page-status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) =>
                    setFormData((prev) => ({
                      ...prev,
                      status: value as PageStatus,
                    }))
                  }
                >
                  <SelectTrigger id="page-status" className="rounded-xl">
                    <SelectValue placeholder="Select page status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="published">Published</SelectItem>
                    <SelectItem value="draft">Draft</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="page-slug">Slug</Label>
              <Input
                id="page-slug"
                value={formData.slug}
                onChange={(event) =>
                  setFormData((prev) => ({
                    ...prev,
                    slug: event.target.value,
                  }))
                }
                placeholder="about-samarpan"
                className="rounded-xl"
              />
              <p className="text-xs text-slate-500">
                Leave it clean and short. We’ll save this as `/
                {formData.slug.trim()
                  ? slugify(formData.slug)
                  : slugify(formData.title) || "page-slug"}
                `.
              </p>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
              <div className="mb-4">
                <h3 className="text-base font-semibold text-slate-900">
                  SEO Details
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                  Add meta title and meta description for search and social
                  previews.
                </p>
              </div>

              <div className="grid gap-4">
                <div className="space-y-2">
                  <Label htmlFor="page-meta-title">Meta Title</Label>
                  <Input
                    id="page-meta-title"
                    value={formData.metaTitle}
                    onChange={(event) =>
                      setFormData((prev) => ({
                        ...prev,
                        metaTitle: event.target.value,
                      }))
                    }
                    placeholder="Samarpan Hospital | Expert Care in Hisar"
                    className="rounded-xl bg-white"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="page-meta-description">
                    Meta Description
                  </Label>
                  <Textarea
                    id="page-meta-description"
                    rows={4}
                    value={formData.metaDescription}
                    onChange={(event) =>
                      setFormData((prev) => ({
                        ...prev,
                        metaDescription: event.target.value,
                      }))
                    }
                    placeholder="Short SEO description for this page."
                    className="rounded-2xl bg-white"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Page Content</Label>
              <div className="website-page-editor">
<PageEditor
  value={formData.content}
  onChange={(content) =>
    setFormData((prev) => ({
      ...prev,
      content,
    }))
  }
/>
              </div>
            </div>
          </div>

          <DialogFooter className="mt-4 gap-2 sm:justify-between">
            <Button
              type="button"
              variant="outline"
              className="rounded-xl"
              onClick={() => {
                setPreviewPage({
                  _id: editTarget?._id ?? "preview",
                  title: formData.title,
                  slug: formData.slug.trim()
                    ? slugify(formData.slug)
                    : slugify(formData.title),
                  content: formData.content,
                  status: formData.status,
                  seo: {
                    metaTitle: formData.metaTitle,
                    metaDescription: formData.metaDescription,
                  },
                });
                setPreviewOpen(true);
              }}
            >
              <Eye size={14} />
              Preview
            </Button>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                className="rounded-xl"
                onClick={() => setModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                className="rounded-xl bg-[#D89F00]"
                onClick={handleSave}
                disabled={addMutation.isPending || updateMutation.isPending}
              >
                {editTarget ? "Update Page" : "Create Page"}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={previewOpen || !!previewPage}
        onOpenChange={(open) => {
          setPreviewOpen(open);
          if (!open) {
            setPreviewPage(null);
          }
        }}
      >
        <DialogContent className="max-h-[92vh] overflow-y-auto rounded-3xl border-slate-200 sm:max-w-5xl">
          <DialogHeader>
            <DialogTitle className="text-xl text-slate-900">
              Page Preview
            </DialogTitle>
          </DialogHeader>

          {previewPage ? (
            <div className="space-y-4 px-1 pb-2">
              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                <div className="flex flex-wrap items-center gap-3">
                  <StatusBadge status={previewPage.status} />
                  <span className="text-sm text-slate-500">
                    /{previewPage.slug}
                  </span>
                </div>
                <h2 className="mt-3 text-2xl font-semibold text-slate-900">
                  {previewPage.title || "Untitled page"}
                </h2>
                <div className="mt-4 grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 md:grid-cols-2">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                      Meta Title
                    </p>
                    <p className="mt-1 text-sm text-slate-700">
                      {previewPage.seo.metaTitle || "No meta title"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                      Meta Description
                    </p>
                    <p className="mt-1 text-sm text-slate-700">
                      {previewPage.seo.metaDescription || "No meta description"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-white p-6 prose prose-slate max-w-full">
                <div
                  dangerouslySetInnerHTML={{
                    __html:
                      previewPage.content || "<p>No content added yet.</p>",
                  }}
                />
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <DialogContent className="max-w-xl rounded-3xl border-slate-200">
          <DialogHeader>
            <DialogTitle>Delete page</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {deleteTarget?.title}? This action
              cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              className="rounded-xl"
              onClick={() => setDeleteTarget(null)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              className="rounded-xl"
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
