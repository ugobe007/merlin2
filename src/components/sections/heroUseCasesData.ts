/**
 * HERO USE CASES DATA — AUTO-GENERATED
 * =====================================
 * DO NOT EDIT MANUALLY.
 * Regenerate with:  node scripts/generateHeroData.mjs
 *
 * Generated: 2026-02-23T08:24:22.195Z
 *
 * METHODOLOGY (NREL ATB 2024 + BNEF 1H 2026 — matches unifiedQuoteCalculator.ts fallback):
 *   BESS price:       $130/kWh    (NREL ATB 2024, LFP utility-scale)
 *   Install/ship/tariff: 23% of BESS cost
 *   ITC:              30%        (IRA 2022 base, Davis-Bacon qualified)
 *   Peak shaving:     MWh × 365 × (rate − $0.05) × 1,000   [centralizedCalculations.ts L402]
 *   Demand charge:    MW × 12 × $15,000/MW/month          [centralizedCalculations.ts L406]
 *   Grid services:    MW × $30,000/MW/year                  [centralizedCalculations.ts L413]
 *   NPV:              25-yr DCF, 8% discount, 2% escalation, 2% degradation/yr
 *   Rate source:      EIA Commercial Sector, Table 5.6.B, 2024 Annual Average
 */

import carWashValet from "../../assets/images/car_wash_valet.jpg";
import hospital3Image from "../../assets/images/hospital_3.jpg";
import evChargingStationImage from "@/assets/images/ev_charging_station.jpg";
import airportImage from "../../assets/images/airports_1.jpg";
import hotelHolidayInn2 from "../../assets/images/hotel_motel_holidayinn_2.jpg";
import hotelHolidayInn3 from "../../assets/images/hotel_motel_holidayinn_3.jpg";
import dataCenter1 from "../../assets/images/data-center-1.jpg";
import manufacturing1 from "../../assets/images/manufacturing_1.jpg";
import logistics1 from "../../assets/images/logistics_1.jpg";
import officeBuilding1 from "../../assets/images/office_building1.jpg";
import indoorFarm1 from "../../assets/images/indoor_farm1.jpeg";
import college1 from "../../assets/images/college_1.jpg";

// ── Type ─────────────────────────────────────────────────────────────────────

export interface HeroUseCase {
  id: string;
  /** Display name shown on carousel card */
  name: string;
  /** Static asset imported above */
  image: string;
  /** "X.X MW / Y.Y MWh" */
  systemSize: string;
  /** Formatted annual savings, e.g. "$487K" */
  savings: string;
  /** Formatted simple payback, e.g. "1.7 yrs" */
  payback: string;
  /** 10-year ROI percentage string, e.g. "473%" */
  roi: string;
  /** Net present value (25-yr), e.g. "$14.2M" */
  npv: string;
  /** Internal rate of return, e.g. "38.4%" */
  irr: string;
  /** Net cost after ITC, e.g. "$2.2M" */
  netCost: string;
  /** TrueQuote™ audit trail — inputs that produced these outputs */
  _inputs: {
    storageSizeMW: number;
    durationHours: number;
    electricityRate: number; // EIA 2024 state commercial avg ($/kWh)
    location: string;
    itcRate: number;
    bessPerKWh: number; // NREL ATB 2024 $/kWh
    demandChargePerMWMonth: number;
    gridServicePerMW: number;
    note: string;
    source: string;
  };
}

// ── Data ─────────────────────────────────────────────────────────────────────

