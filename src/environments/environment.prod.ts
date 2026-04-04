import packageInfo from '../../package.json';

export const environment = {
  appVersion: packageInfo.version,
  production: true,
  apiUrl: 'http://localhost:8080',
  googleAuthEndpoint: '/security/oauth/login',
  recaptcha: {
    enabled: true,
    siteKey: '6LcSqqUsAAAAAFMKRcjte2kT0A9gUjBdsZg5DnEO',
    action: 'login'
  },
  firebase: {
    apiKey: 'AIzaSyCcU-cd8mHfAS7ioRh2rsQkt5yQRZOKpX0',
    authDomain: 'flashbusangular.firebaseapp.com',
    projectId: 'flashbusangular',
    storageBucket: 'flashbusangular.firebasestorage.app',
    messagingSenderId: '68134736545',
    appId: '1:68134736545:web:c84e52b800dc68cf1cd6e0',
    measurementId: 'G-Q4CG33P77W'
  }
};
