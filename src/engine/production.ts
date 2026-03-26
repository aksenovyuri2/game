import {
  DEPRECIATION_RATE,
  INITIAL_EQUIPMENT,
  BASE_CAPACITY,
  CAPACITY_SENSITIVITY,
  RD_DEPRECIATION,
  BASE_FIXED_COSTS,
  MAINTENANCE_RATE,
  BASE_VARIABLE_COST,
  MAX_RD_EFFICIENCY,
  RD_EFFICIENCY_SCALE,
  MAX_SCALE_DISCOUNT,
  OVERTIME_COST_MULTIPLIER,
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
 * capacity = BASE_CAPACITY × (1 + CAPACITY_SENSITIVITY × ln(max(capitalRatio, 0.1)))
 * Clamp: [200, 3000]
 */
export function calcCapacity(equipment: number): number {
  const capitalRatio = equipment / INITIAL_EQUIPMENT
  const capacityMultiplier = 1 + CAPACITY_SENSITIVITY * Math.log(Math.max(capitalRatio, 0.1))
  const capacity = BASE_CAPACITY * capacityMultiplier
  return Math.max(200, Math.min(3000, capacity))
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

  // R&D эффективность
  const rdEfficiency = Math.min(MAX_RD_EFFICIENCY, rdAccumulated / RD_EFFICIENCY_SCALE)

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
