import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { FileText, Shield, User, Scales, Lock, Warning, Envelope, Handshake, CurrencyInr, Calendar, Trash, Eye, Heart, ChatCircle } from '@phosphor-icons/react'
import type { Language } from '@/lib/translations'

interface MembershipSettings {
  sixMonthPrice: number
  oneYearPrice: number
  sixMonthDuration: number
  oneYearDuration: number
  discountPercentage: number
  discountEnabled: boolean
  discountEndDate: string | null
  // Plan-specific limits
  freePlanChatLimit?: number
  freePlanContactLimit?: number
  sixMonthChatLimit?: number
  sixMonthContactLimit?: number
  oneYearChatLimit?: number
  oneYearContactLimit?: number
  // Request expiry settings
  requestExpiryDays?: number
  // Boost pack settings
  boostPackEnabled?: boolean
  boostPackInterestLimit?: number
  boostPackContactLimit?: number
  boostPackPrice?: number
}

interface TermsAndConditionsProps {
  open: boolean
  onClose: () => void
  language: Language
  membershipSettings?: MembershipSettings
}

export function TermsAndConditions({ open, onClose, language, membershipSettings }: TermsAndConditionsProps) {
  const isHindi = language === 'hi'
  
  // Dynamic pricing from membership settings
  const sixMonthPrice = membershipSettings?.sixMonthPrice || 500
  const oneYearPrice = membershipSettings?.oneYearPrice || 900
  
  // Dynamic plan limits from admin settings
  const freePlanChatLimit = membershipSettings?.freePlanChatLimit ?? 5
  const freePlanContactLimit = membershipSettings?.freePlanContactLimit ?? 0
  const sixMonthChatLimit = membershipSettings?.sixMonthChatLimit ?? 50
  const sixMonthContactLimit = membershipSettings?.sixMonthContactLimit ?? 20
  const oneYearChatLimit = membershipSettings?.oneYearChatLimit ?? 120
  const oneYearContactLimit = membershipSettings?.oneYearContactLimit ?? 50
  
  // Request expiry settings
  const requestExpiryDays = membershipSettings?.requestExpiryDays ?? 15
  
  // Boost pack settings
  const boostPackEnabled = membershipSettings?.boostPackEnabled ?? true
  const boostPackInterestLimit = membershipSettings?.boostPackInterestLimit ?? 10
  const boostPackContactLimit = membershipSettings?.boostPackContactLimit ?? 10
  const boostPackPrice = membershipSettings?.boostPackPrice ?? 100

  const sections = [
    {
      icon: <FileText size={24} weight="bold" className="text-primary" />,
      title: isHindi ? '1. परिचय और स्वीकृति' : '1. Introduction and Acceptance',
      content: isHindi 
        ? `ShaadiPartnerSearch ("हम", "हमारा", या "सेवा") एक ऑनलाइन मैट्रिमोनी प्लेटफॉर्म है जो भारत और विदेश में रहने वाले भारतीय मूल के व्यक्तियों को जीवनसाथी खोजने में सहायता प्रदान करता है।

इस वेबसाइट या मोबाइल एप्लिकेशन का उपयोग करके, आप इन नियमों और शर्तों को स्वीकार करते हैं। यदि आप इन शर्तों से सहमत नहीं हैं, तो कृपया हमारी सेवाओं का उपयोग न करें।

ये नियम और शर्तें भारतीय कानून के अनुसार बनाई गई हैं और भारतीय न्यायालयों के अधिकार क्षेत्र में आती हैं।`
        : `ShaadiPartnerSearch ("we", "our", or "Service") is an online matrimonial platform that assists individuals of Indian origin residing in India and abroad to find life partners.

By using this website or mobile application, you accept these Terms and Conditions. If you do not agree to these terms, please do not use our services.

These Terms and Conditions are governed by Indian law and are subject to the jurisdiction of Indian courts.`
    },
    {
      icon: <User size={24} weight="bold" className="text-primary" />,
      title: isHindi ? '2. पात्रता मानदंड' : '2. Eligibility Criteria',
      content: isHindi
        ? `हमारी सेवाओं का उपयोग करने के लिए, आपको निम्नलिखित मानदंडों को पूरा करना होगा:

• आयु: पुरुष के लिए न्यूनतम 21 वर्ष और महिला के लिए न्यूनतम 18 वर्ष (भारतीय विवाह कानूनों के अनुसार)
• वैवाहिक स्थिति: अविवाहित, तलाकशुदा, या विधवा/विधुर
• पहचान: वैध भारतीय नागरिक या भारतीय मूल का व्यक्ति (OCI/PIO)
• मानसिक स्थिति: मानसिक रूप से स्वस्थ और विवाह के लिए सक्षम
• कानूनी: किसी भी आपराधिक मामले में वांछित नहीं होना चाहिए

नाबालिगों या पहले से विवाहित व्यक्तियों द्वारा पंजीकरण कानूनन अपराध है।`
        : `To use our services, you must meet the following criteria:

• Age: Minimum 21 years for males and 18 years for females (as per Indian Marriage Laws)
• Marital Status: Single, Divorced, or Widowed
• Identity: Valid Indian citizen or Person of Indian Origin (OCI/PIO)
• Mental Capacity: Mentally sound and capable of marriage
• Legal: Must not be wanted in any criminal case

Registration by minors or already married individuals is a punishable offense.`
    },
    {
      icon: <Scales size={24} weight="bold" className="text-primary" />,
      title: isHindi ? '3. उपयोगकर्ता की जिम्मेदारियां' : '3. User Responsibilities',
      content: isHindi
        ? `उपयोगकर्ता के रूप में, आप निम्नलिखित के लिए जिम्मेदार हैं:

• सटीक जानकारी: सभी व्यक्तिगत जानकारी सत्य और सटीक प्रदान करना
• अपडेट: किसी भी परिवर्तन की स्थिति में प्रोफाइल अपडेट करना
• गोपनीयता: अपने लॉगिन क्रेडेंशियल्स को सुरक्षित रखना
• सम्मानजनक व्यवहार: अन्य उपयोगकर्ताओं के साथ सम्मानजनक और शालीन व्यवहार करना
• रिपोर्टिंग: किसी भी संदिग्ध या अनुचित गतिविधि की रिपोर्ट करना

निषिद्ध गतिविधियां:
• झूठी या भ्रामक जानकारी प्रदान करना
• किसी अन्य व्यक्ति की पहचान का उपयोग करना
• अश्लील या आपत्तिजनक सामग्री साझा करना
• उत्पीड़न, धमकी या अपमानजनक संदेश भेजना
• वाणिज्यिक प्रचार या स्पैम
• प्लेटफॉर्म को हैक करने या नुकसान पहुंचाने का प्रयास`
        : `As a user, you are responsible for:

• Accurate Information: Providing true and accurate personal information
• Updates: Updating your profile in case of any changes
• Confidentiality: Keeping your login credentials secure
• Respectful Behavior: Treating other users with respect and decency
• Reporting: Reporting any suspicious or inappropriate activity

Prohibited Activities:
• Providing false or misleading information
• Using another person's identity
• Sharing obscene or objectionable content
• Sending harassment, threatening, or abusive messages
• Commercial promotion or spam
• Attempting to hack or damage the platform`
    },
    {
      icon: <Lock size={24} weight="bold" className="text-primary" />,
      title: isHindi ? '4. डेटा गोपनीयता और सुरक्षा' : '4. Data Privacy and Security',
      content: isHindi
        ? `हम आपकी गोपनीयता को गंभीरता से लेते हैं और डिजिटल पर्सनल डेटा प्रोटेक्शन एक्ट, 2023 (DPDP Act) के अनुसार काम करते हैं।

डेटा संग्रह:
• व्यक्तिगत जानकारी: नाम, आयु, संपर्क विवरण, शैक्षिक और व्यावसायिक जानकारी
• फोटो: प्रोफाइल फोटो और सेल्फी सत्यापन के लिए
• स्थान: पंजीकरण के समय भौगोलिक स्थान (सत्यापन के लिए)

डेटा का उपयोग:
• मैचमेकिंग और प्रोफाइल मिलान के लिए
• सत्यापन और धोखाधड़ी रोकथाम के लिए
• संचार और ग्राहक सहायता के लिए

डेटा सुरक्षा:
• सभी डेटा एन्क्रिप्टेड स्टोरेज में रखा जाता है
• Azure के सुरक्षित क्लाउड इंफ्रास्ट्रक्चर का उपयोग
• नियमित सुरक्षा ऑडिट

आपके अधिकार:
• डेटा एक्सेस का अधिकार
• डेटा सुधार का अधिकार
• डेटा विलोपन का अधिकार ("भूल जाने का अधिकार")
• डेटा पोर्टेबिलिटी का अधिकार`
        : `We take your privacy seriously and operate in accordance with the Digital Personal Data Protection Act, 2023 (DPDP Act).

Data Collection:
• Personal Information: Name, age, contact details, educational and professional information
• Photos: Profile photos and selfie for verification
• Location: Geographical location during registration (for verification)

Data Usage:
• For matchmaking and profile matching
• For verification and fraud prevention
• For communication and customer support

Data Security:
• All data is stored in encrypted storage
• Use of Azure's secure cloud infrastructure
• Regular security audits

Your Rights:
• Right to data access
• Right to data correction
• Right to data deletion ("Right to be forgotten")
• Right to data portability`
    },
    {
      icon: <CurrencyInr size={24} weight="bold" className="text-primary" />,
      title: isHindi ? '5. सदस्यता और भुगतान' : '5. Membership and Payment',
      content: isHindi
        ? `सदस्यता योजनाएं:

मुफ्त योजना (6 महीने परिचयात्मक):
• प्रोफाइल बनाना और देखना
• बायोडेटा जनरेशन (वॉटरमार्क के साथ)
• वेडिंग सर्विसेज एक्सेस नहीं
• सीमित संपर्क सुविधाएं

6 महीने की योजना (₹${sixMonthPrice}):
• असीमित प्रोफाइल देखना
• संपर्क विवरण एक्सेस
• बायोडेटा जनरेशन (बिना वॉटरमार्क)
• वेडिंग सर्विसेज एक्सेस
• विवाह तैयारी मूल्यांकन (AI-संचालित)

1 साल की योजना (₹${oneYearPrice}):
• सभी 6 महीने की सुविधाएं
• प्राथमिकता सहायता
• प्रोफाइल हाइलाइट

भुगतान नीति:
• सभी भुगतान अग्रिम हैं
• UPI, नेट बैंकिंग, डेबिट/क्रेडिट कार्ड स्वीकार्य
• सभी शुल्क 18% GST सहित

रिफंड नीति:
• प्रोफाइल अस्वीकृति पर पूर्ण रिफंड
• स्वैच्छिक रद्दीकरण पर कोई रिफंड नहीं
• रिफंड 7-10 कार्य दिवसों में प्रोसेस होगा`
        : `Membership Plans:

Free Plan (6 months introductory):
• Create and view profiles
• Biodata generation (with watermark)
• No Wedding Services access
• Limited contact features

6 Month Plan (₹${sixMonthPrice}):
• Unlimited profile viewing
• Contact details access
• Biodata generation (without watermark)
• Wedding Services access
• Marriage Readiness Assessment (AI-powered)

1 Year Plan (₹${oneYearPrice}):
• All 6-month features
• Priority support
• Profile highlight

Payment Policy:
• All payments are advance
• UPI, Net Banking, Debit/Credit Cards accepted
• All charges include 18% GST

Refund Policy:
• Full refund on profile rejection
• No refund on voluntary cancellation
• Refunds processed within 7-10 business days`
    },
    {
      icon: <Heart size={24} weight="bold" className="text-primary" />,
      title: isHindi ? '6. रुचि और संपर्क अनुरोध' : '6. Interest and Contact Requests',
      content: isHindi
        ? `रुचि अनुरोध (Interest Request):

कैसे काम करता है:
• रुचि भेजने वाला: अपनी रुचि व्यक्त करता है
• रुचि प्राप्तकर्ता: स्वीकार या अस्वीकार कर सकता है
• स्वीकृति पर: भेजने वाले का 1 चैट स्लॉट उपयोग होता है (प्राप्तकर्ता का नहीं)

महत्वपूर्ण नियम:
• लंबित अनुरोध: भेजने वाला कभी भी रद्द कर सकता है (कोई स्लॉट प्रभाव नहीं)
• स्वीकृत अनुरोध: दोनों पक्ष कभी भी वापस ले सकते हैं (स्लॉट वापस नहीं होगा - उपभोग हो चुका है)

संपर्क अनुरोध (Contact Request):

पूर्व-शर्त:
• संपर्क अनुरोध भेजने पर स्वचालित रूप से रुचि अनुरोध भी भेजा जाता है
• संपर्क स्वीकार करने से पहले रुचि स्वीकृत होनी चाहिए

संपर्क दृश्यता (एक-तरफ़ा):
• यदि A ने B को संपर्क अनुरोध भेजा और B ने स्वीकार किया:
  - A को B का संपर्क दिखाई देगा
  - B को A का संपर्क नहीं दिखेगा (जब तक B भी अनुरोध न भेजे)
• संपर्क दृश्यता अनुरोध के आधार पर एक-तरफ़ा है

स्लॉट उपयोग:
• संपर्क स्वीकृति पर: दोनों पक्षों का 1-1 संपर्क स्लॉट उपयोग होता है
• (भेजने वाले का भी और प्राप्तकर्ता का भी)

रद्द करना और वापस लेना:
• लंबित संपर्क: भेजने वाला रद्द कर सकता है (कोई स्लॉट प्रभाव नहीं)
• स्वीकृत संपर्क: दोनों पक्ष वापस ले सकते हैं (स्लॉट वापस नहीं होगा - उपभोग हो चुका है)

स्वचालित अस्वीकृति नियम:
• यदि B ने A की रुचि अस्वीकार की: A का लंबित संपर्क अनुरोध भी स्वचालित रूप से अस्वीकृत हो जाएगा
• यह सुनिश्चित करता है कि रुचि अस्वीकृति पूर्ण अस्वीकृति है

ब्लॉक नियम:
• ब्लॉक करने पर: प्रोफाइल आपके मैच में दिखाई नहीं देगी
• ब्लॉक करने पर सभी लंबित अनुरोध भी अस्वीकृत हो जाएंगे
• एडमिन को ब्लॉक की गिनती दिखाई देती है

पुनर्विचार (Undo/Reconsider):
• अस्वीकृत/ब्लॉक की गई प्रोफाइल को पुनर्विचार किया जा सकता है
• "पुनर्विचार" बटन से आप प्रोफाइल को फिर से देख सकते हैं
• अनब्लॉक करने पर प्रोफाइल फिर से मैच में दिखेगी

अस्वीकृति संकेतक:
• "आपने अस्वीकार किया" - आपने इस प्रोफाइल को अस्वीकार किया
• "उन्होंने अस्वीकार किया" - उन्होंने आपको अस्वीकार किया
• ब्लॉक प्रोफाइल बिल्कुल नहीं दिखेंगी

चैट सीमा योजना के अनुसार:
• मुफ्त योजना: ${freePlanChatLimit} चैट प्रोफाइल
• 6 महीने: ${sixMonthChatLimit} चैट प्रोफाइल
• 1 साल: ${oneYearChatLimit} चैट प्रोफाइल

संपर्क सीमा योजना के अनुसार:
• मुफ्त योजना: ${freePlanContactLimit} संपर्क ${freePlanContactLimit === 0 ? '(उपलब्ध नहीं)' : ''}
• 6 महीने: ${sixMonthContactLimit} संपर्क
• 1 साल: ${oneYearContactLimit} संपर्क

अनुरोध समाप्ति नीति:
• सभी पेंडिंग रुचि और संपर्क अनुरोध ${requestExpiryDays} दिनों बाद स्वतः समाप्त हो जाते हैं
• पारदर्शिता के लिए प्रत्येक पेंडिंग अनुरोध पर काउंटडाउन टाइमर दिखाया जाता है
• अनुरोध समाप्त होने पर भेजने वाले को स्वचालित सूचना
• समाप्त अनुरोध कोई स्लॉट नहीं लेते

${boostPackEnabled ? `बूस्ट पैक (अतिरिक्त अनुरोध):
• जब आपकी योजना की सीमा समाप्त हो जाए, आप बूस्ट पैक खरीद सकते हैं
• प्रत्येक बूस्ट पैक में: ${boostPackInterestLimit} रुचि अनुरोध + ${boostPackContactLimit} संपर्क अनुरोध
• कीमत: ₹${boostPackPrice} प्रति बूस्ट पैक
• भुगतान: UPI/बैंक ट्रांसफर के बाद स्क्रीनशॉट अपलोड करें
• एडमिन सत्यापन के बाद क्रेडिट जोड़े जाएंगे (आमतौर पर 24 घंटे के भीतर)
• बूस्ट पैक खरीद गैर-वापसी योग्य है` : ''}`
        : `Interest Request:

How it works:
• Sender: Expresses interest in a profile
• Receiver: Can accept or decline the interest
• On acceptance: Sender's 1 chat slot is used (not receiver's)

Important Rules:
• Pending request: Sender can cancel anytime (no slot impact)
• Accepted request: Either party can revoke anytime (slot NOT refunded - consumed permanently)

Contact Request:

Pre-condition:
• Sending contact request automatically sends interest request too
• Interest must be accepted before contact can be approved

Contact Visibility (One-Way):
• If A sends contact request to B and B accepts:
  - A can view B's contact details
  - B cannot view A's contact (unless B also sends a request)
• Contact visibility is one-way based on who requested

Slot Usage:
• On contact approval: BOTH parties use 1 contact slot each
• (Both sender's and receiver's slots are consumed)

Cancellation and Revocation:
• Pending contact: Sender can cancel (no slot impact)
• Approved contact: Either party can revoke (slots NOT refunded - consumed permanently)

Auto-Decline Rules:
• If B declines A's interest: A's pending contact request is also auto-declined
• This ensures interest decline means complete rejection

Block Rules:
• When you block someone: Their profile won't appear in your matches
• Blocking also declines all pending requests from that profile
• Admin can see block counts for each profile

Reconsider (Undo):
• Declined/blocked profiles can be reconsidered later
• Use "Reconsider" button to restore profile visibility
• Unblocking will make the profile visible in matches again

Declined Status Indicators:
• "Declined by me" - You declined this profile
• "Declined by them" - They declined your request
• Blocked profiles are completely hidden from matches

Chat Limits by Plan:
• Free plan: ${freePlanChatLimit} chat profiles
• 6 months: ${sixMonthChatLimit} chat profiles
• 1 year: ${oneYearChatLimit} chat profiles

Contact Limits by Plan:
• Free plan: ${freePlanContactLimit} contacts ${freePlanContactLimit === 0 ? '(not available)' : ''}
• 6 months: ${sixMonthContactLimit} contacts
• 1 year: ${oneYearContactLimit} contacts

Request Expiry Policy:
• All pending interest and contact requests auto-expire after ${requestExpiryDays} days
• Countdown timer shown on each pending request for transparency
• Sender notified automatically when request expires
• Expired requests do not consume any slots

${boostPackEnabled ? `Boost Pack (Additional Requests):
• When you exhaust your plan limits, you can purchase a Boost Pack
• Each Boost Pack includes: ${boostPackInterestLimit} interest requests + ${boostPackContactLimit} contact requests
• Price: ₹${boostPackPrice} per Boost Pack
• Payment: Upload screenshot after UPI/bank transfer
• Credits added after admin verification (usually within 24 hours)
• Boost Pack purchases are non-refundable` : ''}`
    },
    {
      icon: <Calendar size={24} weight="bold" className="text-primary" />,
      title: isHindi ? '7. सदस्यता समाप्ति और नवीनीकरण' : '7. Membership Expiry and Renewal',
      content: isHindi
        ? `सदस्यता समाप्ति:
• सदस्यता समाप्ति से 7 दिन पहले दैनिक रिमाइंडर भेजे जाएंगे
• समाप्ति के बाद, आपकी प्रोफाइल निष्क्रिय हो जाएगी
• निष्क्रिय प्रोफाइल पर: चैट, संपर्क, फोटो, बायो धुंधले हो जाएंगे

नवीनीकरण:
• समय पर नवीनीकरण करने पर सभी सुविधाएं जारी रहेंगी
• नवीनीकरण विलंब पर डेटा 90 दिनों तक सुरक्षित रहेगा
• 90 दिनों के बाद, प्रोफाइल स्वतः हटाई जा सकती है

ग्रेस पीरियड:
• समाप्ति के बाद 7 दिन का ग्रेस पीरियड
• ग्रेस पीरियड में नवीनीकरण पर कोई अतिरिक्त शुल्क नहीं`
        : `Membership Expiry:
• Daily reminders will be sent 7 days before membership expiry
• After expiry, your profile will become inactive
• On inactive profile: Chat, Contact, Photos, Bio will be blurred

Renewal:
• On-time renewal keeps all features active
• Data remains secure for 90 days on delayed renewal
• After 90 days, profile may be automatically deleted

Grace Period:
• 7-day grace period after expiry
• No extra charges for renewal during grace period`
    },
    {
      icon: <Shield size={24} weight="bold" className="text-primary" />,
      title: isHindi ? '8. सत्यापन और सुरक्षा' : '8. Verification and Safety',
      content: isHindi
        ? `सत्यापन प्रक्रिया:
• सभी प्रोफाइल मैन्युअल समीक्षा से गुजरती हैं
• AI-आधारित फोटो सत्यापन
• लाइव सेल्फी मिलान
• संपर्क विवरण OTP सत्यापन

स्वयंसेवक सत्यापन (वैकल्पिक):
• परिवार की पृष्ठभूमि सत्यापन
• व्यवसाय/नौकरी सत्यापन
• आय सत्यापन (दस्तावेज़ के साथ)

सुरक्षा उपाय:
• संदिग्ध प्रोफाइल की रिपोर्टिंग सुविधा
• अनुचित व्यवहार पर तत्काल ब्लॉक
• गोपनीयता सेटिंग्स - ईमेल/फोन छुपाने का विकल्प

डिजिलॉकर/आधार सत्यापन:
• नाम और जन्म तिथि सत्यापन के लिए पहचान प्रमाण
• समर्थित दस्तावेज़: आधार, पैन कार्ड, ड्राइविंग लाइसेंस, पासपोर्ट
• व्यवस्थापक द्वारा मैन्युअल सत्यापन
• सत्यापित प्रोफाइल पर "डिजिलॉकर सत्यापित" बैज

अस्वीकरण:
• हम प्रोफाइल की 100% प्रामाणिकता की गारंटी नहीं दे सकते
• व्यक्तिगत मिलने से पहले उचित सावधानी बरतें
• वित्तीय लेनदेन से बचें`
        : `Verification Process:
• All profiles undergo manual review
• AI-based photo verification
• Live selfie matching
• Contact details OTP verification

DigiLocker/Aadhaar Verification:
• ID proof for name and date of birth verification
• Supported documents: Aadhaar, PAN Card, Driving License, Passport
• Manual verification by admin
• "DigiLocker Verified" badge on verified profiles

Enhanced Verification (Optional):
• Family background verification
• Business/Job verification
• Income verification (with documents)

Safety Measures:
• Suspicious profile reporting feature
• Immediate block on inappropriate behavior
• Privacy settings - Option to hide email/phone

Disclaimer:
• We cannot guarantee 100% authenticity of profiles
• Exercise due caution before meeting in person
• Avoid financial transactions`
    },
    {
      icon: <Trash size={24} weight="bold" className="text-primary" />,
      title: isHindi ? '9. प्रोफाइल निष्क्रियता और विलोपन' : '9. Profile Deactivation and Deletion',
      content: isHindi
        ? `प्रोफाइल निष्क्रियता:
• आप कभी भी अपनी प्रोफाइल निष्क्रिय कर सकते हैं
• निष्क्रिय प्रोफाइल खोज परिणामों में नहीं दिखेगी
• डेटा 90 दिनों तक सुरक्षित रहेगा

प्रोफाइल विलोपन:
• OTP सत्यापन के बाद प्रोफाइल हटाई जा सकती है (सॉफ्ट डिलीट)
• विलोपन के समय कारण बताना अनिवार्य है
• विलोपन के बाद आपकी प्रोफाइल अन्य उपयोगकर्ताओं को दिखाई नहीं देगी
• डेटा आंतरिक रिकॉर्ड के लिए सुरक्षित रहेगा

विलोपन कारण:
• शादी पार्टनर सर्च पर मैच मिला
• अन्य प्लेटफॉर्म पर मैच मिला
• पारंपरिक/पारिवारिक व्यवस्था से मैच
• विवाह में अभी रुचि नहीं
• कुछ समय के लिए विराम
• गोपनीयता/सुरक्षा चिंता
• पारिवारिक निर्णय
• तकनीकी समस्याएं
• सेवा से असंतुष्टि
• अन्य कारण

पार्टनर प्रोफाइल का संयुक्त विलोपन:
• यदि आपने इस प्लेटफॉर्म पर मैच पाया है, तो आप अपने पार्टनर की प्रोफाइल भी हटाने की सहमति दे सकते हैं
• दोनों पक्षों की सहमति आवश्यक है
• पहले विलोपन करने वाला सहमति देगा, फिर पार्टनर को सूचित किया जाएगा
• पार्टनर की सहमति मिलने पर दोनों प्रोफाइल सॉफ्ट डिलीट हो जाएंगी

व्यवस्थापक द्वारा निष्कासन:
• नियमों के उल्लंघन पर प्रोफाइल निलंबित की जा सकती है
• गंभीर उल्लंघन पर स्थायी प्रतिबंध
• निलंबित प्रोफाइल पर कोई रिफंड नहीं`
        : `Profile Deactivation:
• You can deactivate your profile anytime
• Deactivated profile won't appear in search results
• Data remains secure for 90 days

Profile Deletion:
• Profile can be deleted after OTP verification (soft delete)
• Providing a reason for deletion is mandatory
• After deletion, your profile won't be visible to other users
• Data is retained for internal records

Deletion Reasons:
• Found match on Shaadi Partner Search
• Found match on other platform
• Found match through traditional/family arrangement
• Not interested in marriage right now
• Taking a break
• Privacy/security concerns
• Family decision
• Technical issues
• Not satisfied with service
• Other reason

Joint Partner Profile Deletion:
• If you found a match on this platform, you can consent to delete your partner's profile too
• Mutual consent from both parties is required
• The person deleting first gives consent, then partner is notified
• Upon partner's consent, both profiles will be soft deleted

Admin Removal:
• Profile may be suspended for rule violations
• Permanent ban for serious violations
• No refund on suspended profiles`
    },
    {
      icon: <Heart size={24} weight="bold" className="text-primary" />,
      title: isHindi ? '10. सफलता की कहानियां और प्रशंसापत्र' : '10. Success Stories and Testimonials',
      content: isHindi
        ? `सफलता की कहानी कार्यक्रम:

जब आप इस प्लेटफॉर्म के माध्यम से अपना जीवनसाथी पाते हैं, तो आप प्रोफ़ाइल हटाते समय सफलता की कहानी साझा करने का विकल्प चुन सकते हैं।

व्यक्तिगत सहमति मॉडल:
• प्रत्येक व्यक्ति स्वतंत्र रूप से अपनी कहानी साझा कर सकता है
• आपके पार्टनर को सूचित नहीं किया जाएगा
• आपकी कहानी केवल आपकी सहमति के आधार पर प्रकाशित होगी
• आप तस्वीरों और नाम के उपयोग की अनुमति दे सकते हैं (वैकल्पिक)

प्रशंसापत्र (Testimonials):
• आप अपना अनुभव साझा कर सकते हैं (वैकल्पिक)
• एडमिन प्रकाशन से पहले प्रशंसापत्र की समीक्षा और संपादन कर सकता है
• अनुचित या आपत्तिजनक सामग्री अस्वीकार या संपादित की जाएगी
• संपादित प्रशंसापत्रों को चिह्नित किया जाएगा

प्रकाशन प्रक्रिया:
• आपकी कहानी एडमिन समीक्षा के लिए जमा होगी
• एडमिन प्रशंसापत्र को स्वीकृत, अस्वीकृत या संपादित कर सकता है
• स्वीकृति के बाद कहानी प्रकाशित होगी
• पार्टनर की सहमति आवश्यक नहीं है

गोपनीयता:
• प्रकाशित कहानियां केवल आपकी सहमति के अनुसार जानकारी दिखाएंगी
• आप कभी भी अपनी कहानी हटाने का अनुरोध कर सकते हैं
• हटाने का अनुरोध 7 कार्य दिवसों में प्रोसेस होगा`
        : `Success Story Program:

When you find your life partner through this platform, you can choose to share a success story when deleting your profile.

Individual Consent Model:
• Each individual can independently share their story
• Your partner will NOT be notified
• Your story will be published based on YOUR consent only
• You can optionally consent to use of photos and real name

Testimonials:
• You can share your experience (optional)
• Admin may review and edit testimonials before publishing
• Inappropriate or objectionable content will be rejected or edited
• Edited testimonials will be marked as such

Publishing Process:
• Your story will be submitted for admin review
• Admin can approve, reject, or edit testimonials
• Story will be published after approval
• Partner's consent is NOT required

Privacy:
• Published stories will only show information as per your consent
• You can request removal of your story anytime
• Removal requests processed within 7 business days`
    },
    {
      icon: <Warning size={24} weight="bold" className="text-primary" />,
      title: isHindi ? '11. दायित्व की सीमा' : '11. Limitation of Liability',
      content: isHindi
        ? `ShaadiPartnerSearch निम्नलिखित के लिए उत्तरदायी नहीं है:

• उपयोगकर्ताओं द्वारा प्रदान की गई गलत या भ्रामक जानकारी
• उपयोगकर्ताओं के बीच किसी भी विवाद या असहमति
• व्यक्तिगत मुलाकातों के परिणामस्वरूप होने वाली कोई भी घटना
• तकनीकी खराबी या सेवा में रुकावट
• किसी तीसरे पक्ष की वेबसाइट या सेवाओं के उपयोग से होने वाली हानि
• विवाह के बाद होने वाली कोई भी समस्या

हम केवल एक मंच प्रदान करते हैं और विवाह की सफलता या असफलता के लिए जिम्मेदार नहीं हैं।

अधिकतम दायित्व:
किसी भी स्थिति में, ShaadiPartnerSearch का अधिकतम दायित्व आपके द्वारा भुगतान की गई सदस्यता शुल्क से अधिक नहीं होगा।`
        : `ShaadiPartnerSearch is not liable for:

• False or misleading information provided by users
• Any disputes or disagreements between users
• Any incident resulting from personal meetings
• Technical malfunction or service interruption
• Loss from use of third-party websites or services
• Any problems occurring after marriage

We only provide a platform and are not responsible for the success or failure of marriages.

Maximum Liability:
In no event shall ShaadiPartnerSearch's liability exceed the membership fee paid by you.`
    },
    {
      icon: <Shield size={24} weight="bold" className="text-primary" />,
      title: isHindi ? '12. क्षतिपूर्ति (Indemnification)' : '12. Indemnification',
      content: isHindi
        ? `क्षतिपूर्ति की शर्तें:

आप ShaadiPartnerSearch, इसके निदेशकों, अधिकारियों, कर्मचारियों, एजेंटों और सहयोगियों को निम्नलिखित से उत्पन्न या संबंधित किसी भी दावे, नुकसान, देनदारियों, लागतों और खर्चों (कानूनी शुल्क सहित) से क्षतिपूर्ति करने, बचाव करने और हानिरहित रखने के लिए सहमत हैं:

• आपके द्वारा प्रदान की गई जानकारी:
  - आप अपने प्रोफाइल में दी गई सभी जानकारी के लिए पूर्णतः जिम्मेदार हैं
  - गलत, भ्रामक, या झूठी जानकारी प्रदान करने के परिणामों के लिए आप उत्तरदायी हैं
  - किसी तीसरे पक्ष को हुई हानि के लिए आप जिम्मेदार होंगे

• इन नियमों और शर्तों का उल्लंघन
• किसी तीसरे पक्ष के अधिकारों का उल्लंघन (बौद्धिक संपदा अधिकार सहित)
• आपके द्वारा अपलोड की गई कोई भी सामग्री
• प्लेटफॉर्म का दुरुपयोग या अनधिकृत उपयोग
• अन्य उपयोगकर्ताओं के साथ आपके व्यवहार या संपर्क

डेटा सत्यता की घोषणा:
पंजीकरण करके, आप पुष्टि करते हैं कि:
• सभी प्रदान की गई जानकारी सत्य और सटीक है
• आपने किसी अन्य व्यक्ति की पहचान का उपयोग नहीं किया है
• आप सभी जानकारी के सत्यापन के लिए जिम्मेदार हैं

यह क्षतिपूर्ति दायित्व आपकी सदस्यता समाप्त होने के बाद भी जारी रहेगा।`
        : `Indemnification Terms:

You agree to indemnify, defend, and hold harmless ShaadiPartnerSearch, its directors, officers, employees, agents, and affiliates from and against any and all claims, damages, liabilities, costs, and expenses (including legal fees) arising out of or related to:

• Information provided by you:
  - You are fully responsible for all information provided in your profile
  - You are liable for consequences of providing incorrect, misleading, or false information
  - You will be responsible for any harm caused to third parties

• Violation of these Terms and Conditions
• Infringement of any third-party rights (including intellectual property rights)
• Any content uploaded by you
• Misuse or unauthorized use of the platform
• Your conduct or interaction with other users

Declaration of Data Accuracy:
By registering, you confirm that:
• All information provided is true and accurate
• You have not used another person's identity
• You are responsible for verification of all information

This indemnification obligation shall survive the termination of your membership.`
    },
    {
      icon: <Handshake size={24} weight="bold" className="text-primary" />,
      title: isHindi ? '13. विवाद समाधान' : '13. Dispute Resolution',
      content: isHindi
        ? `विवाद समाधान प्रक्रिया:

1. शिकायत पंजीकरण:
   • support@shaadipartnersearch.com पर ईमेल करें
   • शिकायत 48 घंटों के भीतर स्वीकार की जाएगी

2. मध्यस्थता:
   • विवादों का समाधान पहले आपसी बातचीत से किया जाएगा
   • असफल होने पर, मध्यस्थता प्रक्रिया अपनाई जाएगी

3. मध्यस्थता (Arbitration):
   • भारतीय मध्यस्थता और सुलह अधिनियम, 1996 के अनुसार
   • मध्यस्थता स्थान: नई दिल्ली, भारत
   • भाषा: हिंदी या अंग्रेजी

4. न्यायालय:
   • अंतिम उपाय के रूप में, दिल्ली के न्यायालयों का विशेष अधिकार क्षेत्र होगा

शासी कानून:
ये नियम और शर्तें भारतीय कानून द्वारा शासित होंगी।`
        : `Dispute Resolution Process:

1. Complaint Registration:
   • Email at support@shaadipartnersearch.com
   • Complaint will be acknowledged within 48 hours

2. Mediation:
   • Disputes will first be resolved through mutual discussion
   • If unsuccessful, mediation process will be followed

3. Arbitration:
   • As per Indian Arbitration and Conciliation Act, 1996
   • Arbitration venue: New Delhi, India
   • Language: Hindi or English

4. Courts:
   • As a last resort, courts in Delhi shall have exclusive jurisdiction

Governing Law:
These Terms and Conditions shall be governed by Indian law.`
    },
    {
      icon: <Eye size={24} weight="bold" className="text-primary" />,
      title: isHindi ? '14. बौद्धिक संपदा' : '14. Intellectual Property',
      content: isHindi
        ? `ShaadiPartnerSearch की सभी सामग्री, जिसमें शामिल हैं:
• लोगो, डिज़ाइन और ट्रेडमार्क
• वेबसाइट का स्रोत कोड
• सामग्री और टेक्स्ट
• AI मॉडल और एल्गोरिदम

ये सभी ShaadiPartnerSearch की बौद्धिक संपदा हैं और कॉपीराइट कानूनों द्वारा संरक्षित हैं।

उपयोगकर्ता सामग्री:
• आप अपने द्वारा अपलोड की गई सामग्री के मालिक हैं
• आप हमें अपनी सामग्री का उपयोग करने का लाइसेंस देते हैं
• हम आपकी अनुमति के बिना आपकी फोटो का व्यावसायिक उपयोग नहीं करेंगे`
        : `All content of ShaadiPartnerSearch, including:
• Logos, designs, and trademarks
• Website source code
• Content and text
• AI models and algorithms

These are all intellectual property of ShaadiPartnerSearch and are protected by copyright laws.

User Content:
• You own the content you upload
• You grant us a license to use your content
• We will not use your photos commercially without your permission`
    },
    {
      icon: <Envelope size={24} weight="bold" className="text-primary" />,
      title: isHindi ? '15. संपर्क और शिकायत' : '15. Contact and Grievance',
      content: isHindi
        ? `शिकायत निवारण अधिकारी:
(सूचना प्रौद्योगिकी अधिनियम, 2000 और DPDP Act, 2023 के अनुसार)

नाम: [शिकायत अधिकारी का नाम]
ईमेल: grievance@shaadipartnersearch.com
पता: [कंपनी का पता], भारत

सामान्य संपर्क:
• ईमेल: support@shaadipartnersearch.com
• फोन: [संपर्क नंबर]
• कार्य समय: सोमवार-शनिवार, सुबह 10 बजे - शाम 6 बजे

प्रतिक्रिया समय:
• शिकायत स्वीकृति: 48 घंटे
• समाधान: 15 कार्य दिवस

अंतिम अपडेट: ${new Date().toLocaleDateString('hi-IN', { year: 'numeric', month: 'long', day: 'numeric' })}`
        : `Grievance Redressal Officer:
(As per Information Technology Act, 2000 and DPDP Act, 2023)

Name: [Grievance Officer Name]
Email: grievance@shaadipartnersearch.com
Address: [Company Address], India

General Contact:
• Email: support@shaadipartnersearch.com
• Phone: [Contact Number]
• Working Hours: Monday-Saturday, 10 AM - 6 PM

Response Time:
• Complaint acknowledgment: 48 hours
• Resolution: 15 business days

Last Updated: ${new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}`
    }
  ]

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl h-[90vh] flex flex-col overflow-hidden">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="text-2xl flex items-center gap-2">
            <FileText size={28} weight="bold" className="text-primary" />
            {isHindi ? 'नियम और शर्तें' : 'Terms and Conditions'}
          </DialogTitle>
          <DialogDescription>
            {isHindi 
              ? 'ShaadiPartnerSearch मैट्रिमोनी सेवा का उपयोग करने से पहले कृपया इन नियमों को ध्यान से पढ़ें।' 
              : 'Please read these terms carefully before using the ShaadiPartnerSearch matrimony service.'}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 min-h-0 pr-4">
          <div className="space-y-6 pb-4">
            {sections.map((section, index) => (
              <div key={index} className="space-y-3">
                <div className="flex items-center gap-3">
                  {section.icon}
                  <h3 className="text-lg font-semibold">{section.title}</h3>
                </div>
                <div className="pl-9 text-sm text-muted-foreground whitespace-pre-line leading-relaxed">
                  {section.content}
                </div>
                {index < sections.length - 1 && <Separator className="mt-4" />}
              </div>
            ))}

            <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4 mt-6">
              <div className="flex items-start gap-3">
                <Warning size={24} weight="fill" className="text-amber-600 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold text-amber-800 dark:text-amber-200 mb-1">
                    {isHindi ? 'महत्वपूर्ण सूचना' : 'Important Notice'}
                  </h4>
                  <p className="text-sm text-amber-700 dark:text-amber-300">
                    {isHindi 
                      ? 'पंजीकरण करके, आप इन सभी नियमों और शर्तों को पढ़ने और स्वीकार करने की पुष्टि करते हैं। यदि आपको कोई शर्त समझ में नहीं आई है, तो कृपया आगे बढ़ने से पहले हमसे संपर्क करें।' 
                      : 'By registering, you confirm that you have read and accept all these terms and conditions. If you do not understand any term, please contact us before proceeding.'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </ScrollArea>

        <div className="flex justify-end gap-3 pt-4 border-t flex-shrink-0">
          <Button onClick={onClose}>
            {isHindi ? 'बंद करें' : 'Close'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// Embedded version of Terms & Conditions for use in Settings dialog
// This uses the same content as the registration Terms dialog (DRY principle)
interface TermsContentEmbedProps {
  language: Language
  membershipSettings?: Partial<MembershipSettings>
  maxHeight?: string
}

export function TermsContentEmbed({ language, membershipSettings, maxHeight = '400px' }: TermsContentEmbedProps) {
  const isHindi = language === 'hi'
  
  // Dynamic pricing from membership settings
  const sixMonthPrice = membershipSettings?.sixMonthPrice || 500
  const oneYearPrice = membershipSettings?.oneYearPrice || 900
  
  // Dynamic plan limits from admin settings
  const freePlanChatLimit = membershipSettings?.freePlanChatLimit ?? 5
  const freePlanContactLimit = membershipSettings?.freePlanContactLimit ?? 0
  const sixMonthChatLimit = membershipSettings?.sixMonthChatLimit ?? 50
  const sixMonthContactLimit = membershipSettings?.sixMonthContactLimit ?? 20
  const oneYearChatLimit = membershipSettings?.oneYearChatLimit ?? 120
  const oneYearContactLimit = membershipSettings?.oneYearContactLimit ?? 50
  
  // Request expiry settings
  const requestExpiryDays = membershipSettings?.requestExpiryDays ?? 15
  
  // Boost pack settings
  const boostPackEnabled = membershipSettings?.boostPackEnabled ?? true
  const boostPackInterestLimit = membershipSettings?.boostPackInterestLimit ?? 10
  const boostPackContactLimit = membershipSettings?.boostPackContactLimit ?? 10
  const boostPackPrice = membershipSettings?.boostPackPrice ?? 100

  const sections = [
    {
      icon: <FileText size={20} weight="bold" className="text-primary" />,
      title: isHindi ? '1. परिचय और स्वीकृति' : '1. Introduction and Acceptance',
      content: isHindi 
        ? `ShaadiPartnerSearch एक ऑनलाइन मैट्रिमोनी प्लेटफॉर्म है। इस सेवा का उपयोग करके, आप इन नियमों और शर्तों को स्वीकार करते हैं।`
        : `ShaadiPartnerSearch is an online matrimonial platform. By using this service, you accept these Terms and Conditions.`
    },
    {
      icon: <User size={20} weight="bold" className="text-primary" />,
      title: isHindi ? '2. पात्रता मानदंड' : '2. Eligibility Criteria',
      content: isHindi
        ? `• पुरुष: न्यूनतम 21 वर्ष | महिला: न्यूनतम 18 वर्ष
• वैवाहिक स्थिति: अविवाहित, तलाकशुदा, या विधवा/विधुर
• सभी जानकारी सत्य और सही होनी चाहिए`
        : `• Male: Minimum 21 years | Female: Minimum 18 years
• Marital Status: Single, Divorced, or Widowed
• All information must be true and accurate`
    },
    {
      icon: <Lock size={20} weight="bold" className="text-primary" />,
      title: isHindi ? '3. डेटा गोपनीयता' : '3. Data Privacy',
      content: isHindi
        ? `• आपकी जानकारी DPDP Act 2023 के अनुसार सुरक्षित रहेगी
• संपर्क विवरण केवल स्वीकृत उपयोगकर्ताओं को दिखाया जाएगा
• आपके पास डेटा एक्सेस, सुधार और विलोपन का अधिकार है`
        : `• Your information is protected under DPDP Act 2023
• Contact details shown only to approved users
• You have rights to access, correct, and delete your data`
    },
    {
      icon: <CurrencyInr size={20} weight="bold" className="text-primary" />,
      title: isHindi ? '4. सदस्यता योजनाएं' : '4. Membership Plans',
      content: isHindi
        ? `• मुफ्त योजना: सीमित सुविधाएं (${freePlanChatLimit} चैट, ${freePlanContactLimit} संपर्क)
• 6 महीने (₹${sixMonthPrice}): ${sixMonthChatLimit} चैट, ${sixMonthContactLimit} संपर्क
• 1 साल (₹${oneYearPrice}): ${oneYearChatLimit} चैट, ${oneYearContactLimit} संपर्क
• सभी शुल्क 18% GST सहित | रिफंड नीति लागू`
        : `• Free Plan: Limited features (${freePlanChatLimit} chats, ${freePlanContactLimit} contacts)
• 6 Months (₹${sixMonthPrice}): ${sixMonthChatLimit} chats, ${sixMonthContactLimit} contacts
• 1 Year (₹${oneYearPrice}): ${oneYearChatLimit} chats, ${oneYearContactLimit} contacts
• All charges include 18% GST | Refund policy applies`
    },
    {
      icon: <Heart size={20} weight="bold" className="text-primary" />,
      title: isHindi ? '5. रुचि और संपर्क' : '5. Interest and Contact',
      content: isHindi
        ? `• रुचि स्वीकार होने पर भेजने वाले का चैट स्लॉट उपयोग होता है
• संपर्क स्वीकृति पर दोनों पक्षों का संपर्क स्लॉट उपयोग होता है
• पेंडिंग अनुरोध ${requestExpiryDays} दिनों बाद स्वतः समाप्त
${boostPackEnabled ? `• बूस्ट पैक: ₹${boostPackPrice} में ${boostPackInterestLimit} रुचि + ${boostPackContactLimit} संपर्क` : ''}`
        : `• Interest acceptance uses sender's chat slot
• Contact approval uses both parties' contact slots
• Pending requests auto-expire after ${requestExpiryDays} days
${boostPackEnabled ? `• Boost Pack: ₹${boostPackPrice} for ${boostPackInterestLimit} interests + ${boostPackContactLimit} contacts` : ''}`
    },
    {
      icon: <Shield size={20} weight="bold" className="text-primary" />,
      title: isHindi ? '6. सत्यापन और सुरक्षा' : '6. Verification and Safety',
      content: isHindi
        ? `• AI-आधारित फोटो और सेल्फी सत्यापन
• DigiLocker/आधार सत्यापन विकल्प उपलब्ध
• संदिग्ध प्रोफाइल रिपोर्ट/ब्लॉक करने की सुविधा
• हम 100% प्रामाणिकता की गारंटी नहीं दे सकते`
        : `• AI-based photo and selfie verification
• DigiLocker/Aadhaar verification option available
• Feature to report/block suspicious profiles
• We cannot guarantee 100% authenticity`
    },
    {
      icon: <Eye size={20} weight="bold" className="text-primary" />,
      title: isHindi ? '7. गोपनीयता नियंत्रण' : '7. Privacy Controls',
      content: isHindi
        ? `• प्रोफाइल छुपाने/दिखाने का विकल्प
• संपर्क जानकारी छुपाने का विकल्प
• ब्लॉक किए गए उपयोगकर्ता आपको नहीं देख सकते`
        : `• Option to hide/show profile
• Option to hide contact information
• Blocked users cannot see your profile`
    },
    {
      icon: <Handshake size={20} weight="bold" className="text-primary" />,
      title: isHindi ? '8. दायित्व अस्वीकरण' : '8. Liability Disclaimer',
      content: isHindi
        ? `• यह सेवा केवल परिचय प्रदान करती है
• विवाह का निर्णय पूर्णतः परिवारों का है
• प्लेटफॉर्म किसी विवाद के लिए उत्तरदायी नहीं
• व्यक्तिगत मिलने से पहले उचित सावधानी बरतें`
        : `• This service only provides introductions
• Marriage decision is entirely of families
• Platform not liable for any disputes
• Exercise due caution before meeting in person`
    }
  ]

  return (
    <ScrollArea style={{ height: maxHeight }} className="pr-4">
      <div className="space-y-4">
        {sections.map((section, index) => (
          <div key={index} className="space-y-2">
            <div className="flex items-center gap-2">
              {section.icon}
              <h4 className="text-sm font-semibold">{section.title}</h4>
            </div>
            <div className="pl-7 text-xs text-muted-foreground whitespace-pre-line leading-relaxed">
              {section.content}
            </div>
            {index < sections.length - 1 && <Separator className="mt-3" />}
          </div>
        ))}
        
        <div className="text-xs text-muted-foreground text-center pt-2 border-t">
          {isHindi 
            ? `अंतिम अपडेट: ${new Date().toLocaleDateString('hi-IN', { year: 'numeric', month: 'long', day: 'numeric' })}`
            : `Last Updated: ${new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}`}
        </div>
      </div>
    </ScrollArea>
  )
}
