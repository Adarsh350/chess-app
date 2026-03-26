import type { CoachingReport, StoredGame, StoredStudent } from '../types/coaching'

function section(title: string, lines: string[]) {
  return `## ${title}\n\n${lines.join('\n')}\n`
}

export function buildReportMarkdown(student: StoredStudent, game: StoredGame, report: CoachingReport) {
  return [
    `# ${student.name} - ${game.title}`,
    '',
    `Generated from: ${report.generatedFrom}`,
    '',
    report.headline,
    '',
    report.executiveSummary,
    '',
    section(
      'Style Fingerprint',
      report.styleFingerprint.meters.map(
        (meter) => `- **${meter.label} (${meter.score})**: ${meter.note}`,
      ),
    ),
    section(
      'Strengths',
      report.strengths.map((item) => `- **${item.title}**: ${item.detail}`),
    ),
    section(
      'Leaks',
      report.leaks.map((item) => `- **${item.title}**: ${item.detail}`),
    ),
    section(
      'Training Plan',
      report.trainingPlan.map(
        (block) =>
          `- **${block.title}**: ${block.why}\n  Target: ${block.target}\n  Drills: ${block.drills.join('; ')}`,
      ),
    ),
    section(
      'Session Agenda',
      report.sessionAgenda.map((item) => `- **${item.title}**: ${item.detail}`),
    ),
    section(
      'Critical Moments',
      report.criticalMoments.map(
        (moment) =>
          `- **Move ${moment.moveNumber} (${moment.san})**: ${moment.title}. ${moment.explanation}`,
      ),
    ),
    section('Action Checklist', report.actionChecklist.map((line) => `- ${line}`)),
    section('Follow Up', [report.followUp]),
  ].join('\n')
}

export function downloadMarkdownReport(student: StoredStudent, game: StoredGame, report: CoachingReport) {
  const content = buildReportMarkdown(student, game, report)
  const file = new Blob([content], { type: 'text/markdown;charset=utf-8' })
  const url = URL.createObjectURL(file)
  const link = document.createElement('a')
  link.href = url
  link.download = `${student.name}-${game.id}-report.md`
  link.click()
  URL.revokeObjectURL(url)
}
