import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import { webcrypto } from 'node:crypto';
import { createTestServer } from '../scripts/wechat-oauth-test.mjs';

test('page authorization URL uses server state and completes callback exchange', async t => {
  const context = await setup(t, async url => ({ok:true, json:async () => url.pathname.endsWith('access_token')
    ? {openid:'open-1', access_token:'private-token'}
    : {openid:'open-1', nickname:'测试用户'}}));
  const elements = new Map();
  const element = id => {
    if (!elements.has(id)) elements.set(id, {value:'', dataset:{}, handlers:{}, addEventListener(name, fn) {this.handlers[name] = fn;}, append() {}});
    return elements.get(id);
  };
  const stored = new Map();
  const html = await readFile(new URL('../public/wechat-oauth-test.html', import.meta.url), 'utf8');
  vm.runInNewContext(html.match(/<script>([\s\S]*?)<\/script>/)[1], {
    document:{getElementById:element, createElement:() => ({})},
    sessionStorage:{getItem:k => stored.get(k), setItem:(k,v) => stored.set(k,v)},
    location:{hostname:'127.0.0.1', port:'8787', protocol:'http:', origin:context.origin, pathname:'/', search:''},
    crypto:webcrypto, URL, URLSearchParams,
    fetch:(path, options = {}) => fetch(context.origin + path, {...options, headers:{...options.headers, Origin:context.origin}}),
  });
  // Wait for the page's asynchronous local configuration load.
  for (let i = 0; i < 100 && element('appid').value !== 'wx_test'; i++) await new Promise(resolve => setTimeout(resolve, 5));
  assert.equal(element('appid').value, 'wx_test');
  await element('config').handlers.submit({preventDefault() {}});
  const auth = new URL(element('authurl').value);
  const record = JSON.parse(stored.get('narrativeos.wechat.oauth.test.v1'));
  assert.equal(auth.searchParams.get('state'), record.state);
  element('callback').value = record.redirect + '?code=fresh-code&state=' + auth.searchParams.get('state');
  element('inspect').handlers.click();
  assert.equal(element('result').dataset.kind, 'ok');
  await element('exchange').handlers.click();
  assert.equal(element('exchange-status').dataset.kind, 'ok');
  assert.equal(JSON.parse(element('profile').textContent).profile.nickname, '测试用户');
});

async function setup(t, fetchImpl, credentials = {appid:'wx_test', secret:'private-secret'}) {
  const server = createTestServer({...credentials, fetchImpl});
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  t.after(() => new Promise(resolve => { server.close(resolve); server.closeAllConnections(); }));
  const origin = `http://127.0.0.1:${server.address().port}`;
  const post = async (path, body, headers = {}) => {
    const response = await fetch(origin + path, {method:'POST', headers:{Origin:origin, 'Content-Type':'application/json', ...headers}, body:JSON.stringify(body)});
    return {status:response.status, data:await response.json()};
  };
  const start = async () => (await post('/local/start', {redirect:'https://www.narrativeos.cn/api/auth/wechat/callback'})).data;
  const callback = record => record.redirect + '?code=fresh-code&state=' + record.state;
  return {origin, post, start, callback};
}

test('exchanges code, filters credentials, and consumes state once', async t => {
  const calls = [];
  const context = await setup(t, async url => {
    calls.push(url);
    return {ok:true, json:async () => calls.length === 1
      ? {openid:'open-1', unionid:'union-1', access_token:'access-secret', refresh_token:'refresh-secret', scope:'snsapi_login', expires_in:7200}
      : {openid:'open-1', nickname:'测试用户', headimgurl:'https://example.com/avatar', access_token:'should-be-filtered'}};
  });
  const record = await context.start();
  // Copy/paste can introduce spaces, line breaks, or invisible format characters.
  const pasted = context.callback(record).replace('?code=', '? \n\u200Bcode=').replace('&state=', ' &\n state=');
  const result = await context.post('/local/exchange', {callback:pasted});
  assert.equal(result.status, 200);
  assert.equal(result.data.profile.nickname, '测试用户');
  assert.equal(result.data.identity.unionid, 'union-1');
  assert.equal(calls[0].pathname, '/sns/oauth2/access_token');
  assert.equal(calls[0].searchParams.get('secret'), 'private-secret');
  assert.equal(calls[1].pathname, '/sns/userinfo');
  assert.equal(calls[1].searchParams.get('access_token'), 'access-secret');
  assert.doesNotMatch(JSON.stringify(result.data), /secret|refresh_token|access_token/);
  assert.equal((await context.post('/local/exchange', {callback:context.callback(record)})).status, 400);
  assert.equal(calls.length, 2);
});

test('rejects cross-origin, unknown state, duplicate parameters and wrong callback before contacting WeChat', async t => {
  const context = await setup(t, () => assert.fail('must not call WeChat'));
  assert.equal((await context.post('/local/start', {}, {Origin:'https://evil.example'})).status, 403);
  const record = await context.start();
  for (const callback of [
    context.callback(record).replace(record.state, 'wrong'),
    context.callback(record) + '&code=duplicate',
    context.callback(record).replace('www.narrativeos.cn', 'evil.example'),
  ]) assert.equal((await context.post('/local/exchange', {callback})).status, 400);
  const status = await new Promise((resolve, reject) => {
    http.get(context.origin + '/local/config', {headers:{Host:'evil.example'}}, response => { response.resume(); resolve(response.statusCode); }).on('error', reject);
  });
  assert.equal(status, 403);
});

test('returns actionable WeChat errors without echoing upstream secret content', async t => {
  const context = await setup(t, async () => ({ok:true, json:async () => ({errcode:40163, errmsg:'private-secret'})}));
  const record = await context.start();
  const result = await context.post('/local/exchange', {callback:context.callback(record)});
  assert.equal(result.status, 502);
  assert.match(result.data.error, /40163/);
  assert.doesNotMatch(result.data.error, /private-secret/);
});

test('missing configuration is visible and credentials/files are never served', async t => {
  const context = await setup(t, () => assert.fail('must not call WeChat'), {});
  const config = await (await fetch(context.origin + '/local/config')).json();
  assert.equal(config.ready, false);
  assert.equal((await context.post('/local/start', {})).status, 400);
  assert.equal((await fetch(context.origin + '/.env.wechat-test')).status, 404);
  const page = await fetch(context.origin);
  assert.equal(page.headers.get('cache-control'), 'no-store');
  assert.match(await page.text(), /获取用户资料/);
});
