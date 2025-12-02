/**
 * VERTICAL REDIRECT MODAL
 * =======================
 * 
 * Modal that appears when a user selects an industry vertical
 * that has a dedicated SMB site (e.g., Car Wash → carwashenergy.com)
 * 
 * Features:
 * - Shows vertical-specific branding and benefits
 * - Option to continue on Merlin or go to specialized site
 * - Maintains wizard context if user stays
 * - "Powered by Merlin Smart Energy" badge
 * 
 * @version 1.0 - November 30, 2025
 */

import React, { useEffect, useState } from 'react';
import { X, ExternalLink, ArrowRight, Sparkles, Zap, Shield, Gauge, BadgeCheck } from 'lucide-react';

// ============================================
// TYPES
// ============================================

export interface VerticalInfo {
  slug: string;
  name: string;
  domain: string;
  icon: string;
  tagline: string;
  description: string;
  benefits: string[];
  heroColor: string; // Tailwind color class
  logo?: string;
}

interface VerticalRedirectModalProps {
  isOpen: boolean;
  onClose: () => void;
  vertical: VerticalInfo | null;
  onContinueHere: () => void;
  onGoToVertical: (url: string) => void;
  wizardContext?: {
    zipCode?: string;
    useCase?: string;
    storageMW?: number;
    solarMW?: number;
  };
}

// ============================================
// VERTICAL CONFIGURATIONS
// ============================================

export const VERTICAL_SITES: Record<string, VerticalInfo> = {
  'car-wash': {
    slug: 'car-wash',
    name: 'Car Wash Energy',
    domain: 'carwashenergy.com',
    icon: '🚗',
    tagline: 'Energy Solutions for Car Wash Operators',
    description: 'Specialized battery storage designed specifically for car wash operations - reduce demand charges by 40% and never miss a wash cycle.',
    benefits: [
      'Car wash-specific load profiles',
      'Tunnel equipment power optimization',
      'Demand charge reduction calculators',
      'Industry-specific ROI models',
      'Direct equipment partner connections'
    ],
    heroColor: 'from-blue-500 to-cyan-600'
  },
  'laundromat': {
    slug: 'laundromat',
    name: 'Laundromat Energy',
    domain: 'laundromatanergy.com',
    icon: '🧺',
    tagline: 'Power Solutions for Laundromats',
    description: 'Optimized energy management for coin-op and commercial laundry facilities - cut utility bills by 30%.',
    benefits: [
      'Washer/dryer load balancing',
      'Peak demand smoothing',
      'Hot water energy recovery',
      'Multi-location management',
      'CLA member discounts'
    ],
    heroColor: 'from-purple-500 to-pink-600'
  },
  'restaurant': {
    slug: 'restaurant',
    name: 'Restaurant Energy',
    domain: 'restaurantenergy.com',
    icon: '🍽️',
    tagline: 'Energy Management for Food Service',
    description: 'Keep your kitchen running smoothly with smart energy storage - protect equipment and reduce costs.',
    benefits: [
      'Kitchen equipment protection',
      'Refrigeration backup power',
      'Peak hour load shifting',
      'POS system uptime guarantee',
      'NRA partnership benefits'
    ],
    heroColor: 'from-orange-500 to-red-600'
  },
  'hotel': {
    slug: 'hotel',
    name: 'Hotel Energy',
    domain: 'hotelenergy.com',
    icon: '🏨',
    tagline: 'Hospitality Energy Solutions',
    description: 'Never let a power outage impact guest experience - reliable backup and reduced operating costs.',
    benefits: [
      'Guest experience protection',
      'HVAC load optimization',
      'EV charging integration',
      'Peak shaving for high seasons',
      'AHLA preferred vendor'
    ],
    heroColor: 'from-indigo-500 to-violet-600'
  },
  'gym': {
    slug: 'gym',
    name: 'Fitness Energy',
    domain: 'fitnessenergy.com',
    icon: '💪',
    tagline: 'Power Your Fitness Facility',
    description: 'Keep the lights on and equipment running during peak workout hours - guaranteed uptime.',
    benefits: [
      'Peak class time power assurance',
      'Cardio equipment optimization',
      'HVAC + lighting coordination',
      'Membership retention through reliability',
      'IHRSA member benefits'
    ],
    heroColor: 'from-green-500 to-emerald-600'
  },
  'convenience-store': {
    slug: 'convenience-store',
    name: 'C-Store Energy',
    domain: 'cstoreenergy.com',
    icon: '🏪',
    tagline: 'Energy for Convenience Retail',
    description: 'Protect refrigeration, lighting, and POS systems - 24/7 operation demands 24/7 power reliability.',
    benefits: [
      'Refrigeration backup priority',
      'ATM/POS uptime guarantee',
      'Fuel pump power protection',
      'Signage and lighting control',
      'NACS member program'
    ],
    heroColor: 'from-teal-500 to-cyan-600'
  },
  'retail': {
    slug: 'retail',
    name: 'Retail Energy',
    domain: 'retailenergy.com',
    icon: '🛍️',
    tagline: 'Energy Solutions for Retail',
    description: 'Never lose a sale to a power outage - protect POS, lighting, and customer experience.',
    benefits: [
      'POS system backup',
      'Security system power',
      'HVAC optimization',
      'Multi-store management',
      'NRF partnership'
    ],
    heroColor: 'from-pink-500 to-rose-600'
  },
  'medical-clinic': {
    slug: 'medical-clinic',
    name: 'MedClinic Energy',
    domain: 'medclincenergy.com',
    icon: '🏥',
    tagline: 'Reliable Power for Healthcare',
    description: 'Life-critical power reliability for medical facilities - HIPAA-compliant energy solutions.',
    benefits: [
      'Medical equipment protection',
      'Vaccine refrigeration backup',
      'EMR system uptime',
      'Patient safety compliance',
      'Healthcare codes expertise'
    ],
    heroColor: 'from-red-500 to-rose-600'
  }
};

