export function weightedAvg(items) {
  const tot = items.reduce((s, i) => s + (i.w || 0), 0);
  if (tot === 0) return 0;
  return items.reduce((s, i) => s + (i.v * (i.w || 0)), 0) / tot;
}

function round10(x) {
  return Math.round(x * 10) / 10;
}

export function computeScores(data = {}) {
  // normalize helper
  const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));

  // Compound Facility
  const power = clamp((data.power_reliability ?? 5) / 10);
  const water = data.water_availability ? 1 : 0;
  const garbage = data.garbage_collection ? 1 : 0;
  const drainage = clamp((data.drainage_quality ?? 5) / 10);
  const drainageRisk = 1 - clamp(Number(data.drainage_altitude_risk ?? 0));

  const compoundSub = [
    { v: power, w: 0.35 },
    { v: water, w: 0.2 },
    { v: garbage, w: 0.15 },
    { v: drainage, w: 0.2 },
    { v: drainageRisk, w: 0.1 },
  ];
  const compound = weightedAvg(compoundSub);

  // Security
  const secSub = [
    { v: data.fenced ? 1 : 0, w: 0.3 },
    { v: data.in_estate ? 1 : 0, w: 0.25 },
    { v: clamp((data.gate_quality ?? 5) / 10), w: 0.25 },
    { v: data.guards_present ? 1 : 0, w: 0.2 },
  ];
  const security = weightedAvg(secSub);

  // Location
  const proximityNorm = clamp(1 - ((data.proximity_km ?? 5) / 10));
  const neighborhood = clamp((data.neighborhood_score ?? 5) / 10);
  const location = weightedAvg([
    { v: proximityNorm, w: 0.6 },
    { v: neighborhood, w: 0.4 },
  ]);

  // Privacy & Landlord
  const privacy = weightedAvg([
    { v: data.landlord_on_site ? 0 : 1, w: 0.4 },
    { v: clamp((10 - (data.shared_household ?? 0)) / 10), w: 0.3 },
    { v: clamp((data.tenant_privacy_score ?? 5) / 10), w: 0.3 },
  ]);

  // Architecture
  const arch = weightedAvg([
    { v: clamp(Math.min(data.bedrooms ?? 1, 6) / 6), w: 0.25 },
    { v: clamp((data.ventilation_score ?? 5) / 10), w: 0.25 },
    { v: clamp(Math.min(data.bathrooms ?? 1, 3) / 3), w: 0.15 },
    { v: clamp((data.kitchen_quality ?? 5) / 10), w: 0.2 },
    { v: data.parking_space ? 1 : 0, w: 0.15 },
  ]);

  const categories = [
    { category: "Compound Facility", score: round10(compound * 10), remarks: data.compound_remarks || null },
    { category: "Security", score: round10(security * 10), remarks: data.security_remarks || null },
    { category: "Location", score: round10(location * 10), remarks: data.location_remarks || null },
    { category: "Privacy & Landlord", score: round10(privacy * 10), remarks: data.privacy_remarks || null },
    { category: "Architecture", score: round10(arch * 10), remarks: data.architecture_remarks || null },
  ];

  const overall = round10((compound * 0.25 + security * 0.2 + location * 0.15 + privacy * 0.15 + arch * 0.25) * 10);

  const summary = data.summary || `Structured scores computed for inspection.`;

  return { overall_score: overall, summary, categories };
}
