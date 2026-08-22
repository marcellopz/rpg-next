import { NavLink } from "@/components/navigation/NavLink";
import { useI18n } from "@/lib/i18n/context";
import {
  CAMPAIGN_TOOL_TABS,
  type CampaignToolId,
} from "@/components/campaigns/campaign-tools";
import { cn } from "@/lib/cn";

// Tab bar for switching campaign workspace tools. Selection is URL-driven
// (?tool=) so each pane is linkable and server-rendered.
export function CampaignToolTabs({
  publicCode,
  activeTool,
  notesTab,
  selectedPageId,
}: {
  publicCode: string;
  activeTool: CampaignToolId;
  /** Preserved when switching back to Notes (?tab=my). */
  notesTab: "campaign" | "personal";
  selectedPageId: string | null;
}) {
  const { t } = useI18n();
  const basePath = `/campaigns/${publicCode}`;

  function getToolLabel(toolId: CampaignToolId): string {
    const labels: Record<CampaignToolId, string> = {
      notes: t("tools.notes"),
      inventory: t("tools.inventory"),
      map: t("tools.map"),
      resources: t("tools.resources"),
      handouts: t("tools.handouts"),
    };
    return labels[toolId];
  }

  function toolHref(toolId: CampaignToolId) {
    const params = new URLSearchParams();
    if (toolId !== "notes") params.set("tool", toolId);
    if (toolId === "notes") {
      if (notesTab === "personal") params.set("tab", "my");
      if (selectedPageId) params.set("page", selectedPageId);
    }
    const qs = params.toString();
    return qs ? `${basePath}?${qs}` : basePath;
  }

  return (
    <div
      id="campaign-tools"
      className="border-b border-gray-200 bg-white px-4 pt-3 md:px-6"
      role="tablist"
      aria-label="Campaign tools"
    >
      <div className="flex flex-wrap items-end gap-1">
        {CAMPAIGN_TOOL_TABS.map((tool) => {
          const selected = tool.id === activeTool;
          return (
            <NavLink
              key={tool.id}
              id={tool.id === "notes" ? "campaign-tool-notes" : undefined}
              href={toolHref(tool.id)}
              // This route is dynamic (cookie-based auth), so Next's default
              // prefetch only warms the loading.tsx skeleton, not the actual
              // data — explicit `true` fully prefetches each tab's RSC
              // payload as soon as the tab bar is in view, so a click lands
              // on an already-warm Router Cache entry instead of a fresh
              // server round trip.
              prefetch
              role="tab"
              aria-selected={selected}
              className={cn(
                "relative -mb-px inline-flex items-center border-b-2 px-4 py-2.5 text-sm font-medium transition",
                selected
                  ? "border-accent-600 font-semibold text-accent-700"
                  : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-800"
              )}
            >
              {getToolLabel(tool.id)}
            </NavLink>
          );
        })}
      </div>
    </div>
  );
}
