module.exports = {
  id: 'FREEAGENT',
  initialMatch: '^https:\\/\\/[a-z0-9-]+\\.freeagent\\.com(?:\\/.*)?$',
  onBootHideSelectors: [],
  actionButtonStyle: 'bottom:66px;right:8px;',
  actionButtonText: 'Take payment',
  customStyle: `
    .pop-up-frame--blocker {
      z-index: 10000 !important;
    }
    .pop-up-frame--inside {
      z-index: 10001 !important;
    }
    .pop-up-frame--button {
      z-index: 10001 !important;
    }
  `,
  canAction: () => {
    function isOnViewInvoice () {
      return /^https:\/\/[a-z0-9-]+\.freeagent\.com\/invoices\/\d+\/?$/i.test(window.location.href)
    }
    return isOnViewInvoice()
  },
  onAction: () => {
    function getTotal() {
      const container = document.querySelector('[data-test-id="invoice-total-value"] .fe-KeyValuePair-value')
      if (!container) throw new Error('FreeAgent->onAction: Total row not found')

      const raw = container.textContent.trim()
      const parsed = parseFloat(raw.replace(/[^0-9.]/g, ''))
      if (isNaN(parsed)) throw new Error(`FreeAgent->onAction: Invalid number: "${raw}"`)

      return Math.round(parsed * 100)
    }

    function getUserPaymentId() {
      const value1 = document.querySelector('[data-automationid="invoice-number-input--input"]')
      if (value1) {
        return value1.value
      }
      const container = document.querySelector('#invoice-info h2 strong')
      if (!container) throw new Error('[1] FreeAgent->onAction: Invoice number container not found')

      for (const node of container.childNodes) {
        if (node.nodeType === Node.TEXT_NODE && node.textContent.trim()) {
          return node.textContent.trim()
        }
      }
      throw new Error('FreeAgent->onAction: Invoice number text node not found')
    }

    function getName () {
      const el = document.querySelector('#client-details .fn')
      return el ? el.textContent.trim() : undefined
    }

    try {
      const total = getTotal()
      const userPaymentId = getUserPaymentId()
      chrome.runtime.sendMessage({
        platformId: 'FREEAGENT',
        type: 'pay',
        newPayment: {
          total,
          userPaymentId,
          name: getName()
        }
      })
    } catch ({ message }) {
      alert(message)
    }
  }
}
