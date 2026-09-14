import { useEffect, useRef, useState } from "react";
import {
  CircleCheck,
  Compass,
  GraduationCap,
  Handshake,
  Landmark,
  RotateCcw,
  Scale,
  Send,
  Ship,
  Store,
  Wallet,
  FileCheck,
} from "lucide-react";
import { askGrok } from "@/lib/ai/ask-grok";
import { applyAssessment, routeQuery, type AssessmentState } from "@/lib/trade/engine";
import { nextDimension } from "@/lib/trade/assessment";
import { AGENTS, TOOLS } from "@/lib/trade/knowledge";
import type { AgentId, AssessmentResult, KnowledgeCard } from "@/lib/trade/types";
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
  | { id: string; role: "assistant"; kind: "result"; result: AssessmentResult };

const AGENT_ICONS: Record<AgentId, typeof Compass> = {
  guidance: Compass,
  consulting: Handshake,
  training: GraduationCap,
  marketplace: Store,
};

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
  const [assessment, setAssessment] = useState<AssessmentState>({ active: false, answers: {} });
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

    const nextState = applyAssessment(query, assessment);
    const reply = routeQuery(query, assessment);
    setAssessment(nextState);

    if (reply.kind === "knowledge") {
      setMessages((m) => [...m, { id: uid(), role: "assistant", kind: "knowledge", card: reply.card }]);
      setBusy(false);
      return;
    }
    if (reply.kind === "assessment-start" || reply.kind === "assessment-question" || reply.kind === "need-score") {
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
    setAssessment({ active: false, answers: {} });
    setInput("");
  }

  const progress = assessment.active ? Object.keys(assessment.answers).length : 0;
  const currentDim = assessment.active ? nextDimension(assessment.answers) : null;

  return (
    <div className="flex min-h-dvh flex-col bg-bg text-fg lg:flex-row">
      <aside className="border-b border-border bg-surface lg:flex lg:w-72 lg:shrink-0 lg:flex-col lg:border-b-0 lg:border-r">
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
          <p className="mt-4 mb-2 hidden px-1 text-xs font-medium tracking-wide text-subtle uppercase lg:block">
            Tools
          </p>
          <div className="hidden flex-col gap-1 lg:flex">
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
        </div>
        <div className="hidden border-t border-border px-5 py-4 lg:block">
          <Button variant="ghost" size="sm" className="w-full justify-start" onClick={reset}>
            <RotateCcw className="size-4" />
            New conversation
          </Button>
        </div>
      </aside>

      <section className="flex min-h-0 flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-border px-4 py-3 lg:px-8">
          <div>
            <p className="text-sm font-medium">{AGENTS[agent].label} desk</p>
            <p className="text-xs text-muted">{AGENTS[agent].description}</p>
          </div>
          <Button variant="ghost" size="icon" className="lg:hidden" onClick={reset} aria-label="New conversation">
            <RotateCcw className="size-4" />
          </Button>
        </header>

        {assessment.active && currentDim ? (
          <div className="border-b border-border bg-elevated/60 px-4 py-2 lg:px-8">
            <p className="text-xs text-muted">
              Assessment {progress}/5 · {currentDim.name}
            </p>
            <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-border">
              <div
                className="h-full bg-accent transition-[width] duration-200"
                style={{ width: `${(progress / 5) * 100}%` }}
              />
            </div>
          </div>
        ) : null}

        <div ref={scroller} className="min-h-0 flex-1 overflow-y-auto px-4 py-5 lg:px-8 lg:py-6">
          <div className="mx-auto flex max-w-2xl flex-col gap-4">
            {messages.length === 1 ? (
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
            ) : null}

            {messages.map((msg) => (
              <MessageView key={msg.id} message={msg} onRelated={(p) => send(p)} />
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
}: {
  message: Message;
  onRelated: (prompt: string) => void;
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

  return (
    <div className="max-w-[90%] whitespace-pre-wrap text-sm leading-relaxed">{message.text}</div>
  );
}