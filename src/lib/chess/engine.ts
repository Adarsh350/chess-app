import type { CriticalMoment, EngineMoveReview, EngineReviewSnapshot, MoveClassification, MovePhase, ParsedGame } from '../../types/coaching'

type EngineEvaluation = {
  score: number
  bestMove: string
  bestLine: string[]
}

const LARGE_MATE_SCORE = 10_000

function fenTurn(fen: string) {
  return fen.split(' ')[1] === 'w' ? 'w' : 'b'
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value))
}

function classifyCpl(cpl: number): MoveClassification {
  if (cpl >= 200) {
    return 'blunder'
  }

  if (cpl >= 110) {
    return 'mistake'
  }

  if (cpl >= 55) {
    return 'inaccuracy'
  }

  if (cpl >= 18) {
    return 'solid'
  }

  return 'strong'
}

function normalizeScore(score: number, turn: 'w' | 'b', playerColor: 'w' | 'b') {
  return turn === playerColor ? score : -score
}

function phaseScoreFromAverageCpl(phase: MovePhase, average: number) {
  const score = clamp(Math.round(98 - average * 1.35), 18, 96)
  const caption =
    average <= 25
      ? 'Decision quality held together well under engine review.'
      : average <= 60
        ? 'The ideas are playable, but a handful of positions need a calmer filter.'
        : 'This phase is leaking too much value and deserves direct training attention.'

  return {
    phase,
    score,
    caption,
    basis: 'engine' as const,
  }
}

class StockfishSession {
  private worker: Worker | null = null
  private initPromise: Promise<void> | null = null
  private pending:
    | {
        latest: EngineEvaluation
        resolve: (value: EngineEvaluation) => void
        reject: (reason?: unknown) => void
      }
    | null = null

  async init() {
    if (this.initPromise) {
      return this.initPromise
    }

    this.worker = new Worker('/engines/stockfish/stockfish-lite.js')
    this.initPromise = new Promise((resolve, reject) => {
      if (!this.worker) {
        reject(new Error('Stockfish worker failed to initialize'))
        return
      }

      let gotUciOk = false
      let gotReady = false
      let settled = false

      this.worker.onmessage = (event) => {
        const line = String(event.data)

        if (line === 'uciok') {
          gotUciOk = true
          this.worker?.postMessage('isready')
          return
        }

        if (line === 'readyok') {
          gotReady = true
        }

        if (this.pending) {
          if (line.startsWith('info depth')) {
            const evaluation = this.parseInfo(line)
            if (evaluation) {
              this.pending.latest = evaluation
            }
          }

          if (line.startsWith('bestmove')) {
            const bestMove = line.split(' ')[1] ?? this.pending.latest.bestMove
            const latest = {
              ...this.pending.latest,
              bestMove,
            }
            this.pending.resolve(latest)
            this.pending = null
          }
        }

        if (gotUciOk && gotReady && !settled) {
          settled = true
          resolve()
        }
      }

      this.worker.onerror = (event) => {
        if (this.pending) {
          this.pending.reject(event.error ?? new Error('Stockfish worker error'))
          this.pending = null
        }

        if (!settled) {
          settled = true
          reject(event.error ?? new Error('Stockfish worker error'))
        }
      }

      this.worker.postMessage('uci')
      this.worker.postMessage('setoption name Hash value 32')
    })

    return this.initPromise
  }

  private parseInfo(line: string): EngineEvaluation | null {
    const scoreCpMatch = line.match(/score cp (-?\d+)/)
    const scoreMateMatch = line.match(/score mate (-?\d+)/)
    const pvMatch = line.match(/ pv (.+)$/)

    let score = 0
    if (scoreCpMatch) {
      score = Number(scoreCpMatch[1])
    } else if (scoreMateMatch) {
      const mateIn = Number(scoreMateMatch[1])
      score = mateIn > 0 ? LARGE_MATE_SCORE - mateIn * 100 : -LARGE_MATE_SCORE - mateIn * 100
    } else {
      return null
    }

    const bestLine = pvMatch ? pvMatch[1].trim().split(/\s+/) : []
    return {
      score,
      bestMove: bestLine[0] ?? 'unknown',
      bestLine,
    }
  }

