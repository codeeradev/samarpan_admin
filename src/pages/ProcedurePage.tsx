"use client";

import {
  addProcedureApi,
  deleteProcedureApi,
  getAllProceduresApi,
  updateProcedureApi,
  type ProcedureItem,
} from "@/apiCalls/procedure";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { BASE_URL } from "@/apis/endpoint";

import { DataTable, type Column } from "@/components/admin/DataTable";
import { PageHeader } from "@/components/admin/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import DOMPurify from "dompurify";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { Card, CardContent } from "@/components/ui/card";

import { getApiErrorMessage, mapApiErrorsToFields } from "@/lib/api-errors";

import { toast } from "sonner";

import { Eye, Plus, Pencil, Trash2, Upload } from "lucide-react";

import { ConfirmDialog } from "@/components/admin/ConfirmDialog";

import PageEditor from "@/components/editor/pageEditor";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";

const PROCEDURE_QUERY_KEY = ["procedures"];

type ProcedureFormState = {
  title: string;
  shortDescription: string;
  slug: string;
  content: string;
  metaTitle: string;
  metaDescription: string;
  keywords: string;
  sortOrder: number;
  isActive: boolean;
  image: File | null;
};

type ProcedureFormErrors = Partial<
  Record<
    | "title"
    | "slug"
    | "content"
    | "metaTitle"
    | "metaDescription"
    | "image"
    | "shortDescription",
    string
  >
>;

const EMPTY_FORM: ProcedureFormState = {
  title: "",
  shortDescription: "",
  slug: "",
  content: "",
  metaTitle: "",
  metaDescription: "",
  keywords: "",
  sortOrder: 0,
  isActive: true,
  image: null,
};

