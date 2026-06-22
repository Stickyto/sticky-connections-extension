module.exports = {
  id: 'AUTOCAB',
  initialMatch: '^https:\\/\\/dispatch\\.autocab365\\.com\\/version\\/[^/]+\\/#\\/$',
  actionButtonStyle: 'bottom:8px;right:8px;',
  actionButtonText: 'Take payment',
  canAction: () => {
    const e = document.querySelector('input[name="telephoneNumber"]')
    return e && e.value.length > 0
  },
  onAction: () => {
    try {
      chrome.runtime.sendMessage({
        type: 'pay',
        newPayment: {
          total: 123,
          userPaymentId: 'ABC',
          name: 'Jack'
        }
      })
    } catch ({ message }) {
      alert(message)
    }
  }
}
