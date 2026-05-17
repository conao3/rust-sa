import { RefreshCw } from 'lucide-react'

export function LiveToast({ message = 'refreshed' }: { message?: string }) {
  return (
    <div className="fixed left-1/2 bottom-6 -translate-x-1/2 z-50 inline-flex items-center gap-2 bg-ink text-bg font-mono text-xs px-3 py-2 rounded-sm">
      <RefreshCw size={16} className="text-moss" aria-hidden="true" />
      <span>{message}</span>
    </div>
  )
}
