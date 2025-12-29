/**
 * Installer Directory Landing Modal
 * 
 * Educational landing page that explains the installation process before
 * directing users to certified installer networks.
 */

import React from 'react';
import { X, CheckCircle, Search, Shield, ExternalLink, MapPin } from 'lucide-react';

interface InstallerDirectoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  location?: string;
}

const InstallerDirectoryModal: React.FC<InstallerDirectoryModalProps> = ({
  isOpen,
  onClose,
  location = 'your area'
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[70] flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-600 to-emerald-600 text-white p-8 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="bg-white/20 p-3 rounded-2xl">
                <Shield className="w-8 h-8" />
              </div>
              <div>
                <h2 className="text-3xl font-bold">Find Certified Installers</h2>
                <p className="text-green-100 mt-1">Connect with vetted BESS installation professionals</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white transition-colors"
            >
              <X className="w-8 h-8" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-8">
          {/* Overview */}
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-6 mb-8 border-2 border-green-200">
            <h3 className="text-xl font-bold text-gray-900 mb-3">🏗️ Why Professional Installation Matters</h3>
            <p className="text-gray-700 leading-relaxed mb-3">
              Battery energy storage systems are complex electrical installations that require specialized 
              expertise. Working with certified installers ensures:
            </p>
            <ul className="space-y-2 text-gray-700">
              <li className="flex items-start gap-2">
                <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                <span><strong>Safety Compliance:</strong> Proper electrical connections and fire safety systems</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                <span><strong>Code Adherence:</strong> Meets all local building and electrical codes</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                <span><strong>Warranty Protection:</strong> Maintains manufacturer warranties</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                <span><strong>Optimal Performance:</strong> Proper commissioning for maximum efficiency</span>
              </li>
            </ul>
          </div>

          {/* What to Look For */}
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <div className="bg-white rounded-xl p-6 border-2 border-blue-200">
              <h4 className="font-bold text-lg text-gray-900 mb-3 flex items-center gap-2">
                <Shield className="w-5 h-5 text-blue-600" />
                Certifications to Verify
              </h4>
              <ul className="space-y-2 text-sm text-gray-700">
                <li className="flex items-start gap-2">
                  <span className="text-blue-600">✓</span>
                  <span><strong>Electrical Contractor License:</strong> State-issued and current</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600">✓</span>
                  <span><strong>NABCEP Certification:</strong> North American Board of Certified Energy Practitioners</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600">✓</span>
                  <span><strong>Manufacturer Training:</strong> Certified for your specific battery brand</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600">✓</span>
                  <span><strong>Insurance:</strong> General liability and workers' compensation</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600">✓</span>
                  <span><strong>References:</strong> Completed commercial BESS projects</span>
                </li>
              </ul>
            </div>

            <div className="bg-white rounded-xl p-6 border-2 border-purple-200">
              <h4 className="font-bold text-lg text-gray-900 mb-3 flex items-center gap-2">
                <Search className="w-5 h-5 text-purple-600" />
                Questions to Ask
              </h4>
              <ul className="space-y-2 text-sm text-gray-700">
                <li className="flex items-start gap-2">
                  <span className="text-purple-600">•</span>
                  <span>How many BESS projects have you completed?</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-600">•</span>
                  <span>Can you provide references for similar-sized projects?</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-600">•</span>
                  <span>What warranties do you offer on installation work?</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-600">•</span>
                  <span>Do you handle permitting and utility interconnection?</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-600">•</span>
                  <span>What is your typical timeline from contract to commissioning?</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-600">•</span>
                  <span>Do you provide ongoing maintenance services?</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Installation Process */}
          <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl p-6 mb-8 border-2 border-blue-200">
            <h3 className="text-xl font-bold text-gray-900 mb-4">📋 Typical Installation Process</h3>
            <div className="grid md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="bg-blue-600 text-white rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-2 font-bold">1</div>
                <h5 className="font-semibold text-sm mb-1">Site Assessment</h5>
                <p className="text-xs text-gray-600">Electrical capacity, space, access</p>
              </div>
              <div className="text-center">
                <div className="bg-blue-600 text-white rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-2 font-bold">2</div>
                <h5 className="font-semibold text-sm mb-1">Engineering</h5>
                <p className="text-xs text-gray-600">System design, permits, approvals</p>
              </div>
              <div className="text-center">
                <div className="bg-blue-600 text-white rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-2 font-bold">3</div>
                <h5 className="font-semibold text-sm mb-1">Installation</h5>
                <p className="text-xs text-gray-600">Equipment delivery, wiring, testing</p>
              </div>
              <div className="text-center">
                <div className="bg-blue-600 text-white rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-2 font-bold">4</div>
                <h5 className="font-semibold text-sm mb-1">Commissioning</h5>
                <p className="text-xs text-gray-600">Final testing, utility approval, training</p>
              </div>
            </div>
          </div>

          {/* Timeline & Cost Expectations */}
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <div className="bg-amber-50 rounded-xl p-6 border-2 border-amber-200">
              <h4 className="font-bold text-lg text-gray-900 mb-3">⏱️ Timeline Expectations</h4>
              <div className="space-y-2 text-sm text-gray-700">
                <p><strong>Small Systems (0.5-2 MW):</strong> 3-6 months</p>
                <p><strong>Medium Systems (2-5 MW):</strong> 6-9 months</p>
                <p><strong>Large Systems (5+ MW):</strong> 9-18 months</p>
                <p className="text-xs text-gray-600 mt-3 italic">
                  Timeline includes permitting, procurement, installation, and commissioning. 
                  Utility interconnection can add 3-6 months.
                </p>
              </div>
            </div>

            <div className="bg-green-50 rounded-xl p-6 border-2 border-green-200">
              <h4 className="font-bold text-lg text-gray-900 mb-3">💰 Installation Costs</h4>
              <div className="space-y-2 text-sm text-gray-700">
                <p><strong>Labor & Installation:</strong> 10-15% of equipment cost</p>
                <p><strong>Electrical Work:</strong> $50K-$200K+ depending on size</p>
                <p><strong>Permits & Engineering:</strong> $20K-$100K</p>
                <p className="text-xs text-gray-600 mt-3 italic">
                  Costs vary by location, site complexity, and local labor rates. 
                  Request detailed quotes from multiple installers.
                </p>
              </div>
            </div>
          </div>

          {/* Call to Action */}
          <div className="bg-gradient-to-r from-green-600 to-emerald-600 rounded-2xl p-8 text-white text-center">
            <h3 className="text-2xl font-bold mb-3">Ready to Find Installers?</h3>
            <p className="text-green-100 mb-6 max-w-2xl mx-auto">
              EnergySage maintains a network of pre-screened, certified installers specializing in 
              commercial battery storage. Get competitive quotes from qualified professionals.
            </p>
            <a
              href="https://www.energysage.com/installers/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-3 bg-white text-green-700 px-8 py-4 rounded-xl font-bold text-lg hover:bg-green-50 transition-all shadow-lg"
            >
              <MapPin className="w-6 h-6" />
              Search Installers in {location}
              <ExternalLink className="w-5 h-5" />
            </a>
            <p className="text-xs text-green-100 mt-4">
              You'll be redirected to EnergySage.com - a trusted solar and storage marketplace
            </p>
          </div>

          {/* Additional Resources */}
          <div className="mt-8 bg-gray-50 rounded-xl p-6">
            <h4 className="font-bold text-gray-900 mb-3">📚 Additional Resources</h4>
            <div className="space-y-2 text-sm">
              <a 
                href="https://www.nabcep.org/find-a-professional/"
                target="_blank"
                rel="noopener noreferrer"
                className="block text-green-600 hover:text-green-700 hover:underline"
              >
                → NABCEP: Find Certified Professionals
              </a>
              <a 
                href="https://www.seia.org/energy-storage-installer-directory"
                target="_blank"
                rel="noopener noreferrer"
                className="block text-green-600 hover:text-green-700 hover:underline"
              >
                → SEIA: Energy Storage Installer Directory
              </a>
              <a 
                href="https://www.neca-neis.org/"
                target="_blank"
                rel="noopener noreferrer"
                className="block text-green-600 hover:text-green-700 hover:underline"
              >
                → NECA: National Electrical Contractors Association
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InstallerDirectoryModal;
