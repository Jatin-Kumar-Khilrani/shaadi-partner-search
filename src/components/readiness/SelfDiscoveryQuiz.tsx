import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import { 
  Brain, 
  Heart, 
  Users, 
  Lightning, 
  TreeStructure,
  ArrowRight,
  ArrowLeft,
  CheckCircle,
  Sparkle,
  Sun,
  Moon,
  Handshake,
  Mountains,
  House,
  Briefcase,
  Star
} from '@phosphor-icons/react'
import type { SelfDiscoveryData, PersonalityDimension, ValuesOrientation, LifestylePace, FamilyOrientation, ConflictStyle } from '@/types/profile'

interface SelfDiscoveryQuizProps {
  language: 'en' | 'hi'
  onComplete: (data: SelfDiscoveryData) => void
  existingData?: SelfDiscoveryData | null
}

const translations = {
  en: {
    title: 'Self-Discovery Questionnaire',
    subtitle: 'Understanding yourself is the first step to finding the right partner',
    step: 'Step',
    of: 'of',
    next: 'Next',
    previous: 'Previous',
    complete: 'Complete',
    selectUpTo: 'Select up to',
    selectAtLeast: 'Select at least',
    
    // Step 1: Core Values
    coreValuesTitle: 'Your Core Values',
    coreValuesDesc: 'What matters most to you in life? (Select 3-5 values)',
    values: {
      family: 'Family',
      career: 'Career & Achievement',
      spirituality: 'Spirituality & Faith',
      adventure: 'Adventure & Exploration',
      stability: 'Stability & Security',
      growth: 'Personal Growth',
      creativity: 'Creativity & Expression',
      service: 'Service to Others'
    },
    
    // Step 2: Personality Type
    personalityTitle: 'Your Social Style',
    personalityDesc: 'How do you typically recharge and interact with others?',
    personality: {
      introvert: 'Introvert - I prefer quiet time and small gatherings',
      balanced: 'Balanced - I enjoy both social events and alone time equally',
      extrovert: 'Extrovert - I energize through social interactions'
    },
    
    // Step 3: Values Orientation
    valuesOrientationTitle: 'Your Values Orientation',
    valuesOrientationDesc: 'How would you describe your approach to traditions and change?',
    valuesOrientation: {
      traditional: 'Traditional - I value customs, rituals, and time-tested ways',
      moderate: 'Moderate - I balance traditions with modern thinking',
      progressive: 'Progressive - I embrace change and new perspectives'
    },
    
    // Step 4: Lifestyle Pace
    lifestyleTitle: 'Your Life Pace',
    lifestyleDesc: 'How would you describe your approach to life and career?',
    lifestyle: {
      relaxed: 'Relaxed - I prioritize work-life balance and peace',
      balanced: 'Balanced - I work hard but also value rest and relationships',
      ambitious: 'Ambitious - I am driven to achieve and constantly grow'
    },
    
    // Step 5: Family Orientation
    familyTitle: 'Family Living Preference',
    familyDesc: 'What is your preference for family structure after marriage?',
    family: {
      'joint-family': 'Joint Family - Living with parents/in-laws',
      'nuclear-flexible': 'Flexible - Open to both joint and nuclear based on situation',
      'nuclear-preferred': 'Nuclear Family - Prefer independent living, but staying connected'
    },
    
    // Step 6: Conflict Style
    conflictTitle: 'How You Handle Disagreements',
    conflictDesc: 'When there is a conflict or difference of opinion, how do you usually respond?',
    conflict: {
      avoidant: 'I prefer to avoid conflict and let things cool down',
      collaborative: 'I like to discuss calmly and find middle ground together',
      direct: 'I prefer to address issues directly and resolve them quickly'
    },
    
    // Step 7: Daily Lifestyle
    dailyTitle: 'Daily Lifestyle',
    dailyDesc: 'Tell us about your daily preferences',
    morningPerson: 'Are you a morning person?',
    yes: 'Yes',
    no: 'No',
    socialFrequency: 'How often do you like to socialize outside home?',
    social: {
      rarely: 'Rarely - I prefer staying home',
      sometimes: 'Sometimes - Occasional outings',
      often: 'Often - I love going out'
    },
    
    // Step 8: Interests
    interestsTitle: 'Hobbies & Interests',
    interestsDesc: 'What do you enjoy doing in your free time? (Select all that apply)',
    hobbies: {
      reading: 'Reading',
      music: 'Music',
      sports: 'Sports & Fitness',
      cooking: 'Cooking',
      travel: 'Traveling',
      movies: 'Movies & Series',
      art: 'Art & Crafts',
      gaming: 'Gaming',
      photography: 'Photography',
      gardening: 'Gardening',
      meditation: 'Yoga & Meditation',
      volunteering: 'Volunteering',
      writing: 'Writing',
      dancing: 'Dancing'
    },
    
    // Step 9: Importance
    importanceTitle: 'Lifestyle Priorities',
    importanceDesc: 'How important are these aspects to you?',
    fitnessImportance: 'Health & Fitness',
    travelImportance: 'Travel & Exploration',
    low: 'Low',
    medium: 'Medium',
    high: 'High',
    
    // Step 10: Growth Areas
    growthTitle: 'Areas for Growth',
    growthDesc: 'Self-awareness includes knowing where you want to improve. (Select 2-4 areas)',
    growth: {
      patience: 'Patience',
      communication: 'Communication',
      finance: 'Financial Management',
      'emotional-control': 'Emotional Control',
      'time-management': 'Time Management',
      flexibility: 'Flexibility & Adaptability',
      assertiveness: 'Assertiveness'
    },
    
    completedMessage: 'Great job! Your self-discovery profile is complete.',
    completedDesc: 'This helps us understand you better and find more compatible matches.'
  },
  hi: {
    title: 'आत्म-खोज प्रश्नावली',
    subtitle: 'खुद को समझना सही साथी खोजने की पहली सीढ़ी है',
    step: 'चरण',
    of: 'में से',
    next: 'आगे',
    previous: 'पीछे',
    complete: 'पूर्ण करें',
    selectUpTo: 'अधिकतम चुनें',
    selectAtLeast: 'कम से कम चुनें',
    
    // Step 1: Core Values
    coreValuesTitle: 'आपके मूल मूल्य',
    coreValuesDesc: 'जीवन में आपके लिए सबसे महत्वपूर्ण क्या है? (3-5 मूल्य चुनें)',
    values: {
      family: 'परिवार',
      career: 'करियर और उपलब्धि',
      spirituality: 'आध्यात्मिकता और विश्वास',
      adventure: 'साहसिक और अन्वेषण',
      stability: 'स्थिरता और सुरक्षा',
      growth: 'व्यक्तिगत विकास',
      creativity: 'रचनात्मकता और अभिव्यक्ति',
      service: 'दूसरों की सेवा'
    },
    
    // Step 2: Personality Type
    personalityTitle: 'आपकी सामाजिक शैली',
    personalityDesc: 'आप आमतौर पर कैसे ऊर्जा प्राप्त करते हैं?',
    personality: {
      introvert: 'अंतर्मुखी - मुझे शांत समय और छोटी मोहभंग पसंद है',
      balanced: 'संतुलित - मैं सामाजिक कार्यक्रम और अकेले समय दोनों का आनंद लेता हूं',
      extrovert: 'बहिर्मुखी - मैं सामाजिक बातचीत से ऊर्जा प्राप्त करता हूं'
    },
    
    // Step 3: Values Orientation
    valuesOrientationTitle: 'आपका मूल्य अभिविन्यास',
    valuesOrientationDesc: 'परंपराओं और बदलाव के प्रति आपका दृष्टिकोण कैसा है?',
    valuesOrientation: {
      traditional: 'परंपरागत - मैं रीति-रिवाजों और समय-परीक्षित तरीकों को महत्व देता हूं',
      moderate: 'मध्यम - मैं परंपराओं को आधुनिक सोच के साथ संतुलित करता हूं',
      progressive: 'प्रगतिशील - मैं बदलाव और नए दृष्टिकोणों को अपनाता हूं'
    },
    
    // Step 4: Lifestyle Pace
    lifestyleTitle: 'आपकी जीवन गति',
    lifestyleDesc: 'जीवन और करियर के प्रति आपका दृष्टिकोण कैसा है?',
    lifestyle: {
      relaxed: 'आराम से - मैं कार्य-जीवन संतुलन और शांति को प्राथमिकता देता हूं',
      balanced: 'संतुलित - मैं कड़ी मेहनत करता हूं लेकिन आराम और रिश्तों को भी महत्व देता हूं',
      ambitious: 'महत्वाकांक्षी - मैं हासिल करने और लगातार बढ़ने के लिए प्रेरित हूं'
    },
    
    // Step 5: Family Orientation
    familyTitle: 'पारिवारिक रहने की प्राथमिकता',
    familyDesc: 'शादी के बाद परिवार संरचना के लिए आपकी प्राथमिकता क्या है?',
    family: {
      'joint-family': 'संयुक्त परिवार - माता-पिता/ससुराल के साथ रहना',
      'nuclear-flexible': 'लचीला - स्थिति के अनुसार दोनों के लिए खुला',
      'nuclear-preferred': 'एकल परिवार - स्वतंत्र रहना पसंद, लेकिन जुड़े रहना'
    },
    
    // Step 6: Conflict Style
    conflictTitle: 'असहमति को कैसे संभालते हैं',
    conflictDesc: 'जब कोई संघर्ष या मतभेद हो, तो आप आमतौर पर कैसे प्रतिक्रिया करते हैं?',
    conflict: {
      avoidant: 'मैं संघर्ष से बचना पसंद करता हूं और चीजों को ठंडा होने देता हूं',
      collaborative: 'मैं शांति से चर्चा करना और एक साथ मध्य मार्ग खोजना पसंद करता हूं',
      direct: 'मैं मुद्दों को सीधे संबोधित करना और जल्दी हल करना पसंद करता हूं'
    },
    
    // Step 7: Daily Lifestyle
    dailyTitle: 'दैनिक जीवनशैली',
    dailyDesc: 'अपनी दैनिक प्राथमिकताओं के बारे में बताएं',
    morningPerson: 'क्या आप सुबह के व्यक्ति हैं?',
    yes: 'हाँ',
    no: 'नहीं',
    socialFrequency: 'आप घर से बाहर कितनी बार मिलना-जुलना पसंद करते हैं?',
    social: {
      rarely: 'शायद ही कभी - मैं घर पर रहना पसंद करता हूं',
      sometimes: 'कभी-कभी - कभी-कभार बाहर जाना',
      often: 'अक्सर - मुझे बाहर जाना पसंद है'
    },
    
    // Step 8: Interests
    interestsTitle: 'शौक और रुचियां',
    interestsDesc: 'आप अपने खाली समय में क्या करना पसंद करते हैं? (सभी लागू चुनें)',
    hobbies: {
      reading: 'पढ़ना',
      music: 'संगीत',
      sports: 'खेल और फिटनेस',
      cooking: 'खाना बनाना',
      travel: 'यात्रा',
      movies: 'फिल्में और सीरीज',
      art: 'कला और शिल्प',
      gaming: 'गेमिंग',
      photography: 'फोटोग्राफी',
      gardening: 'बागवानी',
      meditation: 'योग और ध्यान',
      volunteering: 'स्वयंसेवा',
      writing: 'लेखन',
      dancing: 'नृत्य'
    },
    
    // Step 9: Importance
    importanceTitle: 'जीवनशैली प्राथमिकताएं',
    importanceDesc: 'ये पहलू आपके लिए कितने महत्वपूर्ण हैं?',
    fitnessImportance: 'स्वास्थ्य और फिटनेस',
    travelImportance: 'यात्रा और अन्वेषण',
    low: 'कम',
    medium: 'मध्यम',
    high: 'उच्च',
    
    // Step 10: Growth Areas
    growthTitle: 'विकास के क्षेत्र',
    growthDesc: 'आत्म-जागरूकता में यह जानना शामिल है कि आप कहां सुधार करना चाहते हैं। (2-4 क्षेत्र चुनें)',
    growth: {
      patience: 'धैर्य',
      communication: 'संवाद',
      finance: 'वित्तीय प्रबंधन',
      'emotional-control': 'भावनात्मक नियंत्रण',
      'time-management': 'समय प्रबंधन',
      flexibility: 'लचीलापन और अनुकूलता',
      assertiveness: 'मुखरता'
    },
    
    completedMessage: 'बहुत बढ़िया! आपकी आत्म-खोज प्रोफ़ाइल पूर्ण है।',
    completedDesc: 'यह हमें आपको बेहतर समझने और अधिक संगत मैच खोजने में मदद करता है।'
  }
}

