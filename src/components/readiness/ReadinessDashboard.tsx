import { useState } from 'react'
import { useKV } from '@/hooks/useKV'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { 
  Trophy,
  Brain,
  Heart,
  Target,
  BookOpen,
  Robot,
  CheckCircle,
  Circle,
  ArrowRight,
  ShieldCheck,
  Medal,
  ChartLine,
  Sparkle,
  Lightning
} from '@phosphor-icons/react'
import { SelfDiscoveryQuiz } from './SelfDiscoveryQuiz'
import { EQAssessment } from './EQAssessment'
import { PartnerExpectations } from './PartnerExpectations'
import { LearningHub } from './LearningHub'
import { AIBioAssistant } from './AIBioAssistant'
import type { 
  Profile, 
  SelfDiscoveryData, 
  EQAssessmentData, 
  PartnerExpectationsData, 
  ReadinessScore,
  AIGeneratedBio
} from '@/types/profile'
import { toast } from 'sonner'

interface ReadinessDashboardProps {
  language: 'en' | 'hi'
  profile: Profile
  onProfileUpdate: (updates: Partial<Profile>) => void
}

const translations = {
  en: {
    title: 'Partner Search Readiness',
    subtitle: 'Build your readiness profile to find better matches',
    overallScore: 'Overall Readiness',
    readinessLevel: 'Readiness Level',
    levels: {
      beginner: 'Just Starting',
      developing: 'Developing',
      ready: 'Ready',
      'highly-ready': 'Highly Ready'
    },
    levelDescriptions: {
      beginner: 'Complete the assessments to build your readiness profile',
      developing: 'You\'re making progress! Complete more sections to improve',
      ready: 'You\'re well-prepared for your partner search journey',
      'highly-ready': 'Excellent! You have a strong foundation for finding the right partner'
    },
    tabs: {
      overview: 'Overview',
      selfDiscovery: 'Self-Discovery',
      eq: 'EQ Assessment',
      expectations: 'Expectations',
      learning: 'Learning Hub',
      aiBio: 'AI Bio'
    },
    sections: {
      selfDiscovery: 'Self-Discovery Quiz',
      selfDiscoveryDesc: 'Understand your values, personality, and lifestyle',
      eq: 'Emotional Intelligence',
      eqDesc: 'Assess your emotional maturity for relationships',
      expectations: 'Partner Expectations',
      expectationsDesc: 'Define what you want and your dealbreakers',
      learning: 'Learning Hub',
      learningDesc: 'Build knowledge for successful relationships',
      aiBio: 'AI Bio Assistant',
      aiBioDesc: 'Create a compelling profile description'
    },
    status: {
      completed: 'Completed',
      notStarted: 'Not Started',
      inProgress: 'In Progress'
    },
    start: 'Start',
    retake: 'Retake',
    continue: 'Continue',
    readinessBadge: 'Ready for Partnership Badge',
    badgeDesc: 'Complete all assessments to earn this badge',
    badgeEarned: 'Badge Earned!',
    badgeEarnedDesc: 'Your profile shows you\'re well-prepared',
    scoreBreakdown: 'Score Breakdown',
    selfAwareness: 'Self-Awareness',
    emotionalMaturity: 'Emotional Maturity',
    expectationClarity: 'Expectation Clarity',
    learningProgress: 'Learning Progress',
    profileVerification: 'Profile Verification',
    tips: 'Tips to Improve',
    tipsList: [
      'Complete all assessments for a full readiness profile',
      'Read articles in the Learning Hub for better preparation',
      'Be honest in your responses for accurate matching',
      'Update your expectations as you learn more'
    ]
  },
  hi: {
    title: 'साथी खोज तत्परता',
    subtitle: 'बेहतर मैच खोजने के लिए अपनी तत्परता प्रोफ़ाइल बनाएं',
    overallScore: 'समग्र तत्परता',
    readinessLevel: 'तत्परता स्तर',
    levels: {
      beginner: 'अभी शुरुआत',
      developing: 'विकासशील',
      ready: 'तैयार',
      'highly-ready': 'पूर्ण तैयार'
    },
    levelDescriptions: {
      beginner: 'अपनी तत्परता प्रोफ़ाइल बनाने के लिए मूल्यांकन पूरा करें',
      developing: 'आप प्रगति कर रहे हैं! सुधार के लिए और अनुभाग पूरे करें',
      ready: 'आप अपनी साथी खोज यात्रा के लिए अच्छी तरह तैयार हैं',
      'highly-ready': 'उत्कृष्ट! सही साथी खोजने के लिए आपकी मजबूत नींव है'
    },
    tabs: {
      overview: 'अवलोकन',
      selfDiscovery: 'आत्म-खोज',
      eq: 'EQ मूल्यांकन',
      expectations: 'अपेक्षाएं',
      learning: 'शिक्षण केंद्र',
      aiBio: 'AI बायो'
    },
    sections: {
      selfDiscovery: 'आत्म-खोज प्रश्नावली',
      selfDiscoveryDesc: 'अपने मूल्यों, व्यक्तित्व और जीवनशैली को समझें',
      eq: 'भावनात्मक बुद्धिमत्ता',
      eqDesc: 'रिश्तों के लिए अपनी भावनात्मक परिपक्वता का आकलन करें',
      expectations: 'साथी की अपेक्षाएं',
      expectationsDesc: 'परिभाषित करें कि आप क्या चाहते हैं और आपके डीलब्रेकर',
      learning: 'शिक्षण केंद्र',
      learningDesc: 'सफल रिश्तों के लिए ज्ञान बनाएं',
      aiBio: 'AI बायो सहायक',
      aiBioDesc: 'एक आकर्षक प्रोफ़ाइल विवरण बनाएं'
    },
    status: {
      completed: 'पूर्ण',
      notStarted: 'शुरू नहीं',
      inProgress: 'प्रगति में'
    },
    start: 'शुरू करें',
    retake: 'फिर से लें',
    continue: 'जारी रखें',
    readinessBadge: 'साझेदारी के लिए तैयार बैज',
    badgeDesc: 'यह बैज अर्जित करने के लिए सभी मूल्यांकन पूरे करें',
    badgeEarned: 'बैज अर्जित!',
    badgeEarnedDesc: 'आपकी प्रोफ़ाइल दिखाती है कि आप अच्छी तरह तैयार हैं',
    scoreBreakdown: 'स्कोर विवरण',
    selfAwareness: 'आत्म-जागरूकता',
    emotionalMaturity: 'भावनात्मक परिपक्वता',
    expectationClarity: 'अपेक्षा स्पष्टता',
    learningProgress: 'शिक्षण प्रगति',
    profileVerification: 'प्रोफ़ाइल सत्यापन',
    tips: 'सुधार के लिए सुझाव',
    tipsList: [
      'पूर्ण तत्परता प्रोफ़ाइल के लिए सभी मूल्यांकन पूरे करें',
      'बेहतर तैयारी के लिए शिक्षण केंद्र में लेख पढ़ें',
      'सटीक मिलान के लिए अपनी प्रतिक्रियाओं में ईमानदार रहें',
      'जैसे-जैसे आप अधिक सीखते हैं अपनी अपेक्षाएं अपडेट करें'
    ]
  }
}

