import React, {useState} from 'react';
import {FlatList, View, Text, StyleSheet, ActivityIndicator, RefreshControl} from 'react-native';
import {useLinks, useDeleteLink, type Link} from '../services';
import {LinkCard} from './LinkCard';
import {EditLinkForm} from './links';
import {colors} from '../theme';

function LoadingState() {
  return (
    <View style={styles.centerContainer}>
      <ActivityIndicator size='large' color={colors.linkAccent} />
      <Text style={styles.loadingText}>Loading links...</Text>
    </View>
  );
}

function ErrorState({isRefreshing, onRefresh, error}: {isRefreshing: boolean; onRefresh: () => void; error: string}) {
  return (
    <FlatList
      data={[]}
      renderItem={() => null}
      style={styles.list}
      contentContainerStyle={styles.centerContainer}
      refreshControl={
        <RefreshControl
          refreshing={isRefreshing}
          onRefresh={onRefresh}
          tintColor={colors.linkAccent}
          colors={[colors.linkAccent]}
          progressBackgroundColor={colors.card}
        />
      }
      ListEmptyComponent={
        <View>
          <Text style={styles.errorText}>Failed to load links</Text>
          <Text style={styles.errorSubtext}>{error}</Text>
          <Text style={styles.errorSubtext}>Pull down to retry.</Text>
        </View>
      }
    />
  );
}

function EmptyState({isRefreshing, onRefresh}: {isRefreshing: boolean; onRefresh: () => void}) {
  return (
    <FlatList
      data={[]}
      renderItem={() => null}
      style={styles.list}
      contentContainerStyle={styles.centerContainer}
      refreshControl={
        <RefreshControl
          refreshing={isRefreshing}
          onRefresh={onRefresh}
          tintColor={colors.linkAccent}
          colors={[colors.linkAccent]}
          progressBackgroundColor={colors.card}
        />
      }
      ListEmptyComponent={<Text style={styles.emptyText}>No links yet. Add your first link!</Text>}
    />
  );
}

interface LinksListProps {
  links: Link[];
  onDelete: (linkId: string) => void;
  onEdit: (link: Link) => void;
  isRefreshing: boolean;
  onRefresh: () => void;
}

function LinksList({links, onDelete, onEdit, isRefreshing, onRefresh}: LinksListProps) {
  return (
    <FlatList
      data={links}
      keyExtractor={(item) => item.id}
      renderItem={({item}) => (
        <LinkCard link={item} onDelete={() => onDelete(item.id)} onEdit={() => onEdit(item)} />
      )}
      style={styles.list}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={isRefreshing}
          onRefresh={onRefresh}
          tintColor={colors.linkAccent}
          colors={[colors.linkAccent]}
          progressBackgroundColor={colors.card}
        />
      }
    />
  );
}

export function LinkList() {
  const {data, isLoading, error, refetch, isFetching} = useLinks();
  const deleteLinkMutation = useDeleteLink();
  const [editingLink, setEditingLink] = useState<Link | null>(null);

  const handleDelete = (linkId: string) => {
    deleteLinkMutation.mutate(linkId);
  };

  const handleEdit = (link: Link) => {
    setEditingLink(link);
  };

  const handleCloseEdit = () => {
    setEditingLink(null);
  };

  const handleRefresh = () => {
    refetch();
  };

  if (isLoading) {
    return <LoadingState />;
  }

  if (error) {
    return (
      <ErrorState
        isRefreshing={isFetching}
        onRefresh={handleRefresh}
        error={error.message || 'Unknown error'}
      />
    );
  }

  const links = data?.links || [];

  if (links.length === 0) {
    return <EmptyState isRefreshing={isFetching} onRefresh={handleRefresh} />;
  }

  return (
    <>
      <LinksList
        links={links}
        onDelete={handleDelete}
        onEdit={handleEdit}
        isRefreshing={isFetching}
        onRefresh={handleRefresh}
      />
      <EditLinkForm visible={!!editingLink} link={editingLink} onClose={handleCloseEdit} />
    </>
  );
}

const styles = StyleSheet.create({
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: colors.background,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: colors.mutedForeground,
  },
  errorText: {
    fontSize: 16,
    color: colors.destructive,
    textAlign: 'center',
    fontWeight: 'bold',
  },
  errorSubtext: {
    fontSize: 14,
    color: colors.mutedForeground,
    textAlign: 'center',
    marginTop: 4,
  },
  emptyText: {
    fontSize: 16,
    color: colors.mutedForeground,
    textAlign: 'center',
  },
  list: {
    flex: 1,
    backgroundColor: colors.background,
  },
});