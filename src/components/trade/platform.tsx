import { useEffect, useRef, useState } from "react";
import {
  CircleCheck,
  ClipboardCheck,
  Compass,
  GraduationCap,
  Handshake,
  Landmark,
  MapPin,
  Menu,
  RotateCcw,
  Route,
  Scale,
  ShieldAlert,
  Send,
  Ship,
  Store,
  Wallet,
  FileCheck,
  X,
} from "lucide-react";
import { askGrok } from "@/lib/ai/ask-grok";
import { applyAssessment, routeQuery, type AssessmentState } from "@/lib/trade/engine";
import { nextDimension } from "@/lib/trade/assessment";
import { isBSCEvaluationStart, nextDomain } from "@/lib/trade/bsc-evaluation";
import { getPathwayPhases, isPathwayRequest, type PathwayPhase } from "@/lib/trade/bankability-pathway";
import { getMatches, isMatchingRequest, type MatchingOutcome } from "@/lib/trade/financial-matching";
import {
  buildProfile,
  canAccess,
  canCreateListing,
  FEATURE_GATES,
  GUIDANCE_QUESTIONS,
  isGuidanceStart,
  LISTING_LIMITS,
  nextGuidanceQuestion,
  type BusinessProfile,
  type MembershipTier,
} from "@/lib/trade/membership";
import { isRiskMonitoringStart } from "@/lib/trade/risk-monitoring";
import {
  getSkillGapAnalysis,
  isCourseCompletion,
  isTrainingStart,
  type SkillGapOutcome,
} from "@/lib/trade/training";
import {
  buildListing,
  getDemandSignal,
  isBrowseRequest,
  isListingStart,
  LISTING_QUESTIONS,
  nextListingQuestion,
  type Listing,
} from "@/lib/trade/marketplace";
import {
  BUSINESS_PLAN_QUESTIONS,
  buildBusinessPlanSummary,
  computeProjections,
  isBusinessPlanStart,
  isProjectionsStart,
  nextBusinessPlanQuestion,
  nextProjectionQuestion,
  parseNumericAnswer,
  PROJECTION_QUESTIONS,
  type BusinessPlanSummary,
  type ProjectionYear,
} from "@/lib/trade/consulting";
import { AGENTS, TOOLS } from "@/lib/trade/knowledge";
import type { AgentId, AssessmentResult, BSCEvaluationResult, KnowledgeCard, RiskAssessmentResult } from "@/lib/trade/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

type Message =
  | { id: string; role: "user"; kind: "text"; text: string }
  | { id: string; role: "assistant"; kind: "text"; text: string }
  | { id: string; role: "assistant"; kind: "knowledge"; card: KnowledgeCard }
  | {
      id: string;
      role: "assistant";
      kind: "question";
      question: string;
      step: number;
      total: number;
      name: string;
    }
  | { id: string; role: "assistant"; kind: "result"; result: AssessmentResult }
  | { id: string; role: "assistant"; kind: "bsc-result"; result: BSCEvaluationResult }
  | { id: string; role: "assistant"; kind: "pathway"; phases: PathwayPhase[] }
  | { id: string; role: "assistant"; kind: "matching"; outcome: MatchingOutcome }
  | { id: string; role: "assistant"; kind: "risk-result"; result: RiskAssessmentResult }
  | {
      id: string;
      role: "assistant";
      kind: "choice-question";
      question: string;
      step: number;
      total: number;
      name: string;
      options: readonly string[];
    }
  | { id: string; role: "assistant"; kind: "profile"; profile: BusinessProfile; suggestedNextStep: string }
  | { id: string; role: "assistant"; kind: "gate"; feature: string; requiredTier: MembershipTier }
  | { id: string; role: "assistant"; kind: "text-question"; question: string; step: number; total: number; name: string }
  | { id: string; role: "assistant"; kind: "business-plan"; summary: BusinessPlanSummary }
  | { id: string; role: "assistant"; kind: "projections"; years: ProjectionYear[] }
  | { id: string; role: "assistant"; kind: "skill-gap"; outcome: SkillGapOutcome }
  | { id: string; role: "assistant"; kind: "course-complete"; courseTitle: string }
  | { id: string; role: "assistant"; kind: "listings-browse"; listings: Listing[] }
  | { id: string; role: "assistant"; kind: "listing-created"; listing: Listing }
  | { id: string; role: "assistant"; kind: "listing-limit"; tier: MembershipTier; limit: number };

const AGENT_ICONS: Record<AgentId, typeof Compass> = {
  guidance: Compass,
  consulting: Handshake,
  training: GraduationCap,
  marketplace: Store,
};

const LOCATION_LAYERS: {
  id: string;
  label: string;
  options: { label: string; prompt: string }[];
}[] = [
  {
    id: "parish",
    label: "Layer 1 — Parish",
    options: [
      "Kingston",
      "St. Andrew",
      "St. Thomas",
      "Portland",
      "St. Mary",
      "St. Ann",
      "Trelawny",
      "St. James",
      "Hanover",
      "Westmoreland",
      "St. Elizabeth",
      "Manchester",
      "Clarendon",
      "St. Catherine",
      "Portmore",
    ].map((label) => ({ label, prompt: `Tell me about ${label}` })),
  },
  {
    id: "national",
    label: "Layer 2 — National",
    options: ["Jamaica", "Barbados", "Trinidad and Tobago", "Guyana"].map((label) => ({
      label,
      prompt: `Tell me about ${label}`,
    })),
  },
  {
    id: "regional",
    label: "Layer 3 — Regional",
    options: [
      { label: "Overview", prompt: "Tell me about regional intelligence" },
      { label: "CARICOM Opportunities", prompt: "Tell me about CARICOM opportunities" },
      { label: "Regional Regulatory Developments", prompt: "Tell me about regional regulatory developments" },
      { label: "Regional Development Programmes", prompt: "Tell me about regional development programmes" },
      { label: "Inter-Caribbean Connections", prompt: "Tell me about inter-Caribbean business connections" },
      { label: "Regional Economic Intelligence", prompt: "Tell me about regional economic intelligence" },
    ],
  },
  {
    id: "international",
    label: "Layer 4 — International",
    options: [
      { label: "Overview", prompt: "Tell me about international intelligence" },
      { label: "Diaspora Business Intelligence", prompt: "Tell me about diaspora business intelligence" },
      { label: "Foreign Direct Investment Signals", prompt: "Tell me about foreign direct investment signals" },
      { label: "International Development Funding Cycles", prompt: "Tell me about international development funding cycles" },
      { label: "Global Market Signals", prompt: "Tell me about global market signals" },
    ],
  },
];

const TOOL_ICONS = [FileCheck, Scale, Ship, Wallet, Landmark, Compass];

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

const WELCOME: Message = {
  id: "welcome",
  role: "assistant",
  kind: "text",
  text: "Welcome to RESET Trade. I can help Caribbean SMEs with export readiness, the EPA, market access, export finance, international procurement, and regional trade agreements. Choose a tool or ask a question.",
};

