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
  'no_reclaim': { type: 'emoji', value: '💧' },
  'partial_reclaim': { type: 'emoji', value: '🔄' },
  'full_reclaim': { type: 'emoji', value: '♻️' },
  'advanced_treatment': { type: 'emoji', value: '✨' },

  // ============================================================================
  // NUMBERS (for tunnel count, days, charger count, etc.)
  // ============================================================================
  '1': { type: 'emoji', value: '1️⃣' },
  '2': { type: 'emoji', value: '2️⃣' },
  '3': { type: 'emoji', value: '3️⃣' },
  '4': { type: 'emoji', value: '4️⃣' },
  '5': { type: 'emoji', value: '5️⃣' },
  '6': { type: 'emoji', value: '6️⃣' },
  '7': { type: 'emoji', value: '7️⃣' },
  '8': { type: 'emoji', value: '8️⃣' },
  '9': { type: 'emoji', value: '9️⃣' },
  '10': { type: 'emoji', value: '🔟' },
  '12': { type: 'emoji', value: '🕛' },
  '16': { type: 'emoji', value: '⏰' },
  '20': { type: 'emoji', value: '⏰' },
  '24': { type: 'emoji', value: '🌙' },

  // ============================================================================
  // YES / NO / BOOLEAN OPTIONS
  // ============================================================================
  'yes': { type: 'emoji', value: '✅' },
  'no': { type: 'emoji', value: '❌' },
  'true': { type: 'emoji', value: '✅' },
  'false': { type: 'emoji', value: '❌' },
  'not_sure': { type: 'emoji', value: '🤔' },
  'unknown': { type: 'emoji', value: '🤔' },
  'maybe': { type: 'emoji', value: '🤷' },

  // ============================================================================
  // SIZE OPTIONS
  // ============================================================================
  'none': { type: 'emoji', value: '🚫' },
  'small': { type: 'emoji', value: '📦' },
  'medium': { type: 'emoji', value: '📦' },
  'large': { type: 'emoji', value: '📦' },
  'extra_large': { type: 'emoji', value: '🏭' },

  // ============================================================================
  // LIGHTING OPTIONS
  // ============================================================================
  'basic_led': { type: 'emoji', value: '💡' },
  'enhanced_led': { type: 'emoji', value: '✨' },
  'premium_effects': { type: 'emoji', value: '🌈' },
  'basic': { type: 'emoji', value: '📋' },
  'premium': { type: 'emoji', value: '⭐' },
  'signature': { type: 'emoji', value: '🌟' },

  // ============================================================================
  // SIGNAGE OPTIONS
  // ============================================================================
  'basic_signage': { type: 'emoji', value: '📋' },
  'premium_signage': { type: 'emoji', value: '⭐' },
  'signature_signage': { type: 'emoji', value: '🌟' },
  'led_display': { type: 'emoji', value: '📺' },
  'digital': { type: 'emoji', value: '📺' },

  // ============================================================================
  // FACILITY / AMENITY OPTIONS
  // ============================================================================
  'office': { type: 'emoji', value: '🏢' },
  'break_room': { type: 'emoji', value: '☕' },
  'breakroom': { type: 'emoji', value: '☕' },
  'bathrooms': { type: 'emoji', value: '🚻' },
  'restrooms': { type: 'emoji', value: '🚻' },
  'security_cameras': { type: 'emoji', value: '📹' },
  'security': { type: 'emoji', value: '🔒' },
  'lobby': { type: 'emoji', value: '🛋️' },
  'waiting_area': { type: 'emoji', value: '🛋️' },

  // ============================================================================
  // SOLAR / RENEWABLE OPTIONS
  // ============================================================================
  'yes_interested': { type: 'emoji', value: '☀️' },
  'tell_me_more': { type: 'emoji', value: '🤔' },
  'no_thanks': { type: 'emoji', value: '👋' },
  'already_have': { type: 'emoji', value: '✅' },
  'solar_yes': { type: 'emoji', value: '☀️' },
  'solar_no': { type: 'emoji', value: '🌙' },

  // ============================================================================
  // EQUIPMENT / PUMP OPTIONS
  // ============================================================================
  'standard': { type: 'emoji', value: '⚙️' },
  'high_pressure': { type: 'emoji', value: '💪' },
  'low_pressure': { type: 'emoji', value: '🌊' },
  'variable_speed': { type: 'emoji', value: '🔄' },
  'fixed_speed': { type: 'emoji', value: '▶️' },

  // ============================================================================
  // PAYMENT / KIOSK OPTIONS
  // ============================================================================
  'cash_only': { type: 'emoji', value: '💵' },
  'card_only': { type: 'emoji', value: '💳' },
  'all_payments': { type: 'emoji', value: '💰' },
  'contactless': { type: 'emoji', value: '📱' },

  // ============================================================================
  // PRIORITY / IMPORTANCE OPTIONS
  // ============================================================================
  'high': { type: 'emoji', value: '🔴' },
  'medium_priority': { type: 'emoji', value: '🟡' },
  'low': { type: 'emoji', value: '🟢' },
  'critical': { type: 'emoji', value: '⚠️' },

  // ============================================================================
  // TIMING / SCHEDULE OPTIONS
  // ============================================================================
  'morning': { type: 'emoji', value: '🌅' },
  'afternoon': { type: 'emoji', value: '☀️' },
  'evening': { type: 'emoji', value: '🌆' },
  'night': { type: 'emoji', value: '🌙' },
  '24_7': { type: 'emoji', value: '⏰' },
  'weekdays': { type: 'emoji', value: '📅' },
  'weekends': { type: 'emoji', value: '🎉' },

  // ============================================================================
  // EV CHARGER TYPES
  // ============================================================================
  'level_2': { type: 'emoji', value: '🔌' },
  'level2': { type: 'emoji', value: '🔌' },
  'dcfc': { type: 'emoji', value: '⚡' },
  'dc_fast': { type: 'emoji', value: '⚡' },
  'hpc': { type: 'emoji', value: '🚀' },
  'supercharger': { type: 'emoji', value: '🚀' },

  // ============================================================================
  // HOTEL / HOSPITALITY OPTIONS
  // ============================================================================
  'economy': { type: 'emoji', value: '💰' },
  'midscale': { type: 'emoji', value: '🏨' },
  'upscale': { type: 'emoji', value: '⭐' },
  'luxury': { type: 'emoji', value: '👑' },
  'boutique': { type: 'emoji', value: '🎀' },
  'resort': { type: 'emoji', value: '🏝️' },

  // ============================================================================
  // GENERATOR / BACKUP OPTIONS
  // ============================================================================
  'diesel': { type: 'emoji', value: '⛽' },
  'natural_gas': { type: 'emoji', value: '🔥' },
  'dual_fuel': { type: 'emoji', value: '🔄' },
  'propane': { type: 'emoji', value: '🛢️' },
  'battery_backup': { type: 'emoji', value: '🔋' },

  // ============================================================================
  // GENERAL INTEREST OPTIONS
  // ============================================================================
  'interested': { type: 'emoji', value: '👍' },
  'not_interested': { type: 'emoji', value: '👎' },
  'learn_more': { type: 'emoji', value: '📚' },
  'contact_me': { type: 'emoji', value: '📞' },
  'skip': { type: 'emoji', value: '⏭️' },
  'other': { type: 'emoji', value: '📝' },
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
