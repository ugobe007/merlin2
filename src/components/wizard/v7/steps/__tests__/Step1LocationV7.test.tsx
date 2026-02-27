/**
 * Step1LocationV7 — ZIP freeze regression tests
 *
 * Bug (Feb 2026): Wizard jittered/froze when user typed ZIP code.
 * Root cause: Two-effect feedback loop in Step1LocationV7.tsx
 *   Effect A watched state.locationRawInput → setZipValue → normalizedZip changed
 *   Effect B watched normalizedZip → updateLocationRaw → SET_LOCATION_RAW → state.locationRawInput changed
 *   → infinite re-render loop
 *
 * Fix: Removed Effect A entirely. Effect B's dep array is [normalizedZip, isValidZip] only.
 *
 * These tests prove:
 *   1. Typing a ZIP calls updateLocationRaw exactly once per unique normalized value
 *   2. primeLocationIntel fires once (debounced) per valid ZIP, not on every render
 *   3. Rapid type/clear/retype does not trigger a runaway loop
 *   4. The component renders without crashing (smoke)
 */

import React from "react";
import { render, screen, act, fireEvent } from "@testing-library/react";
import { vi, describe, it, expect, beforeEach } from "vitest";

// ─── Mock all heavy child components ────────────────────────────────────────
vi.mock("@/components/wizard/v7/shared/IntelStripInline", () => ({
  default: () => <div data-testid="intel-strip" />,
}));
vi.mock("@/components/wizard/v7/shared/BusinessProfileCard", () => ({
  default: () => <div data-testid="business-card" />,
}));
vi.mock("@/components/wizard/v7/shared/LocationMapTile", () => ({
  default: () => <div data-testid="map-tile" />,
}));
vi.mock("@/components/wizard/v7/steps/GoalsModal", () => ({
  default: () => <div data-testid="goals-modal" />,
}));
vi.mock("@/components/shared/TrueQuoteBadgeCanonical", () => ({
  TrueQuoteBadgeCanonical: () => <span data-testid="tq-badge" />,
}));
vi.mock("@/components/shared/TrueQuoteModal", () => ({
  default: () => <div data-testid="tq-modal" />,
}));

// ─── Import component AFTER mocks ────────────────────────────────────────────
import Step1LocationV7 from "../Step1LocationV7";
import type { WizardState as WizardV7State, EnergyGoal } from "@/wizard/v7/hooks/useWizardV7";

// ─── Minimal state factory ───────────────────────────────────────────────────
function makeState(overrides: Partial<WizardV7State> = {}): WizardV7State {
  return {
    locationRawInput: "",
    locationConfirmed: false,
    goalsConfirmed: false,
    goalsModalRequested: false,
    isBusy: false,
    businessCard: null,
    businessConfirmed: false,
    businessDraft: {},
    industryLocked: false,
    industry: "auto",
    location: { postalCode: "", city: "", state: "", country: "US" },
    locationIntel: null,
    goals: [] as EnergyGoal[],
    ...overrides,
  } as unknown as WizardV7State;
}

// ─── Minimal actions factory ─────────────────────────────────────────────────
function makeActions() {
  return {
    updateLocationRaw: vi.fn(),
    submitLocation: vi.fn().mockResolvedValue(undefined),
    primeLocationIntel: vi.fn().mockResolvedValue(undefined),
    toggleGoal: vi.fn(),
    confirmGoals: vi.fn(),
    confirmBusiness: vi.fn().mockResolvedValue(undefined),
    skipBusiness: vi.fn(),
    setBusinessDraft: vi.fn(),
    setLocationConfirmed: vi.fn(),
  };
}

// ─── Helper: find ZIP input ───────────────────────────────────────────────────
function getZipInput(): HTMLInputElement | null {
  const byId = document.getElementById("merlin-zip-input") as HTMLInputElement | null;
  if (byId) return byId;
  return screen.queryByPlaceholderText(/zip|postal/i) as HTMLInputElement | null;
}

