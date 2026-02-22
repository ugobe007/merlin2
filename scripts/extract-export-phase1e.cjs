#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../src/components/AdvancedQuoteBuilder.tsx');

console.log('🔧 Phase 1E: Extracting export functionality...\n');

// Read the file
const content = fs.readFileSync(filePath, 'utf8');
const lines = content.split('\n');

console.log(`📄 Current file: ${lines.length} lines\n`);

// Part 1: Add imports (after line 78 - after existing RenewablesSection import)
const importInsertLine = 78;
const newImports = [
  'import { useQuoteExport } from "@/hooks/useQuoteExport";',
  'import { QuotePreviewModal } from "./ProQuote/Export/QuotePreviewModal";',
];

// Part 2: Remove export handler function (lines 714-997 = 284 lines)
const exportFunctionStart = 713; // 0-indexed (line 714)
const exportFunctionEnd = 996;   // 0-indexed (line 997)
const exportLinesToRemove = exportFunctionEnd - exportFunctionStart + 1;

// Part 3: Add hook usage (after state declarations around line 150)
// We'll insert after the existing state declarations
const hookInsertLine = 152; // After line 153 (after existing state vars)
const hookUsage = [
  '',
  '  // ═══ Quote Export Hook ═══',
  '  const { exportQuote, isExporting, exportSuccess } = useQuoteExport({',
  '    projectInfo,',
  '    projectName,',
  '    location,',
  '    applicationType,',
  '    useCase,',
  '    storageSizeMW,',
  '    durationHours,',
  '    chemistry,',
  '    roundTripEfficiency,',
  '    systemVoltage,',
  '    dcVoltage,',
  '    inverterType,',
  '    numberOfInverters,',
  '    inverterRating,',
  '    gridConnection,',
  '    solarPVIncluded,',
  '    solarCapacityKW,',
  '    windTurbineIncluded,',
  '    windCapacityKW,',
  '    fuelCellIncluded,',
  '    fuelCellCapacityKW,',
  '    fuelType,',
  '    generatorIncluded,',
  '    generatorCapacityKW,',
  '    generatorFuelTypeSelected,',
  '    utilityRate,',
  '  });',
  '',
];

// Part 4: Remove modal JSX (lines 3899-4807 = 909 lines)
// After removing export function, line numbers shift down by 284
const modalStart = 3899 - exportLinesToRemove - 1; // Adjust for 0-index and previous removal
const modalEnd = 4807 - exportLinesToRemove - 1;
const modalLinesToRemove = modalEnd - modalStart + 1;

// Part 5: Add modal component usage
const modalReplacement = [
  '        {/* Quote Preview Modal */}',
  '        <QuotePreviewModal',
  '          showPreview={showQuotePreview}',
  '          onClose={() => setShowQuotePreview(false)}',
  '          previewFormat={previewFormat}',
  '          setPreviewFormat={setPreviewFormat}',
  '          onExport={exportQuote}',
  '          isExporting={isExporting}',
  '          exportSuccess={exportSuccess}',
  '          projectName={projectName}',
  '          location={location}',
  '          applicationType={applicationType}',
  '          useCase={useCase}',
  '          storageSizeMW={storageSizeMW}',
  '          storageSizeMWh={storageSizeMWh}',
  '          durationHours={durationHours}',
  '          chemistry={chemistry}',
  '          roundTripEfficiency={roundTripEfficiency}',
  '          installationType={installationType}',
  '          gridConnection={gridConnection}',
  '          systemVoltage={systemVoltage}',
  '          dcVoltage={dcVoltage}',
  '          inverterType={inverterType}',
  '          numberOfInverters={numberOfInverters}',
  '          inverterRating={inverterRating}',
  '          inverterEfficiency={inverterEfficiency}',
  '          switchgearType={switchgearType}',
  '          switchgearRating={switchgearRating}',
  '          bmsType={bmsType}',
  '          transformerRequired={transformerRequired}',
  '          transformerRating={transformerRating}',
  '          transformerVoltage={transformerVoltage}',
  '          cyclesPerYear={cyclesPerYear}',
  '          warrantyYears={warrantyYears}',
  '          utilityRate={utilityRate}',
  '          demandCharge={demandCharge}',
  '          solarPVIncluded={solarPVIncluded}',
  '          solarCapacityKW={solarCapacityKW}',
  '          solarPanelType={solarPanelType}',
  '          solarPanelEfficiency={solarPanelEfficiency}',
  '          windTurbineIncluded={windTurbineIncluded}',
  '          windCapacityKW={windCapacityKW}',
  '          windTurbineType={windTurbineType}',
  '          fuelCellIncluded={fuelCellIncluded}',
  '          fuelCellCapacityKW={fuelCellCapacityKW}',
  '          fuelCellType={fuelCellType}',
  '          fuelType={fuelType}',
  '          generatorIncluded={generatorIncluded}',
  '          generatorCapacityKW={generatorCapacityKW}',
  '          generatorFuelTypeSelected={generatorFuelTypeSelected}',
  '          generatorRedundancy={generatorRedundancy}',
  '          localSystemCost={localSystemCost}',
  '        />',
  '',
];

