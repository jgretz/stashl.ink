import {apiClient} from '../api-client';
import {useQuery} from '@tanstack/react-query';

export interface TaskRunnerStats {
  id: string;
  type: string;
  statTime: string;
  data: {
    successCount: number;
    failCount: number;
  };
}

export const statsQueryKeys = {
  taskRunner: ['stats', 'task-runner'] as const,
};

export const statsApi = {
  getLatestTaskRunner: async (): Promise<{stat: TaskRunnerStats | null}> => {
    return apiClient.get('/stats/task-runner/latest');
  },
};

export function useTaskRunnerStats() {
  return useQuery({
    queryKey: statsQueryKeys.taskRunner,
    queryFn: statsApi.getLatestTaskRunner,
    retry: 1,
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 60 * 1000, // Refetch every minute
  });
}
