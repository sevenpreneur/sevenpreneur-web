"use client";
import { setSessionToken, trpc } from "@/trpc/client";
import { faWhatsapp } from "@fortawesome/free-brands-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  BanknoteArrowDown,
  Building2,
  ChartColumnBig,
  CircleUserIcon,
  FlagTriangleRight,
  Globe,
  PenTool,
  Presentation,
  Tags,
} from "lucide-react";
import { useEffect } from "react";
import SevenpreneurLogo from "../svg-logos/SevenpreneurLogo";
import AppSidebar from "./AppSidebar";
import AppSidebarGroupMenu from "./AppSidebarGroupMenu";
import AppSidebarMenuItem from "./AppSidebarMenuItem";

interface SidebarCMSProps {
  sessionToken: string;
  sessionUserRoleName: string;
}

export default function SidebarCMS(props: SidebarCMSProps) {
  const allowedRolesMenuCohorts = [
    "Administrator",
    "Super Admin",
    "Educator",
    "Class Manager",
  ];
  const allowedRolesMenuEvents = [
    "Administrator",
    "Super Admin",
    "Class Manager",
  ];
  const allowedRolesMenuDiscounts = ["Administrator", "Super Admin"];
  const allowedRolesMenuUsers = [
    "Administrator",
    "Super Admin",
    "Educator",
    "Class Manager",
  ];
  const allowedRolesMenuTransactions = ["Super Admin"];
  const allowedRolesMenuB2BPipeline = ["Administrator", "Super Admin"];
  const allowedRolesMenuWebMarketing = [
    "Administrator",
    "Super Admin",
    "Marketer",
  ];
  const allowedRolesMenuArticles = ["Administrator", "Super Admin"];
  const allowedRolesMenuWhatsapp = ["Administrator", "Super Admin"];

  const isAllowedMenuCohorts = allowedRolesMenuCohorts.includes(
    props.sessionUserRoleName
  );
  const isAllowedMenuEvents = allowedRolesMenuEvents.includes(
    props.sessionUserRoleName
  );
  const isAllowedMenuDiscounts = allowedRolesMenuDiscounts.includes(
    props.sessionUserRoleName
  );
  const isAllowedMenuUsers = allowedRolesMenuUsers.includes(
    props.sessionUserRoleName
  );
  const isAllowedMenuTransactions = allowedRolesMenuTransactions.includes(
    props.sessionUserRoleName
  );
  const isAllowedMenuWebMarketing = allowedRolesMenuWebMarketing.includes(
    props.sessionUserRoleName
  );
  const isAllowedMenuArticles = allowedRolesMenuArticles.includes(
    props.sessionUserRoleName
  );
  const isAllowedMenuWhatsapp = allowedRolesMenuWhatsapp.includes(
    props.sessionUserRoleName
  );
  const isAllowedMenuB2BPipeline = allowedRolesMenuB2BPipeline.includes(
    props.sessionUserRoleName
  );

  useEffect(() => {
    if (props.sessionToken) {
      setSessionToken(props.sessionToken);
    }
  }, [props.sessionToken]);

  const { data } = trpc.auth.checkSession.useQuery(undefined, {
    enabled: !!props.sessionToken,
  });

  return (
    <AppSidebar
      logoLabel="Sevenpreneur Content Management System"
      logoLabelDisplay={
        <div className="flex items-center justify-between w-full gap-3">
          <SevenpreneurLogo className="w-3/4 max-w-[168px] h-auto shrink-0" />
          <span className="text-[11px] font-semibold whitespace-nowrap text-sb-text">
            v3.5.0
          </span>
        </div>
      }
      hideLogoIcon
      avatarSrc={data?.user.avatar ?? undefined}
      avatarName={data?.user.full_name ?? undefined}
      avatarRole={data?.user.role_name ?? undefined}
    >
      {(isAllowedMenuCohorts ||
        isAllowedMenuDiscounts ||
        isAllowedMenuEvents) && (
        <AppSidebarGroupMenu groupName="Product">
          {isAllowedMenuCohorts && (
            <AppSidebarMenuItem
              menuName="Cohorts"
              menuURL="/cohorts"
              menuIcon={<Presentation />}
            />
          )}
          {isAllowedMenuEvents && (
            <AppSidebarMenuItem
              menuName="Events"
              menuURL="/events"
              menuIcon={<FlagTriangleRight />}
            />
          )}
          {isAllowedMenuDiscounts && (
            <AppSidebarMenuItem
              menuName="Discounts"
              menuURL="/discounts"
              menuIcon={<Tags />}
            />
          )}
        </AppSidebarGroupMenu>
      )}
      {(isAllowedMenuUsers || isAllowedMenuTransactions) && (
        <AppSidebarGroupMenu groupName="Administration">
          {isAllowedMenuUsers && (
            <AppSidebarMenuItem
              menuName="Users"
              menuURL="/users"
              menuIcon={<CircleUserIcon />}
            />
          )}
          {isAllowedMenuTransactions && (
            <AppSidebarMenuItem
              menuName="Transactions"
              menuURL="/transactions"
              menuIcon={<BanknoteArrowDown />}
            />
          )}
        </AppSidebarGroupMenu>
      )}
      {(isAllowedMenuWhatsapp || isAllowedMenuB2BPipeline) && (
        <AppSidebarGroupMenu groupName="Sales">
          {isAllowedMenuWhatsapp && (
            <AppSidebarMenuItem
              menuName="Whatsapp"
              menuURL="/whatsapp"
              menuIcon={<FontAwesomeIcon icon={faWhatsapp} size="lg" />}
            />
          )}
          {isAllowedMenuWhatsapp && (
            <AppSidebarMenuItem
              menuName="Leads Overview"
              menuURL="/leads-overview"
              menuIcon={<ChartColumnBig />}
            />
          )}
          {isAllowedMenuB2BPipeline && (
            <AppSidebarMenuItem
              menuName="B2B Pipeline"
              menuURL="/b2b-pipeline"
              menuIcon={<Building2 />}
            />
          )}
        </AppSidebarGroupMenu>
      )}
      {(isAllowedMenuWebMarketing || isAllowedMenuArticles) && (
        <AppSidebarGroupMenu groupName="Marketing">
          {isAllowedMenuWebMarketing && (
            <AppSidebarMenuItem
              menuName="Web Marketing"
              menuURL="/web-marketing"
              menuIcon={<Globe />}
            />
          )}
          {isAllowedMenuArticles && (
            <AppSidebarMenuItem
              menuName="SEO Articles"
              menuURL="/articles"
              menuIcon={<PenTool />}
            />
          )}
        </AppSidebarGroupMenu>
      )}
    </AppSidebar>
  );
}
