import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import app from '../artifacts/api-server/src/app.ts';

function startServer() {
  const server = http.createServer(app);
  return new Promise((resolve) => {
    server.listen(0, '127.0.0.1', () => {
      const { port } = server.address();
      resolve({ server, port });
    });
  });
}

test('health endpoints expose liveness and readiness information', async () => {
  const { server, port } = await startServer();
  try {
    const [livez, readyz] = await Promise.all([
      fetch(`http://127.0.0.1:${port}/livez`),
      fetch(`http://127.0.0.1:${port}/readyz`),
    ]);

    assert.equal(livez.status, 200);
    const livezBody = await livez.json();
    assert.equal(livezBody.status, 'ok');

    assert.equal(readyz.status, 200);
    const readyzBody = await readyz.json();
    assert.equal(readyzBody.ready, true);
  } finally {
    await new Promise((resolve, reject) => server.close((err) => (err ? reject(err) : resolve())));
  }
});
