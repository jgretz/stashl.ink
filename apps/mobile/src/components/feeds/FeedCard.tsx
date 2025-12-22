import React from 'react';
import {View, Text, TouchableOpacity, StyleSheet, Alert} from 'react-native';
import {Ionicons} from '@expo/vector-icons';
import type {RssFeed} from '../../services';
import {colors} from '../../theme';

interface FeedCardProps {
  feed: RssFeed;
  onDelete: () => void;
}

export function FeedCard({feed, onDelete}: FeedCardProps) {
  const handleDelete = () => {
    Alert.alert('Delete Feed', `Are you sure you want to delete "${feed.title}"?`, [
      {text: 'Cancel', style: 'cancel'},
      {text: 'Delete', style: 'destructive', onPress: onDelete},
    ]);
  };

  const formatDate = (date: string | null) => {
    if (!date) return 'Never';
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.iconContainer}>
        <Ionicons name="newspaper" size={24} color={colors.primary} />
      </View>
      <View style={styles.content}>
        <Text style={styles.title} numberOfLines={1}>
          {feed.title}
        </Text>
        <Text style={styles.url} numberOfLines={1}>
          {feed.feedUrl}
        </Text>
        <Text style={styles.date}>Last import: {formatDate(feed.lastSuccessfulImport)}</Text>
      </View>
      <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
        <Ionicons name="trash-outline" size={20} color={colors.destructive} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.card,
    borderRadius: 10,
    padding: 14,
    marginVertical: 6,
    shadowColor: colors.shadowColor,
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 2,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.foreground,
    marginBottom: 4,
  },
  url: {
    fontSize: 12,
    color: colors.linkAccent,
    marginBottom: 4,
  },
  date: {
    fontSize: 11,
    color: colors.mutedForeground,
  },
  deleteButton: {
    padding: 8,
    marginLeft: 8,
  },
});
