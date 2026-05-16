export function LiveToast({ message = 'refreshed' }: { message?: string }) {
  return (
    <div className="fixed left-1/2 bottom-6 -translate-x-1/2 z-50 inline-flex items-center gap-2 bg-ink text-bg font-mono text-[12px] px-3 py-2 rounded-[3px]">
      <span className="w-1.5 h-1.5 rounded-full bg-moss inline-block" />
      <span>{message}</span>
    </div>
  )
}
