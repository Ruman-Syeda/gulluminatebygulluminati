import type { RiskZone } from "@/lib/risk-engine";
import type { WildlifeCluster, Vessel, SentinelUnit } from "@/lib/mock-data";
import { riskColor } from "@/lib/risk-engine";

type Selection =
  | { kind: "wildlife"; data: WildlifeCluster; zone?: RiskZone }
  | { kind: "vessel"; data: Vessel }
  | { kind: "sentinel"; data: SentinelUnit }
  | { kind: "zone"; data: RiskZone };

export function DetailPanel({ selection, onClose }: { selection: Selection | null; onClose: () => void }) {
  if (!selection) {
    return (
      <div className="p-5 text-sm text-muted-foreground">
        <p className="font-mono uppercase text-xs tracking-widest text-primary">// IDLE</p>
        <p className="mt-2">
          Select any entity on the map — wildlife cluster, vessel, or sentinel unit — to view a full ecological risk
          breakdown.
        </p>
      </div>
    );
  }

  if (selection.kind === "wildlife") {
    const w = selection.data;
    const z = selection.zone;
    return (
      <PanelShell label="WILDLIFE CLUSTER" id={w.id} color="var(--wildlife)" onClose={onClose}>
        <h3 className="text-xl font-semibold">{w.species}</h3>
        <p className="text-muted-foreground italic">{w.scientificName}</p>
        <Stats
          rows={[
            ["Observed individuals", w.count.toLocaleString()],
            ["Migration anomaly", w.migrationAnomaly ? "DETECTED" : "Normal"],
            ["Cross-species overlap", w.crossSpeciesOverlap ? "Yes" : "No"],
            ["Source layer", "GBIF"],
          ]}
        />
        {z && <RiskBreakdown zone={z} />}
      </PanelShell>
    );
  }

  if (selection.kind === "vessel") {
    const v = selection.data;
    return (
      <PanelShell label="MARITIME VESSEL" id={v.id} color="var(--vessel)" onClose={onClose}>
        <h3 className="text-xl font-semibold">{v.name}</h3>
        <p className="text-muted-foreground">{v.type} · Flag {v.flag}</p>
        <Stats
          rows={[
            ["Speed", `${v.speedKn} kn`],
            ["AIS gap", v.aisGap ? "YES — untracked" : "No"],
            ["Loitering", v.loitering ? "YES" : "No"],
            ["Repeated coastal interaction", v.coastalRepeat ? "Yes" : "No"],
            ["Source layer", "Global Fishing Watch"],
          ]}
        />
        <Note>
          Vessels represent human activity exposure vectors near ecological zones. Risk is inferred from behavior and
          proximity — no disease detection is performed.
        </Note>
      </PanelShell>
    );
  }

  if (selection.kind === "sentinel") {
    const s = selection.data;
    return (
      <PanelShell label="SENTINEL SEAGULL UNIT" id={s.id} color="var(--sentinel)" onClose={onClose}>
        <h3 className="text-xl font-semibold font-mono">{s.callsign}</h3>
        <p className="text-muted-foreground">Aerial Ecological Monitoring Drone</p>
        <Stats
          rows={[
            ["Observation altitude", `${s.altitudeM.toLocaleString()} m`],
            ["Scan intensity (velocity)", `${s.velocityKt} kt`],
            ["Heading", `${s.headingDeg}°`],
            ["Trail samples", `${s.trail.length}`],
            ["Source layer", "OpenSky Network"],
          ]}
        />
      </PanelShell>
    );
  }

  // zone
  const z = selection.data;
  return (
    <PanelShell label="EXPOSURE RISK ZONE" id={z.id} color={riskColor(z.level)} onClose={onClose}>
      <RiskBreakdown zone={z} expanded />
    </PanelShell>
  );
}

function PanelShell({
  label,
  id,
  color,
  onClose,
  children,
}: {
  label: string;
  id: string;
  color: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="p-5 space-y-4 text-sm">
      <div className="flex items-start justify-between">
        <div>
          <p className="font-mono uppercase text-[10px] tracking-[0.2em]" style={{ color }}>
            ▣ {label}
          </p>
          <p className="font-mono text-[10px] text-muted-foreground mt-0.5">ID: {id}</p>
        </div>
        <button
          onClick={onClose}
          className="text-muted-foreground hover:text-foreground text-xs font-mono"
          aria-label="Close"
        >
          ✕
        </button>
      </div>
      {children}
    </div>
  );
}

function Stats({ rows }: { rows: [string, string][] }) {
  return (
    <dl className="divide-y divide-border/50 border-y border-border/50">
      {rows.map(([k, v]) => (
        <div key={k} className="flex justify-between py-2">
          <dt className="text-muted-foreground">{k}</dt>
          <dd className="font-mono text-xs text-right">{v}</dd>
        </div>
      ))}
    </dl>
  );
}

function Note({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs text-muted-foreground border-l-2 border-accent/60 pl-3 italic">{children}</p>
  );
}

function RiskBreakdown({ zone, expanded }: { zone: RiskZone; expanded?: boolean }) {
  const color = riskColor(zone.level);
  return (
    <div className="space-y-3">
      <div
        className="rounded-md border p-3"
        style={{ borderColor: color, boxShadow: `0 0 18px ${color}33` }}
      >
        <div className="flex items-baseline justify-between">
          <span className="font-mono text-[10px] tracking-[0.2em] uppercase text-muted-foreground">
            Risk Score
          </span>
          <span className="font-mono text-[10px]" style={{ color }}>
            {zone.level}
          </span>
        </div>
        <div className="mt-1 flex items-baseline gap-2">
          <span className="text-3xl font-semibold text-glow" style={{ color }}>
            {zone.score}
          </span>
          <span className="text-xs text-muted-foreground">/ 100</span>
        </div>
        <div className="mt-2 h-1.5 w-full rounded-full bg-muted overflow-hidden">
          <div className="h-full" style={{ width: `${zone.score}%`, background: color }} />
        </div>
      </div>

      <div>
        <p className="font-mono text-[10px] tracking-[0.2em] uppercase text-muted-foreground mb-2">
          Contributing Signals
        </p>
        <ul className="space-y-1.5">
          {zone.signals.length === 0 && (
            <li className="text-xs text-muted-foreground">No anomalous signals detected.</li>
          )}
          {zone.signals.map((s, i) => (
            <li key={i} className="flex justify-between text-xs">
              <span>· {s.label}</span>
              <span className="font-mono text-muted-foreground">+{s.weight}</span>
            </li>
          ))}
        </ul>
      </div>

      <Stats
        rows={[
          ["Nearby vessels", `${zone.nearbyVessels.length}`],
          ["Sentinel coverage", `${zone.nearbySentinels.length} units`],
          ["Exposure probability", `${Math.round(zone.exposureProbability * 100)}%`],
        ]}
      />

      <div
        className="rounded-md p-3 text-xs"
        style={{ background: `${color}1A`, border: `1px solid ${color}66` }}
      >
        <p className="font-mono text-[10px] tracking-[0.2em] uppercase text-muted-foreground">
          Recommended Action
        </p>
        <p className="mt-1 font-semibold" style={{ color }}>
          ▸ {zone.recommendation}
        </p>
      </div>

      {expanded && (
        <Note>
          GULLUMINATE infers ecological exposure risk from environmental and behavioral signals. The system does not
          detect disease — it identifies conditions where zoonotic spillover is more likely.
        </Note>
      )}
    </div>
  );
}
