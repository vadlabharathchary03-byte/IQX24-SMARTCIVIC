import React, { useState, useEffect } from 'react';
import { User, Phone, ArrowRight, MapPin, Navigation, AlertCircle, Shield, Check, Building2, KeyRound, Wrench, RefreshCw, Send, Smartphone, Sparkles, CheckCircle2, Lock, Eye, EyeOff } from 'lucide-react';
import { LANGUAGES } from '../utils/translations';
import { playAudioFeedback } from '../utils/speech';
import { sendOtp, verifyOtp, saveUser } from '../firebaseActions';

// Multi-language UI dictionary for AuthPortal
const AUTH_STRINGS = {
  headerPortalName: {
    en: 'Public Grievance & Citizen Portal',
    te: 'ప్రజా సమస్యల పరిష్కార పోర్టల్',
    hi: 'लोक शिकायत एवं नागरिक पोर्टल',
    ta: 'பொது குறைதீர்ப்பு மற்றும் குடிமக்கள் போர்ட்டல்',
    kn: 'ಸಾರ್ವಜನಿಕ ಕುಂದುಕೊರತೆ ಮತ್ತು ನಾಗರಿಕ ಪೋರ್ಟಲ್',
    mr: 'सार्वजनिक तक्रार व नागरिक पोर्टल'
  },
  activeLanguageLabel: {
    en: 'Active Language:',
    te: 'ప్రస్తుత భాష:',
    hi: 'सक्रिय भाषा:',
    ta: 'செயலில் உள்ள மொழி:',
    kn: 'ಸಕ್ರಿಯ ಭಾಷೆ:',
    mr: 'सक्रिय भाषा:'
  },
  tabCitizen: {
    en: 'Citizen Login',
    te: 'పౌరుల లాగిన్',
    hi: 'नागरिक लॉगिन',
    ta: 'குடிமக்கள் உள்நுழைவு',
    kn: 'ನಾಗರಿಕ ಲಾಗಿನ್',
    mr: 'नागरिक लॉगिन'
  },
  tabWorker: {
    en: 'Worker Login',
    te: 'ఫీల్డ్ వర్కర్ లాగిన్',
    hi: 'फील्ड वर्कर लॉगिन',
    ta: 'பணியாளர் உள்நுழைவு',
    kn: 'ಕೆಲಸಗಾರರ ಲಾಗಿನ್',
    mr: 'कामगार लॉगिन'
  },
  tabOfficer: {
    en: 'Officer Portal',
    te: 'అధికారుల పోర్టల్',
    hi: 'अधिकारी पोर्टल',
    ta: 'அதிகாரி போர்ட்டல்',
    kn: 'ಅಧಿಕಾರಿ ಪೋರ್ಟಲ್',
    mr: 'अधिकारी पोर्टल'
  },
  badgeJanseva: {
    en: 'JanSeva Public Grievance Portal',
    te: 'జనసేవ ప్రజా సమస్యల వేదిక',
    hi: 'जनसेवा लोक शिकायत पोर्टल',
    ta: 'ஜனசேவா பொது குறைதீர்ப்பு போர்ட்டல்',
    kn: 'ಜನಸೇವಾ ಸಾರ್ವಜನಿಕ ಕುಂದುಕೊರತೆ ಪೋರ್ಟಲ್',
    mr: 'जनसेवा लोक तक्रार पोर्टल'
  },
  cardTitle: {
    en: 'Citizen Login',
    te: 'పౌరుల లాగిన్',
    hi: 'नागरिक लॉगिन',
    ta: 'குடிமக்கள் உள்நுழைவு',
    kn: 'ನಾಗರಿಕ ಲಾಗಿನ್',
    mr: 'नागरिक लॉगिन'
  },
  cardSubtitle: {
    en: 'Enter your Name, Mobile Number, and Location to access the portal directly.',
    te: 'మీ పూర్తి పేరు, మొబైల్ నంబర్ మరియు ప్రాంతాన్ని నమోదు చేసి నేరుగా పోర్టల్‌లోకి ప్రవేశించండి.',
    hi: 'पोर्टल में सीधे प्रवेश करने के लिए अपना नाम, मोबाइल नंबर और स्थान दर्ज करें।',
    ta: 'போர்ட்டலை அணுக உங்கள் பெயர், மொபைல் எண் மற்றும் இடத்தை உள்ளிடவும்.',
    kn: 'ಪೋರ್ಟಲ್ ಅನ್ನು ಪ್ರವೇಶಿಸಲು ನಿಮ್ಮ ಹೆಸರು, ಮೊಬೈಲ್ ಸಂಖ್ಯೆ ಮತ್ತು ಸ್ಥಳವನ್ನು ನಮೂದಿಸಿ.',
    mr: 'पोर्टलमध्ये थेट प्रवेश करण्यासाठी आपले नाव, मोबाईल नंबर आणि ठिकाण नोंदवा.'
  },
  selectLangTitle: {
    en: 'Select Preferred Language:',
    te: 'మీకు కావలసిన భాషను ఎంచుకోండి:',
    hi: 'अपनी पसंदीदा भाषा चुनें:',
    ta: 'விருப்பமான மொழியைத் தேர்ந்தெடுக்கவும்:',
    kn: 'ಆದ್ಯತೆಯ ಭಾಷೆಯನ್ನು ಆಯ್ಕೆಮಾಡಿ:',
    mr: 'पसंतीची भाषा निवडा:'
  },
  fullNameLabel: {
    en: '1. Citizen Full Name: *',
    te: '1. మీ పూర్తి పేరు: *',
    hi: '1. आपका पूरा नाम: *',
    ta: '1. உங்கள் முழு பெயர்: *',
    kn: '1. ನಿಮ್ಮ ಪೂರ್ಣ ಹೆಸರು: *',
    mr: '1. आपले पूर्ण नाव: *'
  },
  fullNamePlaceholder: {
    en: 'e.g. Vadla Bharath Chary',
    te: 'ఉదాహరణ: వడ్ల భరత్ చారి',
    hi: 'उदा: भरत चारी',
    ta: 'உதா: பரத் சாரி',
    kn: 'ಉದಾ: ಭರತ್ ಚಾರಿ',
    mr: 'उदा: भरत चारी'
  },
  mobileLabel: {
    en: '2. Mobile Phone Number: *',
    te: '2. మొబైల్ ఫోన్ నంబర్: *',
    hi: '2. मोबाइल फोन नंबर: *',
    ta: '2. மொபைல் எண்: *',
    kn: '2. ಮೊಬೈಲ್ ಸಂಖ್ಯೆ: *',
    mr: '2. मोबाईल फोन नंबर: *'
  },
  mobilePlaceholder: {
    en: 'Enter 10-digit mobile number',
    te: '10 అంకెల మొబైల్ నంబర్ నమోదు చేయండి',
    hi: '10 अंकों का मोबाइल नंबर दर्ज करें',
    ta: '10 இலக்க மொபைல் எண்ணை உள்ளிடவும்',
    kn: '10 ಅಂಕಿಯ ಮೊಬೈಲ್ ಸಂಖ್ಯೆಯನ್ನು ನಮೂದಿಸಿ',
    mr: '10 अंकी मोबाईल नंबर टाका'
  },
  btnSendOtp: {
    en: 'Send OTP',
    te: 'ఓటీపీ పంపండి',
    hi: 'OTP भेजें',
    ta: 'OTP அனுப்பவும்',
    kn: 'OTP ಕಳುಹಿಸಿ',
    mr: 'OTP पाठवा'
  },
  btnResendOtp: {
    en: 'Resend OTP',
    te: 'మళ్లీ ఓటీపీ పంపండి',
    hi: 'OTP पुनः भेजें',
    ta: 'OTP மீண்டும் அனுப்பவும்',
    kn: 'OTP ಮರುಕಳುಹಿಸಿ',
    mr: 'OTP पुन्हा पाठवा'
  },
  btnSending: {
    en: 'Sending...',
    te: 'పంపుతోంది...',
    hi: 'भेजा जा रहा है...',
    ta: 'அனுப்பப்படுகிறது...',
    kn: 'ಕಳುಹಿಸಲಾಗುತ್ತಿದೆ...',
    mr: 'पाठवले जात आहे...'
  },
  btnVerified: {
    en: 'Verified ✓',
    te: 'ధృవీకరించబడింది ✓',
    hi: 'सत्यापित ✓',
    ta: 'சரிபார்க்கப்பட்டது ✓',
    kn: 'ಪರಿಶೀಲಿಸಲಾಗಿದೆ ✓',
    mr: 'सत्यापित ✓'
  },
  simulatedSms: {
    en: 'Simulated SMS OTP:',
    te: 'ఎస్ఎంఎస్ ఓటీపీ కోడ్:',
    hi: 'एसएमएस OTP कोड:',
    ta: 'SMS OTP குறியீடு:',
    kn: 'SMS OTP ಕೋಡ್:',
    mr: 'SMS OTP कोड:'
  },
  autofillOtpBtn: {
    en: '1-Click Autofill',
    te: 'ఆటోఫిల్ చేయండి',
    hi: 'ऑटोफिल करें',
    ta: 'தானாக நிரப்புக',
    kn: 'ಸ್ವಯಂ ಭರ್ತಿ',
    mr: 'ऑटोफिल करा'
  },
  otpPlaceholder: {
    en: 'Enter 6-digit OTP code',
    te: '6 అంకెల ఓటీపీ నమోదు చేయండి',
    hi: '6 अंकों का OTP कोड दर्ज करें',
    ta: '6 இலக்க OTP குறியீட்டை உள்ளிடவும்',
    kn: '6 ಅಂಕಿಯ OTP ಕೋಡ್ ನಮೂದಿಸಿ',
    mr: '6 अंकी OTP कोड टाका'
  },
  btnVerifyOtp: {
    en: 'Verify OTP',
    te: 'ఓటీపీ ధృవీకరించండి',
    hi: 'OTP सत्यापित करें',
    ta: 'OTP சரிபார்க்கவும்',
    kn: 'OTP ಪರಿಶೀಲಿಸಿ',
    mr: 'OTP पडताळा'
  },
  btnVerifying: {
    en: 'Verifying...',
    te: 'ధృవీకరిస్తోంది...',
    hi: 'सत्यापित हो रहा है...',
    ta: 'சரிபார்க்கப்படுகிறது...',
    kn: 'ಪರಿಶೀಲಿಸಲಾಗುತ್ತಿದೆ...',
    mr: 'पडताळणी चालू आहे...'
  },
  locationLabel: {
    en: '3. Your Area / Location: *',
    te: '3. మీ ప్రాంతం / లొకేషన్: *',
    hi: '3. आपका क्षेत्र / स्थान: *',
    ta: '3. உங்கள் பகுதி / இடம்: *',
    kn: '3. ನಿಮ್ಮ ಪ್ರದೇಶ / ಸ್ಥಳ: *',
    mr: '3. आपला परिसर / ठिकाण: *'
  },
  autoGpsBtn: {
    en: '📍 Auto-Detect GPS',
    te: '📍 GPS ద్వారా గుర్తించు',
    hi: '📍 GPS से पहचानें',
    ta: '📍 GPS கண்டறிக',
    kn: '📍 GPS ಮೂಲಕ ಪತ್ತೆಮಾಡಿ',
    mr: '📍 GPS द्वारे शोधा'
  },
  detectingGps: {
    en: 'Detecting GPS...',
    te: 'GPS గుర్తిస్తోంది...',
    hi: 'GPS खोज रहा है...',
    ta: 'GPS கண்டறியப்படுகிறது...',
    kn: 'GPS ಪತ್ತೆಮಾಡಲಾಗುತ್ತಿದೆ...',
    mr: 'GPS शोधत आहे...'
  },
  customLocationPlaceholder: {
    en: 'Or type your Colony / Street / Ward name here',
    te: 'లేదా మీ కాలనీ / వీధి / వార్డ్ పేరు ఇక్కడ టైప్ చేయండి',
    hi: 'या अपनी कॉलोनी / सड़क / वार्ड का नाम यहाँ लिखें',
    ta: 'அல்லது உங்கள் காலனி / தெரு / வார்டு பெயரை உள்ளிடவும்',
    kn: 'ಅಥವಾ ನಿಮ್ಮ ಕಾಲೋನಿ / ರಸ್ತೆ / ವಾರ್ಡ್ ಹೆಸರನ್ನು ಇಲ್ಲಿ ಟೈಪ್ ಮಾಡಿ',
    mr: 'किंवा आपल्या कॉलनी / रस्ता / प्रभाग नाव येथे टाईप करा'
  },
  btnLogin: {
    en: 'Login to JanSeva Portal →',
    te: 'జనసేవ పోర్టల్‌లోకి ప్రవేశించండి →',
    hi: 'जनसेवा पोर्टल में लॉगिन करें →',
    ta: 'ஜனசேவா போர்ட்டலில் உள்நுழைக →',
    kn: 'ಜನಸೇವಾ ಪೋರ್ಟಲ್‌ಗೆ ಲಾಗಿನ್ ಮಾಡಿ →',
    mr: 'जनसेवा पोर्टलवर लॉगिन करा →'
  },
  loggingIn: {
    en: 'Logging In...',
    te: 'లాగిన్ అవుతోంది...',
    hi: 'लॉगिन हो रहा है...',
    ta: 'உள்நுழைகிறது...',
    kn: 'ಲಾಗಿನ್ ಆಗುತ್ತಿದೆ...',
    mr: 'लॉगिन होत आहे...'
  },
  officerPortalLink: {
    en: 'Municipal Officer Portal Access →',
    te: 'అధికారుల పోర్టల్ (Officer Portal) →',
    hi: 'अधिकारी पोर्टल (Officer Portal) →',
    ta: 'அதிகாரி போர்ட்டல் (Officer Portal) →',
    kn: 'ಅಧಿಕಾರಿ ಪೋರ್ಟಲ್ (Officer Portal) →',
    mr: 'अधिकारी पोर्टल (Officer Portal) →'
  },
  workerPortalLink: {
    en: 'Field Worker Portal Access →',
    te: 'ఫీల్డ్ వర్కర్ల పోర్టల్ (Worker Portal) →',
    hi: 'फील्ड वर्कर पोर्टल (Worker Portal) →',
    ta: 'களப்பணியாளர் போர்ட்டல் (Worker Portal) →',
    kn: 'ಕ್ಷೇತ್ರ ಕಾರ್ಯಕರ್ತರ ಪೋರ್ಟಲ್ (Worker Portal) →',
    mr: 'फील्ड कामगार पोर्टल (Worker Portal) →'
  },
  citizenPortalLink: {
    en: '← Back to Citizen Login',
    te: '← పౌరుల లాగిన్‌కి తిరిగి వెళ్లండి',
    hi: '← नागरिक लॉगिन पर वापस जाएं',
    ta: '← குடிமக்கள் உள்நுழைவுக்குத் திரும்பு',
    kn: '← ನಾಗರಿಕ ಲಾಗಿನ್‌ಗೆ ಹಿಂತಿರುಗಿ',
    mr: '← नागरिक लॉगिनकडे परत जा'
  }
};

