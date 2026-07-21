import { useState, useEffect } from "react";
import { PageHeader } from "@/components/admin/PageHeader";
import { StatCard } from "@/components/admin/StatCard";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  getLeadFormsApi,
  getMetaLeadsApi,
  syncMetaLeadsApi,
  getMetaLeadDetailsApi,
  updateMetaLeadApi,
  type MetaLead,
  type MetaLeadStatus,
} from "@/apiCalls/metaAnalytics";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Search,
  RefreshCw,
  Loader2,
  Mail,
  Phone,
  Calendar,
  ChevronLeft,
  ChevronRight,
  UserRound,
} from "lucide-react";
import { toast } from "sonner";

const STATUS_OPTIONS: { value: MetaLeadStatus; label: string }[] = [
  { value: "new", label: "New" },
  { value: "contacted", label: "Contacted" },
  { value: "qualified", label: "Qualified" },
  { value: "converted", label: "Converted" },
  { value: "closed", label: "Closed" },
];

const STATUS_BADGE_CLASS: Record<MetaLeadStatus, string> = {
  new: "bg-primary/10 text-primary border-primary/20",
  contacted: "bg-chart-2/10 text-chart-2 border-chart-2/20",
  qualified: "bg-chart-1/10 text-chart-1 border-chart-1/20",
  converted: "bg-green-600/10 text-green-600 border-green-600/20",
  closed: "bg-muted text-muted-foreground border-border",
};

function LeadStatusBadge({ status }: { status: MetaLeadStatus }) {
  const option = STATUS_OPTIONS.find((s) => s.value === status);
  return (
    <Badge
      variant="outline"
      className={`rounded-full font-medium ${STATUS_BADGE_CLASS[status]}`}
    >
      {option?.label ?? status}
    </Badge>
  );
}

