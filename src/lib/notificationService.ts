/**
 * Notification Service
 * 
 * Unified notification system that currently uses toast notifications
 * but is designed to be easily extended for SMS, WhatsApp and email notifications.
 * 
 * Future Implementation Notes:
 * - SMS: Integrate with Azure Communication Services or Twilio
 * - Email: Integrate with Azure Communication Services, SendGrid, or similar
 * - WhatsApp: Integrate with Twilio WhatsApp API or Meta Business API
 * - Push: Integrate with Firebase Cloud Messaging or Azure Notification Hubs
 */

import { toast } from 'sonner'

// ============================================================================
// CHANNEL TYPES - Define communication channels
// ============================================================================

export type NotificationChannel = 'toast' | 'sms' | 'email' | 'whatsapp' | 'push'

// ============================================================================
// NOTIFICATION TYPES - All possible notification/message types
// ============================================================================

export type NotificationType = 
  | 'interest_received'
  | 'interest_accepted'
  | 'interest_declined'
  | 'contact_request_received'
  | 'contact_accepted'
  | 'contact_declined'
  | 'message_received'
  | 'profile_viewed'
  | 'otp_login'
  | 'otp_registration_email'
  | 'otp_registration_mobile'
  | 'otp_password_reset'
  | 'otp_verification'
  | 'welcome'
  | 'registration_complete'
  | 'payment_rejected'

// ============================================================================
// PAYLOAD INTERFACES
// ============================================================================

export interface NotificationPayload {
  type: NotificationType
  recipientProfileId?: string
  recipientName?: string
  recipientMobile?: string
  recipientEmail?: string
  senderProfileId?: string
  senderName?: string
  language?: 'en' | 'hi'
  additionalData?: Record<string, unknown>
  channels?: NotificationChannel[]  // Specify which channels to use
}

export interface OtpPayload {
  otp: string
  recipientMobile?: string
  recipientEmail?: string
  recipientName?: string
  language?: 'en' | 'hi'
  purpose: 'login' | 'registration_email' | 'registration_mobile' | 'password_reset' | 'verification'
  channels?: NotificationChannel[]
}

// ============================================================================
// TEMPLATE INTERFACE
// ============================================================================

interface NotificationTemplate {
  title: { en: string; hi: string }
  description: { en: string; hi: string }
  smsTemplate?: { en: string; hi: string }
  whatsappTemplate?: { en: string; hi: string }
  emailSubject?: { en: string; hi: string }
  emailBody?: { en: string; hi: string }
}

