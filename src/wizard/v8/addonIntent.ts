export function hasGeneratorIntent(step3Answers: Record<string, unknown>): boolean {
  const generatorNeed = String(step3Answers.generatorNeed ?? "").toLowerCase();
  if (
    generatorNeed === "partial" ||
    generatorNeed === "full_backup" ||
    generatorNeed === "resilience"
  ) {
    return true;
  }

  const existingGenerator = String(step3Answers.existingGenerator ?? "").toLowerCase();
  if (
    existingGenerator === "yes-partial" ||
    existingGenerator === "yes-extensive" ||
    existingGenerator === "has_generator"
  ) {
    return true;
  }

  const gridReliability = String(step3Answers.gridReliability ?? "").toLowerCase();
  if (gridReliability === "frequent" || gridReliability === "unreliable") {
    return true;
  }

  const primaryGoal = String(step3Answers.primaryGoal ?? "").toLowerCase();
  if (primaryGoal === "resilience" || primaryGoal === "business_continuity") {
    return true;
  }

  const backupCritical = String(step3Answers.backupCritical ?? "").toLowerCase();
  if (backupCritical === "mission-critical" || backupCritical === "high" || backupCritical === "essential") {
    return true;
  }

  const resilienceLevel = String(step3Answers.resilienceLevel ?? "").toLowerCase();
  if (resilienceLevel === "high" || resilienceLevel === "maximum") {
    return true;
  }

  return false;
}

export function hasStep35Addons(
  wantsSolar: boolean,
  wantsEVCharging: boolean,
  wantsGenerator: boolean,
  step3Answers: Record<string, unknown>,
): boolean {
  return wantsSolar || wantsEVCharging || wantsGenerator || hasGeneratorIntent(step3Answers);
}
