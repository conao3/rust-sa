export function isDeepActiveInput(): boolean {
  let el = document.activeElement
  while (el?.shadowRoot?.activeElement) {
    el = el.shadowRoot.activeElement
  }
  if (!el) return false
  if (el instanceof HTMLTextAreaElement) return true
  if (el instanceof HTMLSelectElement) return true
  if (el instanceof HTMLInputElement) {
    const t = el.type
    return t !== 'button' && t !== 'submit' && t !== 'reset'
  }
  if (el instanceof HTMLElement && el.isContentEditable) return true
  return false
}
