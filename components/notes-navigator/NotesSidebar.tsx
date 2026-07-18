"use client";

import type { NoteScope } from "@/app/actions/categories";
import type { NoteTree } from "@/lib/queries/notes";
import { Typography } from "@/components/ui";
import { useI18n } from "@/lib/i18n/context";
import { NewItemForm } from "./NewItemForm";
import { NoteCategoryGroup } from "./NoteCategoryGroup";
import { NotePageRow } from "./NotePageRow";
import { NotesTabs } from "./NotesTabs";
import { RootPageDropZone } from "./RootPageDropZone";
import {
  CATEGORY_NAME_MAX,
  PAGE_TITLE_MAX,
  useNotesSidebar,
} from "./useNotesSidebar";

// The wiki navigator: Campaign notes / My notes tabs, collapsible categories,
// root-level pages, CRUD controls, and drag ordering. The behavior lives in
// useNotesSidebar; this component only composes the sidebar sections.
export function NotesSidebar({
  campaignId,
  publicCode,
  tree,
  activeTab,
  selectedPageId,
}: {
  campaignId: string;
  publicCode: string;
  tree: NoteTree;
  activeTab: NoteScope;
  selectedPageId: string | null;
}) {
  const { t } = useI18n();
  const sidebar = useNotesSidebar({
    campaignId,
    publicCode,
    tree,
    activeTab,
    selectedPageId,
  });
  const isEmpty = tree.categories.length === 0 && tree.rootPages.length === 0;

  return (
    <div className="flex h-full flex-col">
      <NotesTabs basePath={sidebar.basePath} activeTab={activeTab} />

      <div id="campaign-category-tree" className="mt-2 flex-1 space-y-1">
        {isEmpty && (
          <Typography variant="muted" className="px-3 py-2">
            {activeTab === "campaign"
              ? t("notes.noCampaignNotes")
              : t("notes.personalDesc")}
          </Typography>
        )}

        {tree.categories.map((category) => (
          <NoteCategoryGroup
            key={category.id}
            category={category}
            selectedPageId={selectedPageId}
            controller={sidebar}
          />
        ))}

        {tree.rootPages.length > 0 && (
          <div className="space-y-1">
            {tree.rootPages.map((page) => (
              <NotePageRow
                key={page.id}
                page={page}
                selected={page.id === selectedPageId}
                controller={sidebar}
              />
            ))}
          </div>
        )}

        <RootPageDropZone controller={sidebar} />
      </div>

      <div id="campaign-sidebar-actions" className="mt-5 grid gap-2">
        <NewItemForm
          label={t("notes.newCategory")}
          placeholder="Category name"
          maxLength={CATEGORY_NAME_MAX}
          onSubmit={sidebar.createRootCategory}
        />
        <NewItemForm
          label={t("notes.newPage")}
          placeholder="Page title"
          maxLength={PAGE_TITLE_MAX}
          onSubmit={sidebar.createRootPage}
        />
      </div>
    </div>
  );
}
