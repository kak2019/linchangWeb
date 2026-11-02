const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');

function load(file, deps, globals = {}) {
  const context = {exports:{}, require:name => {
    if (Object.hasOwn(deps, name)) return deps[name];
    throw new Error(`Unexpected import ${name}`);
  }, URL, URLSearchParams, Date, Buffer, process, AbortSignal, ...globals};
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(path.join(__dirname, '..', file), 'utf8'), {compilerOptions:{module:ts.ModuleKind.CommonJS, target:ts.ScriptTarget.ES2022, jsx:ts.JsxEmit.ReactJSX, esModuleInterop:true}}).outputText, context);
  return context.exports;
}
const security = load('src/lib/auth/security.ts', {'@/lib/content':{WORKBENCH_URL:'https://www.narrativeos.cn/narrativeos/'}});
const redirects = load('src/lib/auth/redirect.ts', {});
const identity = {openid:'wx-id', unionId:'union', nickname:'微信昵称', avatarUrl:null};
function wechat(db) { return load('src/lib/auth/wechat.ts', {'@/lib/db':{getPrisma:()=>db}, '@/lib/auth/security':security}); }

test('shared redirect policy preserves portal and workbench targets across origins', () => {
  const portal = 'https://portal.example';
  const workbench = 'https://studio.example/narrativeos/';
  for (const [input, expected] of [
    [null, workbench], ['', workbench],
    ['/teacher-ecosystem/?q=语文#works', 'https://portal.example/teacher-ecosystem/?q=%E8%AF%AD%E6%96%87#works'],
    ['https://portal.example/en/teacher-ecosystem/?q=test#works', 'https://portal.example/en/teacher-ecosystem/?q=test#works'],
    ['https://studio.example/narrativeos/history?offset=10', 'https://studio.example/narrativeos/history?offset=10'],
    ['/a/../account', 'https://portal.example/account'],
    ['/\\evil.example', workbench], ['\\\\evil.example', workbench],
    ['//evil.example', workbench], ['https://portal.example.evil.example', workbench],
    ['https://portal.example:444/account', workbench], ['http://portal.example/account', workbench],
    ['https://user:password@portal.example/account', workbench],
    ['https://portal.example@evil.example/account', workbench],
    ['javascript:alert(1)', workbench], ['data:text/html,test', workbench], ['https://[', workbench],
  ]) assert.equal(redirects.safeAuthNext(input, portal, workbench), expected, String(input));
});

test('email completion and WeChat link use the same portal-preserving policy', async () => {
  const portal = 'http://127.0.0.1:3000';
  const workbench = 'http://127.0.0.1:3001/';
  const params = new URLSearchParams({next:portal + '/en/teacher-ecosystem/?q=test'});
  const navigation = [];
  const Form = load('src/components/login-form.tsx', {
    react:{useEffect:()=>{}, useState:initial=>[typeof initial === 'function' ? initial() : initial, ()=>{}]},
    'react/jsx-runtime':require('react/jsx-runtime'),
    'next/navigation':{useSearchParams:()=>params, useRouter:()=>({push:url=>navigation.push(url)})},
    '@/lib/content':{WORKBENCH_URL:workbench},
    '@/lib/auth/redirect':redirects,
    '@/components/i18n-provider':{useI18n:()=>({locale:'en',messages:{ui:{auth:{}}}})},
    '@/components/auth-session':{useAuthSession:()=>({refresh:async()=>{}})},
    '@/lib/i18n':{localizedPath:()=>'/en/',loginPath:()=>'/en/login/'},
    '@/components/wechat-community':{WeChatIcon:()=>null},
    '@/lib/utils':{cn:()=>''},
  }, {window:{location:{origin:portal}},fetch:async()=>new Response('{}')}).default;
  const form = Form();
  await form.props.onSubmit({preventDefault(){}});
  assert.equal(navigation[0], params.get('next'));
  function findWechat(node) {
    if (!node || typeof node !== 'object') return null;
    if (node.type === 'a' && node.props.href.startsWith('/api/auth/wechat/start')) return node;
    for (const child of [node.props?.children].flat(Infinity)) { const found=findWechat(child); if(found)return found; }
    return null;
  }
  const link = findWechat(form);
  assert.ok(link);
  const anchor = {href:link.props.href};
  link.props.onClick({currentTarget:anchor});
  assert.equal(new URL(anchor.href, portal).searchParams.get('next'), navigation[0]);
  params.set('next', '/\\evil.example');
  await form.props.onSubmit({preventDefault(){}});
  link.props.onClick({currentTarget:anchor});
  assert.equal(navigation[1], workbench);
  assert.equal(new URL(anchor.href, portal).searchParams.get('next'), workbench);
});

