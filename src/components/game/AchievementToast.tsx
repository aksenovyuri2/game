import { useEffect, useRef, useState } from 'react'
import type { Achievement } from '@/engine/achievements'
import { useAchievementsStore } from '@/store/achievementsStore'

export function AchievementToast() {
  const newlyUnlocked = useAchievementsStore((s) => s.newlyUnlocked)
  const clearNewlyUnlocked = useAchievementsStore((s) => s.clearNewlyUnlocked)
  const [visible, setVisible] = useState<Achievement[]>([])
  const showingRef = useRef(false)

  useEffect(() => {
    if (newlyUnlocked.length > 0 && !showingRef.current) {
      showingRef.current = true
      // Use a microtask to batch state updates and avoid synchronous setState in effect
      queueMicrotask(() => {
        setVisible(newlyUnlocked)
      })
      const timer = setTimeout(() => {
        showingRef.current = false
        setVisible([])
        clearNewlyUnlocked()
      }, 5000)
      return () => clearTimeout(timer)
    }
    return undefined
  }, [newlyUnlocked, clearNewlyUnlocked])

  if (visible.length === 0) return null

  return (
    <div className="fixed top-20 right-4 z-50 space-y-2 animate-slide-up">
      {visible.map((a) => (
        <div
          key={a.id}
          className="glass-strong border border-primary/20 rounded-2xl shadow-xl shadow-primary/10 px-5 py-4 max-w-xs"
        >
          <div className="flex items-center gap-3">
            <span className="text-2xl">{a.icon}</span>
            <div>
              <p className="text-[10px] text-primary font-bold uppercase tracking-wider">
                Достижение
              </p>
              <p className="text-sm font-bold">{a.title}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{a.description}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
