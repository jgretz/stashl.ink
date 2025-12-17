import {apiClient} from '../api-client';
import {useQuery, useMutation, useQueryClient, useInfiniteQuery} from '@tanstack/react-query';

export interface EmailSettings {
  emailIntegrationEnabled: boolean;
  emailFilter: string | null;
  isConnected: boolean;
}

export interface EmailItem {
  id: string;
  userId: string;
  emailMessageId: string;
  emailFrom: string;
  link: string;
  title: string | null;
  description: string | null;
  read: boolean;
  clicked: boolean;
  createdAt: string;
}

export interface EmailItemsResponse {
  items: EmailItem[];
  hasMore: boolean;
  nextOffset: number;
}

export interface EmailProcessorStats {
  id: string;
  type: string;
  statTime: string;
  data: {
    usersProcessed: number;
    emailsParsed: number;
    linksFound: number;
  };
}

export const emailQueryKeys = {
  settings: ['email', 'settings'] as const,
  items: ['email', 'items'] as const,
  unreadItems: ['email', 'items', 'unread'] as const,
  stats: ['stats', 'email-processor'] as const,
};

export const emailApi = {
  getSettings: async (): Promise<EmailSettings> => {
    return apiClient.get('/email/settings');
  },

  updateSettings: async (data: {emailIntegrationEnabled?: boolean; emailFilter?: string}): Promise<EmailSettings> => {
    return apiClient.put('/email/settings', data);
  },

  disconnect: async (): Promise<{message: string}> => {
    return apiClient.post('/email/disconnect');
  },

  getOAuthUrl: async (): Promise<{authUrl: string}> => {
    return apiClient.get('/email/oauth/url');
  },

  getItems: async (limit = 100, offset = 0): Promise<EmailItemsResponse> => {
    return apiClient.get(`/email/items?limit=${limit}&offset=${offset}`);
  },

  getUnreadItems: async (limit = 100, offset = 0): Promise<EmailItemsResponse> => {
    return apiClient.get(`/email/items/unread?limit=${limit}&offset=${offset}`);
  },

  updateItem: async (id: string, data: {read?: boolean; clicked?: boolean}): Promise<{item: EmailItem}> => {
    return apiClient.put(`/email/items/${id}`, data);
  },

  markAllRead: async (): Promise<{message: string; count: number}> => {
    return apiClient.post('/email/items/mark-all-read');
  },

  getLatestStats: async (): Promise<{stat: EmailProcessorStats | null}> => {
    return apiClient.get('/stats/email-processor/latest');
  },

  refresh: async (): Promise<{message: string}> => {
    return apiClient.post('/email/refresh');
  },
};

export function useEmailSettings() {
  return useQuery({
    queryKey: emailQueryKeys.settings,
    queryFn: emailApi.getSettings,
    retry: 1,
  });
}

export function useUpdateEmailSettings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: emailApi.updateSettings,
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: emailQueryKeys.settings});
    },
  });
}

export function useDisconnectEmail() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: emailApi.disconnect,
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: emailQueryKeys.settings});
    },
  });
}

export function useEmailItems(limit = 100, offset = 0) {
  return useQuery({
    queryKey: [...emailQueryKeys.items, limit, offset],
    queryFn: () => emailApi.getItems(limit, offset),
    retry: 1,
  });
}

export function useUnreadEmailItems(pageSize = 100) {
  return useInfiniteQuery({
    queryKey: emailQueryKeys.unreadItems,
    queryFn: ({pageParam = 0}) => emailApi.getUnreadItems(pageSize, pageParam),
    initialPageParam: 0,
    getNextPageParam: (lastPage) => (lastPage.hasMore ? lastPage.nextOffset : undefined),
    retry: 1,
    staleTime: 30 * 1000,
  });
}

type InfiniteEmailData = {
  pages: EmailItemsResponse[];
  pageParams: number[];
};

export function useUpdateEmailItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({id, data}: {id: string; data: {read?: boolean; clicked?: boolean}}) =>
      emailApi.updateItem(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: emailQueryKeys.items});
      queryClient.invalidateQueries({queryKey: emailQueryKeys.unreadItems});
    },
  });
}

export function useMarkEmailItemRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => emailApi.updateItem(id, {read: true}),
    onSuccess: (data) => {
      queryClient.setQueryData(emailQueryKeys.unreadItems, (old: InfiniteEmailData | undefined) => {
        if (!old) return old;
        return {
          ...old,
          pages: old.pages.map((page) => ({
            ...page,
            items: page.items.filter((item) => item.id !== data.item.id),
          })),
        };
      });
    },
  });
}

export function useMarkAllEmailItemsRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: emailApi.markAllRead,
    onSuccess: () => {
      queryClient.setQueryData(emailQueryKeys.unreadItems, (old: InfiniteEmailData | undefined) => {
        if (!old) return old;
        return {
          ...old,
          pages: old.pages.map((page) => ({
            ...page,
            items: [],
            hasMore: false,
          })),
        };
      });
      queryClient.invalidateQueries({queryKey: emailQueryKeys.unreadItems});
    },
  });
}

export function useEmailProcessorStats() {
  return useQuery({
    queryKey: emailQueryKeys.stats,
    queryFn: emailApi.getLatestStats,
    retry: 1,
    staleTime: 30 * 1000,
    refetchInterval: 60 * 1000,
  });
}

export function useTriggerEmailRefresh() {
  return useMutation({
    mutationFn: emailApi.refresh,
  });
}
