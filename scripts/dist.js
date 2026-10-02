/**
 * 配布用 ZIP を作る。
 * Windows: x64 を 1 つ / macOS: Intel (x64) と Apple Silicon (arm64) を別々に作る。
 * macOS は最後に arm64 を作るので、release/mac-unpacked には arm64 版が残る。
 */
const { execSync } = require('child_process');
const path = require('path');

const scripts = __dirname;
const archs   = process.platform === 'darwin' ? ['x64', 'arm64'] : ['x64'];

for (const arch of archs) {
  const env = { ...process.env, TARGET_ARCH: arch };
  execSync(`node "${path.join(scripts, 'package.js')}"`,  { stdio: 'inherit', env });
  execSync(`node "${path.join(scripts, 'make-zip.js')}"`, { stdio: 'inherit', env });
}
