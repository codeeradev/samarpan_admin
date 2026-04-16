import { Badge } from "@/components/ui/badge";
import type {
  AppointmentStatus,
  DoctorAvailability,
  EnquiryStatus,
} from "@/types";

type StatusValue = AppointmentStatus | EnquiryStatus | DoctorAvailability;

interface StatusBadgeProps {
  status: StatusValue;
}

interface BadgeStyle {
  label: string;
  className: string;
}

const STATUS_MAP: Record<string, BadgeStyle> = {
  pending: {
    label: "Pending",
    className:
      "bg-yellow-50 text-yellow-700 border-yellow-200 hover:bg-yellow-50",
  },
  confirmed: {
    label: "Confirmed",
    className: "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-50",
  },
  completed: {
    label: "Completed",
    className: "bg-green-50 text-green-700 border-green-200 hover:bg-green-50",
  },
  cancelled: {
    label: "Cancelled",
    className: "bg-red-50 text-red-600 border-red-200 hover:bg-red-50",
  },
  new: {
    label: "New",
    className:
      "bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-50",
  },
  "in-progress": {
    label: "In Progress",
    className: "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-50",
  },
  resolved: {
    label: "Resolved",
    className:
      "bg-yellow-50 text-yellow-700 border-yellow-200 hover:bg-yellow-50",
  },
  available: {
    label: "Available",
    className: "bg-green-50 text-green-700 border-green-200 hover:bg-green-50",
  },
  "on-leave": {
    label: "On Leave",
    className:
      "bg-yellow-50 text-yellow-700 border-yellow-200 hover:bg-yellow-50",
  },
  busy: {
    label: "Busy",
    className:
      "bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-50",
  },
};

export function StatusBadge({ status }: StatusBadgeProps) {
  const style = STATUS_MAP[status] ?? {
    label: status,
    className: "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-50",
  };

  return (
    <Badge
      variant="outline"
      className={`text-xs font-medium px-2 py-0.5 rounded-lg ${style.className}`}
    >
      {style.label}
    </Badge>
  );
}
