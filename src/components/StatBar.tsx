import type { RiskZone } from "@/lib/risk-engine";

export function StatBar({
  wildlifeCount,
  vesselCount,
  sentinelCount,
  zones,
}: {
  wildlifeCount: number;
  vesselCount: number;
  sentinelCount: number;
  zones: RiskZone[];
}) {
  const critical = zones.filter((z) => z.level === "CRITICAL").length;
  const high = zones.filter((z) => z.level === "HIGH").length;
  const medium = zones.filter((z) => z.level === "MEDIUM").length;

  const items = [
    { label: "Wildlife clusters", value: wildlifeCount, color: "var(--wildlife)", sub: "GBIF" },
    { label: "Tracked vessels", value: vesselCount, color: "var(--vessel)", sub: "Global Fishing Watch" },
    { label: "Sentinel units", value: sentinelCount, color: "var(--sentinel)", sub: "OpenSky" },
    { label: "Critical zones", value: critical, color: "var(--risk-critical)", sub: `${high} high · ${medium} med` },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 p-3 border-b border-border bg-card/60 backdrop-blur">
      {items.map((it) => (
        <div key={it.label} className="px-3 py-2 rounded-md bg-background/40 border border-border/60">
          <div className="flex items-baseline justify-between">
            <span className="font-mono text-[10px] tracking-[0.18em] uppercase text-muted-foreground">
              {it.label}
            </span>
            <span
              className="h-1.5 w-1.5 rounded-full"
              style={{ background: it.color, boxShadow: `0 0 8px ${it.color}` }}
            />
          </div>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-semibold text-glow" style={{ color: it.color }}>
              {it.value}
            </span>
            <span className="text-[10px] font-mono text-muted-foreground">{it.sub}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
