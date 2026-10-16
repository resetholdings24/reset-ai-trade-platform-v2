import type { KnowledgeCard } from "./types";
import type { BusinessProfile } from "./membership";
import {
  AGREEMENTS,
  EPA,
  EPA_SECTORS,
  FINANCE,
  INTERNATIONAL,
  MARKET,
  PARISHES,
  PROCUREMENT,
  REGIONAL,
  TERRITORIES,
} from "./knowledge";

// From BSC Technical Specification v1 Section 5.5 and v2 Table 20:
//   - Library across nine categories (Templates, Guides, Legal & Compliance,
//     Market Data, Case Studies, Funding & Grants, Policy & Regulation,
//     Toolkits, Videos & Webinars) with smart search.
//   - Guest: limited previews. Basic: core library and downloads.
//
// HONESTY LINES — what is deliberately NOT here:
//   - No invented documents. The library INDEXES guidance that already exists
//     in this platform (about 60 cards), so it stays in sync automatically
//     and nothing in it is fabricated. A real downloadable document library
//     would need real authored/licensed content.
//   - "Smart search" is keyword search with light stemming — not semantic AI
//     search, which needs live AI credits. The result list says so.
//   - Case Studies and Videos & Webinars are EMPTY and shown as empty. There
//     are none, and they should not be padded with made-up examples.
//   - The Premium "AI Summariser" is not built (needs live AI).
//   - Templates are written outlines, not downloadable files.
export const RESOURCE_CATEGORIES = [
  { key: "templates", label: "Templates" },
  { key: "guides", label: "Guides" },
  { key: "legal_compliance", label: "Legal & Compliance" },
  { key: "market_data", label: "Market Data" },
  { key: "case_studies", label: "Case Studies" },
  { key: "funding_grants", label: "Funding & Grants" },
  { key: "policy_regulation", label: "Policy & Regulation" },
  { key: "toolkits", label: "Toolkits" },
  { key: "videos_webinars", label: "Videos & Webinars" },
] as const;

export type ResourceCategoryKey = (typeof RESOURCE_CATEGORIES)[number]["key"];

export type Resource = {
  id: string;
  title: string;
  category: ResourceCategoryKey;
  summary: string;
  kind: "card" | "template" | "tool";
  card?: KnowledgeCard;
  action?: string; // for kind "tool": the prompt that launches it
  searchText: string;
};

type Source = {
  name: string;
  map: Record<string, KnowledgeCard>;
  defaultCategory: ResourceCategoryKey;
  overrides?: Record<string, ResourceCategoryKey>;
};

const SOURCES: Source[] = [
  { name: "epa", map: EPA, defaultCategory: "guides" },
  { name: "epa_sectors", map: EPA_SECTORS, defaultCategory: "guides" },
  { name: "market", map: MARKET, defaultCategory: "guides" },
  { name: "procurement", map: PROCUREMENT, defaultCategory: "guides" },
  { name: "finance", map: FINANCE, defaultCategory: "funding_grants" },
  { name: "agreements", map: AGREEMENTS, defaultCategory: "policy_regulation" },
  { name: "territories", map: TERRITORIES, defaultCategory: "legal_compliance" },
  { name: "parishes", map: PARISHES, defaultCategory: "policy_regulation" },
  {
    name: "regional",
    map: REGIONAL,
    defaultCategory: "market_data",
    overrides: { regulatory: "policy_regulation", funding: "funding_grants" },
  },
  {
    name: "international",
    map: INTERNATIONAL,
    defaultCategory: "market_data",
    overrides: { funding_cycles: "funding_grants" },
  },
];

function searchTextFor(card: KnowledgeCard, extra: string[] = []): string {
  return [card.title, card.summary, ...card.points, ...(card.nextSteps ?? []), ...extra].join(" ").toLowerCase();
}

const CARD_RESOURCES: Resource[] = SOURCES.flatMap((source) =>
  Object.entries(source.map).map(([key, card]): Resource => ({
    id: `${source.name}:${key}`,
    title: card.title,
    category: source.overrides?.[key] ?? source.defaultCategory,
    summary: card.summary,
    kind: "card",
    card,
    searchText: searchTextFor(card),
  })),
);

