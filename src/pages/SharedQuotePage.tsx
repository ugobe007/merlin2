import { useEffect, useMemo, useState } from "react";

type QuoteHighlights = {
  annualSavings?: string | null;
  payback?: string | null;
  npv25?: string | null;
  solarKW?: string | null;
  bessKW?: string | null;
  netInvestment?: string | null;
  bessVendor?: string | null;
  bessModel?: string | null;
};

type SharedQuoteResponse = {
  ok: boolean;
  quote?: {
    businessName?: string | null;
    industry?: string | null;
    quoteData?: Record<string, unknown> | null;
    createdAt?: string | null;
    expiresAt?: string | null;
    highlights?: QuoteHighlights | null;
  };
  error?: string;
};

function getQuoteToken() {
  return decodeURIComponent(
    window.location.pathname.replace(/^\/(quote|q)\/?/, "").split("/")[0] || ""
  );
}

function industryLabel(industry?: string | null) {
  return (industry || "energy")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function metric(label: string, value?: string | null, accent = "text-yellow-300") {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
      <p className="text-xs uppercase tracking-[0.18em] text-slate-500">{label}</p>
      <p className={`mt-2 text-2xl font-bold ${accent}`}>{value || "Review"}</p>
    </div>
  );
}

export default function SharedQuotePage() {
  const token = useMemo(getQuoteToken, []);
  const [data, setData] = useState<SharedQuoteResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function loadQuote() {
      if (!token) {
        setData({ ok: false, error: "Missing quote token" });
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`/api/sales-agent/shared-quote/${encodeURIComponent(token)}`);
        const payload = (await response.json()) as SharedQuoteResponse;
        if (!cancelled) setData(payload);
      } catch {
        if (!cancelled) setData({ ok: false, error: "Unable to load this quote" });
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadQuote();
    return () => {
      cancelled = true;
    };
  }, [token]);

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#060D1F] text-white">
        <div className="text-center">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-yellow-400 border-t-transparent" />
          <p className="text-sm text-slate-400">Loading StackQuote…</p>
        </div>
      </main>
    );
  }

  if (!data?.ok || !data.quote) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#060D1F] px-6 text-white">
        <section className="max-w-md rounded-3xl border border-white/10 bg-white/[0.04] p-8 text-center shadow-2xl">
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.18em] text-yellow-300">
            StackQuote
          </p>
          <h1 className="text-2xl font-bold">Quote link unavailable</h1>
          <p className="mt-3 text-sm leading-6 text-slate-400">
            {data?.error || "This quote may have expired or been removed."}
          </p>
          <a
            href="/wizard"
            className="mt-6 inline-flex rounded-xl bg-yellow-400 px-5 py-3 text-sm font-bold text-black hover:bg-yellow-300"
          >
            Build a New Quote
          </a>
        </section>
      </main>
    );
  }

  const { quote } = data;
  const highlights = quote.highlights || {};
  const system = [
    highlights.solarKW ? `${highlights.solarKW} solar` : null,
    highlights.bessKW ? `${highlights.bessKW} BESS` : null,
    highlights.bessVendor ? `${highlights.bessVendor} ${highlights.bessModel || ""}`.trim() : null,
  ].filter(Boolean);

  return (
    <main className="min-h-screen bg-[#060D1F] px-5 py-8 text-white md:px-8 md:py-12">
      <section className="mx-auto max-w-5xl">
        <div className="mb-8 rounded-3xl border border-white/10 bg-gradient-to-br from-white/[0.08] to-white/[0.03] p-6 shadow-2xl md:p-10">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-yellow-300">
            StackQuote by Merlin Energy
          </p>
          <div className="mt-5 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight md:text-5xl">
                {quote.businessName || "Shared Energy Quote"}
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300 md:text-base">
                First-pass {industryLabel(quote.industry)} energy savings analysis using utility
                rates, solar data, battery sizing logic, and incentive assumptions.
              </p>
            </div>
            <a
              href="mailto:sales@merlinenergy.net?subject=StackQuote%20review"
              className="rounded-xl border border-yellow-400/40 bg-yellow-400/15 px-5 py-3 text-center text-sm font-bold text-yellow-200 hover:bg-yellow-400/25"
            >
              Tighten Assumptions
            </a>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {metric("Estimated Annual Savings", highlights.annualSavings, "text-emerald-300")}
          {metric("Payback Period", highlights.payback, "text-yellow-300")}
          {metric("25-Year NPV", highlights.npv25, "text-sky-300")}
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-6">
            <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Recommended System</p>
            <p className="mt-3 text-lg font-semibold text-white">
              {system.length ? system.join(" · ") : "Solar + BESS sizing available in the model"}
            </p>
            {highlights.netInvestment && (
              <p className="mt-2 text-sm text-slate-400">
                Net investment after incentives: {highlights.netInvestment}
              </p>
            )}
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-6">
            <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Next Step</p>
            <p className="mt-3 text-sm leading-6 text-slate-300">
              Reply with a utility bill and Merlin will verify the assumptions against your actual
              demand charges, usage profile, and operating schedule.
            </p>
          </div>
        </div>

        <p className="mt-8 text-xs leading-5 text-slate-600">
          This automated analysis is a directional estimate based on available data and benchmarks.
          Final design and economics should be verified with site data and a licensed engineering
          review.
        </p>
      </section>
    </main>
  );
}
