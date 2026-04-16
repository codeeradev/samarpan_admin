import { PageHeader } from "@/components/admin/PageHeader";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { mockAbout, mockBanners, mockServices } from "@/services/mockData";
import type { ContentAbout, ContentBanner, Service } from "@/types";
import { GripVertical, ImageIcon, LayoutTemplate, Upload } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

// ─── Image Upload Area ────────────────────────────────────────────────────────

function ImageUploadArea({ label, hint }: { label: string; hint?: string }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <div className="border-2 border-dashed border-[#CBD5E1] rounded-xl p-5 min-h-[120px] flex flex-col items-center justify-center gap-2 bg-[#F8FAFC] hover:bg-primary/5 hover:border-primary transition-colors cursor-pointer group active:bg-primary/5">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
          <Upload size={18} className="text-primary" />
        </div>
        <p className="text-sm font-medium text-[#1E293B]">
          Tap to upload image
        </p>
        <p className="text-xs text-[#94A3B8] text-center">
          {hint ?? "PNG, JPG up to 5MB"}
        </p>
      </div>
    </div>
  );
}

// ─── Banner Preview ────────────────────────────────────────────────────────────

function BannerPreview({ banner }: { banner: ContentBanner }) {
  return (
    <div className="rounded-xl overflow-hidden border border-[#E2E8F0]">
      <p className="text-xs font-semibold text-[#64748B] uppercase tracking-wider px-4 py-2 bg-[#F8FAFC] border-b border-[#E2E8F0]">
        Live Preview
      </p>
      <div className="relative bg-gradient-to-br from-primary to-secondary p-6 min-h-[130px] flex flex-col justify-center">
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage:
              "radial-gradient(circle at 70% 50%, white 1px, transparent 1px)",
            backgroundSize: "20px 20px",
          }}
        />
        <p className="text-white text-lg font-bold leading-snug max-w-full">
          {banner.title || "Banner Title"}
        </p>
        <p className="text-white/80 text-sm mt-1 max-w-full">
          {banner.subtitle || "Banner subtitle goes here"}
        </p>
        {banner.ctaText && (
          <span className="mt-3 inline-flex items-center px-4 py-1.5 rounded-lg bg-white text-primary text-xs font-semibold w-fit">
            {banner.ctaText}
          </span>
        )}
      </div>
    </div>
  );
}

// ─── Section Save Row ─────────────────────────────────────────────────────────

