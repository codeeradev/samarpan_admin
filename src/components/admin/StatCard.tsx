import { Card, CardContent } from "@/components/ui/card";
import { TrendingDown, TrendingUp } from "lucide-react";
import type { LucideIcon } from "lucide-react";

type ColorVariant = "gold" | "gold-deep" | "green" | "orange" | "purple";

interface StatCardProps {
  icon: LucideIcon;
  label: string;
  value: string | number;
  subtitle?: string;
  trend?: number; // positive = up, negative = down
  color?: ColorVariant;
}

const colorMap: Record<
  ColorVariant,
  { bg: string; iconBg: string; iconColor: string }
> = {
  gold: {
    bg: "bg-amber-50",
    iconBg: "bg-amber-100",
    iconColor: "text-[#D89F00]",
  },
  "gold-deep": {
    bg: "bg-yellow-50",
    iconBg: "bg-yellow-100",
    iconColor: "text-[#A67C00]",
  },
  green: {
    bg: "bg-[#F0FDF4]",
    iconBg: "bg-[#DCFCE7]",
    iconColor: "text-[#16A34A]",
  },
  orange: {
    bg: "bg-[#FFF7ED]",
    iconBg: "bg-[#FFEDD5]",
    iconColor: "text-[#EA580C]",
  },
  purple: {
    bg: "bg-[#FAF5FF]",
    iconBg: "bg-[#EDE9FE]",
    iconColor: "text-[#7C3AED]",
  },
};

export function StatCard({
  icon: Icon,
  label,
  value,
  subtitle,
  trend,
  color = "gold",
}: StatCardProps) {
  const styles = colorMap[color];
  const isPositive = trend !== undefined && trend >= 0;

  return (
    <Card className="shadow-card border border-slate-100 rounded-2xl overflow-hidden hover:shadow-elevated transition-colors duration-200">
      <CardContent className="p-4 sm:p-5">
        <div className="flex items-start justify-between gap-2">
          <div
            className={`w-10 h-10 sm:w-11 sm:h-11 rounded-xl ${styles.iconBg} flex items-center justify-center flex-shrink-0`}
          >
            <Icon size={18} className={styles.iconColor} />
          </div>
          {trend !== undefined && (
            <span
              className={`flex items-center gap-0.5 text-xs font-medium px-1.5 sm:px-2 py-1 rounded-lg flex-shrink-0 ${
                isPositive
                  ? "bg-green-50 text-green-600"
                  : "bg-red-50 text-red-500"
              }`}
            >
              {isPositive ? (
                <TrendingUp size={11} />
              ) : (
                <TrendingDown size={11} />
              )}
              <span className="hidden xs:inline">
                {Math.abs(trend).toFixed(2)}%
              </span>
              <span className="xs:hidden">{Math.abs(trend).toFixed(1)}%</span>
            </span>
          )}
        </div>

        <div className="mt-3 sm:mt-4">
          <p className="text-xs sm:text-sm font-medium text-[#64748B] leading-snug">
            {label}
          </p>
          <p className="text-xl sm:text-2xl font-bold text-[#1E293B] mt-0.5 sm:mt-1 font-display tabular-nums">
            {value}
          </p>
          {subtitle && (
            <p className="text-xs text-[#94A3B8] mt-0.5 sm:mt-1 leading-snug">
              {subtitle}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
