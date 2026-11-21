// Comprehensive Multilingual Dictionary for Non-Literate & Multilingual Citizens

export const LANGUAGES = [
  { code: 'en', label: 'English', name: 'English', voiceCode: 'en-IN', flag: '🌐' },
  { code: 'te', label: 'తెలుగు', name: 'Telugu', voiceCode: 'te-IN', flag: '🇮🇳' },
  { code: 'hi', label: 'हिन्दी', name: 'Hindi', voiceCode: 'hi-IN', flag: '🇮🇳' },
  { code: 'ta', label: 'தமிழ்', name: 'Tamil', voiceCode: 'ta-IN', flag: '🇮🇳' },
  { code: 'kn', label: 'ಕನ್ನಡ', name: 'Kannada', voiceCode: 'kn-IN', flag: '🇮🇳' },
  { code: 'mr', label: 'मराठी', name: 'Marathi', voiceCode: 'mr-IN', flag: '🇮🇳' }
];

export const CATEGORIES = [
  {
    id: 'garbage',
    icon: '🗑️',
    color: 'bg-red-500 text-white border-red-600',
    badgeColor: 'bg-red-100 text-red-800 border-red-200',
    names: {
      hi: 'कचरा / कूड़ा',
      te: 'చెత్త కుప్ప',
      ta: 'குப்பை கழிவு',
      kn: 'ಕಸದ ರಾಶಿ',
      mr: 'कचरा कुंडी',
      en: 'Overflowing Garbage'
    },
    audioPrompt: {
      hi: 'कचरे की समस्या रिपोर्ट करने के लिए यहाँ दबाएं',
      te: 'చెత్త సమస్య కోసం ఇక్కడ నొక్కండి',
      ta: 'குப்பை புகாருக்கு இங்கே தொடவும்',
      kn: 'ಕಸದ ಸಮಸ್ಯೆಗೆ ಇಲ್ಲಿ ಒತ್ತಿ',
      mr: 'कचऱ्याच्या समस्येसाठी येथे दाबा',
      en: 'Tap here to report overflowing garbage'
    }
  },
  {
    id: 'pothole',
    icon: '🕳️',
    color: 'bg-orange-500 text-white border-orange-600',
    badgeColor: 'bg-orange-100 text-orange-800 border-orange-200',
    names: {
      hi: 'सड़क का खड्डा',
      te: 'రోడ్డు గుంత',
      ta: 'சாலை குழி',
      kn: 'ರಸ್ತೆ ಗುಂಡಿ',
      mr: 'रस्त्यावरील खड्डा',
      en: 'Damaged Road / Pothole'
    },
    audioPrompt: {
      hi: 'टूटी सड़क या खड्डे की शिकायत के लिए दबाएं',
      te: 'పాడైన రోడ్డు లేదా గుంత సమస్య కోసం నొక్కండి',
      ta: 'சாலை குழி புகாருக்கு இங்கே தொடவும்',
      kn: 'ಹಾಳಾದ ರಸ್ತೆ ಅಥವಾ ಗುಂಡಿಗೆ ಇಲ್ಲಿ ಒತ್ತಿ',
      mr: 'खराब रस्ता किंवा खड्ड्यासाठी येथे दाबा',
      en: 'Tap here to report damaged road or pothole'
    }
  },
  {
    id: 'streetlight',
    icon: '💡',
    color: 'bg-amber-500 text-white border-amber-600',
    badgeColor: 'bg-amber-100 text-amber-800 border-amber-200',
    names: {
      hi: 'स्ट्रीट लाइट बंद',
      te: 'వీధి దీపం వెలగట్లేదు',
      ta: 'தெரு விளக்கு பழுது',
      kn: 'ಬೀದಿ ದೀಪ ದುರಸ್ತಿ',
      mr: 'रस्त्यावरील दिवा बंद',
      en: 'Broken Streetlight'
    },
    audioPrompt: {
      hi: 'खराब लाइट या अंधेरे की शिकायत के लिए दबाएं',
      te: 'వీధి దీపం సమస్య కోసం నొక్కండి',
      ta: 'தெரு விளக்கு புகாருக்கு இங்கே தொடவும்',
      kn: 'ಬೀದಿ ದೀಪದ ಸಮಸ್ಯೆಗೆ ಇಲ್ಲಿ ಒತ್ತಿ',
      mr: 'बंद दिव्यासाठी येथे दाबा',
      en: 'Tap here to report broken streetlight'
    }
  },
  {
    id: 'water_leak',
    icon: '🚰',
    color: 'bg-cyan-500 text-white border-cyan-600',
    badgeColor: 'bg-cyan-100 text-cyan-800 border-cyan-200',
    names: {
      hi: 'नल / पाइप लीकेज',
      te: 'నీటి పైపు లీకేజీ',
      ta: 'குடிநீர் குழாய் கசிவு',
      kn: 'ನೀರಿನ ನಲ್ಲಿ ಸೋರಿಕೆ',
      mr: 'पाण्याचा नळ गळती',
      en: 'Leaking Public Tap/Pipe'
    },
    audioPrompt: {
      hi: 'पानी बहने या नल टूटने की शिकायत के लिए दबाएं',
      te: 'నీరు వృధా కావడం లేదా పైప్ లీకేజీ కోసం నొక్కండి',
      ta: 'குடிநீர் கசிவு புகாருக்கு இங்கே தொடவும்',
      kn: 'ನೀರಿನ ಸೋರಿಕೆಗೆ ಇಲ್ಲಿ ಒತ್ತಿ',
      mr: 'पाणी गळती समस्येसाठी येथे दाबा',
      en: 'Tap here to report leaking tap or pipe'
    }
  },
  {
    id: 'electrical',
    icon: '⚡',
    color: 'bg-purple-600 text-white border-purple-700',
    badgeColor: 'bg-purple-100 text-purple-800 border-purple-200',
    names: {
      hi: 'लटकता बिजली तार',
      te: 'విద్యుత్ వైరు ప్రమాదం',
      ta: 'ஆபத்தான மின் கம்பி',
      kn: 'ವಿದ್ಯುತ್ ತಂತಿ ಅಪಾಯ',
      mr: 'लटकणारी विद्युत तार',
      en: 'Hanging Electric Cable'
    },
    audioPrompt: {
      hi: 'खतरनाक बिजली तार की शिकायत के लिए दबाएं',
      te: 'ప్రమాదకర విద్యుత్ తీగ కోసం నొక్కండి',
      ta: 'ஆபத்தான மின்கம்பி புகாருக்கு தொடவும்',
      kn: 'ಅಪಾಯಕಾರಿ ವೈರ್‌ಗೆ ಇಲ್ಲಿ ಒತ್ತಿ',
      mr: 'धोकादायक विद्युत तारेसाठी येथे दाबा',
      en: 'Tap here to report dangerous electrical cable'
    }
  }
];

