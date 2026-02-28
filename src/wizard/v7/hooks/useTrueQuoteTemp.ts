/**
 * useTrueQuoteTemp — React hook for TrueQuoteTemp store
 * ======================================================
 * Uses useSyncExternalStore so any patch() call causes a
 * re-render in all subscribed components — same contract
 * as React's built-in stores.
 *
 * Usage:
 *   const tqt = useTrueQuoteTemp();        // full snapshot
 *   const { includeEV, solarKW } = useTrueQuoteTemp(); // destructure
 *
 *   // Write from an event handler (synchronous, safe):
 *   TrueQuoteTemp.writeAddOns({ ..., includeEV: true, evChargerKW: 150 });
 */

import { useSyncExternalStore } from "react";
import { TrueQuoteTemp, type TrueQuoteTempData } from "../trueQuoteTemp";

// Stable snapshot getter — returns the same reference unless patch() was called
const getSnapshot = (): TrueQuoteTempData => TrueQuoteTemp.get();
const getServerSnapshot = (): TrueQuoteTempData => TrueQuoteTemp.get();

export function useTrueQuoteTemp(): TrueQuoteTempData {
  return useSyncExternalStore(
    TrueQuoteTemp.subscribe.bind(TrueQuoteTemp),
    getSnapshot,
    getServerSnapshot
  );
}
