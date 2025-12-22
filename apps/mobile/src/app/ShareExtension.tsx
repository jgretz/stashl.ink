import React, {useState} from 'react';
import {View, Text, TouchableOpacity, StyleSheet, ActivityIndicator} from 'react-native';
import {close} from 'expo-share-extension';
import type {InitialProps} from 'expo-share-extension';
import {getSharedAuthToken} from '../services/shared-storage';

const API_URL = 'https://stashl-api.fly.dev/api';

// Simple URL validation that works in share extension environment
function isValidUrl(str: string): boolean {
  return /^https?:\/\/.+\..+/.test(str);
}

async function saveLink(token: string, url: string) {
  const response = await fetch(`${API_URL}/links`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({url}),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({error: 'Failed to save link'}));
    throw new Error(errorData.error || `HTTP ${response.status}`);
  }

  return response.json();
}

export default function ShareExtension({url, text}: InitialProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [status, setStatus] = useState<'idle' | 'saving' | 'success' | 'error' | 'not_logged_in'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const extractUrlFromText = (text?: string): string | null => {
    if (!text) return null;
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const matches = text.match(urlRegex);
    return matches ? matches[0]?.trim() : null;
  };

  const cleanUrl = (rawUrl?: string): string | null => {
    if (!rawUrl) return null;
    // Remove whitespace and common trailing characters
    return rawUrl.trim().replace(/[>\s]+$/, '');
  };

  const displayUrl = cleanUrl(url) || extractUrlFromText(text);

  const handleSaveLink = async () => {
    if (isProcessing) return;

    setIsProcessing(true);
    setStatus('saving');

    try {
      let linkUrl = cleanUrl(url) || extractUrlFromText(text);

      if (!linkUrl) {
        setStatus('error');
        setErrorMessage('No URL found in shared content.');
        setIsProcessing(false);
        return;
      }

      // Normalize URL if it doesn't have a protocol
      if (!linkUrl.startsWith('http://') && !linkUrl.startsWith('https://')) {
        linkUrl = `https://${linkUrl}`;
      }

      if (!isValidUrl(linkUrl)) {
        setStatus('error');
        setErrorMessage(`Invalid URL: ${linkUrl}`);
        setIsProcessing(false);
        return;
      }

      const token = await getSharedAuthToken();
      if (!token) {
        setStatus('not_logged_in');
        setIsProcessing(false);
        return;
      }

      // Server fetches metadata
      await saveLink(token, linkUrl);

      setStatus('success');
      setTimeout(() => close(), 1500);
    } catch (error) {
      console.error('Error saving link:', error);
      setStatus('error');
      setErrorMessage(error instanceof Error ? error.message : 'Failed to save link');
      setIsProcessing(false);
    }
  };

  if (status === 'success') {
    return (
      <View style={styles.container}>
        <View style={styles.statusContainer}>
          <Text style={styles.successIcon}>✓</Text>
          <Text style={styles.successText}>Link Saved!</Text>
        </View>
      </View>
    );
  }

  if (status === 'not_logged_in') {
    return (
      <View style={styles.container}>
        <View style={styles.statusContainer}>
          <Text style={styles.errorIcon}>!</Text>
          <Text style={styles.errorText}>Please log in to Stashl.ink first</Text>
          <TouchableOpacity style={styles.closeButton} onPress={close}>
            <Text style={styles.closeButtonText}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (status === 'saving') {
    return (
      <View style={styles.container}>
        <View style={styles.statusContainer}>
          <ActivityIndicator size="large" color="#ff4500" />
          <Text style={styles.savingText}>Saving link...</Text>
        </View>
      </View>
    );
  }

  if (status === 'error') {
    return (
      <View style={styles.container}>
        <View style={styles.statusContainer}>
          <Text style={styles.errorIcon}>✕</Text>
          <Text style={styles.errorText}>{errorMessage}</Text>
          <View style={styles.errorButtons}>
            <TouchableOpacity style={styles.retryButton} onPress={() => { setStatus('idle'); handleSaveLink(); }}>
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.closeButton} onPress={close}>
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Save to Stashl.ink</Text>
      </View>

      <View style={styles.content}>
        {displayUrl && (
          <View style={styles.urlContainer}>
            <Text style={styles.label}>URL:</Text>
            <Text style={styles.url} numberOfLines={2}>
              {displayUrl}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.buttons}>
        <TouchableOpacity style={styles.cancelButton} onPress={close} disabled={isProcessing}>
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.saveButton, isProcessing && styles.disabledButton]}
          onPress={handleSaveLink}
          disabled={isProcessing || !displayUrl}
        >
          <Text style={styles.saveButtonText}>Save Link</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF8E1',
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#3d2914',
  },
  content: {
    flex: 1,
    marginBottom: 20,
  },
  urlContainer: {
    marginBottom: 15,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8b6914',
    marginBottom: 5,
  },
  url: {
    fontSize: 16,
    color: '#2b5f5f',
    backgroundColor: '#ede4d3',
    padding: 10,
    borderRadius: 8,
  },
  buttons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 15,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#d2b48c',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#3d2914',
    fontSize: 16,
    fontWeight: '600',
  },
  saveButton: {
    flex: 1,
    backgroundColor: '#ff4500',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#FFF8E1',
    fontSize: 16,
    fontWeight: '600',
  },
  disabledButton: {
    backgroundColor: '#cd853f',
  },
  statusContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  successIcon: {
    fontSize: 48,
    color: '#2b5f5f',
    marginBottom: 16,
  },
  successText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2b5f5f',
  },
  errorIcon: {
    fontSize: 48,
    color: '#ff4500',
    marginBottom: 16,
  },
  errorText: {
    fontSize: 16,
    color: '#3d2914',
    textAlign: 'center',
    marginBottom: 20,
  },
  savingText: {
    fontSize: 16,
    color: '#3d2914',
    marginTop: 16,
  },
  errorButtons: {
    flexDirection: 'row',
    gap: 15,
  },
  retryButton: {
    backgroundColor: '#ff4500',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFF8E1',
    fontSize: 16,
    fontWeight: '600',
  },
  closeButton: {
    backgroundColor: '#d2b48c',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  closeButtonText: {
    color: '#3d2914',
    fontSize: 16,
    fontWeight: '600',
  },
});
