# Database Field Name Reference - Complete Mapping

## ✅ CORRECT FIELD NAMES (Use These in Code!)

| Use Case | Database field_name | Current Code Lookup | Status |
|----------|-------------------|---------------------|---------|
| **Hotel** | `roomCount` | `numberOfRooms \|\| numRooms` | ❌ FIXED |
| **Car Wash** | `bayCount` | `num_bays \|\| numBays` | ❌ FIXED |
| **Warehouse** | `warehouseSqFt` | `facility_size` | ❌ NEEDS FIX |
| **Apartment** | `unitCount` | `numUnits` | ❌ NEEDS FIX |
| **Gas Station** | `dispenserCount` | ??? | ⚠️ CHECK |
| **Hospital** | `bedCount` | `bedCount` | ✅ CORRECT |
| **Data Center** | `itLoadKW`, `rackCount`, `rackDensityKW` | `capacity`, `totalCapacity` | ❌ NEEDS FIX |
| **Indoor Farm** | `growingAreaSqFt` | `cultivationArea \|\| growing_area` | ❌ NEEDS FIX |

---

## Primary Calculation Fields by Template

### 1. Hotel (`hotel`)
- **Primary**: `roomCount` (number, default 150, range 10-1000)
- **Secondary**: `squareFeet` (optional)
- **Scale Calc**: `roomCount / 100`

### 2. Car Wash (`car-wash`)
- **Primary**: `bayCount` (number, default 4, range 1-20)
- **Scale Calc**: `bayCount` (direct)

### 3. Warehouse (`warehouse` / `logistics`)
- **Primary**: `warehouseSqFt` (number, default 250000)
- **Scale Calc**: `warehouseSqFt / 100000` (per 100k sq ft)

### 4. Apartment (`apartment`)
- **Primary**: `unitCount` (number, default 400, range 20-2000)
- **Scale Calc**: `unitCount / 100` (per 100 units)

### 5. Gas Station (`gas-station`)
- **Primary**: `dispenserCount` (number, default 8, range 2-32)
- **Secondary**: `storeSqFt`, `evChargerCount`
- **Scale Calc**: `dispenserCount` (direct)

### 6. Hospital (`hospital`)
- **Primary**: `bedCount` (number, default 250, range 20-2000)
- **Secondary**: `buildingSqFt`
- **Scale Calc**: `bedCount / 100` (per 100 beds)

### 7. Data Center (`datacenter` / `data-center`)
- **Primary**: `itLoadKW` (number, default 2000, range 100-10000)
- **Alternative**: `rackCount × rackDensityKW`
- **Scale Calc**: `itLoadKW / 1000` (convert kW → MW)

### 8. Indoor Farm (`indoor-farm`)
- **Primary**: `growingAreaSqFt` (number, default 50000)
- **Secondary**: `growingLevels`, `ledWattagePerSqFt`
- **Scale Calc**: `(growingAreaSqFt × ledWattagePerSqFt) / 1000000` (W → MW)

---

## Complete Switch Statement (CORRECT VERSION)

