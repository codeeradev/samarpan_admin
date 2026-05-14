import { useMemo, useState } from "react";
import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import {
  addServiceFeatureApi,
  deleteServiceFeatureApi,
  getServiceFeaturesApi,
  updateServiceFeatureApi,
} from "@/apiCalls/serviceFeatures";

import { getAllServicesApi } from "@/apiCalls/services";

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

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { Skeleton } from "@/components/ui/skeleton";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { Pencil, Plus, Trash2 } from "lucide-react";

import { toast } from "sonner";

import PageEditor from "@/components/editor/pageEditor";

import "./pages-editor.css";

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

const emptyForm = {
  title: "",
  slug: "",
  content: "",
  serviceId: "",
};

export default function ServiceFeaturesPage() {
  const queryClient = useQueryClient();

  const [search, setSearch] = useState("");

  const [modalOpen, setModalOpen] = useState(false);

  const [editing, setEditing] = useState<any>(null);

  const [deleteTarget, setDeleteTarget] =
    useState<any>(null);

  const [formData, setFormData] =
    useState(emptyForm);

  const { data: services = [] } = useQuery({
    queryKey: ["services"],
    queryFn: getAllServicesApi,
  });

  const {
    data: features = [],
    isLoading,
  } = useQuery({
    queryKey: ["service-features"],
    queryFn: getServiceFeaturesApi,
  });

  const addMutation = useMutation({
    mutationFn: addServiceFeatureApi,

    onSuccess: () => {
      toast.success(
        "Service feature added successfully.",
      );

      queryClient.invalidateQueries({
        queryKey: ["service-features"],
      });

      setModalOpen(false);
    },

    onError: () => {
      toast.error(
        "Failed to add service feature.",
      );
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({
      id,
      payload,
    }: any) =>
      updateServiceFeatureApi(id, payload),

    onSuccess: () => {
      toast.success(
        "Service feature updated successfully.",
      );

      queryClient.invalidateQueries({
        queryKey: ["service-features"],
      });

      setModalOpen(false);
    },

    onError: () => {
      toast.error(
        "Failed to update service feature.",
      );
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteServiceFeatureApi,

    onSuccess: () => {
      toast.success(
        "Service feature deleted successfully.",
      );

      queryClient.invalidateQueries({
        queryKey: ["service-features"],
      });

      setDeleteTarget(null);
    },

    onError: () => {
      toast.error(
        "Failed to delete service feature.",
      );
    },
  });

  function openAdd() {
    setEditing(null);

    setFormData(emptyForm);

    setModalOpen(true);
  }

  function openEdit(feature: any) {
    setEditing(feature);

    setFormData({
      title: feature.title || "",
      slug: feature.slug || "",
      content: feature.content || "",
      serviceId:
        feature.serviceId?._id ||
        feature.serviceId ||
        "",
    });

    setModalOpen(true);
  }

  async function handleSave() {
    if (
      !formData.title ||
      !formData.serviceId
    ) {
      toast.error(
        "Title and Service are required.",
      );

      return;
    }

    const payload = {
      ...formData,
      slug: formData.slug?.trim()
        ? slugify(formData.slug)
        : slugify(formData.title),
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
      (item: any) =>
        item.title
          ?.toLowerCase()
          .includes(q) ||
        item.slug
          ?.toLowerCase()
          .includes(q),
    );
  }, [features, search]);

  const isBusy =
    addMutation.isPending ||
    updateMutation.isPending ||
    deleteMutation.isPending;

  return (
    <div>
      <PageHeader
        title="Service Features"
        description="Manage service features and detailed content."
        action={
          <Button
            onClick={openAdd}
            className="gap-2"
          >
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
          onChange={(e) =>
            setSearch(e.target.value)
          }
          className="max-w-sm"
        />
      </div>

      {/* Table */}
      <div className="bg-card border rounded-2xl overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>

              <TableHead>Slug</TableHead>

              <TableHead>Service</TableHead>

              <TableHead className="text-right">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {isLoading
              ? [1, 2, 3].map((row) => (
                  <TableRow key={row}>
                    <TableCell>
                      <Skeleton className="h-4 w-40" />
                    </TableCell>

                    <TableCell>
                      <Skeleton className="h-4 w-24" />
                    </TableCell>

                    <TableCell>
                      <Skeleton className="h-4 w-32" />
                    </TableCell>

                    <TableCell>
                      <Skeleton className="h-8 w-8 ml-auto rounded-lg" />
                    </TableCell>
                  </TableRow>
                ))
              : filtered.map((feature: any) => (
                  <TableRow key={feature._id}>
                    <TableCell className="font-medium">
                      {feature.title}
                    </TableCell>

                    <TableCell>
                      <Badge variant="secondary">
                        {feature.slug}
                      </Badge>
                    </TableCell>

                    <TableCell>
                      {feature.serviceId
                        ?.title || "-"}
                    </TableCell>

                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() =>
                            openEdit(feature)
                          }
                        >
                          <Pencil size={14} />
                        </Button>

                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() =>
                            setDeleteTarget(
                              feature,
                            )
                          }
                        >
                          <Trash2 size={14} />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}

            {!isLoading &&
              filtered.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={4}
                    className="text-center py-10 text-muted-foreground"
                  >
                    No features found.
                  </TableCell>
                </TableRow>
              )}
          </TableBody>
        </Table>
      </div>

      {/* Modal */}
      <Dialog
        open={modalOpen}
        onOpenChange={setModalOpen}
        modal={false}
      >
        <DialogContent
          className="max-w-5xl max-h-[90vh] sm:max-w-[900px] overflow-y-auto"
          onInteractOutside={(e) => {
            const el =
              e.target as HTMLElement;

            if (
              el.closest(".tox-tinymce-aux") ||
              el.closest(".tox-dialog") ||
              el.closest(".tox-menu") ||
              el.closest(".tox-pop") ||
              document.querySelector(
                ".tox-dialog",
              )
            ) {
              e.preventDefault();
            }
          }}
        >
          <DialogHeader>
            <DialogTitle>
              {editing
                ? "Update Feature"
                : "Add Feature"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-5">
            {/* Title */}
            <div className="space-y-1">
              <Label>Title</Label>

              <Input
                value={formData.title}
                onChange={(e) =>
                  setFormData((p) => ({
                    ...p,
                    title:
                      e.target.value,
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
                    slug:
                      e.target.value,
                  }))
                }
                placeholder="feature-slug"
              />
            </div>

            {/* Service */}
            <div className="space-y-1">
              <Label>Service</Label>

              <Select
                value={
                  formData.serviceId
                }
                onValueChange={(
                  value,
                ) =>
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
                  {services.map(
                    (service: any) => (
                      <SelectItem
                        key={service._id}
                        value={
                          service._id
                        }
                      >
                        {
                          service.title
                        }
                      </SelectItem>
                    ),
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* Content */}
            <div className="space-y-2">
              <Label>Content</Label>

              <div className="website-page-editor">
                <PageEditor
                  value={
                    formData.content
                  }
                  onChange={(
                    content,
                  ) =>
                    setFormData(
                      (p) => ({
                        ...p,
                        content,
                      }),
                    )
                  }
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() =>
                setModalOpen(false)
              }
            >
              Cancel
            </Button>

            <Button
              onClick={handleSave}
              disabled={isBusy}
            >
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
        confirmLabel={
          deleteMutation.isPending
            ? "Deleting..."
            : "Delete"
        }
        onConfirm={() =>
          deleteTarget &&
          deleteMutation.mutate(
            deleteTarget._id,
          )
        }
        onCancel={() =>
          setDeleteTarget(null)
        }
      />
    </div>
  );
}