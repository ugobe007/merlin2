/**
 * Unit Tests for Wizard Step Gates
 * 
 * These tests ensure the gate contract is enforced:
 * - Each step gates on ONLY its own completion criteria
 * - No cross-step dependencies
 * - No pricing/DB/async dependencies
 */

import { describe, it, expect } from "vitest";
import {
  gateLocation,
  gateIndustry,
  gateProfile,
  gateResults,
  getGateForStep,
  canProceedFromStep,
  getNextStep,
  getPreviousStep,
  type WizardGateState,
} from "../wizardStepGates";

// ============================================================================
// LOCATION GATE TESTS
// ============================================================================
describe("gateLocation", () => {
  it("should block when ZIP is empty", () => {
    const state: WizardGateState = {};
    expect(gateLocation(state)).toEqual({
      canContinue: false,
      reason: "zip-incomplete",
    });
  });

  it("should block when ZIP is less than 5 digits", () => {
    const state: WizardGateState = { locationRawInput: "9010" };
    expect(gateLocation(state)).toEqual({
      canContinue: false,
      reason: "zip-incomplete",
    });
  });

  it("should allow when ZIP is 5 digits", () => {
    const state: WizardGateState = { locationRawInput: "90210" };
    expect(gateLocation(state)).toEqual({
      canContinue: true,
    });
  });

  it("should allow when ZIP has non-digits but 5+ digits total", () => {
    const state: WizardGateState = { locationRawInput: "90210-1234" };
    expect(gateLocation(state)).toEqual({
      canContinue: true,
    });
  });

  it("should allow when location.zip is set", () => {
    const state: WizardGateState = {
      location: { zip: "89052" },
    };
    expect(gateLocation(state)).toEqual({
      canContinue: true,
    });
  });

  it("should allow when location.postalCode is set", () => {
    const state: WizardGateState = {
      location: { postalCode: "89052" },
    };
    expect(gateLocation(state)).toEqual({
      canContinue: true,
    });
  });

  it("should allow when locationConfirmed with formattedAddress", () => {
    const state: WizardGateState = {
      locationConfirmed: true,
      location: { formattedAddress: "123 Main St, Las Vegas, NV 89052" },
    };
    expect(gateLocation(state)).toEqual({
      canContinue: true,
    });
  });

  it("should NOT gate on industry (cross-step isolation)", () => {
    const state: WizardGateState = {
      locationRawInput: "90210",
      industry: undefined, // industry missing should NOT affect location gate
    };
    expect(gateLocation(state)).toEqual({
      canContinue: true,
    });
  });

  it("should NOT gate on profile (cross-step isolation)", () => {
    const state: WizardGateState = {
      locationRawInput: "90210",
      step3Complete: false, // profile incomplete should NOT affect location gate
    };
    expect(gateLocation(state)).toEqual({
      canContinue: true,
    });
  });
});

// ============================================================================
// INDUSTRY GATE TESTS
// ============================================================================
describe("gateIndustry", () => {
  it("should block when industry is undefined", () => {
    const state: WizardGateState = {};
    expect(gateIndustry(state)).toEqual({
      canContinue: false,
      reason: "industry-missing",
    });
  });

  it("should block when industry is null", () => {
    const state: WizardGateState = { industry: null };
    expect(gateIndustry(state)).toEqual({
      canContinue: false,
      reason: "industry-missing",
    });
  });

  it("should block when industry is 'auto'", () => {
    const state: WizardGateState = { industry: "auto" };
    expect(gateIndustry(state)).toEqual({
      canContinue: false,
      reason: "industry-missing",
    });
  });

  it("should allow when industry is selected", () => {
    const state: WizardGateState = { industry: "hotel" };
    expect(gateIndustry(state)).toEqual({
      canContinue: true,
    });
  });

  it("should allow any valid industry string", () => {
    const industries = ["hotel", "car_wash", "data_center", "manufacturing", "other"];
    for (const industry of industries) {
      const state: WizardGateState = { industry };
      expect(gateIndustry(state).canContinue).toBe(true);
    }
  });

  it("should NOT gate on location (cross-step isolation)", () => {
    const state: WizardGateState = {
      industry: "hotel",
      locationRawInput: "", // location empty should NOT affect industry gate
    };
    expect(gateIndustry(state)).toEqual({
      canContinue: true,
    });
  });
});

