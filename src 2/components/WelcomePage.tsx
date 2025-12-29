import React from 'react';

interface WelcomePageProps {
  onContinue: () => void;
  userEmail?: string;
}

const WelcomePage: React.FC<WelcomePageProps> = ({ onContinue, userEmail }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full bg-white rounded-2xl shadow-2xl p-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Welcome to Merlin BESS
          </h1>
          <p className="text-xl text-gray-600 mb-2">
            Battery Energy Storage System Quote Builder
          </p>
          {userEmail && (
            <p className="text-sm text-gray-500">
              Signed in as: {userEmail}
            </p>
          )}
        </div>

        <div className="space-y-6 mb-8">
          <div className="flex items-start space-x-4">
            <div className="flex-shrink-0 w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold">
              1
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Industry Templates</h3>
              <p className="text-gray-600">Choose from 30+ industry-specific BESS configurations</p>
            </div>
          </div>

          <div className="flex items-start space-x-4">
            <div className="flex-shrink-0 w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold">
              2
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Smart Configuration</h3>
              <p className="text-gray-600">AI-powered sizing and financial analysis</p>
            </div>
          </div>

          <div className="flex items-start space-x-4">
            <div className="flex-shrink-0 w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold">
              3
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Professional Quotes</h3>
              <p className="text-gray-600">Generate detailed quotes with NPV, IRR, and ROI analysis</p>
            </div>
          </div>
        </div>

        <button
          onClick={onContinue}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 px-6 rounded-lg transition-colors duration-200 text-lg"
        >
          Get Started
        </button>

        <p className="text-center text-sm text-gray-500 mt-6">
          Professional battery energy storage system quotes in minutes
        </p>
      </div>
    </div>
  );
};

export default WelcomePage;
