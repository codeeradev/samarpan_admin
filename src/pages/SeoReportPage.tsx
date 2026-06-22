import { useQuery } from "@tanstack/react-query";
import parse from "html-react-parser";
import { getSeoReportApi } from "@/apiCalls/seoReport";
import { PageHeader } from "@/components/admin/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function SeoReportPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["seo-report"],
    queryFn: getSeoReportApi,
  });

  const seoHtml = data?.report?.reportHtml || "";

  return (
    <div data-ocid="seo-report.page" className="p-6 max-w-[1600px] mx-auto">
      <PageHeader
        title="SEO Audit Report"
        description="Latest RankMath SEO Analysis"
      />

      {isLoading ? (
        <div className="space-y-4" data-ocid="seo-report.skeleton">
          <Skeleton className="h-[200px] w-full rounded-2xl" />
          <Skeleton className="h-[400px] w-full rounded-2xl" />
          <Skeleton className="h-[400px] w-full rounded-2xl" />
          <Skeleton className="h-[400px] w-full rounded-2xl" />
        </div>
      ) : error ? (
        <Card className="shadow-card border border-destructive/30 rounded-2xl">
          <CardContent className="p-4 sm:p-5 text-sm text-destructive">
            {error instanceof Error
              ? error.message
              : "Failed to load SEO report"}
          </CardContent>
        </Card>
      ) : !seoHtml ? (
        <Card className="shadow-card border border-border rounded-2xl">
          <CardContent className="p-4 sm:p-5 flex flex-col items-center justify-center py-16 text-center">
            <p className="text-sm text-muted-foreground">
              No SEO report data available yet.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div data-ocid="seo-report.content" className="mb-4 sm:mb-6">
          <style>
            {`
              /* =============================================================
                 SEO Report – 100 % theme‑aware styles.
                 ZERO hardcoded colours — every colour resolves through
                 oklch(var(--<token>)) so it respects the panel theme API.
                 ============================================================= */

              /* ── Score graph container (Dashboard card pattern) ─────── */
              .seo-report .rank-math-result-graphs {
                background: oklch(var(--card));
                border: 1px solid oklch(var(--border));
                border-radius: 16px;
                padding: 24px;
                margin-bottom: 24px;
                box-shadow: 0 1px 2px 0 rgb(0 0 0 / 0.03);
              }

              .seo-report .two-col {
                display: flex;
                flex-wrap: wrap;
                gap: 24px;
                align-items: center;
              }

              .seo-report .graphs-main {
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 8px;
                min-width: 180px;
              }

              .seo-report .score-average {
                font-size: 2rem;
                font-weight: 700;
                color: oklch(var(--foreground));
              }

              .seo-report .result-score label {
                font-size: 0.75rem;
                text-transform: uppercase;
                letter-spacing: 0.05em;
                color: oklch(var(--muted-foreground));
                display: block;
                text-align: center;
              }

              .seo-report .graphs-side {
                flex: 1;
                min-width: 220px;
              }

              /* ── Chart bar tiles ─────────────────────────────────────── */
              .seo-report .chart {
                display: flex;
                gap: 12px;
                list-style: none;
                padding: 0;
                margin: 0;
              }

              .seo-report .chart li {
                flex: 1;
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 8px;
                background: oklch(var(--muted) / 0.5);
                border-radius: 12px;
                padding: 16px 12px;
                border: 1px solid oklch(var(--border));
              }

              .seo-report .chart li span {
                width: 100%;
                display: block;
                border-radius: 8px;
                height: 8px !important;
              }

              /* chart‑2 = greenish‑brown (pass), chart‑3 = warm amber (warn),
                 destructive = red (fail) — all come from theme API          */
              .seo-report .chart-bar-good span  { background: oklch(var(--chart-2)); }
              .seo-report .chart-bar-average span { background: oklch(var(--chart-3)); }
              .seo-report .chart-bar-bad span    { background: oklch(var(--destructive)); }

              .seo-report .chart li .result-score strong {
                font-size: 1.125rem;
                font-weight: 700;
                color: oklch(var(--foreground));
                display: block;
                text-align: center;
              }

              /* ── Circular score badge ────────────────────────────────── */
              #rank-math-circle-progress {
                width: 120px;
                height: 120px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 2.25rem;
                font-weight: 700;
                color: oklch(var(--foreground));
                background: conic-gradient(
                  oklch(var(--chart-2)) 0deg 226.8deg,
                  oklch(var(--border)) 226.8deg 360deg
                );
                position: relative;
                flex-shrink: 0;
              }

              #rank-math-circle-progress::before {
                content: '';
                position: absolute;
                inset: 8px;
                border-radius: 50%;
                background: oklch(var(--card));
              }

              #rank-math-circle-progress strong {
                position: relative;
                z-index: 1;
              }

              /* ── Category section header ─────────────────────────────── */
              .seo-report .rank-math-result-table {
                margin-bottom: 28px;
              }

              .seo-report .category-title {
                font-size: 1.05rem;
                font-weight: 600;
                color: oklch(var(--foreground));
                padding: 16px 20px;
                background: oklch(var(--card));
                border: 1px solid oklch(var(--border));
                border-radius: 12px 12px 0 0;
                border-bottom: 0;
                font-family: 'Space Grotesk', sans-serif;
                letter-spacing: 0.01em;
              }

              /* ── Test row (dashboard sub‑card) ───────────────────────── */
              .seo-report .table-row {
                background: oklch(var(--card));
                border: 1px solid oklch(var(--border));
                padding: 20px;
                transition: box-shadow 0.2s ease;
              }

              .seo-report .table-row:last-child {
                border-radius: 0 0 12px 12px;
              }

              .seo-report .table-row:hover {
                box-shadow: 0 2px 8px -2px rgb(0 0 0 / 0.08);
                position: relative;
                z-index: 1;
              }

              /* ── Left colour bar — all from theme API ───────────────── */
              .seo-report .table-row:has(.status-ok),
              .seo-report .table-row:has(.icon-ok) {
                border-left: 5px solid oklch(var(--chart-2));
              }
              .seo-report .table-row:has(.status-warning),
              .seo-report .table-row:has(.icon-attention-alt) {
                border-left: 5px solid oklch(var(--chart-3));
              }
              .seo-report .table-row:has(.status-fail),
              .seo-report .table-row:has(.icon-cancel) {
                border-left: 5px solid oklch(var(--destructive));
              }
              .seo-report .table-row:has(.status-info) {
                border-left: 5px solid oklch(var(--chart-1));
              }

              .seo-report .row-title {
                margin-bottom: 10px;
              }

              .seo-report .row-title h3 {
                font-size: 1rem;
                font-weight: 600;
                color: oklch(var(--foreground));
                display: inline;
              }

              .seo-report .row-description {
                display: flex;
                gap: 12px;
                align-items: flex-start;
              }

              .seo-report .row-content {
                flex: 1;
                color: oklch(var(--muted-foreground));
                line-height: 1.7;
                font-size: 0.875rem;
              }

              /* ── Status icon badges — all from theme API ────────────── */
              .seo-report .status-icon {
                width: 24px;
                height: 24px;
                border-radius: 9999px;
                display: inline-flex;
                align-items: center;
                justify-content: center;
                flex-shrink: 0;
                font-size: 0;
                margin-top: 2px;
                color: oklch(var(--card));
              }
              .seo-report .status-icon.icon-ok,
              .seo-report .status-icon.status-ok {
                background: oklch(var(--chart-2));
              }
              .seo-report .status-icon.icon-cancel,
              .seo-report .status-icon.status-fail {
                background: oklch(var(--destructive));
              }
              .seo-report .status-icon.icon-attention-alt,
              .seo-report .status-icon.status-warning {
                background: oklch(var(--chart-3));
              }
              .seo-report .status-icon.status-info {
                background: oklch(var(--chart-1));
              }

              .seo-report .status-icon.icon-ok::after {
                content: '✓'; font-size: 12px; font-weight: bold;
              }
              .seo-report .status-icon.icon-cancel::after {
                content: '✕'; font-size: 12px; font-weight: bold;
              }
              .seo-report .status-icon.icon-attention-alt::after {
                content: '!'; font-size: 14px; font-weight: bold;
              }

              /* ── "How to fix" wrapper ────────────────────────────────── */
              .seo-report .how-to-fix-wrapper {
                margin-top: 12px;
                padding: 16px;
                background: oklch(var(--muted) / 0.5);
                border-radius: 10px;
                border-left: 4px solid oklch(var(--chart-3));
              }

              .seo-report .analysis-test-how-to-fix {
                font-size: 0.8125rem;
                line-height: 1.7;
                color: oklch(var(--muted-foreground));
              }
              .seo-report .analysis-test-how-to-fix p {
                margin-bottom: 8px;
              }
              .seo-report .analysis-test-how-to-fix p:last-child {
                margin-bottom: 0;
              }

              .seo-report .result-action {
                display: inline-flex;
                align-items: center;
                gap: 4px;
                margin-bottom: 8px;
                font-size: 0.8125rem;
                font-weight: 600;
                color: oklch(var(--primary));
                text-decoration: none;
                padding: 4px 12px;
                border-radius: 6px;
                background: oklch(var(--primary) / 0.1);
                transition: background 0.15s ease;
              }
              .seo-report .result-action:hover {
                background: oklch(var(--primary) / 0.15);
              }

              /* ── Tooltip ─────────────────────────────────────────────── */
              .seo-report .rank-math-tooltip {
                position: relative;
                display: inline-flex;
                align-items: center;
                margin-left: 6px;
                vertical-align: middle;
              }
              .seo-report .rank-math-tooltip em {
                display: inline-flex;
                align-items: center;
                justify-content: center;
                width: 18px;
                height: 18px;
                border-radius: 9999px;
                background: oklch(var(--muted-foreground) / 0.2);
                color: oklch(var(--muted-foreground));
                font-style: normal;
                font-size: 11px;
                font-weight: 700;
                cursor: help;
              }
              .seo-report .rank-math-tooltip span {
                display: none;
                position: absolute;
                bottom: calc(100% + 8px);
                left: 50%;
                transform: translateX(-50%);
                background: oklch(var(--popover));
                color: oklch(var(--popover-foreground));
                border: 1px solid oklch(var(--border));
                border-radius: 8px;
                padding: 8px 12px;
                font-size: 0.75rem;
                line-height: 1.5;
                white-space: normal;
                width: 240px;
                z-index: 50;
                box-shadow: 0 4px 12px rgb(0 0 0 / 0.1);
              }
              .seo-report .rank-math-tooltip:hover span {
                display: block;
              }

              /* ── Inline code ─────────────────────────────────────────── */
              .seo-report code {
                background: oklch(var(--muted));
                padding: 2px 8px;
                border-radius: 6px;
                font-size: 0.8125rem;
                color: oklch(var(--foreground));
              }
              .seo-report .seo-report-main-titles {
                display: inline-block;
                margin-top: 4px;
              }

              /* ── Lists ───────────────────────────────────────────────── */
              .seo-report ul,
              .seo-report .info-list {
                padding-left: 20px;
                margin-top: 8px;
                list-style: disc;
              }
              .seo-report ul li,
              .seo-report .info-list li { margin-bottom: 4px; }

              /* ── Images ──────────────────────────────────────────────── */
              .seo-report img {
                max-width: 100%;
                height: auto;
                border-radius: 12px;
              }

              /* ── SERP preview — zero hardcoded colours ──────────────── */
              .seo-report .serp-preview {
                background: oklch(var(--muted) / 0.4);
                border: 1px solid oklch(var(--border));
                border-radius: 10px;
                padding: 12px 16px;
                margin-top: 8px;
                max-width: 600px;
              }
              .seo-report .serp-title {
                font-size: 1.125rem;
                color: oklch(var(--primary));
                font-weight: 600;
                line-height: 1.3;
                margin-bottom: 2px;
              }
              .seo-report .serp-url {
                font-size: 0.8125rem;
                color: oklch(var(--chart-2));
                margin-bottom: 2px;
              }
              .seo-report .serp-description {
                font-size: 0.875rem;
                color: oklch(var(--muted-foreground));
                line-height: 1.4;
              }

              /* ── CTA / promo banner ──────────────────────────────────── */
              .seo-report .analysis-cta {
                margin-top: 16px;
                margin-bottom: 16px;
              }
              .seo-report .analysis-cta a {
                display: inline-flex;
                align-items: center;
                gap: 6px;
                padding: 10px 20px;
                background: oklch(var(--primary) / 0.1);
                color: oklch(var(--primary));
                border-radius: 10px;
                font-size: 0.875rem;
                font-weight: 600;
                text-decoration: none;
                transition: background 0.15s ease;
              }
              .seo-report .analysis-cta a:hover {
                background: oklch(var(--primary) / 0.15);
              }

              /* ── Clear ───────────────────────────────────────────────── */
              .seo-report .clear { clear: both; }

              /* ── Responsive ──────────────────────────────────────────── */
              @media (max-width: 639px) {
                .seo-report .two-col {
                  flex-direction: column;
                  align-items: center;
                }
                .seo-report .chart {
                  flex-direction: column;
                }
                .seo-report .category-title {
                  font-size: 0.95rem;
                  padding: 14px 16px;
                }
                .seo-report .table-row {
                  padding: 14px;
                }
                .seo-report .rank-math-result-graphs {
                  padding: 16px;
                }
                .seo-report .rank-math-tooltip span {
                  width: 180px;
                }
              }

              @media (min-width: 640px) and (max-width: 1023px) {
                .seo-report .chart {
                  gap: 10px;
                }
                .seo-report .chart li {
                  padding: 12px 8px;
                }
              }
            `}
          </style>

          <div className="seo-report">{parse(seoHtml)}</div>
        </div>
      )}
    </div>
  );
}