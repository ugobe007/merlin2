import React, { useState, useEffect } from 'react';
import { X, User, Briefcase, MapPin, Globe, Building2, Zap, Target, Users, Lightbulb, Save, ChevronRight } from 'lucide-react';
import { authService } from '../services/authService';

interface EnhancedProfileProps {
  onClose: () => void;
  isFirstTime?: boolean; // True if coming from AccountSetup
}

type UserType = 'energy_professional' | 'vendor' | 'general_user' | '';

const EnhancedProfile: React.FC<EnhancedProfileProps> = ({ onClose, isFirstTime = false }) => {
  const [user, setUser] = useState<any>(null);
  const [saved, setSaved] = useState(false);
  
  // Profile data
  const [userType, setUserType] = useState<UserType>('');
  const [energyFocus, setEnergyFocus] = useState<string[]>([]);
  const [projectTypes, setProjectTypes] = useState<string[]>([]);
  const [partnerTypes, setPartnerTypes] = useState<string[]>([]);
  const [targetUseCases, setTargetUseCases] = useState<string[]>([]);
  const [targetCustomers, setTargetCustomers] = useState<string[]>([]);
  const [channelPartners, setChannelPartners] = useState<string[]>([]);
  const [learningGoals, setLearningGoals] = useState<string[]>([]);
  const [interestedIndustry, setInterestedIndustry] = useState<string[]>([]);

  useEffect(() => {
    const currentUser = authService.getCurrentUser();
    setUser(currentUser);
    
    // Load existing preferences
    if (currentUser?.preferences?.profileType) {
      setUserType(currentUser.preferences.profileType);
      setEnergyFocus(currentUser.preferences.energyFocus || []);
      setProjectTypes(currentUser.preferences.projectTypes || []);
      setPartnerTypes(currentUser.preferences.partnerTypes || []);
      setTargetUseCases(currentUser.preferences.targetUseCases || []);
      setTargetCustomers(currentUser.preferences.targetCustomers || []);
      setChannelPartners(currentUser.preferences.channelPartners || []);
      setLearningGoals(currentUser.preferences.learningGoals || []);
      setInterestedIndustry(currentUser.preferences.interestedIndustry || []);
    }
  }, []);

  const handleSave = async () => {
    if (!user) return;

    const profileData = {
      preferences: {
        ...user.preferences,
        profileType: userType,
        energyFocus,
        projectTypes,
        partnerTypes,
        targetUseCases,
        targetCustomers,
        channelPartners,
        learningGoals,
        interestedIndustry,
      },
    };

    await authService.updateUserProfile(user.id, profileData);
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      if (!isFirstTime) onClose();
    }, 1500);
  };

  const toggleSelection = (
    value: string,
    currentArray: string[],
    setter: React.Dispatch<React.SetStateAction<string[]>>
  ) => {
    if (currentArray.includes(value)) {
      setter(currentArray.filter((item) => item !== value));
    } else {
      setter([...currentArray, value]);
    }
  };

  const energyFocusOptions = [
    { value: 'batteries', label: 'Battery Storage (BESS)', icon: '🔋' },
    { value: 'generators', label: 'Generators', icon: '⚡' },
    { value: 'solar', label: 'Solar PV', icon: '☀️' },
    { value: 'wind', label: 'Wind Power', icon: '💨' },
    { value: 'inverters', label: 'Inverters', icon: '🔌' },
    { value: 'pcs', label: 'Power Conversion Systems (PCS)', icon: '🔄' },
    { value: 'hybrid', label: 'Hybrid Systems', icon: '🔗' },
    { value: 'microgrid', label: 'Microgrids', icon: '🌐' },
  ];

  const projectTypeOptions = [
    { value: 'data_center', label: 'Data Centers', icon: '🖥️' },
    { value: 'ev_charging', label: 'EV Charging Stations', icon: '🚗' },
    { value: 'apartments', label: 'Apartment Buildings', icon: '🏢' },
    { value: 'hospitals', label: 'Hospitals', icon: '🏥' },
    { value: 'airports', label: 'Airports', icon: '✈️' },
    { value: 'industrial', label: 'Industrial Facilities', icon: '🏭' },
    { value: 'commercial', label: 'Commercial Buildings', icon: '🏪' },
    { value: 'agriculture', label: 'Agriculture/Farms', icon: '🌾' },
    { value: 'telecom', label: 'Telecom Towers', icon: '📡' },
    { value: 'residential', label: 'Residential', icon: '🏠' },
  ];

  const partnerTypeOptions = [
    { value: 'epc', label: 'EPC Contractors', icon: '👷' },
    { value: 'architects', label: 'Architect Firms', icon: '📐' },
    { value: 'ci_firms', label: 'C&I Firms', icon: '🏗️' },
    { value: 'integrators', label: 'System Integrators', icon: '🔧' },
    { value: 'developers', label: 'Developers', icon: '🏘️' },
    { value: 'utilities', label: 'Utilities', icon: '⚡' },
    { value: 'distributors', label: 'Distributors', icon: '📦' },
  ];

  const learningGoalOptions = [
    { value: 'basics', label: 'Learn BESS Basics', icon: '📚' },
    { value: 'sizing', label: 'System Sizing', icon: '📏' },
    { value: 'economics', label: 'Project Economics', icon: '🎯' },
    { value: 'use_cases', label: 'Use Case Discovery', icon: '🔍' },
    { value: 'vendors', label: 'Vendor Comparison', icon: '⚖️' },
    { value: 'applications', label: 'My Business Applications', icon: '💡' },
  ];

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 p-6 text-white">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-3xl font-bold flex items-center gap-3">
                <User size={32} />
                {isFirstTime ? 'Complete Your Profile' : 'Enhanced Profile'}
              </h2>
              <p className="text-purple-100 mt-2">
                {isFirstTime 
                  ? 'Tell us more about yourself to personalize your Merlin experience'
                  : 'Update your profile to get better recommendations'
                }
              </p>
            </div>
            {!isFirstTime && (
              <button onClick={onClose} className="text-purple-200 hover:text-white transition-colors">
                <X size={28} />
              </button>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-8">
          <div className="space-y-8">
            {/* User Type Selection */}
            <section className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <Briefcase className="text-purple-600" size={24} />
                <h3 className="text-xl font-bold text-gray-900">I am a...</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button
                  onClick={() => setUserType('energy_professional')}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    userType === 'energy_professional'
                      ? 'border-purple-500 bg-white shadow-lg'
                      : 'border-gray-200 hover:border-purple-300'
                  }`}
                >
                  <div className="text-3xl mb-2">⚡</div>
                  <div className="font-bold text-gray-900">Energy Professional</div>
                  <div className="text-sm text-gray-600 mt-1">
                    Work in energy industry
                  </div>
                </button>

                <button
                  onClick={() => setUserType('vendor')}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    userType === 'vendor'
                      ? 'border-purple-500 bg-white shadow-lg'
                      : 'border-gray-200 hover:border-purple-300'
                  }`}
                >
                  <div className="text-3xl mb-2">🏭</div>
                  <div className="font-bold text-gray-900">Vendor/Manufacturer</div>
                  <div className="text-sm text-gray-600 mt-1">
                    Sell energy products
                  </div>
                </button>

                <button
                  onClick={() => setUserType('general_user')}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    userType === 'general_user'
                      ? 'border-purple-500 bg-white shadow-lg'
                      : 'border-gray-200 hover:border-purple-300'
                  }`}
                >
                  <div className="text-3xl mb-2">💡</div>
                  <div className="font-bold text-gray-900">Exploring BESS</div>
                  <div className="text-sm text-gray-600 mt-1">
                    Learning about energy storage
                  </div>
                </button>
              </div>
            </section>

            {/* Energy Professional Questions */}
            {userType === 'energy_professional' && (
              <>
                <section>
                  <div className="flex items-center gap-3 mb-4">
                    <Zap className="text-purple-600" size={24} />
                    <h3 className="text-xl font-bold text-gray-900">My Energy Focus Areas</h3>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {energyFocusOptions.map((option) => (
                      <button
                        key={option.value}
                        onClick={() => toggleSelection(option.value, energyFocus, setEnergyFocus)}
                        className={`p-3 rounded-xl border-2 transition-all text-left ${
                          energyFocus.includes(option.value)
                            ? 'border-purple-500 bg-purple-50'
                            : 'border-gray-200 hover:border-purple-300'
                        }`}
                      >
                        <div className="text-2xl mb-1">{option.icon}</div>
                        <div className="text-sm font-bold text-gray-900">{option.label}</div>
                      </button>
                    ))}
                  </div>
                </section>

                <section>
                  <div className="flex items-center gap-3 mb-4">
                    <Building2 className="text-purple-600" size={24} />
                    <h3 className="text-xl font-bold text-gray-900">Project Types I Work On</h3>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                    {projectTypeOptions.map((option) => (
                      <button
                        key={option.value}
                        onClick={() => toggleSelection(option.value, projectTypes, setProjectTypes)}
                        className={`p-3 rounded-xl border-2 transition-all text-center ${
                          projectTypes.includes(option.value)
                            ? 'border-purple-500 bg-purple-50'
                            : 'border-gray-200 hover:border-purple-300'
                        }`}
                      >
                        <div className="text-2xl mb-1">{option.icon}</div>
                        <div className="text-xs font-bold text-gray-900">{option.label}</div>
                      </button>
                    ))}
                  </div>
                </section>

                <section>
                  <div className="flex items-center gap-3 mb-4">
                    <Users className="text-purple-600" size={24} />
                    <h3 className="text-xl font-bold text-gray-900">I Partner With</h3>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {partnerTypeOptions.map((option) => (
                      <button
                        key={option.value}
                        onClick={() => toggleSelection(option.value, partnerTypes, setPartnerTypes)}
                        className={`p-3 rounded-xl border-2 transition-all text-left ${
                          partnerTypes.includes(option.value)
                            ? 'border-purple-500 bg-purple-50'
                            : 'border-gray-200 hover:border-purple-300'
                        }`}
                      >
                        <div className="text-2xl mb-1">{option.icon}</div>
                        <div className="text-sm font-bold text-gray-900">{option.label}</div>
                      </button>
                    ))}
                  </div>
                </section>
              </>
            )}

            {/* Vendor Questions */}
            {userType === 'vendor' && (
              <>
                <section>
                  <div className="flex items-center gap-3 mb-4">
                    <Zap className="text-purple-600" size={24} />
                    <h3 className="text-xl font-bold text-gray-900">Products/Solutions We Offer</h3>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {energyFocusOptions.map((option) => (
                      <button
                        key={option.value}
                        onClick={() => toggleSelection(option.value, energyFocus, setEnergyFocus)}
                        className={`p-3 rounded-xl border-2 transition-all text-left ${
                          energyFocus.includes(option.value)
                            ? 'border-purple-500 bg-purple-50'
                            : 'border-gray-200 hover:border-purple-300'
                        }`}
                      >
                        <div className="text-2xl mb-1">{option.icon}</div>
                        <div className="text-sm font-bold text-gray-900">{option.label}</div>
                      </button>
                    ))}
                  </div>
                </section>

                <section>
                  <div className="flex items-center gap-3 mb-4">
                    <Target className="text-purple-600" size={24} />
                    <h3 className="text-xl font-bold text-gray-900">Target Use Cases</h3>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                    {projectTypeOptions.map((option) => (
                      <button
                        key={option.value}
                        onClick={() => toggleSelection(option.value, targetUseCases, setTargetUseCases)}
                        className={`p-3 rounded-xl border-2 transition-all text-center ${
                          targetUseCases.includes(option.value)
                            ? 'border-purple-500 bg-purple-50'
                            : 'border-gray-200 hover:border-purple-300'
                        }`}
                      >
                        <div className="text-2xl mb-1">{option.icon}</div>
                        <div className="text-xs font-bold text-gray-900">{option.label}</div>
                      </button>
                    ))}
                  </div>
                </section>

                <section>
                  <div className="flex items-center gap-3 mb-4">
                    <Users className="text-purple-600" size={24} />
                    <h3 className="text-xl font-bold text-gray-900">Channel Partners</h3>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {partnerTypeOptions.map((option) => (
                      <button
                        key={option.value}
                        onClick={() => toggleSelection(option.value, channelPartners, setChannelPartners)}
                        className={`p-3 rounded-xl border-2 transition-all text-left ${
                          channelPartners.includes(option.value)
                            ? 'border-purple-500 bg-purple-50'
                            : 'border-gray-200 hover:border-purple-300'
                        }`}
                      >
                        <div className="text-2xl mb-1">{option.icon}</div>
                        <div className="text-sm font-bold text-gray-900">{option.label}</div>
                      </button>
                    ))}
                  </div>
                </section>
              </>
            )}

            {/* General User Questions */}
            {userType === 'general_user' && (
              <>
                <section>
                  <div className="flex items-center gap-3 mb-4">
                    <Lightbulb className="text-purple-600" size={24} />
                    <h3 className="text-xl font-bold text-gray-900">What I Want to Learn</h3>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {learningGoalOptions.map((option) => (
                      <button
                        key={option.value}
                        onClick={() => toggleSelection(option.value, learningGoals, setLearningGoals)}
                        className={`p-4 rounded-xl border-2 transition-all text-left ${
                          learningGoals.includes(option.value)
                            ? 'border-purple-500 bg-purple-50'
                            : 'border-gray-200 hover:border-purple-300'
                        }`}
                      >
                        <div className="text-3xl mb-2">{option.icon}</div>
                        <div className="text-sm font-bold text-gray-900">{option.label}</div>
                      </button>
                    ))}
                  </div>
                </section>

                <section>
                  <div className="flex items-center gap-3 mb-4">
                    <Building2 className="text-purple-600" size={24} />
                    <h3 className="text-xl font-bold text-gray-900">Industries I'm Interested In</h3>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                    {projectTypeOptions.map((option) => (
                      <button
                        key={option.value}
                        onClick={() => toggleSelection(option.value, interestedIndustry, setInterestedIndustry)}
                        className={`p-3 rounded-xl border-2 transition-all text-center ${
                          interestedIndustry.includes(option.value)
                            ? 'border-purple-500 bg-purple-50'
                            : 'border-gray-200 hover:border-purple-300'
                        }`}
                      >
                        <div className="text-2xl mb-1">{option.icon}</div>
                        <div className="text-xs font-bold text-gray-900">{option.label}</div>
                      </button>
                    ))}
                  </div>
                </section>

                {/* Educational Callout */}
                <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-6 border-2 border-blue-200">
                  <div className="flex items-start gap-4">
                    <div className="text-4xl">🎓</div>
                    <div>
                      <h4 className="font-bold text-gray-900 mb-2">Welcome to BESS Learning!</h4>
                      <p className="text-gray-700 text-sm mb-3">
                        Merlin helps you understand battery energy storage systems through real-world examples. 
                        Try the Smart Wizard to explore use cases relevant to your interests!
                      </p>
                      <div className="flex gap-2">
                        <span className="text-xs bg-blue-100 text-blue-700 px-3 py-1 rounded-full font-bold">
                          Interactive Tools
                        </span>
                        <span className="text-xs bg-purple-100 text-purple-700 px-3 py-1 rounded-full font-bold">
                          Real Pricing Data
                        </span>
                        <span className="text-xs bg-green-100 text-green-700 px-3 py-1 rounded-full font-bold">
                          No Experience Needed
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Empty State */}
            {!userType && (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">🎯</div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  Let's Get Started!
                </h3>
                <p className="text-gray-600">
                  Select your profile type above to personalize your Merlin experience
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 p-6 bg-gray-50">
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-600">
              {userType ? (
                <span className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  Profile type selected
                </span>
              ) : (
                <span className="text-gray-400">Select a profile type to continue</span>
              )}
            </div>
            <div className="flex gap-3">
              {!isFirstTime && (
                <button
                  onClick={onClose}
                  className="px-6 py-3 rounded-xl border-2 border-gray-300 font-bold text-gray-700 hover:border-gray-400 transition-colors"
                >
                  Cancel
                </button>
              )}
              <button
                onClick={handleSave}
                disabled={!userType}
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 text-white font-bold shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {saved ? (
                  <>
                    <span className="animate-bounce">✓</span>
                    Saved!
                  </>
                ) : (
                  <>
                    <Save size={20} />
                    {isFirstTime ? 'Continue to Merlin' : 'Save Profile'}
                    <ChevronRight size={20} />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnhancedProfile;
