import { getAnalyticsApi } from "@/apiCalls/analytics";
import { useQuery } from "@tanstack/react-query";

export const useAnalyticsDashboard = () =>
  useQuery({
    queryKey: ["analytics-dashboard"],
    queryFn: getAnalyticsApi,
  });
