import React, { useState, useEffect, useRef } from 'react';
import { X, User, Settings, Users, Mail, Building2, Copy, Check, UserCog, Shield, Camera, Globe, Linkedin, Phone, Share2, Eye, EyeOff, ExternalLink, Save } from 'lucide-react';
import { authService } from '../services/authService';
import type { User as UserType, Company, TeamMember } from '@/types';

interface EditableUserProfileProps {
  isLoggedIn: boolean;
  onClose: () => void;
  onLoginSuccess: () => void;
  onLogout: () => void;
  onShowQuoteTemplates?: () => void;
  onShowPricingPresets?: () => void;
  onShowVendorLeads?: () => void;
}

type Tab = 'profile' | 'team' | 'invites';

const EditableUserProfile: React.FC<EditableUserProfileProps> = ({ isLoggedIn, onClose, onLoginSuccess, onLogout, onShowQuoteTemplates, onShowPricingPresets, onShowVendorLeads }) => {
  const [activeTab, setActiveTab] = useState<Tab>('profile');
  const [user, setUser] = useState<UserType | null>(null);
  const [company, setCompany] = useState<Company | null>(null);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [inviteCode, setInviteCode] = useState<string>('');
  const [copiedInvite, setCopiedInvite] = useState(false);
  const [copiedProfile, setCopiedProfile] = useState(false);
  
  // Edit mode states
  const [isEditing, setIsEditing] = useState(false);
  const [editedData, setEditedData] = useState<Partial<UserType>>({});
  const [saved, setSaved] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isLoggedIn) {
      loadUserData();
    }
  }, [isLoggedIn]);

  const loadUserData = () => {
    const currentUser = authService.getCurrentUser();
    setUser(currentUser);
    setEditedData({
      bio: currentUser?.bio || '',
      companyWebsite: currentUser?.companyWebsite || '',
      linkedIn: currentUser?.linkedIn || '',
      phone: currentUser?.phone || '',
      profileVisibility: currentUser?.profileVisibility || 'private',
      profilePhoto: currentUser?.profilePhoto || ''
    });

    if (currentUser?.companyId) {
      const companyData = authService.getCompanyById(currentUser.companyId);
      setCompany(companyData);

      if (companyData) {
        const members = authService.getCompanyMembers(companyData.id);
        setTeamMembers(members);
      }
    }
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check file size (max 2MB)
      if (file.size > 2 * 1024 * 1024) {
        alert('Image size must be less than 2MB');
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setEditedData({ ...editedData, profilePhoto: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveProfile = async () => {
    if (!user) return;

    // Generate profile slug if making profile public and doesn't have one
    let updates = { ...editedData };
    if (editedData.profileVisibility === 'public' && !user.publicProfileSlug) {
      const slug = authService.generateProfileSlug(user.firstName, user.lastName);
      updates.publicProfileSlug = slug;
    }

    await authService.updateUserProfile(user.id, updates);
    setSaved(true);
    setIsEditing(false);
    setTimeout(() => {
      setSaved(false);
      loadUserData(); // Reload to get updated data
    }, 1500);
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

  const handleShareProfile = () => {
    if (!user?.publicProfileSlug) {
      alert('Please make your profile public first to enable sharing');
      return;
    }
    const profileLink = `${window.location.origin}/profile/${user.publicProfileSlug}`;
    navigator.clipboard.writeText(profileLink);
    setCopiedProfile(true);
    
    // Track share action
    authService.trackVisitor(user.publicProfileSlug, 'profile_shared_by_owner');
    
    setTimeout(() => setCopiedProfile(false), 2000);
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
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full border-4 border-purple-300 max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-6 bg-gradient-to-r from-purple-600 to-blue-600 rounded-t-xl text-white">
          <h2 className="text-3xl font-bold flex items-center">
            <User className="mr-3" />
            User Profile
          </h2>
          <button onClick={onClose} className="text-purple-200 hover:text-white transition-colors">
            <X size={28} />
          </button>
        </div>

        {/* Tabs */}
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
          {isLoggedIn && activeTab === 'profile' && (
            <div className="space-y-6">
              {/* Profile Photo & Basic Info */}
              <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-xl p-6">
                <div className="flex items-start gap-6">
                  {/* Profile Photo */}
                  <div className="relative">
                    <div className="w-32 h-32 rounded-full bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center overflow-hidden border-4 border-white shadow-lg">
                      {editedData.profilePhoto ? (
                        <img src={editedData.profilePhoto} alt="Profile" className="w-full h-full object-cover" />
                      ) : (
                        <User size={64} className="text-white" />
                      )}
                    </div>
                    {isEditing && (
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="absolute bottom-0 right-0 bg-purple-600 hover:bg-purple-700 text-white p-2 rounded-full shadow-lg transition-colors"
                      >
                        <Camera size={20} />
                      </button>
                    )}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handlePhotoUpload}
                    />
                  </div>

                  {/* Basic Info */}
                  <div className="flex-1">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-2xl font-bold text-gray-900">
                          {user?.firstName} {user?.lastName}
                        </h3>
                        <p className="text-gray-600">{user?.jobTitle || 'Energy Professional'}</p>
                        {user?.company && (
                          <div className="flex items-center gap-2 mt-1 text-gray-700">
                            <Building2 size={16} />
                            <span>{user.company}</span>
                          </div>
                        )}
                      </div>
                      <div className="flex gap-2">
                        {!isEditing ? (
                          <button
                            onClick={() => setIsEditing(true)}
                            className="px-4 py-2 bg-purple-600 text-white rounded-lg font-bold hover:bg-purple-700 transition-colors flex items-center gap-2"
                          >
                            <Settings size={16} />
                            Edit Profile
                          </button>
                        ) : (
                          <>
                            <button
                              onClick={() => {
                                setIsEditing(false);
                                loadUserData();
                              }}
                              className="px-4 py-2 border-2 border-gray-300 text-gray-700 rounded-lg font-bold hover:border-gray-400 transition-colors"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={handleSaveProfile}
                              className="px-4 py-2 bg-green-600 text-white rounded-lg font-bold hover:bg-green-700 transition-colors flex items-center gap-2"
                            >
                              {saved ? <Check size={16} /> : <Save size={16} />}
                              {saved ? 'Saved!' : 'Save'}
                            </button>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Tier Badge */}
                    <div className="inline-flex items-center gap-2 bg-white px-4 py-2 rounded-full border-2 border-purple-300">
                      <span className="text-sm text-gray-600">Plan:</span>
                      <span className="font-bold text-purple-600 uppercase">{user?.tier || 'Free'}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Actions - Quote Customization */}
              <div className="bg-gradient-to-br from-blue-50 to-purple-50 border-2 border-blue-200 rounded-xl p-6">
                <h4 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Settings size={20} className="text-blue-600" />
                  Quote Customization Preferences
                </h4>
                <p className="text-sm text-gray-600 mb-4">
                  Set up your default templates and pricing to speed up quote creation.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <button
                    onClick={() => {
                      if (onShowQuoteTemplates) {
                        onShowQuoteTemplates();
                      }
                    }}
                    className="bg-gradient-to-r from-gray-400 to-gray-500 hover:from-gray-300 hover:to-gray-400 text-white px-6 py-4 rounded-xl font-semibold shadow-lg transition-all duration-200 border border-gray-300/30 flex items-center gap-3"
                  >
                    <span className="text-2xl">📋</span>
                    <div className="text-left">
                      <div className="font-bold">Quote Templates</div>
                      <div className="text-xs opacity-90">Customize & save templates</div>
                    </div>
                  </button>

                  <button
                    onClick={() => {
                      if (onShowPricingPresets) {
                        onShowPricingPresets();
                      }
                    }}
                    className="bg-gradient-to-r from-gray-400 to-gray-500 hover:from-gray-300 hover:to-gray-400 text-white px-6 py-4 rounded-xl font-semibold shadow-lg transition-all duration-200 border border-gray-300/30 flex items-center gap-3"
                  >
                    <span className="text-2xl">🎯</span>
                    <div className="text-left">
                      <div className="font-bold">Pricing Presets</div>
                      <div className="text-xs opacity-90">Save your pricing & EPC fees</div>
                    </div>
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-4 italic">
                  💡 Once configured, your templates and pricing will auto-populate in all future quotes
                </p>
              </div>

              {/* Vendor Marketplace - Premium Feature */}
              <div className="bg-gradient-to-br from-yellow-50 via-amber-50 to-orange-50 border-2 border-orange-300 rounded-xl p-6">
                <h4 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <span className="text-2xl">🤝</span>
                  Vendor Marketplace
                </h4>
                <p className="text-sm text-gray-700 mb-4">
                  <strong>Are you a vendor?</strong> Submit competitive pricing and win qualified project leads from Merlin2 users.
                </p>
                <div className="bg-white rounded-lg p-4 mb-4 border border-orange-200">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                    <div className="flex items-start gap-2">
                      <span className="text-green-600 font-bold text-lg">✓</span>
                      <div>
                        <strong className="text-gray-900">Qualified Leads</strong>
                        <p className="text-xs text-gray-600">Real projects with budget</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-green-600 font-bold text-lg">✓</span>
                      <div>
                        <strong className="text-gray-900">Win Rate Tracking</strong>
                        <p className="text-xs text-gray-600">Analytics & insights</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-green-600 font-bold text-lg">✓</span>
                      <div>
                        <strong className="text-gray-900">Direct Connection</strong>
                        <p className="text-xs text-gray-600">No middleman fees</p>
                      </div>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => {
                    if (onShowVendorLeads) {
                      onShowVendorLeads();
                    } else {
                      alert('🤝 Vendor Marketplace\n\nSubmit your pricing to win qualified project leads!\n\nFeatures:\n• Real project opportunities\n• Direct client connections\n• Win rate analytics\n• No middleman fees\n\nSign up as a vendor to access this feature.');
                    }
                  }}
                  className="w-full bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-400 hover:to-amber-500 text-white px-6 py-4 rounded-xl font-bold shadow-lg transition-all duration-200 border border-orange-300/30 flex items-center justify-center gap-3 transform hover:scale-105"
                >
                  <span className="text-2xl">🚀</span>
                  <div className="text-left">
                    <div className="font-bold text-lg">Join Vendor Marketplace</div>
                    <div className="text-xs opacity-90">Submit pricing & win projects</div>
                  </div>
                </button>
                <p className="text-xs text-orange-700 mt-3 font-semibold text-center">
                  ⭐ Premium Feature - Available to verified vendors
                </p>
              </div>

              {/* About Me / Bio */}
              <div className="bg-white border-2 border-gray-200 rounded-xl p-6">
                <h4 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <User size={20} className="text-purple-600" />
                  About Me
                </h4>
                {isEditing ? (
                  <textarea
                    value={editedData.bio}
                    onChange={(e) => setEditedData({ ...editedData, bio: e.target.value })}
                    placeholder="Tell others about yourself, your expertise, and what you're working on..."
                    className="w-full border-2 border-gray-300 rounded-xl px-4 py-3 focus:border-purple-400 focus:outline-none text-gray-900 min-h-[120px]"
                    maxLength={500}
                  />
                ) : (
                  <p className="text-gray-700">
                    {user?.bio || 'No bio added yet. Click "Edit Profile" to add information about yourself.'}
                  </p>
                )}
                {isEditing && (
                  <div className="text-xs text-gray-500 mt-1 text-right">
                    {editedData.bio?.length || 0}/500 characters
                  </div>
                )}
              </div>

              {/* Contact Information */}
              <div className="bg-white border-2 border-gray-200 rounded-xl p-6">
                <h4 className="text-lg font-bold text-gray-900 mb-4">Contact & Links</h4>
                <div className="space-y-4">
                  {/* Email (read-only) */}
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                      <Mail size={16} className="text-purple-600" />
                      Email
                    </label>
                    <input
                      type="email"
                      value={user?.email}
                      disabled
                      className="w-full border-2 border-gray-300 rounded-xl px-4 py-3 bg-gray-50 text-gray-700"
                    />
                  </div>

                  {/* Phone */}
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                      <Phone size={16} className="text-purple-600" />
                      Phone
                    </label>
                    <input
                      type="tel"
                      value={isEditing ? editedData.phone : user?.phone || ''}
                      onChange={(e) => setEditedData({ ...editedData, phone: e.target.value })}
                      disabled={!isEditing}
                      placeholder="Optional"
                      className="w-full border-2 border-gray-300 rounded-xl px-4 py-3 focus:border-purple-400 focus:outline-none text-gray-900 disabled:bg-gray-50"
                    />
                  </div>

                  {/* Company Website */}
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                      <Globe size={16} className="text-purple-600" />
                      Company Website
                    </label>
                    {isEditing ? (
                      <input
                        type="url"
                        value={editedData.companyWebsite}
                        onChange={(e) => setEditedData({ ...editedData, companyWebsite: e.target.value })}
                        placeholder="https://yourcompany.com"
                        className="w-full border-2 border-gray-300 rounded-xl px-4 py-3 focus:border-purple-400 focus:outline-none text-gray-900"
                      />
                    ) : user?.companyWebsite ? (
                      <a
                        href={user.companyWebsite}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-purple-600 hover:text-purple-700 font-medium"
                      >
                        {user.companyWebsite}
                        <ExternalLink size={16} />
                      </a>
                    ) : (
                      <p className="text-gray-500 italic">No website added</p>
                    )}
                  </div>

                  {/* LinkedIn */}
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                      <Linkedin size={16} className="text-purple-600" />
                      LinkedIn Profile
                    </label>
                    {isEditing ? (
                      <input
                        type="url"
                        value={editedData.linkedIn}
                        onChange={(e) => setEditedData({ ...editedData, linkedIn: e.target.value })}
                        placeholder="https://linkedin.com/in/yourprofile"
                        className="w-full border-2 border-gray-300 rounded-xl px-4 py-3 focus:border-purple-400 focus:outline-none text-gray-900"
                      />
                    ) : user?.linkedIn ? (
                      <a
                        href={user.linkedIn}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-purple-600 hover:text-purple-700 font-medium"
                      >
                        {user.linkedIn}
                        <ExternalLink size={16} />
                      </a>
                    ) : (
                      <p className="text-gray-500 italic">No LinkedIn profile added</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Profile Visibility & Sharing */}
              <div className="bg-gradient-to-br from-blue-50 to-purple-50 border-2 border-blue-200 rounded-xl p-6">
                <h4 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Share2 size={20} className="text-blue-600" />
                  Profile Sharing
                </h4>
                
                {/* Visibility Toggle */}
                <div className="mb-4">
                  <label className="block text-sm font-bold text-gray-700 mb-2">Profile Visibility</label>
                  <div className="flex gap-3">
                    <button
                      onClick={() => isEditing && setEditedData({ ...editedData, profileVisibility: 'private' })}
                      disabled={!isEditing}
                      className={`flex-1 p-3 rounded-xl border-2 transition-all ${
                        editedData.profileVisibility === 'private'
                          ? 'border-purple-500 bg-purple-50'
                          : 'border-gray-300 hover:border-purple-300'
                      } ${!isEditing && 'opacity-60 cursor-not-allowed'}`}
                    >
                      <EyeOff className="mx-auto mb-1" size={24} />
                      <div className="font-bold text-sm">Private</div>
                      <div className="text-xs text-gray-600">Only you can see</div>
                    </button>
                    <button
                      onClick={() => isEditing && setEditedData({ ...editedData, profileVisibility: 'public' })}
                      disabled={!isEditing}
                      className={`flex-1 p-3 rounded-xl border-2 transition-all ${
                        editedData.profileVisibility === 'public'
                          ? 'border-purple-500 bg-purple-50'
                          : 'border-gray-300 hover:border-purple-300'
                      } ${!isEditing && 'opacity-60 cursor-not-allowed'}`}
                    >
                      <Eye className="mx-auto mb-1" size={24} />
                      <div className="font-bold text-sm">Public</div>
                      <div className="text-xs text-gray-600">Shareable link</div>
                    </button>
                  </div>
                </div>

                {/* Share Button */}
                {user?.profileVisibility === 'public' && user?.publicProfileSlug && (
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Share Your Profile</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={`${window.location.origin}/profile/${user.publicProfileSlug}`}
                        readOnly
                        className="flex-1 border-2 border-gray-300 rounded-xl px-4 py-3 bg-gray-50 text-gray-700 text-sm"
                      />
                      <button
                        onClick={handleShareProfile}
                        className="px-4 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-colors flex items-center gap-2"
                      >
                        {copiedProfile ? <Check size={20} /> : <Copy size={20} />}
                        {copiedProfile ? 'Copied!' : 'Copy'}
                      </button>
                    </div>
                    <p className="text-xs text-gray-600 mt-2">
                      📢 Share this link to attract visitors to Merlin. Non-users will see your profile and can explore the platform!
                    </p>
                  </div>
                )}

                {editedData.profileVisibility === 'private' && (
                  <div className="bg-yellow-50 border border-yellow-300 rounded-lg p-3 text-sm text-yellow-800">
                    💡 <strong>Tip:</strong> Make your profile public to share it with others and attract potential clients or collaborators!
                  </div>
                )}
              </div>

              {/* Sign Out Button */}
              <button
                onClick={onLogout}
                className="w-full bg-gradient-to-r from-red-500 to-pink-500 text-white px-6 py-4 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition-all"
              >
                Sign Out
              </button>
            </div>
          )}

          {/* Team Tab (keep existing) */}
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
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center overflow-hidden">
                          {member.profilePhoto ? (
                            <img src={member.profilePhoto} alt={member.firstName} className="w-full h-full object-cover" />
                          ) : (
                            <User size={24} className="text-white" />
                          )}
                        </div>
                        <div>
                          <div className="font-bold text-gray-900">{member.firstName} {member.lastName}</div>
                          <div className="text-sm text-gray-600">{member.email}</div>
                          {member.jobTitle && (
                            <div className="text-xs text-gray-500 mt-1">{member.jobTitle}</div>
                          )}
                        </div>
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
                  <Mail size={20} />
                  Invite Team Members
                </button>
              )}
            </div>
          )}

          {/* Invites Tab (keep existing with minor updates) */}
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

          {/* Helpful reminder for users in view mode */}
          {!isEditing && (
            <div className="bg-gradient-to-r from-purple-50 to-blue-50 border-2 border-purple-200 rounded-xl p-6 mt-6">
              <div className="flex items-start gap-4">
                <div className="text-4xl">💡</div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-gray-900 mb-2">
                    Want to update your profile?
                  </h3>
                  <p className="text-gray-700 mb-3">
                    Click the <strong className="text-purple-600">"Edit Profile"</strong> button at the top of this page to customize your photo, bio, contact information, and more.
                  </p>
                  <button
                    onClick={() => setIsEditing(true)}
                    className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-2 rounded-lg font-bold hover:shadow-lg transition-all"
                  >
                    ✏️ Edit Profile Now
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EditableUserProfile;
