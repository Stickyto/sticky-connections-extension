module.exports = {
  id: 'HUBSPOT',
  initialMatch: '^https:\\/\\/(?:app|app-eu1)\\.hubspot\\.com\\/(?:contacts\\/\\d+\\/objects\\/[\\d-]+\\/views\\/[^/]+\\/list\\/?|quotes\\/\\d+\\/details\\/\\d+)(?:\\?.*)?$',
  onBootHideSelectors: ['[data-test-id="commerce-set-up-payments"]'],
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
      let valueStrings = [
        (() => {
          const dts = document.querySelectorAll('dl > dt')
          for (const dt of dts) {
            if (dt.textContent.includes('Quote amount')) {
              return dt.nextElementSibling?.innerText.trim()
            }
          }
        })(),
        (() => {
          const valueEl = document.querySelector('[data-crm-location="CRM_OBJECT_PREVIEW"] [data-selenium-test="property-input-hs_balance_due"]')
          return valueEl ? valueEl.value.trim() : undefined
        })()
      ]

      const valueEl = valueStrings.find(_ => _)
      if (!valueEl) throw new Error('HubSpot->onAction: Total value not found; is the side bar open?')
      const parsed = parseFloat(valueEl.replace(/[^0-9.]/g, ''))
      if (isNaN(parsed)) throw new Error(`HubSpot->onAction: Invalid number: "${valueEl}"`)

      return Math.round(parsed * 100)
    }

    function getUserPaymentId() {
      let valueStrings = [
        (() => {
          const dts = document.querySelectorAll('dl > dt')
          for (const dt of dts) {
            if (dt.textContent.includes('Quote number')) {
              return dt.nextElementSibling?.innerText.trim()
            }
          }
        })(),
        (() => {
          const valueEl = document.querySelector('[data-crm-location="CRM_OBJECT_PREVIEW"] [data-test-id="invoice-highlight-header-content"]')
          return valueEl ? valueEl.textContent.trim() : undefined
        })()
      ]
      const valueEl = valueStrings.find(_ => _)
      if (!valueEl) throw new Error('HubSpot->onAction: Reference value not found; is the side bar open?')
      return valueEl
    }

    function getCurrency () {
      const valueEl = document.querySelector('[data-crm-location="CRM_OBJECT_PREVIEW"] [data-selenium-test="property-input-hs_currency"]')
      return valueEl ? valueEl.value : undefined
    }

    function getName () {
      const valueEl = document.querySelector('[data-crm-location="CRM_OBJECT_PREVIEW"] [data-selenium-test="contact-chicklet-title-link"]')
      return valueEl ? valueEl.textContent.trim() : undefined
    }
    function getEmail () {
      const valueEl = document.querySelector('[data-crm-location="CRM_OBJECT_PREVIEW"] [data-selenium-test="contact-chicklet-email"] span a')
      return valueEl ? valueEl.textContent.trim() : undefined
    }
    function getPhone () {
      const valueEl = document.querySelector('[data-crm-location="CRM_OBJECT_PREVIEW"] [data-selenium-test="contact-chicklet-phone"] a span')
      return valueEl ? valueEl.textContent.trim() : undefined
    }
    
    try {
      const total = getTotal()
      const currency = getCurrency()
      const userPaymentId = getUserPaymentId()
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