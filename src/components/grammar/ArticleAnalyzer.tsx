import React, { useState } from 'react';
import { SentenceAnalysis, GrammarPoint, GrammarType, CEFRLevel, ALL_GRAMMAR_TYPES, GRAMMAR_CATEGORIES } from '../../types/grammar';
import { analyzeTextWithDetection } from '../../services/grammarService';
import { getUserFriendlyMessage, logError } from '../../utils/errorHandler';
import HighlightedSentence from './HighlightedSentence';
import GrammarExplanationPanel from './GrammarExplanationPanel';
import CEFRLevelFilter from './CEFRLevelFilter';
import { useLocalStorage } from './hooks';
import { CEFR_LEVELS } from './cefrConfig';

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

  // Persistent settings using custom localStorage hook
  const [selectedGrammarTypes] = useLocalStorage<GrammarType[]>('grammar_filters', ALL_GRAMMAR_TYPES);
  const [selectedVocabularyLevels] = useLocalStorage<string[]>('vocabulary_levels', ['B1', 'B2']);
  const [selectedCEFRLevels, setSelectedCEFRLevels] = useLocalStorage<CEFRLevel[]>('cefr_levels', CEFR_LEVELS);


  const handleCEFRLevelToggle = (level: CEFRLevel) => {
    setSelectedCEFRLevels(prev =>
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

    try {
      // Use rule-based detection analysis
      const result = await analyzeTextWithDetection(inputText);
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
    } catch (err) {
      const errorMessage = getUserFriendlyMessage(err instanceof Error ? err : new Error(String(err)));
      logError(err instanceof Error ? err : new Error(String(err)), {
        context: 'ArticleAnalyzer.handleAnalyze',
        textLength: inputText.length,
      });
      setError(errorMessage);
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
            <CEFRLevelFilter
              selectedLevels={selectedCEFRLevels}
              onLevelChange={handleCEFRLevelToggle}
            />
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
              </div>
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
                      selectedCEFRLevels={selectedCEFRLevels}
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
                    selectedCEFRLevels={selectedCEFRLevels}
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
