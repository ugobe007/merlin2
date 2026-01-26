/**
 * Global Window Event Types
 * Canonical type declarations for custom window events used across the app.
 * 
 * This file augments the global WindowEventMap interface so that
 * addEventListener/dispatchEvent are fully typed for our custom events.
 */

import type { TrueQuoteModalMode, TrueQuoteProofPayload } from "@/components/shared/TrueQuoteModal";

declare global {
  interface WindowEventMap {
    /** Opens the TrueQuote modal with optional mode and payload */
    "truequote:open": CustomEvent<{
      mode?: TrueQuoteModalMode;
      payload?: TrueQuoteProofPayload;
    }>;
    /** Closes the TrueQuote modal */
    "truequote:close": Event;
  }
}

export {};
