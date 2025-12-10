# Use Case Field Name Mapping

**SSOT Reference**: `src/services/useCasePowerCalculations.ts`

This document shows exactly which field names each use case handler accepts in `calculateUseCasePower()`.

## 🎯 Quick Reference: Primary Fields by Use Case

| Use Case | Primary Field | Also Accepts | Required? |
|----------|---------------|--------------|-----------|
| **office** | `squareFeet` | `officeSqFt`, `sqFt` | Yes |
| **hotel** | `roomCount` | `numberOfRooms`, `rooms` | Yes |
| **hospital** | `bedCount` | - | Yes |
| **datacenter** | `itLoadKW` | `rackCount` + `rackDensityKW` | One of |
| **ev-charging** | `level2Count` | `dcFastCount`, `level1Count`, HPC variants | Mix |
| **warehouse** | `squareFeet` | `warehouseSqFt`, `sqFt` | Yes |
| **cold-storage** | `refrigerationLoadKW` | `peakDemandKW`, `storageVolume`, `squareFeet` | One of |
| **retail** | `squareFeet` | `retailSqFt`, `sqFt` | Yes |
| **manufacturing** | `squareFeet` | `facilitySqFt`, `sqFt` | Yes |
| **airport** | `annualPassengers` | `totalPassengers`, `passengers` | Yes |
| **casino** | `gamingFloorSqFt` | `gamingFloorSize`, `gamingSpaceSqFt`, `sqFt` | Yes |
| **car-wash** | `bayCount` | `washBays`, `numBays` | Yes |
| **restaurant** | `squareFeet` | `restaurantSqFt`, `sqFt`, `seats` | One of |

---

## 📋 Detailed Field Mapping by Use Case

### Office (`office`)
```typescript
// Line ~1323 in useCasePowerCalculations.ts
useCaseData.squareFeet || useCaseData.officeSqFt || useCaseData.sqFt
```
- **Primary**: `squareFeet`
- **Fallback**: `officeSqFt`, `sqFt`
- **Default**: 10,000 sqft
- **Formula**: 7 W/sqft (ASHRAE/Energy Star)

### Hotel (`hotel`, `hotel-hospitality`)
```typescript
// Line ~1331 in useCasePowerCalculations.ts
useCaseData.roomCount || useCaseData.numberOfRooms || useCaseData.rooms
```
- **Primary**: `roomCount`
- **Fallback**: `numberOfRooms`, `rooms`
- **Default**: 100 rooms
- **Formula**: 5kW/room (ASHRAE hospitality standards)

### Hospital (`hospital`)
```typescript
// Line ~1349 in useCasePowerCalculations.ts
useCaseData.bedCount
```
- **Primary**: `bedCount`
- **Default**: 200 beds
- **Formula**: 15kW/bed + 2MW base (critical care equipment)

### Data Center (`datacenter`, `data-center`, `edge-data-center`)
```typescript
// Line ~1353-1359 in useCasePowerCalculations.ts
useCaseData.itLoadKW || undefined
useCaseData.rackCount || undefined
useCaseData.rackDensityKW || 8
```
- **Primary**: `itLoadKW` (direct IT power draw)
- **Alternative**: `rackCount` × `rackDensityKW`
- **Default**: 2 MW
- **Formula**: IT Load × 1.5 PUE

### EV Charging (`ev-charging`, `ev-charging-station`, `ev-charging-hub`)
```typescript
// Lines ~1363-1400 in useCasePowerCalculations.ts
// New granular fields:
level2_7kw, level2_11kw, level2_19kw, level2_22kw
dcfc_50kw, dcfc_150kw
hpc_250kw, hpc_350kw

// Legacy fields (all supported):
level1Count, l1Chargers, level1_chargers
level2Count, l2Chargers, level2_chargers, numberOfLevel2Chargers
dcFastCount, dcfcCount, dcfc_chargers, dcFastChargers, numberOfDCFastChargers
hpcCount, hpc_chargers, hpcChargers
```

### Cold Storage (`cold-storage`)
```typescript
// Lines ~1455-1500 in useCasePowerCalculations.ts (UPDATED Dec 9)
// Priority order:
1. useCaseData.peakDemandKW || useCaseData.peakElectricalDemand
2. useCaseData.refrigerationLoadKW || useCaseData.refrigerationLoad
3. useCaseData.storageVolume || useCaseData.coldStorageVolume  // ÷ 30 for sqft
4. useCaseData.squareFeet || useCaseData.sqFt
```
- **BEST**: `peakDemandKW` (direct user input)
- **GOOD**: `refrigerationLoadKW` (× 1.2 for auxiliaries)
- **Fallback**: `storageVolume` (cubic feet ÷ 30)
- **Fallback**: `squareFeet`
- **Default**: 20,000 sqft
- **Formula**: 8 W/sqft (refrigeration + HVAC)

### Warehouse (`warehouse`, `logistics`)
```typescript
// Line ~1450-1452 in useCasePowerCalculations.ts
useCaseData.squareFeet || useCaseData.warehouseSqFt || useCaseData.sqFt
useCaseData.isColdStorage || useCaseData.warehouseType === 'cold-storage'
```
- **Primary**: `squareFeet`
- **Fallback**: `warehouseSqFt`, `sqFt`
- **Flag**: `isColdStorage` or `warehouseType`
- **Default**: 50,000 sqft
- **Formula**: 2 W/sqft (standard) or 8 W/sqft (cold)

