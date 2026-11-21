import express from 'express';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { fileURLToPath } from 'url';
import { db } from './database.js';
import { classifyIssue } from './aiClassifier.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Ensure uploads folder exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Static serve for uploaded media
app.use('/uploads', express.static(uploadsDir));

// Multer storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || (file.mimetype.includes('image') ? '.jpg' : '.webm');
    cb(null, `${Date.now()}-${uuidv4().slice(0, 8)}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 15 * 1024 * 1024 } // 15 MB limit
});

// Category titles in multiple languages
const CATEGORY_NAMES = {
  garbage: { en: "Overflowing Garbage", hi: "कचरे का ढेर", te: "చెత్త కుప్ప", ta: "குப்பை கூளம்" },
  pothole: { en: "Damaged Road / Pothole", hi: "सड़क पर खड्डा", te: "రోడ్డు గుంత", ta: "சாலை குழி" },
  streetlight: { en: "Broken Streetlight", hi: "बंद स्ट्रीट लाइट", te: "వీధి దీపం బల్బు", ta: "தெரு விளக்கு பழுது" },
  water_leak: { en: "Leaking Water Pipe/Tap", hi: "पानी का नल / लीकेज", te: "నీటి పైప్ లీకేజీ", ta: "குடிநீர் குழாய் கசிவு" },
  electrical: { en: "Hanging Electric Wire", hi: "खतरनाक बिजली का तार", te: "విద్యుత్ వైరు ప్రమాదం", ta: "மின் கம்பி விபத்து" },
  other: { en: "Public Problem", hi: "सार्वजनिक समस्या", te: "ప్రజా సమస్య", ta: "பொது பிரச்சனை" }
};

// --- API ROUTES ---

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'JanSeva Civic Care Platform', time: new Date() });
});

// In-memory OTP store for mobile verification
const otpStore = new Map();

// Send OTP to Citizen Mobile Phone
app.post('/api/auth/send-otp', (req, res) => {
  try {
    const { phone } = req.body;
    if (!phone || phone.replace(/\D/g, '').length < 10) {
      return res.status(400).json({ success: false, message: 'Valid 10-digit mobile number required' });
    }

    const cleanPhone = phone.replace(/\D/g, '').slice(-10);
    // Generate 4-digit verification OTP
    const otp = Math.floor(1000 + Math.random() * 9000).toString();
    otpStore.set(cleanPhone, {
      otp,
      expiresAt: Date.now() + 5 * 60 * 1000 // 5 minutes
    });

    console.log(`📲 [SMS GATEWAY] OTP sent to +91-${cleanPhone}: ${otp}`);

    res.json({
      success: true,
      message: `OTP sent successfully to +91 ${cleanPhone}`,
      otp // returned so user can see simulated SMS alert on screen
    });
  } catch (err) {
    console.error('Send OTP error:', err);
    res.status(500).json({ success: false, message: 'Failed to send OTP' });
  }
});

// Verify Citizen Mobile OTP
app.post('/api/auth/verify-otp', (req, res) => {
  try {
    const { phone, otp } = req.body;
    if (!phone || !otp) {
      return res.status(400).json({ success: false, message: 'Phone and OTP are required' });
    }

    const cleanPhone = phone.replace(/\D/g, '').slice(-10);
    const stored = otpStore.get(cleanPhone);

    if (!stored) {
      return res.status(400).json({ success: false, message: 'No OTP requested for this mobile number. Please click Send OTP.' });
    }

    if (Date.now() > stored.expiresAt) {
      otpStore.delete(cleanPhone);
      return res.status(400).json({ success: false, message: 'OTP has expired. Please request a new OTP.' });
    }

    if (stored.otp !== otp.trim()) {
      return res.status(400).json({ success: false, message: 'Invalid OTP. Please check the SMS and re-enter.' });
    }

    // OTP verified
    otpStore.delete(cleanPhone);
    res.json({
      success: true,
      message: 'Mobile number verified successfully!'
    });
  } catch (err) {
    console.error('Verify OTP error:', err);
    res.status(500).json({ success: false, message: 'OTP verification failed' });
  }
});

// Citizen Registration Portal with Official ID & Literacy Selection
app.post('/api/auth/register', (req, res) => {
  try {
    const { name, username, password, idType, idNumber, phone, language, userType, areaName, ward, latitude, longitude } = req.body;

    if (!userType) {
      return res.status(400).json({
        success: false,
        message: 'Please select Literacy Preference: Non-Literate or Literate'
      });
    }

    if (!idType || !idNumber) {
      return res.status(400).json({
        success: false,
        message: 'Please select an Official ID Card (Aadhaar/PAN/Voter/Ration) and provide its number'
      });
    }

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Username and password are required'
      });
    }

    const user = db.registerUser({
      name,
      username,
      password,
      idType, // 'aadhaar' | 'pan' | 'voter_id' | 'ration_card'
      idNumber,
      phone,
      language: language || 'en',
      userType, // 'illiterate' | 'literate'
      areaName,
      ward,
      latitude,
      longitude
    });

    res.status(201).json({
      success: true,
      user,
      message: 'Registration successful! Please sign in with your credentials.'
    });
  } catch (err) {
    console.error('Registration error:', err.message);
    res.status(400).json({ success: false, message: err.message });
  }
});

// Citizen Login
app.post('/api/auth/login', (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ success: false, message: 'Username and password required' });
    }

    const user = db.authenticateUser(username, password);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials / తప్పుడు యూజర్‌నేమ్ లేదా పాస్‌వర్డ్'
      });
    }

    res.json({
      success: true,
      user,
      message: 'Login successful'
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ success: false, message: 'Login failed' });
  }
});

// Dedicated Municipal Authority & Officer Login (Restricted to official staff)
app.post('/api/auth/authority-login', (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ success: false, message: 'Officer ID/Username and password required' });
    }

    const q = username.trim().toLowerCase();
    // Validate required official username format
    const isValidFormat = q.includes('officer') || q.includes('admin') || q.includes('gov') || q.includes('ghmc') || q.includes('ward');
    if (!isValidFormat) {
      return res.status(400).json({
        success: false,
        message: 'Invalid Username Format: Official username must follow municipal format (e.g. officer@gov.in, officer_ward4, or admin.ghmc)'
      });
    }

    const user = db.authenticateUser(username, password);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid Official Credentials: Check Officer ID and password.'
      });
    }

    // Public citizens cannot log in here! ("public ki ravodhu login")
    if (user.role !== 'authority') {
      return res.status(403).json({
        success: false,
        message: 'Access Denied: Public citizen accounts cannot access Authority Portal. Please use Citizen Sign In.'
      });
    }

    res.json({
      success: true,
      user,
      message: 'Official Authority Login Successful'
    });
  } catch (err) {
    console.error('Authority Login error:', err);
    res.status(500).json({ success: false, message: 'Authority authentication failed' });
  }
});

// Get all issues with filters
app.get('/api/issues', (req, res) => {
  try {
    const { category, status, search, sortBy } = req.query;
    const issues = db.getAll({ category, status, search, sortBy });
    res.json({ success: true, count: issues.length, data: issues });
  } catch (err) {
    console.error('Error fetching issues:', err);
    res.status(500).json({ success: false, message: 'Server error fetching issues' });
  }
});

// Get single issue
app.get('/api/issues/:id', (req, res) => {
  const issue = db.getById(req.params.id);
  if (!issue) {
    return res.status(404).json({ success: false, message: 'Issue not found' });
  }
  res.json({ success: true, data: issue });
});

// Standalone AI Auto-Categorize (for instant visual voice feedback when user snaps a photo)
app.post('/api/ai/classify', upload.single('photo'), (req, res) => {
  try {
    const filename = req.file ? req.file.filename : req.body.hint || '';
    const transcript = req.body.transcript || '';
    const fallbackCategory = req.body.category || null;

    const result = classifyIssue({ filename, transcript, fallbackCategory });
    res.json({ success: true, ...result });
  } catch (err) {
    console.error('Classification error:', err);
    res.status(500).json({ success: false, category: 'other', confidence: 0.5 });
  }
});

// Submit a new complaint (with Photo, Audio, Location, Auto-categorize & Duplicate Detection)
app.post('/api/issues', upload.fields([
  { name: 'photo', maxCount: 1 },
  { name: 'voiceNote', maxCount: 1 }
]), async (req, res) => {
  try {
    const photoFile = req.files?.photo?.[0];
    const voiceFile = req.files?.voiceNote?.[0];

    const lat = req.body.latitude ? parseFloat(req.body.latitude) : 17.3850;
    const lon = req.body.longitude ? parseFloat(req.body.longitude) : 78.4867;
    const userCategory = req.body.category || 'auto';
    const transcript = req.body.voiceTranscript || '';
    const language = req.body.language || 'hi';
    const address = req.body.address || 'Detected Location, Ward 6';
    const ward = req.body.ward || 'Ward 6';

    // 1. Run AI auto-categorization if set to auto or fallback
    const aiResult = classifyIssue({
      filename: photoFile ? photoFile.originalname : '',
      transcript,
      fallbackCategory: userCategory !== 'auto' ? userCategory : null
    });
    const finalCategory = aiResult.category;

    // 2. Check for DUPLICATE COMPLAINT in vicinity (< 80 meters)
    const duplicate = db.findDuplicate({
      category: finalCategory,
      latitude: lat,
      longitude: lon,
      radiusMeters: 80
    });

    if (duplicate) {
      // DUPLICATE DETECTED!
      // Add +1 vote and increment duplicate counter to existing issue
      const updatedParent = db.addDuplicateVote(duplicate.issue.id, duplicate.distanceMeters);

      return res.status(200).json({
        success: true,
        isDuplicate: true,
        primaryIssue: updatedParent,
        distanceMeters: duplicate.distanceMeters,
        message: {
          en: `A similar issue was already reported ${duplicate.distanceMeters}m away! Your report has been added as an URGENT vote to fast-track municipal action.`,
          hi: `यह समस्या पहले से ही ${duplicate.distanceMeters} मीटर दूर दर्ज है! आपके वोट से इसकी प्राथमिकता बढ़ गई है।`,
          te: `ఈ సమస్య ఇప్పటికే ${duplicate.distanceMeters} మీటర్ల దూరంలో నమోదై ఉంది! త్వరిత పరిష్కారం కోసం మీ మద్దతును ఓటుగా చేర్చాము.`,
          ta: `இதே பிரச்சனை ஏற்கனவே ${duplicate.distanceMeters}மீ தூரத்தில் பதிவாகியுள்ளது! உங்கள் குரல் முன்னுரிமைக்காக சேர்க்கப்பட்டுள்ளது.`
        }
      });
    }

    // 3. Create fresh issue
    const photoUrl = photoFile
      ? `/uploads/${photoFile.filename}`
      : req.body.photoUrl || "https://images.unsplash.com/photo-1530587191325-3db32d826c18?auto=format&fit=crop&w=600&q=80";

    const audioUrl = voiceFile ? `/uploads/${voiceFile.filename}` : null;

    const title = req.body.title || (
      CATEGORY_NAMES[finalCategory]?.[language] ||
      CATEGORY_NAMES[finalCategory]?.en ||
      'Public Civic Problem'
    );

    const newIssue = {
      id: `civic-${Date.now().toString().slice(-6)}-${uuidv4().slice(0, 4)}`,
      category: finalCategory,
      title,
      status: 'reported',
      photoUrl,
      audioUrl,
      voiceTranscript: transcript,
      language,
      latitude: lat,
      longitude: lon,
      address,
      ward,
      votes: 1, // initial citizen report counts as 1 vote
      duplicateCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      assignedTo: null,
      resolutionNote: null,
      resolvedPhotoUrl: null,
      autoClassified: aiResult.autoDetected,
      confidenceScore: aiResult.confidence
    };

    const created = db.create(newIssue);

    res.status(201).json({
      success: true,
      isDuplicate: false,
      data: created,
      message: {
        en: "Your complaint has been successfully registered! Local authorities are notified.",
        hi: "आपकी शिकायत सफलतापूर्वक दर्ज हो गई है! अधिकारियों को सूचित कर दिया गया है।",
        te: "మీ ఫిర్యాదు విజయవంతంగా నమోదైంది! అధికారులకు తెలియజేయబడింది.",
        ta: "உங்கள் புகார் வெற்றிகரமாக பதிவு செய்யப்பட்டது! அதிகாரிகளுக்கு தெரிவிக்கப்பட்டது."
      }
    });

  } catch (err) {
    console.error('Error submitting issue:', err);
    res.status(500).json({ success: false, message: 'Failed to register issue' });
  }
});

// Upvote / "Me Too" Community voting
app.post('/api/issues/:id/vote', (req, res) => {
  const updated = db.upvote(req.params.id);
  if (!updated) {
    return res.status(404).json({ success: false, message: 'Issue not found' });
  }
  res.json({
    success: true,
    data: updated,
    message: "Thank you! Your vote increases the urgency for municipal resolution."
  });
});

// Authority Dashboard: Update status, assign worker, upload resolution proof photo
app.patch('/api/issues/:id/status', upload.single('resolvedPhoto'), (req, res) => {
  try {
    const { status, assignedTo, resolutionNote } = req.body;
    let resolvedPhotoUrl = undefined;

    if (req.file) {
      resolvedPhotoUrl = `/uploads/${req.file.filename}`;
    } else if (req.body.resolvedPhotoUrl) {
      resolvedPhotoUrl = req.body.resolvedPhotoUrl;
    }

    const updated = db.updateStatus(req.params.id, {
      status,
      assignedTo,
      resolutionNote,
      resolvedPhotoUrl
    });

    if (!updated) {
      return res.status(404).json({ success: false, message: 'Issue not found' });
    }

    res.json({
      success: true,
      data: updated,
      message: `Issue marked as ${status.replace('_', ' ').toUpperCase()}`
    });
  } catch (err) {
    console.error('Error updating status:', err);
    res.status(500).json({ success: false, message: 'Failed to update issue status' });
  }
});

// Authority Analytics & Stats
app.get('/api/stats', (req, res) => {
  try {
    const stats = db.getStats();
    res.json({ success: true, data: stats });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to calculate stats' });
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`===============================================`);
  console.log(`🏛️  JanSeva Backend running on http://localhost:${PORT}`);
  console.log(`📁 Uploads available at http://localhost:${PORT}/uploads`);
  console.log(`===============================================`);
});
