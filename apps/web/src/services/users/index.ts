import {apiClient} from '../api-client';
import type {User} from '../auth/auth-service';
import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query';

export interface UpdateUserInput {
  email?: string;
  name?: string;
  password?: string;
}

// Query Keys
export const userQueryKeys = {
  profile: ['user', 'profile'] as const,
  all: ['users'] as const,
};

// User Profile API calls
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
  
  getAllUsers: async (): Promise<{users: User[]}> => {
    return apiClient.get('/users');
  },
  
  createUser: async (data: {email: string; name: string; password: string}): Promise<{message: string; user: User}> => {
    return apiClient.post('/users', data);
  },
  
  updateUser: async (id: string, data: UpdateUserInput): Promise<{message: string; user: User}> => {
    return apiClient.put(`/users/${id}`, data);
  },
  
  deleteUser: async (id: string): Promise<{message: string}> => {
    return apiClient.delete(`/users/${id}`);
  },
};

// React Query Hooks
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
  });
}

export function useDeleteUserProfile() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: userApi.deleteProfile,
    onSuccess: () => {
      // Clear all user-related queries
      queryClient.removeQueries({queryKey: userQueryKeys.profile});
      queryClient.removeQueries({queryKey: userQueryKeys.all});
    },
  });
}

export function useAllUsers() {
  return useQuery({
    queryKey: userQueryKeys.all,
    queryFn: userApi.getAllUsers,
    retry: 1,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

// Additional compatibility functions
export const getUsers = userApi.getAllUsers;
export const createUser = userApi.createUser;
export const updateUser = userApi.updateUser;
export const deleteUser = userApi.deleteUser;