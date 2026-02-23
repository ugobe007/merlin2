import React from "react";
import { getSystemControlsPricingService } from "@/services/systemControlsPricingService";
import type { SystemControlsPricingConfiguration } from "@/services/systemControlsPricingService";

interface PricingSystemControlsSectionProps {
  editableSystemControls: SystemControlsPricingConfiguration;
  updateSystemControlsPrice: (type: string, itemId: string, field: string, value: any) => void;
  setEditableSystemControls: (val: SystemControlsPricingConfiguration) => void;
  setHasChanges: (val: boolean) => void;
}

export default function PricingSystemControlsSection({
  editableSystemControls,
  updateSystemControlsPrice,
  setEditableSystemControls,
  setHasChanges,
}: PricingSystemControlsSectionProps) {
  return (
    <div className="space-y-6">
      <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
        <h4 className="font-semibold text-purple-800 mb-2">📊 System Controls</h4>
        <p className="text-sm text-purple-700">
          SCADA, EMS, controllers including Deepsea DSE8610 from Eaton quote, and automation
          systems.
        </p>
      </div>

      {/* Editable Controllers */}
      <div className="bg-white border rounded-lg p-6">
        <h4 className="font-semibold mb-4">Controllers (Editable Pricing)</h4>
        <div className="grid gap-4">
          {editableSystemControls.controllers.slice(0, 3).map((controller) => (
            <div key={controller.id} className="border border-gray-200 rounded-lg p-4">
              <div className="grid md:grid-cols-4 gap-4 items-center">
                <div>
                  <h5 className="font-semibold text-gray-900">{controller.model}</h5>
                  <p className="text-sm text-gray-600">{controller.manufacturer}</p>
                  <p className="text-xs text-purple-600">{controller.type.replace("_", " ")}</p>
                </div>
                <div>
                  <label className="block text-xs text-gray-600">Application</label>
                  <p className="text-sm text-gray-700">{controller.application}</p>
                </div>
                <div>
                  <label className="block text-xs text-gray-600">Price per Unit ($)</label>
                  <input
                    type="number"
                    value={controller.pricePerUnit}
                    onChange={(e) =>
                      updateSystemControlsPrice(
                        "controllers",
                        controller.id,
                        "pricePerUnit",
                        parseInt(e.target.value)
                      )
                    }
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                  />
                </div>
                <div className="text-right">
                  <p className="font-bold text-lg text-purple-600">
                    ${controller.pricePerUnit.toLocaleString()}
                  </p>
                  <p className="text-sm text-gray-500">per unit</p>
                </div>
              </div>
              {controller.id === "deepsea-dse8610" && (
                <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded">
                  <p className="text-sm text-green-800 font-medium">✓ Featured in Eaton Quote</p>
                  <p className="text-xs text-green-700">
                    Advanced generator control with parallel operation capability
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Installation Costs */}
      <div className="bg-white border rounded-lg p-6">
        <h4 className="font-semibold mb-4">Installation & Integration Costs</h4>
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h5 className="font-medium text-gray-700 mb-3">Installation (per unit)</h5>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Controller Installation</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                  $
                </span>
                <input
                  type="number"
                  value={editableSystemControls.installationCosts.controllerInstallationPerUnit}
                  onChange={(e) => {
                    const updated = { ...editableSystemControls };
                    updated.installationCosts.controllerInstallationPerUnit = parseInt(
                      e.target.value
                    );
                    setEditableSystemControls(updated);
                    getSystemControlsPricingService().updateConfiguration(updated);
                    setHasChanges(true);
                  }}
                  className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded focus:border-blue-500"
                />
              </div>
            </div>
          </div>
          <div>
            <h5 className="font-medium text-gray-700 mb-3">Integration</h5>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Cybersecurity Setup</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                  $
                </span>
                <input
                  type="number"
                  value={editableSystemControls.integrationCosts.cybersecuritySetup}
                  onChange={(e) => {
                    const updated = { ...editableSystemControls };
                    updated.integrationCosts.cybersecuritySetup = parseInt(e.target.value);
                    setEditableSystemControls(updated);
                    getSystemControlsPricingService().updateConfiguration(updated);
                    setHasChanges(true);
                  }}
                  className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded focus:border-blue-500"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
