import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  getContentByModelKeyApi,
  upsertContentApi,
  type ContentItem,
} from "@/apiCalls/content";
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
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Eye, LayoutTemplate, Save } from "lucide-react";
import {
  AboutFormState,
  EMPTY_ABOUT_FORM,
  EMPTY_HERO_FORM,
  EMPTY_HOW_IT_WORK_FORM,
  EMPTY_WHY_CHOOSE_US_FORM,
  HeroFormState,
  HowItWorksFormState,
  SECTION_META,
  SectionKey,
  WhyChooseUsFormState,
  mapContentToAboutForm,
  mapContentToHeroForm,
  mapContentToHowItWorksForm,
  mapContentToWhyChooseUsForm,
} from "./website-content/types";
import {
  AboutPreview,
  AboutSectionEditor,
  HeroPreview,
  HeroSectionEditor,
  HowItWorksPreview,
  HowItWorksSectionEditor,
  WhyChooseUsPreview,
  WhyChooseUsSectionEditor,
} from "./website-content/SectionEditor";

export default function WebsiteContentPageImpl() {
  const queryClient = useQueryClient();
  const [selectedSection, setSelectedSection] =
    useState<SectionKey>("home_hero");
  const [heroForm, setHeroForm] = useState<HeroFormState>(EMPTY_HERO_FORM);
  const [howItWorksForm, setHowItWorksForm] = useState<HowItWorksFormState>(
    EMPTY_HOW_IT_WORK_FORM,
  );
  const [whyChooseUsForm, setWhyChooseUsForm] = useState<WhyChooseUsFormState>(
    EMPTY_WHY_CHOOSE_US_FORM,
  );
  const [aboutForm, setAboutForm] = useState<AboutFormState>(EMPTY_ABOUT_FORM);
  const [previewOpen, setPreviewOpen] = useState(false);

  const { data: contentItem, isLoading } = useQuery<ContentItem | null, Error>({
    queryKey: ["content", selectedSection],
    queryFn: () => getContentByModelKeyApi(selectedSection),
  });

  useEffect(() => {
    if (selectedSection === "home_hero") {
      setHeroForm(mapContentToHeroForm(contentItem ?? null));
    } else if (selectedSection === "home_how_we_work") {
      setHowItWorksForm(mapContentToHowItWorksForm(contentItem ?? null));
    } else if (selectedSection === "why_choose_us") {
      setWhyChooseUsForm(mapContentToWhyChooseUsForm(contentItem ?? null));
    } else {
      setAboutForm(mapContentToAboutForm(contentItem ?? null));
    }
  }, [contentItem, selectedSection]);

  const saveMutation = useMutation({
    mutationFn: upsertContentApi,
    onSuccess: (data) => {
      toast.success(
        `${SECTION_META[selectedSection].title} saved successfully.`,
      );
      queryClient.setQueryData(["content", selectedSection], data);

      if (selectedSection === "home_hero") {
        setHeroForm(mapContentToHeroForm(data));
      } else if (selectedSection === "home_how_we_work") {
        setHowItWorksForm(mapContentToHowItWorksForm(data));
      } else if (selectedSection === "why_choose_us") {
        setWhyChooseUsForm(mapContentToWhyChooseUsForm(data));
      } else {
        setAboutForm(mapContentToAboutForm(data));
      }
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const featureCount = useMemo(
    () =>
      [
        heroForm.featurePointOne,
        heroForm.featurePointTwo,
        heroForm.featurePointThree,
      ].filter(Boolean).length,
    [
      heroForm.featurePointOne,
      heroForm.featurePointTwo,
      heroForm.featurePointThree,
    ],
  );

  function updateHeroField<K extends keyof HeroFormState>(
    key: K,
    value: HeroFormState[K],
  ) {
    setHeroForm((prev) => ({ ...prev, [key]: value }));
  }

  function updateHowItWorksField<K extends keyof HowItWorksFormState>(
    key: K,
    value: HowItWorksFormState[K],
  ) {
    setHowItWorksForm((prev) => ({ ...prev, [key]: value }));
  }

  function updateWhyChooseUsField<K extends keyof WhyChooseUsFormState>(
    key: K,
    value: WhyChooseUsFormState[K],
  ) {
    setWhyChooseUsForm((prev) => ({ ...prev, [key]: value }));
  }

  function updateAboutField<K extends keyof AboutFormState>(
    key: K,
    value: AboutFormState[K],
  ) {
    setAboutForm((prev) => ({ ...prev, [key]: value }));
  }

  function handleSave() {
    if (selectedSection === "home_hero") {
      if (!heroForm.titlePrefix.trim()) {
        toast.error("Hero title prefix is required.");
        return;
      }

      saveMutation.mutate({
        modelKey: selectedSection,
        title: SECTION_META[selectedSection].title,
        isActive: heroForm.isActive,
        content: {
          eyebrowText: heroForm.eyebrowText.trim(),
          titlePrefix: heroForm.titlePrefix.trim(),
          titleHighlight: heroForm.titleHighlight.trim(),
          titleSuffix: heroForm.titleSuffix.trim(),
          description: heroForm.description.trim(),
          primaryCtaText: heroForm.primaryCtaText.trim(),
          primaryCtaLink: heroForm.primaryCtaLink.trim(),
          secondaryCtaText: heroForm.secondaryCtaText.trim(),
          secondaryCtaLink: heroForm.secondaryCtaLink.trim(),
          supportTitle: heroForm.supportTitle.trim(),
          supportSubtitle: heroForm.supportSubtitle.trim(),
          successRateValue: heroForm.successRateValue.trim(),
          successRateLabel: heroForm.successRateLabel.trim(),
          featurePointOne: heroForm.featurePointOne.trim(),
          featurePointTwo: heroForm.featurePointTwo.trim(),
          featurePointThree: heroForm.featurePointThree.trim(),
          backgroundImage:
            typeof heroForm.backgroundImage === "string"
              ? heroForm.backgroundImage
              : "",
          primaryImage:
            typeof heroForm.primaryImage === "string"
              ? heroForm.primaryImage
              : "",
          secondaryImage:
            typeof heroForm.secondaryImage === "string"
              ? heroForm.secondaryImage
              : "",
        },
        files: {
          backgroundImage: heroForm.backgroundImage,
          primaryImage: heroForm.primaryImage,
          secondaryImage: heroForm.secondaryImage,
        },
      });
      return;
    }

    if (selectedSection === "home_how_we_work") {
      if (!howItWorksForm.heading.trim()) {
        toast.error("Section heading is required.");
        return;
      }

      saveMutation.mutate({
        modelKey: selectedSection,
        title: SECTION_META[selectedSection].title,
        isActive: howItWorksForm.isActive,
        content: {
          eyebrowText: howItWorksForm.eyebrowText.trim(),
          heading: howItWorksForm.heading.trim(),
          subheading: howItWorksForm.subheading.trim(),
          description: howItWorksForm.description.trim(),
          stepOneTitle: howItWorksForm.stepOneTitle.trim(),
          stepOneDescription: howItWorksForm.stepOneDescription.trim(),
          stepTwoTitle: howItWorksForm.stepTwoTitle.trim(),
          stepTwoDescription: howItWorksForm.stepTwoDescription.trim(),
          stepThreeTitle: howItWorksForm.stepThreeTitle.trim(),
          stepThreeDescription: howItWorksForm.stepThreeDescription.trim(),
          sectionImage:
            typeof howItWorksForm.sectionImage === "string"
              ? howItWorksForm.sectionImage
              : "",
        },
        files: {
          sectionImage: howItWorksForm.sectionImage,
        },
      });
      return;
    }

    if (selectedSection === "why_choose_us") {
      if (!whyChooseUsForm.heading.trim()) {
        toast.error("Section heading is required.");
        return;
      }

      saveMutation.mutate({
        modelKey: selectedSection,
        title: SECTION_META[selectedSection].title,
        isActive: whyChooseUsForm.isActive,
        content: {
          eyebrowText: whyChooseUsForm.eyebrowText.trim(),
          heading: whyChooseUsForm.heading.trim(),
          description: whyChooseUsForm.description.trim(),
          sectionImage:
            typeof whyChooseUsForm.sectionImage === "string"
              ? whyChooseUsForm.sectionImage
              : "",
          secondaryImage:
            typeof whyChooseUsForm.secondaryImage === "string"
              ? whyChooseUsForm.secondaryImage
              : "",
          cardOneTitle: whyChooseUsForm.cardOneTitle.trim(),
          cardOneDescription: whyChooseUsForm.cardOneDescription.trim(),
          cardTwoTitle: whyChooseUsForm.cardTwoTitle.trim(),
          cardTwoDescription: whyChooseUsForm.cardTwoDescription.trim(),
          cardThreeTitle: whyChooseUsForm.cardThreeTitle.trim(),
          cardThreeDescription: whyChooseUsForm.cardThreeDescription.trim(),
          cardFourTitle: whyChooseUsForm.cardFourTitle.trim(),
          cardFourDescription: whyChooseUsForm.cardFourDescription.trim(),
        },
        files: {
          sectionImage: whyChooseUsForm.sectionImage,
          secondaryImage: whyChooseUsForm.secondaryImage,
        },
      });
      return;
    }

    if (!aboutForm.heading.trim()) {
      toast.error("Section heading is required.");
      return;
    }

    saveMutation.mutate({
      modelKey: selectedSection,
      title: SECTION_META[selectedSection].title,
      isActive: aboutForm.isActive,
      content: {
        eyebrowText: aboutForm.eyebrowText.trim(),
        heading: aboutForm.heading.trim(),
        subheading: aboutForm.subheading.trim(),
        description: aboutForm.description.trim(),
        bulletOne: aboutForm.bulletOne.trim(),
        bulletTwo: aboutForm.bulletTwo.trim(),
        bulletThree: aboutForm.bulletThree.trim(),
        bulletFour: aboutForm.bulletFour.trim(),
        ctaText: aboutForm.ctaText.trim(),
        ctaLink: aboutForm.ctaLink.trim(),
        sectionImage:
          typeof aboutForm.sectionImage === "string"
            ? aboutForm.sectionImage
            : "",
      },
      files: {
        sectionImage: aboutForm.sectionImage,
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
              className="bg-primary hover:bg-secondary text-white rounded-xl gap-2 shadow-sm w-full sm:w-auto bg-[#D89F00]"
            >
              <Save size={15} />
              {saveMutation.isPending
                ? "Saving..."
                : `Save ${SECTION_META[selectedSection].title}`}
            </Button>
          </>
        }
      />

      <Tabs
        defaultValue={selectedSection}
        value={selectedSection}
        onValueChange={(value) => setSelectedSection(value as SectionKey)}
        className="mb-6"
      >
        <TabsList className="inline-flex w-full rounded-3xl bg-slate-100 p-2 gap-2 h-15">
          <TabsTrigger value="home_hero" className="flex-1 rounded-2xl">
            Home Hero
          </TabsTrigger>
          <TabsTrigger value="home_how_we_work" className="flex-1 rounded-2xl">
            How We Work
          </TabsTrigger>
          <TabsTrigger value="why_choose_us" className="flex-1 rounded-2xl">
            Why Choose Us
          </TabsTrigger>
          <TabsTrigger value="about" className="flex-1 rounded-2xl">
            About
          </TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="space-y-6">
        <Card className="rounded-3xl border-slate-100 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-[#1E293B]">
              <LayoutTemplate size={18} />
              {SECTION_META[selectedSection].title}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="flex flex-wrap gap-2">
              <Badge
                variant="outline"
                className="rounded-full border-slate-200"
              >
                modelKey: {selectedSection}
              </Badge>
              {selectedSection === "home_hero" ? (
                <Badge
                  variant="outline"
                  className="rounded-full border-slate-200"
                >
                  {featureCount} feature points
                </Badge>
              ) : null}
            </div>

            {isLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-10 w-full rounded-xl" />
                <Skeleton className="h-28 w-full rounded-2xl" />
                <Skeleton className="h-48 w-full rounded-2xl" />
              </div>
            ) : selectedSection === "home_hero" ? (
              <HeroSectionEditor
                form={heroForm}
                updateField={updateHeroField}
              />
            ) : selectedSection === "home_how_we_work" ? (
              <HowItWorksSectionEditor
                form={howItWorksForm}
                updateField={updateHowItWorksField}
              />
            ) : selectedSection === "why_choose_us" ? (
              <WhyChooseUsSectionEditor
                form={whyChooseUsForm}
                updateField={updateWhyChooseUsField}
              />
            ) : (
              <AboutSectionEditor
                form={aboutForm}
                updateField={updateAboutField}
              />
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-h-[95vh] overflow-y-auto rounded-3xl border-slate-200 sm:max-w-6xl">
          <DialogHeader>
            <DialogTitle className="text-xl text-slate-900">
              {SECTION_META[selectedSection].title} Preview
            </DialogTitle>
          </DialogHeader>
          {selectedSection === "home_hero" ? (
            <HeroPreview form={heroForm} />
          ) : selectedSection === "home_how_we_work" ? (
            <HowItWorksPreview form={howItWorksForm} />
          ) : selectedSection === "why_choose_us" ? (
            <WhyChooseUsPreview form={whyChooseUsForm} />
          ) : (
            <AboutPreview form={aboutForm} />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
