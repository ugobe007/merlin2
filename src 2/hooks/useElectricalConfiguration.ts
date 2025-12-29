import { useState, useCallback } from 'react';

/**
 * Electrical Configuration Hook
 * 
 * Manages all electrical system specifications including:
 * - System voltage levels (AC and DC)
 * - Inverter/PCS configuration
 * - Switchgear specifications
 * - Battery Management System (BMS)
 * - Transformer requirements
 * - User input overrides for electrical calculations
 * 
 * Extracted from AdvancedQuoteBuilder.tsx (Phase 3.2)
 */

export interface ElectricalConfiguration {
  // Voltage Specifications
  systemVoltage: number; // Volts AC
  dcVoltage: number; // Volts DC
  
  // Inverter/PCS Configuration
  inverterType: string; // 'bidirectional' or 'unidirectional'
  inverterManufacturer: string;
  inverterRating: number; // kW per inverter
  pcsQuoteSeparately: boolean; // Quote PCS separately vs included
  numberOfInvertersInput: number; // Manual override
  
  // Switchgear
  switchgearType: string;
  switchgearRating: number; // Amps
  
  // Battery Management System
  bmsType: string; // 'distributed' or 'centralized'
  bmsManufacturer: string;
  
  // Transformer
  transformerRequired: boolean;
  transformerRating: number; // kVA
  transformerVoltage: string; // e.g., '480V/12470V'
  
  // User Input Overrides
  systemWattsInput: number | ''; // User input for watts
  systemAmpsACInput: number | ''; // User input for AC amps
  systemAmpsDCInput: number | ''; // User input for DC amps
}

export interface ElectricalConfigurationSetters {
  setSystemVoltage: (value: number) => void;
  setDcVoltage: (value: number) => void;
  setInverterType: (value: string) => void;
  setInverterManufacturer: (value: string) => void;
  setInverterRating: (value: number) => void;
  setPcsQuoteSeparately: (value: boolean) => void;
  setNumberOfInvertersInput: (value: number) => void;
  setSwitchgearType: (value: string) => void;
  setSwitchgearRating: (value: number) => void;
  setBmsType: (value: string) => void;
  setBmsManufacturer: (value: string) => void;
  setTransformerRequired: (value: boolean) => void;
  setTransformerRating: (value: number) => void;
  setTransformerVoltage: (value: string) => void;
  setSystemWattsInput: (value: number | '') => void;
  setSystemAmpsACInput: (value: number | '') => void;
  setSystemAmpsDCInput: (value: number | '') => void;
}

export interface UseElectricalConfigurationReturn {
  config: ElectricalConfiguration;
  setters: ElectricalConfigurationSetters;
  resetToDefaults: () => void;
}

const DEFAULT_CONFIG: ElectricalConfiguration = {
  systemVoltage: 480, // Volts AC
  dcVoltage: 1000, // Volts DC
  inverterType: 'bidirectional',
  inverterManufacturer: '',
  inverterRating: 2500, // kW per inverter
  pcsQuoteSeparately: false,
  numberOfInvertersInput: 1,
  switchgearType: 'medium-voltage',
  switchgearRating: 5000, // Amps
  bmsType: 'distributed',
  bmsManufacturer: '',
  transformerRequired: true,
  transformerRating: 3000, // kVA
  transformerVoltage: '480V/12470V',
  systemWattsInput: '',
  systemAmpsACInput: '',
  systemAmpsDCInput: '',
};

