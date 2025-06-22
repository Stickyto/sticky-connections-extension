window.addEventListener(
  'load',
  () => {
    console.warn('xxx 2 load')

    function sendMessageAsync (message) {
      return new Promise((resolve, reject) => {
        chrome.runtime.sendMessage(message, response => {
          console.warn('xxx DEBUG', JSON.stringify(response))
          if (chrome.runtime.lastError) {
            return reject(new Error(chrome.runtime.lastError.message));
          }
          response.ok && resolve(response.message)
          !response.ok && reject(response.message)
        });
      });
    }

    const testConnectionButton = document.querySelector('button')
    console.warn('XXX BUTTON IS', testConnectionButton)
    testConnectionButton.addEventListener(
      'click',
      () => {
        console.warn('xxx ON CLICK!')

        sendMessageAsync({ type: 'test-connection', ...storageData })
          .then(message => {
            console.warn('xxx RETURNED 1', message)
            document.querySelector('.banner p').innerHTML = message
            document.querySelector('.banner').style.display = 'block'
          })
          .catch(message => {
            console.warn('xxx RETURNED 2', message)
            document.querySelector('.banner p').innerHTML = message
            document.querySelector('.banner').style.display = 'block'
          })
      }
    )

    let storageData = {}
    chrome.storage.local.get(
      ['cPrivateKey', 'cFederatedUserPrivateKey'],
      data => {
        console.warn('xxx data from chrome storage', data)
        storageData = {
          ...storageData,
          ...data
        }
        Object.keys(data).forEach(_ => {
          console.warn('xxx data _ inside for loop', _)
          document.getElementById(_).value = data[_]
        })
        console.warn('xxx storageData after ... munging', storageData)
      }
    )

    function fiOnChange(_) {
      console.warn('xxx fiOnChange', _)
      storageData[_.target.id] = _.target.value
      console.warn('xxx fiOnChange storageData after update', storageData)
      chrome.storage.local.set({ [_.target.id]: _.target.value })
    }

    const formElements = Array.from(document.querySelectorAll('input'))
    formElements.forEach(_ => {
      console.warn('xxx form element', _)
      _.addEventListener(
        'input',
        fiOnChange
      )
    })
  }
)

// document.getElementById('send').addEventListener('click', () => {
//   const ip = document.getElementById('ip').value.trim()
//   const tid = document.getElementById('tid').value.trim()
//   const token = document.getElementById('token').value.trim()
//   const amount = parseInt(document.getElementById('amount').value.trim(), 10)
//   const reference = document.getElementById('reference').value.trim() || 'WEB'

//   if (!ip || !tid || !token || !amount) {
//     alert('Please fill all fields')
//     return
//   }

//   chrome.runtime.sendMessage({ type: 'start-sale', ip, tid, token, amount, reference }, (response) => {
//     const out = document.getElementById('output')
//     if (chrome.runtime.lastError) {
//       out.textContent = 'Runtime error: ' + chrome.runtime.lastError.message
//       return
//     }
//     out.textContent = JSON.stringify(response, null, 2)
//   })
// })
