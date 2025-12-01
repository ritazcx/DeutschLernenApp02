import React, { useEffect, useState } from 'react';
import { listAnalyses, getAnalysis, deleteAnalysis } from '../../services/analysisService';

interface SavedAnalysesProps {
  onSelectAnalysis?: (analysis: any) => void;
}

const SavedAnalyses: React.FC<SavedAnalysesProps> = ({ onSelectAnalysis }) => {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchAnalyses();
  }, []);

  const fetchAnalyses = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await listAnalyses();
      setItems(data.items || []);
    } catch (err) {
      console.error(err);
      setError('Failed to load saved analyses');
    } finally {
      setLoading(false);
    }
  };

  const handleOpen = async (id: string) => {
    try {
      const analysis = await getAnalysis(id);
      if (onSelectAnalysis) {
        onSelectAnalysis(analysis);
      }
    } catch (err) {
      console.error(err);
      alert('Failed to load analysis');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this saved analysis? This action cannot be undone.')) return;
    try {
      await deleteAnalysis(id);
      setItems(items.filter(i => i.id !== id));
    } catch (err) {
      console.error(err);
      alert('Delete failed');
    }
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const getPreview = (text: string) => {
    if (!text) return '';
    return text.length > 150 ? text.slice(0, 150) + '...' : text;
  };

  // Filter items based on search query
  const filteredItems = items.filter(item => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      (item.title && item.title.toLowerCase().includes(query)) ||
      (item.text && item.text.toLowerCase().includes(query))
    );
  });

  return (
    <div className="w-full">
      {/* Header with Search */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-900 mb-4">
          View and manage your saved article analyses
        </h2>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by title or text..."
          className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
        />
      </div>

      {/* Loading State */}
      {loading && (
        <div className="text-center py-12">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-slate-900 border-r-transparent"></div>
          <p className="mt-2 text-slate-600">Loading saved analyses...</p>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          {error}
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && filteredItems.length === 0 && (
        <div className="text-center py-12 bg-slate-50 rounded-lg">
          <div className="text-6xl mb-4">📝</div>
          <p className="text-lg font-medium text-slate-700">
            {searchQuery ? 'No matching analyses found' : 'No saved analyses yet'}
          </p>
          <p className="text-slate-500 mt-2">
            {searchQuery ? 'Try a different search term' : 'Start by analyzing an article!'}
          </p>
        </div>
      )}

      {/* Table View */}
      {!loading && !error && filteredItems.length > 0 && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Title & Preview
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Words
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {filteredItems.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-medium text-slate-900">{item.title || item.id}</div>
                    <div className="text-sm text-slate-500 mt-1">{getPreview(item.text)}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-700">
                    {item.word_count || 0}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-700">
                    {formatDate(item.created_at)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => handleOpen(item.id)}
                      className="text-blue-600 hover:text-blue-900 mr-4"
                    >
                      Open
                    </button>
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default SavedAnalyses;
