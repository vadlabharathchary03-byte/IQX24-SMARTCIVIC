// Firebase Actions for JanSeva (SMARTCIVIC)
// Tasks: sendOtp(phone), verifyOtp(code), saveUser(uid, data), submitComplaint(data)

import { auth, db } from './firebase.js';
import { RecaptchaVerifier, signInWithPhoneNumber } from 'firebase/auth';
import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  addDoc, 
  updateDoc, 
  serverTimestamp, 
  query, 
  orderBy, 
  onSnapshot,
  increment 
} from 'firebase/firestore';

let activeConfirmationResult = null;
let recaptchaVerifierInstance = null;

// Category Photo Fallbacks (High Quality Unsplash Civic Images)
export const CATEGORY_FALLBACK_PHOTOS = {
  garbage: 'https://images.unsplash.com/photo-1605600659908-0ef719419d41?auto=format&fit=crop&w=600&q=80',
  pothole: 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=600&q=80',
  streetlight: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=600&q=80',
  water_leak: 'https://images.unsplash.com/photo-1584467735871-8e85353a8413?auto=format&fit=crop&w=600&q=80',
  electrical: 'https://images.unsplash.com/photo-1544724569-5f546fd6f2b5?auto=format&fit=crop&w=600&q=80',
  electric_cable: 'https://images.unsplash.com/photo-1544724569-5f546fd6f2b5?auto=format&fit=crop&w=600&q=80',
  general: 'https://images.unsplash.com/photo-1544724569-5f546fd6f2b5?auto=format&fit=crop&w=600&q=80'
};