// Notification templates for different event types
const NOTIFICATION_TEMPLATES: Record<NotificationType, NotificationTemplate> = {
  interest_received: {
    title: {
      en: '💕 New Interest Received!',
      hi: '💕 नई रुचि प्राप्त हुई!'
    },
    description: {
      en: '{senderName} has expressed interest in your profile. Check your inbox to respond.',
      hi: '{senderName} ने आपकी प्रोफाइल में रुचि दिखाई है। जवाब देने के लिए अपना इनबॉक्स देखें।'
    },
    smsTemplate: {
      en: 'ShaadiPartner: {senderName} has shown interest in your profile! Login to respond: https://shaadipartner.com/activity',
      hi: 'ShaadiPartner: {senderName} ने आपकी प्रोफाइल में रुचि दिखाई! जवाब देने के लिए लॉगिन करें: https://shaadipartner.com/activity'
    },
    emailSubject: {
      en: '💕 Someone is interested in you on ShaadiPartner!',
      hi: '💕 ShaadiPartner पर कोई आपमें रुचि रखता है!'
    },
    emailBody: {
      en: 'Dear {recipientName},\n\n{senderName} has expressed interest in your profile on ShaadiPartner.\n\nLogin to view their profile and respond to their interest.\n\nBest regards,\nShaadiPartner Team',
      hi: 'प्रिय {recipientName},\n\n{senderName} ने ShaadiPartner पर आपकी प्रोफाइल में रुचि व्यक्त की है।\n\nउनकी प्रोफाइल देखने और जवाब देने के लिए लॉगिन करें।\n\nशुभकामनाएं,\nShaadiPartner टीम'
    }
  },
  interest_accepted: {
    title: {
      en: '🎉 Interest Accepted!',
      hi: '🎉 रुचि स्वीकार हुई!'
    },
    description: {
      en: '{senderName} has accepted your interest! You can now start chatting.',
      hi: '{senderName} ने आपकी रुचि स्वीकार कर ली! अब आप चैट शुरू कर सकते हैं।'
    },
    smsTemplate: {
      en: 'ShaadiPartner: Great news! {senderName} has accepted your interest! Start chatting now: https://shaadipartner.com/chat',
      hi: 'ShaadiPartner: बधाई हो! {senderName} ने आपकी रुचि स्वीकार कर ली! अभी चैट शुरू करें: https://shaadipartner.com/chat'
    },
    emailSubject: {
      en: '🎉 Great news! Your interest has been accepted on ShaadiPartner!',
      hi: '🎉 बधाई हो! ShaadiPartner पर आपकी रुचि स्वीकार हो गई!'
    },
    emailBody: {
      en: 'Dear {recipientName},\n\nCongratulations! {senderName} has accepted your interest on ShaadiPartner.\n\nYou can now start chatting with them. Don\'t miss this opportunity!\n\nBest regards,\nShaadiPartner Team',
      hi: 'प्रिय {recipientName},\n\nबधाई हो! {senderName} ने ShaadiPartner पर आपकी रुचि स्वीकार कर ली है।\n\nअब आप उनसे चैट शुरू कर सकते हैं। इस अवसर को न चूकें!\n\nशुभकामनाएं,\nShaadiPartner टीम'
    }
  },
  interest_declined: {
    title: {
      en: 'Interest Update',
      hi: 'रुचि अपडेट'
    },
    description: {
      en: 'Your interest request has been declined. Keep exploring other profiles!',
      hi: 'आपकी रुचि का अनुरोध अस्वीकार कर दिया गया। अन्य प्रोफाइल खोजते रहें!'
    }
  },
  contact_request_received: {
    title: {
      en: '📞 Contact Request Received!',
      hi: '📞 संपर्क अनुरोध प्राप्त हुआ!'
    },
    description: {
      en: '{senderName} wants to exchange contact information with you.',
      hi: '{senderName} आपसे संपर्क जानकारी साझा करना चाहते हैं।'
    },
    smsTemplate: {
      en: 'ShaadiPartner: {senderName} wants to exchange contact info with you! Respond now: https://shaadipartner.com/activity',
      hi: 'ShaadiPartner: {senderName} आपसे संपर्क साझा करना चाहते हैं! अभी जवाब दें: https://shaadipartner.com/activity'
    }
  },
  contact_accepted: {
    title: {
      en: '✅ Contact Request Accepted!',
      hi: '✅ संपर्क अनुरोध स्वीकार हुआ!'
    },
    description: {
      en: '{senderName} has shared their contact information with you.',
      hi: '{senderName} ने अपनी संपर्क जानकारी आपके साथ साझा कर दी है।'
    },
    smsTemplate: {
      en: 'ShaadiPartner: {senderName} has accepted your contact request! View their details now: https://shaadipartner.com/activity',
      hi: 'ShaadiPartner: {senderName} ने आपका संपर्क अनुरोध स्वीकार किया! अभी देखें: https://shaadipartner.com/activity'
    }
  },
  contact_declined: {
    title: {
      en: 'Contact Request Update',
      hi: 'संपर्क अनुरोध अपडेट'
    },
    description: {
      en: 'Your contact request has been declined.',
      hi: 'आपका संपर्क अनुरोध अस्वीकार कर दिया गया।'
    }
  },
  message_received: {
    title: {
      en: '💬 New Message!',
      hi: '💬 नया संदेश!'
    },
    description: {
      en: 'You have a new message from {senderName}.',
      hi: '{senderName} का नया संदेश आया है।'
    }
  },
  profile_viewed: {
    title: {
      en: '👀 Profile Viewed',
      hi: '👀 प्रोफाइल देखी गई'
    },
    description: {
      en: '{senderName} viewed your profile.',
      hi: '{senderName} ने आपकी प्रोफाइल देखी।'
    }
  },
  // OTP Templates
  otp_login: {
    title: {
      en: '🔐 Login OTP',
      hi: '🔐 लॉगिन OTP'
    },
    description: {
      en: 'Your login OTP is: {otp}',
      hi: 'आपका लॉगिन OTP है: {otp}'
    },
    smsTemplate: {
      en: 'ShaadiPartner: Your login OTP is {otp}. Valid for 10 minutes. Do not share this code.',
      hi: 'ShaadiPartner: आपका लॉगिन OTP {otp} है। 10 मिनट के लिए वैध। इस कोड को साझा न करें।'
    },
    whatsappTemplate: {
      en: '🔐 *ShaadiPartner Login*\n\nYour OTP is: *{otp}*\n\nValid for 10 minutes.\n⚠️ Do not share this code with anyone.',
      hi: '🔐 *ShaadiPartner लॉगिन*\n\nआपका OTP है: *{otp}*\n\n10 मिनट के लिए वैध।\n⚠️ इस कोड को किसी के साथ साझा न करें।'
    },
    emailSubject: {
      en: '🔐 Your ShaadiPartner Login OTP',
      hi: '🔐 आपका ShaadiPartner लॉगिन OTP'
    },
    emailBody: {
      en: 'Dear User,\n\nYour login OTP for ShaadiPartner is: {otp}\n\nThis code is valid for 10 minutes.\n\n⚠️ Do not share this code with anyone. ShaadiPartner will never ask for your OTP.\n\nBest regards,\nShaadiPartner Team',
      hi: 'प्रिय उपयोगकर्ता,\n\nShaadiPartner के लिए आपका लॉगिन OTP है: {otp}\n\nयह कोड 10 मिनट के लिए वैध है।\n\n⚠️ इस कोड को किसी के साथ साझा न करें। ShaadiPartner कभी भी आपका OTP नहीं मांगेगा।\n\nशुभकामनाएं,\nShaadiPartner टीम'
    }
  },
  otp_registration_email: {
    title: {
      en: '📧 Email Verification OTP',
      hi: '📧 ईमेल सत्यापन OTP'
    },
    description: {
      en: 'Your email verification OTP is: {otp}',
      hi: 'आपका ईमेल सत्यापन OTP है: {otp}'
    },
    smsTemplate: {
      en: 'ShaadiPartner: Your email verification OTP is {otp}. Valid for 30 minutes.',
      hi: 'ShaadiPartner: आपका ईमेल सत्यापन OTP {otp} है। 30 मिनट के लिए वैध।'
    },
    whatsappTemplate: {
      en: '📧 *ShaadiPartner Email Verification*\n\nYour OTP is: *{otp}*\n\nValid for 30 minutes.',
      hi: '📧 *ShaadiPartner ईमेल सत्यापन*\n\nआपका OTP है: *{otp}*\n\n30 मिनट के लिए वैध।'
    },
    emailSubject: {
      en: '📧 Verify your email - ShaadiPartner',
      hi: '📧 अपना ईमेल सत्यापित करें - ShaadiPartner'
    },
    emailBody: {
      en: 'Dear {recipientName},\n\nWelcome to ShaadiPartner!\n\nYour email verification OTP is: {otp}\n\nThis code is valid for 30 minutes.\n\nIf you did not request this, please ignore this email.\n\nBest regards,\nShaadiPartner Team',
      hi: 'प्रिय {recipientName},\n\nShaadiPartner में आपका स्वागत है!\n\nआपका ईमेल सत्यापन OTP है: {otp}\n\nयह कोड 30 मिनट के लिए वैध है।\n\nयदि आपने यह अनुरोध नहीं किया है, तो कृपया इस ईमेल को अनदेखा करें।\n\nशुभकामनाएं,\nShaadiPartner टीम'
    }
  },
  otp_registration_mobile: {
    title: {
      en: '📱 Mobile Verification OTP',
      hi: '📱 मोबाइल सत्यापन OTP'
    },
    description: {
      en: 'Your mobile verification OTP is: {otp}',
      hi: 'आपका मोबाइल सत्यापन OTP है: {otp}'
    },
    smsTemplate: {
      en: 'ShaadiPartner: Your mobile verification OTP is {otp}. Valid for 30 minutes.',
      hi: 'ShaadiPartner: आपका मोबाइल सत्यापन OTP {otp} है। 30 मिनट के लिए वैध।'
    },
    whatsappTemplate: {
      en: '📱 *ShaadiPartner Mobile Verification*\n\nYour OTP is: *{otp}*\n\nValid for 30 minutes.',
      hi: '📱 *ShaadiPartner मोबाइल सत्यापन*\n\nआपका OTP है: *{otp}*\n\n30 मिनट के लिए वैध।'
    },
    emailSubject: {
      en: '📱 Mobile Verification OTP - ShaadiPartner',
      hi: '📱 मोबाइल सत्यापन OTP - ShaadiPartner'
    },
    emailBody: {
      en: 'Dear {recipientName},\n\nYour mobile verification OTP for ShaadiPartner is: {otp}\n\nThis code is valid for 30 minutes.\n\nBest regards,\nShaadiPartner Team',
      hi: 'प्रिय {recipientName},\n\nShaadiPartner के लिए आपका मोबाइल सत्यापन OTP है: {otp}\n\nयह कोड 30 मिनट के लिए वैध है।\n\nशुभकामनाएं,\nShaadiPartner टीम'
    }
  },
  otp_password_reset: {
    title: {
      en: '🔑 Password Reset OTP',
      hi: '🔑 पासवर्ड रीसेट OTP'
    },
    description: {
      en: 'Your password reset OTP is: {otp}',
      hi: 'आपका पासवर्ड रीसेट OTP है: {otp}'
    },
    smsTemplate: {
      en: 'ShaadiPartner: Your password reset OTP is {otp}. Valid for 10 minutes. Do not share.',
      hi: 'ShaadiPartner: आपका पासवर्ड रीसेट OTP {otp} है। 10 मिनट के लिए वैध। साझा न करें।'
    },
    whatsappTemplate: {
      en: '🔑 *ShaadiPartner Password Reset*\n\nYour OTP is: *{otp}*\n\nValid for 10 minutes.\n⚠️ Do not share this code.',
      hi: '🔑 *ShaadiPartner पासवर्ड रीसेट*\n\nआपका OTP है: *{otp}*\n\n10 मिनट के लिए वैध।\n⚠️ इस कोड को साझा न करें।'
    },
    emailSubject: {
      en: '🔑 Password Reset OTP - ShaadiPartner',
      hi: '🔑 पासवर्ड रीसेट OTP - ShaadiPartner'
    },
    emailBody: {
      en: 'Dear User,\n\nYou requested a password reset for your ShaadiPartner account.\n\nYour OTP is: {otp}\n\nThis code is valid for 10 minutes.\n\n⚠️ If you did not request this, please secure your account immediately.\n\nBest regards,\nShaadiPartner Team',
      hi: 'प्रिय उपयोगकर्ता,\n\nआपने अपने ShaadiPartner खाते के लिए पासवर्ड रीसेट का अनुरोध किया है।\n\nआपका OTP है: {otp}\n\nयह कोड 10 मिनट के लिए वैध है।\n\n⚠️ यदि आपने यह अनुरोध नहीं किया है, तो कृपया तुरंत अपना खाता सुरक्षित करें।\n\nशुभकामनाएं,\nShaadiPartner टीम'
    }
  },
  otp_verification: {
    title: {
      en: '✅ Verification OTP',
      hi: '✅ सत्यापन OTP'
    },
    description: {
      en: 'Your verification OTP is: {otp}',
      hi: 'आपका सत्यापन OTP है: {otp}'
    },
    smsTemplate: {
      en: 'ShaadiPartner: Your verification OTP is {otp}. Valid for 10 minutes.',
      hi: 'ShaadiPartner: आपका सत्यापन OTP {otp} है। 10 मिनट के लिए वैध।'
    },
    whatsappTemplate: {
      en: '✅ *ShaadiPartner Verification*\n\nYour OTP is: *{otp}*\n\nValid for 10 minutes.',
      hi: '✅ *ShaadiPartner सत्यापन*\n\nआपका OTP है: *{otp}*\n\n10 मिनट के लिए वैध।'
    },
    emailSubject: {
      en: '✅ Verification OTP - ShaadiPartner',
      hi: '✅ सत्यापन OTP - ShaadiPartner'
    },
    emailBody: {
      en: 'Dear User,\n\nYour verification OTP for ShaadiPartner is: {otp}\n\nThis code is valid for 10 minutes.\n\nBest regards,\nShaadiPartner Team',
      hi: 'प्रिय उपयोगकर्ता,\n\nShaadiPartner के लिए आपका सत्यापन OTP है: {otp}\n\nयह कोड 10 मिनट के लिए वैध है।\n\nशुभकामनाएं,\nShaadiPartner टीम'
    }
  },
  welcome: {
    title: {
      en: '🎉 Welcome to ShaadiPartner!',
      hi: '🎉 ShaadiPartner में आपका स्वागत है!'
    },
    description: {
      en: 'Your registration is complete. Start your journey to find your perfect match!',
      hi: 'आपका पंजीकरण पूर्ण हो गया। अपना आदर्श साथी खोजने की यात्रा शुरू करें!'
    },
    smsTemplate: {
      en: 'Welcome to ShaadiPartner! Your registration is complete. Login now: https://shaadipartner.com',
      hi: 'ShaadiPartner में आपका स्वागत है! आपका पंजीकरण पूर्ण हो गया। अभी लॉगिन करें: https://shaadipartner.com'
    },
    whatsappTemplate: {
      en: '🎉 *Welcome to ShaadiPartner!*\n\nYour registration is complete.\n\n🔗 Login now: https://shaadipartner.com\n\nStart your journey to find your perfect match!',
      hi: '🎉 *ShaadiPartner में आपका स्वागत है!*\n\nआपका पंजीकरण पूर्ण हो गया।\n\n🔗 अभी लॉगिन करें: https://shaadipartner.com\n\nअपना आदर्श साथी खोजने की यात्रा शुरू करें!'
    },
    emailSubject: {
      en: '🎉 Welcome to ShaadiPartner - Registration Complete!',
      hi: '🎉 ShaadiPartner में आपका स्वागत है - पंजीकरण पूर्ण!'
    },
    emailBody: {
      en: 'Dear {recipientName},\n\nWelcome to ShaadiPartner! Your registration is complete.\n\nYou can now:\n• Browse profiles and find your match\n• Send interests to profiles you like\n• Chat with mutual matches\n• Access Marriage Readiness assessments\n\nStart your journey: https://shaadipartner.com\n\nBest regards,\nShaadiPartner Team',
      hi: 'प्रिय {recipientName},\n\nShaadiPartner में आपका स्वागत है! आपका पंजीकरण पूर्ण हो गया।\n\nअब आप कर सकते हैं:\n• प्रोफाइल ब्राउज़ करें और अपना मैच खोजें\n• पसंदीदा प्रोफाइल को रुचि भेजें\n• म्यूचुअल मैच के साथ चैट करें\n• Marriage Readiness आकलन एक्सेस करें\n\nअपनी यात्रा शुरू करें: https://shaadipartner.com\n\nशुभकामनाएं,\nShaadiPartner टीम'
    }
  },
  registration_complete: {
    title: {
      en: '✅ Registration Complete!',
      hi: '✅ पंजीकरण पूर्ण!'
    },
    description: {
      en: 'Your profile has been created successfully.',
      hi: 'आपकी प्रोफाइल सफलतापूर्वक बन गई है।'
    }
  },
  payment_rejected: {
    title: {
      en: '❌ Payment Rejected',
      hi: '❌ भुगतान अस्वीकृत'
    },
    description: {
      en: 'Your payment was rejected. Reason: {message}. Please re-upload your payment screenshot.',
      hi: 'आपका भुगतान अस्वीकृत हो गया। कारण: {message}। कृपया अपना भुगतान स्क्रीनशॉट दोबारा अपलोड करें।'
    },
    smsTemplate: {
      en: 'ShaadiPartner: Your payment was rejected. Please login and re-upload payment screenshot.',
      hi: 'ShaadiPartner: आपका भुगतान अस्वीकृत हो गया। कृपया लॉगिन करके भुगतान स्क्रीनशॉट दोबारा अपलोड करें।'
    }
  }
}

