import React, {useState} from 'react';
import {StyleSheet, View, Text, SafeAreaView, TouchableOpacity, ActivityIndicator} from 'react-native';
import {useRouter} from 'expo-router';
import {Ionicons} from '@expo/vector-icons';
import * as Burnt from 'burnt';
import {FeedList, AddFeedForm} from '../../components/feeds';
import {useTriggerImportAll} from '../../services';
import {colors} from '../../theme';

export default function FeedsScreen() {
  const router = useRouter();
  const [isFormVisible, setIsFormVisible] = useState(false);
  const importAllMutation = useTriggerImportAll();

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

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>RSS Feeds</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity
            onPress={handleRefreshAll}
            disabled={importAllMutation.isPending}
            style={styles.headerButton}
          >
            {importAllMutation.isPending ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <Ionicons name="refresh" size={22} color={colors.primary} />
            )}
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setIsFormVisible(true)} style={styles.addButton}>
            <Ionicons name="add" size={22} color={colors.background} />
          </TouchableOpacity>
        </View>
      </View>

      <FeedList />

      <AddFeedForm visible={isFormVisible} onClose={() => setIsFormVisible(false)} />
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
    alignItems: 'center',
    padding: 16,
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    padding: 4,
    marginRight: 12,
  },
  headerTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.foreground,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerButton: {
    padding: 8,
  },
  addButton: {
    backgroundColor: colors.linkAccent,
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
