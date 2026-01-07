import { useState, useEffect, useMemo } from 'react'
import { useKV } from '@/hooks/useKV'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ScrollArea } from '@/components/ui/scroll-area'
import { MultiSelect, MARITAL_STATUS_OPTIONS, RELIGION_OPTIONS, MOTHER_TONGUE_OPTIONS, OCCUPATION_PROFESSION_OPTIONS, COUNTRY_OPTIONS, EDUCATION_OPTIONS, EMPLOYMENT_STATUS_OPTIONS, DIET_PREFERENCE_OPTIONS, DRINKING_HABIT_OPTIONS, SMOKING_HABIT_OPTIONS, getStateOptionsForCountries } from '@/components/ui/multi-select'
import { Gear, Heart, Phone, Info, FileText, ShieldCheck, MagnifyingGlass } from '@phosphor-icons/react'
import { toast } from 'sonner'
import type { Profile, PartnerPreferenceData, DietPreference, DrinkingHabit, SmokingHabit, MaritalStatus } from '@/types/profile'
import type { Language } from '@/lib/translations'

// FAQ data structure with categories and priority
interface FAQItem {
  id: string
  category: 'getting-started' | 'profile' | 'matching' | 'communication' | 'verification' | 'privacy' | 'membership' | 'technical'
  priority: number // Lower = higher priority (shows first)
  question: { en: string; hi: string }
  answer: { en: string; hi: string }
  keywords: string[] // For search
}

