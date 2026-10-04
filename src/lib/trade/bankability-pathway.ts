import type { BSCEvaluationResult } from "./types";

// The BSC Technical Specification v2.0 names the component "FIS-RESET 5-Phase
// Bankability Pathway" but its own Table 5 ("SME Journey Through the BSC
// Platform") describes a 7-STAGE journey, not five explicitly named phases:
//   1. SME discovers BSC Platform (entry point, not really a "pathway" phase)
//   2. 6-Domain Evaluation
//   3. Bankability Pathway entry (intervention plan)
//   4. Monitoring phase
//   5. BSC Bankability Certificate
//   6. AI Financial Matching
//   7. Capital accessed (outcome, not a pathway phase)
//
// The five phases below are stages 2–6 of that table — the most defensible
// reading of "5 phases" — with stage 1 (discovery) and 7 (capital accessed)
// treated as bookends rather than pathway phases themselves. This is an
// interpretation of the spec, not a verbatim quote of a "Phase 1–5" list,
// because the source document does not provide one.
export type PathwayPhaseStatus = "complete" | "current" | "eligible" | "locked";

export type PathwayPhase = {
  key: string;
  name: string;
  description: string;
  status: PathwayPhaseStatus;
  detail?: string;
  items?: { domain: string; category: string; action: string; prompt?: string }[];
};

// Domain → intervention category mapping, drawn directly from Table 20
// ("Version 2.0 Component Enhancements") of the spec, which explicitly
// states which BSC Platform component feeds or improves each domain score:
//   - Technology Tools & Apps → Technology Capability
//   - Business Advice & Consulting + Tailored Training (leadership) → Management Capability
//   - Tailored Training Solutions → Human Resources Capability
//   - Business Advice & Consulting + ERP/CRM (Odoo adoption) → Organisational Systems
//   - Tailored Training (financial literacy) + Technology Tools (accounting) → Financial Capability
//   - Online Marketplace activity → Market Potential
const DOMAIN_INTERVENTIONS: Record<string, { category: string; action: string; prompt?: string }[]> = {
  technology: [{ category: "Technology Tools & Apps", action: "Adopt digital tools and strengthen cybersecurity practices." }],
  management: [
    {
      category: "Business Advice & Consulting",
      action: "Work with a consultant on leadership structure and governance.",
      prompt: "business plan",
    },
    { category: "Tailored Training Solutions", action: "Complete leadership training to build management capability." },
  ],
  human_resources: [{ category: "Tailored Training Solutions", action: "Invest in staff training and HR systems." }],
  organisational_systems: [
    {
      category: "Business Advice & Consulting",
      action: "Document standard operating procedures with a consultant.",
      prompt: "business plan",
    },
    { category: "ERP/CRM — Odoo", action: "Adopt Odoo to formalise organisational systems." },
  ],
  financial: [
    { category: "Tailored Training Solutions", action: "Complete financial literacy training." },
    { category: "Technology Tools & Apps", action: "Adopt accounting tools to strengthen financial record-keeping." },
  ],
  market_potential: [{ category: "Online Marketplace", action: "Build transaction history and buyer connections on the Marketplace." }],
};

export function isPathwayRequest(q: string) {
  return (
    q.includes("bankability pathway") ||
    q.includes("my pathway") ||
    q.includes("pathway status") ||
    q.includes("view my pathway")
  );
}

export function getPathwayPhases(lastResult: BSCEvaluationResult | null): PathwayPhase[] {
  const hasEvaluation = lastResult !== null;
  const isEligibleForCertificate = lastResult != null && (lastResult.rating === "Bankable" || lastResult.rating === "Strong");

  const interventionItems = lastResult
    ? lastResult.domains
        .filter((d) => d.score < 4)
        .flatMap((d) =>
          (DOMAIN_INTERVENTIONS[d.key] ?? []).map((i) => ({ domain: d.name, category: i.category, action: i.action, prompt: i.prompt })),
        )
    : [];

  return [
    {
      key: "evaluation",
      name: "Phase 1 — 6-Domain Evaluation",
      description: "Full capability evaluation across all 6 domains, producing a bankability rating.",
      status: hasEvaluation ? "complete" : "current",
      detail: hasEvaluation
        ? `Completed — ${lastResult!.overallScore}/100, rated "${lastResult!.rating}".`
        : "Not yet completed. Start the 6-Domain Evaluation to unlock the rest of the pathway.",
    },
    {
      key: "intervention",
      name: "Phase 2 — Intervention Plan",
      description: "A bespoke plan to close capability gaps — consulting, training, tools, marketplace, and partners.",
      status: !hasEvaluation ? "locked" : interventionItems.length > 0 ? "current" : "complete",
      detail: !hasEvaluation
        ? "Unlocks once you complete Phase 1."
        : interventionItems.length === 0
          ? "No significant gaps identified — all domains scored 4 or higher."
          : `${interventionItems.length} recommended action${interventionItems.length === 1 ? "" : "s"} identified below.`,
      items: interventionItems,
    },
    {
      key: "monitoring",
      name: "Phase 3 — Monitoring",
      description: "Progress tracked over 3–6 months, with independent verification of improvement.",
      status: "locked",
      detail:
        "Requires a persistent account and ongoing data over time — not something a single session can demonstrate. This phase needs real backend infrastructure to build.",
    },
    {
      key: "certificate",
      name: "Phase 4 — BSC Bankability Certificate",
      description: "On meeting certification criteria, RESET independently issues the BSC Bankability Certificate.",
      status: !hasEvaluation ? "locked" : isEligibleForCertificate ? "eligible" : "locked",
      detail: !hasEvaluation
        ? "Unlocks once you complete Phase 1."
        : isEligibleForCertificate
          ? "Your current rating meets the threshold for certification eligibility. Actual issuance requires the monitoring phase and RESET's real certification process."
          : "Reach a \"Bankable\" or \"Strong\" rating to become eligible.",
    },
    {
      key: "matching",
      name: "Phase 5 — AI Financial Matching",
      description: "Certified businesses enter the matching engine, where multiple lenders compete with offers.",
      status: "locked",
      detail: "Requires a real financial institution partnership and API integrations — a future infrastructure project, not something we can build here.",
    },
  ];
}