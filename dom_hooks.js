const styleDuplicateKeys = []

const noop = () => {}

function addStyle (deduplicateKey, string) {
  if (typeof window === 'undefined') return noop
  if (typeof deduplicateKey === 'string' && styleDuplicateKeys.includes(deduplicateKey)) return noop
  const style = document.createElement('style')
  style.textContent = string
  document.head.append(style)
  typeof deduplicateKey === 'string' && styleDuplicateKeys.push(deduplicateKey)
  return () => {
    style.remove()
  }
}

function uuid (useUnderscores = false) {
  const base = !useUnderscores ? 'zzzzzzzz-zzzz-4zzz-yzzz-zzzzzzzzzzzz' : 'zzzzzzzz_zzzz_4zzz_yzzz_zzzzzzzzzzzz'
  let
    d = new Date().getTime(),
    d2 = (performance && performance.now && (performance.now() * 1000)) || 0
  return base.replace(/[zy]/g, c => {
    let r = Math.random() * 16
    if (d > 0) {
      r = (d + r) % 16 | 0
      d = Math.floor(d / 16)
    } else {
      r = (d2 + r) % 16 | 0
      d2 = Math.floor(d2 / 16)
    }
    return (c == 'z' ? r : (r & 0x7 | 0x8)).toString(16)
  })
}


function popUpIframe ({ html, inlineStyle, src, canClose = true, width, height, maxWidth, maxHeight, borderRadius, onClose, insideElementName = 'iframe', showBlocker = true }) {
  document.body.style.overflow = 'hidden'

  addStyle(
    'pop-up-something',
    `
      .pop-up-frame--blocker {
        background-color: rgba(0, 0, 0, 0.85);
        backdrop-filter: blur(8px);
        position: fixed;
        top: 0;
        left: 0;
        bottom: 0;
        right: 0;
        z-index: 3;
      }
      .pop-up-frame--inside {
        display: block;
        width: ${typeof width === 'string' ? width : 'calc(100% - 32px)'};
        height: ${typeof height === 'string' ? height : 'calc(100% - 32px)'};
        max-width: ${typeof maxWidth === 'string' ? maxWidth : 'calc(100% - 32px)'};
        max-height: ${typeof maxHeight === 'string' ? maxHeight : '640px'};
        border-radius: ${typeof borderRadius === 'string' ? borderRadius : '6px'};
        background-color: white;
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        z-index: 8;
        box-shadow: rgba(60, 68, 86, 0.2) 0px 3px 6px 0px, rgba(0, 0, 0, 0.2) 0px 1px 2px 0px;
        border: 0;
      }
      .pop-up-frame--button {
        display: block;
        width: 28px;
        height: 28px;
        font-size: 28px;
        background-color: white;
        color: white;
        border-radius: 50%;
        position: absolute;
        top: 20px;
        right: 20px;
        z-index: 9;
        box-shadow: 0 2px 4px 0 rgb(60 66 87 / 40%), 0 2px 4px 0 rgb(0 0 0 / 40%);
      }
      .pop-up-frame--button svg {
        color: #1A1F35;
        display: block;
        width: 20px;
        margin: 0 auto 0 auto;
        position: absolute;
        top: 0px;
        left: 2px;
      }
    `
  )

  const blocker = document.createElement('div')
  showBlocker && ((e, es) => {
    e.setAttribute('role', 'presentation')
    e.classList.add('pop-up-frame--blocker')
    document.body.appendChild(e)
  })(blocker, blocker.style)

  const insideElementId = uuid()
  const insideElement = document.createElement(insideElementName)
  ;((e, es) => {
    e.setAttribute('role', 'dialog')
    e.ariaModal = 'true'
    e.name = 'pop-up-frame--inside'
    e.classList.add('pop-up-frame--inside')
    e.id = insideElementId
    document.body.appendChild(e)
    if (typeof html === 'string' && insideElementName === 'iframe') {
      e.contentWindow.document.open()
      e.contentWindow.document.write(html)
      e.contentWindow.document.close()
    }
    if (src && insideElementName === 'iframe') {
      e.src = src
    }
    if (typeof inlineStyle === 'string') {
      e.style = inlineStyle
    }
    if (typeof html === 'string' && ['div', 'form'].includes(insideElementName)) {
      e.innerHTML = html
    }
  })(insideElement, insideElement.style)

  let closeButton
  if (canClose) {
    closeButton = document.createElement('button')
    ;((e, es) => {
      e.innerHTML = '<svg fill="none" height="24" stroke="currentColor" stroke-linecap="round" stroke-width="3" viewbox="0 0 24 24" width="24" xmlns="http://www.w3.org/2000/svg"><path d="m18 6-12 12"/><path d="m6 6 12 12"/></svg>'
      e.classList.add('pop-up-frame--button')
      e.addEventListener('click', () => {
        doClose()
        onClose && onClose()
      })
      document.body.appendChild(e)
    })(closeButton, closeButton.style)
  }

  const doClose = () => {
    document.body.style.overflow = 'visible'
    blocker.remove()
    insideElement.remove()
    canClose && closeButton.remove()
  }
  return {
    doClose,
    element: insideElement,
    elementId: insideElementId
  }
}


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
        function isOnViewInvoice () {
          return /^https:\/\/go\.xero\.com\/app\/[^/]+\/invoicing\/view\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(window.location.href)
        }
        return (isOnNewInvoice() || isOnEditInvoice()) || isOnViewInvoice()
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
      popUpIframe({ src: url })
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
