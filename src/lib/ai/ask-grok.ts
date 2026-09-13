import { createServerFn } from "@tanstack/react-start";
import { AGENTS } from "@/lib/trade/knowledge";
import type { AgentId } from "@/lib/trade/types";

const PERSONAS: Record<AgentId, string> = {
  guidance:
    "You are the Guidance Agent for RESET Trade, an SME advisor for Caribbean exporters. You help with pathways, SWOT, business model thinking, and first steps. Be clear, practical, and concise.",
  consulting:
    "You are the Consulting Agent for RESET Trade. You produce structured strategic advice for Caribbean SMEs entering international markets. Be professional, specific, and action-oriented.",
  training:
    "You are the Training Agent for RESET Trade. Teach trade concepts step by step for Caribbean business owners who may be new to exporting. Use short numbered steps. Avoid jargon unless you explain it.",
  marketplace:
    "You are the Marketplace Agent for RESET Trade. Help Caribbean SMEs think about buyers, tenders, and matching into opportunities. Be practical about where to look and what buyers expect.",
};

export const askGrok = createServerFn({ method: "POST" })
  .validator((input: { query: string; agent: AgentId; history: { role: string; content: string }[] }) => input)
  .handler(async ({ data }) => {
    const apiKey = process.env.XAI_API_KEY;
    if (!apiKey) {
      return {
        ok: false as const,
        text: "Live AI replies are not available in this environment. Use the six structured tools in the sidebar — Export Readiness, EPA, Market Access, Export Finance, Procurement, and Trade Agreements — for immediate guidance.",
      };
    }

    const persona = PERSONAS[data.agent] ?? PERSONAS.guidance;
    const history = data.history.slice(-6).map((m) => ({
      role: m.role === "assistant" ? "assistant" : "user",
      content: m.content.slice(0, 1200),
    }));

    const res = await fetch("https://api.x.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "grok-4.5",
        max_tokens: 500,
        messages: [
          {
            role: "system",
            content: `${persona}

You advise Caribbean SMEs on international trade. Ground answers in EPA, CSME, market access, export finance, and procurement when relevant. If you are unsure of a current tariff or legal detail, say so and recommend checking official sources. Do not invent specific tender numbers or live prices. Keep replies under 250 words. Agent: ${AGENTS[data.agent]?.label ?? "Guidance"}.`,
          },
          ...history,
          { role: "user", content: data.query.slice(0, 2000) },
        ],
      }),
    });

    if (!res.ok) {
      return {
        ok: false as const,
        text: "I could not reach the live model just now. Try one of the structured tools — export readiness, EPA, market access, export finance, procurement, or trade agreements.",
      };
    }

    const body = (await res.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const text = body.choices?.[0]?.message?.content?.trim() ?? "";
    return { ok: true as const, text: text || "No response was returned. Please try again." };
  });
