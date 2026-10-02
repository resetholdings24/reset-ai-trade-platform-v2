import type { BSCEvaluationResult } from "./types";

// IMPORTANT: The FI_PARTNERS below are ILLUSTRATIVE PLACEHOLDER PROFILES, not
// real financial institutions. The BSC spec (Table 15/16) describes a real
// matching process against real FI partner criteria, but no such partnerships
// exist yet. These generic institution *types* let us build and test the
// actual matching/filtering logic honestly, without pretending any real
// lender has agreed to anything. Every match result must say so plainly.
export type FinancingType = "term_loan" | "working_capital" | "equipment_finance" | "po_finance" | "equity";

export type FIPartner = {
  id: string;
  name: string; // deliberately generic — "(Illustrative)" suffix always shown in UI
  types: FinancingType[];
  minRating: BSCEvaluationResult["rating"];
  minAmount: number;
  maxAmount: number;
  indicativeRate: string;
  indicativeTerm: string;
  sectorNote?: string;
};

const RATING_RANK: Record<BSCEvaluationResult["rating"], number> = {
  "Not Ready": 0,
  Developing: 1,
  Bankable: 2,
  Strong: 3,
};

export const FI_PARTNERS: FIPartner[] = [
  {
    id: "commercial_bank",
    name: "Commercial Bank — SME Term Loans",
    types: ["term_loan"],
    minRating: "Bankable",
    minAmount: 10_000,
    maxAmount: 250_000,
    indicativeRate: "8–14% per annum",
    indicativeTerm: "1–5 years",
  },
  {
    id: "dfi_growth",
    name: "Development Finance Institution — Growth Capital",
    types: ["term_loan", "equipment_finance"],
    minRating: "Bankable",
    minAmount: 25_000,
    maxAmount: 500_000,
    indicativeRate: "6–10% per annum (concessional)",
    indicativeTerm: "2–7 years",
    sectorNote: "Preference for manufacturing, agro-processing, and export-oriented businesses",
  },
  {
    id: "credit_union",
    name: "Credit Union Network — Working Capital",
    types: ["working_capital"],
    minRating: "Developing",
    minAmount: 5_000,
    maxAmount: 75_000,
    indicativeRate: "10–16% per annum",
    indicativeTerm: "6 months – 3 years",
  },
  {
    id: "trade_finance",
    name: "Trade & PO Finance Provider",
    types: ["po_finance"],
    minRating: "Developing",
    minAmount: 10_000,
    maxAmount: 300_000,
    indicativeRate: "70–85% of PO value advanced",
    indicativeTerm: "Matches PO fulfilment cycle, typically under 6 months",
  },
  {
    id: "impact_investor",
    name: "Impact Investor — Equity & Patient Capital",
    types: ["equity"],
    minRating: "Strong",
    minAmount: 50_000,
    maxAmount: 1_000_000,
    indicativeRate: "Equity stake or revenue share, negotiated",
    indicativeTerm: "3–7 year horizon",
    sectorNote: "Preference for high-growth, technology, and creative-industry businesses",
  },
];

const FINANCING_TYPE_KEYWORDS: Record<FinancingType, string[]> = {
  term_loan: ["term loan", "growth capital", "expansion loan", "business loan"],
  working_capital: ["working capital", "cash flow", "operating capital"],
  equipment_finance: ["equipment finance", "equipment loan", "machinery finance"],
  po_finance: ["po finance", "purchase order finance", "trade finance"],
  equity: ["equity", "investment", "investor"],
};

export function isMatchingRequest(q: string) {
  return (
    q.includes("financial matching") ||
    q.includes("find financing") ||
    q.includes("find lenders") ||
    q.includes("matching engine") ||
    q.includes("find a loan") ||
    q.includes("match me with")
  );
}

function parseFinancingType(q: string): FinancingType | null {
  for (const [type, keywords] of Object.entries(FINANCING_TYPE_KEYWORDS) as [FinancingType, string[]][]) {
    if (keywords.some((kw) => q.includes(kw))) return type;
  }
  return null;
}

function parseAmount(q: string): number | null {
  const match = q.match(/\$?\s?([\d][\d,]*)\s?(k|thousand)?/i);
  if (!match) return null;
  let amount = Number(match[1].replace(/,/g, ""));
  if (!amount) return null;
  if (match[2]) amount *= 1000;
  return amount;
}

export type MatchingOutcome =
  | { eligible: false; reason: string }
  | {
      eligible: true;
      financingType: FinancingType | null;
      amount: number | null;
      matches: FIPartner[];
    };

export function getMatches(query: string, lastResult: BSCEvaluationResult | null): MatchingOutcome {
  if (!lastResult) {
    return {
      eligible: false,
      reason:
        "You'll need to complete the 6-Domain Evaluation first — the matching engine uses your bankability rating to find suitable lenders.",
    };
  }
  if (lastResult.rating === "Not Ready") {
    return {
      eligible: false,
      reason:
        "Your current rating is \"Not Ready.\" Per the BSC certification model, the matching engine is reserved for certified businesses — work through the Bankability Pathway's intervention plan first.",
    };
  }

  const q = query.toLowerCase();
  const financingType = parseFinancingType(q);
  const amount = parseAmount(q);
  const applicantRank = RATING_RANK[lastResult.rating];

  const matches = FI_PARTNERS.filter((fi) => {
    if (RATING_RANK[fi.minRating] > applicantRank) return false;
    if (financingType && !fi.types.includes(financingType)) return false;
    if (amount != null && (amount < fi.minAmount || amount > fi.maxAmount)) return false;
    return true;
  });

  return { eligible: true, financingType, amount, matches };
}