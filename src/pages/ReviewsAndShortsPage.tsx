import {
  addReviewApi,
  deleteReviewApi,
  getAllReviewsApi,
  type ReviewItem,
  type ReviewPayload,
  updateReviewApi,
} from "@/apiCalls/reviews";
import {
  addShortApi,
  deleteShortApi,
  getAllShortsApi,
  type ShortItem,
  type ShortPayload,
  updateShortApi,
} from "@/apiCalls/shorts";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { PageHeader } from "@/components/admin/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ExternalLink,
  MessageSquare,
  Pencil,
  Play,
  Plus,
  Search,
  Star,
  Trash2,
  Video,
} from "lucide-react";
import { type ElementType, useMemo, useState } from "react";
import { toast } from "sonner";

type ContentTab = "reviews" | "shorts";
type FormMode = "add" | "edit";

type ReviewFormData = {
  name: string;
  review: string;
  location: string;
  treatment: string;
  rating: string;
  sortOrder: string;
  isActive: boolean;
};

type ReviewFormErrors = Partial<Record<keyof ReviewFormData, string>>;

type ShortFormData = {
  title: string;
  shortUrl: string;
  thumbnail: string;
  sortOrder: string;
  isActive: boolean;
};

type ShortFormErrors = Partial<Record<keyof ShortFormData, string>>;

const REVIEW_QUERY_KEY = ["reviews-management"];
const SHORT_QUERY_KEY = ["shorts-management"];

const emptyReviewForm: ReviewFormData = {
  name: "",
  review: "",
  location: "",
  treatment: "",
  rating: "5",
  sortOrder: "0",
  isActive: true,
};

const emptyShortForm: ShortFormData = {
  title: "",
  shortUrl: "",
  thumbnail: "",
  sortOrder: "0",
  isActive: true,
};

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  return "Something went wrong. Please try again.";
}

