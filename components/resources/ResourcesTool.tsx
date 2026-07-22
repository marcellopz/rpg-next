"use client";

import { useState } from "react";
import type {
  InventoryCharacterOption,
  ResourcesDashboard,
} from "@/lib/resources/types";
import { useI18n } from "@/lib/i18n/context";
import { Button, Typography } from "@/components/ui";
import { AddCardDialog } from "./AddCardDialog";
import { ResourcesDashboardGrid } from "./ResourcesDashboardGrid";
import { useResourcesRealtime } from "./useResourcesRealtime";

export function ResourcesTool({
  campaignId,
  dashboard,
  inventoryCharacters,
  readOnly,
}: {
  campaignId: string;
  dashboard: ResourcesDashboard;
  inventoryCharacters: InventoryCharacterOption[];
  readOnly?: boolean;
}) {
  const { t } = useI18n();
  const [isEditing, setIsEditing] = useState(false);
  useResourcesRealtime(campaignId);
  const editing = isEditing && !readOnly;

  const linkedCharacterIds = new Set(
    dashboard.cards
      .map((c) => c.characterId)
      .filter((id): id is string => id !== null)
  );

  return (
    <div id="resources-tool" className="flex min-h-[42rem] flex-col">
      <div
        id="resources-toolbar"
        className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 bg-gray-50 px-4 py-3 md:px-6"
      >
        <Typography variant="muted" className="text-sm">
          {editing
            ? t("resources.editingHint")
            : t("resources.usageHint")}
        </Typography>
        {!readOnly && (
          <div className="flex items-center gap-2">
            {editing && (
              <AddCardDialog
                campaignId={campaignId}
                inventoryCharacters={inventoryCharacters}
                linkedCharacterIds={linkedCharacterIds}
              />
            )}
            <Button
              type="button"
              variant={editing ? "primary" : "secondary"}
              size="sm"
              onClick={() => setIsEditing((v) => !v)}
            >
              {editing ? t("resources.done") : t("resources.edit")}
            </Button>
          </div>
        )}
      </div>

      <div className="flex-1 p-4 md:p-6">
        {dashboard.cards.length === 0 ? (
          <div className="flex h-full min-h-[32rem] flex-col items-center justify-center text-center">
            <Typography variant="h3" as="h2">
              {t("resources.empty")}
            </Typography>
            <Typography variant="muted" className="mt-2 max-w-sm leading-6">
              {t("resources.emptyDesc")}
            </Typography>
            {!readOnly && (
              <div className="mt-6">
                <AddCardDialog
                  campaignId={campaignId}
                  inventoryCharacters={inventoryCharacters}
                  linkedCharacterIds={linkedCharacterIds}
                />
              </div>
            )}
          </div>
        ) : (
          <ResourcesDashboardGrid
            campaignId={campaignId}
            cards={dashboard.cards}
            initialLayouts={dashboard.layouts}
            isEditing={editing}
            readOnly={readOnly}
          />
        )}
      </div>
    </div>
  );
}
