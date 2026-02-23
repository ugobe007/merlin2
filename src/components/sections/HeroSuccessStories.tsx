import React from "react";
import type { ApplicationType } from "../modals/RealWorldApplicationModal";
import carWashValet from "../../assets/images/car_wash_valet.jpg";
import hotelImage from "../../assets/images/hotel_motel_holidayinn_1.jpg";
import evChargingStationImage from "@/assets/images/ev_charging_station.jpg";

interface HeroSuccessStoriesProps {
  onOpenStory: (app: ApplicationType) => void;
}

export default function HeroSuccessStories({ onOpenStory }: HeroSuccessStoriesProps) {
  return (
    <>
      {/* ========== REAL-WORLD SUCCESS STORIES ========== */}
      <section
        className="py-20 px-4 md:px-8 lg:px-12 relative"
        style={{
          background: "linear-gradient(180deg, #071024 0%, #0c1631 50%, #060d1f 100%)",
        }}
      >
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h3 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Real-World <span className="text-[#3ECF8E]">Success Stories</span>
            </h3>
            <p className="text-slate-400 text-lg">
              See how businesses like yours are saving with Merlin
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Data Center */}
            <div
              className="group cursor-pointer"
              onClick={() => {
                onOpenStory("car-wash");
              }}
            >
              <div
                className="relative overflow-hidden rounded-3xl transition-all duration-500 hover:scale-[1.02] hover:-translate-y-2"
                style={{ boxShadow: "0 25px 80px rgba(0,0,0,0.4)" }}
              >
                {/* Image */}
                <div className="relative h-56 overflow-hidden">
                  <img
                    src={carWashValet}
                    alt="Car Wash Success Story"
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0f1117] via-[#0f1117]/60 to-transparent" />

                  {/* Savings Badge */}
                  <div className="absolute top-4 right-4 bg-[#3ECF8E] text-white px-4 py-2 rounded-full font-bold text-sm shadow-lg">
                    $127K/yr savings
                  </div>
                </div>

                {/* Content */}
                <div className="p-6" style={{ background: "#0f1117" }}>
                  <h4 className="text-xl font-bold text-white mb-2">Multi-Bay Car Wash</h4>
                  <p className="text-slate-400 text-sm mb-4">
                    500 kW peak demand • 32% energy savings
                  </p>

                  <div className="grid grid-cols-3 gap-2 mb-4">
                    <div
                      className="text-center rounded-xl py-2"
                      style={{
                        background: "rgba(255,255,255,0.04)",
                        border: "1px solid rgba(255,255,255,0.06)",
                      }}
                    >
                      <div className="text-lg font-bold text-[#3ECF8E]">1.2yr</div>
                      <div className="text-xs text-slate-500">Payback</div>
                    </div>
                    <div
                      className="text-center rounded-xl py-2"
                      style={{
                        background: "rgba(255,255,255,0.04)",
                        border: "1px solid rgba(255,255,255,0.06)",
                      }}
                    >
                      <div className="text-lg font-bold text-[#3ECF8E]">840%</div>
                      <div className="text-xs text-slate-500">ROI</div>
                    </div>
                    <div
                      className="text-center rounded-xl py-2"
                      style={{
                        background: "rgba(255,255,255,0.04)",
                        border: "1px solid rgba(255,255,255,0.06)",
                      }}
                    >
                      <div className="text-lg font-bold text-white">20 MWh</div>
                      <div className="text-xs text-slate-500">System</div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-500">Click for similar quote</span>
                    <span className="text-[#3ECF8E] group-hover:translate-x-2 transition-transform">
                      →
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Hotel */}
            <div
              className="group cursor-pointer"
              onClick={() => {
                onOpenStory("hotel");
              }}
            >
              <div
                className="relative overflow-hidden rounded-3xl transition-all duration-500 hover:scale-[1.02] hover:-translate-y-2"
                style={{ boxShadow: "0 25px 80px rgba(0,0,0,0.4)" }}
              >
                <div className="relative h-56 overflow-hidden">
                  <img
                    src={hotelImage}
                    alt="Luxury Hotel"
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0f1117] via-[#0f1117]/60 to-transparent" />
                  <div className="absolute top-4 right-4 bg-[#3ECF8E] text-white px-4 py-2 rounded-full font-bold text-sm shadow-lg">
                    $89K/yr savings
                  </div>
                </div>

                <div className="p-6" style={{ background: "#0f1117" }}>
                  <h4 className="text-xl font-bold text-white mb-2">Luxury Hotel</h4>
                  <p className="text-slate-400 text-sm mb-4">350 rooms • High HVAC demand</p>

                  <div className="grid grid-cols-3 gap-2 mb-4">
                    <div
                      className="text-center rounded-xl py-2"
                      style={{
                        background: "rgba(255,255,255,0.04)",
                        border: "1px solid rgba(255,255,255,0.06)",
                      }}
                    >
                      <div className="text-lg font-bold text-[#3ECF8E]">3.2yr</div>
                      <div className="text-xs text-slate-500">Payback</div>
                    </div>
                    <div
                      className="text-center rounded-xl py-2"
                      style={{
                        background: "rgba(255,255,255,0.04)",
                        border: "1px solid rgba(255,255,255,0.06)",
                      }}
                    >
                      <div className="text-lg font-bold text-[#3ECF8E]">312%</div>
                      <div className="text-xs text-slate-500">ROI</div>
                    </div>
                    <div
                      className="text-center rounded-xl py-2"
                      style={{
                        background: "rgba(255,255,255,0.04)",
                        border: "1px solid rgba(255,255,255,0.06)",
                      }}
                    >
                      <div className="text-lg font-bold text-white">1.5 MWh</div>
                      <div className="text-xs text-slate-500">System</div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-500">Click for similar quote</span>
                    <span className="text-[#3ECF8E] group-hover:translate-x-2 transition-transform">
                      →
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* EV Charging */}
            <div
              className="group cursor-pointer"
              onClick={() => {
                onOpenStory("ev-charging");
              }}
            >
              <div
                className="relative overflow-hidden rounded-3xl transition-all duration-500 hover:scale-[1.02] hover:-translate-y-2"
                style={{ boxShadow: "0 25px 80px rgba(0,0,0,0.4)" }}
              >
                <div className="relative h-56 overflow-hidden">
                  <img
                    src={evChargingStationImage}
                    alt="EV Charging Hub"
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0f1117] via-[#0f1117]/60 to-transparent" />
                  <div className="absolute top-4 right-4 bg-[#3ECF8E] text-white px-4 py-2 rounded-full font-bold text-sm shadow-lg">
                    $215K/yr savings
                  </div>
                </div>

                <div className="p-6" style={{ background: "#0f1117" }}>
                  <h4 className="text-xl font-bold text-white mb-2">EV Charging Hub</h4>
                  <p className="text-slate-400 text-sm mb-4">
                    12 DCFC chargers • High demand spikes
                  </p>

                  <div className="grid grid-cols-3 gap-2 mb-4">
                    <div
                      className="text-center rounded-xl py-2"
                      style={{
                        background: "rgba(255,255,255,0.04)",
                        border: "1px solid rgba(255,255,255,0.06)",
                      }}
                    >
                      <div className="text-lg font-bold text-[#3ECF8E]">2.8yr</div>
                      <div className="text-xs text-slate-500">Payback</div>
                    </div>
                    <div
                      className="text-center rounded-xl py-2"
                      style={{
                        background: "rgba(255,255,255,0.04)",
                        border: "1px solid rgba(255,255,255,0.06)",
                      }}
                    >
                      <div className="text-lg font-bold text-[#3ECF8E]">428%</div>
                      <div className="text-xs text-slate-500">ROI</div>
                    </div>
                    <div
                      className="text-center rounded-xl py-2"
                      style={{
                        background: "rgba(255,255,255,0.04)",
                        border: "1px solid rgba(255,255,255,0.06)",
                      }}
                    >
                      <div className="text-lg font-bold text-white">3 MWh</div>
                      <div className="text-xs text-slate-500">System</div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-500">Click for similar quote</span>
                    <span className="text-[#3ECF8E] group-hover:translate-x-2 transition-transform">
                      →
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
