# OTP सेटअप निर्देश / OTP Setup Instructions

## हिंदी में निर्देश

### OTP सिस्टम कैसे काम करता है

यह एप्लिकेशन **एडमिन लॉगिन** के लिए दो-कारक प्रमाणीकरण (Two-Factor Authentication) का उपयोग करता है।

### एडमिन लॉगिन प्रक्रिया

1. **यूज़रनेम और पासवर्ड**
   - यूज़रनेम: `rkkhilrani`
   - पासवर्ड: `1234`

2. **OTP सत्यापन**
   - यूज़रनेम और पासवर्ड डालने के बाद, एक 6-अंकीय OTP जेनरेट होगा
   - यह OTP निम्नलिखित दोनों नंबरों पर भेजा जाएगा:
     - **+91-7895601505**
     - **+91-9828585300**

3. **OTP कहाँ दिखेगा**
   - **टोस्ट नोटिफिकेशन में**: स्क्रीन के ऊपर दाईं ओर एक सूचना दिखाई देगी जिसमें दोनों फ़ोन नंबर लिखे होंगे
   - **ब्राउज़र कंसोल में**: विकास के उद्देश्य से, OTP ब्राउज़र के कंसोल में भी प्रिंट होगा
   - **OTP डायलॉग में**: OTP दर्ज करने वाली स्क्रीन पर भी दोनों नंबर दिखाई देंगे

4. **OTP दर्ज करना**
   - 6-अंकीय OTP को इनपुट फील्ड में दर्ज करें
   - "सत्यापित करें" बटन पर क्लिक करें

### वास्तविक SMS भेजने के लिए सेटअप (Production)

वर्तमान में, OTP केवल **स्क्रीन पर दिखाया जाता है**। वास्तव में SMS भेजने के लिए, आपको एक SMS गेटवे सेवा की आवश्यकता होगी:

#### लोकप्रिय भारतीय SMS सेवाएं:

