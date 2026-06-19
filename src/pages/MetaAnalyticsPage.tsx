import {
  type MetaDailyAnalytics,
  type MetaDateRange,
  type MetaOverview,
  type MetaOverviewResponse,
  type MetaPageOption,
  type MetaPost,
  type PostDetails,
  disconnectMetaApi,
  getMetaConnectApi,
  getMetaOverviewApi,
  getMetaPagesApi,
  getMetaPostDetailsApi,
  getMetaPostsApi,
  getMetaStatusApi,
  getMetaTopPostsApi,
  selectMetaPageApi,
} from "@/apiCalls/metaAnalytics";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { PageHeader } from "@/components/admin/PageHeader";
import { StatCard } from "@/components/admin/StatCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getApiErrorMessage } from "@/lib/api-errors";
import { themeColor } from "@/lib/theme";
import { formatDate } from "@/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  BarChart3,
  CalendarDays,
  ExternalLink,
  Eye,
  Facebook,
  FileText,
  Globe,
  Heart,
  ImageIcon,
  Instagram,
  LayoutDashboard,
  MessageCircle,
  Repeat2,
  TrendingUp,
  Users,
  ThumbsUp,
  X,
} from "lucide-react";
import { Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { toast } from "sonner";

const RANGE_OPTIONS: Array<{ value: MetaDateRange["range"]; label: string }> = [
  { value: "today", label: "Today" },
  { value: "7d", label: "7 Days" },
  { value: "30d", label: "30 Days" },
  { value: "90d", label: "90 Days" },
  { value: "custom", label: "Custom Range" },
];

const POST_SKELETON_ROWS = ["post-sk-1", "post-sk-2", "post-sk-3", "post-sk-4"];
const POST_SKELETON_CELLS = [
  "thumbnail",
  "platform",
  "caption",
  "date",
  "likes",
  "comments",
  "reach",
  "impressions",
  "rate",
];
const STAT_SKELETON_KEYS = [
  "followers",
  "total-followers",
  "reach",
  "impressions",
  "engagement",
  "total-posts",
  "total-likes",
];

type PlatformFilter = "all" | "facebook" | "instagram";

const PLATFORM_TABS: Array<{
  value: PlatformFilter;
  label: string;
  icon: typeof Facebook;
}> = [
  { value: "all", label: "Combined", icon: BarChart3 },
  { value: "facebook", label: "Facebook Page", icon: Facebook },
  { value: "instagram", label: "Instagram", icon: Instagram },
];

const getOverviewForPlatform = (
  filter: PlatformFilter,
  overview?: MetaOverview,
  platforms?: MetaOverviewResponse["platforms"],
): MetaOverview | undefined => {
  if (!overview) return undefined;
  if (filter === "facebook") return platforms?.facebook;
  if (filter === "instagram") return platforms?.instagram;
  return overview;
};

const getDailyForPlatform = (
  filter: PlatformFilter,
  daily: MetaDailyAnalytics[],
  dailyByPlatform?: MetaOverviewResponse["dailyByPlatform"],
): MetaDailyAnalytics[] => {
  if (filter === "facebook") return dailyByPlatform?.facebook ?? [];
  if (filter === "instagram") return dailyByPlatform?.instagram ?? [];
  return daily;
};

const getPostPlatformLabel = (filter: PlatformFilter) => {
  if (filter === "facebook") return "Facebook";
  if (filter === "instagram") return "Instagram";
  return null;
};

const formatNumber = (value?: number) => Number(value || 0).toLocaleString();

const getToday = () => new Date().toISOString().slice(0, 10);

const getDaysAgo = (days: number) => {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString().slice(0, 10);
};

function ChartCard({
  title,
  data,
  dataKey,
  loading,
}: {
  title: string;
  data: MetaDailyAnalytics[];
  dataKey: keyof MetaDailyAnalytics;
  loading: boolean;
}) {
  const gridColor = themeColor("border", 0.7);
  const mutedTextColor = themeColor("muted-foreground");
  const lineColor = themeColor("chart-1");

  return (
    <Card className="shadow-card border border-border rounded-2xl">
      <CardHeader className="pb-2 px-4 sm:px-6">
        <CardTitle className="text-sm sm:text-base font-semibold text-foreground font-display">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="px-2 sm:px-6">
        {loading ? (
          <Skeleton className="h-[230px] w-full rounded-xl" />
        ) : (
          <div className="h-[230px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={data.map((row) => ({
                  date: row.date.slice(5),
                  value: Number(row[dataKey] || 0),
                }))}
                margin={{ top: 8, right: 8, left: -24, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                <XAxis
                  dataKey="date"
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
                    border: `1px solid ${themeColor("border")}`,
                    boxShadow: "0 4px 6px rgba(0,0,0,0.07)",
                    fontSize: 12,
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke={lineColor}
                  strokeWidth={2.5}
                  dot={{ fill: lineColor, r: 4, strokeWidth: 0 }}
                  activeDot={{ r: 6, strokeWidth: 0 }}
                  name={title}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function PageSelectCard({
  pages,
  loading,
  selectedPageId,
  onSelectedPageIdChange,
  onSelect,
  selecting,
}: {
  pages: MetaPageOption[];
  loading: boolean;
  selectedPageId: string;
  onSelectedPageIdChange: (value: string) => void;
  onSelect: () => void;
  selecting: boolean;
}) {
  const selectedPage = pages.find((page) => page.pageId === selectedPageId);

  return (
    <Card className="shadow-card border border-border rounded-2xl">
      <CardHeader>
        <CardTitle className="text-base font-semibold font-display">
          Select Facebook Page
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Choose the Facebook Page you want to track. Instagram will be linked
          automatically if it is connected to that Page.
        </p>
        {loading ? (
          <Skeleton className="h-10 w-full rounded-lg" />
        ) : (
          <div className="flex flex-col sm:flex-row gap-3">
            <Select
              value={selectedPageId}
              onValueChange={onSelectedPageIdChange}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Choose a connected Page" />
              </SelectTrigger>
              <SelectContent>
                {pages.map((page) => (
                  <SelectItem key={page.pageId} value={page.pageId}>
                    {page.pageName}
                    {page.instagramUsername
                      ? ` (@${page.instagramUsername})`
                      : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              onClick={onSelect}
              disabled={!selectedPageId || selecting}
              className="rounded-xl"
              type="button"
            >
              {selecting ? "Saving..." : "Save Connection"}
            </Button>
          </div>
        )}

        {selectedPage && !selectedPage.hasInstagramBusinessAccount ? (
          <p className="text-sm text-muted-foreground">
            This Page has no linked Instagram Business Account. Facebook Page
            analytics will still be available.
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}

function ConnectedAccountCard({
  account,
  onDisconnect,
  disconnecting,
}: {
  account: NonNullable<Awaited<ReturnType<typeof getMetaStatusApi>>["account"]>;
  onDisconnect: () => void;
  disconnecting: boolean;
}) {
  return (
    <Card className="shadow-card border border-border rounded-2xl">
      <CardContent className="p-4 sm:p-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-4 min-w-0">
            {account.pagePicture ? (
              <img
                src={account.pagePicture}
                alt={account.pageName}
                className="h-14 w-14 rounded-xl object-cover border border-border"
              />
            ) : (
              <div className="h-14 w-14 rounded-xl bg-primary/10 flex items-center justify-center">
                <Globe size={22} className="text-primary" />
              </div>
            )}
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-base sm:text-lg font-semibold text-foreground font-display truncate">
                  {account.pageName || "Facebook Page"}
                </h2>
                <Badge variant="outline">Business Page</Badge>
                <Badge variant="outline" className="capitalize">
                  {account.status}
                </Badge>
              </div>
              <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                <span className="inline-flex items-center gap-1.5">
                  <Instagram size={14} /> @
                  {account.instagramUsername || "not linked"}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <CalendarDays size={14} /> {formatDate(account.connectedAt)}
                </span>
              </div>
            </div>
          </div>
          <Button
            variant="destructive"
            onClick={onDisconnect}
            disabled={disconnecting}
            className="rounded-xl"
            type="button"
          >
            {disconnecting ? "Disconnecting..." : "Disconnect"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function PostDetailsDialog({
  post,
  open,
  onOpenChange,
}: {
  post: MetaPost | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [details, setDetails] = useState<PostDetails | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && post) {
      setLoading(true);
      setDetails(null);
      getMetaPostDetailsApi(post.id, post.platform)
        .then(setDetails)
        .catch((error) => {
          toast.error(getApiErrorMessage(error, "Failed to load post details"));
        })
        .finally(() => setLoading(false));
    }
  }, [open, post]);

  if (!post) return null;

  const getInitials = (name: string) =>
    name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl w-[95vw] max-h-[90vh] flex flex-col">
        <DialogHeader className="shrink-0">
          <DialogTitle className="text-lg font-display">
            Post Details — {post.platform}
          </DialogTitle>
          <DialogClose className="absolute right-4 top-4 rounded-sm opacity-70 hover:opacity-100">
            <X size={16} />
          </DialogClose>
        </DialogHeader>

        <div className="flex flex-col sm:flex-row gap-4 shrink-0">
          {post.thumbnail ? (
            <img
              src={post.thumbnail}
              alt=""
              className="h-40 w-40 sm:h-48 sm:w-48 rounded-xl object-cover border border-border shrink-0"
            />
          ) : (
            <div className="h-40 w-40 sm:h-48 sm:w-48 rounded-xl bg-muted flex items-center justify-center shrink-0">
              <ImageIcon size={32} className="text-muted-foreground" />
            </div>
          )}
          <div className="flex-1 min-w-0 space-y-3">
            {post.caption ? (
              <p className="text-sm text-foreground leading-relaxed">
                {post.caption}
              </p>
            ) : (
              <p className="text-sm text-muted-foreground italic">No caption</p>
            )}
            <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <CalendarDays size={14} />
                {formatDate(post.postedDate)}
              </span>
              {post.permalink ? (
                <a
                  href={post.permalink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-primary hover:underline"
                  onClick={(e) => e.stopPropagation()}
                >
                  <ExternalLink size={14} />
                  View on {post.platform}
                </a>
              ) : null}
            </div>
            <div className="flex flex-wrap gap-3">
              <div className="flex items-center gap-2 rounded-xl border border-border bg-muted/40 px-4 py-2">
                <ThumbsUp size={18} className="text-blue-500" />
                <span className="text-lg font-semibold tabular-nums text-foreground">
                  {loading
                    ? "—"
                    : formatNumber(
                        details?.likeCount ?? post.likes,
                      )}
                </span>
                <span className="text-sm text-muted-foreground">Likes</span>
              </div>
              <div className="flex items-center gap-2 rounded-xl border border-border bg-muted/40 px-4 py-2">
                <MessageCircle size={18} className="text-emerald-500" />
                <span className="text-lg font-semibold tabular-nums text-foreground">
                  {loading
                    ? "—"
                    : formatNumber(
                        details?.commentCount ?? post.comments,
                      )}
                </span>
                <span className="text-sm text-muted-foreground">Comments</span>
              </div>
            </div>
          </div>
        </div>

        <ScrollArea className="flex-1 min-h-0 mt-2">
          {loading ? (
            <div className="space-y-3 p-2">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton
                  key={`detail-sk-${i}`}
                  className="h-14 w-full rounded-lg"
                />
              ))}
            </div>
          ) : details ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-2">
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <ThumbsUp size={16} className="text-blue-500" />
                  <h3 className="text-sm font-semibold text-foreground">
                    People Who Liked
                    {details.likes.length > 0
                      ? ` (${details.likes.length})`
                      : ""}
                  </h3>
                </div>
                {details.likes.length > 0 ? (
                  <div className="space-y-2 max-h-[320px] overflow-y-auto pr-1">
                    {details.likes.map((like) => (
                      <div
                        key={like.id}
                        className="flex items-center gap-3 p-2.5 rounded-lg border border-border bg-muted/30"
                      >
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="text-xs">
                            {getInitials(like.name)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm font-medium text-foreground">
                          {like.name}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : post.platform === "Instagram" ? (
                  <p className="text-sm text-muted-foreground pl-1">
                    Meta does not provide individual liker names for Instagram
                    posts. The total like count is shown above.
                  </p>
                ) : (
                  <p className="text-sm text-muted-foreground pl-1">
                    No individual likes data available for this post.
                  </p>
                )}
              </div>

              <div>
                <div className="flex items-center gap-2 mb-3">
                  <MessageCircle size={16} className="text-emerald-500" />
                  <h3 className="text-sm font-semibold text-foreground">
                    Comments
                    {details.comments.length > 0
                      ? ` (${details.comments.length})`
                      : ""}
                  </h3>
                </div>
                {details.comments.length > 0 ? (
                  <div className="space-y-3 max-h-[320px] overflow-y-auto pr-1">
                    {details.comments.map((comment) => (
                      <div
                        key={comment.id}
                        className="p-3 rounded-lg border border-border"
                      >
                        <div className="flex items-center gap-2 mb-1.5">
                          <Avatar className="h-7 w-7">
                            <AvatarFallback className="text-[10px]">
                              {getInitials(comment.fromName)}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-sm font-semibold text-foreground">
                            {comment.fromName}
                          </span>
                          <span className="text-xs text-muted-foreground ml-auto shrink-0">
                            {formatDate(comment.createdTime)}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground pl-9">
                          {comment.message || "(empty comment)"}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground pl-1">
                    No comments on this post.
                  </p>
                )}
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground p-2">
              Failed to load details.
            </p>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

function PostsTable({
  posts,
  loading,
  platformFilter,
}: {
  posts: MetaPost[];
  loading: boolean;
  platformFilter: PlatformFilter;
}) {
  const [selectedPost, setSelectedPost] = useState<MetaPost | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  const filteredPosts =
    platformFilter === "all"
      ? posts
      : posts.filter((post) => post.platform === getPostPlatformLabel(platformFilter));

  return (
    <Card className="shadow-card border border-border rounded-2xl">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold font-display">
          Posts
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted">
              {[
                "Thumbnail",
                "Platform",
                "Caption",
                "Posted Date",
                "Likes",
                "Comments",
                "Reach",
                "Impressions",
                "Engagement Rate",
              ].map((column) => (
                <TableHead
                  key={column}
                  className="text-xs font-semibold text-muted-foreground uppercase tracking-wide px-4"
                >
                  {column}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              POST_SKELETON_ROWS.map((row) => (
                <TableRow key={row}>
                  {POST_SKELETON_CELLS.map((cell) => (
                    <TableCell key={`${row}-${cell}`} className="px-4 py-3">
                      <Skeleton className="h-4 w-20 rounded" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : filteredPosts.length ? (
              filteredPosts.map((post) => (
                <TableRow
                  key={`${post.platform}-${post.id}`}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => {
                    setSelectedPost(post);
                    setDetailsOpen(true);
                  }}
                >
                  <TableCell className="px-4 py-3">
                    {post.thumbnail ? (
                      <img
                        src={post.thumbnail}
                        alt=""
                        className="h-12 w-12 rounded-lg object-cover border border-border"
                      />
                    ) : (
                      <div className="h-12 w-12 rounded-lg bg-muted flex items-center justify-center">
                        <ImageIcon
                          size={16}
                          className="text-muted-foreground"
                        />
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="px-4 py-3">
                    <Badge variant="outline">{post.platform}</Badge>
                  </TableCell>
                  <TableCell className="px-4 py-3 max-w-[280px] truncate text-foreground">
                    {post.caption || "No caption"}
                  </TableCell>
                  <TableCell className="px-4 py-3 text-muted-foreground">
                    {formatDate(post.postedDate)}
                  </TableCell>
                  <TableCell className="px-4 py-3 tabular-nums">
                    {formatNumber(post.likes)}
                  </TableCell>
                  <TableCell className="px-4 py-3 tabular-nums">
                    {formatNumber(post.comments)}
                  </TableCell>
                  <TableCell className="px-4 py-3 tabular-nums">
                    {formatNumber(post.reach)}
                  </TableCell>
                  <TableCell className="px-4 py-3 tabular-nums">
                    {formatNumber(post.impressions)}
                  </TableCell>
                  <TableCell className="px-4 py-3 tabular-nums">
                    {post.engagementRate.toFixed(2)}%
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={9}
                  className="px-4 py-8 text-center text-sm text-muted-foreground"
                >
                  No Meta posts available yet.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>

      <PostDetailsDialog
        post={selectedPost}
        open={detailsOpen}
        onOpenChange={(open) => {
          setDetailsOpen(open);
          if (!open) setSelectedPost(null);
        }}
      />
    </Card>
  );
}

function TopPostsSection({
  posts,
  loading,
  platformFilter,
}: {
  posts: MetaPost[];
  loading: boolean;
  platformFilter: PlatformFilter;
}) {
  const filteredPosts =
    platformFilter === "all"
      ? posts
      : posts.filter((post) => post.platform === getPostPlatformLabel(platformFilter));

  return (
    <Card className="shadow-card border border-border rounded-2xl">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold font-display">
          Top Performing Posts
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {loading ? (
          POST_SKELETON_ROWS.map((row) => (
            <Skeleton key={row} className="h-16 w-full rounded-xl" />
          ))
        ) : filteredPosts.length ? (
          filteredPosts.slice(0, 10).map((post, index) => (
            <div
              key={`${post.platform}-top-${post.id}`}
              className="flex items-center gap-3 rounded-xl border border-border p-3"
            >
              <div className="h-8 w-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-semibold">
                {index + 1}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline">{post.platform}</Badge>
                  <span className="text-xs text-muted-foreground">
                    {formatNumber(post.engagement)} engagements
                  </span>
                </div>
                <p className="text-sm text-foreground truncate mt-1">
                  {post.caption || "No caption"}
                </p>
              </div>
              <div className="text-right text-sm tabular-nums">
                <p className="font-semibold text-foreground">
                  {post.engagementRate.toFixed(2)}%
                </p>
                <p className="text-xs text-muted-foreground">rate</p>
              </div>
            </div>
          ))
        ) : (
          <p className="text-sm text-muted-foreground py-4">
            No top posts available yet.
          </p>
        )}
      </CardContent>
    </Card>
  );
}

export default function MetaAnalyticsPage() {
  const queryClient = useQueryClient();
  const [range, setRange] = useState<MetaDateRange>({
    range: "30d",
    startDate: getDaysAgo(29),
    endDate: getToday(),
  });
  const [selectedPageId, setSelectedPageId] = useState("");
  const [confirmDisconnect, setConfirmDisconnect] = useState(false);
  const [platformFilter, setPlatformFilter] = useState<PlatformFilter>("all");

  const statusQuery = useQuery({
    queryKey: ["meta-status"],
    queryFn: getMetaStatusApi,
  });

  const connected = statusQuery.data?.connected === true;
  const needsPageSelection = statusQuery.data?.needsPageSelection === true;

  const pagesQuery = useQuery({
    queryKey: ["meta-pages"],
    queryFn: getMetaPagesApi,
    enabled: needsPageSelection,
  });

  const overviewQuery = useQuery({
    queryKey: ["meta-overview", range],
    queryFn: () => getMetaOverviewApi(range),
    enabled: connected,
  });

  const postsQuery = useQuery({
    queryKey: ["meta-posts"],
    queryFn: getMetaPostsApi,
    enabled: connected,
  });

  const topPostsQuery = useQuery({
    queryKey: ["meta-top-posts"],
    queryFn: getMetaTopPostsApi,
    enabled: connected,
  });

  const connectMutation = useMutation({
    mutationFn: getMetaConnectApi,
    onSuccess: ({ authUrl }) => {
      window.location.assign(authUrl);
    },
    onError: (error) =>
      toast.error(getApiErrorMessage(error, "Unable to start Meta Login.")),
  });

  const selectPageMutation = useMutation({
    mutationFn: selectMetaPageApi,
    onSuccess: () => {
      toast.success("Meta Page connected");
      queryClient.invalidateQueries({ queryKey: ["meta-status"] });
      queryClient.invalidateQueries({ queryKey: ["meta-overview"] });
      queryClient.invalidateQueries({ queryKey: ["meta-posts"] });
      queryClient.invalidateQueries({ queryKey: ["meta-top-posts"] });
    },
    onError: (error) =>
      toast.error(getApiErrorMessage(error, "Unable to save selected Page.")),
  });

  const disconnectMutation = useMutation({
    mutationFn: disconnectMetaApi,
    onSuccess: () => {
      toast.success("Meta account disconnected");
      setConfirmDisconnect(false);
      setSelectedPageId("");
      queryClient.invalidateQueries({ queryKey: ["meta-status"] });
    },
    onError: (error) =>
      toast.error(
        getApiErrorMessage(error, "Unable to disconnect Meta account."),
      ),
  });

  const daily = overviewQuery.data?.daily ?? [];
  const dailyByPlatform = overviewQuery.data?.dailyByPlatform;
  const overview = overviewQuery.data?.overview;
  const platforms = overviewQuery.data?.platforms;
  const activeOverview = getOverviewForPlatform(
    platformFilter,
    overview,
    platforms,
  );
  const activeDaily = getDailyForPlatform(
    platformFilter,
    daily,
    dailyByPlatform,
  );
  const account = statusQuery.data?.account;

  const pages = pagesQuery.data ?? [];

  const handleRangeChange = (value: MetaDateRange["range"]) => {
    setRange((current) => ({
      range: value,
      startDate: current.startDate || getDaysAgo(29),
      endDate: current.endDate || getToday(),
    }));
  };

  const canSelectPage = Boolean(selectedPageId);

  return (
    <div data-ocid="meta_analytics.page" className="space-y-4 sm:space-y-6">
      <PageHeader
        title="Meta Analytics"
        description="Facebook Page and Instagram Business Account performance"
        action={
          <div className="flex flex-wrap items-center gap-2">
            <Button
              asChild
              variant="ghost"
              className="rounded-xl"
              type="button"
            >
              <Link to="/dashboard">
                <LayoutDashboard size={16} />
                Dashboard
              </Link>
            </Button>
            {connected ? (
              <Button
                variant="outline"
                onClick={() => connectMutation.mutate()}
                disabled={connectMutation.isPending}
                className="rounded-xl"
                type="button"
              >
                <Repeat2 size={16} />
                Reconnect
              </Button>
            ) : null}
          </div>
        }
      />

      {statusQuery.isLoading ? (
        <Card className="shadow-card border border-border rounded-2xl">
          <CardContent className="p-5 space-y-3">
            <Skeleton className="h-12 w-12 rounded-xl" />
            <Skeleton className="h-5 w-56 rounded" />
            <Skeleton className="h-4 w-80 max-w-full rounded" />
          </CardContent>
        </Card>
      ) : !connected ? (
        <div className="space-y-4">
          <Card className="shadow-card border border-border rounded-2xl">
            <CardContent className="p-5 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg font-semibold text-foreground font-display">
                    Connect Facebook & Instagram
                  </h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    Login with Meta, choose your Facebook Page, and link its
                    Instagram Business Account if available.
                  </p>
                </div>
                <Button
                  onClick={() => connectMutation.mutate()}
                  disabled={connectMutation.isPending}
                  className="rounded-xl"
                  type="button"
                >
                  <ExternalLink size={16} />
                  {connectMutation.isPending
                    ? "Opening Meta..."
                    : "Connect Facebook & Instagram"}
                </Button>
              </div>
            </CardContent>
          </Card>

          {needsPageSelection ? (
            <PageSelectCard
              pages={pages}
              loading={pagesQuery.isLoading}
              selectedPageId={selectedPageId}
              onSelectedPageIdChange={setSelectedPageId}
              onSelect={() => {
                if (canSelectPage) selectPageMutation.mutate(selectedPageId);
              }}
              selecting={selectPageMutation.isPending}
            />
          ) : null}
        </div>
      ) : account ? (
        <>
          <ConnectedAccountCard
            account={account}
            onDisconnect={() => setConfirmDisconnect(true)}
            disconnecting={disconnectMutation.isPending}
          />

          {overviewQuery.data?.syncError ? (
            <Card className="shadow-card border border-border rounded-2xl">
              <CardContent className="p-4 text-sm text-muted-foreground">
                Showing stored analytics history. Latest Meta sync note:{" "}
                {overviewQuery.data.syncError}
              </CardContent>
            </Card>
          ) : null}

          <Card className="shadow-card border border-border rounded-2xl">
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2">
                  <Select value={range.range} onValueChange={handleRangeChange}>
                    <SelectTrigger className="w-[170px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {RANGE_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {range.range === "custom" ? (
                    <>
                      <Input
                        type="date"
                        value={range.startDate}
                        onChange={(event) =>
                          setRange((current) => ({
                            ...current,
                            startDate: event.target.value,
                          }))
                        }
                        className="w-[160px]"
                      />
                      <Input
                        type="date"
                        value={range.endDate}
                        onChange={(event) =>
                          setRange((current) => ({
                            ...current,
                            endDate: event.target.value,
                          }))
                        }
                        className="w-[160px]"
                      />
                    </>
                  ) : null}
                </div>

                <div className="flex flex-wrap gap-2">
                  {PLATFORM_TABS.map((tab) => {
                    const TabIcon = tab.icon;
                    const isActive = platformFilter === tab.value;
                    return (
                      <Button
                        key={tab.value}
                        type="button"
                        variant={isActive ? "default" : "outline"}
                        className="rounded-xl"
                        onClick={() => setPlatformFilter(tab.value)}
                      >
                        <TabIcon size={16} />
                        {tab.label}
                      </Button>
                    );
                  })}
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            {overviewQuery.isLoading ? (
              STAT_SKELETON_KEYS.map((key) => (
                <Card
                  key={`meta-stat-${key}`}
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
                  label="Followers"
                  value={formatNumber(activeOverview?.followers)}
                  color="gold"
                />
                <StatCard
                  icon={Users}
                  label="Total Followers"
                  value={formatNumber(activeOverview?.totalFollowers)}
                  color="green"
                />
                <StatCard
                  icon={TrendingUp}
                  label="Reach"
                  value={formatNumber(activeOverview?.reach)}
                  color="green"
                />
                <StatCard
                  icon={Eye}
                  label="Impressions"
                  value={formatNumber(activeOverview?.impressions)}
                  color="orange"
                />
                <StatCard
                  icon={Heart}
                  label="Engagement"
                  value={formatNumber(activeOverview?.engagement)}
                  color="purple"
                />
                <StatCard
                  icon={FileText}
                  label="Total Posts"
                  value={formatNumber(activeOverview?.totalPosts)}
                  color="orange"
                />
                <StatCard
                  icon={Heart}
                  label="Total Likes"
                  value={formatNumber(activeOverview?.totalLikes)}
                  color="purple"
                />
                {platformFilter !== "facebook" ? (
                  <StatCard
                    icon={BarChart3}
                    label="Total Reels"
                    value={formatNumber(activeOverview?.totalReels)}
                    color="gold"
                  />
                ) : null}
                <StatCard
                  icon={MessageCircle}
                  label="Total Comments"
                  value={formatNumber(activeOverview?.totalComments)}
                  color="gold-deep"
                />
                {platformFilter === "all" || platformFilter === "facebook" ? (
                  <>
                    <StatCard
                      icon={MessageCircle}
                      label="Page Messages"
                      value={formatNumber(activeOverview?.totalMessages)}
                      color="purple"
                    />
                    <StatCard
                      icon={MessageCircle}
                      label="Unread Messages"
                      value={formatNumber(activeOverview?.unreadMessages)}
                      color="orange"
                    />
                  </>
                ) : null}
              </>
            )}
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            <ChartCard
              title="Followers Growth"
              data={activeDaily}
              dataKey="followerAdds"
              loading={overviewQuery.isLoading}
            />
            <ChartCard
              title="Reach Trend"
              data={activeDaily}
              dataKey="reach"
              loading={overviewQuery.isLoading}
            />
            <ChartCard
              title="Engagement Trend"
              data={activeDaily}
              dataKey="engagement"
              loading={overviewQuery.isLoading}
            />
            <ChartCard
              title="Impressions Trend"
              data={activeDaily}
              dataKey="impressions"
              loading={overviewQuery.isLoading}
            />
          </div>

          <TopPostsSection
            posts={topPostsQuery.data ?? []}
            loading={topPostsQuery.isLoading}
            platformFilter={platformFilter}
          />

          <PostsTable
            posts={postsQuery.data ?? []}
            loading={postsQuery.isLoading}
            platformFilter={platformFilter}
          />
        </>
      ) : null}

      <ConfirmDialog
        open={confirmDisconnect}
        title="Disconnect Meta account?"
        message="This removes the active Meta connection. Stored analytics history remains available in MongoDB."
        confirmLabel="Disconnect"
        onCancel={() => setConfirmDisconnect(false)}
        onConfirm={() => disconnectMutation.mutate()}
      />
    </div>
  );
}