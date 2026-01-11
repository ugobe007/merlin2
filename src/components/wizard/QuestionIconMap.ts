/**
 * Question Icon Mapping
 * Maps field names and question types to appropriate icons
 * Supports emoji icons, image icons, and custom SVG icons
 */

// Image icon paths
import evChargerIcon from '@/assets/images/ev_charger.png';
import chargingStationIcon from '@/assets/images/charging-station.png';
import chargerIcon from '@/assets/images/charger.png';

// Custom Merlin SVG Icons
import {
  ExpressTunnelIcon,
  MiniTunnelIcon,
  InBayAutomaticIcon,
  SelfServeBayIcon,
  WaterDropIcon,
  ElectricIcon,
  GasFlameIcon,
  PropaneIcon,
  SnowflakeIcon,
  PumpIcon,
  HighPressurePumpIcon,
  MultiplePumpsIcon,
  VFDIcon,
  NoReclaimIcon,
  PartialReclaimIcon,
  FullReclaimIcon,
  BlowerIcon,
  HeatedDryerIcon,
  NoDryerIcon,
  VacuumIcon,
  CentralVacuumIcon,
  GantryTruckWashIcon,
  SolarPanelIcon,
  RoofIcon,
  CarportIcon,
  BatteryIcon,
  EVChargerIcon,
  Level2ChargerIcon,
  DCFastChargerIcon,
  ClockIcon,
  CalendarIcon,
  CarIcon,
  OfficeIcon,
  SecurityCameraIcon,
  LightBulbIcon,
  SignIcon,
  AreaIcon,
  RulerIcon,
  DollarIcon,
  CheckCircleIcon,
  InfoIcon,
  StadiumIcon,
  ArenaIcon,
  FieldIcon,
  SeatingIcon,
  ScoreboardIcon,
  ConcessionsIcon,
  ParkingLotIcon,
  LightingTowerIcon,
  BroadcastBoothIcon,
  LockerRoomIcon
} from '@/components/icons/MerlinIcons';
import React from 'react';

export interface IconConfig {
  type: 'emoji' | 'image' | 'svg';
  value: string | React.ComponentType<{ className?: string }>; // emoji string, image path, or React component
  alt?: string; // alt text for images
}

