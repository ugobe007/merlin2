# Equipment Photo Library — Collection Guide

## 📸 Overview

This directory stores real-world equipment photos for use in Merlin quotes, proposals, and the web UI. Photos make quotes more tangible — customers want to *see* what they're buying.

---

## 📁 Directory Structure

```
equipment/photos/
├── bess/           ← Battery containers, racks, installations
├── solar/          ← Solar arrays, panels, mounting systems
├── ev-charger/     ← EV charging stations (L2, DCFC, HPC)
├── inverter/       ← PCS/inverter cabinets
├── transformer/    ← Step-up/step-down transformers
├── generator/      ← Diesel/natural gas generators
├── bms/            ← Battery management system boards
├── wind/           ← Wind turbines
├── switchgear/     ← Switchgear cabinets, breakers
├── enclosure/      ← ESS enclosures, shipping containers
├── monitoring/     ← SCADA dashboards, monitoring screens
├── microgrid/      ← Microgrid installations
└── installations/  ← Complete project photos (multi-equipment)
```

---

## 📋 Photo Specifications

| Property | Recommendation |
|----------|---------------|
| **Format** | JPEG or PNG (JPEG preferred for file size) |
| **Dimensions** | 1200×800 px minimum (landscape orientation) |
| **File Size** | Under 300 KB (compress with TinyPNG or similar) |
| **Naming** | `{category}_{description}_{number}.jpg` |
| **Aspect Ratio** | 3:2 landscape preferred |
| **Background** | Clean, outdoor or industrial setting |

### Naming Examples
```
bess_container_front_01.jpg
bess_rack_interior_01.jpg
solar_ground_mount_01.jpg
solar_rooftop_commercial_01.jpg
ev-charger_dcfc_station_01.jpg
inverter_pcs_cabinet_01.jpg
transformer_padmount_01.jpg
```

---

## 🔍 What to Photograph / Source

### Battery / BESS
- **Container exterior** — Standard 20ft or 40ft ISO container with branding
- **Interior rack** — Battery rack modules inside enclosure
- **Installation** — BESS container deployed next to a facility
- **Brands to look for**: Tesla Megapack, BYD Cube, Fluence, Samsung SDI, CATL

### Solar
- **Ground mount array** — Commercial/utility scale solar farm
- **Rooftop installation** — Commercial rooftop panels
- **Carport/canopy** — Solar carport structure (great for EV combo)
- **Brands**: LONGi, JA Solar, Trina, Canadian Solar

### EV Chargers
- **Level 2 station** — Pedestal charger in parking lot
- **DCFC station** — Fast charger (50-150 kW) with cable
- **HPC station** — High-power charger (250+ kW)
- **Brands**: ChargePoint, ABB Terra, Tritium, Tesla Supercharger

### Inverter / PCS
- **Cabinet exterior** — Outdoor-rated inverter enclosure
- **String inverter** — Wall-mounted unit
- **Central inverter** — Large PCS system
- **Brands**: SMA, SolarEdge, Sungrow, Dynapower

### Transformer
- **Pad-mount** — Green pad-mounted distribution transformer
- **Oil-filled** — Large power transformer
- **Dry-type** — Indoor dry-type transformer

### Generator
- **Enclosed generator** — Container-housed generator set
- **Open-frame** — Open-frame diesel/gas genset on skid
- **Brands**: Caterpillar, Cummins, Generac, Kohler

### Other Equipment
- **BMS**: Control panel or PCB board close-up
- **Switchgear**: Medium-voltage switchgear cabinets
- **Enclosure**: NEMA-rated outdoor enclosures
- **Monitoring**: SCADA dashboard screenshot, monitoring setup

---

## ⚖️ Licensing & Copyright

**IMPORTANT**: Only use images that are properly licensed.

### ✅ Safe Sources
1. **Your own photos** — Projects you've photographed (best!)
2. **Manufacturer press kits** — Many OEMs provide media images
3. **Unsplash** (unsplash.com) — Free commercial use
4. **Pexels** (pexels.com) — Free commercial use
5. **Pixabay** (pixabay.com) — Free commercial use
6. **NREL Image Gallery** (images.nrel.gov) — US government, mostly public domain
7. **DOE Image Library** — US government public domain

### ❌ DO NOT Use
- Google Image Search results (usually copyrighted)
- Stock photos without proper license
- Competitor marketing materials
- Photos with visible people (privacy concerns)
- Photos with other company logos prominently displayed

### License File
When adding photos, create a `LICENSES.md` in the category folder noting the source:
```markdown
## bess_container_front_01.jpg
- Source: Unsplash / @photographer
- License: Unsplash License (free commercial use)
- URL: https://unsplash.com/photos/xxxxx

## bess_rack_interior_01.jpg
- Source: NREL Image Gallery
- License: Public Domain
- NREL ID: 12345
```

---

## 🔗 Quick-Start: Best Free Sources for Each Category

| Equipment | Best Source | Search Terms |
|-----------|-----------|--------------|
| BESS | NREL Images, Unsplash | "battery storage container", "BESS installation" |
| Solar | NREL, Pexels | "solar farm", "commercial solar panels" |
| EV Charger | Unsplash, Pexels | "EV charging station", "electric car charger" |
| Inverter | Manufacturer sites | "solar inverter", "power conversion system" |
| Transformer | Unsplash | "electrical transformer", "power transformer" |
| Generator | Pexels | "diesel generator", "industrial generator" |
| Wind | NREL, Unsplash | "wind turbine", "wind farm" |
| Switchgear | Manufacturer sites | "medium voltage switchgear" |

---

## 🚀 Integration

Once you add photos to these directories, they'll be available in:

1. **Web UI** — Import via `@/assets/equipment/photos/{category}/{filename}`
2. **Word Export** — Referenced via the `equipmentImageLibrary.ts` utility
3. **Quote Modal** — Auto-detected and included in equipment sections

### Import Example
```typescript
import bessPhoto from '@/assets/equipment/photos/bess/bess_container_front_01.jpg';
// Use in <img> tag or ImageRun for docx
```