// Written outlines (not files). Structures are generic and deliberately avoid
// country-specific legal or tax claims.
const TEMPLATE_CARDS: { id: string; card: KnowledgeCard }[] = [
  {
    id: "templates:business_plan",
    card: {
      title: "Business Plan Outline",
      summary: "A standard structure for a business plan that lenders and partners expect to see.",
      points: [
        "Executive summary — the whole plan in half a page",
        "Problem and solution — what you fix and how",
        "Target market — who buys, and how many of them there are",
        "Revenue model — how the business makes money",
        "Team — who does what, and relevant experience",
        "Operations plan — how you produce and deliver",
        "Financial projections — three years of revenue, expenses, and cash flow",
        "Funding request — how much, and what it will be used for",
      ],
      nextSteps: [
        "Use the Business Plan Builder to draft the first five sections",
        "Use the Financial Projections calculator for the projections section",
      ],
    },
  },
  {
    id: "templates:cash_flow",
    card: {
      title: "Monthly Cash Flow Tracker Outline",
      summary: "A simple month-by-month layout for seeing when cash actually comes in and goes out.",
      points: [
        "Columns: Month, Opening balance, Cash in, Cash out, Net cash flow, Closing balance",
        "Cash in: sales received (not just invoiced), other income, loan proceeds",
        "Cash out: inputs and stock, wages, rent, loan repayments, taxes and fees",
        "Closing balance becomes next month's opening balance",
        "Track actual cash movement, which can differ from profit when customers pay late",
      ],
      nextSteps: [
        "Fill in the last three months from your bank records",
        "Project the next three months to spot any month where cash runs short",
      ],
    },
  },
  {
    id: "templates:sop",
    card: {
      title: "Standard Operating Procedure (SOP) Outline",
      summary: "A one-page structure for writing down how a repeated task should be done.",
      points: [
        "Title and purpose — what the procedure achieves",
        "Scope — when it applies and when it doesn't",
        "Roles — who is responsible for each step",
        "Procedure — numbered steps in the order they happen",
        "Records and tools — what is used and what gets written down",
        "Quality check — how you confirm it was done correctly",
        "Owner and review date — who keeps it current, and when it is reviewed",
      ],
      nextSteps: [
        "Start with your three most repeated or most error-prone processes",
        "Have someone who didn't write it follow it, and fix anything unclear",
      ],
    },
  },
];

const TEMPLATE_RESOURCES: Resource[] = TEMPLATE_CARDS.map(({ id, card }) => ({
  id,
  title: card.title,
  category: "templates",
  summary: card.summary,
  kind: "template",
  card,
  searchText: searchTextFor(card, ["template", "outline", "format"]),
}));

// The platform's own interactive tools, listed as Toolkits. Each one launches
// the real tool; none is a placeholder.
const TOOLKIT_DEFS: { id: string; title: string; summary: string; action: string; keywords: string }[] = [
  {
    id: "toolkits:evaluation",
    title: "6-Domain Capability Evaluation",
    summary: "Score your business across six domains and get a bankability rating.",
    action: "6-Domain Evaluation",
    keywords: "evaluation assessment bankability score domains capability",
  },
  {
    id: "toolkits:export_readiness",
    title: "Export Readiness Assessment",
    summary: "Five questions that show how ready your business is to export.",
    action: "export readiness",
    keywords: "export readiness assessment score",
  },
  {
    id: "toolkits:risk",
    title: "Risk Monitoring Check",
    summary: "A six-category risk scorecard with scenarios and suggested mitigations.",
    action: "risk monitoring check",
    keywords: "risk monitoring cashflow credit market compliance growth",
  },
  {
    id: "toolkits:business_plan",
    title: "Business Plan Builder",
    summary: "Answer five questions to draft the core of a business plan.",
    action: "business plan",
    keywords: "business plan consulting planning",
  },
  {
    id: "toolkits:projections",
    title: "Financial Projections Calculator",
    summary: "Turn four numbers into three-year revenue, expense, and cash flow projections.",
    action: "financial projections",
    keywords: "financial projections model cash flow forecast",
  },
  {
    id: "toolkits:skill_gap",
    title: "Skill Gap Analysis",
    summary: "Find the skills to build next, based on your evaluation scores.",
    action: "skill gap analysis",
    keywords: "training skills learning courses gap hr",
  },
  {
    id: "toolkits:profile",
    title: "Business Profile",
    summary: "A four-question intake that suggests your best next step.",
    action: "business guidance",
    keywords: "profile guidance intake start onboarding",
  },
];

