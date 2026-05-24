import { describe, expect, it } from "vitest";
import { initialState, reducer } from "@/wizard/v8/wizardState";

describe("perf: Wizard V8 state spine", () => {
  it("creates initial state quickly", () => {
    const iterations = 500;
    const start = performance.now();

    for (let index = 0; index < iterations; index += 1) {
      initialState();
    }

    const averageMs = (performance.now() - start) / iterations;
    console.log(`[perf] V8 initialState avg: ${averageMs.toFixed(4)}ms`);
    expect(averageMs).toBeLessThan(1);
  });

  it("handles common reducer navigation without performance regression", () => {
    const iterations = 1_000;
    let state = initialState();
    const start = performance.now();

    for (let index = 0; index < iterations; index += 1) {
      state = reducer(state, { type: "GO_TO_STEP", step: 2 });
      state = reducer(state, { type: "GO_TO_STEP", step: 3 });
      state = reducer(state, { type: "SET_ADDON_PREFERENCE", addon: "solar", value: index % 2 === 0 });
      state = reducer(state, { type: "SET_ADDON_CONFIG", config: { solarKW: index % 250 } });
      state = reducer(state, { type: "GO_TO_STEP", step: 4 });
    }

    const elapsedMs = performance.now() - start;
    console.log(`[perf] V8 reducer ${iterations * 5} actions: ${elapsedMs.toFixed(2)}ms`);
    expect(elapsedMs).toBeLessThan(100);
    expect(state.step).toBe(4);
  });
});