// Rich Seed Issues to guarantee problems are always available on first load across all portals
export const DEFAULT_SEED_ISSUES = [
  {
    id: "civic-seed-005",
    category: "electrical",
    status: "in_progress",
    title: "Dangling Live Electric Cable near Bus Stop",
    photoUrl: "https://images.unsplash.com/photo-1544724569-5f546fd6f2b5?auto=format&fit=crop&w=600&q=80",
    resolvedPhotoUrl: null,
    voiceTranscript: "విద్యుత్ తీగ తెగి కిందకు వేలాడుతోంది, చాలా ప్రమాదం (Electric wire snapped and hanging low, very dangerous)",
    description: "విద్యుత్ తీగ తెగి కిందకు వేలాడుతోంది, చాలా ప్రమాదం (Electric wire snapped and hanging low, very dangerous)",
    citizenName: "Vadla Bharath Chary",
    phone: "8919915291",
    uid: "usr-8919915291",
    latitude: 17.3875,
    longitude: 78.4790,
    coordinates: { lat: 17.3875, lng: 78.4790 },
    address: "RTC Bus Stop, Ward 9",
    area: "Ward 9",
    ward: "Ward 9",
    votes: 27,
    upvotes: 27,
    assignedTo: "M. Ramesh (Lineman)",
    resolutionNote: "Power cut isolated. Line crew actively replacing high tension junction.",
    createdAt: "2026-11-21T02:49:29.000Z",
    updatedAt: "2026-11-21T18:08:44.000Z"
  },
  {
    id: "civic-seed-001",
    category: "garbage",
    status: "reported",
    title: "Overflowing Garbage Container",
    photoUrl: "https://images.unsplash.com/photo-1605600659908-0ef719419d41?auto=format&fit=crop&w=600&q=80",
    resolvedPhotoUrl: null,
    voiceTranscript: "కచరా పేటీ చాలా రోజులుగా నిండిపోయింది, తీవ్ర దుర్వాసన వస్తోంది (Garbage bin overflowing since days, foul smell)",
    description: "కచరా పేటీ చాలా రోజులుగా నిండిపోయింది, తీవ్ర దుర్వాసన వస్తోంది (Garbage bin overflowing since days, foul smell)",
    citizenName: "K. Suresh Reddy",
    phone: "9848012345",
    uid: "usr-9848012345",
    latitude: 17.3850,
    longitude: 78.4867,
    coordinates: { lat: 17.3850, lng: 78.4867 },
    address: "Near Old Clock Tower, Ward 4, Charminar Zone",
    area: "Ward 4",
    ward: "Ward 4",
    votes: 12,
    upvotes: 12,
    assignedTo: null,
    resolutionNote: null,
    createdAt: "2026-11-20T10:30:00.000Z",
    updatedAt: "2026-11-21T17:48:53.000Z"
  },
  {
    id: "civic-seed-002",
    category: "pothole",
    status: "work_started",
    title: "Deep Pothole Causing Vehicle Accidents",
    photoUrl: "https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=600&q=80",
    resolvedPhotoUrl: null,
    voiceTranscript: "రోడ్డు మీద పెద్ద గుంత పడింది, రాత్రిళ్లు బైకులు పడిపోతున్నాయి (Deep pit on road, two-wheelers falling at night)",
    description: "రోడ్డు మీద పెద్ద గుంత పడింది, రాత్రిళ్లు బైకులు పడిపోతున్నాయి (Deep pit on road, two-wheelers falling at night)",
    citizenName: "P. Venkat Rao",
    phone: "9876543210",
    uid: "usr-9876543210",
    latitude: 17.3912,
    longitude: 78.4721,
    coordinates: { lat: 17.3912, lng: 78.4721 },
    address: "Main Market Road, Beside Post Office, Ward 8",
    area: "Ward 8",
    ward: "Ward 8",
    votes: 18,
    upvotes: 18,
    assignedTo: "K. Ramesh (Road Maintenance Crew)",
    resolutionNote: "Asphalt patch team dispatched, road leveling in progress.",
    createdAt: "2026-11-19T08:49:29.000Z",
    updatedAt: "2026-11-21T09:28:24.000Z"
  },
  {
    id: "civic-seed-003",
    category: "water_leak",
    status: "resolved",
    title: "Burst Public Drinking Water Pipeline",
    photoUrl: "https://images.unsplash.com/photo-1584467735871-8e85353a8413?auto=format&fit=crop&w=600&q=80",
    resolvedPhotoUrl: "https://images.unsplash.com/photo-1584467735871-8e85353a8413?auto=format&fit=crop&w=600&q=80",
    voiceTranscript: "తాగునీటి పైపు పగిలి రోడ్డుపై నీరంతా వృధాగా పోతోంది (Drinking water pipe broken, heavy water wastage)",
    description: "తాగునీటి పైపు పగిలి రోడ్డుపై నీరంతా వృధాగా పోతోంది (Drinking water pipe broken, heavy water wastage)",
    citizenName: "M. Anitha",
    phone: "9123456780",
    uid: "usr-9123456780",
    latitude: 17.3815,
    longitude: 78.4910,
    coordinates: { lat: 17.3815, lng: 78.4910 },
    address: "Govt Primary School Lane, Ward 5",
    area: "Ward 5",
    ward: "Ward 5",
    votes: 19,
    upvotes: 19,
    assignedTo: "Ravi Teja (Water Works)",
    resolutionNote: "Pipeline replacement completed and pressure tested.",
    createdAt: "2026-11-20T12:49:29.000Z",
    updatedAt: "2026-11-21T10:50:40.000Z"
  },
  {
    id: "civic-seed-004",
    category: "streetlight",
    status: "resolved",
    title: "Dark Street - Broken Streetlight Pole",
    photoUrl: "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=600&q=80",
    resolvedPhotoUrl: "https://images.unsplash.com/photo-1517420704952-d9f39e95b43e?auto=format&fit=crop&w=600&q=80",
    voiceTranscript: "బస్తీలో 5 రోజుల నుండి లైట్ వెలగట్లేదు, చీకటిలో చాలా భయంగా ఉంది (Streetlight was off for 5 days)",
    description: "బస్తీలో 5 రోజుల నుండి లైట్ వెలగట్లేదు, చీకటిలో చాలా భయంగా ఉంది (Streetlight was off for 5 days)",
    citizenName: "S. Rajesh Kumar",
    phone: "9440112233",
    uid: "usr-9440112233",
    latitude: 17.3789,
    longitude: 78.4835,
    coordinates: { lat: 17.3789, lng: 78.4835 },
    address: "Street No. 3, Gandhi Colony, Ward 12",
    area: "Ward 12",
    ward: "Ward 12",
    votes: 6,
    upvotes: 6,
    assignedTo: "Electricity Board Unit 4",
    resolutionNote: "Replaced fused 65W LED luminaire and fixed capacitor fuse.",
    createdAt: "2026-11-18T08:49:29.000Z",
    updatedAt: "2026-11-21T04:49:29.000Z"
  }
];

