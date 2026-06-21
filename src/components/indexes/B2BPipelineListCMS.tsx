"use client";
import AppButton from "@/components/buttons/AppButton";
import PageHeaderCMS from "@/components/titles/PageHeaderCMS";
import { getRupiahCurrency, getShortRupiahCurrency } from "@/lib/currency";
import { setSessionToken, trpc } from "@/trpc/client";
import type {
  B2BProbabilityStatusEnum,
  B2BProductEnum,
  B2BStageEnum,
} from "@/lib/app-types";
import {
  Building2,
  EllipsisVertical,
  KanbanSquare,
  ListFilter,
  PlusCircle,
  Scale,
  Search,
  Settings2,
  Trash2,
  Trophy,
  Wallet,
} from "lucide-react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import React, { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import AppScorecardDashboard from "../cards/AppScorecardDashboard";
import AppDropdown from "../elements/AppDropdown";
import AppDropdownItemList from "../elements/AppDropdownItemList";
import AppInput from "../fields/AppInput";
import CreateLeadsPipelineFormCMS from "../forms/CreateLeadsPipelineFormCMS";
import EditLeadsPipelineFormCMS from "../forms/EditLeadsPipelineFormCMS";
import B2BProbabilityStatusLabelCMS from "../labels/B2BProbabilityStatusLabelCMS";
import B2BStageLabelCMS from "../labels/B2BStageLabelCMS";
import FilterLabelCMS from "../labels/FilterLabelCMS";
import AppAlertConfirmDialog from "../modals/AppAlertConfirmDialog";
import FilterB2BPipeline, {
  B2B_FILTER_CONFIGS,
  EMPTY_B2B_FILTERS,
  getB2BFilterLabel,
  type B2BFilterKey,
  type B2BPipelineFilters,
} from "../modals/FilterB2BPipeline";
import AppNumberPagination from "../navigations/AppNumberPagination";
import PageContainerCMS from "../pages/PageContainerCMS";
import AppErrorComponents from "../states/AppErrorComponents";
import AppLoadingComponents from "../states/AppLoadingComponents";
import TableBodyCMS from "../tables/TableBodyCMS";
import TableCellCMS from "../tables/TableCellCMS";
import TableHeadCMS from "../tables/TableHeadCMS";
import TableHeaderCMS from "../tables/TableHeaderCMS";
import TableRowCMS from "../tables/TableRowCMS";
import Link from "next/link";

interface B2BPipelineListCMSProps {
  sessionToken: string;
}

