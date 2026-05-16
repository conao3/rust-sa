import type { ReactNode } from 'react'
import {
  Dialog,
  Modal,
  ModalOverlay,
  type ModalOverlayProps,
} from 'react-aria-components'
import { cn } from '#/lib/cn'

export interface SheetProps extends Omit<ModalOverlayProps, 'children'> {
  title?: ReactNode
  hint?: ReactNode
  children: ReactNode
}

export function Sheet({ title, hint, children, className, ...rest }: SheetProps) {
  return (
    <ModalOverlay
      className={cn(
        'fixed inset-0 z-[100] flex items-center justify-center bg-[rgba(20,18,16,0.45)]',
        typeof className === 'string' ? className : undefined
      )}
      {...rest}
    >
      <Modal className="w-[640px] max-w-[90vw] max-h-[80vh] flex flex-col rounded-[4px] border border-hairline bg-bg">
        <Dialog className="outline-none flex flex-col min-h-0">
          {(title || hint) && (
            <div className="flex items-baseline gap-3 border-b border-hairline px-5 pt-4 pb-3">
              {title && (
                <h2 className="m-0 font-serif text-[24px] font-normal tracking-[-0.01em]">
                  {title}
                </h2>
              )}
              {hint && <p className="m-0 font-mono text-[11.5px] text-mute">{hint}</p>}
            </div>
          )}
          <div className="overflow-y-auto px-5 pt-4 pb-5">{children}</div>
        </Dialog>
      </Modal>
    </ModalOverlay>
  )
}
