import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Badge } from '@/components/ui/badge'
import { logger } from '@/lib/logger'
import { 
  Robot,
  Sparkle,
  ArrowRight,
  ArrowLeft,
  CheckCircle,
  Copy,
  PencilSimple,
  Heart,
  Star,
  Briefcase,
  GraduationCap,
  MapPin,
  MusicNote,
  Camera,
  Airplane,
  BookOpen,
  GameController,
  CookingPot,
  Barbell
} from '@phosphor-icons/react'
import type { Profile, SelfDiscoveryData, AIGeneratedBio } from '@/types/profile'
import { toast } from 'sonner'
import { generateAdvancedBio } from '@/lib/aiFoundryService'

interface AIBioAssistantProps {
  language: 'en' | 'hi'
  profile: Profile
  selfDiscoveryData?: SelfDiscoveryData | null
  existingAIBio?: AIGeneratedBio | null
  onBioGenerated: (bio: AIGeneratedBio) => void
  onUseBio: (bio: string) => void
}

const translations = {
  en: {
    title: 'AI Bio Assistant',
    subtitle: 'Let us help you write a compelling profile description',
    step: 'Step',
    of: 'of',
    next: 'Next',
    previous: 'Previous',
    generateBio: 'Generate My Bio',
    regenerate: 'Regenerate',
    useBio: 'Use This Bio',
    copyBio: 'Copy to Clipboard',
    editBio: 'Edit Before Using',
    generating: 'Creating your bio...',
    
    // Step 1: Personality style
    toneTitle: 'Choose Your Style',
    toneDesc: 'How would you like to come across in your bio?',
    tones: {
      warm: 'Warm & Friendly',
      professional: 'Professional & Polished',
      traditional: 'Traditional & Respectful',
      casual: 'Casual & Approachable'
    },
    
    // Step 2: Highlights
    highlightsTitle: 'What to Highlight?',
    highlightsDesc: 'Select aspects you want to emphasize (choose up to 5)',
    highlights: {
      career: 'Career Achievements',
      education: 'Educational Background',
      family: 'Family Values',
      hobbies: 'Hobbies & Interests',
      personality: 'Personality Traits',
      goals: 'Future Goals',
      spirituality: 'Spiritual Side',
      lifestyle: 'Lifestyle'
    },
    
    // Step 3: Hobbies detail
    hobbiesTitle: 'Your Interests',
    hobbiesDesc: 'Select your main interests to include in bio',
    hobbies: {
      travel: 'Traveling',
      reading: 'Reading',
      music: 'Music',
      cooking: 'Cooking',
      sports: 'Sports & Fitness',
      photography: 'Photography',
      movies: 'Movies & Series',
      gaming: 'Gaming',
      art: 'Art & Crafts',
      dancing: 'Dancing'
    },
    
    // Step 4: Additional info
    additionalTitle: 'Anything Special?',
    additionalDesc: 'Add any specific point you want in your bio (optional)',
    additionalPlaceholder: 'E.g., "I love weekend treks" or "Family comes first for me"',
    
    // Result
    resultTitle: 'Your AI-Generated Bio',
    resultDesc: 'Review and use this bio for your profile',
    generatedStrengths: 'Highlighted Strengths',
    generatedValues: 'Values Expressed',
    generatedHobbies: 'Interests Mentioned',
    tips: 'Tips',
    tipsList: [
      'Feel free to edit the bio to add your personal touch',
      'You can regenerate if you want a different style',
      'Authentic bios get more genuine responses'
    ]
  },
  hi: {
    title: 'AI बायो सहायक',
    subtitle: 'आपकी प्रोफ़ाइल विवरण लिखने में मदद करें',
    step: 'चरण',
    of: 'में से',
    next: 'आगे',
    previous: 'पीछे',
    generateBio: 'मेरा बायो बनाएं',
    regenerate: 'फिर से बनाएं',
    useBio: 'यह बायो उपयोग करें',
    copyBio: 'कॉपी करें',
    editBio: 'उपयोग से पहले संपादित करें',
    generating: 'आपका बायो बना रहे हैं...',
    
    toneTitle: 'अपनी शैली चुनें',
    toneDesc: 'आप अपने बायो में कैसे दिखना चाहते हैं?',
    tones: {
      warm: 'गर्मजोश और मैत्रीपूर्ण',
      professional: 'पेशेवर और परिष्कृत',
      traditional: 'पारंपरिक और सम्मानजनक',
      casual: 'आकस्मिक और सुलभ'
    },
    
    highlightsTitle: 'क्या हाइलाइट करें?',
    highlightsDesc: 'जिन पहलुओं पर जोर देना चाहते हैं उन्हें चुनें (5 तक)',
    highlights: {
      career: 'करियर उपलब्धियां',
      education: 'शैक्षिक पृष्ठभूमि',
      family: 'पारिवारिक मूल्य',
      hobbies: 'शौक और रुचियां',
      personality: 'व्यक्तित्व लक्षण',
      goals: 'भविष्य के लक्ष्य',
      spirituality: 'आध्यात्मिक पक्ष',
      lifestyle: 'जीवनशैली'
    },
    
    hobbiesTitle: 'आपकी रुचियां',
    hobbiesDesc: 'बायो में शामिल करने के लिए मुख्य रुचियां चुनें',
    hobbies: {
      travel: 'यात्रा',
      reading: 'पढ़ना',
      music: 'संगीत',
      cooking: 'खाना बनाना',
      sports: 'खेल और फिटनेस',
      photography: 'फोटोग्राफी',
      movies: 'फिल्में और सीरीज',
      gaming: 'गेमिंग',
      art: 'कला और शिल्प',
      dancing: 'नृत्य'
    },
    
    additionalTitle: 'कुछ खास?',
    additionalDesc: 'कोई विशेष बात जो आप बायो में चाहते हैं (वैकल्पिक)',
    additionalPlaceholder: 'जैसे, "मुझे सप्ताहांत ट्रेक पसंद है" या "मेरे लिए परिवार पहले है"',
    
    resultTitle: 'आपका AI-जनित बायो',
    resultDesc: 'समीक्षा करें और इस बायो को अपनी प्रोफ़ाइल के लिए उपयोग करें',
    generatedStrengths: 'हाइलाइट की गई ताकत',
    generatedValues: 'व्यक्त किए गए मूल्य',
    generatedHobbies: 'उल्लेखित रुचियां',
    tips: 'सुझाव',
    tipsList: [
      'अपना व्यक्तिगत स्पर्श जोड़ने के लिए बायो संपादित करें',
      'अलग शैली चाहते हैं तो फिर से बना सकते हैं',
      'प्रामाणिक बायो को अधिक सच्ची प्रतिक्रियाएं मिलती हैं'
    ]
  }
}

