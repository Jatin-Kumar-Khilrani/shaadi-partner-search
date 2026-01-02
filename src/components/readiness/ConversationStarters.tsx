import { useState, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Chat,
  Lightbulb,
  Heart,
  Users,
  Briefcase,
  Sparkle,
  Copy,
  Star,
  Lightning,
  BookOpen
} from '@phosphor-icons/react'
import { toast } from 'sonner'
import type { Profile, SelfDiscoveryData, PartnerExpectationsData } from '@/types/profile'

interface ConversationStartersProps {
  language: 'en' | 'hi'
  myProfile: Profile
  targetProfile?: Profile
  selfDiscoveryData?: SelfDiscoveryData | null
  expectationsData?: PartnerExpectationsData | null
}

interface StarterMessage {
  id: string
  category: 'icebreaker' | 'values' | 'family' | 'career' | 'lifestyle' | 'future' | 'deep'
  textEn: string
  textHi: string
  context?: string
  personalizedFor?: string[]
}

const translations = {
  en: {
    title: 'Smart Conversation Starters',
    subtitle: 'Context-aware messages based on profiles',
    categories: {
      icebreaker: 'Ice Breakers',
      values: 'Values & Beliefs',
      family: 'Family & Background',
      career: 'Career & Ambitions',
      lifestyle: 'Lifestyle & Hobbies',
      future: 'Future & Goals',
      deep: 'Deep Questions'
    },
    tabs: {
      suggested: 'Suggested for You',
      all: 'All Starters',
      custom: 'Based on Profile'
    },
    copy: 'Copy',
    copied: 'Copied!',
    useThis: 'Use This',
    refresh: 'Refresh',
    basedOn: 'Based on:',
    personalized: 'Personalized',
    noProfile: 'Select a profile to see personalized suggestions',
    tipsTitle: 'Conversation Tips',
    tips: [
      'Start with genuine curiosity, not just small talk',
      'Reference something specific from their profile',
      'Ask open-ended questions that invite stories',
      'Share a bit about yourself too - conversation is two-way',
      'Listen more than you speak initially'
    ]
  },
  hi: {
    title: 'स्मार्ट बातचीत शुरुआत',
    subtitle: 'प्रोफ़ाइल के आधार पर संदर्भ-जागरूक संदेश',
    categories: {
      icebreaker: 'बर्फ तोड़ने वाले',
      values: 'मूल्य और विश्वास',
      family: 'परिवार और पृष्ठभूमि',
      career: 'करियर और महत्वाकांक्षाएं',
      lifestyle: 'जीवनशैली और शौक',
      future: 'भविष्य और लक्ष्य',
      deep: 'गहरे प्रश्न'
    },
    tabs: {
      suggested: 'आपके लिए सुझाए गए',
      all: 'सभी स्टार्टर्स',
      custom: 'प्रोफ़ाइल के आधार पर'
    },
    copy: 'कॉपी',
    copied: 'कॉपी हो गया!',
    useThis: 'इसे उपयोग करें',
    refresh: 'रिफ्रेश',
    basedOn: 'आधारित:',
    personalized: 'व्यक्तिगत',
    noProfile: 'व्यक्तिगत सुझाव देखने के लिए एक प्रोफ़ाइल चुनें',
    tipsTitle: 'बातचीत के टिप्स',
    tips: [
      'सच्ची जिज्ञासा से शुरू करें, न कि सिर्फ छोटी बात से',
      'उनकी प्रोफ़ाइल से कुछ विशिष्ट का उल्लेख करें',
      'खुले प्रश्न पूछें जो कहानियों को आमंत्रित करते हैं',
      'अपने बारे में भी कुछ बताएं - बातचीत दो-तरफा है',
      'शुरू में बोलने से ज्यादा सुनें'
    ]
  }
}

