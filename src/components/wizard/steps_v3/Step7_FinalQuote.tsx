/**
 * NEW Step 7: Final Quote
 * Everything from Step 6 PLUS installers, EE contacts, financing, downloads
 */

import React, { useState } from 'react';
import { 
  Download, FileText, FileSpreadsheet, Mail, 
  Phone, MapPin, Building2, Wrench, 
  Calculator, CheckCircle, Star, ExternalLink,
  DollarSign, TrendingUp, Calendar, Sun, Wind, Zap, Car
} from 'lucide-react';
import QuoteReviewModal from '../../modals/QuoteReviewModal';
import EmailCaptureModal from '../../modals/EmailCaptureModal';
import RequestQuoteModal from '../../modals/RequestQuoteModal';
import DownloadGateModal from '../../modals/DownloadGateModal';
import { authService } from '../../../services/authService';

interface Step7Props {
  // All data from previous steps
  storageSizeMW: number;
  durationHours: number;
  energyCapacity: number;
  solarMW?: number;
  windMW?: number;
  generatorMW?: number;
  evChargerCount?: number;
  
  // Equipment breakdown
  equipmentBreakdown?: any;
  
  equipmentCost?: number;
  installationCost?: number;
  annualSavings?: number;
  paybackYears?: number;
  roi10Year?: number;
  selectedTemplate?: any;
  location?: string;
  
  // Callbacks
  onBack?: () => void;
  onDownloadPDF?: () => void;
  onDownloadExcel?: () => void;
  onDownloadWord?: () => void;
  onComplete?: () => void;
}

