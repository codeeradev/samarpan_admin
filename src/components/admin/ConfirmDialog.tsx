import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "destructive" | "default";
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  variant = "destructive",
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={(v) => !v && onCancel()}>
      <AlertDialogContent
        className="rounded-2xl border border-slate-100 shadow-elevated"
        data-ocid="confirm.dialog"
      >
        <AlertDialogHeader>
          <AlertDialogTitle
            className="text-[#1E293B]"
            style={{ fontFamily: "Space Grotesk, sans-serif" }}
          >
            {title}
          </AlertDialogTitle>
          <AlertDialogDescription className="text-[#64748B]">
            {message}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel
            onClick={onCancel}
            className="rounded-xl border-slate-200 text-[#64748B] hover:bg-slate-50"
            data-ocid="confirm.cancel_button"
          >
            {cancelLabel}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            data-ocid="confirm.confirm_button"
            className={
              variant === "destructive"
                ? "rounded-xl bg-red-500 hover:bg-red-600 text-white"
                : "rounded-xl bg-[#0EA5E9] hover:bg-[#0284C7] text-white"
            }
          >
            {confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
