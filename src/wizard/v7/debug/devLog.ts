/**
 * DEV-ONLY LOGGER — Tree-shaken to nothing in production builds.
 * Replaces raw console.log() across V7 wizard files.
 *
 * Usage: import { devLog } from '@/wizard/v7/debug/devLog';
 *        devLog('[V7] Something happened', data);
 *
 * In production (import.meta.env.DEV === false), Vite dead-code eliminates
 * the entire function body, so zero runtime overhead.
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const devLog: (...args: any[]) => void = import.meta.env.DEV
  ? (...args) => console.log(...args)
  : () => {};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const devWarn: (...args: any[]) => void = import.meta.env.DEV
  ? (...args) => console.warn(...args)
  : () => {};
