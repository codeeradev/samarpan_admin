import { PageHeader } from "@/components/admin/PageHeader";
import { StatusBadge } from "@/components/admin/StatusBadge";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { fetchEnquiries } from "@/services/mockData";
import { formatDate } from "@/types";
import type { Enquiry, EnquiryStatus } from "@/types";
import { useQuery } from "@tanstack/react-query";
import {
  CheckCheck,
  Eye,
  Mail,
  MessageSquare,
  Phone,
  Search,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

const SKELETON_ROWS = ["sk-1", "sk-2", "sk-3", "sk-4", "sk-5"];

type StatusFilter = "all" | EnquiryStatus;

// ─── Mobile Enquiry Card ──────────────────────────────────────────────────────

interface EnquiryCardProps {
  enquiry: Enquiry;
  index: number;
  onView: () => void;
  onResolve: () => void;
}

function EnquiryCard({ enquiry, index, onView, onResolve }: EnquiryCardProps) {
  return (
    <div
      className="bg-white border border-[#E2E8F0] rounded-2xl p-4 shadow-sm"
      data-ocid={`enquiries.item.${index + 1}`}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="min-w-0">
          <p className="font-semibold text-sm text-[#1E293B] leading-tight truncate">
            {enquiry.name}
          </p>
          <p className="text-xs text-[#94A3B8] mt-0.5">
            {formatDate(enquiry.submittedAt)}
          </p>
        </div>
        <StatusBadge status={enquiry.status} />
      </div>

      <div className="space-y-1 mb-3 text-xs">
        <a
          href={`mailto:${enquiry.email}`}
          className="flex items-center gap-1.5 text-primary hover:underline"
        >
          <Mail size={11} />
          <span className="truncate">{enquiry.email}</span>
        </a>
        <a
          href={`tel:${enquiry.phone}`}
          className="flex items-center gap-1.5 text-secondary hover:underline"
        >
          <Phone size={11} />
          <span>{enquiry.phone}</span>
        </a>
      </div>

      {enquiry.subject && (
        <p className="text-xs text-[#475569] font-medium mb-3 line-clamp-2">
          {enquiry.subject}
        </p>
      )}

      <div className="flex flex-wrap gap-2 pt-2 border-t border-[#F1F5F9]">
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="h-8 px-3 text-xs rounded-xl border-[#E2E8F0] hover:bg-[#F1F5F9] gap-1.5 flex-1 sm:flex-none"
          onClick={onView}
          data-ocid={`enquiries.view_button.${index + 1}`}
        >
          <Eye size={12} className="text-[#64748B]" />
          View
        </Button>
        {enquiry.status !== "resolved" && (
          <Button
            type="button"
            size="sm"
            className="h-8 px-3 text-xs rounded-xl bg-primary hover:bg-secondary text-white gap-1.5 flex-1 sm:flex-none"
            onClick={onResolve}
            data-ocid={`enquiries.resolve_button.${index + 1}`}
          >
            <CheckCheck size={12} />
            Resolve
          </Button>
        )}
      </div>
    </div>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function EnquiriesPage() {
  const { data = [], isLoading } = useQuery({
    queryKey: ["enquiries"],
    queryFn: fetchEnquiries,
  });

  const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
  const [initialized, setInitialized] = useState(false);
  if (!isLoading && !initialized) {
    setEnquiries(data);
    setInitialized(true);
  }

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [selectedEnquiry, setSelectedEnquiry] = useState<Enquiry | null>(null);
  const [replyText, setReplyText] = useState("");

  const newCount = useMemo(
    () => enquiries.filter((e) => e.status === "new").length,
    [enquiries],
  );

  const filteredEnquiries = useMemo(() => {
    const q = search.toLowerCase().trim();
    return enquiries.filter((e) => {
      const matchSearch =
        !q ||
        e.name.toLowerCase().includes(q) ||
        e.email.toLowerCase().includes(q) ||
        e.subject.toLowerCase().includes(q);
      const matchStatus = statusFilter === "all" || e.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [enquiries, search, statusFilter]);

  function markResolved(id: string) {
    setEnquiries((prev) =>
      prev.map((e) =>
        e.id === id ? { ...e, status: "resolved" as EnquiryStatus } : e,
      ),
    );
    if (selectedEnquiry?.id === id) {
      setSelectedEnquiry((prev) =>
        prev ? { ...prev, status: "resolved" as EnquiryStatus } : null,
      );
    }
    toast.success("Enquiry marked as resolved.");
  }

  function handleOpenEnquiry(enquiry: Enquiry) {
    setSelectedEnquiry(enquiry);
    setReplyText("");
  }

  function handleSendReply() {
    if (!replyText.trim() || !selectedEnquiry) return;
    toast.success("Reply sent successfully.");
    setReplyText("");
    markResolved(selectedEnquiry.id);
    setSelectedEnquiry(null);
  }

  return (
    <div data-ocid="enquiries.page">
      {/* Page Header */}
      <PageHeader
        title="Enquiries"
        description="View and respond to patient and visitor enquiries."
        action={
          newCount > 0 ? (
            <Badge className="bg-orange-100 text-orange-700 border border-orange-200 rounded-full px-3 py-1 text-xs font-semibold">
              {newCount} New
            </Badge>
          ) : undefined
        }
      />

      {/* Filter Bar */}
      <div
        className="flex flex-col sm:flex-row gap-3 mb-5"
        data-ocid="enquiries.filter_bar"
      >
        <div className="relative flex-1">
          <Search
            size={15}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]"
          />
          <Input
            placeholder="Search by name, email or subject..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9 rounded-xl border-[#E2E8F0] bg-white text-sm focus-visible:ring-primary/30"
            data-ocid="enquiries.search_input"
          />
        </div>
        <Select
          value={statusFilter}
          onValueChange={(v) => setStatusFilter(v as StatusFilter)}
        >
          <SelectTrigger
            className="w-full sm:w-44 h-9 rounded-xl border-[#E2E8F0] bg-white text-sm"
            data-ocid="enquiries.status_filter"
          >
            <SelectValue placeholder="All Statuses" />
          </SelectTrigger>
          <SelectContent className="rounded-xl">
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="new">New</SelectItem>
            <SelectItem value="in-progress">In Progress</SelectItem>
            <SelectItem value="resolved">Resolved</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Mobile card list (visible on small screens) */}
      <div className="flex flex-col gap-3 md:hidden">
        {isLoading ? (
          SKELETON_ROWS.map((key) => (
            <div
              key={key}
              className="bg-white border border-[#E2E8F0] rounded-2xl p-4 shadow-sm space-y-3"
            >
              <div className="flex items-start justify-between">
                <div className="space-y-1.5">
                  <Skeleton className="h-4 w-28 rounded" />
                  <Skeleton className="h-3 w-20 rounded" />
                </div>
                <Skeleton className="h-5 w-16 rounded-lg" />
              </div>
              <Skeleton className="h-3 w-36 rounded" />
              <Skeleton className="h-3 w-24 rounded" />
              <Skeleton className="h-7 w-full rounded-xl" />
            </div>
          ))
        ) : filteredEnquiries.length === 0 ? (
          <div
            className="bg-white border border-[#E2E8F0] rounded-2xl p-10 text-center shadow-sm"
            data-ocid="enquiries.empty_state"
          >
            <div className="flex flex-col items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-[#F1F5F9] flex items-center justify-center">
                <MessageSquare size={22} className="text-[#94A3B8]" />
              </div>
              <p className="text-sm font-medium text-[#1E293B]">
                No enquiries found
              </p>
              <p className="text-xs text-[#94A3B8]">
                {search || statusFilter !== "all"
                  ? "Try adjusting your search or filter."
                  : "No enquiries have been submitted yet."}
              </p>
            </div>
          </div>
        ) : (
          filteredEnquiries.map((enquiry, index) => (
            <EnquiryCard
              key={enquiry.id}
              enquiry={enquiry}
              index={index}
              onView={() => handleOpenEnquiry(enquiry)}
              onResolve={() => markResolved(enquiry.id)}
            />
          ))
        )}
      </div>

      {/* Desktop Table (hidden on small screens) */}
      <div
        className="hidden md:block rounded-2xl border border-[#E2E8F0] bg-white shadow-sm overflow-hidden"
        data-ocid="enquiries.table"
      >
        <Table>
          <TableHeader>
            <TableRow className="bg-[#F8FAFC] hover:bg-[#F8FAFC]">
              <TableHead className="text-xs font-semibold text-[#64748B] uppercase tracking-wide py-3 pl-5">
                Name
              </TableHead>
              <TableHead className="text-xs font-semibold text-[#64748B] uppercase tracking-wide py-3">
                Email
              </TableHead>
              <TableHead className="text-xs font-semibold text-[#64748B] uppercase tracking-wide py-3 hidden md:table-cell">
                Subject
              </TableHead>
              <TableHead className="text-xs font-semibold text-[#64748B] uppercase tracking-wide py-3 hidden lg:table-cell">
                Date Submitted
              </TableHead>
              <TableHead className="text-xs font-semibold text-[#64748B] uppercase tracking-wide py-3">
                Status
              </TableHead>
              <TableHead className="text-xs font-semibold text-[#64748B] uppercase tracking-wide py-3 pr-5 text-right">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              SKELETON_ROWS.map((key) => (
                <TableRow key={key} className="hover:bg-transparent">
                  <TableCell className="pl-5 py-4">
                    <div className="space-y-1.5">
                      <Skeleton className="h-3.5 w-28 rounded" />
                      <Skeleton className="h-3 w-20 rounded" />
                    </div>
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-3.5 w-36 rounded" />
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <Skeleton className="h-3.5 w-40 rounded" />
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">
                    <Skeleton className="h-3.5 w-24 rounded" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-6 w-16 rounded-lg" />
                  </TableCell>
                  <TableCell className="pr-5">
                    <Skeleton className="h-7 w-20 rounded-lg ml-auto" />
                  </TableCell>
                </TableRow>
              ))
            ) : filteredEnquiries.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="text-center py-16"
                  data-ocid="enquiries.empty_state"
                >
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-[#F1F5F9] flex items-center justify-center">
                      <MessageSquare size={22} className="text-[#94A3B8]" />
                    </div>
                    <p className="text-sm font-medium text-[#1E293B]">
                      No enquiries found
                    </p>
                    <p className="text-xs text-[#94A3B8]">
                      {search || statusFilter !== "all"
                        ? "Try adjusting your search or filter."
                        : "No enquiries have been submitted yet."}
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredEnquiries.map((enquiry, index) => (
                <TableRow
                  key={enquiry.id}
                  className="border-b border-[#F1F5F9] hover:bg-[#F8FAFC] transition-colors"
                  data-ocid={`enquiries.item.${index + 1}`}
                >
                  <TableCell className="pl-5 py-4">
                    <p className="font-semibold text-sm text-[#1E293B] leading-tight">
                      {enquiry.name}
                    </p>
                    <p className="text-xs text-[#94A3B8] mt-0.5">
                      {enquiry.phone}
                    </p>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-[#475569] truncate max-w-[160px] block">
                      {enquiry.email}
                    </span>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <span className="text-sm text-[#475569] max-w-[200px] block truncate">
                      {enquiry.subject}
                    </span>
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">
                    <span className="text-sm text-[#64748B]">
                      {formatDate(enquiry.submittedAt)}
                    </span>
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={enquiry.status} />
                  </TableCell>
                  <TableCell className="pr-5">
                    <div className="flex items-center gap-2 justify-end">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="h-8 w-8 p-0 rounded-lg border-[#E2E8F0] hover:bg-primary/10 hover:border-primary/30"
                        onClick={() => handleOpenEnquiry(enquiry)}
                        data-ocid={`enquiries.view_button.${index + 1}`}
                        title="View details"
                      >
                        <Eye size={14} className="text-[#64748B]" />
                      </Button>
                      {enquiry.status !== "resolved" && (
                        <Button
                          type="button"
                          size="sm"
                          className="h-8 px-3 rounded-lg bg-primary hover:bg-secondary text-white text-xs font-medium gap-1.5"
                          onClick={() => markResolved(enquiry.id)}
                          data-ocid={`enquiries.resolve_button.${index + 1}`}
                        >
                          <CheckCheck size={13} />
                          Resolve
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* View Enquiry Modal */}
      <Dialog
        open={!!selectedEnquiry}
        onOpenChange={(open) => {
          if (!open) setSelectedEnquiry(null);
        }}
      >
        <DialogContent
          className="max-w-[95vw] sm:max-w-lg rounded-2xl p-0 overflow-hidden max-h-[90vh] flex flex-col"
          data-ocid="enquiries.dialog"
        >
          <DialogHeader className="px-5 sm:px-6 pt-5 sm:pt-6 pb-4 border-b border-[#F1F5F9] flex-shrink-0">
            <DialogTitle className="text-base font-bold text-[#1E293B]">
              Enquiry Details
            </DialogTitle>
          </DialogHeader>

          {selectedEnquiry && (
            <>
              <div className="px-5 sm:px-6 py-4 sm:py-5 space-y-4 sm:space-y-5 overflow-y-auto flex-1">
                {/* Name + Status row */}
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-bold text-[#1E293B] text-base leading-tight break-words">
                      {selectedEnquiry.name}
                    </p>
                    <p className="text-xs text-[#94A3B8] mt-0.5">
                      {formatDate(selectedEnquiry.submittedAt)}
                    </p>
                  </div>
                  <div className="flex-shrink-0">
                    <StatusBadge status={selectedEnquiry.status} />
                  </div>
                </div>

                {/* Contact info — tappable links on mobile */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="flex items-start gap-2.5">
                    <div className="mt-0.5 w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Mail size={13} className="text-primary" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] font-medium text-[#94A3B8] uppercase tracking-wide">
                        Email
                      </p>
                      <a
                        href={`mailto:${selectedEnquiry.email}`}
                        className="text-sm text-primary font-medium hover:underline break-all"
                      >
                        {selectedEnquiry.email}
                      </a>
                    </div>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <div className="mt-0.5 w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Phone size={13} className="text-primary" />
                    </div>
                    <div>
                      <p className="text-[10px] font-medium text-[#94A3B8] uppercase tracking-wide">
                        Phone
                      </p>
                      <a
                        href={`tel:${selectedEnquiry.phone}`}
                        className="text-sm text-primary font-medium hover:underline"
                      >
                        {selectedEnquiry.phone}
                      </a>
                    </div>
                  </div>
                </div>

                <Separator className="bg-[#F1F5F9]" />

                {/* Subject */}
                <div>
                  <p className="text-[10px] font-semibold text-[#94A3B8] uppercase tracking-wide mb-1.5">
                    Subject
                  </p>
                  <p className="text-sm font-semibold text-[#1E293B] break-words">
                    {selectedEnquiry.subject}
                  </p>
                </div>

                {/* Message */}
                <div>
                  <p className="text-[10px] font-semibold text-[#94A3B8] uppercase tracking-wide mb-1.5">
                    Message
                  </p>
                  <div className="bg-[#F8FAFC] rounded-xl p-3.5 border border-[#E2E8F0]">
                    <p className="text-sm text-[#475569] leading-relaxed break-words whitespace-pre-wrap">
                      {selectedEnquiry.message}
                    </p>
                  </div>
                </div>

                {/* Reply field */}
                {selectedEnquiry.status !== "resolved" && (
                  <div>
                    <p className="text-[10px] font-semibold text-[#94A3B8] uppercase tracking-wide mb-1.5">
                      Reply
                    </p>
                    <Textarea
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      placeholder="Type your reply here…"
                      className="rounded-xl border-[#E2E8F0] text-sm resize-none focus-visible:ring-primary/30 min-h-[100px]"
                      data-ocid="enquiries.reply_textarea"
                    />
                  </div>
                )}
              </div>

              <DialogFooter className="px-5 sm:px-6 py-4 border-t border-[#F1F5F9] bg-[#F8FAFC] flex-row gap-2 justify-end flex-shrink-0">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="rounded-xl h-9 px-4 border-[#E2E8F0] text-[#475569] hover:bg-white"
                  onClick={() => setSelectedEnquiry(null)}
                  data-ocid="enquiries.close_button"
                >
                  Close
                </Button>
                {selectedEnquiry.status !== "resolved" &&
                  (replyText.trim() ? (
                    <Button
                      type="button"
                      size="sm"
                      className="rounded-xl h-9 px-4 bg-primary hover:bg-secondary text-white font-medium gap-1.5"
                      onClick={handleSendReply}
                      data-ocid="enquiries.send_reply_button"
                    >
                      <Mail size={14} />
                      Send Reply
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      size="sm"
                      className="rounded-xl h-9 px-4 bg-primary hover:bg-secondary text-white font-medium gap-1.5"
                      onClick={() => {
                        markResolved(selectedEnquiry.id);
                        setSelectedEnquiry(null);
                      }}
                      data-ocid="enquiries.dialog_resolve_button"
                    >
                      <CheckCheck size={14} />
                      Mark as Resolved
                    </Button>
                  ))}
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
