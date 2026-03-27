// This file can be replaced during build by using the `fileReplacements` array.
// `ng build` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

import packageInfo from '../../package.json';

export const environment = {
  appVersion: packageInfo.version,
  production: false,
  apiUrl: 'http://localhost:8080',
  googleAuthEndpoint: '/security/oauth/login',
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

/*
 * For easier debugging in development mode, you can import the following file
 * to ignore zone related error stack frames such as `zone.run`, `zoneDelegate.invokeTask`.
 *
 * This import should be commented out in production mode because it will have a negative impact
 * on performance if an error is thrown.
 */
