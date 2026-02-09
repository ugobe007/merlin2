/**
 * Equipment Image Library — Merlin Energy Solutions
 * 
 * Central registry for all equipment visuals:
 *   - Icon generation for Word (.docx) export (canvas-based PNG)
 *   - Photo library references
 *   - System diagram references
 * 
 * The docx library requires PNG/JPEG ArrayBuffer data for ImageRun.
 * This module generates small equipment icons at runtime via OffscreenCanvas
 * (no external dependencies needed).
 * 
 * Usage in docx export:
 *   import { generateEquipmentIconPNG, getEquipmentPhoto } from '@/utils/equipmentImageLibrary';
 *   const iconData = await generateEquipmentIconPNG('battery');
 *   new ImageRun({ type: 'png', data: iconData, transformation: { width: 24, height: 24 } })
 */

// ─────────────────────────────────────────────────────────
// Equipment Type Definitions
// ─────────────────────────────────────────────────────────

export type EquipmentType =
  | 'battery'
  | 'solar'
  | 'ev-charger'
  | 'inverter'
  | 'transformer'
  | 'generator'
  | 'bms'
  | 'wind'
  | 'switchgear'
  | 'enclosure'
  | 'monitoring'
  | 'microgrid';

export interface EquipmentAsset {
  type: EquipmentType;
  label: string;
  emoji: string;            // Fallback emoji
  color: string;            // Brand color for icon
  accentColor: string;      // Accent color for icon highlights
  photoDir: string;         // Directory for user-provided photos
  description: string;      // Short description for alt text
}

// Brand palette
const NAVY = '#1E3350';
const AMBER = '#FBBF24';
const TEAL = '#14B8A6';

// ─────────────────────────────────────────────────────────
// Equipment Asset Registry
// ─────────────────────────────────────────────────────────

export const EQUIPMENT_ASSETS: Record<EquipmentType, EquipmentAsset> = {
  battery: {
    type: 'battery',
    label: 'Battery Energy Storage (BESS)',
    emoji: '🔋',
    color: NAVY,
    accentColor: AMBER,
    photoDir: 'equipment/photos/bess',
    description: 'Lithium-ion battery energy storage system container',
  },
  solar: {
    type: 'solar',
    label: 'Solar Array',
    emoji: '☀️',
    color: NAVY,
    accentColor: AMBER,
    photoDir: 'equipment/photos/solar',
    description: 'Photovoltaic solar panel array',
  },
  'ev-charger': {
    type: 'ev-charger',
    label: 'EV Charger',
    emoji: '⚡',
    color: NAVY,
    accentColor: TEAL,
    photoDir: 'equipment/photos/ev-charger',
    description: 'Electric vehicle charging station',
  },
  inverter: {
    type: 'inverter',
    label: 'Power Conversion System (PCS)',
    emoji: '🔄',
    color: NAVY,
    accentColor: AMBER,
    photoDir: 'equipment/photos/inverter',
    description: 'DC to AC power conversion inverter system',
  },
  transformer: {
    type: 'transformer',
    label: 'Transformer',
    emoji: '⚙️',
    color: NAVY,
    accentColor: AMBER,
    photoDir: 'equipment/photos/transformer',
    description: 'Step-up/step-down power transformer',
  },
  generator: {
    type: 'generator',
    label: 'Backup Generator',
    emoji: '🔥',
    color: NAVY,
    accentColor: AMBER,
    photoDir: 'equipment/photos/generator',
    description: 'Natural gas or diesel backup generator',
  },
  bms: {
    type: 'bms',
    label: 'Battery Management System (BMS)',
    emoji: '🔌',
    color: NAVY,
    accentColor: TEAL,
    photoDir: 'equipment/photos/bms',
    description: 'Battery management and cell balancing system',
  },
  wind: {
    type: 'wind',
    label: 'Wind Turbine',
    emoji: '🌬️',
    color: NAVY,
    accentColor: AMBER,
    photoDir: 'equipment/photos/wind',
    description: 'Wind turbine generator',
  },
  switchgear: {
    type: 'switchgear',
    label: 'Switchgear & Protection',
    emoji: '🔀',
    color: NAVY,
    accentColor: AMBER,
    photoDir: 'equipment/photos/switchgear',
    description: 'Electrical switchgear and circuit protection',
  },
  enclosure: {
    type: 'enclosure',
    label: 'ESS Enclosure',
    emoji: '📦',
    color: NAVY,
    accentColor: AMBER,
    photoDir: 'equipment/photos/enclosure',
    description: 'NEMA-rated ESS container with thermal management',
  },
  monitoring: {
    type: 'monitoring',
    label: 'Monitoring & Software',
    emoji: '📊',
    color: NAVY,
    accentColor: TEAL,
    photoDir: 'equipment/photos/monitoring',
    description: 'SCADA monitoring and energy management software',
  },
  microgrid: {
    type: 'microgrid',
    label: 'Microgrid Controller',
    emoji: '🏗️',
    color: NAVY,
    accentColor: TEAL,
    photoDir: 'equipment/photos/microgrid',
    description: 'Microgrid control and orchestration system',
  },
};

