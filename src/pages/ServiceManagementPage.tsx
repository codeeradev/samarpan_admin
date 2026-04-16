import { PageHeader } from "@/components/admin/PageHeader";
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
  addServiceApi,
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
  const [formData, setFormData] = useState<ServicePayload>(emptyForm);
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
    onError: (error: Error) => toast.error(error.message),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<ServicePayload> }) =>
      updateServiceApi(id, payload),
    onSuccess: () => {
      toast.success("Service updated successfully.");
      queryClient.invalidateQueries({ queryKey: ["service-management"] });
      setModalOpen(false);
    },
    onError: (error: Error) => toast.error(error.message),
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
    setFeaturesInput((service.features || []).join(", "));
    setKeywordsInput((service.seo?.keywords || []).join(", "));
    setModalOpen(true);
  }

  // ─── Field helpers ───────────────────────────────────────────────────────────

  function setField<K extends keyof ServicePayload>(key: K, value: ServicePayload[K]) {
    setFormData((prev) => ({ ...prev, [key]: value }));
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
  }

  function updateFaq(index: number, field: "question" | "answer", value: string) {
    setFormData((prev) => {
      const faqs = [...(prev.faqs || [])];
      faqs[index] = { ...faqs[index], [field]: value };
      return { ...prev, faqs };
    });
  }

  function removeFaq(index: number) {
    setFormData((prev) => ({
      ...prev,
      faqs: (prev.faqs || []).filter((_, i) => i !== index),
    }));
  }

  // ─── Save ────────────────────────────────────────────────────────────────────

  function handleSave() {
    if (!formData.title.trim()) {
      toast.error("Title is required.");
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

    if (editTarget) {
      updateMutation.mutate({ id: editTarget._id, payload });
      return;
    }
    addMutation.mutate(payload);
  }

  const isBusy = addMutation.isPending || updateMutation.isPending;

  // ─── Render ──────────────────────────────────────────────────────────────────

  return (
    <div data-ocid="service_management.page">
      <PageHeader
        title="Service Management"
        description="Super Admin can add, update and view all services."
        action={
          <Button
            onClick={openAdd}
            className="bg-primary hover:bg-secondary text-white rounded-xl gap-2"
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
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => openEdit(service)}
                        aria-label="Edit service"
                        data-ocid="service_management.edit_button"
                      >
                        <Pencil size={14} />
                      </Button>
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
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
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
                />
              </div>

              {/* Slug */}
              <div className="space-y-1">
                <Label htmlFor="svc-slug">Slug</Label>
                <Input
                  id="svc-slug"
                  value={formData.slug}
                  onChange={(e) => setField("slug", e.target.value)}
                  placeholder="Auto-generated from title if left empty"
                />
              </div>

              {/* Short Description */}
              <div className="space-y-1">
                <Label htmlFor="svc-short-desc">Short Description</Label>
                <Textarea
                  id="svc-short-desc"
                  value={formData.shortDescription}
                  onChange={(e) => setField("shortDescription", e.target.value)}
                  placeholder="Brief summary shown in listings"
                  className="resize-none min-h-[80px]"
                  rows={3}
                />
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
                <Label>Service Image</Label>
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
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) setField("image", file);
                  }}
                />
              </div>

              {/* Icon */}
              <div className="space-y-1">
                <Label>Service Icon</Label>
                {editTarget && typeof formData.icon === "string" && formData.icon && (
                  <p className="text-xs text-slate-500 truncate mb-1">
                    Current: {formData.icon}
                  </p>
                )}
                <Input
                  ref={iconRef}
                  type="file"
                  accept="image/*,.svg"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) setField("icon", file);
                  }}
                />
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
            <Button onClick={handleSave} disabled={isBusy}>
              {isBusy
                ? editTarget ? "Updating…" : "Adding…"
                : editTarget ? "Update Service" : "Add Service"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}