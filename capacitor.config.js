/** @type {import('@capacitor/cli').CapacitorConfig} */
const config = {
    appId: 'com.littlenour.game',
    appName: 'Little Nour',
    webDir: 'www',
    server: {
        androidScheme: 'https'
    },
    android: {
        backgroundColor: '#0a0a1a',
        allowMixedContent: false,
        captureInput: true,
        webContentsDebuggingEnabled: true
    }
};

module.exports = config;
