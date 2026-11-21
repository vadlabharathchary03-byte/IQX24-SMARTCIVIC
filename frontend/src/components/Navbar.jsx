import React, { useState, useEffect, useRef } from 'react';
import { Volume2, VolumeX, MapPin, Camera, ClipboardList, ShieldCheck, Globe, LogOut, Mic, User, Building2, Check, Siren, PhoneCall, X, Flame, HeartPulse, ShieldAlert } from 'lucide-react';
import { LANGUAGES, UI_STRINGS } from '../utils/translations';
import { speakText, playAudioFeedback } from '../utils/speech';

// Emergency Services Directory for Quick Citizen Access
const EMERGENCY_SERVICES = [
  {
    id: 'police',
    number: '112 / 100',
    dial: '112',
    icon: '🚓',
    badge: 'Police • 24x7',
    name: {
      en: 'Police Emergency Service',
      te: 'పోలీస్ అత్యవసర సర్వీస్',
      hi: 'पुलिस आपातकालीन सेवा',
      ta: 'காவல்துறை அவசர சேவை',
      kn: 'ಪೊಲೀಸ್ ತುರ್ತು ಸೇವೆ',
      mr: 'पोलीस आपत्कालीन सेवा'
    },
    desc: {
      en: 'Crimes, theft, security threats, road accidents & law order',
      te: 'నేరాలు, భద్రతా ప్రమాదాలు, దాడులు, రోడ్డు ప్రమాదాలు & రక్షణ',
      hi: 'अपराध, सुरक्षा खतरा, दुर्घटना और कानून व्यवस्था',
      ta: 'குற்றங்கள், பாதுகாப்பு அச்சுறுத்தல், விபத்துக்கள்',
      kn: 'ಅಪರಾಧಗಳು, ಭದ್ರತಾ ಅಪಾಯ, ಅಪಘಾತಗಳು',
      mr: 'गुन्हे, सुरक्षा धोके, अपघात आणि कायदा सुव्यवस्था'
    },
    border: 'border-blue-200 hover:border-blue-400 bg-blue-50/60',
    btnColor: 'bg-blue-600 hover:bg-blue-700 text-white'
  },
  {
    id: 'ambulance',
    number: '108 / 102',
    dial: '108',
    icon: '🚑',
    badge: 'Medical • 24x7',
    name: {
      en: 'Ambulance & Medical Service',
      te: 'అంబులెన్స్ & అత్యవసర వైద్య సర్వీస్',
      hi: 'एम्बुलेंस और चिकित्सा सेवा',
      ta: 'ஆம்புலன்ஸ் & அவசர மருத்துவ சேவை',
      kn: 'ಆಂಬ್ಯುಲೆನ್ಸ್ ಮತ್ತು ವೈದ್ಯಕೀಯ ಸೇವೆ',
      mr: 'रुग्णवाहिका आणि वैद्यकीय सेवा'
    },
    desc: {
      en: 'Severe injury, heart attack, unconsciousness & trauma care',
      te: 'తీవ్ర గాయాలు, గుండెపోటు, ప్రసవాలు, స్పృహతప్పడం & అత్యవసర వైద్యం',
      hi: 'गंभीर चोट, दिल का दौरा, प्रसव और आघात चिकित्सा',
      ta: 'கடுமையான காயம், மாரடைப்பு, அவசர மருத்துவ உதவி',
      kn: 'ತೀವ್ರ ಗಾಯ, ಹೃದಯಾಘಾತ, ತುರ್ತು ಚಿಕಿತ್ಸೆ',
      mr: 'गंभीर दुखापत, हृदयविकार, तात्काळ वैद्यकीय मदत'
    },
    border: 'border-emerald-200 hover:border-emerald-400 bg-emerald-50/60',
    btnColor: 'bg-emerald-600 hover:bg-emerald-700 text-white'
  },
  {
    id: 'fire',
    number: '101',
    dial: '101',
    icon: '🚒',
    badge: 'Fire & Rescue • 24x7',
    name: {
      en: 'Fire & Rescue Service',
      te: 'ఫైర్ సర్వీస్ & అగ్నిమాపక రక్షణ',
      hi: 'अग्निशमन और बचाव सेवा',
      ta: 'தீயணைப்பு மற்றும் மீட்பு சேவை',
      kn: 'ಅಗ್ನಿಶಾಮಕ ಮತ್ತು ರಕ್ಷಣಾ ಸೇವೆ',
      mr: 'अग्निशामक आणि बचाव सेवा'
    },
    desc: {
      en: 'Fire outbreaks, gas leaks, building collapse & disaster relief',
      te: 'అగ్ని ప్రమాదాలు, గ్యాస్ లీకేజీలు, భవన కూలిపోవడం & విపత్తు రక్షణ',
      hi: 'आग लगना, गैस रिसाव, भवन ढहना और आपदा राहत',
      ta: 'தீ விபத்துக்கள், எரிவாயு கசிவு, பேரிடர் மீட்பு',
      kn: 'ಬೆಂಕಿ ಅವಘಡಗಳು, ಅನಿಲ ಸೋರಿಕೆ, ವಿಪತ್ತು ರಕ್ಷಣೆ',
      mr: 'आग, गॅस गळती आणि आपत्ती निवारण'
    },
    border: 'border-red-200 hover:border-red-400 bg-red-50/60',
    btnColor: 'bg-red-600 hover:bg-red-700 text-white'
  }
];

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
  const [emergencyModalOpen, setEmergencyModalOpen] = useState(false);

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

        {/* TOP RIGHT CORNER: Emergency Alert SOS + Voice Toggle + Language Switcher + User Profile Menu */}
        <div className="flex items-center space-x-2 sm:space-x-3 flex-shrink-0">
          
          {/* 🚨 EMERGENCY ALERT SOS BUTTON */}
          <button
            type="button"
            onClick={() => {
              setEmergencyModalOpen(true);
              playAudioFeedback('vote');
              if (voiceActive) {
                speakText(currentLang === 'te' ? 'అత్యవసర సేవల హెల్ప్‌లైన్. పోలీస్ 100, అంబులెన్స్ 108, ఫైర్ 101' : 'Emergency alert. Police 112, Ambulance 108, Fire 101', currentLang);
              }
            }}
            className="flex items-center space-x-1.5 px-2.5 py-1.5 sm:px-3.5 sm:py-2 rounded-xl text-xs sm:text-sm font-black bg-gradient-to-r from-red-600 via-rose-600 to-red-700 hover:from-red-700 hover:to-rose-800 text-white shadow-md shadow-red-500/25 hover:shadow-red-500/40 hover:scale-105 active:scale-95 transition-all duration-200 border border-red-400 ring-2 ring-red-400/20 cursor-pointer animate-pulse select-none flex-shrink-0"
            title="Emergency Alert / SOS (పోలీస్, అంబులెన్స్, ఫైర్)"
          >
            <Siren className="w-4 h-4 text-white animate-bounce" />
            <span className="font-extrabold uppercase tracking-wide">
              {currentLang === 'te' ? 'అత్యవసర అలర్ట్ (SOS)' : 'Emergency SOS'}
            </span>
          </button>

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
        <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3 w-full">
          
          {/* TAB 1 FOR CITIZEN: Report Problem (Hidden in Authority & Worker Portals) */}
          {currentUser?.role !== 'authority' && currentUser?.role !== 'worker' && (
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
          )}

          {/* TAB 1 FOR AUTHORITY / WORKER: Dedicated Dashboard Tab */}
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

        </div>
      </div>

      {/* ================= EMERGENCY ALERT SERVICES MODAL ================= */}
      {emergencyModalOpen && (
        <div className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden border-2 border-red-500 text-slate-800 animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-red-600 via-rose-600 to-red-700 text-white p-5 sm:p-6 relative">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2.5">
                  <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center text-white border border-white/30">
                    <Siren className="w-6 h-6 animate-pulse" />
                  </div>
                  <div>
                    <h3 className="text-lg sm:text-xl font-black tracking-tight">
                      {currentLang === 'te' ? '🚨 అత్యవసర సహాయ సేవలు (SOS)' : '🚨 National Emergency Services'}
                    </h3>
                    <p className="text-xs text-rose-100 font-medium">
                      {currentLang === 'te' ? '24/7 తక్షణ అత్యవసర స్పందన హెల్ప్‌లైన్లు' : '24x7 Immediate Citizen Emergency Response'}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setEmergencyModalOpen(false);
                    playAudioFeedback('click');
                  }}
                  className="w-8 h-8 rounded-full bg-black/20 hover:bg-black/40 text-white flex items-center justify-center transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Citizen Location Banner for Dispatcher */}
              {currentUser?.areaName && (
                <div className="mt-3.5 p-2.5 rounded-xl bg-black/25 border border-white/30 backdrop-blur text-xs flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <MapPin className="w-4 h-4 text-amber-300 flex-shrink-0" />
                    <span>
                      <strong className="text-amber-200">{currentLang === 'te' ? 'మీ ప్రస్తుత లొకేషన్:' : 'Your Location:'}</strong> {currentUser.areaName} ({currentUser.ward || 'Ward'})
                    </span>
                  </div>
                  <span className="text-[10px] text-rose-200 font-bold uppercase tracking-wider hidden sm:inline">
                    {currentLang === 'te' ? 'ఆపరేటర్‌కు చెప్పండి' : 'Tell Dispatcher'}
                  </span>
                </div>
              )}
            </div>

            {/* 3 Core Emergency Services: Police, Ambulance, Fire */}
            <div className="p-5 sm:p-6 space-y-3 max-h-[72vh] overflow-y-auto">
              {EMERGENCY_SERVICES.map((srv) => (
                <div
                  key={srv.id}
                  className={`p-3.5 sm:p-4 rounded-2xl border-2 transition hover:shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${srv.border}`}
                >
                  <div className="flex items-start space-x-3">
                    <span className="text-3xl flex-shrink-0">{srv.icon}</span>
                    <div>
                      <div className="flex items-center space-x-2">
                        <h4 className="text-sm sm:text-base font-black text-slate-900">
                          {srv.name[currentLang] || srv.name.en}
                        </h4>
                        <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-white border border-slate-200 text-slate-600">
                          {srv.badge}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 font-medium mt-0.5 max-w-sm leading-relaxed">
                        {srv.desc[currentLang] || srv.desc.en}
                      </p>
                    </div>
                  </div>

                  {/* 1-Tap Call Dial Button */}
                  <a
                    href={`tel:${srv.dial}`}
                    className={`inline-flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl font-black text-xs sm:text-sm shadow-md transition transform active:scale-95 flex-shrink-0 cursor-pointer ${srv.btnColor}`}
                  >
                    <PhoneCall className="w-4 h-4" />
                    <span>Call {srv.number}</span>
                  </a>
                </div>
              ))}

              {/* Additional Helplines Strip */}
              <div className="pt-2 border-t border-slate-100">
                <p className="text-[11px] font-black text-slate-400 uppercase tracking-wider mb-2">
                  {currentLang === 'te' ? 'ఇతర ముఖ్యమైన అత్యవసర హెల్ప్‌లైన్లు:' : 'Other National Helplines:'}
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  <a
                    href="tel:1091"
                    className="p-2.5 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-xl text-center transition flex flex-col items-center"
                  >
                    <span className="text-xs font-black text-purple-900">👩 Women Safety</span>
                    <span className="text-sm font-black text-purple-700">1091</span>
                  </a>

                  <a
                    href="tel:1098"
                    className="p-2.5 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-xl text-center transition flex flex-col items-center"
                  >
                    <span className="text-xs font-black text-amber-900">👶 Childline</span>
                    <span className="text-sm font-black text-amber-700">1098</span>
                  </a>

                  <a
                    href="tel:04021111111"
                    className="p-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-center transition flex flex-col items-center col-span-2 sm:col-span-1"
                  >
                    <span className="text-xs font-black text-slate-900">🏛️ GHMC Disaster</span>
                    <span className="text-xs font-black text-slate-700">040-21111111</span>
                  </a>
                </div>
              </div>

              {/* Read Aloud Helper & Close Button */}
              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={() => {
                    const speech = currentLang === 'te'
                      ? 'అత్యవసర హెల్ప్‌లైన్లు: పోలీస్ సర్వీస్ 112 లేదా 100. అంబులెన్స్ సర్వీస్ 108. ఫైర్ సర్వీస్ 101. మహిళల రక్షణ 1091.'
                      : 'Emergency numbers: Police dial 112 or 100. Ambulance dial 108. Fire service dial 101. Women helpline dial 1091.';
                    speakText(speech, currentLang);
                  }}
                  className="inline-flex items-center space-x-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 py-1.5 px-3 rounded-lg hover:bg-slate-100 transition cursor-pointer"
                >
                  <Volume2 className="w-4 h-4 text-blue-600" />
                  <span>{currentLang === 'te' ? 'వాయిస్ ద్వారా చదవండి' : 'Read Numbers Aloud'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setEmergencyModalOpen(false);
                    playAudioFeedback('click');
                  }}
                  className="px-5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition cursor-pointer"
                >
                  {currentLang === 'te' ? 'మూసివేయి (Close)' : 'Close'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
