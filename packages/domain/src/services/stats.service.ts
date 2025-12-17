import {resolveDependency} from '@stashl/iocdi';
import {REPOSITORY_SYMBOLS} from '../repositories';
import type {StatsRepository, Stats} from '../types';

const STAT_TYPES = {
  TASK_RUNNER: 'task_runner',
} as const;

export class StatsService {
  private repository: StatsRepository;

  constructor() {
    const repo = resolveDependency<StatsRepository>(REPOSITORY_SYMBOLS.STATS_REPOSITORY);
    if (!repo) {
      throw new Error('StatsRepository not initialized. Call initializeRepositories() first.');
    }
    this.repository = repo;
  }

  async recordTaskRun(successCount: number, failCount: number): Promise<Stats> {
    return await this.repository.create({
      type: STAT_TYPES.TASK_RUNNER,
      data: {successCount, failCount},
    });
  }

  async getLatestTaskRun(): Promise<Stats | null> {
    return await this.repository.getLatestByType(STAT_TYPES.TASK_RUNNER);
  }
}
