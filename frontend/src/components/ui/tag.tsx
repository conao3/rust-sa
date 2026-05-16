import type { HTMLAttributes } from 'react'
import { cn } from '#/lib/cn'

const tones = {
  rust: 'bg-rust text-[#fff8ee]',
  amber: 'bg-amber text-ink',
  moss: 'bg-[var(--moss-strong)] text-moss',
  neutral: 'bg-bg-card text-ink border border-hairline',
} as const

export interface TagProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: keyof typeof tones
}

export function Tag({ tone = 'neutral', className, ...rest }: TagProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2 py-[3px] font-mono text-[10.5px] leading-none',
        tones[tone],
        className
      )}
      {...rest}
    />
  )
}
