import { computeScores } from "./computeScores.js";

const sample = {
  power_reliability: 7,
  water_availability: true,
  garbage_collection: false,
  drainage_quality: 6,
  drainage_altitude_risk: 0.2,
  fenced: true,
  in_estate: false,
  gate_quality: 6,
  guards_present: false,
  proximity_km: 2,
  neighborhood_score: 7,
  landlord_on_site: false,
  shared_household: 1,
  tenant_privacy_score: 7,
  bedrooms: 3,
  ventilation_score: 7,
  bathrooms: 2,
  kitchen_quality: 6,
  parking_space: 1,
};

console.log("Running computeScores on sample data:\n", sample);
const result = computeScores(sample);
console.log("Result:\n", JSON.stringify(result, null, 2));
