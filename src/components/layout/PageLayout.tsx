import type { ReactNode } from 'react'
import { useNavigation } from '@/app/router'
import { useGameStore } from '@/store/gameStore'
import { Button } from '@/components/ui/button'

interface PageLayoutProps {
  children: ReactNode
  title?: string
  showBack?: boolean
  backTo?: import('@/app/router').Screen
}

export function PageLayout({ children, title, showBack, backTo = 'home' }: PageLayoutProps) {
  const { navigate } = useNavigation()
  const phase = useGameStore((s) => s.phase)

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b bg-card sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center gap-4">
          {showBack && (
            <Button variant="ghost" size="sm" onClick={() => navigate(backTo)}>
              ← Назад
            </Button>
          )}
          <span className="font-bold text-lg text-foreground">BizSim</span>
          {title && (
            <>
              <span className="text-muted-foreground">/</span>
              <span className="text-sm text-muted-foreground">{title}</span>
            </>
          )}
          <div className="ml-auto flex items-center gap-2">
            {phase !== 'idle' && (
              <Button variant="ghost" size="sm" onClick={() => navigate('help')}>
                Справка
              </Button>
            )}
          </div>
        </div>
      </header>
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-6">{children}</main>
    </div>
  )
}