export default function B2BPipelineListCMS(props: B2BPipelineListCMSProps) {
  const router = useRouter();
  const utils = trpc.useUtils();
  const pageSize = 20;
  const searchParam = useSearchParams();
  const pageParam = searchParam.get("page");
  const currentPage = Number(pageParam) || 1;

  const [keyword, setKeyword] = useState("");
  const [debouncedKeyword, setDebouncedKeyword] = useState<string | undefined>(
    ""
  );
  const [year, setYear] = useState<number | "">(2026);

  // Applied filters (empty string = not applied), mapped 1:1 to tRPC inputs.
  const [filterData, setFilterData] = useState<Record<B2BFilterKey, string>>({
    product: "",
    stage: "",
    probability_status: "",
  });
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const hasActiveFilter =
    !!debouncedKeyword ||
    year !== "" ||
    Object.values(filterData).some((v) => v !== "");

  const resetToFirstPage = () => {
    const params = new URLSearchParams(searchParam.toString());
    params.set("page", "1");
    router.push(`?${params.toString()}`);
  };

  const handleFilterChange = (key: B2BFilterKey, value: string) => {
    setFilterData((prev) => ({ ...prev, [key]: value }));
    resetToFirstPage();
  };

  const handleYearChange = (value: number | "") => {
    setYear(value);
    resetToFirstPage();
  };

  // Commit the whole filter set from the modal at once.
  const handleApplyFilters = (filters: B2BPipelineFilters) => {
    setYear(filters.year);
    setFilterData({
      product: filters.product,
      stage: filters.stage,
      probability_status: filters.probability_status,
    });
    resetToFirstPage();
  };

  const clearKeyword = () => {
    setKeyword("");
    setDebouncedKeyword(undefined);
    resetToFirstPage();
  };

  const clearAllFilters = () => {
    setKeyword("");
    setDebouncedKeyword(undefined);
    setYear(EMPTY_B2B_FILTERS.year);
    setFilterData({ product: "", stage: "", probability_status: "" });
    resetToFirstPage();
  };

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editTargetId, setEditTargetId] = useState<number | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{
    id: number;
    name: string;
  } | null>(null);

  const [actionsOpened, setActionsOpened] = useState<number | null>(null);
  const wrapperRef = useRef<Record<number, HTMLDivElement | null>>({});
  const setWrapperRef = (id: number) => (el: HTMLDivElement | null) => {
    wrapperRef.current[id] = el;
  };

  useEffect(() => {
    if (props.sessionToken) setSessionToken(props.sessionToken);
  }, [props.sessionToken]);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedKeyword(keyword.trim() === "" ? undefined : keyword);
    }, 600);
    return () => clearTimeout(handler);
  }, [keyword]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node | null;
      const clickedInsideAny = Object.values(wrapperRef.current).some(
        (el) => el && target && el.contains(target)
      );
      if (!clickedInsideAny) setActionsOpened(null);
    };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  const { data, isLoading, isError } = trpc.list.b2b.pipelines.useQuery(
    {
      page: currentPage,
      page_size: pageSize,
      keyword: debouncedKeyword,
      year: year === "" ? undefined : year,
      product: (filterData.product || undefined) as B2BProductEnum | undefined,
      stage: (filterData.stage || undefined) as B2BStageEnum | undefined,
      probability_status: (filterData.probability_status || undefined) as
        | B2BProbabilityStatusEnum
        | undefined,
    },
    { enabled: !!props.sessionToken }
  );
  const pipelineList = data?.list.map((item) => ({
    ...item,
    project_value: Number(item.project_value),
  }));

  // Scorecard progress (target Rp5 miliar)
  const SCORECARD_TARGET = 5_000_000_000;
  const pipelineValue = data?.scorecards.pipeline_value ?? 0;
  const closedWonValue = data?.scorecards.closed_won_value ?? 0;
  const weightedValue = data?.scorecards.weighted_value ?? 0;
  const pipelinePercent = Math.min(
    100,
    (pipelineValue / SCORECARD_TARGET) * 100
  );
  const closedWonPercent = Math.min(
    100,
    (closedWonValue / SCORECARD_TARGET) * 100
  );
  const weightedPercent = Math.min(
    100,
    (weightedValue / SCORECARD_TARGET) * 100
  );

  const deletePipeline = trpc.delete.b2b.pipeline.useMutation();
  const handleDelete = () => {
    if (!deleteTarget) return;
    deletePipeline.mutate(
      { id: deleteTarget.id },
      {
        onSuccess: () => {
          toast.success("Lead deleted");
          utils.list.b2b.pipelines.invalidate();
        },
        onError: (err) => {
          toast.error("Failed to delete lead", { description: `${err}` });
        },
      }
    );
  };

  return (
    <React.Fragment>
      <PageContainerCMS>
        <div className="index w-full flex flex-col gap-4">
          <PageHeaderCMS
            name="B2B Sales Pipeline"
            desc="Track and manage every lead across your B2B sales pipeline"
            icon={Building2}
          >
            <AppButton variant="tertiary" onClick={() => setIsCreateOpen(true)}>
              <PlusCircle className="size-5" />
              Add Leads
            </AppButton>
          </PageHeaderCMS>

          {/* Scorecards */}
          <div className="scorecards grid grid-cols-1 sm:grid-cols-3 gap-3">
            <AppScorecardDashboard
              title="Pipeline Value"
              value={getShortRupiahCurrency(pipelineValue)}
              icon={<Wallet className="size-5 text-white" />}
              iconClassName="bg-primary"
            >
              <ScorecardProgress
                percent={pipelinePercent}
                barColor="bg-primary"
                target={SCORECARD_TARGET}
              />
            </AppScorecardDashboard>
            <AppScorecardDashboard
              title="Closed Won Value"
              value={getShortRupiahCurrency(closedWonValue)}
              icon={<Trophy className="size-5 text-white" />}
              iconClassName="bg-success-foreground"
            >
              <ScorecardProgress
                percent={closedWonPercent}
                barColor="bg-success-foreground"
                target={SCORECARD_TARGET}
              />
            </AppScorecardDashboard>
            <AppScorecardDashboard
              title="Weighted Value"
              value={getShortRupiahCurrency(weightedValue)}
              icon={<Scale className="size-5 text-white" />}
              iconClassName="bg-warning-foreground"
            >
              <ScorecardProgress
                percent={weightedPercent}
                barColor="bg-warning-foreground"
                target={SCORECARD_TARGET}
              />
            </AppScorecardDashboard>
          </div>

          <div className="filter-search flex w-full items-center gap-3">
            <div className="max-w-96 w-full">
              <AppInput
                variant="CMS"
                inputId="search-b2b-pipeline"
                inputType="search"
                inputIcon={<Search className="size-5" />}
                inputPlaceholder="Search company, PIC, or email..."
                value={keyword}
                onInputChange={(value) => {
                  setKeyword(value);
                  resetToFirstPage();
                }}
              />
            </div>
            <div className="filter-button relative flex w-fit">
              <AppButton
                variant="neutral"
                size="icon"
                onClick={() => setIsFilterOpen(true)}
              >
                <ListFilter className="size-4 text-emphasis" />
              </AppButton>
              {hasActiveFilter && (
                <div className="filter-indikator absolute size-2.5 bg-primary outline-3 outline-primary-soft top-0 right-0 rounded-full" />
              )}
            </div>
          </div>

          {hasActiveFilter && (
            <div className="applied-filter flex flex-wrap w-full items-center gap-2">
              <p className="text-sm text-emphasis font-medium">
                Active filters:
              </p>
              {debouncedKeyword && (
                <FilterLabelCMS
                  filterName={`Search: ${debouncedKeyword}`}
                  removeFilter={clearKeyword}
                />
              )}
              {year !== "" && (
                <FilterLabelCMS
                  filterName={`Year: ${year}`}
                  removeFilter={() => handleYearChange("")}
                />
              )}
              {B2B_FILTER_CONFIGS.filter(
                (config) => filterData[config.key]
              ).map((config) => (
                <FilterLabelCMS
                  key={config.key}
                  filterName={`${config.label}: ${getB2BFilterLabel(
                    config.key,
                    filterData[config.key]
                  )}`}
                  removeFilter={() => handleFilterChange(config.key, "")}
                />
              ))}
              <button
                type="button"
                className="text-sm font-medium text-destructive hover:underline hover:underline-offset-2 transition-all hover:cursor-pointer active:scale-95"
                onClick={clearAllFilters}
              >
                Clear all
              </button>
            </div>
          )}

          {isLoading && <AppLoadingComponents />}
          {isError && <AppErrorComponents />}

          {pipelineList && !isLoading && !isError && (
            <table className="relative w-full rounded-sm">
              <TableHeaderCMS>
                <TableRowCMS>
                  <TableHeadCMS>{`No.`}</TableHeadCMS>
                  <TableHeadCMS>{`Company`}</TableHeadCMS>
                  <TableHeadCMS>{`Industry`}</TableHeadCMS>
                  <TableHeadCMS>{`Program`}</TableHeadCMS>
                  <TableHeadCMS>{`Stage`}</TableHeadCMS>
                  <TableHeadCMS>{`Status`}</TableHeadCMS>
                  <TableHeadCMS>{`Value`}</TableHeadCMS>
                  <TableHeadCMS>{`Owner`}</TableHeadCMS>
                  <TableHeadCMS>{`Action`}</TableHeadCMS>
                </TableRowCMS>
              </TableHeaderCMS>
              <TableBodyCMS>
                {pipelineList.map((post, index) => (
                  <TableRowCMS key={post.id}>
                    <TableCellCMS>
                      {(currentPage - 1) * pageSize + index + 1}
                    </TableCellCMS>
                    <TableCellCMS>
                      <Link href={`/b2b-pipeline/${post.id}`}>
                        <p className="font-semibold text-sm line-clamp-2 max-w-64 dark:text-sevenpreneur-white">
                          {post.company_name}
                        </p>
                      </Link>
                    </TableCellCMS>
                    <TableCellCMS>
                      <span className="text-sm text-emphasis line-clamp-2 max-w-40">
                        {post.industry_name}
                      </span>
                    </TableCellCMS>
                    <TableCellCMS>
                      <span className="text-sm line-clamp-2 max-w-48 dark:text-sevenpreneur-white">
                        {post.name}
                      </span>
                    </TableCellCMS>
                    <TableCellCMS>
                      <B2BStageLabelCMS variants={post.stage} />
                    </TableCellCMS>
                    <TableCellCMS>
                      <B2BProbabilityStatusLabelCMS
                        variants={post.probability_status}
                      />
                    </TableCellCMS>
                    <TableCellCMS>
                      <span className=" font-semibold text-sm whitespace-nowrap">
                        {getRupiahCurrency(post.project_value)}
                      </span>
                    </TableCellCMS>
                    <TableCellCMS>
                      <div className="flex items-center gap-2">
                        <div className="flex size-5 rounded-full shrink-0 overflow-hidden bg-card-inside-bg">
                          {post.owner_avatar && (
                            <Image
                              src={post.owner_avatar}
                              alt={post.owner_name}
                              width={20}
                              height={20}
                              className="size-full object-cover"
                            />
                          )}
                        </div>
                        <p className=" font-medium text-sm line-clamp-1 max-w-40">
                          {post.owner_name}
                        </p>
                      </div>
                    </TableCellCMS>
                    <TableCellCMS>
                      <div
                        className="actions-button flex relative"
                        ref={setWrapperRef(post.id)}
                      >
                        <AppButton
                          variant="ghost"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation();
                            setActionsOpened((prev) =>
                              prev === post.id ? null : post.id
                            );
                          }}
                        >
                          <EllipsisVertical className="size-5" />
                        </AppButton>
                        <AppDropdown
                          isOpen={actionsOpened === post.id}
                          alignDesktop="right"
                          onClose={() => setActionsOpened(null)}
                        >
                          <AppDropdownItemList
                            menuIcon={<KanbanSquare className="size-4" />}
                            menuName="View Actions"
                            onClick={() => {
                              router.push(`/admin/b2b-pipeline/${post.id}`);
                              setActionsOpened(null);
                            }}
                          />
                          <AppDropdownItemList
                            menuIcon={<Settings2 className="size-4" />}
                            menuName="Edit"
                            onClick={() => {
                              setEditTargetId(post.id);
                              setActionsOpened(null);
                            }}
                          />
                          <AppDropdownItemList
                            menuIcon={<Trash2 className="size-4" />}
                            menuName="Delete"
                            isDestructive
                            onClick={() => {
                              setDeleteTarget({ id: post.id, name: post.name });
                              setActionsOpened(null);
                            }}
                          />
                        </AppDropdown>
                      </div>
                    </TableCellCMS>
                  </TableRowCMS>
                ))}
              </TableBodyCMS>
            </table>
          )}

          {pipelineList?.length === 0 && (
            <p className="empty-state mt-2  text-center text-emphasis">
              {debouncedKeyword
                ? `Looks like there are no results for "${debouncedKeyword}"`
                : "No leads yet. Click Add Leads to create the first one."}
            </p>
          )}

          {!isLoading && !isError && (
            <div className="pagination flex flex-col w-full items-center gap-3">
              <AppNumberPagination
                currentPage={currentPage}
                totalPages={data?.metapaging.total_page ?? 1}
              />
              <p className="text-sm text-emphasis text-center  font-medium">{`Showing all ${data?.metapaging.total_data ?? 0} leads`}</p>
            </div>
          )}
        </div>
      </PageContainerCMS>

      {isCreateOpen && (
        <CreateLeadsPipelineFormCMS
          sessionToken={props.sessionToken}
          isOpen={isCreateOpen}
          onClose={() => setIsCreateOpen(false)}
        />
      )}

      {editTargetId !== null && (
        <EditLeadsPipelineFormCMS
          sessionToken={props.sessionToken}
          pipelineId={editTargetId}
          isOpen={editTargetId !== null}
          onClose={() => setEditTargetId(null)}
        />
      )}

      {deleteTarget && (
        <AppAlertConfirmDialog
          alertDialogHeader="Delete this lead?"
          alertDialogMessage={`Are you sure you want to delete "${deleteTarget.name}"? All related actions will also be removed. This cannot be undone.`}
          alertCancelLabel="Cancel"
          alertConfirmLabel="Delete"
          isOpen={!!deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onConfirm={() => {
            handleDelete();
            setDeleteTarget(null);
          }}
        />
      )}

      <FilterB2BPipeline
        isOpen={isFilterOpen}
        initialFilters={{
          year,
          product: filterData.product,
          stage: filterData.stage,
          probability_status: filterData.probability_status,
        }}
        onClose={() => setIsFilterOpen(false)}
        onApply={handleApplyFilters}
      />
    </React.Fragment>
  );
}

interface ScorecardProgressProps {
  percent: number;
  barColor: string;
  target: number;
}

function ScorecardProgress({
  percent,
  barColor,
  target,
}: ScorecardProgressProps) {
  return (
    <div className="flex flex-col gap-1">
      <div className="w-full h-1.5 rounded-full bg-card-inside-bg overflow-hidden">
        <div
          className={`h-full rounded-full ${barColor}`}
          style={{ width: `${percent}%` }}
        />
      </div>
      <p className="text-[11px]  text-emphasis">
        {percent.toFixed(1)}% dari target {getShortRupiahCurrency(target)}
      </p>
    </div>
  );
}
