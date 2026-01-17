module.exports = {
  id: 'QUICKBOOKS',
  initialMatch: '^https:\\/\\/qbo\\.intuit\\.com\\/app\\/invoice(?:$|\\?.*\\btxnId=\\d+\\b.*$)',
  onBootHideSelectors: ['div[data-theme="quickbooks"][role="alert"][class*="paymentSignupPageMessage"]', 'div[id="payment-method-widget"]'],
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
      let valueStrings = [
        (() => {
          const valueEl = document.querySelector('div.amount[data-qbo-bind^="textAmount: balanceDueValueText"]')
          return valueEl ? valueEl.textContent.trim() : undefined
        })(),
        (() => {
          const valueEl = document.querySelector('[data-cy="totalRow"] label + p')
          return valueEl ? valueEl.textContent.trim() : undefined
        })()
      ]
      const valueEl = valueStrings.find(_ => _)
      if (!valueEl) throw new Error('QuickBooks->onAction: Total value not found')

      const parsed = parseFloat(valueEl.replace(/[^0-9.]/g, ''))
      if (isNaN(parsed)) throw new Error(`QuickBooks->onAction: Invalid number: "${valueEl}"`)

      return Math.round(parsed * 100)
    }

    function getUserPaymentId() {
      const valueEl = document.querySelector('[data-automation-id="input-ref-number-sales"]') || document.querySelector('[data-automation-id="reference_number"]')
      if (!valueEl) throw new Error('QuickBooks->onAction: Invoice number not found')
      return valueEl.value
    }

    function getName () {
      let valueStrings = [
        (() => {
          const valueEl = document.querySelector('input[aria-label="Customer"]') || document.querySelector('input[aria-label="Select a customer"]')
          return valueEl ? valueEl.value : undefined
        })()
      ]
      return valueStrings.find(_ => _)
    }

    function getEmail () {
      let valueStrings = [
        (() => {
          const valueEl = document.querySelector('input[aria-label="Cc/Bcc"]') || document.querySelector('input[aria-label="Customer email"]')
          return valueEl ? valueEl.value.split(',')[0].trim() : undefined
        })()
      ]
      return valueStrings.find(_ => _)
    }

    try {
      const total = getTotal()
      const userPaymentId = getUserPaymentId()
      chrome.runtime.sendMessage({
        platformId: 'QUICKBOOKS',
        type: 'pay',
        newPayment: {
          total,
          userPaymentId,
          name: getName(),
          email: getEmail()
        }
      })
    } catch ({ message }) {
      alert(message)
    }
  }
}
