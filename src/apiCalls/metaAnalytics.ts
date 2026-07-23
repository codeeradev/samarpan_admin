import { get, post, patch } from "@/apis/apiClient";
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
  followerAdds?: number;
  reach: number;
  impressions: number;
  engagement: number;
  profileVisits: number;
  websiteClicks: number;
};

export type MetaOverview = {
  followers: number;
  totalFollowers: number;
  reach: number;
  impressions: number;
  engagement: number;
  profileVisits: number;
  websiteClicks: number;
  totalPosts: number;
  totalReels: number;
  totalLikes?: number;
  totalComments?: number;
  totalMessages?: number;
  unreadMessages?: number;
};

export type MetaPlatformOverview = MetaOverview & {
  totalConversations?: number;
};

export type MetaOverviewResponse = {
  syncError?: string | null;
  overview: MetaOverview;
  platforms?: {
    facebook: MetaPlatformOverview;
    instagram: MetaPlatformOverview;
  };
  daily: MetaDailyAnalytics[];
  dailyByPlatform?: {
    facebook: MetaDailyAnalytics[];
    instagram: MetaDailyAnalytics[];
  };
};

export type MetaPost = {
  id: string;
  thumbnail: string;
  permalink?: string;
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

export type PostLike = {
  id: string;
  name: string;
};

export type PostComment = {
  id: string;
  message: string;
  fromName: string;
  fromId: string;
  createdTime: string;
};

export type PostDetails = {
  postId: string;
  platform: MetaPost["platform"];
  likeCount: number;
  commentCount: number;
  likes: PostLike[];
  comments: PostComment[];
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

export const getMetaPostDetailsApi = async (
  postId: string,
  platform: MetaPost["platform"],
): Promise<PostDetails> => {
  const response = await get(
    metaEndpoint(
      `/posts/${encodeURIComponent(postId)}/${encodeURIComponent(platform)}`,
    ),
    { needAuth: true },
  );
  return response.data as PostDetails;
};

export const getMetaTopPostsApi = async (): Promise<MetaPost[]> => {
  const response = await get(metaEndpoint("/top-posts"), { needAuth: true });
  return (response.data as { posts: MetaPost[] }).posts;
};

export interface MetaLeadForm {
  formId: string;
  formName: string;
  status: string;
  leadsCount: number;
}

export type MetaLeadStatus = "new" | "contacted" | "qualified" | "converted" | "closed" | "CREATED";

export interface MetaLead {
  _id: string;
  leadId: string;
  formId: string;
  formName: string;
  platform: "Facebook";
  createdTime: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  fieldData: Record<string, string>;
  status: MetaLeadStatus;
  notes: string;
}

export interface MetaLeadsQuery {
  page?: number;
  limit?: number;
  search?: string;
  formId?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
}

export interface MetaLeadsResponse {
  leads: MetaLead[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
  statusCounts: Record<string, number>;
}

const buildLeadsQuery = (query: MetaLeadsQuery) => {
  const params = new URLSearchParams();
  if (query.page) params.set("page", String(query.page));
  if (query.limit) params.set("limit", String(query.limit));
  if (query.search) params.set("search", query.search);
  if (query.formId) params.set("formId", query.formId);
  if (query.status) params.set("status", query.status);
  if (query.startDate) params.set("startDate", query.startDate);
  if (query.endDate) params.set("endDate", query.endDate);
  return params.toString();
};

export const getLeadFormsApi = async (): Promise<{ forms: MetaLeadForm[] }> => {
  const response = await get(metaEndpoint("/leads/forms"), { needAuth: true });
  return response.data as { forms: MetaLeadForm[] };
};

export const syncMetaLeadsApi = async () => {
  const response = await post(
    metaEndpoint("/leads/sync"),
    {},
    { needAuth: true },
  );
  return response.data as { message: string; syncedCount: number; formsChecked: number };
};

export const getMetaLeadsApi = async (
  query: MetaLeadsQuery,
): Promise<MetaLeadsResponse> => {
  const response = await get(
    metaEndpoint(`/leads?${buildLeadsQuery(query)}`),
    { needAuth: true },
  );
  return response.data as MetaLeadsResponse;
};

export const getMetaLeadDetailsApi = async (
  leadId: string,
): Promise<{ lead: MetaLead }> => {
  const response = await get(
    metaEndpoint(`/leads/${encodeURIComponent(leadId)}`),
    { needAuth: true },
  );
  return response.data as { lead: MetaLead };
};

export const updateMetaLeadApi = async (
  leadId: string,
  payload: { status?: MetaLeadStatus; notes?: string },
): Promise<{ lead: MetaLead }> => {
  const response = await patch(
    metaEndpoint(`/leads/${encodeURIComponent(leadId)}`),
    payload,
    { needAuth: true },
  );
  return response.data as { lead: MetaLead };
};