import { PageLayout } from '@/components/layout/PageLayout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useAchievementsStore } from '@/store/achievementsStore'
import { ACHIEVEMENTS } from '@/engine/achievements'
import { useState } from 'react'

const CATEGORY_LABELS: Record<string, { label: string; icon: string }> = {
  gameplay: { label: 'Геймплей', icon: '🎮' },
  mastery: { label: 'Мастерство', icon: '🏆' },
  challenge: { label: 'Испытания', icon: '⚔️' },
  exploration: { label: 'Исследование', icon: '🗺️' },
}

export default function StatsScreen() {
  const stats = useAchievementsStore((s) => s.stats)
  const unlockedIds = useAchievementsStore((s) => s.unlockedIds)
  const resetAll = useAchievementsStore((s) => s.resetAll)
  const [confirmReset, setConfirmReset] = useState(false)

  const unlockedSet = new Set(unlockedIds)
  const categories = ['gameplay', 'mastery', 'challenge', 'exploration'] as const

  const winRate = stats.gamesPlayed > 0 ? Math.round((stats.gamesWon / stats.gamesPlayed) * 100) : 0

  return (
    <PageLayout title="Статистика" showBack>
      <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
        <div>
          <h1 className="text-2xl font-bold">Карьера менеджера</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Ваш прогресс и достижения за все игры
          </p>
        </div>

        {/* Career stats */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <span className="size-6 rounded-lg bg-primary/10 flex items-center justify-center text-sm">
                📊
              </span>
              Статистика карьеры
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <StatBlock label="Игр сыграно" value={String(stats.gamesPlayed)} />
              <StatBlock label="Побед" value={String(stats.gamesWon)} accent />
              <StatBlock label="Винрейт" value={`${winRate}%`} />
              <StatBlock label="Лучший MPI" value={stats.highestMPI.toFixed(0)} accent />
              <StatBlock
                label="Лучшее место"
                value={stats.bestRank < 99 ? `#${stats.bestRank}` : '—'}
              />
              <StatBlock label="Серия побед" value={String(stats.longestWinStreak)} />
              <StatBlock label="Периодов пройдено" value={String(stats.totalPeriodsPlayed)} />
              <StatBlock
                label="Суммарная прибыль"
                value={`${Math.round(stats.totalProfit / 1000)}K`}
              />
              <StatBlock label="Банкротства" value={String(stats.bankruptcies)} />
            </div>
          </CardContent>
        </Card>

        {/* Achievements */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <span className="size-6 rounded-lg bg-primary/10 flex items-center justify-center text-sm">
                🏅
              </span>
              Достижения
              <span className="text-xs text-muted-foreground font-normal bg-muted px-2 py-0.5 rounded-full">
                {unlockedIds.length}/{ACHIEVEMENTS.length}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            {categories.map((cat) => {
              const catInfo = CATEGORY_LABELS[cat]
              const catAchievements = ACHIEVEMENTS.filter((a) => a.category === cat)
              return (
                <div key={cat}>
                  <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground/60 mb-2 flex items-center gap-1.5">
                    <span>{catInfo?.icon}</span>
                    {catInfo?.label}
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {catAchievements.map((a) => {
                      const unlocked = unlockedSet.has(a.id)
                      return (
                        <div
                          key={a.id}
                          className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                            unlocked
                              ? 'border-primary/20 bg-primary/3'
                              : 'border-border/20 bg-muted/10 opacity-50'
                          }`}
                        >
                          <span className={`text-xl ${unlocked ? '' : 'grayscale'}`}>{a.icon}</span>
                          <div className="min-w-0">
                            <p
                              className={`text-sm font-semibold truncate ${unlocked ? '' : 'text-muted-foreground'}`}
                            >
                              {a.title}
                            </p>
                            <p className="text-xs text-muted-foreground truncate">
                              {a.description}
                            </p>
                          </div>
                          {unlocked && (
                            <svg
                              width="16"
                              height="16"
                              viewBox="0 0 16 16"
                              fill="none"
                              className="shrink-0 ml-auto"
                            >
                              <circle cx="8" cy="8" r="7" fill="hsl(250 85% 60%)" opacity="0.15" />
                              <path
                                d="M5 8L7 10L11 6"
                                stroke="hsl(250 85% 60%)"
                                strokeWidth="1.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </CardContent>
        </Card>

        {/* Reset */}
        <Card>
          <CardContent className="py-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Сбросить прогресс</p>
              <p className="text-xs text-muted-foreground">Удалить все достижения и статистику</p>
            </div>
            {confirmReset ? (
              <div className="flex gap-2">
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => {
                    resetAll()
                    setConfirmReset(false)
                  }}
                >
                  Сбросить
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setConfirmReset(false)}>
                  Отмена
                </Button>
              </div>
            ) : (
              <Button variant="outline" size="sm" onClick={() => setConfirmReset(true)}>
                Сбросить
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    </PageLayout>
  )
}

function StatBlock({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="p-3 rounded-xl bg-muted/20 border border-border/30">
      <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{label}</p>
      <p className={`text-lg font-bold font-mono mt-0.5 ${accent ? 'text-gradient' : ''}`}>
        {value}
      </p>
    </div>
  )
}
