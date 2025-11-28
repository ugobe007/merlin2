import React from 'react';
import { authService } from '../../services/authService';

/**
 * User Navigation Bar
 * Simple navbar component for authenticated users
 */
const UserNavbar: React.FC = () => {
  const currentUser = authService.getCurrentUser();

  const handleSignOut = async () => {
    try {
      // authService.logout(); // DEPRECATED - using Supabase auth
      window.location.reload();
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  return (
    <nav className="bg-white border-b border-gray-200 px-4 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h1 className="text-xl font-bold text-gray-900">Merlin BESS</h1>
        </div>

        {currentUser && (
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-600">
              {currentUser.email}
            </span>
            <button
              onClick={handleSignOut}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              Sign Out
            </button>
          </div>
        )}
      </div>
    </nav>
  );
};

export default UserNavbar;
