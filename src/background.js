chrome.browserAction.onClicked.addListener((activeTab) => {
  chrome.tabs.query({ title: 'Tab Manager' }, (tabs) => {
    if (tabs.length) {
      chrome.tabs.update(tabs[0].id, { active: true })
    } else {
      chrome.tabs.create({ url: 'src/main.html', index: 0 })
    }
  })
})