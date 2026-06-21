module.exports = {
  id: 'COMMUSOFT',
  initialMatch: '^https:\\/\\/app\\.commusoft\\.co\\.uk(?:\\/.*)?$',
  actionButtonStyle: 'bottom:8px;right:8px;',
  actionButtonText: 'Take payment',
  canAction: () => {
    function isOnViewInvoice () {
      return /^https:\/\/app\.commusoft\.co\.uk\/customers\/customer_list\/\d+\/jobs\/\d+\/invoices\/\d+\/view\/?$/i.test(window.location.href)
    }
    return isOnViewInvoice()
  },
  onAction: () => {
    function getTotal() {
      const totals = Array.from(document.querySelectorAll('.view-totals'))

      const row = totals.find(el => {
        const strong = el.querySelector('strong')
        return strong && strong.textContent.trim() === 'Remainder to Pay:'
      })

      if (!row) throw new Error('COMMUSOFT->onAction: Remainder to Pay row not found')

      const container = row.querySelector('td:last-child > span')
      if (!container) throw new Error('COMMUSOFT->onAction: Total value not found')

      const raw = container.textContent.trim()
      const parsed = parseFloat(raw.replace(/[^0-9.]/g, ''))

      if (isNaN(parsed)) {
        throw new Error(`COMMUSOFT->onAction: Invalid number: "${raw}"`)
      }

      return Math.round(parsed * 100)
    }

    function getUserPaymentId() {
      const labels = Array.from(document.querySelectorAll('.field-label'))
      const invoiceLabel = labels.find(el => el.textContent.trim() === 'Invoice no')
      if (!invoiceLabel) throw new Error('[1] COMMUSOFT->onAction: Invoice number label not found')

      const invoiceContainer = invoiceLabel.parentElement.querySelector('[ng-if="job_invoice.draft === false"]')
      if (!invoiceContainer) throw new Error('[2] COMMUSOFT->onAction: Invoice number container not found')

      const invoiceNumber = invoiceContainer.textContent.trim()

      const itemGroups = Array.from(document.querySelectorAll('.item-group'))

      const descriptionGroup = itemGroups.find(el => {
        const label = el.querySelector('span[translate]')
        return label && label.textContent.trim() === 'Job description:'
      })

      if (!descriptionGroup) {
        return invoiceNumber
      }

      const spans = descriptionGroup.querySelectorAll('span.ng-binding')
      const description = spans[0] ? spans[0].textContent.trim() : ''

      if (!description) {
        return invoiceNumber
      }

      return `${invoiceNumber} ${description}`
    }

    function getName () {
      const fields = Array.from(document.querySelectorAll('.field'))

      const field = fields.find(el => {
        const label = el.querySelector('.field-label')
        return label && label.textContent.trim() === 'Job contact'
      })

      if (!field) {
        return undefined
      }

      const container = field.querySelector('.ng-binding')

      return container ? container.textContent.trim() : undefined
    }

    try {
      const total = getTotal()
      const userPaymentId = getUserPaymentId()
      chrome.runtime.sendMessage({
        platformId: 'COMMUSOFT',
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
