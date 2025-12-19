import React, { useState } from 'react';
import { translateOrExplain } from "@/services/apiAdapter";
import { getUserFriendlyMessage, logError } from "@/utils/errorHandler";
import { IconPen } from "@/components/ui/Icons";

const Translator: React.FC = () => {
  const [query, setQuery] = useState('');
  const [result, setResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleTranslate = async () => {
    if (!query.trim()) return;
    setLoading(true);
    try {
      const text = await translateOrExplain(query);
      setResult(text);
    } catch (error) {
      const errorMessage = getUserFriendlyMessage(error instanceof Error ? error : new Error(String(error)));
      logError(error instanceof Error ? error : new Error(String(error)), {
        context: 'Translator.handleTranslate',
        queryLength: query.length,
      });
      setResult(`Error: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-2xl bg-white rounded-2xl shadow-xl p-6 border border-slate-100">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
          <IconPen className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold text-slate-800">Writing Lab</h2>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-600 mb-2">
            Draft your text or ask for a translation
          </label>
          <textarea
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Write a sentence in German to get corrections, or in English to translate..."
            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 focus:outline-none transition-all h-32 resize-none placeholder:text-slate-400"
          />
        </div>

        <div className="flex justify-end">
          <button
            onClick={handleTranslate}
            disabled={loading || !query}
            className="px-6 py-2.5 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 active:transform active:scale-95 transition-all disabled:opacity-50 disabled:scale-100 shadow-md shadow-indigo-200"
          >
            {loading ? 'Analyzing...' : 'Check & Correct'}
          </button>
        </div>

        {result && (
          <div className="mt-6 pt-6 border-t border-slate-100 animate-in fade-in slide-in-from-top-4 duration-300">
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
              Feedback
            </label>
            <div className="prose prose-slate prose-sm max-w-none bg-slate-50 p-4 rounded-xl border border-slate-100 text-slate-700">
              {/* Simple markdown rendering by splitting lines */}
              {result.split('\n').map((line, i) => (
                <p key={i} className="mb-2 last:mb-0 min-h-[0.5rem]">{line}</p>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Translator;