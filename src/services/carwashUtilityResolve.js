/**
 * Car-wash diagnostic ZIP resolver.
 *
 * This does not replace the national quote engine. Utility rates, sun hours,
 * solar production, Google Places, and site intel still come from
 * utilityRateService, the wizard intel pipeline, and /api/places.
 *
 * A ZIP is only ever good enough for an estimate. mayProduceCertified is
 * always false. Ambiguity on any region beats a high-confidence claim from
 * another region. There is no default utility.
 */

export function extractZip(address) {
  if (typeof address !== "string") return null;
  const text = address.trim();
  if (!text) return null;
  const plus4 = text.match(/\b(\d{5})-(\d{4})\b/);
  if (plus4) return { zip5: plus4[1], zip4: plus4[2], source: "zip+4" };
  const trailing = text.match(/\b(\d{5})\s*$/);
  if (trailing) return { zip5: trailing[1], zip4: null, source: "trailing" };
  const all = [...text.matchAll(/\b(\d{5})\b/g)];
  if (all.length) return { zip5: all[all.length - 1][1], zip4: null, source: "last-standalone" };
  return null;
}

function publicRegion(lookup, region, confidence, reason) {
  return {
    utilityId: region.id,
    utility: region.utility,
    shortName: region.shortName,
    state: region.state,
    isMunicipal: !!region.isMunicipal,
    rateSchedule: region.defaultRateSchedule,
    demandCharge: region.demandCharge,
    verdict: region.verdict,
    verdictMeaning: (lookup.verdicts[region.verdict] || {}).meaning || null,
    confidence,
    reason: reason || null,
  };
}

function unresolved(partial) {
  return {
    resolved: false,
    region: null,
    candidates: [],
    mayProduceEstimate: false,
    mayProduceCertified: false,
    ...partial,
  };
}

export function resolveUtility(address, lookup) {
  const zip = extractZip(address);
  if (!zip) {
    return unresolved({
      confidence: "none",
      requiresConfirmation: true,
      zip: null,
      message:
        "We couldn't find a ZIP code in that address. Add the ZIP, or tell us which utility is named on your bill. We will not guess.",
    });
  }

  const { zip5 } = zip;
  const prefix3 = zip5.slice(0, 3);
  const regions = lookup.regions || [];
  const byId = new Map(regions.map((region) => [region.id, region]));
  const override = (lookup.overrides || []).find((item) => item.zip5 === zip5);

  if (override) {
    const region = byId.get(override.utilityId);
    if (region) {
      return {
        resolved: true,
        confidence: "high",
        requiresConfirmation: false,
        zip: zip5,
        region: publicRegion(lookup, region, "high", override.reason || "ZIP override"),
        candidates: [],
        message: `${region.shortName} serves ${zip5}. This is an estimate until the bill confirms it.`,
        mayProduceEstimate: region.verdict !== "unknown" && region.demandCharge?.low != null,
        mayProduceCertified: false,
      };
    }
  }

  const high = [];
  const medium = [];
  const ambiguous = [];
  for (const region of regions) {
    const prefixes = region.prefixes || {};
    if ((prefixes.ambiguous || []).includes(prefix3)) ambiguous.push(region);
    if ((prefixes.high || []).includes(prefix3)) high.push(region);
    else if ((prefixes.medium || []).includes(prefix3)) medium.push(region);
  }

  if (ambiguous.length > 0) {
    const universe = [...new Map([...ambiguous, ...high, ...medium].map((region) => [region.id, region])).values()];
    return unresolved({
      confidence: "ambiguous",
      requiresConfirmation: true,
      zip: zip5,
      candidates: universe.map((region) => publicRegion(lookup, region, "ambiguous")),
      message: `ZIP ${zip5} straddles more than one utility. Which utility is named on your bill? We won't guess.`,
    });
  }

  if (high.length === 1) {
    const region = high[0];
    return {
      resolved: true,
      confidence: "high",
      requiresConfirmation: false,
      zip: zip5,
      region: publicRegion(lookup, region, "high"),
      candidates: [],
      message: `${region.shortName} serves ${zip5}. A ZIP can produce an estimate only.`,
      mayProduceEstimate: region.verdict !== "unknown" && region.demandCharge?.low != null,
      mayProduceCertified: false,
    };
  }

  if (high.length > 1) {
    return unresolved({
      confidence: "ambiguous",
      requiresConfirmation: true,
      zip: zip5,
      candidates: high.map((region) => publicRegion(lookup, region, "ambiguous")),
      message: `ZIP ${zip5} maps to more than one utility. Which utility is named on your bill?`,
    });
  }

  if (medium.length === 1) {
    const region = medium[0];
    return {
      resolved: true,
      confidence: "medium",
      requiresConfirmation: true,
      zip: zip5,
      region: publicRegion(lookup, region, "medium"),
      candidates: [],
      message: `${zip5} is probably served by ${region.shortName} — this ZIP sits near a boundary. Please confirm the utility named on your bill.`,
      mayProduceEstimate: region.verdict !== "unknown" && region.demandCharge?.low != null,
      mayProduceCertified: false,
    };
  }

  if (medium.length > 1) {
    return unresolved({
      confidence: "ambiguous",
      requiresConfirmation: true,
      zip: zip5,
      candidates: medium.map((region) => publicRegion(lookup, region, "ambiguous")),
      message: `ZIP ${zip5} maps to several possible utilities. Which one is on your bill?`,
    });
  }

  const excluded = regions.filter((region) => (region.standardExclusions || []).includes(prefix3));
  if (excluded.length) {
    const note = excluded[0].notes?.[0] || "";
    return unresolved({
      confidence: "none",
      requiresConfirmation: true,
      zip: zip5,
      message: `We don't yet cover the utility serving ${zip5}${note ? ` (${note})` : ""}. Tell us the utility named on your bill.`,
    });
  }

  return unresolved({
    confidence: "none",
    requiresConfirmation: true,
    zip: zip5,
    message: `We don't have a utility mapped for ZIP ${zip5} yet. Tell us the utility named on your bill and we will not guess.`,
  });
}

function normalise(value) {
  return String(value || "").toLowerCase().replace(/[^a-z]/g, "");
}

export function reconcileWithBill(resolution, utilityNameOnBill, lookup) {
  if (!utilityNameOnBill) return { utilityId: null, source: "bill", discrepancy: null, reconciled: false };
  const billKey = normalise(utilityNameOnBill);
  let match = null;
  for (const region of lookup.regions || []) {
    const utility = normalise(region.utility);
    const shortName = normalise(region.shortName);
    if (billKey && (utility.includes(billKey) || billKey.includes(shortName))) {
      match = region;
      break;
    }
  }
  const zipResolvedId = resolution?.region?.utilityId || null;
  return {
    utilityId: match ? match.id : null,
    source: "bill",
    reconciled: true,
    discrepancy:
      match && zipResolvedId && match.id !== zipResolvedId
        ? {
            zipResolved: zipResolvedId,
            billSays: match.id,
            action: "Bill wins. Correct the ZIP table. Do not carry the ZIP-derived rate into a certified result.",
          }
        : null,
  };
}
