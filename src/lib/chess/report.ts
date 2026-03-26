import type { CoachingReport, EngineReviewSnapshot, ParsedGame } from '../../types/coaching'
import { buildActionChecklist, buildHeuristicCriticalMoments, buildHeuristicPhaseScores, buildLeaks, buildSessionAgenda, buildStrengths, buildStyleFingerprint, buildTrainingPlan, deriveStyleMetrics } from './heuristics'

export function buildInstantReport(game: ParsedGame): CoachingReport {
  const metrics = deriveStyleMetrics(game)
  const styleFingerprint = buildStyleFingerprint(metrics)
  const leaks = buildLeaks(game, metrics)

  return {
    headline:
      game.outcome === 'win'
        ? `A ${styleFingerprint.archetype.toLowerCase()} win built on pressure and direction`
        : `A ${styleFingerprint.archetype.toLowerCase()} game that shows exactly where the next jump comes from`,
    oneLiner:
      game.outcome === 'win'
        ? 'This game shows why your style works: you create practical pressure early and give the opponent real problems to solve.'
        : 'This game is valuable because it exposes the exact point where your natural style needs stronger structure and cleaner decision filters.',
    executiveSummary: `${game.selectedPlayer} is not a generic improver. The current shape of the game already points toward ${styleFingerprint.archetype.toLowerCase()}. The coaching opportunity is to preserve that identity while cleaning up the one or two decision points that keep the position from becoming easier to win.`,
    styleFingerprint,
    strengths: buildStrengths(game, metrics),
    leaks,
    trainingPlan: buildTrainingPlan(metrics, leaks),
    sessionAgenda: buildSessionAgenda(game, metrics),
    followUp: 'Good work. The important thing is not to become a different kind of player. It is to make your best positions arrive more often and become more stable when they do. Your homework this week is to replay the critical moment from this game, then compare it to one model game from the same opening family and write down the calmer move-order you want next time.',
    phaseScores: buildHeuristicPhaseScores(game, metrics),
    actionChecklist: buildActionChecklist(metrics, leaks),
    criticalMoments: buildHeuristicCriticalMoments(game),
    diagnostic: [
      `Opening family: ${game.opening}`,
      `Style signal: ${styleFingerprint.archetype}`,
      `Outcome from the coached side: ${game.outcome}`,
      'Generated without paid APIs using PGN structure and style heuristics',
    ],
    generatedFrom: 'instant',
  }
}

function deepPhaseSummary(phase: EngineReviewSnapshot['phaseScores'][number]) {
  return `${phase.phase[0]!.toUpperCase()}${phase.phase.slice(1)} engine score ${phase.score}/100: ${phase.caption}`
}

export function buildDeepReport(game: ParsedGame, snapshot: EngineReviewSnapshot): CoachingReport {
  const base = buildInstantReport(game)
  const weakest = [...snapshot.phaseScores].sort((left, right) => left.score - right.score)[0]
  const strongest = [...snapshot.phaseScores].sort((left, right) => right.score - left.score)[0]

  return {
    ...base,
    headline: `Deep review: ${base.headline}`,
    oneLiner: `${base.oneLiner} The local Stockfish pass puts concrete numbers behind the coaching priorities.`,
    executiveSummary: `${base.executiveSummary} The engine review validates that the real gains are phase-specific, not generic. Build the next training block around the ${weakest?.phase ?? 'middlegame'} while protecting the strengths that already show up in the ${strongest?.phase ?? 'opening'}.`,
    strengths: [
      {
        title: `Your best engine-tested phase is the ${strongest?.phase ?? 'opening'}`,
        detail: `At depth ${snapshot.depth}, the review holds up best in the ${strongest?.phase ?? 'opening'}. That phase is the anchor point to build your weekly training around rather than starting from weakness only.`,
      },
      ...base.strengths.slice(1),
    ],
    leaks: [
      {
        title: `The engine flags the ${weakest?.phase ?? 'middlegame'} as the first serious training target`,
        detail: 'This is where the centipawn loss accumulates fastest. The right coaching response is not more theory everywhere, but more disciplined decision-making in that exact phase.',
      },
      ...base.leaks.slice(1),
    ],
    phaseScores: snapshot.phaseScores,
    criticalMoments: snapshot.criticalMoments,
    diagnostic: [
      ...base.diagnostic,
      `Average centipawn loss: ${snapshot.averageCpl}`,
      ...snapshot.phaseScores.map(deepPhaseSummary),
      ...snapshot.diagnostic,
    ],
    generatedFrom: 'deep',
  }
}
