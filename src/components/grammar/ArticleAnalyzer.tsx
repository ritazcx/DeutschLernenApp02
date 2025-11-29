import React, { useState, useEffect } from 'react';
import { SentenceAnalysis, GrammarPoint, GrammarType, CEFRLevel, ALL_GRAMMAR_TYPES, GRAMMAR_CATEGORIES } from '../../types/grammar';
import { analyzeArticle } from '../../services/grammarService';
import { saveAnalysis } from '../../services/analysisService';
import HighlightedSentence from './HighlightedSentence';
import GrammarExplanationPanel from './GrammarExplanationPanel';
import SavedAnalyses from '../analysis/SavedAnalyses';
import GrammarFilterPanel from './GrammarFilterPanel';

const ArticleAnalyzer: React.FC = () => {
  const [inputText, setInputText] = useState('');
  const [sentences, setSentences] = useState<SentenceAnalysis[]>([]);
  const [selectedSentence, setSelectedSentence] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [savedId, setSavedId] = useState<string | null>(null);
  const [isSaved, setIsSaved] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [showSavedModal, setShowSavedModal] = useState(false);
  
  // Grammar filter state - load from localStorage or default to all selected
  const [selectedGrammarTypes, setSelectedGrammarTypes] = useState<GrammarType[]>(() => {
    const saved = localStorage.getItem('grammar_filters');
    return saved ? JSON.parse(saved) : ALL_GRAMMAR_TYPES;
  });

  // Vocabulary annotation state - load from localStorage or default to B1 only
  const [selectedVocabularyLevels, setSelectedVocabularyLevels] = useState<string[]>(() => {
    const saved = localStorage.getItem('vocabulary_levels');
    return saved ? JSON.parse(saved) : ['B1'];
  });

  // Persist filter changes to localStorage
  useEffect(() => {
    localStorage.setItem('grammar_filters', JSON.stringify(selectedGrammarTypes));
  }, [selectedGrammarTypes]);

  useEffect(() => {
    localStorage.setItem('vocabulary_levels', JSON.stringify(selectedVocabularyLevels));
  }, [selectedVocabularyLevels]);

  const handleTypeToggle = (type: GrammarType) => {
    setSelectedGrammarTypes(prev => 
      prev.includes(type) 
        ? prev.filter(t => t !== type)
        : [...prev, type]
    );
  };

  const handleLevelToggle = (level: CEFRLevel, selectAll: boolean) => {
    const category = GRAMMAR_CATEGORIES.find(cat => cat.level === level);
    if (!category) return;

    if (selectAll) {
      setSelectedGrammarTypes(prev => {
        const without = prev.filter(t => !category.types.includes(t));
        return [...without, ...category.types];
      });
    } else {
      setSelectedGrammarTypes(prev => 
        prev.filter(t => !category.types.includes(t))
      );
    }
  };

  const handleVocabularyLevelToggle = (level: string) => {
    setSelectedVocabularyLevels(prev =>
      prev.includes(level)
        ? prev.filter(l => l !== level)
        : [...prev, level]
    );
  };

  const handleAnalyze = async () => {
    if (!inputText.trim()) return;

    setLoading(true);
    setError(null);
    setSentences([]);
    setSelectedSentence(null);
    setSavedId(null);
    setIsSaved(false);
    setShowSuccessMessage(false);

    try {
      const result = await analyzeArticle(inputText, selectedGrammarTypes, selectedVocabularyLevels);
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
    setSavedId(null);
    setIsSaved(false);
    setShowSuccessMessage(false);
  };

  const loadSavedAnalysis = (analysis: any) => {
    // Load saved analysis without calling API
    setInputText(analysis.text || '');
    setSentences(analysis.sentences || []);
    setSelectedSentence(null);
    setError(null);
    setSavedId(analysis.id);
    setIsSaved(true);
    setShowSuccessMessage(false);
    setShowSavedModal(false);
  };

  return (
    <div className="bg-slate-50 p-4 md:p-8">
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
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left column: Text input */}
            <div className="lg:col-span-2">
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
                <div className="mt-4 flex flex-wrap gap-3">
                  <button
                    onClick={handleAnalyze}
                    disabled={loading || !inputText.trim() || selectedGrammarTypes.length === 0}
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
                  <button
                    onClick={() => setShowSavedModal(true)}
                    disabled={loading}
                    className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors font-medium"
                  >
                    Choose an analyzed article
                  </button>
                </div>
                {selectedGrammarTypes.length === 0 && (
                  <div className="mt-3 text-sm text-amber-600">
                    ⚠️ Please select at least one grammar type to analyze
                  </div>
                )}
              </div>
            </div>

            {/* Right column: Grammar filters */}
            <div className="lg:col-span-1">
              <GrammarFilterPanel
                selectedTypes={selectedGrammarTypes}
                onTypeToggle={handleTypeToggle}
                onLevelToggle={handleLevelToggle}
                selectedVocabularyLevels={selectedVocabularyLevels}
                onVocabularyLevelToggle={handleVocabularyLevelToggle}
              />
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Panel: Article with Highlights */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-slate-900">Article</h2>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleClear}
                        className="text-sm px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                      >
                        New Article
                      </button>
                      <button
                        onClick={async () => {
                          if (saving) return;
                          setSaving(true);
                          setSavedId(null);
                          try {
                            const payload = {
                              // id will be generated server-side if absent
                              title: inputText.trim().slice(0, 80) || `Analysis ${new Date().toISOString()}`,
                              text: inputText,
                              word_count: inputText.split(/\s+/).filter(Boolean).length,
                              sentences: sentences.map(s => ({
                                sentence: s.sentence,
                                translation: s.translation,
                                grammarPoints: (s.grammarPoints || []).map((p: any) => ({
                                  type: p.type,
                                  text: p.text,
                                  explanation: p.explanation,
                                  position: p.position,
                                }))
                              })),
                            };

                            const res = await saveAnalysis(payload);
                            setSavedId(res.id || null);
                            setIsSaved(true);
                            setShowSuccessMessage(true);
                          } catch (err) {
                            // eslint-disable-next-line no-console
                            console.error('Save failed', err);
                            alert('Save failed');
                          } finally {
                            setSaving(false);
                          }
                        }}
                        disabled={saving || isSaved}
                        className={`text-sm px-4 py-2 rounded-lg transition-colors ${
                          isSaved 
                            ? 'bg-gray-400 text-white cursor-not-allowed' 
                            : 'bg-emerald-600 text-white hover:bg-emerald-500'
                        } disabled:opacity-60`}
                      >
                        {saving ? 'Saving…' : 'Save Analysis'}
                      </button>
                    </div>
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

              {showSuccessMessage && (
                <div className="mt-3 text-sm text-emerald-700 font-medium">✓ This article analysis is saved successfully!</div>
              )}
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

        {/* Saved Analyses Modal */}
        {showSavedModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
              <div className="flex justify-end items-center p-4 border-b border-slate-200">
                <button
                  onClick={() => setShowSavedModal(false)}
                  className="text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-6">
                <SavedAnalyses onSelectAnalysis={loadSavedAnalysis} />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ArticleAnalyzer;
