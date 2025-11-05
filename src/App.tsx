import { useState } from 'react';
import BessQuoteBuilder from './components/BessQuoteBuilder';
import AdminDashboard from './components/AdminDashboard';

function App() {
  const [showAdmin, setShowAdmin] = useState(false);

  // Admin authentication with email and password
  // Commented out for now - can be enabled when admin access button is added
  // TODO: Implement proper admin authentication with backend validation
  // const handleAdminAccess = () => {
  //   const email = prompt('Enter admin email:');
  //   if (!email) return;
  //   
  //   const password = prompt('Enter admin password:');
  //   if (!password) return;
  //   
  //   // Check admin credentials (credentials should be validated via secure backend API)
  //   // Validate credentials via API call
  //   if (/* API validation success */) {
  //     setShowAdmin(true);
  //   } else {
  //     alert('Incorrect email or password');
  //   }
  // };

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

