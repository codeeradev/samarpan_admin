import { Separator } from "@/components/ui/separator";
import type { ReactNode } from "react";

interface PageHeaderProps {
  title: string;
  description?: string;
  action?: ReactNode;
}

export function PageHeader({ title, description, action }: PageHeaderProps) {
  return (
    <div className="mb-4 sm:mb-6">
      <div className="flex items-start justify-between gap-3 sm:gap-4">
        <div className="flex-1 min-w-0">
          <h1 className="text-lg sm:text-xl font-bold text-[#1E293B] font-display leading-snug">
            {title}
          </h1>
          {description && (
            <p className="text-xs sm:text-sm text-[#64748B] mt-0.5 sm:mt-1 leading-relaxed">
              {description}
            </p>
          )}
        </div>
        {action && (
          <div className="flex-shrink-0 flex flex-wrap items-center gap-2">
            {action}
          </div>
        )}
      </div>
      <Separator className="mt-3 sm:mt-4 bg-slate-100" />
    </div>
  );
}
