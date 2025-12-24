import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Checkbox } from '@/components/ui/checkbox'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import { 
  Target,
  Heart,
  House,
  Briefcase,
  Baby,
  CurrencyDollar,
  MapPin,
  ArrowRight,
  ArrowLeft,
  CheckCircle,
  Warning,
  Star,
  Prohibit
} from '@phosphor-icons/react'
import type { PartnerExpectationsData } from '@/types/profile'

interface PartnerExpectationsProps {
  language: 'en' | 'hi'
  profileId: string
  onComplete: (data: PartnerExpectationsData) => void
  existingData?: PartnerExpectationsData | null
}

type MustHaveQuality = 'respectful' | 'family-oriented' | 'financially-responsible' | 'honest' | 'caring' | 'ambitious' | 'spiritual' | 'educated' | 'supportive' | 'humorous' | 'loyal' | 'patient'
type Dealbreaker = 'smoking' | 'drinking' | 'dishonesty' | 'aggression' | 'irresponsibility' | 'disrespectful' | 'short-tempered' | 'unrealistic-expectations' | 'no-family-values' | 'workaholic' | 'controlling' | 'laziness'

const translations = {
  en: {
    title: 'Partner Expectations',
    subtitle: 'Clear expectations help find better matches',
    step: 'Step',
    of: 'of',
    next: 'Next',
    previous: 'Previous',
    complete: 'Complete',
    selectBetween: 'Select between',
    and: 'and',
    
    // Step 1: Must-have qualities
    qualitiesTitle: 'Must-Have Qualities',
    qualitiesDesc: 'Select 3-5 qualities that are most important in your partner',
    qualities: {
      respectful: 'Respectful',
      'family-oriented': 'Family-oriented',
      'financially-responsible': 'Financially Responsible',
      honest: 'Honest',
      caring: 'Caring & Nurturing',
      ambitious: 'Ambitious',
      spiritual: 'Spiritual/Religious',
      educated: 'Well Educated',
      supportive: 'Supportive',
      humorous: 'Good Sense of Humor',
      loyal: 'Loyal & Faithful',
      patient: 'Patient'
    },
    
    // Step 2: Dealbreakers
    dealbreakersTitle: 'Dealbreakers',
    dealbreakersDesc: 'Select 3-5 traits you absolutely cannot accept',
    dealbreakers: {
      smoking: 'Smoking',
      drinking: 'Regular Drinking',
      dishonesty: 'Dishonesty',
      aggression: 'Aggression/Violence',
      irresponsibility: 'Irresponsibility',
      disrespectful: 'Disrespectful Behavior',
      'short-tempered': 'Short-Tempered',
      'unrealistic-expectations': 'Unrealistic Expectations',
      'no-family-values': 'No Family Values',
      workaholic: 'Workaholic (No Work-Life Balance)',
      controlling: 'Controlling Behavior',
      laziness: 'Laziness'
    },
    
    // Step 3: Living preference
    livingTitle: 'Living Preference',
    livingDesc: 'Where would you prefer to live after marriage?',
    living: {
      'with-parents': 'With Parents/In-Laws - Joint family living',
      'nearby-parents': 'Near Parents - Close but separate living',
      'independent': 'Independent - Fully independent living',
      'flexible': 'Flexible - Open to discussing based on situation'
    },
    
    // Step 4: Work preference
    workTitle: 'Work After Marriage',
    workDesc: 'What are your expectations about work after marriage?',
    work: {
      'must-work': 'Must Work - Career is very important',
      'prefer-work': 'Prefer Work - Would like to continue working',
      'flexible': 'Flexible - Can discuss based on situation',
      'prefer-homemaker': 'Prefer Homemaking - Focus on family',
      'flexible-homemaker': 'Flexible Homemaker - Can work part-time if needed'
    },
    
    // Step 5: Children preference
    childrenTitle: 'Children Preference',
    childrenDesc: 'What are your thoughts about having children?',
    children: {
      'soon': 'Soon - Would like children early in marriage',
      'after-few-years': 'After Few Years - Want to settle first',
      'flexible': 'Flexible - Open to discussion',
      'no-children': 'No Children - Prefer not to have children'
    },
    
    // Step 6: Financial partnership
    financeTitle: 'Financial Partnership',
    financeDesc: 'How would you prefer to manage finances after marriage?',
    finance: {
      'joint': 'Joint - Pool all income together',
      'separate': 'Separate - Maintain individual accounts',
      'flexible': 'Flexible/Hybrid - Some shared, some individual'
    },
    
    // Step 7: Relocation
    relocateTitle: 'Relocation Willingness',
    relocateDesc: 'Are you willing to relocate after marriage if needed?',
    relocate: {
      'willing': 'Willing - Ready to relocate for partner/career',
      'prefer-not': 'Prefer Not - Would prefer to stay in current location',
      'not-willing': 'Not Willing - Cannot relocate'
    },
    
    // Step 8: Vision
    visionTitle: 'Your Marriage Vision',
    visionDesc: 'In a few sentences, describe how you envision your ideal marriage',
    visionPlaceholder: 'Share your thoughts about what a happy marriage looks like to you...',
    visionHint: 'Be honest and specific - this helps find truly compatible matches',
    
    completedMessage: 'Great! Your partner expectations are saved.',
    completedDesc: 'This helps us find matches that align with your vision.'
  },
  hi: {
    title: 'साथी की अपेक्षाएं',
    subtitle: 'स्पष्ट अपेक्षाएं बेहतर मैच खोजने में मदद करती हैं',
    step: 'चरण',
    of: 'में से',
    next: 'आगे',
    previous: 'पीछे',
    complete: 'पूर्ण करें',
    selectBetween: 'चुनें',
    and: 'से',
    
    qualitiesTitle: 'आवश्यक गुण',
    qualitiesDesc: 'अपने साथी में सबसे महत्वपूर्ण 3-5 गुण चुनें',
    qualities: {
      respectful: 'सम्मानजनक',
      'family-oriented': 'परिवार-केंद्रित',
      'financially-responsible': 'आर्थिक रूप से जिम्मेदार',
      honest: 'ईमानदार',
      caring: 'देखभाल करने वाला',
      ambitious: 'महत्वाकांक्षी',
      spiritual: 'आध्यात्मिक/धार्मिक',
      educated: 'सुशिक्षित',
      supportive: 'सहायक',
      humorous: 'हास्य भावना',
      loyal: 'वफादार',
      patient: 'धैर्यवान'
    },
    
    dealbreakersTitle: 'डीलब्रेकर',
    dealbreakersDesc: 'ऐसे 3-5 गुण चुनें जो आप बिल्कुल स्वीकार नहीं कर सकते',
    dealbreakers: {
      smoking: 'धूम्रपान',
      drinking: 'नियमित शराब पीना',
      dishonesty: 'बेईमानी',
      aggression: 'आक्रामकता/हिंसा',
      irresponsibility: 'गैर-जिम्मेदारी',
      disrespectful: 'अपमानजनक व्यवहार',
      'short-tempered': 'गुस्सैल',
      'unrealistic-expectations': 'अवास्तविक अपेक्षाएं',
      'no-family-values': 'पारिवारिक मूल्य नहीं',
      workaholic: 'वर्कहॉलिक',
      controlling: 'नियंत्रित करने वाला',
      laziness: 'आलस्य'
    },
    
    livingTitle: 'रहने की प्राथमिकता',
    livingDesc: 'शादी के बाद आप कहाँ रहना पसंद करेंगे?',
    living: {
      'with-parents': 'माता-पिता के साथ - संयुक्त परिवार',
      'nearby-parents': 'माता-पिता के पास - करीब लेकिन अलग',
      'independent': 'स्वतंत्र - पूर्णतः स्वतंत्र रहना',
      'flexible': 'लचीला - स्थिति के अनुसार चर्चा के लिए खुला'
    },
    
    workTitle: 'शादी के बाद काम',
    workDesc: 'शादी के बाद काम के बारे में आपकी अपेक्षाएं क्या हैं?',
    work: {
      'must-work': 'काम करना जरूरी - करियर बहुत महत्वपूर्ण है',
      'prefer-work': 'काम करना पसंद - काम जारी रखना चाहूंगा',
      'flexible': 'लचीला - स्थिति के अनुसार चर्चा कर सकते हैं',
      'prefer-homemaker': 'गृहिणी पसंद - परिवार पर ध्यान',
      'flexible-homemaker': 'लचीला गृहिणी - जरूरत हो तो पार्ट-टाइम काम'
    },
    
    childrenTitle: 'बच्चों की प्राथमिकता',
    childrenDesc: 'बच्चे होने के बारे में आपके विचार क्या हैं?',
    children: {
      'soon': 'जल्दी - शादी के शुरू में बच्चे चाहूंगा',
      'after-few-years': 'कुछ वर्षों बाद - पहले सेटल होना',
      'flexible': 'लचीला - चर्चा के लिए खुला',
      'no-children': 'बच्चे नहीं - बच्चे नहीं चाहता'
    },
    
    financeTitle: 'वित्तीय साझेदारी',
    financeDesc: 'शादी के बाद वित्त कैसे प्रबंधित करना पसंद करेंगे?',
    finance: {
      'joint': 'संयुक्त - सब मिलाकर रखना',
      'separate': 'अलग - व्यक्तिगत खाते बनाए रखना',
      'flexible': 'लचीला/हाइब्रिड - कुछ साझा, कुछ व्यक्तिगत'
    },
    
    relocateTitle: 'स्थानांतरण इच्छा',
    relocateDesc: 'शादी के बाद जरूरत हो तो क्या आप स्थानांतरित होने को तैयार हैं?',
    relocate: {
      'willing': 'तैयार - साथी/करियर के लिए स्थानांतरित होने को तैयार',
      'prefer-not': 'पसंद नहीं - वर्तमान स्थान में रहना पसंद करूंगा',
      'not-willing': 'तैयार नहीं - स्थानांतरित नहीं हो सकता'
    },
    
    visionTitle: 'आपकी विवाह दृष्टि',
    visionDesc: 'कुछ वाक्यों में बताएं कि आप अपनी आदर्श शादी कैसी देखते हैं',
    visionPlaceholder: 'साझा करें कि आपके लिए खुशहाल शादी कैसी दिखती है...',
    visionHint: 'ईमानदार और विशिष्ट रहें - यह सच में संगत मैच खोजने में मदद करता है',
    
    completedMessage: 'बहुत बढ़िया! आपकी साथी की अपेक्षाएं सहेजी गईं।',
    completedDesc: 'यह हमें आपकी दृष्टि से मेल खाते मैच खोजने में मदद करता है।'
  }
}

