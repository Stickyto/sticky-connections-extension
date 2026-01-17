const styleDuplicateKeys = []

const noop = () => {}

module.exports = function addStyle (deduplicateKey, string) {
  if (typeof window === 'undefined') return noop
  if (typeof deduplicateKey === 'string' && styleDuplicateKeys.includes(deduplicateKey)) return noop
  const style = document.createElement('style')
  style.textContent = string
  document.head.append(style)
  typeof deduplicateKey === 'string' && styleDuplicateKeys.push(deduplicateKey)
  return () => {
    style.remove()
  }
}
