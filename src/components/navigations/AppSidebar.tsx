"use client";
import { useSidebar } from "@/contexts/SidebarContext";
import { useTheme } from "next-themes";
import { Moon, PanelLeftClose, Sun } from "lucide-react";
import Image from "next/image";
import { ReactNode } from "react";
import AppButton from "../buttons/AppButton";

interface AppSidebarProps {
  logoContent?: ReactNode;
  avatarSrc?: string;
  avatarName?: string;
  avatarRole?: string;
  children: ReactNode;
}

export default function AppSidebar({
  logoContent,
  avatarSrc,
  avatarName,
  avatarRole,
  children,
}: AppSidebarProps) {
  const { isCollapsed, toggleSidebar } = useSidebar();
  const { resolvedTheme, setTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const toggleTheme = () => setTheme(isDark ? "light" : "dark");

  // Global collapsed logo (square mark) — long logos are provided per sidebar.
  const squareLogoURL = isDark
    ? "https://tskubmriuclmbcfmaiur.supabase.co/storage/v1/object/public/sevenpreneur/logo-sevenpreneur-square.svg"
    : "https://tskubmriuclmbcfmaiur.supabase.co/storage/v1/object/public/sevenpreneur/logo-sevenpreneur-square-white.svg";

  return (
    <div
      className={`hidden fixed w-full h-full left-0 z-50 lg:flex lg:flex-col ${
        isCollapsed ? "max-w-16 items-center" : "max-w-64"
      }`}
    >
      <div
        className={`sb-root relative flex flex-col w-full h-full gap-0 ${
          isCollapsed ? "px-2 py-4" : "p-4"
        }`}
        style={{ borderRight: "1px solid var(--dashboard-border)" }}
      >
        {/* Collapse toggle */}
        <div
          className={`absolute -right-5 ${isCollapsed ? "top-5" : "top-6"} z-10`}
        >
          <AppButton
            size="mediumIcon"
            variant="neutral"
            onClick={toggleSidebar}
          >
            <PanelLeftClose
              className={`size-4 text-emphasis transition-all duration-300 ease-in-out ${
                isCollapsed ? "rotate-180" : ""
              }`}
            />
          </AppButton>
        </div>

        {(isCollapsed || logoContent) && (
          <div
            className={`logo-container flex items-center gap-3 shrink-0 bg-sb-avatar-bg border-b border-dashboard-border -mt-4 py-4 mb-4 ${
              isCollapsed ? "justify-center -mx-2 px-2" : "-mx-4 px-4"
            }`}
          >
            {isCollapsed ? (
              <div className="flex aspect-square w-9 shrink-0 overflow-hidden rounded-md border border-dashboard-border">
                <Image
                  className="object-cover w-full h-full"
                  src={squareLogoURL}
                  alt="Sevenpreneur"
                  width={400}
                  height={400}
                />
              </div>
            ) : (
              logoContent
            )}
          </div>
        )}

        {/* Menu */}
        <div
          className={`flex flex-col w-full gap-5 flex-1 min-h-0 overflow-hidden ${isCollapsed ? "items-center" : ""}`}
        >
          <nav
            className={`flex flex-col gap-1 flex-1 overflow-y-auto w-full [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] ${isCollapsed ? "items-center" : ""}`}
          >
            {children}
          </nav>
        </div>

        {/* Bottom: theme toggle + avatar */}
        <div
          className={`flex flex-col gap-2 pt-3 mt-3 shrink-0 w-full ${isCollapsed ? "items-center" : ""}`}
        >
          {/* Dark / Light toggle */}
          {!isCollapsed && (
            <div className="px-1">
              <button
                onClick={toggleTheme}
                className="relative flex items-center p-1 rounded-full transition-all duration-300"
                style={{ backgroundColor: "var(--sb-item-hover)" }}
                aria-label="Toggle dark mode"
              >
                {/* sliding indicator */}
                <div
                  className="absolute size-7 left-1 rounded-full transition-all duration-300 ease-in-out
                    bg-white shadow-[0_1px_4px_rgba(0,0,0,0.12)]
                    dark:translate-x-[28px] dark:bg-white/10 dark:shadow-none"
                />
                <span className="relative flex items-center justify-center size-7">
                  <Sun className="size-3.5 text-sb-text" />
                </span>
                <span className="relative flex items-center justify-center size-7">
                  <Moon className="size-3.5 text-sb-text" />
                </span>
              </button>
            </div>
          )}

          {/* Avatar badge */}
          {avatarSrc && avatarName && (
            <div
              className={`flex items-center rounded-md cursor-pointer bg-sb-avatar-bg ${
                isCollapsed
                  ? "justify-center py-2"
                  : "gap-3 p-2 border border-dashboard-border"
              }`}
            >
              <div className="flex size-8 rounded-full overflow-hidden shrink-0">
                <Image
                  className="object-cover w-full h-full"
                  src={avatarSrc}
                  alt={avatarName}
                  width={100}
                  height={100}
                />
              </div>
              {!isCollapsed && (
                <div className="flex flex-col flex-1 min-w-0">
                  <p className=" font-semibold text-[13px] text-sb-text-strong truncate">
                    {avatarName}
                  </p>
                  <p className=" text-xs text-sb-text truncate font-medium">
                    {avatarRole}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
