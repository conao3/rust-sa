import type { ReactNode } from 'react'
import { HelpCircle } from 'lucide-react'
import { Button } from '#/components/ui/button'
import { Segmented, SegmentedItem } from '#/components/ui/segmented'

export type Mode = 'unified' | 'split'
export type Theme = 'light' | 'dark'
export type View = 'diff' | 'graph'

export interface TopBarProps {
  base: string
  head: string
  separator?: '··' | '···'
  mode: Mode
  onModeChange: (mode: Mode) => void
  theme: Theme
  onThemeChange: (theme: Theme) => void
  view: View
  onViewChange: (view: View) => void
  viewedCount: number
  totalCount: number
  onHelp: () => void
  isLive?: boolean
  right?: ReactNode
}

function ViewedProgress({ count, total }: { count: number; total: number }) {
  const pct = total === 0 ? 0 : Math.round((count / total) * 100)
  return (
    <div
      className="flex items-center gap-2 font-mono text-[11.5px] text-mute"
      title={`${count} / ${total} files viewed`}
    >
      <span className="text-ink">
        {count}/{total}
      </span>
      <div className="relative w-[100px] h-[5px] bg-bg-card rounded-full overflow-hidden">
        <i
          className="absolute top-0 left-0 bottom-0 bg-moss transition-[width] duration-200"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span>{pct}%</span>
    </div>
  )
}

function ViewTabs({ value, onChange }: { value: View; onChange: (v: View) => void }) {
  const tabs: View[] = ['diff', 'graph']
  return (
    <div className="inline-flex pl-3 ml-2 border-l border-hairline">
      {tabs.map((tab) => {
        const active = tab === value
        return (
          <button
            key={tab}
            type="button"
            onClick={() => onChange(tab)}
            className={
              'relative border-0 bg-transparent font-mono text-[11.5px] py-2 px-3 cursor-pointer tracking-[0.02em] ' +
              (active ? 'text-ink' : 'text-mute')
            }
          >
            {tab}
            {active && (
              <span className="absolute left-2 right-2 -bottom-px h-[2px] bg-rust" />
            )}
          </button>
        )
      })}
    </div>
  )
}

function BrandMark() {
  return (
    <span className="inline-flex items-center gap-[2px]" aria-hidden="true">
      <i className="inline-block w-1 h-[14px] bg-rust" />
      <i className="inline-block w-1 h-[14px] bg-ink mt-1" />
      <i className="inline-block w-1 h-[14px] bg-rust opacity-50 -mt-1" />
    </span>
  )
}

export function TopBar({
  base,
  head,
  separator = '···',
  mode,
  onModeChange,
  theme,
  onThemeChange,
  view,
  onViewChange,
  viewedCount,
  totalCount,
  onHelp,
  isLive,
  right,
}: TopBarProps) {
  return (
    <header className="flex items-center gap-4 px-4 h-[var(--topbar-h)] bg-bg font-mono text-[12.5px] text-ink-2">
      <div className="flex items-center gap-2 mr-1 flex-shrink-0 whitespace-nowrap text-ink text-[13px]">
        <BrandMark />
        <span className="font-medium">rust-sa</span>
      </div>

      <div className="flex items-center gap-2 pl-4 border-l border-hairline flex-shrink-0">
        <span className="text-ink">{base}</span>
        <span className="text-mute">{separator}</span>
        <span className="text-ink">{head}</span>
      </div>

      {isLive && (
        <span className="inline-flex items-center gap-1.5 px-2 py-[3px] border border-moss text-moss rounded-[3px] text-[11px] tracking-[0.02em] flex-shrink-0">
          <span className="w-1.5 h-1.5 rounded-full bg-moss" />
          live
        </span>
      )}

      <ViewedProgress count={viewedCount} total={totalCount} />

      <div className="ml-auto flex items-center gap-3">
        {right}
        <ViewTabs value={view} onChange={onViewChange} />
        <Segmented
          aria-label="View mode"
          selectedKeys={[mode]}
          onSelectionChange={(keys) => {
            const first = [...keys][0]
            if (first === 'unified' || first === 'split') onModeChange(first)
          }}
        >
          <SegmentedItem id="unified">unified</SegmentedItem>
          <SegmentedItem id="split">split</SegmentedItem>
        </Segmented>
        <Segmented
          aria-label="Theme"
          selectedKeys={[theme]}
          onSelectionChange={(keys) => {
            const first = [...keys][0]
            if (first === 'light' || first === 'dark') onThemeChange(first)
          }}
        >
          <SegmentedItem id="light">light</SegmentedItem>
          <SegmentedItem id="dark">dark</SegmentedItem>
        </Segmented>
        <Button
          variant="ghost"
          size="md"
          onPress={onHelp}
          aria-label="Keybindings"
          className="w-7 px-0 justify-center"
        >
          <HelpCircle size={16} />
        </Button>
      </div>
    </header>
  )
}
