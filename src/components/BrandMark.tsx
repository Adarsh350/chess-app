type BrandMarkProps = Readonly<{
  compact?: boolean
}>

export function BrandMark({ compact = false }: BrandMarkProps) {
  return (
    <div className="inline-flex items-center">
      <img
        src="/deepgame-logo.svg"
        alt="DeepGame Coaching"
        className={compact ? 'h-12 w-auto' : 'h-16 w-auto sm:h-[4.5rem]'}
      />
    </div>
  )
}
