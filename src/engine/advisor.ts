import type { PeriodResult, CompanyState } from './types'

export interface AdvisorTip {
  type: 'warning' | 'info' | 'success'
  category: 'price' | 'production' | 'marketing' | 'capex' | 'rd' | 'finance' | 'market'
  message: string
  priority: number
}

export function generateAdvisorTips(
  playerResult: PeriodResult,
  playerState: CompanyState,
  allResults: PeriodResult[],
  prevResult?: PeriodResult
): AdvisorTip[] {
  const tips: AdvisorTip[] = []

  const avgPrice =
    allResults.reduce((s, r) => s + r.revenue / Math.max(r.unitsSold, 1), 0) / allResults.length

  // Market share drop
  if (prevResult && playerResult.marketShare < prevResult.marketShare - 0.05) {
    tips.push({
      type: 'warning',
      category: 'market',
      message:
        'Доля рынка значительно снизилась. Конкуренты предложили лучшие условия — рассмотрите снижение цены или увеличение маркетинга.',
      priority: 9,
    })
  }

  // Market share gain
  if (prevResult && playerResult.marketShare > prevResult.marketShare + 0.05) {
    tips.push({
      type: 'success',
      category: 'market',
      message: 'Отличная динамика! Ваша доля рынка растёт. Текущая стратегия работает.',
      priority: 5,
    })
  }

  // Inventory overstock
  if (playerResult.endInventory > playerResult.unitsSold * 2 && playerResult.endInventory > 200) {
    tips.push({
      type: 'warning',
      category: 'production',
      message: `Большой остаток на складе (${Math.round(playerResult.endInventory)} шт.). Сократите производство, чтобы снизить складские расходы и потери от порчи.`,
      priority: 8,
    })
  }

  // Stockout — high unmet demand
  if (playerResult.unmetDemand > playerResult.unitsSold * 0.3) {
    tips.push({
      type: 'warning',
      category: 'production',
      message:
        'Вы не смогли удовлетворить значительную часть спроса. Увеличьте производство или инвестируйте в мощности.',
      priority: 7,
    })
  }

  // Low cash warning
  const capex = playerState.decisions.capex ?? playerState.decisions.capitalInvestment ?? 0
  const totalSpend = playerState.decisions.marketing + capex + playerState.decisions.rd
  if (playerResult.newCash < totalSpend * 0.5 && playerResult.newCash < 15000) {
    tips.push({
      type: 'warning',
      category: 'finance',
      message:
        'Низкий уровень кассы. Есть риск автокредита с повышенной процентной ставкой. Рассмотрите сокращение расходов.',
      priority: 9,
    })
  }

  // Price significantly above average
  if (playerState.decisions.price > avgPrice * 1.3 && playerResult.marketShare < 0.15) {
    tips.push({
      type: 'info',
      category: 'price',
      message:
        'Ваша цена значительно выше средней по рынку. Это снижает спрос — рассмотрите более конкурентную цену.',
      priority: 7,
    })
  }

  // Price very low — margin warning
  if (
    playerState.decisions.price < playerResult.unitCost * 1.1 &&
    playerState.decisions.price > 0
  ) {
    tips.push({
      type: 'warning',
      category: 'price',
      message:
        'Цена близка к себестоимости. Маржа минимальна — убедитесь, что объём продаж компенсирует низкую наценку.',
      priority: 8,
    })
  }

  // Profit recovery
  if (prevResult && prevResult.netProfit < 0 && playerResult.netProfit > 0) {
    tips.push({
      type: 'success',
      category: 'finance',
      message: 'Компания вышла в прибыль! Хорошая работа — продолжайте в том же духе.',
      priority: 6,
    })
  }

  // First period guidance
  if (!prevResult) {
    tips.push({
      type: 'info',
      category: 'market',
      message:
        'Первый период — изучите результаты и скорректируйте стратегию. Ключевые показатели: доля рынка, чистая прибыль и MPI.',
      priority: 4,
    })
  }

  // Loan warning
  if (playerResult.newLoanBalance > 0) {
    tips.push({
      type: 'warning',
      category: 'finance',
      message: `У компании есть кредит (${Math.round(playerResult.newLoanBalance)} УДЕ). Процент ${playerResult.newCreditRating > 1.3 ? 'повышенный' : 'стандартный'} — старайтесь выплатить как можно быстрее.`,
      priority: 7,
    })
  }

  // R&D milestone hints
  const rdThresholds = [25000, 50000, 75000, 100000]
  for (const threshold of rdThresholds) {
    if (
      playerResult.newRdAccumulated >= threshold &&
      (!prevResult || (prevResult.newRdAccumulated ?? 0) < threshold)
    ) {
      tips.push({
        type: 'success',
        category: 'rd',
        message: `Исследования достигли порога ${threshold / 1000}K! Качество продукции значительно выросло.`,
        priority: 8,
      })
    }
  }

  // Leading position
  const sortedByMPI = [...allResults].sort((a, b) => b.mpi - a.mpi)
  const playerRank = sortedByMPI.findIndex((r) => r.companyId === playerState.id) + 1
  if (playerRank === 1 && allResults.length > 1) {
    tips.push({
      type: 'success',
      category: 'market',
      message:
        'Вы лидируете по MPI! Удерживайте позицию — не допускайте резких изменений стратегии.',
      priority: 5,
    })
  }

  // Sort by priority descending, return top 3
  return tips.sort((a, b) => b.priority - a.priority).slice(0, 3)
}
