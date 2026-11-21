import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_FILE = path.join(__dirname, 'data', 'issues.json');
const USERS_FILE = path.join(__dirname, 'data', 'users.json');

// Ensure data folder exists
if (!fs.existsSync(path.join(__dirname, 'data'))) {
  fs.mkdirSync(path.join(__dirname, 'data'), { recursive: true });
}

const SEED_USERS = [
  {
    id: "usr-001",
    name: "గంగమ్మ (Gangamma)",
    username: "ganga123",
    password: "123",
    idType: "aadhaar",
    idNumber: "9876-5432-1098",
    phone: "9876543210",
    language: "te",
    userType: "illiterate", // Voice Assistant Active
    createdAt: new Date().toISOString()
  },
  {
    id: "usr-002",
    name: "రాజేష్ కుమార్ (Rajesh Kumar)",
    username: "rajesh456",
    password: "123",
    idType: "pan",
    idNumber: "ABCDE1234F",
    phone: "9123456780",
    language: "te",
    userType: "literate", // Standard Mode (No continuous voice assist)
    createdAt: new Date().toISOString()
  },
  {
    id: "usr-003",
    name: "K. Suresh (Ward 4 Officer)",
    username: "officer_ward4",
    password: "123",
    idType: "aadhaar",
    idNumber: "5544-3322-1100",
    phone: "9988776655",
    language: "te",
    userType: "literate",
    role: "authority",
    createdAt: new Date().toISOString()
  },
  {
    id: "usr-004",
    name: "GHMC Municipal Commissioner",
    username: "officer@ghmc.gov.in",
    password: "admin123",
    idType: "aadhaar",
    idNumber: "9900-1122-3344",
    phone: "9876500000",
    language: "en",
    userType: "literate",
    role: "authority",
    createdAt: new Date().toISOString()
  },
  {
    id: "usr-005",
    name: "GHMC Executive Engineer",
    username: "admin.ghmc",
    password: "admin123",
    idType: "aadhaar",
    idNumber: "8899-7766-5544",
    phone: "9876511111",
    language: "te",
    userType: "literate",
    role: "authority",
    createdAt: new Date().toISOString()
  }
];

