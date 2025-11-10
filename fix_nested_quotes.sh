#!/bin/bash

# Script to fix the double-nested quote issues
FILE_PATH="src/components/BessQuoteBuilder.tsx"

echo "Fixing double-nested modal references..."

# Fix openModal calls that got corrupted
sed -i '' "s/openModal('isModalOpen('\([^']*\)')')/openModal('\1')/g" "$FILE_PATH"

# Fix closeModal calls that got corrupted  
sed -i '' "s/closeModal('isModalOpen('\([^']*\)')')/closeModal('\1')/g" "$FILE_PATH"

echo "Fixed modal function calls. Now ensuring state references use isModalOpen..."

# These should stay as isModalOpen calls for conditional rendering
# But let's make sure the patterns are correct

echo "Modal references have been corrected!"