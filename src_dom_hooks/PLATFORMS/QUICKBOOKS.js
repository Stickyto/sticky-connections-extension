module.exports = {
  id: 'QUICKBOOKS',
  initialMatch: '^https:\\/\\/qbo\\.intuit\\.com\\/app\\/invoice(?:$|\\?.*\\btxnId=\\d+\\b.*$)',
  actionButtonStyle: 'bottom:12px;left:8px;',
  actionButtonText: 'Take payment',
  canAction: () => {
    function isOnNewInvoice () {
      return window.location.href === 'https://qbo.intuit.com/app/invoice'
    }
    function isOnEditInvoice () {
      return /^https:\/\/qbo\.intuit\.com\/app\/invoice\?.*?\btxnId=\d+\b.*$/i.test(window.location.href)
    }
    return isOnNewInvoice() || isOnEditInvoice()
  },
  onAction: () => {
    function getTotal() {
      const valueEl = document.querySelector('div.amount[data-qbo-bind^="textAmount: balanceDueValueText"]')
      if (!valueEl) throw new Error('QuickBooks->onAction: Total value not found')

      const raw = valueEl.textContent.trim()
      const parsed = parseFloat(raw.replace(/[^0-9.]/g, ''))
      if (isNaN(parsed)) throw new Error(`QuickBooks->onAction: Invalid number: "${raw}"`)

      return Math.round(parsed * 100)
    }

    function getUserPaymentId() {
      const valueEl = document.querySelector('[data-automation-id="input-ref-number-sales"]')
      if (!valueEl) throw new Error('QuickBooks->onAction: Invoice number not found')
      return valueEl.value
    }

    try {
      const total = getTotal()
      const userPaymentId = getUserPaymentId()
      console.log('[StickyConnectionsExtension] total', total)
      console.log('[StickyConnectionsExtension] userPaymentId', userPaymentId)
      chrome.runtime.sendMessage({
        platformId: 'QUICKBOOKS',
        type: 'pay',
        newPayment: {
          total,
          userPaymentId
        }
      })
    } catch ({ message }) {
      alert(message)
    }
  }
}
