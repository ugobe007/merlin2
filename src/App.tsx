import { useState, useEffect } from 'react';
import BessQuoteBuilder from './components/BessQuoteBuilder';
import AdminDashboard from './components/AdminDashboard';
import VendorPortal from './components/VendorPortal';
import MerlinAssistant from './components/MerlinAssistant';
import CarWashEnergy from './components/verticals/CarWashEnergy';
import EVChargingEnergy from './components/verticals/EVChargingEnergy';
import HotelEnergy from './components/verticals/HotelEnergy';
import StreamlinedWizard from './components/wizard/StreamlinedWizard';
import AdvancedQuoteBuilderLanding from './components/wizard/AdvancedQuoteBuilderLanding';
import AdvancedQuoteBuilder from './components/AdvancedQuoteBuilder';
import { QuoteProvider } from './contexts/QuoteContext';

// Test calculations temporarily disabled for production build
// import { testCalculations } from './utils/testCalculations';
// if (typeof window !== 'undefined') {
//   (window as any).testCalculations = testCalculations;
// }

function App() {
  // Check for admin access via URL parameter
  const urlParams = new URLSearchParams(window.location.search);
  const adminParam = urlParams.get('admin');
  const verticalParam = urlParams.get('vertical');
  const advancedParam = urlParams.get('advanced');
  
  // Check for path-based routing (e.g., /carwashenergy)
  const pathname = window.location.pathname;
  
  // Route detection for admin and vendor portal
  const isAdminRoute = pathname === '/admin' || adminParam === 'true';
  const isVendorPortalRoute = pathname === '/vendor-portal' || pathname === '/vendor';
  
  const [showAdmin, setShowAdmin] = useState(isAdminRoute);
  const [showVendorPortal, setShowVendorPortal] = useState(isVendorPortalRoute);
  const [showStreamlinedWizard, setShowStreamlinedWizard] = useState(pathname === '/wizard');
  
  // NEW: Direct /quote-builder route support
  // This enables verticals to redirect to Advanced Quote Builder directly
  const [showAdvancedQuoteBuilder, setShowAdvancedQuoteBuilder] = useState(
    pathname === '/quote-builder' || advancedParam === 'true'
  );
  
  // If advanced=true is set, don't activate vertical (let BessQuoteBuilder handle it)
  const [activeVertical, setActiveVertical] = useState<string | null>(
    advancedParam === 'true' ? null : (
      verticalParam || 
      (pathname === '/carwashenergy' || pathname === '/car-wash' ? 'carwash' : 
       pathname === '/evchargingenergy' || pathname === '/ev-charging' ? 'evcharging' :
       pathname === '/hotelenergy' || pathname === '/hotel' ? 'hotel' : null)
    )
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

  // Access via /vendor-portal or /vendor - Vendor Portal
  if (showVendorPortal) {
    return <VendorPortal />;
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
  // Use URL hash to force remount when navigating back to wizard
  if (showStreamlinedWizard) {
    return (
      <StreamlinedWizard 
        key="wizard-fresh" // Stable key - reset handled in component
        show={true}
        onClose={() => window.location.href = '/'}
        onFinish={() => {}}
        onOpenAdvanced={() => window.location.href = '/quote-builder'}
      />
    );
  }

  // Access via /quote-builder - Advanced Quote Builder with upload capability
  // This is the professional tool with spec upload, custom config, AI optimization
  // BUG FIX: If view=custom-config is set, skip landing and go to BessQuoteBuilder
  const viewParam = urlParams.get('view');
  if (showAdvancedQuoteBuilder && viewParam !== 'custom-config') {
    const sourceVertical = urlParams.get('vertical') || verticalParam;
    return (
      <QuoteProvider>
        <AdvancedQuoteBuilderLanding
          onBackToHome={() => {
            // If came from a vertical, go back there
            if (sourceVertical === 'car-wash') {
              window.location.href = '/carwashenergy';
            } else if (sourceVertical === 'ev-charging') {
              window.location.href = '/evchargingenergy';
            } else if (sourceVertical === 'hotel') {
              window.location.href = '/hotelenergy';
            } else {
              window.location.href = '/';
            }
          }}
          onStartCustomQuote={() => {
            // Navigate to main Merlin with advanced builder open
            window.location.href = '/?advanced=true&view=custom-config';
          }}
          onShowSmartWizard={() => {
            window.location.href = '/wizard';
          }}
          onExtractedSpecs={(specs) => {
            // Store specs in session storage and redirect to advanced builder
            sessionStorage.setItem('extractedSpecs', JSON.stringify(specs));
            window.location.href = '/?advanced=true&view=custom-config&fromUpload=true';
          }}
        />
      </QuoteProvider>
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