// Base conversation starters
const baseStarters: StarterMessage[] = [
  // Ice Breakers
  {
    id: 'ice-1',
    category: 'icebreaker',
    textEn: "Hi! I noticed we both seem to value [value]. I'd love to hear what drew you to that. What's your story?",
    textHi: "नमस्ते! मैंने देखा कि हम दोनों [value] को महत्व देते हैं। मुझे जानना अच्छा लगेगा कि आप इसकी ओर कैसे आकर्षित हुए। आपकी कहानी क्या है?"
  },
  {
    id: 'ice-2',
    category: 'icebreaker',
    textEn: "Hello! Your profile caught my attention. What made you decide to try this platform for finding a life partner?",
    textHi: "नमस्ते! आपकी प्रोफ़ाइल ने मेरा ध्यान आकर्षित किया। जीवन साथी खोजने के लिए इस प्लेटफॉर्म को आज़माने का फैसला किसने किया?"
  },
  {
    id: 'ice-3',
    category: 'icebreaker',
    textEn: "Hi there! If you could have dinner with anyone, living or historical, who would it be and why?",
    textHi: "नमस्ते! अगर आप किसी के साथ भी रात का खाना खा सकते, जीवित या ऐतिहासिक, वह कौन होगा और क्यों?"
  },
  
  // Values & Beliefs
  {
    id: 'values-1',
    category: 'values',
    textEn: "I believe that shared values are the foundation of a strong relationship. What values are non-negotiable for you in a partner?",
    textHi: "मेरा मानना है कि साझा मूल्य एक मजबूत रिश्ते की नींव हैं। साथी में आपके लिए कौन से मूल्य गैर-समझौता योग्य हैं?"
  },
  {
    id: 'values-2',
    category: 'values',
    textEn: "What role does faith or spirituality play in your daily life? I find this often shapes how we see the world.",
    textHi: "आपके दैनिक जीवन में आस्था या आध्यात्मिकता की क्या भूमिका है? मुझे लगता है कि यह अक्सर हमारे दुनिया को देखने के तरीके को आकार देता है।"
  },
  {
    id: 'values-3',
    category: 'values',
    textEn: "How do you handle disagreements with people close to you? I think conflict resolution style says a lot about compatibility.",
    textHi: "आप अपने करीबी लोगों के साथ असहमति को कैसे संभालते हैं? मुझे लगता है कि संघर्ष समाधान शैली संगतता के बारे में बहुत कुछ कहती है।"
  },
  
  // Family & Background
  {
    id: 'family-1',
    category: 'family',
    textEn: "Family seems important to you from your profile. What's the best piece of advice your parents have given you?",
    textHi: "आपकी प्रोफ़ाइल से लगता है कि परिवार आपके लिए महत्वपूर्ण है। आपके माता-पिता ने आपको सबसे अच्छी सलाह क्या दी है?"
  },
  {
    id: 'family-2',
    category: 'family',
    textEn: "What family traditions are important to you that you'd want to continue in your own family?",
    textHi: "कौन सी पारिवारिक परंपराएं आपके लिए महत्वपूर्ण हैं जिन्हें आप अपने परिवार में जारी रखना चाहेंगे?"
  },
  {
    id: 'family-3',
    category: 'family',
    textEn: "How close are you to your extended family? I'm curious about how you see the role of in-laws in married life.",
    textHi: "आप अपने विस्तारित परिवार के कितने करीब हैं? मैं जानना चाहता/चाहती हूं कि आप विवाहित जीवन में ससुराल की भूमिका को कैसे देखते हैं।"
  },
  
  // Career & Ambitions
  {
    id: 'career-1',
    category: 'career',
    textEn: "What drives you in your career? I'm always curious about what motivates people professionally.",
    textHi: "आपके करियर में आपको क्या प्रेरित करता है? मैं हमेशा जानने को उत्सुक रहता/रहती हूं कि लोगों को पेशेवर रूप से क्या प्रेरित करता है।"
  },
  {
    id: 'career-2',
    category: 'career',
    textEn: "How do you balance work and personal life? It's something I think about a lot for married life.",
    textHi: "आप काम और निजी जीवन में कैसे संतुलन बनाते हैं? यह कुछ है जिसके बारे में मैं विवाहित जीवन के लिए बहुत सोचता/सोचती हूं।"
  },
  {
    id: 'career-3',
    category: 'career',
    textEn: "Where do you see yourself professionally in 5 years? I find career goals often shape life decisions.",
    textHi: "5 साल में आप खुद को पेशेवर रूप से कहां देखते हैं? मुझे लगता है करियर के लक्ष्य अक्सर जीवन के फैसलों को आकार देते हैं।"
  },
  
  // Lifestyle & Hobbies
  {
    id: 'lifestyle-1',
    category: 'lifestyle',
    textEn: "What does a perfect weekend look like for you? I'm curious how we might spend weekends together.",
    textHi: "आपके लिए एक आदर्श सप्ताहांत कैसा दिखता है? मैं जानना चाहता/चाहती हूं कि हम एक साथ सप्ताहांत कैसे बिता सकते हैं।"
  },
  {
    id: 'lifestyle-2',
    category: 'lifestyle',
    textEn: "I noticed you're into [hobby]. How did you get started with that? I'd love to hear the story.",
    textHi: "मैंने देखा आप [hobby] में रुचि रखते हैं। आपने यह कैसे शुरू किया? मुझे कहानी सुनना अच्छा लगेगा।"
  },
  {
    id: 'lifestyle-3',
    category: 'lifestyle',
    textEn: "Are you more of a morning person or a night owl? I think daily rhythms matter in shared life.",
    textHi: "आप सुबह के व्यक्ति हैं या रात के उल्लू? मुझे लगता है दैनिक लय साझा जीवन में मायने रखती है।"
  },
  
  // Future & Goals
  {
    id: 'future-1',
    category: 'future',
    textEn: "What does your ideal life look like 10 years from now? I think shared vision is important for couples.",
    textHi: "10 साल बाद आपका आदर्श जीवन कैसा दिखता है? मुझे लगता है जोड़ों के लिए साझा दृष्टि महत्वपूर्ण है।"
  },
  {
    id: 'future-2',
    category: 'future',
    textEn: "How do you think about settling down - same city, or are you open to moving for the right reasons?",
    textHi: "आप बसने के बारे में कैसे सोचते हैं - उसी शहर में, या सही कारणों से स्थानांतरित होने के लिए तैयार हैं?"
  },
  {
    id: 'future-3',
    category: 'future',
    textEn: "What are your thoughts on having children? I believe it's important to discuss early.",
    textHi: "बच्चे होने के बारे में आपके क्या विचार हैं? मेरा मानना है कि जल्दी चर्चा करना महत्वपूर्ण है।"
  },
  
  // Deep Questions
  {
    id: 'deep-1',
    category: 'deep',
    textEn: "What's the most important lesson life has taught you so far? I find these shape who we become as partners.",
    textHi: "जीवन ने अब तक आपको सबसे महत्वपूर्ण सबक क्या सिखाया है? मुझे लगता है ये आकार देते हैं कि हम साथी के रूप में कौन बनते हैं।"
  },
  {
    id: 'deep-2',
    category: 'deep',
    textEn: "What does love mean to you? Everyone has a different definition and I'd love to understand yours.",
    textHi: "प्यार का आपके लिए क्या मतलब है? हर किसी की अलग परिभाषा होती है और मैं आपकी समझना चाहता/चाहती हूं।"
  },
  {
    id: 'deep-3',
    category: 'deep',
    textEn: "What's something you're working on improving about yourself? I believe growth mindset matters in relationships.",
    textHi: "आप अपने बारे में क्या सुधारने पर काम कर रहे हैं? मेरा मानना है कि रिश्तों में विकास की मानसिकता मायने रखती है।"
  }
]

