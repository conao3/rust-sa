import { useState } from 'react'
import { Button } from '#/components/ui/button'

export interface CommentComposerProps {
  onSubmit: (body: string) => void
  onCancel: () => void
}

export function CommentComposer({ onSubmit, onCancel }: CommentComposerProps) {
  const [body, setBody] = useState('')
  const submit = () => {
    if (!body.trim()) return
    onSubmit(body.trim())
  }
  return (
    <div className="bg-bg-soft border-y border-hairline-soft px-4 py-2.5 pl-[60px]">
      <div className="bg-bg border border-hairline rounded-[3px] px-3 py-2.5 flex flex-col gap-2">
        <textarea
          autoFocus
          className="border-0 outline-0 bg-transparent resize-none font-sans text-[13.5px] text-ink w-full min-h-[56px] p-0"
          placeholder="Leave a comment…"
          value={body}
          onChange={(e) => setBody(e.target.value)}
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
          <span className="flex-1 font-mono text-[10.5px] text-faint">
            ⌘↵ submit · esc cancel
          </span>
          <Button variant="ghost" size="sm" onPress={onCancel}>
            cancel
          </Button>
          <Button variant="primary" size="sm" onPress={submit} isDisabled={!body.trim()}>
            submit
          </Button>
        </div>
      </div>
    </div>
  )
}
