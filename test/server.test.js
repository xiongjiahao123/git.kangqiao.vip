const assert = require('assert');
const { createServer, jobs } = require('../src/server');

function request(baseUrl, path, options = {}) {
  return fetch(`${baseUrl}${path}`, {
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options
  }).then(async response => ({
    status: response.status,
    body: await response.json()
  }));
}

function requestText(baseUrl, path) {
  return fetch(`${baseUrl}${path}`).then(async response => ({
    status: response.status,
    body: await response.text()
  }));
}

(async () => {
  jobs.clear();
  const server = createServer();
  await new Promise(resolve => server.listen(0, resolve));
  const { port } = server.address();
  const baseUrl = `http://127.0.0.1:${port}`;

  try {
    const home = await requestText(baseUrl, '/');
    assert.strictEqual(home.status, 200);
    assert.ok(home.body.includes('康桥数智'));

    const health = await request(baseUrl, '/health');
    assert.strictEqual(health.status, 200);
    assert.strictEqual(health.body.status, 'ok');

    const created = await request(baseUrl, '/api/jobs', {
      method: 'POST',
      body: JSON.stringify({
        keyword: '基层医疗 AI',
        topic: 'AI 医疗科普图文',
        channel: 'wechat',
        owner: 'content-team'
      })
    });
    assert.strictEqual(created.status, 201);
    assert.strictEqual(created.body.keyword, '基层医疗 AI');
    assert.strictEqual(created.body.status, 'queued');
    assert.ok(created.body.generated.imagePrompt.includes('基层医疗 AI'));

    const listed = await request(baseUrl, '/api/jobs');
    assert.strictEqual(listed.status, 200);
    assert.strictEqual(listed.body.data.length, 1);

    const metrics = await request(baseUrl, '/api/metrics');
    assert.strictEqual(metrics.status, 200);
    assert.strictEqual(metrics.body.totalJobs, 1);
    assert.strictEqual(metrics.body.byChannel.wechat, 1);

    const failed = await request(baseUrl, `/api/jobs/${created.body.id}/fail`, {
      method: 'POST',
      body: JSON.stringify({ reason: 'manual test failure' })
    });
    assert.strictEqual(failed.status, 200);
    assert.strictEqual(failed.body.status, 'failed');
    assert.strictEqual(failed.body.error, 'manual test failure');

    console.log('All tests passed');
  } finally {
    server.close();
  }
})().catch(error => {
  console.error(error);
  process.exit(1);
});
