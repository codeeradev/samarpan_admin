import { getJobRequestsApi } from "@/apiCalls/jobApplications";

import { PageHeader } from "@/components/admin/PageHeader";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

import { themeColor } from "@/lib/theme";

import { useQuery } from "@tanstack/react-query";

import { ExternalLink, Mail, Phone, Search } from "lucide-react";

import { useMemo, useState } from "react";

import DataTable, { type TableColumn } from "react-data-table-component";

import { resolveAssetUrl } from "./website-content/types";

function formatDate(value?: string) {
  if (!value) return "—";

  return new Date(value).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

const tableStyles = {
  table: {
    style: {
      backgroundColor: "transparent",
    },
  },

  headRow: {
    style: {
      minHeight: "54px",
      backgroundColor: themeColor("muted"),
    },
  },

  rows: {
    style: {
      minHeight: "76px",
      backgroundColor: themeColor("card"),
    },
  },

  cells: {
    style: {
      paddingLeft: "16px",
      paddingRight: "16px",
    },
  },
};

export default function JobApplicationsPage() {
  const [search, setSearch] = useState("");

  const { data = [], isLoading } = useQuery({
    queryKey: ["job-applications"],
    queryFn: getJobRequestsApi,
  });

  const filteredData = useMemo(() => {
    const query = search.toLowerCase();

    if (!query) return data;

    return data.filter((item: any) =>
      [
        item.fullName,
        item.email,
        item.phone,
        item.message,
        item.careerId?.title,
      ]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(query)),
    );
  }, [data, search]);

  const columns: TableColumn<any>[] = [
    {
      name: "Candidate",

      grow: 1.7,

      cell: (item) => (
        <div className="flex items-center gap-3 py-3">
          <div className="h-11 w-11 rounded-full bg-primary/10 flex items-center justify-center text-sm font-semibold text-primary">
            {item.fullName
              ?.split(" ")
              ?.map((n: string) => n[0])
              ?.join("")
              ?.slice(0, 2)
              ?.toUpperCase()}
          </div>

          <div>
            <p className="font-semibold">{item.fullName}</p>

            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Mail size={13} />
              {item.email}
            </div>

            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Phone size={13} />
              {item.phone}
            </div>
          </div>
        </div>
      ),
    },

    {
      name: "Applied For",

      grow: 1.2,

      cell: (item) => (
        <div className="py-3">
          <p className="font-medium">
            {item.careerId?.title || "Career deleted"}
          </p>

          <p className="text-xs text-muted-foreground">
            /{item.careerId?.slug}
          </p>
        </div>
      ),
    },

    {
      name: "Message",

      grow: 2,

      cell: (item) => (
        <p className="line-clamp-3 text-sm py-3">
          {item.message || "No message"}
        </p>
      ),
    },

    {
      name: "Resume",

      width: "150px",

      cell: (item) =>
        item.resume ? (
          <Button asChild size="sm" variant="outline" className="rounded-xl">
            <a
              href={resolveAssetUrl(item.resume)}
              target="_blank"
              rel="noreferrer"
            >
              <ExternalLink size={14} />
              Resume
            </a>
          </Button>
        ) : (
          <Badge variant="secondary">No Resume</Badge>
        ),
    },

    {
      name: "Applied",

      width: "130px",

      cell: (item) => (
        <span className="text-sm text-muted-foreground">
          {formatDate(item.createdAt)}
        </span>
      ),
    },

    {
      name: "Email",

      width: "120px",

      cell: (item) => (
        <Button asChild size="sm" className="rounded-xl">
          <a href={`mailto:${item.email}`}>Reply</a>
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Job Applications"
        description="Manage and review submitted job applications."
      />

      <Card className="rounded-3xl">
        <CardContent className="p-5 space-y-5">
          <div className="flex items-center justify-between gap-4">
            <div className="relative w-full max-w-sm">
              <Search
                size={15}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              />

              <Input
                placeholder="Search applications..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 rounded-xl"
              />
            </div>

            <div className="text-sm text-muted-foreground">
              {filteredData.length} application
              {filteredData.length !== 1 ? "s" : ""}
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl border">
            <DataTable
              columns={columns}
              data={filteredData}
              progressPending={isLoading}
              customStyles={tableStyles}
              pagination
              responsive
              persistTableHead
              highlightOnHover
              noDataComponent={
                <div className="py-16 text-center">
                  <p className="font-semibold">No applications found</p>

                  <p className="text-sm text-muted-foreground mt-2">
                    Job applications will appear here.
                  </p>
                </div>
              }
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
