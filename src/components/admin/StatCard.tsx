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
    bg: "bg-primary/10",
    iconBg: "bg-primary/20",
    iconColor: "text-primary",
  },
  "gold-deep": {
    bg: "bg-secondary/10",
    iconBg: "bg-secondary/20",
    iconColor: "text-secondary",
  },
  green: {
    bg: "bg-[oklch(var(--chart-4)/0.12)]",
    iconBg: "bg-[oklch(var(--chart-4)/0.2)]",
    iconColor: "text-[oklch(var(--chart-4))]",
  },
  orange: {
    bg: "bg-[oklch(var(--chart-5)/0.12)]",
    iconBg: "bg-[oklch(var(--chart-5)/0.2)]",
    iconColor: "text-[oklch(var(--chart-5))]",
  },
  purple: {
    bg: "bg-[oklch(var(--chart-2)/0.12)]",
    iconBg: "bg-[oklch(var(--chart-2)/0.2)]",
    iconColor: "text-[oklch(var(--chart-2))]",
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
    <Card className="shadow-card border border-border rounded-2xl overflow-hidden hover:shadow-elevated transition-colors duration-200">
      <CardContent className="p-4 sm:p-5">
        <div className="flex items-start justify-between gap-2">
          <div
            className={`w-10 h-10 sm:w-11 sm:h-11 rounded-xl ${styles.bg} ${styles.iconBg} flex items-center justify-center flex-shrink-0`}
          >
            <Icon size={18} className={styles.iconColor} />
          </div>
          {trend !== undefined && (
            <span
              className={`flex items-center gap-0.5 text-xs font-medium px-1.5 sm:px-2 py-1 rounded-lg flex-shrink-0 ${
                isPositive
                  ? "bg-primary/10 text-primary"
                  : "bg-destructive/10 text-destructive"
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
          <p className="text-xs sm:text-sm font-medium text-muted-foreground leading-snug">
            {label}
          </p>
          <p className="text-xl sm:text-2xl font-bold text-foreground mt-0.5 sm:mt-1 font-display tabular-nums">
            {value}
          </p>
          {subtitle && (
            <p className="text-xs text-muted-foreground mt-0.5 sm:mt-1 leading-snug">
              {subtitle}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