// ============================================================================
// PLACEHOLDER REPLACEMENT
// ============================================================================

/**
 * Replace placeholders in template with actual values
 * Supports both notification and OTP payloads
 */
function replacePlaceholders(template: string, payload: NotificationPayload | OtpPayload): string {
  let result = template
  
  // Common placeholders
  if ('recipientName' in payload) {
    result = result.replace(/{recipientName}/g, payload.recipientName || 'User')
  }
  if ('senderName' in payload) {
    result = result.replace(/{senderName}/g, payload.senderName || 'Someone')
  }
  if ('senderProfileId' in payload) {
    result = result.replace(/{senderProfileId}/g, payload.senderProfileId || '')
  }
  if ('recipientProfileId' in payload) {
    result = result.replace(/{recipientProfileId}/g, payload.recipientProfileId || '')
  }
  
  // OTP-specific placeholder
  if ('otp' in payload) {
    result = result.replace(/{otp}/g, payload.otp)
  }
  
  return result
}

// ============================================================================
// CHANNEL IMPLEMENTATIONS
// ============================================================================

/**
 * Send toast notification (current implementation)
 */
function sendToastNotification(payload: NotificationPayload): void {
  const template = NOTIFICATION_TEMPLATES[payload.type]
  if (!template) return

  const lang = payload.language || 'en'
  const title = replacePlaceholders(template.title[lang], payload)
  const description = replacePlaceholders(template.description[lang], payload)

  // Use different toast types based on notification type
  if (payload.type.includes('accepted')) {
    toast.success(title, { description, duration: 6000 })
  } else if (payload.type.includes('declined')) {
    toast.info(title, { description, duration: 4000 })
  } else {
    toast.info(title, { description, duration: 5000 })
  }
}

