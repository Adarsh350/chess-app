const PIECES: Record<string, string> = {
  K: '\u2654',
  Q: '\u2655',
  R: '\u2656',
  B: '\u2657',
  N: '\u2658',
  P: '\u2659',
  k: '\u265A',
  q: '\u265B',
  r: '\u265C',
  b: '\u265D',
  n: '\u265E',
  p: '\u265F',
}

type BoardPreviewProps = Readonly<{
  fen: string
  orientation?: 'white' | 'black'
  highlightedSquares?: string[]
}>

function expandBoard(boardFen: string) {
  return boardFen.split('/').map((rank) => {
    const expanded: string[] = []
    for (const symbol of rank) {
      const gap = Number(symbol)
      if (Number.isInteger(gap) && gap > 0) {
        expanded.push(...Array.from({ length: gap }, () => ''))
      } else {
        expanded.push(symbol)
      }
    }
    return expanded
  })
}

export function BoardPreview({
  fen,
  orientation = 'white',
  highlightedSquares = [],
}: BoardPreviewProps) {
  const ranks = expandBoard(fen.split(' ')[0]!)
  const rankOrder = orientation === 'white' ? [...ranks] : [...ranks].reverse()
  const files =
    orientation === 'white'
      ? ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h']
      : ['h', 'g', 'f', 'e', 'd', 'c', 'b', 'a']
  const displayRanks = orientation === 'white' ? [8, 7, 6, 5, 4, 3, 2, 1] : [1, 2, 3, 4, 5, 6, 7, 8]

  return (
    <div className="analysis-sheet">
      <div className="grid grid-cols-[auto_repeat(8,minmax(0,1fr))] gap-1.5">
        <div />
        {files.map((file) => (
          <div
            key={file}
            className="pb-1 text-center text-[0.68rem] font-bold uppercase tracking-[0.18em] text-copy/75"
          >
            {file}
          </div>
        ))}

        {rankOrder.map((rank, rankIndex) => (
          <div key={`row-${displayRanks[rankIndex]}`} className="contents">
            <div className="flex items-center justify-center text-[0.68rem] font-bold text-copy/75">
              {displayRanks[rankIndex]}
            </div>
            {rank.map((piece, fileIndex) => {
              const square = `${files[fileIndex]}${displayRanks[rankIndex]}`
              const isDark = (rankIndex + fileIndex) % 2 === 1
              const isHighlighted = highlightedSquares.includes(square)

              return (
                <div
                  key={square}
                  className={[
                    'flex aspect-square items-center justify-center rounded-lg text-[1.65rem] shadow-inner sm:text-[2rem]',
                    isDark ? 'bg-[#d6e3d8]' : 'bg-[#f6f1e4]',
                    isHighlighted ? 'ring-2 ring-saffron/75 ring-offset-1 ring-offset-white' : '',
                  ].join(' ')}
                >
                  <span className={piece === piece.toUpperCase() ? 'text-ink' : 'text-forest'}>
                    {PIECES[piece] ?? ''}
                  </span>
                </div>
              )
            })}
          </div>
        ))}
      </div>
    </div>
  )
}
