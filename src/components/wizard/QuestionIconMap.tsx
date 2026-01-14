/**
 * Question Icon Mapping System
 * 
 * Maps question field names and option values to appropriate icons
 * Supports: Emoji, Lucide icons, Custom SVG icons, Image files
 * 
 * Priority: Custom SVG > Image > Lucide > Emoji
 */

import * as LucideIcons from 'lucide-react';
import React from 'react';

// ============================================================================
// ICON TYPES
// ============================================================================

type IconType = 'emoji' | 'lucide' | 'svg' | 'image';

interface IconMapping {
  type: IconType;
  value: React.ReactNode | string;
  alt?: string;
}

// ============================================================================
// CUSTOM SVG ICONS (Import from MerlinIcons if available)
// ============================================================================

// Placeholder for custom SVG icons - these should be imported from MerlinIcons.tsx
// For now, we'll use a mapping system that can handle both

// ============================================================================
// QUESTION ICON MAPPING
// ============================================================================

const QUESTION_ICON_MAP: Record<string, IconMapping> = {
  // ============================================================================
  // CAR WASH - FACILITY TYPES
  // ============================================================================
  'express_tunnel': { type: 'emoji', value: '🚗' },
  'tunnel_express': { type: 'emoji', value: '🚗' },
  'mini_tunnel': { type: 'emoji', value: '🚙' },
  'tunnel_mini': { type: 'emoji', value: '🚙' },
  'in_bay_automatic': { type: 'emoji', value: '🏪' },
  'iba': { type: 'emoji', value: '🏪' },
  'self_serve': { type: 'emoji', value: '💪' },
  'gantry': { type: 'emoji', value: '🚛' },
  'truck_wash': { type: 'emoji', value: '🚛' },

  // ============================================================================
  // CAR WASH - EQUIPMENT
  // ============================================================================
  'blowerType': { type: 'emoji', value: '💨' },
  'standard_4': { type: 'emoji', value: '💨' },
  'premium_6': { type: 'emoji', value: '💨💨' },
  'heated': { type: 'emoji', value: '🔥' },
  'none': { type: 'emoji', value: '❄️' },

  'waterHeaterType': { type: 'emoji', value: '🔥' },
  'electric': { type: 'emoji', value: '⚡' },
  'gas': { type: 'emoji', value: '🔥' },

  'waterReclaim': { type: 'emoji', value: '💧' },
  'full': { type: 'emoji', value: '♻️' },
  'partial': { type: 'emoji', value: '🔄' },

  // ============================================================================
  // OPERATIONS
  // ============================================================================
  'operatingHours': { type: 'lucide', value: 'Clock' },
  'hoursPerDay': { type: 'lucide', value: 'Clock' },
  'operatingDays': { type: 'lucide', value: 'Calendar' },
  'daysOpen': { type: 'lucide', value: 'Calendar' },

  // ============================================================================
  // FACILITY SIZE
  // ============================================================================
  'siteSqFt': { type: 'lucide', value: 'Maximize2' },
  'roofSqFt': { type: 'lucide', value: 'Home' },
  'rooftopSquareFootage': { type: 'lucide', value: 'Home' },
  'squareFootage': { type: 'lucide', value: 'Maximize2' },

  // ============================================================================
  // EV CHARGING
  // ============================================================================
  'evL2Count': { type: 'lucide', value: 'Zap' },
  'evDcfcCount': { type: 'lucide', value: 'Zap' },
  'evChargers': { type: 'lucide', value: 'Zap' },

  // ============================================================================
  // DEFAULT FALLBACKS
  // ============================================================================
  'default': { type: 'emoji', value: '❓' },
};

// ============================================================================
// OPTION VALUE MAPPINGS (for specific option values)
// ============================================================================

const OPTION_VALUE_MAP: Record<string, IconMapping> = {
  // Car Wash Facility Types
  'express_tunnel': { type: 'emoji', value: '🚗' },
  'tunnel_express': { type: 'emoji', value: '🚗' },
  'mini_tunnel': { type: 'emoji', value: '🚙' },
  'tunnel_mini': { type: 'emoji', value: '🚙' },
  'in_bay_automatic': { type: 'emoji', value: '🏪' },
  'iba': { type: 'emoji', value: '🏪' },
  'self_serve': { type: 'emoji', value: '💪' },
  'gantry': { type: 'emoji', value: '🚛' },
  'truck_wash': { type: 'emoji', value: '🚛' },

  // Blower Types
  'standard_4': { type: 'emoji', value: '💨' },
  'premium_6': { type: 'emoji', value: '💨💨' },
  'heated': { type: 'emoji', value: '🔥' },
  'no-heating': { type: 'emoji', value: '❄️' },

  // Water Heater Types
  'electric': { type: 'emoji', value: '⚡' },
  'gas': { type: 'emoji', value: '🔥' },
  'no-water-heater': { type: 'emoji', value: '❄️' },

  // Water Reclaim
  'full': { type: 'emoji', value: '♻️' },
  'partial': { type: 'emoji', value: '🔄' },
  'no-reclaim': { type: 'emoji', value: '💧' },
};

// ============================================================================
// ICON RESOLVER
// ============================================================================

/**
 * Get icon for a question field or option value
 * Priority: Option value mapping > Question field mapping > Lucide fallback > Emoji fallback
 */
export function getQuestionIcon(
  questionField?: string,
  optionValue?: string,
  iconName?: string
): React.ReactNode {
  // 1. Try option value mapping (most specific)
  if (optionValue && OPTION_VALUE_MAP[optionValue]) {
    return renderIcon(OPTION_VALUE_MAP[optionValue]);
  }

  // 2. Try question field mapping
  if (questionField && QUESTION_ICON_MAP[questionField]) {
    return renderIcon(QUESTION_ICON_MAP[questionField]);
  }

  // 3. Try icon name as Lucide icon
  if (iconName) {
    const LucideIcon = (LucideIcons as any)[iconName];
    if (LucideIcon) {
      return <LucideIcon className="w-5 h-5" />;
    }
  }

  // 4. Try icon name as emoji
  if (iconName && /[\u{1F300}-\u{1F9FF}]/u.test(iconName)) {
    return <span className="text-2xl">{iconName}</span>;
  }

  // 5. Fallback to default
  return renderIcon(QUESTION_ICON_MAP['default'] || { type: 'emoji', value: '❓' });
}

/**
 * Render icon based on type
 */
function renderIcon(mapping: IconMapping): React.ReactNode {
  switch (mapping.type) {
    case 'emoji':
      return <span className="text-2xl">{mapping.value as string}</span>;
    
    case 'lucide': {
      const LucideIcon = (LucideIcons as any)[mapping.value as string];
      if (LucideIcon) {
        return <LucideIcon className="w-5 h-5" />;
      }
      return <span className="text-2xl">❓</span>;
    }
    
    case 'svg':
      // Custom SVG component
      return mapping.value as React.ReactNode;
    
    case 'image':
      return (
        <img 
          src={mapping.value as string} 
          alt={mapping.alt || 'Icon'} 
          className="w-5 h-5 object-contain"
        />
      );
    
    default:
      return <span className="text-2xl">❓</span>;
  }
}

export default getQuestionIcon;
