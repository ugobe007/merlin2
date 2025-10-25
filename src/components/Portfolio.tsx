import { useState, useEffect } from 'react';

interface PortfolioQuote {
  id: string;
  user_id?: string;
  project_name: string;
  inputs: any;
  assumptions: any;
  outputs: any;
  tags?: string;
  notes?: string;
  is_favorite: boolean;
  created_at: string;
  updated_at: string;
}

interface PortfolioProps {
  onClose: () => void;
  onLoadQuote: (quote: PortfolioQuote) => void;
}

export default function Portfolio({ onClose, onLoadQuote }: PortfolioProps) {
  const [quotes, setQuotes] = useState<PortfolioQuote[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedQuote, setSelectedQuote] = useState<PortfolioQuote | null>(null);

  useEffect(() => {
    fetchQuotes();
    
    // Listen for portfolio refresh events
    const handlePortfolioRefresh = () => {
      console.log('Portfolio refresh event received');
      fetchQuotes();
    };
    
    window.addEventListener('portfolio-refresh', handlePortfolioRefresh);
    
    return () => {
      window.removeEventListener('portfolio-refresh', handlePortfolioRefresh);
    };
  }, []);

  const fetchQuotes = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('auth_token');
      
      if (!token) {
        setError('Please sign in to view your portfolio');
        setLoading(false);
        return;
      }

      // Load quotes from localStorage
      const savedQuotes = localStorage.getItem('merlin_quotes');
      if (savedQuotes) {
        const allQuotes = JSON.parse(savedQuotes);
        // Filter quotes for current user
        const userQuotes = allQuotes.filter((q: PortfolioQuote) => q.user_id === token);
        setQuotes(userQuotes);
      } else {
        setQuotes([]);
      }
      
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to load portfolio');
    } finally {
      setLoading(false);
    }
  };

  const deleteQuote = async (quoteId: string) => {
    if (!confirm('Are you sure you want to delete this quote?')) return;

    try {
      const token = localStorage.getItem('auth_token');
      
      // Load all quotes from localStorage
      const savedQuotes = localStorage.getItem('merlin_quotes');
      if (!savedQuotes) return;
      
      const allQuotes = JSON.parse(savedQuotes);
      // Remove the quote
      const updatedQuotes = allQuotes.filter((q: PortfolioQuote) => q.id !== quoteId);
      
      // Save back to localStorage
      localStorage.setItem('merlin_quotes', JSON.stringify(updatedQuotes));
      
      // Update UI
      setQuotes(quotes.filter(q => q.id !== quoteId));
      alert('Quote deleted successfully');
    } catch (err: any) {
      alert(`Failed to delete quote: ${err.message}`);
    }
  };

  const toggleFavorite = async (quoteId: string) => {
    try {
      const token = localStorage.getItem('auth_token');
      
      // Load all quotes from localStorage
      const savedQuotes = localStorage.getItem('merlin_quotes');
      if (!savedQuotes) return;
      
      const allQuotes = JSON.parse(savedQuotes);
      
      // Toggle favorite
      const updatedQuotes = allQuotes.map((q: PortfolioQuote) => 
        q.id === quoteId ? { ...q, is_favorite: !q.is_favorite } : q
      );
      
      // Save back to localStorage
      localStorage.setItem('merlin_quotes', JSON.stringify(updatedQuotes));
      
      // Update UI
      setQuotes(quotes.map(q => q.id === quoteId ? { ...q, is_favorite: !q.is_favorite } : q));
    } catch (err: any) {
      alert(`Failed to update favorite: ${err.message}`);
    }
  };

  const filteredQuotes = quotes.filter(quote =>
    quote.project_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    quote.tags?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatCurrency = (amount: number) => `$${Math.round(amount).toLocaleString()}`;

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
            <p>Loading your portfolio...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8 max-w-md mx-4">
          <div className="text-center">
            <div className="text-red-600 text-6xl mb-4">⚠️</div>
            <h3 className="text-lg font-semibold mb-2">Portfolio Error</h3>
            <p className="text-gray-600 mb-4">{error}</p>
            <button
              onClick={onClose}
              className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] mx-4 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-t-lg">
          <div>
            <h2 className="text-2xl font-bold">📁 My Portfolio</h2>
            <p className="text-purple-100">Your saved BESS quotes and projects</p>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:text-gray-300 text-2xl font-bold"
          >
            ×
          </button>
        </div>

        {/* Search and Controls */}
        <div className="p-4 border-b bg-gray-50">
          <div className="flex gap-4 items-center">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search projects by name or tags..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <button
              onClick={fetchQuotes}
              disabled={loading}
              className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              <span className={loading ? 'animate-spin' : ''}>🔄</span> 
              {loading ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          {filteredQuotes.length === 0 ? (
            <div className="flex items-center justify-center h-full p-8">
              <div className="text-center max-w-2xl">
                <div className="text-6xl mb-6">📊</div>
                <h3 className="text-2xl font-bold text-gray-800 mb-3">
                  {quotes.length === 0 ? 'Welcome to Your Portfolio!' : 'No Matching Projects'}
                </h3>
                
                {quotes.length === 0 ? (
                  <>
                    <p className="text-gray-600 mb-8">
                      Your portfolio is empty. Get started by creating your first BESS quote or uploading an existing project.
                    </p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                      {/* Option 1: Create New Project */}
                      <div className="border-2 border-purple-200 rounded-xl p-6 hover:border-purple-400 hover:shadow-lg transition-all cursor-pointer bg-gradient-to-br from-purple-50 to-white">
                        <div className="text-4xl mb-3">✨</div>
                        <h4 className="font-bold text-lg text-purple-800 mb-2">Create New Quote</h4>
                        <p className="text-sm text-gray-600 mb-4">
                          Start building a BESS quote from scratch with our intuitive builder
                        </p>
                        <button
                          onClick={() => {
                            onClose();
                          }}
                          className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:shadow-lg transition-all"
                        >
                          Get Started
                        </button>
                      </div>

                      {/* Option 2: Use Smart Wizard */}
                      <div className="border-2 border-yellow-200 rounded-xl p-6 hover:border-yellow-400 hover:shadow-lg transition-all cursor-pointer bg-gradient-to-br from-yellow-50 to-white">
                        <div className="text-4xl mb-3">🪄</div>
                        <h4 className="font-bold text-lg text-yellow-800 mb-2">Smart Wizard</h4>
                        <p className="text-sm text-gray-600 mb-4">
                          Answer a few questions and let AI guide you through the quoting process
                        </p>
                        <button
                          onClick={() => {
                            onClose();
                            // Trigger smart wizard
                            setTimeout(() => {
                              document.querySelector<HTMLButtonElement>('[aria-label="Open Smart Wizard"]')?.click();
                            }, 100);
                          }}
                          className="w-full bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-4 py-2 rounded-lg font-semibold hover:shadow-lg transition-all"
                        >
                          Start Wizard
                        </button>
                      </div>
                    </div>

                    {/* Additional Info */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-left">
                      <div className="flex items-start gap-3">
                        <div className="text-2xl">💡</div>
                        <div className="flex-1">
                          <h5 className="font-semibold text-blue-900 mb-1">Pro Tip</h5>
                          <p className="text-sm text-blue-800">
                            Once you create a quote, click the <strong>"Save Project"</strong> button to add it to your portfolio. 
                            You can then load, edit, or share it anytime!
                          </p>
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  <p className="text-gray-500">
                    Try adjusting your search terms to find your projects.
                  </p>
                )}
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 p-4 overflow-y-auto h-full">
              {filteredQuotes.map((quote) => {
                const outputs = typeof quote.outputs === 'string' ? JSON.parse(quote.outputs) : quote.outputs;
                const inputs = typeof quote.inputs === 'string' ? JSON.parse(quote.inputs) : quote.inputs;
                
                return (
                  <div
                    key={quote.id}
                    className="border rounded-lg p-4 hover:shadow-lg transition-shadow cursor-pointer bg-white"
                    onClick={() => setSelectedQuote(quote)}
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg text-purple-800 mb-1">
                          {quote.project_name}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {new Date(quote.created_at).toLocaleDateString()} at {new Date(quote.created_at).toLocaleTimeString()}
                        </p>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleFavorite(quote.id);
                        }}
                        className={`text-xl ${quote.is_favorite ? 'text-yellow-500' : 'text-gray-300'} hover:text-yellow-500`}
                      >
                        ⭐
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm mb-3">
                      <div>
                        <strong>Battery:</strong> {inputs?.batteryCapacity || 'N/A'} kWh
                      </div>
                      <div>
                        <strong>Annual Savings:</strong> {outputs?.annualSavings ? formatCurrency(outputs.annualSavings) : 'N/A'}
                      </div>
                      <div>
                        <strong>CapEx:</strong> {outputs?.grandCapex ? formatCurrency(outputs.grandCapex) : 'N/A'}
                      </div>
                      <div>
                        <strong>ROI:</strong> {outputs?.roiYears ? `${outputs.roiYears.toFixed(1)} years` : 'N/A'}
                      </div>
                    </div>

                    {quote.tags && (
                      <div className="mb-3">
                        <div className="flex flex-wrap gap-1">
                          {quote.tags.split(',').map((tag, index) => (
                            <span
                              key={index}
                              className="bg-purple-100 text-purple-800 px-2 py-1 rounded-full text-xs"
                            >
                              {tag.trim()}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="flex justify-between items-center pt-3 border-t">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onLoadQuote(quote);
                          onClose();
                        }}
                        className="bg-purple-600 text-white px-3 py-1 rounded text-sm hover:bg-purple-700"
                      >
                        📂 Load Project
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteQuote(quote.id);
                        }}
                        className="text-red-600 hover:text-red-800 text-sm px-3 py-1"
                      >
                        🗑️ Delete
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Quote Details Modal */}
        {selectedQuote && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-xl font-bold text-purple-800">{selectedQuote.project_name}</h3>
                <button
                  onClick={() => setSelectedQuote(null)}
                  className="text-gray-500 hover:text-gray-700 text-xl"
                >
                  ×
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">Project Details</h4>
                  <p className="text-sm text-gray-600">
                    Created: {new Date(selectedQuote.created_at).toLocaleString()}
                  </p>
                  {selectedQuote.notes && (
                    <div className="mt-2">
                      <strong>Notes:</strong>
                      <p className="text-gray-700 bg-gray-50 p-2 rounded mt-1">{selectedQuote.notes}</p>
                    </div>
                  )}
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      onLoadQuote(selectedQuote);
                      setSelectedQuote(null);
                      onClose();
                    }}
                    className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700"
                  >
                    📂 Load This Project
                  </button>
                  <button
                    onClick={() => setSelectedQuote(null)}
                    className="bg-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-400"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}