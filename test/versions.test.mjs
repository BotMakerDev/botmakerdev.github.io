import { test } from 'node:test';
import assert from 'node:assert/strict';
import { latestTag } from '../src/lib/versions.mjs';

function stub(status, body) {
  const calls = [];
  const fetch = async (url, init) => {
    calls.push({ url, init });
    return { ok: status === 200, status, json: async () => body };
  };
  return { fetch, calls };
}

test('the latest release gives its tag', async () => {
  const { fetch, calls } = stub(200, { tag_name: 'v1.2.3' });
  assert.equal(await latestTag('botmaker-studio', { fetch }), 'v1.2.3');
  assert.equal(calls[0].url, 'https://api.github.com/repos/BotMakerDev/botmaker-studio/releases/latest');
});

test('no release fails', async () => {
  const { fetch } = stub(404, { message: 'Not Found' });
  await assert.rejects(latestTag('botmaker-catalog', { fetch }), /no latest release for BotMakerDev\/botmaker-catalog/);
});

test('an empty tag fails', async () => {
  const { fetch } = stub(200, { tag_name: '' });
  await assert.rejects(latestTag('botmaker-studio', { fetch }), /no latest release/);
});

test('the token is sent only when there is one', async () => {
  const without = stub(200, { tag_name: 'v1' });
  await latestTag('botmaker-studio', { fetch: without.fetch });
  assert.equal(without.calls[0].init.headers.Authorization, undefined);

  const withToken = stub(200, { tag_name: 'v1' });
  await latestTag('botmaker-studio', { fetch: withToken.fetch, token: 't0k' });
  assert.equal(withToken.calls[0].init.headers.Authorization, 'Bearer t0k');
});
