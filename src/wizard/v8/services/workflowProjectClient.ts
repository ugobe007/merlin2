import { buildApiUrl } from "@/config/api";
import type { WizardState } from "../wizardState";

export interface WizardLeadContact {
  name: string;
  email: string;
  company?: string;
}

export interface WizardWorkflowProjectResult {
  projectId: string;
  status: string;
  storage: "supabase" | "memory";
  warning?: string;
  workflowSummary?: {
    activeStage: string;
    completedTasks: number;
    totalTasks: number;
    percentComplete: number;
  };
}

function selectedGoals(state: WizardState): string[] {
  const goals = ["preliminary-quote"];

  if (state.wantsSolar || state.solarKW > 0) goals.push("solar");
  if (state.tiers?.some((tier) => tier.bessKW > 0 || tier.bessKWh > 0))
    goals.push("battery-storage");
  if (state.wantsGenerator || state.generatorKW > 0) goals.push("backup-power");
  if (
    state.wantsEVCharging ||
    state.level2Chargers > 0 ||
    state.dcfcChargers > 0 ||
    state.hpcChargers > 0
  )
    goals.push("ev-charging");

  return [...new Set(goals)];
}

export async function createWizardWorkflowProject(
  state: WizardState,
  contact: WizardLeadContact
): Promise<WizardWorkflowProjectResult> {
  const selectedTier =
    state.tiers && state.selectedTierIndex !== null ? state.tiers[state.selectedTierIndex] : null;
  const company = contact.company || state.business?.name || "Merlin Energy Project";
  const zipCode = state.location?.zip || state.locationRaw.replace(/\D/g, "").slice(0, 5);

  const response = await fetch(buildApiUrl("/api/wizard/workflow-project"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      industry: state.industry || state.business?.detectedIndustry || "other",
      facility: {
        name: company,
        address:
          state.business?.formattedAddress ||
          state.business?.address ||
          state.location?.formattedAddress,
        zipCode,
      },
      contact: {
        name: contact.name,
        email: contact.email,
      },
      goals: selectedGoals(state),
      quoteId: selectedTier ? `${state.industry || "wizard"}-${Date.now()}` : null,
      selectedAddOns: {
        solar: state.wantsSolar || state.solarKW > 0,
        storage: !!selectedTier && (selectedTier.bessKW > 0 || selectedTier.bessKWh > 0),
        generator: state.wantsGenerator || state.generatorKW > 0,
        evCharging:
          state.wantsEVCharging ||
          state.level2Chargers > 0 ||
          state.dcfcChargers > 0 ||
          state.hpcChargers > 0,
      },
    }),
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload.error || "Workflow project creation failed");
  }

  return payload as WizardWorkflowProjectResult;
}
