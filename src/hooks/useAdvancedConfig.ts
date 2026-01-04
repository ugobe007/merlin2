import { useState } from "react";

export interface AdvancedConfig {
  projectReference: string;
  customerName: string;
  siteLocation: string;
  powerMW: string;
  energyMWh: string;
  voltage: string;
  projectDescription: string;
  executiveSummary: string;
  technicalSpecifications: string;
  commercialTerms: string;
}

export const useAdvancedConfig = () => {
  const [config, setConfig] = useState<AdvancedConfig>({
    projectReference: "",
    customerName: "",
    siteLocation: "",
    powerMW: "",
    energyMWh: "",
    voltage: "480V",
    projectDescription: "",
    executiveSummary: "",
    technicalSpecifications: "",
    commercialTerms: "",
  });

  return { config, setConfig };
};
