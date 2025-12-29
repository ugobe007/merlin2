/**
 * MARKET CONDITIONS SERVICE (Phase 2 - MVP)
 * =========================================
 * 
 * Provides industry-typical savings and revenue opportunities.
 * Used for opportunity discovery to show potential (not exact quotes).
 * 
 * Exact calculations happen in Phase 4 after facility details are available.
 */

export interface IndustryOpportunityData {
  solar: {
    typicalSavings?: string; // e.g., "$15,000-$40,000/year"
    message: string;
  };
  battery: {
    typicalSavings?: string; // e.g., "$8,000-$25,000/year"
    message: string;
  };
  evCharging: {
    typicalRevenue?: string; // e.g., "$2,000-$8,000/year per charger"
    message: string;
  };
  generator: {
    message: string;
  };
}

/**
 * Get industry-typical opportunity data
 * These are reference ranges based on industry averages, not user-specific quotes
 */
export function getIndustryOpportunities(
  industry: string,
  state: string,
  gridConnection: 'on-grid' | 'off-grid' | 'limited' | 'unreliable' | 'expensive'
): IndustryOpportunityData {
  const industryLower = industry.toLowerCase();

  // Industry-specific typical savings (reference ranges)
  const industryData: Record<string, IndustryOpportunityData> = {
    'car-wash': {
      solar: {
        typicalSavings: '$10,000-$30,000/year',
        message: 'Solar can offset high daytime energy consumption from pumps and dryers. Typical car washes reduce electricity costs by 60-80% with solar.',
      },
      battery: {
        typicalSavings: '$15,000-$40,000/year',
        message: 'Peak shaving is critical for car washes due to high demand charges. Battery storage can reduce demand charges by 50-70%, often paying for itself in 4-7 years.',
      },
      evCharging: {
        typicalRevenue: '$3,000-$12,000/year per charger',
        message: 'EV charging stations at car washes create additional revenue streams. Customers charge while getting their car washed, generating $0.10-$0.40/kWh revenue.',
      },
      generator: {
        message: 'Backup generators ensure car wash operations continue during outages, preventing revenue loss. Even short outages can cost hundreds in lost revenue.',
      },
    },
    'hotel': {
      solar: {
        typicalSavings: '$20,000-$80,000/year',
        message: 'Hotels have large roof areas ideal for solar installations. Typical savings of 30-50% on electricity costs, with payback periods of 6-10 years.',
      },
      battery: {
        typicalSavings: '$15,000-$50,000/year',
        message: 'Hotels benefit from peak shaving and backup power. Batteries reduce demand charges and ensure guest comfort during outages, protecting brand reputation.',
      },
      evCharging: {
        typicalRevenue: '$5,000-$20,000/year per charger',
        message: 'Hotel guests increasingly expect EV charging. Hotels can charge premium rates ($0.25-$0.50/kWh) or offer as an amenity to attract eco-conscious guests.',
      },
      generator: {
        message: 'Hotels require reliable backup power for guest safety and comfort. Generator systems are essential for maintaining operations during grid outages.',
      },
    },
    'hospital': {
      solar: {
        typicalSavings: '$50,000-$200,000/year',
        message: 'Hospitals have extensive roof and land areas for large solar installations. Significant savings on high electricity consumption from 24/7 operations.',
      },
      battery: {
        typicalSavings: '$30,000-$100,000/year',
        message: 'Critical backup power is essential for hospitals. Battery systems provide immediate backup, reduce demand charges, and ensure life-safety systems remain operational.',
      },
      evCharging: {
        typicalRevenue: '$2,000-$8,000/year per charger',
        message: 'EV charging for staff and visitors supports hospital sustainability goals. Revenue potential is moderate but adds convenience for employees.',
      },
      generator: {
        message: 'Hospitals require redundant backup power systems. Generators are mandated for life-safety equipment and ensure continuous patient care.',
      },
    },
    'data-center': {
      solar: {
        typicalSavings: '$100,000-$500,000/year',
        message: 'Large data centers can host massive solar installations. Energy-intensive operations make solar an attractive option for reducing operational costs.',
      },
      battery: {
        typicalSavings: '$50,000-$200,000/year',
        message: 'Data centers require UPS systems for uninterrupted power. Battery systems provide immediate backup, reduce demand charges, and support grid services revenue.',
      },
      evCharging: {
        typicalRevenue: '$1,000-$5,000/year per charger',
        message: 'EV charging for employees supports corporate sustainability goals. Lower revenue potential but valuable employee amenity.',
      },
      generator: {
        message: 'Data centers require redundant power systems with generators as primary backup. Critical for maintaining uptime SLAs (99.999% availability).',
      },
    },
    'ev-charging': {
      solar: {
        typicalSavings: '$5,000-$25,000/year',
        message: 'Solar can offset electricity costs for EV charging stations. Reduces operational costs and enhances sustainability credentials.',
      },
      battery: {
        typicalSavings: '$10,000-$40,000/year',
        message: 'Battery storage helps manage demand charges from rapid EV charging. Enables faster charging without expensive utility upgrades.',
      },
      evCharging: {
        typicalRevenue: 'N/A - This is your primary business',
        message: 'EV charging is your core business model. Focus on optimizing charging infrastructure and managing electricity costs.',
      },
      generator: {
        message: 'Backup generators ensure charging stations remain operational during outages, maintaining revenue streams.',
      },
    },
  };

  // Get industry-specific data or use defaults
  const data = industryData[industryLower] || {
    solar: {
      typicalSavings: '$10,000-$50,000/year',
      message: 'Solar energy can significantly reduce electricity costs for commercial facilities. Savings vary based on roof area, energy consumption, and local incentives.',
    },
    battery: {
      typicalSavings: '$8,000-$30,000/year',
      message: 'Battery storage helps reduce demand charges and provides backup power. Typical payback periods of 6-10 years depending on utility rates.',
    },
    evCharging: {
      typicalRevenue: '$2,000-$10,000/year per charger',
      message: 'EV charging stations can generate revenue from drivers while you charge. Typical revenue of $0.15-$0.40/kWh, depending on location and competition.',
    },
    generator: {
      message: 'Backup generators ensure business continuity during grid outages, preventing revenue loss and maintaining operations.',
    },
  };

  // Adjust messages based on grid connection
  if (gridConnection === 'off-grid' || gridConnection === 'limited') {
    data.solar.message += ' Especially valuable for off-grid or grid-constrained locations.';
    data.generator.message += ' Essential for locations with limited or no grid connection.';
  } else if (gridConnection === 'unreliable') {
    data.battery.message += ' Critical for unreliable grid conditions to ensure continuous operations.';
    data.generator.message += ' Highly recommended for unreliable grids to prevent revenue loss during outages.';
  } else if (gridConnection === 'expensive') {
    data.solar.message += ' High utility rates make solar more attractive with faster payback periods.';
    data.battery.message += ' High demand charges make battery storage extremely cost-effective.';
  }

  return data;
}