const TOOLKIT_RESOURCES: Resource[] = TOOLKIT_DEFS.map((t) => ({
  id: t.id,
  title: t.title,
  category: "toolkits",
  summary: t.summary,
  kind: "tool",
  action: t.action,
  searchText: `${t.title} ${t.summary} ${t.keywords}`.toLowerCase(),
}));

export const ALL_RESOURCES: Resource[] = [...CARD_RESOURCES, ...TEMPLATE_RESOURCES, ...TOOLKIT_RESOURCES];

export function getResourceById(id: string): Resource | null {
  return ALL_RESOURCES.find((r) => r.id === id) ?? null;
}

export function countByCategory(): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const c of RESOURCE_CATEGORIES) counts[c.key] = 0;
  for (const r of ALL_RESOURCES) counts[r.category] = (counts[r.category] ?? 0) + 1;
  return counts;
}

export function resourcesInCategory(category: ResourceCategoryKey): Resource[] {
  return ALL_RESOURCES.filter((r) => r.category === category).sort((a, b) => a.title.localeCompare(b.title));
}

const STOPWORDS = new Set([
  "the", "and", "for", "how", "can", "what", "about", "with", "are", "you", "tell", "show", "find",
  "search", "resources", "resource", "library", "does", "from", "that", "this", "have", "need",
]);

// Light stemming so "financing" finds "finance" and "exports" finds "export".
function stem(token: string): string {
  if (token.length >= 8) return token.slice(0, token.length - 3);
  if (token.length >= 6) return token.slice(0, token.length - 1);
  return token;
}

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((t) => t.length >= 3 && !STOPWORDS.has(t))
    .map(stem);
}

export function searchResources(query: string, limit = 8): Resource[] {
  const tokens = tokenize(query);
  if (tokens.length === 0) return [];
  return ALL_RESOURCES.map((r) => {
    const title = r.title.toLowerCase();
    const summary = r.summary.toLowerCase();
    let score = 0;
    for (const t of tokens) {
      if (title.includes(t)) score += 3;
      if (summary.includes(t)) score += 2;
      if (r.searchText.includes(t)) score += 1;
    }
    return { r, score };
  })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score || a.r.title.localeCompare(b.r.title))
    .slice(0, limit)
    .map((x) => x.r);
}

export function isResourceLibrary(q: string) {
  return q.includes("resource library") || q.includes("browse library") || q === "resources";
}

export function parseResourceSearch(q: string): string | null {
  const m = q.match(/^(?:search|find) resources?\s*(.*)$/);
  return m ? m[1].trim() : null;
}

export function parseResourceCategory(q: string): ResourceCategoryKey | null {
  const m = q.match(/^resources category (\w+)/);
  if (!m) return null;
  return RESOURCE_CATEGORIES.find((c) => c.key === m[1])?.key ?? null;
}

export function parseOpenResource(q: string): string | null {
  const m = q.match(/^open resource (\S+)/);
  return m ? m[1] : null;
}

// Contextual surfacing (spec: resources appear inside Guidance sessions).
// Maps the profile's stated challenge to a search, and returns the top few.
const CHALLENGE_QUERIES: Record<string, string> = {
  "Access to capital": "finance funding credit",
  "Market access / growth": "market access buyers tariffs",
  "Operational efficiency": "procedures operations quality",
  "Compliance / regulation": "compliance customs licensing regulation",
  "Talent / HR": "training skills hr",
};

export function suggestResourcesForProfile(profile: BusinessProfile): { id: string; title: string }[] {
  const query = CHALLENGE_QUERIES[profile.challenge];
  if (!query) return [];
  return searchResources(query, 3).map((r) => ({ id: r.id, title: r.title }));
}