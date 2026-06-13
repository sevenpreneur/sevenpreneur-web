import AppButton from "@/components/buttons/AppButton";
import AppBasedLabel from "@/components/labels/AppBasedLabel";
import AppPageState from "@/components/states/AppPageState";
import { Check, ChevronRight } from "lucide-react";
import DownloadCertificateButton from "./DownloadCertificateButton";
import SendTestEmailButton from "./SendTestEmailButton";

export default async function Page() {
  if (process.env.DOMAIN_MODE === "production") {
    return <AppPageState variant="NOT_FOUND" />;
  }

  return (
    <div className="flex flex-col gap-2 my-80">
      <div className="flex items-center justify-center gap-2">
        <AppButton variant="primary">Primary</AppButton>
        <AppButton variant="primary" disabled>
          Primary
        </AppButton>
        <AppButton variant="secondary">Secondary</AppButton>
        <AppButton variant="secondary" disabled>
          Secondary
        </AppButton>
        <AppButton variant="tertiary">Tertiary</AppButton>
        <AppButton variant="tertiary" disabled>
          Tertiary
        </AppButton>
        <AppButton variant="destructive">Destr</AppButton>
        <AppButton variant="destructive" disabled>
          Destr
        </AppButton>
      </div>
      <div className="flex items-center justify-center gap-2">
        <AppButton variant="primarySoft">Primary</AppButton>
        <AppButton variant="primarySoft" disabled>
          Primary
        </AppButton>
        <AppButton variant="secondarySoft">Secondary</AppButton>
        <AppButton variant="secondarySoft" disabled>
          Secondary
        </AppButton>
        <AppButton variant="destructiveSoft">Destr</AppButton>
        <AppButton variant="destructiveSoft" disabled>
          Destr
        </AppButton>
      </div>
      <div className="flex items-center justify-center gap-2">
        <AppButton variant="dark">Dark</AppButton>
        <AppButton variant="dark" disabled>
          Dark
        </AppButton>
        <AppButton variant="light">Light</AppButton>
        <AppButton variant="light" disabled>
          Light
        </AppButton>
      </div>
      <div className="flex items-center justify-center gap-2">
        <p className="">Lorem ipsum dolor sit amet</p>
      </div>

      {/* AppBasedLabel showcase */}
      <div className="flex flex-wrap items-center justify-center gap-2">
        <AppBasedLabel variant="purple">Purple</AppBasedLabel>
        <AppBasedLabel variant="yellow">Yellow</AppBasedLabel>
        <AppBasedLabel variant="blue">Blue</AppBasedLabel>
        <AppBasedLabel variant="green">Green</AppBasedLabel>
        <AppBasedLabel variant="gray">Gray</AppBasedLabel>
        <AppBasedLabel variant="pink">Pink</AppBasedLabel>
        <AppBasedLabel variant="red">Red</AppBasedLabel>
        <AppBasedLabel variant="orange">Orange</AppBasedLabel>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-2">
        <AppBasedLabel variant="green">
          <Check className="size-3" />
          Icon on the left
        </AppBasedLabel>
        <AppBasedLabel variant="blue">
          Icon on the right
          <ChevronRight className="size-3" />
        </AppBasedLabel>
      </div>
      <div className="flex items-center justify-center gap-2">
        <SendTestEmailButton />
      </div>
      <div className="flex items-center justify-center gap-2">
        <DownloadCertificateButton />
      </div>
    </div>
  );
}