/**
 * Send SMS notification (future implementation)
 * Currently logs to console, will integrate with Azure Communication Services or Twilio
 */
async function sendSmsNotification(payload: NotificationPayload): Promise<boolean> {
  const template = NOTIFICATION_TEMPLATES[payload.type]
  if (!template?.smsTemplate || !payload.recipientMobile) {
    console.log('[SMS] Skipped - no template or mobile number')
    return false
  }

  const lang = payload.language || 'en'
  const message = replacePlaceholders(template.smsTemplate[lang], payload)

  // TODO: Future implementation with Azure Communication Services
  // const connectionString = process.env.AZURE_COMMUNICATION_CONNECTION_STRING
  // const client = new SmsClient(connectionString)
  // await client.send({
  //   from: '+1XXXXXXXXXX',
  //   to: [payload.recipientMobile],
  //   message: message
  // })

  console.log(`[SMS] Would send to ${payload.recipientMobile}: ${message}`)
  return true
}

/**
 * Send WhatsApp notification (future implementation)
 * Currently logs to console, will integrate with Twilio WhatsApp API or Meta Business API
 */
async function sendWhatsAppNotification(payload: NotificationPayload): Promise<boolean> {
  const template = NOTIFICATION_TEMPLATES[payload.type]
  if (!template?.whatsappTemplate || !payload.recipientMobile) {
    console.log('[WhatsApp] Skipped - no template or mobile number')
    return false
  }

  const lang = payload.language || 'en'
  const message = replacePlaceholders(template.whatsappTemplate[lang], payload)

  // TODO: Future implementation with Twilio WhatsApp API
  // const client = require('twilio')(accountSid, authToken)
  // await client.messages.create({
  //   from: 'whatsapp:+14155238886',
  //   to: `whatsapp:${payload.recipientMobile}`,
  //   body: message
  // })

  console.log(`[WhatsApp] Would send to ${payload.recipientMobile}: ${message}`)
  return true
}

