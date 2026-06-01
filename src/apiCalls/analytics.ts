import { get } from "@/apis/apiClient";
import { ENDPOINT } from "@/apis/endpoint";

export type AnalyticsTotals = {
  totalVisitors: number;
  todaysVisitors: number;
  last7DaysVisitors: number;
  last30DaysVisitors: number;
  totalPageViews: number;
};

export type AnalyticsTopPage = {
  page: string;
  pageViews: number;
  visitors: number;
};

export type AnalyticsDailyVisitors = {
  day: string;
  visitors: number;
};

export type AnalyticsDashboard = {
  totals: AnalyticsTotals;
  topPages: AnalyticsTopPage[];
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
