# Subtype Mapping Plan - 74 Violations Found

## Overview

The validation script found 74 database subtype values that don't have mappings to TrueQuote Engine subtypes. This document outlines the mapping strategy for each industry.

## Mapping Strategy

### Industries with 'default' subtype only
These industries only have 'default' in TrueQuote Engine, so all database values map to 'default':
- **shopping-center**: All propertyType values → 'default'
- **apartment**: All propertyType values → 'default'
- **government**: All facilityType values → 'default'
- **casino**: All casinoType values → 'default'
- **indoor-farm**: All farmType values → 'default'
- **cold-storage**: All facilityType values → 'default'

### Industries needing intelligent mapping

#### manufacturing (6 violations)
Database values → TrueQuote Engine subtypes:
- 'discrete' → 'lightAssembly' (discrete manufacturing is typically light assembly)
- 'process' → 'processChemical' (process manufacturing)
- 'mixed' → 'other' (mixed manufacturing)
- 'assembly' → 'lightAssembly' (assembly work)
- 'machining' → 'heavyAssembly' (machining is heavy manufacturing)
- 'cleanroom' → 'pharmaceutical' (cleanroom often used for pharma/biotech)

#### ev-charging (5 violations)
Database values → TrueQuote Engine subtypes:
- 'public' → 'small' (public chargers typically smaller)
- 'fleet' → 'medium' (fleet operations medium size)
- 'destination' → 'small' (destination chargers smaller)
- 'corridor' → 'large' (corridor chargers for highways, larger)
- 'mixed' → 'medium' (mixed use, medium size)

#### retail (5 violations)
Database values → TrueQuote Engine subtypes:
- 'big-box' → 'warehouseClub' (large format retail)
- 'department' → 'departmentStore'
- 'specialty' → 'specialtyRetail'
- 'convenience' → 'convenienceStore'
- 'strip-center' → 'convenienceStore' (strip centers often convenience stores)

#### car-wash (3 violations)
Database values → TrueQuote Engine subtypes:
- 'flex-serve' → 'full-service' (flex-serve combines self-service and full-service)
- 'self-serve' → 'self-service'
- 'in-bay' → 'express' (in-bay automatic is express/tunnel style)

#### hospital (3 violations)
Database values → TrueQuote Engine subtypes:
- 'specialty' → 'regional' (specialty hospitals are typically regional)
- 'critical-access' → 'community' (critical access hospitals are small community hospitals)
- 'rehabilitation' → 'clinic' (rehab hospitals are more like clinics)

#### university (6 violations)
Database values → TrueQuote Engine subtypes:
- 'community' → 'communityCollege'
- 'liberal-arts' → 'regionalPublic' (liberal arts colleges typically regional)
- 'state-university' → 'largeState'
- 'private-university' → 'regionalPublic' (private universities typically regional)
- 'research' → 'majorResearch'
- 'technical' → 'regionalPublic' (technical schools typically regional)

#### warehouse (2 violations)
Database values → TrueQuote Engine subtypes:
- 'manufacturing' → 'general' (manufacturing warehouses are general)
- 'cross-dock' → 'distribution' (cross-dock is distribution)

#### agriculture (4 violations)
Database values → TrueQuote Engine subtypes:
- 'dairy' → 'livestock'
- 'orchard' → 'rowCrops' (orchard crops)
- 'vegetable' → 'rowCrops'
- 'mixed' → 'rowCrops' (default to row crops)

#### hotel (2 violations)
Database values → TrueQuote Engine subtypes:
- 'boutique' → 'upscale' (boutique hotels are upscale)
- 'extended-stay' → 'midscale' (extended stay is typically midscale)

## Next Steps

1. Add all mappings to `trueQuoteMapperConfig.ts`
2. Re-run validation to confirm 0 violations
3. Test mappings with sample data
