import React, { useState } from 'react';
import { X, ChevronRight, Check, Briefcase, Building2, Globe, DollarSign, Bell } from 'lucide-react';

interface AccountSetupProps {
  onClose: () => void;
  onComplete: (profileData: ProfileData) => void;
  userName: string;
  accountType: 'individual' | 'company';
  companyName?: string;
}

export type ProfileData = {
  jobTitle: string;
  companyName?: string;
  preferences: {
    defaultCurrency: string;
    defaultLocation: string;
    emailNotifications: boolean;
  };
};

export default function AccountSetup({ 
  onClose, 
  onComplete, 
  userName, 
  accountType,
  companyName 
}: AccountSetupProps) {
  const [step, setStep] = useState(1);
  const [profileData, setProfileData] = useState<ProfileData>({
    jobTitle: '',
    companyName: companyName || '',
    preferences: {
      defaultCurrency: 'USD',
      defaultLocation: 'US',
      emailNotifications: true,
    },
  });

  const totalSteps = 3;

  const handleNext = () => {
    if (step < totalSteps) {
      setStep(step + 1);
    } else {
      onComplete(profileData);
    }
  };

  const handleSkip = () => {
    onComplete(profileData);
  };

  const isStepValid = () => {
    switch (step) {
      case 1:
        return profileData.jobTitle.trim().length > 0;
      case 2:
        return true; // Company info is optional for individuals
      case 3:
        return true; // Preferences have defaults
      default:
        return false;
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full relative animate-in fade-in zoom-in duration-300">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-gray-400 hover:text-gray-600 transition-colors z-10"
        >
          <X size={24} />
        </button>

        {/* Progress Bar */}
        <div className="px-8 pt-8">
          <div className="flex items-center justify-between mb-6">
            {[1, 2, 3].map((i) => (
              <React.Fragment key={i}>
                <div className="flex flex-col items-center flex-1">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all ${
                      i < step
                        ? 'bg-green-500 text-white'
                        : i === step
                        ? 'bg-purple-600 text-white'
                        : 'bg-gray-200 text-gray-400'
                    }`}
                  >
                    {i < step ? <Check size={20} /> : i}
                  </div>
                  <div className="text-xs mt-2 font-medium text-gray-600">
                    {i === 1 && 'Profile'}
                    {i === 2 && 'Company'}
                    {i === 3 && 'Preferences'}
                  </div>
                </div>
                {i < 3 && (
                  <div
                    className={`h-1 flex-1 mx-2 mb-6 transition-all ${
                      i < step ? 'bg-green-500' : 'bg-gray-200'
                    }`}
                  />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="px-8 pb-8">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {step === 1 && 'Tell us about yourself'}
              {step === 2 && 'Company information'}
              {step === 3 && 'Set your preferences'}
            </h2>
            <p className="text-gray-600">
              {step === 1 && 'Help us personalize your experience'}
              {step === 2 && 'Add details about your organization'}
              {step === 3 && 'Choose your default settings'}
            </p>
          </div>

          {/* Step 1: Job Title */}
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Job Title <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Briefcase className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type="text"
                    required
                    value={profileData.jobTitle}
                    onChange={(e) => setProfileData({ ...profileData, jobTitle: e.target.value })}
                    className="w-full border-2 border-gray-300 rounded-xl px-4 py-3 pl-11 focus:border-purple-400 focus:outline-none text-gray-900"
                    placeholder="e.g., Energy Consultant, Project Manager"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Company Info */}
          {step === 2 && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Company Name {accountType === 'company' && <span className="text-red-500">*</span>}
                </label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type="text"
                    required={accountType === 'company'}
                    value={profileData.companyName}
                    onChange={(e) => setProfileData({ ...profileData, companyName: e.target.value })}
                    className="w-full border-2 border-gray-300 rounded-xl px-4 py-3 pl-11 focus:border-purple-400 focus:outline-none text-gray-900"
                    placeholder="Your company name"
                    disabled={accountType === 'company' && !!companyName}
                  />
                </div>
                {accountType === 'company' && companyName && (
                  <p className="text-xs text-gray-500 mt-2">
                    Set during signup. You can update this later in settings.
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Step 3: Preferences */}
          {step === 3 && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Default Currency
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                  <select
                    value={profileData.preferences.defaultCurrency}
                    onChange={(e) =>
                      setProfileData({
                        ...profileData,
                        preferences: { ...profileData.preferences, defaultCurrency: e.target.value },
                      })
                    }
                    className="w-full border-2 border-gray-300 rounded-xl px-4 py-3 pl-11 focus:border-purple-400 focus:outline-none text-gray-900"
                  >
                    <option value="USD">USD - US Dollar</option>
                    <option value="EUR">EUR - Euro</option>
                    <option value="GBP">GBP - British Pound</option>
                    <option value="JPY">JPY - Japanese Yen</option>
                    <option value="CAD">CAD - Canadian Dollar</option>
                    <option value="AUD">AUD - Australian Dollar</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Default Location
                </label>
                <div className="relative">
                  <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                  <select
                    value={profileData.preferences.defaultLocation}
                    onChange={(e) =>
                      setProfileData({
                        ...profileData,
                        preferences: { ...profileData.preferences, defaultLocation: e.target.value },
                      })
                    }
                    className="w-full border-2 border-gray-300 rounded-xl px-4 py-3 pl-11 focus:border-purple-400 focus:outline-none text-gray-900"
                  >
                    <option value="US">United States</option>
                    <option value="UK">United Kingdom</option>
                    <option value="EU">European Union</option>
                    <option value="CA">Canada</option>
                    <option value="AU">Australia</option>
                    <option value="JP">Japan</option>
                    <option value="CN">China</option>
                    <option value="IN">India</option>
                  </select>
                </div>
              </div>

              <div className="bg-gray-50 rounded-xl p-4">
                <label className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={profileData.preferences.emailNotifications}
                    onChange={(e) =>
                      setProfileData({
                        ...profileData,
                        preferences: { ...profileData.preferences, emailNotifications: e.target.checked },
                      })
                    }
                    className="w-5 h-5 text-purple-600 rounded focus:ring-purple-500"
                  />
                  <div className="ml-3">
                    <div className="flex items-center">
                      <Bell size={16} className="text-gray-600 mr-2" />
                      <span className="font-bold text-gray-900">Email Notifications</span>
                    </div>
                    <p className="text-sm text-gray-600">
                      Receive updates about quotes, team activity, and new features
                    </p>
                  </div>
                </label>
              </div>
            </div>
          )}

          {/* Buttons */}
          <div className="flex items-center justify-between mt-8">
            <button
              onClick={handleSkip}
              className="text-gray-600 hover:text-gray-800 font-medium"
            >
              Skip for now
            </button>

            <div className="flex gap-3">
              {step > 1 && (
                <button
                  onClick={() => setStep(step - 1)}
                  className="px-6 py-3 rounded-xl border-2 border-gray-300 font-bold text-gray-700 hover:border-gray-400 transition-colors"
                >
                  Back
                </button>
              )}
              <button
                onClick={handleNext}
                disabled={!isStepValid()}
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 text-white font-bold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {step < totalSteps ? (
                  <>
                    Next <ChevronRight size={20} />
                  </>
                ) : (
                  <>
                    Complete <Check size={20} />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
