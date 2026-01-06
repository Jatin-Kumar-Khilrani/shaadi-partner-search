import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Phone, MapPin, User } from '@phosphor-icons/react'
import type { TeamMember } from '@/types/profile'

interface TeamDirectoryProps {
  members: TeamMember[]
}

export function TeamDirectory({ members }: TeamDirectoryProps) {
  const groupedByCity = members.reduce((acc, member) => {
    if (!acc[member.city]) {
      acc[member.city] = []
    }
    acc[member.city].push(member)
    return acc
  }, {} as Record<string, TeamMember[]>)

  return (
    <div className="container mx-auto px-4 md:px-8 py-12">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            विशेषज्ञ सहायता टीम
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            हमारे अनुभवी पेशेवर परिवारों की सहायता करते हैं
          </p>
        </div>

        <div className="space-y-8">
          {Object.entries(groupedByCity).map(([city, cityMembers]) => (
            <div key={city}>
              <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                <MapPin size={24} weight="fill" className="text-primary" />
                {city}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {cityMembers.map((member) => (
                  <Card key={member.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <User size={20} weight="fill" />
                        {member.name}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground mb-3">{member.role}</p>
                      <Button variant="outline" size="sm" className="w-full" asChild>
                        <a href={`tel:${member.mobile}`}>
                          <Phone size={16} className="mr-2" />
                          {member.mobile}
                        </a>
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>

        <Card className="mt-12 bg-accent/10 border-accent">
          <CardContent className="pt-6">
            <h3 className="font-bold text-xl mb-4">🧘‍♀️ सामाजिक पहल</h3>
            <ul className="space-y-2 text-muted-foreground">
              <li>• सामूहिक परिचय सम्मेलन — हर माह विभिन्न शहरों में</li>
              <li>• ऑनलाइन परिचय सत्र — Zoom/Google Meet के माध्यम से</li>
              <li>• वैवाहिक परामर्श — अनुभवी परामर्शदाताओं द्वारा निःशुल्क</li>
              <li>• गोत्र मिलान सहायता — पारंपरिक ज्ञान का संरक्षण</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
