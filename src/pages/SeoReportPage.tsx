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
    <div data-ocid="seo-report.page">
      <PageHeader
        title="SEO Audit Report"
        description="Latest RankMath SEO Analysis"
      />

      {isLoading ? (
        <div className="space-y-6 mb-6" data-ocid="seo-report.skeleton">
          <Skeleton className="h-[200px] w-full rounded-2xl" />
          <Skeleton className="h-[400px] w-full rounded-2xl" />
          <Skeleton className="h-[400px] w-full rounded-2xl" />
          <Skeleton className="h-[400px] w-full rounded-2xl" />
        </div>
      ) : error ? (
        <Card className="shadow-card border border-destructive/30 rounded-2xl mb-6">
          <CardContent className="p-5 sm:p-6 text-sm text-destructive">
            {error instanceof Error
              ? error.message
              : "Failed to load SEO report"}
          </CardContent>
        </Card>
      ) : !seoHtml ? (
        <Card className="shadow-card border border-border rounded-2xl mb-6">
          <CardContent className="p-5 sm:p-6 flex flex-col items-center justify-center py-20 text-center">
            <div className="w-12 h-12 rounded-xl bg-muted/50 flex items-center justify-center mb-4">
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-muted-foreground"
              >
                <path d="M9 12l2 2 4-4" />
                <circle cx="12" cy="12" r="9" />
              </svg>
            </div>
            <h3 className="font-semibold text-foreground mb-2">
              No SEO Report Available
            </h3>
            <p className="text-sm text-muted-foreground max-w-md">
              SEO report data is not available yet. The report will appear here
              once the analysis is complete.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div data-ocid="seo-report.content" className="mb-6">
          <style>
            {`
              /* ============================================================
                 SEO Report — dashboard-matched, theme-aware styling
                 ============================================================ */

              .seo-report {
                width: 100%;
                display: flex;
                flex-direction: column;
                gap: 1.5rem;
                font-family: inherit;
              }

              .seo-report * {
                box-sizing: border-box;
              }

              .seo-report ul {
                list-style: none;
                margin: 0;
                padding: 0;
              }

              /* ── Score overview: dashboard stat-card grid ───────────── */
              .seo-report .rank-math-result-graphs {
                width: 100%;
                background: oklch(var(--card));
                border: 1px solid oklch(var(--border));
                border-radius: 1rem;
                box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1);
                padding: 1.5rem;
                margin-bottom: 1.5rem;
              }

              .seo-report .two-col {
                display: grid;
                grid-template-columns: 220px 1fr;
                gap: 1.5rem;
                align-items: stretch;
              }

              .seo-report .graphs-main {
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                gap: 0.75rem;
                width: 100%;
                background: oklch(var(--muted) / 0.4);
                border: 1px solid oklch(var(--border));
                border-radius: 0.75rem;
                padding: 1.5rem 1rem;
              }

              #rank-math-circle-progress {
                width: 140px;
                height: 140px;
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
                inset: 0.5rem;
                border-radius: 50%;
                background: oklch(var(--card));
              }

              #rank-math-circle-progress strong {
                position: relative;
                z-index: 1;
                font-family: var(--font-display, inherit);
              }

              .seo-report .graphs-main .result-score {
                text-align: center;
                margin-top: 0.5rem;
              }

              .seo-report .graphs-main .result-score .score-average {
                font-size: 1.1rem;
                font-weight: 600;
                color: oklch(var(--foreground));
                font-family: var(--font-display, inherit);
              }

              .seo-report .result-score label {
                font-size: 0.7rem;
                text-transform: uppercase;
                letter-spacing: 0.05em;
                color: oklch(var(--muted-foreground));
                display: block;
                margin-top: 0.25rem;
                font-weight: 600;
              }

              .seo-report .graphs-side {
                width: 100%;
                min-width: 0;
                display: flex;
              }

              .seo-report .chart {
                display: grid;
                grid-template-columns: repeat(3, minmax(0, 1fr));
                gap: 1rem;
                width: 100%;
              }

              .seo-report .chart li {
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                gap: 0.75rem;
                background: oklch(var(--muted) / 0.4);
                border-radius: 0.75rem;
                padding: 1.25rem 1rem;
                border: 1px solid oklch(var(--border));
                min-height: 0;
                text-align: center;
                min-width: 0;
                transition: background 0.15s ease;
              }

              .seo-report .chart li:hover {
                background: oklch(var(--muted) / 0.6);
              }

              .seo-report .chart li span {
                width: 100%;
                display: block;
                border-radius: 9999px;
                height: 0.5rem !important;
                order: 3;
                background: oklch(var(--border));
                overflow: hidden;
              }

              .seo-report .chart-bar-good span    { background: oklch(var(--chart-2)); }
              .seo-report .chart-bar-average span  { background: oklch(var(--chart-3)); }
              .seo-report .chart-bar-bad span      { background: oklch(var(--destructive)); }

              .seo-report .chart li .result-score {
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 0.25rem;
                order: 1;
              }

              .seo-report .chart li .result-score strong {
                font-size: 1.75rem;
                font-weight: 700;
                color: oklch(var(--foreground));
                display: block;
                line-height: 1.1;
                font-family: var(--font-display, inherit);
              }

              .seo-report .chart li label {
                font-size: 0.7rem;
                font-weight: 600;
                text-transform: uppercase;
                letter-spacing: 0.05em;
                color: oklch(var(--muted-foreground));
                order: 2;
              }

              /* ── Category cards (Basic SEO / Advanced SEO / etc.) ───── */
              .seo-report .rank-math-result-table {
                width: 100%;
                background: oklch(var(--card));
                border: 1px solid oklch(var(--border));
                border-radius: 1rem;
                box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1);
                overflow: hidden;
                margin-bottom: 1.5rem;
              }

              .seo-report .rank-math-result-table > *:not(.table-row):not(.category-title) {
                padding-left: 3.75rem;
                padding-right: 1.75rem;
                margin-top: 1rem;
                margin-bottom: 1rem;
              }

              .seo-report .rank-math-result-table > h2,
              .seo-report .rank-math-result-table > h3,
              .seo-report .rank-math-result-table > h4 {
                padding-top: 1.25rem;
                padding-bottom: 0.75rem;
                font-size: 1rem;
                font-weight: 600;
                color: oklch(var(--foreground));
                font-family: var(--font-display, inherit);
              }

              .seo-report .category-title {
                font-size: 1rem;
                font-weight: 700;
                color: oklch(var(--foreground));
                padding: 1.25rem 1.75rem;
                background: oklch(var(--muted) / 0.5);
                border-bottom: 1px solid oklch(var(--border));
                letter-spacing: 0.01em;
                font-family: var(--font-display, inherit);
                margin-left:30px;
              }

              .seo-report .row-title {
                padding-left: 60px;
                margin-top: 10px;
              }

              .seo-report .status-icon {
                margin-left: 20px;
              }

              .seo-report .table-row {
                background: oklch(var(--card));
                padding: 1.5rem 1.75rem;
                border-bottom: 1px solid oklch(var(--border));
                border-left: 0.25rem solid transparent;
                transition: all 0.15s ease;
              }

              .seo-report .table-row:last-child {
                border-bottom: 0;
              }

              .seo-report .table-row:hover {
                background: oklch(var(--muted) / 0.3);
              }

              .seo-report .table-row:has(.status-ok),
              .seo-report .table-row:has(.icon-ok) {
                border-left-color: oklch(var(--chart-2));
                background: oklch(var(--chart-2) / 0.03);
              }
              .seo-report .table-row:has(.status-warning),
              .seo-report .table-row:has(.icon-attention-alt) {
                border-left-color: oklch(var(--chart-3));
                background: oklch(var(--chart-3) / 0.03);
              }
              .seo-report .table-row:has(.status-fail),
              .seo-report .table-row:has(.icon-cancel) {
                border-left-color: oklch(var(--destructive));
                background: oklch(var(--destructive) / 0.03);
              }
              .seo-report .table-row:has(.status-info) {
                border-left-color: oklch(var(--chart-1));
                background: oklch(var(--chart-1) / 0.03);
              }

              .seo-report .row-title {
                margin-bottom: 0.75rem;
                display: flex;
                align-items: center;
                gap: 0.75rem;
                flex-wrap: wrap;
              }

              .seo-report .row-title h3 {
                font-size: 1rem;
                font-weight: 600;
                color: oklch(var(--foreground));
                display: inline;
                margin: 0;
                font-family: var(--font-display, inherit);
              }

              .seo-report .row-description {
                display: flex;
                gap: 1rem;
                align-items: flex-start;
              }

              .seo-report .row-content {
                flex: 1;
                color: oklch(var(--muted-foreground));
                line-height: 1.6;
                font-size: 0.875rem;
                min-width: 0;
              }

              .seo-report .row-content p {
                margin: 0 0 0.75rem;
              }
              .seo-report .row-content p:last-child {
                margin-bottom: 0;
              }

              .seo-report .row-content .clear {
                margin-top: 0.75rem;
              }

              .seo-report .row-content br {
                display: none;
              }

              .seo-report .row-content code {
                white-space: normal;
                word-break: break-all;
              }

              .seo-report .row-content strong {
                color: oklch(var(--foreground));
                font-weight: 600;
              }

              /* ── Status icon badges ──────────────────────────────────── */
              .seo-report .status-icon {
                width: 1.5rem;
                height: 1.5rem;
                min-width: 1.5rem;
                border-radius: 9999px;
                display: inline-flex;
                align-items: center;
                justify-content: center;
                font-size: 0;
                margin-top: 0.125rem;
                color: oklch(var(--card));
                box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1);
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
                content: '✓'; font-size: 0.75rem; font-weight: bold;
              }
              .seo-report .status-icon.icon-cancel::after {
                content: '✕'; font-size: 0.75rem; font-weight: bold;
              }
              .seo-report .status-icon.icon-attention-alt::after {
                content: '!'; font-size: 0.875rem; font-weight: bold;
              }

              /* ── "How to fix" callouts ───────────────────────────────── */
              .seo-report .result-action {
                display: inline-flex;
                align-items: center;
                gap: 0.5rem;
                margin: 0 0.5rem 0.5rem 0;
                font-size: 0.8125rem;
                font-weight: 600;
                color: oklch(var(--primary));
                text-decoration: none;
                padding: 0.5rem 0.875rem;
                border-radius: 0.5rem;
                background: oklch(var(--primary) / 0.1);
                transition: all 0.15s ease;
                cursor: pointer;
                border: 1px solid oklch(var(--primary) / 0.2);
              }
              .seo-report .result-action:hover {
                background: oklch(var(--primary) / 0.15);
                transform: translateY(-1px);
              }

              .seo-report .how-to-fix-wrapper {
                margin-top: 1rem;
                padding: 1.25rem;
                background: oklch(var(--muted) / 0.4);
                border-radius: 0.75rem;
                border-left: 0.25rem solid oklch(var(--chart-3));
                border: 1px solid oklch(var(--border));
              }

              .seo-report .analysis-test-how-to-fix {
                font-size: 0.875rem;
                line-height: 1.6;
                color: oklch(var(--muted-foreground));
              }

              .seo-report .analysis-test-how-to-fix p {
                margin: 0 0 0.75rem;
              }
              .seo-report .analysis-test-how-to-fix p:last-child {
                margin-bottom: 0;
              }

              /* ── Tooltip ─────────────────────────────────────────────── */
              .seo-report .rank-math-tooltip {
                position: relative;
                display: inline-flex;
                align-items: center;
                vertical-align: middle;
              }
              .seo-report .rank-math-tooltip em {
                display: inline-flex;
                align-items: center;
                justify-content: center;
                width: 1.125rem;
                height: 1.125rem;
                border-radius: 9999px;
                background: oklch(var(--muted-foreground) / 0.2);
                color: oklch(var(--muted-foreground));
                font-style: normal;
                font-size: 0.625rem;
                font-weight: 700;
                cursor: help;
                transition: all 0.15s ease;
              }
              .seo-report .rank-math-tooltip:hover em {
                background: oklch(var(--primary) / 0.2);
                color: oklch(var(--primary));
              }
              .seo-report .rank-math-tooltip span {
                display: none;
                position: absolute;
                bottom: calc(100% + 0.5rem);
                left: 50%;
                transform: translateX(-50%);
                background: oklch(var(--popover));
                color: oklch(var(--popover-foreground));
                border: 1px solid oklch(var(--border));
                border-radius: 0.5rem;
                padding: 0.75rem 1rem;
                font-size: 0.8125rem;
                line-height: 1.5;
                white-space: normal;
                width: 16rem;
                z-index: 50;
                box-shadow: 0 4px 12px rgb(0 0 0 / 0.15);
              }
              .seo-report .rank-math-tooltip:hover span {
                display: block;
              }

              /* ── Inline code ─────────────────────────────────────────── */
              .seo-report code {
                background: oklch(var(--muted));
                padding: 0.25rem 0.5rem;
                border-radius: 0.375rem;
                font-size: 0.8125rem;
                color: oklch(var(--foreground));
                word-break: break-all;
                border: 1px solid oklch(var(--border));
                font-family: var(--font-mono, ui-monospace, 'Cascadia Code', 'Source Code Pro', Menlo, consolas, 'DejaVu Sans Mono', monospace);
              }

              .seo-report .seo-report-main-titles {
                display: inline-block;
                margin-top: 0.5rem;
              }

              /* ── Lists inside row content ─────────────────────────────── */
              .seo-report .row-content ul,
              .seo-report .info-list {
                padding-left: 1.5rem;
                margin-top: 0.75rem;
                list-style: disc;
              }
              .seo-report .row-content ul li,
              .seo-report .info-list li {
                margin-bottom: 0.375rem;
              }

              /* ── Images ──────────────────────────────────────────────── */
              .seo-report img {
                max-width: 100%;
                height: auto;
                border-radius: 0.75rem;
                margin-top: 0.75rem;
                border: 1px solid oklch(var(--border));
              }

              /* ── SERP preview ─────────────────────────────────────────── */
              .seo-report .serp-preview {
                background: oklch(var(--muted) / 0.4);
                border: 1px solid oklch(var(--border));
                border-radius: 0.75rem;
                padding: 1.25rem;
                margin-top: 1rem;
                max-width: 36rem;
              }
              .seo-report .serp-title {
                font-size: 1.125rem;
                color: oklch(var(--primary));
                font-weight: 600;
                line-height: 1.4;
                margin-bottom: 0.375rem;
                font-family: var(--font-display, inherit);
              }
              .seo-report .serp-url {
                font-size: 0.875rem;
                color: oklch(var(--chart-2));
                margin-bottom: 0.375rem;
                font-family: var(--font-mono, ui-monospace, 'Cascadia Code', 'Source Code Pro', Menlo, consolas, 'DejaVu Sans Mono', monospace);
              }
              .seo-report .serp-description {
                font-size: 0.9375rem;
                color: oklch(var(--muted-foreground));
                line-height: 1.5;
              }

              /* ── CTA ──────────────────────────────────────────────────── */
              .seo-report .analysis-cta {
                margin-top: 1rem;
              }
              .seo-report .analysis-cta a {
                display: inline-flex;
                align-items: center;
                gap: 0.5rem;
                padding: 0.75rem 1.25rem;
                background: oklch(var(--primary));
                color: oklch(var(--primary-foreground));
                border-radius: 0.5rem;
                font-size: 0.9375rem;
                font-weight: 600;
                text-decoration: none;
                transition: all 0.15s ease;
                box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1);
              }
              .seo-report .analysis-cta a:hover {
                transform: translateY(-1px);
                box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
              }

              .seo-report .clear {
                clear: both;
              }

              /* ── Responsive ──────────────────────────────────────────── */
              @media (max-width: 768px) {
                .seo-report .rank-math-result-graphs {
                  padding: 1.25rem;
                }
                .seo-report .two-col {
                  grid-template-columns: 1fr;
                  gap: 1.25rem;
                }
                .seo-report .chart {
                  grid-template-columns: repeat(3, minmax(0, 1fr));
                  gap: 0.75rem;
                }
                .seo-report .chart li {
                  padding: 1rem 0.75rem;
                  gap: 0.5rem;
                }
                .seo-report .chart li .result-score strong {
                  font-size: 1.375rem;
                }
                .seo-report .chart li label {
                  font-size: 0.625rem;
                }
                .seo-report .category-title {
                  padding: 1rem 1.25rem;
                  font-size: 0.9375rem;
                }
                .seo-report .table-row {
                  padding: 1.25rem;
                }
                .seo-report .row-content br {
                  display: none;
                }
                .seo-report .rank-math-tooltip span {
                  width: 12rem;
                }
              }

              @media (max-width: 480px) {
                .seo-report .chart {
                  grid-template-columns: 1fr;
                }
                .seo-report .chart li {
                  flex-direction: row;
                  justify-content: space-between;
                  align-items: center;
                  text-align: left;
                  padding: 1rem 1.25rem;
                }
                .seo-report .chart li .result-score {
                  flex-direction: row;
                  align-items: center;
                  gap: 0.75rem;
                  order: 1;
                }
                .seo-report .chart li label {
                  order: 2;
                }
                .seo-report .chart li span {
                  order: 0;
                  width: 28%;
                  height: 0.625rem !important;
                }
                .seo-report .table-row {
                  padding: 1rem;
                }
                .seo-report .category-title {
                  padding: 0.875rem 1rem;
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
