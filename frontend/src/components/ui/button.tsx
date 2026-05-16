import { Button as AriaButton, type ButtonProps as AriaButtonProps } from 'react-aria-components'
import { cn } from '#/lib/cn'

const variants = {
  primary:
    'bg-rust text-[#fff8ee] border-rust hover:bg-rust-deep hover:border-rust-deep',
  secondary:
    'bg-bg text-ink border-hairline hover:bg-bg-card',
  ghost:
    'bg-transparent text-ink-2 border-transparent hover:bg-bg-card',
} as const

type Variant = keyof typeof variants
type Size = 'sm' | 'md'

export interface ButtonProps extends AriaButtonProps {
  variant?: Variant
  size?: Size
}

export function Button({ variant = 'secondary', size = 'md', className, ...rest }: ButtonProps) {
  return (
    <AriaButton
      className={cn(
        'inline-flex items-center justify-center gap-1.5 rounded-[3px] border font-mono leading-none transition-colors duration-100 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50',
        size === 'sm' ? 'h-[22px] px-1.5 text-[11px]' : 'h-7 px-2.5 text-xs',
        variants[variant],
        typeof className === 'string' ? className : undefined
      )}
      {...rest}
    />
  )
}
