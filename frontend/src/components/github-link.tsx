import { Star } from 'lucide-react'

export function GitHubLink() {
  return (
    <a
      href="https://github.com/conao3/rust-sa"
      target="_blank"
      rel="noreferrer"
      className="inline-flex items-center gap-1.5 text-mute hover:text-ink font-mono text-xs flex-shrink-0"
    >
      <Star size={14} aria-hidden="true" />
      GitHub
    </a>
  )
}