export function ConversationStarters({ 
  language, 
  myProfile, 
  targetProfile,
  selfDiscoveryData,
  expectationsData 
}: ConversationStartersProps) {
  const t = translations[language]
  
  const [activeTab, setActiveTab] = useState('suggested')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [copiedId, setCopiedId] = useState<string | null>(null)
  
  // Generate personalized starters based on profiles
  const personalizedStarters = useMemo(() => {
    const starters: StarterMessage[] = []
    
    if (targetProfile) {
      // Based on shared interests
      if (myProfile.hobbies && myProfile.hobbies.length > 0 && targetProfile.hobbies && targetProfile.hobbies.length > 0) {
        const sharedHobbies = myProfile.hobbies.filter(h => 
          targetProfile.hobbies?.includes(h)
        )
        if (sharedHobbies.length > 0) {
          starters.push({
            id: 'personal-hobby-1',
            category: 'lifestyle',
            textEn: `I noticed we both enjoy ${sharedHobbies[0]}! What got you into it? I'd love to hear your experience.`,
            textHi: `मैंने देखा कि हम दोनों ${sharedHobbies[0]} का आनंद लेते हैं! आप इसमें कैसे आए? मुझे आपका अनुभव सुनना अच्छा लगेगा।`,
            personalizedFor: ['shared-hobby']
          })
        }
      }
      
      // Based on profession
      if (targetProfile.occupation) {
        starters.push({
          id: 'personal-career-1',
          category: 'career',
          textEn: `I see you work as a ${targetProfile.occupation}. That sounds interesting! What do you enjoy most about your work?`,
          textHi: `मैंने देखा आप ${targetProfile.occupation} के रूप में काम करते हैं। यह दिलचस्प लगता है! आपको अपने काम में सबसे ज्यादा क्या पसंद है?`,
          personalizedFor: ['profession']
        })
      }
      
      // Based on education
      if (targetProfile.education) {
        starters.push({
          id: 'personal-edu-1',
          category: 'career',
          textEn: `I noticed you studied ${targetProfile.education}. What inspired you to choose that field?`,
          textHi: `मैंने देखा आपने ${targetProfile.education} की पढ़ाई की। आपको उस क्षेत्र को चुनने की प्रेरणा कहां से मिली?`,
          personalizedFor: ['education']
        })
      }
      
      // Based on city/location
      const targetCity = targetProfile.city || targetProfile.location
      if (targetCity) {
        starters.push({
          id: 'personal-city-1',
          category: 'lifestyle',
          textEn: `${targetCity} is such a great city! What's your favorite thing about living there?`,
          textHi: `${targetCity} एक बहुत अच्छा शहर है! वहां रहने के बारे में आपकी सबसे पसंदीदा बात क्या है?`,
          personalizedFor: ['location']
        })
      }
    }
    
    // Based on my self-discovery data
    if (selfDiscoveryData) {
      // Use topValues (which is always present) or coreValues if available
      const values = selfDiscoveryData.coreValues || selfDiscoveryData.topValues
      if (values && values.length > 0) {
        starters.push({
          id: 'personal-values-1',
          category: 'values',
          textEn: `I value ${values.slice(0, 2).join(' and ')} a lot. What values do you hold closest to your heart?`,
          textHi: `मैं ${values.slice(0, 2).join(' और ')} को बहुत महत्व देता/देती हूं। आप किन मूल्यों को अपने दिल के सबसे करीब रखते हैं?`,
          personalizedFor: ['my-values']
        })
      }
    }
    
    // Based on my expectations data
    if (expectationsData) {
      if (expectationsData.relationshipVision) {
        starters.push({
          id: 'personal-vision-1',
          category: 'future',
          textEn: "I've been thinking about what kind of partnership I want. What's your vision for an ideal relationship?",
          textHi: "मैं सोच रहा/रही हूं कि मुझे किस तरह की साझेदारी चाहिए। आदर्श रिश्ते के लिए आपकी क्या दृष्टि है?",
          personalizedFor: ['my-vision']
        })
      }
    }
    
    return starters
  }, [myProfile, targetProfile, selfDiscoveryData, expectationsData])
  
  const filteredStarters = useMemo(() => {
    const allStarters = [...personalizedStarters, ...baseStarters]
    if (selectedCategory === 'all') return allStarters
    return allStarters.filter(s => s.category === selectedCategory)
  }, [personalizedStarters, selectedCategory])
  
  const handleCopy = (starter: StarterMessage) => {
    const text = language === 'en' ? starter.textEn : starter.textHi
    navigator.clipboard.writeText(text)
    setCopiedId(starter.id)
    toast.success(t.copied)
    setTimeout(() => setCopiedId(null), 2000)
  }
  
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'icebreaker': return <Chat size={16} />
      case 'values': return <Star size={16} />
      case 'family': return <Users size={16} />
      case 'career': return <Briefcase size={16} />
      case 'lifestyle': return <Lightning size={16} />
      case 'future': return <Sparkle size={16} />
      case 'deep': return <Heart size={16} />
      default: return <Lightbulb size={16} />
    }
  }
  
  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'icebreaker': return 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
      case 'values': return 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300'
      case 'family': return 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
      case 'career': return 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300'
      case 'lifestyle': return 'bg-pink-100 text-pink-700 dark:bg-pink-900 dark:text-pink-300'
      case 'future': return 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900 dark:text-cyan-300'
      case 'deep': return 'bg-rose-100 text-rose-700 dark:bg-rose-900 dark:text-rose-300'
      default: return 'bg-gray-100 text-gray-700'
    }
  }
  
  const renderStarter = (starter: StarterMessage) => (
    <Card key={starter.id} className="mb-3 hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Badge className={`text-xs ${getCategoryColor(starter.category)}`}>
                {getCategoryIcon(starter.category)}
                <span className="ml-1">{t.categories[starter.category]}</span>
              </Badge>
              {starter.personalizedFor && (
                <Badge variant="outline" className="text-xs text-primary">
                  <Sparkle size={12} className="mr-1" />
                  {t.personalized}
                </Badge>
              )}
            </div>
            <p className="text-sm leading-relaxed">
              {language === 'en' ? starter.textEn : starter.textHi}
            </p>
          </div>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => handleCopy(starter)}
            className="shrink-0"
          >
            <Copy size={16} className={copiedId === starter.id ? 'text-green-500' : ''} />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
  
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 bg-primary/10 rounded-full">
          <Chat size={24} className="text-primary" weight="fill" />
        </div>
        <div>
          <h3 className="text-lg font-semibold">{t.title}</h3>
          <p className="text-sm text-muted-foreground">{t.subtitle}</p>
        </div>
      </div>
      
      {/* Category Filter */}
      <ScrollArea className="w-full">
        <div className="flex gap-2 pb-2">
          <Badge 
            variant={selectedCategory === 'all' ? 'default' : 'outline'}
            className="cursor-pointer hover:bg-primary/80"
            onClick={() => setSelectedCategory('all')}
          >
            All
          </Badge>
          {Object.entries(t.categories).map(([key, label]) => (
            <Badge
              key={key}
              variant={selectedCategory === key ? 'default' : 'outline'}
              className={`cursor-pointer whitespace-nowrap ${selectedCategory === key ? '' : getCategoryColor(key)}`}
              onClick={() => setSelectedCategory(key)}
            >
              {getCategoryIcon(key)}
              <span className="ml-1">{label}</span>
            </Badge>
          ))}
        </div>
      </ScrollArea>
      
      {/* Starters */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full justify-start">
          <TabsTrigger value="suggested">{t.tabs.suggested}</TabsTrigger>
          <TabsTrigger value="all">{t.tabs.all}</TabsTrigger>
        </TabsList>
        
        <TabsContent value="suggested" className="mt-4">
          {personalizedStarters.length > 0 ? (
            <ScrollArea className="h-[400px]">
              {personalizedStarters.map(renderStarter)}
            </ScrollArea>
          ) : (
            <Card>
              <CardContent className="py-8 text-center">
                <Lightbulb size={48} className="mx-auto text-muted-foreground mb-3" />
                <p className="text-muted-foreground">{t.noProfile}</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
        
        <TabsContent value="all" className="mt-4">
          <ScrollArea className="h-[400px]">
            {filteredStarters.map(renderStarter)}
          </ScrollArea>
        </TabsContent>
      </Tabs>
      
      {/* Tips */}
      <Card className="bg-muted/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <BookOpen size={16} />
            {t.tipsTitle}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-1">
            {t.tips.map((tip, i) => (
              <li key={i} className="text-xs text-muted-foreground flex items-start gap-2">
                <Sparkle size={12} className="text-primary mt-0.5" weight="fill" />
                {tip}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}
