"use client";
import SkillPracticeItemAILN, {
  deriveSkillPracticeStatus,
  type SkillPracticeItem,
} from "@/components/items/SkillPracticeItemAILN";
import { faLock } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { ChevronDown, GraduationCap } from "lucide-react";

interface SkillPracticeModuleAILNProps {
  level: { id: number; level_number: number; name: string };
  unlocked: boolean;
  expanded: boolean;
  onToggle: () => void;
  prompts: SkillPracticeItem[];
  useCases: SkillPracticeItem[];
}

export default function SkillPracticeModuleAILN(
  props: SkillPracticeModuleAILNProps
) {
  const total = props.prompts.length + props.useCases.length;
  const accepted =
    props.prompts.filter((p) => deriveSkillPracticeStatus(p) === "accepted")
      .length +
    props.useCases.filter((u) => deriveSkillPracticeStatus(u) === "accepted")
      .length;

  return (
    <div className="relative pl-12">
      <div
        className={`absolute top-4 left-0 flex h-8 w-8 items-center justify-center rounded-full border-2 ${
          props.unlocked
            ? "border-red-500 bg-white text-red-500 dark:bg-black dark:shadow-[0_0_12px_rgba(239,68,68,0.7)]"
            : "border-gray-300 bg-gray-100 text-gray-400 dark:border-red-500/30 dark:bg-black dark:text-red-500/40"
        }`}
      >
        {props.unlocked ? (
          <GraduationCap className="size-4 text-red-500 dark:text-red-400 dark:drop-shadow-[0_0_6px_rgba(239,68,68,0.8)]" />
        ) : (
          <FontAwesomeIcon icon={faLock} className="h-4 w-4" />
        )}
      </div>

      <div
        className={`rounded-md bg-white border border-dashboard-border dark:bg-[#0E111A]/50 dark:shadow-[0_0_18px_rgba(239,68,68,0.08)] ${
          !props.unlocked ? "opacity-60 dark:opacity-50" : ""
        }`}
      >
        <button
          type="button"
          onClick={props.onToggle}
          className="flex w-full items-center justify-between gap-4 p-4 text-left"
        >
          <div className="flex-1">
            <div className="text-xs tracking-widest uppercase text-emphasis dark:text-gray-400">
              Latihan Skill
            </div>
            <div className="text-lg font-bold dark:text-white">
              Prompt &amp; Use Case
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {props.prompts.length} prompt &middot; {props.useCases.length} use
              case
            </div>
          </div>
          <div className="flex items-center gap-3">
            {props.unlocked ? (
              <span className="rounded px-2 py-0.5 text-xs font-medium bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300 dark:border dark:border-rose-500/40">
                {accepted}/{total} Diterima
              </span>
            ) : (
              <span className="rounded bg-gray-200 px-2 py-0.5 text-xs text-gray-600 dark:bg-red-500/10 dark:text-red-300/70">
                Locked
              </span>
            )}
            <ChevronDown
              className={`h-4 w-4 text-gray-400 transition-transform duration-300 dark:text-red-300/70 ${
                props.expanded ? "rotate-180" : ""
              }`}
            />
          </div>
        </button>
        <div
          className={`grid transition-all duration-300 ease-in-out ${
            props.expanded
              ? "grid-rows-[1fr] opacity-100"
              : "grid-rows-[0fr] opacity-0"
          }`}
        >
          <div className="overflow-hidden">
            <div className="space-y-2 border-t border-dashboard-border px-4 py-3">
              {props.prompts.map((p) => (
                <SkillPracticeItemAILN
                  key={`prompt-${p.id}`}
                  variant="Prompt"
                  item={p}
                  unlocked={props.unlocked}
                />
              ))}
              {props.useCases.map((u) => (
                <SkillPracticeItemAILN
                  key={`usecase-${u.id}`}
                  variant="UseCase"
                  item={u}
                  unlocked={props.unlocked}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
