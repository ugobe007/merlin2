import React from 'react';

interface Step3_LocationTariffProps {
  projectLocation: string;
  setProjectLocation: (value: string) => void;
  tariffRegion: string;
  setTariffRegion: (value: string) => void;
  shippingDestination: string;
  setShippingDestination: (value: string) => void;
  bessPowerMW?: number;
  duration?: number;
  solarMW?: number;
  windMW?: number;
  generatorMW?: number;
}

const Step3_LocationTariff: React.FC<Step3_LocationTariffProps> = ({
  projectLocation,
  setProjectLocation,
  tariffRegion,
  setTariffRegion,
  shippingDestination,
  setShippingDestination,
  bessPowerMW = 1,
  duration = 4,
  solarMW = 0,
  windMW = 0,
  generatorMW = 0,
}) => {
  // Calculate equipment costs for tariff display
  const getTariffRate = () => {
    const tariffRates: { [key: string]: number } = {
      'North America': 0.0125,
      'Europe': 0.045,
      'Asia Pacific': 0.075,
      'Middle East': 0.10,
      'Africa': 0.15,
      'South America': 0.115,
    };
    return tariffRates[tariffRegion] || 0.05;
  };

  const getShippingRatePerKg = () => {
    const shippingRates: { [key: string]: number } = {
      'North America': 2.5,
      'Europe': 3.5,
      'Asia Pacific': 4.5,
      'Middle East': 5.5,
      'Africa': 6.5,
      'South America': 5.0,
    };
    return shippingRates[tariffRegion] || 3.5;
  };

  // Calculate estimated costs
  const batteryMWh = bessPowerMW * duration;
  const pricePerKWh = bessPowerMW >= 5 ? 120 : 140;
  const batterySystem = batteryMWh * 1000 * pricePerKWh;
  const additionalEquipment = (solarMW * 800000) + (windMW * 1200000) + (generatorMW * 300000);
  const equipmentSubtotal = batterySystem + additionalEquipment;

  const tariffAmount = equipmentSubtotal * getTariffRate();
  
  const totalEquipmentWeight = batteryMWh * 1000 + solarMW * 500 + windMW * 800 + generatorMW * 1200;
  const shippingAmount = totalEquipmentWeight * getShippingRatePerKg();
  return (
    <div className="space-y-8">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400">
          Project Location & Costs
        </h2>
        <p className="text-gray-400 text-lg">
          Help us calculate accurate tariffs and shipping costs for your project.
        </p>
      </div>

      {/* Project Location */}
      <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 p-6 rounded-2xl border border-gray-700/50">
        <label className="block text-xl font-semibold text-gray-200 mb-4">
          Where is your project located?
        </label>
        <select
          value={projectLocation}
          onChange={(e) => setProjectLocation(e.target.value)}
          className="w-full px-4 py-3 bg-gray-800/80 border-2 border-gray-600 rounded-xl text-white text-lg focus:outline-none focus:border-purple-500 transition-all"
        >
          <option value="United States">United States</option>
          <option value="Canada">Canada</option>
          <option value="Mexico">Mexico</option>
          <option value="United Kingdom">United Kingdom</option>
          <option value="Germany">Germany</option>
          <option value="France">France</option>
          <option value="Spain">Spain</option>
          <option value="Italy">Italy</option>
          <option value="Netherlands">Netherlands</option>
          <option value="Australia">Australia</option>
          <option value="Japan">Japan</option>
          <option value="South Korea">South Korea</option>
          <option value="China">China</option>
          <option value="India">India</option>
          <option value="Brazil">Brazil</option>
          <option value="Other">Other</option>
        </select>
      </div>

      {/* Tariff & Shipping Calculations */}
      <div className="bg-gradient-to-br from-blue-900/20 to-purple-900/20 p-6 rounded-2xl border border-blue-500/30">
        <h3 className="text-2xl font-bold text-blue-300 mb-6">
          💰 Tariff & Shipping Calculations
        </h3>

        <div className="grid md:grid-cols-2 gap-6">
          {/* World Region for Tariff */}
          <div className="space-y-3">
            <label className="block text-lg font-semibold text-gray-200">
              World Region (for tariff calculations)
            </label>
            <select
              value={tariffRegion}
              onChange={(e) => setTariffRegion(e.target.value)}
              className="w-full px-4 py-3 bg-gray-800/80 border-2 border-gray-600 rounded-xl text-white focus:outline-none focus:border-blue-500 transition-all"
            >
              <option value="North America">North America</option>
              <option value="Europe">Europe</option>
              <option value="Asia Pacific">Asia Pacific</option>
              <option value="Middle East">Middle East</option>
              <option value="Africa">Africa</option>
              <option value="South America">South America</option>
            </select>
          </div>

          {/* Shipping Destination */}
          <div className="space-y-3">
            <label className="block text-lg font-semibold text-gray-200">
              Shipping Destination
            </label>
            <input
              type="text"
              value={shippingDestination}
              onChange={(e) => setShippingDestination(e.target.value)}
              placeholder="e.g., California, USA or London, UK"
              className="w-full px-4 py-3 bg-gray-800/80 border-2 border-gray-600 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-all"
            />
          </div>
        </div>

        {/* Explanatory Info */}
        <div className="mt-6 space-y-3 text-sm">
          <div className="flex items-start space-x-3 bg-yellow-900/20 p-3 rounded-lg border border-yellow-600/30">
            <span className="text-2xl">💡</span>
            <div>
              <span className="font-bold text-yellow-300">Tariff Region: </span>
              <span className="text-gray-300">Used for calculating import duties and energy pricing</span>
            </div>
          </div>
          <div className="flex items-start space-x-3 bg-brown-900/20 p-3 rounded-lg border border-orange-600/30">
            <span className="text-2xl">📦</span>
            <div>
              <span className="font-bold text-orange-300">Shipping: </span>
              <span className="text-gray-300">Helps estimate logistics and delivery costs</span>
            </div>
          </div>
        </div>

        {/* Tariff Information Display */}
        <div className="mt-6 space-y-4">
          {/* Cost Breakdown */}
          <div className="p-5 bg-gradient-to-br from-orange-900/30 to-red-900/30 rounded-xl border border-orange-500/30">
            <h4 className="text-lg font-bold text-orange-300 mb-4">📊 Cost Estimates Based on Configuration</h4>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-300">Equipment Subtotal:</span>
                <span className="text-white font-bold text-lg">${equipmentSubtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-300">Tariff Rate ({tariffRegion}):</span>
                <span className="text-orange-400 font-bold">{(getTariffRate() * 100).toFixed(2)}%</span>
              </div>
              <div className="flex justify-between items-center bg-orange-800/20 p-3 rounded-lg">
                <span className="text-orange-300 font-semibold">💰 Estimated Tariff Cost:</span>
                <span className="text-orange-400 font-bold text-xl">${tariffAmount.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Shipping Breakdown */}
          <div className="p-5 bg-gradient-to-br from-blue-900/30 to-cyan-900/30 rounded-xl border border-blue-500/30">
            <h4 className="text-lg font-bold text-blue-300 mb-4">🚢 Shipping Estimates</h4>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-300">Total Equipment Weight:</span>
                <span className="text-white font-bold">{totalEquipmentWeight.toLocaleString()} kg</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-300">Shipping Rate:</span>
                <span className="text-blue-400 font-bold">${getShippingRatePerKg().toFixed(2)}/kg</span>
              </div>
              <div className="flex justify-between items-center bg-blue-800/20 p-3 rounded-lg">
                <span className="text-blue-300 font-semibold">📦 Estimated Shipping Cost:</span>
                <span className="text-blue-400 font-bold text-xl">${shippingAmount.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Total Additional Costs */}
          <div className="p-5 bg-gradient-to-br from-purple-900/30 to-pink-900/30 rounded-xl border-2 border-purple-500/40">
            <div className="flex justify-between items-center">
              <div>
                <h4 className="text-xl font-bold text-purple-300 mb-1">Total Tariffs + Shipping</h4>
                <p className="text-sm text-gray-400">Additional costs beyond equipment</p>
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold text-purple-400">${(tariffAmount + shippingAmount).toLocaleString()}</p>
                <p className="text-sm text-purple-300 mt-1">{((tariffAmount + shippingAmount) / equipmentSubtotal * 100).toFixed(1)}% of equipment</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Step3_LocationTariff;
