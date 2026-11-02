const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const context = { exports: {}, URL };
vm.runInNewContext(ts.transpileModule(fs.readFileSync(path.join(__dirname, '../src/lib/account-return.ts'), 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS },
}).outputText, context);
const valid = value => context.exports.safeAccountReturn(value, 'https://portal.example', 'https://forge.example/narrativeos/');
test('settings returns to the source page with query and fragment preserved', () => {
  assert.equal(valid('https://forge.example/narrativeos/jobs/job-one?edit=1#scene'), 'https://forge.example/narrativeos/jobs/job-one?edit=1#scene');
  assert.equal(valid('/teacher-ecosystem/?subject=math'), 'https://portal.example/teacher-ecosystem/?subject=math');
});
test('settings rejects external destinations, credentials and workbench path-prefix lookalikes', () => {
  for (const value of ['https://evil.example/', '//evil.example/', 'javascript:alert(1)', 'https://u:p@portal.example/', 'https://forge.example/narrativeos-evil/', 'https://forge.example/login']) assert.equal(valid(value), null);
});
test('settings does not return to itself or authentication/API endpoints', () => {
  for (const value of [null, '/account', '/account/?returnTo=x', '/login?next=x', '/api/auth/logout']) assert.equal(valid(value), null);
});
