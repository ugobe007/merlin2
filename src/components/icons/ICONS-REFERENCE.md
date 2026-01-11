# Merlin Icons Complete Reference

## 🚗 Car Wash Facility Types
| Icon | Name | Usage |
|------|------|-------|
| `<ExpressTunnelIcon />` | Express Tunnel | High-speed conveyor wash |
| `<MiniTunnelIcon />` | Mini Tunnel | Shorter conveyor under 90ft |
| `<InBayAutomaticIcon />` | In-Bay Automatic | Stationary vehicle, moving equipment |
| `<SelfServeBayIcon />` | Self-Serve Bay | Customer wand wash |

## 💧 Water & Heating
| Icon | Name | Usage |
|------|------|-------|
| `<WaterDropIcon />` | Water Drop | General water questions |
| `<ElectricIcon />` | Electric | Electric water heaters |
| `<GasFlameIcon />` | Gas Flame | Natural gas heating |
| `<PropaneIcon />` | Propane | Propane tanks/heating |
| `<SnowflakeIcon />` | Snowflake | Cold water only |

## ⚙️ Pumps & Equipment
| Icon | Name | Usage |
|------|------|-------|
| `<PumpIcon />` | Standard Pump | Basic pump configuration |
| `<HighPressurePumpIcon />` | High Pressure | High-pressure water pumps |
| `<MultiplePumpsIcon />` | Multiple Pumps | Multi-pump systems |
| `<VFDIcon />` | VFD | Variable frequency drive |

## ♻️ Water Reclamation
| Icon | Name | Usage |
|------|------|-------|
| `<NoReclaimIcon />` | No Reclaim | Fresh water only |
| `<PartialReclaimIcon />` | Partial | 30-60% recycled |
| `<FullReclaimIcon />` | Full Reclaim | 70-85% recycled |
| `<AdvancedTreatmentIcon />` | Advanced | 90%+ recycled |

## 💨 Dryers & Blowers
| Icon | Name | Usage |
|------|------|-------|
| `<BlowerIcon />` | Blower | Standard air blowers |
| `<HeatedDryerIcon />` | Heated | Heated air dryers |
| `<HybridDryerIcon />` | Hybrid | Mixed heating system |
| `<NoDryerIcon />` | No Dryer | Air dry only |

## 🌀 Vacuum Systems
| Icon | Name | Usage |
|------|------|-------|
| `<VacuumIcon />` | Vacuum | Free-standing stations |
| `<CentralVacuumIcon />` | Central Vacuum | Industrial turbine system |

## ☀️ Solar & Energy
| Icon | Name | Usage |
|------|------|-------|
| `<SolarPanelIcon />` | Solar Panel | Solar installations |
| `<RoofIcon />` | Roof | Roof area questions |
| `<CarportIcon />` | Carport | Solar carport structures |
| `<BatteryIcon />` | Battery | Energy storage systems |

## ⚡ EV Charging
| Icon | Name | Usage |
|------|------|-------|
| `<EVChargerIcon />` | EV Charger | Generic EV charging |
| `<Level2ChargerIcon />` | Level 2 | 7-19 kW chargers |
| `<DCFastChargerIcon />` | DC Fast | 50-150 kW fast charging |

## 🕐 Operations
| Icon | Name | Usage |
|------|------|-------|
| `<ClockIcon />` | Clock | Operating hours |
| `<CalendarIcon />` | Calendar | Days open per week |
| `<CarIcon />` | Car | Vehicle-related questions |

## 🏢 Facilities
| Icon | Name | Usage |
|------|------|-------|
| `<OfficeIcon />` | Office | Office space |
| `<SecurityCameraIcon />` | Security Camera | Camera systems |
| `<LightBulbIcon />` | Light Bulb | Lighting systems |
| `<SignIcon />` | Sign | Exterior signage |

