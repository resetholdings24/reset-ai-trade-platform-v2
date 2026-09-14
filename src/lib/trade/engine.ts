import { AGREEMENTS, EPA, EPA_SECTORS, FINANCE, MARKET, PROCUREMENT } from "./knowledge";
import type { EngineReply, KnowledgeCard } from "./types";
import { isReadinessStart, nextDimension, parseScore, scoreAssessment } from "./assessment";

export type AssessmentState = {
  active: boolean;
  answers: Record<string, number>;
};

function knowledge(card: KnowledgeCard): EngineReply {
  return { kind: "knowledge", card };
}

function pick(map: Record<string, KnowledgeCard>, key: string | null): EngineReply {
  return knowledge(map[key ?? "overview"] ?? map.overview);
}

const SECTOR_KEYWORDS: Record<string, string[]> = {
  agro_processing: ["sauce", "spice", "jam", "food", "beverage", "rum", "snack", "coffee", "cocoa", "farm", "agri"],
  garments_textiles: ["garment", "textile", "clothing", "clothes", "apparel", "fabric", "sewing", "fashion", "dress", "shirt"],
  ict_bpo: ["software", "app", "website", "tech", "call center", "call centre", "data", "bpo", "digital"],
  tourism_services: ["tour", "hotel", "resort", "hospitality", "travel", "excursion"],
  professional_services: ["consult", "accounting", "legal", "engineer", "architect", "advisory"],
  creative_industries: ["music", "film", "design", "art", "creative", "media", "video", "photograph"],
};

function matchSector(q: string): string | null {
  for (const [sector, keywords] of Object.entries(SECTOR_KEYWORDS)) {
    if (keywords.some((kw) => q.includes(kw))) return sector;
  }
  return null;
}