function getInitials(value: string) {
  return value
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function isValidHttpUrl(value: string) {
  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

function getAverageRating(reviews: ReviewItem[]) {
  if (!reviews.length) {
    return "0.0";
  }

  const total = reviews.reduce((sum, item) => sum + Number(item.rating ?? 5), 0);
  return (total / reviews.length).toFixed(1);
}

function extractYoutubeId(value: string) {
  if (!value.trim()) {
    return "";
  }

  try {
    const url = new URL(value);
    const hostname = url.hostname.replace(/^www\./, "");

    if (hostname === "youtu.be") {
      return url.pathname.split("/").filter(Boolean)[0] ?? "";
    }

    if (!hostname.includes("youtube.com")) {
      return "";
    }

    const videoId = url.searchParams.get("v");
    if (videoId) {
      return videoId;
    }

    const segments = url.pathname.split("/").filter(Boolean);
    const shortsIndex = segments.indexOf("shorts");
    if (shortsIndex >= 0) {
      return segments[shortsIndex + 1] ?? "";
    }

    const embedIndex = segments.indexOf("embed");
    if (embedIndex >= 0) {
      return segments[embedIndex + 1] ?? "";
    }

    return "";
  } catch {
    return "";
  }
}

function getShortThumbnail(source: { thumbnail?: string; shortUrl?: string }) {
  if (source.thumbnail?.trim()) {
    return source.thumbnail.trim();
  }

  const videoId = extractYoutubeId(source.shortUrl ?? "");
  if (!videoId) {
    return "";
  }

  return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
}

function getShortHost(shortUrl: string) {
  try {
    return new URL(shortUrl).hostname.replace(/^www\./, "");
  } catch {
    return "External video";
  }
}

function validateReviewForm(form: ReviewFormData): ReviewFormErrors {
  const errors: ReviewFormErrors = {};
  const rating = Number(form.rating);
  const sortOrder = Number(form.sortOrder);

  if (!form.name.trim()) {
    errors.name = "Reviewer name is required.";
  }

  if (!form.review.trim()) {
    errors.review = "Review text is required.";
  }

  if (Number.isNaN(rating) || rating < 1 || rating > 5) {
    errors.rating = "Rating must be between 1 and 5.";
  }

  if (Number.isNaN(sortOrder) || sortOrder < 0) {
    errors.sortOrder = "Sort order must be 0 or more.";
  }

  return errors;
}

function validateShortForm(form: ShortFormData): ShortFormErrors {
  const errors: ShortFormErrors = {};
  const sortOrder = Number(form.sortOrder);

  if (!form.title.trim()) {
    errors.title = "Short title is required.";
  }

  if (!form.shortUrl.trim()) {
    errors.shortUrl = "Video URL is required.";
  } else if (!isValidHttpUrl(form.shortUrl.trim())) {
    errors.shortUrl = "Enter a valid video URL.";
  }

  if (form.thumbnail.trim() && !isValidHttpUrl(form.thumbnail.trim())) {
    errors.thumbnail = "Thumbnail must be a valid URL.";
  }

  if (Number.isNaN(sortOrder) || sortOrder < 0) {
    errors.sortOrder = "Sort order must be 0 or more.";
  }

  return errors;
}

function buildReviewPayload(form: ReviewFormData): ReviewPayload {
  return {
    name: form.name.trim(),
    review: form.review.trim(),
    location: form.location.trim(),
    treatment: form.treatment.trim(),
    rating: Number(form.rating),
    sortOrder: Number(form.sortOrder),
    isActive: form.isActive,
  };
}

function buildShortPayload(form: ShortFormData): ShortPayload {
  return {
    title: form.title.trim(),
    shortUrl: form.shortUrl.trim(),
    thumbnail: form.thumbnail.trim() || getShortThumbnail(form),
    sortOrder: Number(form.sortOrder),
    isActive: form.isActive,
  };
}

function MetricCard({
  label,
  value,
  hint,
  icon: Icon,
  accentClass,
}: {
  label: string;
  value: string;
  hint: string;
  icon: ElementType;
  accentClass: string;
}) {
  return (
    <Card className="border-slate-200 shadow-sm">
      <CardContent className="flex items-center gap-4 p-5">
        <div
          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-white shadow-sm ${accentClass}`}
        >
          <Icon size={20} />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium text-slate-500">{label}</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">{value}</p>
          <p className="mt-1 text-xs text-slate-500">{hint}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function RatingStars({
  rating,
  size = 14,
}: {
  rating: number;
  size?: number;
}) {
  const normalized = Math.max(1, Math.min(5, Number(rating || 5)));

  return (
    <div className="flex items-center gap-1 text-amber-500">
      {Array.from({ length: 5 }, (_, index) => (
        <Star
          key={`rating-${index + 1}`}
          size={size}
          className={index < normalized ? "fill-current" : "text-slate-200"}
        />
      ))}
    </div>
  );
}

function ReviewPreviewCard({
  review,
}: {
  review?: Partial<ReviewItem> | Partial<ReviewPayload>;
}) {
  if (!review) {
    return (
      <div className="rounded-[28px] border border-dashed border-slate-200 bg-slate-50 p-8 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white shadow-sm">
          <MessageSquare className="text-amber-500" size={22} />
        </div>
        <p className="mt-4 text-base font-semibold text-slate-900">
          Review preview will appear here
        </p>
        <p className="mt-2 text-sm leading-6 text-slate-500">
          Add a patient story to instantly see how the testimonial card feels in
          the website section.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-[28px] border border-amber-100 bg-white p-6 shadow-[0_20px_60px_-35px_rgba(168,119,0,0.45)]">
      <div className="h-1.5 w-24 rounded-full bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-300" />
      <div className="mt-5 flex items-start justify-between gap-4">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50 text-2xl font-semibold text-amber-600">
          "
        </div>
        <RatingStars rating={Number(review.rating ?? 5)} />
      </div>

      <p className="mt-5 min-h-[132px] text-sm leading-7 text-slate-600">
        {review.review?.trim() ||
          "Your testimonial copy will show here with the same warm visual treatment used across the panel preview."}
      </p>

      <div className="mt-6 border-t border-slate-100 pt-5">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-amber-500 to-yellow-500 text-sm font-semibold text-white">
            {getInitials(review.name?.trim() || "Guest")}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-slate-900">
              {review.name?.trim() || "Patient name"}
            </p>
            <p className="truncate text-xs text-slate-500">
              {[review.location, review.treatment].filter(Boolean).join(" | ") ||
                "Location | Treatment"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function ShortPreviewCard({
  short,
}: {
  short?: Partial<ShortItem> | Partial<ShortPayload>;
}) {
  if (!short) {
    return (
      <div className="rounded-[28px] border border-dashed border-slate-200 bg-slate-50 p-8 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white shadow-sm">
          <Video className="text-rose-500" size={22} />
        </div>
        <p className="mt-4 text-base font-semibold text-slate-900">
          Short preview will appear here
        </p>
        <p className="mt-2 text-sm leading-6 text-slate-500">
          Paste a YouTube Shorts link and the preview will automatically pull a
          thumbnail when one is available.
        </p>
      </div>
    );
  }

  const thumbnail = getShortThumbnail(short);

  return (
    <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_25px_70px_-42px_rgba(15,23,42,0.5)]">
      <div className="relative h-[340px] bg-slate-950">
        {thumbnail ? (
          <img
            src={thumbnail}
            alt={short.title?.trim() || "Short preview"}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-rose-500 via-orange-500 to-amber-400" />
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/10 to-slate-950/20" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/90 shadow-lg backdrop-blur">
            <Play className="ml-1 text-rose-500" size={28} />
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-5">
          <div className="flex items-center gap-2">
            <Badge className="bg-white/15 text-white backdrop-blur-sm">
              {short.isActive === false ? "Hidden" : "Live"}
            </Badge>
            <Badge className="bg-white/15 text-white backdrop-blur-sm">
              #{short.sortOrder ?? 0}
            </Badge>
          </div>
          <p className="mt-3 line-clamp-2 text-base font-semibold text-white">
            {short.title?.trim() || "Short title preview"}
          </p>
          <p className="mt-1 text-xs text-white/75">
            {getShortHost(short.shortUrl?.trim() || "")}
          </p>
        </div>
      </div>
    </div>
  );
}

export default function ReviewsAndShortsPage() {
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<ContentTab>("reviews");
  const [reviewSearch, setReviewSearch] = useState("");
  const [shortSearch, setShortSearch] = useState("");

  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [reviewDialogMode, setReviewDialogMode] = useState<FormMode>("add");
  const [selectedReview, setSelectedReview] = useState<ReviewItem | null>(null);
  const [reviewDeleteTarget, setReviewDeleteTarget] = useState<ReviewItem | null>(
    null,
  );
  const [reviewForm, setReviewForm] = useState<ReviewFormData>(emptyReviewForm);
  const [reviewErrors, setReviewErrors] = useState<ReviewFormErrors>({});

  const [shortDialogOpen, setShortDialogOpen] = useState(false);
  const [shortDialogMode, setShortDialogMode] = useState<FormMode>("add");
  const [selectedShort, setSelectedShort] = useState<ShortItem | null>(null);
  const [shortDeleteTarget, setShortDeleteTarget] = useState<ShortItem | null>(
    null,
  );
  const [shortForm, setShortForm] = useState<ShortFormData>(emptyShortForm);
  const [shortErrors, setShortErrors] = useState<ShortFormErrors>({});

  const {
    data: reviews = [],
    isLoading: isReviewsLoading,
    isError: isReviewsError,
    error: reviewsError,
  } = useQuery<ReviewItem[], Error>({
    queryKey: REVIEW_QUERY_KEY,
    queryFn: getAllReviewsApi,
  });

  const {
    data: shorts = [],
    isLoading: isShortsLoading,
    isError: isShortsError,
    error: shortsError,
  } = useQuery<ShortItem[], Error>({
    queryKey: SHORT_QUERY_KEY,
    queryFn: getAllShortsApi,
  });

  const addReviewMutation = useMutation({ mutationFn: addReviewApi });
  const updateReviewMutation = useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: Partial<ReviewPayload>;
    }) => updateReviewApi(id, payload),
  });
  const deleteReviewMutation = useMutation({ mutationFn: deleteReviewApi });

  const addShortMutation = useMutation({ mutationFn: addShortApi });
  const updateShortMutation = useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: Partial<ShortPayload>;
    }) => updateShortApi(id, payload),
  });
  const deleteShortMutation = useMutation({ mutationFn: deleteShortApi });

  const isReviewBusy =
    addReviewMutation.isPending ||
    updateReviewMutation.isPending ||
    deleteReviewMutation.isPending;
  const isShortBusy =
    addShortMutation.isPending ||
    updateShortMutation.isPending ||
    deleteShortMutation.isPending;

  const filteredReviews = useMemo(() => {
    if (!reviewSearch.trim()) {
      return reviews;
    }

    const query = reviewSearch.toLowerCase();
    return reviews.filter((item) =>
      [
        item.name,
        item.review,
        item.location,
        item.treatment,
        item.rating,
        item.sortOrder,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query)),
    );
  }, [reviewSearch, reviews]);

  const filteredShorts = useMemo(() => {
    if (!shortSearch.trim()) {
      return shorts;
    }

    const query = shortSearch.toLowerCase();
    return shorts.filter((item) =>
      [item.title, item.shortUrl, item.thumbnail, item.sortOrder]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query)),
    );
  }, [shortSearch, shorts]);

  const featuredReview = filteredReviews[0] ?? reviews[0];
  const featuredShort = filteredShorts[0] ?? shorts[0];

  const reviewCount = reviews.length;
  const activeReviewCount = reviews.filter((item) => item.isActive !== false).length;
  const shortCount = shorts.length;
  const activeShortCount = shorts.filter((item) => item.isActive !== false).length;

  function setReviewField<K extends keyof ReviewFormData>(
    key: K,
    value: ReviewFormData[K],
  ) {
    setReviewForm((prev) => ({ ...prev, [key]: value }));
    if (reviewErrors[key]) {
      setReviewErrors((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    }
  }

  function setShortField<K extends keyof ShortFormData>(
    key: K,
    value: ShortFormData[K],
  ) {
    setShortForm((prev) => ({ ...prev, [key]: value }));
    if (shortErrors[key]) {
      setShortErrors((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    }
  }

  function openAddReview() {
    setActiveTab("reviews");
    setReviewDialogMode("add");
    setSelectedReview(null);
    setReviewForm(emptyReviewForm);
    setReviewErrors({});
    setReviewDialogOpen(true);
  }

  function openEditReview(review: ReviewItem) {
    setActiveTab("reviews");
    setReviewDialogMode("edit");
    setSelectedReview(review);
    setReviewForm({
      name: review.name ?? "",
      review: review.review ?? "",
      location: review.location ?? "",
      treatment: review.treatment ?? "",
      rating: String(review.rating ?? 5),
      sortOrder: String(review.sortOrder ?? 0),
      isActive: review.isActive !== false,
    });
    setReviewErrors({});
    setReviewDialogOpen(true);
  }

  function openAddShort() {
    setActiveTab("shorts");
    setShortDialogMode("add");
    setSelectedShort(null);
    setShortForm(emptyShortForm);
    setShortErrors({});
    setShortDialogOpen(true);
  }

  function openEditShort(short: ShortItem) {
    setActiveTab("shorts");
    setShortDialogMode("edit");
    setSelectedShort(short);
    setShortForm({
      title: short.title ?? "",
      shortUrl: short.shortUrl ?? "",
      thumbnail: short.thumbnail ?? "",
      sortOrder: String(short.sortOrder ?? 0),
      isActive: short.isActive !== false,
    });
    setShortErrors({});
    setShortDialogOpen(true);
  }

  async function handleSaveReview() {
    const errors = validateReviewForm(reviewForm);
    if (Object.keys(errors).length > 0) {
      setReviewErrors(errors);
      return;
    }

    const payload = buildReviewPayload(reviewForm);

    try {
      if (reviewDialogMode === "edit" && selectedReview) {
        await updateReviewMutation.mutateAsync({
          id: selectedReview._id,
          payload,
        });
        toast.success("Review updated successfully.");
      } else {
        await addReviewMutation.mutateAsync(payload);
        toast.success("Review added successfully.");
      }

      await queryClient.invalidateQueries({ queryKey: REVIEW_QUERY_KEY });
      setReviewDialogOpen(false);
      setSelectedReview(null);
      setReviewForm(emptyReviewForm);
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  }

  async function handleSaveShort() {
    const errors = validateShortForm(shortForm);
    if (Object.keys(errors).length > 0) {
      setShortErrors(errors);
      return;
    }

    const payload = buildShortPayload(shortForm);

    try {
      if (shortDialogMode === "edit" && selectedShort) {
        await updateShortMutation.mutateAsync({
          id: selectedShort._id,
          payload,
        });
        toast.success("Short updated successfully.");
      } else {
        await addShortMutation.mutateAsync(payload);
        toast.success("Short added successfully.");
      }

      await queryClient.invalidateQueries({ queryKey: SHORT_QUERY_KEY });
      setShortDialogOpen(false);
      setSelectedShort(null);
      setShortForm(emptyShortForm);
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  }

  async function handleDeleteReview() {
    if (!reviewDeleteTarget) {
      return;
    }

    try {
      await deleteReviewMutation.mutateAsync(reviewDeleteTarget._id);
      toast.success("Review deleted successfully.");
      await queryClient.invalidateQueries({ queryKey: REVIEW_QUERY_KEY });
      setReviewDeleteTarget(null);
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  }

  async function handleDeleteShort() {
    if (!shortDeleteTarget) {
      return;
    }

    try {
      await deleteShortMutation.mutateAsync(shortDeleteTarget._id);
      toast.success("Short deleted successfully.");
      await queryClient.invalidateQueries({ queryKey: SHORT_QUERY_KEY });
      setShortDeleteTarget(null);
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  }

  async function handleReviewVisibilityChange(review: ReviewItem, checked: boolean) {
    try {
      await updateReviewMutation.mutateAsync({
        id: review._id,
        payload: { isActive: checked },
      });
      toast.success(
        checked ? "Review made visible on website." : "Review hidden from website.",
      );
      await queryClient.invalidateQueries({ queryKey: REVIEW_QUERY_KEY });
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  }

  async function handleShortVisibilityChange(short: ShortItem, checked: boolean) {
    try {
      await updateShortMutation.mutateAsync({
        id: short._id,
        payload: { isActive: checked },
      });
      toast.success(
        checked ? "Short published successfully." : "Short hidden successfully.",
      );
      await queryClient.invalidateQueries({ queryKey: SHORT_QUERY_KEY });
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  }

  return (
    <div className="space-y-6" data-ocid="reviews_shorts.page">
      <PageHeader
        title="Reviews & Shorts"
        description="Super Admin can manage testimonial cards and video shorts from one clean publishing workspace."
        action={
          <>
            <Button
              type="button"
              variant="outline"
              className="rounded-xl border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100 hover:text-amber-800"
              onClick={openAddReview}
              data-ocid="reviews_shorts.add_review_button"
            >
              <Plus size={15} />
              Add Review
            </Button>
            <Button
              type="button"
              className="rounded-xl bg-rose-500 text-white shadow-sm hover:bg-rose-600"
              onClick={openAddShort}
              data-ocid="reviews_shorts.add_short_button"
            >
              <Plus size={15} />
              Add Short
            </Button>
          </>
        }
      />

      <div className="grid gap-4 xl:grid-cols-[1.3fr_repeat(3,minmax(0,1fr))]">
        <Card className="overflow-hidden border-0 bg-gradient-to-br from-slate-900 via-slate-800 to-amber-800 text-white shadow-[0_30px_90px_-45px_rgba(15,23,42,0.85)] xl:col-span-1">
          <CardContent className="relative p-6">
            <div className="absolute inset-0 opacity-20">
              <div className="absolute -right-16 -top-12 h-40 w-40 rounded-full bg-white/20 blur-3xl" />
              <div className="absolute bottom-0 left-0 h-32 w-32 rounded-full bg-amber-300/20 blur-3xl" />
            </div>
            <div className="relative">
              <Badge className="bg-white/10 text-white backdrop-blur-sm">
                Publishing Console
              </Badge>
              <h2 className="mt-4 text-2xl font-bold leading-tight">
                Shape the patient trust section without leaving the admin panel.
              </h2>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-white/75">
                Add polished patient testimonials, control their display order,
                and keep your shorts library fresh with fast preview-first
                editing.
              </p>
              <div className="mt-6 flex flex-wrap gap-2 text-xs text-white/80">
                <Badge className="bg-white/10 text-white backdrop-blur-sm">
                  Admin only
                </Badge>
                <Badge className="bg-white/10 text-white backdrop-blur-sm">
                  Live visibility toggle
                </Badge>
                <Badge className="bg-white/10 text-white backdrop-blur-sm">
                  Website-ready preview
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <MetricCard
          label="Total Reviews"
          value={String(reviewCount)}
          hint={`${activeReviewCount} currently visible on site`}
          icon={MessageSquare}
          accentClass="bg-gradient-to-br from-amber-500 to-yellow-500"
        />
        <MetricCard
          label="Average Rating"
          value={getAverageRating(reviews)}
          hint="Calculated from all stored testimonials"
          icon={Star}
          accentClass="bg-gradient-to-br from-amber-500 to-orange-500"
        />
        <MetricCard
          label="Live Shorts"
          value={String(activeShortCount)}
          hint={`${shortCount} total videos in the library`}
          icon={Video}
          accentClass="bg-gradient-to-br from-rose-500 to-orange-500"
        />
      </div>

      <Tabs
        value={activeTab}
        onValueChange={(value) => setActiveTab(value as ContentTab)}
        className="space-y-6"
      >
        <div className="overflow-x-auto">
          <TabsList className="inline-flex min-w-max rounded-2xl bg-slate-100 p-1.5">
            <TabsTrigger
              value="reviews"
              className="rounded-xl px-4 py-2 text-sm font-medium data-[state=active]:bg-white data-[state=active]:text-amber-700 data-[state=active]:shadow-sm"
              data-ocid="reviews_shorts.reviews_tab"
            >
              <MessageSquare size={14} className="mr-2" />
              Patient Reviews
            </TabsTrigger>
            <TabsTrigger
              value="shorts"
              className="rounded-xl px-4 py-2 text-sm font-medium data-[state=active]:bg-white data-[state=active]:text-rose-600 data-[state=active]:shadow-sm"
              data-ocid="reviews_shorts.shorts_tab"
            >
              <Video size={14} className="mr-2" />
              Video Shorts
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="reviews" className="mt-0">
          <div className="grid gap-6">
            <Card className="border-slate-200 shadow-sm">
              <CardHeader className="gap-4 border-b border-slate-100 pb-5">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                  <div>
                    <CardTitle className="text-lg text-slate-900">
                      Review Library
                    </CardTitle>
                    <CardDescription className="mt-1 text-sm text-slate-500">
                      Search, reorder, edit, and hide testimonials in seconds.
                    </CardDescription>
                  </div>
                  <div className="relative w-full lg:w-80">
                    <Search
                      size={15}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                    />
                    <Input
                      value={reviewSearch}
                      onChange={(event) => setReviewSearch(event.target.value)}
                      placeholder="Search by name, review, location..."
                      className="rounded-xl border-slate-200 pl-9"
                      data-ocid="reviews_shorts.review_search_input"
                    />
                  </div>
                </div>
              </CardHeader>

              <CardContent className="p-5">
                {isReviewsLoading ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map((item) => (
                      <div
                        key={`review-skeleton-${item}`}
                        className="rounded-2xl border border-slate-200 p-5"
                      >
                        <div className="flex items-center justify-between gap-4">
                          <div className="flex items-center gap-3">
                            <Skeleton className="h-11 w-11 rounded-full" />
                            <div className="space-y-2">
                              <Skeleton className="h-4 w-32" />
                              <Skeleton className="h-3 w-20" />
                            </div>
                          </div>
                          <Skeleton className="h-8 w-20 rounded-full" />
                        </div>
                        <Skeleton className="mt-4 h-4 w-full" />
                        <Skeleton className="mt-2 h-4 w-11/12" />
                        <Skeleton className="mt-2 h-4 w-9/12" />
                      </div>
                    ))}
                  </div>
                ) : isReviewsError ? (
                  <div className="rounded-2xl border border-red-100 bg-red-50 p-5 text-sm text-red-600">
                    {reviewsError?.message || "Unable to load reviews."}
                  </div>
                ) : filteredReviews.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-10 text-center">
                    <p className="text-base font-semibold text-slate-900">
                      No reviews found
                    </p>
                    <p className="mt-2 text-sm text-slate-500">
                      Try another search or add the first patient testimonial.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredReviews.map((review, index) => (
                      <div
                        key={review._id}
                        className="rounded-2xl border border-slate-200 bg-white p-5 transition hover:border-amber-200 hover:shadow-sm"
                        data-ocid={`reviews_shorts.review_item.${index + 1}`}
                      >
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                          <div className="flex items-start gap-3">
                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-amber-500 to-yellow-500 text-sm font-semibold text-white">
                              {getInitials(review.name)}
                            </div>
                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <p className="text-sm font-semibold text-slate-900">
                                  {review.name}
                                </p>
                                <Badge className="bg-slate-100 text-slate-700">
                                  #{review.sortOrder ?? 0}
                                </Badge>
                                <Badge
                                  className={
                                    review.isActive === false
                                      ? "bg-slate-100 text-slate-600"
                                      : "bg-emerald-50 text-emerald-700"
                                  }
                                >
                                  {review.isActive === false ? "Hidden" : "Visible"}
                                </Badge>
                              </div>
                              <div className="mt-2 flex flex-wrap items-center gap-2">
                                <RatingStars rating={Number(review.rating ?? 5)} />
                                {review.location ? (
                                  <Badge
                                    variant="outline"
                                    className="border-slate-200 text-slate-600"
                                  >
                                    {review.location}
                                  </Badge>
                                ) : null}
                                {review.treatment ? (
                                  <Badge
                                    variant="outline"
                                    className="border-slate-200 text-slate-600"
                                  >
                                    {review.treatment}
                                  </Badge>
                                ) : null}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 self-start">
                            <Button
                              type="button"
                              size="icon"
                              variant="ghost"
                              className="rounded-xl text-slate-500 hover:bg-amber-50 hover:text-amber-700"
                              onClick={() => openEditReview(review)}
                              data-ocid={`reviews_shorts.review_edit_button.${index + 1}`}
                            >
                              <Pencil size={15} />
                            </Button>
                            <Button
                              type="button"
                              size="icon"
                              variant="ghost"
                              className="rounded-xl text-slate-500 hover:bg-red-50 hover:text-red-600"
                              onClick={() => setReviewDeleteTarget(review)}
                              data-ocid={`reviews_shorts.review_delete_button.${index + 1}`}
                            >
                              <Trash2 size={15} />
                            </Button>
                          </div>
                        </div>

                        <p className="mt-4 text-sm leading-7 text-slate-600">
                          {review.review}
                        </p>

                        <div className="mt-4 flex flex-col gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
                          <p className="text-xs text-slate-500">
                            Use sort order to control how testimonials appear on
                            the website.
                          </p>
                          <div className="flex items-center gap-3">
                            <span className="text-xs font-medium text-slate-500">
                              Live on website
                            </span>
                            <Switch
                              checked={review.isActive !== false}
                              onCheckedChange={(checked) =>
                                handleReviewVisibilityChange(review, checked)
                              }
                              disabled={updateReviewMutation.isPending}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* <div className="space-y-6 xl:sticky xl:top-24">
              <Card className="border-slate-200 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg text-slate-900">
                    Featured Preview
                  </CardTitle>
                  <CardDescription>
                    A quick visual check for how the highlighted testimonial will
                    feel on the homepage.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ReviewPreviewCard review={featuredReview} />
                </CardContent>
              </Card>

              <Card className="border-slate-200 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg text-slate-900">
                    Publishing Tips
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm leading-6 text-slate-600">
                  <div className="rounded-2xl bg-amber-50 p-4">
                    Keep reviews concise, human, and specific so cards stay
                    readable in the website carousel.
                  </div>
                  <div className="rounded-2xl bg-slate-50 p-4">
                    Use sort order `0`, `1`, `2` to curate the first few
                    testimonials visitors see.
                  </div>
                  <div className="rounded-2xl bg-emerald-50 p-4">
                    Hide older reviews instead of deleting them when you may want
                    to reuse them later.
                  </div>
                </CardContent>
              </Card>
            </div> */}
          </div>
        </TabsContent>

        <TabsContent value="shorts" className="mt-0">
          <div className="grid gap-6">
            <Card className="border-slate-200 shadow-sm">
              <CardHeader className="gap-4 border-b border-slate-100 pb-5">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                  <div>
                    <CardTitle className="text-lg text-slate-900">
                      Shorts Library
                    </CardTitle>
                    <CardDescription className="mt-1 text-sm text-slate-500">
                      Manage video snippets with thumbnail preview and instant
                      publish controls.
                    </CardDescription>
                  </div>
                  <div className="relative w-full lg:w-80">
                    <Search
                      size={15}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                    />
                    <Input
                      value={shortSearch}
                      onChange={(event) => setShortSearch(event.target.value)}
                      placeholder="Search by title or link..."
                      className="rounded-xl border-slate-200 pl-9"
                      data-ocid="reviews_shorts.short_search_input"
                    />
                  </div>
                </div>
              </CardHeader>

              <CardContent className="p-5">
                {isShortsLoading ? (
                  <div className="grid gap-4 md:grid-cols-2">
                    {[1, 2, 3, 4].map((item) => (
                      <div
                        key={`short-skeleton-${item}`}
                        className="rounded-3xl border border-slate-200 p-4"
                      >
                        <Skeleton className="aspect-[9/16] w-full rounded-2xl" />
                        <Skeleton className="mt-4 h-4 w-3/4" />
                        <Skeleton className="mt-2 h-4 w-1/2" />
                      </div>
                    ))}
                  </div>
                ) : isShortsError ? (
                  <div className="rounded-2xl border border-red-100 bg-red-50 p-5 text-sm text-red-600">
                    {shortsError?.message || "Unable to load shorts."}
                  </div>
                ) : filteredShorts.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-10 text-center">
                    <p className="text-base font-semibold text-slate-900">
                      No shorts found
                    </p>
                    <p className="mt-2 text-sm text-slate-500">
                      Paste your first short URL to start building the video
                      showcase.
                    </p>
                  </div>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2">
                    {filteredShorts.map((short, index) => {
                      const thumbnail = getShortThumbnail(short);

                      return (
                        <div
                          key={short._id}
                          className="overflow-hidden rounded-3xl border border-slate-200 bg-white transition hover:border-rose-200 hover:shadow-sm"
                          data-ocid={`reviews_shorts.short_item.${index + 1}`}
                        >
                          <div className="relative h-[340px] bg-slate-950">
                            {thumbnail ? (
                              <img
                                src={thumbnail}
                                alt={short.title}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-rose-500 via-orange-500 to-amber-400" />
                            )}
                            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/10 to-slate-950/15" />
                            <div className="absolute inset-0 flex items-center justify-center">
                              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/90 shadow-lg">
                                <Play className="ml-1 text-rose-500" size={24} />
                              </div>
                            </div>
                            <div className="absolute right-4 top-4 flex gap-2">
                              <Badge className="bg-white/15 text-white backdrop-blur-sm">
                                #{short.sortOrder ?? 0}
                              </Badge>
                              <Badge className="bg-white/15 text-white backdrop-blur-sm">
                                {short.isActive === false ? "Hidden" : "Live"}
                              </Badge>
                            </div>
                          </div>

                          <div className="space-y-4 p-4">
                            <div>
                              <p className="line-clamp-2 text-sm font-semibold text-slate-900">
                                {short.title}
                              </p>
                              <p className="mt-1 text-xs text-slate-500">
                                {getShortHost(short.shortUrl)}
                              </p>
                            </div>

                            <div className="flex items-center justify-between gap-3">
                              <div className="flex items-center gap-3">
                                <span className="text-xs font-medium text-slate-500">
                                  Live
                                </span>
                                <Switch
                                  checked={short.isActive !== false}
                                  onCheckedChange={(checked) =>
                                    handleShortVisibilityChange(short, checked)
                                  }
                                  disabled={updateShortMutation.isPending}
                                />
                              </div>

                              <div className="flex items-center gap-1">
                                <Button
                                  type="button"
                                  size="icon"
                                  variant="ghost"
                                  className="rounded-xl text-slate-500 hover:bg-slate-100 hover:text-slate-700"
                                  onClick={() =>
                                    window.open(
                                      short.shortUrl,
                                      "_blank",
                                      "noopener,noreferrer",
                                    )
                                  }
                                  data-ocid={`reviews_shorts.short_open_button.${index + 1}`}
                                >
                                  <ExternalLink size={15} />
                                </Button>
                                <Button
                                  type="button"
                                  size="icon"
                                  variant="ghost"
                                  className="rounded-xl text-slate-500 hover:bg-amber-50 hover:text-amber-700"
                                  onClick={() => openEditShort(short)}
                                  data-ocid={`reviews_shorts.short_edit_button.${index + 1}`}
                                >
                                  <Pencil size={15} />
                                </Button>
                                <Button
                                  type="button"
                                  size="icon"
                                  variant="ghost"
                                  className="rounded-xl text-slate-500 hover:bg-red-50 hover:text-red-600"
                                  onClick={() => setShortDeleteTarget(short)}
                                  data-ocid={`reviews_shorts.short_delete_button.${index + 1}`}
                                >
                                  <Trash2 size={15} />
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* <div className="space-y-6 xl:sticky xl:top-24">
              <Card className="border-slate-200 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg text-slate-900">
                    Featured Preview
                  </CardTitle>
                  <CardDescription>
                    A vertical card preview to sanity-check title, thumbnail, and
                    publish state.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ShortPreviewCard short={featuredShort} />
                </CardContent>
              </Card>

              <Card className="border-slate-200 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg text-slate-900">
                    Workflow Notes
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm leading-6 text-slate-600">
                  <div className="rounded-2xl bg-rose-50 p-4">
                    Paste a YouTube Shorts URL and let the panel auto-generate a
                    thumbnail when possible.
                  </div>
                  <div className="rounded-2xl bg-slate-50 p-4">
                    Keep titles short so mobile cards stay crisp and readable.
                  </div>
                  <div className="rounded-2xl bg-amber-50 p-4">
                    Use the visibility toggle to stage videos before they go live
                    on the website.
                  </div>
                </CardContent>
              </Card>
            </div> */}
          </div>
        </TabsContent>
      </Tabs>

      <Dialog open={reviewDialogOpen} onOpenChange={setReviewDialogOpen}>
        <DialogContent className="max-h-[92vh] overflow-y-auto rounded-3xl border-slate-200 sm:max-w-4xl">
          <DialogHeader>
            <DialogTitle className="text-xl text-slate-900">
              {reviewDialogMode === "edit" ? "Edit Review" : "Add Review"}
            </DialogTitle>
          </DialogHeader>

          <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
            <div className="space-y-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="review-name">Reviewer Name</Label>
                  <Input
                    id="review-name"
                    value={reviewForm.name}
                    onChange={(event) =>
                      setReviewField("name", event.target.value)
                    }
                    placeholder="Rajesh Kumar"
                    className="rounded-xl"
                  />
                  {reviewErrors.name ? (
                    <p className="text-xs text-red-500">{reviewErrors.name}</p>
                  ) : null}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="review-location">Location</Label>
                  <Input
                    id="review-location"
                    value={reviewForm.location}
                    onChange={(event) =>
                      setReviewField("location", event.target.value)
                    }
                    placeholder="Bhiwani"
                    className="rounded-xl"
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="review-treatment">Treatment</Label>
                  <Input
                    id="review-treatment"
                    value={reviewForm.treatment}
                    onChange={(event) =>
                      setReviewField("treatment", event.target.value)
                    }
                    placeholder="Cosmetic Surgery"
                    className="rounded-xl"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="review-rating">Rating</Label>
                  <Select
                    value={reviewForm.rating}
                    onValueChange={(value) => setReviewField("rating", value)}
                  >
                    <SelectTrigger id="review-rating" className="rounded-xl">
                      <SelectValue placeholder="Select rating" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="5">5 Stars</SelectItem>
                      <SelectItem value="4">4 Stars</SelectItem>
                      <SelectItem value="3">3 Stars</SelectItem>
                      <SelectItem value="2">2 Stars</SelectItem>
                      <SelectItem value="1">1 Star</SelectItem>
                    </SelectContent>
                  </Select>
                  {reviewErrors.rating ? (
                    <p className="text-xs text-red-500">{reviewErrors.rating}</p>
                  ) : null}
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-[160px_1fr]">
                <div className="space-y-2">
                  <Label htmlFor="review-sort-order">Sort Order</Label>
                  <Input
                    id="review-sort-order"
                    type="number"
                    min="0"
                    value={reviewForm.sortOrder}
                    onChange={(event) =>
                      setReviewField("sortOrder", event.target.value)
                    }
                    className="rounded-xl"
                  />
                  {reviewErrors.sortOrder ? (
                    <p className="text-xs text-red-500">
                      {reviewErrors.sortOrder}
                    </p>
                  ) : null}
                </div>

                <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <div>
                    <p className="text-sm font-medium text-slate-900">
                      Visible on website
                    </p>
                    <p className="text-xs text-slate-500">
                      Turn this off to keep the review saved but hidden.
                    </p>
                  </div>
                  <Switch
                    checked={reviewForm.isActive}
                    onCheckedChange={(checked) =>
                      setReviewField("isActive", checked)
                    }
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="review-copy">Review Text</Label>
                <Textarea
                  id="review-copy"
                  rows={6}
                  value={reviewForm.review}
                  onChange={(event) =>
                    setReviewField("review", event.target.value)
                  }
                  placeholder="Patient experience goes here..."
                  className="min-h-[180px] rounded-2xl"
                />
                {reviewErrors.review ? (
                  <p className="text-xs text-red-500">{reviewErrors.review}</p>
                ) : null}
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <p className="text-sm font-semibold text-slate-900">
                  Live Card Preview
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  This helps you tune copy length before saving.
                </p>
              </div>
              <ReviewPreviewCard review={buildReviewPayload(reviewForm)} />
            </div>
          </div>

          <DialogFooter className="mt-2 gap-2">
            <Button
              type="button"
              variant="outline"
              className="rounded-xl"
              onClick={() => setReviewDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              className="rounded-xl bg-amber-500 text-white hover:bg-amber-600"
              onClick={handleSaveReview}
              disabled={isReviewBusy}
            >
              {reviewDialogMode === "edit" ? "Save Changes" : "Add Review"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={shortDialogOpen} onOpenChange={setShortDialogOpen}>
        <DialogContent className="max-h-[92vh] overflow-y-auto rounded-3xl border-slate-200 sm:max-w-4xl">
          <DialogHeader>
            <DialogTitle className="text-xl text-slate-900">
              {shortDialogMode === "edit" ? "Edit Short" : "Add Short"}
            </DialogTitle>
          </DialogHeader>

          <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
            <div className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="short-title">Short Title</Label>
                <Input
                  id="short-title"
                  value={shortForm.title}
                  onChange={(event) => setShortField("title", event.target.value)}
                  placeholder="Best cosmetic surgeon in Hisar"
                  className="rounded-xl"
                />
                {shortErrors.title ? (
                  <p className="text-xs text-red-500">{shortErrors.title}</p>
                ) : null}
              </div>

              <div className="space-y-2">
                <Label htmlFor="short-url">Video URL</Label>
                <Input
                  id="short-url"
                  value={shortForm.shortUrl}
                  onChange={(event) =>
                    setShortField("shortUrl", event.target.value)
                  }
                  placeholder="https://www.youtube.com/shorts/..."
                  className="rounded-xl"
                />
                {shortErrors.shortUrl ? (
                  <p className="text-xs text-red-500">{shortErrors.shortUrl}</p>
                ) : null}
              </div>

              <div className="space-y-2">
                <Label htmlFor="short-thumbnail">Thumbnail URL</Label>
                <Input
                  id="short-thumbnail"
                  value={shortForm.thumbnail}
                  onChange={(event) =>
                    setShortField("thumbnail", event.target.value)
                  }
                  placeholder="Optional. Leave blank to auto-generate for YouTube."
                  className="rounded-xl"
                />
                {shortErrors.thumbnail ? (
                  <p className="text-xs text-red-500">{shortErrors.thumbnail}</p>
                ) : (
                  <p className="text-xs text-slate-500">
                    Leave this empty for YouTube Shorts and the panel will try
                    to use the video thumbnail automatically.
                  </p>
                )}
              </div>

              <div className="grid gap-4 sm:grid-cols-[160px_1fr]">
                <div className="space-y-2">
                  <Label htmlFor="short-sort-order">Sort Order</Label>
                  <Input
                    id="short-sort-order"
                    type="number"
                    min="0"
                    value={shortForm.sortOrder}
                    onChange={(event) =>
                      setShortField("sortOrder", event.target.value)
                    }
                    className="rounded-xl"
                  />
                  {shortErrors.sortOrder ? (
                    <p className="text-xs text-red-500">
                      {shortErrors.sortOrder}
                    </p>
                  ) : null}
                </div>

                <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <div>
                    <p className="text-sm font-medium text-slate-900">
                      Publish on website
                    </p>
                    <p className="text-xs text-slate-500">
                      Keep it off if you want to prepare content first.
                    </p>
                  </div>
                  <Switch
                    checked={shortForm.isActive}
                    onCheckedChange={(checked) =>
                      setShortField("isActive", checked)
                    }
                  />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <p className="text-sm font-semibold text-slate-900">
                  Vertical Preview
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  Perfect for quickly checking title length and thumbnail impact.
                </p>
              </div>
              <ShortPreviewCard short={buildShortPayload(shortForm)} />
            </div>
          </div>

          <DialogFooter className="mt-2 gap-2">
            <Button
              type="button"
              variant="outline"
              className="rounded-xl"
              onClick={() => setShortDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              className="rounded-xl bg-rose-500 text-white hover:bg-rose-600"
              onClick={handleSaveShort}
              disabled={isShortBusy}
            >
              {shortDialogMode === "edit" ? "Save Changes" : "Add Short"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!reviewDeleteTarget}
        title="Delete this review?"
        message="This testimonial will be removed from the library. You can hide reviews instead if you only want them off the website."
        confirmLabel="Delete Review"
        onConfirm={handleDeleteReview}
        onCancel={() => setReviewDeleteTarget(null)}
      />

      <ConfirmDialog
        open={!!shortDeleteTarget}
        title="Delete this short?"
        message="This video entry will be removed from the admin library."
        confirmLabel="Delete Short"
        onConfirm={handleDeleteShort}
        onCancel={() => setShortDeleteTarget(null)}
      />
    </div>
  );
}
