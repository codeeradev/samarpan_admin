import { PageHeader } from "@/components/admin/PageHeader";
import { StatCard } from "@/components/admin/StatCard";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { getDashboardApi } from "@/apiCalls/dashboard";
import { formatDate } from "@/types";
import { useQuery } from "@tanstack/react-query";
import {
  Calendar,
  Clock,
  FileImage,
  ImageIcon,
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
const SKELETON_ROW_KEYS = [
  "sk-row-1",
  "sk-row-2",
  "sk-row-3",
  "sk-row-4",
  "sk-row-5",
];
const SKELETON_CELL_KEYS = ["sk-c1", "sk-c2", "sk-c3", "sk-c4", "sk-c5"];

// ─── Component ──────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const { data, isLoading: statsLoading } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: getDashboardApi,
  });

  const recent = data?.recentAppointments ?? [];
  const apptLoading = statsLoading;
  const totals = data?.totals;
  const charts = data?.charts;

  return (
    <div data-ocid="dashboard.page">
      <PageHeader
        title="Dashboard"
        description="Welcome to Samarpan Hospital Admin"
      />

      {/* ── Stat Cards ─────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-4 sm:mb-6">
        {statsLoading ? (
          SKELETON_STAT_KEYS.map((k) => (
            <Card
              key={k}
              className="rounded-2xl shadow-card border border-slate-100"
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
          className="shadow-card border border-slate-100 rounded-2xl"
          data-ocid="dashboard.weekly_chart"
        >
          <CardHeader className="pb-2 px-4 sm:px-6">
            <CardTitle className="text-sm sm:text-base font-semibold text-[#1E293B] font-display">
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
                    <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                    <XAxis
                      dataKey="day"
                      tick={{ fontSize: 11, fill: "#94A3B8" }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 11, fill: "#94A3B8" }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip
                      contentStyle={{
                        borderRadius: "12px",
                        border: "1px solid #E2E8F0",
                        boxShadow: "0 4px 6px rgba(0,0,0,0.07)",
                        fontSize: 12,
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="appointments"
                      stroke="#D89F00"
                      strokeWidth={2.5}
                      dot={{ fill: "#D89F00", r: 4, strokeWidth: 0 }}
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
          className="shadow-card border border-slate-100 rounded-2xl"
          data-ocid="dashboard.growth_chart"
        >
          <CardHeader className="pb-2 px-4 sm:px-6">
            <CardTitle className="text-sm sm:text-base font-semibold text-[#1E293B] font-display">
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
                      stroke="#F1F5F9"
                      vertical={false}
                    />
                    <XAxis
                      dataKey="month"
                      tick={{ fontSize: 11, fill: "#94A3B8" }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 11, fill: "#94A3B8" }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip
                      contentStyle={{
                        borderRadius: "12px",
                        border: "1px solid #E2E8F0",
                        boxShadow: "0 4px 6px rgba(0,0,0,0.07)",
                        fontSize: 12,
                      }}
                    />
                    <Bar
                      dataKey="patients"
                      fill="#A67C00"
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
        className="shadow-card border border-slate-100 rounded-2xl"
        data-ocid="dashboard.recent_appointments"
      >
        <CardHeader className="pb-2 flex flex-row items-center justify-between gap-2 px-4 sm:px-6">
          <div className="flex items-center gap-2 min-w-0">
            <Clock size={16} className="text-[#D89F00] shrink-0" />
            <CardTitle className="text-sm sm:text-base font-semibold text-[#1E293B] truncate font-display">
              Recent Appointments
            </CardTitle>
          </div>
          <a
            href="/appointments"
            className="text-xs sm:text-sm font-medium text-[#D89F00] hover:text-[#A67C00] transition-colors shrink-0"
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
                <tr className="border-b border-slate-100 bg-[#F8FAFC]">
                  {["Patient", "Doctor", "Date / Time", "Reason", "Status"].map(
                    (col) => (
                      <th
                        key={col}
                        className="text-left text-xs font-semibold text-[#64748B] uppercase tracking-wide py-3 px-5 whitespace-nowrap"
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
                      <tr key={rk} className="border-b border-slate-50">
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
                        className="border-b border-slate-50 hover:bg-[#F8FAFC] transition-colors"
                        data-ocid={`dashboard.recent_appointments.item.${idx + 1}`}
                      >
                        <td className="px-5 py-3 font-medium text-[#1E293B] whitespace-nowrap">
                          {appt.fullName}
                        </td>
                        <td className="px-5 py-3 text-[#475569] whitespace-nowrap">
                          {appt.doctorName}
                        </td>
                        <td className="px-5 py-3 text-[#475569] whitespace-nowrap">
                          {formatDate(appt.appointmentDate)}
                        </td>
                        <td className="px-5 py-3 text-[#475569] max-w-[200px] truncate">
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
          <div className="md:hidden divide-y divide-slate-50">
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
                      <span className="font-medium text-sm text-[#1E293B] truncate">
                        {appt.fullName}
                      </span>
                      <StatusBadge status={appt.status} />
                    </div>
                    <p className="text-xs text-[#475569]">
                      <span className="font-medium">Dr.</span> {appt.doctorName}
                    </p>
                    <p className="text-xs text-[#64748B]">
                      {formatDate(appt.appointmentDate)}
                    </p>
                    {appt.reason && (
                      <p className="text-xs text-[#94A3B8] truncate">
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
              className="rounded-2xl shadow-card border border-slate-100"
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
