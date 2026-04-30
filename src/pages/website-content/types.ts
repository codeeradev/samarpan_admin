import { type ContentItem } from "@/apiCalls/content";
import { BASE_URL } from "@/apis/endpoint";

export const API_ASSET_ORIGIN = BASE_URL.replace(/\/admin\/?$/, "");

export type SectionKey =
  | "home_hero"
  | "home_how_we_work"
  | "why_choose_us"
  | "about";

export const SECTION_META: Record<SectionKey, { title: string; description: string }> = {
  home_hero: {
    title: "Home Hero Section",
    description: "Manage the homepage hero content and images.",
  },
  home_how_we_work: {
    title: "How We Work Section",
    description: "Manage the homepage How We Work area.",
  },
  why_choose_us: {
    title: "Why Choose Us Section",
    description: "Manage the homepage Why Choose Us content.",
  },
  about: {
    title: "About Section",
    description: "Manage the homepage About section content.",
  },
};

export type HeroFormState = {
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

export type HowItWorksFormState = {
  eyebrowText: string;
  heading: string;
  subheading: string;
  description: string;
  stepOneTitle: string;
  stepOneDescription: string;
  stepTwoTitle: string;
  stepTwoDescription: string;
  stepThreeTitle: string;
  stepThreeDescription: string;
  sectionImage: File | string;
  isActive: boolean;
};

export type WhyChooseUsFormState = {
  eyebrowText: string;
  heading: string;
  description: string;
  cardOneTitle: string;
  cardOneDescription: string;
  cardTwoTitle: string;
  cardTwoDescription: string;
  cardThreeTitle: string;
  cardThreeDescription: string;
  cardFourTitle: string;
  cardFourDescription: string;
  isActive: boolean;
};

export type AboutFormState = {
  eyebrowText: string;
  heading: string;
  subheading: string;
  description: string;
  bulletOne: string;
  bulletTwo: string;
  bulletThree: string;
  bulletFour: string;
  ctaText: string;
  ctaLink: string;
  sectionImage: File | string;
  isActive: boolean;
};

export const EMPTY_HERO_FORM: HeroFormState = {
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

export const EMPTY_HOW_IT_WORK_FORM: HowItWorksFormState = {
  eyebrowText: "",
  heading: "",
  subheading: "",
  description: "",
  stepOneTitle: "",
  stepOneDescription: "",
  stepTwoTitle: "",
  stepTwoDescription: "",
  stepThreeTitle: "",
  stepThreeDescription: "",
  sectionImage: "",
  isActive: true,
};

export const EMPTY_WHY_CHOOSE_US_FORM: WhyChooseUsFormState = {
  eyebrowText: "",
  heading: "",
  description: "",
  cardOneTitle: "",
  cardOneDescription: "",
  cardTwoTitle: "",
  cardTwoDescription: "",
  cardThreeTitle: "",
  cardThreeDescription: "",
  cardFourTitle: "",
  cardFourDescription: "",
  isActive: true,
};

export const EMPTY_ABOUT_FORM: AboutFormState = {
  eyebrowText: "",
  heading: "",
  subheading: "",
  description: "",
  bulletOne: "",
  bulletTwo: "",
  bulletThree: "",
  bulletFour: "",
  ctaText: "",
  ctaLink: "",
  sectionImage: "",
  isActive: true,
};

export function readString(value: unknown) {
  return typeof value === "string" ? value : "";
}

export function readBoolean(value: unknown, fallback = true) {
  return typeof value === "boolean" ? value : fallback;
}

export function resolveAssetUrl(value: File | string) {
  if (value instanceof File || !value) {
    return "";
  }

  if (/^https?:\/\//.test(value)) {
    return value;
  }

  return `${API_ASSET_ORIGIN}${value.startsWith("/") ? value : `/${value}`}`;
}

export function mapContentToHeroForm(item: ContentItem | null): HeroFormState {
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

export function mapContentToHowItWorksForm(item: ContentItem | null): HowItWorksFormState {
  const content = item?.content ?? {};

  return {
    eyebrowText: readString(content.eyebrowText),
    heading: readString(content.heading),
    subheading: readString(content.subheading),
    description: readString(content.description),
    stepOneTitle: readString(content.stepOneTitle),
    stepOneDescription: readString(content.stepOneDescription),
    stepTwoTitle: readString(content.stepTwoTitle),
    stepTwoDescription: readString(content.stepTwoDescription),
    stepThreeTitle: readString(content.stepThreeTitle),
    stepThreeDescription: readString(content.stepThreeDescription),
    sectionImage: readString(content.sectionImage),
    isActive: readBoolean(item?.isActive, true),
  };
}

export function mapContentToWhyChooseUsForm(item: ContentItem | null): WhyChooseUsFormState {
  const content = item?.content ?? {};

  return {
    eyebrowText: readString(content.eyebrowText),
    heading: readString(content.heading),
    description: readString(content.description),
    cardOneTitle: readString(content.cardOneTitle),
    cardOneDescription: readString(content.cardOneDescription),
    cardTwoTitle: readString(content.cardTwoTitle),
    cardTwoDescription: readString(content.cardTwoDescription),
    cardThreeTitle: readString(content.cardThreeTitle),
    cardThreeDescription: readString(content.cardThreeDescription),
    cardFourTitle: readString(content.cardFourTitle),
    cardFourDescription: readString(content.cardFourDescription),
    isActive: readBoolean(item?.isActive, true),
  };
}

export function mapContentToAboutForm(item: ContentItem | null): AboutFormState {
  const content = item?.content ?? {};

  return {
    eyebrowText: readString(content.eyebrowText),
    heading: readString(content.heading),
    subheading: readString(content.subheading),
    description: readString(content.description),
    bulletOne: readString(content.bulletOne),
    bulletTwo: readString(content.bulletTwo),
    bulletThree: readString(content.bulletThree),
    bulletFour: readString(content.bulletFour),
    ctaText: readString(content.ctaText),
    ctaLink: readString(content.ctaLink),
    sectionImage: readString(content.sectionImage),
    isActive: readBoolean(item?.isActive, true),
  };
}
