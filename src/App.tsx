import { useState, useEffect } from 'react';
import BessQuoteBuilder from './components/BessQuoteBuilder';
import AdminDashboard from './components/AdminDashboard';
import MerlinAssistant from './components/MerlinAssistant';
import CarWashEnergy from './components/verticals/CarWashEnergy';
import EVChargingEnergy from './components/verticals/EVChargingEnergy';
import HotelEnergy from './components/verticals/HotelEnergy';
import StreamlinedWizard from './components/wizard/StreamlinedWizard';
import { QuoteProvider } from './contexts/QuoteContext';

// Test calculations temporarily disabled for production build
// import { testCalculations } from './utils/testCalculations';
// if (typeof window !== 'undefined') {
//   (window as any).testCalculations = testCalculations;
// }

console.log('🔍 [TRACE] App.tsx loaded');

function App() {
  console.log('🔍 [TRACE] App component rendering');
  // Check for admin access via URL parameter
  const urlParams = new URLSearchParams(window.location.search);
  const adminParam = urlParams.get('admin');
  const verticalParam = urlParams.get('vertical');
  
  // Check for path-based routing (e.g., /carwashenergy)
  const pathname = window.location.pathname;
  
  const [showAdmin, setShowAdmin] = useState(adminParam === 'true');
  const [showStreamlinedWizard, setShowStreamlinedWizard] = useState(pathname === '/wizard');
  const [activeVertical, setActiveVertical] = useState<string | null>(
    verticalParam || 
    (pathname === '/carwashenergy' ? 'carwash' : 
     pathname === '/evchargingenergy' ? 'evcharging' :
     pathname === '/hotelenergy' ? 'hotel' : null)
  );

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
        <AdminDashboard />
      </div>
    );
  }

  // White-label verticals
  // Access via ?vertical=carwash or eventually carwashenergy.com
  if (activeVertical === 'carwash') {
    return <CarWashEnergy />;
  }
  
  // Access via ?vertical=evcharging or /evchargingenergy
  if (activeVertical === 'evcharging') {
    return <EVChargingEnergy />;
  }
  
  // Access via ?vertical=hotel or /hotelenergy
  if (activeVertical === 'hotel') {
    return <HotelEnergy />;
  }
  
  // Access via /wizard - Streamlined Wizard (new UX)
  if (showStreamlinedWizard) {
    return (
      <StreamlinedWizard 
        show={true}
        onClose={() => window.location.href = '/'}
        onFinish={(data) => console.log('Quote finished:', data)}
      />
    );
  }

  return (
    <QuoteProvider>
      <div>
        <BessQuoteBuilder />
        
        {/* Merlin AI Assistant - Floating Help Widget (Upper Right) */}
        <MerlinAssistant />
        
        {/* Floating Admin Access Button - Bottom Right */}
        <button
          onClick={handleAdminAccess}
          className="fixed bottom-4 right-4 bg-purple-600 hover:bg-purple-700 text-white p-4 rounded-full shadow-xl transition-all z-40 opacity-90 hover:opacity-100 hover:scale-110 border-2 border-purple-400 animate-pulse hover:animate-none"
          title="Admin Access (Ctrl+Shift+A)"
        >
          <span className="text-xl">⚙️</span>
        </button>
      </div>
    </QuoteProvider>
  );
}

export default App;

