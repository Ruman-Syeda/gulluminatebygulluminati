import { useEffect, useRef } from "react";
import L from "leaflet";
import type { WildlifeCluster, Vessel, SentinelUnit } from "@/lib/mock-data";
import type { RiskZone } from "@/lib/risk-engine";
import { riskColor } from "@/lib/risk-engine";

interface Props {
  wildlife: WildlifeCluster[];
  vessels: Vessel[];
  sentinels: SentinelUnit[];
  riskZones: RiskZone[];
  onSelect: (sel: { kind: "wildlife" | "vessel" | "sentinel" | "zone"; id: string }) => void;
}

export function SurveillanceMap({ wildlife, vessels, sentinels, riskZones, onSelect }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const layerRef = useRef<L.LayerGroup | null>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const map = L.map(containerRef.current, {
      center: [20, 0],
      zoom: 2,
      minZoom: 2,
      maxZoom: 8,
      worldCopyJump: true,
      zoomControl: true,
      attributionControl: true,
    });
    L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", {
      attribution: "© OSM © CARTO — GULLUMINATE",
    }).addTo(map);
    mapRef.current = map;
    layerRef.current = L.layerGroup().addTo(map);
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    const layer = layerRef.current;
    if (!map || !layer) return;
    layer.clearLayers();

    // Risk zones (heatmap circles)
    riskZones.forEach((z) => {
      const color = riskColor(z.level);
      L.circle([z.center.lat, z.center.lng], {
        radius: 250000 + z.score * 6000,
        color,
        weight: 1.2,
        fillColor: color,
        fillOpacity: 0.12,
        className: z.level === "CRITICAL" ? "animate-blink" : "",
      })
        .addTo(layer)
        .on("click", () => onSelect({ kind: "zone", id: z.id }));
    });

    // Wildlife
    wildlife.forEach((w) => {
      const icon = L.divIcon({
        className: "",
        html: `<div style="position:relative;width:18px;height:18px;color:oklch(0.75 0.18 150)">
                 <div style="position:absolute;inset:4px;border-radius:9999px;background:currentColor;box-shadow:0 0 10px currentColor"></div>
                 <div class="pulse-marker" style="position:absolute;inset:0;border-radius:9999px;color:currentColor"></div>
               </div>`,
        iconSize: [18, 18],
        iconAnchor: [9, 9],
      });
      L.marker([w.lat, w.lng], { icon })
        .addTo(layer)
        .on("click", () => onSelect({ kind: "wildlife", id: w.id }));
    });

    // Vessels
    vessels.forEach((v) => {
      const alert = v.aisGap || v.loitering;
      const icon = L.divIcon({
        className: "",
        html: `<div style="width:12px;height:12px;transform:rotate(45deg);background:oklch(0.7 0.18 230);border:1.5px solid ${
          alert ? "oklch(0.7 0.2 45)" : "oklch(0.95 0.02 180)"
        };box-shadow:0 0 8px oklch(0.7 0.18 230 / 0.7)"></div>`,
        iconSize: [12, 12],
        iconAnchor: [6, 6],
      });
      L.marker([v.lat, v.lng], { icon })
        .addTo(layer)
        .on("click", () => onSelect({ kind: "vessel", id: v.id }));
    });

    // Sentinels with trails + monitoring radius
    sentinels.forEach((s) => {
      L.polyline(
        s.trail.map((p) => [p.lat, p.lng] as [number, number]),
        { color: "oklch(0.82 0.17 85)", weight: 1.5, opacity: 0.6, dashArray: "4 4" },
      ).addTo(layer);

      L.circle([s.lat, s.lng], {
        radius: 180000,
        color: "oklch(0.82 0.17 85)",
        weight: 0.8,
        fillColor: "oklch(0.82 0.17 85)",
        fillOpacity: 0.04,
        dashArray: "2 6",
      }).addTo(layer);

      const icon = L.divIcon({
        className: "",
        html: `<div style="width:0;height:0;border-left:7px solid transparent;border-right:7px solid transparent;border-bottom:14px solid oklch(0.82 0.17 85);transform:rotate(${s.headingDeg}deg);filter:drop-shadow(0 0 6px oklch(0.82 0.17 85))"></div>`,
        iconSize: [14, 14],
        iconAnchor: [7, 7],
      });
      L.marker([s.lat, s.lng], { icon })
        .addTo(layer)
        .on("click", () => onSelect({ kind: "sentinel", id: s.id }));
    });
  }, [wildlife, vessels, sentinels, riskZones, onSelect]);

  return <div ref={containerRef} className="absolute inset-0" />;
}
