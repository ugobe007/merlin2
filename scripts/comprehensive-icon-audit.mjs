#!/usr/bin/env node
/**
 * Comprehensive Icon Audit Script
 * 
 * Checks all custom_questions in database vs QuestionIconMap
 * Reports missing icons and suggests mappings
 */

import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';

console.log('🔍 COMPREHENSIVE ICON AUDIT\n');
console.log('='.repeat(80));

// 1. Extract all keys from QuestionIconMap
const iconMapPath = join(process.cwd(), 'src/components/wizard/QuestionIconMap.ts');
const iconMapContent = readFileSync(iconMapPath, 'utf-8');

const mappedKeys = new Set();
// Match keys in QUESTION_ICON_MAP - handle both 'key': and "key": formats
const keyPattern = /['"]([^'"]+)['"]\s*:/g;
let match;
const mapStart = iconMapContent.indexOf('export const QUESTION_ICON_MAP');
const mapEnd = iconMapContent.indexOf('};', mapStart);
const mapSection = iconMapContent.substring(mapStart, mapEnd);

while ((match = keyPattern.exec(mapSection)) !== null) {
  if (match[1] && !match[1].includes('QUESTION_ICON_MAP')) {
    mappedKeys.add(match[1]);
  }
}

console.log(`✅ Found ${mappedKeys.size} icon mappings in QuestionIconMap.ts`);

// 2. Extract field names from all SQL migration files
const migrationsDir = join(process.cwd(), 'database/migrations');
const migrationFiles = readdirSync(migrationsDir).filter(f => f.endsWith('.sql'));