/**
 * Send email notification (future implementation)
 * Currently logs to console, will integrate with email service
 */
async function sendEmailNotification(payload: NotificationPayload): Promise<boolean> {
  const template = NOTIFICATION_TEMPLATES[payload.type]
  if (!template?.emailSubject || !template?.emailBody || !payload.recipientEmail) {
    console.log('[Email] Skipped - no template or email address')
    return false
  }

  const lang = payload.language || 'en'
  const subject = replacePlaceholders(template.emailSubject[lang], payload)
  const body = replacePlaceholders(template.emailBody[lang], payload)

  // TODO: Future implementation with SendGrid or Azure Communication Services
  // await sgMail.send({
  //   to: payload.recipientEmail,
  //   from: 'noreply@shaadipartner.com',
  //   subject: subject,
  //   text: body
  // })

  console.log(`[Email] Would send to ${payload.recipientEmail}:`)
  console.log(`Subject: ${subject}`)
  console.log(`Body: ${body}`)
  return true
}

/**
 * Main notification function - sends notification through all configured channels
 */
export async function sendNotification(payload: NotificationPayload): Promise<void> {
  // Always send toast notification (in-app)
  sendToastNotification(payload)

  // Future: Send SMS if mobile is available
  // Uncomment when SMS service is configured
  // if (payload.recipientMobile) {
  //   await sendSmsNotification(payload)
  // }

  // Future: Send Email if email is available
  // Uncomment when email service is configured
  // if (payload.recipientEmail) {
  //   await sendEmailNotification(payload)
  // }

  // Log for debugging/future reference
  console.log(`[Notification] Sent ${payload.type} notification to ${payload.recipientProfileId}`, {
    from: payload.senderName,
    to: payload.recipientName,
    hasMobile: !!payload.recipientMobile,
    hasEmail: !!payload.recipientEmail
  })
}

