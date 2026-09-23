import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawn } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { DatabaseSync } from 'node:sqlite';

let child;
let base;
let dataDir;
let cookieA = '';
let cookieB = '';
let csrf = '';


function cookieFrom(response) {
  const value = response.headers.get('set-cookie');
  return value ? value.split(';', 1)[0] : '';
}

function mergeCookie(current, next) {
  if (!next) return current;
  const entries = new Map(current.split('; ').filter(Boolean).map(item => { const index = item.indexOf('='); return [item.slice(0, index), item]; }));
  const index = next.indexOf('=');
  entries.set(next.slice(0, index), next);
  return [...entries.values()].join('; ');
}

async function api(path, { method = 'GET', body, cookie = '', csrfHeader = false } = {}) {
  const headers = {};
  if (body !== undefined) headers['content-type'] = 'application/json';
  if (cookie) headers.cookie = cookie;
  if (csrfHeader) headers['x-csrf-token'] = csrf;
  const response = await fetch(`${base}${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  return response;
}

async function json(response) {
  return response.json();
}

before(async () => {
  dataDir = mkdtempSync(join(tmpdir(), 'fattouch-security-'));
  child = spawn(process.execPath, ['server/index.js'], {
    cwd: process.cwd(),
    env: { ...process.env, API_PORT: '0', APP_ORIGINS: 'http://127.0.0.1:5173', DATA_DIR: dataDir },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  let output = '';
  await new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`server startup timeout: ${output}`)), 5000);
    child.stdout.on('data', chunk => {
      output += chunk.toString();
      const match = output.match(/127\.0\.0\.1:(\d+)/);
      if (match) {
        clearTimeout(timer);
        base = `http://127.0.0.1:${match[1]}`;
        resolve();
      }
    });
    child.once('error', reject);
    child.stderr.on('data', chunk => { output += chunk.toString(); });
  });
  const csrfResponse = await api('/api/auth/csrf');
  assert.equal(csrfResponse.status, 200);
  csrf = (await json(csrfResponse)).data.token;
  cookieA = mergeCookie('', cookieFrom(csrfResponse));
  cookieB = cookieA;

  const register = async (prefix) => {
    const response = await api('/api/auth/register', {
      method: 'POST',
      cookie: prefix === 'a' ? cookieA : cookieB,
      body: { name: `Security ${prefix}`, email: `${prefix}-${randomUUID()}@example.com`, password: 'safe-pass-123' },
    });
    assert.equal(response.status, 201);
    const cookie = mergeCookie(prefix === 'a' ? cookieA : cookieB, cookieFrom(response));
    if (prefix === 'a') cookieA = cookie; else cookieB = cookie;
  };
  await register('a');
  await register('b');
});

after(async () => {
  if (child && !child.killed) {
    const exited = new Promise(resolve => child.once('exit', resolve));
    child.kill();
    await Promise.race([exited, new Promise(resolve => setTimeout(resolve, 1000))]);
  }
  if (dataDir) {
    try { rmSync(dataDir, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 }); } catch {}
  }
});

test('protects conversations and CSRF mutations', async () => {
  const unauthenticated = await api('/api/conversations');
  assert.equal(unauthenticated.status, 401);

  const missingCsrf = await api('/api/tasks', {
    method: 'POST', cookie: cookieA, body: { message: 'blocked' }, csrfHeader: false,
  });
  assert.equal(missingCsrf.status, 403);

  const created = await api('/api/tasks', {
    method: 'POST', cookie: cookieA, body: { message: 'owned task' }, csrfHeader: true,
  });
  const createdBody = await created.text();
  assert.equal(created.status, 201, createdBody);
  const task = JSON.parse(createdBody).data;

  const foreign = await api(`/api/tasks/${task.id}`, { cookie: cookieB });
  assert.equal(foreign.status, 404);

  const earlyApproval = await api(`/api/tasks/${task.id}/approval`, {
    method: 'POST', cookie: cookieA, body: { decision: 'approved' }, csrfHeader: true,
  });
  assert.equal(earlyApproval.status, 409);
});

