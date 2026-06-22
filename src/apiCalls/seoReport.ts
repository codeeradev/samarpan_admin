import { get } from "@/apis/apiClient";
import { ENDPOINT } from "@/apis/endpoint";

export interface SeoReportResponse {
  success: boolean;
  source: string;
  report: {
    _id: string;
    reportHtml: string;
    reportDate: string;
    createdAt: string;
  };
}

export const getSeoReportApi = async (): Promise<SeoReportResponse> => {
  const response = await get(ENDPOINT.GET_SEO_REPORT, {
    needAuth: true,
  });

  return response.data;
};