export function routeQuery(raw: string, assessment: AssessmentState): EngineReply {
  const q = raw.toLowerCase().trim();

  if (assessment.active) {
    const score = parseScore(q);
    const next = nextDimension(assessment.answers);
    if (score != null && next) {
      const answers = { ...assessment.answers, [next.key]: score };
      const following = nextDimension(answers);
      if (following) {
        return {
          kind: "assessment-question",
          question: following.question,
          step: Object.keys(answers).length + 1,
          total: 5,
          name: following.name,
        };
      }
      return { kind: "assessment-result", result: scoreAssessment(answers) };
    }
    if (isReadinessStart(q)) {
      const first = nextDimension({});
      return {
        kind: "assessment-start",
        question: first!.question,
        step: 1,
        total: 5,
        name: first!.name,
      };
    }
    if (next && !isOtherTool(q)) {
      return {
        kind: "need-score",
        question: next.question,
        step: Object.keys(assessment.answers).length + 1,
        total: 5,
        name: next.name,
      };
    }
  }

  if (isReadinessStart(q)) {
    const first = nextDimension({});
    return {
      kind: "assessment-start",
      question: first!.question,
      step: 1,
      total: 5,
      name: first!.name,
    };
  }

  if (
    q.includes("epa") ||
    q.includes("cariforum") ||
    q.includes("rules of origin") ||
    q.includes("eur.1") ||
    q.includes("eur1")
  ) {
    const sector = matchSector(q);
    if (sector) return pick(EPA_SECTORS, sector);

    let key: string | null = null;
    if (q.includes("goods")) key = "goods";
    else if (q.includes("services") || q.includes("mode 4")) key = "services";
    else if (q.includes("origin") || q.includes("eur")) key = "rules_of_origin";
    else if (q.includes("procurement") || q.includes("tender")) key = "procurement";
    return pick(EPA, key);
  }

  const mentionsExportToEU =
    (q.includes("eu") || q.includes("europe")) &&
    (q.includes("export") || q.includes("sell") || q.includes("qualify") || q.includes("eligible"));
  if (mentionsExportToEU) {
    const sector = matchSector(q);
    if (sector) return pick(EPA_SECTORS, sector);
    return knowledge({
      title: "Tell me a bit more about your business",
      summary:
        "I couldn't match that to a specific sector yet. Is this a physical product you'd ship, or a service you'd deliver remotely or in person?",
      points: [
        "Agro-processing & food products",
        "Garments & textiles",
        "ICT & business process outsourcing",
        "Tourism & hospitality services",
        "Professional & consulting services",
        "Creative industries",
      ],
    });
  }

  if (
    q.includes("market access") ||
    q.includes("tariff") ||
    q.includes("buyer") ||
    q.includes("standards") ||
    q.includes("market entry") ||
    q.includes("importer")
  ) {
    let key: string | null = null;
    if (q.includes("tariff") || q.includes("duty") || q.includes("preference")) key = "tariffs";
    else if (q.includes("standard") || q.includes("sps") || q.includes("certification"))
      key = "standards";
    else if (q.includes("buyer") || q.includes("importer") || q.includes("distributor"))
      key = "buyers";
    else if (q.includes("entry") || q.includes("approach") || q.includes("strategy")) key = "entry";
    return pick(MARKET, key);
  }

  if (
    q.includes("export finance") ||
    q.includes("pre-shipment") ||
    q.includes("post-shipment") ||
    q.includes("letter of credit") ||
    q.includes("letters of credit") ||
    q.includes("credit insurance") ||
    q.includes("development finance") ||
    q.includes("factoring")
  ) {
    let key: string | null = null;
    if (q.includes("pre-shipment") || q.includes("preshipment")) key = "pre_shipment";
    else if (q.includes("post-shipment") || q.includes("postshipment")) key = "post_shipment";
    else if (q.includes("insurance")) key = "credit_insurance";
    else if (q.includes("letter of credit") || q.includes("letters of credit"))
      key = "letters_of_credit";
    else if (q.includes("development") || q.includes("cdb")) key = "development_finance";
    return pick(FINANCE, key);
  }

  if (
    q.includes("procurement") ||
    q.includes("tender") ||
    q.includes("ted") ||
    q.includes("ungm") ||
    q.includes("united nations") ||
    q.includes("world bank") ||
    q.includes("idb")
  ) {
    let key: string | null = null;
    if (q.includes("ted") || /\beu\b/.test(q)) key = "eu_ted";
    else if (q.includes("un") || q.includes("united nations") || q.includes("ungm")) key = "un";
    else if (
      q.includes("world bank") ||
      q.includes("idb") ||
      q.includes("cdb") ||
      q.includes("development bank")
    )
      key = "mdbs";
    else if (q.includes("usaid") || q.includes("fcdo") || q.includes("giz") || q.includes("jica"))
      key = "bilateral";
    return pick(PROCUREMENT, key);
  }

  if (
    q.includes("trade agreement") ||
    q.includes("csme") ||
    q.includes("caricom") ||
    q.includes("single market") ||
    q.includes("uk-cariforum") ||
    q.includes("gsp")
  ) {
    let key: string | null = null;
    if (q.includes("csme") || q.includes("single market") || q.includes("caricom")) key = "csme";
    else if (q.includes("uk")) key = "uk_cariforum";
    else if (q.includes("bilateral")) key = "bilateral";
    else if (q.includes("gsp") || q.includes("preference")) key = "preferences";
    return pick(AGREEMENTS, key);
  }

  return { kind: "ai" };
}

function isOtherTool(q: string) {
  return (
    q.includes("epa") ||
    q.includes("market access") ||
    q.includes("export finance") ||
    q.includes("procurement") ||
    q.includes("trade agreement") ||
    q.includes("csme")
  );
}

export function applyAssessment(raw: string, assessment: AssessmentState): AssessmentState {
  const q = raw.toLowerCase().trim();
  if (isReadinessStart(q)) return { active: true, answers: {} };
  if (!assessment.active) return assessment;
  const score = parseScore(q);
  const next = nextDimension(assessment.answers);
  if (score != null && next) {
    const answers = { ...assessment.answers, [next.key]: score };
    if (!nextDimension(answers)) return { active: false, answers };
    return { active: true, answers };
  }
  if (isOtherTool(q)) return { active: false, answers: {} };
  return assessment;
}