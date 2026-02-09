/**
 * Vendor Equipment Registry — Merlin Energy Solutions
 * 
 * Central database of equipment vendors, products, and image references.
 * Used by the quote builder and Word export to show actual equipment
 * customers will receive in their projects.
 * 
 * Vendor images should be stored in:
 *   src/assets/equipment/photos/{category}/{vendor}_{product}_{nn}.jpg
 * 
 * When a vendor is selected in the quote, this registry provides:
 *   - Product specs (power, connectors, certifications)
 *   - Image paths for the gallery page in Word export
 *   - Marketing descriptions for customer-facing documents
 * 
 * LICENSING NOTE:
 *   Before using vendor product images, obtain written permission from the OEM.
 *   Most manufacturers are happy to have their products featured in partner proposals.
 *   Store vendor approval status in the `imageApproved` field.
 */

// ─────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────

export type EquipmentCategory =
  | 'ev-charger'
  | 'battery'
  | 'solar'
  | 'inverter'
  | 'transformer'
  | 'generator'
  | 'bms'
  | 'switchgear'
  | 'enclosure'
  | 'monitoring'
  | 'wind'
  | 'microgrid';

export type EVChargerLevel = 'level-2' | 'dcfc' | 'hpc';

export type ChargerConnector =
  | 'J1772'
  | 'CCS1'
  | 'CCS2'
  | 'CHAdeMO'
  | 'NACS'     // Tesla / North American Charging Standard
  | 'Type2';

export interface VendorInfo {
  id: string;                     // Unique vendor slug
  name: string;                   // Display name
  logo?: string;                  // Path to vendor logo (if available)
  website: string;                // Vendor website
  country: string;                // HQ country
  description: string;            // One-line vendor description
  partnership?: 'authorized' | 'preferred' | 'distributor' | 'none';
}

export interface VendorProduct {
  id: string;                     // Unique product slug
  vendorId: string;               // Reference to VendorInfo.id
  category: EquipmentCategory;    // Equipment category
  name: string;                   // Product name
  model?: string;                 // Model number
  description: string;            // Customer-facing product description
  specs: Record<string, string | number>; // Key specifications
  images: VendorProductImage[];   // Product images
  features?: string[];            // Key selling points
  certifications?: string[];      // UL, ETL, Energy Star, etc.
  warranty?: string;              // Warranty details
  datasheet?: string;             // URL or path to datasheet
}

export interface VendorProductImage {
  filename: string;               // File name (in photos/{category}/ directory)
  alt: string;                    // Alt text for accessibility
  caption?: string;               // Caption for Word export gallery
  isPrimary: boolean;             // Primary image (used in thumbnail/gallery lead)
  approved: boolean;              // Has vendor approved use of this image?
  source: 'vendor-press-kit' | 'vendor-website' | 'own-photo' | 'stock' | 'render';
}

// ─────────────────────────────────────────────────────────
// EV Charger-Specific Types
// ─────────────────────────────────────────────────────────

export interface EVChargerProduct extends VendorProduct {
  category: 'ev-charger';
  chargerLevel: EVChargerLevel;
  powerKW: number;                // Max power output in kW
  connectors: ChargerConnector[]; // Connector types
  simultaneousCharging?: number;  // How many vehicles at once
  networkEnabled: boolean;        // Cloud/network managed
  ocppVersion?: string;           // OCPP 1.6 / 2.0.1
  mountType: 'pedestal' | 'wall-mount' | 'bollard' | 'pole-mount' | 'ceiling';
}

// ─────────────────────────────────────────────────────────
// Vendor Registry
// ─────────────────────────────────────────────────────────

