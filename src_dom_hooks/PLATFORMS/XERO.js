module.exports = {
  id: 'XERO',
  initialMatch: '^https:\\/\\/go\\.xero\\.com\\/app\\/[^/]+\\/invoicing\\/.*$',
  onBootHideSelectors: ['[data-automationid="StartStripeSetupBanner-banner"]'],
  actionButtonStyle: 'bottom:12px;right:8px;',
  actionButtonText: 'Refund',
  canAction: () => {
    function isOnNewInvoice () {
      return /^https:\/\/go\.xero\.com\/app\/[^/]+\/invoicing\/?$/.test(window.location.href)
    }
    function isOnEditInvoice () {
      return /^https:\/\/go\.xero\.com\/app\/[^/]+\/invoicing\/edit\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(window.location.href)
    }
    function isOnViewInvoice () {
      return /^https:\/\/go\.xero\.com\/app\/[^/]+\/invoicing\/view\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(window.location.href)
    }
    return isOnNewInvoice() || isOnEditInvoice() || isOnViewInvoice()
  },
  onAction: () => {
    function getTotal() {
      const container = document.querySelector('[data-automationid="as-total--as-readonly-row"]')
      if (!container) throw new Error('Xero->onAction: Total row not found')

      const valueEl = container.querySelector('[data-automationid="as-readonly-row-field"] div.xui-textcolor-standard')
      if (!valueEl) throw new Error('Xero->onAction: Total value not found')

      const raw = valueEl.textContent.trim()
      const parsed = parseFloat(raw.replace(/[^0-9.]/g, ''))
      if (isNaN(parsed)) throw new Error(`Xero->onAction: Invalid number: "${raw}"`)

      return Math.round(parsed * 100)
    }

    function getUserPaymentId() {
      const value1 = document.querySelector('[data-automationid="invoice-number-input--input"]')
      if (value1) {
        return value1.value
      }
      const container = document.querySelector('.ReadOnlyInvoice-invoiceNumber')
      if (!container) throw new Error('[1] Xero->onAction: Invoice number container not found')

      for (const node of container.childNodes) {
        if (node.nodeType === Node.TEXT_NODE && node.textContent.trim()) {
          return node.textContent.trim()
        }
      }
      throw new Error('Xero->onAction: Invoice number text node not found')
    }

    function getName () {
      const el = document.querySelector('[data-automationid="contacts-picker-search-field--input"]')
      return el ? el.value : undefined
    }

    try {
      const total = getTotal()
      const userPaymentId = getUserPaymentId()
      chrome.runtime.sendMessage({
        platformId: 'XERO',
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
