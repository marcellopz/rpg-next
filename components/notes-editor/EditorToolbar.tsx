"use client";

import type { Editor } from "@tiptap/react";
import {
  Bold,
  Code,
  Heading1,
  Heading2,
  Heading3,
  History,
  IndentDecrease,
  IndentIncrease,
  Italic,
  List,
  ListOrdered,
  Minus,
  Quote,
  Redo,
  Save,
  Strikethrough,
  Undo,
} from "lucide-react";
import { useI18n } from "@/lib/i18n/context";
import { Button, Chip } from "@/components/ui";
import { ToolbarButton, ToolbarDivider } from "./ToolbarButton";

export function EditorToolbar({
  editor,
  onSave,
  saveDisabled,
  saving,
  autosaveIn,
  presenceLabel,
  onOpenHistory,
}: {
  editor: Editor;
  onSave?: () => void;
  saveDisabled?: boolean;
  saving?: boolean;
  autosaveIn?: number | null;
  presenceLabel?: string | null;
  onOpenHistory?: () => void;
}) {
  const { t } = useI18n();
  const saveLabel = saving
    ? t("pageEditor.saving")
    : autosaveIn != null
      ? t("pageEditor.autosave", { count: autosaveIn })
      : saveDisabled
        ? t("pageEditor.saved")
        : t("pageEditor.saveNow");

  return (
    <div
      id="campaign-editor-formatting"
      className="flex flex-wrap items-center gap-0.5 border-b border-gray-200 bg-gray-50 px-3 py-2"
    >
      <ToolbarButton
        icon={Undo}
        label="Undo"
        disabled={!editor.can().undo()}
        onClick={() => editor.chain().focus().undo().run()}
      />
      <ToolbarButton
        icon={Redo}
        label="Redo"
        disabled={!editor.can().redo()}
        onClick={() => editor.chain().focus().redo().run()}
      />

      <ToolbarDivider />

      <ToolbarButton
        icon={Heading1}
        label="Heading 1"
        active={editor.isActive("heading", { level: 1 })}
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
      />
      <ToolbarButton
        icon={Heading2}
        label="Heading 2"
        active={editor.isActive("heading", { level: 2 })}
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
      />
      <ToolbarButton
        icon={Heading3}
        label="Heading 3"
        active={editor.isActive("heading", { level: 3 })}
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
      />

      <ToolbarDivider />

      <ToolbarButton
        icon={Bold}
        label="Bold"
        active={editor.isActive("bold")}
        onClick={() => editor.chain().focus().toggleBold().run()}
      />
      <ToolbarButton
        icon={Italic}
        label="Italic"
        active={editor.isActive("italic")}
        onClick={() => editor.chain().focus().toggleItalic().run()}
      />
      <ToolbarButton
        icon={Strikethrough}
        label="Strikethrough"
        active={editor.isActive("strike")}
        onClick={() => editor.chain().focus().toggleStrike().run()}
      />
      <ToolbarButton
        icon={Code}
        label="Inline code"
        active={editor.isActive("code")}
        onClick={() => editor.chain().focus().toggleCode().run()}
      />

      <ToolbarDivider />

      <ToolbarButton
        icon={List}
        label="Bullet list"
        active={editor.isActive("bulletList")}
        onClick={() => editor.chain().focus().toggleBulletList().run()}
      />
      <ToolbarButton
        icon={ListOrdered}
        label="Numbered list"
        active={editor.isActive("orderedList")}
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
      />
      <ToolbarButton
        icon={IndentIncrease}
        label="Indent (Tab)"
        disabled={!editor.can().sinkListItem("listItem")}
        onClick={() => editor.chain().focus().sinkListItem("listItem").run()}
      />
      <ToolbarButton
        icon={IndentDecrease}
        label="Outdent (Shift+Tab)"
        disabled={!editor.can().liftListItem("listItem")}
        onClick={() => editor.chain().focus().liftListItem("listItem").run()}
      />
      <ToolbarButton
        icon={Quote}
        label="Blockquote"
        active={editor.isActive("blockquote")}
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
      />
      <ToolbarButton
        icon={Minus}
        label="Horizontal rule"
        onClick={() => editor.chain().focus().setHorizontalRule().run()}
      />

      {/* Right side: presence + document actions. */}
      <div id="campaign-editor-actions" className="ml-auto flex items-center gap-2">
        {presenceLabel && (
          <span id="campaign-editor-presence">
            <Chip variant="accent" className="max-w-[14rem] truncate">
              {presenceLabel}
            </Chip>
          </span>
        )}
        <Button
          type="button"
          variant="secondary"
          size="xs"
          disabled={!onOpenHistory}
          onClick={onOpenHistory}
        >
          <History className="h-3.5 w-3.5" />
          {t("notes.history")}
        </Button>
        <Button
          size="xs"
          disabled={!onSave || saveDisabled || saving}
          onClick={onSave}
          title={
            autosaveIn != null
              ? "Saves automatically after 5 seconds idle — click to save now"
              : undefined
          }
        >
          <Save className="h-3.5 w-3.5" />
          {saveLabel}
        </Button>
      </div>
    </div>
  );
}