function SaveRow({ onSave, ocid }: { onSave: () => void; ocid: string }) {
  return (
    <div className="flex flex-wrap sm:flex-nowrap items-center justify-end gap-2 pt-1">
      <Button
        type="button"
        variant="outline"
        className="rounded-xl border-slate-200 text-[#64748B] w-full sm:w-auto"
        onClick={() => toast.info("Changes discarded.")}
      >
        Discard
      </Button>
      <Button
        type="button"
        className="rounded-xl bg-primary hover:bg-secondary text-white font-medium px-6 w-full sm:w-auto"
        onClick={onSave}
        data-ocid={ocid}
      >
        Save Changes
      </Button>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ContentPage() {
  const [loading, setLoading] = useState(true);
  const [bannerData, setBannerData] = useState<ContentBanner>(mockBanners[0]);
  const [aboutData, setAboutData] = useState<ContentAbout>(mockAbout);
  const [homeServices, setHomeServices] = useState<Service[]>([]);

  useEffect(() => {
    const t = setTimeout(() => {
      setBannerData({ ...mockBanners[0] });
      setAboutData({ ...mockAbout });
      setHomeServices(mockServices.map((s) => ({ ...s })));
      setLoading(false);
    }, 700);
    return () => clearTimeout(t);
  }, []);

  function saveBanner() {
    toast.success("Banner saved successfully!");
  }

  function saveAbout() {
    toast.success("About section saved successfully!");
  }

  function saveServicesOrder() {
    toast.success("Homepage services order saved!");
  }

  function toggleServiceVisibility(id: string) {
    setHomeServices((prev) =>
      prev.map((s) => (s.id === id ? { ...s, isActive: !s.isActive } : s)),
    );
  }

  return (
    <div data-ocid="content.page">
      <PageHeader
        title="Website Content"
        description="Manage homepage banners, about section, and services visibility."
      />

      {loading ? (
        <div className="space-y-4" data-ocid="content.loading_state">
          <Skeleton className="h-10 w-full sm:w-72 rounded-xl" />
          <Skeleton className="h-64 w-full rounded-2xl" />
          <Skeleton className="h-48 w-full rounded-2xl" />
        </div>
      ) : (
        <Tabs defaultValue="banner" data-ocid="content.tabs">
          {/* Tab bar — horizontally scrollable on small screens */}
          <div className="overflow-x-auto -mx-1 px-1 mb-6">
            <TabsList className="bg-[#F1F5F9] rounded-xl p-1 flex-nowrap inline-flex min-w-max">
              <TabsTrigger
                value="banner"
                className="rounded-lg text-sm font-medium data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm whitespace-nowrap"
                data-ocid="content.banner_tab"
              >
                <LayoutTemplate size={14} className="mr-1.5" />
                Banner
              </TabsTrigger>
              <TabsTrigger
                value="about"
                className="rounded-lg text-sm font-medium data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm whitespace-nowrap"
                data-ocid="content.about_tab"
              >
                <ImageIcon size={14} className="mr-1.5" />
                About
              </TabsTrigger>
              <TabsTrigger
                value="services"
                className="rounded-lg text-sm font-medium data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm whitespace-nowrap"
                data-ocid="content.services_tab"
              >
                Services Section
              </TabsTrigger>
            </TabsList>
          </div>

          {/* ── TAB 1: BANNER ──────────────────────────────────── */}
          <TabsContent value="banner">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Form */}
              <div className="lg:col-span-2">
                <Card className="shadow-sm border border-[#E2E8F0] rounded-2xl">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-base font-semibold text-[#1E293B]">
                      Homepage Banner
                    </CardTitle>
                    <CardDescription className="text-sm text-[#64748B]">
                      Configure the primary banner shown on the hospital website
                      homepage.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label htmlFor="banner-title">Banner Title</Label>
                        <Input
                          id="banner-title"
                          value={bannerData.title}
                          onChange={(e) =>
                            setBannerData({
                              ...bannerData,
                              title: e.target.value,
                            })
                          }
                          placeholder="Your Health, Our Priority"
                          className="rounded-xl"
                          data-ocid="content.banner_title_input"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="banner-subtitle">Banner Subtitle</Label>
                        <Input
                          id="banner-subtitle"
                          value={bannerData.subtitle}
                          onChange={(e) =>
                            setBannerData({
                              ...bannerData,
                              subtitle: e.target.value,
                            })
                          }
                          placeholder="World-class care with compassion"
                          className="rounded-xl"
                          data-ocid="content.banner_subtitle_input"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="banner-description">
                        Banner Description
                      </Label>
                      <Textarea
                        id="banner-description"
                        rows={3}
                        placeholder="Brief description shown under the headline…"
                        className="rounded-xl resize-none min-h-[100px]"
                        data-ocid="content.banner_description_textarea"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label htmlFor="banner-cta-text">CTA Button Text</Label>
                        <Input
                          id="banner-cta-text"
                          value={bannerData.ctaText}
                          onChange={(e) =>
                            setBannerData({
                              ...bannerData,
                              ctaText: e.target.value,
                            })
                          }
                          placeholder="Book Appointment"
                          className="rounded-xl"
                          data-ocid="content.banner_cta_text_input"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="banner-cta-link">CTA Button Link</Label>
                        <Input
                          id="banner-cta-link"
                          value={bannerData.ctaLink}
                          onChange={(e) =>
                            setBannerData({
                              ...bannerData,
                              ctaLink: e.target.value,
                            })
                          }
                          placeholder="/appointment"
                          className="rounded-xl"
                          data-ocid="content.banner_cta_link_input"
                        />
                      </div>
                    </div>

                    <ImageUploadArea
                      label="Background Image"
                      hint="Recommended: 1440×600px, JPG or PNG"
                    />

                    <SaveRow
                      onSave={saveBanner}
                      ocid="content.save_banner_button"
                    />
                  </CardContent>
                </Card>
              </div>

              {/* Preview + status */}
              <div className="lg:col-span-1 space-y-4">
                <BannerPreview banner={bannerData} />
                <Card className="shadow-sm border border-[#E2E8F0] rounded-2xl">
                  <CardContent className="p-4">
                    <p className="text-xs font-semibold text-[#64748B] uppercase tracking-wider mb-3">
                      Banner Status
                    </p>
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-[#1E293B]">
                          Active on Homepage
                        </p>
                        <p className="text-xs text-[#94A3B8] mt-0.5">
                          Toggle to show/hide this banner
                        </p>
                      </div>
                      <Switch
                        checked={bannerData.isActive}
                        onCheckedChange={(checked) =>
                          setBannerData({ ...bannerData, isActive: checked })
                        }
                        data-ocid="content.banner_active_switch"
                      />
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* ── TAB 2: ABOUT ───────────────────────────────────── */}
          <TabsContent value="about">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <Card className="shadow-sm border border-[#E2E8F0] rounded-2xl">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-base font-semibold text-[#1E293B]">
                      About Section
                    </CardTitle>
                    <CardDescription className="text-sm text-[#64748B]">
                      Update the hospital's story, mission, and vision shown on
                      the website.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-5">
                    <div className="space-y-1.5">
                      <Label htmlFor="about-title">About Title</Label>
                      <Input
                        id="about-title"
                        value={aboutData.heading}
                        onChange={(e) =>
                          setAboutData({
                            ...aboutData,
                            heading: e.target.value,
                          })
                        }
                        placeholder="About Samarpan Hospital"
                        className="rounded-xl"
                        data-ocid="content.about_title_input"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="about-description">
                        About Description
                      </Label>
                      <Textarea
                        id="about-description"
                        value={aboutData.description}
                        onChange={(e) =>
                          setAboutData({
                            ...aboutData,
                            description: e.target.value,
                          })
                        }
                        rows={4}
                        className="rounded-xl resize-none min-h-[100px]"
                        data-ocid="content.about_description_textarea"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label htmlFor="about-mission">Mission Statement</Label>
                        <Textarea
                          id="about-mission"
                          value={aboutData.mission}
                          onChange={(e) =>
                            setAboutData({
                              ...aboutData,
                              mission: e.target.value,
                            })
                          }
                          rows={3}
                          className="rounded-xl resize-none min-h-[100px]"
                          data-ocid="content.about_mission_textarea"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="about-vision">Vision Statement</Label>
                        <Textarea
                          id="about-vision"
                          value={aboutData.vision}
                          onChange={(e) =>
                            setAboutData({
                              ...aboutData,
                              vision: e.target.value,
                            })
                          }
                          rows={3}
                          className="rounded-xl resize-none min-h-[100px]"
                          data-ocid="content.about_vision_textarea"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="about-year">
                        Hospital Established Year
                      </Label>
                      <Input
                        id="about-year"
                        type="number"
                        defaultValue={2000}
                        placeholder="e.g. 1998"
                        className="rounded-xl w-full max-w-xs"
                        data-ocid="content.about_year_input"
                      />
                    </div>

                    <ImageUploadArea
                      label="About Section Image"
                      hint="Recommended: 800×600px, JPG or PNG"
                    />

                    <SaveRow
                      onSave={saveAbout}
                      ocid="content.save_about_button"
                    />
                  </CardContent>
                </Card>
              </div>

              {/* Stats sidebar */}
              <div className="lg:col-span-1">
                <Card className="shadow-sm border border-[#E2E8F0] rounded-2xl h-fit">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-semibold text-[#1E293B]">
                      Hospital Stats
                    </CardTitle>
                    <CardDescription className="text-xs text-[#94A3B8]">
                      Displayed as achievement highlights
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="grid grid-cols-2 gap-3">
                    {aboutData.stats.map((stat) => (
                      <div
                        key={stat.label}
                        className="rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 p-3 text-center"
                      >
                        <p className="text-xl font-bold text-primary">
                          {stat.value}
                        </p>
                        <p className="text-xs text-[#64748B] mt-0.5 leading-tight">
                          {stat.label}
                        </p>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* ── TAB 3: SERVICES SECTION ────────────────────────── */}
          <TabsContent value="services">
            <Card className="shadow-sm border border-[#E2E8F0] rounded-2xl">
              <CardHeader className="pb-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <CardTitle className="text-base font-semibold text-[#1E293B]">
                      Homepage Services
                    </CardTitle>
                    <CardDescription className="text-sm text-[#64748B] mt-1">
                      Manage which services appear on your homepage. Use the
                      toggle to show or hide each service.
                    </CardDescription>
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="text-xs text-primary font-medium flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary inline-block" />
                      Auto-saved
                    </span>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="rounded-xl border-[#CBD5E1] text-[#1E293B] hover:bg-primary/5 hover:border-primary text-xs font-medium"
                      onClick={saveServicesOrder}
                      data-ocid="content.save_services_button"
                    >
                      Save Order
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div
                  className="divide-y divide-[#F1F5F9]"
                  data-ocid="content.services_list"
                >
                  {homeServices.map((service, index) => (
                    <div
                      key={service.id}
                      className="flex items-center gap-3 px-4 sm:px-6 py-4 hover:bg-[#F8FAFC] transition-colors"
                      data-ocid={`content.services_list.item.${index + 1}`}
                    >
                      {/* Drag handle */}
                      <button
                        type="button"
                        aria-label="Reorder service"
                        className="text-[#CBD5E1] hover:text-[#94A3B8] cursor-grab active:cursor-grabbing flex-shrink-0 transition-colors p-1 -ml-1 touch-manipulation"
                        data-ocid={`content.services_drag_handle.${index + 1}`}
                      >
                        <GripVertical size={18} />
                      </button>

                      {/* Icon */}
                      <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary/15 to-primary/5 flex items-center justify-center flex-shrink-0">
                        <ImageIcon size={15} className="text-primary" />
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-[#1E293B] truncate">
                          {service.name}
                        </p>
                        <p className="text-xs text-[#64748B] truncate mt-0.5 hidden sm:block">
                          {service.description}
                        </p>
                        <p className="text-xs text-[#64748B] truncate mt-0.5 sm:hidden">
                          {service.category}
                        </p>
                      </div>

                      {/* Category badge — desktop only */}
                      <span className="hidden md:inline-flex items-center px-2.5 py-0.5 rounded-lg bg-[#F1F5F9] text-[#64748B] text-xs font-medium flex-shrink-0">
                        {service.category}
                      </span>

                      {/* Toggle */}
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span
                          className={`text-xs font-medium hidden sm:block ${service.isActive ? "text-primary" : "text-[#94A3B8]"}`}
                        >
                          {service.isActive ? "Visible" : "Hidden"}
                        </span>
                        <Switch
                          checked={service.isActive}
                          onCheckedChange={() =>
                            toggleServiceVisibility(service.id)
                          }
                          data-ocid={`content.services_visibility_switch.${index + 1}`}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                {homeServices.length === 0 && (
                  <div
                    className="py-16 flex flex-col items-center justify-center gap-3 text-center"
                    data-ocid="content.services_empty_state"
                  >
                    <div className="w-12 h-12 rounded-2xl bg-[#F1F5F9] flex items-center justify-center">
                      <ImageIcon size={22} className="text-[#94A3B8]" />
                    </div>
                    <p className="text-sm font-medium text-[#1E293B]">
                      No services found
                    </p>
                    <p className="text-xs text-[#94A3B8]">
                      Add services from the Services page first.
                    </p>
                  </div>
                )}

                {homeServices.length > 0 && (
                  <div className="px-4 sm:px-6 py-3 border-t border-[#F1F5F9] flex items-center justify-between flex-wrap gap-2">
                    <p className="text-xs text-[#94A3B8]">
                      {homeServices.filter((s) => s.isActive).length} of{" "}
                      {homeServices.length} services visible on homepage
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
