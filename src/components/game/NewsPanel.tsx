import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import type { ActiveEvent, EventCategory } from '@/engine/types'

const CATEGORY_CONFIG: Record<EventCategory, { icon: string; label: string }> = {
  economy: { icon: '💰', label: 'Экономика' },
  technology: { icon: '🔬', label: 'Технологии' },
  social: { icon: '👥', label: 'Общество' },
  regulation: { icon: '🏛️', label: 'Регулирование' },
  industry: { icon: '🏭', label: 'Отрасль' },
}

function getEventCategory(eventId: string): EventCategory {
  if (eventId.startsWith('econ-')) return 'economy'
  if (eventId.startsWith('tech-')) return 'technology'
  if (eventId.startsWith('social-')) return 'social'
  if (eventId.startsWith('reg-')) return 'regulation'
  if (eventId.startsWith('ind-')) return 'industry'
  return 'economy'
}

function pluralPeriods(n: number): string {
  if (n === 1) return 'период'
  if (n >= 2 && n <= 4) return 'периода'
  return 'периодов'
}

function pluralEvents(n: number): string {
  if (n === 1) return 'событие'
  if (n >= 2 && n <= 4) return 'события'
  return 'событий'
}

function EffectBadge({ label, positive }: { label: string; positive: boolean }): React.JSX.Element {
  return (
    <span
      className={`inline-block text-[10px] font-medium px-1.5 py-0.5 rounded-md ${
        positive
          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
          : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
      }`}
    >
      {label}
    </span>
  )
}

function EventEffectBadges({ event }: { event: ActiveEvent }): React.JSX.Element {
  const badges: React.JSX.Element[] = []
  const e = event.effects

  if (e.demandMultiplier !== undefined && e.demandMultiplier !== 1) {
    const pct = Math.round((e.demandMultiplier - 1) * 100)
    badges.push(
      <EffectBadge key="demand" label={`Спрос ${pct > 0 ? '+' : ''}${pct}%`} positive={pct > 0} />
    )
  }
  if (e.variableCostMult !== undefined && e.variableCostMult !== 1) {
    const pct = Math.round((e.variableCostMult - 1) * 100)
    badges.push(
      <EffectBadge
        key="varcost"
        label={`Себест. ${pct > 0 ? '+' : ''}${pct}%`}
        positive={pct < 0}
      />
    )
  }
  if (e.fixedCostMult !== undefined && e.fixedCostMult !== 1) {
    const pct = Math.round((e.fixedCostMult - 1) * 100)
    badges.push(
      <EffectBadge
        key="fixcost"
        label={`Пост. расх. ${pct > 0 ? '+' : ''}${pct}%`}
        positive={pct < 0}
      />
    )
  }
  if (e.storageCostMult !== undefined && e.storageCostMult !== 1) {
    const pct = Math.round((e.storageCostMult - 1) * 100)
    badges.push(
      <EffectBadge key="storage" label={`Склад ${pct > 0 ? '+' : ''}${pct}%`} positive={pct < 0} />
    )
  }
  if (e.priceElasticityMod !== undefined && e.priceElasticityMod !== 0) {
    badges.push(
      <EffectBadge
        key="elasticity"
        label={e.priceElasticityMod > 0 ? 'Цена важнее' : 'Цена менее важна'}
        positive={e.priceElasticityMod < 0}
      />
    )
  }
  if (e.marketingAlphaMod !== undefined && e.marketingAlphaMod !== 0) {
    badges.push(
      <EffectBadge
        key="marketing"
        label={e.marketingAlphaMod > 0 ? 'Маркетинг эффективнее' : 'Маркетинг слабее'}
        positive={e.marketingAlphaMod > 0}
      />
    )
  }
  if (e.rdBetaMod !== undefined && e.rdBetaMod !== 0) {
    badges.push(
      <EffectBadge
        key="rd"
        label={e.rdBetaMod > 0 ? 'R&D эффективнее' : 'R&D слабее'}
        positive={e.rdBetaMod > 0}
      />
    )
  }

  return <div className="flex flex-wrap gap-1 mt-1.5">{badges}</div>
}