/**
 * Helper function to send interest received notification
 */
export function notifyInterestReceived(
  recipientProfile: { profileId: string; fullName?: string; mobile?: string; email?: string },
  senderProfile: { profileId: string; fullName?: string },
  language: 'en' | 'hi' = 'en'
): void {
  sendNotification({
    type: 'interest_received',
    recipientProfileId: recipientProfile.profileId,
    recipientName: recipientProfile.fullName,
    recipientMobile: recipientProfile.mobile,
    recipientEmail: recipientProfile.email,
    senderProfileId: senderProfile.profileId,
    senderName: senderProfile.fullName,
    language
  })
}

/**
 * Helper function to send interest accepted notification
 */
export function notifyInterestAccepted(
  recipientProfile: { profileId: string; fullName?: string; mobile?: string; email?: string },
  senderProfile: { profileId: string; fullName?: string },
  language: 'en' | 'hi' = 'en'
): void {
  sendNotification({
    type: 'interest_accepted',
    recipientProfileId: recipientProfile.profileId,
    recipientName: recipientProfile.fullName,
    recipientMobile: recipientProfile.mobile,
    recipientEmail: recipientProfile.email,
    senderProfileId: senderProfile.profileId,
    senderName: senderProfile.fullName,
    language
  })
}

/**
 * Helper function to send interest declined notification
 */
