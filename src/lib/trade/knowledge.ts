import type { KnowledgeCard } from "./types";

export const EPA: Record<string, KnowledgeCard> = {
  overview: {
    title: "EU–CARIFORUM EPA Overview",
    summary:
      "The Economic Partnership Agreement between the EU and CARIFORUM gives Caribbean exporters preferential access for goods and services, plus development cooperation and rules that support fair trade.",
    points: [
      "Duty-free, quota-free access for most goods, subject to rules of origin",
      "Services commitments, including Mode 4 (temporary movement of professionals)",
      "Development cooperation and capacity-building elements",
      "Dispute settlement and joint institutions to keep the agreement working",
    ],
    related: ["rules of origin", "EPA goods", "EPA services", "EPA procurement"],
  },
  goods: {
    title: "Trade in Goods",
    summary:
      "Most CARIFORUM industrial and agricultural goods can enter the EU duty-free if they qualify as originating products.",
    points: [
      "Most industrial and many agricultural products enter the EU duty-free",
      "Rules of origin decide whether a product qualifies for EPA preference",
      "The EUR.1 movement certificate is commonly used to prove origin",
      "A few sensitive products still have longer transition periods",
    ],
    related: ["rules of origin", "market access", "tariffs"],
  },
  services: {
    title: "Trade in Services",
    summary:
      "The EPA covers four modes of services supply. Mode 4 — temporary movement of skilled people — is a distinctive Caribbean opportunity.",
    points: [
      "Mode 1: Cross-border supply (services delivered remotely)",
      "Mode 2: Consumption abroad (the client travels to you)",
      "Mode 3: Commercial presence (setting up in the market)",
      "Mode 4: Temporary movement of skilled professionals",
    ],
    related: ["CSME", "export readiness"],
  },
  rules_of_origin: {
    title: "Rules of Origin",
    summary:
      "Rules of origin decide whether a product can claim preferential treatment under the EPA. Without origin, you pay the ordinary tariff.",
    points: [
      "Wholly obtained products (grown, mined, or caught locally) generally qualify",
      "Products with imported inputs must meet specific working or processing rules",
      "Cumulation is possible with other CARIFORUM states and, in some cases, the EU",
      "Keep EUR.1 (or approved exporter) documentation ready for customs",
    ],
    related: ["EPA goods", "tariffs", "export finance"],
  },
  procurement: {
    title: "Government Procurement under the EPA",
    summary:
      "EPA provisions open certain EU public procurement opportunities to CARIFORUM suppliers above specified value thresholds.",
    points: [
      "Above threshold, EU procurement is more accessible to CARIFORUM firms",
      "Transparency and non-discrimination principles apply",
      "Consortia help smaller firms compete for larger lots",
      "Monitor TED (Tenders Electronic Daily) regularly — deadlines are strict",
    ],
    related: ["international procurement", "TED procurement"],
  },
};

