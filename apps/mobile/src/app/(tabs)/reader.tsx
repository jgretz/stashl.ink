import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  SafeAreaView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import {Ionicons} from '@expo/vector-icons';
import * as Burnt from 'burnt';
import {ReaderView} from '../../components/reader';
import {useTriggerImportAll, useMarkAllRead, useUnreadItems} from '../../services';
import {colors} from '../../theme';

export default function ReaderTab() {
  const importAllMutation = useTriggerImportAll();
  const markAllReadMutation = useMarkAllRead();
  const {data, hasNextPage} = useUnreadItems(30);

  const items = data?.pages.flatMap((page) => page.items) || [];
  const itemCount = items.length;
  const countDisplay = hasNextPage ? `${itemCount}+` : `${itemCount}`;

  const handleRefreshAll = () => {
    importAllMutation.mutate(undefined, {
      onSuccess: (data) => {
        Burnt.toast({title: `Importing ${data.count} feed(s)`, preset: 'done'});
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

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>RSS Reader {itemCount > 0 ? `(${countDisplay})` : '✨'}</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity
            onPress={handleMarkAllRead}
            disabled={markAllReadMutation.isPending}
            style={styles.headerButton}
          >
            {markAllReadMutation.isPending ? (
              <ActivityIndicator size='small' color={colors.primary} />
            ) : (
              <Ionicons name='checkmark-done' size={22} color={colors.primary} />
            )}
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleRefreshAll}
            disabled={importAllMutation.isPending}
            style={styles.headerButton}
          >
            {importAllMutation.isPending ? (
              <ActivityIndicator size='small' color={colors.linkAccent} />
            ) : (
              <Ionicons name='refresh' size={22} color={colors.linkAccent} />
            )}
          </TouchableOpacity>
        </View>
      </View>
      <ReaderView />
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
});
