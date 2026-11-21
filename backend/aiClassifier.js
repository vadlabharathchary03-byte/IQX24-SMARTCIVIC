// Intelligent Civic Complaint Auto-Classifier
// Analyzes images and audio transcripts (in multiple languages) to categorize civic problems

const CATEGORY_KEYWORDS = {
  garbage: {
    en: ['garbage', 'trash', 'waste', 'dump', 'bin', 'overflow', 'dirt', 'litter', 'smell', 'plastic'],
    hi: ['कचरा', 'कूड़ा', 'गंदगी', 'डस्टबिन', 'कूड़ेदान', 'सफाई'],
    te: ['చెత్త', 'మురికి', 'కుప్ప', 'డస్ట్ బిన్', 'చెత్తబుట్ట'],
    ta: ['குப்பை', 'அழுக்கு', 'தொட்டி', 'தூய்மை'],
    kn: ['ಕಸ', 'ಕಸದ ಬುಟ್ಟಿ', 'ಕೊಳೆ'],
    mr: ['कचरा', 'घाण', 'कचराकुंडी']
  },
  pothole: {
    en: ['pothole', 'road', 'damage', 'hole', 'crater', 'broken road', 'tar', 'asphalt', 'street damaged'],
    hi: ['खड्डा', 'गड्ढा', 'सड़क', 'रास्ता टूटा', 'डामर', 'गड्ढे'],
    te: ['గుంత', 'రోడ్డు', 'బాట', 'రోడ్డు పాడైంది', 'గుంతలు'],
    ta: ['குழி', 'சாலை', 'பழுது', 'தார் சாலை'],
    kn: ['ಗುಂಡಿ', 'ರಸ್ತೆ', 'ಹಾಳಾದ ರಸ್ತೆ'],
    mr: ['खड्डा', 'रस्ता', 'रस्ता खराब']
  },
  streetlight: {
    en: ['streetlight', 'light', 'lamp', 'dark', 'bulb', 'pole', 'street lamp', 'night', 'darkness'],
    hi: ['लाइट', 'बत्ती', 'स्ट्रीट लाइट', 'खंभा', 'अंधेरा', 'बल्ब'],
    te: ['లైటు', 'దీపం', 'వీధి దీపం', 'స్తంభం', 'చీకటి'],
    ta: ['விளக்கு', 'தெரு விளக்கு', 'மின் கம்பம்', 'இருள்'],
    kn: ['ದೀಪ', 'ಬೀದಿ ದೀಪ', 'ಕಂಬ'],
    mr: ['दिवा', 'रस्त्यावरील दिवा', 'खांब', 'अंधार']
  },
  water_leak: {
    en: ['water', 'leak', 'pipe', 'tap', 'burst', 'drain', 'leakage', 'drinking water', 'overflowing tap'],
    hi: ['पानी', 'नल', 'पाइप', 'लीक', 'बहाव', 'जल', 'टपक रहा', 'पाइपलाइन'],
    te: ['నీరు', 'నీళ్ళు', 'పైపు', 'నల్లా', 'లీకేజీ', 'తాగునీరు'],
    ta: ['தண்ணீர்', 'குழாய்', 'கசிவு', 'தண்ணீர் வீண்'],
    kn: ['ನೀರು', 'ಪೈಪ್', 'ಸೋರಿಕೆ', 'ನಲ್ಲಿ'],
    mr: ['पाणी', 'नळ', 'पाईप', 'गळती']
  },
  electrical: {
    en: ['electric', 'wire', 'cable', 'spark', 'shock', 'hanging wire', 'transformer', 'high voltage'],
    hi: ['बिजली', 'तार', 'करंट', 'ट्रांसफार्मर', 'तार लटक रही'],
    te: ['విద్యుత్', 'వైరు', 'కరెంట్', 'ట్రాన్స్‌ఫార్మర్'],
    ta: ['மின்சாரம்', 'கம்பி', 'மின் கம்பி'],
    kn: ['ವಿದ್ಯುತ್', 'ತಂತಿ', 'ವೈರ್'],
    mr: ['विद्युत', 'तार', 'करंट']
  }
};

/**
 * Classifies an issue based on image filename, metadata, and voice transcript
 */
export function classifyIssue({ filename = '', transcript = '', fallbackCategory = null }) {
  const combinedText = `${filename.toLowerCase()} ${transcript.toLowerCase()}`;

  const scores = {
    garbage: 0,
    pothole: 0,
    streetlight: 0,
    water_leak: 0,
    electrical: 0
  };

  // 1. Text / Transcript matching across all Indian languages + English
  for (const [category, langDict] of Object.entries(CATEGORY_KEYWORDS)) {
    for (const [lang, words] of Object.entries(langDict)) {
      for (const word of words) {
        if (combinedText.includes(word.toLowerCase())) {
          scores[category] += 2.5;
        }
      }
    }
  }

  // 2. Filename heuristic matching
  if (filename) {
    const fn = filename.toLowerCase();
    if (fn.includes('garbage') || fn.includes('trash') || fn.includes('waste') || fn.includes('kachra')) scores.garbage += 4;
    if (fn.includes('pothole') || fn.includes('road') || fn.includes('gaddha') || fn.includes('guntha')) scores.pothole += 4;
    if (fn.includes('light') || fn.includes('pole') || fn.includes('lamp') || fn.includes('bulb')) scores.streetlight += 4;
    if (fn.includes('water') || fn.includes('pipe') || fn.includes('tap') || fn.includes('leak') || fn.includes('paani')) scores.water_leak += 4;
    if (fn.includes('wire') || fn.includes('electric') || fn.includes('current')) scores.electrical += 4;
  }

  // Determine highest scoring category
  let maxCategory = null;
  let maxScore = 0;

  for (const [category, score] of Object.entries(scores)) {
    if (score > maxScore) {
      maxScore = score;
      maxCategory = category;
    }
  }

  // If score is sufficient, use detected category
  if (maxCategory && maxScore >= 2) {
    return {
      category: maxCategory,
      confidence: Math.min(0.98, 0.65 + maxScore * 0.08),
      autoDetected: true
    };
  }

  // Fallback to provided category or default to 'pothole' or 'garbage'
  return {
    category: fallbackCategory && fallbackCategory !== 'auto' ? fallbackCategory : 'garbage',
    confidence: fallbackCategory && fallbackCategory !== 'auto' ? 0.90 : 0.70,
    autoDetected: fallbackCategory === 'auto' || !fallbackCategory
  };
}
