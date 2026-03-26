import type { CoachingReport, EngineReviewSnapshot, ParsedGame } from '../../types/coaching'
import { buildActionChecklist, buildHeuristicCriticalMoments, buildHeuristicPhaseScores, buildLeaks, buildSessionAgenda, buildStrengths, buildStyleFingerprint, buildTrainingPlan, deriveStyleMetrics } from './heuristics'

export function buildInstantReport(game: ParsedGame): CoachingReport {
  const metrics = deriveStyleMetrics(game)
  const styleFingerprint = buildStyleFingerprint(metrics)
  const leaks = buildLeaks(game, metrics)

  return {
    headline:
      game.outcome === 'win'
        ? `A ${styleFingerprint.archetype.toLowerCase()} win with clear momentum`
        : `A ${styleFingerprint.archetype.toLowerCase()} game with a clear lesson for the next step`,
    oneLiner:
      game.outcome === 'win'
        ? 'This game shows why your style works: you create practical pressure early and give the opponent real problems to solve.'
        : 'This game is helpful because it shows the exact moment where a calmer choice or a clearer plan would have made the position easier to handle.',
    executiveSummary: `${game.selectedPlayer}'s games already point toward a ${styleFingerprint.archetype.toLowerCase()} style. The goal is to keep that identity, while tightening the one or two decisions that would make future games steadier and easier to convert.`,
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
      `Opening: ${game.opening}`,
      `Style read: ${styleFingerprint.archetype}`,
      `Result from the student's side: ${game.outcome}`,
      'Built from the move pattern and structure of this game.',
    ],
    generatedFrom: 'instant',
  }
}

function deepPhaseSummary(phase: EngineReviewSnapshot['phaseScores'][number]) {
  return `${phase.phase[0]!.toUpperCase()}${phase.phase.slice(1)} detailed review score ${phase.score}/100: ${phase.caption}`
}

export function buildDeepReport(game: ParsedGame, snapshot: EngineReviewSnapshot): CoachingReport {
  const base = buildInstantReport(game)
  const weakest = [...snapshot.phaseScores].sort((left, right) => left.score - right.score)[0]
  const strongest = [...snapshot.phaseScores].sort((left, right) => right.score - left.score)[0]

  return {
    ...base,
    headline: `Detailed review: ${base.headline}`,
    oneLiner: `${base.oneLiner} The closer review makes the biggest turning points easier to see.`,
    executiveSummary: `${base.executiveSummary} The closer review shows that the biggest gains will come from the ${weakest?.phase ?? 'middlegame'}, while the ${strongest?.phase ?? 'opening'} remains the phase to keep building on with confidence.`,
    strengths: [
      {
        title: `Your strongest phase in this detailed review is the ${strongest?.phase ?? 'opening'}`,
        detail: `The game held together best in the ${strongest?.phase ?? 'opening'}. That phase is the right anchor point to keep building confidence around while the weaker phase gets extra attention.`,
      },
      ...base.strengths.slice(1),
    ],
    leaks: [
      {
        title: `The ${weakest?.phase ?? 'middlegame'} is the first serious training target`,
        detail: 'This is where the game started to get harder to control. The best response is not more theory everywhere, but calmer decision-making in that exact phase.',
      },
      ...base.leaks.slice(1),
    ],
    phaseScores: snapshot.phaseScores,
    criticalMoments: snapshot.criticalMoments,
    diagnostic: [
      ...base.diagnostic,
      `Average swing in the detailed review: ${snapshot.averageCpl}`,
      ...snapshot.phaseScores.map(deepPhaseSummary),
      ...snapshot.diagnostic,
    ],
    generatedFrom: 'deep',
  }
}
