/**
 * INDUSTRY ADAPTERS — BARREL EXPORT
 *
 * Import this module to register all adapters.
 * Each adapter self-registers via registerAdapter() on import.
 *
 * USAGE:
 *   import '@/wizard/v7/step3/adapters';  // registers all adapters
 *   // OR import specific ones:
 *   import { hotelAdapter } from '@/wizard/v7/step3/adapters/hotel';
 *
 * GOLD-STANDARD (Move 2): hotel, carWash, evCharging
 * MOVE 3: restaurant, office, truckStop/gasStation
 */

// ── Gold-Standard Adapters (Move 2) ──
export { hotelAdapter } from "./hotel";
export { carWashAdapter } from "./carWash";
export { evChargingAdapter } from "./evCharging";

// ── Move 3 Adapters ──
export { restaurantAdapter } from "./restaurant";
export { officeAdapter } from "./office";
export { truckStopAdapter, gasStationAdapter } from "./truckStop";
