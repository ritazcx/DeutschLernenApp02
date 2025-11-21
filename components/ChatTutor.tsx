import React, { useState, useEffect, useRef } from 'react';
import { ChatMessage } from '../types';
import { Chat, GenerateContentResponse } from '@google/genai';
import { createTutorChat, generateSpeech } from '../services/geminiService';
import { IconSend, IconVolume } from './Icons';
import { playAudioData } from '../utils/audioUtils';

const ChatTutor: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: 'init', role: 'model', text: 'Hallo! Ich bin Hans. Wie geht es dir heute? (Hello! I am Hans. How are you today?)' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [playingId, setPlayingId] = useState<string | null>(null);
  
  // Persist chat session
  const chatSession = useRef<Chat | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatSession.current = createTutorChat();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || !chatSession.current) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: input
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const result: GenerateContentResponse = await chatSession.current.sendMessage({
        message: userMsg.text
      });
      
      const responseText = result.text || "";
      
      // Simple parsing for corrections based on the system prompt pattern
      // Format: "... text ... [Correction: ...] ..."
      const correctionRegex = /\[Correction: (.*?)\]/s;
      const match = responseText.match(correctionRegex);
      
      let mainText = responseText;
      let correction = undefined;

      if (match) {
        correction = match[0]; // Keep the whole block for now
        mainText = responseText.replace(match[0], "").trim();
      }

      const botMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: mainText,
        correction: correction
      };

      setMessages(prev => [...prev, botMsg]);
    } catch (error) {
      console.error("Chat error", error);
    } finally {
      setLoading(false);
    }
  };

  const handlePlayMessage = async (msg: ChatMessage) => {
    if (playingId) return;
    setPlayingId(msg.id);
    
    // Just speak the main text, ignore the correction part for flow
    const audioData = await generateSpeech(msg.text);
    if (audioData) {
      await playAudioData(audioData);
    }
    setPlayingId(null);
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 rounded-xl overflow-hidden">
      {/* Chat Header */}
      <div className="bg-white border-b border-slate-200 p-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-german-gold flex items-center justify-center text-white font-bold text-lg">H</div>
          <div>
            <h3 className="font-bold text-slate-800">Hans</h3>
            <p className="text-xs text-slate-500 flex items-center gap-1">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
              Online Tutor
            </p>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] sm:max-w-[75%] rounded-2xl p-4 shadow-sm ${
              msg.role === 'user' 
                ? 'bg-slate-900 text-white rounded-tr-none' 
                : 'bg-white text-slate-800 border border-slate-200 rounded-tl-none'
            }`}>
              <p className="text-sm sm:text-base leading-relaxed whitespace-pre-wrap">{msg.text}</p>
              
              {msg.correction && (
                <div className="mt-3 pt-3 border-t border-slate-100 text-xs sm:text-sm text-german-red bg-red-50 -mx-4 -mb-4 px-4 py-2 rounded-b-2xl">
                  <span className="font-bold uppercase text-[10px] tracking-wider mr-1">Tip:</span>
                  {msg.correction.replace('[Correction:', '').replace(']', '')}
                </div>
              )}

              {msg.role === 'model' && (
                <button 
                  onClick={() => handlePlayMessage(msg)}
                  disabled={playingId !== null}
                  className={`mt-2 p-1.5 rounded-full transition-colors ${playingId === msg.id ? 'text-german-gold bg-slate-100' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'}`}
                >
                   <IconVolume className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-none p-4 shadow-sm">
              <div className="flex space-x-1.5">
                <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-white border-t border-slate-200">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Schreib etwas... (Type something...)"
            className="flex-1 px-4 py-3 bg-slate-100 border border-transparent rounded-xl focus:outline-none focus:border-slate-300 focus:bg-white transition-all"
            disabled={loading}
          />
          <button
            onClick={handleSend}
            disabled={loading || !input.trim()}
            className="p-3 bg-slate-900 text-white rounded-xl hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-md"
          >
            <IconSend className="w-6 h-6" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatTutor;
