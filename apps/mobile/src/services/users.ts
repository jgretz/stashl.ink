import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query';
import {apiClient} from './api-client';
import type {User} from './auth';

export interface UpdateUserInput {
  email?: string;
  name?: string;
  password?: string;
}

// Query Keys
export const userQueryKeys = {
  profile: ['user', 'profile'] as const,
};

// User API calls
export const userApi = {
  getProfile: async (): Promise<{user: User}> => {
    return apiClient.get('/users/profile');
  },
  
  updateProfile: async (data: UpdateUserInput): Promise<{message: string; user: User}> => {
    return apiClient.put('/users/profile', data);
  },
  
  deleteProfile: async (): Promise<{message: string}> => {
    return apiClient.delete('/users/profile');
  },
};

// React Query Hooks for React Native
export function useUserProfile() {
  return useQuery({
    queryKey: userQueryKeys.profile,
    queryFn: userApi.getProfile,
    retry: 1,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useUpdateUserProfile() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: userApi.updateProfile,
    onSuccess: (data) => {
      // Update the profile cache with the new user data
      queryClient.setQueryData(userQueryKeys.profile, {user: data.user});
      // Invalidate and refetch to ensure consistency
      queryClient.invalidateQueries({queryKey: userQueryKeys.profile});
    },
    onError: (error) => {
      console.error('Failed to update profile:', error);
    },
  });
}

export function useDeleteUserProfile() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: userApi.deleteProfile,
    onSuccess: () => {
      // Clear all user-related queries
      queryClient.removeQueries({queryKey: userQueryKeys.profile});
    },
    onError: (error) => {
      console.error('Failed to delete profile:', error);
    },
  });
}