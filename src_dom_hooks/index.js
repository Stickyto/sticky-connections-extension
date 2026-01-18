if (!window.location.href) return

const PLATFORMS = require('./PLATFORMS/0-index')
const ACTIONS = require('./ACTIONS')
const addStyle = require('./addStyle')

window.addEventListener('message', (event) => {
  if (event.origin !== window.origin && event.origin !== location.origin) return
  if (event.data?.source !== 'sticky-connections-extension') return
  chrome.runtime.sendMessage(
    {
      type: event.data.type,
      data: event.data.data
    }
  )
})

function runQuerySelector (selector) {
  let el
  try {
    el = document.querySelector(selector)
  } catch (e) {
    console.warn('[StickyConnectionsExtension] invalid selector', selector, e)
    return undefined
  }
  if (!el) {
    return undefined
  }
  if (
    el instanceof HTMLInputElement ||
    el instanceof HTMLTextAreaElement ||
    el instanceof HTMLSelectElement
  ) {
    const v = el.value
    return v != null && v !== '' ? v : undefined
  }
  const text = el.textContent?.trim()
  return text || undefined
}

;(async function () {
  chrome.runtime.onMessage.addListener(data => {
    console.warn('[StickyConnectionsExtension] FROM S data', data)
    const whichAction = ACTIONS.get(data.action)
    whichAction && whichAction(data)
  });

  let { cRegex, cPaymentTotalQuerySelector, cPaymentReferenceQuerySelector } = await new Promise(resolve => {
    chrome.storage.local.get(
      null,
      resolve
    )
  })
  if (cRegex) {
    cRegex = cRegex.trim()
      .replace(/\\\\/g, '\\')
      .replace(/^\/|\/$/g, '')
  }

  const customPlatform = (() => {
    if (!cRegex || !cPaymentTotalQuerySelector || !cPaymentReferenceQuerySelector) {
      return
    }
    const doesCRegexMatch = new RegExp(cRegex, 'i').test(window.location.href)
    if (!doesCRegexMatch) {
      return
    }
    function getVTotal () {
      const _ = runQuerySelector(cPaymentTotalQuerySelector)
      if (_ === undefined) {
        return undefined
      }
      const normalised = _.replace(/[^\d.-]/g, '')
      const cents = Math.round(parseFloat(normalised) * 100)
      return Number.isFinite(cents) ? cents : undefined
    }
    function getVReference () {
      return runQuerySelector(cPaymentReferenceQuerySelector)
    }
    return {
      onBootHideSelectors: [],
      actionButtonStyle: 'bottom:12px;right:8px;',
      actionButtonText: 'Take payment',
      canAction: () => {
        const vTotal = getVTotal()
        return typeof vTotal === 'number'
      },
      onAction: () => {
        try {
          const total = getVTotal()
          const userPaymentId = getVReference()
          chrome.runtime.sendMessage({
            platformId: 'HUBSPOT',
            type: 'pay',
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
  })()

  function onMaybeAction () {
    console.warn('[StickyConnectionsExtension] [onMaybeAction] x1', { cRegex })
    let whichPlatform = PLATFORMS.find(platform => new RegExp(platform.initialMatch, 'i').test(window.location.href)) || customPlatform

    console.warn('[StickyConnectionsExtension] [1]', { whichPlatform, customPlatform })
    if (!whichPlatform) {
      return
    }

    console.warn('[StickyConnectionsExtension] [2] whichPlatform', whichPlatform)
    const { onBootHideSelectors, actionButtonStyle, actionButtonText, canAction: _canAction, customStyle } = whichPlatform

    onBootHideSelectors.forEach(selector => {
      const selectorElements = document.querySelectorAll(selector)
      Array.from(selectorElements)
        .forEach(selectorElement => {
          selectorElement.style.display = 'none'
        })
    })

    const canAction = _canAction()

    const logoSvg = '<svg height="74" viewBox="0 0 50 74" width="50" xmlns="http://www.w3.org/2000/svg"><path d="m42.280552 34.3888116c6.3631722 6.3631723 6.3631722 16.6799129 0 23.0430852l-7.1418065 7.1418065c-7.2964367 7.2964367-19.1262981 7.2964367-26.42273481 0l-4.50043019-4.5004302c-4.9170418-4.9170418-5.52395306-12.6622709-1.47732324-18.2780523l.19309544-.2616611 6.00516699 6.005167c-.73677768 2.51395-.04291801 5.2295914 1.80948401 7.0819934l4.0815984 4.0815985c3.9135433 3.9135433 10.2586508 3.9135433 14.1721941 0l8.0050005-8.0050006c2.6513218-2.6513218 2.6513218-6.9499637 0-9.6012855l-7.4469315-7.4469315c-1.5739329-1.5739329-3.9877816-1.9431152-5.9602046-.9115741l-1.720621.8998532-5.5247537-5.5247537.224755-.2247549c5.3026435-5.3026436 13.8999274-5.3026436 19.202571 0zm3.5038675-20.4620847c4.9170418 4.9170418 5.5239531 12.6622709 1.4773232 18.2780523l-.1930954.2616611-6.005167-6.005167c.7367777-2.51395.042918-5.2295914-1.809484-7.0819934l-4.0815984-4.0815985c-3.9135433-3.9135433-10.2586508-3.9135433-14.1721941 0l-8.0050005 8.0050006c-2.6513218 2.6513218-2.6513218 6.9499637 0 9.6012855l7.4469315 7.4469315c1.5739329 1.5739329 3.9877816 1.9431152 5.9602046.9115741l1.720621-.8998532 5.5247537 5.5247537-.224755.2247549c-5.3026435 5.3026436-13.8999274 5.3026436-19.202571 0l-6.50094006-6.5009401c-6.36317227-6.3631723-6.36317227-16.6799129 0-23.0430852l7.14180646-7.14180647c7.2964367-7.29643674 19.1262981-7.29643674 26.4227348 0z" fill="#fff"/></svg>'

    let actionButtonNow = document.querySelector('.sticky-connections-extension-action-button')
    if (actionButtonNow) {
      actionButtonNow.className = 'sticky-connections-extension-action-button'
      actionButtonNow.style.display = canAction ? 'block' : 'none'
    } else {
      customStyle && addStyle('pop-up-something-2', customStyle)
      actionButtonNow = document.createElement('button')
      actionButtonNow.className = 'sticky-connections-extension-action-button'
      actionButtonNow.innerHTML = `<strong style="font-weight:unset;vertical-align:2px;">${actionButtonText}</strong>`
      actionButtonNow.style = `display:${canAction ? 'block' : 'none'};position:fixed;height:56px;font:18px -apple-system,BlinkMacSystemFont,"Segoe UI","Roboto",sans-serif;font-weight:bold;padding:0 16px 0 56px;border-radius:5000px;background-color:#211552;color:white;z-index:1000;border:0;box-shadow:0 7px 14px 0 rgb(60 66 87 / 20%),0 3px 6px 0 rgb(0 0 0 / 20%);background-image:url("data:image/svg+xml,${encodeURIComponent(logoSvg)}");background-position:16px 8px;background-repeat:no-repeat;background-size:29px 40px;${actionButtonStyle}`
      actionButtonNow.addEventListener('click', whichPlatform.onAction)
      document.body.appendChild(actionButtonNow)
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

  observer.observe(
    document.body,
    {
      childList: true,
      subtree: true
    }
  )
})()
