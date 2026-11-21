import React, { useState, useEffect, useRef } from 'react';
import { Camera, Mic, MicOff, MapPin, CheckCircle2, AlertTriangle, Sparkles, Volume2, RefreshCw } from 'lucide-react';
import confetti from 'canvas-confetti';
import { CATEGORIES, UI_STRINGS } from '../utils/translations';
import { speakText, playAudioFeedback, createSpeechRecognizer } from '../utils/speech';

export default function ReportIssue({ currentLang, onIssueCreated, onGoToFeed, currentUser, voiceActive = true }) {
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [voiceTranscript, setVoiceTranscript] = useState('');
  const [location, setLocation] = useState({ lat: 17.3850, lon: 78.4867, address: 'Near Market Area, Ward 6', ward: 'Ward 6' });
  const [locationLoading, setLocationLoading] = useState(false);
  const [aiClassifying, setAiClassifying] = useState(false);
  const [aiDetectedCategory, setAiDetectedCategory] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [duplicateAlert, setDuplicateAlert] = useState(null);
  const [successModal, setSuccessModal] = useState(null);

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

    // Trigger AI automatic category detection
    setAiClassifying(true);
    try {
      const formData = new FormData();
      formData.append('photo', file);
      formData.append('transcript', voiceTranscript);

      const res = await fetch('/api/ai/classify', {
        method: 'POST',
        body: formData
      });
      const data = await res.json();

      if (data.success && data.category) {
        setAiDetectedCategory(data.category);
        setSelectedCategory(data.category);

        const categoryObj = CATEGORIES.find(c => c.id === data.category);
        const catName = categoryObj?.names[currentLang] || categoryObj?.names.en || data.category;

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
    if (isRecording) {
      if (recognizerRef.current) {
        recognizerRef.current.stop();
      }
      setIsRecording(false);
      playAudioFeedback('click');
    } else {
      recognizerRef.current = createSpeechRecognizer({
        lang: currentLang,
        onStart: () => setIsRecording(true),
        onResult: (text) => setVoiceTranscript(text),
        onError: (err) => {
          console.warn("Speech error:", err);
          setIsRecording(false);
        },
        onEnd: () => {
          setIsRecording(false);
          playAudioFeedback('click');
        }
      });

      if (recognizerRef.current.isSupported) {
        recognizerRef.current.start();
      } else {
        alert("Microphone voice recognition works best in Chrome/Edge browsers.");
      }
    }
  };

  const handleSelectCategory = (cat) => {
    playAudioFeedback('click');
    setSelectedCategory(cat.id);
    if (voiceActive) {
      const prompt = cat.audioPrompt[currentLang] || cat.names[currentLang] || cat.names.en;
      speakText(prompt, currentLang);
    }
  };

  // Submit Complaint to Backend
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!photoFile && !photoPreview) {
      speakText('कृपया पहले समस्या की फोटो खींचें या चुनें', currentLang);
      playAudioFeedback('start');
      fileInputRef.current?.click();
      return;
    }

    setSubmitting(true);
    playAudioFeedback('click');

    try {
      const formData = new FormData();
      if (photoFile) {
        formData.append('photo', photoFile);
      }
      formData.append('category', selectedCategory || 'auto');
      formData.append('voiceTranscript', voiceTranscript);
      formData.append('language', currentLang);
      formData.append('latitude', location.lat);
      formData.append('longitude', location.lon);
      formData.append('address', location.address);
      formData.append('ward', location.ward);

      const res = await fetch('/api/issues', {
        method: 'POST',
        body: formData
      });

      const result = await res.json();

      if (result.isDuplicate) {
        // DUPLICATE DETECTED!
        playAudioFeedback('vote');
        setDuplicateAlert(result);
        const alertMsg = result.message[currentLang] || result.message.en;
        if (voiceActive) speakText(alertMsg, currentLang);
      } else if (result.success) {
        // Fresh issue registered!
        playAudioFeedback('success');
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 }
        });

        setSuccessModal(result.data);
        const successSpeech = result.message[currentLang] || result.message.en;
        if (voiceActive) speakText(successSpeech, currentLang);

        if (onIssueCreated) onIssueCreated(result.data);
      }
    } catch (err) {
      console.error('Submission error:', err);
      alert('Could not submit complaint. Check backend connection.');
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
                <span>समस्या का प्रकार चुनें (Category)</span>
              </h3>
              <p className="text-xs text-slate-500 ml-9">
                {currentLang === 'hi' ? 'छूकर अपनी समस्या का निशान चुनें' :
                 currentLang === 'te' ? 'మీ సమస్య చిహ్నాన్ని ఎంచుకోండి' :
                 'Tap the symbol that matches your problem'}
              </p>
            </div>
            <button
              type="button"
              onClick={() => speakText('कृपया समस्या का निशान चुनें जैसे कचरा, खड्डा, लाइट या पानी', currentLang)}
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

        {/* STEP 3: VOICE NOTE (Zero Typing Needed) */}
        <div className="bg-white rounded-3xl p-5 sm:p-6 shadow-sm border border-slate-200">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-black text-slate-800 flex items-center space-x-2">
              <span className="flex items-center justify-center w-7 h-7 rounded-full bg-blue-600 text-white text-sm">3</span>
              <span>{UI_STRINGS.step2Speak[currentLang] || UI_STRINGS.step2Speak.en}</span>
            </h3>
            <button
              type="button"
              onClick={() => speakText(UI_STRINGS.step2Speak[currentLang] || UI_STRINGS.step2Speak.en, currentLang)}
              className="text-slate-400 hover:text-blue-600 transition p-1"
            >
              <Volume2 className="w-5 h-5" />
            </button>
          </div>

          <div className="flex flex-col items-center justify-center p-4 bg-slate-50 rounded-2xl border border-slate-200">
            {/* Giant Microphone Button */}
            <button
              type="button"
              onClick={handleToggleVoice}
              className={`w-20 h-20 rounded-full flex items-center justify-center text-white transition-all transform active:scale-95 shadow-xl ${
                isRecording
                  ? 'bg-red-600 pulsing-record'
                  : 'bg-emerald-600 hover:bg-emerald-700 hover:scale-105'
              }`}
            >
              {isRecording ? <MicOff className="w-10 h-10 animate-bounce" /> : <Mic className="w-10 h-10" />}
            </button>

            <p className="mt-3 text-sm font-black text-slate-800">
              {isRecording
                ? (currentLang === 'hi' ? '🎤 सुन रहे हैं... बोलिए!' : currentLang === 'te' ? '🎤 వింటున్నాము... మాట్లాడండి!' : '🎤 Listening... Speak now!')
                : (currentLang === 'hi' ? 'माइक दबाकर अपनी भाषा में बोलें' : currentLang === 'te' ? 'మైక్ నొక్కి మీ భాషలో మాట్లాడండి' : 'Tap Mic and Speak in your Language')}
            </p>

            {voiceTranscript && (
              <div className="mt-3 w-full bg-white p-3 rounded-xl border border-slate-200 text-sm text-slate-700 flex items-start justify-between">
                <div>
                  <span className="text-[11px] font-bold uppercase text-slate-400 block mb-0.5">Spoken Message</span>
                  <p className="font-semibold italic">"{voiceTranscript}"</p>
                </div>
                <button
                  type="button"
                  onClick={() => speakText(voiceTranscript, currentLang)}
                  className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg"
                  title="Play back audio"
                >
                  <Volume2 className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
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
              <p className="text-xs font-bold text-slate-400 uppercase">GPS Location / स्थान</p>
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
            <>
              <span className="text-2xl">🚀</span>
              <span>{UI_STRINGS.btnSubmit[currentLang] || UI_STRINGS.btnSubmit.en}</span>
            </>
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
                Track Problem (समस्या देखें)
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
              View Public Tracking / स्थिति देखें
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
