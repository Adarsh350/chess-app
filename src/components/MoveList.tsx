import type { ParsedMove } from '../types/coaching'

type MoveListProps = Readonly<{
  moves: ParsedMove[]
  currentPly: number
  onSelect: (ply: number) => void
}>

export function MoveList({ moves, currentPly, onSelect }: MoveListProps) {
  const rows = []
  for (let index = 0; index < moves.length; index += 2) {
    rows.push({
      moveNumber: Math.floor(index / 2) + 1,
      white: moves[index],
      black: moves[index + 1],
    })
  }

  return (
    <div className="max-h-[26rem] overflow-auto rounded-[1.5rem] border border-line bg-white p-3">
      <div className="grid gap-2">
        {rows.map((row) => (
          <div
            key={row.moveNumber}
            className="grid grid-cols-[3rem_minmax(0,1fr)_minmax(0,1fr)] items-center gap-2 rounded-2xl bg-ivory/70 p-2"
          >
            <span className="text-center text-xs font-bold uppercase tracking-[0.2em] text-copy">
              {row.moveNumber}
            </span>
            {[row.white, row.black].map((move) =>
              move ? (
                <button
                  key={move.ply}
                  type="button"
                  onClick={() => onSelect(move.ply)}
                  className={[
                    'rounded-xl px-3 py-2 text-left text-sm font-semibold transition-colors',
                    move.ply === currentPly
                      ? 'bg-forest text-white'
                      : 'bg-white text-ink hover:bg-mint-soft',
                  ].join(' ')}
                >
                  {move.san}
                </button>
              ) : (
                <div key={`${row.moveNumber}-empty`} />
              ),
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
