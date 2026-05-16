import { Button } from '#/components/ui/button'
import type { Comment } from '#/lib/comments'

export interface CommentThreadProps {
  comments: Comment[]
  onDelete?: (id: string) => void
}

function promptFor(c: Comment): string {
  return `Re: ${c.path}:${c.lineNumber}\n${c.body}`
}

export function CommentThread({ comments, onDelete }: CommentThreadProps) {
  if (comments.length === 0) return null
  return (
    <div className="bg-bg-soft border-y border-hairline-soft px-4 py-2.5 pl-[60px] font-sans text-[13px] flex flex-col gap-2">
      {comments.map((c) => (
        <div
          key={c.id}
          className="bg-bg border border-hairline rounded-[3px] px-3 py-2.5 flex flex-col gap-1.5"
        >
          <div className="flex items-center gap-2 font-mono text-[11.5px] text-mute">
            <span
              className={c.author.includes('claude') ? 'text-rust font-medium' : 'text-ink font-medium'}
            >
              {c.author.includes('claude') ? '✦ ' : ''}
              {c.author}
            </span>
            <span>· {timeAgo(c.createdAt)}</span>
          </div>
          <div className="text-[13.5px] leading-[1.5] text-ink-2 whitespace-pre-wrap">
            {c.body}
          </div>
          <div className="flex items-center gap-2">
            <span className="flex-1" />
            <Button
              variant="ghost"
              size="sm"
              onPress={() => navigator.clipboard?.writeText(promptFor(c))}
            >
              copy prompt
            </Button>
            {onDelete && (
              <Button variant="ghost" size="sm" onPress={() => onDelete(c.id)}>
                delete
              </Button>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}

function timeAgo(iso: string): string {
  const sec = Math.floor((Date.now() - new Date(iso).getTime()) / 1000)
  if (sec < 60) return 'just now'
  if (sec < 3600) return `${Math.floor(sec / 60)}m ago`
  if (sec < 86400) return `${Math.floor(sec / 3600)}h ago`
  return `${Math.floor(sec / 86400)}d ago`
}
