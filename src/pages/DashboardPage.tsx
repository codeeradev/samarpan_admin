import { PageHeader } from "@/components/admin/PageHeader";
import { StatCard } from "@/components/admin/StatCard";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import type {
  AnalyticsPageGroup,
  AnalyticsVisitorStats,
} from "@/apiCalls/analytics";
import { getDashboardApi } from "@/apiCalls/dashboard";
import { useAnalyticsDashboard } from "@/hooks/useAnalytics";
import { themeColor } from "@/lib/theme";
import { formatDate } from "@/types";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import {
  Activity,
  Calendar,
  Clock,
  Eye,
  FileImage,
  ImageIcon,
  type LucideIcon,
  MessageSquare,
  Users,
  UserRound,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

// ─── Skeleton keys ──────────────────────────────────────────────────────────

const SKELETON_STAT_KEYS = ["sk-stat-1", "sk-stat-2", "sk-stat-3", "sk-stat-4"];
const SKELETON_ANALYTICS_STAT_KEYS = [
  "sk-analytics-1",
  "sk-analytics-2",
  "sk-analytics-3",
  "sk-analytics-4",
  "sk-analytics-5",
];
const SKELETON_ROW_KEYS = [
  "sk-row-1",
  "sk-row-2",
  "sk-row-3",
  "sk-row-4",
  "sk-row-5",
];
const SKELETON_CELL_KEYS = ["sk-c1", "sk-c2", "sk-c3", "sk-c4", "sk-c5"];

type AnalyticsDisplayRow =
  | {
      type: "group";
      key: string;
      title: string;
      pageViews: number;
      visitors: number;
      group: AnalyticsPageGroup;
    }
  | {
      type: "page";
      key: string;
      title: string;
      pageViews: number;
      visitors: number;
    };

const decodePagePath = (page: string) => {
  try {
    return decodeURI(page);
  } catch {
    return page;
  }
};

const formatTitleWord = (word: string) => {
  if (!word) return word;
  return word.charAt(0).toLocaleUpperCase() + word.slice(1);
};

const formatPageTitle = (page: string) => {
  const cleanPage = decodePagePath(page).split("?")[0]?.split("#")[0] || "/";

  if (cleanPage === "/") {
    return "Home";
  }

  return cleanPage
    .split("/")
    .filter(Boolean)
    .map((part) =>
      part
        .split("-")
        .filter(Boolean)
        .map(formatTitleWord)
        .join(" "),
    )
    .join(" / ");
};

const emptyVisitorStats: AnalyticsVisitorStats = {
  total: 0,
  unique: 0,
  repeated: 0,
};

function VisitorStatsCard({
  icon: Icon,
  label,
  stats = emptyVisitorStats,
}: {
  icon: LucideIcon;
  label: string;
  stats?: AnalyticsVisitorStats;
}) {
  return (
    <Card className="shadow-card border border-border rounded-2xl overflow-hidden hover:shadow-elevated transition-colors duration-200">
      <CardContent className="p-4 sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
            <Icon size={18} className="text-primary" />
          </div>
          <div className="text-right">
            <p className="text-xs sm:text-sm font-medium text-muted-foreground leading-snug">
              {label}
            </p>
            <p className="text-xl sm:text-2xl font-bold text-foreground mt-0.5 sm:mt-1 font-display tabular-nums">
              {stats.total.toLocaleString()}
            </p>
          </div>
        </div>

        <div className="mt-4 space-y-2 text-xs sm:text-sm">
          <div className="flex items-center justify-between gap-3">
            <span className="text-muted-foreground">Total Visitors</span>
            <span className="font-semibold text-foreground tabular-nums">
              {stats.total.toLocaleString()}
            </span>
          </div>
          <div className="flex items-center justify-between gap-3">
            <span className="text-muted-foreground">Unique Visitors</span>
            <span className="font-semibold text-foreground tabular-nums">
              {stats.unique.toLocaleString()}
            </span>
          </div>
          <div className="flex items-center justify-between gap-3">
            <span className="text-muted-foreground">Repeated Visitors</span>
            <span className="font-semibold text-foreground tabular-nums">
              {stats.repeated.toLocaleString()}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

const buildAnalyticsRows = (
  groups: AnalyticsPageGroup[] = [],
  pages: { page: string; pageViews: number; visitors: number }[] = [],
): AnalyticsDisplayRow[] =>
  [
    ...groups.map((group) => ({
      type: "group" as const,
      key: `group-${group.key}`,
      title: group.title,
      pageViews: group.pageViews,
      visitors: group.visitors,
      group,
    })),
    ...pages.map((page) => ({
      type: "page" as const,
      key: `page-${page.page}`,
      title: formatPageTitle(page.page),
      pageViews: page.pageViews,
      visitors: page.visitors,
    })),
  ].sort((a, b) => {
    if (b.pageViews !== a.pageViews) return b.pageViews - a.pageViews;
    return a.title.localeCompare(b.title);
  });

// ─── Component ──────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const [selectedPageGroup, setSelectedPageGroup] =
    useState<AnalyticsPageGroup | null>(null);
  const gridColor = themeColor("border", 0.7);
  const mutedTextColor = themeColor("muted-foreground");
  const tooltipBorder = `1px solid ${themeColor("border")}`;
  const lineColor = themeColor("chart-1");
  const barColor = themeColor("chart-2");

  const {
    data: analytics,
    isLoading: analyticsLoading,
    error: analyticsError,
  } = useAnalyticsDashboard();

  const { data, isLoading: statsLoading } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: getDashboardApi,
  });

  const recent = data?.recentAppointments ?? [];
  const apptLoading = statsLoading;
  const totals = data?.totals;
  const charts = data?.charts;
  const analyticsRows = buildAnalyticsRows(
    analytics?.pageGroups,
    analytics?.topPages,
  );

  return (
    <div data-ocid="dashboard.page">
      <PageHeader
        title="Dashboard"
        description="Welcome to Samarpan Hospital Admin"
      />

      {/* ── Website Analytics ─────────────────────────────────────────────── */}
      <div className="mb-4 sm:mb-6" data-ocid="dashboard.analytics">
        <div className="mb-3">
          <h2 className="text-base sm:text-lg font-semibold text-foreground font-display">
            Website Analytics
          </h2>
        </div>

        {analyticsError ? (
          <Card className="shadow-card border border-destructive/30 rounded-2xl mb-4">
            <CardContent className="p-4 text-sm text-destructive">
              {analyticsError instanceof Error
                ? analyticsError.message
                : "Failed to load analytics"}
            </CardContent>
          </Card>
        ) : null}

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4 mb-4">
          {analyticsLoading ? (
            SKELETON_ANALYTICS_STAT_KEYS.map((k) => (
              <Card
                key={k}
                className="rounded-2xl shadow-card border border-border"
              >
                <CardContent className="p-5 space-y-3">
                  <Skeleton className="h-11 w-11 rounded-xl" />
                  <Skeleton className="h-4 w-24 rounded" />
                  <Skeleton className="h-7 w-20 rounded" />
                </CardContent>
              </Card>
            ))
          ) : (
            <>
              <VisitorStatsCard
                icon={Users}
                label="Total Visitors"
                stats={analytics?.totals.totalVisitors}
              />
              <VisitorStatsCard
                icon={Calendar}
                label="Today's Visitors"
                stats={analytics?.totals.todaysVisitors}
              />
              <VisitorStatsCard
                icon={Activity}
                label="Last 7 Days"
                stats={analytics?.totals.last7DaysVisitors}
              />
              <VisitorStatsCard
                icon={UserRound}
                label="Last 30 Days"
                stats={analytics?.totals.last30DaysVisitors}
              />
              <StatCard
                icon={Eye}
                label="Total Page Views"
                value={(analytics?.totals.totalPageViews ?? 0).toLocaleString()}
                subtitle="all tracked views"
                color="orange"
              />
            </>
          )}
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          <Card className="shadow-card border border-border rounded-2xl">
            <CardHeader className="pb-2 px-4 sm:px-6">
              <CardTitle className="text-sm sm:text-base font-semibold text-foreground font-display">
                Daily Visitors
              </CardTitle>
            </CardHeader>
            <CardContent className="px-2 sm:px-6">
              {analyticsLoading ? (
                <Skeleton className="h-[250px] w-full rounded-xl" />
              ) : (
                <div style={{ height: 250 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={(analytics?.dailyVisitors ?? []).map((row) => ({
                        day: row.day.slice(5),
                        visitors: row.visitors,
                      }))}
                      margin={{ top: 8, right: 8, left: -24, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                      <XAxis
                        dataKey="day"
                        tick={{ fontSize: 11, fill: mutedTextColor }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        tick={{ fontSize: 11, fill: mutedTextColor }}
                        axisLine={false}
                        tickLine={false}
                        allowDecimals={false}
                      />
                      <Tooltip
                        contentStyle={{
                          borderRadius: "12px",
                          border: tooltipBorder,
                          boxShadow: "0 4px 6px rgba(0,0,0,0.07)",
                          fontSize: 12,
                        }}
                      />
                      <Line
                        type="monotone"
                        dataKey="visitors"
                        stroke={lineColor}
                        strokeWidth={2.5}
                        dot={{ fill: lineColor, r: 4, strokeWidth: 0 }}
                        activeDot={{ r: 6, strokeWidth: 0 }}
                        name="Visitors"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="shadow-card border border-border rounded-2xl">
            <CardHeader className="pb-2 px-4 sm:px-6">
              <CardTitle className="text-sm sm:text-base font-semibold text-foreground font-display">
                Top Pages
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted">
                      {["Page", "Visitors", "Page Views"].map((col) => (
                        <th
                          key={col}
                          className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide py-3 px-5 whitespace-nowrap"
                        >
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {analyticsLoading ? (
                      SKELETON_ROW_KEYS.map((rk) => (
                        <tr
                          key={`analytics-${rk}`}
                          className="border-b border-border/60"
                        >
                          {["page", "visitors", "views"].map((ck) => (
                            <td key={ck} className="px-5 py-3">
                              <Skeleton className="h-4 w-3/4 rounded" />
                            </td>
                          ))}
                        </tr>
                      ))
                    ) : analyticsRows.length > 0 ? (
                      analyticsRows.map((row) => (
                        <tr
                          key={row.key}
                          className="border-b border-border/60 hover:bg-muted transition-colors"
                        >
                          <td className="px-5 py-3 font-medium text-foreground max-w-[280px] truncate">
                            {row.type === "group" ? (
                              <button
                                type="button"
                                className="font-medium text-primary hover:text-secondary transition-colors"
                                onClick={() => setSelectedPageGroup(row.group)}
                              >
                                {row.title}
                              </button>
                            ) : (
                              row.title
                            )}
                          </td>
                          <td className="px-5 py-3 text-muted-foreground whitespace-nowrap tabular-nums">
                            {row.visitors.toLocaleString()}
                          </td>
                          <td className="px-5 py-3 text-muted-foreground whitespace-nowrap tabular-nums">
                            {row.pageViews.toLocaleString()}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td
                          colSpan={3}
                          className="px-5 py-6 text-sm text-muted-foreground text-center"
                        >
                          No analytics data yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog
        open={Boolean(selectedPageGroup)}
        onOpenChange={(open) => {
          if (!open) setSelectedPageGroup(null);
        }}
      >
        <DialogContent className="sm:max-w-3xl max-h-[86vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle>{selectedPageGroup?.title} Pages</DialogTitle>
            <DialogDescription>
              Detailed page views for this website section.
            </DialogDescription>
          </DialogHeader>

          <div className="max-h-[60vh] overflow-y-auto rounded-xl border border-border">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-muted">
                <tr className="border-b border-border">
                  {["Page", "Visitors", "Page Views"].map((col) => (
                    <th
                      key={col}
                      className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide py-3 px-4 whitespace-nowrap"
                    >
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(selectedPageGroup?.pages ?? []).map((page) => (
                  <tr
                    key={page.page}
                    className="border-b border-border/60 last:border-b-0"
                  >
                    <td className="px-4 py-3 font-medium text-foreground">
                      {formatPageTitle(page.page)}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground whitespace-nowrap tabular-nums">
                      {page.visitors.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground whitespace-nowrap tabular-nums">
                      {page.pageViews.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Stat Cards ─────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-4 sm:mb-6">
        {statsLoading ? (
          SKELETON_STAT_KEYS.map((k) => (
            <Card
              key={k}
              className="rounded-2xl shadow-card border border-border"
            >
              <CardContent className="p-5 space-y-3">
                <Skeleton className="h-11 w-11 rounded-xl" />
                <Skeleton className="h-4 w-24 rounded" />
                <Skeleton className="h-7 w-20 rounded" />
              </CardContent>
            </Card>
          ))
        ) : (
          <>
            <StatCard
              icon={Users}
              label="Total Patients"
              value={(totals?.totalPatients ?? 0).toLocaleString()}
              subtitle="total patients"
              color="gold"
            />
            <StatCard
              icon={Calendar}
              label="Appointments"
              value={(totals?.appointmentsThisWeek ?? 0).toLocaleString()}
              subtitle="this week"
              color="gold-deep"
            />
            <StatCard
              icon={UserRound}
              label="Available Doctors"
              value={(totals?.totalDoctors ?? 0).toLocaleString()}
              subtitle="available doctors"
              color="green"
            />
            <StatCard
              icon={MessageSquare}
              label="Pending Appointments"
              value={(data?.appointmentsByStatus?.pending ?? 0).toLocaleString()}
              subtitle="needs action"
              color="orange"
            />
          </>
        )}
      </div>

      {/* ── Charts ─────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 mb-4 sm:mb-6">
        {/* Line chart — Appointments This Week */}
        <Card
          className="shadow-card border border-border rounded-2xl"
          data-ocid="dashboard.weekly_chart"
        >
          <CardHeader className="pb-2 px-4 sm:px-6">
            <CardTitle className="text-sm sm:text-base font-semibold text-foreground font-display">
              Appointments This Week
            </CardTitle>
          </CardHeader>
          <CardContent className="px-2 sm:px-6">
            {statsLoading ? (
              <Skeleton className="h-[250px] w-full rounded-xl" />
            ) : (
              <div style={{ height: 250 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={(charts?.appointmentsLast7Days ?? []).map((row) => ({
                      day: row.day,
                      appointments: row.count,
                    }))}
                    margin={{ top: 8, right: 8, left: -24, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                    <XAxis
                      dataKey="day"
                      tick={{ fontSize: 11, fill: mutedTextColor }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 11, fill: mutedTextColor }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip
                      contentStyle={{
                        borderRadius: "12px",
                        border: tooltipBorder,
                        boxShadow: "0 4px 6px rgba(0,0,0,0.07)",
                        fontSize: 12,
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="appointments"
                      stroke={lineColor}
                      strokeWidth={2.5}
                      dot={{ fill: lineColor, r: 4, strokeWidth: 0 }}
                      activeDot={{ r: 6, strokeWidth: 0 }}
                      name="Appointments"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Bar chart — Patient Growth */}
        <Card
          className="shadow-card border border-border rounded-2xl"
          data-ocid="dashboard.growth_chart"
        >
          <CardHeader className="pb-2 px-4 sm:px-6">
            <CardTitle className="text-sm sm:text-base font-semibold text-foreground font-display">
              Patient Growth
            </CardTitle>
          </CardHeader>
          <CardContent className="px-2 sm:px-6">
            {statsLoading ? (
              <Skeleton className="h-[250px] w-full rounded-xl" />
            ) : (
              <div style={{ height: 250 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={(charts?.patientsLast6Months ?? []).map((row) => ({
                      month: row.month,
                      patients: row.count,
                    }))}
                    margin={{ top: 8, right: 8, left: -24, bottom: 0 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke={gridColor}
                      vertical={false}
                    />
                    <XAxis
                      dataKey="month"
                      tick={{ fontSize: 11, fill: mutedTextColor }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 11, fill: mutedTextColor }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip
                      contentStyle={{
                        borderRadius: "12px",
                        border: tooltipBorder,
                        boxShadow: "0 4px 6px rgba(0,0,0,0.07)",
                        fontSize: 12,
                      }}
                    />
                    <Bar
                      dataKey="patients"
                      fill={barColor}
                      radius={[6, 6, 0, 0]}
                      name="New Patients"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Recent Appointments ─────────────────────────────────────────────── */}
      <Card
        className="shadow-card border border-border rounded-2xl"
        data-ocid="dashboard.recent_appointments"
      >
        <CardHeader className="pb-2 flex flex-row items-center justify-between gap-2 px-4 sm:px-6">
          <div className="flex items-center gap-2 min-w-0">
            <Clock size={16} className="text-primary shrink-0" />
            <CardTitle className="text-sm sm:text-base font-semibold text-foreground truncate font-display">
              Recent Appointments
            </CardTitle>
          </div>
          <a
            href="/appointments"
            className="text-xs sm:text-sm font-medium text-primary hover:text-secondary transition-colors shrink-0"
            data-ocid="dashboard.view_all_appointments.link"
          >
            View All →
          </a>
        </CardHeader>
        <CardContent className="p-0">
          {/* Desktop table — hidden on mobile */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted">
                  {["Patient", "Doctor", "Date / Time", "Reason", "Status"].map(
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
                {apptLoading
                  ? SKELETON_ROW_KEYS.map((rk) => (
                      <tr key={rk} className="border-b border-border/60">
                        {SKELETON_CELL_KEYS.map((ck) => (
                          <td key={ck} className="px-5 py-3">
                            <Skeleton className="h-4 w-3/4 rounded" />
                          </td>
                        ))}
                      </tr>
                    ))
                  : recent.map((appt, idx) => (
                      <tr
                        key={appt._id}
                        className="border-b border-border/60 hover:bg-muted transition-colors"
                        data-ocid={`dashboard.recent_appointments.item.${idx + 1}`}
                      >
                        <td className="px-5 py-3 font-medium text-foreground whitespace-nowrap">
                          {appt.fullName}
                        </td>
                        <td className="px-5 py-3 text-muted-foreground whitespace-nowrap">
                          {appt.doctorName}
                        </td>
                        <td className="px-5 py-3 text-muted-foreground whitespace-nowrap">
                          {formatDate(appt.appointmentDate)}
                        </td>
                        <td className="px-5 py-3 text-muted-foreground max-w-[200px] truncate">
                          {appt.reason}
                        </td>
                        <td className="px-5 py-3">
                          <StatusBadge status={appt.status} />
                        </td>
                      </tr>
                    ))}
              </tbody>
            </table>
          </div>

          {/* Mobile card list — visible only on small screens */}
          <div className="md:hidden divide-y divide-border/60">
            {apptLoading
              ? SKELETON_ROW_KEYS.map((rk) => (
                  <div key={rk} className="px-4 py-3 space-y-2">
                    <Skeleton className="h-4 w-1/2 rounded" />
                    <Skeleton className="h-3 w-2/3 rounded" />
                    <Skeleton className="h-3 w-1/3 rounded" />
                  </div>
                ))
              : recent.map((appt, idx) => (
                  <div
                    key={appt._id}
                    className="px-4 py-3 space-y-1.5"
                    data-ocid={`dashboard.recent_appointments.item.${idx + 1}`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="font-medium text-sm text-foreground truncate">
                        {appt.fullName}
                      </span>
                      <StatusBadge status={appt.status} />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      <span className="font-medium">Dr.</span> {appt.doctorName}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(appt.appointmentDate)}
                    </p>
                    {appt.reason && (
                      <p className="text-xs text-muted-foreground truncate">
                        {appt.reason}
                      </p>
                    )}
                  </div>
                ))}
          </div>
        </CardContent>
      </Card>

      {/* ── Content snapshot ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mt-4 sm:mt-6">
        {statsLoading ? (
          SKELETON_STAT_KEYS.map((k) => (
            <Card
              key={`content-${k}`}
              className="rounded-2xl shadow-card border border-border"
            >
              <CardContent className="p-5 space-y-3">
                <Skeleton className="h-11 w-11 rounded-xl" />
                <Skeleton className="h-4 w-24 rounded" />
                <Skeleton className="h-7 w-20 rounded" />
              </CardContent>
            </Card>
          ))
        ) : (
          <>
            <StatCard
              icon={FileImage}
              label="Blogs"
              value={(totals?.totalBlogs ?? 0).toLocaleString()}
              subtitle="total posts"
              color="purple"
            />
            <StatCard
              icon={ImageIcon}
              label="Gallery Images"
              value={(totals?.totalGallery ?? 0).toLocaleString()}
              subtitle="uploaded"
              color="gold"
            />
            <StatCard
              icon={MessageSquare}
              label="Reviews"
              value={(totals?.totalReviews ?? 0).toLocaleString()}
              subtitle="saved"
              color="green"
            />
            <StatCard
              icon={Calendar}
              label="Total Appointments"
              value={(totals?.totalAppointments ?? 0).toLocaleString()}
              subtitle="all time"
              color="gold-deep"
            />
          </>
        )}
      </div>
    </div>
  );
}
