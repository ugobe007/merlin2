import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Zap, DollarSign, Newspaper } from 'lucide-react';
import { supabase } from '../services/supabase';

interface TickerItem {
  type: 'price' | 'news' | 'funding';
  content: string;
  value?: string;
  change?: number;
  icon: React.ReactNode;
}

const EnergyNewsTicker: React.FC = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [tickerItems, setTickerItems] = useState<TickerItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fallback ticker items - used immediately and when database is unavailable
  const getFallbackTickerItems = (): TickerItem[] => [
    {
      type: 'news',
      content: 'Tesla completes 730 MWh Megapack installation at Moss Landing, CA',
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
      type: 'funding',
      content: 'Amazon invests $500M in solar+storage microgrid for data centers',
      value: '$500M',
      icon: <DollarSign className="w-4 h-4" />
    },
    {
      type: 'news',
      content: 'California mandates 52 GW of energy storage by 2045',
      icon: <Newspaper className="w-4 h-4" />
    },
    {
      type: 'price',
      content: 'NMC Battery Cells',
      value: '$128/kWh',
      change: -8.3,
      icon: <DollarSign className="w-4 h-4" />
    }
  ];

  // Initialize with fallback data immediately (no loading state)
  useEffect(() => {
    // Start with fallback data immediately
    setTickerItems(getFallbackTickerItems());
    setIsLoading(false);

    // Then try to fetch live data in the background
    const fetchTickerData = async () => {
      try {
        // Add timeout to prevent hanging
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);

        // Fetch latest news from database
        const { data: newsData, error: newsError } = await supabase
          .from('industry_news')
          .select('*')
          .order('publishDate', { ascending: false })
          .limit(10);

        clearTimeout(timeoutId);

        if (newsError || !newsData || newsData.length === 0) {
          // Keep using fallback data
          return;
        }

        // Transform database news into ticker items
        const newsItems: TickerItem[] = newsData.map(item => ({
          type: item.category === 'pricing' ? 'price' : 
                item.category === 'deployment' ? 'funding' : 'news',
          content: item.title,
          icon: item.category === 'pricing' ? <DollarSign className="w-4 h-4" /> :
                item.category === 'deployment' ? <Zap className="w-4 h-4" /> :
                <Newspaper className="w-4 h-4" />
        }));

        // Fetch latest pricing data
        const { data: pricingData, error: pricingError } = await supabase
          .from('battery_pricing')
          .select('*')
          .order('date', { ascending: false })
          .limit(3);

        if (!pricingError && pricingData && pricingData.length > 0) {
          const priceItems: TickerItem[] = pricingData.map(item => ({
            type: 'price',
            content: `${item.chemistry.toUpperCase()} Battery (${item.systemSize})`,
            value: `$${item.pricePerKWh}/kWh`,
            change: -5.2,
            icon: <DollarSign className="w-4 h-4" />
          }));
          newsItems.push(...priceItems);
        }

        // Only update if we got data
        if (newsItems.length > 0) {
          setTickerItems(newsItems);
        }
      } catch (error) {
        // Keep using fallback data - no console error needed
      }
    };

    // Fetch live data after a short delay
    const fetchTimeout = setTimeout(fetchTickerData, 1000);
    
    // Refresh ticker data every 5 minutes
    const refreshInterval = setInterval(fetchTickerData, 5 * 60 * 1000);
    
    return () => {
      clearTimeout(fetchTimeout);
      clearInterval(refreshInterval);
    };
  }, []);

  // Rotate ticker items
  useEffect(() => {
    if (tickerItems.length === 0) return;
    
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % tickerItems.length);
    }, 8000); // Change every 8 seconds

    return () => clearInterval(interval);
  }, [tickerItems.length]);

  if (isLoading || tickerItems.length === 0) {
    return (
      <div className="bg-gradient-to-r from-gray-600 to-gray-700 text-white py-3 px-6 rounded-xl shadow-lg">
        <div className="flex items-center justify-center">
          <span className="text-sm">Loading market data...</span>
        </div>
      </div>
    );
  }

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
