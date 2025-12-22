import React, {useState} from 'react';
import {
  StyleSheet,
  View,
  Text,
  SafeAreaView,
  TouchableOpacity,
  Linking,
  Alert,
  TextInput,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import {useRouter} from 'expo-router';
import {Ionicons} from '@expo/vector-icons';
import * as Burnt from 'burnt';
import {colors} from '../../theme';
import {useAuth} from '../../contexts/AuthContext';
import {
  useEmailSettings,
  useUpdateEmailSettings,
  useDisconnectEmail,
  emailApi,
} from '../../services';

export default function SettingsTab() {
  const router = useRouter();
  const {user, logout} = useAuth();
  const {data: emailSettings, isLoading: emailLoading} = useEmailSettings();
  const updateSettingsMutation = useUpdateEmailSettings();
  const disconnectMutation = useDisconnectEmail();
  const [emailFilter, setEmailFilter] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handleConnectGmail = async () => {
    setIsConnecting(true);
    try {
      const {authUrl} = await emailApi.getOAuthUrl();
      await Linking.openURL(authUrl);
    } catch (error) {
      Burnt.toast({title: 'Failed to start Gmail connection', preset: 'error'});
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnectGmail = () => {
    Alert.alert('Disconnect Gmail', 'Are you sure you want to disconnect your Gmail account?', [
      {text: 'Cancel', style: 'cancel'},
      {
        text: 'Disconnect',
        style: 'destructive',
        onPress: () => {
          disconnectMutation.mutate(undefined, {
            onSuccess: () => Burnt.toast({title: 'Gmail disconnected', preset: 'done'}),
            onError: () => Burnt.toast({title: 'Failed to disconnect', preset: 'error'}),
          });
        },
      },
    ]);
  };

  const handleSaveFilter = () => {
    updateSettingsMutation.mutate(
      {emailFilter: emailFilter.trim()},
      {
        onSuccess: () => Burnt.toast({title: 'Email filter saved', preset: 'done'}),
        onError: () => Burnt.toast({title: 'Failed to save filter', preset: 'error'}),
      },
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Settings</Text>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          <View style={styles.card}>
            <View style={styles.userInfo}>
              <Ionicons name="person-circle" size={48} color={colors.primary} />
              <View style={styles.userDetails}>
                <Text style={styles.userName}>{user?.name}</Text>
                <Text style={styles.userEmail}>{user?.email}</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Email Integration</Text>
          <View style={styles.card}>
            {emailLoading ? (
              <ActivityIndicator color={colors.primary} />
            ) : emailSettings?.isConnected ? (
              <View style={styles.emailConnected}>
                <View style={styles.connectedStatus}>
                  <Ionicons name="checkmark-circle" size={24} color={colors.success} />
                  <Text style={styles.connectedText}>Gmail Connected</Text>
                </View>
                <View style={styles.filterSection}>
                  <Text style={styles.filterLabel}>Email Filter (sender contains)</Text>
                  <TextInput
                    style={styles.filterInput}
                    placeholder="e.g., newsletter"
                    placeholderTextColor={colors.mutedForeground}
                    value={emailFilter || emailSettings.emailFilter || ''}
                    onChangeText={setEmailFilter}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                  <TouchableOpacity
                    style={styles.saveButton}
                    onPress={handleSaveFilter}
                    disabled={updateSettingsMutation.isPending}
                  >
                    {updateSettingsMutation.isPending ? (
                      <ActivityIndicator size="small" color={colors.background} />
                    ) : (
                      <Text style={styles.saveButtonText}>Save Filter</Text>
                    )}
                  </TouchableOpacity>
                </View>
                <TouchableOpacity
                  style={styles.disconnectButton}
                  onPress={handleDisconnectGmail}
                  disabled={disconnectMutation.isPending}
                >
                  <Text style={styles.disconnectButtonText}>Disconnect Gmail</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.emailDisconnected}>
                <Ionicons name="mail-outline" size={32} color={colors.muted} />
                <Text style={styles.disconnectedText}>Connect Gmail to import links from emails</Text>
                <TouchableOpacity
                  style={styles.connectButton}
                  onPress={handleConnectGmail}
                  disabled={isConnecting}
                >
                  {isConnecting ? (
                    <ActivityIndicator size="small" color={colors.background} />
                  ) : (
                    <>
                      <Ionicons name="logo-google" size={18} color={colors.background} />
                      <Text style={styles.connectButtonText}>Connect Gmail</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>RSS Feeds</Text>
          <TouchableOpacity style={styles.card} onPress={() => router.push('/feeds')}>
            <View style={styles.menuItem}>
              <View style={styles.menuItemLeft}>
                <Ionicons name="newspaper-outline" size={24} color={colors.primary} />
                <Text style={styles.menuItemText}>Manage Feeds</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.mutedForeground} />
            </View>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={20} color={colors.background} />
          <Text style={styles.logoutButtonText}>Logout</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: colors.foreground,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 40,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.mutedForeground,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.foreground,
  },
  userEmail: {
    fontSize: 14,
    color: colors.mutedForeground,
    marginTop: 2,
  },
  emailConnected: {
    gap: 16,
  },
  connectedStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  connectedText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.foreground,
  },
  filterSection: {
    gap: 8,
  },
  filterLabel: {
    fontSize: 13,
    color: colors.mutedForeground,
  },
  filterInput: {
    backgroundColor: colors.background,
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: colors.foreground,
    borderWidth: 1,
    borderColor: colors.border,
  },
  saveButton: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    padding: 10,
    alignItems: 'center',
  },
  saveButtonText: {
    color: colors.background,
    fontSize: 14,
    fontWeight: '600',
  },
  disconnectButton: {
    borderWidth: 1,
    borderColor: colors.destructive,
    borderRadius: 8,
    padding: 10,
    alignItems: 'center',
  },
  disconnectButtonText: {
    color: colors.destructive,
    fontSize: 14,
    fontWeight: '500',
  },
  emailDisconnected: {
    alignItems: 'center',
    gap: 12,
    paddingVertical: 8,
  },
  disconnectedText: {
    fontSize: 14,
    color: colors.mutedForeground,
    textAlign: 'center',
  },
  connectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.linkAccent,
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  connectButtonText: {
    color: colors.background,
    fontSize: 14,
    fontWeight: '600',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  menuItemText: {
    fontSize: 16,
    color: colors.foreground,
    fontWeight: '500',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.destructive,
    paddingVertical: 14,
    borderRadius: 10,
    marginTop: 20,
  },
  logoutButtonText: {
    color: colors.background,
    fontSize: 16,
    fontWeight: '600',
  },
});
