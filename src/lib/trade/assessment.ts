import type { AssessmentResult } from "./types";

export const DIMENSIONS = [
  {
    key: "product_quality",
    name: "Product Quality",
    question:
      "On a scale of 1–5, how would you rate your Product Quality?\n\n1 = Very weak or inconsistent\n3 = Acceptable but needs improvement\n5 = Strong, consistent, and preferably certified\n\nReply with a number from 1 to 5.",
  },
  {
    key: "supply_capacity",
    name: "Supply Capacity",
    question:
      "On a scale of 1–5, how would you rate your Supply Capacity?\n\n1 = Cannot reliably fulfil orders\n3 = Can fulfil small orders with effort\n5 = Can consistently meet volume and delivery requirements\n\nReply with a number from 1 to 5.",
  },
  {
    key: "compliance",
    name: "Compliance & Documentation",
    question:
      "On a scale of 1–5, how would you rate your Compliance & Documentation readiness?\n\n1 = Limited understanding of export requirements\n3 = Basic knowledge, some gaps\n5 = Strong understanding of rules of origin, certificates, and market regulations\n\nReply with a number from 1 to 5.",
  },
  {
    key: "financial",
    name: "Financial Readiness",
    question:
      "On a scale of 1–5, how would you rate your Financial Readiness for exporting?\n\n1 = Significant cash-flow constraints\n3 = Manageable but tight\n5 = Strong working capital and access to export finance if needed\n\nReply with a number from 1 to 5.",
  },
  {
    key: "management",
    name: "Management Capability",
    question:
      "On a scale of 1–5, how would you rate your Management Capability for export?\n\n1 = No clear export process or experience\n3 = Some experience, processes still developing\n5 = Clear export strategy and experienced team\n\nReply with a number from 1 to 5.",
  },
] as const;

const WEIGHTS: Record<string, number> = {
  product_quality: 0.25,
  supply_capacity: 0.2,
  compliance: 0.2,
  financial: 0.2,
  management: 0.15,
};

export function nextDimension(answers: Record<string, number>) {
  return DIMENSIONS.find((d) => answers[d.key] == null) ?? null;
}

export function parseScore(text: string): number | null {
  const m = text.trim().match(/\b([1-5])\b/);
  if (!m) return null;
  return Number(m[1]);
}

export function scoreAssessment(answers: Record<string, number>): AssessmentResult {
  let total = 0;
  const dimensions = DIMENSIONS.map((d) => {
    const score = Math.max(1, Math.min(5, answers[d.key] ?? 3));
    total += score * (WEIGHTS[d.key] ?? 0) * 20;
    return { key: d.key, name: d.name, score };
  });

  let status: AssessmentResult["status"];
  let message: string;
  if (total >= 75) {
    status = "Green";
    message =
      "Your business shows strong export readiness. You are in a good position to pursue export opportunities.";
  } else if (total >= 50) {
    status = "Amber";
    message =
      "Your business has moderate export readiness. Some important gaps need attention before scaling exports.";
  } else {
    status = "Red";
    message =
      "Your business is not yet export-ready. Focus on foundational improvements first.";
  }

  const recs: string[] = [];
  if ((answers.product_quality ?? 3) < 4)
    recs.push(
      "Strengthen product quality systems and consider certifications relevant to your target markets.",
    );
  if ((answers.supply_capacity ?? 3) < 4)
    recs.push(
      "Build more reliable production and supply capacity to meet consistent export orders.",
    );
  if ((answers.compliance ?? 3) < 4)
    recs.push(
      "Improve understanding of export documentation, rules of origin, and market regulations.",
    );
  if ((answers.financial ?? 3) < 4)
    recs.push(
      "Strengthen financial planning and explore export finance options (pre-shipment finance, credit insurance).",
    );
  if ((answers.management ?? 3) < 4)
    recs.push("Develop export management skills and clear processes for international sales.");
  if (recs.length === 0)
    recs.push("Continue monitoring and improving all areas to maintain strong export readiness.");

  return {
    overallScore: Math.round(total * 10) / 10,
    status,
    message,
    recommendations: recs,
    dimensions,
  };
}

export function isReadinessStart(q: string) {
  return (
    q.includes("export readiness") ||
    q.includes("export ready") ||
    q.includes("readiness assessment") ||
    q.includes("assess my export")
  );
}