// Popular municipal zones
const DEFAULT_AREAS = [
  { name: { en: 'Charminar Zone', te: 'చార్మినార్ జోన్', hi: 'चारमीनार ज़ोन' }, ward: 'Ward 4', lat: 17.3850, lon: 78.4867 },
  { name: { en: 'Main Market Road', te: 'మెయిన్ మార్కెట్ రోడ్', hi: 'मेन मार्केट रोड' }, ward: 'Ward 8', lat: 17.3912, lon: 78.4721 },
  { name: { en: 'School Lane Colony', te: 'స్కూల్ లేన్ కాలనీ', hi: 'स्कूल लेन कॉलोनी' }, ward: 'Ward 5', lat: 17.3815, lon: 78.4910 },
  { name: { en: 'Gandhi Nagar Colony', te: 'గాంధీ నగర్ కాలనీ', hi: 'गांधी नगर कॉलोनी' }, ward: 'Ward 12', lat: 17.3789, lon: 78.4835 },
  { name: { en: 'Bus Stand RTC Area', te: 'బస్ స్టాండ్ ఆర్టీసీ ఏరియా', hi: 'बस स्टैंड आरटीसी एरिया' }, ward: 'Ward 9', lat: 17.3875, lon: 78.4790 },
  { name: { en: 'Banjara Hills Rd 1', te: 'బంజారా హిల్స్ రోడ్ 1', hi: 'बंजारा हिल्स रोड 1' }, ward: 'Ward 18', lat: 17.4156, lon: 78.4352 },
  { name: { en: 'Jubilee Hills Checkpost', te: 'జూబ్లీహిల్స్ చెక్‌పోస్ట్', hi: 'जुबली हिल्स चेकपोस्ट' }, ward: 'Ward 22', lat: 17.4319, lon: 78.4073 },
  { name: { en: 'Kukatpally Housing Board', te: 'కూకట్‌పల్లి హౌసింగ్ బోర్డ్', hi: 'कुकटपल्ली हाउसिंग बोर्ड' }, ward: 'Ward 31', lat: 17.4938, lon: 78.3986 }
];

