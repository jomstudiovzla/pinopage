import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { app } = require('../../functions/index.js');

let server;
let baseUrl;

before(async () => {
  await new Promise((resolve) => {
    server = createServer(app);
    server.listen(0, '127.0.0.1', () => {
      const port = server.address().port;
      baseUrl = `http://127.0.0.1:${port}`;
      resolve();
    });
  });
});

after(() => {
  if (server) server.close();
});

test('API Health responds 200 with status ok', async () => {
  const res = await fetch(`${baseUrl}/api/health`);
  assert.equal(res.status, 200);
  const data = await res.json();
  assert.equal(data.status, 'ok');
  assert.equal(data.service, 'pino-api');
  assert.equal(data.region, 'europe-west1');
});

test('API Coupons validate blocks anonymous requests with 401', async () => {
  const res = await fetch(`${baseUrl}/api/coupons/validate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ couponCode: 'TEST' })
  });
  assert.equal(res.status, 401);
  const data = await res.json();
  assert.equal(data.error, 'unauthorized');
});

test('API Admin role endpoint blocks anonymous requests with 401', async () => {
  const res = await fetch(`${baseUrl}/api/admin/users/test/role`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ role: 'admin' })
  });
  assert.equal(res.status, 401);
  const data = await res.json();
  assert.equal(data.error, 'unauthorized');
});

test('API Tax calculate computes 50% SAP tax credit and TVA correctly', async () => {
  const res = await fetch(`${baseUrl}/api/tax/calculate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ montantHT: 200, beneficieSAP: true })
  });
  assert.equal(res.status, 200);
  const data = await res.json();
  assert.equal(data.montantHT, 200);
  assert.equal(data.creditImpot50, 100);
  assert.equal(data.resteACharge, 100);
  assert.match(data.dispositif, /Avance Immédiate URSSAF/);
});

test('API Tax calculate caps SAP tax credit at 2500 EUR ceiling', async () => {
  const res = await fetch(`${baseUrl}/api/tax/calculate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ montantHT: 6000, beneficieSAP: true })
  });
  assert.equal(res.status, 200);
  const data = await res.json();
  assert.equal(data.creditImpot50, 2500);
  assert.equal(data.resteACharge, 3500);
});

test('API Auth logout returns 200', async () => {
  const res = await fetch(`${baseUrl}/api/auth/logout`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  });
  assert.equal(res.status, 200);
  const data = await res.json();
  assert.equal(data.success, true);
});

test('API Quotes create validates required parameters', async () => {
  const res = await fetch(`${baseUrl}/api/quotes/create`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({})
  });
  assert.equal(res.status, 400);
});
