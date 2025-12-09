import React from 'react';
import {View, Text, TouchableOpacity, StyleSheet, Alert, Linking} from 'react-native';
import type {Link} from '../services';
import {colors} from '../theme';

interface LinkCardProps {
  link: Link;
  onDelete: () => void;
}

export function LinkCard({link, onDelete}: LinkCardProps) {
  const handlePress = async () => {
    try {
      const supported = await Linking.canOpenURL(link.url);
      if (supported) {
        await Linking.openURL(link.url);
      } else {
        Alert.alert('Error', `Cannot open URL: ${link.url}`);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to open link');
    }
  };

  const handleDelete = () => {
    Alert.alert('Delete Link', 'Are you sure you want to delete this link?', [
      {text: 'Cancel', style: 'cancel'},
      {text: 'Delete', style: 'destructive', onPress: onDelete},
    ]);
  };

  return (
    <TouchableOpacity style={styles.container} onPress={handlePress}>
      <View style={styles.content}>
        <Text style={styles.title} numberOfLines={2}>
          {link.title}
        </Text>
        {link.description && (
          <Text style={styles.description} numberOfLines={3}>
            {link.description}
          </Text>
        )}
        <Text style={styles.url} numberOfLines={1}>
          {link.url}
        </Text>
        <Text style={styles.date}>{new Date(link.dateAdded).toLocaleDateString()}</Text>
      </View>
      <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
        <Text style={styles.deleteText}>✕</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.card,
    borderRadius: 8,
    padding: 16,
    marginVertical: 8,
    marginHorizontal: 16,
    shadowColor: colors.shadowColor,
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderWidth: 1,
    borderColor: colors.border,
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.foreground,
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: colors.mutedForeground,
    marginBottom: 8,
    lineHeight: 20,
  },
  url: {
    fontSize: 12,
    color: colors.linkAccent,
    marginBottom: 4,
  },
  date: {
    fontSize: 12,
    color: colors.mutedForeground,
  },
  deleteButton: {
    padding: 8,
    marginLeft: 8,
  },
  deleteText: {
    fontSize: 18,
    color: colors.destructive,
    fontWeight: 'bold',
  },
});
