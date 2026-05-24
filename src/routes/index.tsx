import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { SurveillanceMap } from "@/components/SurveillanceMap";
import { DetailPanel } from "@/components/DetailPanel";
import { AlertFeed } from "@/components/AlertFeed";
import { StatBar } from "@/components/StatBar";
import { generateWildlife, generateVessels, generateSentinels } from "@/lib/mock-data";
import { computeRiskZones } from "@/lib/risk-engine";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "GULLUMINATE — Bio-Environmental Surveillance & Exposure Risk Intelligence" },
      {
        name: "description",
        content:
          "Real-time ecological intelligence platform combining wildlife (GBIF), maritime (Global Fishing Watch), and aerial (OpenSky) data to identify zoonotic exposure risk zones.",
      },
      { property: "og:title", content: "GULLUMINATE — Ecological Exposure Risk Intelligence" },
      {
        property: "og:description",
        content: "Early-warning ecological risk system unifying wildlife, vessel, and aerial surveillance signals.",
      },
    ],
  }),
  component: Dashboard,
});

type SelKind = "wildlife" | "vessel" | "sentinel" | "zone";

function Dashboard() {
  const wildlife = useMemo(() => generateWildlife(28), []);
  const vessels = useMemo(() => generateVessels(40), []);
  const sentinels = useMemo(() => generateSentinels(14), []);
  const riskZones = useMemo(() => computeRiskZones(wildlife, vessels, sentinels), [wildlife, vessels, sentinels]);

  const [sel, setSel] = useState<{ kind: SelKind; id: string } | null>(null);

  const selection = useMemo(() => {
    if (!sel) return null;
    if (sel.kind === "wildlife") {
      const data = wildlife.find((w) => w.id === sel.id);
      if (!data) return null;
      const zone = riskZones.find((z) => z.nearbyWildlife[0]?.id === data.id);
      return { kind: "wildlife" as const, data, zone };
    }
    if (sel.kind === "vessel") {
      const data = vessels.find((v) => v.id === sel.id);
      return data ? { kind: "vessel" as const, data } : null;
    }
    if (sel.kind === "sentinel") {
      const data = sentinels.find((s) => s.id === sel.id);
      return data ? { kind: "sentinel" as const, data } : null;
    }
    const data = riskZones.find((z) => z.id === sel.id);
    return data ? { kind: "zone" as const, data } : null;
  }, [sel, wildlife, vessels, sentinels, riskZones]);

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden">
      {/* Top bar */}
      <header className="relative flex items-center justify-between px-5 py-3 border-b border-border bg-card/80 backdrop-blur z-[1000]">
        <div className="flex items-center gap-3">
          <div className="relative h-9 w-9 rounded-full border border-primary/60 grid place-items-center glow-primary">
            <div className="absolute inset-1 rounded-full border border-primary/30" />
            <div className="absolute inset-0 animate-radar">
              <div
                className="absolute left-1/2 top-1/2 h-1/2 w-[2px] -translate-x-1/2 origin-top"
                style={{ background: "linear-gradient(to bottom, var(--primary), transparent)" }}
              />
            </div>
            <span className="text-primary text-xs font-mono relative">◉</span>
          </div>
          <div>
            <h1 className="text-base font-semibold tracking-wide text-glow text-primary">GULLUMINATE</h1>
            <p className="font-mono text-[10px] tracking-[0.22em] uppercase text-muted-foreground">
              Bio-Environmental Surveillance · Exposure Risk Intelligence
            </p>
          </div>
        </div>
        <div className="hidden md:flex items-center gap-4 font-mono text-[10px] tracking-[0.18em] uppercase text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-primary animate-blink" /> Live signal
          </span>
          <span>v1.0 · Mock fallback active</span>
        </div>
      </header>

      <StatBar
        wildlifeCount={wildlife.length}
        vesselCount={vessels.length}
        sentinelCount={sentinels.length}
        zones={riskZones}
      />

      {/* Main grid */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-[280px_1fr_340px] overflow-hidden">
        {/* Left: legend + alerts */}
        <aside className="hidden lg:flex flex-col border-r border-border bg-card/60 backdrop-blur overflow-y-auto">
          <div className="p-4 border-b border-border">
            <p className="font-mono text-[10px] tracking-[0.22em] uppercase text-primary">▸ Layers</p>
            <ul className="mt-3 space-y-2 text-xs">
              <LegendRow color="var(--wildlife)" label="Wildlife clusters" sub="GBIF biodiversity layer" />
              <LegendRow color="var(--vessel)" label="Maritime vessels" sub="Global Fishing Watch" />
              <LegendRow color="var(--sentinel)" label="Sentinel Seagull Network" sub="OpenSky aerial monitoring" />
            </ul>
          </div>
          <div className="p-4 border-b border-border">
            <p className="font-mono text-[10px] tracking-[0.22em] uppercase text-primary">▸ Risk gradient</p>
            <div
              className="mt-3 h-2 rounded-full"
              style={{ background: "var(--gradient-risk)" }}
            />
            <div className="mt-1 flex justify-between font-mono text-[10px] text-muted-foreground">
              <span>LOW</span>
              <span>MED</span>
              <span>HIGH</span>
              <span>CRIT</span>
            </div>
          </div>
          <div className="p-4 flex-1">
            <p className="font-mono text-[10px] tracking-[0.22em] uppercase text-primary">▸ Active alerts</p>
            <div className="mt-2 -mx-4">
              <AlertFeed zones={riskZones} sentinels={sentinels} />
            </div>
          </div>
          <div className="p-4 border-t border-border text-[10px] text-muted-foreground leading-relaxed">
            GULLUMINATE does not detect disease. It identifies environmental conditions where zoonotic spillover risk is
            elevated.
          </div>
        </aside>

        {/* Center: map */}
        <main className="relative scanline">
          <SurveillanceMap
            wildlife={wildlife}
            vessels={vessels}
            sentinels={sentinels}
            riskZones={riskZones}
            onSelect={setSel}
          />
          {/* Corner HUD */}
          <div className="pointer-events-none absolute top-3 left-3 z-[500] font-mono text-[10px] tracking-[0.2em] uppercase text-primary/80">
            ▣ Global Ecological Intelligence Grid
          </div>
          <div className="pointer-events-none absolute bottom-3 left-3 z-[500] font-mono text-[10px] text-muted-foreground">
            // Mock dataset · Sources: GBIF · Global Fishing Watch · OpenSky
          </div>
        </main>

        {/* Right: detail panel */}
        <aside className="hidden lg:block border-l border-border bg-card/60 backdrop-blur overflow-y-auto">
          <DetailPanel selection={selection} onClose={() => setSel(null)} />
        </aside>
      </div>
    </div>
  );
}

function LegendRow({ color, label, sub }: { color: string; label: string; sub: string }) {
  return (
    <li className="flex items-start gap-3">
      <span
        className="mt-1 h-2 w-2 rounded-full shrink-0"
        style={{ background: color, boxShadow: `0 0 8px ${color}` }}
      />
      <div>
        <p>{label}</p>
        <p className="font-mono text-[10px] text-muted-foreground">{sub}</p>
      </div>
    </li>
  );
}
