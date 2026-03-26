import { DEFAULT_CONFIG, type GameConfig } from './types'

/**
 * Переменная себестоимость на единицу.
 * Снижается с ростом оборудования (убывающая отдача).
 * Formula: baseCost / (1 + equipment / 500_000)
 */
export function calcVariableCostPerUnit(equipment: number, cfg: GameConfig): number {
  const baseVariableCost = cfg.baseVariableCost ?? DEFAULT_CONFIG.baseVariableCost ?? 12.0
  return baseVariableCost / (1 + Math.max(0, equipment) / 500000)
}

/**
 * Амортизация оборудования за период.
 */
export function calcDepreciation(equipment: number, cfg: GameConfig): number {
  const depreciationRate = cfg.depreciationRate ?? DEFAULT_CONFIG.depreciationRate ?? 0.08
  return Math.max(0, equipment) * depreciationRate
}

/**
 * Новая балансовая стоимость оборудования после периода.
 */
export function calcNewEquipment(
  prevEquipment: number,
  capitalInvestment: number,
  cfg: GameConfig
): number {
  const depreciationRate = cfg.depreciationRate ?? DEFAULT_CONFIG.depreciationRate ?? 0.08
  const afterDeprec = Math.max(0, prevEquipment) * (1 - depreciationRate)
  return afterDeprec + Math.max(0, capitalInvestment)
}

/**
 * Расходы на хранение остатков склада.
 */
export function calcStorageCost(endInventory: number, cfg: GameConfig): number {
  const storageCostPerUnit = cfg.storageCostPerUnit ?? DEFAULT_CONFIG.storageCostPerUnit ?? 1.5
  return Math.max(0, endInventory) * storageCostPerUnit
}

/**
 * Производственная себестоимость (переменная + постоянная).
 * Только фактически произведённые единицы.
 */
export function calcProductionCost(
  produced: number,
  variableCostPerUnit: number,
  cfg: GameConfig
): number {
  const fixedCosts = cfg.fixedCosts ?? DEFAULT_CONFIG.fixedCosts ?? 8000
  return Math.max(0, produced) * variableCostPerUnit + fixedCosts
}
