import { useState } from 'react';
import BessQuoteBuilder from './components/BessQuoteBuilder';
import AdminDashboard from './components/AdminDashboard';

function App() {
  const [showAdmin, setShowAdmin] = useState(false);

  // TODO: Implement admin access
  // Admin panel exists but is currently disabled. To enable:
  // 1. Implement secure backend authentication
  // 2. Add UI button/link to trigger admin access
  // 3. Call setShowAdmin(true) after successful authentication
  // 4. Admin panel UI exists below and will display when showAdmin is true

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

