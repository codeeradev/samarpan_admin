import { useEffect, useRef } from "react";
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
  const contentRef = useRef<HTMLDivElement>(null);

  // Post-process the injected RankMath HTML:
  //  1. Drop the "Mobile Snapshot" row
  //  2. Drop promo banners (WP Rocket / "Install Rank Math SEO plugin" upsells)
  //  3. Make the score ring reflect the actual score instead of a fixed angle
  useEffect(() => {
    const container = contentRef.current;
    if (!seoHtml || !container) return;

    // 4) Make each chart bar's WIDTH reflect its actual share of total tests
    //    (Passed / Warnings / Failed), not just a fixed full-width bar.
    const chartItems = container.querySelectorAll<HTMLLIElement>(".chart li");
    chartItems.forEach((li) => {
      const strongText = li.querySelector("strong")?.textContent || "";
      const m = strongText.match(/(\d+)\s*\/\s*(\d+)/);
      const bar = li.querySelector<HTMLElement>("span");
      if (m && bar) {
        const count = parseInt(m[1], 10);
        const total = parseInt(m[2], 10);
        const percent = total > 0 ? Math.min(100, (count / total) * 100) : 0;
        bar.style.setProperty("--fill-percent", `${percent}%`);
      }
    });
    // 1) Remove the "Mobile Snapshot" test row
    const headingNodes = container.querySelectorAll(".row-title, h2, h3, h4");
    headingNodes.forEach((el) => {
      const text = el.textContent?.trim().toLowerCase() || "";
      if (text.startsWith("mobile snapshot")) {
        const row = el.closest(".table-row") || el.parentElement;
        row?.remove();
      }
    });

    // 2) Remove promo banners: WP Rocket CTA + "Install Rank Math SEO plugin..." upsells
    const promoByHref = container.querySelectorAll<HTMLAnchorElement>(
      'a[href*="wp-rocket"], a[href*="rankmath.com"]',
    );
    promoByHref.forEach((a) => {
      (a.closest("div, p, a") || a).remove();
    });
    container.querySelectorAll("a, button, div, p").forEach((el) => {
      const text = el.textContent || "";
      if (
        /install\s+wp\s*rocket/i.test(text) ||
        /install\s+rank\s*math\s+seo\s+plugin/i.test(text) ||
        /get\s+more\s+advanced\s+reports\s+inside\s+wordpress/i.test(text)
      ) {
        // Only remove the smallest reasonable wrapper, never the whole report
        const wrapper = el.closest("div, p") || el;
        if (wrapper !== container) wrapper.remove();
      }
    });

    // 3) Fix the score ring so it matches the real score
    const ring = container.querySelector<HTMLElement>(
      "#rank-math-circle-progress",
    );
    if (ring) {
      const scoreText = ring.querySelector("strong")?.textContent || "";
      const match = scoreText.match(/\d+(\.\d+)?/);
      if (match) {
        const percent = Math.max(0, Math.min(100, parseFloat(match[0])));
        ring.style.setProperty("--score-angle", `${(percent / 100) * 360}deg`);
        ring.classList.remove("score-good", "score-average", "score-poor");
        if (percent >= 80) ring.classList.add("score-good");
        else if (percent >= 50) ring.classList.add("score-average");
        else ring.classList.add("score-poor");
      }
    }
  }, [seoHtml]);

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
                 SEO Report — RankMath-style structure, theme-aware colors
                 ============================================================ */

              @keyframes seo-report-fade-in {
                from { opacity: 0; transform: translateY(6px); }
                to   { opacity: 1; transform: translateY(0); }
              }

              .seo-report {
                width: 100%;
                display: flex;
                flex-direction: column;
                gap: 1.5rem;
                font-family: inherit;
                animation: seo-report-fade-in 0.3s ease both;
              }

              @media (prefers-reduced-motion: reduce) {
                .seo-report { animation: none; }
              }

              .seo-report * {
                box-sizing: border-box;
              }

              .seo-report ul {
                list-style: none;
                margin: 0;
                padding: 0;
              }

              /* ── Score overview: circular score + pass/warn/fail tiles ── */
              .seo-report .rank-math-result-graphs {
                width: 100%;
                background: oklch(var(--card));
                border: 1px solid oklch(var(--border));
                border-radius: 0.75rem;
                box-shadow: 0 1px 2px 0 rgb(0 0 0 / 0.04);
                padding: 1.5rem;
              }

              .seo-report .two-col {
                display: grid;
                grid-template-columns: 240px 1fr;
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
                background: oklch(var(--muted) / 0.3);
                border: 1px solid oklch(var(--border));
                border-radius: 0.625rem;
                padding: 1.5rem 1rem;
              }

              #rank-math-circle-progress {
                --score-angle: 226.8deg;
                width: 150px;
                height: 150px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 2.375rem;
                font-weight: 700;
                color: oklch(var(--foreground));
                background: conic-gradient(
                  oklch(var(--chart-2)) 0deg var(--score-angle),
                  oklch(var(--border)) var(--score-angle) 360deg
                );
                position: relative;
                flex-shrink: 0;
                transition: background 0.6s ease;
              }

              #rank-math-circle-progress.score-average {
                background: conic-gradient(
                  oklch(var(--chart-3)) 0deg var(--score-angle),
                  oklch(var(--border)) var(--score-angle) 360deg
                );
              }

              #rank-math-circle-progress.score-poor {
                background: conic-gradient(
                  oklch(var(--destructive)) 0deg var(--score-angle),
                  oklch(var(--border)) var(--score-angle) 360deg
                );
              }

              #rank-math-circle-progress::before {
                content: '';
                position: absolute;
                inset: 0.55rem;
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
                margin-top: 0.25rem;
              }

              .seo-report .graphs-main .result-score .score-average {
                font-size: 1.05rem;
                font-weight: 600;
                color: oklch(var(--foreground));
                font-family: var(--font-display, inherit);
              }

              .seo-report .result-score label {
                font-size: 0.6875rem;
                text-transform: uppercase;
                letter-spacing: 0.06em;
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
                gap: 0.625rem;
                background: oklch(var(--card));
                border-radius: 0.625rem;
                padding: 1.5rem 1rem;
                border: 1px solid oklch(var(--border));
                min-height: 0;
                text-align: center;
                min-width: 0;
                transition: box-shadow 0.15s ease;
              }

              .seo-report .chart li:hover {
                box-shadow: 0 2px 8px -2px rgb(0 0 0 / 0.1);
              }