1. **Twilio** (https://www.twilio.com)
   - अंतरराष्ट्रीय स्तर पर लोकप्रिय
   - भारत में काम करता है
   - API एकीकरण आसान है

2. **MSG91** (https://msg91.com)
   - भारतीय कंपनी
   - OTP टेम्पलेट्स का समर्थन
   - किफायती दरें

3. **Gupshup** (https://www.gupshup.io)
   - भारत में बहुत लोकप्रिय
   - OTP और promotional SMS
   - अच्छी डिलीवरी दर

4. **Amazon SNS** (https://aws.amazon.com/sns/)
   - AWS का हिस्सा
   - स्केलेबल सॉल्यूशन

#### सेटअप स्टेप्स (उदाहरण - MSG91):

1. MSG91 पर खाता बनाएं
2. अपना मोबाइल नंबर और व्यवसाय विवरण सत्यापित करें
3. एक OTP टेम्पलेट बनाएं और DLT पंजीकरण करें
4. API Key प्राप्त करें
5. कोड में API को एकीकृत करें

```typescript
// उदाहरण कोड (MSG91):
const sendOTP = async (phoneNumbers: string[], otp: string) => {
  const apiKey = 'YOUR_MSG91_API_KEY'
  const senderId = 'YOUR_SENDER_ID'
  const templateId = 'YOUR_TEMPLATE_ID'
  
  for (const phoneNumber of phoneNumbers) {
    const response = await fetch('https://api.msg91.com/api/v5/otp', {
      method: 'POST',
      headers: {
        'authkey': apiKey,
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        template_id: templateId,
        mobile: phoneNumber,
        otp: otp
      })
    })
  }
}
```

### महत्वपूर्ण सुरक्षा नोट्स

⚠️ **प्रोडक्शन में ध्यान दें:**
- यूज़रनेम और पासवर्ड को कोड में हार्डकोड न करें
- Environment variables का उपयोग करें
- OTP की validity 5-10 मिनट तक सीमित रखें
- OTP को बैकएंड सर्वर पर जेनरेट करें, फ्रंटएंड पर नहीं
- SMS API keys को सुरक्षित रखें

---

## English Instructions

### How the OTP System Works

This application uses **Two-Factor Authentication (2FA)** for admin login.

### Admin Login Process

1. **Username and Password**
   - Username: `rkkhilrani`
   - Password: `1234`

2. **OTP Verification**
   - After entering username and password, a 6-digit OTP will be generated
   - This OTP will be sent to both numbers:
     - **+91-7895601505**
     - **+91-9828585300**

3. **Where the OTP Appears**
   - **In Toast Notification**: A notification will appear at the top-right of the screen showing both phone numbers
   - **In Browser Console**: For development purposes, the OTP is also printed in the browser console
   - **In OTP Dialog**: The screen where you enter the OTP will also display both numbers

4. **Entering the OTP**
   - Enter the 6-digit OTP in the input field
   - Click the "Verify" button

### Setup for Real SMS Sending (Production)

Currently, the OTP is only **displayed on screen**. To actually send SMS, you'll need an SMS gateway service:

#### Popular Indian SMS Services:

1. **Twilio** (https://www.twilio.com)
   - Internationally popular
   - Works in India
   - Easy API integration

2. **MSG91** (https://msg91.com)
   - Indian company
   - Supports OTP templates
   - Affordable rates

3. **Gupshup** (https://www.gupshup.io)
   - Very popular in India
   - OTP and promotional SMS
   - Good delivery rates

4. **Amazon SNS** (https://aws.amazon.com/sns/)
   - Part of AWS
   - Scalable solution

#### Setup Steps (Example - MSG91):

1. Create an account on MSG91
2. Verify your mobile number and business details
3. Create an OTP template and complete DLT registration
4. Obtain API Key
5. Integrate API in code

```typescript
// Example code (MSG91):
const sendOTP = async (phoneNumbers: string[], otp: string) => {
  const apiKey = 'YOUR_MSG91_API_KEY'
  const senderId = 'YOUR_SENDER_ID'
  const templateId = 'YOUR_TEMPLATE_ID'
  
  for (const phoneNumber of phoneNumbers) {
    const response = await fetch('https://api.msg91.com/api/v5/otp', {
      method: 'POST',
      headers: {
        'authkey': apiKey,
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        template_id: templateId,
        mobile: phoneNumber,
        otp: otp
      })
    })
  }
}
```

### Important Security Notes

⚠️ **For Production:**
- Don't hardcode username and password in code
- Use environment variables
- Limit OTP validity to 5-10 minutes
- Generate OTP on backend server, not frontend
- Keep SMS API keys secure

---

## Development Testing

### For Admin Login Testing:

1. Click "Admin" button in header
2. Enter credentials:
   - Username: `rkkhilrani`
   - Password: `1234`
3. Click "Continue"
4. Check the toast notification (top-right) - it will show both phone numbers
5. Check browser console (F12 > Console tab) - you'll see the OTP printed there
6. Enter the OTP shown in console
7. Click "Verify"

### Browser Console Access:

- **Chrome/Edge**: Press `F12` or `Ctrl+Shift+I` (Windows) / `Cmd+Option+I` (Mac)
- **Firefox**: Press `F12` or `Ctrl+Shift+K` (Windows) / `Cmd+Option+K` (Mac)
- Go to "Console" tab
- Look for message: `OTP for admin login: XXXXXX`

---

## Troubleshooting

### OTP टोस्ट नहीं दिख रहा है?
- स्क्रीन के ऊपर दाईं ओर देखें
- टोस्ट 8 सेकंड के लिए दिखता है
- अगर फिर भी न दिखे, ब्राउज़र कंसोल चेक करें

### OTP गलत बता रहा है?
- ब्राउज़र कंसोल में प्रिंट किया गया OTP दर्ज करें
- सुनिश्चित करें कि आपने सही 6 अंक दर्ज किए हैं

### Toast notification not showing?
- Look at the top-right of the screen
- Toast appears for 8 seconds
- If still not visible, check browser console

### OTP showing as incorrect?
- Enter the OTP printed in browser console
- Make sure you entered all 6 digits correctly
