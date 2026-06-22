import { useQuery } from "@tanstack/react-query";
import parse from "html-react-parser";
import { getSeoReportApi } from "@/apiCalls/seoReport";
import { PageHeader } from "@/components/admin/PageHeader";
import { Skeleton } from "@/components/ui/skeleton";

export default function SeoReportPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["seo-report"],
    queryFn: getSeoReportApi,
  });

  const seoHtml = data?.report?.reportHtml || "";

  return (
    <div className="p-6 max-w-[1600px] mx-auto">
      <PageHeader
        title="SEO Audit Report"
        description="Latest RankMath SEO Analysis"
      />

      {isLoading ? (
        <Skeleton className="h-[600px] w-full rounded-2xl" />
      ) : (
        <>
          <style>
            {`
              .seo-report .rank-math-result-graphs{
                background:#fff;
                border:1px solid #e5e7eb;
                border-radius:16px;
                padding:24px;
                margin-bottom:24px;
              }

              .seo-report .category-title{
                font-size:24px;
                font-weight:700;
                margin:32px 0 16px;
                color:#111827;
              }

              .seo-report .table-row{
                background:#fff;
                border:1px solid #e5e7eb;
                border-radius:12px;
                padding:16px;
                margin-bottom:12px;
              }

              .seo-report .row-title h3{
                font-size:18px;
                font-weight:600;
                margin-bottom:8px;
                color:#111827;
              }

              .seo-report .row-content{
                color:#4b5563;
                line-height:1.7;
              }

              .seo-report .how-to-fix-wrapper{
                margin-top:12px;
                padding:12px;
                background:#f9fafb;
                border-radius:8px;
                border-left:4px solid #f59e0b;
              }

              .seo-report .result-action{
                display:inline-block;
                margin-bottom:10px;
                color:#2563eb;
                font-weight:600;
              }

              .seo-report code{
                background:#f3f4f6;
                padding:2px 6px;
                border-radius:4px;
              }

              .seo-report ul{
                padding-left:20px;
                margin-top:8px;
              }

              .seo-report img{
                max-width:100%;
                border-radius:12px;
              }

              .seo-report .status-ok{
                border-left:4px solid #22c55e;
              }

              .seo-report .status-warning{
                border-left:4px solid #f59e0b;
              }

              .seo-report .status-fail{
                border-left:4px solid #ef4444;
              }

              .seo-report .status-info{
                border-left:4px solid #3b82f6;
              }

              .seo-report .table-row:has(.status-ok){
                border-left:5px solid #22c55e;
              }

              .seo-report .table-row:has(.status-warning){
                border-left:5px solid #f59e0b;
              }

              .seo-report .table-row:has(.status-fail){
                border-left:5px solid #ef4444;
              }

              .seo-report .table-row:has(.status-info){
                border-left:5px solid #3b82f6;
              }
            `}
          </style>

          <div className="seo-report space-y-4">
            {parse(seoHtml)}
          </div>
        </>
      )}
    </div>
  );
}