  async evaluateFen(fen: string, depth: number) {
    await this.init()

    if (!this.worker) {
      throw new Error('Stockfish worker is not available')
    }

    return new Promise<EngineEvaluation>((resolve, reject) => {
      this.pending = {
        latest: {
          score: 0,
          bestMove: 'unknown',
          bestLine: [],
        },
        resolve,
        reject,
      }

      this.worker?.postMessage(`position fen ${fen}`)
      this.worker?.postMessage(`go depth ${depth}`)
    })
  }

  close() {
    this.worker?.postMessage('quit')
    this.worker?.terminate()
    this.worker = null
    this.pending = null
    this.initPromise = null
  }
}

export async function runDeepEngineReview(
  game: ParsedGame,
  depth = 10,
  onProgress?: (progress: number, label: string) => void,
) {
  const engine = new StockfishSession()
  const playerColor = game.coachedSide === 'white' ? 'w' : 'b'
  const targetMoves = game.moves.filter((move) => move.color === playerColor)
  const reviews: EngineMoveReview[] = []

  try {
    for (const [index, move] of targetMoves.entries()) {
      onProgress?.((index / targetMoves.length) * 100, `Reviewing move ${move.moveNumber} ${move.san}`)

      const best = await engine.evaluateFen(move.beforeFen, depth)
      const played = await engine.evaluateFen(move.afterFen, depth)
      const bestForPlayer = normalizeScore(best.score, fenTurn(move.beforeFen), playerColor)
      const playedForPlayer = normalizeScore(played.score, fenTurn(move.afterFen), playerColor)
      const cpl = Math.max(0, Math.round(bestForPlayer - playedForPlayer))

      reviews.push({
        ply: move.ply,
        moveNumber: move.moveNumber,
        san: move.san,
        cpl,
        classification: classifyCpl(cpl),
        phase: move.phase,
        beforeEval: bestForPlayer,
        afterEval: playedForPlayer,
        bestMove: best.bestMove,
        bestLine: best.bestLine,
        fenAfter: move.afterFen,
      })
    }
  } finally {
    engine.close()
  }

  const averageCpl = Math.round(
    reviews.reduce((total, review) => total + review.cpl, 0) / Math.max(reviews.length, 1),
  )

  const reviewsByPhase = {
    opening: reviews.filter((review) => review.phase === 'opening'),
    middlegame: reviews.filter((review) => review.phase === 'middlegame'),
    endgame: reviews.filter((review) => review.phase === 'endgame'),
  }

  const phaseScores = (Object.entries(reviewsByPhase) as [MovePhase, EngineMoveReview[]][])
    .filter(([, phaseReviews]) => phaseReviews.length > 0)
    .map(([phase, phaseReviews]) => {
      const average = phaseReviews.reduce((total, review) => total + review.cpl, 0) / phaseReviews.length
      return phaseScoreFromAverageCpl(phase, average)
    })

  const criticalMoments: CriticalMoment[] = [...reviews]
    .sort((left, right) => right.cpl - left.cpl)
    .slice(0, 5)
    .map((review) => ({
      ply: review.ply,
      moveNumber: review.moveNumber,
      san: review.san,
      title:
        review.classification === 'blunder'
          ? 'This move drops the position fast'
          : review.classification === 'mistake'
            ? 'This is where the engine starts pushing back'
            : 'This position deserves a second calculation pass',
      explanation:
        review.bestMove !== 'unknown'
          ? `The engine preferred ${review.bestMove}. The gap here is large enough that it should become a recurring training position.`
          : 'The position changes enough here that it belongs in the next coaching session.',
      severity: review.classification,
      cpl: review.cpl,
      phase: review.phase,
      fenAfter: review.fenAfter,
      bestMove: review.bestMove,
      bestLine: review.bestLine,
    }))

  onProgress?.(100, 'Deep review complete')

  return {
    depth,
    averageCpl,
    reviews,
    criticalMoments,
    phaseScores,
    diagnostic: [
      `Local Stockfish depth ${depth} over ${reviews.length} player moves`,
      `Highest reviewed centipawn loss: ${reviews[0]?.cpl ?? 0}`,
    ],
  } satisfies EngineReviewSnapshot
}
