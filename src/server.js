const http = require('http');
const { randomUUID } = require('crypto');

const PORT = Number(process.env.PORT || 3000);
const STATUS_FLOW = ['queued', 'generating', 'reviewing', 'published'];
const jobs = new Map();

function sendJson(res, statusCode, payload) {
  const body = JSON.stringify(payload, null, 2);
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(body)
  });
  res.end(body);
}

function parseBody(req) {
  return new Promise((resolve, reject) => {
    let raw = '';
    req.on('data', chunk => {
      raw += chunk;
      if (raw.length > 1024 * 1024) {
        reject(new Error('Request body is too large'));
        req.destroy();
      }
    });
    req.on('end', () => {
      if (!raw) {
        resolve({});
        return;
      }
      try {
        resolve(JSON.parse(raw));
      } catch (error) {
        reject(new Error('Invalid JSON body'));
      }
    });
    req.on('error', reject);
  });
}

function publicJob(job) {
  return {
    id: job.id,
    keyword: job.keyword,
    topic: job.topic,
    channel: job.channel,
    owner: job.owner,
    status: job.status,
    progress: job.progress,
    generated: job.generated,
    error: job.error,
    createdAt: job.createdAt,
    updatedAt: job.updatedAt,
    finishedAt: job.finishedAt
  };
}

function createGenerationPreview({ keyword, topic, channel }) {
  return {
    title: `${keyword} | GEO 图文生成监测`,
    summary: `围绕“${topic}”生成面向 ${channel} 渠道的图文内容草案。`,
    imagePrompt: `Editorial illustration about ${keyword}, clean composition, trustworthy healthcare media style`,
    geoChecklist: [
      '核心关键词出现在标题和摘要中',
      '内容结构便于生成式搜索引擎引用',
      '图片提示词与主题保持一致',
      '监测任务保留完整状态轨迹'
    ]
  };
}

function scheduleJob(job) {
  STATUS_FLOW.slice(1).forEach((status, index) => {
    setTimeout(() => {
      if (!jobs.has(job.id) || job.status === 'failed') return;
      job.status = status;
      job.progress = Math.round(((index + 2) / STATUS_FLOW.length) * 100);
      job.updatedAt = new Date().toISOString();
      if (status === 'published') job.finishedAt = job.updatedAt;
    }, (index + 1) * 500);
  });
}

function validateJobInput(input) {
  const required = ['keyword', 'topic'];
  const missing = required.filter(field => !input[field] || typeof input[field] !== 'string');
  if (missing.length > 0) {
    return `Missing required field(s): ${missing.join(', ')}`;
  }
  return null;
}

function getMetrics() {
  const allJobs = Array.from(jobs.values());
  const completed = allJobs.filter(job => job.status === 'published');
  const failed = allJobs.filter(job => job.status === 'failed');
  const durations = completed
    .filter(job => job.finishedAt)
    .map(job => new Date(job.finishedAt) - new Date(job.createdAt));
  const avgDurationMs = durations.length
    ? Math.round(durations.reduce((sum, value) => sum + value, 0) / durations.length)
    : 0;

  return {
    totalJobs: allJobs.length,
    activeJobs: allJobs.filter(job => !['published', 'failed'].includes(job.status)).length,
    publishedJobs: completed.length,
    failedJobs: failed.length,
    successRate: allJobs.length ? Number((completed.length / allJobs.length).toFixed(2)) : 0,
    failureRate: allJobs.length ? Number((failed.length / allJobs.length).toFixed(2)) : 0,
    averageDurationMs: avgDurationMs,
    byChannel: allJobs.reduce((acc, job) => {
      acc[job.channel] = (acc[job.channel] || 0) + 1;
      return acc;
    }, {})
  };
}

async function handleRequest(req, res) {
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const path = url.pathname;

  if (req.method === 'GET' && path === '/health') {
    sendJson(res, 200, { status: 'ok', service: 'geo-monitor-backend', timestamp: new Date().toISOString() });
    return;
  }

  if (req.method === 'GET' && path === '/api/metrics') {
    sendJson(res, 200, getMetrics());
    return;
  }

  if (req.method === 'GET' && path === '/api/jobs') {
    const status = url.searchParams.get('status');
    const data = Array.from(jobs.values())
      .filter(job => !status || job.status === status)
      .map(publicJob);
    sendJson(res, 200, { data });
    return;
  }

  if (req.method === 'POST' && path === '/api/jobs') {
    try {
      const input = await parseBody(req);
      const validationError = validateJobInput(input);
      if (validationError) {
        sendJson(res, 400, { error: validationError });
        return;
      }

      const now = new Date().toISOString();
      const job = {
        id: randomUUID(),
        keyword: input.keyword.trim(),
        topic: input.topic.trim(),
        channel: input.channel || 'wechat',
        owner: input.owner || 'unassigned',
        status: 'queued',
        progress: 25,
        generated: createGenerationPreview(input),
        error: null,
        createdAt: now,
        updatedAt: now,
        finishedAt: null
      };
      jobs.set(job.id, job);
      scheduleJob(job);
      sendJson(res, 201, publicJob(job));
    } catch (error) {
      sendJson(res, 400, { error: error.message });
    }
    return;
  }

  const jobMatch = path.match(/^\/api\/jobs\/([^/]+)(?:\/fail)?$/);
  if (jobMatch) {
    const job = jobs.get(jobMatch[1]);
    if (!job) {
      sendJson(res, 404, { error: 'Job not found' });
      return;
    }

    if (req.method === 'GET' && !path.endsWith('/fail')) {
      sendJson(res, 200, publicJob(job));
      return;
    }

    if (req.method === 'POST' && path.endsWith('/fail')) {
      const input = await parseBody(req).catch(() => ({}));
      job.status = 'failed';
      job.progress = 100;
      job.error = input.reason || 'Manual failure mark';
      job.updatedAt = new Date().toISOString();
      job.finishedAt = job.updatedAt;
      sendJson(res, 200, publicJob(job));
      return;
    }
  }

  sendJson(res, 404, { error: 'Route not found' });
}

function createServer() {
  return http.createServer((req, res) => {
    handleRequest(req, res).catch(error => {
      sendJson(res, 500, { error: error.message || 'Internal server error' });
    });
  });
}

if (require.main === module) {
  createServer().listen(PORT, () => {
    console.log(`GEO monitor backend listening on http://localhost:${PORT}`);
  });
}

module.exports = { createServer, jobs, getMetrics };
