import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  addServiceFeatureApi,
  deleteServiceFeatureApi,
  getServiceFeatureRelationId,
  getServiceFeaturesApi,
  type ServiceFeatureItem,
  type ServiceFeaturePayload,
  updateServiceFeatureApi,
} from "@/apiCalls/serviceFeatures";

import { getAllServicesApi, type ServiceItem } from "@/apiCalls/services";

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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { themeColor } from "@/lib/theme";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { Pencil, Plus, Trash2 } from "lucide-react";

import DataTable, { type TableColumn } from "react-data-table-component";

import { toast } from "sonner";

import PageEditor from "@/components/editor/pageEditor";

import { resolveAssetUrl } from "./website-content/types";

import "./pages-editor.css";

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

type FormDataType = {
  title: string;
  slug: string;
  content: string;
  serviceId: string;
  image: File | string;
  metaTitle: string;
  metaDescription: string;
  keywords: string;
};

type UpdateServiceFeatureVariables = {
  id: string;
  payload: ServiceFeaturePayload;
};

const emptyForm: FormDataType = {
  title: "",
  slug: "",
  content: "",
  serviceId: "",
  image: "",
  metaTitle: "",
  metaDescription: "",
  keywords: "",
};

const tableStyles = {
  table: {
    style: {
      backgroundColor: "transparent",
    },
  },
  headRow: {
    style: {
      minHeight: "54px",
      backgroundColor: themeColor("muted"),
      borderBottomWidth: "1px",
      borderBottomColor: themeColor("border"),
    },
  },
  headCells: {
    style: {
      color: themeColor("muted-foreground"),
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
      borderBottomColor: themeColor("border", 0.7),
      backgroundColor: themeColor("card"),
    },
  },
  cells: {
    style: {
      paddingLeft: "16px",
      paddingRight: "16px",
      color: themeColor("foreground"),
      fontSize: "14px",
    },
  },
  pagination: {
    style: {
      borderTopWidth: "1px",
      borderTopColor: themeColor("border"),
      minHeight: "60px",
      color: themeColor("muted-foreground"),
      backgroundColor: themeColor("card"),
    },
  },
};

function resolveServiceTitle(
  relation: ServiceFeatureItem["serviceId"],
  services: ServiceItem[],
) {
  if (relation && typeof relation === "object" && relation.title) {
    return relation.title;
  }

  const serviceId = getServiceFeatureRelationId(relation);

  return services.find((service) => service._id === serviceId)?.title || "-";
}

