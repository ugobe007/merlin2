// ═══════════════════════════════════════════════════════════════════════════════
// ENERGY WIZARD A - STEPS 1, 2 & 3 (Location → Industry → Facility Details)
// Self-contained. On completion, calls:
//   onComplete({ locationData, selectedIndustry, annualBill, formData })
// ═══════════════════════════════════════════════════════════════════════════════
import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Search, MapPin, Zap, Sun, Battery, DollarSign, TrendingUp, Shield, Leaf, ChevronRight, ChevronLeft, ChevronDown, Check, Car, Hotel, Building, Factory, ShoppingCart, Warehouse, Server, Fuel, Coffee, Heart, Star, Target, BarChart3, Calendar, Gauge, BatteryCharging, Settings, Award, CheckCircle2, Loader2, Flame, RotateCcw, Droplets, Wind, ThermometerSun, Clock, CalendarDays, Plug, Info, AlertCircle, Cloud, FileText, AlertTriangle, X, Plus, Users, Globe, Upload } from 'lucide-react';
import { fetchSolarProduction, fetchNASAPower, fetchUtilityRate, fetchZipCoords, fetchUtilityByZip, checkEnergyCommunity, getDataProvenanceBadges } from './DataService';
import { analyzeEpcSitePhoto, readFileAsDataUrl } from './epcSiteAnalysis';
import {
  STATE_CLIMATE, CAR_WASH_CLIMATE_ADJUSTMENTS, getClimateAdjustments, BUSINESS_GAS_PROFILES,
  ITC_RATE, ITC_DOMESTIC_BONUS, EV_CHARGER_CREDIT_RATE, EV_CHARGER_CREDIT_MAX,
  CARPORT_COST_PER_W, ASSUMED_TAX_RATE // FIX SYNC-14: All financial constants from SSOT
} from './merlinConstants';
import MerlinSSOTTracker, { SSOTTriggerButton } from './MerlinSSOTTracker';

// FIX #98: Module-scope constant — avoid re-creating on every fetchLiveData call
const STATE_COORDS = {
  AL:[32.8,-86.8],AK:[64.2,-152.5],AZ:[34.0,-111.1],AR:[35.2,-91.8],CA:[36.8,-119.4],
  CO:[39.1,-105.4],CT:[41.6,-72.7],DE:[38.9,-75.5],FL:[27.8,-81.8],GA:[32.2,-83.4],
  HI:[19.9,-155.6],ID:[44.1,-114.7],IL:[40.3,-89.0],IN:[40.3,-86.1],IA:[42.0,-93.2],
  KS:[38.5,-98.8],KY:[37.7,-84.7],LA:[30.9,-92.3],ME:[45.3,-69.4],MD:[39.0,-76.6],
  MA:[42.4,-71.4],MI:[42.4,-83.5],MN:[46.4,-94.6],MS:[32.7,-89.7],MO:[37.9,-91.8],
  MT:[46.8,-110.4],NE:[41.1,-98.3],NV:[38.8,-116.4],NH:[43.5,-71.6],NJ:[40.1,-74.5],
  NM:[34.8,-106.2],NY:[43.0,-75.0],NC:[35.6,-79.0],ND:[47.5,-100.5],OH:[40.4,-82.9],
  OK:[35.0,-97.1],OR:[43.8,-120.6],PA:[41.2,-77.2],RI:[41.6,-71.5],SC:[33.8,-81.2],
  SD:[43.9,-99.4],TN:[35.5,-86.6],TX:[31.1,-97.6],UT:[39.3,-111.1],VT:[44.6,-72.6],
  VA:[37.8,-78.2],WA:[47.8,-121.5],WV:[38.6,-80.6],WI:[43.8,-88.8],WY:[43.1,-107.6],DC:[38.9,-77.0]
};

// ═══════════════════════════════════════════════════════════════════════════════
// ERROR BOUNDARY - Prevents full application crash from component errors
// Catches JavaScript errors anywhere in child component tree
// ═══════════════════════════════════════════════════════════════════════════════
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo });
    // Log error to console for debugging
    console.error('Energy Wizard Error:', error);
    console.error('Component Stack:', errorInfo?.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl p-8 max-w-lg w-full text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Something went wrong</h2>
            <p className="text-gray-600 mb-6">
              The Energy Wizard encountered an unexpected error. Your data has not been lost.
            </p>
            <div className="space-y-3">
              <button
                onClick={() => window.location.reload()}
                className="w-full px-6 py-3 bg-gradient-to-r from-indigo-500 to-indigo-700 text-white rounded-lg font-semibold hover:from-indigo-600 hover:to-indigo-800 transition-all"
              >
                Reload Application
              </button>
              <button
                onClick={() => this.setState({ hasError: false, error: null, errorInfo: null })}
                className="w-full px-6 py-3 border-2 border-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-all"
              >
                Try to Continue
              </button>
            </div>
            {this.state.error && (
              <details className="mt-6 text-left">
                <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-700">
                  Technical Details
                </summary>
                <pre className="mt-2 p-3 bg-gray-100 rounded text-xs overflow-auto max-h-40">
                  {this.state.error.toString()}
                  {this.state.errorInfo?.componentStack}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

// ============================================
// COMPREHENSIVE US ZIP CODE & UTILITY DATABASE
// ============================================

// ZIP code prefix (first 3 digits) to state mapping - ALL 50 STATES

// ═══════════════════════════════════════════════════════════════════════════════
// DATA & CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════════
const ZIP_PREFIX_TO_STATE = {
  // Alabama 350-369
  '350': 'AL', '351': 'AL', '352': 'AL', '353': 'AL', '354': 'AL', '355': 'AL', '356': 'AL', '357': 'AL', '358': 'AL', '359': 'AL',
  '360': 'AL', '361': 'AL', '362': 'AL', '363': 'AL', '364': 'AL', '365': 'AL', '366': 'AL', '367': 'AL', '368': 'AL', '369': 'AL',
  // Alaska 995-999
  '995': 'AK', '996': 'AK', '997': 'AK', '998': 'AK', '999': 'AK',
  // Arizona 850-865
  '850': 'AZ', '851': 'AZ', '852': 'AZ', '853': 'AZ', '854': 'AZ', '855': 'AZ', '856': 'AZ', '857': 'AZ', '858': 'AZ', '859': 'AZ',
  '860': 'AZ', '861': 'AZ', '862': 'AZ', '863': 'AZ', '864': 'AZ', '865': 'AZ',
  // Arkansas 716-729
  '716': 'AR', '717': 'AR', '718': 'AR', '719': 'AR', '720': 'AR', '721': 'AR', '722': 'AR', '723': 'AR', '724': 'AR',
  '725': 'AR', '726': 'AR', '727': 'AR', '728': 'AR', '729': 'AR',
  // California 900-961
  '900': 'CA', '901': 'CA', '902': 'CA', '903': 'CA', '904': 'CA', '905': 'CA', '906': 'CA', '907': 'CA', '908': 'CA', '909': 'CA',
  '910': 'CA', '911': 'CA', '912': 'CA', '913': 'CA', '914': 'CA', '915': 'CA', '916': 'CA', '917': 'CA', '918': 'CA', '919': 'CA',
  '920': 'CA', '921': 'CA', '922': 'CA', '923': 'CA', '924': 'CA', '925': 'CA', '926': 'CA', '927': 'CA', '928': 'CA', '930': 'CA',
  '931': 'CA', '932': 'CA', '933': 'CA', '934': 'CA', '935': 'CA', '936': 'CA', '937': 'CA', '938': 'CA', '939': 'CA', '940': 'CA',
  '941': 'CA', '942': 'CA', '943': 'CA', '944': 'CA', '945': 'CA', '946': 'CA', '947': 'CA', '948': 'CA', '949': 'CA', '950': 'CA',
  '951': 'CA', '952': 'CA', '953': 'CA', '954': 'CA', '955': 'CA', '956': 'CA', '957': 'CA', '958': 'CA', '959': 'CA', '960': 'CA', '961': 'CA',
  // Colorado 800-816
  '800': 'CO', '801': 'CO', '802': 'CO', '803': 'CO', '804': 'CO', '805': 'CO', '806': 'CO', '807': 'CO', '808': 'CO', '809': 'CO',
  '810': 'CO', '811': 'CO', '812': 'CO', '813': 'CO', '814': 'CO', '815': 'CO', '816': 'CO',
  // Connecticut 060-069
  '060': 'CT', '061': 'CT', '062': 'CT', '063': 'CT', '064': 'CT', '065': 'CT', '066': 'CT', '067': 'CT', '068': 'CT', '069': 'CT',
  // Delaware 197-199
  '197': 'DE', '198': 'DE', '199': 'DE',
  // Washington DC 200-205
  '200': 'DC', '201': 'DC', '202': 'DC', '203': 'DC', '204': 'DC', '205': 'DC',
  // Florida 320-349
  '320': 'FL', '321': 'FL', '322': 'FL', '323': 'FL', '324': 'FL', '325': 'FL', '326': 'FL', '327': 'FL', '328': 'FL', '329': 'FL',
  '330': 'FL', '331': 'FL', '332': 'FL', '333': 'FL', '334': 'FL', '335': 'FL', '336': 'FL', '337': 'FL', '338': 'FL', '339': 'FL',
  '340': 'FL', '341': 'FL', '342': 'FL', '344': 'FL', '346': 'FL', '347': 'FL', '349': 'FL',
  // Georgia 300-319, 398-399
  '300': 'GA', '301': 'GA', '302': 'GA', '303': 'GA', '304': 'GA', '305': 'GA', '306': 'GA', '307': 'GA', '308': 'GA', '309': 'GA',
  '310': 'GA', '311': 'GA', '312': 'GA', '313': 'GA', '314': 'GA', '315': 'GA', '316': 'GA', '317': 'GA', '318': 'GA', '319': 'GA',
  '398': 'GA', '399': 'GA',
  // Hawaii 967-968
  '967': 'HI', '968': 'HI',
  // Idaho 832-838
  '832': 'ID', '833': 'ID', '834': 'ID', '835': 'ID', '836': 'ID', '837': 'ID', '838': 'ID',
  // Illinois 600-629
  '600': 'IL', '601': 'IL', '602': 'IL', '603': 'IL', '604': 'IL', '605': 'IL', '606': 'IL', '607': 'IL', '608': 'IL', '609': 'IL',
  '610': 'IL', '611': 'IL', '612': 'IL', '613': 'IL', '614': 'IL', '615': 'IL', '616': 'IL', '617': 'IL', '618': 'IL', '619': 'IL',
  '620': 'IL', '621': 'IL', '622': 'IL', '623': 'IL', '624': 'IL', '625': 'IL', '626': 'IL', '627': 'IL', '628': 'IL', '629': 'IL',
  // Indiana 460-479
  '460': 'IN', '461': 'IN', '462': 'IN', '463': 'IN', '464': 'IN', '465': 'IN', '466': 'IN', '467': 'IN', '468': 'IN', '469': 'IN',
  '470': 'IN', '471': 'IN', '472': 'IN', '473': 'IN', '474': 'IN', '475': 'IN', '476': 'IN', '477': 'IN', '478': 'IN', '479': 'IN',
  // Iowa 500-528
  '500': 'IA', '501': 'IA', '502': 'IA', '503': 'IA', '504': 'IA', '505': 'IA', '506': 'IA', '507': 'IA', '508': 'IA', '509': 'IA',
  '510': 'IA', '511': 'IA', '512': 'IA', '513': 'IA', '514': 'IA', '515': 'IA', '516': 'IA', '520': 'IA', '521': 'IA', '522': 'IA',
  '523': 'IA', '524': 'IA', '525': 'IA', '526': 'IA', '527': 'IA', '528': 'IA',
  // Kansas 660-679
  '660': 'KS', '661': 'KS', '662': 'KS', '663': 'KS', '664': 'KS', '665': 'KS', '666': 'KS', '667': 'KS', '668': 'KS', '669': 'KS',
  '670': 'KS', '671': 'KS', '672': 'KS', '673': 'KS', '674': 'KS', '675': 'KS', '676': 'KS', '677': 'KS', '678': 'KS', '679': 'KS',
  // Kentucky 400-427
  '400': 'KY', '401': 'KY', '402': 'KY', '403': 'KY', '404': 'KY', '405': 'KY', '406': 'KY', '407': 'KY', '408': 'KY', '409': 'KY',
  '410': 'KY', '411': 'KY', '412': 'KY', '413': 'KY', '414': 'KY', '415': 'KY', '416': 'KY', '417': 'KY', '418': 'KY',
  '420': 'KY', '421': 'KY', '422': 'KY', '423': 'KY', '424': 'KY', '425': 'KY', '426': 'KY', '427': 'KY',
  // Louisiana 700-714
  '700': 'LA', '701': 'LA', '702': 'LA', '703': 'LA', '704': 'LA', '705': 'LA', '706': 'LA', '707': 'LA', '708': 'LA',
  '710': 'LA', '711': 'LA', '712': 'LA', '713': 'LA', '714': 'LA',
  // Maine 039-049
  '039': 'ME', '040': 'ME', '041': 'ME', '042': 'ME', '043': 'ME', '044': 'ME', '045': 'ME', '046': 'ME', '047': 'ME', '048': 'ME', '049': 'ME',
  // Maryland 206-219
  '206': 'MD', '207': 'MD', '208': 'MD', '209': 'MD', '210': 'MD', '211': 'MD', '212': 'MD', '214': 'MD', '215': 'MD', '216': 'MD', '217': 'MD', '218': 'MD', '219': 'MD',
  // Massachusetts 010-027
  '010': 'MA', '011': 'MA', '012': 'MA', '013': 'MA', '014': 'MA', '015': 'MA', '016': 'MA', '017': 'MA', '018': 'MA', '019': 'MA',
  '020': 'MA', '021': 'MA', '022': 'MA', '023': 'MA', '024': 'MA', '025': 'MA', '026': 'MA', '027': 'MA',
  // Michigan 480-499
  '480': 'MI', '481': 'MI', '482': 'MI', '483': 'MI', '484': 'MI', '485': 'MI', '486': 'MI', '487': 'MI', '488': 'MI', '489': 'MI',
  '490': 'MI', '491': 'MI', '492': 'MI', '493': 'MI', '494': 'MI', '495': 'MI', '496': 'MI', '497': 'MI', '498': 'MI', '499': 'MI',
  // Minnesota 550-567
  '550': 'MN', '551': 'MN', '552': 'MN', '553': 'MN', '554': 'MN', '555': 'MN', '556': 'MN', '557': 'MN', '558': 'MN', '559': 'MN',
  '560': 'MN', '561': 'MN', '562': 'MN', '563': 'MN', '564': 'MN', '565': 'MN', '566': 'MN', '567': 'MN',
  // Mississippi 386-397
  '386': 'MS', '387': 'MS', '388': 'MS', '389': 'MS', '390': 'MS', '391': 'MS', '392': 'MS', '393': 'MS', '394': 'MS', '395': 'MS', '396': 'MS', '397': 'MS',
  // Missouri 630-658
  '630': 'MO', '631': 'MO', '633': 'MO', '634': 'MO', '635': 'MO', '636': 'MO', '637': 'MO', '638': 'MO', '639': 'MO',
  '640': 'MO', '641': 'MO', '644': 'MO', '645': 'MO', '646': 'MO', '647': 'MO', '648': 'MO', '649': 'MO',
  '650': 'MO', '651': 'MO', '652': 'MO', '653': 'MO', '654': 'MO', '655': 'MO', '656': 'MO', '657': 'MO', '658': 'MO',
  // Montana 590-599
  '590': 'MT', '591': 'MT', '592': 'MT', '593': 'MT', '594': 'MT', '595': 'MT', '596': 'MT', '597': 'MT', '598': 'MT', '599': 'MT',
  // Nebraska 680-693
  '680': 'NE', '681': 'NE', '683': 'NE', '684': 'NE', '685': 'NE', '686': 'NE', '687': 'NE', '688': 'NE', '689': 'NE',
  '690': 'NE', '691': 'NE', '692': 'NE', '693': 'NE',
  // Nevada 889-898
  '889': 'NV', '890': 'NV', '891': 'NV', '893': 'NV', '894': 'NV', '895': 'NV', '897': 'NV', '898': 'NV',
  // New Hampshire 030-038
  '030': 'NH', '031': 'NH', '032': 'NH', '033': 'NH', '034': 'NH', '035': 'NH', '036': 'NH', '037': 'NH', '038': 'NH',
  // New Jersey 070-089
  '070': 'NJ', '071': 'NJ', '072': 'NJ', '073': 'NJ', '074': 'NJ', '075': 'NJ', '076': 'NJ', '077': 'NJ', '078': 'NJ', '079': 'NJ',
  '080': 'NJ', '081': 'NJ', '082': 'NJ', '083': 'NJ', '084': 'NJ', '085': 'NJ', '086': 'NJ', '087': 'NJ', '088': 'NJ', '089': 'NJ',
  // New Mexico 870-884
  '870': 'NM', '871': 'NM', '872': 'NM', '873': 'NM', '874': 'NM', '875': 'NM', '877': 'NM', '878': 'NM', '879': 'NM',
  '880': 'NM', '881': 'NM', '882': 'NM', '883': 'NM', '884': 'NM',
  // New York 100-149
  '100': 'NY', '101': 'NY', '102': 'NY', '103': 'NY', '104': 'NY', '105': 'NY', '106': 'NY', '107': 'NY', '108': 'NY', '109': 'NY',
  '110': 'NY', '111': 'NY', '112': 'NY', '113': 'NY', '114': 'NY', '115': 'NY', '116': 'NY', '117': 'NY', '118': 'NY', '119': 'NY',
  '120': 'NY', '121': 'NY', '122': 'NY', '123': 'NY', '124': 'NY', '125': 'NY', '126': 'NY', '127': 'NY', '128': 'NY', '129': 'NY',
  '130': 'NY', '131': 'NY', '132': 'NY', '133': 'NY', '134': 'NY', '135': 'NY', '136': 'NY', '137': 'NY', '138': 'NY', '139': 'NY',
  '140': 'NY', '141': 'NY', '142': 'NY', '143': 'NY', '144': 'NY', '145': 'NY', '146': 'NY', '147': 'NY', '148': 'NY', '149': 'NY',
  // North Carolina 270-289
  '270': 'NC', '271': 'NC', '272': 'NC', '273': 'NC', '274': 'NC', '275': 'NC', '276': 'NC', '277': 'NC', '278': 'NC', '279': 'NC',
  '280': 'NC', '281': 'NC', '282': 'NC', '283': 'NC', '284': 'NC', '285': 'NC', '286': 'NC', '287': 'NC', '288': 'NC', '289': 'NC',
  // North Dakota 580-588
  '580': 'ND', '581': 'ND', '582': 'ND', '583': 'ND', '584': 'ND', '585': 'ND', '586': 'ND', '587': 'ND', '588': 'ND',
  // Ohio 430-459
  '430': 'OH', '431': 'OH', '432': 'OH', '433': 'OH', '434': 'OH', '435': 'OH', '436': 'OH', '437': 'OH', '438': 'OH', '439': 'OH',
  '440': 'OH', '441': 'OH', '442': 'OH', '443': 'OH', '444': 'OH', '445': 'OH', '446': 'OH', '447': 'OH', '448': 'OH', '449': 'OH',
  '450': 'OH', '451': 'OH', '452': 'OH', '453': 'OH', '454': 'OH', '455': 'OH', '456': 'OH', '457': 'OH', '458': 'OH', '459': 'OH',
  // Oklahoma 730-749
  '730': 'OK', '731': 'OK', '732': 'OK', '733': 'OK', '734': 'OK', '735': 'OK', '736': 'OK', '737': 'OK', '738': 'OK', '739': 'OK',
  '740': 'OK', '741': 'OK', '743': 'OK', '744': 'OK', '745': 'OK', '746': 'OK', '747': 'OK', '748': 'OK', '749': 'OK',
  // Oregon 970-979
  '970': 'OR', '971': 'OR', '972': 'OR', '973': 'OR', '974': 'OR', '975': 'OR', '976': 'OR', '977': 'OR', '978': 'OR', '979': 'OR',
  // Pennsylvania 150-196
  '150': 'PA', '151': 'PA', '152': 'PA', '153': 'PA', '154': 'PA', '155': 'PA', '156': 'PA', '157': 'PA', '158': 'PA', '159': 'PA',
  '160': 'PA', '161': 'PA', '162': 'PA', '163': 'PA', '164': 'PA', '165': 'PA', '166': 'PA', '167': 'PA', '168': 'PA', '169': 'PA',
  '170': 'PA', '171': 'PA', '172': 'PA', '173': 'PA', '174': 'PA', '175': 'PA', '176': 'PA', '177': 'PA', '178': 'PA', '179': 'PA',
  '180': 'PA', '181': 'PA', '182': 'PA', '183': 'PA', '184': 'PA', '185': 'PA', '186': 'PA', '187': 'PA', '188': 'PA', '189': 'PA',
  '190': 'PA', '191': 'PA', '192': 'PA', '193': 'PA', '194': 'PA', '195': 'PA', '196': 'PA',
  // Rhode Island 028-029
  '028': 'RI', '029': 'RI',
  // South Carolina 290-299
  '290': 'SC', '291': 'SC', '292': 'SC', '293': 'SC', '294': 'SC', '295': 'SC', '296': 'SC', '297': 'SC', '298': 'SC', '299': 'SC',
  // South Dakota 570-577
  '570': 'SD', '571': 'SD', '572': 'SD', '573': 'SD', '574': 'SD', '575': 'SD', '576': 'SD', '577': 'SD',
  // Tennessee 370-385
  '370': 'TN', '371': 'TN', '372': 'TN', '373': 'TN', '374': 'TN', '376': 'TN', '377': 'TN', '378': 'TN', '379': 'TN',
  '380': 'TN', '381': 'TN', '382': 'TN', '383': 'TN', '384': 'TN', '385': 'TN',
  // Texas 750-799, 885
  '750': 'TX', '751': 'TX', '752': 'TX', '753': 'TX', '754': 'TX', '755': 'TX', '756': 'TX', '757': 'TX', '758': 'TX', '759': 'TX',
  '760': 'TX', '761': 'TX', '762': 'TX', '763': 'TX', '764': 'TX', '765': 'TX', '766': 'TX', '767': 'TX', '768': 'TX', '769': 'TX',
  '770': 'TX', '771': 'TX', '772': 'TX', '773': 'TX', '774': 'TX', '775': 'TX', '776': 'TX', '777': 'TX', '778': 'TX', '779': 'TX',
  '780': 'TX', '781': 'TX', '782': 'TX', '783': 'TX', '784': 'TX', '785': 'TX', '786': 'TX', '787': 'TX', '788': 'TX', '789': 'TX',
  '790': 'TX', '791': 'TX', '792': 'TX', '793': 'TX', '794': 'TX', '795': 'TX', '796': 'TX', '797': 'TX', '798': 'TX', '799': 'TX',
  '885': 'TX',
  // Utah 840-847
  '840': 'UT', '841': 'UT', '842': 'UT', '843': 'UT', '844': 'UT', '845': 'UT', '846': 'UT', '847': 'UT',
  // Vermont 050-059
  '050': 'VT', '051': 'VT', '052': 'VT', '053': 'VT', '054': 'VT', '055': 'VT', '056': 'VT', '057': 'VT', '058': 'VT', '059': 'VT',
  // Virginia 220-246
  '220': 'VA', '221': 'VA', '222': 'VA', '223': 'VA', '224': 'VA', '225': 'VA', '226': 'VA', '227': 'VA', '228': 'VA', '229': 'VA',
  '230': 'VA', '231': 'VA', '232': 'VA', '233': 'VA', '234': 'VA', '235': 'VA', '236': 'VA', '237': 'VA', '238': 'VA', '239': 'VA',
  '240': 'VA', '241': 'VA', '242': 'VA', '243': 'VA', '244': 'VA', '245': 'VA', '246': 'VA',
  // Washington 980-994
  '980': 'WA', '981': 'WA', '982': 'WA', '983': 'WA', '984': 'WA', '985': 'WA', '986': 'WA', '987': 'WA', '988': 'WA', '989': 'WA',
  '990': 'WA', '991': 'WA', '992': 'WA', '993': 'WA', '994': 'WA',
  // West Virginia 247-268
  '247': 'WV', '248': 'WV', '249': 'WV', '250': 'WV', '251': 'WV', '252': 'WV', '253': 'WV', '254': 'WV', '255': 'WV', '256': 'WV',
  '257': 'WV', '258': 'WV', '259': 'WV', '260': 'WV', '261': 'WV', '262': 'WV', '263': 'WV', '264': 'WV', '265': 'WV', '266': 'WV', '267': 'WV', '268': 'WV',
  // Wisconsin 530-549
  '530': 'WI', '531': 'WI', '532': 'WI', '533': 'WI', '534': 'WI', '535': 'WI', '536': 'WI', '537': 'WI', '538': 'WI', '539': 'WI',
  '540': 'WI', '541': 'WI', '542': 'WI', '543': 'WI', '544': 'WI', '545': 'WI', '546': 'WI', '547': 'WI', '548': 'WI', '549': 'WI',
  // Wyoming 820-831
  '820': 'WY', '821': 'WY', '822': 'WY', '823': 'WY', '824': 'WY', '825': 'WY', '826': 'WY', '827': 'WY', '828': 'WY', '829': 'WY', '830': 'WY', '831': 'WY',
};

// STATE UTILITIES DATABASE - ALL 50 STATES + DC
// Format: electric { utility, peakRate, offPeakRate, demandCharge, avgRate, logo }
// Format: gas { utility, rate, deliveryCharge, avgMonthly, logo }
const STATE_UTILITIES = {
  'AL': { stateName: 'Alabama', electric: { utility: 'Alabama Power', peakRate: 0.14, offPeakRate: 0.07, demandCharge: 10.00, avgRate: 0.12, logo: 'https://logo.clearbit.com/alabamapower.com' }, gas: { utility: 'Spire Alabama', rate: 1.05, deliveryCharge: 0.40, avgMonthly: 70, logo: 'https://logo.clearbit.com/spireenergy.com' } },
  'AK': { stateName: 'Alaska', electric: { utility: 'Chugach Electric', peakRate: 0.22, offPeakRate: 0.12, demandCharge: 15.00, avgRate: 0.18, logo: null }, gas: { utility: 'ENSTAR Natural Gas', rate: 1.20, deliveryCharge: 0.50, avgMonthly: 120, logo: null } },
  'AZ': { stateName: 'Arizona', electric: { utility: 'Arizona Public Service (APS)', peakRate: 0.24, offPeakRate: 0.08, demandCharge: 14.00, avgRate: 0.16, logo: 'https://logo.clearbit.com/aps.com' }, gas: { utility: 'Southwest Gas', rate: 1.15, deliveryCharge: 0.40, avgMonthly: 35, logo: 'https://logo.clearbit.com/swgas.com' } },
  'AR': { stateName: 'Arkansas', electric: { utility: 'Entergy Arkansas', peakRate: 0.13, offPeakRate: 0.06, demandCharge: 9.00, avgRate: 0.11, logo: 'https://logo.clearbit.com/entergy.com' }, gas: { utility: 'CenterPoint Energy', rate: 0.95, deliveryCharge: 0.35, avgMonthly: 55, logo: 'https://logo.clearbit.com/centerpointenergy.com' } },
  'CA': { stateName: 'California', electric: { utility: 'Pacific Gas & Electric (PG&E)', peakRate: 0.38, offPeakRate: 0.14, demandCharge: 21.00, avgRate: 0.26, logo: 'https://logo.clearbit.com/pge.com' }, gas: { utility: 'Pacific Gas & Electric (PG&E)', rate: 1.75, deliveryCharge: 0.55, avgMonthly: 55, logo: 'https://logo.clearbit.com/pge.com' } },
  'CO': { stateName: 'Colorado', electric: { utility: 'Xcel Energy', peakRate: 0.16, offPeakRate: 0.08, demandCharge: 11.00, avgRate: 0.13, logo: 'https://logo.clearbit.com/xcelenergy.com' }, gas: { utility: 'Xcel Energy', rate: 0.85, deliveryCharge: 0.35, avgMonthly: 65, logo: 'https://logo.clearbit.com/xcelenergy.com' } },
  'CT': { stateName: 'Connecticut', electric: { utility: 'Eversource', peakRate: 0.28, offPeakRate: 0.12, demandCharge: 16.00, avgRate: 0.21, logo: 'https://logo.clearbit.com/eversource.com' }, gas: { utility: 'Eversource', rate: 1.35, deliveryCharge: 0.48, avgMonthly: 95, logo: 'https://logo.clearbit.com/eversource.com' } },
  'DE': { stateName: 'Delaware', electric: { utility: 'Delmarva Power', peakRate: 0.15, offPeakRate: 0.08, demandCharge: 10.00, avgRate: 0.12, logo: 'https://logo.clearbit.com/delmarva.com' }, gas: { utility: 'Delmarva Power', rate: 1.10, deliveryCharge: 0.42, avgMonthly: 75, logo: 'https://logo.clearbit.com/delmarva.com' } },
  'DC': { stateName: 'Washington DC', electric: { utility: 'Pepco', peakRate: 0.18, offPeakRate: 0.09, demandCharge: 12.00, avgRate: 0.14, logo: 'https://logo.clearbit.com/pepco.com' }, gas: { utility: 'Washington Gas', rate: 1.25, deliveryCharge: 0.45, avgMonthly: 85, logo: 'https://logo.clearbit.com/washingtongas.com' } },
  'FL': { stateName: 'Florida', electric: { utility: 'Florida Power & Light (FPL)', peakRate: 0.16, offPeakRate: 0.07, demandCharge: 11.00, avgRate: 0.12, logo: 'https://logo.clearbit.com/fpl.com' }, gas: { utility: 'TECO Peoples Gas', rate: 1.25, deliveryCharge: 0.45, avgMonthly: 30, logo: 'https://logo.clearbit.com/peoplesgas.com' } },
  'GA': { stateName: 'Georgia', electric: { utility: 'Georgia Power', peakRate: 0.15, offPeakRate: 0.07, demandCharge: 10.00, avgRate: 0.12, logo: 'https://logo.clearbit.com/georgiapower.com' }, gas: { utility: 'Atlanta Gas Light', rate: 1.05, deliveryCharge: 0.40, avgMonthly: 50, logo: 'https://logo.clearbit.com/atlantagaslight.com' } },
  'HI': { stateName: 'Hawaii', electric: { utility: 'Hawaiian Electric (HECO)', peakRate: 0.42, offPeakRate: 0.28, demandCharge: 25.00, avgRate: 0.35, logo: 'https://logo.clearbit.com/hawaiianelectric.com' }, gas: { utility: 'Hawaii Gas', rate: 3.50, deliveryCharge: 0.75, avgMonthly: 45, logo: null } },
  'ID': { stateName: 'Idaho', electric: { utility: 'Idaho Power', peakRate: 0.12, offPeakRate: 0.05, demandCharge: 8.00, avgRate: 0.09, logo: 'https://logo.clearbit.com/idahopower.com' }, gas: { utility: 'Intermountain Gas', rate: 0.90, deliveryCharge: 0.35, avgMonthly: 60, logo: null } },
  'IL': { stateName: 'Illinois', electric: { utility: 'ComEd', peakRate: 0.18, offPeakRate: 0.08, demandCharge: 12.00, avgRate: 0.13, logo: 'https://logo.clearbit.com/comed.com' }, gas: { utility: 'Peoples Gas', rate: 0.95, deliveryCharge: 0.42, avgMonthly: 90, logo: 'https://logo.clearbit.com/peoplesgasdelivery.com' } },
  'IN': { stateName: 'Indiana', electric: { utility: 'Duke Energy Indiana', peakRate: 0.15, offPeakRate: 0.07, demandCharge: 10.00, avgRate: 0.12, logo: 'https://logo.clearbit.com/duke-energy.com' }, gas: { utility: 'CenterPoint Energy', rate: 0.90, deliveryCharge: 0.38, avgMonthly: 70, logo: 'https://logo.clearbit.com/centerpointenergy.com' } },
  'IA': { stateName: 'Iowa', electric: { utility: 'MidAmerican Energy', peakRate: 0.14, offPeakRate: 0.06, demandCharge: 9.00, avgRate: 0.11, logo: 'https://logo.clearbit.com/midamericanenergy.com' }, gas: { utility: 'MidAmerican Energy', rate: 0.85, deliveryCharge: 0.35, avgMonthly: 65, logo: 'https://logo.clearbit.com/midamericanenergy.com' } },
  'KS': { stateName: 'Kansas', electric: { utility: 'Evergy', peakRate: 0.15, offPeakRate: 0.07, demandCharge: 10.00, avgRate: 0.12, logo: 'https://logo.clearbit.com/evergy.com' }, gas: { utility: 'Kansas Gas Service', rate: 0.90, deliveryCharge: 0.38, avgMonthly: 60, logo: null } },
  'KY': { stateName: 'Kentucky', electric: { utility: 'LG&E', peakRate: 0.13, offPeakRate: 0.06, demandCharge: 9.00, avgRate: 0.11, logo: 'https://logo.clearbit.com/lge-ku.com' }, gas: { utility: 'LG&E', rate: 0.85, deliveryCharge: 0.35, avgMonthly: 65, logo: 'https://logo.clearbit.com/lge-ku.com' } },
  'LA': { stateName: 'Louisiana', electric: { utility: 'Entergy Louisiana', peakRate: 0.14, offPeakRate: 0.06, demandCharge: 9.50, avgRate: 0.11, logo: 'https://logo.clearbit.com/entergy.com' }, gas: { utility: 'Atmos Energy', rate: 0.95, deliveryCharge: 0.38, avgMonthly: 45, logo: 'https://logo.clearbit.com/atmosenergy.com' } },
  'ME': { stateName: 'Maine', electric: { utility: 'Central Maine Power', peakRate: 0.20, offPeakRate: 0.10, demandCharge: 13.00, avgRate: 0.16, logo: null }, gas: { utility: 'Summit Natural Gas', rate: 1.20, deliveryCharge: 0.45, avgMonthly: 85, logo: null } },
  'MD': { stateName: 'Maryland', electric: { utility: 'BGE', peakRate: 0.17, offPeakRate: 0.08, demandCharge: 11.00, avgRate: 0.13, logo: 'https://logo.clearbit.com/bge.com' }, gas: { utility: 'BGE', rate: 1.10, deliveryCharge: 0.42, avgMonthly: 80, logo: 'https://logo.clearbit.com/bge.com' } },
  'MA': { stateName: 'Massachusetts', electric: { utility: 'National Grid', peakRate: 0.26, offPeakRate: 0.12, demandCharge: 15.00, avgRate: 0.20, logo: 'https://logo.clearbit.com/nationalgrid.com' }, gas: { utility: 'National Grid', rate: 1.45, deliveryCharge: 0.50, avgMonthly: 95, logo: 'https://logo.clearbit.com/nationalgrid.com' } },
  'MI': { stateName: 'Michigan', electric: { utility: 'DTE Energy', peakRate: 0.25, offPeakRate: 0.12, demandCharge: 14.50, avgRate: 0.19, logo: 'https://www.google.com/s2/favicons?domain=dteenergy.com&sz=128' }, gas: { utility: 'Consumers Energy', rate: 1.05, deliveryCharge: 0.45, avgMonthly: 85, logo: 'https://www.google.com/s2/favicons?domain=consumersenergy.com&sz=128' } },
  'MN': { stateName: 'Minnesota', electric: { utility: 'Xcel Energy', peakRate: 0.15, offPeakRate: 0.07, demandCharge: 10.00, avgRate: 0.12, logo: 'https://logo.clearbit.com/xcelenergy.com' }, gas: { utility: 'CenterPoint Energy', rate: 0.90, deliveryCharge: 0.38, avgMonthly: 75, logo: 'https://logo.clearbit.com/centerpointenergy.com' } },
  'MS': { stateName: 'Mississippi', electric: { utility: 'Entergy Mississippi', peakRate: 0.13, offPeakRate: 0.06, demandCharge: 9.00, avgRate: 0.11, logo: 'https://logo.clearbit.com/entergy.com' }, gas: { utility: 'Atmos Energy', rate: 0.90, deliveryCharge: 0.35, avgMonthly: 45, logo: 'https://logo.clearbit.com/atmosenergy.com' } },
  'MO': { stateName: 'Missouri', electric: { utility: 'Ameren Missouri', peakRate: 0.14, offPeakRate: 0.07, demandCharge: 9.50, avgRate: 0.11, logo: 'https://logo.clearbit.com/ameren.com' }, gas: { utility: 'Spire Missouri', rate: 0.95, deliveryCharge: 0.40, avgMonthly: 70, logo: 'https://logo.clearbit.com/spireenergy.com' } },
  'MT': { stateName: 'Montana', electric: { utility: 'NorthWestern Energy', peakRate: 0.13, offPeakRate: 0.06, demandCharge: 9.00, avgRate: 0.11, logo: 'https://logo.clearbit.com/northwesternenergy.com' }, gas: { utility: 'NorthWestern Energy', rate: 0.85, deliveryCharge: 0.35, avgMonthly: 70, logo: 'https://logo.clearbit.com/northwesternenergy.com' } },
  'NE': { stateName: 'Nebraska', electric: { utility: 'OPPD', peakRate: 0.12, offPeakRate: 0.06, demandCharge: 8.00, avgRate: 0.10, logo: null }, gas: { utility: 'Black Hills Energy', rate: 0.85, deliveryCharge: 0.35, avgMonthly: 65, logo: 'https://logo.clearbit.com/blackhillsenergy.com' } },
  'NV': { stateName: 'Nevada', electric: { utility: 'NV Energy', peakRate: 0.16, offPeakRate: 0.07, demandCharge: 10.00, avgRate: 0.12, logo: 'https://logo.clearbit.com/nvenergy.com' }, gas: { utility: 'Southwest Gas', rate: 1.10, deliveryCharge: 0.40, avgMonthly: 40, logo: 'https://logo.clearbit.com/swgas.com' } },
  'NH': { stateName: 'New Hampshire', electric: { utility: 'Eversource', peakRate: 0.24, offPeakRate: 0.11, demandCharge: 14.00, avgRate: 0.19, logo: 'https://logo.clearbit.com/eversource.com' }, gas: { utility: 'Liberty Utilities', rate: 1.30, deliveryCharge: 0.48, avgMonthly: 90, logo: null } },
  'NJ': { stateName: 'New Jersey', electric: { utility: 'PSE&G', peakRate: 0.19, offPeakRate: 0.09, demandCharge: 12.00, avgRate: 0.14, logo: 'https://logo.clearbit.com/pseg.com' }, gas: { utility: 'PSE&G', rate: 1.15, deliveryCharge: 0.45, avgMonthly: 85, logo: 'https://logo.clearbit.com/pseg.com' } },
  'NM': { stateName: 'New Mexico', electric: { utility: 'PNM', peakRate: 0.15, offPeakRate: 0.07, demandCharge: 10.00, avgRate: 0.12, logo: 'https://logo.clearbit.com/pnm.com' }, gas: { utility: 'New Mexico Gas', rate: 0.95, deliveryCharge: 0.38, avgMonthly: 50, logo: null } },
  'NY': { stateName: 'New York', electric: { utility: 'Con Edison', peakRate: 0.32, offPeakRate: 0.12, demandCharge: 18.00, avgRate: 0.22, logo: 'https://logo.clearbit.com/coned.com' }, gas: { utility: 'Con Edison', rate: 1.45, deliveryCharge: 0.50, avgMonthly: 95, logo: 'https://logo.clearbit.com/coned.com' } },
  'NC': { stateName: 'North Carolina', electric: { utility: 'Duke Energy Carolinas', peakRate: 0.14, offPeakRate: 0.07, demandCharge: 9.50, avgRate: 0.11, logo: 'https://logo.clearbit.com/duke-energy.com' }, gas: { utility: 'Piedmont Natural Gas', rate: 1.00, deliveryCharge: 0.40, avgMonthly: 55, logo: 'https://logo.clearbit.com/piedmontng.com' } },
  'ND': { stateName: 'North Dakota', electric: { utility: 'Xcel Energy', peakRate: 0.13, offPeakRate: 0.06, demandCharge: 8.50, avgRate: 0.10, logo: 'https://logo.clearbit.com/xcelenergy.com' }, gas: { utility: 'Xcel Energy', rate: 0.80, deliveryCharge: 0.32, avgMonthly: 70, logo: 'https://logo.clearbit.com/xcelenergy.com' } },
  'OH': { stateName: 'Ohio', electric: { utility: 'AEP Ohio', peakRate: 0.15, offPeakRate: 0.07, demandCharge: 10.00, avgRate: 0.12, logo: 'https://logo.clearbit.com/aep.com' }, gas: { utility: 'Columbia Gas', rate: 0.95, deliveryCharge: 0.40, avgMonthly: 75, logo: 'https://logo.clearbit.com/nisource.com' } },
  'OK': { stateName: 'Oklahoma', electric: { utility: 'OG&E', peakRate: 0.13, offPeakRate: 0.06, demandCharge: 9.00, avgRate: 0.11, logo: 'https://logo.clearbit.com/oge.com' }, gas: { utility: 'Oklahoma Natural Gas', rate: 0.85, deliveryCharge: 0.35, avgMonthly: 50, logo: null } },
  'OR': { stateName: 'Oregon', electric: { utility: 'Portland General Electric', peakRate: 0.14, offPeakRate: 0.06, demandCharge: 9.00, avgRate: 0.11, logo: 'https://logo.clearbit.com/portlandgeneral.com' }, gas: { utility: 'NW Natural', rate: 1.00, deliveryCharge: 0.40, avgMonthly: 60, logo: 'https://logo.clearbit.com/nwnatural.com' } },
  'PA': { stateName: 'Pennsylvania', electric: { utility: 'PECO', peakRate: 0.16, offPeakRate: 0.08, demandCharge: 10.50, avgRate: 0.12, logo: 'https://logo.clearbit.com/peco.com' }, gas: { utility: 'PECO', rate: 1.05, deliveryCharge: 0.42, avgMonthly: 80, logo: 'https://logo.clearbit.com/peco.com' } },
  'RI': { stateName: 'Rhode Island', electric: { utility: 'Rhode Island Energy', peakRate: 0.25, offPeakRate: 0.12, demandCharge: 15.00, avgRate: 0.19, logo: null }, gas: { utility: 'Rhode Island Energy', rate: 1.35, deliveryCharge: 0.48, avgMonthly: 90, logo: null } },
  'SC': { stateName: 'South Carolina', electric: { utility: 'Duke Energy Carolinas', peakRate: 0.14, offPeakRate: 0.06, demandCharge: 9.00, avgRate: 0.11, logo: 'https://logo.clearbit.com/duke-energy.com' }, gas: { utility: 'Dominion Energy', rate: 1.00, deliveryCharge: 0.40, avgMonthly: 50, logo: 'https://logo.clearbit.com/dominionenergy.com' } },
  'SD': { stateName: 'South Dakota', electric: { utility: 'Xcel Energy', peakRate: 0.13, offPeakRate: 0.06, demandCharge: 8.50, avgRate: 0.10, logo: 'https://logo.clearbit.com/xcelenergy.com' }, gas: { utility: 'MidAmerican Energy', rate: 0.85, deliveryCharge: 0.35, avgMonthly: 65, logo: 'https://logo.clearbit.com/midamericanenergy.com' } },
  'TN': { stateName: 'Tennessee', electric: { utility: 'TVA / Local Power', peakRate: 0.13, offPeakRate: 0.06, demandCharge: 9.00, avgRate: 0.11, logo: 'https://logo.clearbit.com/tva.gov' }, gas: { utility: 'Piedmont Natural Gas', rate: 0.95, deliveryCharge: 0.38, avgMonthly: 55, logo: 'https://logo.clearbit.com/piedmontng.com' } },
  'TX': { stateName: 'Texas', electric: { utility: 'Oncor (TDU)', peakRate: 0.14, offPeakRate: 0.07, demandCharge: 9.50, avgRate: 0.11, logo: 'https://logo.clearbit.com/oncor.com' }, gas: { utility: 'Atmos Energy', rate: 0.85, deliveryCharge: 0.35, avgMonthly: 40, logo: 'https://logo.clearbit.com/atmosenergy.com' } },
  'UT': { stateName: 'Utah', electric: { utility: 'Rocky Mountain Power', peakRate: 0.13, offPeakRate: 0.06, demandCharge: 8.50, avgRate: 0.10, logo: 'https://logo.clearbit.com/rockymountainpower.net' }, gas: { utility: 'Dominion Energy', rate: 0.90, deliveryCharge: 0.38, avgMonthly: 55, logo: 'https://logo.clearbit.com/dominionenergy.com' } },
  'VT': { stateName: 'Vermont', electric: { utility: 'Green Mountain Power', peakRate: 0.20, offPeakRate: 0.10, demandCharge: 12.00, avgRate: 0.16, logo: 'https://logo.clearbit.com/greenmountainpower.com' }, gas: { utility: 'Vermont Gas', rate: 1.20, deliveryCharge: 0.45, avgMonthly: 85, logo: null } },
  'VA': { stateName: 'Virginia', electric: { utility: 'Dominion Energy Virginia', peakRate: 0.14, offPeakRate: 0.07, demandCharge: 9.50, avgRate: 0.11, logo: 'https://logo.clearbit.com/dominionenergy.com' }, gas: { utility: 'Washington Gas', rate: 1.10, deliveryCharge: 0.42, avgMonthly: 70, logo: 'https://logo.clearbit.com/washingtongas.com' } },
  'WA': { stateName: 'Washington', electric: { utility: 'Puget Sound Energy', peakRate: 0.12, offPeakRate: 0.05, demandCharge: 8.00, avgRate: 0.09, logo: 'https://logo.clearbit.com/pse.com' }, gas: { utility: 'Puget Sound Energy', rate: 1.10, deliveryCharge: 0.38, avgMonthly: 65, logo: 'https://logo.clearbit.com/pse.com' } },
  'WV': { stateName: 'West Virginia', electric: { utility: 'Appalachian Power', peakRate: 0.13, offPeakRate: 0.06, demandCharge: 9.00, avgRate: 0.11, logo: 'https://logo.clearbit.com/appalachianpower.com' }, gas: { utility: 'Mountaineer Gas', rate: 0.95, deliveryCharge: 0.38, avgMonthly: 70, logo: null } },
  'WI': { stateName: 'Wisconsin', electric: { utility: 'We Energies', peakRate: 0.16, offPeakRate: 0.07, demandCharge: 10.00, avgRate: 0.12, logo: 'https://logo.clearbit.com/we-energies.com' }, gas: { utility: 'We Energies', rate: 0.95, deliveryCharge: 0.40, avgMonthly: 75, logo: 'https://logo.clearbit.com/we-energies.com' } },
  'WY': { stateName: 'Wyoming', electric: { utility: 'Rocky Mountain Power', peakRate: 0.12, offPeakRate: 0.05, demandCharge: 8.00, avgRate: 0.10, logo: 'https://logo.clearbit.com/rockymountainpower.net' }, gas: { utility: 'Black Hills Energy', rate: 0.85, deliveryCharge: 0.35, avgMonthly: 65, logo: 'https://logo.clearbit.com/blackhillsenergy.com' } },
};

// Specific ZIP code overrides for known cities with different utilities
const ZIP_OVERRIDES = {
  // Michigan cities
  '48167': { region: 'Northville, MI' },
  '48170': { region: 'Plymouth, MI' },
  '48104': { region: 'Ann Arbor, MI' },
  '48226': { region: 'Detroit, MI' },
  '49503': { region: 'Grand Rapids, MI', electric: { utility: 'Consumers Energy', peakRate: 0.17, offPeakRate: 0.07, demandCharge: 11.50, avgRate: 0.12, logo: 'https://logo.clearbit.com/consumersenergy.com' } },
  // California cities with different utilities
  '90210': { region: 'Beverly Hills, CA', electric: { utility: 'Southern California Edison (SCE)', peakRate: 0.42, offPeakRate: 0.15, demandCharge: 23.00, avgRate: 0.28, logo: 'https://logo.clearbit.com/sce.com' }, gas: { utility: 'SoCalGas', rate: 1.85, deliveryCharge: 0.65, avgMonthly: 45, logo: 'https://logo.clearbit.com/socalgas.com' } },
  '90001': { region: 'Los Angeles, CA', electric: { utility: 'Southern California Edison (SCE)', peakRate: 0.42, offPeakRate: 0.15, demandCharge: 23.00, avgRate: 0.28, logo: 'https://logo.clearbit.com/sce.com' }, gas: { utility: 'SoCalGas', rate: 1.85, deliveryCharge: 0.65, avgMonthly: 45, logo: 'https://logo.clearbit.com/socalgas.com' } },
  '92101': { region: 'San Diego, CA', electric: { utility: 'San Diego Gas & Electric (SDG&E)', peakRate: 0.45, offPeakRate: 0.16, demandCharge: 24.00, avgRate: 0.30, logo: 'https://logo.clearbit.com/sdge.com' }, gas: { utility: 'San Diego Gas & Electric (SDG&E)', rate: 2.00, deliveryCharge: 0.70, avgMonthly: 40, logo: 'https://logo.clearbit.com/sdge.com' } },
  '94102': { region: 'San Francisco, CA' },
  '95814': { region: 'Sacramento, CA', electric: { utility: 'SMUD', peakRate: 0.18, offPeakRate: 0.08, demandCharge: 12.00, avgRate: 0.14, logo: 'https://logo.clearbit.com/smud.org' } },
  // New York
  '10001': { region: 'New York, NY' },
  '14201': { region: 'Buffalo, NY', electric: { utility: 'National Grid', peakRate: 0.20, offPeakRate: 0.09, demandCharge: 12.00, avgRate: 0.15, logo: 'https://logo.clearbit.com/nationalgrid.com' }, gas: { utility: 'National Fuel Gas', rate: 1.20, deliveryCharge: 0.45, avgMonthly: 80, logo: 'https://logo.clearbit.com/natfuel.com' } },
  // Texas cities
  '77001': { region: 'Houston, TX', electric: { utility: 'CenterPoint Energy (TDU)', peakRate: 0.13, offPeakRate: 0.06, demandCharge: 9.00, avgRate: 0.10, logo: 'https://logo.clearbit.com/centerpointenergy.com' }, gas: { utility: 'CenterPoint Energy', rate: 0.82, deliveryCharge: 0.33, avgMonthly: 38, logo: 'https://logo.clearbit.com/centerpointenergy.com' } },
  '78201': { region: 'San Antonio, TX', electric: { utility: 'CPS Energy', peakRate: 0.12, offPeakRate: 0.06, demandCharge: 8.50, avgRate: 0.10, logo: 'https://logo.clearbit.com/cpsenergy.com' }, gas: { utility: 'CPS Energy', rate: 0.80, deliveryCharge: 0.32, avgMonthly: 35, logo: 'https://logo.clearbit.com/cpsenergy.com' } },
  // Arizona
  '85001': { region: 'Phoenix, AZ' },
  '85251': { region: 'Scottsdale, AZ', electric: { utility: 'Salt River Project (SRP)', peakRate: 0.22, offPeakRate: 0.07, demandCharge: 13.00, avgRate: 0.14, logo: 'https://logo.clearbit.com/srpnet.com' } },
  // Nevada
  '89052': { region: 'Henderson, NV' },
  '89101': { region: 'Las Vegas, NV' },
  '89501': { region: 'Reno, NV' },
  // Florida
  '33101': { region: 'Miami, FL' },
  '32801': { region: 'Orlando, FL', electric: { utility: 'Duke Energy Florida', peakRate: 0.15, offPeakRate: 0.07, demandCharge: 10.00, avgRate: 0.11, logo: 'https://logo.clearbit.com/duke-energy.com' } },
  // Illinois
  '60601': { region: 'Chicago, IL' },
  // Washington
  '98101': { region: 'Seattle, WA', electric: { utility: 'Seattle City Light', peakRate: 0.11, offPeakRate: 0.05, demandCharge: 7.50, avgRate: 0.08, logo: 'https://logo.clearbit.com/seattle.gov' } },
  '99201': { region: 'Spokane, WA', electric: { utility: 'Avista', peakRate: 0.11, offPeakRate: 0.05, demandCharge: 7.50, avgRate: 0.09, logo: 'https://logo.clearbit.com/avistautilities.com' }, gas: { utility: 'Avista', rate: 1.05, deliveryCharge: 0.36, avgMonthly: 60, logo: 'https://logo.clearbit.com/avistautilities.com' } },
  // Oklahoma
  '73008': { region: 'Oklahoma City, OK' },
  '73102': { region: 'Oklahoma City, OK' },
  '74103': { region: 'Tulsa, OK' },
};


// ============================================
// ZIP DATABASE (46 Major US Cities)
// Comprehensive location data for Step 1
// ============================================
const zipDatabase = {
  // MICHIGAN
  '48167': { 
    city: 'Northville', state: 'MI', utility: 'DTE Energy', gasUtility: 'DTE Gas',
    weather: { risk: 'Moderate', heat: 'Moderate', drought: 'Low', hurricane: 'Low', tornado: 'Moderate', wildfire: 'Low', hail: 'Moderate', snow: 'High', ice: 'High', flood: 'Low' },
    solar: { peakSunHours: 4.2, annualOutput: 1190, rating: 'Fair', climate: 'Mixed' },
    electric: { rate: 0.19, peakRate: 0.25, offPeakRate: 0.12, level: 'Moderate', demandCharge: 15 },
    gas: { rate: 0.85, winterRate: 1.15, level: 'Moderate', vsNational: '+0%' },
    grid: { rating: '3/5', outages: '3-5', psps: 'N/A', backupNeed: 'Medium', gridStress: 'Moderate' },
    incentives: { total: 52, federal: 30, state: 0, local: 0, macrs: 22, stateRebate: 'None', rating: 'Good' },
    battery: { recommended: true, roi: 'Moderate', payback: '8-10', reason: 'Storm Backup', demandMgmt: true, backup: 'Medium' }
  },
  '48201': { 
    city: 'Detroit', state: 'MI', utility: 'DTE Energy', gasUtility: 'DTE Gas',
    weather: { risk: 'Moderate', heat: 'Moderate', drought: 'Low', hurricane: 'Low', tornado: 'Moderate', wildfire: 'Low', hail: 'Moderate', snow: 'High', ice: 'High', flood: 'Moderate' },
    solar: { peakSunHours: 4.1, annualOutput: 1160, rating: 'Fair', climate: 'Mixed' },
    electric: { rate: 0.19, peakRate: 0.25, offPeakRate: 0.12, level: 'Moderate', demandCharge: 16 },
    gas: { rate: 0.88, winterRate: 1.18, level: 'Moderate', vsNational: '+3%' },
    grid: { rating: '3/5', outages: '4-6', psps: 'N/A', backupNeed: 'Medium', gridStress: 'Moderate' },
    incentives: { total: 52, federal: 30, state: 0, local: 0, macrs: 22, stateRebate: 'None', rating: 'Good' },
    battery: { recommended: true, roi: 'Moderate', payback: '8-10', reason: 'Grid Reliability', demandMgmt: true, backup: 'Medium' }
  },
  // MASSACHUSETTS  
  '01852': { 
    city: 'Lowell', state: 'MA', utility: 'National Grid', gasUtility: 'National Grid',
    weather: { risk: 'Moderate', heat: 'Moderate', drought: 'Low', hurricane: 'Moderate', tornado: 'Low', wildfire: 'Low', hail: 'Low', snow: 'High', ice: 'Moderate', flood: 'Moderate' },
    solar: { peakSunHours: 4.2, annualOutput: 1190, rating: 'Fair', climate: 'Mixed' },
    electric: { rate: 0.26, peakRate: 0.32, offPeakRate: 0.18, level: 'High', demandCharge: 18 },
    gas: { rate: 1.45, winterRate: 1.85, level: 'Very High', vsNational: '+70%' },
    grid: { rating: '3/5', outages: '2-4', psps: 'N/A', backupNeed: 'Medium', gridStress: 'Moderate' },
    incentives: { total: 62, federal: 30, state: 10, local: 0, macrs: 22, stateRebate: 'SMART', rating: 'Excellent' },
    battery: { recommended: true, roi: 'Good', payback: '6-8', reason: 'High Rates + Storms', demandMgmt: true, backup: 'Medium' }
  },
  '02101': { 
    city: 'Boston', state: 'MA', utility: 'Eversource', gasUtility: 'National Grid',
    weather: { risk: 'Moderate', heat: 'Moderate', drought: 'Low', hurricane: 'Moderate', tornado: 'Low', wildfire: 'Low', hail: 'Low', snow: 'High', ice: 'Moderate', flood: 'Moderate' },
    solar: { peakSunHours: 4.2, annualOutput: 1190, rating: 'Fair', climate: 'Mixed' },
    electric: { rate: 0.28, peakRate: 0.35, offPeakRate: 0.19, level: 'Very High', demandCharge: 20 },
    gas: { rate: 1.55, winterRate: 2.05, level: 'Very High', vsNational: '+82%' },
    grid: { rating: '3/5', outages: '2-3', psps: 'N/A', backupNeed: 'Medium', gridStress: 'Moderate' },
    incentives: { total: 62, federal: 30, state: 10, local: 0, macrs: 22, stateRebate: 'SMART', rating: 'Excellent' },
    battery: { recommended: true, roi: 'Good', payback: '5-7', reason: 'High Rates', demandMgmt: true, backup: 'Medium' }
  },
  // PENNSYLVANIA
  '19101': { 
    city: 'Philadelphia', state: 'PA', utility: 'PECO', gasUtility: 'PECO',
    weather: { risk: 'Moderate', heat: 'Moderate', drought: 'Low', hurricane: 'Moderate', tornado: 'Low', wildfire: 'Low', hail: 'Low', snow: 'Moderate', ice: 'Moderate', flood: 'Moderate' },
    solar: { peakSunHours: 4.4, annualOutput: 1250, rating: 'Fair', climate: 'Mixed' },
    electric: { rate: 0.16, peakRate: 0.21, offPeakRate: 0.11, level: 'Moderate', demandCharge: 14 },
    gas: { rate: 1.05, winterRate: 1.35, level: 'Moderate', vsNational: '+23%' },
    grid: { rating: '3/5', outages: '2-4', psps: 'N/A', backupNeed: 'Medium', gridStress: 'Moderate' },
    incentives: { total: 52, federal: 30, state: 0, local: 0, macrs: 22, stateRebate: 'None', rating: 'Good' },
    battery: { recommended: true, roi: 'Moderate', payback: '8-10', reason: 'Storm Backup', demandMgmt: true, backup: 'Medium' }
  },
  '15201': { 
    city: 'Pittsburgh', state: 'PA', utility: 'Duquesne Light', gasUtility: 'Peoples Gas',
    weather: { risk: 'Moderate', heat: 'Moderate', drought: 'Low', hurricane: 'Low', tornado: 'Low', wildfire: 'Low', hail: 'Moderate', snow: 'Moderate', ice: 'Moderate', flood: 'Moderate' },
    solar: { peakSunHours: 3.8, annualOutput: 1080, rating: 'Fair', climate: 'Cloudy' },
    electric: { rate: 0.14, peakRate: 0.18, offPeakRate: 0.10, level: 'Moderate', demandCharge: 12 },
    gas: { rate: 0.95, winterRate: 1.25, level: 'Moderate', vsNational: '+12%' },
    grid: { rating: '4/5', outages: '1-2', psps: 'N/A', backupNeed: 'Low', gridStress: 'Low' },
    incentives: { total: 52, federal: 30, state: 0, local: 0, macrs: 22, stateRebate: 'None', rating: 'Good' },
    battery: { recommended: false, roi: 'Marginal', payback: '10-12', reason: 'Stable Grid', demandMgmt: true, backup: 'Low' }
  },
  // INDIANA
  '46201': { 
    city: 'Indianapolis', state: 'IN', utility: 'AES Indiana', gasUtility: 'CenterPoint',
    weather: { risk: 'Moderate', heat: 'Moderate', drought: 'Low', hurricane: 'Low', tornado: 'Moderate', wildfire: 'Low', hail: 'Moderate', snow: 'Moderate', ice: 'Moderate', flood: 'Moderate' },
    solar: { peakSunHours: 4.4, annualOutput: 1250, rating: 'Fair', climate: 'Mixed' },
    electric: { rate: 0.13, peakRate: 0.16, offPeakRate: 0.09, level: 'Moderate', demandCharge: 11 },
    gas: { rate: 0.78, winterRate: 1.02, level: 'Low', vsNational: '-8%' },
    grid: { rating: '4/5', outages: '1-3', psps: 'N/A', backupNeed: 'Low', gridStress: 'Low' },
    incentives: { total: 52, federal: 30, state: 0, local: 0, macrs: 22, stateRebate: 'None', rating: 'Good' },
    battery: { recommended: false, roi: 'Marginal', payback: '10-12', reason: 'Low Rates', demandMgmt: true, backup: 'Low' }
  },
  // OKLAHOMA
  '73101': { 
    city: 'Oklahoma City', state: 'OK', utility: 'OG&E', gasUtility: 'Oklahoma Natural Gas',
    weather: { risk: 'High', heat: 'High', drought: 'Moderate', hurricane: 'Low', tornado: 'High', wildfire: 'Moderate', hail: 'High', snow: 'Moderate', ice: 'High', flood: 'Moderate' },
    solar: { peakSunHours: 5.4, annualOutput: 1530, rating: 'Good', climate: 'Sunny' },
    electric: { rate: 0.11, peakRate: 0.14, offPeakRate: 0.08, level: 'Low', demandCharge: 9 },
    gas: { rate: 0.65, winterRate: 0.85, level: 'Low', vsNational: '-24%' },
    grid: { rating: '3/5', outages: '3-5', psps: 'N/A', backupNeed: 'High', gridStress: 'Moderate' },
    incentives: { total: 52, federal: 30, state: 0, local: 0, macrs: 22, stateRebate: 'None', rating: 'Good' },
    battery: { recommended: true, roi: 'Good', payback: '7-9', reason: 'Tornado/Ice Storms', demandMgmt: false, backup: 'Critical' }
  },
  // OHIO
  '43201': { 
    city: 'Columbus', state: 'OH', utility: 'AEP Ohio', gasUtility: 'Columbia Gas',
    weather: { risk: 'Moderate', heat: 'Moderate', drought: 'Low', hurricane: 'Low', tornado: 'Moderate', wildfire: 'Low', hail: 'Moderate', snow: 'Moderate', ice: 'Moderate', flood: 'Moderate' },
    solar: { peakSunHours: 4.2, annualOutput: 1190, rating: 'Fair', climate: 'Mixed' },
    electric: { rate: 0.13, peakRate: 0.16, offPeakRate: 0.09, level: 'Moderate', demandCharge: 11 },
    gas: { rate: 0.82, winterRate: 1.08, level: 'Moderate', vsNational: '-4%' },
    grid: { rating: '4/5', outages: '1-2', psps: 'N/A', backupNeed: 'Low', gridStress: 'Low' },
    incentives: { total: 52, federal: 30, state: 0, local: 0, macrs: 22, stateRebate: 'None', rating: 'Good' },
    battery: { recommended: false, roi: 'Marginal', payback: '10-12', reason: 'Stable Grid', demandMgmt: true, backup: 'Low' }
  },
  '44101': { 
    city: 'Cleveland', state: 'OH', utility: 'FirstEnergy', gasUtility: 'Dominion Energy',
    weather: { risk: 'Moderate', heat: 'Moderate', drought: 'Low', hurricane: 'Low', tornado: 'Low', wildfire: 'Low', hail: 'Moderate', snow: 'High', ice: 'High', flood: 'Moderate' },
    solar: { peakSunHours: 3.9, annualOutput: 1100, rating: 'Fair', climate: 'Cloudy' },
    electric: { rate: 0.14, peakRate: 0.17, offPeakRate: 0.10, level: 'Moderate', demandCharge: 12 },
    gas: { rate: 0.88, winterRate: 1.15, level: 'Moderate', vsNational: '+3%' },
    grid: { rating: '3/5', outages: '2-4', psps: 'N/A', backupNeed: 'Medium', gridStress: 'Moderate' },
    incentives: { total: 52, federal: 30, state: 0, local: 0, macrs: 22, stateRebate: 'None', rating: 'Good' },
    battery: { recommended: true, roi: 'Marginal', payback: '9-11', reason: 'Lake Effect Storms', demandMgmt: true, backup: 'Medium' }
  },
  // MINNESOTA
  '55401': { 
    city: 'Minneapolis', state: 'MN', utility: 'Xcel Energy', gasUtility: 'CenterPoint',
    weather: { risk: 'Moderate', heat: 'Moderate', drought: 'Low', hurricane: 'Low', tornado: 'Moderate', wildfire: 'Low', hail: 'Moderate', snow: 'High', ice: 'High', flood: 'Moderate' },
    solar: { peakSunHours: 4.5, annualOutput: 1275, rating: 'Fair', climate: 'Mixed' },
    electric: { rate: 0.14, peakRate: 0.18, offPeakRate: 0.10, level: 'Moderate', demandCharge: 12 },
    gas: { rate: 0.78, winterRate: 1.05, level: 'Low', vsNational: '-8%' },
    grid: { rating: '4/5', outages: '1-2', psps: 'N/A', backupNeed: 'Low', gridStress: 'Low' },
    incentives: { total: 55, federal: 30, state: 3, local: 0, macrs: 22, stateRebate: 'Xcel Rebate', rating: 'Good' },
    battery: { recommended: false, roi: 'Marginal', payback: '10-12', reason: 'Stable Grid', demandMgmt: true, backup: 'Low' }
  },
  // WISCONSIN
  '53201': { 
    city: 'Milwaukee', state: 'WI', utility: 'We Energies', gasUtility: 'We Energies',
    weather: { risk: 'Moderate', heat: 'Moderate', drought: 'Low', hurricane: 'Low', tornado: 'Moderate', wildfire: 'Low', hail: 'Moderate', snow: 'High', ice: 'High', flood: 'Moderate' },
    solar: { peakSunHours: 4.3, annualOutput: 1220, rating: 'Fair', climate: 'Mixed' },
    electric: { rate: 0.15, peakRate: 0.19, offPeakRate: 0.11, level: 'Moderate', demandCharge: 13 },
    gas: { rate: 0.85, winterRate: 1.12, level: 'Moderate', vsNational: '+0%' },
    grid: { rating: '4/5', outages: '1-2', psps: 'N/A', backupNeed: 'Low', gridStress: 'Low' },
    incentives: { total: 54, federal: 30, state: 2, local: 0, macrs: 22, stateRebate: 'Focus on Energy', rating: 'Good' },
    battery: { recommended: false, roi: 'Marginal', payback: '10-12', reason: 'Stable Grid', demandMgmt: true, backup: 'Low' }
  },
  // MISSOURI
  '63101': { 
    city: 'St. Louis', state: 'MO', utility: 'Ameren Missouri', gasUtility: 'Spire',
    weather: { risk: 'Moderate', heat: 'High', drought: 'Moderate', hurricane: 'Low', tornado: 'Moderate', wildfire: 'Low', hail: 'Moderate', snow: 'Moderate', ice: 'Moderate', flood: 'Moderate' },
    solar: { peakSunHours: 4.8, annualOutput: 1360, rating: 'Good', climate: 'Mixed' },
    electric: { rate: 0.12, peakRate: 0.15, offPeakRate: 0.09, level: 'Low', demandCharge: 10 },
    gas: { rate: 0.75, winterRate: 0.98, level: 'Low', vsNational: '-12%' },
    grid: { rating: '3/5', outages: '2-4', psps: 'N/A', backupNeed: 'Medium', gridStress: 'Moderate' },
    incentives: { total: 52, federal: 30, state: 0, local: 0, macrs: 22, stateRebate: 'None', rating: 'Good' },
    battery: { recommended: true, roi: 'Moderate', payback: '8-10', reason: 'Storm Backup', demandMgmt: true, backup: 'Medium' }
  },
  '64101': { 
    city: 'Kansas City', state: 'MO', utility: 'Evergy', gasUtility: 'Spire',
    weather: { risk: 'High', heat: 'High', drought: 'Moderate', hurricane: 'Low', tornado: 'High', wildfire: 'Low', hail: 'High', snow: 'Moderate', ice: 'Moderate', flood: 'Moderate' },
    solar: { peakSunHours: 5.0, annualOutput: 1420, rating: 'Good', climate: 'Mixed' },
    electric: { rate: 0.13, peakRate: 0.16, offPeakRate: 0.09, level: 'Moderate', demandCharge: 11 },
    gas: { rate: 0.72, winterRate: 0.95, level: 'Low', vsNational: '-15%' },
    grid: { rating: '3/5', outages: '2-4', psps: 'N/A', backupNeed: 'Medium', gridStress: 'Moderate' },
    incentives: { total: 52, federal: 30, state: 0, local: 0, macrs: 22, stateRebate: 'None', rating: 'Good' },
    battery: { recommended: true, roi: 'Good', payback: '7-9', reason: 'Tornado Risk', demandMgmt: true, backup: 'High' }
  },
  // TENNESSEE
  '37201': { 
    city: 'Nashville', state: 'TN', utility: 'NES', gasUtility: 'Piedmont Natural Gas',
    weather: { risk: 'Moderate', heat: 'High', drought: 'Moderate', hurricane: 'Low', tornado: 'Moderate', wildfire: 'Low', hail: 'Moderate', snow: 'Low', ice: 'Moderate', flood: 'Moderate' },
    solar: { peakSunHours: 4.9, annualOutput: 1390, rating: 'Good', climate: 'Mixed' },
    electric: { rate: 0.11, peakRate: 0.13, offPeakRate: 0.08, level: 'Low', demandCharge: 9 },
    gas: { rate: 0.82, winterRate: 1.05, level: 'Moderate', vsNational: '-4%' },
    grid: { rating: '4/5', outages: '1-3', psps: 'N/A', backupNeed: 'Low', gridStress: 'Low' },
    incentives: { total: 52, federal: 30, state: 0, local: 0, macrs: 22, stateRebate: 'None', rating: 'Good' },
    battery: { recommended: false, roi: 'Marginal', payback: '10-12', reason: 'Low Rates', demandMgmt: false, backup: 'Low' }
  },
  '38101': { 
    city: 'Memphis', state: 'TN', utility: 'MLGW', gasUtility: 'MLGW',
    weather: { risk: 'Moderate', heat: 'High', drought: 'Moderate', hurricane: 'Low', tornado: 'Moderate', wildfire: 'Low', hail: 'Moderate', snow: 'Low', ice: 'Moderate', flood: 'Moderate' },
    solar: { peakSunHours: 5.0, annualOutput: 1420, rating: 'Good', climate: 'Mixed' },
    electric: { rate: 0.10, peakRate: 0.12, offPeakRate: 0.08, level: 'Low', demandCharge: 8 },
    gas: { rate: 0.78, winterRate: 1.02, level: 'Low', vsNational: '-8%' },
    grid: { rating: '3/5', outages: '2-4', psps: 'N/A', backupNeed: 'Medium', gridStress: 'Moderate' },
    incentives: { total: 52, federal: 30, state: 0, local: 0, macrs: 22, stateRebate: 'None', rating: 'Good' },
    battery: { recommended: true, roi: 'Moderate', payback: '9-11', reason: 'Storm Backup', demandMgmt: false, backup: 'Medium' }
  },
  // NORTH CAROLINA
  '27601': { 
    city: 'Raleigh', state: 'NC', utility: 'Duke Energy', gasUtility: 'Dominion Energy',
    weather: { risk: 'Moderate', heat: 'High', drought: 'Moderate', hurricane: 'Moderate', tornado: 'Moderate', wildfire: 'Low', hail: 'Moderate', snow: 'Low', ice: 'Moderate', flood: 'Moderate' },
    solar: { peakSunHours: 4.9, annualOutput: 1390, rating: 'Good', climate: 'Mixed' },
    electric: { rate: 0.12, peakRate: 0.15, offPeakRate: 0.09, level: 'Low', demandCharge: 10 },
    gas: { rate: 0.92, winterRate: 1.15, level: 'Moderate', vsNational: '+8%' },
    grid: { rating: '3/5', outages: '2-4', psps: 'N/A', backupNeed: 'Medium', gridStress: 'Moderate' },
    incentives: { total: 55, federal: 30, state: 3, local: 0, macrs: 22, stateRebate: 'NC Credit', rating: 'Good' },
    battery: { recommended: true, roi: 'Moderate', payback: '8-10', reason: 'Hurricane Risk', demandMgmt: true, backup: 'Medium' }
  },
  '28201': { 
    city: 'Charlotte', state: 'NC', utility: 'Duke Energy', gasUtility: 'Piedmont Natural Gas',
    weather: { risk: 'Moderate', heat: 'High', drought: 'Moderate', hurricane: 'Moderate', tornado: 'Low', wildfire: 'Low', hail: 'Moderate', snow: 'Low', ice: 'Moderate', flood: 'Moderate' },
    solar: { peakSunHours: 5.0, annualOutput: 1420, rating: 'Good', climate: 'Mixed' },
    electric: { rate: 0.11, peakRate: 0.14, offPeakRate: 0.08, level: 'Low', demandCharge: 10 },
    gas: { rate: 0.88, winterRate: 1.12, level: 'Moderate', vsNational: '+3%' },
    grid: { rating: '3/5', outages: '2-4', psps: 'N/A', backupNeed: 'Medium', gridStress: 'Moderate' },
    incentives: { total: 55, federal: 30, state: 3, local: 0, macrs: 22, stateRebate: 'NC Credit', rating: 'Good' },
    battery: { recommended: true, roi: 'Moderate', payback: '8-10', reason: 'Hurricane Risk', demandMgmt: true, backup: 'Medium' }
  },
  // SOUTH CAROLINA
  '29201': { 
    city: 'Columbia', state: 'SC', utility: 'Dominion Energy', gasUtility: 'Dominion Energy',
    weather: { risk: 'Moderate', heat: 'High', drought: 'Moderate', hurricane: 'Moderate', tornado: 'Moderate', wildfire: 'Low', hail: 'Moderate', snow: 'Low', ice: 'Moderate', flood: 'Moderate' },
    solar: { peakSunHours: 5.1, annualOutput: 1450, rating: 'Good', climate: 'Sunny' },
    electric: { rate: 0.13, peakRate: 0.16, offPeakRate: 0.09, level: 'Moderate', demandCharge: 11 },
    gas: { rate: 0.95, winterRate: 1.18, level: 'Moderate', vsNational: '+12%' },
    grid: { rating: '3/5', outages: '2-4', psps: 'N/A', backupNeed: 'Medium', gridStress: 'Moderate' },
    incentives: { total: 55, federal: 30, state: 3, local: 0, macrs: 22, stateRebate: 'SC Credit', rating: 'Good' },
    battery: { recommended: true, roi: 'Moderate', payback: '8-10', reason: 'Hurricane Risk', demandMgmt: true, backup: 'Medium' }
  },
  // VIRGINIA
  '23219': { 
    city: 'Richmond', state: 'VA', utility: 'Dominion Energy', gasUtility: 'Virginia Natural Gas',
    weather: { risk: 'Moderate', heat: 'Moderate', drought: 'Low', hurricane: 'Moderate', tornado: 'Low', wildfire: 'Low', hail: 'Low', snow: 'Moderate', ice: 'Moderate', flood: 'Moderate' },
    solar: { peakSunHours: 4.6, annualOutput: 1305, rating: 'Fair', climate: 'Mixed' },
    electric: { rate: 0.13, peakRate: 0.17, offPeakRate: 0.10, level: 'Moderate', demandCharge: 11 },
    gas: { rate: 0.95, winterRate: 1.22, level: 'Moderate', vsNational: '+12%' },
    grid: { rating: '3/5', outages: '2-3', psps: 'N/A', backupNeed: 'Medium', gridStress: 'Moderate' },
    incentives: { total: 52, federal: 30, state: 0, local: 0, macrs: 22, stateRebate: 'None', rating: 'Good' },
    battery: { recommended: true, roi: 'Moderate', payback: '8-10', reason: 'Hurricane Risk', demandMgmt: true, backup: 'Medium' }
  },
  // MARYLAND
  '21201': { 
    city: 'Baltimore', state: 'MD', utility: 'BGE', gasUtility: 'BGE',
    weather: { risk: 'Moderate', heat: 'Moderate', drought: 'Low', hurricane: 'Moderate', tornado: 'Low', wildfire: 'Low', hail: 'Low', snow: 'Moderate', ice: 'Moderate', flood: 'Moderate' },
    solar: { peakSunHours: 4.5, annualOutput: 1275, rating: 'Fair', climate: 'Mixed' },
    electric: { rate: 0.15, peakRate: 0.20, offPeakRate: 0.11, level: 'Moderate', demandCharge: 13 },
    gas: { rate: 1.05, winterRate: 1.35, level: 'Moderate', vsNational: '+23%' },
    grid: { rating: '3/5', outages: '2-4', psps: 'N/A', backupNeed: 'Medium', gridStress: 'Moderate' },
    incentives: { total: 55, federal: 30, state: 3, local: 0, macrs: 22, stateRebate: 'MD Solar', rating: 'Good' },
    battery: { recommended: true, roi: 'Moderate', payback: '8-10', reason: 'Storm Backup', demandMgmt: true, backup: 'Medium' }
  },
  // DC
  '20001': { 
    city: 'Washington', state: 'DC', utility: 'Pepco', gasUtility: 'Washington Gas',
    weather: { risk: 'Moderate', heat: 'Moderate', drought: 'Low', hurricane: 'Moderate', tornado: 'Low', wildfire: 'Low', hail: 'Low', snow: 'Moderate', ice: 'Moderate', flood: 'Moderate' },
    solar: { peakSunHours: 4.5, annualOutput: 1275, rating: 'Fair', climate: 'Mixed' },
    electric: { rate: 0.14, peakRate: 0.19, offPeakRate: 0.10, level: 'Moderate', demandCharge: 12 },
    gas: { rate: 1.12, winterRate: 1.45, level: 'High', vsNational: '+32%' },
    grid: { rating: '3/5', outages: '2-3', psps: 'N/A', backupNeed: 'Medium', gridStress: 'Moderate' },
    incentives: { total: 57, federal: 30, state: 5, local: 0, macrs: 22, stateRebate: 'DC SREC', rating: 'Good' },
    battery: { recommended: true, roi: 'Moderate', payback: '7-9', reason: 'Storm Backup', demandMgmt: true, backup: 'Medium' }
  },
  // NEW JERSEY
  '07101': { 
    city: 'Newark', state: 'NJ', utility: 'PSE&G', gasUtility: 'PSE&G',
    weather: { risk: 'Moderate', heat: 'Moderate', drought: 'Low', hurricane: 'Moderate', tornado: 'Low', wildfire: 'Low', hail: 'Low', snow: 'Moderate', ice: 'Moderate', flood: 'Moderate' },
    solar: { peakSunHours: 4.3, annualOutput: 1220, rating: 'Fair', climate: 'Mixed' },
    electric: { rate: 0.17, peakRate: 0.23, offPeakRate: 0.12, level: 'Moderate', demandCharge: 15 },
    gas: { rate: 1.08, winterRate: 1.42, level: 'Moderate', vsNational: '+27%' },
    grid: { rating: '3/5', outages: '2-4', psps: 'N/A', backupNeed: 'Medium', gridStress: 'Moderate' },
    incentives: { total: 60, federal: 30, state: 8, local: 0, macrs: 22, stateRebate: 'NJ SREC II', rating: 'Excellent' },
    battery: { recommended: true, roi: 'Good', payback: '6-8', reason: 'SREC + Storms', demandMgmt: true, backup: 'Medium' }
  },
  // CONNECTICUT
  '06101': { 
    city: 'Hartford', state: 'CT', utility: 'Eversource', gasUtility: 'Southern CT Gas',
    weather: { risk: 'Moderate', heat: 'Moderate', drought: 'Low', hurricane: 'Moderate', tornado: 'Low', wildfire: 'Low', hail: 'Low', snow: 'High', ice: 'Moderate', flood: 'Moderate' },
    solar: { peakSunHours: 4.2, annualOutput: 1190, rating: 'Fair', climate: 'Mixed' },
    electric: { rate: 0.27, peakRate: 0.35, offPeakRate: 0.18, level: 'High', demandCharge: 19 },
    gas: { rate: 1.52, winterRate: 1.95, level: 'Very High', vsNational: '+78%' },
    grid: { rating: '3/5', outages: '2-4', psps: 'N/A', backupNeed: 'Medium', gridStress: 'Moderate' },
    incentives: { total: 57, federal: 30, state: 5, local: 0, macrs: 22, stateRebate: 'CT Green Bank', rating: 'Good' },
    battery: { recommended: true, roi: 'Good', payback: '5-7', reason: 'High Rates', demandMgmt: true, backup: 'Medium' }
  },
  // OREGON
  '97201': { 
    city: 'Portland', state: 'OR', utility: 'PGE', gasUtility: 'NW Natural',
    weather: { risk: 'Low', heat: 'Low', drought: 'Moderate', hurricane: 'Low', tornado: 'Low', wildfire: 'Moderate', hail: 'Low', snow: 'Low', ice: 'Low', flood: 'Moderate' },
    solar: { peakSunHours: 4.0, annualOutput: 1135, rating: 'Fair', climate: 'Cloudy' },
    electric: { rate: 0.12, peakRate: 0.15, offPeakRate: 0.09, level: 'Low', demandCharge: 10 },
    gas: { rate: 1.08, winterRate: 1.35, level: 'Moderate', vsNational: '+27%' },
    grid: { rating: '4/5', outages: '1-2', psps: 'N/A', backupNeed: 'Low', gridStress: 'Low' },
    incentives: { total: 57, federal: 30, state: 5, local: 0, macrs: 22, stateRebate: 'OR Rebate', rating: 'Good' },
    battery: { recommended: false, roi: 'Marginal', payback: '10-12', reason: 'Stable Grid', demandMgmt: true, backup: 'Low' }
  },
  // LOUISIANA
  '70112': { 
    city: 'New Orleans', state: 'LA', utility: 'Entergy', gasUtility: 'Entergy',
    weather: { risk: 'High', heat: 'High', drought: 'Low', hurricane: 'Extreme', tornado: 'Moderate', wildfire: 'Low', hail: 'Low', snow: 'Low', ice: 'Low', flood: 'High' },
    solar: { peakSunHours: 5.2, annualOutput: 1475, rating: 'Good', climate: 'Humid' },
    electric: { rate: 0.12, peakRate: 0.15, offPeakRate: 0.09, level: 'Low', demandCharge: 10 },
    gas: { rate: 0.85, winterRate: 1.05, level: 'Moderate', vsNational: '+0%' },
    grid: { rating: '2/5', outages: '6-10', psps: 'N/A', backupNeed: 'Critical', gridStress: 'High' },
    incentives: { total: 52, federal: 30, state: 0, local: 0, macrs: 22, stateRebate: 'None', rating: 'Good' },
    battery: { recommended: true, roi: 'Excellent', payback: '4-6', reason: 'Hurricane Critical', demandMgmt: false, backup: 'Critical' }
  },
  // ALABAMA
  '35203': { 
    city: 'Birmingham', state: 'AL', utility: 'Alabama Power', gasUtility: 'Spire',
    weather: { risk: 'Moderate', heat: 'High', drought: 'Moderate', hurricane: 'Moderate', tornado: 'High', wildfire: 'Low', hail: 'Moderate', snow: 'Low', ice: 'Moderate', flood: 'Moderate' },
    solar: { peakSunHours: 5.0, annualOutput: 1420, rating: 'Good', climate: 'Mixed' },
    electric: { rate: 0.13, peakRate: 0.16, offPeakRate: 0.09, level: 'Moderate', demandCharge: 11 },
    gas: { rate: 0.92, winterRate: 1.15, level: 'Moderate', vsNational: '+8%' },
    grid: { rating: '3/5', outages: '2-4', psps: 'N/A', backupNeed: 'Medium', gridStress: 'Moderate' },
    incentives: { total: 52, federal: 30, state: 0, local: 0, macrs: 22, stateRebate: 'None', rating: 'Good' },
    battery: { recommended: true, roi: 'Moderate', payback: '8-10', reason: 'Tornado Risk', demandMgmt: false, backup: 'High' }
  },
  // KENTUCKY
  '40201': { 
    city: 'Louisville', state: 'KY', utility: 'LG&E', gasUtility: 'LG&E',
    weather: { risk: 'Moderate', heat: 'Moderate', drought: 'Low', hurricane: 'Low', tornado: 'Moderate', wildfire: 'Low', hail: 'Moderate', snow: 'Moderate', ice: 'Moderate', flood: 'Moderate' },
    solar: { peakSunHours: 4.5, annualOutput: 1275, rating: 'Fair', climate: 'Mixed' },
    electric: { rate: 0.11, peakRate: 0.13, offPeakRate: 0.08, level: 'Low', demandCharge: 9 },
    gas: { rate: 0.78, winterRate: 1.02, level: 'Low', vsNational: '-8%' },
    grid: { rating: '4/5', outages: '1-2', psps: 'N/A', backupNeed: 'Low', gridStress: 'Low' },
    incentives: { total: 52, federal: 30, state: 0, local: 0, macrs: 22, stateRebate: 'None', rating: 'Good' },
    battery: { recommended: false, roi: 'Marginal', payback: '11-13', reason: 'Low Rates', demandMgmt: false, backup: 'Low' }
  },
  // UTAH
  '84101': { 
    city: 'Salt Lake City', state: 'UT', utility: 'Rocky Mountain Power', gasUtility: 'Dominion Energy',
    weather: { risk: 'Moderate', heat: 'High', drought: 'High', hurricane: 'Low', tornado: 'Low', wildfire: 'Moderate', hail: 'Moderate', snow: 'Moderate', ice: 'Moderate', flood: 'Low' },
    solar: { peakSunHours: 5.5, annualOutput: 1560, rating: 'Excellent', climate: 'Sunny' },
    electric: { rate: 0.11, peakRate: 0.14, offPeakRate: 0.08, level: 'Low', demandCharge: 9 },
    gas: { rate: 0.78, winterRate: 1.02, level: 'Low', vsNational: '-8%' },
    grid: { rating: '4/5', outages: '1-2', psps: 'N/A', backupNeed: 'Low', gridStress: 'Low' },
    incentives: { total: 52, federal: 30, state: 0, local: 0, macrs: 22, stateRebate: 'None', rating: 'Good' },
    battery: { recommended: false, roi: 'Marginal', payback: '10-12', reason: 'Low Rates', demandMgmt: true, backup: 'Low' }
  },
  // NEVADA (already have Henderson/Vegas, adding Reno)
  '89501': { 
    city: 'Reno', state: 'NV', utility: 'NV Energy', gasUtility: 'Southwest Gas',
    weather: { risk: 'Moderate', heat: 'Moderate', drought: 'High', hurricane: 'Low', tornado: 'Low', wildfire: 'High', hail: 'Low', snow: 'Moderate', ice: 'Moderate', flood: 'Low' },
    solar: { peakSunHours: 6.0, annualOutput: 1700, rating: 'Excellent', climate: 'Sunny' },
    electric: { rate: 0.11, peakRate: 0.16, offPeakRate: 0.07, level: 'Low', demandCharge: 10 },
    gas: { rate: 0.95, winterRate: 1.18, level: 'Moderate', vsNational: '+12%' },
    grid: { rating: '3/5', outages: '2-3', psps: 'Moderate', backupNeed: 'Medium', gridStress: 'Moderate' },
    incentives: { total: 52, federal: 30, state: 0, local: 0, macrs: 22, stateRebate: 'None', rating: 'Good' },
    battery: { recommended: true, roi: 'Moderate', payback: '8-10', reason: 'Wildfire + TOU', demandMgmt: true, backup: 'Medium' }
  },
  // SAN DIEGO
  '92101': { 
    city: 'San Diego', state: 'CA', utility: 'SDG&E', gasUtility: 'SDG&E',
    weather: { risk: 'Moderate', heat: 'Moderate', drought: 'High', hurricane: 'Low', tornado: 'Low', wildfire: 'High', hail: 'Low', snow: 'Low', ice: 'Low', flood: 'Low' },
    solar: { peakSunHours: 5.7, annualOutput: 1620, rating: 'Excellent', climate: 'Sunny' },
    electric: { rate: 0.35, peakRate: 0.55, offPeakRate: 0.25, level: 'Very High', demandCharge: 28 },
    gas: { rate: 1.65, winterRate: 2.05, level: 'Very High', vsNational: '+94%' },
    grid: { rating: '2/5', outages: '4-6', psps: 'High', backupNeed: 'High', gridStress: 'High' },
    incentives: { total: 56, federal: 30, state: 4, local: 0, macrs: 22, stateRebate: 'SGIP', rating: 'Excellent' },
    battery: { recommended: true, roi: 'Excellent', payback: '3-5', reason: 'PSPS + Extreme TOU', demandMgmt: true, backup: 'Critical' }
  },
  // LOS ANGELES (additional to Beverly Hills)
  '90001': { 
    city: 'Los Angeles', state: 'CA', utility: 'LADWP', gasUtility: 'SoCalGas',
    weather: { risk: 'High', heat: 'Moderate', drought: 'High', hurricane: 'Low', tornado: 'Low', wildfire: 'High', hail: 'Low', snow: 'Low', ice: 'Low', flood: 'Moderate' },
    solar: { peakSunHours: 5.6, annualOutput: 1590, rating: 'Excellent', climate: 'Sunny' },
    electric: { rate: 0.22, peakRate: 0.32, offPeakRate: 0.14, level: 'High', demandCharge: 18 },
    gas: { rate: 1.45, winterRate: 1.85, level: 'Very High', vsNational: '+70%' },
    grid: { rating: '3/5', outages: '3-5', psps: 'Moderate', backupNeed: 'High', gridStress: 'High' },
    incentives: { total: 56, federal: 30, state: 4, local: 0, macrs: 22, stateRebate: 'SGIP', rating: 'Excellent' },
    battery: { recommended: true, roi: 'Excellent', payback: '4-6', reason: 'High TOU + Wildfire', demandMgmt: true, backup: 'High' }
  },
  // SACRAMENTO
  '95814': { 
    city: 'Sacramento', state: 'CA', utility: 'SMUD', gasUtility: 'PG&E',
    weather: { risk: 'Moderate', heat: 'High', drought: 'High', hurricane: 'Low', tornado: 'Low', wildfire: 'Moderate', hail: 'Low', snow: 'Low', ice: 'Low', flood: 'Moderate' },
    solar: { peakSunHours: 5.5, annualOutput: 1560, rating: 'Excellent', climate: 'Sunny' },
    electric: { rate: 0.16, peakRate: 0.28, offPeakRate: 0.12, level: 'Moderate', demandCharge: 14 },
    gas: { rate: 1.48, winterRate: 1.88, level: 'Very High', vsNational: '+74%' },
    grid: { rating: '3/5', outages: '2-4', psps: 'Moderate', backupNeed: 'Medium', gridStress: 'Moderate' },
    incentives: { total: 56, federal: 30, state: 4, local: 0, macrs: 22, stateRebate: 'SGIP', rating: 'Excellent' },
    battery: { recommended: true, roi: 'Good', payback: '5-7', reason: 'High TOU Spread', demandMgmt: true, backup: 'Medium' }
  },
  // ORIGINAL ENTRIES
  '89052': { 
    city: 'Henderson', state: 'NV', utility: 'NV Energy', gasUtility: 'Southwest Gas',
    weather: { risk: 'High', heat: 'High', drought: 'High', hurricane: 'Low', tornado: 'Low', wildfire: 'Moderate', hail: 'Low', snow: 'Low', ice: 'Low', flood: 'Low' },
    solar: { peakSunHours: 6.4, annualOutput: 1820, rating: 'Excellent', climate: 'Sunny' },
    electric: { rate: 0.12, peakRate: 0.18, offPeakRate: 0.08, level: 'Low', demandCharge: 12 },
    gas: { rate: 0.95, winterRate: 1.09, level: 'Moderate', vsNational: '+12%' },
    grid: { rating: '3/5', outages: '3-4', psps: 'N/A', backupNeed: 'Medium', gridStress: 'Moderate' },
    incentives: { total: 52, federal: 30, state: 0, local: 0, macrs: 22, stateRebate: 'None', rating: 'Good' },
    battery: { recommended: true, roi: 'Moderate', payback: '8-10', reason: 'TOU Arbitrage', demandMgmt: true, backup: 'Medium' }
  },
  '89101': { 
    city: 'Las Vegas', state: 'NV', utility: 'NV Energy', gasUtility: 'Southwest Gas',
    weather: { risk: 'High', heat: 'High', drought: 'High', hurricane: 'Low', tornado: 'Low', wildfire: 'Moderate', hail: 'Low', snow: 'Low', ice: 'Low', flood: 'Low' },
    solar: { peakSunHours: 6.5, annualOutput: 1850, rating: 'Excellent', climate: 'Sunny' },
    electric: { rate: 0.11, peakRate: 0.17, offPeakRate: 0.07, level: 'Low', demandCharge: 11 },
    gas: { rate: 0.92, winterRate: 1.05, level: 'Moderate', vsNational: '+8%' },
    grid: { rating: '3/5', outages: '2-3', psps: 'N/A', backupNeed: 'Medium', gridStress: 'Moderate' },
    incentives: { total: 52, federal: 30, state: 0, local: 0, macrs: 22, stateRebate: 'None', rating: 'Good' },
    battery: { recommended: true, roi: 'Moderate', payback: '8-10', reason: 'TOU Arbitrage', demandMgmt: true, backup: 'Medium' }
  },
  '90210': { 
    city: 'Beverly Hills', state: 'CA', utility: 'SCE', gasUtility: 'SoCalGas',
    weather: { risk: 'High', heat: 'Moderate', drought: 'High', hurricane: 'Low', tornado: 'Low', wildfire: 'High', hail: 'Low', snow: 'Low', ice: 'Low', flood: 'Moderate' },
    solar: { peakSunHours: 5.8, annualOutput: 1650, rating: 'Excellent', climate: 'Sunny' },
    electric: { rate: 0.28, peakRate: 0.42, offPeakRate: 0.18, level: 'Very High', demandCharge: 23 },
    gas: { rate: 1.45, winterRate: 1.85, level: 'Very High', vsNational: '+65%' },
    grid: { rating: '2/5', outages: '5-8', psps: 'High', backupNeed: 'High', gridStress: 'High' },
    incentives: { total: 56, federal: 30, state: 4, local: 0, macrs: 22, stateRebate: 'SGIP', rating: 'Excellent' },
    battery: { recommended: true, roi: 'Excellent', payback: '4-6', reason: 'PSPS + High TOU', demandMgmt: true, backup: 'Critical' }
  },
  '94102': { 
    city: 'San Francisco', state: 'CA', utility: 'PG&E', gasUtility: 'PG&E',
    weather: { risk: 'Moderate', heat: 'Low', drought: 'Moderate', hurricane: 'Low', tornado: 'Low', wildfire: 'Moderate', hail: 'Low', snow: 'Low', ice: 'Low', flood: 'Low' },
    solar: { peakSunHours: 5.2, annualOutput: 1480, rating: 'Good', climate: 'Mild' },
    electric: { rate: 0.32, peakRate: 0.48, offPeakRate: 0.22, level: 'Very High', demandCharge: 25 },
    gas: { rate: 1.55, winterRate: 1.95, level: 'Very High', vsNational: '+82%' },
    grid: { rating: '2/5', outages: '4-6', psps: 'High', backupNeed: 'High', gridStress: 'High' },
    incentives: { total: 58, federal: 30, state: 6, local: 0, macrs: 22, stateRebate: 'SGIP+Local', rating: 'Excellent' },
    battery: { recommended: true, roi: 'Excellent', payback: '3-5', reason: 'PSPS + Extreme TOU', demandMgmt: true, backup: 'Critical' }
  },
  '85001': { 
    city: 'Phoenix', state: 'AZ', utility: 'APS', gasUtility: 'Southwest Gas',
    weather: { risk: 'High', heat: 'Extreme', drought: 'High', hurricane: 'Low', tornado: 'Low', wildfire: 'Moderate', hail: 'Moderate', snow: 'Low', ice: 'Low', flood: 'Moderate' },
    solar: { peakSunHours: 6.6, annualOutput: 1880, rating: 'Excellent', climate: 'Sunny' },
    electric: { rate: 0.13, peakRate: 0.22, offPeakRate: 0.08, level: 'Moderate', demandCharge: 13 },
    gas: { rate: 0.88, winterRate: 1.02, level: 'Moderate', vsNational: '+3%' },
    grid: { rating: '3/5', outages: '2-4', psps: 'N/A', backupNeed: 'High', gridStress: 'High' },
    incentives: { total: 55, federal: 30, state: 3, local: 0, macrs: 22, stateRebate: 'AZ Credit', rating: 'Good' },
    battery: { recommended: true, roi: 'Good', payback: '6-8', reason: 'Peak Demand + Heat', demandMgmt: true, backup: 'High' }
  },
  '75001': { 
    city: 'Dallas', state: 'TX', utility: 'Oncor', gasUtility: 'Atmos Energy',
    weather: { risk: 'High', heat: 'High', drought: 'Moderate', hurricane: 'Low', tornado: 'High', wildfire: 'Moderate', hail: 'High', snow: 'Low', ice: 'Moderate', flood: 'Moderate' },
    solar: { peakSunHours: 5.5, annualOutput: 1565, rating: 'Excellent', climate: 'Mixed' },
    electric: { rate: 0.12, peakRate: 0.15, offPeakRate: 0.09, level: 'Low', demandCharge: 10 },
    gas: { rate: 0.75, winterRate: 0.95, level: 'Low', vsNational: '-12%' },
    grid: { rating: '2/5', outages: '4-6', psps: 'N/A', backupNeed: 'High', gridStress: 'High' },
    incentives: { total: 52, federal: 30, state: 0, local: 0, macrs: 22, stateRebate: 'None', rating: 'Good' },
    battery: { recommended: true, roi: 'Good', payback: '7-9', reason: 'Grid Instability', demandMgmt: false, backup: 'Critical' }
  },
  '77001': { 
    city: 'Houston', state: 'TX', utility: 'CenterPoint', gasUtility: 'CenterPoint',
    weather: { risk: 'High', heat: 'High', drought: 'Low', hurricane: 'High', tornado: 'Moderate', wildfire: 'Low', hail: 'Moderate', snow: 'Low', ice: 'Low', flood: 'High' },
    solar: { peakSunHours: 5.2, annualOutput: 1480, rating: 'Good', climate: 'Humid' },
    electric: { rate: 0.11, peakRate: 0.14, offPeakRate: 0.08, level: 'Low', demandCharge: 9 },
    gas: { rate: 0.72, winterRate: 0.88, level: 'Low', vsNational: '-15%' },
    grid: { rating: '2/5', outages: '5-8', psps: 'N/A', backupNeed: 'High', gridStress: 'Moderate' },
    incentives: { total: 52, federal: 30, state: 0, local: 0, macrs: 22, stateRebate: 'None', rating: 'Good' },
    battery: { recommended: true, roi: 'Good', payback: '6-8', reason: 'Hurricane Backup', demandMgmt: false, backup: 'Critical' }
  },
  '33101': { 
    city: 'Miami', state: 'FL', utility: 'FPL', gasUtility: 'TECO',
    weather: { risk: 'High', heat: 'High', drought: 'Low', hurricane: 'Extreme', tornado: 'Moderate', wildfire: 'Low', hail: 'Low', snow: 'Low', ice: 'Low', flood: 'High' },
    solar: { peakSunHours: 5.6, annualOutput: 1600, rating: 'Excellent', climate: 'Sunny' },
    electric: { rate: 0.13, peakRate: 0.16, offPeakRate: 0.10, level: 'Moderate', demandCharge: 11 },
    gas: { rate: 1.25, winterRate: 1.35, level: 'High', vsNational: '+47%' },
    grid: { rating: '3/5', outages: '3-5', psps: 'N/A', backupNeed: 'High', gridStress: 'Moderate' },
    incentives: { total: 52, federal: 30, state: 0, local: 0, macrs: 22, stateRebate: 'None', rating: 'Good' },
    battery: { recommended: true, roi: 'Excellent', payback: '5-7', reason: 'Hurricane Critical', demandMgmt: false, backup: 'Critical' }
  },
  '10001': { 
    city: 'New York', state: 'NY', utility: 'Con Edison', gasUtility: 'Con Edison',
    weather: { risk: 'Moderate', heat: 'Moderate', drought: 'Low', hurricane: 'Moderate', tornado: 'Low', wildfire: 'Low', hail: 'Low', snow: 'Moderate', ice: 'Moderate', flood: 'Moderate' },
    solar: { peakSunHours: 4.2, annualOutput: 1200, rating: 'Fair', climate: 'Mixed' },
    electric: { rate: 0.24, peakRate: 0.32, offPeakRate: 0.18, level: 'High', demandCharge: 20 },
    gas: { rate: 1.35, winterRate: 1.75, level: 'High', vsNational: '+58%' },
    grid: { rating: '3/5', outages: '2-3', psps: 'N/A', backupNeed: 'Medium', gridStress: 'Moderate' },
    incentives: { total: 62, federal: 30, state: 10, local: 0, macrs: 22, stateRebate: 'NY-Sun+', rating: 'Excellent' },
    battery: { recommended: true, roi: 'Good', payback: '6-8', reason: 'High TOU + Demand', demandMgmt: true, backup: 'Medium' }
  },
  '60601': { 
    city: 'Chicago', state: 'IL', utility: 'ComEd', gasUtility: 'Peoples Gas',
    weather: { risk: 'Moderate', heat: 'Moderate', drought: 'Low', hurricane: 'Low', tornado: 'Moderate', wildfire: 'Low', hail: 'Moderate', snow: 'High', ice: 'High', flood: 'Moderate' },
    solar: { peakSunHours: 4.4, annualOutput: 1250, rating: 'Fair', climate: 'Mixed' },
    electric: { rate: 0.15, peakRate: 0.19, offPeakRate: 0.11, level: 'Moderate', demandCharge: 14 },
    gas: { rate: 0.95, winterRate: 1.25, level: 'Moderate', vsNational: '+12%' },
    grid: { rating: '4/5', outages: '1-2', psps: 'N/A', backupNeed: 'Low', gridStress: 'Low' },
    incentives: { total: 57, federal: 30, state: 5, local: 0, macrs: 22, stateRebate: 'IL Shines', rating: 'Good' },
    battery: { recommended: false, roi: 'Marginal', payback: '10-12', reason: 'Low TOU Spread', demandMgmt: true, backup: 'Low' }
  },
  '98101': { 
    city: 'Seattle', state: 'WA', utility: 'Seattle City Light', gasUtility: 'PSE',
    weather: { risk: 'Low', heat: 'Low', drought: 'Low', hurricane: 'Low', tornado: 'Low', wildfire: 'Moderate', hail: 'Low', snow: 'Low', ice: 'Low', flood: 'Moderate' },
    solar: { peakSunHours: 3.8, annualOutput: 1080, rating: 'Fair', climate: 'Cloudy' },
    electric: { rate: 0.11, peakRate: 0.13, offPeakRate: 0.09, level: 'Low', demandCharge: 8 },
    gas: { rate: 1.15, winterRate: 1.45, level: 'High', vsNational: '+35%' },
    grid: { rating: '4/5', outages: '1-2', psps: 'N/A', backupNeed: 'Low', gridStress: 'Low' },
    incentives: { total: 52, federal: 30, state: 0, local: 0, macrs: 22, stateRebate: 'None', rating: 'Good' },
    battery: { recommended: false, roi: 'Poor', payback: '12-15', reason: 'Low Rates/Reliable', demandMgmt: false, backup: 'Low' }
  },
  '80202': { 
    city: 'Denver', state: 'CO', utility: 'Xcel Energy', gasUtility: 'Xcel Energy',
    weather: { risk: 'Moderate', heat: 'Moderate', drought: 'Moderate', hurricane: 'Low', tornado: 'Moderate', wildfire: 'Moderate', hail: 'High', snow: 'Moderate', ice: 'Moderate', flood: 'Low' },
    solar: { peakSunHours: 5.5, annualOutput: 1560, rating: 'Excellent', climate: 'Sunny' },
    electric: { rate: 0.14, peakRate: 0.18, offPeakRate: 0.10, level: 'Moderate', demandCharge: 12 },
    gas: { rate: 0.82, winterRate: 1.05, level: 'Moderate', vsNational: '-4%' },
    grid: { rating: '4/5', outages: '1-2', psps: 'N/A', backupNeed: 'Low', gridStress: 'Low' },
    incentives: { total: 52, federal: 30, state: 0, local: 0, macrs: 22, stateRebate: 'None', rating: 'Good' },
    battery: { recommended: false, roi: 'Marginal', payback: '9-11', reason: 'Stable Grid', demandMgmt: true, backup: 'Low' }
  },
  '30301': { 
    city: 'Atlanta', state: 'GA', utility: 'Georgia Power', gasUtility: 'Atlanta Gas Light',
    weather: { risk: 'Moderate', heat: 'High', drought: 'Moderate', hurricane: 'Moderate', tornado: 'Moderate', wildfire: 'Low', hail: 'Moderate', snow: 'Low', ice: 'Moderate', flood: 'Moderate' },
    solar: { peakSunHours: 5.0, annualOutput: 1420, rating: 'Good', climate: 'Mixed' },
    electric: { rate: 0.13, peakRate: 0.17, offPeakRate: 0.09, level: 'Moderate', demandCharge: 11 },
    gas: { rate: 0.98, winterRate: 1.18, level: 'Moderate', vsNational: '+15%' },
    grid: { rating: '3/5', outages: '2-4', psps: 'N/A', backupNeed: 'Medium', gridStress: 'Moderate' },
    incentives: { total: 52, federal: 30, state: 0, local: 0, macrs: 22, stateRebate: 'None', rating: 'Good' },
    battery: { recommended: true, roi: 'Moderate', payback: '8-10', reason: 'Storm Backup', demandMgmt: true, backup: 'Medium' }
  },
};

// Create city-to-ZIP lookup map from zipDatabase
const cityToZipMap = {};
Object.entries(zipDatabase).forEach(([zip, data]) => {
  cityToZipMap[data.city.toLowerCase()] = { zip, ...data };
});

// City search function using zipDatabase
const searchCities = (query) => {
  if (!query || query.length < 2) return [];
  const normalizedQuery = query.toLowerCase().trim();
  return Object.entries(cityToZipMap)
    .filter(([city]) => city.startsWith(normalizedQuery))
    .slice(0, 8)
    .map(([city, data]) => ({ city: data.city, zip: data.zip, state: data.state, display: `${data.city}, ${data.state}` }));
};


// Function to lookup utility data by ZIP code
const getUtilityByZip = (zipCode) => {
  const prefix = zipCode.substring(0, 3);
  const state = ZIP_PREFIX_TO_STATE[prefix];
  
  if (!state) {
    return {
      electric: { utility: 'Local Electric Utility', peakRate: 0.15, offPeakRate: 0.08, demandCharge: 10.00, avgRate: 0.12, logo: null },
      gas: { utility: 'Local Gas Utility', rate: 1.00, deliveryCharge: 0.40, avgMonthly: 60, logo: null },
      state: 'US',
      stateName: 'United States',
      city: '',
      region: `ZIP ${zipCode}`
    };
  }
  
  const stateData = STATE_UTILITIES[state];
  const override = ZIP_OVERRIDES[zipCode];
  
  // Extract city from region if available (format: "City, ST")
  let city = '';
  if (override?.region) {
    const match = override.region.match(/^([^,]+),/);
    if (match) city = match[1];
  }
  
  return {
    electric: override?.electric || stateData.electric,
    gas: override?.gas || stateData.gas,
    state: state,
    stateName: stateData.stateName,
    city: city,
    region: override?.region || `${stateData.stateName} (${zipCode})`
  };
};

const SOLAR_DATA = {
  'AL': { irradiance: 4.8, peakSunHours: 4.5, annualProduction: 1350, weatherRisk: 'moderate' },
  'AK': { irradiance: 3.0, peakSunHours: 2.8, annualProduction: 840, weatherRisk: 'high' },
  'AZ': { irradiance: 6.5, peakSunHours: 6.2, annualProduction: 1860, weatherRisk: 'low' },
  'AR': { irradiance: 4.6, peakSunHours: 4.4, annualProduction: 1320, weatherRisk: 'moderate' },
  'CA': { irradiance: 5.8, peakSunHours: 5.5, annualProduction: 1650, weatherRisk: 'low' },
  'CO': { irradiance: 5.5, peakSunHours: 5.2, annualProduction: 1560, weatherRisk: 'low' },
  'CT': { irradiance: 4.0, peakSunHours: 3.8, annualProduction: 1140, weatherRisk: 'moderate' },
  'DE': { irradiance: 4.3, peakSunHours: 4.1, annualProduction: 1230, weatherRisk: 'moderate' },
  'DC': { irradiance: 4.2, peakSunHours: 4.0, annualProduction: 1200, weatherRisk: 'moderate' },
  'FL': { irradiance: 5.4, peakSunHours: 5.1, annualProduction: 1530, weatherRisk: 'moderate' },
  'GA': { irradiance: 5.0, peakSunHours: 4.8, annualProduction: 1440, weatherRisk: 'moderate' },
  'HI': { irradiance: 5.5, peakSunHours: 5.2, annualProduction: 1560, weatherRisk: 'low' },
  'ID': { irradiance: 5.0, peakSunHours: 4.8, annualProduction: 1440, weatherRisk: 'moderate' },
  'IL': { irradiance: 4.3, peakSunHours: 4.1, annualProduction: 1230, weatherRisk: 'moderate' },
  'IN': { irradiance: 4.2, peakSunHours: 4.0, annualProduction: 1200, weatherRisk: 'moderate' },
  'IA': { irradiance: 4.4, peakSunHours: 4.2, annualProduction: 1260, weatherRisk: 'moderate' },
  'KS': { irradiance: 5.2, peakSunHours: 5.0, annualProduction: 1500, weatherRisk: 'moderate' },
  'KY': { irradiance: 4.4, peakSunHours: 4.2, annualProduction: 1260, weatherRisk: 'moderate' },
  'LA': { irradiance: 5.0, peakSunHours: 4.8, annualProduction: 1440, weatherRisk: 'moderate' },
  'ME': { irradiance: 4.0, peakSunHours: 3.8, annualProduction: 1140, weatherRisk: 'high' },
  'MD': { irradiance: 4.3, peakSunHours: 4.1, annualProduction: 1230, weatherRisk: 'moderate' },
  'MA': { irradiance: 4.0, peakSunHours: 3.8, annualProduction: 1140, weatherRisk: 'moderate' },
  'MI': { irradiance: 4.2, peakSunHours: 4.0, annualProduction: 1200, weatherRisk: 'moderate' },
  'MN': { irradiance: 4.3, peakSunHours: 4.1, annualProduction: 1230, weatherRisk: 'moderate' },
  'MS': { irradiance: 5.0, peakSunHours: 4.8, annualProduction: 1440, weatherRisk: 'moderate' },
  'MO': { irradiance: 4.6, peakSunHours: 4.4, annualProduction: 1320, weatherRisk: 'moderate' },
  'MT': { irradiance: 4.8, peakSunHours: 4.5, annualProduction: 1350, weatherRisk: 'moderate' },
  'NE': { irradiance: 5.0, peakSunHours: 4.8, annualProduction: 1440, weatherRisk: 'moderate' },
  'NV': { irradiance: 6.2, peakSunHours: 5.9, annualProduction: 1770, weatherRisk: 'low' },
  'NH': { irradiance: 4.0, peakSunHours: 3.8, annualProduction: 1140, weatherRisk: 'moderate' },
  'NJ': { irradiance: 4.2, peakSunHours: 4.0, annualProduction: 1200, weatherRisk: 'moderate' },
  'NM': { irradiance: 6.3, peakSunHours: 6.0, annualProduction: 1800, weatherRisk: 'low' },
  'NY': { irradiance: 4.0, peakSunHours: 3.8, annualProduction: 1140, weatherRisk: 'moderate' },
  'NC': { irradiance: 4.8, peakSunHours: 4.5, annualProduction: 1350, weatherRisk: 'moderate' },
  'ND': { irradiance: 4.5, peakSunHours: 4.3, annualProduction: 1290, weatherRisk: 'moderate' },
  'OH': { irradiance: 4.0, peakSunHours: 3.8, annualProduction: 1140, weatherRisk: 'moderate' },
  'OK': { irradiance: 5.3, peakSunHours: 5.0, annualProduction: 1500, weatherRisk: 'moderate' },
  'OR': { irradiance: 4.2, peakSunHours: 4.0, annualProduction: 1200, weatherRisk: 'high' },
  'PA': { irradiance: 4.0, peakSunHours: 3.8, annualProduction: 1140, weatherRisk: 'moderate' },
  'RI': { irradiance: 4.0, peakSunHours: 3.8, annualProduction: 1140, weatherRisk: 'moderate' },
  'SC': { irradiance: 5.0, peakSunHours: 4.8, annualProduction: 1440, weatherRisk: 'moderate' },
  'SD': { irradiance: 4.8, peakSunHours: 4.5, annualProduction: 1350, weatherRisk: 'moderate' },
  'TN': { irradiance: 4.6, peakSunHours: 4.4, annualProduction: 1320, weatherRisk: 'moderate' },
  'TX': { irradiance: 5.5, peakSunHours: 5.2, annualProduction: 1560, weatherRisk: 'low' },
  'UT': { irradiance: 5.6, peakSunHours: 5.3, annualProduction: 1590, weatherRisk: 'low' },
  'VT': { irradiance: 3.9, peakSunHours: 3.7, annualProduction: 1110, weatherRisk: 'high' },
  'VA': { irradiance: 4.5, peakSunHours: 4.3, annualProduction: 1290, weatherRisk: 'moderate' },
  'WA': { irradiance: 3.8, peakSunHours: 3.6, annualProduction: 1080, weatherRisk: 'high' },
  'WV': { irradiance: 4.2, peakSunHours: 4.0, annualProduction: 1200, weatherRisk: 'moderate' },
  'WI': { irradiance: 4.2, peakSunHours: 4.0, annualProduction: 1200, weatherRisk: 'moderate' },
  'WY': { irradiance: 5.3, peakSunHours: 5.0, annualProduction: 1500, weatherRisk: 'moderate' },
  'default': { irradiance: 4.5, peakSunHours: 4.3, annualProduction: 1290, weatherRisk: 'moderate' }
};

// ── FIX SYNC-14: ITC constants — derived from merlinConstants.js SSOT ────────
// §48E base: 30% (2025-2032) | §45(b)(9) domestic: +10% | §48E(d)(3) prevailing wage: required >1MW
const ITC_BASE_RATE = ITC_RATE;                          // Alias — merlinConstants SSOT
const ITC_DEFAULT = ITC_RATE;                             // Conservative: 30% base (domestic bonus shown as upside)
const ITC_NET_MULTIPLIER = 1 - ITC_RATE;                  // 0.70 — net cost after ITC
const ITC_WITH_DOMESTIC = 1 - (ITC_RATE + ITC_DOMESTIC_BONUS); // 0.60 — if domestic qualified
// §30C EV credit aliases
const EV_CREDIT_RATE = EV_CHARGER_CREDIT_RATE;           // 0.30
const EV_CREDIT_MAX = EV_CHARGER_CREDIT_MAX;             // $100K

// ── FIX A-8 + SYNC-8: State incentives — full 50-state + DC table (aligned with WizB) ──
// Source: DSIRE database, state energy offices (Feb 2026)
// ⚠️ Programs expire, get defunded, or change annually. Point-in-time estimates.
const STATE_INCENTIVES_A = {
  // Northeast
  CT: { solarPerKW: 150, bessPerKWh: 200, maxBess: 50000, notes: 'RSIP residential + commercial' },
  DC: { solarPerKW: 100, bessPerKWh: 0, maxBess: 0, notes: 'DCSEU SREC program' },
  MA: { solarPerKW: 100, bessPerKWh: 250, maxBess: 75000, notes: 'SMART program + storage' },
  MD: { solarPerKW: 100, bessPerKWh: 150, maxBess: 30000, notes: 'SEIF + MEA programs' },
  ME: { solarPerKW: 30, bessPerKWh: 50, maxBess: 15000, notes: 'Efficiency Maine' },
  NH: { solarPerKW: 25, bessPerKWh: 0, maxBess: 0, notes: 'Commercial solar rebate (limited)' },
  NJ: { solarPerKW: 85, bessPerKWh: 100, maxBess: 30000, notes: 'SuSI + storage incentive' },
  NY: { solarPerKW: 200, bessPerKWh: 200, maxBess: 50000, notes: 'NY-Sun + storage adders' },
  PA: { solarPerKW: 25, bessPerKWh: 50, maxBess: 15000, notes: 'SREC + some utilities' },
  RI: { solarPerKW: 75, bessPerKWh: 100, maxBess: 20000, notes: 'REF commercial incentives' },
  VT: { solarPerKW: 50, bessPerKWh: 100, maxBess: 20000, notes: 'Bring Your Own Device' },
  // Southeast
  AL: { solarPerKW: 0, bessPerKWh: 0, maxBess: 0, notes: 'TVA programs only' },
  AR: { solarPerKW: 0, bessPerKWh: 0, maxBess: 0, notes: 'Net metering only' },
  DE: { solarPerKW: 25, bessPerKWh: 0, maxBess: 0, notes: 'Green Energy Fund (limited)' },
  FL: { solarPerKW: 0, bessPerKWh: 0, maxBess: 0, notes: 'Net metering, no state rebate' },
  GA: { solarPerKW: 0, bessPerKWh: 0, maxBess: 0, notes: 'Limited state programs' },
  KY: { solarPerKW: 0, bessPerKWh: 0, maxBess: 0, notes: 'No state incentive' },
  LA: { solarPerKW: 0, bessPerKWh: 0, maxBess: 0, notes: 'Tax credit expired 2025' },
  MS: { solarPerKW: 0, bessPerKWh: 0, maxBess: 0, notes: 'No state incentive' },
  NC: { solarPerKW: 25, bessPerKWh: 0, maxBess: 0, notes: 'Duke Energy rebates' },
  SC: { solarPerKW: 15, bessPerKWh: 0, maxBess: 0, notes: 'State tax credit 25%' },
  TN: { solarPerKW: 0, bessPerKWh: 0, maxBess: 0, notes: 'TVA Green Connect' },
  VA: { solarPerKW: 0, bessPerKWh: 50, maxBess: 15000, notes: 'Grid transformation' },
  WV: { solarPerKW: 0, bessPerKWh: 0, maxBess: 0, notes: 'No state incentive' },
  // Midwest
  IA: { solarPerKW: 15, bessPerKWh: 0, maxBess: 0, notes: 'Utility rebates vary' },
  IL: { solarPerKW: 50, bessPerKWh: 50, maxBess: 20000, notes: 'Illinois Shines' },
  IN: { solarPerKW: 0, bessPerKWh: 0, maxBess: 0, notes: 'Net metering reduced' },
  KS: { solarPerKW: 0, bessPerKWh: 0, maxBess: 0, notes: 'No state incentive' },
  MI: { solarPerKW: 0, bessPerKWh: 0, maxBess: 0, notes: 'DTE/Consumers programs' },
  MN: { solarPerKW: 40, bessPerKWh: 50, maxBess: 15000, notes: 'Made in Minnesota solar' },
  MO: { solarPerKW: 0, bessPerKWh: 0, maxBess: 0, notes: 'Utility rebates only' },
  ND: { solarPerKW: 0, bessPerKWh: 0, maxBess: 0, notes: 'No state incentive' },
  NE: { solarPerKW: 0, bessPerKWh: 0, maxBess: 0, notes: 'Public power — check utility' },
  OH: { solarPerKW: 0, bessPerKWh: 25, maxBess: 10000, notes: 'Limited programs' },
  OK: { solarPerKW: 0, bessPerKWh: 0, maxBess: 0, notes: 'No state incentive' },
  SD: { solarPerKW: 0, bessPerKWh: 0, maxBess: 0, notes: 'No state incentive' },
  WI: { solarPerKW: 15, bessPerKWh: 0, maxBess: 0, notes: 'Focus on Energy rebate' },
  // West
  AZ: { solarPerKW: 0, bessPerKWh: 75, maxBess: 20000, notes: 'APS/SRP storage rebates' },
  CA: { solarPerKW: 0, bessPerKWh: 150, maxBess: 100000, notes: 'SGIP still active for storage' },
  CO: { solarPerKW: 50, bessPerKWh: 100, maxBess: 40000, notes: 'Xcel rebates, EnergySmart' },
  HI: { solarPerKW: 0, bessPerKWh: 200, maxBess: 50000, notes: 'Strong storage support' },
  ID: { solarPerKW: 0, bessPerKWh: 0, maxBess: 0, notes: 'No state incentive' },
  MT: { solarPerKW: 15, bessPerKWh: 0, maxBess: 0, notes: 'Alternative energy credit' },
  NM: { solarPerKW: 30, bessPerKWh: 50, maxBess: 15000, notes: 'Solar Market Development' },
  NV: { solarPerKW: 0, bessPerKWh: 50, maxBess: 15000, notes: 'NV Energy programs' },
  OR: { solarPerKW: 50, bessPerKWh: 100, maxBess: 25000, notes: 'Energy Trust of Oregon' },
  TX: { solarPerKW: 0, bessPerKWh: 0, maxBess: 0, notes: 'Utility programs only' },
  UT: { solarPerKW: 15, bessPerKWh: 0, maxBess: 0, notes: 'State tax credit (reduced)' },
  WA: { solarPerKW: 30, bessPerKWh: 50, maxBess: 15000, notes: 'Utility programs vary' },
  WY: { solarPerKW: 0, bessPerKWh: 0, maxBess: 0, notes: 'No state incentive' },
  AK: { solarPerKW: 0, bessPerKWh: 50, maxBess: 10000, notes: 'Rural microgrid grants' },
  default: { solarPerKW: 0, bessPerKWh: 0, maxBess: 0, notes: 'Check local utility' }
};

// ── FIX A-10 (Phase 3): Self-consumption ratio by offset % ──────────────
// Small systems (<50% offset) self-consume nearly everything.
// Large systems (>80% offset) export significant surplus during low-load hours.
// FIX SYNC-1: Aligned with WizB — continuous curve (no cliffs)
const getSelfConsumptionRate = (solarKWh, usageKWh) => {
  if (usageKWh <= 0) return 0.85;
  const offset = usageKWh > 0 ? solarKWh / usageKWh : 0; // E-12: Guard div-by-zero
  if (offset <= 0) return 0.98;
  if (offset <= 0.50) return 0.98 - (offset / 0.50) * 0.07;           // 98% → 91%
  if (offset <= 0.80) return 0.91 - ((offset - 0.50) / 0.30) * 0.10;  // 91% → 81%
  if (offset <= 1.00) return 0.81 - ((offset - 0.80) / 0.20) * 0.13;  // 81% → 68%
  return Math.max(0.55, 0.68 - (offset - 1.00) * 0.43);               // 68% → 55% floor
};

// ── FIX A-1 (Phase 2): Weather production derating ───────────────────────
// Source: WEATHER_RISK_DATA from merlinConstants.js (snow/heat scores 0-5)
// Same logic as computeWeatherRisk in Wizard B
const SNOW_HEAT_BY_STATE = {
  // Only states with snow≥3 or heat≥4 — others default to 1.0 derating
  AK: { snow: 5, heat: 1 }, CO: { snow: 4, heat: 2 }, CT: { snow: 3, heat: 2 },
  IA: { snow: 4, heat: 3 }, ID: { snow: 4, heat: 2 }, IL: { snow: 3, heat: 3 },
  IN: { snow: 3, heat: 3 }, MA: { snow: 4, heat: 2 }, ME: { snow: 5, heat: 1 },
  MI: { snow: 4, heat: 2 }, MN: { snow: 5, heat: 2 }, MT: { snow: 4, heat: 2 },
  ND: { snow: 5, heat: 2 }, NE: { snow: 3, heat: 3 }, NH: { snow: 4, heat: 1 },
  NY: { snow: 4, heat: 2 }, OH: { snow: 3, heat: 3 }, PA: { snow: 3, heat: 2 },
  RI: { snow: 3, heat: 2 }, SD: { snow: 4, heat: 2 }, VT: { snow: 5, heat: 1 },
  WI: { snow: 4, heat: 2 }, WY: { snow: 4, heat: 2 },
  // Hot states (heat≥4)
  AL: { snow: 1, heat: 4 }, AR: { snow: 2, heat: 4 }, AZ: { snow: 1, heat: 5 },
  FL: { snow: 0, heat: 4 }, GA: { snow: 1, heat: 4 }, KS: { snow: 3, heat: 4 },
  LA: { snow: 1, heat: 5 }, MO: { snow: 2, heat: 4 }, MS: { snow: 1, heat: 5 },
  NC: { snow: 2, heat: 4 }, NV: { snow: 2, heat: 5 }, OK: { snow: 2, heat: 5 },
  SC: { snow: 1, heat: 4 }, TN: { snow: 2, heat: 4 }, TX: { snow: 1, heat: 5 },
};
const getWeatherDerating = (stateCode) => {
  const sh = SNOW_HEAT_BY_STATE[stateCode];
  if (!sh) return 1.0; // Mild states — no derating
  const snowDerate = sh.snow >= 5 ? 0.88 : sh.snow >= 4 ? 0.92 : sh.snow >= 3 ? 0.95 : 1.0;
  const heatDerate = sh.heat >= 5 ? 0.93 : sh.heat >= 4 ? 0.96 : 1.0;
  return Math.round((snowDerate * heatDerate) * 1000) / 1000;
};

// Detailed Weather & Grid Risk Data by State
// All Risk Scales: 1-5 (1=Low Risk, 5=High Risk)
// Grid Reliability: 1-5 (5=Most Reliable)
// earthquake: seismic risk, drought: water scarcity risk
// National averages for benchmarking
// Net Metering policies by state
// status: 'full' = full retail credit, 'partial' = reduced rate, 'none' = no policy, 'varies' = utility-dependent
// TOU Peak Hours by common utility patterns
// ═══ STATE_CLIMATE, CAR_WASH_CLIMATE_ADJUSTMENTS, getClimateAdjustments, BUSINESS_GAS_PROFILES ═══
// Now imported from merlinConstants.js (SSOT — eliminates ~240 lines of duplication with WizB)
// Calculate estimated monthly gas consumption (therms) based on business type and climate
const calculateMonthlyGasTherms = (state, businessType) => {
  const climate = STATE_CLIMATE[state] || STATE_CLIMATE['default'];
  const profile = BUSINESS_GAS_PROFILES[businessType] || BUSINESS_GAS_PROFILES['default'];
  
  // Climate adjustment factor (normalized to moderate climate = 1.0)
  // Higher HDD = more heating needed
  const climateAdjustment = climate.hdd / 5000; // 5000 HDD = baseline
  
  // Calculate heating component (scales with climate)
  const heatingTherms = profile.baseTherm * profile.heatingMultiplier * climateAdjustment;
  
  // Hot water is less climate-dependent but still affected
  const hotWaterTherms = profile.baseTherm * profile.hotWaterMultiplier * (0.7 + 0.3 * climateAdjustment);
  
  // Process gas is constant regardless of climate
  const processTherms = profile.processGas;
  
  // Total monthly therms (average across year)
  const totalTherms = heatingTherms + hotWaterTherms + processTherms;
  
  // Annualize and average (heating only happens part of year)
  const heatingMonthsRatio = climate.heatingMonths / 12;
  const annualizedTherms = (heatingTherms * heatingMonthsRatio * 2) + // Double during heating months, zero otherwise
                          hotWaterTherms + // Year-round
                          processTherms;   // Year-round
  
  return Math.round(annualizedTherms);
};

// Calculate estimated monthly gas cost
const calculateMonthlyGasCost = (state, businessType, gasRate, deliveryCharge) => {
  const therms = calculateMonthlyGasTherms(state, businessType);
  const totalRate = gasRate + deliveryCharge;
  return Math.round(therms * totalRate);
};

// Get gas usage summary for display
const getGasUsageSummary = (state, businessType) => {
  const climate = STATE_CLIMATE[state] || STATE_CLIMATE['default'];
  const profile = BUSINESS_GAS_PROFILES[businessType] || BUSINESS_GAS_PROFILES['default'];
  const therms = calculateMonthlyGasTherms(state, businessType);
  
  return {
    estimatedTherms: therms,
    climateZone: climate.climateZone,
    heatingMonths: climate.heatingMonths,
    usageProfile: profile.description,
    hdd: climate.hdd
  };
};

// Get initials from utility name for logo fallback
const getUtilityInitials = (utilityName) => {
  if (!utilityName) return '?';
  // Handle common patterns
  const cleaned = utilityName
    .replace(/\(.*?\)/g, '') // Remove parentheses content
    .replace(/&/g, '')       // Remove ampersands
    .trim();
  const words = cleaned.split(/\s+/).filter(w => w.length > 0);
  if (words.length === 1) {
    return words[0].substring(0, 2).toUpperCase();
  }
  return words.slice(0, 2).map(w => w[0]).join('').toUpperCase();
};

// Utility Logo Component - renders actual logos for known utilities
const UtilityLogo = ({ utilityName, type = 'electric', size = 'md' }) => {
  const sizeClasses = size === 'sm' ? 'w-8 h-8' : 'w-10 h-10';
  const textSize = size === 'sm' ? 'text-xs' : 'text-sm';
  
  // DTE Energy logo (blue "dte" text)
  if (utilityName.toLowerCase().includes('dte')) {
    return (
      <svg viewBox="0 0 100 100" className={sizeClasses}>
        <rect width="100" height="100" fill="#0072CE"/>
        <text x="50" y="62" textAnchor="middle" fill="white" fontSize="32" fontWeight="bold" fontFamily="Arial, sans-serif">dte</text>
        <rect x="10" y="70" width="80" height="4" fill="#00A651"/>
      </svg>
    );
  }
  
  // Consumers Energy logo (teal/green)
  if (utilityName.toLowerCase().includes('consumers')) {
    return (
      <svg viewBox="0 0 100 100" className={sizeClasses}>
        <rect width="100" height="100" fill="#00857C"/>
        <text x="50" y="42" textAnchor="middle" fill="white" fontSize="14" fontWeight="bold" fontFamily="Arial, sans-serif">CONSUMERS</text>
        <text x="50" y="62" textAnchor="middle" fill="white" fontSize="16" fontWeight="bold" fontFamily="Arial, sans-serif">ENERGY</text>
        <circle cx="50" cy="80" r="8" fill="#FDB913"/>
      </svg>
    );
  }
  
  // PG&E logo
  if (utilityName.toLowerCase().includes('pg&e') || utilityName.toLowerCase().includes('pacific gas')) {
    return (
      <svg viewBox="0 0 100 100" className={sizeClasses}>
        <rect width="100" height="100" fill="#004B87"/>
        <text x="50" y="58" textAnchor="middle" fill="white" fontSize="28" fontWeight="bold" fontFamily="Arial, sans-serif">PG&E</text>
        <rect x="20" y="70" width="60" height="3" fill="#F7941D"/>
      </svg>
    );
  }
  
  // Southern California Edison
  if (utilityName.toLowerCase().includes('edison') || utilityName.toLowerCase().includes('sce')) {
    return (
      <svg viewBox="0 0 100 100" className={sizeClasses}>
        <rect width="100" height="100" fill="#E31837"/>
        <text x="50" y="58" textAnchor="middle" fill="white" fontSize="28" fontWeight="bold" fontFamily="Arial, sans-serif">SCE</text>
      </svg>
    );
  }
  
  // Con Edison
  if (utilityName.toLowerCase().includes('con ed')) {
    return (
      <svg viewBox="0 0 100 100" className={sizeClasses}>
        <rect width="100" height="100" fill="#003DA5"/>
        <text x="50" y="40" textAnchor="middle" fill="white" fontSize="16" fontWeight="bold" fontFamily="Arial, sans-serif">CON</text>
        <text x="50" y="65" textAnchor="middle" fill="#FF6B00" fontSize="20" fontWeight="bold" fontFamily="Arial, sans-serif">EDISON</text>
      </svg>
    );
  }
  
  // Florida Power & Light
  if (utilityName.toLowerCase().includes('fpl') || utilityName.toLowerCase().includes('florida power')) {
    return (
      <svg viewBox="0 0 100 100" className={sizeClasses}>
        <rect width="100" height="100" fill="#00629B"/>
        <text x="50" y="58" textAnchor="middle" fill="white" fontSize="32" fontWeight="bold" fontFamily="Arial, sans-serif">FPL</text>
        <circle cx="80" cy="25" r="12" fill="#FDB813"/>
      </svg>
    );
  }
  
  // Duke Energy
  if (utilityName.toLowerCase().includes('duke')) {
    return (
      <svg viewBox="0 0 100 100" className={sizeClasses}>
        <rect width="100" height="100" fill="#00263E"/>
        <text x="50" y="45" textAnchor="middle" fill="white" fontSize="18" fontWeight="bold" fontFamily="Arial, sans-serif">DUKE</text>
        <text x="50" y="68" textAnchor="middle" fill="#00A9E0" fontSize="16" fontWeight="bold" fontFamily="Arial, sans-serif">ENERGY</text>
      </svg>
    );
  }
  
  // Xcel Energy
  if (utilityName.toLowerCase().includes('xcel')) {
    return (
      <svg viewBox="0 0 100 100" className={sizeClasses}>
        <rect width="100" height="100" fill="#C8102E"/>
        <text x="50" y="58" textAnchor="middle" fill="white" fontSize="22" fontWeight="bold" fontFamily="Arial, sans-serif">XCEL</text>
      </svg>
    );
  }
  
  // ComEd
  if (utilityName.toLowerCase().includes('comed')) {
    return (
      <svg viewBox="0 0 100 100" className={sizeClasses}>
        <rect width="100" height="100" fill="#0033A0"/>
        <text x="50" y="55" textAnchor="middle" fill="white" fontSize="20" fontWeight="bold" fontFamily="Arial, sans-serif">ComEd</text>
        <rect x="15" y="65" width="70" height="4" fill="#78BE20"/>
      </svg>
    );
  }
  
  // Arizona Public Service (APS)
  if (utilityName.toLowerCase().includes('aps') || utilityName.toLowerCase().includes('arizona public')) {
    return (
      <svg viewBox="0 0 100 100" className={sizeClasses}>
        <rect width="100" height="100" fill="#006747"/>
        <text x="50" y="58" textAnchor="middle" fill="white" fontSize="32" fontWeight="bold" fontFamily="Arial, sans-serif">aps</text>
      </svg>
    );
  }
  
  // Southwest Gas
  if (utilityName.toLowerCase().includes('southwest gas')) {
    return (
      <svg viewBox="0 0 100 100" className={sizeClasses}>
        <rect width="100" height="100" fill="#003768"/>
        <text x="50" y="45" textAnchor="middle" fill="white" fontSize="12" fontWeight="bold" fontFamily="Arial, sans-serif">SOUTHWEST</text>
        <text x="50" y="65" textAnchor="middle" fill="#F7941D" fontSize="18" fontWeight="bold" fontFamily="Arial, sans-serif">GAS</text>
      </svg>
    );
  }
  
  // SoCalGas
  if (utilityName.toLowerCase().includes('socalgas')) {
    return (
      <svg viewBox="0 0 100 100" className={sizeClasses}>
        <rect width="100" height="100" fill="#002855"/>
        <text x="50" y="45" textAnchor="middle" fill="white" fontSize="14" fontWeight="bold" fontFamily="Arial, sans-serif">SoCal</text>
        <text x="50" y="68" textAnchor="middle" fill="#FF8200" fontSize="20" fontWeight="bold" fontFamily="Arial, sans-serif">Gas</text>
      </svg>
    );
  }
  
  // Puget Sound Energy
  if (utilityName.toLowerCase().includes('puget')) {
    return (
      <svg viewBox="0 0 100 100" className={sizeClasses}>
        <rect width="100" height="100" fill="#003B5C"/>
        <text x="50" y="58" textAnchor="middle" fill="white" fontSize="28" fontWeight="bold" fontFamily="Arial, sans-serif">PSE</text>
        <rect x="20" y="70" width="60" height="4" fill="#78BE20"/>
      </svg>
    );
  }
  
  // Dominion Energy
  if (utilityName.toLowerCase().includes('dominion')) {
    return (
      <svg viewBox="0 0 100 100" className={sizeClasses}>
        <rect width="100" height="100" fill="#00205B"/>
        <text x="50" y="55" textAnchor="middle" fill="white" fontSize="11" fontWeight="bold" fontFamily="Arial, sans-serif">DOMINION</text>
        <text x="50" y="72" textAnchor="middle" fill="#00A9E0" fontSize="14" fontWeight="bold" fontFamily="Arial, sans-serif">ENERGY</text>
      </svg>
    );
  }

  // CenterPoint Energy
  if (utilityName.toLowerCase().includes('centerpoint')) {
    return (
      <svg viewBox="0 0 100 100" className={sizeClasses}>
        <rect width="100" height="100" fill="#6D2077"/>
        <text x="50" y="45" textAnchor="middle" fill="white" fontSize="11" fontWeight="bold" fontFamily="Arial, sans-serif">CenterPoint</text>
        <text x="50" y="65" textAnchor="middle" fill="#FDB813" fontSize="16" fontWeight="bold" fontFamily="Arial, sans-serif">Energy</text>
      </svg>
    );
  }
  
  // Entergy
  if (utilityName.toLowerCase().includes('entergy')) {
    return (
      <svg viewBox="0 0 100 100" className={sizeClasses}>
        <rect width="100" height="100" fill="#00205B"/>
        <text x="50" y="58" textAnchor="middle" fill="white" fontSize="18" fontWeight="bold" fontFamily="Arial, sans-serif">ENTERGY</text>
        <rect x="15" y="70" width="70" height="4" fill="#A6CE39"/>
      </svg>
    );
  }

  // National Grid
  if (utilityName.toLowerCase().includes('national grid')) {
    return (
      <svg viewBox="0 0 100 100" className={sizeClasses}>
        <rect width="100" height="100" fill="#003DA5"/>
        <text x="50" y="45" textAnchor="middle" fill="white" fontSize="12" fontWeight="bold" fontFamily="Arial, sans-serif">NATIONAL</text>
        <text x="50" y="65" textAnchor="middle" fill="white" fontSize="16" fontWeight="bold" fontFamily="Arial, sans-serif">GRID</text>
      </svg>
    );
  }
  
  // Georgia Power
  if (utilityName.toLowerCase().includes('georgia power')) {
    return (
      <svg viewBox="0 0 100 100" className={sizeClasses}>
        <rect width="100" height="100" fill="#004B87"/>
        <text x="50" y="45" textAnchor="middle" fill="white" fontSize="14" fontWeight="bold" fontFamily="Arial, sans-serif">GEORGIA</text>
        <text x="50" y="68" textAnchor="middle" fill="#F7941D" fontSize="18" fontWeight="bold" fontFamily="Arial, sans-serif">POWER</text>
      </svg>
    );
  }

  // Peoples Gas
  if (utilityName.toLowerCase().includes('peoples gas')) {
    return (
      <svg viewBox="0 0 100 100" className={sizeClasses}>
        <rect width="100" height="100" fill="#005596"/>
        <text x="50" y="45" textAnchor="middle" fill="white" fontSize="14" fontWeight="bold" fontFamily="Arial, sans-serif">PEOPLES</text>
        <text x="50" y="68" textAnchor="middle" fill="#FDB813" fontSize="18" fontWeight="bold" fontFamily="Arial, sans-serif">GAS</text>
      </svg>
    );
  }
  
  // Default: styled initials with gradient
  const initials = getUtilityInitials(utilityName);
  const bgGradient = type === 'electric' 
    ? 'from-indigo-500 to-indigo-700' 
    : 'from-orange-500 to-red-600';
  
  return (
    <div className={`${sizeClasses} bg-gradient-to-br ${bgGradient} flex items-center justify-center rounded-lg`}>
      <span className={`text-white font-bold ${textSize}`}>{initials}</span>
    </div>
  );
};

const INDUSTRIES = [
  { id: 'carwash', name: 'Car Wash', icon: Car, operatingHours: 12 },
  { id: 'hospital', name: 'Hospital', icon: Heart, operatingHours: 24 },
  { id: 'datacenter', name: 'Data Center', icon: Server, operatingHours: 24 },
  { id: 'retail', name: 'Retail Store', icon: ShoppingCart, operatingHours: 14 },
  { id: 'warehouse', name: 'Warehouse', icon: Warehouse, operatingHours: 16 },
  { id: 'manufacturing', name: 'Manufacturing', icon: Factory, operatingHours: 16 },
  { id: 'restaurant', name: 'Restaurant', icon: Coffee, operatingHours: 14 },
  { id: 'gasstation', name: 'Gas Station', icon: Fuel, operatingHours: 24 },
  { id: 'office', name: 'Office Building', icon: Building, operatingHours: 12 },
  { id: 'evcharging', name: 'EV Charging Hub', icon: BatteryCharging, operatingHours: 24 },
  // FIX A-3 (Phase 2): Major Merlin target verticals
  { id: 'hotel', name: 'Hotel / Hospitality', icon: Hotel, operatingHours: 24 },
  { id: 'indoorfarm', name: 'Indoor Farm / Agriculture', icon: Leaf, operatingHours: 18 }
];

// ============================================
// EQUIPMENT DATABASE - Suppliers & Specifications
// ============================================

// ============================================
// MERLIN ENERGY SUPPLY CHAIN DATABASE
// Based on Merlin Energy Supplier Scorecard - January 2026
// 16 Categories × Weighted Scores = 100% (Buyer-centric methodology)
// ============================================

const FACILITY_TYPES = [
  { id: 'express', title: 'Express Tunnel', desc: 'High-speed conveyor, 80-180 feet', maxBays: 1 },
  { id: 'fullService', title: 'Full-Service', desc: 'Complete detailing + tunnel', maxBays: 1 },
  { id: 'mini', title: 'Mini-Tunnel', desc: 'Shorter conveyor under 60 feet', maxBays: 1 },
  { id: 'iba', title: 'In-Bay Automatic', desc: 'Vehicle stationary, machine moves', maxBays: 1 },
  { id: 'self', title: 'Self-Serve Bay', desc: 'Customer wand wash', maxBays: 10 }
];

const WATER_OPTIONS = [
  { id: 'gas', title: 'Natural Gas', desc: 'Lower electric demand' },
  { id: 'electric', title: 'Electric', desc: '50-150 kW demand' },
  { id: 'none', title: 'No Heated Water', desc: '' }
];

// ============================================
// CALCULATIONS
// ============================================

// INDUSTRY CONSUMPTION PROFILES - Enhanced with more detail
const INDUSTRY_CONSUMPTION = {
  carwash: { 
    baseKWh: 25000, peakKW: 150, loadFactor: 0.4, shiftableLoad: 0.15, downtimeCost: 500,
    lightingPct: 0.10, hvacPct: 0.15, motorsPct: 0.25, processPct: 0.50,
    roofSqFt: 4500, hotWaterPct: 0.60, coolingLoad: 0.3, heatingLoad: 0.4,
    peakDrivers: 'Tunnel dryers (50-100kW each), water heating, vacuum islands'
  },
  hospital: { 
    baseKWh: 500000, peakKW: 1500, loadFactor: 0.7, shiftableLoad: 0.05, downtimeCost: 50000,
    lightingPct: 0.12, hvacPct: 0.40, motorsPct: 0.15, processPct: 0.33,
    roofSqFt: 50000, hotWaterPct: 0.20, coolingLoad: 0.6, heatingLoad: 0.4,
    peakDrivers: 'Imaging (MRI, CT), HVAC, surgical suites'
  },
  datacenter: { 
    baseKWh: 1000000, peakKW: 2000, loadFactor: 0.85, shiftableLoad: 0.08, downtimeCost: 100000,
    lightingPct: 0.02, hvacPct: 0.45, motorsPct: 0.03, processPct: 0.50,
    roofSqFt: 30000, hotWaterPct: 0.02, coolingLoad: 0.9, heatingLoad: 0.05,
    peakDrivers: 'IT load, cooling systems (40-50% of total)'
  },
  retail: { 
    baseKWh: 15000, peakKW: 60, loadFactor: 0.5, shiftableLoad: 0.20, downtimeCost: 800,
    lightingPct: 0.30, hvacPct: 0.40, motorsPct: 0.05, processPct: 0.25,
    roofSqFt: 12000, hotWaterPct: 0.05, coolingLoad: 0.5, heatingLoad: 0.4,
    peakDrivers: 'HVAC, refrigeration, lighting'
  },
  warehouse: { 
    baseKWh: 30000, peakKW: 100, loadFactor: 0.55, shiftableLoad: 0.30, downtimeCost: 1500,
    lightingPct: 0.25, hvacPct: 0.20, motorsPct: 0.30, processPct: 0.25,
    roofSqFt: 50000, hotWaterPct: 0.03, coolingLoad: 0.3, heatingLoad: 0.3,
    peakDrivers: 'Forklift charging, dock doors, refrigeration'
  },
  manufacturing: { 
    baseKWh: 150000, peakKW: 500, loadFactor: 0.5, shiftableLoad: 0.20, downtimeCost: 10000,
    lightingPct: 0.10, hvacPct: 0.20, motorsPct: 0.40, processPct: 0.30,
    roofSqFt: 40000, hotWaterPct: 0.10, coolingLoad: 0.4, heatingLoad: 0.5,
    peakDrivers: 'Equipment startup, compressors, process heat'
  },
  restaurant: { 
    baseKWh: 12000, peakKW: 50, loadFactor: 0.45, shiftableLoad: 0.10, downtimeCost: 600,
    lightingPct: 0.15, hvacPct: 0.30, motorsPct: 0.10, processPct: 0.45,
    roofSqFt: 3000, hotWaterPct: 0.25, coolingLoad: 0.5, heatingLoad: 0.4,
    peakDrivers: 'Kitchen exhaust, refrigeration, HVAC'
  },
  gasstation: { 
    baseKWh: 8000, peakKW: 30, loadFactor: 0.5, shiftableLoad: 0.15, downtimeCost: 1000,
    lightingPct: 0.35, hvacPct: 0.25, motorsPct: 0.15, processPct: 0.25,
    roofSqFt: 2000, hotWaterPct: 0.05, coolingLoad: 0.4, heatingLoad: 0.3,
    peakDrivers: 'Refrigeration, lighting, pumps'
  },
  office: { 
    baseKWh: 20000, peakKW: 80, loadFactor: 0.5, shiftableLoad: 0.25, downtimeCost: 300,
    lightingPct: 0.25, hvacPct: 0.50, motorsPct: 0.05, processPct: 0.20,
    roofSqFt: 10000, hotWaterPct: 0.05, coolingLoad: 0.5, heatingLoad: 0.5,
    peakDrivers: 'HVAC, elevators, office equipment'
  },
  evcharging: { 
    baseKWh: 50000, peakKW: 400, loadFactor: 0.3, shiftableLoad: 0.35, downtimeCost: 2000,
    lightingPct: 0.05, hvacPct: 0.05, motorsPct: 0.05, processPct: 0.85,
    roofSqFt: 5000, hotWaterPct: 0.01, coolingLoad: 0.2, heatingLoad: 0.1,
    peakDrivers: 'DC fast chargers (50-350kW each)'
  },
  // FIX A-3 (Phase 2): Hotel + indoor farm — major Merlin target verticals
  hotel: {
    baseKWh: 80000, peakKW: 300, loadFactor: 0.55, shiftableLoad: 0.15, downtimeCost: 5000,
    lightingPct: 0.15, hvacPct: 0.45, motorsPct: 0.10, processPct: 0.30,
    roofSqFt: 25000, hotWaterPct: 0.35, coolingLoad: 0.5, heatingLoad: 0.4,
    peakDrivers: 'HVAC (45%), laundry, kitchen, hot water, elevators'
  },
  indoorfarm: {
    baseKWh: 200000, peakKW: 600, loadFactor: 0.65, shiftableLoad: 0.15, downtimeCost: 15000,
    lightingPct: 0.55, hvacPct: 0.30, motorsPct: 0.05, processPct: 0.10,
    roofSqFt: 30000, hotWaterPct: 0.05, coolingLoad: 0.6, heatingLoad: 0.3,
    peakDrivers: 'LED grow lights (55%), HVAC/dehumidification, irrigation pumps'
  }
};

// Calculate all savings opportunities with actual dollar values
// Now properly uses car wash questionnaire data
const calculateSavingsOpportunities = (utilityData, solarData, industry, stateCode, formData = {}) => {
  if (!utilityData || !utilityData.electric) return { opportunities: [], summary: '' };
  const electric = utilityData.electric;
  const gas = utilityData.gas || {};
  const climate = STATE_CLIMATE[stateCode] || STATE_CLIMATE['default'];
  const totalGasRate = (gas?.rate || 0) + (gas?.deliveryCharge || 0);
  
  // ========================================
  // CAR WASH SPECIFIC CALCULATIONS
  // ========================================
  if (industry.id === 'carwash' && Object.keys(formData).length > 0) {
    return calculateCarWashOpportunities(formData, electric, gas, totalGasRate, solarData, climate, industry, stateCode); // FIX A-1: pass stateCode for weather derating
  }
  
  // ========================================
  // GENERIC INDUSTRY CALCULATIONS (fallback)
  // ========================================
  const baseConsumption = INDUSTRY_CONSUMPTION[industry.id];
  
  // Override defaults with actual formData values when provided
  // Normalize gas line: handle both car wash format (gasLine: 'yes'/'no') and generic format (hasGasLine: boolean)
  const hasGasLine = formData.hasGasLine !== undefined ? formData.hasGasLine 
    : formData.gasLine !== undefined ? formData.gasLine === 'yes' 
    : true;
  const roofSqFt = formData.roofArea ? parseInt(formData.roofArea) : baseConsumption.roofSqFt;
  const operatingHours = formData.operatingHours || industry.operatingHours || 12;
  const backupPriority = formData.backupPriority || (baseConsumption.downtimeCost > 5000 ? 3 : baseConsumption.downtimeCost > 1000 ? 2 : 1);
  
  // Calculate consumption based on actual bill if provided, otherwise use industry profile
  let monthlyKWh, peakKW;
  if (formData.monthlyElectricBill) {
    const billAmount = parseInt(formData.monthlyElectricBill) || 0;
    const estimatedUsageCost = billAmount * 0.6;
    monthlyKWh = electric.avgRate > 0 ? Math.round(estimatedUsageCost / electric.avgRate) : baseConsumption.baseKWh;
    peakKW = electric.demandCharge > 0 ? Math.round((billAmount * 0.4) / electric.demandCharge) : baseConsumption.peakKW;
  } else {
    monthlyKWh = baseConsumption.baseKWh;
    peakKW = baseConsumption.peakKW;
  }
  
  const hourMultiplier = operatingHours / (industry.operatingHours || 12);
  monthlyKWh = Math.round(monthlyKWh * hourMultiplier);
  
  const annualKWh = monthlyKWh * 12;
  // Propane uses LP tanks (not gas line), so calculate therms even without gas line
  const waterHeaterType = formData.waterHeater || 'unknown';
  const hasPropane = waterHeaterType === 'propane';
  const gasThermsMo = (hasGasLine || hasPropane) ? calculateMonthlyGasTherms(stateCode, industry.id) : 0;
  // Propane: 15% efficiency penalty vs natural gas
  const propaneEffPenalty = hasPropane ? 1.15 : 1.0;
  const adjustedGasThermsMo = Math.round(gasThermsMo * propaneEffPenalty);
  const annualTherms = adjustedGasThermsMo * 12;
  const rateDiff = electric.peakRate - electric.offPeakRate;
  
  // Fuel cost: propane $2.73/therm vs utility gas rate
  const effectiveFuelRate = hasPropane ? 2.73 : totalGasRate;
  
  const consumption = {
    ...baseConsumption,
    roofSqFt,
    downtimeCost: backupPriority === 3 ? baseConsumption.downtimeCost * 2 : backupPriority === 1 ? baseConsumption.downtimeCost * 0.5 : baseConsumption.downtimeCost
  };
  
  const annualElectricUsage = annualKWh * electric.avgRate;
  const annualDemandCharges = peakKW * electric.demandCharge * 12;
  const annualGasCost = annualTherms * effectiveFuelRate;
  const totalAnnualEnergy = annualElectricUsage + annualDemandCharges + annualGasCost;
  
  const opportunities = [];
  
  // Generic opportunities (abbreviated for space - keep existing logic)
  // ... Solar, Battery, LED, HVAC, etc.
  
  // 1. SOLAR PV
  // FIX A-5 (Phase 4): Car wash solar roof analysis — dynamic factor based on roof construction type
  // Opaque (standard metal/concrete): 70% usable — majority of installed base, El Car Wash style
  // Mixed (some skylights): 55% usable — mid-2010s builds, partial polycarbonate strips
  // Heavy polycarbonate: 40% usable — Tommy's 2.0, Quick Quack newer, translucent daylight panels
  // Source: Top 15 US operator analysis + El Car Wash, Autobell, Delta Sonic traditional builds
  const usableRoofFactor = formData.roofType === 'polycarbonate' ? 0.40 : formData.roofType === 'mixed' ? 0.55 : formData.roofType === 'opaque' ? 0.70 : 0.65;
  const effectiveRoofSqFt = Math.round(consumption.roofSqFt * usableRoofFactor);
  // FIX SYNC-2: Include carport capacity in generic sizing (aligned with WizB)
  const maxRoofKW_gen = Math.round(effectiveRoofSqFt / 100); // FIX A-5: uses effective roof after shading
  const carportKW_gen = formData.carportArea ? Math.round(parseInt(formData.carportArea) * 13 / 1000) : 0;
  const solarSystemKW = Math.min(
    solarData.annualProduction > 0 ? Math.round((annualKWh * 0.80) / solarData.annualProduction) : 0,
    maxRoofKW_gen + carportKW_gen
  );
  const solarAnnualProduction = Math.round(solarSystemKW * solarData.annualProduction * getWeatherDerating(stateCode)); // FIX A-1: weather derating
  // FIX SYNC-13: Solar savings aligned with WizB — conservative (no NEM export credit in preview)
  // Full state-specific NEM + TOU applied in Step 7 hotel/detailed final quote engine
  const solarAnnualSavings = Math.round(solarAnnualProduction * electric.avgRate * getSelfConsumptionRate(solarAnnualProduction, annualKWh));
  // FIX SYNC-2: Size-tiered solar pricing (aligned with WizB NREL 2025 ATB)
  const roofSolarKW_gen = Math.min(maxRoofKW_gen, solarSystemKW);
  const carportSolarKW_gen = Math.max(0, solarSystemKW - roofSolarKW_gen);
  const roofCostPerW = roofSolarKW_gen <= 20 ? 3200 : roofSolarKW_gen <= 50 ? 2800 : roofSolarKW_gen <= 200 ? 2500 : 2200;
  const solarCost = roofSolarKW_gen * roofCostPerW + carportSolarKW_gen * (CARPORT_COST_PER_W * 1000);
  const solarNetCost = Math.round(solarCost * ITC_NET_MULTIPLIER); // FIX A-6: dynamic ITC (was hardcoded 0.70)
  // FIX A-8 (Phase 3): State incentives reduce net cost
  const stateInc = STATE_INCENTIVES_A[stateCode] || STATE_INCENTIVES_A.default;
  const solarStateRebate = Math.round(solarSystemKW * stateInc.solarPerKW);
  const solarNetCostAfterState = solarNetCost - solarStateRebate;
  opportunities.push({
    id: 'solarPV', rank: 0, name: 'Solar PV Installation', icon: Sun, category: 'Generation',
    annualSavings: solarAnnualSavings, investmentCost: solarCost, netCost: solarNetCostAfterState,
    itcRate: ITC_DEFAULT, itcDomesticUpside: ITC_DOMESTIC_BONUS, // FIX A-6: expose ITC breakdown
    stateRebate: solarStateRebate, stateProgram: stateInc.notes, // FIX A-8: state incentive detail
    paybackYears: solarAnnualSavings > 0 ? solarNetCostAfterState / solarAnnualSavings : 99, sizing: `${solarSystemKW} kW system`,
    description: `Generate ${Math.round(solarAnnualProduction).toLocaleString()} kWh/year`,
    factors: [
      { label: 'Solar Resource', value: solarData.irradiance, unit: 'kWh/m²/day', quality: solarData.irradiance > 5 ? 'excellent' : 'good' },
      { label: 'Electric Rate', value: electric.avgRate, unit: '$/kWh', quality: electric.avgRate > 0.14 ? 'favorable' : 'moderate' },
      { label: 'Roof Space', value: consumption.roofSqFt, unit: 'sq ft', quality: 'available' },
      // FIX A-1: Show weather derating if applied
      ...(getWeatherDerating(stateCode) < 1.0 ? [{ label: 'Weather Adj', value: Math.round(getWeatherDerating(stateCode) * 100), unit: '%', quality: getWeatherDerating(stateCode) < 0.90 ? 'significant' : 'minor' }] : []),
      // FIX A-7: Tariff risk indicator
      { label: '⚠️ Tariff Note', value: 'Panel tariffs 25-80% on imports', unit: '', quality: 'Domestic panels avoid tariff risk' }
    ],
    whyThisBusiness: `${industry.name} roof space supports ${solarSystemKW} kW of solar generation.`
  });
  
  // 2. BATTERY PEAK SHAVING
  const batteryKW = Math.round(peakKW * 0.30);
  const batteryKWh = batteryKW * 2;
  const peakShavingSavings = Math.round(batteryKW * electric.demandCharge * 0.93 * 12); // FIX #131: 93% round-trip efficiency (LFP typical)
  // FIX #134: Size-tiered BESS pricing (aligned with B Fix #24)
  const bessPerKWh = batteryKWh > 500 ? 150 : batteryKWh > 200 ? 250 : batteryKWh > 100 ? 300 : batteryKWh > 50 ? 400 : 600; // SYNC WizB: 5-tier pricing (was 4-tier)
  const batteryCost = batteryKWh * bessPerKWh;
  const batteryNetCost = Math.round(batteryCost * ITC_NET_MULTIPLIER); // FIX A-6: dynamic ITC
  opportunities.push({
    id: 'batteryPeakShaving', rank: 0, name: 'Battery Peak Shaving', icon: Battery, category: 'Demand Management',
    annualSavings: peakShavingSavings, investmentCost: batteryCost, netCost: batteryNetCost,
    itcRate: ITC_DEFAULT, // FIX A-6: expose ITC rate
    paybackYears: peakShavingSavings > 0 ? batteryNetCost / peakShavingSavings : 99, sizing: `${batteryKW} kW / ${batteryKWh} kWh`,
    description: `Reduce peak demand by 30% (${batteryKW} kW)`,
    factors: [
      { label: 'Current Peak', value: peakKW, unit: 'kW', quality: 'measured' },
      { label: 'Demand Charge', value: electric.demandCharge, unit: '$/kW', quality: electric.demandCharge > 15 ? 'high' : 'moderate' }
    ],
    whyThisBusiness: `Peak demand of ${peakKW} kW creates significant demand charges.`
  });
  
  // 3. LED LIGHTING
  const lightingKWh = annualKWh * consumption.lightingPct;
  const ledAnnualSavings = Math.round(lightingKWh * 0.50 * electric.avgRate);
  // FIX SYNC-6: LED cost aligned with WizB — $200/kW connected load, $3K floor
  const lightingKW_est = lightingKWh / ((operatingHours || 12) * 365);
  const ledCost = Math.max(3000, Math.round(lightingKW_est * 200));
  opportunities.push({
    id: 'ledLighting', rank: 0, name: 'LED Lighting Upgrade', icon: Zap, category: 'Efficiency',
    annualSavings: ledAnnualSavings, investmentCost: ledCost, netCost: ledCost,
    paybackYears: ledAnnualSavings > 0 ? ledCost / ledAnnualSavings : 99, sizing: `${Math.round(lightingKWh / 1000)} MWh lighting`,
    description: `Reduce lighting energy by 50%`,
    factors: [{ label: 'Lighting Load', value: (consumption.lightingPct * 100).toFixed(0), unit: '%', quality: 'of total' }],
    whyThisBusiness: `Lighting is ${(consumption.lightingPct * 100).toFixed(0)}% of energy use.`
  });
  
  // 4. HVAC OPTIMIZATION
  const hvacKWh = annualKWh * consumption.hvacPct;
  const hvacAnnualSavings = Math.round(hvacKWh * 0.25 * electric.avgRate);
  const hvacCost = Math.round(peakKW * consumption.hvacPct * 150);
  opportunities.push({
    id: 'hvacOptimization', rank: 0, name: 'HVAC Optimization', icon: Wind, category: 'Efficiency',
    annualSavings: hvacAnnualSavings, investmentCost: hvacCost, netCost: hvacCost,
    paybackYears: hvacAnnualSavings > 0 ? hvacCost / hvacAnnualSavings : 99, sizing: `${Math.round(hvacKWh / 1000)} MWh HVAC`,
    description: `Smart controls and VFDs for 25% savings`,
    factors: [{ label: 'HVAC Load', value: (consumption.hvacPct * 100).toFixed(0), unit: '%', quality: 'of total' }],
    whyThisBusiness: `HVAC is ${(consumption.hvacPct * 100).toFixed(0)}% of load in ${climate.climateZone} climate.`
  });
  
  // 5. DEMAND RESPONSE
  const curtailableKW = Math.round(peakKW * consumption.shiftableLoad * 0.5);
  const drAnnualSavings = Math.round(curtailableKW * 150);
  opportunities.push({
    id: 'demandResponse', rank: 0, name: 'Demand Response', icon: TrendingUp, category: 'Grid Services',
    annualSavings: drAnnualSavings, investmentCost: 5000, netCost: 5000,
    paybackYears: drAnnualSavings > 0 ? 5000 / drAnnualSavings : 99, sizing: `${curtailableKW} kW curtailable`,
    description: `Utility incentives for grid event participation`,
    factors: [{ label: 'Curtailable', value: curtailableKW, unit: 'kW', quality: 'available' }],
    whyThisBusiness: `${curtailableKW} kW can be curtailed during grid events.`
  });
  
  // 6. RATE OPTIMIZATION
  const rateOptSavings = Math.round(annualElectricUsage * 0.05);
  opportunities.push({
    id: 'rateOptimization', rank: 0, name: 'Rate Structure Optimization', icon: DollarSign, category: 'Rate Optimization',
    annualSavings: rateOptSavings, investmentCost: 2500, netCost: 2500,
    paybackYears: rateOptSavings > 0 ? 2500 / rateOptSavings : 99, sizing: 'Rate analysis',
    description: `Evaluate TOU and demand rate options`,
    factors: [{ label: 'Annual Spend', value: Math.round(annualElectricUsage / 1000), unit: '$K', quality: 'electric' }],
    whyThisBusiness: `$${Math.round(annualElectricUsage).toLocaleString()} annual spend warrants rate analysis.`
  });
  
  // FIX SYNC-5: Composite scoring (aligned with WizB) — savings (30%) + 25yr NPV (25%) + payback (20%) + ROI (15%) + category (10%)
  // ITC-eligible items get MACRS Year 1 deduction applied to effective net cost
  const ITC_ELIGIBLE = new Set(['solarPV', 'batteryPeakShaving']);
  const DEFAULT_TAX_RATE = ASSUMED_TAX_RATE;
  opportunities.forEach(opp => {
    if (ITC_ELIGIBLE.has(opp.id)) {
      const macrsYr1 = Math.round(opp.investmentCost * 0.50 * DEFAULT_TAX_RATE);
      opp._effectiveNetCost = opp.netCost - macrsYr1;
      opp._effectivePayback = opp.annualSavings > 0 ? opp._effectiveNetCost / opp.annualSavings : 99;
    } else {
      opp._effectiveNetCost = opp.netCost;
      opp._effectivePayback = opp.paybackYears;
    }
  });
  const maxSavings = Math.max(...opportunities.map(o => o.annualSavings), 2000); // FIX M-2: min $2K benchmark
  const NPV_MULT = { solarPV: 23, batteryPeakShaving: 21, ledLighting: 24, hvacOptimization: 22, demandResponse: 22, rateOptimization: 24 };
  opportunities.forEach(opp => { opp._npv25 = Math.round(opp.annualSavings * (NPV_MULT[opp.id] || 22.5) - opp._effectiveNetCost); });
  const maxNPV = Math.max(...opportunities.map(o => o._npv25), 1);
  const catBonus = { 'Generation': 10, 'Storage': 8, 'Demand Management': 8, 'Efficiency': 7, 'Electrification': 6, 'Resilience': 6, 'Revenue': 5, 'Grid Services': 5, 'Rate Optimization': 5, 'Monitoring': 4, 'Non-Energy': 2 };
  opportunities.forEach(opp => {
    const savScore = (opp.annualSavings / maxSavings) * 30;
    const npvScore = opp._npv25 > 0 ? (opp._npv25 / maxNPV) * 25 : 0;
    const payScore = opp._effectivePayback < 3 ? 20 : opp._effectivePayback < 6 ? 15 : opp._effectivePayback < 10 ? 10 : 3;
    const roiScore = opp._effectiveNetCost > 0 ? Math.min(15, (opp.annualSavings / opp._effectiveNetCost) * 75) : 8;
    const bonus = catBonus[opp.category] || 5;
    opp.compositeScore = Math.round(savScore + npvScore + payScore + roiScore + bonus);
  });
  opportunities.sort((a, b) => b.compositeScore - a.compositeScore);
  opportunities.forEach((opp, idx) => { opp.rank = idx + 1; });
  
  const top10 = opportunities.slice(0, 10);
  return {
    opportunities: top10,
    allOpportunities: opportunities,
    summary: {
      totalAnnualEnergyCost: Math.round(totalAnnualEnergy),
      top10AnnualSavings: Math.round(top10.reduce((sum, o) => sum + o.annualSavings, 0)),
      top10Investment: Math.round(top10.reduce((sum, o) => sum + o.netCost, 0)),
      savingsPct: totalAnnualEnergy > 0 ? Math.min(100, Math.round((top10.reduce((sum, o) => sum + o.annualSavings, 0) / totalAnnualEnergy) * 100)) : 0
    }
  };
};

// ========================================
// CAR WASH SPECIFIC CALCULATIONS
// ========================================

// Helper to parse HP from config string
const parseHP = (config) => {
  if (!config) return 12;
  const match = config.match(/(\d+)/);
  return match ? parseInt(match[1]) : 10;
};

// ═══════════════════════════════════════════════════════════════════════════
// EQUIPMENT CONFIGURATION CONSTANTS — Module scope (used by calculator + UI)
// ═══════════════════════════════════════════════════════════════════════════
const PUMP_CONFIG_OPTIONS = [
  { id: 'standard',      label: 'Standard Pressure',    sub: '1,000-1,500 PSI · Pre-soak & rinse',     icon: '💧', defaultHP: 7,  dutyCycle: 0.40, efficiencyMult: 1.0,  autoVFD: false },
  { id: 'highPressure',  label: 'High Pressure',        sub: '2,000-3,500 PSI · Main wash arches',     icon: '🔥', defaultHP: 20, dutyCycle: 0.60, efficiencyMult: 1.0,  autoVFD: false },
  { id: 'multiple',      label: 'Multiple Pumps',       sub: 'Staged array · Booster + main + reclaim', icon: '🔄', defaultHP: 15, dutyCycle: 0.45, efficiencyMult: 0.90, autoVFD: false },
  { id: 'variableSpeed', label: 'Variable Speed (VFD)', sub: 'Demand-matched · Best efficiency',        icon: '⚡', defaultHP: 20, dutyCycle: 0.50, efficiencyMult: 0.75, autoVFD: true  },
];

const DRYER_CONFIG_OPTIONS = [
  { id: 'blowersOnly', label: 'Blowers Only',  sub: 'Air-only drying · Most efficient',          icon: '💨', heatingKW: 0,  dutyCycle: 0.60, efficiencyMult: 1.0,  hasHeatedElements: false },
  { id: 'heated',      label: 'Heated Dryers',  sub: 'Resistive heat + air · Fastest drying',     icon: '🔥', heatingKW: 40, dutyCycle: 0.65, efficiencyMult: 1.0,  hasHeatedElements: true  },
  { id: 'hybrid',      label: 'Hybrid System',  sub: 'Mixed heated + air stages · Balanced',      icon: '⚡', heatingKW: 24, dutyCycle: 0.60, efficiencyMult: 0.95, hasHeatedElements: true  },
  { id: 'noDryers',    label: 'No Dryers',      sub: 'Self-serve / in-bay only',                  icon: '🚫', heatingKW: 0,  dutyCycle: 0,    efficiencyMult: 0,    hasHeatedElements: false },
];

const VACUUM_CONFIG_OPTIONS = [
  { id: 'individual',     label: 'Individual Motors',  sub: 'Each station has own 3-5 HP motor',         icon: '🔌', stationHP: 4,   turbineHP: 0,  dutyCycle: 0.25, efficiencyMult: 1.0,  hasTurbine: false },
  { id: 'centralTurbine', label: 'Central Turbine',    sub: 'Single large motor powers all stations',    icon: '🌀', stationHP: 0,   turbineHP: 30, dutyCycle: 0.70, efficiencyMult: 0.85, hasTurbine: true  },
  { id: 'hybrid',         label: 'Hybrid System',      sub: 'Central turbine + individual islands',      icon: '⚡', stationHP: 4,   turbineHP: 25, dutyCycle: 0.45, efficiencyMult: 0.90, hasTurbine: true  },
  { id: 'noVacuums',      label: 'No Vacuums',         sub: 'Express-only · No interior service',        icon: '🚫', stationHP: 0,   turbineHP: 0,  dutyCycle: 0,    efficiencyMult: 0,    hasTurbine: false },
];

const calculateCarWashOpportunities = (formData, electric, gas, totalGasRate, solarData, climate, industry, stateCode = 'MI') => {
  
  // Parse all form data
  const facilityType = formData.facilityType || 'express';
  const bayCount = parseInt(formData.bayCount) || 1;
  // FIX #34: Type-aware defaults (was flat 12hrs / 150 vehicles)
  const operatingHours = parseInt(formData.operatingHours) || ({ express: 14, full: 12, flex: 14, mini: 12, self: 16, inbay: 10, iba: 10 }[facilityType] || 12);
  const daysPerWeek = parseInt(formData.daysPerWeek) || 7;
  const dailyVehicles = parseInt(formData.dailyVehicles) || ({ express: 300, full: 200, flex: 250, mini: 200, self: 100, inbay: 80, iba: 80 }[facilityType] || 200); // FIX AUDIT-4b: was 150, aligned with WizB
  const hasGasLine = formData.gasLine !== undefined ? formData.gasLine === 'yes' : true; // FIX AUDIT-4b: was strict false when undefined, aligned with WizB default-true
  // Handle 'unknown' water heater - estimate based on gas availability
  let waterHeater = formData.waterHeater || 'gas'; // 'gas', 'electric', 'propane', 'none', 'unknown'
  if (waterHeater === 'unknown') {
    waterHeater = hasGasLine ? 'gas' : 'electric';
  }
  // Fuel cost: propane $2.73/therm ($2.50/gal ÷ 0.915 therms/gal) vs utility gas rate (avg ~$1.20/therm)
  const effectiveFuelRate = waterHeater === 'propane' ? 2.73 : totalGasRate;
  const serviceRating = formData.serviceRating === 'unknown' ? 400 : (parseInt(formData.serviceRating) || 400); // Amps
  
  // NEW: Electrical infrastructure details
  const siteVoltage = formData.siteVoltage || '480v-3phase';
  const powerQualityIssues = formData.powerQualityIssues || [];
  const utilityBillingType = formData.utilityBillingType || 'demand'; // flat, tou, demand, tou-demand
  const outageImpact = formData.outageImpact || ({ express: 'complete-shutdown', full: 'complete-shutdown', flex: 'partial-operations', mini: 'partial-operations', self: 'minor-disruptions', inbay: 'partial-operations', iba: 'partial-operations' }[facilityType] || 'partial-operations'); // FIX AUDIT-4b: was flat default, now facility-type-aware like WizB
  
  // Calculate voltage-adjusted capacity
  const voltageMultiplier = siteVoltage === '480v-3phase' ? 0.83 : siteVoltage === '208v-3phase' ? 0.36 : 0.24;
  const availableCapacityKW = Math.round(serviceRating * voltageMultiplier);
  
  // BESS value adjustments based on billing type
  const bessBillingMultiplier = {
    'flat': 0.3, // BESS mostly for backup only
    'tou': 1.2, // Arbitrage value
    'demand': 1.5, // Peak shaving very valuable
    'tou-demand': 1.8, // Both strategies
    'unknown': 1.0 // Default assumption
  }[utilityBillingType] || 1.0;
  
  // Outage cost for ROI calculations
  const hourlyOutageCost = {
    'complete-shutdown': 1500, // $1,500/hr average
    'partial-operations': 700,
    'minor-disruptions': 200,
    'no-impact': 0
  }[outageImpact] || 500;
  
  // Equipment checklist data
  const selectedEquipment = new Set(formData.selectedEquipment || []);
  const hasPumps = selectedEquipment.has('pumps');
  const hasDryers = selectedEquipment.has('dryers');
  const hasConveyor = selectedEquipment.has('conveyor');
  const hasVacuums = selectedEquipment.has('vacuums');
  const hasAirCompressor = selectedEquipment.has('airCompressor');
  const hasRO = selectedEquipment.has('ro');
  const hasLighting = selectedEquipment.has('lighting') || selectedEquipment.has('tunnelLighting');
  const hasPOS = selectedEquipment.has('pos');
  const hasElectricWaterHeater = selectedEquipment.has('waterHeaterElec');
  
  // ═══════════════════════════════════════════════════════════════════════════
  // NEW: Comprehensive equipment load calculation for ALL selected items
  // ═══════════════════════════════════════════════════════════════════════════
  
  // Helper to calculate kW from equipment definition
  const getEquipKW = (equipId) => {
    if (!selectedEquipment.has(equipId)) return 0;
    const count = parseInt(formData[`${equipId}Count`]) || 1;
    const hp = parseFloat(formData[`${equipId}HP`]);
    const kw = parseFloat(formData[`${equipId}KW`]);
    // Default values based on equipment type
    const defaults = {
      // Core tunnel
      sideWashers: { count: 4, hp: 3 }, wheelCleaners: { count: 2, hp: 3 }, topBrush: { count: 1, hp: 7.5 },
      wrapAround: { count: 2, hp: 5 }, undercarriage: { count: 1, hp: 7.5 },
      // Water treatment
      boosterPump: { count: 1, hp: 10 }, reclaimPumps: { count: 2, hp: 7.5 }, waterSoftener: { kw: 0.5 },
      chemPumps: { count: 10, kw: 0.1 }, hpWaterHeater: { kw: 15 },
      // Vacuum
      centralVac: { count: 1, hp: 25 }, fragrance: { count: 6, kw: 0.2 }, matCleaner: { count: 1, hp: 3 },
      airMachine: { count: 2, kw: 1.5 },
      // Compressed air
      airDryer: { kw: 2 }, airDoors: { count: 2, hp: 3 },
      // HVAC
      equipRoomHVAC: { kw: 5 }, officeHVAC: { kw: 3 }, waitingHVAC: { kw: 5 },
      exhaustFans: { count: 4, hp: 1.5 }, tunnelHeaters: { count: 2, kw: 15 }, floorHeat: { kw: 20 },
      // Lighting
      tunnelLighting: { kw: 5 }, lotLighting: { kw: 8 }, vacLighting: { kw: 3 },
      ledSigns: { count: 4, kw: 0.5 }, pylonSign: { kw: 1.5 },
      // Security/IT
      cameras: { count: 16, kw: 0.015 }, nvr: { kw: 0.3 }, networkSwitch: { kw: 0.3 },
      backOfficePC: { kw: 0.4 }, alarmPanel: { kw: 0.05 }, ups: { count: 2, kw: 0.1 },
      // Access/payment
      payKiosk: { count: 2, kw: 0.5 }, entryGate: { kw: 0.5 }, exitGate: { kw: 0.5 },
      lpr: { count: 2, kw: 0.15 }, carCounter: { kw: 0.1 },
      // Amenities
      breakRoom: { kw: 2.5 }, vendingMachines: { count: 2, kw: 1 }, bathroomExhaust: { count: 2, kw: 0.1 },
      handDryer: { count: 2, kw: 2 }, waterHeaterRest: { kw: 3 },
      // EV (handled separately below)
      evL2: { count: 0, kw: 19.2 }, evDCFC: { count: 0, kw: 50 }
    };
    const def = defaults[equipId] || {};
    const finalCount = count || def.count || 1;
    const finalHP = hp || def.hp || 0;
    const finalKW = kw || def.kw || 0;
    return finalCount * (finalHP > 0 ? finalHP * 0.746 : finalKW);
  };
  
  // Calculate additional loads from new equipment categories
  // ═══════════════════════════════════════════════════════════════════════════
  // SITE FEATURES BUNDLE LOADS (Streamlined Q9)
  // ═══════════════════════════════════════════════════════════════════════════
  
  // ═══════════════════════════════════════════════════════════════════════════
  // LOAD CALCULATOR — uses actual user-collected equipment data (no double-counting)
  // Each kW category is calculated ONCE from its authoritative source field.
  // ═══════════════════════════════════════════════════════════════════════════
  
  // Climate control (unique to siteFeatures — not captured elsewhere)
  const coldStates = ['MI', 'MN', 'WI', 'IL', 'OH', 'PA', 'NY', 'MA', 'CT', 'NJ', 'CO', 'UT', 'MT', 'ND', 'SD', 'NE', 'IA', 'IN', 'WY', 'ID', 'ME', 'NH', 'VT'];
  const isCold = coldStates.includes(locationData?.state || locationData?.utility?.state || '');
  const climateControlLevel = formData.siteFeatures?.climateControl || (isCold ? 'full' : 'standard');
  const climateControlKW = climateControlLevel === 'minimal' ? 10 : climateControlLevel === 'standard' ? 20 : 50;
  
  // Premium services (unique to siteFeatures — ceramic coat, tire shine stations, etc.)
  const premiumServicesLevel = formData.siteFeatures?.premiumServices || 
    (formData.facilityType === 'fullService' ? 'full' : formData.facilityType === 'express' ? 'basic' : 'none');
  const premiumServicesKW = premiumServicesLevel === 'none' ? 0 : premiumServicesLevel === 'basic' ? 3 : 10;
  
  // Security/IT (fixed — always present, not user-configurable)
  const securityITKW = 3;
  
  // Equipment count/HP values - handle 'unknown' by using typical defaults
  const pumpCount = hasPumps ? parseInt(formData.pumpCount) || 3 : 0;
  const pumpHP = hasPumps ? (formData.pumpHP === 'unknown' ? 15 : parseFloat(formData.pumpHP) || 15) : 0;
  // VFD uses three-state logic: null (not answered → treated as no VFD), true (has VFD), false (no VFD)
  const pumpHasVFD = formData.pumpHasVFD === true;
  const dryerCount = hasDryers ? parseInt(formData.dryerCount) || 4 : 0;
  const dryerHP = hasDryers ? (formData.dryerHP === 'unknown' ? 15 : parseFloat(formData.dryerHP) || 15) : 0;
  const dryerHasVFD = formData.dryerHasVFD === true;
  const conveyorHP = hasConveyor ? (formData.conveyorHP === 'unknown' ? 10 : parseFloat(formData.conveyorHP) || 10) : 0;
  const vacuumCount = hasVacuums ? parseInt(formData.vacuumCount) || 4 : 0;
  const airCompressorHP = hasAirCompressor ? (formData.airCompressorHP === 'unknown' ? 10 : parseFloat(formData.airCompressorHP) || 10) : 0;
  
  // NEW equipment fields — wired from user inputs instead of hardcoded guesses
  const hasBrushMotors = selectedEquipment.has('brushMotors');
  const brushMotorCount = hasBrushMotors ? (formData.brushMotorCount === 'unknown' ? 15 : parseInt(formData.brushMotorCount) || 15) : 0;
  const brushMotorAvgHP = 3; // Industry standard per motor
  const vacuumTurbineHP = hasVacuums ? (formData.vacuumTurbineHP === 'unknown' ? 30 : parseFloat(formData.vacuumTurbineHP) || 0) : 0;
  const vacuumCfg = VACUUM_CONFIG_OPTIONS.find(c => c.id === formData.vacuumConfig) || VACUUM_CONFIG_OPTIONS[0]; // default individual
  const dryerCfg = DRYER_CONFIG_OPTIONS.find(c => c.id === formData.dryerConfig) || DRYER_CONFIG_OPTIONS[0]; // default blowersOnly
  const hasHeatedDryers = dryerCfg.hasHeatedElements;
  const heatedDryerKW = dryerCfg.heatingKW; // 0 for blowers, 40 for heated, 24 for hybrid
  const roHP_calc = hasRO ? (formData.roHP === 'unknown' ? 5 : parseFloat(formData.roHP) || 5) : 0;
  const kioskCount = hasPOS ? parseInt(formData.kioskCount) || 2 : 0;
  const lightingTierKW = hasLighting ? ({ basic: 4, enhanced: 8, premium: 13 }[formData.lightingTier] || 4) : 3;
  const signageTierKW = { basic: 2, premium: 4, signature: 7 }[formData.signageTier] || 0;
  const officeFacilitiesKW = (() => {
    const of = formData.officeFacilities || [];
    let kw = 0;
    if (of.includes('office')) kw += 2;
    if (of.includes('breakRoom')) kw += 2.5;
    if (of.includes('bathrooms')) kw += 0.5;
    if (of.includes('securityCameras')) kw += 0.3;
    return kw;
  })();
  
  // Water reclaim level and percentage
  const waterReclaimLevel = formData.waterReclaimLevel || 'none'; // 'none', 'basic', 'standard', 'advanced'
  const reclaimPct = waterReclaimLevel === 'none' ? 0 : 
                     waterReclaimLevel === 'basic' ? 0.55 : 
                     waterReclaimLevel === 'standard' ? 0.75 : 0.90;
  const hasReclaim = reclaimPct > 0;
  
  // Other data
  const roofArea = parseInt(formData.roofArea) || 5000;
  const carportArea = formData.carportInterest !== 'no' ? parseInt(formData.carportArea) || 0 : 0;
  const l2Chargers = parseInt(formData.l2Chargers) || 0;
  const dcChargers = parseInt(formData.dcChargers) || 0;
  
  // Equipment age degradation factor — older motors draw more current due to
  // bearing wear, insulation breakdown, and reduced magnetic efficiency
  const ageFactor = {
    'new': 1.0,        // 0-5 years: near-nameplate efficiency
    'average': 1.12,   // FIX AUDIT-4b: alias for 'moderate' (WizB compat)
    'moderate': 1.12,  // 5-10 years: ~12% degradation
    'old': 1.25,       // 10-15 years: ~25% degradation
    'veryOld': 1.40    // 15+ years: ~40% degradation
  }[formData.equipmentAge] || 1.0;
  
  // ========================================
  // CALCULATE ACTUAL ENERGY CONSUMPTION
  // ========================================
  
  // Tunnel dryers: #1 electric consumer at car washes (INDUCTIVE)
  // Dryer config affects duty cycle — heated runs longer per vehicle, hybrid is balanced
  const totalDryerHP = dryerCount * dryerHP;
  const dryerEfficiencyFactor = dryerHasVFD === true ? 0.80 : dryerCfg.efficiencyMult;
  const dryerKW = totalDryerHP * 0.746 * dryerEfficiencyFactor;
  const dryerHoursPerDay = dryerCfg.dutyCycle > 0 ? Math.min(operatingHours * dryerCfg.dutyCycle, dailyVehicles * 0.025) : 0;
  const dryerKWhPerMonth = dryerKW * ageFactor * dryerHoursPerDay * daysPerWeek * 4.33;
  
  // Heated dryer elements (RESISTIVE) — separate from blower motors
  const heatedDryerKWhPerMonth = heatedDryerKW * dryerHoursPerDay * daysPerWeek * 4.33;
  
  // High pressure pumps (INDUCTIVE)
  // Pump config affects duty cycle and efficiency — standard runs less, high pressure runs more, VFD is most efficient
  const pumpCfg = PUMP_CONFIG_OPTIONS.find(c => c.id === formData.pumpConfig) || PUMP_CONFIG_OPTIONS[1]; // default highPressure
  const totalPumpHP = pumpCount * pumpHP;
  const pumpEfficiencyFactor = (pumpHasVFD === true || pumpCfg.autoVFD) ? 0.75 : pumpCfg.efficiencyMult;
  const pumpKW = totalPumpHP * 0.746 * pumpEfficiencyFactor;
  const pumpHoursPerDay = Math.min(operatingHours * pumpCfg.dutyCycle, dailyVehicles * 0.02);
  const pumpKWhPerMonth = pumpKW * ageFactor * pumpHoursPerDay * daysPerWeek * 4.33;
  
  // Brush motors (INDUCTIVE) — wraps, side brushes, top brush, tire shiners
  const brushMotorKW = brushMotorCount * brushMotorAvgHP * 0.746;
  const brushMotorKWhPerMonth = brushMotorKW * ageFactor * (Math.min(operatingHours * 0.5, dailyVehicles * 0.02)) * daysPerWeek * 4.33;
  
  // Water heating (RESISTIVE if electric)
  // Reclaim systems pre-warm water (~60-70°F vs 40-50°F fresh), reducing heating load by ~25%
  // FIX P1-4: Proportional reclaim heating reduction (aligned with WizB Calc1)
  // none: 1.0, basic(55%): 0.81, standard(75%): 0.74, advanced(90%): 0.69
  const reclaimHeatingReduction = 1.0 - (reclaimPct * 0.35);
  let waterHeaterKW = 0;
  let waterHeaterKWhPerMonth = 0;
  let gasThermsMo = 0;
  if (waterHeater === 'electric' || hasElectricWaterHeater) {
    waterHeaterKW = bayCount * 50;
    waterHeaterKWhPerMonth = waterHeaterKW * operatingHours * 0.4 * daysPerWeek * 4.33 * reclaimHeatingReduction;
  } else if (waterHeater === 'gas' || waterHeater === 'propane') {
    // Propane: ~91.5 kBTU/gallon ≈ 0.915 therms/gallon, ~15% less efficient than natural gas
    const propaneEffPenalty = waterHeater === 'propane' ? 1.15 : 1.0;
    gasThermsMo = bayCount * 200 * (climate.hdd / 5000) * reclaimHeatingReduction * propaneEffPenalty;
  }
  
  // Vacuum stations (INDUCTIVE) — config-driven architecture
  // Individual: each station has own motor, intermittent customer use (25% duty)
  // Central Turbine: single large motor, runs continuously (70% duty)  
  // Hybrid: central turbine + individual islands at reduced duty
  const vacuumStationKW = vacuumCfg.stationHP > 0 ? vacuumCount * vacuumCfg.stationHP * 0.746 : 0;
  const vacuumTurbineKW = vacuumCfg.hasTurbine ? (vacuumTurbineHP || vacuumCfg.turbineHP) * 0.746 * vacuumCfg.efficiencyMult : 0;
  const vacuumKW = vacuumStationKW + vacuumTurbineKW;
  const vacuumStationHours = vacuumCfg.stationHP > 0 ? operatingHours * vacuumCfg.dutyCycle : 0;
  const vacuumTurbineHours = vacuumCfg.hasTurbine ? operatingHours * vacuumCfg.dutyCycle : 0;
  const vacuumKWhPerMonth = (vacuumStationKW * ageFactor * vacuumStationHours + vacuumTurbineKW * ageFactor * vacuumTurbineHours) * daysPerWeek * 4.33;
  
  // Conveyor motors (INDUCTIVE)
  const conveyorKW = conveyorHP * 0.746;
  const conveyorKWhPerMonth = conveyorKW * ageFactor * operatingHours * 0.5 * daysPerWeek * 4.33;
  
  // Air compressors (INDUCTIVE)
  const airCompKW = airCompressorHP * 0.746;
  const airCompKWhPerMonth = airCompKW * ageFactor * operatingHours * 0.3 * daysPerWeek * 4.33;
  
  // RO system (INDUCTIVE) — uses actual HP from user input instead of hardcoded 4 kW
  const roKW = hasRO ? roHP_calc * 0.746 : 0;
  const roKWhPerMonth = roKW * operatingHours * 0.5 * daysPerWeek * 4.33;
  
  // Lighting (RESISTIVE) — uses lighting tier from user input
  const lightingKW = lightingTierKW;
  const lightingKWhPerMonth = lightingKW * operatingHours * 0.7 * daysPerWeek * 4.33;
  
  // Signage (RESISTIVE) — uses signage tier from user input, runs ~16 hrs/day
  const signageKW = signageTierKW;
  const signageKWhPerMonth = signageKW * 16 * daysPerWeek * 4.33;
  
  // POS/Payment kiosks (RESISTIVE) — uses actual kiosk count, ~0.5 kW each, runs 24/7
  const posKW = kioskCount * 0.5;
  const posKWhPerMonth = posKW * 24 * 30;
  
  // Office/Amenities (RESISTIVE) — from user-selected facilities
  const officeKWhPerMonth = officeFacilitiesKW * operatingHours * 0.5 * daysPerWeek * 4.33;
  
  // HVAC / Climate control (RESISTIVE) — from siteFeatures selection
  const hvacKW = climateControlKW;
  const hvacKWhPerMonth = hvacKW * operatingHours * 0.5 * daysPerWeek * 4.33;
  
  // Premium services (RESISTIVE) — ceramic coat, tire shine stations
  const premiumKWhPerMonth = premiumServicesKW * operatingHours * 0.3 * daysPerWeek * 4.33;
  
  // Security/IT (RESISTIVE) — fixed, runs 24/7
  const securityKWhPerMonth = securityITKW * 24 * 30;
  
  // EV Chargers
  const evL2KW = l2Chargers * 12;
  const evDCKW = dcChargers * 50;
  const evKWhPerMonth = (evL2KW * 8 + evDCKW * 1.2) * daysPerWeek * 4.33; // FIX: Was 3.0 hrs DCFC, aligned to 1.2 (car wash DCFC idle most of day)
  
  // Total monthly kWh — each category counted exactly ONCE
  const monthlyKWh = Math.round(
    dryerKWhPerMonth + heatedDryerKWhPerMonth + pumpKWhPerMonth + brushMotorKWhPerMonth +
    waterHeaterKWhPerMonth + vacuumKWhPerMonth + conveyorKWhPerMonth + airCompKWhPerMonth +
    roKWhPerMonth + lightingKWhPerMonth + signageKWhPerMonth + posKWhPerMonth +
    officeKWhPerMonth + hvacKWhPerMonth + premiumKWhPerMonth + securityKWhPerMonth +
    evKWhPerMonth
  );
  
  // Resistive vs inductive loads
  const resistiveKW = waterHeaterKW + heatedDryerKW + lightingKW + signageKW + posKW + officeFacilitiesKW + hvacKW + premiumServicesKW + securityITKW;
  const inductiveKW = dryerKW + pumpKW + brushMotorKW + vacuumKW + conveyorKW + airCompKW + roKW;
  const totalConnectedKW = resistiveKW + inductiveKW + evL2KW + evDCKW;
  
  // Peak demand with 50% headroom on largest motor for 15-min demand metering ratchet
  // (Actual motor inrush is 5-6× but demand billing averages over 15-min intervals)
  const largestMotorKW = Math.max(dryerKW, pumpKW, brushMotorKW, conveyorKW, airCompKW, vacuumTurbineKW);
  const runningInductiveKW = inductiveKW * 0.8; // 80% simultaneous
  const peakKW = Math.round(
    resistiveKW + runningInductiveKW + (largestMotorKW * 0.5) + // 50% headroom for demand metering
    evL2KW * 0.5 + evDCKW * 0.3
  );
  
  // Annual totals
  const annualKWh = monthlyKWh * 12;
  const annualTherms = gasThermsMo * 12;
  
  // Current costs
  const annualElectricUsage = annualKWh * electric.avgRate;
  const annualDemandCharges = peakKW * electric.demandCharge * 12;
  const annualGasCost = annualTherms * effectiveFuelRate;
  const totalAnnualEnergy = annualElectricUsage + annualDemandCharges + annualGasCost;
  
  // ========================================
  // BUILD OPPORTUNITIES
  // ========================================
  const opportunities = [];
  
  // 1. SOLAR PV - Roof + Carport with ENERGY GAP ANALYSIS
  const totalSolarArea = roofArea + carportArea;
  
  // ═══════════════════════════════════════════════════════════════════════════
  // ENERGY GAP ANALYSIS - Roof capacity vs Demand
  // ═══════════════════════════════════════════════════════════════════════════
  const wattsPerSqFtRoof = 15; // FIX #43: Aligned with B — 15 W/sqft commercial flat roof (modern 22%+ panels with row spacing)
  const usableRoofPct = 0.65; // Account for HVAC, vents, setbacks
  const maxRoofKW = Math.round((roofArea * usableRoofPct * wattsPerSqFtRoof) / 1000);
  const maxRoofAnnualKWh = maxRoofKW * solarData.annualProduction;
  const roofOnlyOffset = annualKWh > 0 ? Math.round((maxRoofAnnualKWh / annualKWh) * 100) : 0;
  
  // Carport analysis if gap exists
  const targetOffset = 80; // Target 80% offset
  const energyGap = annualKWh * (targetOffset / 100) - maxRoofAnnualKWh;
  const hasEnergyGap = energyGap > 0 && roofOnlyOffset < targetOffset;
  
  // Carport sizing to fill gap
  const wattsPerSqFtCarport = 13; // FIX #43: Aligned with B — lower density for vehicle clearance/tilt
  const carportKWNeeded = hasEnergyGap && solarData.annualProduction > 0 ? Math.round(energyGap / solarData.annualProduction) : 0;
  const carportAreaNeeded = Math.round(carportKWNeeded * 1000 / wattsPerSqFtCarport);
  const canFillGapWithCarport = carportArea >= carportAreaNeeded;
  
  // Final solar sizing
  const solarSystemKW = Math.min(
    solarData.annualProduction > 0 ? Math.round((annualKWh * 0.85) / solarData.annualProduction) : 0, // Size to offset 85%
    Math.round(totalSolarArea / 100) // 100 sqft per kW conservative
  );
  const solarAnnualProduction = Math.round(solarSystemKW * solarData.annualProduction * getWeatherDerating(stateCode)); // FIX A-1: weather derating
  // FIX SYNC-13: Solar savings aligned with WizB — conservative (no NEM export credit in preview)
  const solarAnnualSavings = Math.round(solarAnnualProduction * electric.avgRate * getSelfConsumptionRate(solarAnnualProduction, annualKWh));
  const roofSolarKW = Math.min(maxRoofKW, solarSystemKW);
  const carportSolarKW = Math.max(0, solarSystemKW - roofSolarKW);
  const solarCost = roofSolarKW * (roofSolarKW <= 20 ? 3200 : roofSolarKW <= 50 ? 2800 : roofSolarKW <= 200 ? 2500 : 2200) + carportSolarKW * (CARPORT_COST_PER_W * 1000); // FIX SYNC-7: size-tiered $/W + CARPORT_COST_PER_W (aligned with WizB)
  const solarNetCost = Math.round(solarCost * ITC_NET_MULTIPLIER); // FIX A-6: dynamic ITC (was hardcoded 0.70)
  // FIX A-8 (Phase 3): State incentives reduce net cost
  const stateInc = STATE_INCENTIVES_A[stateCode] || STATE_INCENTIVES_A.default;
  const solarStateRebate = Math.round(solarSystemKW * stateInc.solarPerKW);
  const solarNetCostAfterState = solarNetCost - solarStateRebate;
  
  // Energy gap recommendation
  let gapStrategy = '';
  let gapDescription = '';
  if (!hasEnergyGap) {
    gapStrategy = 'roof_sufficient';
    gapDescription = `Roof solar alone (${maxRoofKW} kW max) can achieve ${roofOnlyOffset}% offset.`;
  } else if (canFillGapWithCarport) {
    gapStrategy = 'roof_plus_carport';
    gapDescription = `Roof provides ${roofOnlyOffset}% offset. Add ${carportKWNeeded} kW carport solar over vacuum area to reach ${targetOffset}%.`;
  } else if (carportArea > 0) {
    gapStrategy = 'partial_carport';
    gapDescription = `Roof provides ${roofOnlyOffset}%. Carport can add ${Math.round(carportArea * wattsPerSqFtCarport / 1000)} kW. Consider generator for resilience.`;
  } else {
    gapStrategy = 'roof_plus_generator';
    gapDescription = `Roof maxes at ${maxRoofKW} kW (${roofOnlyOffset}% offset). Generator recommended for backup resilience.`;
  }
  
  if (solarSystemKW > 0) {
    opportunities.push({
      id: 'solarPV', rank: 0, name: 'Solar PV Installation', icon: Sun, category: 'Generation',
      annualSavings: solarAnnualSavings, investmentCost: solarCost, netCost: solarNetCostAfterState,
      stateRebate: solarStateRebate, stateProgram: stateInc.notes, // FIX A-8
      paybackYears: solarAnnualSavings > 0 ? solarNetCostAfterState / solarAnnualSavings : 99,
      sizing: `${solarSystemKW} kW (${roofSolarKW} roof${carportSolarKW > 0 ? ` + ${carportSolarKW} carport` : ''})`,
      description: `Generate ${Math.round(solarAnnualProduction).toLocaleString()} kWh/year, offset ${annualKWh > 0 ? Math.round(solarAnnualProduction / annualKWh * 100) : 0}% of usage`,
      // NEW: Energy gap analysis
      energyGapAnalysis: {
        strategy: gapStrategy,
        maxRoofKW,
        maxRoofOffset: roofOnlyOffset,
        targetOffset,
        energyGapKWh: Math.max(0, Math.round(energyGap)),
        carportKWNeeded,
        carportAreaNeeded,
        recommendation: gapDescription
      },
      factors: [
        { label: 'Solar Resource', value: solarData.irradiance, unit: 'kWh/m²/day', quality: solarData.irradiance > 5 ? 'excellent' : solarData.irradiance > 4 ? 'good' : 'moderate' },
        { label: 'Roof Capacity', value: maxRoofKW, unit: 'kW max', quality: roofOnlyOffset >= targetOffset ? 'sufficient' : 'needs carport' },
        { label: 'Energy Gap', value: hasEnergyGap ? Math.round(energyGap / 1000) + ' MWh' : 'None', quality: hasEnergyGap ? (canFillGapWithCarport ? 'carport can fill' : 'generator backup') : 'covered' },
        ...(getWeatherDerating(stateCode) < 1.0 ? [{ label: 'Weather Adj', value: Math.round(getWeatherDerating(stateCode) * 100), unit: '%', quality: getWeatherDerating(stateCode) < 0.90 ? 'significant' : 'minor' }] : []),
        { label: '⚠️ Tariff Note', value: 'Panel tariffs 25-80% on imports', unit: '', quality: 'Domestic panels avoid tariff risk' }
      ],
      whyThisBusiness: `${gapDescription} Total system: ${solarSystemKW} kW generating ${Math.round(solarAnnualProduction).toLocaleString()} kWh/year.`
    });
  }
  
  // 2. BATTERY PEAK SHAVING - Target dryer peaks
  const peakReduction = Math.round(dryerKW * 0.5); // Shave 50% of dryer peak
  const batteryKWh = peakReduction * 2; // 2-hour duration
  const peakShavingSavings = Math.round(peakReduction * electric.demandCharge * 0.93 * 12); // FIX #131: 93% RT eff
  // FIX #136: Size-tiered BESS pricing (aligned with B)
  const bessPerKWh = batteryKWh > 500 ? 150 : batteryKWh > 200 ? 250 : batteryKWh > 100 ? 300 : batteryKWh > 50 ? 400 : 600; // SYNC WizB: 5-tier pricing (was 4-tier)
  const batteryCost = batteryKWh * bessPerKWh;
  const batteryNetCost = Math.round(batteryCost * ITC_NET_MULTIPLIER); // FIX A-6: dynamic ITC
  
  if (peakShavingSavings > 1000) {
    opportunities.push({
      id: 'batteryPeakShaving', rank: 0, name: 'Battery Peak Shaving', icon: Battery, category: 'Demand Management',
      annualSavings: peakShavingSavings, investmentCost: batteryCost, netCost: batteryNetCost,
      paybackYears: peakShavingSavings > 0 ? batteryNetCost / peakShavingSavings : 99,
      sizing: `${peakReduction} kW / ${batteryKWh} kWh`,
      description: `Reduce peak demand from ${peakKW} kW to ${peakKW - peakReduction} kW during dryer cycles`,
      factors: [
        { label: 'Dryer Peak', value: Math.round(dryerKW), unit: 'kW', quality: 'primary target' },
        { label: 'Demand Charge', value: electric.demandCharge, unit: '$/kW/mo', quality: electric.demandCharge > 15 ? 'high' : 'moderate' },
        { label: 'Peak Reduction', value: peakReduction, unit: 'kW', quality: `${Math.round(peakReduction / peakKW * 100)}% of total` }
      ],
      whyThisBusiness: `Your ${bayCount} tunnel dryers at ${dryerHP} HP create ${Math.round(dryerKW)} kW peaks. Battery can absorb dryer startup surges and reduce demand charges by $${Math.round(peakShavingSavings / 12).toLocaleString()}/mo.`
    });
  }
  
  // 3. HEAT PUMP WATER HEATER - Only if currently gas or propane
  if ((waterHeater === 'gas' || waterHeater === 'propane') && annualTherms > 500) {
    const hpwhCOP = 3.5;
    const electricEquivalentKWh = annualTherms * 29.3 / hpwhCOP;
    const gasCostSaved = annualTherms * effectiveFuelRate;
    const electricCostAdded = electricEquivalentKWh * electric.avgRate;
    const hpwhAnnualSavings = Math.round(gasCostSaved - electricCostAdded);
    const hpwhCost = Math.round(bayCount * 25000); // ~$25k per tunnel for commercial HPWH
    const hpwhNetCost = Math.round(hpwhCost * ITC_NET_MULTIPLIER); // FIX A-6: dynamic ITC
    const fuelLabel = waterHeater === 'propane' ? 'propane' : 'gas';
    
    if (hpwhAnnualSavings > 0) {
      opportunities.push({
        id: 'heatPumpWaterHeater', rank: 0, name: 'Heat Pump Water Heater', icon: Droplets, category: 'Electrification',
        annualSavings: hpwhAnnualSavings, investmentCost: hpwhCost, netCost: hpwhNetCost,
        paybackYears: hpwhAnnualSavings > 0 ? hpwhNetCost / hpwhAnnualSavings : 99,
        sizing: `Replace ${Math.round(annualTherms / 12)} therms/mo ${fuelLabel}`,
        description: `Convert ${fuelLabel} water heating to 3.5 COP heat pump, eliminate ${Math.round(annualTherms).toLocaleString()} therms/year`,
        factors: [
          { label: `Current ${fuelLabel === 'propane' ? 'Propane' : 'Gas'}`, value: Math.round(annualTherms / 12), unit: 'therms/mo', quality: 'water heating' },
          { label: `${fuelLabel === 'propane' ? 'Propane' : 'Gas'} Rate`, value: effectiveFuelRate.toFixed(2), unit: '$/therm', quality: effectiveFuelRate > 1.5 ? 'high' : 'moderate' },
          { label: 'Heat Pump COP', value: '3.5', unit: 'efficiency', quality: `vs 0.8-0.95 ${fuelLabel}` }
        ],
        whyThisBusiness: `Your ${bayCount} tunnel${bayCount > 1 ? 's use' : ' uses'} ~${Math.round(gasThermsMo)} therms/month for ${fuelLabel} water heating. Heat pump reduces operating cost by ${gasCostSaved > 0 ? Math.round((gasCostSaved - electricCostAdded) / gasCostSaved * 100) : 0}% while eliminating ${fuelLabel} dependency.`
      });
    }
  }
  
  // 4. VFD ON PUMPS - Only if NOT already VFD-equipped and total pump HP >= 15
  if (pumpHasVFD !== true && !pumpCfg.autoVFD && hasPumps && totalPumpHP >= 15) {
    const pumpAnnualKWh = pumpKWhPerMonth * 12;
    const vfdSavings = Math.round(pumpAnnualKWh * 0.30 * electric.avgRate);
    const vfdCost = Math.round(totalPumpHP * 200); // ~$200/HP for VFD
    
    opportunities.push({
      id: 'pumpVFD', rank: 0, name: 'VFD on High-Pressure Pumps', icon: Settings, category: 'Efficiency',
      annualSavings: vfdSavings, investmentCost: vfdCost, netCost: vfdCost,
      paybackYears: vfdSavings > 0 ? vfdCost / vfdSavings : 99,
      sizing: `${pumpCount}× ${pumpHP} HP pumps (${totalPumpHP} HP total)`,
      description: `Variable frequency drives reduce pump energy 30% with soft-start`,
      factors: [
        { label: 'Pump Status', value: 'Fixed Speed', unit: '', quality: 'VFD upgrade candidate' },
        { label: 'Total Pump HP', value: totalPumpHP, unit: 'HP', quality: `${pumpCount}× ${pumpHP}HP` },
        { label: 'VFD Savings', value: '30', unit: '%', quality: 'typical' }
      ],
      whyThisBusiness: `Your ${pumpCount} pumps (${totalPumpHP} HP total) run ${Math.round(pumpHoursPerDay)} hrs/day. VFDs provide soft-start (extends pump life), pressure matching, and 30% energy savings.`
    });
  }
  
  // 4b. VFD ON DRYERS - Only if NOT already VFD-equipped and total dryer HP >= 20
  if (dryerHasVFD !== true && hasDryers && totalDryerHP >= 20) {
    const dryerAnnualKWh = dryerKWhPerMonth * 12;
    const vfdSavings = Math.round(dryerAnnualKWh * 0.25 * electric.avgRate); // 25% savings for dryers
    const vfdCost = Math.round(totalDryerHP * 180); // ~$180/HP for VFD on blowers
    
    opportunities.push({
      id: 'dryerVFD', rank: 0, name: 'VFD on Blowers/Dryers', icon: Wind, category: 'Efficiency',
      annualSavings: vfdSavings, investmentCost: vfdCost, netCost: vfdCost,
      paybackYears: vfdSavings > 0 ? vfdCost / vfdSavings : 99,
      sizing: `${dryerCount}× ${dryerHP} HP blowers (${totalDryerHP} HP total)`,
      description: `Variable speed dryers match airflow to vehicle speed, reduce energy 25%`,
      factors: [
        { label: 'Dryer Status', value: 'Fixed Speed', unit: '', quality: 'VFD upgrade candidate' },
        { label: 'Total Dryer HP', value: totalDryerHP, unit: 'HP', quality: `${dryerCount}× ${dryerHP}HP` },
        { label: 'VFD Savings', value: '25', unit: '%', quality: 'typical' }
      ],
      whyThisBusiness: `Your ${dryerCount} blowers (${totalDryerHP} HP total) are the #1 energy consumer. VFDs modulate airflow based on vehicle speed and wet conditions, saving 25%.`
    });
  }
  
  // 5. LED LIGHTING - Always applicable
  const lightingAnnualKWh = lightingKWhPerMonth * 12;
  const ledSavings = Math.round(lightingAnnualKWh * 0.50 * electric.avgRate);
  const ledCost = Math.round(lightingKW * 150); // ~$150 per kW of lighting
  
  opportunities.push({
    id: 'ledLighting', rank: 0, name: 'LED Lighting Upgrade', icon: Zap, category: 'Efficiency',
    annualSavings: ledSavings, investmentCost: ledCost, netCost: ledCost,
    paybackYears: ledSavings > 0 ? ledCost / ledSavings : 99,
    sizing: `${Math.round(lightingKW)} kW → ${Math.round(lightingKW * 0.5)} kW`,
    description: `Replace existing lighting with LEDs for 50% reduction`,
    factors: [
      { label: 'Current Load', value: Math.round(lightingKW), unit: 'kW', quality: 'lighting' },
      { label: 'Operating Hours', value: operatingHours * daysPerWeek, unit: 'hrs/week', quality: `${daysPerWeek} days` },
      { label: 'Savings', value: '50', unit: '%', quality: 'typical LED' }
    ],
    whyThisBusiness: `${operatingHours} hours/day × ${daysPerWeek} days/week = high lighting utilization. LEDs also reduce cooling load and maintenance.`
  });
  
  // 6. VACUUM STATION EFFICIENCY - If has vacuums
  if (hasVacuums && vacuumCount > 0) {
    const vacuumAnnualKWh = vacuumKWhPerMonth * 12;
    const vacuumSavings = Math.round(vacuumAnnualKWh * 0.25 * electric.avgRate);
    const vacuumCost = vacuumCount * 1500; // Motor upgrades, timers
    
    opportunities.push({
      id: 'vacuumEfficiency', rank: 0, name: 'Vacuum Station Efficiency', icon: Wind, category: 'Efficiency',
      annualSavings: vacuumSavings, investmentCost: vacuumCost, netCost: vacuumCost,
      paybackYears: vacuumSavings > 0 ? vacuumCost / vacuumSavings : 99,
      sizing: `${vacuumCount} stations`,
      description: `High-efficiency motors, auto-shutoff timers, duct optimization`,
      factors: [
        { label: 'Stations', value: vacuumCount, unit: 'units', quality: 'vacuum island' },
        { label: 'Total Load', value: Math.round(vacuumKW), unit: 'kW', quality: `${vacuumCount}x ~4HP` },
        { label: 'Savings', value: '25', unit: '%', quality: 'efficiency upgrade' }
      ],
      whyThisBusiness: `${vacuumCount} vacuum stations at 25% utilization over ${operatingHours} hours. Timer controls and efficient motors reduce waste.`
    });
  }
  
  // 7. WATER RECLAIM SYSTEM - Install or upgrade based on current level
  const gallonsPerCar = facilityType === 'express' ? 35 : facilityType === 'fullService' ? 55 : facilityType === 'mini' ? 25 : 15;
  const annualGallons = dailyVehicles * daysPerWeek * 52 * gallonsPerCar;
  const waterCostPerGallon = 0.005; // ~$5 per 1000 gallons
  
  // Calculate potential savings based on reclaim level
  if (waterReclaimLevel !== 'advanced') {
    const currentSavingsPct = reclaimPct;
    const targetSavingsPct = 0.90; // Advanced system target
    const additionalSavingsPct = targetSavingsPct - currentSavingsPct;
    
    // Water savings from upgrade/install
    const waterSavings = Math.round(annualGallons * additionalSavingsPct * waterCostPerGallon);
    // Heating energy savings (pre-warmed reclaimed water)
    const heatingEnergySavings = Math.round(waterSavings * (waterReclaimLevel === 'none' ? 2 : 1));
    const reclaimSavings = waterSavings + heatingEnergySavings;
    
    // Cost depends on whether installing new or upgrading
    let reclaimCost;
    let oppName;
    let oppDescription;
    
    if (waterReclaimLevel === 'none') {
      reclaimCost = 35000 + bayCount * 10000; // Full install
      oppName = 'Water Reclaim System';
      oppDescription = `Install advanced reclaim system (90% recycling)`;
    } else if (waterReclaimLevel === 'basic') {
      reclaimCost = 20000 + bayCount * 5000; // Upgrade basic → advanced
      oppName = 'Upgrade to Advanced Reclaim';
      oppDescription = `Upgrade from basic (55%) to advanced (90%) reclaim`;
    } else { // standard
      reclaimCost = 12000 + bayCount * 3000; // Upgrade standard → advanced
      oppName = 'Upgrade to Advanced Reclaim';
      oppDescription = `Upgrade from standard (75%) to advanced (90%) reclaim`;
    }
    
    opportunities.push({
      id: 'waterReclaim', rank: 0, name: oppName, icon: Leaf, category: 'Sustainability',
      annualSavings: reclaimSavings, investmentCost: reclaimCost, netCost: reclaimCost,
      paybackYears: reclaimSavings > 0 ? reclaimCost / reclaimSavings : 99,
      sizing: `${Math.round(annualGallons / 1000000 * additionalSavingsPct).toLocaleString()}M gal/year additional savings`,
      description: oppDescription,
      factors: [
        { label: 'Current Reclaim', value: Math.round(currentSavingsPct * 100), unit: '%', quality: waterReclaimLevel === 'none' ? 'no system' : waterReclaimLevel },
        { label: 'Target Reclaim', value: '90', unit: '%', quality: 'advanced system' },
        { label: 'Additional Savings', value: Math.round(additionalSavingsPct * 100), unit: '%', quality: 'water + heating' }
      ],
      whyThisBusiness: waterReclaimLevel === 'none' 
        ? `${dailyVehicles} cars/day × ${gallonsPerCar} gallons = ${Math.round(annualGallons / 1000).toLocaleString()}K gal/year. Advanced reclaim saves 90% of water/sewer plus pre-warmed water reduces heating costs.`
        : `Your ${waterReclaimLevel} system saves ${Math.round(currentSavingsPct * 100)}%. Upgrading to advanced (membrane/UV) adds ${Math.round(additionalSavingsPct * 100)}% more savings plus better water quality.`
    });
  }
  
  // 8. DEMAND RESPONSE - If enough curtailable load
  const curtailableKW = Math.round((vacuumKW + dryerKW * 0.3) * 0.5);
  if (curtailableKW > 20) {
    const drSavings = Math.round(curtailableKW * 150);
    
    opportunities.push({
      id: 'demandResponse', rank: 0, name: 'Demand Response', icon: TrendingUp, category: 'Grid Services',
      annualSavings: drSavings, investmentCost: 5000, netCost: 5000,
      paybackYears: drSavings > 0 ? 5000 / drSavings : 99,
      sizing: `${curtailableKW} kW curtailable`,
      description: `Earn utility incentives for reducing load during grid events`,
      factors: [
        { label: 'Curtailable', value: curtailableKW, unit: 'kW', quality: 'vacuums + partial dryers' },
        { label: 'Incentive', value: '~$150', unit: '/kW/year', quality: 'typical utility rate' },
        { label: 'Events', value: '10-15', unit: '/year', quality: '~4 hours each' }
      ],
      whyThisBusiness: `Vacuums (${Math.round(vacuumKW)} kW) can pause during events. Partial dryer curtailment during off-peak hours adds ${curtailableKW} kW of grid services revenue.`
    });
  }
  
  // 9. EV CHARGING EXPANSION - If interested/has chargers
  if (l2Chargers > 0 || dcChargers > 0 || carportArea > 0) {
    const newL2 = carportArea > 0 ? Math.round(carportArea / 500) : 4; // 1 L2 per 500 sqft carport, or 4 default
    const evRevenue = newL2 * 3000; // ~$3k/year per L2 in revenue
    const evInstallCost = newL2 * 5000;
    // FIX A-6: §30C EV credit — 30% but capped at $100K per property
    const evCreditAmount = Math.min(evInstallCost * EV_CREDIT_RATE, EV_CREDIT_MAX);
    const evNetCost = Math.round(evInstallCost - evCreditAmount);
    
    opportunities.push({
      id: 'evCharging', rank: 0, name: 'EV Charging Expansion', icon: BatteryCharging, category: 'Revenue',
      annualSavings: evRevenue, investmentCost: evInstallCost, netCost: evNetCost,
      paybackYears: evNetCost / evRevenue,
      sizing: `Add ${newL2} Level 2 chargers`,
      description: `Generate revenue from EV charging, attract premium customers`,
      factors: [
        { label: 'New Chargers', value: newL2, unit: 'L2 ports', quality: carportArea > 0 ? 'under carport' : 'lot install' },
        { label: 'Revenue Est.', value: Math.round(evRevenue / newL2 / 12), unit: '$/port/mo', quality: 'after electricity' },
        { label: 'Dwell Time', value: '15-30', unit: 'minutes', quality: 'matches wash time' }
      ],
      whyThisBusiness: `Car wash customers dwell 15-30 minutes - perfect for L2 charging. ${carportArea > 0 ? `${carportArea.toLocaleString()} sq ft carport provides covered charging.` : 'Adds customer amenity and revenue stream.'}`
    });
  }
  
  // 10. RATE OPTIMIZATION
  const rateOptSavings = Math.round((annualElectricUsage + annualDemandCharges) * 0.05);
  
  opportunities.push({
    id: 'rateOptimization', rank: 0, name: 'Utility Rate Optimization', icon: DollarSign, category: 'Rate Optimization',
    annualSavings: rateOptSavings, investmentCost: 2500, netCost: 2500,
    paybackYears: rateOptSavings > 0 ? 2500 / rateOptSavings : 99,
    sizing: 'Rate analysis & switching',
    description: `Evaluate TOU rates, demand response tariffs, and utility programs`,
    factors: [
      { label: 'Annual Electric', value: Math.round((annualElectricUsage + annualDemandCharges) / 1000), unit: '$K', quality: 'usage + demand' },
      { label: 'Current Rate', value: electric.avgRate, unit: '$/kWh', quality: 'average' },
      { label: 'Potential', value: '3-8', unit: '% savings', quality: 'typical range' }
    ],
    whyThisBusiness: `$${Math.round(annualElectricUsage + annualDemandCharges).toLocaleString()}/year electric spend. Car washes with off-peak hours may benefit from TOU rates.`
  });
  
  // ========================================
  // FIX SYNC-5: COMPOSITE SCORING (aligned with WizB)
  // savings (30%) + 25yr NPV (25%) + payback (20%) + ROI (15%) + category (10%)
  // ========================================
  const ITC_ELIGIBLE_CW = new Set(['solarPV', 'batteryPeakShaving']);
  const DEFAULT_TAX_RATE_CW = ASSUMED_TAX_RATE;
  opportunities.forEach(opp => {
    if (ITC_ELIGIBLE_CW.has(opp.id)) {
      const macrsYr1 = Math.round(opp.investmentCost * 0.50 * DEFAULT_TAX_RATE_CW);
      opp._effectiveNetCost = opp.netCost - macrsYr1;
      opp._effectivePayback = opp.annualSavings > 0 ? opp._effectiveNetCost / opp.annualSavings : 99;
    } else {
      opp._effectiveNetCost = opp.netCost;
      opp._effectivePayback = opp.paybackYears;
    }
  });
  const maxSavings_cw = Math.max(...opportunities.map(o => o.annualSavings), 2000); // FIX M-2
  const NPV_MULT_CW = { solarPV: 23, batteryPeakShaving: 21, ledLighting: 24, pumpVFD: 24, dryerVFD: 24, vacuumEfficiency: 24, heatPumpWaterHeater: 23, waterReclaim: 15, demandResponse: 22, evCharging: 20, rateOptimization: 24 };
  opportunities.forEach(opp => { opp._npv25 = Math.round(opp.annualSavings * (NPV_MULT_CW[opp.id] || 22.5) - opp._effectiveNetCost); });
  const maxNPV_cw = Math.max(...opportunities.map(o => o._npv25), 1);
  const catBonus_cw = { 'Generation': 10, 'Storage': 8, 'Demand Management': 8, 'Efficiency': 7, 'Electrification': 6, 'Resilience': 6, 'Revenue': 5, 'Grid Services': 5, 'Rate Optimization': 5, 'Monitoring': 4, 'Non-Energy': 2 };
  opportunities.forEach(opp => {
    const savScore = (opp.annualSavings / maxSavings_cw) * 30;
    const npvScore = opp._npv25 > 0 ? (opp._npv25 / maxNPV_cw) * 25 : 0;
    const payScore = opp._effectivePayback < 3 ? 20 : opp._effectivePayback < 6 ? 15 : opp._effectivePayback < 10 ? 10 : 3;
    const roiScore = opp._effectiveNetCost > 0 ? Math.min(15, (opp.annualSavings / opp._effectiveNetCost) * 75) : 8;
    const bonus = catBonus_cw[opp.category] || 5;
    opp.compositeScore = Math.round(savScore + npvScore + payScore + roiScore + bonus);
  });
  opportunities.sort((a, b) => b.compositeScore - a.compositeScore);
  opportunities.forEach((opp, idx) => { opp.rank = idx + 1; });
  
  const top10 = opportunities.slice(0, 10);
  
  return {
    opportunities: top10,
    allOpportunities: opportunities,
    summary: {
      totalAnnualEnergyCost: Math.round(totalAnnualEnergy),
      top10AnnualSavings: Math.round(top10.reduce((sum, o) => sum + o.annualSavings, 0)),
      top10Investment: Math.round(top10.reduce((sum, o) => sum + o.netCost, 0)),
      savingsPct: totalAnnualEnergy > 0 ? Math.min(100, Math.round((top10.reduce((sum, o) => sum + o.annualSavings, 0) / totalAnnualEnergy) * 100)) : 0
    },
    // Expose calculated values for display
    calculatedConsumption: {
      monthlyKWh,
      peakKW,
      annualKWh,
      monthlyTherms: gasThermsMo,
      resistiveKW,
      inductiveKW,
      totalConnectedKW,
      serviceRating,
      breakdown: {
        dryers: { kW: Math.round(dryerKW), kWhMo: Math.round(dryerKWhPerMonth), pct: monthlyKWh > 0 ? Math.round(dryerKWhPerMonth / monthlyKWh * 100) : 0, type: 'inductive', config: formData.dryerConfig || 'blowersOnly', heatingKW: heatedDryerKW },
        pumps: { kW: Math.round(pumpKW), kWhMo: Math.round(pumpKWhPerMonth), pct: monthlyKWh > 0 ? Math.round(pumpKWhPerMonth / monthlyKWh * 100) : 0, type: 'inductive', hasVFD: pumpHasVFD, config: formData.pumpConfig || 'highPressure', dutyCycle: pumpCfg.dutyCycle },
        waterHeater: { kW: waterHeaterKW, kWhMo: Math.round(waterHeaterKWhPerMonth), pct: monthlyKWh > 0 ? Math.round(waterHeaterKWhPerMonth / monthlyKWh * 100) : 0, type: 'resistive' },
        vacuums: { kW: Math.round(vacuumKW), kWhMo: Math.round(vacuumKWhPerMonth), pct: monthlyKWh > 0 ? Math.round(vacuumKWhPerMonth / monthlyKWh * 100) : 0, count: vacuumCount, config: formData.vacuumConfig || 'individual', turbineHP: vacuumTurbineHP, type: 'inductive' },
        conveyor: { kW: Math.round(conveyorKW), kWhMo: Math.round(conveyorKWhPerMonth), pct: monthlyKWh > 0 ? Math.round(conveyorKWhPerMonth / monthlyKWh * 100) : 0, type: 'inductive' },
        airCompressor: { kW: Math.round(airCompKW), kWhMo: Math.round(airCompKWhPerMonth), pct: monthlyKWh > 0 ? Math.round(airCompKWhPerMonth / monthlyKWh * 100) : 0, type: 'inductive' },
        ro: { kW: roKW, kWhMo: Math.round(roKWhPerMonth), pct: monthlyKWh > 0 ? Math.round(roKWhPerMonth / monthlyKWh * 100) : 0, type: 'inductive' },
        lighting: { kW: Math.round(lightingKW), kWhMo: Math.round(lightingKWhPerMonth), pct: monthlyKWh > 0 ? Math.round(lightingKWhPerMonth / monthlyKWh * 100) : 0, type: 'resistive' },
        pos: { kW: posKW, kWhMo: Math.round(posKWhPerMonth), pct: monthlyKWh > 0 ? Math.round(posKWhPerMonth / monthlyKWh * 100) : 0, type: 'resistive' },
        hvac: { kW: Math.round(hvacKW), kWhMo: Math.round(hvacKWhPerMonth), pct: monthlyKWh > 0 ? Math.round(hvacKWhPerMonth / monthlyKWh * 100) : 0, type: 'inductive' },
        evChargers: { kW: evL2KW + evDCKW, kWhMo: Math.round(evKWhPerMonth), pct: monthlyKWh > 0 ? Math.round(evKWhPerMonth / monthlyKWh * 100) : 0, l2: l2Chargers, dc: dcChargers }
      }
    }
  };
};

// Keep the old function for backward compatibility but redirect to new one
const calculateGoalScores = (utilityData, solarData, industry, stateCode) => {
  if (!industry || !utilityData?.electric) {
    return [];
  }
  
  const result = calculateSavingsOpportunities(utilityData, solarData, industry, stateCode);
  if (!result || !result.opportunities) return [];
  
  // Convert to old format for any code still using it
  return result.opportunities.map(opp => ({
    id: opp.id,
    name: opp.name,
    icon: opp.icon,
    score: Math.round(100 - (opp.paybackYears * 10)), // Convert payback to score
    monthlyImpact: Math.round(opp.annualSavings / 12),
    reason: opp.sizing,
    detail: opp.description,
    shortDesc: opp.category,
    annualSavings: opp.annualSavings,
    paybackYears: opp.paybackYears
  }));
};

// Get preliminary analysis message when no industry selected
const getPreliminaryAnalysis = (utilityData, solarData) => {
  if (!utilityData?.electric) return { summary: '', note: 'Select your business type below for personalized priorities.', rateLevel: 'moderate', solarLevel: 'moderate' };
  const electric = utilityData.electric;
  const rateLevel = electric.avgRate > 0.15 ? 'high' : electric.avgRate > 0.10 ? 'moderate' : 'low';
  const solarLevel = solarData?.irradiance > 5.0 ? 'excellent' : solarData?.irradiance > 4.0 ? 'good' : 'moderate';
  
  return {
    summary: `Your location has ${rateLevel} electricity rates ($${(electric.avgRate || 0).toFixed(2)}/kWh) and ${solarLevel} solar potential (${solarData?.peakSunHours || 0} peak sun hours).`,
    note: 'Select your business type below for personalized priorities and actual cost impacts.',
    rateLevel,
    solarLevel
  };
};

// ============================================
// LOAD CALCULATION - Based on actual facility inputs
// ============================================

// ═══════════════════════════════════════════════════════════════════════════════
// SMOOTH SLIDER - Native DOM drag, React state only on release
// Prevents re-render stutter in heavy component trees
// ═══════════════════════════════════════════════════════════════════════════════
const SmoothSlider = React.memo(({ min, max, step, value, onChange, color = '#6366f1', label, displayId, formatDisplay }) => {
  const inputRef = useRef(null);
  const localVal = useRef(Number(value));
  const isDragging = useRef(false);

  const pct = (v) => ((Number(v) - min) / (max - min)) * 100;

  // DOM-only visual update — no React state, no re-render
  const paint = (v) => {
    const p = pct(v);
    if (inputRef.current) {
      inputRef.current.style.background = `linear-gradient(to right, ${color} 0%, ${color} ${p}%, #334155 ${p}%, #334155 100%)`;
    }
    if (displayId) {
      const el = document.getElementById(displayId);
      if (el) el.textContent = formatDisplay ? formatDisplay(v) : parseInt(v).toLocaleString();
    }
  };

  // Sync when parent value changes externally (e.g. unit toggle)
  useEffect(() => {
    localVal.current = Number(value);
    if (inputRef.current && !isDragging.current) {
      inputRef.current.value = value;
      paint(Number(value));
    }
  }, [value]);

  // Attach native listeners on mount — bypasses React's synthetic event system entirely
  useEffect(() => {
    const el = inputRef.current;
    if (!el) return;

    // 'input' fires continuously during drag — visual update only, zero React
    const onInput = () => {
      const v = Number(el.value);
      localVal.current = v;
      isDragging.current = true;
      paint(v);
    };

    // Commit to React state — single re-render on release
    const commit = () => {
      if (!isDragging.current) return;
      isDragging.current = false;
      onChange(String(localVal.current));
    };

    // Keyboard: arrow/page keys change value without pointer events
    const onKey = (e) => {
      if (['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','PageUp','PageDown','Home','End'].includes(e.key)) {
        localVal.current = Number(el.value);
        paint(localVal.current);
        onChange(String(localVal.current));
      }
    };

    el.addEventListener('input', onInput);
    // pointerup covers mouse + touch + pen in one event
    el.addEventListener('pointerup', commit);
    // mouseup fallback for older browsers
    el.addEventListener('mouseup', commit);
    el.addEventListener('keyup', onKey);

    return () => {
      el.removeEventListener('input', onInput);
      el.removeEventListener('pointerup', commit);
      el.removeEventListener('mouseup', commit);
      el.removeEventListener('keyup', onKey);
    };
  }, [onChange, displayId, formatDisplay, color, min, max]);

  return (
    <input
      ref={inputRef}
      type="range"
      min={min} max={max} step={step}
      defaultValue={value}
      aria-label={label}
      className="w-full h-3 rounded-lg appearance-none cursor-pointer"
      style={{
        WebkitAppearance: 'none',
        background: `linear-gradient(to right, ${color} 0%, ${color} ${pct(value)}%, #334155 ${pct(value)}%, #334155 100%)`
      }}
    />
  );
});

// ═══════════════════════════════════════════════════════════════════════════════
// SHARED COMPONENTS — defined at module scope for stable React reconciliation
// (Defining inside CarWashAssessment creates new function refs every render,
//  causing React to unmount/remount all question DOM → scroll position destroyed)
// ═══════════════════════════════════════════════════════════════════════════════

const SECTION_COLORS = {
  facility:   { color: '#6366f1', bg: 'rgba(99,102,241,0.12)', bgFade: 'rgba(99,102,241,0.04)', border: 'rgba(99,102,241,0.4)', accent: '#a5b4fc', glow: 'rgba(99,102,241,0.3)' },
  energy:     { color: '#6366f1', bg: 'rgba(99,102,241,0.12)', bgFade: 'rgba(99,102,241,0.04)', border: 'rgba(99,102,241,0.4)', accent: '#a5b4fc', glow: 'rgba(99,102,241,0.3)' },
  equipment:  { color: '#6366f1', bg: 'rgba(99,102,241,0.12)', bgFade: 'rgba(99,102,241,0.04)', border: 'rgba(99,102,241,0.4)', accent: '#a5b4fc', glow: 'rgba(99,102,241,0.3)' },
  infra:      { color: '#6366f1', bg: 'rgba(99,102,241,0.12)', bgFade: 'rgba(99,102,241,0.04)', border: 'rgba(99,102,241,0.4)', accent: '#a5b4fc', glow: 'rgba(99,102,241,0.3)' },
  site:       { color: '#6366f1', bg: 'rgba(99,102,241,0.12)', bgFade: 'rgba(99,102,241,0.04)', border: 'rgba(99,102,241,0.4)', accent: '#a5b4fc', glow: 'rgba(99,102,241,0.3)' },
};

const SectionDivider = React.memo(({ icon, label, sectionNum, totalSections, sectionId, activeQuestion, completedQuestions }) => {
  const c = SECTION_COLORS[sectionId] || SECTION_COLORS.facility;
  const sectionQs = { facility: [1,2,3], energy: [4,5,6], equipment: [7,8,9], infra: [10,11,12], site: [13,14,15] };
  const qs = sectionQs[sectionId] || [];
  const doneCount = qs.filter(qn => completedQuestions.has(qn) || activeQuestion > qn).length;
  const allDone = doneCount >= qs.length;

  return (
    <div style={{
      margin: '24px -24px 16px',
      padding: '16px 24px',
      background: allDone
        ? 'linear-gradient(135deg, rgba(99,102,241,0.2), rgba(99,102,241,0.04))'
        : `linear-gradient(135deg, ${c.bg}, ${c.bgFade})`,
      borderBottom: `3px solid ${allDone ? '#6366f1' : c.color}`,
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <div style={{
          width: 56, height: 56, borderRadius: 14,
          background: allDone ? '#6366f1' : c.color,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 28, boxShadow: `0 4px 16px ${allDone ? 'rgba(99,102,241,0.3)' : c.glow}`,
        }}>{allDone ? <Check className="w-6 h-6 text-white" /> : icon}</div>
        <div>
          <div style={{ fontSize: 20, fontWeight: 900, color: '#fff', textTransform: 'uppercase', letterSpacing: 1.5 }}>{label}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
            <span style={{ fontSize: 13, color: allDone ? '#a5b4fc' : c.accent, fontWeight: 600 }}>
              {allDone ? 'Complete!' : `Section ${sectionNum} of ${totalSections}`}
            </span>
            <div style={{ display: 'flex', gap: 4 }}>
              {qs.map((qn) => (
                <div key={qn} style={{
                  width: 8, height: 8, borderRadius: '50%',
                  background: (completedQuestions.has(qn) || activeQuestion > qn) ? '#6366f1' : activeQuestion === qn ? c.color : '#334155',
                  transition: 'all 0.3s',
                }} />
              ))}
            </div>
          </div>
        </div>
      </div>
      <div style={{
        fontSize: 28, fontWeight: 900,
        color: allDone ? '#a5b4fc' : c.accent, opacity: 0.3,
        fontFamily: 'monospace',
      }}>0{sectionNum}</div>
    </div>
  );
});

const QuestionSection = React.memo(({ questionNumber, title, subtitle, info, children, isRequired = false, isManual = false, onManualContinue, canContinue = true, activeQuestion, questionRefs }) => {
  const isActive = activeQuestion >= questionNumber;
  const isCompleted = activeQuestion > questionNumber;
  const isCurrent = activeQuestion === questionNumber;
  const qSectionId = questionNumber <= 3 ? 'facility' : questionNumber <= 6 ? 'energy' : questionNumber <= 9 ? 'equipment' : questionNumber <= 12 ? 'infra' : 'site';
  const qColor = SECTION_COLORS[qSectionId]?.color || '#6366f1';

  return (
    <div 
      ref={el => { if (questionRefs) questionRefs.current[questionNumber] = el; }}
      data-question={questionNumber}
      className={`mb-6 scroll-mt-40 ${isActive ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}
      style={{ transition: 'opacity 0.2s ease' }}
    >
      <div className="flex items-start gap-3">
        <div style={{ background: isCompleted ? '#6366f1' : isCurrent ? qColor : '#334155' }}
          className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 transition-colors ${isCompleted ? 'hover:bg-indigo-600 cursor-pointer' : ''}`}
          title={isCompleted ? 'Click answer to change' : ''}
        >
          {isCompleted ? (
            <Check className="w-5 h-5 text-white" />
          ) : (
            <span className={`text-sm font-bold ${isCurrent ? 'text-white' : 'text-slate-300'}`}>{questionNumber}</span>
          )}
        </div>

        <div className="flex-1">
          <div className="mb-2 flex items-center gap-2">
            <label className={`block text-base font-bold mb-0.5 ${isActive ? 'text-white' : 'text-slate-300'}`}>
              {title} {isRequired && <span className="text-indigo-400">*</span>}
            </label>
            {info && (
              <span className="group relative inline-flex">
                <span className="w-6 h-6 rounded-full bg-indigo-500/20 flex items-center justify-center cursor-help text-indigo-400 hover:bg-indigo-500/30 transition border border-indigo-500/30">
                  <Info className="w-3.5 h-3.5" />
                </span>
                <span className="invisible group-hover:visible absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-80 p-4 bg-slate-800 border border-indigo-500/30 rounded-xl text-sm text-slate-200 leading-relaxed shadow-2xl z-50">
                  {info}
                  <span className="absolute top-full left-1/2 -translate-x-1/2 -mt-px w-2.5 h-2.5 rotate-45 bg-slate-800 border-r border-b border-indigo-500/30" />
                </span>
              </span>
            )}
          </div>
          {subtitle && (
            <p className={`text-sm mb-2 ${isActive ? 'text-slate-300' : 'text-slate-300'}`}>{subtitle}</p>
          )}
          <div className={isActive ? '' : 'grayscale'}>{children}</div>
          
          {isManual && (isCurrent || isCompleted) && (
            <button 
              onClick={() => canContinue && onManualContinue(questionNumber)}
              disabled={!canContinue}
              className={`mt-4 px-5 py-2 rounded-lg font-medium text-sm transition flex items-center gap-2 ${
                canContinue 
                  ? 'bg-indigo-600 text-white hover:bg-indigo-700' 
                  : 'bg-slate-700 text-slate-500 cursor-not-allowed'
              }`}
            >
              Continue <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      <div className={`ml-[18px] mt-1 mb-1 w-0.5 h-4 ${isCompleted ? 'bg-indigo-500' : 'bg-slate-700'} transition-colors`} />
    </div>
  );
});

// ═══════════════════════════════════════════════════════════════════════════════
// CAR WASH ASSESSMENT COMPONENT (Step 3 for Car Wash industry)
// ═══════════════════════════════════════════════════════════════════════════════
const CarWashAssessment = ({ onComplete, onBack, locationData, annualBill: parentAnnualBill, setAnnualBill: setParentAnnualBill, billUploadData, setBillUploadData, showTrueQuoteModal, setShowTrueQuoteModal }) => {
  const scrollContainerRef = useRef(null);
  const questionRefs = useRef({});

  // Form state - reorganized with equipment checklist
  const [facilityType, setFacilityType] = useState('');           // Q1
  const [tunnelLength, setTunnelLength] = useState('');           // Q1b (conditional for tunnels)
  const [bayCount, setBayCount] = useState('');                   // Q2
  const [operatingHours, setOperatingHours] = useState('');       // Q3
  const [daysPerWeek, setDaysPerWeek] = useState('');             // Q4
  const [dailyVehicles, setDailyVehicles] = useState('150');      // Q6 (Manual)
  const [monthlyElecBill, setMonthlyElecBill] = useState(() => parentAnnualBill ? String(Math.round(parentAnnualBill / 12)) : '10000');     // Q7 — pre-filled from Step 1 slider
  const [monthlyBillManuallyEdited, setMonthlyBillManuallyEdited] = useState(false); // track manual override
  const [billInputMode, setBillInputMode] = useState('auto'); // 'auto' (Step 1 calc) | 'upload' | 'api'
  const [gasLine, setGasLine] = useState('yes');                   // Q8 — default YES
  const [waterHeater, setWaterHeater] = useState('');             // Q9
  const [serviceRating, setServiceRating] = useState('');         // Part of Q20 (Electrical Infrastructure)
  const [siteVoltage, setSiteVoltage] = useState('');             // Part of Q20 (Electrical Infrastructure)
  const [powerQualityIssues, setPowerQualityIssues] = useState(new Set()); // Part of Q20 (Electrical Infrastructure)
  const [utilityBillingType, setUtilityBillingType] = useState(''); // Q10 - Billing structure
  const [demandRate, setDemandRate] = useState(null);              // FIX #7: Auto-derived from STATE_DATA in formData output (was dead Q9b)
  // Phase 2: Optional actual utility bill data (eliminates bill→kWh conversion error)
  const [actualMonthlyKWh, setActualMonthlyKWh] = useState('');    // From utility bill (optional)
  const [actualPeakDemandKW, setActualPeakDemandKW] = useState(''); // From utility bill (optional, demand-billed only)
  const [kwhUnknown, setKwhUnknown] = useState(false);              // "Don't Know" bypass for Q10b
  const [outageImpact, setOutageImpact] = useState('');           // Q21 - Business continuity
  
  // Q11: Equipment Checklist (multi-select)
  const [selectedEquipment, setSelectedEquipment] = useState(new Set()); // No default selections - user must select
  const [optionalAnswered, setOptionalAnswered] = useState(new Set()); // Track which optional items user has explicitly answered
  // Core equipment banner removed — display is now inline text
  const [trueQuoteTab, setTrueQuoteTab] = useState('why');
  const [equipPopup, setEquipPopup] = useState(null); // Modal popup for equipment sub-options
  const [evChargerPopup, setEvChargerPopup] = useState(false); // EV charger details popup
  
  // Climate & Premium (from old Q23, now inline in Q12)
  const [siteFeatures, setSiteFeatures] = useState({
    climateControl: null,    // minimal | standard | full
    premiumServices: null    // none | basic | full
  });
  
  // Q10: Equipment Details (conditional based on Q9)
  const [pumpCount, setPumpCount] = useState('');
  const [pumpConfig, setPumpConfig] = useState('');  // 'standard', 'highPressure', 'multiple', 'variableSpeed'
  const [pumpHP, setPumpHP] = useState('');
  const [pumpHasVFD, setPumpHasVFD] = useState(null);    // No default — user must select
  const [dryerCount, setDryerCount] = useState('');    // User must select
  const [dryerHP, setDryerHP] = useState('');
  const [dryerConfig, setDryerConfig] = useState('');  // 'blowersOnly', 'heated', 'hybrid', 'noDryers'
  const [dryerHasVFD, setDryerHasVFD] = useState(null);  // No default — user must select
  const [conveyorHP, setConveyorHP] = useState('');
  const [brushMotorCount, setBrushMotorCount] = useState('');             // NEW: Brush motor count (0-20)
  const [vacuumCount, setVacuumCount] = useState('');
  const [vacuumTurbineHP, setVacuumTurbineHP] = useState('');             // NEW: Central vacuum turbine HP
  const [vacuumConfig, setVacuumConfig] = useState('');                   // 'individual', 'centralTurbine', 'hybrid', 'noVacuums'
  const [airCompressorHP, setAirCompressorHP] = useState('');
  const [useEquipDefaults, setUseEquipDefaults] = useState(false);       // Q8 "Use Defaults" toggle
  const [expandedEquipRow, setExpandedEquipRow] = useState(null);      // Q8 accordion — which row is expanded (null = all collapsed)
  const [confirmedEquipRows, setConfirmedEquipRows] = useState(new Set()); // Q8 — which equipment cards have been confirmed
  const [heatedDryerElements, setHeatedDryerElements] = useState('');     // NEW: 'yes'/'no' heated elements
  const [roHP, setRoHP] = useState('');                                   // NEW: RO pump HP (5/10/15)
  const [kioskCount, setKioskCount] = useState('2');                      // NEW: Payment kiosk count
  const [lightingTier, setLightingTier] = useState('');                   // NEW: Basic LED / Enhanced / Premium
  const [signageTier, setSignageTier] = useState('');                     // NEW: Basic / Premium / Signature
  const [officeFacilities, setOfficeFacilities] = useState(new Set());    // NEW: Office/BreakRoom/Bathrooms/Security
  const [waterReclaimLevel, setWaterReclaimLevel] = useState('');   // Q11: 'none', 'basic', 'standard', 'advanced'
  const [equipmentAge, setEquipmentAge] = useState('');             // Sprint 4: 'new', 'moderate', 'old', 'veryOld' — no default, user must select
  
  // Site & Solar questions
  const [siteSqFt, setSiteSqFt] = useState('44000');              // Q23 — 1 acre standard express site
  const [totalRoofArea, setTotalRoofArea] = useState('4500');    // Q23 (merged Site Dimensions) — car wash industry avg
  const [roofArea, setRoofArea] = useState('1800');               // Auto-calc 40% of totalRoofArea (car wash polycarbonate deduction)
  const [roofType, setRoofType] = useState('');                       // Q13: 'opaque' (70%) / 'mixed' (55%) / 'polycarbonate' (40%)
  // areaUnit removed — all areas in sq ft
  const [carportSolarInterest, setCarportSolarInterest] = useState('');  // Q14: 'yes'/'no'
  const [groundSolarInterest, setGroundSolarInterest] = useState('');   // Q14: 'yes'/'no'
  const [merlinSolar, setMerlinSolar] = useState(false);                // Q14: let Merlin decide
  const [solarDimPopup, setSolarDimPopup] = useState('');               // Q14: 'carport' | 'ground' | ''
  const [carportLength, setCarportLength] = useState(150);             // Q14 carport dims (ft)
  const [carportWidth, setCarportWidth] = useState(10);                // Q14 carport dims (ft)
  const [groundLength, setGroundLength] = useState(80);                // Q14 ground-mount dims (ft)
  const [groundWidth, setGroundWidth] = useState(40);                  // Q14 ground-mount dims (ft)
  const [hasEvChargers, setHasEvChargers] = useState('');         // Q25 - EV Charging
  const [l2Chargers, setL2Chargers] = useState('0');              // Q25 inline (if EV=Yes)
  const [dcChargers, setDcChargers] = useState('0');              // Q25 inline (if EV=Yes)

  // Track which questions have been completed (not just have default values)
  const [completedQuestions, setCompletedQuestions] = useState(new Set());
  const markCompleted = (questionNum) => {
    setCompletedQuestions(prev => new Set([...prev, questionNum]));
  };
  const unmarkCompleted = (questionNum) => {
    setCompletedQuestions(prev => {
      const next = new Set(prev);
      next.delete(questionNum);
      return next;
    });
  };

  // ── Computed activeQuestion: derived from actual answer values ──
  // Uses dual-check pattern: direct state values (facilityType, bayCount, etc.) AND completedQuestions.has() checks.
  // If a state value changes but completedQuestions isn't updated in the same render cycle,
  // activeQuestion may be stale for one frame — this is a minor UI timing issue, not data corruption.
  // Replaces the old useState that could get stuck after Q3.
  // All answered questions stay visible; the next unanswered question is always accessible.
  const activeQuestion = useMemo(() => {
    if (!facilityType) return 1;
    const isTunnelType = ['express', 'mini', 'fullService'].includes(facilityType);
    if (!bayCount || (isTunnelType && !tunnelLength)) return 2;
    if (!completedQuestions.has(3)) return 3;
    if (!completedQuestions.has(4)) return 4;
    if (!gasLine || !waterHeater) return 5;
    if (!completedQuestions.has(6)) return 6;
    if (!completedQuestions.has(7)) return 7;
    const hasAnyEquip = selectedEquipment.has('pumps') || selectedEquipment.has('dryers') ||
      selectedEquipment.has('conveyor') || selectedEquipment.has('brushMotors') ||
      selectedEquipment.has('airCompressor') || selectedEquipment.has('vacuums');
    if (hasAnyEquip && !completedQuestions.has(8)) return 8;
    if (hasAnyEquip && !completedQuestions.has(9)) return 9;
    if (!completedQuestions.has(10)) return 10;
    if (!outageImpact) return 11;
    if (!waterReclaimLevel) return 12;
    if (!completedQuestions.has(13)) return 13;
    if (!completedQuestions.has(14)) return 14;
    if (!hasEvChargers) return 15;
    return 16;
  }, [facilityType, bayCount, tunnelLength, operatingHours, daysPerWeek,
      completedQuestions, monthlyElecBill, gasLine, waterHeater, utilityBillingType,
      actualMonthlyKWh, kwhUnknown,
      selectedEquipment, waterReclaimLevel, outageImpact, hasEvChargers]);

  // ── Scroll position guard ──
  // Problem: React re-renders reset scrollTop to 0 when DOM content changes.
  // Solution: Save scroll on every scroll event. After every render, check if scroll
  // ── scrollToQuestion / scrollToGenQ: disabled (no-op) ──
  const scrollToQuestion = () => {};
  const scrollToGenQ = () => {};

  // Toggle equipment selection
  const toggleEquipment = (equipId) => {
    setSelectedEquipment(prev => {
      const newSet = new Set(prev);
      if (newSet.has(equipId)) {
        newSet.delete(equipId);
      } else {
        newSet.add(equipId);
      }
      return newSet;
    });
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // EQUIPMENT DEFAULTS BY FACILITY TYPE
  // ═══════════════════════════════════════════════════════════════════════════
  // Benchmarked against top 10-15 national chains (2024-2025):
  // Tommy's Express, Quick Quack, ZIPS, Mister Car Wash, Tidal Wave, Take 5, etc.
  // Sources: PC&D Top 50, Car Wash Advisory Top 100, manufacturer specs
  // ═══════════════════════════════════════════════════════════════════════════
  const FACILITY_EQUIPMENT_DEFAULTS = {
    express: {
      label: 'Express Tunnel (100-140 ft)',
      // BENCHMARK: Tommy's Express 130', Quick Quack 108', industry std 120'
      tunnelLength: 130,  // ft - Tommy's standard
      throughput: '150-220 cars/hr',
      siteAcres: '0.8-1.0 acres',
      buildingSqFt: '3,500-4,500 sq ft',
      pumps: { 
        count: 3, hp: 20, vfd: false, 
        note: '3 pumps × 20 HP = 60 HP (range: 2-4 pumps, 15-25 HP each)',
        benchmark: 'Tommy\'s/Quick Quack: 2-4 pump stations @ 15-25 HP'
      },
      dryers: { 
        count: 18, hp: 10, vfd: false, 
        note: '18 blowers × 10 HP = 180 HP total drying',
        benchmark: 'Tommy\'s 2.0 Drying System: 18 × 10 HP producers + twin heated blowers'
      },
      conveyor: { 
        hp: 20, 
        note: '130 ft tunnel with 30" dual belt',
        benchmark: 'Tommy Transporter: 30" dual belt, 20-25 HP drive'
      },
      vacuums: { 
        count: 16, 
        note: '16 turbo vacs with mat cleaners, air guns, towels',
        benchmark: 'Quick Quack: 13-18 vacs; Tommy\'s: 16-20 vacs'
      },
      airCompressor: { 
        hp: 5, 
        note: '5 HP with 60-80 gal tank',
        benchmark: 'Industry std: 5-10 HP for tire shine, air doors, pneumatics'
      },
      brushMotors: {
        count: 15, avgHP: 3,
        note: '15 motors x 3 HP avg = 45 HP (wraps, top brush, side brushes, tire shiners)',
        benchmark: 'Tommy\'s/Quick Quack: 10-20 brush motors per tunnel'
      },
      defaultEquipment: ['pumps', 'dryers', 'conveyor', 'brushMotors', 'vacuums', 'airCompressor', 'ro', 'pos']
    },
    fullService: {
      label: 'Full-Service (120-160 ft)',
      tunnelLength: 140, throughput: '80-120 cars/hr',
      siteAcres: '1.5-2.0 acres', buildingSqFt: '8,000-12,000 sq ft',
      pumps: { count: 4, hp: 25, vfd: false, note: '4 pumps × 25 HP = 100 HP (detail + tunnel)', benchmark: 'Delta Sonic / Simoniz: 3-5 pumps @ 20-30 HP' },
      dryers: { count: 20, hp: 15, vfd: false, note: '20 blowers × 15 HP = 300 HP (premium drying)', benchmark: 'Full-service premium drying arrays' },
      conveyor: { hp: 25, note: '140 ft tunnel, heavier load from full-service processes', benchmark: '25-30 HP drive for longer tunnel' },
      vacuums: { count: 24, turbineHP: 50, note: '24 stations: interior detail + customer', benchmark: 'Large vacuum system for interior service' },
      brushMotors: { count: 18, hpEach: 3, note: '18 × 3 HP = 54 HP (more brush stages)', benchmark: 'Extended brush array for full-service' },
      airCompressor: { hp: 15, note: '15 HP — detail shop air tools', benchmark: 'Higher demand from detail operations' },
      defaultEquipment: ['pumps', 'dryers', 'conveyor', 'brushMotors', 'vacuums', 'airCompressor', 'ro', 'pos']
    },
    mini: {
      label: 'Mini-Tunnel (40-80 ft)',
      // BENCHMARK: Sonny's Mini (40'), AutoBrite ModBrite (35-60')
      tunnelLength: 60,  // ft
      throughput: '35-60 cars/hr',
      siteAcres: '0.5 acres',
      buildingSqFt: '2,500-3,000 sq ft',
      pumps: { 
        count: 2, hp: 15, vfd: false, 
        note: '2 pumps × 15 HP = 30 HP total',
        benchmark: 'Mini tunnel std: 1-2 pumps @ 15 HP'
      },
      dryers: { 
        count: 10, hp: 10, vfd: false, 
        note: '10 blowers × 10 HP = 100 HP total',
        benchmark: 'Mini tunnel: 8-12 blowers for compact drying zone'
      },
      conveyor: { 
        hp: 15, 
        note: '60-80 ft tunnel with 24" belt',
        benchmark: 'Mini conveyor: 10-15 HP'
      },
      vacuums: { 
        count: 10, 
        note: '10 vacs with basic amenities',
        benchmark: 'Mini sites: 8-12 vacuum stations'
      },
      airCompressor: { 
        hp: 5, 
        note: 'Basic 5 HP with 60 gal tank',
        benchmark: 'Standard for mini operations'
      },
      brushMotors: {
        count: 10, avgHP: 3,
        note: '10 motors x 3 HP avg = 30 HP',
        benchmark: 'Mini tunnel: 8-12 brush motors'
      },
      defaultEquipment: ['pumps', 'dryers', 'conveyor', 'brushMotors', 'vacuums', 'pos']
    },
    iba: {
      label: 'In-Bay Automatic',
      // BENCHMARK: Coleman Hanna, PDQ, Ryko gantry systems
      throughput: '7-12 cars/hr',
      pumps: { 
        count: 1, hp: 15, vfd: false, 
        note: '1 pump × 15 HP for gantry system',
        benchmark: 'IBA std: single pump station'
      },
      dryers: { 
        count: 4, hp: 10, vfd: false, 
        note: '4 blowers × 10 HP = 40 HP total',
        benchmark: 'IBA: 3-6 blowers on gantry'
      },
      conveyor: { 
        hp: 0, 
        note: 'No conveyor (gantry system)',
        benchmark: 'Stationary vehicle'
      },
      vacuums: { 
        count: 6, 
        note: 'Optional self-serve vacuums',
        benchmark: 'IBA sites: 4-8 vacs'
      },
      airCompressor: { 
        hp: 5, 
        note: 'Gantry pneumatics',
        benchmark: 'Standard IBA air needs'
      },
      brushMotors: {
        count: 4, avgHP: 3,
        note: '4 gantry-mounted brush motors x 3 HP = 12 HP',
        benchmark: 'IBA: 2-6 brush motors on gantry arms'
      },
      defaultEquipment: ['pumps', 'dryers', 'brushMotors', 'airCompressor', 'pos']
    },
    self: {
      label: 'Self-Serve Bays',
      throughput: '6-10 cars/hr per bay',
      pumps: { 
        count: 1, hp: 10, vfd: false, 
        note: '1 pump per bay × 10 HP (multiply by bay count)',
        benchmark: 'Self-serve: 5-10 HP per bay'
      },
      dryers: { 
        count: 0, hp: 0, vfd: false, 
        note: 'Customer air dry',
        benchmark: 'N/A'
      },
      conveyor: { 
        hp: 0, 
        note: 'No conveyor',
        benchmark: 'N/A'
      },
      vacuums: { 
        count: 6, 
        note: 'Coin-op/token vacuums',
        benchmark: 'Self-serve: 4-8 coin-op vacs'
      },
      airCompressor: { 
        hp: 5, 
        note: 'Spot-free rinse, air dry',
        benchmark: 'Basic air needs'
      },
      brushMotors: {
        count: 0, avgHP: 0,
        note: 'N/A — self-serve wand wash, no brushes',
        benchmark: 'N/A'
      },
      defaultEquipment: ['pumps', 'vacuums', 'pos']
    }
  };
  
  // National chain reference data for tooltips and education
  // Equipment label mappings with full names
  // Get current defaults based on facility type and tunnel length
  function getCurrentDefaults() {
    const baseDefaults = FACILITY_EQUIPMENT_DEFAULTS[facilityType] || FACILITY_EQUIPMENT_DEFAULTS.express;
    
    // For tunnel-based facilities, adjust equipment based on tunnel length
    const isTunnelType = ['express', 'mini', 'fullService'].includes(facilityType);
    if (isTunnelType && tunnelLength) {
      const length = parseInt(tunnelLength) || 120; // FIX H-2: fallback to industry avg if NaN
      
      // Dynamic calculations based on industry benchmarks:
      // Blowers: ~1 per 7-8 ft of tunnel (min 4, max 20)
      // Pumps: ~1 per 40-50 ft of tunnel (min 2)
      // Conveyor HP: scales with length, 10 HP base + 5 HP per 20 ft over 60
      const dynamicBlowers = Math.min(20, Math.max(4, Math.round(length / 7.5)));
      const dynamicPumps = Math.max(2, Math.ceil(length / 45));
      const dynamicConveyorHP = Math.min(30, 10 + Math.round((length - 60) / 20) * 5);
      const dynamicVacuums = Math.max(8, Math.round(length / 8));
      const dynamicBrushMotors = Math.min(20, Math.max(8, Math.round(length / 8)));
      
      return {
        ...baseDefaults,
        tunnelLength: length,
        pumps: {
          ...baseDefaults.pumps,
          count: dynamicPumps,
          note: `${dynamicPumps} pumps × ${baseDefaults.pumps.hp} HP = ${dynamicPumps * baseDefaults.pumps.hp} HP (${length} ft tunnel)`
        },
        dryers: {
          ...baseDefaults.dryers,
          count: dynamicBlowers,
          note: `${dynamicBlowers} blowers × ${baseDefaults.dryers.hp} HP = ${dynamicBlowers * baseDefaults.dryers.hp} HP (${length} ft tunnel)`
        },
        conveyor: {
          ...baseDefaults.conveyor,
          hp: dynamicConveyorHP,
          note: `${length} ft tunnel with ${dynamicConveyorHP} HP drive`
        },
        brushMotors: {
          ...baseDefaults.brushMotors,
          count: dynamicBrushMotors,
          note: `${dynamicBrushMotors} brush motors × 3 HP avg = ${dynamicBrushMotors * 3} HP (${length} ft tunnel)`
        },
        vacuums: {
          ...baseDefaults.vacuums,
          count: dynamicVacuums,
          note: `${dynamicVacuums} vacs for ${length} ft tunnel site`
        }
      };
    }
    
    return baseDefaults;
  }

  // Check if any equipment needs HP/count details
  const needsEquipmentDetails = selectedEquipment.has('pumps') || selectedEquipment.has('dryers') || 
    selectedEquipment.has('conveyor') || selectedEquipment.has('vacuums') || 
    selectedEquipment.has('airCompressor') || selectedEquipment.has('brushMotors');
  
  // Q14 solar strategy — derived from toggle selections for WizB compat
  const solarStrategy = merlinSolar ? 'notSure'
    : carportSolarInterest === 'yes' && groundSolarInterest === 'yes' ? 'both'
    : carportSolarInterest === 'yes' ? 'carport'
    : groundSolarInterest === 'yes' ? 'ground'
    : (carportSolarInterest === 'no' || groundSolarInterest === 'no') ? 'roofOnly'
    : '';
  const showCarportArea = carportSolarInterest === 'yes';
  const showGroundMountArea = groundSolarInterest === 'yes';
  const carportArea = String(carportLength * carportWidth);
  const groundMountArea = String(groundLength * groundWidth);
  const carportInterest = showCarportArea ? 'yes' : 'no';
  const groundMountInterest = showGroundMountArea ? 'yes' : 'no';
  const batteryStrategy = ''; // BESS sizing handled entirely in WizB Steps 4-7
  const acceptPartialOffset = ''; // Partial offset is always acceptable — WizB optimizes


  // Total questions calculation
  // Base: Q1-9 (9) + Q15-18 + Q20 (5) = 14 always shown
  // + Q19 (1) if carport interested = 15 max base
  // + Q10-14 (0-5) conditional equipment questions
  // Range: 14-20 questions
  const getTotalQuestions = () => {
    // Consolidated: 15 base questions
    let total = 15;
    const hasAnyEquipment = selectedEquipment.has('pumps') || selectedEquipment.has('dryers') ||
      selectedEquipment.has('conveyor') || selectedEquipment.has('brushMotors') ||
      selectedEquipment.has('airCompressor') || selectedEquipment.has('vacuums');
    if (completedQuestions.has(7) && !hasAnyEquipment) total -= 2; // no Q8+Q9
    return total;
  };

  // Auto-advance logic (consolidated 25→15 questions)
  
  // Q1: Facility Type
  useEffect(() => {
    if (facilityType) {
      markCompleted(1);
      if (['express','mini','iba','fullService'].includes(facilityType) && !bayCount) setBayCount('1');
      const isTunnelType = ['express', 'mini', 'fullService'].includes(facilityType);
      if (!isTunnelType) {
        if (tunnelLength) setTunnelLength('');
        const defaults = FACILITY_EQUIPMENT_DEFAULTS[facilityType];
        if (defaults) {
          setSelectedEquipment(new Set(defaults.defaultEquipment));
          if (defaults.defaultEquipment.includes('ro')) setRoHP('5');
          if (defaults.defaultEquipment.includes('pos')) setKioskCount('2');
          setPumpCount(defaults.pumps.count.toString()); setPumpHP(defaults.pumps.hp.toString()); setPumpHasVFD(null);
          setDryerCount(defaults.dryers.count.toString()); setDryerHP(defaults.dryers.hp.toString()); setDryerHasVFD(null);
          setConveyorHP(defaults.conveyor.hp.toString()); setBrushMotorCount(defaults.brushMotors?.count?.toString() || '');
          setVacuumCount(defaults.vacuums.count.toString()); setVacuumTurbineHP(defaults.vacuums.count > 0 ? '30' : '');
          setVacuumConfig(defaults.vacuums.turbineHP ? 'centralTurbine' : defaults.vacuums.count > 0 ? 'individual' : '');
          setAirCompressorHP(defaults.airCompressor.hp.toString());
          setUseEquipDefaults(true);
        }
      }
    } else if (completedQuestions.has(1)) unmarkCompleted(1);
  }, [facilityType]);

  // Q2: Facility size (bays + tunnel length)
  useEffect(() => {
    const isTunnelType = ['express', 'mini', 'fullService'].includes(facilityType);
    if (bayCount && (!isTunnelType || tunnelLength)) {
      markCompleted(2);
      if (tunnelLength) {
        const dynamicDefaults = getCurrentDefaults();
        setSelectedEquipment(new Set(dynamicDefaults.defaultEquipment));
        if (dynamicDefaults.defaultEquipment.includes('ro')) setRoHP('5');
        if (dynamicDefaults.defaultEquipment.includes('pos')) setKioskCount('2');
        setPumpCount(''); setPumpHP(''); setPumpHasVFD(null);
        setDryerCount(''); setDryerHP(''); setDryerHasVFD(null);
        setConveyorHP(''); setBrushMotorCount('');
        setVacuumCount(''); setVacuumTurbineHP(''); setAirCompressorHP('');
        setUseEquipDefaults(true);
      }
    } else if (completedQuestions.has(2)) unmarkCompleted(2);
  }, [bayCount, tunnelLength, facilityType]);

  // Q3: Operating schedule — MANUAL continue
  // Q4: Electric bill — MANUAL continue
  useEffect(() => {
    if (!monthlyBillManuallyEdited && parentAnnualBill > 0) setMonthlyElecBill(String(Math.round(parentAnnualBill / 12)));
  }, [parentAnnualBill, monthlyBillManuallyEdited]);

  // Q5: Gas & water heating (merged)
  useEffect(() => {
    if (gasLine && waterHeater) markCompleted(5);
    else if (completedQuestions.has(5)) unmarkCompleted(5);
    if (gasLine && gasLine === 'no' && waterHeater === 'gas') setWaterHeater('');
  }, [gasLine, waterHeater]);

  useEffect(() => {
    if (waterHeater === 'electric') { setSelectedEquipment(prev => { const n = new Set(prev); n.add('waterHeaterElec'); return n; }); }
    else if (waterHeater === 'gas' || waterHeater === 'propane' || waterHeater === 'none') { setSelectedEquipment(prev => { const n = new Set(prev); n.delete('waterHeaterElec'); return n; }); }
    else if (waterHeater === 'unknown') {
      if (gasLine === 'no') { setSelectedEquipment(prev => { const n = new Set(prev); n.add('waterHeaterElec'); return n; }); }
      else { setSelectedEquipment(prev => { const n = new Set(prev); n.delete('waterHeaterElec'); return n; }); }
    }
  }, [waterHeater, gasLine]);

  // Q6: Utility billing & usage (merged) — MANUAL continue
  // Q7: Equipment checklist — MANUAL continue
  // Q8: Equipment specs table — MANUAL continue

  // Q9: Equipment condition (VFD + age)
  useEffect(() => {
    const dryerVFDDone = !selectedEquipment.has('dryers') || getCurrentDefaults().dryers.count === 0 || dryerHasVFD !== null;
    const pumpVFDDone = !selectedEquipment.has('pumps') || pumpHasVFD !== null;
    const hasMotors = selectedEquipment.has('pumps') || selectedEquipment.has('dryers') ||
      selectedEquipment.has('conveyor') || selectedEquipment.has('brushMotors') ||
      selectedEquipment.has('airCompressor') || selectedEquipment.has('vacuums');
    if (hasMotors && equipmentAge && dryerVFDDone && pumpVFDDone) markCompleted(9);
    else if (completedQuestions.has(9)) unmarkCompleted(9);
  }, [pumpHasVFD, dryerHasVFD, equipmentAge, selectedEquipment]);

  // Q11: Power outage
  useEffect(() => {
    if (outageImpact) markCompleted(11);
    else if (completedQuestions.has(11)) unmarkCompleted(11);
  }, [outageImpact]);

  // Pump config → auto-set VFD and adjust HP defaults
  useEffect(() => {
    if (!pumpConfig) return;
    const cfg = PUMP_CONFIG_OPTIONS.find(c => c.id === pumpConfig);
    if (!cfg) return;
    // Auto-set VFD for Variable Speed config
    if (cfg.autoVFD) setPumpHasVFD(true);
    // Auto-adjust HP default if user hasn't manually changed it
    if (!pumpHP || pumpHP === '') setPumpHP(cfg.defaultHP.toString());
  }, [pumpConfig]);

  // Dryer config → auto-set heatedDryers checkbox and handle "No Dryers"
  useEffect(() => {
    if (!dryerConfig) return;
    const cfg = DRYER_CONFIG_OPTIONS.find(c => c.id === dryerConfig);
    if (!cfg) return;
    // Auto-manage heatedDryers in selectedEquipment
    if (cfg.hasHeatedElements) {
      setSelectedEquipment(prev => { const s = new Set(prev); s.add('heatedDryers'); return s; });
    } else {
      setSelectedEquipment(prev => { const s = new Set(prev); s.delete('heatedDryers'); return s; });
    }
    // "No Dryers" → remove dryers from equipment
    if (dryerConfig === 'noDryers') {
      setSelectedEquipment(prev => { const s = new Set(prev); s.delete('dryers'); s.delete('heatedDryers'); return s; });
    }
  }, [dryerConfig]);

  // Vacuum config → auto-set turbine HP and handle "No Vacuums"
  useEffect(() => {
    if (!vacuumConfig) return;
    const cfg = VACUUM_CONFIG_OPTIONS.find(c => c.id === vacuumConfig);
    if (!cfg) return;
    // Auto-set turbine HP based on config
    if (cfg.hasTurbine) {
      if (!vacuumTurbineHP || vacuumTurbineHP === '' || vacuumTurbineHP === '0') setVacuumTurbineHP(cfg.turbineHP.toString());
    } else {
      setVacuumTurbineHP('0');
    }
    // "No Vacuums" → remove vacuums from equipment
    if (vacuumConfig === 'noVacuums') {
      setSelectedEquipment(prev => { const s = new Set(prev); s.delete('vacuums'); return s; });
    }
  }, [vacuumConfig]);

  // Auto-calculate roof footprint from tunnel length (28 ft typical building width)
  const roofManuallySetRef = useRef(false);
  useEffect(() => {
    if (tunnelLength && !roofManuallySetRef.current) {
      setTotalRoofArea(String(parseInt(tunnelLength) * 28));
    }
  }, [tunnelLength]);

  useEffect(() => {
    if (totalRoofArea) {
      const roofFactor = roofType === 'polycarbonate' ? 0.40 : roofType === 'mixed' ? 0.55 : roofType === 'opaque' ? 0.70 : 0.65;
      setRoofArea(String(Math.round(parseInt(totalRoofArea) * roofFactor)));
    }
  }, [totalRoofArea, roofType]);

  // Reverse-tracking + auto-complete (replaces manual Continue buttons for Q3/4/6/7/8/13)
  useEffect(() => {
    // Q3: auto-complete when hours + days + vehicles all set
    const q3Done = !!(operatingHours && daysPerWeek && dailyVehicles);
    if (q3Done && !completedQuestions.has(3)) markCompleted(3);
    if (!q3Done && completedQuestions.has(3)) unmarkCompleted(3);

    // Q4: auto-complete when bill mode selected and valid
    const q4Done = billInputMode === 'auto' ? parseInt(monthlyElecBill) >= 500 : billInputMode === 'upload' ? (billUploadData && !billUploadData.parsing) : false;
    if (q4Done && !completedQuestions.has(4)) { markCompleted(4); setParentAnnualBill(Math.min(300000, Math.max(6000, parseInt(monthlyElecBill) * 12))); }
    if (!q4Done && completedQuestions.has(4)) unmarkCompleted(4);

    // Q6: auto-complete when billing type + kWh set
    const q6Done = !!(utilityBillingType && ((actualMonthlyKWh && parseInt(actualMonthlyKWh) > 0) || kwhUnknown));
    if (q6Done && !completedQuestions.has(6)) markCompleted(6);
    if (!q6Done && completedQuestions.has(6)) unmarkCompleted(6);

    // Q7: auto-complete when equipment selected (defaults pre-loaded)
    if (selectedEquipment.size > 0 && !completedQuestions.has(7)) markCompleted(7);
    if (selectedEquipment.size === 0 && completedQuestions.has(7)) unmarkCompleted(7);

    // Q8: NOT auto-completed — user reviews pre-filled specs, clicks Continue
    // (activeQuestion gates Q8 behind Q7 completion)

    // Q10: auto-complete when any electrical info provided
    if ((serviceRating || siteVoltage || powerQualityIssues.size > 0) && !completedQuestions.has(10)) markCompleted(10);
    if (!serviceRating && !siteVoltage && powerQualityIssues.size === 0 && completedQuestions.has(10)) unmarkCompleted(10);

    // Q13: auto-complete when site + roof + type set
    const q13Done = !!(siteSqFt && totalRoofArea && roofType);
    if (q13Done && !completedQuestions.has(13)) markCompleted(13);
    if (!q13Done && completedQuestions.has(13)) unmarkCompleted(13);

    // Q14: auto-complete when any toggle touched or merlin selected
    const q14Done = !!(carportSolarInterest || groundSolarInterest || merlinSolar);
    if (q14Done && !completedQuestions.has(14)) markCompleted(14);
    if (!q14Done && completedQuestions.has(14)) unmarkCompleted(14);

    if (!hasEvChargers && completedQuestions.has(15)) unmarkCompleted(15);
    if (!waterReclaimLevel && completedQuestions.has(12)) unmarkCompleted(12);
  }, [facilityType, bayCount, tunnelLength, operatingHours, daysPerWeek, dailyVehicles, gasLine, waterHeater, utilityBillingType, actualMonthlyKWh, kwhUnknown, billInputMode, monthlyElecBill, billUploadData, selectedEquipment, pumpHasVFD, dryerHasVFD, outageImpact, carportSolarInterest, groundSolarInterest, merlinSolar, hasEvChargers, waterReclaimLevel, equipmentAge, pumpCount, pumpHP, dryerCount, dryerHP, conveyorHP, brushMotorCount, airCompressorHP, vacuumCount, vacuumTurbineHP, vacuumConfig, serviceRating, siteVoltage, powerQualityIssues, siteSqFt, totalRoofArea, roofType]);

  // Calculate completion based on actually completed questions
  const answeredQuestions = completedQuestions.size;

  const totalQuestions = getTotalQuestions();
  const completionPercent = Math.min(100, Math.round((answeredQuestions / totalQuestions) * 100));

  // Get bay label based on facility type
  const getBayLabel = () => {
    if (facilityType === 'iba') return 'wash bay';
    if (facilityType === 'express' || facilityType === 'mini' || facilityType === 'fullService') return 'tunnel';
    if (facilityType === 'self') return 'wash bays';
    return 'bays/tunnels';
  };

  // Handle continue to next step
  const handleContinue = () => {
    // FIX A-11: removed debug log
    onComplete({
      // FIX C-2: entityType & energyCommunity required by WizB tax engine
      // Car washes are predominantly LLCs — WizB uses this for MACRS/tax rate calculations
      // energyCommunity auto-detected from census tract in locationData (drives +10% ITC bonus)
      entityType: 'llc',
      energyCommunity: locationData?._energyCommunity?.isEnergyCommunity ? 'yes' : 'no',
      facilityType, tunnelLength, bayCount, operatingHours, daysPerWeek, dailyVehicles,
      gasLine, waterHeater, serviceRating,
      // NEW: Electrical infrastructure details
      siteVoltage,
      powerQualityIssues: Array.from(powerQualityIssues),
      utilityBillingType,
      // FIX H-3/H-7: Use ?? not || — demandRate=0 is valid for flat-rate customers
      demandRate: demandRate ?? (utilityBillingType === 'demand' || utilityBillingType === 'tou-demand'
        ? (STATE_UTILITIES[locationData?.state || locationData?.utility?.state]?.electric?.demandCharge ?? 12)
        : 0),
      outageImpact,
      // Equipment data
      // NOTE: selectedEquipment is converted from Set→Array here; the calculator wraps back via new Set(formData.selectedEquipment)
      selectedEquipment: Array.from(selectedEquipment),
      pumpCount: selectedEquipment.has('pumps') ? pumpCount : null,
      pumpHP: selectedEquipment.has('pumps') ? pumpHP : null,
      pumpConfig: selectedEquipment.has('pumps') ? pumpConfig : null,
      pumpHasVFD,
      dryerCount: selectedEquipment.has('dryers') ? dryerCount : null,
      dryerHP: selectedEquipment.has('dryers') ? dryerHP : null,
      dryerConfig: selectedEquipment.has('dryers') ? dryerConfig : null,
      dryerHasVFD,
      conveyorHP: selectedEquipment.has('conveyor') ? conveyorHP : null,
      brushMotorCount: selectedEquipment.has('brushMotors') ? brushMotorCount : null,
      brushMotorAvgHP: 3,  // Fixed industry average HP per brush motor
      vacuumCount: selectedEquipment.has('vacuums') ? vacuumCount : null,
      vacuumTurbineHP: selectedEquipment.has('vacuums') ? vacuumTurbineHP : null,
      vacuumConfig: selectedEquipment.has('vacuums') ? vacuumConfig : null,
      airCompressorHP: selectedEquipment.has('airCompressor') ? airCompressorHP : null,
      hasRO: selectedEquipment.has('ro'),
      roHP: selectedEquipment.has('ro') ? roHP : null,
      hasElectricWaterHeater: selectedEquipment.has('waterHeaterElec'),
      heatedDryerElements: (dryerConfig === 'heated' || dryerConfig === 'hybrid') ? 'yes' : 'no',
      kioskCount: selectedEquipment.has('pos') ? kioskCount : '0',
      lightingTier: selectedEquipment.has('lighting') ? lightingTier : null,
      signageTier: selectedEquipment.has('signage') ? signageTier : null,
      officeFacilities: selectedEquipment.has('officeFacilities') ? Array.from(officeFacilities) : [],
      waterReclaimLevel,  // 'none', 'basic', 'standard', 'advanced'
      equipmentAge,       // Sprint 4: 'new', 'moderate', 'old', 'veryOld'
      // Site Features (climate + premium only — tunnel extras captured by brush motors, water treatment by waterReclaimLevel)
      siteFeatures: {
        climateControl: siteFeatures?.climateControl || (
          ['MI','MN','WI','IL','OH','PA','NY','MA','CT','NJ','CO','UT','MT','ND','SD','NE','IA','IN','WY','ID','ME','NH','VT']
          .includes(locationData?.state || locationData?.utility?.state) ? 'full' : 'standard'),
        premiumServices: siteFeatures?.premiumServices || (facilityType === 'fullService' ? 'full' : facilityType === 'express' ? 'basic' : 'none')
      },
      // Site data
      siteSqFt, totalRoofArea, roofArea, roofType,
      carportSolarInterest, groundSolarInterest, merlinSolar,
      carportInterest, carportArea: showCarportArea ? carportArea : null,
      carportLength: showCarportArea ? carportLength : null, carportWidth: showCarportArea ? carportWidth : null,
      groundMountInterest, groundMountArea: showGroundMountArea ? groundMountArea : null,
      groundLength: showGroundMountArea ? groundLength : null, groundWidth: showGroundMountArea ? groundWidth : null,
      solarStrategy,
      hasEvChargers,
      l2Chargers: hasEvChargers === 'yes' ? l2Chargers : '0',
      dcChargers: hasEvChargers === 'yes' ? dcChargers : '0',
      // Estimated monthly energy bill: dailyVehicles × daysPerWeek × 4 weeks × $/car energy cost
      // FIX #8: Vary energy cost/car by facility type (was flat $0.50)
      // FIX M-4: PRIORITY CHAIN (WizB uses): actualMonthlyKWh > monthlyElectricBill > estimatedBill > annualBill/12
      // When monthlyElectricBill is set, this estimatedBill is only used for divergence validation, not sizing
      estimatedBill: (parseInt(dailyVehicles) || 0) * (parseInt(daysPerWeek || 7) || 7) * 4 * (
        { express: 0.65, mini: 0.40, flex: 0.55, iba: 0.30, fullService: 1.10, selfService: 0.15 }[facilityType] || 0.50
      ),
      // Q7 standalone monthly bill — highest-fidelity bill input, overrides slider + estimatedBill
      monthlyElectricBill: monthlyElecBill ? parseInt(monthlyElecBill) : null,
      // Phase 2: Optional actual utility bill data (Tier 5 accuracy when both provided)
      // These bypass the bill→kWh derivation entirely, eliminating ~8-10% payback error for demand-billed customers
      actualMonthlyKWh: actualMonthlyKWh ? parseInt(actualMonthlyKWh) : null,
      actualPeakDemandKW: actualPeakDemandKW ? parseInt(actualPeakDemandKW) : null,
      kwhUnknown: kwhUnknown
    });
  };

  // Manual continue handlers for questions with sliders or multi-step inputs
  const handleManualContinue = (currentQ) => {
    if (currentQ === 3 && dailyVehicles && operatingHours && daysPerWeek) {
      markCompleted(3);
    } else if (currentQ === 8) {
      if (pumpHasVFD === null && selectedEquipment.has('pumps')) setPumpHasVFD(false);
      if (dryerHasVFD === null && selectedEquipment.has('dryers')) setDryerHasVFD(false);
      markCompleted(8);
    }
  };

  // Facility types
  const FACILITY_TYPES = [
    { id: 'express', title: 'Express Tunnel', desc: 'High-speed conveyor, 80-180 feet', examples: 'Tommy\'s, Mister Car Wash, Quick Quack' },
    { id: 'fullService', title: 'Full-Service', desc: 'Complete detailing + tunnel', examples: 'Simoniz, Delta Sonic, Hoffman' },
    { id: 'mini', title: 'Mini-Tunnel', desc: 'Shorter conveyor under 60 feet', examples: 'Splash, Autobell, local chains' },
    { id: 'iba', title: 'In-Bay Automatic', desc: 'Vehicle stationary, machine moves', examples: 'PDQ, WashTec, Ryko' },
    { id: 'self', title: 'Self-Serve Bay', desc: 'Customer wand wash', examples: 'Coin-op, DIY wand bays' }
  ];

  // Service rating options - Don't Know first
  // Equipment logic based on facility type
  const getEquipmentLogic = () => {
    // Estimate water heater type if unknown
    const effectiveWaterHeater = waterHeater === 'unknown' 
      ? (gasLine === 'yes' ? 'gas' : 'electric')
      : waterHeater;
    
    const logic = {
      pumps: { disabled: false },
      conveyor: { 
        disabled: facilityType === 'iba' || facilityType === 'self',
        reason: 'Not applicable for this facility type'
      },
      dryers: {
        disabled: facilityType === 'self',
        reason: 'Self-serve: customers air dry'
      },
      brushMotors: {
        disabled: facilityType === 'self',
        reason: 'Self-serve: no brush motors'
      },
      ro: { disabled: false },
      waterHeaterElec: { 
        disabled: effectiveWaterHeater === 'gas' || effectiveWaterHeater === 'propane' || effectiveWaterHeater === 'none',
        reason: effectiveWaterHeater === 'gas' 
          ? (waterHeater === 'unknown' ? 'Gas line available - assumed gas heating' : 'You selected gas water heating')
          : effectiveWaterHeater === 'propane' ? 'You selected propane water heating'
          : 'No hot water selected'
      },
      lighting: { disabled: false },
      vacuums: { disabled: false },
      pos: { disabled: false },
      airCompressor: { disabled: false },
      heatedDryers: { disabled: !selectedEquipment.has('dryers'), reason: 'No dryers selected' },
      signage: { disabled: false },
      officeFacilities: { disabled: false }
    };
    return logic;
  };

  // Equipment options for checklist
  // ═══════════════════════════════════════════════════════════════════════════════
  // COMPREHENSIVE CAR WASH EQUIPMENT AUDIT
  // Based on: Tommy's, Zips, Mister Car Wash, Quick Quack, Take 5, etc.
  // ═══════════════════════════════════════════════════════════════════════════════
  
  // HP options for equipment
  // Apply typical specs for facility type
  const applyTypicalSpecs = () => {
    const defaults = getCurrentDefaults();
    setPumpCount(defaults.pumps.count.toString());
    setPumpHP(defaults.pumps.hp.toString());
    setPumpHasVFD(null);  // Don't default — user must select
    setDryerCount(defaults.dryers.count.toString());
    setDryerHP(defaults.dryers.hp.toString());
    setDryerHasVFD(null);  // Don't default — user must select
    setConveyorHP(defaults.conveyor.hp.toString());
    setBrushMotorCount(defaults.brushMotors?.count?.toString() || '');
    setVacuumCount(defaults.vacuums.count.toString());
    setVacuumTurbineHP(defaults.vacuums.count > 0 ? '30' : '');  // 30 HP default turbine
    setVacuumConfig(defaults.vacuums.turbineHP ? 'centralTurbine' : defaults.vacuums.count > 0 ? 'individual' : '');
    setAirCompressorHP(defaults.airCompressor.hp.toString());
  };

  // Water heater options - Don't Know last
  const WATER_OPTIONS = [
    { id: 'gas', title: 'Natural Gas', desc: 'Lower electric demand', isUnknown: false },
    { id: 'electric', title: 'Electric', desc: '50-150 kW demand', isUnknown: false },
    { id: 'propane', title: 'Propane', desc: 'LP tank · No electric load', isUnknown: false },
    { id: 'none', title: 'No Hot Water', desc: 'Cold water only', isUnknown: false },
    { id: 'unknown', title: "Don't Know", desc: "We'll estimate", isUnknown: true }
  ];


  return (
    <div className="fixed inset-0 bg-black z-40 flex flex-col">
      {/* ═══ TrueQuote™ Modal — matches Step 4 design ═══ */}
      {showTrueQuoteModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
          onClick={e => { if (e.target === e.currentTarget) setShowTrueQuoteModal(false); }}>
          <div style={{ width: '100%', maxWidth: 680, maxHeight: '85vh', overflowY: 'auto', background: '#0f172a', border: '1px solid #334155', borderRadius: 20, padding: '24px 28px' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ padding: '6px 14px', borderRadius: 8, background: 'rgba(15,23,42,0.8)', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#e2e8f0' }}>TrueQuote™</span>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#6366f1' }} />
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#94a3b8' }}>Verified</span>
                </div>
                <div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: '#fff' }}>TrueQuote™</div>
                  <div style={{ fontSize: 12, color: '#94a3b8' }}>The Quote That Shows Its Work</div>
                </div>
              </div>
              <button onClick={() => setShowTrueQuoteModal(false)} style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(255,255,255,0.06)', border: 'none', color: '#94a3b8', fontSize: 18, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'inherit' }}>✕</button>
            </div>
            {/* Tabs — pill style */}
            <div style={{ display: 'flex', gap: 4, marginBottom: 20, borderBottom: '1px solid #334155', paddingBottom: 12 }}>
              {[{id:'why',icon:'⚠',label:'Why It Matters'},{id:'how',icon:'👁',label:'How It Works'},{id:'proof',icon:'🛡',label:'See The Proof'}].map(t => (
                <button key={t.id} onClick={() => setTrueQuoteTab(t.id)}
                  style={{ padding: '8px 16px', borderRadius: 8, border: 'none', background: trueQuoteTab === t.id ? 'rgba(99,102,241,0.12)' : 'transparent', color: trueQuoteTab === t.id ? '#6366f1' : '#94a3b8', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 6, transition: 'all 0.2s' }}>
                  {t.icon} {t.label}
                </button>
              ))}
            </div>
            {/* Tab Content */}
            {trueQuoteTab === 'why' && (
              <div>
                <div style={{ fontSize: 18, fontWeight: 700, color: '#fff', marginBottom: 12 }}>⚠ The Industry's Dirty Secret</div>
                <p style={{ fontSize: 14, color: '#cbd5e1', lineHeight: 1.6, marginBottom: 20 }}>When you get a BESS quote from most vendors, you're trusting a black box. They give you numbers, but <strong style={{ color: '#fff' }}>can't tell you where they came from</strong>. Banks know this. Investors know this. That's why projects stall.</p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div style={{ padding: 20, borderRadius: 14, background: 'rgba(255,255,255,0.03)', border: '1px solid #334155' }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#94a3b8', marginBottom: 16 }}>👻 Typical Competitor</div>
                    {['Battery System — $2,400,000','Annual Savings — $450,000','Payback Period — 5.3 years'].map((r,i) => (
                      <div key={i} style={{ padding: '10px 12px', marginBottom: 8, background: 'rgba(255,255,255,0.04)', borderRadius: 8, display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                        <span style={{ color: '#94a3b8' }}>{r.split('—')[0]}</span><span style={{ fontWeight: 700, color: '#e2e8f0' }}>{r.split('—')[1]}</span>
                      </div>
                    ))}
                    <div style={{ padding: '10px 12px', borderRadius: 8, background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.1)' }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: '#6366f1' }}>❌ Where do these numbers come from?</div>
                      <div style={{ fontSize: 11, color: '#a5b4fc' }}>"Trust us, we're experts."</div>
                    </div>
                  </div>
                  <div style={{ padding: 20, borderRadius: 14, background: 'rgba(99,102,241,0.04)', border: '1px solid rgba(99,102,241,0.12)' }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#6366f1', marginBottom: 16 }}>🛡️ Merlin TrueQuote™</div>
                    {[['Battery System','$2,400,000','NREL ATB 2024, LFP 4-hr, $150/kWh'],['Annual Savings','$450,000','StoreFAST methodology, EIA rates'],['Payback Period','5.3 years','8% discount, 2% degradation, 30% ITC']].map((r,i) => (
                      <div key={i} style={{ padding: '10px 12px', marginBottom: 8, background: 'rgba(99,102,241,0.06)', borderRadius: 8 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                          <span style={{ color: '#94a3b8' }}>{r[0]}</span><span style={{ fontWeight: 700, color: '#e2e8f0' }}>{r[1]}</span>
                        </div>
                        <div style={{ fontSize: 10, color: '#6366f1', marginTop: 4, fontFamily: 'monospace' }}>📋 {r[2]}</div>
                      </div>
                    ))}
                    <div style={{ padding: '10px 12px', borderRadius: 8, background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.12)' }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: '#6366f1' }}>✅ Every number is verifiable.</div>
                      <div style={{ fontSize: 11, color: '#a5b4fc' }}>Export JSON audit trail for bank due diligence.</div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            {trueQuoteTab === 'how' && (
              <div>
                <div style={{ fontSize: 18, fontWeight: 700, color: '#fff', marginBottom: 16 }}>How TrueQuote™ Works</div>
                {[{step:'1',title:'Source Attribution',desc:'Every cost figure links to NREL ATB, EIA, or manufacturer data sheets. No "industry average" hand-waving.'},{step:'2',title:'Methodology Transparency',desc:'Financial models use StoreFAST (NREL) with published assumptions: discount rate, degradation, inflation, ITC step-down schedule.'},{step:'3',title:'Audit Hash',desc:'Each quote generates a SHA-256 hash of all inputs/outputs. Change one number and the hash breaks — tamper-proof integrity.'}].map((s,i) => (
                  <div key={i} style={{ display: 'flex', gap: 14, marginBottom: 16 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 800, color: '#6366f1', flexShrink: 0 }}>{s.step}</div>
                    <div><div style={{ fontSize: 14, fontWeight: 700, color: '#fff', marginBottom: 4 }}>{s.title}</div><div style={{ fontSize: 13, color: '#94a3b8', lineHeight: 1.5 }}>{s.desc}</div></div>
                  </div>
                ))}
              </div>
            )}
            {trueQuoteTab === 'proof' && (
              <div>
                <div style={{ fontSize: 18, fontWeight: 700, color: '#fff', marginBottom: 16 }}>See The Proof</div>
                <div style={{ padding: 16, borderRadius: 12, background: 'rgba(255,255,255,0.03)', border: '1px solid #334155', marginBottom: 16 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: 8 }}>Your Quote's Data Sources</div>
                  {[['Equipment Pricing','NREL ATB 2024 + manufacturer quotes'],['Electric Rates',`EIA Open Data — ${locationData?.state || 'MI'} commercial avg`],['Solar Irradiance','NREL PVWatts v8 — site-specific'],['Financial Model','StoreFAST methodology + IRS §48E'],['Incentives','DSIRE database + IRS guidance']].map(([k,v],i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: i < 4 ? '1px solid rgba(255,255,255,0.06)' : 'none', fontSize: 13 }}>
                      <span style={{ color: '#94a3b8' }}>{k}</span><span style={{ color: '#e2e8f0', fontFamily: 'monospace', fontSize: 11 }}>{v}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {/* Footer */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 24, paddingTop: 16, borderTop: '1px solid #334155' }}>
              <span style={{ fontSize: 11, color: '#64748b' }}>TrueQuote™ Verified · Source-attributed pricing</span>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => setShowTrueQuoteModal(false)} style={{ padding: '8px 16px', borderRadius: 8, background: 'none', border: 'none', color: '#94a3b8', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>Close</button>
                <button onClick={() => setShowTrueQuoteModal(false)} style={{ padding: '8px 20px', borderRadius: 10, background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.15)', color: '#6366f1', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>Get Your TrueQuote™ →</button>
              </div>
            </div>
          </div>
        </div>
      )}
      <div className="fixed top-0 bottom-0 left-[33.33%] w-px bg-indigo-800" style={{ zIndex: 60 }} />
      <div className="flex-1 grid grid-cols-3 min-h-0">
      <div className="border-r border-indigo-800 p-6 pt-16 bg-indigo-950 overflow-y-auto">
        {/* TrueQuote™ Verified Badge */}
        <div onClick={() => setShowTrueQuoteModal(true)}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, padding: '10px 18px', marginBottom: 12, borderRadius: 12, background: 'linear-gradient(135deg, rgba(15,23,42,0.9), rgba(30,41,59,0.7))', border: '1px solid rgba(99,102,241,0.15)', cursor: 'pointer', transition: 'all 0.2s' }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(99,102,241,0.4)'; e.currentTarget.style.background = 'linear-gradient(135deg, rgba(99,102,241,0.08), rgba(15,23,42,0.9))'; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(99,102,241,0.15)'; e.currentTarget.style.background = 'linear-gradient(135deg, rgba(15,23,42,0.9), rgba(30,41,59,0.7))'; }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><polyline points="9 12 11.5 14.5 15.5 9.5" stroke="#6366f1" strokeWidth="2"/></svg>
          <span style={{ fontSize: 14, fontWeight: 800, color: '#e2e8f0', letterSpacing: 0.3 }}>TrueQuote™</span>
          <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#6366f1', flexShrink: 0 }} />
          <span style={{ fontSize: 14, fontWeight: 600, color: '#94a3b8' }}>Verified</span>
        </div>
        <div className="mb-3 rounded-xl overflow-hidden" style={{ background: 'linear-gradient(135deg, #1e1b4b 0%, #0f172a 100%)', border: '1px solid #334155' }}>
          {(() => {
            const isComplete = completionPercent >= 100;
            const strokeColor = isComplete ? '#6366f1' : completionPercent >= 66 ? '#6366f1' : '#4338ca';
            const trackColor = isComplete ? '#1e1b4b' : completionPercent >= 66 ? '#1e1b4b' : '#1e1b4b';
            const locStr = locationData ? `${locationData?.city || locationData?.utility?.city || locationData?.utility?.region?.split(',')[0]}, ${locationData?.state || locationData?.utility?.state} ${locationData?.zipCode}` : '';

            return (
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '16px 14px' }}>
                {/* Left: Ring */}
                <div className="relative flex-shrink-0" style={{ width: 90, height: 90 }}>
                  <svg width="90" height="90" className="-rotate-90">
                    <circle cx="45" cy="45" r="36" stroke={trackColor} strokeWidth="12" fill="none" />
                    <circle cx="45" cy="45" r="36" stroke={strokeColor} strokeWidth="12" fill="none"
                      strokeDasharray={`${completionPercent * 2.262} 226.2`} strokeLinecap="round"
                      style={{ filter: `drop-shadow(0 0 10px ${strokeColor}90)` }}
                      className="transition-all duration-700 ease-out" />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    {isComplete ? (
                      <Check className="w-8 h-8 text-indigo-400" />
                    ) : (
                      <span style={{ fontSize: 22, fontWeight: 900, color: '#fff' }}>{completionPercent}%</span>
                    )}
                  </div>
                </div>

                {/* Middle: Questions Answered */}
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 4 }}>Questions Answered</div>
                  <div style={{ fontSize: 28, fontWeight: 900, color: '#fff', lineHeight: 1 }}>
                    {answeredQuestions}<span style={{ color: '#475569', fontWeight: 700 }}> / {totalQuestions}</span>
                  </div>
                </div>

                {/* Right: Car Wash + City/State */}
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ fontSize: 18, fontWeight: 800, color: '#fff', marginBottom: 4 }}>{String.fromCodePoint(128663)} Car Wash</div>
                  {locStr && (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 5 }}>
                      <MapPin style={{ width: 12, height: 12, color: '#a5b4fc', flexShrink: 0 }} />
                      <span style={{ fontSize: 12, color: '#cbd5e1' }}>{locStr}</span>
                      {locationData?._hasLiveData && (
                        <span
                          style={{ position: 'relative', display: 'inline-flex' }}
                          onMouseEnter={e => { const tip = e.currentTarget.querySelector('[data-tip]'); if (tip) { tip.style.visibility = 'visible'; tip.style.opacity = '1'; } }}
                          onMouseLeave={e => { const tip = e.currentTarget.querySelector('[data-tip]'); if (tip) { tip.style.visibility = 'hidden'; tip.style.opacity = '0'; } }}
                        >
                          <span style={{ fontSize: 10, padding: '2px 6px', borderRadius: 4, fontWeight: 700, background: 'rgba(99,102,241,0.15)', color: '#a5b4fc', border: '1px solid rgba(99,102,241,0.18)', display: 'flex', alignItems: 'center', gap: 3, flexShrink: 0, cursor: 'help' }}>
                            <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#a5b4fc', display: 'inline-block' }} />
                            Live
                          </span>
                          <span data-tip="true" style={{ position: 'absolute', bottom: '100%', right: 0, marginBottom: 8, width: 280, padding: '14px 16px', background: '#1e293b', border: '1px solid #475569', borderRadius: 12, fontSize: 12, color: '#cbd5e1', lineHeight: 1.5, boxShadow: '0 8px 24px rgba(0,0,0,0.5)', zIndex: 50, visibility: 'hidden', opacity: 0, transition: 'all 0.2s' }}>
                            <div style={{ fontWeight: 700, color: '#a5b4fc', marginBottom: 8, fontSize: 13 }}>⚡ Live Data for ZIP {locationData?.zip || locationData?.zipCode}</div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                              {/* Electric Rate */}
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 8px', background: 'rgba(15,23,42,0.6)', borderRadius: 8 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                  <Zap style={{ width: 12, height: 12, color: '#6366f1' }} />
                                  <span style={{ fontSize: 11, color: '#94a3b8' }}>Electric Rate</span>
                                </div>
                                <span style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>${locationData?.utility?.electric?.avgRate || '—'}/kWh</span>
                              </div>
                              {/* Demand Charge */}
                              {locationData?.utility?.electric?.demandCharge > 0 && (
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 8px', background: 'rgba(15,23,42,0.6)', borderRadius: 8 }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                    <Gauge style={{ width: 12, height: 12, color: '#a5b4fc' }} />
                                    <span style={{ fontSize: 11, color: '#94a3b8' }}>Demand Charge</span>
                                  </div>
                                  <span style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>${locationData.utility.electric.demandCharge}/kW</span>
                                </div>
                              )}
                              {/* Peak Sun Hours */}
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 8px', background: 'rgba(15,23,42,0.6)', borderRadius: 8 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                  <Sun style={{ width: 12, height: 12, color: '#a5b4fc' }} />
                                  <span style={{ fontSize: 11, color: '#94a3b8' }}>Peak Sun Hours</span>
                                </div>
                                <span style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>{locationData?.solar?.peakSunHours || '—'} hrs/day</span>
                              </div>
                              {/* Annual Solar Output */}
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 8px', background: 'rgba(15,23,42,0.6)', borderRadius: 8 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                  <Battery style={{ width: 12, height: 12, color: '#a5b4fc' }} />
                                  <span style={{ fontSize: 11, color: '#94a3b8' }}>Solar Output</span>
                                </div>
                                <span style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>{locationData?.solar?.annualProduction?.toLocaleString() || '—'} kWh/kW</span>
                              </div>
                            </div>
                            {/* Source + Timestamp */}
                            <div style={{ marginTop: 8, paddingTop: 6, borderTop: '1px solid #334155', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <span style={{ fontSize: 10, color: '#64748b' }}>{locationData?.utility?.electric?._liveSource || 'EIA / PVWatts'}</span>
                              <span style={{ fontSize: 10, color: '#64748b' }}>{locationData?._liveData?.fetchedAt ? new Date(locationData._liveData.fetchedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}</span>
                            </div>
                            <span style={{ position: 'absolute', top: '100%', right: 16, width: 8, height: 8, background: '#1e293b', border: '1px solid #475569', borderTop: 'none', borderLeft: 'none', transform: 'rotate(45deg)', marginTop: -5 }} />
                          </span>
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })()}
          {/* Site Intelligence - inside header box */}
          {locationData && (
            <div style={{ padding: '0 14px 14px' }}>
            <div style={{ height: 1, background: '#334155', margin: '8px 0 10px' }} />
            <table style={{ width: '100%', borderCollapse: 'collapse', borderRadius: 8, overflow: 'hidden', marginTop: 4 }}>
              <tbody>
                <tr>
                  <td style={{ width: '33%', padding: '8px 10px', background: '#1e293b', borderRight: '1px solid #334155', borderBottom: '1px solid #334155' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 3, marginBottom: 2 }}>
                      <span style={{ fontSize: 11 }}>{String.fromCodePoint(9728)}</span>
                      <span style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', color: '#94a3b8' }}>Solar</span>
                      <span style={{ fontSize: 9, padding: '1px 4px', borderRadius: 3, fontWeight: 700, background: (locationData?.solar?.rating === 'Excellent' || locationData?.solar?.rating === 'Good') ? 'rgba(99,102,241,0.18)' : 'rgba(99,102,241,0.15)', color: (locationData?.solar?.rating === 'Excellent' || locationData?.solar?.rating === 'Good') ? '#a5b4fc' : '#a5b4fc' }}>{locationData?.solar?.rating || 'Good'}</span>
                    </div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: '#fff' }}>{Number(locationData?.solar?.peakSunHours || 0).toFixed(1)} <span style={{ fontSize: 11, fontWeight: 400, color: '#94a3b8' }}>hrs/day</span></div>
                  </td>
                  <td style={{ width: '33%', padding: '8px 10px', background: '#1e293b', borderRight: '1px solid #334155', borderBottom: '1px solid #334155' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 3, marginBottom: 2 }}>
                      <span style={{ fontSize: 11 }}>{String.fromCodePoint(9889)}</span>
                      <span style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', color: '#94a3b8' }}>Electric</span>
                      <span style={{ fontSize: 9, padding: '1px 4px', borderRadius: 3, fontWeight: 700, background: locationData?.electric?.level === 'Very High' ? 'rgba(99,102,241,0.18)' : locationData?.electric?.level === 'High' ? 'rgba(99,102,241,0.1)' : 'rgba(99,102,241,0.15)', color: locationData?.electric?.level === 'Very High' ? '#a5b4fc' : locationData?.electric?.level === 'High' ? '#818cf8' : '#a5b4fc' }}>{locationData?.electric?.level || '-'}</span>
                    </div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: '#fff' }}>${Number(locationData?.electric?.rate || 0).toFixed(2)}<span style={{ fontSize: 11, fontWeight: 400, color: '#94a3b8' }}>/kWh</span></div>
                  </td>
                  <td style={{ width: '33%', padding: '8px 10px', background: '#1e293b', borderBottom: '1px solid #334155' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 3, marginBottom: 2 }}>
                      <span style={{ fontSize: 11 }}>{String.fromCodePoint(127777)}</span>
                      <span style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', color: '#94a3b8' }}>Climate</span>
                    </div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: (locationData?.weather?.risk || '').toLowerCase() === 'high' ? '#334155' : (locationData?.weather?.risk || '').toLowerCase() === 'moderate' ? '#6366f1' : '#a5b4fc' }}>{locationData?.weather?.risk || 'Moderate'}</div>
                  </td>
                </tr>
                <tr>
                  <td style={{ padding: '8px 10px', background: '#1e293b', borderRight: '1px solid #334155' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 3, marginBottom: 2 }}>
                      <span style={{ fontSize: 11 }}>{String.fromCodePoint(128293)}</span>
                      <span style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', color: '#94a3b8' }}>Gas</span>
                      <span style={{ fontSize: 9, padding: '1px 4px', borderRadius: 3, fontWeight: 700, background: 'rgba(99,102,241,0.15)', color: '#a5b4fc' }}>{locationData?.gas?.level || '-'}</span>
                    </div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: '#fff' }}>${Number(locationData?.gas?.rate || 0).toFixed(2)}<span style={{ fontSize: 11, fontWeight: 400, color: '#94a3b8' }}>/thm</span></div>
                  </td>
                  <td style={{ padding: '8px 10px', background: '#1e293b', borderRight: '1px solid #334155' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 3, marginBottom: 2 }}>
                      <span style={{ fontSize: 11 }}>{String.fromCodePoint(128176)}</span>
                      <span style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', color: '#94a3b8' }}>Incentives</span>
                    </div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: '#a5b4fc' }}>~{locationData?.incentives?.total || 30}%</div>
                  </td>
                  <td style={{ padding: '8px 10px', background: '#1e293b' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 3, marginBottom: 2 }}>
                      <span style={{ fontSize: 11 }}>{String.fromCodePoint(128267)}</span>
                      <span style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', color: '#94a3b8' }}>Battery</span>
                    </div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: locationData?.battery?.recommended ? '#a5b4fc' : '#94a3b8' }}>{locationData?.battery?.recommended ? 'Yes' : 'Opt.'}</div>
                  </td>
                </tr>
              </tbody>
            </table>
            </div>
          )}
        </div>

        {/* Equipment Load Summary */}
        {completedQuestions.has(12) && selectedEquipment.size > 0 && (
          <div className="mb-3 mt-2">
            <div className="flex items-center gap-2 mb-1.5">
              <Zap className="w-4 h-4 text-indigo-400" />
              <span className="text-sm font-semibold text-white">Equipment Load</span>
            </div>
            {(() => {
              const pHPBase = selectedEquipment.has('pumps') ? (parseInt(pumpCount) || 3) * (pumpHP === 'unknown' || !pumpHP ? getCurrentDefaults().pumps.hp : parseFloat(pumpHP) || 20) : 0;
              const dHPBase = selectedEquipment.has('dryers') ? (parseInt(dryerCount) || 16) * (dryerHP === 'unknown' || !dryerHP ? getCurrentDefaults().dryers.hp : parseFloat(dryerHP) || 10) : 0;
              const cHP = selectedEquipment.has('conveyor') ? (conveyorHP === 'unknown' || !conveyorHP ? getCurrentDefaults().conveyor.hp : parseFloat(conveyorHP) || 20) : 0;
              const bHP = selectedEquipment.has('brushMotors') ? (brushMotorCount === 'unknown' || !brushMotorCount ? (getCurrentDefaults().brushMotors?.count || 15) * 3 : parseInt(brushMotorCount) * 3) : 0;
              const vHP = selectedEquipment.has('vacuums') ? (parseInt(vacuumCount) || 16) * 4.5 : 0;
              const vtHP = selectedEquipment.has('vacuums') && vacuumTurbineHP && vacuumTurbineHP !== 'unknown' ? parseFloat(vacuumTurbineHP) : 0;
              const aHP = selectedEquipment.has('airCompressor') ? (airCompressorHP === 'unknown' || !airCompressorHP ? getCurrentDefaults().airCompressor.hp : parseFloat(airCompressorHP) || 7.5) : 0;
              const heatHP = selectedEquipment.has('heatedDryers') ? 54 : 0;  // ~40 kW / 0.746
              const miscHP = 15;
              const totalHP = pHPBase + dHPBase + cHP + bHP + vHP + vtHP + aHP + heatHP + miscHP;
              const totalKW = Math.round(totalHP * 0.746);
              
              // Build category list for rendering
              const categories = [
                ...(dHPBase > 0 ? [{ label: 'Blowers', hp: Math.round(dHPBase), color: 'bg-indigo-500' }] : []),
                ...(heatHP > 0 ? [{ label: 'Heat Elem', hp: Math.round(heatHP), color: 'bg-indigo-400' }] : []),
                ...(pHPBase > 0 ? [{ label: 'Pumps', hp: Math.round(pHPBase), color: 'bg-indigo-600' }] : []),
                ...(bHP > 0 ? [{ label: 'Brushes', hp: Math.round(bHP), color: 'bg-indigo-500' }] : []),
                ...((vHP + vtHP) > 0 ? [{ label: 'Vacuums', hp: Math.round(vHP + vtHP), color: 'bg-indigo-400' }] : []),
                ...(cHP > 0 ? [{ label: 'Conveyor', hp: Math.round(cHP), color: 'bg-indigo-500' }] : []),
                ...(aHP > 0 ? [{ label: 'Air Comp', hp: Math.round(aHP), color: 'bg-indigo-300' }] : []),
                { label: 'Other', hp: miscHP, color: 'bg-slate-500' }
              ];
              
              return (
                <div className="rounded-xl overflow-hidden bg-slate-800 border border-slate-700">
                  {/* Header with totals */}
                  <div className="px-3 py-2.5 flex items-center justify-between border-b border-slate-700">
                    <div className="flex items-baseline gap-2">
                      <span className="text-lg font-bold text-white">{Math.round(totalHP)} HP</span>
                      <span className="text-sm text-indigo-400 font-semibold">= ~{totalKW} kW</span>
                    </div>
                    <Zap className="w-5 h-5 text-indigo-400" />
                  </div>
                  {/* Per-category breakdown bars */}
                  <div className="px-3 py-2 space-y-1.5">
                    {categories.map(cat => {
                      const pct = totalHP > 0 ? Math.round((cat.hp / totalHP) * 100) : 0;
                      return (
                        <div key={cat.label} className="flex items-center gap-2">
                          <span className="text-[10px] text-slate-300 w-14 text-right flex-shrink-0">{cat.label}</span>
                          <div className="flex-1 h-2 bg-slate-700 rounded-full overflow-hidden">
                            <div className={`h-full rounded-full ${cat.color} transition-all duration-500`} style={{ width: `${pct}%` }} />
                          </div>
                          <span className="text-[10px] text-slate-300 w-8 text-right flex-shrink-0">{cat.hp}</span>
                        </div>
                      );
                    })}
                  </div>
                  {/* Outage risk */}
                  <div style={{ padding: '6px 12px', borderTop: '1px solid #334155', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: 10, color: '#6366f1' }}>⚡</span>
                    <span style={{ fontSize: 10, color: '#6366f1', fontWeight: 600 }}>4-hr outage risk: ${Math.round(totalKW * 4 * 0.15).toLocaleString()}-${Math.round(totalKW * 4 * 0.3).toLocaleString()}</span>
                  </div>
                </div>
              );
            })()}
          </div>
        )}

        {/* ── Section Progress Tracker ── */}
        <div className="mb-3">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs">📋</span>
            <span className="text-sm font-semibold text-white">Section Progress</span>
          </div>
          {[
            { id: 'facility', icon: '🏢', label: 'Facility Basics', qs: [1,2,3] },
            { id: 'energy', icon: '⚡', label: 'Energy & Utility', qs: [4,5,6] },
            { id: 'equipment', icon: '⚙️', label: 'Equipment', qs: [7,8,9] },
            { id: 'infra', icon: '🏗️', label: 'Infrastructure', qs: [10,11,12] },
            { id: 'site', icon: '📐', label: 'Site & Add-ons', qs: [13,14,15] },
          ].map((sec, si) => {
            const visibleQs = sec.qs.filter(qn => {
              if (qn === 3) return facilityType && ['express','mini','fullService'].includes(facilityType);
              return true;
            });
            const doneCount = visibleQs.filter(qn => completedQuestions.has(qn) || activeQuestion > qn).length;
            const visCount = visibleQs.length;
            const secPct = visCount > 0 ? Math.round((doneCount / visCount) * 100) : 0;
            const isDone = secPct >= 100;
            const isActive = !isDone && (activeQuestion >= Math.min(...visibleQs) && activeQuestion <= Math.max(...visibleQs));
            const isLocked = !isDone && !isActive;
            const qLabels = {
              1:'Facility type',2:'Facility size',3:'Operating schedule',
              4:'Electric bill',5:'Gas & water heating',6:'Billing & kWh',
              7:'Equipment config',8:'Equipment specs',9:'Equipment condition',
              10:'Electrical infra',11:'Outage impact',12:'Water reclaim',
              13:'Site dimensions',14:'Solar surfaces',15:'EV charging'
            };
            return (() => {
              const sc = SECTION_COLORS[sec.id] || SECTION_COLORS.facility;
              return (
              <div key={sec.id} style={{
                marginBottom: 4, borderRadius: 12, overflow: 'hidden', transition: 'all 0.3s',
                background: isActive ? `${sc.color}08` : isDone ? 'rgba(99,102,241,0.04)' : 'transparent',
                border: isActive ? `1px solid ${sc.color}30` : isDone ? '1px solid rgba(99,102,241,0.18)' : '1px solid transparent',
              }}>
                <div style={{ padding: '10px 12px', display: 'flex', alignItems: 'center', gap: 8, opacity: isLocked ? 0.35 : 1 }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, flexShrink: 0,
                    background: isDone ? '#6366f1' : isActive ? sc.color : '#1e293b',
                    color: '#fff', fontWeight: 800,
                  }}>
                    {isDone ? <Check className="w-3.5 h-3.5 text-white" /> : <span>{sec.icon}</span>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center">
                      <span style={{ fontSize: 14, fontWeight: 700, color: isDone ? '#a5b4fc' : isActive ? '#fff' : '#475569' }}>{sec.label}</span>
                      <span style={{
                        fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 8,
                        background: isDone ? 'rgba(99,102,241,0.18)' : isActive ? `${sc.color}20` : 'rgba(30,41,59,0.5)',
                        color: isDone ? '#a5b4fc' : isActive ? sc.accent : '#475569',
                      }}>{doneCount}/{visCount}</span>
                    </div>
                    <div style={{ marginTop: 5, height: 4, borderRadius: 2, background: '#1e293b', overflow: 'hidden' }}>
                      <div style={{
                        height: '100%', borderRadius: 2, transition: 'width 0.5s',
                        width: `${secPct}%`,
                        background: isDone ? '#6366f1' : `linear-gradient(to right, ${sc.color}, ${sc.accent})`,
                      }} />
                    </div>
                  </div>
                </div>
                {isActive && (
                  <div className="px-3 pb-2.5">
                    {visibleQs.map(qn => {
                      const qDone = completedQuestions.has(qn) || activeQuestion > qn;
                      const qCurrent = activeQuestion === qn;
                      return (
                        <div key={qn}
                          onClick={() => {}}
                          style={{
                            display: 'flex', alignItems: 'center', gap: 6, padding: '4px 8px', marginLeft: 8,
                            borderRadius: 8, cursor: 'pointer',
                            background: qCurrent ? `${sc.color}10` : 'transparent',
                          }}>
                          <div style={{
                            width: 20, height: 20, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 10, fontWeight: 800, flexShrink: 0,
                            background: qDone ? '#6366f1' : qCurrent ? sc.color : '#1e293b',
                            color: '#fff',
                          }}>
                            {qDone ? <Check className="w-3 h-3 text-white" /> : qn}
                          </div>
                          <span style={{
                            fontSize: 12, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                            color: qDone ? '#475569' : qCurrent ? '#fff' : '#475569',
                            fontWeight: qCurrent ? 600 : 400,
                            textDecoration: qDone ? 'line-through' : 'none',
                          }}>{qLabels[qn] || `Q${qn}`}</span>
                          {qDone && <span style={{ fontSize: 10, color: '#6366f1', fontWeight: 700, flexShrink: 0 }}>✓</span>}
                        </div>
                      );
                    })}
                  </div>
                )}
                {isLocked && si > 0 && (() => {
                  const prevStart = sec.qs[0] - 3; // Previous section starts 3 questions before this one
                  const prevEnd = sec.qs[0] - 1;
                  if (activeQuestion >= prevStart && activeQuestion <= prevEnd) {
                    return <div style={{ padding: '0 12px 8px', fontSize: 12, color: '#475569', fontStyle: 'italic', marginLeft: 36 }}>Up next · {visCount} questions</div>;
                  }
                  return null;
                })()}
              </div>
              );
            })();
          })}
        </div>

      </div>

      {/* Right Panel - Questions */}
      <div className="col-span-2 flex flex-col items-center min-h-0 bg-black pt-16 relative">
        {/* Scrollable Questions Area */}
        <div id="questions-scroll-container" ref={scrollContainerRef} className="flex-1 min-h-0 overflow-y-auto w-full" style={{ overflowAnchor: 'auto' }}>
          <div className="pb-24 max-w-4xl mx-auto px-6">
            <p className="text-slate-300 mb-6 mt-2">Answer each question to unlock the next. <span className="text-slate-500">Scroll up anytime to change previous answers.</span></p>

            <SectionDivider activeQuestion={activeQuestion} completedQuestions={completedQuestions} icon="🏢" label="Facility Basics" sectionNum={1} totalSections={5} sectionId="facility" />

            {/* Question 1: Facility Type */}
            <QuestionSection activeQuestion={activeQuestion} questionRefs={questionRefs} questionNumber={1} title="Type of car wash facility?" info="Industry classification by how the vehicle interacts with wash machinery — determines equipment profile and energy baseline" isRequired>
              <div className="grid grid-cols-2 gap-3">
                {FACILITY_TYPES.map(type => (
                  <button key={type.id} onClick={() => setFacilityType(facilityType === type.id ? '' : type.id)}
                    style={{ padding: 14, borderRadius: 14, textAlign: 'left', position: 'relative', cursor: 'pointer', background: '#0f172a', border: facilityType === type.id ? '2px solid #6366f1' : '2px solid #1e293b', transition: 'all 0.15s' }}>
                    <div style={{ fontWeight: 700, marginBottom: 4, color: '#fff' }}>{type.title}</div>
                    <div style={{ fontSize: 12, color: '#94a3b8' }}>{type.desc}</div>
                    {facilityType === type.id && (
                      <div style={{ position: 'absolute', top: -8, right: -8, width: 22, height: 22, borderRadius: 11, background: '#6366f1', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(99,102,241,0.4)', zIndex: 2 }}>
                        <Check className="w-3.5 h-3.5 text-white" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </QuestionSection>

            {/* Question 2: Number of Tunnels/Bays */}

            {/* ═════ Q2: Facility Size (bays + tunnel) — MERGED ═════ */}
            <QuestionSection activeQuestion={activeQuestion} questionRefs={questionRefs} questionNumber={2} title="Facility size" isRequired canContinue={(() => {
              const isTunnelType = ['express', 'mini', 'fullService'].includes(facilityType);
              return !!bayCount && (!isTunnelType || !!tunnelLength);
            })()}>
              <div className="max-w-xl space-y-4">
                <div>
                  <span style={{ fontSize: 14, fontWeight: 600, color: '#e2e8f0', display: 'block', marginBottom: 12 }}>Number of {getBayLabel()}</span>
                  {facilityType === 'self' ? (
                    <div className="flex gap-2">
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => (
                        <button key={num} onClick={() => setBayCount(bayCount === num.toString() ? '' : num.toString())}
                          style={{ width: 56, padding: '14px 0', borderRadius: 14, textAlign: 'center', cursor: 'pointer', position: 'relative', background: '#0f172a', border: bayCount === num.toString() ? '2px solid #6366f1' : '2px solid #1e293b', transition: 'all 0.15s' }}>
                          <div style={{ fontSize: 20, fontWeight: 800, color: '#fff' }}>{num}</div>
                          {bayCount === num.toString() && (
                            <div style={{ position: 'absolute', top: -8, right: -8, width: 22, height: 22, borderRadius: 11, background: '#6366f1', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(99,102,241,0.4)', zIndex: 2 }}>
                              <Check className="w-3.5 h-3.5 text-white" />
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="flex items-center gap-4">
                      <div className="w-20 px-4 py-3 text-2xl font-bold text-indigo-400 text-center border-2 border-indigo-500 rounded-xl bg-slate-800">
                        1
                      </div>
                    </div>
                  )}
                </div>
                {['express', 'mini', 'fullService'].includes(facilityType) && (
                <div style={{ borderTop: '1px solid #1e293b', paddingTop: 14 }}>
                  <span style={{ fontSize: 14, fontWeight: 600, color: '#e2e8f0', display: 'block', marginBottom: 12 }}>Tunnel length</span>
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                    {[
                      { ft: 60, label: '60 ft', desc: 'Mini', forMini: true, forExpress: false },
                      { ft: 80, label: '80 ft', desc: 'Compact', forMini: true, forExpress: false },
                      { ft: 100, label: '100 ft', desc: 'Standard', forMini: false, forExpress: true },
                      { ft: 120, label: '120 ft', desc: 'Standard+', forMini: false, forExpress: true },
                      { ft: 140, label: '140 ft', desc: 'Long', forMini: false, forExpress: true },
                      { ft: 160, label: '160+ ft', desc: 'Mega', forMini: false, forExpress: true }
                    ].map(opt => {
                      const isMiniType = facilityType === 'mini';
                      const isEnabled = isMiniType ? opt.forMini : opt.forExpress;
                      const isSelected = tunnelLength === opt.ft.toString();
                      
                      return (
                        <button 
                          key={opt.ft} 
                          onClick={() => isEnabled && setTunnelLength(tunnelLength === opt.ft.toString() ? '' : opt.ft.toString())}
                          disabled={!isEnabled}
                          style={{ padding: '12px 4px', borderRadius: 14, textAlign: 'center', position: 'relative', cursor: isEnabled ? 'pointer' : 'not-allowed', background: '#0f172a', border: !isEnabled ? '1px solid #1e293b' : isSelected ? '2px solid #6366f1' : '2px solid #1e293b', opacity: isEnabled ? 1 : 0.35, transition: 'all 0.15s' }}>
                          <div style={{ fontSize: 16, fontWeight: 800, color: '#fff' }}>{opt.ft === 160 ? '160+' : opt.ft}</div>
                          <div style={{ fontSize: 11, color: '#94a3b8' }}>ft</div>
                          {isSelected && (
                            <div style={{ position: 'absolute', top: -8, right: -8, width: 22, height: 22, borderRadius: 11, background: '#6366f1', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(99,102,241,0.4)', zIndex: 2 }}>
                              <Check className="w-3.5 h-3.5 text-white" />
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
                )}
              </div>
            </QuestionSection>

            {/* ═════ Q3: Operating Schedule (hours+days+vehicles) — MERGED ═════ */}
            <QuestionSection activeQuestion={activeQuestion} questionRefs={questionRefs} questionNumber={3} title="Operating schedule" isRequired canContinue={!!(operatingHours && daysPerWeek && dailyVehicles)}>
              <div className="max-w-2xl" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {/* Hours per day */}
                <div>
                  <span style={{ fontSize: 14, fontWeight: 600, color: '#e2e8f0', display: 'block', marginBottom: 12 }}>Hours open per day</span>
                  <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
                    {[8, 10, 12, 14, 16, 18, 20, 24].map(hrs => {
                      const isSelected = operatingHours === hrs.toString();
                      return (
                        <button key={hrs} onClick={() => setOperatingHours(isSelected ? '' : hrs.toString())}
                          style={{ padding: '12px 4px', borderRadius: 14, textAlign: 'center', position: 'relative', cursor: 'pointer', background: '#0f172a', border: isSelected ? '2px solid #6366f1' : '2px solid #1e293b', transition: 'all 0.15s' }}>
                          <div style={{ fontSize: 16, fontWeight: 800, color: '#fff' }}>{hrs}</div>
                          {isSelected && (
                            <div style={{ position: 'absolute', top: -8, right: -8, width: 22, height: 22, borderRadius: 11, background: '#6366f1', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(99,102,241,0.4)', zIndex: 2 }}>
                              <Check className="w-3.5 h-3.5 text-white" />
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div style={{ height: 1, background: '#1e293b' }} />

                {/* Days per week */}
                <div>
                  <span style={{ fontSize: 14, fontWeight: 600, color: '#e2e8f0', display: 'block', marginBottom: 12 }}>Days open per week</span>
                  <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
                    {[5, 6, 7].map(d => {
                      const isSelected = daysPerWeek === d.toString();
                      return (
                        <button key={d} onClick={() => setDaysPerWeek(isSelected ? '' : d.toString())}
                          style={{ padding: '12px 4px', borderRadius: 14, textAlign: 'center', position: 'relative', cursor: 'pointer', background: '#0f172a', border: isSelected ? '2px solid #6366f1' : '2px solid #1e293b', transition: 'all 0.15s' }}>
                          <div style={{ fontSize: 16, fontWeight: 800, color: '#fff' }}>{d}</div>
                          {isSelected && (
                            <div style={{ position: 'absolute', top: -8, right: -8, width: 22, height: 22, borderRadius: 11, background: '#6366f1', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(99,102,241,0.4)', zIndex: 2 }}>
                              <Check className="w-3.5 h-3.5 text-white" />
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div style={{ height: 1, background: '#1e293b' }} />

                {/* Vehicles per day — slider */}
                <div>
                  <span style={{ fontSize: 14, fontWeight: 600, color: '#e2e8f0', display: 'block', marginBottom: 8 }}>Vehicles washed per day</span>
                  <div className="flex items-center justify-center mb-3">
                    <span className="inline-block px-6 py-3 bg-slate-800 border-2 border-indigo-500 rounded-2xl text-2xl font-bold text-indigo-300">
                      <span id="vehicles-display">{dailyVehicles || '—'}</span>
                    </span>
                  </div>
                  <SmoothSlider min={0} max={400} step={1} value={dailyVehicles || 150}
                    onChange={v => setDailyVehicles(parseInt(v) || 150)}
                    label="Average Vehicles Washed per Day"
                    displayId="vehicles-display"
                    color="#6366f1" />
                </div>
              </div>
            </QuestionSection>

            <SectionDivider activeQuestion={activeQuestion} completedQuestions={completedQuestions} icon="⚡" label="Energy & Utility" sectionNum={2} totalSections={5} sectionId="energy" />

            <QuestionSection activeQuestion={activeQuestion} questionRefs={questionRefs} questionNumber={4} title="Electric bill data" isRequired>
              <div className="max-w-2xl">
                {/* Segmented toggle: Use Estimate | Upload Bill */}
                <div style={{ display: 'flex', borderRadius: 10, overflow: 'hidden', border: '1px solid #334155', marginBottom: 14 }}>
                  {[
                    { id: 'auto', label: 'Use Estimate' },
                    { id: 'upload', label: 'Upload Bill' }
                  ].map((o, i) => (
                    <button key={o.id} onClick={() => setBillInputMode(o.id)}
                      style={{ flex: 1, padding: '14px 8px', fontSize: 16, fontWeight: 800, border: 'none', cursor: 'pointer',
                        borderRight: i === 0 ? '1px solid #334155' : 'none',
                        background: billInputMode === o.id ? 'rgba(99,102,241,0.3)' : 'transparent',
                        color: billInputMode === o.id ? '#fff' : '#64748b', transition: 'all 0.15s' }}>
                      {o.label}
                    </button>
                  ))}
                </div>

                {/* Use Estimate — locked display */}
                {billInputMode === 'auto' && (
                  <div style={{ padding: '14px 18px', borderRadius: 10, background: '#0f172a', border: '1px solid #1e293b', display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 24, fontWeight: 800, color: '#c4b5fd' }}>$</span>
                    <span style={{ fontSize: 24, fontWeight: 800, color: '#fff' }}>{parseInt(monthlyElecBill).toLocaleString()}</span>
                    <span style={{ fontSize: 13, color: '#94a3b8', fontWeight: 600 }}>/month</span>
                    <div style={{ flex: 1 }} />
                    <span style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5 }}>From Step 1</span>
                  </div>
                )}

                {/* ═══ MODE B: Upload Bill ═══ */}
                {billInputMode === 'upload' && (
                  <div style={{ borderRadius: 14, border: '1.5px solid rgba(99,102,241,0.18)', background: 'rgba(99,102,241,0.02)' }}>
                    {!billUploadData ? (
                      <label
                        onDragOver={(e) => { e.preventDefault(); e.currentTarget.style.borderColor = '#6366f1'; e.currentTarget.style.background = 'rgba(99,102,241,0.06)'; }}
                        onDragLeave={(e) => { e.currentTarget.style.borderColor = 'transparent'; e.currentTarget.style.background = 'transparent'; }}
                        onDrop={(e) => {
                          e.preventDefault();
                          e.currentTarget.style.borderColor = 'transparent';
                          e.currentTarget.style.background = 'transparent';
                          const file = e.dataTransfer.files?.[0];
                          if (!file) return;
                          if (setBillUploadData) {
                            setBillUploadData({ file, fileName: file.name, source: 'upload', verified: false, extractedData: null, parsing: true });
                            setTimeout(() => { setBillUploadData(prev => prev ? { ...prev, parsing: false, needsReview: true, extractedData: null } : null); }, 2000);
                          }
                        }}
                        style={{
                          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10,
                          padding: '32px 20px', borderRadius: 14, cursor: 'pointer', transition: 'all 0.2s',
                          border: '2.5px dashed rgba(99,102,241,0.15)', background: 'transparent', margin: 3,
                        }}>
                        <input type="file" accept="image/*,.pdf" style={{ display: 'none' }} onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          if (setBillUploadData) {
                            setBillUploadData({ file, fileName: file.name, source: 'upload', verified: false, extractedData: null, parsing: true });
                            setTimeout(() => { setBillUploadData(prev => prev ? { ...prev, parsing: false, needsReview: true, extractedData: null } : null); }, 2000);
                          }
                        }} />
                        <div style={{ width: 52, height: 52, borderRadius: 14, background: 'rgba(99,102,241,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Upload className="w-7 h-7 text-indigo-400" />
                        </div>
                        <div style={{ textAlign: 'center' }}>
                          <div style={{ fontSize: 16, fontWeight: 700, color: '#e2e8f0', marginBottom: 4 }}>Drop or upload your utility bill</div>
                          <div style={{ fontSize: 12, color: '#94a3b8' }}>Photo, screenshot, or PDF</div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                          <span style={{ fontSize: 12, padding: '4px 12px', borderRadius: 6, background: 'rgba(99,102,241,0.08)', color: '#a5b4fc', fontWeight: 600, border: '1px solid rgba(99,102,241,0.18)' }}>Browse files</span>
                          <span style={{ fontSize: 11, color: '#475569' }}>or drag & drop</span>
                        </div>
                      </label>
                    ) : billUploadData.parsing ? (
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10, padding: '32px 20px' }}>
                        <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
                        <span style={{ fontSize: 14, fontWeight: 600, color: '#a5b4fc' }}>Analyzing your bill...</span>
                      </div>
                    ) : (
                      <div style={{ padding: '20px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 14 }}>
                          <div style={{ width: 44, height: 44, borderRadius: 10, background: 'rgba(99,102,241,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <CheckCircle2 className="w-6 h-6 text-indigo-400" />
                          </div>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 14, fontWeight: 700, color: '#a5b4fc' }}>Bill Uploaded</div>
                            <div style={{ fontSize: 12, color: '#94a3b8' }}>{billUploadData.fileName}</div>
                          </div>
                          <button onClick={() => setBillUploadData && setBillUploadData(null)}
                            style={{ padding: '6px 12px', borderRadius: 8, fontSize: 11, fontWeight: 600, cursor: 'pointer', color: '#94a3b8', background: 'rgba(255,255,255,0.05)', border: '1px solid #334155' }}>
                            Replace
                          </button>
                        </div>
                        {/* OCR pending notice */}
                        <div style={{ padding: '10px 14px', borderRadius: 10, background: 'rgba(99,102,241,0.04)', border: '1px solid rgba(99,102,241,0.15)', fontSize: 12, color: '#a5b4fc', display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                          <span>Auto-extraction coming soon. Please enter the bill amount below for now.</span>
                        </div>
                        {/* Temporary manual override for uploaded bills */}
                        <div style={{ fontSize: 14, fontWeight: 600, color: '#94a3b8', marginBottom: 6 }}>Enter amount from your bill:</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <span style={{ fontSize: 24, fontWeight: 800, color: '#a5b4fc' }}>$</span>
                          <input
                            type="number"
                            placeholder="Enter from bill"
                            value={monthlyBillManuallyEdited ? monthlyElecBill : ''}
                            onChange={e => {
                              const v = e.target.value;
                              setMonthlyElecBill(v);
                              setMonthlyBillManuallyEdited(true);
                              if (parseInt(v) >= 500) {
                                setParentAnnualBill(Math.min(300000, Math.max(6000, parseInt(v) * 12)));
                              }
                            }}
                            style={{ width: 160, padding: '10px 14px', fontSize: 18, fontWeight: 700, borderRadius: 10, border: '2px solid rgba(99,102,241,0.15)', background: 'rgba(255,255,255,0.05)', color: 'white', outline: 'none', fontFamily: 'inherit' }}
                          />
                          <span style={{ fontSize: 15, color: '#94a3b8', fontWeight: 600 }}>/month</span>
                        </div>
                      </div>
                    )}
                  </div>
                )}

              </div>
            </QuestionSection>

            {/* ═════ Q5: Gas & Water Heating — MERGED ═════ */}
            <QuestionSection activeQuestion={activeQuestion} questionRefs={questionRefs} questionNumber={5} title="Gas & water heating" isRequired canContinue={!!(gasLine && waterHeater)}>
              <div className="max-w-2xl" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {/* Gas line — true toggle switch, default YES */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', background: '#0f172a', border: '1px solid #1e293b', borderRadius: 14 }}>
                  <span style={{ fontSize: 14, fontWeight: 600, color: '#e2e8f0' }}>Natural gas line?</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: gasLine === 'yes' ? '#64748b' : '#a5b4fc' }}>No</span>
                    <button onClick={() => setGasLine(gasLine === 'yes' ? 'no' : 'yes')}
                      style={{ width: 56, height: 30, borderRadius: 15, background: gasLine === 'yes' ? '#6366f1' : '#334155', border: 'none', cursor: 'pointer', position: 'relative', transition: 'background 0.2s' }}>
                      <div style={{ width: 24, height: 24, borderRadius: 12, background: '#fff', position: 'absolute', top: 3, left: gasLine === 'yes' ? 29 : 3, transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.3)' }} />
                    </button>
                    <span style={{ fontSize: 13, fontWeight: 700, color: gasLine === 'yes' ? '#a5b4fc' : '#64748b' }}>Yes</span>
                  </div>
                </div>

                {/* Water heater — compact buttons with emoji + name only */}
                <div>
                  <span style={{ fontSize: 14, fontWeight: 600, color: '#94a3b8', display: 'block', marginBottom: 8 }}>Water heater type</span>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 10 }}>
                    {[
                      { id: 'gas', emoji: '🔥', title: 'Gas', disabled: gasLine === 'no' },
                      { id: 'electric', emoji: '⚡', title: 'Electric', disabled: false },
                      { id: 'propane', emoji: '🛢️', title: 'Propane', disabled: false },
                      { id: 'none', emoji: '❄️', title: 'None', disabled: false }
                    ].map(opt => {
                      const isSelected = waterHeater === opt.id;
                      return (
                        <button key={opt.id} onClick={() => !opt.disabled && setWaterHeater(waterHeater === opt.id ? '' : opt.id)} disabled={opt.disabled}
                          style={{ padding: 16, borderRadius: 10, textAlign: 'center', cursor: opt.disabled ? 'not-allowed' : 'pointer', position: 'relative', background: isSelected ? 'rgba(99,102,241,0.12)' : '#0f172a', border: isSelected ? '2px solid #6366f1' : '1px solid #1e293b', opacity: opt.disabled ? 0.3 : 1, transition: 'all 0.15s' }}>
                          <div style={{ fontSize: 20, marginBottom: 2 }}>{opt.emoji}</div>
                          <div style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>{opt.title}</div>
                          {isSelected && (
                            <div style={{ position: 'absolute', top: -8, right: -8, width: 22, height: 22, borderRadius: 11, background: '#6366f1', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(99,102,241,0.4)', zIndex: 2 }}>
                              <Check className="w-3.5 h-3.5 text-white" />
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </QuestionSection>

            {/* ═════ Q6: Utility Billing & Usage — MERGED ═════ */}
            <QuestionSection activeQuestion={activeQuestion} questionRefs={questionRefs} questionNumber={6} title="Utility billing & usage" isRequired>
              <div className="max-w-2xl" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

                {/* ── Billing Type — individual tile cards with subheading ── */}
                <div>
                  <span style={{ fontSize: 14, fontWeight: 600, color: '#e2e8f0', display: 'block', marginBottom: 12 }}>Billing type</span>
                  <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                    {[
                      { id: 'flat', label: 'Flat', sub: 'Same ¢/kWh all day' },
                      { id: 'tou', label: 'TOU', sub: 'Peak/off-peak rates' },
                      { id: 'demand', label: 'Demand', sub: '$/kW peak charge' },
                      { id: 'tou-demand', label: 'TOU+Demand', sub: 'Best for arbitrage' },
                      { id: 'unknown', label: "Don't Know", sub: "We'll estimate" },
                    ].map(o => {
                      const isSel = utilityBillingType === o.id;
                      const isUnknown = o.id === 'unknown';
                      return (
                        <button key={o.id} onClick={() => setUtilityBillingType(isSel ? '' : o.id)}
                          style={{ padding: '12px 4px', borderRadius: 14, textAlign: 'center', position: 'relative', cursor: 'pointer',
                            background: isSel ? (isUnknown ? 'rgba(99,102,241,0.15)' : 'rgba(99,102,241,0.12)') : '#0f172a',
                            border: isSel ? (isUnknown ? '2px solid #6366f1' : '2px solid #6366f1') : isUnknown ? '2px dashed rgba(99,102,241,0.12)' : '2px solid #1e293b',
                            transition: 'all 0.15s' }}>
                          <div style={{ fontSize: 14, fontWeight: 800, color: isUnknown ? '#6366f1' : '#fff' }}>{o.label}</div>
                          <div style={{ fontSize: 10, color: isSel ? (isUnknown ? '#a5b4fc' : '#c7d2fe') : '#64748b', marginTop: 2 }}>{o.sub}</div>
                          {isSel && (
                            <div style={{ position: 'absolute', top: -8, right: -8, width: 22, height: 22, borderRadius: 11, background: isUnknown ? '#6366f1' : '#6366f1', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 2px 8px ${isUnknown ? 'rgba(99,102,241,0.2)' : 'rgba(99,102,241,0.4)'}`, zIndex: 2 }}>
                              <Check className="w-3.5 h-3.5 text-white" />
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* ── Demand Rate — conditional, only for demand billing ── */}
                {(utilityBillingType === 'demand' || utilityBillingType === 'tou-demand') && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 16px', background: '#0f172a', border: '1px solid #1e293b', borderRadius: 10 }}>
                    <span style={{ fontSize: 14, fontWeight: 600, color: '#94a3b8', flex: 1 }}>Demand rate ($/kW)</span>
                    <input type="number" value={demandRate || ''} onChange={e => setDemandRate(e.target.value ? parseFloat(e.target.value) : null)}
                      placeholder="e.g. 15"
                      style={{ width: 80, padding: '6px 10px', background: '#1e293b', border: '2px solid #6366f1', borderRadius: 8, color: '#c7d2fe', fontSize: 14, fontWeight: 700, textAlign: 'center', outline: 'none' }} />
                    <div className="group" style={{ position: 'relative' }}>
                      <div style={{ width: 16, height: 16, borderRadius: '50%', background: '#1e293b', border: '1px solid #334155', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: '#64748b', cursor: 'help' }}>i</div>
                      <div style={{ position: 'absolute', bottom: '100%', right: 0, marginBottom: 6, width: 200, padding: '8px 10px', background: '#1e293b', border: '1px solid #334155', borderRadius: 8, fontSize: 11, color: '#cbd5e1', lineHeight: 1.5, opacity: 0, pointerEvents: 'none', zIndex: 50 }} className="group-hover:!opacity-100">Check your bill for "Demand Charge" or "kW Charge" — often 30-50% of commercial bills.</div>
                    </div>
                  </div>
                )}

                <div style={{ height: 1, background: '#1e293b' }} />

                {/* ── Monthly kWh ── */}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                    <span style={{ fontSize: 14, fontWeight: 600, color: '#94a3b8' }}>Monthly kWh</span>
                    <button onClick={() => {
                      setKwhUnknown(!kwhUnknown);
                      if (!kwhUnknown) setActualMonthlyKWh('');
                    }}
                      style={{ padding: '10px 16px', borderRadius: 8, fontSize: 14, fontWeight: 700, cursor: 'pointer',
                        background: kwhUnknown ? 'rgba(99,102,241,0.15)' : '#0f172a',
                        border: kwhUnknown ? '2px solid #6366f1' : '2px dashed rgba(99,102,241,0.12)',
                        color: kwhUnknown ? '#a5b4fc' : '#6366f1', transition: 'all 0.15s' }}>
                      Don't Know
                    </button>
                  </div>
                  {!kwhUnknown && (
                    <>
                      <div className="flex items-center justify-center mb-3">
                        <span className="inline-block px-5 py-2 bg-slate-800 border-2 border-indigo-500 rounded-xl" style={{ fontSize: 20, fontWeight: 800, color: '#a5b4fc' }}>
                          <span id="slider-display-q6">{actualMonthlyKWh ? parseInt(actualMonthlyKWh).toLocaleString() : '--'}</span>
                          <span style={{ fontSize: 12, fontWeight: 400, color: '#94a3b8', marginLeft: 6 }}>kWh/mo</span>
                        </span>
                      </div>
                      <SmoothSlider
                        min={1000} max={100000} step={100}
                        value={actualMonthlyKWh ? parseInt(actualMonthlyKWh) : 15000}
                        onChange={v => {
                          setActualMonthlyKWh(String(v));
                          setKwhUnknown(false);
                        }}
                        label="Monthly kWh" displayId="slider-display-q6"
                        formatDisplay={v => parseInt(v).toLocaleString()}
                        color="#6366f1"
                      />
                    </>
                  )}
                  {kwhUnknown && (() => {
                    const defaults = getCurrentDefaults();
                    const hrs = parseInt(operatingHours) || 14;
                    const days = parseInt(daysPerWeek) || 7;
                    const hrsPerMonth = hrs * days * 4.33;
                    const dKW = (defaults.dryers?.count || 12) * (defaults.dryers?.hp || 10) * 0.746;
                    const pKW = (defaults.pumps?.count || 3) * (defaults.pumps?.hp || 20) * 0.746;
                    const cKW = (defaults.conveyor?.hp || 15) * 0.746;
                    const vKW = (defaults.vacuums?.count || 12) * (defaults.vacuums?.turbineHP || 5) * 0.746;
                    const bKW = (defaults.brushMotors?.count || 10) * 3 * 0.746;
                    const aKW = (defaults.airCompressor?.hp || 10) * 0.746;
                    const equipKW = (dKW + pKW + cKW + vKW + bKW + aKW) * 0.65;
                    const facilityKW = equipKW + 15;
                    const estMonthly = Math.round(facilityKW * hrsPerMonth);
                    const rate = locationData?.electric?.avgRate || 0.14;
                    const monthlyCost = Math.round(estMonthly * rate);
                    return (
                      <div style={{ padding: 16, borderRadius: 14, background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.1)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                          <span style={{ fontSize: 13, fontWeight: 600, color: '#a5b4fc' }}>Estimated from your facility profile</span>
                          <span style={{ fontSize: 12, fontWeight: 700, color: '#94a3b8' }}>Site load: ~{Math.round(facilityKW)} kW</span>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 10 }}>
                          <div style={{ padding: '10px 14px', borderRadius: 10, background: 'rgba(0,0,0,0.25)', border: '1px solid #1e293b' }}>
                            <div style={{ fontSize: 10, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 3 }}>Monthly</div>
                            <div style={{ fontSize: 22, fontWeight: 900, color: '#a5b4fc' }}>{estMonthly.toLocaleString()} <span style={{ fontSize: 12, fontWeight: 400, color: '#94a3b8' }}>kWh</span></div>
                            <div style={{ fontSize: 13, fontWeight: 700, color: '#6366f1', marginTop: 2 }}>~${monthlyCost.toLocaleString()}/mo <span style={{ fontSize: 10, fontWeight: 400, color: '#64748b' }}>@ ${rate}/kWh</span></div>
                          </div>
                          <div style={{ padding: '10px 14px', borderRadius: 10, background: 'rgba(0,0,0,0.25)', border: '1px solid #1e293b' }}>
                            <div style={{ fontSize: 10, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 3 }}>Annual</div>
                            <div style={{ fontSize: 22, fontWeight: 900, color: '#a5b4fc' }}>{(estMonthly * 12).toLocaleString()} <span style={{ fontSize: 12, fontWeight: 400, color: '#94a3b8' }}>kWh</span></div>
                            <div style={{ fontSize: 13, fontWeight: 700, color: '#6366f1', marginTop: 2 }}>~${(monthlyCost * 12).toLocaleString()}/yr</div>
                          </div>
                        </div>
                        <div className="group" style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', gap: 4, cursor: 'help' }}>
                          <span style={{ fontSize: 11, color: '#94a3b8' }}>View breakdown</span>
                          <div style={{ width: 14, height: 14, borderRadius: '50%', background: '#1e293b', border: '1px solid #334155', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 700, color: '#64748b' }}>i</div>
                          <div style={{ position: 'absolute', bottom: '100%', left: 0, marginBottom: 6, width: 280, padding: '10px 12px', background: '#1e293b', border: '1px solid #334155', borderRadius: 10, fontSize: 11, color: '#cbd5e1', lineHeight: 1.8, opacity: 0, pointerEvents: 'none', zIndex: 50 }} className="group-hover:!opacity-100">
                            Dryers: {Math.round(dKW)} kW · Pumps: {Math.round(pKW)} kW · Conveyor: {Math.round(cKW)} kW · Vacuums: {Math.round(vKW)} kW · Brushes: {Math.round(bKW)} kW · Air comp: {Math.round(aKW)} kW · Baseline: 15 kW · 65% duty cycle<br/>
                            <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>Refined as you complete Q7–Q9</span>
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </div>

              </div>
            </QuestionSection>

            <SectionDivider activeQuestion={activeQuestion} completedQuestions={completedQuestions} icon="⚙️" label="Equipment" sectionNum={3} totalSections={5} sectionId="equipment" />

            <QuestionSection activeQuestion={activeQuestion} questionRefs={questionRefs} questionNumber={7} title="Equipment Configuration" isRequired>
              <div className="max-w-2xl">
                {/* ── Core equipment — one line ── */}
                <div style={{ padding: '8px 14px', borderRadius: 10, background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.18)', display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, fontSize: 12, color: '#a5b4fc', fontWeight: 600 }}>
                  <span>✓</span>
                  <span>{[selectedEquipment.has('pumps') && 'Pumps', selectedEquipment.has('dryers') && 'Dryers', selectedEquipment.has('conveyor') && 'Conveyor', selectedEquipment.has('vacuums') && 'Vacuums', selectedEquipment.has('airCompressor') && 'Air Comp', selectedEquipment.has('brushMotors') && 'Brushes'].filter(Boolean).join(' · ')} — auto-included</span>
                </div>

                {/* ── Optional Add-ons — Progressive Reveal ── */}
                {(() => {
                  const visibleOptional = [
                    { id: 'lighting', name: 'Tunnel / Site Lighting', desc: 'Interior + exterior LED', emoji: '💡' },
                    { id: 'pos', name: 'POS / Payment Kiosks', desc: 'Entry terminals', emoji: '💳' },
                    ...(selectedEquipment.has('dryers') ? [{ id: 'heatedDryers', name: 'Heated Dryer Elements', desc: 'Resistive heating for faster drying', emoji: '🔥' }] : []),
                    { id: 'signage', name: 'Exterior Signage', desc: 'Illuminated signs/displays', emoji: '✨' },
                    { id: 'officeFacilities', name: 'Office / Amenities', desc: 'Break room, security, etc.', emoji: '🏢' },
                    { id: 'climateControl', name: 'HVAC / Climate', desc: 'Equipment room + lobby', emoji: '❄️' },
                    { id: 'premiumServices', name: 'Premium Services', desc: 'Ceramic coat, tire shine', emoji: '🏆' },
                  ];
                  // Progressive: find first unanswered index
                  const firstUnanswered = visibleOptional.findIndex(i => !optionalAnswered.has(i.id));
                  const activeUpTo = firstUnanswered === -1 ? visibleOptional.length : firstUnanswered;

                  return (
                    <>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                        <span style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: 1 }}>Optional Add-ons</span>
                        <span style={{ fontSize: 11, color: '#475569' }}>{activeUpTo} of {visibleOptional.length}</span>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {visibleOptional.map((item, idx) => {
                          const isOn = selectedEquipment.has(item.id);
                          const isAnswered = optionalAnswered.has(item.id);
                          const isCurrent = idx === activeUpTo;
                          const isLocked = idx > activeUpTo;
                          const hasSubOptions = ['lighting', 'pos', 'heatedDryers', 'signage', 'officeFacilities', 'climateControl', 'premiumServices'].includes(item.id);

                          const handleAdd = () => {
                            setSelectedEquipment(prev => { const s = new Set(prev); s.add(item.id); return s; });
                            setOptionalAnswered(prev => new Set([...prev, item.id]));
                            if (item.id === 'pos' && (!kioskCount || kioskCount === '0')) setKioskCount('2');
                            if (item.id === 'lighting' && !lightingTier) setLightingTier('basic');
                            if (item.id === 'signage' && !signageTier) setSignageTier('basic');
                            if (item.id === 'officeFacilities' && officeFacilities.size === 0) setOfficeFacilities(new Set(['office', 'bathrooms']));
                            if (item.id === 'climateControl' && !siteFeatures?.climateControl) setSiteFeatures(prev => ({...prev, climateControl: 'standard'}));
                            if (item.id === 'premiumServices' && !siteFeatures?.premiumServices) setSiteFeatures(prev => ({...prev, premiumServices: 'basic'}));
                            if (hasSubOptions) setEquipPopup(item.id);
                          };

                          const handleRemove = () => {
                            setSelectedEquipment(prev => { const s = new Set(prev); s.delete(item.id); return s; });
                            setOptionalAnswered(prev => new Set([...prev, item.id]));
                            if (item.id === 'climateControl') setSiteFeatures(prev => ({...prev, climateControl: 'minimal'}));
                            if (item.id === 'premiumServices') setSiteFeatures(prev => ({...prev, premiumServices: 'none'}));
                          };

                          const handleSkip = (e) => {
                            e.stopPropagation();
                            setOptionalAnswered(prev => new Set([...prev, item.id]));
                          };

                          const subSummary = isOn ? (
                            item.id === 'lighting' ? (lightingTier === 'premium' ? 'Premium + Effects' : lightingTier === 'enhanced' ? 'Enhanced LED' : 'Basic LED') :
                            item.id === 'pos' ? `${kioskCount || 2} kiosks` :
                            item.id === 'signage' ? (signageTier === 'signature' ? 'Signature / Digital' : signageTier === 'premium' ? 'Premium LED' : 'Basic') :
                            item.id === 'officeFacilities' ? `${officeFacilities.size} selected` :
                            item.id === 'climateControl' ? (siteFeatures?.climateControl === 'full' ? 'Full HVAC' : 'Standard') :
                            item.id === 'premiumServices' ? (siteFeatures?.premiumServices === 'full' ? 'Full Service' : 'Basic') :
                            item.id === 'heatedDryers' ? 'High energy' : null
                          ) : null;

                          // Locked — dimmed placeholder
                          if (isLocked) {
                            return (
                              <div key={item.id} style={{
                                padding: '14px 20px', borderRadius: 16,
                                background: '#0f172a', border: '2px solid #1e293b',
                                opacity: 0.35, transition: 'all 0.3s' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                                  <span style={{ fontSize: 28, flexShrink: 0, filter: 'grayscale(1)' }}>{item.emoji}</span>
                                  <div style={{ flex: 1 }}>
                                    <div style={{ fontSize: 15, fontWeight: 700, color: '#64748b' }}>{item.name}</div>
                                  </div>
                                  <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#1e293b', flexShrink: 0 }} />
                                </div>
                              </div>
                            );
                          }

                          // Current (active frontier) — full card with Add + Skip
                          if (isCurrent) {
                            return (
                              <div key={item.id} style={{
                                padding: '18px 20px', borderRadius: 16, outline: 'none',
                                background: '#0f172a', border: '2px solid #6366f1',
                                boxShadow: '0 0 20px rgba(99,102,241,0.12)',
                                transition: 'all 0.3s' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                                  <span style={{ fontSize: 28, flexShrink: 0 }}>{item.emoji}</span>
                                  <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ fontSize: 15, fontWeight: 700, color: '#fff', lineHeight: 1.3 }}>{item.name}</div>
                                    <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>{item.desc}</div>
                                  </div>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                                    <button onClick={handleSkip}
                                      style={{ padding: '6px 14px', borderRadius: 8, fontSize: 12, fontWeight: 700, background: 'transparent', color: '#64748b', border: '1px solid #334155', cursor: 'pointer', outline: 'none' }}>
                                      Skip
                                    </button>
                                    <button onClick={handleAdd}
                                      style={{ padding: '6px 14px', borderRadius: 8, fontSize: 12, fontWeight: 700, background: 'rgba(99,102,241,0.12)', color: '#a5b4fc', border: '1px solid rgba(99,102,241,0.2)', cursor: 'pointer', outline: 'none' }}>
                                      Add
                                    </button>
                                  </div>
                                </div>
                              </div>
                            );
                          }

                          // Already answered — show compact result
                          return (
                            <div key={item.id} onClick={isOn ? handleRemove : handleAdd} style={{
                              padding: '14px 20px', cursor: 'pointer', transition: 'all 0.2s', borderRadius: 16, outline: 'none',
                              background: isOn ? 'linear-gradient(135deg, rgba(99,102,241,0.12), rgba(99,102,241,0.02))' : '#0f172a',
                              border: isOn ? '2px solid rgba(99,102,241,0.2)' : '2px solid #1e293b',
                            }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                                <span style={{ fontSize: 22, flexShrink: 0, filter: isOn ? 'none' : 'grayscale(0.5)' }}>{item.emoji}</span>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                  <div style={{ fontSize: 14, fontWeight: 700, color: isOn ? '#fff' : '#64748b', lineHeight: 1.3 }}>{item.name}</div>
                                  {isOn && subSummary && (
                                    <div style={{ fontSize: 11, color: '#a5b4fc', fontWeight: 600, marginTop: 2 }}>{'✓ ' + subSummary}</div>
                                  )}
                                  {!isOn && isAnswered && (
                                    <div style={{ fontSize: 11, color: '#475569', fontWeight: 600, marginTop: 2 }}>Skipped</div>
                                  )}
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                                  {isOn && hasSubOptions && (
                                    <button onClick={(e) => { e.stopPropagation(); setEquipPopup(item.id); }}
                                      style={{ padding: '4px 12px', borderRadius: 8, fontSize: 11, fontWeight: 700, background: 'rgba(99,102,241,0.12)', color: '#a5b4fc', border: '1px solid rgba(99,102,241,0.3)', cursor: 'pointer', outline: 'none' }}>
                                      Edit
                                    </button>
                                  )}
                                  <div style={{
                                    width: 24, height: 24, borderRadius: '50%', flexShrink: 0,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontSize: 12, fontWeight: 800, color: '#fff',
                                    background: isOn ? '#6366f1' : '#334155', transition: 'all 0.2s',
                                  }}>{isOn ? '✓' : ''}</div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* ═══ MODAL POPUP for sub-options ═══ */}
                      {equipPopup && (() => {
                        const popupItem = visibleOptional.find(i => i.id === equipPopup);
                        if (!popupItem) return null;
                        return (
                          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }} onClick={() => setEquipPopup(null)}>
                            <div onClick={e => e.stopPropagation()} style={{ background: '#1e293b', border: '1px solid #475569', borderRadius: 20, padding: '28px 32px', width: 420, maxWidth: '90vw', boxShadow: '0 24px 64px rgba(0,0,0,0.6)' }}>
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                  <span style={{ fontSize: 32 }}>{popupItem.emoji}</span>
                                  <div>
                                    <div style={{ fontSize: 18, fontWeight: 800, color: '#fff' }}>{popupItem.name}</div>
                                    <div style={{ fontSize: 13, color: '#94a3b8' }}>{popupItem.desc}</div>
                                  </div>
                                </div>
                                <button onClick={() => setEquipPopup(null)} style={{ width: 32, height: 32, borderRadius: '50%', background: '#334155', border: 'none', color: '#cbd5e1', fontSize: 18, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
                              </div>

                              {equipPopup === 'lighting' && (<div><div style={{ fontSize: 14, fontWeight: 700, color: '#cbd5e1', marginBottom: 12 }}>Select Lighting Type:</div><div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>{[{ val: 'basic', label: 'Basic LED', desc: 'Standard tunnel & site lighting' }, { val: 'enhanced', label: 'Enhanced LED', desc: 'Color-changing, brighter output' }, { val: 'premium', label: 'Premium + Effects', desc: 'Show lighting, underglow, spotlights' }].map(o => (<button key={o.val} onClick={() => setLightingTier(o.val)} style={{ padding: '14px 18px', borderRadius: 14, textAlign: 'left', cursor: 'pointer', transition: 'all 0.15s', position: 'relative', background: '#0f172a', border: lightingTier === o.val ? '2px solid #6366f1' : '2px solid #1e293b' }}><div style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>{o.label}</div><div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>{o.desc}</div>{lightingTier === o.val && (<div style={{ position: 'absolute', top: -8, right: -8, width: 22, height: 22, borderRadius: 11, background: '#6366f1', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(99,102,241,0.4)', zIndex: 2 }}><Check className="w-3.5 h-3.5 text-white" /></div>)}</button>))}</div></div>)}

                              {equipPopup === 'pos' && (<div><div style={{ fontSize: 14, fontWeight: 700, color: '#cbd5e1', marginBottom: 16 }}>Number of Payment Kiosks:</div><div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 20 }}><button onClick={() => setKioskCount(prev => Math.max(1, parseInt(prev || 1) - 1).toString())} style={{ width: 52, height: 52, borderRadius: 14, border: '2px solid #334155', background: '#0f172a', color: '#fff', fontSize: 28, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>−</button><span style={{ fontSize: 40, fontWeight: 900, color: '#a5b4fc', minWidth: 60, textAlign: 'center' }}>{kioskCount || '2'}</span><button onClick={() => setKioskCount(prev => Math.min(10, parseInt(prev || 1) + 1).toString())} style={{ width: 52, height: 52, borderRadius: 14, border: '2px solid #334155', background: '#0f172a', color: '#fff', fontSize: 28, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+</button></div></div>)}

                              {equipPopup === 'heatedDryers' && (<div style={{ padding: '12px 0' }}><div style={{ padding: '16px', borderRadius: 12, background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.1)' }}><div style={{ fontSize: 14, fontWeight: 700, color: '#a5b4fc', marginBottom: 6 }}>⚠️ High Energy Impact</div><div style={{ fontSize: 13, color: '#c7d2fe' }}>Resistive heating elements significantly increase energy consumption. Factored into your BESS sizing.</div></div></div>)}

                              {equipPopup === 'signage' && (<div><div style={{ fontSize: 14, fontWeight: 700, color: '#cbd5e1', marginBottom: 12 }}>Select Signage Type:</div><div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>{[{ val: 'basic', label: 'Basic', desc: 'Standard illuminated signs' }, { val: 'premium', label: 'Premium LED', desc: 'Full-color LED displays' }, { val: 'signature', label: 'Signature / Digital', desc: 'Digital menu boards, video displays' }].map(o => (<button key={o.val} onClick={() => setSignageTier(o.val)} style={{ padding: '14px 18px', borderRadius: 14, textAlign: 'left', cursor: 'pointer', transition: 'all 0.15s', position: 'relative', background: '#0f172a', border: signageTier === o.val ? '2px solid #6366f1' : '2px solid #1e293b' }}><div style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>{o.label}</div><div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>{o.desc}</div>{signageTier === o.val && (<div style={{ position: 'absolute', top: -8, right: -8, width: 22, height: 22, borderRadius: 11, background: '#6366f1', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(99,102,241,0.4)', zIndex: 2 }}><Check className="w-3.5 h-3.5 text-white" /></div>)}</button>))}</div></div>)}

                              {equipPopup === 'officeFacilities' && (<div><div style={{ fontSize: 14, fontWeight: 700, color: '#cbd5e1', marginBottom: 12 }}>Select all that apply:</div><div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>{[{ val: 'office', label: 'Office Space' }, { val: 'breakRoom', label: 'Break Room' }, { val: 'bathrooms', label: 'Restrooms' }, { val: 'securityCameras', label: 'Security Cameras' }].map(o => { const isChecked = officeFacilities.has(o.val); return (<button key={o.val} onClick={() => setOfficeFacilities(prev => { const s = new Set(prev); if (s.has(o.val)) s.delete(o.val); else s.add(o.val); return s; })} style={{ padding: '14px 18px', borderRadius: 14, textAlign: 'left', cursor: 'pointer', transition: 'all 0.15s', position: 'relative', background: '#0f172a', border: isChecked ? '2px solid #6366f1' : '2px solid #1e293b' }}><span style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>{o.label}</span>{isChecked && (<div style={{ position: 'absolute', top: -8, right: -8, width: 22, height: 22, borderRadius: 11, background: '#6366f1', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(99,102,241,0.4)', zIndex: 2 }}><Check className="w-3.5 h-3.5 text-white" /></div>)}</button>); })}</div></div>)}

                              {equipPopup === 'climateControl' && (<div><div style={{ fontSize: 14, fontWeight: 700, color: '#cbd5e1', marginBottom: 12 }}>Select HVAC Level:</div><div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>{[{ val: 'standard', label: 'Standard', desc: 'Equipment room HVAC + basic heating' }, { val: 'full', label: 'Full Climate Control', desc: 'Lobby, waiting area, heated floors' }].map(o => (<button key={o.val} onClick={() => setSiteFeatures(prev => ({...prev, climateControl: o.val}))} style={{ padding: '14px 18px', borderRadius: 14, textAlign: 'left', cursor: 'pointer', transition: 'all 0.15s', position: 'relative', background: '#0f172a', border: siteFeatures?.climateControl === o.val ? '2px solid #6366f1' : '2px solid #1e293b' }}><div style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>{o.label}</div><div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>{o.desc}</div>{siteFeatures?.climateControl === o.val && (<div style={{ position: 'absolute', top: -8, right: -8, width: 22, height: 22, borderRadius: 11, background: '#6366f1', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(99,102,241,0.4)', zIndex: 2 }}><Check className="w-3.5 h-3.5 text-white" /></div>)}</button>))}</div></div>)}

                              {equipPopup === 'premiumServices' && (<div><div style={{ fontSize: 14, fontWeight: 700, color: '#cbd5e1', marginBottom: 12 }}>Select Service Level:</div><div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>{[{ val: 'basic', label: 'Basic Package', desc: 'Tire shine, air freshener' }, { val: 'full', label: 'Full Premium', desc: 'Ceramic coating, interior detail, hot wax' }].map(o => (<button key={o.val} onClick={() => setSiteFeatures(prev => ({...prev, premiumServices: o.val}))} style={{ padding: '14px 18px', borderRadius: 14, textAlign: 'left', cursor: 'pointer', transition: 'all 0.15s', position: 'relative', background: '#0f172a', border: siteFeatures?.premiumServices === o.val ? '2px solid #6366f1' : '2px solid #1e293b' }}><div style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>{o.label}</div><div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>{o.desc}</div>{siteFeatures?.premiumServices === o.val && (<div style={{ position: 'absolute', top: -8, right: -8, width: 22, height: 22, borderRadius: 11, background: '#6366f1', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(99,102,241,0.4)', zIndex: 2 }}><Check className="w-3.5 h-3.5 text-white" /></div>)}</button>))}</div></div>)}

                              <button onClick={() => setEquipPopup(null)} style={{ width: '100%', marginTop: 20, padding: '14px', borderRadius: 12, background: '#6366f1', border: 'none', color: '#fff', fontSize: 15, fontWeight: 800, cursor: 'pointer' }}>Done</button>
                            </div>
                          </div>
                        );
                      })()}

                    </>
                  );
                })()}
              </div>
            </QuestionSection>

            {/* ═════ Q8: Motor & Equipment Specs — OPTION F: Defaults Toggle + Power Bars + Stepper Cards ═════ */}
            {(selectedEquipment.has('pumps') || selectedEquipment.has('dryers') || selectedEquipment.has('conveyor') || selectedEquipment.has('brushMotors') || selectedEquipment.has('airCompressor') || selectedEquipment.has('vacuums')) && (
              <QuestionSection activeQuestion={activeQuestion} questionRefs={questionRefs} questionNumber={8} title="Motor & equipment specs" subtitle="Pre-filled defaults — adjust only what you know" isRequired isManual onManualContinue={handleManualContinue}>
                {(() => {
                  const defaults = getCurrentDefaults();
                  const rv = (stateVal, fallback) => { const p = parseFloat(stateVal); return (stateVal && stateVal !== 'unknown' && !isNaN(p) && p > 0) ? p : fallback; };
                  const ri = (stateVal, fallback) => { const p = parseInt(stateVal); return (stateVal && stateVal !== 'unknown' && !isNaN(p) && p > 0) ? p : fallback; };
                  const unifiedRows = [
                    selectedEquipment.has('pumps') && { id: 'pumps', emoji: '💧', name: 'Pumps',
                      configOpts: PUMP_CONFIG_OPTIONS, configVal: pumpConfig, setConfig: setPumpConfig,
                      qty: ri(pumpCount, defaults.pumps.count), hp: rv(pumpHP, (PUMP_CONFIG_OPTIONS.find(c => c.id === pumpConfig)?.defaultHP || defaults.pumps.hp)),
                      setQty: v => setPumpCount(v.toString()), setHP: v => setPumpHP(v.toString()),
                      qtyMin: 1, qtyMax: 8, hpMin: 5, hpMax: 60, hpStep: 5,
                      vfd: pumpHasVFD, setVFD: setPumpHasVFD, autoVFD: pumpConfig === 'variableSpeed' },
                    selectedEquipment.has('dryers') && { id: 'dryers', emoji: '💨', name: 'Dryers',
                      configOpts: DRYER_CONFIG_OPTIONS, configVal: dryerConfig, setConfig: setDryerConfig,
                      inactive: dryerConfig === 'noDryers',
                      qty: ri(dryerCount, defaults.dryers.count), hp: rv(dryerHP, defaults.dryers.hp),
                      setQty: v => setDryerCount(v.toString()), setHP: v => setDryerHP(v.toString()),
                      qtyMin: 2, qtyMax: 24, hpMin: 5, hpMax: 30, hpStep: 5,
                      vfd: dryerHasVFD, setVFD: setDryerHasVFD },
                    selectedEquipment.has('conveyor') && defaults.conveyor.hp > 0 && { id: 'conveyor', emoji: '⚙️', name: 'Conveyor',
                      qty: 1, hp: rv(conveyorHP, defaults.conveyor.hp), fixedQty: true,
                      setHP: v => setConveyorHP(v.toString()),
                      hpMin: 5, hpMax: 40, hpStep: 5 },
                    selectedEquipment.has('vacuums') && { id: 'vacuums', emoji: '🌀', name: 'Vacuums',
                      configOpts: VACUUM_CONFIG_OPTIONS, configVal: vacuumConfig, setConfig: setVacuumConfig,
                      inactive: vacuumConfig === 'noVacuums',
                      qty: ri(vacuumCount, defaults.vacuums.count), hp: rv(vacuumTurbineHP, 30),
                      setQty: v => setVacuumCount(v.toString()), setHP: v => setVacuumTurbineHP(v.toString()),
                      qtyMin: 2, qtyMax: 30, hpMin: 0, hpMax: 60, hpStep: 5 },
                    selectedEquipment.has('airCompressor') && { id: 'airComp', emoji: '🌬️', name: 'Air Comp.',
                      qty: 1, hp: rv(airCompressorHP, defaults.airCompressor.hp), fixedQty: true,
                      setHP: v => setAirCompressorHP(v.toString()),
                      hpMin: 2.5, hpMax: 20, hpStep: 2.5 },
                    selectedEquipment.has('brushMotors') && { id: 'brush', emoji: '🔄', name: 'Brush Motors',
                      qty: ri(brushMotorCount, defaults.brushMotors?.count || 15), hp: 3, fixedHP: true,
                      setQty: v => setBrushMotorCount(v.toString()),
                      qtyMin: 2, qtyMax: 24 },
                  ].filter(Boolean);
                  return (
                    <div className="max-w-2xl">
                      {/* Defaults toggle */}
                      <div onClick={() => {
                        if (useEquipDefaults) { applyTypicalSpecs(); setUseEquipDefaults(false); setConfirmedEquipRows(new Set()); setExpandedEquipRow(null); }
                        else { applyTypicalSpecs(); setUseEquipDefaults(true); setConfirmedEquipRows(new Set(unifiedRows.map(r => r.id))); setExpandedEquipRow(null); }
                      }} style={{ padding: '14px 18px', borderRadius: 14, marginBottom: 18, cursor: 'pointer', background: useEquipDefaults ? 'linear-gradient(135deg, rgba(99,102,241,0.15), rgba(99,102,241,0.04))' : '#0f172a', border: useEquipDefaults ? '2px solid #6366f1' : '2px solid #334155', display: 'flex', alignItems: 'center', justifyContent: 'space-between', transition: 'all 0.2s' }}>
                        <div>
                          <div style={{ fontSize: 15, fontWeight: 700, color: '#fff' }}>Use Recommended Defaults</div>
                          <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>Pre-filled for <strong style={{ color: '#a5b4fc' }}>{FACILITY_TYPES.find(f => f.id === facilityType)?.title || facilityType}</strong> — adjust below if needed</div>
                        </div>
                        <div style={{ width: 48, height: 26, borderRadius: 13, padding: 2, background: useEquipDefaults ? '#6366f1' : '#334155', display: 'flex', alignItems: 'center', justifyContent: useEquipDefaults ? 'flex-end' : 'flex-start', transition: 'all 0.2s', flexShrink: 0, marginLeft: 12 }}>
                          <div style={{ width: 22, height: 22, borderRadius: '50%', background: '#fff', boxShadow: '0 2px 4px rgba(0,0,0,0.3)', transition: 'all 0.2s' }} />
                        </div>
                      </div>

                      {/* Equipment accordion — sequential activation */}
                      {(() => {
                        const firstUnconfirmed = unifiedRows.findIndex(r => !confirmedEquipRows.has(r.id));
                        const activeUpTo = firstUnconfirmed === -1 ? unifiedRows.length : firstUnconfirmed;
                        return (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, opacity: useEquipDefaults ? 0.7 : 1, pointerEvents: useEquipDefaults ? 'none' : 'auto', transition: 'opacity 0.3s' }}>
                          {/* Progress counter */}
                          {!useEquipDefaults && (
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                              <span style={{ fontSize: 12, fontWeight: 700, color: '#64748b' }}>{activeUpTo} of {unifiedRows.length} confirmed</span>
                              <div style={{ flex: 1, marginLeft: 12, height: 3, borderRadius: 2, background: '#1e293b' }}>
                                <div style={{ height: 3, borderRadius: 2, background: activeUpTo === unifiedRows.length ? '#6366f1' : '#6366f1', width: `${(activeUpTo / unifiedRows.length) * 100}%`, transition: 'width 0.3s' }} />
                              </div>
                            </div>
                          )}
                          {unifiedRows.map((row, idx) => {
                            const isConfirmed = confirmedEquipRows.has(row.id);
                            const isFrontier = idx === activeUpTo;
                            const isLocked = idx > activeUpTo;
                            const isOpen = !isLocked && !useEquipDefaults && (expandedEquipRow === row.id || (expandedEquipRow === null && isFrontier));
                            const totalHP = Math.round(row.qty * row.hp);
                            return (
                            <div key={row.id} style={{
                              borderRadius: 14, background: '#0f172a', overflow: 'hidden', transition: 'all 0.2s',
                              border: isOpen ? '2px solid #6366f1' : isConfirmed ? '2px solid rgba(99,102,241,0.15)' : '2px solid #1e293b',
                              opacity: isLocked ? 0.35 : row.inactive ? 0.4 : 1,
                              filter: isLocked ? 'grayscale(0.6)' : 'none',
                              pointerEvents: isLocked ? 'none' : 'auto',
                            }}>
                              {/* Header — always visible */}
                              <div onClick={() => {
                                if (isLocked) return;
                                if (isOpen) setExpandedEquipRow('__collapsed__');
                                else setExpandedEquipRow(row.id);
                              }}
                                style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 14, cursor: isLocked ? 'default' : 'pointer' }}>
                                {isConfirmed && !isOpen ? (
                                  <div style={{ width: 28, height: 28, borderRadius: 14, background: '#6366f1', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                    <Check className="w-4 h-4 text-white" />
                                  </div>
                                ) : (
                                  <span style={{ fontSize: 26 }}>{row.emoji}</span>
                                )}
                                <span style={{ fontSize: 17, fontWeight: 800, color: isConfirmed ? '#94a3b8' : '#e2e8f0', flex: 1 }}>{row.name}</span>
                                {isConfirmed && !isOpen && row.configOpts && (
                                  <span style={{ fontSize: 13, color: '#64748b', marginRight: 4 }}>{row.configOpts.find(c => c.id === row.configVal)?.label || ''}</span>
                                )}
                                <span style={{ fontSize: 15, fontWeight: 700, color: isConfirmed && !isOpen ? '#64748b' : '#a5b4fc' }}>{totalHP} HP</span>
                                {!isLocked && (
                                  <span style={{ fontSize: 12, color: '#475569', transform: isOpen ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.2s', marginLeft: 4 }}>▼</span>
                                )}
                              </div>
                              {/* Expanded controls */}
                              {isOpen && !row.inactive && (
                                <div style={{ padding: '0 20px 18px', borderTop: '1px solid #1e293b' }} onClick={e => e.stopPropagation()}>
                                  <div style={{ paddingTop: 16, display: 'flex', gap: 28, alignItems: 'flex-start', flexWrap: 'wrap' }}>
                                    {/* Config dropdown */}
                                    {row.configOpts && (
                                      <div>
                                        <div style={{ fontSize: 13, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>Config</div>
                                        <select value={row.configVal || ''} onChange={e => row.setConfig(e.target.value)}
                                          style={{ fontSize: 15, background: '#1e293b', color: '#cbd5e1', border: '2px solid #334155', borderRadius: 10, padding: '10px 14px', outline: 'none', cursor: 'pointer', minWidth: 170 }}>
                                          {row.configOpts.map(o => <option key={o.id} value={o.id}>{o.label}</option>)}
                                        </select>
                                      </div>
                                    )}
                                    {/* Qty */}
                                    <div>
                                      <div style={{ fontSize: 13, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>Qty</div>
                                      {!row.fixedQty ? (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                          <button onClick={() => row.setQty(Math.max(row.qtyMin, row.qty - 1))}
                                            style={{ width: 38, height: 38, borderRadius: 10, border: '2px solid #334155', background: 'transparent', color: '#94a3b8', fontSize: 20, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>−</button>
                                          <span style={{ fontSize: 24, fontWeight: 900, color: '#a5b4fc', minWidth: 36, textAlign: 'center' }}>{row.qty}</span>
                                          <button onClick={() => row.setQty(Math.min(row.qtyMax, row.qty + 1))}
                                            style={{ width: 38, height: 38, borderRadius: 10, border: '2px solid #334155', background: 'transparent', color: '#94a3b8', fontSize: 20, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>+</button>
                                        </div>
                                      ) : (
                                        <span style={{ fontSize: 24, fontWeight: 800, color: '#475569' }}>{row.qty}</span>
                                      )}
                                    </div>
                                    {/* HP */}
                                    <div>
                                      <div style={{ fontSize: 13, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>HP</div>
                                      {!row.fixedHP ? (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                          <button onClick={() => row.setHP(Math.max(row.hpMin, +(row.hp - (row.hpStep || 1)).toFixed(1)))}
                                            style={{ width: 38, height: 38, borderRadius: 10, border: '2px solid #334155', background: 'transparent', color: '#94a3b8', fontSize: 20, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>−</button>
                                          <span style={{ fontSize: 24, fontWeight: 900, color: '#a5b4fc', minWidth: 36, textAlign: 'center' }}>{row.hp}</span>
                                          <button onClick={() => row.setHP(Math.min(row.hpMax, +(row.hp + (row.hpStep || 1)).toFixed(1)))}
                                            style={{ width: 38, height: 38, borderRadius: 10, border: '2px solid #334155', background: 'transparent', color: '#94a3b8', fontSize: 20, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>+</button>
                                        </div>
                                      ) : (
                                        <span style={{ fontSize: 24, fontWeight: 800, color: '#475569' }}>{row.hp}</span>
                                      )}
                                    </div>
                                    {/* VFD */}
                                    {row.setVFD && (
                                      <div>
                                        <div style={{ fontSize: 13, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>VFD</div>
                                        <div style={{ display: 'flex', gap: 6 }}>
                                          {[{ val: true, label: 'Yes', bg: 'rgba(99,102,241,0.18)', border: '#6366f1', color: '#a5b4fc' }, { val: false, label: 'No', bg: 'rgba(99,102,241,0.18)', border: '#6366f1', color: '#a5b4fc' }, { val: 'unknown', label: '?', bg: 'rgba(99,102,241,0.15)', border: '#6366f1', color: '#a5b4fc' }].map(o => {
                                            const isActive = row.autoVFD ? (o.val === true) : (row.vfd === o.val);
                                            return (
                                              <button key={String(o.val)} onClick={() => !row.autoVFD && row.setVFD(row.vfd === o.val ? null : o.val)}
                                                style={{ padding: '8px 16px', borderRadius: 8, cursor: row.autoVFD ? 'default' : 'pointer', fontSize: 14, fontWeight: 700,
                                                  background: isActive ? o.bg : 'transparent',
                                                  border: isActive ? `2px solid ${o.border}` : '2px solid #334155',
                                                  color: isActive ? o.color : '#475569',
                                                  opacity: row.autoVFD && o.val !== true ? 0.3 : 1, transition: 'all 0.15s' }}>
                                                {o.label}
                                              </button>
                                            );
                                          })}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                  {/* Confirm button */}
                                  <button onClick={() => {
                                    setConfirmedEquipRows(prev => { const s = new Set(prev); s.add(row.id); return s; });
                                    setExpandedEquipRow(null);
                                  }}
                                    style={{ marginTop: 16, width: '100%', padding: '14px', borderRadius: 12, border: 'none', cursor: 'pointer',
                                      background: 'linear-gradient(135deg, #6366f1, #4f46e5)', color: '#fff',
                                      fontSize: 16, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                                      boxShadow: '0 2px 8px rgba(99,102,241,0.25)' }}>
                                    <Check className="w-3.5 h-3.5" /> Confirm {row.name}
                                  </button>
                                </div>
                              )}
                            </div>
                            );
                          })}
                        </div>
                        );
                      })()}
                    </div>
                  );
                })()}
              </QuestionSection>
            )}

            {/* ═════ Q9: Equipment Condition (age + VFD) — MERGED ═════ */}
            {(selectedEquipment.has('pumps') || selectedEquipment.has('dryers') || selectedEquipment.has('conveyor') || selectedEquipment.has('brushMotors') || selectedEquipment.has('airCompressor') || selectedEquipment.has('vacuums')) && (
              <QuestionSection activeQuestion={activeQuestion} questionRefs={questionRefs} questionNumber={9} title="Equipment age" isRequired canContinue={!!equipmentAge}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 10 }}>
                  {[
                    { id: 'new', num: '0-5', loss: 'Baseline', dot: '#6366f1' },
                    { id: 'moderate', num: '5-10', loss: '+12%', dot: '#6366f1' },
                    { id: 'old', num: '10-15', loss: '+25%', dot: '#6366f1' },
                    { id: 'veryOld', num: '15+', loss: '+40%', dot: '#6366f1' }
                  ].map(opt => {
                    const isSelected = equipmentAge === opt.id;
                    return (
                      <button key={opt.id} onClick={() => setEquipmentAge(equipmentAge === opt.id ? '' : opt.id)}
                        style={{ padding: 16, borderRadius: 10, textAlign: 'center', cursor: 'pointer', position: 'relative', background: isSelected ? 'rgba(99,102,241,0.12)' : '#0f172a', border: isSelected ? '2px solid #6366f1' : '1px solid #1e293b', transition: 'all 0.15s' }}>
                        <div style={{ fontSize: 18, fontWeight: 800, color: '#fff' }}>{opt.num}</div>
                        <div style={{ fontSize: 12, color: '#64748b', marginTop: 1 }}>years</div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 3, marginTop: 4 }}>
                          <div style={{ width: 6, height: 6, borderRadius: 3, background: opt.dot }} />
                          <span style={{ fontSize: 12, fontWeight: 600, color: opt.dot }}>{opt.loss}</span>
                        </div>
                        {isSelected && (
                          <div style={{ position: 'absolute', top: -8, right: -8, width: 22, height: 22, borderRadius: 11, background: '#6366f1', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(99,102,241,0.4)', zIndex: 2 }}>
                            <Check className="w-3.5 h-3.5 text-white" />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </QuestionSection>
            )}

            {/* ═════ Q10-Q12: Infrastructure & Operations ═════ */}
            <SectionDivider activeQuestion={activeQuestion} completedQuestions={completedQuestions} icon="🏗️" label="Infrastructure" sectionNum={4} totalSections={5} sectionId="infra" />

            {/* Question 18: Electrical Infrastructure (Enhanced - Single Unified Box) */}
            <QuestionSection activeQuestion={activeQuestion} questionRefs={questionRefs} questionNumber={10} title="Electrical Infrastructure" isRequired>
              <div className="max-w-2xl" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

                {/* ── Known Electrical Issues — Yes/No toggle + Don't Know box ── */}
                <div>
                  <span style={{ fontSize: 14, fontWeight: 600, color: '#e2e8f0', display: 'block', marginBottom: 12 }}>Known electrical issues?</span>
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                    {[
                      { val: 'no', label: 'No', selBg: 'rgba(99,102,241,0.18)', selBorder: '#6366f1', selColor: '#a5b4fc' },
                      { val: 'yes', label: 'Yes', selBg: 'rgba(99,102,241,0.15)', selBorder: '#6366f1', selColor: '#a5b4fc' },
                      { val: 'unknown', label: "Don't Know", selBg: 'rgba(99,102,241,0.15)', selBorder: '#6366f1', selColor: '#6366f1', isDK: true },
                    ].map(o => {
                      const isActive = o.val === 'no' ? powerQualityIssues.has('none') : o.val === 'yes' ? (powerQualityIssues.size > 0 && !powerQualityIssues.has('none') && !powerQualityIssues.has('unknown')) : powerQualityIssues.has('unknown');
                      return (
                        <button key={o.val} onClick={() => {
                          const ns = new Set();
                          if (o.val === 'no') ns.add('none');
                          else if (o.val === 'unknown') ns.add('unknown');
                          else ns.add('voltage-drops'); // default first issue selected
                          setPowerQualityIssues(ns);
                        }}
                          style={{ aspectRatio: '1', borderRadius: 14, textAlign: 'center', cursor: 'pointer', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center',
                            background: isActive ? o.selBg : '#0f172a',
                            border: isActive ? `2px solid ${o.selBorder}` : o.isDK ? '2px dashed rgba(99,102,241,0.12)' : '2px solid #1e293b',
                            transition: 'all 0.15s' }}>
                          <div style={{ fontSize: o.isDK ? 12 : 16, fontWeight: 800, color: isActive ? o.selColor : o.isDK ? '#6366f1' : '#64748b' }}>{o.label}</div>
                          {isActive && (
                            <div style={{ position: 'absolute', top: -8, right: -8, width: 22, height: 22, borderRadius: 11, background: o.selBorder, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 2px 8px ${o.selBorder}66`, zIndex: 2 }}>
                              <Check className="w-3.5 h-3.5 text-white" />
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {/* ── Issue type boxes — appear when Yes selected ── */}
                  {powerQualityIssues.size > 0 && !powerQualityIssues.has('none') && !powerQualityIssues.has('unknown') && (
                    <div style={{ marginTop: 12 }}>
                      <span style={{ fontSize: 12, fontWeight: 600, color: '#94a3b8', display: 'block', marginBottom: 8 }}>Select all that apply</span>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {[
                          { id: 'voltage-drops', label: 'Voltage Drops', desc: 'Lights dim, motors lag' },
                          { id: 'frequent-outages', label: 'Frequent Outages', desc: 'Blackouts, interruptions' },
                          { id: 'power-surges', label: 'Power Surges', desc: 'Spikes damage equipment' },
                          { id: 'harmonic-distortion', label: 'Harmonic Issues', desc: 'VFD/LED interference' },
                        ].map(opt => {
                          const isSel = powerQualityIssues.has(opt.id);
                          return (
                            <button key={opt.id} onClick={() => {
                              const ns = new Set(powerQualityIssues);
                              if (ns.has(opt.id)) { ns.delete(opt.id); if (ns.size === 0) ns.add('none'); }
                              else ns.add(opt.id);
                              setPowerQualityIssues(ns);
                            }}
                              style={{ padding: '12px 8px', borderRadius: 14, textAlign: 'center', cursor: 'pointer', position: 'relative',
                                background: isSel ? 'rgba(99,102,241,0.08)' : '#0f172a',
                                border: isSel ? '2px solid #6366f1' : '2px solid #1e293b',
                                transition: 'all 0.15s' }}>
                              <div style={{ fontSize: 13, fontWeight: 700, color: isSel ? '#a5b4fc' : '#e2e8f0' }}>{opt.label}</div>
                              <div style={{ fontSize: 10, color: '#64748b', marginTop: 3 }}>{opt.desc}</div>
                              {isSel && (
                                <div style={{ position: 'absolute', top: -8, right: -8, width: 22, height: 22, borderRadius: 11, background: '#6366f1', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(99,102,241,0.2)', zIndex: 2 }}>
                                  <Check className="w-3.5 h-3.5 text-white" />
                                </div>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                <div style={{ height: 1, background: '#1e293b' }} />

                {/* ── Service Rating — square grid boxes ── */}
                <div>
                  <span style={{ fontSize: 14, fontWeight: 600, color: '#e2e8f0', display: 'block', marginBottom: 12 }}>Service rating (amps)</span>
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                    {['200', '400', '600', '800', '1000', 'unknown'].map(id => {
                      const isSel = serviceRating === id;
                      const isUnknown = id === 'unknown';
                      return (
                        <button key={id} onClick={() => setServiceRating(serviceRating === id ? '' : id)}
                          style={{ aspectRatio: '1', padding: '8px 4px', borderRadius: 14, textAlign: 'center', cursor: 'pointer', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center',
                            background: isSel ? (isUnknown ? 'rgba(99,102,241,0.15)' : 'rgba(99,102,241,0.12)') : '#0f172a',
                            border: isSel ? (isUnknown ? '2px solid #6366f1' : '2px solid #6366f1') : isUnknown ? '2px dashed rgba(99,102,241,0.12)' : '2px solid #1e293b',
                            transition: 'all 0.15s' }}>
                          <div style={{ fontSize: isUnknown ? 12 : 16, fontWeight: 800, color: isUnknown ? '#6366f1' : '#fff' }}>{isUnknown ? "Don't Know" : id === '1000' ? '1000A+' : `${id}A`}</div>
                          {isSel && (
                            <div style={{ position: 'absolute', top: -8, right: -8, width: 22, height: 22, borderRadius: 11, background: isUnknown ? '#6366f1' : '#6366f1', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 2px 8px ${isUnknown ? 'rgba(99,102,241,0.2)' : 'rgba(99,102,241,0.4)'}`, zIndex: 2 }}>
                              <Check className="w-3.5 h-3.5 text-white" />
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div style={{ height: 1, background: '#1e293b' }} />

                {/* ── Site Voltage — square grid boxes ── */}
                <div>
                  <span style={{ fontSize: 14, fontWeight: 600, color: '#e2e8f0', display: 'block', marginBottom: 12 }}>Site voltage</span>
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                    {[
                      { id: '240v-single', label: '240V 1-Ph' },
                      { id: '208v-3phase', label: '208V 3-Ph' },
                      { id: '480v-3phase', label: '480V 3-Ph' },
                      { id: 'unknown', label: "Don't Know" }
                    ].map(opt => {
                      const isSel = siteVoltage === opt.id;
                      const isUnknown = opt.id === 'unknown';
                      return (
                        <button key={opt.id} onClick={() => setSiteVoltage(siteVoltage === opt.id ? '' : opt.id)}
                          style={{ aspectRatio: '1', padding: '8px 4px', borderRadius: 14, textAlign: 'center', cursor: 'pointer', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center',
                            background: isSel ? (isUnknown ? 'rgba(99,102,241,0.15)' : 'rgba(99,102,241,0.12)') : '#0f172a',
                            border: isSel ? (isUnknown ? '2px solid #6366f1' : '2px solid #6366f1') : isUnknown ? '2px dashed rgba(99,102,241,0.12)' : '2px solid #1e293b',
                            transition: 'all 0.15s' }}>
                          <div style={{ fontSize: isUnknown ? 12 : 14, fontWeight: 800, color: isUnknown ? '#6366f1' : '#fff' }}>{opt.label}</div>
                          {isSel && (
                            <div style={{ position: 'absolute', top: -8, right: -8, width: 22, height: 22, borderRadius: 11, background: isUnknown ? '#6366f1' : '#6366f1', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 2px 8px ${isUnknown ? 'rgba(99,102,241,0.2)' : 'rgba(99,102,241,0.4)'}`, zIndex: 2 }}>
                              <Check className="w-3.5 h-3.5 text-white" />
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

              </div>
            </QuestionSection>

            <QuestionSection activeQuestion={activeQuestion} questionRefs={questionRefs} questionNumber={11} title="If power goes out, what happens to your business?" info={`Based on ${FACILITY_TYPES.find(f => f.id === facilityType)?.title || 'Express'} · ${dailyVehicles || 200} vehicles/day · ${operatingHours || 14}hr days`} isRequired>
              {(() => {
                const AVG_TICKETS = { express: 18, fullService: 28, inBay: 8, mini: 12 };
                const ticket = AVG_TICKETS[facilityType] || 18;
                const vehicles = parseInt(dailyVehicles) || 200;
                const hrs = parseInt(operatingHours) || 14;
                const vph = Math.round(vehicles / hrs);
                const outageStr = locationData?.grid?.outages || '3-5';
                const outParts = outageStr.split('-').map(Number);
                const outLow = outParts[0] || 3;
                const outHigh = outParts[1] || outParts[0] || 5;
                const avgDuration = 4;

                const LEVELS = [
                  { id: 'complete-shutdown', label: 'Complete Shutdown', sub: 'All operations stop', icon: '🔴', border: '#6366f1', bg: 'rgba(99,102,241,0.08)', pct: 1.0, what: 'Tunnel, vacuums, POS, lighting — everything offline', bess: 'Battery backup covers 4–6 hr typical outage → $0 lost' },
                  { id: 'partial-operations', label: 'Partial Operations', sub: 'Tunnel down, vacuums run', icon: '🟠', border: '#6366f1', bg: 'rgba(99,102,241,0.08)', pct: 0.70, what: 'Tunnel & conveyor offline — vacuums, detail bays still running (~30% revenue)', bess: 'Battery keeps tunnel running through outage → full revenue preserved' },
                  { id: 'minor-disruptions', label: 'Minor Disruptions', sub: 'Queues slow, most runs', icon: '🟡', border: '#6366f1', bg: 'rgba(99,102,241,0.08)', pct: 0.15, what: 'Brief tunnel pause, POS/lighting on backup — 15% dip from queue abandonment', bess: 'Battery eliminates brief pauses → zero queue abandonment' },
                  { id: 'no-impact', label: 'No Impact', sub: 'Generator or UPS in place', icon: '🟢', border: '#6366f1', bg: 'rgba(99,102,241,0.08)', pct: 0, what: 'Existing backup power covers all operations', bess: 'BESS still saves on demand charges — peak shaving value remains' },
                ];

                const sel = LEVELS.find(l => l.id === outageImpact);
                const lostPerHour = sel ? Math.round(vph * ticket * sel.pct) : 0;
                const lostPerDay = sel ? Math.round(vehicles * ticket * sel.pct) : 0;
                const lostPerEvent = lostPerHour * avgDuration;

                return (
                  <div className="max-w-2xl">
                    {/* 2×2 tile grid */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
                      {LEVELS.map(opt => {
                        const isSel = outageImpact === opt.id;
                        return (
                          <button key={opt.id} onClick={() => setOutageImpact(outageImpact === opt.id ? '' : opt.id)}
                            style={{ padding: '16px 14px', borderRadius: 14, textAlign: 'left', cursor: 'pointer', position: 'relative',
                              background: isSel ? opt.bg : '#0f172a',
                              border: isSel ? `2px solid ${opt.border}` : '2px solid #1e293b',
                              transition: 'all 0.15s' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                              <span style={{ fontSize: 16 }}>{opt.icon}</span>
                              <span style={{ fontSize: 14, fontWeight: 800, color: '#fff' }}>{opt.label}</span>
                            </div>
                            <div style={{ fontSize: 12, color: isSel ? '#cbd5e1' : '#64748b', paddingLeft: 24 }}>{opt.sub}</div>
                            {isSel && (
                              <div style={{ position: 'absolute', top: -8, right: -8, width: 22, height: 22, borderRadius: 11, background: opt.border, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 2px 8px ${opt.border}66`, zIndex: 2 }}>
                                <Check className="w-3.5 h-3.5 text-white" />
                              </div>
                            )}
                          </button>
                        );
                      })}
                    </div>

                    {/* Revenue Impact Panel — Option B: Two-Stat Compact */}
                    {sel && sel.pct > 0 && (
                      <div style={{ borderRadius: 14, border: `1px solid ${sel.border}33`, background: `linear-gradient(135deg, ${sel.bg}, rgba(15,23,42,0.95))`, padding: '16px 20px' }}>
                        <div style={{ display: 'flex', gap: 24, marginBottom: 10 }}>
                          <div>
                            <div style={{ fontSize: 10, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5 }}>Per outage</div>
                            <div style={{ fontSize: 24, fontWeight: 900, color: `${sel.border}cc` }}>${lostPerEvent.toLocaleString()}</div>
                          </div>
                          <div style={{ width: 1, background: '#1e293b' }} />
                          <div>
                            <div style={{ fontSize: 10, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5 }}>Annual risk</div>
                            <div style={{ fontSize: 24, fontWeight: 900, color: sel.border }}>${(lostPerEvent * outLow).toLocaleString()}–${(lostPerEvent * outHigh).toLocaleString()}</div>
                          </div>
                        </div>
                        <div style={{ fontSize: 11, color: '#475569' }}>
                          {vph} cars/hr × ${ticket} × {Math.round(sel.pct * 100)}% × {avgDuration}hr avg · {outLow}–{outHigh} outages/yr
                        </div>
                        <div style={{ marginTop: 10, fontSize: 12, fontWeight: 600, color: '#a5b4fc' }}>
                          🔋 {sel.bess}
                        </div>
                      </div>
                    )}

                  </div>
                );
              })()}
            </QuestionSection>

            <QuestionSection activeQuestion={activeQuestion} questionRefs={questionRefs} questionNumber={12} title="Water reclaim system?" isRequired>
              <div className="max-w-2xl">
                {/* Reclaim level — 4 compact buttons: label + percentage only */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 10, marginBottom: 12 }}>
                  {[
                    { id: 'none', label: 'None', pct: '0%', pctColor: '#64748b' },
                    { id: 'basic', label: 'Basic', pct: '50-60%', pctColor: '#6366f1' },
                    { id: 'standard', label: 'Standard', pct: '70-80%', pctColor: '#6366f1' },
                    { id: 'advanced', label: 'Advanced', pct: '85-95%', pctColor: '#6366f1' }
                  ].map(opt => (
                    <button key={opt.id} onClick={() => {
                      if (waterReclaimLevel === opt.id) {
                        setWaterReclaimLevel('');
                        if (opt.id === 'advanced') setSelectedEquipment(prev => { const s = new Set(prev); s.delete('ro'); return s; });
                      } else {
                        setWaterReclaimLevel(opt.id);
                        if (opt.id === 'advanced') { setSelectedEquipment(prev => { const s = new Set(prev); s.add('ro'); return s; }); setRoHP('5'); }
                        markCompleted(12);
                      }
                    }}
                      style={{ padding: 16, borderRadius: 10, textAlign: 'center', cursor: 'pointer', position: 'relative', background: waterReclaimLevel === opt.id ? 'rgba(99,102,241,0.12)' : '#0f172a', border: waterReclaimLevel === opt.id ? '2px solid #6366f1' : '1px solid #1e293b', transition: 'all 0.15s' }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>{opt.label}</div>
                      <div style={{ fontSize: 12, fontWeight: 600, color: opt.pctColor, marginTop: 2 }}>{opt.pct}</div>
                      {waterReclaimLevel === opt.id && (
                        <div style={{ position: 'absolute', top: -8, right: -8, width: 22, height: 22, borderRadius: 11, background: '#6366f1', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(99,102,241,0.4)', zIndex: 2 }}>
                          <Check className="w-3.5 h-3.5 text-white" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>

                {/* RO — auto-included with Advanced reclaim (hidden from UI, handled in useEffect) */}
              </div>
            </QuestionSection>

            <SectionDivider activeQuestion={activeQuestion} completedQuestions={completedQuestions} icon="📐" label="Site & Add-ons" sectionNum={5} totalSections={5} sectionId="site" />

            <QuestionSection activeQuestion={activeQuestion} questionRefs={questionRefs} questionNumber={13} title="Site & roof assessment" subtitle="Building dimensions and roof type" isRequired>
              <div className="max-w-2xl mt-2">

                {/* Total site area — slider */}
                <div style={{ marginBottom: 20 }}>
                  <span style={{ fontSize: 14, fontWeight: 600, color: '#e2e8f0', display: 'block', marginBottom: 8 }}>Total site area</span>
                  <div className="flex items-center justify-center mb-3">
                    <span className="inline-block px-5 py-2 bg-slate-800 border-2 border-indigo-500 rounded-xl" style={{ fontSize: 20, fontWeight: 800, color: '#a5b4fc' }}>
                      <span id="slider-display-site">{siteSqFt ? parseInt(siteSqFt).toLocaleString() : '--'}</span>
                      <span style={{ fontSize: 12, fontWeight: 400, color: '#94a3b8', marginLeft: 6 }}>sq ft</span>
                    </span>
                  </div>
                  <SmoothSlider
                    min={10000} max={120000} step={1000}
                    value={siteSqFt ? parseInt(siteSqFt) : 44000}
                    onChange={v => setSiteSqFt(String(v))}
                    label="Site area" displayId="slider-display-site"
                    formatDisplay={v => parseInt(v).toLocaleString()}
                    color="#6366f1"
                  />
                </div>

                <div style={{ height: 1, background: '#1e293b', marginBottom: 20 }} />

                {/* Building roof area — slider with auto-default from tunnel length */}
                <div style={{ marginBottom: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                    <span style={{ fontSize: 14, fontWeight: 600, color: '#e2e8f0' }}>Building roof footprint</span>
                    {tunnelLength && (
                      <span style={{ fontSize: 11, color: '#64748b' }}>Auto: {tunnelLength} ft × 28 ft = {(parseInt(tunnelLength) * 28).toLocaleString()} sf</span>
                    )}
                  </div>
                  <div className="flex items-center justify-center mb-3">
                    <span className="inline-block px-5 py-2 bg-slate-800 border-2 border-indigo-500 rounded-xl" style={{ fontSize: 20, fontWeight: 800, color: '#a5b4fc' }}>
                      <span id="slider-display-roof">{totalRoofArea ? parseInt(totalRoofArea).toLocaleString() : '--'}</span>
                      <span style={{ fontSize: 12, fontWeight: 400, color: '#94a3b8', marginLeft: 6 }}>sq ft</span>
                    </span>
                  </div>
                  <SmoothSlider
                    min={1500} max={15000} step={100}
                    value={totalRoofArea ? parseInt(totalRoofArea) : (tunnelLength ? parseInt(tunnelLength) * 28 : 4500)}
                    onChange={v => { roofManuallySetRef.current = true; setTotalRoofArea(String(v)); }}
                    label="Roof footprint" displayId="slider-display-roof"
                    formatDisplay={v => parseInt(v).toLocaleString()}
                    color="#6366f1"
                  />
                </div>

                {/* Auto-calculated usable roof for solar — read-only info card */}
                {totalRoofArea && (
                  <>
                    <div style={{ height: 1, background: '#1e293b', marginTop: 20, marginBottom: 16 }} />

                    {/* Roof construction type — determines solar usable % */}
                    <div style={{ marginBottom: 16 }}>
                      <span style={{ fontSize: 14, fontWeight: 600, color: '#e2e8f0', display: 'block', marginBottom: 4 }}>Roof construction</span>
                      <span style={{ fontSize: 11, color: '#64748b', display: 'block', marginBottom: 12 }}>Determines how much roof area can host solar panels</span>
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          { id: 'opaque', label: 'Standard metal', desc: 'Opaque roof', pct: '70%', sub: 'Traditional, older builds', color: '#6366f1', tip: 'Standard metal or concrete roof — traditional design used by El Car Wash, Autobell, Delta Sonic, most pre-2018 builds. HVAC, signage, and setback deductions only (~30%). Best solar economics.' },
                          { id: 'mixed', label: 'Mixed', desc: 'Some skylights', pct: '55%', sub: 'Partial polycarbonate strips', color: '#6366f1', tip: 'Partial translucent strips for natural daylight (~20-35% polycarbonate) with opaque metal majority. Common in mid-2010s builds and retrofits. Moderate solar potential.' },
                          { id: 'polycarbonate', label: 'Polycarbonate', desc: 'Daylight panels', pct: '40%', sub: 'Tommy\'s, Quick Quack style', color: '#6366f1', tip: 'Heavy polycarbonate daylight roof (45-65% translucent) — Tommy\'s 2.0, Quick Quack newer builds, Whistle Express. Eliminates 90% of daytime lighting cost but limits solar mounting area to ~40%.' },
                        ].map(opt => {
                          const isSelected = roofType === opt.id;
                          return (
                            <button key={opt.id} onClick={() => setRoofType(isSelected ? '' : opt.id)}
                              className="group"
                              style={{ padding: '14px 8px', borderRadius: 14, textAlign: 'center', position: 'relative', cursor: 'pointer', background: isSelected ? `${opt.color}18` : '#0f172a', border: isSelected ? `2px solid ${opt.color}` : '2px solid #1e293b', transition: 'all 0.15s' }}>
                              <div style={{ fontSize: 22, fontWeight: 900, color: isSelected ? opt.color : '#94a3b8' }}>{opt.pct}</div>
                              <div style={{ fontSize: 13, fontWeight: 700, color: '#fff', marginTop: 2 }}>{opt.label}</div>
                              <div style={{ fontSize: 10, color: '#64748b', marginTop: 2 }}>{opt.sub}</div>
                              {/* Info tooltip */}
                              <div style={{ position: 'absolute', bottom: 6, right: 6, width: 16, height: 16, borderRadius: '50%', background: '#1e293b', border: '1px solid #334155', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 700, color: '#64748b' }}>i</div>
                              <div style={{ position: 'absolute', bottom: '100%', left: '50%', transform: 'translateX(-50%)', marginBottom: 6, width: 240, padding: '10px 12px', background: '#1e293b', border: '1px solid #334155', borderRadius: 10, fontSize: 11, color: '#cbd5e1', lineHeight: 1.6, textAlign: 'left', opacity: 0, pointerEvents: 'none', zIndex: 50 }} className="group-hover:!opacity-100">
                                {opt.tip}
                              </div>
                              {isSelected && (
                                <div style={{ position: 'absolute', top: -8, right: -8, width: 22, height: 22, borderRadius: 11, background: opt.color, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 2px 8px ${opt.color}66`, zIndex: 2 }}>
                                  <Check className="w-3.5 h-3.5 text-white" />
                                </div>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                  </>
                )}
              </div>
            </QuestionSection>

            {/* ── Question 14: Beyond Roof Solar — Toggle Switches ── */}
            <QuestionSection activeQuestion={activeQuestion} questionRefs={questionRefs} questionNumber={14} title="Besides roof, where else would you add solar?" subtitle="Merlin AI will optimize system size and ROI in the next steps" isRequired>
              <div className="max-w-2xl" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

                {/* Carport toggle */}
                <div style={{
                  padding: '18px 22px', borderRadius: 16, transition: 'all 0.2s',
                  background: carportSolarInterest === 'yes' ? 'rgba(99,102,241,0.08)' : '#0f172a',
                  border: carportSolarInterest === 'yes' ? '2px solid rgba(99,102,241,0.2)' : '2px solid #1e293b',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <span style={{ fontSize: 28 }}>🅿️</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 15, fontWeight: 700, color: '#fff' }}>Carport Solar Canopy</div>
                      <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>Covered parking + energy</div>
                    </div>
                    <div onClick={() => {
                      const newVal = carportSolarInterest === 'yes' ? 'no' : 'yes';
                      setCarportSolarInterest(newVal);
                      if (merlinSolar) setMerlinSolar(false);
                      if (newVal === 'yes') setSolarDimPopup('carport');
                    }} style={{ width: 52, height: 28, borderRadius: 14, cursor: 'pointer', position: 'relative', transition: 'background 0.2s', background: carportSolarInterest === 'yes' ? '#6366f1' : '#334155', flexShrink: 0 }}>
                      <div style={{ width: 22, height: 22, borderRadius: 11, background: '#fff', position: 'absolute', top: 3, left: carportSolarInterest === 'yes' ? 27 : 3, transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.3)' }} />
                    </div>
                  </div>
                  {carportSolarInterest === 'yes' && (
                    <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 10, padding: '8px 14px', borderRadius: 8, background: 'rgba(99,102,241,0.06)' }}>
                      <span style={{ fontSize: 12, color: '#94a3b8', flex: 1 }}>{carportLength} × {carportWidth} ft = <strong style={{ color: '#a5b4fc' }}>{(carportLength * carportWidth).toLocaleString()} sf</strong></span>
                      <button onClick={() => setSolarDimPopup('carport')}
                        style={{ padding: '4px 12px', borderRadius: 8, fontSize: 11, fontWeight: 700, background: 'rgba(99,102,241,0.12)', color: '#a5b4fc', border: '1px solid rgba(99,102,241,0.3)', cursor: 'pointer', outline: 'none' }}>
                        Edit
                      </button>
                    </div>
                  )}
                </div>

                {/* Ground-mount toggle */}
                <div style={{
                  padding: '18px 22px', borderRadius: 16, transition: 'all 0.2s',
                  background: groundSolarInterest === 'yes' ? 'rgba(99,102,241,0.08)' : '#0f172a',
                  border: groundSolarInterest === 'yes' ? '2px solid rgba(99,102,241,0.2)' : '2px solid #1e293b',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <span style={{ fontSize: 28 }}>🌿</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 15, fontWeight: 700, color: '#fff' }}>Ground-Mount Array</div>
                      <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>Rear or side lot</div>
                    </div>
                    <div onClick={() => {
                      const newVal = groundSolarInterest === 'yes' ? 'no' : 'yes';
                      setGroundSolarInterest(newVal);
                      if (merlinSolar) setMerlinSolar(false);
                      if (newVal === 'yes') setSolarDimPopup('ground');
                    }} style={{ width: 52, height: 28, borderRadius: 14, cursor: 'pointer', position: 'relative', transition: 'background 0.2s', background: groundSolarInterest === 'yes' ? '#6366f1' : '#334155', flexShrink: 0 }}>
                      <div style={{ width: 22, height: 22, borderRadius: 11, background: '#fff', position: 'absolute', top: 3, left: groundSolarInterest === 'yes' ? 27 : 3, transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.3)' }} />
                    </div>
                  </div>
                  {groundSolarInterest === 'yes' && (
                    <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 10, padding: '8px 14px', borderRadius: 8, background: 'rgba(99,102,241,0.06)' }}>
                      <span style={{ fontSize: 12, color: '#94a3b8', flex: 1 }}>{groundLength} × {groundWidth} ft = <strong style={{ color: '#a5b4fc' }}>{(groundLength * groundWidth).toLocaleString()} sf</strong></span>
                      <button onClick={() => setSolarDimPopup('ground')}
                        style={{ padding: '4px 12px', borderRadius: 8, fontSize: 11, fontWeight: 700, background: 'rgba(99,102,241,0.12)', color: '#a5b4fc', border: '1px solid rgba(99,102,241,0.3)', cursor: 'pointer', outline: 'none' }}>
                        Edit
                      </button>
                    </div>
                  )}
                </div>

                {/* Not sure — let Merlin recommend */}
                <div onClick={() => { setMerlinSolar(!merlinSolar); if (!merlinSolar) { setCarportSolarInterest('no'); setGroundSolarInterest('no'); } }}
                  style={{
                    padding: '18px 22px', borderRadius: 16, cursor: 'pointer', transition: 'all 0.2s',
                    background: merlinSolar ? 'rgba(99,102,241,0.06)' : '#0f172a',
                    border: merlinSolar ? '2px solid #6366f1' : '2px dashed rgba(99,102,241,0.1)',
                  }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <span style={{ fontSize: 28 }}>🤔</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 15, fontWeight: 800, color: merlinSolar ? '#a5b4fc' : '#6366f1' }}>Not sure — let Merlin decide</div>
                      <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>We'll analyze your site and recommend</div>
                    </div>
                    <div style={{
                      width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      background: merlinSolar ? '#6366f1' : '#334155', transition: 'all 0.2s',
                      fontSize: 14, fontWeight: 900, color: '#fff',
                    }}>{merlinSolar ? '✓' : ''}</div>
                  </div>
                </div>

                {/* ═══ DIMENSION POPUP ═══ */}
                {solarDimPopup && (
                  <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }} onClick={() => setSolarDimPopup('')}>
                    <div onClick={e => e.stopPropagation()} style={{ background: '#1e293b', border: '1px solid #475569', borderRadius: 20, padding: '28px 32px', width: 420, maxWidth: '90vw', boxShadow: '0 24px 64px rgba(0,0,0,0.6)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <span style={{ fontSize: 32 }}>{solarDimPopup === 'carport' ? '🅿️' : '🌿'}</span>
                          <div>
                            <div style={{ fontSize: 18, fontWeight: 800, color: '#fff' }}>{solarDimPopup === 'carport' ? 'Carport Canopy' : 'Ground-Mount Area'}</div>
                            <div style={{ fontSize: 13, color: '#94a3b8' }}>{solarDimPopup === 'carport' ? 'Approximate canopy dimensions' : 'Available lot area'}</div>
                          </div>
                        </div>
                        <button onClick={() => setSolarDimPopup('')} style={{ width: 32, height: 32, borderRadius: '50%', background: '#334155', border: 'none', color: '#cbd5e1', fontSize: 18, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', outline: 'none' }}>✕</button>
                      </div>
                      <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end', marginBottom: 20 }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 12, color: '#94a3b8', fontWeight: 600, marginBottom: 6 }}>Length (ft)</div>
                          <input type="number" value={solarDimPopup === 'carport' ? carportLength : groundLength}
                            onChange={e => solarDimPopup === 'carport' ? setCarportLength(parseInt(e.target.value) || 0) : setGroundLength(parseInt(e.target.value) || 0)}
                            style={{ width: '100%', padding: '12px 14px', borderRadius: 10, fontSize: 18, fontWeight: 700, background: '#0f172a', border: '2px solid #334155', color: '#fff', outline: 'none', fontFamily: 'inherit' }}
                            onFocus={e => e.target.style.borderColor = '#6366f1'} onBlur={e => e.target.style.borderColor = '#334155'} />
                        </div>
                        <span style={{ fontSize: 20, color: '#475569', paddingBottom: 14 }}>×</span>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 12, color: '#94a3b8', fontWeight: 600, marginBottom: 6 }}>Width (ft)</div>
                          <input type="number" value={solarDimPopup === 'carport' ? carportWidth : groundWidth}
                            onChange={e => solarDimPopup === 'carport' ? setCarportWidth(parseInt(e.target.value) || 0) : setGroundWidth(parseInt(e.target.value) || 0)}
                            style={{ width: '100%', padding: '12px 14px', borderRadius: 10, fontSize: 18, fontWeight: 700, background: '#0f172a', border: '2px solid #334155', color: '#fff', outline: 'none', fontFamily: 'inherit' }}
                            onFocus={e => e.target.style.borderColor = '#6366f1'} onBlur={e => e.target.style.borderColor = '#334155'} />
                        </div>
                      </div>
                      <div style={{ padding: '12px 16px', borderRadius: 10, background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 20 }}>
                        <span style={{ fontSize: 12, color: '#94a3b8' }}>Total area:</span>
                        <span style={{ fontSize: 20, fontWeight: 900, color: '#a5b4fc' }}>
                          {(solarDimPopup === 'carport' ? carportLength * carportWidth : groundLength * groundWidth).toLocaleString()} sf
                        </span>
                      </div>
                      <button onClick={() => setSolarDimPopup('')} style={{ width: '100%', padding: '14px', borderRadius: 12, background: '#6366f1', border: 'none', color: '#fff', fontSize: 15, fontWeight: 800, cursor: 'pointer', outline: 'none' }}>Done</button>
                    </div>
                  </div>
                )}
              </div>
            </QuestionSection>


            <QuestionSection activeQuestion={activeQuestion} questionRefs={questionRefs} questionNumber={15} title="EV charging on site?" isRequired>
              <div className="max-w-2xl">
                {/* No / Yes — same card style as Q14 */}
                <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
                  {[{ id: 'no', label: 'No', bg: 'rgba(99,102,241,0.18)', border: '#6366f1', color: '#a5b4fc', badge: '#6366f1' }, { id: 'yes', label: 'Yes', bg: 'rgba(99,102,241,0.18)', border: '#6366f1', color: '#a5b4fc', badge: '#6366f1' }].map(opt => (
                    <button key={opt.id} onClick={() => {
                      if (hasEvChargers === opt.id) { setHasEvChargers(''); }
                      else {
                        setHasEvChargers(opt.id);
                        if (opt.id === 'yes') { setEvChargerPopup(true); }
                        else { markCompleted(15); }
                      }
                    }}
                      style={{ flex: 1, padding: 16, borderRadius: 10, textAlign: 'center', cursor: 'pointer', position: 'relative', background: hasEvChargers === opt.id ? opt.bg : '#0f172a', border: hasEvChargers === opt.id ? `2px solid ${opt.border}` : '1px solid #1e293b', transition: 'all 0.15s' }}>
                      <span style={{ fontSize: 14, fontWeight: 700, color: hasEvChargers === opt.id ? opt.color : '#fff' }}>{opt.label}</span>
                      {hasEvChargers === opt.id && (
                        <div style={{ position: 'absolute', top: -8, right: -8, width: 22, height: 22, borderRadius: 11, background: opt.badge, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 2px 8px ${opt.badge}66`, zIndex: 2 }}>
                          <Check className="w-3.5 h-3.5 text-white" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>

                {/* Summary line when Yes + configured */}
                {hasEvChargers === 'yes' && (parseInt(l2Chargers || 0) > 0 || parseInt(dcChargers || 0) > 0) && (
                  <div onClick={() => setEvChargerPopup(true)}
                    style={{ padding: '14px 16px', borderRadius: 10, background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.3)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12, transition: 'all 0.15s' }}>
                    <span style={{ fontSize: 14, color: '#94a3b8' }}>⚡</span>
                    <span style={{ fontSize: 14, fontWeight: 600, color: '#e2e8f0', flex: 1 }}>
                      {parseInt(l2Chargers || 0) > 0 ? `${l2Chargers} × Level 2` : ''}
                      {parseInt(l2Chargers || 0) > 0 && parseInt(dcChargers || 0) > 0 ? '  ·  ' : ''}
                      {parseInt(dcChargers || 0) > 0 ? `${dcChargers} × DC Fast` : ''}
                    </span>
                    <span style={{ fontSize: 12, fontWeight: 600, color: '#6366f1' }}>Edit</span>
                  </div>
                )}

              </div>
            </QuestionSection>

          </div>
        </div>

        {/* Floating scroll-to-top button - appears when scrolled down */}
        {activeQuestion > 3 && (
          <button
            onClick={() => {
              const container = scrollContainerRef.current || document.getElementById('questions-scroll-container');
              if (container) container.scrollTo({ top: 0 });
            }}
            className="absolute bottom-6 right-6 z-50 w-11 h-11 bg-slate-700/90 hover:bg-indigo-600 border border-slate-600 hover:border-indigo-500 text-slate-300 hover:text-white rounded-full flex items-center justify-center shadow-lg transition-all backdrop-blur-sm"
            title="Scroll to top to edit answers"
          >
            <ChevronLeft className="w-5 h-5 rotate-90" />
          </button>
        )}

      </div>
      </div>

      {/* Footer - Full Width Bottom Bar */}
      <div className="flex-shrink-0 grid grid-cols-3">
        <div className="bg-indigo-950 border-r border-indigo-800 flex items-center justify-center px-4 py-4">
          <button onClick={onBack}
            className="flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-600">
            <ChevronLeft className="w-5 h-5" /> Back
          </button>
        </div>
        <div className="col-span-2 bg-black">
          <div className="flex justify-end items-center px-6 py-4">
            <button onClick={() => handleContinue()}
              className={`flex items-center gap-2 px-8 py-3 rounded-xl font-bold transition shadow-md ${
                activeQuestion >= 16 && completedQuestions.has(15)
                  ? 'bg-indigo-500 text-white hover:bg-indigo-600'
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed'
              }`}>
              Continue <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* ── EV Charger Popup Modal — rendered at root to avoid overflow clipping ── */}
      {evChargerPopup && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}
          onClick={() => {
            setEvChargerPopup(false);
            if (hasEvChargers === 'yes') {
              if (parseInt(l2Chargers || 0) === 0 && parseInt(dcChargers || 0) === 0) setHasEvChargers('no');
              markCompleted(15);
            }
          }}>
          <div onClick={e => e.stopPropagation()} style={{ background: '#1e293b', border: '1px solid #475569', borderRadius: 20, padding: '28px 32px', width: 420, maxWidth: '90vw', boxShadow: '0 24px 64px rgba(0,0,0,0.6)' }}>
            <div style={{ fontSize: 18, fontWeight: 800, color: '#fff', marginBottom: 6 }}>⚡ EV Charger Details</div>
            <div style={{ fontSize: 13, color: '#94a3b8', marginBottom: 20 }}>How many chargers and what type?</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '16px', background: '#0f172a', border: '1px solid #334155', borderRadius: 12, marginBottom: 10 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#e2e8f0' }}>Level 2</div>
                <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>7-19 kW each</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <button onClick={() => setL2Chargers(prev => Math.max(0, parseInt(prev || 0) - 1).toString())}
                  style={{ width: 36, height: 36, borderRadius: 10, border: '2px solid #334155', background: '#0f172a', color: '#cbd5e1', fontSize: 18, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>−</button>
                <span style={{ fontSize: 24, fontWeight: 900, color: '#a5b4fc', minWidth: 40, textAlign: 'center' }}>{l2Chargers || '0'}</span>
                <button onClick={() => setL2Chargers(prev => Math.min(20, parseInt(prev || 0) + 1).toString())}
                  style={{ width: 36, height: 36, borderRadius: 10, border: '2px solid #334155', background: '#0f172a', color: '#cbd5e1', fontSize: 18, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+</button>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '16px', background: '#0f172a', border: '1px solid #334155', borderRadius: 12, marginBottom: 20 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#e2e8f0' }}>DC Fast</div>
                <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>50-350 kW each</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <button onClick={() => setDcChargers(prev => Math.max(0, parseInt(prev || 0) - 1).toString())}
                  style={{ width: 36, height: 36, borderRadius: 10, border: '2px solid #334155', background: '#0f172a', color: '#cbd5e1', fontSize: 18, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>−</button>
                <span style={{ fontSize: 24, fontWeight: 900, color: '#a5b4fc', minWidth: 40, textAlign: 'center' }}>{dcChargers || '0'}</span>
                <button onClick={() => setDcChargers(prev => Math.min(10, parseInt(prev || 0) + 1).toString())}
                  style={{ width: 36, height: 36, borderRadius: 10, border: '2px solid #334155', background: '#0f172a', color: '#cbd5e1', fontSize: 18, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+</button>
              </div>
            </div>
            <button onClick={() => {
                setEvChargerPopup(false);
                // If both counts are 0, revert to No
                if (parseInt(l2Chargers || 0) === 0 && parseInt(dcChargers || 0) === 0) {
                  setHasEvChargers('no');
                }
                markCompleted(15);
              }}
              style={{ width: '100%', padding: '14px', borderRadius: 12, border: 'none', cursor: 'pointer',
                background: 'linear-gradient(135deg, #6366f1, #4f46e5)', color: '#fff',
                fontSize: 15, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                boxShadow: '0 4px 12px rgba(99,102,241,0.3)' }}>
              <Check className="w-4 h-4" /> Confirm EV Chargers
            </button>
          </div>
        </div>
      )}
    </div>
  );
};



// ═══════════════════════════════════════════════════════════════════════════════
// WIZARD A COMPONENT - Steps 1, 2 & 3
// Props: onComplete({ locationData, selectedIndustry, annualBill, formData })
// ═══════════════════════════════════════════════════════════════════════════════
function EnergyWizardSteps1_3({ onComplete, onBackToStep1 }) {
  const [currentStep, setCurrentStep] = useState(1);
  const [ssotTrackerOpen, setSsotTrackerOpen] = useState(false);
  const [showTrueQuoteModal, setShowTrueQuoteModal] = useState(false);
  // MOB-1: JS-level responsive hook for WizA
  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);
  // ACC-3: Step change announcement for screen readers
  const [stepAnnouncement, setStepAnnouncement] = useState('');
  const stepNamesA = { 1: 'Location & Business', 2: 'Industry Details', 3: 'Facility Assessment' };
  const [zipCode, setZipCode] = useState('');
  const [citySuggestions, setCitySuggestions] = useState([]);
  const [locationData, setLocationData] = useState(null);
  const [liveDataStatus, setLiveDataStatus] = useState(null); // null | 'fetching' | 'done' | 'failed'
  const fetchingRef = useRef(false); // FIX #87: useRef avoids stale closure
  const fetchVersionRef = useRef(0); // FIX #90: version counter prevents stale zip data overwrite
  const liveDataRef = useRef(null); // FIX #94: stores live data for onComplete handoff even if state hasn't updated yet

  // ═══ LIVE DATA ENRICHMENT — fetches from free APIs after zip lookup ═══
  // Non-blocking: fires in background, merges results when ready
  const fetchLiveData = useCallback(async (locData) => {
    if (!locData || fetchingRef.current) return;
    const state = locData.state || locData.utility?.state;
    if (!state) return;

    // FIX #90: Bump version — if user re-enters zip, old fetch results are discarded
    const thisVersion = ++fetchVersionRef.current;

    setLiveDataStatus('fetching');
    fetchingRef.current = true;

    try {
      // ── Phase 1: Get ZIP-level coordinates via Census Geocoding (FREE, no key) ──
      // This replaces state centroids with actual ZIP centroid lat/lng
      // Also returns FIPS census tract for §30C energy community auto-lookup
      const zip = locData.zip || locData._zip || '';
      let censusCoords = null;
      if (zip && zip.length === 5) {
        try { censusCoords = await fetchZipCoords(zip); } catch (e) { /* fallback to state centroid */ }
      }

      // Use Census ZIP coords if available, otherwise state centroid
      const fallback = STATE_COORDS[state] || [42.4, -83.5];
      const lat = censusCoords?.lat || fallback[0];
      const lng = censusCoords?.lng || fallback[1];
      const coordSource = censusCoords ? 'census_zip' : 'state_centroid';

      // ── Phase 2: Fire PVWatts + NASA + EIA + OpenEI in parallel ──
      const [pvResult, nasaResult, eiaResult, openeiResult] = await Promise.allSettled([
        fetchSolarProduction(lat, lng, 1), // 1kW to get per-kW production — now at ZIP-level coords
        fetchNASAPower(lat, lng),           // Climate data at ZIP-level coords
        fetchUtilityRate(state),            // State-level EIA rate
        fetchUtilityByZip(zip),            // Utility-specific rate via OpenEI (needs API key)
      ]);

      const pv = pvResult.status === 'fulfilled' ? pvResult.value : null;
      const nasa = nasaResult.status === 'fulfilled' ? nasaResult.value : null;
      const eia = eiaResult.status === 'fulfilled' ? eiaResult.value : null;
      const openei = openeiResult.status === 'fulfilled' ? openeiResult.value : null;

      const anySuccess = pv || nasa || eia || openei;
      if (!anySuccess) { setLiveDataStatus('failed'); fetchingRef.current = false; return; }
      // FIX #90: Discard if user entered new zip while we were fetching
      if (thisVersion !== fetchVersionRef.current) { fetchingRef.current = false; return; }

      // ── Phase 3: Energy community auto-lookup from Census tract ──
      let energyCommunity = null;
      if (censusCoords?.fipsTract || censusCoords?.fipsCounty) {
        energyCommunity = checkEnergyCommunity(censusCoords.fipsTract, censusCoords.fipsCounty);
      }

      setLocationData(prev => {
        if (!prev) return prev;
        const updated = { ...prev };

        // Override solar production with PVWatts (now at ZIP-level precision)
        if (pv) {
          updated.solar = {
            ...updated.solar,
            annualProduction: pv.annualProductionPerKW,
            peakSunHours: pv.peakSunHours,
            _liveSource: coordSource === 'census_zip' ? 'NREL PVWatts v8 (ZIP-level)' : 'NREL PVWatts v8 (state centroid)',
            _monthlyProduction: pv.monthlyProduction,
            _capacityFactor: pv.capacityFactor,
            _coordSource: coordSource,
          };
        }

        // Enhance with NASA climate data
        if (nasa) {
          updated._nasaPower = nasa;
          updated.solar = {
            ...updated.solar,
            _tempDeratingFactor: nasa.tempDeratingFactor,
            _avgGHI: nasa.avgGHI,
          };
        }

        // Override utility rate — prefer OpenEI (utility-specific) over EIA (state-level)
        if (openei && openei.avgRate) {
          // OpenEI gives utility-specific rate for this exact ZIP
          updated.utility = {
            ...updated.utility,
            electric: {
              ...updated.utility?.electric,
              utility: openei.utilityName,
              avgRate: openei.avgRate,
              peakRate: openei.peakRate || updated.utility?.electric?.peakRate,
              offPeakRate: openei.offPeakRate || updated.utility?.electric?.offPeakRate,
              demandCharge: openei.demandCharge || updated.utility?.electric?.demandCharge,
              _liveSource: `OpenEI URDB — ${openei.rateName}`,
              _isTOU: openei.isTOU,
              _sellRate: openei.sellRate, // NEM export rate if available
              _priorRate: updated.utility?.electric?.avgRate,
            }
          };
          updated.electric = {
            ...updated.electric,
            rate: openei.avgRate,
            _liveSource: 'OpenEI',
          };
        } else if (eia) {
          // Fallback to EIA state-level rate
          updated.utility = {
            ...updated.utility,
            electric: {
              ...updated.utility?.electric,
              avgRate: eia.latestRate,
              _liveSource: 'EIA Open Data',
              _period: eia.period,
              _yoyChange: eia.yoyChangePct,
              _priorRate: updated.utility?.electric?.avgRate,
            }
          };
          updated.electric = {
            ...updated.electric,
            rate: eia.latestRate,
            _liveSource: 'EIA',
          };
        }

        // Census tract + energy community data
        if (censusCoords) {
          updated._censusData = censusCoords;
          updated._fipsTract = censusCoords.fipsTract;
          updated._fipsCounty = censusCoords.fipsCounty;
          updated._countyName = censusCoords.countyName;
        }
        if (energyCommunity) {
          updated._energyCommunity = energyCommunity;
        }

        updated._liveData = { pv, nasa, eia, openei, censusCoords, energyCommunity, coordSource, fetchedAt: new Date().toISOString() };
        updated._hasLiveData = true;
        updated._coordSource = coordSource;
        liveDataRef.current = updated; // FIX #94: persist for onComplete handoff
        return updated;
      });

      setLiveDataStatus('done');
      fetchingRef.current = false;
    } catch (err) {
      console.warn('[WizardA] Live data fetch error:', err);
      setLiveDataStatus('failed');
      fetchingRef.current = false;
    }
  }, []); // No dependencies — uses ref for guard, reads locData arg
  const [goalScores, setGoalScores] = useState([]);
  const [selectedIndustry, setSelectedIndustry] = useState(null);
  const [formData, setFormData] = useState({});
  
  // Generic Step 3 - Progressive Question State
  const [genQ, setGenQRaw] = useState(1);
  const setGenQ = (n) => setGenQRaw(prev => Math.max(prev, n));
  const genScrollRef = useRef(null);
  const genQRefs = useRef({});
  const scrollToGenQ = (n) => {
    // DISABLED: All auto-scroll removed
    return;
  };
  const genAllAnswered = () => {
    return formData.facilitySqFt && formData.roofArea && formData.monthlyElectricBill 
      && formData.hasGasLine !== undefined && formData.operatingHours && formData.backupPriority
      && formData.entityType; // Q7: Required for accurate tax calculations
  };

  // ============================================
  const [annualBill, setAnnualBill] = useState(120000);
  const [billUploadData, setBillUploadData] = useState(null); // { file, fileName, extractedData: { monthlyBill, monthlyKWh, billingType, demandKW }, source: 'upload'|'api', verified: bool }
  const [ownershipType, setOwnershipType] = useState('purchase');
  const [hoveredCard, setHoveredCard] = useState(null);
  const [lookupStatus, setLookupStatus] = useState(null);
  const [locationConfirmed, setLocationConfirmed] = useState(false);
  const [showDataCards, setShowDataCards] = useState(false);
  const [step1City, setStep1City] = useState('');

  // EPC Site Scan state
  const [epcPhoto, setEpcPhoto] = useState(null);         // { file, previewUrl, name }
  const [epcAnalysisStatus, setEpcAnalysisStatus] = useState('idle'); // 'idle' | 'loading' | 'done' | 'error'
  const [epcAnalysis, setEpcAnalysis] = useState(null);
  const [epcAnalysisError, setEpcAnalysisError] = useState('');
  const [epcGpsStatus, setEpcGpsStatus] = useState('idle'); // 'idle' | 'loading' | 'done' | 'error'
  const [epcGpsLabel, setEpcGpsLabel] = useState('');     // Human-readable reverse-geocode result
  const [marketRegion, setMarketRegion] = useState('us'); // 'us' or 'international'
  const [step1State, setStep1State] = useState('');
  // Step 1 ZIP Database lookup
  const step1ZipData = zipDatabase[zipCode] || null;
  // FIX #95: Merge live API data into sidebar display. locationData has live EIA/PVWatts values,
  // step1ZipData is raw static. Prefer locationData fields when they exist.
  const step1LocationData = locationConfirmed ? (locationData ? {
    ...step1ZipData,
    electric: { ...step1ZipData?.electric, rate: locationData.electric?.rate || step1ZipData?.electric?.rate },
    solar: { ...step1ZipData?.solar, peakSunHours: locationData.solar?.peakSunHours || step1ZipData?.solar?.peakSunHours, annualOutput: locationData.solar?.annualProduction || step1ZipData?.solar?.annualOutput },
  } : step1ZipData) : null;

  const handleEpcPhotoChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (epcPhoto?.previewUrl) URL.revokeObjectURL(epcPhoto.previewUrl);
    const previewUrl = URL.createObjectURL(file);
    setEpcPhoto({ file, previewUrl, name: file.name });
    setEpcAnalysis(null);
    setEpcAnalysisError('');
    setEpcAnalysisStatus('loading');

    try {
      const imageDataUrl = await readFileAsDataUrl(file);
      const analysis = await analyzeEpcSitePhoto({
        file,
        imageDataUrl,
        location: {
          zip: zipCode,
          city: step1City,
          state: step1State,
          gpsLabel: epcGpsLabel,
          confirmed: locationConfirmed,
        },
      });
      setEpcAnalysis(analysis);
      setEpcAnalysisStatus('done');
    } catch (error) {
      setEpcAnalysisError(error.message || 'Could not analyze site photo.');
      setEpcAnalysisStatus('error');
    }
  };
  
  // City lookup map for Step 1
  const step1CityToZip = {};
  Object.entries(zipDatabase).forEach(([zip, data]) => {
    step1CityToZip[data.city.toLowerCase()] = zip;
  });

  // Step 1 lookup handler
  const handleStep1Lookup = () => {
    setLookupStatus('loading');
    setTimeout(() => {
      let zipData = zipDatabase[zipCode];
      let foundZip = zipCode;
      
      if (!zipData && step1City) {
        const cityLower = step1City.toLowerCase().trim();
        foundZip = step1CityToZip[cityLower];
        if (foundZip) {
          zipData = zipDatabase[foundZip];
        }
      }
      
      if (zipData) {
        setZipCode(foundZip);
        setStep1City(zipData.city);
        setStep1State(zipData.state);
        setLookupStatus('success');
        setLocationConfirmed(true);
        // Set locationData in normalized format matching getUtilityByZip structure
        // so calculations downstream always receive consistent data shape
        const normalizedUtility = {
          electric: {
            utility: zipData.utility || 'Local Electric Utility',
            avgRate: zipData.electric?.rate || 0.12,
            peakRate: zipData.electric?.peakRate || 0.15,
            offPeakRate: zipData.electric?.offPeakRate || 0.08,
            demandCharge: zipData.electric?.demandCharge || 10,
            logo: null
          },
          gas: {
            utility: zipData.gasUtility || 'Local Gas Utility',
            rate: zipData.gas?.rate || 1.00,
            deliveryCharge: 0.40,
            avgMonthly: 60,
            logo: null
          },
          state: zipData.state,
          stateName: zipData.state,
          city: zipData.city,
          region: `${zipData.city}, ${zipData.state}`
        };
        const normalizedSolar = SOLAR_DATA[zipData.state] || SOLAR_DATA['default'];
        setLocationData({
          zipCode: foundZip,
          utility: normalizedUtility,
          // Merge state-level SOLAR_DATA (has irradiance, annualProduction for calcs)
          // with zip-level solar (has rating, peakSunHours for display)
          solar: { ...normalizedSolar, ...(zipData.solar || {}) },
          _solarState: normalizedSolar,
          // Spread flat zipDatabase fields at top level so Step 3 sidebar
          // can read the same paths as Step 1 (e.g. locationData.electric.rate)
          city: zipData.city,
          state: zipData.state,
          electric: zipData.electric,
          gas: zipData.gas,
          weather: zipData.weather,
          grid: zipData.grid,
          incentives: zipData.incentives,
          battery: zipData.battery,
          _zipData: zipData
        });
        // ═══ LIVE DATA: Fetch Census Geocoding + PVWatts + NASA + EIA + OpenEI ═══
        fetchingRef.current = false; // Reset for new zip entry
        liveDataRef.current = null; // FIX #101: Clear stale live data from previous zip
        const _locForFetch = {
          state: zipData.state,
          zip: zipCode, // FIX #196: Pass ZIP for Census Geocoding → ZIP-level PVWatts coords
          utility: { electric: { avgRate: zipData.electric?.rate } },
          solar: { ...( SOLAR_DATA[zipData.state] || SOLAR_DATA['default']), ...(zipData.solar || {}) },
          _zipData: zipData,
        };
        fetchLiveData(_locForFetch);
        setTimeout(() => {
          const savingsSection = document.getElementById('savings-section');
          if (savingsSection) {
            // DISABLED: savingsSection scroll removed
          }
        }, 800);
      } else {
        // FIX #35: State-level fallback for 19+ states without zip database coverage
        // Try to determine state from zip prefix and use STATE_UTILITIES as fallback
        const stateFromPrefix = ZIP_PREFIX_TO_STATE[foundZip?.substring(0, 3)];
        const stateData = stateFromPrefix ? STATE_UTILITIES[stateFromPrefix] : null;
        if (stateData) {
          setStep1State(stateFromPrefix);
          setStep1City(stateData.stateName || stateFromPrefix);
          setLookupStatus('success');
          setLocationConfirmed(true);
          const normalizedSolar = SOLAR_DATA[stateFromPrefix] || SOLAR_DATA['default'];
          setLocationData({
            zipCode: foundZip,
            utility: { electric: stateData.electric, gas: stateData.gas, state: stateFromPrefix, stateName: stateData.stateName, city: stateData.stateName, region: stateData.stateName },
            solar: normalizedSolar,
            _solarState: normalizedSolar,
            city: stateData.stateName,
            state: stateFromPrefix,
            electric: stateData.electric,
            gas: stateData.gas,
            // FIX #62: Include weather/grid/incentives placeholders for data shape consistency
            weather: { hail: 2, wind: 2, tornado: 1, hurricane: 1, lightning: 2, snow: 2, heat: 2, flood: 1 },
            grid: { reliability: 3 },
            incentives: {},
            battery: {},
            _stateFallback: true
          });
          // ═══ LIVE DATA: Fetch for state fallback path too ═══
          fetchingRef.current = false; // Reset for new zip
          liveDataRef.current = null; // FIX #101: Clear stale data
          fetchLiveData({ state: stateFromPrefix, zip: zipCode, utility: { electric: stateData.electric } });
        } else {
          setLookupStatus('notfound');
        }
      }
      setTimeout(() => setLookupStatus(null), 2000);
    }, 500);
  };

  const handleStep1KeyDown = (e) => {
    if (e.key === 'Enter') {
      handleStep1Lookup();
    }
  };

  
  // ============================================
  // BUSINESS LOOKUP STATE (Google Places API Integration Point)
  // ============================================
  const [businessSearchQuery, setBusinessSearchQuery] = useState('');
  const [businessPredictions, setBusinessPredictions] = useState([]);
  const [showBusinessDropdown, setShowBusinessDropdown] = useState(false);
  const [selectedBusiness, setSelectedBusiness] = useState(null);
  const [businessConfirmed, setBusinessConfirmed] = useState(false);
  // Multi-location picker modal (for chains/franchises with multiple locations)
  const [showLocationPickerModal, setShowLocationPickerModal] = useState(false);
  const [showDisclaimer, setShowDisclaimer] = useState(false);
  const [trueQuoteTabMain, setTrueQuoteTabMain] = useState('why');
  const [multiLocationResults, setMultiLocationResults] = useState([]);
  
  // ============================================
  // GOOGLE PLACES API INTEGRATION FUNCTIONS
  // Replace these placeholders with actual API calls
  // ============================================
  
  /**
   * Search for businesses using Google Places Autocomplete API
   * @param {string} query - Business name search query
   * @param {object} location - { lat, lng } from locationData
   * @returns {Promise<array>} - Array of predictions
   * 
   * API Integration:
   * 1. Initialize Google Maps JavaScript API with Places library
   * 2. Create AutocompleteService instance
   * 3. Call getPlacePredictions with:
   *    - input: query
   *    - location: new google.maps.LatLng(lat, lng)
   *    - radius: 50000 (50km)
   *    - types: ['establishment']
   */
  const searchBusinesses = async (query, location) => {
    if (!query || query.length < 3 || !location) {
      setBusinessPredictions([]);
      setShowBusinessDropdown(false);
      return;
    }
    
    const city = location.utility?.city || location.city || 'City';
    const state = location.utility?.state || 'ST';
    
    // PLACEHOLDER: Replace with actual Google Places API call
    // Mock data simulates different scenarios:
    // - Common business names (Starbucks, McDonald's) return multiple same-name locations
    // - Unique names return single/few results
    
    const commonChains = ['starbucks', 'mcdonalds', 'subway', 'walmart', 'target', 'cvs', 'walgreens', 'shell', 'chevron', 'car wash'];
    const isChainSearch = commonChains.some(chain => query.toLowerCase().includes(chain));
    
    let mockPredictions;
    
    if (isChainSearch) {
      // Simulate multiple locations for chain businesses
      mockPredictions = [
        {
          placeId: 'mock_chain_1',
          name: query,
          address: `123 Main St, ${city}, ${state} 90210`,
          distance: '0.2 mi',
          rating: 4.2,
          reviewCount: 156
        },
        {
          placeId: 'mock_chain_2', 
          name: query,
          address: `456 Oak Ave, ${city}, ${state} 90210`,
          distance: '0.8 mi',
          rating: 4.5,
          reviewCount: 89
        },
        {
          placeId: 'mock_chain_3',
          name: query,
          address: `789 Elm Blvd, ${city}, ${state} 90210`,
          distance: '1.4 mi',
          rating: 3.9,
          reviewCount: 234
        },
        {
          placeId: 'mock_chain_4',
          name: query,
          address: `321 Pine Dr, ${city}, ${state} 90210`,
          distance: '2.1 mi',
          rating: 4.1,
          reviewCount: 67
        },
        {
          placeId: 'mock_chain_5',
          name: query,
          address: `555 Cedar Ln, ${city}, ${state} 90210`,
          distance: '3.5 mi',
          rating: 4.4,
          reviewCount: 112
        }
      ];
    } else {
      // Unique business - fewer results with varied names
      mockPredictions = [
        {
          placeId: 'mock_1',
          name: `${query}`,
          address: `123 Main St, ${city}, ${state} 90210`,
          distance: '0.3 mi',
          rating: 4.3,
          reviewCount: 78
        },
        {
          placeId: 'mock_2', 
          name: `${query} Express`,
          address: `456 Oak Ave, ${city}, ${state} 90210`,
          distance: '1.2 mi',
          rating: 4.1,
          reviewCount: 45
        },
        {
          placeId: 'mock_3',
          name: `${query} Premium`,
          address: `789 Elm Blvd, ${city}, ${state} 90210`,
          distance: '2.5 mi',
          rating: 4.6,
          reviewCount: 123
        }
      ];
    }
    
    setBusinessPredictions(mockPredictions);
    
    // Check if multiple locations have same name (chain/franchise scenario)
    const firstName = mockPredictions[0]?.name.toLowerCase();
    const sameNameCount = mockPredictions.filter(p => 
      p.name.toLowerCase() === firstName
    ).length;
    
    if (sameNameCount >= 3) {
      // Multiple same-name locations - show modal picker instead of dropdown
      setMultiLocationResults(mockPredictions);
      setShowLocationPickerModal(true);
      setShowBusinessDropdown(false);
    } else {
      // Different names - show inline dropdown
      setShowBusinessDropdown(mockPredictions.length > 0);
    }
  };
  
  /**
   * Check if multiple locations have the same/similar name
   * If so, show the location picker modal instead of inline dropdown
   */
  const handleShowLocationPicker = () => {
    if (businessPredictions.length > 0) {
      // Check for same-name locations (chains/franchises)
      const firstName = businessPredictions[0].name.toLowerCase();
      const sameNameCount = businessPredictions.filter(p => 
        p.name.toLowerCase() === firstName
      ).length;
      
      if (sameNameCount >= 3) {
        // Multiple same-name locations - show modal
        setMultiLocationResults(businessPredictions);
        setShowLocationPickerModal(true);
        setShowBusinessDropdown(false);
      }
    }
  };
  
  /**
   * Get detailed place information from Google Places Details API
   * @param {string} placeId - Google Place ID
   * @returns {Promise<object>} - Place details including photo, rating, etc.
   * 
   * API Integration:
   * 1. Create PlacesService instance
   * 2. Call getDetails with:
   *    - placeId: placeId
   *    - fields: ['name', 'formatted_address', 'geometry', 'photos', 'rating', 'user_ratings_total', 'website', 'formatted_phone_number']
   */
  const getPlaceDetails = async (placeId, prediction) => {
    // PLACEHOLDER: Replace with actual Google Places Details API call
    // For now, return mock details based on prediction
    const mockDetails = {
      placeId: placeId,
      name: prediction.name,
      address: prediction.address,
      formattedAddress: prediction.address,
      // Mock photo URL - replace with actual Google Places photo reference
      photoUrl: null, // Will show placeholder
      rating: prediction.rating || (4 + Math.random()).toFixed(1),
      reviewCount: prediction.reviewCount || Math.floor(50 + Math.random() * 200),
      website: null,
      phone: null,
      lat: locationData?.utility?.lat || locationData?.lat || 34.0522,
      lng: locationData?.utility?.lng || locationData?.lng || -118.2437
    };
    
    return mockDetails;
  };
  
  /**
   * Handle business selection from dropdown or modal
   */
  const handleBusinessSelect = async (prediction) => {
    setBusinessSearchQuery(prediction.name);
    setBusinessName(prediction.name);
    setShowBusinessDropdown(false);
    setShowLocationPickerModal(false);
    setBusinessPredictions([]);
    setMultiLocationResults([]);
    
    // Fetch full place details
    const details = await getPlaceDetails(prediction.placeId, prediction);
    setSelectedBusiness(details);
    
    // Auto-fill street address from the selected location
    if (details.formattedAddress) {
      setStreetAddress(details.formattedAddress);
    }
  };
  
  /**
   * Confirm the selected business
   */
  const handleConfirmBusiness = () => {
    setBusinessConfirmed(true);
  };
  
  /**
   * Clear/change business selection
   */
  const handleClearBusiness = () => {
    setSelectedBusiness(null);
    setBusinessConfirmed(false);
    setBusinessSearchQuery('');
    setBusinessName('');
    setStreetAddress('');
    setShowLocationPickerModal(false);
    setMultiLocationResults([]);
  };
  
  const handleLocationLookup = async () => {
    if (!zipCode || zipCode.length < 5) return;
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 800));
    const utility = getUtilityByZip(zipCode);
    const solar = SOLAR_DATA[utility.state] || SOLAR_DATA['default'];
    const zipData = zipDatabase[zipCode] || null;
    setLocationData({ 
      zipCode, utility, solar,
      // Flat fields for Step 3 sidebar compatibility
      city: zipData?.city || utility.city || '',
      state: zipData?.state || utility.state || '',
      electric: zipData?.electric || { rate: utility.electric?.avgRate || 0.12, peakRate: utility.electric?.peakRate || 0.15, offPeakRate: utility.electric?.offPeakRate || 0.08, level: 'Moderate', demandCharge: utility.electric?.demandCharge || 10 },
      gas: zipData?.gas || { rate: utility.gas?.rate || 1.00, level: 'Moderate' },
      weather: zipData?.weather || { risk: solar.weatherRisk || 'Moderate' },
      grid: zipData?.grid || { rating: '3/5', backupNeed: 'Medium' },
      incentives: zipData?.incentives || { total: 52, federal: 30, rating: 'Good' },
      battery: zipData?.battery || { recommended: false, roi: 'TBD' },
      _zipData: zipData
    });
    // Auto-populate city from lookup if we found one
    if (utility.city) {
      setCityInput(utility.city);
    } else if (utility.stateName) {
      setCityInput(utility.region?.split(',')[0] || '');
    }
    setShowCitySuggestions(false);
    setIsLoading(false);
  };
  
  const handleCityInputChange = (value) => {
    // Only allow letters, spaces, hyphens, and apostrophes (for cities like O'Fallon, Winston-Salem)
    const sanitized = value.replace(/[^a-zA-Z\s\-']/g, '');
    setCityInput(sanitized);
    // If city is being cleared, also clear ZIP and location data
    if (sanitized.length === 0) {
      setZipCode('');
      setLocationData(null);
      setCitySuggestions([]);
      setShowCitySuggestions(false);
    } else if (sanitized.length >= 2) {
      const suggestions = searchCities(sanitized);
      setCitySuggestions(suggestions);
      setShowCitySuggestions(suggestions.length > 0);
    } else {
      setCitySuggestions([]);
      setShowCitySuggestions(false);
    }
  };
  
  const handleCitySelect = async (cityData) => {
    // Only put city name in city box (not "City, ST")
    const cityNameOnly = cityData.display.split(',')[0].trim();
    setCityInput(cityNameOnly);
    setZipCode(cityData.zip);
    setShowCitySuggestions(false);
    setCitySuggestions([]);
    // Auto-lookup after city selection
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 500));
    const utility = getUtilityByZip(cityData.zip);
    const solar = SOLAR_DATA[utility.state] || SOLAR_DATA['default'];
    // Override city with just the city name
    utility.city = cityNameOnly;
    const zipData = zipDatabase[cityData.zip] || null;
    setLocationData({ 
      zipCode: cityData.zip, utility, solar,
      city: zipData?.city || cityNameOnly,
      state: zipData?.state || utility.state || '',
      electric: zipData?.electric || { rate: utility.electric?.avgRate || 0.12, peakRate: utility.electric?.peakRate || 0.15, offPeakRate: utility.electric?.offPeakRate || 0.08, level: 'Moderate', demandCharge: utility.electric?.demandCharge || 10 },
      gas: zipData?.gas || { rate: utility.gas?.rate || 1.00, level: 'Moderate' },
      weather: zipData?.weather || { risk: solar.weatherRisk || 'Moderate' },
      grid: zipData?.grid || { rating: '3/5', backupNeed: 'Medium' },
      incentives: zipData?.incentives || { total: 52, federal: 30, rating: 'Good' },
      battery: zipData?.battery || { recommended: false, roi: 'TBD' },
      _zipData: zipData
    });
    setIsLoading(false);
  };
  
  const handleStartOver = () => {
    if (onBackToStep1) { onBackToStep1(); return; }
    setCurrentStep(1);
    setBusinessName('');
    setStreetAddress('');
    // Reset business lookup
    setBusinessSearchQuery('');
    setBusinessPredictions([]);
    setShowBusinessDropdown(false);
    setSelectedBusiness(null);
    setBusinessConfirmed(false);
    setShowLocationPickerModal(false);
    setMultiLocationResults([]);
    // Reset US mode
    setZipCode('');
    setCityInput('');
    setCitySuggestions([]);
    setShowCitySuggestions(false);
    // Reset unified location data
    setLocationData(null);
    setGoalScores([]);
    setSelectedIndustry(null);
    setFormData({});
  };

  useEffect(() => {
    if (locationData) {
      setGoalScores(calculateGoalScores(locationData?.utility, locationData?.solar, selectedIndustry, locationData?.utility?.state));
    }
  }, [locationData, selectedIndustry]);

  const canProceed = () => {
    switch (currentStep) {
      case 1: return locationData !== null;
      case 2: return selectedIndustry !== null;
      case 3: {
        if (selectedIndustry?.id === 'carwash') {
          const hasFacilityType = formData.facilityType && formData.facilityType.length > 0;
          const hasOperatingInfo = formData.dailyVehicles > 0 || formData.estimatedBill > 0;
          const hasEquipment = formData.selectedEquipment && formData.selectedEquipment.length > 0; // FIX AUDIT-3b: ensure equipment selected
          return hasFacilityType && hasOperatingInfo && hasEquipment;
        } else {
          return !!(formData.facilitySqFt && formData.roofArea && formData.monthlyElectricBill 
            && formData.hasGasLine !== undefined && formData.operatingHours && formData.backupPriority
            && formData.entityType && formData.energyCommunity); // FIX AUDIT-3a: was missing energyCommunity — could silently lose 10% ITC bonus
        }
      }
      default: return true;
    }
  };

  
  const steps = [
    { num: 1, name: 'Location' },
    { num: 2, name: 'Industry' },
    { num: 3, name: 'Details' },
    { num: 4, name: 'Goals' },
    { num: 5, name: 'Options' },
    { num: 6, name: 'Summary' },
    { num: 7, name: 'Quote' }
  ];

  // Navigation Component - Fixed at bottom of screen
  const Navigation = ({ backStep, nextStep, nextLabel = 'Continue', nextDisabled = false, showStartOver = false }) => (
    <div className="fixed bottom-0 left-0 right-0 bg-black border-t border-slate-800 shadow-lg z-40" role="navigation" aria-label="Step navigation">
      <div className="flex justify-between items-center max-w-5xl mx-auto px-6 py-3">
        <button onClick={() => { if (backStep === 1 && onBackToStep1) { onBackToStep1(); } else if (backStep) { setCurrentStep(backStep); setStepAnnouncement(`Navigated back to Step ${backStep}: ${stepNamesA[backStep]}`); } }} disabled={!backStep}
          aria-label={backStep ? `Go back to Step ${backStep}` : 'No previous step'}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold transition ${backStep ? 'text-slate-300 hover:text-white hover:bg-slate-800 border border-slate-600' : 'text-slate-600 cursor-not-allowed'}`}>
          <ChevronLeft className="w-5 h-5" /> Back
        </button>
        
        <div className="flex gap-2">
          {showStartOver && (
            <button onClick={handleStartOver} aria-label="Start assessment over from beginning" className="flex items-center gap-2 px-5 py-2.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl font-semibold border border-slate-600 transition">
              <RotateCcw className="w-5 h-5" /> Start Over
            </button>
          )}
          {nextStep && (
            <button onClick={() => { setCurrentStep(nextStep); setStepAnnouncement(`Navigated to Step ${nextStep}: ${stepNamesA[nextStep]}`); }} disabled={nextDisabled}
              aria-label={nextDisabled ? 'Complete required fields to continue' : `Continue to Step ${nextStep}`}
              className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 disabled:bg-slate-800 disabled:text-slate-500 disabled:cursor-not-allowed transition shadow-md">
              {nextLabel} <ChevronRight className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );

  // Check if we should show car wash specific assessment (now Step 3)

  const showCarWashAssessment = currentStep === 3 && selectedIndustry?.id === 'carwash';


  return (
    <div className="min-h-screen bg-black flex flex-col" role="main" aria-label="Merlin Energy Assessment Wizard" style={{fontFamily: "'Inter', 'SF Pro Display', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"}}>
      {/* ACC-2: Skip-to-main link for keyboard/screen reader users */}
      <a href="#wizard-content" style={{ position: 'absolute', top: -999, left: -999, zIndex: 9999, background: '#6366f1', color: 'white', padding: '12px 24px', borderRadius: 8, fontWeight: 600, textDecoration: 'none' }} onFocus={(e) => { e.target.style.top = '12px'; e.target.style.left = '12px'; }} onBlur={(e) => { e.target.style.top = '-999px'; e.target.style.left = '-999px'; }}>Skip to main content</a>

      {/* ═══ TrueQuote™ Modal — Steps 1 & 2 (Step 3 has its own inside CarWashAssessment) ═══ */}
      {showTrueQuoteModal && !showCarWashAssessment && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
          onClick={e => { if (e.target === e.currentTarget) setShowTrueQuoteModal(false); }}>
          <div style={{ width: '100%', maxWidth: 680, maxHeight: '85vh', overflowY: 'auto', background: '#0f172a', border: '1px solid #334155', borderRadius: 20, padding: '24px 28px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ padding: '6px 14px', borderRadius: 8, background: 'rgba(15,23,42,0.8)', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#e2e8f0' }}>TrueQuote™</span>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#6366f1' }} />
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#94a3b8' }}>Verified</span>
                </div>
                <div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: '#fff' }}>TrueQuote™</div>
                  <div style={{ fontSize: 12, color: '#94a3b8' }}>The Quote That Shows Its Work</div>
                </div>
              </div>
              <button onClick={() => setShowTrueQuoteModal(false)} style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(255,255,255,0.06)', border: 'none', color: '#94a3b8', fontSize: 18, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'inherit' }}>✕</button>
            </div>
            <div style={{ display: 'flex', gap: 4, marginBottom: 20, borderBottom: '1px solid #334155', paddingBottom: 12 }}>
              {[{id:'why',icon:'⚠',label:'Why It Matters'},{id:'how',icon:'👁',label:'How It Works'},{id:'proof',icon:'🛡',label:'See The Proof'}].map(t => (
                <button key={t.id} onClick={() => setTrueQuoteTabMain(t.id)}
                  style={{ padding: '8px 16px', borderRadius: 8, border: 'none', background: trueQuoteTabMain === t.id ? 'rgba(99,102,241,0.12)' : 'transparent', color: trueQuoteTabMain === t.id ? '#6366f1' : '#94a3b8', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 6, transition: 'all 0.2s' }}>
                  {t.icon} {t.label}
                </button>
              ))}
            </div>
            {trueQuoteTabMain === 'why' && (
              <div>
                <div style={{ fontSize: 18, fontWeight: 700, color: '#fff', marginBottom: 12 }}>⚠ The Industry's Dirty Secret</div>
                <p style={{ fontSize: 14, color: '#cbd5e1', lineHeight: 1.6, marginBottom: 20 }}>When you get a BESS quote from most vendors, you're trusting a black box. They give you numbers, but <strong style={{ color: '#fff' }}>can't tell you where they came from</strong>. Banks know this. Investors know this. That's why projects stall.</p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div style={{ padding: 20, borderRadius: 14, background: 'rgba(255,255,255,0.03)', border: '1px solid #334155' }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#94a3b8', marginBottom: 16 }}>👻 Typical Competitor</div>
                    {['Battery System — $2,400,000','Annual Savings — $450,000','Payback Period — 5.3 years'].map((r,i) => (
                      <div key={i} style={{ padding: '10px 12px', marginBottom: 8, background: 'rgba(255,255,255,0.04)', borderRadius: 8, display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                        <span style={{ color: '#94a3b8' }}>{r.split('—')[0]}</span><span style={{ fontWeight: 700, color: '#e2e8f0' }}>{r.split('—')[1]}</span>
                      </div>
                    ))}
                    <div style={{ padding: '10px 12px', borderRadius: 8, background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.15)' }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: '#6366f1' }}>❌ Where do these numbers come from?</div>
                      <div style={{ fontSize: 11, color: '#94a3b8' }}>"Trust us, we're experts."</div>
                    </div>
                  </div>
                  <div style={{ padding: 20, borderRadius: 14, background: 'rgba(99,102,241,0.04)', border: '1px solid rgba(99,102,241,0.2)' }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#6366f1', marginBottom: 16 }}>🛡️ Merlin TrueQuote™</div>
                    {[['Battery System','$2,400,000','NREL ATB 2024, LFP 4-hr, $150/kWh'],['Annual Savings','$450,000','StoreFAST methodology, EIA rates'],['Payback Period','5.3 years','8% discount, 2% degradation, 30% ITC']].map((r,i) => (
                      <div key={i} style={{ padding: '10px 12px', marginBottom: 8, background: 'rgba(99,102,241,0.06)', borderRadius: 8 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                          <span style={{ color: '#94a3b8' }}>{r[0]}</span><span style={{ fontWeight: 700, color: '#e2e8f0' }}>{r[1]}</span>
                        </div>
                        <div style={{ fontSize: 10, color: '#6366f1', marginTop: 4, fontFamily: 'monospace' }}>📋 {r[2]}</div>
                      </div>
                    ))}
                    <div style={{ padding: '10px 12px', borderRadius: 8, background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)' }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: '#6366f1' }}>✅ Every number is verifiable.</div>
                      <div style={{ fontSize: 11, color: '#a5b4fc' }}>Export JSON audit trail for bank due diligence.</div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            {trueQuoteTabMain === 'how' && (
              <div>
                <div style={{ fontSize: 18, fontWeight: 700, color: '#fff', marginBottom: 16 }}>How TrueQuote™ Works</div>
                {[{step:'1',title:'Source Attribution',desc:'Every cost figure links to NREL ATB, EIA, or manufacturer data sheets. No "industry average" hand-waving.'},{step:'2',title:'Methodology Transparency',desc:'Financial models use StoreFAST (NREL) with published assumptions: discount rate, degradation, inflation, ITC step-down schedule.'},{step:'3',title:'Audit Hash',desc:'Each quote generates a SHA-256 hash of all inputs/outputs. Change one number and the hash breaks — tamper-proof integrity.'}].map((s,i) => (
                  <div key={i} style={{ display: 'flex', gap: 14, marginBottom: 16 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 800, color: '#6366f1', flexShrink: 0 }}>{s.step}</div>
                    <div><div style={{ fontSize: 14, fontWeight: 700, color: '#fff', marginBottom: 4 }}>{s.title}</div><div style={{ fontSize: 13, color: '#94a3b8', lineHeight: 1.5 }}>{s.desc}</div></div>
                  </div>
                ))}
              </div>
            )}
            {trueQuoteTabMain === 'proof' && (
              <div>
                <div style={{ fontSize: 18, fontWeight: 700, color: '#fff', marginBottom: 16 }}>See The Proof</div>
                <div style={{ padding: 16, borderRadius: 12, background: 'rgba(255,255,255,0.03)', border: '1px solid #334155', marginBottom: 16 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: 8 }}>Your Quote's Data Sources</div>
                  {[['Equipment Pricing','NREL ATB 2024 + manufacturer quotes'],['Electric Rates','EIA Open Data — commercial avg'],['Solar Irradiance','NREL PVWatts v8 — site-specific'],['Financial Model','StoreFAST methodology + IRS §48E'],['Incentives','DSIRE database + IRS guidance']].map(([k,v],i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: i < 4 ? '1px solid rgba(255,255,255,0.06)' : 'none', fontSize: 13 }}>
                      <span style={{ color: '#94a3b8' }}>{k}</span><span style={{ color: '#e2e8f0', fontFamily: 'monospace', fontSize: 11 }}>{v}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 24, paddingTop: 16, borderTop: '1px solid #334155' }}>
              <span style={{ fontSize: 11, color: '#64748b' }}>TrueQuote™ Verified · Source-attributed pricing</span>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => setShowTrueQuoteModal(false)} style={{ padding: '8px 16px', borderRadius: 8, background: 'none', border: 'none', color: '#94a3b8', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>Close</button>
                <button onClick={() => setShowTrueQuoteModal(false)} style={{ padding: '8px 20px', borderRadius: 10, background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.3)', color: '#6366f1', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>Get Your TrueQuote™ →</button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* ACC-3: Screen reader announcement for step changes */}
      <div aria-live="polite" aria-atomic="true" style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0,0,0,0)' }}>{stepAnnouncement}</div>
      <style>{`
        input[type="range"]::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: #6366f1;
          cursor: pointer;
          border: 3px solid white;
          box-shadow: 0 2px 6px rgba(0,0,0,0.3);
        }
        input[type="range"]::-moz-range-thumb {
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: #6366f1;
          cursor: pointer;
          border: 3px solid white;
          box-shadow: 0 2px 6px rgba(0,0,0,0.3);
        }
        button:focus-visible, [tabindex]:focus-visible, a:focus-visible {
          outline: none;
        }
      `}</style>
      {/* Header */}
      <header className="sticky top-0 z-50 relative" role="banner" aria-label="Wizard navigation" style={{ background: (currentStep === 1 || currentStep === 3) ? 'linear-gradient(to right, #1e1b4b 33.33%, #000000 33.33%)' : '#000000' }}>
        {(currentStep === 1 || currentStep === 3) && (
          <div className="fixed top-0 bottom-0 left-[33.33%] w-px bg-indigo-800" style={{ zIndex: 60 }} />
        )}
        <div className="relative flex items-center px-6 py-2.5">
          {/* Left: Logo - absolute so it doesn't affect centering */}
          <div className="flex items-center gap-2">
              <div className="w-9 h-9 bg-gradient-to-br from-indigo-500 to-indigo-700 rounded-lg flex items-center justify-center">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <span className="text-2xl font-bold text-white">Merlin Energy</span>
              <SSOTTriggerButton onClick={() => setSsotTrackerOpen(true)} />
          </div>
          
          {/* Center: Progress bar - absolutely centered on page */}
          <div className="absolute left-1/2 -translate-x-1/2">
            {/* Modern Progress Indicator - Centered */}
            <div className="flex justify-center">
              <div className="flex items-center">
                {steps.map((step, idx) => (
                  <div key={step.num} className="flex items-center">
                    {/* Step Circle */}
                    <div 
                      onClick={() => { if (step.num < currentStep) { setCurrentStep(step.num); setStepAnnouncement(`Navigated to Step ${step.num}: ${stepNamesA[step.num]}`); } }}
                      onKeyDown={(e) => { if ((e.key === 'Enter' || e.key === ' ') && step.num < currentStep) { e.preventDefault(); setCurrentStep(step.num); setStepAnnouncement(`Navigated to Step ${step.num}: ${stepNamesA[step.num]}`); } }}
                      tabIndex={step.num < currentStep ? 0 : -1}
                      role="tab" aria-selected={currentStep === step.num} aria-label={`Step ${step.num}: ${step.name}`}
                      className={`relative flex items-center justify-center transition-all duration-300 ${
                        step.num < currentStep ? 'cursor-pointer' : ''
                      }`}
                    >
                      {/* Circle */}
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center transition-all duration-300 ${
                        currentStep === step.num 
                          ? 'bg-indigo-600 ring-2 ring-indigo-500/30 shadow-lg' 
                          : step.num < currentStep 
                            ? 'bg-indigo-500 hover:bg-indigo-600 hover:scale-110' 
                            : 'bg-slate-700'
                      }`}>
                        {step.num < currentStep ? (
                          <Check className="w-3 h-3 text-white" />
                        ) : (
                          <span className={`text-[10px] font-bold ${
                            currentStep === step.num ? 'text-white' : 'text-slate-300'
                          }`}>{step.num}</span>
                        )}
                      </div>
                      
                      {/* Step Label - Below Circle */}
                      <span className={`absolute -bottom-5 left-1/2 -translate-x-1/2 text-[9px] font-medium whitespace-nowrap transition-all ${
                        currentStep === step.num 
                          ? 'text-indigo-400 font-semibold' 
                          : step.num < currentStep 
                            ? 'text-indigo-500' 
                            : 'text-slate-500'
                      }`}>
                        {step.name}
                      </span>
                    </div>
                    
                    {/* Connector Line (not after last) */}
                    {idx < steps.length - 1 && (
                      <div className={`w-6 h-0.5 mx-0.5 transition-all duration-500 ${
                        step.num < currentStep 
                          ? 'bg-indigo-500' 
                          : 'bg-slate-700'
                      }`} />
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
          {/* Right: Disclaimer icon */}
          <div className="ml-auto relative">
            <button
              onClick={() => setShowDisclaimer(!showDisclaimer)}
              style={{
                width: 28, height: 28, borderRadius: '50%', border: '1px solid rgba(255,255,255,0.15)',
                background: showDisclaimer ? '#334155' : 'transparent', color: '#94a3b8',
                fontSize: 14, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center',
                justifyContent: 'center', transition: 'all 0.2s',
              }}
              title="Legal disclaimer"
            >ℹ</button>
            {showDisclaimer && (
              <>
                <div onClick={() => setShowDisclaimer(false)} style={{ position: 'fixed', inset: 0, zIndex: 44 }} />
                <div style={{ position: 'absolute', top: 36, right: 0, width: 380, background: '#1e293b', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 12, padding: '14px 16px', boxShadow: '0 12px 32px rgba(0,0,0,0.5)', zIndex: 46 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: '#a5b4fc', textTransform: 'uppercase', letterSpacing: '0.05em' }}>⚠️ Important Disclaimer</span>
                    <button onClick={() => setShowDisclaimer(false)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: 16, padding: '0 2px' }}>✕</button>
                  </div>
                  <p style={{ fontSize: 11, color: '#94a3b8', margin: 0, lineHeight: '17px' }}>
                    Preliminary estimates only. Final pricing requires site assessment, utility interconnection review, and engineering design.
                    Federal ITC ({Math.round(ITC_BASE_RATE * 100)}% base{ITC_DOMESTIC_BONUS > 0 ? `, +${Math.round(ITC_DOMESTIC_BONUS * 100)}% domestic content bonus if qualified` : ''})
                    subject to IRS eligibility verification. Consult your CPA and legal counsel. Not a binding quote. © {new Date().getFullYear()} Merlin Energy AI.
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      </header>
      

      {/* Main Content */}
      {showCarWashAssessment ? (
        <CarWashAssessment 
          locationData={locationData}
          annualBill={annualBill}
          setAnnualBill={setAnnualBill}
          billUploadData={billUploadData}
          setBillUploadData={setBillUploadData}
          showTrueQuoteModal={showTrueQuoteModal}
          setShowTrueQuoteModal={setShowTrueQuoteModal}
          onComplete={(data) => { 
            // FIX A-11: removed debug log
            // FIX A-11: removed debug log
            // FIX A-11: removed debug log
            setFormData(data); 
            
            // === Bill Reconciliation -- Priority: Q7 direct input > slider > formula ===
            // FIX AUDIT-3c: Track synced bill synchronously (setAnnualBill is async — can't read back immediately)
            let reconciledBill = annualBill; // Start from slider value
            const q7Bill = data.monthlyElectricBill ? parseInt(data.monthlyElectricBill) * 12 : 0;
            if (q7Bill >= 6000) {
              // Q7 direct input is authoritative -- sync slider to match
              reconciledBill = Math.min(300000, q7Bill);
              setAnnualBill(reconciledBill);
            } else if (data.estimatedBill && data.estimatedBill > 0) {
              // Fallback: formula vs slider reconciliation (use MAX)
              const computedAnnualBill = Math.round(data.estimatedBill * 12);
              const divergence = Math.abs(computedAnnualBill - reconciledBill) / Math.max(reconciledBill, 1);
              if (divergence > 0.30) {
                reconciledBill = Math.min(300000, Math.max(6000, Math.max(computedAnnualBill, reconciledBill)));
                setAnnualBill(reconciledBill);
              }
            }
            // FIX AUDIT-3c: If all inputs are below minimum, use equipment-modeled estimate as floor
            if (reconciledBill < 6000 && data.estimatedBill > 0) {
              reconciledBill = Math.max(6000, Math.round(data.estimatedBill * 12));
              setAnnualBill(reconciledBill);
            }
            
            // locationData passes through from main component state
            if (onComplete) {
              // Final bill uses synchronous reconciledBill (not async annualBill state)
              const finalBill = Math.max(6000, reconciledBill); // FIX AUDIT-3c: floor at $6K (MIN_ANNUAL_BILL)
              onComplete({ locationData: liveDataRef.current || locationData, selectedIndustry, annualBill: finalBill, formData: data });
            }
          }}
          onBack={() => setCurrentStep(2)}
        />

      ) : currentStep === 3 && selectedIndustry && selectedIndustry.id !== 'carwash' && locationData ? (
        /* Step 3: Generic Facility Details */
        <div className="fixed inset-0 bg-black z-40 flex flex-col">
          <div className="fixed top-0 bottom-0 left-[33.33%] w-px bg-indigo-800" style={{ zIndex: 60 }} />
          <div className="grid grid-cols-3 flex-1 min-h-0">
          
          {/* LEFT PANEL */}
          <div className="border-r border-indigo-800 p-6 pt-16 bg-indigo-950 overflow-y-auto">

            {/* Industry + Location Header */}
            <h3 className="text-2xl font-black text-white mb-4">🏢 {selectedIndustry.name}</h3>

            <div className="mb-3">
              <div className="flex items-center gap-2 mb-2">
                <MapPin className="w-4 h-4 text-indigo-400" />
                <span className="text-sm font-semibold text-white">Location</span>
              </div>
              <div className="w-full px-3 py-3 rounded-lg bg-white/5 text-white text-base font-medium">
                {locationData?.utility?.city || step1City}, {locationData?.utility?.state || step1State}
              </div>
            </div>

            <div className="mb-3">
              <label className="block text-sm font-semibold text-indigo-300 mb-1">Utility</label>
              <div className="w-full px-3 py-3 rounded-lg bg-white/5 text-white text-base">
                {step1LocationData?.utility || 'N/A'}
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-semibold text-indigo-300 mb-1">Annual Electric Spend</label>
              <div className="w-full px-3 py-3 rounded-lg bg-white/5 text-white text-lg font-bold">
                ${(annualBill / 1000).toFixed(0)}K<span className="text-sm font-normal text-indigo-300">/yr</span>
                <span className="text-xs text-indigo-400 ml-2">(${Math.round(annualBill / 12).toLocaleString()}/mo)</span>
              </div>
            </div>

            {/* Site Intelligence - Exact Step 1 Card Grid */}
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm">📊</span>
              <span className="text-sm font-semibold text-white">Site Intelligence</span>
            </div>
            <div className="grid grid-cols-2 rounded-lg overflow-hidden mb-4">
              {/* Solar */}
              <div className="relative border-r border-b border-slate-700 p-3 bg-slate-800 hover:bg-slate-700 cursor-pointer transition-colors">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-1">
                    <span className="text-yellow-500 text-sm">☀️</span>
                    <span className="text-[10px] font-bold uppercase tracking-wide text-slate-300">Solar</span>
                    <span className={`text-[9px] px-1 py-0.5 rounded font-medium ${step1LocationData?.solar?.rating === 'Excellent' ? 'bg-indigo-500/20 text-indigo-400' : step1LocationData?.solar?.rating === 'Good' ? 'bg-indigo-500/20 text-indigo-400' : 'bg-amber-500/20 text-amber-400'}`}>{step1LocationData?.solar?.rating}</span>
                  </div>
                  <span className="text-slate-300 text-xs">ℹ️</span>
                </div>
                <div className="text-lg font-bold text-white">{step1LocationData?.solar?.peakSunHours} <span className="text-xs font-normal text-slate-300">peak sun hrs/day</span></div>
                <div className="text-[10px] text-slate-300">{(step1LocationData?.solar?.annualOutput || 0).toLocaleString()} kWh/kW annually</div>
              </div>
              {/* Electric */}
              <div className="relative border-b border-slate-700 p-3 bg-slate-800 hover:bg-slate-700 cursor-pointer transition-colors">
                <div className="flex items-center justify-between mb-0.5">
                  <div className="flex items-center gap-1">
                    <span className={`text-sm ${step1LocationData?.electric?.level === 'Very High' || step1LocationData?.electric?.level === 'High' ? 'text-red-600' : 'text-indigo-400'}`}>⚡</span>
                    <span className="text-[10px] font-bold uppercase tracking-wide text-slate-300">Electric</span>
                    <span className={`text-[9px] px-1 py-0.5 rounded font-medium ${step1LocationData?.electric?.level === 'Very High' ? 'bg-red-500/20 text-red-400' : step1LocationData?.electric?.level === 'High' ? 'bg-orange-500/20 text-orange-400' : step1LocationData?.electric?.level === 'Low' ? 'bg-indigo-500/20 text-indigo-400' : 'bg-amber-500/20 text-amber-400'}`}>{step1LocationData?.electric?.level}</span>
                  </div>
                  <span className="text-slate-300 text-xs">ℹ️</span>
                </div>
                <div className="text-lg font-bold text-white">${((step1LocationData?.electric?.rate) || 0).toFixed(2)}<span className="text-xs font-normal text-slate-300">/kWh</span></div>
                <div className="text-[10px] text-slate-300">Peak: ${((step1LocationData?.electric?.peakRate) || 0).toFixed(2)}/kWh</div>
              </div>
              {/* Climate */}
              <div className="relative border-r border-b border-slate-700 p-3 bg-slate-800 hover:bg-slate-700 cursor-pointer transition-colors">
                <div className="flex items-center justify-between mb-0.5">
                  <div className="flex items-center gap-1">
                    <span className={`text-sm ${step1LocationData?.weather?.risk === 'High' ? 'text-red-600' : step1LocationData?.weather?.risk === 'Moderate' ? 'text-amber-600' : 'text-indigo-400'}`}>🌡️</span>
                    <span className="text-[10px] font-bold uppercase tracking-wide text-slate-300">Climate</span>
                    <span className={`text-[9px] px-1 py-0.5 rounded font-medium ${step1LocationData?.weather?.risk === 'High' ? 'bg-red-500/20 text-red-400' : step1LocationData?.weather?.risk === 'Moderate' ? 'bg-amber-500/20 text-amber-400' : 'bg-indigo-500/20 text-indigo-400'}`}>{step1LocationData?.weather?.risk}</span>
                  </div>
                  <span className="text-slate-300 text-xs">ℹ️</span>
                </div>
                <div className={`text-lg font-bold ${step1LocationData?.weather?.risk === 'High' ? 'text-red-600' : step1LocationData?.weather?.risk === 'Moderate' ? 'text-amber-600' : 'text-indigo-400'}`}>{step1LocationData?.weather?.risk} Risk</div>
                <div className="text-[10px] text-slate-300">{[
                  step1LocationData?.weather?.heat === 'High' || step1LocationData?.weather?.heat === 'Extreme' ? 'Heat' : null,
                  step1LocationData?.weather?.drought === 'High' ? 'Drought' : null,
                  step1LocationData?.weather?.hurricane === 'High' || step1LocationData?.weather?.hurricane === 'Extreme' ? 'Hurricane' : null,
                  step1LocationData?.weather?.tornado === 'High' ? 'Tornado' : null,
                  step1LocationData?.weather?.wildfire === 'High' ? 'Wildfire' : null,
                  step1LocationData?.weather?.flood === 'High' ? 'Flood' : null,
                ].filter(Boolean).join(' + ') || 'Low Risk Area'}</div>
              </div>
              {/* Gas */}
              <div className="relative border-b border-slate-700 p-3 bg-slate-800 hover:bg-slate-700 cursor-pointer transition-colors">
                <div className="flex items-center justify-between mb-0.5">
                  <div className="flex items-center gap-1">
                    <span className="text-orange-500 text-sm">🔥</span>
                    <span className="text-[10px] font-bold uppercase tracking-wide text-slate-300">Gas</span>
                    <span className={`text-[9px] px-1 py-0.5 rounded font-medium ${step1LocationData?.gas?.level === 'Very High' ? 'bg-red-500/20 text-red-400' : step1LocationData?.gas?.level === 'High' ? 'bg-orange-500/20 text-orange-400' : step1LocationData?.gas?.level === 'Low' ? 'bg-indigo-500/20 text-indigo-400' : 'bg-amber-500/20 text-amber-400'}`}>{step1LocationData?.gas?.level}</span>
                  </div>
                  <span className="text-slate-300 text-xs">ℹ️</span>
                </div>
                <div className="text-lg font-bold text-white">${((step1LocationData?.gas?.rate) || 0).toFixed(2)}<span className="text-xs font-normal text-slate-300">/therm</span></div>
                <div className="text-[10px] text-slate-300">{step1LocationData?.gasUtility}</div>
              </div>
              {/* Incentives */}
              <div className="relative border-r border-slate-700 p-3 bg-slate-800 hover:bg-slate-700 cursor-pointer transition-colors">
                <div className="flex items-center justify-between mb-0.5">
                  <div className="flex items-center gap-1">
                    <span className="text-indigo-600 text-sm">💰</span>
                    <span className="text-[10px] font-bold uppercase tracking-wide text-slate-300">Incentives</span>
                    <span className={`text-[9px] px-1 py-0.5 rounded font-medium ${step1LocationData?.incentives?.rating === 'Excellent' ? 'bg-indigo-500/20 text-indigo-400' : 'bg-indigo-500/20 text-indigo-400'}`}>{step1LocationData?.incentives?.rating}</span>
                  </div>
                  <span className="text-slate-300 text-xs">ℹ️</span>
                </div>
                <div className="text-lg font-bold text-white">~{step1LocationData?.incentives?.total}% <span className="text-xs font-normal text-slate-300">Off</span></div>
                <div className="text-[10px] text-slate-300">ITC + MACRS {step1LocationData?.incentives?.state > 0 ? '+ State' : ''}</div>
              </div>
              {/* Battery */}
              <div className="relative p-3 bg-slate-800 hover:bg-slate-700 cursor-pointer transition-colors">
                <div className="flex items-center justify-between mb-0.5">
                  <div className="flex items-center gap-1">
                    <span className={`text-sm ${step1LocationData?.battery?.recommended ? 'text-indigo-600' : 'text-slate-300'}`}>🔋</span>
                    <span className="text-[10px] font-bold uppercase tracking-wide text-slate-300">Battery</span>
                    <span className={`text-[9px] px-1 py-0.5 rounded font-medium ${step1LocationData?.battery?.roi === 'Excellent' ? 'bg-indigo-500/20 text-indigo-400' : step1LocationData?.battery?.roi === 'Good' ? 'bg-indigo-500/20 text-indigo-400' : step1LocationData?.battery?.roi === 'Moderate' ? 'bg-amber-500/20 text-amber-400' : 'bg-slate-700 text-slate-300'}`}>{step1LocationData?.battery?.roi}</span>
                  </div>
                  <span className="text-slate-300 text-xs">ℹ️</span>
                </div>
                <div className={`text-lg font-bold ${step1LocationData?.battery?.recommended ? 'text-indigo-400' : 'text-slate-300'}`}>{step1LocationData?.battery?.recommended ? 'Yes' : 'Optional'}</div>
                <div className="text-[10px] text-slate-300">{step1LocationData?.battery?.reason}</div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-indigo-400 rounded-full animate-pulse"></span>
              <span className="text-sm font-medium text-indigo-400">Powered by Merlin AI</span>
            </div>
          </div>

          {/* RIGHT PANEL */}
          <div className="col-span-2 flex flex-col min-h-0 bg-black pt-16">
            {/* Top Banner - Industry Info */}
            <div className="bg-black px-5 py-3">
              <div className="max-w-2xl mx-auto flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-400 to-indigo-600 flex items-center justify-center">
                    {(() => { const Icon = selectedIndustry.icon; return <Icon className="w-5 h-5 text-white" />; })()}
                  </div>
                  <div>
                    <div className="font-bold text-lg text-white">{selectedIndustry.name} — Facility Details</div>
                    <div className="text-sm text-slate-300">Answer each question to unlock the next</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-24 h-2 bg-slate-700 rounded-full">
                    <div className="h-full bg-indigo-500 rounded-full transition-all" style={{ width: `${Math.round(((genQ - 1) / 8) * 100)}%` }} />
                  </div>
                  <span className="text-sm font-semibold text-indigo-400">{Math.round(((genQ - 1) / 8) * 100)}%</span>
                </div>
              </div>
            </div>

            {/* Scrollable Sequential Questions */}
            <div ref={genScrollRef} className="flex-1 min-h-0 overflow-y-auto">
              <div className="px-6 pb-6">
                <div className="max-w-2xl mx-auto mt-4 space-y-6">
                  
                  {/* Q1: Facility Size */}
                  <div ref={el => genQRefs.current[1] = el} className={`transition-all duration-300 scroll-mt-40 ${genQ >= 1 ? 'opacity-100' : 'opacity-30 pointer-events-none'}`}>
                    <div className="flex items-start gap-3">
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${genQ > 1 ? 'bg-indigo-500' : genQ === 1 ? 'bg-indigo-600' : 'bg-slate-700'}`}>
                        {genQ > 1 ? <Check className="w-5 h-5 text-white" /> : <span className="text-sm font-bold text-white">1</span>}
                      </div>
                      <div className="flex-1">
                        <label className="block text-base font-bold text-white mb-1">Approximate Facility Size (sq ft) <span className="text-indigo-400">*</span></label>
                        <p className="text-sm text-slate-300 mb-2">Total building footprint including all operational areas</p>
                        <input type="number" min="0" placeholder="e.g. 10000" aria-label="Facility square footage" value={formData.facilitySqFt || ''}
                          onChange={(e) => {
                            setFormData({...formData, facilitySqFt: e.target.value});
                            if (e.target.value && genQ === 1) { setGenQ(2); scrollToGenQ(2); }
                          }}
                          className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none text-lg" />
                      </div>
                    </div>
                    <div className={`ml-[18px] mt-1 mb-1 w-0.5 h-4 ${genQ > 1 ? 'bg-indigo-500' : 'bg-slate-700'}`} />
                  </div>

                  {/* Q2: Roof Area */}
                  <div ref={el => genQRefs.current[2] = el} className={`transition-all duration-300 scroll-mt-40 ${genQ >= 2 ? 'opacity-100' : 'opacity-30 pointer-events-none'}`}>
                    <div className="flex items-start gap-3">
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${genQ > 2 ? 'bg-indigo-500' : genQ === 2 ? 'bg-indigo-600' : 'bg-slate-700'}`}>
                        {genQ > 2 ? <Check className="w-5 h-5 text-white" /> : <span className={`text-sm font-bold ${genQ >= 2 ? 'text-white' : 'text-slate-300'}`}>2</span>}
                      </div>
                      <div className="flex-1">
                        <label className="block text-base font-bold text-white mb-1">Estimated Roof Area for Solar (sq ft) <span className="text-indigo-400">*</span></label>
                        <p className="text-sm text-slate-300 mb-2">Exclude areas with HVAC equipment, skylights, or obstructions</p>
                        <input type="number" min="0" placeholder="e.g. 8000" aria-label="Available roof area in square feet" value={formData.roofArea || ''}
                          onChange={(e) => {
                            setFormData({...formData, roofArea: e.target.value});
                            if (e.target.value && genQ === 2) { setGenQ(3); scrollToGenQ(3); }
                          }}
                          className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none text-lg" />
                      </div>
                    </div>
                    <div className={`ml-[18px] mt-1 mb-1 w-0.5 h-4 ${genQ > 2 ? 'bg-indigo-500' : 'bg-slate-700'}`} />
                  </div>

                  {/* Q3: Monthly Electric Bill */}
                  <div ref={el => genQRefs.current[3] = el} className={`transition-all duration-300 scroll-mt-40 ${genQ >= 3 ? 'opacity-100' : 'opacity-30 pointer-events-none'}`}>
                    <div className="flex items-start gap-3">
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${genQ > 3 ? 'bg-indigo-500' : genQ === 3 ? 'bg-indigo-600' : 'bg-slate-700'}`}>
                        {genQ > 3 ? <Check className="w-5 h-5 text-white" /> : <span className={`text-sm font-bold ${genQ >= 3 ? 'text-white' : 'text-slate-300'}`}>3</span>}
                      </div>
                      <div className="flex-1">
                        <label className="block text-base font-bold text-white mb-1">Average Monthly Electric Bill ($) <span className="text-indigo-400">*</span></label>
                        <p className="text-sm text-slate-300 mb-2">Your typical monthly electricity cost</p>
                        <input type="number" min="0" placeholder="e.g. 5000" aria-label="Monthly electric bill amount" value={formData.monthlyElectricBill || ''}
                          onChange={(e) => {
                            setFormData({...formData, monthlyElectricBill: e.target.value});
                            // Sync annualBill with monthly input so sidebar and calculations stay aligned
                            if (e.target.value) {
                              setAnnualBill(parseInt(e.target.value) * 12 || annualBill);
                            }
                            if (e.target.value && genQ === 3) { setGenQ(4); scrollToGenQ(4); }
                          }}
                          className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none text-lg" />
                      </div>
                    </div>
                    <div className={`ml-[18px] mt-1 mb-1 w-0.5 h-4 ${genQ > 3 ? 'bg-indigo-500' : 'bg-slate-700'}`} />
                  </div>

                  {/* Q4: Natural Gas */}
                  <div ref={el => genQRefs.current[4] = el} className={`transition-all duration-300 scroll-mt-40 ${genQ >= 4 ? 'opacity-100' : 'opacity-30 pointer-events-none'}`}>
                    <div className="flex items-start gap-3">
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${genQ > 4 ? 'bg-indigo-500' : genQ === 4 ? 'bg-indigo-600' : 'bg-slate-700'}`}>
                        {genQ > 4 ? <Check className="w-5 h-5 text-white" /> : <span className={`text-sm font-bold ${genQ >= 4 ? 'text-white' : 'text-slate-300'}`}>4</span>}
                      </div>
                      <div className="flex-1">
                        <label className="block text-base font-bold text-white mb-1">Do you have natural gas service? <span className="text-indigo-400">*</span></label>
                        <p className="text-sm text-slate-300 mb-2">This affects your energy solution recommendations</p>
                        <div className="flex gap-4">
                          <button onClick={() => { setFormData({...formData, hasGasLine: formData.hasGasLine === true ? undefined : true}); if (formData.hasGasLine !== true && genQ === 4) { setGenQ(5); scrollToGenQ(5); } }}
                            className={`flex-1 py-3 px-4 rounded-xl border-2 font-medium transition ${formData.hasGasLine === true ? 'border-indigo-500 bg-indigo-500/20 text-indigo-400' : 'border-slate-700 text-slate-300 hover:border-slate-500'}`}>
                            Yes, we have gas
                          </button>
                          <button onClick={() => { setFormData({...formData, hasGasLine: formData.hasGasLine === false ? undefined : false}); if (formData.hasGasLine !== false && genQ === 4) { setGenQ(5); scrollToGenQ(5); } }}
                            className={`flex-1 py-3 px-4 rounded-xl border-2 font-medium transition ${formData.hasGasLine === false ? 'border-indigo-500 bg-indigo-500/20 text-indigo-400' : 'border-slate-700 text-slate-300 hover:border-slate-500'}`}>
                            No, all electric
                          </button>
                        </div>
                      </div>
                    </div>
                    <div className={`ml-[18px] mt-1 mb-1 w-0.5 h-4 ${genQ > 4 ? 'bg-indigo-500' : 'bg-slate-700'}`} />
                  </div>

                  {/* Q5: Operating Hours */}
                  <div ref={el => genQRefs.current[5] = el} className={`transition-all duration-300 scroll-mt-40 ${genQ >= 5 ? 'opacity-100' : 'opacity-30 pointer-events-none'}`}>
                    <div className="flex items-start gap-3">
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${genQ > 5 ? 'bg-indigo-500' : genQ === 5 ? 'bg-indigo-600' : 'bg-slate-700'}`}>
                        {genQ > 5 ? <Check className="w-5 h-5 text-white" /> : <span className={`text-sm font-bold ${genQ >= 5 ? 'text-white' : 'text-slate-300'}`}>5</span>}
                      </div>
                      <div className="flex-1">
                        <label className="block text-base font-bold text-white mb-1">Daily Operating Hours <span className="text-indigo-400">*</span></label>
                        <p className="text-sm text-slate-300 mb-2">How many hours per day is your facility actively running?</p>
                        <select aria-label="Daily operating hours" value={formData.operatingHours || ''}
                          onChange={(e) => { setFormData({...formData, operatingHours: parseInt(e.target.value)}); if (e.target.value && genQ === 5) { setGenQ(6); scrollToGenQ(6); } }}
                          className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none text-lg">
                          <option value="">Select hours...</option>
                          <option value="8">8 hours (standard business)</option>
                          <option value="10">10 hours (extended hours)</option>
                          <option value="12">12 hours</option>
                          <option value="16">16 hours</option>
                          <option value="24">24 hours (round the clock)</option>
                        </select>
                      </div>
                    </div>
                    <div className={`ml-[18px] mt-1 mb-1 w-0.5 h-4 ${genQ > 5 ? 'bg-indigo-500' : 'bg-slate-700'}`} />
                  </div>

                  {/* Q6: Backup Power */}
                  <div ref={el => genQRefs.current[6] = el} className={`transition-all duration-300 scroll-mt-40 ${genQ >= 6 ? 'opacity-100' : 'opacity-30 pointer-events-none'}`}>
                    <div className="flex items-start gap-3">
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${formData.backupPriority ? 'bg-indigo-500' : genQ === 6 ? 'bg-indigo-600' : 'bg-slate-700'}`}>
                        {formData.backupPriority ? <Check className="w-5 h-5 text-white" /> : <span className={`text-sm font-bold ${genQ >= 6 ? 'text-white' : 'text-slate-300'}`}>6</span>}
                      </div>
                      <div className="flex-1">
                        <label className="block text-base font-bold text-white mb-1">How important is backup power? <span className="text-indigo-400">*</span></label>
                        <p className="text-sm text-slate-300 mb-2">This determines if we include battery storage or generator options</p>
                        <div className="grid grid-cols-3 gap-3">
                          {['Not critical', 'Somewhat important', 'Mission critical'].map((level, idx) => (
                            <button key={level} onClick={() => { setFormData({...formData, backupPriority: formData.backupPriority === idx + 1 ? undefined : idx + 1}); if (genQ === 6) { setGenQ(7); scrollToGenQ(7); } }}
                              className={`py-3 px-3 rounded-xl border-2 text-sm font-medium transition ${formData.backupPriority === idx + 1 ? 'border-indigo-500 bg-indigo-500/20 text-indigo-400' : 'border-slate-700 text-slate-300 hover:border-slate-500'}`}>
                              {level}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className={`ml-[18px] mt-1 mb-1 w-0.5 h-4 ${genQ > 6 ? 'bg-indigo-500' : 'bg-slate-700'}`} />
                  </div>

                  {/* Q7: Business Entity Type — determines tax rate for MACRS/ITC calculations */}
                  <div ref={el => genQRefs.current[7] = el} className={`transition-all duration-300 scroll-mt-40 ${genQ >= 7 ? 'opacity-100' : 'opacity-30 pointer-events-none'}`}>
                    <div className="flex items-start gap-3">
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${genQ > 7 ? 'bg-indigo-500' : genQ === 7 ? 'bg-indigo-600' : 'bg-slate-700'}`}>
                        {genQ > 7 ? <Check className="w-5 h-5 text-white" /> : <span className={`text-sm font-bold ${genQ >= 7 ? 'text-white' : 'text-slate-300'}`}>7</span>}
                      </div>
                      <div className="flex-1">
                        <label className="block text-base font-bold text-white mb-1">Business Entity Type <span className="text-indigo-400">*</span></label>
                        <p className="text-sm text-slate-300 mb-2">This determines your effective tax rate for depreciation and credit calculations</p>
                        <div className="grid grid-cols-2 gap-3">
                          {[
                            { id: 'c_corp', label: 'C-Corporation', desc: '21% federal + state' },
                            { id: 's_corp', label: 'S-Corporation', desc: 'Pass-through to owners' },
                            { id: 'llc', label: 'LLC / Partnership', desc: 'Pass-through to members' },
                            { id: 'sole_prop', label: 'Sole Proprietorship', desc: 'Personal tax rates' },
                          ].map(ent => (
                            <button key={ent.id} onClick={() => { setFormData({...formData, entityType: formData.entityType === ent.id ? undefined : ent.id}); if (genQ === 7) { setGenQ(8); scrollToGenQ(8); } }}
                              className={`py-3 px-4 rounded-xl border-2 text-left transition ${formData.entityType === ent.id ? 'border-indigo-500 bg-indigo-500/20' : 'border-slate-700 hover:border-slate-500'}`}>
                              <div className={`text-sm font-bold ${formData.entityType === ent.id ? 'text-indigo-400' : 'text-slate-300'}`}>{ent.label}</div>
                              <div className="text-xs text-slate-500 mt-0.5">{ent.desc}</div>
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className={`ml-[18px] mt-1 mb-1 w-0.5 h-4 ${genQ > 7 ? 'bg-indigo-500' : 'bg-slate-700'}`} />
                  </div>

                  {/* Q8: Energy Community & Census Tract (Optional — enhances ITC) */}
                  <div ref={el => genQRefs.current[8] = el} className={`transition-all duration-300 scroll-mt-40 ${genQ >= 8 ? 'opacity-100' : 'opacity-30 pointer-events-none'}`}>
                    <div className="flex items-start gap-3">
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${formData.energyCommunity ? 'bg-indigo-500' : genQ === 8 ? 'bg-indigo-600' : 'bg-slate-700'}`}>
                        {formData.energyCommunity ? <Check className="w-5 h-5 text-white" /> : <span className={`text-sm font-bold ${genQ >= 8 ? 'text-white' : 'text-slate-300'}`}>8</span>}
                      </div>
                      <div className="flex-1">
                        <label className="block text-base font-bold text-white mb-1">Energy Community Status <span className="text-xs text-slate-300 font-normal">(optional — +10% ITC bonus)</span></label>
                        <p className="text-sm text-slate-300 mb-2">Is your site in an IRS-designated energy community? (brownfield, fossil fuel employment, or coal closure area)</p>
                        {/* Auto-detection badge from Census Geocoding */}
                        {locationData?._energyCommunity && (
                          <div className={`mb-3 p-3 rounded-lg border text-sm ${locationData._energyCommunity.isEnergyCommunity ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400' : 'bg-slate-800 border-slate-700 text-slate-300'}`}>
                            <span className="font-bold">{locationData._energyCommunity.isEnergyCommunity ? '✅ Auto-detected: Energy Community' : 'ℹ️ Not auto-detected as energy community'}</span>
                            {locationData._censusData?.countyName && <span className="text-xs ml-2">({locationData._censusData.countyName} County, FIPS {locationData._censusData.fipsCounty})</span>}
                            {locationData._energyCommunity.isEnergyCommunity && <span className="block text-xs mt-1">Based on DOE IRA dataset — your county qualifies for +10% ITC bonus</span>}
                            {!locationData._energyCommunity.isEnergyCommunity && <span className="block text-xs mt-1">May still qualify as brownfield site — verify at energycommunities.gov</span>}
                          </div>
                        )}
                        <div className="flex gap-4">
                          <button onClick={() => setFormData({...formData, energyCommunity: formData.energyCommunity === 'yes' ? undefined : 'yes'})}
                            className={`flex-1 py-3 px-4 rounded-xl border-2 font-medium transition ${formData.energyCommunity === 'yes' ? 'border-indigo-500 bg-indigo-500/20 text-indigo-400' : 'border-slate-700 text-slate-300 hover:border-slate-500'}`}>
                            {locationData?._energyCommunity?.isEnergyCommunity ? '✓ Confirmed' : 'Yes / Not Sure'}
                          </button>
                          <button onClick={() => setFormData({...formData, energyCommunity: formData.energyCommunity === 'no' ? undefined : 'no'})}
                            className={`flex-1 py-3 px-4 rounded-xl border-2 font-medium transition ${formData.energyCommunity === 'no' ? 'border-indigo-500 bg-indigo-500/20 text-indigo-400' : 'border-slate-700 text-slate-300 hover:border-slate-500'}`}>
                            No
                          </button>
                        </div>
                        <p className="text-xs text-slate-500 mt-2">
                          {locationData?._fipsTract ? `Census tract: ${locationData._fipsTract} · ` : ''}
                          Check at energycommunities.gov · This adds +10% to your ITC if eligible
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Completion message */}
                  {genAllAnswered() && (
                    <div className="flex items-center gap-3 p-4 bg-indigo-500/10 border border-indigo-500/30 rounded-xl">
                      <Check className="w-6 h-6 text-indigo-400" />
                      <div>
                        <div className="font-bold text-indigo-400">All Details Complete!</div>
                        <div className="text-sm text-slate-300">Click Continue to proceed to Goals</div>
                      </div>
                    </div>
                  )}

                </div>
              </div>
            </div>

            {/* Footer CTA - Full Width Bottom Bar */}
          </div>
          </div>
          <div className="flex-shrink-0 grid grid-cols-3">
            <div className="bg-indigo-950 border-r border-indigo-800 flex items-center justify-center px-4 py-4">
              <button onClick={() => setCurrentStep(2)}
                className="flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-600">
                <ChevronLeft className="w-5 h-5" /> Back
              </button>
            </div>
            <div className="col-span-2 bg-black flex items-center justify-between px-6 py-4">
              <div>
                <div className="font-semibold text-white">
                  {canProceed() ? '✓ Details Complete!' : `Question ${Math.min(genQ, 8)} of 8`}
                </div>
                <div className="text-sm text-slate-300">
                  {canProceed() ? 'Ready to set your energy goals' : 'Answer all questions to continue'}
                </div>
              </div>
              <button 
                onClick={() => {
                  // FIX AUDIT-3c: Reconcile generic Step 3 Q3 (monthlyElectricBill) with slider annualBill before handoff
                  let finalBill = annualBill;
                  const q3Bill = formData.monthlyElectricBill ? parseInt(formData.monthlyElectricBill) * 12 : 0;
                  if (q3Bill >= 6000) finalBill = Math.min(300000, q3Bill);
                  finalBill = Math.max(6000, finalBill); // Floor at MIN_ANNUAL_BILL
                  onComplete && onComplete({ locationData: liveDataRef.current || locationData, selectedIndustry, annualBill: finalBill, formData });
                }}
                disabled={!canProceed()}
                className={`font-bold px-8 py-3 rounded-xl flex items-center gap-2 transition-all ${
                  canProceed() 
                    ? 'bg-indigo-500 text-white hover:bg-indigo-600 shadow-lg cursor-pointer' 
                    : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                }`}>
                Continue to Goals <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

      ) : (
        <main id="wizard-content" role="region" aria-label="Step content" className="flex-1 max-w-6xl mx-auto px-6 py-1 w-full flex flex-col" style={{height: 'calc(100vh - 120px)'}}>

          {/* Step 1: Location */}
          {currentStep === 1 && (
            <div className="fixed inset-0 bg-black z-40 flex flex-col">
              <div className="fixed top-0 bottom-0 left-[33.33%] w-px bg-indigo-800" style={{ zIndex: 60 }} />
              <div className="grid grid-cols-3 flex-1 min-h-0">
          
          {/* LEFT PANEL */}
          <div className="border-r border-indigo-800 p-6 pt-16 bg-indigo-950 overflow-y-auto">
            
            {/* US / International Toggle */}
            <div className="flex gap-2 mb-5">
              <button
                onClick={() => setMarketRegion('us')}
                className={`flex-1 py-3 px-4 rounded-xl font-bold text-base transition-all flex items-center justify-center gap-2 ${
                  marketRegion === 'us'
                    ? 'bg-white text-indigo-900 shadow-lg'
                    : 'bg-white/10 text-white/70 hover:bg-white/20 border border-white/20'
                }`}
              >
                <span className="text-xl">🇺🇸</span> US
              </button>
              <button
                onClick={() => setMarketRegion('international')}
                className={`flex-1 py-3 px-4 rounded-xl font-bold text-base transition-all flex items-center justify-center gap-2 ${
                  marketRegion === 'international'
                    ? 'bg-white text-indigo-900 shadow-lg'
                    : 'bg-white/10 text-white/70 hover:bg-white/20 border border-white/20'
                }`}
              >
                <span className="text-xl">🌍</span> International
              </button>
            </div>
            
            <h3 className="text-lg font-bold text-white mb-3">📍 Location</h3>
            
            {/* ZIP Code */}
            <div className="mb-3">
              <label className="block text-sm font-semibold text-indigo-300 mb-1">ZIP Code</label>
              <input 
                type="text" 
                value={zipCode}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, '').slice(0, 5);
                  setZipCode(value);
                }}
                onKeyDown={handleStep1KeyDown}
                placeholder="Enter ZIP"
                maxLength={5}
                inputMode="numeric"
                pattern="[0-9]*"
                className="w-full px-4 py-3 rounded-xl bg-white/5 text-white placeholder-indigo-400/60 text-center text-lg font-mono focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none" 
                />
              </div>
              
              {/* OR Divider */}
              <div className="flex items-center gap-3 my-2">
                <div className="flex-1 h-px bg-white/10"></div>
                <span className="text-sm text-indigo-400/60 font-medium">OR</span>
                <div className="flex-1 h-px bg-white/10"></div>
              </div>
              
              {/* City & State */}
              <div className="flex gap-2 mb-3">
                <div className="flex-1">
                  <label className="block text-sm font-semibold text-indigo-300 mb-1">City</label>
                  <input 
                    type="text" 
                    value={step1City}
                    onChange={(e) => setStep1City(e.target.value.replace(/[^a-zA-Z\s]/g, ''))}
                    onKeyDown={handleStep1KeyDown}
                    placeholder="Enter city"
                    className="w-full px-3 py-3 rounded-lg bg-white/5 text-white placeholder-indigo-400/60" 
                  />
                </div>
                <div className="w-20">
                  <label className="block text-sm font-semibold text-indigo-300 mb-1">State</label>
                  <div className={`w-full px-3 py-3 rounded-lg text-center font-medium ${step1State ? 'bg-white/5 text-white' : 'bg-white/[0.02] text-indigo-400'}`}>{step1State || '--'}</div>
                </div>
              </div>
              
              {/* Street Address */}
              <div className="mb-3">
                <label className="block text-sm font-semibold text-indigo-300 mb-1">Street Address <span className="text-indigo-400 font-normal">(optional)</span></label>
                <input type="text" placeholder="123 Main Street" aria-label="Business street address" className="w-full px-3 py-2.5 rounded-lg bg-white/5 text-white placeholder-indigo-400/60 text-sm" />
              </div>
              
              {/* Lookup Button */}
              <button 
                onClick={handleStep1Lookup}
                disabled={lookupStatus === 'loading'}
                className={`w-full py-3 rounded-lg font-bold text-base flex items-center justify-center gap-2 mb-3 transition-all ${
                  lookupStatus === 'loading' 
                    ? 'bg-slate-400 text-white cursor-wait' 
                    : lookupStatus === 'success'
                    ? 'bg-indigo-500 text-white'
                    : lookupStatus === 'notfound'
                    ? 'bg-red-500 text-white'
                    : (zipCode || step1City) && !locationConfirmed
                    ? 'bg-indigo-700 hover:bg-indigo-600 text-white animate-pulse ring-2 ring-indigo-400'
                    : 'bg-indigo-700 hover:bg-indigo-600 text-white'
                }`}
              >
                {lookupStatus === 'loading' ? (
                  <>
                    <span className="animate-spin">⏳</span> Looking up...
                  </>
                ) : lookupStatus === 'success' ? (
                  <>
                    <span>✅</span> Location Found!
                  </>
                ) : lookupStatus === 'notfound' ? (
                  <>
                    <span>❌</span> ZIP Not Found
                  </>
                ) : (zipCode || step1City) && !locationConfirmed ? (
                  <>
                    <span>👆</span> Click to Lookup Location
                  </>
                ) : (
                  <>
                    <span>🔍</span> Lookup Location
                  </>
                )}
              </button>
              
              {/* Business Name */}
              <div className="mb-4">
                <label className="block text-sm font-semibold text-indigo-300 mb-1">Business Name <span className="text-indigo-400 font-normal">(optional)</span></label>
                <input type="text" placeholder="Search your business..." aria-label="Search for your business type" className="w-full px-3 py-2.5 rounded-lg bg-white/5 text-white placeholder-indigo-400/60 text-sm" />
              </div>

              {/* ═══ EPC SITE SCAN ═══ */}
              <div className="border-t border-white/10 pt-4 mt-1 mb-3">
                <div className="text-[10px] font-bold text-emerald-400 tracking-widest mb-3 uppercase">
                  📸 EPC Site Scan <span className="text-indigo-400/60 font-normal normal-case tracking-normal">— optional, for contractors</span>
                </div>

                {/* GPS Auto-detect */}
                <button
                  type="button"
                  onClick={() => {
                    if (!navigator.geolocation) {
                      setEpcGpsStatus('error');
                      setEpcGpsLabel('Geolocation not supported by this browser.');
                      return;
                    }
                    setEpcGpsStatus('loading');
                    navigator.geolocation.getCurrentPosition(
                      async (pos) => {
                        const { latitude, longitude } = pos.coords;
                        try {
                          const res = await fetch(
                            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`
                          );
                          const data = await res.json();
                          const city = data.address?.city || data.address?.town || data.address?.village || '';
                          const state = data.address?.state || '';
                          const zip = data.address?.postcode?.slice(0, 5) || '';
                          const road = data.address?.road || '';
                          const houseNumber = data.address?.house_number || '';
                          if (zip) setZipCode(zip);
                          if (city) setStep1City(city);
                          if (state) setStep1State(state);
                          setEpcGpsLabel(`${houseNumber ? houseNumber + ' ' : ''}${road}${road && city ? ', ' : ''}${city}${city && state ? ', ' : ''}${state} ${zip}`.trim());
                          setEpcGpsStatus('done');
                        } catch {
                          setEpcGpsStatus('error');
                          setEpcGpsLabel('Could not reverse-geocode location.');
                        }
                      },
                      (err) => {
                        setEpcGpsStatus('error');
                        setEpcGpsLabel(err.code === 1 ? 'Location permission denied.' : 'Could not get GPS fix.');
                      },
                      { timeout: 10000, enableHighAccuracy: true }
                    );
                  }}
                  className={`w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-sm font-semibold mb-2 transition-all border ${
                    epcGpsStatus === 'loading'
                      ? 'bg-indigo-900/30 text-indigo-300 border-indigo-700/50 cursor-wait'
                      : epcGpsStatus === 'done'
                      ? 'bg-emerald-900/30 text-emerald-300 border-emerald-700/50'
                      : epcGpsStatus === 'error'
                      ? 'bg-red-900/20 text-red-400 border-red-700/40'
                      : 'bg-white/5 text-indigo-300 border-white/10 hover:bg-white/10 hover:border-indigo-500/40'
                  }`}
                >
                  {epcGpsStatus === 'loading' ? (
                    <><span className="animate-spin text-base">⏳</span> Getting GPS…</>
                  ) : epcGpsStatus === 'done' ? (
                    <><span>✅</span> {epcGpsLabel || 'Location auto-filled'}</>
                  ) : epcGpsStatus === 'error' ? (
                    <><span>⚠️</span> {epcGpsLabel || 'GPS error — try again'}</>
                  ) : (
                    <><MapPin className="w-4 h-4" /> Use my GPS location</>
                  )}
                </button>

                {/* Photo upload */}
                <label htmlFor="epc-site-photo" aria-label="Upload site photo for EPC site scan" className={`w-full flex items-center gap-2 py-2.5 px-3 rounded-lg border cursor-pointer transition-all text-sm font-semibold ${
                  epcPhoto
                    ? 'bg-emerald-900/20 border-emerald-700/50 text-emerald-300'
                    : 'bg-white/5 border-white/10 text-indigo-300 hover:bg-white/10 hover:border-indigo-500/40'
                }`}>
                  <Upload className="w-4 h-4 flex-shrink-0" />
                  <span className="truncate">
                    {epcPhoto ? epcPhoto.name : 'Upload site photo (roof / equipment)'}
                  </span>
                  <input
                    id="epc-site-photo"
                    type="file"
                    accept="image/*"
                    capture="environment"
                    className="sr-only"
                    onChange={handleEpcPhotoChange}
                  />
                </label>

                {/* Photo preview */}
                {epcPhoto && (
                  <div className="mt-2 relative rounded-lg overflow-hidden border border-white/10">
                    <img
                      src={epcPhoto.previewUrl}
                      alt="Site photo preview"
                      className="w-full max-h-32 object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        URL.revokeObjectURL(epcPhoto.previewUrl);
                        setEpcPhoto(null);
                        setEpcAnalysis(null);
                        setEpcAnalysisError('');
                        setEpcAnalysisStatus('idle');
                      }}
                      className="absolute top-1 right-1 bg-black/60 hover:bg-black/80 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs transition"
                      aria-label="Remove photo"
                    >
                      ✕
                    </button>
                    <div className="px-2 py-1 text-[10px] text-slate-400 bg-black/40">
                      {epcPhoto.name}
                    </div>
                  </div>
                )}

                {epcAnalysisStatus === 'loading' && (
                  <div className="mt-2 flex items-center gap-2 rounded-lg border border-indigo-500/30 bg-indigo-950/30 px-3 py-2 text-xs text-indigo-200">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Analyzing roof, equipment, and EPC readiness…
                  </div>
                )}

                {epcAnalysisStatus === 'error' && (
                  <div className="mt-2 rounded-lg border border-red-500/30 bg-red-950/20 px-3 py-2 text-xs text-red-300">
                    ⚠️ {epcAnalysisError || 'Could not analyze photo.'}
                  </div>
                )}

                {epcAnalysisStatus === 'done' && epcAnalysis && (
                  <div className="mt-2 rounded-lg border border-emerald-500/30 bg-emerald-950/20 p-3 text-xs text-slate-200 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold text-emerald-300">EPC Scan Ready</span>
                      <span className="rounded-full bg-black/30 px-2 py-0.5 text-[10px] text-emerald-200">
                        {Math.round((epcAnalysis.confidence || 0) * 100)}% confidence
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="rounded-md bg-black/20 p-2">
                        <div className="text-[10px] uppercase tracking-wide text-slate-400">Roof Area</div>
                        <div className="font-bold text-white">{epcAnalysis.roofSqft ? `${epcAnalysis.roofSqft.toLocaleString()} sqft` : 'Field verify'}</div>
                      </div>
                      <div className="rounded-md bg-black/20 p-2">
                        <div className="text-[10px] uppercase tracking-wide text-slate-400">Usable Solar</div>
                        <div className="font-bold text-white">{epcAnalysis.usableSolarSqft ? `${epcAnalysis.usableSolarSqft.toLocaleString()} sqft` : 'Pending'}</div>
                      </div>
                    </div>
                    {epcAnalysis.equipmentNotes?.length > 0 && (
                      <ul className="space-y-1 text-slate-300">
                        {epcAnalysis.equipmentNotes.slice(0, 3).map((note, index) => (
                          <li key={`epc-note-${index}`}>• {note}</li>
                        ))}
                      </ul>
                    )}
                    <div className="text-[11px] text-emerald-200">
                      Next: {epcAnalysis.recommendedNextStep || 'Review scan before quote generation.'}
                    </div>
                  </div>
                )}
              </div>
              {/* ═══ END EPC SITE SCAN ═══ */}

              {/* TrueQuote™ Verified Badge */}
              <div onClick={() => setShowTrueQuoteModal(true)}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, padding: '10px 18px', margin: '4px 0 8px', borderRadius: 12, background: 'linear-gradient(135deg, rgba(15,23,42,0.9), rgba(30,41,59,0.7))', border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer', transition: 'all 0.2s' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(99,102,241,0.4)'; e.currentTarget.style.background = 'linear-gradient(135deg, rgba(99,102,241,0.08), rgba(15,23,42,0.9))'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; e.currentTarget.style.background = 'linear-gradient(135deg, rgba(15,23,42,0.9), rgba(30,41,59,0.7))'; }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><polyline points="9 12 11.5 14.5 15.5 9.5" stroke="#6366f1" strokeWidth="2"/></svg>
                <span style={{ fontSize: 14, fontWeight: 800, color: '#e2e8f0', letterSpacing: 0.3 }}>TrueQuote™</span>
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#6366f1', flexShrink: 0 }} />
                <span style={{ fontSize: 14, fontWeight: 600, color: '#94a3b8' }}>Verified</span>
              </div>

            </div>
            
            {/* RIGHT PANEL */}
            <div className="col-span-2 flex flex-col min-h-0 bg-black pt-16">
              {/* Top Banner - Location Info */}
              <div className="bg-black px-5 py-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-white text-lg">📍</span>
                    <div>
                      <div className="font-bold text-lg text-white">{step1City || 'Enter Location'}{step1State ? `, ${step1State}` : ''}</div>
                      <div className="text-sm text-slate-300">{locationConfirmed ? step1LocationData?.utility : 'Utility will appear after lookup'}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-8">
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-1 mb-1">
                        <span className="text-indigo-400">🛡️</span>
                        <span className="text-[10px] text-slate-300 uppercase tracking-wide">Grid Reliability</span>
                      </div>
                      <div className={`text-lg font-bold ${!locationConfirmed ? 'text-slate-500' : step1LocationData?.grid?.rating >= '4/5' ? 'text-indigo-400' : step1LocationData?.grid?.rating >= '3/5' ? 'text-yellow-400' : 'text-red-400'}`}>{locationConfirmed ? step1LocationData?.grid?.rating : '--'}</div>
                    </div>
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-1 mb-1">
                        <span className="text-amber-400">⚡</span>
                        <span className="text-[10px] text-slate-300 uppercase tracking-wide">Outages/yr</span>
                      </div>
                      <div className={`text-lg font-bold ${!locationConfirmed ? 'text-slate-500' : (step1LocationData?.grid?.outages || '').includes('1-2') ? 'text-indigo-400' : (step1LocationData?.grid?.outages || '').includes('5') || (step1LocationData?.grid?.outages || '').includes('6') || (step1LocationData?.grid?.outages || '').includes('8') ? 'text-red-400' : 'text-yellow-400'}`}>{locationConfirmed ? step1LocationData?.grid?.outages : '--'}</div>
                    </div>
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-1 mb-1">
                        <span className="text-orange-400">🔥</span>
                        <span className="text-[10px] text-slate-300 uppercase tracking-wide">PSPS Risk</span>
                      </div>
                      <div className={`text-lg font-bold ${!locationConfirmed ? 'text-slate-500' : step1LocationData?.grid?.psps === 'High' ? 'text-red-400' : step1LocationData?.grid?.psps === 'Moderate' ? 'text-yellow-400' : 'text-slate-300'}`}>{locationConfirmed ? step1LocationData?.grid?.psps : '--'}</div>
                    </div>
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-1 mb-1">
                        <span className="text-indigo-400">🔋</span>
                        <span className="text-[10px] text-slate-300 uppercase tracking-wide">Backup Need</span>
                      </div>
                      <div className={`text-lg font-bold ${!locationConfirmed ? 'text-slate-500' : step1LocationData?.grid?.backupNeed === 'Low' ? 'text-indigo-400' : step1LocationData?.grid?.backupNeed === 'High' ? 'text-red-400' : 'text-yellow-400'}`}>{locationConfirmed ? step1LocationData?.grid?.backupNeed : '--'}</div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Site Intelligence - Collapsible */}
              <div 
                className={`flex items-center justify-between px-5 py-3 cursor-pointer transition-all ${
                  showDataCards 
                    ? 'bg-black hover:bg-slate-900' 
                    : 'bg-black hover:bg-slate-900'
                }`}
                onClick={() => setShowDataCards(!showDataCards)}
              >
                <div className="flex items-center gap-3">
                  <span className="text-lg">📊</span>
                  <span className="text-base font-semibold text-white">Site Intelligence</span>
                  <span className="text-xs text-slate-300">(Solar, Electric, Climate, Gas, Incentives, Battery)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-semibold px-3 py-1 rounded-full border bg-amber-500/20 text-amber-300 border-amber-400/50 animate-pulse`}>{showDataCards ? 'Click to hide ▲' : 'Click to expand ▼'}</span>
                </div>
              </div>
              
              {showDataCards && (
              <div className="grid grid-cols-3 bg-black">
                {/* Row 1: Solar, Electric, Climate */}
                
                {/* Solar Card */}
                <div 
                  className="relative border-r border-b border-slate-700 p-3 bg-slate-800 hover:bg-slate-700 cursor-pointer transition-colors"
                  onMouseEnter={() => setHoveredCard('solar')}
                  onMouseLeave={() => setHoveredCard(null)}
                  onClick={() => setHoveredCard(hoveredCard === 'solar' ? null : 'solar')}
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-1">
                      <span className="text-yellow-500 text-sm">☀️</span>
                      <span className="text-[10px] font-bold uppercase tracking-wide text-slate-300">Solar</span>
                      <span className={`text-[9px] px-1 py-0.5 rounded font-medium ${step1LocationData?.solar?.rating === 'Excellent' ? 'bg-indigo-500/20 text-indigo-400' : step1LocationData?.solar?.rating === 'Good' ? 'bg-indigo-500/20 text-indigo-400' : 'bg-amber-500/20 text-amber-400'}`}>{step1LocationData?.solar?.rating}</span>
                    </div>
                    <span className="text-slate-300 text-xs">ℹ️</span>
                  </div>
                  <div className="text-lg font-bold text-white">{step1LocationData?.solar?.peakSunHours} <span className="text-xs font-normal text-slate-300">peak sun hrs/day</span></div>
                  <div className="text-[10px] text-slate-300">{(step1LocationData?.solar?.annualOutput || 0).toLocaleString()} kWh/kW annually</div>
                  {/* Hover Popup - Solar */}
                  {hoveredCard === 'solar' && (
                    <div className="fixed left-[42%] bottom-[12%] -translate-x-1/2 bg-slate-100 rounded-2xl p-6 z-[100] shadow-xl border border-slate-300 max-h-[78vh] overflow-y-auto" style={{width: '720px'}}>
                      <div className="flex items-center justify-between mb-5 pb-4 border-b border-slate-300">
                        <div className="flex items-center gap-3">
                          <div className="w-1 h-12 rounded-full bg-amber-500"></div>
                          <div>
                            <div className="text-xl font-bold text-slate-800">Solar Resource Analysis</div>
                            <div className="text-sm text-slate-300">{(step1LocationData?.solar?.annualOutput || 0).toLocaleString()} kWh/kW annually</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-xs text-slate-300 uppercase">Rating</div>
                          <div className={`text-lg font-bold ${step1LocationData?.solar?.rating === 'Excellent' ? 'text-indigo-600' : step1LocationData?.solar?.rating === 'Good' ? 'text-indigo-600' : 'text-amber-600'}`}>{step1LocationData?.solar?.rating}</div>
                        </div>
                      </div>
                      
                      {/* Solar Resource Section */}
                      <div className="mb-5">
                        <div className="flex items-center gap-2 mb-3">
                          <div className="w-1 h-4 rounded-full bg-amber-500"></div>
                          <span className="text-xs font-semibold text-slate-300 uppercase tracking-wide">Solar Resource</span>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                          <div className="border-l-2 border-slate-300 pl-3">
                            <div className="text-xs text-slate-300">Peak Sun Hours</div>
                            <div className="text-xl font-bold text-slate-800">{step1LocationData?.solar?.peakSunHours}h</div>
                            <div className="text-xs text-slate-300">per day avg</div>
                          </div>
                          <div className="border-l-2 border-slate-300 pl-3">
                            <div className="text-xs text-slate-300">Annual Output</div>
                            <div className="text-xl font-bold text-slate-800">{(step1LocationData?.solar?.annualOutput || 0).toLocaleString()}</div>
                            <div className="text-xs text-slate-300">kWh/kW</div>
                          </div>
                          <div className={`border-l-2 pl-3 -ml-1 py-1 rounded-r ${step1LocationData?.solar?.climate === 'Sunny' ? 'border-amber-500 bg-amber-100' : step1LocationData?.solar?.climate === 'Mild' ? 'border-indigo-500 bg-indigo-100' : 'border-slate-400 bg-slate-200'}`}>
                            <div className="text-2xl mb-0.5">{step1LocationData?.solar?.climate === 'Sunny' ? '☀️' : step1LocationData?.solar?.climate === 'Cloudy' ? '☁️' : step1LocationData?.solar?.climate === 'Humid' ? '💧' : '🌤️'}</div>
                            <div className={`text-sm font-semibold ${step1LocationData?.solar?.climate === 'Sunny' ? 'text-amber-600' : step1LocationData?.solar?.climate === 'Mild' ? 'text-indigo-600' : 'text-slate-300'}`}>{step1LocationData?.solar?.climate}</div>
                          </div>
                          <div className="border-l-2 border-slate-300 pl-3">
                            <div className="text-xs text-slate-300">Seasonality</div>
                            <div className="text-lg font-bold text-slate-800">{step1LocationData?.solar?.climate === 'Sunny' ? '±12%' : step1LocationData?.solar?.climate === 'Cloudy' ? '±25%' : '±18%'}</div>
                            <div className="text-xs text-slate-300">variation</div>
                          </div>
                          <div className="border-l-2 border-indigo-500 bg-indigo-100 pl-3 -ml-1 py-1 rounded-r">
                            <div className="text-xs text-indigo-500">Optimal Tilt</div>
                            <div className="text-xl font-bold text-indigo-600">~{step1State === 'AZ' || step1State === 'NV' || step1State === 'TX' || step1State === 'FL' ? '25' : step1State === 'CA' ? '30' : step1State === 'MI' || step1State === 'MA' || step1State === 'NY' || step1State === 'WA' ? '40' : '35'}°</div>
                            <div className="text-xs text-indigo-500">for max output</div>
                          </div>
                        </div>
                      </div>
                      
                      {/* System Design Recommendations */}
                      <div className="mb-5">
                        <div className="flex items-center gap-2 mb-3">
                          <div className="w-1 h-4 rounded-full bg-indigo-500"></div>
                          <span className="text-xs font-semibold text-slate-300 uppercase tracking-wide">System Design Recommendations</span>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                          <div className="border-l-2 border-slate-300 pl-3">
                            <div className="text-xs text-slate-300">DC/AC Ratio</div>
                            <div className="text-lg font-bold text-slate-800">{step1LocationData?.solar?.climate === 'Sunny' ? '1.25-1.35' : '1.15-1.25'}</div>
                            <div className="text-xs text-slate-300">recommended</div>
                          </div>
                          <div className="border-l-2 border-slate-300 pl-3">
                            <div className="text-xs text-slate-300">Degradation</div>
                            <div className="text-lg font-bold text-slate-800">0.4-0.5%</div>
                            <div className="text-xs text-slate-300">per year</div>
                          </div>
                          <div className={`border-l-2 pl-3 -ml-1 py-1 rounded-r ${step1LocationData?.solar?.climate === 'Sunny' ? 'border-indigo-500 bg-indigo-100' : 'border-indigo-500 bg-indigo-100'}`}>
                            <div className={`text-xs ${step1LocationData?.solar?.climate === 'Sunny' ? 'text-indigo-500' : 'text-indigo-500'}`}>Module Type</div>
                            <div className={`text-sm font-bold ${step1LocationData?.solar?.climate === 'Sunny' ? 'text-indigo-600' : 'text-indigo-600'}`}>{step1LocationData?.solar?.climate === 'Sunny' ? 'Bifacial' : 'Mono PERC'}</div>
                            <div className={`text-xs ${step1LocationData?.solar?.climate === 'Sunny' ? 'text-indigo-500' : 'text-indigo-500'}`}>{step1LocationData?.solar?.climate === 'Sunny' ? '+5-10% gain' : 'Best value'}</div>
                          </div>
                          <div className="border-l-2 border-slate-300 pl-3">
                            <div className="text-xs text-slate-300">Inverter</div>
                            <div className="text-sm font-bold text-slate-800">String</div>
                            <div className="text-xs text-slate-300">for commercial</div>
                          </div>
                          <div className="border-l-2 border-slate-300 pl-3">
                            <div className="text-xs text-slate-300">Temp Coeff</div>
                            <div className="text-lg font-bold text-slate-800">{step1LocationData?.weather?.heat === 'High' || step1LocationData?.weather?.heat === 'Extreme' ? '≤-0.30' : '≤-0.35'}%</div>
                            <div className="text-xs text-slate-300">per °C</div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Financial Returns Section */}
                      <div>
                        <div className="flex items-center gap-2 mb-3">
                          <div className="w-1 h-4 rounded-full bg-indigo-500"></div>
                          <span className="text-xs font-semibold text-slate-300 uppercase tracking-wide">Financial Returns</span>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                          <div className="border-l-2 border-indigo-500 bg-indigo-100 pl-3 -ml-1 py-1 rounded-r">
                            <div className="text-xs text-indigo-500">Payback</div>
                            <div className="text-xl font-bold text-slate-800">4-8</div>
                            <div className="text-xs text-slate-300">yrs typical*</div>
                          </div>
                          <div className="border-l-2 border-indigo-500 bg-indigo-100 pl-3 -ml-1 py-1 rounded-r">
                            <div className="text-xs text-indigo-500">Est. ROI</div>
                            <div className="text-xl font-bold text-indigo-600">{step1LocationData?.electric?.level === 'Very High' ? '20-30' : step1LocationData?.electric?.level === 'High' ? '15-25' : '12-18'}%</div>
                          </div>
                          <div className="border-l-2 border-slate-300 pl-3">
                            <div className="text-xs text-slate-300">25yr NPV</div>
                            <div className="text-lg font-bold text-indigo-600">+${Math.round(annualBill * 0.35 * 15 / 1000)}K</div>
                            <div className="text-xs text-slate-300">estimated</div>
                          </div>
                          <div className="border-l-2 border-slate-300 pl-3">
                            <div className="text-xs text-slate-300">IRR</div>
                            <div className="text-lg font-bold text-slate-800">{step1LocationData?.electric?.level === 'Very High' ? '18-25' : step1LocationData?.electric?.level === 'High' ? '15-20' : '10-15'}%</div>
                          </div>
                          <div className="border-l-2 border-slate-300 pl-3">
                            <div className="text-xs text-slate-300">Warranty</div>
                            <div className="text-lg font-bold text-slate-800">25 yr</div>
                            <div className="text-xs text-slate-300">production</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Electric Card */}
                <div 
                  className="relative border-r border-b border-slate-700 p-3 bg-slate-800 hover:bg-slate-700 cursor-pointer transition-colors"
                  onMouseEnter={() => setHoveredCard('electric')}
                  onMouseLeave={() => setHoveredCard(null)}
                  onClick={() => setHoveredCard(hoveredCard === 'electric' ? null : 'electric')}
                >
                  <div className="flex items-center justify-between mb-0.5">
                    <div className="flex items-center gap-1">
                      <span className={`text-sm ${step1LocationData?.electric?.level === 'Very High' || step1LocationData?.electric?.level === 'High' ? 'text-red-600' : 'text-indigo-400'}`}>⚡</span>
                      <span className="text-[10px] font-bold uppercase tracking-wide text-slate-300">Electric</span>
                      <span className={`text-[9px] px-1 py-0.5 rounded font-medium ${step1LocationData?.electric?.level === 'Very High' ? 'bg-red-500/20 text-red-400' : step1LocationData?.electric?.level === 'High' ? 'bg-orange-500/20 text-orange-400' : step1LocationData?.electric?.level === 'Low' ? 'bg-indigo-500/20 text-indigo-400' : 'bg-amber-500/20 text-amber-400'}`}>{step1LocationData?.electric?.level}</span>
                    </div>
                    <span className="text-slate-300 text-xs">ℹ️</span>
                  </div>
                  <div className="text-lg font-bold text-white">${((step1LocationData?.electric?.rate) || 0).toFixed(2)}<span className="text-xs font-normal text-slate-300">/kWh</span></div>
                  <div className="text-[10px] text-slate-300">Peak: ${((step1LocationData?.electric?.peakRate) || 0).toFixed(2)}/kWh</div>
                  {/* Hover Popup - Electric */}
                  {hoveredCard === 'electric' && (
                    <div className="fixed left-[42%] bottom-[12%] -translate-x-1/2 bg-slate-100 rounded-2xl p-6 z-[100] shadow-xl border border-slate-300 max-h-[78vh] overflow-y-auto" style={{width: '720px'}}>
                      <div className="flex items-center justify-between mb-5 pb-4 border-b border-slate-300">
                        <div className="flex items-center gap-3">
                          <div className={`w-1 h-12 rounded-full ${step1LocationData?.electric?.level === 'Very High' || step1LocationData?.electric?.level === 'High' ? 'bg-red-500' : 'bg-indigo-500'}`}></div>
                          <div>
                            <div className="text-xl font-bold text-slate-800">Electric Rate Analysis</div>
                            <div className="text-sm text-slate-300">{step1LocationData?.utility} • Commercial TOU Rate</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-xs text-slate-300 uppercase">Rate Level</div>
                          <div className={`text-lg font-bold ${step1LocationData?.electric?.level === 'Very High' ? 'text-red-600' : step1LocationData?.electric?.level === 'High' ? 'text-orange-600' : step1LocationData?.electric?.level === 'Low' ? 'text-indigo-600' : 'text-amber-600'}`}>{step1LocationData?.electric?.level}</div>
                        </div>
                      </div>
                      
                      {/* Rate Structure Section */}
                      <div className="mb-5">
                        <div className="flex items-center gap-2 mb-3">
                          <div className="w-1 h-4 rounded-full bg-indigo-500"></div>
                          <span className="text-xs font-semibold text-slate-300 uppercase tracking-wide">Rate Structure</span>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                          <div className="border-l-2 border-slate-300 pl-3">
                            <div className="text-xs text-slate-300">Commercial Rate</div>
                            <div className="text-xl font-bold text-slate-800">${((step1LocationData?.electric?.rate) || 0).toFixed(2)}</div>
                            <div className="text-xs text-slate-300">/kWh avg</div>
                          </div>
                          <div className="border-l-2 border-red-500 pl-3 -ml-1 py-1 rounded-r bg-red-100">
                            <div className="text-xs text-indigo-400">Peak (4-9pm)</div>
                            <div className="text-xl font-bold text-red-600">${((step1LocationData?.electric?.peakRate) || 0).toFixed(2)}</div>
                            <div className="text-xs text-red-600">/kWh</div>
                          </div>
                          <div className="border-l-2 border-indigo-500 pl-3 -ml-1 py-1 rounded-r bg-indigo-100">
                            <div className="text-xs text-indigo-500">Off-Peak</div>
                            <div className="text-xl font-bold text-indigo-600">${((step1LocationData?.electric?.offPeakRate) || 0).toFixed(2)}</div>
                            <div className="text-xs text-indigo-600">/kWh</div>
                          </div>
                          <div className={`border-l-2 pl-3 -ml-1 py-1 rounded-r ${(step1LocationData?.electric?.demandCharge || 0) >= 15 ? 'border-red-500 bg-red-100' : 'border-slate-300'}`}>
                            <div className={`text-xs ${(step1LocationData?.electric?.demandCharge || 0) >= 15 ? 'text-indigo-400' : 'text-slate-300'}`}>Demand Charge</div>
                            <div className={`text-xl font-bold ${(step1LocationData?.electric?.demandCharge || 0) >= 15 ? 'text-red-600' : 'text-slate-800'}`}>${step1LocationData?.electric?.demandCharge}</div>
                            <div className={`text-xs ${(step1LocationData?.electric?.demandCharge || 0) >= 15 ? 'text-indigo-400' : 'text-slate-300'}`}>/kW peak</div>
                          </div>
                          <div className="border-l-2 border-slate-300 pl-3">
                            <div className="text-xs text-slate-300">Customer Charge</div>
                            <div className="text-lg font-bold text-slate-800">$25-75</div>
                            <div className="text-xs text-slate-300">/month fixed</div>
                          </div>
                        </div>
                      </div>
                      
                      {/* TOU Windows & Arbitrage */}
                      <div className="mb-5">
                        <div className="flex items-center gap-2 mb-3">
                          <div className="w-1 h-4 rounded-full bg-indigo-500"></div>
                          <span className="text-xs font-semibold text-slate-300 uppercase tracking-wide">TOU Windows & Arbitrage Opportunity</span>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                          <div className="border-l-2 border-red-500 bg-red-50 pl-3 -ml-1 py-1 rounded-r">
                            <div className="text-xs text-indigo-400">Peak Window</div>
                            <div className="text-sm font-bold text-red-600">4pm-9pm</div>
                            <div className="text-xs text-indigo-400">weekdays</div>
                          </div>
                          <div className="border-l-2 border-amber-500 bg-amber-50 pl-3 -ml-1 py-1 rounded-r">
                            <div className="text-xs text-amber-500">Mid-Peak</div>
                            <div className="text-sm font-bold text-amber-600">12pm-4pm</div>
                            <div className="text-xs text-amber-500">9pm-12am</div>
                          </div>
                          <div className="border-l-2 border-indigo-500 bg-indigo-50 pl-3 -ml-1 py-1 rounded-r">
                            <div className="text-xs text-indigo-500">Off-Peak</div>
                            <div className="text-sm font-bold text-indigo-600">12am-12pm</div>
                            <div className="text-xs text-indigo-500">+ weekends</div>
                          </div>
                          <div className={`border-l-2 pl-3 -ml-1 py-1 rounded-r ${((step1LocationData?.electric?.peakRate || 0) - (step1LocationData?.electric?.offPeakRate || 0)) >= 0.12 ? 'border-indigo-500 bg-indigo-100' : 'border-slate-300'}`}>
                            <div className={`text-xs ${((step1LocationData?.electric?.peakRate || 0) - (step1LocationData?.electric?.offPeakRate || 0)) >= 0.12 ? 'text-indigo-500' : 'text-slate-300'}`}>Spread</div>
                            <div className={`text-lg font-bold ${((step1LocationData?.electric?.peakRate || 0) - (step1LocationData?.electric?.offPeakRate || 0)) >= 0.12 ? 'text-indigo-600' : 'text-slate-800'}`}>${(((step1LocationData?.electric?.peakRate) || 0) - ((step1LocationData?.electric?.offPeakRate) || 0)).toFixed(2)}</div>
                            <div className={`text-xs ${((step1LocationData?.electric?.peakRate || 0) - (step1LocationData?.electric?.offPeakRate || 0)) >= 0.12 ? 'text-indigo-500' : 'text-slate-300'}`}>/kWh arbitrage</div>
                          </div>
                          <div className={`border-l-2 pl-3 -ml-1 py-1 rounded-r ${((step1LocationData?.electric?.peakRate || 0) - (step1LocationData?.electric?.offPeakRate || 0)) >= 0.12 ? 'border-indigo-500 bg-indigo-100' : 'border-slate-300'}`}>
                            <div className={`text-xs ${((step1LocationData?.electric?.peakRate || 0) - (step1LocationData?.electric?.offPeakRate || 0)) >= 0.12 ? 'text-indigo-500' : 'text-slate-300'}`}>BESS Value</div>
                            <div className={`text-sm font-bold ${((step1LocationData?.electric?.peakRate || 0) - (step1LocationData?.electric?.offPeakRate || 0)) >= 0.12 ? 'text-indigo-600' : 'text-slate-600'}`}>{((step1LocationData?.electric?.peakRate || 0) - (step1LocationData?.electric?.offPeakRate || 0)) >= 0.15 ? 'Excellent' : ((step1LocationData?.electric?.peakRate || 0) - (step1LocationData?.electric?.offPeakRate || 0)) >= 0.10 ? 'Good' : 'Moderate'}</div>
                            <div className={`text-xs ${((step1LocationData?.electric?.peakRate || 0) - (step1LocationData?.electric?.offPeakRate || 0)) >= 0.12 ? 'text-indigo-500' : 'text-slate-300'}`}>for storage</div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Utility Programs */}
                      <div className="mb-5">
                        <div className="flex items-center gap-2 mb-3">
                          <div className="w-1 h-4 rounded-full bg-indigo-500"></div>
                          <span className="text-xs font-semibold text-slate-300 uppercase tracking-wide">Utility Programs Available</span>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                          <div className="border-l-2 border-indigo-500 bg-indigo-100 pl-3 -ml-1 py-1 rounded-r">
                            <div className="text-xs text-indigo-500">Demand Response</div>
                            <div className="text-sm font-bold text-indigo-600">Available</div>
                            <div className="text-xs text-indigo-500">$50-200/kW</div>
                          </div>
                          <div className={`border-l-2 pl-3 -ml-1 py-1 rounded-r ${step1State === 'CA' || step1State === 'NY' || step1State === 'MA' ? 'border-indigo-500 bg-indigo-100' : 'border-slate-300'}`}>
                            <div className={`text-xs ${step1State === 'CA' || step1State === 'NY' || step1State === 'MA' ? 'text-indigo-500' : 'text-slate-300'}`}>SGIP/Rebates</div>
                            <div className={`text-sm font-bold ${step1State === 'CA' || step1State === 'NY' || step1State === 'MA' ? 'text-indigo-600' : 'text-slate-600'}`}>{step1State === 'CA' ? 'SGIP' : step1State === 'NY' ? 'VDER' : step1State === 'MA' ? 'SMART' : 'Check'}</div>
                            <div className={`text-xs ${step1State === 'CA' || step1State === 'NY' || step1State === 'MA' ? 'text-indigo-500' : 'text-slate-300'}`}>{step1State === 'CA' || step1State === 'NY' || step1State === 'MA' ? 'Storage incentive' : 'Utility website'}</div>
                          </div>
                          <div className="border-l-2 border-indigo-500 bg-indigo-100 pl-3 -ml-1 py-1 rounded-r">
                            <div className="text-xs text-indigo-500">EV Rate</div>
                            <div className="text-sm font-bold text-indigo-600">Available</div>
                            <div className="text-xs text-indigo-500">Lower off-peak</div>
                          </div>
                          <div className="border-l-2 border-slate-300 pl-3">
                            <div className="text-xs text-slate-300">Green Power</div>
                            <div className="text-sm font-bold text-slate-600">Optional</div>
                            <div className="text-xs text-slate-300">+$0.01-0.03</div>
                          </div>
                          <div className="border-l-2 border-slate-300 pl-3">
                            <div className="text-xs text-slate-300">Real-Time Pricing</div>
                            <div className="text-sm font-bold text-slate-600">{step1State === 'IL' || step1State === 'TX' ? 'Yes' : 'Limited'}</div>
                            <div className="text-xs text-slate-300">{step1State === 'IL' || step1State === 'TX' ? 'Hourly rates' : 'Ask utility'}</div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Comparison & Trends Section */}
                      <div>
                        <div className="flex items-center gap-2 mb-3">
                          <div className="w-1 h-4 rounded-full bg-slate-400"></div>
                          <span className="text-xs font-semibold text-slate-300 uppercase tracking-wide">Comparison & Trends</span>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                          <div className={`border-l-2 pl-3 -ml-1 py-1 rounded-r ${step1LocationData?.electric?.rate <= 0.12 ? 'border-indigo-500 bg-indigo-100' : step1LocationData?.electric?.rate >= 0.20 ? 'border-red-500 bg-red-100' : 'border-amber-500 bg-amber-100'}`}>
                            <div className={`text-xs ${step1LocationData?.electric?.rate <= 0.12 ? 'text-indigo-500' : step1LocationData?.electric?.rate >= 0.20 ? 'text-indigo-400' : 'text-amber-500'}`}>vs National Avg</div>
                            <div className={`text-xl font-bold ${step1LocationData?.electric?.rate <= 0.12 ? 'text-indigo-600' : step1LocationData?.electric?.rate >= 0.20 ? 'text-red-600' : 'text-amber-600'}`}>{step1LocationData?.electric?.rate <= 0.12 ? '≤0%' : `+${Math.round(((step1LocationData?.electric?.rate || 0.12) - 0.12) / 0.12 * 100)}%`}</div>
                            <div className="text-xs text-slate-300">$0.128 baseline</div>
                          </div>
                          <div className="border-l-2 border-red-500 bg-red-50 pl-3 -ml-1 py-1 rounded-r">
                            <div className="text-xs text-indigo-400">5yr Trend</div>
                            <div className="text-lg font-bold text-red-600">+{step1LocationData?.electric?.level === 'Very High' ? '35' : step1LocationData?.electric?.level === 'High' ? '30' : '25'}%</div>
                            <div className="text-xs text-indigo-400">historical rise</div>
                          </div>
                          <div className="border-l-2 border-amber-500 bg-amber-50 pl-3 -ml-1 py-1 rounded-r">
                            <div className="text-xs text-amber-500">2025 Forecast</div>
                            <div className="text-lg font-bold text-amber-600">+5-8%</div>
                            <div className="text-xs text-amber-500">expected</div>
                          </div>
                          <div className={`border-l-2 pl-3 -ml-1 py-1 rounded-r ${step1LocationData?.electric?.level === 'Very High' || step1LocationData?.electric?.level === 'High' ? 'border-indigo-500 bg-indigo-100' : 'border-slate-300'}`}>
                            <div className={`text-xs ${step1LocationData?.electric?.level === 'Very High' || step1LocationData?.electric?.level === 'High' ? 'text-indigo-500' : 'text-slate-300'}`}>Solar ROI</div>
                            <div className={`text-lg font-bold ${step1LocationData?.electric?.level === 'Very High' ? 'text-indigo-600' : step1LocationData?.electric?.level === 'High' ? 'text-indigo-600' : 'text-slate-600'}`}>{step1LocationData?.electric?.level === 'Very High' ? 'Excellent' : step1LocationData?.electric?.level === 'High' ? 'Strong' : 'Moderate'}</div>
                            <div className={`text-xs ${step1LocationData?.electric?.level === 'Very High' || step1LocationData?.electric?.level === 'High' ? 'text-indigo-500' : 'text-slate-300'}`}>{step1LocationData?.electric?.level === 'Very High' || step1LocationData?.electric?.level === 'High' ? '5-7yr payback' : '7-10yr payback'}</div>
                          </div>
                          <div className="border-l-2 border-indigo-500 bg-indigo-100 pl-3 -ml-1 py-1 rounded-r">
                            <div className="text-xs text-indigo-500">TOU Available</div>
                            <div className="text-lg font-bold text-indigo-600">Yes</div>
                            <div className="text-xs text-indigo-500">Time-of-Use</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Climate/Weather Card */}
                <div 
                  className="relative border-b border-slate-700 p-3 bg-slate-800 hover:bg-slate-700 cursor-pointer transition-colors"
                  onMouseEnter={() => setHoveredCard('weather')}
                  onMouseLeave={() => setHoveredCard(null)}
                  onClick={() => setHoveredCard(hoveredCard === 'weather' ? null : 'weather')}
                >
                  <div className="flex items-center justify-between mb-0.5">
                    <div className="flex items-center gap-1">
                      <span className={`text-sm ${step1LocationData?.weather?.risk === 'High' ? 'text-red-600' : step1LocationData?.weather?.risk === 'Moderate' ? 'text-amber-600' : 'text-indigo-400'}`}>🌡️</span>
                      <span className="text-[10px] font-bold uppercase tracking-wide text-slate-300">Climate</span>
                      <span className={`text-[9px] px-1 py-0.5 rounded font-medium ${step1LocationData?.weather?.risk === 'High' ? 'bg-red-500/20 text-red-400' : step1LocationData?.weather?.risk === 'Moderate' ? 'bg-amber-500/20 text-amber-400' : 'bg-indigo-500/20 text-indigo-400'}`}>{step1LocationData?.weather?.risk}</span>
                    </div>
                    <span className="text-slate-300 text-xs">ℹ️</span>
                  </div>
                  <div className={`text-lg font-bold ${step1LocationData?.weather?.risk === 'High' ? 'text-red-600' : step1LocationData?.weather?.risk === 'Moderate' ? 'text-amber-600' : 'text-indigo-400'}`}>{step1LocationData?.weather?.risk} Risk</div>
                  <div className="text-[10px] text-slate-300">
                    {[
                      step1LocationData?.weather?.heat === 'High' || step1LocationData?.weather?.heat === 'Extreme' ? 'Heat' : null,
                      step1LocationData?.weather?.drought === 'High' ? 'Drought' : null,
                      step1LocationData?.weather?.hurricane === 'High' || step1LocationData?.weather?.hurricane === 'Extreme' ? 'Hurricane' : null,
                      step1LocationData?.weather?.tornado === 'High' ? 'Tornado' : null,
                      step1LocationData?.weather?.wildfire === 'High' ? 'Wildfire' : null,
                      step1LocationData?.weather?.flood === 'High' ? 'Flood' : null,
                    ].filter(Boolean).join(' + ') || 'Low Risk Area'}
                  </div>
                  {/* Hover Popup - Weather */}
                  {hoveredCard === 'weather' && (
                    <div className="fixed left-[42%] bottom-[12%] -translate-x-1/2 bg-slate-100 rounded-2xl p-6 z-[100] shadow-xl border border-slate-300 max-h-[78vh] overflow-y-auto" style={{width: '720px'}}>
                      <div className="flex items-center justify-between mb-5 pb-4 border-b border-slate-300">
                        <div className="flex items-center gap-3">
                          <div className={`w-1 h-12 rounded-full ${step1LocationData?.weather?.risk === 'High' ? 'bg-red-500' : step1LocationData?.weather?.risk === 'Moderate' ? 'bg-amber-500' : 'bg-indigo-500'}`}></div>
                          <div>
                            <div className="text-xl font-bold text-slate-800">Weather Risk Analysis</div>
                            <div className="text-sm text-slate-300">{step1City}, {step1State}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-xs text-slate-300 uppercase">Overall Risk</div>
                          <div className={`text-lg font-bold ${step1LocationData?.weather?.risk === 'High' ? 'text-red-600' : step1LocationData?.weather?.risk === 'Moderate' ? 'text-amber-600' : 'text-indigo-600'}`}>{step1LocationData?.weather?.risk}</div>
                        </div>
                      </div>
                      
                      {/* Climate Risks Section */}
                      <div className="mb-5">
                        <div className="flex items-center gap-2 mb-3">
                          <div className="w-1 h-4 rounded-full bg-amber-500"></div>
                          <span className="text-xs font-semibold text-slate-300 uppercase tracking-wide">Climate Risks</span>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                          <div className={`border-l-2 pl-3 -ml-1 py-1 rounded-r ${step1LocationData?.weather?.heat === 'High' || step1LocationData?.weather?.heat === 'Extreme' ? 'border-red-500 bg-red-100' : step1LocationData?.weather?.heat === 'Moderate' ? 'border-amber-500 bg-amber-100' : 'border-indigo-500 bg-indigo-100'}`}>
                            <div className="text-xl mb-0.5">🌡️</div>
                            <div className={`text-xs ${step1LocationData?.weather?.heat === 'High' || step1LocationData?.weather?.heat === 'Extreme' ? 'text-indigo-400' : step1LocationData?.weather?.heat === 'Moderate' ? 'text-amber-500' : 'text-indigo-500'}`}>Heat</div>
                            <div className={`text-sm font-semibold ${step1LocationData?.weather?.heat === 'High' || step1LocationData?.weather?.heat === 'Extreme' ? 'text-red-600' : step1LocationData?.weather?.heat === 'Moderate' ? 'text-amber-600' : 'text-indigo-600'}`}>{step1LocationData?.weather?.heat}</div>
                          </div>
                          <div className={`border-l-2 pl-3 -ml-1 py-1 rounded-r ${step1LocationData?.weather?.snow === 'High' ? 'border-indigo-500 bg-indigo-100' : step1LocationData?.weather?.snow === 'Moderate' ? 'border-amber-500 bg-amber-100' : 'border-indigo-500 bg-indigo-100'}`}>
                            <div className="text-xl mb-0.5">❄️</div>
                            <div className={`text-xs ${step1LocationData?.weather?.snow === 'High' ? 'text-indigo-500' : step1LocationData?.weather?.snow === 'Moderate' ? 'text-amber-500' : 'text-indigo-500'}`}>Snow</div>
                            <div className={`text-sm font-semibold ${step1LocationData?.weather?.snow === 'High' ? 'text-indigo-600' : step1LocationData?.weather?.snow === 'Moderate' ? 'text-amber-600' : 'text-indigo-600'}`}>{step1LocationData?.weather?.snow}</div>
                          </div>
                          <div className={`border-l-2 pl-3 -ml-1 py-1 rounded-r ${step1LocationData?.weather?.flood === 'High' ? 'border-red-500 bg-red-100' : step1LocationData?.weather?.flood === 'Moderate' ? 'border-amber-500 bg-amber-100' : 'border-indigo-500 bg-indigo-100'}`}>
                            <div className="text-xl mb-0.5">🌊</div>
                            <div className={`text-xs ${step1LocationData?.weather?.flood === 'High' ? 'text-indigo-400' : step1LocationData?.weather?.flood === 'Moderate' ? 'text-amber-500' : 'text-indigo-500'}`}>Flood</div>
                            <div className={`text-sm font-semibold ${step1LocationData?.weather?.flood === 'High' ? 'text-red-600' : step1LocationData?.weather?.flood === 'Moderate' ? 'text-amber-600' : 'text-indigo-600'}`}>{step1LocationData?.weather?.flood}</div>
                          </div>
                          <div className={`border-l-2 pl-3 -ml-1 py-1 rounded-r ${step1LocationData?.weather?.drought === 'High' ? 'border-red-500 bg-red-100' : step1LocationData?.weather?.drought === 'Moderate' ? 'border-amber-500 bg-amber-100' : 'border-indigo-500 bg-indigo-100'}`}>
                            <div className="text-xl mb-0.5">🏜️</div>
                            <div className={`text-xs ${step1LocationData?.weather?.drought === 'High' ? 'text-indigo-400' : step1LocationData?.weather?.drought === 'Moderate' ? 'text-amber-500' : 'text-indigo-500'}`}>Drought</div>
                            <div className={`text-sm font-semibold ${step1LocationData?.weather?.drought === 'High' ? 'text-red-600' : step1LocationData?.weather?.drought === 'Moderate' ? 'text-amber-600' : 'text-indigo-600'}`}>{step1LocationData?.weather?.drought}</div>
                          </div>
                          <div className={`border-l-2 pl-3 -ml-1 py-1 rounded-r ${step1LocationData?.weather?.wildfire === 'High' ? 'border-red-500 bg-red-100' : step1LocationData?.weather?.wildfire === 'Moderate' ? 'border-amber-500 bg-amber-100' : 'border-indigo-500 bg-indigo-100'}`}>
                            <div className="text-xl mb-0.5">🔥</div>
                            <div className={`text-xs ${step1LocationData?.weather?.wildfire === 'High' ? 'text-indigo-400' : step1LocationData?.weather?.wildfire === 'Moderate' ? 'text-amber-500' : 'text-indigo-500'}`}>Wildfire</div>
                            <div className={`text-sm font-semibold ${step1LocationData?.weather?.wildfire === 'High' ? 'text-red-600' : step1LocationData?.weather?.wildfire === 'Moderate' ? 'text-amber-600' : 'text-indigo-600'}`}>{step1LocationData?.weather?.wildfire}</div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Design Conditions & Energy Impact */}
                      <div className="mb-5">
                        <div className="flex items-center gap-2 mb-3">
                          <div className="w-1 h-4 rounded-full bg-indigo-500"></div>
                          <span className="text-xs font-semibold text-slate-300 uppercase tracking-wide">Design Conditions & Energy Impact</span>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                          <div className="border-l-2 border-slate-300 pl-3">
                            <div className="text-xs text-slate-300">Cooling HDD</div>
                            <div className="text-lg font-bold text-slate-800">{step1LocationData?.weather?.heat === 'Extreme' ? '4,500+' : step1LocationData?.weather?.heat === 'High' ? '2,500-4,500' : step1LocationData?.weather?.heat === 'Moderate' ? '1,000-2,500' : '500-1,000'}</div>
                            <div className="text-xs text-slate-300">degree days</div>
                          </div>
                          <div className="border-l-2 border-slate-300 pl-3">
                            <div className="text-xs text-slate-300">Heating HDD</div>
                            <div className="text-lg font-bold text-slate-800">{step1LocationData?.weather?.snow === 'High' ? '6,000+' : step1LocationData?.weather?.snow === 'Moderate' ? '4,000-6,000' : step1LocationData?.weather?.heat === 'High' ? '500-2,000' : '2,000-4,000'}</div>
                            <div className="text-xs text-slate-300">degree days</div>
                          </div>
                          <div className={`border-l-2 pl-3 -ml-1 py-1 rounded-r ${step1LocationData?.weather?.heat === 'High' || step1LocationData?.weather?.heat === 'Extreme' ? 'border-red-500 bg-red-100' : 'border-indigo-500 bg-indigo-100'}`}>
                            <div className={`text-xs ${step1LocationData?.weather?.heat === 'High' || step1LocationData?.weather?.heat === 'Extreme' ? 'text-indigo-400' : 'text-indigo-500'}`}>Peak Demand</div>
                            <div className={`text-sm font-bold ${step1LocationData?.weather?.heat === 'High' || step1LocationData?.weather?.heat === 'Extreme' ? 'text-red-600' : 'text-indigo-600'}`}>{step1LocationData?.weather?.heat === 'High' || step1LocationData?.weather?.heat === 'Extreme' ? 'Summer' : step1LocationData?.weather?.snow === 'High' ? 'Winter' : 'Summer'}</div>
                            <div className={`text-xs ${step1LocationData?.weather?.heat === 'High' || step1LocationData?.weather?.heat === 'Extreme' ? 'text-indigo-400' : 'text-indigo-500'}`}>peak season</div>
                          </div>
                          <div className="border-l-2 border-slate-300 pl-3">
                            <div className="text-xs text-slate-300">Hail Rating</div>
                            <div className="text-sm font-bold text-slate-800">{['TX', 'OK', 'KS', 'NE', 'CO', 'SD'].includes(step1State) ? 'Class 3-4' : 'Class 1-2'}</div>
                            <div className="text-xs text-slate-300">panel req'd</div>
                          </div>
                          <div className={`border-l-2 pl-3 -ml-1 py-1 rounded-r ${step1LocationData?.weather?.snow === 'High' ? 'border-indigo-500 bg-indigo-100' : 'border-indigo-500 bg-indigo-100'}`}>
                            <div className={`text-xs ${step1LocationData?.weather?.snow === 'High' ? 'text-indigo-500' : 'text-indigo-500'}`}>Snow Loss</div>
                            <div className={`text-lg font-bold ${step1LocationData?.weather?.snow === 'High' ? 'text-indigo-600' : 'text-indigo-600'}`}>{step1LocationData?.weather?.snow === 'High' ? '5-15%' : step1LocationData?.weather?.snow === 'Moderate' ? '2-5%' : '<1%'}</div>
                            <div className={`text-xs ${step1LocationData?.weather?.snow === 'High' ? 'text-indigo-500' : 'text-indigo-500'}`}>annual output</div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Grid & Infrastructure Section */}
                      <div>
                        <div className="flex items-center gap-2 mb-3">
                          <div className="w-1 h-4 rounded-full bg-indigo-500"></div>
                          <span className="text-xs font-semibold text-slate-300 uppercase tracking-wide">Grid & Infrastructure</span>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                          <div className={`border-l-2 pl-3 -ml-1 py-1 rounded-r ${step1LocationData?.grid?.psps === 'High' ? 'border-red-500 bg-red-100' : step1LocationData?.grid?.psps === 'Moderate' ? 'border-amber-500 bg-amber-100' : 'border-indigo-500 bg-indigo-100'}`}>
                            <div className="text-xl mb-0.5">⚡</div>
                            <div className={`text-xs ${step1LocationData?.grid?.psps === 'High' ? 'text-indigo-400' : step1LocationData?.grid?.psps === 'Moderate' ? 'text-amber-500' : 'text-indigo-500'}`}>PSPS Risk</div>
                            <div className={`text-sm font-semibold ${step1LocationData?.grid?.psps === 'High' ? 'text-red-600' : step1LocationData?.grid?.psps === 'Moderate' ? 'text-amber-600' : 'text-indigo-600'}`}>{step1LocationData?.grid?.psps}</div>
                          </div>
                          <div className={`border-l-2 pl-3 -ml-1 py-1 rounded-r ${step1LocationData?.grid?.gridStress === 'High' ? 'border-red-500 bg-red-100' : step1LocationData?.grid?.gridStress === 'Moderate' ? 'border-amber-500 bg-amber-100' : 'border-indigo-500 bg-indigo-100'}`}>
                            <div className="text-xl mb-0.5">📊</div>
                            <div className={`text-xs ${step1LocationData?.grid?.gridStress === 'High' ? 'text-indigo-400' : step1LocationData?.grid?.gridStress === 'Moderate' ? 'text-amber-500' : 'text-indigo-500'}`}>Grid Stress</div>
                            <div className={`text-sm font-semibold ${step1LocationData?.grid?.gridStress === 'High' ? 'text-red-600' : step1LocationData?.grid?.gridStress === 'Moderate' ? 'text-amber-600' : 'text-indigo-600'}`}>{step1LocationData?.grid?.gridStress}</div>
                          </div>
                          <div className={`border-l-2 pl-3 -ml-1 py-1 rounded-r ${(step1LocationData?.grid?.outages || '').includes('5') || (step1LocationData?.grid?.outages || '').includes('6') || (step1LocationData?.grid?.outages || '').includes('8') || (step1LocationData?.grid?.outages || '').includes('10') ? 'border-red-500 bg-red-100' : (step1LocationData?.grid?.outages || '').includes('3') || (step1LocationData?.grid?.outages || '').includes('4') ? 'border-amber-500 bg-amber-100' : 'border-indigo-500 bg-indigo-100'}`}>
                            <div className="text-xl mb-0.5">🔌</div>
                            <div className={`text-xs ${(step1LocationData?.grid?.outages || '').includes('5') || (step1LocationData?.grid?.outages || '').includes('6') || (step1LocationData?.grid?.outages || '').includes('8') || (step1LocationData?.grid?.outages || '').includes('10') ? 'text-indigo-400' : (step1LocationData?.grid?.outages || '').includes('3') || (step1LocationData?.grid?.outages || '').includes('4') ? 'text-amber-500' : 'text-indigo-500'}`}>Outages/Yr</div>
                            <div className={`text-sm font-semibold ${(step1LocationData?.grid?.outages || '').includes('5') || (step1LocationData?.grid?.outages || '').includes('6') || (step1LocationData?.grid?.outages || '').includes('8') || (step1LocationData?.grid?.outages || '').includes('10') ? 'text-red-600' : (step1LocationData?.grid?.outages || '').includes('3') || (step1LocationData?.grid?.outages || '').includes('4') ? 'text-amber-600' : 'text-indigo-600'}`}>{step1LocationData?.grid?.outages}</div>
                          </div>
                          <div className={`border-l-2 pl-3 -ml-1 py-1 rounded-r ${step1LocationData?.grid?.backupNeed === 'Critical' || step1LocationData?.grid?.backupNeed === 'High' ? 'border-red-500 bg-red-100' : step1LocationData?.grid?.backupNeed === 'Medium' ? 'border-amber-500 bg-amber-100' : 'border-indigo-500 bg-indigo-100'}`}>
                            <div className="text-xl mb-0.5">🔋</div>
                            <div className={`text-xs ${step1LocationData?.grid?.backupNeed === 'Critical' || step1LocationData?.grid?.backupNeed === 'High' ? 'text-indigo-400' : step1LocationData?.grid?.backupNeed === 'Medium' ? 'text-amber-500' : 'text-indigo-500'}`}>Backup Need</div>
                            <div className={`text-sm font-semibold ${step1LocationData?.grid?.backupNeed === 'Critical' ? 'text-red-600' : step1LocationData?.grid?.backupNeed === 'High' ? 'text-orange-600' : step1LocationData?.grid?.backupNeed === 'Medium' ? 'text-amber-600' : 'text-indigo-600'}`}>{step1LocationData?.grid?.backupNeed}</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Row 2: Incentives, Battery, Gas */}
                
                {/* Incentives Card */}
                <div 
                  className="relative border-r border-b border-slate-700 p-3 bg-slate-800 hover:bg-slate-700 cursor-pointer transition-colors"
                  onMouseEnter={() => setHoveredCard('incentives')}
                  onMouseLeave={() => setHoveredCard(null)}
                  onClick={() => setHoveredCard(hoveredCard === 'incentives' ? null : 'incentives')}
                >
                  <div className="flex items-center justify-between mb-0.5">
                    <div className="flex items-center gap-1">
                      <span className="text-indigo-600 text-sm">💰</span>
                      <span className="text-[10px] font-bold uppercase tracking-wide text-slate-300">Incentives</span>
                      <span className={`text-[9px] px-1 py-0.5 rounded font-medium ${step1LocationData?.incentives?.rating === 'Excellent' ? 'bg-indigo-500/20 text-indigo-400' : 'bg-indigo-500/20 text-indigo-400'}`}>{step1LocationData?.incentives?.rating}</span>
                    </div>
                    <span className="text-slate-300 text-xs">ℹ️</span>
                  </div>
                  <div className="text-lg font-bold text-white">~{step1LocationData?.incentives?.total}% <span className="text-xs font-normal text-slate-300">Off</span></div>
                  <div className="text-[10px] text-slate-300">ITC + MACRS {step1LocationData?.incentives?.state > 0 ? '+ State' : ''}</div>
                  {/* Hover Popup - Incentives */}
                  {hoveredCard === 'incentives' && (
                    <div className="fixed left-[42%] bottom-[12%] -translate-x-1/2 bg-slate-100 rounded-2xl p-6 z-[100] shadow-xl border border-slate-300 max-h-[78vh] overflow-y-auto" style={{width: '720px'}}>
                      <div className="flex items-center justify-between mb-5 pb-4 border-b border-slate-300">
                        <div className="flex items-center gap-3">
                          <div className="w-1 h-12 rounded-full bg-indigo-500"></div>
                          <div>
                            <div className="text-xl font-bold text-slate-800">Incentives & Tax Credits</div>
                            <div className="text-sm text-slate-300">~{step1LocationData?.incentives?.total}% effective discount</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-xs text-slate-300 uppercase">Rating</div>
                          <div className={`text-lg font-bold ${step1LocationData?.incentives?.rating === 'Excellent' ? 'text-indigo-600' : 'text-indigo-600'}`}>{step1LocationData?.incentives?.rating}</div>
                        </div>
                      </div>
                      
                      {/* Federal Incentives */}
                      <div className="mb-5">
                        <div className="flex items-center gap-2 mb-3">
                          <div className="w-1 h-4 rounded-full bg-indigo-500"></div>
                          <span className="text-xs font-semibold text-slate-300 uppercase tracking-wide">Federal Incentives</span>
                        </div>
                        <div className="grid grid-cols-3 gap-3">
                          <div className="border-l-2 border-indigo-500 pl-3 -ml-1 py-1 rounded-r bg-indigo-100">
                            <div className="text-xs text-indigo-500">Federal ITC</div>
                            <div className="text-2xl font-bold text-indigo-600">{step1LocationData?.incentives?.federal}%</div>
                            <div className="text-xs text-indigo-500">Tax Credit</div>
                          </div>
                          <div className="border-l-2 border-indigo-500 pl-3 -ml-1 py-1 rounded-r bg-indigo-100">
                            <div className="text-xs text-indigo-500">MACRS Depreciation</div>
                            <div className="text-2xl font-bold text-indigo-600">~{step1LocationData?.incentives?.macrs}%</div>
                            <div className="text-xs text-indigo-500">5-year accelerated</div>
                          </div>
                          <div className="border-l-2 border-indigo-500 pl-3 -ml-1 py-1 rounded-r bg-indigo-100">
                            <div className="text-xs text-indigo-500">Bonus Depreciation</div>
                            <div className="text-xl font-bold text-indigo-600">40%</div>
                            <div className="text-xs text-indigo-500">Year 1 (2026)</div>
                          </div>
                        </div>
                      </div>
                      
                      {/* State Incentives */}
                      <div>
                        <div className="flex items-center gap-2 mb-3">
                          <div className="w-1 h-4 rounded-full bg-indigo-500"></div>
                          <span className="text-xs font-semibold text-slate-300 uppercase tracking-wide">State & Local ({step1State})</span>
                        </div>
                        <div className="grid grid-cols-3 gap-3">
                          <div className={`border-l-2 pl-3 -ml-1 py-1 rounded-r ${step1LocationData?.incentives?.state > 0 ? 'border-indigo-500 bg-indigo-100' : 'border-slate-800'}`}>
                            <div className={`text-xs ${step1LocationData?.incentives?.state > 0 ? 'text-indigo-500' : 'text-slate-300'}`}>State Credit</div>
                            <div className={`text-xl font-bold ${step1LocationData?.incentives?.state > 0 ? 'text-indigo-600' : 'text-slate-300'}`}>{step1LocationData?.incentives?.state > 0 ? `${step1LocationData?.incentives?.state}%` : 'None'}</div>
                            <div className={`text-xs ${step1LocationData?.incentives?.state > 0 ? 'text-indigo-500' : 'text-slate-300'}`}>{step1LocationData?.incentives?.stateRebate}</div>
                          </div>
                          <div className="border-l-2 border-slate-300 pl-3">
                            <div className="text-xs text-slate-300">Local Rebates</div>
                            <div className="text-xl font-bold text-slate-300">{step1LocationData?.incentives?.local > 0 ? `$${step1LocationData?.incentives?.local}K` : 'Check'}</div>
                            <div className="text-xs text-slate-300">Varies by utility</div>
                          </div>
                          <div className={`border-l-2 pl-3 -ml-1 py-1 rounded-r ${step1State === 'CA' || step1State === 'HI' ? 'border-amber-500 bg-amber-100' : step1State === 'TX' || step1State === 'FL' ? 'border-red-500 bg-red-100' : 'border-indigo-500 bg-indigo-100'}`}>
                            <div className={`text-xs ${step1State === 'CA' || step1State === 'HI' ? 'text-amber-500' : step1State === 'TX' || step1State === 'FL' ? 'text-indigo-400' : 'text-indigo-500'}`}>Net Metering</div>
                            <div className={`text-lg font-bold ${step1State === 'CA' || step1State === 'HI' ? 'text-amber-600' : step1State === 'TX' || step1State === 'FL' ? 'text-red-600' : 'text-indigo-600'}`}>{step1State === 'CA' ? 'NEM 3.0' : step1State === 'HI' ? 'NEM 3.0' : step1State === 'TX' || step1State === 'FL' ? 'None' : 'Full Retail'}</div>
                            <div className={`text-xs ${step1State === 'CA' || step1State === 'HI' ? 'text-amber-500' : step1State === 'TX' || step1State === 'FL' ? 'text-indigo-400' : 'text-indigo-500'}`}>{step1State === 'CA' || step1State === 'HI' ? '~55% export' : step1State === 'TX' || step1State === 'FL' ? 'Self-consume' : '~90% export'}</div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Policy Environment */}
                      <div className="mt-5">
                        <div className="flex items-center gap-2 mb-3">
                          <div className="w-1 h-4 rounded-full bg-indigo-500"></div>
                          <span className="text-xs font-semibold text-slate-300 uppercase tracking-wide">Policy Environment</span>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                          <div className={`border-l-2 pl-3 -ml-1 py-1 rounded-r ${step1State === 'CA' || step1State === 'NY' || step1State === 'NJ' || step1State === 'MA' ? 'border-indigo-500 bg-indigo-100' : 'border-slate-300'}`}>
                            <div className="text-xs text-slate-300">RPS Target</div>
                            <div className={`text-lg font-bold ${step1State === 'CA' || step1State === 'NY' || step1State === 'NJ' || step1State === 'MA' ? 'text-indigo-600' : 'text-slate-600'}`}>{step1State === 'CA' ? '100%' : step1State === 'NY' ? '70%' : step1State === 'NJ' || step1State === 'MA' ? '50%' : step1State === 'TX' ? 'None' : '25-40%'}</div>
                            <div className="text-xs text-slate-300">{step1State === 'CA' ? 'by 2045' : step1State === 'NY' ? 'by 2030' : step1State === 'TX' ? 'Voluntary' : 'State goal'}</div>
                          </div>
                          <div className="border-l-2 border-slate-300 pl-3">
                            <div className="text-xs text-slate-300">Interconnection</div>
                            <div className="text-lg font-bold text-slate-600">{step1State === 'CA' || step1State === 'NY' || step1State === 'NJ' ? 'Streamlined' : 'Standard'}</div>
                            <div className="text-xs text-slate-300">{step1State === 'CA' ? '<1MW fast' : 'Utility review'}</div>
                          </div>
                          <div className="border-l-2 border-slate-300 pl-3">
                            <div className="text-xs text-slate-300">C-PACE</div>
                            <div className={`text-lg font-bold ${step1State === 'CA' || step1State === 'TX' || step1State === 'FL' || step1State === 'NY' || step1State === 'OH' || step1State === 'CO' ? 'text-indigo-600' : 'text-slate-300'}`}>{step1State === 'CA' || step1State === 'TX' || step1State === 'FL' || step1State === 'NY' || step1State === 'OH' || step1State === 'CO' ? 'Available' : 'Limited'}</div>
                            <div className="text-xs text-slate-300">Commercial financing</div>
                          </div>
                          <div className={`border-l-2 pl-3 -ml-1 py-1 rounded-r ${step1State === 'CA' || step1State === 'NY' || step1State === 'MA' || step1State === 'CT' ? 'border-indigo-500 bg-indigo-100' : 'border-slate-300'}`}>
                            <div className={`text-xs ${step1State === 'CA' || step1State === 'NY' || step1State === 'MA' || step1State === 'CT' ? 'text-indigo-500' : 'text-slate-300'}`}>Solar Mandate</div>
                            <div className={`text-lg font-bold ${step1State === 'CA' || step1State === 'NY' || step1State === 'MA' || step1State === 'CT' ? 'text-indigo-600' : 'text-slate-300'}`}>{step1State === 'CA' ? 'Yes' : step1State === 'NY' || step1State === 'MA' || step1State === 'CT' ? 'Partial' : 'No'}</div>
                            <div className={`text-xs ${step1State === 'CA' || step1State === 'NY' || step1State === 'MA' || step1State === 'CT' ? 'text-indigo-500' : 'text-slate-300'}`}>{step1State === 'CA' ? 'New commercial' : 'Check local'}</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Battery Card */}
                <div 
                  className="relative border-r border-b border-slate-700 p-3 bg-slate-800 hover:bg-slate-700 cursor-pointer transition-colors"
                  onMouseEnter={() => setHoveredCard('battery')}
                  onMouseLeave={() => setHoveredCard(null)}
                  onClick={() => setHoveredCard(hoveredCard === 'battery' ? null : 'battery')}
                >
                  <div className="flex items-center justify-between mb-0.5">
                    <div className="flex items-center gap-1">
                      <span className={`text-sm ${step1LocationData?.battery?.recommended ? 'text-indigo-600' : 'text-slate-300'}`}>🔋</span>
                      <span className="text-[10px] font-bold uppercase tracking-wide text-slate-300">Battery</span>
                      <span className={`text-[9px] px-1 py-0.5 rounded font-medium ${step1LocationData?.battery?.roi === 'Excellent' ? 'bg-indigo-500/20 text-indigo-400' : step1LocationData?.battery?.roi === 'Good' ? 'bg-indigo-500/20 text-indigo-400' : step1LocationData?.battery?.roi === 'Moderate' ? 'bg-amber-500/20 text-amber-400' : 'bg-slate-700 text-slate-300'}`}>{step1LocationData?.battery?.roi}</span>
                    </div>
                    <span className="text-slate-300 text-xs">ℹ️</span>
                  </div>
                  <div className={`text-lg font-bold ${step1LocationData?.battery?.recommended ? 'text-indigo-400' : 'text-slate-300'}`}>{step1LocationData?.battery?.recommended ? 'Yes' : 'Optional'}</div>
                  <div className="text-[10px] text-slate-300">{step1LocationData?.battery?.reason}</div>
                  {/* Hover Popup - Battery */}
                  {hoveredCard === 'battery' && (
                    <div className="fixed left-[42%] top-1/2 -translate-x-1/2 -translate-y-1/2 bg-slate-100 rounded-2xl p-5 z-[100] shadow-xl border border-slate-300 max-h-[85vh] overflow-y-auto" style={{width: '720px'}}>
                      <div className="flex items-center justify-between mb-5 pb-4 border-b border-slate-300">
                        <div className="flex items-center gap-3">
                          <div className={`w-1 h-12 rounded-full ${step1LocationData?.battery?.roi === 'Excellent' ? 'bg-indigo-500' : step1LocationData?.battery?.roi === 'Good' ? 'bg-indigo-500' : 'bg-slate-400'}`}></div>
                          <div>
                            <div className="text-xl font-bold text-slate-800">Battery Storage Analysis (BESS)</div>
                            <div className="text-sm text-slate-300">Primary Driver: {step1LocationData?.battery?.reason}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-xs text-slate-300 uppercase">ROI Rating</div>
                          <div className={`text-lg font-bold ${step1LocationData?.battery?.roi === 'Excellent' ? 'text-indigo-600' : step1LocationData?.battery?.roi === 'Good' ? 'text-indigo-600' : 'text-slate-300'}`}>{step1LocationData?.battery?.roi}</div>
                        </div>
                      </div>
                      
                      {/* Value Streams & Use Cases */}
                      <div className="mb-5">
                        <div className="flex items-center gap-2 mb-3">
                          <div className="w-1 h-4 rounded-full bg-indigo-500"></div>
                          <span className="text-xs font-semibold text-slate-300 uppercase tracking-wide">Value Streams & Use Cases</span>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                          <div className={`border-l-2 pl-3 -ml-1 py-1 rounded-r ${step1LocationData?.battery?.backup === 'Critical' || step1LocationData?.battery?.backup === 'High' ? 'border-indigo-500 bg-indigo-100' : 'border-amber-500 bg-amber-100'}`}>
                            <div className="text-xl mb-0.5">⚡</div>
                            <div className={`text-xs ${step1LocationData?.battery?.backup === 'Critical' || step1LocationData?.battery?.backup === 'High' ? 'text-indigo-500' : 'text-amber-500'}`}>Backup Power</div>
                            <div className={`text-sm font-semibold ${step1LocationData?.battery?.backup === 'Critical' ? 'text-red-600' : step1LocationData?.battery?.backup === 'High' ? 'text-indigo-600' : step1LocationData?.battery?.backup === 'Medium' ? 'text-amber-600' : 'text-slate-300'}`}>{step1LocationData?.battery?.backup}</div>
                          </div>
                          <div className={`border-l-2 pl-3 -ml-1 py-1 rounded-r ${step1LocationData?.battery?.demandMgmt ? 'border-indigo-500 bg-indigo-100' : 'border-slate-300'}`}>
                            <div className="text-xl mb-0.5">📊</div>
                            <div className={`text-xs ${step1LocationData?.battery?.demandMgmt ? 'text-indigo-500' : 'text-slate-300'}`}>Demand Mgmt</div>
                            <div className={`text-sm font-semibold ${step1LocationData?.battery?.demandMgmt ? 'text-indigo-600' : 'text-slate-300'}`}>{step1LocationData?.battery?.demandMgmt ? 'High Value' : 'N/A'}</div>
                          </div>
                          <div className={`border-l-2 pl-3 -ml-1 py-1 rounded-r ${(step1LocationData?.electric?.peakRate || 0) - (step1LocationData?.electric?.offPeakRate || 0) > 0.12 ? 'border-indigo-500 bg-indigo-100' : 'border-slate-300'}`}>
                            <div className="text-xl mb-0.5">💵</div>
                            <div className={`text-xs ${(step1LocationData?.electric?.peakRate || 0) - (step1LocationData?.electric?.offPeakRate || 0) > 0.12 ? 'text-indigo-500' : 'text-slate-300'}`}>TOU Arbitrage</div>
                            <div className={`text-sm font-semibold ${(step1LocationData?.electric?.peakRate || 0) - (step1LocationData?.electric?.offPeakRate || 0) > 0.12 ? 'text-indigo-600' : 'text-slate-300'}`}>${((step1LocationData?.electric?.peakRate || 0) - (step1LocationData?.electric?.offPeakRate || 0)).toFixed(2)}/kWh</div>
                          </div>
                          <div className={`border-l-2 pl-3 -ml-1 py-1 rounded-r ${step1LocationData?.grid?.psps === 'High' ? 'border-red-500 bg-red-100' : 'border-slate-300'}`}>
                            <div className="text-xl mb-0.5">⚠️</div>
                            <div className={`text-xs ${step1LocationData?.grid?.psps === 'High' ? 'text-indigo-400' : 'text-slate-300'}`}>PSPS Risk</div>
                            <div className={`text-sm font-semibold ${step1LocationData?.grid?.psps === 'High' ? 'text-red-600' : 'text-slate-300'}`}>{step1LocationData?.grid?.psps}</div>
                          </div>
                          <div className="border-l-2 border-indigo-500 bg-indigo-100 pl-3 -ml-1 py-1 rounded-r">
                            <div className="text-xl mb-0.5">🔄</div>
                            <div className="text-xs text-indigo-500">Self-Consume</div>
                            <div className="text-sm font-semibold text-indigo-600">+Solar</div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Sizing Guidelines */}
                      <div className="mb-5">
                        <div className="flex items-center gap-2 mb-3">
                          <div className="w-1 h-4 rounded-full bg-indigo-500"></div>
                          <span className="text-xs font-semibold text-slate-300 uppercase tracking-wide">Commercial Sizing Guidelines</span>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                          <div className="border-l-2 border-slate-300 pl-3">
                            <div className="text-xs text-slate-300">Demand Shaving</div>
                            <div className="text-sm font-bold text-slate-800">30-50%</div>
                            <div className="text-xs text-slate-300">of peak load</div>
                          </div>
                          <div className="border-l-2 border-slate-300 pl-3">
                            <div className="text-xs text-slate-300">Duration</div>
                            <div className="text-sm font-bold text-slate-800">2-4 hrs</div>
                            <div className="text-xs text-slate-300">typical C&I</div>
                          </div>
                          <div className="border-l-2 border-slate-300 pl-3">
                            <div className="text-xs text-slate-300">Power:Energy</div>
                            <div className="text-sm font-bold text-slate-800">1:2 - 1:4</div>
                            <div className="text-xs text-slate-300">kW:kWh ratio</div>
                          </div>
                          <div className={`border-l-2 pl-3 -ml-1 py-1 rounded-r ${step1LocationData?.battery?.backup === 'Critical' || step1LocationData?.battery?.backup === 'High' ? 'border-amber-500 bg-amber-100' : 'border-slate-300'}`}>
                            <div className={`text-xs ${step1LocationData?.battery?.backup === 'Critical' || step1LocationData?.battery?.backup === 'High' ? 'text-amber-500' : 'text-slate-300'}`}>Backup Sizing</div>
                            <div className={`text-sm font-bold ${step1LocationData?.battery?.backup === 'Critical' || step1LocationData?.battery?.backup === 'High' ? 'text-amber-600' : 'text-slate-600'}`}>{step1LocationData?.battery?.backup === 'Critical' ? '8-24 hrs' : step1LocationData?.battery?.backup === 'High' ? '4-8 hrs' : '2-4 hrs'}</div>
                            <div className={`text-xs ${step1LocationData?.battery?.backup === 'Critical' || step1LocationData?.battery?.backup === 'High' ? 'text-amber-500' : 'text-slate-300'}`}>critical loads</div>
                          </div>
                          <div className="border-l-2 border-indigo-500 bg-indigo-100 pl-3 -ml-1 py-1 rounded-r">
                            <div className="text-xs text-indigo-500">Solar Pairing</div>
                            <div className="text-sm font-bold text-indigo-600">25-50%</div>
                            <div className="text-xs text-indigo-500">of PV capacity</div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Technology & Specifications */}
                      <div className="mb-5">
                        <div className="flex items-center gap-2 mb-3">
                          <div className="w-1 h-4 rounded-full bg-indigo-500"></div>
                          <span className="text-xs font-semibold text-slate-300 uppercase tracking-wide">Technology & Specifications</span>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                          <div className="border-l-2 border-indigo-500 bg-indigo-100 pl-3 -ml-1 py-1 rounded-r">
                            <div className="text-xs text-indigo-500">Chemistry</div>
                            <div className="text-sm font-bold text-indigo-600">LFP</div>
                            <div className="text-xs text-indigo-500">recommended</div>
                          </div>
                          <div className="border-l-2 border-slate-300 pl-3">
                            <div className="text-xs text-slate-300">Round-Trip Eff</div>
                            <div className="text-lg font-bold text-slate-800">85-92%</div>
                            <div className="text-xs text-slate-300">AC-AC</div>
                          </div>
                          <div className="border-l-2 border-slate-300 pl-3">
                            <div className="text-xs text-slate-300">Cycle Life</div>
                            <div className="text-lg font-bold text-slate-800">6,000+</div>
                            <div className="text-xs text-slate-300">cycles (LFP)</div>
                          </div>
                          <div className="border-l-2 border-slate-300 pl-3">
                            <div className="text-xs text-slate-300">Calendar Life</div>
                            <div className="text-lg font-bold text-slate-800">15-20</div>
                            <div className="text-xs text-slate-300">years</div>
                          </div>
                          <div className={`border-l-2 pl-3 -ml-1 py-1 rounded-r ${step1LocationData?.weather?.heat === 'High' || step1LocationData?.weather?.heat === 'Extreme' ? 'border-amber-500 bg-amber-100' : 'border-indigo-500 bg-indigo-100'}`}>
                            <div className={`text-xs ${step1LocationData?.weather?.heat === 'High' || step1LocationData?.weather?.heat === 'Extreme' ? 'text-amber-500' : 'text-indigo-500'}`}>Thermal Mgmt</div>
                            <div className={`text-sm font-bold ${step1LocationData?.weather?.heat === 'High' || step1LocationData?.weather?.heat === 'Extreme' ? 'text-amber-600' : 'text-indigo-600'}`}>{step1LocationData?.weather?.heat === 'High' || step1LocationData?.weather?.heat === 'Extreme' ? 'Active HVAC' : 'Passive OK'}</div>
                            <div className={`text-xs ${step1LocationData?.weather?.heat === 'High' || step1LocationData?.weather?.heat === 'Extreme' ? 'text-amber-500' : 'text-indigo-500'}`}>{step1LocationData?.weather?.heat === 'High' || step1LocationData?.weather?.heat === 'Extreme' ? 'required' : 'climate'}</div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Economics & Incentives */}
                      <div>
                        <div className="flex items-center gap-2 mb-3">
                          <div className="w-1 h-4 rounded-full bg-indigo-500"></div>
                          <span className="text-xs font-semibold text-slate-300 uppercase tracking-wide">Economics & Incentives</span>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                          <div className="border-l-2 border-slate-300 pl-3">
                            <div className="text-xs text-slate-300">System Cost</div>
                            <div className="text-lg font-bold text-slate-800">$600-900</div>
                            <div className="text-xs text-slate-300">/kWh installed</div>
                          </div>
                          <div className="border-l-2 border-indigo-500 bg-indigo-100 pl-3 -ml-1 py-1 rounded-r">
                            <div className="text-xs text-indigo-500">ITC (w/Solar)</div>
                            <div className="text-xl font-bold text-indigo-600">30%</div>
                            <div className="text-xs text-indigo-500">+ adders avail</div>
                          </div>
                          <div className="border-l-2 border-indigo-500 bg-indigo-100 pl-3 -ml-1 py-1 rounded-r">
                            <div className="text-xs text-indigo-500">Standalone ITC</div>
                            <div className="text-xl font-bold text-indigo-600">30%</div>
                            <div className="text-xs text-indigo-500">≥5kWh systems</div>
                          </div>
                          <div className={`border-l-2 pl-3 -ml-1 py-1 rounded-r ${step1LocationData?.battery?.roi === 'Excellent' || step1LocationData?.battery?.roi === 'Good' ? 'border-indigo-500 bg-indigo-100' : 'border-slate-300'}`}>
                            <div className={`text-xs ${step1LocationData?.battery?.roi === 'Excellent' || step1LocationData?.battery?.roi === 'Good' ? 'text-indigo-500' : 'text-slate-300'}`}>Payback</div>
                            <div className={`text-lg font-bold ${step1LocationData?.battery?.roi === 'Excellent' || step1LocationData?.battery?.roi === 'Good' ? 'text-indigo-600' : 'text-slate-600'}`}>{step1LocationData?.battery?.payback}</div>
                            <div className={`text-xs ${step1LocationData?.battery?.roi === 'Excellent' || step1LocationData?.battery?.roi === 'Good' ? 'text-indigo-500' : 'text-slate-300'}`}>years</div>
                          </div>
                          <div className="border-l-2 border-slate-300 pl-3">
                            <div className="text-xs text-slate-300">Warranty</div>
                            <div className="text-lg font-bold text-slate-800">10-15 yr</div>
                            <div className="text-xs text-slate-300">70-80% cap</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Gas Card */}
                <div 
                  className="relative border-b border-slate-700 p-3 bg-slate-800 hover:bg-slate-700 cursor-pointer transition-colors"
                  onMouseEnter={() => setHoveredCard('gas')}
                  onMouseLeave={() => setHoveredCard(null)}
                  onClick={() => setHoveredCard(hoveredCard === 'gas' ? null : 'gas')}
                >
                  <div className="flex items-center justify-between mb-0.5">
                    <div className="flex items-center gap-1">
                      <span className="text-orange-500 text-sm">🔥</span>
                      <span className="text-[10px] font-bold uppercase tracking-wide text-slate-300">Gas</span>
                      <span className={`text-[9px] px-1 py-0.5 rounded font-medium ${step1LocationData?.gas?.level === 'Very High' ? 'bg-red-500/20 text-red-400' : step1LocationData?.gas?.level === 'High' ? 'bg-orange-500/20 text-orange-400' : step1LocationData?.gas?.level === 'Low' ? 'bg-indigo-500/20 text-indigo-400' : 'bg-amber-500/20 text-amber-400'}`}>{step1LocationData?.gas?.level}</span>
                    </div>
                    <span className="text-slate-300 text-xs">ℹ️</span>
                  </div>
                  <div className="text-lg font-bold text-white">${((step1LocationData?.gas?.rate) || 0).toFixed(2)}<span className="text-xs font-normal text-slate-300">/therm</span></div>
                  <div className="text-[10px] text-slate-300">{step1LocationData?.gasUtility}</div>
                  {/* Hover Popup - Gas */}
                  {hoveredCard === 'gas' && (
                    <div className="fixed left-[42%] bottom-[12%] -translate-x-1/2 bg-slate-100 rounded-2xl p-6 z-[100] shadow-xl border border-slate-300 max-h-[78vh] overflow-y-auto" style={{width: '720px'}}>
                      <div className="flex items-center justify-between mb-5 pb-4 border-b border-slate-300">
                        <div className="flex items-center gap-3">
                          <div className="w-1 h-12 rounded-full bg-orange-500"></div>
                          <div>
                            <div className="text-xl font-bold text-slate-800">Natural Gas Analysis</div>
                            <div className="text-sm text-slate-300">{step1LocationData?.gasUtility}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-xs text-slate-300 uppercase">Rate Level</div>
                          <div className={`text-lg font-bold ${step1LocationData?.gas?.level === 'Very High' ? 'text-red-600' : step1LocationData?.gas?.level === 'High' ? 'text-orange-600' : step1LocationData?.gas?.level === 'Low' ? 'text-indigo-400' : 'text-amber-600'}`}>{step1LocationData?.gas?.level}</div>
                        </div>
                      </div>
                      
                      {/* Rate Structure Section */}
                      <div className="mb-5">
                        <div className="flex items-center gap-2 mb-3">
                          <div className="w-1 h-4 rounded-full bg-orange-500"></div>
                          <span className="text-xs font-semibold text-slate-300 uppercase tracking-wide">Rate Structure</span>
                        </div>
                        <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                          <div className="border-l-2 border-slate-300 pl-3">
                            <div className="text-xs text-slate-300">Average Rate</div>
                            <div className="text-xl font-bold text-slate-800">${((step1LocationData?.gas?.rate) || 0).toFixed(2)}</div>
                            <div className="text-xs text-slate-300">/therm</div>
                          </div>
                          <div className={`border-l-2 pl-3 -ml-1 py-1 rounded-r ${step1LocationData?.gas?.winterRate > 1.5 ? 'border-red-500 bg-red-100' : 'border-amber-500 bg-amber-100'}`}>
                            <div className={`text-xs ${step1LocationData?.gas?.winterRate > 1.5 ? 'text-indigo-400' : 'text-amber-500'}`}>Winter Rate</div>
                            <div className={`text-xl font-bold ${step1LocationData?.gas?.winterRate > 1.5 ? 'text-red-600' : 'text-amber-600'}`}>~${((step1LocationData?.gas?.winterRate) || 0).toFixed(2)}</div>
                            <div className={`text-xs ${step1LocationData?.gas?.winterRate > 1.5 ? 'text-red-600' : 'text-amber-600'}`}>seasonal</div>
                          </div>
                          <div className={`border-l-2 pl-3 -ml-1 py-1 rounded-r ${step1LocationData?.gas?.level === 'Very High' ? 'border-red-500 bg-red-100' : step1LocationData?.gas?.level === 'High' ? 'border-orange-500 bg-orange-500/20' : step1LocationData?.gas?.level === 'Low' ? 'border-indigo-500 bg-indigo-100' : 'border-amber-500 bg-amber-100'}`}>
                            <div className={`text-xs ${step1LocationData?.gas?.level === 'Very High' ? 'text-indigo-400' : step1LocationData?.gas?.level === 'High' ? 'text-orange-500' : step1LocationData?.gas?.level === 'Low' ? 'text-indigo-500' : 'text-amber-500'}`}>vs National</div>
                            <div className={`text-xl font-bold ${step1LocationData?.gas?.level === 'Very High' ? 'text-red-600' : step1LocationData?.gas?.level === 'High' ? 'text-orange-600' : step1LocationData?.gas?.level === 'Low' ? 'text-indigo-400' : 'text-amber-600'}`}>{step1LocationData?.gas?.vsNational}</div>
                          </div>
                          <div className={`border-l-2 pl-3 -ml-1 py-1 rounded-r ${step1LocationData?.gas?.level === 'Very High' || step1LocationData?.gas?.level === 'High' ? 'border-amber-500 bg-amber-100' : 'border-indigo-500 bg-indigo-100'}`}>
                            <div className={`text-xs ${step1LocationData?.gas?.level === 'Very High' || step1LocationData?.gas?.level === 'High' ? 'text-amber-500' : 'text-indigo-500'}`}>Volatility</div>
                            <div className={`text-lg font-bold ${step1LocationData?.gas?.level === 'Very High' ? 'text-red-600' : step1LocationData?.gas?.level === 'High' ? 'text-amber-600' : 'text-indigo-400'}`}>{step1LocationData?.gas?.level === 'Very High' ? 'High' : step1LocationData?.gas?.level === 'High' ? 'Moderate' : 'Low'}</div>
                          </div>
                          <div className="border-l-2 border-slate-300 pl-3">
                            <div className="text-xs text-slate-300">Fixed Fee</div>
                            <div className="text-lg font-bold text-slate-600">~$12</div>
                            <div className="text-xs text-slate-300">/month</div>
                          </div>
                          <div className={`border-l-2 pl-3 -ml-1 py-1 rounded-r ${step1State === 'CA' || step1State === 'NY' || step1State === 'MA' || step1State === 'WA' || step1State === 'CO' ? 'border-indigo-500 bg-indigo-100' : 'border-slate-300'}`}>
                            <div className={`text-xs ${step1State === 'CA' || step1State === 'NY' || step1State === 'MA' || step1State === 'WA' || step1State === 'CO' ? 'text-indigo-500' : 'text-slate-300'}`}>Electrify Rebates</div>
                            <div className={`text-lg font-bold ${step1State === 'CA' || step1State === 'NY' || step1State === 'MA' || step1State === 'WA' || step1State === 'CO' ? 'text-indigo-600' : 'text-slate-300'}`}>{step1State === 'CA' || step1State === 'NY' || step1State === 'MA' || step1State === 'WA' || step1State === 'CO' ? 'Yes' : 'Limited'}</div>
                            <div className={`text-xs ${step1State === 'CA' || step1State === 'NY' || step1State === 'MA' || step1State === 'WA' || step1State === 'CO' ? 'text-indigo-500' : 'text-slate-300'}`}>Heat pump $</div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Carbon & Electrification */}
                      <div className="mb-5">
                        <div className="flex items-center gap-2 mb-3">
                          <div className="w-1 h-4 rounded-full bg-indigo-500"></div>
                          <span className="text-xs font-semibold text-slate-300 uppercase tracking-wide">Carbon & Electrification</span>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                          <div className="border-l-2 border-slate-300 pl-3">
                            <div className="text-xs text-slate-300">CO₂ Intensity</div>
                            <div className="text-lg font-bold text-slate-800">11.7</div>
                            <div className="text-xs text-slate-300">lbs CO₂/therm</div>
                          </div>
                          <div className="border-l-2 border-slate-300 pl-3">
                            <div className="text-xs text-slate-300">Service Type</div>
                            <div className="text-sm font-bold text-slate-800">{step1LocationData?.gas?.level === 'Very High' ? 'Bundled' : 'Firm'}</div>
                            <div className="text-xs text-slate-300">commercial</div>
                          </div>
                          <div className={`border-l-2 pl-3 -ml-1 py-1 rounded-r ${step1State === 'CA' || step1State === 'NY' || step1State === 'MA' || step1State === 'WA' ? 'border-amber-500 bg-amber-100' : 'border-slate-300'}`}>
                            <div className={`text-xs ${step1State === 'CA' || step1State === 'NY' || step1State === 'MA' || step1State === 'WA' ? 'text-amber-500' : 'text-slate-300'}`}>Gas Ban Risk</div>
                            <div className={`text-sm font-bold ${step1State === 'CA' || step1State === 'NY' ? 'text-amber-600' : 'text-slate-800'}`}>{step1State === 'CA' || step1State === 'NY' ? 'High' : step1State === 'MA' || step1State === 'WA' ? 'Moderate' : 'Low'}</div>
                            <div className={`text-xs ${step1State === 'CA' || step1State === 'NY' || step1State === 'MA' || step1State === 'WA' ? 'text-amber-500' : 'text-slate-300'}`}>new builds</div>
                          </div>
                          <div className="border-l-2 border-indigo-500 bg-indigo-100 pl-3 -ml-1 py-1 rounded-r">
                            <div className="text-xs text-indigo-500">Heat Pump Alt</div>
                            <div className="text-sm font-bold text-indigo-600">COP 3-4x</div>
                            <div className="text-xs text-indigo-500">efficiency</div>
                          </div>
                          <div className="border-l-2 border-slate-300 pl-3">
                            <div className="text-xs text-slate-300">5yr Gas Trend</div>
                            <div className="text-lg font-bold text-red-600">+{step1LocationData?.gas?.level === 'Very High' ? '40' : step1LocationData?.gas?.level === 'High' ? '30' : '20'}%</div>
                            <div className="text-xs text-slate-300">escalation</div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Generator Section */}
                      <div>
                        <div className="flex items-center gap-2 mb-3">
                          <div className="w-1 h-4 rounded-full bg-indigo-500"></div>
                          <span className="text-xs font-semibold text-slate-300 uppercase tracking-wide">Generator Considerations</span>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                          <div className={`border-l-2 pl-3 -ml-1 py-1 rounded-r ${step1LocationData?.gas?.level === 'Low' || step1LocationData?.gas?.level === 'Moderate' ? 'border-indigo-500 bg-indigo-100' : 'border-amber-500 bg-amber-100'}`}>
                            <div className="text-xl mb-0.5">⛽</div>
                            <div className={`text-xs ${step1LocationData?.gas?.level === 'Low' || step1LocationData?.gas?.level === 'Moderate' ? 'text-indigo-500' : 'text-amber-500'}`}>NG Generator</div>
                            <div className={`text-sm font-semibold ${step1LocationData?.gas?.level === 'Low' ? 'text-indigo-400' : step1LocationData?.gas?.level === 'Moderate' ? 'text-indigo-400' : step1LocationData?.gas?.level === 'High' ? 'text-amber-600' : 'text-red-600'}`}>{step1LocationData?.gas?.level === 'Low' ? 'Great Option' : step1LocationData?.gas?.level === 'Moderate' ? 'Good Option' : step1LocationData?.gas?.level === 'High' ? 'Consider' : 'Expensive'}</div>
                          </div>
                          <div className="border-l-2 border-slate-300 pl-3">
                            <div className="text-xl mb-0.5">💰</div>
                            <div className="text-xs text-slate-300">Fuel Cost</div>
                            <div className="text-sm font-semibold text-slate-300">${(((step1LocationData?.gas?.rate) || 0) / 10).toFixed(2)}/kWh</div>
                          </div>
                          <div className={`border-l-2 pl-3 -ml-1 py-1 rounded-r ${step1LocationData?.grid?.backupNeed === 'Critical' || step1LocationData?.grid?.backupNeed === 'High' ? 'border-indigo-500 bg-indigo-100' : 'border-amber-500 bg-amber-100'}`}>
                            <div className="text-xl mb-0.5">🔄</div>
                            <div className={`text-xs ${step1LocationData?.grid?.backupNeed === 'Critical' || step1LocationData?.grid?.backupNeed === 'High' ? 'text-indigo-500' : 'text-amber-500'}`}>Hybrid System</div>
                            <div className={`text-sm font-semibold ${step1LocationData?.grid?.backupNeed === 'Critical' || step1LocationData?.grid?.backupNeed === 'High' ? 'text-indigo-400' : step1LocationData?.grid?.backupNeed === 'Medium' ? 'text-amber-600' : 'text-slate-300'}`}>{step1LocationData?.grid?.backupNeed === 'Critical' || step1LocationData?.grid?.backupNeed === 'High' ? 'Recommended' : step1LocationData?.grid?.backupNeed === 'Medium' ? 'Consider' : 'Optional'}</div>
                          </div>
                          <div className="border-l-2 border-slate-300 pl-3">
                            <div className="text-xl mb-0.5">📊</div>
                            <div className="text-xs text-slate-300">vs Diesel</div>
                            <div className={`text-sm font-semibold ${step1LocationData?.gas?.level === 'Low' ? 'text-indigo-400' : step1LocationData?.gas?.level === 'Moderate' ? 'text-indigo-400' : 'text-amber-600'}`}>{step1LocationData?.gas?.level === 'Low' ? '50%+ savings' : step1LocationData?.gas?.level === 'Moderate' ? '40% savings' : step1LocationData?.gas?.level === 'High' ? '25% savings' : '15% savings'}</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              )}
              
              {/* Bill Slider */}
              <div 
                id="bill-slider-section"
                className="px-6 py-3 flex-1 flex flex-col justify-center"
              >
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h4 className="font-bold text-xl text-white">Annual Electric Spend</h4>
                    <p className="text-sm text-slate-300">From your utility statements or accounting</p>
                  </div>
                  <div className="text-right">
                    <div id="annual-bill-display" className="text-4xl font-bold text-white">${(annualBill / 1000).toFixed(0)}K<span className="text-xl font-normal text-slate-300">/yr</span></div>
                    <div className="text-sm text-slate-300">${Math.round(annualBill / 12).toLocaleString()}/mo avg</div>
                  </div>
                </div>
                <SmoothSlider min={6000} max={300000} step={100} value={annualBill}
                  onChange={v => setAnnualBill(Number(v))}
                  label="Annual electric bill"
                  displayId="annual-bill-display"
                  formatDisplay={v => `$${(v / 1000).toFixed(0)}K/yr`}
                  color="#6366f1" />
                <div className="flex justify-between text-sm text-slate-300 font-medium mt-2">
                  <span>$6K</span>
                  <span>$60K</span>
                  <span>$120K</span>
                  <span>$180K</span>
                  <span>$240K</span>
                  <span>$300K</span>
                </div>

                {/* Bill Upload — light affordance */}
                {!billUploadData ? (
                  <label className="mt-3 flex items-center gap-2 cursor-pointer group">
                    <input type="file" accept="image/*,.pdf" className="hidden" onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      setBillUploadData({ file, fileName: file.name, source: 'upload', verified: false, extractedData: null, parsing: true });
                      // OCR stub — simulates parsing delay, ready for Claude Vision API
                      setTimeout(() => {
                        setBillUploadData(prev => prev ? { ...prev, parsing: false, verified: false,
                          extractedData: null, // Will be populated by OCR when API connected
                          needsReview: true
                        } : null);
                      }, 1500);
                    }} />
                    <Upload className="w-4 h-4 text-indigo-400 group-hover:text-indigo-300 transition" />
                    <span className="text-sm text-indigo-400 group-hover:text-indigo-300 transition">Have your bill? Upload for exact numbers</span>
                  </label>
                ) : (
                  <div className="mt-3 px-3 py-2 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center gap-2">
                    {billUploadData.parsing ? (
                      <>
                        <Loader2 className="w-4 h-4 text-indigo-400 animate-spin" />
                        <span className="text-sm text-indigo-400">Analyzing bill...</span>
                      </>
                    ) : (
                      <>
                        <FileText className="w-4 h-4 text-indigo-400" />
                        <span className="text-sm text-indigo-400 flex-1">
                          {billUploadData.fileName} uploaded
                          <span className="text-xs text-indigo-500 ml-1">· Will verify in Step 3</span>
                        </span>
                        <button onClick={() => setBillUploadData(null)} className="text-slate-500 hover:text-red-400 transition">
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>
              <div id="savings-section" className="px-6 py-3 flex-1 flex flex-col justify-center">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-xl text-white">Potential Savings</h4>
                      <span className="text-[10px] bg-indigo-500/20 text-indigo-400 px-2 py-0.5 rounded-full border border-indigo-500/30">Preliminary</span>
                    </div>
                    <p className="text-slate-300 text-sm">Based on your location and bill</p>
                  </div>
                  {/* Purchase/Lease Toggle */}
                  <div className="flex bg-slate-800 rounded-lg p-1">
                    <button 
                      onClick={() => setOwnershipType('purchase')}
                      className={`px-4 py-1.5 text-sm font-semibold rounded transition-all ${ownershipType === 'purchase' ? 'bg-indigo-500 text-white' : 'text-slate-300'}`}
                    >
                      Purchase
                    </button>
                    <button 
                      onClick={() => setOwnershipType('lease')}
                      className={`px-4 py-1.5 text-sm font-semibold rounded transition-all ${ownershipType === 'lease' ? 'bg-indigo-500 text-white' : 'text-slate-300'}`}
                    >
                      Lease/PPA
                    </button>
                  </div>
                </div>
                
                {ownershipType === 'purchase' ? (
                  <>
                    {!locationConfirmed ? (
                      /* Placeholder when no location confirmed */
                      <div className="grid grid-cols-3 gap-3">
                        <div className="bg-slate-900/50 rounded-lg p-3 border border-slate-700 text-center">
                          <div className="text-xs uppercase tracking-wider text-slate-300 mb-1">Annual Savings</div>
                          <div className="text-3xl font-bold text-slate-500">--</div>
                          <div className="text-slate-500 text-xs mt-1">enter location</div>
                        </div>
                        <div className="bg-slate-900/50 rounded-lg p-3 border border-slate-700 text-center">
                          <div className="text-xs uppercase tracking-wider text-slate-300 mb-1">Bill Reduction</div>
                          <div className="text-3xl font-bold text-slate-500">--%</div>
                        </div>
                        <div className="bg-slate-900/50 rounded-lg p-3 border border-slate-700 text-center">
                          <div className="text-xs uppercase tracking-wider text-slate-300 mb-1">Payback</div>
                          <div className="text-3xl font-bold text-slate-500">-- yr</div>
                          <div className="text-slate-500 text-xs mt-1">w/ incentives</div>
                        </div>
                      </div>
                    ) : (
                    /* Calculate bill reduction based on solar rating AND electric rates */
                    (() => {
                      // Base reduction from solar potential
                      const baseLow = step1LocationData?.solar?.rating === 'Excellent' ? 0.40 : step1LocationData?.solar?.rating === 'Good' ? 0.33 : 0.25;
                      const baseHigh = step1LocationData?.solar?.rating === 'Excellent' ? 0.50 : step1LocationData?.solar?.rating === 'Good' ? 0.42 : 0.35;
                      
                      // Adjust for high electric rates (more incentive to go bigger)
                      const rateBonus = step1LocationData?.electric?.level === 'Very High' ? 0.05 : step1LocationData?.electric?.level === 'High' ? 0.03 : 0;
                      const reductionLow = Math.min(baseLow + rateBonus, 0.55);
                      const reductionHigh = Math.min(baseHigh + rateBonus, 0.65);
                      
                      // Annual savings
                      const savingsLow = Math.round(annualBill * reductionLow / 1000);
                      const savingsHigh = Math.round(annualBill * reductionHigh / 1000);
                      
                      // Payback calculation - size system to match target reduction, not 100%
                      // This reflects realistic commercial installations
                      
                      // Average reduction target
                      const avgReduction = (reductionLow + reductionHigh) / 2;
                      
                      // Estimate system size needed for TARGET reduction (not 100%)
                      const annualUsage = annualBill / (step1LocationData?.electric?.rate || 0.12); // kWh/year
                      const targetUsage = annualUsage * avgReduction; // kWh we want to offset
                      const systemSizeKW = targetUsage / (step1LocationData?.solar?.annualOutput || 1400); // kW needed
                      
                      // Cost per watt decreases with scale (economies of scale)
                      // FIX #39: Aligned with calculation paths — flat $2.50/W (was tiered 2.80/2.40/2.00)
                      const costPerWatt = 2.50;
                      const grossCost = systemSizeKW * 1000 * costPerWatt;
                      
                      // Net cost after incentives
                      const netCost = grossCost * (1 - step1LocationData?.incentives?.total / 100);
                      
                      // Annual savings (reduced by O&M ~1.5% of gross + insurance)
                      const annualOM = grossCost * 0.015;
                      const annualSavings = annualBill * avgReduction - annualOM;
                      
                      // Calculate payback in years
                      // Note: ITC comes at tax time (Year 1), MACRS spreads over 5 years — 
                      // simple netCost/savings underestimates by ~1-2 years vs full calcPayback()
                      const paybackYears = annualSavings > 0 ? netCost / annualSavings : 12;
                      
                      // Create range (±1 year for uncertainty, floor at 5 to match Step 7 reality)
                      let paybackLow = Math.max(5, Math.round(paybackYears - 1));
                      let paybackHigh = Math.round(paybackYears + 1);
                      
                      // Cap at reasonable bounds
                      if (paybackLow < 5) paybackLow = 5;
                      if (paybackHigh > 12) paybackHigh = 12;
                      if (paybackLow >= paybackHigh) paybackHigh = paybackLow + 1;
                      
                      return (
                        <div className="grid grid-cols-3 gap-3">
                          <div className="bg-slate-900/50 rounded-lg p-3 border border-slate-700 text-center">
                            <div className="text-xs uppercase tracking-wider text-slate-300 mb-1">Annual Savings</div>
                            <div className="text-3xl font-bold text-indigo-400">${savingsLow}-{savingsHigh}K</div>
                            <div className="text-slate-300 text-xs mt-1">estimated range</div>
                          </div>
                          <div className="bg-slate-900/50 rounded-lg p-3 border border-slate-700 text-center">
                            <div className="text-xs uppercase tracking-wider text-slate-300 mb-1">Bill Reduction</div>
                            <div className="text-3xl font-bold text-white">{Math.round(reductionLow * 100)}-{Math.round(reductionHigh * 100)}%</div>
                          </div>
                          <div className="bg-slate-900/50 rounded-lg p-3 border border-slate-700 text-center">
                            <div className="text-xs uppercase tracking-wider text-slate-300 mb-1">Payback</div>
                            <div className="text-3xl font-bold text-white">{paybackLow}-{paybackHigh} yr</div>
                            <div className="text-slate-300 text-xs mt-1">w/ incentives</div>
                          </div>
                        </div>
                      );
                    })()
                    )}
                    <p className="mt-3 mb-4 text-xs text-slate-300 flex items-center gap-1">
                      <span className="text-indigo-400">💰</span>
                      <span><span className="text-slate-300 font-medium">Tax incentives:</span> 30% Federal ITC {locationConfirmed && step1LocationData?.incentives?.state > 0 ? `+ ${step1LocationData?.incentives?.state}% State` : ''} + ~22% MACRS{locationConfirmed ? ` = ~${step1LocationData?.incentives?.total}% off` : ''}.</span>
                    </p>
                  </>
                ) : (
                  <>
                    {!locationConfirmed ? (
                      /* Placeholder when no location confirmed */
                      <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                        <div className="bg-slate-900/50 rounded-lg p-2.5 border border-slate-800 text-center">
                          <div className="text-[10px] uppercase tracking-wider text-slate-300 mb-1">Upfront Cost</div>
                          <div className="text-2xl font-bold text-indigo-400">$0</div>
                          <div className="text-slate-300 text-[10px]">No investment</div>
                        </div>
                        <div className="bg-slate-900/50 rounded-lg p-2.5 border border-slate-800 text-center">
                          <div className="text-[10px] uppercase tracking-wider text-slate-300 mb-1">PPA Rate</div>
                          <div className="text-2xl font-bold text-slate-300">--</div>
                          <div className="text-slate-300 text-[10px]">per kWh</div>
                        </div>
                        <div className="bg-slate-900/50 rounded-lg p-2.5 border border-slate-800 text-center">
                          <div className="text-[10px] uppercase tracking-wider text-slate-300 mb-1">Annual Savings</div>
                          <div className="text-2xl font-bold text-slate-300">--</div>
                          <div className="text-slate-300 text-[10px]">enter location</div>
                        </div>
                        <div className="bg-slate-900/50 rounded-lg p-2.5 border border-slate-800 text-center">
                          <div className="text-[10px] uppercase tracking-wider text-slate-300 mb-1">Monthly Savings</div>
                          <div className="text-2xl font-bold text-slate-300">--</div>
                          <div className="text-slate-300 text-[10px]">--% of bill</div>
                        </div>
                        <div className="bg-slate-900/50 rounded-lg p-2.5 border border-slate-800 text-center">
                          <div className="text-[10px] uppercase tracking-wider text-slate-300 mb-1">vs Utility</div>
                          <div className="text-2xl font-bold text-slate-300">--%</div>
                          <div className="text-slate-300 text-[10px]">less/kWh</div>
                        </div>
                      </div>
                    ) : (
                    /* PPA/Lease calculations - solar typically covers 70-85% of usage */
                    (() => {
                      // PPA discount varies by market - higher rate markets get better deals
                      // Very High rates: 20-25% discount, High: 15-20%, Moderate: 12-15%, Low: 8-12%
                      const discountPercent = step1LocationData?.electric?.level === 'Very High' ? 22 
                        : step1LocationData?.electric?.level === 'High' ? 17 
                        : step1LocationData?.electric?.level === 'Moderate' ? 13 
                        : 10;
                      
                      const ppaRate = (step1LocationData?.electric?.rate || 0.12) * (1 - discountPercent / 100);
                      const solarCoverage = step1LocationData?.solar?.rating === 'Excellent' ? 0.85 : step1LocationData?.solar?.rating === 'Good' ? 0.78 : 0.70;
                      const effectiveSavingsPercent = Math.round(solarCoverage * discountPercent);
                      const annualSavings = Math.round(annualBill * solarCoverage * (discountPercent / 100));
                      const monthlySavings = Math.round(annualSavings / 12);
                      
                      return (
                        <>
                          <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                            <div className="bg-slate-900/50 rounded-lg p-2.5 border border-slate-800 text-center">
                              <div className="text-[10px] uppercase tracking-wider text-slate-300 mb-1">Upfront Cost</div>
                              <div className="text-2xl font-bold text-indigo-400">$0</div>
                              <div className="text-slate-300 text-[10px]">No investment</div>
                            </div>
                            <div className="bg-slate-900/50 rounded-lg p-2.5 border border-slate-800 text-center">
                              <div className="text-[10px] uppercase tracking-wider text-slate-300 mb-1">PPA Rate</div>
                              <div className="text-2xl font-bold text-white">${ppaRate.toFixed(2)}</div>
                              <div className="text-slate-300 text-[10px]">per kWh</div>
                            </div>
                            <div className="bg-slate-900/50 rounded-lg p-2.5 border border-slate-800 text-center">
                              <div className="text-[10px] uppercase tracking-wider text-slate-300 mb-1">Annual Savings</div>
                              <div className="text-2xl font-bold text-indigo-400">${Math.round(annualSavings/1000)}K</div>
                              <div className="text-slate-300 text-[10px]">estimated</div>
                            </div>
                            <div className="bg-slate-900/50 rounded-lg p-2.5 border border-slate-800 text-center">
                              <div className="text-[10px] uppercase tracking-wider text-slate-300 mb-1">Monthly Savings</div>
                              <div className="text-2xl font-bold text-indigo-400">${monthlySavings.toLocaleString()}</div>
                              <div className="text-slate-300 text-[10px]">~{effectiveSavingsPercent}% of bill</div>
                            </div>
                            <div className="bg-slate-900/50 rounded-lg p-2.5 border border-slate-800 text-center">
                              <div className="text-[10px] uppercase tracking-wider text-slate-300 mb-1">vs Utility</div>
                              <div className="text-2xl font-bold text-indigo-400">{discountPercent}%</div>
                              <div className="text-slate-300 text-[10px]">less/kWh</div>
                            </div>
                          </div>
                        </>
                      );
                    })()
                    )}
                    <p className="mt-3 mb-4 text-xs text-slate-300 flex items-center gap-1">
                      <span className="text-indigo-400">ℹ️</span>
                      <span><span className="text-slate-300 font-medium">PPA:</span> Third party owns system, no upfront cost. {locationConfirmed ? `Saves based on your location's rates.` : 'Enter location for savings estimate.'}</span>
                    </p>
                  </>
                )}
                
              </div>

              {/* CTA - inline mt-auto */}
              <div className="mt-auto flex items-center justify-between px-6 py-4">
                <div>
                  <div className="font-semibold text-white">
                    Ready to Refine these Numbers?
                  </div>
                  <div className="text-sm text-slate-300">
                    Next: Select Industry for Load Analysis
                  </div>
                </div>
                <button 
                  disabled={!locationConfirmed}
                  onClick={() => setCurrentStep(2)}
                  className={`font-bold px-8 py-3 rounded-xl flex items-center gap-2 transition-all ${
                    locationConfirmed 
                      ? 'bg-indigo-500 text-white hover:bg-indigo-600 shadow-lg cursor-pointer' 
                      : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                  }`}
                >
                  Select Industry <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
            </div>
          )}
          {currentStep === 2 && (
            <div className="bg-black min-h-screen flex flex-col items-center pt-8 px-8 pb-16">
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-white">Select Your Industry</h2>
                <p className="text-slate-300 mt-2">We'll customize the assessment with industry-specific questions</p>
              </div>
              
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-5 w-full max-w-5xl mx-auto">
                {INDUSTRIES.map((industry) => {
                  const Icon = industry.icon;
                  const isSelected = selectedIndustry?.id === industry.id;
                  return (
                    <button key={industry.id} onClick={() => { setSelectedIndustry(industry); setFormData({}); }}
                      className={`p-6 rounded-2xl border-2 transition-all text-center ${isSelected ? 'border-indigo-500 bg-indigo-500/20 shadow-lg shadow-indigo-500/10' : 'border-slate-700 bg-slate-900 hover:border-slate-500 hover:bg-slate-800'}`}>
                      <div className={`w-14 h-14 rounded-xl flex items-center justify-center mx-auto mb-3 ${isSelected ? 'bg-indigo-500 text-white' : 'bg-slate-700 text-slate-300'}`}><Icon className="w-7 h-7" /></div>
                      <div className={`font-semibold text-base ${isSelected ? 'text-indigo-400' : 'text-white'}`}>{industry.name}</div>
                      {isSelected && <CheckCircle2 className="w-5 h-5 text-indigo-400 mx-auto mt-2" />}
                    </button>
                  );
                })}
              </div>
              
              <Navigation backStep={1} nextStep={3} nextLabel="Continue to Industry Details" nextDisabled={!canProceed()} />
            </div>
          )}

        </main>
      )}

      {/* FIX A-12: Legal disclaimer — moved to header top-right */}

      {showLocationPickerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60" onClick={() => setShowLocationPickerModal(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-[600px] max-w-[95vw] max-h-[80vh] flex flex-col overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 px-6 py-5 flex-shrink-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                    <MapPin className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-white font-bold text-xl">Select Location</h3>
                    <p className="text-indigo-100 text-sm">Multiple locations found for "{businessSearchQuery}"</p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowLocationPickerModal(false)}
                  className="w-10 h-10 bg-white/20 hover:bg-white/30 rounded-lg flex items-center justify-center text-white transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            
            {/* Instruction */}
            <div className="px-6 py-3 bg-amber-50 border-b border-amber-200 flex-shrink-0">
              <p className="text-sm text-amber-800">
                <span className="font-semibold">📍 Choose your exact location</span> — Select the correct street address below
              </p>
            </div>
            
            {/* Scrollable Location List */}
            <div className="flex-1 overflow-y-auto p-4">
              <div className="space-y-3">
                {multiLocationResults.map((location, idx) => (
                  <button
                    key={location.placeId}
                    onClick={() => handleBusinessSelect(location)}
                    className="w-full p-4 bg-slate-800 border-2 border-slate-700 rounded-xl hover:border-indigo-400 hover:bg-indigo-50 transition-all text-left group"
                  >
                    <div className="flex items-start gap-4">
                      {/* Photo/Icon placeholder */}
                      <div className="w-16 h-16 bg-slate-100 rounded-lg flex-shrink-0 flex items-center justify-center overflow-hidden">
                        {location.photoUrl ? (
                          <img src={location.photoUrl} alt={location.name} className="w-full h-full object-cover" />
                        ) : (
                          <Building className="w-8 h-8 text-slate-300" />
                        )}
                      </div>
                      
                      {/* Details */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="font-semibold text-white text-base">{location.name}</div>
                            <div className="text-sm text-slate-300 mt-0.5">{location.address}</div>
                          </div>
                          <span className="text-xs text-slate-300 flex-shrink-0 bg-slate-100 px-2 py-1 rounded">
                            {location.distance}
                          </span>
                        </div>
                      </div>
                      
                      {/* Select indicator */}
                      <div className="w-8 h-8 rounded-full border-2 border-slate-200 group-hover:border-indigo-500 group-hover:bg-indigo-500 flex items-center justify-center transition-all flex-shrink-0">
                        <Check className="w-4 h-4 text-transparent group-hover:text-white transition-all" />
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
            
            {/* Footer */}
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex-shrink-0">
              <div className="flex items-center justify-between">
                <p className="text-sm text-slate-300">
                  {multiLocationResults.length} locations found
                </p>
                <button 
                  onClick={() => setShowLocationPickerModal(false)}
                  className="px-4 py-2 text-sm text-slate-300 hover:text-slate-800 hover:bg-slate-200 rounded-lg transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SSOT Tracker — slide-out panel, PIN-protected */}
      <MerlinSSOTTracker 
        isOpen={ssotTrackerOpen} 
        onClose={() => setSsotTrackerOpen(false)} 
        locationData={locationData}
      />
    </div>
  );
}

export default function EnergyWizardSteps1_3WithErrorBoundary(props) {
  return (
    <ErrorBoundary>
      <EnergyWizardSteps1_3 {...props} />
    </ErrorBoundary>
  );
}