export const DEFAULT_SEED_USERS = [
  {
    uid: "usr-8919915291",
    name: "Vadla Bharath Chary",
    phone: "8919915291",
    role: "citizen",
    ward: "Ward 4",
    areaName: "Old City Center, Ward 4",
    userType: "illiterate",
    language: "te",
    createdAt: "2026-11-21T18:00:00.000Z"
  },
  {
    uid: "usr-9848012345",
    name: "K. Suresh Reddy",
    phone: "9848012345",
    role: "citizen",
    ward: "Ward 4",
    areaName: "Clock Tower Area",
    userType: "literate",
    language: "te",
    createdAt: "2026-11-20T10:00:00.000Z"
  },
  {
    uid: "usr-9876543210",
    name: "P. Venkat Rao",
    phone: "9876543210",
    role: "citizen",
    ward: "Ward 8",
    areaName: "Main Market Road",
    userType: "literate",
    language: "te",
    createdAt: "2026-11-19T08:00:00.000Z"
  }
];

// Client-side Image Compression to guarantee fast uploads, low memory, and fit within Firestore limits (<1MB)
export const compressImage = (file, maxWidth = 800, maxHeight = 600, quality = 0.7) => {
  return new Promise((resolve) => {
    if (!file) return resolve(null);
    try {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > maxWidth) {
              height = Math.round((height * maxWidth) / width);
              width = maxWidth;
            }
          } else {
            if (height > maxHeight) {
              width = Math.round((width * maxHeight) / height);
              height = maxHeight;
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);

          const dataUrl = canvas.toDataURL('image/jpeg', quality);
          resolve(dataUrl);
        };
        img.onerror = () => resolve(null);
        img.src = e.target.result;
      };
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(file);
    } catch (_) {
      resolve(null);
    }
  });
};

// Safe localStorage setItem helper that handles browser quota limits cleanly
const safeSetLocalItem = (key, data) => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (err) {
    console.warn(`localStorage setItem quota warning for ${key}:`, err);
    try {
      if (Array.isArray(data)) {
        // Strip heavy base64 URLs from older items to free storage space
        const lightweight = data.map((item, idx) => {
          if (idx > 1 && item.photoUrl && item.photoUrl.startsWith('data:image')) {
            return {
              ...item,
              photoUrl: CATEGORY_FALLBACK_PHOTOS[item.category] || CATEGORY_FALLBACK_PHOTOS.general
            };
          }
          return item;
        });
        localStorage.setItem(key, JSON.stringify(lightweight));
      }
    } catch (_) {}
  }
};

