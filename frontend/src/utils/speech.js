// Web Speech API Integration for Text-To-Speech (TTS) & Speech-To-Text (STT)
// Specially tuned for Indian Languages & Non-Literate Users

// Audio Context for instant tactile audio feedback without external assets
let audioCtx = null;

function getAudioContext() {
  if (!audioCtx && typeof window !== 'undefined') {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (AudioContext) {
      audioCtx = new AudioContext();
    }
  }
  return audioCtx;
}

export function playAudioFeedback(type = 'click') {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    if (ctx.state === 'suspended') {
      ctx.resume();
    }

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    const now = ctx.currentTime;

    if (type === 'start') {
      // Pleasant high double beep for mic start
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.15);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
      osc.start(now);
      osc.stop(now + 0.2);
    } else if (type === 'success') {
      // Tri-tone celebratory chime for successful submission
      osc.frequency.setValueAtTime(523.25, now); // C5
      osc.frequency.setValueAtTime(659.25, now + 0.1); // E5
      osc.frequency.setValueAtTime(783.99, now + 0.2); // G5
      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.45);
      osc.start(now);
      osc.stop(now + 0.45);
    } else if (type === 'vote') {
      // Hearty resonant ping for +1 vote
      osc.frequency.setValueAtTime(350, now);
      osc.frequency.exponentialRampToValueAtTime(700, now + 0.2);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
      osc.start(now);
      osc.stop(now + 0.25);
    } else {
      // Default subtle click
      osc.frequency.setValueAtTime(600, now);
      gain.gain.setValueAtTime(0.1, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);
      osc.start(now);
      osc.stop(now + 0.08);
    }
  } catch (err) {
    console.warn("Audio feedback error:", err);
  }
}

/**
 * Text-to-Speech (TTS)
 */
export function speakText(text, lang = 'hi') {
  if (typeof window === 'undefined' || !window.speechSynthesis) {
    console.warn("SpeechSynthesis not supported");
    return;
  }

  // Cancel any ongoing speech
  window.speechSynthesis.cancel();

  if (!text) return;

  const utterance = new SpeechSynthesisUtterance(text);
  
  // Map language codes to BCP 47 locale codes
  const langMap = {
    hi: 'hi-IN',
    te: 'te-IN',
    ta: 'ta-IN',
    kn: 'kn-IN',
    mr: 'mr-IN',
    en: 'en-IN'
  };

  const targetLocale = langMap[lang] || 'hi-IN';
  utterance.lang = targetLocale;
  utterance.rate = 0.95; // Slightly slower, clear pace for non-literate comprehension
  utterance.pitch = 1.0;

  // Attempt to select native matching voice if available in browser
  const voices = window.speechSynthesis.getVoices();
  const match = voices.find(v => v.lang.startsWith(lang) || v.lang === targetLocale);
  if (match) {
    utterance.voice = match;
  }

  window.speechSynthesis.speak(utterance);
}

/**
 * Speech-to-Text (STT) using Web Speech API
 */
export function createSpeechRecognizer({ lang = 'hi', onResult, onError, onEnd, onStart }) {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

  if (!SpeechRecognition) {
    return {
      isSupported: false,
      start: () => {
        if (onError) onError("Speech recognition not supported in this browser. Please use Google Chrome or Edge.");
      },
      stop: () => {}
    };
  }

  const recognition = new SpeechRecognition();
  const langMap = {
    hi: 'hi-IN',
    te: 'te-IN',
    ta: 'ta-IN',
    kn: 'kn-IN',
    mr: 'mr-IN',
    en: 'en-IN'
  };

  recognition.lang = langMap[lang] || 'hi-IN';
  recognition.continuous = false;
  recognition.interimResults = true;
  recognition.maxAlternatives = 1;

  recognition.onstart = () => {
    playAudioFeedback('start');
    if (onStart) onStart();
  };

  recognition.onresult = (event) => {
    let transcript = '';
    for (let i = event.resultIndex; i < event.results.length; ++i) {
      transcript += event.results[i][0].transcript;
    }
    if (onResult) onResult(transcript, event.results[event.results.length - 1].isFinal);
  };

  recognition.onerror = (event) => {
    console.error("Speech recognition error:", event.error);
    if (onError) onError(event.error);
  };

  recognition.onend = () => {
    if (onEnd) onEnd();
  };

  return {
    isSupported: true,
    start: () => {
      try {
        recognition.start();
      } catch (e) {
        console.warn("Recognition already started or error:", e);
      }
    },
    stop: () => {
      try {
        recognition.stop();
      } catch (e) {
        console.warn("Recognition stop error:", e);
      }
    }
  };
}
