import type { RiskZone } from "@/lib/risk-engine";
import { riskColor } from "@/lib/risk-engine";
import type { SentinelUnit } from "@/lib/mock-data";

export function AlertFeed({ zones, sentinels }: { zones: RiskZone[]; sentinels: SentinelUnit[] }) {
  const alerts = zones
    .filter((z) => z.level === "HIGH" || z.level === "CRITICAL")
    .sort((a, b) => b.score - a.score)
    .slice(0, 6);

  if (alerts.length === 0) {
    return (
      <div className="p-4 text-xs text-muted-foreground font-mono">
        // No elevated ecological interaction signals detected.
      </div>
    );
  }

  return (
    <ul className="divide-y divide-border/50">
      {alerts.map((z, idx) => {
        const sentinel = sentinels[idx % sentinels.length];
        const color = riskColor(z.level);
        return (
          <li key={z.id} className="p-3 space-y-1.5">
            <div className="flex items-center gap-2">
              <span
                className={`h-1.5 w-1.5 rounded-full ${z.level === "CRITICAL" ? "animate-blink" : ""}`}
                style={{ background: color, boxShadow: `0 0 8px ${color}` }}
              />
              <span className="font-mono text-[10px] tracking-[0.18em] uppercase" style={{ color }}>
                {z.level} · SCORE {z.score}
              </span>
            </div>
            <p className="text-xs leading-snug">
              <span className="font-semibold">GULLUMINATE ALERT:</span> Elevated ecological interaction risk detected near{" "}
              <span className="font-mono">
                {z.center.lat.toFixed(1)}°, {z.center.lng.toFixed(1)}°
              </span>
              . Conditions indicate potential zoonotic spillover environment.
            </p>
            <p className="text-[11px] text-muted-foreground">
              ▸ Unit <span className="font-mono text-sentinel">{sentinel?.callsign}</span> dispatched for monitoring.
              Recommendation: <span className="text-foreground">{z.recommendation}</span>.
            </p>
          </li>
        );
      })}
    </ul>
  );
}
