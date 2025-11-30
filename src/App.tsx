import React, { useState, useEffect } from "react";
import { AppView, DictionaryEntry } from "@/types";
import WordCard from "@/components/dictionary/WordCard";
import ChatTutor from "@/components/chat/ChatTutor";
import Translator from "@/components/writing/Translator";
import ArticleAnalyzer from "@/components/grammar/ArticleAnalyzer";
import {
  IconBook,
  IconMessage,
  IconPen,
  IconMenu,
  IconHome,
  IconSearch,
  IconRefresh,
} from "@/components/ui/Icons";
import { fetchWordOfTheDay, searchDictionaryWord } from '@/services/apiAdapter';

const App: React.FC = () => {
  const [view, setView] = useState<AppView>(AppView.HOME);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // Dictionary State
  const [wordData, setWordData] = useState<DictionaryEntry | null>(null); // Displayed data
  const [wodData, setWodData] = useState<DictionaryEntry | null>(null);   // Cached Word of the Day
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Initial Load (Word of Day)
  const loadWordOfDay = async () => {
    setLoading(true);
    try {
      const levels = ['A1', 'A2', 'B1'];
      const level = levels[Math.floor(Math.random() * levels.length)];
      const data = await fetchWordOfTheDay(level);
      // debug: log raw WOD result to help diagnose missing fields
      // eslint-disable-next-line no-console
      console.debug('[App] fetchWordOfTheDay result:', data);
      setWodData(data);
      // Only set displayed word if we aren't looking at a search result, or if it's first load
      if (!wordData || wordData === wodData) {
        setWordData(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWordOfDay();
  }, []);

  // Listen for deepseek background updates (fast-fallback will dispatch these)
  useEffect(() => {
    const onWod = (e: any) => {
      const { data } = e.detail || {};
      if (data) {
        setWodData(data);
        // If not currently searching, update displayed word
        if (!searchQuery) setWordData(data);
      }
    };

    const onSearch = (e: any) => {
      const { term, data } = e.detail || {};
      if (data && term === searchQuery) {
        setWordData(data);
      }
    };

    window.addEventListener('deepseek:wod:update', onWod as EventListener);
    window.addEventListener('deepseek:search:update', onSearch as EventListener);
    return () => {
      window.removeEventListener('deepseek:wod:update', onWod as EventListener);
      window.removeEventListener('deepseek:search:update', onSearch as EventListener);
    };
  }, [searchQuery]);

  // Handle Dictionary Search
  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!searchQuery.trim()) return;

    setLoading(true);
    try {
      const data = await searchDictionaryWord(searchQuery);
      setWordData(data);
    } catch (error) {
      console.error("Search failed", error);
      // Optionally handle error state in UI
    } finally {
      setLoading(false);
    }
  };

  const clearSearch = () => {
    setSearchQuery('');
    if (wodData) setWordData(wodData);
    else loadWordOfDay();
  };

  const renderContent = () => {
    switch (view) {
      case AppView.HOME:
        return (
          <div className="flex flex-col items-center justify-center h-full p-6 overflow-y-auto">
             <div className="max-w-4xl w-full space-y-10">
                <div className="text-center space-y-4 mb-8">
                  <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight">
                    Master German with <span className="text-transparent bg-clip-text bg-gradient-to-r from-german-black via-german-red to-german-gold">AI</span>
                  </h1>
                  <p className="text-lg text-slate-600 max-w-xl mx-auto">
                    Your personalized path to fluency. Choose a tool below to get started.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Card 1: Dictionary */}
                  <button 
                    onClick={() => setView(AppView.DICTIONARY)}
                    className="group relative bg-white p-8 rounded-3xl shadow-sm border border-slate-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 text-left overflow-hidden"
                  >
                    <div className="absolute top-0 right-0 w-32 h-32 bg-amber-50 rounded-bl-full -mr-10 -mt-10 transition-transform group-hover:scale-110"></div>
                    <div className="relative z-10">
                      <div className="w-14 h-14 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center mb-6 group-hover:rotate-3 transition-transform">
                        <IconBook className="w-7 h-7" />
                      </div>
                      <h3 className="text-2xl font-bold text-slate-800 mb-2">Dictionary</h3>
                      <p className="text-slate-500 leading-relaxed">
                        Discover words, learn genders, and hear pronunciation.
                      </p>
                    </div>
                  </button>

                  {/* Card 2: Live Chat */}
                  <button 
                    onClick={() => setView(AppView.CHAT)}
                    className="group relative bg-white p-8 rounded-3xl shadow-sm border border-slate-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 text-left overflow-hidden"
                  >
                    <div className="absolute top-0 right-0 w-32 h-32 bg-green-50 rounded-bl-full -mr-10 -mt-10 transition-transform group-hover:scale-110"></div>
                    <div className="relative z-10">
                      <div className="w-14 h-14 bg-green-100 text-green-600 rounded-2xl flex items-center justify-center mb-6 group-hover:rotate-3 transition-transform">
                        <IconMessage className="w-7 h-7" />
                      </div>
                      <h3 className="text-2xl font-bold text-slate-800 mb-2">Live Chat</h3>
                      <p className="text-slate-500 leading-relaxed">
                        Practice real conversations with Hans, your AI tutor.
                      </p>
                    </div>
                  </button>

                  {/* Card 3: Writing */}
                  <button 
                    onClick={() => setView(AppView.WRITING)}
                    className="group relative bg-white p-8 rounded-3xl shadow-sm border border-slate-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 text-left overflow-hidden"
                  >
                    <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-bl-full -mr-10 -mt-10 transition-transform group-hover:scale-110"></div>
                    <div className="relative z-10">
                      <div className="w-14 h-14 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center mb-6 group-hover:rotate-3 transition-transform">
                        <IconPen className="w-7 h-7" />
                      </div>
                      <h3 className="text-2xl font-bold text-slate-800 mb-2">Writing</h3>
                      <p className="text-slate-500 leading-relaxed">
                        Get instant corrections and grammar explanations.
                      </p>
                    </div>
                  </button>

                  {/* Card 4: Grammar Analyzer */}
                  <button 
                    onClick={() => setView(AppView.GRAMMAR)}
                    className="group relative bg-white p-8 rounded-3xl shadow-sm border border-slate-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 text-left overflow-hidden"
                  >
                    <div className="absolute top-0 right-0 w-32 h-32 bg-purple-50 rounded-bl-full -mr-10 -mt-10 transition-transform group-hover:scale-110"></div>
                    <div className="relative z-10">
                      <div className="w-14 h-14 bg-purple-100 text-purple-600 rounded-2xl flex items-center justify-center mb-6 group-hover:rotate-3 transition-transform">
                        <span className="text-2xl">📝</span>
                      </div>
                      <h3 className="text-2xl font-bold text-slate-800 mb-2">Grammar</h3>
                      <p className="text-slate-500 leading-relaxed">
                        Analyze articles sentence by sentence (B2 Level).
                      </p>
                    </div>
                  </button>
                </div>
             </div>
          </div>
        );
      case AppView.DICTIONARY:
        return (
          <div className="flex flex-col items-center justify-start pt-8 h-full p-6 space-y-8 overflow-y-auto">
            <div className="text-center w-full max-w-xl">
              <h2 className="text-2xl font-bold text-slate-900 mb-6">Dictionary & Word of Day</h2>
              
              {/* Search Bar */}
              <form onSubmit={handleSearch} className="relative mb-4 group">
                <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                  <IconSearch className="h-6 w-6 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
                </div>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search a German word..."
                  className="block w-full pl-14 pr-14 py-5 text-lg bg-white border border-slate-200 rounded-full shadow-lg shadow-slate-200/50 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all"
                />
                {searchQuery && (
                  <button 
                    type="button"
                    onClick={clearSearch}
                    className="absolute inset-y-0 right-14 pr-2 flex items-center text-slate-300 hover:text-slate-500"
                  >
                    ✕
                  </button>
                )}
                 <button 
                    type="submit"
                    disabled={loading || !searchQuery.trim()}
                    className="absolute inset-y-2 right-2 px-6 bg-slate-900 text-white rounded-full hover:bg-slate-800 disabled:opacity-50 transition-colors font-bold text-sm"
                  >
                    Go
                  </button>
              </form>
            </div>
            
            <WordCard 
              data={wordData} 
              loading={loading} 
              onRefresh={loadWordOfDay}
              isWordOfDay={!searchQuery && wordData === wodData}
            />
            
            <div className="h-12"></div> {/* Spacer */}
          </div>
        );
      case AppView.CHAT:
        return (
          <div className="h-[calc(100vh-2rem)] max-w-4xl mx-auto p-2 sm:p-6">
             <ChatTutor />
          </div>
        );
      case AppView.WRITING:
        return (
          <div className="flex flex-col items-center justify-start pt-12 h-full p-6 overflow-y-auto">
             <div className="mb-8 text-center">
               <h1 className="text-3xl font-bold text-slate-900">Writing Lab</h1>
               <p className="text-slate-500 mt-2">Improve your grammar and style.</p>
             </div>
             <Translator />
          </div>
        );
      case AppView.GRAMMAR:
        return (
          <div className="w-full h-full overflow-y-auto">
            <ArticleAnalyzer />
          </div>
        );
    }
  };

  const NavItem = ({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) => (
    <button 
      onClick={() => { onClick(); setMobileMenuOpen(false); }}
      className={`w-full flex items-center gap-4 px-6 py-4 transition-all duration-200 border-r-4 ${
        active 
        ? 'bg-slate-50 border-german-gold text-slate-900' 
        : 'text-slate-400 border-transparent hover:text-slate-600 hover:bg-slate-50/50'
      }`}
    >
      <span className={active ? 'text-german-gold' : ''}>{icon}</span>
      <span className={`font-medium ${active ? 'font-bold' : ''}`}>{label}</span>
    </button>
  );

  return (
    <div className="flex h-screen bg-slate-50 font-sans">
      {/* Desktop Sidebar */}
      <div className="hidden md:flex flex-col w-72 bg-white border-r border-slate-200 h-full shadow-[4px_0_24px_rgba(0,0,0,0.02)] z-10">
        <div className="p-8 cursor-pointer" onClick={() => setView(AppView.HOME)}>
          <h1 className="text-2xl font-black tracking-tighter flex items-center gap-2">
            <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-german-black via-german-red to-german-gold shadow-md"></span>
            DeutschFlow
          </h1>
        </div>
        
        <nav className="flex-1 pt-4">
          <NavItem 
            active={view === AppView.HOME} 
            onClick={() => setView(AppView.HOME)} 
            icon={<IconHome />} 
            label="Home" 
          />
          <NavItem 
            active={view === AppView.DICTIONARY} 
            onClick={() => setView(AppView.DICTIONARY)} 
            icon={<IconBook />} 
            label="Dictionary" 
          />
          <NavItem 
            active={view === AppView.CHAT} 
            onClick={() => setView(AppView.CHAT)} 
            icon={<IconMessage />} 
            label="Live Chat" 
          />
          <NavItem 
            active={view === AppView.WRITING} 
            onClick={() => setView(AppView.WRITING)} 
            icon={<IconPen />} 
            label="Writing" 
          />
          <NavItem 
            active={view === AppView.GRAMMAR} 
            onClick={() => setView(AppView.GRAMMAR)} 
            icon={<span className="text-xl">📝</span>} 
            label="Grammar" 
          />
        </nav>
      </div>

      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 w-full h-16 bg-white/80 backdrop-blur-md border-b border-slate-200 flex items-center justify-between px-6 z-50">
        <h1 className="font-bold text-slate-900 flex items-center gap-2" onClick={() => setView(AppView.HOME)}>
          <span className="w-6 h-6 rounded bg-gradient-to-br from-german-black via-german-red to-german-gold"></span>
          DeutschFlow
        </h1>
        <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="p-2 text-slate-600">
          <IconMenu />
        </button>
      </div>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 bg-white pt-20 md:hidden animate-in slide-in-from-top-10 duration-200">
          <nav>
            <NavItem active={view === AppView.HOME} onClick={() => setView(AppView.HOME)} icon={<IconHome />} label="Home" />
            <NavItem active={view === AppView.DICTIONARY} onClick={() => setView(AppView.DICTIONARY)} icon={<IconBook />} label="Dictionary" />
            <NavItem active={view === AppView.CHAT} onClick={() => setView(AppView.CHAT)} icon={<IconMessage />} label="Live Chat" />
            <NavItem active={view === AppView.WRITING} onClick={() => setView(AppView.WRITING)} icon={<IconPen />} label="Writing" />
            <NavItem active={view === AppView.GRAMMAR} onClick={() => setView(AppView.GRAMMAR)} icon={<span className="text-xl">📝</span>} label="Grammar" />
          </nav>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 h-full overflow-y-auto pt-16 md:pt-0 relative">
        {/* Background decoration for home */}
        {view === AppView.HOME && (
          <div className="absolute top-0 left-0 w-full h-full pointer-events-none z-0 opacity-50">
            <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-german-gold/5 rounded-full blur-3xl"></div>
            <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-german-red/5 rounded-full blur-3xl"></div>
          </div>
        )}
        <div className="relative z-10 h-full">
          {renderContent()}
        </div>
      </main>
    </div>
  );
};

export default App;