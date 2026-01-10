import { useState, useRef, useEffect } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { SearchableSelect, EDUCATION_OPTIONS, OCCUPATION_OPTIONS } from '@/components/ui/searchable-select'
import { MultiSelect, MARITAL_STATUS_OPTIONS, RELIGION_OPTIONS, MOTHER_TONGUE_OPTIONS, OCCUPATION_PROFESSION_OPTIONS, COUNTRY_OPTIONS, DIET_PREFERENCE_OPTIONS, DRINKING_HABIT_OPTIONS, SMOKING_HABIT_OPTIONS, EMPLOYMENT_STATUS_OPTIONS, getStateOptionsForCountries, getCitiesForState, getCityOptionsForStates } from '@/components/ui/multi-select'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { DatePicker } from '@/components/ui/date-picker'
import { Checkbox } from '@/components/ui/checkbox'
import { UserPlus, CheckCircle, Info, CurrencyInr, Camera, Image, X, ArrowUp, ArrowDown, FloppyDisk, Sparkle, Warning, SpinnerGap, Gift, ShieldCheck, IdentificationCard, ArrowCounterClockwise, Upload, Rocket, Hourglass } from '@phosphor-icons/react'
import { toast } from 'sonner'
import { logger } from '@/lib/logger'
import { sendRegistrationEmailOtp, sendRegistrationMobileOtp } from '@/lib/notificationService'
import { validateSelfie } from '@/lib/azureFaceService'
import { CRITICAL_EDIT_FIELDS } from '@/lib/utils'
import type { Gender, MaritalStatus, Profile, MembershipPlan, DisabilityStatus, DietPreference, DrinkingHabit, SmokingHabit, ResidentialStatus } from '@/types/profile'
import { useTranslation, type Language } from '@/lib/translations'
import { generateBio, type BioGenerationParams } from '@/lib/aiFoundryService'
import { PhotoLightbox, useLightbox } from '@/components/PhotoLightbox'
import { TermsAndConditions } from '@/components/TermsAndConditions'
import { uploadPhoto, isBlobStorageAvailable, dataUrlToFile } from '@/lib/blobService'
import { CameraCapture } from '@/components/ui/CameraCapture'

// Country code to phone length mapping - comprehensive list
const COUNTRY_PHONE_LENGTHS: Record<string, { min: number; max: number; display: string; flag: string; name: string }> = {
  '+91': { min: 10, max: 10, display: '10', flag: '🇮🇳', name: 'India' },
  '+1': { min: 10, max: 10, display: '10', flag: '🇺🇸', name: 'USA/Canada' },
  '+44': { min: 10, max: 10, display: '10', flag: '🇬🇧', name: 'UK' },
  '+971': { min: 9, max: 9, display: '9', flag: '🇦🇪', name: 'UAE' },
  '+65': { min: 8, max: 8, display: '8', flag: '🇸🇬', name: 'Singapore' },
  '+61': { min: 9, max: 9, display: '9', flag: '🇦🇺', name: 'Australia' },
  '+64': { min: 9, max: 10, display: '9-10', flag: '🇳🇿', name: 'New Zealand' },
  '+49': { min: 10, max: 11, display: '10-11', flag: '🇩🇪', name: 'Germany' },
  '+33': { min: 9, max: 9, display: '9', flag: '🇫🇷', name: 'France' },
  '+81': { min: 10, max: 10, display: '10', flag: '🇯🇵', name: 'Japan' },
  '+86': { min: 11, max: 11, display: '11', flag: '🇨🇳', name: 'China' },
  '+966': { min: 9, max: 9, display: '9', flag: '🇸🇦', name: 'Saudi Arabia' },
  '+974': { min: 8, max: 8, display: '8', flag: '🇶🇦', name: 'Qatar' },
  '+973': { min: 8, max: 8, display: '8', flag: '🇧🇭', name: 'Bahrain' },
  '+968': { min: 8, max: 8, display: '8', flag: '🇴🇲', name: 'Oman' },
  '+965': { min: 8, max: 8, display: '8', flag: '🇰🇼', name: 'Kuwait' },
  '+60': { min: 9, max: 10, display: '9-10', flag: '🇲🇾', name: 'Malaysia' },
  '+353': { min: 9, max: 9, display: '9', flag: '🇮🇪', name: 'Ireland' },
  '+31': { min: 9, max: 9, display: '9', flag: '🇳🇱', name: 'Netherlands' },
  '+41': { min: 9, max: 9, display: '9', flag: '🇨🇭', name: 'Switzerland' },
  '+82': { min: 10, max: 11, display: '10-11', flag: '🇰🇷', name: 'South Korea' },
  '+852': { min: 8, max: 8, display: '8', flag: '🇭🇰', name: 'Hong Kong' },
  '+39': { min: 10, max: 10, display: '10', flag: '🇮🇹', name: 'Italy' },
  '+34': { min: 9, max: 9, display: '9', flag: '🇪🇸', name: 'Spain' },
  '+351': { min: 9, max: 9, display: '9', flag: '🇵🇹', name: 'Portugal' },
  '+43': { min: 10, max: 13, display: '10-13', flag: '🇦🇹', name: 'Austria' },
  '+32': { min: 9, max: 9, display: '9', flag: '🇧🇪', name: 'Belgium' },
  '+46': { min: 9, max: 9, display: '9', flag: '🇸🇪', name: 'Sweden' },
  '+47': { min: 8, max: 8, display: '8', flag: '🇳🇴', name: 'Norway' },
  '+45': { min: 8, max: 8, display: '8', flag: '🇩🇰', name: 'Denmark' },
  '+358': { min: 9, max: 10, display: '9-10', flag: '🇫🇮', name: 'Finland' },
  '+48': { min: 9, max: 9, display: '9', flag: '🇵🇱', name: 'Poland' },
  '+27': { min: 9, max: 9, display: '9', flag: '🇿🇦', name: 'South Africa' },
  '+234': { min: 10, max: 10, display: '10', flag: '🇳🇬', name: 'Nigeria' },
  '+254': { min: 9, max: 9, display: '9', flag: '🇰🇪', name: 'Kenya' },
  '+92': { min: 10, max: 10, display: '10', flag: '🇵🇰', name: 'Pakistan' },
  '+880': { min: 10, max: 10, display: '10', flag: '🇧🇩', name: 'Bangladesh' },
  '+94': { min: 9, max: 9, display: '9', flag: '🇱🇰', name: 'Sri Lanka' },
  '+977': { min: 10, max: 10, display: '10', flag: '🇳🇵', name: 'Nepal' },
  '+63': { min: 10, max: 10, display: '10', flag: '🇵🇭', name: 'Philippines' },
  '+66': { min: 9, max: 9, display: '9', flag: '🇹🇭', name: 'Thailand' },
  '+84': { min: 9, max: 10, display: '9-10', flag: '🇻🇳', name: 'Vietnam' },
  '+62': { min: 10, max: 12, display: '10-12', flag: '🇮🇩', name: 'Indonesia' },
  '+55': { min: 10, max: 11, display: '10-11', flag: '🇧🇷', name: 'Brazil' },
  '+52': { min: 10, max: 10, display: '10', flag: '🇲🇽', name: 'Mexico' },
  '+7': { min: 10, max: 10, display: '10', flag: '🇷🇺', name: 'Russia' },
  '+90': { min: 10, max: 10, display: '10', flag: '🇹🇷', name: 'Turkey' },
  '+20': { min: 10, max: 10, display: '10', flag: '🇪🇬', name: 'Egypt' },
  '+212': { min: 9, max: 9, display: '9', flag: '🇲🇦', name: 'Morocco' },
  '+216': { min: 8, max: 8, display: '8', flag: '🇹🇳', name: 'Tunisia' },
  '+233': { min: 9, max: 9, display: '9', flag: '🇬🇭', name: 'Ghana' },
  '+256': { min: 9, max: 9, display: '9', flag: '🇺🇬', name: 'Uganda' },
  '+255': { min: 9, max: 9, display: '9', flag: '🇹🇿', name: 'Tanzania' },
  '+263': { min: 9, max: 9, display: '9', flag: '🇿🇼', name: 'Zimbabwe' },
  '+230': { min: 8, max: 8, display: '8', flag: '🇲🇺', name: 'Mauritius' },
  '+679': { min: 7, max: 7, display: '7', flag: '🇫🇯', name: 'Fiji' },
}

// Helper function to get phone length for a country code
const getPhoneLengthInfo = (countryCode: string) => {
  return COUNTRY_PHONE_LENGTHS[countryCode] || { min: 7, max: 15, display: '7-15' }
}

// Helper function to validate phone number length
const isValidPhoneLength = (phone: string, countryCode: string): boolean => {
  const lengthInfo = getPhoneLengthInfo(countryCode)
  return phone.length >= lengthInfo.min && phone.length <= lengthInfo.max
}

// States/Provinces by Country
const STATES_BY_COUNTRY: Record<string, string[]> = {
  'India': [
    'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 
    'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 
    'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 
    'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab', 
    'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura', 
    'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
    'Andaman and Nicobar Islands', 'Chandigarh', 'Dadra and Nagar Haveli and Daman and Diu',
    'Delhi', 'Jammu and Kashmir', 'Ladakh', 'Lakshadweep', 'Puducherry'
  ],
  'United States': [
    'Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado', 
    'Connecticut', 'Delaware', 'Florida', 'Georgia', 'Hawaii', 'Idaho', 
    'Illinois', 'Indiana', 'Iowa', 'Kansas', 'Kentucky', 'Louisiana', 
    'Maine', 'Maryland', 'Massachusetts', 'Michigan', 'Minnesota', 
    'Mississippi', 'Missouri', 'Montana', 'Nebraska', 'Nevada', 
    'New Hampshire', 'New Jersey', 'New Mexico', 'New York', 'North Carolina', 
    'North Dakota', 'Ohio', 'Oklahoma', 'Oregon', 'Pennsylvania', 'Rhode Island', 
    'South Carolina', 'South Dakota', 'Tennessee', 'Texas', 'Utah', 'Vermont', 
    'Virginia', 'Washington', 'West Virginia', 'Wisconsin', 'Wyoming',
    'District of Columbia', 'Puerto Rico'
  ],
  'United Kingdom': [
    'England', 'Scotland', 'Wales', 'Northern Ireland',
    'Greater London', 'West Midlands', 'Greater Manchester', 'West Yorkshire',
    'South Yorkshire', 'Merseyside', 'Tyne and Wear', 'Kent', 'Essex', 'Hampshire',
    'Surrey', 'Hertfordshire', 'Lancashire', 'Nottinghamshire', 'Derbyshire'
  ],
  'Canada': [
    'Alberta', 'British Columbia', 'Manitoba', 'New Brunswick', 
    'Newfoundland and Labrador', 'Nova Scotia', 'Ontario', 'Prince Edward Island', 
    'Quebec', 'Saskatchewan', 'Northwest Territories', 'Nunavut', 'Yukon'
  ],
  'Australia': [
    'New South Wales', 'Victoria', 'Queensland', 'Western Australia', 
    'South Australia', 'Tasmania', 'Australian Capital Territory', 'Northern Territory'
  ],
  'UAE': [
    'Abu Dhabi', 'Dubai', 'Sharjah', 'Ajman', 'Umm Al Quwain', 'Ras Al Khaimah', 'Fujairah'
  ],
  'Singapore': ['Singapore'],
  'Germany': [
    'Baden-Württemberg', 'Bavaria', 'Berlin', 'Brandenburg', 'Bremen', 
    'Hamburg', 'Hesse', 'Lower Saxony', 'Mecklenburg-Vorpommern', 
    'North Rhine-Westphalia', 'Rhineland-Palatinate', 'Saarland', 
    'Saxony', 'Saxony-Anhalt', 'Schleswig-Holstein', 'Thuringia'
  ],
  'New Zealand': [
    'Auckland', 'Bay of Plenty', 'Canterbury', 'Gisborne', 'Hawke\'s Bay', 
    'Manawatu-Whanganui', 'Marlborough', 'Nelson', 'Northland', 'Otago', 
    'Southland', 'Taranaki', 'Tasman', 'Waikato', 'Wellington', 'West Coast'
  ],
  'Saudi Arabia': [
    'Riyadh', 'Makkah', 'Madinah', 'Eastern Province', 'Asir', 
    'Tabuk', 'Hail', 'Northern Borders', 'Jazan', 'Najran', 'Al Bahah', 'Al Jawf', 'Qassim'
  ],
  'Qatar': ['Doha', 'Al Rayyan', 'Al Wakrah', 'Al Khor', 'Al Shamal', 'Umm Salal', 'Al Daayen', 'Madinat ash Shamal'],
  'Kuwait': ['Al Asimah', 'Hawalli', 'Farwaniya', 'Mubarak Al-Kabeer', 'Ahmadi', 'Jahra'],
  'Oman': ['Muscat', 'Dhofar', 'Musandam', 'Al Buraimi', 'Ad Dakhiliyah', 'Al Batinah North', 'Al Batinah South', 'Ash Sharqiyah North', 'Ash Sharqiyah South', 'Al Wusta', 'Az Zahirah'],
  'Bahrain': ['Capital', 'Muharraq', 'Northern', 'Southern'],
  'Malaysia': [
    'Johor', 'Kedah', 'Kelantan', 'Malacca', 'Negeri Sembilan', 'Pahang', 
    'Perak', 'Perlis', 'Penang', 'Sabah', 'Sarawak', 'Selangor', 'Terengganu',
    'Kuala Lumpur', 'Labuan', 'Putrajaya'
  ],
  'Netherlands': [
    'Drenthe', 'Flevoland', 'Friesland', 'Gelderland', 'Groningen', 
    'Limburg', 'North Brabant', 'North Holland', 'Overijssel', 
    'South Holland', 'Utrecht', 'Zeeland'
  ],
  'France': [
    'Île-de-France', 'Provence-Alpes-Côte d\'Azur', 'Auvergne-Rhône-Alpes', 
    'Occitanie', 'Nouvelle-Aquitaine', 'Hauts-de-France', 'Grand Est', 
    'Pays de la Loire', 'Brittany', 'Normandy', 'Bourgogne-Franche-Comté', 
    'Centre-Val de Loire', 'Corsica'
  ],
  'Ireland': ['Connacht', 'Leinster', 'Munster', 'Ulster', 'Dublin', 'Cork', 'Galway', 'Limerick'],
  'Switzerland': [
    'Zürich', 'Bern', 'Lucerne', 'Uri', 'Schwyz', 'Obwalden', 'Nidwalden', 
    'Glarus', 'Zug', 'Fribourg', 'Solothurn', 'Basel-Stadt', 'Basel-Landschaft', 
    'Schaffhausen', 'Appenzell Ausserrhoden', 'Appenzell Innerrhoden', 'St. Gallen', 
    'Graubünden', 'Aargau', 'Thurgau', 'Ticino', 'Vaud', 'Valais', 'Neuchâtel', 'Geneva', 'Jura'
  ],
  'Japan': [
    'Hokkaido', 'Aomori', 'Iwate', 'Miyagi', 'Akita', 'Yamagata', 'Fukushima',
    'Ibaraki', 'Tochigi', 'Gunma', 'Saitama', 'Chiba', 'Tokyo', 'Kanagawa',
    'Niigata', 'Toyama', 'Ishikawa', 'Fukui', 'Yamanashi', 'Nagano', 'Gifu',
    'Shizuoka', 'Aichi', 'Mie', 'Shiga', 'Kyoto', 'Osaka', 'Hyogo', 'Nara',
    'Wakayama', 'Tottori', 'Shimane', 'Okayama', 'Hiroshima', 'Yamaguchi',
    'Tokushima', 'Kagawa', 'Ehime', 'Kochi', 'Fukuoka', 'Saga', 'Nagasaki',
    'Kumamoto', 'Oita', 'Miyazaki', 'Kagoshima', 'Okinawa'
  ],
  'South Korea': [
    'Seoul', 'Busan', 'Daegu', 'Incheon', 'Gwangju', 'Daejeon', 'Ulsan', 'Sejong',
    'Gyeonggi', 'Gangwon', 'North Chungcheong', 'South Chungcheong', 
    'North Jeolla', 'South Jeolla', 'North Gyeongsang', 'South Gyeongsang', 'Jeju'
  ],
  'Hong Kong': ['Hong Kong Island', 'Kowloon', 'New Territories'],
  'Other': []
}

// Helper function to get states for a country
const getStatesForCountry = (country: string): string[] => {
  return STATES_BY_COUNTRY[country] || []
}

// Height options with order index for comparison (1-inch increments)
const HEIGHT_OPTIONS = [
  { value: "4'0\"", label: "4'0\" (122 cm)", order: 1 },
  { value: "4'1\"", label: "4'1\" (124 cm)", order: 2 },
  { value: "4'2\"", label: "4'2\" (127 cm)", order: 3 },
  { value: "4'3\"", label: "4'3\" (130 cm)", order: 4 },
  { value: "4'4\"", label: "4'4\" (132 cm)", order: 5 },
  { value: "4'5\"", label: "4'5\" (135 cm)", order: 6 },
  { value: "4'6\"", label: "4'6\" (137 cm)", order: 7 },
  { value: "4'7\"", label: "4'7\" (140 cm)", order: 8 },
  { value: "4'8\"", label: "4'8\" (142 cm)", order: 9 },
  { value: "4'9\"", label: "4'9\" (145 cm)", order: 10 },
  { value: "4'10\"", label: "4'10\" (147 cm)", order: 11 },
  { value: "4'11\"", label: "4'11\" (150 cm)", order: 12 },
  { value: "5'0\"", label: "5'0\" (152 cm)", order: 13 },
  { value: "5'1\"", label: "5'1\" (155 cm)", order: 14 },
  { value: "5'2\"", label: "5'2\" (157 cm)", order: 15 },
  { value: "5'3\"", label: "5'3\" (160 cm)", order: 16 },
  { value: "5'4\"", label: "5'4\" (163 cm)", order: 17 },
  { value: "5'5\"", label: "5'5\" (165 cm)", order: 18 },
  { value: "5'6\"", label: "5'6\" (168 cm)", order: 19 },
  { value: "5'7\"", label: "5'7\" (170 cm)", order: 20 },
  { value: "5'8\"", label: "5'8\" (173 cm)", order: 21 },
  { value: "5'9\"", label: "5'9\" (175 cm)", order: 22 },
  { value: "5'10\"", label: "5'10\" (178 cm)", order: 23 },
  { value: "5'11\"", label: "5'11\" (180 cm)", order: 24 },
  { value: "6'0\"", label: "6'0\" (183 cm)", order: 25 },
  { value: "6'1\"", label: "6'1\" (185 cm)", order: 26 },
  { value: "6'2\"", label: "6'2\" (188 cm)", order: 27 },
  { value: "6'3\"", label: "6'3\" (191 cm)", order: 28 },
  { value: "6'4\"", label: "6'4\" (193 cm)", order: 29 },
  { value: "6'5\"", label: "6'5\" (196 cm)", order: 30 },
  { value: "6'6\"", label: "6'6\" (198 cm)", order: 31 },
  { value: "6'7\"", label: "6'7\" (201 cm)", order: 32 },
  { value: "6'8\"", label: "6'8\" (203 cm)", order: 33 },
  { value: "6'9\"", label: "6'9\" (206 cm)", order: 34 },
  { value: "6'10\"", label: "6'10\" (208 cm)", order: 35 },
  { value: "6'11\"", label: "6'11\" (211 cm)", order: 36 },
  { value: "7'0\"", label: "7'0\" (213 cm)", order: 37 },
]

// Income options with order index for comparison
const INCOME_OPTIONS = [
  { value: 'no-income', labelHi: 'कोई आय नहीं', labelEn: 'No Income', order: 0 },
  { value: 'below-1-lakh', labelHi: '₹1 लाख से कम', labelEn: 'Below ₹1 Lakh', order: 1 },
  { value: '1-2-lakh', labelHi: '₹1-2 लाख', labelEn: '₹1-2 Lakh', order: 2 },
  { value: '2-3-lakh', labelHi: '₹2-3 लाख', labelEn: '₹2-3 Lakh', order: 3 },
  { value: '3-4-lakh', labelHi: '₹3-4 लाख', labelEn: '₹3-4 Lakh', order: 4 },
  { value: '4-5-lakh', labelHi: '₹4-5 लाख', labelEn: '₹4-5 Lakh', order: 5 },
  { value: '5-7.5-lakh', labelHi: '₹5-7.5 लाख', labelEn: '₹5-7.5 Lakh', order: 6 },
  { value: '7.5-10-lakh', labelHi: '₹7.5-10 लाख', labelEn: '₹7.5-10 Lakh', order: 7 },
  { value: '10-15-lakh', labelHi: '₹10-15 लाख', labelEn: '₹10-15 Lakh', order: 8 },
  { value: '15-20-lakh', labelHi: '₹15-20 लाख', labelEn: '₹15-20 Lakh', order: 9 },
  { value: '20-25-lakh', labelHi: '₹20-25 लाख', labelEn: '₹20-25 Lakh', order: 10 },
  { value: '25-35-lakh', labelHi: '₹25-35 लाख', labelEn: '₹25-35 Lakh', order: 11 },
  { value: '35-50-lakh', labelHi: '₹35-50 लाख', labelEn: '₹35-50 Lakh', order: 12 },
  { value: '50-75-lakh', labelHi: '₹50-75 लाख', labelEn: '₹50-75 Lakh', order: 13 },
  { value: '75-1-crore', labelHi: '₹75 लाख - 1 करोड़', labelEn: '₹75 Lakh - 1 Crore', order: 14 },
  { value: 'above-1-crore', labelHi: '₹1 करोड़ से अधिक', labelEn: 'Above ₹1 Crore', order: 15 },
]

// Helper to get height order from value
const getHeightOrder = (value: string): number => {
  const option = HEIGHT_OPTIONS.find(h => h.value === value)
  return option?.order || 0
}

// Helper to get income order from value
const getIncomeOrder = (value: string): number => {
  const option = INCOME_OPTIONS.find(i => i.value === value)
  return option?.order || 0
}

interface MembershipSettings {
  sixMonthPrice: number
  oneYearPrice: number
  sixMonthDuration: number
  oneYearDuration: number
  discountPercentage: number
  discountEnabled: boolean
  discountEndDate: string | null
  // Plan-specific limits
  freePlanChatLimit: number
  freePlanContactLimit: number
  sixMonthChatLimit: number
  sixMonthContactLimit: number
  oneYearChatLimit: number
  oneYearContactLimit: number
  // Payment details
  upiId: string
  bankName: string
  accountNumber: string
  ifscCode: string
  accountHolderName: string
  qrCodeImage: string
  // Boost pack settings
  boostPackEnabled?: boolean
  boostPackPrice?: number
  boostPackInterestLimit?: number
  boostPackContactLimit?: number
}

interface RegistrationDialogProps {
  open: boolean
  onClose: () => void
  onSubmit: (profile: Partial<Profile>) => void
  language: Language
  existingProfiles?: Profile[]
  editProfile?: Profile | null
  membershipSettings?: MembershipSettings
  isAdminMode?: boolean  // Admin mode: skip payment, allow all field edits
  initialStep?: number   // Initial step to start at (1-7), useful for upgrade flows
}

