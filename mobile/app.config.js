const fs = require('fs');
const path = require('path');

const LOCAL_GOOGLE_SERVICES_FILE = './google-services.json';
const localGoogleServicesPath = path.join(__dirname, 'google-services.json');
const injectedGoogleServicesPath = process.env.GOOGLE_SERVICES_JSON;

if (injectedGoogleServicesPath && fs.existsSync(injectedGoogleServicesPath)) {
  fs.copyFileSync(injectedGoogleServicesPath, localGoogleServicesPath);
}

/** @type {import('@expo/config').ExpoConfig} */
module.exports = ({ config }) => ({
  ...config,
  android: {
    ...config.android,
    googleServicesFile:
      injectedGoogleServicesPath && fs.existsSync(injectedGoogleServicesPath)
        ? injectedGoogleServicesPath
        : LOCAL_GOOGLE_SERVICES_FILE,
  },
});
