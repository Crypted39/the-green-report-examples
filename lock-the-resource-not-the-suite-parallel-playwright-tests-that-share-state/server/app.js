'use strict';

const http = require('http');

const PORT = Number(process.env.PORT || 4173);

// Two shared mutable resources. One process, no tenancy.
// `settings` is the "single seeded admin account" every real suite has.
// `queue` is the second contended thing - a report queue, a sandbox API,
// a rate-limited third party - used to show overlapping locks.
const blank = () => ({
  owner: 'nobody',
  displayName: 'Acme User',
  email: 'user@acme.test',
  notifications: 'off',
  plan: 'free',
  updatedAt: 0,
});

const records = {
  settings: blank(),
  queue: blank(),
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Deliberate read-modify-write window. Real apps get this from a slow ORM,
// a cache round trip, or a downstream service. 120ms is enough for two
// parallel workers to interleave.
const WRITE_WINDOW_MS = 120;

// Independent pages do real-ish work so the parallel/serial delta is honest.
const WIDGET_RENDER_MS = 600;

function json(res, status, body) {
  const payload = JSON.stringify(body);
  res.writeHead(status, {
    'content-type': 'application/json',
    'content-length': Buffer.byteLength(payload),
    'cache-control': 'no-store',
  });
  res.end(payload);
}

function html(res, body) {
  res.writeHead(200, {
    'content-type': 'text/html; charset=utf-8',
    'cache-control': 'no-store',
  });
  res.end(body);
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (c) => chunks.push(c));
    req.on('end', () => {
      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}'));
      } catch (err) {
        reject(err);
      }
    });
    req.on('error', reject);
  });
}

const PANEL_PAGE = `<!doctype html>
<meta charset="utf-8">
<title>Shared Record</title>
<style>
  body { font: 14px system-ui, sans-serif; margin: 40px; max-width: 640px; }
  label { display: block; margin: 12px 0 4px; font-weight: 600; }
  input, select { padding: 6px 8px; font: inherit; width: 260px; }
  button { padding: 8px 14px; font: inherit; margin-top: 16px; margin-right: 8px; }
  .card { border: 1px solid #ccc; border-radius: 6px; padding: 16px; margin-top: 24px; }
  .badge { font-family: ui-monospace, monospace; font-weight: 700; }
</style>
<h1 id="panel-title">Shared Record</h1>

<label for="owner">Acting as</label>
<input id="owner" value="">

<label for="field">Field</label>
<select id="field">
  <option value="displayName">Display name</option>
  <option value="email">Email</option>
  <option value="notifications">Notifications</option>
  <option value="plan">Plan</option>
</select>

<label for="value">New value</label>
<input id="value" value="">

<button id="save">Save</button>
<button id="refresh">Refresh</button>

<div class="card">
  <div>Last written by: <span id="owner-badge" class="badge">-</span></div>
  <div>Current value: <span id="current-value" class="badge">-</span></div>
  <div>Status: <span id="status">idle</span></div>
</div>

<script>
  const $ = (id) => document.getElementById(id);
  $('panel-title').textContent = 'Shared Record: ' + location.pathname.slice(1);

  function render(data) {
    $('owner-badge').textContent = data.owner;
    $('current-value').textContent = String(data[$('field').value]);
  }

  $('save').addEventListener('click', async () => {
    $('status').textContent = 'saving';
    const res = await fetch('/api' + location.pathname, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        owner: $('owner').value,
        field: $('field').value,
        value: $('value').value,
      }),
    });
    render(await res.json());
    $('status').textContent = 'saved';
  });

  $('refresh').addEventListener('click', async () => {
    $('status').textContent = 'loading';
    const res = await fetch('/api' + location.pathname);
    render(await res.json());
    $('status').textContent = 'loaded';
  });
</script>
`;

function widgetPage(id) {
  return `<!doctype html>
<meta charset="utf-8">
<title>Widget ${id}</title>
<style>body { font: 14px system-ui, sans-serif; margin: 40px; }</style>
<h1 id="widget-title">Widget ${id}</h1>
<p id="widget-body">Widget ${id} rendered independently of account settings.</p>
<ul id="widget-items">
  <li>row-${id}-a</li>
  <li>row-${id}-b</li>
  <li>row-${id}-c</li>
</ul>
`;
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);

  const api = url.pathname.match(/^\/api\/(settings|queue)$/);

  if (api && req.method === 'GET') {
    return json(res, 200, records[api[1]]);
  }

  if (api && req.method === 'POST') {
    const record = records[api[1]];
    const body = await readBody(req);

    // Read.
    const snapshot = { ...record };

    // ...long gap where another worker can slip in...
    await sleep(WRITE_WINDOW_MS);

    // ...then write the whole record back from the stale snapshot.
    // Last writer wins, and stomps whatever landed in between.
    Object.assign(record, snapshot, {
      [body.field]: body.value,
      owner: body.owner,
      updatedAt: Date.now(),
    });

    return json(res, 200, record);
  }

  if (url.pathname === '/api/reset' && req.method === 'POST') {
    records.settings = blank();
    records.queue = blank();
    return json(res, 200, records);
  }

  if (url.pathname === '/settings' || url.pathname === '/queue') {
    return html(res, PANEL_PAGE);
  }

  const widget = url.pathname.match(/^\/widget\/(\d+)$/);
  if (widget) {
    await sleep(WIDGET_RENDER_MS);
    return html(res, widgetPage(widget[1]));
  }

  if (url.pathname === '/health') {
    return json(res, 200, { ok: true });
  }

  res.writeHead(404, { 'content-type': 'text/plain' });
  res.end('not found');
});

server.listen(PORT, () => {
  console.log(`shared-state demo app listening on http://localhost:${PORT}`);
});
