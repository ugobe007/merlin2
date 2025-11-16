import React from 'react';
import merlinAvatar from '@/assets/images/new_Merlin.png';

interface Step0_GoalsProps {
  selectedGoal: string | string[];
  setSelectedGoal: (value: string | string[]) => void;
}

const Step0_Goals: React.FC<Step0_GoalsProps> = ({
  selectedGoal,
  setSelectedGoal,
}) => {
  const goals = [
    {
      id: 'reduce-costs',
      icon: '💰',
      title: 'Reduce Energy Bills',
      description: 'Lower electricity costs through peak shaving and demand charge reduction',
      color: 'green',
      benefits: ['Save 30-50% on peak charges', 'Reduce demand charges', 'Lower monthly utility bills']
    },
    {
      id: 'backup-power',
      icon: '🔌',
      title: 'Backup Power',
      description: 'Keep operations running during outages and grid instability',
      color: 'blue',
      benefits: ['Uninterrupted operations', 'Protect critical systems', 'Avoid downtime costs']
    },
    {
      id: 'renewable-storage',
      icon: '☀️',
      title: 'Use More Solar/Wind',
      description: 'Store renewable energy to use when the sun isn\'t shining or wind isn\'t blowing',
      color: 'yellow',
      benefits: ['Maximize renewable usage', '80%+ renewable energy', 'Store excess generation']
    },
    {
      id: 'grid-revenue',
      icon: '📈',
      title: 'Earn Money from Grid',
      description: 'Generate revenue by selling grid services and participating in energy markets',
      color: 'purple',
      benefits: ['Frequency regulation', 'Demand response payments', 'Energy arbitrage']
    },
    {
      id: 'sustainability',
      icon: '🌱',
      title: 'Go Green',
      description: 'Achieve sustainability goals and qualify for tax incentives',
      color: 'emerald',
      benefits: ['Reduce carbon footprint', '30% Federal tax credit', 'Net-zero energy']
    },
    {
      id: 'all-above',
      icon: '⭐',
      title: 'All of the Above',
      description: 'Maximize value by combining cost savings, backup power, and revenue generation',
      color: 'indigo',
      benefits: ['Maximum ROI', 'Multiple revenue streams', 'Complete energy solution']
    }
  ];

  const getColorClasses = (color: string, isSelected: boolean) => {
    const colors: { [key: string]: { bg: string; border: string; shadow: string; hover: string } } = {
      green: {
        bg: isSelected ? 'bg-gradient-to-br from-green-100 to-emerald-100' : 'bg-white',
        border: isSelected ? 'border-green-500' : 'border-gray-300 hover:border-green-400',
        shadow: isSelected ? 'shadow-lg shadow-green-300/50' : 'hover:shadow-md',
        hover: 'hover:scale-102'
      },
      blue: {
        bg: isSelected ? 'bg-gradient-to-br from-blue-100 to-cyan-100' : 'bg-white',
        border: isSelected ? 'border-blue-500' : 'border-gray-300 hover:border-blue-400',
        shadow: isSelected ? 'shadow-lg shadow-blue-300/50' : 'hover:shadow-md',
        hover: 'hover:scale-102'
      },
      yellow: {
        bg: isSelected ? 'bg-gradient-to-br from-yellow-100 to-amber-100' : 'bg-white',
        border: isSelected ? 'border-yellow-500' : 'border-gray-300 hover:border-yellow-400',
        shadow: isSelected ? 'shadow-lg shadow-yellow-300/50' : 'hover:shadow-md',
        hover: 'hover:scale-102'
      },
      purple: {
        bg: isSelected ? 'bg-gradient-to-br from-purple-100 to-violet-100' : 'bg-white',
        border: isSelected ? 'border-purple-500' : 'border-gray-300 hover:border-purple-400',
        shadow: isSelected ? 'shadow-lg shadow-purple-300/50' : 'hover:shadow-md',
        hover: 'hover:scale-102'
      },
      emerald: {
        bg: isSelected ? 'bg-gradient-to-br from-emerald-100 to-teal-100' : 'bg-white',
        border: isSelected ? 'border-emerald-500' : 'border-gray-300 hover:border-emerald-400',
        shadow: isSelected ? 'shadow-lg shadow-emerald-300/50' : 'hover:shadow-md',
        hover: 'hover:scale-102'
      },
      indigo: {
        bg: isSelected ? 'bg-gradient-to-br from-indigo-100 to-blue-100' : 'bg-white',
        border: isSelected ? 'border-indigo-500' : 'border-gray-300 hover:border-indigo-400',
        shadow: isSelected ? 'shadow-lg shadow-indigo-300/50' : 'hover:shadow-md',
        hover: 'hover:scale-102'
      }
    };
    return colors[color] || colors.blue;
  };

  return (
    <div className="space-y-8">
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center mb-4">
          <img 
            src={merlinAvatar} 
            alt="Merlin" 
            className="w-20 h-20 object-contain"
          />
        </div>
        <h2 className="text-4xl font-bold text-gray-800">
          What's Your Main Goal?
        </h2>
        <p className="text-gray-600 text-lg max-w-2xl mx-auto">
          Select one or more goals (click to select/deselect). We'll optimize your system to meet all your needs.
        </p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {goals.map((goal) => {
          const selectedArray = Array.isArray(selectedGoal) ? selectedGoal : (selectedGoal ? [selectedGoal] : []);
          const isSelected = selectedArray.includes(goal.id);
          const colorClasses = getColorClasses(goal.color, isSelected);
          
          return (
            <button
              key={goal.id}
              onClick={() => {
                const currentSelection = Array.isArray(selectedGoal) ? selectedGoal : (selectedGoal ? [selectedGoal] : []);
                
                if (currentSelection.includes(goal.id)) {
                  // Remove if already selected
                  const newSelection = currentSelection.filter(id => id !== goal.id);
                  setSelectedGoal(newSelection);
                } else {
                  // Add to selection
                  const newSelection = [...currentSelection, goal.id];
                  setSelectedGoal(newSelection);
                }
              }}
              className={`p-6 rounded-xl border-2 transition-all text-left ${colorClasses.bg} ${colorClasses.border} ${colorClasses.shadow} ${colorClasses.hover}`}
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-5xl">{goal.icon}</span>
                  {isSelected && (
                    <span className="text-green-600 text-3xl">✓</span>
                  )}
                </div>
                <h4 className="text-xl font-bold text-gray-900">{goal.title}</h4>
                <p className="text-sm text-gray-600 leading-relaxed">
                  {goal.description}
                </p>
                <ul className="text-xs text-gray-600 space-y-1">
                  {goal.benefits.map((benefit, idx) => (
                    <li key={idx} className="flex items-start">
                      <span className="text-green-500 mr-1">✓</span>
                      <span>{benefit}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </button>
          );
        })}
      </div>

      {/* Help tooltip */}
      {((Array.isArray(selectedGoal) && selectedGoal.length > 0) || selectedGoal) && (
        <div className="bg-blue-50 border-2 border-blue-300 rounded-xl p-6 animate-fadeIn">
          <div className="flex items-start space-x-4">
            <span className="text-3xl">💡</span>
            <div>
              <h4 className="font-bold text-blue-900 mb-2">
                {Array.isArray(selectedGoal) && selectedGoal.length > 1 
                  ? `Great! You've selected ${selectedGoal.length} goals` 
                  : 'Great choice!'}
              </h4>
              <p className="text-gray-700">
                {(() => {
                  const firstGoal = Array.isArray(selectedGoal) ? selectedGoal[0] : selectedGoal;
                  const isMultiple = Array.isArray(selectedGoal) && selectedGoal.length > 1;
                  
                  if (isMultiple) {
                    return "We'll configure a system that addresses all your selected goals. This comprehensive approach often provides the best ROI.";
                  }
                  
                  if (firstGoal === 'reduce-costs') return "We'll configure a system optimized for peak shaving and demand charge reduction. Most customers see payback in 4-7 years.";
                  if (firstGoal === 'backup-power') return "We'll size your system to provide backup power for your critical loads during outages.";
                  if (firstGoal === 'renewable-storage') return "We'll help you maximize your solar or wind investment by storing excess energy for later use.";
                  if (firstGoal === 'grid-revenue') return "We'll configure your system to participate in frequency regulation and demand response programs.";
                  if (firstGoal === 'sustainability') return "We'll show you how to achieve net-zero energy and maximize available tax incentives.";
                  if (firstGoal === 'all-above') return "We'll optimize your system for maximum value across all revenue streams and use cases.";
                  return "";
                })()}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Step0_Goals;
