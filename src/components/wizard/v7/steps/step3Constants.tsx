import React from "react";
import { Building2, Settings, Zap, Sun, Target } from "lucide-react";
import type { CanonicalIndustryKey } from "@/wizard/v7/schema/curatedFieldsResolver";

import hotelImg from "@/assets/images/hotel_motel_holidayinn_1.jpg";
import carWashImg from "@/assets/images/car_wash_1.jpg";
import manufacturingImg from "@/assets/images/manufacturing_1.jpg";
import warehouseImg from "@/assets/images/logistics_1.jpg";
import officeImg from "@/assets/images/office_building1.jpg";
import retailImg from "@/assets/images/retail_1.jpg";
import restaurantImg from "@/assets/images/restaurant_1.jpg";
import healthcareImg from "@/assets/images/hospital_1.jpg";
import dataCenterImg from "@/assets/images/data-center-1.jpg";
import evChargingImg from "@/assets/images/ev_charging_station.jpg";
import airportImg from "@/assets/images/airport_11.jpeg";
import casinoImg from "@/assets/images/casino_gaming1.jpg";
import gasStationImg from "@/assets/images/truck_stop.jpg";
import collegeImg from "@/assets/images/college_1.jpg";
import agricultureImg from "@/assets/images/agriculture_1.jpg";
import apartmentImg from "@/assets/images/apartment_building.jpg";
import residentialImg from "@/assets/images/Residential1.jpg";
import indoorFarmImg from "@/assets/images/indoor_farm1.jpg";
import merlinIcon from "@/assets/images/new_small_profile_.png";

export const INDUSTRY_IMAGES: Record<CanonicalIndustryKey | "other", string> = {
  hotel: hotelImg,
  car_wash: carWashImg,
  manufacturing: manufacturingImg,
  warehouse: warehouseImg,
  logistics: warehouseImg,
  office: officeImg,
  retail: retailImg,
  restaurant: restaurantImg,
  hospital: healthcareImg,
  healthcare: healthcareImg,
  data_center: dataCenterImg,
  ev_charging: evChargingImg,
  airport: airportImg,
  casino: casinoImg,
  gas_station: gasStationImg,
  truck_stop: gasStationImg,
  college: collegeImg,
  agriculture: agricultureImg,
  apartment: apartmentImg,
  residential: residentialImg,
  indoor_farm: indoorFarmImg,
  other: officeImg,
} as Record<string, string>;

export const SECTION_ICONS: Record<string, React.ReactNode> = {
  facility: <Building2 className="w-4 h-4" />,
  operations: <Settings className="w-4 h-4" />,
  energy: <Zap className="w-4 h-4" />,
  solar: <Sun className="w-4 h-4" />,
  goals: <Target className="w-4 h-4" />,
};

export const SECTION_DESCRIPTIONS: Record<string, string> = {
  facility: "Tell us about your building or site",
  operations: "How your facility operates day-to-day",
  energy: "Your current energy setup and grid connection",
  solar: "Solar generation potential and existing installations",
  goals: "What you want to achieve with energy storage",
};
