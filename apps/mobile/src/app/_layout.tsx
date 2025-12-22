import {QueryClient, QueryClientProvider} from '@tanstack/react-query';
import {Slot, useRouter, useSegments} from 'expo-router';
import {StatusBar} from 'expo-status-bar';
import {useEffect} from 'react';
import {AuthProvider, useAuth} from '../contexts/AuthContext';

const queryClient = new QueryClient();

function AuthRouter() {
  const {isAuthenticated, isLoading} = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === '(tabs)';
    const inProtectedRoute = inAuthGroup || segments[0] === 'feeds';
    const onLoginScreen = segments.length === 0 || segments[0] === undefined;

    if (!isAuthenticated && inProtectedRoute) {
      router.replace('/');
    } else if (isAuthenticated && onLoginScreen) {
      router.replace('/(tabs)');
    }
  }, [isAuthenticated, isLoading, segments]);

  return <Slot />;
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClient}>
        <AuthRouter />
        <StatusBar style='dark' />
      </QueryClientProvider>
    </AuthProvider>
  );
}
