import React from 'react';

interface Step6_TimeframeGoalsProps {
  projectTimeframe: string;
  setProjectTimeframe: (value: string) => void;
  selectedGoals: string[];
  setSelectedGoals: (goals: string[]) => void;
}

const Step6_TimeframeGoals: React.FC<Step6_TimeframeGoalsProps> = ({
  projectTimeframe,
  setProjectTimeframe,
  selectedGoals,
  setSelectedGoals,
}) => {
  const goals = [
    {
      id: 'cost-savings',
      title: 'Cost Savings',
      description: 'Reduce energy bills through peak shaving and demand charge management',
      icon: '💰',
      color: 'green',
    },
    {
      id: 'reliability',
      title: 'Reliability',
      description: 'Backup power security and continuous operation during grid outages',
      icon: '🔋',
      color: 'blue',
    },
    {
      id: 'sustainability',
      title: 'Sustainability',
      description: 'Reduce carbon footprint and maximize renewable energy integration',
      icon: '🌱',
      color: 'emerald',
    },
    {
      id: 'compliance',
      title: 'Compliance',
      description: 'Meet regulatory requirements, certifications, and safety standards',
      icon: '✅',
      color: 'purple',
    },
  ];

  const toggleGoal = (goalId: string) => {
    if (selectedGoals.includes(goalId)) {
      setSelectedGoals(selectedGoals.filter(id => id !== goalId));
    } else {
      setSelectedGoals([...selectedGoals, goalId]);
    }
  };

  const getColorClass = (color: string, selected: boolean) => {
    if (selected) {
      const colorMap: { [key: string]: string } = {
        green: 'from-green-100 to-emerald-100 border-green-400 shadow-green-500/30',
        blue: 'from-blue-100 to-cyan-100 border-blue-400 shadow-blue-500/30',
        emerald: 'from-emerald-100 to-teal-100 border-emerald-400 shadow-emerald-500/30',
        purple: 'from-purple-100 to-pink-100 border-purple-400 shadow-purple-500/30',
      };
      return colorMap[color] || colorMap.purple;
    }
    return 'bg-white border-gray-300 hover:border-purple-400';
  };

  return (
    <div className="space-y-8">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-blue-600">
          Final Details
        </h2>
        <p className="text-gray-700 text-lg font-semibold">
          Just a few more details to optimize your configuration.
        </p>
      </div>

      {/* Project Timeframe */}
      <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-6 rounded-2xl border-2 border-gray-400">
        <label className="block text-xl font-semibold text-gray-800 mb-4">
          What's your project timeframe?
        </label>
        <select
          value={projectTimeframe}
          onChange={(e) => setProjectTimeframe(e.target.value)}
          className="w-full px-4 py-3 bg-white border-2 border-gray-300 rounded-xl text-gray-900 text-lg focus:outline-none focus:border-purple-500 transition-all"
        >
          <option value="">Select timeframe...</option>
          <option value="0-3 months">Immediate (0-3 months)</option>
          <option value="3-6 months">Short-term (3-6 months)</option>
          <option value="6-12 months">Medium-term (6-12 months)</option>
          <option value="1-2 years">Long-term (1-2 years)</option>
          <option value="2+ years">Planning phase (2+ years)</option>
          <option value="flexible">Flexible timeline</option>
        </select>
      </div>

      {/* Primary Goal */}
      <div className="bg-gradient-to-br from-purple-50 to-blue-50 p-6 rounded-2xl border-2 border-purple-400">
        <h3 className="text-xl font-semibold text-gray-800 mb-2">
          What are your primary goals?
        </h3>
        <p className="text-gray-700 text-sm font-semibold mb-4">
          Select all that apply - we'll optimize for multiple objectives
        </p>
        
        <div className="grid md:grid-cols-2 gap-4">
          {goals.map((goal) => (
            <button
              key={goal.id}
              onClick={() => toggleGoal(goal.id)}
              className={`p-6 rounded-xl border-2 transition-all text-left ${
                selectedGoals.includes(goal.id)
                  ? `bg-gradient-to-br ${getColorClass(goal.color, true)} shadow-lg`
                  : getColorClass(goal.color, false) + ' hover:shadow-md'
              }`}
            >
              <div className="flex items-start space-x-4">
                <span className="text-4xl">{goal.icon}</span>
                <div className="flex-1">
                  <h4 className="text-lg font-bold text-gray-900 mb-1">{goal.title}</h4>
                  <p className="text-gray-700 text-sm">{goal.description}</p>
                </div>
                {selectedGoals.includes(goal.id) && (
                  <span className="text-green-600 text-2xl">✓</span>
                )}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Additional Context */}
      {selectedGoals.length > 0 && (
        <div className="bg-blue-50 p-5 rounded-xl border-2 border-blue-400">
          <div className="flex items-start space-x-3">
            <span className="text-2xl">💡</span>
            <div className="flex-1">
              <h4 className="font-bold text-blue-700 mb-2">
                Optimization Focus ({selectedGoals.length} goal{selectedGoals.length > 1 ? 's' : ''})
              </h4>
              <div className="space-y-2 text-gray-700 text-sm">
                {selectedGoals.includes('cost-savings') && (
                  <p>• <strong>Cost Savings:</strong> Optimize for maximum ROI and energy bill reduction through peak shaving and demand charge management.</p>
                )}
                {selectedGoals.includes('reliability') && (
                  <p>• <strong>Reliability:</strong> Prioritize backup power capability and system redundancy to ensure continuous operation during grid outages.</p>
                )}
                {selectedGoals.includes('sustainability') && (
                  <p>• <strong>Sustainability:</strong> Maximize renewable energy integration and carbon footprint reduction to meet your environmental targets.</p>
                )}
                {selectedGoals.includes('compliance') && (
                  <p>• <strong>Compliance:</strong> Ensure your system meets all regulatory requirements including certifications, safety standards, and grid connection rules.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Step6_TimeframeGoals;
