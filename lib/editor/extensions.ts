import StarterKit from "@tiptap/starter-kit";
import type { Extensions } from "@tiptap/core";

// SHARED extension list — the single source of truth for the document schema.
// Used by the editor (client), and later by generateText (search, wipe-guard)
// and generateHTML (TV note rendering) on the server. Editor-only plugins
// like Placeholder do NOT belong here; add those in the editor component.
export const editorExtensions: Extensions = [
  StarterKit.configure({
    heading: {
      levels: [1, 2, 3],
    },
  }),
];
