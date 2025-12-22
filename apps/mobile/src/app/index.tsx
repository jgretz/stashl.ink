import React from 'react';
import {StyleSheet, View, ActivityIndicator, Text, SafeAreaView} from 'react-native';
import {LoginScreen} from '../components/LoginScreen';
import {colors} from '../theme';
import {useAuth} from '../contexts/AuthContext';

export default function AuthScreen() {
  const {isLoading} = useAuth();

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.linkAccent} />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return <LoginScreen />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: colors.muted,
  },
});
