export interface Breakthrough {
  id: string
  title: string
  description: string
  threshold: number
  icon: string
}

export const BREAKTHROUGHS: Breakthrough[] = [
  {
    id: 'rd-1',
    title: 'Улучшение материалов',
    description:
      'Исследования привели к открытию новых материалов. Переменная себестоимость снижается, качество продукции растёт.',
    threshold: 25000,
    icon: '🧪',
  },
  {
    id: 'rd-2',
    title: 'Автоматизация производства',
    description:
      'Внедрение автоматизированных процессов повышает эффективность производства и снижает брак.',
    threshold: 50000,
    icon: '🤖',
  },
  {
    id: 'rd-3',
    title: 'Инновационный дизайн',
    description:
      'Прорыв в дизайне продукции — бренд получает значительный бонус к репутации. Покупатели готовы платить больше.',
    threshold: 75000,
    icon: '✨',
  },
  {
    id: 'rd-4',
    title: 'Революционная технология',
    description:
      'Фундаментальный прорыв! Ваша продукция выходит на новый технологический уровень. Максимальное преимущество по качеству.',
    threshold: 100000,
    icon: '🚀',
  },
]

/**
 * Проверяет, какие прорывы были достигнуты в текущем периоде.
 * Возвращает только новые прорывы (не достигнутые ранее).
 */
export function checkBreakthroughs(
  prevRdAccumulated: number,
  newRdAccumulated: number,
  alreadyAchievedIds: string[]
): Breakthrough[] {
  const alreadySet = new Set(alreadyAchievedIds)
  return BREAKTHROUGHS.filter(
    (b) =>
      newRdAccumulated >= b.threshold && prevRdAccumulated < b.threshold && !alreadySet.has(b.id)
  )
}
