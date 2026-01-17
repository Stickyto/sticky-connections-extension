window.addEventListener(
  'load',
  () => {
    const { version } = chrome.runtime.getManifest()
    document.querySelector('.version p').innerHTML = `Version ${version}`

    console.warn('[StickyConnectionsExtension] 15 load')

    function sendMessageAsync (message) {
      return new Promise((resolve, reject) => {
        chrome.runtime.sendMessage(message, response => {
          console.warn('[StickyConnectionsExtension] 16 DEBUG', JSON.stringify(response))
          if (chrome.runtime.lastError) {
            return reject(new Error(chrome.runtime.lastError.message));
          }
          response.ok && resolve(response.message)
          !response.ok && reject(response.message)
        });
      });
    }

    const testConnectionButton = document.querySelector('button')
    testConnectionButton.addEventListener(
      'click',
      () => {
        console.warn('[StickyConnectionsExtension] 17 ON CLICK!')

        sendMessageAsync({ type: 'test-connection', ...storageData })
          .then(message => {
            console.warn('[StickyConnectionsExtension] 18 RETURNED 1', message)
            document.querySelector('.banner p').innerHTML = message
            document.querySelector('.banner').style.display = 'block'
          })
          .catch(message => {
            console.warn('[StickyConnectionsExtension] 19 RETURNED 2', message)
            document.querySelector('.banner p').innerHTML = message
            document.querySelector('.banner').style.display = 'block'
          })
      }
    )

    let storageData = {}
    chrome.storage.local.get(
      ['cPrivateKey', 'cFederatedUserPrivateKey'],
      data => {
        console.warn('[StickyConnectionsExtension] 20 data from chrome storage', data)
        storageData = {
          ...storageData,
          ...data
        }
        Object.keys(data).forEach(_ => {
          console.warn('[StickyConnectionsExtension] 21 data _ inside for loop', _)
          document.getElementById(_).value = data[_]
        })
        console.warn('[StickyConnectionsExtension] 22 storageData after ... munging', storageData)
      }
    )

    function fiOnChange(_) {
      console.warn('[StickyConnectionsExtension] 23 fiOnChange', _)
      storageData[_.target.id] = _.target.value
      console.warn('[StickyConnectionsExtension] 24 fiOnChange storageData after update', storageData)
      chrome.storage.local.set({ [_.target.id]: _.target.value })
    }

    const formElements = Array.from(document.querySelectorAll('input'))
    formElements.forEach(_ => {
      console.warn('[StickyConnectionsExtension] 25 form element', _)
      _.addEventListener(
        'input',
        fiOnChange
      )
    })
  }
)