### Retail (`retail`, `retail-commercial`)
```typescript
// Line ~1463-1466 in useCasePowerCalculations.ts
useCaseData.squareFeet || useCaseData.retailSqFt || useCaseData.sqFt
```
- **Primary**: `squareFeet`
- **Fallback**: `retailSqFt`, `sqFt`
- **Default**: 5,000 sqft
- **Formula**: 6 W/sqft (CBECS)

### Manufacturing (`manufacturing`, `industrial`)
```typescript
// Line ~1539-1543 in useCasePowerCalculations.ts
useCaseData.squareFeet || useCaseData.facilitySqFt || useCaseData.sqFt
useCaseData.heavyMachinery
```
- **Primary**: `squareFeet`
- **Fallback**: `facilitySqFt`, `sqFt`
- **Modifier**: `heavyMachinery` (× 1.5)
- **Default**: 30,000 sqft
- **Formula**: 15-25 W/sqft

### Airport (`airport`)
```typescript
// Line ~1504-1508 in useCasePowerCalculations.ts
useCaseData.annualPassengers || useCaseData.totalPassengers || useCaseData.passengers
```
- **Primary**: `annualPassengers`
- **Fallback**: `totalPassengers`, `passengers`
- **Default**: 500,000 passengers/year
- **Formula**: 1.5 kW per 1,000 passengers (terminal only)

### Casino (`casino`, `tribal-casino`)
```typescript
// Line ~1487-1491 in useCasePowerCalculations.ts
useCaseData.gamingFloorSqFt || useCaseData.gamingFloorSize || useCaseData.gamingSpaceSqFt || useCaseData.sqFt
useCaseData.roomCount
```
- **Gaming**: `gamingFloorSqFt`, `gamingFloorSize`, `gamingSpaceSqFt`, `sqFt`
- **Hotel Rooms**: `roomCount`
- **Default**: 50,000 sqft gaming
- **Formula**: 25 W/sqft gaming + hotel load

### Car Wash (`car-wash`)
```typescript
// Line ~1433-1437 in useCasePowerCalculations.ts
useCaseData.bayCount || useCaseData.washBays || useCaseData.numBays
useCaseData.bayType || 'automatic'
```
- **Primary**: `bayCount`
- **Fallback**: `washBays`, `numBays`
- **Type**: `bayType` (self-service, automatic, tunnel, full-service)
- **Default**: 4 bays automatic
- **Formula**: 8-50 kW/bay depending on type

### Restaurant (`restaurant`)
```typescript
// Line ~1421-1429 in useCasePowerCalculations.ts
useCaseData.squareFeet || useCaseData.restaurantSqFt || useCaseData.sqFt
useCaseData.seats || useCaseData.seatingCapacity
```
- **Primary**: `squareFeet`
- **Alternative**: `seats` × 15 sqft/seat
- **Fallback**: `restaurantSqFt`, `sqFt`
- **Default**: 3,000 sqft
- **Formula**: 30 W/sqft (high kitchen load)

---

## 🔄 Field Sync: StreamlinedWizard → SSOT

The wizard syncs these fields from `useCaseData` to centralized state:

```typescript
// src/components/wizard/StreamlinedWizard.tsx ~line 570-612

// Rooms (hotels, apartments)
roomCount = data.roomCount || data.numberOfRooms || data.rooms

// Beds (hospitals)
bedCount = data.bedCount || data.beds

// Racks (data centers)
rackCount = data.rackCount || data.racks || data.itLoadKW

// Square feet (general)
squareFeet = data.squareFeet || data.facilitySqFt || data.buildingSqFt

// Bays (car wash)
bayCount = data.washBays || data.bayCount || data.numBays

// Units (apartments)
unitCount = data.unitCount || data.numUnits || data.apartments

// EV Chargers
dcfcCount = data.numberOfDCFastChargers || data.dcfc_chargers || data.dcfcChargers || data.dcFastChargers
level2Count = data.numberOfLevel2Chargers || data.level2_chargers || data.l2Chargers
hpcCount = data.hpc_chargers || data.hpcChargers || data.numHPC
```

---

## ⚠️ Database Field Names (custom_questions table)

Run this query to see actual field names in your database:

```sql
SELECT uc.slug, cq.field_name, cq.question_text
FROM custom_questions cq
JOIN use_cases uc ON cq.use_case_id = uc.id
WHERE uc.is_active = true
ORDER BY uc.slug, cq.display_order;
```

### Known Database ↔ Code Mismatches

| Database Field | Code Accepts | Use Case |
|----------------|--------------|----------|
| `serverRacks` | `rackCount` | datacenter |
| `gamingFloorSqFt` | `gamingFloorSqFt`, `gamingSpaceSqFt` | casino |
| `storageVolume` | `storageVolume` (converts from cu ft) | cold-storage |

---

## 📊 Default Values When Fields Are Empty

| Use Case | Default | Results In |
|----------|---------|------------|
| office | 10,000 sqft | ~0.1 MW |
| hotel | 100 rooms | ~0.5 MW |
| hospital | 200 beds | ~5 MW |
| datacenter | 2 MW | 2 MW |
| cold-storage | 20,000 sqft | ~0.2 MW |
| warehouse | 50,000 sqft | ~0.1 MW |
| airport | 500,000 pax | ~0.75 MW |
| casino | 50,000 sqft gaming | ~1.25 MW |
| car-wash | 4 bays automatic | ~0.12 MW |

---

*Last Updated: December 9, 2025*
*Source: `src/services/useCasePowerCalculations.ts`*