```typescript
switch (selectedTemplate) {
  case 'hotel':
    const hotelRooms = parseInt(useCaseData.roomCount) || 100;
    scale = hotelRooms / 100; // Scale: per 100 rooms
    console.log(`🏨 [Hotel] ${hotelRooms} rooms → scale ${scale}`);
    break;
    
  case 'car-wash':
    scale = parseInt(useCaseData.bayCount) || 3;
    console.log(`🚗 [Car Wash] ${scale} bays`);
    break;
    
  case 'hospital':
    const beds = parseInt(useCaseData.bedCount) || 200;
    scale = beds / 100; // Scale: per 100 beds
    console.log(`🏥 [Hospital] ${beds} beds → scale ${scale}`);
    break;
    
  case 'apartment':
    const units = parseInt(useCaseData.unitCount) || 100;
    scale = units / 100; // Scale: per 100 units
    console.log(`🏢 [Apartment] ${units} units → scale ${scale}`);
    break;
    
  case 'warehouse':
  case 'logistics':
    const warehouseSqFt = parseInt(useCaseData.warehouseSqFt) || 250000;
    scale = warehouseSqFt / 100000; // Scale: per 100k sq ft
    console.log(`📦 [Warehouse] ${warehouseSqFt} sq ft → scale ${scale}`);
    break;
    
  case 'gas-station':
    scale = parseInt(useCaseData.dispenserCount) || 8;
    console.log(`⛽ [Gas Station] ${scale} dispensers`);
    break;
    
  case 'datacenter':
  case 'data-center':
    const itLoadKW = parseInt(useCaseData.itLoadKW) || 0;
    const rackCount = parseInt(useCaseData.rackCount) || 0;
    const rackDensityKW = parseFloat(useCaseData.rackDensityKW) || 8;
    
    if (itLoadKW > 0) {
      scale = itLoadKW / 1000; // Convert kW to MW
    } else if (rackCount > 0) {
      scale = (rackCount * rackDensityKW) / 1000; // Racks × density → MW
    } else {
      scale = 2; // Default 2 MW datacenter
    }
    console.log(`🖥️ [Data Center] ${itLoadKW}kW or ${rackCount}×${rackDensityKW}kW racks → ${scale}MW`);
    break;
    
  case 'indoor-farm':
    const growingAreaSqFt = parseInt(useCaseData.growingAreaSqFt) || 50000;
    const ledWattagePerSqFt = parseFloat(useCaseData.ledWattagePerSqFt) || 40;
    scale = (growingAreaSqFt * ledWattagePerSqFt) / 1000000; // W → MW
    console.log(`🌱 [Indoor Farm] ${growingAreaSqFt} sq ft × ${ledWattagePerSqFt}W → ${scale}MW`);
    break;
    
  case 'college':
    scale = parseInt(useCaseData.enrollment) || 5000;
    scale = scale / 1000; // Per 1000 students
    console.log(`🎓 [College] ${scale * 1000} students → scale ${scale}`);
    break;
    
  case 'airport':
    scale = parseInt(useCaseData.annual_passengers) || 5; // Million passengers
    console.log(`✈️ [Airport] ${scale}M passengers`);
    break;
    
  case 'manufacturing':
    scale = parseInt(useCaseData.numLines) || parseInt(useCaseData.production_lines) || 2;
    console.log(`🏭 [Manufacturing] ${scale} production lines`);
    break;
    
  case 'retail':
    scale = parseInt(useCaseData.store_size) || 50; // Thousand sq ft
    scale = scale / 10; // Per 10k sq ft
    console.log(`🛍️ [Retail] ${scale * 10}k sq ft → scale ${scale}`);
    break;
    
  case 'casino':
    scale = parseInt(useCaseData.gaming_floor_size) || 50000;
    scale = scale / 50000; // Per 50k sq ft
    console.log(`🎰 [Casino] ${scale * 50000} sq ft → scale ${scale}`);
    break;
    
  case 'agricultural':
    scale = parseInt(useCaseData.farm_size) || 1000; // Acres
    scale = scale / 1000; // Per 1000 acres
    console.log(`🚜 [Agricultural] ${scale * 1000} acres → scale ${scale}`);
    break;
    
  case 'cold-storage':
    scale = parseInt(useCaseData.storage_volume) || parseInt(useCaseData.capacity) || 50000;
    scale = scale / 50000; // Per 50k cu ft
    console.log(`❄️ [Cold Storage] ${scale * 50000} cu ft → scale ${scale}`);
    break;
    
  case 'microgrid':
    scale = parseInt(useCaseData.numBuildings) || parseInt(useCaseData.homes) || 50;
    scale = scale / 50; // Per 50 buildings
    console.log(`🏘️ [Microgrid] ${scale * 50} buildings → scale ${scale}`);
    break;
    
  default:
    scale = 1;
    console.log(`⚙️ [Default] scale ${scale}`);
}
```

---

## Expected Calculations (Physics Check)

### Hotel: 2000 rooms
- Scale: `2000 / 100 = 20`
- baselineService: `20 × 100 × 2.93 kW/room = 5,860 kW`
- **Result**: `5.86 MW` ✅

### Car Wash: 6 bays
- Scale: `6` (direct)
- baselineService: Database typical_load_kw × 6
- **Expected**: `~0.10-0.15 MW` (depending on database config)

### Hospital: 200 beds
- Scale: `200 / 100 = 2`
- baselineService: `2 × 100 × 5.5 kW/bed = 1,100 kW`
- **Result**: `1.10 MW` ✅

### Apartment: 400 units
- Scale: `400 / 100 = 4`
- baselineService: `4 × 100 × 1.5 kW/unit = 600 kW`
- **Result**: `0.60 MW` ✅

### Data Center: 2000 kW IT load
- Scale: `2000 / 1000 = 2 MW`
- baselineService: Direct use (datacenter scale = capacity)
- **Result**: `2.00 MW` ✅

---

## Testing Script

```bash
# Hotel Test
Input: roomCount = 2000
Expected: 5.86 MW
Console: "🏨 [Hotel] 2000 rooms → scale 20"
Console: "🏨 [Hotel Calculation] Actual: 2000 rooms × 2.93 kW/room = 5.860 MW"

# Car Wash Test
Input: bayCount = 6
Expected: ~0.12 MW
Console: "🚗 [Car Wash] 6 bays"

# Apartment Test
Input: unitCount = 400
Expected: 0.60 MW
Console: "🏢 [Apartment] 400 units → scale 4"
```
