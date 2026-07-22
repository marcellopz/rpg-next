import type { JSONContent } from "@tiptap/core";
import type { NotePage, NoteTree, NoteTrees } from "@/lib/queries/notes";
import { DEMO_CAMPAIGN_CODE } from "./constants";

const DEMO_OWNER_ID = "demo-dm";
const DEMO_UPDATED_AT = "2026-01-01T09:00:00.000Z";

function paragraph(text: string): JSONContent {
  return { type: "paragraph", content: [{ type: "text", text }] };
}

function heading(level: 1 | 2 | 3, text: string): JSONContent {
  return {
    type: "heading",
    attrs: { level },
    content: [{ type: "text", text }],
  };
}

function bulletList(items: string[]): JSONContent {
  return {
    type: "bulletList",
    content: items.map((text) => ({
      type: "listItem",
      content: [paragraph(text)],
    })),
  };
}

function doc(...content: JSONContent[]): JSONContent {
  return { type: "doc", content };
}

const overviewPage: NotePage = {
  id: "demo-page-overview",
  campaignId: DEMO_CAMPAIGN_CODE,
  categoryId: null,
  title: "Campaign Overview",
  contentJson: doc(
    heading(1, "Shadows of Eldermoor"),
    paragraph(
      "A creeping blight swallows the northern holds. Something old has woken beneath Eldermoor, and it is spreading."
    ),
    paragraph(
      "The party has been hired by the Eldermoor Council to find the source of the blight before the next harvest fails entirely."
    )
  ),
  visibility: "public",
  ownerId: DEMO_OWNER_ID,
  updatedAt: DEMO_UPDATED_AT,
};

const blightPage: NotePage = {
  id: "demo-page-blight",
  campaignId: DEMO_CAMPAIGN_CODE,
  categoryId: "demo-cat-handbook",
  title: "The Blight",
  contentJson: doc(
    heading(2, "The Blight"),
    paragraph(
      "A creeping grey rot has spread from the Fenwood into three of the northern holds. Crops wither, livestock sicken, and at night something moves between the dead trees."
    ),
    heading(3, "Known facts"),
    bulletList([
      "The blight moves roughly a mile per week, always northeast.",
      "Blighted wood burns with a cold blue flame.",
      "Livestock die quietly — no signs of struggle.",
      "The old Fenwood shrine has not answered a scrying attempt in six months.",
    ])
  ),
  visibility: "public",
  ownerId: DEMO_OWNER_ID,
  updatedAt: DEMO_UPDATED_AT,
};

const rosterPage: NotePage = {
  id: "demo-page-roster",
  campaignId: DEMO_CAMPAIGN_CODE,
  categoryId: "demo-cat-handbook",
  title: "Party Roster",
  contentJson: doc(
    heading(2, "Party Roster"),
    bulletList([
      "Mara — human paladin, sworn to the Eldermoor Council.",
      "Dex — halfling rogue, knows the Fenwood better than anyone alive.",
      "Wren — elf wizard, the only one who can still read the shrine's wards.",
      "Tobi — dwarf cleric, keeping the party breathing.",
    ])
  ),
  visibility: "public",
  ownerId: DEMO_OWNER_ID,
  updatedAt: DEMO_UPDATED_AT,
};

const session1Page: NotePage = {
  id: "demo-page-session1",
  campaignId: DEMO_CAMPAIGN_CODE,
  categoryId: "demo-cat-sessionlog",
  title: "Session 1 — Into the Mire",
  contentJson: doc(
    heading(2, "Session 1 — Into the Mire"),
    paragraph(
      "The party set out from Eldermoor at dawn, following the tree line where the blight first appeared. By dusk they'd found the first blighted farmstead — abandoned, cold, and wrong."
    ),
    paragraph(
      "Dex spotted tracks leading toward the old keep. The party made camp a mile short of the ruins."
    )
  ),
  visibility: "public",
  ownerId: DEMO_OWNER_ID,
  updatedAt: DEMO_UPDATED_AT,
};

const session2Page: NotePage = {
  id: "demo-page-session2",
  campaignId: DEMO_CAMPAIGN_CODE,
  categoryId: "demo-cat-sessionlog",
  title: "Session 2 — Blightfall Keep",
  contentJson: doc(
    heading(2, "Session 2 — Blightfall Keep"),
    paragraph(
      "The keep's lower hall was thick with grey rot. Wren recognized the wards on the inner door as Fenwood shrine-work — someone dragged the corruption here on purpose."
    ),
    paragraph(
      "They fought off a pair of blight-touched wolves before retreating to rest. Whatever is behind that door, it knows they're coming."
    )
  ),
  visibility: "public",
  ownerId: DEMO_OWNER_ID,
  updatedAt: DEMO_UPDATED_AT,
};

