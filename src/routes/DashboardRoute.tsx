import { useLiveQuery } from 'dexie-react-hooks'
import { ArrowRight, BrainCircuit, Crosshair, Radar, Swords, Upload } from 'lucide-react'
import { Link } from 'react-router-dom'
import { MetricCard } from '../components/MetricCard'
import { ScoreMeter } from '../components/ScoreMeter'
import { SectionCard } from '../components/SectionCard'
import { db } from '../lib/db'
import { summarizeStudent } from '../lib/studentSummary'
import type { PersistedAnalysis } from '../types/coaching'

function preferredAnalysisByGame(gameIds: string[], analyses: PersistedAnalysis[]) {
  const map = new Map<string, PersistedAnalysis>()

  for (const gameId of gameIds) {
    const options = analyses.filter((analysis) => analysis.gameId === gameId)
    const preferred = options.find((analysis) => analysis.kind === 'deep') ?? options[0]
    if (preferred) {
      map.set(gameId, preferred)
    }
  }

  return map
}

export function DashboardRoute() {
  const students = useLiveQuery(() => db.students.toArray(), [])
  const games = useLiveQuery(() => db.games.orderBy('importedAt').reverse().toArray(), [])
  const analyses = useLiveQuery(() => db.analyses.toArray(), [])

  if (!students || !games || !analyses) {
    return null
  }

  const primaryStudent = students[0]
  const studentGames = primaryStudent ? games.filter((game) => game.studentId === primaryStudent.id) : []
  const studentAnalyses = primaryStudent
    ? analyses.filter((analysis) => analysis.studentId === primaryStudent.id)
    : []
  const summary = summarizeStudent(studentGames, studentAnalyses)
  const reportByGame = preferredAnalysisByGame(
    studentGames.map((game) => game.id),
    studentAnalyses,
  )
  const flagshipGame = studentGames.find((game) => game.id === 'game-grunfeld-pressure') ?? studentGames[0]

  return (
    <div className="px-5 py-8 sm:px-7 sm:py-10">
      <section className="soft-panel overflow-hidden p-8 sm:p-10">
        <p className="section-label">The DeepGame Difference</p>
        <div className="mt-4 grid gap-8 xl:grid-cols-[minmax(0,1.2fr)_minmax(18rem,0.8fr)] xl:items-end">
          <div>
            <h1 className="max-w-4xl font-heading text-4xl font-bold tracking-[-0.06em] text-ink sm:text-6xl">
              Every student gets a coaching system that is theirs alone.
            </h1>
            <p className="mt-5 max-w-3xl text-base leading-8 text-copy sm:text-lg">
              This workspace mirrors your site positioning: style identification first, strength-first training second, and clean performance tracking underneath it all. Everything here runs locally on the device.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link className="brand-button" to="/intake">
                <Upload className="mr-2 h-4 w-4" />
                Import New PGN
              </Link>
              {flagshipGame ? (
                <Link className="ghost-button" to={`/review/${flagshipGame.id}`}>
                  Open Flagship Report
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              ) : null}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3 xl:grid-cols-1">
            {[
              {
                icon: Radar,
                title: 'Playing Style Identification',
                body: 'The report maps how the student naturally competes so training sharpens strengths instead of replacing them.',
              },
              {
                icon: Swords,
                title: 'Strength-First Training',
                body: 'The coaching plan turns recurring motifs into weekly drills, model games, and a clear tactical filter.',
              },
              {
                icon: BrainCircuit,
                title: 'Performance Tracking',
                body: 'Every imported game becomes part of a running profile, and deep reviews can be added with local Stockfish whenever you need them.',
              },
            ].map((card) => (
              <div key={card.title} className="panel p-5">
                <div className="flex items-start gap-4">
                  <div className="rounded-2xl bg-forest p-3 text-white">
                    <card.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="font-heading text-2xl font-bold tracking-[-0.04em] text-ink">
                      {card.title}
                    </h2>
                    <p className="mt-2 text-sm leading-7 text-copy">{card.body}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Students"
          value={String(students.length)}
          description="Profiles stored locally with goals, focus statements, and reusable coaching context."
        />
        <MetricCard
          label="Imported Games"
          value={String(games.length)}
          description="PGNs imported into IndexedDB and turned into instant reports on device."
        />
        <MetricCard
          label="Deep Reviews"
          value={String(summary.deepReviewCount)}
          description="Local Stockfish passes saved alongside instant reports for stronger session prep."
        />
        <MetricCard
          label="Signature Style"
          value={summary.signatureStyle}
          description="The dominant style signal currently surfacing from the student report history."
        />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
        <SectionCard
          eyebrow="Portfolio Student"
          title={primaryStudent ? `${primaryStudent.name}'s current competitive fingerprint` : 'Student profile'}
          description={primaryStudent?.focusStatement}
        >
          {summary.averageMeters.length ? (
            <div className="grid gap-4 md:grid-cols-2">
              {summary.averageMeters.map((meter) => (
                <ScoreMeter key={meter.label} meter={meter} />
              ))}
            </div>
          ) : (
            <p className="text-sm text-copy">Import a PGN to generate the first style fingerprint.</p>
          )}

          <div className="mt-6 flex flex-wrap gap-3">
            {summary.openings.map((opening) => (
              <span key={opening} className="metric-chip">
                {opening}
              </span>
            ))}
          </div>
        </SectionCard>

        <SectionCard
          eyebrow="Coaching Priorities"
          title="The repeat themes the coach should stay on"
          description="These come from the student’s current report stack, so they evolve as more games are imported."
        >
          <div className="grid gap-4">
            <div className="rounded-[1.5rem] border border-line bg-ivory/80 p-5">
              <p className="text-xs font-extrabold uppercase tracking-[0.24em] text-copy/80">
                Repeat leverage
              </p>
              <ul className="mt-4 grid gap-3">
                {summary.repeatStrengths.map((item) => (
                  <li key={item} className="rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-ink">
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-[1.5rem] border border-line bg-ivory/80 p-5">
              <p className="text-xs font-extrabold uppercase tracking-[0.24em] text-copy/80">
                Repeat leaks
              </p>
              <ul className="mt-4 grid gap-3">
                {summary.repeatLeaks.map((item) => (
                  <li key={item} className="rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-ink">
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </SectionCard>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <SectionCard
          eyebrow="Recent Reports"
          title="Game files ready to review"
          description="Each card opens the full board, style report, and session-prep workflow."
        >
          <div className="grid gap-4">
            {studentGames.map((game) => {
              const analysis = reportByGame.get(game.id)
              return (
                <Link
                  key={game.id}
                  to={`/review/${game.id}`}
                  className="rounded-[1.5rem] border border-line bg-white p-5 transition hover:border-forest/20 hover:bg-mint-soft/60"
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <div className="metric-chip">{game.opening}</div>
                      <h3 className="mt-4 font-heading text-2xl font-bold tracking-[-0.04em] text-ink">
                        {game.title}
                      </h3>
                      <p className="mt-2 text-sm leading-7 text-copy">
                        {analysis?.report.oneLiner ?? 'Instant report ready.'}
                      </p>
                    </div>
                    <div className="rounded-2xl bg-ivory px-4 py-3 text-sm font-semibold text-forest">
                      {analysis?.kind === 'deep' ? 'Deep reviewed' : 'Instant report'}
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        </SectionCard>

        <SectionCard
          eyebrow="Operational Notes"
          title="What makes this build portfolio-strong"
          description="It shows applied automation, local-first engineering, and coaching system design instead of just a pretty dashboard."
        >
          <div className="grid gap-4 md:grid-cols-2">
            {[
              'Offline PGN import and IndexedDB storage',
              'Rule-based style fingerprint generation',
              'Session-ready coaching reports with training plans',
              'Optional local Stockfish deep review',
            ].map((item) => (
              <div key={item} className="rounded-[1.5rem] border border-line bg-white p-5 text-sm font-semibold text-ink">
                <Crosshair className="mb-3 h-4 w-4 text-forest" />
                {item}
              </div>
            ))}
          </div>
        </SectionCard>
      </div>
    </div>
  )
}
