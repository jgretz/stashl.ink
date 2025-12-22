import Constants from 'expo-constants';
import {Platform} from 'react-native';
import {match} from 'ts-pattern';

export interface AppConfig {
  apiUrl: string;
  isDevelopment: boolean;
}

function getApiUrl(): string {
  const envApiUrl = Constants.expoConfig?.extra?.apiUrl;
  const isDev = __DEV__;
  const platform = Platform.OS;

  // First check if environment variable is set (highest priority)
  if (envApiUrl) {
    return envApiUrl;
  }

  return 'https://stashl-api.fly.dev/api';

  // Special logic for local development scenarios - REST API endpoints
  // return match({isDev, platform})
  //   .with({isDev: true, platform: 'android'}, () => 'http://10.0.2.2:3001/api')
  //   .with({isDev: true}, () => 'http://localhost:3001/api')
  //   .with({isDev: false}, () => 'https://stashl-api.fly.dev/api')
  //   .otherwise(() => {
  //     throw new Error(
  //       'API_URL must be configured via EXPO_PUBLIC_API_URL environment variable for production builds',
  //     );
  //   });
}

export const config: AppConfig = {
  apiUrl: getApiUrl(),
  isDevelopment: __DEV__,
};
