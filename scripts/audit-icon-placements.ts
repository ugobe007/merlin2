/**
 * Icon Placement Audit Script
 * 
 * Scans all use cases and their custom questions to identify:
 * 1. All field names that need icons (from database)
 * 2. Icons currently mapped in QuestionIconMap
 * 3. Missing icon mappings
 * 4. Available icon files in assets/images
 * 
 * Output: Report of missing icons and recommendations
 */

import { readFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';

// Read QuestionIconMap to see what's currently mapped
const iconMapPath = join(process.cwd(), 'src/components/wizard/QuestionIconMap.ts');
const iconMapContent = readFileSync(iconMapPath, 'utf-8');

// Extract all keys from QUESTION_ICON_MAP
const iconMapKeys = new Set<string>();
const mapMatch = iconMapContent.match(/export const QUESTION_ICON_MAP[^}]*\{([^}]*)\}/s);
if (mapMatch) {
  const mapContent = mapMatch[1];
  // Extract keys (e.g., 'mcsChargers':, 'pump':, etc.)
  const keyMatches = mapContent.matchAll(/'([^']+)'\s*:/g);
  for (const match of keyMatches) {
    iconMapKeys.add(match[1]);
  }
}

console.log(`📊 Found ${iconMapKeys.size} icon mappings in QuestionIconMap.ts\n`);

// Scan available icon files
const imagesDir = join(process.cwd(), 'src/assets/images');
const availableIcons = new Set<string>();
try {
  const files = readdirSync(imagesDir);
  files.forEach(file => {
    if (file.match(/\.(png|jpg|jpeg|svg)$/i)) {
      const nameWithoutExt = file.replace(/\.(png|jpg|jpeg|svg)$/i, '').toLowerCase();
      availableIcons.add(nameWithoutExt);
      // Also add variations
      availableIcons.add(nameWithoutExt.replace(/_/g, ''));
      availableIcons.add(nameWithoutExt.replace(/-/g, ''));
    }
  });
} catch (e) {
  console.error('Could not read images directory:', e);
}

console.log(`📁 Found ${availableIcons.size} icon files in assets/images\n`);

// Read database migration files to find all field names
const migrationsDir = join(process.cwd(), 'database/migrations');
const allFieldNames = new Set<string>();
const fieldNamePatterns = [
  /field_name\s*['"]([^'"]+)['"]/gi,
  /question_key\s*['"]([^'"]+)['"]/gi,
];

try {
  const files = readdirSync(migrationsDir);
  for (const file of files) {
    if (file.endsWith('.sql')) {
      const content = readFileSync(join(migrationsDir, file), 'utf-8');
      for (const pattern of fieldNamePatterns) {
        const matches = content.matchAll(pattern);
        for (const match of matches) {
          if (match[1]) {
            allFieldNames.add(match[1]);
            // Also add snake_case and camelCase variations
            const field = match[1];
            allFieldNames.add(field.toLowerCase());
            allFieldNames.add(field.replace(/_([a-z])/g, (_, l) => l.toUpperCase())); // snake_case -> camelCase
            allFieldNames.add(field.replace(/([A-Z])/g, '_$1').toLowerCase()); // camelCase -> snake_case
          }
        }
      }
    }
  }
} catch (e) {
  console.error('Could not read migrations directory:', e);
}

console.log(`🗄️  Found ${allFieldNames.size} unique field names in database migrations\n`);

// Check Step 3, 4, 5 components for icon usage
const step3Path = join(process.cwd(), 'src/components/wizard/v6/step3/Step3Container.tsx');
const step4Path = join(process.cwd(), 'src/components/wizard/v6/steps/Step4Options.tsx');
const step5Path = join(process.cwd(), 'src/components/wizard/v6/steps/Step5MagicFit.tsx');

const stepFiles = [
  { name: 'Step3Container.tsx', path: step3Path },
  { name: 'Step4Options.tsx', path: step4Path },
  { name: 'Step5MagicFit.tsx', path: step5Path },
];

const stepFieldNames = new Set<string>();
stepFiles.forEach(({ name, path }) => {
  try {
    const content = readFileSync(path, 'utf-8');
    // Find field name patterns in components
    const fieldMatches = content.matchAll(/(field|fieldName|question\.field)[\s:=]+['"]([^'"]+)['"]/gi);
    for (const match of fieldMatches) {
      if (match[2]) stepFieldNames.add(match[2]);
    }
  } catch (e) {
    console.warn(`Could not read ${name}:`, e);
  }
});

