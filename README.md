# 📢 JanSeva (जनसेवा) - Voice & Photo Civic Issue Platform
> **A Centralized Civic Problem Detection, Reporting & Tracking Platform Designed for Non-Literate & Multilingual Citizens**

---

## 🌟 Overview & Problem Statement
In many communities, public problems like **broken streetlights, hazardous potholes, overflowing garbage bins, and leaking public taps** remain unnoticed and unresolved for weeks because:
1. Citizens do not know which department or portal to approach.
2. Written forms and bureaucratic portals are inaccessible to non-literate or less-educated individuals.
3. Language barriers prevent regional citizens from filing complaints in their native tongue.
4. Authorities lack a centralized dashboard to track, assign, verify, and deduplicate grievances.

**JanSeva** solves this by providing an **ultra-accessible, voice-first, photo-based civic problem detection, reporting, and tracking platform**.

---

## 🚀 Unique & Key Features

### 1. 📸 Photo-Based Problem Reporting
- Citizens simply snap or upload a photo of the issue using their mobile camera.
- No typing required!

### 2. 🤖 Automatic AI Categorization
- High-accuracy computer-vision heuristics and multilingual NLP categorize the problem automatically (Garbage, Pothole, Streetlight, Water Leak, Electrical).
- When a photo is taken, the app announces the detected category aloud in the user's selected language!

### 3. 📍 Automatic GPS Location-Based Reporting
- Geolocation API automatically captures precise latitude & longitude coordinates.
- Attaches ward name and human-readable locality name.

### 4. ⚡ Duplicate Complaint Detection (Vicinity Clustering)
- Uses the Haversine formula to detect if another citizen has already reported the same issue within **80 meters**.
- If a duplicate is found, it does **not** reject the complaint; instead, it automatically adds **+1 urgent community vote** to the existing complaint and informs the citizen:
  > *"A similar issue was already reported 35m away! Your voice has been added to escalate priority."*

### 5. 🔊 Designed for Non-Literate / Low-Literacy Citizens (Voice Guidance)
- **Zero Typing Required**: Giant microphone button allows users to speak their grievance in their regional language.
- **Audio Read-Aloud (TTS)**: Every button, category, status update, and officer note has a speaker icon 🔊 that speaks clearly in the native language.
- **Speech-to-Text (STT)**: Transcribes the spoken voice into text in real time.
- **Large Pictographic Visuals**: Colorful, high-contrast visual icons for each category.
- **Sound Feedback**: Tactile audio beeps and success chimes for every interaction.

### 6. 🌐 Multilingual Support (6 Indian Languages + English)
- 🇮🇳 **हिन्दी (Hindi)**
- 🇮🇳 **తెలుగు (Telugu)**
- 🇮🇳 **தமிழ் (Tamil)**
- 🇮🇳 **ಕನ್ನಡ (Kannada)**
- 🇮🇳 **मराठी (Marathi)**
- 🌐 **English**
- Pronounces welcome and guides in the selected dialect.

### 7. 📋 Public Issue Tracking & Before/After Proof
- Real-time visual progress tracker:
  - 🔴 **Reported** (शिकायत दर्ज)
  - 🟡 **In Progress** (अधिकारी काम पर हैं)
  - 🟢 **Resolved** (हल हो गया)
- **Before & After Photos**: Shows side-by-side photographic proof once an issue is fixed by municipal workers.

### 8. 🚨 Community Voting ("Me Too!" / Urgent Escalation)
- Affected citizens can tap the **"Me Too! / Urgent"** button.
- Issues with **5+ votes** are automatically flagged as **🚨 CRITICAL PRIORITY** to draw immediate municipal action.

### 9. 🏛️ Authority / Municipal Officer Dashboard
- Complete command center for Municipal Commissioners, Ward Officers, and Panchayats:
  - KPI Metrics (Total Logged, Pending, In-Progress, Resolved, High Urgency).
  - Ward-wise & Category-wise filters.
  - Interactive Leaflet Geo-Map showing all pins.
  - Action Controls: Assign field workers / contractors, update status, write notes, and **upload resolution proof photo**.

---

## 📁 Project Architecture & Folder Structure

```
iqx24/
├── backend/                  # Node.js & Express RESTful API Server
│   ├── data/                 # Persistent file-backed JSON database
│   │   └── issues.json       # Issue records with seed data & votes
│   ├── uploads/              # Uploaded photos & audio files
│   ├── aiClassifier.js       # AI auto-classification engine
│   ├── database.js           # Database queries & Haversine duplicate detector
│   ├── server.js             # Express API server & file upload handlers
│   └── package.json          # Backend dependencies
│
├── frontend/                 # React + Vite Interactive Accessible Web App
│   ├── public/               # Public assets
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.jsx              # Header, Language Picker & Spoken Guide
│   │   │   ├── ReportIssue.jsx         # Photo snap, Mic recorder, AI category
│   │   │   ├── IssueFeed.jsx           # Public tracker, Voting & Before/After
│   │   │   ├── MapView.jsx             # Leaflet GPS map with spoken popups
│   │   │   └── AuthorityDashboard.jsx  # Officer command center & resolution proof
│   │   ├── utils/
│   │   │   ├── translations.js         # Multi-language dictionary & audio strings
│   │   │   └── speech.js               # Web Speech API (TTS & STT engine)
│   │   ├── App.jsx                     # Root application coordinator
│   │   └── main.jsx                    # React entry point
│   ├── index.html            # High-contrast accessible HTML with Tailwind
│   ├── vite.config.js        # Vite build & proxy config
│   └── package.json          # Frontend dependencies
│
├── start.bat                 # 1-Click Windows launch script
└── README.md                 # Documentation
```

---

## ⚡ How to Run the Application

### 1. Start Backend:
```bash
cd backend
npm start
```
Backend will be live at `http://localhost:5000`

### 2. Start Frontend:
```bash
cd frontend
npm run dev
```
Frontend will be live at `http://localhost:5173`

*(Or double click `start.bat` on Windows to launch both simultaneously!)*