/**
 * Get vertical info by use case slug
 */
export function getVerticalBySlug(slug: string): VerticalInfo | null {
  return VERTICAL_SITES[slug] || null;
}

/**
 * Check if use case has a dedicated vertical site
 */
export function hasVerticalSite(slug: string): boolean {
  return slug in VERTICAL_SITES;
}

// ============================================
// COMPONENT
// ============================================

const VerticalRedirectModal: React.FC<VerticalRedirectModalProps> = ({
  isOpen,
  onClose,
  vertical,
  onContinueHere,
  onGoToVertical,
  wizardContext
}) => {
  const [isAnimating, setIsAnimating] = useState(false);
  
  useEffect(() => {
    if (isOpen) {
      setIsAnimating(true);
    }
  }, [isOpen]);
  
  if (!isOpen || !vertical) return null;
  
  // Build redirect URL with context
  const buildRedirectUrl = () => {
    const baseUrl = `https://${vertical.domain}`;
    const params = new URLSearchParams();
    
    if (wizardContext?.zipCode) params.set('zip', wizardContext.zipCode);
    if (wizardContext?.storageMW) params.set('mw', wizardContext.storageMW.toString());
    if (wizardContext?.solarMW) params.set('solar', wizardContext.solarMW.toString());
    params.set('ref', 'merlin');
    
    const queryString = params.toString();
    return queryString ? `${baseUrl}?${queryString}` : baseUrl;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className={`
        relative bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden
        transform transition-all duration-300 
        ${isAnimating ? 'scale-100 opacity-100' : 'scale-95 opacity-0'}
      `}>
        {/* Hero Section */}
        <div className={`bg-gradient-to-r ${vertical.heroColor} p-8 text-white relative overflow-hidden`}>
          {/* Background pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-4 right-4 text-[100px]">{vertical.icon}</div>
          </div>
          
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          
          {/* Content */}
          <div className="relative z-10">
            <div className="text-6xl mb-4">{vertical.icon}</div>
            <h2 className="text-3xl font-bold mb-2">{vertical.name}</h2>
            <p className="text-white/90 text-lg">{vertical.tagline}</p>
          </div>
        </div>
        
        {/* Body */}
        <div className="p-6">
          <p className="text-gray-700 mb-6">
            {vertical.description}
          </p>
          
          {/* Benefits */}
          <div className="bg-gray-50 rounded-xl p-4 mb-6">
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-500" />
              Specialized Features
            </h3>
            <ul className="space-y-2">
              {vertical.benefits.map((benefit, i) => (
                <li key={i} className="flex items-center gap-2 text-sm text-gray-700">
                  <BadgeCheck className="w-4 h-4 text-green-500 flex-shrink-0" />
                  {benefit}
                </li>
              ))}
            </ul>
          </div>
          
          {/* Powered by Merlin badge */}
          <div className="flex items-center justify-center gap-2 text-sm text-gray-500 mb-6 py-2 border-y border-gray-100">
            <Shield className="w-4 h-4 text-purple-500" />
            <span>Powered by <strong className="text-purple-600">Merlin Smart Energy</strong></span>
          </div>
          
          {/* Action Buttons */}
          <div className="space-y-3">
            {/* Primary: Go to vertical site */}
            <button
              onClick={() => onGoToVertical(buildRedirectUrl())}
              className={`
                w-full py-4 px-6 rounded-xl font-semibold text-white
                bg-gradient-to-r ${vertical.heroColor}
                hover:shadow-lg transform hover:-translate-y-0.5 transition-all
                flex items-center justify-center gap-2
              `}
            >
              <span>Visit {vertical.name}</span>
              <ExternalLink className="w-5 h-5" />
            </button>
            
            {/* Secondary: Continue on Merlin */}
            <button
              onClick={onContinueHere}
              className="w-full py-3 px-6 rounded-xl font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
            >
              <span>Continue on Merlin</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
          
          {/* Info text */}
          <p className="text-center text-xs text-gray-400 mt-4">
            Both sites use the same calculations and are backed by Merlin's database.
            <br />
            {vertical.name} offers specialized tools for your industry.
          </p>
        </div>
      </div>
    </div>
  );
};

export default VerticalRedirectModal;