export function useElectricalConfiguration(
  initialConfig?: Partial<ElectricalConfiguration>
): UseElectricalConfigurationReturn {
  // Merge initial config with defaults
  const initial = { ...DEFAULT_CONFIG, ...initialConfig };
  
  // Voltage Specifications
  const [systemVoltage, setSystemVoltage] = useState(initial.systemVoltage);
  const [dcVoltage, setDcVoltage] = useState(initial.dcVoltage);
  
  // Inverter/PCS Configuration
  const [inverterType, setInverterType] = useState(initial.inverterType);
  const [inverterManufacturer, setInverterManufacturer] = useState(initial.inverterManufacturer);
  const [inverterRating, setInverterRating] = useState(initial.inverterRating);
  const [pcsQuoteSeparately, setPcsQuoteSeparately] = useState(initial.pcsQuoteSeparately);
  const [numberOfInvertersInput, setNumberOfInvertersInput] = useState(initial.numberOfInvertersInput);
  
  // Switchgear
  const [switchgearType, setSwitchgearType] = useState(initial.switchgearType);
  const [switchgearRating, setSwitchgearRating] = useState(initial.switchgearRating);
  
  // Battery Management System
  const [bmsType, setBmsType] = useState(initial.bmsType);
  const [bmsManufacturer, setBmsManufacturer] = useState(initial.bmsManufacturer);
  
  // Transformer
  const [transformerRequired, setTransformerRequired] = useState(initial.transformerRequired);
  const [transformerRating, setTransformerRating] = useState(initial.transformerRating);
  const [transformerVoltage, setTransformerVoltage] = useState(initial.transformerVoltage);
  
  // User Input Overrides
  const [systemWattsInput, setSystemWattsInput] = useState<number | ''>(initial.systemWattsInput);
  const [systemAmpsACInput, setSystemAmpsACInput] = useState<number | ''>(initial.systemAmpsACInput);
  const [systemAmpsDCInput, setSystemAmpsDCInput] = useState<number | ''>(initial.systemAmpsDCInput);
  
  // Reset all values to defaults
  const resetToDefaults = useCallback(() => {
    setSystemVoltage(DEFAULT_CONFIG.systemVoltage);
    setDcVoltage(DEFAULT_CONFIG.dcVoltage);
    setInverterType(DEFAULT_CONFIG.inverterType);
    setInverterManufacturer(DEFAULT_CONFIG.inverterManufacturer);
    setInverterRating(DEFAULT_CONFIG.inverterRating);
    setPcsQuoteSeparately(DEFAULT_CONFIG.pcsQuoteSeparately);
    setNumberOfInvertersInput(DEFAULT_CONFIG.numberOfInvertersInput);
    setSwitchgearType(DEFAULT_CONFIG.switchgearType);
    setSwitchgearRating(DEFAULT_CONFIG.switchgearRating);
    setBmsType(DEFAULT_CONFIG.bmsType);
    setBmsManufacturer(DEFAULT_CONFIG.bmsManufacturer);
    setTransformerRequired(DEFAULT_CONFIG.transformerRequired);
    setTransformerRating(DEFAULT_CONFIG.transformerRating);
    setTransformerVoltage(DEFAULT_CONFIG.transformerVoltage);
    setSystemWattsInput(DEFAULT_CONFIG.systemWattsInput);
    setSystemAmpsACInput(DEFAULT_CONFIG.systemAmpsACInput);
    setSystemAmpsDCInput(DEFAULT_CONFIG.systemAmpsDCInput);
  }, []);
  
  return {
    config: {
      systemVoltage,
      dcVoltage,
      inverterType,
      inverterManufacturer,
      inverterRating,
      pcsQuoteSeparately,
      numberOfInvertersInput,
      switchgearType,
      switchgearRating,
      bmsType,
      bmsManufacturer,
      transformerRequired,
      transformerRating,
      transformerVoltage,
      systemWattsInput,
      systemAmpsACInput,
      systemAmpsDCInput,
    },
    setters: {
      setSystemVoltage,
      setDcVoltage,
      setInverterType,
      setInverterManufacturer,
      setInverterRating,
      setPcsQuoteSeparately,
      setNumberOfInvertersInput,
      setSwitchgearType,
      setSwitchgearRating,
      setBmsType,
      setBmsManufacturer,
      setTransformerRequired,
      setTransformerRating,
      setTransformerVoltage,
      setSystemWattsInput,
      setSystemAmpsACInput,
      setSystemAmpsDCInput,
    },
    resetToDefaults,
  };
}
