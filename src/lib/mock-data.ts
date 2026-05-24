// Mock fallback datasets for GULLUMINATE — used when external APIs (GBIF,
// Global Fishing Watch, OpenSky) are unavailable or unauthenticated.

export type LatLng = { lat: number; lng: number };

export interface WildlifeCluster {
  id: string;
  species: string;
  scientificName: string;
  count: number;
  lat: number;
  lng: number;
  migrationAnomaly: boolean;
  crossSpeciesOverlap: boolean;
  source: "GBIF";
}

export interface Vessel {
  id: string;
  name: string;
  flag: string;
  type: "Fishing" | "Cargo" | "Tanker" | "Unknown";
  lat: number;
  lng: number;
  speedKn: number;
  loitering: boolean;
  aisGap: boolean;
  coastalRepeat: boolean;
  source: "Global Fishing Watch";
}

export interface SentinelUnit {
  id: string;
  callsign: string;
  lat: number;
  lng: number;
  altitudeM: number;
  velocityKt: number;
  headingDeg: number;
  trail: LatLng[];
  source: "OpenSky / Sentinel Seagull Network";
}

const SPECIES = [
  ["Mallard", "Anas platyrhynchos"],
  ["Herring Gull", "Larus argentatus"],
  ["Northern Gannet", "Morus bassanus"],
  ["Harbor Seal", "Phoca vitulina"],
  ["Brown Pelican", "Pelecanus occidentalis"],
  ["Bottlenose Dolphin", "Tursiops truncatus"],
  ["Atlantic Puffin", "Fratercula arctica"],
  ["Great Cormorant", "Phalacrocorax carbo"],
];

const FLAGS = ["NOR", "ESP", "FRA", "GBR", "USA", "JPN", "CHN", "KOR", "RUS", "ISL"];
const VESSEL_TYPES: Vessel["type"][] = ["Fishing", "Cargo", "Tanker", "Unknown"];

function seeded(seed: number) {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

export function generateWildlife(n = 28): WildlifeCluster[] {
  const r = seeded(7);
  return Array.from({ length: n }, (_, i) => {
    const [common, sci] = SPECIES[Math.floor(r() * SPECIES.length)];
    return {
      id: `gbif-${i}`,
      species: common,
      scientificName: sci,
      count: Math.floor(50 + r() * 950),
      lat: -60 + r() * 130,
      lng: -170 + r() * 340,
      migrationAnomaly: r() > 0.7,
      crossSpeciesOverlap: r() > 0.65,
      source: "GBIF",
    };
  });
}

export function generateVessels(n = 36): Vessel[] {
  const r = seeded(42);
  return Array.from({ length: n }, (_, i) => ({
    id: `gfw-${i}`,
    name: `MV ${["NORDIC", "ATLAS", "AURORA", "TIDE", "STORM", "MERIDIAN", "POLARIS", "ORCA"][Math.floor(r() * 8)]}-${Math.floor(r() * 999)}`,
    flag: FLAGS[Math.floor(r() * FLAGS.length)],
    type: VESSEL_TYPES[Math.floor(r() * VESSEL_TYPES.length)],
    lat: -55 + r() * 120,
    lng: -170 + r() * 340,
    speedKn: +(r() * 18).toFixed(1),
    loitering: r() > 0.7,
    aisGap: r() > 0.75,
    coastalRepeat: r() > 0.6,
    source: "Global Fishing Watch",
  }));
}

const CALLSIGN_GREEK = ["ALPHA", "BRAVO", "DELTA", "ECHO", "FOXTROT", "GAMMA", "HOTEL", "KILO", "OMEGA", "SIGMA"];

export function generateSentinels(n = 14): SentinelUnit[] {
  const r = seeded(101);
  return Array.from({ length: n }, (_, i) => {
    const lat = -50 + r() * 110;
    const lng = -160 + r() * 320;
    const heading = r() * 360;
    const trail: LatLng[] = Array.from({ length: 8 }, (_, k) => ({
      lat: lat - Math.cos((heading * Math.PI) / 180) * (k * 0.4),
      lng: lng - Math.sin((heading * Math.PI) / 180) * (k * 0.4),
    }));
    return {
      id: `sky-${i}`,
      callsign: `SENTINEL-${CALLSIGN_GREEK[i % CALLSIGN_GREEK.length]}-${i + 1}`,
      lat,
      lng,
      altitudeM: Math.floor(800 + r() * 11000),
      velocityKt: Math.floor(120 + r() * 380),
      headingDeg: Math.floor(heading),
      trail,
      source: "OpenSky / Sentinel Seagull Network",
    };
  });
}
