export function hasSolarAddonOpportunity(
  wantsSolar: boolean,
  solarFeasible: boolean,
  solarPhysicalCapKW: number,
): boolean {
  return wantsSolar || (solarFeasible && solarPhysicalCapKW > 0);
}

export function hasGeneratorIntent(step3Answers: Record<string, unknown>): boolean {
  const generatorNeed = String(step3Answers.generatorNeed ?? "").toLowerCase();
  if (
    generatorNeed === "partial" ||
    generatorNeed === "full_backup" ||
    generatorNeed === "resilience"
  ) {
    return true;
  }

  // FIXED: If user has existing generator, DON'T add another one to the quote
  // "yes-partial" / "yes-extensive" means they HAVE one already
  const existingGenerator = String(step3Answers.existingGenerator ?? "").toLowerCase();
  if (existingGenerator === "none" || existingGenerator === "need-backup") {
    // Only if they DON'T have one, consider adding it
    const gridReliability = String(step3Answers.gridReliability ?? "").toLowerCase();
    if (gridReliability === "frequent" || gridReliability === "unreliable") {
      return true;
    }
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
  solarFeasible: boolean,
  solarPhysicalCapKW: number,
): boolean {
  return (
    hasSolarAddonOpportunity(wantsSolar, solarFeasible, solarPhysicalCapKW) ||
    wantsEVCharging ||
    wantsGenerator ||
    hasGeneratorIntent(step3Answers)
  );
}
