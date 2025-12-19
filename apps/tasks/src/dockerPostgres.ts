import {spawn, execSync} from 'child_process';

interface DockerConfig {
  containerName: string;
  port: number;
  password: string;
  database: string;
  image: string;
}

function getConfig(): DockerConfig {
  return {
    containerName: process.env.PGBOSS_CONTAINER_NAME || 'stashl-pgboss',
    port: parseInt(process.env.PGBOSS_DB_PORT || '5433', 10),
    password: process.env.PGBOSS_DB_PASSWORD || 'pgboss_local_dev',
    database: 'pgboss',
    image: 'postgres:16-alpine',
  };
}

export function getPgBossConnectionString(): string {
  const config = getConfig();
  return `postgresql://postgres:${config.password}@localhost:${config.port}/${config.database}`;
}

function isContainerRunning(containerName: string): boolean {
  try {
    const result = execSync(
      `docker inspect -f '{{.State.Running}}' ${containerName} 2>/dev/null`,
      {encoding: 'utf-8'}
    );
    return result.trim() === 'true';
  } catch {
    return false;
  }
}

function containerExists(containerName: string): boolean {
  try {
    execSync(`docker inspect ${containerName} 2>/dev/null`, {encoding: 'utf-8'});
    return true;
  } catch {
    return false;
  }
}

function isPortInUse(port: number): boolean {
  try {
    const result = execSync(
      `docker ps -a --filter "publish=${port}" --format "{{.Names}}"`,
      {encoding: 'utf-8'}
    );
    return result.trim().length > 0;
  } catch {
    return false;
  }
}

function removeContainer(containerName: string): void {
  try {
    execSync(`docker rm -f ${containerName} 2>/dev/null`, {encoding: 'utf-8'});
    console.log(`🗑️ Removed container '${containerName}'`);
  } catch {
    // Container doesn't exist or couldn't be removed
  }
}

export async function ensureDockerPostgres(): Promise<void> {
  const config = getConfig();

  if (isContainerRunning(config.containerName)) {
    console.log(`🐘 Docker postgres container '${config.containerName}' already running`);
    return;
  }

  // If container exists but not running, remove it to avoid port conflicts
  if (containerExists(config.containerName)) {
    console.log(`🐘 Removing stopped container '${config.containerName}'...`);
    removeContainer(config.containerName);
  }

  // Check if port is still in use by something else
  if (isPortInUse(config.port)) {
    throw new Error(
      `Port ${config.port} is already in use. ` +
      `Check for other containers or processes using this port.`
    );
  }

  console.log(`🐘 Creating new postgres container '${config.containerName}'...`);

  return new Promise((resolve, reject) => {
    const args = [
      'run',
      '-d',
      '--name',
      config.containerName,
      '-p',
      `${config.port}:5432`,
      '-e',
      `POSTGRES_PASSWORD=${config.password}`,
      '-e',
      `POSTGRES_DB=${config.database}`,
      config.image,
    ];

    const proc = spawn('docker', args, {stdio: ['ignore', 'pipe', 'pipe']});

    let stdout = '';
    let stderr = '';

    proc.stdout?.on('data', (data: Buffer) => {
      stdout += data.toString();
    });

    proc.stderr?.on('data', (data: Buffer) => {
      stderr += data.toString();
    });

    proc.on('close', (code) => {
      if (code === 0) {
        console.log(`✅ Container created: ${stdout.trim().substring(0, 12)}`);
        resolve();
      } else {
        reject(new Error(`Failed to create container: ${stderr}`));
      }
    });

    proc.on('error', (error) => {
      reject(new Error(`Failed to spawn docker: ${error.message}`));
    });
  });
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function waitForReady(maxWaitMs: number = 30000): Promise<void> {
  const config = getConfig();
  const startTime = Date.now();

  console.log('🔄 Waiting for postgres to be ready...');

  while (Date.now() - startTime < maxWaitMs) {
    try {
      execSync(
        `docker exec ${config.containerName} pg_isready -U postgres -d ${config.database}`,
        {encoding: 'utf-8', stdio: 'pipe'}
      );
      console.log('✅ Postgres is ready');
      return;
    } catch {
      await sleep(500);
    }
  }

  throw new Error(`Postgres not ready after ${maxWaitMs}ms`);
}

export async function stopDockerPostgres(): Promise<void> {
  const config = getConfig();

  if (!isContainerRunning(config.containerName)) {
    console.log(`🐘 Container '${config.containerName}' not running`);
    return;
  }

  console.log(`🐘 Stopping container '${config.containerName}'...`);
  execSync(`docker stop ${config.containerName}`, {encoding: 'utf-8'});
  console.log('✅ Container stopped');
}

export function isDockerPostgresRunning(): boolean {
  const config = getConfig();
  return isContainerRunning(config.containerName);
}
