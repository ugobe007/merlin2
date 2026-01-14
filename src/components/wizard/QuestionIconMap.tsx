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
  // HOTEL / HOSPITALITY - Question Fields
  // ============================================================================
  'hotelClassification': { type: 'emoji', value: '🏨' },
  'hotelCategory': { type: 'emoji', value: '🏨' },
  'roomCount': { type: 'emoji', value: '🛏️' },
  'avgOccupancy': { type: 'emoji', value: '📊' },
  'amenities': { type: 'emoji', value: '✨' },
  'foodService': { type: 'emoji', value: '🍽️' },
  'hvacSystem': { type: 'emoji', value: '❄️' },
  'hvacType': { type: 'emoji', value: '❄️' },
  'meetingSpace': { type: 'emoji', value: '📊' },
  'conferenceRooms': { type: 'emoji', value: '🎤' },
  'parkingSpaces': { type: 'emoji', value: '🅿️' },
  'evChargingStations': { type: 'emoji', value: '🔌' },
  'laundryFacilities': { type: 'emoji', value: '👕' },
  'sustainabilityCerts': { type: 'emoji', value: '🌿' },
  'backupPower': { type: 'emoji', value: '🔋' },
  'primaryGoal': { type: 'emoji', value: '🎯' },
  'energyGoals': { type: 'emoji', value: '🎯' },

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
  // HOTEL / HOSPITALITY - Property Classification
  // ============================================================================
  'budget': { type: 'emoji', value: '💰' },
  'economy': { type: 'emoji', value: '💰' },
  'midscale': { type: 'emoji', value: '🏨' },
  'upper-midscale': { type: 'emoji', value: '🏨' },
  'upscale': { type: 'emoji', value: '⭐' },
  'upper-upscale': { type: 'emoji', value: '🌟' },
  'luxury': { type: 'emoji', value: '👑' },
  'boutique': { type: 'emoji', value: '🎀' },
  'resort': { type: 'emoji', value: '🏝️' },
  'extended-stay': { type: 'emoji', value: '🏠' },
  'inn-bb': { type: 'emoji', value: '🛏️' },

  // ============================================================================
  // HOTEL / HOSPITALITY - Amenities
  // ============================================================================
  'indoor_pool': { type: 'emoji', value: '🏊' },
  'outdoor_pool': { type: 'emoji', value: '🏊‍♂️' },
  'pool_unheated': { type: 'emoji', value: '💧' },
  'hot_tub': { type: 'emoji', value: '🛁' },
  'full_spa': { type: 'emoji', value: '💆' },
  'fitness_small': { type: 'emoji', value: '🏋️' },
  'fitness_large': { type: 'emoji', value: '💪' },
  'restaurant_small': { type: 'emoji', value: '🍽️' },
  'restaurant_large': { type: 'emoji', value: '🍴' },
  'multiple_restaurants': { type: 'emoji', value: '🍽️🍽️' },
  'bar_lounge': { type: 'emoji', value: '🍸' },
  'conference_small': { type: 'emoji', value: '📊' },
  'conference_center': { type: 'emoji', value: '🎤' },
  'ballroom': { type: 'emoji', value: '💃' },
  'rooftop_venue': { type: 'emoji', value: '🌃' },
  'laundry_guest': { type: 'emoji', value: '👕' },
  'laundry_commercial': { type: 'emoji', value: '🧺' },
  'business_center': { type: 'emoji', value: '🖥️' },
  'ev_stations': { type: 'emoji', value: '🔌' },
  'valet_parking': { type: 'emoji', value: '🚗' },
  'heated_parking': { type: 'emoji', value: '🅿️' },

  // ============================================================================
  // HOTEL / HOSPITALITY - Food & Beverage
  // ============================================================================
  'continental': { type: 'emoji', value: '🥐' },
  'hot_breakfast': { type: 'emoji', value: '🍳' },
  'full_breakfast': { type: 'emoji', value: '🍽️' },
  'buffet': { type: 'emoji', value: '🍱' },
  'room_service_limited': { type: 'emoji', value: '🛎️' },
  'room_service_24h': { type: 'emoji', value: '🔔' },
  'grab_and_go': { type: 'emoji', value: '🥪' },
  'vending_only': { type: 'emoji', value: '🎰' },

  // ============================================================================
  // HOTEL / HOSPITALITY - Building Systems
  // ============================================================================
  'ptac': { type: 'emoji', value: '❄️' },
  'central_vav': { type: 'emoji', value: '🌀' },
  'vrf': { type: 'emoji', value: '🔄' },
  'chiller': { type: 'emoji', value: '🧊' },
  'geothermal': { type: 'emoji', value: '🌍' },
  'water_source_hp': { type: 'emoji', value: '💧' },
  'boiler_chiller': { type: 'emoji', value: '🔥' },
  'individual_units': { type: 'emoji', value: '🏠' },
  'central_system': { type: 'emoji', value: '🏢' },
  'heat_pumps': { type: 'emoji', value: '♨️' },
  'full_kitchen': { type: 'emoji', value: '👨‍🍳' },

  // ============================================================================
  // FUEL TYPE OPTIONS (hyphenated variants)
  // ============================================================================
  'dual-fuel': { type: 'emoji', value: '🔄' },
  'natural-gas': { type: 'emoji', value: '🔥' },

  // ============================================================================
  // DATA CENTER - Additional Options
  // ============================================================================
  'it_data_only': { type: 'emoji', value: '💾' },
  'university': { type: 'emoji', value: '🎓' },

  // ============================================================================
  // HOTEL / HOSPITALITY - Kitchen Equipment
  // ============================================================================
  'commercial_kitchen': { type: 'emoji', value: '👨‍🍳' },
  'prep_kitchen': { type: 'emoji', value: '🔪' },
  'warming_station': { type: 'emoji', value: '🍲' },
  'no_kitchen': { type: 'emoji', value: '🚫' },

  // ============================================================================
  // HOTEL / HOSPITALITY - Room Types/Features
  // ============================================================================
  'standard_rooms': { type: 'emoji', value: '🛏️' },
  'suites': { type: 'emoji', value: '🛋️' },
  'kitchenettes': { type: 'emoji', value: '🍳' },
  'penthouses': { type: 'emoji', value: '🌆' },
  'accessible_rooms': { type: 'emoji', value: '♿' },

  // ============================================================================
  // HOTEL / HOSPITALITY - Energy & Sustainability
  // ============================================================================
  'energy_star': { type: 'emoji', value: '⭐' },
  'leed_certified': { type: 'emoji', value: '🌿' },
  'green_key': { type: 'emoji', value: '🔑' },
  'solar_existing': { type: 'emoji', value: '☀️' },
  'solar_interested': { type: 'emoji', value: '🌞' },
  'no_certifications': { type: 'emoji', value: '📋' },

  // ============================================================================
  // GENERATOR / BACKUP OPTIONS
  // ============================================================================
  'diesel': { type: 'emoji', value: '⛽' },
  'natural_gas': { type: 'emoji', value: '🔥' },
  'dual_fuel': { type: 'emoji', value: '🔄' },
  'propane': { type: 'emoji', value: '🛢️' },
  'battery_backup': { type: 'emoji', value: '🔋' },

  // ============================================================================
  // HOTEL - Laundry Operations (from DB)
  // ============================================================================
  'commercial': { type: 'emoji', value: '🏭' },
  'guest_laundry': { type: 'emoji', value: '👕' },
  'guest': { type: 'emoji', value: '👔' },  // Alternative value for guest laundry
  'commercial_laundry': { type: 'emoji', value: '🧺' },
  'valet': { type: 'emoji', value: '🚚' },  // Outsourced/valet service - truck for pickup
  'outsourced': { type: 'emoji', value: '📦' },  // Alternative value for outsourced laundry

  // ============================================================================
  // HOTEL - Food & Beverage Operations (from DB)
  // ============================================================================
  'breakfast': { type: 'emoji', value: '🥐' },
  'casual_dining': { type: 'emoji', value: '🍽️' },
  'fine_dining': { type: 'emoji', value: '🥂' },
  'bar': { type: 'emoji', value: '🍸' },
  'room_service': { type: 'emoji', value: '🛎️' },
  'banquet': { type: 'emoji', value: '🎉' },
  'coffee_shop': { type: 'emoji', value: '☕' },
  'pool_bar': { type: 'emoji', value: '🏖️' },

  // ============================================================================
  // HOTEL - Meeting Space (from DB) - 'convention' addition only
  // Note: small/medium/large already in SIZE OPTIONS
  // ============================================================================
  'convention': { type: 'emoji', value: '🏛️' },

  // ============================================================================
  // HOTEL - Parking (from DB)
  // ============================================================================
  'surface': { type: 'emoji', value: '🅿️' },
  'structure': { type: 'emoji', value: '🏗️' },

  // ============================================================================
  // HOTEL - Solar Status (from DB)
  // ============================================================================
  'operational': { type: 'emoji', value: '☀️' },
  'not_working': { type: 'emoji', value: '🔧' },
  'under_construction': { type: 'emoji', value: '🚧' },
  'approved': { type: 'emoji', value: '✅' },
  'active': { type: 'emoji', value: '🌟' },
  'exploring': { type: 'emoji', value: '🔍' },
  'sufficient': { type: 'emoji', value: '✅' },

  // ============================================================================
  // HOTEL - EV Charging (from DB)
  // ============================================================================
  'ultra': { type: 'emoji', value: '⚡' },

  // ============================================================================
  // HOTEL - Backup Power Priority (from DB)
  // ============================================================================
  'important': { type: 'emoji', value: '⚠️' },
  'nice_to_have': { type: 'emoji', value: '👍' },
  'has_generator': { type: 'emoji', value: '🔋' },
  'not_priority': { type: 'emoji', value: '👎' },

  // ============================================================================
  // HOTEL - Energy Goals (from DB)
  // ============================================================================
  'reduce_costs': { type: 'emoji', value: '💰' },
  'reduce_demand': { type: 'emoji', value: '📉' },
  'net_zero': { type: 'emoji', value: '🌍' },
  'brand_requirements': { type: 'emoji', value: '🏷️' },
  'green_cert': { type: 'emoji', value: '🌿' },
  'grid_independence': { type: 'emoji', value: '🔌' },
  'demand_response': { type: 'emoji', value: '📊' },
  'tou_optimization': { type: 'emoji', value: '⏰' },

  // ============================================================================
  // HOTEL - Guest Services (from DB)
  // ============================================================================
  'concierge': { type: 'emoji', value: '🛎️' },
  'guest_services': { type: 'emoji', value: '🙋' },
  'bell_service': { type: 'emoji', value: '🧳' },

  // ============================================================================
  // HOTEL - Amenities Extended (from DB)
  // ============================================================================
  'gift_shop': { type: 'emoji', value: '🛍️' },
  'courts': { type: 'emoji', value: '🎾' },

  // ============================================================================
  // GENERAL INTEREST OPTIONS
  // ============================================================================
  'interested': { type: 'emoji', value: '👍' },
  'not_interested': { type: 'emoji', value: '👎' },
  'learn_more': { type: 'emoji', value: '📚' },
  'contact_me': { type: 'emoji', value: '📞' },
  'skip': { type: 'emoji', value: '⏭️' },
  'other': { type: 'emoji', value: '📝' },
  // Note: 'maybe' already defined in YES/NO/MAYBE section with 🤷
  'moderate': { type: 'emoji', value: '➕' },

  // ============================================================================
  // DATA CENTER OPTIONS
  // ============================================================================
  'ai_ml': { type: 'emoji', value: '🤖' },
  'colocation': { type: 'emoji', value: '🏢' },
  'enterprise': { type: 'emoji', value: '🏛️' },
  'enterprise_it': { type: 'emoji', value: '💼' },
  'hyperscale': { type: 'emoji', value: '📈' },
  'edge': { type: 'emoji', value: '📡' },
  'cloud_services': { type: 'emoji', value: '☁️' },
  'gpu_ai': { type: 'emoji', value: '🎮' },
  'supercomputing': { type: 'emoji', value: '🖥️' },
  'liquid_cooling': { type: 'emoji', value: '💧' },
  'liquid_cooled': { type: 'emoji', value: '💧' },
  'liquid_immersion': { type: 'emoji', value: '🌊' },
  'immersion': { type: 'emoji', value: '🌊' },
  'air': { type: 'emoji', value: '💨' },
  'liquid': { type: 'emoji', value: '💧' },
  'hybrid': { type: 'emoji', value: '🔄' },
  'crac': { type: 'emoji', value: '❄️' },
  'crac_air': { type: 'emoji', value: '💨' },
  'crac_chiller': { type: 'emoji', value: '❄️' },
  'in_row': { type: 'emoji', value: '📦' },
  'rear_door': { type: 'emoji', value: '🚪' },
  'free_cooling': { type: 'emoji', value: '🌬️' },
  'ups_ride_through': { type: 'emoji', value: '🔋' },
  'fedramp': { type: 'emoji', value: '🏛️' },
  'hipaa': { type: 'emoji', value: '🏥' },
  'pci_dss': { type: 'emoji', value: '💳' },
  'n': { type: 'emoji', value: '1️⃣' },
  '2n': { type: 'emoji', value: '2️⃣' },
  '2n_plus_1': { type: 'emoji', value: '➕' },

  // ============================================================================
  // HOSPITAL / HEALTHCARE OPTIONS
  // ============================================================================
  'academic': { type: 'emoji', value: '🎓' },
  'community': { type: 'emoji', value: '🏘️' },
  'teaching_hospital': { type: 'emoji', value: '📚' },
  'research': { type: 'emoji', value: '🔬' },
  'outpatient': { type: 'emoji', value: '🚶' },
  'urgent_care': { type: 'emoji', value: '🚑' },
  'medical_research': { type: 'emoji', value: '🧬' },
  'medical_school': { type: 'emoji', value: '🩺' },
  'cafeteria': { type: 'emoji', value: '🍽️' },
  'chp': { type: 'emoji', value: '⚡' },

  // ============================================================================
  // WAREHOUSE / LOGISTICS OPTIONS
  // ============================================================================
  'cold_storage': { type: 'emoji', value: '🧊' },
  'refrigerated': { type: 'emoji', value: '❄️' },
  'climate_controlled': { type: 'emoji', value: '🌡️' },
  'cold': { type: 'emoji', value: '🥶' },
  'cool': { type: 'emoji', value: '❄️' },
  'dry_labs': { type: 'emoji', value: '🔬' },
  'wet_labs': { type: 'emoji', value: '🧪' },
  'cross_dock': { type: 'emoji', value: '🔀' },
  'distribution': { type: 'emoji', value: '📦' },
  'fulfillment': { type: 'emoji', value: '📤' },
  'manufacturing_storage': { type: 'emoji', value: '🏭' },
  'container': { type: 'emoji', value: '📦' },
  'deep_freeze': { type: 'emoji', value: '🧊' },
  'highly_automated': { type: 'emoji', value: '🤖' },

  // ============================================================================
  // MANUFACTURING OPTIONS
  // ============================================================================
  'automotive': { type: 'emoji', value: '🚗' },
  'chemical': { type: 'emoji', value: '⚗️' },
  'pharmaceutical': { type: 'emoji', value: '💊' },
  'electronics': { type: 'emoji', value: '📱' },
  'food_beverage': { type: 'emoji', value: '🍔' },
  'metals': { type: 'emoji', value: '🔩' },
  'plastics': { type: 'emoji', value: '♻️' },
  'assembly': { type: 'emoji', value: '🔧' },
  'cnc_machining': { type: 'emoji', value: '⚙️' },
  'injection_molding': { type: 'emoji', value: '🏭' },
  'extrusion': { type: 'emoji', value: '📏' },
  'stamping': { type: 'emoji', value: '🔨' },
  'welding': { type: 'emoji', value: '🔥' },
  'ovens_furnaces': { type: 'emoji', value: '🔥' },
  'clean_rooms': { type: 'emoji', value: '🧹' },
  '1_shift': { type: 'emoji', value: '☀️' },
  '2_shift': { type: 'emoji', value: '🌗' },
  '2_shift_full': { type: 'emoji', value: '🌗' },
  '3_shift': { type: 'emoji', value: '🌙' },
  'light': { type: 'emoji', value: '🔆' },
  'heavy': { type: 'emoji', value: '🏋️' },
  'very_heavy': { type: 'emoji', value: '💪' },

  // ============================================================================
  // CAR WASH OPTIONS
  // ============================================================================
  'selfservice': { type: 'emoji', value: '🛠️' },
  'self-service': { type: 'emoji', value: '🛠️' },
  'automatic': { type: 'emoji', value: '🤖' },
  'tunnel': { type: 'emoji', value: '🚇' },
  'fullservice': { type: 'emoji', value: '✨' },
  'inbay': { type: 'emoji', value: '🚗' },
  'tommys-express': { type: 'emoji', value: '⚡' },
  'el-car-wash': { type: 'emoji', value: '💧' },

  // ============================================================================
  // EV CHARGING OPTIONS
  // ============================================================================
  'fleet_depot': { type: 'emoji', value: '🚌' },
  'travel_center': { type: 'emoji', value: '🛣️' },
  'destination': { type: 'emoji', value: '📍' },
  'fast_hub': { type: 'emoji', value: '⚡' },
  'small_hub': { type: 'emoji', value: '🔌' },
  'medium_hub': { type: 'emoji', value: '🔌' },
  'large_hub': { type: 'emoji', value: '⚡' },
  'ev_charging_support': { type: 'emoji', value: '🔋' },
  'evCharging': { type: 'emoji', value: '🔌' },

  // ============================================================================
  // GAS STATION / CONVENIENCE OPTIONS
  // ============================================================================
  'convenience': { type: 'emoji', value: '🏪' },
  'travel': { type: 'emoji', value: '🧳' },
  'super': { type: 'emoji', value: '🌟' },
  'mega': { type: 'emoji', value: '🏢' },
  'kiosk': { type: 'emoji', value: '📱' },

  // ============================================================================
  // RETAIL / SHOPPING OPTIONS
  // ============================================================================
  'big_box': { type: 'emoji', value: '📦' },
  'strip_mall': { type: 'emoji', value: '🏬' },
  'neighborhood': { type: 'emoji', value: '🏘️' },
  'regional': { type: 'emoji', value: '🗺️' },
  'specialty': { type: 'emoji', value: '✨' },

  // ============================================================================
  // OFFICE / BUILDING OPTIONS
  // ============================================================================
  'class_a': { type: 'emoji', value: '🏢' },
  'class_b': { type: 'emoji', value: '🏛️' },
  'class_c': { type: 'emoji', value: '🏚️' },
  'low_rise': { type: 'emoji', value: '🏠' },
  'mid_rise': { type: 'emoji', value: '🏢' },
  'high_rise': { type: 'emoji', value: '🏙️' },
  'campus': { type: 'emoji', value: '🏫' },
  'historic': { type: 'emoji', value: '🏛️' },
  'modern': { type: 'emoji', value: '🏗️' },
  'older': { type: 'emoji', value: '🏚️' },
  'new': { type: 'emoji', value: '✨' },

  // ============================================================================
  // COLLEGE / UNIVERSITY OPTIONS
  // ============================================================================
  'research_university': { type: 'emoji', value: '🔬' },
  'liberal_arts': { type: 'emoji', value: '📖' },
  'community_college': { type: 'emoji', value: '🎓' },
  'full_campus': { type: 'emoji', value: '🏫' },
  'research_labs': { type: 'emoji', value: '🧬' },
  'health_center': { type: 'emoji', value: '🏥' },
  'football_stadium': { type: 'emoji', value: '🏈' },
  'indoor_arena': { type: 'emoji', value: '🏟️' },
  'multiple_venues': { type: 'emoji', value: '🎭' },
  'gym_only': { type: 'emoji', value: '💪' },
  'pool_aquatics': { type: 'emoji', value: '🏊' },

  // ============================================================================
  // HOTEL BRAND OPTIONS
  // ============================================================================
  'marriott': { type: 'emoji', value: '🏨' },
  'hilton': { type: 'emoji', value: '🏨' },
  'hyatt': { type: 'emoji', value: '🏨' },
  'best-western': { type: 'emoji', value: '🏨' },
  'holiday-inn': { type: 'emoji', value: '🏨' },
  'chain': { type: 'emoji', value: '🔗' },

  // ============================================================================
  // APARTMENT / RESIDENTIAL OPTIONS
  // ============================================================================
  'single_family': { type: 'emoji', value: '🏠' },
  'individual': { type: 'emoji', value: '🏠' },
  'central': { type: 'emoji', value: '🏢' },
  'central_chiller': { type: 'emoji', value: '❄️' },
  'central_steam': { type: 'emoji', value: '♨️' },
  'electric_chiller': { type: 'emoji', value: '❄️' },
  'district': { type: 'emoji', value: '🏘️' },
  'distributed': { type: 'emoji', value: '🔀' },

  // ============================================================================
  // FARMING / AGRICULTURE OPTIONS
  // ============================================================================
  'greenhouse': { type: 'emoji', value: '🌿' },
  'vertical': { type: 'emoji', value: '🏢' },
  'crop': { type: 'emoji', value: '🌾' },
  'dairy': { type: 'emoji', value: '🐄' },
  'indoor': { type: 'emoji', value: '🏠' },
  'outdoor': { type: 'emoji', value: '🌳' },

  // ============================================================================
  // GENERATOR / POWER OPTIONS
  // ============================================================================
  'diesel_generator': { type: 'emoji', value: '⛽' },
  'natural_gas_generator': { type: 'emoji', value: '🔥' },
  'dual_fuel_generator': { type: 'emoji', value: '🔄' },
  'fuel_cell': { type: 'emoji', value: '🔋' },
  'cogeneration': { type: 'emoji', value: '♻️' },
  'solar_battery': { type: 'emoji', value: '☀️' },
  'solar_generator': { type: 'emoji', value: '☀️' },
  'solar_pv': { type: 'emoji', value: '☀️' },

  // ============================================================================
  // BESS APPLICATION / GOALS OPTIONS
  // ============================================================================
  'peak_shaving': { type: 'emoji', value: '📉' },
  'load_shifting': { type: 'emoji', value: '⏰' },
  'load_balancing': { type: 'emoji', value: '⚖️' },
  'load_leveling': { type: 'emoji', value: '📊' },
  'backup_power': { type: 'emoji', value: '🔋' },
  'energy_arbitrage': { type: 'emoji', value: '💹' },
  'frequency_regulation': { type: 'emoji', value: '📶' },
  'demand_charge': { type: 'emoji', value: '💸' },
  'renewable_integration': { type: 'emoji', value: '🌱' },
  'grid_export': { type: 'emoji', value: '📤' },
  'carbon_reduction': { type: 'emoji', value: '🌍' },
  'cost_reduction': { type: 'emoji', value: '💰' },
  'energy_independence': { type: 'emoji', value: '🔌' },
  'sustainability': { type: 'emoji', value: '🌱' },
  'time_of_use': { type: 'emoji', value: '⏰' },
  'avoid_grid_fees': { type: 'emoji', value: '💵' },
  'stacked': { type: 'emoji', value: '📚' },
  'resilience': { type: 'emoji', value: '🛡️' },
  'reliability': { type: 'emoji', value: '✅' },
  'independence': { type: 'emoji', value: '🔓' },
  'power_quality': { type: 'emoji', value: '⚡' },
  'microgrid': { type: 'emoji', value: '🔲' },
  'full_microgrid': { type: 'emoji', value: '🔲' },

  // ============================================================================
  // GRID STATUS OPTIONS
  // ============================================================================
  'reliable': { type: 'emoji', value: '✅' },
  'unreliable': { type: 'emoji', value: '⚠️' },
  'unreliable_grid': { type: 'emoji', value: '⚠️' },
  'on_grid_reliable': { type: 'emoji', value: '✅' },
  'off_grid': { type: 'emoji', value: '🔌' },
  'limited_grid': { type: 'emoji', value: '⚡' },
  'frequent': { type: 'emoji', value: '🔄' },
  'occasional': { type: 'emoji', value: '📅' },

  // ============================================================================
  // OPERATION MODE OPTIONS
  // ============================================================================
  'manual': { type: 'emoji', value: '🖐️' },
  'auto': { type: 'emoji', value: '🤖' },
  'remote': { type: 'emoji', value: '📡' },
  'local': { type: 'emoji', value: '📍' },
  'standalone': { type: 'emoji', value: '🔲' },
  'advanced': { type: 'emoji', value: '⚙️' },
  'comprehensive': { type: 'emoji', value: '📋' },
  'minimal': { type: 'emoji', value: '📏' },
  'limited': { type: 'emoji', value: '⏸️' },
  'extensive': { type: 'emoji', value: '📈' },
  'significant': { type: 'emoji', value: '⭐' },

  // ============================================================================
  // TIME / SCHEDULE OPTIONS
  // ============================================================================
  'all_day': { type: 'emoji', value: '🌞' },
  '12_hours': { type: 'emoji', value: '🕛' },
  '24_hours': { type: 'emoji', value: '🔄' },
  '2_hours': { type: 'emoji', value: '⏱️' },
  '15_minutes': { type: 'emoji', value: '⏰' },
  'business': { type: 'emoji', value: '💼' },
  'extended': { type: 'emoji', value: '🌙' },

  // ============================================================================
  // SIZE / SCALE OPTIONS (additional)
  // ============================================================================
  'very_large': { type: 'emoji', value: '🏢' },
  'very_high': { type: 'emoji', value: '📈' },
  'high_density': { type: 'emoji', value: '📊' },
  'multiple': { type: 'emoji', value: '🔢' },
  'general': { type: 'emoji', value: '📋' },
  'major': { type: 'emoji', value: '⭐' },
  'mixed': { type: 'emoji', value: '🔀' },
  'tiered': { type: 'emoji', value: '📊' },
  'flat': { type: 'emoji', value: '➡️' },

  // ============================================================================
  // VOLTAGE OPTIONS
  // ============================================================================
  'voltage': { type: 'emoji', value: '⚡' },
  '12.47kv': { type: 'emoji', value: '⚡' },
  '13.8kv': { type: 'emoji', value: '⚡' },

  // ============================================================================
  // FACILITY TYPE OPTIONS
  // ============================================================================
  'reference': { type: 'emoji', value: '📖' },
  'approximately': { type: 'emoji', value: '🔢' },
  'parking': { type: 'emoji', value: '🅿️' },
  'fitness': { type: 'emoji', value: '💪' },
  'pool': { type: 'emoji', value: '🏊' },
  'laundry': { type: 'emoji', value: '🧺' },
  'restaurant': { type: 'emoji', value: '🍽️' },
  'hot': { type: 'emoji', value: '🔥' },
  'water': { type: 'emoji', value: '💧' },
  'electric_gas': { type: 'emoji', value: '⚡' },
  'cost': { type: 'emoji', value: '💰' },
  'both': { type: 'emoji', value: '🔀' },
  'public_service': { type: 'emoji', value: '🏛️' },
  'not_considering': { type: 'emoji', value: '❌' },
};

// ============================================================================
// ICON RESOLVER
// ============================================================================

/**
 * Check if an option value has a mapping in OPTION_VALUE_MAP
 * Used to prioritize emoji icons over Lucide icons from database
 */
export function hasOptionMapping(optionValue: string): boolean {
  return optionValue in OPTION_VALUE_MAP;
}

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