export const HERO_USE_CASES: HeroUseCase[] = [
  {
    id: "data-center-enterprise",
    name: "Enterprise Data Center",
    image: dataCenter1,
    systemSize: "5.0 MW / 20.0 MWh",
    savings: "$1.3M",
    payback: "1.7 yrs",
    roi: "473%",
    npv: "$11.4M",
    irr: "57.3%",
    netCost: "$2.2M",
    _inputs: {
      storageSizeMW: 5,
      durationHours: 4,
      electricityRate: 0.082, // EIA 2024 Ashburn, VA commercial avg
      location: "Ashburn, VA",
      itcRate: 0.3,
      bessPerKWh: 130,
      demandChargePerMWMonth: 15000,
      gridServicePerMW: 30000,
      note: "Peak shaving + demand response for Tier III facility",
      source: "NREL ATB 2024 + EIA State Commercial Rates 2024",
    },
  },
  {
    id: "hotel-luxury",
    name: "Luxury Hotel",
    image: hotelHolidayInn2,
    systemSize: "2.0 MW / 8.0 MWh",
    savings: "$916K",
    payback: "12 mo",
    roi: "923%",
    npv: "$8.9M",
    irr: "102.3%",
    netCost: "$895K",
    _inputs: {
      storageSizeMW: 2,
      durationHours: 4,
      electricityRate: 0.22, // EIA 2024 Los Angeles, CA commercial avg
      location: "Los Angeles, CA",
      itcRate: 0.3,
      bessPerKWh: 130,
      demandChargePerMWMonth: 15000,
      gridServicePerMW: 30000,
      note: "Demand charge reduction + TOU arbitrage",
      source: "NREL ATB 2024 + EIA State Commercial Rates 2024",
    },
  },
  {
    id: "car-wash-tunnel",
    name: "Tunnel Car Wash",
    image: carWashValet,
    systemSize: "0.7 MW / 2.6 MWh",
    savings: "$193K",
    payback: "1.5 yrs",
    roi: "565%",
    npv: "$1.8M",
    irr: "66.4%",
    netCost: "$291K",
    _inputs: {
      storageSizeMW: 0.65,
      durationHours: 4,
      electricityRate: 0.11, // EIA 2024 Chicago, IL commercial avg
      location: "Chicago, IL",
      itcRate: 0.3,
      bessPerKWh: 130,
      demandChargePerMWMonth: 15000,
      gridServicePerMW: 30000,
      note: "Peak shaving for high-draw tunnel conveyor system",
      source: "NREL ATB 2024 + EIA State Commercial Rates 2024",
    },
  },
  {
    id: "ev-charging-hub",
    name: "EV Charging Hub",
    image: evChargingStationImage,
    systemSize: "2.0 MW / 8.0 MWh",
    savings: "$522K",
    payback: "1.7 yrs",
    roi: "483%",
    npv: "$4.7M",
    irr: "58.3%",
    netCost: "$895K",
    _inputs: {
      storageSizeMW: 2,
      durationHours: 4,
      electricityRate: 0.085, // EIA 2024 Dallas, TX commercial avg
      location: "Dallas, TX",
      itcRate: 0.3,
      bessPerKWh: 130,
      demandChargePerMWMonth: 15000,
      gridServicePerMW: 30000,
      note: "BESS eliminates demand spikes from DCFC/HPC chargers",
      source: "NREL ATB 2024 + EIA State Commercial Rates 2024",
    },
  },
  {
    id: "hospital-regional",
    name: "Regional Hospital",
    image: hospital3Image,
    systemSize: "1.5 MW / 6.0 MWh",
    savings: "$665K",
    payback: "1.0 yrs",
    roi: "891%",
    npv: "$6.4M",
    irr: "99%",
    netCost: "$672K",
    _inputs: {
      storageSizeMW: 1.5,
      durationHours: 4,
      electricityRate: 0.21, // EIA 2024 New York, NY commercial avg
      location: "New York, NY",
      itcRate: 0.3,
      bessPerKWh: 130,
      demandChargePerMWMonth: 15000,
      gridServicePerMW: 30000,
      note: "Resilience + peak shaving for 24/7 critical facility",
      source: "NREL ATB 2024 + EIA State Commercial Rates 2024",
    },
  },
  {
    id: "manufacturing-plant",
    name: "Manufacturing Plant",
    image: manufacturing1,
    systemSize: "3.5 MW / 14.0 MWh",
    savings: "$991K",
    payback: "1.6 yrs",
    roi: "532%",
    npv: "$9.0M",
    irr: "63.2%",
    netCost: "$1.6M",
    _inputs: {
      storageSizeMW: 3.5,
      durationHours: 4,
      electricityRate: 0.1, // EIA 2024 Detroit, MI commercial avg
      location: "Detroit, MI",
      itcRate: 0.3,
      bessPerKWh: 130,
      demandChargePerMWMonth: 15000,
      gridServicePerMW: 30000,
      note: "Industrial demand charge elimination during production peaks",
      source: "NREL ATB 2024 + EIA State Commercial Rates 2024",
    },
  },
  {
    id: "office-building",
    name: "Office Campus",
    image: officeBuilding1,
    systemSize: "1.0 MW / 4.0 MWh",
    savings: "$305K",
    payback: "1.5 yrs",
    roi: "581%",
    npv: "$2.8M",
    irr: "68.1%",
    netCost: "$448K",
    _inputs: {
      storageSizeMW: 1,
      durationHours: 4,
      electricityRate: 0.115, // EIA 2024 Chicago, IL commercial avg
      location: "Chicago, IL",
      itcRate: 0.3,
      bessPerKWh: 130,
      demandChargePerMWMonth: 15000,
      gridServicePerMW: 30000,
      note: "TOU arbitrage + demand shaving for Class-A office",
      source: "NREL ATB 2024 + EIA State Commercial Rates 2024",
    },
  },
  {
    id: "airport-regional",
    name: "Regional Airport",
    image: airportImage,
    systemSize: "4.0 MW / 16.0 MWh",
    savings: "$1.1M",
    payback: "1.6 yrs",
    roi: "532%",
    npv: "$10.3M",
    irr: "63.2%",
    netCost: "$1.8M",
    _inputs: {
      storageSizeMW: 4,
      durationHours: 4,
      electricityRate: 0.1, // EIA 2024 Phoenix, AZ commercial avg
      location: "Phoenix, AZ",
      itcRate: 0.3,
      bessPerKWh: 130,
      demandChargePerMWMonth: 15000,
      gridServicePerMW: 30000,
      note: "Grid resilience + demand management for terminal operations",
      source: "NREL ATB 2024 + EIA State Commercial Rates 2024",
    },
  },
  {
    id: "college-campus",
    name: "University Campus",
    image: college1,
    systemSize: "2.0 MW / 8.0 MWh",
    savings: "$829K",
    payback: "1.1 yrs",
    roi: "826%",
    npv: "$7.9M",
    irr: "92.5%",
    netCost: "$895K",
    _inputs: {
      storageSizeMW: 2,
      durationHours: 4,
      electricityRate: 0.19, // EIA 2024 Boston, MA commercial avg
      location: "Boston, MA",
      itcRate: 0.3,
      bessPerKWh: 130,
      demandChargePerMWMonth: 15000,
      gridServicePerMW: 30000,
      note: "Microgrid resilience + demand response for campus load",
      source: "NREL ATB 2024 + EIA State Commercial Rates 2024",
    },
  },
  {
    id: "indoor-farm",
    name: "Indoor Vertical Farm",
    image: indoorFarm1,
    systemSize: "0.8 MW / 3.2 MWh",
    savings: "$238K",
    payback: "1.5 yrs",
    roi: "565%",
    npv: "$2.2M",
    irr: "66.4%",
    netCost: "$358K",
    _inputs: {
      storageSizeMW: 0.8,
      durationHours: 4,
      electricityRate: 0.11, // EIA 2024 Denver, CO commercial avg
      location: "Denver, CO",
      itcRate: 0.3,
      bessPerKWh: 130,
      demandChargePerMWMonth: 15000,
      gridServicePerMW: 30000,
      note: "24/7 grow-light load leveling + demand charge reduction",
      source: "NREL ATB 2024 + EIA State Commercial Rates 2024",
    },
  },
  {
    id: "distribution-center",
    name: "Distribution Center",
    image: logistics1,
    systemSize: "2.0 MW / 8.0 MWh",
    savings: "$537K",
    payback: "1.7 yrs",
    roi: "499%",
    npv: "$4.8M",
    irr: "59.9%",
    netCost: "$895K",
    _inputs: {
      storageSizeMW: 2,
      durationHours: 4,
      electricityRate: 0.09, // EIA 2024 Atlanta, GA commercial avg
      location: "Atlanta, GA",
      itcRate: 0.3,
      bessPerKWh: 130,
      demandChargePerMWMonth: 15000,
      gridServicePerMW: 30000,
      note: "Dock charging peak shaving + TOU arbitrage",
      source: "NREL ATB 2024 + EIA State Commercial Rates 2024",
    },
  },
  {
    id: "resort-casino",
    name: "Resort & Casino",
    image: hotelHolidayInn3,
    systemSize: "2.5 MW / 10.0 MWh",
    savings: "$708K",
    payback: "1.6 yrs",
    roi: "532%",
    npv: "$6.4M",
    irr: "63.2%",
    netCost: "$1.1M",
    _inputs: {
      storageSizeMW: 2.5,
      durationHours: 4,
      electricityRate: 0.1, // EIA 2024 Las Vegas, NV commercial avg
      location: "Las Vegas, NV",
      itcRate: 0.3,
      bessPerKWh: 130,
      demandChargePerMWMonth: 15000,
      gridServicePerMW: 30000,
      note: "24/7 demand flattening + grid independence for gaming floor",
      source: "NREL ATB 2024 + EIA State Commercial Rates 2024",
    },
  },
];
