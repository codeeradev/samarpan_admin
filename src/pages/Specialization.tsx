import { useState } from "react";
import { toast } from "sonner";
import { Pencil, Plus, Trash2 } from "lucide-react";
import DataTable from "react-data-table-component";

import {
  useAddSpecialization,
  useDeleteSpecialization,
  useSpecializations,
  useUpdateSpecialization
} from "@/hooks/useSpecializations";

import { PageHeader } from "@/components/admin/PageHeader";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from "@/components/ui/card";

import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";

interface FormState {
  name: string;
  sortOrder: number;
  isActive: boolean;
}

const EMPTY_FORM: FormState = {
  name: "",
  sortOrder: 0,
  isActive: true
};

export default function SpecializationsPage() {

  const { data = [], isLoading } = useSpecializations();

  const addMutation = useAddSpecialization();
  const updateMutation = useUpdateSpecialization();
  const deleteMutation = useDeleteSpecialization();

  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);

  const [search, setSearch] = useState("");

  function openCreate() {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setOpen(true);
  }

  function openEdit(item: any) {
    setForm({
      name: item.name,
      sortOrder: item.sortOrder,
      isActive: item.isActive
    });
    setEditingId(item._id);
    setOpen(true);
  }

  function reset() {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setOpen(false);
  }

  function handleSubmit() {

    const payload = {
      name: form.name.trim(),
      sortOrder: form.sortOrder,
      isActive: form.isActive
    };

    if (editingId) {

      updateMutation.mutate(
        { id: editingId, payload },
        {
          onSuccess: () => {
            toast.success("Specialization updated");
            reset();
          }
        }
      );

    } else {

      addMutation.mutate(payload, {
        onSuccess: () => {
          toast.success("Specialization added");
          reset();
        }
      });

    }
  }

  function handleDelete(id: string) {

    if (!confirm("Delete specialization?")) return;

    deleteMutation.mutate(id, {
      onSuccess: () => toast.success("Deleted successfully")
    });

  }

  function toggleStatus(item: any) {

    updateMutation.mutate({
      id: item._id,
      payload: { isActive: !item.isActive }
    });

  }

  const filtered = data.filter((item: any) =>
    item.name.toLowerCase().includes(search.toLowerCase())
  );

  const columns = [
    {
      name: "Name",
      selector: (row: any) => row.name,
      sortable: true
    },
    {
      name: "Sort",
      selector: (row: any) => row.sortOrder,
      sortable: true
    },
    {
      name: "Status",
      cell: (row: any) => (
        <Switch
          checked={row.isActive}
          onCheckedChange={() => toggleStatus(row)}
        />
      )
    },
    {
      name: "Actions",
      right: true,
      cell: (row: any) => (
        <div className="flex gap-2">

          <Button
            size="icon"
            variant="ghost"
            onClick={() => openEdit(row)}
          >
            <Pencil size={16} />
          </Button>

          <Button
            size="icon"
            variant="ghost"
            onClick={() => handleDelete(row._id)}
          >
            <Trash2 size={16} />
          </Button>

        </div>
      )
    }
  ];

  return (

    <div>

      <PageHeader
        title="Specializations"
        description="Manage doctor specializations"
        action={
          <Button onClick={openCreate}>
            <Plus size={16}/> Add Specialization
          </Button>
        }
      />

      <Card className="rounded-3xl shadow-sm">

        <CardHeader className="flex flex-row items-center justify-between">

          <CardTitle>All Specializations</CardTitle>

          <Input
            placeholder="Search specialization..."
            className="max-w-xs"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

        </CardHeader>

        <CardContent>

          <DataTable
            columns={columns}
            data={filtered}
            progressPending={isLoading}
            pagination
            highlightOnHover
            striped
            responsive
          />

        </CardContent>

      </Card>

      <Dialog open={open} onOpenChange={setOpen}>

        <DialogContent className="rounded-2xl">

          <DialogHeader>
            <DialogTitle>
              {editingId ? "Edit Specialization" : "Add Specialization"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">

            <Input
              placeholder="Specialization name"
              value={form.name}
              onChange={(e) =>
                setForm((p) => ({
                  ...p,
                  name: e.target.value
                }))
              }
            />

            <Input
              type="number"
              placeholder="Sort order"
              value={form.sortOrder}
              onChange={(e) =>
                setForm((p) => ({
                  ...p,
                  sortOrder: Number(e.target.value)
                }))
              }
            />

            <div className="flex items-center justify-between">

              <span>Status</span>

              <Switch
                checked={form.isActive}
                onCheckedChange={(v) =>
                  setForm((p) => ({
                    ...p,
                    isActive: v
                  }))
                }
              />

            </div>

            <Button
              className="w-full"
              onClick={handleSubmit}
            >
              {editingId ? "Update" : "Create"}
            </Button>

          </div>

        </DialogContent>

      </Dialog>

    </div>

  );

}