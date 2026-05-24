'use strict';

const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = parseInt(process.env.PORT, 10) || 8030;
const DATA_FILE = process.env.DATA_FILE || '/var/lib/soapcalc/data.json';
const BIND_ADDRESS = process.env.BIND_ADDRESS || '0.0.0.0';

const APP_ROOT = __dirname;
const INDEX_FILE = path.join(APP_ROOT, 'index.html');
const DATA_EXAMPLE_FILE = path.join(APP_ROOT, 'data.json.example');

const MAX_PUT_BYTES = 5 * 1024 * 1024;

function logInfo(msg) {
  process.stdout.write('[' + new Date().toISOString() + '] ' + msg + '\n');
}

function logError(msg, err) {
  const detail = err && err.stack ? err.stack : (err ? String(err) : '');
  process.stderr.write('[' + new Date().toISOString() + '] ERROR ' + msg + (detail ? ' :: ' + detail : '') + '\n');
}

function ensureDataFile() {
  if (fs.existsSync(DATA_FILE)) return;
  const dir = path.dirname(DATA_FILE);
  fs.mkdirSync(dir, { recursive: true });
  const seed = fs.readFileSync(DATA_EXAMPLE_FILE);
  const tmp = DATA_FILE + '.tmp';
  fs.writeFileSync(tmp, seed);
  fs.renameSync(tmp, DATA_FILE);
  logInfo('initialized new data file at ' + DATA_FILE);
}

// SPEC §10.2: add `batches` and `settings.default_cure_time_days` to existing
// data files that predate the Soap Log feature. Idempotent.
function migrateDataFile() {
  let raw;
  try {
    raw = fs.readFileSync(DATA_FILE, 'utf8');
  } catch (err) {
    logError('migration: failed to read data file', err);
    return;
  }
  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch (err) {
    logError('migration: data file is not valid JSON, skipping', err);
    return;
  }
  if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) {
    logError('migration: data file root is not a JSON object, skipping', null);
    return;
  }
  const changes = [];
  if (!Object.prototype.hasOwnProperty.call(parsed, 'batches') || !Array.isArray(parsed.batches)) {
    parsed.batches = [];
    changes.push('batches');
  }
  if (!parsed.settings || typeof parsed.settings !== 'object') {
    parsed.settings = {};
    changes.push('settings');
  }
  if (!Object.prototype.hasOwnProperty.call(parsed.settings, 'default_cure_time_days')) {
    parsed.settings.default_cure_time_days = 35;
    changes.push('settings.default_cure_time_days');
  }
  if (changes.length === 0) return;
  const tmp = DATA_FILE + '.tmp';
  const serialized = JSON.stringify(parsed, null, 2) + '\n';
  fs.writeFileSync(tmp, serialized);
  fs.renameSync(tmp, DATA_FILE);
  logInfo('migrated data file: added ' + changes.join(', '));
}

function sendJson(res, status, payload) {
  const body = Buffer.from(JSON.stringify(payload));
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': body.length,
    'Cache-Control': 'no-store'
  });
  res.end(body);
}

function sendText(res, status, text, contentType) {
  const body = Buffer.from(text);
  res.writeHead(status, {
    'Content-Type': contentType || 'text/plain; charset=utf-8',
    'Content-Length': body.length,
    'Cache-Control': 'no-store'
  });
  res.end(body);
}

function handleGetIndex(res) {
  fs.readFile(INDEX_FILE, (err, buf) => {
    if (err) {
      logError('failed to read index.html', err);
      sendText(res, 500, 'Internal Server Error');
      return;
    }
    res.writeHead(200, {
      'Content-Type': 'text/html; charset=utf-8',
      'Content-Length': buf.length,
      'Cache-Control': 'no-store'
    });
    res.end(buf);
  });
}

function handleGetData(res) {
  fs.readFile(DATA_FILE, (err, buf) => {
    if (err) {
      logError('failed to read data file', err);
      sendJson(res, 500, { error: 'failed to read data file' });
      return;
    }
    try {
      JSON.parse(buf.toString('utf8'));
    } catch (parseErr) {
      logError('data file is not valid JSON', parseErr);
      sendJson(res, 500, { error: 'data file is corrupt' });
      return;
    }
    res.writeHead(200, {
      'Content-Type': 'application/json; charset=utf-8',
      'Content-Length': buf.length,
      'Cache-Control': 'no-store'
    });
    res.end(buf);
  });
}

const IMMUTABLE_BATCH_FIELDS = ['id', 'date_made', 'source_recipe_id', 'created_at'];

function ingredientsEqual(a, b) {
  if (!Array.isArray(a) || !Array.isArray(b)) return a === b;
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    const ai = a[i] || {};
    const bi = b[i] || {};
    if (ai.name !== bi.name) return false;
    if (ai.weight_g !== bi.weight_g) return false;
  }
  return true;
}

