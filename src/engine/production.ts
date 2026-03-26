import {
  DEPRECIATION_RATE,
  RD_DEPRECIATION,
  BASE_FIXED_COSTS,
  MAINTENANCE_RATE,
  BASE_VARIABLE_COST,
  MAX_RD_EFFICIENCY,
  MAX_SCALE_DISCOUNT,
  OVERTIME_COST_MULTIPLIER,
  CAPEX_MIDPOINT,
  CAPEX_STEEPNESS,
  RD_MIDPOINT,
  RD_STEEPNESS,
  MIN_RD_STEP,
} from './constants'

export interface UnitCostResult {
  unitCost: number
  variableCostPerUnit: number
  fixedCostPerUnit: number
  rdEfficiency: number
  scaleDiscount: number
  overtimePenalty: number
}

/**
 * Обновляет стоимость оборудования с учётом амортизации и капитальных инвестиций.
 * Этап 2 конвейера.
 */
export function calcEquipment(prevEquipment: number, capex: number): number {
  const result = prevEquipment * (1 - DEPRECIATION_RATE) + capex
  return Math.max(result, 0)
}

/**
 * Рассчитывает производственную мощность на основе оборудования.
 * S-кривая (логистическая): медленный рост → быстрый → плато.
 * Clamp: [200, 3000]
 */
export function calcCapacity(equipment: number): number {
  const MIN_CAP = 200
  const MAX_CAP = 3000
  // Логистическая S-кривая
  const rawCapacity =
    MIN_CAP + (MAX_CAP - MIN_CAP) / (1 + Math.exp(-CAPEX_STEEPNESS * (equipment - CAPEX_MIDPOINT)))
  return Math.max(MIN_CAP, Math.min(MAX_CAP, Math.round(rawCapacity)))
}

/**
 * Обновляет накопленный R&D-капитал с учётом устаревания.
 */
export function calcRdAccumulated(prevRdAccumulated: number, rdSpend: number): number {
  const result = prevRdAccumulated * (1 - RD_DEPRECIATION) + rdSpend
  return Math.max(result, 0)
}

/**
 * Рассчитывает себестоимость единицы продукции.
 */
export function calcUnitCost(
  production: number,
  capacity: number,
  equipment: number,
  rdAccumulated: number
): UnitCostResult {
  // Постоянные затраты
  const maintenanceCost = equipment * MAINTENANCE_RATE
  const totalFixedCosts = BASE_FIXED_COSTS + maintenanceCost
  const fixedCostPerUnit = totalFixedCosts / Math.max(production, 1)

  // R&D эффективность — S-кривая с минимальным шагом
  let rdEfficiency: number
  if (rdAccumulated <= 0) {
    rdEfficiency = 0
  } else {
    const rawEff = MAX_RD_EFFICIENCY / (1 + Math.exp(-RD_STEEPNESS * (rdAccumulated - RD_MIDPOINT)))
    rdEfficiency = Math.max(MIN_RD_STEP, rawEff)
  }

  // Переменные затраты
  const rawVariableCost = BASE_VARIABLE_COST * (1 - rdEfficiency)

  // Эффект масштаба
  const utilizationRate = production / Math.max(capacity, 1)
  const scaleDiscount = Math.min(MAX_SCALE_DISCOUNT, MAX_SCALE_DISCOUNT * utilizationRate)

  // Штраф за сверхурочные
  let overtimePenalty = 1.0
  if (production > capacity) {
    const overtimeRatio = (production - capacity) / capacity
    overtimePenalty = 1.0 + OVERTIME_COST_MULTIPLIER * overtimeRatio
  }

  const variableCostPerUnit = rawVariableCost * (1 - scaleDiscount) * overtimePenalty
  const unitCost = Math.max(1.0, fixedCostPerUnit + variableCostPerUnit)

  return {
    unitCost,
    variableCostPerUnit,
    fixedCostPerUnit,
    rdEfficiency,
    scaleDiscount,
    overtimePenalty,
  }
}