export const EPA_SECTORS: Record<string, KnowledgeCard> = {
  agro_processing: {
    title: "Agro-processing & food products",
    summary:
      "Processed food and beverage products generally qualify for EPA duty-free access if they meet rules of origin, but often also face EU food safety (SPS) requirements.",
    points: [
      "Your product must be sufficiently worked or processed in CARIFORUM to count as originating",
      "EU Sanitary and Phytosanitary (SPS) standards apply on top of tariff preference",
      "Labelling, ingredient traceability and packaging rules are often the real barrier, not the tariff",
      "You'll need a EUR.1 certificate from customs to claim preference at the EU border",
    ],
    nextSteps: [
      "Confirm your product's HS code with your territory's customs authority",
      "Check EU import requirements for your specific food category",
      "Speak to an EPA-experienced customs broker before your first shipment",
    ],
    related: ["rules of origin", "market access"],
  },
  garments_textiles: {
    title: "Garments & textiles",
    summary:
      "Textile and apparel rules of origin are stricter than most goods categories — typically requiring the product to be made from CARIFORUM (or cumulation-eligible) fabric, not just cut and sewn there.",
    points: [
      "Simple cut-and-sew from imported fabric usually does not qualify on its own",
      "Cumulation with other CARIFORUM states can help meet origin thresholds",
      "Double-transformation rules are common in this sector",
      "Design and branding value doesn't count toward origin — the transformation of materials does",
    ],
    nextSteps: [
      "Map your supply chain: where is your fabric sourced from?",
      "Ask about cumulation options if your fabric isn't CARIFORUM-origin",
      "Get an origin pre-assessment before quoting EU buyers",
    ],
    related: ["rules of origin", "export finance"],
  },
  ict_bpo: {
    title: "ICT & business process outsourcing",
    summary:
      "Digital services delivered remotely fall under Mode 1 — cross-border supply — one of the most open categories in the EPA.",
    points: [
      "Mode 1 has the fewest EU market-access restrictions of the four modes",
      "No physical presence in the EU is required to serve EU clients",
      "Data protection (GDPR) compliance matters more than trade barriers here",
      "Cross-border invoicing and tax treatment is usually the main practical friction, not the EPA",
    ],
    nextSteps: [
      "Confirm your business is set up to invoice EU clients",
      "Review GDPR basics if you'll handle EU customer data",
      "Explore EU digital services directories or B2B platforms to find buyers",
    ],
    related: ["EPA services"],
  },
  tourism_services: {
    title: "Tourism & hospitality services",
    summary:
      "Tourism-related services mainly involve Mode 2 — EU consumers travelling to consume the service in the Caribbean.",
    points: [
      "Mode 2 (consumption abroad) is the natural fit for most Caribbean tourism SMEs",
      "EPA commitments here mainly support market access and non-discrimination for EU-linked promotion",
      "Standards and certification are usually set nationally, not by the EPA",
      "Mode 3 (an EU-based presence) is more relevant for larger regional tourism groups",
    ],
    nextSteps: [
      "Focus on EU-facing marketing and distribution channels",
      "Check if your national tourism board has EU market access support",
      "Consider Mode 4 options for staff attending EU trade shows",
    ],
    related: ["market access"],
  },
  professional_services: {
    title: "Professional & consulting services",
    summary:
      "Independent professionals may be able to work temporarily in the EU under Mode 4 commitments — one of the EPA's most valuable, and most underused, provisions for Caribbean talent.",
    points: [
      "Mode 4 allows temporary movement of specific categories of skilled professionals",
      "Coverage varies by profession and EU member state — it isn't a blanket right to work in the EU",
      "Recognition of qualifications is often the real barrier, not immigration law",
      "Both contractual service supplier and independent professional categories exist under the EPA",
    ],
    nextSteps: [
      "Check whether your profession is listed in the EPA's Mode 4 schedules",
      "Look into qualification recognition for your target EU country",
      "Get a Mode 4 eligibility check before committing to travel plans",
    ],
    related: ["EPA services"],
  },
  creative_industries: {
    title: "Creative industries",
    summary:
      "Music, film, and design work can qualify under Mode 1 (digital delivery) or Mode 4 (performers and artists travelling to the EU), depending on how the work is delivered.",
    points: [
      "Digital delivery of creative work falls under Mode 1",
      "Live performance or in-person production work falls under Mode 4",
      "IP protection in the EU market is a separate but important consideration",
      "Cultural cooperation provisions in the EPA can support market entry for Caribbean creatives",
    ],
    nextSteps: [
      "Clarify whether your work will be delivered digitally or in-person in the EU",
      "Register your IP or copyright before entering EU markets",
      "Look into EU cultural exchange or co-production programmes",
    ],
    related: ["EPA services"],
  },
};

export const MARKET: Record<string, KnowledgeCard> = {
  overview: {
    title: "Market Access Overview",
    summary:
      "Market access is the set of conditions, requirements and relationships you need in order to sell into a new country or region.",
    points: [
      "Check tariffs and preferential access first",
      "Understand technical and regulatory requirements early",
      "Identify realistic buyers and distribution channels",
      "Choose an entry approach that matches current capacity",
    ],
    related: ["tariffs", "standards", "buyers", "market entry"],
  },
  tariffs: {
    title: "Tariffs & Preferences",
    summary:
      "The duty your product faces — or avoids — is one of the first market-access questions to settle.",
    points: [
      "Confirm whether EPA, UK-CARIFORUM, CSME or another preference applies",
      "Most CARIFORUM industrial goods enter the EU duty-free if origin is met",
      "Always confirm the exact HS code for your product",
      "Some agricultural products still face restrictions or longer phase-outs",
    ],
    related: ["rules of origin", "EPA goods", "CSME"],
  },
  standards: {
    title: "Technical Standards & Regulations",
    summary:
      "Meeting the technical, sanitary and labelling rules of a target market is often harder than paying the tariff.",
    points: [
      "EU markets apply strict SPS rules for food and agricultural products",
      "Labelling, packaging and product-safety standards can block entry",
      "Certifications (organic, fair trade, ISO) open doors but take investment",
      "Start compliance work months before the first shipment",
    ],
    related: ["export readiness", "EPA goods"],
  },
  buyers: {
    title: "Buyer Intelligence",
    summary:
      "Finding the right buyers — and understanding how they source — is as important as having a good product.",
    points: [
      "Look for importers, distributors and retailers already buying from the Caribbean",
      "Understand their volume, quality and certification expectations",
      "Trade fairs, B2B platforms and diaspora networks are useful starting points",
      "Build the relationship before you need the order",
    ],
    related: ["market entry", "export finance"],
  },
  entry: {
    title: "Market Entry Approaches",
    summary:
      "There is no single best way to enter a market. Match the approach to your product, capacity and cash.",
    points: [
      "Direct export to a buyer or distributor",
      "Working with an agent or trading company",
      "Using diaspora and existing networks",
      "Start with smaller test shipments before scaling",
    ],
    related: ["buyers", "export finance", "export readiness"],
  },
};

