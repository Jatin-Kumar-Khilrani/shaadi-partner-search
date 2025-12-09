import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { BookOpen, Heart, ShieldCheck, UsersThree } from '@phosphor-icons/react'
import type { Resource } from '@/types/profile'

interface ResourcesProps {
  resources: Resource[]
}

const categoryInfo = {
  traditions: { label: 'परंपराएं', icon: <Heart size={20} weight="fill" />, color: 'bg-accent/20 text-accent' },
  gotra: { label: 'गोत्र मिलान', icon: <UsersThree size={20} weight="fill" />, color: 'bg-teal/20 text-teal' },
  advice: { label: 'सलाह', icon: <BookOpen size={20} weight="fill" />, color: 'bg-primary/20 text-primary' },
  safety: { label: 'सुरक्षा', icon: <ShieldCheck size={20} weight="fill" />, color: 'bg-destructive/20 text-destructive' }
}

export function Resources({ resources }: ResourcesProps) {
  const groupedByCategory = resources.reduce((acc, resource) => {
    if (!acc[resource.category]) {
      acc[resource.category] = []
    }
    acc[resource.category].push(resource)
    return acc
  }, {} as Record<string, Resource[]>)

  return (
    <div className="container mx-auto px-4 md:px-8 py-12">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            संसाधन और मार्गदर्शन
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            सिंधी विवाह परंपराओं, गोत्र मिलान और सुरक्षित रिश्तों के बारे में जानें
          </p>
        </div>

        <div className="space-y-12">
          {Object.entries(groupedByCategory).map(([category, categoryResources]) => {
            const info = categoryInfo[category as keyof typeof categoryInfo]
            return (
              <div key={category}>
                <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                  <div className={`p-2 rounded-lg ${info.color}`}>
                    {info.icon}
                  </div>
                  {info.label}
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {categoryResources.map((resource) => (
                    <Card key={resource.id} className="hover:shadow-lg transition-shadow cursor-pointer group">
                      <CardHeader>
                        <div className="flex items-start justify-between gap-2">
                          <CardTitle className="group-hover:text-primary transition-colors">
                            {resource.title}
                          </CardTitle>
                          <Badge variant="outline" className={info.color}>
                            {info.label}
                          </Badge>
                        </div>
                        <CardDescription className="line-clamp-2">
                          {resource.description}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground line-clamp-3">
                          {resource.content}
                        </p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
