/**
 * ZIP CODE TO STATE MAPPING
 * =========================
 * First 3 digits of ZIP → State
 */

export const ZIP_PREFIX_TO_STATE: Record<string, string> = {
  // Nevada
  '889': 'Nevada', '890': 'Nevada', '891': 'Nevada',
  '893': 'Nevada', '894': 'Nevada', '895': 'Nevada',
  '897': 'Nevada', '898': 'Nevada',
  
  // California
  '900': 'California', '901': 'California', '902': 'California',
  '903': 'California', '904': 'California', '905': 'California',
  '906': 'California', '907': 'California', '908': 'California',
  '910': 'California', '911': 'California', '912': 'California',
  '913': 'California', '914': 'California', '915': 'California',
  '916': 'California', '917': 'California', '918': 'California',
  '919': 'California', '920': 'California', '921': 'California',
  '922': 'California', '923': 'California', '924': 'California',
  '925': 'California', '926': 'California', '927': 'California',
  '928': 'California', '930': 'California', '931': 'California',
  '932': 'California', '933': 'California', '934': 'California',
  '935': 'California', '936': 'California', '937': 'California',
  '938': 'California', '939': 'California', '940': 'California',
  '941': 'California', '942': 'California', '943': 'California',
  '944': 'California', '945': 'California', '946': 'California',
  '947': 'California', '948': 'California', '949': 'California',
  '950': 'California', '951': 'California', '952': 'California',
  '953': 'California', '954': 'California', '955': 'California',
  '956': 'California', '957': 'California', '958': 'California',
  '959': 'California', '960': 'California', '961': 'California',
  
  // Arizona
  '850': 'Arizona', '851': 'Arizona', '852': 'Arizona',
  '853': 'Arizona', '855': 'Arizona', '856': 'Arizona',
  '857': 'Arizona', '859': 'Arizona', '860': 'Arizona',
  '863': 'Arizona', '864': 'Arizona', '865': 'Arizona',
  
  // Texas
  '750': 'Texas', '751': 'Texas', '752': 'Texas',
  '753': 'Texas', '754': 'Texas', '755': 'Texas',
  '756': 'Texas', '757': 'Texas', '758': 'Texas',
  '759': 'Texas', '760': 'Texas', '761': 'Texas',
  '762': 'Texas', '763': 'Texas', '764': 'Texas',
  '765': 'Texas', '766': 'Texas', '767': 'Texas',
  '768': 'Texas', '769': 'Texas', '770': 'Texas',
  '771': 'Texas', '772': 'Texas', '773': 'Texas',
  '774': 'Texas', '775': 'Texas', '776': 'Texas',
  '777': 'Texas', '778': 'Texas', '779': 'Texas',
  '780': 'Texas', '781': 'Texas', '782': 'Texas',
  '783': 'Texas', '784': 'Texas', '785': 'Texas',
  '786': 'Texas', '787': 'Texas', '788': 'Texas',
  '789': 'Texas', '790': 'Texas', '791': 'Texas',
  '792': 'Texas', '793': 'Texas', '794': 'Texas',
  '795': 'Texas', '796': 'Texas', '797': 'Texas',
  '798': 'Texas', '799': 'Texas',
  
  // Florida
  '320': 'Florida', '321': 'Florida', '322': 'Florida',
  '323': 'Florida', '324': 'Florida', '325': 'Florida',
  '326': 'Florida', '327': 'Florida', '328': 'Florida',
  '329': 'Florida', '330': 'Florida', '331': 'Florida',
  '332': 'Florida', '333': 'Florida', '334': 'Florida',
  '335': 'Florida', '336': 'Florida', '337': 'Florida',
  '338': 'Florida', '339': 'Florida', '340': 'Florida',
  '341': 'Florida', '342': 'Florida', '344': 'Florida',
  '346': 'Florida', '347': 'Florida', '349': 'Florida',
  
  // New York
  '100': 'New York', '101': 'New York', '102': 'New York',
  '103': 'New York', '104': 'New York', '105': 'New York',
  '106': 'New York', '107': 'New York', '108': 'New York',
  '109': 'New York', '110': 'New York', '111': 'New York',
  '112': 'New York', '113': 'New York', '114': 'New York',
  '115': 'New York', '116': 'New York', '117': 'New York',
  '118': 'New York', '119': 'New York', '120': 'New York',
  '121': 'New York', '122': 'New York', '123': 'New York',
  '124': 'New York', '125': 'New York', '126': 'New York',
  '127': 'New York', '128': 'New York', '129': 'New York',
  '130': 'New York', '131': 'New York', '132': 'New York',
  '133': 'New York', '134': 'New York', '135': 'New York',
  '136': 'New York', '137': 'New York', '138': 'New York',
  '139': 'New York', '140': 'New York', '141': 'New York',
  '142': 'New York', '143': 'New York', '144': 'New York',
  '145': 'New York', '146': 'New York', '147': 'New York',
  '148': 'New York', '149': 'New York',
  
  // Add more states as needed...
};

export function getStateFromZip(zip: string): string | null {
  const prefix3 = zip.replace(/\D/g, '').substring(0, 3);
  return ZIP_PREFIX_TO_STATE[prefix3] || null;
}
