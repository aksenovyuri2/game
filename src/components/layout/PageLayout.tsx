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
      <header className="border-b bg-card/80 backdrop-blur-md sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center gap-4">
          {showBack && (
            <Button variant="ghost" size="sm" onClick={() => navigate(backTo)}>
              ← Назад
            </Button>
          )}
          <div className="flex items-center gap-2">
            <div className="size-8 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">B</span>
            </div>
            <span className="font-bold text-lg tracking-tight text-foreground">BizSim</span>
          </div>
          {title && (
            <>
              <span className="text-muted-foreground/50">/</span>
              <span className="text-sm font-medium text-muted-foreground">{title}</span>
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
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 py-8">{children}</main>
    </div>
  )
}
