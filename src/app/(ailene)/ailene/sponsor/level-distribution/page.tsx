import AppPageState from "@/components/states/AppPageState";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Level Distribution",
};

export default function LevelDistributionPage() {
  return <AppPageState variant="DEVELOPMENT" />;
}
