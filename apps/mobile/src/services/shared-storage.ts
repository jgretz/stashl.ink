import * as SecureStore from 'expo-secure-store';

const SHARED_AUTH_TOKEN_KEY = 'stashl_shared_auth_token';
const APP_GROUP = 'group.com.stashl.links';

const sharedOptions: SecureStore.SecureStoreOptions = {
  accessGroup: APP_GROUP,
};

export async function setSharedAuthToken(token: string): Promise<void> {
  await SecureStore.setItemAsync(SHARED_AUTH_TOKEN_KEY, token, sharedOptions);
}

export async function getSharedAuthToken(): Promise<string | null> {
  return SecureStore.getItemAsync(SHARED_AUTH_TOKEN_KEY, sharedOptions);
}

export async function clearSharedAuthToken(): Promise<void> {
  await SecureStore.deleteItemAsync(SHARED_AUTH_TOKEN_KEY, sharedOptions);
}