test('new WeChat user has no invented email/password and one identity', async () => {
  let created;
  const tx = {account:{findUnique:async()=>null}, user:{create:async({data})=>{created=data; return {id:'new-user', ...data};}}};
  const result = await wechat({$transaction:fn=>fn(tx)}).resolveWechatUser(identity, null);
  assert.equal(result.id, 'new-user'); assert.equal(created.email, undefined); assert.equal(created.passwordHash, undefined);
  assert.equal(created.accounts.create.providerAccountId, 'wx-id');
});
test('repeat login returns original user without overwriting customized profile', async () => {
  const user = {id:'old', nickname:'自己设置的昵称'};
  const tx = {account:{findUnique:async()=>({userId:'old', user})}};
  assert.equal(await wechat({$transaction:fn=>fn(tx)}).resolveWechatUser(identity, null), user);
});
test('binding keeps original User.id and adds identity only', async () => {
  let bound;
  const tx = {user:{update:async()=>{}, findUniqueOrThrow:async()=>({id:'email-user'})}, account:{findUnique:async()=>null, findFirst:async()=>null, create:async({data})=>{bound=data;}}};
  const user = await wechat({$transaction:fn=>fn(tx)}).resolveWechatUser(identity, 'email-user');
  assert.equal(user.id, 'email-user'); assert.equal(bound.userId, 'email-user');
});
test('rejects WeChat already owned by another user', async () => {
  const tx = {user:{update:async()=>{}}, account:{findUnique:async()=>({userId:'other', user:{id:'other'}})}};
  await assert.rejects(wechat({$transaction:fn=>fn(tx)}).resolveWechatUser(identity, 'original'), /已绑定其他账号/);
});
test('rejects replacing an existing WeChat binding', async () => {
  const tx = {user:{update:async()=>{}}, account:{findUnique:async()=>null, findFirst:async()=>({id:'existing'})}};
  await assert.rejects(wechat({$transaction:fn=>fn(tx)}).resolveWechatUser(identity, 'original'), /已绑定其他微信/);
});
test('concurrent first-login unique conflict resolves to winning user', async () => {
  const db = {$transaction:async()=>{throw {code:'P2002'};}, account:{findUnique:async()=>({user:{id:'winner'}})}};
  assert.equal((await wechat(db).resolveWechatUser(identity,null)).id, 'winner');
});
test('redirects reject foreign origins and backslash protocol-relative forms', () => {
  for (const target of ['https://evil.example/', '//evil.example', '/\\evil.example', 'javascript:alert(1)']) assert.equal(redirects.safeAuthNext(target, 'https://www.narrativeos.cn', 'https://www.narrativeos.cn/narrativeos/'), 'https://www.narrativeos.cn/narrativeos/');
  assert.equal(redirects.safeAuthNext('/account', 'https://www.narrativeos.cn', 'https://www.narrativeos.cn/narrativeos/'), 'https://www.narrativeos.cn/account');
  assert.throws(()=>security.requireSameOrigin(new Request('https://www.narrativeos.cn/api', {headers:{Origin:'https://evil.example', Host:'www.narrativeos.cn'}})), /来源/);
});
test('OTP consumption scopes purpose/user and atomically rejects replay', async () => {
  let query, claimed = false;
  const db = {verificationCode:{findFirst:async({where})=>{query=where;return {id:'otp', expiresAt:new Date(Date.now()+60000), attempts:0, codeHash:'hash'};}, updateMany:async()=>{if(claimed)return {count:0};claimed=true;return {count:1};}}};
  const otp = load('src/lib/auth/otp.ts', {'@/lib/db':{getPrisma:()=>db}, '@/lib/auth/config':{CODE_MAX_ATTEMPTS:5}, '@/lib/auth/crypto':{hashOtp:(key)=>{assert.equal(key,'bind-email:user:a@b.cn');return 'hash';}, safeEqual:(a,b)=>a===b}});
  assert.equal(await otp.consumeEmailCode('a@b.cn','123456','bind-email','user'),true);
  assert.equal(query.purpose,'bind-email');assert.equal(query.userId,'user');
  assert.equal(await otp.consumeEmailCode('a@b.cn','123456','bind-email','user'),false);
});

