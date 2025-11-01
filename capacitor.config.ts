import { CapacitorConfig } from '@capacitor/core';

const config: CapacitorConfig = {
  appId: 'app.lovable.349dd91bef49433ca84d4502db0c1cfc',
  appName: 'University Assist',
  webDir: 'dist',
  bundledWebRuntime: false,
  server: {
    url: 'https://349dd91b-ef49-433c-a84d-4502db0c1cfc.lovableproject.com?forceHideBadge=true',
    cleartext: true
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#2E57F6',
      showSpinner: false
    }
  }
};

export default config;