function validateProcedureForm(
  form: ProcedureFormState,
  mode: "add" | "edit",
): ProcedureFormErrors {
  const errors: ProcedureFormErrors = {};

  if (!form.title.trim()) {
    errors.title = "Title is required.";
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

export default function ProceduresPage() {
  const queryClient = useQueryClient();

  const [open, setOpen] = useState(false);

  const [mode, setMode] = useState<"add" | "edit">("add");

  const [selected, setSelected] = useState<ProcedureItem | null>(null);

  const [previewTarget, setPreviewTarget] = useState<ProcedureItem | null>(
    null,
  );

  const [deleteTarget, setDeleteTarget] = useState<ProcedureItem | null>(null);

  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const [form, setForm] = useState<ProcedureFormState>(EMPTY_FORM);

  const [formErrors, setFormErrors] = useState<ProcedureFormErrors>({});

  const { data: procedures = [], isLoading } = useQuery({
    queryKey: PROCEDURE_QUERY_KEY,
    queryFn: getAllProceduresApi,
  });

  const API_ASSET_ORIGIN = BASE_URL.replace(/\/admin\/?$/, "");

  const addMutation = useMutation({
    mutationFn: addProcedureApi,
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: any) => updateProcedureApi(id, payload),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteProcedureApi,
  });

  function resolveAssetUrl(path?: string) {
    if (!path) return "";

    if (/^https?:\/\//.test(path)) return path;

    return `${API_ASSET_ORIGIN}${path.startsWith("/") ? path : `/${path}`}`;
  }

  const openAdd = () => {
    setMode("add");
    setSelected(null);
    setImagePreview(null);
    setForm(EMPTY_FORM);
    setFormErrors({});
    setOpen(true);
  };

  const openEdit = (procedure: ProcedureItem) => {
    setMode("edit");

    setSelected(procedure);

    setImagePreview(procedure.image ? resolveAssetUrl(procedure.image) : null);

    setForm({
      title: procedure.title || "",
      shortDescription: procedure.shortDescription || "",
      slug: procedure.slug || "",
      content: procedure.content || "",
      metaTitle: procedure.seo?.metaTitle || "",
      metaDescription: procedure.seo?.metaDescription || "",
      keywords: procedure.seo?.keywords?.join(", ") || "",
      sortOrder: procedure.sortOrder || 0,
      isActive: procedure.isActive !== undefined ? procedure.isActive : true,
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

  function setField<K extends keyof ProcedureFormState>(
    key: K,
    value: ProcedureFormState[K],
  ) {
    setForm((prev) => ({
      ...prev,
      [key]: value,
    }));

    setFormErrors((prev) => ({
      ...prev,
      [key as keyof ProcedureFormErrors]: undefined,
    }));
  }

  const handleSave = async () => {
    const errors = validateProcedureForm(form, mode);

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
      shortDescription: form.shortDescription,
      slug: form.slug,
      content: form.content,
      seo,
      sortOrder: form.sortOrder,
      isActive: form.isActive,
      image: form.image || undefined,
    };

    try {
      if (mode === "edit" && selected) {
        await updateMutation.mutateAsync({
          id: selected._id,
          payload,
        });

        toast.success("Procedure updated");
      } else {
        await addMutation.mutateAsync(payload);

        toast.success("Procedure created");
      }

      queryClient.invalidateQueries({
        queryKey: PROCEDURE_QUERY_KEY,
      });

      setOpen(false);
    } catch (error: any) {
      const backendErrors = mapApiErrorsToFields<keyof ProcedureFormErrors>(
        error,
        {
          title: /title/i,
          shortDescription: /short description/i,
          slug: /slug/i,
          content: /content/i,
          metaTitle: /meta title/i,
          metaDescription: /meta description/i,
          image: /\bimage\b/i,
        },
      );

      if (Object.keys(backendErrors).length > 0) {
        setFormErrors((prev) => ({
          ...prev,
          ...backendErrors,
        }));
      }

      toast.error(getApiErrorMessage(error, "Failed to save procedure."));
    }
  };

  const toggleProcedureStatus = async (
    procedure: ProcedureItem,
    checked: boolean,
  ) => {
    try {
      await updateMutation.mutateAsync({
        id: procedure._id,
        payload: {
          isActive: checked,
        },
      });

      queryClient.invalidateQueries({
        queryKey: PROCEDURE_QUERY_KEY,
      });

      toast.success(checked ? "Procedure activated" : "Procedure deactivated");
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Failed to update status."));
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteMutation.mutateAsync(id);

      queryClient.invalidateQueries({
        queryKey: PROCEDURE_QUERY_KEY,
      });

      toast.success("Deleted");
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Failed to delete procedure."));
    }
  };

  const columns: Column<ProcedureItem>[] = [
    {
      key: "title",
      header: "Procedure",
      render: (procedure) => (
        <div className="flex items-center gap-3 min-w-0">
          <div className="h-10 w-12 overflow-hidden rounded-lg border border-border bg-muted/60 shrink-0">
            {procedure.image ? (
              <img
                src={resolveAssetUrl(procedure.image)}
                alt={procedure.title || "Procedure"}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="h-full w-full bg-muted" />
            )}
          </div>

          <div className="min-w-0">
            <p className="font-medium text-foreground truncate">
              {procedure.title || "Untitled"}
            </p>

            <p className="text-xs text-muted-foreground truncate">
              {procedure.slug || "No slug"}
            </p>
          </div>
        </div>
      ),
    },

    {
      key: "sortOrder",
      header: "Sort Order",
      render: (procedure) => (
        <span className="text-muted-foreground">
          {procedure.sortOrder ?? 0}
        </span>
      ),
    },

    {
      key: "isActive",
      header: "Status",
      render: (procedure) => (
        <div className="flex items-center gap-3">
          <Switch
            checked={procedure.isActive !== false}
            onCheckedChange={(checked) =>
              toggleProcedureStatus(procedure, checked)
            }
            disabled={updateMutation.isPending}
          />

          <Badge variant={procedure.isActive ? "default" : "secondary"}>
            {procedure.isActive ? "Active" : "Inactive"}
          </Badge>
        </div>
      ),
    },

    {
      key: "actions",
      header: "Actions",
      className: "text-right",

      render: (procedure) => (
        <div className="flex items-center justify-end gap-2">
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="rounded-lg border-border"
            onClick={() => setPreviewTarget(procedure)}
          >
            <Eye size={14} />
            Preview
          </Button>

          <Button
            size="icon"
            variant="outline"
            className="rounded-lg"
            onClick={() => openEdit(procedure)}
          >
            <Pencil size={16} />
          </Button>

          <Button
            size="icon"
            variant="ghost"
            onClick={() => setDeleteTarget(procedure)}
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
        title="Procedure Management"
        description="Manage procedures, SEO, and preview content."
        action={
          <Button onClick={openAdd} className="rounded-xl gap-2 bg-primary">
            <Plus className="h-4 w-4" />
            Add Procedure
          </Button>
        }
      />

      <DataTable<ProcedureItem>
        columns={columns}
        data={procedures}
        isLoading={isLoading}
        searchable
        searchKeys={["title", "slug"] as (keyof ProcedureItem)[]}
        emptyText="No procedures found."
        rowKey={(row) => row._id}
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
              {mode === "edit" ? "Edit Procedure" : "Create Procedure"}
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
                    />

                    {formErrors.title ? (
                      <p className="text-xs text-destructive">
                        {formErrors.title}
                      </p>
                    ) : null}
                  </div>

                  <div className="space-y-2">
                    <Label>Slug</Label>

                    <Input
                      value={form.slug}
                      onChange={(e) => setField("slug", e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Sort Order</Label>

                    <Input
                      type="number"
                      value={form.sortOrder}
                      onChange={(e) =>
                        setField("sortOrder", Number(e.target.value))
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Status</Label>

                    <select
                      value={form.isActive ? "active" : "inactive"}
                      onChange={(e) =>
                        setField("isActive", e.target.value === "active")
                      }
                      className="w-full border rounded-md px-3 py-2 bg-background"
                    >
                      <option value="active">Active</option>

                      <option value="inactive">Inactive</option>
                    </select>
                  </div>
                </div>
              </CardContent>
            </Card>
              </TabsContent>

              <TabsContent value="content" className="mt-0">
            <Card>
              <CardContent className="p-6 space-y-4">
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
                        Keep this concise for cards and listings.
                      </p>
                    )}

                    <span className="text-muted-foreground">
                      {form.shortDescription.length}/300
                    </span>
                  </div>
                </div>
                <h3 className="font-semibold">Content</h3>

                <PageEditor
                  value={form.content}
                  onChange={(val) => setField("content", val)}
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
                />

                <Textarea
                  placeholder="Meta Description"
                  value={form.metaDescription}
                  onChange={(e) => setField("metaDescription", e.target.value)}
                />

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
                    alt="Procedure preview"
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

                {formErrors.image ? (
                  <p className="text-xs text-destructive">{formErrors.image}</p>
                ) : null}
              </CardContent>
            </Card>
              </TabsContent>
            </Tabs>

            <Button onClick={handleSave} className="w-full bg-primary">
              {mode === "edit" ? "Update Procedure" : "Create Procedure"}
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
            <DialogTitle>Procedure Preview</DialogTitle>
          </DialogHeader>

          {previewTarget && (
            <div className="space-y-5">
              {previewTarget.image ? (
                <div className="overflow-hidden rounded-2xl border bg-muted/60">
                  <img
                    src={resolveAssetUrl(previewTarget.image)}
                    alt={previewTarget.title || "Procedure"}
                    className="h-56 w-full object-cover"
                  />
                </div>
              ) : null}

              <div className="space-y-2">
                <h2 className="text-xl font-semibold text-foreground">
                  {previewTarget.title || "Untitled"}
                </h2>

                <p className="text-sm text-muted-foreground">
                  Slug: {previewTarget.slug || "No slug"}
                </p>
              </div>

              <div className="rounded-2xl border border-border bg-card p-4">
                <p className="text-sm font-semibold text-foreground">Content</p>

                <div
                  dangerouslySetInnerHTML={{
                    __html: DOMPurify.sanitize(previewTarget.content || ""),
                  }}
                />
              </div>
            </div>
          )}
        </DialogContent>

        <ConfirmDialog
          open={!!deleteTarget}
          title="Delete this procedure?"
          message="This procedure will be permanently removed."
          confirmLabel="Delete Procedure"
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
