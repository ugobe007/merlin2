import {
  calculateCollege16Q,
  type College16QInput,
  type College16QResult,
} from "./college16QCalculator";

export function mapCollegeAnswers(answers: Record<string, unknown>): College16QInput {
  const get = (c: string, s: string) => (answers[c] ?? answers[s] ?? "") as string;
  const num = (c: string, s: string, def: number) => {
    const v = Number(answers[c] ?? answers[s] ?? def);
    return Number.isFinite(v) ? v : def;
  };

  return {
    enrollment: num("enrollment", "student_count", 15000),
    campusSqFt: num("campusSqFt", "campus_sq_ft", 0) || undefined,
    institutionType:
      (get("institutionType", "institution_type") as College16QInput["institutionType"]) ||
      "university",
    researchLabs: get("researchLabs", "research_labs") || undefined,
    studentHousing: get("studentHousing", "student_housing") || undefined,
    dataCenterHPC: get("dataCenterHPC", "data_center_hpc") || undefined,
  };
}

/**
 * Main integration function - called by Step3Integration.tsx
 * @param answers - Raw wizard answers
 * @param _ctx - Optional context (template, pricing) for enhanced calculations
 */
export function calculateCollegeFromAnswers(
  answers: Record<string, unknown>,
  _ctx?: { template?: unknown; pricingConfig?: unknown; pricingStatus?: string }
): College16QResult | null {
  try {
    const result = calculateCollege16Q(mapCollegeAnswers(answers));
    console.log("🎓 College 16Q:", {
      peakKW: result.peakKW,
      bessKWh: result.bessKWh,
      confidence: result.confidence,
    });
    return result;
  } catch (e) {
    console.error("❌ College calc error:", e);
    return null;
  }
}
