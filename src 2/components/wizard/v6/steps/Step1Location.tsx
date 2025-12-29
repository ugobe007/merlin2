/**
 * V6 Step 1: Location & Goals
 * Design: V5 clean white cards + V6 simple goal toggles
 */
import React, { useState, useEffect } from 'react';
import { MapPin, Sparkles, Check, Globe, CheckCircle, ChevronDown } from 'lucide-react';
import type { WizardState, EnergyGoal } from '../types';
import { ENERGY_GOALS } from '../types';

// Complete ZIP to State mapping
const ZIP_TO_STATE: Record<string, string> = {
  // Nevada
  '889': 'Nevada', '890': 'Nevada', '891': 'Nevada', '893': 'Nevada',
  '894': 'Nevada', '895': 'Nevada', '896': 'Nevada', '897': 'Nevada', '898': 'Nevada',
  // California
  '900': 'California', '901': 'California', '902': 'California', '903': 'California',
  '904': 'California', '905': 'California', '906': 'California', '907': 'California',
  '908': 'California', '910': 'California', '911': 'California', '912': 'California',
  '913': 'California', '914': 'California', '915': 'California', '916': 'California',
  '917': 'California', '918': 'California', '919': 'California', '920': 'California',
  '921': 'California', '922': 'California', '923': 'California', '924': 'California',
  '925': 'California', '926': 'California', '927': 'California', '928': 'California',
  '930': 'California', '931': 'California', '932': 'California', '933': 'California',
  '934': 'California', '935': 'California', '936': 'California', '937': 'California',
  '938': 'California', '939': 'California', '940': 'California', '941': 'California',
  '942': 'California', '943': 'California', '944': 'California', '945': 'California',
  '946': 'California', '947': 'California', '948': 'California', '949': 'California',
  '950': 'California', '951': 'California', '952': 'California', '953': 'California',
  '954': 'California', '955': 'California', '956': 'California', '957': 'California',
  '958': 'California', '959': 'California', '960': 'California', '961': 'California',
  // Arizona
  '850': 'Arizona', '851': 'Arizona', '852': 'Arizona', '853': 'Arizona',
  '855': 'Arizona', '856': 'Arizona', '857': 'Arizona', '859': 'Arizona',
  '860': 'Arizona', '863': 'Arizona', '864': 'Arizona', '865': 'Arizona',
  // Texas
  '750': 'Texas', '751': 'Texas', '752': 'Texas', '753': 'Texas', '754': 'Texas',
  '755': 'Texas', '756': 'Texas', '757': 'Texas', '758': 'Texas', '759': 'Texas',
  '760': 'Texas', '761': 'Texas', '762': 'Texas', '763': 'Texas', '764': 'Texas',
  '765': 'Texas', '766': 'Texas', '767': 'Texas', '768': 'Texas', '769': 'Texas',
  '770': 'Texas', '771': 'Texas', '772': 'Texas', '773': 'Texas', '774': 'Texas',
  '775': 'Texas', '776': 'Texas', '777': 'Texas', '778': 'Texas', '779': 'Texas',
  '780': 'Texas', '781': 'Texas', '782': 'Texas', '783': 'Texas', '784': 'Texas',
  '785': 'Texas', '786': 'Texas', '787': 'Texas', '788': 'Texas', '789': 'Texas',
  '790': 'Texas', '791': 'Texas', '792': 'Texas', '793': 'Texas', '794': 'Texas',
  '795': 'Texas', '796': 'Texas', '797': 'Texas', '798': 'Texas', '799': 'Texas',
  // Florida
  '320': 'Florida', '321': 'Florida', '322': 'Florida', '323': 'Florida',
  '324': 'Florida', '325': 'Florida', '326': 'Florida', '327': 'Florida',
  '328': 'Florida', '329': 'Florida', '330': 'Florida', '331': 'Florida',
  '332': 'Florida', '333': 'Florida', '334': 'Florida', '335': 'Florida',
  '336': 'Florida', '337': 'Florida', '338': 'Florida', '339': 'Florida',
  '340': 'Florida', '341': 'Florida', '342': 'Florida', '344': 'Florida',
  '346': 'Florida', '347': 'Florida', '349': 'Florida',
  // New York
  '100': 'New York', '101': 'New York', '102': 'New York', '103': 'New York',
  '104': 'New York', '105': 'New York', '106': 'New York', '107': 'New York',
  '108': 'New York', '109': 'New York', '110': 'New York', '111': 'New York',
  '112': 'New York', '113': 'New York', '114': 'New York', '115': 'New York',
  '116': 'New York', '117': 'New York', '118': 'New York', '119': 'New York',
  '120': 'New York', '121': 'New York', '122': 'New York', '123': 'New York',
  '124': 'New York', '125': 'New York', '126': 'New York', '127': 'New York',
  '128': 'New York', '129': 'New York', '130': 'New York', '131': 'New York',
  '132': 'New York', '133': 'New York', '134': 'New York', '135': 'New York',
  '136': 'New York', '137': 'New York', '138': 'New York', '139': 'New York',
  '140': 'New York', '141': 'New York', '142': 'New York', '143': 'New York',
  '144': 'New York', '145': 'New York', '146': 'New York', '147': 'New York',
  '148': 'New York', '149': 'New York',
  // Colorado
  '800': 'Colorado', '801': 'Colorado', '802': 'Colorado', '803': 'Colorado',
  '804': 'Colorado', '805': 'Colorado', '806': 'Colorado', '807': 'Colorado',
  '808': 'Colorado', '809': 'Colorado', '810': 'Colorado', '811': 'Colorado',
  '812': 'Colorado', '813': 'Colorado', '814': 'Colorado', '815': 'Colorado', '816': 'Colorado',
  // Georgia
  '300': 'Georgia', '301': 'Georgia', '302': 'Georgia', '303': 'Georgia',
  '304': 'Georgia', '305': 'Georgia', '306': 'Georgia', '307': 'Georgia',
  '308': 'Georgia', '309': 'Georgia', '310': 'Georgia', '311': 'Georgia',
  '312': 'Georgia', '313': 'Georgia', '314': 'Georgia', '315': 'Georgia',
  '316': 'Georgia', '317': 'Georgia', '318': 'Georgia', '319': 'Georgia',
  // Washington
  '980': 'Washington', '981': 'Washington', '982': 'Washington', '983': 'Washington',
  '984': 'Washington', '985': 'Washington', '986': 'Washington', '988': 'Washington',
  '989': 'Washington', '990': 'Washington', '991': 'Washington', '992': 'Washington',
  '993': 'Washington', '994': 'Washington',
  // Oregon
  '970': 'Oregon', '971': 'Oregon', '972': 'Oregon', '973': 'Oregon',
  '974': 'Oregon', '975': 'Oregon', '976': 'Oregon', '977': 'Oregon', '978': 'Oregon', '979': 'Oregon',
  // Illinois
  '600': 'Illinois', '601': 'Illinois', '602': 'Illinois', '603': 'Illinois',
  '604': 'Illinois', '605': 'Illinois', '606': 'Illinois', '607': 'Illinois',
  '608': 'Illinois', '609': 'Illinois', '610': 'Illinois', '611': 'Illinois',
  '612': 'Illinois', '613': 'Illinois', '614': 'Illinois', '615': 'Illinois',
  '616': 'Illinois', '617': 'Illinois', '618': 'Illinois', '619': 'Illinois',
};