export function TradePlatform() {
  const [agent, setAgent] = useState<AgentId>("guidance");
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [messages, setMessages] = useState<Message[]>([WELCOME]);
  const [assessment, setAssessment] = useState<AssessmentState>({ active: false, kind: null, answers: {} });
  const [territory, setTerritory] = useState<string | null>(null);
  const [expandedLayer, setExpandedLayer] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [lastBscResult, setLastBscResult] = useState<BSCEvaluationResult | null>(null);
  const [memberTier, setMemberTier] = useState<MembershipTier>("Guest");
  const [guidanceState, setGuidanceState] = useState<{ active: boolean; answers: Record<string, string> }>({
    active: false,
    answers: {},
  });
  const [planState, setPlanState] = useState<{ active: boolean; answers: Record<string, string> }>({
    active: false,
    answers: {},
  });
  const [projectionState, setProjectionState] = useState<{ active: boolean; answers: Record<string, string> }>({
    active: false,
    answers: {},
  });
  const [completedCourses, setCompletedCourses] = useState<Set<string>>(new Set());
  const [listings, setListings] = useState<Listing[]>([]);
  const [listingState, setListingState] = useState<{ active: boolean; answers: Record<string, string> }>({
    active: false,
    answers: {},
  });

  useEffect(() => {
    const saved = typeof window !== "undefined" ? window.localStorage.getItem("reset-trade-territory") : null;
    if (saved) setTerritory(saved);
  }, []);

  function chooseTerritory(id: string, label: string) {
    setTerritory(id);
    try {
      window.localStorage.setItem("reset-trade-territory", id);
    } catch {
      // ignore storage errors (e.g. private browsing)
    }
    send(`Tell me about ${label}`);
  }
  const scroller = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scroller.current?.scrollTo({ top: scroller.current.scrollHeight, behavior: "smooth" });
  }, [messages, busy]);

  async function send(raw: string) {
    const query = raw.trim();
    if (!query || busy) return;
    setInput("");
    const userMsg: Message = { id: uid(), role: "user", kind: "text", text: query };
    setMessages((m) => [...m, userMsg]);
    setBusy(true);

    const q = query.toLowerCase();

    function gated(feature: Parameters<typeof canAccess>[1]): boolean {
      if (canAccess(memberTier, feature)) return false;
      setMessages((m) => [
        ...m,
        { id: uid(), role: "assistant", kind: "gate", feature, requiredTier: FEATURE_GATES[feature] },
      ]);
      setBusy(false);
      return true;
    }

    if (guidanceState.active) {
      const current = nextGuidanceQuestion(guidanceState.answers);
      if (current) {
        const answers = { ...guidanceState.answers, [current.key]: query };
        const following = nextGuidanceQuestion(answers);
        if (following) {
          setGuidanceState({ active: true, answers });
          setMessages((m) => [
            ...m,
            {
              id: uid(),
              role: "assistant",
              kind: "choice-question",
              question: following.question,
              step: Object.keys(answers).length + 1,
              total: GUIDANCE_QUESTIONS.length,
              name: following.name,
              options: following.options,
            },
          ]);
        } else {
          setGuidanceState({ active: false, answers: {} });
          const { profile, suggestedNextStep } = buildProfile(answers);
          setMessages((m) => [...m, { id: uid(), role: "assistant", kind: "profile", profile, suggestedNextStep }]);
        }
        setBusy(false);
        return;
      }
    }

    if (planState.active) {
      const current = nextBusinessPlanQuestion(planState.answers);
      if (current) {
        const answers = { ...planState.answers, [current.key]: query };
        const following = nextBusinessPlanQuestion(answers);
        if (following) {
          setPlanState({ active: true, answers });
          setMessages((m) => [
            ...m,
            {
              id: uid(),
              role: "assistant",
              kind: "text-question",
              question: following.question,
              step: Object.keys(answers).length + 1,
              total: BUSINESS_PLAN_QUESTIONS.length,
              name: following.name,
            },
          ]);
        } else {
          setPlanState({ active: false, answers: {} });
          setMessages((m) => [
            ...m,
            { id: uid(), role: "assistant", kind: "business-plan", summary: buildBusinessPlanSummary(answers) },
          ]);
        }
        setBusy(false);
        return;
      }
    }

    if (projectionState.active) {
      const current = nextProjectionQuestion(projectionState.answers);
      if (current) {
        if (parseNumericAnswer(query) == null) {
          setMessages((m) => [
            ...m,
            {
              id: uid(),
              role: "assistant",
              kind: "text-question",
              question: `That doesn't look like a number. ${current.question}`,
              step: Object.keys(projectionState.answers).length + 1,
              total: PROJECTION_QUESTIONS.length,
              name: current.name,
            },
          ]);
          setBusy(false);
          return;
        }
        const answers = { ...projectionState.answers, [current.key]: query };
        const following = nextProjectionQuestion(answers);
        if (following) {
          setProjectionState({ active: true, answers });
          setMessages((m) => [
            ...m,
            {
              id: uid(),
              role: "assistant",
              kind: "text-question",
              question: following.question,
              step: Object.keys(answers).length + 1,
              total: PROJECTION_QUESTIONS.length,
              name: following.name,
            },
          ]);
        } else {
          setProjectionState({ active: false, answers: {} });
          setMessages((m) => [
            ...m,
            { id: uid(), role: "assistant", kind: "projections", years: computeProjections(answers) },
          ]);
        }
        setBusy(false);
        return;
      }
    }

    if (!guidanceState.active && isGuidanceStart(q)) {
      const first = GUIDANCE_QUESTIONS[0];
      setGuidanceState({ active: true, answers: {} });
      setMessages((m) => [
        ...m,
        {
          id: uid(),
          role: "assistant",
          kind: "choice-question",
          question: first.question,
          step: 1,
          total: GUIDANCE_QUESTIONS.length,
          name: first.name,
          options: first.options,
        },
      ]);
      setBusy(false);
      return;
    }

    if (!assessment.active && isPathwayRequest(q)) {
      if (gated("pathway")) return;
      const phases = getPathwayPhases(lastBscResult);
      setMessages((m) => [...m, { id: uid(), role: "assistant", kind: "pathway", phases }]);
      setBusy(false);
      return;
    }

    if (!assessment.active && isMatchingRequest(q)) {
      if (gated("matching")) return;
      const outcome = getMatches(query, lastBscResult);
      setMessages((m) => [...m, { id: uid(), role: "assistant", kind: "matching", outcome }]);
      setBusy(false);
      return;
    }

    if (!assessment.active && isBSCEvaluationStart(q) && gated("evaluation")) return;
    if (!assessment.active && isRiskMonitoringStart(q) && gated("riskMonitoring")) return;

    if (!planState.active && isBusinessPlanStart(q)) {
      if (gated("consulting")) return;
      const first = BUSINESS_PLAN_QUESTIONS[0];
      setPlanState({ active: true, answers: {} });
      setMessages((m) => [
        ...m,
        {
          id: uid(),
          role: "assistant",
          kind: "text-question",
          question: first.question,
          step: 1,
          total: BUSINESS_PLAN_QUESTIONS.length,
          name: first.name,
        },
      ]);
      setBusy(false);
      return;
    }

    if (listingState.active) {
      const current = nextListingQuestion(listingState.answers);
      if (current) {
        const answers = { ...listingState.answers, [current.key]: query };
        const following = nextListingQuestion(answers);
        if (following) {
          setListingState({ active: true, answers });
          setMessages((m) => [
            ...m,
            {
              id: uid(),
              role: "assistant",
              kind: "text-question",
              question: following.question,
              step: Object.keys(answers).length + 1,
              total: LISTING_QUESTIONS.length,
              name: following.name,
            },
          ]);
        } else {
          setListingState({ active: false, answers: {} });
          const listing = buildListing(answers, uid());
          setListings((prev) => [...prev, listing]);
          setMessages((m) => [...m, { id: uid(), role: "assistant", kind: "listing-created", listing }]);
        }
        setBusy(false);
        return;
      }
    }

    if (isBrowseRequest(q)) {
      setMessages((m) => [...m, { id: uid(), role: "assistant", kind: "listings-browse", listings }]);
      setBusy(false);
      return;
    }

    if (!listingState.active && isListingStart(q)) {
      if (!canCreateListing(memberTier, listings.length)) {
        setMessages((m) => [
          ...m,
          { id: uid(), role: "assistant", kind: "listing-limit", tier: memberTier, limit: LISTING_LIMITS[memberTier] },
        ]);
        setBusy(false);
        return;
      }
      const first = LISTING_QUESTIONS[0];
      setListingState({ active: true, answers: {} });
      setMessages((m) => [
        ...m,
        {
          id: uid(),
          role: "assistant",
          kind: "text-question",
          question: first.question,
          step: 1,
          total: LISTING_QUESTIONS.length,
          name: first.name,
        },
      ]);
      setBusy(false);
      return;
    }

    const completingCourse = isCourseCompletion(q);
    if (completingCourse) {
      if (gated("training")) return;
      setCompletedCourses((prev) => new Set(prev).add(completingCourse.id));
      setMessages((m) => [
        ...m,
        { id: uid(), role: "assistant", kind: "course-complete", courseTitle: completingCourse.title },
      ]);
      setBusy(false);
      return;
    }

    if (isTrainingStart(q)) {
      if (gated("training")) return;
      const outcome = getSkillGapAnalysis(lastBscResult);
      setMessages((m) => [...m, { id: uid(), role: "assistant", kind: "skill-gap", outcome }]);
      setBusy(false);
      return;
    }

    if (!projectionState.active && isProjectionsStart(q)) {
      if (gated("consulting")) return;
      const first = PROJECTION_QUESTIONS[0];
      setProjectionState({ active: true, answers: {} });
      setMessages((m) => [
        ...m,
        {
          id: uid(),
          role: "assistant",
          kind: "text-question",
          question: first.question,
          step: 1,
          total: PROJECTION_QUESTIONS.length,
          name: first.name,
        },
      ]);
      setBusy(false);
      return;
    }

    const nextState = applyAssessment(query, assessment);
    const reply = routeQuery(query, assessment);
    setAssessment(nextState);

    if (reply.kind === "knowledge") {
      setMessages((m) => [...m, { id: uid(), role: "assistant", kind: "knowledge", card: reply.card }]);
      setBusy(false);
      return;
    }
    if (
      reply.kind === "assessment-start" ||
      reply.kind === "assessment-question" ||
      reply.kind === "bsc-start" ||
      reply.kind === "bsc-question" ||
      reply.kind === "risk-start" ||
      reply.kind === "risk-question" ||
      reply.kind === "need-score"
    ) {
      setMessages((m) => [
        ...m,
        {
          id: uid(),
          role: "assistant",
          kind: "question",
          question: reply.question,
          step: reply.step,
          total: reply.total,
          name: reply.name,
        },
      ]);
      setBusy(false);
      return;
    }
    if (reply.kind === "assessment-result") {
      setMessages((m) => [...m, { id: uid(), role: "assistant", kind: "result", result: reply.result }]);
      setBusy(false);
      return;
    }
    if (reply.kind === "bsc-result") {
      setLastBscResult(reply.result);
      setMessages((m) => [...m, { id: uid(), role: "assistant", kind: "bsc-result", result: reply.result }]);
      setBusy(false);
      return;
    }
    if (reply.kind === "risk-result") {
      setMessages((m) => [...m, { id: uid(), role: "assistant", kind: "risk-result", result: reply.result }]);
      setBusy(false);
      return;
    }

    try {
      const history = [...messages, userMsg]
        .filter((x) => x.kind === "text")
        .slice(-6)
        .map((x) => ({ role: x.role, content: x.kind === "text" ? x.text : "" }));
      const res = await askGrok({ data: { query, agent, history } });
      setMessages((m) => [
        ...m,
        { id: uid(), role: "assistant", kind: "text", text: res.text },
      ]);
    } catch {
      setMessages((m) => [
        ...m,
        {
          id: uid(),
          role: "assistant",
          kind: "text",
          text: "Something went wrong reaching the advisor. Try a structured tool such as export readiness or EPA.",
        },
      ]);
    } finally {
      setBusy(false);
    }
  }

  function reset() {
    setMessages([WELCOME]);
    setAssessment({ active: false, kind: null, answers: {} });
    setLastBscResult(null);
    setGuidanceState({ active: false, answers: {} });
    setPlanState({ active: false, answers: {} });
    setProjectionState({ active: false, answers: {} });
    setListingState({ active: false, answers: {} });
    setListings([]);
    setCompletedCourses(new Set());
    setMobileMenuOpen(false);
    setMemberTier("Guest");
    setInput("");
  }

  const progress = assessment.active ? Object.keys(assessment.answers).length : 0;
  const currentDim = assessment.active
    ? assessment.kind === "bsc"
      ? nextDomain(assessment.answers)
      : nextDimension(assessment.answers)
    : null;
  const progressTotal = assessment.kind === "bsc" ? 6 : 5;

  const navSections = (
    <>
          <p className="mt-4 mb-2 px-1 text-xs font-medium tracking-wide text-subtle uppercase">
            Tools
          </p>
          <div className="flex flex-col gap-1">
            {TOOLS.map((t, i) => {
              const Icon = TOOL_ICONS[i];
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => send(t.prompt)}
                  className="flex min-h-11 items-center gap-3 rounded-md px-3 text-left text-sm text-muted transition-colors duration-150 hover:bg-elevated hover:text-fg"
                >
                  <Icon className="size-4 shrink-0" strokeWidth={1.75} />
                  {t.label}
                </button>
              );
            })}
          </div>
          <p className="mt-4 mb-2 px-1 text-xs font-medium tracking-wide text-subtle uppercase">
            Location Intelligence
          </p>
          <div className="flex flex-col gap-1">
            {LOCATION_LAYERS.map((layer) => {
              const isOpen = expandedLayer === layer.id;
              return (
                <div key={layer.id}>
                  <button
                    type="button"
                    data-keep-open
                    onClick={() => setExpandedLayer(isOpen ? null : layer.id)}
                    className="flex min-h-11 w-full items-center justify-between gap-2 rounded-md px-3 text-left text-sm text-muted transition-colors duration-150 hover:bg-elevated hover:text-fg"
                  >
                    <span className="flex items-center gap-3">
                      <MapPin className="size-4 shrink-0" strokeWidth={1.75} />
                      {layer.label}
                    </span>
                    <span className="text-xs text-subtle">{isOpen ? "–" : "+"}</span>
                  </button>
                  {isOpen ? (
                    <div className="ml-7 flex flex-col gap-0.5 border-l border-border pl-3">
                      {layer.options.map((opt) => (
                        <button
                          key={opt.label}
                          type="button"
                          onClick={() => send(opt.prompt)}
                          className="rounded-md px-2 py-1.5 text-left text-xs text-muted transition-colors duration-150 hover:bg-elevated hover:text-fg"
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
          <p className="mt-4 mb-2 px-1 text-xs font-medium tracking-wide text-subtle uppercase">
            Business Guidance
          </p>
          <div className="flex flex-col gap-1">
            <button
              type="button"
              onClick={() => send("business guidance")}
              className="flex min-h-11 items-center gap-3 rounded-md px-3 text-left text-sm text-muted transition-colors duration-150 hover:bg-elevated hover:text-fg"
            >
              <Compass className="size-4 shrink-0" strokeWidth={1.75} />
              Create My Business Profile
            </button>
          </div>
          <p className="mt-4 mb-2 px-1 text-xs font-medium tracking-wide text-subtle uppercase">
            Consulting
          </p>
          <div className="flex flex-col gap-1">
            <button
              type="button"
              onClick={() => send("business plan")}
              className="flex min-h-11 items-center gap-3 rounded-md px-3 text-left text-sm text-muted transition-colors duration-150 hover:bg-elevated hover:text-fg"
            >
              <Handshake className="size-4 shrink-0" strokeWidth={1.75} />
              Business Plan Builder
            </button>
            <button
              type="button"
              onClick={() => send("financial projections")}
              className="flex min-h-11 items-center gap-3 rounded-md px-3 text-left text-sm text-muted transition-colors duration-150 hover:bg-elevated hover:text-fg"
            >
              <Wallet className="size-4 shrink-0" strokeWidth={1.75} />
              Financial Projections
            </button>
          </div>
          <p className="mt-4 mb-2 px-1 text-xs font-medium tracking-wide text-subtle uppercase">
            Training
          </p>
          <div className="flex flex-col gap-1">
            <button
              type="button"
              onClick={() => send("skill gap analysis")}
              className="flex min-h-11 items-center gap-3 rounded-md px-3 text-left text-sm text-muted transition-colors duration-150 hover:bg-elevated hover:text-fg"
            >
              <GraduationCap className="size-4 shrink-0" strokeWidth={1.75} />
              Skill Gap Analysis
            </button>
          </div>
          <p className="mt-4 mb-2 px-1 text-xs font-medium tracking-wide text-subtle uppercase">
            Marketplace
          </p>
          <div className="flex flex-col gap-1">
            <button
              type="button"
              onClick={() => send("browse marketplace")}
              className="flex min-h-11 items-center gap-3 rounded-md px-3 text-left text-sm text-muted transition-colors duration-150 hover:bg-elevated hover:text-fg"
            >
              <Store className="size-4 shrink-0" strokeWidth={1.75} />
              Browse Marketplace
            </button>
            <button
              type="button"
              onClick={() => send("create listing")}
              className="flex min-h-11 items-center gap-3 rounded-md px-3 text-left text-sm text-muted transition-colors duration-150 hover:bg-elevated hover:text-fg"
            >
              <Store className="size-4 shrink-0" strokeWidth={1.75} />
              Create Listing
            </button>
          </div>
          <p className="mt-4 mb-2 px-1 text-xs font-medium tracking-wide text-subtle uppercase">
            BSC Bankability
          </p>
          <div className="flex flex-col gap-1">
            <button
              type="button"
              onClick={() => send("6-Domain Evaluation")}
              className="flex min-h-11 items-center gap-3 rounded-md px-3 text-left text-sm text-muted transition-colors duration-150 hover:bg-elevated hover:text-fg"
            >
              <ClipboardCheck className="size-4 shrink-0" strokeWidth={1.75} />
              6-Domain Evaluation
            </button>
            <button
              type="button"
              onClick={() => send("bankability pathway")}
              className="flex min-h-11 items-center gap-3 rounded-md px-3 text-left text-sm text-muted transition-colors duration-150 hover:bg-elevated hover:text-fg"
            >
              <Route className="size-4 shrink-0" strokeWidth={1.75} />
              View My Pathway
            </button>
            <button
              type="button"
              onClick={() => send("find financing")}
              className="flex min-h-11 items-center gap-3 rounded-md px-3 text-left text-sm text-muted transition-colors duration-150 hover:bg-elevated hover:text-fg"
            >
              <Handshake className="size-4 shrink-0" strokeWidth={1.75} />
              Find Financing Matches
            </button>
            <button
              type="button"
              onClick={() => send("risk monitoring check")}
              className="flex min-h-11 items-center gap-3 rounded-md px-3 text-left text-sm text-muted transition-colors duration-150 hover:bg-elevated hover:text-fg"
            >
              <ShieldAlert className="size-4 shrink-0" strokeWidth={1.75} />
              Risk Monitoring Check
            </button>
          </div>
          <p className="mt-4 mb-2 px-1 text-xs font-medium tracking-wide text-subtle uppercase">
            Simulated Membership
          </p>
          <div className="flex flex-wrap gap-1.5 px-1">
            {(["Guest", "Basic", "Premium", "Enterprise"] as MembershipTier[]).map((tier) => (
              <button
                key={tier}
                type="button"
                data-keep-open
                onClick={() => setMemberTier(tier)}
                className={cn(
                  "rounded-full border px-2.5 py-1 text-xs transition-colors duration-150",
                  memberTier === tier
                    ? "border-accent/40 bg-elevated text-fg"
                    : "border-border text-muted hover:bg-elevated hover:text-fg",
                )}
              >
                {tier}
              </button>
            ))}
          </div>
          <p className="mt-1.5 px-1 text-[11px] leading-relaxed text-subtle">
            No real billing exists — this switches a demo tier to show the gating logic described in the spec.
          </p>
    </>
  );

  return (
    <div className="flex min-h-dvh flex-col bg-bg text-fg lg:h-dvh lg:flex-row lg:overflow-hidden">
      <aside className="border-b border-border bg-surface lg:flex lg:w-72 lg:shrink-0 lg:flex-col lg:overflow-y-auto lg:border-b-0 lg:border-r">
        <div className="px-5 py-5 lg:px-6 lg:py-7">
          <p className="font-display text-xs font-medium tracking-[0.18em] text-muted uppercase">
            Caribbean SMEs
          </p>
          <h1 className="mt-1 font-display text-2xl font-medium tracking-tight text-fg">RESET Trade</h1>
          <p className="mt-2 max-w-sm text-sm leading-relaxed text-muted">
            Intelligence for exporters — readiness, agreements, markets, finance, and procurement.
          </p>
        </div>
        <Separator className="hidden lg:block" />
        <div className="px-4 pb-4 lg:flex-1 lg:px-5 lg:py-5">
          <p className="mb-2 px-1 text-xs font-medium tracking-wide text-subtle uppercase">Advisor</p>
          <div className="flex gap-2 overflow-x-auto pb-2 lg:flex-col lg:overflow-visible lg:pb-0">
            {(Object.values(AGENTS) as (typeof AGENTS)[AgentId][]).map((a) => {
              const Icon = AGENT_ICONS[a.id];
              const active = agent === a.id;
              return (
                <button
                  key={a.id}
                  type="button"
                  onClick={() => setAgent(a.id)}
                  className={cn(
                    "flex min-h-11 min-w-[9.5rem] items-center gap-3 rounded-md border px-3 py-2 text-left transition-colors duration-150 lg:min-w-0 lg:w-full",
                    active
                      ? "border-accent/40 bg-elevated text-fg"
                      : "border-transparent bg-transparent text-muted hover:bg-elevated hover:text-fg",
                  )}
                >
                  <Icon className="size-4 shrink-0" strokeWidth={1.75} />
                  <span className="min-w-0">
                    <span className="block text-sm font-medium">{a.label}</span>
                    <span className="hidden text-xs text-subtle lg:block">{a.role}</span>
                  </span>
                </button>
              );
            })}
          </div>
          <div className="hidden lg:block">
            {navSections}
          </div>
        </div>
        <div className="hidden border-t border-border px-5 py-4 lg:block">
          <Button variant="ghost" size="sm" className="w-full justify-start" onClick={reset}>
            <RotateCcw className="size-4" />
            New conversation
          </Button>
        </div>
      </aside>

      {mobileMenuOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileMenuOpen(false)} aria-hidden="true" />
          <div
            className="absolute inset-y-0 left-0 flex w-80 max-w-[85vw] flex-col overflow-y-auto bg-surface px-4 py-5"
            role="dialog"
            aria-label="Menu"
            onClick={(e) => {
              const btn = (e.target as HTMLElement).closest("button");
              if (btn && !btn.hasAttribute("data-keep-open")) setMobileMenuOpen(false);
            }}
          >
            <div className="mb-2 flex items-center justify-between">
              <p className="font-display text-lg font-medium tracking-tight">Menu</p>
              <Button variant="ghost" size="icon" aria-label="Close menu">
                <X className="size-4" />
              </Button>
            </div>
            {navSections}
            <div className="mt-6 border-t border-border pt-4">
              <Button variant="ghost" size="sm" className="w-full justify-start" onClick={reset}>
                <RotateCcw className="size-4" />
                New conversation
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      <section className="flex min-h-0 flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-border px-4 py-3 lg:px-8">
          <div>
            <p className="text-sm font-medium">{AGENTS[agent].label} desk</p>
            <p className="text-xs text-muted">{AGENTS[agent].description}</p>
          </div>
          <div className="flex items-center gap-1 lg:hidden">
            <Button variant="ghost" size="icon" onClick={() => setMobileMenuOpen(true)} aria-label="Open menu">
              <Menu className="size-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={reset} aria-label="New conversation">
              <RotateCcw className="size-4" />
            </Button>
          </div>
        </header>

        {assessment.active && currentDim ? (
          <div className="border-b border-border bg-elevated/60 px-4 py-2 lg:px-8">
            <p className="text-xs text-muted">
              {assessment.kind === "bsc" ? "6-Domain Evaluation" : "Assessment"} {progress}/{progressTotal} ·{" "}
              {currentDim.name}
            </p>
            <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-border">
              <div
                className="h-full bg-accent transition-[width] duration-200"
                style={{ width: `${(progress / progressTotal) * 100}%` }}
              />
            </div>
          </div>
        ) : null}

        <div ref={scroller} className="min-h-0 flex-1 overflow-y-auto px-4 py-5 lg:px-8 lg:py-6">
          <div className="mx-auto flex max-w-2xl flex-col gap-4">
            {messages.length === 1 ? (
              <>
                <div className="rounded-lg border border-border bg-elevated p-4">
                  <p className="font-display text-base font-medium tracking-tight">Welcome to RESET Trade & BSC</p>
                  <p className="mt-2 text-sm leading-relaxed text-muted">
                    This platform has two connected parts. <strong className="text-fg">Trade Intelligence</strong>{" "}
                    covers six tools — export readiness, the EPA, market access, export finance, procurement, and
                    trade agreements. The <strong className="text-fg">Business Support Centre</strong> evaluates your
                    business across 6 domains, builds a path toward bankability certification, and connects you to
                    financing, consulting, training, and the marketplace.
                  </p>
                  <p className="mt-2 text-sm leading-relaxed text-muted">
                    Not sure where to start? Create a quick business profile and we'll suggest the right next step.
                  </p>
                  <p className="mt-2 text-xs leading-relaxed text-subtle">
                    Note: some Business Support Centre features require "Basic" membership or higher. This is
                    simulated for now (no real billing) — switch freely using the selector in the sidebar.
                  </p>
                  <div className="mt-3">
                    <Button type="button" size="sm" onClick={() => send("business guidance")}>
                      Create My Business Profile
                    </Button>
                  </div>
                  <p className="mt-3 text-xs text-subtle">
                    Or jump straight to a Trade Intelligence tool below, or explore the sidebar for everything else.
                  </p>
                </div>
                <div className="rounded-lg border border-border bg-surface p-3">
                  <p className="text-xs font-medium tracking-wide text-subtle uppercase">Where are you based?</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {[
                      ["jamaica", "Jamaica"],
                      ["barbados", "Barbados"],
                      ["trinidad_tobago", "Trinidad and Tobago"],
                      ["guyana", "Guyana"],
                    ].map(([id, label]) => (
                      <Button
                        key={id}
                        type="button"
                        variant={territory === id ? "default" : "secondary"}
                        size="sm"
                        onClick={() => chooseTerritory(id, label)}
                      >
                        {label}
                      </Button>
                    ))}
                  </div>
                  {territory ? (
                    <p className="mt-2 text-xs text-muted">
                      Showing territory-specific guidance for{" "}
                      {territory === "trinidad_tobago" ? "Trinidad and Tobago" : territory.charAt(0).toUpperCase() + territory.slice(1)}{" "}
                      where available.
                    </p>
                  ) : null}
                </div>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {TOOLS.map((t, i) => {
                    const Icon = TOOL_ICONS[i];
                    return (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => send(t.prompt)}
                        className="flex min-h-[5.5rem] flex-col items-start gap-2 rounded-lg border border-border bg-surface p-3 text-left transition-colors duration-150 hover:bg-elevated"
                      >
                        <Icon className="size-4 text-accent" strokeWidth={1.75} />
                        <span className="text-sm font-medium leading-snug">{t.label}</span>
                      </button>
                    );
                  })}
                </div>
              </>
            ) : null}

            {messages.map((msg) => (
              <MessageView key={msg.id} message={msg} onRelated={(p) => send(p)} completedCourses={completedCourses} />
            ))}

            {busy ? (
              <p className="text-sm text-muted">
                <span className="shimmer">Thinking</span>
              </p>
            ) : null}
          </div>
        </div>

        <form
          className="border-t border-border bg-surface px-4 py-3 lg:px-8"
          onSubmit={(e) => {
            e.preventDefault();
            void send(input);
          }}
        >
          <div className="mx-auto flex max-w-2xl gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={
                assessment.active
                  ? "Reply with a number from 1 to 5"
                  : "Ask about EPA, tariffs, finance, CSME…"
              }
              aria-label="Message"
              disabled={busy}
            />
            <Button type="submit" disabled={busy || !input.trim()} aria-label="Send">
              <Send className="size-4" />
            </Button>
          </div>
          <div className="mx-auto mt-2 flex max-w-2xl gap-2 overflow-x-auto pb-1 lg:hidden">
            {TOOLS.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => send(t.prompt)}
                className="shrink-0 rounded-full border border-border px-3 py-1.5 text-xs text-muted"
              >
                {t.label}
              </button>
            ))}
          </div>
        </form>
      </section>
    </div>
  );
}

function MessageView({
  message,
  onRelated,
  completedCourses,
}: {
  message: Message;
  onRelated: (prompt: string) => void;
  completedCourses: Set<string>;
}) {
  if (message.role === "user") {
    return (
      <div className="flex justify-end">
        <div className="max-w-[85%] rounded-lg rounded-br-xs bg-elevated px-4 py-2.5 text-sm leading-relaxed">
          {message.text}
        </div>
      </div>
    );
  }

  if (message.kind === "knowledge") {
    const { card } = message;
    return (
      <article className="rounded-xl border border-border bg-surface p-5">
        <h2 className="font-display text-lg font-medium tracking-tight">{card.title}</h2>
        <p className="mt-2 text-sm leading-relaxed text-muted">{card.summary}</p>
        <ul className="mt-4 space-y-2 text-sm leading-relaxed">
          {card.points.map((p) => (
            <li key={p} className="flex gap-2">
              <span className="mt-2 size-1 shrink-0 rounded-full bg-accent" />
              <span>{p}</span>
            </li>
          ))}
        </ul>
        {card.nextSteps?.length ? (
          <div className="mt-4 border-t border-border pt-4">
            <p className="text-xs font-medium tracking-wide text-subtle uppercase">Next steps</p>
            <ul className="mt-2 space-y-2 text-sm leading-relaxed">
              {card.nextSteps.map((s) => (
                <li key={s} className="flex gap-2">
                  <CircleCheck className="mt-0.5 size-4 shrink-0 text-accent" strokeWidth={1.75} />
                  <span>{s}</span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
        {card.title === "EU–CARIFORUM EPA Overview" ? (
          <div className="mt-4 border-t border-border pt-4">
            <p className="text-xs font-medium tracking-wide text-subtle uppercase">
              What does your business make or do?
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {[
                ["Agro-processing & food", "EPA guidance for agro-processing and food products"],
                ["Garments & textiles", "EPA guidance for garments and textiles"],
                ["ICT & BPO", "EPA guidance for ICT and BPO services"],
                ["Tourism", "EPA guidance for tourism services"],
                ["Professional services", "EPA guidance for professional services"],
                ["Creative industries", "EPA guidance for creative industries"],
              ].map(([label, prompt]) => (
                <Button key={label} type="button" variant="secondary" size="sm" onClick={() => onRelated(prompt)}>
                  {label}
                </Button>
              ))}
            </div>
          </div>
        ) : null}
        {card.title === "Caribbean Trade Agreements Overview" ? (
          <div className="mt-4 border-t border-border pt-4">
            <p className="text-xs font-medium tracking-wide text-subtle uppercase">Where do you want to sell?</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {[
                ["CARICOM markets", "Tell me about CSME"],
                ["United Kingdom", "Tell me about the UK-CARIFORUM trade agreement"],
                ["European Union", "Tell me about the EU EPA"],
                ["Nearby markets", "Tell me about bilateral trade agreements"],
                ["Other developed markets", "Tell me about GSP preferences"],
              ].map(([label, prompt]) => (
                <Button key={label} type="button" variant="secondary" size="sm" onClick={() => onRelated(prompt)}>
                  {label}
                </Button>
              ))}
            </div>
          </div>
        ) : null}
        {card.title === "Market Access Overview" ? (
          <div className="mt-4 border-t border-border pt-4">
            <p className="text-xs font-medium tracking-wide text-subtle uppercase">What do you need to figure out?</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {[
                ["Tariffs & preferences", "Tell me about tariffs"],
                ["Technical standards", "Tell me about technical standards"],
                ["Finding buyers", "Tell me about buyer intelligence"],
                ["How to enter the market", "Tell me about market entry approaches"],
              ].map(([label, prompt]) => (
                <Button key={label} type="button" variant="secondary" size="sm" onClick={() => onRelated(prompt)}>
                  {label}
                </Button>
              ))}
            </div>
          </div>
        ) : null}
        {card.related?.length ? (
          <div className="mt-4 flex flex-wrap gap-2">
            {card.related.map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => onRelated(r)}
                className="rounded-full border border-border px-3 py-1.5 text-xs text-muted hover:bg-elevated hover:text-fg"
              >
                {r}
              </button>
            ))}
          </div>
        ) : null}
      </article>
    );
  }

  if (message.kind === "question") {
    return (
      <article className="rounded-xl border border-border bg-surface p-5">
        <Badge>
          Question {message.step} of {message.total} · {message.name}
        </Badge>
        <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed">{message.question}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          {[1, 2, 3, 4, 5].map((n) => (
            <Button key={n} type="button" variant="secondary" size="sm" onClick={() => onRelated(String(n))}>
              {n}
            </Button>
          ))}
        </div>
      </article>
    );
  }

  if (message.kind === "choice-question") {
    return (
      <article className="rounded-xl border border-border bg-surface p-5">
        <Badge>
          Question {message.step} of {message.total} · {message.name}
        </Badge>
        <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed">{message.question}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          {message.options.map((opt) => (
            <Button key={opt} type="button" variant="secondary" size="sm" onClick={() => onRelated(opt)}>
              {opt}
            </Button>
          ))}
        </div>
      </article>
    );
  }

  if (message.kind === "text-question") {
    return (
      <article className="rounded-xl border border-border bg-surface p-5">
        <Badge>
          Question {message.step} of {message.total} · {message.name}
        </Badge>
        <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed">{message.question}</p>
        <p className="mt-3 text-xs text-subtle">Type your answer in the message box below.</p>
      </article>
    );
  }

  if (message.kind === "business-plan") {
    const s = message.summary;
    return (
      <article className="rounded-xl border border-border bg-surface p-5">
        <p className="text-xs font-medium tracking-wide text-subtle uppercase">Business Plan Summary</p>
        <div className="mt-3 space-y-3 text-sm leading-relaxed">
          <div>
            <p className="text-xs font-medium text-muted uppercase tracking-wide">Problem</p>
            <p className="mt-0.5">{s.problem}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-muted uppercase tracking-wide">Solution</p>
            <p className="mt-0.5">{s.solution}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-muted uppercase tracking-wide">Target Market</p>
            <p className="mt-0.5">{s.market}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-muted uppercase tracking-wide">Revenue Model</p>
            <p className="mt-0.5">{s.revenueModel}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-muted uppercase tracking-wide">Team</p>
            <p className="mt-0.5">{s.team}</p>
          </div>
        </div>
        <div className="mt-4 border-t border-border pt-4">
          <Button type="button" variant="secondary" size="sm" onClick={() => onRelated("financial projections")}>
            Add Financial Projections
          </Button>
        </div>
      </article>
    );
  }

  if (message.kind === "projections") {
    return (
      <article className="rounded-xl border border-border bg-surface p-5">
        <p className="text-xs font-medium tracking-wide text-subtle uppercase">3-Year Financial Projections</p>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-xs text-muted">
                <th className="py-1.5 text-left font-medium">Year</th>
                <th className="py-1.5 text-right font-medium">Revenue</th>
                <th className="py-1.5 text-right font-medium">Expenses</th>
                <th className="py-1.5 text-right font-medium">Cash Flow</th>
                <th className="py-1.5 text-right font-medium">Cumulative</th>
              </tr>
            </thead>
            <tbody>
              {message.years.map((y) => (
                <tr key={y.year} className="border-b border-border/60">
                  <td className="py-1.5">Year {y.year}</td>
                  <td className="py-1.5 text-right tabular-nums">${y.revenue.toLocaleString()}</td>
                  <td className="py-1.5 text-right tabular-nums">${y.expenses.toLocaleString()}</td>
                  <td className="py-1.5 text-right tabular-nums">${y.cashFlow.toLocaleString()}</td>
                  <td className="py-1.5 text-right tabular-nums">${y.cumulativeCashFlow.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-xs leading-relaxed text-subtle">
          Projections apply your stated growth rates evenly each year — a simplified model for planning purposes, not
          a substitute for a qualified accountant's review.
        </p>
      </article>
    );
  }

  if (message.kind === "skill-gap") {
    const { outcome } = message;
    if (!outcome.eligible) {
      return (
        <article className="rounded-xl border border-border bg-surface p-5">
          <p className="text-xs font-medium tracking-wide text-subtle uppercase">Skill Gap Analysis</p>
          <p className="mt-3 text-sm leading-relaxed">{outcome.reason}</p>
        </article>
      );
    }
    return (
      <article className="rounded-xl border border-border bg-surface p-5">
        <p className="text-xs font-medium tracking-wide text-subtle uppercase">Skill Gap Analysis</p>
        {outcome.gaps.length === 0 ? (
          <p className="mt-3 text-sm leading-relaxed">
            No significant gaps identified — all domains scored 4 or higher on your last evaluation.
          </p>
        ) : (
          <div className="mt-3 flex flex-col gap-3">
            {outcome.gaps.map((gap) => {
              const done = completedCourses.has(gap.course.id);
              return (
                <div key={gap.course.id} className="rounded-lg border border-border p-3">
                  <p className="text-xs text-muted">
                    {gap.domain} scored {gap.score}/5
                  </p>
                  <p className="mt-1 text-sm font-medium">{gap.course.title}</p>
                  <p className="mt-1 text-xs leading-relaxed text-muted">{gap.course.description}</p>
                  <p className="mt-1 text-xs text-subtle">{gap.course.durationHours} hours</p>
                  <div className="mt-2">
                    {done ? (
                      <Badge className="text-status-green border-status-green/40">Completed</Badge>
                    ) : (
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={() => onRelated(`complete course ${gap.course.id}`)}
                      >
                        Mark Complete
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </article>
    );
  }

  if (message.kind === "course-complete") {
    return (
      <article className="rounded-xl border border-border bg-surface p-5">
        <p className="text-xs font-medium tracking-wide text-subtle uppercase">Course Completed</p>
        <p className="mt-3 text-sm leading-relaxed">
          Marked "{message.courseTitle}" complete for this session. This doesn't automatically change your stored
          evaluation score — re-take the 6-Domain Evaluation to reflect genuine improvement in your domain scores, per
          how the spec says training completions feed scoring.
        </p>
      </article>
    );
  }

  if (message.kind === "listings-browse") {
    return (
      <article className="rounded-xl border border-border bg-surface p-5">
        <p className="text-xs font-medium tracking-wide text-subtle uppercase">Marketplace Listings</p>
        {message.listings.length === 0 ? (
          <p className="mt-3 text-sm leading-relaxed text-muted">
            No listings yet this session. Create one to see it appear here — listings are session-only; real
            persistence across visits would need a backend.
          </p>
        ) : (
          <div className="mt-3 flex flex-col gap-3">
            {message.listings.map((l) => (
              <div key={l.id} className="rounded-lg border border-border p-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-medium">{l.title}</p>
                  <Badge>{l.qualityScore}/100</Badge>
                </div>
                <p className="mt-1 text-xs text-muted">{l.category}</p>
                <p className="mt-1 text-xs leading-relaxed">{l.description}</p>
                <p className="mt-1 text-xs text-subtle">{l.price}</p>
              </div>
            ))}
          </div>
        )}
      </article>
    );
  }

  if (message.kind === "listing-created") {
    const { listing } = message;
    return (
      <article className="rounded-xl border border-border bg-surface p-5">
        <p className="text-xs font-medium tracking-wide text-subtle uppercase">Listing Created</p>
        <p className="mt-2 text-sm font-medium">{listing.title}</p>
        <div className="mt-2 flex flex-wrap items-end gap-3">
          <p className="font-display text-3xl font-medium tabular-nums tracking-tight">
            {listing.qualityScore}
            <span className="text-base text-muted">/100 quality</span>
          </p>
        </div>
        <ul className="mt-3 space-y-1.5 text-xs leading-relaxed">
          {listing.qualityFactors.map((f) => (
            <li key={f.label} className="flex gap-2">
              <span className={cn("mt-1 size-1.5 shrink-0 rounded-full", f.met ? "bg-status-green" : "bg-status-red")} />
              <span className={f.met ? "" : "text-muted"}>{f.label}</span>
            </li>
          ))}
        </ul>
        <div className="mt-4 border-t border-border pt-4">
          <p className="text-xs font-medium tracking-wide text-subtle uppercase">Demand Signal</p>
          <p className="mt-2 text-sm leading-relaxed text-muted">{getDemandSignal(listing.category)}</p>
        </div>
        <p className="mt-3 text-xs leading-relaxed text-subtle">
          This listing would feed your Market Potential domain score in a full implementation — re-take the 6-Domain
          Evaluation to reflect genuine improvement.
        </p>
      </article>
    );
  }

  if (message.kind === "listing-limit") {
    return (
      <article className="rounded-xl border border-dashed border-border bg-surface p-5">
        <p className="text-xs font-medium tracking-wide text-subtle uppercase">Listing Limit Reached</p>
        <p className="mt-3 text-sm leading-relaxed">
          Your <strong>{message.tier}</strong> tier allows{" "}
          {message.limit === Infinity ? "unlimited" : message.limit} listing{message.limit === 1 ? "" : "s"}. Use the
          "Simulated Membership" selector to try a higher tier.
        </p>
      </article>
    );
  }

  if (message.kind === "profile") {
    const { profile, suggestedNextStep } = message;
    return (
      <article className="rounded-xl border border-border bg-surface p-5">
        <p className="text-xs font-medium tracking-wide text-subtle uppercase">Business Profile Created</p>
        <div className="mt-3 space-y-1.5 text-sm leading-relaxed">
          <p>
            <span className="text-muted">Stage:</span> {profile.stage}
          </p>
          <p>
            <span className="text-muted">Sector:</span> {profile.sector}
          </p>
          <p>
            <span className="text-muted">Primary challenge:</span> {profile.challenge}
          </p>
          <p>
            <span className="text-muted">12-month objective:</span> {profile.objective}
          </p>
        </div>
        <div className="mt-4 border-t border-border pt-4">
          <p className="text-xs font-medium tracking-wide text-subtle uppercase">Suggested Next Step</p>
          <p className="mt-2 text-sm leading-relaxed">{suggestedNextStep}</p>
        </div>
        <div className="mt-4">
          <Button type="button" variant="secondary" size="sm" onClick={() => onRelated("6-Domain Evaluation")}>
            Start 6-Domain Evaluation
          </Button>
        </div>
      </article>
    );
  }

  if (message.kind === "gate") {
    const featureLabel: Record<string, string> = {
      evaluation: "the 6-Domain Evaluation",
      pathway: "the Bankability Pathway",
      matching: "AI Financial Matching",
      riskMonitoring: "the Risk Monitoring Check",
    };
    return (
      <article className="rounded-xl border border-dashed border-border bg-surface p-5">
        <p className="text-xs font-medium tracking-wide text-subtle uppercase">Membership Required</p>
        <p className="mt-3 text-sm leading-relaxed">
          {featureLabel[message.feature] ?? "This feature"} requires <strong>{message.requiredTier}</strong> membership
          or higher. Use the "Simulated Membership" selector in the sidebar to try the gating logic — no real billing
          exists yet.
        </p>
      </article>
    );
  }

  if (message.kind === "risk-result") {
    const r = message.result;
    const statusTone: Record<string, string> = {
      Green: "text-status-green border-status-green/40",
      Amber: "text-status-amber border-status-amber/40",
      Red: "text-status-red border-status-red/40",
    };
    return (
      <article className="rounded-xl border border-border bg-surface p-5">
        <p className="text-xs font-medium tracking-wide text-subtle uppercase">Risk Monitoring Check</p>
        <p className="mt-2 font-display text-3xl font-medium tabular-nums tracking-tight">
          {r.overallScore}
          <span className="text-lg text-muted">/100</span>
        </p>
        <div className="mt-4 space-y-2">
          {r.categories.map((c) => (
            <div key={c.key} className="flex items-center justify-between gap-2">
              <span className="text-sm">{c.name}</span>
              <Badge className={statusTone[c.status]}>{c.status}</Badge>
            </div>
          ))}
        </div>
        <div className="mt-4 border-t border-border pt-4">
          <p className="text-xs font-medium tracking-wide text-subtle uppercase">Scenario</p>
          <p className="mt-2 text-sm leading-relaxed text-muted">{r.scenario}</p>
        </div>
        {r.mitigations.length > 0 ? (
          <div className="mt-4 border-t border-border pt-4">
            <p className="text-xs font-medium tracking-wide text-subtle uppercase">Suggested Mitigations</p>
            <ul className="mt-2 space-y-2 text-sm leading-relaxed">
              {r.mitigations.map((m) => (
                <li key={m.category} className="flex gap-2">
                  <span className="mt-2 size-1 shrink-0 rounded-full bg-accent" />
                  <span>
                    <span className="font-medium">{m.category}</span> — {m.suggestion}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </article>
    );
  }

  if (message.kind === "result") {
    const r = message.result;
    const tone =
      r.status === "Green"
        ? "text-status-green border-status-green/40"
        : r.status === "Amber"
          ? "text-status-amber border-status-amber/40"
          : "text-status-red border-status-red/40";
    return (
      <article className="rounded-xl border border-border bg-surface p-5">
        <p className="text-xs font-medium tracking-wide text-subtle uppercase">Final result</p>
        <div className="mt-2 flex flex-wrap items-end gap-3">
          <p className="font-display text-4xl font-medium tabular-nums tracking-tight">
            {r.overallScore}
            <span className="text-lg text-muted">/100</span>
          </p>
          <Badge className={tone}>{r.status}</Badge>
        </div>
        <p className="mt-3 text-sm leading-relaxed text-muted">{r.message}</p>
        <div className="mt-5 space-y-3">
          {r.dimensions.map((d) => (
            <div key={d.key}>
              <div className="mb-1 flex justify-between text-xs text-muted">
                <span>{d.name}</span>
                <span className="tabular-nums">{d.score}/5</span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-border">
                <div className="h-full bg-accent" style={{ width: `${(d.score / 5) * 100}%` }} />
              </div>
            </div>
          ))}
        </div>
        <h3 className="mt-5 text-sm font-medium">Recommendations</h3>
        <ul className="mt-2 space-y-2 text-sm leading-relaxed">
          {r.recommendations.map((rec) => (
            <li key={rec} className="flex gap-2">
              <span className="mt-2 size-1 shrink-0 rounded-full bg-accent" />
              <span>{rec}</span>
            </li>
          ))}
        </ul>
      </article>
    );
  }

  if (message.kind === "bsc-result") {
    const r = message.result;
    const tone =
      r.rating === "Strong"
        ? "text-status-green border-status-green/40"
        : r.rating === "Bankable"
          ? "text-status-green border-status-green/40"
          : r.rating === "Developing"
            ? "text-status-amber border-status-amber/40"
            : "text-status-red border-status-red/40";
    return (
      <article className="rounded-xl border border-border bg-surface p-5">
        <p className="text-xs font-medium tracking-wide text-subtle uppercase">BSC 6-Domain Evaluation</p>
        <div className="mt-2 flex flex-wrap items-end gap-3">
          <p className="font-display text-4xl font-medium tabular-nums tracking-tight">
            {r.overallScore}
            <span className="text-lg text-muted">/100</span>
          </p>
          <Badge className={tone}>{r.rating}</Badge>
        </div>
        <p className="mt-3 text-sm leading-relaxed text-muted">{r.message}</p>
        <div className="mt-5 space-y-3">
          {r.domains.map((d) => (
            <div key={d.key}>
              <div className="mb-1 flex justify-between text-xs text-muted">
                <span>{d.name}</span>
                <span className="tabular-nums">{d.score}/5</span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-border">
                <div className="h-full bg-accent" style={{ width: `${(d.score / 5) * 100}%` }} />
              </div>
            </div>
          ))}
        </div>
        <h3 className="mt-5 text-sm font-medium">Recommendations</h3>
        <ul className="mt-2 space-y-2 text-sm leading-relaxed">
          {r.recommendations.map((rec) => (
            <li key={rec} className="flex gap-2">
              <span className="mt-2 size-1 shrink-0 rounded-full bg-accent" />
              <span>{rec}</span>
            </li>
          ))}
        </ul>
        <div className="mt-4 flex flex-wrap gap-2 border-t border-border pt-4">
          <Button type="button" variant="secondary" size="sm" onClick={() => onRelated("bankability pathway")}>
            View Bankability Pathway
          </Button>
          <Button type="button" variant="secondary" size="sm" onClick={() => onRelated("find financing")}>
            Find Financing Matches
          </Button>
        </div>
      </article>
    );
  }

  if (message.kind === "pathway") {
    const statusLabel: Record<string, string> = {
      complete: "Complete",
      current: "In progress",
      eligible: "Eligible",
      locked: "Locked",
    };
    const statusTone: Record<string, string> = {
      complete: "text-status-green border-status-green/40",
      current: "text-status-amber border-status-amber/40",
      eligible: "text-status-green border-status-green/40",
      locked: "border-border text-subtle",
    };
    return (
      <article className="rounded-xl border border-border bg-surface p-5">
        <p className="text-xs font-medium tracking-wide text-subtle uppercase">Bankability Pathway</p>
        <div className="mt-4 flex flex-col gap-4">
          {message.phases.map((phase, i) => (
            <div key={phase.key} className="relative pl-6">
              {i < message.phases.length - 1 ? (
                <span className="absolute top-6 left-[7px] h-[calc(100%+0.75rem)] w-px bg-border" />
              ) : null}
              <span
                className={cn(
                  "absolute top-1 left-0 size-3.5 rounded-full border-2",
                  phase.status === "locked" ? "border-border bg-surface" : "border-accent bg-accent",
                )}
              />
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-sm font-medium">{phase.name}</h3>
                <Badge className={statusTone[phase.status]}>{statusLabel[phase.status]}</Badge>
              </div>
              <p className="mt-1 text-sm leading-relaxed text-muted">{phase.description}</p>
              {phase.detail ? <p className="mt-1 text-xs leading-relaxed text-subtle">{phase.detail}</p> : null}
              {phase.items?.length ? (
                <ul className="mt-2 space-y-1.5 text-xs leading-relaxed">
                  {phase.items.map((item, idx) => (
                    <li key={idx} className="flex gap-2">
                      <span className="mt-1.5 size-1 shrink-0 rounded-full bg-accent" />
                      <span>
                        <span className="font-medium">{item.domain}</span> — {item.action}{" "}
                        <span className="text-subtle">({item.category})</span>
                        {item.prompt ? (
                          <>
                            {" "}
                            <button
                              type="button"
                              onClick={() => onRelated(item.prompt!)}
                              className="text-accent underline underline-offset-2 hover:no-underline"
                            >
                              Start now →
                            </button>
                          </>
                        ) : null}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          ))}
        </div>
      </article>
    );
  }

  if (message.kind === "matching") {
    const { outcome } = message;
    if (!outcome.eligible) {
      return (
        <article className="rounded-xl border border-border bg-surface p-5">
          <p className="text-xs font-medium tracking-wide text-subtle uppercase">AI Financial Matching</p>
          <p className="mt-3 text-sm leading-relaxed">{outcome.reason}</p>
        </article>
      );
    }
    return (
      <article className="rounded-xl border border-border bg-surface p-5">
        <p className="text-xs font-medium tracking-wide text-subtle uppercase">AI Financial Matching</p>
        <div className="mt-2 rounded-md border border-dashed border-border bg-elevated/60 px-3 py-2 text-xs leading-relaxed text-muted">
          These are illustrative example lender profiles used to demonstrate the matching framework — not real
          financial institutions. No actual FI partnerships exist yet on this platform.
        </div>
        {outcome.financingType || outcome.amount ? (
          <p className="mt-3 text-sm text-muted">
            Matching against: {outcome.financingType ? outcome.financingType.replace("_", " ") : "any financing type"}
            {outcome.amount ? `, approximately $${outcome.amount.toLocaleString()}` : ""}
          </p>
        ) : (
          <p className="mt-3 text-sm text-muted">
            No specific amount or financing type detected — showing all illustrative lenders you're eligible for.
            Try "I need $30,000 working capital" for a narrower match.
          </p>
        )}
        {outcome.matches.length === 0 ? (
          <p className="mt-4 text-sm leading-relaxed">
            No illustrative lenders match those specifics. Try a different amount or financing type.
          </p>
        ) : (
          <div className="mt-4 flex flex-col gap-3">
            {outcome.matches.map((fi) => (
              <div key={fi.id} className="rounded-lg border border-border p-3">
                <p className="text-sm font-medium">{fi.name} (Illustrative)</p>
                <p className="mt-1 text-xs text-muted">
                  ${fi.minAmount.toLocaleString()}–${fi.maxAmount.toLocaleString()} · {fi.indicativeRate} ·{" "}
                  {fi.indicativeTerm}
                </p>
                {fi.sectorNote ? <p className="mt-1 text-xs text-subtle">{fi.sectorNote}</p> : null}
              </div>
            ))}
          </div>
        )}
      </article>
    );
  }

  return (
    <div className="max-w-[90%] whitespace-pre-wrap text-sm leading-relaxed">{message.text}</div>
  );
}