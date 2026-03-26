import type { CoachInsight, CriticalMoment, MoveClassification, ParsedGame, PhaseScore, PlayerSide, SessionAgendaItem, StyleFingerprint, TrainingBlock } from '../../types/coaching'
import { materialEdgeForSide } from './pgn'

interface StyleMetrics {
  initiative: number
  structure: number
  tacticalAppetite: number
  conversion: number
  developmentScore: number
  castledByMove: number | null
  maxLead: number
  minLead: number
  swingiestPhase: 'opening' | 'middlegame' | 'endgame'
  openingSignal: 'dynamic' | 'solid' | 'flexible'
}

function clamp(value: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, value))
}

function rate(value: number, total: number) {
  if (!total) {
    return 0
  }

  return value / total
}

function fileIsFlank(square: string) {
  return ['a', 'b', 'g', 'h'].includes(square[0]!)
}

function enteredEnemyHalf(side: PlayerSide, square: string) {
  const rank = Number(square[1])
  return side === 'white' ? rank >= 5 : rank <= 4
}

function developmentStartingSquares(side: PlayerSide) {
  return side === 'white'
    ? new Set(['b1', 'g1', 'c1', 'f1'])
    : new Set(['b8', 'g8', 'c8', 'f8'])
}

function deriveOpeningSignal(opening: string): StyleMetrics['openingSignal'] {
  const lower = opening.toLowerCase()
  const dynamicKeywords = ['benoni', 'grünfeld', 'grunfeld', 'sicilian', 'king', 'tarrasch', 'pirc']
  const solidKeywords = ['slav', 'caro', 'queen', 'london', 'italian', 'petroff']

  if (dynamicKeywords.some((keyword) => lower.includes(keyword))) {
    return 'dynamic'
  }

  if (solidKeywords.some((keyword) => lower.includes(keyword))) {
    return 'solid'
  }

  return 'flexible'
}

export function deriveStyleMetrics(game: ParsedGame): StyleMetrics {
  const playerColor = game.coachedSide === 'white' ? 'w' : 'b'
  const playerMoves = game.moves.filter((move) => move.color === playerColor)
  const starterSquares = developmentStartingSquares(game.coachedSide)
  const developedPieces = new Set<string>()

  let castledByMove: number | null = null
  let maxLead = Number.NEGATIVE_INFINITY
  let minLead = Number.POSITIVE_INFINITY
  const phaseSwings = {
    opening: 0,
    middlegame: 0,
    endgame: 0,
  }

  const captureCount = playerMoves.filter((move) => move.isCapture).length
  const checkCount = playerMoves.filter((move) => move.isCheck).length
  const flankPawnPushes = playerMoves.filter(
    (move) => move.piece === 'p' && fileIsFlank(move.from) && enteredEnemyHalf(game.coachedSide, move.to),
  ).length
  const centralPawnMoves = playerMoves.filter(
    (move) => move.piece === 'p' && ['c', 'd', 'e', 'f'].includes(move.from[0]!),
  ).length

  for (const move of playerMoves) {
    if (starterSquares.has(move.from)) {
      developedPieces.add(move.from)
    }

    if (move.isCastle && castledByMove === null) {
      castledByMove = move.moveNumber
    }

    const edgeBefore = materialEdgeForSide(move.materialBefore, game.coachedSide)
    const edgeAfter = materialEdgeForSide(move.materialAfter, game.coachedSide)
    maxLead = Math.max(maxLead, edgeAfter)
    minLead = Math.min(minLead, edgeAfter)
    phaseSwings[move.phase] += Math.abs(edgeAfter - edgeBefore)
  }

  const totalMoves = Math.max(playerMoves.length, 1)
  const developmentScore = clamp(((developedPieces.size + (castledByMove ? 1 : 0)) / 5) * 100)
  const openingSignal = deriveOpeningSignal(game.opening)

  const initiative = clamp(
    rate(captureCount, totalMoves) * 34 * 100 +
      rate(checkCount, totalMoves) * 28 * 100 +
      rate(flankPawnPushes, totalMoves) * 24 * 100 +
      (openingSignal === 'dynamic' ? 14 : 4),
  )

  const structure = clamp(
    developmentScore * 0.42 +
      (castledByMove !== null ? Math.max(0, 26 - castledByMove * 2) : 0) +
      rate(centralPawnMoves, totalMoves) * 18 * 100 +
      (openingSignal === 'solid' ? 12 : 0),
  )

  const tacticalAppetite = clamp(
    rate(captureCount + checkCount, totalMoves * 2) * 55 * 100 +
      rate(flankPawnPushes, totalMoves) * 16 * 100 +
      (openingSignal === 'dynamic' ? 18 : 6),
  )

  let conversion = 48
  if (game.outcome === 'win') {
    conversion += maxLead >= 3 ? 26 : 16
  }
  if (game.outcome === 'loss') {
    conversion -= minLead <= -3 ? 16 : 8
  }
  conversion += castledByMove !== null && castledByMove <= 8 ? 6 : 0
  conversion = clamp(conversion)

  const swingiestPhase =
    phaseSwings.opening >= phaseSwings.middlegame && phaseSwings.opening >= phaseSwings.endgame
      ? 'opening'
      : phaseSwings.middlegame >= phaseSwings.endgame
        ? 'middlegame'
        : 'endgame'

  return {
    initiative,
    structure,
    tacticalAppetite,
    conversion,
    developmentScore,
    castledByMove,
    maxLead: Number.isFinite(maxLead) ? maxLead : 0,
    minLead: Number.isFinite(minLead) ? minLead : 0,
    swingiestPhase,
    openingSignal,
  }
}

