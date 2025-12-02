/**
 * Step 4: Power Recommendation Acceptance - DASHBOARD DESIGN
 * Compact, one-screen acceptance with integrated renewables adjustment
 */

import React, { useState } from 'react';
import { Zap, Battery, Sun, Wind, TrendingUp, Check, Settings } from 'lucide-react';
import type { BaseStepProps } from '@/types/wizard.types';

interface Step4Props extends BaseStepProps {
  storageSizeMW: number;
  durationHours: number;
  solarMW: number;
  windMW: number;
  generatorMW: number;
  setSolarMW: (val: number) => void;
  setWindMW: (val: number) => void;
  setGeneratorMW: (val: number) => void;
  industryTemplate?: string;
}

const Step4_PowerRecommendation: React.FC<Step4Props> = ({
  storageSizeMW,
  durationHours,
  solarMW,
  windMW,
  generatorMW,
  setSolarMW,
  setWindMW,
  setGeneratorMW,
  industryTemplate,
  onNext,
  onBack
}) => {
  const [accepted, setAccepted] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [adjustMode, setAdjustMode] = useState(false);

  const totalEnergyMWh = storageSizeMW * durationHours;
  const totalSystemMW = storageSizeMW + solarMW + windMW + generatorMW;

  const handleAccept = () => {
    setAccepted(true);
    setShowConfetti(true);
    setTimeout(() => onNext(), 1500);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-3">
      {/* Confetti Effect */}
      {showConfetti && (
        <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
          {[...Array(50)].map((_, i) => (
            <div
              key={i}
              className="absolute animate-confetti"
              style={{
                left: `${Math.random() * 100}%`,
                top: '-10%',
                animationDelay: `${Math.random() * 0.5}s`,
                animationDuration: `${2 + Math.random() * 2}s`
              }}
            >
              <div className={`w-3 h-3 ${['bg-purple-500', 'bg-blue-500', 'bg-green-500'][i % 3]}`}></div>
            </div>
          ))}
        </div>
      )}

      {/* TOP: ACCEPT BUTTON (PRIMARY ACTION) - CENTERED WITH 3D EFFECT */}
      {!accepted ? (
        <div className="mb-6 text-center">
          <div className="mb-4">
            <div className="flex items-center justify-center gap-3 mb-2">
              <Zap className="w-10 h-10 text-purple-600" />
              <h2 className="text-3xl font-bold text-gray-900">Your Power Recommendation</h2>
            </div>
            <p className="text-lg text-gray-600">Review and accept, or adjust below</p>
          </div>
          <button
            onClick={handleAccept}
            className="inline-flex items-center gap-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white px-16 py-6 rounded-2xl text-2xl font-bold hover:from-purple-700 hover:to-blue-700 transition-all transform hover:scale-105 shadow-2xl hover:shadow-3xl"
            style={{ 
              boxShadow: '0 10px 40px rgba(147, 51, 234, 0.5), 0 4px 12px rgba(0, 0, 0, 0.3)',
              textShadow: '0 2px 4px rgba(0, 0, 0, 0.2)'
            }}
          >
            <Check className="w-8 h-8" />
            <span>Accept Power Profile</span>
            <TrendingUp className="w-8 h-8" />
          </button>
        </div>
      ) : (
        <div className="mb-6 text-center bg-green-50 border-2 border-green-300 rounded-xl p-6">
          <div className="flex items-center justify-center gap-3">
            <span className="text-4xl">🎉</span>
            <h3 className="text-2xl font-bold text-green-600">Power Profile Accepted!</h3>
            <span className="text-4xl">🎉</span>
          </div>
        </div>
      )}

      {/* DASHBOARD GRID - Compact 3-column layout */}
      <div className="grid grid-cols-3 gap-3 mb-3">
        {/* LEFT: Battery Storage */}
        <div className="bg-blue-50 border border-blue-300 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-2">
            <Battery className="w-5 h-5 text-blue-600" />
            <h3 className="font-bold text-blue-900">Battery</h3>
          </div>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span>Power:</span>
              <span className="font-bold">{storageSizeMW} MW</span>
            </div>
            <div className="flex justify-between">
              <span>Energy:</span>
              <span className="font-bold">{totalEnergyMWh.toFixed(1)} MWh</span>
            </div>
            <div className="flex justify-between">
              <span>Duration:</span>
              <span className="font-bold">{durationHours}h</span>
            </div>
          </div>
        </div>

        {/* CENTER: Total System */}
        <div className="bg-gradient-to-br from-purple-100 to-blue-100 border-2 border-purple-400 rounded-lg p-3">
          <div className="text-center">
            <div className="text-sm text-gray-600 mb-1">Total System</div>
            <div className="text-4xl font-bold text-purple-700">{totalSystemMW.toFixed(1)}</div>
            <div className="text-xs text-gray-600">MW Capacity</div>
            <div className="mt-2 grid grid-cols-3 gap-1 text-xs">
              <div>
                <div className="font-bold text-blue-700">{storageSizeMW}</div>
                <div className="text-gray-600">Battery</div>
              </div>
              <div>
                <div className="font-bold text-green-700">{solarMW}</div>
                <div className="text-gray-600">Solar</div>
              </div>
              <div>
                <div className="font-bold text-orange-700">{(windMW + generatorMW).toFixed(1)}</div>
                <div className="text-gray-600">Other</div>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT: Renewables */}
        <div className="bg-green-50 border border-green-300 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-2">
            <Sun className="w-5 h-5 text-green-600" />
            <h3 className="font-bold text-green-900">Renewables</h3>
          </div>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span>☀️ Solar:</span>
              <span className="font-bold">{solarMW} MW</span>
            </div>
            <div className="flex justify-between">
              <span>💨 Wind:</span>
              <span className="font-bold">{windMW} MW</span>
            </div>
            <div className="flex justify-between">
              <span>⚙️ Generator:</span>
              <span className="font-bold">{generatorMW} MW</span>
            </div>
          </div>
        </div>
      </div>

      {/* ADJUSTMENT SECTION - PROMINENT */}
      <div className="bg-gradient-to-r from-purple-50 to-blue-50 border-2 border-purple-400 rounded-xl p-4 mb-3 shadow-lg">
        <button
          onClick={() => setAdjustMode(!adjustMode)}
          className="w-full flex items-center justify-between text-left hover:bg-white/50 rounded-lg p-3 transition-colors"
        >
          <div className="flex items-center gap-3">
            <Settings className="w-7 h-7 text-purple-600" />
            <div>
              <span className="text-xl font-bold text-gray-900 block">Adjust Renewables</span>
              <span className="text-sm text-gray-600">Optional: Fine-tune your solar, wind, and generator settings</span>
            </div>
          </div>
          <span className="text-3xl text-purple-600 font-bold">{adjustMode ? '▼' : '▶'}</span>
        </button>
        
        {adjustMode && (
          <div className="mt-3 space-y-3 pt-3 border-t">
            {/* Solar Slider */}
            <div>
              <div className="flex justify-between mb-1">
                <label className="text-sm font-medium text-gray-700">☀️ Solar</label>
                <span className="text-sm font-bold text-green-600">{solarMW} MW</span>
              </div>
              <input
                type="range"
                min="0"
                max="10"
                step="0.5"
                value={solarMW}
                onChange={(e) => setSolarMW(parseFloat(e.target.value))}
                className="w-full h-2 bg-green-200 rounded-lg appearance-none cursor-pointer accent-green-600"
              />
            </div>

            {/* Wind Slider */}
            <div>
              <div className="flex justify-between mb-1">
                <label className="text-sm font-medium text-gray-700">💨 Wind</label>
                <span className="text-sm font-bold text-blue-600">{windMW} MW</span>
              </div>
              <input
                type="range"
                min="0"
                max="10"
                step="0.5"
                value={windMW}
                onChange={(e) => setWindMW(parseFloat(e.target.value))}
                className="w-full h-2 bg-blue-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
              />
            </div>

            {/* Generator Slider */}
            <div>
              <div className="flex justify-between mb-1">
                <label className="text-sm font-medium text-gray-700">⚙️ Generator</label>
                <span className="text-sm font-bold text-orange-600">{generatorMW} MW</span>
              </div>
              <input
                type="range"
                min="0"
                max="10"
                step="0.5"
                value={generatorMW}
                onChange={(e) => setGeneratorMW(parseFloat(e.target.value))}
                className="w-full h-2 bg-orange-200 rounded-lg appearance-none cursor-pointer accent-orange-600"
              />
            </div>
          </div>
        )}
      </div>

      {/* BENEFITS - Compact checkboxes */}
      <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-300 rounded-lg p-3 mb-3">
        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
          <div className="flex items-center gap-1 text-green-700">
            <Check className="w-4 h-4" />
            <span>Peak demand reduction</span>
          </div>
          <div className="flex items-center gap-1 text-green-700">
            <Check className="w-4 h-4" />
            <span>Demand charge savings</span>
          </div>
          <div className="flex items-center gap-1 text-green-700">
            <Check className="w-4 h-4" />
            <span>Backup power</span>
          </div>
          <div className="flex items-center gap-1 text-green-700">
            <Check className="w-4 h-4" />
            <span>Carbon reduction</span>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes confetti {
          0% { transform: translateY(0) rotateZ(0); opacity: 1; }
          100% { transform: translateY(100vh) rotateZ(360deg); opacity: 0; }
        }
        .animate-confetti { animation: confetti linear forwards; }
      `}</style>
    </div>
  );
};

export default Step4_PowerRecommendation;
