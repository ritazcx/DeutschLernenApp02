import React, { useState } from 'react';
import { SentenceAnalysis, GrammarPoint } from '../../types/grammar';
import { analyzeArticle } from '../../services/grammarService';
import HighlightedSentence from './HighlightedSentence';
import GrammarExplanationPanel from './GrammarExplanationPanel';

const ArticleAnalyzer: React.FC = () => {
  const [inputText, setInputText] = useState('');
  const [sentences, setSentences] = useState<SentenceAnalysis[]>([]);
  const [selectedSentence, setSelectedSentence] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAnalyze = async () => {
    if (!inputText.trim()) return;

    setLoading(true);
    setError(null);
    setSentences([]);
    setSelectedSentence(null);

    try {
      const result = await analyzeArticle(inputText);
      setSentences(result.sentences);
      
      // Save to localStorage
      const saved = JSON.parse(localStorage.getItem('analyzed_articles') || '[]');
      saved.unshift({
        id: Date.now(),
        text: inputText,
        analysis: result,
        timestamp: new Date().toISOString(),
      });
      localStorage.setItem('analyzed_articles', JSON.stringify(saved.slice(0, 10))); // Keep last 10
    } catch (err: any) {
      setError(err?.message || 'Analysis failed');
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setInputText('');
    setSentences([]);
    setSelectedSentence(null);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">
            📝 Article Grammar Analyzer
          </h1>
          <p className="text-slate-600">
            Paste a German article to analyze its grammar sentence by sentence (B2 Level)
          </p>
        </div>

        {sentences.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-6">
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Paste your German article here..."
              className="w-full h-64 p-4 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent resize-none"
            />
            {error && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {error}
              </div>
            )}
            <div className="mt-4 flex gap-3">
              <button
                onClick={handleAnalyze}
                disabled={loading || !inputText.trim()}
                className="px-6 py-3 bg-slate-900 text-white rounded-lg hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
              >
                {loading ? 'Analyzing...' : 'Analyze Grammar'}
              </button>
              <button
                onClick={handleClear}
                disabled={loading}
                className="px-6 py-3 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 disabled:opacity-50 transition-colors font-medium"
              >
                Clear
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Panel: Article with Highlights */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-slate-900">Article</h2>
                <button
                  onClick={handleClear}
                  className="text-sm px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                >
                  New Article
                </button>
              </div>
              <div className="space-y-4 max-h-[70vh] overflow-y-auto">
                {sentences.map((sentence, index) => (
                  <div
                    key={index}
                    onClick={() => setSelectedSentence(index)}
                    className={`cursor-pointer p-3 rounded-lg transition-all ${
                      selectedSentence === index
                        ? 'bg-slate-100 ring-2 ring-slate-900'
                        : 'hover:bg-slate-50'
                    }`}
                  >
                    <HighlightedSentence sentence={sentence} />
                  </div>
                ))}
              </div>

              {/* Legend */}
              <div className="mt-6 pt-4 border-t border-slate-200">
                <h3 className="text-sm font-semibold text-slate-700 mb-2">Legend:</h3>
                <div className="flex flex-wrap gap-3 text-xs">
                  <span className="flex items-center gap-1">
                    <span className="w-3 h-3 bg-blue-200 rounded"></span>
                    Verb
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-3 h-3 bg-green-200 rounded"></span>
                    Case
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-3 h-3 bg-purple-200 rounded"></span>
                    Clause
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-3 h-3 bg-orange-200 rounded"></span>
                    Conjunction
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-3 h-3 bg-pink-200 rounded"></span>
                    Special
                  </span>
                </div>
              </div>
            </div>

            {/* Right Panel: Grammar Explanation */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-xl font-bold text-slate-900 mb-4">Grammar Analysis</h2>
              {selectedSentence !== null ? (
                <GrammarExplanationPanel sentence={sentences[selectedSentence]} />
              ) : (
                <div className="text-center text-slate-500 py-12">
                  <p className="text-lg">Click on a sentence to see its grammar analysis</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ArticleAnalyzer;
