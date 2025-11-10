import { useState, useEffect } from 'react';
import BessQuoteBuilder from './components/BessQuoteBuilder';
import AdminDashboard from './components/AdminDashboard';

function App() {
  // Check for admin access via URL parameter
  const urlParams = new URLSearchParams(window.location.search);
  const adminParam = urlParams.get('admin');
  
  const [showAdmin, setShowAdmin] = useState(adminParam === 'true');

  // Keyboard shortcut: Ctrl+Shift+A for admin access
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey && event.shiftKey && event.key === 'A') {
        event.preventDefault();
        handleAdminAccess();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Admin authentication with email and password
  const handleAdminAccess = () => {
    const email = prompt('Enter admin email:');
    if (!email) return;
    
    const password = prompt('Enter admin password:');
    if (!password) return;
    
    // Check admin credentials (update these credentials as needed)
    // Current: admin@merlin.energy / merlin2025
    // To change: modify the email and password values below
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
      
      {/* Floating Admin Access Button - Enhanced Visibility */}
      <button
        onClick={handleAdminAccess}
        className="fixed bottom-4 right-4 bg-purple-600 hover:bg-purple-700 text-white p-4 rounded-full shadow-xl transition-all z-40 opacity-90 hover:opacity-100 hover:scale-110 border-2 border-purple-400 animate-pulse hover:animate-none"
        title="Admin Access (Ctrl+Shift+A)"
      >
        <span className="text-xl">⚙️</span>
      </button>
    </div>
  );
}

export default App;