interface NewsPanelProps {
  activeEvents: ActiveEvent[]
  newEvents: ActiveEvent[]
  currentPeriod: number
}

export function NewsPanel({
  activeEvents,
  newEvents,
  currentPeriod,
}: NewsPanelProps): React.JSX.Element | null {
  const [expanded, setExpanded] = useState(false)

  if (activeEvents.length === 0) return null

  const newEventIds = new Set(newEvents.map((e) => e.eventId))
  const ongoingEvents = activeEvents.filter((e) => !newEventIds.has(e.eventId))

  return (
    <Card className="mb-5 border-amber-200/50 bg-gradient-to-r from-amber-50/50 to-orange-50/30 dark:from-amber-950/20 dark:to-orange-950/10">
      <CardContent className="py-4 px-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-lg">📰</span>
            <h3 className="font-bold text-sm">Новости периода {currentPeriod}</h3>
            <span className="text-[10px] bg-amber-200/70 text-amber-800 px-1.5 py-0.5 rounded-full font-medium">
              {activeEvents.length} {pluralEvents(activeEvents.length)}
            </span>
          </div>
          {ongoingEvents.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="text-xs h-7"
              onClick={() => setExpanded(!expanded)}
            >
              {expanded ? 'Скрыть' : `Все события (${activeEvents.length})`}
            </Button>
          )}
        </div>

        {/* Новые события — всегда показываем */}
        {newEvents.length > 0 && (
          <div className="space-y-2.5">
            {newEvents.map((event) => {
              const category = getEventCategory(event.eventId)
              const cfg = CATEGORY_CONFIG[category]
              return (
                <div
                  key={event.eventId}
                  className="p-3 rounded-xl bg-white/70 dark:bg-white/5 border border-amber-200/40"
                >
                  <div className="flex items-start gap-2">
                    <span className="text-base mt-0.5">{cfg.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-sm">{event.title}</span>
                        <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                          {cfg.label}
                        </span>
                        <span className="text-[10px] text-amber-600 font-medium">НОВОЕ</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                        {event.description}
                      </p>
                      <div className="flex items-center gap-2 mt-1.5">
                        <span className="text-[10px] text-muted-foreground">
                          ≈ {event.remainingPeriods} {pluralPeriods(event.remainingPeriods)}
                        </span>
                      </div>
                      <EventEffectBadges event={event} />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Текущие события — по кнопке */}
        {expanded && ongoingEvents.length > 0 && (
          <div className="space-y-2 mt-3 pt-3 border-t border-amber-200/40">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium mb-1">
              Действующие события
            </p>
            {ongoingEvents.map((event) => {
              const category = getEventCategory(event.eventId)
              const cfg = CATEGORY_CONFIG[category]
              return (
                <div
                  key={event.eventId}
                  className="p-2.5 rounded-lg bg-white/50 dark:bg-white/5 border border-muted/40"
                >
                  <div className="flex items-start gap-2">
                    <span className="text-sm mt-0.5">{cfg.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-xs">{event.title}</span>
                        <span className="text-[10px] text-muted-foreground">
                          ещё {event.remainingPeriods} пер.
                        </span>
                      </div>
                      <EventEffectBadges event={event} />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Если нет новых, но есть текущие — показываем подсказку */}
        {newEvents.length === 0 && activeEvents.length > 0 && !expanded && (
          <p className="text-xs text-muted-foreground">
            Новых событий нет. {activeEvents.length} {pluralEvents(activeEvents.length)} продолжа
            {activeEvents.length === 1 ? 'ет' : 'ют'} действовать.
          </p>
        )}
      </CardContent>
    </Card>
  )
}
