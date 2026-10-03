export type AgentId = "guidance" | "consulting" | "training" | "marketplace";

export type KnowledgeCard = {
  title: string;
  summary: string;
  points: string[];
  related?: string[];
  nextSteps?: string[];
};

export type AssessmentResult = {
  overallScore: number;
  status: "Green" | "Amber" | "Red";
  message: string;
  recommendations: string[];
  dimensions: { key: string; name: string; score: number }[];
};

export type BSCEvaluationResult = {
  overallScore: number;
  rating: "Not Ready" | "Developing" | "Bankable" | "Strong";
  message: string;
  recommendations: string[];
  domains: { key: string; name: string; score: number }[];
};

export type RiskAssessmentResult = {
  overallScore: number;
  categories: { key: string; name: string; score: number; status: "Red" | "Amber" | "Green" }[];
  scenario: string;
  mitigations: { category: string; suggestion: string }[];
};

export type EngineReply =
  | { kind: "knowledge"; card: KnowledgeCard }
  | { kind: "assessment-start" | "assessment-question"; question: string; step: number; total: number; name: string }
  | { kind: "assessment-result"; result: AssessmentResult }
  | { kind: "bsc-start" | "bsc-question"; question: string; step: number; total: number; name: string }
  | { kind: "bsc-result"; result: BSCEvaluationResult }
  | { kind: "risk-start" | "risk-question"; question: string; step: number; total: number; name: string }
  | { kind: "risk-result"; result: RiskAssessmentResult }
  | { kind: "need-score"; question: string; step: number; total: number; name: string }
  | { kind: "ai" };