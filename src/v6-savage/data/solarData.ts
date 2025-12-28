export interface StateSolarData {
  sunHours: number;
  rating: 'Excellent' | 'Very Good' | 'Good' | 'Moderate' | 'Limited';
}

export const SOLAR_DATA: Record<string, StateSolarData> = {
  'Nevada': { sunHours: 6.4, rating: 'Excellent' },
  'Arizona': { sunHours: 6.5, rating: 'Excellent' },
  'California': { sunHours: 5.8, rating: 'Excellent' },
  'New Mexico': { sunHours: 6.2, rating: 'Excellent' },
  'Utah': { sunHours: 5.8, rating: 'Excellent' },
  'Colorado': { sunHours: 5.5, rating: 'Excellent' },
  'Texas': { sunHours: 5.3, rating: 'Very Good' },
  'Florida': { sunHours: 5.2, rating: 'Very Good' },
  'Hawaii': { sunHours: 5.4, rating: 'Very Good' },
  'Oregon': { sunHours: 3.5, rating: 'Limited' },
  'Washington': { sunHours: 3.3, rating: 'Limited' },
};

export function getSolarRating(state: string): StateSolarData | null {
  return SOLAR_DATA[state] || null;
}
