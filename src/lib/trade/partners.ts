import type { BusinessProfile } from "./membership";

// From BSC Technical Specification v1 Table 10 (access levels: Guest =
// Directory, Basic = Connect, Premium = Full + mentorship, Enterprise =
// Strategic) and v2 Table 20 (FI partner profiles). The spec has no
// dedicated Partner & Networks section and does not enumerate categories, so
// the five categories below are this build's own structuring.
//
// HONESTY LINES — what is deliberately NOT here:
//   - These are REAL organisations listed for reference. They are NOT RESET
//     partners, and no partnership, endorsement, or referral arrangement is
//     implied. The directory says so on screen. No real partnerships exist.
//   - Every role description below was checked against public sources. No
//     URLs, contact details, or programme specifics are included, because
//     those change and were not verified — search the organisation directly.
//   - "Connect" is NOT a send button. Nothing is sent anywhere, because there
//     is no messaging backend and no partner has agreed to receive anything.
//     Instead it drafts an enquiry the member copies and sends themselves.
//   - Premium mentorship matching and Enterprise strategic partnerships need
//     real mentors and real agreements. They are not built.
export const PARTNER_CATEGORIES = [
  { key: "promotion", label: "Export & Investment Promotion", enquiry: "what export or investment support services are available to a business like mine, and how to apply" },
  { key: "finance", label: "Development Finance", enquiry: "what financing or technical assistance options might suit a business like mine, and what the eligibility and application steps are" },
  { key: "regulation", label: "Customs, Standards & Regional Bodies", enquiry: "what registrations, licences, or documentation I need in order to export, and the correct process to follow" },
  { key: "associations", label: "Business Associations", enquiry: "what membership options and member services are available to a business like mine" },
  { key: "skills", label: "Skills & Community Development", enquiry: "what training, skills, or start-up support programmes might be available to me, and how to apply" },
] as const;

export type PartnerCategoryKey = (typeof PARTNER_CATEGORIES)[number]["key"];

export type SupportOrg = {
  id: string;
  name: string;
  category: PartnerCategoryKey;
  scope: string;
  role: string;
};

