/**
 * Market Intelligence Detail Modal
 * 
 * Shows detailed view of market intelligence items with source information
 * and editing capabilities
 */

import React, { useState, useEffect } from 'react';
import { X, Edit2, Save, Trash2 } from 'lucide-react';
import type { MarketTrend, BESSConfigurationPattern, CustomerDecisionIndicator, EmergingOpportunity, IndustryAdoptionRate, PricingUpdateRecommendation } from '@/services/marketInferenceEngine';

interface DetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'trend' | 'config' | 'indicator' | 'opportunity' | 'adoption' | 'pricing';
  data: MarketTrend | BESSConfigurationPattern | CustomerDecisionIndicator | EmergingOpportunity | IndustryAdoptionRate | PricingUpdateRecommendation;
  onEdit?: (updatedData: any) => void;
  onDelete?: () => void;
}

const MarketIntelligenceDetailModal: React.FC<DetailModalProps> = ({
  isOpen,
  onClose,
  type,
  data,
  onEdit,
  onDelete,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedData, setEditedData] = useState(data);

  // Update editedData when data prop changes
  useEffect(() => {
    if (data) {
      setEditedData(data);
    }
  }, [data]);

  if (!isOpen) return null;

  if (!data) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Error</h2>
          <p className="text-gray-600">No data available for this item.</p>
          <button
            onClick={onClose}
            className="mt-4 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  const handleSave = () => {
    if (onEdit) {
      onEdit(editedData);
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditedData(data);
    setIsEditing(false);
  };

  const renderContent = () => {
    switch (type) {
      case 'trend': {
        const trend = data as MarketTrend;
        return (
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700">Category</label>
              {isEditing ? (
              <select
                value={trend.category}
                onChange={(e) => setEditedData({ ...editedData, category: e.target.value as 'price' | 'demand' | 'technology' | 'policy' })}
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2"
              >
                <option value="price">Price</option>
                <option value="demand">Demand</option>
                <option value="technology">Technology</option>
                <option value="policy">Policy</option>
              </select>
              ) : (
                <p className="mt-1 text-gray-900 capitalize">{trend.category}</p>
              )}
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">Direction</label>
              {isEditing ? (
              <select
                value={trend.direction}
                onChange={(e) => setEditedData({ ...editedData, direction: e.target.value as 'increasing' | 'decreasing' | 'stable' | 'volatile' })}
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2"
              >
                <option value="increasing">Increasing</option>
                <option value="decreasing">Decreasing</option>
                <option value="stable">Stable</option>
                <option value="volatile">Volatile</option>
              </select>
              ) : (
                <p className="mt-1 text-gray-900 capitalize">{trend.direction}</p>
              )}
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">Magnitude</label>
              {isEditing ? (
                <input
                  type="number"
                  value={trend.magnitude}
                  onChange={(e) => setEditedData({ ...editedData, magnitude: parseFloat(e.target.value) })}
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2"
                />
              ) : (
                <p className="mt-1 text-gray-900">{trend.magnitude.toFixed(1)}%</p>
              )}
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">Confidence</label>
              {isEditing ? (
                <input
                  type="number"
                  min="0"
                  max="1"
                  step="0.01"
                  value={trend.confidence}
                  onChange={(e) => setEditedData({ ...editedData, confidence: parseFloat(e.target.value) })}
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2"
                />
              ) : (
                <p className="mt-1 text-gray-900">{(trend.confidence * 100).toFixed(0)}%</p>
              )}
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">Evidence</label>
              {isEditing ? (
                <textarea
                  value={trend.evidence.join('\n')}
                  onChange={(e) => setEditedData({ ...editedData, evidence: e.target.value.split('\n').filter(l => l.trim()) })}
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2"
                  rows={4}
                />
              ) : (
                <ul className="mt-1 list-disc list-inside space-y-1">
                  {trend.evidence.map((ev, idx) => (
                    <li key={idx} className="text-gray-700 text-sm">{ev}</li>
                  ))}
                </ul>
              )}
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">Source</label>
              <p className="mt-1 text-gray-900 text-sm">{trend.source}</p>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">Timestamp</label>
              <p className="mt-1 text-gray-600 text-sm">{new Date(trend.timestamp).toLocaleString()}</p>
            </div>
          </div>
        );
      }

      case 'config': {
        const config = data as BESSConfigurationPattern;
        return (
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700">Configuration</label>
              {isEditing ? (
                <input
                  type="text"
                  value={config.configuration}
                  onChange={(e) => setEditedData({ ...editedData, configuration: e.target.value })}
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2"
                />
              ) : (
                <p className="mt-1 text-gray-900 font-semibold">{config.configuration}</p>
              )}
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">Frequency</label>
              {isEditing ? (
                <input
                  type="number"
                  value={config.frequency}
                  onChange={(e) => setEditedData({ ...editedData, frequency: parseInt(e.target.value) })}
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2"
                />
              ) : (
                <p className="mt-1 text-gray-900">{config.frequency} instances</p>
              )}
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">Average Price</label>
              {isEditing ? (
                <input
                  type="number"
                  value={config.avgPrice}
                  onChange={(e) => setEditedData({ ...editedData, avgPrice: parseFloat(e.target.value) })}
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2"
                />
              ) : (
                <p className="mt-1 text-gray-900">${config.avgPrice.toLocaleString()}</p>
              )}
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">Industries</label>
              {isEditing ? (
                <textarea
                  value={config.industries.join(', ')}
                  onChange={(e) => setEditedData({ ...editedData, industries: e.target.value.split(',').map(s => s.trim()).filter(s => s) })}
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2"
                  rows={3}
                />
              ) : (
                <p className="mt-1 text-gray-900 text-sm">{config.industries.join(', ') || 'N/A'}</p>
              )}
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">Use Cases</label>
              {isEditing ? (
                <textarea
                  value={config.useCases.join(', ')}
                  onChange={(e) => setEditedData({ ...editedData, useCases: e.target.value.split(',').map(s => s.trim()).filter(s => s) })}
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2"
                  rows={3}
                />
              ) : (
                <p className="mt-1 text-gray-900 text-sm">{config.useCases.join(', ') || 'N/A'}</p>
              )}
            </div>
          </div>
        );
      }

      case 'indicator': {
        const indicator = data as CustomerDecisionIndicator;
        return (
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700">Indicator</label>
              {isEditing ? (
                <input
                  type="text"
                  value={indicator.indicator}
                  onChange={(e) => setEditedData({ ...editedData, indicator: e.target.value })}
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2"
                />
              ) : (
                <p className="mt-1 text-gray-900 font-semibold">{indicator.indicator}</p>
              )}
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">Frequency</label>
              {isEditing ? (
                <input
                  type="number"
                  value={indicator.frequency}
                  onChange={(e) => setEditedData({ ...editedData, frequency: parseInt(e.target.value) })}
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2"
                />
              ) : (
                <p className="mt-1 text-gray-900">{indicator.frequency} mentions</p>
              )}
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">Correlation</label>
              {isEditing ? (
                <input
                  type="number"
                  min="0"
                  max="1"
                  step="0.01"
                  value={indicator.correlation}
                  onChange={(e) => setEditedData({ ...editedData, correlation: parseFloat(e.target.value) })}
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2"
                />
              ) : (
                <p className="mt-1 text-gray-900">{(indicator.correlation * 100).toFixed(0)}%</p>
              )}
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">Industries</label>
              {isEditing ? (
                <textarea
                  value={indicator.industries.join(', ')}
                  onChange={(e) => setEditedData({ ...editedData, industries: e.target.value.split(',').map(s => s.trim()).filter(s => s) })}
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2"
                  rows={3}
                />
              ) : (
                <p className="mt-1 text-gray-900 text-sm">{indicator.industries.join(', ') || 'N/A'}</p>
              )}
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">Examples</label>
              {isEditing ? (
                <textarea
                  value={indicator.examples.join('\n')}
                  onChange={(e) => setEditedData({ ...editedData, examples: e.target.value.split('\n').filter(l => l.trim()) })}
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2"
                  rows={4}
                />
              ) : (
                <ul className="mt-1 list-disc list-inside space-y-1">
                  {indicator.examples.map((ex, idx) => (
                    <li key={idx} className="text-gray-700 text-sm">{ex}</li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        );
      }

      case 'opportunity': {
        const opportunity = data as EmergingOpportunity;
        return (
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700">Opportunity</label>
              {isEditing ? (
                <input
                  type="text"
                  value={opportunity.opportunity}
                  onChange={(e) => setEditedData({ ...editedData, opportunity: e.target.value })}
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2"
                />
              ) : (
                <p className="mt-1 text-gray-900 font-semibold">{opportunity.opportunity}</p>
              )}
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">Description</label>
              {isEditing ? (
                <textarea
                  value={opportunity.description}
                  onChange={(e) => setEditedData({ ...editedData, description: e.target.value })}
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2"
                  rows={3}
                />
              ) : (
                <p className="mt-1 text-gray-900 text-sm">{opportunity.description}</p>
              )}
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">Market Size</label>
              {isEditing ? (
              <select
                value={opportunity.marketSize}
                onChange={(e) => setEditedData({ ...editedData, marketSize: e.target.value as 'small' | 'medium' | 'large' | 'very-large' })}
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2"
              >
                <option value="small">Small</option>
                <option value="medium">Medium</option>
                <option value="large">Large</option>
                <option value="very-large">Very Large</option>
              </select>
              ) : (
                <p className="mt-1 text-gray-900 capitalize">{opportunity.marketSize}</p>
              )}
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">Growth Rate</label>
              {isEditing ? (
                <input
                  type="number"
                  value={opportunity.growthRate}
                  onChange={(e) => setEditedData({ ...editedData, growthRate: parseFloat(e.target.value) })}
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2"
                />
              ) : (
                <p className="mt-1 text-gray-900">{opportunity.growthRate.toFixed(1)}%</p>
              )}
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">Evidence</label>
              {isEditing ? (
                <textarea
                  value={opportunity.evidence.join('\n')}
                  onChange={(e) => setEditedData({ ...editedData, evidence: e.target.value.split('\n').filter(l => l.trim()) })}
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2"
                  rows={4}
                />
              ) : (
                <ul className="mt-1 list-disc list-inside space-y-1">
                  {opportunity.evidence.slice(0, 5).map((ev, idx) => (
                    <li key={idx} className="text-gray-700 text-sm">{ev}</li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        );
      }

      case 'adoption': {
        const adoption = data as IndustryAdoptionRate;
        return (
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700">Industry</label>
              {isEditing ? (
                <input
                  type="text"
                  value={adoption.industry}
                  onChange={(e) => setEditedData({ ...editedData, industry: e.target.value })}
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2"
                />
              ) : (
                <p className="mt-1 text-gray-900 font-semibold capitalize">{adoption.industry}</p>
              )}
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">Ranking</label>
              {isEditing ? (
                <input
                  type="number"
                  value={adoption.ranking}
                  onChange={(e) => setEditedData({ ...editedData, ranking: parseInt(e.target.value) })}
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2"
                />
              ) : (
                <p className="mt-1 text-gray-900">#{adoption.ranking}</p>
              )}
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">Adoption Rate</label>
              {isEditing ? (
                <input
                  type="number"
                  value={adoption.adoptionRate}
                  onChange={(e) => setEditedData({ ...editedData, adoptionRate: parseFloat(e.target.value) })}
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2"
                />
              ) : (
                <p className="mt-1 text-gray-900">{adoption.adoptionRate.toFixed(1)}%</p>
              )}
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">Growth Rate</label>
              {isEditing ? (
                <input
                  type="number"
                  value={adoption.growthRate}
                  onChange={(e) => setEditedData({ ...editedData, growthRate: parseFloat(e.target.value) })}
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2"
                />
              ) : (
                <p className="mt-1 text-gray-900">{adoption.growthRate.toFixed(1)}% YoY</p>
              )}
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">Common Configurations</label>
              {isEditing ? (
                <textarea
                  value={adoption.commonConfigurations.join(', ')}
                  onChange={(e) => setEditedData({ ...editedData, commonConfigurations: e.target.value.split(',').map(s => s.trim()).filter(s => s) })}
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2"
                  rows={3}
                />
              ) : (
                <p className="mt-1 text-gray-900 text-sm">{adoption.commonConfigurations.join(', ') || 'N/A'}</p>
              )}
            </div>
          </div>
        );
      }

      case 'pricing': {
        const pricing = data as PricingUpdateRecommendation;
        return (
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700">Component</label>
              {isEditing ? (
                <input
                  type="text"
                  value={pricing.component}
                  onChange={(e) => setEditedData({ ...editedData, component: e.target.value })}
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2"
                />
              ) : (
                <p className="mt-1 text-gray-900 font-semibold">{pricing.component}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Current Value</label>
                {isEditing ? (
                  <input
                    type="number"
                    value={pricing.currentValue}
                    onChange={(e) => setEditedData({ ...editedData, currentValue: parseFloat(e.target.value) })}
                    className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2"
                  />
                ) : (
                  <p className="mt-1 text-gray-900">${pricing.currentValue.toFixed(2)}</p>
                )}
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">Recommended Value</label>
                {isEditing ? (
                  <input
                    type="number"
                    value={pricing.recommendedValue}
                    onChange={(e) => setEditedData({ ...editedData, recommendedValue: parseFloat(e.target.value) })}
                    className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2"
                  />
                ) : (
                  <p className="mt-1 text-gray-900">${pricing.recommendedValue.toFixed(2)}</p>
                )}
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">Change</label>
              <p className="mt-1 text-gray-900">
                {pricing.changePercent > 0 ? '+' : ''}{pricing.changePercent.toFixed(1)}%
              </p>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">Reasoning</label>
              {isEditing ? (
                <textarea
                  value={pricing.reasoning}
                  onChange={(e) => setEditedData({ ...editedData, reasoning: e.target.value })}
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2"
                  rows={4}
                />
              ) : (
                <p className="mt-1 text-gray-900 text-sm">{pricing.reasoning}</p>
              )}
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">Evidence</label>
              {isEditing ? (
                <textarea
                  value={pricing.evidence.join('\n')}
                  onChange={(e) => setEditedData({ ...editedData, evidence: e.target.value.split('\n').filter(l => l.trim()) })}
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2"
                  rows={4}
                />
              ) : (
                <ul className="mt-1 list-disc list-inside space-y-1">
                  {pricing.evidence.map((ev, idx) => (
                    <li key={idx} className="text-gray-700 text-sm">{ev}</li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        );
      }

      default:
        return <div>Unknown type</div>;
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">
            {isEditing ? 'Edit ' : 'View '}
            {type.charAt(0).toUpperCase() + type.slice(1)} Details
          </h2>
          <div className="flex items-center gap-2">
            {!isEditing && onEdit && (
              <button
                onClick={() => setIsEditing(true)}
                className="p-2 text-gray-600 hover:text-purple-700 hover:bg-purple-50 rounded-lg transition-colors"
                title="Edit"
              >
                <Edit2 className="w-5 h-5" />
              </button>
            )}
            {onDelete && (
              <button
                onClick={onDelete}
                className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                title="Delete"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {renderContent()}
        </div>

        {/* Footer */}
        {isEditing && (
          <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50">
            <button
              onClick={handleCancel}
              className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-gradient-to-r from-purple-700 to-slate-600 text-white rounded-lg hover:from-purple-800 hover:to-slate-700 transition-colors flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              Save Changes
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default MarketIntelligenceDetailModal;