const session3Page: NotePage = {
  id: "demo-page-session3",
  campaignId: DEMO_CAMPAIGN_CODE,
  categoryId: "demo-cat-sessionlog",
  title: "Session 3 — The Warded Door",
  contentJson: doc(
    heading(2, "Session 3 — The Warded Door"),
    paragraph(
      "Wren spent the better part of the morning unpicking the shrine-wards, singed twice for the trouble. Behind the door: a spiral stair leading down, walls weeping the same grey rot as the farmsteads above."
    ),
    paragraph(
      "Tobi's prayers kept the worst of it from taking hold, but the air itself felt wrong — thick, cold, listening. Mara called the halt before anyone pushed further."
    ),
    heading(3, "Loot"),
    bulletList([
      "A shattered censer, still faintly warm.",
      "Fenwood shrine ledger, water-damaged but partly legible.",
      "12 gold pieces and a handful of blighted coins that crumble to ash in sunlight.",
    ])
  ),
  visibility: "public",
  ownerId: DEMO_OWNER_ID,
  updatedAt: DEMO_UPDATED_AT,
};

const session4Page: NotePage = {
  id: "demo-page-session4",
  campaignId: DEMO_CAMPAIGN_CODE,
  categoryId: "demo-cat-sessionlog",
  title: "Session 4 — Down the Spiral",
  contentJson: doc(
    heading(2, "Session 4 — Down the Spiral"),
    paragraph(
      "The stair went deeper than anyone expected. Three landings down, the party found the source: a cracked reliquary, still bound shut, pulsing faintly in time with something like a heartbeat."
    ),
    paragraph(
      "Two blight wolves and something larger — wearing the shape of a stag, wrong in every joint — met them at the bottom. It was close. Dex went down twice before Tobi pulled him back."
    ),
    paragraph(
      "They didn't open the reliquary. Not yet. Everyone agreed that decision needed daylight and a full night's rest first."
    )
  ),
  visibility: "public",
  ownerId: DEMO_OWNER_ID,
  updatedAt: DEMO_UPDATED_AT,
};

const session5Page: NotePage = {
  id: "demo-page-session5",
  campaignId: DEMO_CAMPAIGN_CODE,
  categoryId: "demo-cat-sessionlog",
  title: "Session 5 — What the Ledger Said",
  contentJson: doc(
    heading(2, "Session 5 — What the Ledger Said"),
    paragraph(
      "Back in Eldermoor, Wren finally translated the shrine ledger. The blight isn't a disease or a curse in the usual sense — it's a containment failure. The reliquary was built to hold something the old shrine-keepers couldn't destroy, only bind."
    ),
    paragraph(
      "The binding has been failing for years, not months. Whoever dragged the corruption to Blightfall Keep wanted it to fail faster."
    ),
    heading(3, "Open questions"),
    bulletList([
      "Who moved the reliquary from the Fenwood shrine to the keep, and when?",
      "Can the binding be repaired, or does the reliquary need to be destroyed entirely?",
      "The ledger names a 'Warden's Circle' responsible for the original binding — do any of them still live?",
    ])
  ),
  visibility: "public",
  ownerId: DEMO_OWNER_ID,
  updatedAt: DEMO_UPDATED_AT,
};

const DEMO_PAGE_LIST: NotePage[] = [
  overviewPage,
  blightPage,
  rosterPage,
  session1Page,
  session2Page,
  session3Page,
  session4Page,
  session5Page,
];

export const DEMO_PAGES: Record<string, NotePage> = Object.fromEntries(
  DEMO_PAGE_LIST.map((p) => [p.id, p])
);

const campaignTree: NoteTree = {
  categories: [
    {
      id: "demo-cat-handbook",
      name: "Player Handbook",
      pages: [
        { id: blightPage.id, title: blightPage.title, categoryId: blightPage.categoryId },
        { id: rosterPage.id, title: rosterPage.title, categoryId: rosterPage.categoryId },
      ],
    },
    {
      id: "demo-cat-sessionlog",
      name: "Session Log",
      pages: [
        { id: session1Page.id, title: session1Page.title, categoryId: session1Page.categoryId },
        { id: session2Page.id, title: session2Page.title, categoryId: session2Page.categoryId },
        { id: session3Page.id, title: session3Page.title, categoryId: session3Page.categoryId },
        { id: session4Page.id, title: session4Page.title, categoryId: session4Page.categoryId },
        { id: session5Page.id, title: session5Page.title, categoryId: session5Page.categoryId },
      ],
    },
  ],
  rootPages: [{ id: overviewPage.id, title: overviewPage.title, categoryId: null }],
};

const emptyTree: NoteTree = { categories: [], rootPages: [] };

export const DEMO_NOTE_TREES: NoteTrees = {
  campaign: campaignTree,
  personal: emptyTree,
};