// ─────────────────────────────────────────────────────────
// Canvas-Based PNG Icon Generator (for docx export)
// ─────────────────────────────────────────────────────────

/** Cache for generated icon ArrayBuffers (avoids regenerating each time) */
const iconCache = new Map<string, ArrayBuffer>();

/**
 * Draw a specific equipment icon on a canvas context.
 * Each icon is drawn within a 48x48 viewport.
 */
function drawEquipmentIcon(
  ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D,
  type: EquipmentType,
  color: string,
  accent: string,
  size: number,
): void {
  const s = size / 48; // Scale factor
  ctx.save();
  ctx.scale(s, s);
  ctx.lineWidth = 2.5;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  switch (type) {
    case 'battery': {
      // Battery body
      ctx.strokeStyle = color;
      ctx.strokeRect(6, 12, 32, 28);
      // Terminal
      ctx.fillStyle = color;
      ctx.fillRect(38, 20, 5, 12);
      // Charge bars
      ctx.fillStyle = accent;
      ctx.fillRect(10, 16, 6, 20);
      ctx.globalAlpha = 0.7;
      ctx.fillRect(18, 16, 6, 20);
      ctx.globalAlpha = 0.4;
      ctx.fillRect(26, 16, 6, 20);
      ctx.globalAlpha = 1;
      // Lightning bolt
      ctx.strokeStyle = color;
      ctx.beginPath();
      ctx.moveTo(22, 6);
      ctx.lineTo(18, 12);
      ctx.lineTo(23, 12);
      ctx.lineTo(19, 18);
      ctx.stroke();
      break;
    }
    case 'solar': {
      // Sun rays
      ctx.strokeStyle = accent;
      ctx.lineWidth = 2;
      const rays = [[24, 2, 24, 8], [36, 4, 33, 9], [40, 16, 35, 16], [8, 4, 11, 9], [4, 16, 9, 16]];
      rays.forEach(([x1, y1, x2, y2]) => { ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke(); });
      // Panel
      ctx.strokeStyle = color;
      ctx.lineWidth = 2.5;
      ctx.strokeRect(6, 20, 36, 22);
      // Grid
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(6, 31); ctx.lineTo(42, 31);
      ctx.moveTo(18, 20); ctx.lineTo(18, 42);
      ctx.moveTo(30, 20); ctx.lineTo(30, 42);
      ctx.stroke();
      break;
    }
    case 'ev-charger': {
      // Station body
      ctx.strokeStyle = color;
      ctx.strokeRect(10, 6, 22, 34);
      // Screen
      ctx.fillStyle = color;
      ctx.globalAlpha = 0.1;
      ctx.fillRect(14, 10, 14, 8);
      ctx.globalAlpha = 1;
      ctx.strokeRect(14, 10, 14, 8);
      // Lightning bolt
      ctx.strokeStyle = accent;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(23, 12); ctx.lineTo(19, 17); ctx.lineTo(24, 17); ctx.lineTo(20, 22);
      ctx.stroke();
      // Cable
      ctx.strokeStyle = color;
      ctx.beginPath();
      ctx.moveTo(32, 24); ctx.bezierCurveTo(38, 24, 38, 32, 40, 36);
      ctx.stroke();
      // Plug
      ctx.fillStyle = accent;
      ctx.beginPath();
      ctx.arc(40, 39, 3, 0, Math.PI * 2);
      ctx.fill();
      // Base
      ctx.fillStyle = color;
      ctx.fillRect(6, 40, 30, 3);
      break;
    }
    case 'inverter': {
      // Box
      ctx.strokeStyle = color;
      ctx.strokeRect(4, 10, 40, 28);
      // DC label
      ctx.fillStyle = color;
      ctx.font = 'bold 7px Helvetica, Arial';
      ctx.fillText('DC', 8, 20);
      // DC line
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(8, 26); ctx.lineTo(16, 26); ctx.stroke();
      // Arrow
      ctx.strokeStyle = accent;
      ctx.beginPath(); ctx.moveTo(19, 24); ctx.lineTo(25, 24); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(23, 21); ctx.lineTo(26, 24); ctx.lineTo(23, 27); ctx.stroke();
      // AC wave
      ctx.strokeStyle = color;
      ctx.beginPath();
      ctx.moveTo(28, 24);
      ctx.quadraticCurveTo(31, 18, 34, 24);
      ctx.quadraticCurveTo(37, 30, 40, 24);
      ctx.stroke();
      // AC label
      ctx.fillStyle = color;
      ctx.fillText('AC', 30, 20);
      break;
    }
    case 'transformer': {
      // Primary coil
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      const yCoils = [10, 18, 26, 34];
      yCoils.forEach(y => {
        ctx.beginPath();
        ctx.arc(12, y + 4, 6, -Math.PI / 2, Math.PI / 2, false);
        ctx.stroke();
      });
      // Secondary coil
      yCoils.forEach(y => {
        ctx.beginPath();
        ctx.arc(36, y + 4, 6, Math.PI / 2, -Math.PI / 2, false);
        ctx.stroke();
      });
      // Core
      ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.moveTo(22, 8); ctx.lineTo(22, 42); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(26, 8); ctx.lineTo(26, 42); ctx.stroke();
      break;
    }
    case 'generator': {
      // Housing
      ctx.strokeStyle = color;
      ctx.strokeRect(6, 14, 30, 24);
      // G label
      ctx.fillStyle = color;
      ctx.font = 'bold 14px Helvetica, Arial';
      ctx.fillText('G', 15, 31);
      // Exhaust
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(36, 18); ctx.lineTo(40, 18); ctx.lineTo(40, 12); ctx.stroke();
      // Bolt
      ctx.strokeStyle = accent;
      ctx.beginPath(); ctx.moveTo(39, 28); ctx.lineTo(36, 34); ctx.lineTo(40, 34); ctx.lineTo(37, 40); ctx.stroke();
      // Base
      ctx.fillStyle = color;
      ctx.fillRect(4, 38, 34, 3);
      break;
    }
    case 'bms': {
      // Board
      ctx.strokeStyle = color;
      ctx.strokeRect(4, 8, 40, 32);
      // Chip
      ctx.fillStyle = color;
      ctx.globalAlpha = 0.1;
      ctx.fillRect(14, 16, 20, 14);
      ctx.globalAlpha = 1;
      ctx.strokeRect(14, 16, 20, 14);
      ctx.fillStyle = color;
      ctx.font = 'bold 7px Helvetica, Arial';
      ctx.fillText('BMS', 17, 26);
      // Pins
      ctx.lineWidth = 1.5;
      [19, 24, 29].forEach(x => {
        ctx.beginPath(); ctx.moveTo(x, 16); ctx.lineTo(x, 10); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(x, 30); ctx.lineTo(x, 36); ctx.stroke();
      });
      // Traces
      ctx.strokeStyle = accent;
      ctx.beginPath(); ctx.moveTo(6, 14); ctx.lineTo(14, 14); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(34, 14); ctx.lineTo(42, 14); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(6, 24); ctx.lineTo(14, 24); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(34, 24); ctx.lineTo(42, 24); ctx.stroke();
      break;
    }
    case 'wind': {
      // Hub
      ctx.fillStyle = color;
      ctx.beginPath(); ctx.arc(24, 16, 3, 0, Math.PI * 2); ctx.fill();
      // Blades (simplified)
      ctx.strokeStyle = color;
      ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(24, 16); ctx.lineTo(24, 4); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(24, 16); ctx.lineTo(34, 24); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(24, 16); ctx.lineTo(14, 24); ctx.stroke();
      // Tower
      ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.moveTo(24, 19); ctx.lineTo(24, 42); ctx.stroke();
      // Base
      ctx.beginPath(); ctx.moveTo(16, 42); ctx.lineTo(32, 42); ctx.stroke();
      // Wind lines
      ctx.strokeStyle = accent;
      ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(36, 10); ctx.lineTo(42, 10); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(38, 16); ctx.lineTo(44, 16); ctx.stroke();
      break;
    }
    case 'switchgear': {
      // Cabinet
      ctx.strokeStyle = color;
      ctx.strokeRect(8, 6, 32, 36);
      // Divider
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(8, 24); ctx.lineTo(40, 24); ctx.stroke();
      // Breakers
      ctx.lineWidth = 1.5;
      ctx.strokeRect(12, 10, 10, 10);
      ctx.strokeRect(26, 10, 10, 10);
      // Handles
      ctx.strokeStyle = accent;
      ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(17, 12); ctx.lineTo(17, 18); ctx.stroke();
      ctx.strokeStyle = color;
      ctx.beginPath(); ctx.moveTo(31, 12); ctx.lineTo(31, 18); ctx.stroke();
      // Bus bars
      ctx.strokeStyle = accent;
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(12, 30); ctx.lineTo(36, 30); ctx.stroke();
      ctx.strokeStyle = color;
      ctx.beginPath(); ctx.moveTo(12, 36); ctx.lineTo(36, 36); ctx.stroke();
      break;
    }
    case 'enclosure': {
      // Container body
      ctx.strokeStyle = color;
      ctx.strokeRect(4, 12, 34, 28);
      // 3D top
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(4, 12); ctx.lineTo(10, 6); ctx.lineTo(44, 6); ctx.lineTo(38, 12);
      ctx.closePath();
      ctx.fillStyle = color;
      ctx.globalAlpha = 0.08;
      ctx.fill();
      ctx.globalAlpha = 1;
      ctx.stroke();
      // 3D side
      ctx.beginPath();
      ctx.moveTo(38, 12); ctx.lineTo(44, 6); ctx.lineTo(44, 34); ctx.lineTo(38, 40);
      ctx.fillStyle = color;
      ctx.globalAlpha = 0.05;
      ctx.fill();
      ctx.globalAlpha = 1;
      ctx.stroke();
      // Vents
      ctx.lineWidth = 1;
      [18, 22, 26].forEach(y => {
        ctx.beginPath(); ctx.moveTo(8, y); ctx.lineTo(22, y); ctx.stroke();
      });
      // Battery inside
      ctx.strokeStyle = accent;
      ctx.strokeRect(10, 30, 10, 6);
      ctx.fillStyle = accent;
      ctx.fillRect(20, 31, 2, 4);
      break;
    }
    case 'monitoring': {
      // Monitor
      ctx.strokeStyle = color;
      ctx.strokeRect(4, 6, 40, 28);
      // Chart
      ctx.strokeStyle = accent;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(8, 28); ctx.lineTo(16, 22); ctx.lineTo(22, 26);
      ctx.lineTo(30, 14); ctx.lineTo(36, 18); ctx.lineTo(40, 12);
      ctx.stroke();
      // Dots
      ctx.fillStyle = accent;
      ctx.beginPath(); ctx.arc(16, 22, 2, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(30, 14, 2, 0, Math.PI * 2); ctx.fill();
      // Stand
      ctx.fillStyle = color;
      ctx.fillRect(18, 34, 12, 3);
      ctx.fillRect(14, 37, 20, 2);
      break;
    }
    case 'microgrid': {
      // Central hub
      ctx.fillStyle = color;
      ctx.globalAlpha = 0.1;
      ctx.beginPath(); ctx.arc(24, 24, 8, 0, Math.PI * 2); ctx.fill();
      ctx.globalAlpha = 1;
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(24, 24, 8, 0, Math.PI * 2); ctx.stroke();
      ctx.fillStyle = color;
      ctx.font = 'bold 7px Helvetica, Arial';
      ctx.fillText('μG', 18, 27);
      // Nodes
      const nodes = [[24, 6], [38, 12], [42, 24], [38, 36], [24, 42], [10, 36], [6, 24], [10, 12]];
      nodes.forEach(([nx, ny], i) => {
        ctx.strokeStyle = color;
        ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.moveTo(24, 24); ctx.lineTo(nx, ny); ctx.stroke();
        ctx.fillStyle = i < 5 ? accent : color;
        ctx.globalAlpha = i < 5 ? 1 : 0.3;
        ctx.beginPath(); ctx.arc(nx, ny, 3, 0, Math.PI * 2); ctx.fill();
        ctx.globalAlpha = 1;
      });
      break;
    }
  }

  ctx.restore();
}

/**
 * Generate a PNG icon as ArrayBuffer for use in docx ImageRun.
 * Uses OffscreenCanvas (or falls back to regular canvas) for rendering.
 * Results are cached for performance.
 * 
 * @param type - Equipment type to generate icon for
 * @param size - Icon size in pixels (default 48)
 * @returns ArrayBuffer of PNG data, or null if canvas unavailable
 */
export async function generateEquipmentIconPNG(
  type: EquipmentType,
  size: number = 48,
): Promise<ArrayBuffer | null> {
  const cacheKey = `${type}_${size}`;
  if (iconCache.has(cacheKey)) {
    return iconCache.get(cacheKey)!;
  }

  try {
    const asset = EQUIPMENT_ASSETS[type];
    if (!asset) return null;

    let canvas: HTMLCanvasElement | OffscreenCanvas;
    let ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D;

    if (typeof OffscreenCanvas !== 'undefined') {
      canvas = new OffscreenCanvas(size, size);
      ctx = canvas.getContext('2d')!;
    } else if (typeof document !== 'undefined') {
      const el = document.createElement('canvas');
      el.width = size;
      el.height = size;
      canvas = el;
      ctx = el.getContext('2d')!;
    } else {
      return null;
    }

    // Clear with white background for docx
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, size, size);

    // Draw the icon
    drawEquipmentIcon(ctx, type, asset.color, asset.accentColor, size);

    // Export to PNG
    let blob: Blob;
    if (canvas instanceof OffscreenCanvas) {
      blob = await canvas.convertToBlob({ type: 'image/png' });
    } else {
      blob = await new Promise<Blob>((resolve) => {
        (canvas as HTMLCanvasElement).toBlob((b) => resolve(b!), 'image/png');
      });
    }

    const buffer = await blob.arrayBuffer();
    iconCache.set(cacheKey, buffer);
    return buffer;
  } catch (err) {
    console.warn(`[equipmentImageLibrary] Failed to generate icon for ${type}:`, err);
    return null;
  }
}

