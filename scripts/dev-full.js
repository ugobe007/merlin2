import { spawn } from 'node:child_process';

const commands = [
  {
    name: 'api',
    command: process.execPath,
    args: ['api/dev-server.js'],
    env: {},
  },
  {
    name: 'web',
    command: process.platform === 'win32' ? 'npm.cmd' : 'npm',
    args: ['run', 'dev', '--', '--host', '127.0.0.1', '--port', '3002', '--strictPort'],
    env: { VITE_EPC_ANALYZE_API_URL: '/api/analyze-site' },
  },
];

const children = commands.map(({ name, command, args, env }) => {
  const child = spawn(command, args, {
    cwd: process.cwd(),
    env: { ...process.env, ...env },
    stdio: ['inherit', 'pipe', 'pipe'],
  });

  child.stdout.on('data', (data) => process.stdout.write(`[${name}] ${data}`));
  child.stderr.on('data', (data) => process.stderr.write(`[${name}] ${data}`));

  child.on('exit', (code, signal) => {
    if (signal) return;
    if (code && code !== 0) {
      console.error(`[${name}] exited with code ${code}`);
      shutdown(code);
    }
  });

  return child;
});

function shutdown(code = 0) {
  for (const child of children) {
    if (!child.killed) child.kill('SIGTERM');
  }
  setTimeout(() => process.exit(code), 250);
}

process.on('SIGINT', () => shutdown(0));
process.on('SIGTERM', () => shutdown(0));