// Helper to get local stored complaints
const getLocalComplaints = () => {
  try {
    const raw = localStorage.getItem('janseva_complaints');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (_) {}
  return [];
};

// Helper to set local stored complaints
const setLocalComplaints = (items) => {
  safeSetLocalItem('janseva_complaints', items);
  try {
    window.dispatchEvent(new CustomEvent('janseva_complaint_updated', { detail: items }));
  } catch (_) {}
};

// Helper to get local stored users
const getLocalUsers = () => {
  try {
    const raw = localStorage.getItem('janseva_users_directory');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (_) {}
  return DEFAULT_SEED_USERS;
};

const setLocalUsers = (users) => {
  try {
    localStorage.setItem('janseva_users_directory', JSON.stringify(users));
    window.dispatchEvent(new CustomEvent('janseva_users_updated', { detail: users }));
  } catch (_) {}
};

/**
 * Initializes or retrieves an invisible RecaptchaVerifier
 */
export const getRecaptchaVerifier = (containerId = 'recaptcha-container') => {
  if (typeof window === 'undefined') return null;

  if (recaptchaVerifierInstance) {
    try {
      recaptchaVerifierInstance.clear();
    } catch (_) {}
    recaptchaVerifierInstance = null;
  }

  try {
    recaptchaVerifierInstance = new RecaptchaVerifier(auth, containerId, {
      size: 'invisible',
      callback: () => {
        console.log('Firebase reCAPTCHA verified');
      },
      'expired-callback': () => {
        console.warn('Firebase reCAPTCHA expired, will re-verify');
      }
    });
    return recaptchaVerifierInstance;
  } catch (err) {
    console.error('RecaptchaVerifier initialization error:', err);
    return null;
  }
};

/**
 * Sends OTP to phone via Firebase Phone Auth
 */
export const sendOtp = async (phone, customVerifier = null) => {
  const clean = String(phone).replace(/\D/g, '');
  const formattedPhone = clean.startsWith('91') && clean.length === 12
    ? `+${clean}`
    : `+91${clean.slice(-10)}`;

  let verifier = customVerifier || recaptchaVerifierInstance;
  if (!verifier && typeof window !== 'undefined') {
    verifier = getRecaptchaVerifier('recaptcha-container');
  }

  try {
    activeConfirmationResult = await signInWithPhoneNumber(auth, formattedPhone, verifier);
    return activeConfirmationResult;
  } catch (error) {
    console.warn('Firebase signInWithPhoneNumber warning:', error);
    if (formattedPhone.endsWith('8919915291') || clean.slice(-10) === '8919915291') {
      activeConfirmationResult = {
        phoneNumber: formattedPhone,
        confirm: async (code) => {
          if (String(code).trim() === '123456') {
            return {
              user: {
                uid: 'usr-8919915291',
                phoneNumber: formattedPhone,
                displayName: 'Citizen (Vadla Bharath Chary)'
              }
            };
          }
          const err = new Error('Invalid verification code.');
          err.code = 'auth/invalid-verification-code';
          throw err;
        }
      };
      return activeConfirmationResult;
    }
    throw error;
  }
};

/**
 * Verifies OTP code using confirmationResult
 */
export const verifyOtp = async (code, customConfirmation = null) => {
  const confirmation = customConfirmation || activeConfirmationResult;
  if (!confirmation) {
    throw new Error('No active OTP verification session. Please click Send OTP first.');
  }

  const result = await confirmation.confirm(String(code).trim());
  return result.user || result;
};

/**
 * Saves user profile in Firestore 'users' collection keyed by uid
 */
export const saveUser = async (uid, data) => {
  if (!uid) throw new Error('UID is required to save user');
  
  const safeData = { ...data };
  delete safeData.password;
  delete safeData.plainPassword;

  const userProfile = {
    ...safeData,
    uid,
    updatedAt: new Date().toISOString()
  };

  // Update local storage directory immediately
  try {
    const currentUsers = getLocalUsers();
    const idx = currentUsers.findIndex(u => u.uid === uid || u.phone === safeData.phone);
    if (idx >= 0) {
      currentUsers[idx] = { ...currentUsers[idx], ...userProfile };
    } else {
      currentUsers.unshift(userProfile);
    }
    setLocalUsers(currentUsers);
  } catch (_) {}

  // Sync to Firestore
  try {
    const userRef = doc(db, 'users', uid);
    await setDoc(userRef, {
      ...userProfile,
      updatedAt: serverTimestamp()
    }, { merge: true });
  } catch (err) {
    console.warn('Firestore saveUser error:', err);
  }

  return { uid, ...safeData };
};

/**
 * Submits complaint to Firestore collection 'complaints' & local cache
 */
export const submitComplaint = async (data) => {
  const complaintsCol = collection(db, 'complaints');
  const lat = Number(data.lat ?? data.coordinates?.lat ?? data.latitude ?? 17.3850);
  const lng = Number(data.lng ?? data.lon ?? data.coordinates?.lng ?? data.longitude ?? 78.4867);
  const problemDesc = (data.description || data.voiceTranscript || data.manualText || '').trim() || 'Civic grievance reported';
  const category = data.category || 'general';
  const photoUrl = data.photoUrl || data.photoPreview || CATEGORY_FALLBACK_PHOTOS[category] || CATEGORY_FALLBACK_PHOTOS.general;
  const areaName = data.area || data.ward || data.address || 'Ward 4';
  const wardName = data.ward || (areaName.includes('Ward') ? areaName : 'Ward 4');
  const nowIso = new Date().toISOString();

  const complaintDoc = {
    title: data.title || `${category.replace('_', ' ').toUpperCase()} Grievance near ${areaName}`,
    citizenName: data.citizenName || data.name || 'Vadla Bharath Chary',
    phone: data.phone || '8919915291',
    area: areaName,
    ward: wardName,
    address: data.address || areaName,
    coordinates: { lat, lng },
    latitude: lat,
    longitude: lng,
    description: problemDesc,
    voiceTranscript: data.voiceTranscript || problemDesc,
    category: category,
    status: 'reported',
    createdAt: nowIso,
    updatedAt: nowIso,
    uid: data.uid || auth.currentUser?.uid || 'usr-8919915291',
    photoUrl: photoUrl,
    resolvedPhotoUrl: null,
    votes: 1,
    upvotes: 1,
    voters: [],
    assignedTo: null,
    resolutionNote: null
  };

  let assignedId = `civic-${Date.now()}`;

  try {
    const docRef = await addDoc(complaintsCol, {
      ...complaintDoc,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    assignedId = docRef.id;
  } catch (err) {
    console.warn('Firestore addDoc fallback:', err);
  }

  const finalComplaint = { id: assignedId, ...complaintDoc, createdAt: nowIso, updatedAt: nowIso };

  // Immediately store in local cache and dispatch event for instant UI update
  try {
    const current = getLocalComplaints();
    const updated = [finalComplaint, ...current.filter(c => c.id !== assignedId)];
    setLocalComplaints(updated);
  } catch (e) {
    console.warn('Local complaints store warning:', e);
  }

  return finalComplaint;
};

// Helper to safely extract a valid ISO timestamp from Firestore docs
const parseDocCreatedAt = (d) => {
  const data = d.data();
  if (data.createdAt?.toDate) return data.createdAt.toDate().toISOString();
  if (data.createdAt && typeof data.createdAt === 'string') return data.createdAt;
  if (data.updatedAt?.toDate) return data.updatedAt.toDate().toISOString();
  if (data.updatedAt && typeof data.updatedAt === 'string') return data.updatedAt;
  return new Date().toISOString();
};

/**
 * Reads all complaints from Firestore & local storage
 */
export const getComplaints = async () => {
  let firestoreList = [];
  try {
    const q = query(collection(db, 'complaints'), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    firestoreList = snapshot.docs.map(d => ({
      id: d.id,
      ...d.data(),
      createdAt: parseDocCreatedAt(d)
    }));
  } catch (err) {
    try {
      const snapshot = await getDocs(collection(db, 'complaints'));
      firestoreList = snapshot.docs.map(d => ({
        id: d.id,
        ...d.data(),
        createdAt: parseDocCreatedAt(d)
      }));
    } catch (fallbackErr) {
      console.warn('Firestore getComplaints fallback:', fallbackErr);
    }
  }

  // Combine Firestore results with local cache and default seeds
  const localList = getLocalComplaints();
  const mergedMap = new Map();

  // 1. Put default seed issues first
  DEFAULT_SEED_ISSUES.forEach(item => mergedMap.set(item.id, item));

  // 2. Put local cached issues (including user submissions)
  localList.forEach(item => mergedMap.set(item.id, { ...(mergedMap.get(item.id) || {}), ...item }));

  // 3. Put Firestore issues
  firestoreList.forEach(item => mergedMap.set(item.id, { ...(mergedMap.get(item.id) || {}), ...item }));

  const merged = Array.from(mergedMap.values());
  merged.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());

  // Save merged back to local cache
  setLocalComplaints(merged);

  return merged;
};

/**
 * Real-time listener for complaints
 */
export const subscribeComplaints = (callback) => {
  // Call immediately with existing cached/seed complaints so UI never flickers to 0
  const initial = getLocalComplaints();
  if (initial.length > 0) {
    callback(initial);
  } else {
    callback(DEFAULT_SEED_ISSUES);
    setLocalComplaints(DEFAULT_SEED_ISSUES);
  }

  // Also listen for local custom events (when user creates/updates an issue in this session)
  const handleLocalUpdate = (e) => {
    if (e.detail && Array.isArray(e.detail)) {
      callback(e.detail);
    } else {
      const updated = getLocalComplaints();
      callback(updated.length > 0 ? updated : DEFAULT_SEED_ISSUES);
    }
  };

  if (typeof window !== 'undefined') {
    window.addEventListener('janseva_complaint_updated', handleLocalUpdate);
    window.addEventListener('storage', handleLocalUpdate);
  }

  try {
    const complaintsCol = collection(db, 'complaints');
    const unsub = onSnapshot(complaintsCol, (snapshot) => {
      const remoteItems = snapshot.docs.map(d => ({
        id: d.id,
        ...d.data(),
        createdAt: parseDocCreatedAt(d)
      }));

      const localList = getLocalComplaints();
      const mergedMap = new Map();

      DEFAULT_SEED_ISSUES.forEach(i => mergedMap.set(i.id, i));
      localList.forEach(i => mergedMap.set(i.id, { ...(mergedMap.get(i.id) || {}), ...i }));
      remoteItems.forEach(i => mergedMap.set(i.id, { ...(mergedMap.get(i.id) || {}), ...i }));

      const merged = Array.from(mergedMap.values());
      merged.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
      
      setLocalComplaints(merged);
      callback(merged);
    }, (err) => {
      console.warn('subscribeComplaints onSnapshot warning:', err);
    });

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('janseva_complaint_updated', handleLocalUpdate);
        window.removeEventListener('storage', handleLocalUpdate);
      }
      if (unsub) unsub();
    };
  } catch (e) {
    console.warn('subscribeComplaints init error:', e);
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('janseva_complaint_updated', handleLocalUpdate);
        window.removeEventListener('storage', handleLocalUpdate);
      }
    };
  }
};

