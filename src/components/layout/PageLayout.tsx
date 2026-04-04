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
    <div className="min-h-screen bg-background bg-mesh flex flex-col">
      <header className="border-b border-white/40 glass-strong sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center gap-4">
          {showBack && (
            <Button variant="ghost" size="sm" onClick={() => navigate(backTo)}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="mr-1">
                <path
                  d="M10 12L6 8L10 4"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              Назад
            </Button>
          )}
          <div
            className="flex items-center gap-2.5 cursor-pointer"
            onClick={() => navigate('home')}
          >
            <div className="size-9 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-md shadow-primary/20">
              <span className="text-primary-foreground font-bold text-sm">B</span>
            </div>
            <span className="font-bold text-lg tracking-tight text-foreground">BizSim</span>
          </div>
          {title && (
            <>
              <span className="text-muted-foreground/30">/</span>
              <span className="text-sm font-medium text-muted-foreground">{title}</span>
            </>
          )}
          <div className="ml-auto flex items-center gap-2">
            {phase !== 'idle' && (
              <Button variant="ghost" size="sm" onClick={() => navigate('help')}>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="mr-1">
                  <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.5" />
                  <path
                    d="M6.5 6.5C6.5 5.67 7.17 5 8 5C8.83 5 9.5 5.67 9.5 6.5C9.5 7.17 9 7.5 8.5 7.75C8.17 7.92 8 8.25 8 8.5V9"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  />
                  <circle cx="8" cy="10.5" r="0.5" fill="currentColor" />
                </svg>
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