## 🏟️ Sports Stadium
| Icon | Name | Usage |
|------|------|-------|
| `<StadiumIcon />` | Stadium | Main stadium structure |
| `<ArenaIcon />` | Arena | Indoor arena venues |
| `<FieldIcon />` | Field | Sports field/playing surface |
| `<SeatingIcon />` | Seating | Stadium seating capacity |
| `<ScoreboardIcon />` | Scoreboard | Scoreboard systems |
| `<ConcessionsIcon />` | Concessions | Concession stands |
| `<ParkingLotIcon />` | Parking Lot | Stadium parking areas |
| `<LightingTowerIcon />` | Lighting Tower | Stadium lighting systems |
| `<BroadcastBoothIcon />` | Broadcast Booth | Media/broadcast facilities |
| `<LockerRoomIcon />` | Locker Room | Team locker rooms |

## 📏 Measurements
| Icon | Name | Usage |
|------|------|-------|
| `<AreaIcon />` | Area | Square footage |
| `<RulerIcon />` | Ruler | Measurements |
| `<DollarIcon />` | Dollar | Pricing/costs |

## ✅ Status & Info
| Icon | Name | Usage |
|------|------|-------|
| `<CheckCircleIcon />` | Check | Success/complete |
| `<InfoIcon />` | Info | Information tips |

## 🧙‍♂️ Merlin
| Icon | Name | Usage |
|------|------|-------|
| `<MerlinAvatarIcon />` | Merlin Avatar | Assistant/advisor |

## Basic Usage
```typescript
import { ExpressTunnelIcon, ElectricIcon } from '@/components/icons/MerlinIcons';

<ExpressTunnelIcon className="w-6 h-6 text-purple-400" />
<ElectricIcon className="w-8 h-8 text-yellow-400" />
```

## Size Guide
```typescript
className="w-4 h-4"  // 16px - inline text
className="w-5 h-5"  // 20px - small buttons
className="w-6 h-6"  // 24px - default size
className="w-8 h-8"  // 32px - large buttons
className="w-10 h-10" // 40px - featured
className="w-12 h-12" // 48px - hero icons
```

## Color Guide
```typescript
// Merlin Purple Theme
className="text-purple-400"  // Light purple
className="text-purple-500"  // Medium purple
className="text-purple-600"  // Dark purple

// Semantic Colors
className="text-green-400"   // Success
className="text-red-400"     // Error/danger
className="text-yellow-400"  // Warning
className="text-blue-400"    // Info
className="text-orange-400"  // Flame/heat

// Neutral
className="text-white"       // Primary
className="text-slate-300"   // Secondary
className="text-slate-400"   // Tertiary
className="text-slate-500"   // Quaternary
```

## Animation Examples
```typescript
// Rotate on hover
className="group-hover:rotate-180 transition-transform duration-500"

// Scale on hover
className="group-hover:scale-110 transition-transform"

// Pulse animation
className="animate-pulse"

// Spin (for loading)
className="animate-spin"

// Bounce
className="animate-bounce"
```

## Common Patterns

### Icon Button
```typescript
<button className="p-3 rounded-lg bg-purple-600 hover:bg-purple-500">
  <PumpIcon className="w-6 h-6 text-white" />
</button>
```

### Icon with Label
```typescript
<div className="flex items-center gap-2">
  <ElectricIcon className="w-5 h-5 text-yellow-400" />
  <span className="text-white">Electric Heating</span>
</div>
```

### Icon Card
```typescript
<div className="p-6 rounded-xl bg-slate-800">
  <div className="mb-3">
    <SolarPanelIcon className="w-8 h-8 text-purple-400" />
  </div>
  <h3 className="font-semibold text-white">Solar Panels</h3>
  <p className="text-slate-400 text-sm">Rooftop installation</p>
</div>
```

### Icon with Badge
```typescript
<div className="relative">
  <BlowerIcon className="w-8 h-8 text-purple-400" />
  <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-white text-xs flex items-center justify-center">
    3
  </span>
</div>
```

## All Icons at a Glance
**Total: 60+ custom icons + access to 1,000+ Lucide icons**

Ready to use in your Merlin questionnaires! 🎨