.seo-report .chart li span {
  position: relative;
  align-self: stretch;
  width: 100%;
  display: block;
  border-radius: 9999px;
  height: 0.375rem !important;
  order: 3;
  background: oklch(var(--border)); /* empty/track color — hamesha full width */
  overflow: hidden;
}

.seo-report .chart li span::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  width: var(--fill-percent, 0%);
  border-top-left-radius: 9999px;
  border-bottom-left-radius: 9999px;
  border-top-right-radius: 2px;
  border-bottom-right-radius: 2px;
  transition: width 0.4s ease;
}

/* Explicit green / yellow / red — theme's chart-2/chart-3/destructive tokens
   are gold/brown in this design system, not literal colors, so hardcode here. */
.seo-report .chart li:nth-child(1) span::before { background: #22c55e !important; } /* Passed = green */
.seo-report .chart li:nth-child(2) span::before { background: #eab308 !important; } /* Warnings = yellow */
.seo-report .chart li:nth-child(3) span::before { background: #ef4444 !important; } /* Failed = red */

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
                display: block;
                line-height: 1.1;
                font-family: var(--font-display, inherit);
                color: oklch(var(--foreground));
              }

              .seo-report .chart-bar-good .result-score strong    { color: oklch(var(--chart-2)); }
              .seo-report .chart-bar-average .result-score strong { color: oklch(var(--chart-3)); }
              .seo-report .chart-bar-bad .result-score strong     { color: oklch(var(--destructive)); }

              .seo-report .chart li label {
                font-size: 0.6875rem;
                font-weight: 600;
                text-transform: uppercase;
                letter-spacing: 0.06em;
                color: oklch(var(--muted-foreground));
                order: 2;
              }

              /* ── Category cards (Basic SEO / Advanced SEO / etc.) ───── */
              .seo-report .rank-math-result-table {
                width: 100%;
                background: oklch(var(--card));
                border: 1px solid oklch(var(--border));
                border-radius: 0.75rem;
                box-shadow: 0 1px 2px 0 rgb(0 0 0 / 0.04);
                overflow: hidden;
              }

              .seo-report .rank-math-result-table > *:not(.table-row):not(.category-title) {
                padding-left: 1.75rem;
                padding-right: 1.75rem;
                margin-top: 1rem;
                margin-bottom: 1rem;
                color: oklch(var(--muted-foreground));
                font-size: 0.875rem;
                line-height: 1.6;
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

              /* Solid, full-width section header bar — matches the RankMath report layout */
              .seo-report .category-title {
                font-size: 0.9375rem;
                font-weight: 700;
                color: oklch(var(--primary-foreground));
                background: oklch(var(--primary));
                padding: 0.875rem 1.75rem;
                letter-spacing: 0.03em;
                text-transform: uppercase;
                font-family: var(--font-display, inherit);
                margin-left: 0;
              }

              /* Two-column row: label on the left, result content on the right */
              .seo-report .table-row {
                display: grid;
                grid-template-columns: 190px 1fr;
                gap: 1.5rem;
                align-items: start;
                background: oklch(var(--card));
                padding: 1.125rem 1.75rem;
                border-bottom: 1px solid oklch(var(--border));
                border-left: 3px solid transparent;
                transition: background 0.15s ease;
              }

              .seo-report .table-row:nth-child(even) {
                background: oklch(var(--muted) / 0.25);
              }

              .seo-report .table-row:last-child {
                border-bottom: 0;
              }

              .seo-report .table-row:hover {
                background: oklch(var(--muted) / 0.45);
              }

              .seo-report .table-row:has(.status-ok),
              .seo-report .table-row:has(.icon-ok) {
                border-left-color: oklch(var(--chart-2));
              }
              .seo-report .table-row:has(.status-warning),
              .seo-report .table-row:has(.icon-attention-alt) {
                border-left-color: oklch(var(--chart-3));
              }
              .seo-report .table-row:has(.status-fail),
              .seo-report .table-row:has(.icon-cancel) {
                border-left-color: oklch(var(--destructive));
              }
              .seo-report .table-row:has(.status-info) {
                border-left-color: oklch(var(--chart-1));
              }

              .seo-report .row-title {
                grid-column: 1;
                padding-left: 0;
                margin-top: 0;
                margin-bottom: 0;
                display: flex;
                align-items: flex-start;
                gap: 0.5rem;
                flex-wrap: wrap;
              }

              .seo-report .row-title h3 {
                font-size: 0.9375rem;
                font-weight: 600;
                color: oklch(var(--foreground));
                display: inline;
                margin: 0;
                line-height: 1.4;
                font-family: var(--font-display, inherit);
              }

              .seo-report .row-description {
                grid-column: 2;
                display: flex;
                gap: 0.875rem;
                align-items: flex-start;
                min-width: 0;
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
                width: 1.375rem;
                height: 1.375rem;
                min-width: 1.375rem;
                margin-left: 0;
                border-radius: 9999px;
                display: inline-flex;
                align-items: center;
                justify-content: center;
                font-size: 0;
                margin-top: 0.125rem;
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
                content: '✓'; font-size: 0.6875rem; font-weight: bold;
              }
              .seo-report .status-icon.icon-cancel::after {
                content: '✕'; font-size: 0.6875rem; font-weight: bold;
              }
              .seo-report .status-icon.icon-attention-alt::after {
                content: '!'; font-size: 0.8125rem; font-weight: bold;
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
                padding: 0.375rem 0.75rem;
                border-radius: 0.375rem;
                background: oklch(var(--primary) / 0.08);
                transition: all 0.15s ease;
                cursor: pointer;
                border: 1px solid oklch(var(--primary) / 0.2);
              }
              .seo-report .result-action:hover {
                background: oklch(var(--primary) / 0.15);
              }

              .seo-report .how-to-fix-wrapper {
                margin-top: 0.875rem;
                padding: 1rem 1.125rem;
                background: oklch(var(--chart-3) / 0.06);
                border-radius: 0.5rem;
                border-left: 3px solid oklch(var(--chart-3));
              }

              .seo-report .analysis-test-how-to-fix {
                font-size: 0.8438rem;
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
                width: 1.0625rem;
                height: 1.0625rem;
                border-radius: 9999px;
                background: oklch(var(--muted-foreground) / 0.2);
                color: oklch(var(--muted-foreground));
                font-style: normal;
                font-size: 0.6rem;
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
                box-shadow: 0 8px 20px rgb(0 0 0 / 0.15);
              }
              .seo-report .rank-math-tooltip:hover span {
                display: block;
              }

              /* ── Inline code ─────────────────────────────────────────── */
              .seo-report code {
                background: oklch(var(--muted));
                padding: 0.2rem 0.45rem;
                border-radius: 0.3rem;
                font-size: 0.8em;
                color: oklch(var(--foreground));
                word-break: break-all;
                border: 1px solid oklch(var(--border));
                font-family: var(--font-mono, ui-monospace, 'Cascadia Code', 'Source Code Pro', Menlo, consolas, 'DejaVu Sans Mono', monospace);
              }

              .seo-report pre code,
              .seo-report pre {
                display: block;
                white-space: pre-wrap;
                word-break: break-word;
                background: oklch(var(--foreground));
                color: oklch(var(--card));
                border: none;
                border-radius: 0.5rem;
                padding: 0.875rem 1rem;
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
                border-radius: 0.5rem;
                margin-top: 0.75rem;
                border: 1px solid oklch(var(--border));
              }

              /* ── Search preview cards (desktop + mobile) ─────────────── */
              .seo-report .serp-preview {
                background: oklch(var(--card));
                border: 1px solid oklch(var(--border));
                border-radius: 0.5rem;
                padding: 1.125rem 1.25rem;
                margin-top: 0.5rem;
                max-width: 32rem;
              }
              .seo-report .serp-title {
                font-size: 1.0625rem;
                color: oklch(var(--primary));
                font-weight: 600;
                line-height: 1.4;
                margin-bottom: 0.375rem;
                font-family: var(--font-display, inherit);
              }
              .seo-report .serp-url {
                font-size: 0.8125rem;
                color: oklch(var(--chart-2));
                margin-bottom: 0.375rem;
                font-family: var(--font-mono, ui-monospace, 'Cascadia Code', 'Source Code Pro', Menlo, consolas, 'DejaVu Sans Mono', monospace);
              }
              .seo-report .serp-description {
                font-size: 0.875rem;
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
                padding: 0.625rem 1.125rem;
                background: oklch(var(--primary));
                color: oklch(var(--primary-foreground));
                border-radius: 0.375rem;
                font-size: 0.875rem;
                font-weight: 600;
                text-decoration: none;
                transition: all 0.15s ease;
              }
              .seo-report .analysis-cta a:hover {
                opacity: 0.9;
              }

              .seo-report .clear {
                clear: both;
              }

              /* ── Responsive: stack the two-column rows on small screens ── */
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
                  padding: 0.875rem 1.25rem;
                  font-size: 0.875rem;
                }
                .seo-report .table-row {
                  grid-template-columns: 1fr;
                  gap: 0.5rem;
                  padding: 1.125rem 1.25rem;
                }
                .seo-report .row-title,
                .seo-report .row-description {
                  grid-column: 1;
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
                  padding: 0.75rem 1rem;
                }
              }
            `}
          </style>

          <div className="seo-report" ref={contentRef}>
            {parse(seoHtml)}
          </div>
        </div>
      )}
    </div>
  );
}