/**
 * Generate all equipment icons at once.
 * Useful for pre-loading before docx generation.
 */
export async function preloadAllIcons(size: number = 48): Promise<Map<EquipmentType, ArrayBuffer>> {
  const results = new Map<EquipmentType, ArrayBuffer>();
  const types = Object.keys(EQUIPMENT_ASSETS) as EquipmentType[];
  
  await Promise.all(
    types.map(async (type) => {
      const data = await generateEquipmentIconPNG(type, size);
      if (data) results.set(type, data);
    })
  );
  
  return results;
}

/**
 * Get the emoji fallback for an equipment type.
 */
export function getEquipmentEmoji(type: string): string {
  const normalized = type.toLowerCase().replace(/[\s_]+/g, '-') as EquipmentType;
  return EQUIPMENT_ASSETS[normalized]?.emoji || '⚙️';
}

/**
 * Get equipment asset metadata.
 */
export function getEquipmentAsset(type: string): EquipmentAsset | null {
  const normalized = type.toLowerCase().replace(/[\s_]+/g, '-') as EquipmentType;
  return EQUIPMENT_ASSETS[normalized] || null;
}

/**
 * Map common quote line item names to equipment types for icon lookup.
 */
export const LINE_ITEM_ICON_MAP: Record<string, EquipmentType> = {
  // Battery / BESS
  'Battery Energy Storage (BESS)': 'battery',
  'Battery System': 'battery',
  'BESS': 'battery',
  'battery': 'battery',
  // PCS / Inverter
  'Power Conversion System (PCS)': 'inverter',
  'PCS': 'inverter',
  'Inverter': 'inverter',
  'inverters': 'inverter',
  'Solar Inverters': 'inverter',
  // BMS
  'Battery Management System (BMS)': 'bms',
  'BMS': 'bms',
  // ESS Enclosure
  'ESS Enclosure & Thermal': 'enclosure',
  'ESS Enclosure': 'enclosure',
  'enclosure': 'enclosure',
  // Monitoring
  'BESS Monitoring & Software (Yr 1)': 'monitoring',
  'BESS Monitoring': 'monitoring',
  'monitoring': 'monitoring',
  'Software': 'monitoring',
  // Transformer / Switchgear
  'Transformers & Switchgear': 'transformer',
  'Transformers': 'transformer',
  'Switchgear': 'switchgear',
  // Solar
  'Solar Array + Inverters': 'solar',
  'Solar Array': 'solar',
  'solar': 'solar',
  // Wind
  'Wind Turbines + Converters': 'wind',
  'Wind Turbines': 'wind',
  'wind': 'wind',
  // Generator
  'Generator Backup': 'generator',
  'Backup Generator': 'generator',
  'generator': 'generator',
  // Microgrid
  'Microgrid Controls': 'microgrid',
  'microgrid': 'microgrid',
  // EV Charger
  'EV Charger': 'ev-charger',
  'ev-charger': 'ev-charger',
};

