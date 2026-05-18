import { createFileRoute } from "@tanstack/react-router";
import { Send, Sparkles } from "lucide-react";
import { conversation } from "../data/conversation";

export const Route = createFileRoute("/ai-assistant")({
  head: () => ({
    meta: [
      { title: "AI Assistant — AquaSense" },
      { name: "description", content: "Ask AquaSense's AI anything about your farm, your cages, or disease risk." },
      { property: "og:title", content: "AquaSense AI Assistant" },
      { property: "og:description", content: "Conversational AI for salmon farm health." },
    ],
  }),
  component: AssistantPage,
});

function AssistantPage() {
  return (
    <div className="bg-navy text-navy-foreground min-h-[calc(100vh-4rem)] flex flex-col">
      <div className="mx-auto w-full max-w-3xl px-6 pt-10 pb-6">
        <div className="flex items-center gap-3">
          <div className="grid place-items-center w-10 h-10 rounded-md bg-primary/15 text-primary">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">AquaSense AI Assistant</h1>
            <p className="text-sm text-white/60">Ask anything about your farm</p>
          </div>
        </div>
      </div>

      <div className="flex-1">
        <div className="mx-auto w-full max-w-3xl px-6 pb-32 space-y-5">
          {conversation.map((m, i) => (
            <Bubble key={i} role={m.role} text={m.text} />
          ))}
        </div>
      </div>

      <div className="sticky bottom-0 border-t border-white/10 bg-navy/95 backdrop-blur">
        <form
          onSubmit={(e) => e.preventDefault()}
          className="mx-auto w-full max-w-3xl px-6 py-4 flex items-end gap-2"
        >
          <textarea
            rows={1}
            placeholder="Ask about your farm, your cages, or disease risks..."
            className="flex-1 resize-none rounded-lg bg-white/5 border border-white/10 px-4 py-3 text-sm text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <button
            type="submit"
            aria-label="Send"
            className="grid place-items-center w-11 h-11 rounded-lg bg-primary text-primary-foreground hover:opacity-90"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}

function Bubble({ role, text }: { role: "user" | "ai"; text: string }) {
  const isUser = role === "user";
  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={
          isUser
            ? "max-w-[85%] rounded-2xl rounded-br-sm bg-primary text-primary-foreground px-4 py-3 text-sm whitespace-pre-line"
            : "max-w-[90%] rounded-2xl rounded-bl-sm bg-white/[0.06] border border-white/10 text-white px-4 py-3 text-sm whitespace-pre-line leading-relaxed"
        }
      >
        {text}
      </div>
    </div>
  );
}