export const UI_STRINGS = {
  appName: {
    hi: 'जनसेवा',
    te: 'జనసేవ',
    ta: 'மக்கள் சேவை',
    kn: 'ಜನಸೇವೆ',
    mr: 'जनसेवा',
    en: 'JanSeva'
  },
  tagline: {
    hi: 'आवाज़ और फोटो से अपनी समस्या सीधे सरकार तक पहुँचाएं',
    te: 'ఫోటో & వాయిస్ ద్వారా మీ ప్రజా సమస్యను నేరుగా తెలపండి',
    ta: 'புகைப்படம் மற்றும் குரல் மூலம் உங்கள் குறைகளை தெரிவியுங்கள்',
    kn: 'ಫೋಟೋ ಮತ್ತು ಧ್ವನಿಯ ಮೂಲಕ ನಿಮ್ಮ ಸಮಸ್ಯೆಯನ್ನು ವರದಿ ಮಾಡಿ',
    mr: 'फोटो आणि आवाजाद्वारे सार्वजनिक समस्यांची नोंद करा',
    en: 'Voice & Photo Civic Problem Reporting Platform'
  },
  navReport: {
    hi: 'समस्या दर्ज करें',
    te: 'సమస్య నమోదు',
    ta: 'புகார் செய்க',
    kn: 'ದೂರು ದಾಖಲಿಸಿ',
    mr: 'समस्या नोंदवा',
    en: 'Report Problem'
  },
  navFeed: {
    hi: 'दर्ज समस्याएं (Status)',
    te: 'నమోదైన సమస్యలు (Reported Issues)',
    ta: 'பதிவு செய்யப்பட்ட புகார்கள்',
    kn: 'ದಾಖಲಾದ ಸಮಸ್ಯೆಗಳು',
    mr: 'नोंदवलेल्या समस्या',
    en: 'Reported Problems'
  },
  navMap: {
    hi: 'Map (नक्शा)',
    te: 'Map (మ్యాప్)',
    ta: 'Map (வரைபடம்)',
    kn: 'Map (ನಕ್ಷೆ)',
    mr: 'Map (नकाशा)',
    en: 'Map'
  },
  navAuthority: {
    hi: 'अधिकारी पोर्टल',
    te: 'అధికారుల పోర్టల్',
    ta: 'அதிகாரி போர்ட்டல்',
    kn: 'ಅಧಿಕಾರಿ ಪೋರ್ಟಲ್',
    mr: 'अधिकारी डॅशबोर्ड',
    en: 'Authority Portal'
  },
  step1Photo: {
    hi: '1. समस्या का फोटो लें या चुनें',
    te: '1. సమస్య ఫోటో తీయండి లేదా ఎంచుకోండి',
    ta: '1. பிரச்சனை போட்டோ எடுக்கவும்',
    kn: '1. ಸಮಸ್ಯೆಯ ಫೋಟೋ ತೆಗೆಯಿರಿ',
    mr: '1. समस्येचा फोटो घ्या',
    en: '1. Snap or Upload Problem Photo'
  },
  step2Speak: {
    hi: '2. समस्या बताएं या टाइप करें (Voice / Manual Type)',
    te: '2. సమస్యను చెప్పండి లేదా టైప్ చేయండి (Voice / Manual Type)',
    ta: '2. குரல் அல்லது தட்டச்சு மூலம் சொல்லவும் (Voice / Manual Type)',
    kn: '2. ಮಾತನಾಡಿ ಅಥವಾ ಟೈಪ್ ಮಾಡಿ (Voice / Manual Type)',
    mr: '2. समस्या सांगा किंवा टाइप करा (Voice / Manual Type)',
    en: '2. Describe your Problem (Voice or Type Manual)'
  },
  step3Location: {
    hi: '3. आपका स्थान (GPS)',
    te: '3. మీ ప్రాంతం (GPS)',
    ta: '3. உங்கள் இடம் (GPS)',
    kn: '3. ನಿಮ್ಮ ಸ್ಥಳ (GPS)',
    mr: '3. आपले ठिकाण (GPS)',
    en: '3. Detected Location (GPS)'
  },
  btnSubmit: {
    hi: 'शिकायत दर्ज करें (Submit)',
    te: 'ఫిర్యాదు పంపండి (Submit)',
    ta: 'புகாரை அனுப்புங்கள் (Submit)',
    kn: 'ದೂರು ಸಲ್ಲಿಸಿ (Submit)',
    mr: 'तक्रार पाठवा (Submit)',
    en: 'Submit Civic Complaint'
  },
  btnSpeakAll: {
    hi: '🔊 स्क्रीन पढ़कर सुनाएं',
    te: '🔊 స్క్రీన్ చదివి వినిపించండి',
    ta: '🔊 படித்துக் காட்டவும்',
    kn: '🔊 ಓದಿ ಕೇಳಿಸಿ',
    mr: '🔊 वाचून दाखवा',
    en: '🔊 Read Screen Aloud'
  },
  btnVoteUrgent: {
    hi: '🚨 मुझे भी यही समस्या है (+1 वोट)',
    te: '🚨 నాకు కూడా ఈ సమస్య ఉంది (+1 ఓటు)',
    ta: '🚨 எனக்கும் இதே பிரச்சனை (+1 ஓட்டு)',
    kn: '🚨 ನನಗೂ ಈ ಸಮಸ್ಯೆ ಇದೆ (+1 ಮತ)',
    mr: '🚨 मलाही हीच अडचण आहे (+1 मत)',
    en: '🚨 Me Too! Urgent Issue (+1 Vote)'
  },
  statusReported: {
    hi: 'शिकायत दर्ज हुई',
    te: 'నమోదైంది',
    ta: 'பதிவு செய்யப்பட்டது',
    kn: 'ದಾಖಲಾಗಿದೆ',
    mr: 'नोंद झाली',
    en: 'Reported'
  },
  statusWorkStarted: {
    hi: 'काम शुरू हुआ',
    te: 'పని ప్రారంభమైంది',
    ta: 'வேலை தொடங்கியது',
    kn: 'ಕೆಲಸ ಪ್ರಾರಂಭವಾಗಿದೆ',
    mr: 'काम सुरू झाले',
    en: 'Work Started'
  },
  statusInProgress: {
    hi: 'काम चालू है',
    te: 'పని జరుగుతోంది',
    ta: 'வேலை நடக்கிறது',
    kn: 'ಕೆಲಸ ಪ್ರಗತಿಯಲ್ಲಿದೆ',
    mr: 'काम सुरू आहे',
    en: 'In Progress'
  },
  statusResolved: {
    hi: 'समस्या हल हो गई',
    te: 'పరిష్కరించబడింది',
    ta: 'தீர்க்கப்பட்டது',
    kn: 'ಪರಿಹರಿಸಲಾಗಿದೆ',
    mr: 'समस्या सोडवली',
    en: 'Resolved'
  },
  statusWorkCompleted: {
    hi: 'काम पूरा हुआ',
    te: 'పని పూర్తయింది',
    ta: 'வேலை முடிந்தது',
    kn: 'ಕೆಲಸ ಪೂರ್ಣಗೊಂಡಿದೆ',
    mr: 'काम पूर्ण झाले',
    en: 'Work Completed'
  },
  duplicateNotice: {
    hi: '⚠️ आपके पास यह समस्या पहले से दर्ज है! आपकी आवाज़ को जोड़ दिया गया है ताकि तुरंत हल हो सके।',
    te: '⚠️ మీ సమీపంలో ఈ సమస్య ఇప్పటికే నమోదైంది! త్వరిత పరిష్కారం కోసం మీ మద్దతు జోడించబడింది.',
    ta: '⚠️ இந்த பிரச்சனை ஏற்கனவே பதிவாகியுள்ளது! உங்கள் ஆதரவு சேர்க்கப்பட்டது.',
    kn: '⚠️ ಈ ಸಮಸ್ಯೆ ಈಗಾಗಲೇ ದಾಖಲಾಗಿದೆ! ನಿಮ್ಮ ಬೆಂಬಲವನ್ನು ಸೇರಿಸಲಾಗಿದೆ.',
    mr: '⚠️ ही समस्या आधीच नोंदवली आहे! आपल्या मताने प्राधान्य वाढले आहे.',
    en: '⚠️ Similar issue already reported nearby! Your voice was added as an urgent vote to speed up resolution.'
  }
};