const FAQ_DATA: FAQItem[] = [
  // Getting Started (Priority 1-10)
  {
    id: 'register',
    category: 'getting-started',
    priority: 1,
    question: {
      en: 'How do I register on the platform?',
      hi: 'मैं प्लेटफॉर्म पर कैसे पंजीकरण करूं?'
    },
    answer: {
      en: 'Click on "Register" button on the homepage, fill in your basic details, upload photos, and complete the verification process. Your profile will be reviewed within 24-48 hours.',
      hi: 'होमपेज पर "पंजीकरण" बटन पर क्लिक करें, अपना विवरण भरें, फोटो अपलोड करें और सत्यापन प्रक्रिया पूरी करें। आपकी प्रोफाइल 24-48 घंटे में समीक्षित की जाएगी।'
    },
    keywords: ['register', 'sign up', 'create account', 'join', 'new user', 'पंजीकरण']
  },
  {
    id: 'edit-profile',
    category: 'profile',
    priority: 2,
    question: {
      en: 'How do I edit my profile?',
      hi: 'मैं अपनी प्रोफाइल कैसे संपादित करूं?'
    },
    answer: {
      en: 'Go to "My Profile" page and click the "Edit Profile" button in the top right corner. You can update your personal details, photos, partner preferences and more.',
      hi: 'मेरी प्रोफाइल पेज पर जाएं और ऊपर दाईं ओर "प्रोफाइल संपादित करें" बटन पर क्लिक करें। आप अपना व्यक्तिगत विवरण, फोटो, पार्टनर प्राथमिकताएं आदि अपडेट कर सकते हैं।'
    },
    keywords: ['edit', 'update', 'change', 'modify', 'profile', 'संपादित']
  },
  {
    id: 'verification-time',
    category: 'verification',
    priority: 3,
    question: {
      en: 'How long does verification take?',
      hi: 'सत्यापन में कितना समय लगता है?'
    },
    answer: {
      en: 'Profile verification typically takes 24-48 hours. Photo verification is instant using AI. Document verification may take up to 72 hours during peak times.',
      hi: 'प्रोफाइल सत्यापन में आमतौर पर 24-48 घंटे लगते हैं। फोटो सत्यापन AI द्वारा तुरंत होता है। पीक समय में दस्तावेज़ सत्यापन में 72 घंटे लग सकते हैं।'
    },
    keywords: ['verification', 'verify', 'time', 'how long', 'pending', 'सत्यापन']
  },
  {
    id: 'block-someone',
    category: 'privacy',
    priority: 4,
    question: {
      en: 'How do I block someone?',
      hi: 'मैं किसी को कैसे ब्लॉक करूं?'
    },
    answer: {
      en: 'Open the profile you want to block, click the three-dot menu or "Report/Block" button, and select "Block". Blocked users cannot see your profile or contact you.',
      hi: 'जिस प्रोफाइल को ब्लॉक करना है उसे खोलें, तीन-डॉट मेनू या "रिपोर्ट/ब्लॉक" बटन पर क्लिक करें, और "ब्लॉक" चुनें। ब्लॉक किए गए उपयोगकर्ता आपकी प्रोफाइल नहीं देख सकते।'
    },
    keywords: ['block', 'report', 'hide', 'remove', 'ब्लॉक', 'रिपोर्ट']
  },
  // Matching & Search (Priority 10-20)
  {
    id: 'smart-matching',
    category: 'matching',
    priority: 10,
    question: {
      en: 'What is Smart Matching?',
      hi: 'स्मार्ट मैचिंग क्या है?'
    },
    answer: {
      en: 'Smart Matching uses your saved partner preferences to automatically filter profiles. Toggle it ON to see profiles matching your preferences, or OFF to browse all profiles and apply manual filters.',
      hi: 'स्मार्ट मैचिंग आपकी सहेजी गई पार्टनर प्राथमिकताओं का उपयोग करके प्रोफाइल फ़िल्टर करती है। अपनी प्राथमिकताओं से मेल खाती प्रोफाइल देखने के लिए इसे ON करें।'
    },
    keywords: ['smart matching', 'filter', 'preferences', 'automatic', 'स्मार्ट मैचिंग', 'फ़िल्टर']
  },
  {
    id: 'filter-profiles',
    category: 'matching',
    priority: 11,
    question: {
      en: 'How do I filter profiles?',
      hi: 'मैं प्रोफाइल कैसे फ़िल्टर करूं?'
    },
    answer: {
      en: 'Click the "Filters" button on the My Matches page. You can filter by age, education, location, religion, occupation, and many more criteria. Select "Any/All" to include all options for a filter.',
      hi: 'माय मैचेस पेज पर "फ़िल्टर" बटन क्लिक करें। आप आयु, शिक्षा, स्थान, धर्म, व्यवसाय आदि से फ़िल्टर कर सकते हैं। किसी फ़िल्टर के सभी विकल्पों को शामिल करने के लिए "कोई भी/सभी" चुनें।'
    },
    keywords: ['filter', 'search', 'find', 'criteria', 'age', 'location', 'खोज', 'फ़िल्टर']
  },
  {
    id: 'no-matches',
    category: 'matching',
    priority: 12,
    question: {
      en: 'Why am I not seeing any matches?',
      hi: 'मुझे कोई मैच क्यों नहीं दिख रहे?'
    },
    answer: {
      en: 'Your filters may be too restrictive. Check the diagnostic suggestions shown when no matches are found - you can click on each issue to adjust that specific filter. Try turning OFF Smart Matching or selecting "Any/All" for some filters.',
      hi: 'आपके फ़िल्टर बहुत सख्त हो सकते हैं। जब कोई मैच नहीं मिलता तो दिखाए गए सुझावों को देखें - किसी भी समस्या पर क्लिक करके उस फ़िल्टर को समायोजित करें। स्मार्ट मैचिंग बंद करें या कुछ फ़िल्टर के लिए "कोई भी/सभी" चुनें।'
    },
    keywords: ['no matches', 'zero results', 'empty', 'not showing', 'कोई मैच नहीं']
  },
  // Communication (Priority 20-30)
  {
    id: 'send-interest',
    category: 'communication',
    priority: 20,
    question: {
      en: 'How do I send an interest?',
      hi: 'मैं रुचि कैसे भेजूं?'
    },
    answer: {
      en: 'Click the heart icon on any profile card or the "Send Interest" button on the profile detail page. The other person will receive a notification and can accept or decline.',
      hi: 'किसी भी प्रोफाइल कार्ड पर दिल आइकन या प्रोफाइल विवरण पेज पर "रुचि भेजें" बटन क्लिक करें। दूसरे व्यक्ति को सूचना मिलेगी और वह स्वीकार या अस्वीकार कर सकता है।'
    },
    keywords: ['interest', 'like', 'heart', 'send', 'रुचि', 'पसंद']
  },
  {
    id: 'view-interests',
    category: 'communication',
    priority: 21,
    question: {
      en: 'Where can I see received interests?',
      hi: 'मुझे प्राप्त रुचियां कहां दिखेंगी?'
    },
    answer: {
      en: 'Go to "My Activity" page and click on the "Received Interests" tab. You will see all pending interests with options to accept or decline each one.',
      hi: 'माय एक्टिविटी पेज पर जाएं और "प्राप्त रुचियां" टैब क्लिक करें। आपको सभी लंबित रुचियां दिखेंगी जिन्हें आप स्वीकार या अस्वीकार कर सकते हैं।'
    },
    keywords: ['received', 'interests', 'pending', 'activity', 'प्राप्त', 'रुचियां']
  },
  {
    id: 'contact-request',
    category: 'communication',
    priority: 22,
    question: {
      en: 'How do I request contact details?',
      hi: 'मैं संपर्क विवरण का अनुरोध कैसे करूं?'
    },
    answer: {
      en: 'After both parties accept interests (mutual match), you can request contact details. Go to the profile and click "Request Contact". The other person must approve before details are shared.',
      hi: 'दोनों पक्षों द्वारा रुचि स्वीकार करने के बाद (म्यूचुअल मैच), आप संपर्क विवरण का अनुरोध कर सकते हैं। प्रोफाइल पर जाएं और "संपर्क अनुरोध" क्लिक करें।'
    },
    keywords: ['contact', 'phone', 'number', 'request', 'details', 'संपर्क']
  },
  {
    id: 'chat-feature',
    category: 'communication',
    priority: 23,
    question: {
      en: 'How does the chat feature work?',
      hi: 'चैट फीचर कैसे काम करता है?'
    },
    answer: {
      en: 'Once you have a mutual match (both accepted interest), you can start chatting. Go to "Inbox" to see all your conversations. Messages are private and secure.',
      hi: 'म्यूचुअल मैच होने के बाद (दोनों ने रुचि स्वीकार की), आप चैट शुरू कर सकते हैं। सभी बातचीत देखने के लिए "इनबॉक्स" पर जाएं। संदेश निजी और सुरक्षित हैं।'
    },
    keywords: ['chat', 'message', 'inbox', 'conversation', 'talk', 'चैट', 'संदेश']
  },
  // Profile & Verification (Priority 30-40)
  {
    id: 'photo-guidelines',
    category: 'profile',
    priority: 30,
    question: {
      en: 'What are the photo guidelines?',
      hi: 'फोटो दिशानिर्देश क्या हैं?'
    },
    answer: {
      en: 'Upload clear, recent photos showing your face. Avoid group photos, heavily filtered images, or photos with sunglasses. A good profile photo increases response rates significantly.',
      hi: 'स्पष्ट, हाल की फोटो अपलोड करें जिसमें आपका चेहरा दिखे। ग्रुप फोटो, भारी फ़िल्टर वाली छवियां या धूप के चश्मे वाली फोटो से बचें।'
    },
    keywords: ['photo', 'image', 'picture', 'upload', 'guidelines', 'फोटो']
  },
  {
    id: 'photo-verification',
    category: 'verification',
    priority: 31,
    question: {
      en: 'What is photo verification?',
      hi: 'फोटो सत्यापन क्या है?'
    },
    answer: {
      en: 'Photo verification uses AI to match your selfie with your profile photos, confirming you are who you say you are. Verified profiles get a badge and higher visibility.',
      hi: 'फोटो सत्यापन AI का उपयोग करके आपकी सेल्फी को प्रोफाइल फोटो से मिलाता है। सत्यापित प्रोफाइल को बैज और उच्च दृश्यता मिलती है।'
    },
    keywords: ['photo verification', 'selfie', 'AI', 'badge', 'verify', 'फोटो सत्यापन']
  },
  {
    id: 'trust-levels',
    category: 'verification',
    priority: 32,
    question: {
      en: 'What are Trust Levels?',
      hi: 'ट्रस्ट लेवल क्या हैं?'
    },
    answer: {
      en: 'Trust Levels (1-5) indicate profile authenticity. Higher levels mean more verifications completed (email, phone, ID, photo, video). Higher trust levels get better visibility and more responses.',
      hi: 'ट्रस्ट लेवल (1-5) प्रोफाइल प्रामाणिकता दर्शाते हैं। उच्च स्तर का मतलब है अधिक सत्यापन पूर्ण। उच्च ट्रस्ट लेवल को बेहतर दृश्यता और अधिक प्रतिक्रियाएं मिलती हैं।'
    },
    keywords: ['trust', 'level', 'badge', 'authenticity', 'ट्रस्ट लेवल']
  },
  {
    id: 'readiness-badge',
    category: 'profile',
    priority: 33,
    question: {
      en: 'What is the Marriage Readiness Badge?',
      hi: 'विवाह तत्परता बैज क्या है?'
    },
    answer: {
      en: 'Complete the Marriage Readiness Assessment to get this badge. It shows you have seriously thought about marriage aspects like timeline, expectations, family involvement, and lifestyle.',
      hi: 'यह बैज पाने के लिए विवाह तत्परता मूल्यांकन पूरा करें। यह दर्शाता है कि आपने विवाह के पहलुओं जैसे समयसीमा, अपेक्षाएं आदि पर गंभीरता से विचार किया है।'
    },
    keywords: ['readiness', 'badge', 'assessment', 'marriage', 'तत्परता', 'बैज']
  },
  // Privacy & Security (Priority 40-50)
  {
    id: 'profile-visibility',
    category: 'privacy',
    priority: 40,
    question: {
      en: 'Who can see my profile?',
      hi: 'मेरी प्रोफाइल कौन देख सकता है?'
    },
    answer: {
      en: 'Only verified members of the opposite gender can see your profile. Blocked users and those you have declined cannot view your profile. Your contact details are hidden until you approve a request.',
      hi: 'केवल विपरीत लिंग के सत्यापित सदस्य आपकी प्रोफाइल देख सकते हैं। ब्लॉक किए गए और अस्वीकृत उपयोगकर्ता आपकी प्रोफाइल नहीं देख सकते। अनुरोध स्वीकृत होने तक संपर्क विवरण छिपे रहते हैं।'
    },
    keywords: ['visibility', 'privacy', 'who can see', 'hidden', 'दृश्यता', 'गोपनीयता']
  },
  {
    id: 'hide-profile',
    category: 'privacy',
    priority: 41,
    question: {
      en: 'Can I temporarily hide my profile?',
      hi: 'क्या मैं अपनी प्रोफाइल अस्थायी रूप से छिपा सकता हूं?'
    },
    answer: {
      en: 'Yes, go to Settings > Preferences and toggle "Hide Profile". Your profile will be invisible to others but your data remains saved. Toggle it back when ready to be visible again.',
      hi: 'हां, सेटिंग्स > प्राथमिकताएं पर जाएं और "प्रोफाइल छिपाएं" टॉगल करें। आपकी प्रोफाइल दूसरों को दिखाई नहीं देगी लेकिन डेटा सहेजा रहेगा।'
    },
    keywords: ['hide', 'invisible', 'temporary', 'pause', 'छिपाएं']
  },
  {
    id: 'delete-account',
    category: 'privacy',
    priority: 42,
    question: {
      en: 'How do I delete my account?',
      hi: 'मैं अपना खाता कैसे हटाऊं?'
    },
    answer: {
      en: 'Go to Settings > Preferences and scroll to the bottom. Click "Delete Account" and confirm. This action is permanent - all your data, matches, and conversations will be deleted.',
      hi: 'सेटिंग्स > प्राथमिकताएं पर जाएं और नीचे स्क्रॉल करें। "खाता हटाएं" क्लिक करें और पुष्टि करें। यह कार्रवाई स्थायी है - सभी डेटा, मैच और बातचीत हटा दी जाएंगी।'
    },
    keywords: ['delete', 'remove', 'account', 'permanent', 'हटाएं', 'खाता']
  },
  // Membership (Priority 50-60)
  {
    id: 'premium-benefits',
    category: 'membership',
    priority: 50,
    question: {
      en: 'What are the benefits of premium membership?',
      hi: 'प्रीमियम सदस्यता के लाभ क्या हैं?'
    },
    answer: {
      en: 'Premium members get unlimited contact requests, see who viewed their profile, priority in search results, advanced filters, and access to detailed compatibility scores.',
      hi: 'प्रीमियम सदस्यों को असीमित संपर्क अनुरोध, प्रोफाइल देखने वालों की जानकारी, खोज परिणामों में प्राथमिकता, उन्नत फ़िल्टर और विस्तृत संगतता स्कोर मिलते हैं।'
    },
    keywords: ['premium', 'membership', 'benefits', 'upgrade', 'paid', 'प्रीमियम', 'सदस्यता']
  },
  {
    id: 'free-features',
    category: 'membership',
    priority: 51,
    question: {
      en: 'What can I do with a free account?',
      hi: 'मुफ्त खाते से मैं क्या कर सकता हूं?'
    },
    answer: {
      en: 'Free members can create profiles, browse matches, send limited interests per day, use basic filters, and chat with mutual matches. Upgrade for unlimited features.',
      hi: 'मुफ्त सदस्य प्रोफाइल बना सकते हैं, मैच ब्राउज़ कर सकते हैं, प्रति दिन सीमित रुचियां भेज सकते हैं, बेसिक फ़िल्टर उपयोग कर सकते हैं और म्यूचुअल मैच के साथ चैट कर सकते हैं।'
    },
    keywords: ['free', 'basic', 'account', 'features', 'मुफ्त']
  },
  // Technical (Priority 60-70)
  {
    id: 'biodata-generator',
    category: 'technical',
    priority: 60,
    question: {
      en: 'How do I generate my biodata PDF?',
      hi: 'मैं अपना बायोडाटा PDF कैसे बनाऊं?'
    },
    answer: {
      en: 'Go to My Profile and click "Generate Biodata". Choose a template and customize colors. The PDF can be downloaded and shared with family members or printed.',
      hi: 'माय प्रोफाइल पर जाएं और "बायोडाटा बनाएं" क्लिक करें। टेम्पलेट चुनें और रंग कस्टमाइज़ करें। PDF डाउनलोड करके परिवार के सदस्यों के साथ साझा या प्रिंट कर सकते हैं।'
    },
    keywords: ['biodata', 'PDF', 'generate', 'download', 'print', 'बायोडाटा']
  },
  {
    id: 'language-change',
    category: 'technical',
    priority: 61,
    question: {
      en: 'How do I change the language?',
      hi: 'मैं भाषा कैसे बदलूं?'
    },
    answer: {
      en: 'Click the language toggle (EN/हिं) in the top navigation bar to switch between English and Hindi. Your preference is saved automatically.',
      hi: 'अंग्रेजी और हिंदी के बीच स्विच करने के लिए शीर्ष नेविगेशन बार में भाषा टॉगल (EN/हिं) क्लिक करें। आपकी प्राथमिकता स्वचालित रूप से सहेजी जाती है।'
    },
    keywords: ['language', 'hindi', 'english', 'change', 'भाषा']
  },
  {
    id: 'notifications',
    category: 'technical',
    priority: 62,
    question: {
      en: 'How do I manage notifications?',
      hi: 'मैं नोटिफिकेशन कैसे प्रबंधित करूं?'
    },
    answer: {
      en: 'Go to Settings > Preferences to manage email and push notifications. You can choose to receive alerts for new interests, messages, profile views, and more.',
      hi: 'ईमेल और पुश नोटिफिकेशन प्रबंधित करने के लिए सेटिंग्स > प्राथमिकताएं पर जाएं। नई रुचियों, संदेशों, प्रोफाइल व्यू आदि के लिए अलर्ट प्राप्त करना चुन सकते हैं।'
    },
    keywords: ['notifications', 'alerts', 'email', 'push', 'नोटिफिकेशन']
  },
  {
    id: 'app-issues',
    category: 'technical',
    priority: 63,
    question: {
      en: 'The app is not working properly. What should I do?',
      hi: 'ऐप ठीक से काम नहीं कर रहा। मैं क्या करूं?'
    },
    answer: {
      en: 'Try refreshing the page, clearing browser cache, or using a different browser. If issues persist, contact support with screenshots of the error.',
      hi: 'पेज रिफ्रेश करें, ब्राउज़र कैश साफ़ करें, या अलग ब्राउज़र उपयोग करें। समस्या बनी रहे तो त्रुटि के स्क्रीनशॉट के साथ सहायता से संपर्क करें।'
    },
    keywords: ['problem', 'issue', 'not working', 'error', 'bug', 'समस्या']
  },
  {
    id: 'partner-preferences',
    category: 'matching',
    priority: 13,
    question: {
      en: 'How do I set my partner preferences?',
      hi: 'मैं अपनी पार्टनर प्राथमिकताएं कैसे सेट करूं?'
    },
    answer: {
      en: 'Go to Settings > Preferences tab. Here you can set criteria like age range, education, religion, location, occupation, and more. These are used by Smart Matching to find compatible profiles.',
      hi: 'सेटिंग्स > प्राथमिकताएं टैब पर जाएं। यहां आप आयु सीमा, शिक्षा, धर्म, स्थान, व्यवसाय आदि मानदंड सेट कर सकते हैं। स्मार्ट मैचिंग इन्हें संगत प्रोफाइल खोजने के लिए उपयोग करती है।'
    },
    keywords: ['partner', 'preferences', 'criteria', 'settings', 'पार्टनर', 'प्राथमिकताएं']
  },
  {
    id: 'shortlist',
    category: 'matching',
    priority: 14,
    question: {
      en: 'How do I shortlist profiles?',
      hi: 'मैं प्रोफाइल शॉर्टलिस्ट कैसे करूं?'
    },
    answer: {
      en: 'Click the bookmark icon on any profile card to add it to your shortlist. View all shortlisted profiles in the "My Activity" section under "Shortlisted" tab.',
      hi: 'किसी भी प्रोफाइल कार्ड पर बुकमार्क आइकन क्लिक करके शॉर्टलिस्ट में जोड़ें। "माय एक्टिविटी" में "शॉर्टलिस्ट" टैब में सभी शॉर्टलिस्ट प्रोफाइल देखें।'
    },
    keywords: ['shortlist', 'bookmark', 'save', 'favorite', 'शॉर्टलिस्ट']
  },
  {
    id: 'wedding-services',
    category: 'technical',
    priority: 64,
    question: {
      en: 'What wedding services are available?',
      hi: 'कौन सी विवाह सेवाएं उपलब्ध हैं?'
    },
    answer: {
      en: 'Browse our curated vendors for wedding planning, venues, catering, photography, makeup, and more in the "Wedding Services" section. Contact vendors directly through the platform.',
      hi: '"विवाह सेवाएं" अनुभाग में विवाह योजना, स्थान, कैटरिंग, फोटोग्राफी, मेकअप आदि के लिए हमारे चुनिंदा विक्रेता ब्राउज़ करें।'
    },
    keywords: ['wedding', 'services', 'vendors', 'planning', 'विवाह', 'सेवाएं']
  }
]

