import React, { useEffect, useState } from 'react';
import { User, Building2, Globe, Linkedin, Phone, ExternalLink, Sparkles, ArrowRight } from 'lucide-react';
import { authService } from '../services/authService';

interface PublicProfileViewerProps {
  profileSlug: string;
  onSignUp: () => void;
}

const PublicProfileViewer: React.FC<PublicProfileViewerProps> = ({ profileSlug, onSignUp }) => {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPublicProfile();
  }, [profileSlug]);

  const loadPublicProfile = async () => {
    setLoading(true);
    // Track visitor
    await authService.trackVisitor(profileSlug, 'profile_view');
    
    // Load profile
    const publicProfile = await authService.getPublicProfile(profileSlug);
    setProfile(publicProfile);
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center">
        <div className="text-white text-2xl font-bold animate-pulse">Loading profile...</div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md text-center">
          <div className="text-6xl mb-4">🔍</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Profile Not Found</h2>
          <p className="text-gray-600 mb-6">
            This profile doesn't exist or is set to private.
          </p>
          <button
            onClick={onSignUp}
            className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-3 rounded-xl font-bold hover:shadow-lg transition-all"
          >
            Explore Merlin
          </button>
        </div>
      </div>
    );
  }

  const energyFocusLabels: { [key: string]: string } = {
    batteries: '🔋 Battery Storage',
    generators: '⚡ Generators',
    solar: '☀️ Solar PV',
    wind: '💨 Wind Power',
    inverters: '🔌 Inverters',
    pcs: '🔄 PCS',
    hybrid: '🔗 Hybrid Systems',
    microgrid: '🌐 Microgrids'
  };

  const projectTypeLabels: { [key: string]: string } = {
    data_center: '🖥️ Data Centers',
    ev_charging: '🚗 EV Charging',
    apartments: '🏢 Apartments',
    hospitals: '🏥 Hospitals',
    airports: '✈️ Airports',
    industrial: '🏭 Industrial',
    commercial: '🏪 Commercial',
    agriculture: '🌾 Agriculture',
    telecom: '📡 Telecom',
    residential: '🏠 Residential'
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 to-blue-600">
      {/* Header */}
      <header className="bg-white/10 backdrop-blur-lg border-b border-white/20 p-4">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Sparkles className="text-yellow-300" size={32} />
            <span className="text-2xl font-bold text-white">Merlin Energy</span>
          </div>
          <button
            onClick={onSignUp}
            className="bg-white text-purple-600 px-6 py-2 rounded-lg font-bold hover:bg-gray-100 transition-colors"
          >
            Sign Up Free
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto p-6 mt-8">
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          {/* Profile Header */}
          <div className="bg-gradient-to-r from-purple-600 to-blue-600 p-8 text-white">
            <div className="flex items-start gap-6">
              {/* Profile Photo */}
              <div className="w-32 h-32 rounded-full bg-white/20 flex items-center justify-center overflow-hidden border-4 border-white shadow-lg flex-shrink-0">
                {profile.profilePhoto ? (
                  <img src={profile.profilePhoto} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <User size={64} className="text-white" />
                )}
              </div>

              {/* Basic Info */}
              <div className="flex-1">
                <h1 className="text-4xl font-bold mb-2">
                  {profile.firstName} {profile.lastName}
                </h1>
                {profile.jobTitle && (
                  <p className="text-xl text-purple-100 mb-3">{profile.jobTitle}</p>
                )}
                {profile.company && (
                  <div className="flex items-center gap-2 text-purple-100">
                    <Building2 size={20} />
                    <span className="text-lg">{profile.company}</span>
                  </div>
                )}
                <div className="mt-4 inline-flex items-center gap-2 bg-white/20 px-4 py-2 rounded-full">
                  <span className="text-sm">Member since {new Date(profile.createdAt).getFullYear()}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Profile Content */}
          <div className="p-8 space-y-6">
            {/* About */}
            {profile.bio && (
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <User size={20} className="text-purple-600" />
                  About
                </h3>
                <p className="text-gray-700 leading-relaxed">{profile.bio}</p>
              </div>
            )}

            {/* Expertise Areas */}
            {profile.preferences?.energyFocus && profile.preferences.energyFocus.length > 0 && (
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">Focus Areas</h3>
                <div className="flex flex-wrap gap-2">
                  {profile.preferences.energyFocus.map((focus: string) => (
                    <span
                      key={focus}
                      className="px-4 py-2 bg-purple-100 text-purple-700 rounded-full font-medium text-sm"
                    >
                      {energyFocusLabels[focus] || focus}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Project Types */}
            {profile.preferences?.projectTypes && profile.preferences.projectTypes.length > 0 && (
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">Project Experience</h3>
                <div className="flex flex-wrap gap-2">
                  {profile.preferences.projectTypes.map((type: string) => (
                    <span
                      key={type}
                      className="px-4 py-2 bg-blue-100 text-blue-700 rounded-full font-medium text-sm"
                    >
                      {projectTypeLabels[type] || type}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Contact Links */}
            <div className="border-t-2 border-gray-200 pt-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Connect</h3>
              <div className="space-y-3">
                {profile.companyWebsite && (
                  <a
                    href={profile.companyWebsite}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-4 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors"
                  >
                    <Globe className="text-purple-600" size={24} />
                    <span className="font-medium text-gray-900">Visit Website</span>
                    <ExternalLink className="ml-auto text-gray-400" size={20} />
                  </a>
                )}
                {profile.linkedIn && (
                  <a
                    href={profile.linkedIn}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-4 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors"
                  >
                    <Linkedin className="text-purple-600" size={24} />
                    <span className="font-medium text-gray-900">LinkedIn Profile</span>
                    <ExternalLink className="ml-auto text-gray-400" size={20} />
                  </a>
                )}
                {profile.phone && (
                  <a
                    href={`tel:${profile.phone}`}
                    className="flex items-center gap-3 p-4 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors"
                  >
                    <Phone className="text-purple-600" size={24} />
                    <span className="font-medium text-gray-900">{profile.phone}</span>
                  </a>
                )}
              </div>
            </div>

            {/* CTA Section */}
            <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-xl p-6 border-2 border-purple-200 mt-8">
              <div className="text-center">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  Ready to Build Your Own Quotes?
                </h3>
                <p className="text-gray-600 mb-6">
                  Join {profile.firstName} and thousands of energy professionals using Merlin to create accurate BESS quotes in minutes.
                </p>
                <button
                  onClick={onSignUp}
                  className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-8 py-4 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 mx-auto"
                >
                  Start Free Trial
                  <ArrowRight size={24} />
                </button>
                <div className="flex items-center justify-center gap-4 mt-6 text-sm text-gray-600">
                  <span className="flex items-center gap-1">
                    ✓ No credit card required
                  </span>
                  <span className="flex items-center gap-1">
                    ✓ Free forever
                  </span>
                  <span className="flex items-center gap-1">
                    ✓ 5 team seats included
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Note */}
        <div className="text-center mt-8 text-white/80 text-sm">
          <p>This is a public profile shared on Merlin Energy</p>
        </div>
      </main>
    </div>
  );
};

export default PublicProfileViewer;