console.log(`🔍 Found ${stepFieldNames.size} field references in Step components\n`);

// Common field names that likely need icons (from manual inspection)
const commonFieldsNeedingIcons = new Set([
  // Truck Stop / Travel Center
  'serviceBay', 'serviceBays', 'serviceBayCount',
  'truckWashBay', 'truckWashBays', 'truckWash',
  'mcsChargers', 'mcsChargerCount',
  'dcfcChargers', 'dcfcCount',
  'level2Chargers', 'level2Count', 'l2Chargers',
  'restaurantSeats', 'hasRestaurant',
  'showers', 'hasShowers',
  'laundry', 'hasLaundry',
  'parkingAcres', 'parkingLotAcres',
  
  // Car Wash
  'bayCount', 'tunnelCount',
  'pumpCount', 'pumps',
  'vfdCount', 'vfds',
  'vacuumStations', 'vacuumCount',
  'dryerBlowers', 'dryerCount',
  'waterHeater', 'hasWaterHeater',
  'rooftopSquareFootage', 'roofArea',
  'carportArea', 'carportInterest',
  
  // Hotel
  'roomCount', 'rooms',
  'floors',
  'elevatorCount', 'elevators',
  'parkingSpaces',
  'hasPool', 'poolType',
  'hasSpa', 'spaServices',
  'hasGym', 'gymEquipment',
  'restaurantSeats',
  'conferenceRooms', 'meetingSpace',
  
  // Airport
  'gateCount', 'gates',
  'terminalSqFt', 'terminalSquareFootage',
  'annualPassengers', 'annualPassengersMillions',
  'parkingSpaces',
  'hasHotel', 'hasRestaurants',
  
  // Gas Station
  'dispenserCount', 'dispensers',
  'hasConvenienceStore', 'cStoreSqFt',
  'hasRestaurant', 'restaurantType',
  
  // Manufacturing
  'facilitySqFt', 'squareFootage',
  'operatingHours', 'hoursPerDay',
  'hasLargeMotors', 'motorCount',
  
  // Retail
  'storeSqFt', 'squareFootage',
  'hasWalkInCooler', 'walkInCooler',
  'hasWalkInFreezer', 'walkInFreezer',
  'refrigerationLoad',
  
  // Office
  'officeSqFt', 'buildingSqFt',
  'floorCount', 'floors',
  'elevatorCount',
  'occupancy',
  
  // University
  'enrollment', 'studentCount',
  'buildingSqFt', 'campusSqFt',
  'dormRooms', 'housingCapacity',
  'hasStadium', 'stadiumCapacity',
  
  // Data Center
  'rackCount', 'racks',
  'itLoadKW', 'itLoad',
  'pue', 'currentPUE',
  'hasCooling', 'coolingCapacity',
  
  // Hospital
  'bedCount', 'beds',
  'icuBeds',
  'operatingRooms',
  'hasMri', 'imagingEquipment',
  
  // Common
  'squareFeet', 'squareFootage', 'facilitySize',
  'monthlyElectricBill', 'monthlyBill',
  'peakDemandKW', 'peakDemand',
  'operatingHours', 'hoursPerDay', 'hoursPerWeek',
  'daysPerWeek', 'operatingDays',
]);

// Combine all field names
const allFieldsNeedingIcons = new Set([
  ...allFieldNames,
  ...stepFieldNames,
  ...commonFieldsNeedingIcons,
]);

console.log(`📋 Total unique fields needing icons: ${allFieldsNeedingIcons.size}\n`);

// Find missing icons
const missingIcons: Array<{ field: string; suggestions: string[] }> = [];
const foundIcons: string[] = [];

