export function hasGeneratorIntent(step3Answers: Record<string, unknown>): boolean {
  const generatorNeed = String(step3Answers.generatorNeed ?? "").toLowerCase();
  return (
    generatorNeed === "partial" ||
    generatorNeed === "full_backup" ||
    generatorNeed === "resilience"
  );
}

export function hasStep35Addons(
  wantsSolar: boolean,
  wantsEVCharging: boolean,
  wantsGenerator: boolean,
  step3Answers: Record<string, unknown>,
): boolean {
  return wantsSolar || wantsEVCharging || wantsGenerator || hasGeneratorIntent(step3Answers);
}
