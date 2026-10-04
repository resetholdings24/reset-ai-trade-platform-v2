// From BSC Technical Specification Table 6/21 ("Consulting Agent | Senior
// consultant | Business planning, financial modelling, M&E, project
// planning") and Table 14 (named outputs: "Business plan summary" and
// "Financial projections"). M&E (ongoing monitoring) and full project
// planning are NOT built here — M&E requires persistent tracking over time,
// the same infrastructure gap as Bankability Pathway's Phase 3, so it is
// honestly left for a future session rather than faked.

export const BUSINESS_PLAN_QUESTIONS = [
  { key: "problem", name: "Problem", question: "In 1–2 sentences, what problem does your business solve?" },
  { key: "solution", name: "Solution", question: "In 1–2 sentences, how does your product or service solve it?" },
  {
    key: "market",
    name: "Target Market",
    question: "Who is your target customer, and roughly how many potential customers are there?",
  },
  {
    key: "revenue_model",
    name: "Revenue Model",
    question: "How does your business make money (e.g. direct sales, subscription, commission)?",
  },
  { key: "team", name: "Team", question: "Briefly describe your founding team and key roles." },
] as const;

export function isBusinessPlanStart(q: string) {
  return q.includes("business plan") || (q.includes("consulting") && q.includes("plan"));
}

export function nextBusinessPlanQuestion(answers: Record<string, string>) {
  return BUSINESS_PLAN_QUESTIONS.find((b) => answers[b.key] == null) ?? null;
}

export type BusinessPlanSummary = {
  problem: string;
  solution: string;
  market: string;
  revenueModel: string;
  team: string;
};

export function buildBusinessPlanSummary(answers: Record<string, string>): BusinessPlanSummary {
  return {
    problem: answers.problem ?? "Not specified",
    solution: answers.solution ?? "Not specified",
    market: answers.market ?? "Not specified",
    revenueModel: answers.revenue_model ?? "Not specified",
    team: answers.team ?? "Not specified",
  };
}

export const PROJECTION_QUESTIONS = [
  { key: "monthly_revenue", name: "Current Monthly Revenue", question: "What is your current average monthly revenue? (enter a number, e.g. 5000)" },
  { key: "revenue_growth", name: "Expected Revenue Growth", question: "What annual revenue growth rate do you expect, as a percentage? (e.g. 15)" },
  { key: "monthly_expenses", name: "Current Monthly Expenses", question: "What are your current average monthly expenses? (enter a number, e.g. 3500)" },
  { key: "expense_growth", name: "Expected Expense Growth", question: "What annual expense growth rate do you expect, as a percentage? (e.g. 8)" },
] as const;

export function isProjectionsStart(q: string) {
  return q.includes("financial projection") || q.includes("financial model") || q.includes("cash flow projection");
}

export function nextProjectionQuestion(answers: Record<string, string>) {
  return PROJECTION_QUESTIONS.find((p) => answers[p.key] == null) ?? null;
}

export function parseNumericAnswer(text: string): number | null {
  const cleaned = text.replace(/[,$%]/g, "").trim();
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : null;
}

export type ProjectionYear = { year: number; revenue: number; expenses: number; cashFlow: number; cumulativeCashFlow: number };

export function computeProjections(answers: Record<string, string>): ProjectionYear[] {
  const monthlyRevenue = parseNumericAnswer(answers.monthly_revenue ?? "0") ?? 0;
  const revenueGrowth = (parseNumericAnswer(answers.revenue_growth ?? "0") ?? 0) / 100;
  const monthlyExpenses = parseNumericAnswer(answers.monthly_expenses ?? "0") ?? 0;
  const expenseGrowth = (parseNumericAnswer(answers.expense_growth ?? "0") ?? 0) / 100;

  let annualRevenue = monthlyRevenue * 12;
  let annualExpenses = monthlyExpenses * 12;
  let cumulative = 0;
  const years: ProjectionYear[] = [];

  for (let year = 1; year <= 3; year++) {
    if (year > 1) {
      annualRevenue *= 1 + revenueGrowth;
      annualExpenses *= 1 + expenseGrowth;
    }
    const cashFlow = annualRevenue - annualExpenses;
    cumulative += cashFlow;
    years.push({
      year,
      revenue: Math.round(annualRevenue),
      expenses: Math.round(annualExpenses),
      cashFlow: Math.round(cashFlow),
      cumulativeCashFlow: Math.round(cumulative),
    });
  }
  return years;
}