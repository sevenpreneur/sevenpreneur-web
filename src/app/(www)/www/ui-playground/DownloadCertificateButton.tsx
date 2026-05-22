"use client";
import AppButton from "@/components/buttons/AppButton";
import { generateCohortCertificate } from "@/lib/generate-pdf";
import { useState } from "react";

export default function DownloadCertificateButton() {
  const [status, setStatus] = useState<
    "idle" | "pending" | "success" | "error"
  >("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function handleDownload() {
    setStatus("pending");
    setErrorMsg(null);
    try {
      const pdfBlob = await generateCohortCertificate({
        fullName: "Ardianto",
        cohortName: "Sevenpreneur Business Blueprint Program Batch 9",
      });
      const url = URL.createObjectURL(pdfBlob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = "cohort-certificate.pdf";
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
      URL.revokeObjectURL(url);
      setStatus("success");
    } catch (err) {
      setStatus("error");
      setErrorMsg(
        err instanceof Error ? err.message : "Failed to generate certificate."
      );
    }
  }

  return (
    <div className="flex flex-col items-center gap-3 p-6 border border-dashed border-gray-300 rounded-xl max-w-sm mx-auto">
      <p className="text-sm font-semibold text-gray-700">
        Download Cohort Certificate
      </p>
      <p className="text-xs text-gray-500 text-center">
        Hardcoded: <b>Akmal Luthfiansyah</b> /{" "}
        <b>Sevenpreneur Business Blueprint Program Batch 9</b>
      </p>

      <AppButton
        variant="primary"
        onClick={handleDownload}
        disabled={status === "pending"}
      >
        {status === "pending" ? "Generating..." : "Download PDF"}
      </AppButton>

      {status === "success" && (
        <p className="text-xs text-green-600 font-medium">PDF downloaded!</p>
      )}
      {status === "error" && (
        <p className="text-xs text-red-500 font-medium">
          {errorMsg ?? "Failed to generate certificate."}
        </p>
      )}
    </div>
  );
}
