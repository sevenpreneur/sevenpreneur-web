"use client";
import { Switch } from "@/components/ui/switch";
import { generateCohortCertificate } from "@/lib/generate-pdf";
import { supabase } from "@/lib/supabase";
import { trpc } from "@/trpc/client";
import { Award, Info, Loader2, Star, X } from "lucide-react";
import { FormEvent, useEffect, useState } from "react";
import { toast } from "sonner";
import AppButton from "../buttons/AppButton";
import AttendanceItemAccordionLMS from "../items/AttendanceItemAccordionLMS";
import FileItemLMS from "../items/FileItemLMS";
import SubmissionItemAccordionLMS from "../items/SubmissionItemAccordionLMS";
import UserItemCMS from "../items/UserItemCMS";
import AppSheet from "../modals/AppSheet";
import AppLoadingComponents from "../states/AppLoadingComponents";

interface EditCohortMemberFormCMSProps {
  sessionToken: string;
  sessionUserId: string;
  sessionUserRoleName: string;
  userId: string;
  cohortId: number;
  isOpen: boolean;
  onClose: () => void;
}

export default function EditCohortMemberFormCMS(
  props: EditCohortMemberFormCMSProps
) {
  const utils = trpc.useUtils();
  const updateCohortMember = trpc.update.cohortMember.useMutation();
  const setAttendance = trpc.create.attendance.useMutation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGeneratingCertificate, setIsGeneratingCertificate] = useState(false);
  const [isScout, setIsScout] = useState(false);
  const [certificateURL, setCertificateURL] = useState("");
  const [pendingAttendance, setPendingAttendance] = useState<{
    learning_id: number;
    type: "check_in" | "check_out";
  } | null>(null);

  const allowedRolesUpdateCertificate = [
    "Administrator",
    "Super Admin",
    "Class Manager",
  ];
  const isAllowedUpdateCertificate = allowedRolesUpdateCertificate.includes(
    props.sessionUserRoleName
  );

  // Return initial data
  const { data, isLoading, isError } = trpc.read.cohortMember.useQuery(
    { user_id: props.userId, cohort_id: props.cohortId },
    { enabled: !!props.sessionToken }
  );
  const memberDetails = data?.cohortMember;

  useEffect(() => {
    if (!memberDetails) return;

    setIsScout(memberDetails.is_scout);
    if (memberDetails?.certificate_url) {
      setCertificateURL(memberDetails.certificate_url);
    }
  }, [memberDetails, memberDetails?.certificate_url]);

  // Add event listener to prevent page refresh
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, []);

  if (!props.userId) return;

  const handleManualAttendance = (
    learning_id: number,
    type: "check_in" | "check_out"
  ) => {
    setPendingAttendance({ learning_id, type });
    setAttendance.mutate(
      {
        learning_id,
        user_id: props.userId,
        ...(type === "check_in" ? { check_in: true } : { check_out: true }),
      },
      {
        onSuccess: () => {
          toast.success(
            type === "check_in" ? "Checked in successfully" : "Checked out successfully"
          );
          utils.read.cohortMember.invalidate();
          utils.list.cohortMembers.invalidate();
        },
        onError: (err) => {
          toast.error("Failed to update attendance", {
            description: err.message,
          });
        },
        onSettled: () => setPendingAttendance(null),
      }
    );
  };

  const handleGenerateCertificate = async () => {
    if (!memberDetails) return;
    setIsGeneratingCertificate(true);
    try {
      const pdfBlob = await generateCohortCertificate({
        fullName: memberDetails.full_name,
        cohortName: memberDetails.cohort_name,
      });
      const slug = memberDetails.full_name
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
        toast.error("Failed to upload certificate", {
          description: uploadError.message,
        });
        return;
      }
      const { data: publicUrlData } = supabase.storage
        .from("sevenpreneur")
        .getPublicUrl(filePath);
      if (publicUrlData?.publicUrl) {
        setCertificateURL(publicUrlData.publicUrl);
        toast.success("Certificate generated", {
          description: "Click Save Changes to attach it to this member.",
        });
      }
    } catch (error) {
      toast.error("Failed to generate certificate", {
        description: error instanceof Error ? error.message : String(error),
      });
    } finally {
      setIsGeneratingCertificate(false);
    }
  };

  const handleUpdateCertificate = async (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      updateCohortMember.mutate(
        {
          // Mandatory fields
          user_id: props.userId,
          cohort_id: props.cohortId,
          is_scout: isScout,

          // Optional fields
          certificate_url: certificateURL ? certificateURL : null,
        },
        {
          onSuccess: () => {
            toast.success("Changes saved successfully");
            utils.list.cohortMembers.invalidate();
            utils.read.cohortMember.invalidate();
            props.onClose();
          },
          onError: (err) => {
            toast.error("Failed to save changes", {
              description: err.message,
            });
          },
        }
      );
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AppSheet
      sheetName="Performance Details"
      sheetDescription={`ID User: ${props.userId}`}
      isOpen={props.isOpen}
      onClose={props.onClose}
    >
      {isLoading && <AppLoadingComponents />}
      {isError && (
        <div className="flex w-full h-full items-center justify-center text-emphasis font-bodycopy">
          No Data
        </div>
      )}
      {!isLoading && !isError && memberDetails && (
        <div className="container flex flex-col h-full px-6 pb-20 gap-5 overflow-y-auto">
          <div className="user-details flex flex-col gap-2 p-3 border rounded-md">
            <h5 className="font-bodycopy font-bold text-[15px]">
              User Details
            </h5>
            <UserItemCMS
              userId={memberDetails.id}
              userName={memberDetails.full_name}
              userAvatar={
                memberDetails.avatar ||
                "https://tskubmriuclmbcfmaiur.supabase.co/storage/v1/object/public/sevenpreneur/default-avatar.svg.png"
              }
              userEmail={memberDetails.email}
              userPhoneNumber={memberDetails.phone_number || ""}
            />
          </div>
          <div className="scout-status flex items-center justify-between gap-3 p-4 border border-dashboard-border rounded-md bg-card-bg">
            <div className="flex flex-col gap-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <h5 className="font-bodycopy font-bold text-[15px]">
                  Scout Status
                </h5>
                <Info className="size-3.5 text-emphasis" />
              </div>
              <p className="text-sm text-emphasis font-bodycopy">
                Tandai apakah user ini merupakan Scout.
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Switch
                className="data-[state=checked]:bg-tertiary"
                checked={isScout}
                onCheckedChange={setIsScout}
              />
              <div className="flex items-center gap-1 text-sm font-bodycopy font-semibold">
                <Star
                  className={`size-4 ${isScout ? "fill-warning-foreground text-warning-foreground" : "text-emphasis"}`}
                />
                <span>Scout</span>
              </div>
            </div>
          </div>
          <div className="attendances flex flex-col gap-2.5">
            <h3 className="font-bold font-bodycopy">Attendances</h3>
            {memberDetails.attendances.map((post) => (
              <AttendanceItemAccordionLMS
                key={post.learning_id}
                learningSessionName={post.learning_name}
                attendanceStatus={post.status}
                attendanceCheckInAt={post.check_in_at?.toString() || ""}
                attendanceCheckOutAt={post.check_out_at?.toString() || ""}
                onManualCheckIn={() =>
                  handleManualAttendance(post.learning_id, "check_in")
                }
                onManualCheckOut={() =>
                  handleManualAttendance(post.learning_id, "check_out")
                }
                isCheckingIn={
                  pendingAttendance?.learning_id === post.learning_id &&
                  pendingAttendance?.type === "check_in"
                }
                isCheckingOut={
                  pendingAttendance?.learning_id === post.learning_id &&
                  pendingAttendance?.type === "check_out"
                }
              />
            ))}
          </div>
          <div className="projects flex flex-col gap-2.5">
            <h3 className="font-bold font-bodycopy">Task & Assignment</h3>
            {memberDetails.projects.map((post) => (
              <SubmissionItemAccordionLMS
                key={post.name}
                projectName={post.name}
                submissionStatus={post.has_submitted}
                submittedAt={post.submitted_at ?? ""}
              />
            ))}
          </div>
          {certificateURL ? (
            <div className="certificate flex flex-col gap-2 p-3 border rounded-md">
              <h3 className="font-bold font-bodycopy">Certificate</h3>
              <div className="certificate-file relative w-full text-[15px]">
                <FileItemLMS
                  fileName="Completion Certificate"
                  fileURL={certificateURL}
                />
                <div className="absolute -top-2 -right-2">
                  <AppButton
                    variant="destructiveSoft"
                    size="smallIconRounded"
                    onClick={() => setCertificateURL("")}
                  >
                    <X className="size-4" />
                  </AppButton>
                </div>
              </div>
            </div>
          ) : (
            <div className="upload-certificate flex flex-col gap-3 pt-4">
              <h3 className="font-bold font-bodycopy">Certificate</h3>
              <AppButton
                variant="tertiary"
                onClick={handleGenerateCertificate}
                disabled={isGeneratingCertificate}
                type="button"
              >
                {isGeneratingCertificate ? (
                  <Loader2 className="animate-spin size-4" />
                ) : (
                  <Award className="size-4" />
                )}
                Generate Certificate
              </AppButton>
            </div>
          )}
        </div>
      )}
      {isAllowedUpdateCertificate && (
        <div className="update-certificate sticky bottom-0 w-full p-4 bg-sb-bg border-t z-40">
          <AppButton
            className="w-full"
            variant="tertiary"
            onClick={handleUpdateCertificate}
            disabled={isSubmitting}
          >
            {isSubmitting && <Loader2 className="animate-spin size-4" />}
            Save Changes
          </AppButton>
        </div>
      )}
    </AppSheet>
  );
}
