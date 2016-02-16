/* global __DEVTOOLS__ */
import { createStore, applyMiddleware, compose } from 'redux';
import thunkMiddleware from 'redux-thunk';
import promiseMiddleware from 'redux-promise';
import createLogger from 'redux-logger';
import rootReducer from '../reducers';

const loggerMiddleware = createLogger({
  level: 'info',
  collapsed: true
});

let createStoreWithMiddleware;

if (typeof __DEVTOOLS__ !== 'undefined' && __DEVTOOLS__) {
  // small middleware to set window variable with result of state for debugging
  const setWindowState = store => next => action => {
    let result = next(action);
    if (!window.stateObject) window.stateObject = {};
    window.stateObject.formState = store.getState();
    return result;
  };

  const DevTools = require('../containers/app/DevTools').default;
  const { persistState } = require('redux-devtools');
  createStoreWithMiddleware = compose(
    applyMiddleware(thunkMiddleware, promiseMiddleware, loggerMiddleware, setWindowState),
    DevTools.instrument(),
    persistState(getDebugSessionKey())
  )(createStore);
} else {
  createStoreWithMiddleware = applyMiddleware(
    thunkMiddleware,
    promiseMiddleware
  )(createStore);
}

function getDebugSessionKey() {
  // You can write custom logic here!
  // By default we try to read the key from ?debug_session=<key> in the address bar
  const matches = window.location.href.match(/[?&]debug_session=([^&]+)\b/);
  return (matches && matches.length > 0)? matches[1] : null;
}

/**
 * Creates a preconfigured store.
 */
export default function configureStore(initialState) {
  const store = createStoreWithMiddleware(rootReducer, initialState);

  if (module.hot) {
    // Enable Webpack hot module replacement for reducers
    module.hot.accept('../reducers', () => {
      store.replaceReducer(require('../reducers/index'));
    });
  }

  return store;
}