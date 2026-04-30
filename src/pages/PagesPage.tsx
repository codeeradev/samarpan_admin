import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { PageHeader } from "@/components/admin/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { addPageApi, deletePageApi, getAllPagesApi, updatePageApi, type PageItem, type PagePayload } from "@/apiCalls/pages";
import { Eye, Pencil, Plus, Search, Trash2 } from "lucide-react";
import ReactSummernote from "react-summernote";
import $ from "jquery";
import "bootstrap/dist/css/bootstrap.css";
import "react-summernote/dist/react-summernote.css";
import "summernote/dist/summernote.css";
import "summernote/dist/summernote.js";

if (typeof window !== "undefined") {
  const win = window as any;
  win.$ = win.jQuery = $;
}

const emptyPageForm: PagePayload = {
  title: "",
  slug: "",
  content: "",
  isActive: true,
};

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
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
    if (!query) return data;
    return data.filter(
      (page) =>
        page.title.toLowerCase().includes(query) ||
        page.slug.toLowerCase().includes(query) ||
        page.content.toLowerCase().includes(query),
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
      isActive: page.isActive,
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
      slug: formData.slug.trim() ? slugify(formData.slug) : slugify(formData.title),
      content: formData.content,
      isActive: formData.isActive,
    };

    if (editTarget) {
      updateMutation.mutate({ id: editTarget._id, payload });
      return;
    }

    addMutation.mutate(payload);
  }

  return (
    <div data-ocid="website-pages.page">
      <PageHeader
        title="Website Pages"
        description="Create, edit, and publish standalone website pages with rich HTML content."
        action={
          <Button
            type="button"
            onClick={openAdd}
            className="rounded-xl gap-2 shadow-sm w-full sm:w-auto"
          >
            <Plus size={16} />
            Add page
          </Button>
        }
      />

      <Card className="rounded-3xl border-slate-100 shadow-sm">
        <CardHeader>
          <CardTitle className="text-[#1E293B]">Page library</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex-1 min-w-0">
              <Label htmlFor="page-search" className="text-sm text-slate-500">
                Search pages
              </Label>
              <Input
                id="page-search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search title, slug, or content"
                className="mt-2"
              />
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <span>{filteredPages.length} pages found</span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Slug</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Updated</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-10 text-sm text-slate-500">
                      Loading pages...
                    </TableCell>
                  </TableRow>
                ) : filteredPages.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-10 text-sm text-slate-500">
                      No pages found. Create your first page to show here.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredPages.map((page) => (
                    <TableRow key={page._id}>
                      <TableCell>{page.title}</TableCell>
                      <TableCell>{page.slug}</TableCell>
                      <TableCell>
                        <Badge variant={page.isActive ? "secondary" : "outline"}>
                          {page.isActive ? "Published" : "Draft"}
                        </Badge>
                      </TableCell>
                      <TableCell>{new Date(page.updatedAt ?? page.createdAt ?? "").toLocaleDateString()}</TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => openPreview(page)}
                        >
                          <Eye size={16} />
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => openEdit(page)}
                        >
                          <Pencil size={16} />
                        </Button>
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          onClick={() => setDeleteTarget(page)}
                        >
                          <Trash2 size={16} />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-4xl rounded-3xl border-slate-200">
          <DialogHeader>
            <DialogTitle>{editTarget ? "Edit page" : "Add new page"}</DialogTitle>
            <DialogDescription>
              {editTarget
                ? "Update the title, slug, publish status, and rich page content."
                : "Create a new page and manage its SEO-friendly slug and publish state."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="page-title">Page title</Label>
                <Input
                  id="page-title"
                  value={formData.title}
                  onChange={(event) => setFormData((prev) => ({ ...prev, title: event.target.value }))}
                  placeholder="Enter page title"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="page-slug">Page slug</Label>
                <Input
                  id="page-slug"
                  value={formData.slug}
                  onChange={(event) => setFormData((prev) => ({ ...prev, slug: event.target.value }))}
                  placeholder="Enter page slug or leave blank to auto-generate"
                />
              </div>
            </div>

            <div className="flex items-center justify-between gap-3 rounded-3xl border border-slate-200 bg-slate-50 p-4">
              <div>
                <p className="text-sm font-semibold text-slate-900">Publish status</p>
                <p className="text-sm text-slate-500">Switch between published and draft state.</p>
              </div>
              <div className="flex items-center gap-3">
                <Switch
                  checked={formData.isActive}
                  onCheckedChange={(value) => setFormData((prev) => ({ ...prev, isActive: value }))}
                />
                <span className="text-sm text-slate-700">{formData.isActive ? "Published" : "Draft"}</span>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="page-content">Page content</Label>
              <ReactSummernote
                value={formData.content}
                options={{
                  height: 300,
                  dialogsInBody: true,
                  toolbar: [
                    ["style", ["style"]],
                    ["font", ["bold", "underline", "italic", "clear"]],
                    ["fontname", ["fontname"]],
                    ["para", ["ul", "ol", "paragraph"]],
                    ["insert", ["link", "picture", "video"]],
                    ["view", ["fullscreen", "codeview"]],
                  ],
                }}
                onChange={(content) => setFormData((prev) => ({ ...prev, content }))}
              />
            </div>
          </div>

          <DialogFooter className="mt-4 flex flex-col gap-3 sm:flex-row sm:justify-end">
            <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button type="button" onClick={handleSave} disabled={addMutation.isPending || updateMutation.isPending}>
              {editTarget ? "Update page" : "Create page"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-4xl rounded-3xl border-slate-200">
          <DialogHeader>
            <DialogTitle>Preview page</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 px-4 pb-4">
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
              <h2 className="text-lg font-semibold text-slate-900">{previewPage?.title}</h2>
              <p className="text-sm text-slate-500">/{previewPage?.slug}</p>
            </div>
            <div className="rounded-3xl border border-slate-200 bg-white p-6 prose prose-slate max-w-full">
              <div dangerouslySetInnerHTML={{ __html: previewPage?.content ?? "<p>No content</p>" }} />
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(deleteTarget)} onOpenChange={() => setDeleteTarget(null)}>
        <DialogContent className="max-w-xl rounded-3xl border-slate-200">
          <DialogHeader>
            <DialogTitle>Delete page</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the page {deleteTarget?.title}? This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => setDeleteTarget(null)}>
              Cancel
            </Button>
            <Button type="button" variant="destructive" onClick={handleDelete} disabled={deleteMutation.isPending}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
