import { useState, useEffect } from 'react';

interface PortfolioQuote {
  id: string;
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

      const response = await fetch('/api/auth/quotes', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          localStorage.removeItem('auth_token');
          setError('Your session has expired. Please sign in again.');
        } else {
          setError('Failed to fetch quotes');
        }
        return;
      }

      const data = await response.json();
      setQuotes(data.quotes || []);
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
      const response = await fetch(`/api/auth/quotes/${quoteId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          localStorage.removeItem('auth_token');
          alert('Your session has expired. Please sign in again.');
          return;
        }
        throw new Error('Failed to delete quote');
      }

      setQuotes(quotes.filter(q => q.id !== quoteId));
      alert('Quote deleted successfully');
    } catch (err: any) {
      alert(`Failed to delete quote: ${err.message}`);
    }
  };

  const toggleFavorite = async (quoteId: string) => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`/api/auth/quotes/${quoteId}/favorite`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          localStorage.removeItem('auth_token');
          alert('Your session has expired. Please sign in again.');
          return;
        }
        throw new Error('Failed to update favorite');
      }

      const data = await response.json();
      setQuotes(quotes.map(q => q.id === quoteId ? { ...q, is_favorite: data.quote.is_favorite } : q));
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
              className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 flex items-center gap-2"
            >
              🔄 Refresh
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          {filteredQuotes.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center py-12">
                <div className="text-6xl mb-4">📊</div>
                <h3 className="text-xl font-semibold text-gray-600 mb-2">
                  {quotes.length === 0 ? 'No Saved Projects' : 'No Matching Projects'}
                </h3>
                <p className="text-gray-500 mb-4">
                  {quotes.length === 0 
                    ? 'Start by creating and saving your first BESS quote!'
                    : 'Try adjusting your search terms.'
                  }
                </p>
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