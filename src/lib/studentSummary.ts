import type { PersistedAnalysis, StoredGame } from '../types/coaching'

function topLabels(items: string[]) {
  const counts = new Map<string, number>()
  for (const item of items) {
    counts.set(item, (counts.get(item) ?? 0) + 1)
  }

  return [...counts.entries()]
    .sort((left, right) => right[1] - left[1])
    .slice(0, 3)
    .map(([label]) => label)
}

export function summarizeStudent(games: StoredGame[], analyses: PersistedAnalysis[]) {
  const reports = analyses.map((analysis) => analysis.report)
  const firstReport = reports[0]

  const averageMeter = (label: string) => {
    if (!reports.length) {
      return 0
    }

    const total = reports.reduce((sum, report) => {
      const meter = report.styleFingerprint.meters.find((entry) => entry.label === label)
      return sum + (meter?.score ?? 0)
    }, 0)

    return Math.round(total / reports.length)
  }

  const wins = games.filter((game) =>
    (game.coachedSide === 'white' && game.result === '1-0') ||
    (game.coachedSide === 'black' && game.result === '0-1'),
  ).length

  return {
    signatureStyle: firstReport?.styleFingerprint.archetype ?? 'No reports yet',
    winRate: games.length ? Math.round((wins / games.length) * 100) : 0,
    averageMeters: firstReport
      ? firstReport.styleFingerprint.meters.map((meter) => ({
          ...meter,
          score: averageMeter(meter.label),
        }))
      : [],
    repeatStrengths: topLabels(reports.flatMap((report) => report.strengths.map((item) => item.title))),
    repeatLeaks: topLabels(reports.flatMap((report) => report.leaks.map((item) => item.title))),
    openings: topLabels(games.map((game) => game.opening)),
    deepReviewCount: analyses.filter((analysis) => analysis.kind === 'deep').length,
  }
}