test('protects public listing fields and uploaded files', async () => {
  const created = await api('/api/listings', {
    method: 'POST', cookie: cookieA, csrfHeader: true,
    body: { type: 'service', fields: { profession: 'دهان', contactPhone: '[REDACTED]', description: 'خدمة' } },
  });
  assert.equal(created.status, 201);

  const publicListings = await api('/api/listings?type=service');
  assert.equal(publicListings.status, 200);
  const payload = await json(publicListings);
  assert.equal(JSON.stringify(payload).includes('contactPhone'), false);

  const png = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=';
  const uploaded = await api('/api/uploads', {
    method: 'POST', cookie: cookieA, csrfHeader: true, body: { name: 'pixel.png', dataUrl: png },
  });
  assert.equal(uploaded.status, 201);
  const file = (await json(uploaded)).data;
  const filename = file.url.split('/').pop();

  const foreignDelete = await api(`/api/uploads/${filename}`, { method: 'DELETE', cookie: cookieB, csrfHeader: true });
  assert.equal(foreignDelete.status, 404);
  const ownerDelete = await api(`/api/uploads/${filename}`, { method: 'DELETE', cookie: cookieA, csrfHeader: true });
  assert.equal(ownerDelete.status, 200);
});

test('keeps sponsored campaigns inactive until Whish payment is submitted', async () => {
  const created = await api('/api/listings', {
    method: 'POST', cookie: cookieA, csrfHeader: true,
    body: { type: 'business', fields: { category: 'مؤسسة QA', promotion: 'إعلان ممول يظهر تحت الإجابات', paymentMethod: 'Whish Money', promotionDuration: '7 أيام', maxImpressions: '100 ظهور', description: 'اختبار' } },
  });
  assert.equal(created.status, 201);
  const listing = (await json(created)).data;
  assert.equal(listing.status, 'pending_payment');
  const testDb = new DatabaseSync(join(dataDir, 'fattouch.sqlite'));
  testDb.prepare("UPDATE listings SET status = 'active' WHERE id = ?").run(listing.id);
  const click = await api(`/api/sponsored-ads/${listing.id}/click`, { method: 'POST', cookie: cookieB, csrfHeader: true });
  assert.equal(click.status, 201);
  assert.equal((await json(click)).data.clicked, true);
  const allocated = await api('/api/sponsored-ads-atomic', { cookie: cookieA });
  assert.equal(allocated.status, 200);
  assert.equal((await json(allocated)).data.length, 1);
  const stats = await api(`/api/listings/${listing.id}/ad-stats`, { cookie: cookieA });
  assert.equal(stats.status, 200);
  assert.equal((await json(stats)).data.clicks, 1);
  testDb.close();

  const pending = await api(`/api/listings/${listing.id}/payment`, { cookie: cookieA });
  assert.equal(pending.status, 200);
  assert.equal((await json(pending)).data.status, 'pending_payment');

  const proof = await api('/api/uploads', {
    method: 'POST', cookie: cookieA, csrfHeader: true,
    body: { name: 'whish-proof.png', dataUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=' },
  });
  assert.equal(proof.status, 201);
  const proofFilename = (await json(proof)).data.url.split('/').pop();

  const submitted = await api(`/api/listings/${listing.id}/payment/submit`, {
    method: 'POST', cookie: cookieA, csrfHeader: true, body: { paymentReference: 'WHISH-QA-001', proofFilename },
  });
  assert.equal(submitted.status, 200);
  const submittedData = (await json(submitted)).data;
  assert.equal(submittedData.status, 'payment_submitted');
  assert.equal(submittedData.proofFilename, proofFilename);
  const protectedDelete = await api(`/api/uploads/${proofFilename}`, { method: 'DELETE', cookie: cookieA, csrfHeader: true });
  assert.equal(protectedDelete.status, 409);
  const cancelled = await api(`/api/listings/${listing.id}`, { method: 'DELETE', cookie: cookieA, csrfHeader: true });
  assert.equal(cancelled.status, 200);
  const cancelledPayment = await api(`/api/listings/${listing.id}/payment`, { cookie: cookieA });
  assert.equal((await json(cancelledPayment)).data.status, 'cancelled');

  const notifications = await api('/api/notifications', { cookie: cookieA });
  assert.equal(notifications.status, 200);
  const notificationData = await json(notifications);
  assert.equal(notificationData.data.some(item => item.type === 'payment_submitted'), true);
  const marked = await api('/api/notifications/read', { method: 'POST', cookie: cookieA, csrfHeader: true, body: { id: notificationData.data[0].id } });
  assert.equal(marked.status, 200);
  assert.equal((await json(marked)).data.updated, 1);

  const ads = await api('/api/sponsored-ads', { cookie: cookieB });
  assert.equal((await json(ads)).data.some(item => item.id === listing.id), false);
});

test('does not expose payment audit records to regular users', async () => {
  const response = await api('/api/admin/audit', { cookie: cookieA });
  assert.equal(response.status, 403);
});

test('exposes the source registry without pretending sources were fetched', async () => {
  const response = await api('/api/sources');
  assert.equal(response.status, 200);
  const data = (await json(response)).data;
  assert.ok(data.length >= 3);
  assert.equal(data.every(source => source.url && source.status === 'not_connected'), true);
});
