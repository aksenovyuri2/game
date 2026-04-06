import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { AdvisorTip } from '@/engine/advisor'

interface AdvisorPanelProps {
  tips: AdvisorTip[]
}

const TYPE_STYLES = {
  warning: {
    bg: 'bg-amber-50/60 border-amber-200/30',
    icon: '⚠️',
    textColor: 'text-amber-800',
  },
  info: {
    bg: 'bg-blue-50/60 border-blue-200/30',
    icon: '💡',
    textColor: 'text-blue-800',
  },
  success: {
    bg: 'bg-emerald-50/60 border-emerald-200/30',
    icon: '✅',
    textColor: 'text-emerald-800',
  },
}

export function AdvisorPanel({ tips }: AdvisorPanelProps) {
  if (tips.length === 0) return null

  return (
    <Card className="border-indigo-200/20 bg-gradient-to-r from-indigo-50/30 to-purple-50/20">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <div className="size-7 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center shadow-sm">
            <span className="text-xs text-white">🧠</span>
          </div>
          Советник
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {tips.map((tip, i) => {
          const style = TYPE_STYLES[tip.type]
          return (
            <div key={i} className={`flex items-start gap-2.5 p-3 rounded-xl border ${style.bg}`}>
              <span className="text-sm mt-0.5 shrink-0">{style.icon}</span>
              <p className={`text-xs leading-relaxed ${style.textColor}`}>{tip.message}</p>
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}
