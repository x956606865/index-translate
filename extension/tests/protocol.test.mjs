import assert from 'node:assert/strict';
import test from 'node:test';
import { endpoint } from '../protocol.js';

test('accepts LAN pairing addresses and preserves loopback connections', () => {
  for (const host of ['192.168.1.20', '10.0.0.20', '172.16.0.20', '172.31.255.254', '127.0.0.1', 'localhost']) {
    assert.equal(endpoint(`http://${host}:8098/`), `http://${host}:8098`);
  }
});

test('rejects addresses outside the service boundary', () => {
  for (const address of [
    'http://172.15.0.20:8098',
    'http://172.32.0.20:8098',
    'http://192.168.1.20.example.com:8098',
    'http://user:password@192.168.1.20:8098',
    'http://192.168.1.20:8098/v1',
  ]) {
    assert.throws(() => endpoint(address));
  }
});
