import {
  ToggleButton,
  ToggleButtonGroup,
  type ToggleButtonGroupProps,
  type ToggleButtonProps,
} from 'react-aria-components'
import { cn } from '#/lib/cn'

export function Segmented({ className, ...rest }: ToggleButtonGroupProps) {
  return (
    <ToggleButtonGroup
      selectionMode="single"
      disallowEmptySelection
      className={cn(
        'inline-flex h-7 overflow-hidden rounded-[3px] border border-hairline bg-bg',
        typeof className === 'string' ? className : undefined
      )}
      {...rest}
    />
  )
}

export function SegmentedItem({ className, ...rest }: ToggleButtonProps) {
  return (
    <ToggleButton
      className={cn(
        'border-0 border-r border-hairline last:border-r-0 bg-transparent px-2.5 font-mono text-[11.5px] text-mute cursor-pointer transition-colors',
        'data-[selected]:bg-ink data-[selected]:text-bg',
        'not-data-[selected]:hover:bg-bg-card',
        typeof className === 'string' ? className : undefined
      )}
      {...rest}
    />
  )
}