export const FINANCE: Record<string, KnowledgeCard> = {
  overview: {
    title: "Export Finance Overview",
    summary:
      "Export finance helps Caribbean businesses cover the gap between producing, shipping and getting paid for international orders.",
    points: [
      "Pre-shipment finance covers production costs",
      "Post-shipment finance covers the wait for payment",
      "Export credit insurance reduces the risk of non-payment",
      "Letters of credit provide strong payment security",
      "Development finance institutions often have special exporter programmes",
    ],
    related: ["pre-shipment finance", "letter of credit", "credit insurance"],
  },
  pre_shipment: {
    title: "Pre-shipment Finance",
    summary:
      "Financing to cover the cost of producing goods before they are shipped to the buyer.",
    points: [
      "Helps pay for raw materials, labour and packaging",
      "Usually based on a confirmed export order or letter of credit",
      "Can come from local banks or development finance institutions",
      "Reduces the cash-flow gap between production and payment",
    ],
    related: ["letter of credit", "development finance"],
  },
  post_shipment: {
    title: "Post-shipment Finance",
    summary:
      "Financing that bridges the time between shipping the goods and receiving payment.",
    points: [
      "Useful when buyers demand 30–90 day payment terms",
      "Can take the form of invoice discounting or factoring",
      "Improves cash flow after the goods have left the country",
      "Often linked to the strength of the buyer and the payment instrument",
    ],
    related: ["credit insurance", "letter of credit"],
  },
  credit_insurance: {
    title: "Export Credit Insurance",
    summary:
      "Insurance that protects the exporter against the risk of non-payment by a foreign buyer.",
    points: [
      "Covers commercial and sometimes political risks",
      "Makes banks more willing to provide export finance",
      "Especially valuable with new markets or new buyers",
      "Available through specialised insurers and some development agencies",
    ],
    related: ["post-shipment finance", "letter of credit"],
  },
  letters_of_credit: {
    title: "Letters of Credit",
    summary:
      "A bank instrument that guarantees payment to the exporter if the agreed documents are presented.",
    points: [
      "One of the safest ways to secure payment in international trade",
      "The exporter ships goods and presents documents to the bank",
      "Payment is made if the documents comply with the LC terms",
      "Understand the exact documentation requirements before you ship",
    ],
    related: ["pre-shipment finance", "rules of origin"],
  },
  development_finance: {
    title: "Development Finance & Special Programmes",
    summary:
      "Financing and support programmes offered by development banks and trade promotion organisations.",
    points: [
      "Caribbean Development Bank and similar regional institutions",
      "National programmes through trade promotion and development banks",
      "Sometimes combined with technical assistance",
      "Check regularly — facilities open and close",
    ],
    related: ["export finance", "export readiness"],
  },
};

export const PROCUREMENT: Record<string, KnowledgeCard> = {
  overview: {
    title: "International Procurement Overview",
    summary:
      "International public procurement offers real opportunities for Caribbean businesses that can meet the required standards and documentation.",
    points: [
      "EU TED is a major source under the EPA",
      "The United Nations system procures over $20 billion annually",
      "World Bank, IDB and CDB projects create regional opportunities",
      "Bilateral agencies (USAID, FCDO, GIZ, JICA) also procure regularly",
      "Registration, compliance and timely monitoring are essential",
    ],
    related: ["TED procurement", "UN procurement", "development banks"],
  },
  eu_ted: {
    title: "EU Tenders Electronic Daily (TED)",
    summary:
      "The official EU portal for public procurement notices. Many opportunities are open to CARIFORUM suppliers under the EPA.",
    points: [
      "Covers contracts above certain value thresholds across the EU",
      "Searchable by sector, country and keyword",
      "Monitor regularly — deadlines are strict",
      "EPA provisions improve access for Caribbean firms",
    ],
    related: ["EPA procurement", "international procurement"],
  },
  un: {
    title: "United Nations Procurement",
    summary:
      "The UN system procures a large volume of goods and services each year and actively encourages suppliers from developing countries.",
    points: [
      "UN Global Marketplace (UNGM) is the main registration portal",
      "Agencies include UNDP, UNICEF, WHO, WFP and many others",
      "Registration is free and opens access to tenders",
      "Particularly relevant for goods, logistics and professional services",
    ],
    related: ["international procurement"],
  },
  mdbs: {
    title: "Multilateral Development Banks",
    summary:
      "World Bank, IDB, CDB and other development banks finance projects that require goods, works and services — often open to regional suppliers.",
    points: [
      "World Bank and IDB projects create significant procurement opportunities",
      "Caribbean Development Bank projects are especially relevant regionally",
      "Many tenders are published on the banks’ own portals",
      "Consortium approaches help smaller firms compete",
    ],
    related: ["development finance", "international procurement"],
  },
  bilateral: {
    title: "Bilateral & Development Agency Opportunities",
    summary:
      "Agencies such as USAID, FCDO, GIZ and JICA regularly procure goods and services for development projects in the Caribbean and beyond.",
    points: [
      "Opportunities are often tied to specific projects or countries",
      "Some programmes prioritise local and regional suppliers",
      "Monitoring agency portals is necessary",
      "Partnerships with larger firms can improve chances of success",
    ],
    related: ["international procurement"],
  },
};

