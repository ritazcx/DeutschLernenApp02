import React, { useState } from 'react';
import { DictionaryEntry } from '@/types';
import { IconVolume, IconRefresh } from "@/components/ui/Icons";
import { generateSpeech } from "@/services/apiAdapter";
import { playAudioData } from "@/utils/audioUtils";


interface WordCardProps {
  data: DictionaryEntry | null;
  loading: boolean;
  onRefresh?: () => void;
  isWordOfDay?: boolean;
}

const WordCard: React.FC<WordCardProps> = ({ data, loading, onRefresh, isWordOfDay = false }) => {
  const [playing, setPlaying] = useState(false);

  const handlePlay = async () => {
    if (!data || playing) return;
    setPlaying(true);
    
    // Pronounce the word AND the sentence
    const textToSay = `${data.gender} ${data.word}. ${data.exampleSentenceGerman}`;
    
    const audioData = await generateSpeech(textToSay);
    if (audioData) {
      await playAudioData(audioData);
    }
    setPlaying(false);
  };

  if (loading) {
    return (
      <div className="w-full max-w-xl bg-white rounded-3xl shadow-lg overflow-hidden border border-slate-100 animate-pulse p-8">
        <div className="h-10 bg-slate-200 rounded w-1/2 mx-auto mb-6"></div>
        <div className="h-4 bg-slate-200 rounded w-3/4 mx-auto mb-2"></div>
        <div className="h-4 bg-slate-200 rounded w-2/3 mx-auto mb-8"></div>
        <div className="h-32 bg-slate-100 rounded-xl mb-6"></div>
        <div className="h-48 bg-slate-200 rounded-xl"></div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="w-full max-w-xl bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden transition-all duration-500 hover:shadow-2xl">
      {/* Top Decorative Bar */}
      <div className="h-2 w-full bg-gradient-to-r from-german-black via-german-red to-german-gold"></div>
      
      <div className="p-8 md:p-10">
        {/* Optional Tag for Context */}
        {isWordOfDay && (
            <div className="flex justify-center mb-6">
                <span className="px-3 py-1 bg-amber-50 text-amber-600 text-xs font-bold tracking-wider rounded-full uppercase border border-amber-100 flex items-center gap-2">
                    Word of the Day
                    {onRefresh && (
                        <button onClick={onRefresh} className="hover:text-amber-800 transition-colors">
                            <IconRefresh className="w-3 h-3" />
                        </button>
                    )}
                </span>
            </div>
        )}

        {/* 1. German Word + Pronunciation Icon */}
        <div className="flex items-center justify-center gap-4 mb-2">
          <h2 className="text-4xl md:text-5xl font-bold text-slate-900 tracking-tight text-center">
            <span className="text-german-red text-2xl md:text-3xl align-top mr-2 font-normal opacity-90 italic font-serif">{data.gender}</span>
            {data.word}
          </h2>
          <button 
            onClick={handlePlay}
            disabled={playing}
            className={`p-3 rounded-full transition-all transform hover:scale-110 active:scale-95 flex-shrink-0 ${
                playing 
                ? 'bg-slate-100 text-german-gold' 
                : 'bg-slate-100 text-slate-600 hover:bg-slate-900 hover:text-white shadow-sm'
            }`}
            title="Listen to pronunciation"
          >
            <IconVolume className={`w-6 h-6 ${playing ? 'animate-pulse' : ''}`} />
          </button>
        </div>

        {/* 2. English Explanations */}
        <div className="text-center mb-8">
          <p className="text-xl font-medium text-slate-700 mb-2">{data.translation}</p>
          {data.definition && (
            <p className="text-slate-500 italic leading-relaxed max-w-sm mx-auto text-sm">
               {data.definition}
            </p>
          )}
        </div>

        {/* 3. Examples Section */}
        <div className="bg-slate-50 rounded-2xl p-6 mb-8 border border-slate-100 relative group">
           <div className="absolute top-0 left-6 -mt-3 px-2 bg-slate-50 text-xs font-bold text-slate-400 uppercase tracking-widest">
             Example
           </div>
           <p className="text-lg text-slate-800 font-medium leading-relaxed mb-2">
             "{data.exampleSentenceGerman}"
           </p>
           <p className="text-slate-500">
             {data.exampleSentenceEnglish}
           </p>
        </div>

        {/* 4. Picture */}
        {data.imageUrl ? (
             <div className="rounded-2xl overflow-hidden shadow-inner border border-slate-100 relative group">
                <img 
                    src={data.imageUrl} 
                    alt={data.word} 
                    className="w-full h-56 md:h-64 object-cover transition-transform duration-700 group-hover:scale-105" 
                />
                <div className="absolute inset-0 ring-1 ring-inset ring-black/5 rounded-2xl pointer-events-none"></div>
            </div>
        ) : (
            <div className="w-full h-56 bg-slate-50 rounded-2xl flex items-center justify-center border border-slate-100 border-dashed text-slate-300 text-sm">
                No illustration available
            </div>
        )}

      </div>
    </div>
  );
};

export default WordCard;