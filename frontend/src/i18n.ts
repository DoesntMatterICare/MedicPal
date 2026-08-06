import i18n from "i18next";
import { initReactI18next } from "react-i18next";

export const languages = [
  { code: "en", native: "English", english: "English" },
  { code: "hi", native: "हिन्दी", english: "Hindi" },
  { code: "ta", native: "தமிழ்", english: "Tamil" },
  { code: "te", native: "తెలుగు", english: "Telugu" },
  { code: "kn", native: "ಕನ್ನಡ", english: "Kannada" },
  { code: "ml", native: "മലയാളം", english: "Malayalam" },
  { code: "bn", native: "বাংলা", english: "Bengali" },
  { code: "mr", native: "मराठी", english: "Marathi" },
  { code: "gu", native: "ગુજરાતી", english: "Gujarati" },
  { code: "pa", native: "ਪੰਜਾਬੀ", english: "Punjabi" },
];

const core = (home: string, scan: string, settings: string, continueText: string) => ({
  home, scan, settings, continue: continueText,
});

const resources = {
  en: { translation: { ...core("Home", "Scan", "Settings", "Continue"), today: "Today's medicines", add: "Scan a medicine", taken: "Taken", notTaken: "Not taken" } },
  hi: { translation: { ...core("होम", "स्कैन", "सेटिंग्स", "जारी रखें"), today: "आज की दवाइयाँ", add: "दवा स्कैन करें", taken: "ले ली", notTaken: "नहीं ली" } },
  ta: { translation: { ...core("முகப்பு", "ஸ்கேன்", "அமைப்புகள்", "தொடரவும்"), today: "இன்றைய மருந்துகள்", add: "மருந்தை ஸ்கேன் செய்க", taken: "எடுத்தது", notTaken: "எடுக்கவில்லை" } },
  te: { translation: { ...core("హోమ్", "స్కాన్", "సెట్టింగ్స్", "కొనసాగించు"), today: "నేటి మందులు", add: "మందును స్కాన్ చేయండి", taken: "తీసుకున్నారు", notTaken: "తీసుకోలేదు" } },
  kn: { translation: { ...core("ಮುಖಪುಟ", "ಸ್ಕ್ಯಾನ್", "ಸೆಟ್ಟಿಂಗ್‌ಗಳು", "ಮುಂದುವರಿಸಿ"), today: "ಇಂದಿನ ಔಷಧಿಗಳು", add: "ಔಷಧಿ ಸ್ಕ್ಯಾನ್ ಮಾಡಿ", taken: "ತೆಗೆದುಕೊಂಡಿದೆ", notTaken: "ತೆಗೆದುಕೊಂಡಿಲ್ಲ" } },
  ml: { translation: { ...core("ഹോം", "സ്കാൻ", "ക്രമീകരണം", "തുടരുക"), today: "ഇന്നത്തെ മരുന്നുകൾ", add: "മരുന്ന് സ്കാൻ ചെയ്യുക", taken: "കഴിച്ചു", notTaken: "കഴിച്ചില്ല" } },
  bn: { translation: { ...core("হোম", "স্ক্যান", "সেটিংস", "চালিয়ে যান"), today: "আজকের ওষুধ", add: "ওষুধ স্ক্যান করুন", taken: "খাওয়া হয়েছে", notTaken: "খাওয়া হয়নি" } },
  mr: { translation: { ...core("होम", "स्कॅन", "सेटिंग्ज", "पुढे चला"), today: "आजची औषधे", add: "औषध स्कॅन करा", taken: "घेतले", notTaken: "घेतले नाही" } },
  gu: { translation: { ...core("હોમ", "સ્કેન", "સેટિંગ્સ", "આગળ વધો"), today: "આજની દવાઓ", add: "દવા સ્કેન કરો", taken: "લીધી", notTaken: "લીધી નથી" } },
  pa: { translation: { ...core("ਹੋਮ", "ਸਕੈਨ", "ਸੈਟਿੰਗਾਂ", "ਜਾਰੀ ਰੱਖੋ"), today: "ਅੱਜ ਦੀਆਂ ਦਵਾਈਆਂ", add: "ਦਵਾਈ ਸਕੈਨ ਕਰੋ", taken: "ਲੈ ਲਈ", notTaken: "ਨਹੀਂ ਲਈ" } },
};

void i18n.use(initReactI18next).init({ resources, lng: "en", fallbackLng: "en", interpolation: { escapeValue: false } });

export default i18n;