// Distance calculation using Haversine formula (returns distance in meters)
export function calculateDistanceMeters(lat1, lon1, lat2, lon2) {
  if (!lat1 || !lon1 || !lat2 || !lon2) return 9999999;
  const R = 6371e3; // Earth radius in meters
  const toRad = (val) => (val * Math.PI) / 180;
  
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

// Default initial issues to showcase features immediately
const SEED_ISSUES = [
  {
    id: "civic-seed-001",
    category: "garbage",
    status: "reported",
    title: "Overflowing Garbage Container",
    photoUrl: "https://images.unsplash.com/photo-1605600659908-0ef719419d41?auto=format&fit=crop&w=600&q=80",
    audioUrl: null,
    voiceTranscript: "कचरा पेटी बहुत दिनों से भरी हुई है, बहुत बदबू आ रही है (Garbage bin overflowing since days, foul smell)",
    language: "hi",
    latitude: 17.3850,
    longitude: 78.4867,
    address: "Near Old Clock Tower, Ward 4, Charminar Zone",
    ward: "Ward 4",
    votes: 8,
    duplicateCount: 2,
    createdAt: new Date(Date.now() - 36 * 3600 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 36 * 3600 * 1000).toISOString(),
    assignedTo: null,
    resolutionNote: null,
    resolvedPhotoUrl: null
  },
  {
    id: "civic-seed-002",
    category: "pothole",
    status: "in_progress",
    title: "Deep Pothole Causing Vehicle Accidents",
    photoUrl: "https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=600&q=80",
    audioUrl: null,
    voiceTranscript: "రోడ్డు మీద పెద్ద గుంత పడింది, రాత్రిళ్లు బైకులు పడిపోతున్నాయి (Deep pit on road, two-wheelers falling at night)",
    language: "te",
    latitude: 17.3912,
    longitude: 78.4721,
    address: "Main Market Road, Beside Post Office, Ward 8",
    ward: "Ward 8",
    votes: 14,
    duplicateCount: 3,
    createdAt: new Date(Date.now() - 48 * 3600 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 12 * 3600 * 1000).toISOString(),
    assignedTo: "K. Ramesh (Road Maintenance Crew)",
    resolutionNote: "Asphalt patch team dispatched, road leveling in progress.",
    resolvedPhotoUrl: null
  },
  {
    id: "civic-seed-003",
    category: "water_leak",
    status: "reported",
    title: "Burst Public Drinking Water Pipeline",
    photoUrl: "https://images.unsplash.com/photo-1584467735871-8e85353a8413?auto=format&fit=crop&w=600&q=80",
    audioUrl: null,
    voiceTranscript: "குடிநீர் குழாய் உடைந்து தண்ணீர் வீணாக போகிறது (Drinking water pipe broken, heavy water wastage)",
    language: "ta",
    latitude: 17.3815,
    longitude: 78.4910,
    address: "Govt Primary School Lane, Ward 5",
    ward: "Ward 5",
    votes: 19,
    duplicateCount: 4,
    createdAt: new Date(Date.now() - 20 * 3600 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 20 * 3600 * 1000).toISOString(),
    assignedTo: null,
    resolutionNote: null,
    resolvedPhotoUrl: null
  },
  {
    id: "civic-seed-004",
    category: "streetlight",
    status: "resolved",
    title: "Dark Street - Broken Streetlight Pole",
    photoUrl: "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=600&q=80",
    audioUrl: null,
    voiceTranscript: "बस्ती में लाइट 5 दिनों से बंद थी, अंधेरे में डर लगता था (Streetlight was off for 5 days)",
    language: "hi",
    latitude: 17.3789,
    longitude: 78.4835,
    address: "Street No. 3, Gandhi Colony, Ward 12",
    ward: "Ward 12",
    votes: 6,
    duplicateCount: 1,
    createdAt: new Date(Date.now() - 72 * 3600 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 4 * 3600 * 1000).toISOString(),
    assignedTo: "Electricity Board Unit 4",
    resolutionNote: "Replaced fused 65W LED luminaire and fixed capacitor fuse.",
    resolvedPhotoUrl: "https://images.unsplash.com/photo-1517420704952-d9f39e95b43e?auto=format&fit=crop&w=600&q=80"
  },
  {
    id: "civic-seed-005",
    category: "electrical",
    status: "reported",
    title: "Dangling Live Electric Cable near Bus Stop",
    photoUrl: "https://images.unsplash.com/photo-1544724569-5f546fd6f2b5?auto=format&fit=crop&w=600&q=80",
    audioUrl: null,
    voiceTranscript: "విద్యుత్ తీగ తెగి కిందకు వేలాడుతోంది, చాలా ప్రమాదం (Electric wire snapped and hanging low, very dangerous)",
    language: "te",
    latitude: 17.3875,
    longitude: 78.4790,
    address: "RTC Bus Stop, Ward 9",
    ward: "Ward 9",
    votes: 27,
    duplicateCount: 5,
    createdAt: new Date(Date.now() - 6 * 3600 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 6 * 3600 * 1000).toISOString(),
    assignedTo: null,
    resolutionNote: null,
    resolvedPhotoUrl: null
  }
];

class Database {
  constructor() {
    this.issues = [];
    this.users = [];
    this.init();
  }

  init() {
    try {
      if (fs.existsSync(DATA_FILE)) {
        const raw = fs.readFileSync(DATA_FILE, 'utf-8');
        this.issues = JSON.parse(raw);
      } else {
        this.issues = SEED_ISSUES;
        this.save();
      }

      if (fs.existsSync(USERS_FILE)) {
        const rawUsers = fs.readFileSync(USERS_FILE, 'utf-8');
        this.users = JSON.parse(rawUsers);
      } else {
        this.users = SEED_USERS;
        this.saveUsers();
      }
    } catch (err) {
      console.error("Error reading database file, using seed data:", err);
      this.issues = SEED_ISSUES;
      this.users = SEED_USERS;
      this.save();
      this.saveUsers();
    }
  }

  save() {
    try {
      fs.writeFileSync(DATA_FILE, JSON.stringify(this.issues, null, 2), 'utf-8');
    } catch (err) {
      console.error("Error writing database file:", err);
    }
  }

  saveUsers() {
    try {
      fs.writeFileSync(USERS_FILE, JSON.stringify(this.users, null, 2), 'utf-8');
    } catch (err) {
      console.error("Error writing users file:", err);
    }
  }

  // --- USER AUTHENTICATION METHODS ---
  registerUser({ name, username, password, idType, idNumber, phone, language = 'te', userType = 'illiterate', areaName = '', ward = 'Ward 4', latitude = 17.3850, longitude = 78.4867 }) {
    // Check if username already exists
    const existing = this.users.find(u => u.username.toLowerCase() === username.toLowerCase());
    if (existing) {
      throw new Error("Username already taken / యూజర్‌నేమ్ ఇప్పటికే వాడకంలో ఉంది");
    }

    const newUser = {
      id: `usr-${Date.now().toString().slice(-6)}`,
      name: name || username,
      username,
      password,
      idType, // 'aadhaar' | 'pan' | 'voter_id' | 'ration_card'
      idNumber,
      phone,
      language,
      userType, // 'illiterate' | 'literate'
      areaName: areaName || 'Old City, Ward 4',
      ward: ward || 'Ward 4',
      latitude: latitude ? parseFloat(latitude) : 17.3850,
      longitude: longitude ? parseFloat(longitude) : 78.4867,
      role: 'citizen',
      createdAt: new Date().toISOString()
    };

    this.users.push(newUser);
    this.saveUsers();

    // Return safe user copy without exposing raw password in response
    const { password: _, ...safeUser } = newUser;
    return safeUser;
  }

  authenticateUser(usernameOrId, password) {
    const q = (usernameOrId || '').trim().toLowerCase();
    const user = this.users.find(u => 
      u.username.toLowerCase() === q ||
      (u.idNumber && u.idNumber.toLowerCase() === q)
    );

    if (!user || user.password !== password) {
      return null;
    }

    const { password: _, ...safeUser } = user;
    return safeUser;
  }

  getUserById(id) {
    const user = this.users.find(u => u.id === id);
    if (!user) return null;
    const { password: _, ...safeUser } = user;
    return safeUser;
  }

  getAll({ category, status, search, sortBy = 'votes' } = {}) {
    let list = [...this.issues];

    if (category && category !== 'all') {
      list = list.filter(i => i.category === category);
    }

    if (status && status !== 'all') {
      list = list.filter(i => i.status === status);
    }

    if (search && search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(i =>
        (i.title && i.title.toLowerCase().includes(q)) ||
        (i.address && i.address.toLowerCase().includes(q)) ||
        (i.ward && i.ward.toLowerCase().includes(q)) ||
        (i.voiceTranscript && i.voiceTranscript.toLowerCase().includes(q))
      );
    }

    // Sorting
    if (sortBy === 'votes') {
      list.sort((a, b) => b.votes - a.votes);
    } else if (sortBy === 'recent') {
      list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    } else if (sortBy === 'urgent') {
      // Priority: unresolved first, then votes
      list.sort((a, b) => {
        if (a.status === 'resolved' && b.status !== 'resolved') return 1;
        if (a.status !== 'resolved' && b.status === 'resolved') return -1;
        return b.votes - a.votes;
      });
    }

    return list;
  }

  getById(id) {
    return this.issues.find(i => i.id === id);
  }

  /**
   * Check for duplicate complaints within radius (meters) for active issues
   */
  findDuplicate({ category, latitude, longitude, radiusMeters = 80 }) {
    if (!latitude || !longitude) return null;

    const activeIssues = this.issues.filter(
      i => i.status !== 'resolved' && (i.category === category || category === 'other')
    );

    let closestMatch = null;
    let minDistance = Infinity;

    for (const issue of activeIssues) {
      const dist = calculateDistanceMeters(latitude, longitude, issue.latitude, issue.longitude);
      if (dist <= radiusMeters && dist < minDistance) {
        minDistance = dist;
        closestMatch = { issue, distanceMeters: dist };
      }
    }

    return closestMatch;
  }

  create(issueData) {
    this.issues.unshift(issueData);
    this.save();
    return issueData;
  }

  upvote(id) {
    const issue = this.getById(id);
    if (!issue) return null;
    issue.votes = (issue.votes || 0) + 1;
    issue.updatedAt = new Date().toISOString();
    this.save();
    return issue;
  }

  addDuplicateVote(id, distanceMeters) {
    const issue = this.getById(id);
    if (!issue) return null;
    issue.votes = (issue.votes || 0) + 1;
    issue.duplicateCount = (issue.duplicateCount || 0) + 1;
    issue.updatedAt = new Date().toISOString();
    this.save();
    return issue;
  }

  updateStatus(id, { status, assignedTo, resolutionNote, resolvedPhotoUrl }) {
    const issue = this.getById(id);
    if (!issue) return null;

    if (status) issue.status = status;
    if (assignedTo !== undefined) issue.assignedTo = assignedTo;
    if (resolutionNote !== undefined) issue.resolutionNote = resolutionNote;
    if (resolvedPhotoUrl !== undefined) issue.resolvedPhotoUrl = resolvedPhotoUrl;

    issue.updatedAt = new Date().toISOString();
    this.save();
    return issue;
  }

  getStats() {
    const total = this.issues.length;
    const reported = this.issues.filter(i => i.status === 'reported').length;
    const inProgress = this.issues.filter(i => i.status === 'in_progress').length;
    const resolved = this.issues.filter(i => i.status === 'resolved').length;
    const highUrgency = this.issues.filter(i => i.votes >= 5 && i.status !== 'resolved').length;

    const byCategory = {};
    for (const issue of this.issues) {
      byCategory[issue.category] = (byCategory[issue.category] || 0) + 1;
    }

    const byWard = {};
    for (const issue of this.issues) {
      const ward = issue.ward || 'General';
      byWard[ward] = (byWard[ward] || 0) + 1;
    }

    return {
      total,
      reported,
      inProgress,
      resolved,
      highUrgency,
      byCategory,
      byWard
    };
  }
}

export const db = new Database();
