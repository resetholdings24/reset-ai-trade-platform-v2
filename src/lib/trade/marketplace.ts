// From BSC Technical Specification Table 6/21 ("Marketplace Agent | Trade
// broker | Smart matching, listing quality scoring, demand signals") and
// Table 20 ("Marketplace activity — successful transactions, verified
// reviews, buyer connections — feeds Market Potential domain score").
//
// Honesty line: "smart matching" against real buyers requires an actual
// marketplace with real participants — a network effect this single-session
// build cannot fabricate. What IS built honestly: real, computable listing
// quality scoring (concrete criteria, not a vague AI claim), and "demand
// signals" that cross-reference the Trade Intelligence Engine's own
// already-built EPA sector content — a genuine internal connection, not
// invented external market data.
export type Listing = {
  id: string;
  title: string;
  category: string;
  description: string;
  price: string;
  qualityScore: number;
  qualityFactors: { label: string; met: boolean }[];
};

export const LISTING_QUESTIONS = [
  { key: "title", name: "Title", question: "What are you offering? Give it a short, clear title." },
  {
    key: "category",
    name: "Category",
    question:
      "What category best fits? (e.g. agro-processing, garments & textiles, ICT & BPO, tourism, professional services, creative industries, other)",
  },
  { key: "description", name: "Description", question: "Describe what you're offering in 2–3 sentences." },
  {
    key: "price",
    name: "Price",
    question: "What's your price or rate? (e.g. \"500 USD per unit\" or \"$45/hour\")",
  },
] as const;

export function isListingStart(q: string) {
  return q.includes("create listing") || q.includes("new listing") || q.includes("list my") || q.includes("sell on marketplace");
}

export function isBrowseRequest(q: string) {
  return q.includes("browse marketplace") || q.includes("view listings") || q.includes("marketplace listings");
}

export function nextListingQuestion(answers: Record<string, string>) {
  return LISTING_QUESTIONS.find((l) => answers[l.key] == null) ?? null;
}

const SECTOR_DEMAND_SIGNALS: Record<string, string> = {
  agro: "Agro-processing & food: EPA duty-free access to the EU (subject to rules of origin) and strong CARICOM regional demand — check the EPA Intelligence Centre for specifics.",
  garment: "Garments & textiles: EPA access exists but rules of origin are strict — cumulation with CARICOM fabric sources matters. See EPA guidance for garments.",
  textile: "Garments & textiles: EPA access exists but rules of origin are strict — cumulation with CARICOM fabric sources matters. See EPA guidance for garments.",
  ict: "ICT & BPO: Mode 1 cross-border services face the fewest EU barriers under the EPA — a strong fit for digital service exports.",
  bpo: "ICT & BPO: Mode 1 cross-border services face the fewest EU barriers under the EPA — a strong fit for digital service exports.",
  tourism: "Tourism & hospitality: Mode 2 consumption-abroad is the natural EPA fit — check Location Intelligence for territory-specific tourism support.",
  professional: "Professional services: Mode 4 (temporary movement of professionals) is an underused EPA provision worth exploring for this category.",
  creative: "Creative industries: Mode 1 (digital delivery) or Mode 4 (in-person) both apply depending on delivery method — see EPA guidance for creative industries.",
};

export function getDemandSignal(category: string): string {
  const key = category.toLowerCase();
  for (const [kw, signal] of Object.entries(SECTOR_DEMAND_SIGNALS)) {
    if (key.includes(kw)) return signal;
  }
  return "No specific sector intelligence matched this category yet — check Market Access tools for general guidance on buyers and entry approaches.";
}

export function scoreListingQuality(answers: Record<string, string>): { score: number; factors: { label: string; met: boolean }[] } {
  const title = answers.title ?? "";
  const description = answers.description ?? "";
  const price = answers.price ?? "";
  const category = (answers.category ?? "").toLowerCase();

  const hasGoodTitle = title.length >= 10 && title.length <= 80;
  const hasGoodDescription = description.length >= 40;
  const hasPrice = /\d/.test(price);
  const hasKnownCategory = Object.keys(SECTOR_DEMAND_SIGNALS).some((kw) => category.includes(kw));

  const factors = [
    { label: "Clear, well-sized title (10–80 characters)", met: hasGoodTitle },
    { label: "Substantive description (40+ characters)", met: hasGoodDescription },
    { label: "Price or rate specified", met: hasPrice },
    { label: "Category matches a known sector", met: hasKnownCategory },
  ];
  const score = factors.filter((f) => f.met).length * 25;
  return { score, factors };
}

export function buildListing(answers: Record<string, string>, id: string): Listing {
  const { score, factors } = scoreListingQuality(answers);
  return {
    id,
    title: answers.title ?? "Untitled listing",
    category: answers.category ?? "Unspecified",
    description: answers.description ?? "",
    price: answers.price ?? "Not specified",
    qualityScore: score,
    qualityFactors: factors,
  };
}