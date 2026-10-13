import { cn } from '../../lib/cn'

export default function Field({ ref, id, icon, error, trailing, className, ...inputProps }) {
  const errorId = `${id}-error`
  return (
    <div className={className}>
      <div
        className={cn(
          'flex h-11 items-center gap-2.5 rounded-xl border bg-white/75 px-3.5 transition-colors dark:bg-white/[0.06]',
          error ? 'border-red-400/80' : 'border-line focus-within:border-accent/60',
        )}
      >
        <span className="shrink-0 text-muted">{icon}</span>
        <input
          ref={ref}
          id={id}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          className="h-full min-w-0 flex-1 bg-transparent text-sm text-ink outline-none placeholder:text-muted/70"
          {...inputProps}
        />
        {trailing}
      </div>
      {error && (
        <p id={errorId} className="mt-1 pl-1 text-xs text-red-600 dark:text-red-400">
          {error}
        </p>
      )}
    </div>
  )
}
