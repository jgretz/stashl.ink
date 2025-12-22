import React from 'react';
import {View, Text, TouchableOpacity, StyleSheet, Linking, Image} from 'react-native';
import {Ionicons} from '@expo/vector-icons';
import * as Burnt from 'burnt';
import type {RssFeedItem} from '../../services';
import {useMarkItemRead, useCreateLink} from '../../services';
import {colors} from '../../theme';

interface ReaderItemProps {
  item: RssFeedItem;
}

export function ReaderItem({item}: ReaderItemProps) {
  const markReadMutation = useMarkItemRead();
  const createLinkMutation = useCreateLink();

  const formatDate = (date: string | null) => {
    if (!date) return 'Unknown date';
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handlePress = async () => {
    markReadMutation.mutate(item.id);
    try {
      await Linking.openURL(item.link);
    } catch {
      Burnt.toast({title: 'Failed to open link', preset: 'error'});
    }
  };

  const handleMarkRead = () => {
    markReadMutation.mutate(item.id);
  };

  const handleSaveLink = () => {
    createLinkMutation.mutate(
      {url: item.link},
      {
        onSuccess: () => {
          Burnt.toast({title: 'Saved to links', preset: 'done'});
          markReadMutation.mutate(item.id);
        },
        onError: () => {
          Burnt.toast({title: 'Failed to save link', preset: 'error'});
        },
      },
    );
  };

  return (
    <TouchableOpacity style={styles.container} onPress={handlePress} activeOpacity={0.7}>
      <View style={styles.content}>
        <View style={styles.imageContainer}>
          {item.imageUrl && (
            <Image source={{uri: item.imageUrl}} style={styles.image} resizeMode="cover" />
          )}
        </View>
        <View style={styles.textContent}>
          <Text style={styles.feedTitle}>{item.feedTitle}</Text>
          <Text style={styles.title} numberOfLines={3}>
            {item.title}
          </Text>
          {item.summary && (
            <Text style={styles.summary} numberOfLines={3}>
              {item.summary}
            </Text>
          )}
          <Text style={styles.date}>{formatDate(item.pubDate)}</Text>
        </View>
      </View>
      <View style={styles.actions}>
        <TouchableOpacity
          onPress={handleSaveLink}
          disabled={createLinkMutation.isPending}
          style={styles.actionButton}
        >
          <Ionicons
            name={createLinkMutation.isPending ? 'hourglass' : 'bookmark-outline'}
            size={26}
            color={colors.linkAccent}
          />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={handleMarkRead}
          disabled={markReadMutation.isPending}
          style={styles.actionButton}
        >
          <Ionicons
            name={markReadMutation.isPending ? 'hourglass' : 'checkmark-circle-outline'}
            size={26}
            color={colors.primary}
          />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.card,
    borderRadius: 10,
    marginVertical: 6,
    shadowColor: colors.shadowColor,
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 2,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    flexDirection: 'row',
  },
  content: {
    flex: 1,
    flexDirection: 'row',
  },
  imageContainer: {
    width: 90,
    height: 90,
    backgroundColor: colors.background,
    alignSelf: 'center',
  },
  image: {
    width: 90,
    height: 90,
  },
  textContent: {
    flex: 1,
    padding: 12,
  },
  feedTitle: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.primary,
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.foreground,
    marginBottom: 6,
    lineHeight: 20,
  },
  summary: {
    fontSize: 13,
    color: colors.mutedForeground,
    lineHeight: 18,
    marginBottom: 6,
  },
  date: {
    fontSize: 11,
    color: colors.mutedForeground,
  },
  actions: {
    flexDirection: 'column',
    justifyContent: 'space-around',
    paddingHorizontal: 8,
  },
  actionButton: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
});
