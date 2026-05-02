import { PageHeader } from "@/components/admin/PageHeader";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { Badge } from "@/components/ui/badge";
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
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  getApiErrorMessage,
  mapApiErrorsToFields,
} from "@/lib/api-errors";
import {
  addServiceApi,
  deleteServiceApi,
  getAllServicesApi,
  updateServiceApi,
  type ServiceItem,
  type ServicePayload,
} from "@/apiCalls/services";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Pencil, Plus, Trash2, X } from "lucide-react";
import { useMemo, useRef, useState } from "react";
import { toast } from "sonner";

// ─── Helpers ────────────────────────────────────────────────────────────────────

function slugify(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

type ServiceFormMode = "add" | "edit";

type ServiceFormErrors = Partial<
  Record<"title" | "slug" | "shortDescription" | "image" | "icon" | "faqs", string>
>;

function validateServiceForm(
  form: ServicePayload,
  mode: ServiceFormMode,
  services: ServiceItem[],
  currentId?: string,
): ServiceFormErrors {
  const errors: ServiceFormErrors = {};
  const nextSlug = form.slug.trim() ? slugify(form.slug) : slugify(form.title);
  const duplicateSlug = services.find(
    (service) => service.slug === nextSlug && service._id !== currentId,
  );
  const incompleteFaqIndex = (form.faqs ?? []).findIndex((faq) => {
    const question = faq.question.trim();
    const answer = faq.answer.trim();

    return (question || answer) && !(question && answer);
  });

  if (!form.title.trim()) {
    errors.title = "Title is required.";
  }

  if (!form.shortDescription.trim()) {
    errors.shortDescription = "Short description is required.";
  }

  if (!nextSlug) {
    errors.slug = "Slug is required.";
  } else if (duplicateSlug) {
    errors.slug = "Another service already uses this slug.";
  }

  if (mode === "add" && !(form.image instanceof File)) {
    errors.image = "Service image is required.";
  }

  if (mode === "add" && !(form.icon instanceof File)) {
    errors.icon = "Service icon is required.";
  }

  if (incompleteFaqIndex >= 0) {
    errors.faqs = `FAQ ${incompleteFaqIndex + 1} needs both a question and an answer.`;
  }

  return errors;
}

// ─── Empty form ──────────────────────────────────────────────────────────────────

const emptyForm: ServicePayload = {
  title: "",
  slug: "",
  shortDescription: "",
  image: "",
  icon: "",
  features: [],
  content: "",
  faqs: [],
  seo: { metaTitle: "", metaDescription: "", keywords: [] },
};

// ─── FAQ row component ───────────────────────────────────────────────────────────

function FaqRow({
  index,
  faq,
  onChange,
  onRemove,
}: {
  index: number;
  faq: { question: string; answer: string };
  onChange: (index: number, field: "question" | "answer", value: string) => void;
  onRemove: (index: number) => void;
}) {
  return (
    <div className="border border-slate-200 rounded-xl p-3 space-y-2 relative">
      <button
        type="button"
        onClick={() => onRemove(index)}
        className="absolute top-2 right-2 text-slate-400 hover:text-red-500 transition-colors"
        aria-label="Remove FAQ"
      >
        <X size={14} />
      </button>
      <div className="space-y-1 pr-6">
        <Label className="text-xs text-slate-500">Question</Label>
        <Input
          value={faq.question}
          onChange={(e) => onChange(index, "question", e.target.value)}
          placeholder="e.g. What is included in this service?"
          className="text-sm"
        />
      </div>
      <div className="space-y-1">
        <Label className="text-xs text-slate-500">Answer</Label>
        <Textarea
          value={faq.answer}
          onChange={(e) => onChange(index, "answer", e.target.value)}
          placeholder="Provide a clear answer…"
          className="text-sm min-h-[70px] resize-none"
          rows={2}
        />
      </div>
    </div>
  );
}

// ─── Main component ──────────────────────────────────────────────────────────────

export default function ServiceManagementPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<ServiceItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ServiceItem | null>(null);
  const [formData, setFormData] = useState<ServicePayload>(emptyForm);
  const [formErrors, setFormErrors] = useState<ServiceFormErrors>({});
  const [featuresInput, setFeaturesInput] = useState("");
  const [keywordsInput, setKeywordsInput] = useState("");
  const imageRef = useRef<HTMLInputElement>(null);
  const iconRef = useRef<HTMLInputElement>(null);

  const { data = [], isLoading } = useQuery({
    queryKey: ["service-management"],
    queryFn: getAllServicesApi,
  });

  const addMutation = useMutation({
    mutationFn: addServiceApi,
    onSuccess: () => {
      toast.success("Service added successfully.");
      queryClient.invalidateQueries({ queryKey: ["service-management"] });
      setModalOpen(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<ServicePayload> }) =>
      updateServiceApi(id, payload),
    onSuccess: () => {
      toast.success("Service updated successfully.");
      queryClient.invalidateQueries({ queryKey: ["service-management"] });
      setModalOpen(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteServiceApi,
    onSuccess: () => {
      toast.success("Service deleted successfully.");
      queryClient.invalidateQueries({ queryKey: ["service-management"] });
      setDeleteTarget(null);
    },
    onError: (error) => toast.error(getApiErrorMessage(error, "Failed to delete service.")),
  });

  const filtered = useMemo(() => {
    if (!search.trim()) return data;
    const q = search.toLowerCase();
    return data.filter(
      (s) =>
        s.title.toLowerCase().includes(q) ||
        s.slug.toLowerCase().includes(q) ||
        s.shortDescription.toLowerCase().includes(q),
    );
  }, [data, search]);

  // ─── Modal open helpers ──────────────────────────────────────────────────────

  function openAdd() {
    setEditTarget(null);
    setFormData(emptyForm);
    setFormErrors({});
    setFeaturesInput("");
    setKeywordsInput("");
    setModalOpen(true);
  }

  function openEdit(service: ServiceItem) {
    setEditTarget(service);
    setFormData({
      title: service.title,
      slug: service.slug,
      shortDescription: service.shortDescription,
      image: service.image || "",
      icon: service.icon || "",
      features: service.features || [],
      content: service.content || "",
      faqs: service.faqs || [],
      seo: service.seo || { metaTitle: "", metaDescription: "", keywords: [] },
    });
    setFormErrors({});
    setFeaturesInput((service.features || []).join(", "));
    setKeywordsInput((service.seo?.keywords || []).join(", "));
    setModalOpen(true);
  }

  // ─── Field helpers ───────────────────────────────────────────────────────────

  function setField<K extends keyof ServicePayload>(key: K, value: ServicePayload[K]) {
    setFormData((prev) => ({ ...prev, [key]: value }));
    setFormErrors((prev) => ({
      ...prev,
      [key as keyof ServiceFormErrors]: undefined,
    }));
  }

  function setSeoField(key: keyof NonNullable<ServicePayload["seo"]>, value: string) {
    setFormData((prev) => ({
      ...prev,
      seo: { ...prev.seo, [key]: value },
    }));
  }

  function addFaq() {
    setFormData((prev) => ({
      ...prev,
      faqs: [...(prev.faqs || []), { question: "", answer: "" }],
    }));
    setFormErrors((prev) => ({ ...prev, faqs: undefined }));
  }

  function updateFaq(index: number, field: "question" | "answer", value: string) {
    setFormData((prev) => {
      const faqs = [...(prev.faqs || [])];
      faqs[index] = { ...faqs[index], [field]: value };
      return { ...prev, faqs };
    });
    setFormErrors((prev) => ({ ...prev, faqs: undefined }));
  }

  function removeFaq(index: number) {
    setFormData((prev) => ({
      ...prev,
      faqs: (prev.faqs || []).filter((_, i) => i !== index),
    }));
    setFormErrors((prev) => ({ ...prev, faqs: undefined }));
  }

  // ─── Save ────────────────────────────────────────────────────────────────────

  async function handleSave() {
    const mode: ServiceFormMode = editTarget ? "edit" : "add";
    const errors = validateServiceForm(formData, mode, data, editTarget?._id);

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      toast.error(
        Object.values(errors)[0] ?? "Please correct the highlighted fields.",
      );
      return;
    }

    const payload: ServicePayload = {
      ...formData,
      slug: formData.slug?.trim() ? slugify(formData.slug) : slugify(formData.title),
      features: featuresInput
        .split(",")
        .map((f) => f.trim())
        .filter(Boolean),
      seo: {
        ...formData.seo,
        keywords: keywordsInput
          .split(",")
          .map((k) => k.trim())
          .filter(Boolean),
      },
    };

    try {
      if (editTarget) {
        await updateMutation.mutateAsync({ id: editTarget._id, payload });
        return;
      }

      await addMutation.mutateAsync(payload);
    } catch (error) {
      const backendErrors = mapApiErrorsToFields<
        keyof ServiceFormErrors
      >(error, {
        title: /title/i,
        slug: /slug/i,
        shortDescription: /short description/i,
        image: /\bimage\b/i,
        icon: /\bicon\b/i,
        faqs: /\bfaq\b/i,
      });

      if (Object.keys(backendErrors).length > 0) {
        setFormErrors((prev) => ({ ...prev, ...backendErrors }));
      }

      toast.error(getApiErrorMessage(error, "Failed to save service."));
    }
  }

  const isBusy =
    addMutation.isPending || updateMutation.isPending || deleteMutation.isPending;

  // ─── Render ──────────────────────────────────────────────────────────────────

  return (
    <div data-ocid="service_management.page">
      <PageHeader
        title="Service Management"
        description="Super Admin can add, update and view all services."
        action={
          <Button
            onClick={openAdd}
            className="bg-primary hover:bg-secondary text-white rounded-xl gap-2 bg-[#D89F00]"
            data-ocid="service_management.add_button"
          >
            <Plus size={15} /> Add Service
          </Button>
        }
      />

      <div className="mb-4">
        <Input
          placeholder="Search by title, slug or description"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
          data-ocid="service_management.search_input"
        />
      </div>

      {/* ── Table ──────────────────────────────────────────────────────────── */}
      <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Slug</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Features</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading
              ? [1, 2, 3].map((row) => (
                  <TableRow key={row}>
                    <TableCell><Skeleton className="h-4 w-36" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-56" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-20 rounded-full" /></TableCell>
                    <TableCell><Skeleton className="h-8 w-8 ml-auto rounded-lg" /></TableCell>
                  </TableRow>
                ))
              : filtered.map((service) => (
                  <TableRow key={service._id}>
                    <TableCell className="font-medium">{service.title}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{service.slug}</Badge>
                    </TableCell>
                    <TableCell className="max-w-[420px]">
                      <span className="line-clamp-2">{service.shortDescription}</span>
                    </TableCell>
                    <TableCell>{service.features?.length || 0}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => openEdit(service)}
                          aria-label="Edit service"
                          data-ocid="service_management.edit_button"
                        >
                          <Pencil size={14} />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => setDeleteTarget(service)}
                          aria-label="Delete service"
                          data-ocid="service_management.delete_button"
                        >
                          <Trash2 size={14} />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
            {!isLoading && filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-12 text-slate-500">
                  No services found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* ── Add / Edit Modal ────────────────────────────────────────────────── */}
      <Dialog
        open={modalOpen}
        onOpenChange={(nextOpen) => {
          setModalOpen(nextOpen);
          if (!nextOpen) {
            setFormErrors({});
          }
        }}
      >
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editTarget ? "Update Service" : "Add Service"}
            </DialogTitle>
          </DialogHeader>

          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="w-full mb-2">
              <TabsTrigger value="basic" className="flex-1">Basic Info</TabsTrigger>
              <TabsTrigger value="content" className="flex-1">Content</TabsTrigger>
              <TabsTrigger value="faqs" className="flex-1">FAQs</TabsTrigger>
              <TabsTrigger value="seo" className="flex-1">SEO</TabsTrigger>
            </TabsList>

            {/* ── Tab 1: Basic Info ─────────────────────────────────────── */}
            <TabsContent value="basic" className="space-y-4 mt-0">
              {/* Title */}
              <div className="space-y-1">
                <Label htmlFor="svc-title">
                  Title <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="svc-title"
                  value={formData.title}
                  onChange={(e) => setField("title", e.target.value)}
                  placeholder="e.g. Emergency Care"
                  className={formErrors.title ? "border-red-400 focus-visible:ring-red-400" : undefined}
                />
                {formErrors.title ? (
                  <p className="text-xs text-red-500">{formErrors.title}</p>
                ) : null}
              </div>

              {/* Slug */}
              <div className="space-y-1">
                <Label htmlFor="svc-slug">Slug</Label>
                <Input
                  id="svc-slug"
                  value={formData.slug}
                  onChange={(e) => setField("slug", e.target.value)}
                  placeholder="Auto-generated from title if left empty"
                  className={formErrors.slug ? "border-red-400 focus-visible:ring-red-400" : undefined}
                />
                {formErrors.slug ? (
                  <p className="text-xs text-red-500">{formErrors.slug}</p>
                ) : (
                  <p className="text-xs text-slate-500">
                    Saved as `/
                    {formData.slug.trim()
                      ? slugify(formData.slug)
                      : slugify(formData.title) || "service-slug"}
                    `.
                  </p>
                )}
              </div>

              {/* Short Description */}
              <div className="space-y-1">
                <Label htmlFor="svc-short-desc">
                  Short Description <span className="text-red-500">*</span>
                </Label>
                <Textarea
                  id="svc-short-desc"
                  value={formData.shortDescription}
                  onChange={(e) => setField("shortDescription", e.target.value)}
                  placeholder="Brief summary shown in listings"
                  className={`resize-none min-h-[80px] ${formErrors.shortDescription ? "border-red-400 focus-visible:ring-red-400" : ""}`}
                  rows={3}
                />
                {formErrors.shortDescription ? (
                  <p className="text-xs text-red-500">
                    {formErrors.shortDescription}
                  </p>
                ) : null}
              </div>

              {/* Features */}
              <div className="space-y-1">
                <Label htmlFor="svc-features">Features (comma separated)</Label>
                <Textarea
                  id="svc-features"
                  value={featuresInput}
                  onChange={(e) => setFeaturesInput(e.target.value)}
                  placeholder="24/7 support, Advanced diagnostics, Free consultation"
                  className="resize-none min-h-[70px]"
                  rows={2}
                />
              </div>

              {/* Image */}
              <div className="space-y-1">
                <Label>
                  Service Image <span className="text-red-500">*</span>
                </Label>
                {/* Preview existing image URL when editing */}
                {editTarget && typeof formData.image === "string" && formData.image && (
                  <p className="text-xs text-slate-500 truncate mb-1">
                    Current: {formData.image}
                  </p>
                )}
                <Input
                  ref={imageRef}
                  type="file"
                  accept="image/*"
                  className={formErrors.image ? "border-red-400 focus-visible:ring-red-400" : undefined}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) setField("image", file);
                  }}
                />
                {formErrors.image ? (
                  <p className="text-xs text-red-500">{formErrors.image}</p>
                ) : (
                  <p className="text-xs text-slate-500">
                    Upload a service image for new entries.
                  </p>
                )}
              </div>

              {/* Icon */}
              <div className="space-y-1">
                <Label>
                  Service Icon <span className="text-red-500">*</span>
                </Label>
                {editTarget && typeof formData.icon === "string" && formData.icon && (
                  <p className="text-xs text-slate-500 truncate mb-1">
                    Current: {formData.icon}
                  </p>
                )}
                <Input
                  ref={iconRef}
                  type="file"
                  accept="image/*,.svg"
                  className={formErrors.icon ? "border-red-400 focus-visible:ring-red-400" : undefined}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) setField("icon", file);
                  }}
                />
                {formErrors.icon ? (
                  <p className="text-xs text-red-500">{formErrors.icon}</p>
                ) : (
                  <p className="text-xs text-slate-500">
                    Upload a service icon for cards and listings.
                  </p>
                )}
              </div>
            </TabsContent>

            {/* ── Tab 2: Content ────────────────────────────────────────── */}
            <TabsContent value="content" className="mt-0">
              <div className="space-y-1">
                <Label htmlFor="svc-content">Full Content / Body</Label>
                <Textarea
                  id="svc-content"
                  value={formData.content}
                  onChange={(e) => setField("content", e.target.value)}
                  placeholder="Write detailed content about this service. HTML is supported."
                  className="resize-y min-h-[280px] font-mono text-sm"
                />
                <p className="text-xs text-slate-400">
                  Supports plain text or HTML markup.
                </p>
              </div>
            </TabsContent>

            {/* ── Tab 3: FAQs ───────────────────────────────────────────── */}
            <TabsContent value="faqs" className="mt-0 space-y-3">
              {(formData.faqs || []).length === 0 && (
                <p className="text-sm text-slate-400 text-center py-6">
                  No FAQs added yet. Click below to add one.
                </p>
              )}
              {(formData.faqs || []).map((faq, i) => (
                <FaqRow
                  key={i}
                  index={i}
                  faq={faq}
                  onChange={updateFaq}
                  onRemove={removeFaq}
                />
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addFaq}
                className="w-full gap-2 border-dashed"
              >
                <Plus size={14} /> Add FAQ
              </Button>
              {formErrors.faqs ? (
                <p className="text-xs text-red-500">{formErrors.faqs}</p>
              ) : null}
            </TabsContent>

            {/* ── Tab 4: SEO ────────────────────────────────────────────── */}
            <TabsContent value="seo" className="mt-0 space-y-4">
              <div className="space-y-1">
                <Label htmlFor="svc-meta-title">Meta Title</Label>
                <Input
                  id="svc-meta-title"
                  value={formData.seo?.metaTitle || ""}
                  onChange={(e) => setSeoField("metaTitle", e.target.value)}
                  placeholder="Page title for search engines"
                  maxLength={60}
                />
                <p className="text-xs text-slate-400 text-right">
                  {(formData.seo?.metaTitle || "").length}/60
                </p>
              </div>

              <div className="space-y-1">
                <Label htmlFor="svc-meta-desc">Meta Description</Label>
                <Textarea
                  id="svc-meta-desc"
                  value={formData.seo?.metaDescription || ""}
                  onChange={(e) => setSeoField("metaDescription", e.target.value)}
                  placeholder="Brief description for search engine results"
                  className="resize-none min-h-[80px]"
                  rows={3}
                  maxLength={160}
                />
                <p className="text-xs text-slate-400 text-right">
                  {(formData.seo?.metaDescription || "").length}/160
                </p>
              </div>

              <div className="space-y-1">
                <Label htmlFor="svc-keywords">Keywords (comma separated)</Label>
                <Input
                  id="svc-keywords"
                  value={keywordsInput}
                  onChange={(e) => setKeywordsInput(e.target.value)}
                  placeholder="hospital, emergency care, 24/7"
                />
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter className="mt-2">
            <Button variant="outline" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isBusy} className="bg-[#D89F00]">
              {isBusy
                ? editTarget ? "Updating…" : "Adding…"
                : editTarget ? "Update Service" : "Add Service"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Service"
        message={`Delete "${deleteTarget?.title ?? "this service"}"? This action cannot be undone.`}
        confirmLabel={deleteMutation.isPending ? "Deleting..." : "Delete"}
        onConfirm={() =>
          deleteTarget && deleteMutation.mutate(deleteTarget._id)
        }
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
