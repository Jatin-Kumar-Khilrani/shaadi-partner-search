import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import { 
  Brain, 
  Heart, 
  Smiley,
  SmileyMeh,
  SmileyNervous,
  SmileySad,
  SmileyXEyes,
  ArrowRight,
  ArrowLeft,
  CheckCircle,
  Handshake,
  ShieldCheck,
  Scales,
  Lightbulb
} from '@phosphor-icons/react'
import type { EQAssessmentData, EQLevel } from '@/types/profile'

interface EQAssessmentProps {
  language: 'en' | 'hi'
  onComplete: (data: EQAssessmentData) => void
  existingData?: EQAssessmentData | null
}

const translations = {
  en: {
    title: 'Emotional Intelligence Assessment',
    subtitle: 'Understanding your emotional maturity helps build stronger relationships',
    step: 'Step',
    of: 'of',
    next: 'Next',
    previous: 'Previous',
    complete: 'See My Results',
    
    // Scenarios
    scenarios: [
      {
        title: 'Handling Disagreements',
        icon: 'handshake',
        question: 'When your partner disagrees with something important to you, how do you typically respond?',
        options: [
          { value: 1, text: 'I get upset and may raise my voice or shut down completely' },
          { value: 2, text: 'I feel frustrated but try to explain my point repeatedly' },
          { value: 3, text: 'I take a moment to calm down, then try to understand their view' },
          { value: 4, text: 'I listen first, acknowledge their perspective, then share mine calmly' },
          { value: 5, text: 'I see disagreements as opportunities to understand each other better' }
        ]
      },
      {
        title: 'Understanding Others\' Feelings',
        icon: 'heart',
        question: 'When someone close to you seems upset but hasn\'t said why, what do you do?',
        options: [
          { value: 1, text: 'I don\'t notice or prefer not to get involved' },
          { value: 2, text: 'I notice but wait for them to bring it up' },
          { value: 3, text: 'I ask if they\'re okay and offer to listen' },
          { value: 4, text: 'I gently check in and give them space if needed' },
          { value: 5, text: 'I can often sense what\'s wrong and know how to support them' }
        ]
      },
      {
        title: 'Self-Awareness',
        icon: 'brain',
        question: 'How well do you understand your own emotional reactions?',
        options: [
          { value: 1, text: 'I often don\'t know why I feel a certain way' },
          { value: 2, text: 'Sometimes I understand, sometimes I\'m confused' },
          { value: 3, text: 'I usually know what triggers my emotions' },
          { value: 4, text: 'I understand my patterns and can manage them' },
          { value: 5, text: 'I\'m very self-aware and can regulate my emotions well' }
        ]
      },
      {
        title: 'Respecting Boundaries',
        icon: 'shield',
        question: 'How do you handle it when someone sets a boundary with you?',
        options: [
          { value: 1, text: 'I feel offended or rejected' },
          { value: 2, text: 'I accept it but feel a bit hurt' },
          { value: 3, text: 'I respect it, though it takes some adjustment' },
          { value: 4, text: 'I appreciate their honesty and adjust easily' },
          { value: 5, text: 'I see healthy boundaries as signs of a mature relationship' }
        ]
      },
      {
        title: 'Accepting Imperfection',
        icon: 'scales',
        question: 'How do you feel when your partner or family member makes a mistake?',
        options: [
          { value: 1, text: 'I get very frustrated and may criticize them' },
          { value: 2, text: 'I point out what went wrong so they can improve' },
          { value: 3, text: 'I try to be patient but sometimes feel disappointed' },
          { value: 4, text: 'I accept that everyone makes mistakes and focus on solutions' },
          { value: 5, text: 'I respond with compassion and help without judgment' }
        ]
      },
      {
        title: 'Managing Relationship Stress',
        icon: 'lightbulb',
        question: 'When you\'re stressed about relationship matters, how do you cope?',
        options: [
          { value: 1, text: 'I bottle it up or take it out on others' },
          { value: 2, text: 'I worry a lot and may overthink' },
          { value: 3, text: 'I talk to someone or try to distract myself' },
          { value: 4, text: 'I have healthy coping mechanisms (exercise, journaling, etc.)' },
          { value: 5, text: 'I reflect, communicate openly, and take proactive steps' }
        ]
      }
    ],
    
    // Results
    resultsTitle: 'Your EQ Assessment Results',
    eqScore: 'Your EQ Score',
    eqLevel: 'Emotional Intelligence Level',
    levels: {
      developing: 'Still Developing',
      moderate: 'Moderate EQ',
      high: 'High EQ'
    },
    levelDescriptions: {
      developing: 'Your emotional intelligence is still developing. The good news is that EQ can be improved with awareness and practice. Consider reading about emotional intelligence or talking to a counselor.',
      moderate: 'You have a moderate level of emotional intelligence. You understand emotions fairly well but there\'s room for growth in handling difficult situations.',
      high: 'Excellent! You have high emotional intelligence. You\'re well-equipped to handle relationship challenges with empathy and maturity.'
    },
    breakdown: 'Score Breakdown',
    areas: {
      disagreement: 'Disagreement Handling',
      empathy: 'Empathy',
      selfAwareness: 'Self-Awareness',
      boundaries: 'Boundary Respect',
      acceptance: 'Accepting Imperfection',
      stress: 'Stress Management'
    },
    tips: 'Growth Tips',
    tipsList: {
      developing: [
        'Practice pausing before reacting to emotional situations',
        'Try journaling to understand your feelings better',
        'Consider reading books on emotional intelligence',
        'Practice active listening without interrupting'
      ],
      moderate: [
        'Continue developing your self-awareness',
        'Practice expressing feelings constructively',
        'Work on seeing others\' perspectives more',
        'Build more patience in stressful moments'
      ],
      high: [
        'Help others develop their emotional intelligence',
        'Continue practicing mindfulness',
        'Share your communication skills with your partner',
        'Use your EQ to navigate family discussions smoothly'
      ]
    }
  },
  hi: {
    title: 'भावनात्मक बुद्धिमत्ता मूल्यांकन',
    subtitle: 'अपनी भावनात्मक परिपक्वता को समझना मजबूत रिश्ते बनाने में मदद करता है',
    step: 'चरण',
    of: 'में से',
    next: 'आगे',
    previous: 'पीछे',
    complete: 'मेरे परिणाम देखें',
    
    scenarios: [
      {
        title: 'असहमति संभालना',
        icon: 'handshake',
        question: 'जब आपका साथी किसी महत्वपूर्ण बात पर असहमत होता है, तो आप आमतौर पर कैसे प्रतिक्रिया करते हैं?',
        options: [
          { value: 1, text: 'मैं परेशान हो जाता हूं और आवाज उठा सकता हूं या पूरी तरह चुप हो जाता हूं' },
          { value: 2, text: 'मुझे निराशा होती है लेकिन बार-बार अपनी बात समझाने की कोशिश करता हूं' },
          { value: 3, text: 'मैं शांत होने के लिए एक पल लेता हूं, फिर उनका दृष्टिकोण समझने की कोशिश करता हूं' },
          { value: 4, text: 'मैं पहले सुनता हूं, उनके दृष्टिकोण को स्वीकार करता हूं, फिर शांति से अपना साझा करता हूं' },
          { value: 5, text: 'मैं असहमति को एक-दूसरे को बेहतर समझने के अवसर के रूप में देखता हूं' }
        ]
      },
      {
        title: 'दूसरों की भावनाएं समझना',
        icon: 'heart',
        question: 'जब आपका कोई करीबी परेशान लगता है लेकिन बताया नहीं है, तो आप क्या करते हैं?',
        options: [
          { value: 1, text: 'मुझे ध्यान नहीं जाता या शामिल नहीं होना पसंद करता हूं' },
          { value: 2, text: 'मुझे ध्यान जाता है लेकिन उनके बात उठाने का इंतजार करता हूं' },
          { value: 3, text: 'मैं पूछता हूं कि क्या ठीक हैं और सुनने की पेशकश करता हूं' },
          { value: 4, text: 'मैं धीरे से जांच करता हूं और जरूरत हो तो जगह देता हूं' },
          { value: 5, text: 'मैं अक्सर समझ लेता हूं कि क्या गलत है और उनका समर्थन करना जानता हूं' }
        ]
      },
      {
        title: 'आत्म-जागरूकता',
        icon: 'brain',
        question: 'आप अपनी भावनात्मक प्रतिक्रियाओं को कितनी अच्छी तरह समझते हैं?',
        options: [
          { value: 1, text: 'मुझे अक्सर नहीं पता कि मुझे ऐसा क्यों लगता है' },
          { value: 2, text: 'कभी समझता हूं, कभी भ्रमित होता हूं' },
          { value: 3, text: 'मुझे आमतौर पर पता होता है कि मेरी भावनाओं को क्या ट्रिगर करता है' },
          { value: 4, text: 'मैं अपने पैटर्न समझता हूं और उन्हें संभाल सकता हूं' },
          { value: 5, text: 'मैं बहुत आत्म-जागरूक हूं और अपनी भावनाओं को अच्छी तरह नियंत्रित कर सकता हूं' }
        ]
      },
      {
        title: 'सीमाओं का सम्मान',
        icon: 'shield',
        question: 'जब कोई आपके साथ सीमा निर्धारित करता है तो आप कैसे संभालते हैं?',
        options: [
          { value: 1, text: 'मुझे नाराज या अस्वीकृत महसूस होता है' },
          { value: 2, text: 'मैं स्वीकार करता हूं लेकिन थोड़ा आहत महसूस करता हूं' },
          { value: 3, text: 'मैं सम्मान करता हूं, हालांकि कुछ समायोजन लगता है' },
          { value: 4, text: 'मैं उनकी ईमानदारी की सराहना करता हूं और आसानी से समायोजित होता हूं' },
          { value: 5, text: 'मैं स्वस्थ सीमाओं को परिपक्व रिश्ते के संकेत के रूप में देखता हूं' }
        ]
      },
      {
        title: 'अपूर्णता स्वीकारना',
        icon: 'scales',
        question: 'जब आपका साथी या परिवार का सदस्य गलती करता है तो आप कैसा महसूस करते हैं?',
        options: [
          { value: 1, text: 'मुझे बहुत निराशा होती है और उनकी आलोचना कर सकता हूं' },
          { value: 2, text: 'मैं बताता हूं कि क्या गलत हुआ ताकि वे सुधर सकें' },
          { value: 3, text: 'मैं धैर्य रखने की कोशिश करता हूं लेकिन कभी निराश होता हूं' },
          { value: 4, text: 'मैं स्वीकार करता हूं कि सब गलती करते हैं और समाधान पर ध्यान देता हूं' },
          { value: 5, text: 'मैं करुणा से जवाब देता हूं और बिना निर्णय के मदद करता हूं' }
        ]
      },
      {
        title: 'रिश्ते के तनाव का प्रबंधन',
        icon: 'lightbulb',
        question: 'जब आप रिश्ते के मामलों में तनाव में होते हैं, तो आप कैसे सामना करते हैं?',
        options: [
          { value: 1, text: 'मैं दबाकर रखता हूं या दूसरों पर निकालता हूं' },
          { value: 2, text: 'मैं बहुत चिंता करता हूं और ज्यादा सोच सकता हूं' },
          { value: 3, text: 'मैं किसी से बात करता हूं या खुद को व्यस्त रखने की कोशिश करता हूं' },
          { value: 4, text: 'मेरे पास स्वस्थ तरीके हैं (व्यायाम, जर्नलिंग आदि)' },
          { value: 5, text: 'मैं सोचता हूं, खुलकर बात करता हूं और सक्रिय कदम उठाता हूं' }
        ]
      }
    ],
    
    resultsTitle: 'आपके EQ मूल्यांकन परिणाम',
    eqScore: 'आपका EQ स्कोर',
    eqLevel: 'भावनात्मक बुद्धिमत्ता स्तर',
    levels: {
      developing: 'अभी विकासशील',
      moderate: 'मध्यम EQ',
      high: 'उच्च EQ'
    },
    levelDescriptions: {
      developing: 'आपकी भावनात्मक बुद्धिमत्ता अभी विकसित हो रही है। अच्छी बात यह है कि EQ जागरूकता और अभ्यास से बेहतर हो सकता है।',
      moderate: 'आपका भावनात्मक बुद्धिमत्ता मध्यम स्तर का है। आप भावनाओं को काफी अच्छी तरह समझते हैं लेकिन कठिन स्थितियों में विकास की गुंजाइश है।',
      high: 'बहुत बढ़िया! आपकी भावनात्मक बुद्धिमत्ता उच्च है। आप सहानुभूति और परिपक्वता के साथ रिश्ते की चुनौतियों को संभालने में सक्षम हैं।'
    },
    breakdown: 'स्कोर विवरण',
    areas: {
      disagreement: 'असहमति संभालना',
      empathy: 'सहानुभूति',
      selfAwareness: 'आत्म-जागरूकता',
      boundaries: 'सीमा सम्मान',
      acceptance: 'अपूर्णता स्वीकार',
      stress: 'तनाव प्रबंधन'
    },
    tips: 'विकास के सुझाव',
    tipsList: {
      developing: [
        'भावनात्मक स्थितियों में प्रतिक्रिया से पहले रुकने का अभ्यास करें',
        'अपनी भावनाओं को बेहतर समझने के लिए जर्नलिंग करें',
        'भावनात्मक बुद्धिमत्ता पर किताबें पढ़ें',
        'बिना बाधा डाले सक्रिय सुनने का अभ्यास करें'
      ],
      moderate: [
        'अपनी आत्म-जागरूकता विकसित करना जारी रखें',
        'भावनाओं को रचनात्मक ढंग से व्यक्त करने का अभ्यास करें',
        'दूसरों के दृष्टिकोण को अधिक देखने पर काम करें',
        'तनावपूर्ण क्षणों में अधिक धैर्य रखें'
      ],
      high: [
        'दूसरों को उनकी भावनात्मक बुद्धिमत्ता विकसित करने में मदद करें',
        'माइंडफुलनेस का अभ्यास जारी रखें',
        'अपने साथी के साथ संवाद कौशल साझा करें',
        'पारिवारिक चर्चाओं को सुचारू रूप से नेविगेट करने के लिए अपने EQ का उपयोग करें'
      ]
    }
  }
}

