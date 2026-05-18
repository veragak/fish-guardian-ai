import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Send, Sparkles, Mic, Square, Volume2, VolumeX, Loader2 } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { useAuth } from "@/lib/auth-context";
import { chatWithFarm } from "@/lib/chat.functions";

export const Route = createFileRoute("/ai-assistant")({
  head: () => ({ meta: [{ title: "AI Assistant — AquaSense" }] }),
  component: AssistantPage,
});

type Msg = { role: "user" | "assistant"; content: string };

const SUGGESTIONS = [
  "What's happening in Cage 1?",
  "Which cages are highest risk right now?",
  "What's the financial exposure if I do nothing?",
  "What action do you recommend in the next 24 hours?",
];

function AssistantPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const send = useServerFn(chatWithFarm);

  const [messages, setMessages] = useState<Msg[]>([
    { role: "assistant", content: "Hi — I'm AquaSense AI. I can see your live cage data, sea conditions, and risk scores. What would you like to investigate?" },
  ]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => { if (!loading && !user) navigate({ to: "/auth" }); }, [user, loading, navigate]);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, busy]);

  async function submit(text?: string) {
    const content = (text ?? input).trim();
    if (!content || busy) return;
    setInput("");
    setError(null);
    const next = [...messages, { role: "user" as const, content }];
    setMessages(next);
    setBusy(true);
    try {
      const { reply } = await send({ data: { messages: next.map((m) => ({ role: m.role, content: m.content })) } });
      setMessages((m) => [...m, { role: "assistant", content: reply }]);
    } catch (e: any) {
      setError(e?.message ?? "AI request failed");
    } finally { setBusy(false); }
  }

  if (loading || !user) return <div className="bg-navy text-white/70 min-h-[calc(100vh-4rem)] grid place-items-center">Loading…</div>;

  return (
    <div className="bg-navy text-navy-foreground min-h-[calc(100vh-4rem)] flex flex-col">
      <div className="mx-auto w-full max-w-3xl px-6 pt-10 pb-4">
        <div className="flex items-center gap-3">
          <div className="grid place-items-center w-10 h-10 rounded-md bg-primary/15 text-primary"><Sparkles className="w-5 h-5" /></div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">AquaSense AI Assistant</h1>
            <p className="text-sm text-white/60">Reads your live cage data and sea conditions before every answer</p>
          </div>
        </div>
      </div>

      <div className="flex-1">
        <div className="mx-auto w-full max-w-3xl px-6 pb-40 space-y-4">
          {messages.map((m, i) => <Bubble key={i} role={m.role} text={m.content} />)}
          {busy && <Bubble role="assistant" text="…analyzing your farm data" pulsing />}
          {error && <div className="rounded-md bg-destructive/10 border border-destructive/30 text-destructive text-sm px-3 py-2">{error}</div>}
          {messages.length <= 1 && !busy && (
            <div className="pt-4 flex flex-wrap gap-2">
              {SUGGESTIONS.map((s) => (
                <button key={s} onClick={() => submit(s)} className="rounded-full border border-white/10 bg-white/[0.04] hover:bg-white/[0.08] text-sm text-white/85 px-3 py-1.5">
                  {s}
                </button>
              ))}
            </div>
          )}
          <div ref={endRef} />
        </div>
      </div>

      <div className="sticky bottom-0 border-t border-white/10 bg-navy/95 backdrop-blur">
        <form onSubmit={(e) => { e.preventDefault(); submit(); }}
          className="mx-auto w-full max-w-3xl px-6 py-4 flex items-end gap-2">
          <textarea
            rows={1}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); submit(); } }}
            placeholder="Ask about your farm, your cages, or disease risks…"
            className="flex-1 resize-none rounded-lg bg-white/5 border border-white/10 px-4 py-3 text-sm text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <button type="submit" disabled={busy} aria-label="Send"
            className="grid place-items-center w-11 h-11 rounded-lg bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-50">
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}

function Bubble({ role, text, pulsing }: { role: "user" | "assistant"; text: string; pulsing?: boolean }) {
  const isUser = role === "user";
  if (isUser) {
    return (
      <div className="flex justify-end">
        <div className="max-w-[85%] rounded-2xl rounded-br-sm bg-primary text-primary-foreground px-4 py-3 text-sm whitespace-pre-wrap">{text}</div>
      </div>
    );
  }
  return (
    <div className="flex justify-start">
      <div className={`max-w-[90%] rounded-2xl rounded-bl-sm bg-white/[0.06] border border-white/10 text-white px-4 py-3 text-sm leading-relaxed ${pulsing ? "animate-pulse" : ""}`}>
        <div className="space-y-2 [&_h2]:text-base [&_h2]:font-semibold [&_h2]:text-primary [&_h2]:mt-3 [&_h2]:mb-1 [&_h3]:font-semibold [&_h3]:text-white [&_strong]:text-white [&_strong]:font-semibold [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_li]:my-0.5 [&_p]:my-1 [&_em]:italic [&_code]:bg-white/10 [&_code]:px-1 [&_code]:rounded">
          <ReactMarkdown>{text}</ReactMarkdown>
        </div>
      </div>
    </div>
  );
}
