import React, { useState, useEffect, useRef } from 'react';
import { Volume2, VolumeX, MapPin, Camera, ClipboardList, ShieldCheck, Globe, LogOut, Mic, User, Building2, Check } from 'lucide-react';
import { LANGUAGES, UI_STRINGS } from '../utils/translations';
import { speakText, playAudioFeedback } from '../utils/speech';

export default function Navbar({ 
  currentLang, 
  setLanguage, 
  activeTab, 
  setActiveTab, 
  currentUser, 
  onLogout,
  voiceActive,
  setVoiceActive
}) {
  const [langMenuOpen, setLangMenuOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);

  const profileMenuRef = useRef(null);
  const langMenuRef = useRef(null);

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(e.target)) {
        setProfileMenuOpen(false);
      }
      if (langMenuRef.current && !langMenuRef.current.contains(e.target)) {
        setLangMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLangChange = (lang) => {
    playAudioFeedback('click');
    setLanguage(lang.code);
    setLangMenuOpen(false);

    if (voiceActive) {
      const greetings = {
        hi: 'नमस्ते! अब आप हिंदी में सुनेंगे।',
        te: 'నమస్కారం! ఇప్పుడు మీరు తెలుగులో వినవచ్చు.',
        ta: 'வணக்கம்! இனி நீங்கள் தமிழில் கேட்கலாம்.',
        kn: 'ನಮಸ್ಕಾರ! ಇನ್ನು ನೀವು ಕನ್ನಡದಲ್ಲಿ ಕೇಳಬಹುದು.',
        mr: 'नमस्कार! आता तुम्ही मराठीत ऐकू शकता.',
        en: 'Welcome! Language changed to English.'
      };
      speakText(greetings[lang.code] || greetings.te, lang.code);
    }
  };

  const currentLangObj = LANGUAGES.find(l => l.code === currentLang) || LANGUAGES[0];

  return (
    <header className="sticky top-0 z-50 bg-white/75 backdrop-blur-xl border-b border-white/50 shadow-[0_4px_20px_rgba(0,0,0,0.04)] supports-[backdrop-filter]:bg-white/65">
      {/* 1. TOP ROW: Brand (Left) & Voice + Language + Profile (Top Right Corner) */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2.5 flex items-center justify-between gap-4">
        
        {/* LEFT: Brand Logo & Title */}
        <div
          onClick={() => setActiveTab('report')}
          className="flex items-center space-x-3 cursor-pointer group flex-shrink-0"
        >
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/25 group-hover:scale-105 group-active:scale-95 transition-transform duration-200">
            <Building2 className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              {UI_STRINGS.appName[currentLang] || 'జనసేవ'}
            </h1>
            <p className="text-[11px] text-slate-500 font-medium hidden sm:block">Public Grievance & Citizen Portal</p>
          </div>
        </div>

        {/* TOP RIGHT CORNER: Voice Toggle + Language Switcher + User Profile Menu */}
        <div className="flex items-center space-x-2 sm:space-x-3 flex-shrink-0">
          
          {/* Voice Assistant Toggle */}
          {currentUser && (
            <button
              onClick={() => {
                const next = !voiceActive;
                setVoiceActive(next);
                playAudioFeedback('click');
                if (next) {
                  speakText(currentLang === 'te' ? 'వాయిస్ అసిస్టెంట్ ఆన్ అయింది' : 'Voice assistant turned on', currentLang);
                }
              }}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-black shadow-sm transition-all duration-200 transform active:scale-90 hover:scale-105 backdrop-blur-md cursor-pointer ${
                voiceActive
                  ? 'bg-amber-400 text-slate-950 animate-pulse border border-amber-500 ring-2 ring-amber-200'
                  : 'bg-white/80 text-slate-600 hover:bg-white border border-slate-200/80 hover:text-slate-900'
              }`}
              title="Voice Assistant Toggle"
            >
              {voiceActive ? <Mic className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline">
                {voiceActive
                  ? (currentLang === 'te' ? 'వాయిస్ ఆన్' : 'Voice Active')
                  : (currentLang === 'te' ? 'వాయిస్ ఆఫ్' : 'Voice Muted')}
              </span>
            </button>
          )}

          {/* Language Switcher Dropdown */}
          <div ref={langMenuRef} className="relative">
            <button
              onClick={() => setLangMenuOpen(!langMenuOpen)}
              className="flex items-center space-x-1.5 bg-white/80 hover:bg-white text-slate-800 px-3 py-1.5 rounded-xl border border-slate-200/80 text-xs font-bold transition-all duration-200 transform active:scale-90 hover:scale-105 backdrop-blur-md shadow-xs cursor-pointer"
            >
              <Globe className="w-3.5 h-3.5 text-blue-600" />
              <span>{currentLangObj.label}</span>
              <span className="text-[10px] text-slate-400">▼</span>
            </button>

            {langMenuOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white/95 backdrop-blur-xl text-slate-800 rounded-2xl shadow-2xl border border-white/60 py-1.5 z-50 animate-in fade-in slide-in-from-top-2">
                <div className="px-3 py-1 text-[11px] font-bold uppercase text-slate-400 tracking-wider">
                  Select Language
                </div>
                {LANGUAGES.map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => handleLangChange(lang)}
                    className={`w-full text-left px-3.5 py-2 text-sm flex items-center justify-between hover:bg-amber-50 transition active:scale-95 ${
                      currentLang === lang.code ? 'bg-amber-100/70 font-bold text-amber-900' : 'text-slate-700'
                    }`}
                  >
                    <span className="flex items-center space-x-2">
                      <span className="text-lg">{lang.flag}</span>
                      <span>{lang.label}</span>
                    </span>
                    <span className="text-xs text-slate-400">({lang.name})</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* PROFILE ICON & CLICKABLE DROPDOWN MENU WITH DETAILS & LOGOUT */}
          {currentUser && (
            <div ref={profileMenuRef} className="relative pl-2 sm:pl-3 border-l border-slate-200/80">
              
              {/* Profile Avatar Button (Click opens details & logout) */}
              <button
                onClick={() => {
                  playAudioFeedback('click');
                  setProfileMenuOpen(!profileMenuOpen);
                }}
                className="flex items-center space-x-1.5 p-1 rounded-2xl hover:bg-slate-100/80 transition-all duration-200 transform active:scale-95 cursor-pointer group"
                title="Citizen Profile Menu (Click to view details & logout)"
              >
                <div className="relative">
                  <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-gradient-to-tr from-blue-600 via-indigo-600 to-slate-800 text-white flex items-center justify-center shadow-sm ring-2 ring-blue-100 group-hover:ring-blue-300 transition-all">
                    <User className="w-5 h-5 text-white" />
                  </div>
                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-white rounded-full" title="Active" />
                </div>
                <span className="text-[10px] text-slate-400 group-hover:text-slate-600 transition-colors">▼</span>
              </button>

              {/* Profile Details Dropdown Card (Opens on click) */}
              {profileMenuOpen && (
                <div className="absolute right-0 mt-2 w-72 sm:w-80 bg-white/95 backdrop-blur-xl text-slate-800 rounded-3xl shadow-2xl border border-white/60 p-4 z-50 animate-in fade-in slide-in-from-top-2 space-y-3.5">
                  
                  {/* User Identity Header */}
                  <div className="flex items-center space-x-3 pb-3 border-b border-slate-100">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-slate-800 text-white flex items-center justify-center shadow-md flex-shrink-0">
                      <User className="w-6 h-6 text-white" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-black text-slate-900 truncate">{currentUser.name}</h4>
                        <span className="text-[10px] bg-emerald-100 text-emerald-800 border border-emerald-300 px-2 py-0.5 rounded-full font-black uppercase flex items-center space-x-1">
                          <Check className="w-3 h-3 text-emerald-600" />
                          <span>Verified</span>
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 font-semibold truncate mt-0.5">
                        ID: {currentUser.idType?.toUpperCase()} ({currentUser.idNumber || 'Government ID'})
                      </p>
                    </div>
                  </div>

                  {/* Citizen Details List */}
                  <div className="space-y-2 bg-slate-50/80 p-3 rounded-2xl border border-slate-100 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 font-bold">User Mode:</span>
                      <span className="font-black text-slate-800">
                        {currentUser.userType === 'illiterate' ? 'వాయిస్ మోడ్' : 'సాధారణ మోడ్'}
                      </span>
                    </div>

                    {currentUser.areaName && (
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500 font-bold">Area:</span>
                        <span className="font-bold text-blue-700 truncate max-w-[140px]">
                          {currentUser.areaName} ({currentUser.ward || 'Ward'})
                        </span>
                      </div>
                    )}

                    {currentUser.phone && (
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500 font-bold">Phone:</span>
                        <span className="font-bold text-slate-700">{currentUser.phone}</span>
                      </div>
                    )}

                    {currentUser.username && (
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500 font-bold">Username:</span>
                        <span className="font-bold text-slate-700">@{currentUser.username}</span>
                      </div>
                    )}
                  </div>

                  {/* Logout Button inside Dropdown */}
                  <button
                    onClick={() => {
                      setProfileMenuOpen(false);
                      playAudioFeedback('click');
                      onLogout();
                    }}
                    className="w-full py-2.5 px-4 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 font-black text-xs sm:text-sm flex items-center justify-center space-x-2 transition-all duration-200 transform active:scale-95 cursor-pointer border border-red-200 shadow-xs"
                    title="లాగౌట్ (Logout)"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>లాగౌట్ (Logout)</span>
                  </button>

                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 2. BOTTOM ROW: FULL-WIDTH NAVIGATION BAR WITH INTERACTIVE TOUCH ANIMATIONS */}
      <div className="border-t border-slate-200/50 bg-white/40 backdrop-blur-md px-3 sm:px-6 py-2 sm:py-2.5">
        <div className={`max-w-7xl mx-auto grid gap-2 sm:gap-3 w-full ${
          (currentUser?.role === 'authority' || currentUser?.role === 'worker')
            ? 'grid-cols-2 sm:grid-cols-4' 
            : 'grid-cols-1 sm:grid-cols-3'
        }`}>
          
          {/* TAB 1: Report Problem */}
          <button
            onClick={() => { playAudioFeedback('click'); setActiveTab('report'); }}
            className={`relative overflow-hidden group flex items-center justify-center space-x-2 px-3 py-2.5 sm:py-3 rounded-2xl text-xs sm:text-sm font-black transition-all duration-200 ease-out transform active:scale-95 hover:scale-[1.02] hover:-translate-y-0.5 active:translate-y-0 cursor-pointer select-none ${
              activeTab === 'report'
                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/30 ring-2 ring-blue-400/60'
                : 'bg-white/80 hover:bg-white text-slate-700 hover:text-blue-600 border border-slate-200/80 hover:border-blue-300 shadow-xs hover:shadow-md'
            }`}
          >
            {/* Shimmer sweep effect */}
            <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/25 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-in-out pointer-events-none" />
            <Camera className={`w-4 h-4 sm:w-5 sm:h-5 transition-transform duration-200 group-hover:scale-125 group-active:scale-90 ${
              activeTab === 'report' ? 'text-white' : 'text-blue-600'
            }`} />
            <span className="truncate">{UI_STRINGS.navReport[currentLang] || UI_STRINGS.navReport.en}</span>
          </button>

          {/* TAB 2: Reported Problems / Feed */}
          <button
            onClick={() => { playAudioFeedback('click'); setActiveTab('feed'); }}
            className={`relative overflow-hidden group flex items-center justify-center space-x-2 px-3 py-2.5 sm:py-3 rounded-2xl text-xs sm:text-sm font-black transition-all duration-200 ease-out transform active:scale-95 hover:scale-[1.02] hover:-translate-y-0.5 active:translate-y-0 cursor-pointer select-none ${
              activeTab === 'feed'
                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/30 ring-2 ring-blue-400/60'
                : 'bg-white/80 hover:bg-white text-slate-700 hover:text-blue-600 border border-slate-200/80 hover:border-blue-300 shadow-xs hover:shadow-md'
            }`}
          >
            <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/25 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-in-out pointer-events-none" />
            <ClipboardList className={`w-4 h-4 sm:w-5 sm:h-5 transition-transform duration-200 group-hover:scale-125 group-active:scale-90 ${
              activeTab === 'feed' ? 'text-white' : 'text-indigo-600'
            }`} />
            <span className="truncate">{UI_STRINGS.navFeed[currentLang] || UI_STRINGS.navFeed.en}</span>
          </button>

          {/* TAB 3: Issue Map */}
          <button
            onClick={() => { playAudioFeedback('click'); setActiveTab('map'); }}
            className={`relative overflow-hidden group flex items-center justify-center space-x-2 px-3 py-2.5 sm:py-3 rounded-2xl text-xs sm:text-sm font-black transition-all duration-200 ease-out transform active:scale-95 hover:scale-[1.02] hover:-translate-y-0.5 active:translate-y-0 cursor-pointer select-none ${
              activeTab === 'map'
                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/30 ring-2 ring-blue-400/60'
                : 'bg-white/80 hover:bg-white text-slate-700 hover:text-blue-600 border border-slate-200/80 hover:border-blue-300 shadow-xs hover:shadow-md'
            }`}
          >
            <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/25 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-in-out pointer-events-none" />
            <MapPin className={`w-4 h-4 sm:w-5 sm:h-5 transition-transform duration-200 group-hover:scale-125 group-active:scale-90 ${
              activeTab === 'map' ? 'text-white' : 'text-emerald-600'
            }`} />
            <span className="truncate">{UI_STRINGS.navMap[currentLang] || UI_STRINGS.navMap.en}</span>
          </button>

          {/* TAB 4: Authority & Field Worker Portal */}
          {(currentUser?.role === 'authority' || currentUser?.role === 'worker') && (
            <button
              onClick={() => { playAudioFeedback('click'); setActiveTab('authority'); }}
              className={`relative overflow-hidden group flex items-center justify-center space-x-2 px-3 py-2.5 sm:py-3 rounded-2xl text-xs sm:text-sm font-black transition-all duration-200 ease-out transform active:scale-95 hover:scale-[1.02] hover:-translate-y-0.5 active:translate-y-0 cursor-pointer select-none ${
                activeTab === 'authority'
                  ? 'bg-gradient-to-r from-indigo-700 to-purple-700 text-white shadow-lg shadow-indigo-500/30 ring-2 ring-indigo-400/60'
                  : 'bg-white/80 hover:bg-white text-slate-700 hover:text-purple-700 border border-slate-200/80 hover:border-purple-300 shadow-xs hover:shadow-md'
              }`}
            >
              <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/25 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-in-out pointer-events-none" />
              <ShieldCheck className={`w-4 h-4 sm:w-5 sm:h-5 transition-transform duration-200 group-hover:scale-125 group-active:scale-90 ${
                activeTab === 'authority' ? 'text-white' : 'text-purple-600'
              }`} />
              <span className="truncate">
                {currentUser?.role === 'worker' ? 'Worker Dashboard' : (UI_STRINGS.navAuthority[currentLang] || UI_STRINGS.navAuthority.en)}
              </span>
            </button>
          )}

        </div>
      </div>
    </header>
  );
}