const allHobbies = ['reading', 'music', 'sports', 'cooking', 'travel', 'movies', 'art', 'gaming', 'photography', 'gardening', 'meditation', 'volunteering', 'writing', 'dancing']
const allValues = ['family', 'career', 'spirituality', 'adventure', 'stability', 'growth', 'creativity', 'service'] as const
const allGrowthAreas = ['patience', 'communication', 'finance', 'emotional-control', 'time-management', 'flexibility', 'assertiveness'] as const

export function SelfDiscoveryQuiz({ language, onComplete, existingData }: SelfDiscoveryQuizProps) {
  const t = translations[language]
  const [currentStep, setCurrentStep] = useState(1)
  const totalSteps = 10
  
  // Form state
  const [topValues, setTopValues] = useState<typeof allValues[number][]>(existingData?.topValues || [])
  const [personalityType, setPersonalityType] = useState<PersonalityDimension>(existingData?.personalityType || 'balanced')
  const [valuesOrientation, setValuesOrientation] = useState<ValuesOrientation>(existingData?.valuesOrientation || 'moderate')
  const [lifestylePace, setLifestylePace] = useState<LifestylePace>(existingData?.lifestylePace || 'balanced')
  const [familyOrientation, setFamilyOrientation] = useState<FamilyOrientation>(existingData?.familyOrientation || 'nuclear-flexible')
  const [conflictStyle, setConflictStyle] = useState<ConflictStyle>(existingData?.conflictStyle || 'collaborative')
  const [morningPerson, setMorningPerson] = useState<boolean>(existingData?.morningPerson ?? true)
  const [socialFrequency, setSocialFrequency] = useState<'rarely' | 'sometimes' | 'often'>(existingData?.socialFrequency || 'sometimes')
  const [hobbies, setHobbies] = useState<string[]>(existingData?.hobbies || [])
  const [fitnessImportance, setFitnessImportance] = useState<'low' | 'medium' | 'high'>(existingData?.fitnessImportance || 'medium')
  const [travelInterest, setTravelInterest] = useState<'low' | 'medium' | 'high'>(existingData?.travelInterest || 'medium')
  const [growthAreas, setGrowthAreas] = useState<typeof allGrowthAreas[number][]>(existingData?.growthAreas || [])
  
  const progress = (currentStep / totalSteps) * 100
  
  const handleValueToggle = (value: typeof allValues[number]) => {
    if (topValues.includes(value)) {
      setTopValues(topValues.filter(v => v !== value))
    } else if (topValues.length < 5) {
      setTopValues([...topValues, value])
    }
  }
  
  const handleHobbyToggle = (hobby: string) => {
    if (hobbies.includes(hobby)) {
      setHobbies(hobbies.filter(h => h !== hobby))
    } else {
      setHobbies([...hobbies, hobby])
    }
  }
  
  const handleGrowthToggle = (area: typeof allGrowthAreas[number]) => {
    if (growthAreas.includes(area)) {
      setGrowthAreas(growthAreas.filter(a => a !== area))
    } else if (growthAreas.length < 4) {
      setGrowthAreas([...growthAreas, area])
    }
  }
  
  const canProceed = () => {
    switch (currentStep) {
      case 1: return topValues.length >= 3
      case 10: return growthAreas.length >= 2
      default: return true
    }
  }
  
  const handleComplete = () => {
    const data: SelfDiscoveryData = {
      topValues: topValues as SelfDiscoveryData['topValues'],
      personalityType,
      valuesOrientation,
      lifestylePace,
      familyOrientation,
      conflictStyle,
      morningPerson,
      socialFrequency,
      hobbies,
      fitnessImportance,
      travelInterest,
      growthAreas: growthAreas as SelfDiscoveryData['growthAreas'],
      completedAt: new Date().toISOString()
    }
    onComplete(data)
  }
  
  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <Heart size={24} className="text-primary" weight="fill" />
              <div>
                <h3 className="font-semibold text-lg">{t.coreValuesTitle}</h3>
                <p className="text-sm text-muted-foreground">{t.coreValuesDesc}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {allValues.map(value => (
                <div
                  key={value}
                  onClick={() => handleValueToggle(value)}
                  className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                    topValues.includes(value) 
                      ? 'border-primary bg-primary/10' 
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Checkbox checked={topValues.includes(value)} />
                    <span className="font-medium">{t.values[value]}</span>
                  </div>
                </div>
              ))}
            </div>
            <p className="text-sm text-muted-foreground text-center">
              {t.selectAtLeast} 3, {t.selectUpTo} 5 ({topValues.length}/5)
            </p>
          </div>
        )
      
      case 2:
        return (
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <Users size={24} className="text-primary" weight="fill" />
              <div>
                <h3 className="font-semibold text-lg">{t.personalityTitle}</h3>
                <p className="text-sm text-muted-foreground">{t.personalityDesc}</p>
              </div>
            </div>
            <RadioGroup value={personalityType} onValueChange={(v) => setPersonalityType(v as PersonalityDimension)}>
              {(['introvert', 'balanced', 'extrovert'] as const).map(type => (
                <div key={type} className="flex items-center space-x-3 p-4 rounded-lg border hover:bg-accent cursor-pointer">
                  <RadioGroupItem value={type} id={type} />
                  <Label htmlFor={type} className="flex-1 cursor-pointer">
                    {t.personality[type]}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>
        )
      
      case 3:
        return (
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <TreeStructure size={24} className="text-primary" weight="fill" />
              <div>
                <h3 className="font-semibold text-lg">{t.valuesOrientationTitle}</h3>
                <p className="text-sm text-muted-foreground">{t.valuesOrientationDesc}</p>
              </div>
            </div>
            <RadioGroup value={valuesOrientation} onValueChange={(v) => setValuesOrientation(v as ValuesOrientation)}>
              {(['traditional', 'moderate', 'progressive'] as const).map(type => (
                <div key={type} className="flex items-center space-x-3 p-4 rounded-lg border hover:bg-accent cursor-pointer">
                  <RadioGroupItem value={type} id={`vo-${type}`} />
                  <Label htmlFor={`vo-${type}`} className="flex-1 cursor-pointer">
                    {t.valuesOrientation[type]}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>
        )
      
      case 4:
        return (
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <Lightning size={24} className="text-primary" weight="fill" />
              <div>
                <h3 className="font-semibold text-lg">{t.lifestyleTitle}</h3>
                <p className="text-sm text-muted-foreground">{t.lifestyleDesc}</p>
              </div>
            </div>
            <RadioGroup value={lifestylePace} onValueChange={(v) => setLifestylePace(v as LifestylePace)}>
              {(['relaxed', 'balanced', 'ambitious'] as const).map(type => (
                <div key={type} className="flex items-center space-x-3 p-4 rounded-lg border hover:bg-accent cursor-pointer">
                  <RadioGroupItem value={type} id={`lp-${type}`} />
                  <Label htmlFor={`lp-${type}`} className="flex-1 cursor-pointer">
                    {t.lifestyle[type]}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>
        )
      
      case 5:
        return (
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <House size={24} className="text-primary" weight="fill" />
              <div>
                <h3 className="font-semibold text-lg">{t.familyTitle}</h3>
                <p className="text-sm text-muted-foreground">{t.familyDesc}</p>
              </div>
            </div>
            <RadioGroup value={familyOrientation} onValueChange={(v) => setFamilyOrientation(v as FamilyOrientation)}>
              {(['joint-family', 'nuclear-flexible', 'nuclear-preferred'] as const).map(type => (
                <div key={type} className="flex items-center space-x-3 p-4 rounded-lg border hover:bg-accent cursor-pointer">
                  <RadioGroupItem value={type} id={`fo-${type}`} />
                  <Label htmlFor={`fo-${type}`} className="flex-1 cursor-pointer">
                    {t.family[type]}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>
        )
      
      case 6:
        return (
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <Handshake size={24} className="text-primary" weight="fill" />
              <div>
                <h3 className="font-semibold text-lg">{t.conflictTitle}</h3>
                <p className="text-sm text-muted-foreground">{t.conflictDesc}</p>
              </div>
            </div>
            <RadioGroup value={conflictStyle} onValueChange={(v) => setConflictStyle(v as ConflictStyle)}>
              {(['avoidant', 'collaborative', 'direct'] as const).map(type => (
                <div key={type} className="flex items-center space-x-3 p-4 rounded-lg border hover:bg-accent cursor-pointer">
                  <RadioGroupItem value={type} id={`cs-${type}`} />
                  <Label htmlFor={`cs-${type}`} className="flex-1 cursor-pointer">
                    {t.conflict[type]}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>
        )
      
      case 7:
        return (
          <div className="space-y-6">
            <div className="flex items-center gap-2 mb-4">
              <Sun size={24} className="text-primary" weight="fill" />
              <div>
                <h3 className="font-semibold text-lg">{t.dailyTitle}</h3>
                <p className="text-sm text-muted-foreground">{t.dailyDesc}</p>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label className="font-medium">{t.morningPerson}</Label>
              <RadioGroup value={morningPerson ? 'yes' : 'no'} onValueChange={(v) => setMorningPerson(v === 'yes')} className="flex gap-4">
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="yes" id="morning-yes" />
                  <Label htmlFor="morning-yes" className="flex items-center gap-1 cursor-pointer">
                    <Sun size={16} /> {t.yes}
                  </Label>
                </div>
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="no" id="morning-no" />
                  <Label htmlFor="morning-no" className="flex items-center gap-1 cursor-pointer">
                    <Moon size={16} /> {t.no}
                  </Label>
                </div>
              </RadioGroup>
            </div>
            
            <div className="space-y-2">
              <Label className="font-medium">{t.socialFrequency}</Label>
              <RadioGroup value={socialFrequency} onValueChange={(v) => setSocialFrequency(v as typeof socialFrequency)}>
                {(['rarely', 'sometimes', 'often'] as const).map(freq => (
                  <div key={freq} className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-accent cursor-pointer">
                    <RadioGroupItem value={freq} id={`sf-${freq}`} />
                    <Label htmlFor={`sf-${freq}`} className="flex-1 cursor-pointer">
                      {t.social[freq]}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>
          </div>
        )
      
      case 8:
        return (
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <Star size={24} className="text-primary" weight="fill" />
              <div>
                <h3 className="font-semibold text-lg">{t.interestsTitle}</h3>
                <p className="text-sm text-muted-foreground">{t.interestsDesc}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {allHobbies.map(hobby => (
                <div
                  key={hobby}
                  onClick={() => handleHobbyToggle(hobby)}
                  className={`p-3 rounded-lg border cursor-pointer transition-all ${
                    hobbies.includes(hobby) 
                      ? 'border-primary bg-primary/10' 
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Checkbox checked={hobbies.includes(hobby)} />
                    <span className="text-sm">{t.hobbies[hobby as keyof typeof t.hobbies]}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )
      
      case 9:
        return (
          <div className="space-y-6">
            <div className="flex items-center gap-2 mb-4">
              <Mountains size={24} className="text-primary" weight="fill" />
              <div>
                <h3 className="font-semibold text-lg">{t.importanceTitle}</h3>
                <p className="text-sm text-muted-foreground">{t.importanceDesc}</p>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="font-medium">{t.fitnessImportance}</Label>
                <RadioGroup value={fitnessImportance} onValueChange={(v) => setFitnessImportance(v as typeof fitnessImportance)} className="flex gap-4">
                  {(['low', 'medium', 'high'] as const).map(level => (
                    <div key={level} className="flex items-center gap-2">
                      <RadioGroupItem value={level} id={`fi-${level}`} />
                      <Label htmlFor={`fi-${level}`} className="cursor-pointer">{t[level]}</Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>
              
              <div className="space-y-2">
                <Label className="font-medium">{t.travelImportance}</Label>
                <RadioGroup value={travelInterest} onValueChange={(v) => setTravelInterest(v as typeof travelInterest)} className="flex gap-4">
                  {(['low', 'medium', 'high'] as const).map(level => (
                    <div key={level} className="flex items-center gap-2">
                      <RadioGroupItem value={level} id={`ti-${level}`} />
                      <Label htmlFor={`ti-${level}`} className="cursor-pointer">{t[level]}</Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>
            </div>
          </div>
        )
      
      case 10:
        return (
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <Brain size={24} className="text-primary" weight="fill" />
              <div>
                <h3 className="font-semibold text-lg">{t.growthTitle}</h3>
                <p className="text-sm text-muted-foreground">{t.growthDesc}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {allGrowthAreas.map(area => (
                <div
                  key={area}
                  onClick={() => handleGrowthToggle(area)}
                  className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                    growthAreas.includes(area) 
                      ? 'border-primary bg-primary/10' 
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Checkbox checked={growthAreas.includes(area)} />
                    <span className="font-medium">{t.growth[area]}</span>
                  </div>
                </div>
              ))}
            </div>
            <p className="text-sm text-muted-foreground text-center">
              {t.selectAtLeast} 2, {t.selectUpTo} 4 ({growthAreas.length}/4)
            </p>
          </div>
        )
      
      default:
        return null
    }
  }
  
  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-full">
            <Sparkle size={24} className="text-primary" weight="fill" />
          </div>
          <div>
            <CardTitle>{t.title}</CardTitle>
            <CardDescription>{t.subtitle}</CardDescription>
          </div>
        </div>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>{t.step} {currentStep} {t.of} {totalSteps}</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      </CardHeader>
      
      <CardContent>
        <ScrollArea className="h-[400px] pr-4">
          {renderStep()}
        </ScrollArea>
        
        <div className="flex justify-between mt-6 pt-4 border-t">
          <Button
            variant="outline"
            onClick={() => setCurrentStep(s => s - 1)}
            disabled={currentStep === 1}
          >
            <ArrowLeft size={16} className="mr-2" />
            {t.previous}
          </Button>
          
          {currentStep < totalSteps ? (
            <Button
              onClick={() => setCurrentStep(s => s + 1)}
              disabled={!canProceed()}
            >
              {t.next}
              <ArrowRight size={16} className="ml-2" />
            </Button>
          ) : (
            <Button
              onClick={handleComplete}
              disabled={!canProceed()}
              className="bg-green-600 hover:bg-green-700"
            >
              <CheckCircle size={16} className="mr-2" />
              {t.complete}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