export const VENDORS: Record<string, VendorInfo> = {
  // ── EV Charger Vendors ───────────────────────────────
  'chargepoint': {
    id: 'chargepoint',
    name: 'ChargePoint',
    website: 'https://www.chargepoint.com',
    country: 'USA',
    description: 'North America\'s largest EV charging network with 200,000+ charging ports',
    partnership: 'authorized',
  },
  'tesla': {
    id: 'tesla',
    name: 'Tesla',
    website: 'https://www.tesla.com',
    country: 'USA',
    description: 'World\'s largest fast-charging network with Supercharger and Wall Connector products',
    partnership: 'distributor',
  },
  'abb': {
    id: 'abb',
    name: 'ABB E-mobility',
    website: 'https://e-mobility.abb.com',
    country: 'Switzerland',
    description: 'Global leader in DC fast charging with Terra series chargers',
    partnership: 'authorized',
  },
  'tritium': {
    id: 'tritium',
    name: 'Tritium',
    website: 'https://www.tritiumcharging.com',
    country: 'Australia',
    description: 'Premium DC fast chargers designed for reliability and minimal footprint',
    partnership: 'authorized',
  },
  'blink': {
    id: 'blink',
    name: 'Blink Charging',
    website: 'https://blinkcharging.com',
    country: 'USA',
    description: 'Owner and operator of EV charging stations across North America',
    partnership: 'none',
  },
  'siemens': {
    id: 'siemens',
    name: 'Siemens eMobility',
    website: 'https://www.siemens.com/emobility',
    country: 'Germany',
    description: 'Comprehensive EV charging solutions from Level 2 to high-power charging',
    partnership: 'authorized',
  },
  'legrand': {
    id: 'legrand',
    name: 'Legrand',
    website: 'https://www.legrand.us',
    country: 'France',
    description: 'Commercial and residential EV charging with Pass & Seymour and AmpUp platform integration',
    partnership: 'distributor',
  },
  'enel-x': {
    id: 'enel-x',
    name: 'Enel X Way',
    website: 'https://www.enelxway.com',
    country: 'Italy',
    description: 'Smart charging solutions with energy management and demand response capabilities',
    partnership: 'none',
  },
  'kempower': {
    id: 'kempower',
    name: 'Kempower',
    website: 'https://kempower.com',
    country: 'Finland',
    description: 'Modular DC fast charging with dynamic power management for fleets and public charging',
    partnership: 'none',
  },

  // ── BESS / Battery Vendors ───────────────────────────
  'great-power': {
    id: 'great-power',
    name: 'Great Power',
    website: 'https://www.greatpower.net',
    country: 'China',
    description: 'Tier-1 LFP battery cell and ESS container manufacturer for utility and C&I storage',
    partnership: 'preferred',
  },
  'catl': {
    id: 'catl',
    name: 'CATL',
    website: 'https://www.catl.com',
    country: 'China',
    description: 'World\'s largest battery manufacturer with EnerOne and EnerC ESS product lines',
    partnership: 'authorized',
  },
  'byd': {
    id: 'byd',
    name: 'BYD',
    website: 'https://www.byd.com',
    country: 'China',
    description: 'Vertically integrated battery manufacturer with BYD Cube and MC Cube ESS solutions',
    partnership: 'authorized',
  },
  'tesla-energy': {
    id: 'tesla-energy',
    name: 'Tesla Energy',
    website: 'https://www.tesla.com/megapack',
    country: 'USA',
    description: 'Megapack and Powerwall battery energy storage for utility and commercial applications',
    partnership: 'distributor',
  },
  'fluence': {
    id: 'fluence',
    name: 'Fluence',
    website: 'https://fluenceenergy.com',
    country: 'USA',
    description: 'Siemens/AES joint venture offering Gridstack and Edgestack BESS platforms',
    partnership: 'authorized',
  },
  'samsung-sdi': {
    id: 'samsung-sdi',
    name: 'Samsung SDI',
    website: 'https://www.samsungsdi.com',
    country: 'South Korea',
    description: 'Premium NMC and LFP battery cells and modules for energy storage systems',
    partnership: 'authorized',
  },
  'lion-energy': {
    id: 'lion-energy',
    name: 'LiON Energy',
    website: 'https://lionenergy.com',
    country: 'USA',
    description: 'Commercial and residential LFP battery storage solutions',
    partnership: 'preferred',
  },
  'discovery-energy': {
    id: 'discovery-energy',
    name: 'Discovery Energy',
    website: 'https://discoveryenergy.com',
    country: 'USA',
    description: 'C&I battery energy storage with integrated EMS and monitoring',
    partnership: 'preferred',
  },

  // ── Solar / Inverter Vendors ─────────────────────────
  'sungrow': {
    id: 'sungrow',
    name: 'Sungrow',
    website: 'https://en.sungrowpower.com',
    country: 'China',
    description: 'Global leading inverter and ESS supplier with comprehensive C&I and utility solutions',
    partnership: 'authorized',
  },
  'sma': {
    id: 'sma',
    name: 'SMA Solar Technology',
    website: 'https://www.sma.de',
    country: 'Germany',
    description: 'Premium solar inverters and energy management for commercial and utility applications',
    partnership: 'authorized',
  },

  // ── Generator Vendors ────────────────────────────────
  'cummins': {
    id: 'cummins',
    name: 'Cummins',
    website: 'https://www.cummins.com',
    country: 'USA',
    description: 'Global leader in diesel and natural gas generator sets for backup and prime power',
    partnership: 'authorized',
  },
  'mainspring': {
    id: 'mainspring',
    name: 'Mainspring Energy',
    website: 'https://mainspringenergy.com',
    country: 'USA',
    description: 'Linear generator technology for clean, flexible on-site power generation',
    partnership: 'preferred',
  },
};

// ─────────────────────────────────────────────────────────
// EV Charger Products
// ─────────────────────────────────────────────────────────

