console.warn('[StickyConnectionsExtension] 1 BACKGROUND RUNNING!')

const BASE_DOMAIN_API = 'https://sticky.to'
const BASE_DOMAIN_DASHBOARD = 'https://app.instantdebit.co.uk'

function assert (expression, message) {
  if (!expression) {
    throw new Error(message)
  }
}

async function getUser () {
  const storageData = await new Promise(resolve => {
    chrome.storage.local.get(
      ['cPrivateKey', 'cFederatedUserPrivateKey'],
      resolve
    )
  })
  const { cPrivateKey, cFederatedUserPrivateKey } = storageData
  const res = await fetch(
    `${BASE_DOMAIN_API}/v2/users/me`,
    {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${[cPrivateKey, cFederatedUserPrivateKey, ''].join('/')}`
      }
    }
  )
  assert(res.ok, 'Sorry, those keys are not right. Please go to the extension settings.')
  const resData = await res.json()
  return resData
}

function sendReponseToPage (data) {
  chrome.tabs.query(
    { active: true, currentWindow: true },
    tabs => {
      tabs.length > 0 && chrome.tabs.sendMessage(tabs[0].id, data)
    }
  )
}

const FUNCTIONS = new Map([
  [
    'test-connection',
    async (data, sender, sendResponse) => {
      try {
        console.warn('[StickyConnectionsExtension] 3 TEST CONN', data)

        const { cPrivateKey, cFederatedUserPrivateKey } = data
        console.warn('[StickyConnectionsExtension] 4')
        const res = await fetch(
          `${BASE_DOMAIN_API}/v2/users/me`,
          {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${[cPrivateKey, cFederatedUserPrivateKey, ''].join('/')}`
            }
          }
        )
        console.warn('[StickyConnectionsExtension] 5 res', res)
        assert(res.ok, 'Sorry, those keys are not right.')
        const resData = await res.json()
        console.warn('[StickyConnectionsExtension] 6 resData', JSON.stringify(resData))
        sendResponse({ ok: true, message: `Connection to ${resData.user.name} successful!` })
      } catch ({ message }) {
        sendResponse({ ok: false, message })
      }
    }
  ],
  [
    'pay',
    async (data, sender, sendResponse) => {
      try {
        console.warn('[StickyConnectionsExtension] 7 PAY', JSON.stringify(data))

        const user = await getUser()
        console.warn('[StickyConnectionsExtension] 8', JSON.stringify(user))
        const urlParts = [
          `userPrivateKey=${user.user.privateKey}`,
          `userPublicKey=${user.user.publicKey}`,
          `federatedUserPrivateKey=${user.federatedUser.privateKey}`,
          data.newPayment.total !== undefined && `setPaymentTotal=${data.newPayment.total}`,
          data.newPayment.currency !== undefined && `setPaymentCurrency=${data.newPayment.currency}`,
          data.newPayment.userPaymentId !== undefined && `setPaymentUserPaymentId=${encodeURIComponent(data.newPayment.userPaymentId)}`,

          data.newPayment.name !== undefined && `setPaymentName=${encodeURIComponent(data.newPayment.name)}`,
          data.newPayment.email !== undefined && `setPaymentEmail=${encodeURIComponent(data.newPayment.email)}`,
          data.newPayment.phone !== undefined && `setPaymentPhone=${encodeURIComponent(data.newPayment.phone)}`,
        ]
          .filter(_ => _)
        const url = `https://demo.trustistecommerce.com/demos/retailrefundembed?refundAmount=${(data.newPayment.total / 100).toFixed(2)}&firstName=${data.newPayment.name.split(' ')[0]}&lastName=${data.newPayment.name.split(' ')[1]}&requiresApproval=false&nfcTagId=AkDnWirKVU2s2ENA3TR5Rw`
        sendReponseToPage({ action: 'popUpIframe', url: url })
      } catch ({ message }) {
        sendReponseToPage({ action: 'alert', message })
      }
    }
  ]
])

chrome.runtime.onMessage.addListener(
  (data, sender, sendResponse) => {
    console.warn('[StickyConnectionsExtension] 9 ON MSG!', JSON.stringify(data), data.type, data.type === 'test-connection')

    const foundFunction = FUNCTIONS.get(data.type)

    console.warn('[StickyConnectionsExtension] 10 foundFunction', foundFunction)

    if (foundFunction) {
      foundFunction(data, sender, sendResponse)
      return true
    }

    sendResponse({ ok: false, message: 'I cannot handle the data you have sent me.' })
    return true
  }
)
