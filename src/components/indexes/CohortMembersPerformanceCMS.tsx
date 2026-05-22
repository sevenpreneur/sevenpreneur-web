"use client";
import { Progress } from "@/components/ui/progress";
import { generateCohortCertificate } from "@/lib/generate-pdf";
import { supabase } from "@/lib/supabase";
import { trpc } from "@/trpc/client";
import { Award, Eye, Loader2, Search } from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import AppButton from "../buttons/AppButton";
import SectionContainerCMS from "../cards/SectionContainerCMS";
import AppInput from "../fields/AppInput";
import EditCohortMemberFormCMS from "../forms/EditCohortMemberFormCMS";
import BooleanLabelCMS from "../labels/BooleanLabelCMS";
import AppAlertConfirmDialog from "../modals/AppAlertConfirmDialog";
import AppNumberPagination from "../navigations/AppNumberPagination";
import AppLoadingComponents from "../states/AppLoadingComponents";
import TableBodyCMS from "../tables/TableBodyCMS";
import TableCellCMS from "../tables/TableCellCMS";
import TableHeadCMS from "../tables/TableHeadCMS";
import TableHeaderCMS from "../tables/TableHeaderCMS";
import TableRowCMS from "../tables/TableRowCMS";

const PAGE_SIZE = 10;

interface CohortMembersPerformanceCMSProps {
  sessionToken: string;
  sessionUserId: string;
  sessionUserRoleName: string;
  cohortId: number;
  cohortName: string;
}

