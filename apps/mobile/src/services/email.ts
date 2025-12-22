import {useMutation, useQuery, useQueryClient, useInfiniteQuery} from '@tanstack/react-query';
import {apiClient} from './api-client';

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

export const emailQueryKeys = {
  settings: ['email', 'settings'] as const,
  unreadItems: ['email', 'items', 'unread'] as const,
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

  getUnreadItems: async (limit = 50, offset = 0): Promise<EmailItemsResponse> => {
    return apiClient.get(`/email/items/unread?limit=${limit}&offset=${offset}`);
  },

  markItemRead: async (id: string): Promise<{item: EmailItem}> => {
    return apiClient.put(`/email/items/${id}`, {read: true});
  },

  markAllRead: async (): Promise<{message: string; count: number}> => {
    return apiClient.post('/email/items/mark-all-read');
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
    staleTime: 30 * 1000,
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

export function useUnreadEmailItems(pageSize = 30) {
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

export function useMarkEmailItemRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: emailApi.markItemRead,
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

export function useTriggerEmailRefresh() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: emailApi.refresh,
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: emailQueryKeys.unreadItems});
    },
  });
}
