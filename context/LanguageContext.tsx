'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

export type Language = 'en' | 'ml' | 'hi';

export interface Translations {
  // Navigation & Header
  reportGrievance: string;
  trackStatus: string;
  depotDashboard: string;
  help: string;
  inbox: string;
  portalSubtitle: string;
  selectLanguage: string;
  
  // Home page Hero & Sections
  heroTitle: string;
  heroSubtitle: string;
  heroBadge: string;
  quickReport: string;
  trackExisting: string;

  // Grievance Form
  formTitle: string;
  formSubtitle: string;
  routeLabel: string;
  routePlaceholder: string;
  categoryLabel: string;
  categoryPlaceholder: string;
  locationLabel: string;
  locationPlaceholder: string;
  descriptionLabel: string;
  descriptionPlaceholder: string;
  evidenceLabel: string;
  emailLabel: string;
  emailPlaceholder: string;
  submitBtn: string;
  submittingBtn: string;
  
  // Messages & Badges
  similarGrievanceTitle: string;
  similarGrievanceNotice: string;
  attachToTicketBtn: string;
  newTicketBtn: string;
  ticketRegistered: string;
  refCodeLabel: string;
  copyRefBtn: string;
  copiedMsg: string;
  trackLiveStatusBtn: string;
  submitAnotherBtn: string;
  
  // Dashboard & Stats
  totalComplaints: string;
  submitted: string;
  inProgress: string;
  resolved: string;
  slaEscalated: string;
  needsAttention: string;
  trendAlertsTitle: string;
  filterRouteTickets: string;

  // System Portals Section
  systemPortalsTitle: string;
  systemPortalsSubtitle: string;
  portal1Title: string;
  portal1Subtitle: string;
  portal1Feature1: string;
  portal1Feature2: string;
  portal1Feature3: string;
  portal1Btn: string;
  portal2Title: string;
  portal2Subtitle: string;
  portal2Feature1: string;
  portal2Feature2: string;
  portal2Feature3: string;
  portal2Btn: string;
  portal3Title: string;
  portal3Subtitle: string;
  portal3Feature1: string;
  portal3Feature2: string;
  portal3Feature3: string;
  portal3Btn: string;
}

