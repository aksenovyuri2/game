import type { GameConfig } from './types'

/**
 * Переменная себестоимость на единицу.
 * Снижается с ростом оборудования (убывающая отдача).
 * Formula: baseCost / (1 + equipment / 500_000)
 */
export function calcVariableCostPerUnit(equipment: number, cfg: GameConfig): number {
  return cfg.baseVariableCost / (1 + Math.max(0, equipment) / 500000)
}

/**
 * Амортизация оборудования за период.
 */
export function calcDepreciation(equipment: number, cfg: GameConfig): number {
  return Math.max(0, equipment) * cfg.depreciationRate
}

/**
 * Новая балансовая стоимость оборудования после периода.
 */
export function calcNewEquipment(
  prevEquipment: number,
  capitalInvestment: number,
  cfg: GameConfig
): number {
  const afterDeprec = Math.max(0, prevEquipment) * (1 - cfg.depreciationRate)
  return afterDeprec + Math.max(0, capitalInvestment)
}

/**
 * Расходы на хранение остатков склада.
 */
export function calcStorageCost(endInventory: number, cfg: GameConfig): number {
  return Math.max(0, endInventory) * cfg.storageCostPerUnit
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
  return Math.max(0, produced) * variableCostPerUnit + cfg.fixedCosts
}