export default function CohortMembersPerformanceCMS({
  sessionToken,
  sessionUserId,
  sessionUserRoleName,
  cohortId,
  cohortName,
}: CohortMembersPerformanceCMSProps) {
  const utils = trpc.useUtils();
  const updateCohortMember = trpc.update.cohortMember.useMutation();

  const [keyword, setKeyword] = useState("");
  const [debouncedKeyword, setDebouncedKeyword] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [openDetailsId, setOpenDetailsId] = useState<string | null>(null);
  const [isConfirmGenerateAllOpen, setIsConfirmGenerateAllOpen] =
    useState(false);
  const [isGeneratingAll, setIsGeneratingAll] = useState(false);
  const [generateProgress, setGenerateProgress] = useState({
    done: 0,
    total: 0,
  });

  const isAllowedDetails = [
    "Administrator",
    "Super Admin",
    "Educator",
    "Class Manager",
  ].includes(sessionUserRoleName);
  const isAllowedBulkGenerate = [
    "Administrator",
    "Super Admin",
    "Class Manager",
  ].includes(sessionUserRoleName);

  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedKeyword(keyword.trim());
      setCurrentPage(1);
    }, 400);
    return () => clearTimeout(t);
  }, [keyword]);

  const { data, isLoading } = trpc.list.cohortMembers.useQuery(
    { cohort_id: cohortId },
    { enabled: !!sessionToken }
  );

  const allStudents = (data?.list ?? [])
    .filter((m) => m.role_id === 3)
    .sort((a, b) => a.full_name.localeCompare(b.full_name));

  const filtered = debouncedKeyword
    ? allStudents.filter((m) =>
        m.full_name.toLowerCase().includes(debouncedKeyword.toLowerCase())
      )
    : allStudents;

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(currentPage, totalPages);
  const paged = filtered.slice(
    (safePage - 1) * PAGE_SIZE,
    safePage * PAGE_SIZE
  );

  const studentsNeedingCertificate = allStudents.filter(
    (m) => !m.certificate_url
  );

  const handleGenerateAllCertificates = async () => {
    setIsConfirmGenerateAllOpen(false);
    const targets = studentsNeedingCertificate;
    if (targets.length === 0) {
      toast.info("All General User members already have a certificate.");
      return;
    }

    setIsGeneratingAll(true);
    setGenerateProgress({ done: 0, total: targets.length });

    let successCount = 0;
    let failureCount = 0;

    for (let i = 0; i < targets.length; i++) {
      const member = targets[i];
      try {
        const pdfBlob = await generateCohortCertificate({
          fullName: member.full_name,
          cohortName: cohortName,
        });
        const slug = member.full_name
          .replace(/[^a-zA-Z0-9]+/g, "-")
          .replace(/^-+|-+$/g, "")
          .toLowerCase();
        const filePath = `certificates/${Date.now()}-${slug}.pdf`;
        const { error: uploadError } = await supabase.storage
          .from("sevenpreneur")
          .upload(filePath, pdfBlob, {
            contentType: "application/pdf",
            upsert: false,
          });
        if (uploadError) {
          throw new Error(uploadError.message);
        }
        const { data: publicUrlData } = supabase.storage
          .from("sevenpreneur")
          .getPublicUrl(filePath);
        if (!publicUrlData?.publicUrl) {
          throw new Error("Failed to resolve uploaded certificate URL");
        }
        await updateCohortMember.mutateAsync({
          user_id: member.id,
          cohort_id: cohortId,
          certificate_url: publicUrlData.publicUrl,
        });
        successCount += 1;
      } catch (error) {
        failureCount += 1;
        console.error(
          `Failed to generate certificate for ${member.full_name}:`,
          error
        );
      } finally {
        setGenerateProgress({ done: i + 1, total: targets.length });
      }
    }

    setIsGeneratingAll(false);
    utils.list.cohortMembers.invalidate();
    utils.read.cohortMember.invalidate();

    if (failureCount === 0) {
      toast.success(`Generated ${successCount} certificate(s) successfully.`);
    } else if (successCount === 0) {
      toast.error(`Failed to generate ${failureCount} certificate(s).`);
    } else {
      toast.warning(
        `Generated ${successCount} of ${targets.length} certificate(s). ${failureCount} failed.`
      );
    }
  };

  return (
    <>
      <SectionContainerCMS
        title="Student Performance"
        headerAction={
          isAllowedBulkGenerate && (
            <AppButton
              variant="neutral"
              size="small"
              onClick={() => setIsConfirmGenerateAllOpen(true)}
              disabled={
                isGeneratingAll ||
                isLoading ||
                studentsNeedingCertificate.length === 0
              }
            >
              {isGeneratingAll ? (
                <>
                  <Loader2 className="animate-spin size-4" />
                  Generating {generateProgress.done}/{generateProgress.total}
                </>
              ) : (
                <>
                  <Award className="size-4" />
                  Generate All Certificates
                  {studentsNeedingCertificate.length > 0 &&
                    ` (${studentsNeedingCertificate.length})`}
                </>
              )}
            </AppButton>
          )
        }
      >
        <div className="flex flex-col gap-3">
          <div className="w-full max-w-xs">
            <AppInput
              variant="CMS"
              inputId="search-performance"
              inputType="search"
              inputIcon={<Search className="size-4" />}
              inputPlaceholder="Search students..."
              value={keyword}
              onInputChange={setKeyword}
            />
          </div>

          {isLoading ? (
            <AppLoadingComponents />
          ) : (
            <>
              <table className="w-full relative rounded-sm">
                <TableHeaderCMS>
                  <TableRowCMS>
                    <TableHeadCMS>NO.</TableHeadCMS>
                    <TableHeadCMS>NAME</TableHeadCMS>
                    <TableHeadCMS>TIER</TableHeadCMS>
                    <TableHeadCMS>ATTENDANCE</TableHeadCMS>
                    <TableHeadCMS>SURVEY</TableHeadCMS>

                    {isAllowedDetails && <TableHeadCMS>ACTION</TableHeadCMS>}
                  </TableRowCMS>
                </TableHeaderCMS>
                <TableBodyCMS>
                  {paged.map((post, index) => (
                    <TableRowCMS key={post.id}>
                      <TableCellCMS>
                        {(safePage - 1) * PAGE_SIZE + index + 1}
                      </TableCellCMS>
                      <TableCellCMS>
                        <div className="flex items-center gap-3">
                          <div className="flex size-9 rounded-full shrink-0 overflow-hidden">
                            <Image
                              className="object-cover w-full h-full"
                              src={
                                post.avatar ||
                                "https://tskubmriuclmbcfmaiur.supabase.co/storage/v1/object/public/sevenpreneur//default-avatar.svg.png"
                              }
                              alt={post.full_name}
                              width={300}
                              height={300}
                            />
                          </div>
                          <div className="flex flex-col">
                            <p className="font-semibold font-bodycopy text-sm line-clamp-1 dark:text-sevenpreneur-white">
                              {post.full_name}
                            </p>
                            <p className="text-emphasis text-sm font-bodycopy line-clamp-1">
                              {post.email}
                            </p>
                          </div>
                        </div>
                      </TableCellCMS>
                      <TableCellCMS>{post.price_name || "-"}</TableCellCMS>
                      <TableCellCMS>
                        <div className="flex items-center gap-2 w-full min-w-[80px]">
                          <Progress
                            value={Math.round(
                              (post.attended_learning_count /
                                post.learning_count) *
                                100
                            )}
                          />
                          <p className="text-xs shrink-0">
                            {post.attended_learning_count}/{post.learning_count}
                          </p>
                        </div>
                      </TableCellCMS>
                      <TableCellCMS>
                        <BooleanLabelCMS
                          label={
                            post.has_completed_survey ? "COMPLETED" : "NOT YET"
                          }
                          value={post.has_completed_survey}
                        />
                      </TableCellCMS>
                      {isAllowedDetails && (
                        <TableCellCMS>
                          <AppButton
                            variant="neutral"
                            size="icon"
                            onClick={() => setOpenDetailsId(post.id)}
                          >
                            <Eye className="size-4" />
                          </AppButton>
                        </TableCellCMS>
                      )}
                    </TableRowCMS>
                  ))}
                </TableBodyCMS>
              </table>

              {filtered.length === 0 && (
                <p className="text-sm text-center text-emphasis font-bodycopy py-4">
                  {debouncedKeyword
                    ? `No results for "${debouncedKeyword}"`
                    : "No students enrolled yet"}
                </p>
              )}

              {totalPages > 1 && (
                <div className="flex flex-col items-center gap-2">
                  <AppNumberPagination
                    currentPage={safePage}
                    totalPages={totalPages}
                    onPageChange={setCurrentPage}
                  />
                  <p className="text-xs text-emphasis font-bodycopy">
                    Showing {paged.length} of {filtered.length} students
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </SectionContainerCMS>

      {openDetailsId && (
        <EditCohortMemberFormCMS
          sessionToken={sessionToken}
          sessionUserId={sessionUserId}
          sessionUserRoleName={sessionUserRoleName}
          userId={openDetailsId}
          cohortId={cohortId}
          isOpen={!!openDetailsId}
          onClose={() => setOpenDetailsId(null)}
        />
      )}

      <AppAlertConfirmDialog
        isOpen={isConfirmGenerateAllOpen}
        alertDialogHeader="Generate certificates for all members?"
        alertDialogMessage={`This will generate and attach a completion certificate to ${studentsNeedingCertificate.length} General User member(s) in this cohort who don't have one yet. Existing certificates will not be overwritten. This may take a while.`}
        alertCancelLabel="Cancel"
        alertConfirmLabel="Generate All"
        onClose={() => setIsConfirmGenerateAllOpen(false)}
        onConfirm={handleGenerateAllCertificates}
      />
    </>
  );
}
