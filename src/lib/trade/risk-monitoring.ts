import type { RiskAssessmentResult } from "./types";

// From BSC Technical Specification v1, Section 5.8 ("Financial Risk
// Mitigation Framework"). V1 describes continuous, real-time monitoring with
// threshold alerts and monthly auto-generated PDF reports — that requires a
// persistent backend this project does not have. What's built here is the
// point-in-time scoring mechanism itself: the six risk categories, the RAG
// scorecard, and scenario framing. Continuous monitoring and alerts are
// explicitly NOT simulated — the result honestly states they require real
// backend infrastructure, the same way Bankability Pathway's Phase 3 does.
export const RISK_CATEGORIES = [
  {
    key: "cashflow",
    name: "Cashflow Risk",
    question:
      "On a scale of 1–5, how would you rate your Cashflow position?\n\n1 = Frequently short on cash, struggle to cover expenses\n3 = Generally manageable, occasional tight periods\n5 = Strong, predictable cash position with reserves\n\nReply with a number from 1 to 5.",
  },
  {
    key: "credit_debt",
    name: "Credit & Debt Risk",
    question:
      "On a scale of 1–5, how would you rate your Credit & Debt position?\n\n1 = High debt burden, difficulty meeting obligations\n3 = Manageable debt, some pressure\n5 = Low debt burden, strong repayment capacity\n\nReply with a number from 1 to 5.",
  },
  {
    key: "market",
    name: "Market Risk",
    question:
      "On a scale of 1–5, how exposed is your business to Market Risk?\n\n1 = Highly exposed — single customer or market, no diversification\n3 = Some diversification, moderate exposure\n5 = Well diversified across customers and markets\n\nReply with a number from 1 to 5.",
  },
  {
    key: "operational",
    name: "Operational Risk",
    question:
      "On a scale of 1–5, how would you rate your Operational resilience?\n\n1 = Frequent disruptions, no contingency planning\n3 = Generally stable, limited contingency planning\n5 = Resilient operations with contingency plans in place\n\nReply with a number from 1 to 5.",
  },
  {
    key: "compliance",
    name: "Compliance Risk",
    question:
      "On a scale of 1–5, how would you rate your Compliance position?\n\n1 = Significant gaps in regulatory or tax compliance\n3 = Mostly compliant, some gaps\n5 = Fully compliant across tax, licensing, and regulation\n\nReply with a number from 1 to 5.",
  },
  {
    key: "growth",
    name: "Growth Risk",
    question:
      "On a scale of 1–5, how would you rate your Growth trajectory risk?\n\n1 = Declining or stagnant, no clear growth plan\n3 = Stable, modest growth plans\n5 = Clear, validated growth trajectory\n\nReply with a number from 1 to 5.",
  },
] as const;

function ragStatus(score: number): "Red" | "Amber" | "Green" {
  if (score <= 2) return "Red";
  if (score === 3) return "Amber";
  return "Green";
}

// Mitigation suggestions cross-reference tools genuinely built elsewhere in
// this platform where relevant, and are honest about what still requires
// real infrastructure (e.g. insurance matching, expert referral marketplace).
const MITIGATION_BY_CATEGORY: Record<string, string> = {
  cashflow: "Explore the Trade Intelligence Export Finance Navigator for pre-shipment and working capital options.",
  credit_debt: "Once your bankability rating supports it, the AI Financial Matching framework can surface restructuring-friendly lenders.",
  market: "Use Market Access and Location Intelligence tools to identify diversification opportunities.",
  operational: "The Bankability Pathway's Organisational Systems intervention plan addresses this directly.",
  compliance: "Check the EPA and Trade Agreement tools for export compliance requirements relevant to your sector.",
  growth: "The 6-Domain Evaluation's Market Potential domain and Bankability Pathway target growth-readiness directly.",
};

export function nextRiskCategory(answers: Record<string, number>) {
  return RISK_CATEGORIES.find((c) => answers[c.key] == null) ?? null;
}

export function isRiskMonitoringStart(q: string) {
  return q.includes("risk monitoring") || q.includes("risk assessment") || q.includes("risk check");
}

export function scoreRiskAssessment(answers: Record<string, number>): RiskAssessmentResult {
  let total = 0;
  const categories = RISK_CATEGORIES.map((c) => {
    const score = Math.max(1, Math.min(5, answers[c.key] ?? 3));
    total += score * (1 / RISK_CATEGORIES.length) * 20;
    return { key: c.key, name: c.name, score, status: ragStatus(score) };
  });

  const redCount = categories.filter((c) => c.status === "Red").length;
  const amberCount = categories.filter((c) => c.status === "Amber").length;

  let scenario: string;
  if (redCount >= 2) {
    scenario =
      "Worst case: multiple red-flagged categories compounding could create a genuine solvency risk within months if unaddressed. Base case: manageable if you act on the highest-priority category now. Best case: addressing even one red category often improves related categories too.";
  } else if (redCount === 1 || amberCount >= 3) {
    scenario =
      "Worst case: the flagged area(s) could worsen and limit your options. Base case: stable but with real room to strengthen your position. Best case: targeted action on the flagged categories meaningfully reduces your overall risk profile.";
  } else {
    scenario =
      "Worst case: even strong businesses face external shocks — don't treat this as a reason to stop monitoring. Base case: your risk profile is currently well-managed. Best case: continued discipline keeps you resilient as you grow.";
  }

  const mitigations = categories
    .filter((c) => c.status !== "Green")
    .map((c) => ({ category: c.name, suggestion: MITIGATION_BY_CATEGORY[c.key] }));

  return {
    overallScore: Math.round(total * 10) / 10,
    categories,
    scenario,
    mitigations,
  };
}