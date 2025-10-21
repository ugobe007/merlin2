import React, { useState, useEffect } from 'react';
import { X, User, LogIn, UserPlus, LogOut, Settings, Users, Mail, Building2, Copy, Check, UserCog, Shield } from 'lucide-react';
import AuthModal from './AuthModal';
import { authService } from '../services/authService';

interface UserProfileProps {
  isLoggedIn: boolean;
  onClose: () => void;
  onLoginSuccess: () => void;
  onLogout: () => void;
}

type Tab = 'profile' | 'team' | 'invites';

const UserProfile: React.FC<UserProfileProps> = ({ isLoggedIn, onClose, onLoginSuccess, onLogout }) => {
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [activeTab, setActiveTab] = useState<Tab>('profile');
  const [user, setUser] = useState<any>(null);
  const [company, setCompany] = useState<any>(null);
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [inviteCode, setInviteCode] = useState<string>('');
  const [copiedInvite, setCopiedInvite] = useState(false);

  useEffect(() => {
    if (isLoggedIn) {
      loadUserData();
    }
  }, [isLoggedIn]);

  const loadUserData = () => {
    const currentUser = authService.getCurrentUser();
    setUser(currentUser);

    if (currentUser?.companyId) {
      const companyData = authService.getCompanyById(currentUser.companyId);
      setCompany(companyData);

      if (companyData) {
        const members = authService.getCompanyMembers(companyData.id);
        setTeamMembers(members);
      }
    }
  };

  const handleAuthAction = (mode: 'login' | 'signup') => {
    setAuthMode(mode);
    setShowAuthModal(true);
  };

  const handleGenerateInvite = async () => {
    if (user && company) {
      const result = await authService.inviteTeamMember(company.id, user.email);
      if (result.success && result.inviteCode) {
        setInviteCode(result.inviteCode);
      }
    }
  };

  const handleCopyInvite = () => {
    const inviteLink = `${window.location.origin}?invite=${inviteCode}`;
    navigator.clipboard.writeText(inviteLink);
    setCopiedInvite(true);
    setTimeout(() => setCopiedInvite(false), 2000);
  };

  const getRoleBadge = (role?: string) => {
    switch (role) {
      case 'owner':
        return <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full font-bold flex items-center gap-1"><Shield size={12} /> Owner</span>;
      case 'admin':
        return <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-bold flex items-center gap-1"><UserCog size={12} /> Admin</span>;
      case 'member':
        return <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full font-bold">Member</span>;
      default:
        return null;
    }
  };

  const isCompanyAccount = user?.accountType === 'company';
  const canInvite = isCompanyAccount && (user?.companyRole === 'owner' || user?.companyRole === 'admin');

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full border-4 border-purple-300 max-h-[90vh] overflow-hidden flex flex-col">
          {/* Header */}
          <div className="flex justify-between items-center p-6 bg-gradient-to-r from-purple-600 to-blue-600 rounded-t-xl text-white">
            <h2 className="text-3xl font-bold flex items-center">
              <User className="mr-3" />
              {isLoggedIn ? 'User Account' : 'Welcome to Merlin'}
            </h2>
            <button onClick={onClose} className="text-purple-200 hover:text-white transition-colors">
              <X size={28} />
            </button>
          </div>

          {/* Tabs - Only show if logged in */}
          {isLoggedIn && (
            <div className="border-b border-gray-200 bg-gray-50">
              <div className="flex">
                <button
                  onClick={() => setActiveTab('profile')}
                  className={`flex items-center gap-2 px-6 py-3 font-bold transition-colors ${
                    activeTab === 'profile'
                      ? 'border-b-4 border-purple-600 text-purple-600'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <Settings size={20} />
                  Profile
                </button>
                {isCompanyAccount && (
                  <>
                    <button
                      onClick={() => setActiveTab('team')}
                      className={`flex items-center gap-2 px-6 py-3 font-bold transition-colors ${
                        activeTab === 'team'
                          ? 'border-b-4 border-purple-600 text-purple-600'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      <Users size={20} />
                      Team
                      {company && (
                        <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full">
                          {company.seatsUsed}/{company.seatLimit}
                        </span>
                      )}
                    </button>
                    {canInvite && (
                      <button
                        onClick={() => setActiveTab('invites')}
                        className={`flex items-center gap-2 px-6 py-3 font-bold transition-colors ${
                          activeTab === 'invites'
                            ? 'border-b-4 border-purple-600 text-purple-600'
                            : 'text-gray-600 hover:text-gray-900'
                        }`}
                      >
                        <Mail size={20} />
                        Invites
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          )}

          {/* Content */}
          <div className="p-8 overflow-y-auto flex-1">
            {isLoggedIn ? (
              <>
                {/* Profile Tab */}
                {activeTab === 'profile' && (
                  <div className="space-y-6">
                    <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-xl p-6">
                      <h3 className="text-xl font-bold text-gray-900 mb-4">Account Information</h3>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">Name:</span>
                          <span className="font-bold text-gray-900">{user?.firstName} {user?.lastName}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">Email:</span>
                          <span className="font-bold text-gray-900">{user?.email}</span>
                        </div>
                        {user?.jobTitle && (
                          <div className="flex justify-between items-center">
                            <span className="text-gray-600">Job Title:</span>
                            <span className="font-bold text-gray-900">{user.jobTitle}</span>
                          </div>
                        )}
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">Account Type:</span>
                          <span className="font-bold text-gray-900 capitalize flex items-center gap-2">
                            {user?.accountType === 'company' ? <Building2 size={16} /> : <User size={16} />}
                            {user?.accountType}
                          </span>
                        </div>
                        {isCompanyAccount && company && (
                          <>
                            <div className="flex justify-between items-center">
                              <span className="text-gray-600">Company:</span>
                              <span className="font-bold text-gray-900">{company.name}</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-gray-600">Role:</span>
                              {getRoleBadge(user?.companyRole)}
                            </div>
                          </>
                        )}
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">Tier:</span>
                          <span className="font-bold text-purple-600 uppercase">{user?.tier || 'Free'}</span>
                        </div>
                      </div>
                    </div>

                    {user?.preferences && (
                      <div className="bg-gray-50 rounded-xl p-6">
                        <h3 className="text-xl font-bold text-gray-900 mb-4">Preferences</h3>
                        <div className="space-y-3">
                          <div className="flex justify-between items-center">
                            <span className="text-gray-600">Default Currency:</span>
                            <span className="font-bold text-gray-900">{user.preferences.defaultCurrency}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-gray-600">Default Location:</span>
                            <span className="font-bold text-gray-900">{user.preferences.defaultLocation}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-gray-600">Email Notifications:</span>
                            <span className="font-bold text-gray-900">{user.preferences.emailNotifications ? 'Enabled' : 'Disabled'}</span>
                          </div>
                        </div>
                      </div>
                    )}

                    <button 
                      onClick={onLogout}
                      className="w-full bg-gradient-to-r from-red-500 to-pink-500 text-white px-6 py-4 rounded-xl font-bold text-lg shadow-lg transform hover:scale-105 transition-all flex items-center justify-center"
                    >
                      <LogOut className="mr-2" />
                      Sign Out
                    </button>
                  </div>
                )}

                {/* Team Tab */}
                {activeTab === 'team' && isCompanyAccount && (
                  <div className="space-y-6">
                    <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-xl p-6">
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="text-xl font-bold text-gray-900">Team Members</h3>
                        <div className="text-sm">
                          <span className="font-bold text-purple-600">{company?.seatsUsed}</span>
                          <span className="text-gray-600"> / {company?.seatLimit} seats used</span>
                        </div>
                      </div>
                      {company && company.seatsUsed >= company.seatLimit && (
                        <div className="bg-yellow-50 border-2 border-yellow-300 rounded-xl p-4 mb-4">
                          <p className="text-sm text-yellow-800">
                            <strong>Seat limit reached.</strong> Upgrade your plan to add more team members.
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="space-y-3">
                      {teamMembers.map((member) => (
                        <div key={member.id} className="bg-white border-2 border-gray-200 rounded-xl p-4 hover:border-purple-300 transition-all">
                          <div className="flex justify-between items-center">
                            <div>
                              <div className="font-bold text-gray-900">{member.firstName} {member.lastName}</div>
                              <div className="text-sm text-gray-600">{member.email}</div>
                              {member.jobTitle && (
                                <div className="text-xs text-gray-500 mt-1">{member.jobTitle}</div>
                              )}
                            </div>
                            <div>
                              {getRoleBadge(member.companyRole)}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {canInvite && (
                      <button
                        onClick={() => setActiveTab('invites')}
                        className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-4 rounded-xl font-bold shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2"
                      >
                        <UserPlus size={20} />
                        Invite Team Members
                      </button>
                    )}
                  </div>
                )}

                {/* Invites Tab */}
                {activeTab === 'invites' && canInvite && (
                  <div className="space-y-6">
                    <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-xl p-6">
                      <h3 className="text-xl font-bold text-gray-900 mb-2">Invite Team Members</h3>
                      <p className="text-gray-600 mb-4">
                        Generate an invite code to share with your team. Invites expire after 7 days.
                      </p>

                      {!inviteCode ? (
                        <button
                          onClick={handleGenerateInvite}
                          disabled={company && company.seatsUsed >= company.seatLimit}
                          className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-4 rounded-xl font-bold shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <Mail size={20} />
                          Generate Invite Code
                        </button>
                      ) : (
                        <div className="space-y-4">
                          <div className="bg-white border-2 border-purple-300 rounded-xl p-4">
                            <label className="block text-sm font-bold text-gray-700 mb-2">Invite Code</label>
                            <div className="flex gap-2">
                              <input
                                type="text"
                                value={inviteCode}
                                readOnly
                                className="flex-1 border-2 border-gray-300 rounded-xl px-4 py-3 bg-gray-50 text-gray-900 font-mono"
                              />
                              <button
                                onClick={handleCopyInvite}
                                className="px-4 py-3 bg-purple-600 text-white rounded-xl font-bold hover:bg-purple-700 transition-colors flex items-center gap-2"
                              >
                                {copiedInvite ? <Check size={20} /> : <Copy size={20} />}
                                {copiedInvite ? 'Copied!' : 'Copy'}
                              </button>
                            </div>
                          </div>

                          <div className="bg-white border-2 border-gray-200 rounded-xl p-4">
                            <label className="block text-sm font-bold text-gray-700 mb-2">Shareable Link</label>
                            <div className="bg-gray-50 border border-gray-300 rounded-lg p-3">
                              <code className="text-sm text-purple-600 break-all">
                                {window.location.origin}?invite={inviteCode}
                              </code>
                            </div>
                            <p className="text-xs text-gray-500 mt-2">
                              Share this link with team members to join your company account.
                            </p>
                          </div>

                          <button
                            onClick={() => setInviteCode('')}
                            className="w-full border-2 border-gray-300 text-gray-700 px-6 py-3 rounded-xl font-bold hover:border-gray-400 transition-colors"
                          >
                            Generate New Code
                          </button>
                        </div>
                      )}

                      {company && company.seatsUsed >= company.seatLimit && (
                        <div className="bg-yellow-50 border-2 border-yellow-300 rounded-xl p-4 mt-4">
                          <p className="text-sm text-yellow-800">
                            <strong>No seats available.</strong> You've reached your limit of {company.seatLimit} users. Upgrade to add more team members.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="space-y-6">
                <div className="text-center">
                  <h3 className="text-2xl font-bold text-gray-800">Unlock Your Full Potential</h3>
                  <p className="text-gray-600 mt-2">Sign in or create an account to save, load, and manage your BESS quotes in a personalized portfolio.</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <button 
                    onClick={() => handleAuthAction('login')}
                    className="w-full bg-gradient-to-r from-blue-500 to-teal-500 text-white px-6 py-4 rounded-xl font-bold text-lg shadow-lg transform hover:scale-105 transition-all flex items-center justify-center"
                  >
                    <LogIn className="mr-2" />
                    Sign In
                  </button>
                  <button 
                    onClick={() => handleAuthAction('signup')}
                    className="w-full bg-gradient-to-r from-purple-500 to-indigo-500 text-white px-6 py-4 rounded-xl font-bold text-lg shadow-lg transform hover:scale-105 transition-all flex items-center justify-center"
                  >
                    <UserPlus className="mr-2" />
                    Sign Up
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {showAuthModal && (
        <AuthModal
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
          onLoginSuccess={() => {
            setShowAuthModal(false);
            onLoginSuccess();
          }}
          defaultMode={authMode}
        />
      )}
    </>
  );
};

export default UserProfile;
