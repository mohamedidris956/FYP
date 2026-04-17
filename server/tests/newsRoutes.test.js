const test = require('node:test');
const assert = require('node:assert/strict');
const express = require('express');
const Module = require('node:module');

function loadRouterWithMocks() {
  const originalLoad = Module._load;

  const modelStub = {
    find: () => ({ sort: () => ({ lean: async () => [] }) }),
    findOne: async () => null,
    create: async (payload) => ({ _id: 'article-1', ...payload }),
    findByIdAndUpdate: async (id, payload) => ({ _id: id, ...payload }),
    findByIdAndDelete: async () => ({ _id: 'article-1' })
  };

  Module._load = function patched(request, parent, isMain) {
    if (request === '../models/NewsArticle') {
      return modelStub;
    }

    if (request === '../middleware/authMiddleware') {
      return {
        protect: (req, _res, next) => {
          req.user = { _id: 'user-1', role: 'admin' };
          next();
        },
        admin: (_req, _res, next) => next()
      };
    }

    return originalLoad.call(this, request, parent, isMain);
  };

  const routePath = require.resolve('../routes/newsRoutes');
  delete require.cache[routePath];
  const router = require('../routes/newsRoutes');

  Module._load = originalLoad;
  return router;
}

async function createServer() {
  const app = express();
  app.use(express.json());
  app.use('/', loadRouterWithMocks());

  const server = await new Promise((resolve) => {
    const s = app.listen(0, () => resolve(s));
  });

  const { port } = server.address();
  return {
    server,
    baseUrl: `http://127.0.0.1:${port}`
  };
}

test('POST /admin creates article without runtime reference errors', async () => {
  const { server, baseUrl } = await createServer();

  try {
    const res = await fetch(`${baseUrl}/admin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: 'Match Day Recap',
        summary: 'A full summary of the latest first team game.',
        body: 'This is a detailed match report with enough characters for validation to pass.',
        category: 'match',
        image: 'assets/img/news/news1.jpg'
      })
    });

    const data = await res.json();
    assert.equal(res.status, 201);
    assert.equal(data.title, 'Match Day Recap');
    assert.equal(data.slug, 'match-day-recap');
  } finally {
    server.close();
  }
});

test('PUT /admin/:id updates article without runtime reference errors', async () => {
  const { server, baseUrl } = await createServer();

  try {
    const res = await fetch(`${baseUrl}/admin/article-1`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: 'Updated Match Report',
        summary: 'Updated summary for this article in admin mode.',
        body: 'This updated article body is long enough to satisfy normalized validation rules.',
        category: 'club',
        image: 'assets/img/news/news2.jpg'
      })
    });

    const data = await res.json();
    assert.equal(res.status, 200);
    assert.equal(data._id, 'article-1');
    assert.equal(data.slug, 'updated-match-report');
  } finally {
    server.close();
  }
});