import type { Vessel, WildlifeCluster, SentinelUnit, LatLng } from "./mock-data";

export type RiskLevel = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export interface RiskSignal {
  label: string;
  weight: number;
  source: "wildlife" | "vessel" | "monitoring";
}

export interface RiskZone {
  id: string;
  center: LatLng;
  score: number;
  level: RiskLevel;
  signals: RiskSignal[];
  nearbyWildlife: WildlifeCluster[];
  nearbyVessels: Vessel[];
  nearbySentinels: SentinelUnit[];
  recommendation: "No Action" | "Observe" | "Increase Monitoring" | "Issue Advisory Zone";
  exposureProbability: number;
}

// Haversine distance in km
export function distanceKm(a: LatLng, b: LatLng): number {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const la1 = (a.lat * Math.PI) / 180;
  const la2 = (b.lat * Math.PI) / 180;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(la1) * Math.cos(la2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

export function levelFromScore(score: number): RiskLevel {
  if (score >= 80) return "CRITICAL";
  if (score >= 55) return "HIGH";
  if (score >= 30) return "MEDIUM";
  return "LOW";
}

export function recommendation(level: RiskLevel): RiskZone["recommendation"] {
  switch (level) {
    case "CRITICAL": return "Issue Advisory Zone";
    case "HIGH": return "Increase Monitoring";
    case "MEDIUM": return "Observe";
    default: return "No Action";
  }
}

const PROXIMITY_KM = 600;
const SENTINEL_KM = 900;

export function computeRiskZones(
  wildlife: WildlifeCluster[],
  vessels: Vessel[],
  sentinels: SentinelUnit[],
): RiskZone[] {
  return wildlife.map((w) => {
    const center = { lat: w.lat, lng: w.lng };
    const signals: RiskSignal[] = [];

    // Wildlife signals
    if (w.count > 500) signals.push({ label: "Dense wildlife clustering", weight: 30, source: "wildlife" });
    if (w.migrationAnomaly) signals.push({ label: "Abnormal migration pattern", weight: 25, source: "wildlife" });
    if (w.crossSpeciesOverlap) signals.push({ label: "Cross-species overlap", weight: 35, source: "wildlife" });

    const nearbyVessels = vessels.filter((v) => distanceKm(center, { lat: v.lat, lng: v.lng }) < PROXIMITY_KM);
    const nearbySentinels = sentinels.filter((s) => distanceKm(center, { lat: s.lat, lng: s.lng }) < SENTINEL_KM);

    if (nearbyVessels.length > 0)
      signals.push({ label: `Vessel proximity (${nearbyVessels.length})`, weight: 40, source: "vessel" });
    if (nearbyVessels.some((v) => v.aisGap))
      signals.push({ label: "AIS gap detected (untracked movement)", weight: 30, source: "vessel" });
    if (nearbyVessels.some((v) => v.loitering))
      signals.push({ label: "Loitering vessel behavior", weight: 20, source: "vessel" });
    if (nearbyVessels.some((v) => v.coastalRepeat))
      signals.push({ label: "Repeated coastal interaction", weight: 15, source: "vessel" });

    // Monitoring coverage reduces effective score
    const coverageBonus = Math.min(nearbySentinels.length * 8, 24);

    const raw = signals.reduce((acc, s) => acc + s.weight, 0);
    const score = Math.max(0, Math.min(100, raw - coverageBonus));
    const level = levelFromScore(score);

    return {
      id: `risk-${w.id}`,
      center,
      score,
      level,
      signals,
      nearbyWildlife: [w],
      nearbyVessels,
      nearbySentinels,
      recommendation: recommendation(level),
      exposureProbability: +(score / 100 * (1 - coverageBonus / 60)).toFixed(2),
    };
  });
}

export function riskColor(level: RiskLevel): string {
  switch (level) {
    case "CRITICAL": return "var(--risk-critical)";
    case "HIGH": return "var(--risk-high)";
    case "MEDIUM": return "var(--risk-medium)";
    default: return "var(--risk-low)";
  }
}
