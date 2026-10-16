import type { BSCEvaluationResult } from "./types";
import type { BusinessProfile } from "./membership";

// From BSC Technical Specification v1 Section 5.3 and v2 Table 20:
//   - AI-curated directory across nine categories (Productivity, Finance,
//     Marketing, CRM, E-commerce, AI & Automation, HR, Cybersecurity,
//     Analytics) with personalised recommendations.
//   - Guest: browse only. Basic: recommendations.
//   - Tool adoption is tracked as evidence of Technology Capability, and
//     accounting tools feed Financial Capability.
//
// HONESTY LINES — what is deliberately NOT here:
//   - No ratings, peer reviews, prices, "vetted" claims, or affiliate /
//     sponsored listings. None of those exist, so none are shown. The spec's
//     "vetted" directory and community reviews need a real curation process.
//   - Each description states only what the product does, nothing about
//     pricing, regional availability, or currency/tax support, which change
//     and are not verified here.
//   - Side-by-side comparison and integration-compatibility maps are not
//     built; they would need verified data per tool pair.
export const TOOL_CATEGORIES = [
  { key: "productivity", label: "Productivity" },
  { key: "finance", label: "Finance & Accounting" },
  { key: "marketing", label: "Marketing" },
  { key: "crm", label: "CRM & Business Suites" },
  { key: "ecommerce", label: "E-commerce" },
  { key: "ai_automation", label: "AI & Automation" },
  { key: "hr", label: "HR" },
  { key: "cybersecurity", label: "Cybersecurity" },
  { key: "analytics", label: "Analytics" },
] as const;

export type ToolCategoryKey = (typeof TOOL_CATEGORIES)[number]["key"];

export type Tool = {
  id: string;
  name: string;
  category: ToolCategoryKey;
  description: string;
};

export const TOOLS_CATALOGUE: Tool[] = [
  {
    id: "google_workspace",
    name: "Google Workspace",
    category: "productivity",
    description: "Email, calendar, documents, spreadsheets, and file storage in one cloud suite.",
  },
  {
    id: "microsoft_365",
    name: "Microsoft 365",
    category: "productivity",
    description: "Office applications, email, and cloud storage from Microsoft, offered as a subscription.",
  },
  {
    id: "quickbooks",
    name: "QuickBooks",
    category: "finance",
    description: "Cloud accounting software for bookkeeping, invoicing, and expense tracking.",
  },
  {
    id: "zoho_books",
    name: "Zoho Books",
    category: "finance",
    description: "Cloud accounting software for invoicing, expenses, and basic financial reporting.",
  },
  {
    id: "canva",
    name: "Canva",
    category: "marketing",
    description: "Design tool for social media graphics, flyers, and presentations, built around templates.",
  },
  {
    id: "mailchimp",
    name: "Mailchimp",
    category: "marketing",
    description: "Email marketing platform for newsletters and managing a customer mailing list.",
  },
  {
    id: "hubspot_crm",
    name: "HubSpot CRM",
    category: "crm",
    description: "Customer relationship management tool for tracking contacts, deals, and communications.",
  },
  {
    id: "odoo",
    name: "Odoo",
    category: "crm",
    description:
      "Modular business suite covering CRM, accounting, and operations — the ERP/CRM platform referenced in the BSC specification.",
  },
  {
    id: "shopify",
    name: "Shopify",
    category: "ecommerce",
    description: "Hosted online store platform for selling products directly to customers.",
  },
  {
    id: "woocommerce",
    name: "WooCommerce",
    category: "ecommerce",
    description: "Open-source online store plugin for WordPress websites.",
  },
  {
    id: "zapier",
    name: "Zapier",
    category: "ai_automation",
    description: "No-code tool that connects apps and automates repetitive workflows between them.",
  },
  {
    id: "make",
    name: "Make",
    category: "ai_automation",
    description: "Visual automation platform for connecting apps and building multi-step workflows.",
  },
  {
    id: "bamboohr",
    name: "BambooHR",
    category: "hr",
    description: "HR software for employee records, onboarding, and time-off tracking.",
  },
  {
    id: "zoho_people",
    name: "Zoho People",
    category: "hr",
    description: "HR management software for employee records, leave, and attendance.",
  },
  {
    id: "bitwarden",
    name: "Bitwarden",
    category: "cybersecurity",
    description: "Password manager with open-source code, for individuals and teams.",
  },
  {
    id: "1password",
    name: "1Password",
    category: "cybersecurity",
    description: "Password manager for individuals and teams, with shared vaults.",
  },
  {
    id: "google_analytics",
    name: "Google Analytics",
    category: "analytics",
    description: "Website and app traffic analytics from Google.",
  },
  {
    id: "looker_studio",
    name: "Looker Studio",
    category: "analytics",
    description: "Dashboard and reporting tool that connects to data sources such as spreadsheets and analytics.",
  },
];