export default function ServiceFeaturesPage() {
  const queryClient = useQueryClient();

  const [search, setSearch] = useState("");

  const [modalOpen, setModalOpen] = useState(false);

  const [editing, setEditing] = useState<ServiceFeatureItem | null>(null);

  const [deleteTarget, setDeleteTarget] = useState<ServiceFeatureItem | null>(null);

  const [formData, setFormData] = useState(emptyForm);

  const { data: services = [] } = useQuery({
    queryKey: ["services"],
    queryFn: getAllServicesApi,
  });

  const { data: features = [], isLoading } = useQuery({
    queryKey: ["service-features"],
    queryFn: () => getServiceFeaturesApi<ServiceFeatureItem>(),
  });

  const addMutation = useMutation({
    mutationFn: (payload: ServiceFeaturePayload) => addServiceFeatureApi(payload),

    onSuccess: () => {
      toast.success("Service feature added successfully.");

      queryClient.invalidateQueries({
        queryKey: ["service-features"],
      });

      setModalOpen(false);
    },

    onError: () => {
      toast.error("Failed to add service feature.");
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: UpdateServiceFeatureVariables) =>
      updateServiceFeatureApi(id, payload),

    onSuccess: () => {
      toast.success("Service feature updated successfully.");

      queryClient.invalidateQueries({
        queryKey: ["service-features"],
      });

      setModalOpen(false);
    },

    onError: () => {
      toast.error("Failed to update service feature.");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteServiceFeatureApi(id),

    onSuccess: () => {
      toast.success("Service feature deleted successfully.");

      queryClient.invalidateQueries({
        queryKey: ["service-features"],
      });

      setDeleteTarget(null);
    },

    onError: () => {
      toast.error("Failed to delete service feature.");
    },
  });

  function openAdd() {
    setEditing(null);

    setFormData(emptyForm);

    setModalOpen(true);
  }

  function openEdit(feature: ServiceFeatureItem) {
    setEditing(feature);

    setFormData({
      title: feature.title || "",
      slug: feature.slug || "",
      content: feature.content || "",
      image: feature.image || "",
      serviceId: getServiceFeatureRelationId(feature.serviceId),
      metaTitle: feature.seo?.metaTitle || "",
      metaDescription: feature.seo?.metaDescription || "",
      keywords: feature.seo?.keywords?.join(", ") || "",
    });

    setModalOpen(true);
  }

  async function handleSave() {
    if (!formData.title || !formData.serviceId) {
      toast.error("Title and Service are required.");

      return;
    }

    const payload: ServiceFeaturePayload = {
      title: formData.title,
      slug: formData.slug?.trim()
        ? slugify(formData.slug)
        : slugify(formData.title),
      content: formData.content,
      image: formData.image,
      serviceId: formData.serviceId,
      seo: {
        metaTitle: formData.metaTitle.trim(),
        metaDescription: formData.metaDescription.trim(),
        keywords: formData.keywords
          .split(",")
          .map((keyword) => keyword.trim())
          .filter(Boolean),
      },
    };

    if (editing) {
      await updateMutation.mutateAsync({
        id: editing._id,
        payload,
      });

      return;
    }

    await addMutation.mutateAsync(payload);
  }

  const filtered = useMemo(() => {
    if (!search.trim()) return features;

    const q = search.toLowerCase();

    return features.filter(
      (item) => item.title?.toLowerCase().includes(q) || item.slug?.toLowerCase().includes(q),
    );
  }, [features, search]);

  const isBusy =
    addMutation.isPending ||
    updateMutation.isPending ||
    deleteMutation.isPending;

  const columns: TableColumn<ServiceFeatureItem>[] = [
    {
      name: "Title",
      grow: 1.2,
      cell: (feature) => (
        <div className="min-w-0 py-3">
          <p className="truncate text-sm font-semibold text-foreground">
            {feature.title}
          </p>
        </div>
      ),
    },
    {
      name: "Image",
      width: "110px",
      cell: (feature) => (
        <div className="py-2">
          {feature.image ? (
            <img
              src={resolveAssetUrl(feature.image)}
              alt={feature.title}
              className="h-14 w-14 rounded-lg border object-cover"
            />
          ) : (
            <div className="flex h-14 w-14 items-center justify-center rounded-lg border text-xs text-muted-foreground">
              No Img
            </div>
          )}
        </div>
      ),
    },
    {
      name: "Service",
      grow: 1,
      cell: (feature) => (
        <span className="text-sm text-foreground">
          {resolveServiceTitle(feature.serviceId, services)}
        </span>
      ),
    },
    {
      name: "Actions",
      right: true,
      width: "140px",
      cell: (feature) => (
        <div className="flex items-center justify-end gap-1">
          <Button
            size="icon"
            variant="ghost"
            onClick={() => openEdit(feature)}
          >
            <Pencil size={14} />
          </Button>

          <Button
            size="icon"
            variant="ghost"
            onClick={() => setDeleteTarget(feature)}
          >
            <Trash2 size={14} />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Service Features"
        description="Manage service features and detailed content."
        action={
          <Button onClick={openAdd} className="gap-2">
            <Plus size={15} />
            Add Feature
          </Button>
        }
      />

      {/* Search */}
      <div className="mb-4">
        <Input
          placeholder="Search feature..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
      </div>

      {/* Table */}
      <div className="bg-card border rounded-2xl overflow-hidden">
        <DataTable
          columns={columns}
          data={filtered}
          customStyles={tableStyles}
          progressPending={isLoading}
          pagination
          responsive
          highlightOnHover
          persistTableHead
          noDataComponent={
            <div className="py-10 text-center text-muted-foreground">
              No features found.
            </div>
          }
        />
      </div>

      {/* Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen} modal={false}>
        <DialogContent
          className="max-w-5xl max-h-[90vh] rounded-3xl sm:max-w-[900px] overflow-y-auto"
          onInteractOutside={(e) => {
            const el = e.target as HTMLElement;

            if (
              el.closest(".tox-tinymce-aux") ||
              el.closest(".tox-dialog") ||
              el.closest(".tox-menu") ||
              el.closest(".tox-pop") ||
              document.querySelector(".tox-dialog")
            ) {
              e.preventDefault();
            }
          }}
        >
          <DialogHeader>
            <DialogTitle>
              {editing ? "Update Feature" : "Add Feature"}
            </DialogTitle>
          </DialogHeader>

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
            </TabsList>

            <TabsContent value="basic" className="space-y-5 mt-0">
            {/* Title */}
            <div className="space-y-1">
              <Label>Title</Label>

              <Input
                value={formData.title}
                onChange={(e) =>
                  setFormData((p) => ({
                    ...p,
                    title: e.target.value,
                  }))
                }
                placeholder="Feature title"
              />
            </div>

            {/* Slug */}
            <div className="space-y-1">
              <Label>Slug</Label>

              <Input
                value={formData.slug}
                onChange={(e) =>
                  setFormData((p) => ({
                    ...p,
                    slug: e.target.value,
                  }))
                }
                placeholder="feature-slug"
              />
            </div>

            {/* Service */}
            <div className="space-y-1">
              <Label>Service</Label>

              <Select
                value={formData.serviceId}
                onValueChange={(value) =>
                  setFormData((p) => ({
                    ...p,
                    serviceId: value,
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select service" />
                </SelectTrigger>

                <SelectContent>
                  {services.map((service) => (
                    <SelectItem key={service._id} value={service._id}>
                      {service.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label>Feature Image</Label>

              {editing &&
                typeof formData.image === "string" &&
                formData.image && (
                  <img
                    src={resolveAssetUrl(formData.image)}
                    alt={formData.title}
                    className="w-32 h-20 object-cover rounded-lg border"
                  />
                )}

              <Input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];

                  if (file) {
                    setFormData((p) => ({
                      ...p,
                      image: file,
                    }));
                  }
                }}
              />
            </div>
            </TabsContent>

            <TabsContent value="content" className="mt-0">
            {/* Content */}
            <div className="space-y-2">
              <Label>Content</Label>

              <div className="website-page-editor">
                <PageEditor
                  value={formData.content}
                  onChange={(content) =>
                    setFormData((p) => ({
                      ...p,
                      content,
                    }))
                  }
                />
              </div>
            </div>
            </TabsContent>

            <TabsContent value="seo" className="mt-0 space-y-4">
                <div className="space-y-1">
                  <Label>Meta Title</Label>
                  <Input
                    value={formData.metaTitle}
                    onChange={(e) =>
                      setFormData((p) => ({
                        ...p,
                        metaTitle: e.target.value,
                      }))
                    }
                    placeholder="Feature meta title"
                    maxLength={60}
                  />
                  <p className="text-xs text-muted-foreground text-right">
                    {formData.metaTitle.length}/60
                  </p>
                </div>
                <div className="space-y-1">
                  <Label>Meta Description</Label>
                  <Textarea
                    value={formData.metaDescription}
                    onChange={(e) =>
                      setFormData((p) => ({
                        ...p,
                        metaDescription: e.target.value,
                      }))
                    }
                    placeholder="Short search description for this feature"
                    maxLength={160}
                    className="min-h-[80px] resize-none"
                    rows={3}
                  />
                  <p className="text-xs text-muted-foreground text-right">
                    {formData.metaDescription.length}/160
                  </p>
                </div>
                <div className="space-y-1">
                  <Label>Keywords (comma separated)</Label>
                  <Input
                    value={formData.keywords}
                    onChange={(e) =>
                      setFormData((p) => ({
                        ...p,
                        keywords: e.target.value,
                      }))
                    }
                    placeholder="service keyword, treatment keyword"
                  />
                </div>
            </TabsContent>
          </Tabs>

          <DialogFooter>
            <Button variant="outline" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>

            <Button onClick={handleSave} disabled={isBusy}>
              {isBusy
                ? editing
                  ? "Updating..."
                  : "Adding..."
                : editing
                  ? "Update Feature"
                  : "Add Feature"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Feature"
        message={`Delete "${deleteTarget?.title}"? This action cannot be undone.`}
        confirmLabel={deleteMutation.isPending ? "Deleting..." : "Delete"}
        onConfirm={() =>
          deleteTarget && deleteMutation.mutate(deleteTarget._id)
        }
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
