const { spawn } = require('child_process');

console.log('Starting EasyMove Man and Van Service...');

// Start the basic server directly
const server = spawn('node', ['server/basic-server.js'], {
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