export function ReadinessDashboard({ language, profile, onProfileUpdate }: ReadinessDashboardProps) {
  const t = translations[language]
  
  // Store readiness data in KV
  const [selfDiscoveryData, setSelfDiscoveryData] = useKV<SelfDiscoveryData | null>(`selfDiscovery_${profile.profileId}`, null)
  const [eqData, setEqData] = useKV<EQAssessmentData | null>(`eqAssessment_${profile.profileId}`, null)
  const [expectationsData, setExpectationsData] = useKV<PartnerExpectationsData | null>(`expectations_${profile.profileId}`, null)
  const [completedArticles, setCompletedArticles] = useKV<string[]>(`completedArticles_${profile.profileId}`, [])
  const [aiGeneratedBio, setAiGeneratedBio] = useKV<AIGeneratedBio | null>(`aiBio_${profile.profileId}`, null)
  
  const [activeTab, setActiveTab] = useState('overview')
  const [showQuizDialog, setShowQuizDialog] = useState<string | null>(null)
  
  // Calculate readiness score
  const calculateReadinessScore = (): ReadinessScore => {
    let selfAwarenessScore = 0
    let eqScore = 0
    let expectationClarityScore = 0
    let learningScore = 0
    let safetyScore = 0
    
    // Self-awareness (max 100)
    if (selfDiscoveryData) {
      selfAwarenessScore = 100
    }
    
    // EQ (max 100)
    if (eqData) {
      eqScore = eqData.eqScore
    }
    
    // Expectations (max 100)
    if (expectationsData) {
      expectationClarityScore = 100
    }
    
    // Learning (max 100 based on articles read)
    const totalArticles = 8 // Total articles in learning hub
    const articlesCompleted = completedArticles || []
    learningScore = Math.min(100, (articlesCompleted.length / totalArticles) * 100)
    
    // Safety/Verification (max 100)
    if (profile.status === 'verified') safetyScore += 40
    if (profile.mobileVerified) safetyScore += 20
    if (profile.emailVerified) safetyScore += 20
    if (profile.idProofVerified) safetyScore += 20
    
    // Overall score (weighted average)
    const overallScore = Math.round(
      (selfAwarenessScore * 0.25) +
      (eqScore * 0.25) +
      (expectationClarityScore * 0.25) +
      (learningScore * 0.15) +
      (safetyScore * 0.10)
    )
    
    // Determine level
    let readinessLevel: ReadinessScore['readinessLevel'] = 'beginner'
    if (overallScore >= 80) readinessLevel = 'highly-ready'
    else if (overallScore >= 60) readinessLevel = 'ready'
    else if (overallScore >= 30) readinessLevel = 'developing'
    
    // Badge earned if all main assessments complete and score > 70
    const hasBadge = !!selfDiscoveryData && !!eqData && !!expectationsData && overallScore >= 70
    
    return {
      profileId: profile.profileId,
      selfAwarenessScore,
      eqScore,
      expectationClarityScore,
      communicationScore: 0,
      safetyScore,
      overallScore,
      readinessLevel,
      hasBadge,
      articlesRead: completedArticles || [],
      videosWatched: [],
      lastCalculatedAt: new Date().toISOString()
    }
  }
  
  const readinessScore = calculateReadinessScore()
  
  const handleSelfDiscoveryComplete = (data: SelfDiscoveryData) => {
    setSelfDiscoveryData(data)
    onProfileUpdate({ selfDiscoveryCompleted: true })
    setShowQuizDialog(null)
    toast.success(language === 'en' ? 'Self-Discovery completed!' : 'आत्म-खोज पूर्ण!')
  }
  
  const handleEQComplete = (data: EQAssessmentData) => {
    setEqData(data)
    onProfileUpdate({ eqAssessmentCompleted: true })
    setShowQuizDialog(null)
    toast.success(language === 'en' ? 'EQ Assessment completed!' : 'EQ मूल्यांकन पूर्ण!')
  }
  
  const handleExpectationsComplete = (data: PartnerExpectationsData) => {
    setExpectationsData(data)
    onProfileUpdate({ expectationsCompleted: true })
    setShowQuizDialog(null)
    toast.success(language === 'en' ? 'Expectations saved!' : 'अपेक्षाएं सहेजी गईं!')
  }
  
  const handleArticleComplete = (articleId: string) => {
    const articles = completedArticles || []
    if (!articles.includes(articleId)) {
      setCompletedArticles([...articles, articleId])
    }
  }
  
  const handleBioGenerated = (bio: AIGeneratedBio) => {
    setAiGeneratedBio(bio)
  }
  
  const handleUseBio = (bio: string) => {
    onProfileUpdate({ bio, aiGeneratedBioUsed: true })
  }
  
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-500'
    if (score >= 60) return 'text-lime-500'
    if (score >= 40) return 'text-yellow-500'
    return 'text-orange-500'
  }
  
  const getLevelColor = (level: string) => {
    switch (level) {
      case 'highly-ready': return 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
      case 'ready': return 'bg-lime-100 text-lime-700 dark:bg-lime-900 dark:text-lime-300'
      case 'developing': return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300'
      default: return 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300'
    }
  }
  
  const renderOverview = () => (
    <div className="space-y-6">
      {/* Score Card */}
      <Card className="bg-gradient-to-br from-primary/10 to-primary/5">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row items-center gap-6">
            {/* Score Circle */}
            <div className="relative w-32 h-32">
              <svg className="w-full h-full transform -rotate-90">
                <circle
                  className="text-muted stroke-current"
                  strokeWidth="8"
                  fill="transparent"
                  r="56"
                  cx="64"
                  cy="64"
                />
                <circle
                  className={`stroke-current ${getScoreColor(readinessScore.overallScore)}`}
                  strokeWidth="8"
                  strokeLinecap="round"
                  fill="transparent"
                  r="56"
                  cx="64"
                  cy="64"
                  strokeDasharray={`${readinessScore.overallScore * 3.52} 352`}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className={`text-3xl font-bold ${getScoreColor(readinessScore.overallScore)}`}>
                  {readinessScore.overallScore}
                </span>
                <span className="text-xs text-muted-foreground">{t.overallScore}</span>
              </div>
            </div>
            
            <div className="flex-1 text-center md:text-left">
              <Badge className={`text-sm px-3 py-1 ${getLevelColor(readinessScore.readinessLevel)}`}>
                {t.levels[readinessScore.readinessLevel]}
              </Badge>
              <p className="text-sm text-muted-foreground mt-2">
                {t.levelDescriptions[readinessScore.readinessLevel]}
              </p>
            </div>
            
            {/* Badge */}
            <div className={`p-4 rounded-xl ${readinessScore.hasBadge ? 'bg-yellow-100 dark:bg-yellow-900/30' : 'bg-muted'}`}>
              <div className="flex flex-col items-center">
                <Medal 
                  size={48} 
                  weight="fill" 
                  className={readinessScore.hasBadge ? 'text-yellow-500' : 'text-muted-foreground'}
                />
                <span className="text-xs text-center mt-1 font-medium">
                  {readinessScore.hasBadge ? t.badgeEarned : t.readinessBadge}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Score Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <ChartLine size={20} />
            {t.scoreBreakdown}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {[
            { label: t.selfAwareness, score: readinessScore.selfAwarenessScore, icon: <Brain size={16} /> },
            { label: t.emotionalMaturity, score: readinessScore.eqScore, icon: <Heart size={16} /> },
            { label: t.expectationClarity, score: readinessScore.expectationClarityScore, icon: <Target size={16} /> },
            { label: t.learningProgress, score: Math.round(((completedArticles || []).length / 8) * 100), icon: <BookOpen size={16} /> },
            { label: t.profileVerification, score: readinessScore.safetyScore, icon: <ShieldCheck size={16} /> }
          ].map((item, i) => (
            <div key={i} className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2">
                  {item.icon}
                  {item.label}
                </span>
                <span className={`font-medium ${getScoreColor(item.score)}`}>{item.score}%</span>
              </div>
              <Progress value={item.score} className="h-2" />
            </div>
          ))}
        </CardContent>
      </Card>
      
      {/* Section Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Self-Discovery */}
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setShowQuizDialog('selfDiscovery')}>
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <div className={`p-2 rounded-full ${selfDiscoveryData ? 'bg-green-100 dark:bg-green-900/30' : 'bg-muted'}`}>
                <Brain size={24} className={selfDiscoveryData ? 'text-green-600' : 'text-muted-foreground'} weight="fill" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold">{t.sections.selfDiscovery}</h4>
                  {selfDiscoveryData ? (
                    <CheckCircle size={20} className="text-green-500" weight="fill" />
                  ) : (
                    <Circle size={20} className="text-muted-foreground" />
                  )}
                </div>
                <p className="text-sm text-muted-foreground mt-1">{t.sections.selfDiscoveryDesc}</p>
                <Button size="sm" variant={selfDiscoveryData ? 'outline' : 'default'} className="mt-3">
                  {selfDiscoveryData ? t.retake : t.start}
                  <ArrowRight size={14} className="ml-1" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* EQ Assessment */}
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setShowQuizDialog('eq')}>
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <div className={`p-2 rounded-full ${eqData ? 'bg-green-100 dark:bg-green-900/30' : 'bg-muted'}`}>
                <Heart size={24} className={eqData ? 'text-green-600' : 'text-muted-foreground'} weight="fill" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold">{t.sections.eq}</h4>
                  {eqData ? (
                    <Badge variant="outline" className="text-xs">
                      {eqData.eqScore}%
                    </Badge>
                  ) : (
                    <Circle size={20} className="text-muted-foreground" />
                  )}
                </div>
                <p className="text-sm text-muted-foreground mt-1">{t.sections.eqDesc}</p>
                <Button size="sm" variant={eqData ? 'outline' : 'default'} className="mt-3">
                  {eqData ? t.retake : t.start}
                  <ArrowRight size={14} className="ml-1" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Expectations */}
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setShowQuizDialog('expectations')}>
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <div className={`p-2 rounded-full ${expectationsData ? 'bg-green-100 dark:bg-green-900/30' : 'bg-muted'}`}>
                <Target size={24} className={expectationsData ? 'text-green-600' : 'text-muted-foreground'} weight="fill" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold">{t.sections.expectations}</h4>
                  {expectationsData ? (
                    <CheckCircle size={20} className="text-green-500" weight="fill" />
                  ) : (
                    <Circle size={20} className="text-muted-foreground" />
                  )}
                </div>
                <p className="text-sm text-muted-foreground mt-1">{t.sections.expectationsDesc}</p>
                <Button size="sm" variant={expectationsData ? 'outline' : 'default'} className="mt-3">
                  {expectationsData ? t.retake : t.start}
                  <ArrowRight size={14} className="ml-1" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Learning Hub */}
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setActiveTab('learning')}>
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <div className={`p-2 rounded-full ${(completedArticles || []).length > 0 ? 'bg-blue-100 dark:bg-blue-900/30' : 'bg-muted'}`}>
                <BookOpen size={24} className={(completedArticles || []).length > 0 ? 'text-blue-600' : 'text-muted-foreground'} weight="fill" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold">{t.sections.learning}</h4>
                  <Badge variant="outline" className="text-xs">
                    {(completedArticles || []).length}/8
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground mt-1">{t.sections.learningDesc}</p>
                <Button size="sm" variant="outline" className="mt-3">
                  {t.continue}
                  <ArrowRight size={14} className="ml-1" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* AI Bio */}
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setActiveTab('aiBio')}>
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <div className={`p-2 rounded-full ${aiGeneratedBio ? 'bg-purple-100 dark:bg-purple-900/30' : 'bg-muted'}`}>
                <Robot size={24} className={aiGeneratedBio ? 'text-purple-600' : 'text-muted-foreground'} weight="fill" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold">{t.sections.aiBio}</h4>
                  {aiGeneratedBio?.isUsed && (
                    <CheckCircle size={20} className="text-green-500" weight="fill" />
                  )}
                </div>
                <p className="text-sm text-muted-foreground mt-1">{t.sections.aiBioDesc}</p>
                <Button size="sm" variant={aiGeneratedBio ? 'outline' : 'default'} className="mt-3">
                  {aiGeneratedBio ? t.retake : t.start}
                  <ArrowRight size={14} className="ml-1" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Tips */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Sparkle size={20} />
            {t.tips}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {t.tipsList.map((tip, i) => (
              <li key={i} className="flex items-start gap-2 text-sm">
                <Lightning size={16} className="text-primary mt-0.5" weight="fill" />
                {tip}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  )
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 bg-primary/10 rounded-full">
          <Trophy size={28} className="text-primary" weight="fill" />
        </div>
        <div>
          <h2 className="text-2xl font-bold">{t.title}</h2>
          <p className="text-muted-foreground">{t.subtitle}</p>
        </div>
      </div>
      
      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <ScrollArea className="w-full">
          <TabsList className="w-full justify-start">
            <TabsTrigger value="overview" className="flex items-center gap-1">
              <ChartLine size={16} />
              {t.tabs.overview}
            </TabsTrigger>
            <TabsTrigger value="selfDiscovery" className="flex items-center gap-1">
              <Brain size={16} />
              {t.tabs.selfDiscovery}
            </TabsTrigger>
            <TabsTrigger value="eq" className="flex items-center gap-1">
              <Heart size={16} />
              {t.tabs.eq}
            </TabsTrigger>
            <TabsTrigger value="expectations" className="flex items-center gap-1">
              <Target size={16} />
              {t.tabs.expectations}
            </TabsTrigger>
            <TabsTrigger value="learning" className="flex items-center gap-1">
              <BookOpen size={16} />
              {t.tabs.learning}
            </TabsTrigger>
            <TabsTrigger value="aiBio" className="flex items-center gap-1">
              <Robot size={16} />
              {t.tabs.aiBio}
            </TabsTrigger>
          </TabsList>
        </ScrollArea>
        
        <TabsContent value="overview" className="mt-6">
          {renderOverview()}
        </TabsContent>
        
        <TabsContent value="selfDiscovery" className="mt-6">
          <SelfDiscoveryQuiz 
            language={language} 
            onComplete={handleSelfDiscoveryComplete}
            existingData={selfDiscoveryData}
          />
        </TabsContent>
        
        <TabsContent value="eq" className="mt-6">
          <EQAssessment 
            language={language} 
            onComplete={handleEQComplete}
            existingData={eqData}
          />
        </TabsContent>
        
        <TabsContent value="expectations" className="mt-6">
          <PartnerExpectations 
            language={language}
            profileId={profile.profileId}
            onComplete={handleExpectationsComplete}
            existingData={expectationsData}
          />
        </TabsContent>
        
        <TabsContent value="learning" className="mt-6">
          <LearningHub 
            language={language}
            completedArticles={completedArticles || []}
            onArticleComplete={handleArticleComplete}
          />
        </TabsContent>
        
        <TabsContent value="aiBio" className="mt-6">
          <AIBioAssistant 
            language={language}
            profile={profile}
            selfDiscoveryData={selfDiscoveryData}
            existingAIBio={aiGeneratedBio}
            onBioGenerated={handleBioGenerated}
            onUseBio={handleUseBio}
          />
        </TabsContent>
      </Tabs>
      
      {/* Dialog for quick access from overview */}
      <Dialog open={!!showQuizDialog} onOpenChange={() => setShowQuizDialog(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-auto">
          {showQuizDialog === 'selfDiscovery' && (
            <SelfDiscoveryQuiz 
              language={language} 
              onComplete={handleSelfDiscoveryComplete}
              existingData={selfDiscoveryData}
            />
          )}
          {showQuizDialog === 'eq' && (
            <EQAssessment 
              language={language} 
              onComplete={handleEQComplete}
              existingData={eqData}
            />
          )}
          {showQuizDialog === 'expectations' && (
            <PartnerExpectations 
              language={language}
              profileId={profile.profileId}
              onComplete={handleExpectationsComplete}
              existingData={expectationsData}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
