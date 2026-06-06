"use client";
import Link from "next/link";
import { ReactNode } from "react";

interface SidebarMenuItemMobileSVPProps {
  menuName: string;
  menuIcon: ReactNode;
  menuURL?: string;
  destructiveColor?: boolean;
  onClick: () => void;
}

export default function SidebarMenuItemMobileSVP(
  props: SidebarMenuItemMobileSVPProps
) {
  if (props.menuURL) {
    return (
      <Link href={props.menuURL} onClick={props.onClick}>
        <li
          className={`flex items-center min-w-0 font-medium text-[15px] gap-2 ${
            props.destructiveColor
              ? "text-destructive"
              : "text-[#111111] dark:text-white"
          }`}
        >
          <span className="shrink-0">{props.menuIcon}</span>
          <span className="min-w-0 line-clamp-1">{props.menuName}</span>
        </li>
      </Link>
    );
  }

  return (
    <li
      className={`flex items-center min-w-0 font-medium text-[15px] gap-2 ${
        props.destructiveColor
          ? "text-destructive"
          : "text-[#111111] dark:text-white"
      }`}
      onClick={props.onClick}
    >
      <span className="shrink-0">{props.menuIcon}</span>
      <span className="min-w-0 line-clamp-1">{props.menuName}</span>
    </li>
  );
}
