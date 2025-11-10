#!/bin/bash
# Script to find brace imbalance in TypeScript file

balance=0
line_num=0

while IFS= read -r line; do
    line_num=$((line_num + 1))
    
    # Count opening braces
    open_count=$(echo "$line" | grep -o '{' | wc -l)
    # Count closing braces  
    close_count=$(echo "$line" | grep -o '}' | wc -l)
    
    balance=$((balance + open_count - close_count))
    
    if [ $balance -lt 0 ]; then
        echo "ERROR: Too many closing braces at line $line_num: $line"
        echo "Balance: $balance"
        break
    fi
    
    if [ $open_count -gt 0 ] || [ $close_count -gt 0 ]; then
        echo "Line $line_num: +$open_count -$close_count = $balance | $line"
    fi
done < src/components/BessQuoteBuilder.tsx

echo "Final balance: $balance"