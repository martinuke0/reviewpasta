import React, { createContext, useContext, useState, useEffect } from 'react';

type Language = 'ro' | 'en';

interface Translations {
  // Home page
  appName: string;
  appDescription: string;
  addNewBusiness: string;
  existingBusinesses: string;
  noBusiness: string;
  loading: string;

  // Add Business page
  addBusinessTitle: string;
  addBusinessDescription: string;
  businessName: string;
  businessNamePlaceholder: string;
  googlePlaceId: string;
  googlePlaceIdPlaceholder: string;
  location: string;
  locationPlaceholder: string;
  description: string;
  descriptionPlaceholder: string;
  saveBusiness: string;
  saving: string;
  back: string;

  // Review page
  rateExperience: string;
  reviewDraft: string;
  regenerate: string;
  copyReview: string;
  copied: string;
  openGoogleReviews: string;
  tip: string;
  generatingReview: string;
  businessNotFound: string;
  businessNotFoundDesc: string;

  // Footer
  poweredBy: string;

  // Toasts/Errors
  errorRequired: string;
  errorDuplicate: string;
  errorSave: string;
  successAdded: string;
  successCopied: string;
  errorGenerate: string;
}

const translations: Record<Language, Translations> = {
  ro: {
    // Home page
    appName: 'ReviewPasta',
    appDescription: 'Obține mai multe recenzii Google în 10 secunde. Clienții scanează, copiază și lipesc — gata.',
    addNewBusiness: 'Adaugă o afacere nouă',
    existingBusinesses: 'Afaceri existente',
    noBusiness: 'Nicio afacere încă. Adaugă una mai sus!',
    loading: 'Se încarcă...',

    // Add Business page
    addBusinessTitle: 'Adaugă o afacere nouă',
    addBusinessDescription: 'Înregistrează o afacere pentru a începe colectarea de recenzii.',
    businessName: 'Numele afacerii *',
    businessNamePlaceholder: 'Nordic Brew Coffee',
    googlePlaceId: 'ID Place Google *',
    googlePlaceIdPlaceholder: 'ChIJ...',
    location: 'Locație',
    locationPlaceholder: 'București, România',
    description: 'Descriere',
    descriptionPlaceholder: 'O cafenea confortabilă...',
    saveBusiness: 'Salvează afacerea',
    saving: 'Se salvează...',
    back: 'Înapoi',

    // Review page
    rateExperience: 'Evaluează experiența ta:',
    reviewDraft: 'Proiectul tău de recenzie:',
    regenerate: 'Regenerează',
    copyReview: 'Copiază recenzia',
    copied: 'Copiat!',
    openGoogleReviews: 'Deschide recenzii Google',
    tip: 'Sfat: Lipește recenzia ta în Google, apoi apasă',
    generatingReview: 'Se generează recenzia ta...',
    businessNotFound: 'Afacere negăsită',
    businessNotFoundDesc: 'Acest link de recenzie nu pare să fie valid.',

    // Footer
    poweredBy: 'Oferit de',

    // Toasts/Errors
    errorRequired: 'Numele afacerii și ID-ul Place sunt obligatorii.',
    errorDuplicate: 'O afacere cu acest nume există deja.',
    errorSave: 'Nu s-a putut salva afacerea.',
    successAdded: 'Afacere adăugată!',
    successCopied: 'Recenzie copiată!',
    errorGenerate: 'Nu s-a putut genera recenzia. Te rugăm să încerci din nou.',
  },
  en: {
    // Home page
    appName: 'ReviewPasta',
    appDescription: 'Get more Google reviews in 10 seconds. Customers scan, copy, and paste — done.',
    addNewBusiness: 'Add a New Business',
    existingBusinesses: 'Existing Businesses',
    noBusiness: 'No businesses yet. Add one above!',
    loading: 'Loading...',

    // Add Business page
    addBusinessTitle: 'Add a New Business',
    addBusinessDescription: 'Register a business to start collecting reviews.',
    businessName: 'Business Name *',
    businessNamePlaceholder: 'Nordic Brew Coffee',
    googlePlaceId: 'Google Place ID *',
    googlePlaceIdPlaceholder: 'ChIJ...',
    location: 'Location',
    locationPlaceholder: 'Bucharest, Romania',
    description: 'Description',
    descriptionPlaceholder: 'A cozy coffee shop...',
    saveBusiness: 'Save Business',
    saving: 'Saving...',
    back: 'Back',

    // Review page
    rateExperience: 'Rate your experience:',
    reviewDraft: 'Your Review Draft:',
    regenerate: 'Regenerate',
    copyReview: 'Copy Review',
    copied: 'Copied!',
    openGoogleReviews: 'Open Google Reviews',
    tip: 'Tip: Paste your review in Google, then tap',
    generatingReview: 'Generating your review...',
    businessNotFound: 'Business not found',
    businessNotFoundDesc: "This review link doesn't seem to be valid.",

    // Footer
    poweredBy: 'Powered by',

    // Toasts/Errors
    errorRequired: 'Business name and Place ID are required.',
    errorDuplicate: 'A business with this name already exists.',
    errorSave: 'Failed to save business.',
    successAdded: 'Business added!',
    successCopied: 'Review copied!',
    errorGenerate: 'Failed to generate review. Please try again.',
  },
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: Translations;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Detect browser language
  const detectBrowserLanguage = (): Language => {
    const browserLang = navigator.language.toLowerCase();
    // Check if browser is set to Romanian
    if (browserLang.startsWith('ro')) {
      return 'ro';
    }
    // Default to English for all other languages
    return 'en';
  };

  const [language, setLanguageState] = useState<Language>(() => {
    // Check localStorage first
    const saved = localStorage.getItem('reviewpasta-language') as Language;
    if (saved && (saved === 'ro' || saved === 'en')) {
      return saved;
    }
    // Fall back to browser language detection
    return detectBrowserLanguage();
  });

  // Save language to localStorage when changed
  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('reviewpasta-language', lang);
  };

  const value = {
    language,
    setLanguage,
    t: translations[language],
  };

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