// Category labels for grouping
const CATEGORY_LABELS = {
  'getting-started': { en: '🚀 Getting Started', hi: '🚀 शुरू करना' },
  'profile': { en: '👤 Profile', hi: '👤 प्रोफाइल' },
  'matching': { en: '💕 Matching & Search', hi: '💕 मैचिंग और खोज' },
  'communication': { en: '💬 Communication', hi: '💬 संचार' },
  'verification': { en: '✓ Verification', hi: '✓ सत्यापन' },
  'privacy': { en: '🔒 Privacy & Security', hi: '🔒 गोपनीयता और सुरक्षा' },
  'membership': { en: '⭐ Membership', hi: '⭐ सदस्यता' },
  'technical': { en: '⚙️ Technical', hi: '⚙️ तकनीकी' }
}

interface SettingsProps {
  open: boolean
  onClose: () => void
  profileId: string
  language: Language
  currentProfile?: Profile
  onUpdateProfile?: (profile: Profile) => void
}

export function Settings({ open, onClose, profileId, language, currentProfile, onUpdateProfile }: SettingsProps) {
  const [preferences, setPreferences] = useKV<PartnerPreferenceData[]>('partnerPreferences', [])
  const [faqSearch, setFaqSearch] = useState('')
  
  // Get preferences from the legacy KV store OR from the profile's partnerPreferences
  const legacyPreference = preferences?.find(p => p.profileId === profileId)
  const profilePreference = currentProfile?.partnerPreferences
  
  const [formData, setFormData] = useState<Partial<PartnerPreferenceData>>({
    profileId,
    ageMin: undefined,
    ageMax: undefined,
    heightMin: '',
    heightMax: '',
  })

  // Sync form data when dialog opens - prioritize profile's partnerPreferences, fallback to legacy store
  useEffect(() => {
    if (open) {
      // First try to load from profile's partnerPreferences (set during registration)
      if (profilePreference) {
        setFormData({
          profileId,
          ageMin: profilePreference.ageMin,
          ageMax: profilePreference.ageMax,
          heightMin: profilePreference.heightMin || '',
          heightMax: profilePreference.heightMax || '',
          maritalStatus: profilePreference.maritalStatus,
          religion: profilePreference.religion,
          motherTongue: profilePreference.motherTongue,
          occupation: profilePreference.occupation,
          livingCountry: profilePreference.livingCountry,
          livingState: profilePreference.livingState,
          education: profilePreference.education,
          employmentStatus: profilePreference.employmentStatus,
          caste: profilePreference.caste,
          dietPreference: profilePreference.dietPreference,
          drinkingHabit: profilePreference.drinkingHabit,
          smokingHabit: profilePreference.smokingHabit,
          manglik: profilePreference.manglik,
          annualIncomeMin: profilePreference.annualIncomeMin,
          annualIncomeMax: profilePreference.annualIncomeMax,
        })
      } else if (legacyPreference) {
        // Fallback to legacy KV store if profile preferences not available
        setFormData(legacyPreference)
      } else {
        setFormData({
          profileId,
          ageMin: undefined,
          ageMax: undefined,
          heightMin: '',
          heightMax: '',
        })
      }
    }
  }, [open, profilePreference, legacyPreference, profileId])

  // Filter and sort FAQs based on search query
  const filteredFAQs = useMemo(() => {
    const searchLower = faqSearch.toLowerCase().trim()
    
    let faqs = [...FAQ_DATA]
    
    if (searchLower) {
      faqs = faqs.filter(faq => {
        const questionMatch = faq.question.en.toLowerCase().includes(searchLower) || 
                             faq.question.hi.toLowerCase().includes(searchLower)
        const answerMatch = faq.answer.en.toLowerCase().includes(searchLower) || 
                           faq.answer.hi.toLowerCase().includes(searchLower)
        const keywordMatch = faq.keywords.some(k => k.toLowerCase().includes(searchLower))
        return questionMatch || answerMatch || keywordMatch
      })
      
      // Boost priority for keyword matches
      faqs = faqs.map(faq => ({
        ...faq,
        _searchPriority: faq.keywords.some(k => k.toLowerCase().includes(searchLower)) ? faq.priority - 100 : faq.priority
      })).sort((a, b) => (a._searchPriority || a.priority) - (b._searchPriority || b.priority))
    } else {
      faqs = faqs.sort((a, b) => a.priority - b.priority)
    }
    
    return faqs
  }, [faqSearch])

  const t = {
    title: language === 'hi' ? 'सेटिंग्स' : 'Settings',
    partnerPreferences: language === 'hi' ? 'साथी प्राथमिकताएं' : 'Partner Preferences',
    contact: language === 'hi' ? 'संपर्क' : 'Contact',
    help: language === 'hi' ? 'सहायता' : 'Help',
    termsConditions: language === 'hi' ? 'नियम और शर्तें' : 'Terms & Conditions',
    safetyTips: language === 'hi' ? 'सुरक्षा सुझाव' : 'Safety Tips',
    save: language === 'hi' ? 'सहेजें' : 'Save',
    cancel: language === 'hi' ? 'रद्द करें' : 'Cancel',
    ageRange: language === 'hi' ? 'आयु सीमा' : 'Age Range',
    heightRange: language === 'hi' ? 'ऊंचाई सीमा' : 'Height Range',
    minAge: language === 'hi' ? 'न्यूनतम आयु' : 'Min Age',
    maxAge: language === 'hi' ? 'अधिकतम आयु' : 'Max Age',
    minHeight: language === 'hi' ? 'न्यूनतम ऊंचाई' : 'Min Height',
    maxHeight: language === 'hi' ? 'अधिकतम ऊंचाई' : 'Max Height',
    preferencesSaved: language === 'hi' ? 'प्राथमिकताएं सहेजी गईं' : 'Preferences saved',
    helpline: language === 'hi' ? 'हेल्पलाइन' : 'Helpline',
    email: language === 'hi' ? 'ईमेल' : 'Email',
    education: language === 'hi' ? 'शिक्षा' : 'Education',
    occupation: language === 'hi' ? 'व्यवसाय' : 'Occupation',
    caste: language === 'hi' ? 'जाति' : 'Caste',
    motherTongue: language === 'hi' ? 'मातृभाषा' : 'Mother Tongue',
    manglik: language === 'hi' ? 'मांगलिक' : 'Manglik',
    dietPreference: language === 'hi' ? 'आहार प्राथमिकता' : 'Diet Preference',
    drinkingHabit: language === 'hi' ? 'पेय आदत' : 'Drinking Habit',
    smokingHabit: language === 'hi' ? 'धूम्रपान आदत' : 'Smoking Habit',
    doesntMatter: language === 'hi' ? 'कोई फर्क नहीं' : "Doesn't Matter",
    yes: language === 'hi' ? 'हां' : 'Yes',
    no: language === 'hi' ? 'नहीं' : 'No',
    veg: language === 'hi' ? 'शाकाहारी' : 'Vegetarian',
    nonVeg: language === 'hi' ? 'मांसाहारी' : 'Non-Vegetarian',
    eggetarian: language === 'hi' ? 'अंडाहारी' : 'Eggetarian',
    never: language === 'hi' ? 'कभी नहीं' : 'Never',
    occasionally: language === 'hi' ? 'कभी-कभी' : 'Occasionally',
    regularly: language === 'hi' ? 'नियमित' : 'Regularly',
    maritalStatus: language === 'hi' ? 'वैवाहिक स्थिति' : 'Marital Status',
    religion: language === 'hi' ? 'धर्म' : 'Religion',
    livingCountry: language === 'hi' ? 'रहने वाला देश' : 'Living in Country',
    livingState: language === 'hi' ? 'रहने वाला राज्य' : 'Living in State',
    selectMultiple: '', // Removed per UX update
    selectAny: language === 'hi' ? 'चुनें' : 'Select',
    search: language === 'hi' ? 'खोजें...' : 'Search...',
    
    termsContent: language === 'hi' ? `
नियम और शर्तें

1. सामान्य नियम
- यह सेवा केवल वैवाहिक उद्देश्यों के लिए है।
- आपको 18 वर्ष (महिला) या 21 वर्ष (पुरुष) से अधिक आयु का होना चाहिए।
- प्रोफाइल में सभी जानकारी सत्य और सही होनी चाहिए।

2. गोपनीयता
- आपकी व्यक्तिगत जानकारी सुरक्षित रहेगी।
- संपर्क विवरण केवल स्वीकृत उपयोगकर्ताओं के साथ साझा किया जाएगा।
- आपके डेटा को तीसरे पक्ष को नहीं बेचा जाएगा।

3. सदस्यता
- सदस्यता शुल्क वापसी योग्य नहीं है।
- सदस्यता अवधि के दौरान सभी सुविधाएं उपलब्ध हैं।

4. प्रोफाइल सत्यापन
- सभी प्रोफाइल स्वयंसेवकों द्वारा सत्यापित किए जाते हैं।
- गलत या अपमानजनक प्रोफाइल को हटा दिया जाएगा।

5. दायित्व
- यह सेवा केवल परिचय प्रदान करती है।
- विवाह का निर्णय पूरी तरह से परिवारों का है।
- प्लेटफॉर्म किसी भी विवाद के लिए जिम्मेदार नहीं है।
    ` : `
Terms and Conditions

1. General Rules
- This service is for matrimonial purposes only.
- You must be 18+ (female) or 21+ (male) years of age.
- All information in profile must be true and accurate.

2. Privacy
- Your personal information will be kept secure.
- Contact details shared only with approved users.
- Your data will not be sold to third parties.

3. Membership
- Membership fees are non-refundable.
- All features available during membership period.

4. Profile Verification
- All profiles are verified by experienced professionals.
- False or offensive profiles will be removed.

5. Liability
- This service only provides introductions.
- Marriage decision is entirely of families.
- Platform not responsible for any disputes.
    `,

    safetyContent: language === 'hi' ? `
ऑनलाइन सुरक्षा सुझाव

1. व्यक्तिगत जानकारी सुरक्षित रखें
- अपना पूरा पता, वित्तीय जानकारी न दें।
- पहली मुलाकात से पहले बैंक विवरण साझा न करें।

2. पहली मुलाकात
- सार्वजनिक स्थान पर मिलें।
- परिवार या दोस्तों को बताएं कि आप कहां हैं।
- अपने वाहन में जाएं।

3. लाल झंडे पहचानें
- जो व्यक्ति पैसे मांगता है।
- जो वीडियो कॉल से बचता है।
- जो जल्दबाजी में विवाह करना चाहता है।

4. सत्यापन
- हमेशा सत्यापित प्रोफाइल से संपर्क करें।
- वीडियो कॉल पर मिलें।
- परिवार से मिलें।
- परिवार, व्यापार/सेवा स्थान, आय और आय के स्रोत की जानकारी प्राप्त करें।

5. रिपोर्ट करें
- संदिग्ध गतिविधि की रिपोर्ट करें।
- अनुचित संदेश ब्लॉक करें।
- हमारे स्वयंसेवकों से संपर्क करें।
    ` : `
Online Safety Tips

1. Keep Personal Information Safe
- Don't share full address, financial information.
- Don't share bank details before first meeting.

2. First Meeting
- Meet in public place.
- Tell family or friends where you are.
- Go in your own vehicle.

3. Recognize Red Flags
- Person who asks for money.
- Person who avoids video calls.
- Person who rushes marriage.

4. Verification
- Always contact verified profiles.
- Meet on video call.
- Meet the family.
- Verify family details, business/service place, income and source of income.

5. Report
- Report suspicious activity.
- Block inappropriate messages.
- Contact our experienced professionals.
    `
  }

  const handleSave = () => {
    // Update legacy KV store for backwards compatibility
    setPreferences(current => {
      const existing = current?.findIndex(p => p.profileId === profileId)
      if (existing !== undefined && existing >= 0) {
        const updated = [...(current || [])]
        updated[existing] = formData as PartnerPreferenceData
        return updated
      } else {
        return [...(current || []), formData as PartnerPreferenceData]
      }
    })
    
    // Also update the profile's partnerPreferences if callback is provided
    if (currentProfile && onUpdateProfile) {
      const updatedProfile: Profile = {
        ...currentProfile,
        partnerPreferences: {
          ageMin: formData.ageMin,
          ageMax: formData.ageMax,
          heightMin: formData.heightMin,
          heightMax: formData.heightMax,
          maritalStatus: formData.maritalStatus,
          religion: formData.religion,
          motherTongue: formData.motherTongue,
          occupation: formData.occupation,
          livingCountry: formData.livingCountry,
          livingState: formData.livingState,
          education: formData.education,
          employmentStatus: formData.employmentStatus,
          caste: formData.caste,
          dietPreference: formData.dietPreference,
          drinkingHabit: formData.drinkingHabit,
          smokingHabit: formData.smokingHabit,
          manglik: formData.manglik as 'yes' | 'no' | 'doesnt-matter' | undefined,
          annualIncomeMin: formData.annualIncomeMin,
          annualIncomeMax: formData.annualIncomeMax,
        }
      }
      onUpdateProfile(updatedProfile)
    }
    
    toast.success(t.preferencesSaved)
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <Gear size={28} weight="bold" />
            {t.title}
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="preferences" className="flex-1 flex flex-col min-h-0 mt-4">
          <TabsList className="grid w-full grid-cols-5 flex-shrink-0">
            <TabsTrigger value="preferences" className="text-xs md:text-sm">
              <Heart size={16} className="mr-1" />
              {language === 'hi' ? 'प्राथमिकता' : 'Preferences'}
            </TabsTrigger>
            <TabsTrigger value="contact" className="text-xs md:text-sm">
              <Phone size={16} className="mr-1" />
              {language === 'hi' ? 'संपर्क' : 'Contact'}
            </TabsTrigger>
            <TabsTrigger value="help" className="text-xs md:text-sm">
              <Info size={16} className="mr-1" />
              {language === 'hi' ? 'सहायता' : 'Help'}
            </TabsTrigger>
            <TabsTrigger value="terms" className="text-xs md:text-sm">
              <FileText size={16} className="mr-1" />
              {language === 'hi' ? 'नियम' : 'T&C'}
            </TabsTrigger>
            <TabsTrigger value="safety" className="text-xs md:text-sm">
              <ShieldCheck size={16} className="mr-1" />
              {language === 'hi' ? 'सुरक्षा' : 'Safety'}
            </TabsTrigger>
          </TabsList>

          <div className="flex-1 overflow-y-auto min-h-0 mt-4">
            <TabsContent value="preferences" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>{t.partnerPreferences}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Age Range */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>{t.minAge}</Label>
                      <Input
                        type="number"
                        placeholder={t.minAge}
                        value={formData.ageMin || ''}
                        onChange={(e) => setFormData({ ...formData, ageMin: parseInt(e.target.value) || undefined })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>{t.maxAge}</Label>
                      <Input
                        type="number"
                        placeholder={t.maxAge}
                        value={formData.ageMax || ''}
                        onChange={(e) => setFormData({ ...formData, ageMax: parseInt(e.target.value) || undefined })}
                      />
                    </div>
                  </div>

                  {/* Height Range */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>{t.minHeight}</Label>
                      <Input
                        placeholder={t.minHeight}
                        value={formData.heightMin || ''}
                        onChange={(e) => setFormData({ ...formData, heightMin: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>{t.maxHeight}</Label>
                      <Input
                        placeholder={t.maxHeight}
                        value={formData.heightMax || ''}
                        onChange={(e) => setFormData({ ...formData, heightMax: e.target.value })}
                      />
                    </div>
                  </div>

                  <Separator />

                  {/* Marital Status & Religion - Multi-select */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>{t.maritalStatus} {t.selectMultiple}</Label>
                      <MultiSelect
                        options={MARITAL_STATUS_OPTIONS}
                        value={formData.maritalStatus || []}
                        onValueChange={(v) => setFormData({ ...formData, maritalStatus: v as MaritalStatus[] })}
                        placeholder={t.selectAny}
                        searchPlaceholder={t.search}
                        showAnyOption
                        anyOptionLabel={language === 'hi' ? 'कोई भी / कोई प्राथमिकता नहीं' : 'Any / No Preference'}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>{t.religion} {t.selectMultiple}</Label>
                      <MultiSelect
                        options={RELIGION_OPTIONS}
                        value={formData.religion || []}
                        onValueChange={(v) => setFormData({ ...formData, religion: v })}
                        placeholder={t.selectAny}
                        searchPlaceholder={t.search}
                        showAnyOption
                        anyOptionLabel={language === 'hi' ? 'कोई भी / कोई प्राथमिकता नहीं' : 'Any / No Preference'}
                      />
                    </div>
                  </div>

                  {/* Mother Tongue - Multi-select */}
                  <div className="space-y-2">
                    <Label>{t.motherTongue} {t.selectMultiple}</Label>
                    <MultiSelect
                      options={MOTHER_TONGUE_OPTIONS}
                      value={formData.motherTongue || []}
                      onValueChange={(v) => setFormData({ ...formData, motherTongue: v })}
                      placeholder={t.selectAny}
                      searchPlaceholder={t.search}
                      showAnyOption
                      anyOptionLabel={language === 'hi' ? 'कोई भी / कोई प्राथमिकता नहीं' : 'Any / No Preference'}
                    />
                  </div>

                  {/* Occupation - Multi-select */}
                  <div className="space-y-2">
                    <Label>{t.occupation} {t.selectMultiple}</Label>
                    <MultiSelect
                      options={OCCUPATION_PROFESSION_OPTIONS}
                      value={formData.occupation || []}
                      onValueChange={(v) => setFormData({ ...formData, occupation: v })}
                      placeholder={t.selectAny}
                      searchPlaceholder={t.search}
                      showAnyOption
                      anyOptionLabel={language === 'hi' ? 'कोई भी / कोई प्राथमिकता नहीं' : 'Any / No Preference'}
                    />
                  </div>

                  {/* Living Country & State - Multi-select */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>{t.livingCountry} {t.selectMultiple}</Label>
                      <MultiSelect
                        options={COUNTRY_OPTIONS}
                        value={formData.livingCountry || []}
                        onValueChange={(v) => {
                          setFormData({ ...formData, livingCountry: v })
                          // Handle 'any' selection - also set state to 'any'
                          if (v.length === 1 && v[0] === 'any') {
                            setFormData(prev => ({ ...prev, livingCountry: v, livingState: ['any'] }))
                          } else {
                            // Clear states that are no longer valid
                            const validStates = getStateOptionsForCountries(v).map(s => s.value)
                            const updatedStates = (formData.livingState || []).filter(s => validStates.includes(s))
                            if (updatedStates.length !== (formData.livingState || []).length) {
                              setFormData(prev => ({ ...prev, livingCountry: v, livingState: updatedStates }))
                            }
                          }
                        }}
                        placeholder={t.selectAny}
                        searchPlaceholder={t.search}
                        showAnyOption
                        anyOptionLabel={language === 'hi' ? 'कोई भी / कोई प्राथमिकता नहीं' : 'Any / No Preference'}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>{t.livingState} {t.selectMultiple}</Label>
                      <MultiSelect
                        options={getStateOptionsForCountries(formData.livingCountry || [])}
                        value={formData.livingState || []}
                        onValueChange={(v) => setFormData({ ...formData, livingState: v })}
                        placeholder={t.selectAny}
                        searchPlaceholder={t.search}
                        disabled={!formData.livingCountry?.length || (formData.livingCountry?.length === 1 && formData.livingCountry[0] === 'any')}
                        showAnyOption
                        anyOptionLabel={language === 'hi' ? 'कोई भी / कोई प्राथमिकता नहीं' : 'Any / No Preference'}
                      />
                    </div>
                  </div>

                  <Separator />

                  {/* Education & Employment Status */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>{t.education} {t.selectMultiple}</Label>
                      <MultiSelect
                        options={EDUCATION_OPTIONS}
                        value={formData.education || []}
                        onValueChange={(v) => setFormData({ ...formData, education: v })}
                        placeholder={t.selectAny}
                        searchPlaceholder={t.search}
                        showAnyOption
                        anyOptionLabel={language === 'hi' ? 'कोई भी / कोई प्राथमिकता नहीं' : 'Any / No Preference'}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>{language === 'hi' ? 'रोजगार स्थिति' : 'Employment Status'} {t.selectMultiple}</Label>
                      <MultiSelect
                        options={EMPLOYMENT_STATUS_OPTIONS}
                        value={formData.employmentStatus || []}
                        onValueChange={(v) => setFormData({ ...formData, employmentStatus: v })}
                        placeholder={t.selectAny}
                        searchPlaceholder={t.search}
                        showAnyOption
                        anyOptionLabel={language === 'hi' ? 'कोई भी / कोई प्राथमिकता नहीं' : 'Any / No Preference'}
                      />
                    </div>
                  </div>

                  {/* Caste */}
                  <div className="space-y-2">
                    <Label>{t.caste}</Label>
                    <Input
                      placeholder={t.caste}
                      value={formData.caste?.join(', ') || ''}
                      onChange={(e) => setFormData({ ...formData, caste: e.target.value ? e.target.value.split(',').map(s => s.trim()) : [] })}
                    />
                    <p className="text-xs text-muted-foreground">{language === 'hi' ? 'अल्पविराम से अलग करें' : 'Separate with commas'}</p>
                  </div>

                  <Separator />

                  {/* Manglik */}
                  <div className="space-y-2">
                    <Label>{t.manglik}</Label>
                    <Select
                      value={formData.manglik || 'doesnt-matter'}
                      onValueChange={(value) => setFormData({ ...formData, manglik: value as 'yes' | 'no' | 'doesnt-matter' })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={t.manglik} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="doesnt-matter">{t.doesntMatter}</SelectItem>
                        <SelectItem value="yes">{t.yes}</SelectItem>
                        <SelectItem value="no">{t.no}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Diet Preference */}
                  <div className="space-y-2">
                    <Label>{t.dietPreference}</Label>
                    <MultiSelect
                      options={DIET_PREFERENCE_OPTIONS}
                      value={formData.dietPreference || []}
                      onValueChange={(v) => setFormData({ ...formData, dietPreference: v as DietPreference[] })}
                      placeholder={t.selectAny}
                      searchPlaceholder={t.search}
                      showAnyOption
                      anyOptionLabel={language === 'hi' ? 'कोई भी / कोई प्राथमिकता नहीं' : 'Any / No Preference'}
                    />
                  </div>

                  {/* Drinking Habit */}
                  <div className="space-y-2">
                    <Label>{t.drinkingHabit}</Label>
                    <MultiSelect
                      options={DRINKING_HABIT_OPTIONS}
                      value={formData.drinkingHabit || []}
                      onValueChange={(v) => setFormData({ ...formData, drinkingHabit: v as DrinkingHabit[] })}
                      placeholder={t.selectAny}
                      searchPlaceholder={t.search}
                      showAnyOption
                      anyOptionLabel={language === 'hi' ? 'कोई भी / कोई प्राथमिकता नहीं' : 'Any / No Preference'}
                    />
                  </div>

                  {/* Smoking Habit */}
                  <div className="space-y-2">
                    <Label>{t.smokingHabit}</Label>
                    <MultiSelect
                      options={SMOKING_HABIT_OPTIONS}
                      value={formData.smokingHabit || []}
                      onValueChange={(v) => setFormData({ ...formData, smokingHabit: v as SmokingHabit[] })}
                      placeholder={t.selectAny}
                      searchPlaceholder={t.search}
                      showAnyOption
                      anyOptionLabel={language === 'hi' ? 'कोई भी / कोई प्राथमिकता नहीं' : 'Any / No Preference'}
                    />
                  </div>

                  <Button onClick={handleSave} className="w-full">
                    {t.save}
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="contact" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>{t.contact}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">{t.helpline}</p>
                    <p className="font-medium">+91 98765 43210</p>
                  </div>
                  <Separator />
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">{t.email}</p>
                    <p className="font-medium">support@shaadipartnersearch.com</p>
                  </div>
                  <Separator />
                  <Alert>
                    <Info size={18} />
                    <AlertDescription>
                      {language === 'hi' 
                        ? 'हमारे अनुभवी पेशेवर सोमवार से शनिवार, सुबह 10 बजे से शाम 6 बजे तक उपलब्ध हैं।'
                        : 'Our experienced professionals are available Monday to Saturday, 10 AM to 6 PM.'}
                    </AlertDescription>
                  </Alert>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="help" className="space-y-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center justify-between">
                    <span>{t.help}</span>
                    <span className="text-xs font-normal text-muted-foreground">
                      {filteredFAQs.length} {language === 'hi' ? 'प्रश्न' : 'questions'}
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Search Bar */}
                  <div className="relative">
                    <MagnifyingGlass size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder={language === 'hi' ? 'प्रश्न खोजें...' : 'Search questions...'}
                      value={faqSearch}
                      onChange={(e) => setFaqSearch(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                  
                  {/* FAQ List */}
                  <div>
                    <h4 className="font-semibold mb-3 text-sm text-muted-foreground">
                      {language === 'hi' ? 'अक्सर पूछे जाने वाले प्रश्न' : 'Frequently Asked Questions'}
                    </h4>
                    <ScrollArea className="h-[320px] pr-4">
                      <div className="space-y-2 text-sm">
                        {filteredFAQs.length === 0 ? (
                          <div className="text-center py-8 text-muted-foreground">
                            <p>{language === 'hi' ? 'कोई प्रश्न नहीं मिला' : 'No questions found'}</p>
                            <p className="text-xs mt-1">
                              {language === 'hi' ? 'अलग खोज शब्द आज़माएं' : 'Try different search terms'}
                            </p>
                          </div>
                        ) : (
                          filteredFAQs.map((faq) => (
                            <details key={faq.id} className="p-3 rounded-lg bg-muted group">
                              <summary className="cursor-pointer font-medium flex items-start gap-2 list-none">
                                <span className="text-xs px-1.5 py-0.5 rounded bg-background text-muted-foreground mt-0.5">
                                  {CATEGORY_LABELS[faq.category][language === 'hi' ? 'hi' : 'en'].split(' ')[0]}
                                </span>
                                <span className="flex-1">{language === 'hi' ? faq.question.hi : faq.question.en}</span>
                                <span className="text-muted-foreground group-open:rotate-180 transition-transform">▼</span>
                              </summary>
                              <p className="mt-3 text-muted-foreground pl-8 pr-4 leading-relaxed">
                                {language === 'hi' ? faq.answer.hi : faq.answer.en}
                              </p>
                            </details>
                          ))
                        )}
                      </div>
                    </ScrollArea>
                  </div>
                  
                  {/* Quick Help */}
                  <div className="pt-2 border-t">
                    <p className="text-xs text-muted-foreground text-center">
                      {language === 'hi' 
                        ? 'और मदद चाहिए? संपर्क टैब से हमें संपर्क करें।'
                        : "Can't find what you need? Contact us through the Contact tab."}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="terms">
              <Card>
                <CardHeader>
                  <CardTitle>{t.termsConditions}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="prose prose-sm max-w-none">
                    <pre className="whitespace-pre-wrap font-sans text-sm">{t.termsContent}</pre>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="safety">
              <Card>
                <CardHeader>
                  <CardTitle>{t.safetyTips}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="prose prose-sm max-w-none">
                    <pre className="whitespace-pre-wrap font-sans text-sm">{t.safetyContent}</pre>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </div>
        </Tabs>

        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={onClose}>
            {t.cancel}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
