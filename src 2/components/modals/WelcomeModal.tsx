import React from 'react';
import { X, UserCircle, Sparkles, Home } from 'lucide-react';

interface WelcomeModalProps {
  onClose: () => void;
  userName: string;
  onSetupProfile: () => void;
  onStartWizard: () => void;
  onGoHome: () => void;
}

export default function WelcomeModal({ 
  onClose, 
  userName, 
  onSetupProfile, 
  onStartWizard, 
  onGoHome 
}: WelcomeModalProps) {
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full relative animate-in fade-in zoom-in duration-300">
        {/* Close Button */}
        <button
          onClick={onGoHome}
          className="absolute right-4 top-4 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X size={24} />
        </button>

        {/* Content */}
        <div className="p-8 text-center">
          {/* Welcome Header */}
          <div className="mb-8">
            <div className="inline-block p-4 bg-gradient-to-br from-purple-100 to-blue-100 rounded-full mb-4">
              <Sparkles className="text-purple-600" size={48} />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              Welcome to Merlin, {userName}! 🎉
            </h2>
            <p className="text-gray-600 text-lg">
              Your account is ready. What would you like to do first?
            </p>
          </div>

          {/* Action Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {/* Complete Profile */}
            <button
              onClick={onSetupProfile}
              className="group p-6 rounded-xl border-2 border-gray-200 hover:border-purple-400 hover:shadow-lg transition-all duration-200 bg-white"
            >
              <div className="mb-4">
                <UserCircle className="mx-auto text-purple-600 group-hover:scale-110 transition-transform" size={48} />
              </div>
              <h3 className="font-bold text-gray-900 mb-2">Complete My Profile</h3>
              <p className="text-sm text-gray-600">
                Add your details and preferences
              </p>
            </button>

            {/* Smart Wizard */}
            <button
              onClick={onStartWizard}
              className="group p-6 rounded-xl border-2 border-purple-400 bg-gradient-to-br from-purple-50 to-blue-50 hover:shadow-lg transition-all duration-200"
            >
              <div className="mb-4">
                <Sparkles className="mx-auto text-purple-600 group-hover:scale-110 transition-transform" size={48} />
              </div>
              <h3 className="font-bold text-gray-900 mb-2">Start Smart Wizard</h3>
              <p className="text-sm text-gray-600">
                Create your first quote
              </p>
              <div className="mt-2">
                <span className="text-xs font-bold text-purple-600 bg-purple-100 px-2 py-1 rounded-full">
                  RECOMMENDED
                </span>
              </div>
            </button>

            {/* Go Home */}
            <button
              onClick={onGoHome}
              className="group p-6 rounded-xl border-2 border-gray-200 hover:border-purple-400 hover:shadow-lg transition-all duration-200 bg-white"
            >
              <div className="mb-4">
                <Home className="mx-auto text-purple-600 group-hover:scale-110 transition-transform" size={48} />
              </div>
              <h3 className="font-bold text-gray-900 mb-2">Go to Home</h3>
              <p className="text-sm text-gray-600">
                Start exploring Merlin
              </p>
            </button>
          </div>

          {/* Skip Option */}
          <button
            onClick={onGoHome}
            className="text-sm text-gray-500 hover:text-gray-700 underline"
          >
            Skip for now
          </button>
        </div>
      </div>
    </div>
  );
}