const Step7_FinalQuote: React.FC<Step7Props> = ({
  storageSizeMW,
  durationHours,
  energyCapacity,
  solarMW = 0,
  windMW = 0,
  generatorMW = 0,
  evChargerCount = 0,
  equipmentBreakdown,
  equipmentCost = 0,
  installationCost = 0,
  annualSavings = 0,
  paybackYears = 0,
  roi10Year = 0,
  selectedTemplate,
  location,
  onBack,
  onDownloadPDF,
  onDownloadExcel,
  onDownloadWord,
  onComplete
}) => {
  const [downloadStatus, setDownloadStatus] = useState<{[key: string]: boolean}>({});
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [showRequestQuoteModal, setShowRequestQuoteModal] = useState(false);
  const [showDownloadGate, setShowDownloadGate] = useState(false);
  const [pendingDownloadType, setPendingDownloadType] = useState<'pdf' | 'excel' | 'word' | null>(null);

  // ✅ FIX: Use equipmentBreakdown totals (same as Step6) for consistency
  // Fallback to prop values if breakdown not available
  const totalProjectCost = equipmentBreakdown?.totals?.totalProjectCost || (equipmentCost + installationCost);
  const federalTaxCredit = totalProjectCost * 0.30;
  const netCost = totalProjectCost - federalTaxCredit;

  const handleDownloadClick = (type: 'pdf' | 'excel' | 'word') => {
    setPendingDownloadType(type);
    
    // Check if user is logged in
    const isLoggedIn = authService.isAuthenticated();
    
    if (isLoggedIn) {
      // Skip modals, go straight to download
      performDownload(type);
    } else {
      // Show download gate modal for sign up
      setShowDownloadGate(true);
    }
  };

  const performDownload = async (type: 'pdf' | 'excel' | 'word') => {
    setDownloadStatus({ ...downloadStatus, [type]: true });
    
    // Call appropriate download function
    if (type === 'pdf' && onDownloadPDF) await onDownloadPDF();
    if (type === 'excel' && onDownloadExcel) await onDownloadExcel();
    if (type === 'word' && onDownloadWord) await onDownloadWord();
    
    // Reset status after animation
    setTimeout(() => {
      setDownloadStatus(prev => ({ ...prev, [type]: false }));
    }, 2000);
    
    setPendingDownloadType(null);
  };

  const handleDownloadGateProceed = () => {
    if (pendingDownloadType) {
      performDownload(pendingDownloadType);
    }
  };

  const handleReviewConfirm = () => {
    // Close review modal and show email capture
    setShowReviewModal(false);
    setShowEmailModal(true);
  };

  const handleEmailCaptureSuccess = async (userId: string) => {
    // Close email modal and proceed with download
    setShowEmailModal(false);
    
    if (pendingDownloadType) {
      setDownloadStatus({ ...downloadStatus, [pendingDownloadType]: true });
      
      // Call appropriate download function
      if (pendingDownloadType === 'pdf' && onDownloadPDF) await onDownloadPDF();
      if (pendingDownloadType === 'excel' && onDownloadExcel) await onDownloadExcel();
      if (pendingDownloadType === 'word' && onDownloadWord) await onDownloadWord();
      
      // Reset status after animation
      setTimeout(() => {
        setDownloadStatus({ ...downloadStatus, [pendingDownloadType!]: false });
      }, 2000);
    }
    
    setPendingDownloadType(null);
  };

  const handleDownload = async (type: 'pdf' | 'excel' | 'word') => {
    setDownloadStatus({ ...downloadStatus, [type]: true });
    
    // Call appropriate download function
    if (type === 'pdf' && onDownloadPDF) await onDownloadPDF();
    if (type === 'excel' && onDownloadExcel) await onDownloadExcel();
    if (type === 'word' && onDownloadWord) await onDownloadWord();
    
    // Reset status after animation
    setTimeout(() => {
      setDownloadStatus({ ...downloadStatus, [type]: false });
    }, 2000);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  // Mock installer data (would come from database in production)
  const installers = [
    {
      name: 'Tesla Energy',
      rating: 4.8,
      projects: 500,
      phone: '1-888-765-2489',
      website: 'https://tesla.com/energy',
      specialties: ['Commercial', 'Industrial', 'Utility-Scale']
    },
    {
      name: 'Fluence Energy',
      rating: 4.9,
      projects: 300,
      phone: '1-703-682-6300',
      website: 'https://fluenceenergy.com',
      specialties: ['Grid Services', 'Large-Scale Storage']
    },
    {
      name: 'Powin Energy',
      rating: 4.7,
      projects: 200,
      phone: '1-503-889-4200',
      website: 'https://powin.com',
      specialties: ['Commercial', 'C&I', 'Microgrids']
    }
  ];

  const financingOptions = [
    {
      name: 'Solar Loan',
      provider: 'Mosaic',
      rate: '5.99% APR',
      term: '20 years',
      description: 'Low-rate financing for clean energy projects',
      link: 'https://joinmosaic.com'
    },
    {
      name: 'Commercial PPA',
      provider: 'Sustainable Capital Finance',
      rate: 'No upfront cost',
      term: '15-25 years',
      description: 'Power Purchase Agreement for C&I customers',
      link: 'https://scf.com'
    },
    {
      name: 'Equipment Lease',
      provider: 'CleanCapital',
      rate: '6.5% APR',
      term: '10-15 years',
      description: 'Tax-advantaged equipment leasing',
      link: 'https://cleancapital.com'
    }
  ];

  return (
    <div className="space-y-8 pb-20">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-block mb-4">
          <div className="px-8 py-4 rounded-full text-4xl font-bold text-white bg-gradient-to-r from-green-500 to-blue-500 shadow-2xl">
            🎉 Your Complete Quote is Ready!
          </div>
        </div>
        <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-blue-600">
          Final Quote & Resources
        </h2>
        <p className="text-gray-600 mt-2">
          Everything you need to move forward with your project
        </p>
      </div>

      {/* Quick Summary Cards - 3 Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 rounded-2xl p-6 text-center">
          <DollarSign className="w-12 h-12 text-green-600 mx-auto mb-3" />
          <p className="text-3xl font-bold text-green-600">{formatCurrency(netCost)}</p>
          <p className="text-sm text-gray-600 mt-2">Net System Cost</p>
          <p className="text-xs text-gray-500">(after 30% tax credit)</p>
        </div>
        
        <div className="bg-gradient-to-br from-blue-50 to-cyan-50 border-2 border-blue-200 rounded-2xl p-6 text-center">
          <Calendar className="w-12 h-12 text-blue-600 mx-auto mb-3" />
          <p className="text-3xl font-bold text-blue-600">{Number.isFinite(paybackYears) ? paybackYears.toFixed(1) : '—'} years</p>
          <p className="text-sm text-gray-600 mt-2">Payback Period</p>
          <p className="text-xs text-gray-500">(simple payback)</p>
        </div>
        
        <div className="bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-200 rounded-2xl p-6 text-center">
          <TrendingUp className="w-12 h-12 text-purple-600 mx-auto mb-3" />
          <p className="text-3xl font-bold text-purple-600">{formatCurrency(annualSavings)}</p>
        </div>
      </div>

      {/* System Extras (if any) */}
      {(solarMW > 0 || windMW > 0 || generatorMW > 0 || evChargerCount > 0) && (
        <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-yellow-300 rounded-2xl p-6">
          <h3 className="font-bold text-gray-900 mb-4 text-xl flex items-center gap-2">
            <span className="text-2xl">✨</span>
            Your Enhanced System
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {solarMW > 0 && (
              <div className="bg-white rounded-xl p-4 text-center shadow-sm">
                <Sun className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
                <p className="text-2xl font-bold text-yellow-600">{solarMW.toFixed(1)} MW</p>
                <p className="text-xs text-gray-600">Solar Panels</p>
                <p className="text-xs text-gray-500 mt-1">{(solarMW * 1500).toFixed(0)} MWh/year</p>
              </div>
            )}
            {windMW > 0 && (
              <div className="bg-white rounded-xl p-4 text-center shadow-sm">
                <Wind className="w-8 h-8 text-blue-500 mx-auto mb-2" />
                <p className="text-2xl font-bold text-blue-600">{windMW.toFixed(1)} MW</p>
                <p className="text-xs text-gray-600">Wind Turbines</p>
                <p className="text-xs text-gray-500 mt-1">{(windMW * 2500).toFixed(0)} MWh/year</p>
              </div>
            )}
            {generatorMW > 0 && (
              <div className="bg-white rounded-xl p-4 text-center shadow-sm">
                <Zap className="w-8 h-8 text-orange-500 mx-auto mb-2" />
                <p className="text-2xl font-bold text-orange-600">{(generatorMW * 1000).toFixed(0)} kW</p>
                <p className="text-xs text-gray-600">Generator</p>
                <p className="text-xs text-gray-500 mt-1">Backup Power</p>
              </div>
            )}
            {evChargerCount > 0 && (
              <div className="bg-white rounded-xl p-4 text-center shadow-sm">
                <Car className="w-8 h-8 text-green-500 mx-auto mb-2" />
                <p className="text-2xl font-bold text-green-600">{evChargerCount}</p>
                <p className="text-xs text-gray-600">EV Chargers</p>
                <p className="text-xs text-gray-500 mt-1">{(evChargerCount * 7.2).toFixed(1)} kW</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Download Buttons */}

      {/* Download Buttons */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl p-8">
        <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
          <Download className="w-8 h-8" />
          Download Your Quote
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={() => handleDownloadClick('pdf')}
            className="bg-white hover:bg-gray-100 text-gray-900 font-semibold py-4 px-6 rounded-xl flex items-center justify-center gap-3 transition-all hover:scale-105 shadow-lg"
          >
            {downloadStatus.pdf ? (
              <>
                <CheckCircle className="w-6 h-6 text-green-500" />
                <span>Downloaded!</span>
              </>
            ) : (
              <>
                <FileText className="w-6 h-6 text-red-500" />
                <span>PDF Report</span>
              </>
            )}
          </button>
          
          <button
            onClick={() => handleDownloadClick('excel')}
            className="bg-white hover:bg-gray-100 text-gray-900 font-semibold py-4 px-6 rounded-xl flex items-center justify-center gap-3 transition-all hover:scale-105 shadow-lg"
          >
            {downloadStatus.excel ? (
              <>
                <CheckCircle className="w-6 h-6 text-green-500" />
                <span>Downloaded!</span>
              </>
            ) : (
              <>
                <FileSpreadsheet className="w-6 h-6 text-green-600" />
                <span>Excel Workbook</span>
              </>
            )}
          </button>
          
          <button
            onClick={() => handleDownloadClick('word')}
            className="bg-white hover:bg-gray-100 text-gray-900 font-semibold py-4 px-6 rounded-xl flex items-center justify-center gap-3 transition-all hover:scale-105 shadow-lg"
          >
            {downloadStatus.word ? (
              <>
                <CheckCircle className="w-6 h-6 text-green-500" />
                <span>Downloaded!</span>
              </>
            ) : (
              <>
                <FileText className="w-6 h-6 text-blue-600" />
                <span>Word Document</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Recommended Installers */}
      <div className="bg-white border-2 border-gray-200 rounded-2xl p-8">
        <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
          <Wrench className="w-8 h-8 text-blue-600" />
          Recommended Installers
        </h3>
        <div className="space-y-4">
          {installers.map((installer, index) => (
            <div key={index} className="bg-gray-50 rounded-xl p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h4 className="text-xl font-bold text-gray-900">{installer.name}</h4>
                  <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                    <span className="flex items-center gap-1">
                      <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                      {installer.rating} rating
                    </span>
                    <span>•</span>
                    <span>{installer.projects}+ projects completed</span>
                  </div>
                </div>
                <Building2 className="w-12 h-12 text-blue-500" />
              </div>
              
              <div className="flex flex-wrap gap-2 mb-4">
                {installer.specialties.map((specialty, i) => (
                  <span key={i} className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-semibold">
                    {specialty}
                  </span>
                ))}
              </div>
              
              <div className="flex items-center gap-6 text-sm">
                <a href={`tel:${installer.phone}`} className="flex items-center gap-2 text-gray-700 hover:text-blue-600">
                  <Phone className="w-4 h-4" />
                  {installer.phone}
                </a>
                <a href={installer.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-semibold">
                  Visit Website
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Financing Options */}
      <div className="bg-white border-2 border-gray-200 rounded-2xl p-8">
        <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
          <Calculator className="w-8 h-8 text-green-600" />
          Financing Options
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {financingOptions.map((option, index) => (
            <div key={index} className="bg-gradient-to-br from-green-50 to-blue-50 border-2 border-green-200 rounded-xl p-6">
              <h4 className="text-lg font-bold text-gray-900 mb-2">{option.name}</h4>
              <p className="text-sm text-gray-600 mb-4">{option.provider}</p>
              
              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Rate:</span>
                  <span className="font-semibold text-gray-900">{option.rate}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Term:</span>
                  <span className="font-semibold text-gray-900">{option.term}</span>
                </div>
              </div>
              
              <p className="text-xs text-gray-600 mb-4">{option.description}</p>
              
              <a 
                href={option.link} 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
              >
                Learn More
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          ))}
        </div>
      </div>

      {/* Electrical Engineer Contacts */}
      <div className="bg-white border-2 border-gray-200 rounded-2xl p-8">
        <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
          <Wrench className="w-8 h-8 text-purple-600" />
          Professional Engineering Support
        </h3>
        <div className="bg-purple-50 rounded-xl p-6">
          <p className="text-gray-700 mb-4">
            Need a licensed Electrical Engineer (PE) for your project? We can connect you with qualified professionals in your area.
          </p>
          <div className="flex items-center gap-4">
            <a 
              href="mailto:support@merlinbess.com?subject=EE Referral Request"
              className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
            >
              <Mail className="w-5 h-5" />
              Request EE Referral
            </a>
            <span className="text-sm text-gray-600">
              <MapPin className="w-4 h-4 inline mr-1" />
              {location || 'Nationwide coverage'}
            </span>
          </div>
        </div>
      </div>

      {/* Next Steps */}
      <div className="bg-gradient-to-r from-green-500 to-blue-500 text-white rounded-2xl p-8">
        <h3 className="text-2xl font-bold mb-6">🚀 Next Steps</h3>
        <ol className="space-y-4">
          <li className="flex items-start gap-3">
            <div className="w-8 h-8 bg-white text-green-600 rounded-full flex items-center justify-center font-bold flex-shrink-0">1</div>
            <div>
              <p className="font-semibold">Review your quote and share with stakeholders</p>
              <p className="text-sm text-blue-100">Download the PDF, Excel, or Word format</p>
            </div>
          </li>
          <li className="flex items-start gap-3">
            <div className="w-8 h-8 bg-white text-green-600 rounded-full flex items-center justify-center font-bold flex-shrink-0">2</div>
            <div>
              <p className="font-semibold">Contact 2-3 installers for detailed site assessments</p>
              <p className="text-sm text-blue-100">Get competitive bids and timeline estimates</p>
            </div>
          </li>
          <li className="flex items-start gap-3">
            <div className="w-8 h-8 bg-white text-green-600 rounded-full flex items-center justify-center font-bold flex-shrink-0">3</div>
            <div>
              <p className="font-semibold">Explore financing options that fit your budget</p>
              <p className="text-sm text-blue-100">Consider loans, leases, or PPAs</p>
            </div>
          </li>
          <li className="flex items-start gap-3">
            <div className="w-8 h-8 bg-white text-green-600 rounded-full flex items-center justify-center font-bold flex-shrink-0">4</div>
            <div>
              <p className="font-semibold">Work with a licensed PE for engineering design</p>
              <p className="text-sm text-blue-100">Required for permits and interconnection</p>
            </div>
          </li>
        </ol>
      </div>

      {/* Official Quote CTA - The Hook */}
      <div className="bg-gradient-to-r from-purple-700 via-indigo-600 to-purple-800 text-white rounded-2xl p-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2"></div>
        
        <div className="relative z-10">
          <div className="flex items-center gap-4 mb-4">
            <span className="text-5xl">🧙‍♂️</span>
            <div>
              <h3 className="text-2xl font-bold">This is Your Estimate</h3>
              <p className="text-purple-200 text-sm">Get an official, bankable quote from Merlin Energy</p>
            </div>
          </div>
          
          <p className="text-purple-100 mb-6 max-w-2xl">
            The numbers above are estimates based on current market data. For an <strong>official quote</strong> with 
            guaranteed pricing, exact equipment specifications, detailed engineering plans, and installation timeline, 
            our energy experts are ready to help.
          </p>
          
          <div className="flex flex-wrap gap-4">
            <button
              onClick={() => setShowRequestQuoteModal(true)}
              className="inline-flex items-center gap-2 px-8 py-4 bg-white text-purple-700 font-bold rounded-xl hover:bg-purple-50 transition-all shadow-lg text-lg"
            >
              📧 Request Official Quote
            </button>
            <a
              href="tel:+1-555-MERLIN1"
              className="inline-flex items-center gap-2 px-6 py-4 bg-purple-600 text-white font-semibold rounded-xl hover:bg-purple-500 transition-all border-2 border-purple-400"
            >
              📞 Call Us: (555) MERLIN-1
            </a>
          </div>
          
          <p className="text-purple-300 text-xs mt-4">
            * Official quotes include site assessment, engineering review, permitting guidance, and financing options
          </p>
        </div>
      </div>

      {/* Final CTA */}
      <div className="text-center pt-8">
        <div className="flex justify-center items-center gap-4 mb-4">
          {onBack && (
            <button
              onClick={onBack}
              className="px-6 py-3 rounded-lg font-semibold text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-all"
            >
              ← Back
            </button>
          )}
          <button
            onClick={onComplete}
            className="px-12 py-4 rounded-xl font-bold text-xl transition-all bg-gradient-to-r from-green-500 to-blue-500 text-white hover:from-green-600 hover:to-blue-600 shadow-2xl hover:shadow-3xl hover:scale-105"
          >
            Complete & Save Quote
          </button>
        </div>
        <p className="text-sm text-gray-500 mt-4">
          Your quote will be saved to your account dashboard
        </p>
      </div>

      {/* Modals */}
      <QuoteReviewModal
        isOpen={showReviewModal}
        onClose={() => setShowReviewModal(false)}
        onConfirm={handleReviewConfirm}
        storageSizeMW={storageSizeMW}
        durationHours={durationHours}
        energyCapacity={energyCapacity}
        solarMW={solarMW}
        windMW={windMW}
        generatorMW={generatorMW}
        equipmentCost={equipmentCost}
        installationCost={installationCost}
        totalProjectCost={totalProjectCost}
        federalTaxCredit={federalTaxCredit}
        netCost={netCost}
        annualSavings={annualSavings}
        paybackYears={paybackYears}
        roi10Year={roi10Year}
        location={location}
        industryName={selectedTemplate?.name}
      />

      <EmailCaptureModal
        isOpen={showEmailModal}
        onClose={() => setShowEmailModal(false)}
        onSuccess={handleEmailCaptureSuccess}
        quoteData={{
          storageSizeMW,
          totalCost: totalProjectCost,
          industryName: selectedTemplate?.name,
        }}
      />

      {/* Request Quote Modal (replaces mailto:) */}
      <RequestQuoteModal
        isOpen={showRequestQuoteModal}
        onClose={() => setShowRequestQuoteModal(false)}
        quoteData={{
          storageSizeMW,
          durationHours,
          energyCapacity,
          solarMW,
          totalCost: totalProjectCost,
          industryName: selectedTemplate?.name,
          location,
        }}
      />

      {/* Download Gate Modal (for non-logged-in users) */}
      <DownloadGateModal
        isOpen={showDownloadGate}
        onClose={() => {
          setShowDownloadGate(false);
          setPendingDownloadType(null);
        }}
        onProceedWithDownload={handleDownloadGateProceed}
        downloadType={pendingDownloadType || 'pdf'}
        quoteData={{
          storageSizeMW,
          totalCost: totalProjectCost,
          industryName: selectedTemplate?.name,
        }}
      />
    </div>
  );
};

export default Step7_FinalQuote;