export const AGREEMENTS: Record<string, KnowledgeCard> = {
  overview: {
    title: "Caribbean Trade Agreements Overview",
    summary:
      "Caribbean businesses can combine regional and international agreements to improve market access and reduce tariffs.",
    points: [
      "CSME provides preferential access within CARICOM",
      "EU–CARIFORUM EPA and UK–CARIFORUM EPA open major developed markets",
      "Bilateral agreements expand options with nearby partners",
      "GSP and similar schemes can offer additional unilateral preferences",
      "Always check rules of origin and current product coverage",
    ],
    related: ["CSME", "EPA", "UK-CARIFORUM"],
  },
  csme: {
    title: "CARICOM Single Market and Economy (CSME)",
    summary:
      "The CSME aims to create a single economic space among CARICOM member states, with free movement of goods, services, capital and skilled people.",
    points: [
      "Most goods of CARICOM origin move duty-free between member states",
      "A Common External Tariff (CET) applies to goods from outside CARICOM",
      "Rules of origin determine whether a product qualifies as CARICOM origin",
      "Free movement of skilled categories of persons is being implemented over time",
      "A useful first market for many Caribbean exporters before going further afield",
    ],
    related: ["rules of origin", "tariffs", "EPA"],
  },
  uk_cariforum: {
    title: "UK–CARIFORUM Economic Partnership Agreement",
    summary:
      "After Brexit, the UK and CARIFORUM signed a continuity agreement that largely preserves the preferential access previously available under the EU EPA.",
    points: [
      "Maintains preferential access for most goods into the UK",
      "Rules of origin and documentation are similar to the EU EPA",
      "Important for exporters who previously sold into the UK market",
      "Check for any product-specific differences from the EU EPA",
    ],
    related: ["EPA", "rules of origin"],
  },
  bilateral: {
    title: "Bilateral & Other Preferential Arrangements",
    summary:
      "Individual CARICOM countries, or the region, have additional trade arrangements with partners such as Colombia, Cuba, the Dominican Republic and Costa Rica.",
    points: [
      "Some arrangements are CARICOM-wide; others are bilateral",
      "Preferences and rules of origin vary by agreement",
      "Always confirm current status and product coverage",
      "Can open additional nearby markets for exporters",
    ],
    related: ["CSME", "market access"],
  },
  preferences: {
    title: "GSP & Similar Preference Schemes",
    summary:
      "Some developed countries offer unilateral preferential access to developing countries under GSP or similar schemes.",
    points: [
      "Access is usually non-reciprocal",
      "Product coverage and graduation rules change over time",
      "Check eligibility and documentation requirements",
      "Can complement contractual agreements such as the EPA",
    ],
    related: ["tariffs", "EPA"],
  },
};

export const AGENTS: Record<
  string,
  { id: "guidance" | "consulting" | "training" | "marketplace"; label: string; role: string; description: string }
> = {
  guidance: {
    id: "guidance",
    label: "Guidance",
    role: "SME advisor",
    description: "Pathways, SWOT, and first-step advice for exporters.",
  },
  consulting: {
    id: "consulting",
    label: "Consulting",
    role: "Strategy partner",
    description: "Deeper plans, models, and structured recommendations.",
  },
  training: {
    id: "training",
    label: "Training",
    role: "Instructor",
    description: "Clear, step-by-step teaching on trade concepts.",
  },
  marketplace: {
    id: "marketplace",
    label: "Marketplace",
    role: "Market scout",
    description: "Buyers, tenders, and matching into live opportunities.",
  },
};

export const TOOLS = [
  { id: "readiness", label: "Export Readiness", prompt: "export readiness" },
  { id: "epa", label: "EPA Guidance", prompt: "Tell me about the EPA" },
  { id: "market", label: "Market Access", prompt: "Tell me about market access" },
  { id: "finance", label: "Export Finance", prompt: "Tell me about export finance" },
  { id: "procurement", label: "Procurement", prompt: "Tell me about international procurement" },
  { id: "agreements", label: "Trade Agreements", prompt: "Tell me about Caribbean trade agreements" },
] as const;