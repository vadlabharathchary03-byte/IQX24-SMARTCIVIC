import React, { useState, useEffect, useRef } from 'react';
import { Camera, Mic, MicOff, MapPin, CheckCircle2, AlertTriangle, Sparkles, Volume2, RefreshCw, Keyboard, Edit3, PenLine, X, Check, RotateCcw } from 'lucide-react';
import confetti from 'canvas-confetti';
import { CATEGORIES, UI_STRINGS } from '../utils/translations';
import { speakText, playAudioFeedback, createSpeechRecognizer } from '../utils/speech';
import { submitComplaint, compressImage } from '../firebaseActions';

export default function ReportIssue({ currentLang, onIssueCreated, onGoToFeed, currentUser, voiceActive = true }) {
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [voiceTranscript, setVoiceTranscript] = useState('');
  const [inputMode, setInputMode] = useState(currentUser?.userType === 'literate' ? 'manual' : 'voice');
  const [manualText, setManualText] = useState('');
  const [location, setLocation] = useState({ lat: 17.3850, lon: 78.4867, address: 'Near Market Area, Ward 6', ward: 'Ward 6' });
  const [locationLoading, setLocationLoading] = useState(false);
  const [aiClassifying, setAiClassifying] = useState(false);
  const [aiDetectedCategory, setAiDetectedCategory] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [duplicateAlert, setDuplicateAlert] = useState(null);
  const [successModal, setSuccessModal] = useState(null);
  const [micError, setMicError] = useState(null);
  const [interimSpeech, setInterimSpeech] = useState('');

  const fileInputRef = useRef(null);
  const recognizerRef = useRef(null);

  // Initialize GPS on load
  useEffect(() => {
    fetchCurrentLocation();
  }, []);

  const fetchCurrentLocation = () => {
    setLocationLoading(true);
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lon = position.coords.longitude;
          const detectedAddr = `GPS Pin: ${lat.toFixed(4)}, ${lon.toFixed(4)} (Ward 6)`;
          setLocation({
            lat,
            lon,
            address: detectedAddr,
            ward: 'Ward 6'
          });
          setLocationLoading(false);
        },
        (err) => {
          console.warn("Geolocation warning:", err.message);
          // Default fallback coordinates (Hyderabad / Central civic zone)
          setLocation({
            lat: 17.3850,
            lon: 78.4867,
            address: 'Old City Center, Ward 4',
            ward: 'Ward 4'
          });
          setLocationLoading(false);
        },
        { enableHighAccuracy: true, timeout: 8000 }
      );
    } else {
      setLocationLoading(false);
    }
  };

  // Handle Photo Selection & Automatic AI Categorization
  const handlePhotoChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setPhotoFile(file);
    const previewUrl = URL.createObjectURL(file);
    setPhotoPreview(previewUrl);
    playAudioFeedback('click');

    // Instant smart client-side category suggestion based on image name or existing transcript (No Backend)
    setAiClassifying(true);
    try {
      const lowerText = ((file.name || '') + ' ' + (voiceTranscript || '')).toLowerCase();
      let detectedCat = null;
      if (lowerText.includes('garbage') || lowerText.includes('waste') || lowerText.includes('trash')) detectedCat = 'garbage';
      else if (lowerText.includes('road') || lowerText.includes('pothole')) detectedCat = 'pothole';
      else if (lowerText.includes('light') || lowerText.includes('lamp')) detectedCat = 'streetlight';
      else if (lowerText.includes('water') || lowerText.includes('pipe') || lowerText.includes('leak')) detectedCat = 'water_leak';
      else if (lowerText.includes('wire') || lowerText.includes('cable') || lowerText.includes('electric')) detectedCat = 'electric_cable';

      const matchedCat = detectedCat || selectedCategory;
      if (matchedCat) {
        setAiDetectedCategory(matchedCat);
        setSelectedCategory(matchedCat);

        const categoryObj = CATEGORIES.find(c => c.id === matchedCat);
        const catName = categoryObj?.names[currentLang] || categoryObj?.names.en || matchedCat;

        const announcement = {
          hi: `पहचान लिया: यह ${catName} की समस्या लग रही है!`,
          te: `గుర్తించబడింది: ఇది ${catName} సమస్యగా కనిపిస్తోంది!`,
          ta: `கண்டறியப்பட்டது: இது ${catName} பிரச்சனை!`,
          kn: `ಗುರುತಿಸಲಾಗಿದೆ: ಇದು ${catName} ಸಮಸ್ಯೆ!`,
          mr: `ओळखले: ही ${catName} ची समस्या दिसते!`,
          en: `Detected: Looks like ${catName}!`
        };

        if (voiceActive) {
          speakText(announcement[currentLang] || announcement.en, currentLang);
        }
      }
    } catch (err) {
      console.warn("AI classification failed:", err);
    } finally {
      setAiClassifying(false);
    }
  };

  // Toggle Voice Recording
  const handleToggleVoice = () => {
    setMicError(null);
    if (isRecording) {
      if (recognizerRef.current) {
        recognizerRef.current.stop();
      }
      setIsRecording(false);
      playAudioFeedback('click');
    } else {
      setInterimSpeech('');
      recognizerRef.current = createSpeechRecognizer({
        lang: currentLang,
        onStart: () => {
          setIsRecording(true);
          setMicError(null);
        },
        onResult: (text) => {
          setInterimSpeech(text);
          setVoiceTranscript(text);
          setManualText(text);

          // Auto-detect category from spoken words in Telugu, English, or Hindi
          const lower = text.toLowerCase();
          let detected = null;
          if (lower.includes('garbage') || lower.includes('waste') || lower.includes('trash') || lower.includes('చెత్త') || lower.includes('కచరా') || lower.includes('कचरा')) detected = 'garbage';
          else if (lower.includes('road') || lower.includes('pothole') || lower.includes('గుంత') || lower.includes('సడక్') || lower.includes('सड़क') || lower.includes('खड्डा')) detected = 'pothole';
          else if (lower.includes('light') || lower.includes('lamp') || lower.includes('లైట్') || lower.includes('దీపం') || lower.includes('लाइट')) detected = 'streetlight';
          else if (lower.includes('water') || lower.includes('pipe') || lower.includes('leak') || lower.includes('నీరు') || lower.includes('పైపు') || lower.includes('पानी')) detected = 'water_leak';
          else if (lower.includes('wire') || lower.includes('cable') || lower.includes('electric') || lower.includes('కరెంట్') || lower.includes('వైర్') || lower.includes('बिजली')) detected = 'electrical';

          if (detected && !selectedCategory) {
            setSelectedCategory(detected);
          }
        },
        onError: (err) => {
          console.warn("Speech error:", err);
          setIsRecording(false);
          setMicError(typeof err === 'string' ? err : 'Microphone access blocked. Please allow mic in browser or select below.');
        },
        onEnd: () => {
          setIsRecording(false);
          playAudioFeedback('click');
        }
      });

      if (recognizerRef.current && recognizerRef.current.isSupported) {
        recognizerRef.current.start();
      } else {
        setMicError("Microphone voice recognition works best in Chrome, Edge, or Safari.");
      }
    }
  };

  const handleSelectQuickVoice = (text, categoryId) => {
    playAudioFeedback('click');
    setVoiceTranscript(text);
    setManualText(text);
    setInterimSpeech(text);
    if (categoryId) setSelectedCategory(categoryId);
    if (voiceActive) speakText(text, currentLang);
  };

  const handleSelectCategory = (cat) => {
    playAudioFeedback('click');
    setSelectedCategory(cat.id);
    if (voiceActive) {
      const prompt = cat.audioPrompt[currentLang] || cat.names[currentLang] || cat.names.en;
      speakText(prompt, currentLang);
    }
  };

  // Submit Complaint directly to Firestore collection "complaints"
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!photoFile && !photoPreview) {
      speakText(
        currentLang === 'te'
          ? 'దయచేసి ముందుగా సమస్య ఫోటో తీయండి లేదా ఎంచుకోండి'
          : currentLang === 'hi'
          ? 'कृपया पहले समस्या की फोटो खींचें या चुनें'
          : 'Please take or upload a photo of the problem first',
        currentLang
      );
      playAudioFeedback('start');
      fileInputRef.current?.click();
      return;
    }

    setSubmitting(true);
    playAudioFeedback('click');

    try {
      const problemDesc = manualText.trim() || voiceTranscript.trim() || 'Civic grievance reported';
      const category = selectedCategory || aiDetectedCategory || 'general';
      const categoryObj = CATEGORIES.find(c => c.id === category);
      const categoryLabel = categoryObj?.names[currentLang] || categoryObj?.names.en || category;

      let photoDataUrl = photoPreview;
      if (photoFile) {
        try {
          const compressed = await compressImage(photoFile, 800, 600, 0.7);
          photoDataUrl = compressed || photoPreview;
        } catch (_) {
          photoDataUrl = photoPreview;
        }
      }

      const complaintData = {
        title: `${categoryLabel} - ${location.address || location.ward || 'Ward 4'}`,
        citizenName: currentUser?.name || 'Vadla Bharath Chary',
        phone: currentUser?.phone || '8919915291',
        area: location.address || location.ward || 'Ward 4',
        address: location.address || location.ward || 'Ward 4',
        ward: location.ward || 'Ward 4',
        lat: location.lat,
        lng: location.lon,
        description: problemDesc,
        voiceTranscript: voiceTranscript.trim() || problemDesc,
        category: category,
        status: 'reported',
        uid: currentUser?.uid || currentUser?.id || 'usr-8919915291',
        photoPreview: photoDataUrl,
        photoUrl: photoDataUrl
      };

      const result = await submitComplaint(complaintData);

      playAudioFeedback('success');
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 }
      });

      setSuccessModal(result);
      const successSpeech = currentLang === 'te'
        ? 'మీ సమస్య విజయవంతంగా నమోదైంది! అధికారులకు పంపబడింది.'
        : currentLang === 'hi'
        ? 'आपकी शिकायत सफलतापूर्वक दर्ज कर ली गई है!'
        : 'Your complaint has been successfully registered in the system!';
      if (voiceActive) speakText(successSpeech, currentLang);

      // Transition smoothly to Reported Problems feed after 1.8s
      setTimeout(() => {
        if (onIssueCreated) onIssueCreated(result);
      }, 1800);
    } catch (err) {
      console.error('Submission error:', err);
      alert('Could not submit complaint. Please check your network connection.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      {/* Friendly spoken guidance header */}
      <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-purple-800 rounded-3xl p-5 text-white shadow-xl mb-6 relative overflow-hidden">
        <div className="absolute right-0 top-0 opacity-10 pointer-events-none transform translate-x-8 -translate-y-6">
          <span className="text-9xl">📸</span>
        </div>
        <div className="relative z-10 flex items-center justify-between">
          <div>
            <span className="inline-block bg-amber-400 text-slate-950 font-black text-xs px-2.5 py-0.5 rounded-full uppercase tracking-wider mb-2">
              Step-by-Step Reporting
            </span>
            <h2 className="text-2xl sm:text-3xl font-black">
              {UI_STRINGS.navReport[currentLang] || 'Report Problem'}
            </h2>
            <p className="text-blue-100 text-sm mt-1 max-w-md">
              {UI_STRINGS.tagline[currentLang] || 'Take a photo, talk into mic, and submit.'}
            </p>
          </div>
          <button
            onClick={() => {
              const text = UI_STRINGS.tagline[currentLang] || UI_STRINGS.tagline.en;
              speakText(text, currentLang);
            }}
            className="w-12 h-12 rounded-2xl bg-white/20 hover:bg-white/30 flex items-center justify-center text-white backdrop-blur transition active:scale-95 shadow-inner"
            title="Read Header Aloud"
          >
            <Volume2 className="w-6 h-6" />
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* STEP 1: PHOTO CAPTURE / UPLOAD */}
        <div className="bg-white rounded-3xl p-5 sm:p-6 shadow-sm border border-slate-200">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-black text-slate-800 flex items-center space-x-2">
              <span className="flex items-center justify-center w-7 h-7 rounded-full bg-blue-600 text-white text-sm">1</span>
              <span>{UI_STRINGS.step1Photo[currentLang] || UI_STRINGS.step1Photo.en}</span>
            </h3>
            <button
              type="button"
              onClick={() => speakText(UI_STRINGS.step1Photo[currentLang] || UI_STRINGS.step1Photo.en, currentLang)}
              className="text-slate-400 hover:text-blue-600 transition p-1"
            >
              <Volume2 className="w-5 h-5" />
            </button>
          </div>

          <input
            type="file"
            accept="image/*"
            capture="environment"
            ref={fileInputRef}
            onChange={handlePhotoChange}
            className="hidden"
          />

          {!photoPreview ? (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-3 border-dashed border-blue-300 hover:border-blue-500 bg-blue-50/50 hover:bg-blue-50/80 rounded-2xl p-8 text-center cursor-pointer transition flex flex-col items-center justify-center group"
            >
              <div className="w-20 h-20 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-lg group-hover:scale-110 transition mb-3">
                <Camera className="w-10 h-10" />
              </div>
              <p className="text-base font-bold text-slate-800">
                {currentLang === 'hi' ? 'यहाँ छूकर फोटो खींचें या चुनें' :
                 currentLang === 'te' ? 'ఫోటో తీయడానికి ఇక్కడ నొక్కండి' :
                 currentLang === 'ta' ? 'புகைப்படம் எடுக்க இங்கே தொடவும்' :
                 'Tap here to take or choose photo'}
              </p>
              <span className="text-xs text-slate-500 mt-1">Camera or Gallery</span>
            </div>
          ) : (
            <div className="relative rounded-2xl overflow-hidden border border-slate-200 shadow-inner group">
              <img
                src={photoPreview}
                alt="Uploaded Problem"
                className="w-full h-64 object-cover"
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="bg-white/90 hover:bg-white text-slate-900 font-bold px-4 py-2 rounded-xl text-sm flex items-center space-x-2 shadow-lg"
                >
                  <Camera className="w-4 h-4" />
                  <span>Retake / Change Photo</span>
                </button>
              </div>

              {/* AI Detection Pill */}
              {aiClassifying && (
                <div className="absolute bottom-3 left-3 bg-slate-900/90 text-white text-xs px-3 py-1.5 rounded-full flex items-center space-x-2 backdrop-blur">
                  <Sparkles className="w-4 h-4 text-amber-400 animate-spin" />
                  <span>AI Identifying problem category...</span>
                </div>
              )}
              {aiDetectedCategory && !aiClassifying && (
                <div className="absolute bottom-3 left-3 bg-emerald-600 text-white text-xs font-bold px-3 py-1.5 rounded-full flex items-center space-x-1.5 shadow-md">
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  <span>Auto-Detected: {CATEGORIES.find(c => c.id === aiDetectedCategory)?.names[currentLang] || aiDetectedCategory}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* STEP 2: CATEGORY SELECTION (Large Colorful Pictograms for Non-Literate Users) */}
        <div className="bg-white rounded-3xl p-5 sm:p-6 shadow-sm border border-slate-200">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-lg font-black text-slate-800 flex items-center space-x-2">
                <span className="flex items-center justify-center w-7 h-7 rounded-full bg-blue-600 text-white text-sm">2</span>
                <span>{UI_STRINGS.step2Category?.[currentLang] || 'Select Problem Category'}</span>
              </h3>
              <p className="text-xs text-slate-500 ml-9">
                {currentLang === 'hi' ? 'छूकर अपनी समस्या का निशान चुनें' :
                 currentLang === 'te' ? 'మీ సమస్య చిహ్నాన్ని ఎంచుకోండి' :
                 'Tap the icon that matches your civic problem'}
              </p>
            </div>
            <button
              type="button"
              onClick={() => speakText(
                currentLang === 'te' ? 'దయచేసి మీ సమస్య రకాన్ని ఎంచుకోండి' :
                currentLang === 'hi' ? 'कृपया समस्या का निशान चुनें जैसे कचरा, खड्डा, लाइट या पानी' :
                'Please select your problem category',
                currentLang
              )}
              className="text-slate-400 hover:text-blue-600 transition p-1"
            >
              <Volume2 className="w-5 h-5" />
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {CATEGORIES.map((cat) => {
              const isSelected = selectedCategory === cat.id;
              const name = cat.names[currentLang] || cat.names.en;

              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => handleSelectCategory(cat)}
                  className={`p-4 rounded-2xl flex flex-col items-center justify-center text-center transition transform active:scale-95 border-2 ${
                    isSelected
                      ? `${cat.color} border-slate-900 shadow-xl scale-105 ring-4 ring-amber-400`
                      : 'bg-slate-50 hover:bg-slate-100 text-slate-800 border-slate-200'
                  }`}
                >
                  <span className="text-4xl mb-2">{cat.icon}</span>
                  <span className="font-extrabold text-sm sm:text-base leading-tight">
                    {name}
                  </span>
                  {isSelected && (
                    <span className="mt-1 text-[11px] font-bold bg-white/20 px-2 py-0.5 rounded-full">
                      ✓ Selected
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* STEP 3: DESCRIBE PROBLEM (Voice Mic or Manual Typing) */}
        <div className="bg-white rounded-3xl p-5 sm:p-6 shadow-sm border border-slate-200">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-black text-slate-800 flex items-center space-x-2">
              <span className="flex items-center justify-center w-7 h-7 rounded-full bg-blue-600 text-white text-sm">3</span>
              <span>{UI_STRINGS.step2Speak[currentLang] || UI_STRINGS.step2Speak.en}</span>
            </h3>
            <button
              type="button"
              onClick={() => speakText(
                currentLang === 'te'
                  ? 'మీ సమస్యను మైక్ నొక్కి మాట్లాడవచ్చు లేదా చేతితో టైప్ చేయవచ్చు'
                  : currentLang === 'hi'
                  ? 'अपनी समस्या बोलकर बताएं या कीबोर्ड से टाइप करें'
                  : 'Describe your problem by speaking with mic or typing manually',
                currentLang
              )}
              className="text-slate-400 hover:text-blue-600 transition p-1 cursor-pointer"
              title="Voice Guidance"
            >
              <Volume2 className="w-5 h-5" />
            </button>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="flex items-center p-1.5 bg-slate-100 rounded-2xl mb-4 border border-slate-200 gap-1.5">
            <button
              type="button"
              onClick={() => {
                setInputMode('voice');
                playAudioFeedback('click');
              }}
              className={`flex-1 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-black transition-all flex items-center justify-center space-x-2 cursor-pointer ${
                inputMode === 'voice'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30 ring-2 ring-emerald-400/40'
                  : 'bg-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
              }`}
            >
              <Mic className="w-4 h-4" />
              <span>
                {currentLang === 'te' ? 'మైక్ ద్వారా చెప్పండి (Voice Mic)' : currentLang === 'hi' ? 'माइक से बोलें (Voice Mic)' : 'Speak with Mic'}
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                setInputMode('manual');
                playAudioFeedback('click');
              }}
              className={`flex-1 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-black transition-all flex items-center justify-center space-x-2 cursor-pointer ${
                inputMode === 'manual'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30 ring-2 ring-blue-400/40'
                  : 'bg-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
              }`}
            >
              <Keyboard className="w-4 h-4" />
              <span>
                {currentLang === 'te' ? 'చేతితో టైప్ చేయండి (Type Manual)' : currentLang === 'hi' ? 'लिखकर टाइप करें (Type Manual)' : 'Type Manually'}
              </span>
            </button>
          </div>

          {/* VIEW A: VOICE MIC MODE */}
          {inputMode === 'voice' ? (
            <div className="flex flex-col items-center justify-center p-5 bg-gradient-to-b from-slate-50 to-emerald-50/30 rounded-2xl border border-slate-200">
              {/* Giant Microphone Button */}
              <div className="relative">
                {isRecording && (
                  <span className="absolute -inset-3 rounded-full bg-red-400 opacity-75 animate-ping"></span>
                )}
                <button
                  type="button"
                  onClick={handleToggleVoice}
                  className={`relative w-24 h-24 rounded-full flex flex-col items-center justify-center text-white transition-all transform active:scale-95 shadow-xl cursor-pointer ${
                    isRecording
                      ? 'bg-red-600 ring-4 ring-red-300 animate-pulse'
                      : 'bg-emerald-600 hover:bg-emerald-700 hover:scale-105'
                  }`}
                >
                  {isRecording ? <MicOff className="w-10 h-10 animate-bounce" /> : <Mic className="w-10 h-10" />}
                  <span className="text-[10px] font-black uppercase mt-1 tracking-wider">
                    {isRecording ? 'STOP' : 'TAP MIC'}
                  </span>
                </button>
              </div>

              <p className="mt-3 text-sm font-black text-slate-800 flex items-center space-x-1.5">
                {isRecording ? (
                  <span className="text-red-600 flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-600 animate-ping"></span>
                    <span>{currentLang === 'te' ? 'వింటున్నాము... మాట్లాడండి!' : currentLang === 'hi' ? 'सुन रहे हैं... बोलिए!' : 'Listening... Speak now!'}</span>
                  </span>
                ) : (
                  <span>{currentLang === 'te' ? 'మైక్ నొక్కి మీ సమస్యను మాట్లాడండి' : currentLang === 'hi' ? 'माइक दबाकर अपनी समस्या बोलें' : 'Tap Mic and Speak Your Problem in Any Language'}</span>
                )}
              </p>

              {/* MIC PERMISSION OR ACCESS NOTICE IF BLOCKED */}
              {micError && (
                <div className="mt-3 w-full p-3 bg-amber-50 border border-amber-300 rounded-xl text-xs text-amber-900 flex items-start space-x-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-bold">{micError}</p>
                    <p className="text-[11px] text-amber-700 mt-0.5">
                      {currentLang === 'te'
                        ? 'బ్రౌజర్ అడ్రస్ బార్‌లో మైక్ పర్మిషన్‌ను Allow చేయండి లేదా కింద ఉన్న వాయిస్ బటన్లను వాడండి.'
                        : 'Allow microphone access in your browser or click any Quick Voice prompt below.'}
                    </p>
                  </div>
                </div>
              )}

              {/* ALWAYS-VISIBLE LIVE SPEECH DISPLAY BOX */}
              <div className="mt-4 w-full bg-white rounded-2xl p-4 border-2 border-slate-200 shadow-sm transition">
                <div className="flex items-center justify-between mb-2 pb-2 border-b border-slate-100">
                  <div className="flex items-center space-x-2">
                    <span className={`w-3 h-3 rounded-full ${isRecording ? 'bg-red-500 animate-ping' : (voiceTranscript || manualText) ? 'bg-emerald-500' : 'bg-slate-300'}`}></span>
                    <span className="text-xs font-black uppercase tracking-wider text-slate-800">
                      {isRecording
                        ? (currentLang === 'te' ? '🔴 లైవ్ రికార్డింగ్ జరుగుతోంది...' : '🔴 Live Voice Recording...')
                        : (currentLang === 'te' ? '🎙️ రికార్డ్ అయిన మాటలు (Spoken Speech)' : '🎙️ Live Voice Transcript')}
                    </span>
                  </div>

                  {(voiceTranscript || manualText) && (
                    <div className="flex items-center space-x-2">
                      <button
                        type="button"
                        onClick={() => speakText(voiceTranscript || manualText, currentLang)}
                        className="px-2 py-1 text-xs font-bold text-blue-600 hover:bg-blue-50 rounded-lg flex items-center space-x-1 cursor-pointer"
                        title="Listen to recording"
                      >
                        <Volume2 className="w-3.5 h-3.5" />
                        <span>Play</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setVoiceTranscript('');
                          setManualText('');
                          setInterimSpeech('');
                          playAudioFeedback('click');
                        }}
                        className="px-2 py-1 text-xs font-bold text-red-500 hover:bg-red-50 rounded-lg flex items-center space-x-1 cursor-pointer"
                        title="Clear transcript"
                      >
                        <X className="w-3.5 h-3.5" />
                        <span>Clear</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* Displayed Spoken Text */}
                {(voiceTranscript || manualText || interimSpeech) ? (
                  <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl">
                    <p className="text-base sm:text-lg font-black text-slate-900 leading-relaxed italic">
                      "{voiceTranscript || manualText || interimSpeech}"
                    </p>
                    <span className="mt-1 text-[11px] font-bold text-emerald-700 flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" />
                      {currentLang === 'te' ? 'మాటలు నమోదయ్యాయి' : 'Voice captured successfully! Ready to submit.'}
                    </span>
                  </div>
                ) : isRecording ? (
                  <div className="p-4 bg-amber-50/80 border border-amber-200 rounded-xl text-center">
                    <p className="text-sm font-black text-amber-900 animate-pulse">
                      🎙️ {currentLang === 'te' ? 'మాట్లాడండి... మీ మాటలు ఇక్కడ కనిపిస్తాయి!' : 'Listening to your microphone... Speak now!'}
                    </p>
                    <span className="text-xs text-amber-700 mt-1 block">
                      (e.g., Streetlight broken / రోడ్డు గుంత / కచరా పేటీ / Water leak)
                    </span>
                  </div>
                ) : (
                  <div className="p-3 bg-slate-50 border border-dashed border-slate-300 rounded-xl text-center">
                    <p className="text-xs font-bold text-slate-500">
                      {currentLang === 'te'
                        ? '🗣️ పైన ఉన్న ఆకుపచ్చ మైక్ బటన్ నొక్కి మాట్లాడండి — మీరు మాట్లాడే మాటలు ఇక్కడ ప్రత్యక్షంగా కనిపిస్తాయి.'
                        : '🗣️ Tap the green microphone above and speak. What you say will instantly display right here.'}
                    </p>
                  </div>
                )}
              </div>

              {/* QUICK 1-CLICK VOICE PROMPTS */}
              <div className="mt-4 w-full">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-black uppercase tracking-wider text-slate-600 flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    <span>{currentLang === 'te' ? 'ఒక క్లిక్‌తో చెప్పండి (Quick Voice Prompts):' : 'Quick Spoken Voice Presets:'}</span>
                  </span>
                  <span className="text-[11px] text-slate-400 font-bold">Tap to Speak</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {[
                    {
                      cat: 'streetlight',
                      icon: '💡',
                      title: currentLang === 'te' ? 'స్ట్రీట్‌లైట్ వెలగట్లేదు' : 'Streetlight Broken & Dark',
                      text: currentLang === 'te' ? 'మా వీధిలో స్ట్రీట్‌లైట్ వెలగట్లేదు, చీకటిగా ఉంది' : 'Streetlight is broken and the street is dark'
                    },
                    {
                      cat: 'pothole',
                      icon: '🕳️',
                      title: currentLang === 'te' ? 'రోడ్డు మీద పెద్ద గుంత' : 'Deep Pothole on Road',
                      text: currentLang === 'te' ? 'రోడ్డు మీద పెద్ద గుంత పడింది, వాహనాలు పడిపోతున్నాయి' : 'Deep pothole on the main road causing danger'
                    },
                    {
                      cat: 'garbage',
                      icon: '🗑️',
                      title: currentLang === 'te' ? 'చెత్త కుప్ప పేరుకుపోయింది' : 'Overflowing Garbage Bin',
                      text: currentLang === 'te' ? 'చెత్త కుప్ప చాలా రోజులుగా పేరుకుపోయింది, తీవ్ర దుర్వాసన వస్తోంది' : 'Garbage container is overflowing with foul smell'
                    },
                    {
                      cat: 'water_leak',
                      icon: '🚰',
                      title: currentLang === 'te' ? 'తాగునీటి పైపు లీకేజ్' : 'Water Pipeline Leakage',
                      text: currentLang === 'te' ? 'తాగునీటి పైపు పగిలి నీరంతా రోడ్డుపై వృధా అవుతోంది' : 'Public drinking water pipeline burst and leaking'
                    }
                  ].map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSelectQuickVoice(preset.text, preset.cat)}
                      className="p-2.5 rounded-xl border border-slate-200 hover:border-emerald-500 bg-white hover:bg-emerald-50/50 text-left transition flex items-center space-x-2 text-xs font-bold text-slate-800 shadow-2xs cursor-pointer group active:scale-98"
                    >
                      <span className="text-xl flex-shrink-0">{preset.icon}</span>
                      <div className="flex-1 min-w-0">
                        <span className="font-black text-slate-900 group-hover:text-emerald-700 block truncate">{preset.title}</span>
                        <span className="text-[11px] text-slate-500 truncate block">"{preset.text}"</span>
                      </div>
                      <span className="text-[10px] bg-slate-100 group-hover:bg-emerald-200 text-slate-700 font-extrabold px-1.5 py-0.5 rounded flex-shrink-0">
                        Speak 🎙️
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Quick switch to manual */}
              <button
                type="button"
                onClick={() => {
                  setInputMode('manual');
                  playAudioFeedback('click');
                }}
                className="mt-4 inline-flex items-center space-x-1 text-xs font-bold text-blue-600 hover:text-blue-800 underline underline-offset-4 cursor-pointer"
              >
                <Keyboard className="w-3.5 h-3.5" />
                <span>
                  {currentLang === 'te' ? 'చేతితో టైప్ చేయాలనుకుంటున్నారా? ఇక్కడ క్లిక్ చేయండి →' : currentLang === 'hi' ? 'टाइप करना चाहते हैं? यहाँ क्लिक करें →' : 'Prefer typing manually instead? Click here →'}
                </span>
              </button>
            </div>
          ) : (
            /* VIEW B: MANUAL TYPING MODE */
            <div className="p-4 sm:p-5 bg-gradient-to-b from-blue-50/40 to-slate-50 rounded-2xl border border-blue-200/80 space-y-3 animate-in fade-in">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-black uppercase tracking-wider text-slate-700 flex items-center space-x-1.5">
                  <PenLine className="w-4 h-4 text-blue-600" />
                  <span>
                    {currentLang === 'te'
                      ? 'సమస్య వివరాలను టైప్ చేయండి (Type Problem Details):'
                      : currentLang === 'hi'
                      ? 'समस्या का विवरण टाइप करें (Type Problem Details):'
                      : 'Type Your Civic Problem Details:'}
                  </span>
                </label>
                {manualText && (
                  <button
                    type="button"
                    onClick={() => {
                      setManualText('');
                      setVoiceTranscript('');
                      playAudioFeedback('click');
                    }}
                    className="text-xs font-bold text-red-500 hover:text-red-700 flex items-center space-x-1 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>{currentLang === 'te' ? 'క్లియర్' : 'Clear'}</span>
                  </button>
                )}
              </div>

              {/* Textarea Input */}
              <div className="relative">
                <textarea
                  rows={4}
                  value={manualText}
                  onChange={(e) => {
                    setManualText(e.target.value);
                    setVoiceTranscript(e.target.value);
                  }}
                  placeholder={
                    currentLang === 'te'
                      ? 'మీ సమస్యను ఇక్కడ టైప్ చేయండి (ఉదా: మా కాలనీ మెయిన్ రోడ్డుపై పెద్ద గుంత ఏర్పడింది, వీధి దీపం వెలగడం లేదు, నీటి పైపు పగిలి నీరు రోడ్డుపైకి వస్తోంది)...'
                      : currentLang === 'hi'
                      ? 'अपनी समस्या का विवरण यहाँ लिखें (उदा: सड़क पर गहरा गड्ढा है, स्ट्रीट लाइट खराब है, नाली का पानी बह रहा है)...'
                      : 'Type problem description (e.g., Deep pothole on main road, broken streetlight, overflowing drain, leaking water pipe)...'
                  }
                  className="w-full p-3.5 rounded-2xl border-2 border-slate-300 focus:border-blue-500 bg-white text-sm font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-blue-100 transition shadow-inner resize-y min-h-[100px]"
                />
              </div>

              {/* 1-Click Quick Issue Tags */}
              <div className="space-y-1.5">
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wide flex items-center space-x-1">
                  <span>{currentLang === 'te' ? 'ఉదాహరణలు (Quick Examples):' : 'Quick Add Examples:'}</span>
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { te: 'రోడ్డుపై గుంతలు', hi: 'सड़क पर गड्ढा', en: 'Pothole on Road' },
                    { te: 'వీధి లైట్ వెలగడం లేదు', hi: 'स्ट्रीट लाइट बंद है', en: 'Streetlight Not Working' },
                    { te: 'చెత్త పేరుకుపోయింది', hi: 'कचरा जमा है', en: 'Overflowing Garbage' },
                    { te: 'మంచినీటి పైపు లీకేజ్', hi: 'पानी का पाइप लीक', en: 'Water Pipe Leakage' },
                    { te: 'డ్రైనేజీ సమస్య', hi: 'नाली जाम है', en: 'Drainage Overflow' }
                  ].map((chip, idx) => {
                    const chipText = chip[currentLang] || chip.en;
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          playAudioFeedback('click');
                          const addition = chipText;
                          setManualText(prev => prev ? `${prev}, ${addition}` : addition);
                          setVoiceTranscript(prev => prev ? `${prev}, ${addition}` : addition);
                        }}
                        className="px-2.5 py-1 bg-white hover:bg-blue-50 text-slate-700 hover:text-blue-700 border border-slate-200 hover:border-blue-300 rounded-lg text-xs font-bold transition shadow-2xs cursor-pointer active:scale-95"
                      >
                        + {chipText}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Footer actions in manual mode */}
              <div className="flex items-center justify-between pt-1 text-xs">
                <div className="text-slate-400 font-semibold">
                  {manualText.length} characters
                </div>

                <div className="flex items-center space-x-2">
                  {manualText && (
                    <button
                      type="button"
                      onClick={() => speakText(manualText, currentLang)}
                      className="inline-flex items-center space-x-1 font-bold text-blue-600 hover:text-blue-800 bg-blue-50 px-2 py-1 rounded-lg cursor-pointer"
                      title="Listen"
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                      <span>{currentLang === 'te' ? 'వినిపించు' : 'Listen'}</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      setInputMode('voice');
                      playAudioFeedback('click');
                    }}
                    className="inline-flex items-center space-x-1 font-bold text-emerald-700 hover:text-emerald-900 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1 rounded-lg cursor-pointer transition"
                  >
                    <Mic className="w-3.5 h-3.5 text-emerald-600" />
                    <span>{currentLang === 'te' ? 'వాయిస్ మైక్ కి మారండి' : 'Switch to Voice Mic'}</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* STEP 4: LOCATION (GPS Auto-Detection) */}
        <div className="bg-white rounded-3xl p-5 sm:p-6 shadow-sm border border-slate-200">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-black text-slate-800 flex items-center space-x-2">
              <span className="flex items-center justify-center w-7 h-7 rounded-full bg-blue-600 text-white text-sm">4</span>
              <span>{UI_STRINGS.step3Location[currentLang] || UI_STRINGS.step3Location.en}</span>
            </h3>
            <button
              type="button"
              onClick={fetchCurrentLocation}
              disabled={locationLoading}
              className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center space-x-1"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${locationLoading ? 'animate-spin' : ''}`} />
              <span>Refresh GPS</span>
            </button>
          </div>

          <div className="flex items-center space-x-3 p-3 bg-slate-50 rounded-2xl border border-slate-200">
            <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center flex-shrink-0">
              <MapPin className="w-6 h-6" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-slate-400 uppercase">
                {currentLang === 'hi' ? 'GPS स्थान' : currentLang === 'te' ? 'GPS లొకేషన్' : 'GPS Location'}
              </p>
              <p className="text-sm font-extrabold text-slate-800 truncate">
                {location.address}
              </p>
              <span className="text-xs text-emerald-600 font-semibold">
                ✓ Geo-Coordinates: {location.lat.toFixed(4)}, {location.lon.toFixed(4)}
              </span>
            </div>
          </div>
        </div>

        {/* GIANT SUBMIT BUTTON */}
        <button
          type="submit"
          disabled={submitting}
          className="w-full py-5 rounded-3xl bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white font-black text-xl shadow-xl shadow-green-200 flex items-center justify-center space-x-3 transition transform active:scale-95 disabled:opacity-50"
        >
          {submitting ? (
            <RefreshCw className="w-7 h-7 animate-spin" />
          ) : (
            <span>{UI_STRINGS.btnSubmit[currentLang] || UI_STRINGS.btnSubmit.en}</span>
          )}
        </button>
      </form>

      {/* DUPLICATE COMPLAINT MODAL ALERT */}
      {duplicateAlert && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border-4 border-amber-400 text-center">
            <div className="w-16 h-16 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-9 h-9" />
            </div>

            <span className="bg-amber-100 text-amber-800 text-xs font-black uppercase px-3 py-1 rounded-full">
              Duplicate Detected & Escalate!
            </span>

            <h3 className="text-2xl font-black text-slate-900 mt-2 mb-2">
              {currentLang === 'hi' ? 'यह समस्या पहले से दर्ज है!' :
               currentLang === 'te' ? 'ఈ సమస్య ఇప్పటికే నమోదైంది!' :
               'Already Reported Nearby!'}
            </h3>

            <p className="text-sm text-slate-600 mb-4 leading-relaxed">
              {duplicateAlert.message[currentLang] || duplicateAlert.message.en}
            </p>

            <div className="bg-slate-50 p-3 rounded-2xl text-left border border-slate-200 mb-5">
              <span className="text-xs font-bold text-slate-400 block">Current Issue Status:</span>
              <p className="font-extrabold text-slate-800 text-sm">
                Total Citizen Votes: <span className="text-blue-600">{duplicateAlert.primaryIssue.votes} 🚨</span>
              </p>
              <p className="text-xs text-slate-500 mt-0.5">
                Distance: {duplicateAlert.distanceMeters} meters away
              </p>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => {
                  setDuplicateAlert(null);
                  if (onGoToFeed) onGoToFeed();
                }}
                className="w-full py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-base shadow-md transition"
              >
                {currentLang === 'te' ? 'సమస్యను ట్రాక్ చేయండి (Track Problem)' :
                 currentLang === 'hi' ? 'समस्या ट्रैक करें (Track Problem)' :
                 'Track Problem'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SUCCESS MODAL */}
      {successModal && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border-4 border-emerald-400 text-center">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-3">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <span className="bg-emerald-100 text-emerald-800 text-xs font-black uppercase px-3 py-1 rounded-full">
              Complaint Registered
            </span>

            <h3 className="text-2xl font-black text-slate-900 mt-2 mb-1">
              {currentLang === 'hi' ? 'आपकी शिकायत दर्ज हो गई!' :
               currentLang === 'te' ? 'మీ ఫిర్యాదు నమోదైంది!' :
               'Complaint Registered!'}
            </h3>

            <p className="text-xs text-slate-500 font-bold mb-4">
              Ticket ID: #{successModal.id}
            </p>

            <div className="rounded-2xl overflow-hidden border border-slate-200 mb-4 h-40">
              <img src={successModal.photoUrl} alt="Complaint" className="w-full h-full object-cover" />
            </div>

            <button
              onClick={() => {
                setSuccessModal(null);
                setPhotoFile(null);
                setPhotoPreview(null);
                setSelectedCategory(null);
                setVoiceTranscript('');
                if (onGoToFeed) onGoToFeed();
              }}
              className="w-full py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-base shadow-lg transition"
            >
              {currentLang === 'te' ? 'పబ్లిక్ ట్రాకింగ్ చూడండి (View Tracking)' :
               currentLang === 'hi' ? 'ट्रैकिंग देखें (View Tracking)' :
               'View Public Tracking'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
