import React from 'react'
import ReactDOM from 'react-dom'
import createBrowserHistory from 'history/lib/createBrowserHistory'
import { Router, useRouterHistory } from 'react-router'
import { syncHistoryWithStore } from 'react-router-redux'
import { Provider } from 'react-redux'

import routes from 'components/adminPage/Routes'
import { buildStore } from 'utils/store'
import * as settings from 'utils/settings'

// load plugins
import 'components/adminPage/MonitoringServices'

// ========================================================
// Browser History Setup
// ========================================================
const browserHistory = useRouterHistory(createBrowserHistory)({
  basename: __BASENAME__
})

// ========================================================
// Store and History Instantiation
// ========================================================
// Create redux store and sync with react-router-redux. We have installed the
// react-router-redux reducer under the routerKey "router" in src/routes/index.js,
// so we need to provide a custom `selectLocationState` to inform
// react-router-redux of its location.
const initialState = window.___INITIAL_STATE__
const store = buildStore(initialState, browserHistory)
const history = syncHistoryWithStore(browserHistory, store, {
  selectLocationState: (state) => state.router
})

// ========================================================
// Developer Tools Setup
// ========================================================
if (__DEBUG__) {
  if (window.devToolsExtension) {
    window.devToolsExtension.open()
  }
}

// ========================================================
// Render Setup
// ========================================================
const MOUNT_NODE = document.getElementById('root')

let render = (routes) => {
  ReactDOM.render(
    <Provider store={store}>
      <div style={{ height: '100%' }}>
        <Router history={history} children={routes} />
      </div>
    </Provider>,
    MOUNT_NODE
  )
}

// This code is excluded from production bundle
if (__DEV__) {
  if (module.hot) {
    // Development render functions
    const renderApp = render
    const renderError = (error) => {
      const RedBox = require('redbox-react').default

      ReactDOM.render(<RedBox error={error} />, MOUNT_NODE)
    }

    // Wrap render in try/catch
    render = (routes) => {
      try {
        renderApp(routes)
      } catch (error) {
        renderError(error)
      }
    }

    // Setup hot module replacement
    module.hot.accept('./components/adminPage/Routes', () => {
      setTimeout(() => {
        ReactDOM.unmountComponentAtNode(MOUNT_NODE)
        const newRoutes = require('./components/adminPage/Routes').default
        render(newRoutes)
      })
    })
  }
}

// ========================================================
// Wait until settings are loaded, then start rendering.
// ========================================================

fetch('/settings.json').then(resp => {
  return resp.json()
}).then(json => {
  settings.apiURL = json.InvocationURL
  settings.userPoolId = json.UserPoolID
  settings.clientId = json.ClientID

  render(routes)
}).catch(err => {
  console.error('failed to load settings:', err)
})
