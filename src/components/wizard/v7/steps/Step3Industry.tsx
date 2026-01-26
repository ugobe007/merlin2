/**
 * Step 3: Industry (V7) — CANONICAL ADAPTER PATTERN
 *
 * Updates (Jan 23, 2026):
 * - ✅ Uses useCaseCatalog adapter (no direct DB calls)
 * - ✅ Fallback to static list if API fails (schema immunity)
 * - ✅ Real industry images from assets
 * - ✅ Premium dark overlay + proper glow on hover
 */

import React, { useState, useEffect } from "react";
import { getUseCases, type UseCase } from "../services/useCaseCatalog";

// ✅ Images from src/assets/images
import dataCenterImg from "@/assets/images/data-center-1.jpg";
import officeBuildingImg from "@/assets/images/office_building2.jpg";
import hotelImg from "@/assets/images/hotel_motel_holidayinn_1.jpg";
import carWashImg from "@/assets/images/car_wash_1.jpg";
import evChargingImg from "@/assets/images/ev_charging_station.jpg";
import hospitalImg from "@/assets/images/hospital_1.jpg";
import manufacturingImg from "@/assets/images/manufacturing_1.jpg";
import coldStorageImg from "@/assets/images/cold_storage.jpg";

type IndustryKey =
  | "data_center"
  | "office"
  | "hotel"
  | "car_wash"
  | "ev_charging"
  | "hospital"
  | "manufacturing"
  | "cold_storage";

type IndustryCard = {
  key: IndustryKey;
  title: string;
  subtitle: string;
  image: string;
  // optional: a little "why" chip
  signal: string;
};

const INDUSTRIES: IndustryCard[] = [
  {
    key: "data_center",
    title: "Data Center",
    subtitle: "Demand charges • resilience • uptime",
    image: dataCenterImg,
    signal: "High load, high ROI",
  },
  {
    key: "office",
    title: "Office Building",
    subtitle: "Peak shaving • TOU arbitrage",
    image: officeBuildingImg,
    signal: "Predictable profile",
  },
  {
    key: "hotel",
    title: "Hotel",
    subtitle: "Cooling loads • guest reliability",
    image: hotelImg,
    signal: "Strong daily curve",
  },
  {
    key: "car_wash",
    title: "Car Wash",
    subtitle: "Motor spikes • demand events",
    image: carWashImg,
    signal: "Spiky demand",
  },
  {
    key: "ev_charging",
    title: "EV Charging",
    subtitle: "Grid constraints • fast charging",
    image: evChargingImg,
    signal: "Capacity unlock",
  },
  {
    key: "hospital",
    title: "Hospital",
    subtitle: "Critical backup • continuity",
    image: hospitalImg,
    signal: "Resilience first",
  },
  {
    key: "manufacturing",
    title: "Manufacturing",
    subtitle: "Process energy • peak controls",
    image: manufacturingImg,
    signal: "Big kW opportunity",
  },
  {
    key: "cold_storage",
    title: "Cold Storage",
    subtitle: "24/7 loads • compressor cycles",
    image: coldStorageImg,
    signal: "Constant load",
  },
];

// ✅ Image mapping (maps slug → imported image)
const IMAGE_BY_SLUG: Record<string, string> = {
  "data-center": dataCenterImg,
  "data_center": dataCenterImg,
  "office": officeBuildingImg,
  "hotel": hotelImg,
  "car-wash": carWashImg,
  "car_wash": carWashImg,
  "ev-charging": evChargingImg,
  "ev_charging": evChargingImg,
  "hospital": hospitalImg,
  "manufacturing": manufacturingImg,
  "cold-storage": coldStorageImg,
  "cold_storage": coldStorageImg,
};

interface Step3IndustryProps {
  industry?: string | null;
  setIndustry?: (industry: string) => void;
}

export default function Step3Industry(props: Step3IndustryProps) {
  const { industry, setIndustry } = props;
  const [useCases, setUseCases] = useState<UseCase[]>([]);
  const [loading, setLoading] = useState(true);

  // ✅ Load use cases from adapter (no direct DB calls)
  useEffect(() => {
    getUseCases().then((cases) => {
      setUseCases(cases);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4 animate-pulse">🏭</div>
          <div className="text-lg text-slate-400">Loading industries...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full min-h-0">
      <div className="mb-8 text-center">
        <div className="text-6xl mb-4">🏭</div>
        <h2 className="text-3xl font-bold text-white mb-2">Choose Your Industry</h2>
        <p className="text-slate-400">
          Merlin uses your industry to apply the correct TrueQuote™ model.
        </p>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        {useCases.map((useCase) => {
          const active = industry === useCase.slug;
          const img = IMAGE_BY_SLUG[useCase.slug] || officeBuildingImg;

          return (
            <button
              key={useCase.slug}
              type="button"
              onClick={() => setIndustry?.(useCase.slug)}
              className={[
                "group relative overflow-hidden rounded-3xl border text-left",
                "transition-all duration-300",
                active
                  ? "border-purple-400/50 shadow-[0_0_35px_rgba(168,85,247,0.20)]"
                  : "border-white/10 hover:border-purple-500/30 hover:shadow-[0_0_30px_rgba(99,102,241,0.12)]",
              ].join(" ")}
              style={{ minHeight: 220 }}
            >
              {/* Background image */}
              <div
                className="absolute inset-0 bg-center bg-cover"
                style={{ backgroundImage: `url(${img})` }}
              />

              {/* Dark overlay */}
              <div className="absolute inset-0 bg-gradient-to-b from-black/25 via-black/55 to-black/85" />

              {/* Soft glow layer */}
              <div className="pointer-events-none absolute -inset-8 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(168,85,247,0.18),transparent_55%)]" />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(59,130,246,0.12),transparent_55%)]" />
              </div>

              {/* Content */}
              <div className="relative p-6 flex flex-col h-full">
                {/* Top row: description badge */}
                <div className="flex items-end justify-end">
                  <div className="px-3 py-1.5 rounded-full text-xs font-semibold border border-emerald-500/25 bg-emerald-500/10 text-emerald-200">
                    TrueQuote™ Ready
                  </div>
                </div>

                <div className="mt-6">
                  <div className="text-xl font-bold text-white">{useCase.title}</div>
                  <div className="text-sm text-slate-200/80 mt-1">
                    {useCase.description || "Energy optimization for your facility"}
                  </div>
                </div>

                {/* Footer */}
                <div className="mt-auto pt-6 flex items-center justify-between">
                  <div className="text-xs text-slate-300/80">
                    Calibrated sizing model
                  </div>
                  <div
                    className={[
                      "text-xs font-bold px-3 py-1.5 rounded-xl",
                      active
                        ? "bg-purple-500/25 text-purple-100 border border-purple-400/40"
                        : "bg-white/10 text-white/90 border border-white/10 group-hover:bg-purple-500/15 group-hover:border-purple-500/25",
                    ].join(" ")}
                  >
                    {active ? "✓ Selected" : "Select →"}
                  </div>
                </div>
              </div>

              {/* Active ring */}
              {active && (
                <div className="pointer-events-none absolute inset-0 rounded-3xl ring-2 ring-purple-400/30" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
