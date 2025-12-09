import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useKV } from '@github/spark/hooks'
import { Database, CheckCircle } from '@phosphor-icons/react'
import { toast } from 'sonner'
import type { WeddingService } from '@/types/profile'

export function AdminPanel() {
  const [weddingServices, setWeddingServices] = useKV<WeddingService[]>('wedding-services', [])

  const addSampleWeddingServices = () => {
    const sampleServices: WeddingService[] = [
      {
        id: 'ws-1',
        category: 'venue',
        businessName: 'रॉयल पैलेस बैंक्वेट हॉल',
        contactPerson: 'राजेश कुमार',
        mobile: '+91 98765 43210',
        email: 'royal.palace@email.com',
        address: 'सेक्टर 18, नोएडा',
        city: 'नोएडा',
        state: 'उत्तर प्रदेश',
        description: '500 से 1500 मेहमानों के लिए शानदार बैंक्वेट हॉल। AC हॉल, पार्किंग, डेकोरेशन सुविधा उपलब्ध।',
        priceRange: '₹2,00,000 - ₹8,00,000',
        rating: 4.5,
        reviewCount: 87,
        verificationStatus: 'verified',
        createdAt: new Date().toISOString(),
        consultationFee: 200
      },
      {
        id: 'ws-2',
        category: 'caterer',
        businessName: 'स्वाद कैटरर्स',
        contactPerson: 'अमित शर्मा',
        mobile: '+91 98111 22334',
        email: 'swad.caterers@email.com',
        address: 'कनॉट प्लेस',
        city: 'दिल्ली',
        state: 'दिल्ली',
        description: 'उत्तर भारतीय, साउथ इंडियन, चाइनीज़ व्यंजन। 100 से 5000 लोगों के लिए कैटरिंग।',
        priceRange: '₹500 - ₹1,500 प्रति प्लेट',
        rating: 4.7,
        reviewCount: 142,
        verificationStatus: 'verified',
        createdAt: new Date().toISOString(),
        consultationFee: 200
      },
      {
        id: 'ws-3',
        category: 'photographer',
        businessName: 'कैप्चर मोमेंट्स स्टूडियो',
        contactPerson: 'विकास पटेल',
        mobile: '+91 99887 76655',
        email: 'capture.moments@email.com',
        address: 'अंधेरी वेस्ट',
        city: 'मुंबई',
        state: 'महाराष्ट्र',
        description: 'शादी फोटोग्राफी और सिनेमेटोग्राफी। ड्रोन शूटिंग, प्री-वेडिंग शूट, वेडिंग एल्बम।',
        priceRange: '₹50,000 - ₹3,00,000',
        rating: 4.8,
        reviewCount: 95,
        verificationStatus: 'verified',
        createdAt: new Date().toISOString(),
        consultationFee: 200
      },
      {
        id: 'ws-4',
        category: 'decorator',
        businessName: 'ड्रीम डेकोर',
        contactPerson: 'प्रिया अग्रवाल',
        mobile: '+91 97654 32109',
        email: 'dream.decor@email.com',
        address: 'वसंत विहार',
        city: 'दिल्ली',
        state: 'दिल्ली',
        description: 'थीम बेस्ड डेकोरेशन, स्टेज डेकोर, लाइटिंग, फ्लावर डेकोरेशन।',
        priceRange: '₹1,00,000 - ₹10,00,000',
        rating: 4.6,
        reviewCount: 73,
        verificationStatus: 'verified',
        createdAt: new Date().toISOString(),
        consultationFee: 200
      },
      {
        id: 'ws-5',
        category: 'mehandi',
        businessName: 'आर्ट ऑफ मेहँदी',
        contactPerson: 'नीता देसाई',
        mobile: '+91 98222 11333',
        email: 'art.mehandi@email.com',
        address: 'जे पी नगर',
        city: 'बेंगलुरु',
        state: 'कर्नाटक',
        description: 'ब्राइडल मेहँदी, अरेबिक डिजाइन, इंडियन ट्रेडिशनल डिजाइन। 10+ वर्ष का अनुभव।',
        priceRange: '₹5,000 - ₹50,000',
        rating: 4.9,
        reviewCount: 156,
        verificationStatus: 'verified',
        createdAt: new Date().toISOString(),
        consultationFee: 200
      },
      {
        id: 'ws-6',
        category: 'makeup',
        businessName: 'ग्लैमर मेकअप स्टूडियो',
        contactPerson: 'सोनिया खन्ना',
        mobile: '+91 98765 11222',
        email: 'glamour.makeup@email.com',
        address: 'बांद्रा',
        city: 'मुंबई',
        state: 'महाराष्ट्र',
        description: 'ब्राइडल मेकअप, एयरब्रश मेकअप, हेयर स्टाइलिंग। मैक, एस्टी लॉडर प्रोडक्ट्स।',
        priceRange: '₹15,000 - ₹1,50,000',
        rating: 4.7,
        reviewCount: 89,
        verificationStatus: 'verified',
        createdAt: new Date().toISOString(),
        consultationFee: 200
      },
      {
        id: 'ws-7',
        category: 'dj',
        businessName: 'बीट्स एंड बास DJ',
        contactPerson: 'रोहित मल्होत्रा',
        mobile: '+91 98111 99888',
        email: 'beats.bass@email.com',
        address: 'सेक्टर 29',
        city: 'गुड़गांव',
        state: 'हरियाणा',
        description: 'प्रोफेशनल DJ, साउंड सिस्टम, लाइटिंग। बॉलीवुड, पंजाबी, EDM म्यूजिक।',
        priceRange: '₹30,000 - ₹2,00,000',
        rating: 4.5,
        reviewCount: 64,
        verificationStatus: 'verified',
        createdAt: new Date().toISOString(),
        consultationFee: 200
      },
      {
        id: 'ws-8',
        category: 'priest',
        businessName: 'पंडित विजय शास्त्री',
        contactPerson: 'विजय शास्त्री',
        mobile: '+91 99123 45678',
        email: 'pandit.vijay@email.com',
        address: 'वाराणसी',
        city: 'वाराणसी',
        state: 'उत्तर प्रदेश',
        description: 'हिंदू विवाह संस्कार, सभी रीति-रिवाज की जानकारी। 25+ वर्ष का अनुभव।',
        priceRange: '₹11,000 - ₹51,000',
        rating: 4.9,
        reviewCount: 201,
        verificationStatus: 'verified',
        createdAt: new Date().toISOString(),
        consultationFee: 200
      },
      {
        id: 'ws-9',
        category: 'card-designer',
        businessName: 'एलिगेंट इनवाइट्स',
        contactPerson: 'अंजलि वर्मा',
        mobile: '+91 98777 66555',
        email: 'elegant.invites@email.com',
        address: 'कोरामंगला',
        city: 'बेंगलुरु',
        state: 'कर्नाटक',
        description: 'कस्टम वेडिंग इनविटेशन कार्ड्स। डिजिटल और प्रिंटेड कार्ड्स उपलब्ध।',
        priceRange: '₹50 - ₹500 प्रति कार्ड',
        rating: 4.6,
        reviewCount: 78,
        verificationStatus: 'verified',
        createdAt: new Date().toISOString(),
        consultationFee: 200
      },
      {
        id: 'ws-10',
        category: 'choreographer',
        businessName: 'डांस विद ग्रेस',
        contactPerson: 'रीना सिंह',
        mobile: '+91 98333 22111',
        email: 'dance.grace@email.com',
        address: 'इंदिरा नगर',
        city: 'लखनऊ',
        state: 'उत्तर प्रदेश',
        description: 'वेडिंग कोरियोग्राफी, संगीत सेरेमनी, मेहँदी फंक्शन डांस।',
        priceRange: '₹20,000 - ₹1,50,000',
        rating: 4.7,
        reviewCount: 52,
        verificationStatus: 'verified',
        createdAt: new Date().toISOString(),
        consultationFee: 200
      }
    ]

    setWeddingServices(sampleServices)
    toast.success('सैंपल डेटा जोड़ा गया!', {
      description: '10 विवाह सेवा प्रदाता जोड़े गए।'
    })
  }

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database size={24} weight="fill" />
          एडमिन पैनल
        </CardTitle>
        <CardDescription>
          सैंपल डेटा को जोड़ने के लिए बटन का उपयोग करें
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between p-4 border rounded-lg">
          <div>
            <div className="font-medium">विवाह सेवाएं</div>
            <div className="text-sm text-muted-foreground">
              {weddingServices?.length || 0} सेवाएं उपलब्ध
            </div>
          </div>
          <Button onClick={addSampleWeddingServices}>
            <CheckCircle size={18} weight="fill" className="mr-2" />
            सैंपल जोड़ें
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
