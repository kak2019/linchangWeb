const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ts = require("typescript");

function setup(handler) {
  const calls = [];
  const storage = new Map();
  const events = [];
  const listeners = new Map();
  const context = {
    exports: {}, Headers, Event,
    window: {
      localStorage: { getItem: key => storage.get(key), setItem: (key, value) => storage.set(key, value), removeItem: key => storage.delete(key) },
      addEventListener: (name, handler) => listeners.set(name, [...(listeners.get(name) || []), handler]),
      dispatchEvent: event => { events.push(event.type); for (const handler of listeners.get(event.type) || []) handler(event); },
    },
    fetch: async (url, init) => { calls.push({ url, init }); return handler(url, init); },
  };
  const source = fs.readFileSync(path.join(__dirname, "../packages/narrativeos-ui/client.ts"), "utf8");
  vm.runInNewContext(ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText, context);
  const api = context.exports;
  const client = api.createAccountClient({ apiUrl: route => `/narrativeos/api/forge${route}`, logoutUrl: () => "/api/auth/logout" });
  return { api, client, calls, storage, events, context };
}

const json = (body, status = 200) => new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
const ssoUser = { id: "test-user", nickname: "测试", email: "test@example.com", providers: ["email"], avatar_url: null, auth_type: "sso" };

test("the account client preserves each app's API prefix, cookies and invitation header", async () => {
  const { api, client, calls } = setup(() => json(ssoUser));
  api.setStoredInviteCode(" 邀请 test ");
  const user = await client.getCurrentUser();
  assert.equal(user.id, ssoUser.id);
  assert.equal(calls[0].url, "/narrativeos/api/forge/auth/me");
  assert.equal(calls[0].init.credentials, "include");
  assert.equal(calls[0].init.cache, "no-store");
  assert.equal(calls[0].init.headers[api.inviteHeaderName], encodeURIComponent("邀请 test"));
  const headers = api.jsonAuthHeaders({ "X-Action": "1" });
  assert.equal(headers.get("Content-Type"), "application/json");
  assert.equal(headers.get("X-Action"), "1");
  assert.equal(headers.get(api.inviteHeaderName), encodeURIComponent("邀请 test"));
});

test("only adapters configured for portal fallback read the portal session", async () => {
  const { api, client, calls } = setup(url => url === "/api/auth/me" ? json({ ...ssoUser, avatarUrl: "/avatar.png" }) : json({}, 503));
  assert.equal(await client.getCurrentUser(), null);
  assert.equal(calls.length, 1);
  const portal = api.createAccountClient({ apiUrl: route => `/api/workbench-account${route}`, logoutUrl: () => "/api/auth/logout", portalSessionUrl: "/api/auth/me" });
  const user = await portal.getCurrentUser();
  assert.equal(user.avatar_url, "/avatar.png");
  assert.equal(user.auth_type, "sso");
  assert.equal(calls.at(-1).url, "/api/auth/me");
});

test("a valid workbench identity does not also fetch the portal session", async () => {
  const { api, calls } = setup(() => json({ ...ssoUser, auth_type: "invite" }));
  const client = api.createAccountClient({ apiUrl: p => p, logoutUrl: () => "/logout", portalSessionUrl: "/api/auth/me" });
  assert.equal((await client.getCurrentUser()).auth_type, "invite");
  assert.equal(calls.length, 1);
});

test("balance and subscription requests both carry invitation credentials", async () => {
  const { api, client, calls } = setup(url => json(url.endsWith("/subscription") ? { subscription: { name: "Pro" } } : { available: 10, reserved: 2 }));
  api.setStoredInviteCode("abc");
  assert.equal((await client.getCreditBalance()).available, 10);
  assert.equal(await client.getSubscription(), "Pro");
  assert(calls.every(call => call.init.headers[api.inviteHeaderName] === "abc"));
});

test("failed balance requests stay retryable and failed permissions never grant admin", async () => {
  const { client } = setup(() => json({}, 403));
  assert.equal(await client.getCreditBalance(), null);
  assert.equal(await client.isAdmin(), false);
  await assert.rejects(client.getSubscription());
});

test("administrator access requires a successful backend response", async () => {
  const { client, calls } = setup(() => json({ allowed: true }));
  assert.equal(await client.isAdmin(), true);
  assert(calls[0].url.endsWith("/admin/me"));
});