export const EV_CHARGER_PRODUCTS: EVChargerProduct[] = [
  // ── ChargePoint ──────────────────────────────────────
  {
    id: 'chargepoint-cpf50',
    vendorId: 'chargepoint',
    category: 'ev-charger',
    name: 'ChargePoint CPF50',
    model: 'CPF50',
    description: 'Commercial Level 2 charging station with dual ports, RFID access, and ChargePoint cloud management. Ideal for workplace, retail, and hospitality charging.',
    chargerLevel: 'level-2',
    powerKW: 11.5,
    connectors: ['J1772'],
    simultaneousCharging: 2,
    networkEnabled: true,
    ocppVersion: '1.6',
    mountType: 'pedestal',
    specs: {
      'Max Power': '11.5 kW per port',
      'Voltage': '208/240V AC',
      'Connector': 'SAE J1772 (dual)',
      'Cable Length': '23 ft (7 m)',
      'Operating Temp': '-30°C to 50°C',
      'Network': 'ChargePoint Cloud',
      'Payment': 'RFID, App, Contactless',
    },
    features: [
      'Dual-port simultaneous charging',
      'ChargePoint cloud management',
      'RFID & app-based authentication',
      'Power sharing between ports',
      'ENERGY STAR certified',
    ],
    certifications: ['UL Listed', 'ENERGY STAR', 'FCC', 'Buy America Compliant'],
    warranty: '3-year parts, 1-year Assure',
    images: [{
      filename: 'chargepoint_cpf50_01.jpg',
      alt: 'ChargePoint CPF50 Level 2 dual-port charging station',
      caption: 'ChargePoint CPF50 — Commercial Level 2 (11.5 kW × 2 ports)',
      isPrimary: true,
      approved: false,
      source: 'vendor-press-kit',
    }],
  },
  {
    id: 'chargepoint-cp6000',
    vendorId: 'chargepoint',
    category: 'ev-charger',
    name: 'ChargePoint CP6000',
    model: 'CP6000',
    description: 'Next-generation commercial Level 2 station with power management, load balancing, and sleek design for workplace and retail environments.',
    chargerLevel: 'level-2',
    powerKW: 19.2,
    connectors: ['J1772'],
    simultaneousCharging: 2,
    networkEnabled: true,
    ocppVersion: '2.0.1',
    mountType: 'pedestal',
    specs: {
      'Max Power': '19.2 kW per port',
      'Voltage': '208/240V AC, 80A',
      'Connector': 'SAE J1772 (dual)',
      'Cable Length': '25 ft (7.6 m)',
      'Operating Temp': '-30°C to 50°C',
      'Network': 'ChargePoint Cloud',
    },
    features: [
      'Up to 19.2 kW per port',
      'OCPP 2.0.1 compliant',
      'Smart power management',
      'Contactless payment ready',
      'ADA accessible design',
    ],
    certifications: ['UL Listed', 'ENERGY STAR', 'FCC', 'Buy America Compliant'],
    warranty: '3-year parts',
    images: [{
      filename: 'chargepoint_cp6000_01.jpg',
      alt: 'ChargePoint CP6000 Level 2 commercial charging station',
      caption: 'ChargePoint CP6000 — Next-Gen Level 2 (19.2 kW × 2 ports)',
      isPrimary: true,
      approved: false,
      source: 'vendor-press-kit',
    }],
  },
  {
    id: 'chargepoint-express-plus',
    vendorId: 'chargepoint',
    category: 'ev-charger',
    name: 'ChargePoint Express Plus',
    model: 'CPE250',
    description: 'Modular DC fast charging platform delivering up to 500 kW with dynamic power management. Powers entire charging plazas from a single power block.',
    chargerLevel: 'dcfc',
    powerKW: 250,
    connectors: ['CCS1', 'CHAdeMO'],
    simultaneousCharging: 2,
    networkEnabled: true,
    ocppVersion: '1.6',
    mountType: 'pedestal',
    specs: {
      'Max Power': '250 kW per dispenser',
      'Power Block': 'Up to 500 kW shared',
      'Voltage': '200–1000V DC',
      'Connectors': 'CCS1 + CHAdeMO',
      'Cable Length': '15 ft (4.6 m)',
      'Efficiency': '> 95%',
    },
    features: [
      'Modular power block architecture',
      'Up to 500 kW per power block',
      'Dynamic power sharing across dispensers',
      'Future-proof scalable design',
      'Integrated cable management',
    ],
    certifications: ['UL Listed', 'FCC', 'NRTL'],
    warranty: '2-year parts, Assure plans available',
    images: [{
      filename: 'chargepoint_express_plus_01.jpg',
      alt: 'ChargePoint Express Plus DC fast charging station',
      caption: 'ChargePoint Express Plus — DCFC (up to 250 kW)',
      isPrimary: true,
      approved: false,
      source: 'vendor-press-kit',
    }],
  },

  // ── Tesla ────────────────────────────────────────────
  {
    id: 'tesla-wall-connector',
    vendorId: 'tesla',
    category: 'ev-charger',
    name: 'Tesla Wall Connector',
    model: 'Gen 3',
    description: 'Sleek Level 2 home and commercial charger with WiFi connectivity. Works with all EVs via J1772 adapter or NACS-native Tesla vehicles.',
    chargerLevel: 'level-2',
    powerKW: 19.2,
    connectors: ['NACS'],
    simultaneousCharging: 1,
    networkEnabled: true,
    mountType: 'wall-mount',
    specs: {
      'Max Power': '19.2 kW (80A @ 240V)',
      'Voltage': '208/240V AC',
      'Connector': 'NACS (Tesla)',
      'Cable Length': '24 ft (7.3 m)',
      'WiFi': 'Built-in',
      'Power Sharing': 'Up to 6 units',
    },
    features: [
      '19.2 kW max charging speed',
      'WiFi-enabled with OTA updates',
      'Power sharing (up to 6 units)',
      'Indoor/outdoor rated (IP55)',
      'Works with Tesla app',
    ],
    certifications: ['UL Listed', 'FCC', 'ENERGY STAR'],
    warranty: '4-year warranty',
    images: [{
      filename: 'tesla_wall_connector_01.jpg',
      alt: 'Tesla Wall Connector Gen 3 Level 2 charger',
      caption: 'Tesla Wall Connector — Level 2 (19.2 kW, NACS)',
      isPrimary: true,
      approved: false,
      source: 'vendor-website',
    }],
  },
  {
    id: 'tesla-supercharger-v4',
    vendorId: 'tesla',
    category: 'ev-charger',
    name: 'Tesla Supercharger V4',
    model: 'V4',
    description: 'Latest-generation Tesla Supercharger with Magic Dock (CCS1 + NACS compatibility), delivering up to 250 kW. Open to all EVs with CCS adapter.',
    chargerLevel: 'dcfc',
    powerKW: 250,
    connectors: ['NACS', 'CCS1'],
    simultaneousCharging: 1,
    networkEnabled: true,
    mountType: 'pedestal',
    specs: {
      'Max Power': '250 kW',
      'Voltage': 'Up to 1000V DC',
      'Connectors': 'NACS + Magic Dock (CCS1)',
      'Cable Length': '10 ft (3 m)',
      'Charging Time': '15 min (200 miles)',
      'Network': 'Tesla Supercharger Network',
    },
    features: [
      '250 kW ultra-fast charging',
      'Magic Dock — CCS1 + NACS universal',
      'Open to all EV brands',
      'Integrated payment terminal',
      'Slim, low-profile pedestal design',
    ],
    certifications: ['UL Listed', 'FCC'],
    warranty: 'Tesla commercial warranty',
    images: [{
      filename: 'tesla_supercharger_v4_01.jpg',
      alt: 'Tesla Supercharger V4 DC fast charger with Magic Dock',
      caption: 'Tesla Supercharger V4 — DCFC (250 kW, NACS + CCS1)',
      isPrimary: true,
      approved: false,
      source: 'vendor-website',
    }],
  },
  {
    id: 'tesla-universal-wall-connector',
    vendorId: 'tesla',
    category: 'ev-charger',
    name: 'Tesla Universal Wall Connector',
    model: 'Universal',
    description: 'Level 2 wall charger with both NACS and J1772 connectors, compatible with all EVs. Ideal for commercial properties serving mixed EV fleets.',
    chargerLevel: 'level-2',
    powerKW: 19.2,
    connectors: ['NACS', 'J1772'],
    simultaneousCharging: 1,
    networkEnabled: true,
    mountType: 'wall-mount',
    specs: {
      'Max Power': '19.2 kW (80A @ 240V)',
      'Voltage': '208/240V AC',
      'Connectors': 'NACS + J1772 integrated',
      'Cable Length': '24 ft (7.3 m)',
      'WiFi': 'Built-in',
      'Compatibility': 'All EVs',
    },
    features: [
      'Universal — works with ALL EV brands',
      'Dual connectors: NACS + J1772',
      'WiFi-enabled fleet management',
      'Power sharing (up to 6 units)',
      'Sleek glass-face design',
    ],
    certifications: ['UL Listed', 'FCC', 'ENERGY STAR'],
    warranty: '4-year warranty',
    images: [{
      filename: 'tesla_universal_wall_01.jpg',
      alt: 'Tesla Universal Wall Connector with NACS and J1772',
      caption: 'Tesla Universal Wall Connector — Level 2 (19.2 kW, All EVs)',
      isPrimary: true,
      approved: false,
      source: 'vendor-website',
    }],
  },

  // ── ABB ──────────────────────────────────────────────
  {
    id: 'abb-terra-ac',
    vendorId: 'abb',
    category: 'ev-charger',
    name: 'ABB Terra AC',
    model: 'Terra AC W22-T-RD-MC-0',
    description: 'Commercial Level 2 AC wallbox with RFID authentication and OCPP connectivity. Robust design for workplace and fleet charging applications.',
    chargerLevel: 'level-2',
    powerKW: 22,
    connectors: ['Type2', 'J1772'],
    simultaneousCharging: 1,
    networkEnabled: true,
    ocppVersion: '1.6',
    mountType: 'wall-mount',
    specs: {
      'Max Power': '22 kW',
      'Voltage': '400V 3-phase / 230V 1-phase',
      'Connector': 'Type 2 / J1772',
      'Operating Temp': '-35°C to 55°C',
      'Protection': 'IP54',
      'Network': 'OCPP 1.6J',
    },
    features: [
      '22 kW 3-phase charging',
      'RFID authentication',
      'OCPP 1.6J compliant',
      'MID-certified energy metering',
      'Dynamic load balancing ready',
    ],
    certifications: ['UL Listed', 'CE', 'IEC 61851'],
    warranty: '3-year warranty',
    images: [{
      filename: 'abb_terra_ac_01.jpg',
      alt: 'ABB Terra AC Level 2 commercial wallbox charger',
      caption: 'ABB Terra AC — Level 2 (22 kW)',
      isPrimary: true,
      approved: false,
      source: 'vendor-press-kit',
    }],
  },
  {
    id: 'abb-terra-360',
    vendorId: 'abb',
    category: 'ev-charger',
    name: 'ABB Terra 360',
    model: 'Terra 360',
    description: 'The world\'s fastest all-in-one EV charger — up to 360 kW with dynamic power distribution across up to 4 vehicles simultaneously.',
    chargerLevel: 'hpc',
    powerKW: 360,
    connectors: ['CCS1', 'CCS2', 'CHAdeMO'],
    simultaneousCharging: 4,
    networkEnabled: true,
    ocppVersion: '1.6',
    mountType: 'pedestal',
    specs: {
      'Max Power': '360 kW total, 180 kW per connector',
      'Voltage': '150–1000V DC',
      'Connectors': 'CCS1, CCS2, CHAdeMO (up to 4)',
      'Charging Time': '15 min for 100 miles',
      'Efficiency': '> 95%',
      'Display': '24" user-facing touchscreen',
    },
    features: [
      '360 kW — fastest all-in-one charger',
      'Charge 4 vehicles simultaneously',
      'Dynamic power distribution',
      '24" integrated touchscreen',
      'Pre-conditioned liquid-cooled cables',
    ],
    certifications: ['UL Listed', 'FCC', 'NRTL'],
    warranty: '2-year standard, extended available',
    images: [{
      filename: 'abb_terra_360_01.jpg',
      alt: 'ABB Terra 360 high-power charger with 4 connectors',
      caption: 'ABB Terra 360 — HPC (360 kW, 4 vehicles)',
      isPrimary: true,
      approved: false,
      source: 'vendor-press-kit',
    }],
  },

  // ── Tritium ──────────────────────────────────────────
  {
    id: 'tritium-rtm75',
    vendorId: 'tritium',
    category: 'ev-charger',
    name: 'Tritium RTM75',
    model: 'RTM75',
    description: 'Ultra-compact 75 kW DC fast charger with the smallest footprint in its class. Ideal for space-constrained locations and urban installations.',
    chargerLevel: 'dcfc',
    powerKW: 75,
    connectors: ['CCS1', 'CCS2'],
    simultaneousCharging: 1,
    networkEnabled: true,
    ocppVersion: '1.6',
    mountType: 'pedestal',
    specs: {
      'Max Power': '75 kW',
      'Voltage': '200–920V DC',
      'Connector': 'CCS1 or CCS2',
      'Footprint': '2.1 sq ft (smallest in class)',
      'Weight': '187 lbs (85 kg)',
      'Operating Temp': '-35°C to 50°C',
    },
    features: [
      'Smallest DCFC footprint in class',
      '75 kW reliable fast charging',
      'IP65 weatherproof rating',
      'Liquid-cooled cable',
      'Over-the-air updates',
    ],
    certifications: ['UL Listed', 'FCC', 'Buy America Compliant'],
    warranty: '2-year standard',
    images: [{
      filename: 'tritium_rtm75_01.jpg',
      alt: 'Tritium RTM75 ultra-compact DC fast charger',
      caption: 'Tritium RTM75 — DCFC (75 kW, ultra-compact)',
      isPrimary: true,
      approved: false,
      source: 'vendor-press-kit',
    }],
  },
  {
    id: 'tritium-pk350',
    vendorId: 'tritium',
    category: 'ev-charger',
    name: 'Tritium PKM150 / PK350',
    model: 'PK350',
    description: 'Scalable high-power DC fast charger delivering up to 350 kW. Modular architecture allows field-upgradeable power levels from 75 kW to 350 kW.',
    chargerLevel: 'hpc',
    powerKW: 350,
    connectors: ['CCS1', 'CCS2', 'CHAdeMO'],
    simultaneousCharging: 2,
    networkEnabled: true,
    ocppVersion: '2.0.1',
    mountType: 'pedestal',
    specs: {
      'Max Power': '350 kW',
      'Voltage': '150–1000V DC',
      'Connectors': 'CCS1 + CHAdeMO',
      'Architecture': 'Modular (scalable 75–350 kW)',
      'Efficiency': '> 95%',
      'Operating Temp': '-35°C to 50°C',
    },
    features: [
      '350 kW high-power charging',
      'Modular — start at 75 kW, upgrade to 350 kW',
      'Liquid-cooled cables',
      'OCPP 2.0.1 compliant',
      'IP55 rated for all weather',
    ],
    certifications: ['UL Listed', 'FCC', 'Buy America Compliant'],
    warranty: '5-year Assurance plan available',
    images: [{
      filename: 'tritium_pk350_01.jpg',
      alt: 'Tritium PK350 high-power DC fast charger',
      caption: 'Tritium PK350 — HPC (350 kW, modular)',
      isPrimary: true,
      approved: false,
      source: 'vendor-press-kit',
    }],
  },

  // ── Legrand ──────────────────────────────────────────
  {
    id: 'legrand-evp2pm',
    vendorId: 'legrand',
    category: 'ev-charger',
    name: 'Legrand Level 2 Pedestal',
    model: 'EVP2PM',
    description: 'Commercial pedestal-mount Level 2 charger with AmpUp network integration. Clean design with dual connectors for parking lots and multi-family properties.',
    chargerLevel: 'level-2',
    powerKW: 11.5,
    connectors: ['J1772'],
    simultaneousCharging: 2,
    networkEnabled: true,
    ocppVersion: '1.6',
    mountType: 'pedestal',
    specs: {
      'Max Power': '11.5 kW per port',
      'Voltage': '208/240V AC',
      'Connector': 'SAE J1772 (dual)',
      'Network': 'AmpUp platform',
      'Payment': 'App-based, RFID',
      'Operating Temp': '-30°C to 50°C',
    },
    features: [
      'Dual-port J1772 connectors',
      'AmpUp cloud management',
      'App-based access and payment',
      'Robust pedestal design',
      'NEMA 3R outdoor rated',
    ],
    certifications: ['UL Listed', 'FCC'],
    warranty: '3-year warranty',
    images: [{
      filename: 'legrand_pedestal_01.jpg',
      alt: 'Legrand Level 2 pedestal-mount commercial EV charger',
      caption: 'Legrand Level 2 — Commercial Pedestal (11.5 kW × 2)',
      isPrimary: true,
      approved: false,
      source: 'vendor-website',
    }],
  },

  // ── Siemens ──────────────────────────────────────────
  {
    id: 'siemens-versicharge',
    vendorId: 'siemens',
    category: 'ev-charger',
    name: 'Siemens VersiCharge',
    model: 'VC30GRYU',
    description: 'Commercial Level 2 charger with RFID access, OCPP network management, and Siemens reliability. Ideal for fleets, workplaces, and multi-tenant properties.',
    chargerLevel: 'level-2',
    powerKW: 11.5,
    connectors: ['J1772'],
    simultaneousCharging: 1,
    networkEnabled: true,
    ocppVersion: '1.6',
    mountType: 'wall-mount',
    specs: {
      'Max Power': '11.5 kW (48A)',
      'Voltage': '208/240V AC',
      'Connector': 'SAE J1772',
      'Cable Length': '25 ft (7.6 m)',
      'Protection': 'NEMA 4X',
      'Network': 'OCPP 1.6J',
    },
    features: [
      'Siemens industrial reliability',
      'RFID authentication',
      'OCPP 1.6J network management',
      'NEMA 4X rated (all weather)',
      'DLM (Dynamic Load Management) capable',
    ],
    certifications: ['UL Listed', 'ENERGY STAR', 'FCC'],
    warranty: '3-year warranty',
    images: [{
      filename: 'siemens_versicharge_01.jpg',
      alt: 'Siemens VersiCharge commercial Level 2 EV charger',
      caption: 'Siemens VersiCharge — Level 2 (11.5 kW)',
      isPrimary: true,
      approved: false,
      source: 'vendor-press-kit',
    }],
  },

  // ── Kempower ─────────────────────────────────────────
  {
    id: 'kempower-s-series',
    vendorId: 'kempower',
    category: 'ev-charger',
    name: 'Kempower S-Series',
    model: 'S-Series',
    description: 'Modular DC fast charging system with dynamic power management. One power unit can serve multiple satellites, optimizing infrastructure costs for fleet and public charging.',
    chargerLevel: 'dcfc',
    powerKW: 200,
    connectors: ['CCS1', 'CCS2'],
    simultaneousCharging: 8,
    networkEnabled: true,
    ocppVersion: '2.0.1',
    mountType: 'pedestal',
    specs: {
      'Max Power': '200 kW per satellite (600 kW power unit)',
      'Voltage': '50–1000V DC',
      'Connectors': 'CCS1/CCS2 satellite dispensers',
      'Satellites': 'Up to 8 per power unit',
      'Efficiency': '> 95%',
      'Dynamic Power': 'Automatic power sharing',
    },
    features: [
      'Modular satellite architecture',
      'Up to 8 charging points per power unit',
      'Dynamic power management (ChargEye)',
      'Fleet-optimized scheduling',
      'OCPP 2.0.1 with ISO 15118',
    ],
    certifications: ['UL Listed', 'FCC'],
    warranty: '5-year warranty available',
    images: [{
      filename: 'kempower_s_series_01.jpg',
      alt: 'Kempower S-Series modular DC fast charging system',
      caption: 'Kempower S-Series — DCFC (200 kW, modular satellite)',
      isPrimary: true,
      approved: false,
      source: 'vendor-press-kit',
    }],
  },
];

