import { test } from 'node:test';
import assert from 'node:assert/strict';
import { latestTag } from '../src/lib/versions.mjs';

function stub(status, location) {
  const calls = [];
  const fetch = async (url, init) => {
    calls.push({ url, init });
    return { status, headers: new Headers(location ? { location } : {}) };
  };
  return { fetch, calls };
}

test('the latest release gives its tag', async () => {
  const { fetch, calls } = stub(302, 'https://github.com/BotMakerDev/botmaker-studio/releases/tag/v1.2.3');
  assert.equal(await latestTag('botmaker-studio', { fetch }), 'v1.2.3');
  assert.equal(calls[0].url, 'https://github.com/BotMakerDev/botmaker-studio/releases/latest');
  assert.equal(calls[0].init.redirect, 'manual');
});

test('no release redirects to the release list, and fails', async () => {
  const { fetch } = stub(302, 'https://github.com/BotMakerDev/botmaker-catalog/releases');
  await assert.rejects(latestTag('botmaker-catalog', { fetch }), /no latest release for BotMakerDev\/botmaker-catalog/);
});

test('a refusal fails', async () => {
  const { fetch } = stub(429);
  await assert.rejects(latestTag('botmaker-studio', { fetch }), /no latest release.*HTTP 429/);
});
