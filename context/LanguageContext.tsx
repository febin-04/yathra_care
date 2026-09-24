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
  grievanceFormBadge: string;
  formTitle: string;
  formSubtitle: string;
  routeLabel: string;
  routePlaceholder: string;
  unspecifiedRoute: string;
  noMatchingRoutes: string;
  categoryLabel: string;
  categoryPlaceholder: string;
  slaTargetText: string;
  locationLabel: string;
  locationPlaceholder: string;
  descriptionLabel: string;
  descriptionPlaceholder: string;
  suggestedCategoryText: string;
  clickToApplyText: string;
  evidenceLabel: string;
  evidenceDropText: string;
  evidenceSubtext: string;
  emailLabel: string;
  emailSubLabel: string;
  emailPlaceholder: string;
  submitBtn: string;
  submittingBtn: string;
  
  // Right Column Summary Panel
  grievanceDetailsBadge: string;
  summaryReviewTitle: string;
  stepProgressText: string;
  selectedRouteHeader: string;
  notSelectedYet: string;
  assignedDepotHeader: string;
  centralOperations: string;
  grievanceCategoryHeader: string;
  notChosenYet: string;
  incidentLocationHeader: string;
  optionalUnspecified: string;
  checkCategorySelected: string;
  checkDescriptionProvided: string;
  instantReferenceFooter: string;

  // Mobile Wizard Strings
  mobileStepText: string;
  mobileStepOf: string;
  mobileStep1Title: string;
  mobileStep2Title: string;
  mobileStep3Title: string;
  mobileStep4Title: string;
  selectBusRouteTitle: string;
  selectBusRouteSubtitle: string;
  mappedDepotText: string;
  chooseCategoryTitle: string;
  chooseCategorySubtitle: string;
  incidentLocationTitle: string;
  incidentLocationSubtitle: string;
  descEvidenceTitle: string;
  descEvidenceSubtitle: string;
  attachTicketEvidence: string;
  emailStatusUpdatesPlaceholder: string;
  nextStepBtn: string;
  backToPreviousStep: string;
  
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

