import type { HTMLAttributes } from 'react'
import { cn } from '#/lib/cn'

export function Kbd({ className, ...rest }: HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn(
        'inline-block rounded-[3px] border border-hairline border-b-2 bg-bg px-1.5 py-[1px] font-mono text-[10.5px] leading-tight text-mute',
        className
      )}
      {...rest}
    />
  )
}
