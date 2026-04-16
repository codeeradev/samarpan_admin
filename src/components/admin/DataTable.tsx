import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Search } from "lucide-react";
import { useMemo, useState } from "react";

export interface Column<T> {
  key: keyof T | string;
  header: string;
  render?: (row: T) => React.ReactNode;
  className?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  isLoading?: boolean;
  searchable?: boolean;
  searchKeys?: (keyof T)[];
  emptyText?: string;
  rowKey: (row: T) => string;
  /** Optional: custom mobile card renderer per row */
  mobileCardRender?: (item: T, idx: number) => React.ReactNode;
  "data-ocid"?: string;
}

function getCellValue<T>(row: T, key: keyof T | string): React.ReactNode {
  const value = row[key as keyof T];
  if (value === null || value === undefined) return "—";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  return String(value);
}

const SKELETON_IDS = ["sk1", "sk2", "sk3", "sk4", "sk5"];

export function DataTable<T>({
  columns,
  data,
  isLoading = false,
  searchable = false,
  searchKeys = [],
  emptyText = "No records found.",
  rowKey,
  mobileCardRender,
  "data-ocid": dataOcid,
}: DataTableProps<T>) {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    if (!searchable || !search.trim()) return data;
    const q = search.toLowerCase();
    return data.filter((row) =>
      searchKeys.some((k) =>
        String(row[k] ?? "")
          .toLowerCase()
          .includes(q),
      ),
    );
  }, [data, search, searchable, searchKeys]);

  return (
    <div className="space-y-3" data-ocid={dataOcid}>
      {searchable && (
        <div className="relative w-full md:max-w-sm">
          <Search
            size={15}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <Input
            placeholder="Search…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 h-9 text-sm border-slate-200 rounded-xl w-full"
            data-ocid={
              dataOcid ? `${dataOcid}.search_input` : "table.search_input"
            }
          />
        </div>
      )}

      {/* ── Mobile card view (< md) ───────────────────────────────── */}
      <div className="md:hidden space-y-2">
        {isLoading ? (
          SKELETON_IDS.map((sk) => (
            <Card
              key={sk}
              className="shadow-card border border-slate-100 rounded-xl"
            >
              <CardContent className="p-4 space-y-2">
                <Skeleton className="h-4 w-3/4 rounded-md" />
                <Skeleton className="h-4 w-1/2 rounded-md" />
                <Skeleton className="h-4 w-2/3 rounded-md" />
              </CardContent>
            </Card>
          ))
        ) : filtered.length === 0 ? (
          <Card className="shadow-card border border-slate-100 rounded-xl">
            <CardContent className="p-8 text-center text-[#94A3B8] text-sm">
              {emptyText}
            </CardContent>
          </Card>
        ) : (
          filtered.map((row, idx) =>
            mobileCardRender ? (
              <div
                key={rowKey(row)}
                data-ocid={dataOcid ? `${dataOcid}.item.${idx + 1}` : undefined}
              >
                {mobileCardRender(row, idx)}
              </div>
            ) : (
              <Card
                key={rowKey(row)}
                className="shadow-card border border-slate-100 rounded-xl overflow-hidden"
                data-ocid={dataOcid ? `${dataOcid}.item.${idx + 1}` : undefined}
              >
                <CardContent className="p-4">
                  <dl className="space-y-2">
                    {columns.map((col) => (
                      <div
                        key={String(col.key)}
                        className="flex items-start gap-2 min-w-0"
                      >
                        <dt className="text-xs font-semibold text-[#64748B] uppercase tracking-wide w-28 flex-shrink-0 pt-0.5">
                          {col.header}
                        </dt>
                        <dd className="text-sm text-[#1E293B] flex-1 min-w-0 break-words">
                          {col.render
                            ? col.render(row)
                            : getCellValue(row, col.key)}
                        </dd>
                      </div>
                    ))}
                  </dl>
                </CardContent>
              </Card>
            ),
          )
        )}
      </div>

      {/* ── Desktop/tablet table view (≥ md) ─────────────────────── */}
      <Card className="hidden md:block shadow-card border border-slate-100 rounded-2xl overflow-hidden">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-[#F8FAFC] hover:bg-[#F8FAFC] border-b border-slate-100">
                  {columns.map((col) => (
                    <TableHead
                      key={String(col.key)}
                      className={`text-xs font-semibold text-[#64748B] uppercase tracking-wide py-3 px-4 ${col.className ?? ""}`}
                    >
                      {col.header}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  SKELETON_IDS.map((sk) => (
                    <TableRow key={sk} className="border-b border-slate-50">
                      {columns.map((col) => (
                        <TableCell key={String(col.key)} className="px-4 py-3">
                          <Skeleton className="h-4 w-3/4 rounded-md" />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : filtered.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={columns.length}
                      className="text-center py-12 text-[#94A3B8] text-sm"
                    >
                      {emptyText}
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((row, idx) => (
                    <TableRow
                      key={rowKey(row)}
                      className="border-b border-slate-50 hover:bg-[#F8FAFC] transition-colors"
                      data-ocid={
                        dataOcid ? `${dataOcid}.item.${idx + 1}` : undefined
                      }
                    >
                      {columns.map((col) => (
                        <TableCell
                          key={String(col.key)}
                          className={`px-4 py-3 text-sm text-[#1E293B] ${col.className ?? ""}`}
                        >
                          {col.render
                            ? col.render(row)
                            : getCellValue(row, col.key)}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
