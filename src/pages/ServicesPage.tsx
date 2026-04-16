import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
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
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { fetchServices } from "@/services/mockData";
import { formatCurrency } from "@/types";
import type { Service } from "@/types";
import { useQuery } from "@tanstack/react-query";
import {
  ImageIcon,
  LayoutGrid,
  List,
  Pencil,
  Plus,
  Search,
  Trash2,
  Upload,
} from "lucide-react";
import { useMemo, useRef, useState } from "react";
import { toast } from "sonner";

// ─── Category color map ────────────────────────────────────────────────────────

const CATEGORY_COLORS: Record<string, { bg: string; text: string }> = {
  Emergency: { bg: "bg-red-50", text: "text-red-600" },
  Surgery: { bg: "bg-purple-50", text: "text-purple-600" },
  Maternity: { bg: "bg-pink-50", text: "text-pink-600" },
  Diagnostics: { bg: "bg-amber-50", text: "text-amber-600" },
  Pediatrics: { bg: "bg-orange-50", text: "text-orange-600" },
  Psychiatry: { bg: "bg-indigo-50", text: "text-indigo-600" },
  Ophthalmology: { bg: "bg-yellow-50", text: "text-yellow-700" },
  Rehabilitation: { bg: "bg-primary/10", text: "text-primary" },
};

function getCategoryColor(cat: string) {
  return CATEGORY_COLORS[cat] ?? { bg: "bg-primary/10", text: "text-primary" };
}

// ─── Service initials avatar ───────────────────────────────────────────────────

const AVATAR_BG = [
  "bg-primary/10 text-primary",
  "bg-amber-100 text-amber-700",
  "bg-purple-100 text-purple-700",
  "bg-pink-100 text-pink-700",
  "bg-orange-100 text-orange-700",
  "bg-indigo-100 text-indigo-700",
];

function ServiceAvatar({ name, index }: { name: string; index: number }) {
  const initials = name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
  const colorClass = AVATAR_BG[index % AVATAR_BG.length];
  return (
    <div
      className={`h-10 w-10 rounded-xl flex items-center justify-center text-xs font-bold flex-shrink-0 ${colorClass}`}
    >
      {initials}
    </div>
  );
}

// ─── Mobile service card (used in table view on xs screens) ───────────────────

