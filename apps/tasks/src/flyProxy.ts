import {spawn, ChildProcess, execSync} from 'child_process';

interface FlyProxyConfig {
  port: number;
  appName: string;
  enabled: boolean;
}

let proxyProcess: ChildProcess | null = null;
let isRunning = false;

function getConfig(): FlyProxyConfig {
  return {
    port: parseInt(process.env.FLY_PROXY_PORT || '5432', 10),
    appName: process.env.FLY_PROXY_APP || 'stashl-db',
    enabled: process.env.FLY_PROXY_DISABLED !== 'true',
  };
}

function isPortInUse(port: number): boolean {
  try {
    const result = execSync(`lsof -ti:${port} 2>/dev/null`, {encoding: 'utf-8'});
    return result.trim().length > 0;
  } catch {
    return false;
  }
}

function killProcessOnPort(port: number): void {
  try {
    execSync(`lsof -ti:${port} | xargs kill -9 2>/dev/null`, {encoding: 'utf-8'});
    console.log(`🔌 Killed existing process on port ${port}`);
  } catch {
    // No process to kill or kill failed
  }
}

export function isFlyProxyEnabled(): boolean {
  return getConfig().enabled;
}

export function startFlyProxy(): Promise<void> {
  const config = getConfig();

  if (!config.enabled) {
    console.log('🔌 Fly proxy disabled, skipping...');
    return Promise.resolve();
  }

  return new Promise((resolve, reject) => {
    if (isRunning && proxyProcess) {
      console.log('🔌 Fly proxy already running');
      resolve();
      return;
    }

    // Check for and kill any orphaned process on the port
    if (isPortInUse(config.port)) {
      console.log(`🔌 Port ${config.port} in use, killing existing process...`);
      killProcessOnPort(config.port);
    }

    console.log(`🔌 Starting fly proxy on port ${config.port} for app ${config.appName}...`);

    proxyProcess = spawn('fly', ['proxy', String(config.port), '-a', config.appName], {
      stdio: ['ignore', 'pipe', 'pipe'],
      detached: false,
    });

    let started = false;
    const startTimeout = setTimeout(() => {
      if (!started) {
        started = true;
        isRunning = true;
        console.log('✅ Fly proxy started (timeout assumed success)');
        resolve();
      }
    }, 3000);

    proxyProcess.stdout?.on('data', (data: Buffer) => {
      const output = data.toString();
      console.log(`[fly-proxy] ${output.trim()}`);

      if (!started && (output.includes('Proxying') || output.includes('local'))) {
        started = true;
        isRunning = true;
        clearTimeout(startTimeout);
        console.log('✅ Fly proxy started');
        resolve();
      }
    });

    proxyProcess.stderr?.on('data', (data: Buffer) => {
      console.error(`[fly-proxy error] ${data.toString().trim()}`);
    });

    proxyProcess.on('error', (error) => {
      isRunning = false;
      clearTimeout(startTimeout);
      if (!started) {
        started = true;
        reject(new Error(`Failed to start fly proxy: ${error.message}`));
      }
    });

    proxyProcess.on('close', (code) => {
      isRunning = false;
      proxyProcess = null;
      console.log(`🔌 Fly proxy exited with code ${code}`);
    });
  });
}

export function stopFlyProxy(): Promise<void> {
  return new Promise((resolve) => {
    if (!proxyProcess) {
      isRunning = false;
      resolve();
      return;
    }

    console.log('🔌 Stopping fly proxy...');
    proxyProcess.once('close', () => {
      isRunning = false;
      proxyProcess = null;
      console.log('✅ Fly proxy stopped');
      resolve();
    });

    proxyProcess.kill('SIGTERM');

    setTimeout(() => {
      if (proxyProcess) {
        proxyProcess.kill('SIGKILL');
      }
      resolve();
    }, 5000);
  });
}

export function isFlyProxyRunning(): boolean {
  return isRunning && proxyProcess !== null;
}

export async function restartFlyProxy(): Promise<void> {
  await stopFlyProxy();
  await new Promise((r) => setTimeout(r, 1000));
  await startFlyProxy();
}
