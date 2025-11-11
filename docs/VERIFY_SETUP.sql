-- Verify all constants are in database
SELECT 
  formula_name,
  category,
  variables->>'value' as value,
  variables->>'unit' as unit,
  industry_standard_reference,
  is_active
FROM calculation_formulas
WHERE is_active = true
ORDER BY category, formula_name;