function MobileServiceCard({
  s,
  idx,
  onEdit,
  onDelete,
}: {
  s: Service;
  idx: number;
  onEdit: (s: Service) => void;
  onDelete: (s: Service) => void;
}) {
  const cat = getCategoryColor(s.category);
  return (
    <div
      className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 flex flex-col gap-3"
      data-ocid={`services.item.${idx + 1}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-3 min-w-0">
          <ServiceAvatar name={s.name} index={idx} />
          <div className="min-w-0">
            <p className="font-semibold text-[#1E293B] text-sm leading-tight truncate">
              {s.name}
            </p>
            <p className="text-xs text-[#64748B] mt-0.5 line-clamp-1">
              {s.category}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8 text-[#64748B] hover:text-primary hover:bg-primary/10 rounded-lg"
            onClick={() => onEdit(s)}
            aria-label="Edit service"
            data-ocid={`services.edit_button.${idx + 1}`}
          >
            <Pencil size={14} />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8 text-[#64748B] hover:text-red-500 hover:bg-red-50 rounded-lg"
            onClick={() => onDelete(s)}
            aria-label="Delete service"
            data-ocid={`services.delete_button.${idx + 1}`}
          >
            <Trash2 size={14} />
          </Button>
        </div>
      </div>
      <div className="flex items-center justify-between pt-1 border-t border-slate-50">
        <Badge
          variant="outline"
          className={`rounded-lg text-xs border-0 font-medium ${cat.bg} ${cat.text}`}
        >
          {s.category}
        </Badge>
        <div className="flex items-center gap-2">
          <span className="font-bold text-sm text-primary">
            {formatCurrency(s.price)}
          </span>
          <Badge
            variant="outline"
            className={`rounded-lg text-xs border-0 font-medium ${
              s.isActive
                ? "bg-green-50 text-green-700"
                : "bg-slate-100 text-slate-500"
            }`}
          >
            {s.isActive ? "Active" : "Inactive"}
          </Badge>
        </div>
      </div>
    </div>
  );
}

// ─── Empty form ────────────────────────────────────────────────────────────────

const emptyForm: Omit<Service, "id"> = {
  name: "",
  description: "",
  image: "",
  price: 0,
  category: "",
  isActive: true,
};

// ─── Skeleton rows ─────────────────────────────────────────────────────────────

const SKELETON_ROWS = ["sk-1", "sk-2", "sk-3", "sk-4", "sk-5"];

// ─── Main component ────────────────────────────────────────────────────────────

export default function ServicesPage() {
  const { data = [], isLoading } = useQuery({
    queryKey: ["services"],
    queryFn: fetchServices,
  });

  const [services, setServices] = useState<Service[]>([]);
  const [initialized, setInitialized] = useState(false);
  if (!isLoading && !initialized) {
    setServices(data);
    setInitialized(true);
  }

  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState<"table" | "grid">("table");
  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Service | null>(null);
  const [formData, setFormData] = useState<Omit<Service, "id">>(emptyForm);
  const [deleteTarget, setDeleteTarget] = useState<Service | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const filtered = useMemo(() => {
    if (!search.trim()) return services;
    const q = search.toLowerCase();
    return services.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.category.toLowerCase().includes(q) ||
        s.description.toLowerCase().includes(q),
    );
  }, [services, search]);

  function openAdd() {
    setEditTarget(null);
    setFormData(emptyForm);
    setModalOpen(true);
  }

  function openEdit(s: Service) {
    setEditTarget(s);
    setFormData({
      name: s.name,
      description: s.description,
      image: s.image,
      price: s.price,
      category: s.category,
      isActive: s.isActive,
    });
    setModalOpen(true);
  }

  function handleSave() {
    if (!formData.name.trim()) {
      toast.error("Service name is required.");
      return;
    }
    if (!formData.category.trim()) {
      toast.error("Category is required.");
      return;
    }
    if (editTarget) {
      setServices((prev) =>
        prev.map((s) => (s.id === editTarget.id ? { ...s, ...formData } : s)),
      );
      toast.success("Service updated successfully.");
    } else {
      setServices((prev) => [{ ...formData, id: `s${Date.now()}` }, ...prev]);
      toast.success("Service added successfully.");
    }
    setModalOpen(false);
  }

  function handleDelete() {
    if (!deleteTarget) return;
    setServices((prev) => prev.filter((s) => s.id !== deleteTarget.id));
    toast.success(`"${deleteTarget.name}" deleted.`);
    setDeleteTarget(null);
  }

  return (
    <div data-ocid="services.page">
      <PageHeader
        title="Services Management"
        description="Add, edit or remove hospital services offered to patients."
        action={
          <Button
            onClick={openAdd}
            className="bg-primary hover:bg-secondary text-white rounded-xl gap-2 shadow-sm w-full sm:w-auto"
            data-ocid="services.add_button"
          >
            <Plus size={15} /> Add Service
          </Button>
        }
      />

      {/* ── Toolbar ─────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-3 mb-5 flex-wrap">
        <div className="relative flex-1 min-w-[180px] max-w-sm">
          <Search
            size={15}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]"
          />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search services…"
            className="pl-9 rounded-xl border-slate-200 bg-white text-sm h-9"
            data-ocid="services.search_input"
          />
        </div>
        <div className="flex items-center gap-1 bg-slate-100 rounded-xl p-1 flex-shrink-0">
          <Button
            type="button"
            size="sm"
            variant={viewMode === "table" ? "default" : "ghost"}
            onClick={() => setViewMode("table")}
            className={`rounded-lg h-8 w-8 p-0 ${viewMode === "table" ? "bg-white text-primary shadow-sm" : "text-[#64748B] hover:text-primary"}`}
            aria-label="Table view"
            data-ocid="services.table_view_toggle"
          >
            <List size={14} />
          </Button>
          <Button
            type="button"
            size="sm"
            variant={viewMode === "grid" ? "default" : "ghost"}
            onClick={() => setViewMode("grid")}
            className={`rounded-lg h-8 w-8 p-0 ${viewMode === "grid" ? "bg-white text-primary shadow-sm" : "text-[#64748B] hover:text-primary"}`}
            aria-label="Grid view"
            data-ocid="services.grid_view_toggle"
          >
            <LayoutGrid size={14} />
          </Button>
        </div>
      </div>

      {/* ── Table View — desktop ─────────────────────────────────────────── */}
      {viewMode === "table" && (
        <>
          {/* Desktop/tablet table (hidden on xs) */}
          <div
            className="hidden sm:block bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden"
            data-ocid="services.table"
          >
            <Table>
              <TableHeader>
                <TableRow className="bg-[#F8FAFC] hover:bg-[#F8FAFC]">
                  <TableHead className="text-xs font-semibold text-[#64748B] w-14" />
                  <TableHead className="text-xs font-semibold text-[#64748B]">
                    Service Name
                  </TableHead>
                  <TableHead className="text-xs font-semibold text-[#64748B] hidden md:table-cell">
                    Description
                  </TableHead>
                  <TableHead className="text-xs font-semibold text-[#64748B]">
                    Category
                  </TableHead>
                  <TableHead className="text-xs font-semibold text-[#64748B] text-right">
                    Price
                  </TableHead>
                  <TableHead className="text-xs font-semibold text-[#64748B] hidden md:table-cell">
                    Status
                  </TableHead>
                  <TableHead className="text-xs font-semibold text-[#64748B] text-right">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading
                  ? SKELETON_ROWS.map((sk) => (
                      <TableRow key={sk}>
                        <TableCell>
                          <Skeleton className="h-10 w-10 rounded-xl" />
                        </TableCell>
                        <TableCell>
                          <Skeleton className="h-4 w-32" />
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          <Skeleton className="h-4 w-48" />
                        </TableCell>
                        <TableCell>
                          <Skeleton className="h-5 w-20 rounded-full" />
                        </TableCell>
                        <TableCell>
                          <Skeleton className="h-4 w-16 ml-auto" />
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          <Skeleton className="h-5 w-14 rounded-full" />
                        </TableCell>
                        <TableCell>
                          <Skeleton className="h-7 w-16 ml-auto rounded-lg" />
                        </TableCell>
                      </TableRow>
                    ))
                  : filtered.map((s, idx) => (
                      <TableRow
                        key={s.id}
                        className="hover:bg-[#F8FAFC] transition-colors"
                        data-ocid={`services.item.${idx + 1}`}
                      >
                        <TableCell className="py-3">
                          <ServiceAvatar name={s.name} index={idx} />
                        </TableCell>
                        <TableCell className="py-3">
                          <p className="font-semibold text-[#1E293B] text-sm leading-tight">
                            {s.name}
                          </p>
                        </TableCell>
                        <TableCell className="hidden md:table-cell py-3 text-sm text-[#64748B] max-w-[260px]">
                          <span className="line-clamp-1">
                            {s.description.length > 60
                              ? `${s.description.slice(0, 60)}…`
                              : s.description}
                          </span>
                        </TableCell>
                        <TableCell className="py-3">
                          {(() => {
                            const c = getCategoryColor(s.category);
                            return (
                              <Badge
                                variant="outline"
                                className={`rounded-lg text-xs border-0 font-medium ${c.bg} ${c.text}`}
                              >
                                {s.category}
                              </Badge>
                            );
                          })()}
                        </TableCell>
                        <TableCell className="py-3 text-right">
                          <span className="font-semibold text-[#1E293B] text-sm">
                            {formatCurrency(s.price)}
                          </span>
                        </TableCell>
                        <TableCell className="hidden md:table-cell py-3">
                          <Badge
                            variant="outline"
                            className={`rounded-lg text-xs border-0 font-medium ${
                              s.isActive
                                ? "bg-green-50 text-green-700"
                                : "bg-slate-100 text-slate-500"
                            }`}
                          >
                            {s.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                        <TableCell className="py-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8 text-[#64748B] hover:text-primary hover:bg-primary/10 rounded-lg"
                              onClick={() => openEdit(s)}
                              aria-label="Edit service"
                              data-ocid={`services.edit_button.${idx + 1}`}
                            >
                              <Pencil size={14} />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8 text-[#64748B] hover:text-red-500 hover:bg-red-50 rounded-lg"
                              onClick={() => setDeleteTarget(s)}
                              aria-label="Delete service"
                              data-ocid={`services.delete_button.${idx + 1}`}
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
                      colSpan={7}
                      className="py-16 text-center"
                      data-ocid="services.empty_state"
                    >
                      <div className="flex flex-col items-center gap-2 text-[#94A3B8]">
                        <ImageIcon size={32} className="opacity-40" />
                        <p className="text-sm font-medium">No services found</p>
                        <p className="text-xs">
                          Try a different search or add a new service
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {/* Mobile card list (visible on xs only) */}
          <div className="sm:hidden space-y-3">
            {isLoading ? (
              SKELETON_ROWS.map((sk) => (
                <div
                  key={sk}
                  className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 space-y-3"
                >
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-10 w-10 rounded-xl flex-shrink-0" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-1 border-t border-slate-50">
                    <Skeleton className="h-5 w-20 rounded-full" />
                    <Skeleton className="h-5 w-16 rounded-full" />
                  </div>
                </div>
              ))
            ) : filtered.length === 0 ? (
              <div
                className="flex flex-col items-center gap-3 py-16 text-[#94A3B8]"
                data-ocid="services.empty_state"
              >
                <ImageIcon size={36} className="opacity-40" />
                <p className="text-sm font-medium">No services found</p>
                <p className="text-xs">
                  Try a different search or add a new service
                </p>
              </div>
            ) : (
              filtered.map((s, idx) => (
                <MobileServiceCard
                  key={s.id}
                  s={s}
                  idx={idx}
                  onEdit={openEdit}
                  onDelete={setDeleteTarget}
                />
              ))
            )}
          </div>
        </>
      )}

      {/* ── Grid View ───────────────────────────────────────────────────── */}
      {viewMode === "grid" && (
        <div>
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {SKELETON_ROWS.map((sk) => (
                <div
                  key={sk}
                  className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 space-y-3"
                >
                  <Skeleton className="h-12 w-12 rounded-xl" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-3 w-2/3" />
                  <div className="flex items-center justify-between pt-1">
                    <Skeleton className="h-5 w-16 rounded-full" />
                    <Skeleton className="h-5 w-20 rounded-full" />
                  </div>
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div
              className="flex flex-col items-center gap-3 py-20 text-[#94A3B8]"
              data-ocid="services.empty_state"
            >
              <ImageIcon size={40} className="opacity-40" />
              <p className="text-sm font-medium">No services found</p>
              <p className="text-xs">
                Try a different search or add a new service
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filtered.map((s, idx) => {
                const cat = getCategoryColor(s.category);
                return (
                  <div
                    key={s.id}
                    className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 flex flex-col gap-3 hover:shadow-md transition-shadow"
                    data-ocid={`services.item.${idx + 1}`}
                  >
                    <div className="flex items-start justify-between">
                      <ServiceAvatar name={s.name} index={idx} />
                      <div className="flex items-center gap-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-[#94A3B8] hover:text-primary hover:bg-primary/10 rounded-lg"
                          onClick={() => openEdit(s)}
                          aria-label="Edit service"
                          data-ocid={`services.edit_button.${idx + 1}`}
                        >
                          <Pencil size={14} />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-[#94A3B8] hover:text-red-500 hover:bg-red-50 rounded-lg"
                          onClick={() => setDeleteTarget(s)}
                          aria-label="Delete service"
                          data-ocid={`services.delete_button.${idx + 1}`}
                        >
                          <Trash2 size={14} />
                        </Button>
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-[#1E293B] text-sm leading-snug truncate">
                        {s.name}
                      </p>
                      <p className="text-xs text-[#64748B] mt-1 line-clamp-2 leading-relaxed">
                        {s.description}
                      </p>
                    </div>
                    <div className="flex items-center justify-between pt-1 border-t border-slate-50">
                      <Badge
                        variant="outline"
                        className={`rounded-lg text-xs border-0 font-medium ${cat.bg} ${cat.text}`}
                      >
                        {s.category}
                      </Badge>
                      <span className="text-sm font-bold text-primary">
                        {formatCurrency(s.price)}
                      </span>
                    </div>
                    {!s.isActive && (
                      <span className="text-[10px] font-medium text-slate-400 tracking-wide uppercase">
                        Inactive
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── Add / Edit Modal ─────────────────────────────────────────────── */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent
          className="rounded-2xl w-[95vw] max-w-lg max-h-[90vh] overflow-y-auto"
          data-ocid="services.dialog"
        >
          <DialogHeader>
            <DialogTitle className="text-[#1E293B]">
              {editTarget ? "Edit Service" : "Add New Service"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-1">
            {/* Image upload area */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-[#64748B] uppercase tracking-wide">
                Service Image
              </Label>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full min-h-[120px] rounded-xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center gap-2 text-[#94A3B8] hover:border-primary hover:text-primary transition-colors cursor-pointer bg-slate-50 hover:bg-primary/5"
                data-ocid="services.upload_button"
              >
                <Upload size={20} />
                <span className="text-xs font-medium">Tap to upload image</span>
                <span className="text-[10px]">PNG, JPG up to 2MB</span>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    setFormData({ ...formData, image: file });
                    toast.info(
                      `"${file}" selected (upload not implemented yet).`,
                    );
                  }
                }}
              />
            </div>

            {/* Name */}
            <div className="space-y-1.5">
              <Label
                htmlFor="svc-name"
                className="text-xs font-medium text-[#64748B] uppercase tracking-wide"
              >
                Service Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="svc-name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="e.g. Emergency Care"
                className="rounded-xl border-slate-200 text-sm"
                data-ocid="services.name_input"
              />
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <Label
                htmlFor="svc-desc"
                className="text-xs font-medium text-[#64748B] uppercase tracking-wide"
              >
                Description
              </Label>
              <Textarea
                id="svc-desc"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Brief description of the service"
                className="rounded-xl resize-none border-slate-200 text-sm min-h-[80px]"
                rows={3}
                data-ocid="services.description_textarea"
              />
            </div>

            {/* Category + Price — stacked on mobile, side-by-side on sm+ */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label
                  htmlFor="svc-cat"
                  className="text-xs font-medium text-[#64748B] uppercase tracking-wide"
                >
                  Category <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="svc-cat"
                  value={formData.category}
                  onChange={(e) =>
                    setFormData({ ...formData, category: e.target.value })
                  }
                  placeholder="e.g. Surgery"
                  className="rounded-xl border-slate-200 text-sm"
                  data-ocid="services.category_input"
                />
              </div>
              <div className="space-y-1.5">
                <Label
                  htmlFor="svc-price"
                  className="text-xs font-medium text-[#64748B] uppercase tracking-wide"
                >
                  Price (₹)
                </Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-[#94A3B8] font-medium">
                    ₹
                  </span>
                  <Input
                    id="svc-price"
                    type="number"
                    min={0}
                    value={formData.price}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        price: Number(e.target.value),
                      })
                    }
                    className="rounded-xl border-slate-200 pl-7 text-sm"
                    data-ocid="services.price_input"
                  />
                </div>
              </div>
            </div>

            {/* Active toggle */}
            <div className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
              <div>
                <p className="text-sm font-medium text-[#1E293B]">
                  Active Service
                </p>
                <p className="text-xs text-[#94A3B8]">
                  Visible to patients on the website
                </p>
              </div>
              <Switch
                checked={formData.isActive}
                onCheckedChange={(v) =>
                  setFormData({ ...formData, isActive: v })
                }
                data-ocid="services.active_switch"
              />
            </div>
          </div>

          <DialogFooter className="flex-wrap gap-2 sm:flex-nowrap">
            <Button
              type="button"
              variant="outline"
              className="rounded-xl border-slate-200 text-[#64748B] w-full sm:w-auto"
              onClick={() => setModalOpen(false)}
              data-ocid="services.cancel_button"
            >
              Cancel
            </Button>
            <Button
              type="button"
              className="rounded-xl bg-primary hover:bg-secondary text-white w-full sm:w-auto"
              onClick={handleSave}
              data-ocid="services.save_button"
            >
              {editTarget ? "Save Changes" : "Add Service"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Delete confirm ───────────────────────────────────────────────── */}
      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Service"
        message={`Delete "${deleteTarget?.name ?? "this service"}"? This action cannot be undone.`}
        confirmLabel="Delete"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
