const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { execFileSync } = require('node:child_process');

const manifestName = 'release-manifest.json';
function snapshot(root) {
  const files = {};
  // Text hashes use LF, so a Windows checkout and Linux build agree.
  for (const name of fs.readdirSync(root).sort()) {
    if (name === manifestName || name === 'package-lock.json' || !/\.(?:tsx?|css|png|cjs|json)$/.test(name)) continue;
    const filename = path.join(root, name);
    if (!fs.statSync(filename).isFile()) continue;
    const bytes = fs.readFileSync(filename);
    const content = name.endsWith('.png') ? bytes : bytes.toString('utf8').replace(/\r\n/g, '\n');
    files[name] = crypto.createHash('sha256').update(content).digest('hex');
  }
  return { version: JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8')).version, files };
}
function baseline(root, ref) {
  let gitRoot;
  try { gitRoot = execFileSync('git', ['rev-parse', '--show-toplevel'], { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim(); }
  catch { return null; }
  const relative = path.relative(gitRoot, path.join(root, manifestName)).split(path.sep).join('/');
  // Installed archives have no tracked source history. Their integrity is checked
  // against the embedded manifest instead, without requiring Git in Docker.
  if (relative.includes('node_modules/')) return null;
  try { execFileSync('git', ['rev-parse', '--verify', ref], { cwd: root, stdio: 'ignore' }); }
  catch { throw new Error(`Unknown release baseline: ${ref}`); }
  let text;
  try { text = execFileSync('git', ['show', `${ref}:${relative}`], { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }); }
  catch { return null; } // First release with a manifest.
  return JSON.parse(text);
}
function assertVersion(previous, current) {
  if (!previous || JSON.stringify(previous) === JSON.stringify(current)) return;
  const parse = version => {
    if (!/^\d+\.\d+\.\d+$/.test(version)) throw new Error(`Expected numeric release version: ${version}`);
    return version.split('.').map(Number);
  };
  const old = parse(previous.version), next = parse(current.version);
  const index = next.findIndex((part, i) => part !== old[i]);
  if (index === -1 || next[index] < old[index]) throw new Error('Shared UI changed without a higher version; bump the package version before releasing.');
}
function verify(root, previous) {
  const current = snapshot(root);
  const recorded = JSON.parse(fs.readFileSync(path.join(root, manifestName), 'utf8'));
  if (JSON.stringify(recorded) !== JSON.stringify(current)) throw new Error('Shared UI release manifest mismatch: code changed or files are missing. Bump the version and regenerate the release manifest.');
  assertVersion(previous, current);
  return current;
}
if (require.main === module) {
  try {
    const args = process.argv.slice(2), index = args.indexOf('--base-ref');
    if (index !== -1 && !args[index + 1]) throw new Error('--base-ref requires a Git revision');
    const ref = index === -1 ? 'HEAD' : args[index + 1];
    const previous = baseline(__dirname, ref);
    if (args.includes('--write')) {
      const current = snapshot(__dirname);
      assertVersion(previous, current);
      fs.writeFileSync(path.join(__dirname, manifestName), JSON.stringify(current, null, 2) + '\n');
    }
    const current = verify(__dirname, previous);
    console.log(`Verified @narrativeos/ui ${current.version}: ${Object.keys(current.files).length} files`);
  } catch (error) { console.error(error.message); process.exitCode = 1; }
}
module.exports = { snapshot, verify, assertVersion };