allFieldsNeedingIcons.forEach(field => {
  const lowerField = field.toLowerCase();
  
  // Check if directly mapped
  if (iconMapKeys.has(lowerField)) {
    foundIcons.push(field);
    return;
  }
  
  // Check if any key contains this field (partial match)
  let found = false;
  for (const key of iconMapKeys) {
    if (key.includes(lowerField) || lowerField.includes(key)) {
      found = true;
      foundIcons.push(field);
      break;
    }
  }
  
  if (!found) {
    // Suggest icon based on field name
    const suggestions: string[] = [];
    
    // Check available icon files
    for (const iconFile of availableIcons) {
      if (lowerField.includes(iconFile) || iconFile.includes(lowerField.split(/_|-/)[0])) {
        suggestions.push(iconFile);
      }
    }
    
    // Pattern-based suggestions
    if (lowerField.includes('charger') || lowerField.includes('ev') || lowerField.includes('dcfc') || lowerField.includes('mcs')) {
      suggestions.push('ev_charger', 'charging-station', 'charger');
    }
    if (lowerField.includes('truck') && lowerField.includes('wash')) {
      suggestions.push('truck_stop', 'loves_truck');
    }
    if (lowerField.includes('pump')) {
      suggestions.push('💧'); // Emoji fallback
    }
    if (lowerField.includes('generator')) {
      suggestions.push('generator_icon');
    }
    if (lowerField.includes('solar') || lowerField.includes('roof')) {
      suggestions.push('sun_icon');
    }
    if (lowerField.includes('bay') || lowerField.includes('service')) {
      suggestions.push('🔧'); // Emoji fallback
    }
    
    missingIcons.push({ field, suggestions: [...new Set(suggestions)].slice(0, 3) });
  }
});

// Generate report
console.log('='.repeat(80));
console.log('ICON PLACEMENT AUDIT REPORT');
console.log('='.repeat(80));
console.log();

console.log(`✅ Fields with icons mapped: ${foundIcons.length}`);
console.log(`❌ Fields missing icons: ${missingIcons.length}`);
console.log();

if (missingIcons.length > 0) {
  console.log('MISSING ICON MAPPINGS:');
  console.log('-'.repeat(80));
  
  // Group by category
  const categories: Record<string, typeof missingIcons> = {
    'EV Charging': [],
    'Truck Stop': [],
    'Car Wash': [],
    'Hotel': [],
    'Facilities': [],
    'Energy Systems': [],
    'Other': [],
  };
  
  missingIcons.forEach(({ field, suggestions }) => {
    const lower = field.toLowerCase();
    if (lower.includes('charger') || lower.includes('ev') || lower.includes('dcfc') || lower.includes('mcs')) {
      categories['EV Charging'].push({ field, suggestions });
    } else if (lower.includes('truck') || lower.includes('travel')) {
      categories['Truck Stop'].push({ field, suggestions });
    } else if (lower.includes('wash') || lower.includes('bay') || lower.includes('pump') || lower.includes('vfd')) {
      categories['Car Wash'].push({ field, suggestions });
    } else if (lower.includes('room') || lower.includes('hotel') || lower.includes('spa') || lower.includes('pool')) {
      categories['Hotel'].push({ field, suggestions });
    } else if (lower.includes('solar') || lower.includes('roof') || lower.includes('battery') || lower.includes('generator')) {
      categories['Energy Systems'].push({ field, suggestions });
    } else if (lower.includes('square') || lower.includes('sqft') || lower.includes('floor') || lower.includes('parking')) {
      categories['Facilities'].push({ field, suggestions });
    } else {
      categories['Other'].push({ field, suggestions });
    }
  });
  
  Object.entries(categories).forEach(([category, fields]) => {
    if (fields.length > 0) {
      console.log(`\n📂 ${category} (${fields.length} missing):`);
      fields.forEach(({ field, suggestions }) => {
        console.log(`   • ${field}`);
        if (suggestions.length > 0) {
          console.log(`     → Suggested: ${suggestions.join(', ')}`);
        } else {
          console.log(`     → No suggestions (needs manual icon)`);
        }
      });
    }
  });
}

console.log();
console.log('='.repeat(80));
console.log('AVAILABLE ICON FILES:');
console.log('-'.repeat(80));
console.log(Array.from(availableIcons).sort().join(', '));

// Generate mapping code suggestions
console.log();
console.log('='.repeat(80));
console.log('RECOMMENDED MAPPINGS TO ADD:');
console.log('='.repeat(80));
console.log();

const topMissing = missingIcons.slice(0, 30); // Top 30 missing
const groupedSuggestions: Record<string, string[]> = {};

topMissing.forEach(({ field, suggestions }) => {
  if (suggestions.length > 0) {
    const icon = suggestions[0];
    if (!groupedSuggestions[icon]) groupedSuggestions[icon] = [];
    groupedSuggestions[icon].push(field);
  }
});

Object.entries(groupedSuggestions).forEach(([icon, fields]) => {
  console.log(`// Using ${icon} for: ${fields.slice(0, 3).join(', ')}`);
  fields.slice(0, 5).forEach(field => {
    console.log(`  '${field}': '${icon}',`);
  });
  console.log();
});

console.log('='.repeat(80));
console.log(`\n✅ Audit complete! Found ${missingIcons.length} fields needing icons.`);