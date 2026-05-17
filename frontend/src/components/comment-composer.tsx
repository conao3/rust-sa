import { Send, X } from 'lucide-react'
import { Button } from '#/components/ui/button'

export interface CommentComposerProps {
  startLineNumber: number
  endLineNumber: number
  value: string
  onChange: (value: string) => void
  onSubmit: (body: string) => void
  onCancel: () => void
}

export function CommentComposer({
  startLineNumber,
  endLineNumber,
  value,
  onChange,
  onSubmit,
  onCancel,
}: CommentComposerProps) {
  const submit = () => {
    if (!value.trim()) return
    onSubmit(value.trim())
  }
  const range =
    startLineNumber === endLineNumber
      ? `L${startLineNumber}`
      : `L${startLineNumber}–L${endLineNumber}`
  return (
    <div
      data-rust-sa-composer
      className="bg-bg-soft border-y border-hairline-soft px-4 py-2.5 pl-15"
    >
      <div className="bg-bg border border-hairline rounded-sm px-3 py-2.5 flex flex-col gap-2">
        <div className="font-mono text-xs uppercase tracking-widest text-mute">{range}</div>
        <textarea
          autoFocus
          className="border-0 outline-0 bg-transparent resize-none font-sans text-sm text-ink w-full min-h-14 p-0"
          placeholder="Leave a comment…"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              e.preventDefault()
              onCancel()
            }
            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
              e.preventDefault()
              submit()
            }
          }}
        />
        <div className="flex items-center gap-2">
          <span className="flex-1 font-mono text-xs text-faint">⌘↵ submit · esc cancel</span>
          <Button variant="ghost" size="sm" onPress={onCancel}>
            <X size={11} aria-hidden="true" />
            cancel
          </Button>
          <Button variant="primary" size="sm" onPress={submit} isDisabled={!value.trim()}>
            <Send size={11} aria-hidden="true" />
            submit
          </Button>
        </div>
      </div>
    </div>
  )
}
