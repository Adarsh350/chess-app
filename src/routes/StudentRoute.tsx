import { useLiveQuery } from 'dexie-react-hooks'
import { ArrowRight, ChartNoAxesCombined, CircleCheckBig, NotebookPen, Swords } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
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

export function StudentRoute() {
  const { studentId } = useParams()
  const record = useLiveQuery(async () => {
    if (!studentId) {
      return null
    }

    const student = await db.students.get(studentId)
    if (!student) {
      return null
    }

    const games = await db.games.where('studentId').equals(student.id).sortBy('importedAt')
    const analyses = await db.analyses.where('studentId').equals(student.id).toArray()

    return {
      student,
      games: games.reverse(),
      analyses,
    }
  }, [studentId])

  if (record === undefined) {
    return null
  }

  if (!record?.student) {
    return (
      <div className="px-5 py-8 sm:px-7 sm:py-10">
        <div className="panel p-8">
          <p className="section-label">Student Profile</p>
          <h1 className="mt-4 font-heading text-4xl font-bold tracking-[-0.06em] text-ink">
            We could not find that student yet.
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-copy">
            Head back home and upload a game to create the first saved review.
          </p>
          <div className="mt-6">
            <Link className="brand-button" to="/">
              Back Home
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const { student, games, analyses } = record
  const summary = summarizeStudent(games, analyses)
  const reportsByGame = preferredAnalysisByGame(
    games.map((game) => game.id),
    analyses,
  )
  const latestGame = games[0]

  return (
    <div className="px-5 py-8 sm:px-7 sm:py-10">
      <section className="soft-panel overflow-hidden p-8 sm:p-10">
        <p className="section-label">Student Profile</p>
        <div className="mt-4 grid gap-8 xl:grid-cols-[minmax(0,1.1fr)_minmax(19rem,0.9fr)] xl:items-end">
          <div>
            <div className="metric-chip">{student.kind === 'seeded' ? 'Sample student progress' : 'Student progress'}</div>
            <h1 className="mt-5 max-w-4xl font-heading text-4xl font-bold tracking-[-0.06em] text-ink sm:text-6xl">
              {student.name}
            </h1>
            <p className="mt-4 max-w-3xl text-lg leading-8 text-copy">{student.tagline}</p>
            <p className="mt-4 max-w-3xl text-sm leading-7 text-copy">{student.focusStatement}</p>
            <div className="mt-6 flex flex-wrap gap-3">
              {student.goals.map((goal) => (
                <span key={goal} className="metric-chip">
                  {goal}
                </span>
              ))}
            </div>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link className="brand-button" to="/intake">
                Upload Another Game
              </Link>
              {latestGame ? (
                <Link className="ghost-button" to={`/review/${latestGame.id}`}>
                  Open Latest Review
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              ) : null}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3 xl:grid-cols-1">
            {[
              {
                icon: CircleCheckBig,
                title: 'Playing Style',
                body: 'The profile builds a clearer picture of how the student naturally approaches the game.',
              },
              {
                icon: Swords,
                title: 'Focused Practice',
                body: 'Strengths and recurring mistakes stay visible so the next lesson feels more purposeful.',
              },
              {
                icon: ChartNoAxesCombined,
                title: 'Progress Over Time',
                body: 'Each saved game adds more context, so improvement is easier to see from week to week.',
              },
            ].map((item) => (
              <div key={item.title} className="panel p-5">
                <item.icon className="h-5 w-5 text-forest" />
                <h2 className="mt-4 font-heading text-2xl font-bold tracking-[-0.04em] text-ink">
                  {item.title}
                </h2>
                <p className="mt-2 text-sm leading-7 text-copy">{item.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Games Reviewed"
          value={String(games.length)}
          description="Each saved game adds to the student's review history."
        />
        <MetricCard
          label="Win Rate"
          value={`${summary.winRate}%`}
          description="A simple look at results from the student's side of the board."
        />
        <MetricCard
          label="Detailed Reviews"
          value={String(summary.deepReviewCount)}
          description="Closer move-by-move reviews saved alongside the main summaries."
        />
        <MetricCard
          label="Most-Played Opening"
          value={summary.openings[0] ?? 'None yet'}
          description="The opening family showing up most often in the saved games."
        />
      </div>

      <div className="mt-6 flex gap-3 overflow-x-auto pb-1">
        {[
          ['#student-fingerprint', 'Playing Style'],
          ['#student-openings', 'Openings'],
          ['#student-timeline', 'Saved Reviews'],
        ].map(([href, label]) => (
          <a key={href} href={href} className="metric-chip whitespace-nowrap">
            {label}
          </a>
        ))}
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <SectionCard
          id="student-fingerprint"
          eyebrow="Playing Style"
          title={summary.signatureStyle}
          description="These meters combine the saved reports so students and parents can see the overall pattern more clearly."
        >
          {summary.averageMeters.length ? (
            <div className="grid gap-4 md:grid-cols-2">
              {summary.averageMeters.map((meter) => (
                <ScoreMeter key={meter.label} meter={meter} />
              ))}
            </div>
          ) : (
            <p className="text-sm text-copy">No report data is available yet.</p>
          )}
        </SectionCard>

        <SectionCard
          eyebrow="Current Focus"
          title="What is going well and what comes next"
          description="This combines the repeated strengths and the repeat mistakes across the saved reviews."
        >
          <div className="grid gap-4 md:grid-cols-2">
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
          id="student-openings"
          eyebrow="Openings"
          title="The openings showing up most often"
          description="This helps the next lesson stay connected to the positions the student actually reaches in real games."
        >
          <div className="flex flex-wrap gap-3">
            {summary.openings.map((opening) => (
              <span key={opening} className="metric-chip">
                {opening}
              </span>
            ))}
          </div>
          <div className="mt-6 rounded-[1.5rem] border border-line bg-ivory/80 p-5">
            <p className="text-xs font-extrabold uppercase tracking-[0.24em] text-copy/80">
              What this means
            </p>
            <p className="mt-3 text-sm leading-7 text-copy">
              The goal is not generic training. The opening choices and style signals help lessons stay personal, so the student can build on what already feels natural.
            </p>
          </div>
        </SectionCard>

        <SectionCard
          eyebrow="Why This Helps"
          title="How this profile keeps lessons focused"
          description="A saved progress view makes it easier for students and parents to stay clear on the next step."
        >
          <div className="grid gap-4">
            {[
              'See what the student is already doing well.',
              'Know which mistakes keep repeating.',
              'Choose the next training block from a real game sample.',
              'Reopen any earlier review whenever you want to compare progress.',
            ].map((item) => (
              <div key={item} className="rounded-[1.5rem] border border-line bg-white p-5 text-sm font-semibold text-ink">
                <NotebookPen className="mb-3 h-4 w-4 text-forest" />
                {item}
              </div>
            ))}
          </div>
        </SectionCard>
      </div>

      <SectionCard
        id="student-timeline"
        eyebrow="Saved Reviews"
        title="Games you can revisit anytime"
        description="Each card opens the full game review so you can look back at the summary, the turning points, and the next steps."
      >
        <div className="grid gap-4">
          {games.map((game) => {
            const analysis = reportsByGame.get(game.id)
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
    </div>
  )
}
