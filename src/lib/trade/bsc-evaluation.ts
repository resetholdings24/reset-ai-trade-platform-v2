import type { BSCEvaluationResult } from "./types";

// The BSC Technical Specification v2.0 (Table 6) defines these six domains and
// what each evaluates, but does NOT specify numeric domain weightings or score
// thresholds. Both are treated as configurable defaults here, not spec fact:
//   - Weighting: equal across all six domains (~16.7% each). The spec singles
//     out Financial Capability as "the most critical domain" in commentary,
//     but gives no numeric weight for that emphasis, so it is not reflected
//     in the score — only in the guidance text.
//   - Tier thresholds: chosen to roughly mirror the spec's four named ratings
//     (Not Ready / Developing / Bankable / Strong) at sensible intervals.
export const DOMAINS = [
  {
    key: "technology",
    name: "Technology Capability",
    question:
      "On a scale of 1–5, how would you rate your Technology Capability?\n\n1 = Minimal digital tools, no cybersecurity practices\n3 = Basic digital tools in use, some gaps in security or e-commerce readiness\n5 = Strong digital maturity — secure systems, e-commerce ready, uses data to guide decisions\n\nReply with a number from 1 to 5.",
  },
  {
    key: "management",
    name: "Management Capability",
    question:
      "On a scale of 1–5, how would you rate your Management Capability?\n\n1 = No clear leadership structure or strategic planning\n3 = Some planning and decision-making structure, still developing\n5 = Strong leadership, clear governance, documented succession planning\n\nReply with a number from 1 to 5.",
  },
  {
    key: "human_resources",
    name: "Human Resources Capability",
    question:
      "On a scale of 1–5, how would you rate your Human Resources Capability?\n\n1 = No HR systems, high turnover, no training investment\n3 = Basic HR practices, some training, moderate retention\n5 = Strong HR systems, ongoing training investment, low turnover\n\nReply with a number from 1 to 5.",
  },
  {
    key: "organisational_systems",
    name: "Organisational Systems",
    question:
      "On a scale of 1–5, how would you rate your Organisational Systems?\n\n1 = Few documented processes, no compliance framework\n3 = Some standard operating procedures, partial compliance framework\n5 = Documented SOPs, strong compliance and quality management, business continuity plan in place\n\nReply with a number from 1 to 5.",
  },
  {
    key: "financial",
    name: "Financial Capability",
    question:
      "On a scale of 1–5, how would you rate your Financial Capability?\n\n1 = Poor record-keeping, no financial planning\n3 = Basic bookkeeping, limited financial planning\n5 = Strong accounting systems, clear financial planning, audit-ready records\n\nReply with a number from 1 to 5.",
  },
  {
    key: "market_potential",
    name: "Market Potential",
    question:
      "On a scale of 1–5, how would you rate your Market Potential?\n\n1 = Weak market position, no competitive advantage, single customer dependency\n3 = Reasonable market position, some diversification\n5 = Strong competitive advantage, diversified customer base, validated growth trajectory\n\nReply with a number from 1 to 5.",
  },
] as const;

export function nextDomain(answers: Record<string, number>) {
  return DOMAINS.find((d) => answers[d.key] == null) ?? null;
}

export function scoreEvaluation(answers: Record<string, number>): BSCEvaluationResult {
  let total = 0;
  const domains = DOMAINS.map((d) => {
    const score = Math.max(1, Math.min(5, answers[d.key] ?? 3));
    total += score * (1 / DOMAINS.length) * 20;
    return { key: d.key, name: d.name, score };
  });

  let rating: BSCEvaluationResult["rating"];
  let message: string;
  if (total >= 80) {
    rating = "Strong";
    message =
      "Your business shows strong bankability across most domains. You are well-positioned to enter the AI Financial Matching Engine once formally certified.";
  } else if (total >= 60) {
    rating = "Bankable";
    message =
      "Your business meets a reasonable bankability standard. Some domains would benefit from further strengthening before certification.";
  } else if (total >= 40) {
    rating = "Developing";
    message =
      "Your business is developing toward bankability. A structured intervention plan across your weaker domains would meaningfully improve your position.";
  } else {
    rating = "Not Ready";
    message =
      "Your business is not yet ready for formal bankability certification. Focus on foundational improvements, starting with your lowest-scoring domains.";
  }

  const recs: string[] = [];
  if ((answers.technology ?? 3) < 4)
    recs.push("Strengthen digital tools, cybersecurity practices, and e-commerce readiness.");
  if ((answers.management ?? 3) < 4)
    recs.push("Build clearer leadership structure, strategic planning, and governance practices.");
  if ((answers.human_resources ?? 3) < 4)
    recs.push("Invest in HR systems, staff training, and retention practices.");
  if ((answers.organisational_systems ?? 3) < 4)
    recs.push("Document standard operating procedures and strengthen your compliance framework.");
  if ((answers.financial ?? 3) < 4)
    recs.push(
      "Improve financial record-keeping and planning — this is the domain financial institutions weigh most heavily.",
    );
  if ((answers.market_potential ?? 3) < 4)
    recs.push("Diversify your customer base and strengthen your competitive positioning.");
  if (recs.length === 0)
    recs.push("Continue monitoring all six domains to maintain and build on your bankability position.");

  return {
    overallScore: Math.round(total * 10) / 10,
    rating,
    message,
    recommendations: recs,
    domains,
  };
}

export function isBSCEvaluationStart(q: string) {
  return (
    q.includes("6-domain") ||
    q.includes("6 domain") ||
    q.includes("capability evaluation") ||
    q.includes("bankability evaluation") ||
    q.includes("evaluate my business") ||
    q.includes("bsc evaluation")
  );
}