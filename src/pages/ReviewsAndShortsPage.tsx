import {
  type ShortItem,
  type ShortPayload,
  addShortApi,
  deleteShortApi,
  getAllShortsApi,
  updateShortApi,
} from "@/apiCalls/shorts";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { type Column, DataTable } from "@/components/admin/DataTable";
import { PageHeader } from "@/components/admin/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Eye,
  Pencil,
  Play,
  Plus,
  Search,
  Trash2,
  Video,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

// type ContentTab = "reviews" | "shorts";
type FormMode = "add" | "edit";

type ShortFormData = {
  title: string;
  shortUrl: string;
  thumbnail: string;
  sortOrder: string;
  isActive: boolean;
};

type ShortFormErrors = Partial<Record<keyof ShortFormData, string>>;

const SHORT_QUERY_KEY = ["shorts-management"];

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

function isValidHttpUrl(value: string) {
  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
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

function buildShortPayload(form: ShortFormData): ShortPayload {
  return {
    title: form.title.trim(),
    shortUrl: form.shortUrl.trim(),
    thumbnail: form.thumbnail.trim() || getShortThumbnail(form),
    sortOrder: Number(form.sortOrder),
    isActive: form.isActive,
  };
}

function ShortPreviewCard({
  short,
}: {
  short?: Partial<ShortItem> | Partial<ShortPayload>;
}) {
  if (!short) {
    return (
      <div className="rounded-[28px] border border-dashed border-border bg-muted/60 p-8 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-card shadow-sm">
          <Video className="text-destructive" size={22} />
        </div>
        <p className="mt-4 text-base font-semibold text-foreground">
          Short preview will appear here
        </p>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          Paste a YouTube Shorts link and the preview will automatically pull a
          thumbnail when one is available.
        </p>
      </div>
    );
  }

  const thumbnail = getShortThumbnail(short);

  return (
    <div className="overflow-hidden rounded-[28px] border border-border bg-card shadow-[0_25px_70px_-42px_rgba(15,23,42,0.5)]">
      <div className="relative h-[340px] bg-foreground">
        {thumbnail ? (
          <img
            src={thumbnail}
            alt={short.title?.trim() || "Short preview"}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary via-secondary to-accent" />
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-foreground/80 via-foreground/10 to-foreground/20" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-card/90 shadow-lg backdrop-blur">
            <Play className="ml-1 text-destructive" size={28} />
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-5">
          <div className="flex items-center gap-2">
            <Badge className="bg-card/15 text-white backdrop-blur-sm">
              {short.isActive === false ? "Hidden" : "Live"}
            </Badge>
            <Badge className="bg-card/15 text-white backdrop-blur-sm">
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

  const [activeTab, setActiveTab] = useState("shorts");
  const [shortSearch, setShortSearch] = useState("");

  const [shortDialogOpen, setShortDialogOpen] = useState(false);
  const [shortDialogMode, setShortDialogMode] = useState<FormMode>("add");
  const [selectedShort, setSelectedShort] = useState<ShortItem | null>(null);
  const [shortDeleteTarget, setShortDeleteTarget] = useState<ShortItem | null>(
    null,
  );
  const [shortPreviewTarget, setShortPreviewTarget] =
    useState<ShortItem | null>(null);
  const [shortForm, setShortForm] = useState<ShortFormData>(emptyShortForm);
  const [shortErrors, setShortErrors] = useState<ShortFormErrors>({});

  const {
    data: shorts = [],
    isLoading: isShortsLoading,
    isError: isShortsError,
    error: shortsError,
  } = useQuery<ShortItem[], Error>({
    queryKey: SHORT_QUERY_KEY,
    queryFn: getAllShortsApi,
  });

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

  const isShortBusy =
    addShortMutation.isPending ||
    updateShortMutation.isPending ||
    deleteShortMutation.isPending;

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

  async function handleShortVisibilityChange(
    short: ShortItem,
    checked: boolean,
  ) {
    try {
      await updateShortMutation.mutateAsync({
        id: short._id,
        payload: { isActive: checked },
      });
      toast.success(
        checked
          ? "Short published successfully."
          : "Short hidden successfully.",
      );
      await queryClient.invalidateQueries({ queryKey: SHORT_QUERY_KEY });
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  }

  const shortColumns: Column<ShortItem>[] = [
    {
      key: "title",
      header: "Title",
      render: (short) => (
        <div className="min-w-0">
          <p className="font-medium text-foreground truncate">{short.title}</p>
          <p className="text-xs text-muted-foreground truncate">
            {getShortHost(short.shortUrl)}
          </p>
        </div>
      ),
    },
    {
      key: "sortOrder",
      header: "Order",
      render: (short) => (
        <span className="text-sm text-muted-foreground">#{short.sortOrder ?? 0}</span>
      ),
    },
    {
      key: "isActive",
      header: "Status",
      render: (short) => (
        <div className="flex items-center gap-3">
          <Badge
            className={
              short.isActive === false
                ? "bg-muted text-muted-foreground"
                : "bg-primary/10 text-primary"
            }
          >
            {short.isActive === false ? "Hidden" : "Live"}
          </Badge>
          <Switch
            checked={short.isActive !== false}
            onCheckedChange={(checked) =>
              handleShortVisibilityChange(short, checked)
            }
            disabled={updateShortMutation.isPending}
          />
        </div>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      className: "text-right",
      render: (short) => (
        <div className="flex items-center justify-end gap-2">
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="rounded-lg border-border"
            onClick={() => setShortPreviewTarget(short)}
          >
            <Eye size={14} />
            Preview
          </Button>
          <Button
            type="button"
            size="icon"
            variant="ghost"
            className="rounded-xl text-muted-foreground hover:bg-accent hover:text-secondary"
            onClick={() => openEditShort(short)}
          >
            <Pencil size={15} />
          </Button>
          <Button
            type="button"
            size="icon"
            variant="ghost"
            className="rounded-xl text-muted-foreground"
            onClick={() => setShortDeleteTarget(short)}
          >
            <Trash2 size={15} />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6" data-ocid="reviews_shorts.page">
      <PageHeader
        title="Shorts"
        description="Manage video shorts from one place."
        action={
          <Button
            type="button"
            className="rounded-xl bg-primary text-white shadow-sm hover:bg-destructive/90"
            onClick={openAddShort}
            data-ocid="reviews_shorts.add_short_button"
          >
            <Plus size={15} />
            Add Short
          </Button>
        }
      />

      <Tabs
        value={activeTab}
        className="space-y-6"
      >
        <div className="overflow-x-auto">
          <TabsList className="inline-flex min-w-max rounded-2xl bg-muted p-1.5">
            <TabsTrigger
              value="shorts"
              className="rounded-xl px-4 py-2 text-sm font-medium data-[state=active]:bg-card data-[state=active]:text-primary data-[state=active]:shadow-sm"
              data-ocid="reviews_shorts.shorts_tab"
            >
              <Video size={14} className="mr-2" />
              Video Shorts
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="shorts" className="mt-0">
          <div className="grid gap-6">
            <Card className="border-border shadow-sm">
              <CardHeader className="gap-4 border-b border-border pb-5">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                  <div>
                    <CardTitle className="text-lg text-foreground">
                      Shorts Library
                    </CardTitle>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Search, edit, preview, and publish shorts.
                    </p>
                  </div>
                  <div className="relative w-full lg:w-80">
                    <Search
                      size={15}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                    />
                    <Input
                      value={shortSearch}
                      onChange={(event) => setShortSearch(event.target.value)}
                      placeholder="Search by title or link..."
                      className="rounded-xl border-border pl-9"
                      data-ocid="reviews_shorts.short_search_input"
                    />
                  </div>
                </div>
              </CardHeader>

              <CardContent className="p-5">
                {isShortsLoading ? (
                  <Skeleton className="h-56 w-full rounded-2xl" />
                ) : isShortsError ? (
                  <div className="rounded-2xl border border-destructive/20 bg-destructive/10 p-5 text-sm text-destructive">
                    {shortsError?.message || "Unable to load shorts."}
                  </div>
                ) : filteredShorts.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-border bg-muted/60 p-10 text-center">
                    <p className="text-base font-semibold text-foreground">
                      No shorts found
                    </p>
                    <p className="mt-2 text-sm text-muted-foreground">
                      Paste your first short URL to start building the video
                      showcase.
                    </p>
                  </div>
                ) : (
                  <DataTable
                    columns={shortColumns}
                    data={filteredShorts}
                    rowKey={(short) => short._id}
                    emptyText="No shorts found."
                    data-ocid="reviews_shorts.shorts_table"
                  />
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      <Dialog open={shortDialogOpen} onOpenChange={setShortDialogOpen}>
        <DialogContent className="max-h-[92vh] overflow-y-auto rounded-3xl border-border sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl text-foreground">
              {shortDialogMode === "edit" ? "Edit Short" : "Add Short"}
            </DialogTitle>
          </DialogHeader>

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
                <p className="text-xs text-destructive">{shortErrors.title}</p>
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
                <p className="text-xs text-destructive">{shortErrors.shortUrl}</p>
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
                <p className="text-xs text-destructive">{shortErrors.thumbnail}</p>
              ) : (
                <p className="text-xs text-muted-foreground">
                  Leave this empty for YouTube Shorts and the panel will try to
                  use the video thumbnail automatically.
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
                  <p className="text-xs text-destructive">
                    {shortErrors.sortOrder}
                  </p>
                ) : null}
              </div>

              <div className="flex items-center justify-between rounded-2xl border border-border bg-muted/60 px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-foreground">
                    Publish on website
                  </p>
                  <p className="text-xs text-muted-foreground">
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

          <DialogFooter className="mt-2 gap-2 sm:justify-between">
            <Button
              type="button"
              variant="outline"
              className="rounded-xl"
              onClick={() =>
                setShortPreviewTarget({
                  _id: selectedShort?._id ?? "preview",
                  ...buildShortPayload(shortForm),
                })
              }
            >
              <Eye size={14} />
              Preview
            </Button>
            <div className="flex gap-2">
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
                className="rounded-xl bg-primary text-primary-foreground hover:bg-secondary"
                onClick={handleSaveShort}
                disabled={isShortBusy}
              >
                {shortDialogMode === "edit" ? "Save Changes" : "Add Short"}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!shortPreviewTarget}
        onOpenChange={(open) => !open && setShortPreviewTarget(null)}
      >
        <DialogContent className="max-h-[92vh] overflow-y-auto rounded-3xl border-border sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle className="text-xl text-foreground">
              Short Preview
            </DialogTitle>
          </DialogHeader>
          <ShortPreviewCard short={shortPreviewTarget ?? undefined} />
        </DialogContent>
      </Dialog>

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
