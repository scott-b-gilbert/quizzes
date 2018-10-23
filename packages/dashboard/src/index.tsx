import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { Provider } from 'react-redux'
import App from './App';
import { store } from './store/store'

const render = () => {
  ReactDOM.render(
      <Provider store={store}>
          <App />
      </Provider>,
      document.getElementById('root')
  )
}

render()
store.subscribe(render)
