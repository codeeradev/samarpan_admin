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
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Search,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

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
  mobileCardRender?: (item: T, idx: number) => React.ReactNode;
  pageSize?: number;
  pageSizeOptions?: number[];
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
  pageSize = 10,
  pageSizeOptions = [10, 20, 50, 100],
  "data-ocid": dataOcid,
}: DataTableProps<T>) {
  const [search, setSearch] = useState("");
  const [rowsPerPage, setRowsPerPage] = useState(pageSize);
  const [currentPage, setCurrentPage] = useState(1);

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

  const totalPages = Math.ceil(filtered.length / rowsPerPage);

  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage;
    const end = start + rowsPerPage;

    return filtered.slice(start, end);
  }, [filtered, currentPage, rowsPerPage]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(1);
    }
  }, [currentPage, totalPages]);

  const startRow =
    filtered.length === 0 ? 0 : (currentPage - 1) * rowsPerPage + 1;

  const endRow = Math.min(currentPage * rowsPerPage, filtered.length);

  return (
    <div className="space-y-3" data-ocid={dataOcid}>
      {searchable && (
        <div className="relative w-full md:max-w-sm">
          <Search
            size={15}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          />

          <Input
            placeholder="Search..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            className="pl-8 h-9 text-sm border-border rounded-xl w-full"
            data-ocid={
              dataOcid ? `${dataOcid}.search_input` : "table.search_input"
            }
          />
        </div>
      )}

      {/* MOBILE */}
      <div className="md:hidden space-y-2">
        {isLoading ? (
          SKELETON_IDS.map((sk) => (
            <Card
              key={sk}
              className="shadow-card border border-border rounded-xl"
            >
              <CardContent className="p-4 space-y-2">
                <Skeleton className="h-4 w-3/4 rounded-md" />
                <Skeleton className="h-4 w-1/2 rounded-md" />
                <Skeleton className="h-4 w-2/3 rounded-md" />
              </CardContent>
            </Card>
          ))
        ) : paginatedData.length === 0 ? (
          <Card className="shadow-card border border-border rounded-xl">
            <CardContent className="p-8 text-center text-muted-foreground text-sm">
              {emptyText}
            </CardContent>
          </Card>
        ) : (
          paginatedData.map((row, idx) =>
            mobileCardRender ? (
              <div key={rowKey(row)}>
                {mobileCardRender(row, idx)}
              </div>
            ) : (
              <Card
                key={rowKey(row)}
                className="shadow-card border border-border rounded-xl overflow-hidden"
              >
                <CardContent className="p-4">
                  <dl className="space-y-2">
                    {columns.map((col) => (
                      <div
                        key={String(col.key)}
                        className="flex items-start gap-2"
                      >
                        <dt className="text-xs font-semibold text-muted-foreground uppercase tracking-wide w-28 flex-shrink-0">
                          {col.header}
                        </dt>

                        <dd className="text-sm text-foreground flex-1 break-words">
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

      {/* DESKTOP */}
      <Card className="hidden md:block shadow-card border border-border rounded-2xl overflow-hidden">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted hover:bg-muted border-b border-border">
                  {columns.map((col) => (
                    <TableHead
                      key={String(col.key)}
                      className={`text-xs font-semibold text-muted-foreground uppercase tracking-wide py-4 px-4 ${
                        col.className ?? ""
                      }`}
                    >
                      {col.header}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>

              <TableBody>
                {isLoading ? (
                  SKELETON_IDS.map((sk) => (
                    <TableRow key={sk}>
                      {columns.map((col) => (
                        <TableCell
                          key={String(col.key)}
                          className="px-4 py-4"
                        >
                          <Skeleton className="h-4 w-3/4 rounded-md" />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : paginatedData.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={columns.length}
                      className="text-center py-14 text-muted-foreground text-sm"
                    >
                      {emptyText}
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedData.map((row, idx) => (
                    <TableRow
                      key={rowKey(row)}
                      className="border-b border-border/60 hover:bg-muted/40 transition-colors"
                      data-ocid={
                        dataOcid ? `${dataOcid}.item.${idx + 1}` : undefined
                      }
                    >
                      {columns.map((col) => (
                        <TableCell
                          key={String(col.key)}
                          className={`px-4 py-4 text-sm text-foreground ${
                            col.className ?? ""
                          }`}
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

          {/* PAGINATION */}
          {!isLoading && filtered.length > 0 && (
            <div className="flex items-center justify-between px-6 py-4 border-t border-border bg-background">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>Rows per page:</span>

                <select
                  value={rowsPerPage}
                  onChange={(e) => {
                    setRowsPerPage(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="bg-transparent outline-none border-none text-foreground"
                >
                  {pageSizeOptions.map((size) => (
                    <option key={size} value={size}>
                      {size}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-6">
                <p className="text-sm text-muted-foreground">
                  {startRow}-{endRow} of {filtered.length}
                </p>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setCurrentPage(1)}
                    disabled={currentPage === 1}
                    className="h-8 w-8 flex items-center justify-center rounded-md hover:bg-muted disabled:opacity-40"
                  >
                    <ChevronsLeft size={18} />
                  </button>

                  <button
                    onClick={() =>
                      setCurrentPage((prev) => Math.max(prev - 1, 1))
                    }
                    disabled={currentPage === 1}
                    className="h-8 w-8 flex items-center justify-center rounded-md hover:bg-muted disabled:opacity-40"
                  >
                    <ChevronLeft size={18} />
                  </button>

                  <button
                    onClick={() =>
                      setCurrentPage((prev) =>
                        Math.min(prev + 1, totalPages),
                      )
                    }
                    disabled={currentPage === totalPages}
                    className="h-8 w-8 flex items-center justify-center rounded-md hover:bg-muted disabled:opacity-40"
                  >
                    <ChevronRight size={18} />
                  </button>

                  <button
                    onClick={() => setCurrentPage(totalPages)}
                    disabled={currentPage === totalPages}
                    className="h-8 w-8 flex items-center justify-center rounded-md hover:bg-muted disabled:opacity-40"
                  >
                    <ChevronsRight size={18} />
                  </button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}