export const SUPPORT_ORGS: SupportOrg[] = [
  {
    id: "jampro",
    name: "Jamaica Promotions Corporation (JAMPRO)",
    category: "promotion",
    scope: "Jamaica",
    role: "National investment and export promotion agency. Offers export and market development services, including help with business plans.",
  },
  {
    id: "caribbean_export",
    name: "Caribbean Export Development Agency",
    category: "promotion",
    scope: "Regional — CARIFORUM (headquartered in Barbados)",
    role: "Regional trade and investment promotion agency serving the CARIFORUM states. Offers capacity building, technical assistance, grant schemes, and trade-show support, and helps firms use the CARIFORUM-EU EPA.",
  },
  {
    id: "dbj",
    name: "Development Bank of Jamaica (DBJ)",
    category: "finance",
    scope: "Jamaica",
    role: "Government-owned development bank that supports businesses, including capacity development for micro, small, and medium-sized enterprises.",
  },
  {
    id: "cdb",
    name: "Caribbean Development Bank (CDB)",
    category: "finance",
    scope: "Regional — Caribbean (headquartered in Barbados)",
    role: "Regional development bank. Runs CDB PROPEL, its technical assistance programme for micro, small, and medium-sized enterprises.",
  },
  {
    id: "jca",
    name: "Jamaica Customs Agency (JCA)",
    category: "regulation",
    scope: "Jamaica",
    role: "Jamaica's customs authority — registration, declarations, and export procedures.",
  },
  {
    id: "bced",
    name: "Barbados Customs and Excise Department (BCED)",
    category: "regulation",
    scope: "Barbados",
    role: "Barbados's customs authority — customs registration and import/export procedures.",
  },
  {
    id: "ttced",
    name: "Customs and Excise Division, Ministry of Finance",
    category: "regulation",
    scope: "Trinidad and Tobago",
    role: "Trinidad and Tobago's customs authority — import and export procedures.",
  },
  {
    id: "tt_tlu",
    name: "Trade Licence Unit, Ministry of Trade, Investment and Tourism",
    category: "regulation",
    scope: "Trinidad and Tobago",
    role: "Handles trade licensing for imports and exports.",
  },
  {
    id: "gra",
    name: "Guyana Revenue Authority (GRA)",
    category: "regulation",
    scope: "Guyana",
    role: "National revenue authority; its Customs, Excise and Trade Operations division handles customs and export declarations.",
  },
  {
    id: "crosq",
    name: "CARICOM Regional Organisation for Standards and Quality (CROSQ)",
    category: "regulation",
    scope: "Regional — CARICOM",
    role: "Develops regional standards for CARICOM member states.",
  },
  {
    id: "caricom_secretariat",
    name: "CARICOM Secretariat",
    category: "regulation",
    scope: "Regional — CARICOM (headquartered in Georgetown, Guyana)",
    role: "The administrative body of CARICOM. Runs regional programmes and initiatives that businesses can engage with.",
  },
  {
    id: "jmea",
    name: "Jamaica Manufacturers and Exporters Association (JMEA)",
    category: "associations",
    scope: "Jamaica",
    role: "Membership association for manufacturers, exporters, service providers, and MSMEs, formed in 2018 from the merger of the Jamaica Manufacturers' Association and the Jamaica Exporters' Association. Offers advocacy, export services, research, and capacity building.",
  },
  {
    id: "ttcic",
    name: "Trinidad and Tobago Chamber of Industry and Commerce",
    category: "associations",
    scope: "Trinidad and Tobago",
    role: "Private-sector chamber of industry and commerce.",
  },
  {
    id: "heart",
    name: "HEART/NSTA Trust",
    category: "skills",
    scope: "Jamaica",
    role: "Jamaica's national training and skills agency. Also supports trainee start-ups and the MSME sector.",
  },
  {
    id: "sdc",
    name: "Social Development Commission (SDC)",
    category: "skills",
    scope: "Jamaica",
    role: "Coordinates and supports Parish Development Committees across Jamaica.",
  },
];

export function isPartnerDirectory(q: string) {
  return (
    q.includes("partner directory") ||
    q.includes("partner network") ||
    q.includes("support organisations") ||
    q.includes("support organizations")
  );
}

export function parsePartnerCategory(q: string): PartnerCategoryKey | null {
  const m = q.match(/^partners category (\w+)/);
  if (!m) return null;
  return PARTNER_CATEGORIES.find((c) => c.key === m[1])?.key ?? null;
}

export function parseOutreachDraft(q: string): SupportOrg | null {
  const m = q.match(/^draft outreach (\S+)/);
  if (!m) return null;
  return SUPPORT_ORGS.find((o) => o.id === m[1]) ?? null;
}

export function orgsInCategory(category: PartnerCategoryKey): SupportOrg[] {
  return SUPPORT_ORGS.filter((o) => o.category === category);
}

export function buildOutreachDraft(org: SupportOrg, profile: BusinessProfile | null): string {
  const enquiry = PARTNER_CATEGORIES.find((c) => c.key === org.category)?.enquiry ?? "what support is available";
  const sector = profile?.sector ?? "[your sector]";
  const stage = profile?.stage ?? "[your business stage]";
  const challenge = profile?.challenge ?? "[your main challenge]";
  const objective = profile?.objective ?? "[your goal for the next 12 months]";

  return [
    "Subject: Enquiry about support for my business",
    "",
    `Hello ${org.name} team,`,
    "",
    `I'm writing to ask about ${enquiry}.`,
    "",
    "About my business:",
    `- Sector: ${sector}`,
    `- Stage: ${stage}`,
    `- Main challenge: ${challenge}`,
    `- Goal for the next 12 months: ${objective}`,
    "",
    "Could you let me know what applies to a business like mine, and the best way to get started?",
    "",
    "Thank you,",
    "[Your name]",
    "[Business name]",
    "[Phone / email]",
  ].join("\n");
}