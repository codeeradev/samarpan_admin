import {
  getContentByModelKeyApi,
  upsertContentApi,
  type ContentItem,
} from "@/apiCalls/content";
import { BASE_URL } from "@/apis/endpoint";
import { PageHeader } from "@/components/admin/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  BadgeCheck,
  Eye,
  ImageIcon,
  LayoutTemplate,
  Save,
  Upload,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

const CONTENT_MODEL_KEY = "home_hero";
const CONTENT_TITLE = "Home Hero Section";
const API_ASSET_ORIGIN = BASE_URL.replace(/\/admin\/?$/, "");

type HeroFormState = {
  eyebrowText: string;
  titlePrefix: string;
  titleHighlight: string;
  titleSuffix: string;
  description: string;
  primaryCtaText: string;
  primaryCtaLink: string;
  secondaryCtaText: string;
  secondaryCtaLink: string;
  supportTitle: string;
  supportSubtitle: string;
  successRateValue: string;
  successRateLabel: string;
  featurePointOne: string;
  featurePointTwo: string;
  featurePointThree: string;
  backgroundImage: File | string;
  primaryImage: File | string;
  secondaryImage: File | string;
  isActive: boolean;
};

const EMPTY_HERO_FORM: HeroFormState = {
  eyebrowText: "",
  titlePrefix: "",
  titleHighlight: "",
  titleSuffix: "",
  description: "",
  primaryCtaText: "",
  primaryCtaLink: "",
  secondaryCtaText: "",
  secondaryCtaLink: "",
  supportTitle: "",
  supportSubtitle: "",
  successRateValue: "",
  successRateLabel: "",
  featurePointOne: "",
  featurePointTwo: "",
  featurePointThree: "",
  backgroundImage: "",
  primaryImage: "",
  secondaryImage: "",
  isActive: true,
};

function readString(value: unknown) {
  return typeof value === "string" ? value : "";
}

function readBoolean(value: unknown, fallback = true) {
  return typeof value === "boolean" ? value : fallback;
}

function getImageLabel(value: File | string) {
  if (value instanceof File) {
    return value.name;
  }

  if (!value) {
    return "No file selected";
  }

  return value.split("/").filter(Boolean).pop() ?? value;
}

function resolveAssetUrl(value: File | string) {
  if (value instanceof File || !value) {
    return "";
  }

  if (/^https?:\/\//.test(value)) {
    return value;
  }

  return `${API_ASSET_ORIGIN}${value.startsWith("/") ? value : `/${value}`}`;
}

function mapContentToHeroForm(item: ContentItem | null): HeroFormState {
  const content = item?.content ?? {};

  return {
    eyebrowText: readString(content.eyebrowText),
    titlePrefix: readString(content.titlePrefix),
    titleHighlight: readString(content.titleHighlight),
    titleSuffix: readString(content.titleSuffix),
    description: readString(content.description),
    primaryCtaText: readString(content.primaryCtaText),
    primaryCtaLink: readString(content.primaryCtaLink),
    secondaryCtaText: readString(content.secondaryCtaText),
    secondaryCtaLink: readString(content.secondaryCtaLink),
    supportTitle: readString(content.supportTitle),
    supportSubtitle: readString(content.supportSubtitle),
    successRateValue: readString(content.successRateValue),
    successRateLabel: readString(content.successRateLabel),
    featurePointOne: readString(content.featurePointOne),
    featurePointTwo: readString(content.featurePointTwo),
    featurePointThree: readString(content.featurePointThree),
    backgroundImage: readString(content.backgroundImage),
    primaryImage: readString(content.primaryImage),
    secondaryImage: readString(content.secondaryImage),
    isActive: readBoolean(item?.isActive, true),
  };
}

function ImageUploadField({
  id,
  label,
  hint,
  value,
  onPick,
}: {
  id: string;
  label: string;
  hint: string;
  value: File | string;
  onPick: (file: File) => void;
}) {
  const inputRef = useRef<HTMLInputElement | null>(null);

  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="w-full rounded-2xl border-2 border-dashed border-slate-200 bg-[#F8FAFC] px-4 py-5 text-left hover:border-primary hover:bg-primary/5 transition-colors"
      >
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <Upload size={18} />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-[#1E293B]">
              {getImageLabel(value)}
            </p>
            <p className="text-xs text-[#94A3B8] mt-1">{hint}</p>
          </div>
        </div>
      </button>
      <input
        ref={inputRef}
        id={id}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) {
            onPick(file);
          }
        }}
      />
    </div>
  );
}

