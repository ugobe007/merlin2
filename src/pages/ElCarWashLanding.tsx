import CarWashCampaign, { EL_CAR_WASH_CONFIG } from "./CarWashCampaign";

// This is now just a wrapper that uses the El Car Wash config
// For other car washes, duplicate this file and import a different config
export default function ElCarWashLanding() {
  return <CarWashCampaign config={EL_CAR_WASH_CONFIG} />;
}
