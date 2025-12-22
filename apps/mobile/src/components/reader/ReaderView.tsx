import React, {useCallback} from 'react';
import {FlatList, View, Text, StyleSheet, ActivityIndicator, RefreshControl} from 'react-native';
import {useUnreadItems} from '../../services';
import {ReaderItem} from './ReaderItem';
import {colors} from '../../theme';

export function ReaderView() {
  const {data, isLoading, error, refetch, isRefetching, fetchNextPage, hasNextPage, isFetchingNextPage} =
    useUnreadItems(30);

  const handleEndReached = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

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
        <Text style={styles.errorText}>Failed to load items</Text>
      </View>
    );
  }

  const items = data?.pages.flatMap((page) => page.items) || [];

  if (items.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.emptyText}>All caught up!</Text>
        <Text style={styles.emptySubtext}>No unread items</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={items}
      keyExtractor={(item) => item.id}
      renderItem={({item}) => <ReaderItem item={item} />}
      contentContainerStyle={styles.listContainer}
      refreshControl={
        <RefreshControl
          refreshing={isRefetching}
          onRefresh={refetch}
          tintColor={colors.linkAccent}
        />
      }
      onEndReached={handleEndReached}
      onEndReachedThreshold={0.5}
      ListFooterComponent={
        isFetchingNextPage ? (
          <View style={styles.footerLoader}>
            <ActivityIndicator size="small" color={colors.linkAccent} />
          </View>
        ) : null
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
  footerLoader: {
    padding: 20,
    alignItems: 'center',
  },
});
