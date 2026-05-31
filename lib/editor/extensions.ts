// The single shared Tiptap extension set.
//
// This MUST be the same list used by:
//   - the editor in the browser (Tiptap React)
//   - generateText(json, extensions) on the server (search + wipe-guard)
//   - generateHTML(json, extensions) on the server (the /tv read-only surface)
//
// Keeping one source of truth means derived text and rendered HTML always
// reflect exactly what the editor produced.
import StarterKit from "@tiptap/starter-kit";
import type { Extensions } from "@tiptap/core";

export const editorExtensions: Extensions = [
  StarterKit,
  // Add tables, task lists, mentions, etc. here — and they automatically apply
  // to search, the wipe-guard, and the TV HTML render with no other changes.
];
