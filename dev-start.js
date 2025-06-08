const { spawn } = require('child_process');
const path = require('path');

// Start the server using tsx
const server = spawn('npx', ['tsx', 'server/minimal-index.ts'], {
  cwd: process.cwd(),
  stdio: 'inherit',
  env: { ...process.env, NODE_ENV: 'development' }
});

server.on('error', (err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});

server.on('close', (code) => {
  console.log(`Server process exited with code ${code}`);
});

// Handle cleanup
process.on('SIGINT', () => {
  console.log('Shutting down server...');
  server.kill();
  process.exit(0);
});