// ============================================================================
// PROFILE GATE TESTS
// ============================================================================
describe("gateProfile", () => {
  it("should allow when step3Complete is true", () => {
    const state: WizardGateState = { step3Complete: true };
    expect(gateProfile(state)).toEqual({
      canContinue: true,
    });
  });

  it("should allow when no template (empty profile is valid)", () => {
    const state: WizardGateState = {};
    expect(gateProfile(state)).toEqual({
      canContinue: true,
    });
  });

  it("should allow when template has no required questions", () => {
    const state: WizardGateState = {
      step3Template: {
        questions: [
          { id: "q1", required: false },
          { id: "q2", required: false },
        ],
      },
      step3Answers: {},
    };
    expect(gateProfile(state)).toEqual({
      canContinue: true,
    });
  });

  it("should block when required questions are unanswered", () => {
    const state: WizardGateState = {
      step3Template: {
        questions: [
          { id: "rooms", required: true },
          { id: "sqft", required: false },
        ],
      },
      step3Answers: { sqft: 5000 }, // rooms is missing
    };
    expect(gateProfile(state)).toEqual({
      canContinue: false,
      reason: "profile-required-missing",
    });
  });

  it("should allow when all required questions are answered", () => {
    const state: WizardGateState = {
      step3Template: {
        questions: [
          { id: "rooms", required: true },
          { id: "sqft", required: false },
        ],
      },
      step3Answers: { rooms: 150 },
    };
    expect(gateProfile(state)).toEqual({
      canContinue: true,
    });
  });

  it("should NOT gate on pricing (async isolation)", () => {
    const state: WizardGateState = {
      step3Complete: true,
      // No pricing state - should NOT affect gate
    };
    expect(gateProfile(state)).toEqual({
      canContinue: true,
    });
  });
});

// ============================================================================
// RESULTS GATE TESTS
// ============================================================================
describe("gateResults", () => {
  it("should ALWAYS allow (read-only step)", () => {
    expect(gateResults()).toEqual({
      canContinue: true,
    });
  });

  it("should allow even with empty state", () => {
    expect(gateResults()).toEqual({
      canContinue: true,
    });
  });
});

// ============================================================================
// DISPATCHER TESTS
// ============================================================================
describe("getGateForStep", () => {
  it("should dispatch to correct gate function", () => {
    const state: WizardGateState = {
      locationRawInput: "90210",
      industry: "hotel",
      step3Complete: true,
    };

    expect(getGateForStep("location", state).canContinue).toBe(true);
    expect(getGateForStep("industry", state).canContinue).toBe(true);
    expect(getGateForStep("profile", state).canContinue).toBe(true);
    expect(getGateForStep("results", state).canContinue).toBe(true);
  });

  it("should return correct reasons for blocked steps", () => {
    const state: WizardGateState = {};

    expect(getGateForStep("location", state).reason).toBe("zip-incomplete");
    expect(getGateForStep("industry", state).reason).toBe("industry-missing");
    // profile allows empty state
    expect(getGateForStep("profile", state).reason).toBeUndefined();
    expect(getGateForStep("results", state).reason).toBeUndefined();
  });
});

// ============================================================================
// HELPER TESTS
// ============================================================================
describe("canProceedFromStep", () => {
  it("should return boolean for gate result", () => {
    const state: WizardGateState = { locationRawInput: "90210" };
    expect(canProceedFromStep("location", state)).toBe(true);
  });
});

describe("getNextStep", () => {
  it("should return next step in order", () => {
    expect(getNextStep("location")).toBe("industry");
    expect(getNextStep("industry")).toBe("profile");
    expect(getNextStep("profile")).toBe("results");
    expect(getNextStep("results")).toBe(null);
  });
});

describe("getPreviousStep", () => {
  it("should return previous step in order", () => {
    expect(getPreviousStep("location")).toBe(null);
    expect(getPreviousStep("industry")).toBe("location");
    expect(getPreviousStep("profile")).toBe("industry");
    expect(getPreviousStep("results")).toBe("profile");
  });
});

// ============================================================================
// CONTRACT ENFORCEMENT TESTS
// ============================================================================
describe("Gate Contract Enforcement", () => {
  it("location gate should NEVER check industry", () => {
    // Even with invalid industry, location should pass if ZIP is valid
    const state: WizardGateState = {
      locationRawInput: "90210",
      industry: undefined,
    };
    expect(gateLocation(state).canContinue).toBe(true);
  });

  it("industry gate should NEVER check profile", () => {
    // Even with incomplete profile, industry should pass if industry is set
    const state: WizardGateState = {
      industry: "hotel",
      step3Complete: false,
    };
    expect(gateIndustry(state).canContinue).toBe(true);
  });

  it("profile gate should NEVER check pricing", () => {
    // Profile should pass based only on question answers
    const state: WizardGateState = {
      step3Complete: true,
      // No pricing state whatsoever
    };
    expect(gateProfile(state).canContinue).toBe(true);
  });

  it("results gate should NEVER block", () => {
    // Results is read-only - always navigable
    expect(gateResults().canContinue).toBe(true);
  });
});