export function isToolsDirectory(q: string) {
  return q.includes("tools directory") || q.includes("browse tools") || q.includes("technology tools");
}

export function parseToolsCategory(q: string): ToolCategoryKey | null {
  const m = q.match(/^tools category (\w+)/);
  if (!m) return null;
  return TOOL_CATEGORIES.find((c) => c.key === m[1])?.key ?? null;
}

export function isToolRecommendation(q: string) {
  return q.includes("recommend tools") || q.includes("tools for me");
}

export function parseAdoptTool(q: string): Tool | null {
  const m = q.match(/^adopt tool (\S+)/);
  if (!m) return null;
  return TOOLS_CATALOGUE.find((t) => t.id === m[1]) ?? null;
}

export function toolsInCategory(category: ToolCategoryKey): Tool[] {
  return TOOLS_CATALOGUE.filter((t) => t.category === category);
}

// Domain → tool category mapping. Two links are stated outright in spec Table
// 20: accounting tools feed Financial Capability, and Odoo adoption improves
// Organisational Systems (Odoo sits in the CRM & Business Suites category).
// The others are reasoned, rule-based mappings — suggestions, not findings.
const DOMAIN_TOOL_CATEGORIES: Record<string, ToolCategoryKey[]> = {
  technology: ["cybersecurity", "productivity"],
  management: ["analytics", "productivity"],
  human_resources: ["hr"],
  organisational_systems: ["crm", "ai_automation"],
  financial: ["finance"],
  market_potential: ["marketing", "ecommerce"],
};

const CHALLENGE_TOOL_CATEGORIES: Record<string, ToolCategoryKey[]> = {
  "Access to capital": ["finance"],
  "Market access / growth": ["marketing", "ecommerce"],
  "Operational efficiency": ["ai_automation", "crm", "productivity"],
  "Compliance / regulation": ["productivity", "cybersecurity"],
  "Talent / HR": ["hr"],
};

export type ToolRecOutcome =
  | { eligible: false; reason: string }
  | { eligible: true; basis: string; recs: { tool: Tool; reason: string }[] };

function addRecs(
  recs: Map<string, { tool: Tool; reasons: string[] }>,
  categories: ToolCategoryKey[],
  reason: string,
) {
  for (const category of categories) {
    for (const tool of toolsInCategory(category)) {
      const existing = recs.get(tool.id);
      if (existing) {
        if (!existing.reasons.includes(reason)) existing.reasons.push(reason);
      } else {
        recs.set(tool.id, { tool, reasons: [reason] });
      }
    }
  }
}

export function getToolRecommendations(
  lastResult: BSCEvaluationResult | null,
  profile: BusinessProfile | null,
): ToolRecOutcome {
  const recs = new Map<string, { tool: Tool; reasons: string[] }>();

  if (lastResult) {
    const weakest = lastResult.domains
      .filter((d) => d.score < 4)
      .sort((a, b) => a.score - b.score)
      .slice(0, 3);
    for (const d of weakest) {
      addRecs(recs, DOMAIN_TOOL_CATEGORIES[d.key] ?? [], `${d.name} scored ${d.score}/5`);
    }
    return {
      eligible: true,
      basis:
        weakest.length === 0
          ? "Your last 6-Domain Evaluation shows no domain below 4, so there are no gaps to target."
          : `Based on your last 6-Domain Evaluation — your ${weakest.length} weakest domain${weakest.length === 1 ? "" : "s"}, lowest first.`,
      recs: [...recs.values()].map((r) => ({ tool: r.tool, reason: r.reasons.join("; ") })),
    };
  }

  if (profile) {
    const categories = CHALLENGE_TOOL_CATEGORIES[profile.challenge];
    if (categories) {
      addRecs(recs, categories, `Your main challenge is: ${profile.challenge}`);
      return {
        eligible: true,
        basis: "Based on your business profile. Complete the 6-Domain Evaluation for recommendations tied to your actual domain scores.",
        recs: [...recs.values()].map((r) => ({ tool: r.tool, reason: r.reasons.join("; ") })),
      };
    }
  }

  return {
    eligible: false,
    reason:
      "Recommendations are built from your 6-Domain Evaluation or your business profile. Complete either one first and I'll match tools to what you actually need.",
  };
}