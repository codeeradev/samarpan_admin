import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  SERVICE_FEATURE_TYPE,
  addServiceFeatureApi,
  deleteServiceFeatureApi,
  getServiceFeatureRelationId,
  getServiceFeaturesApi,
  getServiceSubCategoriesApi,
  type ServiceFeatureItem,
  type ServiceFeaturePayload,
  type ServiceSubCategoryItem,
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
  serviceSubCategoryId: string;
  image: File | string;
};

type UpdateServiceSubCategoryVariables = {
  id: string;
  payload: ServiceFeaturePayload;
};

const emptyForm: FormDataType = {
  title: "",
  slug: "",
  content: "",
  serviceId: "",
  serviceSubCategoryId: "",
  image: "",
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

function resolveRelationTitle(
  relation: ServiceFeatureItem["serviceId"],
  items: Array<{ _id: string; title: string }>,
) {
  if (relation && typeof relation === "object" && relation.title) {
    return relation.title;
  }

  const relationId = getServiceFeatureRelationId(relation);

  return items.find((item) => item._id === relationId)?.title || "-";
}

export default function ServiceSubCategoriesPage() {
  const queryClient = useQueryClient();

  const [search, setSearch] = useState("");

  const [modalOpen, setModalOpen] = useState(false);

  const [editing, setEditing] = useState<ServiceSubCategoryItem | null>(null);

  const [deleteTarget, setDeleteTarget] = useState<ServiceSubCategoryItem | null>(
    null,
  );

  const [formData, setFormData] = useState(emptyForm);

  const { data: services = [] } = useQuery({
    queryKey: ["services"],
    queryFn: getAllServicesApi,
  });

  const { data: categories = [] } = useQuery({
    queryKey: ["service-features"],
    queryFn: () => getServiceFeaturesApi<ServiceFeatureItem>(),
  });

  const {
    data: subCategories = [],
    isLoading,
  } = useQuery({
    queryKey: ["service-sub-categories"],
    queryFn: getServiceSubCategoriesApi,
  });

  const addMutation = useMutation({
    mutationFn: (payload: ServiceFeaturePayload) =>
      addServiceFeatureApi(payload, SERVICE_FEATURE_TYPE.SUB_CATEGORY),

    onSuccess: () => {
      toast.success("Service sub category added successfully.");

      queryClient.invalidateQueries({
        queryKey: ["service-sub-categories"],
      });

      setModalOpen(false);
    },

    onError: () => {
      toast.error("Failed to add service sub category.");
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: UpdateServiceSubCategoryVariables) =>
      updateServiceFeatureApi(id, payload, SERVICE_FEATURE_TYPE.SUB_CATEGORY),

    onSuccess: () => {
      toast.success("Service sub category updated successfully.");

      queryClient.invalidateQueries({
        queryKey: ["service-sub-categories"],
      });

      setModalOpen(false);
    },

    onError: () => {
      toast.error("Failed to update service sub category.");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) =>
      deleteServiceFeatureApi(id, SERVICE_FEATURE_TYPE.SUB_CATEGORY),

    onSuccess: () => {
      toast.success("Service sub category deleted successfully.");

      queryClient.invalidateQueries({
        queryKey: ["service-sub-categories"],
      });

      setDeleteTarget(null);
    },

    onError: () => {
      toast.error("Failed to delete service sub category.");
    },
  });

  function openAdd() {
    setEditing(null);

    setFormData(emptyForm);

    setModalOpen(true);
  }

  function openEdit(item: ServiceSubCategoryItem) {
    setEditing(item);

    setFormData({
      title: item.title || "",
      slug: item.slug || "",
      content: item.content || "",
      image: item.image || "",
      serviceId: getServiceFeatureRelationId(item.serviceId),
      serviceSubCategoryId: getServiceFeatureRelationId(item.serviceSubCategoryId),
    });

    setModalOpen(true);
  }

  async function handleSave() {
    if (!formData.title || !formData.serviceId || !formData.serviceSubCategoryId) {
      toast.error("Title, Service and Category are required.");

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

  const filteredCategories = useMemo(() => {
    if (!formData.serviceId) {
      return categories;
    }

    return categories.filter(
      (category) => getServiceFeatureRelationId(category.serviceId) === formData.serviceId,
    );
  }, [categories, formData.serviceId]);

  const filtered = useMemo(() => {
    if (!search.trim()) return subCategories;

    const q = search.toLowerCase();

    return subCategories.filter(
      (item) => item.title?.toLowerCase().includes(q) || item.slug?.toLowerCase().includes(q),
    );
  }, [subCategories, search]);

  const isBusy =
    addMutation.isPending ||
    updateMutation.isPending ||
    deleteMutation.isPending;

  const columns: TableColumn<ServiceSubCategoryItem>[] = [
    {
      name: "Title",
      grow: 1.2,
      cell: (item) => (
        <div className="min-w-0 py-3">
          <p className="truncate text-sm font-semibold text-foreground">
            {item.title}
          </p>
        </div>
      ),
    },
    {
      name: "Image",
      width: "110px",
      cell: (item) => (
        <div className="py-2">
          {item.image ? (
            <img
              src={resolveAssetUrl(item.image)}
              alt={item.title}
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
      cell: (item) => (
        <span className="text-sm text-foreground">
          {resolveRelationTitle(item.serviceId, services)}
        </span>
      ),
    },
    {
      name: "Category",
      grow: 1,
      cell: (item) => (
        <span className="text-sm text-foreground">
          {resolveRelationTitle(item.serviceSubCategoryId, categories)}
        </span>
      ),
    },
    {
      name: "Actions",
      right: true,
      width: "140px",
      cell: (item) => (
        <div className="flex items-center justify-end gap-1">
          <Button
            size="icon"
            variant="ghost"
            onClick={() => openEdit(item)}
          >
            <Pencil size={14} />
          </Button>

          <Button
            size="icon"
            variant="ghost"
            onClick={() => setDeleteTarget(item)}
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
        title="Service Sub Categories"
        description="Manage service sub categories and detailed content."
        action={
          <Button onClick={openAdd} className="gap-2">
            <Plus size={15} />
            Add Sub Category
          </Button>
        }
      />

      <div className="mb-4">
        <Input
          placeholder="Search sub category..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
      </div>

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
              No sub categories found.
            </div>
          }
        />
      </div>

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
              {editing ? "Update Sub Category" : "Add Sub Category"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-5">
            <div className="space-y-1">
              <Label>Title</Label>

              <Input
                value={formData.title}
                onChange={(e) =>
                  setFormData((previous) => ({
                    ...previous,
                    title: e.target.value,
                  }))
                }
                placeholder="Sub category title"
              />
            </div>

            <div className="space-y-1">
              <Label>Slug</Label>

              <Input
                value={formData.slug}
                onChange={(e) =>
                  setFormData((previous) => ({
                    ...previous,
                    slug: e.target.value,
                  }))
                }
                placeholder="sub-category-slug"
              />
            </div>

            <div className="space-y-1">
              <Label>Service</Label>

              <Select
                value={formData.serviceId}
                onValueChange={(value) =>
                  setFormData((previous) => {
                    const nextCategories = categories.filter(
                      (category) =>
                        getServiceFeatureRelationId(category.serviceId) === value,
                    );

                    const hasSelectedCategory = nextCategories.some(
                      (category) => category._id === previous.serviceSubCategoryId,
                    );

                    return {
                      ...previous,
                      serviceId: value,
                      serviceSubCategoryId: hasSelectedCategory
                        ? previous.serviceSubCategoryId
                        : "",
                    };
                  })
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
              <Label>Service Category</Label>

              <Select
                value={formData.serviceSubCategoryId}
                disabled={!formData.serviceId}
                onValueChange={(value) =>
                  setFormData((previous) => ({
                    ...previous,
                    serviceSubCategoryId: value,
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={
                      formData.serviceId
                        ? "Select category"
                        : "Select service first"
                    }
                  />
                </SelectTrigger>

                <SelectContent>
                  {filteredCategories.map((category) => (
                    <SelectItem key={category._id} value={category._id}>
                      {category.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {formData.serviceId && filteredCategories.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  No service categories found for this service.
                </p>
              )}
            </div>

            <div className="space-y-1">
              <Label>Sub Category Image</Label>

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
                    setFormData((previous) => ({
                      ...previous,
                      image: file,
                    }));
                  }
                }}
              />
            </div>

            <div className="space-y-2">
              <Label>Content</Label>

              <div className="website-page-editor">
                <PageEditor
                  value={formData.content}
                  onChange={(content) =>
                    setFormData((previous) => ({
                      ...previous,
                      content,
                    }))
                  }
                />
              </div>
            </div>
          </div>

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
                  ? "Update Sub Category"
                  : "Add Sub Category"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Sub Category"
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
