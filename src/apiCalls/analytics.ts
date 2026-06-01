import { get } from "@/apis/apiClient";
import { ENDPOINT } from "@/apis/endpoint";

export type AnalyticsVisitorStats = {
  total: number;
  unique: number;
  repeated: number;
};

export type AnalyticsTotals = {
  totalVisitors: AnalyticsVisitorStats;
  todaysVisitors: AnalyticsVisitorStats;
  last7DaysVisitors: AnalyticsVisitorStats;
  last30DaysVisitors: AnalyticsVisitorStats;
  totalPageViews: number;
};

export type AnalyticsTopPage = {
  page: string;
  pageViews: number;
  visitors: number;
};

export type AnalyticsPageGroup = {
  key: string;
  title: string;
  pageViews: number;
  visitors: number;
  pages: AnalyticsTopPage[];
};

export type AnalyticsDailyVisitors = {
  day: string;
  visitors: number;
};

export type AnalyticsDashboard = {
  totals: AnalyticsTotals;
  topPages: AnalyticsTopPage[];
  pageGroups: AnalyticsPageGroup[];
  dailyVisitors: AnalyticsDailyVisitors[];
};

export type AnalyticsResponse = {
  message: string;
  analytics: AnalyticsDashboard;
};

export const getAnalyticsApi = async (): Promise<AnalyticsDashboard> => {
  const response = await get(ENDPOINT.GET_ANALYTICS, {
    needAuth: true,
  });

  return (response.data as AnalyticsResponse).analytics;
};