const formatDateTime = (value: string) =>
  new Date(value).toLocaleString(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

const SKELETON_ROW_KEYS = ["sk-1", "sk-2", "sk-3", "sk-4", "sk-5", "sk-6"];

export default function LeadsPage() {
  const queryClient = useQueryClient();

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [formId, setFormId] = useState<string>("all");
  const [status, setStatus] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [selectedLead, setSelectedLead] = useState<MetaLead | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [search]);

  const { data: formsData } = useQuery({
    queryKey: ["meta-lead-forms"],
    queryFn: getLeadFormsApi,
  });

  const {
    data: leadsData,
    isLoading: leadsLoading,
    isFetching: leadsFetching,
  } = useQuery({
    queryKey: ["meta-leads", { page, formId, status, debouncedSearch }],
    queryFn: () =>
      getMetaLeadsApi({
        page,
        limit: 20,
        search: debouncedSearch || undefined,
        formId: formId === "all" ? undefined : formId,
        status: status === "all" ? undefined : status,
      }),
  });

  const syncMutation = useMutation({
    mutationFn: syncMetaLeadsApi,
    onSuccess: (result) => {
      toast.success(`Synced ${result.syncedCount} new lead(s) from Facebook.`);
      queryClient.invalidateQueries({ queryKey: ["meta-leads"] });
      queryClient.invalidateQueries({ queryKey: ["meta-lead-forms"] });
    },
    onError: () => toast.error("Failed to sync leads. Please try again."),
  });

  const updateMutation = useMutation({
    mutationFn: ({
      leadId,
      payload,
    }: {
      leadId: string;
      payload: { status?: MetaLeadStatus; notes?: string };
    }) => updateMetaLeadApi(leadId, payload),
    onSuccess: (result) => {
      toast.success("Lead updated");
      setSelectedLead(result.lead);
      queryClient.invalidateQueries({ queryKey: ["meta-leads"] });
    },
    onError: () => toast.error("Failed to update lead."),
  });

  const leads = leadsData?.leads ?? [];
  const pagination = leadsData?.pagination;
  const statusCounts = leadsData?.statusCounts ?? {};
  const forms = formsData?.forms ?? [];

  return (
    <div data-ocid="leads.page">
      <PageHeader
        title="Leads"
        description="Facebook Lead Ads synced from your connected Page"
        action={
          <Button
            onClick={() => syncMutation.mutate()}
            disabled={syncMutation.isPending}
            className="rounded-xl"
          >
            {syncMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Syncing...
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                Sync Leads
              </>
            )}
          </Button>
        }
      />

      {/* ── Status stat cards ─────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 gap-4 mb-4 sm:mb-6">
        {leadsLoading
          ? SKELETON_ROW_KEYS.slice(0, 5).map((k) => (
              <Card
                key={k}
                className="rounded-2xl shadow-card border border-border"
              >
                <CardContent className="p-5 space-y-3">
                  <Skeleton className="h-11 w-11 rounded-xl" />
                  <Skeleton className="h-4 w-20 rounded" />
                  <Skeleton className="h-7 w-14 rounded" />
                </CardContent>
              </Card>
            ))
          : STATUS_OPTIONS.map((option) => (
              <StatCard
                key={option.value}
                icon={UserRound}
                label={option.label}
                value={(statusCounts[option.value] ?? 0).toLocaleString()}
                subtitle="leads"
                color="gold"
              />
            ))}
      </div>

      {/* ── Filters ────────────────────────────────────────────────────── */}
      <Card className="shadow-card border border-border rounded-2xl mb-4">
        <CardContent className="p-4 flex flex-col lg:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, email or phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 rounded-xl"
            />
          </div>

          <Select
            value={formId}
            onValueChange={(value) => {
              setFormId(value);
              setPage(1);
            }}
          >
            <SelectTrigger className="w-full lg:w-56 rounded-xl">
              <span className="block flex-1 truncate text-left">
                {formId === "all"
                  ? "All forms"
                  : forms.find((f) => f.formId === formId)?.formName}
              </span>
            </SelectTrigger>

            <SelectContent>
              <SelectItem value="all">All forms</SelectItem>
              {forms.map((form) => (
                <SelectItem key={form.formId} value={form.formId}>
                  {form.formName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={status}
            onValueChange={(value) => {
              setStatus(value);
              setPage(1);
            }}
          >
            <SelectTrigger className="w-full lg:w-44 rounded-xl">
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              {STATUS_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* ── Leads table ────────────────────────────────────────────────── */}
      <Card className="shadow-card border border-border rounded-2xl">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted">
                  {["Lead", "Contact", "Form", "Received", "Status"].map(
                    (col) => (
                      <th
                        key={col}
                        className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide py-3 px-5 whitespace-nowrap"
                      >
                        {col}
                      </th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody>
                {leadsLoading ? (
                  SKELETON_ROW_KEYS.map((rk) => (
                    <tr key={rk} className="border-b border-border/60">
                      {["a", "b", "c", "d", "e"].map((ck) => (
                        <td key={ck} className="px-5 py-3">
                          <Skeleton className="h-4 w-3/4 rounded" />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : leads.length > 0 ? (
                  leads.map((lead) => (
                    <tr
                      key={lead._id}
                      className="border-b border-border/60 hover:bg-muted transition-colors cursor-pointer"
                      onClick={() => setSelectedLead(lead)}
                    >
                      <td className="px-5 py-3 font-medium text-foreground whitespace-nowrap">
                        {lead.fullName || "—"}
                      </td>
                      <td className="px-5 py-3 text-muted-foreground">
                        <div className="flex flex-col gap-0.5">
                          {lead.email ? (
                            <span className="flex items-center gap-1.5 text-xs">
                              <Mail size={12} /> {lead.email}
                            </span>
                          ) : null}
                          {lead.phoneNumber ? (
                            <span className="flex items-center gap-1.5 text-xs">
                              <Phone size={12} /> {lead.phoneNumber}
                            </span>
                          ) : null}
                        </div>
                      </td>
                      <td className="px-5 py-3 text-muted-foreground max-w-[200px] truncate">
                        {lead.formName}
                      </td>
                      <td className="px-5 py-3 text-muted-foreground whitespace-nowrap text-xs">
                        <span className="flex items-center gap-1.5">
                          <Calendar size={12} />{" "}
                          {formatDateTime(lead.createdTime)}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <LeadStatusBadge status={lead.status} />
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-5 py-8 text-sm text-muted-foreground text-center"
                    >
                      No leads found. Try syncing or adjusting filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {pagination && pagination.totalPages > 1 ? (
            <div className="flex items-center justify-between px-5 py-3 border-t border-border">
              <p className="text-xs text-muted-foreground">
                Page {pagination.page} of {pagination.totalPages} ·{" "}
                {pagination.total} leads
                {leadsFetching ? " · updating..." : ""}
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-lg"
                  disabled={pagination.page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  <ChevronLeft size={14} />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-lg"
                  disabled={pagination.page >= pagination.totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  <ChevronRight size={14} />
                </Button>
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>

      {/* ── Lead detail dialog ────────────────────────────────────────── */}
      <Dialog
        open={Boolean(selectedLead)}
        onOpenChange={(open) => {
          if (!open) setSelectedLead(null);
        }}
      >
        <DialogContent className="sm:max-w-lg max-h-[86vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedLead?.fullName || "Lead details"}
            </DialogTitle>
            <DialogDescription>
              Submitted via {selectedLead?.formName} on{" "}
              {selectedLead ? formatDateTime(selectedLead.createdTime) : ""}
            </DialogDescription>
          </DialogHeader>

          {selectedLead ? (
            <div className="space-y-4">
              <div className="rounded-xl border border-border divide-y divide-border/60">
                {Object.entries(selectedLead.fieldData).map(([key, value]) => (
                  <div
                    key={key}
                    className="flex items-start justify-between gap-3 px-4 py-2.5 text-sm"
                  >
                    <span className="text-muted-foreground capitalize">
                      {key.replace(/_/g, " ")}
                    </span>
                    <span className="font-medium text-foreground text-right">
                      {value || "—"}
                    </span>
                  </div>
                ))}
              </div>

              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1.5">
                  Status
                </p>
                <Select
                  value={selectedLead.status}
                  onValueChange={(value) =>
                    updateMutation.mutate({
                      leadId: selectedLead._id,
                      payload: { status: value as MetaLeadStatus },
                    })
                  }
                >
                  <SelectTrigger className="rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
