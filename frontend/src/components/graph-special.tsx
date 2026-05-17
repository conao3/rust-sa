import { CircleDot, FilePen } from 'lucide-react'
import type { MouseEvent } from 'react'
import clsx from 'clsx'

export type SpecialId = 'WORKING' | 'STAGING'

const SPECIAL_DEFS = [
  {
    id: 'WORKING' as const,
    label: 'working',
    description: 'uncommitted (staged + unstaged) vs HEAD',
    icon: FilePen,
  },
  {
    id: 'STAGING' as const,
    label: 'staging',
    description: 'staged (index) vs HEAD',
    icon: CircleDot,
  },
]

export function isSpecial(v: string | null): boolean {
  if (!v) return false
  const u = v.toUpperCase()
  return u === 'WORKING' || u === 'STAGING'
}

export function specialLabel(id: string): string | null {
  const u = id.toUpperCase()
  if (u === 'WORKING') return 'working'
  if (u === 'STAGING') return 'staging'
  return null
}

export function SpecialRows({
  base,
  head,
  rowHeight,
  onSelect,
  onDoubleSelect,
}: {
  base: string | null
  head: string | null
  rowHeight: number
  onSelect: (e: MouseEvent, id: SpecialId) => void
  onDoubleSelect: (id: SpecialId) => void
}) {
  return (
    <div className="border-b border-hairline bg-amber-soft">
      {SPECIAL_DEFS.map(({ id, label, description, icon: Icon }) => {
        const isBase = base === id
        const isHead = head === id
        return (
          <button
            key={id}
            type="button"
            data-spec={id}
            onClick={(e) => onSelect(e, id)}
            onDoubleClick={() => onDoubleSelect(id)}
            style={{ height: rowHeight }}
            className={clsx(
              'w-full text-left flex items-center gap-2 pr-3 pl-3 font-mono text-xs cursor-pointer border-l-2',
              isBase
                ? 'bg-rust-soft border-l-rust'
                : isHead
                  ? 'bg-moss-soft border-l-moss'
                  : 'border-l-transparent hover:bg-amber/10',
            )}
          >
            <Icon size={14} aria-hidden="true" className="text-amber flex-shrink-0" />
            <span className="text-amber font-medium uppercase tracking-wider">{label}</span>
            <span className="text-mute flex-1 whitespace-nowrap overflow-hidden text-ellipsis">
              {description}
            </span>
            {isBase && <span className="text-rust uppercase tracking-wider">base</span>}
            {isHead && <span className="text-moss uppercase tracking-wider">head</span>}
          </button>
        )
      })}
    </div>
  )
}

export function SpecialMeta({ special }: { special: SpecialId }) {
  const def = SPECIAL_DEFS.find((d) => d.id === special)!
  const Icon = def.icon
  return (
    <header className="px-5 pt-5 pb-4 border-b border-hairline bg-amber-soft">
      <div className="flex items-center gap-3 font-mono text-xs">
        <Icon size={16} aria-hidden="true" className="text-amber" />
        <span className="text-amber uppercase tracking-widest font-medium">{def.label}</span>
        <span className="text-mute">·</span>
        <span className="text-mute">{def.description}</span>
      </div>
      <h2 className="mt-2 m-0 font-serif text-xl tracking-tight text-ink">
        {special === 'WORKING' ? 'Working tree changes' : 'Staged changes'}
      </h2>
    </header>
  )
}
