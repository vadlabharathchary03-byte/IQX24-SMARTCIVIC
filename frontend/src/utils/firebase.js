// Firebase Configuration & Phone Auth Utility for JanSeva (SMARTCIVIC)
// Firebase Project: SMARTCIVIC (smartcivic-9085c)
// Project Number / Sender ID: 339293629138

const STORAGE_KEY = 'janseva_firebase_api_key';

export const FIREBASE_DEFAULTS = {
  projectId: 'smartcivic-9085c',
  messagingSenderId: '339293629138',
  authDomain: 'smartcivic-9085c.firebaseapp.com',
  storageBucket: 'smartcivic-9085c.appspot.com',
  appId: '1:339293629138:web:janseva'
};

export const getSavedApiKey = () => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem(STORAGE_KEY) || import.meta.env.VITE_FIREBASE_API_KEY || '';
  }
  return import.meta.env.VITE_FIREBASE_API_KEY || '';
};

export const saveFirebaseApiKey = (key) => {
  if (typeof window !== 'undefined') {
    if (key && key.trim()) {
      localStorage.setItem(STORAGE_KEY, key.trim());
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }
};

export const isFirebaseConfigured = () => {
  const key = getSavedApiKey();
  return Boolean(key && key.trim().length > 10);
};

let appInstance = null;
let recaptchaVerifier = null;

export const initFirebase = () => {
  if (typeof window === 'undefined' || !window.firebase) {
    return null;
  }
  const apiKey = getSavedApiKey();
  if (!apiKey) {
    return null;
  }

  try {
    if (window.firebase.apps && window.firebase.apps.length > 0) {
      appInstance = window.firebase.apps[0];
    } else {
      appInstance = window.firebase.initializeApp({
        apiKey,
        authDomain: FIREBASE_DEFAULTS.authDomain,
        projectId: FIREBASE_DEFAULTS.projectId,
        storageBucket: FIREBASE_DEFAULTS.storageBucket,
        messagingSenderId: FIREBASE_DEFAULTS.messagingSenderId,
        appId: FIREBASE_DEFAULTS.appId
      });
    }
    return appInstance;
  } catch (err) {
    console.warn('Firebase init warning:', err);
    return null;
  }
};

export const setupRecaptcha = (containerId = 'recaptcha-container') => {
  if (typeof window === 'undefined' || !window.firebase) return null;
  const app = initFirebase();
  if (!app) return null;

  try {
    const auth = window.firebase.auth();
    if (recaptchaVerifier) {
      try {
        recaptchaVerifier.clear();
      } catch (_) {}
    }

    recaptchaVerifier = new window.firebase.auth.RecaptchaVerifier(containerId, {
      size: 'invisible',
      callback: () => {
        // reCAPTCHA solved
      },
      'expired-callback': () => {
        console.warn('Firebase reCAPTCHA expired, retrying...');
      }
    });

    return recaptchaVerifier;
  } catch (err) {
    console.error('RecaptchaVerifier error:', err);
    return null;
  }
};

export const sendFirebasePhoneOtp = async (rawPhone, containerId = 'recaptcha-container') => {
  if (typeof window === 'undefined' || !window.firebase) {
    throw new Error('Firebase SDK not loaded. Check internet connection.');
  }

  const app = initFirebase();
  if (!app) {
    throw new Error('Firebase Web API Key is not set.');
  }

  const auth = window.firebase.auth();
  const clean = rawPhone.replace(/\D/g, '');
  const formattedPhone = clean.startsWith('91') && clean.length === 12
    ? `+${clean}`
    : `+91${clean.slice(-10)}`;

  const verifier = setupRecaptcha(containerId);
  if (!verifier) {
    throw new Error('Unable to initialize Firebase reCAPTCHA.');
  }

  const confirmationResult = await auth.signInWithPhoneNumber(formattedPhone, verifier);
  return confirmationResult;
};
