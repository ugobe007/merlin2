export const EV_ADOPTION_RATES: Record<string, number> = {
  'California': 18.2,
  'Washington': 12.4,
  'Oregon': 10.8,
  'Colorado': 10.2,
  'Hawaii': 11.5,
  'Nevada': 8.2,
  'Arizona': 7.5,
  'Texas': 4.8,
  'Florida': 5.8,
  'New York': 6.5,
};

export function getEVAdoptionRate(state: string): number {
  return EV_ADOPTION_RATES[state] || 3.0;
}
