import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { useOnboardingStore, type TipId } from '@/store/onboardingStore'

type ArrowPosition = 'top' | 'bottom' | 'left' | 'right'

interface BubbleTipProps {
  id: TipId
  children: ReactNode
  content: string
  /** Где стрелка пузыря указывает (top = стрелка сверху, пузырь ниже элемента) */
  arrow?: ArrowPosition
  /** Показывать порядковый номер шага */
  step?: number
  totalSteps?: number
  /** Callback при нажатии «Далее» */
  onNext?: () => void
}

const ARROW_CLASSES: Record<ArrowPosition, string> = {
  top: 'bottom-full left-1/2 -translate-x-1/2 mb-3',
  bottom: 'top-full left-1/2 -translate-x-1/2 mt-3',
  left: 'right-full top-1/2 -translate-y-1/2 mr-3',
  right: 'left-full top-1/2 -translate-y-1/2 ml-3',
}

const CARET: Record<ArrowPosition, string> = {
  top: 'top-full left-1/2 -translate-x-1/2 border-t-primary border-x-transparent border-b-transparent border-8',
  bottom:
    'bottom-full left-1/2 -translate-x-1/2 border-b-primary border-x-transparent border-t-transparent border-8',
  left: 'left-full top-1/2 -translate-y-1/2 border-l-primary border-y-transparent border-r-transparent border-8',
  right:
    'right-full top-1/2 -translate-y-1/2 border-r-primary border-y-transparent border-l-transparent border-8',
}

export function BubbleTip({
  id,
  children,
  content,
  arrow = 'top',
  step,
  totalSteps,
  onNext,
}: BubbleTipProps) {
  const activeTip = useOnboardingStore((s) => s.activeTip)
  const dismiss = useOnboardingStore((s) => s.dismiss)
  const dismissed = useOnboardingStore((s) => s.isDismissed(id))
  const [visible, setVisible] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout>>(null)

  const isActive = activeTip === id && !dismissed

  useEffect(() => {
    if (isActive) {
      timerRef.current = setTimeout(() => setVisible(true), 150)
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [isActive])

  // Скрываем когда подсказка деактивируется
  useEffect(() => {
    if (!isActive && visible) {
      const t = setTimeout(() => setVisible(false), 0)
      return () => clearTimeout(t)
    }
    return undefined
  }, [isActive, visible])

  const handleDismiss = useCallback(() => {
    setVisible(false)
    setTimeout(() => {
      dismiss(id)
      if (onNext) onNext()
    }, 200)
  }, [dismiss, id, onNext])

  return (
    <div className="relative">
      {children}
      {isActive && (
        <div
          className={`absolute z-50 ${ARROW_CLASSES[arrow]} transition-all duration-200 ${
            visible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
          }`}
        >
          <div className="relative bg-primary text-primary-foreground rounded-xl shadow-xl shadow-primary/20 px-4 py-3 max-w-[280px] min-w-[200px]">
            {/* Каретка-стрелка */}
            <div className={`absolute w-0 h-0 ${CARET[arrow]}`} />

            <p className="text-sm leading-relaxed">{content}</p>

            <div className="flex items-center justify-between mt-2.5 gap-3">
              {step !== undefined && totalSteps !== undefined ? (
                <span className="text-xs text-primary-foreground/60">
                  {step}/{totalSteps}
                </span>
              ) : (
                <span />
              )}
              <button
                onClick={handleDismiss}
                className="text-xs font-semibold bg-primary-foreground/20 hover:bg-primary-foreground/30 rounded-lg px-3 py-1 transition-colors cursor-pointer"
              >
                {onNext ? 'Далее →' : 'Понятно'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
