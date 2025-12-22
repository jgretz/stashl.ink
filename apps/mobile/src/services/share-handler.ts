import * as Linking from 'expo-linking';
import * as IntentLauncher from 'expo-intent-launcher';
import {Platform} from 'react-native';
import {isValidUrl, normalizeUrl} from '@stashl/metadata';
import {createLinkDirect} from './links';

export interface SharedLinkData {
  url: string;
  title?: string;
  description?: string;
}

/**
 * Handles incoming shared URLs and processes them
 */
export class ShareHandler {
  private static instance: ShareHandler;
  private listeners: Array<(data: SharedLinkData) => void> = [];
  private linkingListener: any = null;

  static getInstance(): ShareHandler {
    if (!ShareHandler.instance) {
      ShareHandler.instance = new ShareHandler();
    }
    return ShareHandler.instance;
  }

  /**
   * Initialize the share handler
   */
  async initialize(): Promise<void> {
    // Handle URL when app is launched from share sheet
    const initialURL = await Linking.getInitialURL();
    if (initialURL) {
      await this.handleURL(initialURL);
    }

    // Listen for URL events when app is already running
    this.linkingListener = Linking.addEventListener('url', (event) => {
      this.handleURL(event.url);
    });

    // Handle Android intents if available
    if (Platform.OS === 'android') {
      this.handleAndroidIntent();
    }
  }

  /**
   * Handle Android share intents
   */
  private async handleAndroidIntent(): Promise<void> {
    try {
      // This would need to be implemented with a custom native module
      // For now, we'll rely on URL schemes and deep linking
      console.log('Android intent handling initialized');
    } catch (error) {
      console.error('Error handling Android intent:', error);
    }
  }

  /**
   * Clean up listeners
   */
  cleanup(): void {
    if (this.linkingListener) {
      this.linkingListener.remove();
      this.linkingListener = null;
    }
    this.listeners = [];
  }

  /**
   * Add a listener for shared URLs
   */
  addListener(callback: (data: SharedLinkData) => void): () => void {
    this.listeners.push(callback);

    // Return cleanup function
    return () => {
      const index = this.listeners.indexOf(callback);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  /**
   * Handle incoming URL
   */
  private async handleURL(url: string): Promise<void> {
    try {
      console.log('Handling URL:', url);

      // Parse the URL to extract shared content
      const parsedURL = Linking.parse(url);

      let sharedUrl = '';

      if (parsedURL.scheme === 'stashl') {
        // Handle custom scheme URLs: stashl://share?url=...
        sharedUrl = (parsedURL.queryParams?.url as string) || '';

        // Also check for direct text sharing: stashl://share?text=...
        if (!sharedUrl) {
          const text = (parsedURL.queryParams?.text as string) || '';
          // Extract URL from text if it contains one
          const urlMatch = text.match(/(https?:\/\/[^\s]+)/);
          sharedUrl = urlMatch?.[0] || '';
        }
      } else if (isValidUrl(url)) {
        // Direct URL sharing
        sharedUrl = url;
      }

      if (sharedUrl && isValidUrl(sharedUrl)) {
        const normalizedUrl = normalizeUrl(sharedUrl);

        // Notify listeners about the shared URL
        const sharedData: SharedLinkData = {
          url: normalizedUrl,
        };

        console.log('Notifying listeners about shared URL:', normalizedUrl);
        this.listeners.forEach((listener) => listener(sharedData));
      }
    } catch (error) {
      console.error('Error handling shared URL:', error);
    }
  }

  /**
   * Process a shared URL - server handles metadata fetching
   */
  async processSharedUrl(url: string): Promise<void> {
    try {
      if (!isValidUrl(url)) {
        throw new Error('Invalid URL');
      }

      const normalizedUrl = normalizeUrl(url);
      console.log('Processing shared URL:', normalizedUrl);

      await createLinkDirect({url: normalizedUrl});

      console.log('Successfully saved shared link');
    } catch (error) {
      console.error('Error processing shared URL:', error);
      throw error;
    }
  }

  /**
   * Manually handle a shared URL (for testing or manual input)
   */
  handleSharedText(text: string): void {
    // Extract URL from text
    const urlMatch = text.match(/(https?:\/\/[^\s]+)/);
    const url = urlMatch?.[0];

    if (url && isValidUrl(url)) {
      const normalizedUrl = normalizeUrl(url);
      const sharedData: SharedLinkData = {
        url: normalizedUrl,
      };

      this.listeners.forEach((listener) => listener(sharedData));
    }
  }
}

// Export singleton instance
export const shareHandler = ShareHandler.getInstance();
