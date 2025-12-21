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
  // Get 16 random bytes
  const rnds = crypto.getRandomValues(new Uint8Array(16));

  // RFC 4122: set version (4) and variant (10xxxxxx)
  rnds[6] = (rnds[6] & 0x0f) | 0x40; // version 4
  rnds[8] = (rnds[8] & 0x3f) | 0x80; // variant 10xx

  // Precompute hex strings for 0..255
  const hex = [];
  for (let i = 0; i < 256; i++) {
    hex[i] = (i + 0x100).toString(16).substring(1);
  }

  const sep = useUnderscores ? "_" : "-";

  // Assemble xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
  return (
    hex[rnds[0]] +
    hex[rnds[1]] +
    hex[rnds[2]] +
    hex[rnds[3]] + sep +
    hex[rnds[4]] +
    hex[rnds[5]] + sep +
    hex[rnds[6]] +
    hex[rnds[7]] + sep +
    hex[rnds[8]] +
    hex[rnds[9]] + sep +
    hex[rnds[10]] +
    hex[rnds[11]] +
    hex[rnds[12]] +
    hex[rnds[13]] +
    hex[rnds[14]] +
    hex[rnds[15]]
  );
}

function popUpIframe ({ html, inlineStyle, src, canClose = true, width, height, maxWidth, maxHeight, borderRadius, onClose, insideElementName = 'iframe', showBlocker = true }) {
  document.body.style.overflow = 'hidden'

  const foundIframe = document.querySelector('iframe.pop-up-frame--inside')
  if (foundIframe) {
    foundIframe.src = src
    return
  }
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
        z-index: 99;
      }
      .pop-up-frame--inside {
        display: block;
        width: ${typeof width === 'string' ? width : 'calc(100% - 32px)'};
        height: ${typeof height === 'string' ? height : 'calc(100% - 32px)'};
        max-width: ${typeof maxWidth === 'string' ? maxWidth : '1024px'};
        max-height: ${typeof maxHeight === 'string' ? maxHeight : '640px'};
        border-radius: ${typeof borderRadius === 'string' ? borderRadius : '6px'};
        background-color: white;
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        z-index: 100;
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
        z-index: 101;
        box-shadow: 0 2px 4px 0 rgb(60 66 87 / 40%), 0 2px 4px 0 rgb(0 0 0 / 40%);
      }
      .pop-up-frame--button svg {
        color: #211552;
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
      actionButtonStyle: 'bottom:12px;right:8px;',
      actionButtonText: 'Take payment',
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
      pay: () => {
        function getTotal() {
          const container = document.querySelector('[data-automationid="as-total--as-readonly-row"]')
          if (!container) throw new Error('Xero->pay: Total row not found')

          const valueEl = container.querySelector('[data-automationid="as-readonly-row-field"] div.xui-textcolor-standard')
          if (!valueEl) throw new Error('Xero->pay: Total value not found')

          const raw = valueEl.textContent.trim()
          const parsed = parseFloat(raw.replace(/[^0-9.]/g, ''))
          if (isNaN(parsed)) throw new Error(`Xero->pay: Invalid number: "${raw}"`)

          return Math.round(parsed * 100)
        }

        function getUserPaymentId() {
          const container = document.querySelector('.ReadOnlyInvoice-invoiceNumber')
          if (!container) throw new Error('Xero->pay: Invoice number container not found')

          for (const node of container.childNodes) {
            if (node.nodeType === Node.TEXT_NODE && node.textContent.trim()) {
              return node.textContent.trim()
            }
          }

          throw new Error('Xero->pay: Invoice number text node not found')
        }

        try {
          const total = getTotal()
          const userPaymentId = getUserPaymentId()
          console.log('[StickyConnectionsExtension] total', total)
          console.log('[StickyConnectionsExtension] userPaymentId', userPaymentId)
          chrome.runtime.sendMessage({
            type: 'pay',
            domain: 'go.xero.com',
            newPayment: {
              total,
              userPaymentId
            }
          })
        } catch ({ message }) {
          alert(message)
        }
      }
    }
  ],
  [
    'qbo.intuit.com',
    {
      actionButtonStyle: 'bottom:12px;left:8px;',
      actionButtonText: 'Take payment',
      canAction: () => {
        function isOnNewInvoice () {
          return window.location.href === 'https://qbo.intuit.com/app/invoice'
        }
        function isOnEditInvoice () {
          return /^https:\/\/qbo\.intuit\.com\/app\/invoice\?.*?\btxnId=\d+\b.*$/i.test(window.location.href)
        }
        return isOnNewInvoice() || isOnEditInvoice()
      },
      pay: () => {
        function getTotal() {
          const valueEl = document.querySelector('div.amount[data-qbo-bind^="textAmount: balanceDueValueText"]')
          if (!valueEl) throw new Error('QuickBooks: pay: Total value not found')

          const raw = valueEl.textContent.trim()
          const parsed = parseFloat(raw.replace(/[^0-9.]/g, ''))
          if (isNaN(parsed)) throw new Error(`QuickBooks: pay: Invalid number: "${raw}"`)

          return Math.round(parsed * 100)
        }

        function getUserPaymentId() {
          const valueEl = document.querySelector('[data-automation-id="input-ref-number-sales"]')
          if (!valueEl) throw new Error('QuickBooks: pay: Invoice number not found')
          return valueEl.value
        }

        try {
          const total = getTotal()
          const userPaymentId = getUserPaymentId()
          console.log('[StickyConnectionsExtension] total', total)
          console.log('[StickyConnectionsExtension] userPaymentId', userPaymentId)
          chrome.runtime.sendMessage({
            type: 'pay',
            domain: 'qbo.intuit.com',
            newPayment: {
              total,
              userPaymentId
            }
          })
        } catch ({ message }) {
          alert(message)
        }
      }
    }
  ],
  [
    'localhost:3003',
    {
      actionButtonStyle: '',
      actionButtonText: 'Go',
      canAction: () => {
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
      console.warn('[StickyConnectionsExtension] popUpIframe url', url)
    }
  ]
])

