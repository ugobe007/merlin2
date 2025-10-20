import React, { useState } from 'react';
import { X, User, LogIn, UserPlus, LogOut } from 'lucide-react';
import AuthModal from './AuthModal'; // We will use the proper AuthModal

interface UserProfileProps {
  isLoggedIn: boolean;
  onClose: () => void;
  onLoginSuccess: () => void;
  onLogout: () => void;
}

const UserProfile: React.FC<UserProfileProps> = ({ isLoggedIn, onClose, onLoginSuccess, onLogout }) => {
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');

  const handleAuthAction = (mode: 'login' | 'signup') => {
    setAuthMode(mode);
    setShowAuthModal(true);
  };

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full border-4 border-purple-300">
          <div className="flex justify-between items-center p-6 bg-gradient-to-r from-purple-600 to-blue-600 rounded-t-xl text-white">
            <h2 className="text-3xl font-bold flex items-center">
              <User className="mr-3" />
              {isLoggedIn ? 'User Account' : 'Welcome to Merlin'}
            </h2>
            <button onClick={onClose} className="text-purple-200 hover:text-white transition-colors">
              <X size={28} />
            </button>
          </div>

          <div className="p-8">
            {isLoggedIn ? (
              <div className="text-center">
                <p className="text-lg text-gray-700 mb-6">You are signed in. You can now save projects to your portfolio and access them anytime.</p>
                <button 
                  onClick={onLogout}
                  className="w-full bg-gradient-to-r from-red-500 to-pink-500 text-white px-6 py-4 rounded-xl font-bold text-lg shadow-lg transform hover:scale-105 transition-all flex items-center justify-center"
                >
                  <LogOut className="mr-2" />
                  Sign Out
                </button>
              </div>
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
