import React, {useState} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import {useCreateLink} from '../services';
import {fetchPageMetadata, normalizeUrl, isValidUrl} from '@stashl/metadata';
import type {CreateLinkInput} from '@stashl/domain';
import {colors} from '../theme';

interface AddLinkFormProps {
  visible: boolean;
  onClose: () => void;
}

export function AddLinkForm({visible, onClose}: AddLinkFormProps) {
  const [url, setUrl] = useState('');
  const [isLoadingMetadata, setIsLoadingMetadata] = useState(false);
  const [error, setError] = useState('');

  const createLinkMutation = useCreateLink();

  const handleSubmit = async () => {
    if (!url.trim()) {
      setError('URL is required');
      return;
    }

    const normalizedUrl = normalizeUrl(url.trim());

    if (!isValidUrl(normalizedUrl)) {
      setError('Please enter a valid URL');
      return;
    }

    setIsLoadingMetadata(true);
    setError('');

    try {
      const metadata = await fetchPageMetadata(normalizedUrl);

      const linkData: CreateLinkInput = {
        url: normalizedUrl,
        title: metadata.title,
        description: metadata.description,
      };

      createLinkMutation.mutate(linkData);
    } catch (error) {
      console.error('Error fetching metadata:', error);
      // Fallback: create link with just URL
      createLinkMutation.mutate({
        url: normalizedUrl,
        title: new URL(normalizedUrl).hostname,
      });
    } finally {
      setIsLoadingMetadata(false);
    }
  };

  const handleClose = () => {
    setUrl('');
    setError('');
    setIsLoadingMetadata(false);
    onClose();
  };

  const handleUrlChange = (value: string) => {
    setUrl(value);
    if (error) {
      setError('');
    }
  };

  return (
    <Modal visible={visible} animationType='slide' presentationStyle='pageSheet'>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={handleClose}>
            <Text style={styles.cancelButton}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Add New Link</Text>
          <TouchableOpacity
            onPress={handleSubmit}
            disabled={createLinkMutation.isPending || isLoadingMetadata}
          >
            <Text
              style={[
                styles.saveButton,
                (createLinkMutation.isPending || isLoadingMetadata) && styles.disabledButton,
              ]}
            >
              {isLoadingMetadata
                ? 'Fetching...'
                : createLinkMutation.isPending
                  ? 'Adding...'
                  : 'Add'}
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.form} showsVerticalScrollIndicator={false}>
          <View style={styles.field}>
            <Text style={styles.label}>URL *</Text>
            <TextInput
              style={[styles.input, error && styles.inputError]}
              value={url}
              onChangeText={handleUrlChange}
              placeholder='https://example.com'
              placeholderTextColor={colors.mutedForeground}
              keyboardType='url'
              autoCapitalize='none'
              autoCorrect={false}
            />
            {error && <Text style={styles.errorText}>{error}</Text>}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
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
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.foreground,
  },
  cancelButton: {
    fontSize: 16,
    color: colors.mutedForeground,
  },
  saveButton: {
    fontSize: 16,
    color: colors.linkAccent,
    fontWeight: 'bold',
  },
  disabledButton: {
    color: colors.mutedForeground,
  },
  form: {
    flex: 1,
    padding: 16,
  },
  field: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.foreground,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: colors.input,
    color: colors.foreground,
  },
  textArea: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: colors.input,
    color: colors.foreground,
    height: 100,
  },
  inputError: {
    borderColor: colors.destructive,
  },
  errorText: {
    color: colors.destructive,
    fontSize: 14,
    marginTop: 4,
  },
  infoContainer: {
    backgroundColor: colors.muted,
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  infoText: {
    color: colors.mutedForeground,
    fontSize: 14,
    lineHeight: 20,
  },
});
