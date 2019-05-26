const TAB_MGR_ICON = 'images/logo/logo_128x128.png'
const NO_TAB_ICON = 'images/default.png'
const WINDOW_ICON = 'images/win.png'

const newNode = (tag, ...args) => {
    const elem = document.createElement(tag)
    const argIterator = arg => {
        if (Array.isArray(arg)) {
            arg.forEach(argIterator)
        } else if (typeof arg === 'object') {
            if (arg instanceof Node) elem.appendChild(arg)
            else Object.entries(arg).forEach(([ k, v ]) => k.startsWith('on')
                ? elem.addEventListener(k.substring(2), v)
                : elem.setAttribute(k, v)
            )
        } else elem.appendChild(document.createTextNode(
            typeof arg === 'string' ? arg : JSON.stringify(arg)
        ))
    }
    args.forEach(argIterator)
    return elem
}

const activateTab = (windowId, id) => {
    chrome.windows.update(windowId, { focused: true })
    chrome.tabs.update(id, { active: true })
}

const queryTabs = (query = {}) => new Promise(resolve => chrome.tabs.query(query, resolve))

const getTabManagerTab = () => queryTabs({ title: 'Tab Manager' }).then(([ tabMgr ]) => tabMgr)

const selectTab = async (windowId, index) => {
    const tabMgr = await getTabManagerTab()
    if (windowId === tabMgr.windowId)
    chrome.tabs.highlight({ windowId, tabs: [ tabMgr.index, index ] })
}

const wrapperDiv = document.getElementById('wrapper')
let drawing = false
const redraw = () => {
    if (drawing) return
    drawing = true
    queryTabs().then(async tabs => {
        while (wrapperDiv.firstChild && !wrapperDiv.firstChild.remove());
        let windowId = null, windowTabsDiv = null
        const { id: tabMgrId } = await getTabManagerTab()
        tabs.forEach(tab => {
            if (windowId !== tab.windowId) {
                windowId = tab.windowId
                wrapperDiv.appendChild(
                    newNode('div', { class: 'window' },
                        newNode('div', { class: 'title' },
                            newNode('img', { src: WINDOW_ICON }),
                            newNode('h2', `Window ID ${windowId}`)
                        ),
                        (windowTabsDiv = newNode('div', { class: 'tabs' }))
                ))
            }
            windowTabsDiv.appendChild(
                newNode('div', {
                    onclick: function () {
                        this.className = 'active'
                        setTimeout(() => activateTab(tab.windowId, tab.id), 50)
                    },
                    onmouseover: () => selectTab(tab.windowId, tab.index),
                    onmouseout: function () { this.className = '' }
                }, [
                    newNode('span', { class: 'index' }, `${tab.index + 1}`),
                    newNode('img', {
                        src: tabMgrId === tab.id ? TAB_MGR_ICON : (tab.favIconUrl || NO_TAB_ICON),
                        class: 'loading',
                        onload: function () { this.className = this.naturalWidth < 32 ? 'pixelated' : '' }
                    }),
                    newNode('span', tab.title),
                    // E('pre', JSON.stringify(tab).split(',').join(',\n'))
                ]))
        })
        drawing = false
    })
}

;((t = chrome.tabs) =>
    [t.onMoved, t.onDetached, t.onAttached, t.onRemoved].forEach(ev => ev.addListener(redraw))
)()

document.body.onload = () => setTimeout(() => redraw(), 100)
