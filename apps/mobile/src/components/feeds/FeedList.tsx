import React from 'react';
import {FlatList, View, Text, StyleSheet, ActivityIndicator, RefreshControl} from 'react-native';
import {useFeeds, useDeleteFeed} from '../../services';
import {FeedCard} from './FeedCard';
import {colors} from '../../theme';

export function FeedList() {
  const {data, isLoading, error, refetch, isRefetching} = useFeeds();
  const deleteMutation = useDeleteFeed();

  const handleDelete = (feedId: string) => {
    deleteMutation.mutate(feedId);
  };

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={colors.linkAccent} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>Failed to load feeds</Text>
      </View>
    );
  }

  const feeds = data?.feeds || [];

  if (feeds.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.emptyText}>No feeds yet</Text>
        <Text style={styles.emptySubtext}>Add an RSS feed to get started</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={feeds}
      keyExtractor={(item) => item.id}
      renderItem={({item}) => <FeedCard feed={item} onDelete={() => handleDelete(item.id)} />}
      contentContainerStyle={styles.listContainer}
      refreshControl={
        <RefreshControl
          refreshing={isRefetching}
          onRefresh={refetch}
          tintColor={colors.linkAccent}
        />
      }
    />
  );
}

const styles = StyleSheet.create({
  listContainer: {
    padding: 16,
    paddingBottom: 100,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.foreground,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: colors.mutedForeground,
  },
  errorText: {
    fontSize: 16,
    color: colors.destructive,
  },
});
