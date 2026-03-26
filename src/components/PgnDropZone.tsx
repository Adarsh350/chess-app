import { FileUp, Sparkles } from 'lucide-react'
import { useRef, useState } from 'react'

type PgnDropZoneProps = Readonly<{
  value: string
  onChange: (value: string) => void
  onLoadDemo: () => void
}>

export function PgnDropZone({ value, onChange, onLoadDemo }: PgnDropZoneProps) {
  const inputRef = useRef<HTMLInputElement | null>(null)
  const [isDragging, setIsDragging] = useState(false)

  async function readFile(file: File) {
    const text = await file.text()
    onChange(text)
  }

  return (
    <div className="grid gap-4">
      <div
        onDragOver={(event) => {
          event.preventDefault()
          setIsDragging(true)
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(event) => {
          event.preventDefault()
          setIsDragging(false)
          const file = event.dataTransfer.files.item(0)
          if (file) {
            void readFile(file)
          }
        }}
        className={[
          'rounded-[1.75rem] border border-dashed p-5 transition-colors',
          isDragging ? 'border-forest bg-mint-soft/70' : 'border-forest/20 bg-ivory/70',
        ].join(' ')}
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-4">
            <div className="rounded-2xl bg-forest p-3 text-white">
              <FileUp className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-heading text-xl font-bold tracking-[-0.03em] text-ink">
                Drop a PGN file or paste the game below
              </h3>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-copy">
                You can upload a saved PGN file or paste the moves directly. The game review is created right here in the app.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <button type="button" className="ghost-button" onClick={() => inputRef.current?.click()}>
              Choose file
            </button>
            <button type="button" className="brand-button" onClick={onLoadDemo}>
              <Sparkles className="mr-2 h-4 w-4" />
              Use sample PGN
            </button>
          </div>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept=".pgn,text/plain"
          className="hidden"
          onChange={(event) => {
            const file = event.target.files?.item(0)
            if (file) {
              void readFile(file)
            }
          }}
        />
      </div>

      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="[Event &quot;Training game&quot;]&#10;1. e4 e5 2. Nf3 ..."
        className="min-h-[18rem] rounded-[1.75rem] border border-line bg-white p-5 text-sm leading-7 text-ink shadow-[0_24px_50px_-40px_rgba(18,36,24,0.18)] outline-none transition focus:border-forest/30 focus:ring-4 focus:ring-mint-soft/70"
      />
    </div>
  )
}
