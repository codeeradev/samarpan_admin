import { get, post } from "@/apis/apiClient";
import { BASE_URL } from "@/apis/endpoint";

const API_ROOT = BASE_URL.replace(/\/admin\/?$/, "");
const metaEndpoint = (path: string) => `${API_ROOT}/api/meta${path}`;

export type MetaDateRange = {
  range: "today" | "7d" | "30d" | "90d" | "custom";
  startDate?: string;
  endDate?: string;
};

export type MetaAccount = {
  id: string;
  pageId: string;
  pageName: string;
  pagePicture: string;
  instagramBusinessAccountId: string;
  instagramUsername: string;
  tokenExpiresAt?: string | null;
  connectedAt?: string | null;
  status: "pending" | "active" | "expired" | "disconnected";
};

export type MetaStatus = {
  connected: boolean;
  needsPageSelection?: boolean;
  status: MetaAccount["status"];
  account: MetaAccount | null;
};

export type MetaPageOption = {
  pageId: string;
  pageName: string;
  pagePicture: string;
  instagramBusinessAccountId: string;
  instagramUsername: string;
  hasInstagramBusinessAccount: boolean;
};

export type MetaDailyAnalytics = {
  date: string;
  followers: number;
  reach: number;
  impressions: number;
  engagement: number;
  profileVisits: number;
  websiteClicks: number;
};

export type MetaOverview = {
  followers: number;
  reach: number;
  impressions: number;
  engagement: number;
  profileVisits: number;
  websiteClicks: number;
  totalPosts: number;
  totalReels: number;
};

export type MetaOverviewResponse = {
  syncError?: string | null;
  overview: MetaOverview;
  daily: MetaDailyAnalytics[];
};

export type MetaPost = {
  id: string;
  thumbnail: string;
  platform: "Facebook" | "Instagram";
  caption: string;
  postedDate: string;
  likes: number;
  comments: number;
  reach: number;
  impressions: number;
  engagement: number;
  engagementRate: number;
};

const buildRangeParams = (range: MetaDateRange) => {
  const params = new URLSearchParams({ range: range.range });
  if (range.range === "custom") {
    if (range.startDate) params.set("startDate", range.startDate);
    if (range.endDate) params.set("endDate", range.endDate);
  }
  return params.toString();
};

export const getMetaConnectApi = async (): Promise<{ authUrl: string }> => {
  const response = await get(metaEndpoint("/connect"), { needAuth: true });
  return response.data as { authUrl: string };
};

export const completeMetaCallbackApi = async (
  code: string,
  state: string,
): Promise<{ message: string; needsPageSelection: boolean }> => {
  const params = new URLSearchParams({ code, state });
  const response = await get(metaEndpoint(`/callback?${params.toString()}`));
  return response.data as { message: string; needsPageSelection: boolean };
};

export const getMetaStatusApi = async (): Promise<MetaStatus> => {
  const response = await get(metaEndpoint("/status"), { needAuth: true });
  return response.data as MetaStatus;
};

export const disconnectMetaApi = async () => {
  const response = await post(
    metaEndpoint("/disconnect"),
    {},
    { needAuth: true },
  );
  return response.data;
};

export const getMetaPagesApi = async (): Promise<MetaPageOption[]> => {
  const response = await get(metaEndpoint("/pages"), { needAuth: true });
  return (response.data as { pages: MetaPageOption[] }).pages;
};

export const selectMetaPageApi = async (
  pageId: string,
): Promise<{ account: MetaAccount }> => {
  const response = await post(
    metaEndpoint("/select-page"),
    { pageId },
    { needAuth: true },
  );
  return response.data as { account: MetaAccount };
};

export const getMetaOverviewApi = async (
  range: MetaDateRange,
): Promise<MetaOverviewResponse> => {
  const response = await get(
    metaEndpoint(`/overview?${buildRangeParams(range)}`),
    {
      needAuth: true,
    },
  );
  return response.data as MetaOverviewResponse;
};

export const getMetaPostsApi = async (): Promise<MetaPost[]> => {
  const response = await get(metaEndpoint("/posts"), { needAuth: true });
  return (response.data as { posts: MetaPost[] }).posts;
};

export const getMetaTopPostsApi = async (): Promise<MetaPost[]> => {
  const response = await get(metaEndpoint("/top-posts"), { needAuth: true });
  return (response.data as { posts: MetaPost[] }).posts;
};
