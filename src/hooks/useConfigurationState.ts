import { useState } from "react";

/**
 * BESS CONFIGURATION STATE HOOK
 *
 * Manages all BESS system configuration state including:
 * - Project details (name, location, use case)
 * - Battery specifications (chemistry, warranty, cycles)
 * - Electrical specifications (voltage, inverters, switchgear)
 * - Installation details (type, grid connection)
 *
 * Extracted from AdvancedQuoteBuilder.tsx (Phase 1G, Feb 2026)
 */

export function useConfigurationState() {
  // ═══ Project Details ═══
  const [projectName, setProjectName] = useState("");
  const [location, setLocation] = useState("");
  const [applicationType, setApplicationType] = useState("commercial");
  const [useCase, setUseCase] = useState("peak-shaving");

  // ═══ Battery Specifications ═══
  const [chemistry, setChemistry] = useState("lfp");
  const [roundTripEfficiency, setRoundTripEfficiency] = useState(90);
  const [warrantyYears, setWarrantyYears] = useState(10);
  const [cyclesPerYear, setCyclesPerYear] = useState(365);

  // ═══ Utility/Financial Parameters ═══
  const [utilityRate, setUtilityRate] = useState(0.12);
  const [demandCharge, setDemandCharge] = useState(15);

  // ═══ Installation Details ═══
  const [installationType, setInstallationType] = useState("outdoor");
  const [gridConnection, setGridConnection] = useState("ac-coupled");
  const [inverterEfficiency, setInverterEfficiency] = useState(96);

  // ═══ Electrical Specifications ═══
  const [systemVoltage, setSystemVoltage] = useState(480); // Volts AC
  const [dcVoltage, setDcVoltage] = useState(1000); // Volts DC
  const [inverterType, setInverterType] = useState("bidirectional");
  const [inverterManufacturer, setInverterManufacturer] = useState("");
  const [inverterRating, setInverterRating] = useState(2500); // kW per inverter
  const [pcsQuoteSeparately, setPcsQuoteSeparately] = useState(false);
  const [numberOfInvertersInput, setNumberOfInvertersInput] = useState(1);
  const [switchgearType, setSwitchgearType] = useState("medium-voltage");
  const [switchgearRating, setSwitchgearRating] = useState(5000); // Amps
  const [bmsType, setBmsType] = useState("distributed");
  const [_bmsManufacturer, setBmsManufacturer] = useState("");
  const [transformerRequired, setTransformerRequired] = useState(true);
  const [transformerRating, setTransformerRating] = useState(3000); // kVA
  const [transformerVoltage, setTransformerVoltage] = useState("480V/12470V");

  // ═══ User-specified Electrical Overrides ═══
  const [systemWattsInput, setSystemWattsInput] = useState<number | "">("");
  const [systemAmpsACInput, setSystemAmpsACInput] = useState<number | "">("");
  const [systemAmpsDCInput, setSystemAmpsDCInput] = useState<number | "">("");

  return {
    // Project Details
    projectName,
    setProjectName,
    location,
    setLocation,
    applicationType,
    setApplicationType,
    useCase,
    setUseCase,

    // Battery Specifications
    chemistry,
    setChemistry,
    roundTripEfficiency,
    setRoundTripEfficiency,
    warrantyYears,
    setWarrantyYears,
    cyclesPerYear,
    setCyclesPerYear,

    // Utility/Financial
    utilityRate,
    setUtilityRate,
    demandCharge,
    setDemandCharge,

    // Installation
    installationType,
    setInstallationType,
    gridConnection,
    setGridConnection,
    inverterEfficiency,
    setInverterEfficiency,

    // Electrical Specifications
    systemVoltage,
    setSystemVoltage,
    dcVoltage,
    setDcVoltage,
    inverterType,
    setInverterType,
    inverterManufacturer,
    setInverterManufacturer,
    inverterRating,
    setInverterRating,
    pcsQuoteSeparately,
    setPcsQuoteSeparately,
    numberOfInvertersInput,
    setNumberOfInvertersInput,
    switchgearType,
    setSwitchgearType,
    switchgearRating,
    setSwitchgearRating,
    bmsType,
    setBmsType,
    _bmsManufacturer,
    setBmsManufacturer,
    transformerRequired,
    setTransformerRequired,
    transformerRating,
    setTransformerRating,
    transformerVoltage,
    setTransformerVoltage,

    // Electrical Overrides
    systemWattsInput,
    setSystemWattsInput,
    systemAmpsACInput,
    setSystemAmpsACInput,
    systemAmpsDCInput,
    setSystemAmpsDCInput,
  };
}
