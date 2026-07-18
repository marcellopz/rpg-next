import { NavLink } from "@/components/navigation/NavLink";
import type { NoteScope } from "@/app/actions/categories";
import { useI18n } from "@/lib/i18n/context";
import { cn } from "@/lib/cn";

export function NotesTabs({
  basePath,
  activeTab,
}: {
  basePath: string;
  activeTab: NoteScope;
}) {
  const { t } = useI18n();
  return (
    <div
      id="campaign-notes-tabs"
      className="flex rounded-xl bg-gray-100 p-1 text-xs font-medium"
    >
      <NavLink
        href={basePath}
        className={cn(
          "flex-1 rounded-lg px-3 py-2 text-center",
          activeTab === "campaign"
            ? "bg-white text-gray-900 shadow-sm"
            : "text-gray-500 hover:text-gray-700"
        )}
      >
        {t("notes.campaign")}
      </NavLink>
      <NavLink
        href={`${basePath}?tab=my`}
        className={cn(
          "flex-1 rounded-lg px-3 py-2 text-center",
          activeTab === "personal"
            ? "bg-white text-gray-900 shadow-sm"
            : "text-gray-500 hover:text-gray-700"
        )}
      >
        {t("notes.personal")}
      </NavLink>
    </div>
  );
}
