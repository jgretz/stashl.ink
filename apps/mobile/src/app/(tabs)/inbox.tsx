import React from 'react';
import {StyleSheet, View, Text, SafeAreaView, TouchableOpacity, ActivityIndicator, Alert} from 'react-native';
import {Ionicons} from '@expo/vector-icons';
import * as Burnt from 'burnt';
import {InboxView} from '../../components/inbox';
import {useTriggerEmailRefresh, useMarkAllEmailItemsRead, useEmailSettings} from '../../services';
import {colors} from '../../theme';

export default function InboxTab() {
  const {data: settings} = useEmailSettings();
  const refreshMutation = useTriggerEmailRefresh();
  const markAllReadMutation = useMarkAllEmailItemsRead();

  const handleRefresh = () => {
    refreshMutation.mutate(undefined, {
      onSuccess: () => {
        Burnt.toast({title: 'Checking for new emails', preset: 'done'});
      },
      onError: () => {
        Burnt.toast({title: 'Failed to refresh', preset: 'error'});
      },
    });
  };

  const handleMarkAllRead = () => {
    Alert.alert('Mark All Read', 'Mark all items as read?', [
      {text: 'Cancel', style: 'cancel'},
      {
        text: 'Mark All Read',
        onPress: () => {
          markAllReadMutation.mutate(undefined, {
            onSuccess: (data) => {
              Burnt.toast({title: `Marked ${data.count} items as read`, preset: 'done'});
            },
            onError: () => {
              Burnt.toast({title: 'Failed to mark all as read', preset: 'error'});
            },
          });
        },
      },
    ]);
  };

  const isConnected = settings?.isConnected;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Inbox</Text>
        {isConnected && (
          <View style={styles.headerActions}>
            <TouchableOpacity
              onPress={handleMarkAllRead}
              disabled={markAllReadMutation.isPending}
              style={styles.headerButton}
            >
              {markAllReadMutation.isPending ? (
                <ActivityIndicator size="small" color={colors.primary} />
              ) : (
                <Ionicons name="checkmark-done" size={22} color={colors.primary} />
              )}
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleRefresh}
              disabled={refreshMutation.isPending}
              style={styles.headerButton}
            >
              {refreshMutation.isPending ? (
                <ActivityIndicator size="small" color={colors.linkAccent} />
              ) : (
                <Ionicons name="refresh" size={22} color={colors.linkAccent} />
              )}
            </TouchableOpacity>
          </View>
        )}
      </View>
      {isConnected ? (
        <InboxView />
      ) : (
        <View style={styles.notConnected}>
          <Ionicons name="mail-outline" size={64} color={colors.muted} />
          <Text style={styles.notConnectedText}>Gmail not connected</Text>
          <Text style={styles.notConnectedSubtext}>
            Connect your Gmail account in Settings to see email items here
          </Text>
        </View>
      )}
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
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerButton: {
    padding: 6,
  },
  notConnected: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    gap: 12,
  },
  notConnectedText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.foreground,
  },
  notConnectedSubtext: {
    fontSize: 14,
    color: colors.mutedForeground,
    textAlign: 'center',
    lineHeight: 20,
  },
});
