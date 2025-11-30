import React, { useState } from 'react';
import { analyzeTextWithDetection } from '../../services/grammarService';
import { GrammarPointDisplay } from './GrammarPointDisplay';

interface NLPAnalysisResult {
  success: boolean;
  text: string;
  cefrLevel: string;
  sentences: Array<{
    sentence: string;
    analysis: {
      grammarPoints: Array<{
        id: string;
        category: string;
        level: string;
        text: string;
        startPos: number;
        endPos: number;
        explanation: string;
        details?: Record<string, any>;
        tokenIndices: number[];
      }>;
      hasErrors: boolean;
      summary: {
        totalPoints: number;
        byLevel: Record<string, number>;
        byCategory: Record<string, number>;
      };
    };
    error?: string;
  }>;
  summary: {
    totalSentences: number;
    totalGrammarPoints: number;
    errorSentences: number;
  };
}

interface NLPArticleAnalyzerProps {
  initialText?: string;
}

/**
 * Enhanced Article Analyzer using NLP-based grammar detection
 */
export const NLPArticleAnalyzer: React.FC<NLPArticleAnalyzerProps> = ({
  initialText = '',
}) => {
  const [inputText, setInputText] = useState(initialText);
  const [cefrLevel, setCefrLevel] = useState<string>('B1');
  const [results, setResults] = useState<NLPAnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedSentenceIdx, setSelectedSentenceIdx] = useState<number>(0);

  const handleAnalyze = async () => {
    if (!inputText.trim()) {
      setError('Please enter some text to analyze');
      return;
    }

    setLoading(true);
    setError(null);
    setResults(null);

    try {
      const data = await analyzeTextWithDetection(inputText);
      // Convert to expected format
      const convertedData = {
        success: true,
        text: inputText,
        cefrLevel: 'All',
        sentences: data.sentences.map((sentence: any, idx: number) => ({
          sentence: sentence.sentence,
          analysis: {
            grammarPoints: sentence.grammarPoints.map((point: any, pointIdx: number) => ({
              id: `point-${idx}-${pointIdx}`,
              category: point.type,
              level: 'Unknown', // Detection engine doesn't specify level per point
              text: point.text,
              startPos: point.position.start,
              endPos: point.position.end,
              explanation: point.explanation,
              details: {},
              tokenIndices: [],
            })),
            hasErrors: false,
            summary: {
              totalPoints: sentence.grammarPoints.length,
              byLevel: {},
              byCategory: {},
            },
          },
        })),
        summary: {
          totalSentences: data.sentences.length,
          totalGrammarPoints: data.sentences.reduce((sum: number, s: any) => sum + s.grammarPoints.length, 0),
          errorSentences: 0,
        },
      };
      setResults(convertedData);
      setSelectedSentenceIdx(0);
    } catch (err: any) {
      setError(err?.message || 'Analysis failed');
    } finally {
      setLoading(false);
    }
  };

  const selectedSentence = results?.sentences[selectedSentenceIdx];

  return (
    <div className="w-full max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h1 className="text-3xl font-bold text-gray-800 mb-2">
        Grammar Analysis (Rule-based Detection)
      </h1>
      <p className="text-gray-600 mb-6">
        Analyze German text for grammar patterns using comprehensive rule-based detection (A1-C2)
      </p>

      {/* Input Section */}
      <div className="mb-6">
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          German Text
        </label>
        <textarea
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          className="w-full p-4 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
          rows={6}
          placeholder="Enter German text to analyze..."
        />
      </div>

      {/* CEFR Level Selection */}
      <div className="mb-6 flex gap-4 items-end">
        <div className="flex-1">
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            CEFR Level
          </label>
          <select
            value={cefrLevel}
            onChange={(e) => setCefrLevel(e.target.value)}
            className="w-full p-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
          >
            <option value="A1">A1 - Beginner</option>
            <option value="A2">A2 - Elementary</option>
            <option value="B1">B1 - Intermediate</option>
            <option value="B2">B2 - Upper Intermediate</option>
            <option value="C1">C1 - Advanced</option>
            <option value="C2">C2 - Mastery</option>
          </select>
        </div>
        <button
          onClick={handleAnalyze}
          disabled={loading || !inputText.trim()}
          className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-bold py-2 px-6 rounded-lg transition-colors"
        >
          {loading ? 'Analyzing...' : 'Analyze'}
        </button>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-6 p-4 bg-red-100 border-l-4 border-red-500 text-red-700 rounded">
          <p className="font-semibold">Error</p>
          <p>{error}</p>
        </div>
      )}

      {/* Results */}
      {results && (
        <div className="space-y-6">
          {/* Summary Stats */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-500">
              <p className="text-gray-600 text-sm">Total Sentences</p>
              <p className="text-2xl font-bold text-blue-700">
                {results.summary.totalSentences}
              </p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg border-l-4 border-green-500">
              <p className="text-gray-600 text-sm">Grammar Points Found</p>
              <p className="text-2xl font-bold text-green-700">
                {results.summary.totalGrammarPoints}
              </p>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg border-l-4 border-purple-500">
              <p className="text-gray-600 text-sm">Errors</p>
              <p className="text-2xl font-bold text-purple-700">
                {results.summary.errorSentences}
              </p>
            </div>
          </div>

          {/* Sentence Selector */}
          {results.sentences.length > 1 && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Select Sentence
              </label>
              <div className="flex gap-2 flex-wrap">
                {results.sentences.map((sent, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedSentenceIdx(idx)}
                    className={`px-3 py-2 rounded font-medium transition-colors ${
                      selectedSentenceIdx === idx
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                    }`}
                  >
                    Sentence {idx + 1}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Selected Sentence Analysis */}
          {selectedSentence && !selectedSentence.error && (
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">
                  Sentence {selectedSentenceIdx + 1}
                </h3>
                <p className="text-gray-700 mb-4">{selectedSentence.sentence}</p>

                {selectedSentence.analysis.grammarPoints.length > 0 ? (
                  <>
                    <p className="text-sm text-gray-600 mb-4">
                      {selectedSentence.analysis.grammarPoints.length} grammar points detected
                    </p>
                    <GrammarPointDisplay
                      points={selectedSentence.analysis.grammarPoints}
                      sentence={selectedSentence.sentence}
                    />
                  </>
                ) : (
                  <p className="text-gray-600 italic">
                    No grammar points detected for this sentence at level {cefrLevel}
                  </p>
                )}

                {/* Grammar Categories Summary */}
                {Object.keys(selectedSentence.analysis.summary.byCategory).length > 0 && (
                  <div className="mt-4">
                    <p className="text-sm font-semibold text-gray-700 mb-2">Categories:</p>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(
                        selectedSentence.analysis.summary.byCategory
                      ).map(([category, count]) => (
                        <span
                          key={category}
                          className="bg-gray-100 text-gray-800 px-3 py-1 rounded-full text-sm"
                        >
                          {category}: {count}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {selectedSentence?.error && (
            <div className="p-4 bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 rounded">
              <p className="font-semibold">Could not analyze this sentence</p>
              <p>{selectedSentence.error}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NLPArticleAnalyzer;
