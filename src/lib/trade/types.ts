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

export type EngineReply =
  | { kind: "knowledge"; card: KnowledgeCard }
  | { kind: "assessment-start" | "assessment-question"; question: string; step: number; total: number; name: string }
  | { kind: "assessment-result"; result: AssessmentResult }
  | { kind: "need-score"; question: string; step: number; total: number; name: string }
  | { kind: "ai" };