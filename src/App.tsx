import { useState } from 'react';
import BessQuoteBuilder from './components/BessQuoteBuilder';
import AdminDashboard from './components/AdminDashboard';

function App() {
  const [showAdmin, setShowAdmin] = useState(false);

  // TODO: Implement admin access functionality
  // The AdminDashboard component exists but access is currently disabled.
  // When implementing admin access:
  // 1. Implement secure backend authentication API
  // 2. Add UI button/link to trigger admin access
  // 3. Call setShowAdmin(true) after successful authentication
  // 4. Consider if showAdmin state is still needed or if routing should be used instead

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

