import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Waves } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { ensureDemoAccount } from "@/lib/demo.functions";

export const Route = createFileRoute("/demo")({
  head: () => ({
    meta: [
      { title: "Live demo — AquaSense" },
      { name: "description", content: "Explore a live AquaSense dashboard with seeded farm data — no signup required." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: DemoEntry,
});

function DemoEntry() {
  const navigate = useNavigate();
  const ensure = useServerFn(ensureDemoAccount);
  const [status, setStatus] = useState("Preparing your demo farm…");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        // Sign out any existing session so the demo always lands clean.
        await supabase.auth.signOut();
        if (cancelled) return;
        setStatus("Signing into the demo workspace…");
        const { email, password } = await ensure();
        if (cancelled) return;
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        if (cancelled) return;
        navigate({ to: "/dashboard" });
      } catch (e) {
        if (!cancelled) setStatus(e instanceof Error ? e.message : "Failed to launch demo");
      }
    })();
    return () => { cancelled = true; };
  }, [ensure, navigate]);

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-navy text-navy-foreground grid place-items-center px-6 py-12">
      <div className="text-center max-w-md">
        <div className="mx-auto grid place-items-center w-14 h-14 rounded-xl bg-primary/15 text-primary mb-5">
          <Waves className="w-6 h-6 animate-pulse" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight">Live AquaSense demo</h1>
        <p className="mt-3 text-sm text-white/70">{status}</p>
        <p className="mt-6 text-xs text-white/40">Seeded with a 6-cage farm in Hardangerfjord. Live sea data via Open-Meteo Marine.</p>
      </div>
    </div>
  );
}