// ─────────────────────────────────────────────────────────
// Generic (non-EV) Equipment Products
// ─────────────────────────────────────────────────────────

export const EQUIPMENT_PRODUCTS: VendorProduct[] = [
  // ── BESS Products ────────────────────────────────────
  {
    id: 'great-power-ess-container',
    vendorId: 'great-power',
    category: 'battery',
    name: 'Great Power ESS Container',
    description: 'Integrated 20ft containerized BESS with LFP cells, BMS, fire suppression, and HVAC thermal management. Pre-assembled and factory-tested.',
    specs: {
      'Chemistry': 'LFP (Lithium Iron Phosphate)',
      'Capacity': '2–5 MWh per container',
      'Voltage': '1000–1500V DC',
      'Cycle Life': '6,000+ cycles to 80% SoH',
      'Container': '20ft ISO standard',
      'Thermal': 'Liquid cooling / HVAC',
      'Fire Suppression': 'Aerosol + gas detection',
    },
    features: [
      'Factory-assembled and tested',
      'Integrated BMS and fire suppression',
      'Liquid-cooled thermal management',
      '6,000+ cycle life (LFP)',
      'UL 9540A tested',
    ],
    certifications: ['UL 9540', 'UL 9540A', 'UL 1973', 'IEC 62619'],
    warranty: '15-year performance warranty',
    images: [{
      filename: 'great_power_container_01.jpg',
      alt: 'Great Power containerized BESS with LFP batteries',
      caption: 'Great Power ESS Container — 2–5 MWh LFP',
      isPrimary: true,
      approved: false,
      source: 'vendor-website',
    }],
  },
  {
    id: 'catl-enerc',
    vendorId: 'catl',
    category: 'battery',
    name: 'CATL EnerC',
    description: 'Compact commercial and industrial BESS with CATL\'s Cell-to-Pack technology. High energy density in a space-efficient form factor.',
    specs: {
      'Chemistry': 'LFP',
      'Capacity': '215–430 kWh per unit',
      'Energy Density': '160+ Wh/kg (cell level)',
      'Cycle Life': '10,000+ cycles',
      'Form Factor': 'Outdoor cabinet',
    },
    features: [
      'CATL Cell-to-Pack technology',
      '10,000+ cycle life',
      'Compact outdoor cabinet',
      'Integrated liquid cooling',
      'Modular scalable design',
    ],
    certifications: ['UL 9540', 'UL 9540A', 'IEC 62619'],
    warranty: '15-year warranty',
    images: [{
      filename: 'catl_enerc_01.jpg',
      alt: 'CATL EnerC commercial battery energy storage cabinet',
      caption: 'CATL EnerC — C&I BESS (215–430 kWh)',
      isPrimary: true,
      approved: false,
      source: 'vendor-press-kit',
    }],
  },
  {
    id: 'tesla-megapack',
    vendorId: 'tesla-energy',
    category: 'battery',
    name: 'Tesla Megapack',
    model: 'Megapack 2 XL',
    description: 'Utility-scale BESS with 4 MWh capacity per unit. Fully integrated with inverter, thermal management, and AC-connected design for simplified installation.',
    specs: {
      'Chemistry': 'LFP',
      'Capacity': '3.9 MWh per unit',
      'Power': '1.9 MW per unit',
      'Round-trip Efficiency': '93.5%',
      'Footprint': '30 × 5.3 × 8.8 ft',
      'Connection': 'AC-connected (integrated inverter)',
    },
    features: [
      'Fully integrated inverter + BESS',
      'AC-connected for simple installation',
      'Tesla Autobidder AI optimization',
      '20-year design life',
      'Factory pre-commissioned',
    ],
    certifications: ['UL 9540', 'UL 9540A', 'IEEE 1547'],
    warranty: '20-year warranty available',
    images: [{
      filename: 'tesla_megapack_01.jpg',
      alt: 'Tesla Megapack utility-scale battery energy storage',
      caption: 'Tesla Megapack 2 XL — 3.9 MWh / 1.9 MW',
      isPrimary: true,
      approved: false,
      source: 'vendor-website',
    }],
  },

  // ── Inverter / PCS Products ──────────────────────────
  {
    id: 'sungrow-sc5000ud',
    vendorId: 'sungrow',
    category: 'inverter',
    name: 'Sungrow SC5000UD',
    model: 'SC5000UD-MV',
    description: 'Utility-scale storage inverter with 5 MW capacity and 1500V DC input. High efficiency with advanced grid-forming capabilities.',
    specs: {
      'Max Power': '5 MW',
      'DC Voltage': '1500V',
      'Efficiency': '> 98.8%',
      'Grid Support': 'Grid-forming capable',
      'Cooling': 'Liquid-cooled',
    },
    features: [
      '5 MW single-unit capacity',
      '1500V DC for lower BoS costs',
      'Grid-forming capability',
      '> 98.8% efficiency',
      'Integrated MV transformer option',
    ],
    certifications: ['UL 1741', 'IEEE 1547', 'IEC 62109'],
    warranty: '10-year standard, 25-year extended',
    images: [{
      filename: 'sungrow_sc5000_01.jpg',
      alt: 'Sungrow SC5000UD utility-scale battery inverter',
      caption: 'Sungrow SC5000UD — 5 MW PCS / Inverter',
      isPrimary: true,
      approved: false,
      source: 'vendor-press-kit',
    }],
  },

  // ── Generator Products ───────────────────────────────
  {
    id: 'cummins-c200d6r',
    vendorId: 'cummins',
    category: 'generator',
    name: 'Cummins 200 kW Generator',
    model: 'C200D6R',
    description: 'Reliable 200 kW diesel generator set for standby power applications. Integrated digital controls with remote monitoring capability.',
    specs: {
      'Standby Rating': '200 kW / 250 kVA',
      'Fuel': 'Diesel',
      'Engine': 'Cummins QSB7',
      'Voltage': '208–480V, 3-phase',
      'Fuel Tank': '24-hour runtime',
      'Enclosure': 'Weather-protective level 2',
    },
    features: [
      'Cummins QSB7 proven engine',
      'Digital master control (PowerCommand)',
      'Remote monitoring via InPower',
      '24-hour on-board fuel capacity',
      'Low emissions (EPA Tier 4F)',
    ],
    certifications: ['UL 2200', 'EPA Tier 4 Final', 'CSA'],
    warranty: '5-year / 2,000 hour standard',
    images: [{
      filename: 'cummins_200kw_01.jpg',
      alt: 'Cummins 200 kW diesel generator set in weatherproof enclosure',
      caption: 'Cummins C200D6R — 200 kW Standby Generator',
      isPrimary: true,
      approved: false,
      source: 'vendor-press-kit',
    }],
  },
  {
    id: 'mainspring-linear-generator',
    vendorId: 'mainspring',
    category: 'generator',
    name: 'Mainspring Linear Generator',
    model: 'LG460',
    description: 'Revolutionary linear generator that converts natural gas to electricity without combustion. Ultra-low emissions and fuel-flexible (natural gas, hydrogen, biogas).',
    specs: {
      'Power': '460 kW per unit',
      'Fuel': 'Natural gas, hydrogen, biogas, propane',
      'Emissions': 'Near-zero NOx (<1 ppm)',
      'Efficiency': '> 50% electrical',
      'Footprint': '8 × 4 ft',
      'Noise': '< 65 dBA at 10 ft',
    },
    features: [
      'No combustion — linear electromechanical conversion',
      'Near-zero NOx emissions (<1 ppm)',
      'Fuel-flexible (NG, H2, biogas)',
      'Compact 8×4 ft footprint',
      'Quiet operation (< 65 dBA)',
    ],
    certifications: ['UL 2200', 'CARB certified'],
    warranty: '10-year performance guarantee',
    images: [{
      filename: 'mainspring_lg460_01.jpg',
      alt: 'Mainspring LG460 linear generator unit',
      caption: 'Mainspring LG460 — 460 kW Linear Generator',
      isPrimary: true,
      approved: false,
      source: 'vendor-press-kit',
    }],
  },
];

