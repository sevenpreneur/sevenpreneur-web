"use client";
import AppButton from "@/components/buttons/AppButton";
import PageHeaderCMS from "@/components/titles/PageHeaderCMS";
import { LeadStatus } from "@/lib/app-types";
import { trpc } from "@/trpc/client";
import { WALeadStatus } from "@prisma/client";
import dayjs from "dayjs";
import { Download, Search, Users } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import AppInput from "../fields/AppInput";
import AppSelect from "../fields/AppSelect";
import LeadStatusLabelCMS from "../labels/LeadStatusLabelCMS";
import AppNumberPagination from "../navigations/AppNumberPagination";
import PageContainerCMS from "../pages/PageContainerCMS";
import AppErrorComponents from "../states/AppErrorComponents";
import AppLoadingComponents from "../states/AppLoadingComponents";
import TableBodyCMS from "../tables/TableBodyCMS";
import TableCellCMS from "../tables/TableCellCMS";
import TableHeadCMS from "../tables/TableHeadCMS";
import TableHeaderCMS from "../tables/TableHeaderCMS";
import TableRowCMS from "../tables/TableRowCMS";

interface LeadsOverviewListCMSProps {
  sessionToken: string;
}

type LeadStatusFilter = WALeadStatus | "ALL";

const leadStatusLabel: Record<LeadStatus, string> = {
  HOT: "Hot Leads",
  WARM: "Warm Leads",
  COLD: "Cold Leads",
};

