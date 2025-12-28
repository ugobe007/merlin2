/**
 * Constants Module - Database-Backed Constants
 * =============================================
 * 
 * Exports calculation constants service.
 * All constants come from the database (calculation_constants table)
 * to maintain SSOT and allow updates without code deployment.
 */

export {
  getConstant,
  getAllConstants,
  setConstant,
  type CalculationConstant
} from './calculationConstantsService';