// ─────────────────────────────────────────────────────────
// Lookup & Utility Functions
// ─────────────────────────────────────────────────────────

/** All products (EV + generic) combined */
export const ALL_PRODUCTS: VendorProduct[] = [
  ...EV_CHARGER_PRODUCTS,
  ...EQUIPMENT_PRODUCTS,
];

/** Get vendor info by ID */
export function getVendor(vendorId: string): VendorInfo | undefined {
  return VENDORS[vendorId];
}

/** Get all products for a vendor */
export function getVendorProducts(vendorId: string): VendorProduct[] {
  return ALL_PRODUCTS.filter(p => p.vendorId === vendorId);
}

/** Get all products in a category */
export function getProductsByCategory(category: EquipmentCategory): VendorProduct[] {
  return ALL_PRODUCTS.filter(p => p.category === category);
}

/** Get all EV chargers by level */
export function getEVChargersByLevel(level: EVChargerLevel): EVChargerProduct[] {
  return EV_CHARGER_PRODUCTS.filter(p => p.chargerLevel === level);
}

/** Get all EV chargers for a specific vendor */
export function getVendorEVChargers(vendorId: string): EVChargerProduct[] {
  return EV_CHARGER_PRODUCTS.filter(p => p.vendorId === vendorId);
}

/** Get all vendors that offer a specific equipment category */
export function getVendorsForCategory(category: EquipmentCategory): VendorInfo[] {
  const vendorIds = new Set(
    ALL_PRODUCTS.filter(p => p.category === category).map(p => p.vendorId)
  );
  return Array.from(vendorIds).map(id => VENDORS[id]).filter(Boolean) as VendorInfo[];
}

