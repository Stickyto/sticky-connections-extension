const DOMAINS = new Map([
  [
    'go.xero.com',
    {
      boot: () => {},
      canPay: () => {
        function isOnNewInvoice () {
          return /^https:\/\/go\.xero\.com\/app\/[^/]+\/invoicing\/?$/.test(window.location.href)
        }
        function isOnEditInvoice () {
          return /^https:\/\/go\.xero\.com\/app\/[^/]+\/invoicing\/edit\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(window.location.href)
        }
        return (isOnNewInvoice() || isOnEditInvoice())
      },
      pay: () => {
        chrome.runtime.sendMessage({
          type: 'pay',
          domain: 'go.xero.com',
          newPayment: {
            total: 100,
            userPaymentId: 'INV-XYZ'
          }
        })
      }
    }
  ],
  [
    'localhost:3003',
    {
      boot: () => {},
      canPay: () => {
        return false
      },
      pay: () => {}
    }
  ]
])

const ACTIONS = new Map([
  [
    'alert',
    ({ message }) => {
      alert(message)
    }
  ],
  [
    'popUpIframe',
    ({ url }) => {
      console.warn('xxx GO TO', url)
    }
  ]
])

window.addEventListener('message', (event) => {
  console.warn('xxx XYZ 1', event)
  if (event.origin !== window.origin && event.origin !== location.origin) return
  if (event.data?.source !== 'sticky-connections') return

  console.warn('xxx XYZ 2')

  // Forward to background
  chrome.runtime.sendMessage(
    {
      type: event.data.type,
      data: event.data.data
    },
    (res) => {
      // Optionally forward response back to page
      // window.postMessage({
      //   source: 'my-extension',
      //   type: 'extension-response',
      //   result: res
      // }, '*')
    }
  )
})

;(async function () {
  chrome.runtime.onMessage.addListener(data => {
    console.warn('xxx FROM SOMEWHERE data', data)
    const whichAction = ACTIONS.get(data.action)
    whichAction && whichAction(data)
  });

  console.warn('xxx extension booted')
  const whichDomain = DOMAINS.get(window.location.host)
  console.warn('xxx whichDomain', whichDomain)
  if (!whichDomain) {
    return
  }
  await whichDomain.boot()
  const canPay = whichDomain.canPay()

  if (canPay) {
    const payButton = document.createElement('button')
    payButton.innerHTML = '<strong style="vertical-align:2px;">Take payment</strong>'
    payButton.style = 'display:block;position:fixed;bottom:12px;right:8px;height:56px;font:18px -apple-system,BlinkMacSystemFont,"Segoe UI","Roboto",sans-serif;font-weight:bold;padding:0 16px 0 56px;border-radius:5000px;background-color:#1A1F35;color:white;z-index:1000;border:0;box-shadow:0 7px 14px 0 rgb(60 66 87 / 20%),0 3px 6px 0 rgb(0 0 0 / 20%);background-image:url("https://cdn.sticky.to/symbol-deploy-white.svg"),url("https://cdn.sticky.to/symbol-deploy-background.jpg");background-position:16px 8px,center;background-repeat:no-repeat,no-repeat;background-size:29px 40px,cover;'

    payButton.addEventListener('click', whichDomain.pay)

    document.body.appendChild(payButton)
  }
})()
