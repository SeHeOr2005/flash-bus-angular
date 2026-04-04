import packageInfo from '../../package.json';

export const environment = {
  appVersion: packageInfo.version,
  production: true,
  apiUrl: 'https://api.yourdomain.com',
  googleAuthEndpoint: '/security/oauth/login',
  recaptcha: {
    enabled: true,
    siteKey: 'YOUR_RECAPTCHA_SITE_KEY_HERE',
    action: 'login'
  },
  firebase: {
    apiKey: 'YOUR_FIREBASE_API_KEY_HERE',
    authDomain: 'your-project.firebaseapp.com',
    projectId: 'your-project-id',
    storageBucket: 'your-project.firebasestorage.app',
    messagingSenderId: 'YOUR_MESSAGING_SENDER_ID_HERE',
    appId: 'YOUR_APP_ID_HERE',
    measurementId: 'YOUR_MEASUREMENT_ID_HERE'
  }
};