// Build new content
let newLines = [...lines];

// Step 1: Add imports
newLines.splice(importInsertLine, 0, ...newImports);
console.log(`✅ Added 2 imports after line ${importInsertLine + 1}`);

// Step 2: Remove export function
// Account for added imports (2 lines added, so indices shift up by 2)
const adjustedExportStart = exportFunctionStart + newImports.length;
const adjustedExportEnd = exportFunctionEnd + newImports.length;
newLines.splice(adjustedExportStart, exportLinesToRemove);
console.log(`✅ Removed export handler function (lines ${adjustedExportStart + 1}-${adjustedExportEnd + 1}, ${exportLinesToRemove} lines)`);

// Step 3: Add hook usage
// Account for previous changes
const adjustedHookInsert = hookInsertLine + newImports.length - exportLinesToRemove;
newLines.splice(adjustedHookInsert, 0, ...hookUsage);
console.log(`✅ Added hook usage at line ${adjustedHookInsert + 1} (${hookUsage.length} lines)`);

// Step 4: Remove modal JSX
// Account for all previous changes
const adjustedModalStart = modalStart + newImports.length + hookUsage.length;
const adjustedModalEnd = modalEnd + newImports.length + hookUsage.length;
newLines.splice(adjustedModalStart, modalLinesToRemove);
console.log(`✅ Removed modal JSX (lines ${adjustedModalStart + 1}-${adjustedModalEnd + 1}, ${modalLinesToRemove} lines)`);

// Step 5: Add modal component
// Insert at the same position where modal was removed
newLines.splice(adjustedModalStart, 0, ...modalReplacement);
console.log(`✅ Added modal component usage at line ${adjustedModalStart + 1} (${modalReplacement.length} lines)`);

// Calculate final stats
const originalLines = lines.length;
const finalLines = newLines.length;
const linesRemoved = originalLines - finalLines;
const percentReduction = ((linesRemoved / originalLines) * 100).toFixed(1);

console.log(`\n📊 Summary:`);
console.log(`   Original: ${originalLines} lines`);
console.log(`   Final: ${finalLines} lines`);
console.log(`   Removed: ${linesRemoved} lines (${percentReduction}%)`);
console.log(`   Export function: ${exportLinesToRemove} lines → hook usage: ${hookUsage.length} lines`);
console.log(`   Modal JSX: ${modalLinesToRemove} lines → component: ${modalReplacement.length} lines`);

// Write back
fs.writeFileSync(filePath, newLines.join('\n'), 'utf8');
console.log(`\n✅ File updated successfully!`);
console.log(`\n📁 New files created:`);
console.log(`   - src/hooks/useQuoteExport.ts (export logic)`);
console.log(`   - src/components/ProQuote/Export/QuotePreviewModal.tsx (modal component)`);
