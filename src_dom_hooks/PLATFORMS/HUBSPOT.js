module.exports = {
  id: 'HUBSPOT',
  initialMatch: '^https:\\/\\/(?:app|app-eu1)\\.hubspot\\.com\\/(?:contacts\\/\\d+\\/objects\\/[\\d-]+\\/views\\/[^/]+\\/list\\/?|quotes\\/\\d+\\/details\\/\\d+)(?:\\?.*)?$',
  actionButtonStyle: 'bottom:12px;right:8px;z-index:10000;',
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
    function isOnEditInvoice () {
      return /^https:\/\/app\.hubspot\.com\/contacts\/\d+\/objects\/[\d-]+\/views\/[^/]+\/list\/?$/.test(window.location.href) && document.querySelector('[data-crm-location="CRM_OBJECT_PREVIEW"]')
    }
    return isOnEditInvoice()
  },
  onAction: () => {
    function getTotal() {
      const valueEl = document.querySelector('[data-crm-location="CRM_OBJECT_PREVIEW"] [data-selenium-test="property-input-hs_balance_due"]')
      if (!valueEl) throw new Error('QuickBooks->onAction: Total value not found')

      const raw = valueEl.value.trim()
      const parsed = parseFloat(raw.replace(/[^0-9.]/g, ''))
      if (isNaN(parsed)) throw new Error(`HubSpot->onAction: Invalid number: "${raw}"`)

      return Math.round(parsed * 100)
    }

    function getUserPaymentId() {
      const valueEl = document.querySelector('[data-crm-location="CRM_OBJECT_PREVIEW"] [data-test-id="invoice-highlight-header-content"]')
      if (!valueEl) throw new Error('HubSpot->onAction: Invoice number not found')
      return valueEl.innerText
    }

    function getCurrency () {
      const valueEl = document.querySelector('[data-crm-location="CRM_OBJECT_PREVIEW"] [data-selenium-test="property-input-hs_currency"]')
      if (!valueEl) throw new Error('HubSpot->onAction: Currency not found')
      return valueEl.value
    }

    function getName () {
      const valueEl = document.querySelector('[data-crm-location="CRM_OBJECT_PREVIEW"] [data-selenium-test="contact-chicklet-title-link"]')
      return valueEl ? valueEl.innerText : undefined
    }
    function getEmail () {
      const valueEl = document.querySelector('[data-crm-location="CRM_OBJECT_PREVIEW"] [data-selenium-test="contact-chicklet-email"] span a')
      return valueEl ? valueEl.innerText : undefined
    }
    function getPhone () {
      const valueEl = document.querySelector('[data-crm-location="CRM_OBJECT_PREVIEW"] [data-selenium-test="contact-chicklet-phone"] a span')
      return valueEl ? valueEl.innerText : undefined
    }
    
    try {
      const total = getTotal()
      const currency = getCurrency()
      const userPaymentId = getUserPaymentId()
      console.log('[StickyConnectionsExtension] [HubSpot]', { total, currency, userPaymentId })
      chrome.runtime.sendMessage({
        platformId: 'HUBSPOT',
        type: 'pay',
        newPayment: {
          total,
          currency,
          userPaymentId,
          name: getName(),
          email: getEmail(),
          phone: getPhone()
        }
      })
    } catch ({ message }) {
      alert(message)
    }
  }
}