test("failed SSO logout preserves the invitation and does not signal sign-out", async () => {
  const { api, client, storage, events } = setup(() => json({}, 500));
  api.setStoredInviteCode("keep-me");
  await assert.rejects(client.logout(ssoUser));
  assert.equal(storage.get(api.inviteStorageKey), "keep-me");
  assert.equal(events.length, 0);
});

test("successful SSO logout clears the invitation and broadcasts the session change", async () => {
  const { api, client, calls, storage, events } = setup(() => json({ ok: true }));
  api.setStoredInviteCode("clear-me");
  await client.logout(ssoUser);
  assert.equal(calls[0].url, "/api/auth/logout");
  assert.equal(calls[0].init.method, "POST");
  assert.equal(calls[0].init.credentials, "include");
  assert.equal(storage.size, 0);
  assert.deepEqual(events, [api.authChangedEvent]);
});

test("invitation logout does not call the portal's logout API", async () => {
  const { api, client, calls, events } = setup(() => { throw Error("unexpected request"); });
  api.setStoredInviteCode("invite-only");
  await client.logout({ ...ssoUser, auth_type: "invite" });
  assert.equal(calls.length, 0);
  assert.equal(api.getStoredInviteCode(), "");
  assert.deepEqual(events, [api.authChangedEvent]);
});

test("network failures produce a signed-out session instead of unhandled rejection", async () => {
  const { api, client } = setup(() => { throw Error("offline"); });
  assert.equal(await api.getPortalSession(), null);
  assert.equal(await client.getCurrentUser(), null);
  assert.equal(await client.isAdmin(), false);
});

test('components and page transitions share one identity request until authentication changes', async () => {
  const { api, client, calls, context } = setup(() => json(ssoUser));
  await Promise.all([client.getCurrentUser(), client.getCurrentUser(), client.getCurrentUser()]);
  await client.getCurrentUser();
  assert.equal(calls.length, 1);
  context.window.dispatchEvent(new Event(api.authChangedEvent));
  await Promise.all([client.getCurrentUser(), client.getCurrentUser()]);
  assert.equal(calls.length, 2);
});

test('portal menu and portal provider use the same direct identity source without proxying Forge', async () => {
  const { api, calls } = setup(() => json({ ...ssoUser, avatarUrl: '/avatar.png' }));
  const client = api.createAccountClient({ apiUrl: p => `/proxy${p}`, logoutUrl: () => '/logout', sessionUrl: '/api/auth/me' });
  const [raw, normalized] = await Promise.all([api.getPortalSession(), client.getCurrentUser()]);
  assert.equal(raw.id, normalized.id);
  assert.equal(normalized.avatar_url, '/avatar.png');
  assert.equal(calls.length, 1);
  assert.equal(calls[0].url, '/api/auth/me');
});

test('old in-flight identity cannot restore the previous account after a session change', async () => {
  let finish;
  const { api, client, context } = setup(() => new Promise(resolve => { finish = resolve; }));
  const old = client.getCurrentUser();
  const finishOld = finish;
  context.window.dispatchEvent(new Event(api.authChangedEvent));
  const current = client.getCurrentUser();
  finish(json({ ...ssoUser, id: 'new-user' }));
  assert.equal((await current).id, 'new-user');
  finishOld(json(ssoUser));
  assert.equal((await old).id, 'new-user');
});

test('SSR requests never share browser identity state', async () => {
  const { client, calls, context } = setup(() => json(ssoUser));
  delete context.window;
  await client.getCurrentUser(); await client.getCurrentUser();
  assert.equal(calls.length, 2);
});

test('an explicit invitation still resolves through Forge when the portal is signed out', async () => {
  const { api, calls } = setup(url => url === '/api/auth/me' ? json({}, 401) : json({ ...ssoUser, auth_type: 'invite' }));
  api.setStoredInviteCode('invite');
  const client = api.createAccountClient({ apiUrl: p => `/proxy${p}`, sessionUrl: '/api/auth/me', logoutUrl: () => '/logout' });
  assert.equal((await client.getCurrentUser()).auth_type, 'invite');
  assert.equal(calls.length, 2);
  assert.equal(calls[1].url, '/proxy/auth/me');
});
