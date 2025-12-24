import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { 
  BookOpen,
  Brain,
  ChatCircle,
  ShieldCheck,
  Users,
  Heart,
  Play,
  Clock,
  CheckCircle,
  ArrowRight,
  Lightbulb,
  Article,
  VideoCamera,
  Image
} from '@phosphor-icons/react'

interface LearningHubProps {
  language: 'en' | 'hi'
  completedArticles: string[]
  onArticleComplete: (articleId: string) => void
}

interface LearningArticle {
  id: string
  type: 'article' | 'video' | 'infographic'
  category: 'self-awareness' | 'communication' | 'expectations' | 'safety' | 'family-discussions' | 'relationship-basics'
  title: string
  titleHi: string
  description: string
  descriptionHi: string
  content: string
  contentHi: string
  duration: string
  imageUrl?: string
}

const translations = {
  en: {
    title: 'Partner-Search Learning Center',
    subtitle: 'Build knowledge and confidence for your journey',
    categories: {
      all: 'All',
      'self-awareness': 'Self-Awareness',
      'communication': 'Communication',
      'expectations': 'Setting Expectations',
      'safety': 'Safety & Trust',
      'family-discussions': 'Family Discussions',
      'relationship-basics': 'Relationship Basics'
    },
    readMore: 'Read More',
    markComplete: 'Mark as Complete',
    completed: 'Completed',
    minRead: 'min read',
    progress: 'Your Progress',
    articlesCompleted: 'articles completed',
    startLearning: 'Start Learning',
    continueReading: 'Continue Reading'
  },
  hi: {
    title: 'साथी-खोज शिक्षण केंद्र',
    subtitle: 'अपनी यात्रा के लिए ज्ञान और आत्मविश्वास बनाएं',
    categories: {
      all: 'सभी',
      'self-awareness': 'आत्म-जागरूकता',
      'communication': 'संवाद',
      'expectations': 'अपेक्षाएं निर्धारित करना',
      'safety': 'सुरक्षा और विश्वास',
      'family-discussions': 'पारिवारिक चर्चा',
      'relationship-basics': 'रिश्ते की बुनियाद'
    },
    readMore: 'और पढ़ें',
    markComplete: 'पूर्ण के रूप में चिह्नित करें',
    completed: 'पूर्ण',
    minRead: 'मिनट पढ़ना',
    progress: 'आपकी प्रगति',
    articlesCompleted: 'लेख पूर्ण',
    startLearning: 'सीखना शुरू करें',
    continueReading: 'पढ़ना जारी रखें'
  }
}