export function RegistrationDialog({ open, onClose, onSubmit, language, existingProfiles = [], editProfile = null, membershipSettings, isAdminMode = false, initialStep }: RegistrationDialogProps) {
  const t = useTranslation(language)
  const [step, setStep] = useState(1)
  const [photos, setPhotos] = useState<{ file: File; preview: string }[]>([])
  const [_selfieFile, setSelfieFile] = useState<File | null>(null)
  const [selfiePreview, setSelfiePreview] = useState<string | undefined>(undefined)
  const [_idProofFile, setIdProofFile] = useState<File | null>(null)
  const [idProofPreview, setIdProofPreview] = useState<string | null>(null)
  const [idProofType, setIdProofType] = useState<'aadhaar' | 'pan' | 'driving-license' | 'passport' | 'voter-id'>('aadhaar')
  const [showCamera, setShowCamera] = useState(false)
  const [isCameraReady, setIsCameraReady] = useState(false)
  const [isCapturingSelfie, setIsCapturingSelfie] = useState(false)
  const [availableCameras, setAvailableCameras] = useState<MediaDeviceInfo[]>([])
  const [selectedCameraId, setSelectedCameraId] = useState<string>('')
  const [faceCoverageValid, setFaceCoverageValid] = useState(false)
  const [faceCoveragePercent, setFaceCoveragePercent] = useState(0)
  const [_selfieZoom, setSelfieZoom] = useState(1) // Zoom level for selfie (1 = 100%)
  const [liveZoom, setLiveZoom] = useState(1) // Live zoom for camera preview
  const [isGeneratingBio, setIsGeneratingBio] = useState(false)
  const [registrationGeoLocation, setRegistrationGeoLocation] = useState<{
    latitude: number
    longitude: number
    accuracy: number
    city?: string
    region?: string
    country?: string
    capturedAt: string
  } | null>(null)
  const { lightboxState, openLightbox, closeLightbox } = useLightbox()
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  
  const [emailOtp, setEmailOtp] = useState('')
  const [mobileOtp, setMobileOtp] = useState('')
  const [generatedEmailOtp, setGeneratedEmailOtp] = useState('')
  const [generatedMobileOtp, setGeneratedMobileOtp] = useState('')
  const [emailVerified, setEmailVerified] = useState(false)
  const [mobileVerified, setMobileVerified] = useState(false)
  const [showVerification, setShowVerification] = useState(false)
  const [termsAccepted, setTermsAccepted] = useState(false)
  const [showTerms, setShowTerms] = useState(false)
  
  // OTP rate limiting - prevent spam
  const [otpResendCount, setOtpResendCount] = useState(0)
  const [otpLastSentAt, setOtpLastSentAt] = useState<number>(0)
  const [otpCooldownRemaining, setOtpCooldownRemaining] = useState(0)
  const OTP_RESEND_COOLDOWN_SECONDS = 30 // 30 seconds between resends
  const OTP_MAX_RESEND_ATTEMPTS = 5 // Max resend attempts per session
  
  // Custom city input when user selects "Other City"
  const [customCity, setCustomCity] = useState('')
  
  // Payment screenshot state for paid plans - supports multiple screenshots
  const [paymentScreenshotPreviews, setPaymentScreenshotPreviews] = useState<string[]>([])
  const [paymentScreenshotFiles, setPaymentScreenshotFiles] = useState<File[]>([])
  const [brokenPaymentImages, setBrokenPaymentImages] = useState<Set<number>>(new Set())  
  // Camera capture dialogs for ID proof, photos, and payment screenshots
  const [showIdProofCamera, setShowIdProofCamera] = useState(false)
  const [showPhotoCamera, setShowPhotoCamera] = useState(false)
  const [showPaymentCamera, setShowPaymentCamera] = useState(false)
  
  // DigiLocker verification state (OAuth flow - no Aadhaar number input)
  const [_digilockerVerifying, _setDigilockerVerifying] = useState(false)
  const [digilockerVerified, setDigilockerVerified] = useState(false)
  const [digilockerData, setDigilockerData] = useState<{
    name: string
    dob: string
    gender: 'male' | 'female'
    verifiedAt: string
    digilockerID: string
    aadhaarLastFour?: string
  } | null>(null)
  
  const [formData, setFormData] = useState({
    fullName: '',
    profileCreatedFor: undefined as 'Self' | 'Daughter' | 'Son' | 'Brother' | 'Sister' | 'Other' | undefined,
    otherRelation: '',
    dateOfBirth: '',
    birthTime: '',
    birthPlace: '',
    horoscopeMatching: 'not-mandatory' as 'mandatory' | 'not-mandatory' | 'decide-later' | 'preferred',
    diet: '' as '' | 'veg' | 'non-veg' | 'occasionally-non-veg' | 'jain' | 'vegan',
    drinkingHabit: '' as '' | 'never' | 'occasionally' | 'regularly',
    smokingHabit: '' as '' | 'never' | 'occasionally' | 'regularly',
    annualIncome: '' as string,
    profession: '' as string,
    position: '' as string,
    gender: undefined as Gender | undefined,
    religion: '',
    caste: '',
    motherTongue: '',
    education: '',
    occupation: '',
    location: '',
    state: '',
    country: 'India',
    residentialStatus: undefined as ResidentialStatus | undefined,
    maritalStatus: undefined as MaritalStatus | undefined,
    email: '',
    countryCode: '+91',
    mobile: '',
    height: '',
    weight: '',
    disability: 'no' as DisabilityStatus,
    disabilityDetails: '',
    bio: '',
    familyDetails: '',
    membershipPlan: undefined as MembershipPlan | undefined,
    // Partner Preferences
    partnerAgeMin: undefined as number | undefined,
    partnerAgeMax: undefined as number | undefined,
    partnerHeightMin: '',
    partnerHeightMax: '',
    partnerEducation: [] as string[],
    partnerEmploymentStatus: [] as string[],
    partnerOccupation: [] as string[],
    partnerLivingCountry: [] as string[],
    partnerLivingState: [] as string[],
    partnerLocation: [] as string[],
    partnerCountry: [] as string[],
    partnerReligion: [] as string[],
    partnerCaste: [] as string[],
    partnerMotherTongue: [] as string[],
    partnerMaritalStatus: [] as MaritalStatus[],
    partnerDiet: [] as DietPreference[],
    partnerDrinking: [] as DrinkingHabit[],
    partnerSmoking: [] as SmokingHabit[],
    partnerManglik: 'doesnt-matter' as 'yes' | 'no' | 'doesnt-matter',
    partnerDisability: [] as DisabilityStatus[],
    partnerAnnualIncomeMin: '',
    partnerAnnualIncomeMax: ''
  })

  // Default values for fields that should have a pre-selected value
  const defaultValues = {
    disability: 'no' as DisabilityStatus,
    horoscopeMatching: 'not-mandatory' as 'mandatory' | 'not-mandatory' | 'decide-later' | 'preferred',
    country: 'India',
    partnerManglik: 'doesnt-matter' as 'yes' | 'no' | 'doesnt-matter'
  }

  // Helper function to get missing fields for each step
  const getMissingFields = (stepNum: number): string[] => {
    const missing: string[] = []
    
    if (stepNum === 1 && !isAdminMode) {
      if (!(formData.fullName || '').trim()) missing.push(language === 'hi' ? 'पूरा नाम' : 'Full Name')
      if (!formData.dateOfBirth) missing.push(language === 'hi' ? 'जन्म तिथि' : 'Date of Birth')
      if (!formData.gender) missing.push(language === 'hi' ? 'लिंग' : 'Gender')
      if (!(formData.religion || '').trim()) missing.push(language === 'hi' ? 'धर्म' : 'Religion')
      if (!(formData.motherTongue || '').trim()) missing.push(language === 'hi' ? 'मातृभाषा' : 'Mother Tongue')
      if (!formData.height) missing.push(language === 'hi' ? 'ऊंचाई' : 'Height')
      if (!formData.maritalStatus) missing.push(language === 'hi' ? 'वैवाहिक स्थिति' : 'Marital Status')
      if (!formData.profileCreatedFor) missing.push(language === 'hi' ? 'प्रोफ़ाइल किसके लिए' : 'Profile Created For')
      if (formData.profileCreatedFor === 'Other' && !(formData.otherRelation || '').trim()) {
        missing.push(language === 'hi' ? 'अन्य संबंध विवरण' : 'Other Relation Details')
      }
      if ((formData.horoscopeMatching || 'not-mandatory') === 'mandatory') {
        if (!formData.birthTime) missing.push(language === 'hi' ? 'जन्म समय' : 'Birth Time')
        if (!formData.birthPlace) missing.push(language === 'hi' ? 'जन्म स्थान' : 'Birth Place')
      }
      if (!formData.disability) missing.push(language === 'hi' ? 'दिव्यांग स्थिति' : 'Differently Abled')
    } else if (stepNum === 1 && isAdminMode) {
      if (!(formData.fullName || '').trim()) missing.push(language === 'hi' ? 'पूरा नाम' : 'Full Name')
      if (!formData.gender) missing.push(language === 'hi' ? 'लिंग' : 'Gender')
    } else if (stepNum === 2 && !isAdminMode) {
      if (!formData.education) missing.push(language === 'hi' ? 'शिक्षा' : 'Education')
      if (!formData.occupation) missing.push(language === 'hi' ? 'रोजगार स्थिति' : 'Employment Status')
    } else if (stepNum === 3 && !isAdminMode) {
      if (!formData.location || formData.location === '__other__') missing.push(language === 'hi' ? 'शहर' : 'City')
      if (!formData.state) missing.push(language === 'hi' ? 'राज्य/प्रांत' : 'State/Province')
      if (!formData.country) missing.push(language === 'hi' ? 'देश' : 'Country')
      if (!formData.email) missing.push(language === 'hi' ? 'ईमेल' : 'Email')
      if (!formData.mobile) missing.push(language === 'hi' ? 'मोबाइल' : 'Mobile')
      if (formData.country !== 'India' && !formData.residentialStatus) {
        missing.push(language === 'hi' ? 'निवास स्थिति' : 'Residential Status')
      }
    } else if (stepNum === 4 && !isAdminMode) {
      if (photos.length === 0) missing.push(language === 'hi' ? 'फोटो' : 'Photos')
      if (!selfiePreview) missing.push(language === 'hi' ? 'सेल्फी' : 'Selfie')
      if (!faceCoverageValid) missing.push(language === 'hi' ? 'चेहरा स्पष्ट नहीं' : 'Face not clear in selfie')
      if (!isEditMode && !idProofPreview) missing.push(language === 'hi' ? 'पहचान प्रमाण' : 'ID Proof')
    } else if (stepNum === 5 && !isAdminMode) {
      if (!(formData.bio || '').trim()) missing.push(language === 'hi' ? 'परिचय' : 'About Me')
    }
    
    return missing
  }

  const STORAGE_KEY = 'registration_draft'
  const isEditMode = !!editProfile
  
  // Helper to show admin re-verification indicator on critical fields in Edit mode
  const AdminVerificationBadge = ({ field }: { field?: string }) => {
    if (!isEditMode || isAdminMode) return null
    // Only show for critical fields that require admin re-verification
    const criticalFields = ['gender', 'photos', 'selfieUrl', 'mobile', 'email', 'bio', 'familyDetails']
    if (field && !criticalFields.includes(field)) return null
    return (
      <span className="ml-1.5 text-[10px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 font-medium whitespace-nowrap">
        ⚠️ {language === 'hi' ? 'पुनः सत्यापन' : 'Re-verification'}
      </span>
    )
  }
  
  // Payment-only mode: when admin has verified face/ID and returned profile for payment
  // In this mode, only step 7 (membership/payment) is accessible, other steps are frozen
  const isPaymentOnlyMode = isEditMode && editProfile?.returnedForPayment === true
  
  // Payment pending verification mode: when user has submitted payment and waiting for admin
  const isPaymentPendingVerification = isEditMode && 
    editProfile?.paymentStatus === 'pending' && 
    (editProfile?.paymentScreenshotUrl || (editProfile?.paymentScreenshotUrls && editProfile.paymentScreenshotUrls.length > 0))

  // Helper to get human-readable field names
  const getFieldLabel = (field: string): string => {
    const labels: Record<string, { hi: string; en: string }> = {
      fullName: { hi: 'पूरा नाम', en: 'Full Name' },
      firstName: { hi: 'पहला नाम', en: 'First Name' },
      lastName: { hi: 'उपनाम', en: 'Last Name' },
      dateOfBirth: { hi: 'जन्म तिथि', en: 'Date of Birth' },
      age: { hi: 'आयु', en: 'Age' },
      gender: { hi: 'लिंग', en: 'Gender' },
      email: { hi: 'ईमेल', en: 'Email' },
      mobile: { hi: 'मोबाइल', en: 'Mobile' },
      photos: { hi: 'फोटो', en: 'Photos' },
      selfieUrl: { hi: 'सेल्फी', en: 'Selfie' },
      idProofUrl: { hi: 'पहचान प्रमाण', en: 'ID Proof' },
      idProofType: { hi: 'पहचान प्रकार', en: 'ID Proof Type' },
      religion: { hi: 'धर्म', en: 'Religion' },
      caste: { hi: 'जाति', en: 'Caste' },
      motherTongue: { hi: 'मातृभाषा', en: 'Mother Tongue' },
      education: { hi: 'शिक्षा', en: 'Education' },
      occupation: { hi: 'रोजगार स्थिति', en: 'Employment Status' },
      position: { hi: 'व्यवसाय/पेशा', en: 'Occupation/Profession' },
      height: { hi: 'ऊंचाई', en: 'Height' },
      weight: { hi: 'वजन', en: 'Weight' },
      maritalStatus: { hi: 'वैवाहिक स्थिति', en: 'Marital Status' },
      country: { hi: 'देश', en: 'Country' },
      state: { hi: 'राज्य', en: 'State' },
      location: { hi: 'शहर', en: 'City' },
      city: { hi: 'शहर', en: 'City' },
      residentialStatus: { hi: 'आवासीय स्थिति', en: 'Residential Status' },
      bio: { hi: 'परिचय', en: 'About Me' },
      familyDetails: { hi: 'परिवार विवरण', en: 'Family Details' },
      dietPreference: { hi: 'आहार', en: 'Diet' },
      drinkingHabit: { hi: 'पीने की आदत', en: 'Drinking Habit' },
      smokingHabit: { hi: 'धूम्रपान', en: 'Smoking Habit' },
      salary: { hi: 'वार्षिक आय', en: 'Annual Income' },
      disability: { hi: 'दिव्यांगता', en: 'Disability' },
      disabilityDetails: { hi: 'दिव्यांगता विवरण', en: 'Disability Details' },
      birthTime: { hi: 'जन्म समय', en: 'Birth Time' },
      birthPlace: { hi: 'जन्म स्थान', en: 'Birth Place' },
      horoscopeMatching: { hi: 'कुंडली मिलान', en: 'Horoscope Matching' },
      relationToProfile: { hi: 'प्रोफ़ाइल किसके लिए', en: 'Profile Created For' },
      membershipPlan: { hi: 'सदस्यता योजना', en: 'Membership Plan' },
      // Partner Preferences
      partnerPreferences: { hi: 'साथी वरीयताएं', en: 'Partner Preferences' },
      partnerAge: { hi: 'साथी आयु', en: 'Partner Age' },
      partnerHeight: { hi: 'साथी ऊंचाई', en: 'Partner Height' },
      partnerEducation: { hi: 'साथी शिक्षा', en: 'Partner Education' },
      partnerOccupation: { hi: 'साथी व्यवसाय', en: 'Partner Occupation' },
      partnerLocation: { hi: 'साथी स्थान', en: 'Partner Location' },
      partnerReligion: { hi: 'साथी धर्म', en: 'Partner Religion' },
      partnerCaste: { hi: 'साथी जाति', en: 'Partner Caste' },
      partnerMotherTongue: { hi: 'साथी मातृभाषा', en: 'Partner Mother Tongue' },
      partnerMaritalStatus: { hi: 'साथी वैवाहिक स्थिति', en: 'Partner Marital Status' },
      partnerDiet: { hi: 'साथी आहार', en: 'Partner Diet' },
      partnerDrinking: { hi: 'साथी पीने की आदत', en: 'Partner Drinking' },
      partnerSmoking: { hi: 'साथी धूम्रपान', en: 'Partner Smoking' },
      partnerManglik: { hi: 'साथी मांगलिक', en: 'Partner Manglik' },
      partnerDisability: { hi: 'साथी दिव्यांगता', en: 'Partner Disability' },
      partnerEmploymentStatus: { hi: 'साथी रोजगार', en: 'Partner Employment' },
      partnerAnnualIncome: { hi: 'साथी वार्षिक आय', en: 'Partner Annual Income' },
    }
    return labels[field]?.[language] || field
  }

  // Get list of changed fields categorized as critical or non-critical
  const getChangedFieldsSummary = (): { critical: string[]; nonCritical: string[] } => {
    if (!isEditMode || !editProfile) return { critical: [], nonCritical: [] }
    
    const critical: string[] = []
    const nonCritical: string[] = []
    
    // Helper to normalize empty/undefined values for comparison
    // Treats undefined, null, and empty string as equivalent (no value)
    const normalize = (val: unknown): string => {
      if (val === undefined || val === null || val === '') return ''
      return String(val)
    }
    
    // Build normalized values for comparison
    // For mobile: strip all spaces from both old and new values before comparing
    const normalizedNewMobile = `${formData.countryCode || '+91'}${formData.mobile}`.replace(/\s/g, '')
    const normalizedOldMobile = (editProfile.mobile || '').replace(/\s/g, '')
    
    // Check critical fields
    if (normalize(editProfile.fullName) !== normalize(formData.fullName)) critical.push('fullName')
    if (normalize(editProfile.dateOfBirth) !== normalize(formData.dateOfBirth)) critical.push('dateOfBirth')
    if (normalize(editProfile.gender) !== normalize(formData.gender)) critical.push('gender')
    if (normalize(editProfile.email) !== normalize(formData.email)) critical.push('email')
    if (normalizedOldMobile !== normalizedNewMobile) critical.push('mobile')
    
    // Check photos - compare URLs
    // In edit mode, photos are loaded with preview = original URL
    // A photo is changed if it's a new base64 data URL or a different URL
    const oldPhotos = editProfile.photos || []
    const newPhotos = photos.map(p => p.preview)
    
    const photosChanged = (() => {
      // Different count = definitely changed
      if (oldPhotos.length !== newPhotos.length) return true
      
      // Compare each photo
      for (let i = 0; i < newPhotos.length; i++) {
        const oldPhoto = oldPhotos[i] || ''
        const newPhoto = newPhotos[i] || ''
        
        // If new photo is a data URL, it's a newly selected photo (changed)
        if (newPhoto.startsWith('data:')) return true
        
        // If URLs are different, photo was changed
        if (oldPhoto !== newPhoto) return true
      }
      return false
    })()
    
    if (photosChanged) critical.push('photos')
    
    // Check selfie - changed if it's a new data URL (newly selected)
    // In edit mode, selfiePreview is loaded with the original URL
    const selfieChanged = (() => {
      if (!selfiePreview) return false // No selfie = no change
      
      // If selfie is a new data URL, it's been changed
      if (selfiePreview.startsWith('data:')) return true
      
      // If URLs are different (shouldn't happen normally), it's changed
      if (editProfile.selfieUrl !== selfiePreview) return true
      
      return false
    })()
    
    if (selfieChanged) critical.push('selfieUrl')
    
    // Check ID proof - changed if it's a new data URL or different URL
    const idProofChanged = (() => {
      if (!idProofPreview) return false
      if (idProofPreview.startsWith('data:')) return true
      if (editProfile.idProofUrl !== idProofPreview) return true
      return false
    })()
    
    if (idProofChanged) critical.push('idProofUrl')
    
    // Check bio and familyDetails - these are CRITICAL (public facing content)
    if (normalize(editProfile.bio) !== normalize(formData.bio)) critical.push('bio')
    if (normalize(editProfile.familyDetails) !== normalize(formData.familyDetails)) critical.push('familyDetails')
    
    // Check non-critical fields (use normalize to treat undefined/null/'' as equal)
    if (normalize(editProfile.religion) !== normalize(formData.religion)) nonCritical.push('religion')
    if (normalize(editProfile.caste) !== normalize(formData.caste)) nonCritical.push('caste')
    if (normalize(editProfile.motherTongue) !== normalize(formData.motherTongue)) nonCritical.push('motherTongue')
    if (normalize(editProfile.education) !== normalize(formData.education)) nonCritical.push('education')
    if (normalize(editProfile.occupation) !== normalize(formData.occupation)) nonCritical.push('occupation')
    if (normalize(editProfile.position) !== normalize(formData.position)) nonCritical.push('position')
    if (normalize(editProfile.height) !== normalize(formData.height)) nonCritical.push('height')
    if (normalize(editProfile.weight) !== normalize(formData.weight)) nonCritical.push('weight')
    if (normalize(editProfile.maritalStatus) !== normalize(formData.maritalStatus)) nonCritical.push('maritalStatus')
    if (normalize(editProfile.country) !== normalize(formData.country)) nonCritical.push('country')
    if (normalize(editProfile.state) !== normalize(formData.state)) nonCritical.push('state')
    if (normalize(editProfile.location) !== normalize(formData.location)) nonCritical.push('location')
    if (normalize(editProfile.residentialStatus) !== normalize(formData.residentialStatus)) nonCritical.push('residentialStatus')
    if (normalize(editProfile.dietPreference) !== normalize(formData.diet)) nonCritical.push('dietPreference')
    if (normalize(editProfile.drinkingHabit) !== normalize(formData.drinkingHabit)) nonCritical.push('drinkingHabit')
    if (normalize(editProfile.smokingHabit) !== normalize(formData.smokingHabit)) nonCritical.push('smokingHabit')
    if (normalize(editProfile.salary) !== normalize(formData.annualIncome)) nonCritical.push('salary')
    if (normalize(editProfile.disability) !== normalize(formData.disability)) nonCritical.push('disability')
    if (normalize(editProfile.disabilityDetails) !== normalize(formData.disabilityDetails)) nonCritical.push('disabilityDetails')
    if (normalize(editProfile.birthTime) !== normalize(formData.birthTime)) nonCritical.push('birthTime')
    if (normalize(editProfile.birthPlace) !== normalize(formData.birthPlace)) nonCritical.push('birthPlace')
    if (normalize(editProfile.horoscopeMatching) !== normalize(formData.horoscopeMatching)) nonCritical.push('horoscopeMatching')
    if (normalize(editProfile.relationToProfile) !== normalize(formData.profileCreatedFor === 'Other' ? formData.otherRelation : formData.profileCreatedFor)) nonCritical.push('relationToProfile')
    
    // Check partner preferences changes (all non-critical)
    const oldPrefs = editProfile.partnerPreferences || {}
    
    // Helper to normalize numbers (treat undefined/null as undefined for comparison)
    const normalizeNum = (val: number | undefined | null): number | undefined => {
      if (val === undefined || val === null) return undefined
      return val
    }
    
    // Age preferences (only count as changed if actual values differ)
    if (normalizeNum(oldPrefs.ageMin) !== normalizeNum(formData.partnerAgeMin) || 
        normalizeNum(oldPrefs.ageMax) !== normalizeNum(formData.partnerAgeMax)) {
      nonCritical.push('partnerAge')
    }
    
    // Height preferences
    if (normalize(oldPrefs.heightMin) !== normalize(formData.partnerHeightMin) || 
        normalize(oldPrefs.heightMax) !== normalize(formData.partnerHeightMax)) {
      nonCritical.push('partnerHeight')
    }
    
    // Helper to compare arrays (treat undefined/null/[] as equivalent)
    const arraysEqual = (a: unknown[] | undefined | null, b: unknown[] | undefined | null) => {
      const arr1 = a || []
      const arr2 = b || []
      // Both empty arrays are equal
      if (arr1.length === 0 && arr2.length === 0) return true
      if (arr1.length !== arr2.length) return false
      return arr1.every((v, i) => v === arr2[i])
    }
    
    // Education preference
    if (!arraysEqual(oldPrefs.education, formData.partnerEducation)) nonCritical.push('partnerEducation')
    
    // Employment status preference
    if (!arraysEqual(oldPrefs.employmentStatus, formData.partnerEmploymentStatus)) nonCritical.push('partnerEmploymentStatus')
    
    // Occupation preference
    if (!arraysEqual(oldPrefs.occupation, formData.partnerOccupation)) nonCritical.push('partnerOccupation')
    
    // Location preferences
    if (!arraysEqual(oldPrefs.livingCountry, formData.partnerLivingCountry) ||
        !arraysEqual(oldPrefs.livingState, formData.partnerLivingState) ||
        !arraysEqual(oldPrefs.location, formData.partnerLocation)) {
      nonCritical.push('partnerLocation')
    }
    
    // Religion preference
    if (!arraysEqual(oldPrefs.religion, formData.partnerReligion)) nonCritical.push('partnerReligion')
    
    // Caste preference
    if (!arraysEqual(oldPrefs.caste, formData.partnerCaste)) nonCritical.push('partnerCaste')
    
    // Mother tongue preference
    if (!arraysEqual(oldPrefs.motherTongue, formData.partnerMotherTongue)) nonCritical.push('partnerMotherTongue')
    
    // Marital status preference
    if (!arraysEqual(oldPrefs.maritalStatus, formData.partnerMaritalStatus)) nonCritical.push('partnerMaritalStatus')
    
    // Diet preference
    if (!arraysEqual(oldPrefs.dietPreference, formData.partnerDiet)) nonCritical.push('partnerDiet')
    
    // Drinking preference
    if (!arraysEqual(oldPrefs.drinkingHabit, formData.partnerDrinking)) nonCritical.push('partnerDrinking')
    
    // Smoking preference
    if (!arraysEqual(oldPrefs.smokingHabit, formData.partnerSmoking)) nonCritical.push('partnerSmoking')
    
    // Manglik preference (normalize to handle undefined vs empty)
    if (normalize(oldPrefs.manglik) !== normalize(formData.partnerManglik)) nonCritical.push('partnerManglik')
    
    // Disability preference
    if (!arraysEqual(oldPrefs.disability, formData.partnerDisability)) nonCritical.push('partnerDisability')
    
    // Annual income preference
    if (normalize(oldPrefs.annualIncomeMin) !== normalize(formData.partnerAnnualIncomeMin) ||
        normalize(oldPrefs.annualIncomeMax) !== normalize(formData.partnerAnnualIncomeMax)) {
      nonCritical.push('partnerAnnualIncome')
    }
    
    // Check membership plan change - this is CRITICAL as it affects payment
    if (normalize(editProfile.membershipPlan) !== normalize(formData.membershipPlan)) {
      critical.push('membershipPlan')
    }
    
    return { critical, nonCritical }
  }

  // Load edit profile data when in edit mode
  useEffect(() => {
    if (editProfile && open) {
      // Parse mobile to extract country code and number
      const mobileMatch = editProfile.mobile?.match(/^(\+\d+)\s*(.*)$/)
      const countryCode = mobileMatch?.[1] || '+91'
      const mobileNumber = mobileMatch?.[2]?.replace(/\s/g, '') || editProfile.mobile?.replace(/\s/g, '') || ''
      
      setFormData({
        fullName: editProfile.fullName || '',
        profileCreatedFor: editProfile.relationToProfile as 'Self' | 'Daughter' | 'Son' | 'Brother' | 'Sister' | 'Other' | undefined,
        otherRelation: ['Self', 'Daughter', 'Son', 'Brother', 'Sister'].includes(editProfile.relationToProfile || '') ? '' : editProfile.relationToProfile || '',
        dateOfBirth: editProfile.dateOfBirth || '',
        birthTime: editProfile.birthTime || '',
        birthPlace: editProfile.birthPlace || '',
        horoscopeMatching: editProfile.horoscopeMatching || 'not-mandatory',
        diet: (editProfile.dietPreference as '' | 'veg' | 'non-veg' | 'occasionally-non-veg' | 'jain' | 'vegan') || '',
        drinkingHabit: (editProfile.drinkingHabit || '') as '' | 'never' | 'occasionally' | 'regularly',
        smokingHabit: (editProfile.smokingHabit || '') as '' | 'never' | 'occasionally' | 'regularly',
        annualIncome: editProfile.salary || '',
        profession: editProfile.occupation || '',
        position: editProfile.position || '',
        gender: editProfile.gender,
        religion: editProfile.religion || '',
        caste: editProfile.caste || '',
        motherTongue: editProfile.motherTongue || '',
        education: editProfile.education || '',
        occupation: editProfile.occupation || '',
        location: editProfile.location || '',
        state: editProfile.state || '',
        country: editProfile.country || 'India',
        residentialStatus: editProfile.residentialStatus,
        maritalStatus: editProfile.maritalStatus,
        email: editProfile.email || '',
        countryCode: countryCode,
        mobile: mobileNumber,
        height: editProfile.height || '',
        weight: editProfile.weight || '',
        disability: editProfile.disability || 'no',
        disabilityDetails: editProfile.disabilityDetails || '',
        bio: editProfile.bio || '',
        familyDetails: editProfile.familyDetails || '',
        membershipPlan: editProfile.membershipPlan,
        // Partner Preferences
        partnerAgeMin: editProfile.partnerPreferences?.ageMin,
        partnerAgeMax: editProfile.partnerPreferences?.ageMax,
        partnerHeightMin: editProfile.partnerPreferences?.heightMin || '',
        partnerHeightMax: editProfile.partnerPreferences?.heightMax || '',
        partnerEducation: editProfile.partnerPreferences?.education || [],
        partnerEmploymentStatus: editProfile.partnerPreferences?.employmentStatus || [],
        partnerOccupation: editProfile.partnerPreferences?.occupation || [],
        partnerLivingCountry: editProfile.partnerPreferences?.livingCountry || [],
        partnerLivingState: editProfile.partnerPreferences?.livingState || [],
        partnerLocation: editProfile.partnerPreferences?.location || [],
        partnerCountry: editProfile.partnerPreferences?.country || [],
        partnerReligion: editProfile.partnerPreferences?.religion || [],
        partnerCaste: editProfile.partnerPreferences?.caste || [],
        partnerMotherTongue: editProfile.partnerPreferences?.motherTongue || [],
        partnerMaritalStatus: editProfile.partnerPreferences?.maritalStatus || [],
        partnerDiet: editProfile.partnerPreferences?.dietPreference || [],
        partnerDrinking: editProfile.partnerPreferences?.drinkingHabit || [],
        partnerSmoking: editProfile.partnerPreferences?.smokingHabit || [],
        partnerManglik: editProfile.partnerPreferences?.manglik || 'doesnt-matter',
        partnerDisability: editProfile.partnerPreferences?.disability || [],
        partnerAnnualIncomeMin: editProfile.partnerPreferences?.annualIncomeMin || '',
        partnerAnnualIncomeMax: editProfile.partnerPreferences?.annualIncomeMax || ''
      })
      
      // Load existing photos
      if (editProfile.photos && editProfile.photos.length > 0) {
        setPhotos(editProfile.photos.map((url, index) => ({
          file: new File([], `existing-photo-${index}`),
          preview: url
        })))
      }
      
      // Load selfie
      if (editProfile.selfieUrl) {
        setSelfiePreview(editProfile.selfieUrl)
        // In edit mode, assume existing selfie already passed face coverage validation
        setFaceCoverageValid(true)
      }
      
      // Load ID proof (especially for admin mode)
      if (editProfile.idProofUrl) {
        setIdProofPreview(editProfile.idProofUrl)
      }
      if (editProfile.idProofType) {
        setIdProofType(editProfile.idProofType)
      }
      
      // Load payment screenshots if exists (support both single URL and array)
      // Reset broken image tracking when loading new screenshots
      setBrokenPaymentImages(new Set())
      if (editProfile.paymentScreenshotUrls && editProfile.paymentScreenshotUrls.length > 0) {
        setPaymentScreenshotPreviews(editProfile.paymentScreenshotUrls)
      } else if (editProfile.paymentScreenshotUrl) {
        setPaymentScreenshotPreviews([editProfile.paymentScreenshotUrl])
      }
      
      // Skip verification for edit mode
      setEmailVerified(true)
      setMobileVerified(true)
      setTermsAccepted(true)
      
      // Handle step navigation based on profile state:
      // - returnedForPayment: jump to step 8 (payment upload only)
      // - returnedForEdit: go to step 1 (full edit from beginning)
      // - initialStep provided: use that step (for upgrade flows)
      // - default: go to step 1
      if (editProfile.returnedForPayment) {
        setStep(8)
      } else if (editProfile.returnedForEdit) {
        setStep(1) // Returned for edit - start from step 1
      } else if (initialStep) {
        setStep(initialStep)
      } else {
        setStep(1)
      }
    }
  }, [editProfile, open, initialStep])

  // Load saved draft when dialog opens (only for new registration, not edit mode)
  useEffect(() => {
    if (!open) return // Only load when dialog is opened
    if (isEditMode) return // Skip draft loading in edit mode
    
    try {
      const savedDraft = localStorage.getItem(STORAGE_KEY)
      if (savedDraft) {
        const parsed = JSON.parse(savedDraft)
        if (parsed.formData) {
          // Merge draft with defaults - preserve default values if draft has empty/undefined values
          setFormData(prev => {
            const merged = { ...prev, ...parsed.formData }
            // Ensure default values are preserved if draft has falsy values
            if (!merged.disability) merged.disability = defaultValues.disability
            if (!merged.horoscopeMatching) merged.horoscopeMatching = defaultValues.horoscopeMatching
            if (!merged.country) merged.country = defaultValues.country
            if (!merged.partnerManglik) merged.partnerManglik = defaultValues.partnerManglik
            return merged
          })
        }
        if (parsed.step) {
          setStep(parsed.step)
        }
        if (parsed.photos && parsed.photos.length > 0) {
          setPhotos(parsed.photos)
        }
        if (parsed.selfiePreview) {
          setSelfiePreview(parsed.selfiePreview)
          // If selfie was saved in draft, it already passed face coverage validation
          if (parsed.faceCoverageValid !== undefined) {
            setFaceCoverageValid(parsed.faceCoverageValid)
          }
        }
        // Restore ID proof from draft
        if (parsed.idProofPreview) {
          setIdProofPreview(parsed.idProofPreview)
        }
        if (parsed.idProofType) {
          setIdProofType(parsed.idProofType)
        }
        // Also restore verification states if saved
        if (parsed.emailVerified) {
          setEmailVerified(parsed.emailVerified)
        }
        if (parsed.mobileVerified) {
          setMobileVerified(parsed.mobileVerified)
        }
        if (parsed.digilockerVerified) {
          setDigilockerVerified(parsed.digilockerVerified)
        }
        if (parsed.digilockerData) {
          setDigilockerData(parsed.digilockerData)
        }
        toast.info(
          language === 'hi' ? 'पिछला ड्राफ्ट लोड किया गया' : 'Previous draft loaded',
          { description: language === 'hi' ? 'आप वहीं से जारी रख सकते हैं' : 'You can continue from where you left' }
        )
      }
    } catch (e) {
      logger.error('Error loading draft:', e)
    }
    // Intentionally not including defaultValues.* to prevent re-initialization loops
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, isEditMode, language])

  // Save draft function
  const saveDraft = () => {
    try {
      const draft = {
        formData,
        step,
        photos,
        selfiePreview,
        faceCoverageValid,
        // Save ID proof data
        idProofPreview,
        idProofType,
        // Also save verification states
        emailVerified,
        mobileVerified,
        digilockerVerified,
        digilockerData
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(draft))
      toast.success(
        language === 'hi' ? 'ड्राफ्ट सेव हो गया!' : 'Draft saved!',
        { description: language === 'hi' ? 'आप बाद में जारी रख सकते हैं' : 'You can continue later' }
      )
    } catch (e) {
      logger.error('Error saving draft:', e)
      toast.error(language === 'hi' ? 'ड्राफ्ट सेव नहीं हो सका' : 'Could not save draft')
    }
  }

  // Clear draft function
  const clearDraft = () => {
    try {
      localStorage.removeItem(STORAGE_KEY)
    } catch (e) {
      logger.error('Error clearing draft:', e)
    }
  }

  // Reset draft function (user-facing with confirmation)
  const resetDraft = () => {
    if (confirm(language === 'hi' 
      ? 'क्या आप वाकई सभी सहेजे गए ड्राफ्ट डेटा को हटाना चाहते हैं? यह क्रिया पूर्ववत नहीं की जा सकती।'
      : 'Are you sure you want to delete all saved draft data? This action cannot be undone.'
    )) {
      try {
        localStorage.removeItem(STORAGE_KEY)
        // Reset all form states
        setFormData({
          fullName: '',
          profileCreatedFor: undefined,
          otherRelation: '',
          dateOfBirth: '',
          birthTime: '',
          birthPlace: '',
          horoscopeMatching: 'not-mandatory',
          diet: '',
          drinkingHabit: '',
          smokingHabit: '',
          annualIncome: '',
          profession: '',
          position: '',
          gender: undefined,
          religion: '',
          caste: '',
          motherTongue: '',
          education: '',
          occupation: '',
          location: '',
          state: '',
          country: 'India',
          residentialStatus: undefined,
          maritalStatus: undefined,
          email: '',
          countryCode: '+91',
          mobile: '',
          height: '',
          weight: '',
          disability: 'no',
          disabilityDetails: '',
          bio: '',
          familyDetails: '',
          membershipPlan: undefined,
          partnerAgeMin: undefined,
          partnerAgeMax: undefined,
          partnerHeightMin: '',
          partnerHeightMax: '',
          partnerEducation: [],
          partnerEmploymentStatus: [],
          partnerOccupation: [],
          partnerLivingCountry: [],
          partnerLivingState: [],
          partnerLocation: [],
          partnerCountry: [],
          partnerReligion: [],
          partnerCaste: [],
          partnerMotherTongue: [],
          partnerMaritalStatus: [],
          partnerDiet: [],
          partnerDrinking: [],
          partnerSmoking: [],
          partnerManglik: 'doesnt-matter',
          partnerDisability: [],
          partnerAnnualIncomeMin: '',
          partnerAnnualIncomeMax: ''
        })
        setStep(1)
        setPhotos([])
        setSelfiePreview(undefined)
        setSelfieFile(null)
        setFaceCoveragePercent(0)
        setFaceCoverageValid(false)
        setIdProofPreview(null)
        setEmailVerified(false)
        setMobileVerified(false)
        setDigilockerVerified(false)
        setDigilockerData(null)
        setTermsAccepted(false)
        toast.success(
          language === 'hi' ? 'ड्राफ्ट रीसेट हो गया!' : 'Draft reset successfully!',
          { description: language === 'hi' ? 'आप नए सिरे से शुरू कर सकते हैं' : 'You can start fresh' }
        )
      } catch (e) {
        logger.error('Error resetting draft:', e)
        toast.error(language === 'hi' ? 'ड्राफ्ट रीसेट नहीं हो सका' : 'Could not reset draft')
      }
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const updateField = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const getMaxDate = () => {
    const today = new Date()
    const minAge = formData.gender === 'male' ? 21 : formData.gender === 'female' ? 18 : 21
    const maxDate = new Date(today.getFullYear() - minAge, today.getMonth(), today.getDate())
    return maxDate.toISOString().split('T')[0]
  }

  const getMinDate = () => {
    const today = new Date()
    const maxAge = 100
    const minDate = new Date(today.getFullYear() - maxAge, today.getMonth(), today.getDate())
    return minDate.toISOString().split('T')[0]
  }

  const calculateAge = (dob: string) => {
    const birthDate = new Date(dob)
    const today = new Date()
    let age = today.getFullYear() - birthDate.getFullYear()
    const monthDiff = today.getMonth() - birthDate.getMonth()
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--
    }
    return age
  }

  const startCamera = async (deviceId?: string) => {
    try {
      // First enumerate available cameras
      const devices = await navigator.mediaDevices.enumerateDevices()
      const videoDevices = devices.filter(device => device.kind === 'videoinput')
      setAvailableCameras(videoDevices)
      
      // If no deviceId provided and we have cameras, use the first one or preferred front camera
      let cameraId = deviceId || selectedCameraId
      if (!cameraId && videoDevices.length > 0) {
        // Try to find front camera
        const frontCamera = videoDevices.find(d => d.label.toLowerCase().includes('front') || d.label.toLowerCase().includes('user'))
        cameraId = frontCamera?.deviceId || videoDevices[0].deviceId
        setSelectedCameraId(cameraId)
      }
      
      // First set showCamera to true so the video element is rendered
      setShowCamera(true)
      
      // Build constraints based on selected camera
      const videoConstraints: MediaTrackConstraints = cameraId 
        ? { deviceId: { exact: cameraId } }
        : { facingMode: 'user' }
      
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: videoConstraints,
        audio: false 
      })
      
      streamRef.current = stream
      
      // Use setTimeout to ensure video element is mounted
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          videoRef.current.onloadedmetadata = () => {
            videoRef.current?.play()
            setIsCameraReady(true)
          }
        }
      }, 100)
    } catch (_err) {
      setShowCamera(false)
      toast.error(t.registration.cameraAccessDenied)
    }
  }

  const switchCamera = async (deviceId: string) => {
    setSelectedCameraId(deviceId)
    // Stop current stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
    setIsCameraReady(false)
    // Start with new camera
    await startCamera(deviceId)
  }

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
    setShowCamera(false)
    setIsCameraReady(false)
    setLiveZoom(1) // Reset live zoom
  }

  const capturePhoto = async () => {
    if (isCapturingSelfie) return // Prevent multiple clicks
    
    if (videoRef.current && canvasRef.current) {
      setIsCapturingSelfie(true)
      const canvas = canvasRef.current
      const video = videoRef.current
      
      // Apply live zoom by cropping the center portion
      const zoom = liveZoom
      const sourceWidth = video.videoWidth / zoom
      const sourceHeight = video.videoHeight / zoom
      const sourceX = (video.videoWidth - sourceWidth) / 2
      const sourceY = (video.videoHeight - sourceHeight) / 2
      
      // Output at original resolution for quality
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      
      const ctx = canvas.getContext('2d')
      if (ctx) {
        // Flip the canvas horizontally to un-mirror the captured image
        ctx.translate(canvas.width, 0)
        ctx.scale(-1, 1)
        
        // Draw zoomed portion (center crop scaled to full canvas)
        ctx.drawImage(
          video,
          sourceX, sourceY, sourceWidth, sourceHeight, // Source rectangle (center crop)
          0, 0, canvas.width, canvas.height // Destination (full canvas)
        )
        
        // Reset transformation for any future drawings
        ctx.setTransform(1, 0, 0, 1, 0, 0)
        
        // Analyze face coverage using Azure Face API service
        // The service handles all validation: no face, multiple faces, hands/objects, centering, coverage
        const validationResult = await analyzeFaceCoverageFromCanvas(canvas)
        setFaceCoveragePercent(validationResult.coverage)
        
        // If validation failed (no face, not centered, multiple faces, low coverage, etc.)
        if (!validationResult.valid) {
          setFaceCoverageValid(false)
          // Save preview to show what was captured (if face was detected but validation failed)
          if (validationResult.coverage > 0) {
            setSelfiePreview(canvas.toDataURL('image/jpeg'))
            stopCamera()
          }
          setIsCapturingSelfie(false)
          return
        }
        
        // Face validated successfully - save selfie
        finalizeSelfieCapture(validationResult.coverage)
      }
    }
  }

  // Finalize selfie capture after validation
  const finalizeSelfieCapture = (_coverage: number) => {
    if (canvasRef.current) {
      setFaceCoverageValid(true)
      
      // Capture geolocation when selfie is taken
      captureGeoLocation()
      
      canvasRef.current.toBlob((blob) => {
        if (blob) {
          const file = new File([blob], 'selfie.jpg', { type: 'image/jpeg' })
          setSelfieFile(file)
          setSelfiePreview(canvasRef.current!.toDataURL('image/jpeg'))
          stopCamera()
        }
        setIsCapturingSelfie(false)
      }, 'image/jpeg')
    } else {
      setIsCapturingSelfie(false)
    }
  }

  // Capture user's geolocation when selfie is taken
  const captureGeoLocation = () => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude, accuracy } = position.coords
          
          // Try to get city/region from coordinates using reverse geocoding
          let city, region, country
          try {
            const response = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=10`,
              { headers: { 'Accept-Language': language } }
            )
            if (response.ok) {
              const data = await response.json()
              city = data.address?.city || data.address?.town || data.address?.village
              region = data.address?.state || data.address?.county
              country = data.address?.country
            }
          } catch (_e) {
            logger.debug('Reverse geocoding failed, using coordinates only')
          }
          
          setRegistrationGeoLocation({
            latitude,
            longitude,
            accuracy,
            city,
            region,
            country,
            capturedAt: new Date().toISOString()
          })
          
          toast.info(
            language === 'hi' 
              ? `स्थान कैप्चर किया गया: ${city || 'अज्ञात'}, ${region || ''}` 
              : `Location captured: ${city || 'Unknown'}, ${region || ''}`,
            { duration: 3000 }
          )
        },
        (error) => {
          logger.debug('Geolocation error:', error.message)
          // Still allow registration even if location fails
          toast.warning(
            language === 'hi' 
              ? 'स्थान प्राप्त नहीं हो सका' 
              : 'Could not get location',
            { duration: 3000 }
          )
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
      )
    }
  }

  // Analyze face coverage from canvas using Azure Face API service
  const analyzeFaceCoverageFromCanvas = async (canvas: HTMLCanvasElement): Promise<{ valid: boolean; coverage: number }> => {
    // Convert canvas to data URL for face detection service
    const imageData = canvas.toDataURL('image/jpeg', 0.9)
    
    // Use the Azure Face Service (imported statically)
    const result = await validateSelfie(imageData, language)
    
    if (!result.valid) {
      toast.error(result.message, { duration: 5000 })
      return { valid: false, coverage: result.coverage } // Return validation status with coverage
    }
    
    // Face detected, validated, and meets all criteria
    toast.success(result.message, { duration: 3000 })
    return { valid: true, coverage: result.coverage }
  }

  // AI Bio Generation
  const handleGenerateBio = async () => {
    if (!formData.fullName || !formData.education || !formData.occupation) {
      toast.error(
        language === 'hi' 
          ? 'कृपया पहले नाम, शिक्षा और व्यवसाय भरें' 
          : 'Please fill in name, education and occupation first'
      )
      return
    }

    setIsGeneratingBio(true)
    try {
      const birthDate = formData.dateOfBirth ? new Date(formData.dateOfBirth) : null
      const age = birthDate ? Math.floor((Date.now() - birthDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000)) : 25

      const params: BioGenerationParams = {
        name: formData.fullName,
        age,
        gender: formData.gender || 'male',
        education: formData.education,
        occupation: formData.occupation,
        location: formData.location || '',
        religion: formData.religion,
        caste: formData.caste,
        familyDetails: formData.familyDetails,
        language
      }

      const result = await generateBio(params)
      
      if (result.success && result.bio) {
        updateField('bio', result.bio)
        toast.success(
          language === 'hi' ? 'AI ने परिचय तैयार किया!' : 'AI generated bio!',
          { description: language === 'hi' ? 'आप इसे संपादित कर सकते हैं' : 'You can edit it as needed' }
        )
      } else {
        toast.error(result.message || (language === 'hi' ? 'परिचय बनाने में त्रुटि' : 'Error generating bio'))
      }
    } catch (error) {
      logger.error('Bio generation error:', error)
      toast.error(language === 'hi' ? 'परिचय बनाने में त्रुटि' : 'Error generating bio')
    } finally {
      setIsGeneratingBio(false)
    }
  }

  // Check for duplicate email or mobile
  const isDuplicateEmail = (email: string) => {
    return existingProfiles.some(p => {
      // Skip self in edit mode
      if (isEditMode && editProfile && p.id === editProfile.id) return false
      return p.email?.toLowerCase() === email.toLowerCase()
    })
  }

  const isDuplicateMobile = (mobile: string) => {
    const fullMobile = `${formData.countryCode} ${mobile}`
    return existingProfiles.some(p => {
      // Skip self in edit mode
      if (isEditMode && editProfile && p.id === editProfile.id) return false
      // Check both with and without country code
      const existingMobile = p.mobile?.replace(/\s+/g, '') || ''
      const newMobile = fullMobile.replace(/\s+/g, '')
      return existingMobile === newMobile || existingMobile.endsWith(mobile)
    })
  }

  // Email format validation
  const isValidEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async () => {
    // Payment-only mode: only validate payment screenshot
    if (isPaymentOnlyMode) {
      if (paymentScreenshotPreviews.length === 0) {
        toast.error(
          language === 'hi' 
            ? 'कृपया भुगतान स्क्रीनशॉट अपलोड करें' 
            : 'Please upload payment screenshot'
        )
        return
      }
      
      // Handle payment-only submission
      setIsSubmitting(true)
      try {
        // Upload all payment screenshots to blob storage
        const uploadedPaymentUrls: string[] = []
        for (let i = 0; i < paymentScreenshotPreviews.length; i++) {
          const preview = paymentScreenshotPreviews[i]
          const file = paymentScreenshotFiles[i]
          
          if (file) {
            try {
              const result = await uploadPhoto(editProfile?.profileId || 'unknown', file)
              uploadedPaymentUrls.push(result.cdnUrl)
            } catch (uploadErr) {
              logger.warn('Failed to upload payment to blob, using base64:', uploadErr)
              uploadedPaymentUrls.push(preview) // Fallback to base64
            }
          } else if (preview.startsWith('https://')) {
            // Already uploaded URL
            uploadedPaymentUrls.push(preview)
          } else if (preview.startsWith('data:')) {
            // Base64 image (from camera capture) - convert to file and upload
            try {
              const paymentFile = dataUrlToFile(preview, `payment-${Date.now()}-${i}.jpg`)
              const result = await uploadPhoto(editProfile?.profileId || 'unknown', paymentFile)
              uploadedPaymentUrls.push(result.cdnUrl)
            } catch (uploadErr) {
              logger.warn('Failed to upload base64 payment to blob:', uploadErr)
              uploadedPaymentUrls.push(preview) // Fallback to base64
            }
          } else {
            uploadedPaymentUrls.push(preview) // Fallback
          }
        }
        
        // Create updated profile with payment data
        const updatedProfile: Partial<Profile> = {
          ...editProfile,
          paymentScreenshotUrl: uploadedPaymentUrls[0], // Keep first for backwards compatibility
          paymentScreenshotUrls: uploadedPaymentUrls, // Store all URLs
          paymentStatus: 'pending',
          paymentUploadedAt: new Date().toISOString(),
          paymentAmount: editProfile?.membershipPlan === '6-month' 
            ? (membershipSettings?.sixMonthPrice || 500) 
            : editProfile?.membershipPlan === '1-year'
            ? (membershipSettings?.oneYearPrice || 900)
            : undefined,
          returnedForPayment: false, // Clear the returned for payment flag
          returnedForPaymentAt: undefined
        }
        
        // Use onSubmit to properly update the profile in the app state
        onSubmit(updatedProfile)
        
        toast.success(
          language === 'hi' 
            ? 'भुगतान स्क्रीनशॉट सफलतापूर्वक अपलोड किया गया! व्यवस्थापक जल्द ही सत्यापित करेगा।' 
            : 'Payment screenshot uploaded successfully! Admin will verify soon.'
        )
        
        onClose()
        return
      } catch (err) {
        logger.error('Payment submission error:', err)
        toast.error(
          language === 'hi' 
            ? 'भुगतान अपलोड करने में त्रुटि हुई। कृपया पुनः प्रयास करें।' 
            : 'Error uploading payment. Please try again.'
        )
      } finally {
        setIsSubmitting(false)
      }
      return
    }
    
    // Admin mode has relaxed validation - only require basic fields
    const requiredFields = isAdminMode 
      ? (formData.fullName && formData.gender)
      : (formData.fullName && formData.dateOfBirth && formData.gender && formData.religion && formData.motherTongue && formData.height && formData.maritalStatus && formData.horoscopeMatching && formData.email && formData.mobile && formData.membershipPlan)
    
    if (!requiredFields) {
      toast.error(t.registration.fillAllFields)
      return
    }

    // Validate Terms and Conditions acceptance (skip for admin mode)
    if (!isAdminMode && !termsAccepted) {
      toast.error(
        language === 'hi' 
          ? 'कृपया नियम और शर्तें स्वीकार करें' 
          : 'Please accept Terms and Conditions'
      )
      return
    }

    // If horoscope matching is mandatory, birth time and place are required
    if (formData.horoscopeMatching === 'mandatory' && (!formData.birthTime || !formData.birthPlace)) {
      toast.error(
        language === 'hi' 
          ? 'कुंडली मिलान अनिवार्य है, कृपया जन्म समय और जन्म स्थान दर्ज करें' 
          : 'Horoscope matching is mandatory, please provide birth time and birth place'
      )
      return
    }

    // Check for duplicate email
    if (isDuplicateEmail(formData.email)) {
      toast.error(
        language === 'hi' 
          ? 'यह ईमेल पहले से पंजीकृत है। कृपया दूसरा ईमेल उपयोग करें।' 
          : 'This email is already registered. Please use a different email.'
      )
      return
    }

    // Check for duplicate mobile
    if (isDuplicateMobile(formData.mobile)) {
      toast.error(
        language === 'hi' 
          ? 'यह मोबाइल नंबर पहले से पंजीकृत है। कृपया दूसरा नंबर उपयोग करें।' 
          : 'This mobile number is already registered. Please use a different number.'
      )
      return
    }

    // Validate mobile based on country code
    const phoneLengthInfo = getPhoneLengthInfo(formData.countryCode)
    if (!isValidPhoneLength(formData.mobile, formData.countryCode)) {
      toast.error(
        language === 'hi' 
          ? `कृपया ${phoneLengthInfo.display} अंक का मोबाइल नंबर दर्ज करें` 
          : `Please enter a ${phoneLengthInfo.display} digit mobile number`
      )
      return
    }

    const age = calculateAge(formData.dateOfBirth)
    const minAge = formData.gender === 'male' ? 21 : 18
    
    if (age < minAge) {
      toast.error(
        `${formData.gender === 'male' ? (language === 'hi' ? 'पुरुष' : 'Male') : (language === 'hi' ? 'महिला' : 'Female')} ${t.registration.minAgeError} ${minAge} ${t.registration.yearsRequired}`
      )
      return
    }

    // Calculate membership cost and expiry based on plan - use admin settings
    const membershipCost = formData.membershipPlan === 'free' 
      ? 0 
      : formData.membershipPlan === '6-month' 
        ? (membershipSettings?.sixMonthPrice || 500) 
        : (membershipSettings?.oneYearPrice || 900)
    
    // In edit mode, keep existing membership expiry unless plan changed
    let membershipExpiry: Date
    if (isEditMode && editProfile?.membershipExpiry && formData.membershipPlan === editProfile.membershipPlan) {
      membershipExpiry = new Date(editProfile.membershipExpiry)
    } else {
      membershipExpiry = new Date()
      // Free plan also gets 6 months, just with limited features
      membershipExpiry.setMonth(membershipExpiry.getMonth() + (formData.membershipPlan === '1-year' ? 12 : 6))
    }

    // Generate a temporary profile ID for new registrations (for photo uploads)
    const tempProfileId = isEditMode && editProfile?.profileId 
      ? editProfile.profileId 
      : `SP${Date.now().toString().slice(-8)}`

    // Upload photos to blob storage if available
    setIsSubmitting(true)
    let photoUrls: string[] = []
    let uploadedSelfieUrl: string | undefined = selfiePreview || undefined
    let uploadedIdProofUrl: string | undefined = idProofPreview || undefined
    let uploadedPaymentScreenshotUrls: string[] = [...paymentScreenshotPreviews]

    try {
      const blobAvailable = await isBlobStorageAvailable()
      
      if (blobAvailable) {
        // Upload profile photos
        const photoUploadPromises = photos.map(async (photo, index) => {
          // Skip if it's already a CDN URL (from previous upload)
          if (photo.preview.startsWith('https://')) {
            return photo.preview
          }
          // Convert base64 to file and upload
          try {
            const file = photo.file.size > 0 
              ? photo.file 
              : dataUrlToFile(photo.preview, `photo-${index}.jpg`)
            const { cdnUrl } = await uploadPhoto(tempProfileId, file)
            return cdnUrl
          } catch (err) {
            logger.warn(`Failed to upload photo ${index}:`, err)
            return photo.preview // Fallback to base64
          }
        })

        photoUrls = await Promise.all(photoUploadPromises)

        // Upload selfie if it's base64
        if (selfiePreview && !selfiePreview.startsWith('https://')) {
          try {
            const selfieFile = dataUrlToFile(selfiePreview, 'selfie.jpg')
            const { cdnUrl } = await uploadPhoto(tempProfileId, selfieFile)
            uploadedSelfieUrl = cdnUrl
          } catch (err) {
            logger.warn('Failed to upload selfie:', err)
          }
        }

        // Upload ID proof if it's base64
        if (idProofPreview && !idProofPreview.startsWith('https://')) {
          try {
            const idFile = dataUrlToFile(idProofPreview, 'id-proof.jpg')
            const { cdnUrl } = await uploadPhoto(tempProfileId, idFile)
            uploadedIdProofUrl = cdnUrl
          } catch (err) {
            logger.warn('Failed to upload ID proof:', err)
          }
        }

        // Upload all payment screenshots that are base64
        const paymentUploadPromises = paymentScreenshotPreviews.map(async (preview, index) => {
          if (preview.startsWith('https://')) {
            return preview // Already uploaded
          }
          try {
            const file = paymentScreenshotFiles[index]
            if (file) {
              const { cdnUrl } = await uploadPhoto(tempProfileId, file)
              return cdnUrl
            } else {
              const paymentFile = dataUrlToFile(preview, `payment-screenshot-${index}.jpg`)
              const { cdnUrl } = await uploadPhoto(tempProfileId, paymentFile)
              return cdnUrl
            }
          } catch (err) {
            logger.warn(`Failed to upload payment screenshot ${index}:`, err)
            return preview // Fallback to base64
          }
        })
        uploadedPaymentScreenshotUrls = await Promise.all(paymentUploadPromises)
      } else {
        // Fallback: use base64 (not recommended for production)
        photoUrls = photos.map(p => p.preview)
      }
    } catch (err) {
      logger.warn('Blob storage not available, using base64:', err)
      photoUrls = photos.map(p => p.preview)
    } finally {
      setIsSubmitting(false)
    }

    // Use getChangedFieldsSummary as the single source of truth for change detection
    const changedFields = isEditMode ? getChangedFieldsSummary() : { critical: [], nonCritical: [] }
    const allChangedFields = [...changedFields.critical, ...changedFields.nonCritical]
    
    // Determine if only non-critical changes were made (no admin approval needed)
    // This is true if there are changes but none of them are critical
    const onlyNonCriticalChanges = isEditMode && editProfile 
      ? (allChangedFields.length === 0 || changedFields.critical.length === 0)
      : false

    const profile: Partial<Profile> = {
      ...formData,
      // Include existing profile fields for edit mode
      ...(isEditMode && editProfile ? {
        id: editProfile.id,
        profileId: editProfile.profileId,
        createdAt: editProfile.createdAt,
        trustLevel: editProfile.trustLevel,
        // Only reset to pending if critical fields (name, DOB, photos, etc.) were changed
        // Non-critical fields (religion, occupation, preferences, etc.) don't need re-verification
        status: onlyNonCriticalChanges ? editProfile.status : 'pending',
        returnedForEdit: onlyNonCriticalChanges ? editProfile.returnedForEdit : false,
        editReason: onlyNonCriticalChanges ? editProfile.editReason : undefined,
        returnedAt: onlyNonCriticalChanges ? editProfile.returnedAt : undefined,
        // Track edited fields for admin review
        lastEditedFields: allChangedFields.length > 0 ? allChangedFields : undefined,
        lastEditedFieldsAt: allChangedFields.length > 0 ? new Date().toISOString() : undefined
      } : {
        profileId: tempProfileId // Use the temp ID for new registrations
      }),
      // DigiLocker verification data
      ...(digilockerVerified && digilockerData ? {
        digilockerVerified: true,
        digilockerVerifiedAt: digilockerData.verifiedAt,
        digilockerID: digilockerData.digilockerID,
        aadhaarLastFour: digilockerData.aadhaarLastFour,
        digilockerVerifiedName: digilockerData.name,
        digilockerVerifiedDob: digilockerData.dob
      } : (isEditMode && editProfile ? {
        digilockerVerified: editProfile.digilockerVerified,
        digilockerVerifiedAt: editProfile.digilockerVerifiedAt,
        digilockerID: editProfile.digilockerID,
        aadhaarLastFour: editProfile.aadhaarLastFour,
        digilockerVerifiedName: editProfile.digilockerVerifiedName,
        digilockerVerifiedDob: editProfile.digilockerVerifiedDob
      } : {})),
      firstName: formData.fullName.split(' ')[0],
      lastName: formData.fullName.split(' ').slice(1).join(' ') || formData.fullName.split(' ')[0],
      age,
      gender: formData.gender!,
      maritalStatus: formData.maritalStatus!,
      mobile: `${formData.countryCode || '+91'} ${formData.mobile}`,
      membershipPlan: formData.membershipPlan!,
      relationToProfile: formData.profileCreatedFor === 'Other' ? formData.otherRelation : formData.profileCreatedFor!,
      hideEmail: editProfile?.hideEmail ?? false,
      hideMobile: editProfile?.hideMobile ?? false,
      photos: photoUrls, // Use uploaded CDN URLs (or base64 fallback)
      selfieUrl: uploadedSelfieUrl, // Use uploaded CDN URL
      // ID Proof data (only add if provided - for new registrations)
      ...(uploadedIdProofUrl ? {
        idProofUrl: uploadedIdProofUrl, // Use uploaded CDN URL
        idProofType: idProofType,
        idProofUploadedAt: new Date().toISOString(),
        idProofVerified: false
      } : (isEditMode && editProfile ? {
        idProofUrl: editProfile.idProofUrl,
        idProofType: editProfile.idProofType,
        idProofUploadedAt: editProfile.idProofUploadedAt,
        idProofVerified: editProfile.idProofVerified,
        idProofVerifiedAt: editProfile.idProofVerifiedAt,
        idProofVerifiedBy: editProfile.idProofVerifiedBy,
        idProofNotes: editProfile.idProofNotes
      } : {})),
      membershipExpiry: membershipExpiry.toISOString(),
      registrationLocation: isEditMode && editProfile?.registrationLocation ? editProfile.registrationLocation : (registrationGeoLocation || undefined),
      // Payment data for paid plans
      ...(formData.membershipPlan && formData.membershipPlan !== 'free' ? {
        // Preserve existing payment data in edit mode, only update if new screenshots uploaded
        paymentScreenshotUrl: uploadedPaymentScreenshotUrls[0] || (isEditMode ? editProfile?.paymentScreenshotUrl : undefined),
        paymentScreenshotUrls: uploadedPaymentScreenshotUrls.length > 0 
          ? uploadedPaymentScreenshotUrls 
          : (isEditMode ? editProfile?.paymentScreenshotUrls : undefined),
        // IMPORTANT: Preserve existing paymentStatus in edit mode if no new payment uploaded
        // Only reset to 'pending' if user uploaded a NEW payment screenshot
        paymentStatus: uploadedPaymentScreenshotUrls.length > 0 
          ? 'pending' 
          : (isEditMode ? editProfile?.paymentStatus : undefined),
        paymentAmount: formData.membershipPlan === '6-month' 
          ? (membershipSettings?.sixMonthPrice || 500) 
          : (membershipSettings?.oneYearPrice || 900),
        paymentUploadedAt: uploadedPaymentScreenshotUrls.length > 0 
          ? new Date().toISOString() 
          : (isEditMode ? editProfile?.paymentUploadedAt : undefined),
        // Preserve other payment fields in edit mode
        ...(isEditMode && editProfile ? {
          paymentVerifiedAt: editProfile.paymentVerifiedAt,
          paymentVerifiedBy: editProfile.paymentVerifiedBy
        } : {})
      } : {
        paymentStatus: 'not-required' as const
      }),
      // Disability information
      disability: formData.disability!,
      disabilityDetails: formData.disability !== 'no' ? formData.disabilityDetails : undefined,
      // Lifestyle fields - map from form fields to Profile fields
      dietPreference: formData.diet as DietPreference || undefined,
      drinkingHabit: formData.drinkingHabit as DrinkingHabit || undefined,
      smokingHabit: formData.smokingHabit as SmokingHabit || undefined,
      // Income and profession mapping
      salary: formData.annualIncome || undefined,
      // Partner Preferences
      partnerPreferences: {
        ageMin: formData.partnerAgeMin,
        ageMax: formData.partnerAgeMax,
        heightMin: formData.partnerHeightMin,
        heightMax: formData.partnerHeightMax,
        education: formData.partnerEducation?.length ? formData.partnerEducation : undefined,
        employmentStatus: formData.partnerEmploymentStatus?.length ? formData.partnerEmploymentStatus : undefined,
        occupation: formData.partnerOccupation?.length ? formData.partnerOccupation : undefined,
        livingCountry: formData.partnerLivingCountry?.length ? formData.partnerLivingCountry : undefined,
        livingState: formData.partnerLivingState?.length ? formData.partnerLivingState : undefined,
        location: formData.partnerLocation?.length ? formData.partnerLocation : undefined,
        country: formData.partnerCountry?.length ? formData.partnerCountry : undefined,
        religion: formData.partnerReligion?.length ? formData.partnerReligion : undefined,
        caste: formData.partnerCaste?.length ? formData.partnerCaste : undefined,
        motherTongue: formData.partnerMotherTongue?.length ? formData.partnerMotherTongue : undefined,
        maritalStatus: formData.partnerMaritalStatus?.length ? formData.partnerMaritalStatus : undefined,
        dietPreference: formData.partnerDiet?.length ? formData.partnerDiet : undefined,
        drinkingHabit: formData.partnerDrinking?.length ? formData.partnerDrinking : undefined,
        smokingHabit: formData.partnerSmoking?.length ? formData.partnerSmoking : undefined,
        manglik: formData.partnerManglik,
        disability: formData.partnerDisability?.length ? formData.partnerDisability : undefined,
        annualIncomeMin: formData.partnerAnnualIncomeMin || undefined,
        annualIncomeMax: formData.partnerAnnualIncomeMax || undefined
      }
    }

    onSubmit(profile)
    
    if (!isEditMode && !isAdminMode) {
      clearDraft()
    }
    
    // Show appropriate message based on mode and plan type
    if (isAdminMode) {
      // Admin mode - close dialog, toast is shown by AdminPanel
      onClose()
      return
    } else if (isEditMode) {
      if (onlyNonCriticalChanges) {
        // Non-critical changes - no re-verification needed
        toast.success(
          language === 'hi' ? 'प्रोफ़ाइल अपडेट किया गया!' : 'Profile Updated!',
          {
            description: language === 'hi' 
              ? 'आपके परिवर्तन सहेजे गए हैं। पुनः सत्यापन की आवश्यकता नहीं है।'
              : 'Your changes have been saved. No re-verification needed.'
          }
        )
      } else {
        // Critical changes - needs re-verification
        toast.success(
          language === 'hi' ? 'प्रोफ़ाइल अपडेट हो गई। एडमिन की पुनः स्वीकृति के लिए भेजी गई।' : 'Profile updated. Sent for admin re-approval.',
          {
            description: language === 'hi' 
              ? 'आपकी प्रोफ़ाइल स्वीकृति तक अन्य उपयोगकर्ताओं को दिखाई नहीं देगी।'
              : 'Your profile will not be visible to other users until approved.'
          }
        )
      }
    } else if (formData.membershipPlan === 'free') {
      toast.success(
        t.registration.profileSubmitted,
        {
          description: language === 'hi' 
            ? 'आपने मुफ्त परिचयात्मक योजना (6 महीने) चुनी है। प्रोफ़ाइल देखने और रुचि व्यक्त करने का आनंद लें!'
            : 'You have chosen the Free Introductory Plan (6 months). Enjoy viewing profiles and expressing interest!'
        }
      )
    } else {
      toast.success(
        t.registration.profileSubmitted,
        {
          description: language === 'hi' 
            ? `${t.registration.membershipFee}: ₹${membershipCost}`
            : `${t.registration.membershipFee}: ₹${membershipCost}`
        }
      )
    }
    
    // Only show verification process toast for new registrations (not for edit mode)
    if (!isEditMode) {
      setTimeout(() => {
        toast.info(
          t.registration.verificationProcess,
          {
            description: t.registration.reviewNote
          }
        )
      }, 2000)
    }

    setFormData({
      fullName: '',
      profileCreatedFor: undefined,
      otherRelation: '',
      dateOfBirth: '',
      birthTime: '',
      birthPlace: '',
      horoscopeMatching: 'not-mandatory',
      diet: '',
      drinkingHabit: '',
      smokingHabit: '',
      annualIncome: '',
      profession: '',
      position: '',
      gender: undefined,
      religion: '',
      caste: '',
      motherTongue: '',
      education: '',
      occupation: '',
      location: '',
      state: '',
      country: 'India',
      residentialStatus: undefined,
      maritalStatus: undefined,
      email: '',
      countryCode: '+91',
      mobile: '',
      height: '',
      weight: '',
      disability: 'no',
      disabilityDetails: '',
      bio: '',
      familyDetails: '',
      membershipPlan: undefined,
      partnerAgeMin: undefined,
      partnerAgeMax: undefined,
      partnerHeightMin: '',
      partnerHeightMax: '',
      partnerEducation: [],
      partnerEmploymentStatus: [],
      partnerOccupation: [],
      partnerLivingCountry: [],
      partnerLivingState: [],
      partnerLocation: [],
      partnerCountry: [],
      partnerReligion: [],
      partnerCaste: [],
      partnerMotherTongue: [],
      partnerMaritalStatus: [],
      partnerDiet: [],
      partnerDrinking: [],
      partnerSmoking: [],
      partnerManglik: 'doesnt-matter',
      partnerDisability: [],
      partnerAnnualIncomeMin: '',
      partnerAnnualIncomeMax: ''
    })
    setPhotos([])
    setSelfieFile(null)
    setSelfiePreview(undefined)
    setTermsAccepted(false)
    stopCamera()
    setStep(1)
    onClose()
  }

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      const remainingSlots = 3 - photos.length
      const filesToAdd = Array.from(files).slice(0, remainingSlots)
      
      filesToAdd.forEach(file => {
        const reader = new FileReader()
        reader.onloadend = () => {
          setPhotos(prev => {
            if (prev.length >= 3) return prev
            return [...prev, { file, preview: reader.result as string }]
          })
        }
        reader.readAsDataURL(file)
      })
    }
    // Reset input to allow re-selecting same file
    e.target.value = ''
  }

  const removePhoto = (index: number) => {
    if (photos.length > 1) {
      setPhotos(prev => prev.filter((_, i) => i !== index))
    } else {
      toast.error(language === 'hi' ? 'कम से कम एक फोटो आवश्यक है' : 'At least one photo is required')
    }
  }

  const movePhoto = (index: number, direction: 'up' | 'down') => {
    if ((direction === 'up' && index === 0) || (direction === 'down' && index === photos.length - 1)) {
      return
    }
    setPhotos(prev => {
      const newPhotos = [...prev]
      const swapIndex = direction === 'up' ? index - 1 : index + 1
      ;[newPhotos[index], newPhotos[swapIndex]] = [newPhotos[swapIndex], newPhotos[index]]
      return newPhotos
    })
  }

  // Selfie upload handler (reserved for file upload fallback)
  const _handleSelfieUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelfieFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setSelfiePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  // OTP cooldown countdown effect
  useEffect(() => {
    if (otpCooldownRemaining <= 0) return
    
    const timer = setInterval(() => {
      setOtpCooldownRemaining(prev => {
        if (prev <= 1) {
          clearInterval(timer)
          return 0
        }
        return prev - 1
      })
    }, 1000)
    
    return () => clearInterval(timer)
  }, [otpCooldownRemaining])

  // Cleanup camera stream on unmount or when dialog closes
  useEffect(() => {
    if (!open && streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
      setShowCamera(false)
      setIsCameraReady(false)
    }
    
    // Cleanup on unmount
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop())
        streamRef.current = null
      }
    }
  }, [open])

  const sendOtps = (emailOnly?: boolean, mobileOnly?: boolean, isResend?: boolean) => {
    // Rate limiting checks for resends (skip check on initial send)
    if (isResend) {
      // Check max attempts
      if (otpResendCount >= OTP_MAX_RESEND_ATTEMPTS) {
        toast.error(
          language === 'hi' 
            ? 'अधिकतम OTP प्रयास पूर्ण। कृपया बाद में पुनः प्रयास करें।' 
            : 'Maximum OTP attempts reached. Please try again later.'
        )
        return
      }
      
      // Check cooldown
      const now = Date.now()
      const timeSinceLastSend = (now - otpLastSentAt) / 1000
      if (timeSinceLastSend < OTP_RESEND_COOLDOWN_SECONDS) {
        const remaining = Math.ceil(OTP_RESEND_COOLDOWN_SECONDS - timeSinceLastSend)
        toast.error(
          language === 'hi' 
            ? `कृपया ${remaining} सेकंड प्रतीक्षा करें` 
            : `Please wait ${remaining} seconds`
        )
        return
      }
      
      // Update rate limiting state
      setOtpResendCount(prev => prev + 1)
    }
    
    // Update last sent time and cooldown
    setOtpLastSentAt(Date.now())
    setOtpCooldownRemaining(OTP_RESEND_COOLDOWN_SECONDS)
    
    setShowVerification(true)
    
    // Send Mobile OTP first (will appear at bottom)
    if (!mobileVerified && !emailOnly && formData.mobile) {
      const { otp } = sendRegistrationMobileOtp(
        formData.mobile,
        formData.fullName,
        language
      )
      setGeneratedMobileOtp(otp)
    }
    
    // Send Email OTP second (will appear on top)
    if (!emailVerified && !mobileOnly && formData.email) {
      const { otp } = sendRegistrationEmailOtp(
        formData.email,
        formData.fullName,
        language
      )
      setGeneratedEmailOtp(otp)
    }
    
    // Show success with remaining attempts
    if (isResend) {
      const remainingAttempts = OTP_MAX_RESEND_ATTEMPTS - otpResendCount - 1
      toast.success(
        language === 'hi' 
          ? `OTP भेजा गया! (${remainingAttempts} प्रयास शेष)` 
          : `OTP sent! (${remainingAttempts} attempts remaining)`
      )
    }
  }

  const verifyEmailOtp = () => {
    if (emailOtp === generatedEmailOtp) {
      setEmailVerified(true)
      toast.success(language === 'hi' ? 'ईमेल सत्यापित!' : 'Email Verified!')
      return true
    } else {
      toast.error(language === 'hi' ? 'गलत ईमेल OTP' : 'Invalid Email OTP')
      return false
    }
  }

  const verifyMobileOtp = () => {
    if (mobileOtp === generatedMobileOtp) {
      setMobileVerified(true)
      toast.success(language === 'hi' ? 'मोबाइल सत्यापित!' : 'Mobile Verified!')
      return true
    } else {
      toast.error(language === 'hi' ? 'गलत मोबाइल OTP' : 'Invalid Mobile OTP')
      return false
    }
  }

  // DigiLocker verification disabled for now - will be integrated later
  // Using strict warnings for name/DOB instead

  const handleVerificationComplete = () => {
    const emailValid = verifyEmailOtp()
    const mobileValid = verifyMobileOtp()
    
    if (emailValid && mobileValid) {
      setShowVerification(false)
      setStep(4)
    }
  }

  const nextStep = () => {
    // Validate step 1 fields
    if (step === 1 && (!formData.fullName || !formData.dateOfBirth || !formData.gender || !formData.religion || !formData.motherTongue || !formData.height || !formData.maritalStatus)) {
      toast.error(t.registration.fillAllFields)
      return
    }
    if (step === 1 && !formData.profileCreatedFor) {
      toast.error(language === 'hi' ? 'कृपया प्रोफाइल किसके लिए बनाई जा रही है चुनें' : 'Please select who this profile is for')
      return
    }
    if (step === 1 && formData.profileCreatedFor === 'Other' && !(formData.otherRelation || '').trim()) {
      toast.error(language === 'hi' ? 'कृपया रिश्ता बताएं' : 'Please specify the relation')
      return
    }
    // Horoscope matching mandatory requires birth time and place (step 1)
    if (step === 1 && (formData.horoscopeMatching || 'not-mandatory') === 'mandatory' && (!formData.birthTime || !formData.birthPlace)) {
      toast.error(
        language === 'hi' 
          ? 'कुंडली मिलान अनिवार्य है, कृपया जन्म समय और जन्म स्थान दर्ज करें' 
          : 'Horoscope matching is mandatory, please provide birth time and birth place'
      )
      return
    }
    if (step === 2 && (!formData.education || !formData.occupation)) {
      toast.error(t.registration.fillEducation)
      return
    }
    if (step === 3 && (!formData.location || !formData.state || !formData.country || !formData.email || !formData.mobile)) {
      toast.error(t.registration.fillContact)
      return
    }
    // Validate residential status is required when living outside India
    if (step === 3 && formData.country && formData.country !== 'India' && !formData.residentialStatus) {
      toast.error(
        language === 'hi' 
          ? 'विदेश में रहने वालों के लिए निवास स्थिति चुनना आवश्यक है' 
          : 'Residential status is required for those living outside India'
      )
      return
    }
    if (step === 3) {
      // Validate email format first
      if (!isValidEmail(formData.email)) {
        toast.error(
          language === 'hi' 
            ? 'कृपया वैध ईमेल पता दर्ज करें (उदाहरण: example@email.com)' 
            : 'Please enter a valid email address (e.g., example@email.com)'
        )
        return
      }
      
      // Validate mobile based on country code
      const countryCode = formData.countryCode || '+91'
      const stepPhoneLengthInfo = getPhoneLengthInfo(countryCode)
      if (!isValidPhoneLength(formData.mobile, countryCode)) {
        toast.error(
          language === 'hi' 
            ? `कृपया ${stepPhoneLengthInfo.display} अंक का मोबाइल नंबर दर्ज करें` 
            : `Please enter a ${stepPhoneLengthInfo.display} digit mobile number`
        )
        return
      }
      
      // Check for duplicate email in database (skip if editing own profile)
      const duplicateEmail = existingProfiles.find(
        p => p.email?.toLowerCase() === formData.email?.toLowerCase() && 
        (!isEditMode || p.id !== editProfile?.id)
      )
      
      // Check for duplicate mobile in database (skip if editing own profile)
      const fullMobileCheck = `${formData.countryCode} ${formData.mobile}`
      const duplicateMobile = existingProfiles.find(
        p => {
          if (isEditMode && p.id === editProfile?.id) return false
          const existingMobile = p.mobile?.replace(/\s+/g, '') || ''
          const newMobile = fullMobileCheck.replace(/\s+/g, '')
          return existingMobile === newMobile || existingMobile.endsWith(formData.mobile)
        }
      )
      
      // Show errors for both if both are duplicates
      if (duplicateEmail && duplicateMobile) {
        toast.error(
          language === 'hi' 
            ? 'यह ईमेल और मोबाइल नंबर दोनों पहले से पंजीकृत हैं। कृपया दूसरा ईमेल और मोबाइल नंबर उपयोग करें।' 
            : 'Both email and mobile number are already registered. Please use different email and mobile number.'
        )
        return
      }
      
      if (duplicateEmail) {
        toast.error(
          language === 'hi' 
            ? 'यह ईमेल पहले से पंजीकृत है। कृपया दूसरा ईमेल उपयोग करें।' 
            : 'This email is already registered. Please use a different email.'
        )
        return
      }
      
      if (duplicateMobile) {
        toast.error(
          language === 'hi' 
            ? 'यह मोबाइल नंबर पहले से पंजीकृत है। कृपया दूसरा नंबर उपयोग करें।' 
            : 'This mobile number is already registered. Please use a different number.'
        )
        return
      }
      
      // Admin mode: skip OTP verification entirely
      if (isAdminMode) {
        setEmailVerified(true)
        setMobileVerified(true)
        setStep(4)
        return
      }
      
      // Only send OTPs if not already verified
      if (emailVerified && mobileVerified) {
        // Both already verified, skip OTP step and proceed to next step
        setStep(4)
        return
      }
      sendOtps()
      return
    }
    // Admin mode: skip photo requirements
    if (step === 4 && !isAdminMode && photos.length === 0) {
      toast.error(language === 'hi' ? 'कृपया कम से कम एक फोटो अपलोड करें' : 'Please upload at least one photo')
      return
    }
    if (step === 4 && !isAdminMode && !selfiePreview) {
      toast.error(language === 'hi' ? 'कृपया लाइव सेल्फी लें' : 'Please capture a live selfie')
      return
    }
    if (step === 4 && !isAdminMode && selfiePreview && !faceCoverageValid) {
      toast.error(language === 'hi' ? 'चेहरा फ्रेम का कम से कम 50% होना चाहिए। कृपया पुनः सेल्फी लें।' : 'Face must cover at least 50% of the frame. Please retake selfie.')
      return
    }
    // ID Proof is mandatory for new registrations only (not for edit mode or admin mode)
    if (step === 4 && !isEditMode && !isAdminMode && !idProofPreview) {
      toast.error(language === 'hi' ? 'कृपया सरकारी पहचान प्रमाण अपलोड करें' : 'Please upload government ID proof')
      return
    }
    if (step === 4 && !isEditMode && !isAdminMode && !idProofType) {
      toast.error(language === 'hi' ? 'कृपया दस्तावेज़ का प्रकार चुनें' : 'Please select document type')
      return
    }
    // Step 5 - Bio is optional in admin mode
    if (step === 5 && !isAdminMode && !(formData.bio || '').trim()) {
      toast.error(language === 'hi' ? 'कृपया अपने बारे में लिखें (अनिवार्य है)' : 'Please write about yourself (required)')
      return
    }
    setStep(step + 1)
  }

  const prevStep = () => setStep(step - 1)

  return (
    <Dialog open={open} onOpenChange={onClose} modal>
      <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col overflow-hidden z-50" onOpenAutoFocus={(e) => e.preventDefault()}>
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="text-3xl flex items-center gap-2">
            <UserPlus size={32} weight="bold" />
            {isAdminMode
              ? (language === 'hi' ? 'एडमिन: प्रोफ़ाइल संपादित करें' : 'Admin: Edit Profile')
              : isEditMode 
                ? (language === 'hi' ? 'प्रोफ़ाइल संपादित करें' : 'Edit Profile')
                : t.registration.title}
            {isAdminMode && (
              <span className="ml-2 px-2 py-1 bg-purple-100 text-purple-700 text-xs font-medium rounded-full dark:bg-purple-900 dark:text-purple-300">
                {language === 'hi' ? 'एडमिन मोड' : 'Admin Mode'}
              </span>
            )}
          </DialogTitle>
          <DialogDescription>
            {isAdminMode
              ? (language === 'hi' ? 'सभी फ़ील्ड संपादित करें - OTP/भुगतान छोड़ें' : 'Edit all fields - skip OTP/payment verification')
              : isEditMode
                ? (language === 'hi' ? 'अपनी प्रोफ़ाइल जानकारी अपडेट करें' : 'Update your profile information')
                : t.registration.subtitle}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-2 min-h-0">
          {/* Payment Only Mode Alert */}
          {isPaymentOnlyMode && (
            (() => {
              const deadline = editProfile?.returnedForPaymentDeadline ? new Date(editProfile.returnedForPaymentDeadline) : null
              const now = new Date()
              const daysLeft = deadline ? Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)) : 0
              const isUrgent = daysLeft <= 2
              const isExpired = daysLeft <= 0
              
              return (
                <Alert className={`mb-4 ${isExpired ? 'bg-red-50 border-red-300 dark:bg-red-950/30 dark:border-red-700' : isUrgent ? 'bg-orange-50 border-orange-300 dark:bg-orange-950/30 dark:border-orange-700' : 'bg-amber-50 border-amber-300 dark:bg-amber-950/30 dark:border-amber-700'}`}>
                  <ShieldCheck size={18} className={isExpired ? 'text-red-600' : isUrgent ? 'text-orange-600' : 'text-amber-600'} />
                  <AlertDescription className={isExpired ? 'text-red-800 dark:text-red-200' : isUrgent ? 'text-orange-800 dark:text-orange-200' : 'text-amber-800 dark:text-amber-200'}>
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <p className="font-medium">
                        {language === 'hi' 
                          ? '✅ आपकी प्रोफाइल सत्यापित हो गई है! अब भुगतान करें।'
                          : '✅ Your profile has been verified! Please complete the payment.'}
                      </p>
                      {deadline && !isExpired && (
                        <span className={`text-xs font-bold px-2 py-1 rounded ${isUrgent ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                          ⏰ {daysLeft} {language === 'hi' ? 'दिन बाकी' : 'days left'}
                        </span>
                      )}
                      {isExpired && (
                        <span className="text-xs font-bold px-2 py-1 rounded bg-red-100 text-red-700">
                          ⚠️ {language === 'hi' ? 'समयसीमा समाप्त' : 'Deadline Expired'}
                        </span>
                      )}
                    </div>
                    <p className="text-sm mt-1">
                      {isExpired
                        ? (language === 'hi'
                            ? 'भुगतान की समयसीमा समाप्त हो गई है। कृपया जल्द से जल्द भुगतान करें या व्यवस्थापक से संपर्क करें।'
                            : 'Payment deadline has expired. Please complete payment ASAP or contact admin.')
                        : (language === 'hi'
                            ? 'आपके चेहरे और पहचान प्रमाण की जांच हो गई है। कृपया QR कोड या बैंक विवरण से भुगतान करें और स्क्रीनशॉट अपलोड करें।'
                            : 'Your face and ID proof have been verified. Please make payment via QR code or bank transfer and upload the screenshot.')}
                    </p>
                  </AlertDescription>
                </Alert>
              )
            })()
          )}
          
          {/* Payment Pending Verification Alert - show when user has submitted payment and waiting for admin */}
          {isPaymentPendingVerification && !isPaymentOnlyMode && (
            <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
              <div className="w-20 h-20 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mb-6">
                <Hourglass size={40} weight="duotone" className="text-blue-600 animate-pulse" />
              </div>
              <h3 className="text-xl font-bold text-blue-800 dark:text-blue-200 mb-3">
                {language === 'hi' ? '⏳ भुगतान सत्यापन प्रतीक्षित' : '⏳ Payment Verification Pending'}
              </h3>
              <p className="text-muted-foreground max-w-md mb-4">
                {language === 'hi' 
                  ? 'आपने भुगतान स्क्रीनशॉट अपलोड कर दिया है। कृपया व्यवस्थापक द्वारा सत्यापन की प्रतीक्षा करें। सत्यापन होने पर आपको सूचित किया जाएगा।'
                  : 'You have uploaded the payment screenshot. Please wait for admin verification. You will be notified once verified.'}
              </p>
              <div className="flex items-center gap-2 text-sm text-blue-600 bg-blue-50 dark:bg-blue-900/20 px-4 py-2 rounded-full">
                <CheckCircle size={18} />
                {language === 'hi' ? 'भुगतान स्क्रीनशॉट प्राप्त हुआ' : 'Payment screenshot received'}
              </div>
              <Button 
                variant="outline" 
                className="mt-6"
                onClick={onClose}
              >
                {language === 'hi' ? 'बंद करें' : 'Close'}
              </Button>
            </div>
          )}
          
          {/* Step indicators - hide in payment-only mode, show only Step 8 */}
          {isPaymentPendingVerification ? null : isPaymentOnlyMode ? (
            <div className="flex items-center justify-center gap-2 mb-6">
              <div className="flex items-center gap-2 px-4 py-2 bg-amber-100 dark:bg-amber-900/30 rounded-full">
                <CurrencyInr size={20} weight="bold" className="text-amber-600" />
                <span className="font-semibold text-amber-800 dark:text-amber-200">
                  {language === 'hi' ? 'चरण 8: भुगतान विवरण' : 'Step 8: Payment Details'}
                </span>
              </div>
            </div>
          ) : (
          <div className="flex items-center justify-center gap-1 md:gap-2 mb-6 px-6 overflow-visible">
            {(isAdminMode ? [1, 2, 3, 4, 5, 6] : [1, 2, 3, 4, 5, 6, 7]).map((s) => {
              const isCompleted = s < step || (s === 3 && emailVerified && mobileVerified)
              const isCurrent = s === step
              const canClick = (isCompleted && !showVerification) // Can click on completed steps
              
              // Step names for tooltips
              const stepNames: Record<number, { en: string; hi: string }> = {
                1: { en: 'Personal Information', hi: 'व्यक्तिगत जानकारी' },
                2: { en: 'Education & Career', hi: 'शिक्षा और करियर' },
                3: { en: 'Contact & Location', hi: 'संपर्क और स्थान' },
                4: { en: 'Photos', hi: 'फ़ोटो' },
                5: { en: 'About Yourself & Family', hi: 'अपने और परिवार के बारे में' },
                6: { en: 'Partner Preferences', hi: 'साथी वरीयताएँ' },
                7: { en: 'Choose Membership Plan', hi: 'सदस्यता योजना चुनें' },
              }
              const stepName = stepNames[s] || { en: `Step ${s}`, hi: `चरण ${s}` }
              
              return (
                <div key={s} className="flex items-center">
                  <button
                    type="button"
                    onClick={() => canClick && setStep(s)}
                    disabled={!canClick}
                    className={`relative w-7 h-7 md:w-9 md:h-9 rounded-full flex items-center justify-center font-bold transition-all text-xs md:text-sm border-0 ${
                      isCurrent ? 'bg-primary text-primary-foreground scale-110' :
                      isCompleted ? 'bg-teal text-teal-foreground cursor-pointer hover:scale-110 hover:ring-2 hover:ring-teal/50' : 'bg-muted text-muted-foreground cursor-default'
                    }`}
                    title={canClick ? (language === 'hi' ? `${stepName.hi} पर जाएं` : `Go to ${stepName.en}`) : ''}
                  >
                    {s}
                    {isCompleted && (
                      <CheckCircle 
                        size={14} 
                        weight="fill" 
                        className="absolute -top-1 -right-1 text-white bg-green-600 rounded-full"
                      />
                    )}
                  </button>
                  {s < 7 && <div className={`w-4 md:w-8 h-1 ${isCompleted ? 'bg-teal' : 'bg-muted'}`} />}
                </div>
              )
            })}
          </div>
          )}

          {/* Step description alert - show different content based on mode */}
          {!isPaymentOnlyMode && !isPaymentPendingVerification && (
          <Alert className="mb-4">
            <Info size={18} />
            <AlertDescription>
              {step === 1 && t.registration.step1}
              {step === 2 && t.registration.step2}
              {step === 3 && !showVerification && t.registration.step3}
              {step === 3 && showVerification && (language === 'hi' ? 'कृपया अपने ईमेल और मोबाइल पर भेजे गए OTP को सत्यापित करें।' : 'Please verify the OTPs sent to your email and mobile.')}
              {step === 4 && (language === 'hi' ? 'अपनी फ़ोटो और लाइव सेल्फी अपलोड करें। चेहरा फ्रेम का 50% होना चाहिए।' : 'Upload your photos and capture a live selfie. Face must cover 50% of frame.')}
              {step === 5 && (language === 'hi' ? 'अपने बारे में और परिवार की जानकारी दें। यह आवश्यक है।' : 'Tell us about yourself and your family. This is required.')}
              {step === 6 && (language === 'hi' ? 'अपने साथी की अपेक्षाएं बताएं - यह आपको बेहतर मैच खोजने में मदद करेगा।' : 'Tell us your partner preferences - this will help find better matches for you.')}
              {step === 7 && (language === 'hi' 
                ? 'अपनी सदस्यता योजना चुनें और नियम व शर्तें स्वीकार करें।' 
                : 'Choose your membership plan and accept Terms & Conditions.')}
            </AlertDescription>
          </Alert>
          )}

          {!isPaymentPendingVerification && (
          <Card>
            <CardContent className="pt-6">
            {step === 1 && (
              <div className="space-y-4">
                {/* Important Warning - Name and DOB cannot be changed after registration */}
                {!isEditMode && (
                  <div className="p-4 rounded-lg border-2 border-orange-400 bg-orange-50 dark:bg-orange-950/30 dark:border-orange-600">
                    <div className="flex items-start gap-3">
                      <Warning size={28} weight="bold" className="text-orange-600 flex-shrink-0 mt-0.5" />
                      <div className="space-y-2">
                        <h3 className="font-bold text-orange-800 dark:text-orange-300 text-lg">
                          {language === 'hi' ? '⚠️ महत्वपूर्ण सूचना - ध्यान से पढ़ें' : '⚠️ Important Notice - Read Carefully'}
                        </h3>
                        <div className="space-y-2 text-sm text-orange-700 dark:text-orange-400">
                          <p className="font-semibold">
                            {language === 'hi' 
                              ? 'आपका नाम और जन्म तिथि पंजीकरण के बाद कभी भी बदले नहीं जा सकते।'
                              : 'Your Name and Date of Birth CANNOT be changed after registration.'}
                          </p>
                          <ul className="list-disc list-inside space-y-1 ml-2">
                            <li>
                              {language === 'hi' 
                                ? 'कृपया अपने आधिकारिक दस्तावेजों (आधार/पैन) के अनुसार सही नाम दर्ज करें'
                                : 'Please enter your name exactly as per official documents (Aadhaar/PAN)'}
                            </li>
                            <li>
                              {language === 'hi' 
                                ? 'जन्म तिथि सही दर्ज करें - यह बाद में संशोधित नहीं की जा सकती'
                                : 'Enter correct date of birth - it cannot be modified later'}
                            </li>
                            <li>
                              {language === 'hi' 
                                ? 'गलत जानकारी देने पर प्रोफाइल अस्वीकार हो सकती है'
                                : 'Incorrect information may lead to profile rejection'}
                            </li>
                          </ul>
                          <p className="text-xs italic mt-2 border-t border-orange-300 pt-2">
                            {language === 'hi' 
                              ? 'हम फोटो सत्यापन द्वारा आपकी पहचान की जांच करते हैं। गलत जानकारी वाली प्रोफाइल स्थायी रूप से ब्लॉक की जा सकती है।'
                              : 'We verify identity through photo verification. Profiles with false information may be permanently blocked.'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Show locked badge for edit mode (not in admin mode) */}
                {isEditMode && !isAdminMode && (
                  <Alert className="bg-gray-50 border-gray-400 dark:bg-gray-950/30">
                    <ShieldCheck size={20} weight="fill" className="text-gray-600" />
                    <AlertDescription className="text-gray-700 dark:text-gray-300">
                      {language === 'hi' 
                        ? 'नाम और जन्म तिथि संपादित नहीं किए जा सकते'
                        : 'Name and Date of Birth cannot be edited'}
                    </AlertDescription>
                  </Alert>
                )}

                <div className="space-y-2">
                  <Label htmlFor="fullName">
                    {language === 'hi' ? 'नाम' : 'Name'} *
                    {isEditMode && !isAdminMode && (
                      <span className="ml-2 text-xs text-gray-500">
                        🔒 {language === 'hi' ? 'स्थायी' : 'Permanent'}
                      </span>
                    )}
                  </Label>
                  <Input
                    id="fullName"
                    placeholder={language === 'hi' ? 'आधिकारिक नाम दर्ज करें (आधार/पैन अनुसार)' : 'Enter official name (as per Aadhaar/PAN)'}
                    value={formData.fullName}
                    onChange={(e) => updateField('fullName', e.target.value)}
                    required
                    disabled={isEditMode && !isAdminMode}
                    className={isEditMode && !isAdminMode ? 'bg-muted' : ''}
                  />
                  {!isEditMode && (
                    <p className="text-xs text-orange-600 dark:text-orange-400">
                      ⚠️ {language === 'hi' ? 'पंजीकरण के बाद बदला नहीं जा सकता' : 'Cannot be changed after registration'}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="profileCreatedFor">
                    {language === 'hi' ? 'यह प्रोफाइल किसके लिए बनाई जा रही है?' : 'Profile created for'} *
                  </Label>
                  <Select 
                    value={formData.profileCreatedFor || ''}
                    onValueChange={(value: 'Self' | 'Daughter' | 'Son' | 'Brother' | 'Sister' | 'Other') => {
                      setFormData({ ...formData, profileCreatedFor: value, otherRelation: value !== 'Other' ? '' : formData.otherRelation });
                    }}
                  >
                    <SelectTrigger id="profileCreatedFor" className="w-full">
                      <SelectValue placeholder={t.fields.select} />
                    </SelectTrigger>
                    <SelectContent className="z-[9999]" position="popper" sideOffset={4}>
                      <SelectItem value="Self">{language === 'hi' ? 'स्वयं' : 'Self'}</SelectItem>
                      <SelectItem value="Daughter">{language === 'hi' ? 'बेटी' : 'Daughter'}</SelectItem>
                      <SelectItem value="Son">{language === 'hi' ? 'बेटा' : 'Son'}</SelectItem>
                      <SelectItem value="Brother">{language === 'hi' ? 'भाई' : 'Brother'}</SelectItem>
                      <SelectItem value="Sister">{language === 'hi' ? 'बहन' : 'Sister'}</SelectItem>
                      <SelectItem value="Other">{language === 'hi' ? 'अन्य' : 'Other'}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {formData.profileCreatedFor === 'Other' && (
                  <div className="space-y-2">
                    <Label htmlFor="otherRelation">
                      {language === 'hi' ? 'रिश्ता बताएं' : 'Specify Relation'} *
                    </Label>
                    <Input
                      id="otherRelation"
                      placeholder={language === 'hi' ? 'उदाहरण: मामा, चाची, दोस्त' : 'Example: Uncle, Aunt, Friend'}
                      value={formData.otherRelation}
                      onChange={(e) => updateField('otherRelation', e.target.value)}
                      required
                    />
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="gender" className="flex items-center flex-wrap">
                      {language === 'hi' ? 'लिंग' : 'Gender'} *
                      <AdminVerificationBadge field="gender" />
                    </Label>
                    <Select onValueChange={(value: Gender) => updateField('gender', value)} value={formData.gender || ''}>
                      <SelectTrigger id="gender" className="w-full">
                        <SelectValue placeholder={t.fields.select} />
                      </SelectTrigger>
                      <SelectContent className="z-[9999]" position="popper" sideOffset={4}>
                        <SelectItem value="male">{language === 'hi' ? 'पुरुष' : 'Male'}</SelectItem>
                        <SelectItem value="female">{language === 'hi' ? 'महिला' : 'Female'}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="dateOfBirth">
                      {language === 'hi' ? 'जन्म तिथि' : 'Date of Birth'} * <span className="text-xs font-normal text-muted-foreground">(DD/MM/YYYY)</span>
                      {isEditMode && !isAdminMode && (
                        <span className="ml-2 text-xs text-gray-500">
                          🔒 {language === 'hi' ? 'स्थायी' : 'Permanent'}
                        </span>
                      )}
                    </Label>
                    <DatePicker
                      value={formData.dateOfBirth}
                      onChange={(value) => updateField('dateOfBirth', value)}
                      maxDate={new Date(getMaxDate())}
                      minDate={new Date(getMinDate())}
                      disabled={!formData.gender || (isEditMode && !isAdminMode)}
                      placeholder="DD/MM/YYYY"
                    />
                    {isEditMode && !isAdminMode && (
                      <p className="text-xs text-gray-600">
                        {language === 'hi' ? 'जन्म तिथि संपादित नहीं की जा सकती' : 'Date of birth cannot be edited'}
                      </p>
                    )}
                    {!formData.gender && !isEditMode && (
                      <p className="text-xs text-muted-foreground">
                        {t.registration.selectGenderFirst}
                      </p>
                    )}
                    {formData.gender && !isEditMode && (
                      <>
                        <p className="text-xs text-muted-foreground">
                          {t.registration.minAgeInfo}: {formData.gender === 'male' ? '21' : '18'} {t.registration.yearsText}
                        </p>
                        <p className="text-xs text-orange-600 dark:text-orange-400">
                          ⚠️ {language === 'hi' ? 'पंजीकरण के बाद बदला नहीं जा सकता' : 'Cannot be changed after registration'}
                        </p>
                      </>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="religion">{language === 'hi' ? 'धर्म' : 'Religion'} *</Label>
                    <Select onValueChange={(value) => updateField('religion', value)} value={formData.religion || ''}>
                      <SelectTrigger id="religion" className="w-full">
                        <SelectValue placeholder={language === 'hi' ? 'धर्म चुनें' : 'Select Religion'} />
                      </SelectTrigger>
                      <SelectContent className="z-[9999]" position="popper" sideOffset={4}>
                        <SelectItem value="Hindu">{language === 'hi' ? 'हिंदू' : 'Hindu'}</SelectItem>
                        <SelectItem value="Muslim">{language === 'hi' ? 'मुस्लिम' : 'Muslim'}</SelectItem>
                        <SelectItem value="Sikh">{language === 'hi' ? 'सिख' : 'Sikh'}</SelectItem>
                        <SelectItem value="Christian">{language === 'hi' ? 'ईसाई' : 'Christian'}</SelectItem>
                        <SelectItem value="Jain">{language === 'hi' ? 'जैन' : 'Jain'}</SelectItem>
                        <SelectItem value="Buddhist">{language === 'hi' ? 'बौद्ध' : 'Buddhist'}</SelectItem>
                        <SelectItem value="Parsi">{language === 'hi' ? 'पारसी' : 'Parsi'}</SelectItem>
                        <SelectItem value="Jewish">{language === 'hi' ? 'यहूदी' : 'Jewish'}</SelectItem>
                        <SelectItem value="Bahai">{language === 'hi' ? 'बहाई' : 'Bahai'}</SelectItem>
                        <SelectItem value="Spiritual">{language === 'hi' ? 'आध्यात्मिक' : 'Spiritual'}</SelectItem>
                        <SelectItem value="No Religion">{language === 'hi' ? 'कोई धर्म नहीं' : 'No Religion'}</SelectItem>
                        <SelectItem value="Other">{language === 'hi' ? 'अन्य' : 'Other'}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="motherTongue">{language === 'hi' ? 'मातृभाषा' : 'Mother Tongue'} *</Label>
                    <Select onValueChange={(value) => updateField('motherTongue', value)} value={formData.motherTongue || ''}>
                      <SelectTrigger id="motherTongue" className="w-full">
                        <SelectValue placeholder={language === 'hi' ? 'मातृभाषा चुनें' : 'Select Mother Tongue'} />
                      </SelectTrigger>
                      <SelectContent className="z-[9999]" position="popper" sideOffset={4}>
                        <SelectItem value="Hindi">{language === 'hi' ? 'हिंदी' : 'Hindi'}</SelectItem>
                        <SelectItem value="English">{language === 'hi' ? 'अंग्रेज़ी' : 'English'}</SelectItem>
                        <SelectItem value="Punjabi">{language === 'hi' ? 'पंजाबी' : 'Punjabi'}</SelectItem>
                        <SelectItem value="Gujarati">{language === 'hi' ? 'गुजराती' : 'Gujarati'}</SelectItem>
                        <SelectItem value="Marathi">{language === 'hi' ? 'मराठी' : 'Marathi'}</SelectItem>
                        <SelectItem value="Tamil">{language === 'hi' ? 'तमिल' : 'Tamil'}</SelectItem>
                        <SelectItem value="Telugu">{language === 'hi' ? 'तेलुगु' : 'Telugu'}</SelectItem>
                        <SelectItem value="Kannada">{language === 'hi' ? 'कन्नड़' : 'Kannada'}</SelectItem>
                        <SelectItem value="Malayalam">{language === 'hi' ? 'मलयालम' : 'Malayalam'}</SelectItem>
                        <SelectItem value="Bengali">{language === 'hi' ? 'बंगाली' : 'Bengali'}</SelectItem>
                        <SelectItem value="Odia">{language === 'hi' ? 'ओड़िया' : 'Odia'}</SelectItem>
                        <SelectItem value="Assamese">{language === 'hi' ? 'असमिया' : 'Assamese'}</SelectItem>
                        <SelectItem value="Kashmiri">{language === 'hi' ? 'कश्मीरी' : 'Kashmiri'}</SelectItem>
                        <SelectItem value="Konkani">{language === 'hi' ? 'कोंकणी' : 'Konkani'}</SelectItem>
                        <SelectItem value="Manipuri">{language === 'hi' ? 'मणिपुरी' : 'Manipuri'}</SelectItem>
                        <SelectItem value="Nepali">{language === 'hi' ? 'नेपाली' : 'Nepali'}</SelectItem>
                        <SelectItem value="Sanskrit">{language === 'hi' ? 'संस्कृत' : 'Sanskrit'}</SelectItem>
                        <SelectItem value="Sindhi">{language === 'hi' ? 'सिंधी' : 'Sindhi'}</SelectItem>
                        <SelectItem value="Urdu">{language === 'hi' ? 'उर्दू' : 'Urdu'}</SelectItem>
                        <SelectItem value="Bhojpuri">{language === 'hi' ? 'भोजपुरी' : 'Bhojpuri'}</SelectItem>
                        <SelectItem value="Rajasthani">{language === 'hi' ? 'राजस्थानी' : 'Rajasthani'}</SelectItem>
                        <SelectItem value="Haryanvi">{language === 'hi' ? 'हरियाणवी' : 'Haryanvi'}</SelectItem>
                        <SelectItem value="Maithili">{language === 'hi' ? 'मैथिली' : 'Maithili'}</SelectItem>
                        <SelectItem value="Dogri">{language === 'hi' ? 'डोगरी' : 'Dogri'}</SelectItem>
                        <SelectItem value="Santali">{language === 'hi' ? 'संथाली' : 'Santali'}</SelectItem>
                        <SelectItem value="Bodo">{language === 'hi' ? 'बोडो' : 'Bodo'}</SelectItem>
                        <SelectItem value="Other">{language === 'hi' ? 'अन्य' : 'Other'}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="caste">{language === 'hi' ? 'जाति (वैकल्पिक)' : 'Caste (Optional)'}</Label>
                    <Input
                      id="caste"
                      placeholder={language === 'hi' ? 'यदि ज्ञात हो' : 'If known'}
                      value={formData.caste}
                      onChange={(e) => updateField('caste', e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="maritalStatus">{language === 'hi' ? 'वैवाहिक स्थिति' : 'Marital Status'} *</Label>
                    <Select onValueChange={(value: MaritalStatus) => updateField('maritalStatus', value)} value={formData.maritalStatus || ''}>
                      <SelectTrigger id="maritalStatus" className="w-full">
                        <SelectValue placeholder={t.fields.select} />
                      </SelectTrigger>
                      <SelectContent className="z-[9999]" position="popper" sideOffset={4}>
                        <SelectItem value="never-married">{language === 'hi' ? 'अविवाहित' : 'Never Married'}</SelectItem>
                        <SelectItem value="divorced">{language === 'hi' ? 'तलाकशुदा' : 'Divorced'}</SelectItem>
                        <SelectItem value="widowed">{language === 'hi' ? 'विधुर/विधवा' : 'Widowed'}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="height">{language === 'hi' ? 'ऊंचाई' : 'Height'} *</Label>
                    <Select onValueChange={(value) => updateField('height', value)} value={formData.height || ''}>
                      <SelectTrigger id="height" className="w-full">
                        <SelectValue placeholder={language === 'hi' ? 'ऊंचाई चुनें' : 'Select Height'} />
                      </SelectTrigger>
                      <SelectContent className="z-[9999] max-h-60" position="popper" sideOffset={4}>
                        <SelectItem value="4'0&quot; (122 cm)">4'0" (122 cm)</SelectItem>
                        <SelectItem value="4'1&quot; (124 cm)">4'1" (124 cm)</SelectItem>
                        <SelectItem value="4'2&quot; (127 cm)">4'2" (127 cm)</SelectItem>
                        <SelectItem value="4'3&quot; (130 cm)">4'3" (130 cm)</SelectItem>
                        <SelectItem value="4'4&quot; (132 cm)">4'4" (132 cm)</SelectItem>
                        <SelectItem value="4'5&quot; (135 cm)">4'5" (135 cm)</SelectItem>
                        <SelectItem value="4'6&quot; (137 cm)">4'6" (137 cm)</SelectItem>
                        <SelectItem value="4'7&quot; (140 cm)">4'7" (140 cm)</SelectItem>
                        <SelectItem value="4'8&quot; (142 cm)">4'8" (142 cm)</SelectItem>
                        <SelectItem value="4'9&quot; (145 cm)">4'9" (145 cm)</SelectItem>
                        <SelectItem value="4'10&quot; (147 cm)">4'10" (147 cm)</SelectItem>
                        <SelectItem value="4'11&quot; (150 cm)">4'11" (150 cm)</SelectItem>
                        <SelectItem value="5'0&quot; (152 cm)">5'0" (152 cm)</SelectItem>
                        <SelectItem value="5'1&quot; (155 cm)">5'1" (155 cm)</SelectItem>
                        <SelectItem value="5'2&quot; (157 cm)">5'2" (157 cm)</SelectItem>
                        <SelectItem value="5'3&quot; (160 cm)">5'3" (160 cm)</SelectItem>
                        <SelectItem value="5'4&quot; (163 cm)">5'4" (163 cm)</SelectItem>
                        <SelectItem value="5'5&quot; (165 cm)">5'5" (165 cm)</SelectItem>
                        <SelectItem value="5'6&quot; (168 cm)">5'6" (168 cm)</SelectItem>
                        <SelectItem value="5'7&quot; (170 cm)">5'7" (170 cm)</SelectItem>
                        <SelectItem value="5'8&quot; (173 cm)">5'8" (173 cm)</SelectItem>
                        <SelectItem value="5'9&quot; (175 cm)">5'9" (175 cm)</SelectItem>
                        <SelectItem value="5'10&quot; (178 cm)">5'10" (178 cm)</SelectItem>
                        <SelectItem value="5'11&quot; (180 cm)">5'11" (180 cm)</SelectItem>
                        <SelectItem value="6'0&quot; (183 cm)">6'0" (183 cm)</SelectItem>
                        <SelectItem value="6'1&quot; (185 cm)">6'1" (185 cm)</SelectItem>
                        <SelectItem value="6'2&quot; (188 cm)">6'2" (188 cm)</SelectItem>
                        <SelectItem value="6'3&quot; (191 cm)">6'3" (191 cm)</SelectItem>
                        <SelectItem value="6'4&quot; (193 cm)">6'4" (193 cm)</SelectItem>
                        <SelectItem value="6'5&quot; (196 cm)">6'5" (196 cm)</SelectItem>
                        <SelectItem value="6'6&quot; (198 cm)">6'6" (198 cm)</SelectItem>
                        <SelectItem value="6'7&quot; (201 cm)">6'7" (201 cm)</SelectItem>
                        <SelectItem value="6'8&quot; (203 cm)">6'8" (203 cm)</SelectItem>
                        <SelectItem value="6'9&quot; (206 cm)">6'9" (206 cm)</SelectItem>
                        <SelectItem value="6'10&quot; (208 cm)">6'10" (208 cm)</SelectItem>
                        <SelectItem value="6'11&quot; (211 cm)">6'11" (211 cm)</SelectItem>
                        <SelectItem value="7'0&quot; (213 cm)">7'0" (213 cm)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="weight">{language === 'hi' ? 'वजन (वैकल्पिक)' : 'Weight (Optional)'}</Label>
                    <Select onValueChange={(value) => updateField('weight', value)} value={formData.weight || ''}>
                      <SelectTrigger id="weight" className="w-full">
                        <SelectValue placeholder={language === 'hi' ? 'वजन चुनें' : 'Select Weight'} />
                      </SelectTrigger>
                      <SelectContent className="z-[9999] max-h-60" position="popper" sideOffset={4}>
                        <SelectItem value="40 kg (88 lbs)">40 kg (88 lbs)</SelectItem>
                        <SelectItem value="45 kg (99 lbs)">45 kg (99 lbs)</SelectItem>
                        <SelectItem value="50 kg (110 lbs)">50 kg (110 lbs)</SelectItem>
                        <SelectItem value="55 kg (121 lbs)">55 kg (121 lbs)</SelectItem>
                        <SelectItem value="60 kg (132 lbs)">60 kg (132 lbs)</SelectItem>
                        <SelectItem value="65 kg (143 lbs)">65 kg (143 lbs)</SelectItem>
                        <SelectItem value="70 kg (154 lbs)">70 kg (154 lbs)</SelectItem>
                        <SelectItem value="75 kg (165 lbs)">75 kg (165 lbs)</SelectItem>
                        <SelectItem value="80 kg (176 lbs)">80 kg (176 lbs)</SelectItem>
                        <SelectItem value="85 kg (187 lbs)">85 kg (187 lbs)</SelectItem>
                        <SelectItem value="90 kg (198 lbs)">90 kg (198 lbs)</SelectItem>
                        <SelectItem value="95 kg (209 lbs)">95 kg (209 lbs)</SelectItem>
                        <SelectItem value="100 kg (220 lbs)">100 kg (220 lbs)</SelectItem>
                        <SelectItem value="105 kg (231 lbs)">105 kg (231 lbs)</SelectItem>
                        <SelectItem value="110 kg (243 lbs)">110 kg (243 lbs)</SelectItem>
                        <SelectItem value="115 kg (254 lbs)">115 kg (254 lbs)</SelectItem>
                        <SelectItem value="120 kg (265 lbs)">120 kg (265 lbs)</SelectItem>
                        <SelectItem value="125+ kg (275+ lbs)">125+ kg (275+ lbs)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="disability">{language === 'hi' ? 'दिव्यांग' : 'Differently Abled'} *</Label>
                    <Select 
                      value={formData.disability || 'no'} 
                      onValueChange={(value: DisabilityStatus) => updateField('disability', value)}
                    >
                      <SelectTrigger id="disability" className="w-full">
                        <SelectValue placeholder={language === 'hi' ? 'चुनें' : 'Select'} />
                      </SelectTrigger>
                      <SelectContent className="z-[9999]" position="popper" sideOffset={4}>
                        <SelectItem value="no">{language === 'hi' ? 'नहीं' : 'No'}</SelectItem>
                        <SelectItem value="yes">{language === 'hi' ? 'हाँ' : 'Yes'}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Disability Details - show only if disability is 'yes' */}
                {formData.disability === 'yes' && (
                  <div className="space-y-2">
                    <Label htmlFor="disabilityDetails">
                      {language === 'hi' ? 'विवरण (वैकल्पिक)' : 'Details (Optional)'}
                    </Label>
                    <Textarea
                      id="disabilityDetails"
                      placeholder={language === 'hi' ? 'यदि आप साझा करना चाहें तो अधिक विवरण दें' : 'Provide more details if you wish to share'}
                      value={formData.disabilityDetails}
                      onChange={(e) => updateField('disabilityDetails', e.target.value)}
                      className="min-h-[60px]"
                    />
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="horoscopeMatching">{language === 'hi' ? 'कुंडली मिलान' : 'Horoscope Matching'} *</Label>
                    <Select 
                      value={formData.horoscopeMatching || 'not-mandatory'} 
                      onValueChange={(value: 'mandatory' | 'not-mandatory' | 'decide-later') => updateField('horoscopeMatching', value)}
                    >
                      <SelectTrigger id="horoscopeMatching" className="w-full">
                        <SelectValue placeholder={t.fields.select} />
                      </SelectTrigger>
                      <SelectContent className="z-[9999]" position="popper" sideOffset={4}>
                        <SelectItem value="mandatory">{language === 'hi' ? 'अनिवार्य' : 'Mandatory'}</SelectItem>
                        <SelectItem value="not-mandatory">{language === 'hi' ? 'अनिवार्य नहीं' : 'Not Mandatory'}</SelectItem>
                        <SelectItem value="decide-later">{language === 'hi' ? 'बाद में तय करेंगे' : 'Decide Later'}</SelectItem>
                      </SelectContent>
                    </Select>
                    {formData.horoscopeMatching === 'mandatory' && (
                      <p className="text-xs text-amber-600 dark:text-amber-400 font-medium">
                        {language === 'hi' 
                          ? '⚠️ कुंडली मिलान अनिवार्य है - जन्म समय और जन्म स्थान आवश्यक है'
                          : '⚠️ Horoscope matching is mandatory - Birth Time and Birth Place are required'}
                      </p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="birthTime">
                      {language === 'hi' ? 'जन्म समय' : 'Birth Time'}
                      {formData.horoscopeMatching === 'mandatory' ? ' *' : ` (${language === 'hi' ? 'वैकल्पिक' : 'Optional'})`}
                    </Label>
                    <Input
                      id="birthTime"
                      type="time"
                      placeholder={language === 'hi' ? 'उदाहरण: 10:30 AM' : 'Example: 10:30 AM'}
                      value={formData.birthTime}
                      onChange={(e) => updateField('birthTime', e.target.value)}
                      className={formData.horoscopeMatching === 'mandatory' && !formData.birthTime ? 'border-amber-500' : ''}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="birthPlace">
                      {language === 'hi' ? 'जन्म स्थान' : 'Birth Place'}
                      {formData.horoscopeMatching === 'mandatory' ? ' *' : ` (${language === 'hi' ? 'वैकल्पिक' : 'Optional'})`}
                    </Label>
                    <Input
                      id="birthPlace"
                      placeholder={language === 'hi' ? 'उदाहरण: दिल्ली, जयपुर' : 'Example: Delhi, Jaipur'}
                      value={formData.birthPlace}
                      onChange={(e) => updateField('birthPlace', e.target.value)}
                      className={formData.horoscopeMatching === 'mandatory' && !formData.birthPlace ? 'border-amber-500' : ''}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="diet">{language === 'hi' ? 'खान-पान (वैकल्पिक)' : 'Diet (Optional)'}</Label>
                    <Select 
                      value={formData.diet} 
                      onValueChange={(value) => updateField('diet', value)}
                    >
                      <SelectTrigger id="diet" className="w-full">
                        <SelectValue placeholder={t.fields.select} />
                      </SelectTrigger>
                      <SelectContent className="z-[9999]" position="popper" sideOffset={4}>
                        <SelectItem value="veg">{language === 'hi' ? 'शाकाहारी' : 'Vegetarian'}</SelectItem>
                        <SelectItem value="non-veg">{language === 'hi' ? 'मांसाहारी' : 'Non-Vegetarian'}</SelectItem>
                        <SelectItem value="occasionally-non-veg">{language === 'hi' ? 'कभी-कभी मांसाहारी' : 'Occasionally Non-Veg'}</SelectItem>
                        <SelectItem value="jain">{language === 'hi' ? 'जैन' : 'Jain'}</SelectItem>
                        <SelectItem value="vegan">{language === 'hi' ? 'वीगन' : 'Vegan'}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="drinkingHabit">{language === 'hi' ? 'शराब (वैकल्पिक)' : 'Drinking (Optional)'}</Label>
                    <Select 
                      value={formData.drinkingHabit} 
                      onValueChange={(value) => updateField('drinkingHabit', value)}
                    >
                      <SelectTrigger id="drinkingHabit" className="w-full">
                        <SelectValue placeholder={t.fields.select} />
                      </SelectTrigger>
                      <SelectContent className="z-[9999]" position="popper" sideOffset={4}>
                        <SelectItem value="never">{language === 'hi' ? 'कभी नहीं' : 'Never'}</SelectItem>
                        <SelectItem value="occasionally">{language === 'hi' ? 'कभी-कभी' : 'Occasionally'}</SelectItem>
                        <SelectItem value="regularly">{language === 'hi' ? 'नियमित' : 'Regularly'}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="smokingHabit">{language === 'hi' ? 'धूम्रपान (वैकल्पिक)' : 'Smoking (Optional)'}</Label>
                    <Select 
                      value={formData.smokingHabit} 
                      onValueChange={(value) => updateField('smokingHabit', value)}
                    >
                      <SelectTrigger id="smokingHabit" className="w-full">
                        <SelectValue placeholder={t.fields.select} />
                      </SelectTrigger>
                      <SelectContent className="z-[9999]" position="popper" sideOffset={4}>
                        <SelectItem value="never">{language === 'hi' ? 'कभी नहीं' : 'Never'}</SelectItem>
                        <SelectItem value="occasionally">{language === 'hi' ? 'कभी-कभी' : 'Occasionally'}</SelectItem>
                        <SelectItem value="regularly">{language === 'hi' ? 'नियमित' : 'Regularly'}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="annualIncome">{language === 'hi' ? 'वार्षिक आय (वैकल्पिक)' : 'Annual Income (Optional)'}</Label>
                  <Select 
                    value={formData.annualIncome} 
                    onValueChange={(value) => updateField('annualIncome', value)}
                  >
                    <SelectTrigger id="annualIncome" className="w-full">
                      <SelectValue placeholder={t.fields.select} />
                    </SelectTrigger>
                    <SelectContent className="z-[9999]" position="popper" sideOffset={4}>
                      <SelectItem value="no-income">{language === 'hi' ? 'कोई आय नहीं' : 'No Income'}</SelectItem>
                      <SelectItem value="below-1-lakh">{language === 'hi' ? '₹1 लाख से कम' : 'Below ₹1 Lakh'}</SelectItem>
                      <SelectItem value="1-2-lakh">{language === 'hi' ? '₹1-2 लाख' : '₹1-2 Lakh'}</SelectItem>
                      <SelectItem value="2-3-lakh">{language === 'hi' ? '₹2-3 लाख' : '₹2-3 Lakh'}</SelectItem>
                      <SelectItem value="3-4-lakh">{language === 'hi' ? '₹3-4 लाख' : '₹3-4 Lakh'}</SelectItem>
                      <SelectItem value="4-5-lakh">{language === 'hi' ? '₹4-5 लाख' : '₹4-5 Lakh'}</SelectItem>
                      <SelectItem value="5-7.5-lakh">{language === 'hi' ? '₹5-7.5 लाख' : '₹5-7.5 Lakh'}</SelectItem>
                      <SelectItem value="7.5-10-lakh">{language === 'hi' ? '₹7.5-10 लाख' : '₹7.5-10 Lakh'}</SelectItem>
                      <SelectItem value="10-15-lakh">{language === 'hi' ? '₹10-15 लाख' : '₹10-15 Lakh'}</SelectItem>
                      <SelectItem value="15-20-lakh">{language === 'hi' ? '₹15-20 लाख' : '₹15-20 Lakh'}</SelectItem>
                      <SelectItem value="20-25-lakh">{language === 'hi' ? '₹20-25 लाख' : '₹20-25 Lakh'}</SelectItem>
                      <SelectItem value="25-35-lakh">{language === 'hi' ? '₹25-35 लाख' : '₹25-35 Lakh'}</SelectItem>
                      <SelectItem value="35-50-lakh">{language === 'hi' ? '₹35-50 लाख' : '₹35-50 Lakh'}</SelectItem>
                      <SelectItem value="50-75-lakh">{language === 'hi' ? '₹50-75 लाख' : '₹50-75 Lakh'}</SelectItem>
                      <SelectItem value="75-1-crore">{language === 'hi' ? '₹75 लाख - 1 करोड़' : '₹75 Lakh - 1 Crore'}</SelectItem>
                      <SelectItem value="above-1-crore">{language === 'hi' ? '₹1 करोड़ से अधिक' : 'Above ₹1 Crore'}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="education">{language === 'hi' ? 'शिक्षा' : 'Education'} *</Label>
                  <SearchableSelect
                    options={EDUCATION_OPTIONS}
                    value={formData.education || ''}
                    onValueChange={(value) => updateField('education', value)}
                    placeholder={language === 'hi' ? 'शिक्षा चुनें' : 'Select Education'}
                    searchPlaceholder={language === 'hi' ? 'शिक्षा खोजें...' : 'Search education...'}
                    emptyText={language === 'hi' ? 'कोई परिणाम नहीं' : 'No results found'}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="occupation">{language === 'hi' ? 'रोजगार स्थिति' : 'Employment Status'} *</Label>
                  <SearchableSelect
                    options={OCCUPATION_OPTIONS}
                    value={formData.occupation || ''}
                    onValueChange={(value) => updateField('occupation', value)}
                    placeholder={language === 'hi' ? 'रोजगार स्थिति चुनें' : 'Select Employment Status'}
                    searchPlaceholder={language === 'hi' ? 'खोजें...' : 'Search...'}
                    emptyText={language === 'hi' ? 'कोई परिणाम नहीं' : 'No results found'}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="position">{language === 'hi' ? 'व्यवसाय/पेशा (वैकल्पिक)' : 'Occupation/Profession (Optional)'}</Label>
                    <Input
                      id="position"
                      placeholder={language === 'hi' ? 'उदाहरण: सॉफ्टवेयर इंजीनियर, डॉक्टर, वकील' : 'Example: Software Engineer, Doctor, Lawyer'}
                      value={formData.position}
                      onChange={(e) => updateField('position', e.target.value)}
                    />
                  </div>
                </div>
              </div>
            )}

            {step === 3 && !showVerification && (
              <div className="space-y-4">
                {/* Country, State, City - in order */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="country">{language === 'hi' ? 'वर्तमान में रह रहे देश' : 'Living in Country'} *</Label>
                    <Select 
                      value={formData.country || ''} 
                      onValueChange={(value) => {
                        // Update country, clear state, and clear residential status if switching to India
                        setFormData(prev => ({
                          ...prev,
                          country: value,
                          state: '', // Clear state when country changes
                          residentialStatus: value === 'India' ? undefined : prev.residentialStatus
                        }))
                      }}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder={language === 'hi' ? 'देश चुनें' : 'Select Country'} />
                      </SelectTrigger>
                      <SelectContent className="z-[9999]" position="item-aligned">
                        <SelectItem value="India">🇮🇳 India</SelectItem>
                        <SelectItem value="United States">🇺🇸 United States</SelectItem>
                        <SelectItem value="United Kingdom">🇬🇧 United Kingdom</SelectItem>
                        <SelectItem value="Canada">🇨🇦 Canada</SelectItem>
                        <SelectItem value="Australia">🇦🇺 Australia</SelectItem>
                        <SelectItem value="UAE">🇦🇪 UAE</SelectItem>
                        <SelectItem value="Singapore">🇸🇬 Singapore</SelectItem>
                        <SelectItem value="Germany">🇩🇪 Germany</SelectItem>
                        <SelectItem value="New Zealand">🇳🇿 New Zealand</SelectItem>
                        <SelectItem value="Saudi Arabia">🇸🇦 Saudi Arabia</SelectItem>
                        <SelectItem value="Qatar">🇶🇦 Qatar</SelectItem>
                        <SelectItem value="Kuwait">🇰🇼 Kuwait</SelectItem>
                        <SelectItem value="Oman">🇴🇲 Oman</SelectItem>
                        <SelectItem value="Bahrain">🇧🇭 Bahrain</SelectItem>
                        <SelectItem value="Malaysia">🇲🇾 Malaysia</SelectItem>
                        <SelectItem value="Netherlands">🇳🇱 Netherlands</SelectItem>
                        <SelectItem value="France">🇫🇷 France</SelectItem>
                        <SelectItem value="Ireland">🇮🇪 Ireland</SelectItem>
                        <SelectItem value="Switzerland">🇨🇭 Switzerland</SelectItem>
                        <SelectItem value="Japan">🇯🇵 Japan</SelectItem>
                        <SelectItem value="South Korea">🇰🇷 South Korea</SelectItem>
                        <SelectItem value="Hong Kong">🇭🇰 Hong Kong</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="state">{language === 'hi' ? 'राज्य/प्रांत' : 'State/Province'} *</Label>
                    {getStatesForCountry(formData.country).length > 0 ? (
                      <Select 
                        value={formData.state || ''} 
                        onValueChange={(value) => {
                          setFormData(prev => ({
                            ...prev,
                            state: value,
                            location: '' // Clear city when state changes
                          }))
                          setCustomCity('') // Also clear custom city
                        }}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder={language === 'hi' ? 'राज्य चुनें' : 'Select State/Province'} />
                        </SelectTrigger>
                        <SelectContent className="z-[9999] max-h-[300px]" position="popper" sideOffset={4}>
                          {getStatesForCountry(formData.country).map((state) => (
                            <SelectItem key={state} value={state}>
                              {state}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <Input
                        id="state"
                        placeholder={language === 'hi' ? 'राज्य/प्रांत दर्ज करें' : 'Enter State/Province'}
                        value={formData.state || ''}
                        onChange={(e) => {
                          setFormData(prev => ({
                            ...prev,
                            state: e.target.value,
                            location: '' // Clear city when state changes
                          }))
                          setCustomCity('') // Also clear custom city
                        }}
                        required
                      />
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="location">{language === 'hi' ? 'शहर' : 'City'} *</Label>
                    {formData.state && getCitiesForState(formData.state).length > 0 ? (
                      <Select 
                        value={formData.location || ''} 
                        onValueChange={(value) => {
                          updateField('location', value)
                          // Clear customCity when selecting a predefined city
                          if (value !== '__other__') {
                            setCustomCity('')
                          }
                        }}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder={language === 'hi' ? 'शहर चुनें' : 'Select City'} />
                        </SelectTrigger>
                        <SelectContent className="z-[9999] max-h-[300px]" position="popper" sideOffset={4}>
                          {getCitiesForState(formData.state).map((city) => (
                            <SelectItem key={city} value={city}>
                              {city}
                            </SelectItem>
                          ))}
                          <SelectItem value="__other__">
                            {language === 'hi' ? '🔹 अन्य शहर...' : '🔹 Other City...'}
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <Input
                        id="location"
                        placeholder={language === 'hi' ? 'उदाहरण: मुंबई, न्यूयॉर्क' : 'Example: Mumbai, New York'}
                        value={formData.location || ''}
                        onChange={(e) => updateField('location', e.target.value)}
                        required
                      />
                    )}
                    {/* Show text input if "Other" is selected */}
                    {formData.location === '__other__' && (
                      <Input
                        id="location-other"
                        placeholder={language === 'hi' ? 'अपना शहर दर्ज करें' : 'Enter your city'}
                        className="mt-2 border-primary"
                        value={customCity}
                        onChange={(e) => setCustomCity(e.target.value)}
                        onBlur={() => {
                          // When user finishes typing, update the location if they entered something
                          if (customCity.trim()) {
                            updateField('location', customCity.trim())
                          }
                        }}
                        autoFocus
                        required
                      />
                    )}
                  </div>
                </div>

                {/* Residential Status - Only show if country is not India */}
                {formData.country && formData.country !== 'India' && (
                  <div className="space-y-2">
                    <Label htmlFor="residentialStatus">
                      {language === 'hi' ? 'निवास स्थिति' : 'Residential Status'} *
                    </Label>
                    <Select 
                      value={formData.residentialStatus} 
                      onValueChange={(value) => updateField('residentialStatus', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={language === 'hi' ? 'निवास स्थिति चुनें' : 'Select Residential Status'} />
                      </SelectTrigger>
                      <SelectContent className="z-[9999]" position="popper" sideOffset={4}>
                        <SelectItem value="citizen">
                          {language === 'hi' ? '🛂 नागरिक (Citizen)' : '🛂 Citizen'}
                        </SelectItem>
                        <SelectItem value="permanent-resident">
                          {language === 'hi' ? '🏠 स्थायी निवासी (PR)' : '🏠 Permanent Resident (PR)'}
                        </SelectItem>
                        <SelectItem value="work-permit">
                          {language === 'hi' ? '💼 वर्क परमिट / वर्क वीसा' : '💼 Work Permit / Work Visa'}
                        </SelectItem>
                        <SelectItem value="student-visa">
                          {language === 'hi' ? '🎓 स्टूडेंट वीसा' : '🎓 Student Visa'}
                        </SelectItem>
                        <SelectItem value="dependent-visa">
                          {language === 'hi' ? '👨‍👩‍👧 डिपेंडेंट वीसा' : '👨‍👩‍👧 Dependent Visa'}
                        </SelectItem>
                        <SelectItem value="oci">
                          {language === 'hi' ? '🇮🇳 OCI (भारत का विदेशी नागरिक)' : '🇮🇳 OCI (Overseas Citizen of India)'}
                        </SelectItem>
                        <SelectItem value="applied-for-pr">
                          {language === 'hi' ? '📝 PR के लिए आवेदन किया' : '📝 Applied for PR'}
                        </SelectItem>
                        <SelectItem value="applied-for-citizenship">
                          {language === 'hi' ? '📝 नागरिकता के लिए आवेदन किया' : '📝 Applied for Citizenship'}
                        </SelectItem>
                        <SelectItem value="temporary-visa">
                          {language === 'hi' ? '⏳ अस्थायी वीसा' : '⏳ Temporary Visa'}
                        </SelectItem>
                        <SelectItem value="tourist-visa">
                          {language === 'hi' ? '✈️ टूरिस्ट/विजिटर वीसा' : '✈️ Tourist/Visitor Visa'}
                        </SelectItem>
                        <SelectItem value="other">
                          {language === 'hi' ? '📋 अन्य' : '📋 Other'}
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      {language === 'hi' 
                        ? 'विदेश में रहने वालों के लिए निवास स्थिति बताना आवश्यक है'
                        : 'Residential status is required for those living outside India'}
                    </p>
                  </div>
                )}

                {/* Email and Mobile - Locked in edit mode (not in admin mode) */}
                {isEditMode && !isAdminMode && (
                  <Alert className="bg-gray-50 border-gray-400 dark:bg-gray-950/30">
                    <ShieldCheck size={20} weight="fill" className="text-gray-600" />
                    <AlertDescription className="text-gray-700 dark:text-gray-300">
                      {language === 'hi' 
                        ? 'ईमेल और मोबाइल संपादित नहीं किए जा सकते। इन्हें पंजीकरण के समय सत्यापित किया गया था। बदलने के लिए एडमिन से संपर्क करें।'
                        : 'Email and Mobile cannot be edited. These were verified during registration. Contact admin to change.'}
                    </AlertDescription>
                  </Alert>
                )}

                <div className="space-y-2">
                  <Label htmlFor="email">
                    {language === 'hi' ? 'ईमेल' : 'Email'} *
                    {isEditMode && !isAdminMode && (
                      <span className="ml-2 text-xs text-gray-500">
                        🔒 {language === 'hi' ? 'सत्यापित' : 'Verified'}
                      </span>
                    )}
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="example@email.com"
                    value={formData.email || ''}
                    onChange={(e) => updateField('email', e.target.value)}
                    required
                    disabled={isEditMode && !isAdminMode}
                    className={isEditMode && !isAdminMode ? 'bg-muted' : ''}
                  />
                  {isEditMode && !isAdminMode && (
                    <p className="text-xs text-gray-600">
                      {language === 'hi' ? 'ईमेल बदलने के लिए एडमिन से संपर्क करें' : 'Contact admin to change email'}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="mobile">
                    {language === 'hi' ? 'मोबाइल' : 'Mobile'} *
                    {isEditMode && !isAdminMode && (
                      <span className="ml-2 text-xs text-gray-500">
                        🔒 {language === 'hi' ? 'सत्यापित' : 'Verified'}
                      </span>
                    )}
                  </Label>
                  <div className="flex gap-2">
                    <Select 
                      onValueChange={(value) => updateField('countryCode', value)} 
                      value={formData.countryCode}
                      disabled={isEditMode && !isAdminMode}
                    >
                      <SelectTrigger className={`w-[140px] ${isEditMode && !isAdminMode ? 'bg-muted' : ''}`}>
                        <SelectValue placeholder="+91 🇮🇳" />
                      </SelectTrigger>
                      <SelectContent 
                        className="z-[9999] max-h-[280px]" 
                        position="popper" 
                        sideOffset={4}
                        align="start"
                        avoidCollisions={false}
                      >
                        {Object.entries(COUNTRY_PHONE_LENGTHS)
                          .sort((a, b) => a[1].name.localeCompare(b[1].name))
                          .map(([code, info]) => (
                            <SelectItem key={code} value={code}>
                              {code} {info.flag} {info.name}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                    <Input
                      id="mobile"
                      type="tel"
                      placeholder={language === 'hi' ? `${getPhoneLengthInfo(formData.countryCode || '+91').display} अंक का मोबाइल नंबर` : `${getPhoneLengthInfo(formData.countryCode || '+91').display} digit mobile number`}
                      value={formData.mobile || ''}
                      onChange={(e) => {
                        const maxLength = getPhoneLengthInfo(formData.countryCode || '+91').max
                        const value = e.target.value.replace(/\D/g, '').slice(0, maxLength)
                        updateField('mobile', value)
                      }}
                      maxLength={getPhoneLengthInfo(formData.countryCode || '+91').max}
                      required
                      disabled={isEditMode && !isAdminMode}
                      className={`flex-1 ${isEditMode && !isAdminMode ? 'bg-muted' : ''}`}
                    />
                  </div>
                  {isEditMode && !isAdminMode && (
                    <p className="text-xs text-gray-600">
                      {language === 'hi' ? 'मोबाइल बदलने के लिए एडमिन से संपर्क करें' : 'Contact admin to change mobile'}
                    </p>
                  )}
                  {(!isEditMode || isAdminMode) && formData.mobile && !isValidPhoneLength(formData.mobile, formData.countryCode || '+91') && (
                    <p className="text-xs text-destructive">
                      {language === 'hi' ? `कृपया ${getPhoneLengthInfo(formData.countryCode || '+91').display} अंक का मोबाइल नंबर दर्ज करें` : `Please enter a ${getPhoneLengthInfo(formData.countryCode || '+91').display} digit mobile number`}
                    </p>
                  )}
                </div>
              </div>
            )}

            {step === 3 && showVerification && (
              <div className="space-y-6">
                <div className="text-center mb-4">
                  <CheckCircle size={48} weight="fill" className="text-teal mx-auto mb-2" />
                  <h3 className="text-xl font-bold mb-1">
                    {language === 'hi' ? 'OTP सत्यापन' : 'OTP Verification'}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {language === 'hi' 
                      ? 'आपके ईमेल और मोबाइल पर OTP भेजा गया है' 
                      : 'OTPs have been sent to your email and mobile'}
                  </p>
                </div>

                <Alert className="bg-primary/5 border-primary/20">
                  <Info size={18} />
                  <AlertDescription className="text-sm">
                    <strong>{language === 'hi' ? 'डेमो के लिए:' : 'For Demo:'}</strong>{' '}
                    {language === 'hi' 
                      ? 'OTP ऊपर toast सूचना में दिखाए गए हैं' 
                      : 'OTPs are shown in the toast notification above'}
                  </AlertDescription>
                </Alert>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <Label htmlFor="emailOtp" className="text-base font-semibold">
                      {language === 'hi' ? 'ईमेल OTP' : 'Email OTP'}
                    </Label>
                    <div className="space-y-2">
                      <Input
                        id="emailOtp"
                        placeholder="000000"
                        value={emailOtp}
                        onChange={(e) => setEmailOtp(e.target.value)}
                        maxLength={6}
                        className="text-center text-lg tracking-widest font-mono"
                        disabled={emailVerified}
                      />
                      {emailVerified && (
                        <div className="flex items-center gap-2 text-sm text-teal">
                          <CheckCircle size={16} weight="fill" />
                          {language === 'hi' ? 'ईमेल सत्यापित' : 'Email Verified'}
                        </div>
                      )}
                      {!emailVerified && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={verifyEmailOtp}
                          disabled={emailOtp.length !== 6}
                          className="w-full"
                        >
                          {language === 'hi' ? 'ईमेल OTP सत्यापित करें' : 'Verify Email OTP'}
                        </Button>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {language === 'hi' ? 'भेजा गया:' : 'Sent to:'} {formData.email}
                    </p>
                    {!emailVerified && (
                      <Button
                        type="button"
                        variant="link"
                        size="sm"
                        onClick={() => sendOtps(true, false, true)}
                        disabled={otpCooldownRemaining > 0}
                        className="text-xs p-0 h-auto"
                      >
                        {otpCooldownRemaining > 0 
                          ? (language === 'hi' ? `${otpCooldownRemaining}s प्रतीक्षा करें` : `Wait ${otpCooldownRemaining}s`)
                          : (language === 'hi' ? 'ईमेल OTP पुनः भेजें' : 'Resend Email OTP')}
                      </Button>
                    )}
                  </div>

                  <div className="space-y-3">
                    <Label htmlFor="mobileOtp" className="text-base font-semibold">
                      {language === 'hi' ? 'मोबाइल OTP' : 'Mobile OTP'}
                    </Label>
                    <div className="space-y-2">
                      <Input
                        id="mobileOtp"
                        placeholder="000000"
                        value={mobileOtp}
                        onChange={(e) => setMobileOtp(e.target.value)}
                        maxLength={6}
                        className="text-center text-lg tracking-widest font-mono"
                        disabled={mobileVerified}
                      />
                      {mobileVerified && (
                        <div className="flex items-center gap-2 text-sm text-teal">
                          <CheckCircle size={16} weight="fill" />
                          {language === 'hi' ? 'मोबाइल सत्यापित' : 'Mobile Verified'}
                        </div>
                      )}
                      {!mobileVerified && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={verifyMobileOtp}
                          disabled={mobileOtp.length !== 6}
                          className="w-full"
                        >
                          {language === 'hi' ? 'मोबाइल OTP सत्यापित करें' : 'Verify Mobile OTP'}
                        </Button>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {language === 'hi' ? 'भेजा गया:' : 'Sent to:'} {formData.mobile}
                    </p>
                    {!mobileVerified && (
                      <Button
                        type="button"
                        variant="link"
                        size="sm"
                        onClick={() => sendOtps(false, true, true)}
                        disabled={otpCooldownRemaining > 0}
                        className="text-xs p-0 h-auto"
                      >
                        {otpCooldownRemaining > 0 
                          ? (language === 'hi' ? `${otpCooldownRemaining}s प्रतीक्षा करें` : `Wait ${otpCooldownRemaining}s`)
                          : (language === 'hi' ? 'मोबाइल OTP पुनः भेजें' : 'Resend Mobile OTP')}
                      </Button>
                    )}
                  </div>
                </div>

                <div className="pt-4">
                  <Button
                    type="button"
                    onClick={handleVerificationComplete}
                    disabled={!emailVerified || !mobileVerified}
                    className="w-full"
                  >
                    {language === 'hi' ? 'सत्यापन पूर्ण करें और जारी रखें' : 'Complete Verification & Continue'}
                  </Button>
                </div>

                {/* Show Resend All OTPs button only if both are not verified */}
                {!emailVerified && !mobileVerified && (
                  <div className="text-center">
                    <Button
                      type="button"
                      variant="link"
                      size="sm"
                      onClick={() => sendOtps(false, false, true)}
                      disabled={otpCooldownRemaining > 0}
                      className="text-sm"
                    >
                      {otpCooldownRemaining > 0 
                        ? (language === 'hi' ? `${otpCooldownRemaining}s प्रतीक्षा करें` : `Wait ${otpCooldownRemaining}s`)
                        : (language === 'hi' ? 'दोनों OTP पुनः भेजें' : 'Resend Both OTPs')}
                    </Button>
                  </div>
                )}
              </div>
            )}

            {step === 4 && (
              <div className="space-y-6">
                {/* Admin re-verification notice for edit mode */}
                {isEditMode && !isAdminMode && (
                  <Alert className="bg-amber-50 border-amber-400 dark:bg-amber-950/30 dark:border-amber-600">
                    <Warning size={18} className="text-amber-600" />
                    <AlertDescription className="text-amber-700 dark:text-amber-400 text-sm">
                      {language === 'hi' 
                        ? '⚠️ फोटो या सेल्फी बदलने पर एडमिन द्वारा पुनः सत्यापन आवश्यक होगा।'
                        : '⚠️ Changing photos or selfie will require admin re-verification.'}
                    </AlertDescription>
                  </Alert>
                )}
                
                {/* Multiple Photos Upload Section */}
                <div className="space-y-3">
                  <Label className="flex items-center gap-2 flex-wrap">
                    <Image size={20} weight="bold" />
                    {language === 'hi' ? 'फोटो अपलोड करें (न्यूनतम 1, अधिकतम 3 फोटो)' : 'Upload Photos (minimum 1, maximum 3 photos)'} *
                    <AdminVerificationBadge field="photos" />
                  </Label>
                  
                  <Alert className="bg-amber-50 border-amber-300 dark:bg-amber-950/20 dark:border-amber-700">
                    <Warning size={16} className="text-amber-600" />
                    <AlertDescription className="text-amber-700 dark:text-amber-400 text-sm">
                      {language === 'hi' 
                        ? '⏰ कृपया हाल की फोटो अपलोड करें। फोटो 6 महीने से अधिक पुरानी नहीं होनी चाहिए।'
                        : '⏰ Please upload recent photographs. Photos should not be more than 6 months old.'}
                    </AlertDescription>
                  </Alert>
                  
                  {/* Photo count status */}
                  {photos.length === 0 && (
                    <Alert className="bg-red-50 border-red-300 dark:bg-red-950/20 dark:border-red-700">
                      <Warning size={16} className="text-red-600" />
                      <AlertDescription className="text-red-700 dark:text-red-400 text-sm font-medium">
                        {language === 'hi' 
                          ? '📸 कम से कम 1 फोटो अपलोड करना अनिवार्य है'
                          : '📸 At least 1 photo is required'}
                      </AlertDescription>
                    </Alert>
                  )}
                  {photos.length >= 3 && (
                    <Alert className="bg-green-50 border-green-300 dark:bg-green-950/20 dark:border-green-700">
                      <CheckCircle size={16} weight="fill" className="text-green-600" />
                      <AlertDescription className="text-green-700 dark:text-green-400 text-sm">
                        {language === 'hi' 
                          ? '✅ अधिकतम फोटो सीमा (3) पूरी हो गई'
                          : '✅ Maximum photo limit (3) reached'}
                      </AlertDescription>
                    </Alert>
                  )}
                  
                  <div className="grid grid-cols-3 gap-3">
                    {/* Existing Photos */}
                    {photos.map((photo, index) => (
                      <div key={index} className="relative border-2 border-border rounded-lg p-1 aspect-square group">
                        <img 
                          src={photo.preview} 
                          alt={`Photo ${index + 1}`} 
                          className="w-full h-full object-cover rounded-md cursor-pointer transition-opacity group-hover:opacity-90"
                          onClick={() => openLightbox(photos.map(p => p.preview), index)}
                          title={language === 'hi' ? 'बड़ा देखने के लिए क्लिक करें' : 'Click to view larger'}
                        />
                        <div className="absolute top-1 right-1 flex gap-1">
                          <Button
                            type="button"
                            variant="secondary"
                            size="icon"
                            className="h-6 w-6 bg-background/80 hover:bg-background"
                            onClick={() => removePhoto(index)}
                            disabled={photos.length <= 1}
                            title={language === 'hi' ? 'हटाएं' : 'Delete'}
                          >
                            <X size={14} weight="bold" />
                          </Button>
                        </div>
                        <div className="absolute bottom-1 left-1 flex gap-1">
                          {index > 0 && (
                            <Button
                              type="button"
                              variant="secondary"
                              size="icon"
                              className="h-6 w-6 bg-background/80 hover:bg-background"
                              onClick={() => movePhoto(index, 'up')}
                              title={language === 'hi' ? 'ऊपर ले जाएं' : 'Move up'}
                            >
                              <ArrowUp size={14} weight="bold" />
                            </Button>
                          )}
                          {index < photos.length - 1 && (
                            <Button
                              type="button"
                              variant="secondary"
                              size="icon"
                              className="h-6 w-6 bg-background/80 hover:bg-background"
                              onClick={() => movePhoto(index, 'down')}
                              title={language === 'hi' ? 'नीचे ले जाएं' : 'Move down'}
                            >
                              <ArrowDown size={14} weight="bold" />
                            </Button>
                          )}
                        </div>
                        <div className="absolute top-1 left-1 bg-primary text-primary-foreground text-xs px-1.5 py-0.5 rounded">
                          {index + 1}
                        </div>
                      </div>
                    ))}
                    
                    {/* Add Photo Slot - Camera and File options */}
                    {photos.length < 3 && (
                      <div className="border-2 border-dashed border-border rounded-lg aspect-square flex flex-col items-center justify-center gap-2 p-2">
                        <span className="text-xs text-muted-foreground font-medium">
                          {language === 'hi' ? 'फोटो जोड़ें' : 'Add Photo'} ({photos.length}/3)
                        </span>
                        <div className="flex gap-2">
                          {/* Camera Option */}
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="h-10 w-10 p-0"
                            onClick={() => setShowPhotoCamera(true)}
                            title={language === 'hi' ? 'कैमरा से' : 'From Camera'}
                          >
                            <Camera size={18} className="text-primary" />
                          </Button>
                          
                          {/* File Upload Option */}
                          <label className="cursor-pointer">
                            <Input
                              type="file"
                              accept="image/*"
                              onChange={handlePhotoChange}
                              className="hidden"
                              multiple
                            />
                            <div className="h-10 w-10 flex items-center justify-center border rounded-md hover:bg-accent transition-colors" title={language === 'hi' ? 'गैलरी से' : 'From Gallery'}>
                              <Image size={18} className="text-muted-foreground" />
                            </div>
                          </label>
                        </div>
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {language === 'hi' 
                      ? 'पहली फोटो मुख्य प्रोफाइल फोटो होगी। तीर बटन से क्रम बदलें।' 
                      : 'First photo will be the main profile photo. Use arrow buttons to reorder.'}
                  </p>
                </div>

                {/* Live Selfie Capture Section */}
                <div className="space-y-3">
                  <Label className="flex items-center gap-2 flex-wrap">
                    <Camera size={20} weight="bold" />
                    {language === 'hi' ? 'लाइव सेल्फी लें (पहचान सत्यापन के लिए)' : 'Capture Live Selfie (for identity verification)'} *
                    <AdminVerificationBadge field="selfieUrl" />
                  </Label>
                  
                  <div className="border-2 border-dashed border-primary/30 rounded-lg p-4 bg-muted/20">
                    <div className="relative aspect-video max-w-md mx-auto rounded-lg overflow-hidden bg-black">
                      {selfiePreview ? (
                        <div className="relative w-full h-full">
                          <img 
                            src={selfiePreview} 
                            alt="Captured Selfie" 
                            className="w-full h-full object-cover"
                          />
                          {/* Show validation failure message on captured image */}
                          {faceCoveragePercent > 0 && !faceCoverageValid && (
                            <div className="absolute inset-0 border-4 border-amber-400 pointer-events-none">
                              <div className="absolute top-2 left-2 right-2 bg-amber-500/90 text-white text-xs px-2 py-1 rounded text-center">
                                {language === 'hi' 
                                  ? `चेहरा सत्यापन विफल (${faceCoveragePercent}%) - कृपया दोबारा लें`
                                  : `Face validation failed (${faceCoveragePercent}%) - Please retake`}
                              </div>
                            </div>
                          )}
                        </div>
                      ) : showCamera ? (
                        <div className="relative w-full h-full overflow-hidden">
                          <video 
                            ref={videoRef} 
                            autoPlay 
                            playsInline
                            className="w-full h-full object-cover transition-transform"
                            style={{ transform: `scaleX(-1) scale(${liveZoom})` }}
                          />
                          {/* Face guide overlay - shows oval for face positioning */}
                          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <div className="w-48 h-64 border-4 border-dashed border-white/60 rounded-full flex items-center justify-center">
                              <div className="text-white/80 text-xs text-center bg-black/40 px-2 py-1 rounded">
                                {language === 'hi' ? 'चेहरा यहां रखें' : 'Position face here'}
                              </div>
                            </div>
                          </div>
                          {/* Live Zoom Slider */}
                          <div className="absolute bottom-2 left-2 right-2 bg-black/70 rounded-lg px-3 py-2">
                            <div className="flex items-center gap-2">
                              <Label htmlFor="liveZoomSlider" className="text-white text-xs whitespace-nowrap">
                                {language === 'hi' ? 'ज़ूम:' : 'Zoom:'}
                              </Label>
                              <input
                                type="range"
                                id="liveZoomSlider"
                                min="1"
                                max="3"
                                step="0.1"
                                value={liveZoom}
                                onChange={(e) => setLiveZoom(parseFloat(e.target.value))}
                                className="flex-1 h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-white"
                                aria-label={language === 'hi' ? 'लाइव ज़ूम नियंत्रण' : 'Live zoom control'}
                              />
                              <span className="text-white text-xs font-medium w-10">{Math.round(liveZoom * 100)}%</span>
                            </div>
                            <p className="text-white/80 text-xs mt-1 text-center">
                              {language === 'hi' ? 'चेहरा 50% तक दिखने के लिए ज़ूम करें' : 'Zoom until face covers 50% of frame'}
                            </p>
                          </div>
                        </div>
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground">
                          <Camera size={64} weight="light" className="opacity-30 mb-2" />
                          <p className="text-sm">{language === 'hi' ? 'कैमरा प्रीव्यू यहां दिखेगा' : 'Camera preview will appear here'}</p>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex justify-center gap-3 mt-4">
                      {selfiePreview ? (
                        /* Preview mode - just show retake button */
                        <Button 
                          type="button" 
                          variant="outline"
                          onClick={() => {
                            setSelfieFile(null)
                            setSelfiePreview(undefined)
                            setSelfieZoom(1)
                            setLiveZoom(1)
                          }}
                          className="gap-2"
                        >
                          <Camera size={16} />
                          {language === 'hi' ? 'दोबारा लें' : 'Retake'}
                        </Button>
                      ) : showCamera ? (
                        <>
                          <Button 
                            type="button" 
                            onClick={capturePhoto}
                            disabled={!isCameraReady || isCapturingSelfie}
                            className="gap-2 bg-green-600 hover:bg-green-700"
                          >
                            {isCapturingSelfie ? (
                              <SpinnerGap size={16} className="animate-spin" />
                            ) : (
                              <Camera size={16} weight="bold" />
                            )}
                            {isCapturingSelfie 
                              ? (language === 'hi' ? 'प्रोसेसिंग...' : 'Processing...') 
                              : (language === 'hi' ? 'कैप्चर करें' : 'Capture')}
                          </Button>
                          <Button 
                            type="button" 
                            variant="outline"
                            onClick={stopCamera}
                            disabled={isCapturingSelfie}
                          >
                            {language === 'hi' ? 'रद्द करें' : 'Cancel'}
                          </Button>
                          {/* Switch Camera button - shown when multiple cameras available */}
                          {availableCameras.length > 1 && (
                            <Button 
                              type="button" 
                              variant="secondary"
                              disabled={isCapturingSelfie}
                              onClick={() => {
                                // Cycle to next camera
                                const currentIndex = availableCameras.findIndex(c => c.deviceId === selectedCameraId)
                                const nextIndex = (currentIndex + 1) % availableCameras.length
                                switchCamera(availableCameras[nextIndex].deviceId)
                              }}
                              className="gap-2"
                            >
                              🔄 {language === 'hi' ? 'कैमरा बदलें' : 'Switch Camera'}
                            </Button>
                          )}
                        </>
                      ) : (
                        <Button 
                          type="button" 
                          onClick={() => startCamera()}
                          className="gap-2"
                        >
                          <Camera size={16} weight="bold" />
                          {language === 'hi' ? 'कैमरा शुरू करें' : 'Start Camera'}
                        </Button>
                      )}
                    </div>
                    
                    {/* Camera source selector - dropdown for selecting specific camera */}
                    {showCamera && availableCameras.length > 1 && (
                      <div className="flex flex-col items-center gap-2 mt-3">
                        <p className="text-xs text-muted-foreground">
                          {language === 'hi' 
                            ? `${availableCameras.length} कैमरे उपलब्ध हैं - नीचे से चुनें` 
                            : `${availableCameras.length} cameras available - select below`}
                        </p>
                        <Select value={selectedCameraId} onValueChange={switchCamera}>
                          <SelectTrigger className="w-72">
                            <SelectValue placeholder={language === 'hi' ? 'कैमरा चुनें' : 'Select Camera'} />
                          </SelectTrigger>
                          <SelectContent className="z-[9999]">
                            {availableCameras.map((camera, index) => (
                              <SelectItem key={camera.deviceId} value={camera.deviceId}>
                                {camera.label || (language === 'hi' ? `कैमरा ${index + 1}` : `Camera ${index + 1}`)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                    
                    {/* Show message when only one camera is available */}
                    {showCamera && availableCameras.length === 1 && (
                      <p className="text-xs text-center text-muted-foreground mt-2">
                        {language === 'hi' 
                          ? `कैमरा: ${availableCameras[0]?.label || 'डिफ़ॉल्ट कैमरा'}` 
                          : `Camera: ${availableCameras[0]?.label || 'Default Camera'}`}
                      </p>
                    )}
                    
                    <canvas ref={canvasRef} className="hidden" />
                  </div>
                  
                  <Alert className="bg-blue-50 border-blue-200 dark:bg-blue-950/20 dark:border-blue-800">
                    <Info size={16} />
                    <AlertDescription className="text-xs">
                      {language === 'hi' 
                        ? 'चेहरा फ्रेम का कम से कम 50% होना चाहिए। सेल्फी का उपयोग AI द्वारा पहचान सत्यापन के लिए किया जाएगा।' 
                        : 'Face must cover at least 50% of the frame. Selfie will be used for AI identity verification.'}
                    </AlertDescription>
                  </Alert>
                  
                  {/* Face coverage indicator */}
                  {faceCoveragePercent > 0 && (
                    <div className={`flex items-center gap-2 text-sm ${faceCoverageValid ? 'text-green-600' : 'text-amber-600'}`}>
                      {faceCoverageValid ? (
                        <CheckCircle size={16} weight="fill" />
                      ) : (
                        <Warning size={16} weight="fill" />
                      )}
                      {language === 'hi' 
                        ? `चेहरा कवरेज: ${faceCoveragePercent}% ${faceCoverageValid ? '✓' : '(50% आवश्यक)'}` 
                        : `Face coverage: ${faceCoveragePercent}% ${faceCoverageValid ? '✓' : '(50% required)'}`}
                    </div>
                  )}
                </div>

                {/* Photo Lightbox for viewing uploaded photos */}
                {photos.length > 0 && (
                  <div className="mt-2">
                    <p className="text-xs text-muted-foreground mb-2">
                      {language === 'hi' ? 'पूर्ण आकार में देखने के लिए फोटो पर क्लिक करें' : 'Click on a photo to view full size'}
                    </p>
                  </div>
                )}

                {/* Government ID Proof Upload Section - Mandatory */}
                <Separator className="my-6" />
                
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <IdentificationCard size={24} weight="bold" className="text-blue-600" />
                    <Label className="text-lg font-semibold">
                      {language === 'hi' ? 'सरकारी पहचान प्रमाण अपलोड करें' : 'Upload Government ID Proof'} *
                      {isEditMode && !isAdminMode && (
                        <span className="ml-2 text-xs text-gray-500 font-normal">
                          🔒 {language === 'hi' ? 'स्थायी' : 'Permanent'}
                        </span>
                      )}
                    </Label>
                  </div>
                  
                  {/* In Edit Mode (not admin) - Show locked message */}
                  {isEditMode && !isAdminMode ? (
                    <Alert className="bg-gray-50 border-gray-400 dark:bg-gray-950/30">
                      <ShieldCheck size={20} weight="fill" className="text-gray-600" />
                      <AlertDescription className="text-gray-700 dark:text-gray-300">
                        {language === 'hi' 
                          ? 'पहचान प्रमाण संपादित नहीं किया जा सकता। यह पंजीकरण के समय सत्यापन के लिए जमा किया गया था।'
                          : 'ID Proof cannot be edited. It was submitted during registration for verification.'}
                      </AlertDescription>
                    </Alert>
                  ) : !isEditMode ? (
                    <Alert className="bg-orange-50 border-orange-300 dark:bg-orange-950/20 dark:border-orange-700">
                      <Warning size={18} className="text-orange-600" />
                      <AlertDescription className="text-orange-700 dark:text-orange-400">
                        {language === 'hi' 
                          ? 'नाम और जन्म तिथि सत्यापन के लिए सरकारी पहचान पत्र अनिवार्य है। यह केवल सत्यापन के लिए है और अन्य उपयोगकर्ताओं को नहीं दिखाया जाएगा।'
                          : 'Government ID is mandatory for name and DOB verification. This is for verification only and will NOT be shown to other users.'}
                      </AlertDescription>
                    </Alert>
                  ) : null}

                  {/* Only show ID proof upload controls in new registration mode OR admin mode */}
                  {(!isEditMode || isAdminMode) && (
                    <>
                      <div className="space-y-3">
                        <Label>{language === 'hi' ? 'दस्तावेज़ का प्रकार चुनें' : 'Select Document Type'} *</Label>
                        <Select 
                          value={idProofType} 
                          onValueChange={(value: 'aadhaar' | 'pan' | 'driving-license' | 'passport' | 'voter-id') => setIdProofType(value)}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder={language === 'hi' ? 'दस्तावेज़ प्रकार चुनें' : 'Select document type'} />
                          </SelectTrigger>
                          <SelectContent className="z-[9999]">
                            <SelectItem value="aadhaar">{language === 'hi' ? 'आधार कार्ड' : 'Aadhaar Card'}</SelectItem>
                            <SelectItem value="pan">{language === 'hi' ? 'पैन कार्ड' : 'PAN Card'}</SelectItem>
                            <SelectItem value="driving-license">{language === 'hi' ? 'ड्राइविंग लाइसेंस' : 'Driving License'}</SelectItem>
                            <SelectItem value="passport">{language === 'hi' ? 'पासपोर्ट' : 'Passport'}</SelectItem>
                            <SelectItem value="voter-id">{language === 'hi' ? 'मतदाता पहचान पत्र' : 'Voter ID'}</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
                        {idProofPreview ? (
                          <div className="space-y-3">
                            <div className="relative inline-block">
                              <img 
                                src={idProofPreview} 
                                alt="ID Proof" 
                                className="max-h-48 object-contain rounded-lg mx-auto border"
                              />
                              <Button
                                type="button"
                                variant="destructive"
                                size="icon"
                                className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
                                onClick={() => {
                                  setIdProofFile(null)
                                  setIdProofPreview(null)
                                }}
                              >
                                <X size={14} />
                              </Button>
                            </div>
                            <div className="flex items-center justify-center gap-2 text-green-600">
                              <CheckCircle size={20} weight="fill" />
                              <span className="text-sm font-medium">
                                {language === 'hi' ? 'पहचान प्रमाण अपलोड किया गया' : 'ID Proof uploaded'}
                              </span>
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-4">
                            {/* Two options: Camera capture or File upload */}
                            <div className="grid grid-cols-2 gap-3">
                              {/* Camera Capture Option */}
                              <Button
                                type="button"
                                variant="outline"
                                className="h-auto py-4 flex flex-col items-center gap-2 border-2 border-dashed hover:border-primary hover:bg-primary/5"
                                onClick={() => setShowIdProofCamera(true)}
                              >
                                <Camera size={32} weight="light" className="text-primary" />
                                <span className="text-sm font-medium">
                                  {language === 'hi' ? 'कैमरा से कैप्चर करें' : 'Capture from Camera'}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  {language === 'hi' ? 'मोबाइल के लिए अनुशंसित' : 'Recommended for mobile'}
                                </span>
                              </Button>
                              
                              {/* File Upload Option */}
                              <label className="cursor-pointer">
                                <input
                                  type="file"
                                  accept="image/*"
                                  className="hidden"
                                  onChange={(e) => {
                                    const file = e.target.files?.[0]
                                    if (file) {
                                      setIdProofFile(file)
                                      const reader = new FileReader()
                                      reader.onload = (event) => {
                                        setIdProofPreview(event.target?.result as string)
                                      }
                                      reader.readAsDataURL(file)
                                    }
                                  }}
                                />
                                <div className="h-full py-4 flex flex-col items-center justify-center gap-2 border-2 border-dashed rounded-lg hover:border-primary hover:bg-primary/5 transition-colors">
                                  <Upload size={32} weight="light" className="text-muted-foreground" />
                                  <span className="text-sm font-medium">
                                    {language === 'hi' ? 'गैलरी से अपलोड करें' : 'Upload from Gallery'}
                                  </span>
                                  <span className="text-xs text-muted-foreground">
                                    {language === 'hi' ? 'फ़ाइल चुनें' : 'Select file'}
                                  </span>
                                </div>
                              </label>
                            </div>
                            <p className="text-xs text-center text-muted-foreground">
                              {language === 'hi' ? 'नाम और जन्म तिथि स्पष्ट दिखनी चाहिए' : 'Name and DOB must be clearly visible'}
                            </p>
                          </div>
                        )}
                      </div>

                      <Alert className="bg-blue-50 border-blue-200 dark:bg-blue-950/20 dark:border-blue-800">
                        <Info size={16} />
                        <AlertDescription className="text-xs">
                          {language === 'hi' 
                            ? '• पहचान पत्र में आपका नाम और जन्म तिथि स्पष्ट दिखनी चाहिए\n• यह जानकारी केवल एडमिन सत्यापन के लिए है\n• गलत दस्तावेज़ देने पर प्रोफाइल अस्वीकार हो सकती है'
                            : '• Name and DOB must be clearly visible on the ID\n• This information is for admin verification only\n• Profile may be rejected for incorrect documents'}
                        </AlertDescription>
                      </Alert>
                    </>
                  )}

                  {/* In edit mode (for regular users), show existing ID proof info (read-only) */}
                  {isEditMode && !isAdminMode && editProfile?.idProofType && (
                    <div className="border-2 border-gray-300 bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4">
                      <div className="space-y-3">
                        <div className="flex items-center gap-3">
                          <ShieldCheck size={24} weight="fill" className="text-green-600" />
                          <div>
                            <p className="font-medium text-gray-700 dark:text-gray-300">
                              {language === 'hi' ? 'पहचान प्रमाण:' : 'ID Proof:'} {{
                                'aadhaar': language === 'hi' ? 'आधार कार्ड' : 'Aadhaar Card',
                                'pan': language === 'hi' ? 'पैन कार्ड' : 'PAN Card',
                                'driving-license': language === 'hi' ? 'ड्राइविंग लाइसेंस' : 'Driving License',
                                'passport': language === 'hi' ? 'पासपोर्ट' : 'Passport',
                                'voter-id': language === 'hi' ? 'मतदाता पहचान पत्र' : 'Voter ID'
                              }[editProfile.idProofType] || editProfile.idProofType}
                            </p>
                            <p className="text-sm text-gray-500">
                              {editProfile.idProofVerified 
                                ? (language === 'hi' ? '✅ सत्यापित' : '✅ Verified')
                                : (language === 'hi' ? '⏳ सत्यापन लंबित' : '⏳ Verification pending')}
                            </p>
                          </div>
                        </div>
                        {/* Show ID proof image preview (read-only) */}
                        {editProfile.idProofUrl && (
                          <div className="border rounded-lg overflow-hidden bg-white dark:bg-gray-800">
                            <img 
                              src={editProfile.idProofUrl} 
                              alt="ID Proof" 
                              className="max-h-48 w-full object-contain"
                            />
                            <p className="text-xs text-center text-muted-foreground py-2 bg-gray-100 dark:bg-gray-700">
                              {language === 'hi' ? 'आपका अपलोड किया गया पहचान प्रमाण (केवल देखने के लिए)' : 'Your uploaded ID proof (view only)'}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {step === 5 && (
              <div className="space-y-6">
                {/* Admin re-verification notice for edit mode */}
                {isEditMode && !isAdminMode && (
                  <Alert className="bg-amber-50 border-amber-400 dark:bg-amber-950/30 dark:border-amber-600">
                    <Warning size={18} className="text-amber-600" />
                    <AlertDescription className="text-amber-700 dark:text-amber-400 text-sm">
                      {language === 'hi' 
                        ? '⚠️ "अपने बारे में" या "परिवार विवरण" बदलने पर एडमिन द्वारा पुनः सत्यापन आवश्यक होगा।'
                        : '⚠️ Changing "About Yourself" or "Family Details" will require admin re-verification.'}
                    </AlertDescription>
                  </Alert>
                )}
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <Label htmlFor="bio" className="flex items-center gap-2 flex-wrap">
                      {language === 'hi' ? 'अपने बारे में' : 'About Yourself'} *
                      <AdminVerificationBadge field="bio" />
                    </Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleGenerateBio}
                      disabled={isGeneratingBio}
                      className="gap-2 text-primary border-primary/50 hover:bg-primary/10"
                    >
                      {isGeneratingBio ? (
                        <SpinnerGap size={16} className="animate-spin" />
                      ) : (
                        <Sparkle size={16} weight="fill" />
                      )}
                      {language === 'hi' ? 'AI से बनाएं' : 'Generate with AI'}
                    </Button>
                  </div>
                  <Textarea
                    id="bio"
                    placeholder={language === 'hi' 
                      ? 'अपने बारे में, अपनी रुचियों, व्यक्तित्व और जीवन के लक्ष्यों के बारे में लिखें...' 
                      : 'Write about yourself, your interests, personality and life goals...'}
                    value={formData.bio}
                    onChange={(e) => updateField('bio', e.target.value)}
                    rows={6}
                    className={!(formData.bio || '').trim() ? 'border-amber-500' : ''}
                  />
                  {!(formData.bio || '').trim() && (
                    <p className="text-xs text-amber-600 flex items-center gap-1">
                      <Warning size={14} />
                      {language === 'hi' ? 'यह फ़ील्ड अनिवार्य है' : 'This field is required'}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    {language === 'hi' 
                      ? 'AI बटन दबाएं और हम आपकी जानकारी के आधार पर एक आकर्षक परिचय बनाएंगे। आप इसे संपादित कर सकते हैं।' 
                      : 'Click the AI button and we\'ll create an attractive bio based on your details. You can edit it afterward.'}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="familyDetails" className="flex items-center gap-2 flex-wrap">
                    {t.registration.familyDetailsLabel}
                    <AdminVerificationBadge field="familyDetails" />
                  </Label>
                  <Textarea
                    id="familyDetails"
                    placeholder={t.registration.familyPlaceholder}
                    value={formData.familyDetails}
                    onChange={(e) => updateField('familyDetails', e.target.value)}
                    rows={4}
                  />
                </div>
              </div>
            )}

            {/* Step 6 - Partner Preferences */}
            {step === 6 && (
              <div className="space-y-6">
                <div className="text-center mb-4">
                  <h3 className="text-2xl font-bold mb-2">
                    {language === 'hi' ? 'साथी की अपेक्षाएं' : 'Partner Preferences'}
                  </h3>
                  <p className="text-muted-foreground">
                    {language === 'hi' 
                      ? 'अपने आदर्श साथी के बारे में बताएं - यह आपको बेहतर मैच खोजने में मदद करेगा' 
                      : 'Tell us about your ideal partner - this helps us find better matches for you'}
                  </p>
                </div>

                {/* Age Range - Partner age based on user gender: Female user = Male partner (min 21), Male user = Female partner (min 18) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>{language === 'hi' ? 'न्यूनतम आयु' : 'Minimum Age'}</Label>
                    <Select 
                      value={formData.partnerAgeMin?.toString() || ''} 
                      onValueChange={(v) => {
                        const minAge = v ? parseInt(v) : undefined
                        updateField('partnerAgeMin', minAge)
                        // If max age is less than new min age, reset it
                        if (minAge && formData.partnerAgeMax && formData.partnerAgeMax < minAge) {
                          updateField('partnerAgeMax', undefined)
                        }
                      }}
                    >
                      <SelectTrigger><SelectValue placeholder={language === 'hi' ? 'चुनें' : 'Select'} /></SelectTrigger>
                      <SelectContent className="z-[9999] max-h-60" position="popper">
                        {/* If user is female, partner (male) min age is 21. If user is male, partner (female) min age is 18 */}
                        {Array.from({ length: formData.gender === 'female' ? 40 : 43 }, (_, i) => (formData.gender === 'female' ? 21 : 18) + i).map(age => (
                          <SelectItem key={age} value={age.toString()}>{age} {language === 'hi' ? 'वर्ष' : 'years'}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      {formData.gender === 'female' 
                        ? (language === 'hi' ? '(पुरुष साथी के लिए न्यूनतम 21 वर्ष)' : '(Minimum 21 years for male partner)')
                        : (language === 'hi' ? '(महिला साथी के लिए न्यूनतम 18 वर्ष)' : '(Minimum 18 years for female partner)')}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label>{language === 'hi' ? 'अधिकतम आयु' : 'Maximum Age'}</Label>
                    <Select 
                      value={formData.partnerAgeMax?.toString() || ''} 
                      onValueChange={(v) => updateField('partnerAgeMax', v ? parseInt(v) : undefined)}
                    >
                      <SelectTrigger><SelectValue placeholder={language === 'hi' ? 'चुनें' : 'Select'} /></SelectTrigger>
                      <SelectContent className="z-[9999] max-h-60" position="popper">
                        {/* Max age must be >= min age. Start from partner min age based on gender */}
                        {Array.from({ length: formData.gender === 'female' ? 40 : 43 }, (_, i) => (formData.gender === 'female' ? 21 : 18) + i)
                          .filter(age => !formData.partnerAgeMin || age >= formData.partnerAgeMin)
                          .map(age => (
                            <SelectItem key={age} value={age.toString()}>{age} {language === 'hi' ? 'वर्ष' : 'years'}</SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Height Range */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>{language === 'hi' ? 'न्यूनतम ऊंचाई' : 'Minimum Height'}</Label>
                    <Select 
                      value={formData.partnerHeightMin || ''} 
                      onValueChange={(v) => {
                        updateField('partnerHeightMin', v)
                        // If max height is less than new min height, reset it
                        if (v && formData.partnerHeightMax && getHeightOrder(formData.partnerHeightMax) < getHeightOrder(v)) {
                          updateField('partnerHeightMax', '')
                        }
                      }}
                    >
                      <SelectTrigger><SelectValue placeholder={language === 'hi' ? 'चुनें' : 'Select'} /></SelectTrigger>
                      <SelectContent className="z-[9999] max-h-60" position="popper">
                        {HEIGHT_OPTIONS.map(h => (
                          <SelectItem key={h.value} value={h.value}>{h.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>{language === 'hi' ? 'अधिकतम ऊंचाई' : 'Maximum Height'}</Label>
                    <Select value={formData.partnerHeightMax || ''} onValueChange={(v) => updateField('partnerHeightMax', v)}>
                      <SelectTrigger><SelectValue placeholder={language === 'hi' ? 'चुनें' : 'Select'} /></SelectTrigger>
                      <SelectContent className="z-[9999] max-h-60" position="popper">
                        {HEIGHT_OPTIONS
                          .filter(h => !formData.partnerHeightMin || h.order >= getHeightOrder(formData.partnerHeightMin))
                          .map(h => (
                            <SelectItem key={h.value} value={h.value}>{h.label}</SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Marital Status & Religion - Multi-select */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>{language === 'hi' ? 'वैवाहिक स्थिति' : 'Marital Status'}</Label>
                    <MultiSelect
                      options={MARITAL_STATUS_OPTIONS}
                      value={formData.partnerMaritalStatus || []}
                      onValueChange={(v) => updateField('partnerMaritalStatus', v as MaritalStatus[])}
                      placeholder={language === 'hi' ? 'चुनें' : 'Select'}
                      searchPlaceholder={language === 'hi' ? 'खोजें...' : 'Search...'}
                      showSelectAll
                      selectAllLabel={language === 'hi' ? 'सभी चुनें' : 'Select All'}
                      clearAllLabel={language === 'hi' ? 'सभी हटाएं' : 'Clear All'}
                      showAnyOption
                      anyOptionLabel={language === 'hi' ? 'कोई भी / कोई प्राथमिकता नहीं' : 'Any / No Preference'}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{language === 'hi' ? 'धर्म' : 'Religion'}</Label>
                    <MultiSelect
                      options={RELIGION_OPTIONS}
                      value={formData.partnerReligion || []}
                      onValueChange={(v) => updateField('partnerReligion', v)}
                      placeholder={language === 'hi' ? 'चुनें' : 'Select'}
                      searchPlaceholder={language === 'hi' ? 'खोजें...' : 'Search...'}
                      showSelectAll
                      selectAllLabel={language === 'hi' ? 'सभी चुनें' : 'Select All'}
                      clearAllLabel={language === 'hi' ? 'सभी हटाएं' : 'Clear All'}
                      showAnyOption
                      anyOptionLabel={language === 'hi' ? 'कोई भी / कोई प्राथमिकता नहीं' : 'Any / No Preference'}
                    />
                  </div>
                </div>

                {/* Mother Tongue - Multi-select */}
                <div className="space-y-2">
                  <Label>{language === 'hi' ? 'मातृभाषा' : 'Mother Tongue'}</Label>
                  <MultiSelect
                    options={MOTHER_TONGUE_OPTIONS}
                    value={formData.partnerMotherTongue || []}
                    onValueChange={(v) => updateField('partnerMotherTongue', v)}
                    placeholder={language === 'hi' ? 'चुनें' : 'Select'}
                    searchPlaceholder={language === 'hi' ? 'खोजें...' : 'Search...'}
                    showSelectAll
                    selectAllLabel={language === 'hi' ? 'सभी चुनें' : 'Select All'}
                    clearAllLabel={language === 'hi' ? 'सभी हटाएं' : 'Clear All'}
                    showAnyOption
                    anyOptionLabel={language === 'hi' ? 'कोई भी / कोई प्राथमिकता नहीं' : 'Any / No Preference'}
                  />
                </div>

                {/* Education & Employment Status */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>{language === 'hi' ? 'शिक्षा' : 'Education'}</Label>
                    <MultiSelect
                      options={EDUCATION_OPTIONS}
                      value={formData.partnerEducation || []}
                      onValueChange={(v) => updateField('partnerEducation', v)}
                      placeholder={language === 'hi' ? 'चुनें' : 'Select'}
                      searchPlaceholder={language === 'hi' ? 'खोजें...' : 'Search...'}
                      showSelectAll
                      selectAllLabel={language === 'hi' ? 'सभी चुनें' : 'Select All'}
                      clearAllLabel={language === 'hi' ? 'सभी हटाएं' : 'Clear All'}
                      showAnyOption
                      anyOptionLabel={language === 'hi' ? 'कोई भी / कोई प्राथमिकता नहीं' : 'Any / No Preference'}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{language === 'hi' ? 'रोजगार स्थिति' : 'Employment Status'}</Label>
                    <MultiSelect
                      options={EMPLOYMENT_STATUS_OPTIONS}
                      value={formData.partnerEmploymentStatus || []}
                      onValueChange={(v) => updateField('partnerEmploymentStatus', v)}
                      placeholder={language === 'hi' ? 'चुनें' : 'Select'}
                      searchPlaceholder={language === 'hi' ? 'खोजें...' : 'Search...'}
                      showSelectAll
                      selectAllLabel={language === 'hi' ? 'सभी चुनें' : 'Select All'}
                      clearAllLabel={language === 'hi' ? 'सभी हटाएं' : 'Clear All'}
                      showAnyOption
                      anyOptionLabel={language === 'hi' ? 'कोई भी / कोई प्राथमिकता नहीं' : 'Any / No Preference'}
                    />
                  </div>
                </div>

                {/* Occupation/Profession - Multi-select */}
                <div className="space-y-2">
                  <Label>{language === 'hi' ? 'व्यवसाय/पेशा' : 'Occupation/Profession'}</Label>
                  <MultiSelect
                    options={OCCUPATION_PROFESSION_OPTIONS}
                    value={formData.partnerOccupation || []}
                    onValueChange={(v) => updateField('partnerOccupation', v)}
                    placeholder={language === 'hi' ? 'चुनें' : 'Select'}
                    searchPlaceholder={language === 'hi' ? 'खोजें...' : 'Search...'}
                    showSelectAll
                    selectAllLabel={language === 'hi' ? 'सभी चुनें' : 'Select All'}
                    clearAllLabel={language === 'hi' ? 'सभी हटाएं' : 'Clear All'}
                    showAnyOption
                    anyOptionLabel={language === 'hi' ? 'कोई भी / कोई प्राथमिकता नहीं' : 'Any / No Preference'}
                  />
                </div>

                {/* Living Country & State - Multi-select */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>{language === 'hi' ? 'रहने वाला देश' : 'Living in Country'}</Label>
                    <MultiSelect
                      options={COUNTRY_OPTIONS}
                      value={formData.partnerLivingCountry || []}
                      onValueChange={(v) => {
                        updateField('partnerLivingCountry', v)
                        // Clear states that are no longer valid for selected countries (skip if 'any' is selected)
                        if (v.length === 1 && v[0] === 'any') {
                          updateField('partnerLivingState', ['any'])
                        } else {
                          const validStates = getStateOptionsForCountries(v).map(s => s.value)
                          const updatedStates = (formData.partnerLivingState || []).filter(s => validStates.includes(s))
                          updateField('partnerLivingState', updatedStates)
                        }
                      }}
                      placeholder={language === 'hi' ? 'चुनें' : 'Select'}
                      searchPlaceholder={language === 'hi' ? 'खोजें...' : 'Search...'}
                      showSelectAll
                      selectAllLabel={language === 'hi' ? 'सभी चुनें' : 'Select All'}
                      clearAllLabel={language === 'hi' ? 'सभी हटाएं' : 'Clear All'}
                      showAnyOption
                      anyOptionLabel={language === 'hi' ? 'कोई भी / कोई प्राथमिकता नहीं' : 'Any / No Preference'}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{language === 'hi' ? 'रहने वाला राज्य' : 'Living in State'}</Label>
                    <MultiSelect
                      options={getStateOptionsForCountries(formData.partnerLivingCountry || [])}
                      value={formData.partnerLivingState || []}
                      onValueChange={(v) => {
                        updateField('partnerLivingState', v)
                        // Clear cities when states change (skip if 'any' is selected)
                        if (v.length === 1 && v[0] === 'any') {
                          updateField('partnerLocation', ['any'])
                        } else {
                          const validCities = getCityOptionsForStates(v).map(c => c.value)
                          const updatedCities = (formData.partnerLocation || []).filter(c => validCities.includes(c))
                          updateField('partnerLocation', updatedCities)
                        }
                      }}
                      placeholder={language === 'hi' ? 'चुनें' : 'Select'}
                      searchPlaceholder={language === 'hi' ? 'खोजें...' : 'Search...'}
                      disabled={!formData.partnerLivingCountry?.length || (formData.partnerLivingCountry?.length === 1 && formData.partnerLivingCountry[0] === 'any')}
                      showSelectAll
                      selectAllLabel={language === 'hi' ? 'सभी चुनें' : 'Select All'}
                      clearAllLabel={language === 'hi' ? 'सभी हटाएं' : 'Clear All'}
                      showAnyOption
                      anyOptionLabel={language === 'hi' ? 'कोई भी / कोई प्राथमिकता नहीं' : 'Any / No Preference'}
                    />
                  </div>
                </div>

                {/* City - Multi-select based on selected states */}
                <div className="space-y-2">
                  <Label>{language === 'hi' ? 'शहर' : 'City'}</Label>
                  <MultiSelect
                    options={getCityOptionsForStates(formData.partnerLivingState || [])}
                    value={formData.partnerLocation || []}
                    onValueChange={(v) => updateField('partnerLocation', v)}
                    placeholder={language === 'hi' ? 'चुनें' : 'Select'}
                    searchPlaceholder={language === 'hi' ? 'शहर खोजें...' : 'Search cities...'}
                    disabled={!formData.partnerLivingState?.length || (formData.partnerLivingState?.length === 1 && formData.partnerLivingState[0] === 'any')}
                    showSelectAll
                    selectAllLabel={language === 'hi' ? 'सभी चुनें' : 'Select All'}
                    clearAllLabel={language === 'hi' ? 'सभी हटाएं' : 'Clear All'}
                    showAnyOption
                    anyOptionLabel={language === 'hi' ? 'कोई भी / कोई प्राथमिकता नहीं' : 'Any / No Preference'}
                  />
                </div>

                {/* Annual Income Range */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>{language === 'hi' ? 'न्यूनतम वार्षिक आय' : 'Minimum Annual Income'}</Label>
                    <Select 
                      value={formData.partnerAnnualIncomeMin || ''} 
                      onValueChange={(v) => {
                        updateField('partnerAnnualIncomeMin', v)
                        // If max income is less than new min income, reset it
                        if (v && formData.partnerAnnualIncomeMax && getIncomeOrder(formData.partnerAnnualIncomeMax) < getIncomeOrder(v)) {
                          updateField('partnerAnnualIncomeMax', '')
                        }
                      }}
                    >
                      <SelectTrigger><SelectValue placeholder={language === 'hi' ? 'कोई भी' : 'Any'} /></SelectTrigger>
                      <SelectContent className="z-[9999] max-h-60" position="popper">
                        {INCOME_OPTIONS.map(i => (
                          <SelectItem key={i.value} value={i.value}>
                            {language === 'hi' ? i.labelHi : i.labelEn}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>{language === 'hi' ? 'अधिकतम वार्षिक आय' : 'Maximum Annual Income'}</Label>
                    <Select 
                      value={formData.partnerAnnualIncomeMax || ''} 
                      onValueChange={(v) => updateField('partnerAnnualIncomeMax', v)}
                    >
                      <SelectTrigger><SelectValue placeholder={language === 'hi' ? 'कोई भी' : 'Any'} /></SelectTrigger>
                      <SelectContent className="z-[9999] max-h-60" position="popper">
                        {INCOME_OPTIONS
                          .filter(i => !formData.partnerAnnualIncomeMin || i.order >= getIncomeOrder(formData.partnerAnnualIncomeMin))
                          .map(i => (
                            <SelectItem key={i.value} value={i.value}>
                              {language === 'hi' ? i.labelHi : i.labelEn}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Diet & Lifestyle - Multi-select for Diet */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>{language === 'hi' ? 'आहार पसंद' : 'Diet Preference'}</Label>
                    <MultiSelect
                      options={DIET_PREFERENCE_OPTIONS}
                      value={formData.partnerDiet || []}
                      onValueChange={(v) => updateField('partnerDiet', v as DietPreference[])}
                      placeholder={language === 'hi' ? 'चुनें' : 'Select'}
                      searchPlaceholder={language === 'hi' ? 'खोजें...' : 'Search...'}
                      showSelectAll
                      selectAllLabel={language === 'hi' ? 'सभी चुनें' : 'Select All'}
                      clearAllLabel={language === 'hi' ? 'सभी हटाएं' : 'Clear All'}
                      showAnyOption
                      anyOptionLabel={language === 'hi' ? 'कोई भी / कोई प्राथमिकता नहीं' : 'Any / No Preference'}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{language === 'hi' ? 'मांगलिक' : 'Manglik'}</Label>
                    <Select 
                      value={formData.partnerManglik || 'doesnt-matter'} 
                      onValueChange={(v) => updateField('partnerManglik', v as 'yes' | 'no' | 'doesnt-matter')}
                    >
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent className="z-[9999]" position="popper">
                        <SelectItem value="doesnt-matter">{language === 'hi' ? 'कोई फर्क नहीं' : "Doesn't Matter"}</SelectItem>
                        <SelectItem value="yes">{language === 'hi' ? 'हां' : 'Yes'}</SelectItem>
                        <SelectItem value="no">{language === 'hi' ? 'नहीं' : 'No'}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Drinking & Smoking Preferences */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>{language === 'hi' ? 'पीने की आदत' : 'Drinking Habit'}</Label>
                    <MultiSelect
                      options={DRINKING_HABIT_OPTIONS}
                      value={formData.partnerDrinking || []}
                      onValueChange={(v) => updateField('partnerDrinking', v as DrinkingHabit[])}
                      placeholder={language === 'hi' ? 'चुनें' : 'Select'}
                      searchPlaceholder={language === 'hi' ? 'खोजें...' : 'Search...'}
                      showSelectAll
                      selectAllLabel={language === 'hi' ? 'सभी चुनें' : 'Select All'}
                      clearAllLabel={language === 'hi' ? 'सभी हटाएं' : 'Clear All'}
                      showAnyOption
                      anyOptionLabel={language === 'hi' ? 'कोई भी / कोई प्राथमिकता नहीं' : 'Any / No Preference'}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{language === 'hi' ? 'धूम्रपान की आदत' : 'Smoking Habit'}</Label>
                    <MultiSelect
                      options={SMOKING_HABIT_OPTIONS}
                      value={formData.partnerSmoking || []}
                      onValueChange={(v) => updateField('partnerSmoking', v as SmokingHabit[])}
                      placeholder={language === 'hi' ? 'चुनें' : 'Select'}
                      searchPlaceholder={language === 'hi' ? 'खोजें...' : 'Search...'}
                      showSelectAll
                      selectAllLabel={language === 'hi' ? 'सभी चुनें' : 'Select All'}
                      clearAllLabel={language === 'hi' ? 'सभी हटाएं' : 'Clear All'}
                      showAnyOption
                      anyOptionLabel={language === 'hi' ? 'कोई भी / कोई प्राथमिकता नहीं' : 'Any / No Preference'}
                    />
                  </div>
                </div>

                {/* Differently Abled */}
                <div className="space-y-2">
                  <Label>{language === 'hi' ? 'दिव्यांग' : 'Differently Abled'}</Label>
                  <Select 
                    value={formData.partnerDisability?.includes('yes') ? 'accept' : formData.partnerDisability?.includes('no') ? 'no-only' : ''} 
                    onValueChange={(v) => {
                      if (v === 'no-only') updateField('partnerDisability', ['no'] as DisabilityStatus[])
                      else if (v === 'accept') updateField('partnerDisability', ['no', 'yes'] as DisabilityStatus[])
                      else updateField('partnerDisability', [])
                    }}
                  >
                    <SelectTrigger><SelectValue placeholder={language === 'hi' ? 'चुनें' : 'Select'} /></SelectTrigger>
                    <SelectContent className="z-[9999]" position="popper">
                      <SelectItem value="no-only">{language === 'hi' ? 'नहीं' : 'No'}</SelectItem>
                      <SelectItem value="accept">{language === 'hi' ? 'हाँ' : 'Yes'}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Alert>
                  <Info size={18} />
                  <AlertDescription>
                    {language === 'hi' 
                      ? 'आप बाद में अपनी प्रोफाइल से इन प्राथमिकताओं को अपडेट कर सकते हैं। ये प्राथमिकताएं आपको बेहतर मैच खोजने में मदद करेंगी।'
                      : 'You can update these preferences later from your profile. These preferences will help you find better matches.'}
                  </AlertDescription>
                </Alert>
              </div>
            )}

            {/* Step 7 - Membership Plan */}
            {step === 7 && (
              <div className="space-y-6">
                {/* Edit Mode - Changes Summary */}
                {isEditMode && !isPaymentOnlyMode && (() => {
                  const changes = getChangedFieldsSummary()
                  const hasChanges = changes.critical.length > 0 || changes.nonCritical.length > 0
                  const hasCriticalChanges = changes.critical.length > 0
                  
                  if (!hasChanges) return null
                  
                  return (
                    <Card className={`border-2 ${hasCriticalChanges ? 'border-amber-500 bg-amber-50/50 dark:bg-amber-950/20' : 'border-green-500 bg-green-50/50 dark:bg-green-950/20'}`}>
                      <CardContent className="pt-4 pb-4">
                        <div className="flex items-start gap-3">
                          {hasCriticalChanges ? (
                            <Warning size={24} weight="fill" className="text-amber-600 shrink-0 mt-0.5" />
                          ) : (
                            <CheckCircle size={24} weight="fill" className="text-green-600 shrink-0 mt-0.5" />
                          )}
                          <div className="flex-1 space-y-3">
                            <div>
                              <h4 className={`font-bold ${hasCriticalChanges ? 'text-amber-700 dark:text-amber-400' : 'text-green-700 dark:text-green-400'}`}>
                                {hasCriticalChanges 
                                  ? (language === 'hi' ? '⚠️ प्रोफ़ाइल एडमिन स्वीकृति के लिए भेजी जाएगी' : '⚠️ Profile will be sent for admin approval')
                                  : (language === 'hi' ? '✓ एडमिन स्वीकृति की आवश्यकता नहीं' : '✓ No admin approval needed')}
                              </h4>
                              <p className="text-sm text-muted-foreground">
                                {hasCriticalChanges 
                                  ? (language === 'hi' ? 'आपने महत्वपूर्ण फ़ील्ड बदले हैं जिन्हें सत्यापन की आवश्यकता है।' : 'You have changed critical fields that require verification.')
                                  : (language === 'hi' ? 'आपके परिवर्तन तुरंत लागू होंगे।' : 'Your changes will be applied immediately.')}
                              </p>
                            </div>
                            
                            {/* Critical Changes */}
                            {changes.critical.length > 0 && (
                              <div className="space-y-1">
                                <p className="text-xs font-semibold text-amber-700 dark:text-amber-400 flex items-center gap-1">
                                  <ShieldCheck size={14} />
                                  {language === 'hi' ? 'महत्वपूर्ण परिवर्तन (सत्यापन आवश्यक):' : 'Critical Changes (Verification Required):'}
                                </p>
                                <div className="flex flex-wrap gap-1.5">
                                  {changes.critical.map(field => (
                                    <span key={field} className="bg-amber-200/80 dark:bg-amber-800/50 text-amber-800 dark:text-amber-200 px-2 py-0.5 rounded text-xs font-medium">
                                      {getFieldLabel(field)}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                            
                            {/* Non-Critical Changes */}
                            {changes.nonCritical.length > 0 && (
                              <div className="space-y-1">
                                <p className="text-xs font-semibold text-green-700 dark:text-green-400 flex items-center gap-1">
                                  <CheckCircle size={14} />
                                  {language === 'hi' ? 'सामान्य परिवर्तन (स्वतः-स्वीकृत):' : 'Regular Changes (Auto-Approved):'}
                                </p>
                                <div className="flex flex-wrap gap-1.5">
                                  {changes.nonCritical.map(field => (
                                    <span key={field} className="bg-green-200/80 dark:bg-green-800/50 text-green-800 dark:text-green-200 px-2 py-0.5 rounded text-xs font-medium">
                                      {getFieldLabel(field)}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })()}

                <div className="text-center mb-6">
                  <h3 className="text-2xl font-bold mb-2">{t.registration.choosePlan}</h3>
                  <p className="text-muted-foreground">{t.registration.affordablePricing}</p>
                </div>

                <RadioGroup value={formData.membershipPlan || ''} onValueChange={(value: MembershipPlan) => updateField('membershipPlan', value)}>
                  <div className="space-y-4">
                    {/* Free Plan - Introductory Offer */}
                    <label htmlFor="free" className="cursor-pointer">
                      <Card className={`border-2 transition-all ${formData.membershipPlan === 'free' ? 'border-green-500 shadow-lg' : 'hover:border-green-500/50'}`}>
                        <CardContent className="pt-6 relative">
                          <div className="absolute top-0 right-4 -translate-y-1/2">
                            <span className="bg-green-500 text-white px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                              <Gift size={12} weight="bold" />
                              {language === 'hi' ? 'परिचयात्मक ऑफर' : 'Introductory Offer'}
                            </span>
                          </div>
                          <div className="flex items-start justify-between">
                            <div className="flex items-start gap-4 flex-1">
                              <RadioGroupItem value="free" id="free" />
                              <div className="flex-1">
                                <h4 className="font-bold text-xl mb-2 text-green-600">
                                  {language === 'hi' ? 'मुफ्त योजना (6 महीने)' : 'Free Plan (6 Months)'}
                                </h4>
                                <div className="flex items-baseline gap-2 mb-3">
                                  <span className="text-3xl font-bold text-green-600">₹0</span>
                                  <span className="text-muted-foreground">{language === 'hi' ? '6 महीने के लिए मुफ्त' : 'Free for 6 months'}</span>
                                </div>
                                <ul className="space-y-2 text-sm text-muted-foreground">
                                  <li className="flex items-center gap-2">
                                    <CheckCircle size={16} weight="fill" className="text-green-500" />
                                    {language === 'hi' ? 'प्रोफाइल बनाएं और देखें' : 'Create and view profiles'}
                                  </li>
                                  <li className="flex items-center gap-2">
                                    <CheckCircle size={16} weight="fill" className="text-green-500" />
                                    {language === 'hi' ? 'रुचि व्यक्त करें' : 'Express interest'}
                                  </li>
                                  <li className="flex items-center gap-2">
                                    <CheckCircle size={16} weight="fill" className="text-green-500" />
                                    {language === 'hi' 
                                      ? `चैट सीमा: ${membershipSettings?.freePlanChatLimit || 5} प्रोफाइल` 
                                      : `Chat limit: ${membershipSettings?.freePlanChatLimit || 5} profiles`}
                                  </li>
                                  <li className="flex items-center gap-2 text-amber-600">
                                    <X size={16} weight="bold" />
                                    {language === 'hi' ? 'संपर्क देखने की सुविधा नहीं' : 'No contact view access'}
                                  </li>
                                  <li className="flex items-center gap-2">
                                    <CheckCircle size={16} weight="fill" className="text-green-500" />
                                    {language === 'hi' ? 'बायोडेटा (वॉटरमार्क के साथ)' : 'Biodata (with watermark)'}
                                  </li>
                                  <li className="flex items-center gap-2 text-amber-600">
                                    <X size={16} weight="bold" />
                                    {language === 'hi' ? 'वेडिंग सर्विसेज एक्सेस नहीं' : 'No Wedding Services access'}
                                  </li>
                                  <li className="flex items-center gap-2 text-amber-600">
                                    <X size={16} weight="bold" />
                                    {language === 'hi' ? 'विवाह तैयारी मूल्यांकन नहीं' : 'No Marriage Readiness Assessment'}
                                  </li>
                                </ul>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </label>

                    <label htmlFor="6-month" className="cursor-pointer">
                      <Card className={`border-2 transition-all ${formData.membershipPlan === '6-month' ? 'border-primary shadow-lg' : 'hover:border-primary/50'}`}>
                        <CardContent className="pt-6">
                          <div className="flex items-start justify-between">
                            <div className="flex items-start gap-4 flex-1">
                              <RadioGroupItem value="6-month" id="6-month" />
                              <div className="flex-1">
                                <h4 className="font-bold text-xl mb-2">{t.registration.plan6Month}</h4>
                                <div className="flex items-baseline gap-2 mb-3">
                                  <CurrencyInr size={24} weight="bold" className="text-primary" />
                                  <span className="text-3xl font-bold text-primary">{membershipSettings?.sixMonthPrice || 500}</span>
                                  <span className="text-muted-foreground">{t.registration.perMonth}</span>
                                </div>
                                <ul className="space-y-2 text-sm text-muted-foreground">
                                  <li className="flex items-center gap-2">
                                    <CheckCircle size={16} weight="fill" className="text-teal" />
                                    {t.registration.unlimitedProfiles}
                                  </li>
                                  <li className="flex items-center gap-2">
                                    <CheckCircle size={16} weight="fill" className="text-teal" />
                                    {language === 'hi' 
                                      ? `चैट सीमा: ${membershipSettings?.sixMonthChatLimit || 50} प्रोफाइल` 
                                      : `Chat limit: ${membershipSettings?.sixMonthChatLimit || 50} profiles`}
                                  </li>
                                  <li className="flex items-center gap-2">
                                    <CheckCircle size={16} weight="fill" className="text-teal" />
                                    {language === 'hi' 
                                      ? `संपर्क देखें: ${membershipSettings?.sixMonthContactLimit || 20} प्रोफाइल` 
                                      : `Contact views: ${membershipSettings?.sixMonthContactLimit || 20} profiles`}
                                  </li>
                                  <li className="flex items-center gap-2">
                                    <CheckCircle size={16} weight="fill" className="text-teal" />
                                    {t.registration.expertSupport}
                                  </li>
                                  <li className="flex items-center gap-2">
                                    <CheckCircle size={16} weight="fill" className="text-teal" />
                                    {language === 'hi' ? 'बायोडेटा जनरेट और डाउनलोड' : 'Biodata generation & download'}
                                  </li>
                                  <li className="flex items-center gap-2">
                                    <CheckCircle size={16} weight="fill" className="text-teal" />
                                    {language === 'hi' ? 'वेडिंग सर्विसेज एक्सेस' : 'Wedding Services access'}
                                  </li>
                                  <li className="flex items-center gap-2">
                                    <CheckCircle size={16} weight="fill" className="text-amber-500" />
                                    {language === 'hi' ? '✨ विवाह तैयारी मूल्यांकन (AI-संचालित)' : '✨ Marriage Readiness Assessment (AI-powered)'}
                                  </li>
                                  {membershipSettings?.boostPackEnabled && (
                                    <li className="flex items-center gap-2 pt-2 border-t border-dashed mt-2">
                                      <Rocket size={16} weight="fill" className="text-purple-500" />
                                      <span className="text-purple-600 dark:text-purple-400 font-medium">
                                        {language === 'hi' 
                                          ? `🚀 बूस्ट पैक उपलब्ध: ₹${membershipSettings?.boostPackPrice || 100} में +${membershipSettings?.boostPackInterestLimit || 10} रुचि व +${membershipSettings?.boostPackContactLimit || 10} संपर्क`
                                          : `🚀 Boost Pack available: ₹${membershipSettings?.boostPackPrice || 100} for +${membershipSettings?.boostPackInterestLimit || 10} interests & +${membershipSettings?.boostPackContactLimit || 10} contacts`}
                                      </span>
                                    </li>
                                  )}
                                </ul>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </label>

                    <label htmlFor="1-year" className="cursor-pointer">
                      <Card className={`border-2 transition-all ${formData.membershipPlan === '1-year' ? 'border-accent shadow-lg' : 'hover:border-accent/50'}`}>
                        <CardContent className="pt-6 relative">
                          <div className="absolute top-0 right-4 -translate-y-1/2">
                            <span className="bg-accent text-accent-foreground px-3 py-1 rounded-full text-xs font-bold">{t.registration.mostPopular}</span>
                          </div>
                          <div className="flex items-start justify-between">
                            <div className="flex items-start gap-4 flex-1">
                              <RadioGroupItem value="1-year" id="1-year" />
                              <div className="flex-1">
                                <h4 className="font-bold text-xl mb-2">{t.registration.plan1Year}</h4>
                                <div className="flex items-baseline gap-2 mb-3">
                                  <CurrencyInr size={24} weight="bold" className="text-accent" />
                                  <span className="text-3xl font-bold text-accent">{membershipSettings?.oneYearPrice || 900}</span>
                                  <span className="text-muted-foreground">{t.registration.perYear}</span>
                                </div>
                                <ul className="space-y-2 text-sm text-muted-foreground">
                                  <li className="flex items-center gap-2">
                                    <CheckCircle size={16} weight="fill" className="text-teal" />
                                    {t.registration.unlimitedProfiles}
                                  </li>
                                  <li className="flex items-center gap-2">
                                    <CheckCircle size={16} weight="fill" className="text-teal" />
                                    {language === 'hi' 
                                      ? `चैट सीमा: ${membershipSettings?.oneYearChatLimit || 120} प्रोफाइल` 
                                      : `Chat limit: ${membershipSettings?.oneYearChatLimit || 120} profiles`}
                                  </li>
                                  <li className="flex items-center gap-2">
                                    <CheckCircle size={16} weight="fill" className="text-teal" />
                                    {language === 'hi' 
                                      ? `संपर्क देखें: ${membershipSettings?.oneYearContactLimit || 50} प्रोफाइल` 
                                      : `Contact views: ${membershipSettings?.oneYearContactLimit || 50} profiles`}
                                  </li>
                                  <li className="flex items-center gap-2">
                                    <CheckCircle size={16} weight="fill" className="text-teal" />
                                    {t.registration.prioritySupport}
                                  </li>
                                  <li className="flex items-center gap-2">
                                    <CheckCircle size={16} weight="fill" className="text-teal" />
                                    {t.registration.profileHighlight}
                                  </li>
                                  <li className="flex items-center gap-2">
                                    <CheckCircle size={16} weight="fill" className="text-teal" />
                                    {language === 'hi' ? 'बायोडेटा जनरेट और डाउनलोड' : 'Biodata generation & download'}
                                  </li>
                                  <li className="flex items-center gap-2">
                                    <CheckCircle size={16} weight="fill" className="text-teal" />
                                    {language === 'hi' ? 'वेडिंग सर्विसेज एक्सेस' : 'Wedding Services access'}
                                  </li>
                                  <li className="flex items-center gap-2">
                                    <CheckCircle size={16} weight="fill" className="text-amber-500" />
                                    {language === 'hi' ? '✨ विवाह तैयारी मूल्यांकन (AI-संचालित)' : '✨ Marriage Readiness Assessment (AI-powered)'}
                                  </li>
                                  {membershipSettings?.boostPackEnabled && (
                                    <li className="flex items-center gap-2 pt-2 border-t border-dashed mt-2">
                                      <Rocket size={16} weight="fill" className="text-purple-500" />
                                      <span className="text-purple-600 dark:text-purple-400 font-medium">
                                        {language === 'hi' 
                                          ? `🚀 बूस्ट पैक उपलब्ध: ₹${membershipSettings?.boostPackPrice || 100} में +${membershipSettings?.boostPackInterestLimit || 10} रुचि व +${membershipSettings?.boostPackContactLimit || 10} संपर्क`
                                          : `🚀 Boost Pack available: ₹${membershipSettings?.boostPackPrice || 100} for +${membershipSettings?.boostPackInterestLimit || 10} interests & +${membershipSettings?.boostPackContactLimit || 10} contacts`}
                                      </span>
                                    </li>
                                  )}
                                </ul>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </label>
                  </div>
                </RadioGroup>

                {/* Payment Flow Info for Paid Plans - shown during initial registration */}
                {!isPaymentOnlyMode && formData.membershipPlan && formData.membershipPlan !== 'free' && (
                  <Alert className="bg-blue-50 border-blue-300 dark:bg-blue-950/20 dark:border-blue-700">
                    <Info size={18} className="text-blue-600" />
                    <AlertDescription className="text-blue-800 dark:text-blue-200">
                      <p className="font-medium mb-1">
                        {language === 'hi' ? '💳 भुगतान प्रक्रिया' : '💳 Payment Process'}
                      </p>
                      <ol className="text-sm list-decimal list-inside space-y-1">
                        <li>{language === 'hi' ? 'प्रोफाइल सबमिट करने के बाद, एडमिन आपकी पहचान और फोटो सत्यापित करेंगे।' : 'After submitting profile, admin will verify your ID and photos.'}</li>
                        <li>{language === 'hi' ? 'सत्यापन के बाद, आपको भुगतान के लिए सूचना मिलेगी।' : 'After verification, you will be notified for payment.'}</li>
                        <li>{language === 'hi' ? 'UPI/बैंक ट्रांसफर से भुगतान करें और रसीद अपलोड करें।' : 'Pay via UPI/Bank transfer and upload receipt.'}</li>
                        <li>{language === 'hi' ? 'भुगतान सत्यापन के बाद आपकी प्रोफाइल सक्रिय हो जाएगी।' : 'Your profile will be activated after payment verification.'}</li>
                      </ol>
                    </AlertDescription>
                  </Alert>
                )}

                {/* Inactivity Notice */}
                <Alert className="bg-amber-50 border-amber-200 dark:bg-amber-950/30 dark:border-amber-700">
                  <Warning size={18} className="text-amber-600" />
                  <AlertDescription className="text-amber-800 dark:text-amber-200">
                    <p className="font-medium mb-1">
                      {language === 'hi' ? 'महत्वपूर्ण: निष्क्रियता नीति' : 'Important: Inactivity Policy'}
                    </p>
                    <p className="text-sm">
                      {language === 'hi' 
                        ? 'यदि आपकी प्रोफाइल 30 दिनों तक निष्क्रिय रहती है (कोई लॉगिन नहीं), तो यह स्वचालित रूप से निष्क्रिय हो जाएगी और अन्य उपयोगकर्ताओं को दिखाई नहीं देगी। अपनी प्रोफाइल सक्रिय रखने के लिए नियमित रूप से लॉगिन करें।'
                        : 'If your profile remains inactive for 30 days (no login), it will be automatically deactivated and will not be visible to other users. Login regularly to keep your profile active.'}
                    </p>
                  </AlertDescription>
                </Alert>

                {/* Verification Process Note */}
                {!isPaymentOnlyMode && (
                <Alert className="bg-blue-50 border-blue-200 dark:bg-blue-950/30 dark:border-blue-700">
                  <Info size={18} className="text-blue-600" />
                  <AlertDescription className="text-blue-800 dark:text-blue-200">
                    <p className="font-medium mb-1">
                      {language === 'hi' ? 'सत्यापन प्रक्रिया' : 'Verification Process'}
                    </p>
                    <p className="text-sm">
                      {t.registration.verificationNote}
                    </p>
                  </AlertDescription>
                </Alert>
                )}

                {/* Terms and Conditions - After Inactivity Policy and Verification Note */}
                {!isPaymentOnlyMode && (
                  <div className="border rounded-lg p-4 bg-muted/20">
                    <div className="flex items-start gap-3">
                      <Checkbox
                        id="terms-step7"
                        checked={termsAccepted}
                        onCheckedChange={(checked) => setTermsAccepted(checked === true)}
                        className="mt-1"
                      />
                      <div className="flex-1">
                        <label htmlFor="terms-step7" className="text-sm cursor-pointer">
                          {language === 'hi' 
                            ? 'मैंने ' 
                            : 'I have read and agree to the '}
                          <Button 
                            type="button" 
                            variant="link" 
                            className="p-0 h-auto text-primary underline font-semibold"
                            onClick={(e) => {
                              e.preventDefault()
                              setShowTerms(true)
                            }}
                          >
                            {language === 'hi' ? 'नियम और शर्तें' : 'Terms and Conditions'}
                          </Button>
                          {language === 'hi' 
                            ? ' पढ़ लिया है और मैं इनसे सहमत हूं।' 
                            : '.'}
                        </label>
                        <p className="text-xs text-muted-foreground mt-1">
                          {language === 'hi' 
                            ? 'पंजीकरण करके आप हमारी गोपनीयता नीति और सेवा शर्तों को स्वीकार करते हैं।' 
                            : 'By registering, you accept our Privacy Policy and Service Terms.'}
                        </p>
                      </div>
                    </div>
                    {!termsAccepted && formData.membershipPlan && (
                      <p className="text-xs text-amber-600 flex items-center gap-1 mt-2 pl-7">
                        <Warning size={14} />
                        {language === 'hi' ? 'कृपया आगे बढ़ने के लिए नियम और शर्तें स्वीकार करें' : 'Please accept Terms and Conditions to proceed'}
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Step 8 - Payment Details (Only shown when admin returns profile for payment) */}
            {step === 8 && (
              <div className="space-y-6">
                {/* Payment Deadline Alert */}
                {(() => {
                  const deadline = editProfile?.returnedForPaymentDeadline ? new Date(editProfile.returnedForPaymentDeadline) : null
                  const now = new Date()
                  const isExpired = deadline ? now > deadline : false
                  const daysLeft = deadline ? Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)) : null
                  
                  return (
                    <Alert className={isExpired ? 'bg-red-50 border-red-300 dark:bg-red-950/30 dark:border-red-800' : 'bg-green-50 border-green-300 dark:bg-green-950/30 dark:border-green-800'}>
                      <Info size={18} className={isExpired ? 'text-red-600' : 'text-green-600'} />
                      <AlertDescription className={isExpired ? 'text-red-800 dark:text-red-200' : 'text-green-800 dark:text-green-200'}>
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <span className="font-semibold">
                            {isExpired
                              ? (language === 'hi' ? '⚠️ भुगतान की समयसीमा समाप्त!' : '⚠️ Payment Deadline Expired!')
                              : (language === 'hi' ? '✅ सत्यापन पूर्ण' : '✅ Verification Complete')}
                          </span>
                          {!isExpired && daysLeft !== null && (
                            <span className="text-xs font-bold px-2 py-1 rounded bg-amber-100 text-amber-700">
                              {language === 'hi' ? `${daysLeft} दिन बाकी` : `${daysLeft} days left`}
                            </span>
                          )}
                        </div>
                        <p className="text-sm">
                          {isExpired
                            ? (language === 'hi'
                                ? 'भुगतान की समयसीमा समाप्त हो गई है। कृपया जल्द से जल्द भुगतान करें या व्यवस्थापक से संपर्क करें।'
                                : 'Payment deadline has expired. Please complete payment ASAP or contact admin.')
                            : (language === 'hi'
                                ? 'आपके चेहरे और पहचान प्रमाण की जांच हो गई है। कृपया नीचे दिए गए विवरण से भुगतान करें और स्क्रीनशॉट अपलोड करें।'
                                : 'Your face and ID proof have been verified. Please make payment using the details below and upload the screenshot.')}
                        </p>
                      </AlertDescription>
                    </Alert>
                  )
                })()}

                {/* Payment Details Card */}
                <Card className="border-2 border-primary/30 bg-primary/5">
                  <CardContent className="pt-6 space-y-4">
                    <div className="flex items-center gap-2 mb-2">
                      <CurrencyInr size={24} weight="bold" className="text-primary" />
                      <h4 className="font-bold text-lg">
                        {language === 'hi' ? 'भुगतान विवरण' : 'Payment Details'}
                      </h4>
                    </div>
                    
                    {/* Show verification status */}
                    <div className="flex flex-wrap gap-2 mb-3">
                      {editProfile?.photoVerified === true && (
                        <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full flex items-center gap-1">
                          <CheckCircle size={12} weight="fill" />
                          {language === 'hi' ? 'चेहरा सत्यापित' : 'Face Verified'}
                        </span>
                      )}
                      {editProfile?.idProofVerified && (
                        <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full flex items-center gap-1">
                          <CheckCircle size={12} weight="fill" />
                          {language === 'hi' ? 'पहचान प्रमाण सत्यापित' : 'ID Verified'}
                        </span>
                      )}
                    </div>
                    
                    {/* Amount Alert */}
                    <Alert className="bg-amber-50 border-amber-300 dark:bg-amber-950/30 dark:border-amber-800">
                      <Info size={18} className="text-amber-600" />
                      <AlertDescription className="text-amber-800 dark:text-amber-200">
                        <strong>
                          {language === 'hi' 
                            ? `कुल राशि: ₹${formData.membershipPlan === '6-month' ? (membershipSettings?.sixMonthPrice || 500) : (membershipSettings?.oneYearPrice || 900)}`
                            : `Total Amount: ₹${formData.membershipPlan === '6-month' ? (membershipSettings?.sixMonthPrice || 500) : (membershipSettings?.oneYearPrice || 900)}`}
                        </strong>
                        <span className="ml-2 text-sm">
                          ({formData.membershipPlan === '6-month' 
                            ? (language === 'hi' ? '6 महीने' : '6 months') 
                            : (language === 'hi' ? '1 वर्ष' : '1 year')})
                        </span>
                      </AlertDescription>
                    </Alert>

                    {/* Payment Methods */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* UPI Details */}
                      <div className="p-4 border rounded-lg bg-white dark:bg-background">
                        <h5 className="font-semibold mb-2 flex items-center gap-2">
                          📱 {language === 'hi' ? 'UPI से भुगतान करें' : 'Pay via UPI'}
                        </h5>
                        <div className="space-y-2 text-sm">
                          {membershipSettings?.upiId ? (
                            <>
                              <p 
                                className="font-mono bg-muted p-2 rounded text-center select-all cursor-pointer hover:bg-muted/80"
                                onClick={() => {
                                  navigator.clipboard.writeText(membershipSettings.upiId)
                                  toast.success(language === 'hi' ? 'UPI ID कॉपी हुई!' : 'UPI ID copied!')
                                }}
                              >
                                {membershipSettings.upiId}
                              </p>
                              <p className="text-muted-foreground text-xs text-center">
                                {language === 'hi' ? 'UPI ID कॉपी करने के लिए क्लिक करें' : 'Click to copy UPI ID'}
                              </p>
                            </>
                          ) : (
                            <p className="text-muted-foreground text-center py-2">
                              {language === 'hi' ? 'UPI विवरण जल्द उपलब्ध होगा' : 'UPI details coming soon'}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Bank Details */}
                      <div className="p-4 border rounded-lg bg-white dark:bg-background">
                        <h5 className="font-semibold mb-2 flex items-center gap-2">
                          🏦 {language === 'hi' ? 'बैंक ट्रांसफर' : 'Bank Transfer'}
                        </h5>
                        {membershipSettings?.bankName && membershipSettings?.accountNumber ? (
                          <div className="space-y-1 text-sm">
                            <p><span className="text-muted-foreground">{language === 'hi' ? 'बैंक:' : 'Bank:'}</span> {membershipSettings.bankName}</p>
                            <p><span className="text-muted-foreground">{language === 'hi' ? 'खाता नं:' : 'A/C:'}</span> {membershipSettings.accountNumber}</p>
                            {membershipSettings.ifscCode && (
                              <p><span className="text-muted-foreground">IFSC:</span> {membershipSettings.ifscCode}</p>
                            )}
                            {membershipSettings.accountHolderName && (
                              <p><span className="text-muted-foreground">{language === 'hi' ? 'नाम:' : 'Name:'}</span> {membershipSettings.accountHolderName}</p>
                            )}
                          </div>
                        ) : (
                          <p className="text-muted-foreground text-center py-2 text-sm">
                            {language === 'hi' ? 'बैंक विवरण जल्द उपलब्ध होगा' : 'Bank details coming soon'}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* QR Code */}
                    <div className="flex justify-center p-4">
                      <div className="text-center">
                        {membershipSettings?.qrCodeImage ? (
                          <img 
                            src={membershipSettings.qrCodeImage} 
                            alt="Payment QR Code" 
                            className="w-40 h-40 object-contain border rounded-lg mx-auto mb-2 cursor-pointer hover:opacity-80 transition-opacity"
                            onClick={() => openLightbox([membershipSettings.qrCodeImage], 0)}
                            title={language === 'hi' ? 'बड़ा करने के लिए क्लिक करें' : 'Click to enlarge'}
                          />
                        ) : (
                          <div className="w-32 h-32 bg-muted border-2 border-dashed rounded-lg flex items-center justify-center mx-auto mb-2">
                            <span className="text-4xl">📲</span>
                          </div>
                        )}
                        <p className="text-xs text-muted-foreground">
                          {membershipSettings?.qrCodeImage 
                            ? (language === 'hi' ? 'बड़ा करने के लिए क्लिक करें' : 'Click to enlarge')
                            : (language === 'hi' ? 'QR कोड स्कैन करें' : 'Scan QR Code')}
                        </p>
                      </div>
                    </div>

                    <Separator />

                    {/* Upload Payment Screenshot */}
                    <div className="space-y-3">
                      <Label className="text-base font-semibold flex items-center gap-2">
                        <Upload size={18} />
                        {language === 'hi' ? 'भुगतान स्क्रीनशॉट अपलोड करें *' : 'Upload Payment Screenshot(s) *'}
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        {language === 'hi' 
                          ? 'भुगतान करने के बाद, कृपया भुगतान स्क्रीनशॉट अपलोड करें। एडमिन द्वारा सत्यापन के बाद आपकी सदस्यता सक्रिय हो जाएगी।'
                          : 'After making payment, please upload the payment screenshot. Your membership will be activated after admin verification.'}
                      </p>
                      
                      {/* Show uploaded screenshots */}
                      {paymentScreenshotPreviews.length > 0 && (
                        <div className="flex flex-wrap gap-3">
                          {paymentScreenshotPreviews.map((preview, index) => (
                            <div key={index} className="relative inline-block">
                              {brokenPaymentImages.has(index) ? (
                                <div 
                                  className="w-[120px] h-[120px] rounded-lg border border-dashed border-amber-400 flex flex-col items-center justify-center bg-amber-50/50 text-xs text-amber-700 text-center p-2 cursor-pointer"
                                  onClick={() => {
                                    // Remove this broken image and allow re-upload
                                    setPaymentScreenshotPreviews(prev => prev.filter((_, i) => i !== index))
                                    setPaymentScreenshotFiles(prev => prev.filter((_, i) => i !== index))
                                    setBrokenPaymentImages(prev => {
                                      const newSet = new Set<number>()
                                      prev.forEach(i => {
                                        if (i < index) newSet.add(i)
                                        else if (i > index) newSet.add(i - 1)
                                      })
                                      return newSet
                                    })
                                    toast.info(language === 'hi' ? 'कृपया पुनः अपलोड करें' : 'Please re-upload this screenshot')
                                  }}
                                  title={language === 'hi' ? 'हटाने के लिए क्लिक करें' : 'Click to remove'}
                                >
                                  <span>Screenshot {index + 1}</span>
                                  <span className="text-amber-600 mt-1">(Click to remove)</span>
                                </div>
                              ) : (
                                <img 
                                  src={preview} 
                                  alt={`Payment Screenshot ${index + 1}`}
                                  className="w-[120px] h-[120px] object-cover rounded-lg border cursor-pointer"
                                  onClick={() => openLightbox(paymentScreenshotPreviews.filter((_, i) => !brokenPaymentImages.has(i)), index)}
                                  onError={() => {
                                    setBrokenPaymentImages(prev => new Set([...prev, index]))
                                  }}
                                />
                              )}
                              <Button
                                type="button"
                                variant="destructive"
                                size="icon"
                                className="absolute -top-2 -right-2 h-6 w-6"
                                onClick={() => {
                                  setPaymentScreenshotPreviews(prev => prev.filter((_, i) => i !== index))
                                  setPaymentScreenshotFiles(prev => prev.filter((_, i) => i !== index))
                                  // Recalculate broken image indices after removal
                                  setBrokenPaymentImages(prev => {
                                    const newSet = new Set<number>()
                                    prev.forEach(i => {
                                      if (i < index) newSet.add(i)
                                      else if (i > index) newSet.add(i - 1)
                                    })
                                    return newSet
                                  })
                                }}
                              >
                                <X size={12} />
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                      
                      {/* Upload Buttons */}
                      <div className="grid grid-cols-2 gap-3">
                        <Button
                          type="button"
                          variant="outline"
                          className="h-auto py-4 flex flex-col items-center gap-2"
                          onClick={() => setShowPaymentCamera(true)}
                        >
                          <Camera size={28} weight="light" className="text-primary" />
                          <span className="text-sm font-medium">
                            {language === 'hi' ? 'कैमरा से कैप्चर करें' : 'Capture from Camera'}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {language === 'hi' ? 'रसीद की फोटो लें' : 'Take photo of receipt'}
                          </span>
                        </Button>
                        
                        {/* File Upload Option */}
                        <label className="cursor-pointer">
                          <input
                            type="file"
                            accept="image/*"
                            multiple
                            className="hidden"
                            onChange={(e) => {
                              const files = e.target.files
                              if (files) {
                                Array.from(files).forEach((file) => {
                                  setPaymentScreenshotFiles(prev => [...prev, file])
                                  const reader = new FileReader()
                                  reader.onloadend = () => {
                                    setPaymentScreenshotPreviews(prev => [...prev, reader.result as string])
                                  }
                                  reader.readAsDataURL(file)
                                })
                              }
                              e.target.value = ''
                            }}
                          />
                          <div className="h-full py-4 flex flex-col items-center justify-center gap-2 border-2 border-dashed rounded-lg hover:border-primary hover:bg-primary/5 transition-colors">
                            <Upload size={28} weight="light" className="text-muted-foreground" />
                            <span className="text-sm font-medium">
                              {language === 'hi' ? 'गैलरी से अपलोड करें' : 'Upload from Gallery'}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {language === 'hi' ? 'स्क्रीनशॉट चुनें' : 'Select screenshot'}
                            </span>
                          </div>
                        </label>
                      </div>
                      
                      {paymentScreenshotPreviews.length > 0 && (
                        <p className="text-xs text-green-600 flex items-center gap-1">
                          <CheckCircle size={14} weight="fill" />
                          {language === 'hi' 
                            ? `${paymentScreenshotPreviews.length} स्क्रीनशॉट अपलोड हो गए` 
                            : `${paymentScreenshotPreviews.length} screenshot(s) uploaded`}
                        </p>
                      )}
                      
                      {paymentScreenshotPreviews.length === 0 && (
                        <p className="text-xs text-amber-600 flex items-center gap-1">
                          <Warning size={14} />
                          {language === 'hi' 
                            ? 'पंजीकरण पूरा करने के लिए कम से कम एक भुगतान स्क्रीनशॉट अपलोड करना आवश्यक है'
                            : 'At least one payment screenshot is required to complete registration'}
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </CardContent>
        </Card>
        )}
        </div>

        {/* Missing Fields Feedback */}
        {step <= 5 && !showVerification && !isPaymentPendingVerification && getMissingFields(step).length > 0 && (
          <div className="px-1 pb-2">
            <p className="text-xs text-amber-600 dark:text-amber-400 flex items-start gap-1">
              <Warning size={14} className="mt-0.5 flex-shrink-0" />
              <span>
                {language === 'hi' ? 'कृपया भरें: ' : 'Please fill: '}
                <span className="font-medium">{getMissingFields(step).join(', ')}</span>
              </span>
            </p>
          </div>
        )}

        {!isPaymentPendingVerification && (
        <div className="flex flex-wrap items-center justify-between gap-2 pt-4 border-t min-h-[60px] flex-shrink-0">
          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Back button - hide in payment-only mode (step 8) since user can only submit payment */}
            {step > 1 && !showVerification && !isPaymentOnlyMode && (
              <Button variant="outline" onClick={prevStep} size="sm" className="text-sm">
                {t.registration.back}
              </Button>
            )}
            {showVerification && (
              <Button 
                variant="outline"
                size="sm"
                className="text-sm"
                onClick={() => {
                  setShowVerification(false)
                  setEmailOtp('')
                  setMobileOtp('')
                  setEmailVerified(false)
                  setMobileVerified(false)
                }}
              >
                {t.registration.back}
              </Button>
            )}
          </div>
          
          <div className="flex flex-wrap items-center gap-2 justify-end flex-1 min-w-0">
            {/* Hide reset/save in payment-only mode */}
            {!isPaymentOnlyMode && (
            <>
            <Button 
              variant="ghost"
              size="sm"
              onClick={resetDraft}
              className="gap-1 text-muted-foreground hover:text-destructive px-2"
              title={language === 'hi' ? 'ड्राफ्ट रीसेट करें' : 'Reset Draft'}
            >
              <ArrowCounterClockwise size={16} />
              <span className="hidden md:inline text-sm">{language === 'hi' ? 'रीसेट' : 'Reset'}</span>
            </Button>
            <Button 
              variant="ghost"
              size="sm"
              onClick={saveDraft}
              className="gap-1 text-muted-foreground hover:text-primary px-2"
            >
              <FloppyDisk size={16} />
              <span className="hidden sm:inline text-sm">{language === 'hi' ? 'सेव' : 'Save'}</span>
            </Button>
            </>
            )}
            
            {step < 7 && !showVerification && !(isAdminMode && step === 6) ? (
              isPaymentOnlyMode ? (
                <Button 
                  size="sm"
                  variant="outline"
                  onClick={nextStep}
                >
                  {t.registration.next}
                </Button>
              ) : (
              <Button 
                size="sm"
                onClick={nextStep}
                disabled={
                  (step === 1 && !isAdminMode && (
                    !(formData.fullName || '').trim() || 
                    !formData.dateOfBirth || 
                    !formData.gender || 
                    !(formData.religion || '').trim() || 
                    !(formData.motherTongue || '').trim() ||
                    !formData.height ||
                    !formData.maritalStatus ||
                    !formData.profileCreatedFor ||
                    (formData.profileCreatedFor === 'Other' && !(formData.otherRelation || '').trim()) ||
                    ((formData.horoscopeMatching || 'not-mandatory') === 'mandatory' && (!formData.birthTime || !formData.birthPlace)) ||
                    !formData.disability
                  )) ||
                  (step === 1 && isAdminMode && (
                    !(formData.fullName || '').trim() || 
                    !formData.gender
                  )) ||
                  (step === 2 && !isAdminMode && (!formData.education || !formData.occupation)) ||
                  (step === 3 && !isAdminMode && (
                    !formData.location || 
                    formData.location === '__other__' ||
                    !formData.state || 
                    !formData.country || 
                    !formData.email || 
                    !formData.mobile ||
                    (formData.country !== 'India' && !formData.residentialStatus)
                  )) ||
                  (step === 4 && !isAdminMode && (photos.length === 0 || !selfiePreview || !faceCoverageValid || (!isEditMode && !idProofPreview))) ||
                  (step === 5 && !isAdminMode && !(formData.bio || '').trim())
                }
              >
                {t.registration.next}
              </Button>
              )
            ) : (step === 7 || (isAdminMode && step === 6)) ? (
              <Button 
                size="sm" 
                onClick={handleSubmit} 
                disabled={
                  isAdminMode 
                    ? isSubmitting // Admin mode: only check if submitting
                    : (
                          !termsAccepted || 
                          !formData.membershipPlan || 
                          isSubmitting
                          // Note: Payment screenshot NOT required during initial registration
                          // For paid plans, admin will verify ID/face first, then return profile for payment
                        )
                }
              >
                {isSubmitting ? (
                  <>
                    <SpinnerGap className="mr-2 h-4 w-4 animate-spin" />
                    {language === 'hi' ? 'अपलोड हो रहा है...' : 'Uploading...'}
                  </>
                ) : (
                  isAdminMode 
                    ? (language === 'hi' ? 'बदलाव सेव करें' : 'Save Changes')
                    : (isEditMode 
                        ? (() => {
                            const changes = getChangedFieldsSummary()
                            const hasCriticalChanges = changes.critical.length > 0
                            return hasCriticalChanges 
                              ? t.registration.sendForVerification 
                              : t.registration.updateProfile
                          })()
                        : t.registration.submit)
                )}
              </Button>
            ) : step === 8 ? (
              /* Step 8: Payment submission only */
              <Button 
                size="sm" 
                onClick={handleSubmit} 
                disabled={isSubmitting || paymentScreenshotPreviews.length === 0 || paymentScreenshotPreviews.every((_, i) => brokenPaymentImages.has(i))}
                className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
              >
                {isSubmitting ? (
                  <>
                    <SpinnerGap className="mr-2 h-4 w-4 animate-spin" />
                    {language === 'hi' ? 'अपलोड हो रहा है...' : 'Uploading...'}
                  </>
                ) : (
                  <>
                    <CurrencyInr size={16} className="mr-1" />
                    {language === 'hi' ? 'भुगतान सबमिट करें' : 'Submit Payment'}
                  </>
                )}
              </Button>
            ) : null}
          </div>
        </div>
        )}

        {/* Photo Lightbox */}
        <PhotoLightbox
          photos={lightboxState.photos}
          initialIndex={lightboxState.initialIndex}
          open={lightboxState.open}
          onClose={closeLightbox}
        />
        
        {/* Camera Capture for ID Proof */}
        <CameraCapture
          open={showIdProofCamera}
          onClose={() => setShowIdProofCamera(false)}
          onCapture={(imageDataUrl) => {
            setIdProofPreview(imageDataUrl)
          }}
          language={language}
          title={language === 'hi' ? 'पहचान पत्र कैप्चर करें' : 'Capture ID Proof'}
          description={language === 'hi' ? 'अपने पहचान पत्र की स्पष्ट फोटो लें' : 'Take a clear photo of your ID document'}
          preferBackCamera={true}
        />
        
        {/* Camera Capture for Profile Photos */}
        <CameraCapture
          open={showPhotoCamera}
          onClose={() => setShowPhotoCamera(false)}
          onCapture={(imageDataUrl) => {
            // Convert data URL to File and add to photos (max 3 total)
            if (photos.length >= 3) return // Enforce 3 photo limit
            fetch(imageDataUrl)
              .then(res => res.blob())
              .then(blob => {
                const file = new File([blob], `photo-${Date.now()}.jpg`, { type: 'image/jpeg' })
                setPhotos(prev => {
                  if (prev.length >= 3) return prev // Double-check limit
                  return [...prev, { file, preview: imageDataUrl }]
                })
              })
          }}
          language={language}
          title={language === 'hi' ? 'प्रोफाइल फोटो कैप्चर करें' : 'Capture Profile Photo'}
          description={language === 'hi' ? 'अधिकतम 3 फोटो अपलोड करें (कम से कम 1 आवश्यक)' : 'Maximum 3 photos allowed (minimum 1 required)'}
          preferBackCamera={false}
          multiple={true}
          maxPhotos={3}
          existingPhotosCount={photos.length}
        />
        
        {/* Camera Capture for Payment Screenshot */}
        <CameraCapture
          open={showPaymentCamera}
          onClose={() => setShowPaymentCamera(false)}
          onCapture={(imageDataUrl) => {
            // Add the base64 preview (will be converted to file during upload)
            setPaymentScreenshotPreviews(prev => [...prev, imageDataUrl])
            // Convert base64 to File for proper upload
            try {
              const paymentFile = dataUrlToFile(imageDataUrl, `payment-camera-${Date.now()}.jpg`)
              setPaymentScreenshotFiles(prev => [...prev, paymentFile])
            } catch (err) {
              logger.warn('Failed to convert camera capture to file:', err)
              // No file added - base64 will be handled during submit
            }
          }}
          language={language}
          title={language === 'hi' ? 'भुगतान रसीद कैप्चर करें' : 'Capture Payment Receipt'}
          description={language === 'hi' ? 'भुगतान की रसीद या स्क्रीनशॉट की फोटो लें' : 'Take a photo of payment receipt or screenshot'}
          preferBackCamera={true}
          multiple={true}
          maxPhotos={5}
          existingPhotosCount={paymentScreenshotPreviews.length}
        />
      </DialogContent>

      {/* Terms and Conditions Dialog */}
      <TermsAndConditions
        open={showTerms}
        onClose={() => setShowTerms(false)}
        language={language}
        membershipSettings={membershipSettings}
      />
    </Dialog>
  )
}