/**
 * Look up the equipment type for a quote line item name.
 */
export function getLineItemIconType(lineItemName: string): EquipmentType | null {
  // Direct match
  if (LINE_ITEM_ICON_MAP[lineItemName]) {
    return LINE_ITEM_ICON_MAP[lineItemName];
  }
  // Fuzzy match
  const lower = lineItemName.toLowerCase();
  for (const [key, type] of Object.entries(LINE_ITEM_ICON_MAP)) {
    if (lower.includes(key.toLowerCase())) {
      return type;
    }
  }
  return null;
}

// ─────────────────────────────────────────────────────────
// Vendor Equipment Integration
// Re-exports from vendorEquipment.ts for single-import convenience
// ─────────────────────────────────────────────────────────

export {
  getVendor,
  getVendorProducts,
  getProductsByCategory,
  getEVChargersByLevel,
  getVendorEVChargers,
  getVendorsForCategory,
  getProductById,
  getProductPrimaryImage,
  selectEquipmentForQuote,
  formatSpecsForExport,
  getProductLabel,
  VENDORS,
  EV_CHARGER_PRODUCTS,
  EQUIPMENT_PRODUCTS,
  ALL_PRODUCTS,
} from '../data/vendorEquipment';

export type {
  VendorInfo,
  VendorProduct,
  VendorProductImage,
  EVChargerProduct,
  EVChargerLevel,
  ChargerConnector,
  EquipmentCategory,
} from '../data/vendorEquipment';

export default {
  EQUIPMENT_ASSETS,
  generateEquipmentIconPNG,
  preloadAllIcons,
  getEquipmentEmoji,
  getEquipmentAsset,
  getLineItemIconType,
  LINE_ITEM_ICON_MAP,
};
