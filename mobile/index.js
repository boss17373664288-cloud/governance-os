import { AppRegistry } from 'react-native';
import App from './App';
import { name as appName } from './app.json';

// Polyfill ErrorUtils for Hermes compatibility
if (!global.ErrorUtils) {
  global.ErrorUtils = {
    setGlobalHandler: function() {},
    getGlobalHandler: function() { return function() {}; },
    reportError: function(error) { console.error('ErrorUtils:', error); },
    reportFatalError: function(error) { console.error('Fatal:', error); },
    applyWithGuard: function(fn, context, args, name, errorHandler) {
      try {
        return fn.apply(context, args);
      } catch (e) {
        if (errorHandler) errorHandler(e);
        else console.error('Error in ' + name, e);
      }
    },
  };
}

AppRegistry.registerComponent(appName, () => App);