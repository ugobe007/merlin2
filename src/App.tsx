import { useState } from 'react';
import BessQuoteBuilder from './components/BessQuoteBuilder';
import AdminDashboard from './components/AdminDashboard';

function App() {
  const [showAdmin, setShowAdmin] = useState(false);

  // Admin authentication with email and password
  const handleAdminAccess = () => {
    const email = prompt('Enter admin email:');
    if (!email) return;
    
    const password = prompt('Enter admin password:');
    if (!password) return;
    
    // Check admin credentials (hardcoded for now, can be moved to backend)
    if (email === 'admin@merlin.energy' && password === 'merlin2025') {
      setShowAdmin(true);
    } else {
      alert('Incorrect email or password');
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
      <BessQuoteBuilder />
    </div>
  );
}

export default App;

