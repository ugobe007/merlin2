import { useState } from 'react';
import BessQuoteBuilder from './components/BessQuoteBuilder';
import AdminDashboard from './components/AdminDashboard';

function App() {
  const [showAdmin, setShowAdmin] = useState(false);

  // Simple admin toggle for now (will be replaced with proper auth)
  const handleAdminAccess = () => {
    const password = prompt('Enter admin password:');
    if (password === 'merlin2025') {
      setShowAdmin(true);
    } else {
      alert('Incorrect password');
    }
  };

  if (showAdmin) {
    return (
      <div>
        <button
          onClick={() => setShowAdmin(false)}
          className="fixed top-4 right-4 z-50 bg-red-600 hover:bg-red-500 text-white px-4 py-2 rounded-lg font-semibold shadow-lg transition-all"
        >
          Exit Admin Panel
        </button>
        <AdminDashboard />
      </div>
    );
  }

  return (
    <div>
      {/* Admin Access Button - Fixed in top right */}
      <button
        onClick={handleAdminAccess}
        className="fixed top-4 right-4 z-50 bg-purple-600 hover:bg-purple-500 text-white px-4 py-2 rounded-lg font-semibold shadow-lg transition-all flex items-center gap-2"
      >
        <span>🧙‍♂️</span>
        Admin
      </button>
      
      <BessQuoteBuilder />
    </div>
  );
}

export default App;