// ─── Tests ───────────────────────────────────────────────────────────────────
describe("Step1LocationV7 — ZIP input stability (loop regression)", () => {
  let actions: ReturnType<typeof makeActions>;

  beforeEach(() => {
    actions = makeActions();
    // NOTE: No vi.useFakeTimers() globally — it deadlocks userEvent/fireEvent.
    // The debounce test manages its own fake timers locally.
  });

  // ── 1. Smoke: renders without crashing ────────────────────────────────────
  it("renders without crashing (smoke test)", () => {
    const { container } = render(
      <Step1LocationV7 state={makeState()} actions={actions} />
    );
    expect(container.firstChild).toBeTruthy();
  });

  // ── 2. ZIP input is present and interactive ───────────────────────────────
  it("renders a ZIP input element", () => {
    render(<Step1LocationV7 state={makeState()} actions={actions} />);
    const input = getZipInput();
    expect(input).not.toBeNull();
    expect(input?.tagName).toBe("INPUT");
  });

  // ── 3. Core fix: updateLocationRaw called once per distinct ZIP value ────
  it("calls updateLocationRaw once when ZIP changes to a new value", () => {
    render(<Step1LocationV7 state={makeState()} actions={actions} />);
    const input = getZipInput();
    expect(input).not.toBeNull();

    // Clear prior mount calls, then fire a single change
    actions.updateLocationRaw.mockClear();
    act(() => { fireEvent.change(input!, { target: { value: "9" } }); });

    // updateLocationRaw("9") should have been called exactly once
    const callsWithNine = actions.updateLocationRaw.mock.calls.filter(
      ([v]: [string]) => v === "9"
    );
    expect(callsWithNine.length).toBe(1);
  });

  // ── 4. No runaway loop: 5 changes → ≤ 5 calls to updateLocationRaw ───
  it("typing 5 digits calls updateLocationRaw at most 5 times (no loop)", () => {
    render(<Step1LocationV7 state={makeState()} actions={actions} />);
    const input = getZipInput();
    expect(input).not.toBeNull();

    actions.updateLocationRaw.mockClear();
    // Simulate typing "90210" digit by digit via 5 change events
    for (const partial of ["9", "90", "902", "9021", "90210"]) {
      act(() => { fireEvent.change(input!, { target: { value: partial } }); });
    }

    // Each change → one distinct normalizedZip → one call.
    // A feedback loop would produce 50+ calls.
    expect(actions.updateLocationRaw.mock.calls.length).toBeLessThanOrEqual(5);
  });

  // ── 5. Final ZIP value sent to SSOT is the full "90210" ──────────────────
  it("sends the correct ZIP value to updateLocationRaw", () => {
    render(<Step1LocationV7 state={makeState()} actions={actions} />);
    const input = getZipInput();
    expect(input).not.toBeNull();

    act(() => { fireEvent.change(input!, { target: { value: "90210" } }); });

    const lastCall = actions.updateLocationRaw.mock.calls.at(-1)?.[0];
    expect(lastCall).toBe("90210");
  });

  // ── 6. primeLocationIntel fires once after debounce, not on every render ─
  it("primeLocationIntel is called once after valid ZIP debounce (300 ms)", () => {
    vi.useFakeTimers();
    try {
      render(<Step1LocationV7 state={makeState()} actions={actions} />);
      const input = getZipInput();
      expect(input).not.toBeNull();

      act(() => { fireEvent.change(input!, { target: { value: "90210" } }); });

      // Not yet — debounce hasn't fired
      expect(actions.primeLocationIntel).not.toHaveBeenCalled();

      // Advance timers to trigger debounce
      act(() => { vi.advanceTimersByTime(400); });

      expect(actions.primeLocationIntel).toHaveBeenCalledTimes(1);
      expect(actions.primeLocationIntel).toHaveBeenCalledWith("90210");
    } finally {
      vi.useRealTimers();
    }
  });

  // ── 7. Rapid clear+retype does NOT cause infinite loop ───────────────────
  it("rapid type/clear/retype does not cause a runaway loop", () => {
    vi.useFakeTimers();
    try {
      render(<Step1LocationV7 state={makeState()} actions={actions} />);
      const input = getZipInput();
      expect(input).not.toBeNull();

      actions.updateLocationRaw.mockClear();

      act(() => {
        fireEvent.change(input!, { target: { value: "90210" } });
        fireEvent.change(input!, { target: { value: "" } });
        fireEvent.change(input!, { target: { value: "10001" } });
        fireEvent.change(input!, { target: { value: "" } });
        fireEvent.change(input!, { target: { value: "94102" } });
      });

      act(() => { vi.advanceTimersByTime(400); });

      // 5 distinct changes → ≤ 5 calls to updateLocationRaw.
      // A loop would be 100s of calls.
      expect(actions.updateLocationRaw.mock.calls.length).toBeLessThanOrEqual(5);

      // primeLocationIntel called at most once (last valid ZIP)
      expect(actions.primeLocationIntel.mock.calls.length).toBeLessThanOrEqual(1);
    } finally {
      vi.useRealTimers();
    }
  });

  // ── 8. Changing state.locationRawInput externally does NOT re-trigger loop
  it("external state.locationRawInput change does not re-call updateLocationRaw", async () => {
    const { rerender } = render(
      <Step1LocationV7 state={makeState({ locationRawInput: "" })} actions={actions} />
    );

    // Record how many times updateLocationRaw was called on initial render
    const callsAfterMount = actions.updateLocationRaw.mock.calls.length;

    // Simulate SSOT pushing back an updated locationRawInput (as if SET_LOCATION_RAW ran)
    rerender(
      <Step1LocationV7 state={makeState({ locationRawInput: "90210" })} actions={actions} />
    );

    // If Effect A still existed, this rerender would call setZipValue → normalizedZip changes
    // → Effect B → updateLocationRaw again. The count would increase.
    // With the fix, no extra calls should happen because Effect A is GONE.
    const callsAfterRerender = actions.updateLocationRaw.mock.calls.length;
    expect(callsAfterRerender - callsAfterMount).toBe(0);
  });
});
