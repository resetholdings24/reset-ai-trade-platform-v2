// Membership tiers and gating per BSC Technical Specification v1, Table 3
// ("Platform Components" — membership gate column) and Section 7 (Membership
// Tier Structure). Real billing/auth is out of scope here — no backend exists
// to charge cards or persist accounts. This is a SIMULATED tier selection
// (stored only in this browser session) that demonstrates the real gating
// logic the spec describes, honestly labeled as simulated throughout.
export type MembershipTier = "Guest" | "Basic" | "Premium" | "Enterprise";

const TIER_RANK: Record<MembershipTier, number> = {
  Guest: 0,
  Basic: 1,
  Premium: 2,
  Enterprise: 3,
};

// Gate requirements drawn directly from v1 Table 3: Business Guidance is
// "Guest+", Capability Evaluation and the Financial Risk / Matching line are
// both "Basic+".
export const FEATURE_GATES = {
  guidance: "Guest" as MembershipTier,
  evaluation: "Basic" as MembershipTier,
  pathway: "Basic" as MembershipTier,
  matching: "Basic" as MembershipTier,
  riskMonitoring: "Basic" as MembershipTier,
  consulting: "Basic" as MembershipTier,
  training: "Basic" as MembershipTier,
};

export function canAccess(tier: MembershipTier, feature: keyof typeof FEATURE_GATES): boolean {
  return TIER_RANK[tier] >= TIER_RANK[FEATURE_GATES[feature]];
}

export type BusinessProfile = {
  stage: string;
  sector: string;
  challenge: string;
  objective: string;
};

export const GUIDANCE_QUESTIONS = [
  {
    key: "stage",
    name: "Business Stage",
    question: "What stage is your business at?",
    options: ["Idea / concept", "Early-stage (under 2 years)", "Growth (2–5 years)", "Established (5+ years)"],
  },
  {
    key: "sector",
    name: "Sector",
    question: "What's your primary sector?",
    options: ["Agriculture / agro-processing", "Manufacturing", "Tourism & hospitality", "ICT / services", "Trade / retail", "Other"],
  },
  {
    key: "challenge",
    name: "Primary Challenge",
    question: "What's your biggest challenge right now?",
    options: ["Access to capital", "Market access / growth", "Operational efficiency", "Compliance / regulation", "Talent / HR"],
  },
  {
    key: "objective",
    name: "12-Month Objective",
    question: "What's your main objective over the next 12 months?",
    options: ["Grow revenue", "Access financing", "Improve operations", "Expand to new markets", "Build capability / certification"],
  },
] as const;

export function isGuidanceStart(q: string) {
  return (
    q.includes("business guidance") ||
    q.includes("get started") ||
    q.includes("create my profile") ||
    q.includes("business profile")
  );
}

export function nextGuidanceQuestion(answers: Record<string, string>) {
  return GUIDANCE_QUESTIONS.find((g) => answers[g.key] == null) ?? null;
}

const NEXT_STEP_BY_OBJECTIVE: Record<string, string> = {
  "Grow revenue": "Market Access tools and the Online Marketplace will be most relevant — explore those under Tools.",
  "Access financing": "Start the 6-Domain Evaluation — it's the entry point to the Bankability Pathway and Financial Matching.",
  "Improve operations": "The Organisational Systems domain in the 6-Domain Evaluation will surface concrete next steps.",
  "Expand to new markets": "Check Location Intelligence and the Trade Agreement Navigator for your target market.",
  "Build capability / certification": "Start the 6-Domain Evaluation — it's the foundation of the Bankability Pathway.",
};

export function buildProfile(answers: Record<string, string>): { profile: BusinessProfile; suggestedNextStep: string } {
  const profile: BusinessProfile = {
    stage: answers.stage ?? "Unspecified",
    sector: answers.sector ?? "Unspecified",
    challenge: answers.challenge ?? "Unspecified",
    objective: answers.objective ?? "Unspecified",
  };
  const suggestedNextStep =
    NEXT_STEP_BY_OBJECTIVE[profile.objective] ?? "Start the 6-Domain Evaluation to establish your baseline.";
  return { profile, suggestedNextStep };
}