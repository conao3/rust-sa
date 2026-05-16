import { cn } from '#/lib/cn'

export interface ViewedCheckProps {
  isOn: boolean
  onToggle: () => void
}

export function ViewedCheck({ isOn, onToggle }: ViewedCheckProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={cn(
        'inline-flex items-center gap-1.5 px-2 py-1 rounded-[3px] border font-mono text-[11.5px] cursor-pointer transition-colors',
        isOn
          ? 'bg-[var(--moss-soft)] border-moss text-moss'
          : 'bg-bg border-hairline text-mute hover:bg-bg-card',
      )}
    >
      <span aria-hidden="true">{isOn ? '✓' : '○'}</span>
      <span>viewed</span>
    </button>
  )
}
