// Firebase Configuration for JanSeva (SMARTCIVIC)
// Project: SMARTCIVIC (smartcivic-9085c)
// Project Number / Sender ID: 339293629138

import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

export const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyCjQn59oGZytiTVNr8Tcx_TPvS3sPIvBAo",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "smartcivic-9085c.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "smartcivic-9085c",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "smartcivic-9085c.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "339293629138",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:339293629138:web:3fcbc08eb8c5adfe261b0b",
  measurementId: "G-D8PST3BF4B"
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;
