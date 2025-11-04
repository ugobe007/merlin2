import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Zap, DollarSign, Newspaper } from 'lucide-react';

interface TickerItem {
  type: 'price' | 'news' | 'funding';
  content: string;
  value?: string;
  change?: number;
  icon: React.ReactNode;
}

const EnergyNewsTicker: React.FC = () => {
  const [currentIndex, setCurrentIndex] = useState(0);

  // Real-time energy data (in production, fetch from API)
  const tickerItems: TickerItem[] = [
    {
      type: 'news',
      content: 'Tesla completes 730 MWh Megapack installation at Moss Landing, CA',
      icon: <Newspaper className="w-4 h-4" />
    },
    {
      type: 'price',
      content: 'Wholesale Electricity (PJM)',
      value: '$45.23/MWh',
      change: -2.3,
      icon: <Zap className="w-4 h-4" />
    },
    {
      type: 'funding',
      content: 'Amazon invests $500M in solar+storage microgrid for data centers',
      value: '$500M',
      icon: <DollarSign className="w-4 h-4" />
    },
    {
      type: 'news',
      content: 'Walmart deploys 350 kWh BESS across 75 stores, cutting peak demand 40%',
      icon: <Newspaper className="w-4 h-4" />
    },
    {
      type: 'price',
      content: 'LFP Battery Cells',
      value: '$145/kWh',
      change: -5.2,
      icon: <DollarSign className="w-4 h-4" />
    },
    {
      type: 'news',
      content: 'California mandates 52 GW of energy storage by 2045',
      icon: <Newspaper className="w-4 h-4" />
    },
    {
      type: 'funding',
      content: 'Duke Energy announces $2.4B hybrid solar+BESS project in North Carolina',
      value: '$2.4B',
      icon: <DollarSign className="w-4 h-4" />
    },
    {
      type: 'news',
      content: 'Hospital system saves $1.2M annually with 500 kWh peak shaving system',
      icon: <Newspaper className="w-4 h-4" />
    },
    {
      type: 'funding',
      content: 'DOE awards $3.5B for domestic BESS manufacturing facilities',
      value: '$3.5B',
      icon: <DollarSign className="w-4 h-4" />
    },
    {
      type: 'news',
      content: 'Texas grid operator approves 15 GW of new battery storage projects',
      icon: <Newspaper className="w-4 h-4" />
    },
    {
      type: 'price',
      content: 'Natural Gas (Henry Hub)',
      value: '$2.87/MMBtu',
      change: 1.5,
      icon: <Zap className="w-4 h-4" />
    },
    {
      type: 'news',
      content: 'Manufacturing plant achieves 60% energy cost reduction with hybrid BESS',
      icon: <Newspaper className="w-4 h-4" />
    },
    {
      type: 'funding',
      content: 'NextEra Energy signs $1.8B contract for 2 GWh storage deployment',
      value: '$1.8B',
      icon: <DollarSign className="w-4 h-4" />
    },
    {
      type: 'news',
      content: 'IRA extends 30% ITC for energy storage through 2032',
      icon: <Newspaper className="w-4 h-4" />
    },
    {
      type: 'news',
      content: 'Hotel chain installs solar+storage, eliminates $800K annual demand charges',
      icon: <Newspaper className="w-4 h-4" />
    },
    {
      type: 'price',
      content: 'PCS Inverters (avg)',
      value: '$180/kW',
      change: -3.1,
      icon: <DollarSign className="w-4 h-4" />
    },
    {
      type: 'funding',
      content: 'Google commits $750M to campus microgrid with 1.5 GWh storage',
      value: '$750M',
      icon: <DollarSign className="w-4 h-4" />
    },
    {
      type: 'news',
      content: 'Cold storage facility cuts electricity costs 55% with BESS arbitrage',
      icon: <Newspaper className="w-4 h-4" />
    },
    {
      type: 'news',
      content: 'FERC Order 2222 opens wholesale markets to distributed storage',
      icon: <Newspaper className="w-4 h-4" />
    },
    {
      type: 'funding',
      content: 'Utility announces $1.2B investment in community solar+storage',
      value: '$1.2B',
      icon: <DollarSign className="w-4 h-4" />
    },
    {
      type: 'news',
      content: 'School district saves $400K/year with 200 kWh backup+peak shaving system',
      icon: <Newspaper className="w-4 h-4" />
    },
    {
      type: 'price',
      content: 'Peak Demand Charges (CA)',
      value: '$18.50/kW',
      change: 0.5,
      icon: <Zap className="w-4 h-4" />
    },
    {
      type: 'news',
      content: 'Data center achieves 99.99% uptime with hybrid solar+BESS+generator',
      icon: <Newspaper className="w-4 h-4" />
    },
    {
      type: 'funding',
      content: 'Agricultural co-op receives $85M for solar+storage across 200 farms',
      value: '$85M',
      icon: <DollarSign className="w-4 h-4" />
    },
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % tickerItems.length);
    }, 8000); // Change every 8 seconds - slower rotation

    return () => clearInterval(interval);
  }, [tickerItems.length]);

  const currentItem = tickerItems[currentIndex];

  const getBackgroundColor = () => {
    switch (currentItem.type) {
      case 'price': return 'from-purple-600 to-purple-700';
      case 'news': return 'from-blue-600 to-blue-700';
      case 'funding': return 'from-amber-600 to-amber-700';
      default: return 'from-gray-600 to-gray-700';
    }
  };

  const getTypeLabel = () => {
    switch (currentItem.type) {
      case 'price': return 'PRICING';
      case 'news': return 'NEWS';
      case 'funding': return 'FUNDING';
      default: return 'INFO';
    }
  };

  return (
    <div className={`bg-gradient-to-r ${getBackgroundColor()} text-white py-3 px-6 rounded-xl shadow-lg`}>
      <div className="flex items-center justify-between gap-4">
        {/* Type Badge */}
        <div className="flex items-center gap-2 min-w-fit">
          <div className="bg-white/20 px-3 py-1 rounded-full text-xs font-bold">
            {getTypeLabel()}
          </div>
        </div>

        {/* Content - Animates in */}
        <div className="flex-1 flex items-center gap-3 animate-fadeIn">
          <div className="flex items-center gap-2">
            {currentItem.icon}
            <span className="font-semibold">{currentItem.content}</span>
          </div>
          
          {currentItem.value && (
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold">{currentItem.value}</span>
              {currentItem.change !== undefined && (
                <div className={`flex items-center gap-1 text-sm ${
                  currentItem.change >= 0 ? 'text-green-300' : 'text-red-300'
                }`}>
                  {currentItem.change >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                  <span className="font-semibold">
                    {currentItem.change >= 0 ? '+' : ''}{currentItem.change}%
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Progress Dots */}
        <div className="flex gap-1 min-w-fit">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className={`w-2 h-2 rounded-full ${
                i === Math.floor(currentIndex / (tickerItems.length / 5))
                  ? 'bg-white'
                  : 'bg-white/30'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default EnergyNewsTicker;
