// src/components/wizard/v6/advisor/AdvisorPublisher.tsx

import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import type { AdvisorContextValue, AdvisorPayload, AdvisorPublishOptions } from "./advisorTypes";
import { enforceAdvisorBudget } from "./advisorBudget";

const AdvisorContext = createContext<AdvisorContextValue | null>(null);

export function AdvisorPublisher({
  currentStep,
  options,
  children,
}: {
  currentStep: number;
  options?: AdvisorPublishOptions;
  children: React.ReactNode;
}) {
  const opts: Required<AdvisorPublishOptions> = {
    clearOnStepChange: options?.clearOnStepChange ?? true,
    enableWarnings: options?.enableWarnings ?? (import.meta as any).env?.DEV ?? false,
  };

  const [current, setCurrent] = useState<AdvisorPayload | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);

  const lastStepRef = useRef<number>(currentStep);
  const pendingClearRef = useRef<number | null>(null);

  const clear = useCallback((key?: string) => {
    setWarnings([]);
    setCurrent((prev) => {
      if (!prev) return null;
      if (!key) return null;
      return prev.key === key ? null : prev;
    });
  }, []);

  const publish = useCallback((payload: AdvisorPayload) => {
    const enforced = enforceAdvisorBudget(payload);
    setCurrent(enforced.payload);
    setWarnings(enforced.warnings);
  }, []);

  const getCurrent = useCallback(() => current, [current]);
  const getWarnings = useCallback(() => warnings, [warnings]);

  // Step change behavior:
  // - We DO clear stale payload by default,
  // - but we delay-clear slightly to avoid "blank rail flash" when step immediately publishes.
  useEffect(() => {
    if (!opts.clearOnStepChange) return;

    const last = lastStepRef.current;
    if (currentStep === last) return;

    lastStepRef.current = currentStep;

    if (pendingClearRef.current) {
      window.clearTimeout(pendingClearRef.current);
      pendingClearRef.current = null;
    }

    pendingClearRef.current = window.setTimeout(() => {
      // if rail still shows previous step's key, clear it
      setCurrent((prev) => {
        if (!prev) return null;
        const prevStepKey = `step-${last}`;
        if (prev.key === prevStepKey) return null;
        return prev;
      });
      setWarnings([]);
    }, 250);

    return () => {
      if (pendingClearRef.current) {
        window.clearTimeout(pendingClearRef.current);
        pendingClearRef.current = null;
      }
    };
  }, [currentStep, opts.clearOnStepChange]);

  // Dev warnings
  useEffect(() => {
    if (!opts.enableWarnings) return;
    if (!warnings.length) return;
    // eslint-disable-next-line no-console
    console.warn("[AdvisorRail] Budget warnings:", warnings);
  }, [warnings, opts.enableWarnings]);

  const value: AdvisorContextValue = useMemo(
    () => ({ publish, clear, getCurrent, getWarnings }),
    [publish, clear, getCurrent, getWarnings]
  );

  return <AdvisorContext.Provider value={value}>{children}</AdvisorContext.Provider>;
}

export function useAdvisorPublisher(): AdvisorContextValue {
  const ctx = useContext(AdvisorContext);
  if (!ctx) throw new Error("useAdvisorPublisher must be used within <AdvisorPublisher>");
  return ctx;
}
