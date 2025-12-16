import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query';
import {apiClient} from '../api-client';

export interface RssFeed {
  id: string;
  userId: string;
  title: string;
  feedUrl: string;
  siteUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface RssFeedItem {
  id: string;
  feedId: string;
  guid: string;
  title: string;
  link: string;
  summary: string | null;
  content: string | null;
  imageUrl: string | null;
  pubDate: string | null;
  read: boolean;
  clicked: boolean;
  createdAt: string;
}

export interface CreateFeedInput {
  title: string;
  feedUrl: string;
  siteUrl?: string;
}

export interface UpdateFeedInput {
  title?: string;
  feedUrl?: string;
  siteUrl?: string;
}

export const feedQueryKeys = {
  all: ['feeds'] as const,
  detail: (id: string) => ['feeds', id] as const,
  items: (feedId: string) => ['feeds', feedId, 'items'] as const,
  unreadItems: ['feeds', 'unread'] as const,
};

export const feedApi = {
  getFeeds: async (): Promise<{feeds: RssFeed[]}> => {
    return apiClient.get('/rss/feeds');
  },

  getFeed: async (id: string): Promise<{feed: RssFeed}> => {
    return apiClient.get(`/rss/feeds/${id}`);
  },

  createFeed: async (data: CreateFeedInput): Promise<{message: string; feed: RssFeed}> => {
    return apiClient.post('/rss/feeds', data);
  },

  updateFeed: async ({id, data}: {id: string; data: UpdateFeedInput}): Promise<{message: string; feed: RssFeed}> => {
    return apiClient.put(`/rss/feeds/${id}`, data);
  },

  deleteFeed: async (id: string): Promise<{message: string}> => {
    return apiClient.delete(`/rss/feeds/${id}`);
  },

  getFeedItems: async (feedId: string, limit?: number): Promise<{items: RssFeedItem[]}> => {
    const query = limit ? `?limit=${limit}` : '';
    return apiClient.get(`/rss/feeds/${feedId}/items${query}`);
  },

  getUnreadItems: async (limit?: number): Promise<{items: RssFeedItem[]}> => {
    const query = limit ? `?limit=${limit}` : '';
    return apiClient.get(`/rss/items/unread${query}`);
  },

  markItemRead: async (id: string): Promise<{item: RssFeedItem}> => {
    return apiClient.put(`/rss/items/${id}`, {read: true});
  },

  markAllRead: async (): Promise<{message: string; count: number}> => {
    return apiClient.post('/rss/items/mark-all-read', {});
  },

  triggerImport: async (feedId: string): Promise<{message: string; feedId: string}> => {
    return apiClient.post(`/rss/feeds/${feedId}/import`, {});
  },
};

export function useFeeds() {
  return useQuery({
    queryKey: feedQueryKeys.all,
    queryFn: feedApi.getFeeds,
    retry: 1,
    staleTime: 30 * 1000,
  });
}

export function useFeed(id: string) {
  return useQuery({
    queryKey: feedQueryKeys.detail(id),
    queryFn: () => feedApi.getFeed(id),
    enabled: !!id,
    retry: 1,
    staleTime: 2 * 60 * 1000,
  });
}

export function useCreateFeed() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: feedApi.createFeed,
    onSuccess: (data) => {
      queryClient.setQueryData(feedQueryKeys.all, (old: {feeds: RssFeed[]} | undefined) => {
        if (!old) return {feeds: [data.feed]};
        return {feeds: [data.feed, ...old.feeds]};
      });
      queryClient.invalidateQueries({queryKey: feedQueryKeys.all});
    },
  });
}

export function useUpdateFeed() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: feedApi.updateFeed,
    onSuccess: (data, variables) => {
      queryClient.setQueryData(feedQueryKeys.detail(variables.id), {feed: data.feed});
      queryClient.setQueryData(feedQueryKeys.all, (old: {feeds: RssFeed[]} | undefined) => {
        if (!old) return {feeds: [data.feed]};
        return {
          feeds: old.feeds.map((feed) => (feed.id === variables.id ? data.feed : feed)),
        };
      });
      queryClient.invalidateQueries({queryKey: feedQueryKeys.all});
    },
  });
}

export function useDeleteFeed() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: feedApi.deleteFeed,
    onSuccess: (_, feedId) => {
      queryClient.removeQueries({queryKey: feedQueryKeys.detail(feedId)});
      queryClient.setQueryData(feedQueryKeys.all, (old: {feeds: RssFeed[]} | undefined) => {
        if (!old) return {feeds: []};
        return {feeds: old.feeds.filter((feed) => feed.id !== feedId)};
      });
      queryClient.invalidateQueries({queryKey: feedQueryKeys.all});
    },
  });
}

export function useUnreadItems(limit?: number) {
  return useQuery({
    queryKey: feedQueryKeys.unreadItems,
    queryFn: () => feedApi.getUnreadItems(limit),
    retry: 1,
    staleTime: 30 * 1000,
  });
}

export function useMarkItemRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: feedApi.markItemRead,
    onSuccess: (data) => {
      queryClient.setQueryData(feedQueryKeys.unreadItems, (old: {items: RssFeedItem[]} | undefined) => {
        if (!old) return {items: []};
        return {items: old.items.filter((item) => item.id !== data.item.id)};
      });
    },
  });
}

export function useMarkAllRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: feedApi.markAllRead,
    onSuccess: () => {
      queryClient.setQueryData(feedQueryKeys.unreadItems, {items: []});
      queryClient.invalidateQueries({queryKey: feedQueryKeys.unreadItems});
    },
  });
}

export function useTriggerImport() {
  return useMutation({
    mutationFn: feedApi.triggerImport,
  });
}
