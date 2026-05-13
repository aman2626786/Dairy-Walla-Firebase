import { create } from 'zustand';

export type AppLanguage = 'hinglish' | 'english' | 'hindi';

interface LanguageState {
  language: AppLanguage;
  setLanguage: (lang: AppLanguage) => void;
}

const getInitialLang = (): AppLanguage => {
  const l = localStorage.getItem('app-language');
  if (l === 'english' || l === 'hindi' || l === 'hinglish') return l;
  return 'hinglish';
};

export const useLanguageStore = create<LanguageState>((set) => ({
  language: getInitialLang(),
  setLanguage: (lang) => {
    localStorage.setItem('app-language', lang);
    set({ language: lang });
  }
}));

export const translations: Record<string, Record<AppLanguage, string>> = {
  // Navigation Distributor
  'Dashboard': { hinglish: 'Dashboard', english: 'Dashboard', hindi: 'डैशबोर्ड' },
  'Orders': { hinglish: 'Orders', english: 'Orders', hindi: 'ऑर्डर्स' },
  'Order Summary': { hinglish: 'Order Summary', english: 'Order Summary', hindi: 'ऑर्डर सारांश' },
  'Catalog': { hinglish: 'Catalog', english: 'Catalog', hindi: 'कैटलॉग' },
  'Shopkeepers': { hinglish: 'Shopkeepers', english: 'Shopkeepers', hindi: 'दुकानदार' },
  'Invoices': { hinglish: 'Invoices', english: 'Invoices', hindi: 'इनवॉइस' },
  'Settings': { hinglish: 'Settings', english: 'Settings', hindi: 'सेटिंग्स' },
  
  // Navigation Shopkeeper
  'Order Now': { hinglish: 'Order Now', english: 'Order Now', hindi: 'अभी ऑर्डर करें' },
  'Discover': { hinglish: 'Discover', english: 'Discover', hindi: 'खोजें' },
  'My Orders': { hinglish: 'My Orders', english: 'My Orders', hindi: 'मेरे ऑर्डर्स' },
  'My Distributor': { hinglish: 'My Distributor', english: 'My Distributor', hindi: 'मेरे डिस्ट्रीब्यूटर' },
  
  // Common
  'Notifications': { hinglish: 'Notifications', english: 'Notifications', hindi: 'सूचनाएं' },
  'Logout': { hinglish: 'Logout', english: 'Logout', hindi: 'लॉगआउट' },
  'Save Settings': { hinglish: 'Save Settings', english: 'Save Settings', hindi: 'सेटिंग्स सेव करें' },
  'Search products...': { hinglish: 'Search products...', english: 'Search products...', hindi: 'उत्पाद खोजें...' },
  'Items': { hinglish: 'items', english: 'items', hindi: 'सामान' },
  'Total': { hinglish: 'Total', english: 'Total', hindi: 'कुल' },
  'Review Order': { hinglish: 'Review Order', english: 'Review Order', hindi: 'ऑर्डर जांचें' },
  
  // Smart Suggestion
  'Smart Suggestion': { hinglish: 'Smart Suggestion', english: 'Smart Suggestion', hindi: 'स्मार्ट सुझाव' },
  'Aaj bhi kal wala order laga du?': { 
    hinglish: 'Aaj bhi kal wala order laga du?', 
    english: 'Should I repeat yesterday\'s order?', 
    hindi: 'क्या आज भी कल वाला ऑर्डर लगा दूँ?' 
  },
  'One-Click Confirm': { hinglish: 'One-Click Confirm', english: 'One-Click Confirm', hindi: 'एक-क्लिक कन्फर्म' },
  'Review & Edit': { hinglish: 'Review & Edit', english: 'Review & Edit', hindi: 'देखें और बदलें' },
  
  // Settings Text
  'App Language': { hinglish: 'App Language', english: 'App Language', hindi: 'ऐप भाषा' },
  'Select your preferred language.': { 
    hinglish: 'Apni pasandida bhasha chunein.', 
    english: 'Select your preferred language.', 
    hindi: 'अपनी पसंदीदा भाषा चुनें।' 
  },
  
  // Landing Page
  'Bina Chaos Ke,': { hinglish: 'Bina Chaos Ke,', english: 'Without any chaos,', hindi: 'बिना किसी परेशानी के,' },
  'Dairy Business Karein.': { 
    hinglish: 'Dairy Business Karein.', 
    english: 'Run your Dairy Business.', 
    hindi: 'डेयरी बिज़नेस करें।' 
  },
  'Dairy Ordering,': { hinglish: 'Dairy Ordering,', english: 'Dairy Ordering,', hindi: 'डेयरी ऑर्डरिंग,' },
  'Simplified.': { hinglish: 'Simplified.', english: 'Simplified.', hindi: 'हुआ आसान।' },
  'The B2B Platform for Local Dairy Supply Chains': {
    hinglish: 'The B2B Platform for Local Dairy Supply Chains',
    english: 'The B2B Platform for Local Dairy Supply Chains',
    hindi: 'स्थानीय डेयरी सप्लाई चेन के लिए B2B प्लेटफॉर्म'
  },
  'DairyWalla is a powerful B2B platform designed specifically for local distributors and shopkeepers. Replace messy WhatsApp orders with a professional digital system.': {
    hinglish: 'DairyWalla ek powerful B2B platform hai jo khaas taur par local distributors aur shopkeepers ke liye banaya gaya hai. WhatsApp orders ko digital system se badlein.',
    english: 'DairyWalla is a powerful B2B platform designed specifically for local distributors and shopkeepers. Replace messy WhatsApp orders with a professional digital system.',
    hindi: 'डेयरीवाला एक शक्तिशाली B2B प्लेटफॉर्म है जो विशेष रूप से स्थानीय वितरकों और दुकानदारों के लिए बनाया गया है।'
  },
  'Start For Free': { hinglish: 'Start For Free', english: 'Start For Free', hindi: 'मुफ्त में शुरू करें' },
  'Watch Demo': { hinglish: 'Watch Demo', english: 'Watch Demo', hindi: 'डेमो देखें' },
  'Features': { hinglish: 'Features', english: 'Features', hindi: 'विशेषताएं' },
  'How it works': { hinglish: 'How it works', english: 'How it works', hindi: 'यह कैसे काम करता है' },
  'Login': { hinglish: 'Login', english: 'Login', hindi: 'लॉगिन' },
  'Sign Up': { hinglish: 'Sign Up', english: 'Sign Up', hindi: 'साइन अप' },
};

export function useTranslation() {
  const language = useLanguageStore(s => s.language);
  const t = (key: string) => {
    if (translations[key]) {
      return translations[key][language] || key;
    }
    return key;
  };
  return { t, language, setLanguage: useLanguageStore.getState().setLanguage };
}
