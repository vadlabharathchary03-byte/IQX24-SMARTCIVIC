import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import AuthPortal from './components/AuthPortal';
import ReportIssue from './components/ReportIssue';
import IssueFeed from './components/IssueFeed';
import MapView from './components/MapView';
import AuthorityDashboard from './components/AuthorityDashboard';
import WorkerDashboard from './components/WorkerDashboard';
import { Volume2, Heart } from 'lucide-react';
import { speakText } from './utils/speech';

export default function App() {
  const [currentLang, setCurrentLang] = useState(() => {
    try {
      const savedLang = localStorage.getItem('janseva_lang');
      if (savedLang) return savedLang;
      const savedUser = localStorage.getItem('janseva_user');
      if (savedUser) {
        const u = JSON.parse(savedUser);
        if (u.language) return u.language;
      }
    } catch (_) {}
    return 'en'; // English as default language
  });

  const handleSetLanguage = (lang) => {
    setCurrentLang(lang);
    try {
      localStorage.setItem('janseva_lang', lang);
    } catch (_) {}
  };
  const [activeTab, setActiveTab] = useState(() => {
    try {
      const saved = localStorage.getItem('janseva_user');
      if (saved) {
        const u = JSON.parse(saved);
        if (u.role === 'authority' || u.role === 'worker') return 'authority';
      }
      return 'report';
    } catch {
      return 'report';
    }
  });
  
  // User Authentication State
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = localStorage.getItem('janseva_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  // Voice Assistant Active state:
  // If user is Illiterate -> TRUE (full spoken guidance)
  // If user is Literate -> FALSE (voice assistant not needed)
  const [voiceActive, setVoiceActive] = useState(() => {
    try {
      const saved = localStorage.getItem('janseva_user');
      if (saved) {
        const u = JSON.parse(saved);
        return u.userType === 'illiterate';
      }
      return false;
    } catch {
      return false;
    }
  });

  const handleLoginSuccess = (user) => {
    setCurrentUser(user);
    try {
      localStorage.setItem('janseva_user', JSON.stringify(user));
    } catch (e) {
      console.warn("Storage error:", e);
    }

    if (user.language) {
      setCurrentLang(user.language);
    }

    const isIlliterate = user.userType === 'illiterate';
    setVoiceActive(isIlliterate);

    // If official authority or worker, redirect immediately to authority/worker dashboard!
    if (user.role === 'authority' || user.role === 'worker') {
      setActiveTab('authority');
    } else {
      setActiveTab('report');
    }

    // If illiterate: Speak welcoming instructions immediately!
    if (isIlliterate) {
      const welcomeMsgs = {
        te: `నమస్కారం ${user.name} గారు! జనసేవకు స్వాగతం. మీరు వాయిస్ అసిస్టెంట్ మోడ్‌లో ఉన్నారు. మీ సమస్యను ఫోటో తీసి లేదా మాట్లాడి తెలియజేయవచ్చు.`,
        hi: `नमस्ते ${user.name} जी! जनसेवा में स्वागत है। आप वॉयस असिस्टेंट मोड में हैं। फोटो खींचकर या बोलकर समस्या दर्ज करें।`,
        en: `Welcome ${user.name}! You are in Voice Assistant mode. Report issues using photos and voice notes.`
      };
      setTimeout(() => {
        speakText(welcomeMsgs[user.language || 'te'] || welcomeMsgs.te, user.language || 'te');
      }, 400);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('janseva_user');
    setCurrentUser(null);
    setVoiceActive(false);
    setActiveTab('report');
  };

  // If user is not registered or logged in, show AuthPortal first!
  if (!currentUser) {
    return (
      <AuthPortal
        currentLang={currentLang}
        setLanguage={handleSetLanguage}
        onLoginSuccess={handleLoginSuccess}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans">
      {/* Top Accessible Navbar with Spoken Language Selector, User Profile & Guide */}
      <Navbar
        currentLang={currentLang}
        setLanguage={handleSetLanguage}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        currentUser={currentUser}
        onLogout={handleLogout}
        voiceActive={voiceActive}
        setVoiceActive={setVoiceActive}
      />

      {/* Main Tab View */}
      <main className="flex-1 pb-16">
        {activeTab === 'report' && (
          <ReportIssue
            currentLang={currentLang}
            currentUser={currentUser}
            voiceActive={voiceActive}
            onGoToFeed={() => setActiveTab('feed')}
            onIssueCreated={() => setActiveTab('feed')}
          />
        )}

        {activeTab === 'feed' && (
          <IssueFeed
            currentLang={currentLang}
            voiceActive={voiceActive}
          />
        )}

        {activeTab === 'map' && (
          <MapView
            currentLang={currentLang}
            voiceActive={voiceActive}
            currentUser={currentUser}
          />
        )}

        {activeTab === 'authority' && (
          currentUser.role === 'worker' ? (
            <WorkerDashboard
              currentLang={currentLang}
              currentUser={currentUser}
            />
          ) : (
            <AuthorityDashboard
              currentLang={currentLang}
              currentUser={currentUser}
            />
          )
        )}
      </main>

      {/* Floating Voice Assist Button (Especially for Illiterate Users) */}
      <div className="fixed bottom-4 right-4 z-40">
        <button
          onClick={() => {
            const msgs = {
              te: 'ఇది జనసేవ వేదిక. మీ వీధిలో గుంతలు, చెత్త, లైటు లేదా నీటి లీకేజీ ఉంటే వెంటనే ఫోటో తీసి లేదా మాట్లాడి తెలియజేయండి.',
              hi: 'यह जनसेवा मंच है। अगर आपकी गली में खड्डा, कचरा, बंद लाइट या पानी लीकेज है, तो फोटो खींचकर रिपोर्ट करें।',
              en: 'This is JanSeva. Report civic problems like potholes, overflowing garbage, broken streetlights or water leaks with photos.'
            };
            speakText(msgs[currentLang] || msgs.te, currentLang);
          }}
          className={`font-black px-4 py-2.5 rounded-full shadow-2xl flex items-center space-x-2 border-2 border-white transition transform active:scale-95 ${
            voiceActive
              ? 'bg-amber-400 hover:bg-amber-500 text-slate-950 animate-bounce'
              : 'bg-blue-600 hover:bg-blue-700 text-white'
          }`}
          title="Instant Voice Guidance"
        >
          <Volume2 className="w-5 h-5" />
          <span className="text-xs sm:text-sm font-black">
            {currentLang === 'te' ? 'వాయిస్ సహాయం (Help)' :
             currentLang === 'hi' ? 'आवाज़ में सुनें' :
             'Voice Help'}
          </span>
        </button>
      </div>

      {/* Accessible Footer */}
      <footer className="bg-white border-t border-slate-200 py-6 text-center text-xs text-slate-500">
        <div className="max-w-4xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="font-bold text-slate-700 flex items-center gap-1.5">
            <span>🏛️ జనసేవ (JanSeva)</span>
            <span>•</span>
            <span className="text-emerald-600">
              {currentUser.userType === 'illiterate' ? '🎙️ వాయిస్ అసిస్టెంట్ మోడ్' : '📝 సాధారణ సిటిజన్ మోడ్'}
            </span>
            <span>•</span>
            <span className="text-slate-400">ID: {currentUser.idNumber}</span>
          </p>
          <p className="flex items-center space-x-1">
            <span>Designed for Public Welfare with</span>
            <Heart className="w-3.5 h-3.5 text-red-500 fill-red-500 inline" />
          </p>
        </div>
      </footer>
    </div>
  );
}