export default function LeadsOverviewListCMS(props: LeadsOverviewListCMSProps) {
  const router = useRouter();

  // State for Pagination
  const pageSize = 20;
  const searchParam = useSearchParams();
  const pageParam = searchParam.get("page");
  const currentPage = Number(pageParam) || 1;

  // State for Filter Search
  const [keyword, setKeyword] = useState("");
  const [debouncedKeyword, setDebouncedKeyword] = useState("");
  const [leadStatusFilter, setLeadStatusFilter] =
    useState<LeadStatusFilter>("ALL");

  // Debounce Typing for 0.6 second
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedKeyword(keyword.trim().toLowerCase());
    }, 600);
    return () => clearTimeout(handler);
  }, [keyword]);

  // Build query input from filters
  const conversationsInput = useMemo(() => {
    const input: { lead_status?: WALeadStatus } = {};
    if (leadStatusFilter !== "ALL") input.lead_status = leadStatusFilter;
    return input;
  }, [leadStatusFilter]);

  // Fetch tRPC conversations list (server returns the full list)
  const { data, isLoading, isError } = trpc.list.wa.conversations.useQuery(
    conversationsInput,
    { enabled: !!props.sessionToken }
  );

  // Client-side keyword search over name and phone number
  const filteredList = useMemo(() => {
    const list = data?.list ?? [];
    if (!debouncedKeyword) return list;
    return list.filter((conv) => {
      const name = (conv.user_full_name || conv.full_name).toLowerCase();
      const phone = conv.phone_number.toLowerCase();
      return (
        name.includes(debouncedKeyword) || phone.includes(debouncedKeyword)
      );
    });
  }, [data, debouncedKeyword]);

  const totalData = filteredList.length;
  const totalPage = Math.max(1, Math.ceil(totalData / pageSize));
  const paginatedList = useMemo(
    () =>
      filteredList.slice((currentPage - 1) * pageSize, currentPage * pageSize),
    [filteredList, currentPage]
  );

  const leadStatusOptions = [
    { label: "Hot Leads", value: "HOT" },
    { label: "Warm Leads", value: "WARM" },
    { label: "Cold Leads", value: "COLD" },
  ];

  // Download the currently filtered leads as a CSV file
  const handleDownloadCsv = () => {
    const headers = [
      "No.",
      "Name",
      "Phone Number",
      "Lead Status",
      "Last Message",
      "Last Active",
    ];
    const escapeCell = (value: string) => `"${value.replace(/"/g, '""')}"`;
    const rows = filteredList.map((conv, index) => {
      const name = conv.user_full_name || conv.full_name;
      const status = leadStatusLabel[conv.lead_status as LeadStatus] ?? "";
      const lastMessage = conv.last_inbound_message ?? "-";
      const lastActive = conv.last_message_at
        ? dayjs(conv.last_message_at).format("D MMM YYYY HH:mm")
        : "-";
      return [
        String(index + 1),
        name,
        conv.phone_number,
        status,
        lastMessage,
        lastActive,
      ]
        .map(escapeCell)
        .join(",");
    });

    const csvContent = [headers.map(escapeCell).join(","), ...rows].join(
      "\r\n"
    );
    // Prepend BOM so Excel reads UTF-8 (correct accents/emojis) correctly.
    const blob = new Blob(["﻿" + csvContent], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `leads-overview-${dayjs().format("YYYY-MM-DD")}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <PageContainerCMS>
      <div className="index w-full flex flex-col gap-4">
        <PageHeaderCMS
          name="Leads Overview"
          desc="View all WhatsApp conversations with their lead status and last activity, and export the list to CSV."
          icon={Users}
        >
          <AppButton
            variant="tertiary"
            onClick={handleDownloadCsv}
            disabled={isLoading || isError || totalData === 0}
          >
            <Download className="size-5" />
            Download CSV
          </AppButton>
        </PageHeaderCMS>

        <div className="filter-search flex w-full items-center gap-3">
          <div className="max-w-96 w-full">
            <AppInput
              variant="CMS"
              inputId="search-lead"
              inputType="search"
              inputIcon={<Search className="size-5" />}
              inputPlaceholder="Search by name or phone number..."
              value={keyword}
              onInputChange={(value) => {
                setKeyword(value);
                const params = new URLSearchParams(searchParam.toString());
                params.set("page", "1");
                router.push(`?${params.toString()}`);
              }}
            />
          </div>
          <div className="max-w-48 w-full">
            <AppSelect
              selectId="filter-lead-status"
              selectPlaceholder="All Status"
              variant="CMS"
              value={leadStatusFilter === "ALL" ? null : leadStatusFilter}
              onChange={(value) => {
                setLeadStatusFilter((value as LeadStatusFilter) ?? "ALL");
                const params = new URLSearchParams(searchParam.toString());
                params.set("page", "1");
                router.push(`?${params.toString()}`);
              }}
              options={leadStatusOptions}
            />
          </div>
        </div>

        {/* Loading & Error State */}
        {isLoading && <AppLoadingComponents />}
        {isError && <AppErrorComponents />}

        {!isLoading && !isError && (
          <table className="table-leads relative w-full rounded-sm">
            <TableHeaderCMS>
              <TableRowCMS>
                <TableHeadCMS>No.</TableHeadCMS>
                <TableHeadCMS>Name</TableHeadCMS>
                <TableHeadCMS>Phone Number</TableHeadCMS>
                <TableHeadCMS>Lead Status</TableHeadCMS>
                <TableHeadCMS>Last Message</TableHeadCMS>
                <TableHeadCMS>Last Message at</TableHeadCMS>
              </TableRowCMS>
            </TableHeaderCMS>
            <TableBodyCMS>
              {paginatedList.map((conv, index) => (
                <TableRowCMS key={conv.id}>
                  <TableCellCMS>
                    {(currentPage - 1) * pageSize + (index + 1)}
                  </TableCellCMS>
                  <TableCellCMS>
                    <h2 className="font-bold line-clamp-1 dark:text-sevenpreneur-white">
                      {conv.user_full_name || conv.full_name}
                    </h2>
                  </TableCellCMS>
                  <TableCellCMS>
                    <span className="text-emphasis">{conv.phone_number}</span>
                  </TableCellCMS>
                  <TableCellCMS>
                    <LeadStatusLabelCMS
                      variants={conv.lead_status as LeadStatus}
                    />
                  </TableCellCMS>
                  <TableCellCMS>
                    {conv.last_inbound_message ? (
                      <div className="flex flex-col max-w-[280px]">
                        <p className="line-clamp-2 text-sm text-emphasis">
                          {conv.last_inbound_message}
                        </p>
                      </div>
                    ) : (
                      "-"
                    )}
                  </TableCellCMS>
                  <TableCellCMS>
                    {conv.last_message_at
                      ? dayjs(conv.last_message_at).format("D MMM YYYY HH:mm")
                      : "-"}
                  </TableCellCMS>
                </TableRowCMS>
              ))}
            </TableBodyCMS>
          </table>
        )}
        {!isLoading && !isError && totalData === 0 && (
          <p className="empty-state mt-2 text-center text-emphasis">
            {debouncedKeyword
              ? `Looks like there are no results for "${keyword}"`
              : "No leads found."}
          </p>
        )}
        {!isLoading && !isError && totalData > 0 && (
          <div className="pagination flex flex-col w-full items-center gap-3">
            <AppNumberPagination
              currentPage={currentPage}
              totalPages={totalPage}
            />
            <p className="text-sm text-emphasis text-center font-medium">{`Showing all ${totalData} leads`}</p>
          </div>
        )}
      </div>
    </PageContainerCMS>
  );
}