function archetypeFromMetrics(metrics: StyleMetrics) {
  if (metrics.initiative >= 68 && metrics.tacticalAppetite >= 64) {
    return 'Dynamic initiative hunter'
  }

  if (metrics.structure >= 68 && metrics.conversion >= 60) {
    return 'Technical pressure builder'
  }

  if (metrics.structure >= 60 && metrics.initiative >= 56) {
    return 'Balanced strategic competitor'
  }

  if (metrics.initiative >= 60 && metrics.conversion >= 58) {
    return 'Counterpunching practical player'
  }

  return 'Flexible competitive improver'
}

export function buildStyleFingerprint(metrics: StyleMetrics): StyleFingerprint {
  const archetype = archetypeFromMetrics(metrics)
  const openingLean =
    metrics.openingSignal === 'dynamic'
      ? ['Imbalanced openings', 'Counterplay over symmetry', 'Active piece play']
      : metrics.openingSignal === 'solid'
        ? ['Stable structures', 'Clear plans', 'Controlled simplification']
        : ['Flexible setups', 'Adaptable plans', 'Practical decision-making']

  return {
    archetype,
    summary:
      metrics.initiative >= metrics.structure
        ? 'You naturally steer the game toward active, winnable positions and look comfortable when the board gives you room to create threats.'
        : 'Your game already has a strategic spine. The strongest positions happen when development, structure, and practical simplification line up.',
    coachHook:
      metrics.initiative >= 62
        ? 'Coaching should sharpen your attack timing without sanding down the initiative that makes your game dangerous.'
        : 'Coaching should preserve your strategic clarity while adding more bite in the moments where the game can be seized outright.',
    openingLean,
    meters: [
      {
        label: 'Initiative',
        score: Math.round(metrics.initiative),
        note: 'How quickly you push the game toward active questions and forcing decisions.',
      },
      {
        label: 'Structure',
        score: Math.round(metrics.structure),
        note: 'How often your development and pawn skeleton give the position a clear backbone.',
      },
      {
        label: 'Tactical appetite',
        score: Math.round(metrics.tacticalAppetite),
        note: 'How willingly you enter lines that demand calculation and practical accuracy.',
      },
      {
        label: 'Conversion',
        score: Math.round(metrics.conversion),
        note: 'How reliably advantages turn into cleaner positions, safer wins, or practical pressure.',
      },
    ],
  }
}

export function buildStrengths(game: ParsedGame, metrics: StyleMetrics): CoachInsight[] {
  const strengths: CoachInsight[] = []

  if (metrics.initiative >= 60) {
    strengths.push({
      title: 'You play for the initiative instead of waiting for permission',
      detail:
        'Your games do not drift. The move choices and opening selection keep asking the opponent practical questions, which is exactly the kind of edge a strong competitor should preserve.',
    })
  }

  if (metrics.structure >= 58) {
    strengths.push({
      title: 'There is usually a stable platform under the tactics',
      detail:
        'Even in sharper positions, your development and central logic often give the game a shape. That makes your best ideas easier to repeat and coach.',
    })
  }

  if (game.outcome === 'win' || metrics.conversion >= 60) {
    strengths.push({
      title: 'When the advantage appears, you know how to make it matter',
      detail:
        'The strongest moments in these games are not random tactics. They turn into cleaner positions, simpler decisions, or direct pressure that the opponent has to respect.',
    })
  }

  if (strengths.length < 3) {
    strengths.push({
      title: 'Your opening choices fit a strength-first training model',
      detail:
        'The current repertoire already points toward an identity. That is valuable because we can coach around what your game wants to become instead of forcing a generic curriculum.',
    })
  }

  return strengths.slice(0, 3)
}

