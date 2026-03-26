const PIECES: Record<string, string> = {
  K: '♔',
  Q: '♕',
  R: '♖',
  B: '♗',
  N: '♘',
  P: '♙',
  k: '♚',
  q: '♛',
  r: '♜',
  b: '♝',
  n: '♞',
  p: '♟',
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
  const files = orientation === 'white' ? ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'] : ['h', 'g', 'f', 'e', 'd', 'c', 'b', 'a']
  const displayRanks = orientation === 'white' ? [8, 7, 6, 5, 4, 3, 2, 1] : [1, 2, 3, 4, 5, 6, 7, 8]

  return (
    <div className="rounded-[1.75rem] border border-line bg-white p-3 shadow-[0_25px_60px_-45px_rgba(18,36,24,0.18)]">
      <div className="grid grid-cols-[auto_repeat(8,minmax(0,1fr))] gap-1">
        <div />
        {files.map((file) => (
          <div key={file} className="pb-1 text-center text-[0.7rem] font-bold uppercase tracking-[0.2em] text-copy/70">
            {file}
          </div>
        ))}

        {rankOrder.map((rank, rankIndex) => (
          <div key={`row-${displayRanks[rankIndex]}`} className="contents">
            <div
              className="flex items-center justify-center text-[0.7rem] font-bold text-copy/70"
            >
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
                    'flex aspect-square items-center justify-center rounded-[1rem] text-[1.6rem] shadow-inner sm:text-[2rem]',
                    isDark ? 'bg-[#dce9df]' : 'bg-[#f7f4eb]',
                    isHighlighted ? 'ring-4 ring-saffron/50' : '',
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
