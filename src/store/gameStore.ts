import { create } from 'zustand'
import { runPeriod, createInitialCompanyState } from '../engine/simulation'
import { calcMacroFactor } from '../engine/market'
import { createAIPlayer, assignAICharacters } from '../ai/difficulty'
import {
  DEFAULT_CONFIG,
  INITIAL_COMPANY_STATE,
  type AICharacter,
  type CompanyState,
  type Decisions,
  type Difficulty,
  type GameConfig,
  type MarketScenario,
  type MarketState,
  type SimulationPeriodResult,
} from '../engine/types'

export type GamePhase = 'idle' | 'deciding' | 'period-result' | 'game-over'

const AI_NAMES = ['Прогресс', 'Восток', 'Меридиан', 'Альфа', 'Гарант', 'Вектор', 'Горизонт']

export interface NewGameParams {
  playerName: string
  difficulty: Difficulty
  scenario: MarketScenario
  totalPeriods: number
  aiCount: number
}

interface GameState {
  config: GameConfig | null
  companies: CompanyState[]
  playerCompanyId: string | null
  currentPeriod: number
  phase: GamePhase
  periodHistory: SimulationPeriodResult[]
  lastPeriodResult: SimulationPeriodResult | null
  gameSeed: number

  initGame: (params: NewGameParams) => void
  submitDecisions: (decisions: Decisions) => void
  continueToNextPeriod: () => void
  resetGame: () => void
  setPlayerDecisions: (decisions: Partial<Decisions>) => void
}

export const useGameStore = create<GameState>((set, get) => ({
  config: null,
  companies: [],
  playerCompanyId: null,
  currentPeriod: 1,
  phase: 'idle',
  periodHistory: [],
  lastPeriodResult: null,
  gameSeed: 1,

  initGame: (params) => {
    const seed = Date.now() % 10000
    const config: GameConfig = {
      ...DEFAULT_CONFIG,
      difficulty: params.difficulty,
      scenario: params.scenario,
      totalPeriods: params.totalPeriods,
      aiCount: params.aiCount,
    }

    const playerCompanyId = 'player'
    const player = createInitialCompanyState({
      id: playerCompanyId,
      name: params.playerName || 'Моя компания',
      isHuman: true,
    })

    const aiCharacters: AICharacter[] = assignAICharacters(params.aiCount, params.difficulty, seed)
    const aiCompanies: CompanyState[] = aiCharacters.map((character, i) => ({
      ...createInitialCompanyState({
        id: `ai-${i}`,
        name: AI_NAMES[i % AI_NAMES.length] ?? `Компания ${i + 1}`,
        isHuman: false,
        aiCharacter: character,
      }),
    }))

    set({
      config,
      companies: [player, ...aiCompanies],
      playerCompanyId,
      currentPeriod: 1,
      phase: 'deciding',
      periodHistory: [],
      lastPeriodResult: null,
      gameSeed: seed,
    })
  },

  submitDecisions: (playerDecisions) => {
    const { config, companies, playerCompanyId, currentPeriod, periodHistory, gameSeed } = get()
    if (!config || !playerCompanyId) return

    const prevPeriodResult = periodHistory[periodHistory.length - 1]

    // Обновляем решения игрока
    const updatedCompanies = companies.map((c) =>
      c.id === playerCompanyId ? { ...c, decisions: playerDecisions } : c
    )

    // AI принимает решения
    const withAIDecisions = updatedCompanies.map((c) => {
      if (c.isHuman || !c.aiCharacter) return c
      const ai = createAIPlayer(c.aiCharacter, config.difficulty)
      const competitorDecisions = prevPeriodResult
        ? prevPeriodResult.results
            .filter((r) => r.companyId !== c.id)
            .map((r) => {
              const prevCompany = prevPeriodResult.updatedCompanyStates.find(
                (s) => s.id !== r.companyId
              )
              return prevCompany?.decisions ?? INITIAL_COMPANY_STATE.decisions
            })
        : undefined

      const aiDecisions = ai.makeDecisions({
        companyState: c,
        marketState: buildMarketState(config, currentPeriod, gameSeed),
        cfg: config,
        competitorDecisions,
        history: periodHistory
          .map((p) => p.updatedCompanyStates.find((s) => s.id === c.id))
          .filter(Boolean) as CompanyState[],
      })
      return { ...c, decisions: aiDecisions }
    })

    const market = buildMarketState(config, currentPeriod, gameSeed)
    const result = runPeriod(withAIDecisions, market, config)

    set({
      companies: result.updatedCompanyStates,
      periodHistory: [...periodHistory, result],
      lastPeriodResult: result,
      phase: 'period-result',
    })
  },

  continueToNextPeriod: () => {
    const { currentPeriod, config } = get()
    if (!config) return
    const next = currentPeriod + 1
    if (next > config.totalPeriods) {
      set({ phase: 'game-over' })
    } else {
      set({ currentPeriod: next, phase: 'deciding' })
    }
  },

  resetGame: () =>
    set({
      config: null,
      companies: [],
      playerCompanyId: null,
      currentPeriod: 1,
      phase: 'idle',
      periodHistory: [],
      lastPeriodResult: null,
    }),

  setPlayerDecisions: (partial) => {
    const { companies, playerCompanyId } = get()
    set({
      companies: companies.map((c) =>
        c.id === playerCompanyId ? { ...c, decisions: { ...c.decisions, ...partial } } : c
      ),
    })
  },
}))

function buildMarketState(cfg: GameConfig, period: number, seed: number): MarketState {
  return {
    period,
    totalPeriods: cfg.totalPeriods,
    scenario: cfg.scenario,
    macroFactor: calcMacroFactor(cfg.scenario, period, seed),
    baseMarketSize: cfg.baseMarketSize,
  }
}
