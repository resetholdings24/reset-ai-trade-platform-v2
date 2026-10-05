import type { BSCEvaluationResult } from "./types";

// From BSC Technical Specification Table 6/21 ("Training Agent | Learning
// coach | Skill gap analysis, adaptive learning paths, assessments") and
// Table 20 ("Training completions now feed directly into domain scores —
// Financial Literacy training improves Financial Capability score,
// Leadership training improves Management Capability score").
//
// IMPORTANT: marking a course "complete" here does NOT silently change a
// stored evaluation score. That would fabricate an improvement that didn't
// actually happen. Completion is acknowledged honestly, with a note that
// re-taking the real 6-Domain Evaluation is how genuine improvement shows up
// — the same integrity line drawn for illustrative lenders and simulated
// membership elsewhere in this build.
export type Course = {
  id: string;
  title: string;
  domain: string; // matches bsc-evaluation.ts domain keys
  description: string;
  durationHours: number;
};

export const COURSES: Course[] = [
  {
    id: "digital_tools_101",
    title: "Digital Tools & Cybersecurity Basics",
    domain: "technology",
    description: "Core digital tools for small businesses, plus practical cybersecurity hygiene.",
    durationHours: 3,
  },
  {
    id: "leadership_essentials",
    title: "Leadership & Strategic Planning Essentials",
    domain: "management",
    description: "Building a leadership structure, basic governance, and a simple strategic plan.",
    durationHours: 4,
  },
  {
    id: "hr_systems_basics",
    title: "Building HR Systems That Retain Talent",
    domain: "human_resources",
    description: "Practical HR systems, onboarding, and retention practices for small teams.",
    durationHours: 3,
  },
  {
    id: "sop_quality_mgmt",
    title: "Standard Operating Procedures & Quality Management",
    domain: "organisational_systems",
    description: "Documenting SOPs and building a lightweight compliance and quality framework.",
    durationHours: 4,
  },
  {
    id: "financial_literacy",
    title: "Financial Literacy for Business Owners",
    domain: "financial",
    description: "Record-keeping, cash flow management, and financial planning fundamentals.",
    durationHours: 5,
  },
  {
    id: "market_diversification",
    title: "Market Diversification & Growth Strategy",
    domain: "market_potential",
    description: "Reducing customer concentration risk and identifying validated growth paths.",
    durationHours: 3,
  },
];

export function isTrainingStart(q: string) {
  return q.includes("skill gap") || q.includes("learning path") || (q.includes("training") && !q.includes("risk"));
}

export type SkillGapOutcome =
  | { eligible: false; reason: string }
  | { eligible: true; gaps: { domain: string; score: number; course: Course }[] };

export function getSkillGapAnalysis(lastResult: BSCEvaluationResult | null): SkillGapOutcome {
  if (!lastResult) {
    return {
      eligible: false,
      reason: "Complete the 6-Domain Evaluation first — skill gap analysis is built from your actual domain scores.",
    };
  }
  const gaps = lastResult.domains
    .filter((d) => d.score < 4)
    .sort((a, b) => a.score - b.score)
    .map((d) => ({ domain: d.name, score: d.score, course: COURSES.find((c) => c.domain === d.key)! }))
    .filter((g) => g.course);

  return { eligible: true, gaps };
}

export function isCourseCompletion(q: string): Course | null {
  const match = q.match(/complete course (\S+)/);
  if (match) return COURSES.find((c) => c.id === match[1]) ?? null;
  return null;
}