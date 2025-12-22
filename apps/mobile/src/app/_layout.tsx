import {QueryClient, QueryClientProvider} from '@tanstack/react-query';
import {Slot} from 'expo-router';
import {StatusBar} from 'expo-status-bar';
import {View, ActivityIndicator} from 'react-native';
import {AuthProvider, useAuth} from '../contexts/AuthContext';
import {LoginScreen} from '../components';
import {colors} from '../theme';

const queryClient = new QueryClient();

function AuthGate() {
  const {isAuthenticated, isLoading} = useAuth();

  if (isLoading) {
    return (
      <View style={{flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background}}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  // Not authenticated → render login directly (not a route)
  if (!isAuthenticated) {
    return <LoginScreen />;
  }

  // Authenticated → render routes via Slot
  return <Slot />;
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClient}>
        <AuthGate />
        <StatusBar style="dark" />
      </QueryClientProvider>
    </AuthProvider>
  );
}