export function buildLeaks(game: ParsedGame, metrics: StyleMetrics): CoachInsight[] {
  const leaks: CoachInsight[] = []

  if (!metrics.castledByMove || metrics.castledByMove > 9) {
    leaks.push({
      title: 'The game can sharpen before your king has a settled home',
      detail:
        'That is a real cost for an initiative-driven player. The stronger you get, the more often fast opponents will punish any delay between ambition and king safety.',
    })
  }

  if (metrics.initiative >= 62 && metrics.structure < 54) {
    leaks.push({
      title: 'The attack can start one tempo before the position is fully organized',
      detail:
        'This is not a style problem. It is a sequencing problem. The next level is learning which preparatory moves make your active ideas far more resilient.',
    })
  }

  if (game.outcome === 'loss' || metrics.swingiestPhase === 'middlegame') {
    leaks.push({
      title: 'The middlegame decision filter needs to get calmer',
      detail:
        'Most rating jumps at this level come from better candidate-move discipline, not more memorization. You want cleaner choices in the first position where the game becomes irreversible.',
    })
  }

  if (metrics.conversion < 58) {
    leaks.push({
      title: 'Advantages should collapse into simpler wins more often',
      detail:
        'The point is not to become passive. The point is to recognize the exact moment where you can cash some of the chaos in for a position that is easier to play every move after that.',
    })
  }

  return leaks.slice(0, 3)
}

export function buildTrainingPlan(metrics: StyleMetrics, leaks: CoachInsight[]): TrainingBlock[] {
  const baseBlocks: TrainingBlock[] = [
    {
      title: 'Opening-to-middlegame conversion',
      why:
        'Your openings are already leading to workable positions. The next gain comes from reaching move 12 with a cleaner plan, safer king, and clearer piece roles.',
      drills: [
        'Annotate one model game from your opening each week and write the middlegame plan in one sentence',
        'Play two training positions from move 10 onward with the clock set to 8 minutes',
        'Review only the first irreversible decision after development is complete',
      ],
      target: 'Leave the opening with a plan, not just a playable position.',
    },
    {
      title: 'Candidate-move discipline',
      why:
        'The fastest way to reduce practical leaks is to force one extra layer of checking before committing in sharp positions.',
      drills: [
        'For every critical position, name three candidates before calculating',
        'Use a short blunder-check script: checks, captures, forcing replies, king safety',
        'Solve tactics in sets where you must explain the loser move, not only the winning one',
      ],
      target: 'Slow the game down at the exact moment where the position can swing.',
    },
    {
      title: 'Strength-first weapon building',
      why:
        'Your best coaching path is not generic balance. It is making your natural initiative sharper while protecting it with better structure.',
      drills: [
        'Collect three personal model positions that show your favorite type of pressure',
        'Build one reusable attacking pattern file from your own games',
        'End each week by writing what kind of position you want to aim for more often',
      ],
      target: 'Turn style into a reliable competitive weapon.',
    },
  ]

  if (metrics.conversion < 58) {
    baseBlocks[2] = {
      title: 'Advantage conversion and simplification',
      why:
        'A strength-first player still needs a clean gear for moments where the position no longer needs maximum tension.',
      drills: [
        'Replay winning endings and stop before each simplifying decision',
        'Practice conversion from plus-two material against the engine with reduced time',
        'Write down one rule for when to trade queens, one for when to keep them',
      ],
      target: 'Convert plus positions without giving the initiative back.',
    }
  }

  if (leaks.length && leaks[0]!.title.includes('king')) {
    baseBlocks[0] = {
      title: 'King safety before ignition',
      why:
        'Your strongest positions happen when activity starts after the king and key pieces are already coordinated.',
      drills: [
        'Review ten games and mark the exact move where castling should have happened',
        'Train one opening line where the first strategic goal is king safety, not direct activity',
        'Pause before every flank pawn push and ask whether development is finished',
      ],
      target: 'Make aggression safer without making it slower.',
    }
  }

  return baseBlocks
}

