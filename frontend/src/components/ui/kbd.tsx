import type { HTMLAttributes } from 'react'
import { cn } from '#/lib/cn'

export function Kbd({ className, ...rest }: HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn(
        'inline-block rounded-sm border border-hairline border-b-2 bg-bg px-1.5 py-px font-mono text-xs leading-tight text-mute',
        className,
      )}
      {...rest}
    />
  )
}