export const translations: Record<Language, Translations> = {
  en: {
    reportGrievance: 'Report Grievance',
    trackStatus: 'Track Status',
    depotDashboard: 'Depot Dashboard',
    help: 'Help',
    inbox: 'Inbox',
    portalSubtitle: 'Passenger Grievance Portal',
    selectLanguage: 'Language',

    heroTitle: 'Official Public Transport Passenger Grievance Portal',
    heroSubtitle: 'Report bus service issues, conductor conduct, or schedule delays directly to KSRTC Depot Command Operations.',
    heroBadge: 'Government of Kerala Public Grievance Redressal System',
    quickReport: 'File a Complaint',
    trackExisting: 'Track Complaint',

    formTitle: 'Report Incident Details',
    formSubtitle: 'Submittable in under 60 seconds with automatic SLA calculation.',
    routeLabel: '1. Route / Bus Service',
    routePlaceholder: 'Type route name or code (e.g. RT-101)...',
    categoryLabel: '2. Grievance Category',
    categoryPlaceholder: '-- Select Category --',
    locationLabel: '3. Incident Location / Bus Stop',
    locationPlaceholder: 'e.g. Attingal Bus Stand, Seat 14, or Highway KM 42...',
    descriptionLabel: '4. Description',
    descriptionPlaceholder: 'Describe the issue clearly (staff behavior, overcharging amount, driver rashness, etc.)...',
    evidenceLabel: '5. Photo / Ticket Evidence (Optional)',
    emailLabel: '6. Passenger Email',
    emailPlaceholder: 'e.g. passenger@gmail.com (Required to receive email receipt)',
    submitBtn: 'Submit Grievance Now',
    submittingBtn: 'Registering...',

    similarGrievanceTitle: '⚠️ Similar Active Grievance Found',
    similarGrievanceNotice: 'An open complaint was recently registered on this route.',
    attachToTicketBtn: '🔗 Attach to Existing Ticket',
    newTicketBtn: 'File as New Ticket',
    ticketRegistered: 'Official Reference Issued',
    refCodeLabel: 'Reference Tracking Code',
    copyRefBtn: 'Copy Reference',
    copiedMsg: 'Copied to Clipboard!',
    trackLiveStatusBtn: 'Track Live Status',
    submitAnotherBtn: 'Submit Another Grievance',

    totalComplaints: 'Total Complaints',
    submitted: 'Submitted',
    inProgress: 'In Progress',
    resolved: 'Resolved',
    slaEscalated: 'SLA Escalated',
    needsAttention: 'Needs Attention (Priority Ranked)',
    trendAlertsTitle: 'Repeated Route Issues & Cluster Alerts',
    filterRouteTickets: 'Filter Route Tickets',

    systemPortalsTitle: 'System Operational Portals',
    systemPortalsSubtitle: 'Select an action portal to proceed',
    portal1Title: 'Report a Grievance',
    portal1Subtitle: 'Submit incident details in under 60 seconds',
    portal1Feature1: '• Route Autocomplete',
    portal1Feature2: '• Auto Depot Mapping',
    portal1Feature3: '• Offline Local Storage Queue',
    portal1Btn: 'OPEN SUBMISSION FORM',
    portal2Title: 'Track Live Status',
    portal2Subtitle: 'Lookup grievance progress & SLA history',
    portal2Feature1: '• Workflow Stepper',
    portal2Feature2: '• State Transition Audit Log',
    portal2Feature3: '• Post-Resolution Feedback',
    portal2Btn: 'Track Complaint',
    portal3Title: 'Depot Dashboard',
    portal3Subtitle: 'Executive analytics & SLA engine controls',
    portal3Feature1: '• Priority Needs Attention Section',
    portal3Feature2: '• SQL Privacy Redaction',
    portal3Feature3: '• SLA Escalation Engine',
    portal3Btn: 'Open Operations Dashboard',
  },
  ml: {
    reportGrievance: 'പരാതി നൽകുക',
    trackStatus: 'സ്റ്റാറ്റസ് പരിശോധിക്കുക',
    depotDashboard: 'ഡിപ്പോ ഡാഷ്‌ബോർഡ്',
    help: 'സഹായം',
    inbox: 'ഇൻബോക്സ്',
    portalSubtitle: 'യാത്രക്കാരുടെ പരാതി പരിഹാര പോർട്ടൽ',
    selectLanguage: 'ഭാഷ',

    heroTitle: 'കെ.എസ്.ആർ.ടി.സി യാത്രക്കാരുടെ ഔദ്യോഗിക പരാതി പോർട്ടൽ',
    heroSubtitle: 'ബസ് സർവീസ് തടസ്സങ്ങൾ, ജീവനക്കാരുടെ പെരുമാറ്റം, സമയം പാലിക്കായ്മ എന്നിവ ഡിപ്പോ കമാൻഡ് ഓപ്പറേഷൻസിലേക്ക് നേരിട്ട് അറിയിക്കുക.',
    heroBadge: 'കേരള സർക്കാർ പൊതു പരാതി പരിഹാര സംവിധാനം',
    quickReport: 'പരാതി നൽകുക',
    trackExisting: 'പരാതി പരിശോധിക്കുക',

    formTitle: 'പരാതി വിവരങ്ങൾ നൽകുക',
    formSubtitle: '60 സെക്കൻഡിനുള്ളിൽ ഓട്ടോമാറ്റിക് SLA മുൻഗണനയോടെ പരാതി നൽകാം.',
    routeLabel: '1. ബസ് റൂട്ട് / സർവീസ്',
    routePlaceholder: 'റൂട്ടിന്റെ പേര് അല്ലെങ്കിൽ കോഡ് നൽകുക (ഉദാ: RT-101)...',
    categoryLabel: '2. പരാതി വിഭാഗം',
    categoryPlaceholder: '-- വിഭാഗം തിരഞ്ഞെടുക്കുക --',
    locationLabel: '3. സംഭവം നടന്ന സ്ഥലം / ബസ് സ്റ്റോപ്പ്',
    locationPlaceholder: 'ഉദാ: ആറ്റിങ്ങൽ സ്റ്റാൻഡ്, സീറ്റ് 14...',
    descriptionLabel: '4. വിവരണം',
    descriptionPlaceholder: 'പ്രശ്നം വ്യക്തമായി വിവരിക്കുക (ജീവനക്കാരുടെ പെരുമാറ്റം, അധിക ചാർജ്ജ്, അമിത വേഗത...)...',
    evidenceLabel: '5. ടിക്കറ്റ് / ഫോട്ടോ തെളിവ് (ഓപ്ഷണൽ)',
    emailLabel: '6. യാത്രക്കാരന്റെ ഇമെയിൽ',
    emailPlaceholder: 'ഉദാ: passenger@gmail.com (കൺഫർമേഷൻ ഇമെയിൽ ലഭിക്കാൻ ആവശ്യമാണ്)',
    submitBtn: 'പരാതി സമർപ്പിക്കുക',
    submittingBtn: 'രേഖപ്പെടുത്തുന്നു...',

    similarGrievanceTitle: '⚠️ സമാനമായ പരാതി നിലവിലുണ്ട്',
    similarGrievanceNotice: 'ഈ റൂട്ടിൽ സമാനമായ പരാതി നേരത്തെ രേഖപ്പെടുത്തിയിട്ടുണ്ട്.',
    attachToTicketBtn: '🔗 നിലവിലുള്ള ടിക്കറ്റുമായി ബന്ധിപ്പിക്കുക',
    newTicketBtn: 'പുതിയ പരാതിയായി നൽകുക',
    ticketRegistered: 'ഔദ്യോഗിക റഫറൻസ് നമ്പർ നൽകി',
    refCodeLabel: 'റഫറൻസ് ട്രാക്കിംഗ് കോഡ്',
    copyRefBtn: 'കോപ്പി ചെയ്യുക',
    copiedMsg: 'ക്ലിപ്പ്ബോർഡിലേക്ക് കോപ്പി ചെയ്തു!',
    trackLiveStatusBtn: 'ലൈവ് സ്റ്റാറ്റസ് കാണുക',
    submitAnotherBtn: 'മറ്റൊരു പരാതി നൽകുക',

    totalComplaints: 'ആകെ പരാതികൾ',
    submitted: 'സമർപ്പിച്ചവ',
    inProgress: 'നടപടിയിൽ',
    resolved: 'പരിഹരിച്ചവ',
    slaEscalated: 'SLA സമയം കഴിഞ്ഞവ',
    needsAttention: 'മുൻഗണന ആവശ്യമുള്ളവ',
    trendAlertsTitle: 'ആവർത്തിച്ചുള്ള റൂട്ട് പ്രശ്നങ്ങൾ & അലേർട്ടുകൾ',
    filterRouteTickets: 'റൂട്ട് ടിക്കറ്റുകൾ കാണുക',

    systemPortalsTitle: 'പ്രവർത്തന പോർട്ടലുകൾ',
    systemPortalsSubtitle: 'മുമ്പോട്ട് പോകാൻ ഒരു പോർട്ടൽ തിരഞ്ഞെടുക്കുക',
    portal1Title: 'പരാതി സമർപ്പിക്കുക',
    portal1Subtitle: '60 സെക്കൻഡിനുള്ളിൽ വിവരങ്ങൾ നൽകുക',
    portal1Feature1: '• റൂട്ട് ഓട്ടോ കംപ്ലീറ്റ്',
    portal1Feature2: '• ഓട്ടോ ഡിപ്പോ മാപ്പിംഗ്',
    portal1Feature3: '• ഓഫ്ലൈൻ ലോക്കൽ സ്റ്റോറേജ് ക്യൂ',
    portal1Btn: 'ഫോം തുറക്കുക',
    portal2Title: 'സ്റ്റാറ്റസ് പരിശോധിക്കുക',
    portal2Subtitle: 'പരാതി നടപടികളും SLA ചരിത്രവും കാണുക',
    portal2Feature1: '• വർക്ക്ഫ്ലോ സ്റ്റെപ്പർ',
    portal2Feature2: '• ഓഡിറ്റ് ലോഗ് കാണുക',
    portal2Feature3: '• പരിഹാര ശേഷമുള്ള ഫീഡ്‌ബാക്ക്',
    portal2Btn: 'പരാതി പരിശോധിക്കുക',
    portal3Title: 'ഡിപ്പോ ഡാഷ്‌ബോർഡ്',
    portal3Subtitle: 'അനലിറ്റിക്സും SLA കൺട്രോളുകളും',
    portal3Feature1: '• മുൻഗണനാ ക്രമം',
    portal3Feature2: '• SQL പ്രൈവസി വിവരങ്ങൾ',
    portal3Feature3: '• SLA എൻജിൻ കൺട്രോൾ',
    portal3Btn: 'ഡാഷ്‌ബോർഡ് തുറക്കുക',
  },
  hi: {
    reportGrievance: 'शिकायत दर्ज करें',
    trackStatus: 'स्थिति जांचें',
    depotDashboard: 'डिपो डैशबोर्ड',
    help: 'सहायता',
    inbox: 'इनबॉक्स',
    portalSubtitle: 'यात्री शिकायत निवारण पोर्टल',
    selectLanguage: 'भाषा',

    heroTitle: 'केएसआरटीसी यात्री शिकायत निवारण आधिकारिक पोर्टल',
    heroSubtitle: 'बस सेवा संबंधी समस्याएं, कंडक्टर का व्यवहार या देरी की शिकायत सीधे डिपो कमांड ऑपरेशंस को दर्ज करें।',
    heroBadge: 'केरल सरकार जन शिकायत निवारण प्रणाली',
    quickReport: 'शिकायत दर्ज करें',
    trackExisting: 'शिकायत ट्रैक करें',

    formTitle: 'घटना का विवरण दें',
    formSubtitle: '60 सेकंड से कम समय में स्वचालित SLA ट्रैकिंग के साथ शिकायत दर्ज करें।',
    routeLabel: '1. बस रूट / सेवा',
    routePlaceholder: 'रूट का नाम या कोड टाइप करें (जैसे RT-101)...',
    categoryLabel: '2. शिकायत श्रेणी',
    categoryPlaceholder: '-- श्रेणी चुनें --',
    locationLabel: '3. घटना का स्थान / बस स्टॉप',
    locationPlaceholder: 'जैसे आतिंगल बस स्टैंड, सीट 14...',
    descriptionLabel: '4. विवरण',
    descriptionPlaceholder: 'समस्या का स्पष्ट विवरण दें (कर्मचारी का व्यवहार, अधिक किराया, तेज गति आदि)...',
    evidenceLabel: '5. टिकट / फोटो साक्ष्य (वैकल्पिक)',
    emailLabel: '6. यात्री का ईमेल',
    emailPlaceholder: 'जैसे passenger@gmail.com (ईमेल रसीद प्राप्त करने के लिए आवश्यक)',
    submitBtn: 'शिकायत जमा करें',
    submittingBtn: 'दर्ज हो रहा है...',

    similarGrievanceTitle: '⚠️ समान शिकायत पहले से मौजूद है',
    similarGrievanceNotice: 'इस रूट पर हाल ही में एक समान शिकायत दर्ज की गई है।',
    attachToTicketBtn: '🔗 मौजूदा टिकट से जोड़ें',
    newTicketBtn: 'नई शिकायत के रूप में दर्ज करें',
    ticketRegistered: 'आधिकारिक संदर्भ कोड जारी किया गया',
    refCodeLabel: 'संदर्भ ट्रैकिंग कोड',
    copyRefBtn: 'कॉपी करें',
    copiedMsg: 'क्लिपबोर्ड पर कॉपी हो गया!',
    trackLiveStatusBtn: 'लाइव स्थिति देखें',
    submitAnotherBtn: 'दूसरी शिकायत दर्ज करें',

    totalComplaints: 'कुल शिकायतें',
    submitted: 'दर्ज शिकायतें',
    inProgress: 'प्रक्रियाधीन',
    resolved: 'निपटाया गया',
    slaEscalated: 'समय सीमा पार (Escalated)',
    needsAttention: 'प्राथमिकता वाली शिकायतें',
    trendAlertsTitle: 'बार-बार होने वाली रूट समस्याएं और अलर्ट',
    filterRouteTickets: 'रूट टिकट फ़िल्टर करें',

    systemPortalsTitle: 'सिस्टम ऑपरेशंस पोर्टल',
    systemPortalsSubtitle: 'आगे बढ़ने के लिए एक पोर्टल चुनें',
    portal1Title: 'शिकायत दर्ज करें',
    portal1Subtitle: '60 सेकंड में विवरण दर्ज करें',
    portal1Feature1: '• रूट ऑटो-कंपलीट',
    portal1Feature2: '• ऑटो डिपो मैपिंग',
    portal1Feature3: '• ऑफलाइन लोकल स्टोरेज कतार',
    portal1Btn: 'फॉर्म खोलें',
    portal2Title: 'लाइव स्थिति ट्रैक करें',
    portal2Subtitle: 'शिकायत की प्रगति और SLA इतिहास देखें',
    portal2Feature1: '• वर्कफ़्लो स्टेपर',
    portal2Feature2: '• स्टेट ऑडिट लॉग',
    portal2Feature3: '• समाधान के बाद प्रतिक्रिया',
    portal2Btn: 'शिकायत ट्रैक करें',
    portal3Title: 'डिपो डैशबोर्ड',
    portal3Subtitle: 'कार्यकारी विश्लेषिकी और SLA नियंत्रण',
    portal3Feature1: '• प्राथमिकता अनुभाग',
    portal3Feature2: '• SQL गोपनीयता सुरक्षा',
    portal3Feature3: '• SLA एस्केलेशन इंजन',
    portal3Btn: 'डैशबोर्ड खोलें',
  },
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: Translations;
}

const LanguageContext = createContext<LanguageContextType>({
  language: 'en',
  setLanguage: () => {},
  t: translations.en,
});

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>('en');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedLang = localStorage.getItem('aanavandi_lang') as Language;
      if (savedLang && (savedLang === 'en' || savedLang === 'ml' || savedLang === 'hi')) {
        setLanguageState(savedLang);
      }
    }
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    if (typeof window !== 'undefined') {
      localStorage.setItem('aanavandi_lang', lang);
    }
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t: translations[language] }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