/** Get a product by its ID */
export function getProductById(productId: string): VendorProduct | undefined {
  return ALL_PRODUCTS.find(p => p.id === productId);
}

/** Get the primary image for a product */
export function getProductPrimaryImage(productId: string): VendorProductImage | undefined {
  const product = getProductById(productId);
  if (!product) return undefined;
  return product.images.find(img => img.isPrimary) || product.images[0];
}

/**
 * Select recommended products for a quote configuration.
 * Returns a curated list of equipment based on the project parameters.
 */
export function selectEquipmentForQuote(config: {
  bessKWh?: number;
  solarMW?: number;
  evChargers?: { level2Count?: number; dcfcCount?: number; hpcCount?: number };
  generatorMW?: number;
  preferredVendors?: string[];
}): VendorProduct[] {
  const selected: VendorProduct[] = [];

  // BESS — pick based on size
  if (config.bessKWh && config.bessKWh > 0) {
    const bessProducts = getProductsByCategory('battery');
    const preferred = config.preferredVendors
      ? bessProducts.find(p => config.preferredVendors!.includes(p.vendorId))
      : undefined;
    if (preferred) {
      selected.push(preferred);
    } else if (config.bessKWh >= 2000) {
      // Utility-scale: recommend Tesla Megapack or Great Power container
      const megapack = getProductById('tesla-megapack');
      const greatPower = getProductById('great-power-ess-container');
      selected.push(megapack || greatPower || bessProducts[0]);
    } else {
      const catl = getProductById('catl-enerc');
      selected.push(catl || bessProducts[0]);
    }
  }

  // EV Chargers
  if (config.evChargers) {
    if (config.evChargers.level2Count && config.evChargers.level2Count > 0) {
      const l2Products = getEVChargersByLevel('level-2');
      const preferred = config.preferredVendors
        ? l2Products.find(p => config.preferredVendors!.includes(p.vendorId))
        : undefined;
      selected.push(preferred || l2Products[0]);
    }
    if (config.evChargers.dcfcCount && config.evChargers.dcfcCount > 0) {
      const dcfcProducts = getEVChargersByLevel('dcfc');
      const preferred = config.preferredVendors
        ? dcfcProducts.find(p => config.preferredVendors!.includes(p.vendorId))
        : undefined;
      selected.push(preferred || dcfcProducts[0]);
    }
    if (config.evChargers.hpcCount && config.evChargers.hpcCount > 0) {
      const hpcProducts = getEVChargersByLevel('hpc');
      const preferred = config.preferredVendors
        ? hpcProducts.find(p => config.preferredVendors!.includes(p.vendorId))
        : undefined;
      selected.push(preferred || hpcProducts[0]);
    }
  }

  // Generator
  if (config.generatorMW && config.generatorMW > 0) {
    const genProducts = getProductsByCategory('generator');
    const preferred = config.preferredVendors
      ? genProducts.find(p => config.preferredVendors!.includes(p.vendorId))
      : undefined;
    selected.push(preferred || genProducts[0]);
  }

  // Inverter / PCS (always include if BESS present)
  if (config.bessKWh && config.bessKWh > 0) {
    const pcsProducts = getProductsByCategory('inverter');
    if (pcsProducts.length > 0) {
      selected.push(pcsProducts[0]);
    }
  }

  return selected;
}

/**
 * Format equipment specs as a readable string for Word export.
 */
export function formatSpecsForExport(product: VendorProduct): string {
  return Object.entries(product.specs)
    .map(([key, value]) => `${key}: ${value}`)
    .join(' | ');
}

/**
 * Get a short vendor + product label for display.
 * Example: "ChargePoint CPF50 — Level 2 (11.5 kW)"
 */
export function getProductLabel(product: VendorProduct): string {
  const vendor = getVendor(product.vendorId);
  const vendorName = vendor?.name || product.vendorId;
  return `${vendorName} ${product.name}`;
}
