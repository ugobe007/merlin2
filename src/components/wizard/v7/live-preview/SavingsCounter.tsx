/**
 * Savings Counter Component
 * 
 * Animated counter showing estimated annual savings
 */

import React, { useEffect, useState } from 'react';
import { DollarSign } from 'lucide-react';

interface SavingsCounterProps {
  amount: number;
}

export default function SavingsCounter({ amount }: SavingsCounterProps) {
  const [displayAmount, setDisplayAmount] = useState(0);

  // Animate counter
  useEffect(() => {
    if (amount === 0) {
      setDisplayAmount(0);
      return;
    }

    const duration = 1000; // 1 second
    const steps = 30;
    const increment = amount / steps;
    let current = 0;

    const timer = setInterval(() => {
      current += increment;
      if (current >= amount) {
        setDisplayAmount(amount);
        clearInterval(timer);
      } else {
        setDisplayAmount(Math.round(current));
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, [amount]);

  return (
    <div className="text-center">
      <div className="flex items-center justify-center mb-2">
        <DollarSign className="w-6 h-6 text-green-600" />
        <span className="text-4xl font-bold text-green-900">
          {displayAmount.toLocaleString()}
        </span>
      </div>
      <div className="text-sm text-green-700">per year</div>
    </div>
  );
}