function HeroPreview({ form }: { form: HeroFormState }) {
  const backgroundImageUrl = resolveAssetUrl(form.backgroundImage);
  const primaryImageUrl = resolveAssetUrl(form.primaryImage);
  const secondaryImageUrl = resolveAssetUrl(form.secondaryImage);
  const featurePoints = [
    form.featurePointOne,
    form.featurePointTwo,
    form.featurePointThree,
  ].filter(Boolean);

  return (
    <Card className="rounded-3xl overflow-hidden border-slate-100 shadow-sm bg-white">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm text-[#1E293B]">Hero Preview</CardTitle>
      </CardHeader>
      <CardContent>
        <div
          className="relative rounded-[28px] overflow-hidden min-h-[520px] border border-slate-100 bg-[#FEFBF7]"
          style={{
            backgroundImage: backgroundImageUrl
              ? `linear-gradient(90deg, rgba(255,250,244,0.96), rgba(255,250,244,0.82)), url(${backgroundImageUrl})`
              : "linear-gradient(135deg, #FFFBF6 0%, #F7EFE6 100%)",
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        >
          <div className="grid lg:grid-cols-[1.2fr_0.8fr] gap-6 p-6 lg:p-8">
            <div className="space-y-5">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/80 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-[#B9775B]">
                <span className="h-px w-6 bg-[#D7A48E]" />
                {form.eyebrowText || "Healing compassion for better care"}
              </div>

              <div className="space-y-1">
                <h2
                  className="text-4xl lg:text-5xl leading-none font-bold text-[#1B1B1B]"
                  style={{ fontFamily: "Georgia, serif" }}
                >
                  {form.titlePrefix || "Your Trusted Partner in"}
                </h2>
                <h3
                  className="text-4xl lg:text-5xl leading-none font-bold text-[#C58972]"
                  style={{ fontFamily: "Georgia, serif" }}
                >
                  {form.titleHighlight || "Women's Health &"}
                </h3>
                <h4
                  className="text-4xl lg:text-5xl leading-none font-bold text-[#1B1B1B]"
                  style={{ fontFamily: "Georgia, serif" }}
                >
                  {form.titleSuffix || "Aesthetic Care"}
                </h4>
              </div>

              <p className="max-w-xl text-sm leading-7 text-[#5F6368]">
                {form.description ||
                  "Samarpan Hospital, Hisar offers world-class Gynecology, Obstetrics, and Plastic & Cosmetic Surgery services with compassionate care and cutting-edge technology."}
              </p>

              <div className="flex flex-wrap gap-3">
                <div className="rounded-full bg-[#C58972] px-5 py-3 text-sm font-semibold text-white shadow-sm">
                  {form.primaryCtaText || "Book Appointment"}
                </div>
                <div className="rounded-full border border-[#C58972] bg-white/90 px-5 py-3 text-sm font-semibold text-[#B9775B]">
                  {form.secondaryCtaText || "WhatsApp Us"}
                </div>
              </div>

              <div className="flex flex-wrap gap-3 pt-2">
                {featurePoints.length > 0 ? (
                  featurePoints.map((point) => (
                    <div
                      key={point}
                      className="inline-flex items-center gap-2 rounded-full bg-white/85 px-3 py-2 text-xs font-medium text-[#4B5563]"
                    >
                      <BadgeCheck size={14} className="text-[#C58972]" />
                      {point}
                    </div>
                  ))
                ) : (
                  <>
                    <div className="inline-flex items-center gap-2 rounded-full bg-white/85 px-3 py-2 text-xs font-medium text-[#4B5563]">
                      <BadgeCheck size={14} className="text-[#C58972]" />
                      Safe & Hygienic
                    </div>
                    <div className="inline-flex items-center gap-2 rounded-full bg-white/85 px-3 py-2 text-xs font-medium text-[#4B5563]">
                      <BadgeCheck size={14} className="text-[#C58972]" />
                      20+ Years Expert
                    </div>
                    <div className="inline-flex items-center gap-2 rounded-full bg-white/85 px-3 py-2 text-xs font-medium text-[#4B5563]">
                      <BadgeCheck size={14} className="text-[#C58972]" />
                      10,000+ Happy Patients
                    </div>
                  </>
                )}
              </div>
            </div>

            <div className="relative flex items-end justify-center min-h-[360px]">
              <div className="absolute left-0 top-12 rounded-3xl bg-white px-4 py-3 shadow-sm border border-slate-100">
                <p className="text-xl font-bold text-[#1E293B]">
                  {form.supportTitle || "24/7"}
                </p>
                <p className="text-xs text-[#64748B]">
                  {form.supportSubtitle || "Emergency Care"}
                </p>
              </div>

              <div className="absolute right-0 top-2 rounded-3xl bg-white px-4 py-3 shadow-sm border border-slate-100">
                <p className="text-xl font-bold text-[#C58972]">
                  {form.successRateValue || "99%"}
                </p>
                <p className="text-xs text-[#64748B]">
                  {form.successRateLabel || "Success Rate"}
                </p>
              </div>

              <div className="relative w-full flex items-end justify-center">
                <div className="w-[78%] max-w-[320px] rounded-[32px] border border-white/70 bg-white/90 shadow-lg overflow-hidden">
                  {primaryImageUrl ? (
                    <img
                      src={primaryImageUrl}
                      alt="Primary doctor"
                      className="h-[360px] w-full object-cover"
                    />
                  ) : (
                    <div className="h-[360px] w-full flex items-center justify-center bg-[#F3E7DD] text-[#B9775B]">
                      <ImageIcon size={28} />
                    </div>
                  )}
                </div>
                <div className="absolute -right-1 bottom-8 w-[42%] max-w-[160px] rounded-[24px] border border-white/70 bg-white/95 shadow-md overflow-hidden">
                  {secondaryImageUrl ? (
                    <img
                      src={secondaryImageUrl}
                      alt="Secondary doctor"
                      className="h-[190px] w-full object-cover"
                    />
                  ) : (
                    <div className="h-[190px] w-full flex items-center justify-center bg-[#F8EFE8] text-[#B9775B]">
                      <ImageIcon size={22} />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function WebsiteContentPage() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<HeroFormState>(EMPTY_HERO_FORM);
  const [previewOpen, setPreviewOpen] = useState(false);

  const { data: contentItem, isLoading } = useQuery<ContentItem | null, Error>({
    queryKey: ["content", CONTENT_MODEL_KEY],
    queryFn: () => getContentByModelKeyApi(CONTENT_MODEL_KEY),
  });

  useEffect(() => {
    setForm(mapContentToHeroForm(contentItem ?? null));
  }, [contentItem]);

  const saveMutation = useMutation({
    mutationFn: upsertContentApi,
    onSuccess: (data) => {
      toast.success("Hero content saved successfully.");
      queryClient.setQueryData(["content", CONTENT_MODEL_KEY], data);
      setForm(mapContentToHeroForm(data));
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const featureCount = useMemo(
    () =>
      [form.featurePointOne, form.featurePointTwo, form.featurePointThree].filter(
        Boolean,
      ).length,
    [form.featurePointOne, form.featurePointTwo, form.featurePointThree],
  );

  function updateField<K extends keyof HeroFormState>(
    key: K,
    value: HeroFormState[K],
  ) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function handleSave() {
    if (!form.titlePrefix.trim()) {
      toast.error("Hero title prefix is required.");
      return;
    }

    saveMutation.mutate({
      modelKey: CONTENT_MODEL_KEY,
      title: CONTENT_TITLE,
      isActive: form.isActive,
      content: {
        eyebrowText: form.eyebrowText.trim(),
        titlePrefix: form.titlePrefix.trim(),
        titleHighlight: form.titleHighlight.trim(),
        titleSuffix: form.titleSuffix.trim(),
        description: form.description.trim(),
        primaryCtaText: form.primaryCtaText.trim(),
        primaryCtaLink: form.primaryCtaLink.trim(),
        secondaryCtaText: form.secondaryCtaText.trim(),
        secondaryCtaLink: form.secondaryCtaLink.trim(),
        supportTitle: form.supportTitle.trim(),
        supportSubtitle: form.supportSubtitle.trim(),
        successRateValue: form.successRateValue.trim(),
        successRateLabel: form.successRateLabel.trim(),
        featurePointOne: form.featurePointOne.trim(),
        featurePointTwo: form.featurePointTwo.trim(),
        featurePointThree: form.featurePointThree.trim(),
        backgroundImage:
          typeof form.backgroundImage === "string" ? form.backgroundImage : "",
        primaryImage:
          typeof form.primaryImage === "string" ? form.primaryImage : "",
        secondaryImage:
          typeof form.secondaryImage === "string" ? form.secondaryImage : "",
      },
      files: {
        backgroundImage: form.backgroundImage,
        primaryImage: form.primaryImage,
        secondaryImage: form.secondaryImage,
      },
    });
  }

  return (
    <div data-ocid="website-content.page">
      <PageHeader
        title="Website Content"
        description="Manage reusable static website sections through the generic content API."
        action={
          <>
            <Button
              type="button"
              variant="outline"
              onClick={() => setPreviewOpen(true)}
              disabled={isLoading}
              className="rounded-xl gap-2 shadow-sm w-full sm:w-auto"
            >
              <Eye size={15} />
              Preview
            </Button>
            <Button
              onClick={handleSave}
              disabled={saveMutation.isPending || isLoading}
              className="bg-primary hover:bg-secondary text-white rounded-xl gap-2 shadow-sm w-full sm:w-auto"
            >
              <Save size={15} />
              {saveMutation.isPending ? "Saving..." : "Save Hero Section"}
            </Button>
          </>
        }
      />

      <div className="space-y-6">
        <Card className="rounded-3xl border-slate-100 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-[#1E293B]">
              <LayoutTemplate size={18} />
              Home Hero Section
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline" className="rounded-full border-slate-200">
                modelKey: {CONTENT_MODEL_KEY}
              </Badge>
              <Badge variant="outline" className="rounded-full border-slate-200">
                {featureCount} feature points
              </Badge>
            </div>

            {isLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-10 w-full rounded-xl" />
                <Skeleton className="h-28 w-full rounded-2xl" />
                <Skeleton className="h-48 w-full rounded-2xl" />
              </div>
            ) : (
              <>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Eyebrow Text</Label>
                    <Input
                      value={form.eyebrowText}
                      onChange={(event) =>
                        updateField("eyebrowText", event.target.value)
                      }
                      placeholder="Healing compassion for better care"
                      className="rounded-xl"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Section Status</Label>
                    <div className="h-10 rounded-xl border border-slate-200 px-3 flex items-center justify-between">
                      <span className="text-sm text-[#475569]">
                        Show this hero on the website
                      </span>
                      <Switch
                        checked={form.isActive}
                        onCheckedChange={(checked) =>
                          updateField("isActive", checked)
                        }
                      />
                    </div>
                  </div>
                </div>

                <div className="grid gap-4">
                  <div className="space-y-2">
                    <Label>Title Prefix</Label>
                    <Input
                      value={form.titlePrefix}
                      onChange={(event) =>
                        updateField("titlePrefix", event.target.value)
                      }
                      placeholder="Your Trusted Partner in"
                      className="rounded-xl"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Highlighted Title</Label>
                    <Input
                      value={form.titleHighlight}
                      onChange={(event) =>
                        updateField("titleHighlight", event.target.value)
                      }
                      placeholder="Women's Health &"
                      className="rounded-xl"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Title Suffix</Label>
                    <Input
                      value={form.titleSuffix}
                      onChange={(event) =>
                        updateField("titleSuffix", event.target.value)
                      }
                      placeholder="Aesthetic Care"
                      className="rounded-xl"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Textarea
                      value={form.description}
                      onChange={(event) =>
                        updateField("description", event.target.value)
                      }
                      placeholder="Intro copy shown below the hero heading"
                      className="rounded-2xl min-h-[110px] resize-none"
                    />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Primary CTA Text</Label>
                    <Input
                      value={form.primaryCtaText}
                      onChange={(event) =>
                        updateField("primaryCtaText", event.target.value)
                      }
                      placeholder="Book Appointment"
                      className="rounded-xl"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Primary CTA Link</Label>
                    <Input
                      value={form.primaryCtaLink}
                      onChange={(event) =>
                        updateField("primaryCtaLink", event.target.value)
                      }
                      placeholder="/appointment"
                      className="rounded-xl"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Secondary CTA Text</Label>
                    <Input
                      value={form.secondaryCtaText}
                      onChange={(event) =>
                        updateField("secondaryCtaText", event.target.value)
                      }
                      placeholder="WhatsApp Us"
                      className="rounded-xl"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Secondary CTA Link</Label>
                    <Input
                      value={form.secondaryCtaLink}
                      onChange={(event) =>
                        updateField("secondaryCtaLink", event.target.value)
                      }
                      placeholder="https://wa.me/..."
                      className="rounded-xl"
                    />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Support Card Title</Label>
                    <Input
                      value={form.supportTitle}
                      onChange={(event) =>
                        updateField("supportTitle", event.target.value)
                      }
                      placeholder="24/7"
                      className="rounded-xl"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Support Card Subtitle</Label>
                    <Input
                      value={form.supportSubtitle}
                      onChange={(event) =>
                        updateField("supportSubtitle", event.target.value)
                      }
                      placeholder="Emergency Care"
                      className="rounded-xl"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Success Rate Value</Label>
                    <Input
                      value={form.successRateValue}
                      onChange={(event) =>
                        updateField("successRateValue", event.target.value)
                      }
                      placeholder="99%"
                      className="rounded-xl"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Success Rate Label</Label>
                    <Input
                      value={form.successRateLabel}
                      onChange={(event) =>
                        updateField("successRateLabel", event.target.value)
                      }
                      placeholder="Success Rate"
                      className="rounded-xl"
                    />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label>Feature Point 1</Label>
                    <Input
                      value={form.featurePointOne}
                      onChange={(event) =>
                        updateField("featurePointOne", event.target.value)
                      }
                      placeholder="Safe & Hygienic"
                      className="rounded-xl"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Feature Point 2</Label>
                    <Input
                      value={form.featurePointTwo}
                      onChange={(event) =>
                        updateField("featurePointTwo", event.target.value)
                      }
                      placeholder="20+ Years Expert"
                      className="rounded-xl"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Feature Point 3</Label>
                    <Input
                      value={form.featurePointThree}
                      onChange={(event) =>
                        updateField("featurePointThree", event.target.value)
                      }
                      placeholder="10,000+ Happy Patients"
                      className="rounded-xl"
                    />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  <ImageUploadField
                    id="hero-background-image"
                    label="Background Image"
                    hint="Used behind the hero copy."
                    value={form.backgroundImage}
                    onPick={(file) => updateField("backgroundImage", file)}
                  />
                  <ImageUploadField
                    id="hero-primary-image"
                    label="Primary Doctor Image"
                    hint="Main portrait shown in the hero."
                    value={form.primaryImage}
                    onPick={(file) => updateField("primaryImage", file)}
                  />
                  <ImageUploadField
                    id="hero-secondary-image"
                    label="Secondary Doctor Image"
                    hint="Smaller supporting portrait card."
                    value={form.secondaryImage}
                    onPick={(file) => updateField("secondaryImage", file)}
                  />
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="rounded-3xl border-slate-100 shadow-sm">
          <CardContent className="p-5 text-sm text-[#64748B] space-y-2">
            <p className="font-semibold text-[#1E293B]">
              Reusable content API
            </p>
            <p>
              This page saves through the generic `content` API using the
              `modelKey` <strong>{CONTENT_MODEL_KEY}</strong>.
            </p>
            <p>
              The same API can be reused later for static sections like
              `why_choose_us`, `home_cta`, or any other page block without
              creating a new backend model each time.
            </p>
          </CardContent>
        </Card>
      </div>

      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-h-[95vh] overflow-y-auto rounded-3xl border-slate-200 sm:max-w-6xl">
          <DialogHeader>
            <DialogTitle className="text-xl text-slate-900">
              Hero Preview
            </DialogTitle>
          </DialogHeader>
          <HeroPreview form={form} />
        </DialogContent>
      </Dialog>
    </div>
  );
}
