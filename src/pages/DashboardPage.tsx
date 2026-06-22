import { PageHeader } from "@/components/admin/PageHeader";
import { StatCard } from "@/components/admin/StatCard";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { getMetaOverviewApi, getMetaStatusApi } from "@/apiCalls/metaAnalytics";
import { getSeoReportApi } from "@/apiCalls/seoReport";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
import { useAuth } from "@/hooks/useAuth";
import { canAccessPath } from "@/lib/admin-access";
import { themeColor } from "@/lib/theme";
import { formatDate } from "@/types";
import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { useState } from "react";
import {
  Activity,
  BarChart3,
  Calendar,
  Clock,
  Eye,
  Facebook,
  FileImage,
  ImageIcon,
  Instagram,
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

const getSearchParam = (page: string, key: string) => {
  const query = page.split("?")[1]?.split("#")[0] || "";
  return new URLSearchParams(query).get(key);
};

const formatSlugTitle = (value: string) =>
  decodePagePath(value)
    .split("-")
    .filter(Boolean)
    .map((word) => {
      const normalizedWord = word.toLowerCase();
      if (normalizedWord === "ent") return "ENT";
      return formatTitleWord(word);
    })
    .join(" ");

const formatPageTitle = (page: string, groupKey?: string) => {
  const decodedPage = decodePagePath(page);
  const cleanPage = decodedPage.split("?")[0]?.split("#")[0] || "/";

  if (cleanPage === "/") {
    if (decodedPage.includes("#blog")) {
      return "Blog Categories Section";
    }

    return "Home";
  }

  if (groupKey === "blog-listing-pages") {
    const categorySlug = getSearchParam(decodedPage, "type");
    return categorySlug
      ? `${formatSlugTitle(categorySlug)} Blogs`
      : "All Blogs";
  }

  if (groupKey === "blog-detail-pages") {
    const blogSlug = cleanPage.replace(/^\/blogs\/?/, "");
    return blogSlug ? formatSlugTitle(blogSlug) : "Blog Detail";
  }

  if (groupKey === "blog-categories") {
    return "Blog Categories Section";
  }

  return cleanPage
    .split("/")
    .filter(Boolean)
    .map((part) =>
      part.split("-").filter(Boolean).map(formatTitleWord).join(" "),
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

const formatGroupDialogTitle = (title = "") =>
  title.toLowerCase().endsWith("pages") ? title : `${title} Pages`;

const formatMetaNumber = (value?: number) =>
  Number(value || 0).toLocaleString();

function MetaPlatformSummaryCard({
  platform,
  title,
  username,
  overview,
  loading,
}: {
  platform: "facebook" | "instagram";
  title: string;
  username?: string;
  overview?: {
    followers: number;
    totalPosts: number;
    totalReels?: number;
    totalLikes?: number;
    totalComments?: number;
    totalMessages?: number;
    unreadMessages?: number;
    reach: number;
    engagement: number;
  };
  loading: boolean;
}) {
  const Icon = platform === "facebook" ? Facebook : Instagram;
  const accentClass =
    platform === "facebook" ? "text-blue-600" : "text-pink-600";
  const bgClass = platform === "facebook" ? "bg-blue-600/10" : "bg-pink-600/10";

  return (
    <Card className="shadow-card border border-border rounded-2xl overflow-hidden">
      <CardHeader className="pb-2 px-4 sm:px-6">
        <div className="flex items-center gap-3">
          <div
            className={`w-10 h-10 rounded-xl ${bgClass} flex items-center justify-center`}
          >
            <Icon size={18} className={accentClass} />
          </div>
          <div className="min-w-0">
            <CardTitle className="text-sm sm:text-base font-semibold text-foreground font-display">
              {title}
            </CardTitle>
            {username ? (
              <p className="text-xs text-muted-foreground truncate">
                {platform === "instagram" ? `@${username}` : username}
              </p>
            ) : null}
          </div>
        </div>
      </CardHeader>
      <CardContent className="px-4 sm:px-6 pb-5">
        {loading ? (
          <div className="grid grid-cols-2 gap-3">
            {["sk-1", "sk-2", "sk-3", "sk-4"].map((key) => (
              <Skeleton key={key} className="h-14 rounded-xl" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 text-sm">
            {[
              { label: "Followers", value: overview?.followers },
              { label: "Posts", value: overview?.totalPosts },
              { label: "Likes", value: overview?.totalLikes },
              { label: "Comments", value: overview?.totalComments },
              { label: "Reach (30d)", value: overview?.reach },
              { label: "Engagement (30d)", value: overview?.engagement },
              ...(platform === "instagram"
                ? [{ label: "Reels", value: overview?.totalReels }]
                : []),
              ...(platform === "facebook"
                ? [
                    { label: "Messages", value: overview?.totalMessages },
                    { label: "Unread", value: overview?.unreadMessages },
                  ]
                : []),
            ].map((item) => (
              <div
                key={item.label}
                className="rounded-xl border border-border bg-muted/40 px-3 py-2.5"
              >
                <p className="text-xs text-muted-foreground">{item.label}</p>
                <p className="text-base font-semibold text-foreground tabular-nums mt-0.5">
                  {formatMetaNumber(item.value)}
                </p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Component ──────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const { admin } = useAuth();
  const canViewMetaAnalytics = canAccessPath(admin, "/meta-analytics");
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

  const metaStatusQuery = useQuery({
    queryKey: ["meta-status"],
    queryFn: getMetaStatusApi,
    enabled: canViewMetaAnalytics,
  });

  const metaConnected = metaStatusQuery.data?.connected === true;

  const metaOverviewQuery = useQuery({
    queryKey: ["meta-overview", "dashboard"],
    queryFn: () =>
      getMetaOverviewApi({
        range: "30d",
        startDate: "",
        endDate: "",
      }),
    enabled: canViewMetaAnalytics && metaConnected,
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
        action={
          canViewMetaAnalytics ? (
            <Button
              asChild
              variant="outline"
              className="rounded-xl"
              data-ocid="dashboard.meta_analytics_button"
            >
              <Link to="/meta-analytics">
                <BarChart3 size={16} />
                Meta Analytics
              </Link>
            </Button>
          ) : null
        }
      />

      {canViewMetaAnalytics ? (
        <div className="mb-4 sm:mb-6" data-ocid="dashboard.meta_analytics">
          <div className="mb-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <h2 className="text-base sm:text-lg font-semibold text-foreground font-display">
                Meta Analytics
              </h2>
              <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                Facebook Page and Instagram performance snapshot
              </p>
            </div>
            {metaConnected ? (
              <Button asChild variant="ghost" size="sm" className="rounded-xl">
                <Link to="/meta-analytics">View full report →</Link>
              </Button>
            ) : null}
          </div>

          {!metaStatusQuery.isLoading && !metaConnected ? (
            <Card className="shadow-card border border-border rounded-2xl">
              <CardContent className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-foreground">
                    Connect Facebook & Instagram
                  </p>
                  <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                    View followers, posts, likes, and engagement from your Meta
                    accounts.
                  </p>
                </div>
                <Button asChild className="rounded-xl">
                  <Link to="/meta-analytics">Connect Meta Accounts</Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
              <MetaPlatformSummaryCard
                platform="facebook"
                title="Facebook Page"
                username={metaStatusQuery.data?.account?.pageName}
                overview={metaOverviewQuery.data?.platforms?.facebook}
                loading={
                  metaStatusQuery.isLoading || metaOverviewQuery.isLoading
                }
              />
              <MetaPlatformSummaryCard
                platform="instagram"
                title="Instagram"
                username={metaStatusQuery.data?.account?.instagramUsername}
                overview={metaOverviewQuery.data?.platforms?.instagram}
                loading={
                  metaStatusQuery.isLoading || metaOverviewQuery.isLoading
                }
              />
            </div>
          )}
        </div>
      ) : null}

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
            <DialogTitle>
              {formatGroupDialogTitle(selectedPageGroup?.title)}
            </DialogTitle>
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
                      {formatPageTitle(page.page, selectedPageGroup?.key)}
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

      <Card className="shadow-card border border-border rounded-2xl mb-4 sm:mb-6">
        <CardHeader>
          <CardTitle className="text-sm sm:text-base font-semibold font-display">
            SEO Audit Report
          </CardTitle>
        </CardHeader>

        <CardContent className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm text-muted-foreground">
              View latest cached RankMath SEO report.
            </p>
          </div>

          <Button asChild>
            <Link to="/seo-report">View SEO Report</Link>
          </Button>
        </CardContent>
      </Card>

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
              value={(
                data?.appointmentsByStatus?.pending ?? 0
              ).toLocaleString()}
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
