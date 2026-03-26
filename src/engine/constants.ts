// Производство и оборудование
export const BASE_CAPACITY = 1000
export const INITIAL_EQUIPMENT = 100000
export const DEPRECIATION_RATE = 0.08
export const CAPACITY_SENSITIVITY = 0.35

// R&D
export const RD_DEPRECIATION = 0.05
export const MAX_RD_EFFICIENCY = 0.3
export const RD_EFFICIENCY_SCALE = 100000

// Себестоимость
export const BASE_FIXED_COSTS = 8000
export const MAINTENANCE_RATE = 0.02
export const BASE_VARIABLE_COST = 10.0
export const MAX_SCALE_DISCOUNT = 0.2
export const OVERTIME_COST_MULTIPLIER = 0.5
export const OVERTIME_FIXED_PENALTY = 3.0

// Спрос
export const BASE_DEMAND_PER_COMPANY = 1000

// CAS — веса
export const W_PRICE = 0.35
export const W_MKT = 0.25
export const W_QUALITY = 0.2
export const W_BRAND = 0.2

// CAS — priceScore
export const ELASTICITY_EXPONENT = 1.3

// CAS — marketingScore
export const MKTG_MAX = 100.0
export const MKTG_HALF = 6000.0
export const RELATIVE_MKT_WEIGHT = 10.0

// CAS — qualityScore
export const Q_MAX = 100.0
export const Q_HALF = 15000.0

// Бренд
export const BRAND_RETENTION = 0.9
export const BRAND_MKT_CAP = 3.0
export const BRAND_QUALITY_CAP = 2.0
export const DAMAGE_STOCKOUT = 15.0
export const DAMAGE_OVERPRICE = 5.0
export const DAMAGE_QUALITY_DROP = 3.0

// Продажи
export const REDISTRIBUTION_RATE = 0.6
export const SPOILAGE_RATE = 0.05
export const HOLDING_COST_PER_UNIT = 1.5

// Финансы
export const TAX_RATE = 0.25
export const INTEREST_RATE = 0.06
export const MAX_LOAN_RATIO = 0.8
export const LOAN_BUFFER = 5000
export const REPAYMENT_THRESHOLD = 20000

// Абсолютная кривая спроса (ценовая эластичность)
export const PRICE_OPTIMAL = 40
export const PRICE_ELASTICITY_K = 0.04
export const PRICE_ABSOLUTE_WEIGHT = 0.6
export const PRICE_RELATIVE_WEIGHT = 0.4

// Маркетинг — S-кривая (логистическая)
export const MKTG_THRESHOLD = 2000
export const MKTG_MIDPOINT = 8000
export const MKTG_STEEPNESS = 0.0005

// R&D — S-кривая
export const RD_MIDPOINT = 50000
export const RD_STEEPNESS = 0.00004
export const MIN_RD_STEP = 0.001

// CapEx — S-кривая для capacity
export const CAPEX_MIDPOINT = 145800
export const CAPEX_STEEPNESS = 0.00002

// Рыночный порог (для 100% capture)
export const CAS_DOMINANCE_EXPONENT = 2.0

// Стартовый капитал — пресеты
export const STARTING_CASH_LOW = 30000
export const STARTING_CASH_MEDIUM = 50000
export const STARTING_CASH_HIGH = 80000

// MPI — веса (6 компонент)
export const W_RE = 0.3
export const W_DP = 0.15
export const W_SP = 0.15
export const W_PR = 0.1
export const W_MS = 0.15
export const W_GR = 0.15