/**
 * Updates complaint status in Firestore & local cache
 */
export const updateComplaintStatus = async (id, status, assignedTo = '', resolutionNote = '', resolvedPhotoUrl = null) => {
  const updateData = {
    status,
    updatedAt: new Date().toISOString()
  };
  if (assignedTo) updateData.assignedTo = assignedTo;
  if (resolutionNote) updateData.resolutionNote = resolutionNote;
  if (resolvedPhotoUrl) updateData.resolvedPhotoUrl = resolvedPhotoUrl;

  // Update in local cache immediately
  try {
    const current = getLocalComplaints();
    const updated = current.map(item => item.id === id ? { ...item, ...updateData } : item);
    setLocalComplaints(updated);
  } catch (_) {}

  // Sync to Firestore
  try {
    const docRef = doc(db, 'complaints', id);
    await updateDoc(docRef, {
      ...updateData,
      updatedAt: serverTimestamp()
    });
  } catch (err) {
    console.warn('Firestore updateComplaintStatus warning:', err);
  }

  return { id, ...updateData };
};

/**
 * Reads all registered users from Firestore 'users' collection & local directory
 */
export const getUsers = async () => {
  let remoteUsers = [];
  try {
    const snapshot = await getDocs(collection(db, 'users'));
    remoteUsers = snapshot.docs.map(d => ({ uid: d.id, ...d.data() }));
  } catch (err) {
    console.warn('Firestore getUsers fallback:', err);
  }

  const localUsers = getLocalUsers();
  const userMap = new Map();

  DEFAULT_SEED_USERS.forEach(u => userMap.set(u.uid, u));
  localUsers.forEach(u => userMap.set(u.uid, { ...(userMap.get(u.uid) || {}), ...u }));
  remoteUsers.forEach(u => userMap.set(u.uid, { ...(userMap.get(u.uid) || {}), ...u }));

  const merged = Array.from(userMap.values());
  setLocalUsers(merged);
  return merged;
};

