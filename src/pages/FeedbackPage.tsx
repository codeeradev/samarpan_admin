import {
  type FeedbackItem,
  deleteFeedbackApi,
  getFeedbackApi,
} from "@/apiCalls/feedback";
import { type Column, DataTable } from "@/components/admin/DataTable";
import { PageHeader } from "@/components/admin/PageHeader";
import { Button } from "@/components/ui/button";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Mail,
  MapPin,
  MessageSquareText,
  Phone,
  Trash2,
  UserRound,
} from "lucide-react";
import { toast } from "sonner";

const FEEDBACK_QUERY_KEY = ["feedback"];

function formatDate(value?: string) {
  if (!value) return "—";
  return new Date(value).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function FeedbackPage() {
  const queryClient = useQueryClient();

  const { data = [], isLoading } = useQuery({
    queryKey: FEEDBACK_QUERY_KEY,
    queryFn: getFeedbackApi,
  });

  const deleteMutation = useMutation({
    mutationFn: deleteFeedbackApi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: FEEDBACK_QUERY_KEY });
      toast.success("Feedback deleted");
    },
    onError: () => {
      toast.error("Unable to delete feedback");
    },
  });

  const handleDelete = (id: string) => {
    if (!window.confirm("Delete this feedback?")) return;
    deleteMutation.mutate(id);
  };

  const columns: Column<FeedbackItem>[] = [
    {
      key: "fullName",
      header: "Patient",
      render: (item) => (
        <div className="py-1">
          <div className="flex items-center gap-2 font-semibold text-foreground">
            <UserRound size={15} className="text-primary" />
            {item.fullName}
          </div>
          <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
            <Phone size={12} />
            {item.contactNumber}
          </div>
          {item.email && (
            <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
              <Mail size={12} />
              {item.email}
            </div>
          )}
        </div>
      ),
    },
    {
      key: "address",
      header: "Address",
      render: (item) => (
        <div className="max-w-[260px] text-sm text-muted-foreground">
          {item.address ? (
            <span className="flex items-start gap-2">
              <MapPin size={14} className="mt-0.5 shrink-0 text-primary" />
              <span className="line-clamp-3">{item.address}</span>
            </span>
          ) : (
            "—"
          )}
        </div>
      ),
    },
    {
      key: "comments",
      header: "Feedback/Comments",
      render: (item) => (
        <div className="max-w-[420px] text-sm leading-6 text-foreground">
          <MessageSquareText size={14} className="mr-2 inline text-primary" />
          {item.comments}
        </div>
      ),
    },
    {
      key: "createdAt",
      header: "Submitted",
      render: (item) => (
        <span className="text-sm text-muted-foreground">
          {formatDate(item.createdAt)}
        </span>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      className: "text-right",
      render: (item) => (
        <Button
          size="icon"
          variant="ghost"
          onClick={() => handleDelete(item._id)}
          aria-label="Delete feedback"
          disabled={deleteMutation.isPending}
        >
          <Trash2 size={16} />
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Feedback"
        description="Review feedback submitted from the website."
      />

      <DataTable<FeedbackItem>
        columns={columns}
        data={data}
        isLoading={isLoading}
        searchable
        searchKeys={[
          "fullName",
          "contactNumber",
          "email",
          "address",
          "comments",
        ]}
        emptyText="No feedback submitted yet."
        rowKey={(row) => row._id}
        data-ocid="feedback.table"
      />
    </div>
  );
}
