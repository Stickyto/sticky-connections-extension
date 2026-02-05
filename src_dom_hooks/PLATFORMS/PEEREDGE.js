module.exports = {
  id: 'PEEREDGE',
  initialMatch: '^https:\\/\\/carrier-voice\\.peeredge\\.com\\/accounting\\/send-payment\\/stripe$',
  onBootHideSelectors: ['button[form="stripe-form"]'],
  actionButtonStyle: 'bottom:12px;right:8px;z-index:10000;',
  actionButtonText: 'Send payment',
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
    return document.querySelector('input[id="stripe-form_amount"]') ? true : false
  },
  onAction: () => {
    function getTotal() {
      let valueStrings = [
        (() => {
          const valueEl = document.querySelector('input[id="stripe-form_amount"]')
          return valueEl ? valueEl.value : undefined
        })()
      ]
      const valueEl = valueStrings.find(_ => _)
      if (!valueEl) throw new Error('Peeredge->onAction: Total value not found')

      const parsed = parseFloat(valueEl.replace(/[^0-9.]/g, ''))
      if (isNaN(parsed)) throw new Error(`Peeredge->onAction: Invalid number: "${valueEl}"`)

      return Math.round(parsed * 100)
    }

    try {
      const total = getTotal()
      chrome.runtime.sendMessage({
        platformId: 'PEEREDGE',
        type: 'pay',
        newPayment: {
          total
        }
      })
    } catch ({ message }) {
      alert(message)
    }
  }
}