function readStoredBatchesById() {
  let raw;
  try {
    raw = fs.readFileSync(DATA_FILE, 'utf8');
  } catch (err) {
    return null;
  }
  let stored;
  try {
    stored = JSON.parse(raw);
  } catch (err) {
    return null;
  }
  const byId = Object.create(null);
  const list = (stored && Array.isArray(stored.batches)) ? stored.batches : [];
  for (let i = 0; i < list.length; i++) {
    if (list[i] && typeof list[i].id === 'string') byId[list[i].id] = list[i];
  }
  return byId;
}

function batchLabel(batch) {
  if (batch && typeof batch.name === 'string' && batch.name) return "'" + batch.name + "' (" + batch.id + ')';
  return batch && batch.id ? batch.id : '<unknown>';
}

function validateBatchImmutability(parsed) {
  if (!Array.isArray(parsed.batches)) return null; // nothing to validate
  const storedById = readStoredBatchesById();
  if (!storedById) return null; // no prior state to compare against (first write)
  for (let i = 0; i < parsed.batches.length; i++) {
    const incoming = parsed.batches[i];
    if (!incoming || typeof incoming !== 'object') {
      return 'batches[' + i + '] is not an object';
    }
    const stored = storedById[incoming.id];
    if (!stored) continue; // new batch — accepted as-is
    for (let j = 0; j < IMMUTABLE_BATCH_FIELDS.length; j++) {
      const field = IMMUTABLE_BATCH_FIELDS[j];
      if (incoming[field] !== stored[field]) {
        return 'batch ' + batchLabel(stored) + ': immutable field "' + field + '" cannot be changed';
      }
    }
    if (!ingredientsEqual(incoming.ingredients, stored.ingredients)) {
      return 'batch ' + batchLabel(stored) + ': immutable field "ingredients" cannot be changed';
    }
  }
  return null;
}

function handlePutData(req, res) {
  const chunks = [];
  let total = 0;
  let aborted = false;

  req.on('data', (chunk) => {
    if (aborted) return;
    total += chunk.length;
    if (total > MAX_PUT_BYTES) {
      aborted = true;
      sendJson(res, 413, { error: 'payload too large' });
      req.destroy();
      return;
    }
    chunks.push(chunk);
  });

  req.on('end', () => {
    if (aborted) return;
    const raw = Buffer.concat(chunks);
    let parsed;
    try {
      parsed = JSON.parse(raw.toString('utf8'));
    } catch (err) {
      sendJson(res, 400, { error: 'invalid JSON' });
      return;
    }
    if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) {
      sendJson(res, 400, { error: 'expected a JSON object' });
      return;
    }

    // SPEC §10.2: enforce batch immutability. Once a batch is created its
    // id, date_made, ingredients, source_recipe_id, and created_at fields
    // must never change — this is the contract that lets the UI show those
    // fields as read-only after creation. Validate by comparing incoming
    // batches against what's already on disk, matched by id; anything that
    // would mutate an immutable field rejects the entire PUT.
    const immutabilityError = validateBatchImmutability(parsed);
    if (immutabilityError) {
      logInfo('PUT /api/data rejected: ' + immutabilityError);
      sendJson(res, 400, { error: immutabilityError });
      return;
    }

    const tmp = DATA_FILE + '.tmp';
    const serialized = JSON.stringify(parsed, null, 2) + '\n';
    fs.writeFile(tmp, serialized, (writeErr) => {
      if (writeErr) {
        logError('failed to write tmp data file', writeErr);
        sendJson(res, 500, { error: 'failed to write data file' });
        return;
      }
      fs.rename(tmp, DATA_FILE, (renameErr) => {
        if (renameErr) {
          logError('failed to rename tmp data file', renameErr);
          sendJson(res, 500, { error: 'failed to replace data file' });
          return;
        }
        logInfo('PUT /api/data (' + raw.length + ' bytes)');
        sendJson(res, 200, { status: 'ok' });
      });
    });
  });

  req.on('error', (err) => {
    logError('request stream error', err);
  });
}

function handleHealth(res) {
  sendJson(res, 200, { status: 'ok' });
}

const server = http.createServer((req, res) => {
  const parsed = url.parse(req.url);
  const pathname = parsed.pathname;
  const method = req.method;

  if (method === 'GET' && pathname === '/') {
    handleGetIndex(res);
    return;
  }
  if (method === 'GET' && pathname === '/api/data') {
    handleGetData(res);
    return;
  }
  if (method === 'PUT' && pathname === '/api/data') {
    handlePutData(req, res);
    return;
  }
  if (method === 'GET' && pathname === '/health') {
    handleHealth(res);
    return;
  }

  sendText(res, 404, 'Not Found');
});

server.on('error', (err) => {
  logError('server error', err);
  process.exit(1);
});

try {
  ensureDataFile();
  migrateDataFile();
} catch (err) {
  logError('failed to initialize data file', err);
  process.exit(1);
}

server.listen(PORT, BIND_ADDRESS, () => {
  logInfo('soapcalc listening on ' + BIND_ADDRESS + ':' + PORT + ' (data file: ' + DATA_FILE + ')');
});

function shutdown(signal) {
  logInfo('received ' + signal + ', shutting down');
  server.close(() => process.exit(0));
  setTimeout(() => process.exit(0), 2000).unref();
}
process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
