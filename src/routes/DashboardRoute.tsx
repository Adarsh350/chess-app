import { useLiveQuery } from 'dexie-react-hooks'
import { ArrowRight, CheckCircle2, NotebookPen, Radar, Upload } from 'lucide-react'
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

  return (
    <div className="px-5 py-8 sm:px-7 sm:py-10">
      <section className="soft-panel overflow-hidden p-8 sm:p-10">
        <p className="section-label">Start With A Game</p>
        <div className="mt-4 grid gap-8 xl:grid-cols-[minmax(0,1.2fr)_minmax(18rem,0.8fr)] xl:items-end">
          <div>
            <h1 className="max-w-4xl font-heading text-4xl font-bold tracking-[-0.06em] text-ink sm:text-6xl">
              Upload a game and see what to work on next.
            </h1>
            <p className="mt-5 max-w-3xl text-base leading-8 text-copy sm:text-lg">
              DeepGame Coaching keeps improvement easy to follow for students and parents. Every saved game becomes a clear summary, the key moments worth replaying, and a practice plan for the next lesson.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link className="brand-button" to="/intake">
                <Upload className="mr-2 h-4 w-4" />
                Upload A Game
              </Link>
              {primaryStudent ? (
                <Link className="ghost-button" to={`/students/${primaryStudent.id}`}>
                  See Sample Progress
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              ) : null}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3 xl:grid-cols-1">
            {[
              {
                icon: Upload,
                title: 'Upload The Game',
                body: 'Paste a PGN or load a saved file and the app turns it into a useful review.',
              },
              {
                icon: Radar,
                title: 'See The Turning Points',
                body: 'The review highlights where the game changed and what those moments teach.',
              },
              {
                icon: NotebookPen,
                title: 'Leave With A Plan',
                body: 'Each game review ends with next steps so practice feels clear instead of random.',
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
          label="Games Reviewed"
          value={String(games.length)}
          description="Every saved game becomes part of the student's progress trail."
        />
        <MetricCard
          label="Wins Recorded"
          value={`${summary.winRate}%`}
          description="A simple view of how often the saved games finish well from the student's side."
        />
        <MetricCard
          label="Detailed Reviews"
          value={String(summary.deepReviewCount)}
          description="Closer reviews are saved alongside the main summary whenever you want more depth."
        />
        <MetricCard
          label="Main Playing Style"
          value={summary.signatureStyle}
          description="The strongest pattern currently showing up across the saved games."
        />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
        <SectionCard
          eyebrow="Sample Progress Snapshot"
          title={primaryStudent ? `${primaryStudent.name}'s current playing style` : 'Student progress'}
          description="This gives students and parents a quick picture of how the games are trending right now."
        >
          {summary.averageMeters.length ? (
            <div className="grid gap-4 md:grid-cols-2">
              {summary.averageMeters.map((meter) => (
                <ScoreMeter key={meter.label} meter={meter} />
              ))}
            </div>
          ) : (
            <p className="text-sm text-copy">Upload a game to create the first progress snapshot.</p>
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
          eyebrow="What Stands Out"
          title="What is going well and what comes next"
          description="These are the patterns showing up most often across the current saved games."
        >
          <div className="grid gap-4">
            <div className="rounded-[1.5rem] border border-line bg-mint-soft/70 p-5">
              <p className="text-xs font-extrabold uppercase tracking-[0.24em] text-copy/80">
                Going well
              </p>
              <ul className="mt-4 grid gap-3">
                {summary.repeatStrengths.map((item) => (
                  <li key={item} className="rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-ink">
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-[1.5rem] border border-line bg-saffron-soft/70 p-5">
              <p className="text-xs font-extrabold uppercase tracking-[0.24em] text-copy/80">
                Working on next
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
          eyebrow="Recent Game Reviews"
          title="Open any saved game review"
          description="Tap a game to see the summary, the key moments, and the practice plan."
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
                        {analysis?.report.oneLiner ?? 'This game review is ready to open.'}
                      </p>
                    </div>
                    <div className="rounded-2xl bg-ivory px-4 py-3 text-sm font-semibold text-forest">
                      {analysis?.kind === 'deep' ? 'Detailed review' : 'Game summary'}
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        </SectionCard>

        <SectionCard
          eyebrow="What Families Get"
          title="Each uploaded game turns into something useful"
          description="The app keeps the experience simple and practical from the first upload."
        >
          <div className="grid gap-4 md:grid-cols-2">
            {[
              'A clear summary of what the student did well',
              'The key moments that changed the game',
              'A practice plan for the next lesson or week',
              'A progress trail that is easy to revisit later',
            ].map((item) => (
              <div key={item} className="rounded-[1.5rem] border border-line bg-white p-5 text-sm font-semibold text-ink">
                <CheckCircle2 className="mb-3 h-4 w-4 text-forest" />
                {item}
              </div>
            ))}
          </div>
        </SectionCard>
      </div>
    </div>
  )
}
