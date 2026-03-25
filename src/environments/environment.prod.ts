import packageInfo from '../../package.json';

export const environment = {
  appVersion: packageInfo.version,
  production: true,
  apiUrl: 'http://localhost:8080',
  googleAuthEndpoint: '/security/oauth/login',
  firebase: {
    apiKey: 'AIzaSyDpapnsuvlqMamMMbmAtQiN4IL8RIwVImQ',
    authDomain: 'flashbuslogin.firebaseapp.com',
    projectId: 'flashbuslogin',
    storageBucket: 'flashbuslogin.firebasestorage.app',
    messagingSenderId: '559714126358',
    appId: '1:559714126358:web:1f55ba8cf08e62160a0337',
    measurementId: 'G-T9SQVEH7N6'
  }
};
