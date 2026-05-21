// Cross-component pool for IntersectionObserver / ResizeObserver instances.
// Allocating a fresh observer per virtualised row scales linearly in observer
// count; the browser does the same per-target work with one shared observer
// holding N targets, so we cache one per distinct option set and dispatch
// through a WeakMap<Element, callback>.

type InViewCallback = (inRange: boolean) => void
const inViewCallbacks = new WeakMap<Element, InViewCallback>()
const intersectionPool = new Map<string, IntersectionObserver>()

function getInViewObserver(options: IntersectionObserverInit): IntersectionObserver | null {
  if (typeof IntersectionObserver === 'undefined') return null
  const key = JSON.stringify(options)
  let obs = intersectionPool.get(key)
  if (obs) return obs
  obs = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      inViewCallbacks.get(entry.target)?.(entry.isIntersecting)
    }
  }, options)
  intersectionPool.set(key, obs)
  return obs
}

export function observeInView(
  el: Element,
  options: IntersectionObserverInit,
  cb: InViewCallback,
): () => void {
  const obs = getInViewObserver(options)
  if (!obs) {
    cb(true)
    return () => {}
  }
  inViewCallbacks.set(el, cb)
  obs.observe(el)
  return () => {
    inViewCallbacks.delete(el)
    obs.unobserve(el)
  }
}

type HeightCallback = (height: number) => void
const heightCallbacks = new WeakMap<Element, HeightCallback>()
let sharedResizeObserver: ResizeObserver | null = null

export function observeHeight(el: Element, cb: HeightCallback): () => void {
  if (typeof ResizeObserver === 'undefined') return () => {}
  if (sharedResizeObserver == null) {
    sharedResizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const h = entry.contentRect.height
        if (h > 0) heightCallbacks.get(entry.target)?.(h)
      }
    })
  }
  heightCallbacks.set(el, cb)
  sharedResizeObserver.observe(el)
  return () => {
    heightCallbacks.delete(el)
    sharedResizeObserver?.unobserve(el)
  }
}