const learningArticles: LearningArticle[] = [
  // Self-Awareness
  {
    id: 'sa-1',
    type: 'article',
    category: 'self-awareness',
    title: 'Know Yourself Before Finding a Partner',
    titleHi: 'साथी खोजने से पहले खुद को जानें',
    description: 'Understanding your values, goals, and non-negotiables is the first step',
    descriptionHi: 'अपने मूल्यों, लक्ष्यों और अपरिहार्यताओं को समझना पहला कदम है',
    duration: '5',
    content: `# Know Yourself Before Finding a Partner

## Why Self-Awareness Matters

Before you start looking for a life partner, it's crucial to understand yourself deeply. This isn't about being selfish—it's about being prepared.

### Your Core Values
Ask yourself:
- What matters most to you? (Family, career, spirituality, adventure?)
- What are your non-negotiables in a relationship?
- What lifestyle do you envision for yourself?

### Your Strengths and Growth Areas
Being honest about your own strengths and weaknesses helps you:
- Find someone who complements you
- Avoid projecting unrealistic expectations
- Communicate better about your needs

### Your Life Goals
Consider:
- Where do you want to be in 5-10 years?
- What role does marriage play in your life plan?
- Are you ready for the responsibilities of partnership?

## Practical Exercise

Take 15 minutes to write down:
1. Your top 5 values
2. 3 things you won't compromise on
3. 3 things you're flexible about
4. Your biggest strength in relationships
5. One area you want to improve

This clarity will guide your search and help you recognize compatible partners.`,
    contentHi: `# साथी खोजने से पहले खुद को जानें

## आत्म-जागरूकता क्यों महत्वपूर्ण है

जीवन साथी की तलाश शुरू करने से पहले, खुद को गहराई से समझना महत्वपूर्ण है। यह स्वार्थी होने के बारे में नहीं है—यह तैयार होने के बारे में है।

### आपके मूल मूल्य
खुद से पूछें:
- आपके लिए सबसे महत्वपूर्ण क्या है? (परिवार, करियर, आध्यात्मिकता, साहसिक?)
- रिश्ते में आपकी अपरिहार्यताएं क्या हैं?
- आप अपने लिए कैसी जीवनशैली की कल्पना करते हैं?

### आपकी ताकत और विकास क्षेत्र
अपनी ताकत और कमजोरियों के बारे में ईमानदार होने से आपको मदद मिलती है:
- किसी ऐसे व्यक्ति को खोजें जो आपका पूरक हो
- अवास्तविक अपेक्षाओं को प्रोजेक्ट करने से बचें
- अपनी जरूरतों के बारे में बेहतर संवाद करें

### आपके जीवन लक्ष्य
विचार करें:
- आप 5-10 वर्षों में कहां होना चाहते हैं?
- आपकी जीवन योजना में विवाह की क्या भूमिका है?
- क्या आप साझेदारी की जिम्मेदारियों के लिए तैयार हैं?

## व्यावहारिक अभ्यास

15 मिनट लें और लिखें:
1. आपके शीर्ष 5 मूल्य
2. 3 चीजें जिन पर आप समझौता नहीं करेंगे
3. 3 चीजें जिनके बारे में आप लचीले हैं
4. रिश्तों में आपकी सबसे बड़ी ताकत
5. एक क्षेत्र जिसमें आप सुधार करना चाहते हैं`
  },
  {
    id: 'sa-2',
    type: 'article',
    category: 'self-awareness',
    title: 'Understanding Your Attachment Style',
    titleHi: 'अपनी लगाव शैली को समझना',
    description: 'How your early relationships shape your expectations',
    descriptionHi: 'कैसे आपके शुरुआती रिश्ते आपकी अपेक्षाओं को आकार देते हैं',
    duration: '7',
    content: `# Understanding Your Attachment Style

## What is Attachment Style?

Your attachment style is how you connect emotionally with others, especially in close relationships. It's shaped by your early experiences.

## The Four Styles

### 1. Secure Attachment
- Comfortable with intimacy and independence
- Trust comes naturally
- Can communicate needs clearly

### 2. Anxious Attachment
- Need frequent reassurance
- Fear of abandonment
- May become clingy under stress

### 3. Avoidant Attachment
- Value independence highly
- Uncomfortable with too much closeness
- May pull away when things get serious

### 4. Anxious-Avoidant (Disorganized)
- Mixed feelings about closeness
- May push and pull in relationships
- Often stems from inconsistent caregiving

## Why This Matters for Partner Search

Understanding your style helps you:
- Recognize patterns in past relationships
- Communicate your needs better
- Choose a compatible partner
- Work on becoming more secure

## Moving Toward Secure Attachment

1. Reflect on your patterns
2. Practice open communication
3. Build trust gradually
4. Seek help if needed

Remember: Attachment styles aren't fixed. With awareness and effort, you can develop healthier patterns.`,
    contentHi: `# अपनी लगाव शैली को समझना

## लगाव शैली क्या है?

आपकी लगाव शैली यह है कि आप दूसरों के साथ भावनात्मक रूप से कैसे जुड़ते हैं, खासकर करीबी रिश्तों में।

## चार शैलियां

### 1. सुरक्षित लगाव
- अंतरंगता और स्वतंत्रता दोनों के साथ सहज
- विश्वास स्वाभाविक रूप से आता है
- जरूरतों को स्पष्ट रूप से संवाद कर सकते हैं

### 2. चिंतित लगाव
- बार-बार आश्वासन की जरूरत
- त्याग का डर
- तनाव में चिपकू हो सकते हैं

### 3. बचने वाला लगाव
- स्वतंत्रता को अत्यधिक महत्व देते हैं
- बहुत अधिक निकटता से असहज
- जब चीजें गंभीर हों तो पीछे हट सकते हैं

### 4. चिंतित-बचने वाला
- निकटता के बारे में मिश्रित भावनाएं
- रिश्तों में धक्का-खींच कर सकते हैं

## साथी खोज के लिए यह क्यों मायने रखता है

अपनी शैली को समझने से आपको मदद मिलती है:
- पिछले रिश्तों में पैटर्न पहचानें
- अपनी जरूरतों को बेहतर ढंग से संवाद करें
- एक संगत साथी चुनें`
  },
  // Communication
  {
    id: 'comm-1',
    type: 'article',
    category: 'communication',
    title: 'First Conversations: What to Ask',
    titleHi: 'पहली बातचीत: क्या पूछें',
    description: 'Meaningful questions that help you know someone better',
    descriptionHi: 'अर्थपूर्ण प्रश्न जो किसी को बेहतर जानने में मदद करते हैं',
    duration: '6',
    content: `# First Conversations: What to Ask

## Beyond the Basics

Instead of just asking about job and family, try deeper questions that reveal character and compatibility.

## Great First Conversation Topics

### Values & Priorities
- "What does a typical weekend look like for you?"
- "What's something you're really passionate about?"
- "How do you like to spend time with family?"

### Future Vision
- "Where do you see yourself in 5 years?"
- "What does work-life balance mean to you?"
- "What role does family play in your decisions?"

### Character Insights
- "How do you handle disagreements?"
- "What's the best advice you've ever received?"
- "What are you currently trying to improve about yourself?"

## What NOT to Ask Early

- Salary specifics (too transactional)
- Past relationship details (too personal)
- Immediate marriage timeline pressure
- Intrusive family financial questions

## Tips for Good Conversation

1. **Listen actively** - Don't just wait for your turn to speak
2. **Share equally** - Good conversation is two-way
3. **Be genuine** - Authentic curiosity shows
4. **Take your time** - Deep knowing takes multiple conversations`,
    contentHi: `# पहली बातचीत: क्या पूछें

## बुनियादी बातों से परे

सिर्फ नौकरी और परिवार के बारे में पूछने के बजाय, गहरे सवाल पूछें जो चरित्र और संगतता को प्रकट करें।

## बढ़िया पहली बातचीत विषय

### मूल्य और प्राथमिकताएं
- "आपका सामान्य सप्ताहांत कैसा दिखता है?"
- "कोई ऐसी चीज जिसके बारे में आप वास्तव में उत्साहित हैं?"
- "आप परिवार के साथ समय कैसे बिताना पसंद करते हैं?"

### भविष्य की दृष्टि
- "आप 5 वर्षों में खुद को कहां देखते हैं?"
- "आपके लिए कार्य-जीवन संतुलन का क्या मतलब है?"

### चरित्र अंतर्दृष्टि
- "आप असहमति कैसे संभालते हैं?"
- "आपको मिली सबसे अच्छी सलाह क्या है?"

## अच्छी बातचीत के लिए सुझाव

1. **सक्रिय रूप से सुनें**
2. **समान रूप से साझा करें**
3. **सच्चे रहें**
4. **अपना समय लें**`
  },
  {
    id: 'comm-2',
    type: 'article',
    category: 'communication',
    title: 'Active Listening in Relationships',
    titleHi: 'रिश्तों में सक्रिय सुनना',
    description: 'The skill that makes all the difference',
    descriptionHi: 'वह कौशल जो सब फर्क डालता है',
    duration: '5',
    content: `# Active Listening in Relationships

## What is Active Listening?

Active listening is fully concentrating on what someone is saying, rather than just passively hearing.

## Why It Matters

- Builds trust and respect
- Prevents misunderstandings
- Shows you value the other person
- Deepens emotional connection

## How to Practice

### 1. Give Full Attention
- Put away your phone
- Make eye contact
- Face the speaker

### 2. Show You're Listening
- Nod occasionally
- Use small verbal cues ("I see", "Go on")
- Maintain open body language

### 3. Reflect and Clarify
- "So what you're saying is..."
- "Do you mean that...?"
- "How did that make you feel?"

### 4. Don't Interrupt
- Wait for natural pauses
- Don't plan your response while they speak
- Resist the urge to give immediate advice

## Common Mistakes to Avoid

- Checking your phone
- Finishing their sentences
- Making it about yourself
- Giving unsolicited advice
- Dismissing their feelings`,
    contentHi: `# रिश्तों में सक्रिय सुनना

## सक्रिय सुनना क्या है?

सक्रिय सुनना किसी की बात पर पूरी तरह ध्यान देना है, न कि सिर्फ निष्क्रिय रूप से सुनना।

## यह क्यों मायने रखता है

- विश्वास और सम्मान बनाता है
- गलतफहमियां रोकता है
- दिखाता है कि आप दूसरे व्यक्ति को महत्व देते हैं
- भावनात्मक जुड़ाव गहरा करता है

## कैसे अभ्यास करें

### 1. पूरा ध्यान दें
- अपना फोन दूर रखें
- आंखों से संपर्क बनाएं

### 2. दिखाएं कि आप सुन रहे हैं
- कभी-कभी सिर हिलाएं
- छोटे मौखिक संकेत उपयोग करें

### 3. प्रतिबिंबित और स्पष्ट करें
- "तो आप कह रहे हैं कि..."
- "क्या आपका मतलब है...?"

### 4. बीच में न टोकें
- स्वाभाविक विराम का इंतजार करें
- जब वे बोलें तब अपनी प्रतिक्रिया की योजना न बनाएं`
  },
  // Expectations
  {
    id: 'exp-1',
    type: 'article',
    category: 'expectations',
    title: 'Realistic vs Unrealistic Expectations',
    titleHi: 'यथार्थवादी बनाम अवास्तविक अपेक्षाएं',
    description: 'Finding the balance for a happy relationship',
    descriptionHi: 'खुशहाल रिश्ते के लिए संतुलन खोजना',
    duration: '6',
    content: `# Realistic vs Unrealistic Expectations

## The Expectation Trap

Many people enter marriage with unrealistic expectations shaped by movies, social media, or fantasy.

## Unrealistic Expectations

❌ "My partner will complete me"
❌ "We'll never fight"
❌ "They'll change after marriage"
❌ "Love conquers all problems"
❌ "They should know what I need without asking"

## Realistic Expectations

✅ "We'll grow together through challenges"
✅ "We'll disagree but handle it respectfully"
✅ "We'll both need to adjust and compromise"
✅ "Love requires ongoing effort"
✅ "We'll communicate our needs clearly"

## How to Set Healthy Expectations

### 1. Separate Must-Haves from Nice-to-Haves
Must-haves: Respect, honesty, shared values
Nice-to-haves: Same hobbies, similar taste in food

### 2. Focus on Character Over Circumstances
Character is stable; job, looks, wealth can change.

### 3. Accept Human Imperfection
No one is perfect. Are their flaws dealbreakers or just differences?

### 4. Discuss Expectations Openly
Before marriage, talk about:
- Living arrangements
- Work and household responsibilities
- Financial management
- Family involvement
- Children`,
    contentHi: `# यथार्थवादी बनाम अवास्तविक अपेक्षाएं

## अपेक्षा जाल

कई लोग फिल्मों या सोशल मीडिया से प्रभावित अवास्तविक अपेक्षाओं के साथ शादी में प्रवेश करते हैं।

## अवास्तविक अपेक्षाएं

❌ "मेरा साथी मुझे पूर्ण करेगा"
❌ "हम कभी नहीं लड़ेंगे"
❌ "वे शादी के बाद बदल जाएंगे"
❌ "प्यार सब समस्याओं को जीत लेता है"

## यथार्थवादी अपेक्षाएं

✅ "हम चुनौतियों के माध्यम से एक साथ बढ़ेंगे"
✅ "हम असहमत होंगे लेकिन सम्मानपूर्वक संभालेंगे"
✅ "हम दोनों को समायोजित और समझौता करना होगा"
✅ "प्यार के लिए निरंतर प्रयास की आवश्यकता है"

## स्वस्थ अपेक्षाएं कैसे निर्धारित करें

### 1. आवश्यक को अच्छा-होगा से अलग करें
### 2. परिस्थितियों पर चरित्र पर ध्यान दें
### 3. मानवीय अपूर्णता स्वीकार करें
### 4. अपेक्षाओं पर खुलकर चर्चा करें`
  },
  // Safety
  {
    id: 'safe-1',
    type: 'article',
    category: 'safety',
    title: 'Red Flags to Watch For',
    titleHi: 'खतरे के संकेत जिन पर ध्यान दें',
    description: 'Warning signs that should not be ignored',
    descriptionHi: 'चेतावनी संकेत जिन्हें नजरअंदाज नहीं करना चाहिए',
    duration: '8',
    content: `# Red Flags to Watch For

## Trust Your Instincts

If something feels wrong, it probably is. Don't ignore warning signs hoping things will improve.

## Serious Red Flags

### Behavioral Red Flags
🚩 Anger management issues
🚩 Controlling behavior
🚩 Disrespect toward you or others
🚩 Lying or inconsistent stories
🚩 Pressuring you to make quick decisions
🚩 Isolating you from family/friends

### Communication Red Flags
🚩 Avoiding direct questions
🚩 Getting defensive easily
🚩 Never taking responsibility
🚩 Dismissing your concerns

### Online Safety Red Flags
🚩 Refusing video calls
🚩 Inconsistent profile information
🚩 Asking for money
🚩 Pressuring for personal details early
🚩 Only communicating outside the platform

## What To Do

1. **Trust your gut** - If something feels off, investigate
2. **Verify information** - Cross-check what they tell you
3. **Take your time** - Don't rush into decisions
4. **Involve family** - Get trusted perspectives
5. **Use the report feature** - Help protect others

## When to Walk Away

Some issues can be worked on. These cannot:
- Any form of abuse
- Fundamental dishonesty
- Addiction without treatment
- Lack of basic respect`,
    contentHi: `# खतरे के संकेत जिन पर ध्यान दें

## अपनी सहजबुद्धि पर विश्वास करें

अगर कुछ गलत लगता है, तो शायद है। चेतावनी संकेतों को नजरअंदाज न करें।

## गंभीर खतरे के संकेत

### व्यवहारिक खतरे के संकेत
🚩 क्रोध प्रबंधन समस्याएं
🚩 नियंत्रित करने वाला व्यवहार
🚩 आपके या दूसरों के प्रति अनादर
🚩 झूठ बोलना या असंगत कहानियां
🚩 जल्दी निर्णय लेने के लिए दबाव

### ऑनलाइन सुरक्षा खतरे के संकेत
🚩 वीडियो कॉल से मना करना
🚩 असंगत प्रोफ़ाइल जानकारी
🚩 पैसे मांगना
🚩 जल्दी व्यक्तिगत विवरण के लिए दबाव

## क्या करें

1. **अपनी सहजबुद्धि पर विश्वास करें**
2. **जानकारी सत्यापित करें**
3. **अपना समय लें**
4. **परिवार को शामिल करें**
5. **रिपोर्ट सुविधा का उपयोग करें**`
  },
  // Family Discussions
  {
    id: 'fam-1',
    type: 'article',
    category: 'family-discussions',
    title: 'How to Involve Family Wisely',
    titleHi: 'परिवार को समझदारी से कैसे शामिल करें',
    description: 'Balancing family input with personal choice',
    descriptionHi: 'व्यक्तिगत पसंद के साथ पारिवारिक सलाह का संतुलन',
    duration: '7',
    content: `# How to Involve Family Wisely

## The Role of Family

In Indian culture, family involvement in marriage is natural and often helpful. But it needs to be balanced.

## Benefits of Family Involvement

✅ Experienced perspective
✅ Background verification help
✅ Emotional support
✅ Practical guidance
✅ Extended network

## Potential Pitfalls

❌ Too many opinions causing confusion
❌ Pressure to decide quickly
❌ Focus on status over compatibility
❌ Ignoring the primary person's wishes

## How to Balance

### 1. Set Clear Boundaries
Decide early what decisions are yours vs. family's

### 2. Choose Your Advisors
Not every relative needs to be involved. Select 2-3 trusted people.

### 3. Communicate Your Priorities
Help family understand what matters to you.

### 4. Take Final Decision Yourself
Listen to advice, but remember—you'll be living this life.

### 5. Have Pre-Meeting Discussions
Before meetings, align with parents on what to discuss.

## Handling Disagreements

If family disagrees with your choice:
1. Understand their concerns genuinely
2. Address specific objections calmly
3. Give them time to adjust
4. Seek help from a neutral family elder if needed`,
    contentHi: `# परिवार को समझदारी से कैसे शामिल करें

## परिवार की भूमिका

भारतीय संस्कृति में, शादी में परिवार की भागीदारी स्वाभाविक और अक्सर सहायक होती है। लेकिन इसे संतुलित करने की जरूरत है।

## परिवार की भागीदारी के लाभ

✅ अनुभवी दृष्टिकोण
✅ पृष्ठभूमि सत्यापन में मदद
✅ भावनात्मक समर्थन
✅ व्यावहारिक मार्गदर्शन

## संभावित समस्याएं

❌ बहुत अधिक राय से भ्रम
❌ जल्दी निर्णय लेने का दबाव
❌ संगतता पर स्थिति पर ध्यान

## कैसे संतुलित करें

### 1. स्पष्ट सीमाएं निर्धारित करें
### 2. अपने सलाहकार चुनें
### 3. अपनी प्राथमिकताएं संप्रेषित करें
### 4. अंतिम निर्णय खुद लें

## असहमति संभालना

अगर परिवार आपकी पसंद से असहमत है:
1. उनकी चिंताओं को वास्तव में समझें
2. विशिष्ट आपत्तियों को शांति से संबोधित करें
3. उन्हें समायोजित होने का समय दें`
  },
  // Relationship Basics
  {
    id: 'rel-1',
    type: 'article',
    category: 'relationship-basics',
    title: 'Compatibility vs Attraction',
    titleHi: 'संगतता बनाम आकर्षण',
    description: 'Why long-term compatibility matters more',
    descriptionHi: 'दीर्घकालिक संगतता अधिक महत्वपूर्ण क्यों है',
    duration: '5',
    content: `# Compatibility vs Attraction

## The Truth About Attraction

Initial attraction is important but not sufficient for a lasting marriage.

## What is Compatibility?

Compatibility is how well two people's:
- Values align
- Life goals match
- Communication styles work together
- Conflict resolution approaches mesh
- Daily habits coexist

## Why Compatibility Wins Long-Term

### Attraction
- Based on chemistry and novelty
- Fades over time
- Can be superficial
- Often ignores practical realities

### Compatibility
- Based on shared values and vision
- Deepens over time
- Addresses real-life challenges
- Builds lasting partnership

## The Ideal Combination

The best relationships have both:
1. Enough attraction to feel connected
2. Deep compatibility to build a life together

## How to Assess Compatibility

- Observe how they treat others
- Notice how you feel around them
- Discuss future plans openly
- See how disagreements are handled
- Meet their family and friends
- Spend time in different situations`,
    contentHi: `# संगतता बनाम आकर्षण

## आकर्षण के बारे में सच्चाई

शुरुआती आकर्षण महत्वपूर्ण है लेकिन स्थायी विवाह के लिए पर्याप्त नहीं है।

## संगतता क्या है?

संगतता यह है कि दो लोगों के:
- मूल्य कैसे मेल खाते हैं
- जीवन लक्ष्य कैसे मेल खाते हैं
- संवाद शैलियां कैसे एक साथ काम करती हैं
- संघर्ष समाधान दृष्टिकोण कैसे मेल खाते हैं

## दीर्घकालिक में संगतता क्यों जीतती है

### आकर्षण
- रसायन और नवीनता पर आधारित
- समय के साथ फीका पड़ जाता है

### संगतता
- साझा मूल्यों और दृष्टि पर आधारित
- समय के साथ गहरा होता है
- स्थायी साझेदारी बनाता है

## आदर्श संयोजन

सबसे अच्छे रिश्तों में दोनों होते हैं:
1. जुड़ाव महसूस करने के लिए पर्याप्त आकर्षण
2. एक साथ जीवन बनाने के लिए गहरी संगतता`
  }
]