export const QUESTION_ICON_MAP: Record<string, IconConfig | string> = {
  // EV Charging Equipment (Using Custom SVG Icons)
  'mcsChargers': { type: 'svg', value: EVChargerIcon, alt: 'MCS Charger' },        // Megawatt Charging System for Semi Trucks
  'mcsChargerCount': { type: 'svg', value: EVChargerIcon, alt: 'MCS Charger' },
  'mcs': { type: 'svg', value: EVChargerIcon, alt: 'MCS Charger' },
  'megawatt': { type: 'svg', value: EVChargerIcon, alt: 'MCS Charger' },
  'dcfc': { type: 'svg', value: DCFastChargerIcon, alt: 'DC Fast Charger' },               // DC Fast Charger
  'dcfc350': { type: 'svg', value: DCFastChargerIcon, alt: 'DC Fast Charger 350kW' },     // 350kW DC Fast Charger
  'dcfcCount': { type: 'svg', value: DCFastChargerIcon, alt: 'DC Fast Charger' },
  'fastCharger': { type: 'svg', value: DCFastChargerIcon, alt: 'Fast Charger' },
  'fastChargers': { type: 'svg', value: DCFastChargerIcon, alt: 'Fast Chargers' },
  'dcFast': { type: 'svg', value: DCFastChargerIcon, alt: 'DC Fast Charger' },
  'level2': { type: 'svg', value: Level2ChargerIcon, alt: 'Level 2 Charger' },             // Level 2 Charger
  'level2Count': { type: 'svg', value: Level2ChargerIcon, alt: 'Level 2 Charger' },
  'l2': { type: 'svg', value: Level2ChargerIcon, alt: 'Level 2 Charger' },
  'l2Charger': { type: 'svg', value: Level2ChargerIcon, alt: 'Level 2 Charger' },
  'l2Chargers': { type: 'svg', value: Level2ChargerIcon, alt: 'Level 2 Chargers' },
  'evChargers': { type: 'svg', value: EVChargerIcon, alt: 'EV Charger' },          // General EV Chargers
  'evCharger': { type: 'svg', value: EVChargerIcon, alt: 'EV Charger' },
  'evChargerCount': { type: 'svg', value: EVChargerIcon, alt: 'EV Charger' },
  'charger': { type: 'svg', value: EVChargerIcon, alt: 'Charger' },             // Generic charger
  'chargers': { type: 'svg', value: EVChargerIcon, alt: 'Chargers' },
  'charging': { type: 'svg', value: EVChargerIcon, alt: 'Charging Station' },
  'chargingStation': { type: 'svg', value: EVChargerIcon, alt: 'Charging Station' },
  'evStation': { type: 'svg', value: EVChargerIcon, alt: 'EV Station' },
  
  // Pumps & Water Systems
  'pump': '💧',
  'pumps': '💧',
  'pumpCount': '💧',
  'waterPump': '💧',
  'highPressurePump': '💦',
  'pumpConfiguration': '💧',
  
  // Service & Maintenance
  'serviceBay': '🔧',
  'serviceBays': '🔧',
  'serviceBayCount': '🔧',
  'bayCount': '🔧',
  'speedco': '🔧',
  'maintenance': '🔧',
  'maintenanceBay': '🔧',
  'washBay': '🧼',
  'washBays': '🧼',
  'truckWash': '🚚',
  'truckWashBay': '🚚',
  'truckWashBays': '🚚', // Truck wash bays - use truck emoji
  
  // Facilities (Mix of emoji and custom icons)
  'restaurant': '🍽️',
  'restaurantSeats': '🍽️',
  'showers': '🚿',
  'hasShowers': '🚿', // Yes/No question for showers
  'laundry': '👕',
  'hasLaundry': '👕', // Yes/No question for laundry
  'parking': '🅿️',
  'parkingAcres': '🅿️',
  'parkingLotAcres': '🅿️', // Parking lot size in acres
  'office': { type: 'svg', value: OfficeIcon, alt: 'Office' },
  'security': { type: 'svg', value: SecurityCameraIcon, alt: 'Security Camera' },
  'lighting': { type: 'svg', value: LightBulbIcon, alt: 'Lighting' },
  'signage': { type: 'svg', value: SignIcon, alt: 'Signage' },
  
  // Energy Systems (Using Custom Icons)
  'solar': { type: 'svg', value: SolarPanelIcon, alt: 'Solar Panels' },
  'roofArea': { type: 'svg', value: RoofIcon, alt: 'Roof Area' },
  'carport': { type: 'svg', value: CarportIcon, alt: 'Carport' },
  'carportInterest': { type: 'svg', value: CarportIcon, alt: 'Carport Interest' },
  'carportArea': { type: 'svg', value: CarportIcon, alt: 'Carport Area' },
  'generator': '⚡',
  'battery': { type: 'svg', value: BatteryIcon, alt: 'Battery' },
  'bess': { type: 'svg', value: BatteryIcon, alt: 'Battery Energy Storage System' },
  'backupPower': { type: 'svg', value: BatteryIcon, alt: 'Backup Power' },
  'backup': { type: 'svg', value: BatteryIcon, alt: 'Backup' },
  'gridConnection': '⚡',
  'grid': '⚡',
  'connection': '🔌',
  'primaryEnergyGoals': '🎯',
  'energyGoals': '🎯',
  'primaryGoals': '🎯',
  
  // Climate & Weather
  'climateZone': '🌡️',
  'climate': '🌡️',
  'weather': '🌦️',
  'temperature': '🌡️',
  
  // Facility Details (Using Custom Icons) - Note: roofArea already defined in Energy Systems above
  'squareFeet': { type: 'svg', value: AreaIcon, alt: 'Square Feet' },
  'squareFootage': { type: 'svg', value: AreaIcon, alt: 'Square Footage' },
  'facilitySize': { type: 'svg', value: AreaIcon, alt: 'Facility Size' },
  // 'roofArea' already defined above in Energy Systems section - removed duplicate
  'monthlyElectricBill': { type: 'svg', value: DollarIcon, alt: 'Monthly Electric Bill' },
  'monthlyDemandCharges': '⚡',
  'peakDemand': '📊',
  'peakDemandKW': '📊',
  
  // Operations (Using Custom Icons)
  'operatingHours': { type: 'svg', value: ClockIcon, alt: 'Operating Hours' },
  'hours': { type: 'svg', value: ClockIcon, alt: 'Hours' },
  'daysPerWeek': { type: 'svg', value: CalendarIcon, alt: 'Days Per Week' },
  'vehiclesPerDay': { type: 'svg', value: CarIcon, alt: 'Vehicles Per Day' },
  'washesPerDay': '🧼',
  
  // Data Center
  'rackCount': '🖥️',
  'racks': '🖥️',
  'itLoad': '💻',
  'cooling': '❄️',
  'pue': '📊',
  'uptimeTier': '⭐',
  
  // Hotel
  'rooms': '🛏️',
  'roomCount': '🛏️',
  'floors': '🏢',
  'amenities': '🏊',
  'spa': '💆',
  'gym': '💪',
  
  // Sports Stadium (Using Custom Icons)
  'stadium': { type: 'svg', value: StadiumIcon, alt: 'Stadium' },
  'arena': { type: 'svg', value: ArenaIcon, alt: 'Arena' },
  'field': { type: 'svg', value: FieldIcon, alt: 'Sports Field' },
  'seating': { type: 'svg', value: SeatingIcon, alt: 'Seating' },
  'seatCount': { type: 'svg', value: SeatingIcon, alt: 'Seat Count' },
  'capacity': { type: 'svg', value: SeatingIcon, alt: 'Capacity' },
  'scoreboard': { type: 'svg', value: ScoreboardIcon, alt: 'Scoreboard' },
  'concessions': { type: 'svg', value: ConcessionsIcon, alt: 'Concessions' },
  'concessionStand': { type: 'svg', value: ConcessionsIcon, alt: 'Concession Stand' },
  'stadiumParking': { type: 'svg', value: ParkingLotIcon, alt: 'Stadium Parking' },
  'parkingLot': { type: 'svg', value: ParkingLotIcon, alt: 'Parking Lot' },
  'lightingTower': { type: 'svg', value: LightingTowerIcon, alt: 'Lighting Tower' },
  'lightingTowers': { type: 'svg', value: LightingTowerIcon, alt: 'Lighting Towers' },
  'broadcastBooth': { type: 'svg', value: BroadcastBoothIcon, alt: 'Broadcast Booth' },
  'lockerRoom': { type: 'svg', value: LockerRoomIcon, alt: 'Locker Room' },
  'lockerRooms': { type: 'svg', value: LockerRoomIcon, alt: 'Locker Rooms' },
  
  // Facility Types (Car Wash - Using Custom Icons)
  'facilityType': { type: 'svg', value: ExpressTunnelIcon, alt: 'Facility Type' },
  'expressTunnel': { type: 'svg', value: ExpressTunnelIcon, alt: 'Express Tunnel' },
  'express_tunnel': { type: 'svg', value: ExpressTunnelIcon, alt: 'Express Tunnel' },
  'miniTunnel': { type: 'svg', value: MiniTunnelIcon, alt: 'Mini Tunnel' },
  'flexServe': { type: 'svg', value: ExpressTunnelIcon, alt: 'Flex Serve' }, // Use ExpressTunnelIcon for flex serve
  'flex_serve': { type: 'svg', value: ExpressTunnelIcon, alt: 'Flex Serve' },
  'inBayAutomatic': { type: 'svg', value: InBayAutomaticIcon, alt: 'In-Bay Automatic' },
  'in_bay_automatic': { type: 'svg', value: InBayAutomaticIcon, alt: 'In-Bay Automatic' },
  'selfServeBay': { type: 'svg', value: SelfServeBayIcon, alt: 'Self-Serve Bay' },
  
  // Car Wash Specific Fields - Question Field Names
  'tunnelLength': { type: 'svg', value: ExpressTunnelIcon, alt: 'Tunnel Length' },
  'dailyVehicles': { type: 'svg', value: CarIcon, alt: 'Daily Vehicles' },
  // Note: 'vehiclesPerDay' already mapped above in Operations section
  'vacuumStations': { type: 'svg', value: VacuumIcon, alt: 'Vacuum Stations' },
  'vacuumCount': { type: 'svg', value: VacuumIcon, alt: 'Vacuum Count' },
  'blowerType': { type: 'svg', value: BlowerIcon, alt: 'Blower Type' },
  'waterHeaterType': { type: 'svg', value: GasFlameIcon, alt: 'Water Heater Type' },
  'waterReclaim': '♻️',
  'waterReclaimSystem': '♻️',
  'siteSqFt': { type: 'svg', value: AreaIcon, alt: 'Site Square Feet' },
  'siteSquareFootage': { type: 'svg', value: AreaIcon, alt: 'Site Square Footage' },
  'roofSqFt': { type: 'svg', value: RoofIcon, alt: 'Roof Square Feet' },
  'rooftopSquareFootage': { type: 'svg', value: RoofIcon, alt: 'Rooftop Square Footage' },
  'hasNaturalGas': '🔥',
  'naturalGas': '🔥',
  'evL2Count': { type: 'svg', value: Level2ChargerIcon, alt: 'Level 2 EV Chargers' },
  'evDcfcCount': { type: 'svg', value: DCFastChargerIcon, alt: 'DC Fast Chargers' },
  
  // Car Wash Option Values - These match the option.value from database JSON exactly
  // Facility Type Options
  'iba': { type: 'svg', value: InBayAutomaticIcon, alt: 'In-Bay Automatic' },
  'tunnel_express': { type: 'svg', value: ExpressTunnelIcon, alt: 'Express Tunnel' },
  'tunnel_mini': { type: 'svg', value: MiniTunnelIcon, alt: 'Mini Tunnel' },
  'self_serve': { type: 'svg', value: SelfServeBayIcon, alt: 'Self-Serve Bay' },
  'gantry': { type: 'svg', value: GantryTruckWashIcon, alt: 'Gantry / Truck Wash' },
  
  // Blower/Dryer Type Options  
  'standard_4': { type: 'svg', value: BlowerIcon, alt: 'Standard 4 Blowers' },
  'premium_6': { type: 'svg', value: BlowerIcon, alt: 'Premium 6+ Blowers' },
  'heated': { type: 'svg', value: HeatedDryerIcon, alt: 'Heated Dryers' },
  // Note: 'none' for blowerType uses NoDryerIcon (handled by QuestionRenderer based on question field)
  
  // Water Heater Type Options - context-specific (QuestionRenderer will handle based on question.field)
  // Note: 'gas' and 'electric' are mapped generically above, but QuestionRenderer checks question context
  // 'none' for waterHeaterType uses SnowflakeIcon (handled by QuestionRenderer)
  
  // Water Reclaim Options - context-specific
  // Note: 'full', 'partial', 'none' are handled by QuestionRenderer based on question.field='waterReclaim'
  
  // Truck Stop / Travel Center Specific Fields
  'gridCapacityKW': '⚡',
  'gridCapacity': '⚡',
  'existingSolarKW': { type: 'svg', value: SolarPanelIcon, alt: 'Existing Solar' },
  'existingSolar': { type: 'svg', value: SolarPanelIcon, alt: 'Existing Solar' },
  'wantsSolar': { type: 'svg', value: SolarPanelIcon, alt: 'Solar Interest' },
  'backupRequirements': { type: 'svg', value: BatteryIcon, alt: 'Backup Requirements' },
  'backupPowerRequirements': { type: 'svg', value: BatteryIcon, alt: 'Backup Power Requirements' },
  
  // Additional Facility Fields (Common across industries)
  'totalFacilitySquareFootage': { type: 'svg', value: AreaIcon, alt: 'Total Facility Square Footage' },
  'facilitySqFt': { type: 'svg', value: AreaIcon, alt: 'Facility Square Feet' },
  'buildingSqFt': { type: 'svg', value: AreaIcon, alt: 'Building Square Feet' },
  'officeSqFt': { type: 'svg', value: OfficeIcon, alt: 'Office Square Feet' },
  'storeSqFt': { type: 'svg', value: AreaIcon, alt: 'Store Square Feet' },
  'cStoreSqFt': { type: 'svg', value: AreaIcon, alt: 'C-Store Square Feet' },
  'terminalSqFt': { type: 'svg', value: AreaIcon, alt: 'Terminal Square Feet' },
  'terminalSquareFootage': { type: 'svg', value: AreaIcon, alt: 'Terminal Square Footage' },
  'campusSqFt': { type: 'svg', value: AreaIcon, alt: 'Campus Square Feet' },
  
  // Hotel/Amenities (Additional fields)
  'elevatorCount': '🛗',
  'elevators': '🛗',
  'hasPool': '🏊',
  'poolType': '🏊',
  'hasSpa': '💆',
  'spaServices': '💆',
  'hasGym': '💪',
  'gymEquipment': '💪',
  'conferenceRooms': '🏢',
  'meetingSpace': '🏢',
  'meetingRooms': '🏢',
  'hasHotel': '🏨',
  'dormRooms': '🛏️',
  'housingCapacity': '🏠',
  'parkingSpaces': '🅿️',
  'parkingSpaceCount': '🅿️',
  
  // Airport Specific
  'gateCount': '🚪',
  'gates': '🚪',
  'annualPassengers': '✈️',
  'annualPassengersMillions': '✈️',
  'passengerCount': '✈️',
  'hasRestaurants': '🍽️',
  
  // Gas Station
  'dispenserCount': '⛽',
  'dispensers': '⛽',
  'hasConvenienceStore': '🏪',
  'cStore': '🏪',
  'convenienceStore': '🏪',
  'restaurantType': '🍽️',
  
  // Operations
  'hoursPerDay': { type: 'svg', value: ClockIcon, alt: 'Hours Per Day' },
  'operatingDays': { type: 'svg', value: CalendarIcon, alt: 'Operating Days' },
  'daysOpen': { type: 'svg', value: CalendarIcon, alt: 'Days Open' },
  
  // Manufacturing/Equipment
  'hasLargeMotors': '⚙️',
  'motorCount': '⚙️',
  'largeMotors': '⚙️',
  'hasWalkInCooler': '❄️',
  'walkInCooler': '❄️',
  'hasWalkInFreezer': '🧊',
  'walkInFreezer': '🧊',
  'refrigerationLoad': '❄️',
  'refrigeration': '❄️',
  
  // Data Center
  'occupancy': '👥',
  'occupancyRate': '👥',
  
  // Defaults
  'count': '🔢',
  'quantity': '🔢',
  'number': '🔢',
  'amount': { type: 'svg', value: DollarIcon, alt: 'Amount' },
  'size': { type: 'svg', value: RulerIcon, alt: 'Size' },
  'area': { type: 'svg', value: AreaIcon, alt: 'Area' },
};

