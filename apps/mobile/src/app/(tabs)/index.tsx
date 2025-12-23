import React, {useState, useEffect} from 'react';
import {StyleSheet, View, Text, TouchableOpacity, SafeAreaView, Image} from 'react-native';
import {useLocalSearchParams} from 'expo-router';
import {LinkList, AddLinkForm, SharedLinkProcessor} from '../../components';
import {colors} from '../../theme';
import {shareHandler, type SharedLinkData, useLinks} from '../../services';

export default function LinksTab() {
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [sharedLinkData, setSharedLinkData] = useState<SharedLinkData | null>(null);
  const [isSharedLinkVisible, setIsSharedLinkVisible] = useState(false);
  const {data: linksData} = useLinks();

  const {url, text} = useLocalSearchParams<{url?: string; text?: string}>();

  const linkCount = linksData?.links.length ?? 0;

  useEffect(() => {
    shareHandler.initialize();

    const removeShareListener = shareHandler.addListener((data: SharedLinkData) => {
      setSharedLinkData(data);
      setIsSharedLinkVisible(true);
    });

    if (url) {
      const shareData: SharedLinkData = {
        url: decodeURIComponent(url),
        title: text ? decodeURIComponent(text) : undefined,
      };
      setSharedLinkData(shareData);
      setIsSharedLinkVisible(true);
    }

    return () => {
      removeShareListener();
      shareHandler.cleanup();
    };
  }, [url, text]);

  const handleCloseSharedLink = () => {
    setIsSharedLinkVisible(false);
    setSharedLinkData(null);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTitleContainer}>
          <Image
            source={require('../../../assets/stashl-logo.png')}
            style={styles.headerLogo}
            resizeMode="contain"
          />
          <Text style={styles.headerTitle}>Links {linkCount > 0 ? `(${linkCount})` : '✨'}</Text>
        </View>
        <TouchableOpacity style={styles.addButton} onPress={() => setIsFormVisible(true)}>
          <Text style={styles.addButtonText}>+ Add</Text>
        </TouchableOpacity>
      </View>

      <LinkList />

      <AddLinkForm visible={isFormVisible} onClose={() => setIsFormVisible(false)} />

      <SharedLinkProcessor
        visible={isSharedLinkVisible}
        sharedData={sharedLinkData}
        onClose={handleCloseSharedLink}
      />
    </SafeAreaView>
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
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerLogo: {
    width: 28,
    height: 28,
    marginRight: 8,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: colors.foreground,
  },
  addButton: {
    backgroundColor: colors.linkAccent,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addButtonText: {
    color: colors.background,
    fontSize: 14,
    fontWeight: '600',
  },
});