export function notifyInterestDeclined(
  recipientProfile: { profileId: string; fullName?: string; mobile?: string; email?: string },
  senderProfile: { profileId: string; fullName?: string },
  language: 'en' | 'hi' = 'en'
): void {
  sendNotification({
    type: 'interest_declined',
    recipientProfileId: recipientProfile.profileId,
    recipientName: recipientProfile.fullName,
    recipientMobile: recipientProfile.mobile,
    recipientEmail: recipientProfile.email,
    senderProfileId: senderProfile.profileId,
    senderName: senderProfile.fullName,
    language
  })
}

/**
 * Helper function to send contact request received notification
 */
export function notifyContactRequestReceived(
  recipientProfile: { profileId: string; fullName?: string; mobile?: string; email?: string },
  senderProfile: { profileId: string; fullName?: string },
  language: 'en' | 'hi' = 'en'
): void {
  sendNotification({
    type: 'contact_request_received',
    recipientProfileId: recipientProfile.profileId,
    recipientName: recipientProfile.fullName,
    recipientMobile: recipientProfile.mobile,
    recipientEmail: recipientProfile.email,
    senderProfileId: senderProfile.profileId,
    senderName: senderProfile.fullName,
    language
  })
}

/**
 * Helper function to send contact accepted notification
 */
export function notifyContactAccepted(
  recipientProfile: { profileId: string; fullName?: string; mobile?: string; email?: string },
  senderProfile: { profileId: string; fullName?: string },
  language: 'en' | 'hi' = 'en'
): void {
  sendNotification({
    type: 'contact_accepted',
    recipientProfileId: recipientProfile.profileId,
    recipientName: recipientProfile.fullName,
    recipientMobile: recipientProfile.mobile,
    recipientEmail: recipientProfile.email,
    senderProfileId: senderProfile.profileId,
    senderName: senderProfile.fullName,
    language
  })
}

/**
 * Helper function to send contact declined notification
 */
export function notifyContactDeclined(
  recipientProfile: { profileId: string; fullName?: string; mobile?: string; email?: string },
  senderProfile: { profileId: string; fullName?: string },
  language: 'en' | 'hi' = 'en'
): void {
  sendNotification({
    type: 'contact_declined',
    recipientProfileId: recipientProfile.profileId,
    recipientName: recipientProfile.fullName,
    recipientMobile: recipientProfile.mobile,
    recipientEmail: recipientProfile.email,
    senderProfileId: senderProfile.profileId,
    senderName: senderProfile.fullName,
    language
  })
}

export default {
  sendNotification,
  notifyInterestReceived,
  notifyInterestAccepted,
  notifyInterestDeclined,
  notifyContactRequestReceived,
  notifyContactAccepted,
  notifyContactDeclined,
  sendOtp,
  generateOtp
}

// ============================================================================
// OTP FUNCTIONS
// ============================================================================

/**
 * Generate a random 6-digit OTP
 */
export function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

/**
 * Map OTP purpose to notification type
 */
function getOtpNotificationType(purpose: OtpPayload['purpose']): NotificationType {
  switch (purpose) {
    case 'login':
      return 'otp_login'
    case 'registration_email':
      return 'otp_registration_email'
    case 'registration_mobile':
      return 'otp_registration_mobile'
    case 'password_reset':
      return 'otp_password_reset'
    case 'verification':
    default:
      return 'otp_verification'
  }
}

/**
 * Send OTP via all configured channels
 * Currently uses toast, but ready for SMS/WhatsApp/Email
 * 
 * @param payload - OTP payload containing OTP code and recipient details
 * @returns Object containing success status and the generated OTP for verification
 */