const SOLAR_DATA: Record<string, { hours: number; rating: string }> = {
  'Nevada': { hours: 6.4, rating: 'Excellent' },
  'Arizona': { hours: 6.5, rating: 'Excellent' },
  'California': { hours: 5.8, rating: 'Excellent' },
  'New Mexico': { hours: 6.0, rating: 'Excellent' },
  'Utah': { hours: 5.6, rating: 'Excellent' },
  'Colorado': { hours: 5.5, rating: 'Excellent' },
  'Texas': { hours: 5.3, rating: 'Very Good' },
  'Florida': { hours: 5.2, rating: 'Very Good' },
  'Georgia': { hours: 4.8, rating: 'Very Good' },
  'New York': { hours: 3.8, rating: 'Moderate' },
  'Illinois': { hours: 4.3, rating: 'Good' },
  'Washington': { hours: 3.5, rating: 'Moderate' },
  'Oregon': { hours: 3.9, rating: 'Moderate' },
};

function getStateFromZip(zip: string): string {
  const prefix = zip.replace(/\D/g, '').substring(0, 3);
  return ZIP_TO_STATE[prefix] || '';
}

function getSolarData(stateName: string) {
  return SOLAR_DATA[stateName] || { hours: 4.2, rating: 'Good' };
}

interface Props {
  state: WizardState;
  updateState: (updates: Partial<WizardState>) => void;
}