const allFields = new Set();
for (const file of migrationFiles) {
  const content = readFileSync(join(migrationsDir, file), 'utf-8');
  
  // Pattern 1: field_name 'value'
  const pattern1 = /field_name\s+['"]([^'"]+)['"]/gi;
  while ((match = pattern1.exec(content)) !== null) {
    allFields.add(match[1]);
  }
  
  // Pattern 2: 'fieldName' in INSERT statements
  const pattern2 = /INSERT\s+INTO\s+custom_questions[^;]*field_name[^,]*,\s*['"]([^'"]+)['"]/gis;
  while ((match = pattern2.exec(content)) !== null) {
    if (match[1] && !match[1].includes('field_name')) {
      allFields.add(match[1]);
    }
  }
  
  // Pattern 3: VALUES with field_name as second or third parameter
  const valuesPattern = /VALUES\s*\([^)]*['"]([a-zA-Z_][a-zA-Z0-9_]*[a-zA-Z])['"]/gi;
  const valueMatches = content.matchAll(valuesPattern);
  for (const vm of valueMatches) {
    const val = vm[1];
    // Check if it looks like a field name (camelCase or snake_case)
    if (val && (val.match(/^[a-z][a-zA-Z0-9]*$/) || val.match(/^[a-z_]+$/))) {
      // Check context - see if it's near field_name
      const start = Math.max(0, vm.index - 200);
      const context = content.substring(start, vm.index);
      if (context.includes('field_name') || context.includes('question_text')) {
        allFields.add(val);
      }
    }
  }
}

console.log(`📋 Found ${allFields.size} field names in migrations`);

// 3. Check Step 3, 4, 5 components for additional field references
const step3Path = join(process.cwd(), 'src/components/wizard/v6/step3/Step3Container.tsx');
const step4Path = join(process.cwd(), 'src/components/wizard/v6/steps/Step4Options.tsx');
const step5Path = join(process.cwd(), 'src/components/wizard/v6/steps/Step5MagicFit.tsx');

const stepFiles = [
  { name: 'Step3Container', path: step3Path },
  { name: 'Step4Options', path: step4Path },
  { name: 'Step5MagicFit', path: step5Path },
];

stepFiles.forEach(({ name, path }) => {
  try {
    const content = readFileSync(path, 'utf-8');
    // Find field_name references
    const fieldRefs = content.matchAll(/(field_name|fieldName|\.field)\s*[:=]\s*['"]([^'"]+)['"]/gi);
    for (const ref of fieldRefs) {
      if (ref[2]) allFields.add(ref[2]);
    }
  } catch (e) {
    console.warn(`⚠️  Could not read ${name}: ${e.message}`);
  }
});

console.log(`📋 Total unique fields found: ${allFields.size}\n`);

// 4. Find missing icons
const missing = [];
const found = [];

for (const field of allFields) {
  const lower = field.toLowerCase();
  let isMapped = false;
  
  // Direct match
  if (mappedKeys.has(field) || mappedKeys.has(lower)) {
    isMapped = true;
  }
  
  // Check if any mapped key contains this field or vice versa
  if (!isMapped) {
    for (const key of mappedKeys) {
      const keyLower = key.toLowerCase();
      if (lower === keyLower || 
          lower.includes(keyLower) || 
          keyLower.includes(lower) ||
          field.toLowerCase().replace(/[_-]/g, '') === keyLower.replace(/[_-]/g, '')) {
        isMapped = true;
        break;
      }
    }
  }
  
  if (isMapped) {
    found.push(field);
  } else {
    missing.push(field);
  }
}

console.log('='.repeat(80));
console.log(`✅ Fields with icons: ${found.length}`);
console.log(`❌ Fields missing icons: ${missing.length}`);
console.log('='.repeat(80));

if (missing.length > 0) {
  console.log('\n📋 MISSING ICON MAPPINGS:\n');
  
  // Group by category
  const categories = {
    'EV Charging': [],
    'Truck Stop': [],
    'Car Wash': [],
    'Hotel': [],
    'Airport': [],
    'Facilities': [],
    'Energy': [],
    'Other': [],
  };
  
  missing.forEach(field => {
    const lower = field.toLowerCase();
    if (lower.includes('charger') || lower.includes('ev') || lower.includes('dcfc') || lower.includes('mcs') || lower.includes('level2') || lower.includes('l2')) {
      categories['EV Charging'].push(field);
    } else if (lower.includes('truck') || lower.includes('travel') || lower.includes('speedco')) {
      categories['Truck Stop'].push(field);
    } else if (lower.includes('wash') || lower.includes('bay') || lower.includes('pump') || lower.includes('vfd') || lower.includes('vacuum') || lower.includes('dryer')) {
      categories['Car Wash'].push(field);
    } else if (lower.includes('room') || lower.includes('hotel') || lower.includes('spa') || lower.includes('pool') || lower.includes('gym') || lower.includes('amenity')) {
      categories['Hotel'].push(field);
    } else if (lower.includes('gate') || lower.includes('terminal') || lower.includes('passenger') || lower.includes('airport')) {
      categories['Airport'].push(field);
    } else if (lower.includes('solar') || lower.includes('roof') || lower.includes('carport') || lower.includes('battery') || lower.includes('generator') || lower.includes('grid')) {
      categories['Energy'].push(field);
    } else if (lower.includes('square') || lower.includes('sqft') || lower.includes('floor') || lower.includes('parking') || lower.includes('acre') || lower.includes('building')) {
      categories['Facilities'].push(field);
    } else {
      categories['Other'].push(field);
    }
  });
  
  Object.entries(categories).forEach(([cat, fields]) => {
    if (fields.length > 0) {
      console.log(`\n📂 ${cat} (${fields.length}):`);
      fields.slice(0, 20).forEach(f => console.log(`   • ${f}`));
      if (fields.length > 20) console.log(`   ... and ${fields.length - 20} more`);
    }
  });
  
  // Generate suggested mappings
  console.log('\n' + '='.repeat(80));
  console.log('💡 SUGGESTED MAPPINGS TO ADD:');
  console.log('='.repeat(80));
  console.log();
  
  const suggestions = {
    // EV Charging - already have icons, just need to add aliases
    'mcsChargers': "'mcsChargers': { type: 'svg', value: EVChargerIcon, alt: 'MCS Charger' }, // Already mapped",
    'dcfc350': "'dcfc350': { type: 'svg', value: DCFastChargerIcon, alt: 'DC Fast Charger 350kW' }, // Already mapped",
    'level2': "'level2': { type: 'svg', value: Level2ChargerIcon, alt: 'Level 2 Charger' }, // Already mapped",
    
    // Truck Stop - add missing
    'truckWashBayCount': "'truckWashBayCount': '🚚',",
    'speedcoBays': "'speedcoBays': '🔧',",
    
    // Facilities - add area/square footage variations
    'rooftopSquareFootage': "'rooftopSquareFootage': { type: 'svg', value: RoofIcon, alt: 'Rooftop Square Footage' },",
    'totalFacilitySquareFootage': "'totalFacilitySquareFootage': { type: 'svg', value: AreaIcon, alt: 'Total Facility Square Footage' },",
    'terminalSqFt': "'terminalSqFt': { type: 'svg', value: AreaIcon, alt: 'Terminal Square Feet' },",
    'buildingSqFt': "'buildingSqFt': { type: 'svg', value: AreaIcon, alt: 'Building Square Feet' },",
    'officeSqFt': "'officeSqFt': { type: 'svg', value: OfficeIcon, alt: 'Office Square Feet' },",
    'storeSqFt': "'storeSqFt': { type: 'svg', value: AreaIcon, alt: 'Store Square Feet' },",
    'cStoreSqFt': "'cStoreSqFt': { type: 'svg', value: AreaIcon, alt: 'C-Store Square Feet' },",
    
    // Hotel/Amenities
    'elevatorCount': "'elevatorCount': '🛗',",
    'elevators': "'elevators': '🛗',",
    'hasPool': "'hasPool': '🏊',",
    'poolType': "'poolType': '🏊',",
    'hasSpa': "'hasSpa': '💆',",
    'spaServices': "'spaServices': '💆',",
    'hasGym': "'hasGym': '💪',",
    'gymEquipment': "'gymEquipment': '💪',",
    'conferenceRooms': "'conferenceRooms': '🏢',",
    'meetingSpace': "'meetingSpace': '🏢',",
    
    // Airport
    'gateCount': "'gateCount': '🚪',",
    'gates': "'gates': '🚪',",
    'annualPassengers': "'annualPassengers': '✈️',",
    'annualPassengersMillions': "'annualPassengersMillions': '✈️',",
    
    // Operations
    'hoursPerDay': "'hoursPerDay': { type: 'svg', value: ClockIcon, alt: 'Hours Per Day' },",
    'daysPerWeek': "'daysPerWeek': { type: 'svg', value: CalendarIcon, alt: 'Days Per Week' }, // Already mapped",
    'operatingDays': "'operatingDays': { type: 'svg', value: CalendarIcon, alt: 'Operating Days' },",
    
    // Manufacturing/Equipment
    'hasLargeMotors': "'hasLargeMotors': '⚙️',",
    'motorCount': "'motorCount': '⚙️',",
    'hasWalkInCooler': "'hasWalkInCooler': '❄️',",
    'hasWalkInFreezer': "'hasWalkInFreezer': '🧊',",
    'walkInCooler': "'walkInCooler': '❄️',",
    'walkInFreezer': "'walkInFreezer': '🧊',",
    'refrigerationLoad': "'refrigerationLoad': '❄️',",
    
    // Gas Station
    'dispenserCount': "'dispenserCount': '⛽',",
    'dispensers': "'dispensers': '⛽',",
    'hasConvenienceStore': "'hasConvenienceStore': '🏪',",
    'restaurantType': "'restaurantType': '🍽️',",
    'hasRestaurant': "'hasRestaurant': '🍽️',",
    
    // Car Wash Equipment
    'vfdCount': "'vfdCount': '⚡',",
    'vfds': "'vfds': '⚡',",
    'vacuumStations': "'vacuumStations': { type: 'svg', value: VacuumIcon, alt: 'Vacuum Stations' }, // Already in MerlinIcons",
    'vacuumCount': "'vacuumCount': { type: 'svg', value: VacuumIcon, alt: 'Vacuum Count' },",
    'dryerBlowers': "'dryerBlowers': { type: 'svg', value: BlowerIcon, alt: 'Dryer Blowers' }, // Already in MerlinIcons",
    'dryerCount': "'dryerCount': { type: 'svg', value: HeatedDryerIcon, alt: 'Dryer Count' }, // Already in MerlinIcons",
    'waterHeater': "'waterHeater': { type: 'svg', value: GasFlameIcon, alt: 'Water Heater' }, // Already in MerlinIcons",
    'hasWaterHeater': "'hasWaterHeater': { type: 'svg', value: GasFlameIcon, alt: 'Has Water Heater' },",
    'tunnelCount': "'tunnelCount': { type: 'svg', value: ExpressTunnelIcon, alt: 'Tunnel Count' }, // Already in MerlinIcons",
  };
  
  // Show suggestions for missing fields
  missing.slice(0, 30).forEach(field => {
    if (suggestions[field]) {
      console.log(`  ${suggestions[field]}`);
    } else {
      // Generic suggestion based on field name
      const lower = field.toLowerCase();
      if (lower.includes('count')) {
        console.log(`  '${field}': '🔢', // Count field`);
      } else if (lower.includes('has')) {
        console.log(`  '${field}': '✅', // Boolean field`);
      } else {
        console.log(`  '${field}': '❓', // TODO: Add appropriate icon`);
      }
    }
  });
}

console.log('\n' + '='.repeat(80));
console.log('✅ Audit Complete!');
console.log('='.repeat(80));

SCRIPT
node scripts/comprehensive-icon-audit.mjs 2>&1