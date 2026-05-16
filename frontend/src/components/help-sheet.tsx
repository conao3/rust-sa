import { Sheet } from '#/components/ui/sheet'
import { Kbd } from '#/components/ui/kbd'

const GROUPS = [
  {
    label: 'Navigation',
    items: [
      { keys: ['j', 'k'], action: 'Move row cursor down / up' },
      { keys: ['n', 'p'], action: 'Next / previous hunk' },
      { keys: ['[', ']'], action: 'Previous / next file' },
      { keys: ['⇧N', '⇧P'], action: 'Next / previous comment thread' },
      { keys: ['/'], action: 'Focus file filter' },
      { keys: ['g', 'g'], action: 'Top of diff' },
      { keys: ['⇧G'], action: 'Bottom of diff' },
    ],
  },
  {
    label: 'Review',
    items: [
      { keys: ['v'], action: 'Toggle Viewed on the current file' },
      { keys: ['c'], action: 'Add a comment on the cursor row' },
      { keys: ['⌘↵'], action: 'Submit current comment draft' },
      { keys: ['esc'], action: 'Cancel compose / close panels' },
    ],
  },
  {
    label: 'Display',
    items: [
      { keys: ['s'], action: 'Toggle split / unified' },
      { keys: ['.'], action: 'Cycle density (compact · regular · comfy)' },
      { keys: ['g'], action: 'Open commit graph (compare picker)' },
      { keys: ['?'], action: 'Open / close this help' },
    ],
  },
] as const

export interface HelpSheetProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
}

export function HelpSheet({ isOpen, onOpenChange }: HelpSheetProps) {
  return (
    <Sheet
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      title="Keybindings"
      hint="vim-flavoured · same bindings as difit where applicable"
    >
      <div className="grid grid-cols-2 gap-y-3 gap-x-8">
        {GROUPS.map((group) => (
          <div key={group.label} className="col-span-2 contents">
            <div className="col-span-2 pt-1 font-mono text-[10.5px] uppercase tracking-[0.06em] text-mute">
              {group.label}
            </div>
            {group.items.map((it) => (
              <div
                key={it.action}
                className="flex items-center justify-between text-[13px] text-ink-2"
              >
                <span>{it.action}</span>
                <span className="inline-flex gap-1">
                  {it.keys.map((k, i) => (
                    <Kbd key={i}>{k}</Kbd>
                  ))}
                </span>
              </div>
            ))}
          </div>
        ))}
      </div>
    </Sheet>
  )
}
