const uuid = require('./uuid')
const addStyle = require('./addStyle')

module.exports = function popUpIframe ({ html, inlineStyle, src, canClose = true, width, height, maxWidth, maxHeight, borderRadius, onClose, insideElementName = 'iframe', showBlocker = true }) {
  document.body.style.overflow = 'hidden'

  const foundIframe = document.querySelector('iframe.pop-up-frame--inside')
  if (foundIframe) {
    foundIframe.src = src
    return
  }
  addStyle(
    'pop-up-something-1',
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