const allQualities: MustHaveQuality[] = ['respectful', 'family-oriented', 'financially-responsible', 'honest', 'caring', 'ambitious', 'spiritual', 'educated', 'supportive', 'humorous', 'loyal', 'patient']
const allDealbreakers: Dealbreaker[] = ['smoking', 'drinking', 'dishonesty', 'aggression', 'irresponsibility', 'disrespectful', 'short-tempered', 'unrealistic-expectations', 'no-family-values', 'workaholic', 'controlling', 'laziness']

export function PartnerExpectations({ language, profileId, onComplete, existingData }: PartnerExpectationsProps) {
  const t = translations[language]
  const [currentStep, setCurrentStep] = useState(1)
  const totalSteps = 8
  
  // Form state
  const [mustHaveQualities, setMustHaveQualities] = useState<MustHaveQuality[]>(existingData?.mustHaveQualities || [])
  const [dealbreakers, setDealbreakers] = useState<Dealbreaker[]>(existingData?.dealbreakers || [])
  const [livingPreference, setLivingPreference] = useState<PartnerExpectationsData['livingPreference']>(existingData?.livingPreference || 'flexible')
  const [workAfterMarriage, setWorkAfterMarriage] = useState<PartnerExpectationsData['workAfterMarriage']>(existingData?.workAfterMarriage || 'flexible')
  const [childrenPreference, setChildrenPreference] = useState<PartnerExpectationsData['childrenPreference']>(existingData?.childrenPreference || 'flexible')
  const [financialPartnership, setFinancialPartnership] = useState<PartnerExpectationsData['financialPartnership']>(existingData?.financialPartnership || 'flexible')
  const [relocateWillingness, setRelocateWillingness] = useState<PartnerExpectationsData['relocateWillingness']>(existingData?.relocateWillingness || 'prefer-not')
  const [relationshipVision, setRelationshipVision] = useState<string>(existingData?.relationshipVision || '')
  
  const progress = (currentStep / totalSteps) * 100
  
  const handleQualityToggle = (quality: MustHaveQuality) => {
    if (mustHaveQualities.includes(quality)) {
      setMustHaveQualities(mustHaveQualities.filter(q => q !== quality))
    } else if (mustHaveQualities.length < 5) {
      setMustHaveQualities([...mustHaveQualities, quality])
    }
  }
  
  const handleDealbreakerToggle = (dealbreaker: Dealbreaker) => {
    if (dealbreakers.includes(dealbreaker)) {
      setDealbreakers(dealbreakers.filter(d => d !== dealbreaker))
    } else if (dealbreakers.length < 5) {
      setDealbreakers([...dealbreakers, dealbreaker])
    }
  }
  
  const canProceed = () => {
    switch (currentStep) {
      case 1: return mustHaveQualities.length >= 3
      case 2: return dealbreakers.length >= 3
      case 8: return relationshipVision.length >= 20
      default: return true
    }
  }
  
  const handleComplete = () => {
    const data: PartnerExpectationsData = {
      profileId,
      mustHaveQualities,
      dealbreakers,
      livingPreference,
      workAfterMarriage,
      childrenPreference,
      financialPartnership,
      relocateWillingness,
      relationshipVision,
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
              <Star size={24} className="text-primary" weight="fill" />
              <div>
                <h3 className="font-semibold text-lg">{t.qualitiesTitle}</h3>
                <p className="text-sm text-muted-foreground">{t.qualitiesDesc}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {allQualities.map(quality => (
                <div
                  key={quality}
                  onClick={() => handleQualityToggle(quality)}
                  className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                    mustHaveQualities.includes(quality) 
                      ? 'border-green-500 bg-green-50 dark:bg-green-950/30' 
                      : 'border-border hover:border-green-300'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Checkbox checked={mustHaveQualities.includes(quality)} />
                    <span className="text-sm">{t.qualities[quality]}</span>
                  </div>
                </div>
              ))}
            </div>
            <p className="text-sm text-muted-foreground text-center">
              {t.selectBetween} 3 {t.and} 5 ({mustHaveQualities.length}/5)
            </p>
          </div>
        )
      
      case 2:
        return (
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <Prohibit size={24} className="text-red-500" weight="fill" />
              <div>
                <h3 className="font-semibold text-lg">{t.dealbreakersTitle}</h3>
                <p className="text-sm text-muted-foreground">{t.dealbreakersDesc}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {allDealbreakers.map(dealbreaker => (
                <div
                  key={dealbreaker}
                  onClick={() => handleDealbreakerToggle(dealbreaker)}
                  className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                    dealbreakers.includes(dealbreaker) 
                      ? 'border-red-500 bg-red-50 dark:bg-red-950/30' 
                      : 'border-border hover:border-red-300'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Checkbox checked={dealbreakers.includes(dealbreaker)} />
                    <span className="text-sm">{t.dealbreakers[dealbreaker]}</span>
                  </div>
                </div>
              ))}
            </div>
            <p className="text-sm text-muted-foreground text-center">
              {t.selectBetween} 3 {t.and} 5 ({dealbreakers.length}/5)
            </p>
          </div>
        )
      
      case 3:
        return (
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <House size={24} className="text-primary" weight="fill" />
              <div>
                <h3 className="font-semibold text-lg">{t.livingTitle}</h3>
                <p className="text-sm text-muted-foreground">{t.livingDesc}</p>
              </div>
            </div>
            <RadioGroup value={livingPreference} onValueChange={(v) => setLivingPreference(v as typeof livingPreference)}>
              {(['with-parents', 'nearby-parents', 'independent', 'flexible'] as const).map(option => (
                <div key={option} className="flex items-center space-x-3 p-4 rounded-lg border hover:bg-accent cursor-pointer">
                  <RadioGroupItem value={option} id={`living-${option}`} />
                  <Label htmlFor={`living-${option}`} className="flex-1 cursor-pointer">
                    {t.living[option]}
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
              <Briefcase size={24} className="text-primary" weight="fill" />
              <div>
                <h3 className="font-semibold text-lg">{t.workTitle}</h3>
                <p className="text-sm text-muted-foreground">{t.workDesc}</p>
              </div>
            </div>
            <RadioGroup value={workAfterMarriage} onValueChange={(v) => setWorkAfterMarriage(v as typeof workAfterMarriage)}>
              {(['must-work', 'prefer-work', 'flexible', 'prefer-homemaker', 'flexible-homemaker'] as const).map(option => (
                <div key={option} className="flex items-center space-x-3 p-4 rounded-lg border hover:bg-accent cursor-pointer">
                  <RadioGroupItem value={option} id={`work-${option}`} />
                  <Label htmlFor={`work-${option}`} className="flex-1 cursor-pointer">
                    {t.work[option]}
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
              <Baby size={24} className="text-primary" weight="fill" />
              <div>
                <h3 className="font-semibold text-lg">{t.childrenTitle}</h3>
                <p className="text-sm text-muted-foreground">{t.childrenDesc}</p>
              </div>
            </div>
            <RadioGroup value={childrenPreference} onValueChange={(v) => setChildrenPreference(v as typeof childrenPreference)}>
              {(['soon', 'after-few-years', 'flexible', 'no-children'] as const).map(option => (
                <div key={option} className="flex items-center space-x-3 p-4 rounded-lg border hover:bg-accent cursor-pointer">
                  <RadioGroupItem value={option} id={`children-${option}`} />
                  <Label htmlFor={`children-${option}`} className="flex-1 cursor-pointer">
                    {t.children[option]}
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
              <CurrencyDollar size={24} className="text-primary" weight="fill" />
              <div>
                <h3 className="font-semibold text-lg">{t.financeTitle}</h3>
                <p className="text-sm text-muted-foreground">{t.financeDesc}</p>
              </div>
            </div>
            <RadioGroup value={financialPartnership} onValueChange={(v) => setFinancialPartnership(v as typeof financialPartnership)}>
              {(['joint', 'separate', 'flexible'] as const).map(option => (
                <div key={option} className="flex items-center space-x-3 p-4 rounded-lg border hover:bg-accent cursor-pointer">
                  <RadioGroupItem value={option} id={`finance-${option}`} />
                  <Label htmlFor={`finance-${option}`} className="flex-1 cursor-pointer">
                    {t.finance[option]}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>
        )
      
      case 7:
        return (
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <MapPin size={24} className="text-primary" weight="fill" />
              <div>
                <h3 className="font-semibold text-lg">{t.relocateTitle}</h3>
                <p className="text-sm text-muted-foreground">{t.relocateDesc}</p>
              </div>
            </div>
            <RadioGroup value={relocateWillingness} onValueChange={(v) => setRelocateWillingness(v as typeof relocateWillingness)}>
              {(['willing', 'prefer-not', 'not-willing'] as const).map(option => (
                <div key={option} className="flex items-center space-x-3 p-4 rounded-lg border hover:bg-accent cursor-pointer">
                  <RadioGroupItem value={option} id={`relocate-${option}`} />
                  <Label htmlFor={`relocate-${option}`} className="flex-1 cursor-pointer">
                    {t.relocate[option]}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>
        )
      
      case 8:
        return (
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <Heart size={24} className="text-primary" weight="fill" />
              <div>
                <h3 className="font-semibold text-lg">{t.visionTitle}</h3>
                <p className="text-sm text-muted-foreground">{t.visionDesc}</p>
              </div>
            </div>
            <Textarea
              value={relationshipVision}
              onChange={(e) => setRelationshipVision(e.target.value)}
              placeholder={t.visionPlaceholder}
              className="min-h-[150px]"
            />
            <p className="text-sm text-muted-foreground flex items-center gap-1">
              <Warning size={14} />
              {t.visionHint}
            </p>
            <p className="text-xs text-muted-foreground">
              {relationshipVision.length}/20 {language === 'en' ? 'characters minimum' : 'न्यूनतम अक्षर'}
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
            <Target size={24} className="text-primary" weight="fill" />
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