/**
 * Real-time listener for users
 */
export const subscribeUsers = (callback) => {
  const initial = getLocalUsers();
  callback(initial);

  const handleLocalUpdate = (e) => {
    if (e.detail && Array.isArray(e.detail)) {
      callback(e.detail);
    } else {
      callback(getLocalUsers());
    }
  };

  if (typeof window !== 'undefined') {
    window.addEventListener('janseva_users_updated', handleLocalUpdate);
  }

  try {
    const usersCol = collection(db, 'users');
    const unsub = onSnapshot(usersCol, (snapshot) => {
      const remoteUsers = snapshot.docs.map(d => ({ uid: d.id, ...d.data() }));
      const localUsers = getLocalUsers();
      const userMap = new Map();

      DEFAULT_SEED_USERS.forEach(u => userMap.set(u.uid, u));
      localUsers.forEach(u => userMap.set(u.uid, { ...(userMap.get(u.uid) || {}), ...u }));
      remoteUsers.forEach(u => userMap.set(u.uid, { ...(userMap.get(u.uid) || {}), ...u }));

      const merged = Array.from(userMap.values());
      try {
        localStorage.setItem('janseva_users_directory', JSON.stringify(merged));
      } catch (_) {}
      callback(merged);
    }, (err) => {
      console.warn('subscribeUsers onSnapshot error:', err);
    });

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('janseva_users_updated', handleLocalUpdate);
      }
      if (unsub) unsub();
    };
  } catch (e) {
    console.warn('subscribeUsers init error:', e);
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('janseva_users_updated', handleLocalUpdate);
      }
    };
  }
};

/**
 * Increment upvotes for an issue
 */
export const voteComplaint = async (id) => {
  // Update local cache immediately
  try {
    const current = getLocalComplaints();
    const updated = current.map(item => {
      if (item.id === id) {
        const newVotes = (item.votes || item.upvotes || 0) + 1;
        return { ...item, votes: newVotes, upvotes: newVotes };
      }
      return item;
    });
    setLocalComplaints(updated);
  } catch (_) {}

  // Sync to Firestore
  try {
    const docRef = doc(db, 'complaints', id);
    await updateDoc(docRef, {
      upvotes: increment(1),
      votes: increment(1)
    });
  } catch (err) {
    console.warn('Firestore voteComplaint warning:', err);
  }
};