export function Step1Location({ state, updateState }: Props) {
  const [zipInput, setZipInput] = useState(state.zipCode);
  const [isUSA, setIsUSA] = useState(true);

  useEffect(() => {
    if (zipInput.length >= 3) {
      const detectedState = getStateFromZip(zipInput);
      if (detectedState && detectedState !== state.state) {
        updateState({ state: detectedState });
      }
    }
  }, [zipInput, state.state, updateState]);

  const handleZipChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 5);
    setZipInput(value);
    updateState({ zipCode: value });
  };

  const toggleGoal = (goal: EnergyGoal) => {
    const currentGoals = state.goals;
    const newGoals = currentGoals.includes(goal)
      ? currentGoals.filter(g => g !== goal)
      : [...currentGoals, goal];
    updateState({ goals: newGoals });
  };

  const solarInfo = state.state ? getSolarData(state.state) : null;

  return (
    <div className="space-y-8 pb-8">
      {/* Hero */}
      <div className="text-center">
        <div className="inline-flex items-center gap-2 bg-purple-600/20 border-2 border-purple-500 rounded-full px-5 py-2 mb-6">
          <Sparkles className="w-5 h-5 text-amber-400" />
          <span className="text-white text-sm font-semibold">AI-Powered Quote Builder</span>
        </div>
        <h1 className="text-4xl md:text-5xl font-black text-white mb-4">Start Saving on Energy</h1>
        <p className="text-xl text-purple-300">Get a custom energy storage quote in minutes</p>
      </div>

      {/* USA / International Toggle */}
      <div className="flex justify-center gap-4">
        <button
          onClick={() => setIsUSA(true)}
          className={`flex items-center gap-3 px-6 py-4 rounded-2xl font-bold text-lg transition-all ${
            isUSA
              ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg scale-105 border-2 border-cyan-300'
              : 'bg-white/10 text-gray-300 hover:bg-white/20 border border-gray-600'
          }`}
        >
          <span className="text-2xl">🇺🇸</span>
          United States
        </button>
        <button
          onClick={() => setIsUSA(false)}
          className={`flex items-center gap-3 px-6 py-4 rounded-2xl font-bold text-lg transition-all ${
            !isUSA
              ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg scale-105 border-2 border-purple-400'
              : 'bg-white/10 text-gray-300 hover:bg-white/20 border border-gray-600'
          }`}
        >
          <Globe className="w-6 h-6" />
          International
        </button>
      </div>

      {/* Location Card - WHITE background for contrast */}
      <div className="max-w-2xl mx-auto bg-white/95 backdrop-blur-sm rounded-3xl p-8 border-2 border-cyan-400 shadow-xl">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-blue-600 rounded-2xl flex items-center justify-center">
            <MapPin className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-800">Where&apos;s your project?</h2>
            <p className="text-sm text-gray-500">We&apos;ll customize recommendations for your area</p>
          </div>
        </div>

        {isUSA ? (
          <div className="space-y-4">
            <label className="block text-sm font-medium text-gray-700">📮 Zip Code (fastest)</label>
            <input
              type="text"
              value={zipInput}
              onChange={handleZipChange}
              placeholder="Enter 5-digit zip"
              className="w-full px-5 py-4 text-xl text-center bg-white border-2 border-gray-300 rounded-xl text-gray-800 placeholder-gray-400 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20"
            />
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            International support coming soon. Please contact us for a custom quote.
          </div>
        )}

        {/* Location Confirmation */}
        {state.state && (
          <div className="mt-6 flex items-center justify-between p-4 bg-gradient-to-r from-cyan-50 to-amber-50 rounded-xl border border-cyan-200">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-cyan-500 flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-white" />
              </div>
              <span className="font-semibold text-gray-800">{state.state} {state.zipCode && `(${state.zipCode})`}</span>
            </div>
            {solarInfo && (
              <div className="flex items-center gap-3 text-sm">
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100">
                  <span className="text-lg">☀️</span>
                  <span className="font-semibold text-amber-700">{solarInfo.hours} hrs/day</span>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                  solarInfo.rating === 'Excellent' ? 'bg-emerald-100 text-emerald-700' :
                  solarInfo.rating === 'Very Good' ? 'bg-green-100 text-green-700' :
                  solarInfo.rating === 'Good' ? 'bg-yellow-100 text-yellow-700' :
                  'bg-gray-100 text-gray-600'
                }`}>
                  {solarInfo.rating} Solar
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Scroll indicator */}
      {state.state && (
        <div className="flex flex-col items-center py-4 animate-bounce">
          <p className="text-purple-400 text-sm mb-1">Scroll for more</p>
          <ChevronDown className="w-6 h-6 text-purple-400" />
        </div>
      )}

      {/* Goals Section - Shows after location is set */}
      {state.state && (
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-white mb-2">What are your energy goals?</h2>
            <p className="text-purple-300">Select all that apply</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {ENERGY_GOALS.map((goal) => {
              const isSelected = state.goals.includes(goal.id);
              return (
                <button
                  key={goal.id}
                  onClick={() => toggleGoal(goal.id)}
                  className={`relative p-5 rounded-xl border-2 transition-all text-left ${
                    isSelected 
                      ? 'border-amber-400 bg-amber-400/20 shadow-lg shadow-amber-500/20' 
                      : 'border-slate-600 bg-slate-800/50 hover:border-amber-400/50'
                  }`}
                >
                  {isSelected && (
                    <div className="absolute top-3 right-3 w-6 h-6 bg-amber-400 rounded-full flex items-center justify-center">
                      <Check className="w-4 h-4 text-slate-900" />
                    </div>
                  )}
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{goal.icon}</span>
                    <span className={`font-semibold ${isSelected ? 'text-white' : 'text-slate-300'}`}>{goal.label}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Ready indicator */}
      {state.zipCode.length >= 5 && state.goals.length > 0 && (
        <div className="max-w-md mx-auto p-4 bg-emerald-500/20 border border-emerald-500/50 rounded-xl text-center">
          <p className="text-emerald-400 font-medium">✓ Ready to continue! Click Next below.</p>
        </div>
      )}
    </div>
  );
}
