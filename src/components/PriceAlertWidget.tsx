/**
 * Energy Price Alerts Component
 * Displays real-time pricing alerts from news articles and industry deals
 */

import React, { useEffect, useState } from "react";
import {
  DollarSign,
  TrendingDown,
  TrendingUp,
  Minus,
  AlertCircle,
  CheckCircle,
  Info,
  Sparkles,
} from "lucide-react";
import {
  getRecentPriceAlerts,
  getExcellentDeals,
  type EnergyPriceAlert,
} from "../services/priceAlertService";

interface PriceAlertWidgetProps {
  maxAlerts?: number;
  showExcellentDealsOnly?: boolean;
  autoRefresh?: boolean;
  refreshInterval?: number; // milliseconds
}

export const PriceAlertWidget: React.FC<PriceAlertWidgetProps> = ({
  maxAlerts = 5,
  showExcellentDealsOnly = false,
  autoRefresh = true,
  refreshInterval = 300000, // 5 minutes
}) => {
  const [alerts, setAlerts] = useState<EnergyPriceAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  const fetchAlerts = async () => {
    setLoading(true);
    try {
      const data = showExcellentDealsOnly
        ? await getExcellentDeals(maxAlerts)
        : await getRecentPriceAlerts(maxAlerts);

      setAlerts(data);
      setLastUpdated(new Date());
    } catch (error) {
      console.error("Error fetching price alerts:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();

    if (autoRefresh) {
      const interval = setInterval(fetchAlerts, refreshInterval);
      return () => clearInterval(interval);
    }
    return undefined;
  }, [maxAlerts, showExcellentDealsOnly, autoRefresh, refreshInterval]);

  const getAlertLevelIcon = (level: string) => {
    switch (level) {
      case "excellent_deal":
        return <Sparkles className="w-4 h-4 text-green-600" />;
      case "good_deal":
        return <CheckCircle className="w-4 h-4 text-blue-600" />;
      case "warning":
        return <AlertCircle className="w-4 h-4 text-yellow-600" />;
      case "critical":
        return <AlertCircle className="w-4 h-4 text-red-600" />;
      default:
        return <Info className="w-4 h-4 text-gray-600" />;
    }
  };

  const getAlertLevelColor = (level: string) => {
    switch (level) {
      case "excellent_deal":
        return "bg-green-50 border-green-200";
      case "good_deal":
        return "bg-blue-50 border-blue-200";
      case "warning":
        return "bg-yellow-50 border-yellow-200";
      case "critical":
        return "bg-red-50 border-red-200";
      default:
        return "bg-gray-50 border-gray-200";
    }
  };

  const getTrendIcon = (trend?: string) => {
    switch (trend) {
      case "declining":
        return <TrendingDown className="w-4 h-4 text-green-600" />;
      case "rising":
        return <TrendingUp className="w-4 h-4 text-red-600" />;
      default:
        return <Minus className="w-4 h-4 text-gray-600" />;
    }
  };

  const formatPrice = (value: number, unit: string) => {
    if (unit === "mwh") {
      return `$${(value / 1000).toFixed(0)}k/MWh`;
    }
    return `$${value.toFixed(2)}/${unit.toUpperCase()}`;
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "Recently";
    const date = new Date(dateString);
    const daysAgo = Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24));

    if (daysAgo === 0) return "Today";
    if (daysAgo === 1) return "Yesterday";
    if (daysAgo < 7) return `${daysAgo} days ago`;
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  if (loading && alerts.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center space-x-3 mb-4">
          <DollarSign className="w-6 h-6 text-emerald-600" />
          <h3 className="text-lg font-semibold text-gray-900">Energy Price Alerts</h3>
        </div>
        <div className="animate-pulse space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 bg-gray-100 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <DollarSign className="w-6 h-6 text-emerald-600" />
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                {showExcellentDealsOnly ? "Excellent Deals" : "Energy Price Alerts"}
              </h3>
              <p className="text-xs text-gray-500">
                Updated{" "}
                {lastUpdated.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
              </p>
            </div>
          </div>
          <button
            onClick={fetchAlerts}
            className="px-3 py-1 text-xs font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded transition-colors"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Alerts List */}
      <div className="divide-y divide-gray-100">
        {alerts.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            <Info className="w-8 h-8 mx-auto mb-2 text-gray-400" />
            <p>No price alerts available</p>
            <p className="text-xs mt-1">Check back soon for the latest deals</p>
          </div>
        ) : (
          alerts.map((alert, index) => (
            <div
              key={alert.id || index}
              className={`p-4 hover:bg-gray-50 transition-colors ${getAlertLevelColor(alert.alertLevel)} border-l-4`}
            >
              {/* Alert Header */}
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center space-x-2 flex-1">
                  {getAlertLevelIcon(alert.alertLevel)}
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-semibold text-gray-900 truncate">
                      {alert.sourceTitle}
                    </h4>
                    <div className="flex items-center space-x-2 mt-1 text-xs text-gray-500">
                      <span>{alert.sourcePublisher || "Industry News"}</span>
                      <span>•</span>
                      <span>{formatDate(alert.publishDate)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Pricing Details */}
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-4">
                  <div>
                    <div className="text-2xl font-bold text-gray-900">
                      {formatPrice(alert.priceValue, alert.priceUnit)}
                    </div>
                    {alert.priceDifferencePercent !== undefined && (
                      <div
                        className={`flex items-center space-x-1 text-xs font-medium ${
                          alert.priceDifferencePercent < 0 ? "text-green-600" : "text-red-600"
                        }`}
                      >
                        {getTrendIcon(alert.priceTrend)}
                        <span>
                          {Math.abs(alert.priceDifferencePercent).toFixed(1)}% vs baseline
                        </span>
                      </div>
                    )}
                  </div>

                  {alert.projectSizeMw && (
                    <div className="px-3 py-1 bg-white rounded border border-gray-200">
                      <div className="text-xs text-gray-500">Project Size</div>
                      <div className="text-sm font-semibold text-gray-900">
                        {alert.projectSizeMw} MW
                      </div>
                    </div>
                  )}
                </div>

                {alert.relevanceScore && (
                  <div className="text-right">
                    <div className="text-xs text-gray-500">Relevance</div>
                    <div className="text-sm font-semibold text-gray-900">
                      {alert.relevanceScore}/100
                    </div>
                  </div>
                )}
              </div>

              {/* Deal Summary */}
              {alert.dealSummary && (
                <p className="text-sm text-gray-700 mb-2 line-clamp-2">{alert.dealSummary}</p>
              )}

              {/* Tags */}
              <div className="flex flex-wrap gap-2 mb-2">
                {alert.vendorCompany && (
                  <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded">
                    {alert.vendorCompany}
                  </span>
                )}
                {alert.projectLocation && (
                  <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded">
                    {alert.projectLocation}
                  </span>
                )}
                {alert.technologyType && (
                  <span className="px-2 py-1 text-xs font-medium bg-purple-100 text-purple-800 rounded uppercase">
                    {alert.technologyType}
                  </span>
                )}
                {alert.industrySector && (
                  <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded capitalize">
                    {alert.industrySector}
                  </span>
                )}
              </div>

              {/* Market Impact */}
              {alert.marketImpact && (
                <div className="mt-2 p-2 bg-white/50 rounded border border-gray-200">
                  <p className="text-xs text-gray-600">
                    <span className="font-semibold">Market Impact:</span> {alert.marketImpact}
                  </p>
                </div>
              )}

              {/* Link */}
              {alert.sourceUrl && (
                <a
                  href={alert.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center mt-2 text-xs font-medium text-emerald-600 hover:text-emerald-700"
                >
                  Read full article →
                </a>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

// Compact version for dashboards
export const PriceAlertTicker: React.FC<{ maxAlerts?: number }> = ({ maxAlerts = 3 }) => {
  const [alerts, setAlerts] = useState<EnergyPriceAlert[]>([]);

  useEffect(() => {
    const fetchAlerts = async () => {
      const data = await getExcellentDeals(maxAlerts);
      setAlerts(data);
    };
    fetchAlerts();
    const interval = setInterval(fetchAlerts, 300000); // 5 minutes
    return () => clearInterval(interval);
  }, [maxAlerts]);

  if (alerts.length === 0) return null;

  return (
    <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200 p-4">
      <div className="flex items-center space-x-2 mb-3">
        <Sparkles className="w-5 h-5 text-green-600" />
        <h4 className="font-semibold text-gray-900">Latest Excellent Deals</h4>
      </div>
      <div className="space-y-2">
        {alerts.map((alert, index) => (
          <div key={alert.id || index} className="flex items-center justify-between text-sm">
            <div className="flex-1 min-w-0">
              <div className="font-medium text-gray-900 truncate">
                {alert.vendorCompany || "Unknown"}
              </div>
              <div className="text-xs text-gray-600">{alert.projectLocation || "Location TBD"}</div>
            </div>
            <div className="text-right ml-4">
              <div className="font-bold text-green-600">
                ${alert.priceValue.toFixed(0)}/{alert.priceUnit.toUpperCase()}
              </div>
              <div className="text-xs text-gray-500">
                {alert.priceDifferencePercent &&
                  `${Math.abs(alert.priceDifferencePercent).toFixed(0)}% below`}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PriceAlertWidget;
