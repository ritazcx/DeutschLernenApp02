import React, { useState, useEffect } from 'react';
import { SentenceAnalysis, GrammarPoint, GrammarType, CEFRLevel, ALL_GRAMMAR_TYPES, GRAMMAR_CATEGORIES } from '../../types/grammar';
import { analyzeArticle, analyzeTextWithDetection } from '../../services/grammarService';
import { saveAnalysis } from '../../services/analysisService';
import HighlightedSentence from './HighlightedSentence';
import GrammarExplanationPanel from './GrammarExplanationPanel';
import SavedAnalyses from '../analysis/SavedAnalyses';

const ArticleAnalyzer: React.FC = () => {
  const [inputText, setInputText] = useState('');
  const [sentences, setSentences] = useState<SentenceAnalysis[]>([]);
  const [selectedSentence, setSelectedSentence] = useState<number | null>(null);
  const [selectedGrammarPoint, setSelectedGrammarPoint] = useState<number | null>(null);

  const handleGrammarPointClick = (sentenceIndex: number, pointIndex: number) => {
    setSelectedSentence(sentenceIndex);
    setSelectedGrammarPoint(pointIndex);
  };

  const handleSentenceClick = (sentenceIndex: number) => {
    setSelectedSentence(sentenceIndex);
    setSelectedGrammarPoint(null); // Reset grammar point selection to show sentence overview
  };

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [savedId, setSavedId] = useState<string | null>(null);
  const [isSaved, setIsSaved] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [showSavedModal, setShowSavedModal] = useState(false);
  const [useNLPAnalyzer, setUseNLPAnalyzer] = useState(true);
  
  // Grammar filter state - load from localStorage or default to all selected
  const [selectedGrammarTypes, setSelectedGrammarTypes] = useState<GrammarType[]>(() => {
    const saved = localStorage.getItem('grammar_filters');
    return saved ? JSON.parse(saved) : ALL_GRAMMAR_TYPES;
  });

  // Vocabulary annotation state - load from localStorage or default to B1 and B2
  const [selectedVocabularyLevels, setSelectedVocabularyLevels] = useState<string[]>(() => {
    const saved = localStorage.getItem('vocabulary_levels');
    return saved ? JSON.parse(saved) : ['B1', 'B2'];
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
      let result;
      
      if (useNLPAnalyzer) {
        // Use rule-based detection analysis
        result = await analyzeTextWithDetection(inputText);
      } else {
        // Use traditional DeepSeek analysis
        result = await analyzeArticle(inputText, selectedGrammarTypes, selectedVocabularyLevels);
      }

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
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 mb-2">
                📝 Article Grammar Analyzer
              </h1>
              <p className="text-slate-600">
                Paste German text to analyze grammar from A1 to C2 levels
              </p>
            </div>
            {/* NLP vs DeepSeek Toggle */}
            <div className="flex gap-2">
              <button
                onClick={() => setUseNLPAnalyzer(false)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  !useNLPAnalyzer
                    ? 'bg-slate-900 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                DeepSeek
              </button>
              <button
                onClick={() => setUseNLPAnalyzer(true)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  useNLPAnalyzer
                    ? 'bg-slate-900 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                NLP Engine
              </button>
            </div>
          </div>
        </div>

        {sentences.length === 0 ? (
          <div className="max-w-4xl mx-auto">
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
              <div className="flex flex-wrap gap-3 mt-4">
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
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Panel: Article with Highlights */}
            <div className="bg-white rounded-xl shadow-sm p-6 flex flex-col h-[calc(100vh-150px)]">
              <div className="flex justify-between items-center mb-4 flex-shrink-0">
                <h2 className="text-xl font-bold text-slate-900">Article</h2>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleClear}
                    className="text-sm px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                  >
                    New Article
                  </button>
                </div>
              </div>
              <div className="space-y-4 overflow-y-auto flex-1 pr-2">
                {sentences.map((sentence, index) => (
                  <div
                    key={index}
                    className={`p-4 rounded-lg border-2 transition-colors cursor-pointer ${
                      selectedSentence === index
                        ? 'border-slate-900 bg-slate-50'
                        : 'border-slate-200 hover:bg-slate-50'
                    }`}
                    onClick={() => handleSentenceClick(index)}
                  >
                    <HighlightedSentence 
                      sentence={sentence} 
                      onGrammarPointClick={handleGrammarPointClick}
                      sentenceIndex={index}
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Right Panel: Grammar Explanation */}
            <div className="bg-white rounded-xl shadow-sm p-6 flex flex-col h-[calc(100vh-150px)]">
              <h2 className="text-xl font-bold text-slate-900 mb-4 flex-shrink-0">Grammar Analysis</h2>
              {selectedSentence !== null ? (
                <div className="overflow-y-auto flex-1">
                  <GrammarExplanationPanel 
                    sentence={sentences[selectedSentence]} 
                    selectedGrammarPoint={selectedGrammarPoint}
                  />
                </div>
              ) : (
                <div className="text-center text-slate-500 py-12 flex-1 flex items-center justify-center">
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