type BioTone = 'warm' | 'professional' | 'traditional' | 'casual'
type Highlight = 'career' | 'education' | 'family' | 'hobbies' | 'personality' | 'goals' | 'spirituality' | 'lifestyle'
type Hobby = 'travel' | 'reading' | 'music' | 'cooking' | 'sports' | 'photography' | 'movies' | 'gaming' | 'art' | 'dancing'

const hobbyIcons: Record<Hobby, React.ReactNode> = {
  travel: <Airplane size={16} />,
  reading: <BookOpen size={16} />,
  music: <MusicNote size={16} />,
  cooking: <CookingPot size={16} />,
  sports: <Barbell size={16} />,
  photography: <Camera size={16} />,
  movies: <Star size={16} />,
  gaming: <GameController size={16} />,
  art: <PencilSimple size={16} />,
  dancing: <Heart size={16} />
}

export function AIBioAssistant({ language, profile, selfDiscoveryData, existingAIBio, onBioGenerated, onUseBio }: AIBioAssistantProps) {
  const t = translations[language]
  const [currentStep, setCurrentStep] = useState(1)
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedBio, setGeneratedBio] = useState<AIGeneratedBio | null>(existingAIBio || null)
  const [isEditing, setIsEditing] = useState(false)
  const [editedBio, setEditedBio] = useState('')
  
  // Form state
  const [tone, setTone] = useState<BioTone>('warm')
  const [highlights, setHighlights] = useState<Highlight[]>(['career', 'family', 'hobbies'])
  const [selectedHobbies, setSelectedHobbies] = useState<Hobby[]>(['travel', 'music', 'reading'])
  const [additionalInfo, setAdditionalInfo] = useState('')
  
  const totalSteps = 4
  
  const handleHighlightToggle = (highlight: Highlight) => {
    if (highlights.includes(highlight)) {
      setHighlights(highlights.filter(h => h !== highlight))
    } else if (highlights.length < 5) {
      setHighlights([...highlights, highlight])
    }
  }
  
  const handleHobbyToggle = (hobby: Hobby) => {
    if (selectedHobbies.includes(hobby)) {
      setSelectedHobbies(selectedHobbies.filter(h => h !== hobby))
    } else if (selectedHobbies.length < 5) {
      setSelectedHobbies([...selectedHobbies, hobby])
    }
  }
  
  const generateBio = async () => {
    setIsGenerating(true)
    
    try {
      // Call Azure OpenAI via aiFoundryService
      const result = await generateAdvancedBio({
        profile,
        tone,
        highlights,
        hobbies: selectedHobbies,
        additionalInfo,
        selfDiscoveryData: selfDiscoveryData || undefined,
        language
      })
      
      if (result.success && result.bio) {
        const bio: AIGeneratedBio = {
          profileId: profile.profileId,
          generatedBio: result.bio,
          generatedStrengths: highlights.filter(h => ['career', 'education', 'personality'].includes(h))
            .map(h => t.highlights[h as Highlight]),
          generatedValues: highlights.filter(h => ['family', 'spirituality', 'lifestyle', 'goals'].includes(h))
            .map(h => t.highlights[h as Highlight]),
          generatedHobbies: selectedHobbies.map(h => t.hobbies[h]),
          isUsed: false,
          generatedAt: new Date().toISOString()
        }
        setGeneratedBio(bio)
        onBioGenerated(bio)
        toast.success(language === 'en' ? 'Bio generated successfully!' : 'बायो सफलतापूर्वक बनाया गया!')
      } else {
        // Fallback to local generation
        const bio = createLocalBio()
        setGeneratedBio(bio)
        onBioGenerated(bio)
        toast.info(language === 'en' ? 'Bio generated (offline mode)' : 'बायो बनाया गया (ऑफलाइन मोड)')
      }
    } catch (error) {
      logger.error('Bio generation error:', error)
      // Fallback to local generation
      const bio = createLocalBio()
      setGeneratedBio(bio)
      onBioGenerated(bio)
      toast.info(language === 'en' ? 'Bio generated (offline mode)' : 'बायो बनाया गया (ऑफलाइन मोड)')
    } finally {
      setIsGenerating(false)
    }
  }
  
  const createLocalBio = (): AIGeneratedBio => {
    // Build bio based on selections and profile data
    const toneIntros: Record<BioTone, { en: string; hi: string }> = {
      warm: {
        en: `Hello! I'm ${profile.firstName}, a ${profile.occupation} based in ${profile.location}.`,
        hi: `नमस्ते! मैं ${profile.firstName} हूं, ${profile.location} में ${profile.occupation}।`
      },
      professional: {
        en: `I am ${profile.firstName}, a dedicated ${profile.occupation} residing in ${profile.location}.`,
        hi: `मैं ${profile.firstName} हूं, ${profile.location} में रहने वाला समर्पित ${profile.occupation}।`
      },
      traditional: {
        en: `Namaste! I am ${profile.firstName} from ${profile.location}, working as a ${profile.occupation}.`,
        hi: `नमस्ते! मैं ${profile.location} से ${profile.firstName} हूं, ${profile.occupation} के रूप में कार्यरत।`
      },
      casual: {
        en: `Hey there! I'm ${profile.firstName}, ${profile.occupation} from ${profile.location}.`,
        hi: `नमस्ते! मैं ${profile.firstName}, ${profile.location} से ${profile.occupation}।`
      }
    }
    
    let bioText = language === 'en' ? toneIntros[tone].en : toneIntros[tone].hi
    
    // Add education if highlighted
    if (highlights.includes('education') && profile.education) {
      bioText += language === 'en' 
        ? ` I completed my ${profile.education} and believe in continuous learning.`
        : ` मैंने ${profile.education} की शिक्षा प्राप्त की है और निरंतर सीखने में विश्वास करता हूं।`
    }
    
    // Add family values if highlighted
    if (highlights.includes('family')) {
      bioText += language === 'en'
        ? ` Family is at the center of my life, and I believe in maintaining strong bonds with loved ones.`
        : ` परिवार मेरे जीवन के केंद्र में है, और मैं प्रियजनों के साथ मजबूत बंधन बनाए रखने में विश्वास करता हूं।`
    }
    
    // Add hobbies
    if (highlights.includes('hobbies') && selectedHobbies.length > 0) {
      const hobbyNames = selectedHobbies.map(h => t.hobbies[h]).join(', ')
      bioText += language === 'en'
        ? ` In my free time, I enjoy ${hobbyNames}.`
        : ` अपने खाली समय में, मुझे ${hobbyNames} पसंद है।`
    }
    
    // Add personality based on self-discovery data
    if (highlights.includes('personality') && selfDiscoveryData) {
      const personality = selfDiscoveryData.personalityType
      const personalityText: Record<string, { en: string; hi: string }> = {
        introvert: { en: 'thoughtful and introspective', hi: 'विचारशील और आत्मनिरीक्षक' },
        balanced: { en: 'balanced and adaptable', hi: 'संतुलित और अनुकूलनशील' },
        extrovert: { en: 'sociable and energetic', hi: 'मिलनसार और ऊर्जावान' }
      }
      bioText += language === 'en'
        ? ` I consider myself ${personalityText[personality]?.en || 'balanced'}.`
        : ` मैं खुद को ${personalityText[personality]?.hi || 'संतुलित'} मानता हूं।`
    }
    
    // Add goals
    if (highlights.includes('goals')) {
      bioText += language === 'en'
        ? ` Looking forward to finding a partner to build a meaningful life together based on mutual respect and understanding.`
        : ` आपसी सम्मान और समझ के आधार पर एक साथ सार्थक जीवन बनाने के लिए एक साथी खोजने की उम्मीद है।`
    }
    
    // Add additional info
    if (additionalInfo) {
      bioText += ` ${additionalInfo}`
    }
    
    // Extract strengths and values for display
    const strengths = highlights.filter(h => ['career', 'education', 'personality'].includes(h))
      .map(h => t.highlights[h])
    const values = highlights.filter(h => ['family', 'spirituality', 'lifestyle'].includes(h))
      .map(h => t.highlights[h])
    
    return {
      profileId: profile.profileId,
      generatedBio: bioText,
      generatedStrengths: strengths,
      generatedValues: values,
      generatedHobbies: selectedHobbies.map(h => t.hobbies[h]),
      isUsed: false,
      generatedAt: new Date().toISOString()
    }
  }
  
  const handleCopyBio = () => {
    if (generatedBio) {
      navigator.clipboard.writeText(generatedBio.generatedBio)
      toast.success(language === 'en' ? 'Bio copied to clipboard!' : 'बायो कॉपी किया गया!')
    }
  }
  
  const handleUseBio = () => {
    const bioToUse = isEditing ? editedBio : generatedBio?.generatedBio
    if (bioToUse) {
      onUseBio(bioToUse)
      toast.success(language === 'en' ? 'Bio updated successfully!' : 'बायो सफलतापूर्वक अपडेट किया गया!')
    }
  }
  
  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <Sparkle size={24} className="text-primary" weight="fill" />
              <div>
                <h3 className="font-semibold text-lg">{t.toneTitle}</h3>
                <p className="text-sm text-muted-foreground">{t.toneDesc}</p>
              </div>
            </div>
            <RadioGroup value={tone} onValueChange={(v) => setTone(v as BioTone)}>
              {(['warm', 'professional', 'traditional', 'casual'] as const).map(t_tone => (
                <div key={t_tone} className="flex items-center space-x-3 p-4 rounded-lg border hover:bg-accent cursor-pointer">
                  <RadioGroupItem value={t_tone} id={`tone-${t_tone}`} />
                  <Label htmlFor={`tone-${t_tone}`} className="flex-1 cursor-pointer">
                    {t.tones[t_tone]}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>
        )
      
      case 2:
        return (
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <Star size={24} className="text-primary" weight="fill" />
              <div>
                <h3 className="font-semibold text-lg">{t.highlightsTitle}</h3>
                <p className="text-sm text-muted-foreground">{t.highlightsDesc}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {(['career', 'education', 'family', 'hobbies', 'personality', 'goals', 'spirituality', 'lifestyle'] as Highlight[]).map(highlight => (
                <div
                  key={highlight}
                  onClick={() => handleHighlightToggle(highlight)}
                  className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                    highlights.includes(highlight) 
                      ? 'border-primary bg-primary/10' 
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {highlight === 'career' && <Briefcase size={16} />}
                    {highlight === 'education' && <GraduationCap size={16} />}
                    {highlight === 'family' && <Heart size={16} />}
                    {highlight === 'hobbies' && <Star size={16} />}
                    {highlight === 'personality' && <Sparkle size={16} />}
                    {highlight === 'goals' && <MapPin size={16} />}
                    <span className="text-sm">{t.highlights[highlight]}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )
      
      case 3:
        return (
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <Heart size={24} className="text-primary" weight="fill" />
              <div>
                <h3 className="font-semibold text-lg">{t.hobbiesTitle}</h3>
                <p className="text-sm text-muted-foreground">{t.hobbiesDesc}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {(['travel', 'reading', 'music', 'cooking', 'sports', 'photography', 'movies', 'gaming', 'art', 'dancing'] as Hobby[]).map(hobby => (
                <div
                  key={hobby}
                  onClick={() => handleHobbyToggle(hobby)}
                  className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                    selectedHobbies.includes(hobby) 
                      ? 'border-primary bg-primary/10' 
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {hobbyIcons[hobby]}
                    <span className="text-sm">{t.hobbies[hobby]}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )
      
      case 4:
        return (
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <PencilSimple size={24} className="text-primary" weight="fill" />
              <div>
                <h3 className="font-semibold text-lg">{t.additionalTitle}</h3>
                <p className="text-sm text-muted-foreground">{t.additionalDesc}</p>
              </div>
            </div>
            <Textarea
              value={additionalInfo}
              onChange={(e) => setAdditionalInfo(e.target.value)}
              placeholder={t.additionalPlaceholder}
              className="min-h-[100px]"
            />
          </div>
        )
      
      default:
        return null
    }
  }
  
  const renderResult = () => {
    if (!generatedBio) return null
    
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2 mb-4">
          <Robot size={24} className="text-primary" weight="fill" />
          <div>
            <h3 className="font-semibold text-lg">{t.resultTitle}</h3>
            <p className="text-sm text-muted-foreground">{t.resultDesc}</p>
          </div>
        </div>
        
        <Card>
          <CardContent className="p-4">
            {isEditing ? (
              <Textarea
                value={editedBio}
                onChange={(e) => setEditedBio(e.target.value)}
                className="min-h-[150px]"
              />
            ) : (
              <p className="text-sm leading-relaxed">{generatedBio.generatedBio}</p>
            )}
          </CardContent>
        </Card>
        
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={handleCopyBio}>
            <Copy size={14} className="mr-1" />
            {t.copyBio}
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => {
              setIsEditing(!isEditing)
              if (!isEditing) setEditedBio(generatedBio.generatedBio)
            }}
          >
            <PencilSimple size={14} className="mr-1" />
            {t.editBio}
          </Button>
          <Button variant="outline" size="sm" onClick={generateBio}>
            <Sparkle size={14} className="mr-1" />
            {t.regenerate}
          </Button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
          {generatedBio.generatedStrengths.length > 0 && (
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-2">{t.generatedStrengths}</p>
              <div className="flex flex-wrap gap-1">
                {generatedBio.generatedStrengths.map((s, i) => (
                  <Badge key={i} variant="outline" className="text-xs">{s}</Badge>
                ))}
              </div>
            </div>
          )}
          {generatedBio.generatedValues.length > 0 && (
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-2">{t.generatedValues}</p>
              <div className="flex flex-wrap gap-1">
                {generatedBio.generatedValues.map((v, i) => (
                  <Badge key={i} variant="outline" className="text-xs">{v}</Badge>
                ))}
              </div>
            </div>
          )}
          {generatedBio.generatedHobbies.length > 0 && (
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-2">{t.generatedHobbies}</p>
              <div className="flex flex-wrap gap-1">
                {generatedBio.generatedHobbies.map((h, i) => (
                  <Badge key={i} variant="outline" className="text-xs">{h}</Badge>
                ))}
              </div>
            </div>
          )}
        </div>
        
        <Button onClick={handleUseBio} className="w-full bg-green-600 hover:bg-green-700">
          <CheckCircle size={16} className="mr-2" />
          {t.useBio}
        </Button>
      </div>
    )
  }
  
  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-full">
            <Robot size={24} className="text-primary" weight="fill" />
          </div>
          <div>
            <CardTitle>{t.title}</CardTitle>
            <CardDescription>{t.subtitle}</CardDescription>
          </div>
        </div>
        {!generatedBio && (
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>{t.step} {currentStep} {t.of} {totalSteps}</span>
          </div>
        )}
      </CardHeader>
      
      <CardContent>
        {isGenerating ? (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4" />
            <p className="text-muted-foreground">{t.generating}</p>
          </div>
        ) : generatedBio ? (
          renderResult()
        ) : (
          <>
            {renderStep()}
            
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
                <Button onClick={() => setCurrentStep(s => s + 1)}>
                  {t.next}
                  <ArrowRight size={16} className="ml-2" />
                </Button>
              ) : (
                <Button onClick={generateBio} className="bg-primary">
                  <Sparkle size={16} className="mr-2" />
                  {t.generateBio}
                </Button>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