export const categoryTranslations: Record<Language, Record<string, string>> = {
  en: {
    'Driver Rash Driving': 'Driver Rash Driving',
    'Conductor Behavior': 'Conductor Behavior',
    'Fare / Ticket Issue': 'Fare / Ticket Issue',
    'Overcrowding / Schedule Delay': 'Overcrowding / Schedule Delay',
    'Bus Cleanliness / Maintenance': 'Bus Cleanliness / Maintenance',
    'Safety & Security': 'Safety & Security',
  },
  ml: {
    'Driver Rash Driving': 'ഡ്രൈവറുടെ അമിത വേഗത / അപകടകരമായ ഡ്രൈവിംഗ്',
    'Conductor Behavior': 'കണ്ടക്ടറുടെ പെരുമാറ്റം',
    'Fare / Ticket Issue': 'ടിക്കറ്റ് ചാർജ്ജ് / ഫെയർ പ്രശ്നം',
    'Overcrowding / Schedule Delay': 'അമിത തിരക്ക് / സർവീസ് താമസം',
    'Bus Cleanliness / Maintenance': 'ബസിന്റെ ശുചിത്വം / തരാകേട്',
    'Safety & Security': 'സുരക്ഷാ പ്രശ്നം',
  },
  hi: {
    'Driver Rash Driving': 'ड्राइवर की तेज / लापरवाही से ड्राइविंग',
    'Conductor Behavior': 'कंडक्टर का व्यवहार',
    'Fare / Ticket Issue': 'किराया / टिकट संबंधी समस्या',
    'Overcrowding / Schedule Delay': 'अत्यधिक भीड़ / सेवा में देरी',
    'Bus Cleanliness / Maintenance': 'बस की सफाई / रखरखाव',
    'Safety & Security': 'सुरक्षा संबंधी समस्या',
  },
};

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

    grievanceFormBadge: 'Grievance Form',
    formTitle: 'Report Incident Details',
    formSubtitle: 'Submittable in under 60 seconds with automatic SLA calculation.',
    routeLabel: '1. Route / Bus Service',
    routePlaceholder: 'Type route name or code (e.g. RT-101)...',
    unspecifiedRoute: '-- Unspecified / General Route --',
    noMatchingRoutes: 'No matching bus routes found',
    categoryLabel: '2. Grievance Category',
    categoryPlaceholder: '-- Select Category --',
    slaTargetText: 'Target',
    locationLabel: '3. Incident Location / Bus Stop',
    locationPlaceholder: 'e.g. Attingal Bus Stand, Seat 14, or Highway KM 42...',
    descriptionLabel: '4. Description',
    descriptionPlaceholder: 'Describe the issue clearly (staff behavior, overcharging amount, driver rashness, etc.)...',
    suggestedCategoryText: '💡 Suggested Category:',
    clickToApplyText: 'Click to apply',
    evidenceLabel: '5. Photo / Ticket Evidence (Optional)',
    evidenceDropText: 'Click or drop ticket photo / evidence image here',
    evidenceSubtext: 'Supports JPG, PNG up to 5MB',
    emailLabel: '6. Passenger Email',
    emailSubLabel: 'Instant Email Confirmation',
    emailPlaceholder: 'e.g. passenger@gmail.com (Required to receive email receipt)',
    submitBtn: 'Submit Grievance Now',
    submittingBtn: 'Registering...',

    grievanceDetailsBadge: 'Grievance Details',
    summaryReviewTitle: 'Summary Review',
    stepProgressText: 'Step 1 of 2',
    selectedRouteHeader: 'Selected Route',
    notSelectedYet: 'Not selected yet',
    assignedDepotHeader: 'Assigned Depot Preview',
    centralOperations: 'Central Operations',
    grievanceCategoryHeader: 'Grievance Category',
    notChosenYet: 'Not chosen yet',
    incidentLocationHeader: 'Incident Location',
    optionalUnspecified: 'Optional / Unspecified',
    checkCategorySelected: 'Category Selected',
    checkDescriptionProvided: 'Incident Description Provided',
    instantReferenceFooter: 'Instant reference generated • 100% Offline SQLite database',

    mobileStepText: 'Step',
    mobileStepOf: 'of',
    mobileStep1Title: 'Route Selection',
    mobileStep2Title: 'Category',
    mobileStep3Title: 'Location',
    mobileStep4Title: 'Description & Evidence',
    selectBusRouteTitle: 'Select Bus Route',
    selectBusRouteSubtitle: 'Which bus service was involved?',
    mappedDepotText: 'Mapped Depot:',
    chooseCategoryTitle: 'Choose Grievance Category',
    chooseCategorySubtitle: 'SLA resolution targets will be applied automatically.',
    incidentLocationTitle: 'Incident Location',
    incidentLocationSubtitle: 'Bus stand name, landmark, or seat position.',
    descEvidenceTitle: 'Description & Photo Evidence',
    descEvidenceSubtitle: 'Explain the issue clearly to help depot managers.',
    attachTicketEvidence: 'Attach Ticket / Photo Evidence',
    emailStatusUpdatesPlaceholder: 'Email address for live status updates...',
    nextStepBtn: 'Next Step',
    backToPreviousStep: '← Back to Previous Step',

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

    grievanceFormBadge: 'പരാതി ഫോം',
    formTitle: 'പരാതി വിവരങ്ങൾ നൽകുക',
    formSubtitle: '60 സെക്കൻഡിനുള്ളിൽ ഓട്ടോമാറ്റിക് SLA മുൻഗണനയോടെ പരാതി നൽകാം.',
    routeLabel: '1. ബസ് റൂട്ട് / സർവീസ്',
    routePlaceholder: 'റൂട്ടിന്റെ പേര് അല്ലെങ്കിൽ കോഡ് നൽകുക (ഉദാ: RT-101)...',
    unspecifiedRoute: '-- പൊതുവായ റൂട്ട് --',
    noMatchingRoutes: 'റൂട്ടുകളൊന്നും കണ്ടെത്തിയില്ല',
    categoryLabel: '2. പരാതി വിഭാഗം',
    categoryPlaceholder: '-- വിഭാഗം തിരഞ്ഞെടുക്കുക --',
    slaTargetText: 'സമയ പരിധി',
    locationLabel: '3. സംഭവം നടന്ന സ്ഥലം / ബസ് സ്റ്റോപ്പ്',
    locationPlaceholder: 'ഉദാ: ആറ്റിങ്ങൽ സ്റ്റാൻഡ്, സീറ്റ് 14...',
    descriptionLabel: '4. വിവരണം',
    descriptionPlaceholder: 'പ്രശ്നം വ്യക്തമായി വിവരിക്കുക (ജീവനക്കാരുടെ പെരുമാറ്റം, അധിക ചാർജ്ജ്, അമിത വേഗത...)...',
    suggestedCategoryText: '💡 നിർദ്ദേശിച്ച വിഭാഗം:',
    clickToApplyText: 'സ്വീകരിക്കാൻ ക്ലിക്ക് ചെയ്യുക',
    evidenceLabel: '5. ഫോട്ടോ / ടിക്കറ്റ് തെളിവ് (ഓപ്ഷണൽ)',
    evidenceDropText: 'ഫോട്ടോ അല്ലെങ്കിൽ ടിക്കറ്റ് തെളിവ് ഇവിടെ നൽകുക',
    evidenceSubtext: 'JPG, PNG (പരമാവധി 5MB) പിന്തുണയ്ക്കുന്നു',
    emailLabel: '6. യാത്രക്കാരന്റെ ഇമെയിൽ',
    emailSubLabel: 'തൽക്ഷണ ഇമെയിൽ സ്ഥിരീകരണം',
    emailPlaceholder: 'ഉദാ: passenger@gmail.com (കൺഫർമേഷൻ ഇമെയിൽ ലഭിക്കാൻ ആവശ്യമാണ്)',
    submitBtn: 'പരാതി സമർപ്പിക്കുക',
    submittingBtn: 'രേഖപ്പെടുത്തുന്നു...',

    grievanceDetailsBadge: 'പരാതി വിവരങ്ങൾ',
    summaryReviewTitle: 'സമ്മറി റിവ്യൂ',
    stepProgressText: 'ഘട്ടം 1 / 2',
    selectedRouteHeader: 'തിരഞ്ഞെടുത്ത റൂട്ട്',
    notSelectedYet: 'ഇതുവരെ തിരഞ്ഞെടുത്തിട്ടില്ല',
    assignedDepotHeader: 'ഡിപ്പോ വിവരം',
    centralOperations: 'സെൻട്രൽ ഓപ്പറേഷൻസ്',
    grievanceCategoryHeader: 'പരാതി വിഭാഗം',
    notChosenYet: 'തിരഞ്ഞെടുത്തിട്ടില്ല',
    incidentLocationHeader: 'സംഭവം നടന്ന സ്ഥലം',
    optionalUnspecified: 'ഓപ്ഷണൽ / വ്യക്തമല്ല',
    checkCategorySelected: 'വിഭാഗം തിരഞ്ഞെടുത്തു',
    checkDescriptionProvided: 'വിവരണം നൽകി',
    instantReferenceFooter: 'തൽക്ഷണ റഫറൻസ് നമ്പർ ജനറേറ്റ് ചെയ്യുന്നു • 100% ഓഫ്ലൈൻ സംവിധാനം',

    mobileStepText: 'ഘട്ടം',
    mobileStepOf: '/',
    mobileStep1Title: 'റൂട്ട് തിരഞ്ഞെടുക്കൽ',
    mobileStep2Title: 'വിഭാഗം',
    mobileStep3Title: 'സ്ഥലം',
    mobileStep4Title: 'വിവരണവും തെളിവും',
    selectBusRouteTitle: 'ബസ് റൂട്ട് തിരഞ്ഞെടുക്കുക',
    selectBusRouteSubtitle: 'ഏത് ബസ് സർവീസിനെക്കുറിച്ചാണ് പരാതി?',
    mappedDepotText: 'ഡിപ്പോ:',
    chooseCategoryTitle: 'പരാതി വിഭാഗം തിരഞ്ഞെടുക്കുക',
    chooseCategorySubtitle: 'SLA പരിഹാര സമയം ഓട്ടോമാറ്റിക്കായി ബാധകമാകും.',
    incidentLocationTitle: 'സംഭവം നടന്ന സ്ഥലം',
    incidentLocationSubtitle: 'ബസ് സ്റ്റാൻഡ്, സ്ഥലം, അല്ലെങ്കിൽ സീറ്റ് നമ്പർ.',
    descEvidenceTitle: 'വിവരണവും ഫോട്ടോ തെളിവും',
    descEvidenceSubtitle: 'ഡിപ്പോ അധികൃതർക്ക് മനസ്സിലാകുന്ന വിധം വ്യക്തമായി നൽകുക.',
    attachTicketEvidence: 'ടിക്കറ്റ് / ഫോട്ടോ തെളിവ് ചേർക്കുക',
    emailStatusUpdatesPlaceholder: 'തൽക്ഷണ വിവരങ്ങൾ ലഭിക്കാനുള്ള ഇമെയിൽ...',
    nextStepBtn: 'അടുത്ത ഘട്ടം',
    backToPreviousStep: '← മുമ്പത്തെ ഘട്ടത്തിലേക്ക്',

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

    grievanceFormBadge: 'शिकायत फॉर्म',
    formTitle: 'घटना का विवरण दें',
    formSubtitle: '60 सेकंड से कम समय में स्वचालित SLA ट्रैकिंग के साथ शिकायत दर्ज करें।',
    routeLabel: '1. बस रूट / सेवा',
    routePlaceholder: 'रूट का नाम या कोड टाइप करें (जैसे RT-101)...',
    unspecifiedRoute: '-- सामान्य रूट --',
    noMatchingRoutes: 'कोई रूट नहीं मिला',
    categoryLabel: '2. शिकायत श्रेणी',
    categoryPlaceholder: '-- श्रेणी चुनें --',
    slaTargetText: 'SLA समय सीमा',
    locationLabel: '3. घटना का स्थान / बस स्टॉप',
    locationPlaceholder: 'जैसे आतिंगल बस स्टैंड, सीट 14...',
    descriptionLabel: '4. विवरण',
    descriptionPlaceholder: 'समस्या का स्पष्ट विवरण दें (कर्मचारी का व्यवहार, अधिक किराया, तेज गति आदि)...',
    suggestedCategoryText: '💡 सुझाई गई श्रेणी:',
    clickToApplyText: 'लागू करने के लिए क्लिक करें',
    evidenceLabel: '5. टिकट / फोटो साक्ष्य (वैकल्पिक)',
    evidenceDropText: 'यहां टिकट फोटो या साक्ष्य अपलोड करें',
    evidenceSubtext: 'JPG, PNG (अधिकतम 5MB) समर्थित',
    emailLabel: '6. यात्री का ईमेल',
    emailSubLabel: 'तुरंत ईमेल पुष्टि',
    emailPlaceholder: 'जैसे passenger@gmail.com (ईमेल रसीद प्राप्त करने के लिए आवश्यक)',
    submitBtn: 'शिकायत जमा करें',
    submittingBtn: 'दर्ज हो रहा है...',

    grievanceDetailsBadge: 'शिकायत विवरण',
    summaryReviewTitle: 'सारांश समीक्षा',
    stepProgressText: 'चरण 1 / 2',
    selectedRouteHeader: 'चयनित रूट',
    notSelectedYet: 'अभी तक चयनित नहीं',
    assignedDepotHeader: 'आवंटित डिपो पूर्वावलोकन',
    centralOperations: 'सेंट्रल ऑपरेशंस',
    grievanceCategoryHeader: 'शिकायत श्रेणी',
    notChosenYet: 'अभी चुना नहीं गया',
    incidentLocationHeader: 'घटना का स्थान',
    optionalUnspecified: 'वैकल्पिक / अननिर्दिष्ट',
    checkCategorySelected: 'श्रेणी चुनी गई',
    checkDescriptionProvided: 'घटना का विवरण प्रदान किया गया',
    instantReferenceFooter: 'तुरंत संदर्भ संख्या उत्पन्न होगी • 100% ऑफ़लाइन डेटाबेस',

    mobileStepText: 'चरण',
    mobileStepOf: '/',
    mobileStep1Title: 'रूट चयन',
    mobileStep2Title: 'श्रेणी',
    mobileStep3Title: 'स्थान',
    mobileStep4Title: 'विवरण और साक्ष्य',
    selectBusRouteTitle: 'बस रूट चुनें',
    selectBusRouteSubtitle: 'कौन सी बस सेवा शामिल थी?',
    mappedDepotText: 'मैप किया गया डिपो:',
    chooseCategoryTitle: 'शिकायत श्रेणी चुनें',
    chooseCategorySubtitle: 'SLA समाधान लक्ष्य स्वचालित रूप से लागू होंगे।',
    incidentLocationTitle: 'घटना का स्थान',
    incidentLocationSubtitle: 'बस स्टैंड का नाम, लैंडमार्क या सीट।',
    descEvidenceTitle: 'विवरण और फोटो साक्ष्य',
    descEvidenceSubtitle: 'समस्या को स्पष्ट रूप से समझाएं।',
    attachTicketEvidence: 'टिकट / फोटो साक्ष्य संलग्न करें',
    emailStatusUpdatesPlaceholder: 'लाइव अपडेट प्राप्त करने के लिए ईमेल...',
    nextStepBtn: 'अगला चरण',
    backToPreviousStep: '← पिछले चरण पर वापस जाएं',

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
  tCat: (name: string) => string;
}

const LanguageContext = createContext<LanguageContextType>({
  language: 'en',
  setLanguage: () => {},
  t: translations.en,
  tCat: (name: string) => name,
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

  const tCat = (name: string): string => {
    if (!name) return name;
    return categoryTranslations[language]?.[name] || name;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t: translations[language], tCat }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