export function sendOtp(payload: OtpPayload): { success: boolean; otp: string } {
  const { otp, recipientMobile, recipientEmail, recipientName, language = 'en', purpose, channels } = payload
  
  const notificationType = getOtpNotificationType(purpose)
  const template = NOTIFICATION_TEMPLATES[notificationType]
  
  if (!template) {
    console.error(`[OTP] No template found for purpose: ${purpose}`)
    return { success: false, otp }
  }

  const lang = language
  
  // Determine which channels to use
  const activeChannels = channels || ['toast'] // Default to toast only
  
  // Always show toast for demo/development
  const title = replacePlaceholders(template.title[lang], payload)
  const description = replacePlaceholders(template.description[lang], payload)
  
  // Show toast with OTP (for demo/development)
  toast.success(title, {
    description: `Demo OTP: ${otp}`,
    duration: 30000  // Keep visible for 30 seconds
  })

  // Future: Send via SMS
  if (activeChannels.includes('sms') && recipientMobile && template.smsTemplate) {
    const smsMessage = replacePlaceholders(template.smsTemplate[lang], payload)
    console.log(`[SMS OTP] Would send to ${recipientMobile}: ${smsMessage}`)
    // TODO: Integrate with Azure Communication Services or Twilio
    // await smsClient.send({ to: recipientMobile, message: smsMessage })
  }

  // Future: Send via WhatsApp
  if (activeChannels.includes('whatsapp') && recipientMobile && template.whatsappTemplate) {
    const whatsappMessage = replacePlaceholders(template.whatsappTemplate[lang], payload)
    console.log(`[WhatsApp OTP] Would send to ${recipientMobile}: ${whatsappMessage}`)
    // TODO: Integrate with Twilio WhatsApp API or Meta Business API
    // await whatsappClient.send({ to: recipientMobile, message: whatsappMessage })
  }

  // Future: Send via Email
  if (activeChannels.includes('email') && recipientEmail && template.emailSubject && template.emailBody) {
    const subject = replacePlaceholders(template.emailSubject[lang], payload)
    const body = replacePlaceholders(template.emailBody[lang], payload)
    console.log(`[Email OTP] Would send to ${recipientEmail}:`)
    console.log(`Subject: ${subject}`)
    console.log(`Body: ${body}`)
    // TODO: Integrate with SendGrid or Azure Communication Services
    // await emailClient.send({ to: recipientEmail, subject, body })
  }

  console.log(`[OTP] Sent ${purpose} OTP via channels: ${activeChannels.join(', ')}`, {
    to: recipientMobile || recipientEmail || 'unknown',
    purpose,
    recipientName
  })

  return { success: true, otp }
}

/**
 * Convenience function: Generate and send OTP for login
 */
export function sendLoginOtp(
  mobile?: string,
  email?: string,
  language: 'en' | 'hi' = 'en'
): { otp: string; success: boolean } {
  const otp = generateOtp()
  return sendOtp({
    otp,
    recipientMobile: mobile,
    recipientEmail: email,
    purpose: 'login',
    language,
    channels: ['toast'] // Add 'sms', 'whatsapp', 'email' when services are configured
  })
}

/**
 * Convenience function: Generate and send OTP for password reset
 */
export function sendPasswordResetOtp(
  mobile?: string,
  email?: string,
  language: 'en' | 'hi' = 'en'
): { otp: string; success: boolean } {
  const otp = generateOtp()
  return sendOtp({
    otp,
    recipientMobile: mobile,
    recipientEmail: email,
    purpose: 'password_reset',
    language,
    channels: ['toast'] // Add 'sms', 'whatsapp', 'email' when services are configured
  })
}

/**
 * Convenience function: Generate and send OTP for registration (email)
 */
export function sendRegistrationEmailOtp(
  email: string,
  recipientName?: string,
  language: 'en' | 'hi' = 'en'
): { otp: string; success: boolean } {
  const otp = generateOtp()
  return sendOtp({
    otp,
    recipientEmail: email,
    recipientName,
    purpose: 'registration_email',
    language,
    channels: ['toast'] // Add 'email' when service is configured
  })
}

/**
 * Convenience function: Generate and send OTP for registration (mobile)
 */
export function sendRegistrationMobileOtp(
  mobile: string,
  recipientName?: string,
  language: 'en' | 'hi' = 'en'
): { otp: string; success: boolean } {
  const otp = generateOtp()
  return sendOtp({
    otp,
    recipientMobile: mobile,
    recipientName,
    purpose: 'registration_mobile',
    language,
    channels: ['toast'] // Add 'sms', 'whatsapp' when services are configured
  })
}
