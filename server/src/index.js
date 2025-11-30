import dotenv from 'dotenv';
dotenv.config();

import http from 'http';
import app from './app.js';

let port = Number(process.env.PORT) || 4000;

const server = http.createServer(app);

const start = () => {
  server.listen(port, () => {
    console.log(`Server listening on http://localhost:${port}`);
  });
};

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    const next = port + 1;
    console.warn(`Port ${port} in use, retrying on ${next}...`);
    port = next;
    setTimeout(start, 300);
  } else {
    console.error('Server error:', err);
    process.exit(1);
  }
});

start();
