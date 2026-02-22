module.exports = {
  id: 'GLOBAL_PAYMENTS',
  initialMatch: '^https:\\/\\/myaccount\\.globalpayments\\.com(?:\\/.*)?$',
  onBootHideSelectors: [],
  actionButtonText: 'Instant Refund',
  actionButtonStyle: 'bottom:12px;right:8px;z-index:10000;',
  canAction: () => {
    function isOnAnything () {
      return window.location.host === 'myaccount.globalpayments.com'
    }
    return isOnAnything()
  },
  onAction: () => {
    function getTotal () {
      return 123
    }

    function getUserPaymentId () {
      return 'REF456'
    }

    function getName () {
      return 'Cormac Bane'
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
