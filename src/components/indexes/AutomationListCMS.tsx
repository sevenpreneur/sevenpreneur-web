"use client";
import AppButton from "@/components/buttons/AppButton";
import PageHeaderCMS from "@/components/titles/PageHeaderCMS";
import { setSessionToken, trpc } from "@/trpc/client";
import { Bot, PlusCircle, Search } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import React, { useEffect, useState } from "react";
import AppInput from "../fields/AppInput";
import CreateAutomationFormCMS from "../forms/CreateAutomationFormCMS";
import AutomationItemCardCMS from "../items/AutomationItemCardCMS";
import AppNumberPagination from "../navigations/AppNumberPagination";
import PageContainerCMS from "../pages/PageContainerCMS";
import AppErrorComponents from "../states/AppErrorComponents";
import AppLoadingComponents from "../states/AppLoadingComponents";

interface AutomationListCMSProps {
  sessionToken: string;
}

export default function AutomationListCMS({
  sessionToken,
}: AutomationListCMSProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isOpenCreateForm, setIsOpenCreateForm] = useState(false);

  // State for Pagination
  const pageSize = 20;
  const pageParam = searchParams.get("page");
  const currentPage = Number(pageParam) || 1;

  // State for Filter Search
  const [keyword, setKeyword] = useState("");
  const [debouncedKeyword, setDebouncedKeyword] = useState<string | undefined>(
    ""
  );

  // Debounce Typing for 600ms
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedKeyword(keyword.trim() === "" ? undefined : keyword);
    }, 600);
    return () => clearTimeout(handler);
  }, [keyword]);

  // Set token for API
  useEffect(() => {
    if (sessionToken) {
      setSessionToken(sessionToken);
    }
  }, [sessionToken]);

  // Fetch tRPC for Automation List
  const { data, isLoading, isError } = trpc.list.automations.useQuery(
    { page: currentPage, page_size: pageSize, keyword: debouncedKeyword },
    { enabled: !!sessionToken }
  );
  const automationList = data?.list;

  return (
    <React.Fragment>
      <PageContainerCMS>
        <div className="index w-full flex flex-col gap-4">
          <PageHeaderCMS
            name="Automations"
            desc="Kill switch for AI agents running on Railway"
            icon={Bot}
          >
            <AppButton
              variant="tertiary"
              onClick={() => setIsOpenCreateForm(true)}
            >
              <PlusCircle className="size-5" />
              New Automation
            </AppButton>
          </PageHeaderCMS>
          <div className="filter-search flex w-full items-center">
            <div className="max-w-96 w-full">
              <AppInput
                variant="CMS"
                inputId="search-automation"
                inputType="search"
                inputIcon={<Search className="size-5" />}
                inputPlaceholder="Search automations..."
                value={keyword}
                onInputChange={(value) => {
                  setKeyword(value);
                  const params = new URLSearchParams(searchParams.toString());
                  params.set("page", "1");
                  router.push(`?${params.toString()}`, { scroll: false });
                }}
              />
            </div>
          </div>

          {/* Conditional Rendering */}
          {isLoading && <AppLoadingComponents />}
          {isError && <AppErrorComponents />}

          {/* CARD GRID */}
          {automationList && !isLoading && !isError && (
            <div className="automation-grid grid grid-cols-1 gap-4 xl:grid-cols-2">
              {automationList.map((post) => (
                <AutomationItemCardCMS
                  key={post.id}
                  sessionToken={sessionToken}
                  automationId={post.id}
                  automationKey={post.key}
                  description={post.description}
                  tags={post.tags}
                  status={post.status}
                />
              ))}
            </div>
          )}
          {automationList?.length === 0 && (
            <p className="empty-state mt-2 text-center text-emphasis">
              {debouncedKeyword
                ? `Looks like there are no results for "${debouncedKeyword}"`
                : "No automations yet. Create one to get started."}
            </p>
          )}
          {!isLoading && !isError && (
            <div className="pagination flex flex-col w-full items-center gap-3">
              <AppNumberPagination
                currentPage={currentPage}
                totalPages={data?.metapaging.total_page ?? 1}
              />
              <p className="text-sm text-emphasis text-center font-medium">{`Showing all ${data?.metapaging.total_data} automations`}</p>
            </div>
          )}
        </div>
      </PageContainerCMS>

      {/* Open Create Form */}
      {isOpenCreateForm && (
        <CreateAutomationFormCMS
          sessionToken={sessionToken}
          isOpen={isOpenCreateForm}
          onClose={() => setIsOpenCreateForm(false)}
        />
      )}
    </React.Fragment>
  );
}
