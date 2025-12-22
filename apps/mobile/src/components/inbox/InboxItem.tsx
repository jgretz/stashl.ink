import React from 'react';
import {View, Text, TouchableOpacity, StyleSheet, Linking} from 'react-native';
import {Ionicons} from '@expo/vector-icons';
import * as Burnt from 'burnt';
import type {EmailItem} from '../../services';
import {useMarkEmailItemRead, useCreateLink} from '../../services';
import {colors} from '../../theme';

interface InboxItemProps {
  item: EmailItem;
}

function extractDomain(url: string): string {
  try {
    const domain = new URL(url).hostname;
    return domain.replace(/^www\./, '');
  } catch {
    return url;
  }
}

function extractSenderName(emailFrom: string): string {
  const match = emailFrom.match(/^([^<(]+)/);
  if (match) return match[1].trim();
  return emailFrom.split('@')[0];
}

export function InboxItem({item}: InboxItemProps) {
  const markReadMutation = useMarkEmailItemRead();
  const createLinkMutation = useCreateLink();

  const formatDate = (date: string) => {
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
    const domain = extractDomain(item.link);
    createLinkMutation.mutate(
      {
        url: item.link,
        title: item.title || domain,
        description: item.description || undefined,
      },
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

  const domain = extractDomain(item.link);
  const senderName = extractSenderName(item.emailFrom);
  const displayTitle = item.title || domain;

  return (
    <TouchableOpacity style={styles.container} onPress={handlePress} activeOpacity={0.7}>
      <View style={styles.content}>
        <Text style={styles.senderName}>From: {senderName}</Text>
        <Text style={styles.title} numberOfLines={2}>
          {displayTitle}
        </Text>
        {item.description && (
          <Text style={styles.description} numberOfLines={3}>
            {item.description}
          </Text>
        )}
        <Text style={styles.domain}>{domain}</Text>
        <Text style={styles.date}>{formatDate(item.createdAt)}</Text>
      </View>
      <View style={styles.actions}>
        <TouchableOpacity
          onPress={handleSaveLink}
          disabled={createLinkMutation.isPending}
          style={styles.actionButton}
        >
          <Ionicons
            name={createLinkMutation.isPending ? 'hourglass' : 'bookmark-outline'}
            size={22}
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
            size={22}
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
    padding: 14,
    shadowColor: colors.shadowColor,
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 2,
    borderWidth: 1,
    borderColor: colors.border,
  },
  content: {
    flex: 1,
  },
  senderName: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.primary,
    marginBottom: 4,
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.foreground,
    marginBottom: 6,
    lineHeight: 20,
  },
  description: {
    fontSize: 13,
    color: colors.mutedForeground,
    lineHeight: 18,
    marginBottom: 6,
  },
  domain: {
    fontSize: 12,
    color: colors.linkAccent,
    marginBottom: 4,
  },
  date: {
    fontSize: 11,
    color: colors.mutedForeground,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 10,
    gap: 16,
  },
  actionButton: {
    padding: 6,
  },
});
