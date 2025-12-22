import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query';
import {apiClient} from './api-client';

export interface Link {
  id: string;
  url: string;
  title: string;
  description?: string;
  dateAdded: string;
  userId: string;
}

export interface CreateLinkInput {
  url: string;
}

export interface UpdateLinkInput {
  url?: string;
  title?: string;
  description?: string;
}

// Query Keys
export const linkQueryKeys = {
  all: ['links'] as const,
  detail: (id: string) => ['links', id] as const,
};

// Link API calls
export const linkApi = {
  getLinks: async (): Promise<{links: Link[]}> => {
    return apiClient.get('/links');
  },
  
  getLink: async (id: string): Promise<{link: Link}> => {
    return apiClient.get(`/links/${id}`);
  },
  
  createLink: async (data: CreateLinkInput): Promise<{message: string; link: Link}> => {
    return apiClient.post('/links', data);
  },
  
  updateLink: async ({id, data}: {id: string; data: UpdateLinkInput}): Promise<{message: string; link: Link}> => {
    return apiClient.put(`/links/${id}`, data);
  },
  
  deleteLink: async (id: string): Promise<{message: string}> => {
    return apiClient.delete(`/links/${id}`);
  },
};

// React Query Hooks for React Native
export function useLinks() {
  return useQuery({
    queryKey: linkQueryKeys.all,
    queryFn: linkApi.getLinks,
    retry: 1,
    staleTime: 30 * 1000, // 30 seconds
  });
}

export function useLink(id: string) {
  return useQuery({
    queryKey: linkQueryKeys.detail(id),
    queryFn: () => linkApi.getLink(id),
    enabled: !!id,
    retry: 1,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

export function useCreateLink() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: linkApi.createLink,
    onSuccess: (data) => {
      // Add the new link to the cache
      queryClient.setQueryData(linkQueryKeys.all, (old: {links: Link[]} | undefined) => {
        if (!old) return {links: [data.link]};
        return {links: [data.link, ...old.links]};
      });
      // Invalidate to ensure consistency
      queryClient.invalidateQueries({queryKey: linkQueryKeys.all});
    },
    onError: (error) => {
      console.error('Failed to create link:', error);
    },
  });
}

export function useUpdateLink() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: linkApi.updateLink,
    onSuccess: (data, variables) => {
      // Update the specific link in cache
      queryClient.setQueryData(linkQueryKeys.detail(variables.id), {link: data.link});
      // Update the link in the list cache
      queryClient.setQueryData(linkQueryKeys.all, (old: {links: Link[]} | undefined) => {
        if (!old) return {links: [data.link]};
        return {
          links: old.links.map(link => 
            link.id === variables.id ? data.link : link
          ),
        };
      });
      // Invalidate to ensure consistency
      queryClient.invalidateQueries({queryKey: linkQueryKeys.all});
    },
    onError: (error) => {
      console.error('Failed to update link:', error);
    },
  });
}

export function useDeleteLink() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: linkApi.deleteLink,
    onSuccess: (_, linkId) => {
      // Remove the link from cache
      queryClient.removeQueries({queryKey: linkQueryKeys.detail(linkId)});
      // Remove from list cache
      queryClient.setQueryData(linkQueryKeys.all, (old: {links: Link[]} | undefined) => {
        if (!old) return {links: []};
        return {links: old.links.filter(link => link.id !== linkId)};
      });
      // Invalidate to ensure consistency
      queryClient.invalidateQueries({queryKey: linkQueryKeys.all});
    },
    onError: (error) => {
      console.error('Failed to delete link:', error);
    },
  });
}

// Convenience exports for direct API calls (useful for share extension)
export async function createLinkDirect(input: CreateLinkInput): Promise<Link> {
  const response = await linkApi.createLink(input);
  return response.link;
}

export async function getLinksDirect(): Promise<Link[]> {
  const response = await linkApi.getLinks();
  return response.links;
}