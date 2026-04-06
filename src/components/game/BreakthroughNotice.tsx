import { Card, CardContent } from '@/components/ui/card'
import type { Breakthrough } from '@/engine/breakthroughs'

interface BreakthroughNoticeProps {
  breakthroughs: Breakthrough[]
}

export function BreakthroughNotice({ breakthroughs }: BreakthroughNoticeProps) {
  if (breakthroughs.length === 0) return null

  return (
    <div className="space-y-3 mb-5">
      {breakthroughs.map((b) => (
        <Card
          key={b.id}
          className="border-primary/30 bg-gradient-to-r from-primary/5 to-purple-500/5 glow-primary animate-slide-up"
        >
          <CardContent className="py-5 text-center">
            <div className="text-4xl mb-2 animate-float">{b.icon}</div>
            <p className="text-xs text-primary font-bold uppercase tracking-wider mb-1">
              Прорыв в исследованиях
            </p>
            <p className="text-lg font-bold text-gradient">{b.title}</p>
            <p className="text-sm text-muted-foreground mt-2 max-w-md mx-auto leading-relaxed">
              {b.description}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