export function EQAssessment({ language, onComplete, existingData }: EQAssessmentProps) {
  const t = translations[language]
  const [currentStep, setCurrentStep] = useState(1)
  const [showResults, setShowResults] = useState(false)
  const totalSteps = 6
  
  // Scores for each scenario (1-5)
  const [scores, setScores] = useState<number[]>(
    existingData ? [
      existingData.disagreementHandling,
      existingData.empathyScore,
      existingData.emotionalAwareness,
      existingData.boundaryRespect,
      existingData.perfectionExpectation,
      existingData.stressManagement
    ] : [0, 0, 0, 0, 0, 0]
  )
  
  const progress = (currentStep / totalSteps) * 100
  
  const handleScoreChange = (value: number) => {
    const newScores = [...scores]
    newScores[currentStep - 1] = value
    setScores(newScores)
  }
  
  const canProceed = () => {
    return scores[currentStep - 1] > 0
  }
  
  const calculateEQLevel = (score: number): EQLevel => {
    if (score < 50) return 'developing'
    if (score < 75) return 'moderate'
    return 'high'
  }
  
  const calculateResults = () => {
    const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length
    const eqScore = Math.round((avgScore / 5) * 100)
    return {
      eqScore,
      eqLevel: calculateEQLevel(eqScore)
    }
  }
  
  const handleComplete = () => {
    const { eqScore, eqLevel } = calculateResults()
    
    const data: EQAssessmentData = {
      disagreementHandling: scores[0],
      empathyScore: scores[1],
      emotionalAwareness: scores[2],
      boundaryRespect: scores[3],
      perfectionExpectation: scores[4],
      stressManagement: scores[5],
      overallEQ: eqLevel,
      eqScore,
      completedAt: new Date().toISOString()
    }
    onComplete(data)
  }
  
  const getIconComponent = (iconName: string) => {
    switch (iconName) {
      case 'handshake': return <Handshake size={24} className="text-primary" weight="fill" />
      case 'heart': return <Heart size={24} className="text-primary" weight="fill" />
      case 'brain': return <Brain size={24} className="text-primary" weight="fill" />
      case 'shield': return <ShieldCheck size={24} className="text-primary" weight="fill" />
      case 'scales': return <Scales size={24} className="text-primary" weight="fill" />
      case 'lightbulb': return <Lightbulb size={24} className="text-primary" weight="fill" />
      default: return <Brain size={24} className="text-primary" weight="fill" />
    }
  }
  
  const getSmileyIcon = (value: number) => {
    switch (value) {
      case 1: return <SmileyXEyes size={20} className="text-red-500" />
      case 2: return <SmileySad size={20} className="text-orange-500" />
      case 3: return <SmileyNervous size={20} className="text-yellow-500" />
      case 4: return <SmileyMeh size={20} className="text-lime-500" />
      case 5: return <Smiley size={20} className="text-green-500" weight="fill" />
      default: return null
    }
  }
  
  const renderScenario = () => {
    const scenario = t.scenarios[currentStep - 1]
    
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3 mb-4">
          {getIconComponent(scenario.icon)}
          <div>
            <h3 className="font-semibold text-lg">{scenario.title}</h3>
            <p className="text-sm text-muted-foreground">{scenario.question}</p>
          </div>
        </div>
        
        <RadioGroup 
          value={scores[currentStep - 1].toString()} 
          onValueChange={(v) => handleScoreChange(parseInt(v))}
        >
          {scenario.options.map((option) => (
            <div 
              key={option.value} 
              className={`flex items-start space-x-3 p-4 rounded-lg border cursor-pointer transition-all ${
                scores[currentStep - 1] === option.value 
                  ? 'border-primary bg-primary/5' 
                  : 'hover:bg-accent'
              }`}
              onClick={() => handleScoreChange(option.value)}
            >
              <RadioGroupItem value={option.value.toString()} id={`opt-${option.value}`} className="mt-1" />
              <div className="flex-1">
                <Label htmlFor={`opt-${option.value}`} className="cursor-pointer flex items-start gap-2">
                  {getSmileyIcon(option.value)}
                  <span>{option.text}</span>
                </Label>
              </div>
            </div>
          ))}
        </RadioGroup>
      </div>
    )
  }
  
  const renderResults = () => {
    const { eqScore, eqLevel } = calculateResults()
    const areaNames = ['disagreement', 'empathy', 'selfAwareness', 'boundaries', 'acceptance', 'stress'] as const
    
    return (
      <div className="space-y-6">
        <div className="text-center">
          <h3 className="font-bold text-xl mb-2">{t.resultsTitle}</h3>
          
          {/* Score Circle */}
          <div className="relative w-32 h-32 mx-auto my-6">
            <svg className="w-full h-full" viewBox="0 0 100 100">
              <circle
                className="text-muted stroke-current"
                strokeWidth="8"
                fill="transparent"
                r="40"
                cx="50"
                cy="50"
              />
              <circle
                className={`stroke-current ${
                  eqLevel === 'high' ? 'text-green-500' : 
                  eqLevel === 'moderate' ? 'text-yellow-500' : 'text-orange-500'
                }`}
                strokeWidth="8"
                strokeLinecap="round"
                fill="transparent"
                r="40"
                cx="50"
                cy="50"
                strokeDasharray={`${eqScore * 2.51} 251`}
                transform="rotate(-90 50 50)"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl font-bold">{eqScore}</span>
              <span className="text-xs text-muted-foreground">{t.eqScore}</span>
            </div>
          </div>
          
          <Badge 
            className={`text-lg px-4 py-1 ${
              eqLevel === 'high' ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' : 
              eqLevel === 'moderate' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300' : 
              'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300'
            }`}
          >
            {t.levels[eqLevel]}
          </Badge>
          
          <p className="text-sm text-muted-foreground mt-4 px-4">
            {t.levelDescriptions[eqLevel]}
          </p>
        </div>
        
        {/* Score Breakdown */}
        <div className="space-y-3">
          <h4 className="font-semibold">{t.breakdown}</h4>
          {areaNames.map((area, index) => (
            <div key={area} className="flex items-center gap-3">
              <span className="text-sm flex-1">{t.areas[area]}</span>
              <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full ${
                    scores[index] >= 4 ? 'bg-green-500' : 
                    scores[index] >= 3 ? 'bg-yellow-500' : 'bg-orange-500'
                  }`}
                  style={{ width: `${(scores[index] / 5) * 100}%` }}
                />
              </div>
              <span className="text-sm font-medium w-8">{scores[index]}/5</span>
            </div>
          ))}
        </div>
        
        {/* Tips */}
        <div className="p-4 bg-accent rounded-lg">
          <h4 className="font-semibold mb-2 flex items-center gap-2">
            <Lightbulb size={18} className="text-primary" />
            {t.tips}
          </h4>
          <ul className="text-sm space-y-1">
            {t.tipsList[eqLevel].map((tip, index) => (
              <li key={index} className="flex items-start gap-2">
                <span className="text-primary">•</span>
                {tip}
              </li>
            ))}
          </ul>
        </div>
      </div>
    )
  }
  
  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-full">
            <Brain size={24} className="text-primary" weight="fill" />
          </div>
          <div>
            <CardTitle>{t.title}</CardTitle>
            <CardDescription>{t.subtitle}</CardDescription>
          </div>
        </div>
        {!showResults && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>{t.step} {currentStep} {t.of} {totalSteps}</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        )}
      </CardHeader>
      
      <CardContent>
        <ScrollArea className="h-[400px] pr-4">
          {showResults ? renderResults() : renderScenario()}
        </ScrollArea>
        
        <div className="flex justify-between mt-6 pt-4 border-t">
          {!showResults ? (
            <>
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
                  onClick={() => setShowResults(true)}
                  disabled={!canProceed()}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {t.complete}
                  <ArrowRight size={16} className="ml-2" />
                </Button>
              )}
            </>
          ) : (
            <Button
              onClick={handleComplete}
              className="w-full bg-green-600 hover:bg-green-700"
            >
              <CheckCircle size={16} className="mr-2" />
              {language === 'en' ? 'Save Results & Continue' : 'परिणाम सहेजें और जारी रखें'}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