function accountRoute(tx, options = {}) {
  const current = {id:'original', email:null, ...options.current};
  const db = {$transaction:fn=>fn(tx)};
  return load('src/app/api/auth/account/route.ts', {
    '@/lib/db':{getPrisma:()=>db},
    '@/lib/auth/config':{normalizeEmail:s=>s.trim().toLowerCase(), isValidEmail:s=>s.includes('@'), isValidPassword:s=>s.length>=8},
    '@/lib/auth/crypto':{hashPassword:async()=> 'password-hash'},
    '@/lib/auth/otp':{consumeEmailCode:async()=>options.validCode !== false},
    '@/lib/auth/http':{sessionCookieValue:async()=> 'session', jsonOk:body=>({status:200,...body}), jsonError:(error,status)=>({error,status})},
    '@/lib/auth/session':{readSessionUser:async()=>current, toAuthUser:u=>u, createUserSession:async()=> 'session', applySessionCookie:r=>r},
    '@/lib/auth/security':security,
  });
}
function accountRequest(body) {return new Request('https://www.narrativeos.cn/api/auth/account',{method:'POST',headers:{Origin:'https://www.narrativeos.cn','Content-Type':'application/json'},body:JSON.stringify(body)});}
test('email binding updates current user and creates email login identity', async () => {
  let change;
  const tx={user:{findUnique:async()=>null,update:async args=>{if(args.data.email){change=args;return {id:args.where.id,...args.data};}return {id:'original',email:null};}}};
  const response=await accountRoute(tx).POST(accountRequest({action:'bind-email',email:'NEW@EXAMPLE.COM',code:'123456'}));
  assert.equal(response.status,200);assert.equal(change.where.id,'original');assert.equal(change.data.email,'new@example.com');assert.equal(change.data.accounts.create.provider,'email');
});
test('occupied email is refused without changing identity', async () => {
  const tx={user:{update:async()=>({email:null}),findUnique:async()=>({id:'other'})}};
  const response=await accountRoute(tx).POST(accountRequest({action:'bind-email',email:'used@example.com',code:'123456'}));
  assert.equal(response.status,409);
});
test('password setup requires valid purpose-bound OTP and revokes prior sessions', async () => {
  let revoked=false, saved;
  const tx={user:{update:async args=>{if(args.data.passwordHash){saved=args;return {id:'original'};}return {email:'a@b.cn',emailVerifiedAt:new Date(),passwordHash:null};}},authSession:{deleteMany:async({where})=>{assert.equal(where.userId,'original');revoked=true;}}};
  const body=accountRequest({action:'set-password',code:'123456',password:'long-password'});
  const result=await accountRoute(tx,{current:{email:'a@b.cn'}}).POST(body);
  assert.equal(result.status,200);assert.equal(revoked,true);assert.equal(saved.where.id,'original');
  const denied=await accountRoute({}, {validCode:false}).POST(accountRequest({action:'bind-email',email:'a@b.cn',code:'123456'}));
  assert.equal(denied.status,400);
});

