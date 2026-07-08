import app from './app.js';
import { config } from './config/index.js';

const server = app.listen(config.port, () => {
  console.log(`API Gateway running on http://localhost:${config.port} [${config.nodeEnv}]`);
});

function gracefulShutdown() {
  console.log('\nShutting down gracefully...');
  server.close(() => {
    console.log('Gateway closed');
    process.exit(0);
  });
}

process.on('SIGINT', gracefulShutdown);
process.on('SIGTERM', gracefulShutdown);