export function buildSessionAgenda(game: ParsedGame, metrics: StyleMetrics): SessionAgendaItem[] {
  return [
    {
      title: 'Style map',
      detail: `Name the version of your game that already works. For this sample, it looks most like a ${archetypeFromMetrics(metrics).toLowerCase()}.`,
    },
    {
      title: 'Point of no return',
      detail:
        'Walk through the first position where the game becomes irreversible and decide what the calmer, stronger version of your move selection looked like there.',
    },
    {
      title: 'Model game mirror',
      detail:
        `Compare this game to one model from the ${game.opening} family so the plan is anchored in a position you are likely to reach again.`,
    },
    {
      title: 'Homework lock-in',
      detail:
        'Finish with one tactical drill, one annotated model game, and one replay task tied directly to the leak that showed up in this report.',
    },
  ]
}

export function buildHeuristicPhaseScores(game: ParsedGame, metrics: StyleMetrics): PhaseScore[] {
  const openingScore = clamp(
    44 + metrics.developmentScore * 0.34 + (metrics.castledByMove && metrics.castledByMove <= 8 ? 8 : 0),
  )
  const middlegameScore = clamp(42 + metrics.initiative * 0.28 + metrics.tacticalAppetite * 0.18)
  const endgameScore = clamp(40 + metrics.conversion * 0.38 + (game.outcome === 'win' ? 6 : 0))

  return [
    {
      phase: 'opening',
      score: Math.round(openingScore),
      caption: 'Measures how cleanly development becomes a usable middlegame plan.',
      basis: 'heuristic',
    },
    {
      phase: 'middlegame',
      score: Math.round(middlegameScore),
      caption: 'Tracks practical decision quality once the position gets sharp or imbalanced.',
      basis: 'heuristic',
    },
    {
      phase: 'endgame',
      score: Math.round(endgameScore),
      caption: 'Estimates how well the game moves from edge to conversion when simplification appears.',
      basis: 'heuristic',
    },
  ]
}

function classificationFromSwing(swing: number): MoveClassification {
  if (swing >= 300) {
    return 'blunder'
  }

  if (swing >= 170) {
    return 'mistake'
  }

  if (swing >= 80) {
    return 'inaccuracy'
  }

  if (swing >= 25) {
    return 'solid'
  }

  return 'strong'
}

export function buildHeuristicCriticalMoments(game: ParsedGame): CriticalMoment[] {
  const playerColor = game.coachedSide === 'white' ? 'w' : 'b'

  return game.moves
    .filter((move) => move.color === playerColor)
    .map((move) => {
      const edgeBefore = materialEdgeForSide(move.materialBefore, game.coachedSide)
      const edgeAfter = materialEdgeForSide(move.materialAfter, game.coachedSide)
      const cpl = Math.round(Math.abs(edgeAfter - edgeBefore) * 100)
      const severity = classificationFromSwing(cpl)
      return {
        ply: move.ply,
        moveNumber: move.moveNumber,
        san: move.san,
        title:
          severity === 'strong'
            ? 'The game starts bending your way'
            : severity === 'solid'
              ? 'This move keeps the pressure alive'
              : 'This is the point where the game changes character',
        explanation:
          cpl >= 100
            ? 'The material and practical balance shifts enough here that the next coaching conversation should start from this position.'
            : 'This move is worth replaying because it either keeps the pressure alive or shows where the plan became easier to improve.',
        severity,
        cpl,
        phase: move.phase,
        fenAfter: move.afterFen,
      }
    })
    .sort((left, right) => right.cpl - left.cpl)
    .slice(0, 4)
}

export function buildActionChecklist(metrics: StyleMetrics, leaks: CoachInsight[]) {
  const checklist = [
    'Name your three candidate moves before calculating in any sharp position.',
    'Finish development before launching flank pawn pressure unless there is a forcing tactical reason.',
    'Save one personal model game each week that matches your preferred type of middlegame.',
  ]

  if (!metrics.castledByMove || metrics.castledByMove > 9) {
    checklist.unshift('Treat early king safety as part of your attacking setup, not a separate chore.')
  }

  if (leaks.some((leak) => leak.title.includes('simpler wins'))) {
    checklist.push('When the position is clearly favorable, ask what trade makes the next five moves easiest to play.')
  }

  return checklist.slice(0, 5)
}
