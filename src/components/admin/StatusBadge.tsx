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
    className: "bg-accent text-accent-foreground border-accent",
  },
  confirmed: {
    label: "Confirmed",
    className: "bg-secondary/10 text-secondary border-secondary/20",
  },
  completed: {
    label: "Completed",
    className: "bg-primary/10 text-primary border-primary/20",
  },
  cancelled: {
    label: "Cancelled",
    className: "bg-destructive/10 text-destructive border-destructive/20",
  },
  new: {
    label: "New",
    className: "bg-accent text-accent-foreground border-accent",
  },
  "in-progress": {
    label: "In Progress",
    className: "bg-secondary/10 text-secondary border-secondary/20",
  },
  resolved: {
    label: "Resolved",
    className: "bg-primary/10 text-primary border-primary/20",
  },
  available: {
    label: "Available",
    className: "bg-primary/10 text-primary border-primary/20",
  },
  "on-leave": {
    label: "On Leave",
    className: "bg-muted text-muted-foreground border-border",
  },
  busy: {
    label: "Busy",
    className: "bg-secondary/10 text-secondary border-secondary/20",
  },
};

export function StatusBadge({ status }: StatusBadgeProps) {
  const style = STATUS_MAP[status] ?? {
    label: status,
    className: "bg-muted text-muted-foreground border-border",
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