function oauthRoutes(options = {}) {
  let attempt, browser, used = false, identityCalls = 0;
  const db = {oAuthAttempt:{deleteMany:async()=>{},create:async({data})=>{attempt=data;},findUnique:async({where})=>where.id===attempt?.id ? attempt : null, updateMany:async()=>{if(used)return {count:0};used=true;return {count:1};}}};
  const redirect = url => ({url:String(url), headers:new Headers(), cookies:{set:(name,value)=>{if(value) browser=value;}}});
  let counter=0;
  const deps = {
    '@/lib/auth/redirect':redirects,
    '@/lib/content':{WORKBENCH_URL:'https://www.narrativeos.cn/narrativeos/'},
    'next/server':{NextResponse:{redirect}},
    'next/headers':{cookies:async()=>({get:()=>({value:options.wrongBrowser ? 'wrong' : browser})})},
    '@/lib/db':{getPrisma:()=>db},
    '@/lib/auth/crypto':{generateSessionId:()=>`nonce-${++counter}`,sha256:s=>`hash:${s}`,safeEqual:(a,b)=>a===b},
    '@/lib/auth/http':{sessionCookieValue:async()=> 'session',jsonError:(error,status)=>({error,status})},
    '@/lib/auth/session':{readSessionUser:async()=>options.current || null,createUserSession:async()=> 'token',toAuthUser:u=>u,applySessionCookie:r=>r},
    '@/lib/auth/security':security,
    '@/lib/auth/wechat':{wechatConfig:()=>({appid:'wx-app',redirect:'https://www.narrativeos.cn/api/auth/wechat/callback',origin:'https://www.narrativeos.cn'}),getWechatIdentity:async()=>{identityCalls++;return identity;},resolveWechatUser:async(_,id)=>({id:id || 'new-user'})},
  };
  return {start:load('src/app/api/auth/wechat/start/route.ts',deps),callback:load('src/app/api/auth/wechat/callback/route.ts',deps),options,
    request:()=>new Request(`https://www.narrativeos.cn/api/auth/wechat/callback?state=${attempt.id}&code=new-code`), count:()=>identityCalls,
    expire:()=>{attempt.expiresAt=new Date(0);}};
}
test('real OAuth routes share state, issue session and reject duplicate callback', async () => {
  const flow=oauthRoutes();
  const started=await flow.start.GET(new Request('https://www.narrativeos.cn/api/auth/wechat/start?next=%2Faccount'));
  assert.equal(new URL(started.url).searchParams.get('state'),'nonce-1');
  const callback=await flow.callback.GET(flow.request());
  assert.equal(callback.url,'https://www.narrativeos.cn/account');
  assert.match((await flow.callback.GET(flow.request())).url,/error=/);
  assert.equal(flow.count(),1);
});
test('OAuth refuses foreign browser and expired attempts before token exchange', async () => {
  for (const kind of ['wrongBrowser','expired']) {
    const flow=oauthRoutes({wrongBrowser:kind==='wrongBrowser'});
    await flow.start.GET(new Request('https://www.narrativeos.cn/api/auth/wechat/start'));
    if(kind==='expired')flow.expire();
    assert.match((await flow.callback.GET(flow.request())).url,/error=/);
    assert.equal(flow.count(),0);
  }
});
test('binding callback refuses a changed logged-in user', async () => {
  const flow=oauthRoutes({current:{id:'original'}});
  await flow.start.POST(new Request('https://www.narrativeos.cn/api/auth/wechat/start',{method:'POST',headers:{Origin:'https://www.narrativeos.cn'}}));
  flow.options.current={id:'other'};
  assert.match((await flow.callback.GET(flow.request())).url,/account\?error=/);
  assert.equal(flow.count(),0);
});

test('account settings renders appropriate binding and optional-password controls', () => {
  const React = require('react');
  const {renderToStaticMarkup} = require('react-dom/server');
  const Settings=load('src/components/account-settings.tsx', {
    react:React, 'react/jsx-runtime':require('react/jsx-runtime'),
    'next/link':({children,...props})=>React.createElement('a',props,children),
    'next/navigation':{useRouter:()=>({replace(){}})},
    '@narrativeos/ui/client':{authChangedEvent:'auth-changed'},
  }).default;
  const render=(email,providers,hasPassword)=>renderToStaticMarkup(React.createElement(Settings,{initialMessage:'',initialAccount:{user:{id:'same-id',email,providers},hasPassword}}));
  const wechatOnly=render(null,['wechat'],false);
  assert.match(wechatOnly,/验证并绑定邮箱/); assert.match(wechatOnly,/已绑定，可以扫码登录/);
  const emailOnly=render('a@b.cn',['email'],true);
  assert.match(emailOnly,/绑定微信/);assert.doesNotMatch(emailOnly,/确认密码/);
  const verified=render('a@b.cn',['email','wechat'],false);
  assert.match(verified,/设置密码是可选的/);assert.match(verified,/确认密码/);
});
