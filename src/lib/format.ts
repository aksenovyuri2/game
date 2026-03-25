/** Форматирование числа как УДЕ (условные денежные единицы) */
export function formatMoney(value: number): string {
  return new Intl.NumberFormat('ru-RU', {
    maximumFractionDigits: 0,
  }).format(Math.round(value))
}

/** Форматирование числа как УДЕ с символом */
export function formatMoneySign(value: number): string {
  return `${formatMoney(value)} УДЕ`
}

/** Форматирование доли рынка в % */
export function formatPercent(value: number, decimals = 1): string {
  return `${(value * 100).toFixed(decimals)}%`
}

/** Форматирование количества единиц */
export function formatUnits(value: number): string {
  return new Intl.NumberFormat('ru-RU').format(Math.round(value))
}

/** Форматирование MPI */
export function formatMPI(value: number): string {
  return value.toFixed(1)
}

/** Цвет для числа (зелёный / красный / нейтральный) */
export function profitColorClass(value: number): string {
  if (value > 0) return 'text-green-600'
  if (value < 0) return 'text-red-600'
  return 'text-muted-foreground'
}