window.addEventListener('message', (event) => {
  console.warn('[StickyConnectionsExtension] XYZ 1', event)
  if (event.origin !== window.origin && event.origin !== location.origin) return
  if (event.data?.source !== 'sticky-connections') return

  console.warn('[StickyConnectionsExtension] XYZ 2')

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
    console.warn('[StickyConnectionsExtension] FROM S data', data)
    const whichAction = ACTIONS.get(data.action)
    whichAction && whichAction(data)
  });

  function onMaybeAction () {
    console.warn('[StickyConnectionsExtension] [onMaybeAction]')
    const whichDomain = DOMAINS.get(window.location.host)
    console.warn('[StickyConnectionsExtension] whichDomain', whichDomain)
    if (!whichDomain) {
      return
    }
    const { actionButtonStyle, actionButtonText, canAction: _canAction } = whichDomain
    const canAction = _canAction()

    const logoSvg = '<svg height="74" viewBox="0 0 50 74" width="50" xmlns="http://www.w3.org/2000/svg"><path d="m42.280552 34.3888116c6.3631722 6.3631723 6.3631722 16.6799129 0 23.0430852l-7.1418065 7.1418065c-7.2964367 7.2964367-19.1262981 7.2964367-26.42273481 0l-4.50043019-4.5004302c-4.9170418-4.9170418-5.52395306-12.6622709-1.47732324-18.2780523l.19309544-.2616611 6.00516699 6.005167c-.73677768 2.51395-.04291801 5.2295914 1.80948401 7.0819934l4.0815984 4.0815985c3.9135433 3.9135433 10.2586508 3.9135433 14.1721941 0l8.0050005-8.0050006c2.6513218-2.6513218 2.6513218-6.9499637 0-9.6012855l-7.4469315-7.4469315c-1.5739329-1.5739329-3.9877816-1.9431152-5.9602046-.9115741l-1.720621.8998532-5.5247537-5.5247537.224755-.2247549c5.3026435-5.3026436 13.8999274-5.3026436 19.202571 0zm3.5038675-20.4620847c4.9170418 4.9170418 5.5239531 12.6622709 1.4773232 18.2780523l-.1930954.2616611-6.005167-6.005167c.7367777-2.51395.042918-5.2295914-1.809484-7.0819934l-4.0815984-4.0815985c-3.9135433-3.9135433-10.2586508-3.9135433-14.1721941 0l-8.0050005 8.0050006c-2.6513218 2.6513218-2.6513218 6.9499637 0 9.6012855l7.4469315 7.4469315c1.5739329 1.5739329 3.9877816 1.9431152 5.9602046.9115741l1.720621-.8998532 5.5247537 5.5247537-.224755.2247549c-5.3026435 5.3026436-13.8999274 5.3026436-19.202571 0l-6.50094006-6.5009401c-6.36317227-6.3631723-6.36317227-16.6799129 0-23.0430852l7.14180646-7.14180647c7.2964367-7.29643674 19.1262981-7.29643674 26.4227348 0z" fill="#fff"/></svg>'

    let payButtonNow = document.querySelector('.sticky-pay-button')
    if (payButtonNow) {
      payButtonNow.className = 'sticky-pay-button'
      payButtonNow.style.display = canAction ? 'block' : 'none'
    } else {
      payButtonNow = document.createElement('button')
      payButtonNow.className = 'sticky-pay-button'
      payButtonNow.innerHTML = `<strong style="font-weight:unset;vertical-align:2px;">${actionButtonText}</strong>`
      payButtonNow.style = `display:${canAction ? 'block' : 'none'};position:fixed;${actionButtonStyle}height:56px;font:18px -apple-system,BlinkMacSystemFont,"Segoe UI","Roboto",sans-serif;font-weight:bold;padding:0 16px 0 56px;border-radius:5000px;background-color:#211552;color:white;z-index:1000;border:0;box-shadow:0 7px 14px 0 rgb(60 66 87 / 20%),0 3px 6px 0 rgb(0 0 0 / 20%);background-image:url("data:image/svg+xml,${encodeURIComponent(logoSvg)}");background-position:16px 8px;background-repeat:no-repeat;background-size:29px 40px;`
      payButtonNow.addEventListener('click', whichDomain.pay)
      document.body.appendChild(payButtonNow)
    }
  }

  window.addEventListener(
    'stickyConnections:onMaybeAction',
    () => {
      setTimeout(onMaybeAction, 0)
    }
  )

  onMaybeAction()

  let onMaybeActionDebouncer = null
  let onMaybeActionIsRunning = false

  const observer = new MutationObserver(
    () => {
      if (onMaybeActionIsRunning) return

      clearTimeout(onMaybeActionDebouncer)
      onMaybeActionDebouncer = setTimeout(
        () => {
          onMaybeActionIsRunning = true
          try {
            onMaybeAction()
          } finally {
            onMaybeActionIsRunning = false
          }
        },
        250
      )
    }
  )

  observer.observe(document.body, {
    childList: true,
    subtree: true
  })
})()