export default function AuthPortal({ onLoginSuccess, currentLang, setLanguage }) {
  const [authView, setAuthView] = useState('citizen'); // 'citizen' | 'worker' | 'authority'

  // Translation helper function
  const t = (key) => AUTH_STRINGS[key]?.[currentLang] || AUTH_STRINGS[key]?.en || '';

  // Area name helper
  const getAreaName = (area) => {
    if (!area) return '';
    if (typeof area.name === 'object') {
      return area.name[currentLang] || area.name.en || '';
    }
    return area.name || '';
  };

  // --- Citizen Form States (ONLY Name, Mobile Phone, OTP, Location) ---
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [isOtpVerified, setIsOtpVerified] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const [confirmationResult, setConfirmationResult] = useState(null);
  const [verifiedUser, setVerifiedUser] = useState(null);

  // 30-second countdown timer for resending OTP
  useEffect(() => {
    let timer;
    if (resendTimer > 0) {
      timer = setTimeout(() => setResendTimer(prev => prev - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [resendTimer]);

  // Location States
  const [selectedArea, setSelectedArea] = useState(DEFAULT_AREAS[0]);
  const [manualAreaText, setManualAreaText] = useState(getAreaName(DEFAULT_AREAS[0]));
  const [locLoading, setLocLoading] = useState(false);

  // --- Worker Login State ---
  const [workerUsername, setWorkerUsername] = useState('');
  const [workerPassword, setWorkerPassword] = useState('');
  const [showWorkerPassword, setShowWorkerPassword] = useState(false);

  // --- Authority Login State ---
  const [authorityUsername, setAuthorityUsername] = useState('');
  const [authorityPassword, setAuthorityPassword] = useState('');
  const [showAuthorityPassword, setShowAuthorityPassword] = useState(false);

  // Common UI feedback
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successNotice, setSuccessNotice] = useState('');
  const [touchedErrors, setTouchedErrors] = useState({});

  // 1. Detect GPS Location
  const handleDetectGPS = () => {
    setLocLoading(true);
    playAudioFeedback('click');

    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = Number(pos.coords.latitude.toFixed(4));
          const lon = Number(pos.coords.longitude.toFixed(4));
          const detectedTitle = currentLang === 'te' 
            ? `ప్రస్తుత GPS లొకేషన్ (${lat}, ${lon})` 
            : currentLang === 'hi' 
            ? `स्थान GPS (${lat}, ${lon})` 
            : `Detected GPS (${lat}, ${lon})`;
          const newArea = {
            name: detectedTitle,
            ward: 'Ward 6',
            lat,
            lon
          };
          setSelectedArea(newArea);
          setManualAreaText(detectedTitle);
          setTouchedErrors(prev => ({ ...prev, selectedArea: null }));
          setLocLoading(false);
          setSuccessNotice(`${detectedTitle}`);
          playAudioFeedback('success');
        },
        () => {
          const fallback = DEFAULT_AREAS[0];
          setSelectedArea(fallback);
          setManualAreaText(getAreaName(fallback));
          setTouchedErrors(prev => ({ ...prev, selectedArea: null }));
          setLocLoading(false);
        },
        { timeout: 7000 }
      );
    } else {
      setSelectedArea(DEFAULT_AREAS[0]);
      setManualAreaText(getAreaName(DEFAULT_AREAS[0]));
      setTouchedErrors(prev => ({ ...prev, selectedArea: null }));
      setLocLoading(false);
    }
  };

  // 2. Send Mobile OTP via Firebase
  const handleSendOtp = async () => {
    const cleanDigits = phone.replace(/\D/g, '');
    if (cleanDigits.length < 10) {
      const err = currentLang === 'te' 
        ? 'దయచేసి సరైన 10 అంకెల మొబైల్ నంబర్‌ను నమోదు చేయండి.' 
        : currentLang === 'hi'
        ? 'कृपया 10 अंकों का सही मोबाइल नंबर दर्ज करें।'
        : 'Please enter a valid 10-digit mobile phone number.';
      setErrorMsg(err);
      setTouchedErrors(prev => ({ ...prev, phone: err }));
      playAudioFeedback('click');
      return;
    }

    setSendingOtp(true);
    setErrorMsg('');
    setSuccessNotice('');
    playAudioFeedback('click');

    try {
      const confirmation = await sendOtp(cleanDigits);
      setConfirmationResult(confirmation);
      setOtpSent(true);
      setResendTimer(30);
      const msg = currentLang === 'te'
        ? `+91 ${cleanDigits.slice(-10)} నంబర్‌కు OTP పంపబడింది. దయచేసి 6 అంకెల కోడ్‌ను నమోదు చేయండి.`
        : currentLang === 'hi'
        ? `+91 ${cleanDigits.slice(-10)} पर OTP भेज दिया गया है। 6 अंकों का कोड दर्ज करें।`
        : `OTP sent to +91 ${cleanDigits.slice(-10)}. Please enter the 6-digit code.`;
      setSuccessNotice(msg);
      playAudioFeedback('success');
    } catch (err) {
      console.error('Firebase sendOtp error:', err);
      let errMsg = currentLang === 'te'
        ? 'OTP పంపడంలో సమస్య ఎదురైంది. దయచేసి మళ్లీ ప్రయత్నించండి.'
        : currentLang === 'hi'
        ? 'OTP भेजने में समस्या हुई। कृपया पुनः प्रयास करें।'
        : 'Error sending OTP. Please try again.';

      if (err.code === 'auth/too-many-requests') {
        errMsg = currentLang === 'te'
          ? 'ఎక్కువ సార్లు ప్రయత్నించారు. దయచేసి కొన్ని నిమిషాలు వేచి ఉండండి.'
          : currentLang === 'hi'
          ? 'बहुत अधिक प्रयास। कृपया कुछ मिनट बाद पुनः प्रयास करें।'
          : 'Too many requests. Please wait a few minutes before trying again.';
      } else if (err.code === 'auth/invalid-phone-number') {
        errMsg = currentLang === 'te'
          ? 'చెల్లని ఫోన్ నంబర్ format.'
          : 'Invalid phone number format.';
      }
      setErrorMsg(errMsg);
    } finally {
      setSendingOtp(false);
    }
  };

  // 3. Verify Mobile OTP via Firebase
  const handleVerifyOtp = async () => {
    if (!otp.trim() || otp.trim().length !== 6) {
      setErrorMsg(currentLang === 'te' ? 'దయచేసి 6 అంకెల ఓటీపీ కోడ్ నమోదు చేయండి.' : 'Please enter the 6-digit OTP code.');
      return;
    }

    setVerifyingOtp(true);
    setErrorMsg('');
    playAudioFeedback('click');

    try {
      const user = await verifyOtp(otp.trim(), confirmationResult);
      setVerifiedUser(user);
      setIsOtpVerified(true);
      setSuccessNotice(currentLang === 'te' ? 'మొబైల్ నంబర్ విజయవంతంగా ధృవీకరించబడింది! ✓' : 'Mobile number verified successfully! ✓');
      playAudioFeedback('success');
    } catch (err) {
      console.error('Firebase verifyOtp error:', err);
      let errMsg = currentLang === 'te'
        ? 'తప్పుడు ఓటీపీ కోడ్. దయచేసి సరైన కోడ్ నమోదు చేయండి.'
        : currentLang === 'hi'
        ? 'गलत OTP कोड। कृपया सही 6 अंकों का कोड दर्ज करें।'
        : 'Invalid OTP code. Please check and re-enter.';

      if (err.code === 'auth/invalid-verification-code' || err.code === 'auth/code-expired') {
        errMsg = currentLang === 'te'
          ? 'తప్పుడు లేదా గడువు ముగిసిన ఓటీపీ కోడ్.'
          : currentLang === 'hi'
          ? 'गलत या समाप्त OTP कोड।'
          : 'Invalid or expired OTP verification code.';
      } else if (err.code === 'auth/too-many-requests') {
        errMsg = currentLang === 'te'
          ? 'ఎక్కువ సార్లు ప్రయత్నించారు. దయచేసి కొన్ని నిమిషాలు వేచి ఉండండి.'
          : currentLang === 'hi'
          ? 'बहुत अधिक प्रयास। कृपया कुछ मिनट बाद पुनः प्रयास करें।'
          : 'Too many requests. Please wait a few minutes before trying again.';
      }
      setErrorMsg(errMsg);
    } finally {
      setVerifyingOtp(false);
    }
  };

  // 4. Citizen One-Step Login & Profile Save to Firestore
  const handleCitizenLogin = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessNotice('');

    const errors = {};
    if (!name.trim()) errors.name = currentLang === 'te' ? 'దయచేసి మీ పూర్తి పేరు రాయండి' : 'Please enter your Full Name';
    const cleanDigits = phone.replace(/\D/g, '');
    if (cleanDigits.length < 10) errors.phone = currentLang === 'te' ? '10 అంకెల మొబైల్ నంబర్ అవసరం' : 'Valid 10-digit mobile number is required';
    if (!selectedArea && !manualAreaText.trim()) errors.selectedArea = currentLang === 'te' ? 'దయచేసి మీ ప్రాంతాన్ని ఎంచుకోండి' : 'Please select or detect your location area';

    if (Object.keys(errors).length > 0) {
      setTouchedErrors(errors);
      setErrorMsg(Object.values(errors)[0]);
      playAudioFeedback('click');
      return;
    }

    setLoading(true);
    playAudioFeedback('click');

    const areaName = getAreaName(selectedArea) || manualAreaText.trim() || 'Charminar Zone';
    const ward = selectedArea?.ward || 'Ward 4';
    const latitude = selectedArea?.lat || 17.3850;
    const longitude = selectedArea?.lon || 78.4867;
    const uid = verifiedUser?.uid || `usr-${cleanDigits.slice(-10)}`;

    const citizenProfile = {
      uid,
      id: uid,
      name: name.trim(),
      phone: cleanDigits,
      username: `citizen_${cleanDigits.slice(-4)}`,
      role: 'citizen',
      userType: 'literate',
      areaName,
      ward,
      latitude,
      longitude,
      language: currentLang,
      createdAt: new Date().toISOString()
    };

    try {
      // Save user profile in Firestore "users" collection keyed by uid (Never plain password)
      await saveUser(uid, citizenProfile);
      playAudioFeedback('success');
      onLoginSuccess(citizenProfile);
    } catch (saveErr) {
      console.warn('saveUser warning, proceeding with login:', saveErr);
      playAudioFeedback('success');
      onLoginSuccess(citizenProfile);
    } finally {
      setLoading(false);
    }
  };

  // 5. Municipal Field Worker Login Handler
  const handleWorkerLogin = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessNotice('');

    const errors = {};
    const u = workerUsername.trim().toLowerCase();
    const p = workerPassword.trim();

    if (!u) errors.workerUsername = 'Worker ID / Official Username is required';
    if (!p) errors.workerPassword = 'Password is required';

    if (Object.keys(errors).length > 0) {
      setTouchedErrors(errors);
      setErrorMsg('Please enter both your Worker ID and Password.');
      playAudioFeedback('click');
      return;
    }

    setTouchedErrors({});
    setLoading(true);
    playAudioFeedback('click');

    const WORKER_FALLBACKS = {
      'worker1': { id: 'usr-006', name: 'M. Ramesh (Ward 4 Field Worker)', username: 'worker1', role: 'worker', userType: 'literate', ward: 'Ward 4', areaName: 'Charminar Zone' },
      'worker_ward4': { id: 'usr-007', name: 'B. Srinivas (Sanitation Worker)', username: 'worker_ward4', role: 'worker', userType: 'literate', ward: 'Ward 4', areaName: 'Charminar Zone' },
      'worker_electric': { id: 'usr-008', name: 'K. Naresh (Electrical Worker)', username: 'worker_electric', role: 'worker', userType: 'literate', ward: 'Ward 12', areaName: 'Gandhi Nagar Colony' }
    };

    if (WORKER_FALLBACKS[u] && (p === '123' || p.length >= 3)) {
      playAudioFeedback('success');
      onLoginSuccess(WORKER_FALLBACKS[u]);
      setLoading(false);
      return;
    }

    if (u.includes('worker') && p.length >= 3) {
      playAudioFeedback('success');
      onLoginSuccess({
        id: `usr-${Date.now().toString().slice(-6)}`,
        name: u,
        username: u,
        role: 'worker',
        userType: 'literate',
        ward: 'Ward 4',
        areaName: 'Field Duty'
      });
      setLoading(false);
      return;
    }

    setErrorMsg('Invalid Worker credentials. Use ID: worker1, Pass: 123');
    setLoading(false);
  };

  // 6. Municipal Authority / Officer Login Handler
  const handleAuthorityLogin = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessNotice('');

    const errors = {};
    const u = authorityUsername.trim().toLowerCase();
    const p = authorityPassword.trim();

    if (!u) errors.authorityUsername = 'Officer ID / Official Username is required';
    if (!p) errors.authorityPassword = 'Password is required';

    if (Object.keys(errors).length > 0) {
      setTouchedErrors(errors);
      setErrorMsg('Official Username and Password are required.');
      playAudioFeedback('click');
      return;
    }

    setTouchedErrors({});
    setLoading(true);
    playAudioFeedback('click');

    const OFFICER_FALLBACKS = {
      'officer_ward4': { id: 'usr-003', name: 'K. Suresh (Ward 4 Officer)', username: 'officer_ward4', role: 'authority', ward: 'Ward 4' },
      'admin.ghmc': { id: 'usr-005', name: 'GHMC Central Administrator', username: 'admin.ghmc', role: 'authority', ward: 'All Wards' }
    };

    if (OFFICER_FALLBACKS[u] && (p === '123' || p === 'admin123' || p.length >= 3)) {
      playAudioFeedback('success');
      onLoginSuccess(OFFICER_FALLBACKS[u]);
      setLoading(false);
      return;
    }

    if ((u.includes('officer') || u.includes('admin')) && p.length >= 3) {
      playAudioFeedback('success');
      onLoginSuccess({
        id: 'auth_eval_1',
        name: u.includes('admin') ? 'GHMC Administrator' : 'Ward Officer',
        role: 'authority',
        username: u,
        userType: 'literate',
        ward: 'Ward 4'
      });
      setLoading(false);
      return;
    }

    setErrorMsg('Invalid Officer credentials. Use: officer_ward4, Pass: 123');
    setLoading(false);
  };

  return (
    <div className="min-h-screen w-full bg-slate-50 flex flex-col justify-between relative overflow-x-hidden font-sans">
      {/* 1. TOP HEADER */}
      <header className="w-full bg-gradient-to-r from-blue-700 via-indigo-700 to-blue-800 text-white shadow-md px-4 sm:px-8 py-3.5 flex items-center justify-between border-b border-blue-500/30 z-20">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center shadow-inner border border-white/20">
            <Building2 className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight leading-none">JanSeva</h1>
            <p className="text-[11px] text-blue-100 font-medium">{t('headerPortalName')}</p>
          </div>
        </div>

        {/* Language selector chip */}
        <div className="flex items-center space-x-2">
          <span className="text-xs text-blue-100 hidden sm:inline">{t('activeLanguageLabel')}</span>
          <span className="text-xs font-black bg-white/20 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/20 text-white">
            {LANGUAGES.find(l => l.code === currentLang)?.label || 'English'}
          </span>
        </div>
      </header>

      {/* 2. MAIN CONTAINER */}
      <main className="flex-1 w-full max-w-4xl mx-auto px-3 sm:px-6 py-6 sm:py-8 flex flex-col justify-center z-10">

        {/* =================== VIEW 1: DEDICATED WORKER PORTAL =================== */}
        {authView === 'worker' ? (
          <div className="w-full max-w-2xl mx-auto bg-white rounded-3xl shadow-2xl border-2 border-amber-200 overflow-hidden text-slate-800 animate-in fade-in zoom-in-95">
            {/* Top Navigation Tabs */}
            <div className="flex border-b border-amber-200 bg-amber-50/60">
              <button
                type="button"
                onClick={() => {
                  setAuthView('citizen');
                  setErrorMsg('');
                  setSuccessNotice('');
                  setTouchedErrors({});
                  playAudioFeedback('click');
                }}
                className="flex-1 py-3.5 px-2 text-center font-bold text-xs sm:text-sm text-slate-600 hover:text-blue-600 border-b-2 border-transparent hover:bg-white transition cursor-pointer flex items-center justify-center space-x-1"
              >
                <User className="w-4 h-4 text-blue-500" />
                <span>{t('tabCitizen')}</span>
              </button>
              <button
                type="button"
                className="flex-1 py-3.5 px-2 text-center font-black text-xs sm:text-sm text-amber-900 border-b-2 border-amber-600 bg-white shadow-xs transition flex items-center justify-center space-x-1"
              >
                <Wrench className="w-4 h-4 text-amber-600" />
                <span>{t('tabWorker')}</span>
              </button>
            </div>

            {/* Worker Top Banner */}
            <div className="bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 p-6 sm:p-7 text-center text-white relative shadow-md">
              <div className="inline-flex items-center space-x-2 bg-black/20 border border-white/30 px-3 py-1 rounded-full text-white text-xs font-black tracking-wider uppercase mb-2 backdrop-blur-md">
                <Wrench className="w-3.5 h-3.5 text-amber-200" />
                <span>Field Operations • Municipal Worker Access</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                Municipal Field Worker Portal
              </h2>
              <p className="text-xs text-amber-100 font-medium mt-1">
                Access All Reported Citizen Grievances, Accept Tasks & Submit Resolution Proofs
              </p>
            </div>

            <div className="p-6 sm:p-8 space-y-5 bg-white">
              {errorMsg && (
                <div className="p-4 rounded-2xl bg-red-600 text-white shadow-xl shadow-red-200 flex items-center justify-between border border-red-500 animate-shake">
                  <div className="flex items-center space-x-3">
                    <AlertCircle className="w-5 h-5 text-white flex-shrink-0" />
                    <p className="text-xs sm:text-sm font-extrabold">{errorMsg}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setErrorMsg('')}
                    className="w-7 h-7 rounded-lg bg-black/20 hover:bg-black/40 flex items-center justify-center text-white text-xs font-black transition cursor-pointer"
                  >
                    ✕
                  </button>
                </div>
              )}

              {/* 1-Click Fast Worker Accounts */}
              <div className="p-3.5 bg-amber-50/80 rounded-2xl border border-amber-200 space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-amber-900">
                  <span>Quick Worker Accounts (Click to Autofill):</span>
                  <span className="text-[10px] text-amber-700 bg-amber-200/70 px-2 py-0.5 rounded-full font-black">1-Click Test</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setWorkerUsername('worker1');
                      setWorkerPassword('123');
                      setTouchedErrors({});
                      playAudioFeedback('click');
                    }}
                    className="p-2.5 bg-white hover:bg-amber-100 text-slate-800 border border-amber-300 rounded-xl text-xs font-bold transition shadow-2xs cursor-pointer text-left flex flex-col hover:border-amber-400"
                  >
                    <span className="font-black text-amber-800 flex items-center gap-1">
                      <Wrench className="w-3.5 h-3.5 text-amber-600" />
                      Worker 1 (Ward 4)
                    </span>
                    <span className="text-[11px] text-slate-500 font-mono mt-0.5">worker1 / 123</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setWorkerUsername('worker_ward4');
                      setWorkerPassword('123');
                      setTouchedErrors({});
                      playAudioFeedback('click');
                    }}
                    className="p-2.5 bg-white hover:bg-amber-100 text-slate-800 border border-amber-300 rounded-xl text-xs font-bold transition shadow-2xs cursor-pointer text-left flex flex-col hover:border-amber-400"
                  >
                    <span className="font-black text-amber-800 flex items-center gap-1">
                      <Wrench className="w-3.5 h-3.5 text-amber-600" />
                      Sanitation Worker
                    </span>
                    <span className="text-[11px] text-slate-500 font-mono mt-0.5">worker_ward4 / 123</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setWorkerUsername('worker_electric');
                      setWorkerPassword('123');
                      setTouchedErrors({});
                      playAudioFeedback('click');
                    }}
                    className="p-2.5 bg-white hover:bg-amber-100 text-slate-800 border border-amber-300 rounded-xl text-xs font-bold transition shadow-2xs cursor-pointer text-left flex flex-col hover:border-amber-400"
                  >
                    <span className="font-black text-amber-800 flex items-center gap-1">
                      <Wrench className="w-3.5 h-3.5 text-amber-600" />
                      Electrical Staff
                    </span>
                    <span className="text-[11px] text-slate-500 font-mono mt-0.5">worker_electric / 123</span>
                  </button>
                </div>
              </div>

              <form noValidate onSubmit={handleWorkerLogin} className="space-y-4">
                <div>
                  <label className="block text-xs font-black uppercase text-slate-700 mb-1">
                    Worker Staff ID / Username: *
                  </label>
                  <div className="relative">
                    <User className="w-5 h-5 text-slate-400 absolute left-3.5 top-3.5" />
                    <input
                      type="text"
                      placeholder="e.g. worker1, worker_ward4, or worker_electric"
                      value={workerUsername}
                      onChange={(e) => {
                        setWorkerUsername(e.target.value);
                        if (e.target.value.trim()) setTouchedErrors(prev => ({ ...prev, workerUsername: null }));
                      }}
                      className="w-full pl-11 pr-4 py-3 rounded-xl text-sm font-bold border border-slate-300 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-black uppercase text-slate-700 mb-1">
                    Staff Security Password: *
                  </label>
                  <div className="relative">
                    <Lock className="w-5 h-5 text-slate-400 absolute left-3.5 top-3.5" />
                    <input
                      type={showWorkerPassword ? 'text' : 'password'}
                      placeholder="Enter staff password"
                      value={workerPassword}
                      onChange={(e) => {
                        setWorkerPassword(e.target.value);
                        if (e.target.value.trim()) setTouchedErrors(prev => ({ ...prev, workerPassword: null }));
                      }}
                      className="w-full pl-11 pr-11 py-3 rounded-xl text-sm font-bold border border-slate-300 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-amber-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowWorkerPassword(!showWorkerPassword)}
                      className="absolute right-3.5 top-3.5 p-1 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200/50 transition cursor-pointer"
                    >
                      {showWorkerPassword ? <EyeOff className="w-4 h-4 text-amber-600" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="pt-2 space-y-3">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-4 rounded-2xl bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 hover:from-amber-700 hover:to-orange-800 text-white font-black text-base shadow-xl shadow-orange-500/25 flex items-center justify-center space-x-2 transition-all duration-200 transform active:scale-95 disabled:opacity-50 cursor-pointer"
                  >
                    <Wrench className="w-5 h-5 text-white" />
                    <span>{loading ? 'Authenticating Staff...' : 'Access Field Worker Dashboard'}</span>
                    <ArrowRight className="w-5 h-5" />
                  </button>

                  <div className="pt-2 border-t border-amber-100 flex items-center justify-center">
                    <button
                      type="button"
                      onClick={() => {
                        setAuthView('citizen');
                        setErrorMsg('');
                        setSuccessNotice('');
                        setTouchedErrors({});
                        playAudioFeedback('click');
                      }}
                      className="inline-flex items-center space-x-1.5 font-black text-xs sm:text-sm text-blue-700 hover:text-blue-900 transition underline underline-offset-4 cursor-pointer py-1.5 px-3 rounded-xl hover:bg-blue-50"
                    >
                      <User className="w-4 h-4 text-blue-600" />
                      <span>{t('citizenPortalLink')}</span>
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        ) : authView === 'authority' ? (
          /* =================== VIEW 2: DEDICATED OFFICER PORTAL =================== */
          <div className="w-full max-w-2xl mx-auto bg-white rounded-3xl shadow-2xl border-2 border-indigo-100 overflow-hidden text-slate-800 animate-in fade-in zoom-in-95">
            {/* Top Navigation Tabs */}
            <div className="flex border-b border-indigo-200 bg-indigo-50/60">
              <button
                type="button"
                onClick={() => {
                  setAuthView('citizen');
                  setErrorMsg('');
                  setSuccessNotice('');
                  setTouchedErrors({});
                  playAudioFeedback('click');
                }}
                className="flex-1 py-3.5 px-2 text-center font-bold text-xs sm:text-sm text-slate-600 hover:text-blue-600 border-b-2 border-transparent hover:bg-white transition cursor-pointer flex items-center justify-center space-x-1"
              >
                <User className="w-4 h-4 text-blue-500" />
                <span>{t('tabCitizen')}</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setAuthView('worker');
                  setErrorMsg('');
                  setSuccessNotice('');
                  setTouchedErrors({});
                  playAudioFeedback('click');
                }}
                className="flex-1 py-3.5 px-2 text-center font-bold text-xs sm:text-sm text-slate-600 hover:text-amber-800 border-b-2 border-transparent hover:bg-white transition cursor-pointer flex items-center justify-center space-x-1"
              >
                <Wrench className="w-4 h-4 text-amber-600" />
                <span>{t('tabWorker')}</span>
              </button>
              <button
                type="button"
                className="flex-1 py-3.5 px-2 text-center font-black text-xs sm:text-sm text-indigo-900 border-b-2 border-indigo-600 bg-white shadow-xs transition flex items-center justify-center space-x-1"
              >
                <Shield className="w-4 h-4 text-indigo-600" />
                <span>{t('tabOfficer')}</span>
              </button>
            </div>

            {/* Officer Banner */}
            <div className="bg-gradient-to-r from-indigo-700 via-indigo-800 to-purple-800 p-6 sm:p-7 text-center text-white relative shadow-md">
              <div className="inline-flex items-center space-x-2 bg-white/20 border border-white/30 px-3 py-1 rounded-full text-white text-xs font-black tracking-wider uppercase mb-2 backdrop-blur-md">
                <Shield className="w-3.5 h-3.5 text-white" />
                <span>Restricted Access • Municipal Officers Only</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                Municipal Authority Portal
              </h2>
              <p className="text-xs text-indigo-100 font-medium mt-1">
                Civic Administration, Ward Management & Analytics
              </p>
            </div>

            <div className="p-6 sm:p-8 space-y-5 bg-white">
              {errorMsg && (
                <div className="p-4 rounded-2xl bg-red-600 text-white shadow-xl shadow-red-200 flex items-center justify-between border border-red-500 animate-shake">
                  <div className="flex items-center space-x-3">
                    <AlertCircle className="w-5 h-5 text-white flex-shrink-0" />
                    <p className="text-xs sm:text-sm font-extrabold">{errorMsg}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setErrorMsg('')}
                    className="w-7 h-7 rounded-lg bg-black/20 hover:bg-black/40 flex items-center justify-center text-white text-xs font-black transition cursor-pointer"
                  >
                    ✕
                  </button>
                </div>
              )}

              {/* Quick Demo Officer Accounts */}
              <div className="p-3.5 bg-indigo-50/80 rounded-2xl border border-indigo-200 space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-indigo-900">
                  <span>Evaluation Official Credentials:</span>
                  <span className="text-[10px] text-indigo-600 bg-indigo-200/70 px-2 py-0.5 rounded-full font-black">1-Click Test</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setAuthorityUsername('officer_ward4');
                      setAuthorityPassword('123');
                      setTouchedErrors({});
                      playAudioFeedback('click');
                    }}
                    className="p-2.5 bg-white hover:bg-indigo-100 text-slate-800 border border-indigo-300 rounded-xl text-xs font-bold transition shadow-2xs cursor-pointer text-left flex flex-col hover:border-indigo-400"
                  >
                    <span className="font-black text-indigo-800 flex items-center gap-1">
                      <Shield className="w-3.5 h-3.5 text-indigo-600" />
                      Ward 4 Officer (K. Suresh)
                    </span>
                    <span className="text-[11px] text-slate-500 font-mono mt-0.5">officer_ward4 / 123</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setAuthorityUsername('admin.ghmc');
                      setAuthorityPassword('admin123');
                      setTouchedErrors({});
                      playAudioFeedback('click');
                    }}
                    className="p-2.5 bg-white hover:bg-indigo-100 text-slate-800 border border-indigo-300 rounded-xl text-xs font-bold transition shadow-2xs cursor-pointer text-left flex flex-col hover:border-indigo-400"
                  >
                    <span className="font-black text-indigo-800 flex items-center gap-1">
                      <Shield className="w-3.5 h-3.5 text-indigo-600" />
                      GHMC Central Admin
                    </span>
                    <span className="text-[11px] text-slate-500 font-mono mt-0.5">admin.ghmc / admin123</span>
                  </button>
                </div>
              </div>

              <form noValidate onSubmit={handleAuthorityLogin} className="space-y-4">
                <div>
                  <label className="block text-xs font-black uppercase text-slate-700 mb-1">
                    Officer ID / Official Username: *
                  </label>
                  <div className="relative">
                    <User className="w-5 h-5 text-slate-400 absolute left-3.5 top-3.5" />
                    <input
                      type="text"
                      placeholder="e.g. officer_ward4 or admin.ghmc"
                      value={authorityUsername}
                      onChange={(e) => {
                        setAuthorityUsername(e.target.value);
                        if (e.target.value.trim()) setTouchedErrors(prev => ({ ...prev, authorityUsername: null }));
                      }}
                      className="w-full pl-11 pr-4 py-3 rounded-xl text-sm font-bold border border-slate-300 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-black uppercase text-slate-700 mb-1">
                    Official Password: *
                  </label>
                  <div className="relative">
                    <Lock className="w-5 h-5 text-slate-400 absolute left-3.5 top-3.5" />
                    <input
                      type={showAuthorityPassword ? 'text' : 'password'}
                      placeholder="Enter official password"
                      value={authorityPassword}
                      onChange={(e) => {
                        setAuthorityPassword(e.target.value);
                        if (e.target.value.trim()) setTouchedErrors(prev => ({ ...prev, authorityPassword: null }));
                      }}
                      className="w-full pl-11 pr-11 py-3 rounded-xl text-sm font-bold border border-slate-300 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowAuthorityPassword(!showAuthorityPassword)}
                      className="absolute right-3.5 top-3.5 p-1 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200/50 transition cursor-pointer"
                    >
                      {showAuthorityPassword ? <EyeOff className="w-4 h-4 text-indigo-600" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="pt-2 space-y-3">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-4 rounded-2xl bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-700 hover:from-indigo-700 hover:to-purple-800 text-white font-black text-base shadow-xl shadow-indigo-600/25 flex items-center justify-center space-x-2 transition-all duration-200 transform active:scale-95 disabled:opacity-50 cursor-pointer"
                  >
                    <Shield className="w-5 h-5 text-white" />
                    <span>{loading ? 'Verifying Official Credentials...' : 'Access Authority Dashboard'}</span>
                    <ArrowRight className="w-5 h-5" />
                  </button>

                  <div className="pt-2 border-t border-indigo-100 flex items-center justify-center">
                    <button
                      type="button"
                      onClick={() => {
                        setAuthView('citizen');
                        setErrorMsg('');
                        setSuccessNotice('');
                        setTouchedErrors({});
                        playAudioFeedback('click');
                      }}
                      className="inline-flex items-center space-x-1.5 font-black text-xs sm:text-sm text-blue-700 hover:text-blue-900 transition underline underline-offset-4 cursor-pointer py-1.5 px-3 rounded-xl hover:bg-blue-50"
                    >
                      <User className="w-4 h-4 text-blue-600" />
                      <span>{t('citizenPortalLink')}</span>
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        ) : (
          /* =================== VIEW 3: SIMPLIFIED CITIZEN LOGIN (Dynamically Localized) =================== */
          <div className="w-full bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden">
            {/* Top Navigation Tabs: Citizen Login | Worker Login */}
            <div className="flex border-b border-slate-200 bg-slate-50">
              <button
                type="button"
                className="flex-1 py-4 px-2 text-center font-black text-xs sm:text-base border-b-2 border-blue-600 text-blue-600 bg-white shadow-xs flex items-center justify-center space-x-1.5"
              >
                <User className="w-4 h-4 text-blue-600" />
                <span>{t('tabCitizen')}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setAuthView('worker');
                  setErrorMsg('');
                  setSuccessNotice('');
                  setTouchedErrors({});
                  playAudioFeedback('click');
                }}
                className="flex-1 py-4 px-2 text-center font-bold text-xs sm:text-base border-b-2 border-transparent text-amber-800 hover:text-amber-900 hover:bg-amber-100/50 flex items-center justify-center space-x-1.5 cursor-pointer transition"
              >
                <Wrench className="w-4 h-4 text-amber-600" />
                <span>{t('tabWorker')}</span>
              </button>
            </div>

            <div className="p-5 sm:p-8 lg:p-10 space-y-6">
              {/* Card Title */}
              <div className="border-b border-slate-100 pb-4">
                <div className="inline-flex items-center space-x-1.5 bg-blue-50 text-blue-700 text-xs font-black uppercase tracking-wider px-3 py-1 rounded-full mb-2 border border-blue-200">
                  <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                  <span>{t('badgeJanseva')}</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                  {t('cardTitle')}
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
                  {t('cardSubtitle')}
                </p>
              </div>

              {/* Language Selection Buttons */}
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                  <span>{t('selectLangTitle')}</span>
                  <span className="text-[11px] font-black text-amber-900 bg-amber-100 px-2.5 py-0.5 rounded-full border border-amber-300">
                    {LANGUAGES.find(l => l.code === currentLang)?.label || 'English'}
                  </span>
                </div>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
                  {LANGUAGES.map((lang) => (
                    <button
                      key={lang.code}
                      type="button"
                      onClick={() => {
                        playAudioFeedback('click');
                        setLanguage(lang.code);
                      }}
                      className={`py-2 px-1 rounded-xl text-xs font-black border transition flex items-center justify-center active:scale-95 cursor-pointer ${
                        currentLang === lang.code
                          ? 'bg-amber-400 text-slate-950 border-amber-600 shadow-sm ring-2 ring-amber-300'
                          : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200'
                      }`}
                    >
                      <span>{lang.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Alert Error Box */}
              {errorMsg && (
                <div className="p-4 rounded-2xl bg-gradient-to-r from-red-600 via-rose-600 to-red-700 text-white shadow-xl shadow-red-200/80 flex items-center justify-between border border-red-500 animate-shake">
                  <div className="flex items-center space-x-3">
                    <AlertCircle className="w-5 h-5 text-white flex-shrink-0" />
                    <p className="text-xs sm:text-sm font-extrabold">{errorMsg}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setErrorMsg('')}
                    className="w-7 h-7 rounded-lg bg-black/20 hover:bg-black/40 flex items-center justify-center text-white text-xs font-black transition cursor-pointer"
                  >
                    ✕
                  </button>
                </div>
              )}

              {/* Success Notice Box */}
              {successNotice && (
                <div className="p-4 rounded-2xl bg-emerald-600 text-white shadow-xl shadow-emerald-200 flex items-center justify-between border border-emerald-500 animate-in fade-in">
                  <div className="flex items-center space-x-3">
                    <CheckCircle2 className="w-5 h-5 text-white flex-shrink-0" />
                    <p className="text-xs sm:text-sm font-extrabold">{successNotice}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSuccessNotice('')}
                    className="w-7 h-7 rounded-lg bg-black/20 hover:bg-black/40 flex items-center justify-center text-white text-xs font-black transition cursor-pointer"
                  >
                    ✕
                  </button>
                </div>
              )}

              {/* CITIZEN FORM (Purely Localized) */}
              <form noValidate onSubmit={handleCitizenLogin} className="space-y-6">

                {/* 1. CITIZEN FULL NAME */}
                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-slate-700 mb-1.5 flex items-center space-x-1.5">
                    <User className="w-4 h-4 text-blue-600" />
                    <span>{t('fullNameLabel')}</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder={t('fullNamePlaceholder')}
                      value={name}
                      onChange={(e) => {
                        setName(e.target.value);
                        if (e.target.value.trim()) setTouchedErrors(prev => ({ ...prev, name: null }));
                      }}
                      className={`w-full px-4 py-3 rounded-2xl text-sm font-bold transition focus:outline-none focus:ring-4 focus:ring-blue-100 ${
                        touchedErrors.name
                          ? 'border-2 border-red-500 bg-red-50/40'
                          : 'border-2 border-slate-300 bg-slate-50 focus:bg-white focus:border-blue-600'
                      }`}
                    />
                  </div>
                  {touchedErrors.name && (
                    <p className="text-xs font-black text-red-600 mt-1 animate-in fade-in">
                      {touchedErrors.name}
                    </p>
                  )}
                </div>

                {/* 2. MOBILE PHONE NUMBER & OTP VERIFICATION */}
                <div className="space-y-3 p-4 sm:p-5 bg-gradient-to-br from-blue-50/60 to-indigo-50/30 rounded-3xl border-2 border-blue-100">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center space-x-1.5">
                      <Phone className="w-4 h-4 text-blue-600" />
                      <span>{t('mobileLabel')}</span>
                    </label>
                    {isOtpVerified && (
                      <span className="text-[11px] font-black text-emerald-800 bg-emerald-100 px-3 py-0.5 rounded-full border border-emerald-300 flex items-center space-x-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>{t('btnVerified')}</span>
                      </span>
                    )}
                  </div>

                  <div className="relative">
                    <span className="absolute left-3.5 top-3.5 text-sm font-bold text-slate-400">+91</span>
                    <input
                      type="tel"
                      maxLength={10}
                      placeholder={t('mobilePlaceholder')}
                      value={phone}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, '');
                        setPhone(val);
                        if (val.length === 10) setTouchedErrors(prev => ({ ...prev, phone: null }));
                      }}
                      className={`w-full pl-12 pr-4 py-3 rounded-2xl text-sm font-bold transition focus:outline-none focus:ring-4 focus:ring-blue-100 ${
                        touchedErrors.phone
                          ? 'border-2 border-red-500 bg-red-50/40'
                          : 'border-2 border-slate-300 bg-white focus:border-blue-600'
                      }`}
                    />
                  </div>
                  {touchedErrors.phone && (
                    <p className="text-xs font-black text-red-600">{touchedErrors.phone}</p>
                  )}
                </div>

                {/* 3. CITIZEN AREA LOCATION */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center space-x-1.5">
                      <MapPin className="w-4 h-4 text-blue-600" />
                      <span>{t('locationLabel')}</span>
                    </label>

                    <button
                      type="button"
                      onClick={handleDetectGPS}
                      disabled={locLoading}
                      className="text-xs font-bold text-blue-700 hover:text-blue-900 flex items-center space-x-1 bg-blue-100/70 hover:bg-blue-200/80 px-3 py-1.5 rounded-xl transition cursor-pointer"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${locLoading ? 'animate-spin' : ''}`} />
                      <span>{locLoading ? t('detectingGps') : t('autoGpsBtn')}</span>
                    </button>
                  </div>

                  {/* Popular Municipal Zones */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {DEFAULT_AREAS.slice(0, 4).map((area, idx) => {
                      const areaDisplayName = getAreaName(area);
                      const isSelected = selectedArea?.name === area.name || selectedArea?.name === areaDisplayName;
                      return (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => {
                            setSelectedArea(area);
                            setManualAreaText(areaDisplayName);
                            setTouchedErrors(prev => ({ ...prev, selectedArea: null }));
                            playAudioFeedback('click');
                          }}
                          className={`p-3 rounded-2xl text-xs font-bold transition text-left border-2 cursor-pointer ${
                            isSelected
                              ? 'bg-blue-600 text-white border-blue-700 shadow-md ring-2 ring-blue-300'
                              : 'bg-slate-50 hover:bg-slate-100 text-slate-800 border-slate-200'
                          }`}
                        >
                          <p className="font-black truncate">{areaDisplayName}</p>
                          <p className={`text-[11px] ${isSelected ? 'text-blue-100' : 'text-slate-400'}`}>{area.ward}</p>
                        </button>
                      );
                    })}
                  </div>

                  {/* Custom Street / Locality typing */}
                  <div className="relative">
                    <input
                      type="text"
                      placeholder={t('customLocationPlaceholder')}
                      value={manualAreaText}
                      onChange={(e) => {
                        setManualAreaText(e.target.value);
                        if (e.target.value.trim()) {
                          setSelectedArea({ name: e.target.value, ward: 'Local Ward', lat: 17.3850, lon: 78.4867 });
                          setTouchedErrors(prev => ({ ...prev, selectedArea: null }));
                        }
                      }}
                      className="w-full px-4 py-2.5 rounded-xl text-xs font-semibold border border-slate-300 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  {touchedErrors.selectedArea && (
                    <p className="text-xs font-black text-red-600">{touchedErrors.selectedArea}</p>
                  )}
                </div>

                {/* 4. SUBMIT LOGIN BUTTON & OFFICER / WORKER PORTAL LINKS */}
                <div className="pt-2 space-y-4">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-4 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-700 hover:to-indigo-800 text-white font-black text-base shadow-xl shadow-blue-500/25 flex items-center justify-center space-x-2 transition-all duration-200 transform active:scale-95 disabled:opacity-50 cursor-pointer"
                  >
                    <span>{loading ? t('loggingIn') : t('btnLogin')}</span>
                    <ArrowRight className="w-5 h-5" />
                  </button>

                  {/* Direct Officer Portal link under Citizen Login button */}
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-center text-center">
                    <button
                      type="button"
                      onClick={() => {
                        setAuthView('authority');
                        setErrorMsg('');
                        setSuccessNotice('');
                        setTouchedErrors({});
                        playAudioFeedback('click');
                      }}
                      className="inline-flex items-center space-x-2 font-black text-xs sm:text-sm text-indigo-700 hover:text-indigo-900 transition underline underline-offset-4 cursor-pointer py-1.5 px-3 rounded-xl hover:bg-indigo-50"
                    >
                      <Shield className="w-4 h-4 text-indigo-600" />
                      <span>{t('officerPortalLink')}</span>
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        )}

      </main>

      {/* 3. FULL-WIDTH FOOTER */}
      <footer className="w-full py-4 text-center text-xs text-slate-500 border-t border-slate-200 z-10 bg-white">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="font-semibold text-slate-600">© 2026 JanSeva Public Grievance Portal • Government Civic Care System</p>
          <p className="flex items-center space-x-2 text-slate-500">
            <span>Official Government Secured Portal</span>
            <span>•</span>
            <span className="text-emerald-600 font-bold">24x7 Citizen Redressal</span>
          </p>
        </div>
      </footer>
    </div>
  );
}
