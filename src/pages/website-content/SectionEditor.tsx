import { useRef } from "react";
import { BadgeCheck, ImageIcon, Upload } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  AboutFormState,
  HeroFormState,
  HowItWorksFormState,
  WhyChooseUsFormState,
  resolveAssetUrl,
} from "./types";

type FormUpdater<Form> = <K extends keyof Form>(key: K, value: Form[K]) => void;

type ImageUploadFieldProps = {
  id: string;
  label: string;
  hint: string;
  value: File | string;
  onPick: (file: File) => void;
};

function ImageUploadField({ id, label, hint, value, onPick }: ImageUploadFieldProps) {
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
              {value instanceof File ? value.name : value ? value.split("/").filter(Boolean).pop() ?? value : "No file selected"}
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

export function HeroSectionEditor({
  form,
  updateField,
}: {
  form: HeroFormState;
  updateField: FormUpdater<HeroFormState>;
}) {
  return (
    <>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label>Eyebrow Text</Label>
          <Input
            value={form.eyebrowText}
            onChange={(event) => updateField("eyebrowText", event.target.value)}
            placeholder="Healing compassion for better care"
            className="rounded-xl"
          />
        </div>
        <div className="space-y-2">
          <Label>Section Status</Label>
          <div className="h-10 rounded-xl border border-slate-200 px-3 flex items-center justify-between">
            <span className="text-sm text-[#475569]">Show this hero on the website</span>
            <Switch
              checked={form.isActive}
              onCheckedChange={(checked) => updateField("isActive", checked)}
            />
          </div>
        </div>
      </div>

      <div className="grid gap-4">
        <div className="space-y-2">
          <Label>Title Prefix</Label>
          <Input
            value={form.titlePrefix}
            onChange={(event) => updateField("titlePrefix", event.target.value)}
            placeholder="Your Trusted Partner in"
            className="rounded-xl"
          />
        </div>
        <div className="space-y-2">
          <Label>Highlighted Title</Label>
          <Input
            value={form.titleHighlight}
            onChange={(event) => updateField("titleHighlight", event.target.value)}
            placeholder="Women's Health &"
            className="rounded-xl"
          />
        </div>
        <div className="space-y-2">
          <Label>Title Suffix</Label>
          <Input
            value={form.titleSuffix}
            onChange={(event) => updateField("titleSuffix", event.target.value)}
            placeholder="Aesthetic Care"
            className="rounded-xl"
          />
        </div>
        <div className="space-y-2">
          <Label>Description</Label>
          <Textarea
            value={form.description}
            onChange={(event) => updateField("description", event.target.value)}
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
            onChange={(event) => updateField("primaryCtaText", event.target.value)}
            placeholder="Book Appointment"
            className="rounded-xl"
          />
        </div>
        <div className="space-y-2">
          <Label>Primary CTA Link</Label>
          <Input
            value={form.primaryCtaLink}
            onChange={(event) => updateField("primaryCtaLink", event.target.value)}
            placeholder="/appointment"
            className="rounded-xl"
          />
        </div>
        <div className="space-y-2">
          <Label>Secondary CTA Text</Label>
          <Input
            value={form.secondaryCtaText}
            onChange={(event) => updateField("secondaryCtaText", event.target.value)}
            placeholder="WhatsApp Us"
            className="rounded-xl"
          />
        </div>
        <div className="space-y-2">
          <Label>Secondary CTA Link</Label>
          <Input
            value={form.secondaryCtaLink}
            onChange={(event) => updateField("secondaryCtaLink", event.target.value)}
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
            onChange={(event) => updateField("supportTitle", event.target.value)}
            placeholder="24/7"
            className="rounded-xl"
          />
        </div>
        <div className="space-y-2">
          <Label>Support Card Subtitle</Label>
          <Input
            value={form.supportSubtitle}
            onChange={(event) => updateField("supportSubtitle", event.target.value)}
            placeholder="Emergency Care"
            className="rounded-xl"
          />
        </div>
        <div className="space-y-2">
          <Label>Success Rate Value</Label>
          <Input
            value={form.successRateValue}
            onChange={(event) => updateField("successRateValue", event.target.value)}
            placeholder="99%"
            className="rounded-xl"
          />
        </div>
        <div className="space-y-2">
          <Label>Success Rate Label</Label>
          <Input
            value={form.successRateLabel}
            onChange={(event) => updateField("successRateLabel", event.target.value)}
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
            onChange={(event) => updateField("featurePointOne", event.target.value)}
            placeholder="Safe & Hygienic"
            className="rounded-xl"
          />
        </div>
        <div className="space-y-2">
          <Label>Feature Point 2</Label>
          <Input
            value={form.featurePointTwo}
            onChange={(event) => updateField("featurePointTwo", event.target.value)}
            placeholder="20+ Years Expert"
            className="rounded-xl"
          />
        </div>
        <div className="space-y-2">
          <Label>Feature Point 3</Label>
          <Input
            value={form.featurePointThree}
            onChange={(event) => updateField("featurePointThree", event.target.value)}
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
  );
}

export function HowItWorksSectionEditor({
  form,
  updateField,
}: {
  form: HowItWorksFormState;
  updateField: FormUpdater<HowItWorksFormState>;
}) {
  return (
    <>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label>Eyebrow Text</Label>
          <Input
            value={form.eyebrowText}
            onChange={(event) => updateField("eyebrowText", event.target.value)}
            placeholder="How we work"
            className="rounded-xl"
          />
        </div>
        <div className="space-y-2">
          <Label>Section Status</Label>
          <div className="h-10 rounded-xl border border-slate-200 px-3 flex items-center justify-between">
            <span className="text-sm text-[#475569]">Show this section on the website</span>
            <Switch
              checked={form.isActive}
              onCheckedChange={(checked) => updateField("isActive", checked)}
            />
          </div>
        </div>
      </div>

      <div className="grid gap-4">
        <div className="space-y-2">
          <Label>Heading</Label>
          <Input
            value={form.heading}
            onChange={(event) => updateField("heading", event.target.value)}
            placeholder="How we work: a commitment to your skin health"
            className="rounded-xl"
          />
        </div>
        <div className="space-y-2">
          <Label>Subheading</Label>
          <Textarea
            value={form.subheading}
            onChange={(event) => updateField("subheading", event.target.value)}
            placeholder="We're dedicated to helping you achieve and maintain healthy skin with treatment plans built around your comfort."
            className="rounded-2xl min-h-[110px] resize-none"
          />
        </div>
      </div>

      <div className="grid gap-4">
        <div className="space-y-2">
          <Label>Section Description</Label>
          <Textarea
            value={form.description}
            onChange={(event) => updateField("description", event.target.value)}
            placeholder="Optional additional description for the section."
            className="rounded-2xl min-h-[110px] resize-none"
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="space-y-2">
          <Label>Step One Title</Label>
          <Input
            value={form.stepOneTitle}
            onChange={(event) => updateField("stepOneTitle", event.target.value)}
            placeholder="Personalized Consultation"
            className="rounded-xl"
          />
        </div>
        <div className="space-y-2">
          <Label>Step One Description</Label>
          <Textarea
            value={form.stepOneDescription}
            onChange={(event) => updateField("stepOneDescription", event.target.value)}
            placeholder="We understand your skin concerns and goals to build a plan around your needs."
            className="rounded-2xl min-h-[110px] resize-none"
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="space-y-2">
          <Label>Step Two Title</Label>
          <Input
            value={form.stepTwoTitle}
            onChange={(event) => updateField("stepTwoTitle", event.target.value)}
            placeholder="Tailored Treatment Plans"
            className="rounded-xl"
          />
        </div>
        <div className="space-y-2">
          <Label>Step Two Description</Label>
          <Textarea
            value={form.stepTwoDescription}
            onChange={(event) => updateField("stepTwoDescription", event.target.value)}
            placeholder="Our specialists design a treatment approach that matches your condition and comfort."
            className="rounded-2xl min-h-[110px] resize-none"
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="space-y-2">
          <Label>Step Three Title</Label>
          <Input
            value={form.stepThreeTitle}
            onChange={(event) => updateField("stepThreeTitle", event.target.value)}
            placeholder="Continuous Care & Follow-Up"
            className="rounded-xl"
          />
        </div>
        <div className="space-y-2">
          <Label>Step Three Description</Label>
          <Textarea
            value={form.stepThreeDescription}
            onChange={(event) => updateField("stepThreeDescription", event.target.value)}
            placeholder="Regular follow-ups help us monitor progress and keep your results on track."
            className="rounded-2xl min-h-[110px] resize-none"
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <ImageUploadField
          id="how-work-section-image"
          label="Section Image"
          hint="Right-side image shown in the section preview."
          value={form.sectionImage}
          onPick={(file) => updateField("sectionImage", file)}
        />
      </div>
    </>
  );
}

export function WhyChooseUsSectionEditor({
  form,
  updateField,
}: {
  form: WhyChooseUsFormState;
  updateField: FormUpdater<WhyChooseUsFormState>;
}) {
  return (
    <>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label>Eyebrow Text</Label>
          <Input
            value={form.eyebrowText}
            onChange={(event) => updateField("eyebrowText", event.target.value)}
            placeholder="Why Choose Us"
            className="rounded-xl"
          />
        </div>
        <div className="space-y-2">
          <Label>Section Status</Label>
          <div className="h-10 rounded-xl border border-slate-200 px-3 flex items-center justify-between">
            <span className="text-sm text-[#475569]">Show this section on the website</span>
            <Switch
              checked={form.isActive}
              onCheckedChange={(checked) => updateField("isActive", checked)}
            />
          </div>
        </div>
      </div>

      <div className="grid gap-4">
        <div className="space-y-2">
          <Label>Heading</Label>
          <Input
            value={form.heading}
            onChange={(event) => updateField("heading", event.target.value)}
            placeholder="Why Choose Samarpan's Skin & Laser Centre"
            className="rounded-xl"
          />
        </div>
        <div className="space-y-2">
          <Label>Description</Label>
          <Textarea
            value={form.description}
            onChange={(event) => updateField("description", event.target.value)}
            placeholder="Being deeply focused on patient care and wellbeing, we ensure every treatment is designed for long-term skin health and natural results."
            className="rounded-2xl min-h-[110px] resize-none"
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label>Card One Title</Label>
          <Input
            value={form.cardOneTitle}
            onChange={(event) => updateField("cardOneTitle", event.target.value)}
            placeholder="Expertise And Professionalism"
            className="rounded-xl"
          />
        </div>
        <div className="space-y-2">
          <Label>Card One Description</Label>
          <Textarea
            value={form.cardOneDescription}
            onChange={(event) => updateField("cardOneDescription", event.target.value)}
            placeholder="Our team consists of highly trained and certified dermatology specialists."
            className="rounded-2xl min-h-[110px] resize-none"
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label>Card Two Title</Label>
          <Input
            value={form.cardTwoTitle}
            onChange={(event) => updateField("cardTwoTitle", event.target.value)}
            placeholder="Advanced Technology"
            className="rounded-xl"
          />
        </div>
        <div className="space-y-2">
          <Label>Card Two Description</Label>
          <Textarea
            value={form.cardTwoDescription}
            onChange={(event) => updateField("cardTwoDescription", event.target.value)}
            placeholder="We utilize modern laser systems to provide safe and effective treatments."
            className="rounded-2xl min-h-[110px] resize-none"
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label>Card Three Title</Label>
          <Input
            value={form.cardThreeTitle}
            onChange={(event) => updateField("cardThreeTitle", event.target.value)}
            placeholder="Personalized Care"
            className="rounded-xl"
          />
        </div>
        <div className="space-y-2">
          <Label>Card Three Description</Label>
          <Textarea
            value={form.cardThreeDescription}
            onChange={(event) => updateField("cardThreeDescription", event.target.value)}
            placeholder="Every treatment plan is personalized according to your skin goals."
            className="rounded-2xl min-h-[110px] resize-none"
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label>Card Four Title</Label>
          <Input
            value={form.cardFourTitle}
            onChange={(event) => updateField("cardFourTitle", event.target.value)}
            placeholder="Safety And Standards"
            className="rounded-xl"
          />
        </div>
        <div className="space-y-2">
          <Label>Card Four Description</Label>
          <Textarea
            value={form.cardFourDescription}
            onChange={(event) => updateField("cardFourDescription", event.target.value)}
            placeholder="We follow strict protocols and high-quality medical safety standards."
            className="rounded-2xl min-h-[110px] resize-none"
          />
        </div>
      </div>
    </>
  );
}

export function AboutSectionEditor({
  form,
  updateField,
}: {
  form: AboutFormState;
  updateField: FormUpdater<AboutFormState>;
}) {
  return (
    <>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label>Eyebrow Text</Label>
          <Input
            value={form.eyebrowText}
            onChange={(event) => updateField("eyebrowText", event.target.value)}
            placeholder="About Samarpan Hospital"
            className="rounded-xl"
          />
        </div>
        <div className="space-y-2">
          <Label>Section Status</Label>
          <div className="h-10 rounded-xl border border-slate-200 px-3 flex items-center justify-between">
            <span className="text-sm text-[#475569]">Show this section on the website</span>
            <Switch
              checked={form.isActive}
              onCheckedChange={(checked) => updateField("isActive", checked)}
            />
          </div>
        </div>
      </div>

      <div className="grid gap-4">
        <div className="space-y-2">
          <Label>Heading</Label>
          <Input
            value={form.heading}
            onChange={(event) => updateField("heading", event.target.value)}
            placeholder="Where Healing Meets Compassion"
            className="rounded-xl"
          />
        </div>
        <div className="space-y-2">
          <Label>Subheading</Label>
          <Textarea
            value={form.subheading}
            onChange={(event) => updateField("subheading", event.target.value)}
            placeholder="Samarpan Hospital is a premium healthcare center in Hisar, Haryana, specializing in Gynecology, Obstetrics, and Plastic & Cosmetic Surgery."
            className="rounded-2xl min-h-[110px] resize-none"
          />
        </div>
        <div className="space-y-2">
          <Label>Description</Label>
          <Textarea
            value={form.description}
            onChange={(event) => updateField("description", event.target.value)}
            placeholder="Our team of experienced specialists delivers safe, effective treatments in a comfortable and caring environment."
            className="rounded-2xl min-h-[110px] resize-none"
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label>Bullet One</Label>
          <Input
            value={form.bulletOne}
            onChange={(event) => updateField("bulletOne", event.target.value)}
            placeholder="State-of-the-art operation theaters & diagnostic labs"
            className="rounded-xl"
          />
        </div>
        <div className="space-y-2">
          <Label>Bullet Two</Label>
          <Input
            value={form.bulletTwo}
            onChange={(event) => updateField("bulletTwo", event.target.value)}
            placeholder="Compassionate & experienced medical staff"
            className="rounded-xl"
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label>Bullet Three</Label>
          <Input
            value={form.bulletThree}
            onChange={(event) => updateField("bulletThree", event.target.value)}
            placeholder="Advanced laparoscopic & cosmetic facilities"
            className="rounded-xl"
          />
        </div>
        <div className="space-y-2">
          <Label>Bullet Four</Label>
          <Input
            value={form.bulletFour}
            onChange={(event) => updateField("bulletFour", event.target.value)}
            placeholder="Personalized patient care programs"
            className="rounded-xl"
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label>CTA Text</Label>
          <Input
            value={form.ctaText}
            onChange={(event) => updateField("ctaText", event.target.value)}
            placeholder="Explore Our Services"
            className="rounded-xl"
          />
        </div>
        <div className="space-y-2">
          <Label>CTA Link</Label>
          <Input
            value={form.ctaLink}
            onChange={(event) => updateField("ctaLink", event.target.value)}
            placeholder="/services"
            className="rounded-xl"
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <ImageUploadField
          id="about-section-image"
          label="Section Image"
          hint="Image shown in the about section preview."
          value={form.sectionImage}
          onPick={(file) => updateField("sectionImage", file)}
        />
      </div>
    </>
  );
}

export function HeroPreview({ form }: { form: HeroFormState }) {
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
                <h2 className="text-4xl lg:text-5xl leading-none font-bold text-[#1B1B1B]" style={{ fontFamily: "Georgia, serif" }}>
                  {form.titlePrefix || "Your Trusted Partner in"}
                </h2>
                <h3 className="text-4xl lg:text-5xl leading-none font-bold text-[#C58972]" style={{ fontFamily: "Georgia, serif" }}>
                  {form.titleHighlight || "Women's Health &"}
                </h3>
                <h4 className="text-4xl lg:text-5xl leading-none font-bold text-[#1B1B1B]" style={{ fontFamily: "Georgia, serif" }}>
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
                    <div key={point} className="inline-flex items-center gap-2 rounded-full bg-white/85 px-3 py-2 text-xs font-medium text-[#4B5563]">
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
                <p className="text-xl font-bold text-[#1E293B]">{form.supportTitle || "24/7"}</p>
                <p className="text-xs text-[#64748B]">{form.supportSubtitle || "Emergency Care"}</p>
              </div>

              <div className="absolute right-0 top-2 rounded-3xl bg-white px-4 py-3 shadow-sm border border-slate-100">
                <p className="text-xl font-bold text-[#C58972]">{form.successRateValue || "99%"}</p>
                <p className="text-xs text-[#64748B]">{form.successRateLabel || "Success Rate"}</p>
              </div>

              <div className="relative w-full flex items-end justify-center">
                <div className="w-[78%] max-w-[320px] rounded-[32px] border border-white/70 bg-white/90 shadow-lg overflow-hidden">
                  {primaryImageUrl ? (
                    <img src={primaryImageUrl} alt="Primary doctor" className="h-[360px] w-full object-cover" />
                  ) : (
                    <div className="h-[360px] w-full flex items-center justify-center bg-[#F3E7DD] text-[#B9775B]">
                      <ImageIcon size={28} />
                    </div>
                  )}
                </div>
                <div className="absolute -right-1 bottom-8 w-[42%] max-w-[160px] rounded-[24px] border border-white/70 bg-white/95 shadow-md overflow-hidden">
                  {secondaryImageUrl ? (
                    <img src={secondaryImageUrl} alt="Secondary doctor" className="h-[190px] w-full object-cover" />
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

export function HowItWorksPreview({ form }: { form: HowItWorksFormState }) {
  const sectionImageUrl = resolveAssetUrl(form.sectionImage);

  return (
    <Card className="rounded-3xl overflow-hidden border-slate-100 shadow-sm bg-white">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm text-[#1E293B]">How We Work Preview</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-8 lg:grid-cols-[1.3fr_0.9fr] p-6 lg:p-8">
          <div className="space-y-6">
            <div className="uppercase tracking-[0.24em] text-xs font-semibold text-[#B9775B]">
              {form.eyebrowText || "How we work"}
            </div>
            <div className="space-y-3">
              <h2 className="text-4xl font-bold text-[#1B1B1B]">
                {form.heading || "How we work: a commitment to your skin health"}
              </h2>
              <p className="text-sm text-[#64748B] max-w-2xl">
                {form.subheading ||
                  "We're dedicated to helping you achieve and maintain healthy skin with treatment plans built around your comfort."}
              </p>
            </div>
            <div className="space-y-4">
              {[
                {
                  title: form.stepOneTitle || "Personalized Consultation",
                  description:
                    form.stepOneDescription ||
                    "We understand your skin concerns and goals to build a plan around your needs.",
                },
                {
                  title: form.stepTwoTitle || "Tailored Treatment Plans",
                  description:
                    form.stepTwoDescription ||
                    "Our specialists design a treatment approach that matches your condition and comfort.",
                },
                {
                  title: form.stepThreeTitle || "Continuous Care & Follow-Up",
                  description:
                    form.stepThreeDescription ||
                    "Regular follow-ups help us monitor progress and keep your results on track.",
                },
              ].map((step) => (
                <div key={step.title} className="rounded-3xl border border-slate-200 bg-[#FEFBF7] p-5">
                  <p className="text-lg font-semibold text-[#1B1B1B]">{step.title}</p>
                  <p className="text-sm leading-7 text-[#64748B] mt-2">{step.description}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[28px] overflow-hidden border border-slate-100 bg-[#F7EFE6]">
            {sectionImageUrl ? (
              <img src={sectionImageUrl} alt="How we work" className="h-full min-h-[360px] w-full object-cover" />
            ) : (
              <div className="flex h-full min-h-[360px] items-center justify-center text-[#B9775B]">
                <ImageIcon size={28} />
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function WhyChooseUsPreview({ form }: { form: WhyChooseUsFormState }) {
  const cards = [
    {
      title: form.cardOneTitle || "Expertise And Professionalism",
      description:
        form.cardOneDescription ||
        "Our team consists of highly trained and certified dermatology specialists.",
    },
    {
      title: form.cardTwoTitle || "Advanced Technology",
      description:
        form.cardTwoDescription ||
        "We utilize modern laser systems to provide safe and effective treatments.",
    },
    {
      title: form.cardThreeTitle || "Personalized Care",
      description:
        form.cardThreeDescription ||
        "Every treatment plan is personalized according to your skin goals.",
    },
    {
      title: form.cardFourTitle || "Safety And Standards",
      description:
        form.cardFourDescription ||
        "We follow strict protocols and high-quality medical safety standards.",
    },
  ];

  return (
    <Card className="rounded-3xl overflow-hidden border-slate-100 shadow-sm bg-white">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm text-[#1E293B]">Why Choose Us Preview</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] p-6 lg:p-8">
          <div className="space-y-6">
            <div className="uppercase tracking-[0.24em] text-xs font-semibold text-[#B9775B]">
              {form.eyebrowText || "Why Choose Us"}
            </div>
            <div className="space-y-3">
              <h2 className="text-4xl font-bold text-[#1B1B1B]">
                {form.heading || "Why Choose Samarpan's Skin & Laser Centre"}
              </h2>
              <p className="text-sm text-[#64748B] max-w-2xl">
                {form.description ||
                  "Being deeply focused on patient care and wellbeing, we ensure every treatment is designed for long-term skin health and natural results."}
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {cards.map((card) => (
                <div key={card.title} className="rounded-3xl border border-slate-200 bg-[#FEFBF7] p-5">
                  <h3 className="text-lg font-semibold text-[#1B1B1B]">{card.title}</h3>
                  <p className="text-sm leading-7 text-[#64748B] mt-2">{card.description}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-[28px] border border-slate-100 bg-[#F7EFE6] p-10 text-center text-[#B9775B]">
            <ImageIcon size={40} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function AboutPreview({ form }: { form: AboutFormState }) {
  const sectionImageUrl = resolveAssetUrl(form.sectionImage);

  return (
    <Card className="rounded-3xl overflow-hidden border-slate-100 shadow-sm bg-white">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm text-[#1E293B]">About Preview</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-8 lg:grid-cols-[0.95fr_1.05fr] p-6 lg:p-8 items-center">
          <div className="rounded-[28px] overflow-hidden border border-slate-100 bg-[#F7EFE6]">
            {sectionImageUrl ? (
              <img src={sectionImageUrl} alt="About section" className="h-full min-h-[360px] w-full object-cover" />
            ) : (
              <div className="flex h-full min-h-[360px] items-center justify-center text-[#B9775B]">
                <ImageIcon size={28} />
              </div>
            )}
          </div>

          <div className="space-y-6">
            <div className="uppercase tracking-[0.24em] text-xs font-semibold text-[#B9775B]">
              {form.eyebrowText || "About Samarpan Hospital"}
            </div>
            <div className="space-y-3">
              <h2 className="text-4xl font-bold text-[#1B1B1B]">
                {form.heading || "Where Healing Meets Compassion"}
              </h2>
              <p className="text-sm text-[#64748B] max-w-2xl">
                {form.subheading ||
                  "Samarpan Hospital is a premium healthcare center in Hisar, Haryana, specializing in Gynecology, Obstetrics, and Plastic & Cosmetic Surgery."}
              </p>
            </div>
            <p className="text-sm leading-7 text-[#64748B]">
              {form.description ||
                "Our team of experienced specialists delivers safe, effective treatments in a comfortable and caring environment."}
            </p>
            <div className="grid gap-3">
              {[
                form.bulletOne || "State-of-the-art operation theaters & diagnostic labs",
                form.bulletTwo || "Compassionate & experienced medical staff",
                form.bulletThree || "Advanced laparoscopic & cosmetic facilities",
                form.bulletFour || "Personalized patient care programs",
              ].map((bullet) => (
                <div key={bullet} className="flex items-start gap-3 text-sm text-[#475569]">
                  <span className="mt-1 h-2.5 w-2.5 rounded-full bg-[#C58972]" />
                  <span>{bullet}</span>
                </div>
              ))}
            </div>
            <div>
              <div className="inline-flex items-center justify-center rounded-full bg-[#C58972] px-5 py-3 text-sm font-semibold text-white shadow-sm">
                {form.ctaText || "Explore Our Services"}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