export function LearningHub({ language, completedArticles, onArticleComplete }: LearningHubProps) {
  const t = translations[language]
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [selectedArticle, setSelectedArticle] = useState<LearningArticle | null>(null)
  
  const categories = ['all', 'self-awareness', 'communication', 'expectations', 'safety', 'family-discussions', 'relationship-basics'] as const
  
  const filteredArticles = selectedCategory === 'all' 
    ? learningArticles 
    : learningArticles.filter(a => a.category === selectedCategory)
  
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'self-awareness': return <Brain size={18} />
      case 'communication': return <ChatCircle size={18} />
      case 'expectations': return <Heart size={18} />
      case 'safety': return <ShieldCheck size={18} />
      case 'family-discussions': return <Users size={18} />
      case 'relationship-basics': return <Lightbulb size={18} />
      default: return <BookOpen size={18} />
    }
  }
  
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'article': return <Article size={16} />
      case 'video': return <VideoCamera size={16} />
      case 'infographic': return <Image size={16} />
      default: return <Article size={16} />
    }
  }
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-full">
              <BookOpen size={24} className="text-primary" weight="fill" />
            </div>
            <div>
              <CardTitle>{t.title}</CardTitle>
              <CardDescription>{t.subtitle}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <div className="text-sm text-muted-foreground mb-1">{t.progress}</div>
              <div className="flex items-center gap-2">
                <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-green-500 rounded-full transition-all"
                    style={{ width: `${(completedArticles.length / learningArticles.length) * 100}%` }}
                  />
                </div>
                <span className="text-sm font-medium">
                  {completedArticles.length}/{learningArticles.length}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Category Tabs */}
      <ScrollArea className="w-full">
        <div className="flex gap-2 pb-2">
          {categories.map(category => (
            <Button
              key={category}
              variant={selectedCategory === category ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedCategory(category)}
              className="whitespace-nowrap"
            >
              {getCategoryIcon(category)}
              <span className="ml-1">{t.categories[category]}</span>
            </Button>
          ))}
        </div>
      </ScrollArea>
      
      {/* Articles Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredArticles.map(article => {
          const isCompleted = completedArticles.includes(article.id)
          return (
            <Card 
              key={article.id} 
              className={`cursor-pointer transition-all hover:shadow-md ${isCompleted ? 'border-green-200 bg-green-50/50 dark:border-green-800 dark:bg-green-950/20' : ''}`}
              onClick={() => setSelectedArticle(article)}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="outline" className="text-xs">
                        {getCategoryIcon(article.category)}
                        <span className="ml-1">{t.categories[article.category]}</span>
                      </Badge>
                      {isCompleted && (
                        <Badge className="bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300">
                          <CheckCircle size={12} className="mr-1" />
                          {t.completed}
                        </Badge>
                      )}
                    </div>
                    <h4 className="font-semibold mb-1">
                      {language === 'en' ? article.title : article.titleHi}
                    </h4>
                    <p className="text-sm text-muted-foreground mb-2">
                      {language === 'en' ? article.description : article.descriptionHi}
                    </p>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      {getTypeIcon(article.type)}
                      <span className="flex items-center gap-1">
                        <Clock size={12} />
                        {article.duration} {t.minRead}
                      </span>
                    </div>
                  </div>
                  <ArrowRight size={20} className="text-muted-foreground mt-1" />
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
      
      {/* Article Dialog */}
      <Dialog open={!!selectedArticle} onOpenChange={() => setSelectedArticle(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
          {selectedArticle && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="outline">
                    {getCategoryIcon(selectedArticle.category)}
                    <span className="ml-1">{t.categories[selectedArticle.category]}</span>
                  </Badge>
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock size={12} />
                    {selectedArticle.duration} {t.minRead}
                  </span>
                </div>
                <DialogTitle>
                  {language === 'en' ? selectedArticle.title : selectedArticle.titleHi}
                </DialogTitle>
              </DialogHeader>
              
              <ScrollArea className="flex-1 pr-4">
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  <div 
                    className="whitespace-pre-line"
                    dangerouslySetInnerHTML={{ 
                      __html: (language === 'en' ? selectedArticle.content : selectedArticle.contentHi)
                        .replace(/^# (.+)$/gm, '<h1 class="text-xl font-bold mt-4 mb-2">$1</h1>')
                        .replace(/^## (.+)$/gm, '<h2 class="text-lg font-semibold mt-4 mb-2">$1</h2>')
                        .replace(/^### (.+)$/gm, '<h3 class="text-base font-medium mt-3 mb-1">$1</h3>')
                        .replace(/^- (.+)$/gm, '<li class="ml-4">$1</li>')
                        .replace(/^(\d+)\. (.+)$/gm, '<li class="ml-4">$2</li>')
                        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
                    }}
                  />
                </div>
              </ScrollArea>
              
              <div className="pt-4 border-t">
                {completedArticles.includes(selectedArticle.id) ? (
                  <Badge className="bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300">
                    <CheckCircle size={14} className="mr-1" />
                    {t.completed}
                  </Badge>
                ) : (
                  <Button onClick={() => {
                    onArticleComplete(selectedArticle.id)
                    setSelectedArticle(null)
                  }}>
                    <CheckCircle size={16} className="mr-2" />
                    {t.markComplete}
                  </Button>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
