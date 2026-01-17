const popUpIframe = require('./popUpIframe')

const ACTIONS = new Map([
  [
    'alert',
    ({ message }) => {
      console.warn('[StickyConnectionsExtension] [ACTIONS] [alert] message', message)
      alert(message)
    }
  ],
  [
    'popUpIframe',
    ({ url }) => {
      console.warn('[StickyConnectionsExtension] [ACTIONS] [popUpIframe] url', url)
      popUpIframe({ src: url })
    }
  ]
])

module.exports = ACTIONS
