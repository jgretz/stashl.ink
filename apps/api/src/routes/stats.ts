import {Hono} from 'hono';
import {StatsService} from '@stashl/domain/src/services/stats.service';

export const statsRoutes = new Hono();

const TASK_API_KEY = process.env.TASK_API_KEY;

// POST /api/stats/task-runner - Record task run (called by task runner)
statsRoutes.post('/task-runner', async (c) => {
  const apiKey = c.req.header('X-Task-Key');

  if (!TASK_API_KEY || apiKey !== TASK_API_KEY) {
    return c.json({error: 'Unauthorized'}, 401);
  }

  try {
    const body = await c.req.json();
    const {successCount, failCount} = body;

    if (typeof successCount !== 'number' || typeof failCount !== 'number') {
      return c.json({error: 'successCount and failCount are required numbers'}, 400);
    }

    const statsService = new StatsService();
    const stat = await statsService.recordTaskRun(successCount, failCount);

    return c.json({message: 'Task run recorded', stat}, 201);
  } catch (error) {
    console.error('Error recording task stats:', error);
    return c.json({error: 'Failed to record task stats'}, 500);
  }
});

// GET /api/stats/task-runner/latest - Get latest task run (dashboard)
statsRoutes.get('/task-runner/latest', async (c) => {
  try {
    const statsService = new StatsService();
    const stat = await statsService.getLatestTaskRun();

    return c.json({stat});
  } catch (error) {
    console.error('Error fetching task stats:', error);
    return c.json({error: 'Failed to fetch task stats'}, 500);
  }
});
