import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

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

const emptyForm: FormDataType = {
  title: "",
  slug: "",
  content: "",
  serviceId: "",
  serviceSubCategoryId: "",
  image: "",
};

export default function ServiceSubCategoriesPage() {
  const queryClient = useQueryClient();

  const [search, setSearch] = useState("");

  const [modalOpen, setModalOpen] = useState(false);

  const [editing, setEditing] = useState<any>(null);

  const [deleteTarget, setDeleteTarget] = useState<any>(null);

  const [formData, setFormData] = useState(emptyForm);

  // Services
  const { data: services = [] } = useQuery({
    queryKey: ["services"],
    queryFn: getAllServicesApi,
  });

  // Categories (old service features)
  const { data: categories = [] } = useQuery({
    queryKey: ["service-features"],
    queryFn: () => getServiceFeaturesApi()
  });

  // Sub Categories
  const {
    data: subCategories = [],
    isLoading,
  } = useQuery({
    queryKey: ["service-sub-categories"],
    queryFn: () => getServiceFeaturesApi("?type=sub_cat"),
  });

  const addMutation = useMutation({
    mutationFn: (payload: any) =>
      addServiceFeatureApi(payload, "sub_cat"),

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
    mutationFn: ({ id, payload }: any) =>
      updateServiceFeatureApi(id, payload, "sub_cat"),

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
      deleteServiceFeatureApi(id, "sub_cat"),

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

  function openEdit(item: any) {
    setEditing(item);

    setFormData({
      title: item.title || "",
      slug: item.slug || "",
      content: item.content || "",
      image: item.image || "",
      serviceId: item.serviceId?._id || item.serviceId || "",
      serviceSubCategoryId:
        item.serviceSubCategoryId?._id ||
        item.serviceSubCategoryId ||
        "",
    });

    setModalOpen(true);
  }

  async function handleSave() {
    if (
      !formData.title ||
      !formData.serviceId ||
      !formData.serviceSubCategoryId
    ) {
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

  const filtered = useMemo(() => {
    if (!search.trim()) return subCategories;

    const q = search.toLowerCase();

    return subCategories.filter(
      (item: any) =>
        item.title?.toLowerCase().includes(q) ||
        item.slug?.toLowerCase().includes(q)
    );
  }, [subCategories, search]);

  const isBusy =
    addMutation.isPending ||
    updateMutation.isPending ||
    deleteMutation.isPending;

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

      {/* Search */}
      <div className="mb-4">
        <Input
          placeholder="Search sub category..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
      </div>

      {/* Table */}
      <div className="bg-card border rounded-2xl overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>

              <TableHead>Image</TableHead>

              <TableHead>Slug</TableHead>

              <TableHead>Service</TableHead>

              <TableHead>Category</TableHead>

              <TableHead className="text-right">Actions</TableHead>
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
                      <Skeleton className="h-14 w-14 rounded-lg" />
                    </TableCell>

                    <TableCell>
                      <Skeleton className="h-4 w-24" />
                    </TableCell>

                    <TableCell>
                      <Skeleton className="h-4 w-32" />
                    </TableCell>

                    <TableCell>
                      <Skeleton className="h-4 w-32" />
                    </TableCell>

                    <TableCell>
                      <Skeleton className="h-8 w-8 ml-auto rounded-lg" />
                    </TableCell>
                  </TableRow>
                ))
              : filtered.map((item: any) => (
                  <TableRow key={item._id}>
                    <TableCell className="font-medium">
                      {item.title}
                    </TableCell>

                    <TableCell>
                      {item.image ? (
                        <img
                          src={resolveAssetUrl(item.image)}
                          alt={item.title}
                          className="w-14 h-14 rounded-lg object-cover border"
                        />
                      ) : (
                        "-"
                      )}
                    </TableCell>

                    <TableCell>
                      <Badge variant="secondary">
                        {item.slug}
                      </Badge>
                    </TableCell>

                    <TableCell>
                      {item.serviceId?.title || "-"}
                    </TableCell>

                    <TableCell>
                      {item.serviceSubCategoryId?.title || "-"}
                    </TableCell>

                    <TableCell className="text-right">
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
                    </TableCell>
                  </TableRow>
                ))}

            {!isLoading && filtered.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="text-center py-10 text-muted-foreground"
                >
                  No sub categories found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen} modal={false}>
        <DialogContent
          className="max-w-5xl max-h-[90vh] sm:max-w-[900px] overflow-y-auto"
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
              {editing
                ? "Update Sub Category"
                : "Add Sub Category"}
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
                    title: e.target.value,
                  }))
                }
                placeholder="Sub category title"
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
                placeholder="sub-category-slug"
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
                  {services.map((service: any) => (
                    <SelectItem
                      key={service._id}
                      value={service._id}
                    >
                      {service.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Category */}
            <div className="space-y-1">
              <Label>Service Category</Label>

              <Select
                value={formData.serviceSubCategoryId}
                onValueChange={(value) =>
                  setFormData((p) => ({
                    ...p,
                    serviceSubCategoryId: value,
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>

                <SelectContent>
                  {categories.map((category: any) => (
                    <SelectItem
                      key={category._id}
                      value={category._id}
                    >
                      {category.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Image */}
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
                    setFormData((p) => ({
                      ...p,
                      image: file,
                    }));
                  }
                }}
              />
            </div>

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
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setModalOpen(false)}
            >
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

      {/* Delete Dialog */}
      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Sub Category"
        message={`Delete "${deleteTarget?.title}"? This action cannot be undone.`}
        confirmLabel={
          deleteMutation.isPending ? "Deleting..." : "Delete"
        }
        onConfirm={() =>
          deleteTarget &&
          deleteMutation.mutate(deleteTarget._id)
        }
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}