/**
 * Get icon for a question field
 * Returns either an emoji string or an IconConfig object
 */
export function getQuestionIcon(fieldName: string, questionText?: string): IconConfig | string {
  const lowerField = fieldName.toLowerCase();
  const lowerQuestion = questionText?.toLowerCase() || '';
  
  // Direct field name match (exact) - handle both camelCase and snake_case
  if (QUESTION_ICON_MAP[lowerField]) {
    const icon = QUESTION_ICON_MAP[lowerField];
    // If it's already an IconConfig or string, return as-is
    return icon;
  }
  
  // Also check snake_case version (e.g., 'express_tunnel' -> 'expressTunnel')
  const camelCaseField = lowerField.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
  if (camelCaseField !== lowerField && QUESTION_ICON_MAP[camelCaseField]) {
    return QUESTION_ICON_MAP[camelCaseField];
  }
  
  // Smart fallbacks based on common patterns (check specific patterns FIRST)
  // Check truck wash BEFORE generic wash/bay
  if ((lowerField.includes('truck') && lowerField.includes('wash')) || (lowerQuestion.includes('truck') && lowerQuestion.includes('wash'))) {
    return '🚚'; // Truck wash bays - check this BEFORE generic wash/bay
  }
  // EV Charging - check for specific types first
  if (lowerField.includes('charger') || lowerField.includes('ev') || lowerField.includes('dcfc') || lowerField.includes('mcs') || lowerField.includes('level2') || lowerField.includes('l2') || lowerQuestion.includes('charger')) {
    if (lowerField.includes('mcs') || lowerField.includes('megawatt')) {
      return { type: 'svg', value: EVChargerIcon, alt: 'MCS Charger' };
    }
    if (lowerField.includes('dcfc') || lowerField.includes('dc') || lowerField.includes('fast')) {
      return { type: 'svg', value: DCFastChargerIcon, alt: 'DC Fast Charger' };
    }
    if (lowerField.includes('level2') || lowerField.includes('l2')) {
      return { type: 'svg', value: Level2ChargerIcon, alt: 'Level 2 Charger' };
    }
    return { type: 'image', value: chargerIcon, alt: 'Charger' };
  }
  // Energy Systems
  if (lowerField.includes('solar') || lowerField.includes('rooftop') || lowerQuestion.includes('solar')) {
    return { type: 'svg', value: SolarPanelIcon, alt: 'Solar' };
  }
  if (lowerField.includes('battery') || lowerField.includes('bess') || lowerField.includes('backup')) {
    return { type: 'svg', value: BatteryIcon, alt: 'Battery' };
  }
  if (lowerField.includes('generator') || lowerField.includes('grid')) {
    return '⚡';
  }
  // Facilities & Areas
  if (lowerField.includes('square') || lowerField.includes('sqft') || lowerField.includes('footage') || lowerField.includes('area')) {
    if (lowerField.includes('roof') || lowerField.includes('rooftop')) {
      return { type: 'svg', value: RoofIcon, alt: 'Roof Area' };
    }
    return { type: 'svg', value: AreaIcon, alt: 'Square Feet' };
  }
  if (lowerField.includes('shower') || lowerQuestion.includes('shower')) {
    return '🚿';
  }
  if (lowerField.includes('laundry') || lowerQuestion.includes('laundry')) {
    return '👕';
  }
  if (lowerField.includes('parking') || lowerQuestion.includes('parking')) {
    return '🅿️';
  }
  if (lowerField.includes('restaurant') || lowerQuestion.includes('restaurant')) {
    return '🍽️';
  }
  if (lowerField.includes('climate') || lowerField.includes('weather') || lowerQuestion.includes('climate')) {
    return '🌡️';
  }
  if (lowerField.includes('bill') || lowerField.includes('cost') || lowerField.includes('price') || lowerField.includes('revenue')) {
    return { type: 'svg', value: DollarIcon, alt: 'Cost' };
  }
  if (lowerField.includes('demand') || lowerField.includes('peak')) {
    return '📊';
  }
  if (lowerField.includes('wash') || lowerQuestion.includes('wash')) {
    return '🧼';
  }
  if (lowerField.includes('bay') || lowerField.includes('service')) {
    return '🔧';
  }
  // Hotel/Amenities
  if (lowerField.includes('room') || lowerField.includes('hotel') || lowerField.includes('bed')) {
    return '🛏️';
  }
  if (lowerField.includes('pool') || lowerQuestion.includes('pool')) {
    return '🏊';
  }
  if (lowerField.includes('spa') || lowerQuestion.includes('spa')) {
    return '💆';
  }
  if (lowerField.includes('gym') || lowerField.includes('fitness')) {
    return '💪';
  }
  if (lowerField.includes('elevator') || lowerQuestion.includes('elevator')) {
    return '🛗';
  }
  // Equipment
  if (lowerField.includes('pump') || lowerQuestion.includes('pump')) {
    return '💧';
  }
  if (lowerField.includes('vacuum') || lowerQuestion.includes('vacuum')) {
    return { type: 'svg', value: VacuumIcon, alt: 'Vacuum' };
  }
  if (lowerField.includes('blower') || lowerField.includes('dryer')) {
    if (lowerField.includes('heated') || lowerField.includes('dryer')) {
      return { type: 'svg', value: HeatedDryerIcon, alt: 'Heated Dryer' };
    }
    return { type: 'svg', value: BlowerIcon, alt: 'Blower' };
  }
  if (lowerField.includes('water') && (lowerField.includes('heater') || lowerField.includes('heat'))) {
    return { type: 'svg', value: GasFlameIcon, alt: 'Water Heater' };
  }
  // Operations
  if (lowerField.includes('hour') || lowerField.includes('time') || lowerField.includes('operating')) {
    return { type: 'svg', value: ClockIcon, alt: 'Hours' };
  }
  if (lowerField.includes('day') && (lowerField.includes('week') || lowerField.includes('open'))) {
    return { type: 'svg', value: CalendarIcon, alt: 'Days' };
  }
  // Vehicles & Transportation
  if (lowerField.includes('vehicle') || lowerField.includes('car') || lowerQuestion.includes('vehicle')) {
    if (lowerField.includes('tunnel')) {
      return { type: 'svg', value: ExpressTunnelIcon, alt: 'Tunnel' };
    }
    return { type: 'svg', value: CarIcon, alt: 'Vehicle' };
  }
  if (lowerField.includes('tunnel') && !lowerField.includes('wash')) {
    return { type: 'svg', value: ExpressTunnelIcon, alt: 'Tunnel' };
  }
  // Fuel & Energy
  if (lowerField.includes('gas') || lowerField.includes('fuel') || lowerField.includes('natural')) {
    return '🔥';
  }
  if (lowerField.includes('dispenser') || lowerQuestion.includes('dispenser')) {
    return '⛽';
  }
  // Airport
  if (lowerField.includes('gate') || lowerQuestion.includes('gate')) {
    return '🚪';
  }
  if (lowerField.includes('passenger') || lowerField.includes('airport')) {
    return '✈️';
  }
  // Refrigeration
  if (lowerField.includes('cooler') || lowerField.includes('freezer') || lowerField.includes('refrigeration')) {
    if (lowerField.includes('freezer')) {
      return '🧊';
    }
    return '❄️';
  }
  // Manufacturing
  if (lowerField.includes('motor') || lowerField.includes('equipment')) {
    return '⚙️';
  }
  // Sports/Stadium
  if (lowerField.includes('stadium') || lowerField.includes('arena') || lowerField.includes('field')) {
    return { type: 'svg', value: StadiumIcon, alt: 'Stadium' };
  }
  
  // Check if field name contains any key (partial match)
  // Sort by key length (longer keys first) to match more specific terms first
  const sortedKeys = Object.keys(QUESTION_ICON_MAP).sort((a, b) => b.length - a.length);
  for (const key of sortedKeys) {
    if (lowerField.includes(key) || lowerQuestion.includes(key)) {
      return QUESTION_ICON_MAP[key];
    }
  }
  
  // Default fallback
  return '❓';
}

/**
 * Check if icon is an image (IconConfig) or emoji (string)
 */
export function isImageIcon(icon: IconConfig | string): icon is IconConfig {
  return typeof icon === 'object' && icon !== null && 'type' in icon && icon.type === 'image';
}

/**
 * Check if icon is an SVG component (IconConfig with type 'svg')
 */
export function isSvgIcon(icon: IconConfig | string): icon is IconConfig & { value: React.ComponentType<{ className?: string }> } {
  return typeof icon === 'object' && icon !== null && 'type' in icon && icon.type === 'svg' && typeof (icon as IconConfig).value === 'function';
}
