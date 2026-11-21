// Firebase Configuration for JanSeva (SMARTCIVIC)
// Project: SMARTCIVIC (smartcivic-9085c)
// Project Number / Sender ID: 339293629138

import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || (typeof window !== 'undefined' ? localStorage.getItem('janseva_firebase_api_key') : '') || 'AIzaSyA_SMARTCIVIC_API_KEY_9085c',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'smartcivic-9085c.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'smartcivic-9085c',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'smartcivic-9085c.appspot.com',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '339293629138',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:339293629138:web:janseva'
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;
